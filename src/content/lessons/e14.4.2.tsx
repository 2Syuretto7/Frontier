import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphBreakViz } from "@/components/viz/GraphBreakViz";
import type { LessonContent } from "@/lib/types";

const DYNAMO = `def split_graphs(ops, supported):
    graphs, cur = [], []
    for op in ops:
        if op in supported:
            cur.append(op)
        else:                                              # graph break: this op runs in Python
            if cur:
                graphs.append(cur)
            cur = []
    if cur:
        graphs.append(cur)
    return graphs

def compile_count(sizes):
    seen, dynamic, n = set(), False, 0
    for s in sizes:
        if s in seen or (dynamic and s > 1):
            continue                                       # a cached program's guards pass
        n += 1
        if s > 1 and any(t > 1 for t in seen):
            dynamic = True                                 # second size: recompile with a symbolic size
        else:
            seen.add(s)                                    # sizes 0 and 1 are always specialised
    return n

def launch_us(ops, supported, per_launch, cuda_graphs):
    graphs = split_graphs(ops, supported)
    eager = len(ops) - sum(len(g) for g in graphs)
    kernels = len(graphs) if cuda_graphs else sum(len(g) for g in graphs)
    return (kernels + eager) * per_launch`;

const PARTITION = `CHEAP = {"add", "sub", "mul", "relu", "gelu", "exp"}

def to_save(ops):
    # node 0 is the input and op i produces node i + 1; the backward pass needs nodes 0 .. n - 1
    return [0] + [i + 1 for i, op in enumerate(ops[:-1]) if op not in CHEAP]

def saved_bytes(ops, sizes, recompute):
    keep = to_save(ops) if recompute else range(len(ops))
    return sum(sizes[i] for i in keep)

def recompute_flops(ops, flops):
    return sum(f for op, f in zip(ops[:-1], flops) if op in CHEAP)`;

