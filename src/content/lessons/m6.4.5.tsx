import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CenteringPcaViz } from "@/components/viz/CenteringPcaViz";
import type { LessonContent } from "@/lib/types";

const PCA = `import numpy as np

def pca(X, k):
    mean = X.mean(axis=0)
    U, s, Vt = np.linalg.svd(X - mean, full_matrices=False)
    return Vt[:k], s[:k] ** 2 / (len(X) - 1), mean

def transform(X, comps, mean):
    return (X - mean) @ comps.T`;

const GRAM = `def reconstruction_error(X, k):
    Xc = X - X.mean(axis=0)
    Vk = np.linalg.svd(Xc, full_matrices=False)[2][:k]
    R = Xc - Xc @ Vk.T @ Vk
    return float(np.sum(R ** 2))

def gram_pca_scores(X, k):
    Xc = X - X.mean(axis=0)
    lam, U = np.linalg.eigh(Xc @ Xc.T)
    idx = np.argsort(lam)[::-1][:k]
    return U[:, idx] * np.sqrt(np.clip(lam[idx], 0, None))`;

export const lesson: LessonContent = {
  id: "m6.4.5",
  minutes: 60,
  links: {
    requires: ["m6.4.3", "m6.3.5"],
    revisits: ["l1.6.3", "m3.8.3"],
    foreshadows: ["l2.6.1"],
  },

  puzzle: (
    <>
      <p>
        PCA is usually described in two different ways: find the directions of greatest variance, or find the subspace that
        best reconstructs the data. Why are these the same problem? Why must the data be centred first, and why do careful
        implementations take an SVD of the data rather than an eigendecomposition of the covariance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each centred data point splits into its projection onto a subspace and a residual, and by Pythagoras the projected
        variance plus the residual error is the fixed total. So maximising one is minimising the other. The best subspace
        for reconstruction is an Eckart–Young problem, solved by the top right singular vectors of the centred data matrix.
      </p>
      <CenteringPcaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="setting">
        <p>
          Data points <M>{"x_1, \\dots, x_n \\in \\mathbb{R}^d"}</M> are the rows of X, with mean{" "}
          <M>{"\\bar x"}</M>. The centred matrix is <M>{"X_c = X - \\mathbf{1}\\bar x^\\top"}</M>, the sample covariance{" "}
          <M>{"S = X_c^\\top X_c/(n - 1)"}</M>, and the thin SVD is <M>{"X_c = U\\Sigma V^\\top"}</M>. Then{" "}
          <M>{"S = V\\frac{\\Sigma^2}{n-1}V^\\top"}</M>: the eigenvectors of S are the right singular vectors{" "}
          <M>{"v_j"}</M> and its eigenvalues are <M>{"\\sigma_j^2/(n-1)"}</M>.
        </p>
      </Definition>

      <Theorem title="PCA, two equivalent optimality properties">
        <p>
          Among all k-dimensional subspaces W of <M>{"\\mathbb{R}^d"}</M>, with orthogonal projection <M>{"P_W"}</M>, the
          subspace <M>{"V_k = \\operatorname{span}(v_1, \\dots, v_k)"}</M> both minimises the reconstruction error{" "}
          <M>{"\\sum_i \\|(x_i - \\bar x) - P_W(x_i - \\bar x)\\|^2"}</M> and maximises the projected variance{" "}
          <M>{"\\sum_i \\|P_W(x_i - \\bar x)\\|^2/(n - 1)"}</M>. The minimum error is{" "}
          <M>{"\\sum_{j>k}\\sigma_j^2"}</M> and the maximum variance is <M>{"\\sum_{j\\le k}\\sigma_j^2/(n-1)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          In matrix form the reconstruction error is <M>{"\\|X_c - X_cP_W\\|_F^2"}</M>, and <M>{"X_cP_W"}</M> has rank at most
          k, so by Eckart–Young the error is at least <M>{"\\sum_{j>k}\\sigma_j^2"}</M>. For <M>{"W = V_k"}</M>,{" "}
          <M>{"X_cP_{V_k} = X_c V_kV_k^\\top = U_k\\Sigma_kV_k^\\top"}</M>, the truncated SVD, which attains the bound. By
          Pythagoras, for every W,{" "}
          <M>{"\\|X_c\\|_F^2 = \\|X_cP_W\\|_F^2 + \\|X_c - X_cP_W\\|_F^2"}</M>, and the left side does not depend on W, so the
          same W maximises <M>{"\\|X_cP_W\\|_F^2"}</M>, which is (n − 1) times the projected variance.
        </p>
      </Proof>
      <p>
        Equivalently, the maximum of <M>{"\\operatorname{tr}(Q^\\top SQ)"}</M> over d×k matrices Q with orthonormal columns is
        the sum of the k largest eigenvalues of S (Ky Fan&apos;s theorem), attained at <M>{"Q = V_k"}</M>; for k = 1 it is
        the Rayleigh quotient statement from earlier.
      </p>

      <Definition title="components, scores and explained variance">
        <p>
          The principal directions are <M>{"v_1, \\dots, v_k"}</M>, the scores (coordinates of the centred points) are{" "}
          <M>{"X_cV_k = U_k\\Sigma_k"}</M>, and the explained variance of component j is{" "}
          <M>{"\\sigma_j^2/(n-1)"}</M>, a fraction <M>{"\\sigma_j^2/\\sum_l\\sigma_l^2"}</M> of the total.
        </p>
      </Definition>
      <Code>{PCA}</Code>

      <Example title="two by two">
        <p>
          For the points (0, 0), (2, 2), (4, 4), (1, 3), (3, 1), the mean is (2, 2). The centred points are three on the
          diagonal at distances 0 and <M>{"2\\sqrt2"}</M> and two on the anti-diagonal at distance <M>{"\\sqrt2"}</M>. So the
          variance is 16/4 = 4 along <M>{"(1, 1)/\\sqrt2"}</M> and 4/4 = 1 along <M>{"(1, -1)/\\sqrt2"}</M>: 80% of the
          variance lies in the first component.
        </p>
      </Example>

      <Remark title="practical points">
        <p>
          Signs of components are arbitrary, so compare them up to sign. Computing S squares the singular values and so the
          condition number; an SVD of <M>{"X_c"}</M> avoids that. When d is much larger than n (images, genomes), work with
          the n×n Gram matrix <M>{"X_cX_c^\\top = U\\Sigma^2U^\\top"}</M> instead: its eigenvectors scaled by{" "}
          <M>{"\\sigma_j"}</M> are the scores directly, and replacing inner products by a kernel turns this into kernel PCA.
          Features in different units should usually be standardised first, or the largest-scale feature dominates.
        </p>
        <Code>{GRAM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frac",
      rung: "check",
      prompt: <p>A covariance matrix has eigenvalues 4 and 1. What fraction of the variance does the first principal component explain?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 1e-9 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>A centred data matrix of 101 points has top singular value 20. What is the sample variance along the first principal direction?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
    {
      key: "best",
      rung: "apply",
      prompt: <p>Which k-dimensional subspace minimises the total squared reconstruction error of the centred data?</p>,
      answer: {
        kind: "choice",
        options: [
          "the span of the top k right singular vectors of the centred data matrix",
          "the span of the top k left singular vectors of the centred data matrix",
          "the span of the k data points of largest norm",
          "the span of the eigenvectors of the k smallest covariance eigenvalues",
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

def pca(X, k):
    mean = X.mean(axis=0)
    U, s, Vt = np.linalg.svd(X - mean, full_matrices=False)
    return Vt[:k], s[:k] ** 2 / (len(X) - 1), mean

def transform(X, comps, mean):
    return (X - mean) @ comps.T

X = np.array([[0.0, 0.0], [2.0, 2.0], [4.0, 4.0], [1.0, 3.0], [3.0, 1.0]])
comps, ev, mean = pca(X, 2)
print(np.round(np.abs(comps), 4), np.round(ev, 4), mean)
print(np.round(np.abs(transform(X, comps, mean)[:, 0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.7071 0.7071]\n [0.7071 0.7071]] [4. 1.] [2. 2.]\n[2.8284 0.     2.8284 0.     0.    ]",
          "[[0.7071 0.7071]\n [0.7071 0.7071]] [16.  4.] [2. 2.]\n[2.8284 0.     2.8284 0.     0.    ]",
          "[[1. 0.]\n [0. 1.]] [4. 1.] [2. 2.]\n[2. 0. 2. 1. 1.]",
          "[[0.7071 0.7071]\n [0.7071 0.7071]] [4. 1.] [2. 2.]\n[0.     2.8284 5.6569 2.8284 2.8284]",
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

def reconstruction_error(X, k):
    Xc = X - X.mean(axis=0)
    Vk = np.linalg.svd(Xc, full_matrices=False)[2][:k]
    R = Xc - Xc @ Vk.T @ Vk
    return float(np.sum(R ** 2))

def gram_pca_scores(X, k):
    Xc = X - X.mean(axis=0)
    lam, U = np.linalg.eigh(Xc @ Xc.T)
    idx = np.argsort(lam)[::-1][:k]
    return U[:, idx] * np.sqrt(np.clip(lam[idx], 0, None))

X = np.array([[0.0, 0.0], [2.0, 2.0], [4.0, 4.0], [1.0, 3.0], [3.0, 1.0]])
print(round(reconstruction_error(X, 1), 6), round(reconstruction_error(X, 2), 6))
print(np.round(np.abs(gram_pca_scores(X, 1)[:, 0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 0.0\n[2.8284 0.     2.8284 0.     0.    ]",
          "1.0 0.0\n[2.8284 0.     2.8284 0.     0.    ]",
          "4.0 0.0\n[8. 0. 8. 0. 0.]",
          "16.0 4.0\n[2.8284 0.     2.8284 0.     0.    ]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pca(X, k)</C>, returning (components, explained_variance, mean): the top k principal directions as rows
          (k×d), their variances σ²/(n − 1), and the column means, using an SVD of the centred data. Then write{" "}
          <C>transform(X, comps, mean)</C>, the n×k scores.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pca(X, k):
    U, s, Vt = np.linalg.svd(X, full_matrices=False)
    return Vt[:k], s[:k], np.zeros(X.shape[1])

def transform(X, comps, mean):
    return X @ comps.T
`,
        solution: PCA,
        tests: [
          { name: "small", code: `X = np.array([[0.0, 0.0], [2.0, 2.0], [4.0, 4.0], [1.0, 3.0], [3.0, 1.0]])
comps, ev, mean = pca(X, 2)
assert np.allclose(np.abs(comps), 2 ** -0.5) and np.allclose(ev, [4.0, 1.0]) and np.allclose(mean, [2.0, 2.0])
assert np.allclose(np.abs(transform(X, comps, mean)[:, 0]), [8 ** 0.5, 0, 8 ** 0.5, 0, 0])` },
          { name: "covariance", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(50, 4)) @ rng.normal(size=(4, 4)) + 5.0
comps, ev, mean = pca(X, 3)
lam, V = np.linalg.eigh(np.cov(X.T))
assert np.allclose(ev, lam[::-1][:3])
assert np.allclose(np.abs(comps @ V[:, ::-1][:, :3]), np.eye(3), atol=1e-8)
Z = transform(X, comps, mean)
assert Z.shape == (50, 3) and np.allclose(Z.mean(axis=0), 0) and np.allclose(Z.var(axis=0, ddof=1), ev)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reconstruction_error(X, k)</C>, the total squared residual after projecting the centred data onto its top
          k principal directions, and <C>gram_pca_scores(X, k)</C>, the n×k scores computed from the eigendecomposition of the
          centred Gram matrix X_cX_cᵀ (top k eigenvectors scaled by the square roots of their eigenvalues).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reconstruction_error(X, k):
    return 0.0

def gram_pca_scores(X, k):
    return X[:, :k]
`,
        solution: `import numpy as np

${GRAM}`,
        tests: [
          { name: "error", code: `rng = np.random.default_rng(1)
X = rng.normal(size=(30, 5))
s = np.linalg.svd(X - X.mean(axis=0), compute_uv=False)
for k in range(6):
    assert np.isclose(reconstruction_error(X, k), np.sum(s[k:] ** 2))
assert isinstance(reconstruction_error(X, 2), float)` },
          { name: "gram trick", code: `rng = np.random.default_rng(2)
X = rng.normal(size=(6, 40))
Xc = X - X.mean(axis=0)
U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
G = gram_pca_scores(X, 3)
assert G.shape == (6, 3)
assert np.allclose(np.abs(G), np.abs(Xc @ Vt[:3].T), atol=1e-8)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that the span of the top k right singular vectors of the centred data matrix minimises the total squared
          reconstruction error over all k-dimensional subspaces. You may use Eckart–Young.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the reconstruction error for a subspace W as ‖X_c − X_cP_W‖_F² and notes X_cP_W has rank at most k.",
          "Applies Eckart–Young to get the lower bound Σⱼ>ₖ σⱼ².",
          "Shows W = span(v₁, …, vₖ) attains it because X_cV_kV_kᵀ = U_kΣ_kV_kᵀ is the truncated SVD.",
        ],
      },
    },
    {
      key: "kyfan",
      rung: "stretch",
      prompt: (
        <p>
          S is a 3×3 covariance matrix with eigenvalues 5, 3, 1. What is the largest possible value of tr(QᵀSQ) over 3×2
          matrices Q with orthonormal columns?
        </p>
      ),
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend why maximising projected variance and minimising reconstruction error give the same PCA subspace, why the data must be centred, and how the SVD of the data computes everything.",

  glimpse: (
    <>
      <p>
        This completes the SVD chapter. The next chapter asks how to measure matrices: vector norms and their duals, then
        operator, Frobenius and nuclear norms, each of which the SVD expresses in terms of singular values.
      </p>
      <p>
        PCA itself returns in the learning course, where it is derived as a probabilistic model whose maximum likelihood
        solution is exactly the top singular subspace, with the dropped variance becoming the noise level.
      </p>
    </>
  ),
};
