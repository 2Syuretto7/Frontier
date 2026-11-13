import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BayesLinViz } from "@/components/viz/BayesLinViz";
import type { LessonContent } from "@/lib/types";

const POST = `import numpy as np

def posterior(X, y, sigma2, tau2):
    S = np.linalg.inv(X.T @ X / sigma2 + np.eye(X.shape[1]) / tau2)
    m = S @ X.T @ y / sigma2
    return m, S

def predictive(Xs, m, S, sigma2):
    mean = Xs @ m
    var = sigma2 + np.einsum("ij,jk,ik->i", Xs, S, Xs)
    return mean, var`;

const EVID = `import numpy as np

def log_evidence(X, y, sigma2, tau2):
    C = tau2 * X @ X.T + sigma2 * np.eye(len(y))
    sign, logdet = np.linalg.slogdet(C)
    return float(-0.5 * (y @ np.linalg.solve(C, y) + logdet + len(y) * np.log(2 * np.pi)))

def best_tau2(X, y, sigma2, grid):
    scores = [log_evidence(X, y, sigma2, t) for t in grid]
    return float(grid[int(np.argmax(scores))])`;

export const lesson: LessonContent = {
  id: "l2.2.2",
  minutes: 55,
  links: {
    requires: ["l2.2.1", "l2.1.3"],
    revisits: ["m7.5.5", "m9.7.2", "m9.6.3"],
    foreshadows: ["l2.3.3", "l2.8.3"],
  },

  puzzle: (
    <>
      <p>
        A regression model trained on house prices between 50 and 200 square metres is asked about a 600 square metre
        mansion. It returns a number with the same confidence it has everywhere else. How could a linear model know that it
        is extrapolating, and say so in its output?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of one weight vector, keep the whole posterior over weights. Directions in weight space that the data pin
        down get a narrow posterior; directions the data never probed keep the prior&apos;s width. A prediction at a new
        input averages over all plausible weights, so its variance is large exactly where those weights disagree, which is
        far from the data.
      </p>
      <BayesLinViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the posterior over weights">
        <p>
          With <M>{"y = Xw + \\varepsilon"}</M>, <M>{"\\varepsilon \\sim N(0, \\sigma^2 I)"}</M> and prior{" "}
          <M>{"w \\sim N(0, \\tau^2 I)"}</M>, the posterior is <M>{"N(m, S)"}</M> with
        </p>
        <MD>{"S = \\Big(\\frac{X^\\top X}{\\sigma^2} + \\frac{I}{\\tau^2}\\Big)^{-1}, \\qquad m = \\frac{1}{\\sigma^2} S X^\\top y."}</MD>
      </Theorem>
      <Proof>
        <p>The log posterior is, up to a constant,</p>
        <MD>{"-\\frac{\\|y - Xw\\|^2}{2\\sigma^2} - \\frac{\\|w\\|^2}{2\\tau^2} = -\\frac12 w^\\top S^{-1} w + w^\\top \\frac{X^\\top y}{\\sigma^2} + \\text{const}."}</MD>
        <p>
          Completing the square, this is <M>{"-\\frac12 (w - m)^\\top S^{-1}(w - m)"}</M> plus a constant when{" "}
          <M>{"S^{-1}m = X^\\top y/\\sigma^2"}</M>. A density whose log is this quadratic is <M>{"N(m, S)"}</M>.
        </p>
      </Proof>
      <Remark title="the mean is ridge">
        <p>
          Multiplying through by σ² gives <M>{"m = (X^\\top X + \\lambda I)^{-1}X^\\top y"}</M> with{" "}
          <M>{"\\lambda = \\sigma^2/\\tau^2"}</M>, the ridge solution and the MAP estimate, because a Gaussian&apos;s mean is
          its mode. What the Bayesian treatment adds is S. Precisions add: the prior contributes <M>{"I/\\tau^2"}</M>, each
          observation contributes <M>{"x_ix_i^\\top/\\sigma^2"}</M>, only in the direction of its own input.
        </p>
      </Remark>

      <Theorem title="the posterior predictive">
        <p>
          For a new input x, the predictive distribution of <M>{"y_* = x^\\top w + \\varepsilon_*"}</M> is{" "}
          <M>{"N(x^\\top m,\\ \\sigma^2 + x^\\top S x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Under the posterior, <M>{"x^\\top w"}</M> is a linear function of a Gaussian, so it is{" "}
          <M>{"N(x^\\top m, x^\\top S x)"}</M>. The new noise <M>{"\\varepsilon_* \\sim N(0, \\sigma^2)"}</M> is independent of
          w, and the sum of independent Gaussians is Gaussian with the means and variances added.
        </p>
        <Code>{POST}</Code>
      </Proof>
      <Example title="two sources of uncertainty">
        <p>
          The term σ² is noise that no amount of data removes. The term <M>{"x^\\top S x"}</M> is uncertainty about the
          weights, which shrinks as data accumulate along x and stays large in unexplored directions. In the code, five
          inputs between −1 and 1 give predictive variance 0.30 at x = 0, 0.40 at x = 1 and 1.88 at x = 4: the model knows
          it is extrapolating.
        </p>
      </Example>

      <Theorem title="the evidence">
        <p>
          Integrating out w, the marginal distribution of the targets is{" "}
          <M>{"y \\sim N(0,\\ \\tau^2 XX^\\top + \\sigma^2 I)"}</M>, so the log evidence is
        </p>
        <MD>{"\\log p(y \\mid X) = -\\frac12\\Big(y^\\top C^{-1} y + \\log\\det C + n\\log 2\\pi\\Big), \\qquad C = \\tau^2 XX^\\top + \\sigma^2 I."}</MD>
      </Theorem>
      <Proof>
        <p>
          y = Xw + ε is a linear function of the independent Gaussians w and ε, so it is Gaussian with mean 0 and covariance{" "}
          <M>{"X(\\tau^2 I)X^\\top + \\sigma^2 I"}</M>. The formula is the log of the multivariate normal density.
        </p>
        <Code>{EVID}</Code>
      </Proof>
      <Remark title="choosing hyperparameters without a validation set">
        <p>
          Maximising the evidence over τ² and σ², called empirical Bayes or type-II maximum likelihood, trades fit (the
          quadratic term) against complexity (the log determinant, which grows when the prior allows many datasets). It
          selects a sensible ridge penalty from the training data alone. Gaussian processes, in the next chapter, fit
          their kernel parameters the same way.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pv",
      rung: "check",
      prompt: <p>A constant model sees 9 observations with σ² = 1 and prior variance τ² = 1. What is the posterior variance of the weight?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "pred",
      rung: "check",
      prompt: <p>With σ² = 0.25, S = diag(0.05, 0.1) and x = (1, 2), what is the predictive variance σ² + xᵀSx?</p>,
      answer: { kind: "numeric", value: 0.7, tolerance: 0.0001 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>As more and more data arrive spread over all directions, what does the predictive variance at a fixed x approach?</p>,
      answer: { kind: "choice", options: ["The noise variance σ²", "Zero", "The prior variance τ²‖x‖²", "It grows without bound"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def posterior(X, y, sigma2, tau2):
    S = np.linalg.inv(X.T @ X / sigma2 + np.eye(X.shape[1]) / tau2)
    m = S @ X.T @ y / sigma2
    return m, S

def predictive(Xs, m, S, sigma2):
    mean = Xs @ m
    var = sigma2 + np.einsum("ij,jk,ik->i", Xs, S, Xs)
    return mean, var

m, S = posterior(np.ones((4, 1)), np.array([1.0, 2.0, 3.0, 2.0]), 1.0, 1.0)
print(np.round(m, 3), np.round(S, 3), np.round(predictive(np.ones((1, 1)), m, S, 1.0), 3).ravel())
X = np.column_stack([np.ones(5), np.linspace(-1, 1, 5)]); m, S = posterior(X, np.zeros(5), 0.25, 10.0)
print(np.round(predictive(np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 4.0]]), m, S, 0.25)[1], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.6] [[0.2]] [1.6 1.2]\n[0.3   0.399 1.884]", "[2.] [[0.25]] [2.   1.25]\n[0.3   0.399 1.884]", "[1.6] [[0.2]] [1.6 0.2]\n[0.3   0.399 1.884]", "[1.6] [[0.2]] [1.6 1.2]\n[0.3   0.3   0.3  ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def log_evidence(X, y, sigma2, tau2):
    C = tau2 * X @ X.T + sigma2 * np.eye(len(y))
    sign, logdet = np.linalg.slogdet(C)
    return float(-0.5 * (y @ np.linalg.solve(C, y) + logdet + len(y) * np.log(2 * np.pi)))

def best_tau2(X, y, sigma2, grid):
    scores = [log_evidence(X, y, sigma2, t) for t in grid]
    return float(grid[int(np.argmax(scores))])

rng = np.random.default_rng(0); Z = rng.normal(size=(40, 3)); t = Z @ np.array([2.0, -1.0, 0.5]) + rng.normal(size=40)
print(best_tau2(Z, t, 1.0, np.array([0.01, 0.1, 1.0, 10.0, 100.0])))
print(round(log_evidence(np.ones((1, 1)), np.array([0.0]), 1.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0\n-1.2655", "0.01\n-1.2655", "100.0\n-1.2655", "1.0\n-0.9189"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>posterior(X, y, sigma2, tau2)</C>, returning the posterior mean m and covariance S, and{" "}
          <C>predictive(Xs, m, S, sigma2)</C>, returning the predictive means and variances for the rows of Xs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def posterior(X, y, sigma2, tau2):
    p = X.shape[1]
    return np.zeros(p), np.eye(p)

def predictive(Xs, m, S, sigma2):
    return Xs @ m, np.full(len(Xs), sigma2)
`,
        solution: POST,
        tests: [
          { name: "post", code: `m, S = posterior(np.ones((9, 1)), np.full(9, 1.0), 1.0, 1.0)
assert np.allclose(S, [[0.1]]) and np.allclose(m, [0.9])` },
          { name: "pred", code: `mu, v = predictive(np.array([[1.0, 2.0], [0.0, 0.0]]), np.array([1.0, 1.0]), np.diag([0.05, 0.1]), 0.25)
assert np.allclose(mu, [3.0, 0.0]) and np.allclose(v, [0.7, 0.25])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_evidence(X, y, sigma2, tau2)</C>, the log marginal likelihood as a float, and{" "}
          <C>best_tau2(X, y, sigma2, grid)</C>, the grid value with the largest evidence (the first if tied).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_evidence(X, y, sigma2, tau2):
    return 0.0

def best_tau2(X, y, sigma2, grid):
    return float(grid[0])
`,
        solution: EVID,
        tests: [
          { name: "value", code: `assert abs(log_evidence(np.ones((1, 1)), np.array([1.0]), 1.0, 1.0) - (-0.5 * (0.5 + np.log(2) + np.log(2 * np.pi)))) < 1e-12` },
          { name: "best", code: `X = np.ones((3, 1)); g = np.array([0.1, 1.0, 10.0, 100.0])
assert best_tau2(X, np.zeros(3), 1.0, g) == 0.1 and best_tau2(X, np.full(3, 5.0), 1.0, g) in (10.0, 100.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Given the posterior w ~ N(m, S) and independent noise ε ~ N(0, σ²), prove that y = xᵀw + ε has distribution N(xᵀm, σ² + xᵀSx).</p>,
      answer: {
        kind: "written",
        rubric: [
          "States that xᵀw is Gaussian as a linear function of a Gaussian vector.",
          "Computes its mean xᵀm and variance xᵀSx.",
          "Uses independence of w and ε to conclude the sum is Gaussian with mean xᵀm and variance xᵀSx + σ².",
        ],
      },
    },
    {
      key: "ev",
      rung: "stretch",
      prompt: <p>One observation y = 2 with x = 1, σ² = 1 and τ² = 3. What is the log evidence? Give four decimal places.</p>,
      answer: { kind: "numeric", value: -2.1121, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend how the posterior over regression weights is computed, why its mean is the ridge solution, where the two terms of the predictive variance come from, and how the evidence can choose the prior variance.",

  glimpse: (
    <>
      <p>
        So far the noise has been Gaussian and the output real. Classification needs a different likelihood: the next
        lesson puts a Bernoulli or categorical distribution on top of a linear score and derives logistic and softmax
        regression.
      </p>
    </>
  ),
};
