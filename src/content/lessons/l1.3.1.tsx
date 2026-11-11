import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LogisticViz } from "@/components/viz/LogisticViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.3.1",
  minutes: 55,
  links: {
    revisits: ["l1.2.4", "l0.3.4"],
    parallels: ["m0.4.3", "m7.1.3"],
    foreshadows: ["l2.2.3", "l3.3.2", "m12.1.2"],
  },

  puzzle: (
    <>
      <p>
        You have data on hours of driving practice and whether each learner passed the test. You want a model that, given
        the hours, says how likely a pass is.
      </p>
      <p>
        A straight line fitted to the 0s and 1s would predict probabilities below 0 for few hours and above 1 for many.
        What shape should the prediction have instead? What should it do at the extremes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A probability must stay between 0 and 1, rise with practice, and level off at both ends: an S shape. Logistic
        regression takes the straight line <M>{"w_0 + w_1 x"}</M> of linear regression and squeezes it through the{" "}
        <strong>sigmoid</strong> function, which turns any number into a probability.
      </p>
      <LogisticViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the sigmoid">
        <p>The <strong>sigmoid</strong> or logistic function is</p>
        <MD>{"\\sigma(z) = \\frac{1}{1 + e^{-z}}."}</MD>
        <p>
          It is 0.5 at <M>{"z = 0"}</M>, approaches 1 as <M>z</M> grows and 0 as <M>z</M> falls, and{" "}
          <M>{"\\sigma(-z) = 1 - \\sigma(z)"}</M>.
        </p>
      </Definition>

      <Definition title="logistic regression">
        <p>For a label <M>{"y \\in \\{0, 1\\}"}</M> and features <M>x</M>, the model is</p>
        <MD>{"P(y = 1 \\mid x) = \\sigma(w^\\top x),"}</MD>
        <p>
          where <M>x</M> includes a constant 1. The number <M>{"z = w^\\top x"}</M> is the <strong>log-odds</strong>, since{" "}
          <M>{"\\ln\\frac{p}{1 - p} = z"}</M>; so each unit increase in a feature multiplies the odds{" "}
          <M>{"p/(1-p)"}</M> by <M>{"e^{w_j}"}</M>. To classify, predict 1 when the probability is at least a chosen
          threshold, usually 0.5.
        </p>
      </Definition>

      <Definition title="log loss">
        <p>The model is fitted by minimising the average <strong>log loss</strong>, also called cross-entropy:</p>
        <MD>{"L(w) = -\\frac{1}{n} \\sum_{i=1}^{n} \\Big( y_i \\ln p_i + (1 - y_i) \\ln (1 - p_i) \\Big), \\qquad p_i = \\sigma(w^\\top x_i)."}</MD>
        <p>
          Each example contributes <M>{"-\\ln"}</M> of the probability the model gave to what actually happened. There is no
          formula for the minimum, so the weights are found by gradient descent; conveniently, the gradient is{" "}
          <M>{"\\tfrac1n \\sum_i (p_i - y_i)\\, x_i"}</M>, prediction minus truth times input, just as for least squares.
        </p>
      </Definition>

      <Example title="reading a fitted model">
        <p>
          Suppose <M>{"z = -2 + 0.8 \\times \\text{hours}"}</M>. At 5 hours, <M>{"z = 2"}</M> and{" "}
          <M>{"P(\\text{pass}) = \\sigma(2) \\approx 0.88"}</M>. The probability is one half where <M>{"z = 0"}</M>, at 2.5
          hours. Each extra hour multiplies the odds of passing by <M>{"e^{0.8} \\approx 2.23"}</M>.
        </p>
      </Example>

      <Remark title="why log loss">
        <p>
          A prediction of 0.8 for something that happened costs <M>{"-\\ln 0.8 \\approx 0.22"}</M>; a prediction of 0.01
          costs <M>{"-\\ln 0.01 \\approx 4.6"}</M>, and a prediction of 0 would cost infinitely much. Log loss rewards honest
          probabilities and punishes confident mistakes harshly. It is the same loss used to train language models, where the
          &ldquo;label&rdquo; is the next token and the model gives a probability to every possible one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: <p>What is <M>{"\\sigma(0)"}</M>?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "range",
      rung: "check",
      prompt: <p>Why does logistic regression pass <M>{"w^\\top x"}</M> through the sigmoid?</p>,
      answer: { kind: "choice", options: ["So that the output is a probability between 0 and 1", "To make the model linear", "To remove the need for training"], correct: [0] },
    },
    {
      key: "prob",
      rung: "apply",
      prompt: <p>With <M>{"z = -2 + 0.8 \\times \\text{hours}"}</M>, what is the probability of passing after 5 hours? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.88, tolerance: 0.006 },
    },
    {
      key: "loss",
      rung: "apply",
      prompt: <p>A model gives probability 0.8 to an event that happens. What is its log loss on this example? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.22, tolerance: 0.03 },
    },
    {
      key: "odds",
      rung: "apply",
      prompt: <p>A feature has weight 0.8. By what factor does one more unit of it multiply the odds? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 2.23, tolerance: 0.003 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
w, b = 2.0, -1.0
for x in (0.0, 0.5, 2.0):
    print(round(1 / (1 + math.exp(-(w * x + b))), 2), end=" ")`}</Code>
          <p>Logistic regression turns a score into a probability. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.27 0.5 0.95 ", "0.0 0.5 1.0 ", "0.27 0.5 0.88 ", "-1.0 0.0 3.0 "], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
z = np.array([-1000.0, 0.0, 1000.0])
p = 1 / (1 + np.exp(-np.clip(z, -500, 500)))
print(np.round(p, 3).tolist(), np.round(np.logaddexp(0, -z), 3).tolist())`}</Code>
          <p>Stable sigmoids and the log loss for label 1, −log σ(z) = log(1 + e^(−z)). What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.0, 0.5, 1.0] [1000.0, 0.693, 0.0]", "[0.0, 0.5, 1.0] [0.0, 0.693, 1000.0]", "[nan, 0.5, nan] [inf, 0.693, 0.0]", "[0.0, 0.5, 1.0] [1000.0, 0.5, 0.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>fit_logistic(X, y, lr, steps)</C>, logistic regression by gradient descent on the mean log loss, with an intercept: prepend a column of ones, start from zeros, and use the gradient Xᵀ(σ(Xw) − y)/n. Return w (intercept first).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_logistic(X, y, lr, steps):
    return np.zeros(X.shape[1] + 1)
`,
        solution: `import numpy as np

def fit_logistic(X, y, lr, steps):
    A = np.column_stack([np.ones(len(X)), X])
    w = np.zeros(A.shape[1])
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(A @ w)))
        w -= lr * A.T @ (p - y) / len(y)
    return w
