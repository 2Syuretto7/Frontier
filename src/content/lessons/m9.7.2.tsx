import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrecisionAddViz } from "@/components/viz/PrecisionAddViz";
import type { LessonContent } from "@/lib/types";

const CONJ = `def gamma_poisson(a, b, xs):
    return a + sum(xs), b + len(xs)

def normal_normal(m0, v0, xs, s2):
    prec = 1 / v0 + len(xs) / s2
    mean = (m0 / v0 + sum(xs) / s2) / prec
    return mean, 1 / prec`;

const CHECK = `import numpy as np

def dirichlet_mean(alpha, counts):
    post = np.asarray(alpha, dtype=float) + np.asarray(counts, dtype=float)
    return post / post.sum()

def grid_mean(a, b, xs, grid):
    logw = (a - 1 + sum(xs)) * np.log(grid) - (b + len(xs)) * grid
    w = np.exp(logw - logw.max())
    return float((grid * w).sum() / w.sum())`;

export const lesson: LessonContent = {
  id: "m9.7.2",
  minutes: 55,
  links: {
    requires: ["m9.7.1", "m9.3.2"],
    revisits: ["m7.5.5", "m9.3.1"],
    foreshadows: ["m9.7.4", "m9.7.5"],
  },

  puzzle: (
    <>
      <p>
        A service logs crashes per day, and you want a running posterior for the crash rate that updates every night in
        microseconds, with no grid and no sampling. For the beta prior and coin flips this worked: the posterior was again
        a beta with updated counts. Which other models allow this, and is there a pattern behind them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the prior has the same functional form as the likelihood viewed as a function of the parameter, multiplying
        them keeps that form. The prior then acts like imaginary earlier data, and updating just adds the real data&apos;s
        sufficient statistics to it.
      </p>
      <PrecisionAddViz />
    </>
  ),

  theory: (
    <>
      <Definition title="conjugate family">
        <p>
          A family of priors is conjugate to a likelihood if every posterior is again in the family. Updating then maps
          prior hyperparameters to posterior hyperparameters.
        </p>
      </Definition>

      <Theorem title="gamma-Poisson and normal-normal">
        <p>
          (a) For Poisson counts x₁, …, xₙ and a Gamma(a, b) prior on the rate (density ∝ λ^(a−1)e^(−bλ)), the posterior is{" "}
          <M>{"\\mathrm{Gamma}(a + \\sum x_i,\\ b + n)"}</M>, with mean <M>{"(a + \\sum x_i)/(b + n)"}</M>. (b) For N(μ, σ²) data
          with σ² known and prior <M>{"\\mu \\sim N(m_0, v_0)"}</M>, the posterior is normal with
        </p>
        <MD>{"\\frac{1}{v_1} = \\frac{1}{v_0} + \\frac{n}{\\sigma^2}, \\qquad m_1 = v_1\\Big(\\frac{m_0}{v_0} + \\frac{n\\bar x}{\\sigma^2}\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          (a) The likelihood is proportional to <M>{"\\lambda^{\\sum x_i}e^{-n\\lambda}"}</M>; times the prior this is{" "}
          <M>{"\\lambda^{a + \\sum x_i - 1}e^{-(b + n)\\lambda}"}</M>, the stated gamma kernel. (b) The log posterior is, up to
          constants, <M>{"-\\frac{(\\mu - m_0)^2}{2v_0} - \\sum\\frac{(x_i - \\mu)^2}{2\\sigma^2}"}</M>, a quadratic in μ with
          coefficient of μ² equal to <M>{"-\\tfrac12(1/v_0 + n/\\sigma^2)"}</M> and coefficient of μ equal to{" "}
          <M>{"m_0/v_0 + n\\bar x/\\sigma^2"}</M>. Completing the square identifies a normal with the stated precision and
          mean.
        </p>
        <Code>{CONJ}</Code>
      </Proof>

      <Example title="Dirichlet and add-one smoothing">
        <p>
          For a categorical with K outcomes and counts n_k, the Dirichlet(α₁, …, α_K) prior gives a Dirichlet(α_k + n_k)
          posterior with mean <M>{"(\\alpha_k + n_k)/\\sum_j(\\alpha_j + n_j)"}</M>. With all α_k = 1 this is Laplace&apos;s
          add-one smoothing: an outcome never observed still gets probability 1/(N + K), not 0. A grid computation confirms
          the closed forms.
        </p>
        <Code>{CHECK}</Code>
      </Example>

      <Theorem title="every exponential family has a conjugate prior">
        <p>
          For <M>{"p(x \\mid \\eta) = h(x)\\exp(\\eta^\\top T(x) - A(\\eta))"}</M>, the family{" "}
          <M>{"\\pi(\\eta) \\propto \\exp(\\eta^\\top\\tau - \\nu A(\\eta))"}</M> is conjugate, with update{" "}
          <M>{"\\tau \\to \\tau + \\sum_i T(x_i)"}</M> and <M>{"\\nu \\to \\nu + n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The likelihood of n observations is proportional to <M>{"\\exp(\\eta^\\top\\sum T(x_i) - nA(\\eta))"}</M>. Multiplying
          by the prior adds the exponents, giving <M>{"\\exp(\\eta^\\top(\\tau + \\sum T(x_i)) - (\\nu + n)A(\\eta))"}</M>.
        </p>
      </Proof>

      <Remark title="where conjugacy is used">
        <p>
          ν reads as a prior sample size and τ as prior sufficient statistics: pseudo-data. Conjugate updates power the
          Kalman filter (normal-normal in many dimensions), Thompson sampling for bandits (beta-Bernoulli), smoothing of
          n-gram language models, and the closed-form posterior of Bayesian linear regression. Their limitation is that the
          prior&apos;s shape is forced on you; for other priors one returns to grids or sampling methods such as
          Metropolis-Hastings.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gp",
      rung: "check",
      prompt: <p>A Gamma(3, 2) prior on a Poisson rate is updated with counts 4 and 6. What is the posterior mean?</p>,
      answer: { kind: "numeric", value: 3.25, tolerance: 0.0001 },
    },
    {
      key: "nn",
      rung: "check",
      prompt: <p>The prior is μ ~ N(0, 4), σ² = 1, and 4 observations have mean 3. What is the posterior mean of μ? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.8235, tolerance: 0.0002 },
    },
    {
      key: "smooth",
      rung: "apply",
      prompt: <p>What does a Dirichlet(1, …, 1) prior on a categorical distribution give as the posterior mean for a category with count n_k, out of N observations in K categories?</p>,
      answer: { kind: "choice", options: ["(n_k + 1)/(N + K)", "n_k/N", "(n_k + 1)/(N + 1)", "1/K"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gamma_poisson(a, b, xs):
    return a + sum(xs), b + len(xs)

def normal_normal(m0, v0, xs, s2):
    prec = 1 / v0 + len(xs) / s2
    mean = (m0 / v0 + sum(xs) / s2) / prec
    return mean, 1 / prec

a, b = gamma_poisson(2, 1, [3, 5, 4])
print((a, b), a / b)
print(normal_normal(0.0, 1.0, [2.0, 2.0, 2.0, 2.0], 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(14, 4) 3.5\n(1.6, 0.2)", "(12, 3) 4.0\n(1.6, 0.2)", "(14, 4) 3.5\n(2.0, 0.25)", "(14, 4) 3.5\n(1.6, 5.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dirichlet_mean(alpha, counts):
    post = np.asarray(alpha, dtype=float) + np.asarray(counts, dtype=float)
    return post / post.sum()

def grid_mean(a, b, xs, grid):
    logw = (a - 1 + sum(xs)) * np.log(grid) - (b + len(xs)) * grid
    w = np.exp(logw - logw.max())
    return float((grid * w).sum() / w.sum())

print([round(float(v), 3) for v in dirichlet_mean([1, 1, 1], [8, 0, 2])])
print(round(grid_mean(2, 1, [3, 5, 4], np.linspace(0.001, 20, 20000)), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.692, 0.077, 0.231]\n3.5", "[0.8, 0.0, 0.2]\n3.5", "[0.692, 0.077, 0.231]\n4.0", "[0.333, 0.333, 0.333]\n3.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gamma_poisson(a, b, xs)</C>, returning the posterior gamma parameters, and{" "}
          <C>normal_normal(m0, v0, xs, s2)</C>, returning the posterior mean and variance of a normal mean with known
          variance s2.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gamma_poisson(a, b, xs):
    return a, b

def normal_normal(m0, v0, xs, s2):
    return m0, v0
`,
        solution: CONJ,
        tests: [
          { name: "gp", code: `assert gamma_poisson(1, 1, []) == (1, 1) and gamma_poisson(0.5, 2, [1, 2]) == (3.5, 4)` },
          { name: "nn", code: `m, v = normal_normal(1.0, 1.0, [3.0], 1.0)
assert abs(m - 2) < 1e-12 and abs(v - 0.5) < 1e-12
m, v = normal_normal(0.0, 4.0, [3.0] * 4, 1.0)
assert abs(m - 12 / 4.25) < 1e-12 and abs(v - 1 / 4.25) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dirichlet_mean(alpha, counts)</C>, the posterior mean probability vector, and{" "}
          <C>grid_mean(a, b, xs, grid)</C>, the posterior mean of a Poisson rate under a Gamma(a, b) prior computed by
          normalising the unnormalised log-posterior on the grid (subtract its maximum before exponentiating).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dirichlet_mean(alpha, counts):
    return np.ones(len(counts)) / len(counts)

def grid_mean(a, b, xs, grid):
    return 0.0
`,
        solution: CHECK,
        tests: [
          { name: "dir", code: `import numpy as np
assert np.allclose(dirichlet_mean([2, 2], [0, 4]), [0.25, 0.75])` },
          { name: "grid", code: `import numpy as np
g = np.linspace(0.001, 40, 40000)
assert abs(grid_mean(1, 0.5, [10, 12, 9], g) - 32 / 3.5) < 1e-3
assert abs(grid_mean(1000, 1000, [], g) - 1) < 1e-3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a Gamma(a, b) prior on a Poisson rate λ, with density proportional to λ^(a−1)e^(−bλ), gives a Gamma(a + Σxᵢ, b + n) posterior after observing counts x₁, …, xₙ.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the Poisson likelihood ∏ e^(−λ)λ^(xᵢ)/xᵢ! and notes it is proportional to λ^(Σxᵢ)e^(−nλ) as a function of λ.",
          "Multiplies by the prior kernel to obtain λ^(a + Σxᵢ − 1)e^(−(b + n)λ).",
          "Identifies this as the kernel of Gamma(a + Σxᵢ, b + n), so after normalisation the posterior is exactly that distribution.",
        ],
      },
    },
    {
      key: "pred0",
      rung: "stretch",
      prompt: <p>With a Gamma(13, 4) posterior on a Poisson rate, the probability that the next count is 0 is (b/(b + 1))^a. What is it? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.055, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what a conjugate prior is, derive the gamma-Poisson and normal-normal updates, explain why precisions add and how prior hyperparameters act as pseudo-data, and why every exponential family has a conjugate prior.",

  glimpse: (
    <>
      <p>
        A posterior is a whole distribution, yet in practice we often keep only its peak. The next lesson compares that
        MAP estimate with full Bayesian inference and shows where the shortcut misleads.
      </p>
    </>
  ),
};
