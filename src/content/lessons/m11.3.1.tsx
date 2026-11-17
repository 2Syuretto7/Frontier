import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GrowthFactorViz } from "@/components/viz/GrowthFactorViz";
import type { LessonContent } from "@/lib/types";

const LU = `import numpy as np

def lu_partial(A):
    U = A.astype(float).copy()
    n = U.shape[0]
    L, perm = np.eye(n), np.arange(n)
    for k in range(n - 1):
        p = k + int(np.argmax(np.abs(U[k:, k])))
        U[[k, p], k:] = U[[p, k], k:]
        L[[k, p], :k] = L[[p, k], :k]
        perm[[k, p]] = perm[[p, k]]
        for i in range(k + 1, n):
            L[i, k] = U[i, k] / U[k, k]
            U[i, k:] -= L[i, k] * U[k, k:]
    return perm, L, U

def solve_lu(perm, L, U, b):
    y = b[perm].astype(float)
    for i in range(len(y)):
        y[i] -= L[i, :i] @ y[:i]
    for i in range(len(y) - 1, -1, -1):
        y[i] = (y[i] - U[i, i + 1:] @ y[i + 1:]) / U[i, i]
    return y`;

const GROW = `import numpy as np

def wilkinson(n):
    A = np.eye(n) - np.tril(np.ones((n, n)), -1)
    A[:, -1] = 1.0
    return A

def ge_growth(A):
    U = A.astype(float).copy()
    big = np.abs(U).max()
    for k in range(U.shape[0] - 1):
        p = k + int(np.argmax(np.abs(U[k:, k])))
        U[[k, p]] = U[[p, k]]
        U[k + 1:, k:] -= np.outer(U[k + 1:, k] / U[k, k], U[k, k:])
        big = max(big, np.abs(U).max())
    return float(big / np.abs(A).max())`;

