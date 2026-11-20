import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpmdStencilViz } from "@/components/viz/SpmdStencilViz";
import type { LessonContent } from "@/lib/types";

const HALO = `def split(xs, p):
    q, r = divmod(len(xs), p)
    out, start = [], 0
    for rank in range(p):
        stop = start + q + (1 if rank < r else 0)
        out.append(xs[start:stop])
        start = stop
    return out

def exchange(blocks, bc):
    padded = []
    for r, b in enumerate(blocks):
        left = blocks[r - 1][-1] if r > 0 else bc
        right = blocks[r + 1][0] if r + 1 < len(blocks) else bc
        padded.append([left] + b + [right])
    return padded

def jacobi_spmd(xs, p, steps, bc):
    blocks = split(xs, p)
    for _ in range(steps):
        blocks = [[(b[i - 1] + b[i + 1]) / 2 for i in range(1, len(b) - 1)] for b in exchange(blocks, bc)]
    return [x for b in blocks for x in b]`;

const BSP = `def superstep_time(work, words, g, l):
    return max(work) + g * max(words) + l

def imbalance(work):
    return max(work) / (sum(work) / len(work))

def efficiency(t_serial, t_parallel, p):
    return t_serial / (p * t_parallel)`;

export const lesson: LessonContent = {
  id: "e8.1.3",
  minutes: 45,
  links: {
    requires: ["e8.1.2"],
    revisits: ["e8.1.1"],
    foreshadows: ["e8.2.1"],
  },

  puzzle: (
    <>
      <p>
        A simulation of heat along a rod updates each point from its two neighbours. Split the rod across four processes and
        each needs, at every step, values that live in another process&apos;s memory. Writing four different programs, one per
        process, would be unmanageable at a thousand processes. How is such a program actually written, and does splitting
        the rod change the answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write one program and run a copy of it on every process. Each copy asks two questions, &quot;how many of us are
        there?&quot; and &quot;which one am I?&quot;, and uses the answers to pick its share of the data and its neighbours. This
        is <em>single program, multiple data</em>. For the rod, each copy keeps a block of points plus one extra
        &quot;ghost&quot; point at each end, refreshed from the neighbour before every step. With the ghosts filled in, each
        copy computes exactly what the serial program would have computed for those points.
      </p>
      <SpmdStencilViz />
    </>
  ),

  theory: (
    <>
      <Definition title="single program, multiple data">
        <p>
          In SPMD every process runs the same program, parameterised by its rank r and the number of processes p (the world
          size). Data is partitioned by rank, and differences in behaviour come from branches on r, such as letting rank 0
          read the input or print the result. Launchers such as <C>mpirun</C> and <C>torchrun</C> start p copies and tell each
          its rank; within a GPU, the same idea runs one kernel on thousands of threads, each with its own index (e7.3.1).
        </p>
      </Definition>

      <Definition title="domain decomposition with halos">
        <p>
          For a stencil, where each point is updated from its neighbours, each rank owns a contiguous block (<C>split</C>) and
          pads it with ghost cells holding copies of the neighbouring ranks&apos; boundary values, or the boundary condition at
          the ends of the domain (<C>exchange</C>). In a real program the exchange is a pair of messages per internal boundary;
          here it reads the neighbouring list. <C>jacobi_spmd</C> then applies the Jacobi update{" "}
          <M>{"u_i \\leftarrow (u_{i-1} + u_{i+1})/2"}</M> to every block independently.
        </p>
        <Code>{HALO}</Code>
      </Definition>

      <Theorem title="decomposition does not change the result">
        <p>
          For any p with 1 ≤ p ≤ n, <C>jacobi_spmd(xs, p, steps, bc)</C> returns exactly the same floating-point values as the
          serial update with p = 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on the number of steps. If after t steps the concatenated blocks equal the serial vector, then every
          ghost cell holds the value that the serial update would read at that position: an interior neighbour&apos;s boundary
          value, or bc at the ends. Each new value is then the same two floats added and halved in the same order, so it is
          bitwise identical. Reductions differ here: a sum split across ranks adds in a different order, and since floating-point
          addition is not associative (e3.1.2), its result can differ in the last bits.
        </p>
      </Proof>

      <Definition title="bulk synchronous parallel">
        <p>
          (Valiant, 1990.) Many SPMD programs proceed in <em>supersteps</em>: every rank computes on local data, then exchanges
          messages, then all wait at a barrier. If rank i does work <M>{"w_i"}</M> and sends or receives at most{" "}
          <M>{"h_i"}</M> words, a superstep costs
        </p>
        <MD>{"\\max_i w_i + g\\max_i h_i + l,"}</MD>
        <p>
          where g is the time per word and l the cost of the barrier. Every rank waits for the slowest, so imbalance, the ratio
          of the largest load to the mean, is wasted time on all the others; parallel efficiency is the serial time divided by
          p times the parallel time.
        </p>
        <Code>{BSP}</Code>
      </Definition>

      <Remark title="SPMD in training">
        <p>
          Data-parallel training is SPMD: each of p copies of the training script loads a different shard of the batch,
          computes gradients on it, and joins a collective that averages them (e8.2.2). A rank that is slow because of a bad
          node or a longer sequence holds every other rank at the next collective, which is why imbalance is watched closely at
          scale.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          Four ranks do 8, 10, 6 and 10 ms of work in a superstep, the busiest sends 1000 words at g = 0.002 ms per word, and the
          barrier costs l = 0.5 ms. How many milliseconds does the superstep take?
        </p>
      ),
      answer: { kind: "numeric", value: 12.5, tolerance: 0.0001 },
    },
    {
      key: "imb",
      rung: "check",
      prompt: <p>What is the imbalance (largest load divided by the mean) of loads 8, 10, 6 and 10? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.1765, tolerance: 0.0001 },
    },
    {
      key: "ghost",
      rung: "apply",
      prompt: <p>Why does each rank in the stencil program keep ghost cells?</p>,
      answer: {
        kind: "choice",
        options: [
          "To hold copies of the neighbouring ranks' boundary values, so that the update of its own edge points can be computed locally",
          "To store a backup of its block in case it fails",
          "To make every block the same length",
          "To hold the partial sums of a global reduction",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split(xs, p):
    q, r = divmod(len(xs), p)
    out, start = [], 0
    for rank in range(p):
        stop = start + q + (1 if rank < r else 0)
        out.append(xs[start:stop])
        start = stop
    return out

def exchange(blocks, bc):
    padded = []
    for r, b in enumerate(blocks):
        left = blocks[r - 1][-1] if r > 0 else bc
        right = blocks[r + 1][0] if r + 1 < len(blocks) else bc
        padded.append([left] + b + [right])
    return padded

def jacobi_spmd(xs, p, steps, bc):
    blocks = split(xs, p)
    for _ in range(steps):
        blocks = [[(b[i - 1] + b[i + 1]) / 2 for i in range(1, len(b) - 1)] for b in exchange(blocks, bc)]
    return [x for b in blocks for x in b]

print(split([1, 2, 3, 4, 5, 6, 7], 3), exchange([[1, 2], [3], [4, 5]], 0))
print(jacobi_spmd([0.0, 4.0, 0.0, 4.0], 2, 1, 0.0), jacobi_spmd([0.0, 4.0, 0.0, 4.0], 4, 2, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 2, 3], [4, 5], [6, 7]] [[0, 1, 2, 3], [2, 3, 4], [3, 4, 5, 0]]\n[2.0, 0.0, 4.0, 0.0] [0.5, 3.25, 0.25, 2.5]",
          "[[1, 2], [3, 4], [5, 6, 7]] [[0, 1, 2, 3], [2, 3, 4], [3, 4, 5, 0]]\n[2.0, 0.0, 4.0, 0.0] [0.5, 3.25, 0.25, 2.5]",
          "[[1, 2, 3], [4, 5], [6, 7]] [[0, 1, 2, 0], [0, 3, 0], [0, 4, 5, 0]]\n[2.0, 0.0, 2.0, 0.0] [0.5, 3.25, 0.25, 2.5]",
          "[[1, 2, 3], [4, 5], [6, 7]] [[0, 1, 2, 3], [2, 3, 4], [3, 4, 5, 0]]\n[2.0, 0.0, 4.0, 0.0] [1.5, 3.25, 0.25, 2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def superstep_time(work, words, g, l):
    return max(work) + g * max(words) + l

def imbalance(work):
    return max(work) / (sum(work) / len(work))

def efficiency(t_serial, t_parallel, p):
    return t_serial / (p * t_parallel)

print(superstep_time([3, 5, 4], [10, 2, 6], 0.5, 7), imbalance([3, 5, 4]))
print(efficiency(120, 20, 8), efficiency(120, superstep_time([12] * 10, [4] * 10, 1, 4), 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "17.0 1.25\n0.75 0.6",
          "12.0 1.25\n0.75 0.6",
          "17.0 0.8\n0.75 0.6",
          "17.0 1.25\n6.0 0.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split(xs, p)</C> into p contiguous blocks, the first <C>len(xs) % p</C> one longer; <C>exchange(blocks, bc)</C>,
          padding each block with its neighbours&apos; boundary values and <C>bc</C> at the two ends of the domain; and{" "}
          <C>jacobi_spmd(xs, p, steps, bc)</C>, which applies the update to every padded block and returns the joined list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def split(xs, p):
    return [xs]

def exchange(blocks, bc):
    return blocks

def jacobi_spmd(xs, p, steps, bc):
    return xs
`,
        solution: HALO,
        tests: [
          { name: "split", code: `assert split(list(range(5)), 5) == [[0], [1], [2], [3], [4]] and split([1, 2, 3], 1) == [[1, 2, 3]] and split([], 2) == [[], []]
assert split(list(range(7)), 3) == [[0, 1, 2], [3, 4], [5, 6]]
assert exchange([[1]], 9) == [[9, 1, 9]] and exchange([[1, 2], [3, 4]], -1) == [[-1, 1, 2, 3], [2, 3, 4, -1]]` },
          { name: "jacobi", code: `assert jacobi_spmd([1.0, 2.0, 3.0, 4.0, 5.0], 2, 3, 0.0) == [1.0, 2.0, 2.25, 2.5, 1.25]
import random
r = random.Random(1)
xs = [r.random() for _ in range(13)]
s = jacobi_spmd(xs, 1, 7, 0.3)
assert s != xs and all(jacobi_spmd(xs, p, 7, 0.3) == s for p in range(1, 9))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>superstep_time(work, words, g, l)</C>, <C>imbalance(work)</C> (the largest load over the mean) and{" "}
          <C>efficiency(t_serial, t_parallel, p)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def superstep_time(work, words, g, l):
    return 0

def imbalance(work):
    return 1.0

def efficiency(t_serial, t_parallel, p):
    return 1.0
`,
        solution: BSP,
        tests: [
          { name: "superstep", code: `assert superstep_time([1], [0], 5, 2) == 3 and abs(superstep_time([8, 10, 6], [3, 9, 1], 0.5, 1) - 15.5) < 1e-12` },
          { name: "ratios", code: `assert imbalance([2, 2, 2]) == 1.0 and imbalance([0, 0, 6]) == 3.0 and abs(efficiency(100, 50, 4) - 0.5) < 1e-12
assert abs(efficiency(90, 10, 9) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "halo",
      rung: "stretch",
      prompt: (
        <p>
          The rod is split over 6 ranks and the program runs 25 steps, exchanging one value in each direction across every
          internal boundary at every step. How many values are exchanged in all?
        </p>
      ),
      answer: { kind: "numeric", value: 250, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The halo exchange involves only neighbours. Many computations need every rank to contribute to, or receive, one
        result: the total loss, the averaged gradient, the new parameters. These patterns are common enough to have names and
        carefully tuned implementations, the collectives of the next part.
      </p>
    </>
  ),
};
