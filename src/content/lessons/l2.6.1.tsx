import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReconErrorViz } from "@/components/viz/ReconErrorViz";
import type { LessonContent } from "@/lib/types";

const PCA = `import numpy as np

def pca_eig(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(Xc.T @ Xc / len(X))
    order = np.argsort(vals)[::-1][:k]
    return vals[order], vecs[:, order]

def pca_svd(X, k):
    Xc = X - X.mean(axis=0)
    U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
    return s[:k] ** 2 / len(X), Vt[:k].T

def recon_error(X, W):
    Xc = X - X.mean(axis=0)
    return float(((Xc - Xc @ W @ W.T) ** 2).sum() / len(X))`;

const POW = `import numpy as np

def power_iteration(C, iters=500, seed=0):
    v = np.random.default_rng(seed).normal(size=C.shape[0])
    for _ in range(iters):
        v = C @ v
        v = v / np.linalg.norm(v)
    return float(v @ C @ v), v

def explained_ratio(vals):
    return np.cumsum(vals) / np.sum(vals)

def choose_k(vals, frac):
    return int(np.searchsorted(explained_ratio(vals), frac) + 1)`;

export const lesson: LessonContent = {
  id: "l2.6.1",
  minutes: 55,
  links: {
    requires: ["l1.6.3", "m6.4.1", "m7.5.3"],
    revisits: ["l2.2.1", "m6.3.4"],
    foreshadows: ["l2.6.2"],
  },

  puzzle: (
    <>
      <p>
        Principal component analysis is described in two ways: find the directions of greatest variance, or find the
        subspace that loses the least when you project onto it. Libraries then compute it with neither, using a singular
        value decomposition of the data matrix. Why are all three the same thing, and why do the k best directions turn
        out to be the top k eigenvectors, chosen one at a time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every centred point&apos;s squared length splits, by Pythagoras, into the part inside a subspace and the part
        outside. The total is fixed, so keeping as much variance as possible inside is the same as leaving as little as
        possible outside. The variance captured by a k-dimensional subspace is a weighted sum of the covariance
        eigenvalues, with weights between 0 and 1 that add up to k, so the best you can do is put full weight on the k
        largest.
      </p>
      <ReconErrorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the best k-dimensional subspace">
        <p>
          Let S be the covariance of centred data, with eigenvalues <M>{"\\lambda_1 \\geq \\dots \\geq \\lambda_d"}</M> and
          orthonormal eigenvectors <M>{"v_1, \\dots, v_d"}</M>. Over all d-by-k matrices W with orthonormal columns,{" "}
          <M>{"\\mathrm{tr}(W^\\top SW)"}</M>, the variance of the projected data, is at most{" "}
          <M>{"\\lambda_1 + \\dots + \\lambda_k"}</M>, with equality for <M>{"W = [v_1, \\dots, v_k]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"S = \\sum_i\\lambda_iv_iv_i^\\top"}</M>. Then{" "}
          <M>{"\\mathrm{tr}(W^\\top SW) = \\sum_i\\lambda_i\\|W^\\top v_i\\|^2 = \\sum_i\\lambda_ic_i"}</M> with{" "}
          <M>{"c_i = \\|W^\\top v_i\\|^2"}</M>. Each <M>{"c_i"}</M> is the squared length of the projection of a unit vector
          onto the column space of W, so <M>{"0 \\leq c_i \\leq 1"}</M>, and{" "}
          <M>{"\\sum_ic_i = \\|W^\\top V\\|_F^2 = \\|W\\|_F^2 = k"}</M> because V is orthogonal. Maximising{" "}
          <M>{"\\sum\\lambda_ic_i"}</M> under these constraints puts <M>{"c_i = 1"}</M> on the k largest eigenvalues, giving
          the bound, and the top eigenvectors achieve it.
        </p>
      </Proof>

      <Theorem title="maximum variance is minimum reconstruction error">
        <p>
          For centred points <M>{"x_i"}</M> and orthonormal W,{" "}
          <M>{"\\frac1n\\sum_i\\|x_i - WW^\\top x_i\\|^2 = \\mathrm{tr}(S) - \\mathrm{tr}(W^\\top SW)"}</M>. So the same W
          minimises the error, and the minimum is <M>{"\\lambda_{k+1} + \\dots + \\lambda_d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"WW^\\top"}</M> is the orthogonal projection onto the column space of W, so <M>{"x_i - WW^\\top x_i"}</M> is
          orthogonal to <M>{"WW^\\top x_i"}</M>, and Pythagoras gives{" "}
          <M>{"\\|x_i\\|^2 = \\|W^\\top x_i\\|^2 + \\|x_i - WW^\\top x_i\\|^2"}</M>. Averaging,{" "}
          <M>{"\\frac1n\\sum\\|x_i\\|^2 = \\mathrm{tr}(S)"}</M> and{" "}
          <M>{"\\frac1n\\sum\\|W^\\top x_i\\|^2 = \\mathrm{tr}(W^\\top SW)"}</M>.
        </p>
      </Proof>

      <Example title="computing it with the SVD">
        <p>
          If the centred data matrix is <M>{"X_c = U\\Sigma V^\\top"}</M>, then <M>{"S = X_c^\\top X_c/n = V(\\Sigma^2/n)V^\\top"}</M>:
          the principal directions are the right singular vectors and the eigenvalues are <M>{"s_i^2/n"}</M>. The SVD of{" "}
          <M>{"X_c"}</M> avoids forming <M>{"X_c^\\top X_c"}</M>, which would square the condition number, exactly as QR does
          for least squares. The truncated SVD is also the best rank-k approximation of <M>{"X_c"}</M> in Frobenius norm
          (Eckart-Young), which is the reconstruction theorem in matrix form. In the code both routes agree, and the
          reconstruction error with two of four components equals the sum of the two discarded eigenvalues.
        </p>
        <Code>{PCA}</Code>
      </Example>

      <Remark title="power iteration and choosing k">
        <p>
          When only the top few components of a huge matrix are needed, repeated multiplication by S and renormalising
          converges to <M>{"v_1"}</M>, with error shrinking like <M>{"(\\lambda_2/\\lambda_1)^t"}</M>; deflation or block
          versions give the next ones. A common rule picks the smallest k whose cumulative explained variance{" "}
          <M>{"(\\lambda_1 + \\dots + \\lambda_k)/\\mathrm{tr}(S)"}</M> passes a threshold such as 90%. PCA is not scale
          invariant: standardise features measured in different units first, or the one with the largest numbers dominates.
        </p>
        <Code>{POW}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frac",
      rung: "check",
      prompt: <p>The covariance eigenvalues are 5, 3, 1 and 1. What fraction of the variance do the first two components explain?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "err",
      rung: "check",
      prompt: <p>With the same eigenvalues, what is the mean squared reconstruction error when keeping two components?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "svd",
      rung: "apply",
      prompt: <p>Why do libraries compute PCA from the SVD of the centred data rather than the eigendecomposition of XᵀX?</p>,
      answer: {
        kind: "choice",
        options: [
          "Forming XᵀX squares the condition number and loses precision in the small components",
          "The eigendecomposition gives different directions from the SVD",
          "XᵀX is not symmetric",
          "The SVD does not require centring the data",
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

def pca_eig(X, k):
    Xc = X - X.mean(axis=0)
    vals, vecs = np.linalg.eigh(Xc.T @ Xc / len(X))
    order = np.argsort(vals)[::-1][:k]
    return vals[order], vecs[:, order]

def pca_svd(X, k):
    Xc = X - X.mean(axis=0)
    U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
    return s[:k] ** 2 / len(X), Vt[:k].T

def recon_error(X, W):
    Xc = X - X.mean(axis=0)
    return float(((Xc - Xc @ W @ W.T) ** 2).sum() / len(X))

rng = np.random.default_rng(0); X = rng.normal(size=(500, 4)) * np.array([3.0, 2.0, 1.0, 0.5])
v1, W1 = pca_eig(X, 2); v2, W2 = pca_svd(X, 2)
print(np.allclose(v1, v2), np.allclose(np.abs(W1), np.abs(W2)), np.round(v1, 2))
all_vals = pca_eig(X, 4)[0]
print(round(recon_error(X, W1), 4), round(float(all_vals[2:].sum()), 4))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True [9.38 3.51]\n1.29 1.29", "True False [9.38 3.51]\n1.29 1.29", "True True [3.06 1.87]\n1.29 1.29", "True True [9.38 3.51]\n1.29 12.89"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def power_iteration(C, iters=500, seed=0):
    v = np.random.default_rng(seed).normal(size=C.shape[0])
    for _ in range(iters):
        v = C @ v
        v = v / np.linalg.norm(v)
    return float(v @ C @ v), v

def explained_ratio(vals):
    return np.cumsum(vals) / np.sum(vals)

def choose_k(vals, frac):
    return int(np.searchsorted(explained_ratio(vals), frac) + 1)

C = np.array([[2.0, 1.0], [1.0, 2.0]]); lam, v = power_iteration(C)
print(round(lam, 4), np.round(np.abs(v), 4))
vals = np.array([5.0, 3.0, 1.0, 0.5, 0.5])
print(explained_ratio(vals), choose_k(vals, 0.85), choose_k(vals, 0.95))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 [0.7071 0.7071]\n[0.5  0.8  0.9  0.95 1.  ] 3 4", "1.0 [0.7071 0.7071]\n[0.5  0.8  0.9  0.95 1.  ] 3 4", "3.0 [1. 0.]\n[0.5  0.8  0.9  0.95 1.  ] 3 4", "3.0 [0.7071 0.7071]\n[0.5  0.8  0.9  0.95 1.  ] 2 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pca_eig(X, k)</C> and <C>pca_svd(X, k)</C>, each returning the top k variances (dividing by n) in
          decreasing order and a d-by-k matrix of directions, and <C>recon_error(X, W)</C>, the mean squared distance from
          the centred points to their projections.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pca_eig(X, k):
    return np.zeros(k), np.eye(X.shape[1])[:, :k]

def pca_svd(X, k):
    return np.zeros(k), np.eye(X.shape[1])[:, :k]

def recon_error(X, W):
    return 0.0
`,
        solution: PCA,
        tests: [
          { name: "axes", code: `X = np.array([[2.0, 0.0], [-2.0, 0.0], [0.0, 1.0], [0.0, -1.0]])
v, W = pca_svd(X, 1); v2, W2 = pca_eig(X, 1)
assert np.allclose(v, [2.0]) and np.allclose(np.abs(W[:, 0]), [1, 0]) and np.allclose(v2, [2.0]) and abs(recon_error(X, W) - 0.5) < 1e-12` },
          { name: "agree", code: `X = np.random.default_rng(5).normal(size=(50, 3)) @ np.array([[2.0, 0.5, 0], [0, 1.0, 0.3], [0, 0, 0.2]])
a, A1 = pca_eig(X, 2); b, B1 = pca_svd(X, 2)
assert np.allclose(a, b) and np.allclose(np.abs(A1.T @ B1), np.eye(2), atol=1e-8)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>power_iteration(C, iters=500, seed=0)</C>, returning the Rayleigh quotient and the final unit vector,{" "}
          <C>explained_ratio(vals)</C>, the cumulative fractions, and <C>choose_k(vals, frac)</C>, the smallest k whose
          cumulative fraction reaches frac.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def power_iteration(C, iters=500, seed=0):
    return 0.0, np.zeros(C.shape[0])

def explained_ratio(vals):
    return np.zeros(len(vals))

def choose_k(vals, frac):
    return 1
`,
        solution: POW,
        tests: [
          { name: "power", code: `lam, v = power_iteration(np.diag([1.0, 4.0, 2.0]))
assert abs(lam - 4.0) < 1e-9 and abs(abs(v[1]) - 1) < 1e-9` },
          { name: "k", code: `vals = np.array([6.0, 2.0, 1.0, 1.0])
assert np.allclose(explained_ratio(vals), [0.6, 0.8, 0.9, 1.0]) and choose_k(vals, 0.75) == 2 and choose_k(vals, 0.6) == 1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For centred data with covariance S and a d-by-k matrix W with orthonormal columns, prove that the mean squared reconstruction error (1/n)Σ‖xᵢ − WWᵀxᵢ‖² equals tr(S) − tr(WᵀSW).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes WWᵀ is the orthogonal projection onto the column space of W, so the residual xᵢ − WWᵀxᵢ is orthogonal to WWᵀxᵢ.",
          "Applies Pythagoras: ‖xᵢ‖² = ‖WWᵀxᵢ‖² + ‖xᵢ − WWᵀxᵢ‖², with ‖WWᵀxᵢ‖ = ‖Wᵀxᵢ‖.",
          "Averages over i, identifying (1/n)Σ‖xᵢ‖² = tr(S) and (1/n)Σ‖Wᵀxᵢ‖² = tr(WᵀSW).",
        ],
      },
    },
    {
      key: "sv",
      rung: "stretch",
      prompt: <p>A centred data matrix with 100 rows has singular values 20 and 10. What fraction of the variance does the first principal component explain?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the best k-dimensional subspace for variance is spanned by the top k eigenvectors, why it also minimises reconstruction error, how the SVD computes it, and how to choose k.",

  glimpse: (
    <>
      <p>
        PCA is a geometric procedure with no noise model, so it cannot say how likely a new point is or handle missing
        values. The next lesson gives it a probabilistic story, a Gaussian latent variable plus isotropic noise, whose
        maximum-likelihood solution turns out to be PCA.
      </p>
    </>
  ),
};
