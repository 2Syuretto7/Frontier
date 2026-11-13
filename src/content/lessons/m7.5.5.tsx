import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GaussCondViz } from "@/components/viz/GaussCondViz";
import type { LessonContent } from "@/lib/types";

const COND = `import numpy as np

def condition_gaussian(mu, S, obs, x_obs):
    mu, S = np.asarray(mu, float), np.asarray(S, float)
    hid = [i for i in range(len(mu)) if i not in obs]
    S12 = S[np.ix_(hid, obs)]
    S22 = S[np.ix_(obs, obs)]
    K = np.linalg.solve(S22, S12.T).T
    mean = mu[hid] + K @ (np.asarray(x_obs) - mu[obs])
    cov = S[np.ix_(hid, hid)] - K @ S12.T
    return mean, cov

def kalman_update(m, v, y, r):
    gain = v / (v + r)
    return m + gain * (y - m), (1 - gain) * v`;

const GP = `import numpy as np

def rbf(a, b, ell=1.0):
    return np.exp(-0.5 * (a[:, None] - b[None, :]) ** 2 / ell ** 2)

def gp_posterior(xt, yt, xs, noise=1e-6, ell=1.0):
    K = rbf(xt, xt, ell) + noise * np.eye(len(xt))
    Ks = rbf(xs, xt, ell)
    mean = Ks @ np.linalg.solve(K, yt)
    var = 1.0 - np.sum(Ks * np.linalg.solve(K, Ks.T).T, axis=1)
    return mean, var`;

