import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormalityViz } from "@/components/viz/NormalityViz";
import type { LessonContent } from "@/lib/types";

const SPEC = `import numpy as np

def spectral_decomp(A, tol=1e-9):
    lam, Q = np.linalg.eigh(A)
    vals, projs = [], []
    for l, q in zip(lam, Q.T):
        if vals and abs(l - vals[-1]) < tol:
            projs[-1] = projs[-1] + np.outer(q, q)
        else:
            vals.append(l)
            projs.append(np.outer(q, q))
    return np.array(vals), projs

def matrix_function(A, f):
    lam, Q = np.linalg.eigh(A)
    return (Q * f(lam)) @ Q.T`;

const DEFL = `def power_eig(A, iters=500, seed=0):
    v = np.random.default_rng(seed).normal(size=len(A))
    for _ in range(iters):
        v = A @ v
        v = v / np.linalg.norm(v)
    return float(v @ A @ v), v

def deflation_eigs(A, k, iters=500):
    A = np.array(A, dtype=float)
    out = []
    for _ in range(k):
        lam, v = power_eig(A, iters)
        out.append(lam)
        A = A - lam * np.outer(v, v)
    return np.array(out)

def is_normal(A, tol=1e-9):
    A = np.asarray(A)
    return bool(np.allclose(A @ A.conj().T, A.conj().T @ A, atol=tol))`;

