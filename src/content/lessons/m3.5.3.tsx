import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { NormalEqViz } from "@/components/viz/NormalEqViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.5.3",
  minutes: 65,
  links: {
    requires: ["m3.5.2"],
    parallels: ["l1.2.1"],
    applies: ["l1.2.1"],
    foreshadows: ["m9.6.2", "l2.2.1", "m11.3.4"],
  },

  puzzle: (
    <>
      <p>
        You measure a quantity at times 0, 1 and 2 and get 6, 0 and 0. You believe it changes linearly, y = C + Dt. Three
        equations, two unknowns:
      </p>
      <MD>{"C = 6, \\qquad C + D = 0, \\qquad C + 2D = 0."}</MD>
      <p>No line passes through all three points. What is the best line, and what does &ldquo;best&rdquo; mean?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        When Ax = b has no solution, b is not in the column space. The next best thing is to solve{" "}
        <M>{"A\\hat{\\mathbf x} = \\mathbf p"}</M>, where p is the projection of b: the reachable point closest to b. Closest
        means the smallest sum of squared errors. Below, try to beat the solid line with the sliders: you never will. Then move
        the last point and watch how much one outlier drags the fit.
      </p>
      <NormalEqViz />
    </>
  ),

  theory: (
    <>
      <Definition title="least squares">
        <p>
          A <strong>least squares solution</strong> of Ax = b is an <M>{"\\hat{\\mathbf x}"}</M> that minimises{" "}
          <M>{"\\|A\\mathbf x - \\mathbf b\\|^2"}</M>, the sum of the squared errors.
        </p>
      </Definition>

      <Theorem title="the normal equations">
        <p><M>{"\\hat{\\mathbf x}"}</M> is a least squares solution exactly when</p>
        <MD>{"A^{\\mathsf T}A\\,\\hat{\\mathbf x} = A^{\\mathsf T}\\mathbf b."}</MD>
        <p>If the columns of A are independent, the solution is unique.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"A\\mathbf x"}</M> ranges over C(A), and the closest point of C(A) to b is the projection p, characterised by the
          error being perpendicular to C(A): <M>{"A^{\\mathsf T}(\\mathbf b - A\\hat{\\mathbf x}) = \\mathbf 0"}</M>. With
          independent columns, <M>{"A^{\\mathsf T}A"}</M> is invertible.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>A has columns (1, 1, 1) and (0, 1, 2), and b = (6, 0, 0). Then</p>
        <MD>{"A^{\\mathsf T}A = \\begin{bmatrix} 3 & 3 \\\\ 3 & 5 \\end{bmatrix}, \\qquad A^{\\mathsf T}\\mathbf b = \\begin{bmatrix} 6 \\\\ 0 \\end{bmatrix}, \\qquad \\hat C = 5,\\ \\hat D = -3."}</MD>
        <p>
          The best line is y = 5 − 3t. Its errors at t = 0, 1, 2 are 1, −2, 1: they add up to 0 and are perpendicular to (0,
          1, 2), which is the normal equations in words.
        </p>
      </Example>

      <Theorem title="fitting a line">
        <p>For data <M>{"(t_i, y_i)"}</M>, i = 1, …, m, the normal equations for y = C + Dt are</p>
        <MD>{"\\begin{bmatrix} m & \\sum t_i \\\\ \\sum t_i & \\sum t_i^2 \\end{bmatrix}\\begin{bmatrix} C \\\\ D \\end{bmatrix} = \\begin{bmatrix} \\sum y_i \\\\ \\sum t_iy_i \\end{bmatrix}."}</MD>
        <p>The same method fits any model that is linear in its unknown coefficients, such as a parabola C + Dt + Et².</p>
      </Theorem>

      <Remark title="why squares">
        <p>
          Squaring makes the problem a projection with a formula, and it matches maximum likelihood when the errors are Gaussian.
          The price is sensitivity to outliers: an error of 10 costs a hundred times an error of 1, as the visualisation shows.
        </p>
      </Remark>

      <Remark title="in practice">
        <p>
          Forming <M>{"A^{\\mathsf T}A"}</M> squares the sensitivity of the problem to rounding. Libraries solve least squares
          with the QR factorisation of the next lesson, or with the SVD, rather than with the normal equations directly.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "normal",
      rung: "check",
      prompt: <p>Which equation gives the least squares solution of Ax = b?</p>,
      answer: { kind: "choice", options: ["AᵀAx̂ = Aᵀb", "Ax̂ = b", "AAᵀx̂ = b", "x̂ = Aᵀb"], correct: [0] },
    },
    {
      key: "what",
      rung: "check",
      prompt: <p>Fitting y = C + Dt by least squares minimises:</p>,
      answer: {
        kind: "choice",
        options: ["The sum of squared vertical errors", "The sum of perpendicular distances", "The largest error", "The number of points off the line"],
        correct: [0],
      },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: <p>Fit y = C + Dt to the points (0, 6), (1, 0), (2, 0). Give D.</p>,
      answer: { kind: "numeric", value: -3 },
    },
    {
      key: "const",
      rung: "apply",
      prompt: <p>Fit a constant y = C to the data 1, 2, 6 by least squares. Give C.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "origin",
      rung: "apply",
      prompt: <p>Fit a line through the origin, y = Dt, to the points (1, 2), (2, 3), (3, 7). Give D to three decimal places.</p>,
      answer: { kind: "numeric", value: 2.071, tolerance: 0.0005 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
t = np.array([0.0, 1.0, 2.0])
y = np.array([6.0, 0.0, 0.0])
A = np.column_stack([np.ones(3), t])
x = np.linalg.solve(A.T @ A, A.T @ y)
print(x[0] + x[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>fit_line(t, y)</C>, which returns (C, D) for the least squares line y = C + Dt. Build A with a column of
            ones and a column of t, and solve the normal equations.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_line(t, y):
    return 0.0, 0.0
`,
        solution: `import numpy as np

def fit_line(t, y):
    t, y = np.asarray(t, float), np.asarray(y, float)
    A = np.column_stack([np.ones_like(t), t])
    C, D = np.linalg.solve(A.T @ A, A.T @ y)
    return float(C), float(D)
`,
        tests: [
          { name: "puzzle", code: `C, D = fit_line([0, 1, 2], [6, 0, 0])
assert abs(C - 5) < 1e-9 and abs(D + 3) < 1e-9, 'The best line through (0, 6), (1, 0), (2, 0) is y = 5 − 3t.'` },
          { name: "seven points", code: `C, D = fit_line(range(7), [1, 2.2, 2.8, 4.1, 4.9, 6.2, 6.8])
assert abs(D - 0.98214) < 1e-4, 'The slope for the visualisation data is about 0.982.'` },
          { name: "exact line", code: `C, D = fit_line([1, 2, 3, 4], [3, 5, 7, 9])
assert abs(C - 1) < 1e-9 and abs(D - 2) < 1e-9, 'Points on y = 1 + 2t should be fitted exactly.'` },
        ],
      },
    },
    {
      key: "min",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"A^{\\mathsf T}A\\hat{\\mathbf x} = A^{\\mathsf T}\\mathbf b"}</M>, then{" "}
          <M>{"\\|A\\mathbf x - \\mathbf b\\|^2 \\ge \\|A\\hat{\\mathbf x} - \\mathbf b\\|^2"}</M> for every x. Do not assume the
          projection theorem; expand directly.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes Ax − b = A(x − x̂) + (Ax̂ − b).",
          "Shows the cross term is zero: (A(x − x̂))ᵀ(Ax̂ − b) = (x − x̂)ᵀ(AᵀAx̂ − Aᵀb) = 0.",
          "Concludes ‖Ax − b‖² = ‖A(x − x̂)‖² + ‖Ax̂ − b‖² ≥ ‖Ax̂ − b‖².",
        ],
      },
    },
    {
      key: "data",
      rung: "stretch",
      prompt: (
        <p>
          Fit y = C + Dt to the seven points t = 0, 1, …, 6 with y = 1, 2.2, 2.8, 4.1, 4.9, 6.2, 6.8 (the visualisation with no
          outlier). Give D to three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.982, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend what least squares minimises, why its solution comes from projecting b onto the column space, and how the normal equations express that the errors are perpendicular to the columns.",

  glimpse: (
    <p>
      Next, Gram-Schmidt and the QR factorisation, which make projections and least squares simple and numerically safe.
      Mathematical Statistics treats regression as projection with noise, and Statistical Machine Learning derives linear
      regression from maximum likelihood.
    </p>
  ),
};
