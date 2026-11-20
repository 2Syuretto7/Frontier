import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BroadcastTreeViz } from "@/components/viz/BroadcastTreeViz";
import type { LessonContent } from "@/lib/types";

const TREES = `def binomial_broadcast(p, root):
    rounds, step = [], 1
    while step < p:
        rounds.append([((root + s) % p, (root + s + step) % p) for s in range(step) if s + step < p])
        step *= 2
    return rounds

def run_broadcast(rounds, p, root, value):
    data = [None] * p
    data[root] = value
    for rnd in rounds:
        for src, dst in rnd:
            data[dst] = data[src]
    return data

def tree_reduce(values, op):
    vals, step = list(values), 1
    while step < len(vals):
        for i in range(0, len(vals) - step, 2 * step):
            vals[i] = op(vals[i], vals[i + step])
        step *= 2
    return vals[0]`;

const COSTS = `import math

def linear_time(p, n, alpha, beta):
    return (p - 1) * (alpha + n / beta)

def tree_time(p, n, alpha, beta):
    return math.ceil(math.log2(p)) * (alpha + n / beta)

def pipelined_time(p, n, k, alpha, beta):
    return (p - 2 + k) * (alpha + n / (k * beta))`;

export const lesson: LessonContent = {
  id: "e8.2.1",
  minutes: 45,
  links: {
    requires: ["e8.1.3"],
    revisits: ["e8.1.1", "e3.1.2"],
    foreshadows: ["e8.2.2", "e8.2.4", "e8.2.5"],
  },

  puzzle: (
    <>
      <p>
        At the start of training, rank 0 has initialised the model and a thousand other ranks need an exact copy. If rank 0
        sends the weights to each in turn, the last rank waits for 999 transfers. Yet every rank that has received the weights
        is now idle and holds a perfect copy. How quickly can everyone be served if the ranks help each other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let every rank that has the data pass it on. After one round two ranks have it, after two rounds four, after three
        eight: the number of holders doubles, so p ranks are served in about log₂ p rounds instead of p − 1. The same tree, run
        in reverse, combines a value from every rank into one: pairs add their values, then pairs of pairs, until the total
        reaches the root. These two operations, broadcast and reduce, are the simplest <em>collectives</em>: operations that
        every rank in a group calls together.
      </p>
      <BroadcastTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="collectives">
        <p>
          A collective operation is called by every rank of a group, and its result is defined in terms of all of their inputs.
          In a <em>broadcast</em> the root&apos;s buffer is copied to every rank. In a <em>reduce</em> each rank contributes a value
          and the root receives their combination under an operation ⊕ such as sum or max. Their relatives scatter (the root
          sends a different piece to each rank) and gather (the root collects one piece from each) move data without combining
          it.
        </p>
      </Definition>

      <Definition title="the binomial tree">
        <p>
          <C>binomial_broadcast(p, root)</C> lists the transfers round by round: in the round with stride s = 1, 2, 4, …, each
          of the first s ranks counted from the root sends to the rank s further on, if that exists. <C>run_broadcast</C>
          carries out a schedule, and <C>tree_reduce</C> runs the same pattern in reverse, combining the value at i with the
          value at i + s.
        </p>
        <Code>{TREES}</Code>
      </Definition>

      <Theorem title="broadcast needs ⌈log₂ p⌉ rounds">
        <p>
          If in each round every rank can send at most one message, then broadcasting to p ranks needs at least{" "}
          <M>{"\\lceil\\log_2 p\\rceil"}</M> rounds, and the binomial tree achieves this.
        </p>
      </Theorem>
      <Proof>
        <p>
          Only a rank that holds the value can send it, and each holder sends to at most one new rank per round, so the number
          of holders at most doubles: after k rounds at most <M>{"2^k"}</M> ranks hold it, which is at least p only when{" "}
          <M>{"k \\ge \\log_2 p"}</M>. In the binomial tree the holders before the round with stride s are exactly the first s
          ranks from the root, and each of them sends to a distinct new rank while one exists, so after that round the first{" "}
          <M>{"\\min(2s, p)"}</M> ranks hold the value; it therefore finishes after <M>{"\\lceil\\log_2 p\\rceil"}</M> rounds.
        </p>
      </Proof>

      <Remark title="the order of a reduction">
        <p>
          A tree reduction computes <M>{"(v_0 \\oplus v_1) \\oplus (v_2 \\oplus v_3)"}</M> rather than the serial{" "}
          <M>{"((v_0 \\oplus v_1) \\oplus v_2) \\oplus v_3"}</M>. The two agree for every input only if ⊕ is associative, which sum,
          product, max and min are and subtraction and division are not. Floating-point addition is associative only
          approximately (e3.1.2), so a reduction over a different number of ranks can change the last bits of a sum, one source of
          non-determinism in distributed training.
        </p>
      </Remark>

      <Definition title="the cost of a broadcast">
        <p>
          With the α–β model of a message (e8.1.2), sending n bytes from the root to each rank in turn costs{" "}
          <M>{"(p - 1)(\\alpha + n/\\beta)"}</M> (<C>linear_time</C>), and the binomial tree{" "}
          <M>{"\\lceil\\log_2 p\\rceil(\\alpha + n/\\beta)"}</M> (<C>tree_time</C>). For large n both are dominated by the
          bandwidth term, and the tree still pays it log p times. Splitting the data into k chunks and passing them down a chain
          of ranks, each forwarding chunk j while it receives chunk j + 1, costs{" "}
          <M>{"(p - 2 + k)(\\alpha + n/(k\\beta))"}</M> (<C>pipelined_time</C>), which approaches n/β, independent of p, when k
          is large but not so large that the latencies dominate.
        </p>
        <Code>{COSTS}</Code>
      </Definition>

      <Remark title="in practice">
        <p>
          MPI provides <C>MPI_Bcast</C> and <C>MPI_Reduce</C>, and <C>torch.distributed</C> offers <C>broadcast</C> and{" "}
          <C>reduce</C>; a training script typically broadcasts the initial weights from rank 0 so that every replica starts
          identical. Libraries such as NCCL choose between trees, chains and rings according to the message size and the
          topology of the machine (e8.2.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rounds",
      rung: "check",
      prompt: <p>How many rounds does a binomial-tree broadcast need for 100 ranks?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          A binomial-tree broadcast sends 1 MB (10⁶ bytes) to 32 ranks, with α = 10 µs and β = 10¹⁰ bytes per second. How
          many microseconds does it take?
        </p>
      ),
      answer: { kind: "numeric", value: 550, tolerance: 0.001 },
    },
    {
      key: "assoc",
      rung: "apply",
      prompt: <p>For which operation does a tree reduction always give the same result as a left-to-right serial reduction, whatever the number of ranks?</p>,
      answer: {
        kind: "choice",
        options: [
          "Taking the maximum of integers",
          "Subtracting integers",
          "Dividing real numbers",
          "Adding floating-point numbers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def binomial_broadcast(p, root):
    rounds, step = [], 1
    while step < p:
        rounds.append([((root + s) % p, (root + s + step) % p) for s in range(step) if s + step < p])
        step *= 2
    return rounds

def run_broadcast(rounds, p, root, value):
    data = [None] * p
    data[root] = value
    for rnd in rounds:
        for src, dst in rnd:
            data[dst] = data[src]
    return data

def tree_reduce(values, op):
    vals, step = list(values), 1
    while step < len(vals):
        for i in range(0, len(vals) - step, 2 * step):
            vals[i] = op(vals[i], vals[i + step])
        step *= 2
    return vals[0]

print(binomial_broadcast(6, 0), binomial_broadcast(4, 2))
print(run_broadcast(binomial_broadcast(5, 1), 5, 1, 'x'), tree_reduce([10, 1, 2, 3], lambda x, y: x - y), tree_reduce([3, 1, 4, 1, 5], max))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[(0, 1)], [(0, 2), (1, 3)], [(0, 4), (1, 5)]] [[(2, 3)], [(2, 0), (3, 1)]]\n['x', 'x', 'x', 'x', 'x'] 10 5",
          "[[(0, 1)], [(0, 2), (1, 3)], [(0, 4), (1, 5)]] [[(2, 3)], [(2, 0), (3, 1)]]\n['x', 'x', 'x', 'x', 'x'] 4 5",
          "[[(0, 1)], [(0, 2), (1, 3)], [(0, 4), (1, 5), (2, 6), (3, 7)]] [[(2, 3)], [(2, 0), (3, 1)]]\n['x', 'x', 'x', 'x', 'x'] 10 5",
          "[[(0, 1)], [(0, 2), (1, 3)], [(0, 4), (1, 5)]] [[(2, 3)], [(2, 4), (3, 5)]]\n[None, 'x', 'x', 'x', 'x'] 10 5",
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

def linear_time(p, n, alpha, beta):
    return (p - 1) * (alpha + n / beta)

def tree_time(p, n, alpha, beta):
    return math.ceil(math.log2(p)) * (alpha + n / beta)

def pipelined_time(p, n, k, alpha, beta):
    return (p - 2 + k) * (alpha + n / (k * beta))

print(linear_time(8, 100, 1, 10), tree_time(8, 100, 1, 10), tree_time(9, 100, 1, 10))
print(pipelined_time(8, 100, 1, 1, 10), pipelined_time(8, 100, 10, 1, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "77.0 33.0 44.0\n77.0 32.0",
          "77.0 33.0 33.0\n77.0 32.0",
          "77.0 33.0 44.0\n77.0 170.0",
          "88.0 33.0 44.0\n77.0 32.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binomial_broadcast(p, root)</C>, returning the rounds of <C>(src, dst)</C> pairs described above in absolute
          ranks; <C>run_broadcast(rounds, p, root, value)</C>, returning every rank&apos;s data with <C>None</C> for ranks never
          reached; and <C>tree_reduce(values, op)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def binomial_broadcast(p, root):
    return [[(root, d)] for d in range(p) if d != root]

def run_broadcast(rounds, p, root, value):
    return [value] * p

def tree_reduce(values, op):
    result = values[0]
    for v in values[1:]:
        result = op(result, v)
    return result
`,
        solution: TREES,
        tests: [
          { name: "broadcast", code: `assert binomial_broadcast(1, 0) == [] and binomial_broadcast(3, 2) == [[(2, 0)], [(2, 1)]]
assert binomial_broadcast(7, 5) == [[(5, 6)], [(5, 0), (6, 1)], [(5, 2), (6, 3), (0, 4)]]
assert run_broadcast([[(0, 2)], [(2, 1)]], 3, 0, 'v') == ['v', 'v', 'v'] and run_broadcast([], 2, 1, 4) == [None, 4]
for p in range(1, 20):
    for root in range(p):
        assert run_broadcast(binomial_broadcast(p, root), p, root, 7) == [7] * p` },
          { name: "reduce", code: `assert tree_reduce(['a', 'b', 'c', 'd', 'e'], lambda x, y: x + y) == 'abcde' and tree_reduce([5], max) == 5
assert tree_reduce([8, 4, 2, 2], lambda x, y: x / y) == 2.0 and tree_reduce([2, 3, 4], lambda x, y: x ** y) == 4096` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linear_time(p, n, alpha, beta)</C>, <C>tree_time(p, n, alpha, beta)</C> and{" "}
          <C>pipelined_time(p, n, k, alpha, beta)</C> for the three broadcasts above.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def linear_time(p, n, alpha, beta):
    return 0.0

def tree_time(p, n, alpha, beta):
    return 0.0

def pipelined_time(p, n, k, alpha, beta):
    return 0.0
`,
        solution: COSTS,
        tests: [
          { name: "linear and tree", code: `assert abs(linear_time(5, 10, 2, 5) - 16) < 1e-12 and abs(tree_time(5, 10, 2, 5) - 12) < 1e-12 and abs(tree_time(2, 10, 2, 5) - 4) < 1e-12
assert abs(tree_time(64, 0, 3, 1) - 18) < 1e-12` },
          { name: "pipelined", code: `assert abs(pipelined_time(5, 10, 2, 2, 5) - 15) < 1e-12 and abs(pipelined_time(2, 8, 4, 1, 2) - 8) < 1e-12
assert abs(pipelined_time(6, 12, 1, 1, 1) - linear_time(2, 12, 1, 1) * 5) < 1e-12` },
        ],
      },
    },
    {
      key: "chunks",
      rung: "stretch",
      prompt: (
        <p>
          A pipelined broadcast runs over a chain of 10 ranks, with α = 1 µs and n/β = 200 µs. Which whole number of chunks k
          gives the smallest <C>pipelined_time</C>?
        </p>
      ),
      answer: { kind: "numeric", value: 40, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Training needs more than a sum at one root: every rank needs the averaged gradient. The next lesson combines reduce
        and broadcast into all-reduce, and splits it into the two halves, reduce-scatter and all-gather, that sharded
        training uses on their own.
      </p>
    </>
  ),
};
