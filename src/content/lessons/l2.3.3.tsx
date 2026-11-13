import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GpPosteriorViz } from "@/components/viz/GpPosteriorViz";
import type { LessonContent } from "@/lib/types";

const GP = `import numpy as np

def rbf(A, B, ell, sf2=1.0):
    d2 = (A[:, None] - B[None, :]) ** 2
    return sf2 * np.exp(-0.5 * d2 / ell ** 2)

def gp_posterior(x, y, xs, ell, noise):
    L = np.linalg.cholesky(rbf(x, x, ell) + noise * np.eye(len(x)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    Ks = rbf(x, xs, ell)
    V = np.linalg.solve(L, Ks)
    return Ks.T @ alpha, np.diag(rbf(xs, xs, ell)) - (V ** 2).sum(axis=0)`;

const LML = `import numpy as np

def rbf(A, B, ell, sf2=1.0):
    return sf2 * np.exp(-0.5 * (A[:, None] - B[None, :]) ** 2 / ell ** 2)

def gp_log_marginal(x, y, ell, noise):
    L = np.linalg.cholesky(rbf(x, x, ell) + noise * np.eye(len(x)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    return float(-0.5 * y @ alpha - np.log(np.diag(L)).sum() - 0.5 * len(x) * np.log(2 * np.pi))

def sample_prior(xs, ell, n, seed=0):
    L = np.linalg.cholesky(rbf(xs, xs, ell) + 1e-9 * np.eye(len(xs)))
    return L @ np.random.default_rng(seed).normal(size=(len(xs), n))`;

