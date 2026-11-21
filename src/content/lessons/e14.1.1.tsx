import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceGraphViz } from "@/components/viz/TraceGraphViz";
import type { LessonContent } from "@/lib/types";

const TRACER = `class P:
    def __init__(self, g, i):
        self.g, self.i = g, i                              # the graph and this value's node index

    def _op(self, op, other):
        ref = other.i if isinstance(other, P) else ("const", other)
        self.g.append((op, self.i, ref))
        return P(self.g, len(self.g) - 1)

    def __add__(self, other):
        return self._op("add", other)

    def __mul__(self, other):
        return self._op("mul", other)

def trace(f, n_inputs):
    g = [("input", k, None) for k in range(n_inputs)]
    out = f(*[P(g, k) for k in range(n_inputs)])           # run f once on proxies
    return g, out.i

def run(g, out, inputs):
    vals = []
    for op, a, b in g:
        if op == "input":
            vals.append(inputs[a])
            continue
        y = b[1] if isinstance(b, tuple) else vals[b]
        vals.append(vals[a] + y if op == "add" else vals[a] * y)
    return vals[out]`;

const GUARDS = `def guard_key(args):
    key = []
    for a in args:
        if isinstance(a, list):
            key.append(("list", len(a)))                   # shapes are specialised
        elif isinstance(a, (bool, int)):
            key.append((type(a).__name__, a))              # Python scalars can steer control flow
        else:
            key.append((type(a).__name__,))
    return tuple(key)

def compiles_needed(calls):
    return len({guard_key(args) for args in calls})

def compile_steps(calls):
    seen, steps = set(), []
    for i, args in enumerate(calls):
        k = guard_key(args)
        if k not in seen:
            seen.add(k)
            steps.append(i)                                # this call misses the cache and compiles
    return steps`;

