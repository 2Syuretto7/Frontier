import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AllToAllMoeViz } from "@/components/viz/AllToAllMoeViz";
import type { LessonContent } from "@/lib/types";

const EXCHANGE = `def all_to_all(send):
    p = len(send)
    return [[send[i][j] for i in range(p)] for j in range(p)]

def dispatch(assignments, experts_per_rank):
    p = len(assignments)
    send = [[[] for _ in range(p)] for _ in range(p)]
    for i, experts in enumerate(assignments):
        for t, e in enumerate(experts):
            send[i][e // experts_per_rank].append((i, t, e))
    return send

def dropped(expert_counts, capacity):
    return sum(max(0, c - capacity) for c in expert_counts)`;

const COSTS = `import math

def direct_time(p, n, alpha, beta):
    return (p - 1) * (alpha + n / (p * beta))

def bruck_time(p, n, alpha, beta):
    return math.ceil(math.log2(p)) * (alpha + n / (2 * beta))

def capacity(tokens, experts, factor):
    return math.ceil(factor * tokens / experts)`;

export const lesson: LessonContent = {
  id: "e8.2.3",
  minutes: 45,
  links: {
    requires: ["e8.2.2"],
    revisits: ["e7.5.3"],
    foreshadows: ["e8.4.1", "e8.2.5"],
  },

  puzzle: (
    <>
      <p>
        A mixture-of-experts layer has 64 experts spread over 64 GPUs. Each GPU holds a batch of tokens, and a router has
        decided, token by token, which expert should process it. Every GPU now has some tokens for every other GPU, and needs
        to receive tokens from all of them. None of the collectives so far fits: nothing is summed and nothing is copied. What
        operation is this, and why does it so often limit the speed of such models?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Picture a p × p table whose entry (i, j) is the block of data that rank i has for rank j. Rank i starts with row i
        and must end with column j = i: the exchange is a transpose of the table, called <em>all-to-all</em>. Unlike all-reduce,
        nothing can be combined on the way, because every block has its own destination, so every byte that is not already
        home must cross the network. And unlike the earlier collectives, the amount sent between two ranks depends on the data:
        if the router sends most tokens to a few experts, a few links and a few GPUs carry most of the load.
      </p>
      <AllToAllMoeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="all-to-all">
        <p>
          Rank i holds blocks <M>{"b_{i,0}, \\dots, b_{i,p-1}"}</M>, and after the all-to-all rank j holds{" "}
          <M>{"b_{0,j}, \\dots, b_{p-1,j}"}</M>. Its uses include the distributed transpose (switching a matrix from row
          sharding to column sharding, as in a parallel FFT), the shuffle of map-reduce (e8.4.1), sequence parallelism that
          switches from sharding by position to sharding by attention head, and mixture-of-experts layers, which send each
          token to its expert&apos;s rank (<em>dispatch</em>) and back again afterwards (<em>combine</em>).
        </p>
      </Definition>

      <Definition title="dispatch with a capacity">
        <p>
          With E experts on p ranks, expert e lives on rank <M>{"\\lfloor e/(E/p)\\rfloor"}</M>. <C>dispatch</C> builds the
          send table from each rank&apos;s routing decisions, tagging every token with its origin so that the combine step can
          return it. To keep buffers a fixed size, each expert accepts at most a <em>capacity</em> of{" "}
          <M>{"\\lceil f\\cdot T/E\\rceil"}</M> tokens for T tokens and capacity factor f, and <C>dropped</C> counts the overflow,
          which skips the expert and passes through the layer on the residual connection.
        </p>
        <Code>{EXCHANGE}</Code>
      </Definition>

      <Theorem title="what an all-to-all must send">
        <p>
          If every block has size n/p, each rank must send at least <M>{"\\frac{p-1}{p}n"}</M> and receive as much, and the
          direct algorithm, in which each rank sends each block straight to its destination, achieves this with p − 1 messages
          per rank.
        </p>
      </Theorem>
      <Proof>
        <p>
          The blocks <M>{"b_{i,j}"}</M> for j ≠ i exist only on rank i at the start and must be on rank j at the end. They are
          arbitrary data, so no combination of them is smaller than the blocks themselves, and all p − 1 of them must leave rank
          i: at least <M>{"\\frac{p-1}{p}n"}</M>. Symmetrically, rank j must receive p − 1 blocks. The direct algorithm sends
          each of these blocks exactly once.
        </p>
      </Proof>

      <Definition title="latency against bandwidth">
        <p>
          The direct algorithm costs <M>{"(p - 1)\\left(\\alpha + \\frac{n}{p\\beta}\\right)"}</M> (<C>direct_time</C>): optimal
          bandwidth, but p − 1 latencies. Bruck&apos;s algorithm (Bruck et al., 1997) uses <M>{"\\lceil\\log_2 p\\rceil"}</M>
          rounds, in each of which every rank forwards about half of its data, costing about{" "}
          <M>{"\\lceil\\log_2 p\\rceil(\\alpha + \\frac{n}{2\\beta})"}</M> (<C>bruck_time</C>). It wins for small messages on many
          ranks, and the direct algorithm wins otherwise.
        </p>
        <Code>{COSTS}</Code>
      </Definition>

      <Remark title="in practice">
        <p>
          <C>torch.distributed.all_to_all_single</C> takes split sizes for each destination, so that variable-sized exchanges
          such as token dispatch are possible. Across nodes an all-to-all is limited by the network&apos;s bisection bandwidth
          (e7.5.3), since half of all the data must cross any cut that halves the machine. This is why large mixture-of-experts
          models place experts so that most tokens stay within a node, and why their routers are trained with a loss that
          favours balanced loads (Switch Transformer, Fedus et al., 2021).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "direct",
      rung: "check",
      prompt: (
        <p>
          Each of 8 ranks holds 8 MB (8 × 10⁶ bytes) of data, split evenly by destination. With α = 5 µs and β = 10¹⁰ bytes per
          second, how many microseconds does the direct all-to-all take?
        </p>
      ),
      answer: { kind: "numeric", value: 735, tolerance: 0.001 },
    },
    {
      key: "cap",
      rung: "check",
      prompt: <p>A batch of 4096 tokens is routed to 64 experts with capacity factor 1.25. What is each expert&apos;s capacity?</p>,
      answer: { kind: "numeric", value: 80, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these exchanges is an all-to-all?</p>,
      answer: {
        kind: "choice",
        options: [
          "Sending each token to the rank that holds the expert chosen for it",
          "Averaging the gradients of all ranks",
          "Copying the initial weights from rank 0 to every rank",
          "Collecting every rank's shard of a layer's weights on every rank",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def all_to_all(send):
    p = len(send)
    return [[send[i][j] for i in range(p)] for j in range(p)]

def dispatch(assignments, experts_per_rank):
    p = len(assignments)
    send = [[[] for _ in range(p)] for _ in range(p)]
    for i, experts in enumerate(assignments):
        for t, e in enumerate(experts):
            send[i][e // experts_per_rank].append((i, t, e))
    return send

def dropped(expert_counts, capacity):
    return sum(max(0, c - capacity) for c in expert_counts)

print(all_to_all([['a0', 'a1'], ['b0', 'b1']]), all_to_all([[1, 2, 3], [4, 5, 6], [7, 8, 9]])[2])
s = dispatch([[0, 3, 1], [2, 2, 0]], 2); print(s[0][1], s[1][0], all_to_all(s)[1], dropped([5, 1, 3, 0], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[['a0', 'b0'], ['a1', 'b1']] [3, 6, 9]\n[(0, 1, 3)] [(1, 2, 0)] [[(0, 1, 3)], [(1, 0, 2), (1, 1, 2)]] 4",
          "[['a0', 'a1'], ['b0', 'b1']] [7, 8, 9]\n[(0, 1, 3)] [(1, 2, 0)] [[(0, 1, 3)], [(1, 0, 2), (1, 1, 2)]] 4",
          "[['a0', 'b0'], ['a1', 'b1']] [3, 6, 9]\n[(0, 1, 3)] [(1, 2, 0)] [[(0, 0, 0), (0, 2, 1)], [(0, 1, 3)]] 4",
          "[['a0', 'b0'], ['a1', 'b1']] [3, 6, 9]\n[(0, 1, 3)] [(1, 2, 0)] [[(0, 1, 3)], [(1, 0, 2), (1, 1, 2)]] 6",
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

def direct_time(p, n, alpha, beta):
    return (p - 1) * (alpha + n / (p * beta))

def bruck_time(p, n, alpha, beta):
    return math.ceil(math.log2(p)) * (alpha + n / (2 * beta))

def capacity(tokens, experts, factor):
    return math.ceil(factor * tokens / experts)

print(direct_time(4, 400, 1, 10), bruck_time(4, 400, 1, 10), direct_time(1, 400, 1, 10))
print(capacity(1000, 8, 1.25), capacity(10, 4, 1.0), [p for p in (8, 64, 512) if bruck_time(p, 64, 1, 1) < direct_time(p, 64, 1, 1)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "33.0 42.0 0.0\n157 3 [512]",
          "33.0 42.0 0.0\n156 3 [512]",
          "33.0 42.0 0.0\n157 3 [64, 512]",
          "33.0 22.0 0.0\n157 2 [512]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>all_to_all(send)</C>, where <C>send[i][j]</C> is rank i&apos;s block for rank j, returning each rank&apos;s
          received blocks in order of source; <C>dispatch(assignments, experts_per_rank)</C>, where <C>assignments[i][t]</C> is
          the expert of token t on rank i and each sent item is <C>(i, t, e)</C>; and <C>dropped(expert_counts, capacity)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def all_to_all(send):
    return send

def dispatch(assignments, experts_per_rank):
    return []

def dropped(expert_counts, capacity):
    return 0
`,
        solution: EXCHANGE,
        tests: [
          { name: "exchange", code: `assert all_to_all([[5]]) == [[5]] and all_to_all([[1, 2], [3, 4]]) == [[1, 3], [2, 4]]
assert dispatch([[1], [0]], 1) == [[[], [(0, 0, 1)]], [[(1, 0, 0)], []]]
assert dispatch([[0, 1, 2, 3]], 4) == [[[(0, 0, 0), (0, 1, 1), (0, 2, 2), (0, 3, 3)]]]
s = dispatch([[3, 0, 2, 1], [1, 1, 3, 0]], 2)
assert s[0][1] == [(0, 0, 3), (0, 2, 2)] and all_to_all(s)[0] == [[(0, 1, 0), (0, 3, 1)], [(1, 0, 1), (1, 1, 1), (1, 3, 0)]]` },
          { name: "dropped", code: `assert dropped([], 3) == 0 and dropped([4, 4], 4) == 0 and dropped([9, 0, 5, 2], 3) == 8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>direct_time(p, n, alpha, beta)</C> and <C>bruck_time(p, n, alpha, beta)</C> for an all-to-all of n elements
          per rank, and <C>capacity(tokens, experts, factor)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def direct_time(p, n, alpha, beta):
    return 0.0

def bruck_time(p, n, alpha, beta):
    return 0.0

def capacity(tokens, experts, factor):
    return tokens
`,
        solution: COSTS,
        tests: [
          { name: "times", code: `assert abs(direct_time(2, 10, 1, 5) - 2) < 1e-12 and abs(bruck_time(2, 10, 1, 5) - 2) < 1e-12 and abs(bruck_time(5, 10, 1, 5) - 6) < 1e-12
assert abs(direct_time(9, 90, 2, 1) - 96) < 1e-12 and direct_time(1, 50, 3, 1) == 0` },
          { name: "capacity", code: `assert capacity(8, 8, 1.0) == 1 and capacity(9, 8, 1.0) == 2 and capacity(100, 8, 2.0) == 25 and capacity(1, 64, 1.25) == 1` },
        ],
      },
    },
    {
      key: "drop",
      rung: "stretch",
      prompt: (
        <p>
          A batch of 1024 tokens is routed to 8 experts with capacity factor 1.25, and the experts receive 300, 200, 150, 120,
          100, 80, 40 and 34 tokens. How many tokens are dropped?
        </p>
      ),
      answer: { kind: "numeric", value: 180, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the collectives have been defined by what they compute. The next lesson shows how they are computed: the ring
        and tree algorithms that libraries such as NCCL actually run, and why the ring achieves the bandwidth bound for
        all-reduce.
      </p>
    </>
  ),
};
