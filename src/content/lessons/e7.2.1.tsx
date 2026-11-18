import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CpuPipelineViz } from "@/components/viz/CpuPipelineViz";
import type { LessonContent } from "@/lib/types";

const PIPE = `def pipeline_cycles(n, k):
    return k + n - 1 if n else 0

def cpi(branch_frac, miss_rate, penalty):
    return 1 + branch_frac * miss_rate * penalty

def critical_path(deps, latency):
    finish = []
    for i, ds in enumerate(deps):
        finish.append(max((finish[d] for d in ds), default=0) + latency[i])
    return max(finish)`;

const PRED = `def loop_pattern(n_iters, reps):
    return ([True] * (n_iters - 1) + [False]) * reps

def one_bit_misses(outcomes, state=True):
    misses = 0
    for taken in outcomes:
        misses += state != taken
        state = taken
    return misses

def two_bit_misses(outcomes, state=2):
    misses = 0
    for taken in outcomes:
        misses += (state >= 2) != taken
        state = min(state + 1, 3) if taken else max(state - 1, 0)
    return misses`;

export const lesson: LessonContent = {
  id: "e7.2.1",
  minutes: 50,
  links: {
    requires: ["e7.1.3"],
    revisits: ["e3.2.3"],
    foreshadows: ["e7.2.2", "e7.3.1"],
  },

  puzzle: (
    <>
      <p>
        An add instruction takes four clock cycles from start to finish on a modern core, yet a loop of independent adds
        runs at several per cycle. Change the loop so that each add needs the result of the one before, as in a running
        sum, and it slows to one add every four cycles. The instructions are the same; only the dependences changed. What
        is the processor doing that makes dependences matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A processor works like an assembly line. Each instruction passes through stages (fetch it, decode it, execute it,
        access memory, write the result back), and while one instruction is in the execute stage the next is being decoded
        and the one after that fetched. Each instruction still takes five cycles, but one finishes every cycle. The line
        stalls when an instruction needs a result that is not ready yet, and it throws work away when it guessed wrongly
        which way a branch would go.
      </p>
      <CpuPipelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pipelines, latency and throughput">
        <p>
          A <em>k-stage pipeline</em> splits each instruction into k steps of one cycle each and starts a new instruction
          every cycle. The <em>latency</em> of an instruction is the k cycles from its start to its end; the{" "}
          <em>throughput</em> is the number finished per cycle, ideally one. A <em>hazard</em> is anything that forces the
          next instruction to wait: a <em>data hazard</em> when it needs a result not yet produced, a <em>control hazard</em>{" "}
          when the processor does not yet know which instruction comes next because a branch is unresolved.
        </p>
      </Definition>

      <Theorem title="time for n instructions">
        <p>
          With no hazards, n instructions in a k-stage pipeline take <M>{"k + n - 1"}</M> cycles, against <M>{"nk"}</M>{" "}
          without pipelining, so the speed-up is
        </p>
        <MD>{"\\frac{nk}{k + n - 1} \\to k \\quad (n \\to \\infty)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first instruction finishes after k cycles. Each later one starts a cycle after its predecessor and takes the
          same k cycles, so it finishes one cycle later; the last of n finishes at <M>{"k + (n - 1)"}</M>. Dividing nk by this
          and letting n grow gives k. In practice the stages are not perfectly balanced and the registers between them add
          delay, so splitting into more stages gives less than proportionally more speed.
        </p>
      </Proof>

      <Theorem title="cycles per instruction with branches">
        <p>
          If a fraction f of instructions are branches, a fraction m of those are mispredicted, and each misprediction
          discards p cycles of work, the mean cycles per instruction of a pipeline that otherwise finishes one per cycle is
        </p>
        <MD>{"\\text{CPI} = 1 + f\\,m\\,p."}</MD>
      </Theorem>
      <Proof>
        <p>
          Over N instructions there are N cycles of useful completion plus <M>{"N f m"}</M> mispredictions, each costing p
          cycles. Divide the total by N. The penalty p is about the depth of the pipeline up to the stage where the branch is
          resolved, which is why a deeper pipeline makes prediction matter more.
        </p>
        <Code>{PIPE}</Code>
      </Proof>

      <Theorem title="the critical path bounds the time">
        <p>
          Take instructions as nodes of a directed acyclic graph with an edge from each producer to each consumer of its
          result, and give each a latency. However many instructions the hardware runs at once, the program cannot finish
          before the longest path of latencies through this graph, which is what <C>critical_path</C> computes.
        </p>
      </Theorem>
      <Proof>
        <p>
          An instruction cannot start before every instruction it depends on has finished, so along any path the start
          times increase by at least the latency of each node, and the last node of the path finishes no earlier than the
          sum. <C>critical_path</C> visits nodes in an order where producers come first, setting each finish time to its
          latency plus the latest finish of its producers, which is the earliest time possible with unlimited hardware.
        </p>
      </Proof>

      <Example title="a running sum and many accumulators">
        <p>
          The loop <C>s += x[i]</C> makes every add depend on the previous one, so n adds of latency 4 take at least 4n
          cycles, whatever the width of the core. Splitting the sum into four accumulators,{" "}
          <C>s0 += x[i]; s1 += x[i+1]; s2 += x[i+2]; s3 += x[i+3]</C>, gives four independent chains of length n/4, so the
          critical path drops to about n cycles and the pipeline stays full. Compilers do this on their own for integers;
          for floating point they may not, because it changes the order of rounding.
        </p>
      </Example>

      <Definition title="branch prediction">
        <p>
          Rather than wait for a branch to resolve, the processor guesses and keeps fetching. A <em>one-bit</em> predictor
          remembers the last outcome of each branch. A <em>two-bit</em> predictor keeps a counter from 0 to 3, predicts taken
          when it is 2 or more, and moves it one step towards each outcome, so a single surprise does not flip the
          prediction.
        </p>
        <Code>{PRED}</Code>
      </Definition>

      <Theorem title="misses on a loop branch">
        <p>
          A loop branch that is taken n − 1 times and then not taken, executed for r loops in a row with n ≥ 2, is
          mispredicted 2r − 1 times by a one-bit predictor that starts at taken, and r times by a two-bit predictor that
          starts at 2.
        </p>
      </Theorem>
      <Proof>
        <p>
          One bit: the exit of each loop is predicted taken and missed, which sets the bit to not taken, so the first branch
          of the next loop is also missed: r exits and r − 1 re-entries, and every other branch is predicted correctly. Two
          bits: suppose the counter is at least 2 when a loop starts, as it is for the first. All the taken branches are then
          predicted correctly, and the first of them (there is one since n ≥ 2) raises the counter to 3. The exit is
          predicted taken and missed, and lowers the counter to 2, so the next loop again starts at 2 or more. By induction
          each loop costs exactly one miss.
        </p>
      </Proof>

      <Remark title="what this means for code">
        <p>
          Data-dependent branches on random data, such as <C>if x[i] &gt; 0</C> on noise, mispredict about half the time and
          can cost more than the work they guard; a branch-free form such as <C>s += max(x[i], 0)</C> or a vectorised mask
          often wins. Long dependence chains, such as walking a linked list, defeat the pipeline the same way. Modern cores
          also execute out of order, finding independent instructions further ahead to fill the gaps, but no amount of
          reordering beats the critical path.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cycles",
      rung: "check",
      prompt: <p>With no hazards, how many cycles do 1000 instructions take on a 12-stage pipeline?</p>,
      answer: { kind: "numeric", value: 1011, tolerance: 0 },
    },
    {
      key: "cpi",
      rung: "check",
      prompt: <p>A quarter of the instructions are branches, 8% of them are mispredicted, and each misprediction costs 20 cycles. What is the CPI?</p>,
      answer: { kind: "numeric", value: 1.4, tolerance: 0.0005 },
    },
    {
      key: "acc",
      rung: "apply",
      prompt: <p>A floating-point add has a latency of 4 cycles and the core can start one add per cycle. Why does summing an array with four separate accumulators run about four times faster than with one?</p>,
      answer: {
        kind: "choice",
        options: [
          "With one accumulator each add waits for the previous result, so the critical path is 4 cycles per element; four independent chains keep the pipeline full",
          "Four accumulators use four times as many cores",
          "Four accumulators make the array fit in the cache",
          "The compiler skips three quarters of the additions",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pipeline_cycles(n, k):
    return k + n - 1 if n else 0

def cpi(branch_frac, miss_rate, penalty):
    return 1 + branch_frac * miss_rate * penalty

def critical_path(deps, latency):
    finish = []
    for i, ds in enumerate(deps):
        finish.append(max((finish[d] for d in ds), default=0) + latency[i])
    return max(finish)

print(pipeline_cycles(100, 5), pipeline_cycles(1, 5), round(cpi(0.2, 0.05, 15), 3))
print(critical_path([[], [0], [0], [1, 2]], [3, 1, 4, 2]), critical_path([[], [], []], [2, 5, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["104 5 1.15\n9 5", "500 5 1.15\n9 5", "104 5 1.15\n10 8", "104 4 1.15\n9 5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def loop_pattern(n_iters, reps):
    return ([True] * (n_iters - 1) + [False]) * reps

def one_bit_misses(outcomes, state=True):
    misses = 0
    for taken in outcomes:
        misses += state != taken
        state = taken
    return misses

def two_bit_misses(outcomes, state=2):
    misses = 0
    for taken in outcomes:
        misses += (state >= 2) != taken
        state = min(state + 1, 3) if taken else max(state - 1, 0)
    return misses

loop = loop_pattern(4, 3); print(len(loop), sum(loop), one_bit_misses(loop), two_bit_misses(loop))
print(one_bit_misses([True, False] * 4), two_bit_misses([True, False] * 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["12 9 5 3\n7 4", "12 9 3 3\n7 4", "12 9 5 3\n8 8", "12 9 6 3\n7 4"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pipeline_cycles(n, k)</C>, the cycles for n instructions on a k-stage pipeline with no hazards (0 when n
          is 0); <C>cpi(branch_frac, miss_rate, penalty)</C>; and <C>critical_path(deps, latency)</C>, where{" "}
          <C>deps[i]</C> lists the earlier instructions that instruction i depends on, returning the earliest finishing time
          of the whole program with unlimited hardware.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pipeline_cycles(n, k):
    return n * k

def cpi(branch_frac, miss_rate, penalty):
    return 1

def critical_path(deps, latency):
    return sum(latency)
`,
        solution: PIPE,
        tests: [
          { name: "pipeline", code: `assert pipeline_cycles(100, 5) == 104 and pipeline_cycles(1, 5) == 5 and pipeline_cycles(0, 5) == 0 and pipeline_cycles(1000, 12) == 1011
assert abs(cpi(0.2, 0.05, 15) - 1.15) < 1e-12 and abs(cpi(0.25, 0.08, 20) - 1.4) < 1e-12 and cpi(0.3, 0.0, 50) == 1` },
          { name: "critical path", code: `assert critical_path([[], [0], [0], [1, 2]], [3, 1, 4, 2]) == 9 and critical_path([[], [], []], [2, 5, 1]) == 5
chain = [[]] + [[i] for i in range(7)]
assert critical_path(chain, [4] * 8) == 32, 'A running sum is one long chain.'
four = [[] if i < 4 else [i - 4] for i in range(8)]
assert critical_path(four, [4] * 8) == 8, 'Four accumulators give four short chains.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>loop_pattern(n_iters, reps)</C>, the outcomes of a loop branch (n − 1 taken, then one not taken) repeated
          reps times; <C>one_bit_misses(outcomes, state=True)</C>; and <C>two_bit_misses(outcomes, state=2)</C>, the
          number of mispredictions of each predictor from the given starting state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def loop_pattern(n_iters, reps):
    return []

def one_bit_misses(outcomes, state=True):
    return 0

def two_bit_misses(outcomes, state=2):
    return 0
`,
        solution: PRED,
        tests: [
          { name: "loops", code: `p = loop_pattern(4, 3)
assert p == [True, True, True, False] * 3
for n, r in [(4, 3), (10, 5), (3, 7), (2, 6)]:
    q = loop_pattern(n, r)
    assert one_bit_misses(q) == 2 * r - 1, (n, r, one_bit_misses(q))
    assert two_bit_misses(q) == r, (n, r, two_bit_misses(q))` },
          { name: "states", code: `alt = [True, False] * 4
assert one_bit_misses(alt) == 7 and two_bit_misses(alt) == 4
assert two_bit_misses([True] * 5, state=0) == 2 and one_bit_misses([False] * 3) == 1
assert two_bit_misses([False, False, True], state=3) == 3, 'Saturating counter: 3 -> 2 -> 1, so the third outcome is still predicted not taken'` },
        ],
      },
    },
    {
      key: "deep",
      rung: "stretch",
      prompt: (
        <p>
          Core A has 5 stages at 1 GHz and a misprediction penalty of 2 cycles. Core B has 20 stages at 3 GHz and a penalty
          of 15 cycles. With 20% branches and 5% of them mispredicted, how many times faster is B than A? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.661, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A pipeline overlaps different instructions. The next lesson gives each instruction more work: SIMD units apply one
        instruction to a whole vector of numbers at once.
      </p>
    </>
  ),
};