export const lesson: LessonContent = {
  id: "e14.1.1",
  minutes: 45,
  links: {
    requires: ["e9.6.1", "e5.1.2"],
    revisits: ["e5.5.2"],
    foreshadows: ["e14.1.2", "e14.4.2"],
  },

  puzzle: (
    <>
      <p>
        A compiler cannot optimise a program it cannot see, and a PyTorch model is a Python program: loops, branches,
        prints, dictionaries, calls into libraries. Yet <C>torch.compile</C> and <C>jax.jit</C> both hand a compiler a
        clean graph of tensor operations. Where does the Python go, and what happens when the next call would have taken
        a different path through it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Run the function once with stand-in values that record every tensor operation applied to them. Whatever ran is
        the graph; whatever Python did along the way, choosing a branch or counting a loop, is baked into it as a
        constant. The graph is only valid while those choices would be made the same way, so the capture also records
        guards: conditions on the inputs that are checked on every call, triggering a new capture when they fail.
      </p>
      <TraceGraphViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tracing">
        <p>
          A tracer calls the function on proxy objects that overload arithmetic. Each operation on a proxy appends a
          node to a graph, naming its operation and the nodes or constants it reads, and returns a new proxy for the
          result (<C>P</C>, <C>trace</C>). The graph is a straight-line program that can be replayed on real inputs
          without Python (<C>run</C>), and optimised, as the rest of this course does, before being replayed.
        </p>
        <Code>{TRACER}</Code>
      </Definition>

      <Theorem title="when a trace is faithful">
        <p>
          Suppose that, apart from operations on proxies, everything the function does depends only on quantities
          included in the guard key: shapes, Python scalars and types. Then for any inputs with the same guard key as the
          traced ones, replaying the graph gives the same result as running the function.
        </p>
      </Theorem>
      <Proof>
        <p>
          Run the function on the new inputs and on the traced inputs side by side. Every branch condition, loop count
          and non-tensor value is a function of guarded quantities, which agree, so both runs take the same path and
          issue the same sequence of tensor operations with the same constants. That sequence is exactly the recorded
          graph, so replaying it computes what the function would have. The assumption is what fails in practice: a
          branch on a tensor&apos;s value, a call to a random number generator, a read of a global that later changes.
          Tracing systems either guard on such things, refuse them, or stop the graph there.
        </p>
      </Proof>

      <Example title="two capture systems">
        <p>
          JAX traces with abstract values that carry only shape and dtype, so <C>if x &gt; 0</C> on a traced array raises
          an error; data-dependent control flow is written with <C>lax.cond</C> and <C>lax.scan</C>, which become graph
          operations, and Python values that should steer tracing are marked static. PyTorch&apos;s TorchDynamo instead
          intercepts Python bytecode as it executes, extracts runs of tensor operations into FX graphs, and inserts a{" "}
          graph break where it meets something it cannot capture, such as a print or a call to <C>.item()</C>: the
          unsupported code runs in ordinary Python between two compiled graphs.
        </p>
      </Example>

      <Remark title="guards and recompilation">
        <p>
          A compiled graph is stored under its guard key; a call with a new key misses the cache and triggers a new
          capture and compilation (<C>guard_key</C>, <C>compiles_needed</C>, <C>compile_steps</C>). Varying sequence
          lengths are the usual culprit. The remedies are to pad inputs to a few bucket sizes, which trades compilation
          for wasted computation on padding, or to mark dimensions as dynamic so that the graph is compiled once for
          symbolic sizes, with guards only on relations such as divisibility. Compilers also cap the number of
          specialisations of one function and fall back to running it uncompiled beyond the cap.
        </p>
        <Code>{GUARDS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "nodes",
      rung: "check",
      prompt: (
        <p>
          A function takes x, w and b and runs <C>x = tanh(x * w + b)</C> in a Python loop 12 times. Tracing records one
          node per input and one per operation. How many nodes does the traced graph have?
        </p>
      ),
      answer: { kind: "numeric", value: 39, tolerance: 0 },
    },
    {
      key: "keys",
      rung: "check",
      prompt: (
        <p>
          A compiled function receives sequences padded to multiples of 64 up to 2048, and a Python flag that is True
          during training and False during evaluation. Shapes and Python booleans are guarded. How many compilations
          can it need?
        </p>
      ),
      answer: { kind: "numeric", value: 64, tolerance: 0 },
    },
    {
      key: "branch",
      rung: "apply",
      prompt: (
        <p>
          A traced function contains <C>if loss.item() &gt; 10: loss = loss * 0.1</C>, and the example input had a loss
          of 3. What does the traced graph do on an input whose loss is 50?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Returns the unscaled loss, because the branch was not taken during tracing and a value is not guarded unless the system records it",
          "Scales the loss, because the graph contains both branches",
          "Raises an error in every tracing system",
          "Recompiles automatically in every tracing system",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class P:
    def __init__(self, g, i):
        self.g, self.i = g, i                              # the graph and this value's node index

    def _op(self, op, other):
        ref = other.i if isinstance(other, P) else ("const", other)
        self.g.append((op, self.i, ref))
        return P(self.g, len(self.g) - 1)

    def __add__(self, other):
        return self._op("add", other)

    def __mul__(self, other):
        return self._op("mul", other)

def trace(f, n_inputs):
    g = [("input", k, None) for k in range(n_inputs)]
    out = f(*[P(g, k) for k in range(n_inputs)])           # run f once on proxies
    return g, out.i

def run(g, out, inputs):
    vals = []
    for op, a, b in g:
        if op == "input":
            vals.append(inputs[a])
            continue
        y = b[1] if isinstance(b, tuple) else vals[b]
        vals.append(vals[a] + y if op == "add" else vals[a] * y)
    return vals[out]

g, out = trace(lambda x, w: x * w + 1, 2)
print(len(g), g[2], g[3], run(g, out, [3, 4]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 ('mul', 0, 1) ('add', 2, ('const', 1)) 13",
          "3 ('mul', 0, 1) ('add', 2, ('const', 1)) 13",
          "4 ('mul', 0, 1) ('add', 2, 1) 13",
          "4 ('mul', 0, 1) ('add', 2, ('const', 1)) 7",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def guard_key(args):
    key = []
    for a in args:
        if isinstance(a, list):
            key.append(("list", len(a)))                   # shapes are specialised
        elif isinstance(a, (bool, int)):
            key.append((type(a).__name__, a))              # Python scalars can steer control flow
        else:
            key.append((type(a).__name__,))
    return tuple(key)

def compiles_needed(calls):
    return len({guard_key(args) for args in calls})

def compile_steps(calls):
    seen, steps = set(), []
    for i, args in enumerate(calls):
        k = guard_key(args)
        if k not in seen:
            seen.add(k)
            steps.append(i)                                # this call misses the cache and compiles
    return steps

print(compile_steps([[[1, 2], True], [[3, 4], True], [[1, 2, 3], True], [[5, 6], False]]))
print(compiles_needed([[2.5], [3.5], [2], [3], [True]]), guard_key([[0] * 4, 1.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2, 3]\n4 (('list', 4), ('float',))",
          "[0, 2]\n4 (('list', 4), ('float',))",
          "[0, 1, 2, 3]\n4 (('list', 4), ('float',))",
          "[0, 2, 3]\n3 (('list', 4), ('float',))",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the proxy class <C>P</C> given in the starter, write <C>trace(f, n_inputs)</C>, which creates one input
          node per argument, calls f on proxies and returns the graph and the output&apos;s index, and{" "}
          <C>run(g, out, inputs)</C>, which replays the graph on real values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `class P:
    def __init__(self, g, i):
        self.g, self.i = g, i

    def _op(self, op, other):
        ref = other.i if isinstance(other, P) else ("const", other)
        self.g.append((op, self.i, ref))
        return P(self.g, len(self.g) - 1)

    def __add__(self, other):
        return self._op("add", other)

    def __mul__(self, other):
        return self._op("mul", other)

def trace(f, n_inputs):
    return [], 0

def run(g, out, inputs):
    return 0
`,
        solution: TRACER,
        tests: [
          { name: "trace", code: `g, out = trace(lambda a, b: (a + b) * (a + b), 2); assert g == [("input", 0, None), ("input", 1, None), ("add", 0, 1), ("add", 0, 1), ("mul", 2, 3)] and out == 4` },
          { name: "run", code: `g, out = trace(lambda a: a * 2 + a, 1); assert run(g, out, [7]) == 21 and run([("input", 0, None), ("mul", 0, ("const", 3))], 1, [5]) == 15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>guard_key(args)</C>, with (&quot;list&quot;, length) for lists, (type name, value) for booleans and
          integers, and (type name,) otherwise; <C>compiles_needed(calls)</C>, the number of distinct keys; and{" "}
          <C>compile_steps(calls)</C>, the indices of calls that miss the cache.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def guard_key(args):
    return ()

def compiles_needed(calls):
    return 1

def compile_steps(calls):
    return [0]
`,
        solution: GUARDS,
        tests: [
          { name: "key", code: `assert guard_key([[1, 2], True, 3, 0.5, "x"]) == (("list", 2), ("bool", True), ("int", 3), ("float",), ("str",))` },
          { name: "cache", code: `assert compiles_needed([[1], [2], [1.0], [[1]], [[2]], [[1, 1]]]) == 5 and compile_steps([[1], [1], [2], [1], [3]]) == [0, 2, 4]` },
        ],
      },
    },
    {
      key: "padding",
      rung: "stretch",
      prompt: (
        <p>
          Sequence lengths are uniform on 1 to 2048 and are padded up to the next multiple of 256, so the function
          compiles 8 times. Taking compute as proportional to padded length, what fraction of it is spent on padding, to
          four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1107, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The captured graph is a list of tuples. The next lesson asks what a compiler&apos;s graph should look like, and
        why most compilers use several of them.
      </p>
    </>
  ),
};
