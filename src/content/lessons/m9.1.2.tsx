import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StudentTViz } from "@/components/viz/StudentTViz";
import type { LessonContent } from "@/lib/types";

const STATS = `import math

def t_stat(xs, mu):
    n = len(xs)
    m = sum(xs) / n
    s = math.sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))
    return (m - mu) / (s / math.sqrt(n))

def chi2_stat(xs, sigma2):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / sigma2`;

const SIM = `import numpy as np

def t_stats(n, reps, seed=0):
    X = np.random.default_rng(seed).normal(0, 1, size=(reps, n))
    return X.mean(axis=1) / (X.std(axis=1, ddof=1) / np.sqrt(n))

def tail_prob(n, reps, c, seed=0):
    return np.mean(np.abs(t_stats(n, reps, seed)) > c)`;

export const lesson: LessonContent = {
  id: "m9.1.2",
  minutes: 60,
  links: {
    requires: ["m9.1.1", "m7.5.4"],
    revisits: ["m7.3.4", "m7.4.1", "m7.7.2"],
    foreshadows: ["m9.4.1", "m9.5.1"],
  },

  puzzle: (
    <>
      <p>
        In 1908 a chemist at the Guinness brewery, publishing as &ldquo;Student&rdquo;, noticed that with four or five
        measurements the usual rule &ldquo;mean ± 2 standard errors&rdquo; was wrong far more often than 5% of the time. The
        rule treats the estimated standard deviation as if it were the true one. How much does that matter, and what is
        the exact distribution once you account for it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A statistic is a random variable, and its distribution over repeated samples is its sampling distribution. For
        normal data these are known exactly. Standardising the mean with the true σ gives a normal; standardising with the
        estimate S adds the randomness of S, and when S happens to be small the ratio is large. The result is Student&apos;s
        t, with heavier tails that fade as n grows.
      </p>
      <StudentTViz />
    </>
  ),

  theory: (
    <>
      <Definition title="chi-squared, t and F">
        <p>
          If <M>{"Z_1, \\dots, Z_k"}</M> are iid N(0, 1), <M>{"\\sum Z_i^2"}</M> has the chi-squared distribution with k degrees
          of freedom, <M>{"\\chi^2_k"}</M>. If Z ~ N(0, 1) and V ~ <M>{"\\chi^2_k"}</M> are independent,{" "}
          <M>{"Z/\\sqrt{V/k}"}</M> has Student&apos;s t distribution <M>{"t_k"}</M>. A ratio of independent chi-squareds, each
          divided by its degrees of freedom, has an F distribution.
        </p>
      </Definition>

      <Theorem title="sampling from a normal">
        <p>If <M>{"X_1, \\dots, X_n"}</M> are iid N(μ, σ²), then</p>
        <ol>
          <li><M>{"\\bar X \\sim N(\\mu, \\sigma^2/n)"}</M>;</li>
          <li><M>{"\\bar X"}</M> and S² are independent;</li>
          <li><M>{"(n-1)S^2/\\sigma^2 \\sim \\chi^2_{n-1}"}</M>;</li>
          <li><M>{"T = (\\bar X - \\mu)/(S/\\sqrt n) \\sim t_{n-1}"}</M>.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"Z_i = (X_i - \\mu)/\\sigma"}</M>, iid N(0, 1). Choose an orthogonal matrix Q whose first row is{" "}
          <M>{"(1, \\dots, 1)/\\sqrt n"}</M> and set W = QZ. A standard normal vector is invariant under orthogonal maps, so the{" "}
          <M>{"W_i"}</M> are iid N(0, 1). Now <M>{"W_1 = \\sqrt n \\bar Z"}</M>, and since Q preserves length,
        </p>
        <MD>{"\\sum_{i=2}^n W_i^2 = \\sum_i Z_i^2 - n\\bar Z^2 = \\sum_i (Z_i - \\bar Z)^2 = (n-1)S^2/\\sigma^2."}</MD>
        <p>
          So the mean depends only on <M>{"W_1"}</M> and S² only on <M>{"W_2, \\dots, W_n"}</M>: they are independent, (1) and (3)
          follow, and (4) is <M>{"W_1"}</M> divided by the square root of an independent <M>{"\\chi^2_{n-1}/(n-1)"}</M>.
        </p>
        <Code>{STATS}</Code>
      </Proof>

      <Theorem title="moments of the chi-squared">
        <p><M>{"\\chi^2_k"}</M> has mean k and variance 2k.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}Z^2 = 1"}</M> and <M>{"\\mathbb{E}Z^4 = 3"}</M>, so <M>{"\\operatorname{Var}(Z^2) = 2"}</M>; add over k
          independent terms.
        </p>
      </Proof>

      <Remark title="how heavy the tails are">
        <p>
          The 97.5% point of <M>{"t_4"}</M> is 2.776, not 1.96, so a sample of five needs intervals 40% wider; for{" "}
          <M>{"t_{29}"}</M> it is 2.045, already close. For non-normal data none of this is exact, but by the central limit
          theorem T is still approximately normal for large n. Small benchmark comparisons in machine learning, with three to
          five seeds, are exactly the regime where the difference matters.
        </p>
        <Code>{SIM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chivar",
      rung: "check",
      prompt: <p>What is the variance of a chi-squared random variable with 7 degrees of freedom?</p>,
      answer: { kind: "numeric", value: 14, tolerance: 0.0001 },
    },
    {
      key: "t",
      rung: "check",
      prompt: <p>Compute T = (X̄ − 0)/(S/√n) for the sample 1, 2, 3. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 3.4641, tolerance: 0.0001 },
    },
    {
      key: "dist",
      rung: "apply",
      prompt: <p>For an iid N(μ, σ²) sample of size n, what is the distribution of (n − 1)S²/σ²?</p>,
      answer: { kind: "choice", options: ["χ² with n − 1 degrees of freedom", "χ² with n degrees of freedom", "t with n − 1 degrees of freedom", "N(n − 1, 2(n − 1)) exactly"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def t_stat(xs, mu):
    n = len(xs)
    m = sum(xs) / n
    s = math.sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))
    return (m - mu) / (s / math.sqrt(n))

def chi2_stat(xs, sigma2):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / sigma2

xs = [5.1, 4.9, 5.3, 5.0, 4.7]
print(round(t_stat(xs, 5.0), 4), round(chi2_stat(xs, 0.04), 4))
print(round(t_stat([1, 2, 3], 0), 4), round(chi2_stat([1, 2, 3], 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 5.0\n3.4641 2.0", "0.0 0.2\n3.4641 2.0", "0.0 5.0\n2.0 3.4641", "0.0 4.0\n3.4641 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def t_stats(n, reps, seed=0):
    X = np.random.default_rng(seed).normal(0, 1, size=(reps, n))
    return X.mean(axis=1) / (X.std(axis=1, ddof=1) / np.sqrt(n))

def tail_prob(n, reps, c, seed=0):
    return np.mean(np.abs(t_stats(n, reps, seed)) > c)

print(round(tail_prob(5, 200000, 1.96), 3), round(tail_prob(50, 200000, 1.96), 3))
print(round(tail_prob(5, 200000, 2.776), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.122 0.056\n0.05", "0.05 0.05\n0.05", "0.122 0.056\n0.122", "0.025 0.025\n0.01"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>t_stat(xs, mu)</C>, the one-sample t statistic using S with divisor n − 1, and <C>chi2_stat(xs, sigma2)</C>,
          the sum of squared deviations from the sample mean divided by sigma2.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def t_stat(xs, mu):
    return 0.0

def chi2_stat(xs, sigma2):
    return 0.0
`,
        solution: STATS,
        tests: [
          { name: "t", code: `assert abs(t_stat([1, 3], 0) - 2) < 1e-12 and abs(t_stat([1, 2, 3], 0) - 12 ** 0.5) < 1e-12` },
          { name: "chi2", code: `assert abs(chi2_stat([0, 2], 2) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With numpy, write <C>t_stats(n, reps, seed=0)</C>, returning reps simulated t statistics (μ = 0) from standard
          normal samples of size n, and <C>tail_prob(n, reps, c, seed=0)</C>, the fraction with |T| &gt; c.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def t_stats(n, reps, seed=0):
    return np.zeros(reps)

def tail_prob(n, reps, c, seed=0):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "shape", code: `assert t_stats(3, 1000).shape == (1000,)` },
          { name: "tail", code: `assert abs(tail_prob(10, 200000, 2.262) - 0.05) < 0.005 and tail_prob(5, 100000, 1.96) > 0.1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a χ²_k random variable has mean k and variance 2k. You may use E[Z⁴] = 3 for Z ~ N(0, 1).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the variable as a sum of k independent Zᵢ² and uses linearity: mean k·E[Z²] = k.",
          "Computes Var(Z²) = E[Z⁴] − (E[Z²])² = 3 − 1 = 2.",
          "Adds the variances of the independent terms to get 2k.",
        ],
      },
    },
    {
      key: "tail",
      rung: "stretch",
      prompt: <p>For samples of size 5, about what fraction of t statistics exceed 1.96 in absolute value? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.122, tolerance: 0.005 },
    },
  ],

  teachBack:
    "Explain to a friend what a sampling distribution is, why for normal data the mean and sample variance are independent, where the chi-squared and t distributions come from, and why ±1.96 standard errors is too narrow for small samples.",

  glimpse: (
    <>
      <p>
        Means and variances summarise the middle of a sample. The next lesson studies its extremes and ranks, the order
        statistics: the minimum, the maximum and the median.
      </p>
    </>
  ),
};
