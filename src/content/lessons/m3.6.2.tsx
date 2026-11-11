import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CofactorViz } from "@/components/viz/CofactorViz";
import { Code } from "@/components/lesson/Code";
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
