import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { McPiViz } from "@/components/viz/McPiViz";
import type { LessonContent } from "@/lib/types";

const MC = `import numpy as np

def mc_estimate(rng, f, sampler, n):
    vals = f(sampler(rng, n))
    return float(vals.mean()), float(vals.std(ddof=1) / np.sqrt(n))

def ci95(est, se):
    return est - 1.96 * se, est + 1.96 * se`;

const ANTI = `import numpy as np

def pi_estimate(rng, n):
    x, y = rng.random(n), rng.random(n)
    return float(4 * np.mean(x * x + y * y <= 1))

def antithetic(rng, f, n):
    u = rng.random(n // 2)
    pair = (f(u) + f(1 - u)) / 2
    return float(pair.mean()), float(pair.std(ddof=1) / np.sqrt(n // 2))`;

export const lesson: LessonContent = {
  id: "m7.7.3",
  minutes: 60,
  links: {
    requires: ["m7.7.2"],
    revisits: ["m7.3.3", "m7.5.2"],
    foreshadows: ["m13.1.1", "m13.1.2", "m13.1.3"],
  },

  puzzle: (
    <>
      <p>
        How would you compute a 50-dimensional integral? A grid with only 10 points per axis needs 10⁵⁰ evaluations. Yet
        averaging a few million random evaluations gives an answer with an error bar, and the error bar does not care about
        the dimension. The price is slow convergence. Why does randomness beat the grid, and how can its cost be cut?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any quantity you can write as an expectation can be estimated by simulating and averaging. The law of large numbers
        says the average converges; the central limit theorem says how far off it is, about σ/√n, using only the spread of
        what you average. A probability is the expectation of an indicator, and an integral over a region is an expectation
        under the uniform distribution.
      </p>
      <McPiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Monte Carlo estimator">
        <p>
          To estimate <M>{"\\theta = E[h(X)]"}</M>, draw i.i.d. <M>{"X_1, \\dots, X_n"}</M> from the distribution of X and set
        </p>
        <MD>{"\\hat\\theta_n = \\frac1n\\sum_{i=1}^n h(X_i), \\qquad \\widehat{\\mathrm{se}} = \\frac{s}{\\sqrt n},"}</MD>
        <p>
          where s is the sample standard deviation of the <M>{"h(X_i)"}</M>.
        </p>
      </Definition>
      <Theorem title="accuracy">
        <p>
          If <M>{"\\sigma^2 = \\operatorname{Var}(h(X)) < \\infty"}</M>, then <M>{"\\hat\\theta_n"}</M> is unbiased with variance{" "}
          <M>{"\\sigma^2/n"}</M>, converges to θ almost surely, and{" "}
          <M>{"\\hat\\theta_n \\pm 1.96\\,\\widehat{\\mathrm{se}}"}</M> is an approximate 95% confidence interval for θ.
        </p>
      </Theorem>
      <Proof>
        <p>
          The <M>{"h(X_i)"}</M> are i.i.d. with mean θ and variance σ², so linearity gives unbiasedness, independence gives
          variance σ²/n, the strong law gives convergence, and the CLT gives{" "}
          <M>{"\\sqrt n(\\hat\\theta_n - \\theta)/\\sigma \\approx N(0, 1)"}</M>. Replacing σ by s, which converges to σ by the law
          of large numbers applied to the squares, does not change the limit (Slutsky&apos;s lemma).
        </p>
      </Proof>
      <Example title="an integral with an error bar">
        <p>
          <M>{"\\int_0^1 e^x\\,dx = E[e^U]"}</M> with U uniform, exactly e − 1 ≈ 1.7183. With 100 000 draws:
        </p>
        <Code>{MC}</Code>
        <p>
          Over a region of volume V in any dimension,{" "}
          <M>{"\\int_D f = V\\,E[f(X)]"}</M> with X uniform on D, and the error is still σ/√n. A grid rule with error{" "}
          <M>{"O(n^{-2/d})"}</M> wins in one or two dimensions and loses badly in many.
        </p>
      </Example>

      <Remark title="rare events">
        <p>
          Estimating a probability p by a fraction has standard error <M>{"\\sqrt{p(1 - p)/n}"}</M>, so the relative error is
          about <M>{"1/\\sqrt{np}"}</M>: to get 10% relative error you need about 100/p samples, roughly 100 hits. A one-in-a-million
          event needs a hundred million draws, which is why importance sampling, which samples the rare region on purpose,
          exists.
        </p>
      </Remark>

      <Theorem title="antithetic variates">
        <p>
          For U uniform on (0, 1), the pair average <M>{"\\tfrac12(f(U) + f(1 - U))"}</M> has mean <M>{"E[f(U)]"}</M> and variance{" "}
          <M>{"\\tfrac12(\\sigma^2 + \\operatorname{Cov}(f(U), f(1 - U)))"}</M>. When f is monotone the covariance is negative,
          so n/2 antithetic pairs beat n independent draws.
        </p>
      </Theorem>
      <Proof>
        <p>
          1 − U is also uniform, so both terms have mean E[f(U)] and variance σ². Then{" "}
          <M>{"\\operatorname{Var}(\\tfrac12(A + B)) = \\tfrac14(\\sigma^2 + \\sigma^2 + 2\\operatorname{Cov}(A, B))"}</M>. For
          monotone f, f(U) and f(1 − U) move in opposite directions as U varies, and the covariance of an increasing and a
          decreasing function of the same variable is at most 0.
        </p>
      </Proof>
      <p>
        For <M>{"e^U"}</M> the standard error falls from 0.0016 to 0.0003 for the same 100 000 evaluations, worth about 30
        times as many plain draws.
      </p>
      <Code>{ANTI}</Code>

      <Remark title="where the samples come from">
        <p>
          Everything here assumed we can draw from the target distribution, by the inverse CDF of an earlier lesson or a
          library routine. For a posterior known only up to a constant, we cannot. The next chapter builds Markov chains whose
          long-run distribution is the target, and Metropolis–Hastings turns that into a sampler.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>The quantity you average has standard deviation 2. What is the standard error of the Monte Carlo average of 10 000 draws?</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.00001 },
    },
    {
      key: "rare",
      rung: "check",
      prompt: (
        <p>
          You estimate p = 0.001 by the fraction of hits. How many draws make the standard error 10% of p, using{" "}
          <M>{"\\sqrt{p(1 - p)/n}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 99900, tolerance: 0.5 },
    },
    {
      key: "halve",
      rung: "apply",
      prompt: <p>A Monte Carlo estimate has error bar ±0.04. Roughly how many times as many draws make it ±0.01?</p>,
      answer: { kind: "choice", options: ["16", "4", "2", "100"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mc_estimate(rng, f, sampler, n):
    vals = f(sampler(rng, n))
    return float(vals.mean()), float(vals.std(ddof=1) / np.sqrt(n))

def ci95(est, se):
    return est - 1.96 * se, est + 1.96 * se

rng = np.random.default_rng(0)
m, se = mc_estimate(rng, np.exp, lambda r, n: r.random(n), 100000)
print(round(m, 3), round(se, 4), [round(v, 3) for v in ci95(m, se)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.717 0.0016 [1.714, 1.72]",
          "1.717 0.4908 [0.755, 2.679]",
          "1.717 0.0016 [1.715, 1.719]",
          "1.718 0.0 [1.718, 1.718]",
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

def pi_estimate(rng, n):
    x, y = rng.random(n), rng.random(n)
    return float(4 * np.mean(x * x + y * y <= 1))

def antithetic(rng, f, n):
    u = rng.random(n // 2)
    pair = (f(u) + f(1 - u)) / 2
    return float(pair.mean()), float(pair.std(ddof=1) / np.sqrt(n // 2))

rng = np.random.default_rng(1)
print(round(pi_estimate(rng, 10 ** 6), 3))
a, sa = antithetic(rng, np.exp, 100000)
print(round(a, 3), round(sa, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.143\n1.719 0.0003", "0.786\n1.719 0.0003", "3.143\n1.719 0.0016", "3.143\n0.859 0.0003"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mc_estimate(rng, f, sampler, n)</C>, where <C>sampler(rng, n)</C> returns n draws and f is vectorised,
          returning the floats (estimate, standard error) with the sample standard deviation (ddof=1), and{" "}
          <C>ci95(est, se)</C>, returning the tuple (est − 1.96 se, est + 1.96 se).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mc_estimate(rng, f, sampler, n):
    return 0.0, 0.0

def ci95(est, se):
    return est, est
`,
        solution: MC,
        tests: [
          { name: "deterministic", code: `seq = lambda r, n: np.arange(n, dtype=float)
m, se = mc_estimate(None, lambda x: x, seq, 4)
assert abs(m - 1.5) < 1e-12 and abs(se - np.std([0, 1, 2, 3], ddof=1) / 2) < 1e-12 and isinstance(se, float)
lo, hi = ci95(10.0, 0.5)
assert abs(lo - 9.02) < 1e-12 and abs(hi - 10.98) < 1e-12` },
          { name: "covers", code: `m, se = mc_estimate(np.random.default_rng(5), lambda x: x ** 2, lambda r, n: r.random(n), 200000)
lo, hi = ci95(m, se)
assert lo < 1 / 3 < hi and abs(se - (4 / 45) ** 0.5 / 200000 ** 0.5) < 1e-5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pi_estimate(rng, n)</C>, returning 4 times the fraction of n uniform points in the unit square with{" "}
          <M>{"x^2 + y^2 \\le 1"}</M>, and <C>antithetic(rng, f, n)</C>, which draws n // 2 uniforms u, averages f(u) and
          f(1 − u) pairwise, and returns the floats (mean of the pair averages, their standard error with ddof=1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pi_estimate(rng, n):
    return 3.0

def antithetic(rng, f, n):
    return 0.0, 0.0
`,
        solution: ANTI,
        tests: [
          { name: "pi", code: `p = pi_estimate(np.random.default_rng(7), 400000)
assert isinstance(p, float) and abs(p - np.pi) < 0.01` },
          { name: "antithetic", code: `m, se = antithetic(np.random.default_rng(0), lambda u: u, 1000)
assert abs(m - 0.5) < 1e-12 and se < 1e-12
m, se = antithetic(np.random.default_rng(1), lambda u: u ** 2, 200000)
assert abs(m - 1 / 3) < 0.001 and abs(se - (1 / 180) ** 0.5 / 100000 ** 0.5) < 2e-5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"\\hat\\theta_n"}</M> be the average of n i.i.d. copies of h(X), with <M>{"\\operatorname{Var}(h(X)) = \\sigma^2"}</M>.
          Prove that <M>{"\\hat\\theta_n"}</M> is unbiased with variance σ²/n, and explain why{" "}
          <M>{"\\hat\\theta_n \\pm 1.96\\,\\sigma/\\sqrt n"}</M> contains θ with probability close to 0.95 for large n.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses linearity: E[θ̂ₙ] = (1/n)·n·θ = θ.",
          "Uses independence so variances add: Var(θ̂ₙ) = nσ²/n² = σ²/n.",
          "Applies the CLT to √n(θ̂ₙ − θ)/σ and rewrites P(|θ̂ₙ − θ| ≤ 1.96σ/√n) ≈ Φ(1.96) − Φ(−1.96) ≈ 0.95.",
        ],
      },
    },
    {
      key: "anti",
      rung: "stretch",
      prompt: (
        <p>
          For f(u) = u², plain Monte Carlo with n draws has variance (4/45)/n, while n/2 antithetic pairs have pair-average
          variance 1/180. By what factor does the antithetic estimator reduce the variance for the same n evaluations?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend how to estimate any expectation or integral by simulation, how to attach an error bar, why the error shrinks like 1/√n in any dimension, why rare events are expensive, and how antithetic pairs reduce the variance.",

  glimpse: (
    <>
      <p>
        Plain Monte Carlo needs independent samples from the target. The final chapter of this course drops independence:
        a Markov chain wanders so that it spends the right fraction of time everywhere, and averaging along its path still
        obeys a law of large numbers.
      </p>
    </>
  ),
};
