import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SvdStepsViz } from "@/components/viz/SvdStepsViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.8.3",
  minutes: 70,
  links: {
    requires: ["m3.7.4", "m3.8.2"],
    revisits: ["m3.4.5"],
    foreshadows: ["m6.4.1", "m6.4.5", "l2.6.1"],
  },

  puzzle: (
    <>
      <p>
        Diagonalisation needs a square matrix with enough eigenvectors, and even then the eigenvectors need not be
        perpendicular. A rectangular 1000 × 50 data matrix has no eigenvalues at all.
      </p>
      <p>
        Is there a way to make every matrix diagonal, of any shape, using perpendicular axes? What would the diagonal entries
        mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every matrix maps the unit circle to an ellipse. The <strong>singular value decomposition</strong> says how: rotate
        (Vᵀ), stretch along the axes (Σ), rotate again (U). The stretches are the <strong>singular values</strong>. Step through
        the three moves below for A = [[3, 0], [4, 5]] and watch the perpendicular vectors v₁, v₂ land on the axes of the
        ellipse.
      </p>
      <SvdStepsViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the singular value decomposition">
        <p>Every m × n matrix A of rank r can be written</p>
        <MD>{"A = U\\Sigma V^{\\mathsf T} = \\sigma_1\\mathbf u_1\\mathbf v_1^{\\mathsf T} + \\dots + \\sigma_r\\mathbf u_r\\mathbf v_r^{\\mathsf T},"}</MD>
        <p>
          with <M>{"\\mathbf v_1, \\dots, \\mathbf v_r"}</M> orthonormal in <M>{"\\mathbb R^n"}</M>,{" "}
          <M>{"\\mathbf u_1, \\dots, \\mathbf u_r"}</M> orthonormal in <M>{"\\mathbb R^m"}</M>, and singular values{" "}
          <M>{"\\sigma_1 \\ge \\dots \\ge \\sigma_r > 0"}</M>. Equivalently, <M>{"A\\mathbf v_i = \\sigma_i\\mathbf u_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"A^{\\mathsf T}A"}</M> is symmetric and positive semidefinite, so it has orthonormal eigenvectors{" "}
          <M>{"\\mathbf v_i"}</M> with eigenvalues <M>{"\\sigma_i^2 \\ge 0"}</M>; exactly r are positive, since{" "}
          <M>{"A^{\\mathsf T}A"}</M> has the same null space as A. Set <M>{"\\mathbf u_i = A\\mathbf v_i/\\sigma_i"}</M>. Then{" "}
          <M>{"\\mathbf u_i^{\\mathsf T}\\mathbf u_j = \\mathbf v_i^{\\mathsf T}A^{\\mathsf T}A\\mathbf v_j/(\\sigma_i\\sigma_j) = \\sigma_j^2\\,\\mathbf v_i^{\\mathsf T}\\mathbf v_j/(\\sigma_i\\sigma_j)"}</M>,
          which is 1 if i = j and 0 otherwise. Both sides of the sum agree on every <M>{"\\mathbf v_i"}</M> and send the null
          space to 0, so they are equal.
        </p>
      </Proof>

      <Theorem title="what the pieces are">
        <ul>
          <li><M>{"\\mathbf v_1, \\dots, \\mathbf v_r"}</M> are an orthonormal basis of the row space;</li>
          <li><M>{"\\mathbf u_1, \\dots, \\mathbf u_r"}</M> are an orthonormal basis of the column space;</li>
          <li>the rank is the number of non-zero singular values;</li>
          <li><M>{"\\sigma_1 = \\max_{\\|\\mathbf x\\| = 1}\\|A\\mathbf x\\|"}</M>, the largest stretch.</li>
        </ul>
      </Theorem>

      <Example title="the matrix in the visualisation">
        <p>
          For A = [[3, 0], [4, 5]], <M>{"A^{\\mathsf T}A"}</M> = [[25, 20], [20, 25]] with eigenvalues 45 and 5. So{" "}
          <M>{"\\sigma_1 = \\sqrt{45} \\approx 6.708"}</M> and <M>{"\\sigma_2 = \\sqrt5 \\approx 2.236"}</M>, with{" "}
          <M>{"\\mathbf v_1 = (1, 1)/\\sqrt2"}</M> and <M>{"\\mathbf v_2 = (1, -1)/\\sqrt2"}</M>. The product{" "}
          <M>{"\\sigma_1\\sigma_2 = 15"}</M> is |det A|, as it must be: rotations do not change area.
        </p>
      </Example>

      <Remark title="SVD versus eigenvalues">
        <p>
          For a symmetric positive semidefinite matrix the two decompositions coincide. In general they differ: the eigenvalues
          of [[1, 100], [0, 1]] are both 1, but its singular values are about 100 and 0.01, which tell the truer story of how
          much it stretches and squashes.
        </p>
      </Remark>

      <Remark title="where it is used">
        <p>
          Principal component analysis is the SVD of a centred data matrix. Numerical rank, condition numbers and least squares
          for rank-deficient problems all come from it. The next lesson uses it to compress matrices.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "what",
      rung: "check",
      prompt: <p>The singular values of A are:</p>,
      answer: {
        kind: "choice",
        options: ["The square roots of the eigenvalues of AᵀA", "The eigenvalues of A", "The diagonal entries of A", "The pivots of A"],
        correct: [0],
      },
    },
    {
      key: "rank",
      rung: "check",
      prompt: <p>A 4 × 3 matrix has singular values 5, 2 and 0. What is its rank?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "diag",
      rung: "apply",
      prompt: <p>Find the smaller singular value of [[3, 0], [0, −2]].</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "s1",
      rung: "apply",
      prompt: <p>Find the largest singular value of [[3, 0], [4, 5]] to three decimal places.</p>,
      answer: { kind: "numeric", value: 6.708, tolerance: 0.0005 },
    },
    {
      key: "outer",
      rung: "apply",
      prompt: <p>u has length 2 and v has length 3. What is the largest singular value of <M>{"\\mathbf u\\mathbf v^{\\mathsf T}"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = np.linalg.svd(A)
print(round(s[0] * s[1], 6), round(s[0] ** 2 + s[1] ** 2, 6))`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 65 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = np.linalg.svd(A)
print(np.round(s ** 2, 6), np.round(np.linalg.eigvalsh(A.T @ A)[::-1], 6), round(float(np.prod(s)), 6))`}</Code>
          <p>Singular values of [[3, 0], [4, 5]] against the eigenvalues of AᵀA. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[45.  5.] [45.  5.] 15.0", "[25.  9.] [45.  5.] 15.0", "[45.  5.] [5. 45.] 15.0", "[45.  5.] [45.  5.] 50.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>singular_values(A)</C>, which returns the singular values of A in decreasing order, computed as square roots
            of the eigenvalues of AᵀA (use <C>np.linalg.eigvalsh</C>). Clip tiny negative eigenvalues to 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def singular_values(A):
    return np.sort(np.abs(np.linalg.eigvals(np.asarray(A, float))))[::-1]
`,
        solution: `import numpy as np

def singular_values(A):
    A = np.asarray(A, float)
    lam = np.linalg.eigvalsh(A.T @ A)
    return np.sqrt(np.clip(lam, 0, None))[::-1]
`,
        tests: [
          { name: "lesson", code: `import numpy as np
assert np.allclose(singular_values([[3, 0], [4, 5]]), [np.sqrt(45), np.sqrt(5)]), 'For [[3, 0], [4, 5]] they are √45 and √5.'` },
          { name: "not eigenvalues", code: `import numpy as np
assert np.allclose(singular_values([[1, 100], [0, 1]]), np.linalg.svd([[1, 100], [0, 1]], compute_uv=False)), 'Singular values are not the eigenvalues: [[1, 100], [0, 1]] has eigenvalues 1, 1.'` },
          { name: "rectangular", code: `import numpy as np
A = np.arange(12.0).reshape(4, 3)
assert np.allclose(singular_values(A), np.linalg.svd(A, compute_uv=False), atol=1e-6), 'It should work for a 4 × 3 matrix too.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>svd_via_eigh(A)</C>, a thin SVD built from the eigen-decomposition of AᵀA (for an m × n matrix with m ≥ n and full column rank): V and σ² from <C>np.linalg.eigh</C> sorted decreasingly, and U = AVΣ⁻¹. Return (U, s, Vt). Then write <C>pseudo_inverse(A, tol=1e-10)</C> from <C>np.linalg.svd</C>, inverting only singular values above tol times the largest, and <C>min_norm_solution(A, b)</C>, the least-squares solution of smallest norm, A⁺b.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def svd_via_eigh(A):
    return np.linalg.svd(A, full_matrices=False)

def pseudo_inverse(A, tol=1e-10):
    return np.linalg.inv(A)

def min_norm_solution(A, b):
    return np.linalg.lstsq(A, b, rcond=None)[0] * 0
`,
        solution: `import numpy as np

def svd_via_eigh(A):
    A = np.asarray(A, float)
    w, V = np.linalg.eigh(A.T @ A)
    order = np.argsort(w)[::-1]
    w, V = w[order], V[:, order]
    s = np.sqrt(np.maximum(w, 0))
    U = A @ V / s
    return (U, s, V.T)

def pseudo_inverse(A, tol=1e-10):
    U, s, Vt = np.linalg.svd(np.asarray(A, float), full_matrices=False)
    inv = np.array([1 / x if x > tol * s[0] else 0.0 for x in s])
    return Vt.T @ np.diag(inv) @ U.T

def min_norm_solution(A, b):
    return pseudo_inverse(A) @ np.asarray(b, float)
`,
        tests: [
          { name: "svd", code: `import numpy as np
rng = np.random.default_rng(25)
A = rng.normal(size=(6, 3))
U, s, Vt = svd_via_eigh(A)
assert np.allclose(U * s @ Vt, A) and np.allclose(U.T @ U, np.eye(3)) and np.allclose(s, np.linalg.svd(A, compute_uv=False)), 'A = UΣVᵀ.'` },
          { name: "own svd", code: `import inspect
assert 'svd' not in inspect.getsource(svd_via_eigh).replace('svd_via_eigh', ''), 'Build it from eigh.'` },
          { name: "pinv", code: `import numpy as np
rng = np.random.default_rng(26)
A = rng.normal(size=(5, 2)) @ rng.normal(size=(2, 4))
P = pseudo_inverse(A)
assert np.allclose(P, np.linalg.pinv(A)) and np.allclose(A @ P @ A, A), 'Rank deficient: invert only the non-zero σ.'` },
          { name: "min norm", code: `import numpy as np
A = np.array([[1.0, 1.0]])
x = min_norm_solution(A, [2.0])
assert np.allclose(x, [1, 1]), 'Among x + y = 2 the shortest is (1, 1).'` },
        ],
      },
    },
    {
      key: "orth",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"\\mathbf v_1, \\dots, \\mathbf v_r"}</M> be orthonormal eigenvectors of <M>{"A^{\\mathsf T}A"}</M> with
          positive eigenvalues <M>{"\\sigma_i^2"}</M>. Prove that the vectors <M>{"\\mathbf u_i = A\\mathbf v_i/\\sigma_i"}</M>{" "}
          are orthonormal and lie in the column space of A.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes u_iᵀu_j = v_iᵀAᵀAv_j / (σ_iσ_j) = σ_j² v_iᵀv_j / (σ_iσ_j).",
          "Uses orthonormality of the v's to get 0 for i ≠ j and σ_i²/σ_i² = 1 for i = j.",
          "Notes u_i = A(v_i/σ_i) is A times a vector, so it lies in C(A).",
        ],
      },
    },
    {
      key: "shear",
      rung: "stretch",
      prompt: <p>Find the largest singular value of the shear [[1, 1], [0, 1]] to three decimal places.</p>,
      answer: { kind: "numeric", value: 1.618, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend what the singular value decomposition says, how it splits any matrix into rotate, stretch, rotate, how it is built from the eigenvectors of AᵀA, and why it works for every matrix.",

  glimpse: (
    <p>
      Next, the most useful consequence of the SVD: the best low-rank approximation of a matrix. Linear Algebra II derives the
      SVD from the spectral theorem, and Statistical Machine Learning derives PCA from it.
    </p>
  ),
};
