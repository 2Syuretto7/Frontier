import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeightedComplementViz } from "@/components/viz/WeightedComplementViz";
import type { LessonContent } from "@/lib/types";

const COMP = `import numpy as np

def complement_basis(A, tol=1e-10):
    A = np.asarray(A, dtype=float).reshape(len(A), -1)
    _, s, Vt = np.linalg.svd(A.T)
    r = int((s > tol).sum())
    return Vt[r:].T

def project(v, A, tol=1e-10):
    A = np.asarray(A, dtype=float).reshape(len(A), -1)
    Q, s, _ = np.linalg.svd(A, full_matrices=False)
    Q = Q[:, : int((s > tol).sum())]
    return Q @ (Q.T @ v)`;

const PROJ = `def proj_M(A, M):
    return A @ np.linalg.solve(A.T @ M @ A, A.T @ M)

def is_orthogonal_projection(P, M, tol=1e-9):
    MP = M @ P
    return bool(np.allclose(P @ P, P, atol=tol) and np.allclose(MP, MP.T, atol=tol))`;

export const lesson: LessonContent = {
  id: "m6.2.3",
  minutes: 50,
  links: {
    requires: ["m6.2.2"],
    revisits: ["m3.5.1", "m3.5.2"],
    foreshadows: ["m6.2.4", "m6.6.1"],
  },

  puzzle: (
    <>
      <p>
        Given a subspace U, every vector seems to split into a part in U and a part &ldquo;perpendicular&rdquo; to U. Is the
        split always possible and always unique? What if the inner product is not the dot product, so that perpendicular no
        longer looks perpendicular? And why does taking the perpendicular part twice bring you back to U?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The orthogonal complement <M>{"U^\\perp"}</M> is everything perpendicular to all of U. In finite dimensions U and{" "}
        <M>{"U^\\perp"}</M> fit together exactly: their dimensions add up to dim V and they meet only at 0, so each v is
        uniquely a piece in U plus a piece in <M>{"U^\\perp"}</M>. The piece in U is the orthogonal projection. Change the
        inner product and both the complement and the projection change, even though U does not.
      </p>
      <WeightedComplementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthogonal complement">
        <p>
          For a subset U of V, <M>{"U^\\perp = \\{v \\in V : \\langle u, v\\rangle = 0 \\text{ for all } u \\in U\\}"}</M>.
        </p>
      </Definition>
      <p>
        Straight from the definition: <M>{"U^\\perp"}</M> is a subspace (even if U is just a set);{" "}
        <M>{"\\{0\\}^\\perp = V"}</M> and <M>{"V^\\perp = \\{0\\}"}</M>; if U is a subspace then{" "}
        <M>{"U \\cap U^\\perp = \\{0\\}"}</M>, since a vector in both is orthogonal to itself; and{" "}
        <M>{"U \\subseteq W"}</M> implies <M>{"W^\\perp \\subseteq U^\\perp"}</M>.
      </p>

      <Theorem title="direct sum with the complement">
        <p>
          If U is a finite-dimensional subspace of V, then <M>{"V = U \\oplus U^\\perp"}</M>. If V is finite-dimensional,
          also <M>{"\\dim U^\\perp = \\dim V - \\dim U"}</M> and <M>{"(U^\\perp)^\\perp = U"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take an orthonormal basis <M>{"e_1, \\dots, e_m"}</M> of U. For any v put{" "}
          <M>{"u = \\sum_j \\langle v, e_j\\rangle e_j \\in U"}</M> and <M>{"w = v - u"}</M>. Then{" "}
          <M>{"\\langle w, e_k\\rangle = \\langle v, e_k\\rangle - \\langle v, e_k\\rangle = 0"}</M> for each k, so w is
          orthogonal to every combination of the <M>{"e_k"}</M>, i.e. <M>{"w \\in U^\\perp"}</M>. So{" "}
          <M>{"V = U + U^\\perp"}</M>, and the sum is direct because <M>{"U \\cap U^\\perp = \\{0\\}"}</M>.
        </p>
        <p>
          The dimension formula is the dimension of a direct sum. For the last claim,{" "}
          <M>{"U \\subseteq (U^\\perp)^\\perp"}</M> by definition, and by the dimension formula applied twice both have
          dimension dim U, so they are equal.
        </p>
      </Proof>

      <Definition title="orthogonal projection">
        <p>
          For a finite-dimensional subspace U, the orthogonal projection <M>{"P_U v"}</M> is the U-part of v in{" "}
          <M>{"V = U \\oplus U^\\perp"}</M>. With an orthonormal basis of U,{" "}
          <M>{"P_U v = \\sum_j \\langle v, e_j\\rangle e_j"}</M>.
        </p>
      </Definition>

      <Theorem title="properties of the orthogonal projection">
        <p>
          <M>{"P_U"}</M> is linear, <M>{"P_U^2 = P_U"}</M>, its range is U, its null space is <M>{"U^\\perp"}</M>,{" "}
          <M>{"v - P_U v \\in U^\\perp"}</M>, <M>{"\\|P_U v\\| \\le \\|v\\|"}</M>, and{" "}
          <M>{"\\langle P_U v, w\\rangle = \\langle v, P_U w\\rangle"}</M> for all v, w.
        </p>
      </Theorem>
      <Proof>
        <p>
          Linearity and the range and null space read off the formula. <M>{"P_U u = u"}</M> for u in U, so{" "}
          <M>{"P_U^2 = P_U"}</M>. Pythagoras on <M>{"v = P_U v + (v - P_U v)"}</M> gives{" "}
          <M>{"\\|v\\|^2 = \\|P_U v\\|^2 + \\|v - P_U v\\|^2"}</M>. Finally{" "}
          <M>{"\\langle P_U v, w\\rangle = \\langle P_U v, P_U w\\rangle"}</M>, because{" "}
          <M>{"w - P_U w \\perp U"}</M>, and by the same argument this equals <M>{"\\langle v, P_U w\\rangle"}</M>.
        </p>
      </Proof>

      <Example title="complements in ℝⁿ">
        <p>
          With the dot product, if the columns of A span U then <M>{"U^\\perp"}</M> is the null space of{" "}
          <M>{"A^\\top"}</M>: the four fundamental subspaces are two complementary pairs. The SVD of{" "}
          <M>{"A^\\top"}</M> gives orthonormal bases of both at once.
        </p>
        <Code>{COMP}</Code>
      </Example>

      <Remark title="other inner products">
        <p>
          With <M>{"\\langle x, y\\rangle_M = x^\\top M y"}</M>, the projection onto the column space of A is{" "}
          <M>{"P = A(A^\\top M A)^{-1}A^\\top M"}</M>. It is idempotent, and it is self-adjoint for{" "}
          <M>{"\\langle\\cdot,\\cdot\\rangle_M"}</M>, which in matrices says MP is symmetric, but P itself need not be. A
          projection that is idempotent but not self-adjoint for the inner product in use is an oblique projection: it splits
          V along some complement of U, not the orthogonal one.
        </p>
        <Code>{PROJ}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: <p>U is a 3-dimensional subspace of ℝ⁷ with the dot product. What is dim U⊥?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "dist",
      rung: "check",
      prompt: <p>With the dot product, U = span{"{"}(1, 1, 0){"}"}. What is the distance from v = (2, 0, 0) to U, that is ‖v − P_U v‖?</p>,
      answer: { kind: "numeric", value: 1.41421356, tolerance: 1e-4 },
    },
    {
      key: "facts",
      rung: "apply",
      prompt: <p>U is a subspace of a finite-dimensional inner product space V. Which statement is always true?</p>,
      answer: {
        kind: "choice",
        options: [
          "(U⊥)⊥ = U",
          "U ∩ U⊥ can contain a nonzero vector",
          "P_U is invertible",
          "U⊥ depends only on U, not on the inner product",
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

def complement_basis(A, tol=1e-10):
    A = np.asarray(A, dtype=float).reshape(len(A), -1)
    _, s, Vt = np.linalg.svd(A.T)
    r = int((s > tol).sum())
    return Vt[r:].T

def project(v, A, tol=1e-10):
    A = np.asarray(A, dtype=float).reshape(len(A), -1)
    Q, s, _ = np.linalg.svd(A, full_matrices=False)
    Q = Q[:, : int((s > tol).sum())]
    return Q @ (Q.T @ v)

A = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
B = complement_basis(A)
print(B.shape, np.round(np.abs(B.ravel()) * np.sqrt(3), 4))
v = np.array([3.0, 0.0, 0.0])
p = project(v, A)
print(np.round(p, 4), np.round(v - p, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 1) [1. 1. 1.]\n[ 2.  1. -1.] [ 1. -1.  1.]",
          "(3, 2) [1. 1. 1.]\n[ 2.  1. -1.] [ 1. -1.  1.]",
          "(3, 1) [1. 1. 1.]\n[ 1. -1.  1.] [ 2.  1. -1.]",
          "(3, 1) [1. 1. 1.]\n[3. 0. 0.] [0. 0. 0.]",
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

def proj_M(A, M):
    return A @ np.linalg.solve(A.T @ M @ A, A.T @ M)

def is_orthogonal_projection(P, M, tol=1e-9):
    MP = M @ P
    return bool(np.allclose(P @ P, P, atol=tol) and np.allclose(MP, MP.T, atol=tol))

M = np.diag([1.0, 4.0])
P = proj_M(np.array([[1.0], [1.0]]), M)
print(np.round(P, 4))
print(is_orthogonal_projection(P, M), is_orthogonal_projection(P, np.eye(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.2 0.8]\n [0.2 0.8]]\nTrue False",
          "[[0.5 0.5]\n [0.5 0.5]]\nTrue True",
          "[[0.2 0.8]\n [0.2 0.8]]\nTrue True",
          "[[0.2 0.2]\n [0.8 0.8]]\nFalse False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With the dot product on ℝⁿ, write <C>complement_basis(A, tol=1e-10)</C>, returning a matrix whose columns are an
          orthonormal basis of the complement of the column space of A (a 1-D array counts as one column), and{" "}
          <C>project(v, A, tol=1e-10)</C>, the orthogonal projection of v onto the column space of A. Columns of A need not
          be independent.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def complement_basis(A, tol=1e-10):
    return np.zeros((len(A), 0))

def project(v, A, tol=1e-10):
    return v
`,
        solution: COMP,
        tests: [
          { name: "complement", code: `A = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
B = complement_basis(A)
assert B.shape == (3, 1) and np.allclose(A.T @ B, 0) and np.allclose(B.T @ B, np.eye(1))
D = np.column_stack([A[:, 0], 2 * A[:, 0]])
assert complement_basis(D).shape == (3, 2)
assert complement_basis(np.array([1.0, 0.0, 0.0, 0.0])).shape == (4, 3)` },
          { name: "projection", code: `A = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 1.0]])
v = np.array([3.0, 0.0, 0.0])
p = project(v, A)
assert np.allclose(p, [2.0, 1.0, -1.0]) and np.allclose(A.T @ (v - p), 0)
D = np.column_stack([A[:, 0], 2 * A[:, 0]])
assert np.allclose(project(v, D), [1.5, 1.5, 0.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For the inner product xᵀMy, write <C>proj_M(A, M)</C>, the matrix of the orthogonal projection onto the column
          space of A (independent columns), and <C>is_orthogonal_projection(P, M, tol=1e-9)</C>, True when P² = P and MP is
          symmetric.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def proj_M(A, M):
    return A @ np.linalg.solve(A.T @ A, A.T)

def is_orthogonal_projection(P, M, tol=1e-9):
    return bool(np.allclose(P @ P, P, atol=tol))
`,
        solution: `import numpy as np

${PROJ}`,
        tests: [
          { name: "weighted", code: `M = np.diag([1.0, 4.0])
P = proj_M(np.array([[1.0], [1.0]]), M)
assert np.allclose(P, [[0.2, 0.8], [0.2, 0.8]])
v = np.array([0.3, 2.0])
assert np.isclose((v - P @ v) @ M @ np.array([1.0, 1.0]), 0)` },
          { name: "checker", code: `M = np.diag([1.0, 4.0])
P = proj_M(np.array([[1.0], [1.0]]), M)
assert is_orthogonal_projection(P, M) is True
assert is_orthogonal_projection(P, np.eye(2)) is False
assert is_orthogonal_projection(np.eye(2), M) is True
assert is_orthogonal_projection(2 * np.eye(2), np.eye(2)) is False` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if U is a finite-dimensional subspace of an inner product space V, then V = U ⊕ U⊥.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows V = U + U⊥: with an orthonormal basis e₁, …, eₘ of U, writes v = u + w with u = Σ⟨v, eⱼ⟩eⱼ, and checks ⟨w, eₖ⟩ = 0 for each k, hence w ∈ U⊥.",
          "Shows U ∩ U⊥ = {0}: a vector in both satisfies ⟨x, x⟩ = 0, so x = 0; hence the sum is direct.",
        ],
      },
    },
    {
      key: "weighted",
      rung: "stretch",
      prompt: (
        <p>
          On ℝ² with ⟨x, y⟩ = x₁y₁ + 4x₂y₂, let U = span{"{"}(1, 1){"}"}. Then U⊥ is spanned by a vector (a, 1). What is a?
        </p>
      ),
      answer: { kind: "numeric", value: -4 },
    },
  ],

  teachBack:
    "Explain to a friend what the orthogonal complement of a subspace is, why V splits as U plus its complement, and why the projection changes when the inner product does.",

  glimpse: (
    <>
      <p>
        The orthogonal projection does more than split vectors: <M>{"P_U v"}</M> is the point of U closest to v, and that
        single fact turns least squares, polynomial approximation and many regularised fits into one computation.
      </p>
      <p>
        Next comes minimisation over subspaces, including the minimum-norm solution of an underdetermined system. Later in the
        course, projections return as operators in their own right, oblique ones included, and as the building block of
        low-rank approximation.
      </p>
    </>
  ),
};
