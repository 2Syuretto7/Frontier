import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ElimViz } from "@/components/viz/ElimViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.2.1",
  minutes: 65,
  links: {
    requires: ["m3.1.1", "m0.2.3"],
    revisits: ["m0.2.2"],
    foreshadows: ["m3.3.4", "m11.3.1", "m11.2.1"],
  },

  puzzle: (
    <>
      <p>
        Three unknowns u, v and w satisfy three equations:
      </p>
      <MD>{"2u + v + w = 5, \\qquad 4u - 6v = -2, \\qquad -2u + 7v + 2w = 9."}</MD>
      <p>
        You could guess and check. A computer facing a million equations in a million unknowns cannot. Is there a procedure that always works,
        and how much work does it take?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The idea is to remove unknowns one at a time. Use the first equation to eliminate u from the others; then use the new
        second equation to eliminate v from the third. What remains is a triangle: the last equation has one unknown, the one
        above it two, and so on, and you solve from the bottom up. Step through it below.
      </p>
      <ElimViz />
    </>
  ),

  theory: (
    <>
      <Definition title="elementary row operations">
        <p>On the augmented matrix [A | b] of a system Ax = b, the elementary row operations are:</p>
        <ul>
          <li>subtract a multiple of one row from another;</li>
          <li>swap two rows;</li>
          <li>multiply a row by a non-zero number.</li>
        </ul>
        <p>None of them changes the set of solutions, because each can be undone by another row operation.</p>
      </Definition>

      <Definition title="Gaussian elimination">
        <p>
          For each column in turn, the entry on the diagonal is the <strong>pivot</strong>. For each row below it, subtract{" "}
          <M>{"\\ell_{ij} = (\\text{entry to clear}) / (\\text{pivot})"}</M> times the pivot row, which makes the entry
          zero. If the pivot is zero, swap in a row from below with a non-zero entry in that column. The result is an upper
          triangular system Ux = c, solved by <strong>back substitution</strong>.
        </p>
      </Definition>

      <Example title="the puzzle">
        <p>
          Subtract 2 × row 1 from row 2 and −1 × row 1 from row 3, then −1 × the new row 2 from row 3. The triangular system is
        </p>
        <MD>{"2u + v + w = 5, \\qquad -8v - 2w = -12, \\qquad w = 2."}</MD>
        <p>So w = 2, then v = (−12 + 4)/(−8) = 1, then u = (5 − 1 − 2)/2 = 1. The pivots are 2, −8 and 1.</p>
      </Example>

      <Theorem title="when elimination succeeds">
        <p>
          For a square matrix A, elimination with row swaps produces n non-zero pivots exactly when Ax = b has exactly one
          solution for every b. If it reaches a column where the pivot and every entry below it are zero, the matrix is{" "}
          <strong>singular</strong>: the system has either no solution or infinitely many.
        </p>
      </Theorem>

      <Theorem title="the cost">
        <p>
          Eliminating an n × n system takes about <M>{"n^3/3"}</M> multiply-subtract operations, and back substitution about{" "}
          <M>{"n^2/2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Clearing column k changes n − k rows below the pivot, each in n − k entries to the right of it, so the total is{" "}
          <M>{"\\sum_{j=1}^{n-1} j^2 = (n-1)n(2n-1)/6 \\approx n^3/3"}</M>. Back substitution uses each entry of the triangle
          once.
        </p>
      </Proof>

      <Remark title="what the cost means">
        <p>
          A 1000 × 1000 system takes about 3 × 10⁸ operations, a fraction of a second on a laptop. A 100 000 × 100 000 system
          takes a million times more. Large problems in machine learning are therefore solved by methods that exploit structure
          or that only approximate the answer.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mult",
      rung: "check",
      prompt: <p>To eliminate x from the second equation of x + 2y = 5, 3x + 4y = 6, which multiple of row 1 do you subtract from row 2?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "ops",
      rung: "check",
      prompt: <p>Which operations on the rows of [A | b] never change the solutions? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["Subtract a multiple of one row from another", "Swap two rows", "Multiply a row by a non-zero number", "Add 1 to every entry of a row"],
        correct: [0, 1, 2],
      },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>Solve x + 2y = 5, 3x + 4y = 6 by elimination. Give x.</p>,
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>Solve x + y + z = 6, 2x + 3y + z = 11, x + 2y + 3z = 14. Give z.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "breakdown",
      rung: "apply",
      prompt: <p>For which k does elimination on x + ky = 1, 2x + 6y = 3 produce a zero second pivot?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [6.0, 8.0]])
