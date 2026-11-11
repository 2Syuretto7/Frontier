import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { InverseMapViz } from "@/components/viz/InverseMapViz";
import { Code } from "@/components/lesson/Code";
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
