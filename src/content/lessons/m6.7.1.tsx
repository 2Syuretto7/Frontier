import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InertiaViz } from "@/components/viz/InertiaViz";
import type { LessonContent } from "@/lib/types";

const FORMS = `import numpy as np

def form_matrix(bf, basis):
    return np.array([[bf(u, v) for v in basis] for u in basis], dtype=float)

def inertia(S, tol=1e-9):
    lam = np.linalg.eigvalsh(S)
    return int((lam > tol).sum()), int((lam < -tol).sum()), int((np.abs(lam) <= tol).sum())`;

const LDL = `def ldl_pivots(S):
    A = np.array(S, dtype=float)
    d = np.zeros(len(A))
    for k in range(len(A)):
        d[k] = A[k, k]
        if d[k] == 0:
            raise ValueError("zero pivot")
        A[k + 1:, k + 1:] -= np.outer(A[k + 1:, k], A[k, k + 1:]) / d[k]
    return d

def classify_critical(H, tol=1e-9):
    lam = np.linalg.eigvalsh(H)
    if np.any(np.abs(lam) <= tol):
        return "degenerate"
    if np.all(lam > 0):
        return "minimum"
    return "maximum" if np.all(lam < 0) else "saddle"`;

export const lesson: LessonContent = {
  id: "m6.7.1",
  minutes: 55,
  links: {
    requires: ["m6.3.3", "m6.1.4"],
    revisits: ["m3.7.5", "m6.3.4"],
    foreshadows: ["m6.7.2"],
  },

  puzzle: (
    <>
      <p>
        A Hessian and a linear operator are both stored as square matrices, but they are different kinds of object. Change
        coordinates and an operator&apos;s matrix keeps its eigenvalues, while a Hessian&apos;s eigenvalues change. Yet
        whether a critical point is a minimum, a maximum or a saddle cannot depend on coordinates. What exactly survives a
        change of basis for a Hessian?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Hessian is a bilinear form: it eats two vectors and returns a number, <M>{"h^\\top Hk"}</M>. When you change basis
        by P, both arguments change, so the matrix becomes <M>{"P^\\top HP"}</M>, not <M>{"P^{-1}HP"}</M>. Stretching
        coordinates can rescale its eigenvalues freely, but it can never turn a direction of upward curvature into a
        downward one. The counts of positive, negative and zero eigenvalues are the invariants.
      </p>
      <InertiaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="bilinear and quadratic forms">
        <p>
          A bilinear form on a real vector space V is a map <M>{"\\beta: V \\times V \\to \\mathbb{R}"}</M> that is linear in
          each argument. Given a basis <M>{"e_1, \\dots, e_n"}</M>, its matrix is <M>{"S_{ij} = \\beta(e_i, e_j)"}</M>, and{" "}
          <M>{"\\beta(u, v) = \\hat u^\\top S\\hat v"}</M> in coordinates. It is symmetric if{" "}
          <M>{"\\beta(u, v) = \\beta(v, u)"}</M>. The quadratic form of β is <M>{"q(v) = \\beta(v, v)"}</M>, and a symmetric β
          is recovered from q by polarisation, <M>{"\\beta(u, v) = \\tfrac12(q(u + v) - q(u) - q(v))"}</M>.
        </p>
      </Definition>

      <Theorem title="change of basis is congruence">
        <p>
          If the new basis vectors are the columns of an invertible P (in old coordinates), the matrix of β in the new basis
          is <M>{"P^\\top SP"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The new basis vectors are <M>{"f_j = \\sum_i P_{ij}e_i"}</M>, so{" "}
          <M>{"\\beta(f_j, f_l) = \\sum_{i,k}P_{ij}P_{kl}\\beta(e_i, e_k) = (P^\\top SP)_{jl}"}</M>. Compare an operator, whose
          matrix becomes <M>{"P^{-1}AP"}</M>: the two rules agree only when <M>{"P^\\top = P^{-1}"}</M>, that is for
          orthonormal changes of basis.
        </p>
      </Proof>

      <Theorem title="diagonal forms">
        <p>
          Every symmetric bilinear form on <M>{"\\mathbb{R}^n"}</M> has an orthonormal basis (for the dot product) in which its
          matrix is diagonal, and a basis in which its matrix is <M>{"\\operatorname{diag}(1, \\dots, 1, -1, \\dots, -1, 0, \\dots, 0)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the spectral theorem <M>{"S = Q\\Lambda Q^\\top"}</M> with Q orthogonal, so <M>{"Q^\\top SQ = \\Lambda"}</M>. Then
          rescale each basis vector <M>{"q_i"}</M> with <M>{"\\lambda_i \\ne 0"}</M> by <M>{"1/\\sqrt{|\\lambda_i|}"}</M>, which
          turns <M>{"\\lambda_i"}</M> into ±1, and reorder.
        </p>
      </Proof>

      <Theorem title="Sylvester's law of inertia">
        <p>
          The numbers <M>{"n_+, n_-, n_0"}</M> of positive, negative and zero diagonal entries in any diagonal matrix of a
          symmetric form do not depend on the basis. In particular, S and <M>{"P^\\top SP"}</M> have the same numbers of
          positive, negative and zero eigenvalues.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"n_+"}</M> equals the largest dimension of a subspace on which q is positive definite, a basis-free quantity. If
          the form is diagonal in a basis with <M>{"n_+"}</M> positive entries, q is positive definite on their span. Conversely,
          suppose q is positive definite on some W with <M>{"\\dim W > n_+"}</M>. The span N of the basis vectors with
          non-positive entries has dimension <M>{"n - n_+"}</M>, so W and N meet in a nonzero v; then{" "}
          <M>{"q(v) > 0"}</M> because v ∈ W and <M>{"q(v) \\le 0"}</M> because v ∈ N, a contradiction. The same argument
          applied to −q gives <M>{"n_-"}</M>, and <M>{"n_0 = n - n_+ - n_-"}</M>.
        </p>
      </Proof>
      <Code>{FORMS}</Code>

      <Example title="signature from elimination">
        <p>
          Symmetric elimination writes <M>{"S = LDL^\\top"}</M> with L unit lower triangular when no pivot is zero. That is a
          congruence, <M>{"D = L^{-1}SL^{-\\top}"}</M>, so by Sylvester the signs of the pivots are the signs of the
          eigenvalues, without computing any eigenvalues. For [[1, 2], [2, 1]] the pivots are 1 and 1 − 4 = −3: one positive
          and one negative, as the eigenvalues 3 and −1 say. Completing the square,{" "}
          <M>{"x^2 + 4xy + y^2 = (x + 2y)^2 - 3y^2"}</M>, is the same computation.
        </p>
      </Example>

      <Remark title="critical points">
        <p>
          At a critical point of a smooth function, the Hessian is a symmetric bilinear form. If it is non-degenerate (no zero
          eigenvalue), the point is a minimum when <M>{"n_- = 0"}</M>, a maximum when <M>{"n_+ = 0"}</M>, and otherwise a saddle
          with <M>{"n_-"}</M> independent descent directions (its index). By Sylvester these labels do not depend on how the
          parameters are scaled. In high-dimensional loss landscapes most critical points with high loss are saddles, which is
          why first-order methods with noise rarely get stuck at them.
        </p>
        <Code>{LDL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "entry",
      rung: "check",
      prompt: <p>β(u, v) = u₁v₁ + 2(u₁v₂ + u₂v₁) + u₂v₂ on ℝ². What is the entry S₁₂ of its matrix in the standard basis?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "neg",
      rung: "check",
      prompt: <p>How many negative eigenvalues does PᵀSP have, for S = [[1, 2], [2, 1]] and any invertible P?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "rule",
      rung: "apply",
      prompt: <p>The new basis vectors are the columns of an invertible P. How does the matrix S of a bilinear form change?</p>,
      answer: { kind: "choice", options: ["PᵀSP", "P⁻¹SP", "PSP⁻¹", "PSPᵀ"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def form_matrix(bf, basis):
    return np.array([[bf(u, v) for v in basis] for u in basis], dtype=float)

def inertia(S, tol=1e-9):
    lam = np.linalg.eigvalsh(S)
    return int((lam > tol).sum()), int((lam < -tol).sum()), int((np.abs(lam) <= tol).sum())

bf = lambda u, v: u[0] * v[0] + 2 * (u[0] * v[1] + u[1] * v[0]) + u[1] * v[1]
S = form_matrix(bf, np.eye(2))
print(S, inertia(S))
P = np.array([[1.0, -2.0], [0.0, 1.0]])
print(form_matrix(bf, P.T), inertia(form_matrix(bf, P.T)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1. 2.]\n [2. 1.]] (1, 1, 0)\n[[ 1.  0.]\n [ 0. -3.]] (1, 1, 0)",
          "[[1. 2.]\n [2. 1.]] (2, 0, 0)\n[[ 1.  0.]\n [ 0. -3.]] (1, 1, 0)",
          "[[1. 4.]\n [4. 1.]] (1, 1, 0)\n[[ 1.  0.]\n [ 0. -15.]] (1, 1, 0)",
          "[[1. 2.]\n [2. 1.]] (1, 1, 0)\n[[ 3.  0.]\n [ 0. -1.]] (1, 1, 0)",
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

def ldl_pivots(S):
    A = np.array(S, dtype=float)
    d = np.zeros(len(A))
    for k in range(len(A)):
        d[k] = A[k, k]
        if d[k] == 0:
            raise ValueError("zero pivot")
        A[k + 1:, k + 1:] -= np.outer(A[k + 1:, k], A[k, k + 1:]) / d[k]
    return d

def classify_critical(H, tol=1e-9):
    lam = np.linalg.eigvalsh(H)
    if np.any(np.abs(lam) <= tol):
        return "degenerate"
    if np.all(lam > 0):
        return "minimum"
    return "maximum" if np.all(lam < 0) else "saddle"

print(ldl_pivots([[1.0, 2.0], [2.0, 1.0]]), ldl_pivots([[4.0, 2.0, 0.0], [2.0, 2.0, 1.0], [0.0, 1.0, 3.0]]))
print([classify_critical(H) for H in (np.diag([1.0, 2.0]), np.diag([1.0, -2.0]), -np.eye(2), np.diag([1.0, 0.0]))])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[ 1. -3.] [4. 1. 2.]\n['minimum', 'saddle', 'maximum', 'degenerate']",
          "[ 3. -1.] [4. 1. 2.]\n['minimum', 'saddle', 'maximum', 'degenerate']",
          "[ 1. -3.] [4. 2. 3.]\n['minimum', 'saddle', 'maximum', 'degenerate']",
          "[ 1. -3.] [4. 1. 2.]\n['minimum', 'saddle', 'maximum', 'minimum']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>form_matrix(bf, basis)</C>, the matrix [bf(bᵢ, bⱼ)] of a bilinear form (given as a Python function) in a
          list of basis vectors, and <C>inertia(S, tol=1e-9)</C>, the tuple (n₊, n₋, n₀) of a symmetric matrix as ints.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def form_matrix(bf, basis):
    return np.eye(len(basis))

def inertia(S, tol=1e-9):
    return len(S), 0, 0
`,
        solution: FORMS,
        tests: [
          { name: "matrix", code: `bf = lambda u, v: u[0] * v[0] + 2 * (u[0] * v[1] + u[1] * v[0]) + u[1] * v[1]
assert np.allclose(form_matrix(bf, np.eye(2)), [[1, 2], [2, 1]])
P = np.array([[1.0, -2.0], [0.0, 1.0]])
assert np.allclose(form_matrix(bf, P.T), P.T @ np.array([[1.0, 2.0], [2.0, 1.0]]) @ P)` },
          { name: "inertia", code: `assert inertia(np.array([[1.0, 2.0], [2.0, 1.0]])) == (1, 1, 0)
assert inertia(np.ones((3, 3))) == (1, 0, 2)
rng = np.random.default_rng(0)
X = rng.normal(size=(4, 4)); S = X + X.T; P = rng.normal(size=(4, 4))
assert inertia(P.T @ S @ P) == inertia(S) and all(isinstance(t, int) for t in inertia(S))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ldl_pivots(S)</C>, the pivots of symmetric elimination without row exchanges (raise ValueError on a zero
          pivot), and <C>classify_critical(H, tol=1e-9)</C>, returning &quot;minimum&quot;, &quot;maximum&quot;,
          &quot;saddle&quot; or &quot;degenerate&quot; (some |eigenvalue| ≤ tol).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ldl_pivots(S):
    return np.diag(np.asarray(S, dtype=float))

def classify_critical(H, tol=1e-9):
    return "minimum"
`,
        solution: `import numpy as np

${LDL}`,
        tests: [
          { name: "pivots", code: `assert np.allclose(ldl_pivots([[1.0, 2.0], [2.0, 1.0]]), [1.0, -3.0])
assert np.allclose(ldl_pivots([[2.0, 1.0, 1.0], [1.0, 2.0, 1.0], [1.0, 1.0, 2.0]]), [2.0, 1.5, 4 / 3])
rng = np.random.default_rng(1)
X = rng.normal(size=(5, 5)); S = X + X.T
d = ldl_pivots(S)
assert (d > 0).sum() == (np.linalg.eigvalsh(S) > 0).sum() and np.isclose(np.prod(d), np.linalg.det(S))
try:
    ldl_pivots([[0.0, 1.0], [1.0, 0.0]])
    assert False
except ValueError:
    pass` },
          { name: "classify", code: `assert [classify_critical(H) for H in (np.diag([1.0, 2.0]), np.diag([1.0, -2.0]), -np.eye(2), np.diag([1.0, 0.0]))] == ["minimum", "saddle", "maximum", "degenerate"]
assert classify_critical(np.array([[1.0, 2.0], [2.0, 1.0]])) == "saddle"` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a real symmetric S and any invertible P, the matrices S and PᵀSP have the same number of positive
          eigenvalues.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Characterises n₊(S) basis-free, as the largest dimension of a subspace W with xᵀSx > 0 for all nonzero x ∈ W (justifying it with an eigenbasis: the positive eigenvectors give such a W, and any larger W meets the span of the non-positive eigenvectors).",
          "Notes that x ↦ Px maps subspaces on which PᵀSP is positive definite to subspaces of the same dimension on which S is positive definite, and P⁻¹ does the reverse.",
          "Concludes n₊(PᵀSP) = n₊(S).",
        ],
      },
    },
    {
      key: "pivot",
      rung: "stretch",
      prompt: <p>What is the last pivot of symmetric elimination on [[2, 1, 1], [1, 2, 1], [1, 1, 2]]? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 1.3333333, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend why a bilinear form's matrix changes by PᵀSP rather than P⁻¹SP, and why the signs of its eigenvalues (its inertia) are the only basis-independent information.",

  glimpse: (
    <>
      <p>
        A bilinear form is a function of two vectors, linear in each. Allowing any number of vector arguments, and any mix
        of vectors and dual vectors, gives tensors. The next lesson builds the tensor product space V ⊗ W, in which every
        bilinear map becomes a linear one.
      </p>
      <p>
        Hessians reappear in optimisation, where their inertia distinguishes minima from saddles and their condition number,
        from the norms chapter, sets the speed of gradient descent nearby.
      </p>
    </>
  ),
};