export const lesson: LessonContent = {
  id: "l2.3.3",
  minutes: 60,
  links: {
    requires: ["l2.3.2", "l2.2.2", "m7.5.5"],
    revisits: ["m7.5.4"],
    foreshadows: ["l2.8.3"],
  },

  puzzle: (
    <>
      <p>
        You can afford to run an expensive simulation only twenty times and must predict its output everywhere else, with
        honest error bars so that you know where to run it next. You have no idea what functional form the output takes,
        only that it varies smoothly. What kind of model puts a prior directly on smooth functions?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of a prior on weights, put a prior on the function itself: say that its values at any finite set of inputs
        are jointly Gaussian, with nearby inputs strongly correlated. Then predicting at new inputs is conditioning one
        Gaussian on another, which has a closed form. The kernel is the covariance, and its lengthscale says how far apart
        two inputs must be before their values stop moving together.
      </p>
      <GpPosteriorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Gaussian process">
        <p>
          A random function f is a Gaussian process with mean 0 and covariance kernel k, written{" "}
          <M>{"f \\sim \\mathcal{GP}(0, k)"}</M>, if for every finite set of inputs <M>{"x_1, \\dots, x_n"}</M> the vector{" "}
          <M>{"(f(x_1), \\dots, f(x_n))"}</M> is <M>{"N(0, K)"}</M> with <M>{"K_{ij} = k(x_i, x_j)"}</M>. A common choice is{" "}
          <M>{"k(x, z) = s^2\\exp(-\\|x - z\\|^2/(2\\ell^2))"}</M>: s² sets the vertical scale and ℓ the horizontal one.
        </p>
      </Definition>

      <Theorem title="GP regression">
        <p>
          Observe <M>{"y_i = f(x_i) + \\varepsilon_i"}</M> with independent <M>{"\\varepsilon_i \\sim N(0, \\sigma^2)"}</M>.
          For a new input <M>{"x_*"}</M>, with <M>{"k_* = (k(x_i, x_*))_i"}</M>, the posterior of <M>{"f(x_*)"}</M> is normal
          with
        </p>
        <MD>{"\\text{mean } k_*^\\top(K + \\sigma^2 I)^{-1}y, \\qquad \\text{variance } k(x_*, x_*) - k_*^\\top(K + \\sigma^2I)^{-1}k_*."}</MD>
      </Theorem>
      <Proof>
        <p>
          The vector <M>{"(y, f(x_*))"}</M> is jointly Gaussian with mean 0, <M>{"\\mathrm{Cov}(y) = K + \\sigma^2 I"}</M>,{" "}
          <M>{"\\mathrm{Cov}(y, f(x_*)) = k_*"}</M> because the noise is independent of f, and{" "}
          <M>{"\\mathrm{Var}(f(x_*)) = k(x_*, x_*)"}</M>. Conditioning a Gaussian on part of itself gives the mean{" "}
          <M>{"\\Sigma_{21}\\Sigma_{11}^{-1}y"}</M> and variance <M>{"\\Sigma_{22} - \\Sigma_{21}\\Sigma_{11}^{-1}\\Sigma_{12}"}</M>,
          which are the stated formulas.
        </p>
      </Proof>
      <Remark title="three views of one model">
        <p>
          The posterior mean is exactly kernel ridge regression with λ = σ², so kernel ridge is the mean of a GP. With the
          linear kernel <M>{"k(x, z) = \\tau^2x^\\top z"}</M>, the GP is Bayesian linear regression viewed in function space.
          What the GP adds over kernel ridge is the variance, which does not depend on y at all, only on where the inputs
          are.
        </p>
      </Remark>

      <Example title="computing it stably">
        <p>
          Never invert <M>{"K + \\sigma^2 I"}</M>. Factor it once as <M>{"LL^\\top"}</M> by Cholesky, then{" "}
          <M>{"\\alpha = L^{-\\top}L^{-1}y"}</M> gives the mean <M>{"k_*^\\top\\alpha"}</M>, and <M>{"v = L^{-1}k_*"}</M> gives
          the variance <M>{"k(x_*, x_*) - \\|v\\|^2"}</M>. In the code, three points of sin x with tiny noise give variance 0
          at an observed input, 0.018 halfway between two, and 0.971 at x = 3, two lengthscales beyond the data, where the
          mean has decayed towards the prior mean 0.
        </p>
        <Code>{GP}</Code>
      </Example>

      <Theorem title="the marginal likelihood">
        <p>
          The observations are distributed as <M>{"y \\sim N(0, K + \\sigma^2 I)"}</M>, so with the Cholesky factor L,
        </p>
        <MD>{"\\log p(y) = -\\tfrac12 y^\\top\\alpha - \\sum_i \\log L_{ii} - \\tfrac n2\\log 2\\pi."}</MD>
      </Theorem>
      <Proof>
        <p>
          y is the sum of the independent Gaussian vectors <M>{"(f(x_i))_i \\sim N(0, K)"}</M> and{" "}
          <M>{"\\varepsilon \\sim N(0, \\sigma^2 I)"}</M>, so it is <M>{"N(0, K + \\sigma^2I)"}</M>. In the log density,{" "}
          <M>{"y^\\top(K + \\sigma^2I)^{-1}y = y^\\top\\alpha"}</M> and{" "}
          <M>{"\\tfrac12\\log\\det(LL^\\top) = \\sum_i\\log L_{ii}"}</M>.
        </p>
        <Code>{LML}</Code>
      </Proof>
      <Remark title="choosing the kernel">
        <p>
          The data-fit term <M>{"-\\tfrac12y^\\top\\alpha"}</M> favours flexible kernels, and the determinant term penalises
          them because a flexible prior spreads its probability over many datasets. For a wiggly target, ℓ = 0.05 is too
          flexible and ℓ = 5 cannot fit at all; the code finds ℓ = 0.5 far ahead of both. Hyperparameters are usually set by
          maximising this quantity with gradients. The <M>{"O(n^3)"}</M> Cholesky limits exact GPs to a few thousand points;
          beyond that, sparse approximations with inducing points take over.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "k",
      rung: "check",
      prompt: <p>With s² = 1 and ℓ = 1, what is the RBF covariance between inputs 2 apart? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1353, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>One noiseless observation y = 1 at x = 0, RBF kernel with s² = 1, ℓ = 1. What is the posterior mean at x = 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6065, tolerance: 0.0001 },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: <p>A GP with kernel k(x, z) = τ²xᵀz and Gaussian noise is the same model as which method?</p>,
      answer: { kind: "choice", options: ["Bayesian linear regression with prior N(0, τ²I)", "Ordinary least squares", "A degree-2 polynomial SVM", "k-nearest neighbours"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rbf(A, B, ell, sf2=1.0):
    d2 = (A[:, None] - B[None, :]) ** 2
    return sf2 * np.exp(-0.5 * d2 / ell ** 2)

def gp_posterior(x, y, xs, ell, noise):
    L = np.linalg.cholesky(rbf(x, x, ell) + noise * np.eye(len(x)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    Ks = rbf(x, xs, ell)
    V = np.linalg.solve(L, Ks)
    return Ks.T @ alpha, np.diag(rbf(xs, xs, ell)) - (V ** 2).sum(axis=0)

x = np.array([-1.0, 0.0, 1.0]); xs = np.array([0.0, 0.5, 3.0])
mu, var = gp_posterior(x, np.sin(x), xs, 1.0, 1e-6)
print(np.round(mu, 3) + 0.0, np.round(var, 3) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.    0.543 0.131] [0.    0.018 0.971]", "[0.    0.479 0.141] [0.    0.018 0.971]", "[0.    0.543 0.131] [1.    1.    1.   ]", "[0.    0.543 0.131] [0.971 0.018 0.   ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rbf(A, B, ell, sf2=1.0):
    return sf2 * np.exp(-0.5 * (A[:, None] - B[None, :]) ** 2 / ell ** 2)

def gp_log_marginal(x, y, ell, noise):
    L = np.linalg.cholesky(rbf(x, x, ell) + noise * np.eye(len(x)))
    alpha = np.linalg.solve(L.T, np.linalg.solve(L, y))
    return float(-0.5 * y @ alpha - np.log(np.diag(L)).sum() - 0.5 * len(x) * np.log(2 * np.pi))

def sample_prior(xs, ell, n, seed=0):
    L = np.linalg.cholesky(rbf(xs, xs, ell) + 1e-9 * np.eye(len(xs)))
    return L @ np.random.default_rng(seed).normal(size=(len(xs), n))

xt = np.linspace(0, 5, 12); yt = np.sin(2 * xt) + 0.1 * np.random.default_rng(0).normal(size=12)
print([round(gp_log_marginal(xt, yt, ell, 0.01), 1) for ell in (0.05, 0.5, 5.0)])
F = sample_prior(np.linspace(0, 1, 50), 0.2, 2000)
print(F.shape, round(float(F.var()), 1), round(float(np.corrcoef(F[0], F[1])[0, 1]), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-13.6, -8.4, -216.2]\n(50, 2000) 1.0 0.99", "[-8.4, -13.6, -216.2]\n(50, 2000) 1.0 0.99", "[-13.6, -8.4, -216.2]\n(2000, 50) 1.0 0.99", "[-13.6, -8.4, -216.2]\n(50, 2000) 0.2 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For one-dimensional inputs, write <C>rbf(A, B, ell, sf2=1.0)</C>, the matrix sf2·exp(−(aᵢ − bⱼ)²/(2ℓ²)), and{" "}
          <C>gp_posterior(x, y, xs, ell, noise)</C>, returning the posterior means and variances at xs, using a Cholesky
          factorisation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rbf(A, B, ell, sf2=1.0):
    return np.zeros((len(A), len(B)))

def gp_posterior(x, y, xs, ell, noise):
    return np.zeros(len(xs)), np.ones(len(xs))
`,
        solution: GP,
        tests: [
          { name: "one", code: `mu, var = gp_posterior(np.array([0.0]), np.array([1.0]), np.array([1.0]), 1.0, 0.0)
assert np.allclose(mu, [np.exp(-0.5)]) and np.allclose(var, [1 - np.exp(-1.0)]) and np.allclose(rbf(np.array([0.0]), np.array([2.0]), 1.0, 3.0), [[3 * np.exp(-2.0)]])` },
          { name: "krr", code: `x = np.array([0.0, 1.0, 2.5]); y = np.array([1.0, -1.0, 0.5]); xs = np.array([0.5, 4.0])
mu, var = gp_posterior(x, y, xs, 0.7, 0.1)
assert np.allclose(mu, rbf(xs, x, 0.7) @ np.linalg.solve(rbf(x, x, 0.7) + 0.1 * np.eye(3), y)) and np.all(var > 0) and var[1] > var[0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rbf(A, B, ell, sf2=1.0)</C> again, <C>gp_log_marginal(x, y, ell, noise)</C>, the log marginal likelihood
          as a float computed through a Cholesky factor, and <C>sample_prior(xs, ell, n, seed=0)</C>, returning an
          array of shape (len(xs), n) whose columns are prior draws, adding 1e-9 to the diagonal for stability.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rbf(A, B, ell, sf2=1.0):
    return np.zeros((len(A), len(B)))

def gp_log_marginal(x, y, ell, noise):
    return 0.0

def sample_prior(xs, ell, n, seed=0):
    return np.zeros((len(xs), n))
`,
        solution: LML,
        tests: [
          { name: "lml", code: `assert abs(gp_log_marginal(np.array([0.0]), np.array([1.0]), 1.0, 1.0) - (-0.25 - 0.5 * np.log(2) - 0.5 * np.log(2 * np.pi))) < 1e-12` },
          { name: "prior", code: `F = sample_prior(np.array([0.0, 0.1, 5.0]), 1.0, 20000)
C = np.cov(F)
assert F.shape == (3, 20000) and abs(C[0, 0] - 1) < 0.05 and abs(C[0, 1] - np.exp(-0.005)) < 0.05 and abs(C[0, 2]) < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          With one observation y = f(x) + ε, ε ~ N(0, σ²), and f ~ GP(0, k), derive the posterior mean and variance of f(x*)
          from the bivariate normal distribution of (y, f(x*)).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States that (y, f(x*)) is bivariate normal with mean 0, Var(y) = k(x, x) + σ², Cov(y, f(x*)) = k(x, x*) and Var(f(x*)) = k(x*, x*).",
          "Applies the conditional normal formula to get the mean k(x, x*)·y/(k(x, x) + σ²).",
          "Gets the variance k(x*, x*) − k(x, x*)²/(k(x, x) + σ²) and notes it does not depend on y.",
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: <p>One noiseless observation at x = 0, RBF kernel with s² = 1 and ℓ = 1. What is the posterior variance at x = 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6321, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a Gaussian process is, how GP regression comes from conditioning Gaussians, how it relates to kernel ridge and Bayesian linear regression, and how the marginal likelihood chooses the lengthscale.",

  glimpse: (
    <>
      <p>
        Kernels make smooth, global models. The next chapter takes the opposite approach: models that cut the input space
        into boxes with simple rules, and then combine many such models into ensembles that are among the strongest
        predictors for tabular data.
      </p>
    </>
  ),
};
