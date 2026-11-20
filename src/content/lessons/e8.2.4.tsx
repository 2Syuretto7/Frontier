import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AllReduceAlgosViz } from "@/components/viz/AllReduceAlgosViz";
import type { LessonContent } from "@/lib/types";

const BUTTERFLY = `def recursive_doubling(values):
    p, vals, d, rounds = len(values), list(values), 1, 0
    while d < p:
        vals = [vals[i] + vals[i ^ d] for i in range(p)]
        d, rounds = 2 * d, rounds + 1
    return vals, rounds

def halving_doubling(vectors):
    p, n = len(vectors), len(vectors[0])
    buf, seg, d = [list(v) for v in vectors], [(0, n)] * p, p // 2
    while d >= 1:
        nxt, new_seg = [list(b) for b in buf], []
        for i in range(p):
            a, b = seg[i]
            m = (a + b) // 2
            a, b = (a, m) if i & d == 0 else (m, b)
            for k in range(a, b):
                nxt[i][k] = buf[i][k] + buf[i ^ d][k]
            new_seg.append((a, b))
        buf, seg, d = nxt, new_seg, d // 2
    d = 1
    while d < p:
        nxt = [list(b) for b in buf]
        for i in range(p):
            a, b = seg[i ^ d]
            nxt[i][a:b] = buf[i ^ d][a:b]
        seg = [(min(seg[i][0], seg[i ^ d][0]), max(seg[i][1], seg[i ^ d][1])) for i in range(p)]
        buf, d = nxt, 2 * d
    return buf`;

const COSTS = `import math

def rd_time(p, n, alpha, beta):
    return math.log2(p) * (alpha + n / beta)

def rhd_time(p, n, alpha, beta):
    return 2 * math.log2(p) * alpha + 2 * (p - 1) / p * n / beta

def hier_time(g, m, n, a_in, b_in, a_out, b_out):
    inside = 2 * (g - 1) * (a_in + n / (g * b_in))
    across = 2 * (m - 1) * a_out + 2 * (m - 1) / m * (n / g) / b_out
    return inside + across`;