export const lesson: LessonContent = {
  id: "m6.3.3",
  minutes: 60,
  links: {
    requires: ["m6.3.1", "m6.3.2"],
    revisits: ["m3.7.4", "m3.7.2"],
    foreshadows: ["m6.3.4", "m6.4.1"],
  },

  puzzle: (
    <>
      <p>
        Hessians, covariance matrices, graph Laplacians and kernel matrices are all symmetric, and every one of them can be
        rotated to a diagonal matrix. Many non-symmetric matrices cannot, and some that can are diagonalised only by a
        badly skewed basis. Exactly which operators have an orthonormal basis of eigenvectors, and why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A self-adjoint operator treats the inner product symmetrically, and that forces two things: its eigenvalues are real,
        and the orthogonal complement of an eigenvector is again invariant. So you can split off one eigenvector at a time,
        each perpendicular to the last, until the space is used up. Over ℂ the exact condition is weaker: the operator only
        has to commute with its adjoint.
      </p>
      <NormalityViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="real spectral theorem">
        <p>
          Let V be a finite-dimensional real inner product space and T an operator on V. Then V has an orthonormal basis of
          eigenvectors of T if and only if T is self-adjoint.
        </p>
      </Theorem>
      <Proof>
        <p>
          If such a basis exists, the matrix of T in it is diagonal and real, hence equal to its transpose, so{" "}
          <M>{"T^* = T"}</M>.
        </p>
        <p>
          Conversely, induct on n = dim V. First T has an eigenvalue: in an orthonormal basis T is a real symmetric matrix A.
          Over ℂ, A has an eigenvalue λ; A is self-adjoint on <M>{"\\mathbb{C}^n"}</M> too, so λ is real; then{" "}
          <M>{"A - \\lambda I"}</M> is a singular real matrix and has a real null vector. Let <M>{"e_1"}</M> be a unit
          eigenvector, <M>{"Te_1 = \\lambda e_1"}</M>, and <M>{"U = \\operatorname{span}(e_1)^\\perp"}</M>. For u in U,{" "}
          <M>{"\\langle Tu, e_1\\rangle = \\langle u, Te_1\\rangle = \\lambda\\langle u, e_1\\rangle = 0"}</M>, so U is
          invariant. <M>{"T|_U"}</M> is self-adjoint on U, which has dimension n − 1, so by induction U has an orthonormal
          basis of eigenvectors. Add <M>{"e_1"}</M>.
        </p>
      </Proof>

      <Theorem title="complex spectral theorem">
        <p>
          Let V be a finite-dimensional complex inner product space. Then V has an orthonormal basis of eigenvectors of T if
          and only if T is normal, <M>{"TT^* = T^*T"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A diagonal matrix commutes with its conjugate transpose, which gives one direction. Conversely, by the
          upper-triangular theorem and Gram–Schmidt (which keeps each <M>{"\\operatorname{span}(v_1, \\dots, v_k)"}</M>{" "}
          unchanged and hence invariant), T has an upper-triangular matrix A in an orthonormal basis{" "}
          <M>{"e_1, \\dots, e_n"}</M>. For a normal operator{" "}
          <M>{"\\|Tv\\|^2 = \\langle T^*Tv, v\\rangle = \\langle TT^*v, v\\rangle = \\|T^*v\\|^2"}</M>. With v ={" "}
          <M>{"e_1"}</M>: <M>{"\\|Te_1\\|^2"}</M> is the squared norm of the first column of A, which is{" "}
          <M>{"|a_{11}|^2"}</M>, and <M>{"\\|T^*e_1\\|^2"}</M> is the squared norm of the first row,{" "}
          <M>{"|a_{11}|^2 + \\dots + |a_{1n}|^2"}</M>. So the rest of the first row is zero. Repeat with{" "}
          <M>{"e_2, e_3, \\dots"}</M>: A is diagonal.
        </p>
      </Proof>

      <Theorem title="spectral decomposition">
        <p>
          If T is self-adjoint (or normal over ℂ) with distinct eigenvalues <M>{"\\lambda_1, \\dots, \\lambda_m"}</M>, the
          eigenspaces are mutually orthogonal, V is their direct sum, and
        </p>
        <MD>{"T = \\sum_{j=1}^m \\lambda_j P_j,"}</MD>
        <p>
          where <M>{"P_j"}</M> is the orthogonal projection onto the eigenspace of <M>{"\\lambda_j"}</M>. In matrices,{" "}
          <M>{"A = Q\\Lambda Q^*"}</M> with Q unitary (orthogonal in the real case).
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"Tu = \\lambda u"}</M> and <M>{"Tv = \\mu v"}</M> with <M>{"\\lambda \\ne \\mu"}</M>, then{" "}
          <M>{"\\lambda\\langle u, v\\rangle = \\langle Tu, v\\rangle = \\langle u, Tv\\rangle = \\mu\\langle u, v\\rangle"}</M>{" "}
          (μ is real), so <M>{"\\langle u, v\\rangle = 0"}</M>. Group the orthonormal eigenbasis by eigenvalue; on each group
          T acts as <M>{"\\lambda_j"}</M>, which is the formula.
        </p>
      </Proof>

      <Example title="functions of a symmetric matrix">
        <p>
          The decomposition makes it natural to define <M>{"f(A) = Q f(\\Lambda) Q^\\top"}</M>: apply f to each eigenvalue.
          This gives the square root of a positive semidefinite matrix, <M>{"e^{A}"}</M>, and{" "}
          <M>{"(A + \\lambda I)^{-1}"}</M> in ridge regression, all with the same eigenvectors as A. For{" "}
          <M>{"A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2\\end{pmatrix}"}</M>, the eigenvalues are 1 and 3, with eigenvectors{" "}
          <M>{"(1, -1)/\\sqrt2"}</M> and <M>{"(1, 1)/\\sqrt2"}</M>.
        </p>
        <Code>{SPEC}</Code>
      </Example>

      <Remark title="why orthogonality makes algorithms work">
        <p>
          Power iteration finds the eigenvalue of largest absolute value. Subtracting <M>{"\\lambda vv^\\top"}</M> (deflation)
          removes it and leaves every other eigenpair intact, but only because the eigenvectors are orthogonal: for a
          non-normal matrix, deflating one eigenvector disturbs the others. The method needs a gap; if two eigenvalues have the
          same absolute value, like 3 and −3, the iterate does not settle.
        </p>
        <Code>{DEFL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sqrt",
      rung: "check",
      prompt: <p>A = [[2, 1], [1, 2]]. What is the trace of its positive semidefinite square root? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.7320508, tolerance: 1e-4 },
    },
    {
      key: "rank",
      rung: "check",
      prompt: <p>A real symmetric 3×3 matrix has eigenvalues 1, 2, 2. What is the rank of the orthogonal projection onto the eigenspace of 2?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which matrix is guaranteed to have an orthonormal basis of eigenvectors in ℂⁿ?</p>,
      answer: {
        kind: "choice",
        options: ["any real skew-symmetric matrix", "[[1, 1], [0, 1]]", "any invertible matrix", "any matrix with distinct eigenvalues"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def spectral_decomp(A, tol=1e-9):
    lam, Q = np.linalg.eigh(A)
    vals, projs = [], []
    for l, q in zip(lam, Q.T):
        if vals and abs(l - vals[-1]) < tol:
            projs[-1] = projs[-1] + np.outer(q, q)
        else:
            vals.append(l)
            projs.append(np.outer(q, q))
    return np.array(vals), projs

def matrix_function(A, f):
    lam, Q = np.linalg.eigh(A)
    return (Q * f(lam)) @ Q.T

A = np.array([[2.0, 1.0], [1.0, 2.0]])
vals, P = spectral_decomp(A)
print(vals, np.round(P[0], 4).tolist())
R = matrix_function(A, np.sqrt)
print(np.round(R @ R, 4).tolist(), len(spectral_decomp(np.eye(3))[1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1. 3.] [[0.5, -0.5], [-0.5, 0.5]]\n[[2.0, 1.0], [1.0, 2.0]] 1",
          "[1. 3.] [[0.5, 0.5], [0.5, 0.5]]\n[[2.0, 1.0], [1.0, 2.0]] 1",
          "[1. 3.] [[0.5, -0.5], [-0.5, 0.5]]\n[[2.0, 1.0], [1.0, 2.0]] 3",
          "[3. 1.] [[0.5, 0.5], [0.5, 0.5]]\n[[4.0, 1.0], [1.0, 4.0]] 1",
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

def power_eig(A, iters=500, seed=0):
    v = np.random.default_rng(seed).normal(size=len(A))
    for _ in range(iters):
        v = A @ v
        v = v / np.linalg.norm(v)
    return float(v @ A @ v), v

def deflation_eigs(A, k, iters=500):
    A = np.array(A, dtype=float)
    out = []
    for _ in range(k):
        lam, v = power_eig(A, iters)
        out.append(lam)
        A = A - lam * np.outer(v, v)
    return np.array(out)

def is_normal(A, tol=1e-9):
    A = np.asarray(A)
    return bool(np.allclose(A @ A.conj().T, A.conj().T @ A, atol=tol))

B = np.diag([5.0, -3.0, 1.0])
print(np.round(deflation_eigs(B, 3), 4))
print(is_normal([[1.0, 1.0], [0.0, 1.0]]), is_normal([[0.0, -1.0], [1.0, 0.0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[ 5. -3.  1.]\nFalse True", "[5. 1. 0.]\nFalse True", "[ 5. -3.  1.]\nTrue True", "[ 5.  1. -3.]\nFalse False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a real symmetric A, write <C>spectral_decomp(A, tol=1e-9)</C>, returning the distinct eigenvalues in increasing
          order (eigenvalues closer than tol count as equal) and the list of orthogonal projections onto their eigenspaces,
          and <C>matrix_function(A, f)</C>, returning <M>{"Qf(\\Lambda)Q^\\top"}</M> for a vectorised f.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def spectral_decomp(A, tol=1e-9):
    lam, Q = np.linalg.eigh(A)
    return lam, [np.outer(q, q) for q in Q.T]

def matrix_function(A, f):
    return f(A)
`,
        solution: SPEC,
        tests: [
          { name: "decomposition", code: `rng = np.random.default_rng(0)
Q, _ = np.linalg.qr(rng.normal(size=(4, 4)))
A = Q @ np.diag([1.0, 3.0, 3.0, -2.0]) @ Q.T
vals, P = spectral_decomp(A)
assert np.allclose(vals, [-2.0, 1.0, 3.0]) and len(P) == 3
assert np.allclose(sum(l * p for l, p in zip(vals, P)), A)
assert np.allclose(sum(P), np.eye(4)) and np.isclose(np.trace(P[2]), 2.0)
assert np.allclose(P[0] @ P[1], 0) and np.allclose(P[2] @ P[2], P[2])` },
          { name: "functions", code: `A = np.array([[2.0, 1.0], [1.0, 2.0]])
R = matrix_function(A, np.sqrt)
assert np.allclose(R @ R, A) and np.allclose(R, R.T)
E = matrix_function(A, np.exp)
assert np.isclose(E[0, 1], (np.exp(3) - np.exp(1)) / 2)
assert np.allclose(matrix_function(A, lambda l: 1 / l), np.linalg.inv(A))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>power_eig(A, iters=500, seed=0)</C> (power iteration from a random normal start, normalising each step,
          returning the Rayleigh quotient and the unit vector), <C>deflation_eigs(A, k, iters=500)</C>, the first k
          eigenvalues of a symmetric matrix found by power iteration and deflation, and <C>is_normal(A, tol=1e-9)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def power_eig(A, iters=500, seed=0):
    return 0.0, np.ones(len(A))

def deflation_eigs(A, k, iters=500):
    return np.zeros(k)

def is_normal(A, tol=1e-9):
    return True
`,
        solution: `import numpy as np

${DEFL}`,
        tests: [
          { name: "deflation", code: `rng = np.random.default_rng(1)
Q, _ = np.linalg.qr(rng.normal(size=(5, 5)))
A = Q @ np.diag([10.0, -6.0, 3.0, 1.0, 0.2]) @ Q.T
lam, v = power_eig(A)
assert np.isclose(lam, 10.0) and np.isclose(np.linalg.norm(v), 1.0) and np.allclose(A @ v, lam * v, atol=1e-6)
assert np.allclose(deflation_eigs(A, 3), [10.0, -6.0, 3.0], atol=1e-6)` },
          { name: "normal", code: `assert is_normal([[1.0, 1.0], [0.0, 1.0]]) is False
assert is_normal([[0.0, -1.0], [1.0, 0.0]]) is True
assert is_normal(np.array([[1, 1j], [1j, 1]])) is True
assert is_normal(np.diag([1.0, 2.0, 3.0])) is True` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that eigenvectors of a self-adjoint operator with distinct eigenvalues are orthogonal.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes Tu = λu, Tv = μv with λ ≠ μ and computes λ⟨u, v⟩ = ⟨Tu, v⟩ = ⟨u, Tv⟩ = μ̄⟨u, v⟩ (= μ⟨u, v⟩, using that μ is real).",
          "Concludes (λ − μ)⟨u, v⟩ = 0, hence ⟨u, v⟩ = 0 since λ ≠ μ.",
        ],
      },
    },
    {
      key: "exp",
      rung: "stretch",
      prompt: <p>A = [[2, 1], [1, 2]]. What is the off-diagonal entry of the matrix exponential e^A? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 8.6836275, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why a self-adjoint operator has an orthonormal basis of eigenvectors, what normality adds over ℂ, and how the spectral decomposition lets you apply any function to a symmetric matrix.",

  glimpse: (
    <>
      <p>
        Among self-adjoint operators, those with no negative eigenvalues behave like non-negative numbers: they have square
        roots, and every operator factors through them. Next come positive operators, which include every covariance matrix,
        Gram matrix and Hessian at a minimum.
      </p>
      <p>
        After that, the Rayleigh quotient turns the eigenvalues of a symmetric matrix into the answers of optimisation
        problems, and the spectral theorem applied to <M>{"A^\\top A"}</M> gives the singular value decomposition of any
        matrix at all.
      </p>
    </>
  ),
};
