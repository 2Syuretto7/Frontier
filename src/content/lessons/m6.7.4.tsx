import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HosvdTruncViz } from "@/components/viz/HosvdTruncViz";
import type { LessonContent } from "@/lib/types";

const TUCKER = `import numpy as np

def hosvd(T, ranks):
    Us = []
    for mode, r in enumerate(ranks):
        M = np.moveaxis(T, mode, 0).reshape(T.shape[mode], -1)
        Us.append(np.linalg.svd(M, full_matrices=False)[0][:, :r])
    G = np.einsum('ijk,ia,jb,kc->abc', T, *Us)
    return G, Us

def tucker_full(G, Us):
    return np.einsum('abc,ia,jb,kc->ijk', G, *Us)`;

const CPALS = `import numpy as np

def khatri_rao(B, C):
    return np.einsum('jr,kr->jkr', B, C).reshape(-1, B.shape[1])

def cp_als(T, r, iters=200, seed=0):
    rng = np.random.default_rng(seed)
    I, J, K = T.shape
    A, B, C = rng.normal(size=(I, r)), rng.normal(size=(J, r)), rng.normal(size=(K, r))
    T0 = T.reshape(I, -1)
    T1 = np.moveaxis(T, 1, 0).reshape(J, -1)
    T2 = np.moveaxis(T, 2, 0).reshape(K, -1)
    for _ in range(iters):
        A = T0 @ np.linalg.pinv(khatri_rao(B, C)).T
        B = T1 @ np.linalg.pinv(khatri_rao(A, C)).T
        C = T2 @ np.linalg.pinv(khatri_rao(A, B)).T
    return A, B, C`;

