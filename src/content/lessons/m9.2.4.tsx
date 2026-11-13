import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MseSplitViz } from "@/components/viz/MseSplitViz";
import type { LessonContent } from "@/lib/types";

const SHRINK = `def mse_shrink(c, mu, sigma, n):
    bias = (c - 1) * mu
    var = c * c * sigma * sigma / n
    return bias * bias, var, bias * bias + var

def best_c(mu, sigma, n):
    return mu * mu / (mu * mu + sigma * sigma / n)`;

const SIM = `import numpy as np

def bias_var(est, truth):
    est = np.asarray(est, dtype=float)
    return float(est.mean() - truth), float(est.var())

def var_mse(n, divisors, reps=200000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, n))
    ss = ((X - X.mean(axis=1, keepdims=True)) ** 2).sum(axis=1)
    return [float(((ss / d - 1) ** 2).mean()) for d in divisors]`;

export const lesson: LessonContent = {
  id: "m9.2.4",
  minutes: 50,
  links: {
    requires: ["m9.2.3", "m7.2.4"],
    revisits: ["m9.1.1", "m7.4.2"],
    foreshadows: ["m9.3.4", "m9.6.4"],
  },

  puzzle: (
    <>
      <p>
        The first lesson of this course praised dividing by n − 1 because it makes the variance estimate unbiased. Yet for
        normal samples, dividing by n + 1 gives an estimate that is, on average, closer to the truth. How can a biased
        estimator be more accurate than an unbiased one, and what should &quot;accurate&quot; mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An estimator can miss in two ways: it can be centred in the wrong place (bias) or scatter widely around its centre
        (variance). Mean squared error adds the two. Accepting a small bias to remove a lot of variance is often a good
        trade.
      </p>
      <MseSplitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="bias, variance, mean squared error">
        <p>For an estimator <M>{"\\hat\\theta"}</M> of θ,</p>
        <MD>{"\\mathrm{bias}(\\hat\\theta) = \\mathbb{E}[\\hat\\theta] - \\theta, \\qquad \\mathrm{MSE}(\\hat\\theta) = \\mathbb{E}[(\\hat\\theta - \\theta)^2]."}</MD>
        <p>
          All expectations are under the true θ, so each is a function of θ. The estimator is unbiased if its bias is 0 for
          every θ.
        </p>
      </Definition>

      <Theorem title="the decomposition">
        <MD>{"\\mathrm{MSE}(\\hat\\theta) = \\mathrm{bias}(\\hat\\theta)^2 + \\mathrm{Var}(\\hat\\theta)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\hat\\theta - \\theta = (\\hat\\theta - \\mathbb{E}\\hat\\theta) + (\\mathbb{E}\\hat\\theta - \\theta)"}</M>.
          Squaring and taking expectations, the cross term is{" "}
          <M>{"2(\\mathbb{E}\\hat\\theta - \\theta)\\,\\mathbb{E}[\\hat\\theta - \\mathbb{E}\\hat\\theta] = 0"}</M>, leaving the
          variance plus the squared bias.
        </p>
      </Proof>

      <Example title="shrinking a mean">
        <p>
          For the estimator <M>{"c\\bar X"}</M> of a normal mean, the bias is (c − 1)μ and the variance c²σ²/n, so
        </p>
        <MD>{"\\mathrm{MSE}(c) = (1 - c)^2\\mu^2 + c^2\\sigma^2/n,"}</MD>
        <p>
          minimised at <M>{"c^* = \\mu^2/(\\mu^2 + \\sigma^2/n) < 1"}</M>. Some shrinkage always helps, but c* depends on the
          unknown μ.
        </p>
        <Code>{SHRINK}</Code>
      </Example>

      <Example title="dividing by n − 1, n or n + 1">
        <p>
          For a normal sample with variance σ² = 1 the sum of squares SS has a chi-squared distribution with n − 1 degrees
          of freedom, with mean n − 1 and variance 2(n − 1). For the estimator SS/d,
        </p>
        <MD>{"\\mathrm{MSE} = \\frac{2(n - 1) + (n - 1 - d)^2}{d^2},"}</MD>
        <p>
          which is smallest at d = n + 1. With n = 5 this gives 0.5, 0.36 and 0.333 for d = 4, 5, 6, as the simulation
          confirms.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Theorem title="consistency from bias and variance">
        <p>
          If <M>{"\\mathrm{bias}(\\hat\\theta_n) \\to 0"}</M> and <M>{"\\mathrm{Var}(\\hat\\theta_n) \\to 0"}</M>, then{" "}
          <M>{"\\hat\\theta_n \\to \\theta"}</M> in probability.
        </p>
      </Theorem>
      <Proof>
        <p>
          The MSE tends to 0 by the decomposition. By Markov&apos;s inequality applied to{" "}
          <M>{"(\\hat\\theta_n - \\theta)^2"}</M>,{" "}
          <M>{"P(|\\hat\\theta_n - \\theta| \\geq \\varepsilon) \\leq \\mathrm{MSE}/\\varepsilon^2 \\to 0"}</M>.
        </p>
      </Proof>

      <Remark title="no estimator is best everywhere">
        <p>
          The silly estimator that always answers 7 has MSE 0 when θ = 7, so no estimator minimises the MSE at every θ at
          once. That is why one restricts the class, for example to unbiased estimators (the Cramér-Rao bound will say how
          small their variance can be), or averages the MSE over a prior, which gives back the Bayes estimators. In
          machine learning the same decomposition, applied to predictions, is the bias-variance tradeoff, and ridge
          regression is shrinkage in many dimensions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mse",
      rung: "check",
      prompt: <p>An estimator has bias 0.3 and variance 0.16. What is its mean squared error?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "div",
      rung: "check",
      prompt: <p>For a normal sample of size 5 with σ² = 1, what is the mean squared error of SS/5, where SS is the sum of squared deviations from the sample mean?</p>,
      answer: { kind: "numeric", value: 0.36, tolerance: 0.0001 },
    },
    {
      key: "seven",
      rung: "apply",
      prompt: <p>An estimator ignores the data and always returns 7. Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: ["Its variance is 0 and its MSE is (θ − 7)²", "It is unbiased", "Its MSE is 0 for every θ", "Its bias is 0 and its variance is (θ − 7)²"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def mse_shrink(c, mu, sigma, n):
    bias = (c - 1) * mu
    var = c * c * sigma * sigma / n
    return bias * bias, var, bias * bias + var

def best_c(mu, sigma, n):
    return mu * mu / (mu * mu + sigma * sigma / n)

print(mse_shrink(1, 2, 3, 9), mse_shrink(0.5, 2, 3, 9))
print(round(best_c(2, 3, 9), 4), round(best_c(0, 3, 9), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0, 1.0, 1.0) (1.0, 0.25, 1.25)\n0.8 0.0", "(0, 1.0, 1.0) (1.0, 0.5, 1.5)\n0.8 0.0", "(0, 1.0, 1.0) (1.0, 0.25, 1.25)\n0.3077 0.0", "(0, 9.0, 9.0) (1.0, 2.25, 3.25)\n0.8 0.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def bias_var(est, truth):
    est = np.asarray(est, dtype=float)
    return float(est.mean() - truth), float(est.var())

def var_mse(n, divisors, reps=200000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, n))
    ss = ((X - X.mean(axis=1, keepdims=True)) ** 2).sum(axis=1)
    return [float(((ss / d - 1) ** 2).mean()) for d in divisors]

print(bias_var([1, 2, 3, 6], 2))
print([round(m, 3) for m in var_mse(5, [4, 5, 6])])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(1.0, 3.5)\n[0.505, 0.363, 0.335]", "(1.0, 3.5)\n[0.335, 0.363, 0.505]", "(3.0, 3.5)\n[0.505, 0.363, 0.335]", "(1.0, 4.666666666666667)\n[0.505, 0.363, 0.335]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mse_shrink(c, mu, sigma, n)</C>, returning (squared bias, variance, MSE) of cX̄ for a normal sample, and{" "}
          <C>best_c(mu, sigma, n)</C>, returning the c that minimises the MSE.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def mse_shrink(c, mu, sigma, n):
    return 0.0, 0.0, 0.0

def best_c(mu, sigma, n):
    return 1.0
`,
        solution: SHRINK,
        tests: [
          { name: "split", code: `b2, v, m = mse_shrink(0.5, 2, 2, 4)
assert abs(b2 - 1) < 1e-12 and abs(v - 0.25) < 1e-12 and abs(m - 1.25) < 1e-12` },
          { name: "best", code: `c = best_c(1, 2, 4)
assert abs(c - 0.5) < 1e-12
assert mse_shrink(c, 1, 2, 4)[2] <= mse_shrink(c + 0.01, 1, 2, 4)[2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bias_var(est, truth)</C>, returning the empirical bias and variance (divisor n) of an array of estimates,
          and <C>var_mse(n, divisors, reps=200000, seed=0)</C>, which simulates reps standard normal samples of size n and
          returns, for each divisor d, the mean squared error of SS/d as an estimate of 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bias_var(est, truth):
    return 0.0, 0.0

def var_mse(n, divisors, reps=200000, seed=0):
    return [0.0 for d in divisors]
`,
        solution: SIM,
        tests: [
          { name: "bv", code: `b, v = bias_var([1, 3], 1)
assert b == 1 and v == 1` },
          { name: "mse", code: `m = var_mse(5, [4, 6], reps=50000)
assert abs(m[0] - 0.5) < 0.02 and abs(m[1] - 1 / 3) < 0.02` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the mean squared error of any estimator with finite variance equals its squared bias plus its variance.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Splits θ̂ − θ into (θ̂ − E θ̂) + (E θ̂ − θ).",
          "Shows the cross term has expectation 0, because E θ̂ − θ is a constant and E[θ̂ − E θ̂] = 0.",
          "Identifies the remaining terms as Var(θ̂) and bias², giving MSE = bias² + Var.",
        ],
      },
    },
    {
      key: "np1",
      rung: "stretch",
      prompt: <p>For a normal sample of size 10 with σ² = 1, what is the mean squared error of SS/11? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1818, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend how mean squared error splits into squared bias and variance, why shrinking an unbiased estimator can lower its error, why dividing by n + 1 beats n − 1 for normal variances, and why no estimator is best for every value of the parameter.",

  glimpse: (
    <>
      <p>
        How much of the data does an estimator really need? The next chapter shows that for many models a single number,
        such as the count of heads, carries all the information about the parameter, and then asks how small the variance
        of an unbiased estimator can possibly be.
      </p>
    </>
  ),
};