export const lesson: LessonContent = {
  id: "e14.4.2",
  minutes: 45,
  links: {
    requires: ["e14.4.1"],
    revisits: ["e14.1.1", "e14.3.2", "e9.3.3", "e7.1.3"],
    foreshadows: ["e14.4.3"],
  },

  puzzle: (
    <>
      <p>
        PyTorch programs are ordinary Python: they branch on tensor values, call <C>print</C>, append to lists and
        change shape from one batch to the next. XLA wants a static graph. Yet a single call to{" "}
        <C>torch.compile</C> speeds up most models without changing a line of them. What does it capture, what does it
        leave to Python, and how does it decide when a compiled program can be reused?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        PyTorch 2 compiles in three stages. TorchDynamo watches the Python bytecode run and records the tensor
        operations into a graph, inserting guards that check the assumptions it made. Where it meets something it cannot
        trace, it breaks the graph, lets Python run that part, and starts a new graph after it. AOTAutograd turns each
        forward graph into a joint forward and backward graph and splits it, deciding what to keep for the backward
        pass. TorchInductor then fuses and schedules the operations and generates Triton kernels for the GPU.
      </p>
      <GraphBreakViz />
    </>
  ),

  theory: (
    <>
      <Definition title="graph capture with guards">
        <p>
          TorchDynamo hooks CPython&apos;s frame evaluation and symbolically runs each frame&apos;s bytecode, recording
          tensor operations into an FX graph (<C>split_graphs</C>). An unsupported operation, such as a data-dependent
          branch, a call to <C>.item()</C> or <C>print</C>, causes a graph break: the graph so far is compiled, the
          operation runs in Python, and capture resumes afterwards. Each compiled graph carries guards on the
          properties it assumed, such as dtypes, devices, the identity of modules and the input sizes; a later call
          reuses the program only if every guard passes, and otherwise compiles again, as in e14.1.1.
        </p>
      </Definition>

      <Definition title="automatic dynamic shapes">
        <p>
          On the first call, sizes are specialised to their values. When a guard fails because a size changed, the
          dimension is marked dynamic and the graph is compiled again with a symbolic size, so later sizes reuse it.
          Sizes 0 and 1 are always specialised, because broadcasting and empty tensors behave differently for them
          (<C>compile_count</C>). Launch overhead is a separate cost: each kernel launch costs a few microseconds of CPU
          time, and CUDA graphs record a whole captured graph so it can be replayed with a single launch{" "}
          (<C>launch_us</C>, which counts one kernel per captured operation and ignores fusion).
        </p>
        <Code>{DYNAMO}</Code>
      </Definition>

      <Definition title="AOTAutograd and the min-cut partition">
        <p>
          AOTAutograd traces the backward pass ahead of time, producing a joint graph, and partitions it into a forward
          graph and a backward graph. Every value the backward needs must either be saved by the forward or recomputed
          from saved values. The default partitioner solves a minimum cut that favours saving the outputs of expensive
          operations such as matrix products and recomputing cheap elementwise ones, which are fused into the backward
          kernels at little cost. In a chain (<C>to_save</C>, <C>saved_bytes</C>, <C>recompute_flops</C>), the input and
          the outputs of expensive operations are saved and the rest are recomputed.
        </p>
        <Code>{PARTITION}</Code>
      </Definition>

      <Theorem title="recomputation never increases memory traffic in a fused chain">
        <p>
          Suppose a run of cheap elementwise operations sits between a saved value and the next expensive operation,
          and the backward pass fuses their recomputation into the kernel that consumes them. Then recomputing instead
          of saving removes one write in the forward pass and one read in the backward pass for each recomputed
          intermediate, and adds no memory traffic.
        </p>
      </Theorem>
      <Proof>
        <p>
          Saving an intermediate costs a write when it is produced and a read when the backward uses it. When it is
          recomputed inside the fused backward kernel, that kernel already reads the saved value at the start of the
          run, from which the intermediate is produced in registers, so no extra bytes move. The cost is the
          arithmetic of the cheap operations, which is small next to the memory saved because elementwise operations
          have low arithmetic intensity, as in e7.1.3.
        </p>
      </Proof>

      <Example title="from graph to Triton">
        <p>
          Inductor lowers each FX graph into a loop-level IR in which every operation is a function computing one
          element from indices, so fusion is composing these functions. Its scheduler groups nodes that share an
          iteration space, makes pointwise and reduction kernels, and generates Triton code (e9.3.3), with names such as{" "}
          <C>triton_poi_fused_add_mul_0</C>. Matrix products go to library kernels by default; in max-autotune mode,
          Inductor benchmarks Triton templates against them, as in e14.3.2, and can use CUDA graphs to remove launch
          overhead.
        </p>
      </Example>

      <Remark title="using torch.compile well">
        <p>
          Graph breaks are the first thing to look for: <C>TORCH_LOGS=graph_breaks</C> lists them with reasons, and{" "}
          <C>fullgraph=True</C> turns any break into an error. Recompilations are the second: the guard failures behind
          them are logged with <C>TORCH_LOGS=recompiles</C>. Varying sizes can be marked dynamic in advance to skip the
          first specialised compilation, and padding to buckets, as with XLA, still helps when the shapes reach
          kernels that are tuned for particular sizes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "launch",
      rung: "check",
      prompt: (
        <p>
          A step runs 900 operations, of which four, not adjacent and not at either end, cannot be captured. Every
          launch costs 5 µs, and every captured operation is one kernel. How many microseconds of launch overhead do
          CUDA graphs save per step?
        </p>
      ),
      answer: { kind: "numeric", value: 4455, tolerance: 0 },
    },
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          A block applies layernorm, matmul, add, gelu, matmul and add to an 8 MB input; the intermediate values after
          each of the first five operations take 8, 32, 32, 32 and 8 MB. With the partition of this lesson, what fraction
          of the memory saved by keeping every value the backward pass needs is still kept? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4667, tolerance: 0.0002 },
    },
    {
      key: "guard",
      rung: "apply",
      prompt: (
        <p>
          A compiled function is first called with a batch of 32, then with a batch of 48. What happens on the second
          call?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "A size guard fails, so the function is compiled again with the batch dimension symbolic, and later sizes reuse that program",
          "The program compiled for 32 is reused, padding the batch",
          "The function falls back to eager mode permanently",
          "A graph break is inserted at the batch dimension",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split_graphs(ops, supported):
    graphs, cur = [], []
    for op in ops:
        if op in supported:
            cur.append(op)
        else:                                              # graph break: this op runs in Python
            if cur:
                graphs.append(cur)
            cur = []
    if cur:
        graphs.append(cur)
    return graphs

def compile_count(sizes):
    seen, dynamic, n = set(), False, 0
    for s in sizes:
        if s in seen or (dynamic and s > 1):
            continue                                       # a cached program's guards pass
        n += 1
        if s > 1 and any(t > 1 for t in seen):
            dynamic = True                                 # second size: recompile with a symbolic size
        else:
            seen.add(s)                                    # sizes 0 and 1 are always specialised
    return n

def launch_us(ops, supported, per_launch, cuda_graphs):
    graphs = split_graphs(ops, supported)
    eager = len(ops) - sum(len(g) for g in graphs)
    kernels = len(graphs) if cuda_graphs else sum(len(g) for g in graphs)
    return (kernels + eager) * per_launch

print(split_graphs(["a", "p", "b", "c", "p", "p"], {"a", "b", "c"}), compile_count([3, 3, 1, 5, 7, 0]))
print(launch_us(["a", "p", "b", "c"], {"a", "b", "c"}, 2, False), launch_us(["a", "p", "b", "c"], {"a", "b", "c"}, 2, True))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[['a'], ['b', 'c']] 4\n8 6",
          "[['a'], ['b', 'c'], []] 4\n8 6",
          "[['a'], ['b', 'c']] 5\n8 6",
          "[['a'], ['b', 'c']] 4\n6 4",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`CHEAP = {"add", "sub", "mul", "relu", "gelu", "exp"}

def to_save(ops):
    # node 0 is the input and op i produces node i + 1; the backward pass needs nodes 0 .. n - 1
    return [0] + [i + 1 for i, op in enumerate(ops[:-1]) if op not in CHEAP]

def saved_bytes(ops, sizes, recompute):
    keep = to_save(ops) if recompute else range(len(ops))
    return sum(sizes[i] for i in keep)

def recompute_flops(ops, flops):
    return sum(f for op, f in zip(ops[:-1], flops) if op in CHEAP)

ops = ["matmul", "add", "relu", "matmul"]; print(to_save(ops), saved_bytes(ops, [4, 6, 6, 6, 2], True), saved_bytes(ops, [4, 6, 6, 6, 2], False))
print(recompute_flops(ops, [100, 3, 2, 50]), recompute_flops(["exp", "matmul"], [9, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 1] 10 22\n5 9",
          "[0, 1, 4] 12 22\n5 9",
          "[0, 1] 10 24\n5 9",
          "[0, 1] 10 22\n55 9",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split_graphs(ops, supported)</C>, the maximal non-empty runs of supported operations;{" "}
          <C>compile_count(sizes)</C>, following the rules for automatic dynamic shapes above; and{" "}
          <C>launch_us(ops, supported, per_launch, cuda_graphs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def split_graphs(ops, supported):
    return [ops]

def compile_count(sizes):
    return len(set(sizes))

def launch_us(ops, supported, per_launch, cuda_graphs):
    return len(ops) * per_launch
`,
        solution: DYNAMO,
        tests: [
          { name: "split", code: `assert split_graphs(["x", "y", "x"], {"y"}) == [["y"]] and split_graphs([], {"y"}) == [] and split_graphs(["y", "y"], {"y"}) == [["y", "y"]]` },
          { name: "dynamic", code: `assert compile_count([2, 9, 13, 1, 1]) == 3 and compile_count([0, 1, 0]) == 2 and compile_count([5, 5]) == 1` },
          { name: "launch", code: `assert launch_us(["y", "y", "x", "y"], {"y"}, 3, True) == 9 and launch_us(["y", "y", "x", "y"], {"y"}, 3, False) == 12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_save(ops)</C>, the nodes the forward pass keeps when cheap outputs are recomputed;{" "}
          <C>saved_bytes(ops, sizes, recompute)</C>, the bytes kept with or without recomputation, where sizes[i] is the
          size of node i; and <C>recompute_flops(ops, flops)</C>, the extra work of recomputation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `CHEAP = {"add", "sub", "mul", "relu", "gelu", "exp"}

def to_save(ops):
    return list(range(len(ops)))

def saved_bytes(ops, sizes, recompute):
    return sum(sizes)

def recompute_flops(ops, flops):
    return 0
`,
        solution: PARTITION,
        tests: [
          { name: "save", code: `assert to_save(["exp", "conv", "mul"]) == [0, 2] and to_save(["relu"]) == [0] and saved_bytes(["exp", "conv", "mul"], [1, 2, 3, 9], True) == 4` },
          { name: "cost", code: `assert saved_bytes(["exp", "conv", "mul"], [1, 2, 3, 9], False) == 6 and recompute_flops(["exp", "conv", "mul"], [7, 8, 9]) == 7` },
        ],
      },
    },
    {
      key: "recompiles",
      rung: "stretch",
      prompt: (
        <p>
          A function has two graph breaks inside it, splitting it into three graphs that each see the same input sizes and
          each compile in 35 seconds. The batch size over successive calls is 6, 6, 1, 6, 12, 0, 1, 24, 1, 3, 0. How many
          seconds are spent compiling?
        </p>
      ),
      answer: { kind: "numeric", value: 420, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        XLA and Inductor each have their own IRs from graph to kernel. The next lesson looks at MLIR, a framework for
        building such compilers out of dialects at many levels, which XLA, Triton and others now share.
      </p>
    </>
  ),
};
