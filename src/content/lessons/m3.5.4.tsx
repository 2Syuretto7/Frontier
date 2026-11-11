import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GramSchmidtViz } from "@/components/viz/GramSchmidtViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.5.4",
  minutes: 65,
  links: {
    requires: ["m3.5.2", "m3.4.4"],
    foreshadows: ["m11.3.3", "m11.7.4", "m14.3.4"],
  },

  puzzle: (
    <>
      <p>
        In the standard basis, the coordinates of a vector are just its entries. In the basis (3, 1), (1, 2), finding the
        coordinates of (5, 5) means solving a system of equations.
      </p>
      <p>
        Is there a kind of basis where finding coordinates is as easy as in the standard basis, a single dot product per
        coordinate? And can any basis be turned into one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An <strong>orthonormal</strong> basis has vectors of length 1 at right angles to each other. Gram-Schmidt builds one
        from any basis: keep the first direction, then remove from each new vector its components along the directions already
        chosen, and rescale what is left. Step through it below.
      </p>
      <GramSchmidtViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthonormal vectors and orthogonal matrices">
        <p>
          Vectors <M>{"\\mathbf q_1, \\dots, \\mathbf q_n"}</M> are <strong>orthonormal</strong> if{" "}
          <M>{"\\mathbf q_i \\cdot \\mathbf q_j"}</M> is 1 when i = j and 0 otherwise. A matrix Q with orthonormal columns
          satisfies <M>{"Q^{\\mathsf T}Q = I"}</M>. If Q is also square, it is an <strong>orthogonal matrix</strong> and{" "}
          <M>{"Q^{-1} = Q^{\\mathsf T}"}</M>.
        </p>
      </Definition>

      <Theorem title="easy coordinates, preserved lengths">
        <p>
          If <M>{"\\mathbf q_1, \\dots, \\mathbf q_n"}</M> is an orthonormal basis, then{" "}
          <M>{"\\mathbf v = \\sum (\\mathbf q_i \\cdot \\mathbf v)\\,\\mathbf q_i"}</M>. If <M>{"Q^{\\mathsf T}Q = I"}</M>, then{" "}
          <M>{"\\|Q\\mathbf x\\| = \\|\\mathbf x\\|"}</M> and <M>{"Q\\mathbf x \\cdot Q\\mathbf y = \\mathbf x \\cdot \\mathbf y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Dot <M>{"\\mathbf v = \\sum c_i\\mathbf q_i"}</M> with <M>{"\\mathbf q_j"}</M>: all terms but one vanish, leaving{" "}
          <M>{"c_j"}</M>. And <M>{"(Q\\mathbf x)^{\\mathsf T}Q\\mathbf y = \\mathbf x^{\\mathsf T}Q^{\\mathsf T}Q\\mathbf y = \\mathbf x^{\\mathsf T}\\mathbf y"}</M>.
        </p>
      </Proof>

      <Definition title="Gram-Schmidt">
        <p>Given independent <M>{"\\mathbf a_1, \\dots, \\mathbf a_n"}</M>, for j = 1, 2, …, n:</p>
        <MD>{"\\mathbf A_j = \\mathbf a_j - \\sum_{i < j} (\\mathbf q_i \\cdot \\mathbf a_j)\\,\\mathbf q_i, \\qquad \\mathbf q_j = \\frac{\\mathbf A_j}{\\|\\mathbf A_j\\|}."}</MD>
        <p>
          Each <M>{"\\mathbf A_j"}</M> is perpendicular to the earlier q&rsquo;s, and is non-zero because the a&rsquo;s are
          independent. The first j q&rsquo;s span the same space as the first j a&rsquo;s.
        </p>
      </Definition>

      <Theorem title="A = QR">
        <p>
          Every matrix A with independent columns factors as A = QR, with Q having orthonormal columns and R upper triangular
          with positive diagonal: <M>{"r_{ij} = \\mathbf q_i \\cdot \\mathbf a_j"}</M> for i &lt; j and{" "}
          <M>{"r_{jj} = \\|\\mathbf A_j\\|"}</M>.
        </p>
      </Theorem>

      <Example title="the visualisation">
        <p>
          With a = (3, 1) and b = (1, 2): <M>{"\\mathbf q_1 = (3, 1)/\\sqrt{10}"}</M>,{" "}
          <M>{"\\mathbf q_1 \\cdot \\mathbf b = 5/\\sqrt{10}"}</M>, B = b − (1/2)a = (−0.5, 1.5), and{" "}
          <M>{"\\mathbf q_2 = (-1, 3)/\\sqrt{10}"}</M>. So
        </p>
        <MD>{"\\begin{bmatrix} 3 & 1 \\\\ 1 & 2 \\end{bmatrix} = \\frac{1}{\\sqrt{10}}\\begin{bmatrix} 3 & -1 \\\\ 1 & 3 \\end{bmatrix}\\begin{bmatrix} \\sqrt{10} & 5/\\sqrt{10} \\\\ 0 & 5/\\sqrt{10} \\end{bmatrix}."}</MD>
      </Example>

      <Theorem title="least squares with QR">
        <p>
          If A = QR, the normal equations become <M>{"R\\hat{\\mathbf x} = Q^{\\mathsf T}\\mathbf b"}</M>, a triangular system,
          and the projection is <M>{"\\mathbf p = QQ^{\\mathsf T}\\mathbf b"}</M>.
        </p>
      </Theorem>

      <Remark title="orthogonality in modern training">
        <p>
          Orthogonal matrices preserve lengths, so stacking them neither explodes nor shrinks signals. Some optimisers
          orthogonalise their update matrices at every step, and Optimisation for Deep Learning studies one, Muon, in detail.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "qtq",
      rung: "check",
      prompt: <p>Q has orthonormal columns. What is <M>{"Q^{\\mathsf T}Q"}</M>?</p>,
      answer: { kind: "choice", options: ["I", "Q", "0", "QQᵀ"], correct: [0] },
    },
    {
      key: "coord",
      rung: "check",
      prompt: <p>In an orthonormal basis <M>{"\\mathbf q_1, \\dots, \\mathbf q_n"}</M>, the i-th coordinate of v is:</p>,
      answer: { kind: "choice", options: ["qᵢ · v", "‖v‖", "vᵢ, the i-th entry of v", "1 / (qᵢ · v)"], correct: [0] },
    },
    {
      key: "gs",
      rung: "apply",
      prompt: <p>Apply Gram-Schmidt to a = (1, 1, 0) and b = (1, 0, 1). Give the third entry of <M>{"\\mathbf q_2"}</M> to three decimal places.</p>,
      answer: { kind: "numeric", value: 0.816, tolerance: 0.001 },
    },
    {
      key: "r22",
      rung: "apply",
      prompt: <p>In A = QR for A with columns (3, 1) and (1, 2), find <M>{"r_{22}"}</M> to three decimal places.</p>,
      answer: { kind: "numeric", value: 1.581, tolerance: 0.0005 },
    },
    {
      key: "ls",
      rung: "apply",
      prompt: <p>If A = QR, which system gives the least squares solution of Ax = b?</p>,
      answer: { kind: "choice", options: ["Rx̂ = Qᵀb", "Qx̂ = Rᵀb", "QRx̂ = b exactly", "Rᵀx̂ = Qb"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[3.0, 1.0], [1.0, 2.0]])
Q, R = np.linalg.qr(A)
print(np.round(Q.T @ Q, 6)[0, 1], np.round(abs(R[0, 0]) ** 2, 6))`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gram_schmidt(A)</C>, which returns Q whose columns are the orthonormal vectors produced by Gram-Schmidt on
            the columns of A (assumed independent). Do not call <C>np.linalg.qr</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gram_schmidt(A):
    A = np.asarray(A, float)
    return A.copy()
`,
        solution: `import numpy as np

def gram_schmidt(A):
    A = np.asarray(A, float)
    Q = np.zeros_like(A)
    for j in range(A.shape[1]):
        v = A[:, j] - Q[:, :j] @ (Q[:, :j].T @ A[:, j])
        Q[:, j] = v / np.linalg.norm(v)
    return Q
`,
        tests: [
          { name: "two vectors", code: `import numpy as np
Q = gram_schmidt([[3, 1], [1, 2]])
assert np.allclose(Q[:, 0], np.array([3, 1]) / np.sqrt(10)), 'q₁ should be a divided by its length.'
assert np.allclose(Q[:, 1], np.array([-1, 3]) / np.sqrt(10)), 'q₂ should be (−1, 3)/√10.'` },
          { name: "orthonormal", code: `import numpy as np
rng = np.random.default_rng(6)
A = rng.standard_normal((5, 3))
Q = gram_schmidt(A)
assert np.allclose(Q.T @ Q, np.eye(3)), 'The columns of Q must be orthonormal.'` },
          { name: "same span", code: `import numpy as np
rng = np.random.default_rng(6)
A = rng.standard_normal((5, 3))
Q = gram_schmidt(A)
R = Q.T @ A
assert np.allclose(Q @ R, A) and np.allclose(np.tril(R, -1), 0), 'A should equal QR with R upper triangular.'` },
        ],
      },
    },
    {
      key: "iso",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"Q^{\\mathsf T}Q = I"}</M>, then Q preserves lengths and angles. Then prove that the product of
          two orthogonal n × n matrices is orthogonal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes (Qx)ᵀ(Qy) = xᵀQᵀQy = xᵀy, so dot products are preserved.",
          "Deduces lengths (x = y) and angles (cosine formula) are preserved.",
          "Computes (Q₁Q₂)ᵀ(Q₁Q₂) = Q₂ᵀQ₁ᵀQ₁Q₂ = Q₂ᵀQ₂ = I.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Apply Gram-Schmidt to (1, 1, 1), (0, 1, 1), (0, 0, 1). Give the third entry of <M>{"\\mathbf q_3"}</M> to three decimal
          places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.707, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend why orthonormal bases make coordinates and projections easy, how Gram-Schmidt builds one from any basis, and how the process is recorded as A = QR.",

  glimpse: (
    <p>
      Next chapter: determinants, a single number that says whether a matrix is invertible and how it scales volume. Numerical
      Linear Algebra and Scientific Computing computes QR stably with Householder reflections, and Optimisation for Deep
      Learning orthogonalises gradient updates.
    </p>
  ),
};
