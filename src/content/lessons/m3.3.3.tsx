import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { InverseMapViz } from "@/components/viz/InverseMapViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.3.3",
  minutes: 60,
  links: {
    requires: ["m3.3.2", "m3.2.3"],
    revisits: ["m0.3.4"],
    foreshadows: ["m3.6.1", "m5.6.1", "m11.2.1"],
  },

  puzzle: (
    <>
      <p>
        A spy encodes each pair of numbers (x, y) as (2x + y, x + y) before sending it. You intercept (7, 4). What was the
        message?
      </p>
      <p>
        Now the spy switches to (2x + 4y, x + 2y). You intercept (8, 4). Can you still recover the message, or has
        information been lost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A matrix moves points around. If it never sends two points to the same place, the move can be undone, and the undoing
        move is the inverse matrix. Below, A maps the blue shape to the red one. Change the entries until the red shape
        flattens onto a line: different points now land together, and nothing can pull them apart again.
      </p>
      <InverseMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inverse">
        <p>
          A square matrix A is <strong>invertible</strong> if there is a matrix <M>{"A^{-1}"}</M> with{" "}
          <M>{"A^{-1}A = I"}</M> and <M>{"AA^{-1} = I"}</M>. A matrix with no inverse is <strong>singular</strong>.
        </p>
      </Definition>

      <Theorem title="equivalent conditions">
        <p>For an n × n matrix A, the following are equivalent:</p>
        <ul>
          <li>A is invertible;</li>
          <li>Ax = b has exactly one solution for every b;</li>
          <li>Ax = 0 has only the solution x = 0;</li>
          <li>elimination (with row swaps) finds n non-zero pivots;</li>
          <li>the columns of A are not combinations of each other.</li>
        </ul>
      </Theorem>

      <Theorem title="the 2 × 2 inverse">
        <MD>{"\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}^{-1} = \\frac{1}{ad - bc}\\begin{bmatrix} d & -b \\\\ -c & a \\end{bmatrix}, \\qquad \\text{provided } ad - bc \\neq 0."}</MD>
      </Theorem>
      <Proof>
        <p>Multiply out: the product is <M>{"\\frac{1}{ad - bc}"}</M> times <M>{"(ad - bc)I"}</M>.</p>
      </Proof>

      <Theorem title="inverse of a product">
        <p>
          If A and B are invertible, so is AB, and <M>{"(AB)^{-1} = B^{-1}A^{-1}"}</M>: undo the last step first, as with socks
          and shoes.
        </p>
      </Theorem>
      <Proof>
        <p><M>{"(B^{-1}A^{-1})(AB) = B^{-1}(A^{-1}A)B = B^{-1}B = I"}</M>, and similarly on the other side.</p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The first code is A = [[2, 1], [1, 1]] with ad − bc = 1, so <M>{"A^{-1}"}</M> = [[1, −1], [−1, 2]] and the message is{" "}
          <M>{"A^{-1}(7, 4) = (3, 1)"}</M>. The second code has ad − bc = 2·2 − 4·1 = 0. Its output is always (2x + 4y, x + 2y) =
          (x + 2y)(2, 1), so (8, 4) could have come from (4, 0), (0, 2), (2, 1) or any (x, y) with x + 2y = 4. The message is
          lost.
        </p>
      </Example>

      <Definition title="Gauss-Jordan">
        <p>
          To find <M>{"A^{-1}"}</M>, row reduce [A | I]. If A reduces to I, the right half becomes <M>{"A^{-1}"}</M>; if a
          pivot is missing, A is singular.
        </p>
      </Definition>

      <Remark title="do not invert to solve">
        <p>
          To solve Ax = b, eliminate; do not compute <M>{"A^{-1}"}</M> and multiply. Computing the inverse costs about three
          times as much and is less accurate. The inverse is a concept first and a computation rarely.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "diag",
      rung: "check",
      prompt: <p>Find the entry in row 2, column 2 of the inverse of the diagonal matrix with diagonal 2, 4.</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "prod",
      rung: "check",
      prompt: <p>For invertible A and B, what is <M>{"(AB)^{-1}"}</M>?</p>,
      answer: { kind: "choice", options: ["B⁻¹A⁻¹", "A⁻¹B⁻¹", "(BA)⁻¹ reversed entry by entry", "It need not exist"], correct: [0] },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>Find the inverse of the matrix with rows (2, 1) and (1, 1). Give its entry in row 2, column 2.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "singular",
      rung: "apply",
      prompt: <p>For which c is the matrix with rows (1, 2) and (3, c) singular?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: <p>Let A have rows (2, 1) and (1, 1). Solve Ax = (4, 3). Give the second entry of x.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [1.0, 1.0]])