`,
        tests: [
          { name: "matches sklearn", code: `import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
X = rng.normal(size=(300, 2)); y = (X @ [1.5, -1] + 0.3 + rng.normal(0, 1, 300) > 0).astype(float)
w = fit_logistic(X, y, 0.5, 3000)
m = LogisticRegression(C=1e6).fit(X, y)
assert np.allclose(w, np.r_[m.intercept_, m.coef_[0]], atol=0.05), 'Gradient descent should reach the same weights as an unregularised solver.'` },
          { name: "one step", code: `import numpy as np
w = fit_logistic(np.array([[1.0]]), np.array([1.0]), 1.0, 1)
assert np.allclose(w, [0.5, 0.5]), 'At w = 0 every probability is ½, so the step is (½, ½).'` },
          { name: "sign", code: `import numpy as np
X = np.array([[-2.0], [-1.0], [1.0], [2.0], [0.5], [-0.5]]); y = np.array([0, 0, 1, 1, 0, 1.0])
w = fit_logistic(X, y, 0.5, 200)
assert w.shape == (2,) and w[1] > 0, 'Larger x makes class 1 more likely.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>log_loss_logits(y, z)</C>, the mean cross-entropy computed from logits z without ever forming σ(z): mean of log(1 + eᶻ) − yz, using <C>np.logaddexp</C>, so z = ±1000 is fine. Then write <C>newton_logistic(X, y, steps)</C>, logistic regression with an intercept by Newton&rsquo;s method (iteratively reweighted least squares): from w = 0, repeat w ← w − (AᵀSA)⁻¹Aᵀ(p − y) with S = diag(p(1 − p)), solving rather than inverting. Return w (intercept first).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_loss_logits(y, z):
    p = 1 / (1 + np.exp(-z))
    return float(-np.mean(y * np.log(p) + (1 - y) * np.log(1 - p)))

