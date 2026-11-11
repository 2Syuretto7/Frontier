import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ChangeBasisViz } from "@/components/viz/ChangeBasisViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.8.2",
  minutes: 60,
  links: {
    requires: ["m3.8.1", "m3.7.2"],
    revisits: ["m3.4.4"],
    foreshadows: ["m6.2.2", "m6.4.1"],
  },

  puzzle: (
    <>
      <p>
        A robot arm reports positions in its own frame, whose axes point along (2, 1) and (−1, 1) in the room. It reports
        that a cup is at (1, 1) in its frame.
      </p>
      <p>
        Where is the cup in room coordinates? And if a map is simple in the robot&rsquo;s frame, what does its matrix look like
        in the room&rsquo;s?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Coordinates are instructions: &ldquo;go this far along the first basis vector, then this far along the second&rdquo;.
        Change the basis and the instructions change, though the point does not. Move the coordinates below on the slanted grid
        and read off the same point&rsquo;s standard coordinates.
      </p>
      <ChangeBasisViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="changing coordinates">
        <p>
          Let the columns of the invertible matrix B be a basis <M>{"\\mathbf b_1, \\dots, \\mathbf b_n"}</M>. If c are the
          coordinates of a vector in this basis and x its standard coordinates, then
        </p>
        <MD>{"\\mathbf x = B\\mathbf c, \\qquad \\mathbf c = B^{-1}\\mathbf x."}</MD>
      </Theorem>
      <Proof>
        <p><M>{"\\mathbf x = c_1\\mathbf b_1 + \\dots + c_n\\mathbf b_n"}</M> is the column picture of Bc.</p>
      </Proof>

      <Theorem title="a map in a new basis">
        <p>If a linear map has matrix A in standard coordinates, its matrix in the basis B is</p>
        <MD>{"A_B = B^{-1}AB."}</MD>
      </Theorem>
      <Proof>
        <p>
          Start with coordinates c. Convert to standard coordinates (Bc), apply the map (ABc), convert back (B⁻¹ABc).
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          B has columns (2, 1) and (−1, 1). The cup is at B(1, 1) = (2 − 1, 1 + 1) = (1, 2) in the room. Conversely,{" "}
          <M>{"B^{-1} = \\tfrac13\\begin{bmatrix} 1 & 1 \\\\ -1 & 2 \\end{bmatrix}"}</M> turns room coordinates into robot
          coordinates.
        </p>
      </Example>

      <Example title="diagonalisation is a change of basis">
        <p>
          If the columns of X are eigenvectors of A, then <M>{"X^{-1}AX = \\Lambda"}</M>: in the eigenvector basis, the map is
          diagonal. For A = [[4, 1], [2, 3]] and eigenvectors (1, 1), (1, −2), the map stretches the first coordinate by 5 and
          the second by 2.
        </p>
      </Example>

      <Theorem title="orthonormal bases">
        <p>
          If the basis is orthonormal, B = Q is orthogonal, so the change of coordinates is{" "}
          <M>{"\\mathbf c = Q^{\\mathsf T}\\mathbf x"}</M>: just dot products, with no inverse to compute. A symmetric matrix
          becomes <M>{"Q^{\\mathsf T}SQ = \\Lambda"}</M>.
        </p>
      </Theorem>

      <Remark title="what does not change">
        <p>
          Similar matrices <M>{"B^{-1}AB"}</M> describe the same map, so they share everything that does not depend on
          coordinates: eigenvalues, determinant, trace and rank. A quantity that changes with the basis is a fact about the
          description, not about the map.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "x",
      rung: "check",
      prompt: <p>B has basis vectors as columns, and c are coordinates in that basis. What are the standard coordinates?</p>,
      answer: { kind: "choice", options: ["Bc", "B⁻¹c", "Bᵀc", "c"], correct: [0] },
    },
    {
      key: "same",
      rung: "check",
      prompt: <p>Which quantities are the same for A and <M>{"B^{-1}AB"}</M>? Select all that apply.</p>,
      answer: { kind: "choice", options: ["Eigenvalues", "Determinant", "The entry in row 1, column 1", "Trace"], correct: [0, 1, 3] },
    },
    {
      key: "toStd",
      rung: "apply",
      prompt: <p>In the basis (2, 1), (−1, 1), a point has coordinates (2, −1). Give its first standard coordinate.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "toB",
      rung: "apply",
      prompt: <p>Find the coordinates of (4, 5) in the basis (2, 1), (−1, 1). Give the second coordinate.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "on",
      rung: "apply",
      prompt: (
        <p>
          Find the coordinates of (3, 1) in the orthonormal basis <M>{"(1, 1)/\\sqrt2"}</M>, <M>{"(1, -1)/\\sqrt2"}</M>. Give the
          first coordinate to three decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 2.828, tolerance: 0.0005 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[4.0, 1.0], [2.0, 3.0]])
