import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PriorContourViz } from "@/components/viz/PriorContourViz";
import type { LessonContent } from "@/lib/types";

const RIDGE = `import numpy as np

def map_gaussian(X, y, sigma2, tau2):
    lam = sigma2 / tau2
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)

def neg_log_post(X, y, w, sigma2, tau2):
    r = y - X @ w
    return float(r @ r / (2 * sigma2) + w @ w / (2 * tau2))`;

const LASSO = `import numpy as np

def soft(z, t):
    return np.sign(z) * np.maximum(np.abs(z) - t, 0.0) + 0.0

def map_laplace(X, y, lam, iters=500):
    w = np.zeros(X.shape[1])
    col = (X ** 2).sum(axis=0)
    for _ in range(iters):
        for j in range(X.shape[1]):
            r = y - X @ w + X[:, j] * w[j]
            w[j] = soft(X[:, j] @ r, lam) / col[j]
    return w`;

export const lesson: LessonContent = {
  id: "l2.1.3",
  minutes: 55,
  links: {
    requires: ["l2.1.2", "l1.5.3"],
    revisits: ["m9.7.3", "m9.6.4"],
    foreshadows: ["l2.2.2"],
  },

  puzzle: (
    <>
      <p>
        Ridge adds λ‖w‖² to the squared error and lasso adds λ‖w‖₁. Both were introduced as penalties that stop
        overfitting, with λ chosen by cross-validation. Is there a reason for these particular penalties, and what is λ
        actually measuring? Why does one of them set weights exactly to zero while the other never does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A penalty is a prior in disguise. If before seeing data you believe the weights are probably small, write that
        belief as a distribution, multiply it by the likelihood, and take the most probable weights. A bell-shaped prior
        gives the squared penalty; a prior with a sharp peak at zero gives the absolute-value penalty, and that peak is
        what pulls weights all the way to zero.
      </p>
      <PriorContourViz />
    </>
  ),

  theory: (
    <>
      <Definition title="maximum a posteriori estimate">
        <p>With a prior p(w) on the parameters, Bayes&apos; rule gives the posterior and its mode:</p>
        <MD>{"\\hat w_{\\mathrm{MAP}} = \\arg\\max_w p(w \\mid \\mathcal D) = \\arg\\min_w \\big[-\\log p(\\mathcal D \\mid w) - \\log p(w)\\big],"}</MD>
        <p>since the evidence p(𝒟) does not depend on w. The prior adds one term to the negative log-likelihood.</p>
      </Definition>

      <Theorem title="a Gaussian prior gives ridge">
        <p>
          With Gaussian noise of variance σ² and prior <M>{"w \\sim N(0, \\tau^2 I)"}</M>, the MAP estimate minimises{" "}
          <M>{"\\|y - Xw\\|^2 + \\lambda\\|w\\|^2"}</M> with <M>{"\\lambda = \\sigma^2/\\tau^2"}</M>, and equals{" "}
          <M>{"(X^\\top X + \\lambda I)^{-1}X^\\top y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Up to constants, the negative log-posterior is <M>{"\\frac{\\|y - Xw\\|^2}{2\\sigma^2} + \\frac{\\|w\\|^2}{2\\tau^2}"}</M>.
          Multiplying by 2σ² gives the ridge objective. Its gradient{" "}
          <M>{"-2X^\\top(y - Xw) + 2\\lambda w"}</M> vanishes at the stated w, and the objective is strictly convex because{" "}
          <M>{"X^\\top X + \\lambda I"}</M> is positive definite for λ &gt; 0.
        </p>
        <Code>{RIDGE}</Code>
      </Proof>
      <Remark title="what λ means">
        <p>
          λ is the ratio of noise variance to prior variance. A vague prior (large τ²) gives small λ and nearly the
          least-squares answer; noisy data (large σ²) gives large λ and leans on the prior. Because{" "}
          <M>{"X^\\top X"}</M> grows in proportion to n while λ stays fixed, the prior&apos;s influence fades as data
          accumulate. Weight decay in neural networks is the same Gaussian prior applied to every weight.
        </p>
      </Remark>

      <Theorem title="a Laplace prior gives the lasso, and soft thresholding">
        <p>
          With independent Laplace priors of scale b on each weight, the MAP estimate minimises{" "}
          <M>{"\\tfrac12\\|y - Xw\\|^2 + \\lambda\\|w\\|_1"}</M> with <M>{"\\lambda = \\sigma^2/b"}</M>. In one dimension,{" "}
          <M>{"\\arg\\min_w \\tfrac12(w - z)^2 + \\lambda|w|"}</M> is the soft threshold{" "}
          <M>{"S_\\lambda(z) = \\mathrm{sign}(z)\\max(|z| - \\lambda, 0)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The negative log-prior is <M>{"\\|w\\|_1/b"}</M> plus a constant; multiplying the negative log-posterior by σ² gives
          the stated objective. For the one-dimensional problem, on w &gt; 0 the derivative is w − z + λ, zero at z − λ,
          which is positive exactly when z &gt; λ; on w &lt; 0 the derivative is w − z − λ, zero at z + λ, which is negative
          exactly when z &lt; −λ. If |z| ≤ λ, the derivative is ≥ 0 for every w &gt; 0 and ≤ 0 for every w &lt; 0, so the
          convex function is minimised at 0. The three cases are <M>{"S_\\lambda(z)"}</M>.
        </p>
        <p>
          Coordinate descent applies this one coordinate at a time: holding the others fixed, the best <M>{"w_j"}</M> is{" "}
          <M>{"S_\\lambda(x_j^\\top r_j)/\\|x_j\\|^2"}</M>, where <M>{"r_j"}</M> is the residual without feature j. Any
          coordinate whose correlation with the residual is below λ is set exactly to zero, which is why lasso selects
          features.
        </p>
        <Code>{LASSO}</Code>
      </Proof>
      <Remark title="MAP is not the posterior">
        <p>
          MAP keeps only the peak of the posterior. It ignores the posterior&apos;s spread, and it changes under
          reparametrisation, so it is a point estimate that happens to be motivated by a prior. The lasso&apos;s exact zeros
          are a property of the mode; the full Laplace posterior puts probability zero on any weight being exactly 0. The
          next chapter keeps the whole posterior for linear regression.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lam",
      rung: "check",
      prompt: <p>Noise variance σ² = 4 and prior variance τ² = 2. What is the equivalent ridge penalty λ?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
    {
      key: "soft",
      rung: "check",
      prompt: <p>What is the soft threshold S₁(2.5)?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.001 },
    },
    {
      key: "sparse",
      rung: "apply",
      prompt: <p>Which prior makes the MAP estimate set some weights exactly to zero?</p>,
      answer: {
        kind: "choice",
        options: ["A Laplace prior", "A Gaussian prior", "A flat prior", "A Gaussian prior with a very small variance"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def map_gaussian(X, y, sigma2, tau2):
    lam = sigma2 / tau2
    return np.linalg.solve(X.T @ X + lam * np.eye(X.shape[1]), X.T @ y)

def neg_log_post(X, y, w, sigma2, tau2):
    r = y - X @ w
    return float(r @ r / (2 * sigma2) + w @ w / (2 * tau2))

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]); y = np.array([2.0, 1.0, 4.0])
print(np.round(map_gaussian(X, y, 1.0, 1e6), 3), np.round(map_gaussian(X, y, 1.0, 1.0), 3))
w = map_gaussian(X, y, 1.0, 1.0)
print(round(neg_log_post(X, y, w, 1.0, 1.0), 4), neg_log_post(X, y, w, 1.0, 1.0) < neg_log_post(X, y, w * 1.1, 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2.333 1.333] [1.625 1.125]\n2.8125 True", "[2.333 1.333] [2.333 1.333]\n2.8125 True", "[1.625 1.125] [2.333 1.333]\n2.8125 True", "[2.333 1.333] [1.625 1.125]\n2.8125 False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def soft(z, t):
    return np.sign(z) * np.maximum(np.abs(z) - t, 0.0) + 0.0

def map_laplace(X, y, lam, iters=500):
    w = np.zeros(X.shape[1])
    col = (X ** 2).sum(axis=0)
    for _ in range(iters):
        for j in range(X.shape[1]):
            r = y - X @ w + X[:, j] * w[j]
            w[j] = soft(X[:, j] @ r, lam) / col[j]
    return w

print(soft(np.array([3.0, 0.5, -2.0]), 1.0))
rng = np.random.default_rng(0); Z = rng.normal(size=(50, 5)); t = Z @ np.array([3.0, 0, 0, 1.5, 0]) + rng.normal(size=50)
print(np.round(map_laplace(Z, t, 20.0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 2.  0. -1.]\n[2.25 0.   0.   1.   0.  ]", "[ 2.  -0.5 -1. ]\n[2.25 0.   0.   1.   0.  ]", "[ 2.  0. -1.]\n[2.99 0.02 0.01 1.5  0.03]", "[ 2.  0.  1.]\n[2.25 0.   0.   1.   0.  ]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>map_gaussian(X, y, sigma2, tau2)</C>, the MAP weights under Gaussian noise and an N(0, τ²I) prior, and{" "}
          <C>neg_log_post(X, y, w, sigma2, tau2)</C>, the negative log-posterior ‖y − Xw‖²/(2σ²) + ‖w‖²/(2τ²) as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def map_gaussian(X, y, sigma2, tau2):
    return np.zeros(X.shape[1])

def neg_log_post(X, y, w, sigma2, tau2):
    return 0.0
`,
        solution: RIDGE,
        tests: [
          { name: "1d", code: `X = np.ones((8, 1)); y = np.full(8, 2.0)
assert abs(map_gaussian(X, y, 1.0, 0.5)[0] - 1.6) < 1e-12` },
          { name: "min", code: `X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]); y = np.array([2.0, 1.0, 4.0])
w = map_gaussian(X, y, 2.0, 0.5)
assert all(neg_log_post(X, y, w, 2.0, 0.5) < neg_log_post(X, y, w + d, 2.0, 0.5) for d in np.eye(2) * 0.01) and abs(neg_log_post(X, y, np.zeros(2), 1.0, 1.0) - 10.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soft(z, t)</C>, the soft threshold applied elementwise, and <C>map_laplace(X, y, lam, iters=500)</C>,
          which minimises ½‖y − Xw‖² + λ‖w‖₁ by cyclic coordinate descent from w = 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def soft(z, t):
    return z

def map_laplace(X, y, lam, iters=500):
    return np.zeros(X.shape[1])
`,
        solution: LASSO,
        tests: [
          { name: "soft", code: `assert np.allclose(soft(np.array([3.0, 0.5, -2.0, -0.2]), 1.0), [2.0, 0.0, -1.0, 0.0])` },
          { name: "lasso", code: `X = np.eye(3) * 2.0; y = np.array([6.0, 1.0, -4.0])
assert np.allclose(map_laplace(X, y, 4.0), [2.0, 0.0, -1.0]) and np.allclose(map_laplace(X, y, 0.0), [3.0, 0.5, -2.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for λ &gt; 0 the minimiser of f(w) = ½(w − z)² + λ|w| over real w is sign(z)·max(|z| − λ, 0).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Handles w > 0: f is differentiable with derivative w − z + λ, giving the candidate z − λ, valid only when z > λ.",
          "Handles w < 0 symmetrically, giving z + λ when z < −λ.",
          "Shows that when |z| ≤ λ the minimum is at 0 (f is non-decreasing to the right of 0 and non-increasing to the left), and that these cases combine into the soft threshold.",
        ],
      },
    },
    {
      key: "shrink",
      rung: "stretch",
      prompt: (
        <p>
          A constant model w is fitted to 8 targets with mean 2, with σ² = 1 and prior N(0, 0.5). The MAP estimate is
          nȳ/(n + σ²/τ²). What is it?
        </p>
      ),
      answer: { kind: "numeric", value: 1.6, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what a MAP estimate is, why a Gaussian prior gives ridge and a Laplace prior gives lasso, what λ measures, and why lasso produces exact zeros while ridge does not.",

  glimpse: (
    <>
      <p>
        Likelihood, prior and point estimate are in place. Before fitting richer models, the next lesson asks what we
        should do with a predictive distribution once we have it: which single prediction to report depends on the loss
        you will be charged.
      </p>
    </>
  ),
};
