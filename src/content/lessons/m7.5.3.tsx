import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CovEllipseViz } from "@/components/viz/CovEllipseViz";
import type { LessonContent } from "@/lib/types";

const COVM = `import numpy as np

def cov_matrix(X):
    C = X - X.mean(axis=0)
    return C.T @ C / len(X)

def affine_cov(A, S):
    return A @ S @ A.T`;

const SAMPLE = `import numpy as np

def sample_with_cov(mu, S, n, seed=0):
    L = np.linalg.cholesky(S)
    Z = np.random.default_rng(seed).standard_normal((n, len(mu)))
    return np.asarray(mu) + Z @ L.T

def mahalanobis(x, mu, S):
    d = np.asarray(x) - np.asarray(mu)
    return float(np.sqrt(d @ np.linalg.solve(S, d)))`;

export const lesson: LessonContent = {
  id: "m7.5.3",
  minutes: 60,
  links: {
    requires: ["m7.5.2", "m6.3.4"],
    revisits: ["m6.4.5"],
    foreshadows: ["m7.5.4", "m9.6.1"],
  },

  puzzle: (
    <>
      <p>
        You want to simulate two stock returns with standard deviations 1.5% and 0.8% and correlation 0.6. Your generator
        only produces independent standard normals. What linear map turns those into returns with exactly this covariance?
        And how far, in a sense that accounts for the correlation, is an observed day from typical?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For a random vector, all the variances and covariances fit into one symmetric matrix Σ. Linear maps act on it by
        Σ ↦ AΣAᵀ, so producing any covariance from independent noise means finding A with AAᵀ = Σ, and the Cholesky factor
        is one such A. The eigenvectors of Σ are the directions of largest and smallest spread, and measuring distance in
        units of that spread gives the Mahalanobis distance.
      </p>
      <CovEllipseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mean vector and covariance matrix">
        <p>
          For a random vector <M>{"X = (X_1, \\dots, X_d)"}</M>, the mean is <M>{"\\mu = E[X]"}</M> (componentwise) and the
          covariance matrix is <M>{"\\Sigma = E[(X - \\mu)(X - \\mu)^\\top]"}</M>, so{" "}
          <M>{"\\Sigma_{ij} = \\operatorname{Cov}(X_i, X_j)"}</M>.
        </p>
      </Definition>

      <Theorem title="affine maps and positivity">
        <p>
          For a fixed matrix A and vector b, <M>{"\\operatorname{Cov}(AX + b) = A\\Sigma A^\\top"}</M>. In particular{" "}
          <M>{"\\operatorname{Var}(a^\\top X) = a^\\top\\Sigma a \\ge 0"}</M>, so Σ is symmetric positive semidefinite. If Σ
          has an eigenvector v with eigenvalue 0, then <M>{"v^\\top X"}</M> is constant with probability 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          AX + b has mean Aμ + b, so its centred version is A(X − μ), and{" "}
          <M>{"E[A(X - \\mu)(X - \\mu)^\\top A^\\top] = A\\Sigma A^\\top"}</M> by linearity of expectation applied entrywise.
          With A the row <M>{"a^\\top"}</M>, the result is a variance, hence non-negative. If Σv = 0, then{" "}
          <M>{"\\operatorname{Var}(v^\\top X) = v^\\top\\Sigma v = 0"}</M>, so <M>{"v^\\top X"}</M> equals its mean with
          probability 1.
        </p>
        <Code>{COVM}</Code>
      </Proof>

      <Example title="sampling with a given covariance">
        <p>
          If Z has independent standard normal entries, Cov(Z) = I, so <M>{"X = \\mu + LZ"}</M> has covariance{" "}
          <M>{"LL^\\top"}</M>. Any factorisation <M>{"\\Sigma = LL^\\top"}</M> works: the Cholesky factor (lower triangular,
          cheap), or <M>{"Q\\Lambda^{1/2}"}</M> from the eigendecomposition <M>{"\\Sigma = Q\\Lambda Q^\\top"}</M>. For the
          puzzle, <M>{"L = \\begin{pmatrix}1.5 & 0 \\\\ 0.48 & 0.64\\end{pmatrix}"}</M>.
        </p>
      </Example>

      <Definition title="whitening and Mahalanobis distance">
        <p>
          If Σ is positive definite, <M>{"W = L^{-1}(X - \\mu)"}</M> has covariance{" "}
          <M>{"L^{-1}\\Sigma L^{-\\top} = I"}</M>: the coordinates are uncorrelated with unit variance. The Mahalanobis
          distance of x from μ is
        </p>
        <MD>{"d_\\Sigma(x, \\mu) = \\sqrt{(x - \\mu)^\\top\\Sigma^{-1}(x - \\mu)} = \\lVert L^{-1}(x - \\mu)\\rVert,"}</MD>
        <p>
          the ordinary length after whitening. Its level sets are the ellipses in the figure, with axes along the eigenvectors
          of Σ and half-lengths proportional to √λ.
        </p>
        <Code>{SAMPLE}</Code>
      </Definition>

      <Remark title="principal components">
        <p>
          The variance of X along a unit direction u is <M>{"u^\\top\\Sigma u"}</M>, maximised by the top eigenvector, with
          maximum the top eigenvalue (a Rayleigh quotient). PCA computes exactly these from the sample covariance matrix{" "}
          <M>{"\\frac1n\\sum(x_k - \\bar x)(x_k - \\bar x)^\\top"}</M>, or with n − 1 in place of n for an unbiased estimate.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "diffvar",
      rung: "check",
      prompt: <p>X has covariance matrix [[4, 2], [2, 3]]. What is Var(X₁ − X₂)?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "sum3",
      rung: "check",
      prompt: <p>X in ℝ³ has covariance matrix I. What is the variance of X₁ + X₂ + X₃?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>The covariance matrix Σ of a random vector X has eigenvalue 0 with eigenvector v. What follows?</p>,
      answer: {
        kind: "choice",
        options: [
          "vᵀX is constant with probability 1.",
          "X has a joint density.",
          "The coordinates of X are independent.",
          "Σ is not symmetric.",
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

def cov_matrix(X):
    C = X - X.mean(axis=0)
    return C.T @ C / len(X)

def affine_cov(A, S):
    return A @ S @ A.T

X = np.array([[0.0, 0.0], [2.0, 2.0], [2.0, 0.0], [0.0, 2.0]])
print(cov_matrix(X).tolist(), cov_matrix(np.array([[1.0, 2.0], [3.0, 6.0]])).tolist())
S = np.array([[2.0, 1.0], [1.0, 2.0]])
print(affine_cov(np.array([[1.0, 1.0]]), S), affine_cov(np.array([[1.0, -1.0], [1.0, 1.0]]), S).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.0], [0.0, 1.0]] [[1.0, 2.0], [2.0, 4.0]]\n[[6.]] [[2.0, 0.0], [0.0, 6.0]]",
          "[[1.3333333333333333, 0.0], [0.0, 1.3333333333333333]] [[2.0, 4.0], [4.0, 8.0]]\n[[6.]] [[2.0, 0.0], [0.0, 6.0]]",
          "[[1.0, 0.0], [0.0, 1.0]] [[1.0, 2.0], [2.0, 4.0]]\n[[3.]] [[2.0, 0.0], [0.0, 6.0]]",
          "[[1.0, 0.0], [0.0, 1.0]] [[1.0, 2.0], [2.0, 4.0]]\n[[6.]] [[6.0, 0.0], [0.0, 2.0]]",
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

def cov_matrix(X):
    C = X - X.mean(axis=0)
    return C.T @ C / len(X)

def affine_cov(A, S):
    return A @ S @ A.T

def sample_with_cov(mu, S, n, seed=0):
    L = np.linalg.cholesky(S)
    Z = np.random.default_rng(seed).standard_normal((n, len(mu)))
    return np.asarray(mu) + Z @ L.T

def mahalanobis(x, mu, S):
    d = np.asarray(x) - np.asarray(mu)
    return float(np.sqrt(d @ np.linalg.solve(S, d)))

S = np.array([[2.0, 1.0], [1.0, 2.0]])
Y = sample_with_cov([1.0, -1.0], S, 200000)
print(np.round(cov_matrix(Y), 1).tolist(), np.round(Y.mean(axis=0), 1).tolist())
print(mahalanobis([1.0, 1.0], [0.0, 0.0], S), round(mahalanobis([1.0, -1.0], [0.0, 0.0], S), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2.0, 1.0], [1.0, 2.0]] [1.0, -1.0]\n0.816496580927726 1.4142",
          "[[1.4, 1.0], [1.0, 1.4]] [1.0, -1.0]\n0.816496580927726 1.4142",
          "[[2.0, 1.0], [1.0, 2.0]] [1.0, -1.0]\n1.4142135623730951 0.8165",
          "[[2.0, 1.0], [1.0, 2.0]] [1.0, -1.0]\n0.816496580927726 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cov_matrix(X)</C>, the population covariance matrix (divide by n) of the rows of an n×d data array, and{" "}
          <C>affine_cov(A, S)</C>, the covariance of AX given Cov(X) = S.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cov_matrix(X):
    return X.T @ X

def affine_cov(A, S):
    return S
`,
        solution: COVM,
        tests: [
          { name: "cov matrix", code: `X = np.array([[0.0, 0.0], [2.0, 2.0], [2.0, 0.0], [0.0, 2.0]])
assert np.allclose(cov_matrix(X), np.eye(2))
Y = np.random.default_rng(0).normal(size=(50, 3)) + 7
assert np.allclose(cov_matrix(Y), np.cov(Y.T, bias=True))` },
          { name: "affine", code: `S = np.array([[2.0, 1.0], [1.0, 2.0]])
assert np.allclose(affine_cov(np.array([[1.0, -1.0], [1.0, 1.0]]), S), [[2, 0], [0, 6]])
X = np.random.default_rng(1).normal(size=(1000, 2)); A = np.array([[1.0, 2.0], [0.0, 3.0], [1.0, 1.0]])
assert np.allclose(affine_cov(A, cov_matrix(X)), cov_matrix(X @ A.T))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_with_cov(mu, S, n, seed=0)</C>, returning n rows drawn from a distribution with mean mu and
          covariance S by transforming standard normals with the Cholesky factor, and <C>mahalanobis(x, mu, S)</C>, as a
          float, without forming the inverse matrix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_with_cov(mu, S, n, seed=0):
    return np.random.default_rng(seed).standard_normal((n, len(mu)))

def mahalanobis(x, mu, S):
    return float(np.linalg.norm(np.asarray(x) - np.asarray(mu)))
`,
        solution: SAMPLE,
        tests: [
          { name: "sampling", code: `S = np.array([[2.25, 0.72], [0.72, 0.64]])
Y = sample_with_cov([0.1, -0.2], S, 300000, seed=2)
assert Y.shape == (300000, 2) and np.allclose(np.cov(Y.T), S, atol=0.02) and np.allclose(Y.mean(axis=0), [0.1, -0.2], atol=0.01)` },
          { name: "mahalanobis", code: `S = np.array([[2.0, 1.0], [1.0, 2.0]])
assert abs(mahalanobis([1.0, 1.0], [0.0, 0.0], S) - np.sqrt(2 / 3)) < 1e-12
assert abs(mahalanobis([3.0, 1.0], [1.0, 1.0], S) - np.sqrt(8 / 3)) < 1e-12
assert abs(mahalanobis([1.0, 2.0], [0.0, 0.0], np.eye(2)) - np.sqrt(5)) < 1e-12 and isinstance(mahalanobis([1.0, 0.0], [0.0, 0.0], S), float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a random vector X with covariance matrix Σ and a fixed matrix A, Cov(AX) = AΣAᵀ, and deduce that Σ is
          positive semidefinite.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes E[AX] = Aμ by linearity, so AX − E[AX] = A(X − μ).",
          "Computes E[A(X − μ)(X − μ)ᵀAᵀ] = A E[(X − μ)(X − μ)ᵀ] Aᵀ = AΣAᵀ, by linearity of expectation applied entrywise.",
          "Takes A = aᵀ (a row vector) to get aᵀΣa = Var(aᵀX) ≥ 0 for every a, which is positive semidefiniteness (symmetry being immediate).",
        ],
      },
    },
    {
      key: "maha",
      rung: "stretch",
      prompt: <p>With Σ = [[2, 1], [1, 2]], what is the Mahalanobis distance of the point (2, 0) from the origin? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.633, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a covariance matrix is, why it is positive semidefinite, how to generate samples with a given covariance from independent normals, and what Mahalanobis distance measures.",

  glimpse: (
    <>
      <p>
        If Z is a vector of independent standard normals, then μ + LZ is a multivariate normal, and its distribution is
        determined by μ and Σ alone. The next lesson studies this family, whose every linear image and every conditional is
        again normal.
      </p>
    </>
  ),
};
