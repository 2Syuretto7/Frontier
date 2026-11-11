import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { LowRankViz } from "@/components/viz/LowRankViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.8.4",
  minutes: 55,
  links: {
    requires: ["m3.8.3"],
    foreshadows: ["m6.4.3", "m11.6.2", "m6.6.4"],
  },

  puzzle: (
    <>
      <p>
        Fine-tuning a language model changes a 4096 × 4096 weight matrix, nearly seventeen million numbers. A popular method
        learns the change as the product of a 4096 × 8 matrix and an 8 × 4096 matrix instead.
      </p>
      <p>How many numbers is that, and why should such a restricted change be enough? What is the best matrix of a given rank?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The SVD writes a matrix as a sum of rank one pieces, <M>{"\\sigma_i\\mathbf u_i\\mathbf v_i^{\\mathsf T}"}</M>, from the
        most important to the least. Keep the first k and drop the rest. Below, a small picture is treated as a 24 × 24 matrix.
        A handful of pieces already captures its main shapes, at a fraction of the storage.
      </p>
      <LowRankViz />
    </>
  ),

  theory: (
    <>
      <Definition title="truncated SVD">
        <p>For <M>{"A = \\sum_{i=1}^r \\sigma_i\\mathbf u_i\\mathbf v_i^{\\mathsf T}"}</M> and k &lt; r, let</p>
        <MD>{"A_k = \\sigma_1\\mathbf u_1\\mathbf v_1^{\\mathsf T} + \\dots + \\sigma_k\\mathbf u_k\\mathbf v_k^{\\mathsf T}."}</MD>
        <p>It has rank k and is stored with k(m + n + 1) numbers instead of mn.</p>
      </Definition>

      <Definition title="two matrix norms">
        <p>
          The <strong>spectral norm</strong> <M>{"\\|A\\|_2 = \\sigma_1"}</M> is the largest stretch. The{" "}
          <strong>Frobenius norm</strong> <M>{"\\|A\\|_F = \\sqrt{\\sum_{ij}a_{ij}^2} = \\sqrt{\\sigma_1^2 + \\dots + \\sigma_r^2}"}</M>{" "}
          treats the matrix as a long vector.
        </p>
      </Definition>

      <Theorem title="Eckart-Young">
        <p>For every matrix B of rank at most k,</p>
        <MD>{"\\|A - B\\|_2 \\ge \\|A - A_k\\|_2 = \\sigma_{k+1}, \\qquad \\|A - B\\|_F \\ge \\|A - A_k\\|_F = \\sqrt{\\sigma_{k+1}^2 + \\dots + \\sigma_r^2}."}</MD>
        <p>The truncated SVD is the best rank-k approximation, in both norms.</p>
      </Theorem>
      <Remark title="why it is true, in outline">
        <p>
          For the spectral norm: B has a null space of dimension at least n − k, which must meet the (k + 1)-dimensional span of{" "}
          <M>{"\\mathbf v_1, \\dots, \\mathbf v_{k+1}"}</M> in some unit vector x. Then <M>{"(A - B)\\mathbf x = A\\mathbf x"}</M>{" "}
          and <M>{"\\|A\\mathbf x\\| \\ge \\sigma_{k+1}"}</M>. Linear Algebra II gives the full proof.
        </p>
      </Remark>

      <Example title="a small case">
        <p>
          If A has singular values 5, 3 and 1, the best rank one approximation has spectral error 3 and Frobenius error{" "}
          <M>{"\\sqrt{9 + 1} \\approx 3.16"}</M>, and keeps 25/35 ≈ 71% of the squared Frobenius norm.
        </p>
      </Example>

      <Example title="the puzzle">
        <p>
          The two factors hold 4096 · 8 + 8 · 4096 = 65 536 numbers, 256 times fewer than the full matrix. It works when the
          useful change has rapidly decaying singular values, so that a rank 8 approximation captures most of it, which is
          often observed for fine-tuning.
        </p>
      </Example>

      <Remark title="when low rank fails">
        <p>
          A matrix with slowly decaying singular values, like random noise or the identity, cannot be compressed this way: every
          piece matters about equally. The singular values tell you in advance how much a given rank will cost.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "best",
      rung: "check",
      prompt: <p>What is the best rank-k approximation of A in the Frobenius norm?</p>,
      answer: {
        kind: "choice",
        options: ["The sum of the first k terms σᵢuᵢvᵢᵀ of the SVD", "The first k columns of A", "The first k rows of A", "A with all but k entries set to 0"],
        correct: [0],
      },
    },
    {
      key: "store",
      rung: "check",
      prompt: <p>How many numbers store a rank 10 approximation of a 1000 × 1000 matrix, keeping σ, u and v for each term?</p>,
      answer: { kind: "numeric", value: 20010 },
    },
    {
      key: "frob",
      rung: "apply",
      prompt: <p>A has singular values 5, 3 and 1. Find the Frobenius error of its best rank one approximation to three decimal places.</p>,
      answer: { kind: "numeric", value: 3.162, tolerance: 0.0005 },
    },
    {
      key: "spec",
      rung: "apply",
      prompt: <p>For the same A, what is the spectral norm error of the best rank one approximation?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "energy",
      rung: "apply",
      prompt: <p>For the same A, what fraction of <M>{"\\|A\\|_F^2"}</M> does the best rank one approximation keep? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.714, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.diag([5.0, 3.0, 1.0])
U, s, Vt = np.linalg.svd(A)
A1 = s[0] * np.outer(U[:, 0], Vt[0])
print(round(np.linalg.norm(A - A1, 2), 6), round(np.linalg.norm(A - A1) ** 2, 6))`}</Code>
          <p>This prints two numbers. What is their sum?</p>
        </>
      ),
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
A = rng.normal(size=(6, 2)) @ rng.normal(size=(2, 5)) + 1e-3 * rng.normal(size=(6, 5))
s = np.linalg.svd(A, compute_uv=False)
print(int(np.sum(s > 0.01 * s[0])), s[2] < 0.01)`}</Code>
          <p>A rank-2 matrix plus a little noise: how many singular values stand out? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 True", "5 False", "2 False", "3 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>best_rank(A, k)</C>, which returns the best rank k approximation of A by keeping the first k terms of
            <C>np.linalg.svd</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def best_rank(A, k):
    A = np.asarray(A, float)
    return A[:, :k]
