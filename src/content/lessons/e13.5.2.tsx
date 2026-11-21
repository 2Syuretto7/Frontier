import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContinuousMetricViz } from "@/components/viz/ContinuousMetricViz";
import type { LessonContent } from "@/lib/types";

const SCHEDULE = `def eval_steps(total, first, ratio, every):
    steps, s = [], first
    while s < every and s <= total:
        steps.append(s)                                    # dense early, when things change fast
        s *= ratio
    return steps + list(range(every, total + 1, every))

def eval_cost_frac(evals, eval_tokens, step_tokens, steps):
    return evals * 2 * eval_tokens / (6 * step_tokens * steps)   # forward only, against forward and backward

def slope_se(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    resid = sum((y - my - b * (x - mx)) ** 2 for x, y in zip(xs, ys))
    return b, (resid / (n - 2) / sxx) ** 0.5`;

const WATCH = `def regressed(prev, curr, se_prev, se_curr, z):
    return prev - curr > z * (se_prev ** 2 + se_curr ** 2) ** 0.5   # a drop larger than noise allows

def smooth(ys, k):
    out = []
    for i in range(len(ys)):
        win = ys[max(0, i - k + 1):i + 1]
        out.append(sum(win) / len(win))                    # trailing mean of up to k scores
    return out

def first_crossing(xs, ys, thr, k):
    for x, y in zip(xs, smooth(ys, k)):
        if y >= thr:
            return x
    return None`;

