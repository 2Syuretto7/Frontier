import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BootstrapViz } from "@/components/viz/BootstrapViz";
import type { LessonContent } from "@/lib/types";

const BOOT = `import random

def resample(xs, rng):
    return [rng.choice(xs) for _ in xs]

def boot_se(xs, stat, B=2000, seed=0):
    rng = random.Random(seed)
    reps = [stat(resample(xs, rng)) for _ in range(B)]
    m = sum(reps) / B
    return (sum((r - m) ** 2 for r in reps) / (B - 1)) ** 0.5`;

const CI = `import numpy as np

def boot_ci(x, stat, B=4000, alpha=0.05, seed=0):
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(x), size=(B, len(x)))
    reps = stat(x[idx], axis=1)
    return np.quantile(reps, [alpha / 2, 1 - alpha / 2])

def ci_coverage(n, trials=500, seed=1):
    rng = np.random.default_rng(seed)
    hits = 0
    for t in range(trials):
        x = rng.exponential(1.0, n)
        lo, hi = boot_ci(x, np.mean, B=1000, seed=t)
        hits += lo <= 1.0 <= hi
    return hits / trials`;

export const lesson: LessonContent = {
  id: "m9.5.2",
  minutes: 55,
  links: {
    requires: ["m9.5.1", "m7.7.3"],
    revisits: ["m9.2.4", "m9.1.3"],
    foreshadows: ["m9.5.3", "m9.8.2"],
  },

  puzzle: (
    <>
      <p>
        You report a model&apos;s median latency, or its AUC, or the F1 score on a test set. Each is a complicated function
        of the data with no textbook formula for its standard error. Collecting a thousand fresh test sets to see how much
        it varies is out of the question. Can one data set tell you how much its own statistic would vary?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sample is our best picture of the population. So simulate &quot;fresh data sets&quot; by drawing from the
        sample itself, with replacement, and see how much the statistic moves. The variation across these resamples
        mimics the variation across real samples.
      </p>
      <BootstrapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the nonparametric bootstrap">
        <p>
          Given data x₁, …, xₙ with empirical distribution <M>{"\\hat F_n"}</M> and a statistic T, draw B resamples{" "}
          <M>{"x^{*b}"}</M> of size n from <M>{"\\hat F_n"}</M> (that is, with replacement) and compute{" "}
          <M>{"T^{*b} = T(x^{*b})"}</M>. The bootstrap standard error is the standard deviation of the <M>{"T^{*b}"}</M>, and
          the percentile interval runs between their α/2 and 1 − α/2 quantiles.
        </p>
        <Code>{BOOT}</Code>
      </Definition>

      <Theorem title="the bootstrap for the mean">
        <p>
          Conditional on the data, the bootstrap mean <M>{"\\bar X^*"}</M> has mean <M>{"\\bar x"}</M> and variance{" "}
          <M>{"\\hat\\sigma^2/n"}</M>, where <M>{"\\hat\\sigma^2 = \\frac1n\\sum (x_i - \\bar x)^2"}</M>. So with B → ∞ the
          bootstrap standard error of the mean is <M>{"\\hat\\sigma/\\sqrt n"}</M>, the plug-in version of the usual formula.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each resampled value <M>{"X_j^*"}</M> is uniform on {"{x₁, …, xₙ}"}, so it has mean <M>{"\\bar x"}</M> and variance{" "}
          <M>{"\\hat\\sigma^2"}</M>. The n draws are independent given the data, so their average has mean{" "}
          <M>{"\\bar x"}</M> and variance <M>{"\\hat\\sigma^2/n"}</M>.
        </p>
      </Proof>

      <Example title="intervals and their coverage">
        <p>
          The percentile interval is easy to compute with an index array of shape (B, n). Its coverage, checked by
          simulating exponential samples, is below the nominal 95% for small n, because the sampling distribution of the
          mean is skewed and the sample underrepresents the long tail. It improves with n; refinements such as the BCa or
          studentised bootstrap correct much of the gap.
        </p>
        <Code>{CI}</Code>
      </Example>

      <Example title="where it fails">
        <p>
          For Uniform(0, θ) and T = max Xᵢ, a resample contains the sample maximum with probability{" "}
          <M>{"1 - (1 - 1/n)^n \\to 1 - 1/e \\approx 0.63"}</M>, so the bootstrap distribution has an atom at T itself, while
          the true sampling distribution is continuous. The bootstrap works when T is a smooth function of the empirical
          distribution, and can fail for extremes, for statistics at a boundary, and for heavy-tailed data with infinite
          variance.
        </p>
      </Example>

      <Remark title="bootstrapping evaluations">
        <p>
          To put an interval on a test-set metric, resample test examples, recompute the metric, and take percentiles. To
          compare two models on the same test set, resample examples and recompute the difference on each resample: this
          paired bootstrap keeps the correlation between the models. The unit you resample must be the unit that is
          independent: if a benchmark has many questions per document, resample documents, not questions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>For a sample of 3 distinct values, how many distinct bootstrap resamples are there if order does not matter?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>For data 2, 4, 6, 8, what is the exact bootstrap variance of the mean (the limit as B → ∞)?</p>,
      answer: { kind: "numeric", value: 1.25, tolerance: 0.0001 },
    },
    {
      key: "fail",
      rung: "apply",
      prompt: <p>For which statistic is the nonparametric bootstrap known to fail?</p>,
      answer: { kind: "choice", options: ["The sample maximum of a Uniform(0, θ) sample", "The sample mean of a normal sample", "The sample median of an exponential sample", "A test-set accuracy"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random

def resample(xs, rng):
    return [rng.choice(xs) for _ in xs]

def boot_se(xs, stat, B=2000, seed=0):
    rng = random.Random(seed)
    reps = [stat(resample(xs, rng)) for _ in range(B)]
    m = sum(reps) / B
    return (sum((r - m) ** 2 for r in reps) / (B - 1)) ** 0.5

xs = [1, 2, 3, 4, 10]
print(round(boot_se(xs, lambda v: sum(v) / len(v)), 1), round((10 / 5) ** 0.5, 3))
print(len(resample(xs, random.Random(3))), boot_se([7, 7, 7], max))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.4 1.414\n5 0.0", "1.6 1.414\n5 0.0", "1.4 1.581\n5 0.0", "1.4 1.414\n3 7.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def boot_ci(x, stat, B=4000, alpha=0.05, seed=0):
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(x), size=(B, len(x)))
    reps = stat(x[idx], axis=1)
    return np.quantile(reps, [alpha / 2, 1 - alpha / 2])

def ci_coverage(n, trials=500, seed=1):
    rng = np.random.default_rng(seed)
    hits = 0
    for t in range(trials):
        x = rng.exponential(1.0, n)
        lo, hi = boot_ci(x, np.mean, B=1000, seed=t)
        hits += lo <= 1.0 <= hi
    return hits / trials

x = np.arange(1.0, 11.0)
print([round(float(v), 1) for v in boot_ci(x, np.mean)])
print(ci_coverage(10), ci_coverage(100))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[3.7, 7.3]\n0.864 0.914", "[1.0, 10.0]\n0.864 0.914", "[3.7, 7.3]\n0.95 0.95", "[3.7, 7.3]\n0.914 0.864"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>resample(xs, rng)</C>, drawing len(xs) values with rng.choice, and{" "}
          <C>boot_se(xs, stat, B=2000, seed=0)</C>, the standard deviation (divisor B − 1) of stat over B resamples using
          random.Random(seed).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random

def resample(xs, rng):
    return list(xs)

def boot_se(xs, stat, B=2000, seed=0):
    return 0.0
`,
        solution: BOOT,
        tests: [
          { name: "resample", code: `import random
r = resample([1, 2, 3, 4], random.Random(0))
assert len(r) == 4 and set(r) <= {1, 2, 3, 4}
assert any(len(set(resample([1, 2, 3, 4], random.Random(s)))) < 4 for s in range(20))` },
          { name: "se", code: `xs = [0, 0, 0, 0, 10]
se = boot_se(xs, lambda v: sum(v) / len(v), B=4000)
assert abs(se - 0.8 ** 0.5 * 2) < 0.15 and boot_se([3, 3], min) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>boot_ci(x, stat, B=4000, alpha=0.05, seed=0)</C>, the percentile interval computed from an index array of
          shape (B, n) drawn with default_rng(seed).integers and a stat taking an axis argument, and{" "}
          <C>ci_coverage(n, trials=500, seed=1)</C>, the fraction of trials in which the interval for the mean (B = 1000,
          seed = trial number) of an Exponential(1) sample contains 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def boot_ci(x, stat, B=4000, alpha=0.05, seed=0):
    return np.array([0.0, 0.0])

def ci_coverage(n, trials=500, seed=1):
    return 0.0
`,
        solution: CI,
        tests: [
          { name: "ci", code: `import numpy as np
lo, hi = boot_ci(np.array([5.0] * 8), np.mean)
assert lo == 5 and hi == 5
lo, hi = boot_ci(np.arange(100.0), np.mean, B=2000)
assert 43 < lo < 45 and 54 < hi < 56` },
          { name: "cover", code: `c = ci_coverage(200, trials=200)
assert 0.88 < c < 0.99` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Given data x₁, …, xₙ, prove that the mean of a bootstrap resample has conditional mean x̄ and conditional variance σ̂²/n, with σ̂² = (1/n)Σ(xᵢ − x̄)².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that each resampled value is drawn uniformly from the data, independently of the others given the data.",
          "Computes the mean and variance of one draw: x̄ and (1/n)Σ(xᵢ − x̄)² = σ̂².",
          "Concludes the average of n independent draws has mean x̄ and variance σ̂²/n.",
        ],
      },
    },
    {
      key: "miss",
      rung: "stretch",
      prompt: <p>In a bootstrap resample of size 10 from 10 observations, what is the probability that a particular observation is not chosen at all? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3487, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the bootstrap estimates the variability of a statistic from one sample, why it reproduces the usual standard error for the mean, how percentile intervals are formed, and when the bootstrap fails.",

  glimpse: (
    <>
      <p>
        The bootstrap resamples to mimic new data. Permutation tests, next, shuffle labels to mimic a world in which the
        null hypothesis is exactly true, and they give tests that are exact with no distributional assumptions.
      </p>
    </>
  ),
};
