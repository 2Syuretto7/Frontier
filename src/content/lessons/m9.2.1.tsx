import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MomFitViz } from "@/components/viz/MomFitViz";
import type { LessonContent } from "@/lib/types";

const MOM = `def mom_gamma(xs):
    n = len(xs)
    m = sum(xs) / n
    v = sum((x - m) ** 2 for x in xs) / n
    return m * m / v, v / m

def mom_uniform(xs):
    return 2 * sum(xs) / len(xs)`;

const SIM = `import numpy as np

def mom_gamma_np(X):
    m, v = X.mean(axis=1), X.var(axis=1)
    return m * m / v, v / m

def spread(n, reps=20000, k=2.0, theta=3.0, seed=0):
    X = np.random.default_rng(seed).gamma(k, theta, size=(reps, n))
    kh, th = mom_gamma_np(X)
    return kh.mean(), kh.std()`;

export const lesson: LessonContent = {
  id: "m9.2.1",
  minutes: 50,
  links: {
    requires: ["m9.1.1", "m7.7.1"],
    revisits: ["m7.4.1", "m7.3.2"],
    foreshadows: ["m9.2.2", "m9.2.4"],
  },

  puzzle: (
    <>
      <p>
        Waiting times between requests to a server are skewed: mostly short, occasionally long. A gamma distribution with
        shape k and scale θ fits such data well, but which k and θ? There is no simple formula for the gamma that best fits
        the data in every sense, yet one quick recipe gives answers in a line: make the model&apos;s mean and variance equal
        the sample&apos;s.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The law of large numbers says sample moments approach the true moments. If the parameters can be read off from the
        moments, read them off from the sample moments instead. With p unknown parameters, match p moments and solve.
      </p>
      <MomFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="method of moments">
        <p>
          For a model with parameter <M>{"\\theta \\in \\mathbb{R}^p"}</M>, let <M>{"\\mu_j(\\theta) = \\mathbb{E}_\\theta[X^j]"}</M>{" "}
          and let <M>{"m_j = \\frac1n \\sum X_i^j"}</M> be the sample moments. The method of moments estimator solves
        </p>
        <MD>{"\\mu_j(\\hat\\theta) = m_j, \\qquad j = 1, \\dots, p."}</MD>
        <p>Central moments may be used instead of raw ones; the solution is the same.</p>
      </Definition>

      <Example title="uniform and gamma">
        <p>
          For Uniform(0, θ), μ₁ = θ/2, so <M>{"\\hat\\theta = 2\\bar X"}</M>. For a gamma with shape k and scale θ, the mean is
          kθ and the variance kθ², so <M>{"\\hat\\theta = v/\\bar X"}</M> and <M>{"\\hat k = \\bar X^2 / v"}</M>, where v is the
          sample variance with divisor n.
        </p>
        <Code>{MOM}</Code>
      </Example>

      <Theorem title="consistency">
        <p>
          If <M>{"\\theta = g(\\mu_1, \\dots, \\mu_p)"}</M> for a function g continuous at the true moments, then the
          estimator <M>{"\\hat\\theta = g(m_1, \\dots, m_p)"}</M> converges in probability to θ.
        </p>
      </Theorem>
      <Proof>
        <p>
          Given ε, continuity gives δ such that <M>{"|g(m) - g(\\mu)| < \\varepsilon"}</M> whenever every{" "}
          <M>{"|m_j - \\mu_j| < \\delta"}</M>. By the law of large numbers each <M>{"P(|m_j - \\mu_j| \\geq \\delta) \\to 0"}</M>, so
          by the union bound the probability that some coordinate is off by δ tends to 0, and so does{" "}
          <M>{"P(|\\hat\\theta - \\theta| \\geq \\varepsilon)"}</M>.
        </p>
        <Code>{SIM}</Code>
      </Proof>

      <Example title="an impossible estimate">
        <p>
          For the uniform sample 0.2, 0.9, 0.1 the method of moments gives <M>{"\\hat\\theta = 0.8"}</M>, yet one observation is
          0.9, which is impossible if θ = 0.8. The estimator ignores the information that every observation lies below θ. The
          next lesson&apos;s method, maximum likelihood, uses it and estimates θ by the maximum.
        </p>
      </Example>

      <Remark title="where it is still used">
        <p>
          Moment matching is fast, needs no optimisation, and gives good starting points for iterative fits. Its
          generalisation, the generalised method of moments, is a workhorse in econometrics, and moment matching ideas appear
          in machine learning in batch normalisation statistics, in kernel two-sample tests, and in distillation objectives.
          Its weakness is efficiency: it can waste information, as the simulation shows k̂ is biased and noisy for small n.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unif",
      rung: "check",
      prompt: <p>A sample from Uniform(0, θ) has mean 3.2. What is the method of moments estimate of θ?</p>,
      answer: { kind: "numeric", value: 6.4, tolerance: 0.0001 },
    },
    {
      key: "gamma",
      rung: "check",
      prompt: <p>A gamma sample has mean 6 and variance (divisor n) 18. What is the method of moments estimate of the shape k?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "exp",
      rung: "apply",
      prompt: <p>For the exponential distribution with rate λ (mean 1/λ), what is the method of moments estimator?</p>,
      answer: { kind: "choice", options: ["1/X̄", "X̄", "1/S²", "X̄²"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mom_gamma(xs):
    n = len(xs)
    m = sum(xs) / n
    v = sum((x - m) ** 2 for x in xs) / n
    return m * m / v, v / m

def mom_uniform(xs):
    return 2 * sum(xs) / len(xs)

xs = [1, 2, 3, 4, 5]
print(mom_gamma(xs), mom_uniform(xs))
print(round(mom_uniform([0.2, 0.9, 0.1]), 4), max([0.2, 0.9, 0.1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(4.5, 0.6666666666666666) 6.0\n0.8 0.9", "(4.5, 0.6666666666666666) 6.0\n0.9 0.9", "(3.6, 0.8333333333333334) 6.0\n0.8 0.9", "(0.6666666666666666, 4.5) 6.0\n0.8 0.9"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mom_gamma_np(X):
    m, v = X.mean(axis=1), X.var(axis=1)
    return m * m / v, v / m

def spread(n, reps=20000, k=2.0, theta=3.0, seed=0):
    X = np.random.default_rng(seed).gamma(k, theta, size=(reps, n))
    kh, th = mom_gamma_np(X)
    return kh.mean(), kh.std()

for n in (10, 100, 1000):
    print(n, [round(float(v), 2) for v in spread(n)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["10 [3.02, 1.89]\n100 [2.09, 0.35]\n1000 [2.01, 0.11]", "10 [2.0, 1.89]\n100 [2.0, 0.35]\n1000 [2.0, 0.11]", "10 [3.02, 0.11]\n100 [2.09, 0.35]\n1000 [2.01, 1.89]", "10 [1.5, 1.89]\n100 [1.9, 0.35]\n1000 [1.99, 0.11]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mom_gamma(xs)</C>, returning (k̂, θ̂) = (x̄²/v, v/x̄) with v the variance with divisor n, and{" "}
          <C>mom_uniform(xs)</C>, returning 2x̄.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mom_gamma(xs):
    return 1.0, 1.0

def mom_uniform(xs):
    return 0.0
`,
        solution: MOM,
        tests: [
          { name: "gamma", code: `k, t = mom_gamma([2, 4])
assert k == 9 and abs(t - 1 / 3) < 1e-12` },
          { name: "uniform", code: `assert mom_uniform([1, 3]) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mom_gamma_np(X)</C>, applying the gamma moment estimator to each row of a 2-D array and returning the arrays
          (k̂, θ̂), and <C>spread(n, reps=20000, k=2.0, theta=3.0, seed=0)</C>, which simulates reps gamma samples of size n
          with default_rng(seed).gamma and returns the mean and standard deviation of k̂.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mom_gamma_np(X):
    return X[:, 0], X[:, 0]

def spread(n, reps=20000, k=2.0, theta=3.0, seed=0):
    return 0.0, 0.0
`,
        solution: SIM,
        tests: [
          { name: "rows", code: `import numpy as np
kh, th = mom_gamma_np(np.array([[2.0, 4.0], [1.0, 3.0]]))
assert np.allclose(kh, [9, 4]) and np.allclose(th, [1 / 3, 0.5])` },
          { name: "spread", code: `m, s = spread(2000, reps=2000)
assert abs(m - 2) < 0.05 and s < 0.15` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For an iid sample from Uniform(0, θ), prove that 2X̄ is unbiased for θ and converges to θ in probability.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Computes E[X] = θ/2, so E[2X̄] = θ.",
          "Computes Var(X) = θ²/12 and hence Var(2X̄) = 4·θ²/(12n) = θ²/(3n).",
          "Applies Chebyshev's inequality: P(|2X̄ − θ| ≥ ε) ≤ θ²/(3nε²) → 0.",
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: <p>For Uniform(0, 6) and n = 12, what is the variance of the estimator 2X̄?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the method of moments works, how it gives estimators for the uniform and gamma models, why it is consistent, and the example where it produces an impossible estimate.",

  glimpse: (
    <>
      <p>
        Maximum likelihood, next, picks the parameter under which the observed data were most probable. It fixes the
        uniform example and turns out to be the estimator behind nearly every training loss.
      </p>
    </>
  ),
};