export const lesson: LessonContent = {
  id: "m7.5.5",
  minutes: 65,
  links: {
    requires: ["m7.5.4"],
    revisits: ["m7.5.2", "m7.1.4"],
    foreshadows: ["m7.6.3", "m9.7.2", "l2.3.3"],
  },

  puzzle: (
    <>
      <p>
        A sensor reports a temperature with known noise, and you had a prior guess with known uncertainty. Your updated
        belief should be a compromise. Exactly how should the two be weighted, and how uncertain are you afterwards? For
        normal distributions the answer is a short formula, and the same formula, applied to a whole function at once, is
        Gaussian process regression.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Slice a multivariate normal at observed values of some coordinates and the rest is again normal. Its mean shifts
        linearly with the observation, along the regression line; its covariance shrinks by an amount that does not depend
        on what was observed. Everything follows from splitting the unobserved part into a piece explained by the observed
        part and an independent remainder.
      </p>
      <GaussCondViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="conditioning a Gaussian">
        <p>
          Let <M>{"X = (X_1, X_2) \\sim N(\\mu, \\Sigma)"}</M> with blocks{" "}
          <M>{"\\mu = (\\mu_1, \\mu_2)"}</M> and <M>{"\\Sigma = \\begin{pmatrix}\\Sigma_{11} & \\Sigma_{12} \\\\ \\Sigma_{21} & \\Sigma_{22}\\end{pmatrix}"}</M>,{" "}
          <M>{"\\Sigma_{22}"}</M> invertible. Then, given <M>{"X_2 = x_2"}</M>,
        </p>
        <MD>{"X_1 \\sim N\\big(\\mu_1 + \\Sigma_{12}\\Sigma_{22}^{-1}(x_2 - \\mu_2),\\ \\Sigma_{11} - \\Sigma_{12}\\Sigma_{22}^{-1}\\Sigma_{21}\\big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"K = \\Sigma_{12}\\Sigma_{22}^{-1}"}</M> and <M>{"W = X_1 - KX_2"}</M>. Then{" "}
          <M>{"\\operatorname{Cov}(W, X_2) = \\Sigma_{12} - K\\Sigma_{22} = 0"}</M>. Since (W, X₂) is a linear image of X, it is
          jointly normal, so W and X₂ are independent. Now <M>{"X_1 = W + KX_2"}</M>, and given <M>{"X_2 = x_2"}</M> the
          independent W keeps its distribution, so <M>{"X_1 = W + Kx_2"}</M> is normal with mean{" "}
          <M>{"E[W] + Kx_2 = \\mu_1 + K(x_2 - \\mu_2)"}</M> and covariance{" "}
          <M>{"\\operatorname{Cov}(W) = \\Sigma_{11} - K\\Sigma_{21} - \\Sigma_{12}K^\\top + K\\Sigma_{22}K^\\top = \\Sigma_{11} - \\Sigma_{12}\\Sigma_{22}^{-1}\\Sigma_{21}"}</M>.
        </p>
        <Code>{COND}</Code>
      </Proof>
      <Remark title="reading the formula">
        <p>
          The conditional mean is the best linear predictor of the previous lessons, here also the best predictor of any
          kind. The conditional covariance, a Schur complement, is never larger than <M>{"\\Sigma_{11}"}</M> and does not
          depend on <M>{"x_2"}</M>: for Gaussians, how much you learn depends on what you measure, not on the values you see.
          In code, solve with <M>{"\\Sigma_{22}"}</M> rather than inverting it.
        </p>
      </Remark>

      <Example title="the sensor: one step of a Kalman filter">
        <p>
          Prior θ ~ N(m, v); observation Y = θ + ε with ε ~ N(0, r) independent. Then (θ, Y) is jointly normal with{" "}
          <M>{"\\operatorname{Var}(Y) = v + r"}</M> and <M>{"\\operatorname{Cov}(\\theta, Y) = v"}</M>, so
        </p>
        <MD>{"\\theta \\mid Y = y \\ \\sim\\ N\\Big(m + \\frac{v}{v + r}(y - m),\\ \\frac{vr}{v + r}\\Big)."}</MD>
        <p>
          The gain v/(v + r) weighs the observation by its relative reliability, and the precisions add:{" "}
          <M>{"1/\\text{posterior variance} = 1/v + 1/r"}</M>. A Kalman filter alternates this update with a linear-Gaussian
          prediction step.
        </p>
      </Example>

      <Example title="Gaussian process regression">
        <p>
          Model an unknown function f by declaring that for any finite set of inputs, the values f(x) are jointly normal with
          mean 0 and covariance <M>{"k(x, x') = \\exp(-(x - x')^2/2\\ell^2)"}</M>. Observing f at training inputs, possibly
          with noise variance added to the diagonal, and conditioning gives a normal for f at test inputs: the posterior mean{" "}
          <M>{"K_{*}(K + \\sigma^2I)^{-1}y"}</M> interpolates the data, and the posterior variance is near 0 close to the data and
          returns to the prior variance 1 far away.
        </p>
        <Code>{GP}</Code>
      </Example>

      <Remark title="the precision matrix">
        <p>
          The inverse <M>{"\\Sigma^{-1}"}</M> has its own meaning: <M>{"(\\Sigma^{-1})_{ij} = 0"}</M> exactly when{" "}
          <M>{"X_i"}</M> and <M>{"X_j"}</M> are conditionally independent given all the other coordinates. Sparse precision
          matrices are the Gaussian graphical models of statistics.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cmean",
      rung: "check",
      prompt: <p>(X₁, X₂) is standard bivariate normal with correlation 0.6. What is E[X₁ | X₂ = 1]?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0001 },
    },
    {
      key: "cvar",
      rung: "check",
      prompt: <p>In the same model, what is Var(X₁ | X₂ = 1)?</p>,
      answer: { kind: "numeric", value: 0.64, tolerance: 0.0001 },
    },
    {
      key: "kalman",
      rung: "apply",
      prompt: <p>Prior θ ~ N(0, 4). You observe y = 5 from Y = θ + ε with ε ~ N(0, 1). What is the posterior mean of θ?</p>,
      answer: { kind: "choice", options: ["4", "5", "2.5", "1"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def condition_gaussian(mu, S, obs, x_obs):
    mu, S = np.asarray(mu, float), np.asarray(S, float)
    hid = [i for i in range(len(mu)) if i not in obs]
    S12 = S[np.ix_(hid, obs)]
    S22 = S[np.ix_(obs, obs)]
    K = np.linalg.solve(S22, S12.T).T
    mean = mu[hid] + K @ (np.asarray(x_obs) - mu[obs])
    cov = S[np.ix_(hid, hid)] - K @ S12.T
    return mean, cov

def kalman_update(m, v, y, r):
    gain = v / (v + r)
    return m + gain * (y - m), (1 - gain) * v

S = [[1.0, 0.8], [0.8, 1.0]]
m, c = condition_gaussian([0.0, 0.0], S, [1], [2.0])
print(m, c.round(2), kalman_update(0.0, 4.0, 5.0, 1.0))
m, c = condition_gaussian([1.0, 2.0, 3.0], np.eye(3), [0, 2], [5.0, 5.0])
print(m, c)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.6] [[0.36]] (4.0, 0.7999999999999998)\n[2.] [[1.]]",
          "[1.6] [[0.64]] (4.0, 0.7999999999999998)\n[2.] [[1.]]",
          "[2.] [[0.36]] (4.0, 0.7999999999999998)\n[2.] [[1.]]",
          "[1.6] [[0.36]] (4.0, 0.7999999999999998)\n[5.] [[1.]]",
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

def rbf(a, b, ell=1.0):
    return np.exp(-0.5 * (a[:, None] - b[None, :]) ** 2 / ell ** 2)

def gp_posterior(xt, yt, xs, noise=1e-6, ell=1.0):
    K = rbf(xt, xt, ell) + noise * np.eye(len(xt))
    Ks = rbf(xs, xt, ell)
    mean = Ks @ np.linalg.solve(K, yt)
    var = 1.0 - np.sum(Ks * np.linalg.solve(K, Ks.T).T, axis=1)
    return mean, var

mean, var = gp_posterior(np.array([0.0, 1.0]), np.array([1.0, -1.0]), np.array([0.0, 0.5, 5.0]))
print(np.round(mean, 3) + 0.0, np.round(var, 3) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[ 1.     0.    -0.001] [0.   0.03 1.  ]",
          "[ 1.     0.    -0.001] [1.   0.97 0.  ]",
          "[ 1.     0.5   -0.001] [0.   0.03 1.  ]",
          "[ 1.     0.    -0.001] [0.   0.5  1.  ]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>condition_gaussian(mu, S, obs, x_obs)</C>, returning the conditional mean and covariance of the coordinates
          not in the index list obs, given that those in obs equal x_obs (use a linear solve, not an inverse), and{" "}
          <C>kalman_update(m, v, y, r)</C> for the scalar prior N(m, v) and observation noise variance r, returning (posterior
          mean, posterior variance).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def condition_gaussian(mu, S, obs, x_obs):
    return None, None

def kalman_update(m, v, y, r):
    return y, r
`,
        solution: COND,
        tests: [
          { name: "bivariate", code: `m, c = condition_gaussian([0.0, 0.0], [[1.0, 0.8], [0.8, 1.0]], [1], [2.0])
assert np.allclose(m, [1.6]) and np.allclose(c, [[0.36]])
m, c = condition_gaussian([1.0, 2.0, 3.0], [[2, 1, 0], [1, 2, 1], [0, 1, 2]], [1, 2], [2.0, 3.0])
assert np.allclose(m, [1.0]) and np.allclose(c, [[4 / 3]])` },
          { name: "against sampling and kalman", code: `S = np.array([[1.0, 0.5, 0.2], [0.5, 2.0, 0.3], [0.2, 0.3, 1.5]])
m, c = condition_gaussian([0.0, 1.0, -1.0], S, [2], [0.0])
assert m.shape == (2,) and c.shape == (2, 2) and np.allclose(c, c.T)
assert np.allclose(m, [0.2 / 1.5, 1 + 0.3 / 1.5]) and np.allclose(c[0, 0], 1 - 0.04 / 1.5)
pm, pv = kalman_update(0.0, 4.0, 5.0, 1.0)
assert abs(pm - 4) < 1e-12 and abs(pv - 0.8) < 1e-12
mm, cc = condition_gaussian([0.0, 0.0], [[4.0, 4.0], [4.0, 5.0]], [1], [5.0])
assert abs(mm[0] - pm) < 1e-12 and abs(cc[0, 0] - pv) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rbf(a, b, ell=1.0)</C>, the matrix of exp(−(aᵢ − bⱼ)²/2ℓ²) for 1-D arrays, and{" "}
          <C>gp_posterior(xt, yt, xs, noise=1e-6, ell=1.0)</C>, returning the posterior mean and the posterior variance
          (diagonal only) at the test inputs xs, for a zero-mean GP with this kernel and the given noise variance.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rbf(a, b, ell=1.0):
    return np.zeros((len(a), len(b)))

def gp_posterior(xt, yt, xs, noise=1e-6, ell=1.0):
    return np.zeros(len(xs)), np.ones(len(xs))
`,
        solution: GP,
        tests: [
          { name: "kernel", code: `K = rbf(np.array([0.0, 1.0]), np.array([0.0, 2.0, 1.0]))
assert K.shape == (2, 3) and np.allclose(K[0], [1, np.exp(-2), np.exp(-0.5)]) and np.allclose(rbf(np.array([0.0]), np.array([1.0]), ell=2.0), np.exp(-1 / 8))` },
          { name: "posterior", code: `xt = np.array([-1.0, 0.0, 2.0]); yt = np.array([0.5, 1.0, -1.0])
mean, var = gp_posterior(xt, yt, xt)
assert np.allclose(mean, yt, atol=1e-4) and np.all(np.abs(var) < 1e-4)
mean, var = gp_posterior(xt, yt, np.array([10.0]))
assert abs(mean[0]) < 1e-6 and abs(var[0] - 1) < 1e-6
m1, v1 = gp_posterior(xt, yt, np.array([0.5]), noise=0.5)
assert 0 < v1[0] < 1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          (X, Y) is bivariate normal with means 0, variances <M>{"\\sigma_X^2, \\sigma_Y^2"}</M> and covariance c. Let{" "}
          <M>{"W = X - (c/\\sigma_Y^2)Y"}</M>. Prove that W is independent of Y, and deduce E[X | Y = y] and Var(X | Y = y).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes Cov(W, Y) = c − (c/σ_Y²)σ_Y² = 0.",
          "Argues (W, Y) is jointly normal (a linear image of (X, Y)), so zero covariance implies independence.",
          "Writes X = W + (c/σ_Y²)Y and concludes, given Y = y, mean (c/σ_Y²)y and variance Var(W) = σ_X² − c²/σ_Y².",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: <p>X ~ N(0, Σ) with Σ = [[2, 1, 0], [1, 2, 1], [0, 1, 2]]. What is Var(X₁ | X₂, X₃)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.3333, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how to condition a multivariate normal on some of its coordinates, why the conditional mean is linear in the observation while the conditional covariance does not depend on it, and how this gives the Kalman update and Gaussian process regression.",

  glimpse: (
    <>
      <p>
        Conditioning on the value of a random variable, rather than on an event of positive probability, needs a general
        notion: the conditional expectation E[X | Y], itself a random variable. The next chapter builds it, and shows it is
        always the best predictor in mean square, as the Gaussian formula was here.
      </p>
    </>
  ),
};
