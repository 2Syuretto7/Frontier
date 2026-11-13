import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RsvdSpectrumViz } from "@/components/viz/RsvdSpectrumViz";
import type { LessonContent } from "@/lib/types";

const RSVD = `import numpy as np

def range_finder(A, l, q, rng):
    Q, _ = np.linalg.qr(A @ rng.normal(size=(A.shape[1], l)))
    for _ in range(q):
        Q, _ = np.linalg.qr(A.T @ Q)
        Q, _ = np.linalg.qr(A @ Q)
    return Q

def rsvd(A, k, p, q, rng):
    Q = range_finder(A, k + p, q, rng)
    Ub, s, Vt = np.linalg.svd(Q.T @ A, full_matrices=False)
    return (Q @ Ub)[:, :k], s[:k], Vt[:k]

def rel_err(A, U, s, Vt):
    return float(np.linalg.norm(A - (U * s) @ Vt, 2) / np.linalg.norm(A, 2))`;

const POW = `import numpy as np

def with_singular_values(s, m, n, rng):
    U, _ = np.linalg.qr(rng.normal(size=(m, len(s))))
    V, _ = np.linalg.qr(rng.normal(size=(n, len(s))))
    return (U * s) @ V.T

def power_sketch(A, l, q, rng):
    Y = A @ rng.normal(size=(A.shape[1], l))
    for _ in range(q):
        Y = A @ (A.T @ Y)
    return np.linalg.qr(Y)[0]

def proj_error(A, Q):
    return float(np.linalg.norm(A - Q @ (Q.T @ A), 2) / np.linalg.norm(A, 2))`;

