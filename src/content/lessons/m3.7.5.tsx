import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { QuadFormViz } from "@/components/viz/QuadFormViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.5",
  minutes: 65,
  links: {
    requires: ["m3.7.4"],
    revisits: ["m3.3.4"],
    foreshadows: ["m5.5.3", "m7.5.3", "m10.2.2", "m11.3.2"],
  },

  puzzle: (
    <>
      <p>
        A loss function near a critical point looks like <M>{"f(x, y) = 2x^2 + 2bxy + 2y^2"}</M>. For b = 1 the point is the
        bottom of a bowl. For b = 3 a ball placed there rolls away in some directions.
      </p>
      <p>At exactly which value of b does the bowl turn into a saddle, and how could you tell for a function of a million variables?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The quadratic form <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x"}</M> is a bowl when every eigenvalue of S is positive: its
        level curves are ellipses. When an eigenvalue turns negative, the level curves become hyperbolas and the origin is a
        saddle. Move the sliders and watch the eigenvalues, the pivots and the shape change together.
      </p>
      <QuadFormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="positive definite">
        <p>
          A symmetric matrix S is <strong>positive definite</strong> if <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x > 0"}</M> for
          every x ≠ 0, and <strong>positive semidefinite</strong> if <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x \\ge 0"}</M> for
          every x.
        </p>
      </Definition>

      <Theorem title="five equivalent tests">
        <p>For symmetric S, each of these is equivalent to positive definiteness:</p>
        <ol>
          <li>every eigenvalue is positive;</li>
          <li>every pivot in elimination is positive;</li>
          <li>every upper-left determinant is positive;</li>
          <li><M>{"\\mathbf x^{\\mathsf T}S\\mathbf x > 0"}</M> for every x ≠ 0;</li>
          <li><M>{"S = A^{\\mathsf T}A"}</M> for some A with independent columns.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1 ⇔ 4) With <M>{"S = Q\\Lambda Q^{\\mathsf T}"}</M> and <M>{"\\mathbf y = Q^{\\mathsf T}\\mathbf x"}</M>,{" "}
          <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x = \\sum \\lambda_iy_i^2"}</M>, positive for all y ≠ 0 exactly when every{" "}
          <M>{"\\lambda_i > 0"}</M>. (5 ⇒ 4) <M>{"\\mathbf x^{\\mathsf T}A^{\\mathsf T}A\\mathbf x = \\|A\\mathbf x\\|^2 > 0"}</M>{" "}
          when Ax ≠ 0. (1 ⇒ 5) Take <M>{"A = \\Lambda^{1/2}Q^{\\mathsf T}"}</M>. For 2 and 3, the k-th pivot is the ratio of the
          k-th to the (k − 1)-th upper-left determinant.
        </p>
      </Proof>

      <Example title="the 2 × 2 test">
        <p>
          S = [[a, b], [b, c]] is positive definite exactly when a &gt; 0 and <M>{"ac - b^2 > 0"}</M>. Completing the square
          shows why:
        </p>
        <MD>{"ax^2 + 2bxy + cy^2 = a\\Bigl(x + \\tfrac{b}{a}y\\Bigr)^2 + \\Bigl(c - \\tfrac{b^2}{a}\\Bigr)y^2,"}</MD>
        <p>and the two coefficients are the pivots.</p>
      </Example>

      <Example title="the puzzle">
        <p>
          f = <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x"}</M> with S = [[2, b], [b, 2]]. The test is <M>{"4 - b^2 > 0"}</M>, so the
          bowl becomes a saddle at |b| = 2. At b = 2 exactly, S is semidefinite: the bowl is flat along (1, −1). For a million
          variables, compute the pivots by elimination, or the smallest eigenvalue by an iterative method.
        </p>
      </Example>

      <Theorem title="Cholesky">
        <p>
          A positive definite S factors as <M>{"S = LL^{\\mathsf T}"}</M> with L lower triangular with positive diagonal. It is
          LU with the symmetry exploited, at half the cost.
        </p>
      </Theorem>

      <Remark title="where they appear">
        <p>
          Covariance matrices are positive semidefinite. The Hessian of a function at a minimum is positive semidefinite, and if
          it is positive definite the minimum is strict. A function is convex when its Hessian is positive semidefinite
          everywhere. Kernel matrices in machine learning must be positive semidefinite.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tests",
      rung: "check",
      prompt: <p>Which of these show that a symmetric matrix S is positive definite? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["All eigenvalues are positive", "All pivots are positive", "All entries are positive", "xᵀSx > 0 for every x ≠ 0"],
        correct: [0, 1, 3],
      },
    },
    {
      key: "pd",
      rung: "check",
      prompt: <p>Is [[2, 1], [1, 2]] positive definite?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "b",
      rung: "apply",
      prompt: <p>[[1, b], [b, 4]] is positive definite for |b| below some value. What is that value?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "pivot",
      rung: "apply",
      prompt: <p>Find the second pivot of [[4, 2], [2, 3]].</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which matrices are positive definite? Rows are separated by semicolons. Select all that apply.</p>,
      answer: { kind: "choice", options: ["[2 −1; −1 2]", "[1 2; 2 1]", "[1 0; 0 0]", "[5 2; 2 1]"], correct: [0, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
for b in [0.5, 1.5, 2.5]:
    S = np.array([[1.0, b], [b, 4.0]])
    try:
        np.linalg.cholesky(S)
        print("yes")
    except np.linalg.LinAlgError:
        print("no")`}</Code>
          <p>Cholesky fails unless the matrix is positive definite. What does this print, line by line?</p>
        </>
      ),
      answer: { kind: "choice", options: ["yes yes no", "yes no no", "yes yes yes", "no no yes"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
S = np.array([[2.0, 1.0], [1.0, 2.0]])
x = np.array([1.0, -3.0])
L = np.linalg.cholesky(S)
print(x @ S @ x, np.round(L, 4), np.all(np.linalg.eigvalsh(S) > 0))`}</Code>
          <p>The energy xᵀSx, the Cholesky factor and the eigenvalue test for positive definiteness. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["14.0 [[1.4142 0.    ]\n [0.7071 1.2247]] True", "14.0 [[1.4142 0.7071]\n [0.     1.2247]] True", "26.0 [[1.4142 0.    ]\n [0.7071 1.2247]] True", "14.0 [[1.4142 0.    ]\n [0.7071 1.2247]] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_pos_def(S)</C>, which decides whether a symmetric matrix is positive definite from its pivots: eliminate
            without row swaps and return <C>False</C> as soon as a pivot is not positive. Do not compute eigenvalues.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_pos_def(S):
    S = np.asarray(S, float)
    return bool(np.all(np.diag(S) > 0))
`,
        solution: `import numpy as np

def is_pos_def(S):
    U = np.array(S, dtype=float)
    n = len(U)
    for c in range(n):
        if U[c, c] <= 1e-12:
            return False
        for r in range(c + 1, n):
            U[r] -= U[r, c] / U[c, c] * U[c]
    return True
`,
        tests: [
          { name: "bowl", code: `assert is_pos_def([[2, 1], [1, 2]]), '[[2, 1], [1, 2]] is positive definite.'` },
          { name: "saddle", code: `assert not is_pos_def([[2, 3], [3, 2]]), '[[2, 3], [3, 2]] is a saddle: its second pivot is negative, though its diagonal is positive.'` },
          { name: "semidefinite", code: `assert not is_pos_def([[1, 2], [2, 4]]), 'A zero pivot means semidefinite, not definite.'` },
          { name: "tridiagonal", code: `import numpy as np
T = 2 * np.eye(5) - np.eye(5, k=1) - np.eye(5, k=-1)
assert is_pos_def(T), 'The 2, −1 tridiagonal matrix is positive definite.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>cholesky(S)</C>, the lower-triangular L with S = LLᵀ, computed column by column (Lⱼⱼ = √(Sⱼⱼ − Σₖ&lt;ⱼ Lⱼₖ²), Lᵢⱼ = (Sᵢⱼ − Σₖ&lt;ⱼ LᵢₖLⱼₖ)/Lⱼⱼ), raising <C>np.linalg.LinAlgError</C> if a diagonal value is not positive (so S is not positive definite). Then write <C>sample_gaussian(mean, cov, n, seed)</C>, n samples from a multivariate normal as mean + Lz with standard normal z from a seeded <C>default_rng</C>, and <C>mahalanobis(x, mean, cov)</C>, √((x − m)ᵀΣ⁻¹(x − m)) computed with two triangular solves.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cholesky(S):
    return np.linalg.cholesky(S)

def sample_gaussian(mean, cov, n, seed):
    return np.zeros((n, len(mean)))

def mahalanobis(x, mean, cov):
    return float(np.linalg.norm(np.asarray(x) - mean))
`,
        solution: `import numpy as np

from scipy.linalg import solve_triangular

def cholesky(S):
    S = np.asarray(S, float)
    n = len(S)
    L = np.zeros((n, n))
    for j in range(n):
        d = S[j, j] - L[j, :j] @ L[j, :j]
        if d <= 0:
            raise np.linalg.LinAlgError('not positive definite')
        L[j, j] = np.sqrt(d)
        for i in range(j + 1, n):
            L[i, j] = (S[i, j] - L[i, :j] @ L[j, :j]) / L[j, j]
    return L

def sample_gaussian(mean, cov, n, seed):
    L = cholesky(cov)
    z = np.random.default_rng(seed).standard_normal((n, len(mean)))
    return np.asarray(mean, float) + z @ L.T

def mahalanobis(x, mean, cov):
    L = cholesky(cov)
    d = np.asarray(x, float) - np.asarray(mean, float)
    y = solve_triangular(L, d, lower=True)
    return float(np.sqrt(y @ y))
`,
        tests: [
          { name: "factor", code: `import numpy as np
L = cholesky([[4.0, 2.0], [2.0, 3.0]])
assert np.allclose(L, [[2, 0], [1, 2 ** 0.5]]), 'S = LLᵀ.'` },
          { name: "random", code: `import numpy as np
rng = np.random.default_rng(22)
B = rng.normal(size=(6, 6))
S = B @ B.T + 0.1 * np.eye(6)
L = cholesky(S)
assert np.allclose(L @ L.T, S) and np.allclose(np.tril(L), L) and 'cholesky' not in __import__('inspect').getsource(cholesky).replace('def cholesky', ''), 'Your own factorisation.'` },
          { name: "not pd", code: `import numpy as np
try:
    cholesky([[1.0, 2.0], [2.0, 1.0]])
    ok = False
except np.linalg.LinAlgError:
    ok = True
assert ok, 'Eigenvalues 3 and −1: not positive definite.'` },
          { name: "samples", code: `import numpy as np
cov = np.array([[2.0, 0.8], [0.8, 1.0]])
X = sample_gaussian([1.0, -2.0], cov, 200000, 0)
assert np.allclose(X.mean(0), [1, -2], atol=0.01) and np.allclose(np.cov(X.T), cov, atol=0.02), 'Lz has covariance LLᵀ.'` },
          { name: "mahalanobis", code: `import numpy as np
cov = np.array([[4.0, 0.0], [0.0, 1.0]])
assert abs(mahalanobis([2, 0], [0, 0], cov) - 1) < 1e-12 and abs(mahalanobis([0, 2], [0, 0], cov) - 2) < 1e-12, 'Distance in units of standard deviation.'` },
        ],
      },
    },
    {
      key: "ata",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"A^{\\mathsf T}A"}</M> is positive semidefinite for every matrix A, and positive definite exactly when
          the columns of A are independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes AᵀA is symmetric.",
          "Computes xᵀAᵀAx = (Ax)ᵀ(Ax) = ‖Ax‖² ≥ 0.",
          "Observes ‖Ax‖² = 0 exactly when Ax = 0, so positivity for every x ≠ 0 means N(A) = {0}, that is, independent columns.",
        ],
      },
    },
    {
      key: "tri",
      rung: "stretch",
      prompt: (
        <p>
          Find the smallest eigenvalue of the 3 × 3 matrix with 2 on the diagonal, −1 just above and below it, and 0 elsewhere.
          Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.586, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what a positive definite matrix is, the different ways to test for it, and why it decides whether a critical point is a bowl or a saddle.",

  glimpse: (
    <p>
      Next chapter: linear transformations, and finally the singular value decomposition. Multivariable and Matrix Calculus
      classifies critical points by the Hessian, Probability builds covariance matrices, and Convex Optimisation tests
      convexity with positive semidefinite Hessians.
    </p>
  ),
};
