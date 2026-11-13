import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EckartYoungViz } from "@/components/viz/EckartYoungViz";
import type { LessonContent } from "@/lib/types";

const TRUNC = `import numpy as np

def truncate(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]

def ey_errors(A, k):
    s = np.linalg.svd(A, compute_uv=False)
    spec = float(s[k]) if k < len(s) else 0.0
    return spec, float(np.sqrt(np.sum(s[k:] ** 2)))`;

const FACT = `def rank_for_energy(A, frac):
    s2 = np.linalg.svd(A, compute_uv=False) ** 2
    kept = np.cumsum(s2) / s2.sum()
    return int(np.searchsorted(kept, frac - 1e-12) + 1)

def low_rank_factors(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    r = np.sqrt(s[:k])
    return U[:, :k] * r, r[:, None] * Vt[:k]`;

export const lesson: LessonContent = {
  id: "m6.4.3",
  minutes: 60,
  links: {
    requires: ["m6.4.1", "m6.3.5"],
    revisits: ["m3.8.4"],
    foreshadows: ["m6.4.5", "m6.5.2"],
  },

  puzzle: (
    <>
      <p>
        LoRA fine-tunes a 4096×4096 weight matrix by learning a rank-8 update; image and model compression keep a few
        singular directions; recommender systems assume a low-rank ratings matrix. In each case, how close can a rank-k
        matrix get to a given one, and is there a single best choice? The answer is precise and holds in two different norms
        at once.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The SVD writes A as a sum of rank-one pieces <M>{"\\sigma_j u_j v_j^\\top"}</M>, largest first. Keeping the first k
        pieces costs you exactly the pieces you dropped. Eckart–Young says no other rank-k matrix does better: the dropped
        singular values are a lower bound on the error of every rank-k approximation, not just this one.
      </p>
      <EckartYoungViz />
    </>
  ),

  theory: (
    <>
      <Definition title="truncated SVD">
        <p>
          For <M>{"A = \\sum_{j=1}^r \\sigma_j u_j v_j^\\top"}</M> and k &lt; r, let{" "}
          <M>{"A_k = \\sum_{j=1}^k \\sigma_j u_j v_j^\\top"}</M>. Then{" "}
          <M>{"\\|A - A_k\\|_2 = \\sigma_{k+1}"}</M> and{" "}
          <M>{"\\|A - A_k\\|_F = \\sqrt{\\sigma_{k+1}^2 + \\dots + \\sigma_r^2}"}</M>, since <M>{"A - A_k"}</M> has the
          dropped singular values and the Frobenius norm squared is the sum of the squared singular values.
        </p>
      </Definition>

      <Theorem title="Eckart–Young, spectral norm">
        <p>
          If B has rank at most k, then <M>{"\\|A - B\\|_2 \\ge \\sigma_{k+1}"}</M>. So <M>{"A_k"}</M> is a best rank-k
          approximation in the spectral norm.
        </p>
      </Theorem>
      <Proof>
        <p>
          The null space of B has dimension at least n − k, and <M>{"\\operatorname{span}(v_1, \\dots, v_{k+1})"}</M> has
          dimension k + 1. Their dimensions add to more than n, so they share a unit vector x. Then{" "}
          <M>{"(A - B)x = Ax"}</M>, and writing <M>{"x = \\sum_{j \\le k+1} c_j v_j"}</M>,{" "}
          <M>{"\\|Ax\\|^2 = \\sum_{j \\le k+1}\\sigma_j^2|c_j|^2 \\ge \\sigma_{k+1}^2"}</M>. Hence{" "}
          <M>{"\\|A - B\\|_2 \\ge \\|(A - B)x\\| \\ge \\sigma_{k+1}"}</M>.
        </p>
      </Proof>

      <Theorem title="Weyl's inequality for singular values">
        <p>
          For matrices X, Y of the same shape, <M>{"\\sigma_{i+j-1}(X + Y) \\le \\sigma_i(X) + \\sigma_j(Y)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"X_{i-1} + Y_{j-1}"}</M> has rank at most i + j − 2, so by the spectral theorem just proved,{" "}
          <M>{"\\sigma_{i+j-1}(X + Y) \\le \\|X + Y - X_{i-1} - Y_{j-1}\\|_2 \\le \\|X - X_{i-1}\\|_2 + \\|Y - Y_{j-1}\\|_2 = \\sigma_i(X) + \\sigma_j(Y)"}</M>.
        </p>
      </Proof>

      <Theorem title="Eckart–Young, Frobenius norm">
        <p>
          If B has rank at most k, then <M>{"\\|A - B\\|_F^2 \\ge \\sum_{j > k}\\sigma_j^2"}</M>, with equality for{" "}
          <M>{"B = A_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply Weyl with X = A − B, Y = B and j = k + 1: since <M>{"\\sigma_{k+1}(B) = 0"}</M>,{" "}
          <M>{"\\sigma_{i+k}(A) \\le \\sigma_i(A - B)"}</M> for every i. Square and sum over i:{" "}
          <M>{"\\sum_{j>k}\\sigma_j(A)^2 \\le \\sum_i \\sigma_i(A - B)^2 = \\|A - B\\|_F^2"}</M>.
        </p>
      </Proof>
      <Code>{TRUNC}</Code>

      <Example title="choosing k">
        <p>
          A common rule picks the smallest k whose kept &ldquo;energy&rdquo;{" "}
          <M>{"\\sum_{j\\le k}\\sigma_j^2 / \\sum_j\\sigma_j^2"}</M> passes a threshold such as 0.9, which by the theorem is
          the same as a relative Frobenius error below <M>{"\\sqrt{0.1}"}</M>. A rank-k matrix stored as factors{" "}
          <M>{"(U_k\\Sigma_k^{1/2})(\\Sigma_k^{1/2}V_k^\\top)"}</M> needs k(m + n) numbers instead of mn, which is the whole
          economy of LoRA and of low-rank compression.
        </p>
        <Code>{FACT}</Code>
      </Example>

      <Remark title="uniqueness and other norms">
        <p>
          If <M>{"\\sigma_k > \\sigma_{k+1}"}</M>, <M>{"A_k"}</M> is the unique best approximation in the Frobenius norm; with
          a tie, as for diag(3, 3) and k = 1, there are infinitely many. In the spectral norm the best approximation is never
          unique when <M>{"\\sigma_{k+1} > 0"}</M>, because the spectral error only sees the largest leftover. Mirsky extended
          the theorem to every norm that is invariant under orthogonal changes of basis, such as the nuclear norm.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "spec",
      rung: "check",
      prompt: <p>A has singular values 5, 3, 2, 1. What is the spectral-norm error of its best rank-2 approximation?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "fro",
      rung: "check",
      prompt: <p>Same A. What is the Frobenius-norm error of its best rank-2 approximation? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.2360680, tolerance: 1e-4 },
    },
    {
      key: "params",
      rung: "apply",
      prompt: <p>A 1000×1000 matrix is stored as rank-10 factors B (1000×10) and C (10×1000). How many numbers is that?</p>,
      answer: { kind: "choice", options: ["20,000", "10,000", "100,000", "1,000,000"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def truncate(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U[:, :k] * s[:k]) @ Vt[:k]

def ey_errors(A, k):
    s = np.linalg.svd(A, compute_uv=False)
    spec = float(s[k]) if k < len(s) else 0.0
    return spec, float(np.sqrt(np.sum(s[k:] ** 2)))

A = np.array([[4.0, 0.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 1.0]])
print(np.diag(truncate(A, 1)), [round(e, 4) for e in ey_errors(A, 1)])
E1 = A - truncate(A, 2)
print(round(np.linalg.norm(E1, 2), 4), ey_errors(A, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4. 0. 0.] [2.0, 2.2361]\n1.0 (0.0, 0.0)",
          "[4. 0. 0.] [2.0, 3.0]\n1.0 (0.0, 0.0)",
          "[4. 2. 0.] [1.0, 1.0]\n1.0 (0.0, 0.0)",
          "[4. 0. 0.] [2.0, 2.2361]\n2.0 (1.0, 1.0)",
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

def rank_for_energy(A, frac):
    s2 = np.linalg.svd(A, compute_uv=False) ** 2
    kept = np.cumsum(s2) / s2.sum()
    return int(np.searchsorted(kept, frac - 1e-12) + 1)

def low_rank_factors(A, k):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    r = np.sqrt(s[:k])
    return U[:, :k] * r, r[:, None] * Vt[:k]

A = np.array([[4.0, 0.0, 0.0], [0.0, 2.0, 0.0], [0.0, 0.0, 1.0]])
print(rank_for_energy(A, 0.9), rank_for_energy(A, 0.5), rank_for_energy(A, 1.0))
B, C = low_rank_factors(np.outer([1.0, 2.0], [3.0, 4.0]), 1)
print(B.shape, C.shape, np.allclose(B @ C, np.outer([1.0, 2.0], [3.0, 4.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 1 3\n(2, 1) (1, 2) True", "3 2 3\n(2, 1) (1, 2) True", "2 1 3\n(2, 2) (2, 2) True", "1 1 3\n(2, 1) (1, 2) True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>truncate(A, k)</C>, the best rank-k approximation of A, and <C>ey_errors(A, k)</C>, returning the pair
          (spectral error, Frobenius error) that Eckart–Young predicts, as floats; the spectral error is 0 when k is at least
          the number of singular values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def truncate(A, k):
    return A

def ey_errors(A, k):
    return 0.0, 0.0
`,
        solution: TRUNC,
        tests: [
          { name: "truncate", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(6, 4))
A2 = truncate(A, 2)
assert np.linalg.matrix_rank(A2) == 2
s = np.linalg.svd(A, compute_uv=False)
assert np.isclose(np.linalg.norm(A - A2, 2), s[2])
assert np.isclose(np.linalg.norm(A - A2), np.sqrt(np.sum(s[2:] ** 2)))
B = rng.normal(size=(6, 2)) @ rng.normal(size=(2, 4))
assert np.linalg.norm(A - B) > np.linalg.norm(A - A2)` },
          { name: "errors", code: `e = ey_errors(np.diag([4.0, 2.0, 1.0]), 1)
assert np.allclose(e, (2.0, 5 ** 0.5)) and all(isinstance(x, float) for x in e)
assert ey_errors(np.diag([4.0, 2.0, 1.0]), 3) == (0.0, 0.0)
A = np.random.default_rng(1).normal(size=(5, 5))
assert np.isclose(ey_errors(A, 0)[1], np.linalg.norm(A))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rank_for_energy(A, frac)</C>, the smallest k such that the top k squared singular values make up at least
          the fraction frac of their total, and <C>low_rank_factors(A, k)</C>, returning B = U_k Σ_k^½ and C = Σ_k^½ V_kᵀ so
          that BC is the best rank-k approximation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rank_for_energy(A, frac):
    return min(A.shape)

def low_rank_factors(A, k):
    return A[:, :k], np.eye(k, A.shape[1])
`,
        solution: `import numpy as np

${FACT}`,
        tests: [
          { name: "energy", code: `A = np.diag([4.0, 2.0, 1.0])
assert rank_for_energy(A, 0.9) == 2 and rank_for_energy(A, 0.5) == 1 and rank_for_energy(A, 1.0) == 3
assert rank_for_energy(A, 16 / 21) == 1
assert isinstance(rank_for_energy(A, 0.9), int)` },
          { name: "factors", code: `rng = np.random.default_rng(2)
A = rng.normal(size=(7, 5))
B, C = low_rank_factors(A, 3)
assert B.shape == (7, 3) and C.shape == (3, 5)
U, s, Vt = np.linalg.svd(A, full_matrices=False)
assert np.allclose(B @ C, (U[:, :3] * s[:3]) @ Vt[:3])
assert np.allclose(np.linalg.norm(B, axis=0), np.sqrt(s[:3]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if B has rank at most k, then ‖A − B‖₂ ≥ σₖ₊₁(A), where v₁, …, vₙ are the right singular vectors of A.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses rank–nullity: dim null B ≥ n − k, and span(v₁, …, vₖ₊₁) has dimension k + 1, so they intersect in a unit vector x.",
          "Notes (A − B)x = Ax and computes ‖Ax‖² = Σⱼ≤ₖ₊₁ σⱼ²|cⱼ|² ≥ σₖ₊₁² for x = Σ cⱼvⱼ.",
          "Concludes ‖A − B‖₂ ≥ ‖(A − B)x‖ ≥ σₖ₊₁.",
        ],
      },
    },
    {
      key: "energy",
      rung: "stretch",
      prompt: <p>For A = [[3, 0], [4, 5]], what fraction of ‖A‖_F² is kept by its best rank-1 approximation?</p>,
      answer: { kind: "numeric", value: 0.9, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend why truncating the SVD gives the best rank-k approximation, what its error is in the spectral and Frobenius norms, and how the argument uses dimension counting.",

  glimpse: (
    <>
      <p>
        Two more uses of the SVD close the chapter. Inverting only the nonzero singular values gives the pseudoinverse,
        which solves every least squares problem, square or not, full rank or not, with the minimum-norm answer.
      </p>
      <p>
        Then PCA: the best rank-k approximation of a centred data matrix is the projection of the data onto the top k
        principal directions, and the dropped singular values measure the variance lost.
      </p>
    </>
  ),
};
