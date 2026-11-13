import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CornerHitViz } from "@/components/viz/CornerHitViz";
import type { LessonContent } from "@/lib/types";

const KKT = `import numpy as np

def lam_max(A, b):
    return float(np.max(np.abs(A.T @ b)))

def kkt_ok(A, b, lam, x, tol=1e-6):
    c = A.T @ (b - A @ x)
    on = np.abs(x) > tol
    if not np.allclose(c[on], lam * np.sign(x[on]), atol=tol):
        return False
    return bool(np.all(np.abs(c[~on]) <= lam + tol))`;

const CD = `import numpy as np

def soft(z, t):
    return np.sign(z) * max(abs(z) - t, 0.0) + 0.0

def lasso_cd(A, b, lam, sweeps):
    n = A.shape[1]
    x = np.zeros(n)
    r = b.copy()
    sq = (A ** 2).sum(axis=0)
    for _ in range(sweeps):
        for j in range(n):
            r = r + A[:, j] * x[j]
            x[j] = soft(float(A[:, j] @ r), lam) / sq[j]
            r = r - A[:, j] * x[j]
    return x`;

export const lesson: LessonContent = {
  id: "m10.7.3",
  minutes: 50,
  links: {
    requires: ["m10.7.2", "m10.4.3"],
    revisits: ["m10.3.3"],
    foreshadows: ["m10.8.3"],
  },

  puzzle: (
    <>
      <p>
        Penalise the squared size of regression coefficients and they all shrink, but none becomes exactly zero. Penalise
        their absolute size instead and many of them land exactly on zero, so the model selects its own features. Both
        penalties are convex and both are smallest at the origin. What is it about the absolute value that produces exact
        zeros, and how large must the penalty be before every coefficient vanishes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The ℓ₁ ball is a diamond, with corners on the axes; a squared loss tends to meet it first at a corner, where some
        coordinates are exactly zero. The same fact in the language of optimality: at a zero coordinate the subdifferential
        of |x| is the whole interval [−1, 1], so a coordinate can stay at zero as long as the pull of the loss on it is at
        most λ. A smooth penalty has derivative 0 at 0 and offers no such slack, so any pull at all moves the coordinate off
        zero.
      </p>
      <CornerHitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the lasso">
        <p>For a design matrix A with columns <M>{"a_j"}</M>, a response b and λ &gt; 0, the lasso is</p>
        <MD>{"\\min_x \\tfrac12\\|Ax - b\\|^2 + \\lambda\\|x\\|_1."}</MD>
        <p>
          By Lagrange duality it is equivalent, for a matching radius τ, to least squares subject to{" "}
          <M>{"\\|x\\|_1 \\leq \\tau"}</M>, the picture in the viz.
        </p>
      </Definition>

      <Theorem title="optimality conditions">
        <p>With residual <M>{"r = b - Ax^*"}</M>, a point x* solves the lasso if and only if, for each j,</p>
        <MD>{"a_j^\\top r = \\lambda\\,\\mathrm{sign}(x_j^*) \\text{ if } x_j^* \\neq 0, \\qquad |a_j^\\top r| \\leq \\lambda \\text{ if } x_j^* = 0."}</MD>
        <p>In particular x* = 0 is a solution exactly when <M>{"\\lambda \\geq \\lambda_{\\max} = \\|A^\\top b\\|_\\infty"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The condition is <M>{"0 \\in A^\\top(Ax^* - b) + \\lambda\\,\\partial\\|x^*\\|_1"}</M>, and{" "}
          <M>{"\\partial\\|x\\|_1"}</M> is the product of the sets <M>{"\\{\\mathrm{sign}(x_j)\\}"}</M> for nonzero{" "}
          <M>{"x_j"}</M> and [−1, 1] for zero ones. At x* = 0 the residual is b, and the conditions read{" "}
          <M>{"|a_j^\\top b| \\leq \\lambda"}</M> for all j.
        </p>
        <Code>{KKT}</Code>
      </Proof>

      <Theorem title="orthonormal design">
        <p>
          If <M>{"A^\\top A = I"}</M>, the lasso solution is <M>{"x_j^* = \\mathrm{sign}(z_j)\\max(|z_j| - \\lambda, 0)"}</M>{" "}
          with <M>{"z = A^\\top b"}</M>, while the ridge solution of{" "}
          <M>{"\\frac12\\|Ax - b\\|^2 + \\frac\\lambda2\\|x\\|^2"}</M> is <M>{"z/(1 + \\lambda)"}</M>, which is zero only where z
          is.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"A^\\top A = I"}</M>,{" "}
          <M>{"\\frac12\\|Ax - b\\|^2 = \\frac12\\|x - z\\|^2 + \\text{const}"}</M>, so the lasso objective is the proximal
          problem for <M>{"\\lambda\\|x\\|_1"}</M> at z, solved by soft thresholding, and ridge is the prox of{" "}
          <M>{"\\frac\\lambda2\\|x\\|^2"}</M>.
        </p>
      </Proof>

      <Remark title="coordinate descent and the path">
        <p>
          Minimising over one coordinate with the others fixed is a one-dimensional lasso, solved by soft thresholding{" "}
          <M>{"x_j \\leftarrow S_\\lambda(a_j^\\top r_{-j})/\\|a_j\\|^2"}</M>, where <M>{"r_{-j}"}</M> is the residual without
          coordinate j. Cycling through coordinates converges for the lasso and is the method in most software. As λ
          decreases from <M>{"\\lambda_{\\max}"}</M>, the solution path is piecewise linear and coordinates enter (and
          occasionally leave) the support one at a time. In the code, <M>{"\\lambda_{\\max} = 5"}</M>; at λ = 2 coordinate
          descent gives (1.3, 0, 0.4), satisfying the conditions, and the number of nonzeros falls from 3 to 0 as λ rises to
          5. On the box <M>{"[-1, 1]^n"}</M>, ‖x‖₁ is the largest convex function below the count of nonzeros, which is why
          it is the standard convex stand-in for sparsity.
        </p>
        <Code>{CD}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lmax",
      rung: "check",
      prompt: <p>For a lasso problem, Aᵀb = (3, −7, 2). What is the smallest λ for which x* = 0?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0.0001 },
    },
    {
      key: "nnz",
      rung: "check",
      prompt: <p>With AᵀA = I, Aᵀb = (2.5, −0.4, 1.0) and λ = 1, how many coordinates of the lasso solution are nonzero?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>At a lasso solution x* with residual r = b − Ax*, which condition must hold for a coordinate with x*_j = 0?</p>,
      answer: {
        kind: "choice",
        options: ["|a_jᵀr| ≤ λ", "a_jᵀr = 0", "a_jᵀr = λ", "|a_jᵀr| ≥ λ"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def lam_max(A, b):
    return float(np.max(np.abs(A.T @ b)))

def kkt_ok(A, b, lam, x, tol=1e-6):
    c = A.T @ (b - A @ x)
    on = np.abs(x) > tol
    if not np.allclose(c[on], lam * np.sign(x[on]), atol=tol):
        return False
    return bool(np.all(np.abs(c[~on]) <= lam + tol))

A = np.array([[1.0, 0.0, 1.0], [0.0, 1.0, 1.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]]); b = np.array([3.0, 1.0, 2.0, 0.5])
print(lam_max(A, b), kkt_ok(A, b, 5.0, np.zeros(3)), kkt_ok(A, b, 4.0, np.zeros(3)))
c = np.array([2.0, -0.5, 1.0])
print(kkt_ok(np.eye(3), c, 0.75, np.array([1.25, 0.0, 0.25])), kkt_ok(np.eye(3), c, 0.75, np.array([1.25, -0.1, 0.25])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.0 True False\nTrue False", "5.0 True True\nTrue False", "4.5 False False\nTrue False", "5.0 True False\nTrue True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def soft(z, t):
    return np.sign(z) * max(abs(z) - t, 0.0) + 0.0

def lasso_cd(A, b, lam, sweeps):
    n = A.shape[1]
    x = np.zeros(n)
    r = b.copy()
    sq = (A ** 2).sum(axis=0)
    for _ in range(sweeps):
        for j in range(n):
            r = r + A[:, j] * x[j]
            x[j] = soft(float(A[:, j] @ r), lam) / sq[j]
            r = r - A[:, j] * x[j]
    return x

A = np.array([[1.0, 0.0, 1.0], [0.0, 1.0, 1.0], [1.0, 1.0, 0.0], [0.0, 0.0, 1.0]]); b = np.array([3.0, 1.0, 2.0, 0.5])
x = lasso_cd(A, b, 2.0, 200)
print(np.round(x, 4).tolist(), [int(np.sum(np.abs(lasso_cd(A, b, l, 200)) > 1e-9)) for l in [0.1, 1.0, 3.0, 4.9, 5.0]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.3, 0.0, 0.4] [3, 2, 2, 1, 0]", "[1.3, 0.0, 0.4] [3, 3, 2, 1, 0]", "[1.3, 0.1, 0.4] [3, 2, 2, 1, 1]", "[2.0, 0.0, 0.0] [3, 2, 2, 1, 0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lam_max(A, b)</C> and <C>kkt_ok(A, b, lam, x, tol=1e-6)</C>, which checks the lasso optimality conditions,
          treating coordinates with |x_j| ≤ tol as zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lam_max(A, b):
    return 0.0

def kkt_ok(A, b, lam, x, tol=1e-6):
    return True
`,
        solution: KKT,
        tests: [
          { name: "max", code: `A = np.array([[1.0, -2.0], [0.0, 1.0]]); b = np.array([3.0, -1.0])
assert abs(lam_max(A, b) - 7.0) < 1e-12 and kkt_ok(A, b, 7.0, np.zeros(2)) and not kkt_ok(A, b, 6.9, np.zeros(2))` },
          { name: "orth", code: `z = np.array([2.5, -0.4, 1.0, -3.0])
assert kkt_ok(np.eye(4), z, 1.0, np.array([1.5, 0.0, 0.0, -2.0]))
assert not kkt_ok(np.eye(4), z, 1.0, np.array([1.5, 0.0, 0.0, -2.1])) and not kkt_ok(np.eye(4), z, 0.3, np.array([2.2, 0.0, 0.7, -2.7]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soft(z, t)</C> for scalars and <C>lasso_cd(A, b, lam, sweeps)</C>, cyclic coordinate descent from x = 0
          that keeps the residual r = b − Ax up to date.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def soft(z, t):
    return z

def lasso_cd(A, b, lam, sweeps):
    return np.zeros(A.shape[1])
`,
        solution: CD,
        tests: [
          { name: "soft", code: `assert soft(3.0, 1.0) == 2.0 and soft(-0.5, 1.0) == 0.0 and soft(-4.0, 1.5) == -2.5` },
          { name: "cd", code: `rng = np.random.default_rng(2); A = rng.normal(size=(30, 10)); b = A[:, 0] * 3 - A[:, 4] * 2 + 0.1 * rng.normal(size=30)
x = lasso_cd(A, b, 5.0, 300)
c = A.T @ (b - A @ x); on = np.abs(x) > 1e-9
assert np.allclose(c[on], 5.0 * np.sign(x[on]), atol=1e-6) and np.all(np.abs(c[~on]) <= 5.0 + 1e-6) and on[0] and on[4] and on.sum() < 10` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose AᵀA = I. Prove that the lasso solution is x*_j = sign(z_j) max(|z_j| − λ, 0), where z = Aᵀb.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses AᵀA = I to rewrite ½‖Ax − b‖² as ½‖x − z‖² plus a constant, so the problem separates over coordinates.",
          "Solves each scalar problem min ½(x − z)² + λ|x| using the subgradient condition z − x ∈ λ∂|x|.",
          "Checks the cases: x > 0 gives x = z − λ (needs z > λ), x < 0 gives x = z + λ (needs z < −λ), and x = 0 exactly when |z| ≤ λ.",
        ],
      },
    },
    {
      key: "one",
      rung: "stretch",
      prompt: <p>A lasso with a single feature a has ‖a‖² = 4, aᵀb = 6 and λ = 2. What is the solution x*?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the ℓ₁ penalty produces exact zeros while the squared penalty does not, using both the corners of the diamond and the subdifferential of |x| at 0, how λ_max is found, and how coordinate descent solves the lasso.",

  glimpse: (
    <>
      <p>
        Proximal methods measure distance with the Euclidean norm. Mirror descent replaces it with a geometry suited to the
        constraint set, such as entropy on the probability simplex, and gains a dimension factor in return.
      </p>
    </>
  ),
};
