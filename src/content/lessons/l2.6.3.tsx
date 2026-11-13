import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FaCommunalityViz } from "@/components/viz/FaCommunalityViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import numpy as np

def fa_em(X, k, iters=300, seed=0):
    rng = np.random.default_rng(seed)
    mu = X.mean(axis=0); Xc = X - mu; n, d = X.shape
    W = rng.normal(size=(d, k)); psi = Xc.var(axis=0)
    for _ in range(iters):
        G = np.linalg.inv(np.eye(k) + W.T @ (W / psi[:, None]))
        Ez = Xc @ (W / psi[:, None]) @ G
        XEz = Xc.T @ Ez
        W = XEz @ np.linalg.inv(n * G + Ez.T @ Ez)
        psi = np.maximum((Xc ** 2).mean(axis=0) - (W * XEz).sum(axis=1) / n, 1e-6)
    return mu, W, psi

def fa_loglik(X, mu, W, psi):
    d = X.shape[1]; C = W @ W.T + np.diag(psi)
    Xc = X - mu
    quad = np.einsum("ij,ij->i", Xc @ np.linalg.inv(C), Xc)
    return float(-0.5 * (len(X) * (d * np.log(2 * np.pi) + np.linalg.slogdet(C)[1]) + quad.sum()))`;

const POST = `import numpy as np

def fa_posterior(x, mu, W, psi):
    Wp = W / psi[:, None]
    G = np.linalg.inv(np.eye(W.shape[1]) + W.T @ Wp)
    return G @ Wp.T @ (x - mu), G

