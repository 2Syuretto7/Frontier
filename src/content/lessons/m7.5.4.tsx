import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SignFlipViz } from "@/components/viz/SignFlipViz";
import type { LessonContent } from "@/lib/types";

const LOGPDF = `import numpy as np

def mvn_logpdf(x, mu, S):
    L = np.linalg.cholesky(S)
    w = np.linalg.solve(L, np.asarray(x) - np.asarray(mu))
    d = len(mu)
    return float(-0.5 * (d * np.log(2 * np.pi) + w @ w) - np.log(np.diag(L)).sum())

def mean_sq_mahalanobis(X, mu, S):
    L = np.linalg.cholesky(S)
    W = np.linalg.solve(L, (X - mu).T)
    return float(np.mean(np.sum(W * W, axis=0)))`;

const MGF = `import numpy as np

def mvn_mgf(t, mu, S):
    t = np.asarray(t)
    return float(np.exp(t @ np.asarray(mu) + 0.5 * t @ S @ t))

def sign_flip_pair(n, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    s = rng.choice([-1.0, 1.0], size=n)
    return x, s * x`;

export const lesson: LessonContent = {
  id: "m7.5.4",
  minutes: 65,
  links: {
    requires: ["m7.5.3", "m7.4.1"],
    revisits: ["m7.3.2", "m7.5.1"],
    foreshadows: ["m7.5.5", "m7.7.2", "l2.1.2"],
  },

  puzzle: (
    <>
      <p>
        Two random variables are each standard normal and have correlation zero. Must they be independent? For most pairs of
        distributions zero correlation proves nothing, but for normals it is often quoted as enough. The truth depends on a
        word that is easy to drop: jointly.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A multivariate normal is what you get by applying a linear map to a vector of independent standard normals and
        adding a constant. Everything about it is determined by its mean vector and covariance matrix, every linear function
        of it is normal, and for jointly normal variables, uncorrelated really does mean independent. But two normals glued
        together in some other way need not be jointly normal at all.
      </p>
      <SignFlipViz />
    </>
  ),

  theory: (
    <>
      <Definition title="multivariate normal">
        <p>
          A random vector X in <M>{"\\mathbb{R}^d"}</M> is multivariate normal, <M>{"X \\sim N(\\mu, \\Sigma)"}</M>, if{" "}
          <M>{"X = \\mu + AZ"}</M> for a vector Z of k independent standard normals and some d×k matrix A with{" "}
          <M>{"AA^\\top = \\Sigma"}</M>. Equivalently, every linear combination <M>{"a^\\top X"}</M> is normal (allowing
          variance 0).
        </p>
      </Definition>

      <Theorem title="the MGF determines everything">
        <p>
          <M>{"E[e^{t^\\top X}] = \\exp(t^\\top\\mu + \\tfrac12 t^\\top\\Sigma t)"}</M>. Hence the distribution depends only on μ
          and Σ, and for any matrix B and vector c, <M>{"BX + c \\sim N(B\\mu + c, B\\Sigma B^\\top)"}</M>. In particular each
          sub-vector of X is multivariate normal, with the corresponding pieces of μ and Σ.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"t^\\top X = t^\\top\\mu + (A^\\top t)^\\top Z"}</M> is a sum of independent normals, hence normal with mean{" "}
          <M>{"t^\\top\\mu"}</M> and variance <M>{"\\lVert A^\\top t\\rVert^2 = t^\\top\\Sigma t"}</M>, and the one-dimensional
          normal MGF at 1 gives the formula. It involves only μ and Σ, and the multivariate MGF determines the distribution (a
          fact we take from the one-dimensional uniqueness theorem). For BX + c, substitute{" "}
          <M>{"B^\\top t"}</M>: the MGF has the normal form with mean Bμ + c and covariance{" "}
          <M>{"B\\Sigma B^\\top"}</M>.
        </p>
        <Code>{MGF}</Code>
      </Proof>

      <Theorem title="density">
        <p>If Σ is positive definite, X has density</p>
        <MD>{"f(x) = \\frac{1}{(2\\pi)^{d/2}(\\det\\Sigma)^{1/2}}\\exp\\Big(-\\tfrac12(x - \\mu)^\\top\\Sigma^{-1}(x - \\mu)\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"X = \\mu + LZ"}</M> with L the Cholesky factor, so Z has density{" "}
          <M>{"(2\\pi)^{-d/2}e^{-\\lVert z\\rVert^2/2}"}</M>. The inverse map is <M>{"z = L^{-1}(x - \\mu)"}</M>, with Jacobian
          determinant <M>{"1/\\det L = (\\det\\Sigma)^{-1/2}"}</M>, and{" "}
          <M>{"\\lVert z\\rVert^2 = (x - \\mu)^\\top\\Sigma^{-1}(x - \\mu)"}</M>. The change-of-variables formula gives f.
        </p>
      </Proof>
      <p>
        In code one evaluates the log-density through the Cholesky factor: half the squared length of{" "}
        <M>{"L^{-1}(x - \\mu)"}</M>, plus the sum of the logs of the diagonal of L, plus <M>{"\\tfrac d2\\log 2\\pi"}</M>. This
        is the Gaussian negative log-likelihood used throughout machine learning. The squared Mahalanobis distance{" "}
        <M>{"\\lVert Z\\rVert^2"}</M> has mean d (a chi-square with d degrees of freedom).
      </p>
      <Code>{LOGPDF}</Code>

      <Theorem title="uncorrelated jointly normal variables are independent">
        <p>
          If <M>{"(X, Y)"}</M> is multivariate normal and every coordinate of X is uncorrelated with every coordinate of Y,
          then X and Y are independent.
        </p>
      </Theorem>
      <Proof>
        <p>
          Σ is block diagonal, <M>{"\\begin{pmatrix}\\Sigma_X & 0 \\\\ 0 & \\Sigma_Y\\end{pmatrix}"}</M>, so{" "}
          <M>{"t^\\top\\Sigma t = s^\\top\\Sigma_Xs + u^\\top\\Sigma_Yu"}</M> for t = (s, u), and the joint MGF factorises into
          the MGFs of <M>{"N(\\mu_X, \\Sigma_X)"}</M> and <M>{"N(\\mu_Y, \\Sigma_Y)"}</M>. That is the MGF of an independent pair
          with those marginals, so by uniqueness X and Y are independent. (With densities, the quadratic form splits and the
          density factorises.)
        </p>
      </Proof>
      <Example title="the puzzle's trap">
        <p>
          Let X ~ N(0, 1) and S = ±1 with probability 1/2 each, independent of X, and Y = SX. By symmetry Y ~ N(0, 1), and{" "}
          <M>{"\\operatorname{Cov}(X, Y) = E[S]E[X^2] = 0"}</M>. But |Y| = |X|, so they are far from independent. There is no
          contradiction: (X, Y) is not jointly normal, since X + Y equals 0 with probability 1/2, which no normal variable
          does.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "sumvar",
      rung: "check",
      prompt: <p>X ~ N(0, Σ) in ℝ² with Σ = [[1, 0.5], [0.5, 2]]. What is the variance of X₁ + X₂?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "logp0",
      rung: "check",
      prompt: <p>What is the natural log of the standard normal density in ℝ³ (μ = 0, Σ = I) at the origin? Give four decimal places.</p>,
      answer: { kind: "numeric", value: -2.7568, tolerance: 0.0001 },
    },
    {
      key: "uncorr",
      rung: "apply",
      prompt: <p>X and Y are each N(0, 1) and Cov(X, Y) = 0. Which is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "They are independent if (X, Y) is jointly normal, but not necessarily otherwise.",
          "They are always independent.",
          "They are never independent.",
          "X + Y is always N(0, 2).",
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

def mvn_logpdf(x, mu, S):
    L = np.linalg.cholesky(S)
    w = np.linalg.solve(L, np.asarray(x) - np.asarray(mu))
    d = len(mu)
    return float(-0.5 * (d * np.log(2 * np.pi) + w @ w) - np.log(np.diag(L)).sum())

def mean_sq_mahalanobis(X, mu, S):
    L = np.linalg.cholesky(S)
    W = np.linalg.solve(L, (X - mu).T)
    return float(np.mean(np.sum(W * W, axis=0)))

print(round(mvn_logpdf([0.0], [0.0], np.eye(1)), 4), round(mvn_logpdf([0.0, 0.0], [0.0, 0.0], np.eye(2)), 4))
S = np.array([[2.0, 1.0], [1.0, 2.0]])
print(round(mvn_logpdf([1.0, 1.0], [0.0, 0.0], S), 4), round(mean_sq_mahalanobis(np.random.default_rng(0).multivariate_normal([0, 0], S, 100000), np.zeros(2), S), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-0.9189 -1.8379\n-2.7205 2.0", "-0.9189 -0.9189\n-2.7205 2.0", "-0.9189 -1.8379\n-2.1713 2.0", "-0.9189 -1.8379\n-2.7205 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def mvn_mgf(t, mu, S):
    t = np.asarray(t)
    return float(np.exp(t @ np.asarray(mu) + 0.5 * t @ S @ t))

def sign_flip_pair(n, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    s = rng.choice([-1.0, 1.0], size=n)
    return x, s * x

S = np.array([[2.0, 1.0], [1.0, 2.0]])
print(mvn_mgf([0.0, 0.0], [1.0, 2.0], S), round(mvn_mgf([1.0, 0.0], [0.0, 0.0], S), 4))
x, y = sign_flip_pair(200000)
print(round(np.corrcoef(x, y)[0, 1], 1) + 0.0, round(np.std(y), 2), bool(np.all(np.abs(x) == np.abs(y))), round(np.mean(x + y == 0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 2.7183\n0.0 1.0 True 0.5", "1.0 1.6487\n0.0 1.0 True 0.5", "0.0 2.7183\n0.0 1.0 True 0.5", "1.0 2.7183\n0.0 1.0 True 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mvn_logpdf(x, mu, S)</C>, the log-density of N(mu, S) at x computed through the Cholesky factor (no explicit
          inverse or determinant), and <C>mean_sq_mahalanobis(X, mu, S)</C>, the average squared Mahalanobis distance of the
          rows of X. Return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mvn_logpdf(x, mu, S):
    return 0.0

def mean_sq_mahalanobis(X, mu, S):
    return 0.0
`,
        solution: LOGPDF,
        tests: [
          { name: "log density", code: `S = np.array([[2.0, 1.0], [1.0, 2.0]]); x = np.array([1.0, -0.5]); mu = np.array([0.2, 0.1])
d = x - mu
ref = -0.5 * (2 * np.log(2 * np.pi) + np.log(np.linalg.det(S)) + d @ np.linalg.inv(S) @ d)
assert abs(mvn_logpdf(x, mu, S) - ref) < 1e-12 and isinstance(mvn_logpdf(x, mu, S), float)
assert abs(mvn_logpdf([0.0], [0.0], np.eye(1)) + 0.5 * np.log(2 * np.pi)) < 1e-12` },
          { name: "chi-square mean", code: `S = np.array([[1.0, 0.3, 0.0], [0.3, 2.0, 0.5], [0.0, 0.5, 1.5]])
X = np.random.default_rng(0).multivariate_normal(np.ones(3), S, 200000)
assert abs(mean_sq_mahalanobis(X, np.ones(3), S) - 3) < 0.03
assert abs(mean_sq_mahalanobis(np.array([[1.0, 1.0]]), np.zeros(2), np.eye(2)) - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mvn_mgf(t, mu, S)</C>, the multivariate normal MGF at t as a float, and <C>sign_flip_pair(n, seed=0)</C>,
          returning arrays x and y = s·x where x is standard normal and s = ±1 with equal probability, independently.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mvn_mgf(t, mu, S):
    return 1.0

def sign_flip_pair(n, seed=0):
    x = np.random.default_rng(seed).standard_normal(n)
    return x, x
`,
        solution: MGF,
        tests: [
          { name: "mgf", code: `S = np.array([[2.0, 1.0], [1.0, 2.0]])
assert mvn_mgf([0.0, 0.0], [1.0, 2.0], S) == 1.0 and abs(mvn_mgf([1.0, 0.0], [0.0, 0.0], S) - np.e) < 1e-12
X = np.random.default_rng(2).multivariate_normal([0.1, -0.2], S, 400000)
t = np.array([0.3, -0.2])
assert abs(np.mean(np.exp(X @ t)) - mvn_mgf(t, [0.1, -0.2], S)) < 0.01` },
          { name: "sign flip", code: `x, y = sign_flip_pair(200000, seed=5)
assert np.all(np.abs(x) == np.abs(y)) and abs(np.corrcoef(x, y)[0, 1]) < 0.01
assert abs(np.mean(y) ) < 0.01 and abs(np.std(y) - 1) < 0.01 and 0.48 < np.mean(x == y) < 0.52` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          (X, Y) is bivariate normal with positive definite diagonal covariance matrix diag(σ₁², σ₂²). Using the density
          formula, prove that X and Y are independent.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the density with Σ⁻¹ = diag(1/σ₁², 1/σ₂²) and det Σ = σ₁²σ₂², so the quadratic form is (x − μ₁)²/σ₁² + (y − μ₂)²/σ₂².",
          "Shows the density factorises as the product of the N(μ₁, σ₁²) density in x and the N(μ₂, σ₂²) density in y.",
          "Concludes independence because the joint density is the product of the marginal densities.",
        ],
      },
    },
    {
      key: "orthant",
      rung: "stretch",
      prompt: (
        <p>
          (X, Y) is bivariate normal with mean 0, unit variances and correlation 0.5. What is P(X &gt; 0, Y &gt; 0)? (Hint:
          write Y in terms of X and an independent normal, and think in polar coordinates.) Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a multivariate normal is, why its distribution is fixed by its mean and covariance, how to evaluate its log-density stably, and why uncorrelated implies independent only for jointly normal variables.",

  glimpse: (
    <>
      <p>
        One more property makes the multivariate normal the workhorse of statistics and machine learning: conditioning one
        block on another gives a normal again, with a mean that is linear in the observed values. The next lesson derives it,
        and it is the engine of Kalman filters and Gaussian processes.
      </p>
    </>
  ),
};
