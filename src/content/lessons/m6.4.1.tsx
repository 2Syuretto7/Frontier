import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SingVsEigViz } from "@/components/viz/SingVsEigViz";
import type { LessonContent } from "@/lib/types";

const SVD = `import numpy as np

def svd_via_eigh(A, tol=1e-10):
    lam, V = np.linalg.eigh(A.T @ A)
    idx = np.argsort(lam)[::-1]
    lam, V = lam[idx], V[:, idx]
    r = int((lam > tol).sum())
    s = np.sqrt(lam[:r])
    U = A @ V[:, :r] / s
    return U, s, V[:, :r].T`;

const POWER = `def top_singular(A, iters=200, seed=0):
    v = np.random.default_rng(seed).normal(size=A.shape[1])
    for _ in range(iters):
        v = A.T @ (A @ v)
        v = v / np.linalg.norm(v)
    u = A @ v
    s = np.linalg.norm(u)
    return float(s), u / s, v

def spectral_normalise(W, iters=200):
    return W / top_singular(W, iters)[0]`;

export const lesson: LessonContent = {
  id: "m6.4.1",
  minutes: 60,
  links: {
    requires: ["m6.3.4", "m6.3.5"],
    revisits: ["m3.8.3"],
    foreshadows: ["m6.4.2", "m6.4.3", "m6.5.2"],
  },

  puzzle: (
    <>
      <p>
        The spectral theorem needs a self-adjoint (or normal) operator on one space. Most matrices in machine learning are
        neither: a weight matrix maps 768 inputs to 3072 outputs, and a data matrix has more rows than columns. Yet every
        matrix, of every shape, has orthonormal bases in which it is diagonal. Where do they come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Whatever T is, <M>{"T^*T"}</M> is positive, so the spectral theorem applies to it. Its orthonormal eigenvectors are
        the input directions that T maps to mutually perpendicular outputs, and the square roots of its eigenvalues say how
        much T stretches each. So T takes an orthonormal basis to an orthogonal one, scaled: rotate, stretch along axes,
        rotate. The stretch factors are the singular values, and they can be very different from the eigenvalues.
      </p>
      <SingVsEigViz />
    </>
  ),

  theory: (
    <>
      <Definition title="singular values">
        <p>
          For T: V → W between finite-dimensional inner product spaces, the singular values of T are the eigenvalues of{" "}
          <M>{"\\sqrt{T^*T}"}</M>, that is the square roots of the eigenvalues of the positive operator{" "}
          <M>{"T^*T"}</M>, listed as <M>{"\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge 0"}</M> with multiplicity (dim V of them).
        </p>
      </Definition>

      <Theorem title="singular value decomposition">
        <p>
          Let T have rank r, with positive singular values <M>{"\\sigma_1 \\ge \\dots \\ge \\sigma_r > 0"}</M>. There are
          orthonormal lists <M>{"e_1, \\dots, e_r"}</M> in V and <M>{"f_1, \\dots, f_r"}</M> in W with
        </p>
        <MD>{"Tv = \\sum_{k=1}^r \\sigma_k \\langle v, e_k\\rangle f_k \\quad\\text{for all } v \\in V."}</MD>
        <p>
          In matrices: <M>{"A = U\\Sigma V^*"}</M> with U (m×r) and V (n×r) having orthonormal columns and{" "}
          <M>{"\\Sigma = \\operatorname{diag}(\\sigma_1, \\dots, \\sigma_r)"}</M>, or, padding with extra orthonormal columns
          and zeros, U and V square unitary and Σ m×n.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"T^*T"}</M> is positive, so it has an orthonormal eigenbasis <M>{"e_1, \\dots, e_n"}</M> of V with eigenvalues{" "}
          <M>{"\\sigma_k^2"}</M>, ordered decreasingly. Then{" "}
          <M>{"\\langle Te_j, Te_k\\rangle = \\langle T^*Te_j, e_k\\rangle = \\sigma_j^2\\langle e_j, e_k\\rangle"}</M>. So the{" "}
          <M>{"Te_k"}</M> are mutually orthogonal, <M>{"\\|Te_k\\| = \\sigma_k"}</M>, and <M>{"Te_k = 0"}</M> exactly when{" "}
          <M>{"\\sigma_k = 0"}</M>. The number of nonzero <M>{"\\sigma_k"}</M> is therefore dim range T = r. Put{" "}
          <M>{"f_k = Te_k/\\sigma_k"}</M> for k ≤ r, an orthonormal list. Finally, for any v,{" "}
          <M>{"Tv = T\\sum_k \\langle v, e_k\\rangle e_k = \\sum_{k \\le r}\\langle v, e_k\\rangle\\sigma_k f_k"}</M>.
        </p>
      </Proof>

      <Theorem title="what the SVD reveals">
        <p>
          With the notation above: <M>{"f_1, \\dots, f_r"}</M> is an orthonormal basis of range T and{" "}
          <M>{"e_{r+1}, \\dots, e_n"}</M> one of null T; <M>{"\\max_{\\|v\\| = 1}\\|Tv\\| = \\sigma_1"}</M>;{" "}
          <M>{"T^*"}</M> has the same nonzero singular values, with the roles of e and f swapped; and for a square matrix,{" "}
          <M>{"|\\det A| = \\sigma_1\\cdots\\sigma_n"}</M> and every eigenvalue satisfies{" "}
          <M>{"\\sigma_n \\le |\\lambda| \\le \\sigma_1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The range and null space statements read off the formula. <M>{"\\|Tv\\|^2 = \\langle T^*Tv, v\\rangle"}</M>, whose
          maximum over unit v is the largest eigenvalue of <M>{"T^*T"}</M>, <M>{"\\sigma_1^2"}</M>, by the Rayleigh quotient.
          Taking adjoints in the formula gives <M>{"T^*w = \\sum_k \\sigma_k\\langle w, f_k\\rangle e_k"}</M>. For the
          determinant, <M>{"|\\det A|^2 = \\det(A^*A) = \\prod\\sigma_k^2"}</M>. If <M>{"Av = \\lambda v"}</M> with{" "}
          <M>{"\\|v\\| = 1"}</M>, then <M>{"|\\lambda| = \\|Av\\|"}</M>, which lies between the minimum and maximum of{" "}
          <M>{"\\|Av\\|"}</M> over unit vectors, <M>{"\\sigma_n"}</M> and <M>{"\\sigma_1"}</M>.
        </p>
      </Proof>
      <p>
        The proof is a construction, and the code below follows it literally. It is fine for exposition but not for serious
        numerical use: forming <M>{"A^\\top A"}</M> squares the ratio <M>{"\\sigma_1/\\sigma_r"}</M>, so small singular
        values are lost to rounding. Library SVDs work on A directly.
      </p>
      <Code>{SVD}</Code>

      <Example title="self-adjoint operators">
        <p>
          If T is self-adjoint with eigenvalues <M>{"\\lambda_k"}</M>, then <M>{"T^*T = T^2"}</M> and the singular values are{" "}
          <M>{"|\\lambda_k|"}</M>; the SVD is the spectral decomposition with signs moved into <M>{"f_k = \\pm e_k"}</M>. For
          non-normal matrices the two sets of numbers can be far apart: the shear above has both eigenvalues equal to 1 and{" "}
          <M>{"\\sigma_1"}</M> as large as you like.
        </p>
      </Example>

      <Remark title="spectral normalisation">
        <p>
          Since <M>{"\\sigma_1 = \\max\\|Wv\\|/\\|v\\|"}</M>, a layer x ↦ Wx is <M>{"\\sigma_1"}</M>-Lipschitz, and dividing W
          by <M>{"\\sigma_1"}</M> makes it 1-Lipschitz. GAN discriminators do this every step, estimating{" "}
          <M>{"\\sigma_1"}</M> by power iteration on <M>{"W^\\top W"}</M>, which never needs <M>{"W^\\top W"}</M> as a
          matrix, only products with W and <M>{"W^\\top"}</M>.
        </p>
        <Code>{POWER}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sigma1",
      rung: "check",
      prompt: <p>What is the largest singular value of A = [[3, 0], [4, 5]]? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 6.7082039, tolerance: 1e-4 },
    },
    {
      key: "det",
      rung: "check",
      prompt: <p>A 2×2 matrix has singular values 4 and 0.5. What is |det A|?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "rank",
      rung: "apply",
      prompt: <p>For any matrix A, which quantity always equals the number of nonzero singular values?</p>,
      answer: {
        kind: "choice",
        options: ["the rank of A", "the number of nonzero eigenvalues of A", "the number of nonzero entries of A", "the dimension of the null space of A"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def svd_via_eigh(A, tol=1e-10):
    lam, V = np.linalg.eigh(A.T @ A)
    idx = np.argsort(lam)[::-1]
    lam, V = lam[idx], V[:, idx]
    r = int((lam > tol).sum())
    s = np.sqrt(lam[:r])
    U = A @ V[:, :r] / s
    return U, s, V[:, :r].T

A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = svd_via_eigh(A)
print(np.round(s, 4), np.allclose(U @ np.diag(s) @ Vt, A), np.allclose(U.T @ U, np.eye(2)))
print(np.round(svd_via_eigh(np.outer([1.0, 2.0], [3.0, 4.0]))[1], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[6.7082 2.2361] True True\n[11.1803]",
          "[5. 3.] True True\n[11.1803]",
          "[6.7082 2.2361] True True\n[11.1803  0.    ]",
          "[45.  5.] True True\n[125.]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def top_singular(A, iters=200, seed=0):
    v = np.random.default_rng(seed).normal(size=A.shape[1])
    for _ in range(iters):
        v = A.T @ (A @ v)
        v = v / np.linalg.norm(v)
    u = A @ v
    s = np.linalg.norm(u)
    return float(s), u / s, v

def spectral_normalise(W, iters=200):
    return W / top_singular(W, iters)[0]

A = np.array([[3.0, 0.0], [4.0, 5.0]])
s1, u, v = top_singular(A)
print(round(s1, 4), np.round(np.linalg.svd(spectral_normalise(A), compute_uv=False), 4))
print(np.sort(np.abs(np.linalg.eigvals(A))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.7082 [1.     0.3333]\n[3. 5.]",
          "5.0 [1.  0.6]\n[3. 5.]",
          "6.7082 [1.     0.3333]\n[2.2361 6.7082]",
          "6.7082 [6.7082 2.2361]\n[3. 5.]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>svd_via_eigh(A, tol=1e-10)</C> following the proof: diagonalise AᵀA with <C>np.linalg.eigh</C>, sort the
          eigenvalues decreasingly, keep the r of them above tol, and return the thin factors (U, s, Vt) with U m×r, s of
          length r, Vt r×n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def svd_via_eigh(A, tol=1e-10):
    lam, V = np.linalg.eigh(A.T @ A)
    return A @ V, lam, V.T
`,
        solution: SVD,
        tests: [
          { name: "reconstruct", code: `A = np.array([[3.0, 0.0], [4.0, 5.0]])
U, s, Vt = svd_via_eigh(A)
assert np.allclose(s, [45 ** 0.5, 5 ** 0.5]) and np.allclose(U @ np.diag(s) @ Vt, A)
B = np.random.default_rng(0).normal(size=(5, 3))
U, s, Vt = svd_via_eigh(B)
assert U.shape == (5, 3) and np.allclose(U.T @ U, np.eye(3)) and np.allclose(Vt @ Vt.T, np.eye(3))
assert np.allclose(s, np.linalg.svd(B, compute_uv=False))` },
          { name: "rank deficient", code: `C = np.outer([1.0, 2.0, 2.0], [3.0, 4.0])
U, s, Vt = svd_via_eigh(C)
assert U.shape == (3, 1) and Vt.shape == (1, 2) and np.allclose(s, [15.0])
assert np.allclose(U @ np.diag(s) @ Vt, C)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>top_singular(A, iters=200, seed=0)</C>: start from a random normal v, repeatedly set v to AᵀAv normalised,
          then return (σ₁, u, v) with u = Av/‖Av‖ and σ₁ = ‖Av‖. Then write <C>spectral_normalise(W, iters=200)</C>,
          returning W/σ₁.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def top_singular(A, iters=200, seed=0):
    return float(np.abs(A).max()), None, None

def spectral_normalise(W, iters=200):
    return W
`,
        solution: `import numpy as np

${POWER}`,
        tests: [
          { name: "top pair", code: `A = np.random.default_rng(1).normal(size=(6, 4))
s1, u, v = top_singular(A)
assert np.isclose(s1, np.linalg.svd(A, compute_uv=False)[0])
assert np.allclose(A @ v, s1 * u) and np.allclose(A.T @ u, s1 * v, atol=1e-6)
assert np.isclose(np.linalg.norm(u), 1) and np.isclose(np.linalg.norm(v), 1)` },
          { name: "normalise", code: `W = np.array([[3.0, 0.0], [4.0, 5.0]])
N = spectral_normalise(W)
assert np.isclose(np.linalg.svd(N, compute_uv=False)[0], 1.0)
assert np.allclose(N * 45 ** 0.5, W)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let e₁, …, eₙ be an orthonormal eigenbasis of T*T with eigenvalues σ₁², …, σₙ². Prove that the vectors Teₖ/σₖ, for
          the k with σₖ &gt; 0, form an orthonormal list, and that Teₖ = 0 when σₖ = 0.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes ⟨Teⱼ, Teₖ⟩ = ⟨T*Teⱼ, eₖ⟩ = σⱼ²⟨eⱼ, eₖ⟩ using the adjoint.",
          "Concludes the Teₖ are mutually orthogonal with ‖Teₖ‖ = σₖ, so dividing by σₖ > 0 gives unit vectors, and ‖Teₖ‖ = 0 forces Teₖ = 0 when σₖ = 0.",
        ],
      },
    },
    {
      key: "shear",
      rung: "stretch",
      prompt: <p>What is the largest singular value of the shear [[1, 2], [0, 1]]? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.4142136, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend how the spectral theorem applied to T*T produces the singular value decomposition of any linear map, and why singular values and eigenvalues can differ so much.",

  glimpse: (
    <>
      <p>
        Grouping the SVD differently gives the polar decomposition, T = S√(T*T) with S an isometry, the matrix version of
        writing a complex number as a unit number times its modulus. That is next.
      </p>
      <p>
        Truncating the sum after k terms gives the best rank-k approximation in both the spectral and the Frobenius norm
        (Eckart–Young), and inverting only the nonzero <M>{"\\sigma_k"}</M> gives the pseudoinverse. Both are a few lessons
        away, along with PCA, which is the SVD of a centred data matrix.
      </p>
    </>
  ),
};