export const lesson: LessonContent = {
  id: "m11.6.2",
  minutes: 50,
  links: {
    requires: ["m11.6.1", "m3.8.4"],
    revisits: ["m11.4.2", "m11.3.3"],
    foreshadows: ["m11.6.3"],
  },

  puzzle: (
    <>
      <p>
        The SVD of a 100000 × 50000 matrix costs on the order of 10¹⁴ flops and needs the whole matrix in fast memory, yet
        often you want only its top 20 singular triplets: for PCA, for compressing a weight matrix, for initialising a
        low-rank adapter. Multiply the matrix by 25 random vectors, orthonormalise the 25 results, and do an SVD of a 25 ×
        50000 matrix. The top 20 singular values come out to many digits. How can 25 random guesses find the most
        important directions of a matrix with fifty thousand of them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Multiplying a random vector by A produces a combination of A&apos;s left singular vectors weighted by the singular
        values, so the image is pulled towards the dominant directions. A handful of random vectors, a few more than the
        rank you want, almost surely captures those directions, with an error set by how much weight is left in the tail.
        Once a small orthonormal basis Q for the important part of the range is known, everything else is exact linear
        algebra on the small matrix QᵀA. When the tail is heavy, multiplying by AAᵀ a few more times sharpens the
        spectrum before sketching.
      </p>
      <RsvdSpectrumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="randomised SVD (Halko, Martinsson and Tropp)">
        <p>For target rank k, oversampling p and l = k + p:</p>
        <ol>
          <li>Draw a Gaussian n × l matrix Ω and form Y = AΩ.</li>
          <li>Orthonormalise: Q = qr(Y), an m × l matrix with orthonormal columns.</li>
          <li>Form the small l × n matrix <M>{"B = Q^\\top A"}</M> and its SVD <M>{"B = \\tilde U\\Sigma V^\\top"}</M>.</li>
          <li>Return <M>{"U = Q\\tilde U"}</M>, Σ and V, truncated to rank k.</li>
        </ol>
        <p>
          It costs O(mnl) flops in two passes over A, all of it matrix multiplication. With q power iterations, Y is replaced
          by <M>{"(AA^\\top)^qA\\Omega"}</M>, re-orthonormalising after every product.
        </p>
      </Definition>

      <Theorem title="projection error">
        <p>
          For Q with orthonormal columns, <M>{"QQ^\\top A"}</M> is the closest matrix to A, in the Frobenius norm, whose
          columns lie in range(Q), and
        </p>
        <MD>{"\\|A - QQ^\\top A\\|_F^2 = \\|A\\|_F^2 - \\|Q^\\top A\\|_F^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          Column by column, <M>{"QQ^\\top a_j"}</M> is the orthogonal projection of <M>{"a_j"}</M> onto range(Q), the nearest
          point there. By Pythagoras, <M>{"\\|a_j\\|^2 = \\|QQ^\\top a_j\\|^2 + \\|a_j - QQ^\\top a_j\\|^2"}</M>, and{" "}
          <M>{"\\|QQ^\\top a_j\\| = \\|Q^\\top a_j\\|"}</M> because Q has orthonormal columns. Sum over j. The truncated SVD of B
          then gives the best rank-k approximation of <M>{"QQ^\\top A = QB"}</M>, by the Eckart–Young theorem.
        </p>
      </Proof>

      <Theorem title="expected error">
        <p>With a Gaussian Ω and p ≥ 2,</p>
        <MD>{"\\mathbb E\\|A - QQ^\\top A\\|_F \\leq \\sqrt{1 + \\frac{k}{p - 1}}\\left(\\sum_{j>k}\\sigma_j^2\\right)^{1/2},"}</MD>
        <p>within a modest factor of the best possible rank-k error, the square root on the right.</p>
      </Theorem>
      <Proof>
        <p>
          Sketch: in the basis of right singular vectors, split Ω into <M>{"\\Omega_1"}</M> (its k × l block along the top k
          directions) and <M>{"\\Omega_2"}</M> (the rest); both are Gaussian and independent by rotation invariance. Since{" "}
          <M>{"\\Omega_1"}</M> has full row rank almost surely, the sketch contains{" "}
          <M>{"A\\Omega\\Omega_1^+"}</M>, whose top part reproduces the top k singular directions exactly and whose tail part
          is <M>{"\\Sigma_2\\Omega_2\\Omega_1^+"}</M>. So the error is at most the tail itself plus{" "}
          <M>{"\\|\\Sigma_2\\Omega_2\\Omega_1^+\\|_F"}</M>, and for Gaussian matrices{" "}
          <M>{"\\mathbb E\\|\\Omega_1^+\\|_F^2 = k/(p - 1)"}</M>, which gives the factor. Oversampling by p = 5 or 10 makes it
          small.
        </p>
        <p>
          In the code, a nearly rank-20 matrix (tail at the 10⁻⁶ level) is sketched with 25 vectors: without power
          iterations the spectral error is 21 times the optimal σ₂₁/σ₁, and one power iteration makes it optimal.
        </p>
        <Code>{RSVD}</Code>
      </Proof>

      <Remark title="power iterations and slow decay">
        <p>
          <M>{"(AA^\\top)^qA"}</M> has the same singular vectors as A and singular values <M>{"\\sigma_j^{2q+1}"}</M>, so a
          tail that decays like 1/j decays like <M>{"1/j^{2q+1}"}</M> after q iterations, and the bound applies to the sharpened
          spectrum. For singular values 1/j and a sketch of 15 vectors the projection error falls from 0.154 to 0.075 and
          0.066 with q = 0, 1, 3, against the optimum σ₁₆/σ₁ = 0.062. Without re-orthonormalising between products, the
          columns of the sketch line up with the top singular vector, as in power iteration, and directions with{" "}
          <M>{"\\sigma_j^{2q+1}"}</M> below u times the top value are lost to roundoff; the code&apos;s simple version is safe
          only for small q.
        </p>
        <Code>{POW}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "factor",
      rung: "check",
      prompt: <p>What is the factor √(1 + k/(p − 1)) for k = 10 and oversampling p = 5? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.8708, tolerance: 0.0001 },
    },
    {
      key: "sharp",
      rung: "check",
      prompt: <p>If σ₁₁/σ₁ = 0.5, what is the corresponding ratio for (AAᵀ)²A, that is, with q = 2?</p>,
      answer: { kind: "numeric", value: 0.03125, tolerance: 0.00001 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>When are power iterations in the randomised SVD most worthwhile?</p>,
      answer: {
        kind: "choice",
        options: [
          "When the singular values decay slowly, so the tail beyond k carries a lot of weight",
          "When the matrix is exactly low rank",
          "When the oversampling p is large",
          "When A is square",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def range_finder(A, l, q, rng):
    Q, _ = np.linalg.qr(A @ rng.normal(size=(A.shape[1], l)))
    for _ in range(q):
        Q, _ = np.linalg.qr(A.T @ Q)
        Q, _ = np.linalg.qr(A @ Q)
    return Q

def rsvd(A, k, p, q, rng):
    Q = range_finder(A, k + p, q, rng)
    Ub, s, Vt = np.linalg.svd(Q.T @ A, full_matrices=False)
    return (Q @ Ub)[:, :k], s[:k], Vt[:k]

def rel_err(A, U, s, Vt):
    return float(np.linalg.norm(A - (U * s) @ Vt, 2) / np.linalg.norm(A, 2))

rng = np.random.default_rng(0)
A = rng.normal(size=(300, 20)) @ rng.normal(size=(20, 200)) + 1e-6 * rng.normal(size=(300, 200))
s = np.linalg.svd(A, compute_uv=False)
errs = [rel_err(A, *rsvd(A, 20, 5, q, rng)) for q in [0, 1]]
print([round(e / (s[20] / s[0])) for e in errs])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[21, 1]", "[1, 1]", "[1, 21]", "[21, 21]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def with_singular_values(s, m, n, rng):
    U, _ = np.linalg.qr(rng.normal(size=(m, len(s))))
    V, _ = np.linalg.qr(rng.normal(size=(n, len(s))))
    return (U * s) @ V.T

def power_sketch(A, l, q, rng):
    Y = A @ rng.normal(size=(A.shape[1], l))
    for _ in range(q):
        Y = A @ (A.T @ Y)
    return np.linalg.qr(Y)[0]

def proj_error(A, Q):
    return float(np.linalg.norm(A - Q @ (Q.T @ A), 2) / np.linalg.norm(A, 2))

rng = np.random.default_rng(1); A = with_singular_values(1.0 / np.arange(1, 101), 400, 300, rng)
print([round(proj_error(A, power_sketch(A, 15, q, rng)), 3) for q in [0, 1, 3]], round(1 / 16, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.154, 0.075, 0.066] 0.062", "[0.066, 0.075, 0.154] 0.062", "[0.154, 0.075, 0.066] 0.1", "[0.062, 0.062, 0.062] 0.062"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>range_finder(A, l, q, rng)</C>, with re-orthonormalisation after each product; <C>rsvd(A, k, p, q,
          rng)</C>, returning (U, s, Vt) of rank k; and <C>rel_err(A, U, s, Vt)</C>, the spectral-norm error relative to
          ‖A‖₂.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def range_finder(A, l, q, rng):
    return np.eye(A.shape[0])[:, :l]

def rsvd(A, k, p, q, rng):
    return np.zeros((A.shape[0], k)), np.zeros(k), np.zeros((k, A.shape[1]))

def rel_err(A, U, s, Vt):
    return 1.0
`,
        solution: RSVD,
        tests: [
          { name: "exact", code: `rng = np.random.default_rng(32); A = rng.normal(size=(60, 5)) @ rng.normal(size=(5, 40))
U, s, Vt = rsvd(A, 5, 3, 0, rng)
assert U.shape == (60, 5) and s.shape == (5,) and Vt.shape == (5, 40) and rel_err(A, U, s, Vt) < 1e-12
assert np.allclose(s, np.linalg.svd(A, compute_uv=False)[:5])` },
          { name: "power", code: `rng = np.random.default_rng(33); Q = range_finder(rng.normal(size=(50, 30)), 8, 2, rng)
assert Q.shape == (50, 8) and np.allclose(Q.T @ Q, np.eye(8))
U0, _ = np.linalg.qr(rng.normal(size=(80, 40))); V0, _ = np.linalg.qr(rng.normal(size=(60, 40)))
A = (U0 / np.arange(1, 41)) @ V0.T
e0, e2 = rel_err(A, *rsvd(A, 5, 5, 0, rng)), rel_err(A, *rsvd(A, 5, 5, 2, rng))
assert e2 < e0 and e2 < 1.3 / 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>with_singular_values(s, m, n, rng)</C>, an m × n matrix with the given singular values and random
          orthonormal singular vectors; <C>power_sketch(A, l, q, rng)</C>, the Q factor of (AAᵀ)^q AΩ computed without
          intermediate orthonormalisation; and <C>proj_error(A, Q)</C>, ‖A − QQᵀA‖₂/‖A‖₂.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def with_singular_values(s, m, n, rng):
    return np.zeros((m, n))

def power_sketch(A, l, q, rng):
    return np.eye(A.shape[0])[:, :l]

def proj_error(A, Q):
    return 1.0
`,
        solution: POW,
        tests: [
          { name: "sv", code: `A = with_singular_values(np.array([3.0, 2.0, 0.5]), 10, 7, np.random.default_rng(34))
assert A.shape == (10, 7) and np.allclose(np.linalg.svd(A, compute_uv=False)[:3], [3.0, 2.0, 0.5]) and np.linalg.matrix_rank(A) == 3` },
          { name: "proj", code: `rng = np.random.default_rng(35); A = with_singular_values(1.0 / np.arange(1, 31), 50, 40, rng)
Q = power_sketch(A, 30, 0, rng); assert Q.shape == (50, 30) and proj_error(A, Q) < 1e-10
assert proj_error(A, power_sketch(A, 6, 2, rng)) < proj_error(A, power_sketch(A, 6, 0, rng))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Let Q have orthonormal columns. Prove that ‖A − QQᵀA‖_F² = ‖A‖_F² − ‖QᵀA‖_F².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Works column by column (or with traces), noting QQᵀ is the orthogonal projector onto range(Q), so aⱼ − QQᵀaⱼ is orthogonal to QQᵀaⱼ.",
          "Applies Pythagoras: ‖aⱼ‖² = ‖QQᵀaⱼ‖² + ‖aⱼ − QQᵀaⱼ‖².",
          "Uses ‖QQᵀaⱼ‖ = ‖Qᵀaⱼ‖ (since QᵀQ = I) and sums over columns to conclude.",
        ],
      },
    },
    {
      key: "tail",
      rung: "stretch",
      prompt: <p>A has singular values 10, 5, 1, 1, 1, 1. What is the best possible rank-2 approximation error in the Frobenius norm?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the randomised SVD finds the dominant subspace from a few random products, why oversampling and power iterations help, and why the final step is exact linear algebra on a small matrix.",

  glimpse: (
    <>
      <p>
        The randomised SVD sketched the columns of A. Sketching the rows instead, by multiplying on the left by a short
        random matrix, shrinks a tall least-squares problem to a small one with almost the same solution, which is the
        next lesson.
      </p>
    </>
  ),
};
