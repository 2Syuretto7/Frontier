import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LeverageViz } from "@/components/viz/LeverageViz";
import type { LessonContent } from "@/lib/types";

const OLS = `import numpy as np

def ols(X, y):
    return np.linalg.solve(X.T @ X, X.T @ y)

def hat_matrix(X):
    return X @ np.linalg.solve(X.T @ X, X.T)`;

const GM = `import numpy as np

def gauss_markov(reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    x = np.linspace(0, 1, 11)
    y = 1 + 2 * x + rng.normal(size=(reps, 11))
    xc = x - x.mean()
    ols_slope = y @ xc / (xc @ xc)
    end_slope = y[:, -1] - y[:, 0]
    out = (ols_slope.mean(), end_slope.mean(), ols_slope.var(), end_slope.var())
    return [round(float(v), 2) for v in out]

def solver_errors(eps, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.uniform(size=50)
    X = np.column_stack([np.ones(50), x, x + eps * rng.normal(size=50)])
    beta = np.array([1.0, 2.0, 3.0])
    y = X @ beta
    b_ne = np.linalg.solve(X.T @ X, X.T @ y)
    b_ls = np.linalg.lstsq(X, y, rcond=None)[0]
    return float(np.abs(b_ne - beta).max()), float(np.abs(b_ls - beta).max())`;

