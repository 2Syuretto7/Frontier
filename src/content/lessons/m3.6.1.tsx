import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DetRowOpsViz } from "@/components/viz/DetRowOpsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.6.1",
  minutes: 65,
  links: {
    requires: ["m3.3.3", "m3.2.1"],
    foreshadows: ["m3.6.3", "m3.7.1", "m5.4.3"],
  },

  puzzle: (
    <>
      <p>
        For a 2 × 2 matrix, the number ad − bc decides whether an inverse exists. Is there a single number like that for a 3 ×
        3 matrix, or a 100 × 100 one?
      </p>
      <p>
        If there is, it should be cheap to compute, and it should behave well when you multiply matrices. What rules would
        such a number have to obey?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Rather than start from a formula, start from three rules: the identity has determinant 1, swapping two rows flips the
        sign, and the determinant is linear in each row separately. Everything else follows, including how to compute it:
        eliminate to a triangle and multiply the diagonal. Apply row operations below and watch the determinant respond.
      </p>
      <DetRowOpsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the determinant">
        <p>The determinant is the unique function of square matrices with these three properties:</p>
        <ol>
          <li>det I = 1;</li>
          <li>swapping two rows multiplies the determinant by −1;</li>
          <li>
            it is linear in each row when the other rows are held fixed: multiplying a row by t multiplies det by t, and if one
            row is a sum <M>{"\\mathbf r + \\mathbf r'"}</M>, the determinant is the sum of the two determinants.
          </li>
        </ol>
      </Definition>

      <Theorem title="consequences">
        <ol start={4}>
          <li>If two rows are equal, det A = 0.</li>
          <li>Subtracting a multiple of one row from another leaves det A unchanged.</li>
          <li>A row of zeros gives det A = 0.</li>
          <li>For a triangular matrix, det A is the product of the diagonal entries.</li>
          <li>det A = 0 exactly when A is singular.</li>
          <li>det(AB) = det A · det B.</li>
          <li><M>{"\\det A^{\\mathsf T} = \\det A"}</M>.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (4) Swapping the equal rows changes nothing, yet flips the sign, so det = −det. (5) By linearity, the new determinant
          is det A minus ℓ times the determinant of a matrix with two equal rows, which is 0. (6) Multiply the zero row by 0.
          (7) If the diagonal has no zeros, rule 5 clears the off-diagonal entries without changing det, leaving a diagonal
          matrix, whose determinant is the product by rules 3 and 1. If some diagonal entry is zero, elimination produces a zero
          row. (8) Elimination gives det A = ± (product of pivots), zero exactly when a pivot is missing. Rules 9 and 10 are
          proved by checking that both sides obey rules 1 to 3.
        </p>
      </Proof>

      <Example title="computing a determinant">
        <p>
          For A with rows (2, 1, 1), (4, −6, 0), (−2, 7, 2), elimination without swaps reaches the triangle with diagonal 2, −8,
          1. So det A = 2 · (−8) · 1 = −16.
        </p>
      </Example>

      <Theorem title="useful corollaries">
        <p>
          <M>{"\\det(A^{-1}) = 1/\\det A"}</M>, and for an n × n matrix, <M>{"\\det(cA) = c^n\\det A"}</M>, since each of the
          n rows is multiplied by c.
        </p>
      </Theorem>

      <Remark title="the cost">
        <p>
          Elimination computes a determinant in about <M>{"n^3/3"}</M> operations. The cofactor formula of the next lesson takes
          about n! operations, which for n = 30 is over half a million times the age of the universe measured in nanoseconds. Determinants of large
          matrices also overflow or underflow easily, which is why libraries offer the logarithm of the determinant.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "swap",
      rung: "check",
      prompt: <p>det A = 5. What is the determinant after swapping two rows of A?</p>,
      answer: { kind: "numeric", value: -5 },
    },
    {
      key: "tri",
      rung: "check",
      prompt: <p>Find the determinant of the upper triangular matrix with rows (2, 7, 1), (0, 3, 4), (0, 0, −1).</p>,
      answer: { kind: "numeric", value: -6 },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: <p>A is 3 × 3 with det A = 5. Find det(2A).</p>,
      answer: { kind: "numeric", value: 40 },
    },
    {
      key: "prod",
      rung: "apply",
      prompt: <p>det A = 3 and det B = −2. Find <M>{"\\det(A^{-1}B^{\\mathsf T})"}</M> to four decimal places.</p>,
      answer: { kind: "numeric", value: -0.6667, tolerance: 0.0002 },
    },
    {
      key: "elim",
      rung: "apply",
      prompt: <p>Find the determinant of the matrix with rows (1, 2, 3), (2, 5, 7), (1, 3, 5).</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0, 1.0], [4.0, -6.0, 0.0], [-2.0, 7.0, 2.0]])
