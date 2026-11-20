import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BenchmarkCeilingViz } from "@/components/viz/BenchmarkCeilingViz";
import type { LessonContent } from "@/lib/types";

const CEIL = `import math

def observed_accuracy(true_acc, label_error, n_choices):
    return true_acc * (1 - label_error) + (1 - true_acc) * label_error / (n_choices - 1)

def relative_error_reduction(acc_old, acc_new):
    return ((1 - acc_old) - (1 - acc_new)) / (1 - acc_old)

def logit_gap(acc1, acc2):
    logit = lambda p: math.log(p / (1 - p))
    return logit(acc2) - logit(acc1)`;

const FORECAST = `import math

def sigmoid_forecast(t, t_mid, rate, floor, top):
    return floor + (top - floor) / (1 + math.exp(-rate * (t - t_mid)))

def time_to_reach(target, t_mid, rate, floor, top):
    s = (target - floor) / (top - floor)
    return t_mid + math.log(s / (1 - s)) / rate

def headroom(best_acc, ceiling):
    return ceiling - best_acc`;

export const lesson: LessonContent = {
  id: "l10.1.2",
  minutes: 45,
  links: {
    requires: ["l10.1.1"],
    revisits: ["l8.6.3", "l8.4.5"],
    foreshadows: ["l10.1.3", "l10.2.1", "l10.4.3"],
  },

  puzzle: (
    <>
      <p>
        Handwriting recognition took more than a decade to reach human-level scores on its standard benchmark. Reading
        comprehension benchmarks of the late 2010s took a year or two. GSM8K, grade-school maths word problems released in 2021,
        went from about 35% for the best model to over 95% in roughly three years. Each time a benchmark saturates, the field
        builds a harder one, which saturates faster. What exactly is lost when a benchmark saturates, and how can one tell from the
        numbers that it has?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A benchmark has a ceiling below 100%, set by wrong answer keys and ambiguous questions. As models approach it, the
        remaining items are mostly the broken ones and a few very hard ones, so score differences between models shrink to the
        size of the noise even when their abilities still differ, as the visualisation shows. Reporting gains as a share of the
        remaining error, or on the log-odds scale, partly corrects for this compression; the real fix is a harder benchmark.
      </p>
      <BenchmarkCeilingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the ceiling">
        <p>
          Suppose a share e of answer keys are wrong, on questions with n options. A model whose answers are truly correct with
          probability a is scored right when its answer matches the key. If its wrong answers and the wrong keys are spread evenly over
          the n − 1 incorrect options, its observed accuracy is <M>{"a(1-e) + (1-a)e/(n-1)"}</M> (<C>observed_accuracy</C>). A perfect model
          scores 1 − e.
        </p>
      </Definition>

      <Theorem title="observed gains shrink by the label error">
        <p>
          Under this model, observed accuracy is linear in true accuracy with slope{" "}
          <M>{"1 - e - e/(n-1) = 1 - ne/(n-1)"}</M>, so every true improvement appears smaller by that factor, and the gap between two
          models is compressed the same way.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expanding, <M>{"a(1-e) + e/(n-1) - ae/(n-1)"}</M> is <M>{"e/(n-1)"}</M> plus <M>{"a(1 - e - e/(n-1))"}</M>. Differences between two
          values of a are multiplied by the coefficient. With e = 0.06 and four options it is 0.92, a modest loss; the larger effect near
          saturation comes from the remaining items being concentrated at extreme difficulties, where, as in l10.1.1, they carry little
          information.
        </p>
      </Proof>

      <Definition title="better summaries near the top">
        <p>
          Relative error reduction, <M>{"(\\text{err}_{\\text{old}} - \\text{err}_{\\text{new}})/\\text{err}_{\\text{old}}"}</M>, treats going from 90% to 95%
          like going from 60% to 80% (<C>relative_error_reduction</C>). The log-odds difference{" "}
          <M>{"\\mathrm{logit}(p_2) - \\mathrm{logit}(p_1)"}</M> corresponds to a fixed ability difference in a logistic model, so it stays
          roughly constant where raw accuracy gaps collapse (<C>logit_gap</C>).
        </p>
        <Code>{CEIL}</Code>
      </Definition>

      <Remark title="forecasting and replacing benchmarks">
        <p>
          Benchmark scores over time often follow an S-shape between a chance floor and the ceiling, and fitting one gives a crude
          forecast of when a target will be reached (<C>sigmoid_forecast</C>, <C>time_to_reach</C>). The gap between the best model and
          the ceiling is the headroom (<C>headroom</C>). When it is gone, the field moves on: to harder versions such as MMLU-Pro, with ten
          options and harder questions; to expert-written sets such as Humanity&apos;s Last Exam; to benchmarks refreshed with new
          questions on a schedule, such as LiveBench; or to adversarial collection, as in Dynabench, where people write items that
          current models fail. As l8.6.3 showed, apparent jumps can also be artefacts of the metric.
        </p>
        <Code>{FORECAST}</Code>
      </Remark>

      <Example title="the same progress, two ways">
        <p>
          A model improves from 70% to 80% and its successor from 94% to 96%. In points the first gain is five times larger. In relative
          error, both remove a third of the remaining errors. In log-odds the first gain is 0.54 and the second 0.43, much closer than the
          raw gains suggest.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "obs",
      rung: "check",
      prompt: (
        <p>
          A benchmark of four-option questions has 6% wrong keys. A model is truly correct 90% of the time. What observed accuracy does the
          model of this lesson predict? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.848, tolerance: 0.001 },
    },
    {
      key: "rer",
      rung: "check",
      prompt: <p>A model improves from 86% to 92%. What is the relative error reduction? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.429, tolerance: 0.001 },
    },
    {
      key: "sat",
      rung: "apply",
      prompt: (
        <p>
          Five frontier models score between 93.1% and 93.9% on a benchmark whose answer keys are estimated to be 6% wrong. What
          should a report conclude?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The benchmark is saturated: the models are at its ceiling, the differences are within noise, and a harder benchmark is needed to rank them",
          "The model at 93.9% is clearly the best",
          "All five models are equally capable in every respect",
          "The answer keys should be changed to match the best model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def observed_accuracy(true_acc, label_error, n_choices):
    return true_acc * (1 - label_error) + (1 - true_acc) * label_error / (n_choices - 1)

def relative_error_reduction(acc_old, acc_new):
    return ((1 - acc_old) - (1 - acc_new)) / (1 - acc_old)

def logit_gap(acc1, acc2):
    logit = lambda p: math.log(p / (1 - p))
    return logit(acc2) - logit(acc1)

print(observed_accuracy(1.0, 0.1, 4), observed_accuracy(0.0, 0.0, 4), round(observed_accuracy(0.25, 0.3, 4), 3))
print(round(relative_error_reduction(0.8, 0.9), 3), round(logit_gap(0.5, 0.75), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.9 0.0 0.25\n0.5 1.099",
          "1.0 0.0 0.25\n0.5 1.099",
          "0.9 0.0 0.175\n0.5 1.099",
          "0.9 0.0 0.25\n0.1 1.099",
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

def sigmoid_forecast(t, t_mid, rate, floor, top):
    return floor + (top - floor) / (1 + math.exp(-rate * (t - t_mid)))

def time_to_reach(target, t_mid, rate, floor, top):
    s = (target - floor) / (top - floor)
    return t_mid + math.log(s / (1 - s)) / rate

def headroom(best_acc, ceiling):
    return ceiling - best_acc

print(sigmoid_forecast(5.0, 5.0, 2.0, 0.25, 0.95), round(time_to_reach(0.6, 5.0, 2.0, 0.25, 0.95), 3))
print(round(headroom(0.93, 0.95), 3), round(time_to_reach(0.25 + 0.7 * 0.880797, 0.0, 1.0, 0.25, 0.95), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.6 5.0\n0.02 2.0",
          "0.95 5.0\n0.02 2.0",
          "0.6 2.5\n0.02 2.0",
          "0.6 5.0\n-0.02 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>observed_accuracy(true_acc, label_error, n_choices)</C>, <C>relative_error_reduction(acc_old, acc_new)</C> and{" "}
          <C>logit_gap(acc1, acc2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def observed_accuracy(true_acc, label_error, n_choices):
    return true_acc

def relative_error_reduction(acc_old, acc_new):
    return acc_new - acc_old

def logit_gap(acc1, acc2):
    return acc2 - acc1
`,
        solution: CEIL,
        tests: [
          { name: "obs", code: `assert abs(observed_accuracy(0.5, 0.2, 5) - (0.4 + 0.025)) < 1e-12 and abs(relative_error_reduction(0.6, 0.8) - 0.5) < 1e-12` },
          { name: "logit", code: `assert abs(logit_gap(0.2, 0.8) - 2 * math.log(4)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sigmoid_forecast(t, t_mid, rate, floor, top)</C>, its inverse <C>time_to_reach(target, t_mid, rate, floor, top)</C>, and{" "}
          <C>headroom(best_acc, ceiling)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sigmoid_forecast(t, t_mid, rate, floor, top):
    return 1 / (1 + math.exp(-rate * (t - t_mid)))

def time_to_reach(target, t_mid, rate, floor, top):
    return t_mid

def headroom(best_acc, ceiling):
    return 1 - best_acc
`,
        solution: FORECAST,
        tests: [
          { name: "fc", code: `v = sigmoid_forecast(3.0, 1.0, 0.5, 0.1, 0.9)\nassert abs(v - (0.1 + 0.8 / (1 + math.exp(-1)))) < 1e-12 and abs(time_to_reach(v, 1.0, 0.5, 0.1, 0.9) - 3.0) < 1e-9` },
          { name: "head", code: `assert abs(headroom(0.7, 0.92) - 0.22) < 1e-12 and abs(time_to_reach(0.5, 2.0, 3.0, 0.0, 1.0) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "when",
      rung: "stretch",
      prompt: (
        <p>
          A benchmark&apos;s best score follows <M>{"0.25 + 0.7\\,\\sigma(0.8(t - 2023))"}</M>, with t in years. In what year, as a decimal, does it
          reach 0.9? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2026.206, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A benchmark can also stop measuring capability without saturating honestly: if its questions leak into the training data.
        The next lesson is about contamination.
      </p>
    </>
  ),
};