def newton_logistic(X, y, steps):
    return np.zeros(X.shape[1] + 1)
`,
        solution: `import numpy as np

def log_loss_logits(y, z):
    return float(np.mean(np.logaddexp(0, z) - y * z))

def newton_logistic(X, y, steps):
    A = np.column_stack([np.ones(len(X)), X])
    w = np.zeros(A.shape[1])
    for _ in range(steps):
        p = 1 / (1 + np.exp(-(A @ w)))
        H = A.T @ (A * (p * (1 - p))[:, None])
        w = w - np.linalg.solve(H, A.T @ (p - y))
    return w
`,
        tests: [
          { name: "loss", code: `import numpy as np
from sklearn.metrics import log_loss
rng = np.random.default_rng(0)
z = rng.normal(size=50); y = rng.integers(0, 2, 50)
assert abs(log_loss_logits(y, z) - log_loss(y, 1 / (1 + np.exp(-z)))) < 1e-12
v = log_loss_logits(np.array([1, 0, 1]), np.array([1000.0, -1000.0, -1000.0]))
assert np.isfinite(v) and abs(v - 1000 / 3) < 1e-9, 'Confident and right costs 0; confident and wrong costs |z|.'` },
          { name: "sklearn", code: `import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(1)
X = rng.normal(size=(400, 3)); y = (X @ [1.0, -2.0, 0.5] + 0.3 + rng.logistic(size=400) > 0).astype(float)
w = newton_logistic(X, y, 25)
m = LogisticRegression(C=1e8, tol=1e-10, max_iter=10000).fit(X, y)
assert np.allclose(w, np.r_[m.intercept_, m.coef_[0]], atol=1e-4), 'Newton converges to the maximum-likelihood weights.'` },
          { name: "fast", code: `import numpy as np
rng = np.random.default_rng(2)
X = rng.normal(size=(300, 2)); y = (X[:, 0] + rng.logistic(size=300) > 0).astype(float)
w8, w30 = newton_logistic(X, y, 8), newton_logistic(X, y, 30)
assert np.allclose(w8, w30, atol=1e-10), 'Newton converges in a handful of steps.'` },
        ],
      },
    },
    {
      key: "squared",
      rung: "prove",
      prompt: (
        <p>
          Compare the penalties that log loss and squared error give a model that predicts probability 0.99 for an event
          that does not happen, and probability 0.6 for one that does. Explain why log loss is preferred for training
          classifiers that output probabilities.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes log loss −ln(0.01) ≈ 4.6 for the confident mistake and −ln(0.6) ≈ 0.51 for the hesitant correct prediction.",
          "Computes squared errors 0.98 and 0.16, noting that squared error can never exceed 1 per example.",
          "Explains that log loss punishes confident mistakes far more and without limit, which pushes the model to give honest probabilities.",
          "Mentions that log loss is the negative log-probability of what happened, so minimising it is maximising the likelihood of the data.",
        ],
      },
    },
    {
      key: "where",
      rung: "stretch",
      prompt: <p>With <M>{"z = -2 + 0.8 \\times \\text{hours}"}</M>, at how many hours is the probability of passing exactly one half?</p>,
      answer: { kind: "numeric", value: 2.5 },
    },
  ],

  teachBack:
    "Explain to a friend how logistic regression turns a straight line into a probability, what log loss is, and why it punishes confident mistakes.",

  glimpse: (
    <p>
      Next, the decision boundary: where in feature space the model switches from one class to the other. Statistical
      Machine Learning extends logistic regression to many classes with the softmax, Neural Networks from Scratch uses the
      same cross-entropy loss, and Information Theory explains why it measures surprise.
    </p>
  ),
};
