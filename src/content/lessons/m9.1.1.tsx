import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BesselViz } from "@/components/viz/BesselViz";
import type { LessonContent } from "@/lib/types";

const MOMENTS = `def sample_mean(xs):
    return sum(xs) / len(xs)

def sample_var(xs, ddof=1):
    m = sample_mean(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - ddof)`;

const SIM = `import numpy as np

def mean_of_var(n, reps, ddof, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(0, 1, size=(reps, n))
    return X.var(axis=1, ddof=ddof).mean()

def var_of_mean(n, reps, seed=0):
    rng = np.random.default_rng(seed)
    return rng.normal(0, 1, size=(reps, n)).mean(axis=1).var()`;

export const lesson: LessonContent = {
  id: "m9.1.1",
  minutes: 50,
  links: {
    requires: ["m7.7.1", "m7.2.4"],
    revisits: ["m7.2.3", "m7.5.2"],
    foreshadows: ["m9.1.2", "m9.2.4"],
  },

  puzzle: (
    <>
      <p>
        Every statistics package offers two variances: one divides the sum of squared deviations by n, the other by n − 1.
        NumPy&apos;s default divides by n and pandas&apos; by n − 1, so the same data give different answers. Which is right?
        Both are reasonable answers to different questions, and the question that n − 1 answers is the first one statistics
        asks: does my estimate get the target right on average?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probability starts from a known distribution and asks about data; statistics starts from data and asks about the
        distribution. The data are modelled as independent draws from one unknown distribution, and anything computed from
        them is a random variable with its own distribution. The sample mean is centred on the true mean; the spread
        around the sample mean is slightly smaller than the spread around the true mean, which is why n − 1 appears.
      </p>
      <BesselViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random sample and statistic">
        <p>
          A random sample of size n from a distribution F is a list <M>{"X_1, \\dots, X_n"}</M> of independent random
          variables, each with distribution F (iid). A statistic is any function of the sample that does not involve unknown
          parameters, such as the sample mean and sample variance
        </p>
        <MD>{"\\bar X = \\frac1n \\sum_{i=1}^n X_i, \\qquad S^2 = \\frac{1}{n-1}\\sum_{i=1}^n (X_i - \\bar X)^2."}</MD>
        <Code>{MOMENTS}</Code>
      </Definition>

      <Theorem title="mean and variance of the sample mean">
        <p>
          If the <M>{"X_i"}</M> have mean μ and variance σ², then <M>{"\\mathbb{E}[\\bar X] = \\mu"}</M> and{" "}
          <M>{"\\operatorname{Var}(\\bar X) = \\sigma^2/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearity gives <M>{"\\mathbb{E}[\\bar X] = \\frac1n \\sum \\mathbb{E}X_i = \\mu"}</M>. Independence makes the
          covariances vanish, so <M>{"\\operatorname{Var}(\\sum X_i) = n\\sigma^2"}</M>, and dividing by n² gives σ²/n.
        </p>
      </Proof>

      <Theorem title="the sample variance is unbiased">
        <p><M>{"\\mathbb{E}[S^2] = \\sigma^2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>Expanding around μ and using <M>{"\\sum (X_i - \\bar X) = 0"}</M>,</p>
        <MD>{"\\sum (X_i - \\bar X)^2 = \\sum (X_i - \\mu)^2 - n(\\bar X - \\mu)^2."}</MD>
        <p>
          Taking expectations, the first sum has mean nσ² and the second term has mean{" "}
          <M>{"n \\operatorname{Var}(\\bar X) = \\sigma^2"}</M>. So the sum of squares has mean (n − 1)σ², and dividing by n − 1
          gives σ². Dividing by n gives mean (n − 1)σ²/n instead, which the simulation below confirms.
        </p>
        <Code>{SIM}</Code>
      </Proof>

      <Example title="a small data set">
        <p>
          For 2, 4, 4, 4, 5, 5, 7, 9 the mean is 5 and the squared deviations sum to 32, giving 32/8 = 4 dividing by n and
          32/7 ≈ 4.571 dividing by n − 1. The standard error of the mean is estimated by S/√n, which shrinks like 1/√n: four
          times the data halve the uncertainty.
        </p>
      </Example>

      <Remark title="when the model is wrong">
        <p>
          The σ²/n formula relies on independence. Training and test examples drawn from the same pool fit the model; time
          series, repeated measurements of one user, or near-duplicate images do not, and positively correlated data have a
          variance of the mean larger than σ²/n, sometimes much larger. Reported error bars inherit that mistake.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: <p>What is the sample variance S² (dividing by n − 1) of 1, 2, 3, 4? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.6667, tolerance: 0.0001 },
    },
    {
      key: "se",
      rung: "check",
      prompt: <p>25 iid observations have variance σ² = 4. What is the variance of their mean?</p>,
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0001 },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: <p>What is the expectation of (1/n) Σ (Xᵢ − X̄)² for an iid sample with variance σ²?</p>,
      answer: { kind: "choice", options: ["(n − 1)σ²/n", "σ²", "nσ²/(n − 1)", "σ²/n"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sample_mean(xs):
    return sum(xs) / len(xs)

def sample_var(xs, ddof=1):
    m = sample_mean(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - ddof)

xs = [2, 4, 4, 4, 5, 5, 7, 9]
print(sample_mean(xs), sample_var(xs, 0), round(sample_var(xs), 4))
print(sample_var([3, 3, 3]), sample_mean([1.5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.0 4.0 4.5714\n0.0 1.5", "5.0 4.5714 4.0\n0.0 1.5", "5.0 4.0 4.5714\n0.0 0.0", "5.0 2.0 2.1381\n0.0 1.5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mean_of_var(n, reps, ddof, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(0, 1, size=(reps, n))
    return X.var(axis=1, ddof=ddof).mean()

def var_of_mean(n, reps, seed=0):
    rng = np.random.default_rng(seed)
    return rng.normal(0, 1, size=(reps, n)).mean(axis=1).var()

print(round(mean_of_var(5, 100000, 0), 3), round(mean_of_var(5, 100000, 1), 3))
print(round(var_of_mean(10, 100000), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.802 1.003\n0.1", "1.003 0.802\n0.1", "0.802 1.003\n0.316", "0.2 1.003\n0.01"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_mean(xs)</C> and <C>sample_var(xs, ddof=1)</C>, the sum of squared deviations from the mean divided
          by len(xs) − ddof.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def sample_mean(xs):
    return 0

def sample_var(xs, ddof=1):
    return 0
`,
        solution: MOMENTS,
        tests: [
          { name: "mean", code: `assert sample_mean([1, 2, 3, 6]) == 3` },
          { name: "var", code: `assert abs(sample_var([1, 2, 3, 4]) - 5 / 3) < 1e-12 and sample_var([1, 2, 3, 4], 0) == 1.25` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With numpy&apos;s default_rng(seed), write <C>mean_of_var(n, reps, ddof, seed=0)</C>: draw a reps × n array of standard
          normals and return the average over rows of the row variance with the given ddof. Then write{" "}
          <C>var_of_mean(n, reps, seed=0)</C>, the variance across rows of the row means.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mean_of_var(n, reps, ddof, seed=0):
    return 0.0

def var_of_mean(n, reps, seed=0):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "bias", code: `assert abs(mean_of_var(3, 200000, 0) - 2 / 3) < 0.01 and abs(mean_of_var(3, 200000, 1) - 1) < 0.01` },
          { name: "mean", code: `assert abs(var_of_mean(4, 200000) - 0.25) < 0.005` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the sample variance S², with divisor n − 1, is an unbiased estimator of σ² for an iid sample.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Establishes the identity Σ(Xᵢ − X̄)² = Σ(Xᵢ − μ)² − n(X̄ − μ)² (or an equivalent expansion).",
          "Computes E[Σ(Xᵢ − μ)²] = nσ² and E[n(X̄ − μ)²] = n·Var(X̄) = σ², using independence for Var(X̄) = σ²/n.",
          "Concludes the sum of squares has mean (n − 1)σ², so dividing by n − 1 gives expectation σ².",
        ],
      },
    },
    {
      key: "n",
      rung: "stretch",
      prompt: <p>Observations have standard deviation 2. How many iid observations are needed for the standard deviation of their mean to be 0.1?</p>,
      answer: { kind: "numeric", value: 400, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a random sample and a statistic are, why the sample mean has variance σ²/n, why dividing the sum of squared deviations by n − 1 gives an unbiased estimate of σ², and when the independence assumption fails.",

  glimpse: (
    <>
      <p>
        The mean and variance of a statistic are only a summary. The next lesson finds whole sampling distributions: for
        normal data, X̄ is normal, S² is a scaled chi-squared, and their ratio gives Student&apos;s t.
      </p>
    </>
  ),
};
