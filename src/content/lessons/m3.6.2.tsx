import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CofactorViz } from "@/components/viz/CofactorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.6.2",
  minutes: 60,
  links: {
    requires: ["m3.6.1"],
    foreshadows: ["m5.4.3", "m7.5.4"],
  },

  puzzle: (
    <>
      <p>
        Elimination computes a determinant quickly, but gives no formula. Sometimes a formula is what you need: to see how the
        determinant depends on one particular entry, or to write the solution of a small system symbolically.
      </p>
      <p>Is there an explicit formula for the determinant of a 3 × 3 matrix in terms of its nine entries? How many terms does it have?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Split the first row into its three entries, one at a time, using linearity. Each piece reduces to a smaller
        determinant, the <strong>minor</strong> you get by deleting that entry&rsquo;s row and column, with a sign from a
        chessboard pattern. Expand along any row below; the total is always the same.
      </p>
      <CofactorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="minors and cofactors">
        <p>
          The minor <M>{"M_{ij}"}</M> is the determinant of the (n − 1) × (n − 1) matrix left after deleting row i and column j.
          The cofactor is <M>{"C_{ij} = (-1)^{i+j}M_{ij}"}</M>.
        </p>
      </Definition>

      <Theorem title="cofactor expansion">
        <p>For any row i,</p>
        <MD>{"\\det A = a_{i1}C_{i1} + a_{i2}C_{i2} + \\dots + a_{in}C_{in},"}</MD>
        <p>and the same holds along any column.</p>
      </Theorem>
      <Proof>
        <p>
          Write row i as <M>{"a_{i1}\\mathbf e_1 + \\dots + a_{in}\\mathbf e_n"}</M> and use linearity in that row. In the
          j-th piece, row i is <M>{"\\mathbf e_j"}</M>; subtracting multiples of it clears the rest of column j, and i + j − 2
          swaps move the 1 to the top-left corner, leaving <M>{"(-1)^{i+j}M_{ij}"}</M>. Columns follow from{" "}
          <M>{"\\det A^{\\mathsf T} = \\det A"}</M>.
        </p>
      </Proof>

      <Example title="the 3 × 3 formula">
        <MD>{"\\det\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix} = a(ei - fh) - b(di - fg) + c(dh - eg)."}</MD>
        <p>
          It has six terms. In general there are n! terms, one for each way to choose one entry from each row with no two in
          the same column, each with a sign: the <strong>big formula</strong>.
        </p>
      </Example>

      <Theorem title="Cramer's rule and the inverse">
        <p>
          If det A ≠ 0, the solution of Ax = b has <M>{"x_j = \\det B_j / \\det A"}</M>, where <M>{"B_j"}</M> is A with column j
          replaced by b. And
        </p>
        <MD>{"(A^{-1})_{ij} = \\frac{C_{ji}}{\\det A}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"X_j"}</M> be the identity with column j replaced by x. Then <M>{"AX_j = B_j"}</M>, because A sends{" "}
          <M>{"\\mathbf e_k"}</M> to column k and x to b. Taking determinants, <M>{"\\det A \\cdot x_j = \\det B_j"}</M>, since
          expanding <M>{"\\det X_j"}</M> along row j gives <M>{"x_j"}</M>. Applying Cramer&rsquo;s rule to each column of{" "}
          <M>{"AA^{-1} = I"}</M> gives the inverse formula.
        </p>
      </Proof>

      <Example title="Cramer on a small system">
        <p>
          For 2x + y = 5, x + 3y = 5: det A = 5, <M>{"x = \\det\\begin{bmatrix} 5 & 1 \\\\ 5 & 3 \\end{bmatrix}/5 = 2"}</M> and{" "}
          <M>{"y = \\det\\begin{bmatrix} 2 & 5 \\\\ 1 & 5 \\end{bmatrix}/5 = 1"}</M>.
        </p>
      </Example>

      <Remark title="formulas versus algorithms">
        <p>
          Cramer&rsquo;s rule and the cofactor inverse are wonderful for theory, for instance to show that the entries of{" "}
          <M>{"A^{-1}"}</M> depend smoothly on those of A, and for 2 × 2 or 3 × 3 cases. For computing with large matrices, use
          elimination.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sign",
      rung: "check",
      prompt: <p>What sign does the cofactor in position (2, 3) carry?</p>,
      answer: { kind: "choice", options: ["−", "+"], correct: [0] },
    },
    {
      key: "two",
      rung: "check",
      prompt: <p>Find the determinant of the matrix with rows (3, 8) and (4, 6).</p>,
      answer: { kind: "numeric", value: -14 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>Find the determinant of the matrix with rows (1, 2, 0), (3, 1, 2), (0, 1, 1) by cofactor expansion.</p>,
      answer: { kind: "numeric", value: -7 },
    },
    {
      key: "cramer",
      rung: "apply",
      prompt: <p>Use Cramer&rsquo;s rule to solve 3x + 2y = 7, x + 4y = 9. Give x.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "inv",
      rung: "apply",
      prompt: (
        <p>
          A has rows (2, 1, 3), (0, 4, 1), (5, 2, 0) and det A = −59. Find the entry in row 1, column 1 of{" "}
          <M>{"A^{-1}"}</M> to four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0339, tolerance: 0.002 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0, 3.0], [0.0, 4.0, 1.0], [5.0, 2.0, 0.0]])
def minor(i, j):
    return np.delete(np.delete(A, i, axis=0), j, axis=1)
print(round(sum((-1) ** (1 + j) * A[1, j] * np.linalg.det(minor(1, j)) for j in range(3))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: -59 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0, 0.0], [3.0, 4.0, 5.0], [0.0, 1.0, 2.0]])
C = np.array([[(-1) ** (i + j) * np.linalg.det(np.delete(np.delete(A, i, 0), j, 1)) for j in range(3)] for i in range(3)])
print(np.round(A[0] @ C[0], 6), np.round(A[1] @ C[0], 6))`}</Code>
          <p>Expanding along row 0 with its own cofactors, and with the cofactors of another row. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-9.0 0.0", "-9.0 -9.0", "9.0 0.0", "-1.0 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>cofactor_det(A)</C>, which computes the determinant recursively by cofactor expansion along the first row.
            A 1 × 1 matrix is its own determinant.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cofactor_det(A):
    A = np.asarray(A, float)
    return float(A[0, 0])
`,
        solution: `import numpy as np

def cofactor_det(A):
    A = np.asarray(A, float)
    if len(A) == 1:
        return float(A[0, 0])
    total = 0.0
    for j in range(len(A)):
        minor = np.delete(A[1:], j, axis=1)
        total += (-1) ** j * A[0, j] * cofactor_det(minor)
    return total
`,
        tests: [
          { name: "two by two", code: `assert abs(cofactor_det([[3, 8], [4, 6]]) + 14) < 1e-9, 'ad − bc for [[3, 8], [4, 6]] is −14.'` },
          { name: "three by three", code: `assert abs(cofactor_det([[2, 1, 3], [0, 4, 1], [5, 2, 0]]) + 59) < 1e-9, 'The visualisation’s matrix has determinant −59. Check the alternating signs.'` },
          { name: "four by four", code: `import numpy as np
rng = np.random.default_rng(8)
A = rng.integers(-3, 4, (4, 4))
assert abs(cofactor_det(A) - np.linalg.det(A)) < 1e-8, 'Recursion should work for any size.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>adjugate(A)</C>, the transpose of the cofactor matrix, for a square integer matrix, with each cofactor computed exactly (use <C>sympy.Matrix</C> minors or your own exact determinant), returned as a list of lists of ints. Then write <C>inverse_by_cramer(A)</C>, the exact inverse as a list of lists of <C>Fraction</C>, from A⁻¹ = adj(A)/det(A), and <C>cramer_solve(A, b)</C>, the exact solution of Ax = b by Cramer&rsquo;s rule (replace column i by b).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def adjugate(A):
    return [list(row) for row in A]

def inverse_by_cramer(A):
    return [[Fraction(0)] * len(A) for _ in A]

def cramer_solve(A, b):
    return [Fraction(0)] * len(A)
`,
        solution: `from fractions import Fraction
import sympy as sp

def _det(M):
    return int(sp.Matrix(M).det()) if len(M) else 1

def adjugate(A):
    n = len(A)
    C = [[(-1) ** (i + j) * _det([[A[r][c] for c in range(n) if c != j] for r in range(n) if r != i]) for j in range(n)] for i in range(n)]
    return [[C[j][i] for j in range(n)] for i in range(n)]

def inverse_by_cramer(A):
    d = _det(A)
    return [[Fraction(x, d) for x in row] for row in adjugate(A)]

def cramer_solve(A, b):
    d = _det(A)
    n = len(A)
    out = []
    for i in range(n):
        Ai = [[b[r] if c == i else A[r][c] for c in range(n)] for r in range(n)]
        out.append(Fraction(_det(Ai), d))
    return out
`,
        tests: [
          { name: "adj", code: `assert adjugate([[1, 2], [3, 4]]) == [[4, -2], [-3, 1]], 'For 2 × 2, swap the diagonal and negate the rest.'` },
          { name: "identity", code: `A = [[1, 2, 0], [3, 4, 5], [0, 1, 2]]
adj = adjugate(A)
prod = [[sum(A[i][k] * adj[k][j] for k in range(3)) for j in range(3)] for i in range(3)]
assert prod == [[-9, 0, 0], [0, -9, 0], [0, 0, -9]], 'A · adj(A) = det(A) · I.'` },
          { name: "inverse", code: `from fractions import Fraction
inv = inverse_by_cramer([[2, 1], [5, 3]])
assert inv == [[3, -1], [-5, 2]] and inverse_by_cramer([[2, 0], [0, 4]]) == [[Fraction(1, 2), 0], [0, Fraction(1, 4)]], 'Exact fractions.'` },
          { name: "cramer", code: `from fractions import Fraction
A = [[2, 1, 1], [4, -6, 0], [-2, 7, 2]]
x = cramer_solve(A, [5, -2, 9])
assert x == [1, 1, 2], 'Strang’s system has solution (1, 1, 2).'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove Cramer&rsquo;s rule: if det A ≠ 0 and Ax = b, then <M>{"x_j = \\det B_j / \\det A"}</M>. You may use
          det(AB) = det A det B.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines X_j as the identity with column j replaced by x.",
          "Checks AX_j = B_j column by column: Ae_k is column k of A, and Ax = b.",
          "Computes det X_j = x_j, for instance by expanding along row j or noting X_j is triangular after reordering.",
          "Takes determinants: det A · x_j = det B_j, and divides by det A ≠ 0.",
        ],
      },
    },
    {
      key: "terms",
      rung: "stretch",
      prompt: <p>How many terms does the big formula have for a 5 × 5 determinant?</p>,
      answer: { kind: "numeric", value: 120 },
    },
  ],

  teachBack:
    "Explain to a friend how cofactor expansion works, why the signs alternate like a chessboard, and what Cramer's rule says, together with why it is not used for large systems.",

  glimpse: (
    <p>
      Next, what the determinant measures geometrically: the factor by which a matrix scales area and volume. Probability uses
      the determinant of a covariance matrix in the density of the multivariate normal.
    </p>
  ),
};
