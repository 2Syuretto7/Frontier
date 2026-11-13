import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ObliqueProjViz } from "@/components/viz/ObliqueProjViz";
import type { LessonContent } from "@/lib/types";

const PROJ = `import numpy as np

def oblique_proj(A, B):
    return A @ np.linalg.solve(B.T @ A, B.T)

def is_orthogonal_projection(P, tol=1e-9):
    return bool(np.allclose(P @ P, P, atol=tol) and np.allclose(P, P.T, atol=tol))`;

const NULLP = `def nullspace_projector(A):
    return np.eye(A.shape[1]) - A.T @ np.linalg.solve(A @ A.T, A)

def projected_gradient_step(x, g, A, lr):
    return x - lr * nullspace_projector(A) @ g`;

export const lesson: LessonContent = {
  id: "m6.6.1",
  minutes: 50,
  links: {
    requires: ["m6.2.3", "m6.1.3"],
    revisits: ["m3.5.2", "m6.2.4"],
    foreshadows: ["m6.6.4"],
  },

  puzzle: (
    <>
      <p>
        Orthogonal projection is one kind of projection. There are others, splitting a vector along a direction that is not
        perpendicular, and they show up in Krylov solvers, instrumental-variable regression and in projecting gradients onto
        constraints. What exactly is a projection, how do you tell an orthogonal one from an oblique one, and what goes wrong
        with oblique ones?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A projection is any linear map that, applied twice, does nothing new: P² = P. It picks a target subspace (its range)
        and a direction to slide along (its null space), and every vector slides along that direction until it hits the
        target. Sliding perpendicularly gives the orthogonal projection, which never lengthens a vector. Sliding at a shallow
        angle can lengthen vectors enormously.
      </p>
      <ObliqueProjViz />
    </>
  ),

  theory: (
    <>
      <Definition title="projection">
        <p>
          An operator P on V is a projection if <M>{"P^2 = P"}</M>. Then <M>{"I - P"}</M> is also a projection, since{" "}
          <M>{"(I - P)^2 = I - 2P + P^2 = I - P"}</M>.
        </p>
      </Definition>

      <Theorem title="projections and direct sums">
        <p>
          If P is a projection then <M>{"V = \\operatorname{range}P \\oplus \\operatorname{null}P"}</M>, P acts as the
          identity on its range, and <M>{"\\operatorname{range}(I - P) = \\operatorname{null}P"}</M>. Conversely, for any
          decomposition <M>{"V = U \\oplus W"}</M> there is exactly one projection with range U and null space W (the
          projection onto U along W).
        </p>
      </Theorem>
      <Proof>
        <p>
          Every v is <M>{"Pv + (v - Pv)"}</M>, with <M>{"Pv \\in \\operatorname{range}P"}</M> and{" "}
          <M>{"P(v - Pv) = Pv - P^2v = 0"}</M>. If v is in both, then v = Pu for some u and Pv = 0, so{" "}
          <M>{"v = Pu = P^2u = Pv = 0"}</M>. If v = Pu then <M>{"Pv = P^2u = Pu = v"}</M>. Conversely, each v is uniquely u +
          w with u ∈ U, w ∈ W; setting Pv = u gives a linear map with <M>{"P^2 = P"}</M>, range U and null space W, and any
          projection with that range and null space must do exactly this.
        </p>
      </Proof>
      <p>
        So the eigenvalues of a projection are 0 and 1, it is diagonalisable (take a basis of the range followed by one of
        the null space), and its trace equals its rank.
      </p>

      <Theorem title="when a projection is orthogonal">
        <p>
          For a projection P ≠ 0 on an inner product space, the following are equivalent: null P is orthogonal to range P;{" "}
          <M>{"P = P^*"}</M>; <M>{"\\|P\\|_2 = 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the null space is the orthogonal complement of the range, P is the orthogonal projection, which is
          self-adjoint (Orthogonal complements lesson). If <M>{"P = P^*"}</M>, then{" "}
          <M>{"\\operatorname{null}P = \\operatorname{null}P^* = (\\operatorname{range}P)^\\perp"}</M>, and Pythagoras on{" "}
          <M>{"v = Pv + (v - Pv)"}</M> gives <M>{"\\|Pv\\| \\le \\|v\\|"}</M>, with equality on the range. Finally suppose{" "}
          <M>{"\\|P\\| \\le 1"}</M>, and take u in the range and w in the null space. For every real t,{" "}
          <M>{"\\|u\\| = \\|P(u + tw)\\| \\le \\|u + tw\\|"}</M>, so{" "}
          <M>{"0 \\le 2t\\operatorname{Re}\\langle u, w\\rangle + t^2\\|w\\|^2"}</M> for all t, which forces{" "}
          <M>{"\\operatorname{Re}\\langle u, w\\rangle = 0"}</M>; replacing w by iw over ℂ gives{" "}
          <M>{"\\langle u, w\\rangle = 0"}</M>.
        </p>
      </Proof>

      <Example title="matrix formulas">
        <p>
          If the columns of A (n×k) span U and the columns of B (n×k) satisfy{" "}
          <M>{"\\operatorname{null}B^\\top = W"}</M>, with <M>{"B^\\top A"}</M> invertible, the projection onto U along W
          is <M>{"P = A(B^\\top A)^{-1}B^\\top"}</M>: indeed <M>{"P^2 = A(B^\\top A)^{-1}(B^\\top A)(B^\\top A)^{-1}B^\\top = P"}</M>,
          PA = A, and Pv = 0 when <M>{"B^\\top v = 0"}</M>. With B = A this is the familiar orthogonal projection{" "}
          <M>{"A(A^\\top A)^{-1}A^\\top"}</M>.
        </p>
        <Code>{PROJ}</Code>
      </Example>

      <Remark title="projecting gradients onto constraints">
        <p>
          To minimise a loss subject to linear constraints Cx = d, start from a feasible x and move only within null C. The
          orthogonal projection onto null C is <M>{"I - C^\\top(CC^\\top)^{-1}C"}</M>, and replacing the gradient by its
          projection gives the steepest descent direction that keeps every constraint satisfied. Continual-learning methods
          use the same idea, projecting new gradients away from directions important for earlier tasks.
        </p>
        <Code>{NULLP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "trace",
      rung: "check",
      prompt: <p>P is a projection on ℝ⁵ of rank 3. What is its trace?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>P projects ℝ² onto the x-axis along the line y = x. What is ‖P‖₂? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 1.4142136, tolerance: 1e-4 },
    },
    {
      key: "orth",
      rung: "apply",
      prompt: <p>P is a real projection matrix (P² = P). Which extra condition makes it an orthogonal projection?</p>,
      answer: { kind: "choice", options: ["P = Pᵀ", "its eigenvalues are 0 and 1", "trace P = rank P", "P is diagonalisable"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def oblique_proj(A, B):
    return A @ np.linalg.solve(B.T @ A, B.T)

def is_orthogonal_projection(P, tol=1e-9):
    return bool(np.allclose(P @ P, P, atol=tol) and np.allclose(P, P.T, atol=tol))

A = np.array([[1.0], [0.0]])
B = np.array([[1.0], [1.0]])
P = oblique_proj(A, B)
print(P, is_orthogonal_projection(P), round(np.linalg.norm(P, 2), 4))
print(int(round(np.trace(P))), is_orthogonal_projection(oblique_proj(A, A)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1. 1.]\n [0. 0.]] False 1.4142\n1 True",
          "[[1. 0.]\n [0. 0.]] True 1.0\n1 True",
          "[[1. 1.]\n [0. 0.]] True 1.4142\n1 True",
          "[[1. 1.]\n [0. 0.]] False 1.4142\n2 True",
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

def nullspace_projector(A):
    return np.eye(A.shape[1]) - A.T @ np.linalg.solve(A @ A.T, A)

def projected_gradient_step(x, g, A, lr):
    return x - lr * nullspace_projector(A) @ g

C = np.array([[1.0, 1.0, 1.0]])
print(np.round(3 * nullspace_projector(C), 4))
x2 = projected_gradient_step(np.array([1.0, 0.0, 0.0]), np.array([3.0, 0.0, 0.0]), C, 0.1)
print(np.round(x2, 4), round(float((C @ x2)[0]), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[ 2. -1. -1.]\n [-1.  2. -1.]\n [-1. -1.  2.]]\n[0.8 0.1 0.1] 1.0",
          "[[ 2. -1. -1.]\n [-1.  2. -1.]\n [-1. -1.  2.]]\n[0.7 0.  0. ] 0.7",
          "[[1. 1. 1.]\n [1. 1. 1.]\n [1. 1. 1.]]\n[0.8 0.1 0.1] 1.0",
          "[[ 2. -1. -1.]\n [-1.  2. -1.]\n [-1. -1.  2.]]\n[0.8 0.1 0.1] 0.8",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>oblique_proj(A, B)</C>, the projection A(BᵀA)⁻¹Bᵀ onto the column space of A along the null space of Bᵀ,
          and <C>is_orthogonal_projection(P, tol=1e-9)</C>, True when P² = P and P = Pᵀ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def oblique_proj(A, B):
    return A @ np.linalg.solve(A.T @ A, A.T)

def is_orthogonal_projection(P, tol=1e-9):
    return bool(np.allclose(P @ P, P, atol=tol))
`,
        solution: PROJ,
        tests: [
          { name: "oblique", code: `rng = np.random.default_rng(0)
A, B = rng.normal(size=(5, 2)), rng.normal(size=(5, 2))
P = oblique_proj(A, B)
assert np.allclose(P @ P, P) and np.allclose(P @ A, A)
v = rng.normal(size=5); v = v - B @ np.linalg.lstsq(B, v, rcond=None)[0]
assert np.allclose(B.T @ v, 0) and np.allclose(P @ v, 0)
assert np.allclose(oblique_proj(np.array([[1.0], [0.0]]), np.array([[1.0], [2.0]])), [[1.0, 2.0], [0.0, 0.0]])` },
          { name: "orthogonal", code: `A = np.random.default_rng(1).normal(size=(4, 2))
assert is_orthogonal_projection(oblique_proj(A, A)) is True
assert is_orthogonal_projection(np.array([[1.0, 1.0], [0.0, 0.0]])) is False
assert is_orthogonal_projection(np.eye(3)) is True and is_orthogonal_projection(2 * np.eye(2)) is False` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nullspace_projector(A)</C>, the orthogonal projection onto null A for A with independent rows, and{" "}
          <C>projected_gradient_step(x, g, A, lr)</C>, the step x − lr·Pg with P that projector.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nullspace_projector(A):
    return np.eye(A.shape[1])

def projected_gradient_step(x, g, A, lr):
    return x - lr * g
`,
        solution: `import numpy as np

${NULLP}`,
        tests: [
          { name: "projector", code: `rng = np.random.default_rng(2)
A = rng.normal(size=(2, 5))
N = nullspace_projector(A)
assert np.allclose(N @ N, N) and np.allclose(N, N.T) and np.allclose(A @ N, 0)
assert np.isclose(np.trace(N), 3)` },
          { name: "feasible", code: `rng = np.random.default_rng(3)
A = rng.normal(size=(2, 4)); x = rng.normal(size=4); d = A @ x
for _ in range(5):
    x = projected_gradient_step(x, rng.normal(size=4), A, 0.3)
assert np.allclose(A @ x, d)
x2 = projected_gradient_step(np.array([1.0, 0.0, 0.0]), np.array([3.0, 0.0, 0.0]), np.ones((1, 3)), 0.1)
assert np.allclose(x2, [0.8, 0.1, 0.1])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if P² = P, then V = range P ⊕ null P.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows V = range P + null P by writing v = Pv + (v − Pv) and checking P(v − Pv) = 0.",
          "Shows range P ∩ null P = {0}: if v = Pu and Pv = 0 then v = Pu = P²u = Pv = 0.",
        ],
      },
    },
    {
      key: "slanted",
      rung: "stretch",
      prompt: <p>P = A(BᵀA)⁻¹Bᵀ with A = (1, 0)ᵀ and B = (1, 2)ᵀ. What is ‖P‖₂? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.2360680, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a linear map a projection, how it corresponds to a direct sum, and why only orthogonal projections have norm 1.",

  glimpse: (
    <>
      <p>
        Next come matrices that preserve lengths, the orthogonal and unitary matrices: Householder reflections are{" "}
        <M>{"I - 2P"}</M> for a rank-one orthogonal projection P, and Givens rotations act on two coordinates at a time.
      </p>
      <p>
        Projections also return in the low-rank plus diagonal lesson, where the Woodbury identity inverts a matrix of the
        form D + UVᵀ by working in the small subspace spanned by U.
      </p>
    </>
  ),
};