`,
        solution: `import numpy as np

def best_rank(A, k):
    U, s, Vt = np.linalg.svd(np.asarray(A, float), full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]
`,
        tests: [
          { name: "shape and rank", code: `import numpy as np
rng = np.random.default_rng(10)
A = rng.standard_normal((8, 6))
B = best_rank(A, 2)
assert B.shape == A.shape, 'The approximation has the same shape as A.'
assert np.linalg.matrix_rank(B) == 2, 'It must have rank k.'` },
          { name: "Eckart-Young", code: `import numpy as np
rng = np.random.default_rng(10)
A = rng.standard_normal((8, 6))
s = np.linalg.svd(A, compute_uv=False)
assert abs(np.linalg.norm(A - best_rank(A, 2)) - np.sqrt((s[2:] ** 2).sum())) < 1e-8, 'The Frobenius error should be the root of the sum of the dropped σ².'` },
          { name: "full rank", code: `import numpy as np
A = np.diag([5.0, 3.0, 1.0])
assert np.allclose(best_rank(A, 3), A), 'Keeping every term gives A back.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>truncated_svd(A, k)</C>, the best rank-k approximation, and <C>energy_rank(A, frac)</C>, the smallest k whose first k singular values carry at least the fraction frac of Σσᵢ². Then write <C>randomized_svd(A, k, oversample, seed)</C>, the randomised range finder: draw a Gaussian test matrix Ω of k + oversample columns with a seeded <C>default_rng</C>, orthonormalise AΩ with QR to get Q, take the SVD of the small matrix QᵀA, and return (U, s, Vt) truncated to k. Check that its error is close to the optimal Eckart–Young error σₖ₊₁.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def truncated_svd(A, k):
    return np.asarray(A, float)

def energy_rank(A, frac):
    return min(np.asarray(A).shape)

def randomized_svd(A, k, oversample, seed):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return U, s, Vt
`,
        solution: `import numpy as np

