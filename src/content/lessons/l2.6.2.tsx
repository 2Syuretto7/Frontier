import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PpcaShrinkViz } from "@/components/viz/PpcaShrinkViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import numpy as np

def ppca_fit(X, k):
    mu = X.mean(axis=0); Xc = X - mu
    vals, vecs = np.linalg.eigh(Xc.T @ Xc / len(X))
    vals, vecs = vals[::-1], vecs[:, ::-1]
    sigma2 = float(vals[k:].mean())
    W = vecs[:, :k] * np.sqrt(np.maximum(vals[:k] - sigma2, 0))
    return mu, W, sigma2

def ppca_loglik(X, mu, W, sigma2):
    d = X.shape[1]; C = W @ W.T + sigma2 * np.eye(d)
    logdet = np.linalg.slogdet(C)[1]
    Xc = X - mu
    quad = np.einsum("ij,ij->i", Xc @ np.linalg.inv(C), Xc)
    return float(-0.5 * (len(X) * (d * np.log(2 * np.pi) + logdet) + quad.sum()))`;

const POST = `import numpy as np

def ppca_posterior(x, mu, W, sigma2):
    M = W.T @ W + sigma2 * np.eye(W.shape[1])
    return np.linalg.solve(M, W.T @ (x - mu)), sigma2 * np.linalg.inv(M)

