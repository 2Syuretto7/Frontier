import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RunningMeanViz } from "@/components/viz/RunningMeanViz";
import type { LessonContent } from "@/lib/types";

const RUN = `import math, numpy as np

def running_mean(x):
    x = np.asarray(x, dtype=float)
    return np.cumsum(x) / np.arange(1, len(x) + 1)

def chebyshev_n(var, eps, delta):
    return math.ceil(var / (eps * eps * delta))`;

const SIM = `import numpy as np

def frac_outside(rng, sampler, n, eps, mu, reps):
    means = np.array([sampler(rng, n).mean() for _ in range(reps)])
    return float(np.mean(np.abs(means - mu) > eps))

def ecdf_max_gap(x, cdf):
    xs = np.sort(x)
    n = len(xs)
    F = cdf(xs)
    return float(max(np.max(np.arange(1, n + 1) / n - F), np.max(F - np.arange(n) / n)))`;

export const lesson: LessonContent = {
  id: "m7.7.1",
  minutes: 55,
  links: {
    requires: ["m7.4.2", "m7.2.4"],
    revisits: ["m7.2.3", "m7.3.3"],
    foreshadows: ["m7.7.2", "m7.7.3"],
  },

  puzzle: (
    <>
      <p>
        Every estimate from data, from a poll to a validation accuracy to a Monte Carlo integral, rests on one belief: the
        average of many independent measurements is close to the true mean. In what sense is that true, how many
        measurements are enough, and are there distributions for which averaging never settles down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sample mean of n independent draws has the same mean as one draw but variance divided by n. As n grows its
        distribution squeezes onto the true mean, and the running average of a single long sequence wanders less and less.
        It needs a finite mean to aim at: without one, averaging does not help.
      </p>
      <RunningMeanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convergence in probability and almost surely">
        <p>
          A sequence <M>{"Z_n"}</M> converges in probability to c if{" "}
          <M>{"P(|Z_n - c| > \\varepsilon) \\to 0"}</M> for every <M>{"\\varepsilon > 0"}</M>. It converges almost surely if{" "}
          <M>{"P(Z_n \\to c) = 1"}</M>: with probability 1 the sequence of numbers converges. Almost sure convergence implies
          convergence in probability, but not conversely.
        </p>
      </Definition>

      <Theorem title="weak law of large numbers">
        <p>
          Let <M>{"X_1, X_2, \\dots"}</M> be i.i.d. with mean μ and finite variance σ², and{" "}
          <M>{"\\bar X_n = (X_1 + \\dots + X_n)/n"}</M>. Then for every <M>{"\\varepsilon > 0"}</M>,
        </p>
        <MD>{"P(|\\bar X_n - \\mu| > \\varepsilon) \\le \\frac{\\sigma^2}{n\\varepsilon^2} \\to 0."}</MD>
      </Theorem>
      <Proof>
        <p>
          By linearity <M>{"E[\\bar X_n] = \\mu"}</M>, and by independence the variances add:{" "}
          <M>{"\\operatorname{Var}(\\bar X_n) = n\\sigma^2/n^2 = \\sigma^2/n"}</M>. Chebyshev&apos;s inequality gives{" "}
          <M>{"P(|\\bar X_n - \\mu| > \\varepsilon) \\le \\operatorname{Var}(\\bar X_n)/\\varepsilon^2 = \\sigma^2/(n\\varepsilon^2)"}</M>.
        </p>
      </Proof>
      <p>
        The bound also answers &quot;how many?&quot;: to be within ε with probability at least 1 − δ, n ≥ σ²/(ε²δ) suffices. For a
        fair coin (σ² = 1/4), ε = 0.05 and δ = 0.05 this asks for 2000 tosses. The bound is crude; the central limit theorem
        and Chernoff bounds show far fewer are needed, but it is always valid.
      </p>
      <Code>{RUN}</Code>

      <Theorem title="strong law of large numbers">
        <p>
          If <M>{"X_1, X_2, \\dots"}</M> are i.i.d. with <M>{"E|X_1| < \\infty"}</M> and mean μ, then{" "}
          <M>{"\\bar X_n \\to \\mu"}</M> almost surely. No variance is needed.
        </p>
      </Theorem>
      <Remark title="weak and strong">
        <p>
          The weak law is about one large n at a time: most samples of size n are good. The strong law is about a single
          infinite sequence: with probability 1, its running average eventually stays inside any band around μ. The proof
          is longer and is not needed for what follows.
        </p>
      </Remark>

      <Example title="frequencies and the empirical distribution">
        <p>
          Applying the law to indicators <M>{"1\\{X_i \\in A\\}"}</M> shows the fraction of draws landing in A converges to
          P(A): probability is long-run frequency. Doing it for every set <M>{"(-\\infty, t]"}</M> at once, the empirical CDF{" "}
          <M>{"F_n(t)"}</M> converges to F(t), and the Glivenko–Cantelli theorem says even the worst gap over t goes to 0.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Example title="when it fails">
        <p>
          The Cauchy distribution, the tangent of a uniform angle, has no mean: <M>{"E|X| = \\infty"}</M>. The average of n
          independent Cauchy draws is again standard Cauchy, as spread out as one draw, so no amount of averaging helps.
          Heavy tails with an infinite variance but a finite mean still obey the strong law, only slowly.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cheb",
      rung: "check",
      prompt: <p>Draws have variance 4. Chebyshev bounds P(|X̄₁₀₀ − μ| &gt; 0.5) by what number?</p>,
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0001 },
    },
    {
      key: "howmany",
      rung: "check",
      prompt: <p>Draws have variance 1. Using Chebyshev, how many are enough to be within 0.1 of the mean with probability at least 0.95?</p>,
      answer: { kind: "numeric", value: 2000, tolerance: 0.5 },
    },
    {
      key: "fails",
      rung: "apply",
      prompt: <p>For which i.i.d. sequence does the sample mean not converge to a constant?</p>,
      answer: {
        kind: "choice",
        options: ["Standard Cauchy draws", "Exponential draws with mean 3", "Fair die rolls", "Pareto draws with finite mean and infinite variance"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math, numpy as np

def running_mean(x):
    x = np.asarray(x, dtype=float)
    return np.cumsum(x) / np.arange(1, len(x) + 1)

def chebyshev_n(var, eps, delta):
    return math.ceil(var / (eps * eps * delta))

print(np.round(running_mean([1, 0, 1, 1, 0, 1]), 3))
print(chebyshev_n(0.25, 0.05, 0.05), chebyshev_n(1, 0.1, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.    0.5   0.667 0.75  0.6   0.667]\n2000 10000",
          "[1.    0.5   0.667 0.75  0.6   0.667]\n100 10000",
          "[1.    1.    2.    3.    3.    4.   ]\n2000 10000",
          "[1.    0.5   0.667 0.75  0.6   0.667]\n2000 100",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def frac_outside(rng, sampler, n, eps, mu, reps):
    means = np.array([sampler(rng, n).mean() for _ in range(reps)])
    return float(np.mean(np.abs(means - mu) > eps))

def ecdf_max_gap(x, cdf):
    xs = np.sort(x)
    n = len(xs)
    F = cdf(xs)
    return float(max(np.max(np.arange(1, n + 1) / n - F), np.max(F - np.arange(n) / n)))

rng = np.random.default_rng(0)
coin = lambda r, n: r.integers(0, 2, n)
print([frac_outside(rng, coin, n, 0.05, 0.5, 2000) for n in (10, 100, 1000)])
gaps = [ecdf_max_gap(rng.random(n), lambda t: t) for n in (100, 10000)]
print([round(g, 2) for g in gaps])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.7575, 0.3275, 0.0035]\n[0.09, 0.01]",
          "[0.2425, 0.6725, 0.9965]\n[0.09, 0.01]",
          "[0.7575, 0.3275, 0.0035]\n[0.01, 0.09]",
          "[0.0, 0.0, 0.0]\n[0.09, 0.01]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>running_mean(x)</C>, returning the array of averages of the first 1, 2, …, n entries, and{" "}
          <C>chebyshev_n(var, eps, delta)</C>, the smallest integer n with var/(n·eps²) ≤ delta.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math, numpy as np

def running_mean(x):
    return np.asarray(x, dtype=float)

def chebyshev_n(var, eps, delta):
    return 0
`,
        solution: RUN,
        tests: [
          { name: "running", code: `r = running_mean([2, 4, 0, 6])
assert np.allclose(r, [2, 3, 2, 3]) and len(r) == 4
assert np.allclose(running_mean(np.ones(5) * 7), 7)` },
          { name: "chebyshev", code: `assert chebyshev_n(0.25, 0.05, 0.05) == 2000 and chebyshev_n(4, 0.5, 0.16) == 100
n = chebyshev_n(2.0, 0.3, 0.1)
assert 2.0 / (n * 0.09) <= 0.1 + 1e-12 and 2.0 / ((n - 1) * 0.09) > 0.1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>frac_outside(rng, sampler, n, eps, mu, reps)</C>, where <C>sampler(rng, n)</C> returns n draws, giving the
          fraction of reps sample means farther than eps from mu, and <C>ecdf_max_gap(x, cdf)</C>, the largest gap between the
          empirical CDF of x and the vectorised CDF cdf, checking both sides of every jump.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def frac_outside(rng, sampler, n, eps, mu, reps):
    return 0.0

def ecdf_max_gap(x, cdf):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "outside", code: `const = lambda r, n: np.full(n, 3.0)
assert frac_outside(np.random.default_rng(0), const, 5, 0.1, 3.0, 50) == 0.0
assert frac_outside(np.random.default_rng(0), const, 5, 0.1, 2.0, 50) == 1.0
f = frac_outside(np.random.default_rng(1), lambda r, n: r.normal(0, 1, n), 25, 0.2, 0.0, 4000)
assert abs(f - 0.3173) < 0.03` },
          { name: "ecdf gap", code: `g = ecdf_max_gap(np.array([0.5]), lambda t: t)
assert abs(g - 0.5) < 1e-12
g = ecdf_max_gap(np.array([0.1, 0.2, 0.9]), lambda t: t)
assert abs(g - 7 / 15) < 1e-9
assert abs(ecdf_max_gap(np.array([0.25, 0.75]), lambda t: t) - 0.25) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"X_1, \\dots, X_n"}</M> be i.i.d. with mean μ and variance σ². Prove that{" "}
          <M>{"P(|\\bar X_n - \\mu| > \\varepsilon) \\le \\sigma^2/(n\\varepsilon^2)"}</M>, and conclude the weak law of large
          numbers.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows E[X̄ₙ] = μ by linearity.",
          "Shows Var(X̄ₙ) = σ²/n, using independence (or uncorrelatedness) so the variances add, and the 1/n² scaling.",
          "Applies Chebyshev to X̄ₙ and notes the bound tends to 0 as n → ∞ for each fixed ε.",
        ],
      },
    },
    {
      key: "exact",
      rung: "stretch",
      prompt: <p>For 10 fair coin tosses, compute exactly P(|X̄₁₀ − 0.5| &gt; 0.05). Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.7539, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the average of many independent draws approaches the mean, how Chebyshev gives a sample size that is always enough, what the strong law adds, and why averaging Cauchy draws never settles.",

  glimpse: (
    <>
      <p>
        The law of large numbers says the error <M>{"\\bar X_n - \\mu"}</M> shrinks to 0. The next lesson magnifies it by{" "}
        <M>{"\\sqrt n"}</M> and finds that, whatever the distribution of the draws, the magnified error is approximately normal.
      </p>
    </>
  ),
};
