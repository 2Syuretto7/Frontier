import { MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { RrefViz } from "@/components/viz/RrefViz";
import { Code } from "@/components/lesson/Code";
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