def communality(W, psi):
    h = (W ** 2).sum(axis=1)
    return h / (h + psi)`;

export const lesson: LessonContent = {
  id: "l2.6.3",
  minutes: 55,
  links: {
    requires: ["l2.6.2", "l2.5.2"],
    revisits: ["l2.6.1", "l2.2.2"],
    foreshadows: ["l2.7.1"],
  },

  puzzle: (
    <>
      <p>
        A survey has three questions. The first measures the trait you care about almost perfectly, the third is mostly
        noise, and the third also happens to have the largest variance. PCA, and even probabilistic PCA, will lean towards
        the third question, because it cannot tell noise from signal when all it sees is variance. Measure the first
        question in different units and the answer changes again. Can a model separate what the features share from what
        is private to each?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probabilistic PCA puts the same amount of noise on every feature. Factor analysis gives each feature its own noise
        variance. The shared, low-rank part WWᵀ then has to explain only the covariances between features, while each
        feature&apos;s private variance goes into its own noise term. Because covariances between different features carry
        no private noise, the fit can tell a strongly loaded feature from a merely noisy one.
      </p>
      <FaCommunalityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="factor analysis">
        <p>
          With a d-by-k loading matrix W, a mean μ and a diagonal matrix <M>{"\\Psi = \\mathrm{diag}(\\psi_1, \\dots, \\psi_d)"}</M>{" "}
          of positive noise variances, draw <M>{"z \\sim N(0, I_k)"}</M> and set <M>{"x = Wz + \\mu + \\varepsilon"}</M> with{" "}
          <M>{"\\varepsilon \\sim N(0, \\Psi)"}</M>. Then <M>{"x \\sim N(\\mu, WW^\\top + \\Psi)"}</M>. The communality of
          feature i is <M>{"h_i = \\sum_j W_{ij}^2 / (\\sum_j W_{ij}^2 + \\psi_i)"}</M>, the fraction of its variance that
          the factors explain.
        </p>
      </Definition>

      <Theorem title="the posterior over the factors">
        <p>
          With <M>{"G = (I_k + W^\\top\\Psi^{-1}W)^{-1}"}</M>,{" "}
          <M>{"z \\mid x \\sim N\\big(GW^\\top\\Psi^{-1}(x - \\mu),\\ G\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          As for PPCA, this is Bayesian linear regression with prior N(0, I) on z, design matrix W and noise covariance Ψ.
          The log of prior times likelihood is{" "}
          <M>{"-\\frac12 z^\\top z - \\frac12 (x - \\mu - Wz)^\\top\\Psi^{-1}(x - \\mu - Wz)"}</M> plus a constant. Its
          quadratic term in z is <M>{"-\\frac12 z^\\top(I + W^\\top\\Psi^{-1}W)z"}</M> and its linear term is{" "}
          <M>{"z^\\top W^\\top\\Psi^{-1}(x - \\mu)"}</M>. Completing the square gives precision <M>{"G^{-1}"}</M> and mean{" "}
          <M>{"GW^\\top\\Psi^{-1}(x - \\mu)"}</M>.
        </p>
        <Code>{POST}</Code>
      </Proof>

      <Theorem title="EM for factor analysis">
        <p>
          Let <M>{"\\tilde x_n = x_n - \\bar x"}</M>, <M>{"E_n = \\mathbb E[z \\mid x_n]"}</M> and{" "}
          <M>{"\\mathbb E[zz^\\top \\mid x_n] = G + E_nE_n^\\top"}</M>. The M-step sets
        </p>
        <MD>{"W = \\Big(\\sum_n \\tilde x_n E_n^\\top\\Big)\\Big(\\sum_n (G + E_nE_n^\\top)\\Big)^{-1}, \\qquad \\psi_i = \\frac1N\\sum_n \\tilde x_{ni}^2 - \\frac1N\\Big(W\\sum_n E_n\\tilde x_n^\\top\\Big)_{ii}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The complete-data log-likelihood is a sum over features: feature i is a linear regression of{" "}
          <M>{"\\tilde x_{ni}"}</M> on z with weights the i-th row of W and noise variance <M>{"\\psi_i"}</M>. Taking
          expectations under the posterior replaces <M>{"z"}</M> and <M>{"zz^\\top"}</M> by their posterior moments, so each
          row of W solves normal equations whose matrix is <M>{"\\sum_n \\mathbb E[zz^\\top]"}</M>, giving the W above. The
          expected squared residual of feature i, divided by N, is the update for <M>{"\\psi_i"}</M>; at the new W the
          cross terms collapse to the stated form because the normal equations hold. Each step cannot lower the
          likelihood, as for EM in general.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Theorem title="scale equivariance">
        <p>
          If D is diagonal with positive entries and (μ, W, Ψ) maximise the likelihood for data <M>{"x_n"}</M>, then{" "}
          <M>{"(D\\mu, DW, D\\Psi D)"}</M> maximise it for <M>{"Dx_n"}</M>. In particular the communalities do not change.
        </p>
      </Theorem>
      <Proof>
        <p>
          If x has covariance <M>{"WW^\\top + \\Psi"}</M>, then Dx has covariance <M>{"DWW^\\top D + D\\Psi D"}</M>, which is
          again of factor-analysis form because <M>{"D\\Psi D"}</M> is diagonal. The map{" "}
          <M>{"(\\mu, W, \\Psi) \\mapsto (D\\mu, DW, D\\Psi D)"}</M> is a bijection of the parameter space, and the
          log-density of Dx under the new parameters equals that of x under the old ones minus{" "}
          <M>{"\\log\\det D"}</M>, a constant. So the likelihoods differ by a constant and the maximisers correspond. Row i
          of W and <M>{"\\psi_i"}</M> are both scaled, by <M>{"d_i"}</M> and <M>{"d_i^2"}</M>, so <M>{"h_i"}</M> is unchanged.
          PPCA has no such property: <M>{"D\\sigma^2 ID = \\sigma^2D^2"}</M> is not a multiple of I.
        </p>
      </Proof>
      <Remark title="what to watch for">
        <p>
          In the code, data with loadings (1, 0.8, 0.6) and noise (0.1, 0.5, 1) are recovered almost exactly, and
          multiplying the first feature by 10 leaves the communalities at 0.91, 0.56 and 0.25. PPCA on the same data loads
          the three features almost equally, because the noisiest feature also has the largest variance. There is no
          closed form, so the fit is iterative. W is determined only up to a rotation <M>{"W \\mapsto WR"}</M>, which is why
          practitioners choose rotations such as varimax for interpretation. The model has{" "}
          <M>{"dk + d - k(k - 1)/2"}</M> free covariance parameters. A fitted <M>{"\\psi_i"}</M> can collapse to 0 (a
          Heywood case), meaning one feature is being treated as a perfect measurement of a factor; the code guards this
          with a floor.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "comm",
      rung: "check",
      prompt: <p>One factor with loadings W = (2, 1)ᵀ and noise variances Ψ = diag(1, 4). What is the communality of feature 1?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "params",
      rung: "check",
      prompt: <p>How many free covariance parameters does factor analysis have with d = 10 features and k = 2 factors, counting dk + d and subtracting the k(k − 1)/2 lost to rotation?</p>,
      answer: { kind: "numeric", value: 29, tolerance: 0 },
    },
    {
      key: "rescale",
      rung: "apply",
      prompt: <p>You fit factor analysis, then refit after measuring feature 1 in centimetres instead of metres (multiplying it by 100). What happens to the fit?</p>,
      answer: {
        kind: "choice",
        options: [
          "Row 1 of W is multiplied by 100, ψ₁ by 10000, and every communality is unchanged",
          "Nothing changes, because factor analysis standardises the data first",
          "The first factor turns towards feature 1, as it would for PCA",
          "ψ₁ is multiplied by 100 and row 1 of W is unchanged",
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

def fa_em(X, k, iters=300, seed=0):
    rng = np.random.default_rng(seed)
    mu = X.mean(axis=0); Xc = X - mu; n, d = X.shape
    W = rng.normal(size=(d, k)); psi = Xc.var(axis=0)
    for _ in range(iters):
        G = np.linalg.inv(np.eye(k) + W.T @ (W / psi[:, None]))
        Ez = Xc @ (W / psi[:, None]) @ G
        XEz = Xc.T @ Ez
        W = XEz @ np.linalg.inv(n * G + Ez.T @ Ez)
        psi = np.maximum((Xc ** 2).mean(axis=0) - (W * XEz).sum(axis=1) / n, 1e-6)
    return mu, W, psi

def fa_loglik(X, mu, W, psi):
    d = X.shape[1]; C = W @ W.T + np.diag(psi)
    Xc = X - mu
    quad = np.einsum("ij,ij->i", Xc @ np.linalg.inv(C), Xc)
    return float(-0.5 * (len(X) * (d * np.log(2 * np.pi) + np.linalg.slogdet(C)[1]) + quad.sum()))

rng = np.random.default_rng(1); w = np.array([1.0, 0.8, 0.6]); psi0 = np.array([0.1, 0.5, 1.0])
X = rng.normal(size=(20000, 1)) * w + rng.normal(size=(20000, 3)) * np.sqrt(psi0)
mu, W, psi = fa_em(X, 1)
print(np.round(np.abs(W[:, 0]), 1), np.round(psi, 1))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.  0.8 0.6] [0.1 0.5 1. ]", "[0.6 0.8 1. ] [1.  0.5 0.1]", "[1.  0.8 0.6] [0.5 0.5 0.5]", "[0.7 0.6 0.4] [0.1 0.5 1. ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fa_posterior(x, mu, W, psi):
    Wp = W / psi[:, None]
    G = np.linalg.inv(np.eye(W.shape[1]) + W.T @ Wp)
    return G @ Wp.T @ (x - mu), G

def communality(W, psi):
    h = (W ** 2).sum(axis=1)
    return h / (h + psi)

W = np.array([[2.0], [1.0]]); psi = np.array([1.0, 4.0])
m, G = fa_posterior(np.array([2.0, 1.0]), np.zeros(2), W, psi)
print(np.round(m, 4), np.round(G, 4))
print(np.round(communality(W, psi), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.8095] [[0.1905]]\n[0.8 0.2]", "[0.8095] [[0.1905]]\n[0.8 0.5]", "[1.] [[0.1905]]\n[0.8 0.2]", "[0.8095] [[0.2]]\n[0.8 0.2]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fa_em(X, k, iters=300, seed=0)</C>, fitting factor analysis by EM and returning μ, W and the vector ψ of
          noise variances (floored at 1e−6), and <C>fa_loglik(X, mu, W, psi)</C>, the total Gaussian log-likelihood under
          covariance WWᵀ + diag(ψ).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fa_em(X, k, iters=300, seed=0):
    return X.mean(axis=0), np.zeros((X.shape[1], k)), X.var(axis=0)

def fa_loglik(X, mu, W, psi):
    return 0.0
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `rng = np.random.default_rng(3); w = np.array([1.0, 0.5, 0.7, 0.2]); p = np.array([0.2, 0.3, 0.5, 0.4])
X = rng.normal(size=(30000, 1)) * w + rng.normal(size=(30000, 4)) * np.sqrt(p)
mu, W, psi = fa_em(X, 1)
assert np.allclose(np.abs(W[:, 0]), w, atol=0.05) and np.allclose(psi, p, atol=0.05)` },
          { name: "ll", code: `X = np.array([[0.0, 1.0], [2.0, -1.0]])
