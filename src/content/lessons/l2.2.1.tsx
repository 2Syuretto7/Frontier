import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollinearViz } from "@/components/viz/CollinearViz";
import type { LessonContent } from "@/lib/types";

const SOLVE = `import numpy as np

def design(x, degree):
    return np.vander(x, degree + 1, increasing=True)

def fit_normal(X, y):
    return np.linalg.solve(X.T @ X, X.T @ y)

def fit_qr(X, y):
    Q, R = np.linalg.qr(X)
    return np.linalg.solve(R, Q.T @ y)`;

const MINNORM = `import numpy as np

def min_norm(X, y):
    return np.linalg.pinv(X) @ y

def gd_fit(X, y, lr, steps):
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w -= lr * X.T @ (X @ w - y) / len(y)
    return w`;

export const lesson: LessonContent = {
  id: "l2.2.1",
  minutes: 55,
  links: {
    requires: ["l2.1.2", "m9.6.2"],
    revisits: ["l1.2.3", "l1.2.4"],
    foreshadows: ["l2.2.2", "l2.2.5"],
  },

  puzzle: (
    <>
      <p>
        Fit a degree-9 polynomial to 30 points by solving the normal equations and the coefficients come back wrong in the
        fourth decimal place, even though the data were generated exactly by such a polynomial. Fit a model with more
        features than rows and there are infinitely many perfect fits, yet gradient descent from zero always lands on the
        same one. What is going on in each case?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Least squares has a clean answer, the normal equations, but how you solve them matters. Forming XᵀX squares the
        condition number, so nearly collinear features turn small rounding errors into large coefficient errors; a QR
        factorisation works with X directly. When the problem has many solutions, the one gradient descent finds is the
        one with the smallest norm, because every step it takes lies in the row space of X.
      </p>
      <CollinearViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the normal equations">
        <p>
          The residual sum of squares <M>{"\\mathrm{RSS}(w) = \\|y - Xw\\|^2"}</M> is minimised exactly by the solutions of{" "}
          <M>{"X^\\top X w = X^\\top y"}</M>. There is a unique minimiser if and only if X has full column rank.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is <M>{"-2X^\\top(y - Xw)"}</M>, so stationary points solve the normal equations. If w solves them,
          then for any d,
        </p>
        <MD>{"\\mathrm{RSS}(w + d) = \\mathrm{RSS}(w) - 2d^\\top X^\\top(y - Xw) + \\|Xd\\|^2 = \\mathrm{RSS}(w) + \\|Xd\\|^2,"}</MD>
        <p>
          so w is a minimiser, and w + d is another exactly when Xd = 0. That leaves only w when the null space of X is{" "}
          {"{0}"}, which is full column rank.
        </p>
      </Proof>

      <Theorem title="forming XᵀX squares the condition number">
        <p>
          If X has full column rank with singular values <M>{"s_1 \\geq \\dots \\geq s_p > 0"}</M>, then{" "}
          <M>{"\\kappa(X^\\top X) = \\kappa(X)^2"}</M>, where <M>{"\\kappa = s_1/s_p"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With the SVD <M>{"X = U S V^\\top"}</M>, <M>{"X^\\top X = V S^2 V^\\top"}</M>, whose eigenvalues, which are its
          singular values, are <M>{"s_i^2"}</M>. Their ratio is <M>{"(s_1/s_p)^2"}</M>.
        </p>
        <Code>{SOLVE}</Code>
      </Proof>
      <Remark title="what to use in practice">
        <p>
          A linear solve loses about <M>{"\\log_{10}\\kappa"}</M> digits of the roughly 16 that double precision carries. For
          the degree-9 polynomial on [0, 1], κ(X) ≈ 10⁷ but κ(XᵀX) ≈ 10¹³, so the normal equations keep about three digits
          while QR, with <M>{"X = QR"}</M> and <M>{"Rw = Q^\\top y"}</M>, keeps about nine. Library routines such as{" "}
          <C>np.linalg.lstsq</C> use orthogonal factorisations for this reason. Standardising features and using orthogonal
          bases also lowers κ. The viz shows the statistical side of the same problem: correlated features make the valley
          long, and the noise moves the fit far along it.
        </p>
      </Remark>

      <Theorem title="the minimum-norm solution, and where gradient descent goes">
        <p>
          Let <M>{"X^+"}</M> be the pseudoinverse. Among all minimisers of RSS, <M>{"w^+ = X^+y"}</M> has the smallest
          norm, and it is the only minimiser in the row space of X. Gradient descent from w = 0 with a small enough step
          converges to <M>{"w^+"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"w^+ = V S^+ U^\\top y"}</M> lies in the span of the right singular vectors with nonzero singular value, which
          is the row space. Every minimiser is <M>{"w^+ + d"}</M> with Xd = 0, so d is orthogonal to the row space and{" "}
          <M>{"\\|w^+ + d\\|^2 = \\|w^+\\|^2 + \\|d\\|^2"}</M>, smallest at d = 0; this also shows <M>{"w^+"}</M> is the only
          minimiser in the row space. Each gradient step adds a multiple of <M>{"X^\\top(Xw - y)"}</M>, which lies in the row
          space, so starting from 0 the iterates never leave it. Gradient descent on the convex RSS with a small enough step
          converges to a minimiser, and the only one available in the row space is <M>{"w^+"}</M>.
        </p>
        <Code>{MINNORM}</Code>
      </Proof>
      <Example title="implicit regularisation">
        <p>
          Nothing in the loss asks for a small norm; the algorithm and its starting point supply it. This is the simplest
          case of a theme in deep learning, where heavily overparametrised networks fit their training data in many ways and
          the optimiser picks among them.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "kappa",
      rung: "check",
      prompt: <p>If κ(X) = 1000, what is log₁₀ κ(XᵀX)?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "null",
      rung: "check",
      prompt: <p>A design matrix has 3 rows, 5 columns and rank 3. What is the dimension of the set of directions d that can be added to a least-squares solution without changing the fit?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
    {
      key: "gd",
      rung: "apply",
      prompt: <p>Gradient descent from w = 0 on an underdetermined least-squares problem converges to which solution?</p>,
      answer: {
        kind: "choice",
        options: [
          "The solution with the smallest Euclidean norm",
          "A random solution depending on the step size",
          "The sparsest solution",
          "It does not converge because the minimiser is not unique",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def design(x, degree):
    return np.vander(x, degree + 1, increasing=True)

def fit_normal(X, y):
    return np.linalg.solve(X.T @ X, X.T @ y)

def fit_qr(X, y):
    Q, R = np.linalg.qr(X)
    return np.linalg.solve(R, Q.T @ y)

x = np.linspace(0, 1, 30); X = design(x, 3); y = 1 + 2 * x - x ** 3
print(np.round(fit_normal(X, y), 4) + 0.0, np.round(fit_qr(X, y), 4) + 0.0)
X9 = design(x, 9); c = np.arange(10.0); y9 = X9 @ c
print(round(np.log10(np.linalg.cond(X9))), round(np.log10(np.linalg.cond(X9.T @ X9))))
print(np.abs(fit_normal(X9, y9) - c).max() > 1e-6, np.abs(fit_qr(X9, y9) - c).max() < 1e-6)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1.  2.  0. -1.] [ 1.  2.  0. -1.]\n7 13\nTrue True", "[ 1.  2.  0. -1.] [ 1.  2.  0. -1.]\n7 7\nTrue True", "[ 1.  2.  0. -1.] [ 1.  2.  0. -1.]\n7 13\nFalse True", "[ 1.  2.  0. -1.] [ 1.  2.  0. -1.]\n7 13\nTrue False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def min_norm(X, y):
    return np.linalg.pinv(X) @ y

def gd_fit(X, y, lr, steps):
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w -= lr * X.T @ (X @ w - y) / len(y)
    return w

rng = np.random.default_rng(0); A = rng.normal(size=(3, 5)); b = rng.normal(size=3)
w1, w2 = min_norm(A, b), gd_fit(A, b, 0.1, 5000)
print(np.allclose(A @ w1, b), np.allclose(w1, w2, atol=1e-6))
v = np.linalg.svd(A)[2][-1]
print(np.allclose(A @ (w1 + v), b), np.linalg.norm(w1 + v) > np.linalg.norm(w1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True\nTrue True", "True False\nTrue True", "True True\nTrue False", "True True\nFalse True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>design(x, degree)</C>, the matrix with columns 1, x, …, x^degree, <C>fit_normal(X, y)</C>, solving the
          normal equations, and <C>fit_qr(X, y)</C>, solving via a reduced QR factorisation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def design(x, degree):
    return np.ones((len(x), degree + 1))

def fit_normal(X, y):
    return np.zeros(X.shape[1])

def fit_qr(X, y):
    return np.zeros(X.shape[1])
`,
        solution: SOLVE,
        tests: [
          { name: "design", code: `assert np.allclose(design(np.array([2.0, 3.0]), 2), [[1, 2, 4], [1, 3, 9]])` },
          { name: "fit", code: `x = np.linspace(-1, 1, 12); X = design(x, 2); y = 3 - x + 0.5 * x ** 2
assert np.allclose(fit_normal(X, y), [3, -1, 0.5]) and np.allclose(fit_qr(X, y), [3, -1, 0.5])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>min_norm(X, y)</C>, the minimum-norm least-squares solution, and <C>gd_fit(X, y, lr, steps)</C>, gradient
          descent from zero on RSS/(2n), whose gradient is Xᵀ(Xw − y)/n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def min_norm(X, y):
    return np.zeros(X.shape[1])

def gd_fit(X, y, lr, steps):
    return np.zeros(X.shape[1])
`,
        solution: MINNORM,
        tests: [
          { name: "minnorm", code: `X = np.array([[1.0, 1.0]]); y = np.array([2.0])
assert np.allclose(min_norm(X, y), [1, 1]) and np.allclose(gd_fit(X, y, 0.1, 2000), [1, 1])` },
          { name: "full", code: `X = np.array([[1.0, 0.0], [0.0, 2.0], [1.0, 1.0]]); y = np.array([1.0, 2.0, 3.0])
assert np.allclose(gd_fit(X, y, 0.3, 5000), np.linalg.lstsq(X, y, rcond=None)[0], atol=1e-8)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that any w satisfying XᵀXw = Xᵀy minimises ‖y − Xw‖², and that w + d is also a minimiser if and only if Xd = 0.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Expands RSS(w + d) = RSS(w) − 2dᵀXᵀ(y − Xw) + ‖Xd‖².",
          "Uses the normal equations to make the cross term vanish, so RSS(w + d) = RSS(w) + ‖Xd‖² ≥ RSS(w).",
          "Concludes equality holds exactly when ‖Xd‖ = 0, that is Xd = 0.",
        ],
      },
    },
    {
      key: "rho",
      rung: "stretch",
      prompt: <p>Two standardised features have correlation 0.9, so XᵀX/n = [[1, 0.9], [0.9, 1]]. What is its condition number?</p>,
      answer: { kind: "numeric", value: 19, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend where the normal equations come from, why solving them directly can lose accuracy, what the minimum-norm solution is, and why gradient descent from zero finds it.",

  glimpse: (
    <>
      <p>
        Least squares gives one weight vector. With a Gaussian prior, the posterior over weights is also Gaussian, with a
        mean that is the ridge solution and a covariance that says how well each direction is pinned down, exactly the long
        valley in this lesson&apos;s picture.
      </p>
    </>
  ),
};
