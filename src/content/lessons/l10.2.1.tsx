import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EvalErrorBarViz } from "@/components/viz/EvalErrorBarViz";
import type { LessonContent } from "@/lib/types";

const INTERVALS = `import math

def mean_se(scores):
    n = len(scores)
    m = sum(scores) / n
    var = sum((x - m) ** 2 for x in scores) / (n - 1)
    return m, math.sqrt(var / n)

def normal_ci(scores, z=1.96):
    m, se = mean_se(scores)
    return m - z * se, m + z * se

def wilson_interval(k, n, z=1.96):
    p = k / n
    centre = p + z * z / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (centre - spread) / (1 + z * z / n), (centre + spread) / (1 + z * z / n)`;

const RESAMPLE = `import math

def variance_parts(samples):
    means = [sum(s) / len(s) for s in samples]
    g = sum(means) / len(means)
    between = sum((m - g) ** 2 for m in means) / len(means)
    within = sum(sum((x - m) ** 2 for x in s) / len(s) for s, m in zip(samples, means)) / len(samples)
    return between, within

def se_with_k(var_between, var_within, n, k):
    return math.sqrt((var_between + var_within / k) / n)

def items_needed(half_width, p, z=1.96):
    return math.ceil(z * z * p * (1 - p) / half_width ** 2)`;