export const lesson: LessonContent = {
  id: "m9.6.2",
  minutes: 60,
  links: {
    requires: ["m9.6.1", "m6.6.1"],
    revisits: ["m5.4.2", "m6.5.4"],
    foreshadows: ["m9.6.3", "m9.6.4"],
  },

  puzzle: (
    <>
      <p>
        With p predictors, least squares asks for the vector β minimising ‖y − Xβ‖². Calculus gives an answer, but a
        picture gives more: Xβ ranges over a subspace, and the closest point of a subspace to y is found by dropping a
        perpendicular. Which facts about regression become obvious from that picture, and why is one unusual data point
        sometimes able to swing the whole fit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The fitted values are the orthogonal projection of y onto the column space of X. The residual is perpendicular to
        every column. The projection matrix, the hat matrix, also says how much each observation influences its own
        fitted value: its leverage.
      </p>
      <LeverageViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="normal equations and the hat matrix">
        <p>
          Let X be n × p with full column rank. The minimiser of <M>{"\\|y - X\\beta\\|^2"}</M> is{" "}
          <M>{"\\hat\\beta = (X^\\top X)^{-1}X^\\top y"}</M>. The fitted values are <M>{"\\hat y = Hy"}</M> with
        </p>
        <MD>{"H = X(X^\\top X)^{-1}X^\\top,"}</MD>
        <p>
          which is symmetric and idempotent: the orthogonal projection onto col(X). The residual{" "}
          <M>{"e = (I - H)y"}</M> satisfies <M>{"X^\\top e = 0"}</M>, and trace H = p.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient of <M>{"\\|y - X\\beta\\|^2"}</M> is <M>{"-2X^\\top(y - X\\beta)"}</M>; setting it to zero gives the
          normal equations <M>{"X^\\top X\\beta = X^\\top y"}</M>, solvable since <M>{"X^\\top X"}</M> is invertible, and the
          objective is convex. Symmetry of H is clear, and{" "}
          <M>{"H^2 = X(X^\\top X)^{-1}X^\\top X(X^\\top X)^{-1}X^\\top = H"}</M>. The normal equations say exactly{" "}
          <M>{"X^\\top e = 0"}</M>. Finally{" "}
          <M>{"\\mathrm{tr}\\,H = \\mathrm{tr}\\big((X^\\top X)^{-1}X^\\top X\\big) = \\mathrm{tr}\\, I_p = p"}</M>.
        </p>
        <Code>{OLS}</Code>
      </Proof>

      <Example title="consequences of the picture">
        <p>
          If X contains a column of ones, orthogonality to it means the residuals sum to zero, and Pythagoras gives{" "}
          <M>{"\\|y - \\bar y\\mathbf 1\\|^2 = \\|\\hat y - \\bar y\\mathbf 1\\|^2 + \\|e\\|^2"}</M>: total = explained + residual
          sum of squares. The leverage <M>{"h_{ii} = H_{ii}"}</M> lies in [0, 1] and averages p/n; for simple regression it is{" "}
          <M>{"1/n + (x_i - \\bar x)^2/S_{xx}"}</M>. Since <M>{"\\hat y_i = \\sum_j h_{ij}y_j"}</M>, a leverage near 1 means the
          fit at that point is essentially that point&apos;s own y.
        </p>
      </Example>

      <Theorem title="Gauss-Markov">
        <p>
          If <M>{"\\mathbb{E}[y] = X\\beta"}</M> and <M>{"\\mathrm{Cov}(y) = \\sigma^2 I"}</M>, then among all linear unbiased
          estimators Cy of β, least squares has the smallest covariance: <M>{"\\mathrm{Cov}(Cy) - \\mathrm{Cov}(\\hat\\beta)"}</M>{" "}
          is positive semidefinite. No normality is needed.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unbiasedness for every β means CX = I. Write <M>{"C = (X^\\top X)^{-1}X^\\top + D"}</M>; then DX = 0. Now{" "}
          <M>{"\\mathrm{Cov}(Cy) = \\sigma^2 CC^\\top = \\sigma^2\\big((X^\\top X)^{-1} + DD^\\top\\big)"}</M>, because the cross
          terms contain <M>{"DX = 0"}</M>. The first term is <M>{"\\mathrm{Cov}(\\hat\\beta)"}</M> and{" "}
          <M>{"DD^\\top"}</M> is positive semidefinite.
        </p>
      </Proof>

      <Example title="a competitor, and a numerical warning">
        <p>
          The slope through the two endpoints is also linear and unbiased, but with 11 equally spaced points its variance is
          2.0 against 0.91 for least squares. Second, solving the normal equations squares the condition number of X: with
          two nearly collinear columns, it loses most digits, while a QR- or SVD-based solver such as lstsq does not.
        </p>
        <Code>{GM}</Code>
      </Example>

      <Remark title="in machine learning">
        <p>
          A linear layer trained with squared loss and no regularisation converges to this projection. When p is close to
          n or columns are nearly collinear, <M>{"(X^\\top X)^{-1}"}</M> amplifies noise; the cure, adding a multiple of the
          identity, is ridge regression, the subject of the last lesson of this chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "trace",
      rung: "check",
      prompt: <p>A design matrix has 100 rows and 5 linearly independent columns. What is the trace of its hat matrix?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "lev",
      rung: "check",
      prompt: <p>In simple regression with intercept on x = 1, 2, 3, 4, what is the leverage of the point at x = 4?</p>,
      answer: { kind: "numeric", value: 0.7, tolerance: 0.0001 },
    },
    {
      key: "orth",
      rung: "apply",
      prompt: <p>What is true of the least squares residual vector e?</p>,
      answer: { kind: "choice", options: ["It is orthogonal to every column of X", "It is parallel to the fitted values", "Its entries are all equal", "It has the smallest entry of any residual vector"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ols(X, y):
    return np.linalg.solve(X.T @ X, X.T @ y)

def hat_matrix(X):
    return X @ np.linalg.solve(X.T @ X, X.T)

X = np.column_stack([np.ones(4), [1.0, 2, 3, 4]])
y = np.array([2.0, 3, 5, 6])
H = hat_matrix(X)
print([round(float(v), 4) for v in ols(X, y)], round(float(np.trace(H)), 4))
print([round(float(v), 2) for v in np.diag(H)], np.allclose(X.T @ (y - H @ y), 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 1.4] 2.0\n[0.7, 0.3, 0.3, 0.7] True", "[0.5, 1.4] 4.0\n[0.7, 0.3, 0.3, 0.7] True", "[1.4, 0.5] 2.0\n[0.25, 0.25, 0.25, 0.25] True", "[0.5, 1.4] 2.0\n[0.7, 0.3, 0.3, 0.7] False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gauss_markov(reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    x = np.linspace(0, 1, 11)
    y = 1 + 2 * x + rng.normal(size=(reps, 11))
    xc = x - x.mean()
    ols_slope = y @ xc / (xc @ xc)
    end_slope = y[:, -1] - y[:, 0]
    out = (ols_slope.mean(), end_slope.mean(), ols_slope.var(), end_slope.var())
    return [round(float(v), 2) for v in out]

def solver_errors(eps, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.uniform(size=50)
    X = np.column_stack([np.ones(50), x, x + eps * rng.normal(size=50)])
    beta = np.array([1.0, 2.0, 3.0])
    y = X @ beta
    b_ne = np.linalg.solve(X.T @ X, X.T @ y)
    b_ls = np.linalg.lstsq(X, y, rcond=None)[0]
    return float(np.abs(b_ne - beta).max()), float(np.abs(b_ls - beta).max())

print(gauss_markov())
ne, ls = solver_errors(1e-7)
print(ne > 1e-3, ls < 1e-3)`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2.0, 2.0, 0.91, 2.01]\nTrue True", "[2.0, 2.0, 2.01, 0.91]\nTrue True", "[2.0, 1.0, 0.91, 2.01]\nTrue True", "[2.0, 2.0, 0.91, 2.01]\nFalse True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ols(X, y)</C>, solving the normal equations with np.linalg.solve, and <C>hat_matrix(X)</C>, returning
          X(XᵀX)⁻¹Xᵀ without forming an explicit inverse.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ols(X, y):
    return np.zeros(X.shape[1])

def hat_matrix(X):
    return np.eye(X.shape[0])
`,
        solution: OLS,
        tests: [
          { name: "ols", code: `import numpy as np
X = np.column_stack([np.ones(3), [0.0, 1, 2]])
assert np.allclose(ols(X, np.array([1.0, 3, 5])), [1, 2])` },
          { name: "hat", code: `import numpy as np
X = np.random.default_rng(0).normal(size=(8, 3))
H = hat_matrix(X)
assert np.allclose(H, H.T) and np.allclose(H @ H, H) and abs(np.trace(H) - 3) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gauss_markov(reps=20000, seed=0)</C>, comparing the least squares slope with the endpoint slope
          y₁₀ − y₀ for x = linspace(0, 1, 11), y = 1 + 2x + N(0, 1) noise, returning their means and variances rounded to 2
          places, and <C>solver_errors(eps, seed=0)</C>, returning the largest coefficient errors of the normal equations and
          of lstsq for a noiseless design whose third column is the second plus eps times noise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gauss_markov(reps=20000, seed=0):
    return [0.0, 0.0, 0.0, 0.0]

def solver_errors(eps, seed=0):
    return 0.0, 0.0
`,
        solution: GM,
        tests: [
          { name: "gm", code: `a, b, va, vb = gauss_markov(reps=20000)
assert abs(a - 2) < 0.05 and abs(b - 2) < 0.05 and abs(va - 1 / 1.1) < 0.05 and abs(vb - 2) < 0.08` },
          { name: "solvers", code: `ne, ls = solver_errors(1e-2)
assert ne < 1e-6 and ls < 1e-6
ne, ls = solver_errors(1e-7)
assert ls < 1e-5 and ne > 100 * ls` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the Gauss-Markov theorem: if E[y] = Xβ and Cov(y) = σ²I, then any linear unbiased estimator Cy of β has Cov(Cy) − σ²(XᵀX)⁻¹ positive semidefinite.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses unbiasedness for every β to derive CX = I, and writes C = (XᵀX)⁻¹Xᵀ + D with DX = 0.",
          "Computes Cov(Cy) = σ²CCᵀ and shows the cross terms vanish because DX = 0 (equivalently XᵀDᵀ = 0).",
          "Concludes Cov(Cy) = σ²(XᵀX)⁻¹ + σ²DDᵀ, and DDᵀ is positive semidefinite.",
        ],
      },
    },
    {
      key: "avg",
      rung: "stretch",
      prompt: <p>A regression has n = 50 observations and p = 5 columns. What is the average leverage?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why least squares is an orthogonal projection, what the hat matrix and leverage are, how the Gauss-Markov theorem shows least squares is best among linear unbiased estimators, and why one should not solve the normal equations directly for ill-conditioned designs.",

  glimpse: (
    <>
      <p>
        Projection gave point estimates. Adding normal errors, the next lesson derives the exact distributions of β̂ and of
        the residual variance, which give t-tests and confidence intervals for each coefficient.
      </p>
    </>
  ),
};