def ppca_sample(n, mu, W, sigma2, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.normal(size=(n, W.shape[1]))
    return z @ W.T + mu + np.sqrt(sigma2) * rng.normal(size=(n, len(mu)))`;

export const lesson: LessonContent = {
  id: "l2.6.2",
  minutes: 55,
  links: {
    requires: ["l2.6.1", "l2.2.2", "m7.5.4"],
    revisits: ["l2.5.2", "m7.5.5"],
    foreshadows: ["l2.6.3"],
  },

  puzzle: (
    <>
      <p>
        PCA gives you directions but no probabilities. You cannot ask how surprising a new point is, compare a two-component
        fit with a three-component one by likelihood, or fill in a missing coordinate in a principled way. Is there a
        probability model whose maximum-likelihood fit is PCA, so that all these questions get answers for free?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Suppose each data point is a low-dimensional hidden vector, stretched into the data space by a matrix W, plus
        round Gaussian noise of the same size in every direction. The data are then Gaussian with covariance WWᵀ + σ²I: a
        few stretched directions on top of a uniform haze. Fitting this by maximum likelihood puts W along the top
        principal directions and sets σ² to the average variance left over.
      </p>
      <PpcaShrinkViz />
    </>
  ),

  theory: (
    <>
      <Definition title="probabilistic PCA">
        <p>
          With a d-by-k matrix W, a mean μ and a noise variance σ², draw <M>{"z \\sim N(0, I_k)"}</M> and set{" "}
          <M>{"x = Wz + \\mu + \\varepsilon"}</M> with <M>{"\\varepsilon \\sim N(0, \\sigma^2 I_d)"}</M> independent of z.
          Then x is Gaussian with mean μ and covariance <M>{"C = WW^\\top + \\sigma^2 I"}</M>, because{" "}
          <M>{"\\mathrm{Cov}(Wz) = WW^\\top"}</M> and the noise adds <M>{"\\sigma^2I"}</M>.
        </p>
      </Definition>

      <Theorem title="the maximum-likelihood fit">
        <p>
          Let the sample covariance have eigenvalues <M>{"\\lambda_1 \\geq \\dots \\geq \\lambda_d"}</M> and eigenvectors{" "}
          <M>{"U = [u_1, \\dots, u_d]"}</M>. The maximum-likelihood estimates are <M>{"\\hat\\mu = \\bar x"}</M>,
        </p>
        <MD>{"\\hat\\sigma^2 = \\frac{1}{d - k}\\sum_{i > k}\\lambda_i, \\qquad \\hat W = U_k(\\Lambda_k - \\hat\\sigma^2 I)^{1/2}R"}</MD>
        <p>
          for any k-by-k rotation R (Tipping and Bishop). We prove the σ² part: if C has eigenvectors U, with eigenvalues{" "}
          <M>{"\\lambda_1, \\dots, \\lambda_k"}</M> on the first k and σ² on the rest, as the stated W gives, then the best σ²
          is the mean of the discarded eigenvalues.
        </p>
      </Theorem>
      <Proof>
        <p>
          The Gaussian log-likelihood at <M>{"\\mu = \\bar x"}</M> is{" "}
          <M>{"-\\frac n2\\big(d\\log 2\\pi + \\log\\det C + \\mathrm{tr}(C^{-1}S)\\big)"}</M>. With C and S sharing
          eigenvectors, <M>{"\\log\\det C = \\sum_{i \\leq k}\\log\\lambda_i + (d - k)\\log\\sigma^2"}</M> and{" "}
          <M>{"\\mathrm{tr}(C^{-1}S) = k + \\sum_{i > k}\\lambda_i/\\sigma^2"}</M>. Differentiating in σ² and setting to zero:{" "}
          <M>{"(d - k)/\\sigma^2 - \\sum_{i > k}\\lambda_i/\\sigma^4 = 0"}</M>, so{" "}
          <M>{"\\sigma^2 = \\frac{1}{d - k}\\sum_{i > k}\\lambda_i"}</M>. The derivative is negative below this value and
          positive above, so it is the maximum. The stated W indeed gives{" "}
          <M>{"WW^\\top = U_k(\\Lambda_k - \\sigma^2 I)U_k^\\top"}</M>, so C has eigenvalue <M>{"\\lambda_i"}</M> on{" "}
          <M>{"u_i"}</M> for i ≤ k and σ² elsewhere.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Theorem title="the posterior over the latent variable">
        <p>
          With <M>{"M = W^\\top W + \\sigma^2 I_k"}</M>,{" "}
          <M>{"z \\mid x \\sim N\\big(M^{-1}W^\\top(x - \\mu),\\ \\sigma^2M^{-1}\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is Bayesian linear regression with the roles relabelled: z plays the weights with prior N(0, I), W plays the
          design matrix, and <M>{"x - \\mu"}</M> plays the targets with noise variance σ². The posterior covariance is{" "}
          <M>{"(W^\\top W/\\sigma^2 + I)^{-1} = \\sigma^2M^{-1}"}</M>, and the mean is that covariance times{" "}
          <M>{"W^\\top(x - \\mu)/\\sigma^2"}</M>, which is <M>{"M^{-1}W^\\top(x - \\mu)"}</M>.
        </p>
        <Code>{POST}</Code>
      </Proof>
      <Remark title="what the probabilistic version adds">
        <p>
          As σ² → 0 the posterior mean becomes <M>{"(W^\\top W)^{-1}W^\\top(x - \\mu)"}</M>, the coordinates of the orthogonal
          projection, which is ordinary PCA; for positive σ² it shrinks towards 0, as the viz shows. The likelihood scores
          any k: in the code, data built from one latent dimension give average log-likelihood −5.35 with k = 0, −2.84 with
          k = 1 and no further gain with k = 2. Missing coordinates are handled by EM, treating them like z, and mixtures of
          PPCA models give locally linear models of curved data.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "s2",
      rung: "check",
      prompt: <p>The sample covariance has eigenvalues 4, 1, 0.3 and 0.1. With k = 2, what is the maximum-likelihood noise variance?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "wnorm",
      rung: "check",
      prompt: <p>With the same eigenvalues and k = 2, what is the length of the first column of Ŵ, √(λ₁ − σ̂²)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.9494, tolerance: 0.0001 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>What does the PPCA posterior mean of z become as σ² → 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "The coordinates of the orthogonal projection of x − μ onto the column space of W",
          "Zero, the prior mean",
          "The vector x − μ itself",
          "It is undefined because M becomes singular",
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

def ppca_fit(X, k):
    mu = X.mean(axis=0); Xc = X - mu
    vals, vecs = np.linalg.eigh(Xc.T @ Xc / len(X))
    vals, vecs = vals[::-1], vecs[:, ::-1]
    sigma2 = float(vals[k:].mean())
    W = vecs[:, :k] * np.sqrt(np.maximum(vals[:k] - sigma2, 0))
    return mu, W, sigma2

def ppca_loglik(X, mu, W, sigma2):
    d = X.shape[1]; C = W @ W.T + sigma2 * np.eye(d)
    logdet = np.linalg.slogdet(C)[1]
    Xc = X - mu
    quad = np.einsum("ij,ij->i", Xc @ np.linalg.inv(C), Xc)
    return float(-0.5 * (len(X) * (d * np.log(2 * np.pi) + logdet) + quad.sum()))

import numpy as np

def ppca_posterior(x, mu, W, sigma2):
    M = W.T @ W + sigma2 * np.eye(W.shape[1])
    return np.linalg.solve(M, W.T @ (x - mu)), sigma2 * np.linalg.inv(M)

def ppca_sample(n, mu, W, sigma2, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.normal(size=(n, W.shape[1]))
    return z @ W.T + mu + np.sqrt(sigma2) * rng.normal(size=(n, len(mu)))

Wt = np.array([[2.0], [1.0], [-1.0]]); X = ppca_sample(5000, np.zeros(3), Wt, 0.1)
mu, W, s2 = ppca_fit(X, 1)
print(round(s2, 2), np.round(np.abs(W[:, 0]), 1), np.round(W @ W.T, 1)[0])
print([round(ppca_loglik(X, *ppca_fit(X, k)) / len(X), 3) for k in (0, 1, 2)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1 [2. 1. 1.] [ 3.9  2.  -2. ]\n[-5.35, -2.837, -2.837]", "0.1 [2. 1. 1.] [ 3.9  2.  -2. ]\n[-2.837, -2.837, -5.35]", "0.0 [2. 1. 1.] [ 3.9  2.  -2. ]\n[-5.35, -2.837, -2.837]", "0.1 [4. 1. 1.] [ 3.9  2.  -2. ]\n[-5.35, -2.837, -2.837]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ppca_posterior(x, mu, W, sigma2):
    M = W.T @ W + sigma2 * np.eye(W.shape[1])
    return np.linalg.solve(M, W.T @ (x - mu)), sigma2 * np.linalg.inv(M)

def ppca_sample(n, mu, W, sigma2, seed=0):
    rng = np.random.default_rng(seed)
    z = rng.normal(size=(n, W.shape[1]))
    return z @ W.T + mu + np.sqrt(sigma2) * rng.normal(size=(n, len(mu)))

Wt = np.array([[2.0], [1.0], [-1.0]])
m, S = ppca_posterior(np.array([2.0, 1.0, -1.0]), np.zeros(3), Wt, 0.1)
print(np.round(m, 4), np.round(S, 4))
print(np.round(ppca_posterior(np.array([2.0, 1.0, -1.0]), np.zeros(3), Wt, 1e-9)[0], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.9836] [[0.0164]]\n[1.]", "[1.] [[0.0164]]\n[1.]", "[0.9836] [[0.1]]\n[1.]", "[0.9836] [[0.0164]]\n[0.9836]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ppca_fit(X, k)</C>, returning the maximum-likelihood μ, W (with R = I, columns in decreasing order) and σ²,
          and <C>ppca_loglik(X, mu, W, sigma2)</C>, the total Gaussian log-likelihood under covariance WWᵀ + σ²I.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ppca_fit(X, k):
    return X.mean(axis=0), np.zeros((X.shape[1], k)), 1.0

def ppca_loglik(X, mu, W, sigma2):
    return 0.0
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `X = np.array([[3.0, 0.0, 0.0], [-3.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, -1.0, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, -1.0]])
mu, W, s2 = ppca_fit(X, 1)
assert np.allclose(mu, 0) and abs(s2 - 1 / 3) < 1e-12 and np.allclose(np.abs(W[:, 0]), [np.sqrt(3 - 1 / 3), 0, 0])` },
          { name: "ll", code: `X = np.array([[0.0], [2.0]])
assert abs(ppca_loglik(X, np.array([1.0]), np.zeros((1, 0)), 1.0) - (-np.log(2 * np.pi) - 1.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ppca_posterior(x, mu, W, sigma2)</C>, returning the posterior mean and covariance of z, and{" "}
          <C>ppca_sample(n, mu, W, sigma2, seed=0)</C>, returning n samples from the model as rows.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ppca_posterior(x, mu, W, sigma2):
    k = W.shape[1]
    return np.zeros(k), np.eye(k)

def ppca_sample(n, mu, W, sigma2, seed=0):
    return np.zeros((n, len(mu)))
`,
        solution: POST,
        tests: [
          { name: "post", code: `W = np.array([[2.0], [1.0], [-1.0]])
m, S = ppca_posterior(W[:, 0], np.zeros(3), W, 0.5)
assert np.allclose(m, [6 / 6.5]) and np.allclose(S, [[0.5 / 6.5]])` },
          { name: "sample", code: `W = np.array([[2.0], [1.0]]); X = ppca_sample(40000, np.array([1.0, -1.0]), W, 0.25)
assert X.shape == (40000, 2) and np.allclose(X.mean(axis=0), [1, -1], atol=0.05) and np.allclose(np.cov(X.T), W @ W.T + 0.25 * np.eye(2), atol=0.1)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose C = U diag(λ₁, …, λ_k, σ², …, σ²) Uᵀ, where U also diagonalises the sample covariance S with eigenvalues
          λ₁, …, λ_d. Prove that the Gaussian log-likelihood −(n/2)(log det C + tr(C⁻¹S)) + const is maximised over σ² by the
          mean of λ_(k+1), …, λ_d.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes log det C = Σ_(i≤k) log λᵢ + (d − k) log σ² and tr(C⁻¹S) = k + Σ_(i>k) λᵢ/σ².",
          "Differentiates with respect to σ² and sets the derivative to zero, obtaining σ² = (1/(d − k)) Σ_(i>k) λᵢ.",
          "Checks it is a maximum, for example by the sign change of the derivative.",
        ],
      },
    },
    {
      key: "shrink",
      rung: "stretch",
      prompt: <p>One latent dimension with W = (2, 1, −1)ᵀ, μ = 0 and σ² = 0.5. What is the posterior mean of z at x = (2, 1, −1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.9231, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the generative model of probabilistic PCA, why its maximum-likelihood fit recovers the principal directions with σ² equal to the mean discarded variance, how to compute the posterior over the latent variable, and what the probabilistic version adds to PCA.",

  glimpse: (
    <>
      <p>
        PPCA assumes the noise is the same size in every coordinate. Allow each coordinate its own noise variance and you
        get factor analysis, which separates shared structure from feature-specific noise and behaves differently when
        features are rescaled.
      </p>
    </>
  ),
};
