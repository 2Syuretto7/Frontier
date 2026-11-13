import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BestPredictorViz } from "@/components/viz/BestPredictorViz";
import type { LessonContent } from "@/lib/types";

const PRED = `import numpy as np

def best_linear(x, y):
    b = np.mean((x - x.mean()) * (y - y.mean())) / np.var(x)
    return float(y.mean() - b * x.mean()), float(b)

def decompose(y, g, f):
    total = np.mean((y - f) ** 2)
    irreducible = np.mean((y - g) ** 2)
    gap = np.mean((g - f) ** 2)
    return float(total), float(irreducible), float(gap)`;

const EST = `import numpy as np

def estimator_mse(rng, est, n, reps, mu, sigma=1.0):
    samples = rng.normal(mu, sigma, size=(reps, n))
    e = np.array([est(s) for s in samples])
    bias = e.mean() - mu
    return float(bias), float(e.var()), float(np.mean((e - mu) ** 2))`;

export const lesson: LessonContent = {
  id: "m7.6.3",
  minutes: 60,
  links: {
    requires: ["m7.6.2", "m7.5.2"],
    revisits: ["m3.5.2", "l3.3.1", "m7.5.5"],
    foreshadows: ["m9.2.4", "m9.6.1"],
  },

  puzzle: (
    <>
      <p>
        Train a flexible enough model to minimise squared error and it learns something specific: not the most likely value
        of the target, not its median, but its conditional mean. Why that, and how much error is left even for a perfect
        model? And why can a straight line be useless even when X determines Y almost exactly?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mean squared error behaves like squared length, so prediction is projection: the best prediction from X is the point
        among all functions of X closest to Y, and the error left over is perpendicular to everything X can express.
        Restricting to straight lines projects onto a smaller space and can lose a lot.
      </p>
      <BestPredictorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the best constant">
        <p>
          For Y with finite variance, <M>{"E[(Y - c)^2] = \\operatorname{Var}(Y) + (E[Y] - c)^2"}</M>, so the minimum over
          constants is at <M>{"c = E[Y]"}</M>, with value <M>{"\\operatorname{Var}(Y)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"Y - c = (Y - E[Y]) + (E[Y] - c)"}</M> and expand: the cross term is{" "}
          <M>{"2(E[Y] - c)E[Y - E[Y]] = 0"}</M>.
        </p>
      </Proof>

      <Theorem title="the conditional mean is the best predictor">
        <p>
          Let <M>{"g(X) = E[Y \\mid X]"}</M>. For every function f with <M>{"E[f(X)^2] < \\infty"}</M>,
        </p>
        <MD>{"E[(Y - f(X))^2] = E[(Y - g(X))^2] + E[(g(X) - f(X))^2]."}</MD>
        <p>
          So g minimises the mean squared error over all functions of X, uniquely up to probability 0, and the minimum is{" "}
          <M>{"E[\\operatorname{Var}(Y \\mid X)]"}</M>, the unexplained part of Eve&apos;s law.
        </p>
      </Theorem>
      <Proof>
        <p>
          First, orthogonality: for any h(X) with finite second moment,{" "}
          <M>{"E[(Y - g(X))h(X)] = E\\big[E[(Y - g(X))h(X) \\mid X]\\big] = E\\big[h(X)(E[Y \\mid X] - g(X))\\big] = 0"}</M>, by
          Adam&apos;s law and taking out what is known. Now write <M>{"Y - f(X) = (Y - g(X)) + (g(X) - f(X))"}</M> and expand; the
          cross term is twice <M>{"E[(Y - g(X))h(X)]"}</M> with <M>{"h = g - f"}</M>, which is 0. Finally{" "}
          <M>{"E[(Y - g(X))^2] = E[E[(Y - g(X))^2 \\mid X]] = E[\\operatorname{Var}(Y \\mid X)]"}</M>.
        </p>
      </Proof>
      <Remark title="geometry">
        <p>
          With inner product <M>{"\\langle U, V \\rangle = E[UV]"}</M>, random variables with finite second moment form a
          space where mean squared error is squared distance. The functions of X form a subspace, and the theorem says{" "}
          <M>{"E[Y \\mid X]"}</M> is the orthogonal projection of Y onto it, with the Pythagorean theorem as the error split.
          This is the general definition of conditional expectation in disguise.
        </p>
      </Remark>

      <Theorem title="the best linear predictor">
        <p>
          Over predictors <M>{"a + bX"}</M> the mean squared error is minimised by{" "}
          <M>{"b = \\operatorname{Cov}(X, Y)/\\operatorname{Var}(X)"}</M>, <M>{"a = E[Y] - bE[X]"}</M>, the projection onto the
          span of 1 and X. Its error is <M>{"\\operatorname{Var}(Y)(1 - \\rho^2)"}</M>.
        </p>
      </Theorem>
      <p>
        It equals the conditional mean exactly when E[Y | X] is linear, as for jointly normal variables. Otherwise it can be
        far worse. If X ~ N(0, 1) and <M>{"Y = X^2 + \\varepsilon"}</M>, then{" "}
        <M>{"\\operatorname{Cov}(X, X^2) = E[X^3] = 0"}</M>: the best line is flat, its error is{" "}
        <M>{"\\operatorname{Var}(X^2) + \\operatorname{Var}(\\varepsilon) = 2.25"}</M> for noise variance 0.25, while E[Y | X]
        leaves only 0.25.
      </p>
      <Code>{PRED}</Code>

      <Example title="estimators: bias and variance">
        <p>
          An estimator <M>{"\\hat\\theta"}</M> of a fixed parameter θ is a prediction of a constant from random data, and the
          best-constant identity gives
        </p>
        <MD>{"E[(\\hat\\theta - \\theta)^2] = \\operatorname{Var}(\\hat\\theta) + \\big(E[\\hat\\theta] - \\theta\\big)^2 = \\text{variance} + \\text{bias}^2."}</MD>
        <p>
          For n = 10 normal observations with σ = 1 and μ = 0.5, the sample mean has bias 0 and variance 0.1. Shrinking it to{" "}
          <M>{"0.8\\bar X"}</M> adds bias −0.1 but cuts the variance to 0.064, for a smaller total 0.074. Unbiased is not the
          same as best.
        </p>
        <Code>{EST}</Code>
      </Example>

      <Remark title="other losses">
        <p>
          Squared error leads to the mean; absolute error leads to the conditional median; the 0–1 loss on a discrete Y leads
          to the conditional mode. A network trained with squared loss is estimating E[Y | X], so its predictions regress
          towards the middle whenever the target is uncertain.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>You must predict a fair die roll with one number. What is the smallest mean squared error you can achieve? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.9167, tolerance: 0.0001 },
    },
    {
      key: "double",
      rung: "check",
      prompt: <p>X and Z are independent N(0, 1) and Y = X + Z. What is the mean squared error of the predictor 2X for Y?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "flat",
      rung: "apply",
      prompt: <p>X ~ N(0, 1) and Y = X² + ε with ε independent noise of mean 0. What is the slope of the best linear predictor of Y from X?</p>,
      answer: { kind: "choice", options: ["0", "1", "2", "It depends on the noise variance"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def best_linear(x, y):
    b = np.mean((x - x.mean()) * (y - y.mean())) / np.var(x)
    return float(y.mean() - b * x.mean()), float(b)

def decompose(y, g, f):
    total = np.mean((y - f) ** 2)
    irreducible = np.mean((y - g) ** 2)
    gap = np.mean((g - f) ** 2)
    return float(total), float(irreducible), float(gap)

rng = np.random.default_rng(0)
x = rng.normal(size=200000)
y = x ** 2 + 0.5 * rng.normal(size=200000)
a, b = best_linear(x, y)
print(round(a, 1), round(b, 1) + 0.0)
print([round(v, 1) for v in decompose(y, x ** 2, a + b * x)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.0\n[2.3, 0.3, 2.0]",
          "1.0 1.0\n[2.3, 0.3, 2.0]",
          "0.0 0.0\n[2.3, 0.3, 2.0]",
          "1.0 0.0\n[2.0, 0.3, 2.3]",
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

def estimator_mse(rng, est, n, reps, mu, sigma=1.0):
    samples = rng.normal(mu, sigma, size=(reps, n))
    e = np.array([est(s) for s in samples])
    bias = e.mean() - mu
    return float(bias), float(e.var()), float(np.mean((e - mu) ** 2))

rng = np.random.default_rng(1)
for est in (np.mean, lambda s: 0.8 * s.mean()):
    print([round(v, 2) + 0.0 for v in estimator_mse(rng, est, 10, 20000, 0.5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.1, 0.1]\n[-0.1, 0.06, 0.07]",
          "[0.0, 0.1, 0.1]\n[-0.1, 0.06, 0.16]",
          "[0.0, 0.1, 0.1]\n[0.0, 0.08, 0.08]",
          "[0.0, 1.0, 1.0]\n[-0.1, 0.64, 0.65]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_linear(x, y)</C>, returning the intercept and slope (as floats) of the best linear predictor for the
          empirical distribution of the samples, and <C>decompose(y, g, f)</C>, returning the floats (mean of (y − f)², mean
          of (y − g)², mean of (g − f)²).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def best_linear(x, y):
    return 0.0, 0.0

def decompose(y, g, f):
    return 0.0, 0.0, 0.0
`,
        solution: PRED,
        tests: [
          { name: "line", code: `x = np.array([0.0, 1.0, 2.0, 3.0]); y = 2 * x + 1
a, b = best_linear(x, y)
assert isinstance(a, float) and abs(a - 1) < 1e-12 and abs(b - 2) < 1e-12
a, b = best_linear(np.array([-1.0, 0.0, 1.0]), np.array([1.0, 0.0, 1.0]))
assert abs(b) < 1e-12 and abs(a - 2 / 3) < 1e-12` },
          { name: "decompose", code: `y = np.array([1.0, 2.0, 4.0]); g = np.array([1.0, 3.0, 3.0]); f = np.zeros(3)
t, i, d = decompose(y, g, f)
assert abs(t - 7) < 1e-12 and abs(i - 2 / 3) < 1e-12 and abs(d - 19 / 3) < 1e-12 and isinstance(t, float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>estimator_mse(rng, est, n, reps, mu, sigma=1.0)</C>: draw reps samples of size n from N(mu, sigma²) as one
          (reps, n) array, apply est to each row, and return the floats (bias, variance, mean squared error) of the resulting
          estimates, with variance computed by np.var.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def estimator_mse(rng, est, n, reps, mu, sigma=1.0):
    return 0.0, 0.0, 0.0
`,
        solution: EST,
        tests: [
          { name: "identity", code: `b, v, m = estimator_mse(np.random.default_rng(0), np.median, 5, 3000, 2.0)
assert isinstance(m, float) and abs(m - (v + b * b)) < 1e-10
b, v, m = estimator_mse(np.random.default_rng(0), lambda s: 7.0, 4, 100, 2.0)
assert abs(b - 5) < 1e-12 and v == 0.0 and abs(m - 25) < 1e-12` },
          { name: "sample mean", code: `b, v, m = estimator_mse(np.random.default_rng(3), np.mean, 4, 40000, -1.0, sigma=2.0)
assert abs(b) < 0.03 and abs(v - 1.0) < 0.05 and abs(m - 1.0) < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let g(X) = E[Y | X]. Prove that <M>{"E[(Y - g(X))h(X)] = 0"}</M> for every h(X) with finite second moment, and deduce
          that <M>{"E[(Y - f(X))^2] \\ge E[(Y - g(X))^2]"}</M> for every such f.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Conditions on X and uses taking out what is known: E[(Y − g(X))h(X) | X] = h(X)(E[Y | X] − g(X)) = 0.",
          "Applies Adam's law to conclude E[(Y − g(X))h(X)] = 0.",
          "Expands (Y − f) = (Y − g) + (g − f), kills the cross term with h = g − f, and notes E[(g − f)²] ≥ 0.",
        ],
      },
    },
    {
      key: "shrink",
      rung: "stretch",
      prompt: (
        <p>
          With n = 10 observations from N(0.5, 1), the estimator <M>{"c\\bar X"}</M> has bias (c − 1)·0.5 and variance c²/10.
          Which c minimises its mean squared error? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7143, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the conditional mean is the best predictor in mean squared error, what error remains, why the best straight line can be useless when Y depends on X², and how the same algebra splits an estimator's error into bias squared plus variance.",

  glimpse: (
    <>
      <p>
        The shrunken estimator beat the sample mean only because μ was known to be small. Without such knowledge, the sample
        mean&apos;s variance σ²/n is what we rely on: the next chapter shows that sample averages converge to the true mean, and
        that their error, scaled by √n, becomes normal.
      </p>
    </>
  ),
};