export const lesson: LessonContent = {
  id: "e13.5.2",
  minutes: 40,
  links: {
    requires: ["e13.5.1"],
    revisits: ["l8.5.3", "e13.2.3", "e13.1.3"],
    foreshadows: ["e13.6.1"],
  },

  puzzle: (
    <>
      <p>
        Three weeks into a run, a reasoning benchmark the team cares about is still at chance. The proxy runs reached
        chance too, and then their score rose sharply late in training. Should the team worry, wait, or change the data
        mixture now, while there is still time? And what should they have been measuring so that the question had an
        answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Evaluation during training is a monitoring problem, not a reporting one. It must be cheap enough to run often,
        dense when the model changes fastest, and sensitive enough to show progress before the final score moves.
        Accuracy on hard tasks often sits at chance for a long time and then climbs; the probability the model assigns to
        the correct answer usually improves steadily throughout. Watching the continuous quantity turns a long wait into
        a trend that can be fitted, compared with the proxies, and acted on.
      </p>
      <ContinuousMetricViz />
    </>
  ),

  theory: (
    <>
      <Definition title="continuous evaluation">
        <p>
          Checkpoints are evaluated on a schedule that is geometric at first and regular later (<C>eval_steps</C>). A
          forward pass costs about 2N FLOPs per token for N parameters, against about 6N for a training step, so an
          evaluation of E tokens every S steps of T tokens costs a fraction <M>{"2E/(6TS)"}</M> of training{" "}
          (<C>eval_cost_frac</C>). Trends are summarised by a least-squares slope with its standard error{" "}
          (<C>slope_se</C>).
        </p>
        <Code>{SCHEDULE}</Code>
      </Definition>

      <Theorem title="uncertainty of a fitted trend">
        <p>
          For points <M>{"(x_i, y_i)"}</M>, <M>{"i = 1, \\dots, n"}</M>, with independent errors of equal variance about a
          line, the least-squares slope is{" "}
          <M>{"b = \\sum (x_i - \\bar x)(y_i - \\bar y) / S_{xx}"}</M>, where <M>{"S_{xx} = \\sum (x_i - \\bar x)^2"}</M>,
          and its standard error is <M>{"s / \\sqrt{S_{xx}}"}</M>, with <M>{"s^2"}</M> the residual sum of squares
          divided by <M>{"n - 2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The slope is a linear combination <M>{"b = \\sum_i w_i y_i"}</M> with{" "}
          <M>{"w_i = (x_i - \\bar x)/S_{xx}"}</M>, since the <M>{"\\bar y"}</M> term sums to zero. With independent errors
          of variance <M>{"\\sigma^2"}</M>, its variance is <M>{"\\sigma^2 \\sum_i w_i^2 = \\sigma^2 / S_{xx}"}</M>.
          Replacing <M>{"\\sigma^2"}</M> by its unbiased estimate <M>{"s^2"}</M>, which divides by <M>{"n - 2"}</M>{" "}
          because two parameters were fitted, gives the standard error. Spreading evaluations over a longer stretch of
          training raises <M>{"S_{xx}"}</M>, which is why trends need history and not just more items per evaluation.
        </p>
      </Proof>

      <Example title="what to run, and on what">
        <p>
          A typical suite has three tiers. Held-out loss on several domains is cheap, smooth and run at every
          evaluation. Multiple-choice tasks scored by log-probability, including the probability of the correct answer,
          run often. Generative tasks, which need decoding and are far more expensive per item, run on a sparser
          schedule. Under a warmup-stable-decay schedule (l8.5.3), checkpoints from the stable phase understate the
          model, so some teams evaluate a short decay branched from the checkpoint, or an exponential moving average of
          the weights, to see what the model would score if training stopped there.
        </p>
      </Example>

      <Remark title="acting on the curves">
        <p>
          A drop between consecutive evaluations is a regression only if it exceeds what the two standard errors allow{" "}
          (<C>regressed</C>); such drops feed the alerting of e13.2.3 as tickets rather than pages. To decide when a
          capability has appeared, smooth the scores before looking for the first crossing of a threshold{" "}
          (<C>smooth</C>, <C>first_crossing</C>). It has been argued that many apparently sudden abilities reflect
          discontinuous metrics such as exact match, and look gradual under continuous ones, which is the case for
          tracking both. Compare each curve with the proxy runs of e13.1.3 at equal tokens. Extrapolating a fitted trend
          is tempting and occasionally necessary, but it assumes the trend continues, which is precisely what late
          surprises violate.
        </p>
        <Code>{WATCH}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          An evaluation suite processes 50 million tokens with forward passes only and runs every 1000 steps. Each
          training step processes 4 million tokens. What fraction of the training compute does evaluation add?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0041667, tolerance: 0.002 },
    },
    {
      key: "drop",
      rung: "check",
      prompt: (
        <p>
          A task&apos;s score falls from 0.512 to 0.489 between two checkpoints, each with standard error 0.008 from
          independent items. What is the z-statistic of the drop, to three decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 2.033, tolerance: 0.002 },
    },
    {
      key: "signal",
      rung: "apply",
      prompt: <p>Why track the log-probability of the correct answer alongside accuracy on a hard task?</p>,
      answer: {
        kind: "choice",
        options: [
          "It changes with every improvement, while accuracy changes only when the correct answer overtakes the others",
          "It is always higher than accuracy",
          "It does not depend on the prompt template",
          "It needs fewer forward passes",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eval_steps(total, first, ratio, every):
    steps, s = [], first
    while s < every and s <= total:
        steps.append(s)                                    # dense early, when things change fast
        s *= ratio
    return steps + list(range(every, total + 1, every))

def eval_cost_frac(evals, eval_tokens, step_tokens, steps):
    return evals * 2 * eval_tokens / (6 * step_tokens * steps)   # forward only, against forward and backward

def slope_se(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxx = sum((x - mx) ** 2 for x in xs)
    b = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
    resid = sum((y - my - b * (x - mx)) ** 2 for x, y in zip(xs, ys))
    return b, (resid / (n - 2) / sxx) ** 0.5

print(eval_steps(5000, 100, 2, 1000), eval_cost_frac(1, 1e6, 1e6, 100))
print(slope_se([1, 2, 3], [1.0, 2.0, 3.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[100, 200, 400, 800, 1000, 2000, 3000, 4000, 5000] 0.0033333333333333335\n(1.0, 0.0)",
          "[100, 200, 400, 800, 1600, 3200] 0.0033333333333333335\n(1.0, 0.0)",
          "[1000, 2000, 3000, 4000, 5000] 0.0033333333333333335\n(1.0, 0.0)",
          "[100, 200, 400, 800, 1000, 2000, 3000, 4000, 5000] 0.01\n(1.0, 0.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def regressed(prev, curr, se_prev, se_curr, z):
    return prev - curr > z * (se_prev ** 2 + se_curr ** 2) ** 0.5   # a drop larger than noise allows

def smooth(ys, k):
    out = []
    for i in range(len(ys)):
        win = ys[max(0, i - k + 1):i + 1]
        out.append(sum(win) / len(win))                    # trailing mean of up to k scores
    return out

def first_crossing(xs, ys, thr, k):
    for x, y in zip(xs, smooth(ys, k)):
        if y >= thr:
            return x
    return None

print(regressed(0.6, 0.55, 0.02, 0.02, 2), smooth([1, 3, 5, 7], 2))
print(first_crossing([10, 20, 30, 40], [0.1, 0.5, 0.2, 0.6], 0.38, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "False [1.0, 2.0, 4.0, 6.0]\n40",
          "True [1.0, 2.0, 4.0, 6.0]\n40",
          "False [2.0, 4.0, 6.0, 7.0]\n40",
          "False [1.0, 2.0, 4.0, 6.0]\n20",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eval_steps(total, first, ratio, every)</C>, multiplying from first by ratio while below every and
          within total, then every multiple of every up to total; <C>eval_cost_frac(evals, eval_tokens, step_tokens,
          steps)</C>; and <C>slope_se(xs, ys)</C>, the least-squares slope and its standard error.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eval_steps(total, first, ratio, every):
    return list(range(every, total + 1, every))

def eval_cost_frac(evals, eval_tokens, step_tokens, steps):
    return evals * eval_tokens / (step_tokens * steps)

def slope_se(xs, ys):
    return 0.0, 0.0
`,
        solution: SCHEDULE,
        tests: [
          { name: "schedule", code: `assert eval_steps(300, 10, 3, 100) == [10, 30, 90, 100, 200, 300] and eval_steps(50, 10, 2, 100) == [10, 20, 40] and eval_cost_frac(2, 3e6, 1e6, 1000) == 0.002` },
          { name: "slope", code: `assert [round(v, 4) for v in slope_se([0, 1, 2, 3], [1.0, 1.5, 1.5, 2.5])] == [0.45, 0.1323]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>regressed(prev, curr, se_prev, se_curr, z)</C>; <C>smooth(ys, k)</C>, the trailing mean of up to k
          scores; and <C>first_crossing(xs, ys, thr, k)</C>, the first x whose smoothed score is at least thr, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def regressed(prev, curr, se_prev, se_curr, z):
    return curr < prev

def smooth(ys, k):
    return ys

def first_crossing(xs, ys, thr, k):
    return None
`,
        solution: WATCH,
        tests: [
          { name: "regress", code: `assert regressed(0.5, 0.4, 0.03, 0.04, 1.96) and not regressed(0.5, 0.45, 0.03, 0.04, 1.96)` },
          { name: "smooth", code: `assert smooth([2, 4], 5) == [2.0, 3.0] and smooth([], 3) == [] and first_crossing([1, 2, 3], [0.9, 0.1, 0.1], 0.6, 3) == 1 and first_crossing([1, 2], [0.1, 0.2], 0.5, 1) is None` },
        ],
      },
    },
    {
      key: "extrapolate",
      rung: "stretch",
      prompt: (
        <p>
          A task scores 0.30, 0.32, 0.31, 0.35 and 0.36 at 1, 2, 3, 4 and 5 thousand steps. Fitting a least-squares line,
          at how many thousand steps would it reach 0.5, to two decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 14.47, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        When something does go wrong, the team&apos;s memory of it fades within weeks. The last chapter is about writing
        it down: postmortems that make the next run better.
      </p>
    </>
  ),
};