export const lesson: LessonContent = {
  id: "m11.3.1",
  minutes: 50,
  links: {
    requires: ["m11.2.2", "m3.3.4"],
    revisits: ["m3.2.1", "m3.3.5"],
    foreshadows: ["m11.3.2"],
  },

  puzzle: (
    <>
      <p>
        Gaussian elimination with partial pivoting is the algorithm behind every general linear solver, and in decades of
        use it has essentially never failed on a real problem. Yet there is a 60 × 60 matrix, made only of 1s, −1s and 0s,
        with condition number about 27, on which it returns an answer with no correct digits. How can an algorithm with a
        catastrophic worst case be the one everyone trusts?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The previous chapter showed that a tiny pivot makes elimination unstable: the multiplier is huge, and adding a huge
        multiple of one row to another swamps the information in it. Partial pivoting swaps rows so the pivot is the largest
        entry in its column, which keeps every multiplier at most 1 in size. The remaining danger is that entries can still
        grow as elimination proceeds, at most doubling each step. The backward error is proportional to this growth. On
        matrices met in practice, growth stays tiny; the exponential case exists, but has to be built on purpose.
      </p>
      <GrowthFactorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="LU with partial pivoting">
        <p>
          At step k, choose the row p ≥ k whose entry in column k is largest in absolute value, swap rows k and p, and
          subtract <M>{"l_{ik} = a^{(k)}_{ik}/a^{(k)}_{kk}"}</M> times row k from each row i &gt; k. The result is
        </p>
        <MD>{"PA = LU,"}</MD>
        <p>
          with P a permutation matrix, L unit lower triangular with <M>{"|l_{ik}| \\leq 1"}</M>, and U upper triangular. It
          costs about <M>{"\\tfrac{2}{3}n^3"}</M> flops; each later solve costs about <M>{"2n^2"}</M> by forward and back
          substitution, <M>{"Ly = Pb"}</M> then <M>{"Ux = y"}</M>.
        </p>
      </Definition>

      <Theorem title="existence">
        <p>Every invertible A has a factorisation PA = LU produced by partial pivoting.</p>
      </Theorem>
      <Proof>
        <p>
          Elimination steps and row swaps are invertible, so each partially reduced matrix is invertible. At step k its
          first k − 1 columns are zero below the diagonal; if column k were zero on and below the diagonal too, the first k
          columns would lie in a (k − 1)-dimensional space, contradicting invertibility. So the pivot is nonzero. Tracking the
          swaps, the multipliers line up into L once the rows of earlier columns are swapped along with the rest, which is
          what the code does to L.
        </p>
        <Code>{LU}</Code>
      </Proof>

      <Definition title="growth factor">
        <p>With <M>{"a^{(k)}_{ij}"}</M> the entries after k − 1 elimination steps,</p>
        <MD>{"\\rho_n = \\frac{\\max_{i,j,k} |a^{(k)}_{ij}|}{\\max_{i,j} |a_{ij}|}."}</MD>
      </Definition>

      <Theorem title="backward error of elimination (Wilkinson)">
        <p>
          The computed solution <M>{"\\hat x"}</M> of Ax = b by LU with partial pivoting satisfies{" "}
          <M>{"(A + \\Delta A)\\hat x = b"}</M> with{" "}
          <M>{"\\|\\Delta A\\|_\\infty \\leq c\\,n^3 u\\,\\rho_n \\|A\\|_\\infty"}</M> for a modest constant c, and{" "}
          <M>{"\\rho_n \\leq 2^{n-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The rounding analysis, like the dot-product one, shows that the computed factors satisfy{" "}
          <M>{"\\hat L\\hat U = PA + E"}</M> with <M>{"|E| \\leq \\gamma_n|\\hat L||\\hat U|"}</M> entrywise, and the
          triangular solves add similar terms. Since <M>{"|l_{ij}| \\leq 1"}</M> and every entry of U is an intermediate
          entry, bounded by <M>{"\\rho_n\\max|a_{ij}|"}</M>, this gives the stated bound. For the growth bound: since every
          multiplier has <M>{"|l_{ik}| \\leq 1"}</M>,{" "}
          <M>{"|a^{(k+1)}_{ij}| = |a^{(k)}_{ij} - l_{ik}a^{(k)}_{kj}| \\leq 2\\max|a^{(k)}|"}</M>, so the maximum at most
          doubles at each of the n − 1 steps.
        </p>
      </Proof>

      <Remark title="worst case and typical case">
        <p>
          Wilkinson&apos;s matrix (1 on the diagonal, −1 below it, 1 in the last column) has ties at every pivot, so no rows
          are swapped, and the last column doubles each step: <M>{"\\rho_n = 2^{n-1}"}</M>, giving 4, 16 and 512 for n = 3,
          5 and 10 in the code. At n = 60, NumPy&apos;s solver (LAPACK, also partial pivoting) returns a solution with an
          entry off by 1.0 although κ ≈ 26.8. For a random 60 × 60 Gaussian matrix the growth is 3.2. Large growth is known
          to occur only on very special structures; complete pivoting (choose the largest entry in the whole remaining
          block) has a far smaller worst case but costs <M>{"O(n^3)"}</M> comparisons, so it is rarely used. Practical rule:
          factor once with partial pivoting, reuse the factors for every right-hand side, and never form <M>{"A^{-1}"}</M>{" "}
          to solve a system.
        </p>
        <Code>{GROW}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flops",
      rung: "check",
      prompt: <p>About how many billion flops does LU factorisation of a 3000 × 3000 matrix take, using (2/3)n³?</p>,
      answer: { kind: "numeric", value: 18, tolerance: 0.01 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>What is the upper bound 2ⁿ⁻¹ on the growth factor of partial pivoting for n = 11?</p>,
      answer: { kind: "numeric", value: 1024, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What does choosing the largest entry in the column as pivot guarantee?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every multiplier has absolute value at most 1, so each step at most doubles the largest entry",
          "The factorisation is computed exactly",
          "The growth factor is at most n",
          "The condition number of U is no larger than that of A",
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

def lu_partial(A):
    U = A.astype(float).copy()
    n = U.shape[0]
    L, perm = np.eye(n), np.arange(n)
    for k in range(n - 1):
        p = k + int(np.argmax(np.abs(U[k:, k])))
        U[[k, p], k:] = U[[p, k], k:]
        L[[k, p], :k] = L[[p, k], :k]
        perm[[k, p]] = perm[[p, k]]
        for i in range(k + 1, n):
            L[i, k] = U[i, k] / U[k, k]
            U[i, k:] -= L[i, k] * U[k, k:]
    return perm, L, U

def solve_lu(perm, L, U, b):
    y = b[perm].astype(float)
    for i in range(len(y)):
        y[i] -= L[i, :i] @ y[:i]
    for i in range(len(y) - 1, -1, -1):
        y[i] = (y[i] - U[i, i + 1:] @ y[i + 1:]) / U[i, i]
    return y

A = np.array([[1.0, 2.0, 0.0], [4.0, 1.0, 1.0], [2.0, 6.0, 2.0]])
perm, L, U = lu_partial(A)
print(perm, np.allclose(A[perm], L @ U), float(np.abs(L).max()))
print(np.round(solve_lu(perm, L, U, A @ np.array([1.0, -1.0, 2.0])), 6) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1 2 0] True 1.0\n[ 1. -1.  2.]", "[1 0 2] True 1.0\n[ 1. -1.  2.]", "[1 2 0] True 0.5\n[ 1. -1.  2.]", "[0 1 2] True 1.0\n[ 1. -1.  2.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def wilkinson(n):
    A = np.eye(n) - np.tril(np.ones((n, n)), -1)
    A[:, -1] = 1.0
    return A

def ge_growth(A):
    U = A.astype(float).copy()
    big = np.abs(U).max()
    for k in range(U.shape[0] - 1):
        p = k + int(np.argmax(np.abs(U[k:, k])))
        U[[k, p]] = U[[p, k]]
        U[k + 1:, k:] -= np.outer(U[k + 1:, k] / U[k, k], U[k, k:])
        big = max(big, np.abs(U).max())
    return float(big / np.abs(A).max())

print([round(ge_growth(wilkinson(n))) for n in [3, 5, 10]])
x = np.ones(60)
err = np.abs(np.linalg.solve(wilkinson(60), wilkinson(60) @ x) - x).max()
G = np.random.default_rng(0).normal(size=(60, 60))
print(round(float(err), 3), round(float(np.linalg.cond(wilkinson(60))), 1), round(ge_growth(G), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[4, 16, 512]\n1.0 26.8 3.2", "[4, 16, 512]\n0.0 26.8 3.2", "[3, 5, 10]\n1.0 26.8 3.2", "[4, 16, 512]\n1.0 26.8 512.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lu_partial(A)</C>, returning (perm, L, U) with A[perm] = LU, L unit lower triangular and U upper
          triangular, using partial pivoting; and <C>solve_lu(perm, L, U, b)</C> by forward then back substitution.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lu_partial(A):
    n = A.shape[0]
    return np.arange(n), np.eye(n), A.astype(float)

def solve_lu(perm, L, U, b):
    return b.astype(float)
`,
        solution: LU,
        tests: [
          { name: "factor", code: `A = np.random.default_rng(8).normal(size=(6, 6))
perm, L, U = lu_partial(A)
assert np.allclose(A[perm], L @ U) and np.allclose(L, np.tril(L)) and np.allclose(np.diag(L), 1) and np.allclose(U, np.triu(U)) and np.abs(L).max() <= 1 + 1e-12
assert sorted(perm.tolist()) == list(range(6))` },
          { name: "solve", code: `A = np.array([[1e-20, 1.0], [1.0, 1.0]]); b = np.array([1.0, 2.0])
assert np.allclose(solve_lu(*lu_partial(A), b), [1.0, 1.0])
A = np.random.default_rng(9).normal(size=(5, 5)); x = np.arange(5.0)
assert np.allclose(solve_lu(*lu_partial(A), A @ x), x)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wilkinson(n)</C> (1 on the diagonal, −1 below it, 1 in the last column, 0 elsewhere) and{" "}
          <C>ge_growth(A)</C>, which runs elimination with partial pivoting and returns the largest absolute entry seen at any
          stage divided by the largest absolute entry of A.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def wilkinson(n):
    return np.eye(n)

def ge_growth(A):
    return 1.0
`,
        solution: GROW,
        tests: [
          { name: "wilk", code: `assert np.array_equal(wilkinson(3), np.array([[1.0, 0.0, 1.0], [-1.0, 1.0, 1.0], [-1.0, -1.0, 1.0]]))
assert abs(ge_growth(wilkinson(8)) - 128.0) < 1e-9` },
          { name: "growth", code: `assert abs(ge_growth(np.eye(4)) - 1.0) < 1e-12 and abs(ge_growth(np.array([[1e-20, 1.0], [1.0, 1.0]])) - 1.0) < 1e-12
assert abs(ge_growth(np.array([[1.0, 1.0], [-1.0, 1.0]])) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that Gaussian elimination with partial pivoting on an n × n invertible matrix has growth factor at most
          2ⁿ⁻¹.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the pivot is the largest entry in absolute value in its column, so every multiplier satisfies |l_ik| ≤ 1.",
          "Shows from the update a_ij ← a_ij − l_ik a_kj that the largest absolute entry at most doubles in one step.",
          "Concludes, since there are n − 1 elimination steps, that every intermediate entry is at most 2ⁿ⁻¹ max|a_ij|.",
        ],
      },
    },
    {
      key: "w3",
      rung: "stretch",
      prompt: (
        <p>
          With ties keeping the current row, what is the growth factor of partial pivoting on the matrix with rows (1, 0, 1),
          (−1, 1, 1), (−1, −1, 1)?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what partial pivoting does, why it bounds the multipliers, how the growth factor controls the backward error, and why the 2ⁿ⁻¹ worst case does not stop everyone from relying on it.",

  glimpse: (
    <>
      <p>
        When the matrix is symmetric positive definite, as covariance matrices and Hessians at a minimum are, elimination
        needs no pivoting at all and half the work. The next lesson derives that factorisation, Cholesky, and shows why its
        growth factor is exactly 1.
      </p>
    </>
  ),
};
