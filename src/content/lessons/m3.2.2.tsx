import { MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { RrefViz } from "@/components/viz/RrefViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.2.2",
  minutes: 60,
  links: {
    requires: ["m3.2.1"],
    foreshadows: ["m3.4.2", "m3.4.5", "m3.4.4"],
  },

  puzzle: (
    <>
      <p>A recipe has three ingredients and two constraints:</p>
      <MD>{"x + 2y + 2z = 2, \\qquad 2x + 4y + 6z = 8."}</MD>
      <p>
        Elimination leaves fewer pivots than unknowns, so there is no triangle to back-substitute into. Are there no solutions,
        or many? And how would you write down all of them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep eliminating past the triangle. Clear the entries above each pivot as well as below, and divide each pivot row so
        the pivot is 1. The result is the <strong>reduced row echelon form</strong>, where each equation tells you one pivot
        variable in terms of the free ones. Try the presets: one has a column with no pivot, which becomes a free variable.
      </p>
      <RrefViz />
    </>
  ),

  theory: (
    <>
      <Definition title="echelon forms">
        <p>A matrix is in <strong>row echelon form</strong> if</p>
        <ul>
          <li>all zero rows are at the bottom, and</li>
          <li>the first non-zero entry (the pivot) of each row is strictly to the right of the pivot in the row above.</li>
        </ul>
        <p>
          It is in <strong>reduced row echelon form</strong> (RREF) if, in addition, every pivot is 1 and every other entry in a
          pivot column is 0.
        </p>
      </Definition>

      <Theorem title="uniqueness">
        <p>
          Every matrix can be brought to RREF by row operations, and the RREF is unique: it does not depend on which operations
          are used.
        </p>
      </Theorem>

      <Definition title="pivot and free variables, rank">
        <p>
          Columns containing a pivot correspond to <strong>pivot variables</strong>; the others are <strong>free variables</strong>.
          The number of pivots is the <strong>rank</strong> r of the matrix. An m × n matrix of rank r has n − r free variables.
        </p>
      </Definition>

      <Example title="the puzzle">
        <p>Row reduce the augmented matrix:</p>
        <MD>{"\\left[\\begin{array}{ccc|c} 1 & 2 & 2 & 2 \\\\ 2 & 4 & 6 & 8 \\end{array}\\right] \\to \\left[\\begin{array}{ccc|c} 1 & 2 & 2 & 2 \\\\ 0 & 0 & 2 & 4 \\end{array}\\right] \\to \\left[\\begin{array}{ccc|c} 1 & 2 & 0 & -2 \\\\ 0 & 0 & 1 & 2 \\end{array}\\right]"}</MD>
        <p>
          The pivots are in columns 1 and 3, so y is free. Reading off: z = 2 and x = −2 − 2y. Every solution is
        </p>
        <MD>{"(x, y, z) = (-2, 0, 2) + y(-2, 1, 0), \\qquad y \\in \\mathbb R,"}</MD>
        <p>a line of solutions in three dimensions.</p>
      </Example>

      <Remark title="the shape of every solution set">
        <p>
          In the example, (−2, 0, 2) is one particular solution and (−2, 1, 0) solves the equations with right-hand side zero.
          This split, one particular solution plus everything that solves Ax = 0, holds for every linear system and is the
          subject of the next lesson.
        </p>
      </Remark>

      <Remark title="in practice">
        <p>
          Computers rarely compute the RREF: dividing by small pivots amplifies rounding errors, and deciding whether a
          computed number is &ldquo;really zero&rdquo; is delicate. The RREF is a tool for understanding. Numerical rank is
          computed from the singular value decomposition at the end of this course.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "isrref",
      rung: "check",
      prompt: <p>Which of these matrices are in reduced row echelon form? Rows are separated by semicolons. Select all that apply.</p>,
      answer: { kind: "choice", options: ["[1 0 2; 0 1 3]", "[1 2 0; 0 0 1]", "[1 1; 0 2]", "[0 1; 1 0]"], correct: [0, 1] },
    },
    {
      key: "free",
      rung: "check",
      prompt: <p>A 3 × 5 matrix has 3 pivots. How many free variables does Ax = 0 have?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "rank",
      rung: "apply",
      prompt: <p>Find the rank of the matrix with rows (1, 2, 3), (2, 4, 6) and (1, 1, 1).</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "entry",
      rung: "apply",
      prompt: <p>Find the RREF of the augmented matrix of x + 2y = 1, 2x + 5y = 4. What is the entry in row 1, column 3?</p>,
      answer: { kind: "numeric", value: -3 },
    },
    {
      key: "sols",
      rung: "apply",
      prompt: (
        <p>
          A system in x, y, z has RREF with rows [1 0 2 | 3] and [0 1 −1 | 1]. Which of these are solutions? Select all that
          apply.
        </p>
      ),
      answer: { kind: "choice", options: ["(3, 1, 0)", "(1, 2, 1)", "(5, 0, −1)", "(3, 1, 1)"], correct: [0, 1, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]])
print(A.shape[1] - np.linalg.matrix_rank(A))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import sympy as sp
A = sp.Matrix([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]])
R, piv = A.rref()
print(R.row(1), piv)`}</Code>
          <p>The reduced row echelon form of a rank-2 matrix. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["Matrix([[0, 0, 1, 2]]) (0, 2)", "Matrix([[0, 1, 1, 2]]) (0, 1)", "Matrix([[0, 0, 1, 2]]) (0, 1, 2)", "Matrix([[0, 0, 2, 4]]) (0, 2)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rref(A)</C>, which returns the reduced row echelon form of A as a float array. Treat entries smaller than
            1e-10 in size as zero.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rref(A):
    R = np.array(A, dtype=float)
    return R
`,
        solution: `import numpy as np

def rref(A):
    R = np.array(A, dtype=float)
    m, n = R.shape
    r = 0
    for c in range(n):
        if r == m:
            break
        p = r + int(np.argmax(np.abs(R[r:, c])))
        if abs(R[p, c]) < 1e-10:
            continue
        R[[r, p]] = R[[p, r]]
        R[r] /= R[r, c]
        for q in range(m):
            if q != r:
                R[q] -= R[q, c] * R[r]
        r += 1
    R[np.abs(R) < 1e-10] = 0
    return R
`,
        tests: [
          { name: "rank two", code: `import numpy as np
assert np.allclose(rref([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]]), [[1, 2, 0, -2], [0, 0, 1, 2], [0, 0, 0, 0]]), 'Clear entries above each pivot as well as below, and scale pivots to 1.'` },
          { name: "full rank", code: `import numpy as np
assert np.allclose(rref([[1, 1, 2], [2, 1, 1], [1, 2, 4]]), np.eye(3)), 'An invertible matrix reduces to the identity.'` },
          { name: "zero first column", code: `import numpy as np
assert np.allclose(rref([[0, 2, 4], [0, 1, 3]]), [[0, 1, 0], [0, 0, 1]]), 'Skip a column with no non-zero entry: it has no pivot.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>rref_exact(A)</C>, the reduced row echelon form of a matrix of integers or fractions computed exactly with <C>fractions.Fraction</C> (no tolerance needed), returned as (R, pivots), where R is a list of lists of Fractions and pivots the tuple of pivot columns. Choose as pivot the first non-zero entry at or below the current row. Then write <C>solution_set(A, b)</C>, returning (particular solution, list of null-space basis vectors) for a consistent system, or <C>None</C> if inconsistent, with the free variables set to 0 in the particular solution and to the standard choices in the null vectors.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def rref_exact(A):
    return ([[Fraction(x) for x in row] for row in A], ())

def solution_set(A, b):
    return None
`,
        solution: `from fractions import Fraction

def rref_exact(A):
    M = [[Fraction(x) for x in row] for row in A]
    rows, cols = len(M), len(M[0])
    piv, r = [], 0
    for c in range(cols):
        k = next((i for i in range(r, rows) if M[i][c] != 0), None)
        if k is None:
            continue
        M[r], M[k] = M[k], M[r]
        p = M[r][c]
        M[r] = [x / p for x in M[r]]
        for i in range(rows):
            if i != r and M[i][c] != 0:
                f = M[i][c]
                M[i] = [x - f * y for x, y in zip(M[i], M[r])]
        piv.append(c)
        r += 1
        if r == rows:
            break
    return (M, tuple(piv))

def solution_set(A, b):
    n = len(A[0])
    Rm, piv = rref_exact([list(row) + [bi] for row, bi in zip(A, b)])
    if n in piv:
        return None
    x = [Fraction(0)] * n
    for i, c in enumerate(piv):
        x[c] = Rm[i][n]
    free = [j for j in range(n) if j not in piv]
    basis = []
    for f in free:
        v = [Fraction(0)] * n
        v[f] = Fraction(1)
        for i, c in enumerate(piv):
            v[c] = -Rm[i][f]
        basis.append(v)
    return (x, basis)
`,
        tests: [
          { name: "strang", code: `Rm, piv = rref_exact([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]])
assert piv == (0, 2) and Rm == [[1, 2, 0, -2], [0, 0, 1, 2], [0, 0, 0, 0]], 'Pivots in columns 0 and 2.'` },
          { name: "fractions", code: `from fractions import Fraction
Rm, piv = rref_exact([[3, 1], [1, 3]])
assert Rm == [[1, 0], [0, 1]] and piv == (0, 1) and all(isinstance(x, Fraction) for row in Rm for x in row), 'Exact arithmetic.'` },
          { name: "solution", code: `x, N = solution_set([[1, 2, 2, 2], [2, 4, 6, 8], [3, 6, 8, 10]], [1, 5, 6])
assert x == [-2, 0, 1.5, 0] and N == [[-2, 1, 0, 0], [2, 0, -2, 1]], 'Particular solution plus null space.'` },
          { name: "inconsistent", code: `assert solution_set([[1, 1], [2, 2]], [1, 3]) is None and solution_set([[1, 1], [2, 2]], [1, 2])[1] == [[-1, 1]], 'A zero row with a non-zero right side means no solution.'` },
          { name: "hilbert", code: `from fractions import Fraction
H = [[Fraction(1, i + j + 1) for j in range(6)] for i in range(6)]
Rm, piv = rref_exact(H)
assert piv == tuple(range(6)) and Rm == [[int(i == j) for j in range(6)] for i in range(6)], 'The Hilbert matrix is invertible, exactly.'` },
        ],
      },
    },
    {
      key: "infinite",
      rung: "prove",
      prompt: (
        <p>
          Prove that if a system Ax = b has at least one solution and its RREF has a free variable, then it has infinitely many
          solutions. Also prove that the rank of an m × n matrix is at most the smaller of m and n.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that each free variable can be set to any value and the pivot variables are then determined by the RREF rows.",
          "Concludes that different values of a free variable give different solutions, so there are infinitely many.",
          "Argues that each row has at most one pivot, so r ≤ m.",
          "Argues that each column has at most one pivot, so r ≤ n.",
        ],
      },
    },
    {
      key: "ipj",
      rung: "stretch",
      prompt: <p>Find the rank of the 6 × 6 matrix whose entry in row i, column j is i + j.</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what the reduced row echelon form is, how to read every solution of a system from it, and what pivots, free variables and rank mean.",

  glimpse: (
    <p>
      Next, the exact conditions under which a system has no solution, one, or infinitely many. Chapter 4 turns the free
      variables into a basis for the null space, and the rank into the dimension of the column space.
    </p>
  ),
};
