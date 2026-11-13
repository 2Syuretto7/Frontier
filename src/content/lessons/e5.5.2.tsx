import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DispatchViz } from "@/components/viz/DispatchViz";
import type { LessonContent } from "@/lib/types";

const BASE = `ORDER = ["bool", "int32", "int64", "float16", "float32", "float64"]

class Arr:
    def __init__(self, data, dtype="float32", device="cpu"):
        self.data, self.dtype, self.device = list(data), dtype, device

def cast(a, dtype):
    conv = bool if dtype == "bool" else int if dtype.startswith("int") else float
    return Arr([conv(v) for v in a.data], dtype, a.device)
`;

const DISPATCH = `KERNELS = {}

def register(op, device, dtype):
    def deco(fn):
        KERNELS[(op, device, dtype)] = fn
        return fn
    return deco

def dispatch(op, *args):
    devices = {a.device for a in args}
    if len(devices) > 1:
        raise RuntimeError(f"{op}: tensors on different devices {sorted(devices)}")
    dtype = max((a.dtype for a in args), key=ORDER.index)
    key = (op, args[0].device, dtype)
    if key not in KERNELS:
        raise NotImplementedError(f"no kernel for {key}")
    out = KERNELS[key](*[cast(a, dtype) for a in args])
    return Arr(out, dtype, args[0].device)
`;

const FALLBACK = `def result_dtype(*dtypes):
    return max(dtypes, key=ORDER.index)

def dispatch_with_fallback(op, *args):
    dtype = result_dtype(*(a.dtype for a in args))
    device = args[0].device
    if (op, device, dtype) in KERNELS:
        return dispatch(op, *args), 0
    moved = [Arr(a.data, a.dtype, "cpu") for a in args]
    out = dispatch(op, *moved)
    return Arr(out.data, out.dtype, device), len(args) + 1
`;