B = A[[1, 0, 2]] * np.array([[1.0], [1.0], [3.0]])
print(round(np.linalg.det(B)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 48 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 1.0], [1.0, 3.0]])
B = np.array([[1.0, 4.0], [0.0, 2.0]])
d = np.linalg.det
print(round(d(A @ B), 6), round(d(A) * d(B), 6), round(d(3 * A), 6), round(d(A.T), 6))`}</Code>
          <p>Product rule, scaling and transpose for determinants. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10.0 10.0 45.0 5.0", "10.0 10.0 15.0 5.0", "10.0 10.0 45.0 -5.0", "10.0 7.0 45.0 5.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>det(A)</C>, which computes the determinant by elimination: track row swaps (each flips the sign) and multiply
            the pivots. Do not call <C>np.linalg.det</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def det(A):
    U = np.array(A, dtype=float)
    return float(np.prod(np.diag(U)))
`,
        solution: `import numpy as np

def det(A):
    U = np.array(A, dtype=float)
    n, sign = len(U), 1.0
    for c in range(n):
        p = c + int(np.argmax(np.abs(U[c:, c])))
        if abs(U[p, c]) < 1e-12:
            return 0.0
        if p != c:
            U[[c, p]] = U[[p, c]]
            sign = -sign
        for r in range(c + 1, n):
            U[r] -= U[r, c] / U[c, c] * U[c]
    return sign * float(np.prod(np.diag(U)))
`,
        tests: [
          { name: "lesson matrix", code: `assert abs(det([[2, 1, 1], [4, -6, 0], [-2, 7, 2]]) + 16) < 1e-9, 'The lesson’s matrix has determinant −16.'` },
          { name: "swap", code: `assert abs(det([[0, 1], [1, 0]]) + 1) < 1e-9, 'A single row swap gives determinant −1.'` },
          { name: "singular", code: `assert abs(det([[1, 2, 3], [4, 5, 6], [7, 8, 9]])) < 1e-9, 'Dependent rows give determinant 0.'` },
          { name: "random", code: `import numpy as np
rng = np.random.default_rng(7)
A = rng.standard_normal((6, 6))
assert abs(det(A) - np.linalg.det(A)) < 1e-8, 'Your determinant differs from the true one on a random 6 × 6 matrix.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>det_exact(A)</C>, the determinant of an integer matrix computed exactly by the Bareiss algorithm: fraction-free elimination where each update is M[i][j] = (M[i][j]·M[k][k] − M[i][k]·M[k][j]) // previous pivot, with row swaps (changing the sign) when a pivot is 0. Every division is exact, all numbers stay integers, and the last pivot is the determinant. Then write <C>log_abs_det(A)</C> for a float matrix as the sum of log|uᵢᵢ| from an LU factorisation (use <C>scipy.linalg.lu_factor</C>), which works where the determinant itself overflows.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def det_exact(A):
    return int(round(np.linalg.det(np.array(A, float))))

def log_abs_det(A):
    return float(np.log(abs(np.linalg.det(A))))
`,
        solution: `import numpy as np
from scipy.linalg import lu_factor

def det_exact(A):
    M = [list(map(int, row)) for row in A]
    n = len(M)
    sign, prev = 1, 1
    for k in range(n - 1):
        if M[k][k] == 0:
            swap = next((i for i in range(k + 1, n) if M[i][k] != 0), None)
            if swap is None:
                return 0
            M[k], M[swap] = M[swap], M[k]
            sign = -sign
        for i in range(k + 1, n):
            for j in range(k + 1, n):
                M[i][j] = (M[i][j] * M[k][k] - M[i][k] * M[k][j]) // prev
        prev = M[k][k]
    return sign * M[n - 1][n - 1]

def log_abs_det(A):
    lu, piv = lu_factor(np.asarray(A, float))
    return float(np.sum(np.log(np.abs(np.diag(lu)))))
`,
        tests: [
          { name: "small", code: `assert det_exact([[2, 1], [1, 3]]) == 5 and det_exact([[0, 1], [1, 0]]) == -1 and det_exact([[1, 2], [2, 4]]) == 0, 'Swaps flip the sign.'` },
          { name: "exact", code: `import random
random.seed(5)
from fractions import Fraction
def ref(M):
    M = [[Fraction(x) for x in r] for r in M]
    n, d = len(M), Fraction(1)
    for c in range(n):
        p = next((i for i in range(c, n) if M[i][c] != 0), None)
        if p is None:
            return 0
        if p != c:
            M[c], M[p] = M[p], M[c]
            d = -d
        d *= M[c][c]
        for i in range(c + 1, n):
            f = M[i][c] / M[c][c]
            M[i] = [a - f * b for a, b in zip(M[i], M[c])]
    return d
for _ in range(20):
    n = random.randint(1, 7)
    M = [[random.randint(-9, 9) for _ in range(n)] for _ in range(n)]
    assert det_exact(M) == ref(M), M` },
          { name: "big", code: `M = [[(i + 1) ** j for j in range(12)] for i in range(12)]
import math
expected = math.prod(j - i for i in range(1, 13) for j in range(i + 1, 13))
assert det_exact(M) == expected, 'A 12 × 12 Vandermonde determinant, exactly.'` },
          { name: "log det", code: `import numpy as np
rng = np.random.default_rng(18)
A = rng.normal(size=(400, 400)) * 10
with np.errstate(all='ignore'):
    raw = np.linalg.det(A)
v = log_abs_det(A)
assert np.isfinite(v) and abs(v - np.linalg.slogdet(A)[1]) < 1e-8, 'Sum logs instead of multiplying.'` },
        ],
      },
    },
    {
      key: "rules",
      rung: "prove",
      prompt: (
        <p>
          Using only the three defining rules, prove that a matrix with two equal rows has determinant 0, and that subtracting a
          multiple of one row from another does not change the determinant.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Swaps the two equal rows: the matrix is unchanged, but rule 2 gives det A = −det A, so det A = 0.",
          "Writes the new row j as r_j − ℓr_i and uses linearity in row j to split the determinant into det A − ℓ det A′.",
          "Notes that A′ has row j equal to row i, so det A′ = 0 and the determinant is unchanged.",
        ],
      },
    },
    {
      key: "jplusi",
      rung: "stretch",
      prompt: <p>Find the determinant of the 4 × 4 matrix with 2 on the diagonal and 1 everywhere else.</p>,
      answer: { kind: "numeric", value: 5 },
    },
  ],

  teachBack:
    "Explain to a friend the three rules that define the determinant, how they lead to computing it by elimination, and why det A = 0 exactly when A has no inverse.",

  glimpse: (
    <p>
      Next, the explicit formulas for the determinant, by cofactors, and what they give: Cramer&rsquo;s rule and a formula for
      the inverse. Multivariable and Matrix Calculus differentiates the log-determinant, which appears in every Gaussian
      likelihood.
    </p>
  ),
};
