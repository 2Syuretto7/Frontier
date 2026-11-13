import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LogitDivergeViz } from "@/components/viz/LogitDivergeViz";
import type { LessonContent } from "@/lib/types";

const GEN = `import numpy as np

def lda_to_logistic(mu0, mu1, Sigma, prior1):
    Si = np.linalg.inv(Sigma)
    w = Si @ (mu1 - mu0)
    b = -0.5 * mu1 @ Si @ mu1 + 0.5 * mu0 @ Si @ mu0 + np.log(prior1 / (1 - prior1))
    return w, b

def gauss_posterior(x, mu0, mu1, Sigma, prior1):
    Si = np.linalg.inv(Sigma)
    q = lambda mu: np.exp(-0.5 * (x - mu) @ Si @ (x - mu))
    a, c = prior1 * q(mu1), (1 - prior1) * q(mu0)
    return float(a / (a + c))`;

const SOFT = `import numpy as np

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

def softmax_grad(X, Y, W):
    return X.T @ (softmax(X @ W) - Y) / len(X)

def fit_softmax(X, Y, lr, steps, lam=0.0):
    W = np.zeros((X.shape[1], Y.shape[1]))
    for _ in range(steps):
        W -= lr * (softmax_grad(X, Y, W) + lam * W)
    return W`;