export const lesson: LessonContent = {
  id: "e5.5.2",
  minutes: 50,
  links: {
    requires: ["e5.5.1", "e1.3.2"],
    revisits: ["e2.3.1", "e5.4.2"],
    foreshadows: ["e5.5.3"],
  },

  puzzle: (
    <>
      <p>
        <C>a + b</C> looks like one operation. In a real framework it might run one of dozens of kernels: integer or float,
        16, 32 or 64 bits, CPU or GPU, contiguous or strided. Somewhere a decision is made, on every call, about which code to
        run, or whether to refuse. What information decides it, and how can that decision stay fast and extensible as
        operations and devices are added?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep a table from (operation, device, dtype) to a kernel. Each call first checks that all inputs are on the same
        device, then promotes their dtypes to a common one, then looks the key up. Adding a kernel is one registration, with
        no edits to existing code; a missing combination is a clear error rather than a silent slow path.
      </p>
      <DispatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a kernel registry">
        <p>
          The model array carries data, a dtype and a device. A decorator registers a kernel under its key; dispatch checks
          devices, promotes, casts the inputs and calls the kernel.
        </p>
        <Code>{`${BASE}
${DISPATCH}`}</Code>
      </Definition>

      <Theorem title="promotion by a total order is order-independent">
        <p>
          If the result dtype of combining two operands is the larger of the two in a fixed total order, then the result dtype
          of any expression combining operands d₁, …, dₙ, in any grouping and any argument order, is max(d₁, …, dₙ).
        </p>
      </Theorem>
      <Proof>
        <p>
          In a total order, max is commutative and associative: max(a, b) = max(b, a) and max(max(a, b), c) = max(a, max(b,
          c)), since both sides equal the largest of the elements involved. By induction on the size of the expression, any
          bracketing and ordering of n operands gives the largest of all n. So <C>(a + b) + c</C> and <C>a + (c + b)</C> have
          the same dtype. The order bool &lt; int32 &lt; int64 &lt; float16 &lt; float32 &lt; float64 places every float above
          every integer, so an int64 combined with a float16 gives float16, as in PyTorch.
        </p>
      </Proof>

      <Example title="fallbacks">
        <p>
          A framework can choose to cover gaps by moving data: if a GPU has no kernel for an operation, copy the inputs to the
          CPU, run the CPU kernel, and copy the result back. It works, but each copy crosses the bus, so a fallback that fires
          inside a training loop can make it many times slower. Counting the copies makes the cost visible.
        </p>
        <Code>{FALLBACK}</Code>
      </Example>

      <Remark title="PyTorch's dispatcher">
        <p>
          PyTorch&rsquo;s dispatcher keys on more than device and dtype: a set of dispatch keys also covers autograd, tracing,
          batching and more, each a layer that can intercept the call before it reaches a backend kernel. The autograd layer
          records the graph node and then redispatches to the real kernel. The design is the same table lookup, done in
          layers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "promote",
      rung: "check",
      prompt: <p>Under the order bool &lt; int32 &lt; int64 &lt; float16 &lt; float32 &lt; float64, what is the result dtype of int64 + float16?</p>,
      answer: { kind: "choice", options: ["float16", "int64", "float32", "float64"], correct: [0] },
    },
    {
      key: "keys",
      rung: "check",
      prompt: <p>A framework has 3 operations, 2 devices and 3 dtypes, with a kernel for every combination. How many entries does its table hold?</p>,
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "device",
      rung: "apply",
      prompt: <p>One input is on the CPU and the other on the GPU. What should dispatch do?</p>,
      answer: {
        kind: "choice",
        options: [
          "Raise an error: moving data between devices is slow and must be explicit",
          "Silently copy the GPU tensor to the CPU",
          "Silently copy the CPU tensor to the GPU",
          "Run the CPU kernel on the GPU memory",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${BASE}
${DISPATCH}
@register("add", "cpu", "float32")
def add_f32(a, b):
    return [x + y for x, y in zip(a.data, b.data)]

@register("add", "cpu", "int32")
def add_i32(a, b):
    return [x + y for x, y in zip(a.data, b.data)]

x = Arr([1, 2], "int32")
y = Arr([0.5, 0.25], "float32")
r = dispatch("add", x, y)
s = dispatch("add", x, x)
try:
    dispatch("add", x, Arr([1, 1], "int32", "gpu"))
    msg = "ok"
except RuntimeError:
    msg = "RuntimeError"
print(r.dtype, r.data, s.dtype, s.data, msg)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "float32 [1.5, 2.25] int32 [2, 4] RuntimeError",
          "int32 [1, 2] int32 [2, 4] RuntimeError",
          "float32 [1.5, 2.25] float32 [2.0, 4.0] RuntimeError",
          "float32 [1.5, 2.25] int32 [2, 4] ok",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${BASE}
${DISPATCH}
@register("add", "cpu", "int32")
def add_i32(a, b):
    return [x + y for x, y in zip(a.data, b.data)]

@register("add", "cpu", "int32")
def add_i32_v2(a, b):
    return [x + y + 100 for x, y in zip(a.data, b.data)]

x = Arr([1, 2], "int32")
print(dispatch("add", x, x).data, len(KERNELS), KERNELS[("add", "cpu", "int32")].__name__)`}</Code>
          <p>The same key registered twice. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[102, 104] 1 add_i32_v2", "[2, 4] 2 add_i32", "[102, 104] 2 add_i32_v2", "[2, 4] 1 add_i32"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          <C>ORDER</C>, <C>Arr</C> and <C>cast</C> are already defined. Write the dictionary <C>KERNELS</C>, a decorator
          factory <C>register(op, device, dtype)</C> that stores the function and returns it unchanged, and{" "}
          <C>dispatch(op, *args)</C>: raise <C>RuntimeError</C> if the devices differ, promote to the largest dtype in{" "}
          <C>ORDER</C>, raise <C>NotImplementedError</C> if no kernel is registered, otherwise call the kernel on the cast
          inputs and wrap its list result in an Arr of that dtype and device.
        </p>
      ),
      answer: {
        kind: "code",
        setup: BASE,
        starter: `# ORDER, Arr and cast are already defined.

KERNELS = {}

def register(op, device, dtype):
    def deco(fn):
        return fn
    return deco

def dispatch(op, *args):
    return args[0]
`,
        solution: DISPATCH,
        tests: [
          { name: "registration and promotion", code: `@register("mul", "cpu", "float64")
def mul64(a, b):
    return [x * y for x, y in zip(a.data, b.data)]
assert KERNELS[("mul", "cpu", "float64")] is mul64 and mul64.__name__ == "mul64"
r = dispatch("mul", Arr([1, 2], "int32"), Arr([0.5, 3.0], "float64"))
assert r.dtype == "float64" and r.device == "cpu" and r.data == [0.5, 6.0]
assert all(isinstance(v, float) for v in r.data)` },
          { name: "errors", code: `@register("neg", "gpu", "float32")
def neg(a):
    return [-x for x in a.data]
assert dispatch("neg", Arr([1.0], "float32", "gpu")).data == [-1.0]
for bad in (lambda: dispatch("neg", Arr([1], "int32", "gpu")), lambda: dispatch("neg", Arr([1.0], "float32", "cpu"))):
    try:
        bad()
        raise AssertionError("expected NotImplementedError")
    except NotImplementedError:
        pass
try:
    dispatch("mul", Arr([1.0], "float32", "cpu"), Arr([1.0], "float32", "gpu"))
    raise AssertionError("expected RuntimeError")
except RuntimeError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the registry and dispatch defined, write <C>result_dtype(*dtypes)</C> and{" "}
          <C>dispatch_with_fallback(op, *args)</C>, which assumes all inputs share one device: if a kernel exists for that
          device and the promoted dtype, dispatch normally and report 0 copies; otherwise move the inputs to the CPU, dispatch
          there, move the result back, and report the number of copies (one per input plus one for the result). Return
          (result, copies).
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${BASE}
${DISPATCH}`,
        starter: `# ORDER, Arr, cast, KERNELS, register and dispatch are already defined.

def result_dtype(*dtypes):
    return dtypes[0]

def dispatch_with_fallback(op, *args):
    return dispatch(op, *args), 0
`,
        solution: FALLBACK,
        tests: [
          { name: "promotion", code: `assert result_dtype("int64", "float16") == "float16"
assert result_dtype("bool", "int32", "bool") == "int32"
assert result_dtype("float32", "int64", "float64", "int32") == "float64"` },
          { name: "fallback counts copies", code: `@register("sub", "cpu", "float32")
def sub(a, b):
    return [x - y for x, y in zip(a.data, b.data)]
@register("sub", "gpu", "float32")
def sub_gpu(a, b):
    return [x - y for x, y in zip(a.data, b.data)]
r, c = dispatch_with_fallback("sub", Arr([3.0], "float32", "gpu"), Arr([1.0], "float32", "gpu"))
assert c == 0 and r.device == "gpu" and r.data == [2.0]
@register("sqr", "cpu", "float32")
def sqr(a):
    return [x * x for x in a.data]
r, c = dispatch_with_fallback("sqr", Arr([3.0, 4.0], "float32", "gpu"))
assert c == 2 and r.device == "gpu" and r.dtype == "float32" and r.data == [9.0, 16.0], (c, r.device, r.dtype, r.data)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose the dtype of a binary operation is the larger of its operands&rsquo; dtypes in a fixed total order. Prove
          that every way of combining operands d₁, …, dₙ (any bracketing, any order) produces the dtype max(d₁, …, dₙ).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that max in a total order is commutative and associative (each side equals the largest element involved).",
          "Uses induction on the number of operands or on the expression tree: an expression's dtype is the max of its two sub-expressions' dtypes, each the max of its own operands.",
          "Concludes that the result is the max over all operands, independent of bracketing and order.",
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: <p>What is the largest finite float16 value?</p>,
      answer: { kind: "numeric", value: 65504 },
    },
  ],

  teachBack:
    "Explain to a friend how a framework chooses a kernel for a + b, why it refuses to mix devices, how dtype promotion works, and what a fallback costs.",

  glimpse: (
    <p>
      The table has a column for the GPU, but no kernels in it yet. Next, a first look at a GPU backend: thousands of threads,
      a grid of blocks, and why the same elementwise add looks so different there.
    </p>
  ),
};
