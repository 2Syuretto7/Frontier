import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StragglerViz } from "@/components/viz/StragglerViz";
import type { LessonContent } from "@/lib/types";

const DETECT = `from statistics import median

def mad_scores(times):
    m = median(times)
    scale = 1.4826 * median([abs(t - m) for t in times]) or 1e-12   # matches the standard deviation for normal data
    return [(t - m) / scale for t in times]

def flag(history, thresh, persist):
    recent = [set(i for i, z in enumerate(mad_scores(step)) if z > thresh) for step in history[-persist:]]
    return sorted(set.intersection(*recent))      # slow in every one of the last persist steps

def slowdown(times):
    return max(times) / median(times)             # how much the slowest rank stretches a synchronous step`;

const MITIGATE = `def step_time_equal(speeds, work):
    return max(work / len(speeds) / s for s in speeds)

def balanced_time(speeds, work):
    return work / sum(speeds)                     # shares proportional to speed finish together

def expected_max_exp(N, mean):
    return mean * sum(1 / i for i in range(1, N + 1))   # largest of N exponential delays`;

export const lesson: LessonContent = {
  id: "e10.8.3",
  minutes: 45,
  links: {
    requires: ["e10.8.2", "e10.2.1"],
    revisits: ["m7.3.2", "e10.6.2"],
    foreshadows: ["e10.8.4"],
  },

  puzzle: (
    <>
      <p>
        A run on 1024 GPUs slows by 20% overnight. No GPU has failed, no error is logged, and every GPU reports high utilisation,
        because the fast ones spend their time spinning inside collectives, waiting. One GPU has throttled because its cooling
        degraded. How is it found among a thousand, and what can be done short of stopping the job?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In synchronous training every step waits for the slowest rank, so one slow GPU sets the pace for all. Its fingerprint is in
        the per-rank time spent computing before each collective: the slow rank&apos;s time is high and everyone else&apos;s waiting
        time is high. Comparing each rank with the median, scaled by a spread estimate that the outlier itself cannot inflate, picks it
        out. Then either remove it, as with a failure, or give it less work.
      </p>
      <StragglerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="robust outlier scores">
        <p>
          For per-rank compute times <M>{"t_i"}</M> in one step, let m be their median and D the median of{" "}
          <M>{"|t_i - m|"}</M>. The score of rank i is <M>{"(t_i - m)/(1.4826\\,D)"}</M> (<C>mad_scores</C>); the constant makes the
          denominator equal the standard deviation for normally distributed times. A rank is flagged when its score exceeds a threshold,
          commonly 3.5, in each of several consecutive steps (<C>flag</C>). The slowdown of a step is its maximum over its median (
          <C>slowdown</C>).
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Theorem title="why the median and not the mean">
        <p>
          Changing fewer than half of the times, by any amounts, moves the median only within the range of the unchanged times. A single
          rank therefore cannot hide itself by being extremely slow, whereas the mean and standard deviation both grow with it.
        </p>
      </Theorem>
      <Proof>
        <p>
          With fewer than half the values changed, more than half are unchanged, so the median lies between the smallest and largest
          unchanged value. The same applies to D, the median of the deviations. By contrast, one value t makes the mean grow like t/N
          and the standard deviation like <M>{"t/\\sqrt N"}</M>, so the z-score of an extreme outlier approaches{" "}
          <M>{"\\sqrt{N - 1}"}</M> and stops growing, while the robust score grows without bound.
        </p>
      </Proof>

      <Theorem title="the cost of waiting for everyone">
        <p>
          With equal shares, a step takes <M>{"\\max_i W/(N s_i)"}</M> for ranks of speed <M>{"s_i"}</M>; with shares proportional to
          speed it takes <M>{"W/\\sum_i s_i"}</M>, the best possible. If each rank&apos;s time also has an independent exponential delay
          of mean μ, the expected maximum delay over N ranks is <M>{"\\mu H_N"}</M>, with <M>{"H_N = 1 + \\tfrac12 + \\cdots + \\tfrac1N"}</M>,
          about <M>{"\\mu \\ln N"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The step ends when the last rank does (<C>step_time_equal</C>). Shares <M>{"W s_i/\\sum s"}</M> finish together at{" "}
          <M>{"W/\\sum s"}</M>, and no split can do better because the total rate is <M>{"\\sum s"}</M> (<C>balanced_time</C>). For the
          delays: the minimum of k exponentials of mean μ is exponential of mean μ/k (m7.3.2), and by memorylessness the gaps between
          successive order statistics are independent with means <M>{"\\mu/N, \\mu/(N-1), \\dots, \\mu"}</M>; their sum is{" "}
          <M>{"\\mu H_N"}</M> (<C>expected_max_exp</C>).
        </p>
        <Code>{MITIGATE}</Code>
      </Proof>

      <Remark title="remedies in practice">
        <p>
          A persistently slow GPU or node is usually drained and replaced through the elastic path of e10.8.2. Rebalancing works for data
          parallelism, where micro-batch counts per rank can differ if the loss is weighted correctly (e10.2.3), but not for tensor or
          pipeline groups, whose members must do matching work. Random jitter, from the operating system, network congestion or
          garbage collection, cannot be targeted: the <M>{"\\ln N"}</M> growth means it matters more at scale, which is why large runs pin
          processes, disable background services and align garbage collection across ranks. Expert-parallel layers add their own
          version of the problem through uneven routing (e10.6.2).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Per-rank timers before each collective show one rank far above the median; its robust score stays high step after step while
          everyone else&apos;s is near zero. Removing it, and continuing on the elastic path, restores the speed. Had it only been a few
          percent slow, shifting a little of its data to the others would have recovered nearly all the loss.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "score",
      rung: "check",
      prompt: <p>Eight ranks take 100, 101, 99, 100, 102, 98, 100 and 130 ms. What is the robust score of the last rank? Give two decimals.</p>,
      answer: { kind: "numeric", value: 20.23, tolerance: 0.01 },
    },
    {
      key: "balance",
      rung: "check",
      prompt: (
        <p>
          Eight ranks share 8 units of work; seven run at speed 1 and one at speed 0.5. With shares proportional to speed, how long does
          the step take? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.067, tolerance: 0.001 },
    },
    {
      key: "mean",
      rung: "apply",
      prompt: <p>Why is the plain z-score, using the mean and standard deviation, a poor detector of one very slow rank?</p>,
      answer: {
        kind: "choice",
        options: [
          "The outlier inflates the mean and standard deviation, so its own z-score is capped near the square root of N − 1",
          "It needs more steps of history",
          "It flags fast ranks as well as slow ones",
          "It cannot be computed in a distributed setting",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from statistics import median

def mad_scores(times):
    m = median(times)
    scale = 1.4826 * median([abs(t - m) for t in times]) or 1e-12   # matches the standard deviation for normal data
    return [(t - m) / scale for t in times]

def flag(history, thresh, persist):
    recent = [set(i for i, z in enumerate(mad_scores(step)) if z > thresh) for step in history[-persist:]]
    return sorted(set.intersection(*recent))      # slow in every one of the last persist steps

def slowdown(times):
    return max(times) / median(times)             # how much the slowest rank stretches a synchronous step

times = [10.0, 11.0, 9.0, 10.0, 20.0]
print([round(z, 2) for z in mad_scores(times)], slowdown(times), flag([times, [10, 12, 9, 11, 19]], 3.5, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.67, -0.67, 0.0, 6.74] 2.0 [4]",
          "[0.0, 1.0, -1.0, 0.0, 10.0] 2.0 [4]",
          "[0.0, 0.67, -0.67, 0.0, 6.74] 1.67 [4]",
          "[0.0, 0.67, -0.67, 0.0, 6.74] 2.0 [1, 4]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def step_time_equal(speeds, work):
    return max(work / len(speeds) / s for s in speeds)

def balanced_time(speeds, work):
    return work / sum(speeds)                     # shares proportional to speed finish together

def expected_max_exp(N, mean):
    return mean * sum(1 / i for i in range(1, N + 1))   # largest of N exponential delays

x = step_time_equal([1.0, 1.0, 1.0, 0.5, 0.5], 8.0)
print(x, balanced_time([1.0, 1.0, 1.0, 0.5, 0.5], 8.0), round(expected_max_exp(4, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.2 2.0 2.0833", "1.6 2.0 2.0833", "3.2 1.6 2.0833", "3.2 2.0 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mad_scores(times)</C>, using a tiny positive scale when the deviations&apos; median is zero;{" "}
          <C>flag(history, thresh, persist)</C>, the sorted ranks scoring above thresh in each of the last persist steps; and{" "}
          <C>slowdown(times)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import median

def mad_scores(times):
    return [0.0] * len(times)

def flag(history, thresh, persist):
    return []

def slowdown(times):
    return 1.0
`,
        solution: DETECT,
        tests: [
          { name: "scores", code: `assert all(abs(a - b) < 1e-12 for a, b in zip(mad_scores([1.0, 2.0, 3.0]), [-1 / 1.4826, 0.0, 1 / 1.4826]))\nassert slowdown([2.0, 4.0, 4.0]) == 1.0 and slowdown([1.0, 1.0, 3.0]) == 3.0` },
          { name: "flag", code: `h = [[1, 1, 1, 1, 9], [1, 2, 1, 1, 9], [1, 1, 1, 1, 1]]\nassert flag(h, 3.5, 1) == [] and flag(h[:2], 3.5, 2) == [4] and flag([[1, 1, 5, 1], [1, 1, 1, 1]], 3.5, 2) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>step_time_equal(speeds, work)</C>; <C>balanced_time(speeds, work)</C>; and <C>expected_max_exp(N, mean)</C>, the
          expected largest of N independent exponential delays.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def step_time_equal(speeds, work):
    return work / len(speeds)

def balanced_time(speeds, work):
    return work / len(speeds)

def expected_max_exp(N, mean):
    return mean
`,
        solution: MITIGATE,
        tests: [
          { name: "split", code: `assert step_time_equal([2.0, 1.0], 4.0) == 2.0 and balanced_time([2.0, 1.0], 6.0) == 2.0` },
          { name: "max", code: `assert abs(expected_max_exp(1, 3.0) - 3.0) < 1e-12 and abs(expected_max_exp(3, 6.0) - 11.0) < 1e-12` },
        ],
      },
    },
    {
      key: "jitter",
      rung: "stretch",
      prompt: (
        <p>
          Each of 1024 ranks needs exactly 1 time unit per step plus an independent exponential delay with mean 0.01. What is the expected
          step time? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.075, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Restarts, resharding and rebalancing all change how the arithmetic is split. The final lesson asks when a distributed run can
        reproduce itself bit for bit, and what it costs to make it do so.
      </p>
    </>
  ),
};
