import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ComplementViz } from "@/components/viz/ComplementViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.5.1",
  minutes: 55,
  links: {
    requires: ["m3.4.5", "m3.1.2"],
    foreshadows: ["m6.2.3", "m3.5.2"],
  },

  puzzle: (
    <>
      <p>
        A sensor reports a single number, x₁ + x₂, about a two-dimensional state (x₁, x₂). Two states that differ by (1, −1)
        give the same reading.
      </p>
      <p>
        Which part of the state does the sensor see, and which part is invisible to it? Can every state be split cleanly into a
        visible part and an invisible part?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Ax = 0 says that x has dot product zero with every row of A: x is perpendicular to the row space. So the null space and
        the row space are perpendicular. Below, the solid line is the row space of a rank one matrix and the dashed line its
        null space. Turn the rows and move the point: every point splits into one piece along each line, and the pieces meet
        at a right angle.
      </p>
      <ComplementViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthogonal subspaces and complements">
        <p>
          Subspaces V and W are <strong>orthogonal</strong> if <M>{"\\mathbf v \\cdot \\mathbf w = 0"}</M> for every v in V
          and w in W. The <strong>orthogonal complement</strong> <M>{"V^\\perp"}</M> of V is the set of all vectors orthogonal
          to every vector in V; it is a subspace.
        </p>
      </Definition>

      <Theorem title="the fundamental theorem, part two">
        <p>For every m × n matrix A,</p>
        <MD>{"N(A) = C(A^{\\mathsf T})^\\perp \\text{ in } \\mathbb R^n, \\qquad N(A^{\\mathsf T}) = C(A)^\\perp \\text{ in } \\mathbb R^m."}</MD>
      </Theorem>
      <Proof>
        <p>
          The i-th entry of Ax is (row i) · x. So Ax = 0 exactly when x is orthogonal to every row, which is exactly when x is
          orthogonal to every combination of rows. The second statement is the first applied to <M>{"A^{\\mathsf T}"}</M>.
        </p>
      </Proof>

      <Theorem title="splitting a vector">
        <p>
          If V is a subspace of <M>{"\\mathbb R^n"}</M>, then <M>{"\\dim V + \\dim V^\\perp = n"}</M>, and every x can be
          written in exactly one way as x = v + w with v in V and w in <M>{"V^\\perp"}</M>. Then{" "}
          <M>{"\\|\\mathbf x\\|^2 = \\|\\mathbf v\\|^2 + \\|\\mathbf w\\|^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take V as the row space of a matrix A whose rows are a basis of V. Then <M>{"V^\\perp = N(A)"}</M> has dimension n − dim V.
          A basis of V together with a basis of <M>{"V^\\perp"}</M> gives n vectors; they are independent because a vector in
          both spaces is orthogonal to itself, so it is zero. Hence they form a basis of <M>{"\\mathbb R^n"}</M>, which gives the
          split. Pythagoras follows because v · w = 0.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The sensor is A = [1 1]. Its row space is the line through (1, 1): this is what it sees. Its null space is the line
          through (1, −1): this is invisible. The state (3, 1) splits as (2, 2) + (1, −1). The reading depends only on the first
          piece.
        </p>
      </Example>

      <Remark title="every matrix, in one picture">
        <p>
          The input space splits into row space and null space, the output space into column space and left null space, at
          right angles. A kills the null space and maps the row space onto the column space, one to one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "orth",
      rung: "check",
      prompt: <p>Are (1, 2, −1) and (3, −1, 1) orthogonal?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "which",
      rung: "check",
      prompt: <p>The null space of A is the orthogonal complement of which subspace?</p>,
      answer: { kind: "choice", options: ["The row space of A", "The column space of A", "The left null space of A", "The null space of Aᵀ"], correct: [0] },
    },
    {
      key: "c",
      rung: "apply",
      prompt: <p>For which c is (1, c, 2) orthogonal to (3, 1, −2)?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "dim",
      rung: "apply",
      prompt: <p>What is the dimension of the orthogonal complement of the line through (1, 1, 1) in <M>{"\\mathbb R^3"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "perp",
      rung: "apply",
      prompt: <p>Which vectors lie in the null space of A = [1 2 3]? Select all that apply.</p>,
      answer: { kind: "choice", options: ["(−2, 1, 0)", "(−3, 0, 1)", "(1, 1, −1)", "(1, 1, 1)"], correct: [0, 1, 2] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 1.0]])
x = np.array([3.0, 1.0])
xr = A.T @ np.linalg.solve(A @ A.T, A @ x)
xn = x - xr
print(xr @ xn, xn[0])`}</Code>
          <p>This prints two numbers. What is the second?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that the left null space <M>{"N(A^{\\mathsf T})"}</M> is orthogonal to the column space C(A), and that the only
          vector in both is 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes y with Aᵀy = 0 and a vector Ax in the column space.",
          "Computes y · Ax = yᵀAx = (Aᵀy)ᵀx = 0.",
          "Notes that a vector in both is orthogonal to itself, so its length squared is 0 and it is 0.",
        ],
      },
    },
    {
      key: "split",
      rung: "stretch",
      prompt: <p>Split x = (3, 1) into a part in the row space and a part in the null space of A = [1 1]. Give the first entry of the null space part.</p>,
      answer: { kind: "numeric", value: 1 },
    },
  ],

  teachBack:
    "Explain to a friend why the null space of a matrix is perpendicular to its row space, and how every input vector splits into a part the matrix sees and a part it cannot see.",

  glimpse: (
    <p>
      Next, projections: the formula for the piece of a vector that lies in a subspace, the closest point of the subspace.
      Linear Algebra II develops orthogonal complements in any inner product space.
    </p>
  ),
};