y = np.array([7.0, 4.0])
x = np.linalg.solve(A, y)
print(x[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [5.0, 3.0]])
Ainv = np.linalg.inv(A)
print(Ainv, np.linalg.det(A).round(6))`}</Code>
          <p>The inverse of a 2 × 2 matrix with determinant 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[ 3. -1.]\n [-5.  2.]] 1.0", "[[ 2. -1.]\n [-5.  3.]] 1.0", "[[ 3. -5.]\n [-1.  2.]] 1.0", "[[ 3. -1.]\n [-5.  2.]] -1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>inverse2(M)</C>, which returns the inverse of a 2 × 2 matrix by the ad − bc formula, or <C>None</C> if the
            matrix is singular (|ad − bc| &lt; 1e-12).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inverse2(M):
    (a, b), (c, d) = M
    return np.array([[d, -b], [-c, a]], float)
`,
        solution: `import numpy as np

def inverse2(M):
    (a, b), (c, d) = M
    det = a * d - b * c
    if abs(det) < 1e-12:
        return None
    return np.array([[d, -b], [-c, a]], float) / det
`,
        tests: [
          { name: "unit determinant", code: `import numpy as np
assert np.allclose(inverse2([[2, 1], [1, 1]]), [[1, -1], [-1, 2]]), 'The inverse of [[2, 1], [1, 1]] is [[1, −1], [−1, 2]].'` },
          { name: "divides", code: `import numpy as np
M = [[4, 7], [2, 6]]
assert np.allclose(np.array(M) @ inverse2(M), np.eye(2)), 'M times its inverse should be the identity. Did you divide by ad − bc?'` },
          { name: "singular", code: `assert inverse2([[2, 4], [1, 2]]) is None, 'A matrix with ad − bc = 0 has no inverse: return None.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gauss_jordan_inverse(A)</C>, which inverts a square matrix by row-reducing [A | I] with partial pivoting (swap in the row with the largest absolute entry in the pivot column), raising <C>np.linalg.LinAlgError</C> if a pivot is below 1e−12 times the largest entry of A. Then write <C>sherman_morrison(Ainv, u, v)</C>, the inverse of A + uvᵀ from A⁻¹ in O(n²) time: A⁻¹ − (A⁻¹u)(vᵀA⁻¹)/(1 + vᵀA⁻¹u).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gauss_jordan_inverse(A):
    return np.linalg.inv(A)

def sherman_morrison(Ainv, u, v):
    return Ainv
`,
        solution: `import numpy as np

def gauss_jordan_inverse(A):
    A = np.asarray(A, float)
    n = len(A)
    M = np.hstack([A, np.eye(n)])
    scale = np.abs(A).max() if A.size else 1.0
    for c in range(n):
        k = c + int(np.argmax(np.abs(M[c:, c])))
        if abs(M[k, c]) < 1e-12 * scale:
            raise np.linalg.LinAlgError('singular')
        M[[c, k]] = M[[k, c]]
        M[c] /= M[c, c]
        for i in range(n):
            if i != c:
                M[i] -= M[i, c] * M[c]
    return M[:, n:]

def sherman_morrison(Ainv, u, v):
    Ainv, u, v = np.asarray(Ainv, float), np.asarray(u, float), np.asarray(v, float)
    Au = Ainv @ u
    vA = v @ Ainv
    return Ainv - np.outer(Au, vA) / (1 + v @ Au)
`,
        tests: [
          { name: "small", code: `import numpy as np
assert np.allclose(gauss_jordan_inverse([[2, 1], [5, 3]]), [[3, -1], [-5, 2]]), 'The inverse of [[2, 1], [5, 3]].'` },
          { name: "pivoting", code: `import numpy as np
A = np.array([[0.0, 1.0], [1.0, 0.0]])
assert np.allclose(gauss_jordan_inverse(A), A) and np.allclose(gauss_jordan_inverse([[1e-20, 1], [1, 1]]) @ np.array([[1e-20, 1], [1, 1]]), np.eye(2)), 'A zero or tiny pivot needs a row swap.'` },
          { name: "singular", code: `import numpy as np
try:
    gauss_jordan_inverse([[1, 2], [2, 4]])
    ok = False
except np.linalg.LinAlgError:
    ok = True
assert ok, 'Singular matrices have no inverse.'` },
          { name: "no numpy inverse", code: `import inspect
assert 'linalg.inv' not in inspect.getsource(gauss_jordan_inverse) and 'solve' not in inspect.getsource(gauss_jordan_inverse), 'Row-reduce [A | I] yourself.'` },
          { name: "rank one", code: `import numpy as np
rng = np.random.default_rng(7)
A = rng.normal(size=(6, 6)) + 6 * np.eye(6)
u, v = rng.normal(size=6), rng.normal(size=6)
assert np.allclose(sherman_morrison(np.linalg.inv(A), u, v), np.linalg.inv(A + np.outer(u, v))), 'Update the inverse cheaply.'` },
        ],
      },
    },
    {
      key: "unique",
      rung: "prove",
      prompt: (
        <p>
          Prove that a matrix has at most one inverse. Then prove that if A is invertible, the only solution of Ax = 0 is x = 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes B and C both satisfy BA = AB = I and CA = AC = I.",
          "Computes B = BI = B(AC) = (BA)C = IC = C.",
          "For Ax = 0, multiplies by A⁻¹ on the left: x = A⁻¹Ax = A⁻¹0 = 0.",
        ],
      },
    },
    {
      key: "gj",
      rung: "stretch",
      prompt: <p>Find the inverse of the matrix with rows (1, 0, 0), (2, 1, 0) and (0, 3, 1) by Gauss-Jordan. Give its entry in row 3, column 1.</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what an inverse matrix is, why a matrix that flattens the plane cannot have one, why the inverse of AB is B⁻¹A⁻¹, and why we rarely compute inverses in practice.",

  glimpse: (
    <p>
      Next, elimination recorded as a factorisation A = LU, which is how computers actually solve systems. The quantity ad − bc
      returns as the determinant in Chapter 6. Multivariable and Matrix Calculus asks when a non-linear function can be
      inverted, and answers by looking at the inverse of its derivative matrix.
    </p>
  ),
};
