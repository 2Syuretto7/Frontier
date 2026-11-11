import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SymEllipseViz } from "@/components/viz/SymEllipseViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.4",
  minutes: 65,
  links: {
    requires: ["m3.7.2", "m3.5.4", "m3.3.5"],
    foreshadows: ["m6.3.3", "m6.3.5", "l2.6.1"],
  },

  puzzle: (
    <>
      <p>
        A covariance matrix records how pairs of features vary together, and it is always symmetric. Principal component
        analysis looks for the directions in which the data varies most.
      </p>
      <p>
        Why should those directions be at right angles to each other? Could the best direction and the second best direction
        be at 60°?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A symmetric matrix maps the unit circle to an ellipse, and its eigenvectors lie along the ellipse&rsquo;s axes, which
        are always perpendicular. Move the sliders below; however lopsided the ellipse becomes, the two eigenvector arrows stay
        at a right angle, and the eigenvalues stay real.
      </p>
      <SymEllipseViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the spectral theorem">
        <p>
          A real symmetric matrix S has real eigenvalues, and it has an orthonormal basis of eigenvectors. So
        </p>
        <MD>{"S = Q\\Lambda Q^{\\mathsf T} = \\lambda_1\\mathbf q_1\\mathbf q_1^{\\mathsf T} + \\dots + \\lambda_n\\mathbf q_n\\mathbf q_n^{\\mathsf T},"}</MD>
        <p>with Q orthogonal and Λ real and diagonal.</p>
      </Theorem>
      <Proof>
        <p>
          <strong>Real eigenvalues.</strong> If <M>{"S\\mathbf x = \\lambda\\mathbf x"}</M> with x possibly complex, multiply by{" "}
          <M>{"\\bar{\\mathbf x}^{\\mathsf T}"}</M>: <M>{"\\bar{\\mathbf x}^{\\mathsf T}S\\mathbf x = \\lambda\\,\\bar{\\mathbf x}^{\\mathsf T}\\mathbf x"}</M>.
          The left side equals its own complex conjugate, because S is real and symmetric, and{" "}
          <M>{"\\bar{\\mathbf x}^{\\mathsf T}\\mathbf x = \\sum|x_i|^2 > 0"}</M>, so λ is real.
        </p>
        <p>
          <strong>Perpendicular eigenvectors.</strong> If <M>{"S\\mathbf x = \\lambda\\mathbf x"}</M> and{" "}
          <M>{"S\\mathbf y = \\mu\\mathbf y"}</M> with λ ≠ μ, then{" "}
          <M>{"\\lambda\\,\\mathbf x^{\\mathsf T}\\mathbf y = (S\\mathbf x)^{\\mathsf T}\\mathbf y = \\mathbf x^{\\mathsf T}S\\mathbf y = \\mu\\,\\mathbf x^{\\mathsf T}\\mathbf y"}</M>,
          so <M>{"\\mathbf x^{\\mathsf T}\\mathbf y = 0"}</M>. That repeated eigenvalues still give a full orthonormal set takes a
          longer argument, which Linear Algebra II gives.
        </p>
      </Proof>

      <Example title="a 2 × 2 case">
        <p>
          S = [[2, 1], [1, 2]] has eigenvalues 3 and 1 with unit eigenvectors <M>{"(1, 1)/\\sqrt2"}</M> and{" "}
          <M>{"(1, -1)/\\sqrt2"}</M>, which are perpendicular. As a sum of rank one pieces:
        </p>
        <MD>{"\\begin{bmatrix} 2 & 1 \\\\ 1 & 2 \\end{bmatrix} = 3\\begin{bmatrix} 1/2 & 1/2 \\\\ 1/2 & 1/2 \\end{bmatrix} + 1\\begin{bmatrix} 1/2 & -1/2 \\\\ -1/2 & 1/2 \\end{bmatrix}."}</MD>
      </Example>

      <Theorem title="the Rayleigh quotient">
        <p>
          For symmetric S with eigenvalues <M>{"\\lambda_1 \\ge \\dots \\ge \\lambda_n"}</M>, the largest value of{" "}
          <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x"}</M> over unit vectors is <M>{"\\lambda_1"}</M>, reached at{" "}
          <M>{"\\mathbf q_1"}</M>, and the smallest is <M>{"\\lambda_n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\mathbf x = \\sum c_i\\mathbf q_i"}</M> with <M>{"\\sum c_i^2 = 1"}</M>. Then{" "}
          <M>{"\\mathbf x^{\\mathsf T}S\\mathbf x = \\sum \\lambda_ic_i^2"}</M>, a weighted average of the eigenvalues.
        </p>
      </Proof>

      <Remark title="the puzzle">
        <p>
          The variance of the data along a unit direction x is <M>{"\\mathbf x^{\\mathsf T}C\\mathbf x"}</M> for the covariance
          matrix C. The best direction is the top eigenvector. The second best, among directions uncorrelated with the first, is
          the second eigenvector, and the spectral theorem says it is perpendicular. It could not be at 60°.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "real",
      rung: "check",
      prompt: <p>The eigenvalues of a real symmetric matrix are:</p>,
      answer: { kind: "choice", options: ["Always real", "Always positive", "Always distinct", "Possibly complex"], correct: [0] },
    },
    {
      key: "perp",
      rung: "check",
      prompt: <p>Eigenvectors of a symmetric matrix for different eigenvalues are:</p>,
      answer: { kind: "choice", options: ["Perpendicular", "Parallel", "Of equal length", "Unrelated"], correct: [0] },
    },
    {
      key: "small",
      rung: "apply",
      prompt: <p>Find the smaller eigenvalue of [[2, 1], [1, 2]].</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "five",
      rung: "apply",
      prompt: <p>Find the larger eigenvalue of [[3, 4], [4, −3]].</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "rank1",
      rung: "apply",
      prompt: (
        <p>
          In <M>{"S = 3\\mathbf q_1\\mathbf q_1^{\\mathsf T} + \\mathbf q_2\\mathbf q_2^{\\mathsf T}"}</M> with{" "}
          <M>{"\\mathbf q_1 = (1, 1)/\\sqrt2"}</M>, find the entry in row 1, column 2 of the first term.
        </p>
      ),
      answer: { kind: "numeric", value: 1.5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
S = np.array([[2.0, 1.0], [1.0, 2.0]])
lam, Q = np.linalg.eigh(S)
print(lam[-1], round(abs(Q[:, 0] @ Q[:, 1]), 10))`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>spectral_terms(S)</C>, which returns a list of the rank one matrices λᵢqᵢqᵢᵀ for a symmetric S, using
            <C>np.linalg.eigh</C>. They should add up to S.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def spectral_terms(S):
    return [np.asarray(S, float)]
`,
        solution: `import numpy as np

def spectral_terms(S):
    lam, Q = np.linalg.eigh(np.asarray(S, float))
    return [l * np.outer(Q[:, i], Q[:, i]) for i, l in enumerate(lam)]
`,
        tests: [
          { name: "sum", code: `import numpy as np
S = np.array([[2, 1], [1, 2]], float)
assert np.allclose(sum(spectral_terms(S)), S), 'The terms must add up to S.'` },
          { name: "one per eigenvalue", code: `import numpy as np
S = np.array([[2, 1, 0], [1, 2, 1], [0, 1, 2]], float)
T = spectral_terms(S)
assert len(T) == 3, 'There is one term per eigenvalue.'
assert all(np.linalg.matrix_rank(t) <= 1 for t in T), 'Each term is rank one: λ q qᵀ.'` },
          { name: "lesson", code: `import numpy as np
T = spectral_terms([[2, 1], [1, 2]])
assert any(np.allclose(t, [[1.5, 1.5], [1.5, 1.5]]) for t in T), 'For [[2, 1], [1, 2]] one term is 3 × (1/2)[[1, 1], [1, 1]].'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that eigenvectors of a real symmetric matrix S belonging to different eigenvalues are perpendicular. Point out
          exactly where symmetry is used.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Starts from Sx = λx and Sy = μy with λ ≠ μ.",
          "Computes (Sx)ᵀy = xᵀSᵀy and uses Sᵀ = S to rewrite it as xᵀSy.",
          "Gets λ xᵀy = μ xᵀy, so (λ − μ) xᵀy = 0 and xᵀy = 0.",
        ],
      },
    },
    {
      key: "rayleigh",
      rung: "stretch",
      prompt: <p>Find the largest value of <M>{"2x^2 + 2xy + 2y^2"}</M> over all (x, y) with <M>{"x^2 + y^2 = 1"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what the spectral theorem says about symmetric matrices, why their eigenvalues are real and their eigenvectors perpendicular, and why that makes the directions of principal component analysis perpendicular.",

  glimpse: (
    <p>
      Next, positive definite matrices, the symmetric matrices whose eigenvalues are all positive, which describe bowls,
      covariances and curvature. Linear Algebra II proves the spectral theorem in full and the Courant-Fischer theorem, and
      Statistical Machine Learning derives PCA from it.
    </p>
  ),
};
