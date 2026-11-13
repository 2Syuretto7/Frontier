import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PsdCurveViz } from "@/components/viz/PsdCurveViz";
import type { LessonContent } from "@/lib/types";

const SQRT = `import numpy as np

def is_psd(A, tol=1e-10):
    A = np.asarray(A, dtype=float)
    return bool(np.allclose(A, A.T) and np.linalg.eigvalsh(A).min() >= -tol)

def psd_sqrt(A, tol=1e-10):
    if not is_psd(A, tol):
        raise ValueError("not positive semidefinite")
    lam, Q = np.linalg.eigh(A)
    return (Q * np.sqrt(np.clip(lam, 0, None))) @ Q.T`;

const CONE = `def gram(X, kernel):
    return np.array([[kernel(x, y) for y in X] for x in X])

def nearest_psd(A):
    B = (A + A.T) / 2
    lam, Q = np.linalg.eigh(B)
    return (Q * np.clip(lam, 0, None)) @ Q.T`;

export const lesson: LessonContent = {
  id: "m6.3.4",
  minutes: 55,
  links: {
    requires: ["m6.3.3"],
    revisits: ["m3.7.5"],
    foreshadows: ["m6.3.5", "m6.4.2"],
  },

  puzzle: (
    <>
      <p>
        Covariance matrices, Gram matrices XXᵀ, kernel matrices and the Hessian at a minimum are all &ldquo;non-negative&rdquo;
        in some sense, and each has a square root that a sampler or a whitening transform can use. What is the right notion
        of a non-negative operator, does its square root exist, and is it unique?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A positive operator never turns a vector to point against itself: <M>{"\\langle Tv, v\\rangle \\ge 0"}</M>. By the
        spectral theorem that is the same as having eigenvalues at least 0, so in its eigenbasis T just stretches each axis
        by a non-negative amount. Taking the square root of each stretch gives a square root of T, and there is only one
        positive one.
      </p>
      <PsdCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="positive operator">
        <p>
          An operator T on a finite-dimensional inner product space is positive (in matrix language, positive semidefinite)
          if it is self-adjoint and <M>{"\\langle Tv, v\\rangle \\ge 0"}</M> for all v. It is positive definite if moreover{" "}
          <M>{"\\langle Tv, v\\rangle > 0"}</M> for all v ≠ 0.
        </p>
      </Definition>
      <p>
        Over ℂ the word &ldquo;self-adjoint&rdquo; can be dropped, since <M>{"\\langle Tv, v\\rangle"}</M> real for all v
        already forces it. Over ℝ it cannot: the rotation by 90° has <M>{"\\langle Tv, v\\rangle = 0"}</M> for every v.
      </p>

      <Theorem title="characterisations of positivity">
        <p>For an operator T, the following are equivalent:</p>
        <ol>
          <li>T is positive;</li>
          <li>T is self-adjoint and all its eigenvalues are at least 0;</li>
          <li>T has a positive square root, a positive R with <M>{"R^2 = T"}</M>;</li>
          <li>
            <M>{"T = S^*S"}</M> for some operator (or linear map from V to another space) S.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1 ⇒ 2) If <M>{"Tv = \\lambda v"}</M> with v ≠ 0 then{" "}
          <M>{"0 \\le \\langle Tv, v\\rangle = \\lambda\\|v\\|^2"}</M>. (2 ⇒ 3) By the spectral theorem{" "}
          <M>{"T = \\sum_j \\lambda_j P_j"}</M>; set <M>{"R = \\sum_j \\sqrt{\\lambda_j} P_j"}</M>, which is self-adjoint with
          non-negative eigenvalues, hence positive, and <M>{"R^2 = T"}</M> because <M>{"P_jP_k = 0"}</M> for j ≠ k and{" "}
          <M>{"P_j^2 = P_j"}</M>. (3 ⇒ 4) Take S = R, since <M>{"R^* = R"}</M>. (4 ⇒ 1){" "}
          <M>{"(S^*S)^* = S^*S"}</M> and <M>{"\\langle S^*Sv, v\\rangle = \\langle Sv, Sv\\rangle = \\|Sv\\|^2 \\ge 0"}</M>.
        </p>
      </Proof>

      <Theorem title="uniqueness of the positive square root">
        <p>A positive operator T has exactly one positive square root, written <M>{"\\sqrt{T}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Let R be positive with <M>{"R^2 = T"}</M>. By the spectral theorem R has an orthonormal eigenbasis. If{" "}
          <M>{"Rv = \\mu v"}</M> (μ ≥ 0) then <M>{"Tv = \\mu^2 v"}</M>, so v lies in the eigenspace of T for{" "}
          <M>{"\\lambda = \\mu^2"}</M> and R acts on it as <M>{"\\sqrt{\\lambda}"}</M>. The eigenvectors of R span V, so on
          each eigenspace <M>{"E(\\lambda, T)"}</M> R is multiplication by <M>{"\\sqrt\\lambda"}</M>: R is determined by T.
        </p>
      </Proof>
      <Code>{SQRT}</Code>

      <Example title="Gram and kernel matrices">
        <p>
          For vectors <M>{"x_1, \\dots, x_n"}</M>, the Gram matrix <M>{"G_{ij} = \\langle x_i, x_j\\rangle"}</M> is{" "}
          <M>{"XX^\\top"}</M>, of the form <M>{"S^*S"}</M>, so it is positive; it is definite exactly when the vectors are
          independent. A kernel such as <M>{"k(x, y) = e^{-\\|x - y\\|^2}"}</M> is the inner product of feature vectors in
          some (possibly infinite-dimensional) space, so its kernel matrices are positive semidefinite too. That is what
          makes Gaussian processes and kernel methods well posed.
        </p>
      </Example>

      <Remark title="the positive semidefinite cone">
        <p>
          Sums of positive operators are positive, so are non-negative multiples, and so is <M>{"S^*TS"}</M> whenever T is.
          The positive operators therefore form a convex cone, and <M>{"A \\preceq B"}</M> (meaning B − A is positive) is a
          partial order on self-adjoint operators. The closest positive semidefinite matrix to a symmetric A in the Frobenius
          norm is obtained by setting its negative eigenvalues to zero, which is how an estimated correlation or similarity
          matrix that came out slightly indefinite is repaired.
        </p>
        <Code>{CONE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "singular",
      rung: "check",
      prompt: <p>For which b &gt; 0 is [[1, b], [b, 4]] positive semidefinite but not positive definite?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "trace",
      rung: "check",
      prompt: <p>What is the trace of the positive square root of diag(9, 4)?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "always",
      rung: "apply",
      prompt: <p>Which matrix is always positive semidefinite?</p>,
      answer: {
        kind: "choice",
        options: [
          "XᵀX for any real matrix X",
          "a symmetric matrix with all entries positive",
          "a symmetric matrix with a positive diagonal",
          "A − B for positive semidefinite A and B",
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

def is_psd(A, tol=1e-10):
    A = np.asarray(A, dtype=float)
    return bool(np.allclose(A, A.T) and np.linalg.eigvalsh(A).min() >= -tol)

def psd_sqrt(A, tol=1e-10):
    if not is_psd(A, tol):
        raise ValueError("not positive semidefinite")
    lam, Q = np.linalg.eigh(A)
    return (Q * np.sqrt(np.clip(lam, 0, None))) @ Q.T

A = np.array([[2.0, 1.0], [1.0, 2.0]])
R = psd_sqrt(A)
print(is_psd(A), is_psd([[1.0, 2.0], [2.0, 1.0]]), np.round(R @ R, 6).tolist())
try:
    psd_sqrt(np.diag([1.0, -1.0]))
except ValueError as e:
    print("error:", e)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False [[2.0, 1.0], [1.0, 2.0]]\nerror: not positive semidefinite",
          "True True [[2.0, 1.0], [1.0, 2.0]]\nerror: not positive semidefinite",
          "True False [[2.0, 1.0], [1.0, 2.0]]",
          "True False [[4.0, 1.0], [1.0, 4.0]]\nerror: not positive semidefinite",
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

def gram(X, kernel):
    return np.array([[kernel(x, y) for y in X] for x in X])

def nearest_psd(A):
    B = (A + A.T) / 2
    lam, Q = np.linalg.eigh(B)
    return (Q * np.clip(lam, 0, None)) @ Q.T

X = np.array([[0.0], [1.0], [2.0]])
K = gram(X, lambda x, y: float(np.exp(-np.sum((x - y) ** 2))))
print(np.round(K, 4), np.linalg.eigvalsh(K).min() > 0)
print(np.round(nearest_psd(np.array([[1.0, 2.0], [2.0, 1.0]])), 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.     0.3679 0.0183]\n [0.3679 1.     0.3679]\n [0.0183 0.3679 1.    ]] True\n[[1.5, 1.5], [1.5, 1.5]]",
          "[[1.     0.3679 0.0183]\n [0.3679 1.     0.3679]\n [0.0183 0.3679 1.    ]] True\n[[1.0, 2.0], [2.0, 1.0]]",
          "[[1.     0.3679 0.1353]\n [0.3679 1.     0.3679]\n [0.1353 0.3679 1.    ]] True\n[[1.5, 1.5], [1.5, 1.5]]",
          "[[1.     0.3679 0.0183]\n [0.3679 1.     0.3679]\n [0.0183 0.3679 1.    ]] False\n[[1.5, 1.5], [1.5, 1.5]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_psd(A, tol=1e-10)</C>, True when A is symmetric with smallest eigenvalue at least −tol, and{" "}
          <C>psd_sqrt(A, tol=1e-10)</C>, the positive square root, raising <C>ValueError</C> if A is not positive
          semidefinite (tiny negative eigenvalues within tol are treated as 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_psd(A, tol=1e-10):
    return bool(np.all(np.diag(A) >= 0))

def psd_sqrt(A, tol=1e-10):
    return np.sqrt(A)
`,
        solution: SQRT,
        tests: [
          { name: "check", code: `assert is_psd(np.array([[2.0, 1.0], [1.0, 2.0]])) is True
assert is_psd([[1.0, 2.0], [2.0, 1.0]]) is False
assert is_psd([[1.0, 1.0], [0.0, 1.0]]) is False
assert is_psd(np.zeros((3, 3))) is True` },
          { name: "square root", code: `X = np.random.default_rng(0).normal(size=(3, 5))
A = X @ X.T
R = psd_sqrt(A)
assert np.allclose(R @ R, A) and np.allclose(R, R.T) and np.linalg.eigvalsh(R).min() > -1e-9
assert np.allclose(psd_sqrt(np.diag([9.0, 4.0, 0.0])), np.diag([3.0, 2.0, 0.0]))
try:
    psd_sqrt(np.diag([1.0, -1.0]))
    assert False
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gram(X, kernel)</C>, the matrix of kernel(x, y) over all pairs of rows of X, and <C>nearest_psd(A)</C>, the
          closest positive semidefinite matrix in the Frobenius norm to a square A: symmetrise, then set negative eigenvalues
          to 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gram(X, kernel):
    return X @ X.T

def nearest_psd(A):
    return np.abs(A)
`,
        solution: `import numpy as np

${CONE}`,
        tests: [
          { name: "gram", code: `X = np.array([[0.0], [1.0], [2.0]])
K = gram(X, lambda x, y: float(np.exp(-np.sum((x - y) ** 2))))
assert K.shape == (3, 3) and np.isclose(K[0, 2], np.exp(-4)) and np.allclose(K, K.T)
Y = np.random.default_rng(2).normal(size=(4, 3))
assert np.allclose(gram(Y, lambda x, y: float(x @ y)), Y @ Y.T)` },
          { name: "projection", code: `assert np.allclose(nearest_psd(np.array([[1.0, 2.0], [2.0, 1.0]])), [[1.5, 1.5], [1.5, 1.5]])
P = np.diag([2.0, 0.5])
assert np.allclose(nearest_psd(P), P)
A = np.random.default_rng(3).normal(size=(4, 4))
N = nearest_psd(A)
assert np.allclose(N, N.T) and np.linalg.eigvalsh(N).min() > -1e-9
assert np.allclose(nearest_psd(N), N)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for any linear map S between finite-dimensional inner product spaces, S*S is a positive operator.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows S*S is self-adjoint, using (S*S)* = S*(S*)* = S*S.",
          "Shows ⟨S*Sv, v⟩ = ⟨Sv, Sv⟩ = ‖Sv‖² ≥ 0 using the defining property of the adjoint.",
        ],
      },
    },
    {
      key: "repair",
      rung: "stretch",
      prompt: (
        <p>
          What is the Frobenius distance from A = [[1, 2], [2, −2]] to the nearest positive semidefinite matrix?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend what a positive operator is, why that is the same as non-negative eigenvalues or the form S*S, and why its positive square root is unique.",

  glimpse: (
    <>
      <p>
        The curve in the picture already contains the next lesson: the smallest and largest values of{" "}
        <M>{"\\langle Ax, x\\rangle"}</M> over unit vectors are the extreme eigenvalues. The Rayleigh quotient and the
        Courant–Fischer theorem extend this to every eigenvalue, as a min–max over subspaces.
      </p>
      <p>
        Positive square roots also give the polar decomposition: every operator T is an isometry times{" "}
        <M>{"\\sqrt{T^*T}"}</M>, the operator analogue of writing a complex number as <M>{"e^{i\\theta}r"}</M>, and the
        first step towards the SVD.
      </p>
    </>
  ),
};