export const lesson: LessonContent = {
  id: "l2.2.3",
  minutes: 55,
  links: {
    requires: ["l2.1.1", "l1.3.1"],
    revisits: ["m7.5.4", "l2.1.3"],
    foreshadows: ["l2.2.4", "l2.2.5"],
  },

  puzzle: (
    <>
      <p>
        Logistic regression on a dataset where one feature perfectly separates the classes reports enormous coefficients
        and a warning that it failed to converge. Adding more training steps only makes the coefficients bigger. Is the
        optimiser broken, or is the model telling you something about the data?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sigmoid of a linear score is not an arbitrary choice: it is exactly the class posterior when each class is
        Gaussian with a shared covariance. Fitting it by maximum likelihood gives a convex problem, so there are no bad
        local minima, but convex does not mean a minimum exists. If a line separates the data, steepening the sigmoid always
        lowers the loss, and the best weights are infinitely large.
      </p>
      <LogitDivergeViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Gaussian classes give a logistic posterior">
        <p>
          Suppose <M>{"x \\mid y = k \\sim N(\\mu_k, \\Sigma)"}</M> for k = 0, 1 with a shared Σ, and P(y = 1) = π. Then{" "}
          <M>{"P(y = 1 \\mid x) = \\sigma(w^\\top x + b)"}</M> with
        </p>
        <MD>{"w = \\Sigma^{-1}(\\mu_1 - \\mu_0), \\qquad b = -\\tfrac12\\mu_1^\\top\\Sigma^{-1}\\mu_1 + \\tfrac12\\mu_0^\\top\\Sigma^{-1}\\mu_0 + \\log\\frac{\\pi}{1 - \\pi}."}</MD>
      </Theorem>
      <Proof>
        <p>
          By Bayes&apos; rule the log-odds are{" "}
          <M>{"\\log\\frac{\\pi\\, N(x; \\mu_1, \\Sigma)}{(1 - \\pi)\\, N(x; \\mu_0, \\Sigma)}"}</M>. The normalising constants
          cancel because Σ is shared, leaving{" "}
          <M>{"-\\tfrac12(x - \\mu_1)^\\top\\Sigma^{-1}(x - \\mu_1) + \\tfrac12(x - \\mu_0)^\\top\\Sigma^{-1}(x - \\mu_0) + \\log\\frac{\\pi}{1 - \\pi}"}</M>.
          The quadratic terms <M>{"x^\\top\\Sigma^{-1}x"}</M> cancel, and what remains is <M>{"w^\\top x + b"}</M>. A probability
          whose log-odds are z equals σ(z).
        </p>
        <Code>{GEN}</Code>
      </Proof>
      <Remark title="generative versus discriminative">
        <p>
          Linear discriminant analysis estimates μ₀, μ₁, Σ and π and plugs them in; logistic regression fits w and b
          directly. When the Gaussian assumption holds, LDA uses the data more efficiently. When it fails, for instance with
          heavy tails or binary features, the logistic posterior can still be right while the LDA estimates of it are off,
          and logistic regression is the safer default. With unequal covariances the quadratic terms survive and the
          boundary becomes a conic.
        </p>
      </Remark>

      <Theorem title="convexity, and when no minimiser exists">
        <p>
          The negative log-likelihood of logistic regression has Hessian <M>{"X^\\top D X"}</M> with{" "}
          <M>{"D = \\mathrm{diag}(p_i(1 - p_i))"}</M>, so it is convex. If some w satisfies <M>{"w^\\top x_i > 0"}</M> for
          every positive example and <M>{"w^\\top x_i < 0"}</M> for every negative one, the NLL has infimum 0 and no
          minimiser.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient is <M>{"X^\\top(p - y)"}</M>, and differentiating <M>{"p_i = \\sigma(w^\\top x_i)"}</M> gives{" "}
          <M>{"\\nabla p_i = p_i(1 - p_i)x_i"}</M>, so the Hessian is <M>{"\\sum_i p_i(1 - p_i)x_ix_i^\\top = X^\\top DX"}</M>,
          and <M>{"v^\\top X^\\top DXv = \\sum_i p_i(1 - p_i)(x_i^\\top v)^2 \\geq 0"}</M>. For the second part, each term of
          the NLL is <M>{"\\log(1 + e^{-s_i c\\, w^\\top x_i})"}</M> at the point cw, where <M>{"s_i = \\pm 1"}</M> is the label
          sign and <M>{"s_iw^\\top x_i > 0"}</M>; it tends to 0 as c → ∞. Every term is strictly positive at any finite
          weight, so the value 0 is approached but never reached.
        </p>
      </Proof>
      <Remark title="what to do about it">
        <p>
          Separation is common with many features and few examples. An L2 penalty, equivalently a Gaussian prior, makes the
          objective strictly convex and coercive, so a unique finite minimiser exists. Unregularised gradient descent does
          converge in direction, to the maximum-margin separator, a fact that returns with support vector machines.
        </p>
      </Remark>

      <Example title="softmax regression">
        <p>
          For K classes, <M>{"P(y = k \\mid x) = e^{z_k}/\\sum_j e^{z_j}"}</M> with <M>{"z = W^\\top x"}</M>. The gradient
          of the average NLL is <M>{"X^\\top(P - Y)/n"}</M>, predicted minus one-hot targets, exactly as in the binary case.
          Adding the same vector to every column of W changes no probability, since softmax is unchanged by adding a constant
          to all scores, so the parameters are not identifiable without a penalty or a reference class; subtracting the
          maximum score before exponentiating uses the same fact for numerical stability.
        </p>
        <Code>{SOFT}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "w",
      rung: "check",
      prompt: <p>In one dimension the classes are N(0, 1) and N(2, 1) with equal priors. What is the slope w of the logistic posterior?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
    {
      key: "sm",
      rung: "check",
      prompt: <p>What probability does softmax give the second entry of the scores (0, ln 3)?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "sep",
      rung: "apply",
      prompt: <p>Unregularised gradient descent on logistic loss for linearly separable data does what to the norm of the weights?</p>,
      answer: {
        kind: "choice",
        options: ["It grows without bound", "It converges to the maximum-likelihood value", "It stays at zero", "It oscillates around a fixed value"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def lda_to_logistic(mu0, mu1, Sigma, prior1):
    Si = np.linalg.inv(Sigma)
    w = Si @ (mu1 - mu0)
    b = -0.5 * mu1 @ Si @ mu1 + 0.5 * mu0 @ Si @ mu0 + np.log(prior1 / (1 - prior1))
    return w, b

def gauss_posterior(x, mu0, mu1, Sigma, prior1):
    Si = np.linalg.inv(Sigma)
    q = lambda mu: np.exp(-0.5 * (x - mu) @ Si @ (x - mu))
    a, c = prior1 * q(mu1), (1 - prior1) * q(mu0)
    return float(a / (a + c))

mu0, mu1, Sig = np.array([0.0, 0.0]), np.array([2.0, 1.0]), np.array([[1.0, 0.5], [0.5, 2.0]])
w, b = lda_to_logistic(mu0, mu1, Sig, 0.25); x = np.array([1.5, -0.5])
print(np.round(w, 3), round(float(b), 3))
print(round(1 / (1 + np.exp(-(w @ x + b))), 4), round(gauss_posterior(x, mu0, mu1, Sig, 0.25), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2. 0.] -3.099\n0.4754 0.4754", "[2. 1.] -3.099\n0.4754 0.4754", "[2. 0.] -2.0\n0.4754 0.4754", "[2. 0.] -3.099\n0.4754 0.7112"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def softmax(Z):
    Z = Z - Z.max(axis=1, keepdims=True)
    E = np.exp(Z)
    return E / E.sum(axis=1, keepdims=True)

def softmax_grad(X, Y, W):
    return X.T @ (softmax(X @ W) - Y) / len(X)

def fit_softmax(X, Y, lr, steps, lam=0.0):
    W = np.zeros((X.shape[1], Y.shape[1]))
    for _ in range(steps):
        W -= lr * (softmax_grad(X, Y, W) + lam * W)
    return W

Z = np.array([[1.0, 2.0, 3.0]]); print(np.allclose(softmax(Z), softmax(Z + 100.0)), np.round(softmax(Z), 3))
X = np.column_stack([np.ones(4), [-2.0, -1.0, 1.0, 2.0]]); Y = np.eye(2)[[0, 0, 1, 1]]
print([round(float(np.linalg.norm(fit_softmax(X, Y, 1.0, s))), 1) for s in (10, 100, 1000)])
print(round(float(np.linalg.norm(fit_softmax(X, Y, 1.0, 1000, lam=0.1))), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True [[0.09  0.245 0.665]]\n[1.9, 3.3, 4.9]\n1.306", "False [[0.09  0.245 0.665]]\n[1.9, 3.3, 4.9]\n1.306", "True [[0.09  0.245 0.665]]\n[1.9, 1.9, 1.9]\n1.306", "True [[0.09  0.245 0.665]]\n[1.9, 3.3, 4.9]\n4.9"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lda_to_logistic(mu0, mu1, Sigma, prior1)</C>, returning the w and b of the logistic posterior for Gaussian
          classes with shared covariance, and <C>gauss_posterior(x, mu0, mu1, Sigma, prior1)</C>, computing P(y = 1 | x)
          directly from Bayes&apos; rule as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lda_to_logistic(mu0, mu1, Sigma, prior1):
    return np.zeros(len(mu0)), 0.0

def gauss_posterior(x, mu0, mu1, Sigma, prior1):
    return 0.5
`,
        solution: GEN,
        tests: [
          { name: "1d", code: `w, b = lda_to_logistic(np.array([0.0]), np.array([2.0]), np.eye(1), 0.5)
assert np.allclose(w, [2.0]) and abs(b + 2.0) < 1e-12` },
          { name: "agree", code: `mu0, mu1, S = np.array([1.0, -1.0]), np.array([0.0, 2.0]), np.array([[2.0, 0.3], [0.3, 1.0]])
w, b = lda_to_logistic(mu0, mu1, S, 0.7); x = np.array([0.5, 0.2])
assert abs(1 / (1 + np.exp(-(w @ x + b))) - gauss_posterior(x, mu0, mu1, S, 0.7)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write a row-wise stable <C>softmax(Z)</C>, <C>softmax_grad(X, Y, W)</C>, the gradient of the average NLL for
          one-hot Y, and <C>fit_softmax(X, Y, lr, steps, lam=0.0)</C>, gradient descent from W = 0 on the average NLL plus
          (λ/2)‖W‖².
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax(Z):
    return np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)

def softmax_grad(X, Y, W):
    return np.zeros_like(W)

def fit_softmax(X, Y, lr, steps, lam=0.0):
    return np.zeros((X.shape[1], Y.shape[1]))
`,
        solution: SOFT,
        tests: [
          { name: "stable", code: `P = softmax(np.array([[1000.0, 1000.0 + np.log(3)], [0.0, 0.0]]))
assert np.allclose(P, [[0.25, 0.75], [0.5, 0.5]])` },
          { name: "fit", code: `X = np.column_stack([np.ones(6), [-2.0, -1.0, -0.5, 0.5, 1.0, 2.0]]); Y = np.eye(2)[[0, 1, 0, 1, 0, 1]]
W = fit_softmax(X, Y, 0.5, 3000, lam=0.01)
assert np.allclose(softmax_grad(X, Y, W) + 0.01 * W, 0, atol=1e-6) and np.allclose(softmax_grad(X, Y, np.zeros((2, 2))), [[0, 0], [0.25, -0.25]])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Suppose some w has wᵀxᵢ &gt; 0 for every positive example and wᵀxᵢ &lt; 0 for every negative one. Prove that the logistic negative log-likelihood has no minimiser.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes each term of the NLL as log(1 + exp(−sᵢ vᵀxᵢ)) with sᵢ = ±1, which is strictly positive for every finite v.",
          "Shows that at v = cw each term tends to 0 as c → ∞ because sᵢwᵀxᵢ > 0, so the infimum is 0.",
          "Concludes that since every finite v gives a strictly positive value, the infimum 0 is not attained and no minimiser exists.",
        ],
      },
    },
    {
      key: "post",
      rung: "stretch",
      prompt: <p>Classes N(0, 1) and N(2, 1) with P(y = 1) = 0.25. What is P(y = 1 | x = 2)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.7112, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why Gaussian classes with shared covariance give a logistic posterior, why logistic regression is convex, why separable data has no maximum-likelihood fit, and what the softmax gradient looks like.",

  glimpse: (
    <>
      <p>
        Linear regression and logistic regression share a skeleton: a linear score, a link function, and a likelihood from
        an exponential family. The next lesson names the skeleton, generalised linear models, and adds Poisson regression
        for counts.
      </p>
    </>
  ),
};