def truncated_svd(A, k):
    U, s, Vt = np.linalg.svd(np.asarray(A, float), full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]

def energy_rank(A, frac):
    s = np.linalg.svd(np.asarray(A, float), compute_uv=False)
    c = np.cumsum(s ** 2) / np.sum(s ** 2)
    return int(np.searchsorted(c, frac - 1e-12) + 1)

def randomized_svd(A, k, oversample, seed):
    A = np.asarray(A, float)
    rng = np.random.default_rng(seed)
    Om = rng.standard_normal((A.shape[1], k + oversample))
    Q, _ = np.linalg.qr(A @ Om)
    Ub, s, Vt = np.linalg.svd(Q.T @ A, full_matrices=False)
    U = Q @ Ub
    return (U[:, :k], s[:k], Vt[:k])
`,
        tests: [
          { name: "eckart young", code: `import numpy as np
rng = np.random.default_rng(27)
A = rng.normal(size=(30, 20))
s = np.linalg.svd(A, compute_uv=False)
assert abs(np.linalg.norm(A - truncated_svd(A, 5), 2) - s[5]) < 1e-10 and np.linalg.matrix_rank(truncated_svd(A, 5)) == 5, 'The error in the 2-norm is σₖ₊₁.'` },
          { name: "energy", code: `import numpy as np
A = np.diag([3.0, 2.0, 1.0, 0.5])
assert energy_rank(A, 0.6) == 1 and energy_rank(A, 0.9) == 2 and energy_rank(A, 1.0) == 4, '9/14.25 ≈ 0.63, then 13/14.25 ≈ 0.91.'` },
          { name: "randomized", code: `import numpy as np
rng = np.random.default_rng(28)
U0, _ = np.linalg.qr(rng.normal(size=(200, 200)))
V0, _ = np.linalg.qr(rng.normal(size=(100, 100)))
s0 = 0.7 ** np.arange(100)
A = (U0[:, :100] * s0) @ V0.T
U, s, Vt = randomized_svd(A, 10, 10, 0)
err = np.linalg.norm(A - (U * s) @ Vt, 2)
assert err < 3 * s0[10] and np.allclose(s[:5], s0[:5], rtol=1e-3), f'Error {err:.2e} against the optimum {s0[10]:.2e}.'` },
          { name: "seeded", code: `import numpy as np
rng = np.random.default_rng(29)
A = rng.normal(size=(40, 30))
a, b = randomized_svd(A, 3, 5, 1), randomized_svd(A, 3, 5, 1)
assert np.allclose(a[1], b[1]) and a[0].shape == (40, 3) and a[2].shape == (3, 30), 'Seeded and truncated to k.'` },
        ],
      },
    },
    {
      key: "fnorm",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\|A\\|_F^2 = \\sigma_1^2 + \\dots + \\sigma_r^2"}</M>. You may use that{" "}
          <M>{"\\|A\\|_F^2 = \\operatorname{trace}(A^{\\mathsf T}A)"}</M> and that the trace is the sum of the eigenvalues.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks that trace(AᵀA) = Σ_j (AᵀA)_jj = Σ_j Σ_i a_ij², which is ‖A‖_F².",
          "Notes that the eigenvalues of AᵀA are σ₁², …, σ_r² and zeros.",
          "Concludes ‖A‖_F² = trace(AᵀA) = Σ σ_i².",
        ],
      },
    },
    {
      key: "lora",
      rung: "stretch",
      prompt: (
        <p>
          A d × d weight update is learned as the product of a d × r and an r × d matrix. For d = 4096 and r = 8, how many times
          fewer numbers is that than the full update?
        </p>
      ),
      answer: { kind: "numeric", value: 256 },
    },
  ],

  teachBack:
    "Explain to a friend how the SVD gives the best low-rank approximation of a matrix, how the discarded singular values measure the error, and why low-rank updates can fine-tune a large model cheaply.",

  glimpse: (
    <p>
      This completes Linear Algebra I. Linear Algebra II proves Eckart-Young and studies matrix norms in depth, and Numerical
      Linear Algebra and Scientific Computing computes low-rank approximations of huge matrices with randomised SVD.
    </p>
  ),
};