export const lesson: LessonContent = {
  id: "l10.2.1",
  minutes: 50,
  links: {
    requires: ["l10.1.4", "m9.5.1"],
    revisits: ["m9.5.2", "m7.7.2", "m7.6.2"],
    foreshadows: ["l10.2.2", "l10.2.3", "l10.2.4"],
  },

  puzzle: (
    <>
      <p>
        A model card reports 71.3% on a benchmark of 300 questions and a rival reports 69.8%. The tables print both to one decimal,
        as if the difference were settled. Had the benchmark authors written 300 different questions of the same kind, both numbers
        would have moved, by how much? An evaluation is an experiment, and its result needs an error bar like any other.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Treat the benchmark&apos;s questions as a sample from a large population of questions it could have contained. The score is the
        mean of the per-question scores, so the central limit theorem gives its standard error: the standard deviation of the
        question scores divided by the square root of the number of questions. When answers are sampled at a non-zero temperature,
        each question&apos;s score is itself noisy, which adds a second, smaller source of variation.
      </p>
      <EvalErrorBarViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the standard error of an evaluation">
        <p>
          Let <M>{"s_1, \\dots, s_n"}</M> be per-question scores, drawn independently from a population with mean μ and variance{" "}
          <M>{"\\sigma^2"}</M>. The reported score <M>{"\\bar s"}</M> has standard error <M>{"\\sigma/\\sqrt n"}</M>, estimated with the sample
          standard deviation (<C>mean_se</C>), and by the central limit theorem (m7.7.2) the interval{" "}
          <M>{"\\bar s \\pm 1.96\\,\\widehat{\\mathrm{se}}"}</M> covers μ about 95% of the time for moderate n (<C>normal_ci</C>). For
          right-or-wrong scores the variance is <M>{"p(1-p)"}</M>, largest at p = 0.5.
        </p>
        <Code>{INTERVALS}</Code>
      </Definition>

      <Remark title="near 0% or 100%, and small n">
        <p>
          The normal interval fails at the edges: a model that solves 0 of 10 tasks gets the interval [0, 0], as if the rate were known
          exactly. The Wilson interval inverts the score test instead, solving <M>{"|\\hat p - p| \\le z\\sqrt{p(1-p)/n}"}</M> for p, and
          stays sensible: for 0 of 10 it gives about [0, 0.278] (<C>wilson_interval</C>). Agent benchmarks with a few dozen long tasks
          sit in exactly this regime. The bootstrap (m9.5.2), which resamples questions with replacement, is the general tool for scores
          that are not simple means, such as a pass@k estimate or a median.
        </p>
      </Remark>

      <Theorem title="questions and resamples">
        <p>
          Suppose each question i has a true expected score <M>{"\\mu_i"}</M>, varying across questions with variance{" "}
          <M>{"\\sigma_b^2"}</M>, and each sampled answer scores <M>{"\\mu_i"}</M> plus noise with variance <M>{"\\sigma_w^2"}</M> averaged over
          questions. If each of n questions is answered K times and scored by its mean, then
        </p>
        <MD>{"\\operatorname{Var}(\\bar s) = \\frac{1}{n}\\left(\\sigma_b^2 + \\frac{\\sigma_w^2}{K}\\right)."}</MD>
      </Theorem>
      <Proof>
        <p>
          A question&apos;s score is <M>{"x_i = \\frac{1}{K}\\sum_j y_{ij}"}</M>. By the law of total variance (m7.6.2),{" "}
          <M>{"\\operatorname{Var}(x_i) = \\operatorname{Var}(\\mathbb{E}[x_i \\mid \\mu_i]) + \\mathbb{E}[\\operatorname{Var}(x_i \\mid \\mu_i)] = \\sigma_b^2 + \\sigma_w^2/K"}</M>,
          since the K answers are independent given the question. The questions are independent, so the variance of their mean is this
          divided by n. Both parts can be estimated from a table of answers per question (<C>variance_parts</C>, which uses
          divide-by-count variances for simplicity) and plugged in for any planned K (<C>se_with_k</C>). Resampling removes only the
          second part: once K is large, only more questions help.
        </p>
        <Code>{RESAMPLE}</Code>
      </Proof>

      <Example title="a typical benchmark">
        <p>
          200 questions, accuracy 70%. The standard error is <M>{"\\sqrt{0.7 \\times 0.3/200} \\approx 0.032"}</M>, so the 95% interval is
          about ±6.4 points. A one-point difference between two models on such a benchmark is well inside the noise of either score.
          To get a target half-width h at accuracy p, the benchmark needs about <M>{"z^2 p(1-p)/h^2"}</M> questions (<C>items_needed</C>).
        </p>
      </Example>

      <Remark title="what the interval does not cover">
        <p>
          The interval describes sampling of questions from the benchmark&apos;s own population. It says nothing about whether that
          population matches the use you care about, about contamination, or about prompt and format choices, which can move scores by
          more than the standard error. Report the interval, the number of questions, the number of samples per question, and the
          prompt; Miller (2024) gives a practical guide.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: (
        <p>
          A model answers 62% of 500 questions correctly. What is the half-width of the normal 95% interval (z = 1.96), as a proportion?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.043, tolerance: 0.0005 },
    },
    {
      key: "parts",
      rung: "check",
      prompt: (
        <p>
          Between-question variance is 0.15 and within-question variance is 0.06. With 400 questions and 4 answers per question, what is
          the standard error of the score? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0203, tolerance: 0.0001 },
    },
    {
      key: "more",
      rung: "apply",
      prompt: (
        <p>
          On a benchmark where between-question variance is much larger than within-question variance, which change narrows the
          error bar most for the same compute?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Spend it on more questions with one answer each, since resampling only shrinks the smaller within-question part",
          "Spend it on more answers per question, since each answer is cheaper than a question",
          "Either; the variance depends only on the total number of answers",
          "Neither; error bars cannot be narrowed after the benchmark is fixed",
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

def mean_se(scores):
    n = len(scores)
    m = sum(scores) / n
    var = sum((x - m) ** 2 for x in scores) / (n - 1)
    return m, math.sqrt(var / n)

def normal_ci(scores, z=1.96):
    m, se = mean_se(scores)
    return m - z * se, m + z * se

def wilson_interval(k, n, z=1.96):
    p = k / n
    centre = p + z * z / (2 * n)
    spread = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))
    return (centre - spread) / (1 + z * z / n), (centre + spread) / (1 + z * z / n)

print(mean_se([1, 0, 1, 1]), [round(x, 3) for x in normal_ci([2, 4], z=1.0)])
print([round(x, 3) for x in wilson_interval(5, 5, z=1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.75, 0.25) [2.0, 4.0]\n[0.833, 1.0]",
          "(0.75, 0.2165) [2.0, 4.0]\n[0.833, 1.0]",
          "(0.75, 0.25) [2.293, 3.707]\n[0.833, 1.0]",
          "(0.75, 0.25) [2.0, 4.0]\n[1.0, 1.0]",
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

def variance_parts(samples):
    means = [sum(s) / len(s) for s in samples]
    g = sum(means) / len(means)
    between = sum((m - g) ** 2 for m in means) / len(means)
    within = sum(sum((x - m) ** 2 for x in s) / len(s) for s, m in zip(samples, means)) / len(samples)
    return between, within

def se_with_k(var_between, var_within, n, k):
    return math.sqrt((var_between + var_within / k) / n)

def items_needed(half_width, p, z=1.96):
    return math.ceil(z * z * p * (1 - p) / half_width ** 2)

print(variance_parts([[1, 1], [0, 1]]), round(se_with_k(0.04, 0.12, 4, 3), 4))
print(items_needed(0.1, 0.5, z=2.0), items_needed(0.05, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.0625, 0.125) 0.1414\n100 0",
          "(0.125, 0.125) 0.1414\n100 0",
          "(0.0625, 0.125) 0.2\n100 0",
          "(0.0625, 0.125) 0.1414\n25 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_se(scores)</C>, returning the mean and its standard error with the n − 1 sample variance,{" "}
          <C>normal_ci(scores, z=1.96)</C>, and <C>wilson_interval(k, n, z=1.96)</C> for k successes in n trials.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mean_se(scores):
    return sum(scores) / len(scores), 0.0

def normal_ci(scores, z=1.96):
    return 0.0, 1.0

def wilson_interval(k, n, z=1.96):
    return k / n, k / n
`,
        solution: INTERVALS,
        tests: [
          { name: "se", code: `m, se = mean_se([0, 1])\nassert abs(m - 0.5) < 1e-12 and abs(se - 0.5) < 1e-12` },
          { name: "ci", code: `lo, hi = normal_ci([1, 2, 3], z=2)\nassert abs(lo - 0.8452994616) < 1e-6 and abs(hi - 3.1547005384) < 1e-6\nlo, hi = wilson_interval(0, 10)\nassert abs(lo) < 1e-9 and abs(hi - 0.2775401688) < 1e-6\nlo, hi = wilson_interval(10, 10)\nassert abs(lo - 0.7224598312) < 1e-6 and abs(hi - 1.0) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>variance_parts(samples)</C>, taking a list of per-question lists of answer scores and returning the divide-by-count
          variance of the question means and the average divide-by-count variance within questions, <C>se_with_k(var_between,
          var_within, n, k)</C>, and <C>items_needed(half_width, p, z=1.96)</C>, rounded up.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def variance_parts(samples):
    return 0.0, 0.0

def se_with_k(var_between, var_within, n, k):
    return math.sqrt((var_between + var_within) / n)

def items_needed(half_width, p, z=1.96):
    return 0
`,
        solution: RESAMPLE,
        tests: [
          { name: "parts", code: `b, w = variance_parts([[1, 0], [1, 1], [0, 0]])\nassert abs(b - 1 / 6) < 1e-12 and abs(w - 1 / 12) < 1e-12` },
          { name: "plan", code: `assert abs(se_with_k(0.1, 0.2, 10, 2) - 0.1414213562) < 1e-9\nassert items_needed(0.02, 0.5) == 2401 and items_needed(0.03, 0.9) == 385` },
        ],
      },
    },
    {
      key: "plan",
      rung: "stretch",
      prompt: (
        <p>
          You want a benchmark whose 95% interval (z = 1.96) is at most ±1 percentage point for any accuracy. How many questions does it
          need?
        </p>
      ),
      answer: { kind: "numeric", value: 9604, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Two models are usually scored on the same questions, so their errors are correlated. The next lesson uses that pairing to
        compare them far more precisely than two separate error bars allow.
      </p>
    </>
  ),
};
