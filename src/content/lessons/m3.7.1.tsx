import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { EigenSearchViz } from "@/components/viz/EigenSearchViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.1",
  minutes: 65,
  links: {
    requires: ["m3.6.1", "m3.3.1"],
    revisits: ["m0.2.6"],
    foreshadows: ["m3.7.2", "m11.4.1", "m6.3.1"],
  },

  puzzle: (
    <>
      <p>
        Apply the matrix A = [[4, 1], [2, 3]] to a vector, then again to the result, a hundred times. Most vectors swing round
        and grow enormously. Is there any vector that never swings round at all, only grows? Is there one that grows more slowly
        than all the others?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most vectors change direction when a matrix acts on them. A few special ones, the <strong>eigenvectors</strong>, keep
        their direction and are only stretched, by a factor called the <strong>eigenvalue</strong>. Turn x round the circle
        below and watch Ax. Twice in half a turn, Ax lines up with x.
      </p>
      <EigenSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="eigenvalues and eigenvectors">
        <p>
          A number λ is an <strong>eigenvalue</strong> of a square matrix A, with <strong>eigenvector</strong> x ≠ 0, if
        </p>
        <MD>{"A\\mathbf x = \\lambda\\mathbf x."}</MD>
      </Definition>

      <Theorem title="the characteristic equation">
        <p>λ is an eigenvalue of A exactly when</p>
        <MD>{"\\det(A - \\lambda I) = 0."}</MD>
        <p>
          The left side is a polynomial of degree n in λ, so an n × n matrix has n eigenvalues, counted with multiplicity,
          possibly complex.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"A\\mathbf x = \\lambda\\mathbf x"}</M> with x ≠ 0 says <M>{"(A - \\lambda I)\\mathbf x = \\mathbf 0"}</M> has a
          non-zero solution, which is exactly when <M>{"A - \\lambda I"}</M> is singular.
        </p>
      </Proof>

      <Example title="the puzzle">
        <MD>{"\\det\\begin{bmatrix} 4 - \\lambda & 1 \\\\ 2 & 3 - \\lambda \\end{bmatrix} = \\lambda^2 - 7\\lambda + 10 = (\\lambda - 5)(\\lambda - 2)."}</MD>
        <p>
          For λ = 5, (A − 5I)x = 0 gives x = (1, 1). For λ = 2, x = (1, −2). Applying A a hundred times multiplies (1, 1) by{" "}
          <M>{"5^{100}"}</M> and (1, −2) by <M>{"2^{100}"}</M>, without turning either. Every other vector is a combination of
          the two, and the <M>{"5^{100}"}</M> part swamps the rest, which is why they all swing towards the direction (1, 1).
        </p>
      </Example>

      <Theorem title="trace and determinant">
        <p>
          The sum of the eigenvalues is the trace (the sum of the diagonal entries), and their product is the determinant. For
          a triangular matrix, the eigenvalues are the diagonal entries.
        </p>
      </Theorem>

      <Theorem title="eigenvalues of related matrices">
        <p>
          If <M>{"A\\mathbf x = \\lambda\\mathbf x"}</M>, then <M>{"A^k\\mathbf x = \\lambda^k\\mathbf x"}</M>,{" "}
          <M>{"(A + cI)\\mathbf x = (\\lambda + c)\\mathbf x"}</M>, and, if A is invertible,{" "}
          <M>{"A^{-1}\\mathbf x = \\lambda^{-1}\\mathbf x"}</M>.
        </p>
      </Theorem>

      <Example title="no real eigenvectors">
        <p>
          A rotation by 90° turns every vector, so it has no real eigenvectors. Its characteristic equation is{" "}
          <M>{"\\lambda^2 + 1 = 0"}</M>, with eigenvalues ±i. Complex eigenvalues signal rotation.
        </p>
      </Example>

      <Remark title="computing eigenvalues">
        <p>
          No formula exists for the roots of a general polynomial of degree 5 or more, so eigenvalues of large matrices are
          always computed iteratively. The simplest method is the puzzle itself: multiply by A again and again, and the vector
          lines up with the eigenvector of largest |λ|. This is power iteration.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "def",
      rung: "check",
      prompt: <p>A x = 3x for some x ≠ 0. What can you conclude?</p>,
      answer: { kind: "choice", options: ["3 is an eigenvalue of A and x is an eigenvector", "A = 3I", "det A = 3", "x = 0"], correct: [0] },
    },
    {
      key: "tri",
      rung: "check",
      prompt: <p>Find the larger eigenvalue of the triangular matrix with rows (2, 5) and (0, 7).</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "sym",
      rung: "apply",
      prompt: <p>Find the larger eigenvalue of the matrix with rows (2, 1) and (1, 2).</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "trdet",
      rung: "apply",
      prompt: <p>Find the smaller eigenvalue of the matrix with rows (5, 2) and (2, 2), using the trace and determinant.</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "vec",
      rung: "apply",
      prompt: <p>Which vector is an eigenvector of A = [[4, 1], [2, 3]] with eigenvalue 2?</p>,
      answer: { kind: "choice", options: ["(1, −2)", "(1, 1)", "(2, 1)", "(1, 2)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[4.0, 1.0], [2.0, 3.0]])
x = np.array([1.0, 0.0])
for _ in range(50):
    x = A @ x
    x = x / np.linalg.norm(x)
print(x @ A @ x)`}</Code>
          <p>What does this print, to the nearest whole number?</p>
        </>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "indep",
      rung: "prove",
      prompt: (
        <p>
          Prove that eigenvectors <M>{"\\mathbf x_1, \\mathbf x_2"}</M> belonging to different eigenvalues{" "}
          <M>{"\\lambda_1 \\ne \\lambda_2"}</M> are linearly independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes c₁x₁ + c₂x₂ = 0.",
          "Applies A to get c₁λ₁x₁ + c₂λ₂x₂ = 0, and subtracts λ₂ times the original equation.",
          "Obtains c₁(λ₁ − λ₂)x₁ = 0, so c₁ = 0 since λ₁ ≠ λ₂ and x₁ ≠ 0; then c₂ = 0 similarly.",
        ],
      },
    },
    {
      key: "rot",
      rung: "stretch",
      prompt: <p>How many real eigenvalues does the 90° rotation matrix with rows (0, −1) and (1, 0) have?</p>,
      answer: { kind: "numeric", value: 0 },
    },
  ],

  teachBack:
    "Explain to a friend what an eigenvector and eigenvalue are, how det(A − λI) = 0 finds them, and why repeatedly applying a matrix turns almost every vector towards the eigenvector with the largest eigenvalue.",

  glimpse: (
    <p>
      Next, diagonalisation: using a basis of eigenvectors, a matrix becomes a list of independent stretches. Numerical Linear
      Algebra and Scientific Computing develops power iteration and the QR algorithm, and Linear Algebra II studies eigenvalues
      through invariant subspaces.
    </p>
  ),
};
