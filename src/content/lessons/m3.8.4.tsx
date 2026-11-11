import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { LowRankViz } from "@/components/viz/LowRankViz";
import { Code } from "@/components/lesson/Code";
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