export const lesson: LessonContent = {
  id: "e8.2.4",
  minutes: 55,
  links: {
    requires: ["e8.2.2", "e7.5.3"],
    revisits: ["e8.2.1"],
    foreshadows: ["e8.2.5"],
  },

  puzzle: (
    <>
      <p>
        The ring all-reduce (e7.5.3) sends the least data possible, but it passes through every rank one step at a time: on
        a thousand GPUs it pays two thousand latencies, even to sum a single number. A tree pays only about twenty, but sends
        the whole vector at every level. Is there an algorithm with the latency of a tree and the bandwidth of a ring?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pair rank i with rank i + 1 (flipping the lowest bit of i), then with i + 2, then i + 4, and so on: after log₂ p
        exchanges each rank has heard, directly or indirectly, from everyone. If partners exchange whole vectors, this is{" "}
        <em>recursive doubling</em>, fast for small messages. If instead each pair splits its vector in half and each partner
        keeps and sums one half, the data each rank handles halves every round: after log₂ p rounds every rank holds one fully
        summed chunk, a reduce-scatter. Running the same exchanges backwards, doubling the chunk each time, is an all-gather.
        This <em>halving-doubling</em> algorithm has log-depth latency and ring-like bandwidth.
      </p>
      <AllReduceAlgosViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recursive doubling">
        <p>
          For p a power of two, in round k = 0, 1, …, log₂ p − 1, rank i exchanges its value with rank{" "}
          <M>{"i \\oplus 2^k"}</M> (bitwise exclusive or, <C>i ^ d</C> in Python) and both replace their value by the sum.
          The partners form the edges of a hypercube, and the pattern is also called a butterfly.
        </p>
      </Definition>

      <Theorem title="recursive doubling computes the total">
        <p>
          After the round with stride <M>{"d = 2^k"}</M>, rank i holds the sum of the values of the <M>{"2^{k+1}"}</M> ranks
          whose numbers agree with i in every bit above bit k. In particular, after log₂ p rounds every rank holds the total.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on k. Before round k, rank i holds the sum over the set <M>{"S_i"}</M> of ranks agreeing with i above
          bit k − 1, and its partner <M>{"j = i \\oplus 2^k"}</M> holds the sum over <M>{"S_j"}</M>. The two sets are disjoint,
          because their members differ in bit k, and their union is the set of ranks agreeing with i above bit k. Adding the two
          sums therefore gives the claim for k. When k = log₂ p − 1 there are no higher bits, and the set is every rank.
        </p>
      </Proof>

      <Definition title="halving and doubling">
        <p>
          (Rabenseifner, 2004.) In the reduce-scatter phase, strides run d = p/2, p/4, …, 1. Each rank holds a segment of the
          vector, initially all of it; it splits the segment in half, keeps the lower half if bit d of its rank is 0 and the
          upper half otherwise, and adds its partner&apos;s values for that half. In the all-gather phase strides run 1, 2, …,
          p/2, and each rank copies its partner&apos;s finished segment, so the segment it holds doubles.
        </p>
        <Code>{BUTTERFLY}</Code>
      </Definition>

      <Theorem title="the cost of halving-doubling">
        <p>
          For p a power of two and a vector of n bytes, halving-doubling all-reduce takes{" "}
          <M>{"2\\log_2 p\\,\\alpha + 2\\frac{p - 1}{p}\\frac{n}{\\beta}"}</M>: the bandwidth term of the ring with only{" "}
          <M>{"2\\log_2 p"}</M> latencies.
        </p>
      </Theorem>
      <Proof>
        <p>
          The reduce-scatter has log₂ p rounds, and in the round where segments are halved from size s to s/2 each rank sends
          s/2. The sizes sent are n/2, n/4, …, n/p, which sum to <M>{"n(1 - 1/p)"}</M>. The all-gather mirrors it, sending n/p,
          2n/p, …, n/2. Each round costs one latency, giving <M>{"2\\log_2 p"}</M> latencies and{" "}
          <M>{"2n(p - 1)/p"}</M> bytes sent per rank, with all pairs working in parallel.
        </p>
      </Proof>

      <Definition title="hierarchical all-reduce">
        <p>
          A cluster has fast links inside a node (NVLink) and slower ones between nodes (InfiniBand). With g GPUs per node and m
          nodes, a hierarchical all-reduce first reduce-scatters within each node, so each GPU holds 1/g of the node&apos;s sum;
          then the m GPUs that hold the same chunk, one per node, all-reduce that chunk across nodes; then each node all-gathers.
          Only n/g bytes per GPU cross the slow network instead of n. <C>hier_time</C> uses ring algorithms at both levels.
        </p>
        <Code>{COSTS}</Code>
      </Definition>

      <Remark title="what libraries do">
        <p>
          NCCL implements rings and, for large clusters, double binary trees (Sanders, Speck and Träff, 2009): two trees in which
          every rank is an interior node of at most one, each carrying half the data in pipelined chunks, so that bandwidth is
          close to the ring&apos;s while depth is logarithmic. MPI libraries choose among recursive doubling, halving-doubling
          and rings by message size and number of ranks, much as the visualisation suggests, and handle p that is not a power
          of two by first folding the extra ranks into partners.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rounds",
      rung: "check",
      prompt: <p>How many rounds does recursive doubling need to all-reduce on 1024 ranks?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "time",
      rung: "check",
      prompt: (
        <p>
          Halving-doubling all-reduces 8 × 10⁸ bytes on 16 ranks with α = 10 µs and β = 10¹⁰ bytes per second. How many
          milliseconds does it take? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 150.08, tolerance: 0.005 },
    },
    {
      key: "hier",
      rung: "apply",
      prompt: <p>Why is a hierarchical all-reduce faster than one flat ring over all GPUs of a multi-node cluster?</p>,
      answer: {
        kind: "choice",
        options: [
          "Only 1/g of each GPU's data crosses the slow links between nodes, while the rest of the work uses the fast links inside a node",
          "It sends fewer bytes in total inside each node",
          "It avoids floating-point rounding by summing within a node first",
          "It needs no latency inside a node",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def recursive_doubling(values):
    p, vals, d, rounds = len(values), list(values), 1, 0
    while d < p:
        vals = [vals[i] + vals[i ^ d] for i in range(p)]
        d, rounds = 2 * d, rounds + 1
    return vals, rounds

def halving_doubling(vectors):
    p, n = len(vectors), len(vectors[0])
    buf, seg, d = [list(v) for v in vectors], [(0, n)] * p, p // 2
    while d >= 1:
        nxt, new_seg = [list(b) for b in buf], []
        for i in range(p):
            a, b = seg[i]
            m = (a + b) // 2
            a, b = (a, m) if i & d == 0 else (m, b)
            for k in range(a, b):
                nxt[i][k] = buf[i][k] + buf[i ^ d][k]
            new_seg.append((a, b))
        buf, seg, d = nxt, new_seg, d // 2
    d = 1
    while d < p:
        nxt = [list(b) for b in buf]
        for i in range(p):
            a, b = seg[i ^ d]
            nxt[i][a:b] = buf[i ^ d][a:b]
        seg = [(min(seg[i][0], seg[i ^ d][0]), max(seg[i][1], seg[i ^ d][1])) for i in range(p)]
        buf, d = nxt, 2 * d
    return buf

print(recursive_doubling([1, 2, 3, 4]), recursive_doubling([5, 1, 7, 2, 3, 3, 0, 9])[0][5])
print(halving_doubling([[1, 2, 3, 4], [10, 20, 30, 40]]), halving_doubling([[i * 10 + k for k in range(4)] for i in range(4)])[3])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([10, 10, 10, 10], 2) 30\n[[11, 22, 33, 44], [11, 22, 33, 44]] [60, 64, 68, 72]",
          "([10, 10, 10, 10], 4) 30\n[[11, 22, 33, 44], [11, 22, 33, 44]] [60, 64, 68, 72]",
          "([3, 3, 7, 7], 2) 30\n[[11, 22, 33, 44], [11, 22, 33, 44]] [60, 64, 68, 72]",
          "([10, 10, 10, 10], 2) 30\n[[11, 22, 3, 4], [1, 2, 33, 44]] [30, 31, 32, 33]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def rd_time(p, n, alpha, beta):
    return math.log2(p) * (alpha + n / beta)

def rhd_time(p, n, alpha, beta):
    return 2 * math.log2(p) * alpha + 2 * (p - 1) / p * n / beta

def hier_time(g, m, n, a_in, b_in, a_out, b_out):
    inside = 2 * (g - 1) * (a_in + n / (g * b_in))
    across = 2 * (m - 1) * a_out + 2 * (m - 1) / m * (n / g) / b_out
    return inside + across

print(rd_time(8, 100, 1, 10), rhd_time(8, 100, 1, 10), rhd_time(1, 100, 1, 10))
print(hier_time(4, 2, 800, 1, 100, 10, 10), hier_time(1, 4, 100, 5, 1, 1, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "33.0 23.5 0.0\n58.0 21.0",
          "33.0 23.5 0.0\n98.0 21.0",
          "33.0 20.5 0.0\n58.0 21.0",
          "33.0 23.5 0.0\n58.0 15.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For p a power of two, write <C>recursive_doubling(values)</C>, returning every rank&apos;s final value and the number
          of rounds, and <C>halving_doubling(vectors)</C>, the all-reduce by recursive halving then doubling described above
          (split a segment (a, b) at <C>(a + b) // 2</C>), returning every rank&apos;s final vector.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def recursive_doubling(values):
    return list(values), 0

def halving_doubling(vectors):
    return [list(v) for v in vectors]
`,
        solution: BUTTERFLY,
        tests: [
          { name: "doubling", code: `assert recursive_doubling([7]) == ([7], 0) and recursive_doubling([1, 2]) == ([3, 3], 1)
assert recursive_doubling([0.5, 0.25, 1, 2]) == ([3.75] * 4, 2) and recursive_doubling(list(range(16))) == ([120] * 16, 4)` },
          { name: "halving", code: `assert halving_doubling([[3, 4]]) == [[3, 4]] and halving_doubling([[1, 2, 3], [4, 5, 6]]) == [[5, 7, 9]] * 2
import random
r = random.Random(2)
for p in (2, 4, 8, 16):
    for n in (p, 3 * p, 4 * p):
        vs = [[r.randint(-9, 9) for _ in range(n)] for _ in range(p)]
        assert halving_doubling(vs) == [[sum(v[k] for v in vs) for k in range(n)]] * p` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rd_time(p, n, alpha, beta)</C> and <C>rhd_time(p, n, alpha, beta)</C> for recursive doubling and
          halving-doubling, and <C>hier_time(g, m, n, a_in, b_in, a_out, b_out)</C>: a ring reduce-scatter and a ring all-gather
          over the g GPUs of a node, each taking <M>{"(g - 1)(\\alpha + n/(g\\beta))"}</M>, and a ring all-reduce of n/g bytes
          across the m nodes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rd_time(p, n, alpha, beta):
    return 0.0

def rhd_time(p, n, alpha, beta):
    return 0.0

def hier_time(g, m, n, a_in, b_in, a_out, b_out):
    return 0.0
`,
        solution: COSTS,
        tests: [
          { name: "butterflies", code: `assert abs(rd_time(4, 6, 1, 2) - 8) < 1e-12 and abs(rhd_time(4, 6, 1, 2) - 8.5) < 1e-12 and abs(rhd_time(2, 0, 3, 1) - 6) < 1e-12
assert rd_time(1, 9, 9, 9) == 0` },
          { name: "hierarchical", code: `assert abs(hier_time(2, 3, 12, 1, 2, 4, 1) - 32) < 1e-12 and abs(hier_time(8, 1, 80, 1, 10, 9, 9) - 28) < 1e-12
assert abs(hier_time(1, 4, 100, 5, 1, 1, 10) - 21) < 1e-12` },
        ],
      },
    },
    {
      key: "cluster",
      rung: "stretch",
      prompt: (
        <p>
          A cluster has 16 nodes of 8 GPUs, with α = 2 µs and β = 450 GB/s inside a node and α = 5 µs and β = 50 GB/s between
          nodes. How many milliseconds does <C>hier_time</C> give for all-reducing 1 GB (10⁹ bytes)? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 8.75, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every comparison in this part has used the same two numbers, a latency and a bandwidth. The last lesson of the part
        makes the α–β model itself the subject: how to measure α and β, what the model leaves out, and how to use it to predict
        the cost of communication in a training step.
      </p>
    </>
  ),
};