v = fa_loglik(X, np.array([1.0, 0.0]), np.zeros((2, 1)), np.array([1.0, 1.0]))
assert abs(v - (-2 * np.log(2 * np.pi) - 2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fa_posterior(x, mu, W, psi)</C>, returning the posterior mean and covariance of the factors, and{" "}
          <C>communality(W, psi)</C>, returning each feature&apos;s communality as a vector.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fa_posterior(x, mu, W, psi):
    k = W.shape[1]
    return np.zeros(k), np.eye(k)

def communality(W, psi):
    return np.zeros(len(psi))
`,
        solution: POST,
        tests: [
          { name: "post", code: `W = np.array([[1.0], [1.0]]); m, G = fa_posterior(np.array([1.0, 3.0]), np.zeros(2), W, np.array([1.0, 1.0]))
assert np.allclose(G, [[1 / 3]]) and np.allclose(m, [4 / 3])` },
          { name: "comm", code: `W = np.array([[1.0, 1.0], [0.0, 3.0], [2.0, 0.0]])
assert np.allclose(communality(W, np.array([2.0, 1.0, 4.0])), [0.5, 0.9, 0.5])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let D be a diagonal matrix with positive entries. Prove that if (μ, W, Ψ) maximises the factor-analysis likelihood
          for data x₁, …, x_N, then (Dμ, DW, DΨD) maximises it for Dx₁, …, Dx_N, and deduce that the communalities are
          unchanged.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows that the new covariance D(WWᵀ + Ψ)D = (DW)(DW)ᵀ + DΨD is again of factor-analysis form, with DΨD diagonal and positive.",
          "Shows the log-likelihood of the scaled data at the transformed parameters equals the original log-likelihood minus N log det D, and that the parameter map is a bijection, so maximisers correspond.",
          "Notes that row i of W scales by dᵢ and ψᵢ by dᵢ², so each communality hᵢ is unchanged.",
        ],
      },
    },
    {
      key: "postmean",
      rung: "stretch",
      prompt: <p>One factor with W = (2, 1)ᵀ, μ = 0 and Ψ = diag(1, 4). What is the posterior mean of z at x = (2, 1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8095, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how factor analysis differs from probabilistic PCA, why separate noise variances let it tell shared structure from feature-specific noise, how EM fits it, and why its answers do not change when a feature is rescaled.",

  glimpse: (
    <>
      <p>
        PCA, PPCA and factor analysis all find linear structure. Data on a curved surface need nonlinear maps, and the
        popular ones, t-SNE and UMAP, produce striking pictures that are easy to over-read. The next lesson is about what
        they preserve and what they do not.
      </p>
    </>
  ),
};
