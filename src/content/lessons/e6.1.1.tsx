import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LaunchQueueViz } from "@/components/viz/LaunchQueueViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

x = torch.randn(4096, 4096)                 # float32 on the CPU
xg = x.to("cuda", non_blocking=True)        # copy over PCIe
w = torch.randn(4096, 4096, device="cuda", dtype=torch.bfloat16)
y = xg.to(torch.bfloat16) @ w               # both on the GPU, both bfloat16
print(y.device, y.dtype)                    # cuda:0 torch.bfloat16

loss = y.float().pow(2).mean()
value = loss.item()                         # waits for the GPU: a sync point

(torch.ones(3, dtype=torch.int32) + 2.5).dtype           # torch.float32
(torch.ones(3, dtype=torch.float16) + torch.tensor(1.0, dtype=torch.float64)).dtype  # torch.float16`;

const PROMOTE = `CAT = {"bool": 0, "uint8": 1, "int8": 1, "int16": 1, "int32": 1, "int64": 1,
       "float16": 2, "bfloat16": 2, "float32": 2, "float64": 2}
SIZE = {"bool": 1, "uint8": 1, "int8": 1, "int16": 2, "int32": 4, "int64": 8,
        "float16": 2, "bfloat16": 2, "float32": 4, "float64": 8}

def promote_types(a, b):
    if a == b:
        return a
    if CAT[a] != CAT[b]:
        return a if CAT[a] > CAT[b] else b
    if {a, b} == {"float16", "bfloat16"}:
        return "float32"
    if "uint8" in (a, b) and CAT[a] == 1:
        other = b if a == "uint8" else a
        return {"int8": "int16"}.get(other, other)
    return a if SIZE[a] > SIZE[b] else b

def result_type(operands):
    groups = {k: [d for d, kind in operands if kind == k] for k in ("tensor", "zerodim", "scalar")}
    out = None
    for kind in ("tensor", "zerodim", "scalar"):
        if not groups[kind]:
            continue
        r = groups[kind][0]
        for d in groups[kind][1:]:
            r = promote_types(r, d)
        if kind == "scalar":
            r = {0: "bool", 1: "int64", 2: "float32"}[CAT[r]]
        if out is None or CAT[r] > CAT[out]:
            out = r
    return out`;

const TIMING = `def transfer_ms(nbytes, gb_per_s, latency_us=10.0):
    return latency_us / 1000 + nbytes / (gb_per_s * 1e9) * 1000

def timeline(ops, launch_us=5.0):
    cpu = gpu = 0.0
    for op in ops:
        if op == "sync":
            cpu = max(cpu, gpu)
        else:
            cpu += launch_us
            gpu = max(gpu, cpu) + op
    return max(cpu, gpu)`;