A[1] -= (A[1, 0] / A[0, 0]) * A[0]
print(A[1, 1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0, 1.0], [4.0, -6.0, 0.0], [-2.0, 7.0, 2.0]])
A[1] -= 2 * A[0]
A[2] += A[0]
A[2] += A[1]
print(A[:, 0], np.diag(A))`}</Code>
          <p>Elimination on Strang's example. What are the first column and the pivots afterwards?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2. 0. 0.] [ 2. -8.  1.]", "[2. 0. 0.] [ 2. -6.  2.]", "[2. 4. -2.] [ 2. -8.  1.]", "[2. 0. 0.] [ 2. -8. -1.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve(A, b)</C>, which solves a square system by Gaussian elimination and back substitution. Swap in a lower
            row when a pivot is zero. Do not call <C>np.linalg.solve</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def solve(A, b):
    M = np.column_stack([np.asarray(A, float), np.asarray(b, float)])
    n = len(M)
    # eliminate below each pivot, then back substitute
    return np.zeros(n)
`,
        solution: `import numpy as np

def solve(A, b):
    M = np.column_stack([np.asarray(A, float), np.asarray(b, float)])
    n = len(M)
    for c in range(n):
        p = c + int(np.argmax(np.abs(M[c:, c])))
        M[[c, p]] = M[[p, c]]
        for r in range(c + 1, n):
            M[r] -= M[r, c] / M[c, c] * M[c]
    x = np.zeros(n)
    for i in range(n - 1, -1, -1):
        x[i] = (M[i, n] - M[i, i + 1:n] @ x[i + 1:]) / M[i, i]
    return x
`,
        tests: [
          { name: "the puzzle", code: `import numpy as np
assert np.allclose(solve([[2, 1, 1], [4, -6, 0], [-2, 7, 2]], [5, -2, 9]), [1, 1, 2]), 'The puzzle system has solution u = 1, v = 1, w = 2.'` },
          { name: "needs a swap", code: `import numpy as np
assert np.allclose(solve([[0, 2, 4], [1, 1, 1], [2, 3, 5]], [2, 3, 5]), np.linalg.solve([[0, 2, 4], [1, 1, 1], [2, 3, 5]], [2, 3, 5])), 'The first pivot here is 0: swap in a row with a non-zero entry.'` },
          { name: "larger", code: `import numpy as np
rng = np.random.default_rng(1)
A = rng.standard_normal((6, 6)); b = rng.standard_normal(6)
assert np.allclose(solve(A, b), np.linalg.solve(A, b)), 'Your answer differs from the true solution on a random 6 × 6 system.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve_tridiagonal(a, b, c, d)</C>, the Thomas algorithm for a tridiagonal system with sub-diagonal a (length n − 1), diagonal b (length n), super-diagonal c (length n − 1) and right side d, by elimination without pivoting in O(n) time, returning x as a NumPy array. Do not build the full matrix. The tests solve a second-difference system with n = 100000 and compare with a dense solver for small n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def solve_tridiagonal(a, b, c, d):
    n = len(b)
    A = np.diag(b) + np.diag(a, -1) + np.diag(c, 1)
    return np.linalg.solve(A, d)
`,
        solution: `import numpy as np

def solve_tridiagonal(a, b, c, d):
    n = len(b)
    cp = np.zeros(n - 1) if n > 1 else np.zeros(0)
    dp = np.zeros(n)
    b0 = float(b[0])
    if n > 1:
        cp[0] = c[0] / b0
    dp[0] = d[0] / b0
    for i in range(1, n):
        m = b[i] - a[i - 1] * cp[i - 1]
        if i < n - 1:
            cp[i] = c[i] / m
        dp[i] = (d[i] - a[i - 1] * dp[i - 1]) / m
    x = np.zeros(n)
    x[-1] = dp[-1]
    for i in range(n - 2, -1, -1):
        x[i] = dp[i] - cp[i] * x[i + 1]
    return x
`,
        tests: [
          { name: "small", code: `import numpy as np
a, b, c, d = [1, 1], [4, 4, 4], [1, 1], [5, 6, 5]
assert np.allclose(solve_tridiagonal(a, b, c, d), [1, 1, 1]), 'Each row sums to the right side.'` },
          { name: "dense", code: `import numpy as np
rng = np.random.default_rng(2)
n = 30
a, c = rng.normal(size=n - 1), rng.normal(size=n - 1)
b = 5 + rng.random(n)
d = rng.normal(size=n)
A = np.diag(b) + np.diag(a, -1) + np.diag(c, 1)
assert np.allclose(solve_tridiagonal(a, b, c, d), np.linalg.solve(A, d)), 'Agree with a dense solve.'` },
          { name: "large", code: `import numpy as np
import time
n = 100000
h = 1 / (n + 1)
x = np.arange(1, n + 1) * h
t = time.time()
u = solve_tridiagonal(-np.ones(n - 1), 2 * np.ones(n), -np.ones(n - 1), h * h * np.ones(n))
assert time.time() - t < 10 and np.allclose(u, x * (1 - x) / 2, atol=1e-8), '−u″ = 1 with u(0) = u(1) = 0 has u = x(1 − x)/2.'` },
          { name: "no dense", code: `import numpy as np
import inspect
src = inspect.getsource(solve_tridiagonal)
assert 'np.diag' not in src and 'linalg' not in src, 'Do not build the full matrix.'` },
        ],
      },
    },
    {
      key: "same",
      rung: "prove",
      prompt: (
        <p>
          Prove that subtracting ℓ times row i from row j (with i ≠ j) does not change the set of solutions of a linear system.
          Prove both inclusions.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "If x satisfies equations i and j, it satisfies equation j − ℓ × equation i, so every old solution is a new solution.",
          "The operation is undone by adding ℓ times row i back to the new row j, and row i itself is unchanged.",
          "So every new solution satisfies the original equation j too, and the two solution sets are equal.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          Clearing column k of an n × n matrix needs (n − k)² multiply-subtract operations. Find the exact total for n = 100.
        </p>
      ),
      answer: { kind: "numeric", value: 328350 },
    },
  ],

  teachBack:
    "Explain to a friend how Gaussian elimination turns a system into a triangle, what a pivot is and what a zero pivot means, and why the work grows like n³.",

  glimpse: (
    <p>
      Next, elimination pushed all the way to the reduced row echelon form, which reveals every solution at once, including
      when there are infinitely many. Numerical Linear Algebra and Scientific Computing studies why the order of row swaps
      matters when numbers are rounded.
    </p>
  ),
};
