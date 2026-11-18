import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WorkingSetViz } from "@/components/viz/WorkingSetViz";
import type { LessonContent } from "@/lib/types";

const CHASE = `def sattolo(n, rng):
    p = list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(rng.integers(0, i))
        p[i], p[j] = p[j], p[i]
    return p

def cycle_length(nxt, start):
    i, steps = nxt[start], 1
    while i != start:
        i, steps = nxt[i], steps + 1
    return steps

def chase(nxt, steps):
    i = 0
    for _ in range(steps):
        i = nxt[i]
    return i`;

const MODEL = `import math

def hit_rate(working_set, capacity):
    return min(1.0, capacity / working_set)

def avg_latency(working_set, levels, memory_latency):
    total, covered = 0.0, 0.0
    for capacity, latency in levels:
        h = hit_rate(working_set, capacity)
        total += (h - covered) * latency
        covered = h
    return total + (1 - covered) * memory_latency

def min_repeats(resolution, t_single, rel_error):
    return math.ceil(resolution / (rel_error * t_single))`;

export const lesson: LessonContent = {
  id: "e7.1.3",
  minutes: 45,
  links: {
    requires: ["e7.1.2", "e2.1.3"],
    revisits: ["e3.3.2"],
    foreshadows: ["e7.2.3", "e7.4.3"],
  },

  puzzle: (
    <>
      <p>
        You want to know how long one load from memory takes on your machine. Timing a loop that sums a large array gives
        a fraction of a nanosecond per element, far below the hundred nanoseconds the textbooks quote. Both numbers are
        right: the loop measured something else. How do you build a benchmark that measures exactly the quantity you
        care about, and nothing that the hardware cleverly overlaps or skips?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Hardware hides latency whenever it can: it prefetches the next cache lines of a sequential scan and keeps many
        independent loads in flight. To see the latency, make each load depend on the result of the previous one, and make
        the order unpredictable: follow a chain of pointers through a random cycle. To see bandwidth, do the opposite:
        many independent, sequential loads. Then vary the size of the data and watch the time per access step up each time
        the data outgrows a cache.
      </p>
      <WorkingSetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="microbenchmarks">
        <p>
          A <em>microbenchmark</em> isolates one hardware cost. A pointer chase stores in each slot the index of the next
          slot to visit and runs <C>i = nxt[i]</C> in a loop: each load needs the previous result, so loads cannot overlap,
          and time per step is the load latency. The permutation should be one cycle through every slot, so that the whole
          array is the working set, and random, so that prefetchers cannot guess. Sattolo&apos;s algorithm produces such a
          cycle.
        </p>
        <Code>{CHASE}</Code>
      </Definition>

      <Theorem title="Sattolo’s algorithm makes one cycle">
        <p>
          Sattolo&apos;s algorithm, which swaps each position i from n − 1 down to 1 with a uniformly chosen j &lt; i, produces a
          permutation <M>{"i \\mapsto p_i"}</M> that is a single cycle through all n elements, and each of the (n − 1)! such
          cycles is equally likely.
        </p>
      </Theorem>
      <Proof>
        <p>
          Induction on n; for n = 1 the identity on one element is a cycle. The first swap puts j at position n − 1, so{" "}
          <M>{"n - 1 \\mapsto j"}</M>, and n − 1 at position j. The remaining steps act on positions 0 to n − 2 as Sattolo on n − 1
          elements whose values are those positions with j renamed to n − 1. By induction they form one cycle through those
          positions under the renaming; undoing it, the element k that would map to j maps to n − 1 instead, and n − 1 maps
          to j, which splices n − 1 into the cycle. There are n − 1 choices for j and, by induction, (n − 2)! equally likely
          outcomes for the rest, giving (n − 1)! distinct outcomes, which is the number of n-cycles.
        </p>
      </Proof>

      <Theorem title="random access to a working set">
        <p>
          If each access goes to a uniformly random line of a working set of W lines, independently of the past, then a
          cache holding C of them hits with probability <M>{"\\min(1, C/W)"}</M>, whatever its replacement policy. For nested
          levels with capacities <M>{"C_1 < C_2 < \\cdots"}</M> and latencies <M>{"\\ell_k"}</M>, the mean latency is{" "}
          <MD>{"\\sum_k(h_k - h_{k-1})\\ell_k + (1 - h_K)\\ell_{\\text{mem}}, \\qquad h_k = \\min(1, C_k/W),\\ h_0 = 0."}</MD>
        </p>
      </Theorem>
      <Proof>
        <p>
          The next address is independent of what the cache holds and uniform over W lines, of which C are present when W
          ≥ C. Level k serves exactly the accesses that hit it but miss the smaller levels, whose contents are included in
          it, which has probability <M>{"h_k - h_{k-1}"}</M>. Real caches are set-associative and lines are not uniform, so
          measured steps are less sharp, but the plateaus fall where this model puts them.
        </p>
        <Code>{MODEL}</Code>
      </Proof>

      <Remark title="pitfalls at the hardware level">
        <p>
          A clock with resolution r cannot time a single event of duration t to relative precision better than r/t, so
          time a loop of at least <M>{"r/(\\epsilon t)"}</M> repetitions, as <C>min_repeats</C> computes. Processors change
          their clock speed with load and temperature, so warm up and pin the frequency where you can. Compilers delete
          computations whose results are unused, so make the result observable, as <C>chase</C> does by returning the final
          index. And report the conditions: the size, the access pattern and the machine.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lat",
      rung: "check",
      prompt: <p>With L1 of 32 KB at 1 ns and L2 of 1 MB at 4 ns, and memory at 80 ns, what is the model&apos;s mean latency for a 2 MB working set, in nanoseconds? Give three decimals.</p>,
      answer: { kind: "numeric", value: 41.952, tolerance: 0.0006 },
    },
    {
      key: "cycles",
      rung: "check",
      prompt: <p>How many different single-cycle permutations of 6 elements can Sattolo&apos;s algorithm produce?</p>,
      answer: { kind: "numeric", value: 120, tolerance: 0 },
    },
    {
      key: "seq",
      rung: "apply",
      prompt: <p>Why does a loop that sums a large array sequentially report far less time per element than the memory latency?</p>,
      answer: {
        kind: "choice",
        options: [
          "The loads are independent and predictable, so the hardware prefetches and overlaps many of them, and one 64-byte line serves several elements",
          "The array stays in the L1 cache however large it is",
          "Summation is done by the memory controller",
          "The timer stops while the processor waits for memory",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sattolo(n, rng):
    p = list(range(n))
    for i in range(n - 1, 0, -1):
        j = int(rng.integers(0, i))
        p[i], p[j] = p[j], p[i]
    return p

def cycle_length(nxt, start):
    i, steps = nxt[start], 1
    while i != start:
        i, steps = nxt[i], steps + 1
    return steps

def chase(nxt, steps):
    i = 0
    for _ in range(steps):
        i = nxt[i]
    return i

import numpy as np
p = sattolo(6, np.random.default_rng(0)); print(cycle_length(p, 0), cycle_length([1, 0, 3, 2], 0), chase([2, 0, 1], 4))
print(sorted(p) == list(range(6)), all(p[i] != i for i in range(6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6 2 2\nTrue True", "6 4 2\nTrue True", "6 2 1\nTrue True", "6 2 2\nTrue False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def hit_rate(working_set, capacity):
    return min(1.0, capacity / working_set)

def avg_latency(working_set, levels, memory_latency):
    total, covered = 0.0, 0.0
    for capacity, latency in levels:
        h = hit_rate(working_set, capacity)
        total += (h - covered) * latency
        covered = h
    return total + (1 - covered) * memory_latency

def min_repeats(resolution, t_single, rel_error):
    return math.ceil(resolution / (rel_error * t_single))

levels = [(32e3, 1e-9), (1e6, 4e-9)]; print(hit_rate(16e3, 32e3), hit_rate(64e3, 32e3), round(avg_latency(2e6, levels, 80e-9) * 1e9, 3))
print(min_repeats(1e-6, 3e-8, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.5 41.952\n3334", "0.5 0.5 41.952\n3334", "1.0 0.5 40.0\n3334", "1.0 0.5 41.952\n3333"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sattolo(n, rng)</C>, drawing j with <C>rng.integers(0, i)</C> for i from n − 1 down to 1;{" "}
          <C>cycle_length(nxt, start)</C>, the number of steps to return to start; and <C>chase(nxt, steps)</C>, the index
          reached from 0 after the given number of steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sattolo(n, rng):
    return list(range(n))

def cycle_length(nxt, start):
    return len(nxt)

def chase(nxt, steps):
    return 0
`,
        solution: CHASE,
        tests: [
          { name: "cycles", code: `import numpy as np
for n in [2, 5, 50]:
    p = sattolo(n, np.random.default_rng(n)); assert sorted(p) == list(range(n)) and cycle_length(p, 0) == n and cycle_length(p, n - 1) == n
assert cycle_length([1, 0, 3, 2], 2) == 2 and cycle_length([0], 0) == 1 and chase([2, 0, 1], 4) == 2 and chase([2, 0, 1], 0) == 0` },
          { name: "uniform", code: `import numpy as np
from collections import Counter
rng = np.random.default_rng(0); c = Counter(tuple(sattolo(4, rng)) for _ in range(6000))
assert len(c) == 6 and min(c.values()) > 850
r = np.random.default_rng(7); q = list(range(5)); js = []
for i in range(4, 0, -1):
    j = int(r.integers(0, i)); q[i], q[j] = q[j], q[i]
assert sattolo(5, np.random.default_rng(7)) == q` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hit_rate(working_set, capacity)</C>; <C>avg_latency(working_set, levels, memory_latency)</C> for nested
          levels given as (capacity, latency) pairs from smallest to largest; and{" "}
          <C>min_repeats(resolution, t_single, rel_error)</C>, the smallest whole number of repetitions that keeps the
          resolution below rel_error of the total time.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def hit_rate(working_set, capacity):
    return 1.0

def avg_latency(working_set, levels, memory_latency):
    return memory_latency

def min_repeats(resolution, t_single, rel_error):
    return 1
`,
        solution: MODEL,
        tests: [
          { name: "model", code: `levels = [(32e3, 1e-9), (1e6, 4e-9)]
assert hit_rate(16e3, 32e3) == 1.0 and hit_rate(64e3, 32e3) == 0.5 and abs(avg_latency(2e6, levels, 80e-9) - 41.952e-9) < 1e-15
assert abs(avg_latency(1e3, levels, 80e-9) - 1e-9) < 1e-18 and abs(avg_latency(1e12, levels, 80e-9) - 80e-9) < 1e-12
assert abs(avg_latency(500e3, levels, 80e-9) - (0.064e-9 + 0.936 * 4e-9)) < 1e-15` },
          { name: "repeats", code: `assert min_repeats(1e-6, 3e-8, 0.01) == 3334 and min_repeats(1e-9, 1.0, 0.5) == 1 and min_repeats(1e-3, 1e-6, 0.1) >= 10000` },
        ],
      },
    },
    {
      key: "mid",
      rung: "stretch",
      prompt: <p>In the same model (32 KB at 1 ns, 1 MB at 4 ns, memory at 80 ns), what working-set size in megabytes gives a mean latency of exactly 20 ns? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.268, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Measuring tells us what the hardware does; the next chapter explains how a CPU core manages it, starting with the
        pipeline that lets it work on many instructions at once.
      </p>
    </>
  ),
};
