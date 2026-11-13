import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RidgeSvdViz } from "@/components/viz/RidgeSvdViz";
import type { LessonContent } from "@/lib/types";

const RIDGE = `import numpy as np

def ridge(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

def ridge_svd(X, y, lam):
    U, d, Vt = np.linalg.svd(X, full_matrices=False)
    return Vt.T @ (d / (d * d + lam) * (U.T @ y))

def eff_df(X, lam):
    d = np.linalg.svd(X, compute_uv=False)
    return float(np.sum(d * d / (d * d + lam)))`;

const SIM = `import numpy as np

def shrink_factors(d, lam):
    return d * d / (d * d + lam)

def coef_mse(lams, n=30, reps=2000, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.normal(size=n)
    X = np.column_stack([z, z + 0.05 * rng.normal(size=n), rng.normal(size=n)])
    beta = np.ones(3)
    out = []
    for lam in lams:
        A = np.linalg.solve(X.T @ X + lam * np.eye(3), X.T)
        B = (X @ beta + rng.normal(size=(reps, n))) @ A.T
        out.append(round(float(((B - beta) ** 2).sum(axis=1).mean()), 3))
    return out`;

export const lesson: LessonContent = {
  id: "m9.6.4",
  minutes: 60,
  links: {
    requires: ["m9.6.3", "m9.2.4"],
    revisits: ["m6.5.4", "m5.5.3"],
    foreshadows: ["m9.7.3", "m9.7.4"],
  },

  puzzle: (
    <>
      <p>
        Two features are nearly copies of each other. Least squares, unbiased and best among linear unbiased estimators,
        returns coefficients like +40 and −38 that swing wildly between data sets. Adding a tiny penalty on the size of the
        coefficients makes them sensible again and closer to the truth on average. How can a deliberately biased estimator
        beat the &quot;best&quot; one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gauss-Markov only compared unbiased estimators. Least squares spends its whole variance budget on directions the
        data barely determine, those with tiny singular values. Ridge regression shrinks exactly those directions hardest,
        trading a small bias for a large cut in variance.
      </p>
      <RidgeSvdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ridge regression">
        <p>For λ &gt; 0 the ridge estimator minimises a penalised sum of squares:</p>
        <MD>{"\\hat\\beta_\\lambda = \\arg\\min_\\beta \\|y - X\\beta\\|^2 + \\lambda\\|\\beta\\|^2 = (X^\\top X + \\lambda I)^{-1}X^\\top y."}</MD>
        <p>The matrix is invertible for every λ &gt; 0, even when X is rank deficient or p &gt; n.</p>
      </Definition>

      <Theorem title="ridge in the singular value basis">
        <p>
          With the thin SVD <M>{"X = UDV^\\top"}</M>, singular values d_j and columns u_j, v_j,
        </p>
        <MD>{"\\hat\\beta_\\lambda = \\sum_j \\frac{d_j}{d_j^2 + \\lambda}(u_j^\\top y)\\, v_j, \\qquad X\\hat\\beta_\\lambda = \\sum_j \\frac{d_j^2}{d_j^2 + \\lambda}(u_j^\\top y)\\, u_j."}</MD>
        <p>
          Least squares (λ = 0) has factors 1/d_j; ridge multiplies the fit along u_j by{" "}
          <M>{"d_j^2/(d_j^2 + \\lambda)"}</M>, close to 1 for large d_j and close to 0 for small ones. The effective degrees
          of freedom are <M>{"\\sum_j d_j^2/(d_j^2 + \\lambda)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"X^\\top X + \\lambda I = V(D^2 + \\lambda I)V^\\top"}</M> (completing V to an orthogonal basis if p exceeds the
          rank, where D is 0) and <M>{"X^\\top y = VDU^\\top y"}</M>, so{" "}
          <M>{"\\hat\\beta_\\lambda = V(D^2 + \\lambda I)^{-1}DU^\\top y"}</M>, which is the stated sum. Multiplying by{" "}
          <M>{"X = UDV^\\top"}</M> gives the fitted values.
        </p>
        <Code>{RIDGE}</Code>
      </Proof>

      <Theorem title="some ridge beats least squares">
        <p>
          If X has full column rank and errors have variance σ² &gt; 0, the mean squared error{" "}
          <M>{"\\mathbb{E}\\|\\hat\\beta_\\lambda - \\beta\\|^2"}</M> is strictly smaller than that of least squares for all
          small enough λ &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\theta = V^\\top\\beta"}</M>. In the SVD coordinates the estimator of θ_j is{" "}
          <M>{"\\frac{d_j^2}{d_j^2 + \\lambda}\\cdot"}</M>(the least squares estimate of θ_j), which has variance{" "}
          <M>{"\\sigma^2/d_j^2"}</M>. So
        </p>
        <MD>{"\\mathrm{MSE}(\\lambda) = \\sum_j \\frac{\\sigma^2 d_j^2 + \\lambda^2\\theta_j^2}{(d_j^2 + \\lambda)^2}."}</MD>
        <p>
          Differentiating, the derivative of the j-th term at λ = 0 is <M>{"-2\\sigma^2/d_j^4"}</M> (the bias term has zero
          derivative there because of the λ²). The sum is strictly negative, so MSE decreases as λ moves up from 0.
        </p>
      </Proof>

      <Example title="collinearity in simulation">
        <p>
          With two nearly identical features, least squares has total coefficient MSE about 34; λ = 1 brings it to 0.08,
          and λ = 10 starts to overshrink. In practice λ is chosen by cross-validation, after standardising the features so
          that the penalty treats them alike.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="shrinkage everywhere">
        <p>
          Ridge is the MAP estimate under a normal prior <M>{"\\beta \\sim N(0, (\\sigma^2/\\lambda) I)"}</M>, which the next
          chapter makes precise, and weight decay in neural networks is the same penalty. Replacing ‖β‖² by ‖β‖₁ gives the
          lasso, which shrinks some coefficients exactly to zero. In a famous surprise, James and Stein showed that for three
          or more normal means, shrinking all the sample means towards a common point beats using them unchanged, for every
          value of the true means.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "factor",
      rung: "check",
      prompt: <p>A direction has singular value d = 2. By what factor does ridge with λ = 4 shrink the fit along it?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "df",
      rung: "check",
      prompt: <p>A design has singular values 3 and 1. What are the effective degrees of freedom of ridge with λ = 1?</p>,
      answer: { kind: "numeric", value: 1.4, tolerance: 0.0001 },
    },
    {
      key: "prior",
      rung: "apply",
      prompt: <p>Ridge regression is the maximum a posteriori estimate under which prior on β?</p>,
      answer: { kind: "choice", options: ["A normal prior centred at 0", "A uniform prior on all of ℝᵖ", "A Laplace prior centred at 0", "A point mass at the least squares estimate"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ridge(X, y, lam):
    p = X.shape[1]
    return np.linalg.solve(X.T @ X + lam * np.eye(p), X.T @ y)

def ridge_svd(X, y, lam):
    U, d, Vt = np.linalg.svd(X, full_matrices=False)
    return Vt.T @ (d / (d * d + lam) * (U.T @ y))

def eff_df(X, lam):
    d = np.linalg.svd(X, compute_uv=False)
    return float(np.sum(d * d / (d * d + lam)))

X = np.array([[1.0, 0], [0, 2], [0, 0]])
y = np.array([1.0, 2, 3])
print([round(float(v), 4) for v in ridge(X, y, 1.0)], np.allclose(ridge(X, y, 1.0), ridge_svd(X, y, 1.0)))
print([round(float(v), 4) for v in ridge(X, y, 0.0)], round(eff_df(X, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 0.8] True\n[1.0, 1.0] 1.3", "[0.5, 0.5] True\n[1.0, 1.0] 1.3", "[0.5, 0.8] True\n[1.0, 2.0] 1.3", "[0.5, 0.8] False\n[1.0, 1.0] 2.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def shrink_factors(d, lam):
    return d * d / (d * d + lam)

def coef_mse(lams, n=30, reps=2000, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.normal(size=n)
    X = np.column_stack([z, z + 0.05 * rng.normal(size=n), rng.normal(size=n)])
    beta = np.ones(3)
    out = []
    for lam in lams:
        A = np.linalg.solve(X.T @ X + lam * np.eye(3), X.T)
        B = (X @ beta + rng.normal(size=(reps, n))) @ A.T
        out.append(round(float(((B - beta) ** 2).sum(axis=1).mean()), 3))
    return out

print([round(float(v), 3) for v in shrink_factors(np.array([5.0, 0.1]), 0.01)])
print(coef_mse([0.0, 0.1, 1.0, 10.0]))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, 0.5]\n[33.678, 1.81, 0.083, 0.147]", "[0.5, 1.0]\n[33.678, 1.81, 0.083, 0.147]", "[1.0, 0.5]\n[0.147, 0.083, 1.81, 33.678]", "[1.0, 0.01]\n[33.678, 1.81, 0.083, 0.147]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridge(X, y, lam)</C> by solving (XᵀX + λI)β = Xᵀy, <C>ridge_svd(X, y, lam)</C> by the singular value
          formula, and <C>eff_df(X, lam)</C>, the effective degrees of freedom.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ridge(X, y, lam):
    return np.zeros(X.shape[1])

def ridge_svd(X, y, lam):
    return np.zeros(X.shape[1])

def eff_df(X, lam):
    return 0.0
`,
        solution: RIDGE,
        tests: [
          { name: "agree", code: `import numpy as np
rng = np.random.default_rng(1)
X, y = rng.normal(size=(10, 4)), rng.normal(size=10)
assert np.allclose(ridge(X, y, 0.7), ridge_svd(X, y, 0.7))
assert np.allclose(ridge(X, y, 1e-12), np.linalg.lstsq(X, y, rcond=None)[0], atol=1e-6)` },
          { name: "df", code: `import numpy as np
X = np.diag([3.0, 1.0])
assert abs(eff_df(X, 1.0) - 1.4) < 1e-12 and abs(eff_df(X, 0.0) - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shrink_factors(d, lam)</C>, returning d²/(d² + λ) elementwise, and{" "}
          <C>coef_mse(lams, n=30, reps=2000, seed=0)</C>, which builds a design whose second column is the first plus 0.05
          times noise and whose third is independent, takes β = (1, 1, 1), and returns for each λ the simulated
          E‖β̂_λ − β‖² rounded to 3 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shrink_factors(d, lam):
    return d

def coef_mse(lams, n=30, reps=2000, seed=0):
    return [0.0 for lam in lams]
`,
        solution: SIM,
        tests: [
          { name: "factors", code: `import numpy as np
assert np.allclose(shrink_factors(np.array([1.0, 2.0]), 4.0), [0.2, 0.5])` },
          { name: "mse", code: `m = coef_mse([0.0, 1.0], reps=1000)
assert m[0] > 10 and m[1] < 1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Using MSE(λ) = Σⱼ (σ²dⱼ² + λ²θⱼ²)/(dⱼ² + λ)², prove that for full-rank X and σ² &gt; 0 some λ &gt; 0 has smaller MSE than least squares (λ = 0).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates a term: the variance part σ²dⱼ²/(dⱼ² + λ)² has derivative −2σ²dⱼ²/(dⱼ² + λ)³, equal to −2σ²/dⱼ⁴ at λ = 0.",
          "Shows the bias part λ²θⱼ²/(dⱼ² + λ)² has derivative 0 at λ = 0.",
          "Concludes MSE′(0) < 0, so MSE(λ) < MSE(0) for all small λ > 0 (by the definition of the derivative or continuity).",
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: <p>In one dimension with d² = 4, θ = 1 and σ² = 1, MSE(λ) = (4 + λ²)/(4 + λ)². What is the smallest achievable MSE? (Least squares gives 0.25.)</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what ridge regression does, how the singular value decomposition shows which directions it shrinks, why some amount of ridge always beats least squares in mean squared error, and how it relates to weight decay and a normal prior.",

  glimpse: (
    <>
      <p>
        Ridge looked like a trick to fix collinearity, but it is a Bayesian estimate in disguise. The next chapter makes
        priors and posteriors the main tool, starting with the full posterior distribution rather than a single estimate.
      </p>
    </>
  ),
};
