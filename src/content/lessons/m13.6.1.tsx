import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScoreBaselineViz } from "@/components/viz/ScoreBaselineViz";
import type { LessonContent } from "@/lib/types";

const SF = `import numpy as np

def sigmoid(t):
    return 1 / (1 + np.exp(-t))

def score_estimates(f, theta, n, rng, baseline=0.0):
    p = sigmoid(theta)
    x = (rng.random(n) < p).astype(float)
    return (f(x) - baseline) * (x - p)

def exact_grad(f, theta):
    p = sigmoid(theta)
    return float(p * (1 - p) * (f(1.0) - f(0.0)))`;

const RL = `import numpy as np

def categorical_score(x, logits):
    p = np.exp(logits - logits.max()); p /= p.sum()
    g = -p; g[x] += 1
    return g

def rloo_grad(rng, f, logits, k):
    p = np.exp(logits - logits.max()); p /= p.sum()
    xs = rng.choice(len(p), size=k, p=p); fx = f[xs]
    b = (fx.sum() - fx) / (k - 1)
    return np.mean([(fx[i] - b[i]) * categorical_score(xs[i], logits) for i in range(k)], axis=0)`;

export const lesson: LessonContent = {
  id: "m13.6.1",
  minutes: 55,
  links: {
    requires: ["m13.2.4", "m13.1.2"],
    revisits: ["m13.2.3"],
    foreshadows: ["m13.6.2", "m13.6.3"],
  },

  puzzle: (
    <>
      <p>
        A language model writes a paragraph, a judge gives it a score, and you want to change the model&apos;s parameters to
        raise the average score. The score is not differentiable; the paragraph is a sequence of discrete choices; nothing can
        be backpropagated. Yet an unbiased gradient is available from samples alone, using nothing but the log-probabilities
        the model already computes. Where does it come from, and why is it so noisy that almost every practical use subtracts
        something from the reward first?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of moving the samples, move the probabilities. If a sample scored well, make it more likely; if badly, less
        likely. The direction that increases the log-probability of x is the score <M>{"\\nabla_\\theta\\log p_\\theta(x)"}</M>,
        and weighting it by f(x) and averaging gives exactly the gradient of the expected score. The catch is that only
        relative quality matters: adding a constant to every reward leaves the true gradient unchanged but makes each
        estimate swing wildly. A baseline subtracts that constant back out.
      </p>
      <ScoreBaselineViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the log-derivative trick">
        <p>
          If the support of <M>{"p_\\theta"}</M> does not depend on θ and differentiation under the integral is allowed, then
        </p>
        <MD>{"\\nabla_\\theta\\,\\mathbb E_{p_\\theta}[f(X)] = \\mathbb E_{p_\\theta}\\bigl[f(X)\\,\\nabla_\\theta\\log p_\\theta(X)\\bigr],"}</MD>
        <p>
          and in particular the score has mean zero, <M>{"\\mathbb E[\\nabla_\\theta\\log p_\\theta(X)] = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\nabla\\int f p_\\theta = \\int f\\,\\nabla p_\\theta = \\int f\\,p_\\theta\\nabla\\log p_\\theta"}</M>, since{" "}
          <M>{"\\nabla\\log p = \\nabla p/p"}</M>. Taking f = 1, the left side is the gradient of 1, which is 0. Nothing about f
          was used except integrability: it can be discontinuous, a black box, or defined only on a discrete set. For{" "}
          <M>{"X \\sim \\mathrm{Bernoulli}(\\sigma(\\theta))"}</M> the score is x − p, giving the estimate{" "}
          <M>{"f(x)(x - p)"}</M>, whose mean is the exact derivative <M>{"p(1 - p)(f(1) - f(0))"}</M>.
        </p>
        <Code>{SF}</Code>
      </Proof>

      <Theorem title="baselines">
        <p>
          For any constant b, <M>{"(f(X) - b)\\nabla\\log p_\\theta(X)"}</M> is still unbiased. For a scalar parameter with score
          s, its variance is minimised by <M>{"b^* = \\mathbb E[f s^2]/\\mathbb E[s^2]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unbiasedness is the mean-zero property of the score. The variance is{" "}
          <M>{"\\mathbb E[(f - b)^2s^2] - g^2"}</M> with g the true gradient, a quadratic in b whose derivative{" "}
          <M>{"-2\\mathbb E[(f - b)s^2]"}</M> vanishes at <M>{"b^*"}</M>. For the Bernoulli case,{" "}
          <M>{"s^2 = (1 - p)^2"}</M> when x = 1 and <M>{"p^2"}</M> when x = 0, so{" "}
          <M>{"b^* = (1 - p)f(1) + pf(0)"}</M>; then both outcomes give the estimate{" "}
          <M>{"p(1 - p)(f(1) - f(0))"}</M>, and the variance is exactly zero. The best baseline is not the mean reward{" "}
          <M>{"pf(1) + (1 - p)f(0)"}</M>, though the mean is the usual practical choice and is close when p is near ½. A baseline
          is a control variate in the sense of the earlier lesson, built from the zero-mean score.
        </p>
      </Proof>

      <Example title="categorical choices and leave-one-out">
        <p>
          For <M>{"p = \\mathrm{softmax}(\\ell)"}</M> the score with respect to the logits at outcome x is{" "}
          <M>{"e_x - p"}</M>, and the exact gradient of <M>{"\\mathbb E f"}</M> is <M>{"p \\odot (f - \\mathbb E f)"}</M>. With k
          samples per step, the leave-one-out baseline for sample i is the mean of the other k − 1 rewards. It depends only on
          samples independent of <M>{"x_i"}</M>, so it can be pulled out of the expectation and the estimate stays unbiased,
          while it tracks <M>{"\\mathbb E f"}</M> without any extra model. For logits (0, 0, log 2) and rewards (1, 2, 4), four
          samples per step cut the variance of the third coordinate from about 0.50 to about 0.08.
        </p>
        <Code>{RL}</Code>
      </Example>

      <Remark title="sequences and reinforcement learning">
        <p>
          For a trajectory of actions <M>{"a_t \\sim \\pi_\\theta(\\cdot \\mid s_t)"}</M> in an environment with unknown
          transitions, the log-probability of the whole trajectory is{" "}
          <M>{"\\sum_t \\log\\pi_\\theta(a_t \\mid s_t)"}</M> plus transition terms that do not depend on θ, so the score needs no
          model of the environment. This is REINFORCE. Since an action cannot affect rewards received before it, each score term
          can be weighted by the reward to go rather than the total, another variance reduction. Fine-tuning language models
          from feedback uses exactly this estimator, with leave-one-out or group-mean baselines over several completions of the
          same prompt. The variance, however, grows with the length of the sequence, the price of never looking inside f.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "opt",
      rung: "check",
      prompt: <p>For X ~ Bernoulli(0.2) with f(0) = 10 and f(1) = 11, what is the optimal baseline?</p>,
      answer: { kind: "numeric", value: 10.8, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>For the same X and f, what is the variance of the one-sample score-function estimate with no baseline?</p>,
      answer: { kind: "numeric", value: 18.662, tolerance: 0.005 },
    },
    {
      key: "loo",
      rung: "apply",
      prompt: <p>Why does the leave-one-out baseline keep the score-function estimate unbiased?</p>,
      answer: {
        kind: "choice",
        options: [
          "The baseline for sample i is built only from the other samples, which are independent of it, so it multiplies a score with conditional mean zero",
          "The baseline equals the expected reward exactly",
          "Leave-one-out estimates are always unbiased",
          "The rewards are bounded, so subtracting any number is harmless",
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

def sigmoid(t):
    return 1 / (1 + np.exp(-t))

def score_estimates(f, theta, n, rng, baseline=0.0):
    p = sigmoid(theta)
    x = (rng.random(n) < p).astype(float)
    return (f(x) - baseline) * (x - p)

def exact_grad(f, theta):
    p = sigmoid(theta)
    return float(p * (1 - p) * (f(1.0) - f(0.0)))

f = lambda x: 10 + x; e = score_estimates(f, 0.0, 100000, np.random.default_rng(0)); print(exact_grad(f, 0.0), abs(e.mean() - 0.25) < 0.05, abs(e.var() - 27.5625) < 0.5)
print(float(np.ptp(score_estimates(f, 0.0, 1000, np.random.default_rng(1), baseline=10.5))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.25 True True\n0.0", "0.25 True True\n0.5", "0.5 False True\n0.0", "0.25 True False\n0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def categorical_score(x, logits):
    p = np.exp(logits - logits.max()); p /= p.sum()
    g = -p; g[x] += 1
    return g

def rloo_grad(rng, f, logits, k):
    p = np.exp(logits - logits.max()); p /= p.sum()
    xs = rng.choice(len(p), size=k, p=p); fx = f[xs]
    b = (fx.sum() - fx) / (k - 1)
    return np.mean([(fx[i] - b[i]) * categorical_score(xs[i], logits) for i in range(k)], axis=0)

logits = np.array([0.0, 0.0, np.log(2)]); fv = np.array([1.0, 2.0, 4.0]); print(categorical_score(2, logits).round(3).tolist())
g = np.mean([rloo_grad(np.random.default_rng(s), fv, logits, 4) for s in range(4000)], axis=0); print(np.allclose(g, [-0.4375, -0.1875, 0.625], atol=0.03))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.25, -0.25, 0.5]\nTrue",
          "[0.25, 0.25, 0.5]\nTrue",
          "[-0.25, -0.25, 0.5]\nFalse",
          "[0.0, 0.0, 1.0]\nTrue",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sigmoid(t)</C>; <C>score_estimates(f, theta, n, rng, baseline)</C>, returning n one-sample score-function
          estimates of the derivative of <M>{"\\mathbb E f(X)"}</M> for <M>{"X \\sim \\mathrm{Bernoulli}(\\sigma(\\theta))"}</M>; and{" "}
          <C>exact_grad(f, theta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sigmoid(t):
    return 0.5

def score_estimates(f, theta, n, rng, baseline=0.0):
    return np.zeros(n)

def exact_grad(f, theta):
    return 0.0
`,
        solution: SF,
        tests: [
          { name: "unbiased", code: `f = lambda x: x ** 2 + 3 * x; e = score_estimates(f, -1.0, 200000, np.random.default_rng(2))
assert abs(exact_grad(f, -1.0) - 0.786448) < 1e-5 and abs(e.mean() - exact_grad(f, -1.0)) < 0.02 and abs(sigmoid(0.0) - 0.5) < 1e-12 and abs(sigmoid(2.0) - 0.880797) < 1e-5` },
          { name: "baseline", code: `f = lambda x: x ** 2 + 3 * x; p = sigmoid(0.7); b = (1 - p) * f(1.0) + p * f(0.0); e = score_estimates(f, 0.7, 500, np.random.default_rng(3), b)
assert np.ptp(e) < 1e-9 and abs(e[0] - exact_grad(f, 0.7)) < 1e-9 and np.ptp(score_estimates(f, 0.7, 500, np.random.default_rng(3))) > 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>categorical_score(x, logits)</C>, the gradient of <M>{"\\log\\mathrm{softmax}(\\ell)_x"}</M> with respect to the
          logits, and <C>rloo_grad(rng, f, logits, k)</C>, drawing k samples and returning the leave-one-out score-function
          estimate of the gradient of <M>{"\\mathbb E f(X)"}</M>, where f is an array of rewards indexed by outcome.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def categorical_score(x, logits):
    return np.zeros(len(logits))

def rloo_grad(rng, f, logits, k):
    return np.zeros(len(logits))
`,
        solution: RL,
        tests: [
          { name: "score", code: `l = np.array([1.0, -0.5, 0.2, 0.0]); p = np.exp(l) / np.exp(l).sum(); g = categorical_score(0, l)
assert np.allclose(g, np.eye(4)[0] - p) and abs(categorical_score(1, l).sum()) < 1e-12` },
          { name: "rloo", code: `l = np.array([1.0, -0.5, 0.2, 0.0]); fv = np.array([3.0, -1.0, 0.5, 2.0]); p = np.exp(l) / np.exp(l).sum(); ex = p * (fv - p @ fv)
G = np.mean([rloo_grad(np.random.default_rng(s), fv, l, 5) for s in range(3000)], axis=0); assert np.abs(G - ex).max() < 0.04 and np.allclose(rloo_grad(np.random.default_rng(0), np.full(4, 7.0), l, 5), 0)` },
        ],
      },
    },
    {
      key: "cat",
      rung: "stretch",
      prompt: (
        <p>
          With logits (0, 0, log 2) and rewards (1, 2, 4), what is the third coordinate of the exact gradient of the expected
          reward with respect to the logits?
        </p>
      ),
      answer: { kind: "numeric", value: 0.625, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        When f is differentiable and the sample can be written as a smooth function of noise, there is a second route that
        moves the samples instead of the probabilities. The next lesson develops that pathwise estimator in general.
      </p>
    </>
  ),
};
