import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PcaViz } from "@/components/viz/PcaViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.6.3",
  minutes: 55,
  links: {
    revisits: ["m3.7.1", "l1.4.2"],
    parallels: ["m3.7.4", "m3.8.3"],
    foreshadows: ["l2.6.1", "l2.6.2", "m3.8.4"],
  },

  puzzle: (
    <>
      <p>
        Students take a mathematics test and a physics test, and the two marks are strongly correlated. You may keep only one
        number per student.
      </p>
      <p>
        Should it be the mathematics mark, the physics mark, or some blend of the two? What would make one blend better than
        another?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Picture the students as points in the plane. Any single number is a projection onto some line. A good line is one
        along which the students stay spread out, so that the number still tells them apart, and from which the points are
        not far, so little is lost. Both wishes pick the same line: the direction of greatest variance.
      </p>
      <PcaViz />
      <p>
        Turn the slider. The variance of the red dots rises and falls, peaking along the long axis of the cloud and bottoming
        out at right angles to it. That best direction is the <strong>first principal component</strong>. The next best
        direction at right angles to it is the second, and so on.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the covariance matrix">
        <p>
          For centred data, meaning each feature has had its mean subtracted, stored as the rows <M>{"x_i^\\top"}</M> of an{" "}
          <M>{"n \\times d"}</M> matrix <M>X</M>, the covariance matrix is
        </p>
        <MD>{"S = \\frac1n X^\\top X = \\frac1n \\sum_i x_i x_i^\\top ."}</MD>
        <p>
          The projection of <M>{"x_i"}</M> onto a unit vector <M>u</M> is the number <M>{"u^\\top x_i"}</M>, and the variance of
          these numbers is <M>{"\\frac1n \\sum_i (u^\\top x_i)^2 = u^\\top S u"}</M>.
        </p>
      </Definition>

      <Theorem title="the first principal component">
        <p>
          Let <M>{"\\lambda_1 \\ge \\lambda_2 \\ge \\dots \\ge \\lambda_d \\ge 0"}</M> be the eigenvalues of <M>S</M> with
          orthonormal eigenvectors <M>{"q_1, \\dots, q_d"}</M>. Over unit vectors <M>u</M>, the largest value of{" "}
          <M>{"u^\\top S u"}</M> is <M>{"\\lambda_1"}</M>, attained at <M>{"u = q_1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>S</M> is symmetric, so its eigenvectors can be chosen orthonormal. Write <M>{"u = \\sum_j c_j q_j"}</M>; since{" "}
          <M>u</M> is a unit vector, <M>{"\\sum_j c_j^2 = 1"}</M>. Then
        </p>
        <MD>{"u^\\top S u = \\sum_j \\lambda_j c_j^2 \\le \\lambda_1 \\sum_j c_j^2 = \\lambda_1 ,"}</MD>
        <p>with equality when <M>{"c_1 = 1"}</M> and the rest are zero, that is, <M>{"u = q_1"}</M>.</p>
      </Proof>

      <Remark title="most variance, least loss">
        <p>
          Each centred point splits into its projection onto <M>u</M> and a part at right angles to it, so by Pythagoras{" "}
          <M>{"\\lVert x_i \\rVert^2 = (u^\\top x_i)^2 + \\lVert x_i - (u^\\top x_i)u \\rVert^2"}</M>. Averaging, total variance
          equals kept variance plus mean squared reconstruction error. Maximising the first minimises the second.
        </p>
      </Remark>

      <Example title="a two by two case">
        <p>
          If <M>{"S = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}"}</M>, the eigenvalues are 4, with eigenvector{" "}
          <M>{"(1, 1)/\\sqrt2"}</M>, and 2, with eigenvector <M>{"(1, -1)/\\sqrt2"}</M>. The total variance is the trace, 6.
          The first component keeps 4, which is two thirds, and the mean squared reconstruction error is 2. Either original
          axis alone keeps only 3.
        </p>
      </Example>

      <Definition title="explained variance">
        <p>
          Keeping the first <M>m</M> components keeps the fraction{" "}
          <M>{"(\\lambda_1 + \\dots + \\lambda_m)/(\\lambda_1 + \\dots + \\lambda_d)"}</M> of the total variance. A common
          rule keeps enough components to explain, say, 90% or 95%.
        </p>
      </Definition>

      <Remark title="in practice">
        <p>
          Always centre the data first, and standardise features measured in different units, or the feature with the largest
          numbers will dominate. The components are usually computed from the singular value decomposition of <M>X</M>, which
          is more accurate than forming <M>S</M>. PCA is a first answer to the curse of dimensionality: if the data lie near a
          flat subspace of low dimension, a few components capture almost everything.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "both",
      rung: "check",
      prompt: <p>The first principal component direction does which of these? Select all that apply.</p>,
      answer: { kind: "choice", options: ["Maximises the variance of the projections", "Minimises the mean squared reconstruction error", "Maximises the correlation with a label"], correct: [0, 1] },
    },
    {
      key: "centre",
      rung: "check",
      prompt: <p>What must be done to the data before computing principal components?</p>,
      answer: { kind: "choice", options: ["Subtract each feature's mean", "Sort it", "Remove all but two features"], correct: [0] },
    },
    {
      key: "lambda",
      rung: "apply",
      prompt: <p>For <M>{"S = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}"}</M>, how much variance does the first principal component keep?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "axis",
      rung: "apply",
      prompt: <p>For the same <M>S</M>, what is the variance of the projections onto <M>{"u = (1, 0)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "explained",
      rung: "apply",
      prompt: <p>A covariance matrix has eigenvalues 5, 3, 1.5 and 0.5. What fraction of the variance do the first two components explain?</p>,
      answer: { kind: "numeric", value: 0.8 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
t = rng.normal(size=500)
X = np.column_stack([t, 2 * t + rng.normal(0, 0.1, 500)])
s = np.linalg.svd(X - X.mean(0), compute_uv=False)
print(round(float(s[0] ** 2 / (s ** 2).sum()), 2))`}</Code>
          <p>Two nearly collinear features. What fraction of variance does the first principal component explain?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0", "0.5", "0.8", "0.67"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pca(X, k)</C>, which centres X, takes the SVD, and returns (the k × d matrix of principal directions, the n × k projected data, the fraction of variance explained by each of the k components).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pca(X, k):
    return np.eye(X.shape[1])[:k], X[:, :k], np.ones(k) / k
`,
        solution: `import numpy as np

def pca(X, k):
    Xc = X - X.mean(axis=0)
    U, s, Vt = np.linalg.svd(Xc, full_matrices=False)
    return Vt[:k], Xc @ Vt[:k].T, (s ** 2 / (s ** 2).sum())[:k]
`,
        tests: [
          { name: "sklearn", code: `import numpy as np
from sklearn.decomposition import PCA
rng = np.random.default_rng(0)
X = rng.normal(size=(200, 4)) @ rng.normal(size=(4, 4))
V, Z, r = pca(X, 2)
ref = PCA(2).fit(X)
assert np.allclose(np.abs(V), np.abs(ref.components_), atol=1e-6) and np.allclose(r, ref.explained_variance_ratio_), 'Centre first; directions are rows of Vᵀ.'` },
          { name: "projection", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(size=(100, 3))
V, Z, r = pca(X, 3)
assert np.allclose(Z @ V + X.mean(0), X), 'With all components, projecting and mapping back recovers X.'` },
        ],
      },
    },
    {
      key: "maxproof",
      rung: "prove",
      prompt: <p>Prove that the maximum of <M>{"u^\\top S u"}</M> over unit vectors <M>u</M>, for a symmetric matrix <M>S</M>, is its largest eigenvalue, and say where it is attained.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses the spectral theorem: a symmetric S has an orthonormal basis of eigenvectors q_j with real eigenvalues λ_j.",
          "Writes u = Σ c_j q_j and uses orthonormality to get Σ c_j² = 1.",
          "Computes uᵀSu = Σ λ_j c_j² and bounds it by λ₁ Σ c_j² = λ₁.",
          "Shows equality at u = q₁, so the maximum is λ₁, attained at the top eigenvector.",
        ],
      },
    },
    {
      key: "recon",
      rung: "stretch",
      prompt: <p>For <M>{"S = \\begin{pmatrix} 3 & 1 \\\\ 1 & 3 \\end{pmatrix}"}</M>, keeping only the first component, what is the mean squared reconstruction error per point?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what the first principal component is, why it both keeps the most variance and loses the least, and why you centre the data first.",

  glimpse: (
    <p>
      Next, the practice of machine learning, starting with how features are prepared. Statistical Machine Learning derives PCA
      in full and gives it a probabilistic model, and Linear Algebra shows that keeping the top components is the best low-rank
      approximation of the data matrix.
    </p>
  ),
};
