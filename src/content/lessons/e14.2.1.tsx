import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FusionGroupsViz } from "@/components/viz/FusionGroupsViz";
import type { LessonContent } from "@/lib/types";

const FUSE = `def consumers(nodes):
    c = {n: [] for n, _, _ in nodes}
    for n, _, ins in nodes:
        for i in ins:
            if i in c:
                c[i].append(n)
    return c

def fuse_groups(nodes):
    kind = {n: k for n, k, _ in nodes}
    cons, group_of, groups = consumers(nodes), {}, []
    for n, k, ins in nodes:
        target = None
        if k == "pointwise":
            for p in ins:
                if kind.get(p) in ("pointwise", "matmul") and len(cons[p]) == 1:
                    target = group_of[p]                   # absorb into the producer's kernel
                    break
        if target is None:
            target = len(groups)
            groups.append([])
        groups[target].append(n)
        group_of[n] = target
    return groups

def traffic(nodes, size, groups, outputs):
    where = {n: g for g, ns in enumerate(groups) for n in ns}
    ins_of, cons, total = {n: ins for n, _, ins in nodes}, consumers(nodes), 0
    for g, ns in enumerate(groups):
        reads = {i for n in ns for i in ins_of[n] if where.get(i) != g}
        writes = {n for n in ns if n in outputs or any(where[c] != g for c in cons[n])}
        total += sum(size[x] for x in reads | writes)      # only values crossing the kernel boundary
    return total`;

const COST = `def time_us(flops, nbytes, peak_tflops, bw_gbs):
    return max(flops / (peak_tflops * 1e6), nbytes / (bw_gbs * 1e3))   # bound by compute or by memory

def total_us(kernels, peak_tflops, bw_gbs, launch_us):
    return sum(time_us(f, b, peak_tflops, bw_gbs) + launch_us for f, b in kernels)

def should_fuse(separate, fused, peak_tflops, bw_gbs, launch_us):
    return total_us([fused], peak_tflops, bw_gbs, launch_us) < total_us(separate, peak_tflops, bw_gbs, launch_us)`;

