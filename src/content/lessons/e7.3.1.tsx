import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WarpDivergenceViz } from "@/components/viz/WarpDivergenceViz";
import type { LessonContent } from "@/lib/types";

const GRID = `def grid_size(n, block_dim):
    return -(-n // block_dim)

def coords(i, block_dim, warp=32):
    return i // block_dim, i % block_dim // warp, i % warp

def wave_efficiency(blocks, sms, per_sm):
    slots = sms * per_sm
    waves = -(-blocks // slots)
    return blocks / (waves * slots)`;

const SIMT = `def warps_of(conds, warp=32):
    return [conds[i:i + warp] for i in range(0, len(conds), warp)]

def simt_cycles(conds, cost_if, cost_else, warp=32):
    total = 0
    for w in warps_of(conds, warp):
        total += cost_if * any(w) + cost_else * (not all(w))
    return total

def lane_efficiency(conds, cost_if, cost_else, warp=32):
    useful = sum(cost_if if c else cost_else for c in conds)
    return useful / (simt_cycles(conds, cost_if, cost_else, warp) * warp)`;

export const lesson: LessonContent = {
  id: "e7.3.1",
  minutes: 55,
  links: {
    requires: ["e7.2.2"],
    revisits: ["e7.2.1", "e7.1.2"],
    foreshadows: ["e7.3.2", "e7.3.4"],
  },

  puzzle: (
    <>
      <p>
        A kernel processes 1000 tiles on a GPU with 108 multiprocessors, two tiles at a time per multiprocessor. You make
        the work slightly larger, 1081 tiles instead of 1000, and the run time jumps by a fifth. A different kernel gets
        more than half again as slow when you add an <C>if</C> that is true for only one element in thirty. Neither effect would happen on
        a CPU. What is it about the way a GPU runs threads?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A GPU runs a program as a huge number of threads, but it does not run them one by one. Threads come in groups of
        32, called warps, that share one instruction stream: at each step the warp issues one instruction and all 32 lanes
        execute it, like the SIMD lanes of a CPU but with each lane written as if it were its own thread. When lanes of a
        warp disagree at a branch, the warp runs both sides in turn, switching off the lanes that should not take part.
        Larger groups of threads, blocks, are handed to the multiprocessors in rounds, and the last round may leave most of
        the chip idle.
      </p>
      <WarpDivergenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the GPU execution model">
        <p>
          A GPU has many <em>streaming multiprocessors</em> (SMs): 108 on an A100, 132 on an H100. A kernel is launched as a{" "}
          <em>grid</em> of <em>blocks</em>, each of up to 1024 <em>threads</em>. A block runs entirely on one SM, which can
          hold several blocks at once (up to 2048 threads on recent GPUs), and its threads can share fast memory and
          synchronise. The SM splits each block into <em>warps</em> of 32 consecutive threads and issues instructions one warp
          at a time; this is <em>SIMT</em>, single instruction multiple threads. Thread i of block j handles element{" "}
          <M>{"jB + i"}</M>, where B is the block size, and must check that this index is inside the data.
        </p>
        <Code>{GRID}</Code>
      </Definition>

      <Theorem title="grid size">
        <p>
          To give each of n elements its own thread with blocks of B threads, the smallest grid has{" "}
          <M>{"\\lceil n/B \\rceil"}</M> blocks, and fewer than B of its threads are idle.
        </p>
      </Theorem>
      <Proof>
        <p>
          g blocks provide gB threads, and <M>{"gB \\ge n"}</M> exactly when <M>{"g \\ge n/B"}</M>; the smallest whole such g is
          the ceiling. With that g, <M>{"(g - 1)B < n"}</M>, so the idle threads number <M>{"gB - n < B"}</M>. In code,{" "}
          <C>-(-n // B)</C> computes the ceiling exactly with integers.
        </p>
      </Proof>

      <Theorem title="waves and the tail effect">
        <p>
          If an SM holds k blocks at a time, there are S SMs, and all blocks take the same time, then g blocks run in{" "}
          <M>{"\\lceil g / (kS) \\rceil"}</M> waves, and the fraction of block slots doing work is
        </p>
        <MD>{"\\frac{g}{kS\\,\\lceil g/(kS) \\rceil}."}</MD>
      </Theorem>
      <Proof>
        <p>
          At most kS blocks run at once, so each wave finishes at most kS blocks, and with equal times the scheduler fills
          every slot in every wave but the last. That gives the number of waves, and the time is proportional to it while the
          useful work is proportional to g. With 1000 blocks on 108 SMs holding 2 each, there are 5 waves of 216 slots and
          the efficiency is 1000/1080; with 1081 blocks there are 6 waves, which is the jump in the puzzle. Libraries choose
          tile sizes partly to avoid such tails.
        </p>
      </Proof>

      <Theorem title="cost of a divergent branch">
        <p>
          Let a warp run <C>if c: A else: B</C>, with A costing a cycles and B costing b. The warp issues
        </p>
        <MD>{"a\\,[\\text{some lane has } c] + b\\,[\\text{some lane lacks } c]"}</MD>
        <p>
          cycles. If each of the 32 lanes takes A independently with probability q, the expected cost is{" "}
          <M>{"a(1 - (1-q)^{32}) + b(1 - q^{32})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A warp has one instruction stream. If any lane needs A, the warp issues A&apos;s instructions with the other lanes
          masked off, and likewise for B; when all lanes agree, the other side is skipped. The probability that some lane
          takes A is one minus the probability that none does, <M>{"(1-q)^{32}"}</M>, and similarly for B. Even with q = 0.03,
          the probability that a warp runs A is about 0.62, which is how a rare condition halves throughput.
        </p>
        <Code>{SIMT}</Code>
      </Proof>

      <Example title="avoiding divergence">
        <p>
          Make the condition uniform across each warp where possible: branch on the block or warp index rather than the
          thread index, sort or bucket the data so that similar elements are adjacent, or handle the rare case in a separate
          pass. Short branches can be replaced with arithmetic, as <C>max(x, 0)</C> replaces <C>if x &lt; 0</C>; the compiler
          often does this itself through predication.
        </p>
      </Example>

      <Remark title="why so many threads">
        <p>
          A CPU core hides memory latency with large caches and out-of-order execution. An SM hides it by keeping dozens of
          warps resident and switching to another warp in the next cycle whenever one waits for memory, at no cost, because
          every warp has its own registers. So a GPU needs far more threads than it has lanes; how many it can keep resident
          is the subject of occupancy, later in this chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "grid",
      rung: "check",
      prompt: <p>How many blocks of 256 threads are needed to give each of a million elements its own thread?</p>,
      answer: { kind: "numeric", value: 3907, tolerance: 0 },
    },
    {
      key: "waves",
      rung: "check",
      prompt: <p>A kernel has 1000 equal blocks on 108 SMs, each holding 2 blocks at a time. What fraction of block slots does useful work? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.926, tolerance: 0.0006 },
    },
    {
      key: "branch",
      rung: "apply",
      prompt: <p>In a warp, 16 lanes take the <C>if</C> side (10 cycles) and 16 take the <C>else</C> side (10 cycles). How long does the warp spend on the branch, and why?</p>,
      answer: {
        kind: "choice",
        options: [
          "20 cycles: the warp has one instruction stream, so it runs each side in turn with the other lanes masked off",
          "10 cycles: the two halves run in parallel",
          "5 cycles: each lane does only half the work",
          "320 cycles: each thread runs separately",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def grid_size(n, block_dim):
    return -(-n // block_dim)

def coords(i, block_dim, warp=32):
    return i // block_dim, i % block_dim // warp, i % warp

def wave_efficiency(blocks, sms, per_sm):
    slots = sms * per_sm
    waves = -(-blocks // slots)
    return blocks / (waves * slots)

print(grid_size(1000, 256), grid_size(1024, 256), coords(300, 256), coords(77, 64))
print(round(wave_efficiency(1000, 108, 2), 3), wave_efficiency(216, 108, 2), round(wave_efficiency(217, 108, 2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 4 (1, 1, 12) (1, 0, 13)\n0.926 1.0 0.502",
          "4 5 (1, 1, 12) (1, 0, 13)\n0.926 1.0 0.502",
          "4 4 (1, 0, 12) (1, 0, 13)\n0.926 1.0 0.502",
          "4 4 (1, 1, 12) (1, 0, 13)\n0.926 1.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def warps_of(conds, warp=32):
    return [conds[i:i + warp] for i in range(0, len(conds), warp)]

def simt_cycles(conds, cost_if, cost_else, warp=32):
    total = 0
    for w in warps_of(conds, warp):
        total += cost_if * any(w) + cost_else * (not all(w))
    return total

def lane_efficiency(conds, cost_if, cost_else, warp=32):
    useful = sum(cost_if if c else cost_else for c in conds)
    return useful / (simt_cycles(conds, cost_if, cost_else, warp) * warp)

alt = [i % 2 == 0 for i in range(128)]; low = [i < 48 for i in range(128)]
print(simt_cycles(alt, 4, 4), simt_cycles(low, 4, 4), lane_efficiency(alt, 4, 4), lane_efficiency(low, 4, 4))
print(simt_cycles(sorted(alt), 4, 4), simt_cycles([True] * 40, 3, 5), simt_cycles([False] * 40, 3, 5, warp=8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "32 20 0.5 0.8\n16 6 25",
          "16 20 1.0 0.8\n16 6 25",
          "32 24 0.5 0.667\n16 6 25",
          "32 20 0.5 0.8\n32 8 25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid_size(n, block_dim)</C>; <C>coords(i, block_dim, warp=32)</C>, returning the block, the warp within the
          block and the lane within the warp of global thread i; and <C>wave_efficiency(blocks, sms, per_sm)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def grid_size(n, block_dim):
    return n // block_dim

def coords(i, block_dim, warp=32):
    return 0, 0, i

def wave_efficiency(blocks, sms, per_sm):
    return 1.0
`,
        solution: GRID,
        tests: [
          { name: "grid", code: `assert grid_size(1000, 256) == 4 and grid_size(1024, 256) == 4 and grid_size(10 ** 6, 256) == 3907 and grid_size(1, 1024) == 1 and grid_size(0, 128) == 0
assert grid_size(10 ** 18 + 1, 1024) == 10 ** 18 // 1024 + 1, 'Use integer arithmetic for the ceiling.'
assert coords(300, 256) == (1, 1, 12) and coords(77, 64) == (1, 0, 13) and coords(31, 128) == (0, 0, 31) and coords(40, 96, warp=16) == (0, 2, 8)` },
          { name: "waves", code: `assert abs(wave_efficiency(1000, 108, 2) - 1000 / 1080) < 1e-12 and wave_efficiency(216, 108, 2) == 1.0
assert abs(wave_efficiency(1081, 108, 2) - 1081 / 1296) < 1e-12 and abs(wave_efficiency(1, 132, 1) - 1 / 132) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>warps_of(conds, warp=32)</C>, splitting the per-thread conditions into consecutive warps (the last may be
          short); <C>simt_cycles(conds, cost_if, cost_else, warp=32)</C>, the cycles issued over all warps; and{" "}
          <C>lane_efficiency(conds, cost_if, cost_else, warp=32)</C>, the useful lane-cycles divided by issued cycles times
          the warp size.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def warps_of(conds, warp=32):
    return [conds]

def simt_cycles(conds, cost_if, cost_else, warp=32):
    return sum(cost_if if c else cost_else for c in conds)

def lane_efficiency(conds, cost_if, cost_else, warp=32):
    return 1.0
`,
        solution: SIMT,
        tests: [
          { name: "warps", code: `assert warps_of(list(range(70))) == [list(range(32)), list(range(32, 64)), list(range(64, 70))] and warps_of([]) == []
alt = [i % 2 == 0 for i in range(128)]; low = [i < 48 for i in range(128)]
assert simt_cycles(alt, 4, 4) == 32 and simt_cycles(low, 4, 4) == 20 and simt_cycles(sorted(alt), 4, 4) == 16
assert simt_cycles([True] * 40, 3, 5) == 6 and simt_cycles([False] * 40, 3, 5, warp=8) == 25 and simt_cycles([False] * 31 + [True], 10, 1) == 11` },
          { name: "efficiency", code: `alt = [i % 2 == 0 for i in range(128)]
assert lane_efficiency(alt, 4, 4) == 0.5 and lane_efficiency([True] * 64, 7, 1) == 1.0
assert abs(lane_efficiency([False] * 31 + [True], 10, 1) - 41 / 352) < 1e-12` },
        ],
      },
    },
    {
      key: "rare",
      rung: "stretch",
      prompt: (
        <p>
          Each lane of a 32-lane warp independently takes an <C>if</C> costing 10 cycles with probability 0.1, and otherwise
          an <C>else</C> costing 1 cycle. What is the expected number of cycles the warp issues for the branch? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 10.657, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Thousands of threads need data to work on. The next lesson follows that data through the GPU&apos;s memory
        hierarchy, from high-bandwidth memory through the L2 cache to the shared memory and registers of each SM.
      </p>
    </>
  ),
};
