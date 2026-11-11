import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { QuadFormViz } from "@/components/viz/QuadFormViz";
import { Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.5",
  minutes: 65,
  links: {
    requires: ["m3.7.4"],
    revisits: ["m3.3.4"],
    foreshadows: ["m5.5.3", "m7.5.3", "m10.2.2", "m11.3.2"],
  },

  puzzle: (
    <>
      <p>
        A loss function near a critical point looks like <M>{"f(x, y) = 2x^2 + 2bxy + 2y^2"}</M>. For b = 1 the point is the
        bottom of a bowl. For b = 3 a ball placed there rolls away in some directions.
      </p>
      <p>At exactly which value of b does the bowl turn into a saddle, and how could you tell for a function of a million variables?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The quadratic form <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x"}</M> is a bowl when every eigenvalue of S is positive: its
        level curves are ellipses. When an eigenvalue turns negative, the level curves become hyperbolas and the origin is a
        saddle. Move the sliders and watch the eigenvalues, the pivots and the shape change together.
      </p>
      <QuadFormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="positive definite">
        <p>
          A symmetric matrix S is <strong>positive definite</strong> if <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x > 0"}</M> for
          every x ≠ 0, and <strong>positive semidefinite</strong> if <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x \\ge 0"}</M> for
          every x.
        </p>
      </Definition>

      <Theorem title="five equivalent tests">
        <p>For symmetric S, each of these is equivalent to positive definiteness:</p>
        <ol>
          <li>every eigenvalue is positive;</li>
          <li>every pivot in elimination is positive;</li>
          <li>every upper-left determinant is positive;</li>
          <li><M>{"\\mathbf x^{\\mathsf T}S\\mathbf x > 0"}</M> for every x ≠ 0;</li>
          <li><M>{"S = A^{\\mathsf T}A"}</M> for some A with independent columns.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          (1 ⇔ 4) With <M>{"S = Q\\Lambda Q^{\\mathsf T}"}</M> and <M>{"\\mathbf y = Q^{\\mathsf T}\\mathbf x"}</M>,{" "}
          <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x = \\sum \\lambda_iy_i^2"}</M>, positive for all y ≠ 0 exactly when every{" "}
          <M>{"\\lambda_i > 0"}</M>. (5 ⇒ 4) <M>{"\\mathbf x^{\\mathsf T}A^{\\mathsf T}A\\mathbf x = \\|A\\mathbf x\\|^2 > 0"}</M>{" "}
          when Ax ≠ 0. (1 ⇒ 5) Take <M>{"A = \\Lambda^{1/2}Q^{\\mathsf T}"}</M>. For 2 and 3, the k-th pivot is the ratio of the
          k-th to the (k − 1)-th upper-left determinant.
        </p>
      </Proof>

      <Example title="the 2 × 2 test">
        <p>
          S = [[a, b], [b, c]] is positive definite exactly when a &gt; 0 and <M>{"ac - b^2 > 0"}</M>. Completing the square
          shows why:
        </p>
        <MD>{"ax^2 + 2bxy + cy^2 = a\\Bigl(x + \\tfrac{b}{a}y\\Bigr)^2 + \\Bigl(c - \\tfrac{b^2}{a}\\Bigr)y^2,"}</MD>
        <p>and the two coefficients are the pivots.</p>
      </Example>

      <Example title="the puzzle">
        <p>
          f = <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x"}</M> with S = [[2, b], [b, 2]]. The test is <M>{"4 - b^2 > 0"}</M>, so the
          bowl becomes a saddle at |b| = 2. At b = 2 exactly, S is semidefinite: the bowl is flat along (1, −1). For a million
          variables, compute the pivots by elimination, or the smallest eigenvalue by an iterative method.
        </p>
      </Example>

      <Theorem title="Cholesky">
        <p>
          A positive definite S factors as <M>{"S = LL^{\\mathsf T}"}</M> with L lower triangular with positive diagonal. It is
          LU with the symmetry exploited, at half the cost.
        </p>
      </Theorem>

      <Remark title="where they appear">
        <p>
          Covariance matrices are positive semidefinite. The Hessian of a function at a minimum is positive semidefinite, and if
          it is positive definite the minimum is strict. A function is convex when its Hessian is positive semidefinite
          everywhere. Kernel matrices in machine learning must be positive semidefinite.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tests",
      rung: "check",
      prompt: <p>Which of these show that a symmetric matrix S is positive definite? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["All eigenvalues are positive", "All pivots are positive", "All entries are positive", "xᵀSx > 0 for every x ≠ 0"],
        correct: [0, 1, 3],
      },
    },
    {
      key: "pd",
      rung: "check",
      prompt: <p>Is [[2, 1], [1, 2]] positive definite?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "b",
      rung: "apply",
      prompt: <p>[[1, b], [b, 4]] is positive definite for |b| below some value. What is that value?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "pivot",
      rung: "apply",
      prompt: <p>Find the second pivot of [[4, 2], [2, 3]].</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which matrices are positive definite? Rows are separated by semicolons. Select all that apply.</p>,
      answer: { kind: "choice", options: ["[2 −1; −1 2]", "[1 2; 2 1]", "[1 0; 0 0]", "[5 2; 2 1]"], correct: [0, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
for b in [0.5, 1.5, 2.5]:
    S = np.array([[1.0, b], [b, 4.0]])
    try:
        np.linalg.cholesky(S)
        print("yes")
    except np.linalg.LinAlgError:
        print("no")`}</Code>
          <p>Cholesky fails unless the matrix is positive definite. What does this print, line by line?</p>
        </>
      ),
      answer: { kind: "choice", options: ["yes yes no", "yes no no", "yes yes yes", "no no yes"], correct: [0] },
    },
    {
      key: "ata",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"A^{\\mathsf T}A"}</M> is positive semidefinite for every matrix A, and positive definite exactly when
          the columns of A are independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes AᵀA is symmetric.",
          "Computes xᵀAᵀAx = (Ax)ᵀ(Ax) = ‖Ax‖² ≥ 0.",
          "Observes ‖Ax‖² = 0 exactly when Ax = 0, so positivity for every x ≠ 0 means N(A) = {0}, that is, independent columns.",
        ],
      },
    },
    {
      key: "tri",
      rung: "stretch",
      prompt: (
        <p>
          Find the smallest eigenvalue of the 3 × 3 matrix with 2 on the diagonal, −1 just above and below it, and 0 elsewhere.
          Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.586, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what a positive definite matrix is, the different ways to test for it, and why it decides whether a critical point is a bowl or a saddle.",

  glimpse: (
    <p>
      Next chapter: linear transformations, and finally the singular value decomposition. Multivariable and Matrix Calculus
      classifies critical points by the Hessian, Probability builds covariance matrices, and Convex Optimisation tests
      convexity with positive semidefinite Hessians.
    </p>
  ),
};
