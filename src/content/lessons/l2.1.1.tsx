import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NllBarViz } from "@/components/viz/NllBarViz";
import type { LessonContent } from "@/lib/types";

const NLL = `import numpy as np

def nll_bernoulli(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.sum(y * np.log(p) + (1 - y) * np.log(1 - p)))

def nll_categorical(P, y):
    return float(-np.sum(np.log(np.clip(P[np.arange(len(y)), y], 1e-12, None))))

def nll_gaussian(mu, sigma, y):
    return float(np.sum(0.5 * np.log(2 * np.pi * sigma ** 2) + (y - mu) ** 2 / (2 * sigma ** 2)))`;

const LOGS = `import numpy as np

def naive_likelihood(p_correct):
    out = 1.0
    for p in p_correct:
        out *= p
    return out

def log_likelihood(p_correct):
    return float(np.sum(np.log(p_correct)))

def logsumexp(a):
    m = np.max(a)
    return float(m + np.log(np.sum(np.exp(a - m))))`;

export const lesson: LessonContent = {
  id: "l2.1.1",
  minutes: 50,
  links: {
    requires: ["m9.2.2", "l1.3.1"],
    revisits: ["m7.4.2", "l1.2.1"],
    foreshadows: ["l2.1.2", "l2.8.1"],
  },

  puzzle: (
    <>
      <p>
        Two classifiers reach the same 90% accuracy on a test set. One says 0.55 for every answer it gets right; the other
        says 0.99. On the 10% they get wrong, the first said 0.45 for the true class and the second said 0.001. Which model
        is better, and what single number captures the difference that accuracy cannot see?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A probabilistic model does not just name an answer; it says how much probability it puts on every possible answer.
        The likelihood scores it by the probability it gave to what actually happened, multiplied over the data. Taking
        logs turns the product into a sum, one term per example, and its negative is the familiar training loss: log loss,
        cross-entropy and squared error are all negative log-likelihoods under different models of the noise.
      </p>
      <NllBarViz />
    </>
  ),

  theory: (
    <>
      <Definition title="likelihood of a predictive model">
        <p>
          A conditional model gives a distribution <M>{"p_\\theta(y \\mid x)"}</M> for each input. For data{" "}
          <M>{"(x_1, y_1), \\dots, (x_n, y_n)"}</M> assumed independent given the inputs, the likelihood and negative
          log-likelihood are
        </p>
        <MD>{"L(\\theta) = \\prod_{i=1}^n p_\\theta(y_i \\mid x_i), \\qquad \\mathrm{NLL}(\\theta) = -\\sum_{i=1}^n \\log p_\\theta(y_i \\mid x_i)."}</MD>
        <p>
          The likelihood is a function of θ with the data fixed. It is not a probability distribution over θ: it need not
          integrate to 1 over θ, and rescaling θ changes nothing about which value is best.
        </p>
      </Definition>

      <Example title="three losses, one principle">
        <p>
          For a binary label with predicted probability p, the term is <M>{"-y\\log p - (1-y)\\log(1-p)"}</M>, the log loss.
          For K classes with predicted vector P, it is <M>{"-\\log P_{y}"}</M>, the cross-entropy. For a real target with
          prediction μ and Gaussian noise of fixed σ, it is{" "}
          <M>{"\\tfrac12\\log(2\\pi\\sigma^2) + (y-\\mu)^2/(2\\sigma^2)"}</M>, which is squared error up to a constant and a
          scale. Clipping the probabilities keeps a single confident mistake from producing an infinite loss in code.
        </p>
        <Code>{NLL}</Code>
      </Example>

      <Theorem title="the expected log loss is minimised by the truth">
        <p>
          Let Y take finitely many values with true distribution p, and let q be any model distribution with q(y) &gt; 0
          wherever p(y) &gt; 0. Then
        </p>
        <MD>{"\\mathbb E_p[-\\log q(Y)] = \\mathbb E_p[-\\log p(Y)] + \\sum_y p(y)\\log\\frac{p(y)}{q(y)} \\geq \\mathbb E_p[-\\log p(Y)],"}</MD>
        <p>with equality only when q = p. The extra term is the Kullback-Leibler divergence from p to q.</p>
      </Theorem>
      <Proof>
        <p>
          The identity is the expansion <M>{"-\\log q = -\\log p + \\log(p/q)"}</M> averaged under p. For the inequality, log
          is strictly concave, so by Jensen{" "}
          <M>{"\\sum_y p(y)\\log\\frac{q(y)}{p(y)} \\leq \\log\\sum_y p(y)\\frac{q(y)}{p(y)} \\leq \\log 1 = 0"}</M>, where
          the sums run over y with p(y) &gt; 0. Equality in Jensen needs q/p constant on that set, and the constant must be 1
          for the second step to be an equality, so q = p.
        </p>
      </Proof>
      <Remark title="why this matters for training">
        <p>
          The average NLL on a large sample estimates the expected log loss, so minimising it pushes the model towards the
          true conditional distribution, not merely towards the right argmax. That is why log loss rewards the second model
          in the puzzle on the examples it gets right and punishes it heavily for the confident mistakes, where accuracy
          sees neither.
        </p>
      </Remark>

      <Example title="work in logs">
        <p>
          A product of hundreds of probabilities underflows to 0.0 in floating point, after which every model looks equally
          bad. Sums of logs do not. When a log-likelihood involves a sum of probabilities, as in a mixture or a softmax
          denominator, compute <M>{"\\log\\sum_j e^{a_j}"}</M> by subtracting the maximum first, the log-sum-exp trick, so
          that no exponential overflows.
        </p>
        <Code>{LOGS}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "one",
      rung: "check",
      prompt: <p>A classifier gives probability 0.8 to the true class. What is this example&apos;s negative log-likelihood (natural log)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2231, tolerance: 0.0001 },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: <p>With Gaussian noise σ = 1, prediction μ = 0 and target y = 2, what is ½log(2π) + (y − μ)²/2? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.9189, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>A model assigns probability exactly 0 to a class that then occurs in the test set. What is its test negative log-likelihood?</p>,
      answer: { kind: "choice", options: ["Infinite", "Zero", "The same as a model that predicts uniformly", "It depends only on the accuracy"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def nll_bernoulli(p, y):
    p = np.clip(p, 1e-12, 1 - 1e-12)
    return float(-np.sum(y * np.log(p) + (1 - y) * np.log(1 - p)))

def nll_categorical(P, y):
    return float(-np.sum(np.log(np.clip(P[np.arange(len(y)), y], 1e-12, None))))

def nll_gaussian(mu, sigma, y):
    return float(np.sum(0.5 * np.log(2 * np.pi * sigma ** 2) + (y - mu) ** 2 / (2 * sigma ** 2)))

print(round(nll_bernoulli(np.array([0.9, 0.2, 0.7]), np.array([1, 0, 1])), 4))
P = np.array([[0.7, 0.2, 0.1], [0.1, 0.1, 0.8]])
print(round(nll_categorical(P, np.array([0, 2])), 4), round(nll_gaussian(np.zeros(2), 1.0, np.array([1.0, -1.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.6852\n0.5798 2.8379", "0.6852\n0.5798 1.0", "2.0402\n0.5798 2.8379", "0.6852\n1.2040 2.8379"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def naive_likelihood(p_correct):
    out = 1.0
    for p in p_correct:
        out *= p
    return out

def log_likelihood(p_correct):
    return float(np.sum(np.log(p_correct)))

def logsumexp(a):
    m = np.max(a)
    return float(m + np.log(np.sum(np.exp(a - m))))

pc = np.full(400, 0.1)
print(naive_likelihood(pc), round(log_likelihood(pc), 2))
print(round(logsumexp(np.array([1000.0, 1000.0])), 4), round(logsumexp(np.zeros(3)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 -921.03\n1000.6931 1.0986", "1e-400 -921.03\n1000.6931 1.0986", "0.0 -921.03\ninf 1.0986", "0.0 -400.0\n1000.6931 1.0986"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nll_bernoulli(p, y)</C> with p clipped to [1e-12, 1 − 1e-12], <C>nll_categorical(P, y)</C> where row i of
          P is the predicted distribution and y holds class indices, and <C>nll_gaussian(mu, sigma, y)</C>, each returning a
          float total over the examples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nll_bernoulli(p, y):
    return 0.0

def nll_categorical(P, y):
    return 0.0

def nll_gaussian(mu, sigma, y):
    return 0.0
`,
        solution: NLL,
        tests: [
          { name: "bern", code: `assert abs(nll_bernoulli(np.array([0.5, 0.5]), np.array([1, 0])) - 2 * np.log(2)) < 1e-12 and nll_bernoulli(np.array([0.0]), np.array([1])) < 30` },
          { name: "cat", code: `P = np.full((3, 4), 0.25)
assert abs(nll_categorical(P, np.array([0, 3, 1])) - 3 * np.log(4)) < 1e-12 and abs(nll_gaussian(np.array([2.0]), 2.0, np.array([2.0])) - 0.5 * np.log(8 * np.pi)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>naive_likelihood(p_correct)</C>, the plain product, <C>log_likelihood(p_correct)</C>, the sum of logs as
          a float, and <C>logsumexp(a)</C>, computing log Σ exp(aⱼ) stably by subtracting the maximum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def naive_likelihood(p_correct):
    return 1.0

def log_likelihood(p_correct):
    return 0.0

def logsumexp(a):
    return 0.0
`,
        solution: LOGS,
        tests: [
          { name: "logs", code: `p = np.array([0.5, 0.25, 0.8])
assert abs(naive_likelihood(p) - 0.1) < 1e-12 and abs(log_likelihood(p) - np.log(0.1)) < 1e-12` },
          { name: "lse", code: `a = np.array([1.0, 2.0, 3.0])
assert abs(logsumexp(a) - np.log(np.exp(a).sum())) < 1e-12 and abs(logsumexp(a + 800) - 800 - logsumexp(a)) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For distributions p and q on a finite set with q(y) &gt; 0 wherever p(y) &gt; 0, prove that{" "}
          <M>{"\\mathbb E_p[-\\log q(Y)] \\geq \\mathbb E_p[-\\log p(Y)]"}</M>, with equality only when q = p.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the difference of the two sides as Σ p(y) log(p(y)/q(y)) over y with p(y) > 0.",
          "Applies Jensen's inequality to the concave log to show Σ p log(q/p) ≤ log Σ q ≤ 0.",
          "Argues the equality case: q/p must be constant on the support of p and the constant must be 1, so q = p.",
        ],
      },
    },
    {
      key: "uniform",
      rung: "stretch",
      prompt: <p>A model predicts the uniform distribution over 10 classes on every example. What is its average negative log-likelihood per example? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.3026, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the likelihood of a predictive model is, why log loss, cross-entropy and squared error are all negative log-likelihoods, why its expectation is smallest at the true distribution, and why we compute it in logs.",

  glimpse: (
    <>
      <p>
        Choosing parameters to minimise the negative log-likelihood is maximum likelihood estimation. The next lesson shows
        that for a linear model with Gaussian noise it is exactly least squares, and what the noise model adds that least
        squares alone does not say.
      </p>
    </>
  ),
};
