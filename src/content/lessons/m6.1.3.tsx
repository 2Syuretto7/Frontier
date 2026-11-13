import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RankNullityViz } from "@/components/viz/RankNullityViz";
import type { LessonContent } from "@/lib/types";

const NULL = `import numpy as np

def numerical_rank(A, tol=1e-10):
    s = np.linalg.svd(A, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0] if len(s) else 0.0)))

def null_space_basis(A, tol=1e-10):
    U, s, Vt = np.linalg.svd(A)
    r = numerical_rank(A, tol)
    return Vt[r:].T`;

const SOLVE = `def range_basis(A, tol=1e-10):
    U, s, Vt = np.linalg.svd(A)
    r = int(np.sum(s > tol * max(1.0, s[0])))
    return U[:, :r]

def solution_set(A, b, tol=1e-10):
    x = np.linalg.lstsq(A, b, rcond=None)[0]
    if np.linalg.norm(A @ x - b) > tol * max(1.0, np.linalg.norm(b)):
        return None
    U, s, Vt = np.linalg.svd(A)
    r = int(np.sum(s > tol * max(1.0, s[0])))
    return x, Vt[r:].T`;

export const lesson: LessonContent = {
  id: "m6.1.3",
  minutes: 50,
  links: {
    requires: ["m6.1.2", "m3.4.2"],
    revisits: ["m3.4.5", "m3.2.3"],
    foreshadows: ["m6.1.4", "m6.4.4"],
  },

  puzzle: (
    <>
      <p>
        A layer maps 512 numbers to 128. However it is trained, some inputs must be indistinguishable to it: different
        vectors with the same output. How many dimensions of difference are lost, at least? And a map from 128 numbers to
        512 cannot reach every output. Both facts are one theorem about two subspaces that every linear map carries with it.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The null space is everything a map sends to zero, the directions it cannot see. The range is everything it can
        produce. Each dimension of the domain goes to exactly one of the two: either the map kills it or it survives as a
        dimension of the output. Count them and you always get the dimension of the domain.
      </p>
      <RankNullityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="null space and range">
        <p>
          For <M>{"T \\in \\mathcal{L}(V, W)"}</M>, <M>{"\\operatorname{null} T = \\{v \\in V : Tv = 0\\}"}</M> and{" "}
          <M>{"\\operatorname{range} T = \\{Tv : v \\in V\\}"}</M>. Both are subspaces (of V and of W): each contains 0 and is
          closed under addition and scaling by linearity.
        </p>
      </Definition>

      <Theorem title="injectivity and the null space">
        <p>T is injective if and only if <M>{"\\operatorname{null} T = \\{0\\}"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          If T is injective and Tv = 0 = T0, then v = 0. Conversely, if the null space is {"{0}"} and Tu = Tv, then T(u − v) =
          0, so u − v = 0.
        </p>
      </Proof>

      <Theorem title="fundamental theorem of linear maps">
        <p>
          If V is finite-dimensional, <M>{"\\dim V = \\dim \\operatorname{null} T + \\dim \\operatorname{range} T"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take a basis <M>{"u_1, \\dots, u_m"}</M> of null T and extend it to a basis{" "}
          <M>{"u_1, \\dots, u_m, v_1, \\dots, v_n"}</M> of V. Every <M>{"Tv"}</M> is a combination of the{" "}
          <M>{"Tu_i = 0"}</M> and the <M>{"Tv_j"}</M>, so <M>{"Tv_1, \\dots, Tv_n"}</M> span the range. They are independent:
          if <M>{"\\sum c_j Tv_j = 0"}</M> then <M>{"\\sum c_j v_j \\in \\operatorname{null} T"}</M>, so it equals some{" "}
          <M>{"\\sum d_i u_i"}</M>, and independence of the whole basis forces every <M>{"c_j = 0"}</M>. Hence dim range = n and
          dim V = m + n.
        </p>
      </Proof>

      <Example title="consequences">
        <p>
          A map to a smaller space (dim W &lt; dim V) is never injective: its null space has dimension at least dim V − dim W.
          A map to a larger space is never surjective. A homogeneous system with more unknowns than equations always has a
          nonzero solution, and the solutions of <M>{"Tx = b"}</M>, when there are any, form a particular solution plus the
          null space.
        </p>
        <Code>{SOLVE}</Code>
      </Example>

      <Remark title="rank in floating point">
        <p>
          Exact rank is unstable: a perturbation of size <M>{"10^{-14}"}</M> turns a rank-1 matrix into a rank-2 one. In
          computation, rank means the number of singular values above a tolerance, and the null space is spanned by the right
          singular vectors of the singular values below it. Chapter 4 explains why this is the right definition.
        </p>
        <Code>{NULL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "null",
      rung: "check",
      prompt: <p>A linear map from ℝ⁷ to ℝ⁴ is surjective. What is the dimension of its null space?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "layer",
      rung: "check",
      prompt: <p>A linear layer maps ℝ⁵¹² to ℝ¹²⁸. What is the smallest possible dimension of its null space?</p>,
      answer: { kind: "numeric", value: 384 },
    },
    {
      key: "inj",
      rung: "apply",
      prompt: <p>Which statement about T: ℝ³ → ℝ⁵ must be true?</p>,
      answer: {
        kind: "choice",
        options: ["T is not surjective", "T is injective", "T has a nonzero null space", "T has rank 3"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def numerical_rank(A, tol=1e-10):
    s = np.linalg.svd(A, compute_uv=False)
    return int(np.sum(s > tol * max(1.0, s[0] if len(s) else 0.0)))

def null_space_basis(A, tol=1e-10):
    U, s, Vt = np.linalg.svd(A)
    r = numerical_rank(A, tol)
    return Vt[r:].T

A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
N = null_space_basis(A)
print(numerical_rank(A), N.shape, np.allclose(A @ N, 0))
print(numerical_rank(np.array([[1.0, 1.0], [1.0, 1.0 + 1e-14]])), numerical_rank(np.zeros((2, 3))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 (3, 2) True\n1 0", "2 (3, 1) True\n2 0", "1 (3, 2) True\n2 0", "1 (2, 3) True\n1 0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def range_basis(A, tol=1e-10):
    U, s, Vt = np.linalg.svd(A)
    r = int(np.sum(s > tol * max(1.0, s[0])))
    return U[:, :r]

def solution_set(A, b, tol=1e-10):
    x = np.linalg.lstsq(A, b, rcond=None)[0]
    if np.linalg.norm(A @ x - b) > tol * max(1.0, np.linalg.norm(b)):
        return None
    U, s, Vt = np.linalg.svd(A)
    r = int(np.sum(s > tol * max(1.0, s[0])))
    return x, Vt[r:].T

A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
print(range_basis(A).shape)
sol = solution_set(A, np.array([1.0, 2.0]))
print(sol[1].shape, solution_set(A, np.array([1.0, 0.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(2, 1)\n(3, 2) None", "(2, 2)\n(3, 1) None", "(2, 1)\n(3, 2) (3, 2)", "(3, 1)\n(3, 2) None"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>numerical_rank(A, tol=1e-10)</C>, the number of singular values greater than tol · max(1, σ₁), and{" "}
          <C>null_space_basis(A, tol=1e-10)</C>, a matrix whose columns are an orthonormal basis of the null space (the right
          singular vectors beyond the rank; use the full SVD).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def numerical_rank(A, tol=1e-10):
    return np.linalg.matrix_rank(A)

def null_space_basis(A, tol=1e-10):
    return np.zeros((A.shape[1], 0))
`,
        solution: NULL,
        tests: [
          { name: "rank", code: `A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
assert numerical_rank(A) == 1 and numerical_rank(np.zeros((2, 3))) == 0
assert numerical_rank(np.array([[1.0, 1.0], [1.0, 1.0 + 1e-14]])) == 1
assert numerical_rank(np.eye(4)) == 4` },
          { name: "null space", code: `A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
N = null_space_basis(A)
assert N.shape == (3, 2) and np.allclose(A @ N, 0) and np.allclose(N.T @ N, np.eye(2))
rng = np.random.default_rng(0)
B = rng.normal(size=(4, 2)) @ rng.normal(size=(2, 6))
NB = null_space_basis(B)
assert NB.shape == (6, 4) and np.allclose(B @ NB, 0, atol=1e-9)
assert null_space_basis(np.eye(3)).shape == (3, 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>range_basis(A, tol=1e-10)</C>, an orthonormal basis of the range (left singular vectors up to the
          numerical rank), and <C>solution_set(A, b, tol=1e-10)</C>: if Ax = b has a solution, return{" "}
          <C>(x_particular, N)</C> with N a null space basis, so every solution is x_particular + N c; otherwise return None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def range_basis(A, tol=1e-10):
    return A

def solution_set(A, b, tol=1e-10):
    return np.linalg.lstsq(A, b, rcond=None)[0], None
`,
        solution: `import numpy as np

${SOLVE}`,
        tests: [
          { name: "range", code: `A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
Q = range_basis(A)
assert Q.shape == (2, 1) and np.allclose(Q.T @ Q, 1) and np.allclose(Q @ Q.T @ A, A)
assert range_basis(np.eye(3)).shape == (3, 3)` },
          { name: "solutions", code: `A = np.array([[1.0, 2.0, 3.0], [2.0, 4.0, 6.0]])
x, N = solution_set(A, np.array([1.0, 2.0]))
assert np.allclose(A @ x, [1, 2]) and N.shape == (3, 2) and np.allclose(A @ (x + N @ np.array([0.7, -2.0])), [1, 2])
assert solution_set(A, np.array([1.0, 0.0])) is None
x, N = solution_set(np.eye(2), np.array([3.0, 4.0]))
assert np.allclose(x, [3, 4]) and N.shape == (2, 0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for a linear map T on a finite-dimensional space V, dim V = dim null T + dim range T.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes a basis u₁, …, u_m of null T and extends it to a basis u₁, …, u_m, v₁, …, v_n of V.",
          "Shows Tv₁, …, Tv_n span range T, since each Tuᵢ = 0.",
          "Shows Tv₁, …, Tv_n are independent: Σcⱼvⱼ lies in null T, so it is a combination of the uᵢ, and independence of the full basis forces all cⱼ = 0. Concludes dim V = m + n.",
        ],
      },
    },
    {
      key: "even",
      rung: "stretch",
      prompt: <p>The map p ↦ p(x) − p(−x) on real polynomials of degree at most 6. What is the dimension of its range?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what the null space and range of a linear map are, why their dimensions add up to the dimension of the domain, and what that says about layers that shrink or grow.",

  glimpse: (
    <p>
      The null space suggests a construction: treat vectors that differ by a null vector as the same. Next: quotient spaces,
      and the dual space of linear functionals that underlies gradients.
    </p>
  ),
};