export const lesson: LessonContent = {
  id: "e14.2.1",
  minutes: 45,
  links: {
    requires: ["e14.1.3", "e7.4.3"],
    revisits: ["e9.3.2", "e9.2.3", "e9.4.2"],
    foreshadows: ["e14.2.3", "e14.4.2"],
  },

  puzzle: (
    <>
      <p>
        A transformer block in eager PyTorch launches dozens of kernels per layer: a matrix multiplication, then a bias
        addition, an activation, a dropout, a residual addition, a normalisation. Most of them do one or two arithmetic
        operations per element, and on a modern GPU each finishes in a few microseconds, almost all of it spent moving
        data. What would it take for a compiler to remove that waste automatically, and when should it not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A pointwise kernel reads its input from memory, does a little arithmetic, and writes its output back, only for
        the next kernel to read it again. Fusing the two into one kernel keeps the intermediate value in registers, so
        it never reaches memory at all. Since these operations are memory-bound, the saving in traffic is a saving in
        time. The compiler&apos;s task is to find groups of operations that can share a kernel, and to decide which
        groupings pay.
      </p>
      <FusionGroupsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="fusion">
        <p>
          A fusion pass partitions the graph&apos;s operations into groups, each compiled to one kernel. Vertical fusion
          joins a producer to its consumer; epilogue fusion attaches pointwise operations to the output of a matrix
          multiplication; horizontal fusion runs independent operations on the same data in one kernel. A simple greedy
          rule, used here, visits operations in topological order and absorbs a pointwise operation into the group of a
          pointwise or matrix-multiplication producer that has no other consumer (<C>consumers</C>,{" "}
          <C>fuse_groups</C>). Memory traffic counts only values that cross a group boundary: inputs read from outside
          the group, and outputs read outside it or returned (<C>traffic</C>).
        </p>
        <Code>{FUSE}</Code>
      </Definition>

      <Theorem title="what fusion saves">
        <p>
          For a chain of k pointwise operations on a tensor of n bytes, with inputs and outputs of the same size, running
          each in its own kernel moves 2kn bytes, and one fused kernel moves 2n. More generally, merging two groups
          removes from the traffic exactly the values produced in one and consumed only in the other, counted once for
          the write and once for each read.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unfused, each of the k kernels reads its n-byte input and writes its n-byte output, 2kn bytes in all. Fused,
          the intermediate values pass between operations in registers; only the chain&apos;s input is read and its
          output written, 2n bytes. For the general statement, a value v produced in group A contributes its write and
          one read per consuming group other than A. After A and B merge, reads by B become internal, and if B was
          v&apos;s only outside consumer and v is not an output, the write disappears too; values not passing between A
          and B are unaffected.
        </p>
      </Proof>

      <Example title="fusion in practice">
        <p>
          TorchInductor fuses pointwise operations and reductions into generated Triton kernels, the kind written by hand
          in e9.3.2, and calls matrix multiplications from libraries or templates with fused epilogues, the idea behind
          CUTLASS&apos;s epilogue in e9.2.3. XLA distinguishes loop fusion of pointwise operations, input fusion that
          puts a reduction together with the operations feeding it, and output fusion into a matrix multiplication.
          FlashAttention (e9.4.2) is fusion that no generic compiler pass finds by itself: the softmax&apos;s reduction
          sits between two matrix multiplications, and fusing them requires the online softmax rewrite of e9.4.1.
        </p>
      </Example>

      <Remark title="when not to fuse">
        <p>
          A value with several consumers must either be written once and read by each, or recomputed inside every
          consumer&apos;s kernel; recomputation is cheap for pointwise producers and ruinous for matrix
          multiplications. A fused kernel can also use so many registers that occupancy falls, or combine a reduction and
          a broadcast so that each thread block must hold a whole row. Compilers therefore weigh a fusion with a cost
          model, such as the roofline of e7.4.3 plus a fixed launch overhead per kernel (<C>time_us</C>,{" "}
          <C>total_us</C>, <C>should_fuse</C>).
        </p>
        <Code>{COST}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          A chain of four pointwise unary operations is applied to a tensor of <M>{"2^{26}"}</M> BF16 elements. Unfused,
          each kernel reads and writes the whole tensor; fused, the chain reads it and writes the result once. At 3.35
          TB/s (<M>{"3.35 \\times 10^{12}"}</M> bytes a second), how many microseconds of memory time does fusion save,
          to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 240.4, tolerance: 0.002 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A fused kernel applies k pointwise operations of one FLOP each per element, reading 2 bytes and writing 2
          bytes per element. The GPU does 60 TFLOP/s on such operations and moves 3.35 TB/s. What is the smallest k for
          which compute time is at least memory time?
        </p>
      ),
      answer: { kind: "numeric", value: 72, tolerance: 0 },
    },
    {
      key: "recompute",
      rung: "apply",
      prompt: (
        <p>
          A matrix multiplication&apos;s output is consumed by two different pointwise operations. Why does the greedy
          rule refuse to fuse it into either?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The other consumer would still need the output in memory, or the expensive multiplication would have to be recomputed",
          "Matrix multiplications can never be fused",
          "Pointwise operations cannot read from registers",
          "Two consumers make the graph cyclic",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def consumers(nodes):
    c = {n: [] for n, _, _ in nodes}
    for n, _, ins in nodes:
        for i in ins:
            if i in c:
                c[i].append(n)
    return c

def fuse_groups(nodes):
    kind = {n: k for n, k, _ in nodes}
    cons, group_of, groups = consumers(nodes), {}, []
    for n, k, ins in nodes:
        target = None
        if k == "pointwise":
            for p in ins:
                if kind.get(p) in ("pointwise", "matmul") and len(cons[p]) == 1:
                    target = group_of[p]                   # absorb into the producer's kernel
                    break
        if target is None:
            target = len(groups)
            groups.append([])
        groups[target].append(n)
        group_of[n] = target
    return groups

def traffic(nodes, size, groups, outputs):
    where = {n: g for g, ns in enumerate(groups) for n in ns}
    ins_of, cons, total = {n: ins for n, _, ins in nodes}, consumers(nodes), 0
    for g, ns in enumerate(groups):
        reads = {i for n in ns for i in ins_of[n] if where.get(i) != g}
        writes = {n for n in ns if n in outputs or any(where[c] != g for c in cons[n])}
        total += sum(size[x] for x in reads | writes)      # only values crossing the kernel boundary
    return total

g = [("t", "matmul", ["x", "w"]), ("u", "pointwise", ["t"]), ("v", "pointwise", ["u"]), ("s", "reduction", ["v"]), ("y", "pointwise", ["s", "v"])]
print(fuse_groups(g), traffic(g, dict.fromkeys("xwtuvsy", 1), fuse_groups(g), ["y"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[['t', 'u', 'v'], ['s'], ['y']] 8",
          "[['t', 'u', 'v'], ['s', 'y']] 6",
          "[['t'], ['u', 'v'], ['s'], ['y']] 10",
          "[['t', 'u', 'v'], ['s'], ['y']] 7",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def time_us(flops, nbytes, peak_tflops, bw_gbs):
    return max(flops / (peak_tflops * 1e6), nbytes / (bw_gbs * 1e3))   # bound by compute or by memory

def total_us(kernels, peak_tflops, bw_gbs, launch_us):
    return sum(time_us(f, b, peak_tflops, bw_gbs) + launch_us for f, b in kernels)

def should_fuse(separate, fused, peak_tflops, bw_gbs, launch_us):
    return total_us([fused], peak_tflops, bw_gbs, launch_us) < total_us(separate, peak_tflops, bw_gbs, launch_us)

print(time_us(2e6, 1e6, 100, 1000), total_us([(0, 2e6), (0, 2e6)], 100, 1000, 5))
print(should_fuse([(0, 2e6), (0, 2e6)], (0, 2e6), 100, 1000, 5), should_fuse([(1e9, 0)], (2e9, 0), 100, 1000, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 14.0\nTrue False", "0.02 14.0\nTrue False", "1.0 4.0\nTrue False", "1.0 14.0\nTrue True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Nodes are (name, kind, inputs) in topological order, with kind &quot;pointwise&quot;, &quot;reduction&quot; or
          &quot;matmul&quot;. Write <C>consumers(nodes)</C>; <C>fuse_groups(nodes)</C> with the greedy rule, taking the
          first eligible input; and <C>traffic(nodes, size, groups, outputs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def consumers(nodes):
    return {}

def fuse_groups(nodes):
    return [[n] for n, _, _ in nodes]

def traffic(nodes, size, groups, outputs):
    return 0
`,
        solution: FUSE,
        tests: [
          { name: "groups", code: `n = [("a", "pointwise", ["x"]), ("b", "pointwise", ["a"]), ("c", "pointwise", ["a"]), ("d", "pointwise", ["b", "c"])]; assert fuse_groups(n) == [["a"], ["b", "d"], ["c"]] and fuse_groups([("m", "matmul", ["x", "w"]), ("r", "reduction", ["m"]), ("p", "pointwise", ["r"])]) == [["m"], ["r"], ["p"]] and fuse_groups([]) == []` },
          { name: "traffic", code: `n = [("a", "pointwise", ["x"]), ("b", "pointwise", ["a"]), ("c", "pointwise", ["a"]), ("d", "pointwise", ["b", "c"])]; s = dict.fromkeys("xabcd", 2); assert traffic(n, s, [["a"], ["b", "d"], ["c"]], ["d"]) == 14 and traffic(n, s, [["a"], ["b"], ["c"], ["d"]], ["d"]) == 18` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>time_us(flops, nbytes, peak_tflops, bw_gbs)</C>, the roofline time in microseconds;{" "}
          <C>total_us(kernels, peak_tflops, bw_gbs, launch_us)</C> for a list of (flops, bytes) kernels, adding the
          launch overhead to each; and <C>should_fuse(separate, fused, peak_tflops, bw_gbs, launch_us)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def time_us(flops, nbytes, peak_tflops, bw_gbs):
    return flops / (peak_tflops * 1e6)

def total_us(kernels, peak_tflops, bw_gbs, launch_us):
    return 0.0

def should_fuse(separate, fused, peak_tflops, bw_gbs, launch_us):
    return True
`,
        solution: COST,
        tests: [
          { name: "time", code: `assert time_us(5e6, 1e6, 50, 2000) == 0.5 and total_us([], 1, 1, 3) == 0` },
          { name: "fuse", code: `assert should_fuse([(1e6, 1e6), (1e6, 1e6)], (2e6, 1e6), 100, 1000, 0) and not should_fuse([(0, 1e6)], (0, 1e6), 100, 1000, 2)` },
        ],
      },
    },
    {
      key: "softmax",
      rung: "stretch",
      prompt: (
        <p>
          A row-wise softmax over <M>{"2^{28}"}</M> BF16 elements runs unfused as four kernels: a row maximum, a
          subtract-and-exponentiate, a row sum, and a division. Fused, with each row held on chip, it reads the input
          once and writes the output once. At 3.35 TB/s, how many microseconds of memory time does fusion save, to one
          decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 641.0, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fused kernels still have to read their data efficiently, which depends on how tensors are laid out in memory.
        The next lesson is about choosing layouts and inserting the transposes that convert between them.
      </p>
    </>
  ),
};