export const lesson: LessonContent = {
  id: "m6.7.4",
  minutes: 60,
  links: {
    requires: ["m6.7.2", "m6.7.3", "m6.4.3"],
    revisits: ["m6.4.1", "m3.8.4"],
    foreshadows: ["m9.2.1", "m15.5.2"],
  },

  puzzle: (
    <>
      <p>
        A 100×100×100 array holds a million numbers. If it is a sum of ten outer products it is described by 3000. For
        matrices the SVD finds such a description, the best one, and Eckart–Young says how good it is. For three indices,
        how do you find a compact description, how good can it be, and why can the obvious approach fail to have a best
        answer at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are two natural generalisations of the SVD. The CP decomposition keeps &ldquo;a short sum of elementary
        tensors&rdquo;; it is often unique, which makes its factors meaningful, but it is hard to compute and a best
        approximation may not exist. The Tucker decomposition keeps &ldquo;an orthonormal basis in each mode&rdquo;, taken
        from the SVDs of the unfoldings; it is easy and stable, and close to optimal, but its core is a small dense tensor
        rather than a diagonal one.
      </p>
      <HosvdTruncViz />
    </>
  ),

  theory: (
    <>
      <Definition title="CP decomposition">
        <p>
          A rank-r CP (canonical polyadic) decomposition of <M>{"T \\in \\mathbb{R}^{I \\times J \\times K}"}</M> is
        </p>
        <MD>{"T = \\sum_{s=1}^{r} a_s \\otimes b_s \\otimes c_s, \\qquad T_{ijk} = \\sum_s A_{is}B_{js}C_{ks},"}</MD>
        <p>
          the einsum <C>ir,jr,kr-&gt;ijk</C> of factor matrices A, B, C with r columns. It stores r(I + J + K) numbers.
        </p>
      </Definition>

      <Theorem title="unfoldings of a CP tensor">
        <p>
          Let <M>{"B \\odot C"}</M> be the Khatri–Rao product, the JK×r matrix whose column s is{" "}
          <M>{"b_s \\otimes c_s"}</M> (row index j·K + k). Then the mode-1 unfolding is{" "}
          <M>{"T_{(1)} = A(B \\odot C)^\\top"}</M>, and likewise <M>{"T_{(2)} = B(A \\odot C)^\\top"}</M> and{" "}
          <M>{"T_{(3)} = C(A \\odot B)^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Entry (i, jK + k) of <M>{"T_{(1)}"}</M> is <M>{"T_{ijk} = \\sum_sA_{is}B_{js}C_{ks}"}</M>, and entry (jK + k, s) of{" "}
          <M>{"B \\odot C"}</M> is <M>{"B_{js}C_{ks}"}</M>, so the product <M>{"A(B \\odot C)^\\top"}</M> has the same entry.
          The other modes are the same computation with the roles exchanged.
        </p>
      </Proof>
      <p>
        So with B and C fixed, the best A is an ordinary least-squares solution,{" "}
        <M>{"A = T_{(1)}\\big((B \\odot C)^\\top\\big)^+"}</M>. Alternating least squares (ALS) cycles through A, B, C. Each
        step solves its subproblem exactly, so the error never increases, but the iteration can sit for a long time in a
        &ldquo;swamp&rdquo; or stop at a poor point, and a few random restarts are standard.
      </p>
      <Code>{CPALS}</Code>

      <Theorem title="uniqueness (Kruskal, stated without proof)">
        <p>
          Let <M>{"k_A"}</M> be the largest k such that every k columns of A are independent, and similarly{" "}
          <M>{"k_B, k_C"}</M>. If <M>{"k_A + k_B + k_C \\ge 2r + 2"}</M>, the rank-r CP decomposition of T is unique up to
          reordering the terms and rescaling the three vectors within a term.
        </p>
      </Theorem>
      <Remark title="why this is surprising">
        <p>
          For matrices there is no such uniqueness: <M>{"UV^\\top = (UQ)(VQ^{-\\top})^\\top"}</M> for every invertible Q, which
          is why the SVD has to impose orthogonality to pin its factors down. A generic three-way tensor of low rank has
          essentially one CP decomposition, with no orthogonality required. This is what lets the method of moments recover
          the components of a mixture model from a third-moment tensor.
        </p>
      </Remark>

      <Example title="no best rank-2 approximation">
        <p>
          With independent a, b, let <M>{"W = a \\otimes a \\otimes b + a \\otimes b \\otimes a + b \\otimes a \\otimes a"}</M>,
          which has rank 3. Expanding,
        </p>
        <MD>{"n\\Big[(a + \\tfrac{1}{n}b)^{\\otimes 3} - a^{\\otimes 3}\\Big] = W + \\tfrac{1}{n}(a \\otimes b \\otimes b + b \\otimes a \\otimes b + b \\otimes b \\otimes a) + \\tfrac{1}{n^2}b^{\\otimes 3},"}</MD>
        <p>
          a rank-2 tensor for every n, converging to W. So W is a limit of rank-2 tensors but not one itself, and the
          infimum of the error over rank-2 tensors (zero) is not attained. ALS on such tensors drives the two terms to grow
          without bound while nearly cancelling.
        </p>
      </Example>

      <Definition title="Tucker decomposition and HOSVD">
        <p>
          A Tucker decomposition with multilinear rank <M>{"(r_1, r_2, r_3)"}</M> is{" "}
          <M>{"T = G \\times_1 U_1 \\times_2 U_2 \\times_3 U_3"}</M>, the einsum <C>abc,ia,jb,kc-&gt;ijk</C> of a core{" "}
          <M>{"G \\in \\mathbb{R}^{r_1 \\times r_2 \\times r_3}"}</M> and factor matrices <M>{"U_n"}</M>. The higher-order SVD
          (HOSVD) takes <M>{"U_n"}</M> to be the leading <M>{"r_n"}</M> left singular vectors of the unfolding{" "}
          <M>{"T_{(n)}"}</M>, and <M>{"G = T \\times_1 U_1^\\top \\times_2 U_2^\\top \\times_3 U_3^\\top"}</M>.
        </p>
        <Code>{TUCKER}</Code>
      </Definition>

      <Theorem title="HOSVD is quasi-optimal">
        <p>
          Let <M>{"\\tau_n^2 = \\sum_{i > r_n}\\sigma_i(T_{(n)})^2"}</M> be the discarded tail in mode n, and{" "}
          <M>{"\\hat T"}</M> the truncated HOSVD. Then every S of multilinear rank at most <M>{"(r_1, r_2, r_3)"}</M> has{" "}
          <M>{"\\lVert T - S\\rVert \\ge \\max_n \\tau_n"}</M>, while{" "}
          <M>{"\\lVert T - \\hat T\\rVert^2 \\le \\tau_1^2 + \\tau_2^2 + \\tau_3^2"}</M>. Hence{" "}
          <M>{"\\lVert T - \\hat T\\rVert \\le \\sqrt{3}\\,\\min_S\\lVert T - S\\rVert"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Lower bound: unfolding is a rearrangement of entries, so{" "}
          <M>{"\\lVert T - S\\rVert = \\lVert T_{(n)} - S_{(n)}\\rVert_F"}</M>, and <M>{"S_{(n)}"}</M> has rank at most{" "}
          <M>{"r_n"}</M>, so by Eckart–Young this is at least <M>{"\\tau_n"}</M>.
        </p>
        <p>
          Upper bound: let <M>{"P_n = U_nU_n^\\top"}</M>, so <M>{"\\hat T = T \\times_1 P_1 \\times_2 P_2 \\times_3 P_3"}</M>. Write
        </p>
        <MD>{"T - \\hat T = T \\times_1 (I - P_1) + T \\times_1 P_1 \\times_2 (I - P_2) + T \\times_1 P_1 \\times_2 P_2 \\times_3 (I - P_3)."}</MD>
        <p>
          The first term is in the range of <M>{"I - P_1"}</M> in mode 1 and the other two in the range of <M>{"P_1"}</M>, so it
          is orthogonal to them; likewise the second and third are separated in mode 2. So the squared norms add. The first
          is <M>{"\\lVert (I - P_1)T_{(1)}\\rVert_F^2 = \\tau_1^2"}</M>. In the second, applying <M>{"P_1"}</M> in mode 1 is
          an orthogonal projection and cannot increase the norm, so it is at most{" "}
          <M>{"\\lVert T \\times_2 (I - P_2)\\rVert^2 = \\tau_2^2"}</M>; the third is at most <M>{"\\tau_3^2"}</M> in the same
          way. Finally <M>{"\\tau_1^2 + \\tau_2^2 + \\tau_3^2 \\le 3\\max_n \\tau_n^2"}</M>.
        </p>
      </Proof>

      <Remark title="in machine learning">
        <p>
          CP and Tucker factorisations compress convolution kernels and embedding tables, and the tensor-train format chains
          three-index cores to reach very high orders with storage linear in the order. Tucker cores are dense, so HOSVD is
          often followed by a few sweeps of alternating refinement (HOOI) when the last factor of √3 matters.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cpstore",
      rung: "check",
      prompt: <p>How many numbers does a rank-10 CP decomposition of a 100×100×100 tensor store?</p>,
      answer: { kind: "numeric", value: 3000 },
    },
    {
      key: "unfoldrank",
      rung: "check",
      prompt: <p>What is the rank of the mode-1 unfolding of e₁ ⊗ e₁ ⊗ e₁ + e₂ ⊗ e₂ ⊗ e₂ in ℝ² ⊗ ℝ² ⊗ ℝ²?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "unique",
      rung: "apply",
      prompt: <p>Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "A low-rank matrix factorisation UVᵀ is never unique without extra constraints, but a low-rank CP decomposition often is, up to order and scaling.",
          "CP decompositions are never unique, which is why HOSVD imposes orthogonality.",
          "Truncated HOSVD gives the best approximation of the given multilinear rank.",
          "Every three-way tensor has a best rank-r CP approximation, as Eckart–Young guarantees.",
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

def hosvd(T, ranks):
    Us = []
    for mode, r in enumerate(ranks):
        M = np.moveaxis(T, mode, 0).reshape(T.shape[mode], -1)
        Us.append(np.linalg.svd(M, full_matrices=False)[0][:, :r])
    G = np.einsum('ijk,ia,jb,kc->abc', T, *Us)
    return G, Us

def tucker_full(G, Us):
    return np.einsum('abc,ia,jb,kc->ijk', G, *Us)

T = np.zeros((2, 3, 2)); T[0, 0, 0], T[1, 1, 1] = 3.0, 1.0
G, Us = hosvd(T, (2, 2, 2))
print(G.shape, [U.shape for U in Us], np.allclose(tucker_full(G, Us), T))
G1, U1 = hosvd(T, (1, 1, 1))
print(round(abs(G1[0, 0, 0]), 6), round(float(np.linalg.norm(T - tucker_full(G1, U1))), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 2, 2) [(2, 2), (3, 2), (2, 2)] True\n3.0 1.0",
          "(2, 2, 2) [(2, 2), (2, 3), (2, 2)] True\n3.0 1.0",
          "(2, 2, 2) [(2, 2), (3, 2), (2, 2)] True\n3.0 0.0",
          "(2, 3, 2) [(2, 2), (3, 3), (2, 2)] True\n3.0 1.0",
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

def khatri_rao(B, C):
    return np.einsum('jr,kr->jkr', B, C).reshape(-1, B.shape[1])

def cp_als(T, r, iters=200, seed=0):
    rng = np.random.default_rng(seed)
    I, J, K = T.shape
    A, B, C = rng.normal(size=(I, r)), rng.normal(size=(J, r)), rng.normal(size=(K, r))
    T0 = T.reshape(I, -1)
    T1 = np.moveaxis(T, 1, 0).reshape(J, -1)
    T2 = np.moveaxis(T, 2, 0).reshape(K, -1)
    for _ in range(iters):
        A = T0 @ np.linalg.pinv(khatri_rao(B, C)).T
        B = T1 @ np.linalg.pinv(khatri_rao(A, C)).T
        C = T2 @ np.linalg.pinv(khatri_rao(A, B)).T
    return A, B, C

B, C = np.array([[1.0, 0.0], [2.0, 1.0]]), np.array([[1.0, 1.0], [0.0, 3.0]])
print(khatri_rao(B, C).shape, khatri_rao(B, C)[:, 1])
rng = np.random.default_rng(3)
T = np.einsum('ir,jr,kr->ijk', rng.normal(size=(3, 2)), rng.normal(size=(4, 2)), rng.normal(size=(5, 2)))
A, B, C = cp_als(T, 2)
print(np.allclose(np.einsum('ir,jr,kr->ijk', A, B, C), T, atol=1e-6), A.shape)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 2) [0. 0. 1. 3.]\nTrue (3, 2)",
          "(4, 2) [0. 1. 0. 3.]\nTrue (3, 2)",
          "(2, 2) [0. 3.]\nTrue (3, 2)",
          "(4, 2) [0. 0. 1. 3.]\nFalse (3, 2)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hosvd(T, ranks)</C> for a three-way array: for each mode take the leading ranks[mode] left singular vectors
          of the unfolding (that axis first, the rest flattened), then form the core by multiplying T by each Uᵀ; return
          (G, [U1, U2, U3]). Also write <C>tucker_full(G, Us)</C>, which rebuilds the full array.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hosvd(T, ranks):
    Us = []
    return T, Us

def tucker_full(G, Us):
    return G
`,
        solution: TUCKER,
        tests: [
          { name: "exact at full rank", code: `rng = np.random.default_rng(0)
T = rng.normal(size=(3, 4, 5))
G, Us = hosvd(T, (3, 4, 5))
assert G.shape == (3, 4, 5) and [U.shape for U in Us] == [(3, 3), (4, 4), (5, 5)]
assert np.allclose(tucker_full(G, Us), T)
G, Us = hosvd(T, (2, 2, 2))
assert all(np.allclose(U.T @ U, np.eye(2)) for U in Us)` },
          { name: "quasi-optimal", code: `i, j, k = np.meshgrid(range(6), range(6), range(6), indexing='ij')
T = 1 / (1 + i + j + k)
for r in (1, 2, 3):
    G, Us = hosvd(T, (r, r, r))
    err = np.linalg.norm(T - tucker_full(G, Us))
    tails = [np.sum(np.linalg.svd(np.moveaxis(T, m, 0).reshape(6, -1), compute_uv=False)[r:] ** 2) for m in range(3)]
    assert np.sqrt(max(tails)) - 1e-12 <= err <= np.sqrt(sum(tails)) + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>khatri_rao(B, C)</C>, the column-wise Kronecker product with row index j·K + k, and{" "}
          <C>cp_als(T, r, iters=200, seed=0)</C>, which starts from random factors and repeatedly sets each factor to the
          least-squares solution given the other two, using the unfolding identities; return (A, B, C).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def khatri_rao(B, C):
    return B

def cp_als(T, r, iters=200, seed=0):
    rng = np.random.default_rng(seed)
    I, J, K = T.shape
    return rng.normal(size=(I, r)), rng.normal(size=(J, r)), rng.normal(size=(K, r))
`,
        solution: CPALS,
        tests: [
          { name: "khatri-rao", code: `B, C = np.array([[1.0, 0.0], [2.0, 1.0]]), np.array([[1.0, 1.0], [0.0, 3.0], [2.0, 0.0]])
KR = khatri_rao(B, C)
assert KR.shape == (6, 2)
assert np.allclose(KR[:, 0], np.kron(B[:, 0], C[:, 0])) and np.allclose(KR[:, 1], np.kron(B[:, 1], C[:, 1]))` },
          { name: "recovers a rank-2 tensor", code: `rng = np.random.default_rng(3)
F = [rng.normal(size=(n, 2)) for n in (3, 4, 5)]
T = np.einsum('ir,jr,kr->ijk', *F)
errs = []
for s in range(5):
    A, B, C = cp_als(T, 2, iters=300, seed=s)
    assert A.shape == (3, 2) and B.shape == (4, 2) and C.shape == (5, 2)
    errs.append(np.linalg.norm(np.einsum('ir,jr,kr->ijk', A, B, C) - T) / np.linalg.norm(T))
assert min(errs) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let S be any three-way tensor whose mode-n unfolding has rank at most rₙ, and let τₙ² be the sum of the squared
          singular values of T₍ₙ₎ beyond the rₙ-th. Prove that ‖T − S‖ ≥ τₙ, where ‖·‖ is the square root of the sum of
          squared entries.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that unfolding only rearranges entries, so ‖T − S‖ = ‖T₍ₙ₎ − S₍ₙ₎‖_F, and that unfolding is linear so (T − S)₍ₙ₎ = T₍ₙ₎ − S₍ₙ₎.",
          "Uses that S₍ₙ₎ has rank at most rₙ.",
          "Applies Eckart–Young (Frobenius form): the distance from T₍ₙ₎ to any matrix of rank at most rₙ is at least the square root of the sum of the squared singular values beyond rₙ, which is τₙ.",
        ],
      },
    },
    {
      key: "tuckerstore",
      rung: "stretch",
      prompt: (
        <p>
          How many numbers does a Tucker decomposition with multilinear rank (10, 10, 10) of a 100×100×100 tensor store, core
          and factor matrices together?
        </p>
      ),
      answer: { kind: "numeric", value: 4000 },
    },
  ],

  teachBack:
    "Explain to a friend the two ways of generalising the SVD to three-way arrays, why CP factors can be unique when matrix factors cannot, why a best low-rank CP approximation may not exist, and why truncated HOSVD is within a factor √3 of optimal.",

  glimpse: (
    <>
      <p>
        This ends the linear algebra course. Its tools return everywhere: projections and least squares in statistics,
        the spectral theorem and Rayleigh quotients in optimisation and graph methods, the SVD and low-rank structure in
        compression and in fine-tuning, and condition numbers in every numerical computation.
      </p>
      <p>
        The tensor ideas return in the method of moments, where a third-moment tensor of a mixture model has a CP
        decomposition whose unique factors are the mixture components, and in low-rank recovery, where the matrix and tensor
        ranks of this course become the structure that makes estimation from few observations possible.
      </p>
    </>
  ),
};
