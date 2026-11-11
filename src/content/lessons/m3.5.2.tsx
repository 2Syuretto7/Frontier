import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ProjectionViz } from "@/components/viz/ProjectionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.5.2",
  minutes: 60,
  links: {
    requires: ["m3.5.1", "m3.3.3"],
    foreshadows: ["m3.5.3", "m6.6.1", "m9.6.2"],
  },

  puzzle: (
    <>
      <p>
        A stick runs from the origin to b = (2, 3). The ground is the line through the origin in the direction a = (3, 1),
        and light falls at right angles to the ground.
      </p>
      <p>
        Where does its shadow end? More generally: given a vector and a line (or a plane), what is the point of the line closest
        to the vector, and is there a formula?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The closest point p on a line to b is where the error b − p meets the line at a right angle. That single condition
        determines p. Move b below: the dashed error always stays perpendicular to a, and the dot product in the last row of
        the table stays zero.
      </p>
      <ProjectionViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="projection onto a line">
        <p>The projection of b onto the line through a ≠ 0 is</p>
        <MD>{"\\mathbf p = \\hat x\\,\\mathbf a, \\qquad \\hat x = \\frac{\\mathbf a^{\\mathsf T}\\mathbf b}{\\mathbf a^{\\mathsf T}\\mathbf a}, \\qquad \\text{so } \\mathbf p = P\\mathbf b \\text{ with } P = \\frac{\\mathbf a\\mathbf a^{\\mathsf T}}{\\mathbf a^{\\mathsf T}\\mathbf a}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The error <M>{"\\mathbf b - \\hat x\\mathbf a"}</M> must be perpendicular to a:{" "}
          <M>{"\\mathbf a^{\\mathsf T}(\\mathbf b - \\hat x\\mathbf a) = 0"}</M>, which gives <M>{"\\hat x"}</M>.
        </p>
      </Proof>

      <Theorem title="projection onto a subspace">
        <p>
          Let A have independent columns. The projection of b onto C(A) is <M>{"\\mathbf p = A\\hat{\\mathbf x}"}</M>, where
        </p>
        <MD>{"A^{\\mathsf T}A\\,\\hat{\\mathbf x} = A^{\\mathsf T}\\mathbf b, \\qquad P = A(A^{\\mathsf T}A)^{-1}A^{\\mathsf T}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The error <M>{"\\mathbf e = \\mathbf b - A\\hat{\\mathbf x}"}</M> must be perpendicular to every column of A, that
          is, <M>{"A^{\\mathsf T}\\mathbf e = \\mathbf 0"}</M>. This is the equation above. <M>{"A^{\\mathsf T}A"}</M> is
          invertible: if <M>{"A^{\\mathsf T}A\\mathbf x = \\mathbf 0"}</M> then <M>{"\\|A\\mathbf x\\|^2 = \\mathbf x^{\\mathsf T}A^{\\mathsf T}A\\mathbf x = 0"}</M>,
          so Ax = 0 and x = 0 by independence.
        </p>
      </Proof>

      <Theorem title="p is the closest point">
        <p>For every y in C(A), <M>{"\\|\\mathbf b - \\mathbf y\\| \\ge \\|\\mathbf b - \\mathbf p\\|"}</M>, with equality only when y = p.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbf b - \\mathbf y = (\\mathbf b - \\mathbf p) + (\\mathbf p - \\mathbf y)"}</M>; the first piece is
          perpendicular to C(A) and the second lies in it, so Pythagoras gives{" "}
          <M>{"\\|\\mathbf b - \\mathbf y\\|^2 = \\|\\mathbf b - \\mathbf p\\|^2 + \\|\\mathbf p - \\mathbf y\\|^2"}</M>.
        </p>
      </Proof>

      <Theorem title="properties of a projection matrix">
        <p>
          <M>{"P^2 = P"}</M> (projecting twice changes nothing) and <M>{"P^{\\mathsf T} = P"}</M>. Also I − P projects onto
          the orthogonal complement.
        </p>
      </Theorem>

      <Example title="the puzzle">
        <p>
          With a = (3, 1) and b = (2, 3), <M>{"\\hat x = (6 + 3)/10 = 0.9"}</M> and p = (2.7, 0.9). The error (−0.7, 2.1) has
          dot product −2.1 + 2.1 = 0 with a.
        </p>
      </Example>

      <Example title="onto a plane">
        <p>
          Project b = (6, 0, 0) onto the column space of A with columns (1, 1, 1) and (0, 1, 2).{" "}
          <M>{"A^{\\mathsf T}A"}</M> = [[3, 3], [3, 5]] and <M>{"A^{\\mathsf T}\\mathbf b"}</M> = (6, 0), so{" "}
          <M>{"\\hat{\\mathbf x}"}</M> = (5, −3), p = (5, 2, −1) and e = (1, −2, 1), which is perpendicular to both columns.
        </p>
      </Example>

      <Remark title="projections everywhere">
        <p>
          Least squares, the next lesson, is a projection. So is the conditional expectation in probability, the best estimate
          of one variable from others. Attention in a transformer computes something that resembles a soft projection onto the
          values.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "formula",
      rung: "check",
      prompt: <p>What is the projection of b onto the line through a?</p>,
      answer: { kind: "choice", options: ["(aᵀb / aᵀa) a", "(aᵀb / bᵀb) b", "(aᵀb) a", "b − a"], correct: [0] },
    },
    {
      key: "twice",
      rung: "check",
      prompt: <p>If P is a projection matrix, what is <M>{"P^2"}</M>?</p>,
      answer: { kind: "choice", options: ["P", "I", "0", "2P"], correct: [0] },
    },
    {
      key: "line",
      rung: "apply",
      prompt: <p>Project b = (2, 3) onto the line through a = (3, 1). Give the first entry of p.</p>,
      answer: { kind: "numeric", value: 2.7 },
    },
    {
      key: "matrix",
      rung: "apply",
      prompt: <p>Find the projection matrix onto the line through (1, 2). Give its entry in row 1, column 2.</p>,
      answer: { kind: "numeric", value: 0.4 },
    },
    {
      key: "plane",
      rung: "apply",
      prompt: <p>Project b = (6, 0, 0) onto the column space of A with columns (1, 1, 1) and (0, 1, 2). Give the third entry of p.</p>,
      answer: { kind: "numeric", value: -1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.array([[1.0], [2.0]])
P = a @ a.T / (a.T @ a)
print(np.allclose(P @ P, P), P[1, 1])`}</Code>
          <p>This prints True and a number. What is the number?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.8 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>project(A, b)</C>, which returns the projection of b onto the column space of A (with independent columns),
            by solving the normal equations.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def project(A, b):
    return np.asarray(b, float)
`,
        solution: `import numpy as np

def project(A, b):
    A, b = np.asarray(A, float), np.asarray(b, float)
    xhat = np.linalg.solve(A.T @ A, A.T @ b)
    return A @ xhat
`,
        tests: [
          { name: "line", code: `import numpy as np
assert np.allclose(project([[3], [1]], [2, 3]), [2.7, 0.9]), 'Projecting (2, 3) onto the line through (3, 1) gives (2.7, 0.9).'` },
          { name: "plane", code: `import numpy as np
assert np.allclose(project([[1, 0], [1, 1], [1, 2]], [6, 0, 0]), [5, 2, -1]), 'The lesson’s plane example gives p = (5, 2, −1).'` },
          { name: "error is perpendicular", code: `import numpy as np
rng = np.random.default_rng(5)
A = rng.standard_normal((6, 3)); b = rng.standard_normal(6)
assert np.allclose(A.T @ (b - project(A, b)), 0), 'The error b − p must be perpendicular to every column.'` },
        ],
      },
    },
    {
      key: "props",
      rung: "prove",
      prompt: (
        <p>
          For A with independent columns, let <M>{"P = A(A^{\\mathsf T}A)^{-1}A^{\\mathsf T}"}</M>. Prove that{" "}
          <M>{"P^2 = P"}</M> and <M>{"P^{\\mathsf T} = P"}</M>, and that I − P is also a projection.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Multiplies P·P and cancels the middle (AᵀA)(AᵀA)⁻¹ = I to get P.",
          "Transposes using (XYZ)ᵀ = ZᵀYᵀXᵀ and the symmetry of AᵀA (so its inverse is symmetric) to get P.",
          "Computes (I − P)² = I − 2P + P² = I − P and notes (I − P)ᵀ = I − P.",
        ],
      },
    },
    {
      key: "dist",
      rung: "stretch",
      prompt: (
        <p>
          Find the distance from b = (6, 0, 0) to the plane spanned by (1, 1, 1) and (0, 1, 2). Give three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 2.449, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend how to project a vector onto a line or a subspace, why the error must be perpendicular, and why the projection is the closest point.",

  glimpse: (
    <p>
      Next, least squares: when Ax = b has no solution, solve for the projection instead. Mathematical Statistics reads linear
      regression as exactly this projection, and Linear Algebra II studies projections as operators in their own right.
    </p>
  ),
};