X = np.array([[1.0, 1.0], [1.0, -2.0]])
print(np.round(np.linalg.inv(X) @ A @ X, 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[5. 0.] [0. 2.]]", "[[4. 1.] [2. 3.]]", "[[2. 0.] [0. 5.]]", "[[1. 0.] [0. 1.]]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>in_new_basis(A, B)</C>, which returns the matrix of the map A in the basis given by the columns of B,
            that is B⁻¹AB.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_new_basis(A, B):
    return np.asarray(A, float)
`,
        solution: `import numpy as np

def in_new_basis(A, B):
    A, B = np.asarray(A, float), np.asarray(B, float)
    return np.linalg.solve(B, A @ B)
`,
        tests: [
          { name: "eigenbasis", code: `import numpy as np
assert np.allclose(in_new_basis([[4, 1], [2, 3]], [[1, 1], [1, -2]]), [[5, 0], [0, 2]]), 'In the eigenvector basis the map is diagonal.'` },
          { name: "shear", code: `import numpy as np
assert np.allclose(in_new_basis([[1, 1], [0, 1]], [[1, 0], [1, 1]]), [[2, 1], [-1, 0]]), 'Check the order: B⁻¹ A B.'` },
          { name: "invariants", code: `import numpy as np
rng = np.random.default_rng(9)
A = rng.standard_normal((3, 3)); B = rng.standard_normal((3, 3))
M = in_new_basis(A, B)
assert abs(np.trace(M) - np.trace(A)) < 1e-8, 'The trace does not depend on the basis.'` },
        ],
      },
    },
    {
      key: "sim",
      rung: "prove",
      prompt: (
        <p>
          Prove that A and <M>{"B^{-1}AB"}</M> have the same eigenvalues, and describe how their eigenvectors are related.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes det(B⁻¹AB − λI) = det(B⁻¹(A − λI)B) = det(A − λI), so the characteristic polynomials agree.",
          "Alternatively, if Ax = λx then (B⁻¹AB)(B⁻¹x) = B⁻¹Ax = λB⁻¹x.",
          "Concludes the eigenvectors of B⁻¹AB are B⁻¹ times those of A: the same vectors in new coordinates.",
        ],
      },
    },
    {
      key: "newmat",
      rung: "stretch",
      prompt: (
        <p>
          The shear A = [[1, 1], [0, 1]] is written in the basis (1, 1), (0, 1). Find <M>{"B^{-1}AB"}</M> and give its entry in
          row 2, column 1.
        </p>
      ),
      answer: { kind: "numeric", value: -1 },
    },
  ],

  teachBack:
    "Explain to a friend how coordinates change when the basis changes, why a map's matrix becomes B⁻¹AB, and why diagonalisation is just choosing the eigenvector basis.",

  glimpse: (
    <p>
      Next, the singular value decomposition, which allows different bases on the input and output sides and so diagonalises
      every matrix, of any shape. Linear Algebra II derives it from the spectral theorem.
    </p>
  ),
};
