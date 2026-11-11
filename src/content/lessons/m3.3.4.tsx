import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LUViz } from "@/components/viz/LUViz";
import { C, Code } from "@/components/lesson/Code";
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
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [6.0, 8.0]])
l = A[1, 0] / A[0, 0]
U = A.copy()
U[1] -= l * U[0]
L = np.array([[1.0, 0.0], [l, 1.0]])
print(L[1, 0], U[1], np.allclose(L @ U, A))`}</Code>
          <p>One elimination step gives A = LU. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 [0. 5.] True", "3.0 [0. 8.] True", "0.3333333333333333 [0. 5.] True", "3.0 [0. 5.] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>lu(A)</C>, which returns (L, U) from elimination without row swaps: L lower triangular with ones on the
            diagonal holding the multipliers, U upper triangular, and LU = A.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lu(A):
    U = np.array(A, dtype=float)
    L = np.eye(len(U))
    return L, U
`,
        solution: `import numpy as np

def lu(A):
    U = np.array(A, dtype=float)
    n = len(U)
    L = np.eye(n)
    for c in range(n):
        for r in range(c + 1, n):
            L[r, c] = U[r, c] / U[c, c]
            U[r] -= L[r, c] * U[c]
    return L, U
`,
        tests: [
          { name: "lesson matrix", code: `import numpy as np
L, U = lu([[2, 1, 1], [4, -6, 0], [-2, 7, 2]])
assert np.allclose(L, [[1, 0, 0], [2, 1, 0], [-1, -1, 1]]) and np.allclose(U, [[2, 1, 1], [0, -8, -2], [0, 0, 1]]), 'Record each multiplier in L at the position it cleared.'` },
          { name: "product", code: `import numpy as np
rng = np.random.default_rng(2)
A = rng.standard_normal((5, 5)) + 5 * np.eye(5)
L, U = lu(A)
assert np.allclose(L @ U, A) and np.allclose(np.triu(U), U) and np.allclose(np.tril(L), L), 'L must be lower triangular, U upper triangular, and LU must equal A.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>plu(A)</C>, the factorisation PA = LU with partial pivoting, returning (P, L, U) where P is a permutation matrix, L unit lower triangular with all multipliers of size at most 1, and U upper triangular. Then write <C>lu_solve(P, L, U, b)</C>, which solves Ax = b by forward and back substitution (loops, not <C>np.linalg.solve</C>), and <C>det_from_lu(P, U)</C>, det A = (sign of P)·∏ uᵢᵢ.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def plu(A):
    A = np.asarray(A, float)
    n = len(A)
    return (np.eye(n), np.eye(n), A.copy())

def lu_solve(P, L, U, b):
    return np.linalg.solve(P.T @ L @ U, b)

def det_from_lu(P, U):
    return float(np.prod(np.diag(U)))
`,
        solution: `import numpy as np

def plu(A):
    U = np.asarray(A, float).copy()
    n = len(U)
    L, perm = np.eye(n), list(range(n))
    for c in range(n - 1):
        k = c + int(np.argmax(np.abs(U[c:, c])))
        if k != c:
            U[[c, k]] = U[[k, c]]
            L[[c, k], :c] = L[[k, c], :c]
            perm[c], perm[k] = perm[k], perm[c]
        if U[c, c] == 0:
            continue
        for i in range(c + 1, n):
            L[i, c] = U[i, c] / U[c, c]
            U[i] -= L[i, c] * U[c]
    P = np.eye(n)[perm]
    return (P, L, U)

def lu_solve(P, L, U, b):
    y = P @ np.asarray(b, float)
    n = len(y)
    z = np.zeros(n)
    for i in range(n):
        z[i] = y[i] - L[i, :i] @ z[:i]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (z[i] - U[i, i + 1:] @ x[i + 1:]) / U[i, i]
    return x

def det_from_lu(P, U):
    return float(round(np.linalg.det(P)) * np.prod(np.diag(U)))
`,
        tests: [
          { name: "factor", code: `import numpy as np
rng = np.random.default_rng(8)
A = rng.normal(size=(6, 6))
P, L, U = plu(A)
assert np.allclose(P @ A, L @ U) and np.allclose(np.triu(U), U) and np.allclose(np.diag(L), 1) and np.abs(L).max() <= 1 + 1e-12, 'PA = LU with multipliers at most 1.'` },
          { name: "zero pivot", code: `import numpy as np
A = np.array([[0.0, 2.0, 1.0], [1.0, 1.0, 1.0], [2.0, 1.0, 0.0]])
P, L, U = plu(A)
assert np.allclose(P @ A, L @ U), 'A zero in the corner needs a swap.'` },
          { name: "solve", code: `import numpy as np
rng = np.random.default_rng(9)
A, b = rng.normal(size=(7, 7)), rng.normal(size=7)
P, L, U = plu(A)
assert np.allclose(lu_solve(P, L, U, b), np.linalg.solve(A, b)), 'Forward then back substitution.'` },
          { name: "det", code: `import numpy as np
rng = np.random.default_rng(10)
A = rng.normal(size=(5, 5))
P, L, U = plu(A)
assert abs(det_from_lu(P, U) - np.linalg.det(A)) < 1e-10 * max(1, abs(np.linalg.det(A))), 'Each swap flips the sign.'` },
          { name: "no solve", code: `import inspect
assert 'solve' not in inspect.getsource(lu_solve).split(':', 1)[1], 'Substitute by hand.'` },
        ],
      },
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