export const lesson: LessonContent = {
  id: "e6.1.1",
  minutes: 45,
  links: {
    requires: ["e5.5.3", "e3.1.2"],
    revisits: ["m11.1.4"],
    foreshadows: ["e6.1.2", "e6.4.1"],
  },

  puzzle: (
    <>
      <p>
        A training loop runs at 40% GPU utilisation. Deleting one innocent line, which prints the loss every step, takes it to
        95%, though printing a number costs microseconds. In another script, adding a half-precision tensor to a
        double-precision scalar tensor quietly produces a half-precision result, while adding it to a double-precision vector
        produces double. Both surprises come from rules that PyTorch applies silently. What are they?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A PyTorch tensor carries a device and a dtype as well as a shape. The device says whose memory holds it, the CPU&apos;s
        or a particular GPU&apos;s, and operations require their inputs to share one. GPU operations are asynchronous: the
        Python call only places a kernel in a queue and returns, so the CPU can run ahead while the GPU works. Anything that
        needs a result back on the CPU, such as printing a value, forces the CPU to wait for the queue to drain. Dtypes follow
        promotion rules that look at the category of each operand and whether it is a full tensor, a zero-dimensional tensor
        or a Python number.
      </p>
      <LaunchQueueViz />
    </>
  ),

  theory: (
    <>
      <Definition title="device, dtype and transfers">
        <p>
          Every tensor lives on one device and has one dtype; operations on tensors from different devices raise an error
          instead of copying implicitly. <C>.to(device)</C> copies across the bus: about 25 GB/s each way over PCIe 4.0 x16,
          against about 2000 GB/s from GPU memory to the GPU&apos;s own cores. A copy of b bytes costs roughly a fixed latency plus
          b over the bandwidth, so many small copies are dominated by latency and one large copy by bandwidth.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Definition title="asynchronous execution and sync points">
        <p>
          CUDA operations are enqueued on a stream and executed in order on the GPU, while the Python thread continues. The
          CPU blocks only at a synchronisation: <C>.item()</C>, <C>.cpu()</C>, <C>print</C> of a CUDA tensor, a data-dependent
          shape such as <C>nonzero()</C>, or an explicit <C>torch.cuda.synchronize()</C>. Timing GPU code without a sync before
          reading the clock measures only the launch.
        </p>
      </Definition>

      <Theorem title="when launches, not kernels, set the pace">
        <p>
          With launch cost ℓ per kernel, kernel times <M>{"k_1, \\dots, k_n"}</M> and no sync, the GPU finishes at time at least{" "}
          <M>{"\\max(n\\ell, \\ell + \\sum_i k_i)"}</M>. If every kernel is shorter than ℓ the total is <M>{"n\\ell + k_n"}</M>,
          set by the CPU; with a sync after every kernel it is <M>{"\\sum_i (\\ell + k_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Kernel i cannot start before its launch completes at time <M>{"i\\ell"}</M>, nor before kernel i − 1 ends. The first
          bound follows by looking at the last launch and at the GPU&apos;s busy time from the first launch. If every{" "}
          <M>{"k_i < \\ell"}</M>, each kernel finishes before the next launch completes, so kernel i runs from <M>{"i\\ell"}</M> to{" "}
          <M>{"i\\ell + k_i"}</M> and the last ends at <M>{"n\\ell + k_n"}</M>. A sync after each kernel makes the next launch start
          only when the kernel ends, so the launch and kernel times add. This is why fusing small operations and capturing
          launches in CUDA graphs both matter.
        </p>
        <Code>{TIMING}</Code>
      </Proof>

      <Definition title="type promotion">
        <p>
          Dtypes fall into categories bool &lt; integer &lt; floating. Operands are grouped into dimensioned tensors,
          zero-dimensional tensors and Python numbers, in decreasing priority. The result takes the promoted dtype of the
          highest-priority group, unless a lower-priority group has a strictly higher category: then a zero-dimensional
          tensor contributes its own dtype and a Python number the default dtype of its category (float32 for floats, int64
          for integers). Within a category, the larger type wins; float16 with bfloat16 gives float32, and uint8 with int8
          gives int16.
        </p>
        <Code>{PROMOTE}</Code>
      </Definition>

      <Example title="reading the rules">
        <p>
          A float16 tensor plus a float64 zero-dimensional tensor stays float16, since the scalar is not of a higher category:
          the rule keeps a low-precision model from being silently upcast by a constant. An int32 tensor plus 2.5 becomes
          float32, and plus a float64 zero-dimensional tensor becomes float64. In the figure, 8 kernels of 20 µs take 165 µs
          without syncs and 200 µs with a sync each step; 8 kernels of 1 µs take 41 µs either way, with the GPU idle 80% of the
          time.
        </p>
      </Example>

      <Remark title="pinned memory and overlap">
        <p>
          Host-to-device copies from ordinary pageable memory are staged through a pinned buffer and block the CPU. Allocating
          the source in pinned memory, as <C>DataLoader(pin_memory=True)</C> does, lets <C>non_blocking=True</C> copies run
          asynchronously and overlap with computation on another stream. Keep tensors on the GPU across steps, move data once
          per batch, and read scalars back only every few hundred steps.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: <p>How many MiB does a 4096 × 4096 bfloat16 tensor occupy?</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0.001 },
    },
    {
      key: "copy",
      rung: "check",
      prompt: <p>How many milliseconds does copying 1 GiB take at 25 GB/s with a fixed latency of 10 µs?</p>,
      answer: { kind: "numeric", value: 42.96, tolerance: 0.01 },
    },
    {
      key: "item",
      rung: "apply",
      prompt: <p>Why does calling <C>loss.item()</C> every step slow down a GPU training loop with large kernels?</p>,
      answer: {
        kind: "choice",
        options: [
          "Converting a tensor to a Python float is expensive arithmetic",
          "It forces the CPU to wait for all queued GPU work, so the next step&apos;s launches cannot overlap with this step&apos;s kernels",
          "It copies the whole model to the CPU",
          "It disables asynchronous execution for the rest of training",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`CAT = {"bool": 0, "uint8": 1, "int8": 1, "int16": 1, "int32": 1, "int64": 1,
       "float16": 2, "bfloat16": 2, "float32": 2, "float64": 2}
SIZE = {"bool": 1, "uint8": 1, "int8": 1, "int16": 2, "int32": 4, "int64": 8,
        "float16": 2, "bfloat16": 2, "float32": 4, "float64": 8}

def promote_types(a, b):
    if a == b:
        return a
    if CAT[a] != CAT[b]:
        return a if CAT[a] > CAT[b] else b
    if {a, b} == {"float16", "bfloat16"}:
        return "float32"
    if "uint8" in (a, b) and CAT[a] == 1:
        other = b if a == "uint8" else a
        return {"int8": "int16"}.get(other, other)
    return a if SIZE[a] > SIZE[b] else b

def result_type(operands):
    groups = {k: [d for d, kind in operands if kind == k] for k in ("tensor", "zerodim", "scalar")}
    out = None
    for kind in ("tensor", "zerodim", "scalar"):
        if not groups[kind]:
            continue
        r = groups[kind][0]
        for d in groups[kind][1:]:
            r = promote_types(r, d)
        if kind == "scalar":
            r = {0: "bool", 1: "int64", 2: "float32"}[CAT[r]]
        if out is None or CAT[r] > CAT[out]:
            out = r
    return out

print(promote_types("int8", "uint8"), promote_types("float16", "bfloat16"), promote_types("int64", "float16"), promote_types("bool", "int8"))
print(result_type([("float16", "tensor"), ("float64", "zerodim")]), result_type([("int32", "tensor"), ("float64", "scalar")]), result_type([("int32", "tensor"), ("float64", "zerodim")]), result_type([("uint8", "tensor"), ("int64", "scalar")]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "int16 float32 float16 int8\nfloat16 float32 float64 uint8",
          "uint8 float16 float16 int8\nfloat16 float32 float64 uint8",
          "int16 float32 float16 int8\nfloat64 float32 float64 int64",
          "int16 float32 float16 int8\nfloat16 float64 float32 uint8",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def transfer_ms(nbytes, gb_per_s, latency_us=10.0):
    return latency_us / 1000 + nbytes / (gb_per_s * 1e9) * 1000

def timeline(ops, launch_us=5.0):
    cpu = gpu = 0.0
    for op in ops:
        if op == "sync":
            cpu = max(cpu, gpu)
        else:
            cpu += launch_us
            gpu = max(gpu, cpu) + op
    return max(cpu, gpu)

print(round(transfer_ms(4 * 2 ** 30, 25), 2), round(transfer_ms(4, 25), 4))
print(timeline([20.0] * 10), timeline([20.0, "sync"] * 10), timeline([1.0] * 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "171.81 0.01\n205.0 250.0 51.0",
          "171.8 0.01\n200.0 250.0 50.0",
          "171.81 0.01\n250.0 205.0 51.0",
          "160.0 0.0\n205.0 250.0 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given tables, write <C>promote_types(a, b)</C> for two dtype names and <C>result_type(operands)</C> for a
          list of (dtype, kind) pairs with kind &quot;tensor&quot;, &quot;zerodim&quot; or &quot;scalar&quot;, following the rules
          in the definition. Python numbers are passed as &quot;bool&quot;, &quot;int64&quot; or &quot;float64&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `CAT = {"bool": 0, "uint8": 1, "int8": 1, "int16": 1, "int32": 1, "int64": 1,
       "float16": 2, "bfloat16": 2, "float32": 2, "float64": 2}
SIZE = {"bool": 1, "uint8": 1, "int8": 1, "int16": 2, "int32": 4, "int64": 8,
        "float16": 2, "bfloat16": 2, "float32": 4, "float64": 8}

def promote_types(a, b):
    return a

def result_type(operands):
    return operands[0][0]
`,
        solution: PROMOTE,
        tests: [
          { name: "pairs", code: `assert promote_types("int32", "int64") == "int64" and promote_types("uint8", "int8") == "int16" and promote_types("uint8", "int32") == "int32" and promote_types("bfloat16", "float16") == "float32"
assert promote_types("int64", "bfloat16") == "bfloat16" and promote_types("bool", "uint8") == "uint8" and promote_types("float32", "float32") == "float32"` },
          { name: "groups", code: `assert result_type([("bfloat16", "tensor"), ("float32", "zerodim"), ("float64", "scalar")]) == "bfloat16"
assert result_type([("int16", "tensor"), ("bool", "tensor"), ("float64", "scalar")]) == "float32" and result_type([("int8", "tensor"), ("int64", "scalar")]) == "int8"
assert result_type([("bool", "tensor"), ("int16", "zerodim"), ("float64", "scalar")]) == "float32" and result_type([("bool", "tensor"), ("int16", "zerodim")]) == "int16" and result_type([("float64", "zerodim"), ("float16", "zerodim")]) == "float64"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>transfer_ms(nbytes, gb_per_s, latency_us)</C> and <C>timeline(ops, launch_us)</C>, where ops is a list of
          kernel durations in microseconds and the string &quot;sync&quot;, returning when both CPU and GPU are done, as in the
          theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def transfer_ms(nbytes, gb_per_s, latency_us=10.0):
    return 0.0

def timeline(ops, launch_us=5.0):
    return 0.0
`,
        solution: TIMING,
        tests: [
          { name: "transfer", code: `assert abs(transfer_ms(25e9, 25, 0) - 1000) < 1e-9 and abs(transfer_ms(0, 25, 10) - 0.01) < 1e-12 and abs(transfer_ms(5e6, 50) - 0.11) < 1e-9` },
          { name: "timeline", code: `assert timeline([3.0] * 100) == 503 and timeline([30.0, 30.0]) == 65 and timeline([30.0, "sync", 30.0]) == 70 and timeline(["sync"]) == 0 and timeline([2.0, 2.0], 1.0) == 5` },
        ],
      },
    },
    {
      key: "tiny",
      rung: "stretch",
      prompt: (
        <p>
          A loop launches 100 kernels of 3 µs each with a launch cost of 5 µs and no sync. When does the last kernel finish, in
          microseconds?
        </p>
      ),
      answer: { kind: "numeric", value: 503, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The device and dtype say where a tensor lives and how each number is stored. The next lesson looks at how the numbers
        are laid out, which decides whether reshaping or transposing a tensor costs nothing or a full copy.
      </p>
    </>
  ),
};
