import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LUViz } from "@/components/viz/LUViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.3.4",
  minutes: 60,
  links: {
    requires: ["m3.3.3", "m3.2.1"],
    foreshadows: ["m11.3.1", "m11.3.2"],
  },

  puzzle: (
    <>
      <p>
        A simulation solves Ax = b with the same 1000 × 1000 matrix A but a new right-hand side b every second, for an hour.
        Elimination costs about <M>{"n^3/3 \\approx 3.3 \\times 10^8"}</M> operations each time.
      </p>
      <p>
        Almost all that work is spent on A, which never changes. Can you do it once, keep the result, and reuse it for every
        new b?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Elimination turns A into an upper triangular U. Along the way it uses multipliers <M>{"\\ell_{ij}"}</M>. If you write
        the multipliers down in a lower triangular matrix L, nothing is lost: A = LU. Step through the elimination below and
        watch L fill up while A turns into U.
      </p>
      <LUViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="A = LU">
        <p>
          If elimination on a square matrix A needs no row swaps, then A = LU, where U is the upper triangular result of
          elimination and L is lower triangular with ones on the diagonal and the multiplier <M>{"\\ell_{ij}"}</M> in position
          (i, j) below the diagonal.
        </p>
      </Theorem>
      <Proof>
        <p>
          Row i of U is row i of A minus the multiples <M>{"\\ell_{ij}"}</M> of the earlier rows of U that elimination
          subtracted. Rearranged: row i of A = <M>{"\\sum_{j < i} \\ell_{ij}"}</M> (row j of U) + (row i of U). That says row i of
          A is row i of L times U, which is A = LU.
        </p>
      </Proof>

      <Example title="the matrix in the visualisation">
        <MD>{"\\begin{bmatrix} 2 & 1 & 1 \\\\ 4 & -6 & 0 \\\\ -2 & 7 & 2 \\end{bmatrix} = \\begin{bmatrix} 1 & 0 & 0 \\\\ 2 & 1 & 0 \\\\ -1 & -1 & 1 \\end{bmatrix}\\begin{bmatrix} 2 & 1 & 1 \\\\ 0 & -8 & -2 \\\\ 0 & 0 & 1 \\end{bmatrix}."}</MD>
      </Example>

      <Definition title="solving with LU">
        <p>
          To solve Ax = LUx = b, set c = Ux and solve two triangular systems: Lc = b by forward substitution, then Ux = c by
          back substitution. Each costs about <M>{"n^2/2"}</M> operations.
        </p>
      </Definition>

      <Example title="the puzzle">
        <p>
          Factor once for <M>{"3.3 \\times 10^8"}</M> operations, then each of the 3600 right-hand sides costs about{" "}
          <M>{"n^2 = 10^6"}</M>. The hour costs about <M>{"3.9 \\times 10^9"}</M> operations instead of{" "}
          <M>{"1.2 \\times 10^{12}"}</M>, roughly three hundred times less.
        </p>
      </Example>

      <Theorem title="row swaps: PA = LU">
        <p>
          If a zero pivot forces a row swap, put all the swaps first: there is a permutation matrix P with PA = LU. Every
          invertible matrix has such a factorisation.
        </p>
      </Theorem>

      <Remark title="pivoting in practice">
        <p>
          Library routines swap rows even when the pivot is merely small, choosing the largest available entry in the column.
          Dividing by a tiny pivot creates huge multipliers that magnify rounding errors. Numerical Linear Algebra and Scientific
          Computing analyses why partial pivoting is almost always enough.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "what",
      rung: "check",
      prompt: <p>In A = LU from elimination without row swaps, what does L contain?</p>,
      answer: {
        kind: "choice",
        options: ["Ones on the diagonal and the multipliers below it", "The pivots on the diagonal", "The inverse of U", "The rows of A in a new order"],
        correct: [0],
      },
    },
    {
      key: "mult",
      rung: "check",
      prompt: <p>For A with rows (2, 1) and (6, 8), find the multiplier <M>{"\\ell_{21}"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "u22",
      rung: "apply",
      prompt: <p>For the same A, with rows (2, 1) and (6, 8), find the entry <M>{"u_{22}"}</M> of U.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "l32",
      rung: "apply",
      prompt: <p>Find the LU factorisation of the matrix with rows (1, 1, 1), (2, 3, 3) and (1, 3, 5). Give <M>{"\\ell_{32}"}</M>.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>A has rows (1, 2) and (3, 8). Use A = LU to solve Ax = (5, 19). Give the first entry of x.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0, 1.0], [4.0, -6.0, 0.0], [-2.0, 7.0, 2.0]])
U = A.copy()
L = np.eye(3)
for c in range(3):
    for r in range(c + 1, 3):
        L[r, c] = U[r, c] / U[c, c]
        U[r] -= L[r, c] * U[c]
print(L[2, 1], U[1, 1])`}</Code>
          <p>This prints two numbers. What is their product?</p>
        </>
      ),
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "lower",
      rung: "prove",
      prompt: (
        <p>
          Prove that the product of two lower triangular n × n matrices is lower triangular, and that its diagonal entries are
          the products of the corresponding diagonal entries.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes (LM)_ij = Σ_k l_ik m_kj and notes l_ik = 0 for k > i and m_kj = 0 for k < j.",
          "Concludes that a term can be non-zero only when j ≤ k ≤ i, so the entry is 0 when i < j.",
          "For i = j, the only surviving term is k = i, giving l_ii m_ii.",
        ],
      },
    },
    {
      key: "break",
      rung: "stretch",
      prompt: <p>For which positive value of a does elimination on the matrix with rows (1, a) and (a, 1) meet a zero pivot?</p>,
      answer: { kind: "numeric", value: 1 },
    },
  ],

  teachBack:
    "Explain to a friend how elimination produces A = LU, why storing the multipliers loses nothing, and why factoring once saves so much work when many right-hand sides share one matrix.",

  glimpse: (
    <p>
      Next, transposes and permutation matrices, which reorder rows and swap rows with columns. Numerical Linear Algebra and
      Scientific Computing develops LU with pivoting and its cousin for symmetric positive definite matrices, the Cholesky
      factorisation.
    </p>
  ),
};
