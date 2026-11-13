import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FisherCurvViz } from "@/components/viz/FisherCurvViz";
import type { LessonContent } from "@/lib/types";

const SCORE = `def score_bern(p, x):
    return x / p - (1 - x) / (1 - p)

def fisher_bern(p):
    return sum(q * score_bern(p, x) ** 2 for x, q in ((1, p), (0, 1 - p)))`;

const MC = `import numpy as np

def fisher_mc(lam, reps=200000, seed=0):
    x = np.random.default_rng(seed).poisson(lam, size=reps)
    score = x / lam - 1
    neg_hess = x / lam ** 2
    return float(score.mean()), float(score.var()), float(neg_hess.mean())

def mle_sd(lam, n, reps=20000, seed=1):
    X = np.random.default_rng(seed).poisson(lam, size=(reps, n))
    return float(X.mean(axis=1).std()), float(np.sqrt(lam / n))`;

export const lesson: LessonContent = {
  id: "m9.3.3",
  minutes: 55,
  links: {
    requires: ["m9.3.2", "m5.5.2"],
    revisits: ["m7.2.4", "m9.2.2"],
    foreshadows: ["m9.3.4", "m9.3.5"],
  },

  puzzle: (
    <>
      <p>
        Estimating a coin&apos;s bias to within ±0.01 takes about 10 000 flips when p is near 1/2 but only about 400 when p
        is near 0.01. Why is a rare-event coin so much easier to pin down, and is there a single number, computable from the
        model, that says how much each observation teaches about the parameter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If changing θ slightly changes the distribution of the data a lot, then the data reveal θ precisely. That
        sensitivity shows up as the curvature of the expected log-likelihood at the truth: a sharp peak means nearby
        parameter values fit noticeably worse.
      </p>
      <FisherCurvViz />
    </>
  ),

  theory: (
    <>
      <Definition title="score and Fisher information">
        <p>For a model f(x; θ) with one parameter, the score and the Fisher information are</p>
        <MD>{"s(\\theta; x) = \\frac{\\partial}{\\partial\\theta}\\log f(x; \\theta), \\qquad I(\\theta) = \\mathbb{E}_\\theta\\big[s(\\theta; X)^2\\big]."}</MD>
        <p>
          For a vector θ, I(θ) is the matrix <M>{"\\mathbb{E}[s s^\\top]"}</M> with s the gradient of the log-density.
        </p>
      </Definition>

      <Theorem title="two faces of the information">
        <p>Under regularity conditions allowing differentiation under the integral,</p>
        <MD>{"\\mathbb{E}_\\theta[s(\\theta; X)] = 0, \\qquad I(\\theta) = \\mathrm{Var}_\\theta(s) = -\\mathbb{E}_\\theta\\Big[\\frac{\\partial^2}{\\partial\\theta^2}\\log f(X; \\theta)\\Big]."}</MD>
        <p>For n iid observations the information adds: <M>{"I_n(\\theta) = nI(\\theta)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Differentiate <M>{"\\int f(x; \\theta)\\,dx = 1"}</M>: <M>{"0 = \\int \\partial_\\theta f\\,dx = \\int s f\\,dx = \\mathbb{E}[s]"}</M>.
          So the variance of s is its second moment, I. Differentiate <M>{"\\int s f\\,dx = 0"}</M> again:{" "}
          <M>{"0 = \\int (\\partial_\\theta s) f\\,dx + \\int s\\,\\partial_\\theta f\\,dx = \\mathbb{E}[\\partial_\\theta s] + \\mathbb{E}[s^2]"}</M>,
          and <M>{"\\partial_\\theta s"}</M> is the second derivative of log f. For a sample, the log-likelihood is a sum of n
          independent terms, so the scores add and their variances add.
        </p>
      </Proof>

      <Example title="Bernoulli, Poisson, normal">
        <p>
          Bernoulli: s = x/p − (1 − x)/(1 − p), and averaging s² over x gives <M>{"I(p) = 1/(p(1 - p))"}</M>, which grows
          without bound near 0 and 1. Poisson: s = x/λ − 1, so I = Var(X)/λ² = 1/λ. Normal mean with known σ: I = 1/σ². In
          every case 1/(nI) equals the variance of the MLE: p(1 − p)/n, λ/n, σ²/n.
        </p>
        <Code>{SCORE}</Code>
      </Example>

      <Example title="checking by simulation">
        <p>
          For Poisson data with λ = 4, the simulated score has mean near 0, and both its variance and the mean negative
          second derivative x/λ² are near 1/λ = 0.25. The standard deviation of X̄ from samples of 25 matches{" "}
          <M>{"1/\\sqrt{nI} = \\sqrt{\\lambda/n} = 0.4"}</M>.
        </p>
        <Code>{MC}</Code>
      </Example>

      <Theorem title="reparametrisation and exponential families">
        <p>
          If θ = g(η) with g differentiable, then <M>{"I_\\eta(\\eta) = I_\\theta(g(\\eta))\\,g'(\\eta)^2"}</M>. For an exponential
          family in its natural parameter, <M>{"I(\\eta) = A''(\\eta) = \\mathrm{Var}(T)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule the score in η is the score in θ times g′(η); square and take expectations. In the natural
          parametrisation, <M>{"\\log f = \\eta T - A(\\eta) + \\log h"}</M> has second derivative −A″(η), which is not
          random, so I = A″.
        </p>
      </Proof>

      <Remark title="Fisher information in machine learning">
        <p>
          For a model trained with negative log-likelihood, the Fisher matrix is the expected Hessian of the loss under the
          model&apos;s own predictions. Natural gradient descent preconditions the gradient by its inverse, which makes the
          update invariant to how the parameters are written; K-FAC approximates it layer by layer. Elastic weight
          consolidation uses its diagonal to decide which weights matter for an old task. The &quot;empirical Fisher&quot;,
          built from squared gradients on the training labels, is a different and often poorer approximation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bern",
      rung: "check",
      prompt: <p>What is the Fisher information in one Bernoulli observation when p = 0.1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 11.1111, tolerance: 0.0002 },
    },
    {
      key: "pois",
      rung: "check",
      prompt: <p>What is the Fisher information about λ in 20 iid Poisson observations when λ = 5?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "apply",
      prompt: <p>Under the usual regularity conditions, what is the expected value of the score at the true parameter?</p>,
      answer: { kind: "choice", options: ["0", "The Fisher information", "1", "The parameter θ"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def score_bern(p, x):
    return x / p - (1 - x) / (1 - p)

def fisher_bern(p):
    return sum(q * score_bern(p, x) ** 2 for x, q in ((1, p), (0, 1 - p)))

print(score_bern(0.25, 1), score_bern(0.25, 0))
print(round(fisher_bern(0.25), 4), round(1 / (0.25 * 0.75), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.0 -1.3333333333333333\n5.3333 5.3333", "4.0 1.3333333333333333\n5.3333 5.3333", "4.0 -1.3333333333333333\n2.6667 5.3333", "0.25 -0.75\n5.3333 5.3333"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fisher_mc(lam, reps=200000, seed=0):
    x = np.random.default_rng(seed).poisson(lam, size=reps)
    score = x / lam - 1
    neg_hess = x / lam ** 2
    return float(score.mean()), float(score.var()), float(neg_hess.mean())

def mle_sd(lam, n, reps=20000, seed=1):
    X = np.random.default_rng(seed).poisson(lam, size=(reps, n))
    return float(X.mean(axis=1).std()), float(np.sqrt(lam / n))

print([round(v, 3) for v in fisher_mc(4.0)])
print([round(v, 3) for v in mle_sd(4.0, 25)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.001, 0.25, 0.25]\n[0.398, 0.4]", "[0.001, 4.0, 0.25]\n[0.398, 0.4]", "[1.0, 0.25, 0.25]\n[0.398, 0.4]", "[0.001, 0.25, 0.25]\n[0.08, 0.4]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>score_bern(p, x)</C>, the score of one Bernoulli observation x ∈ {"{0, 1}"}, and <C>fisher_bern(p)</C>,
          which computes E[s²] by summing over the two outcomes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def score_bern(p, x):
    return 0.0

def fisher_bern(p):
    return 0.0
`,
        solution: SCORE,
        tests: [
          { name: "score", code: `assert abs(score_bern(0.5, 1) - 2) < 1e-12 and abs(score_bern(0.5, 0) + 2) < 1e-12
assert abs(0.3 * score_bern(0.3, 1) + 0.7 * score_bern(0.3, 0)) < 1e-12` },
          { name: "fisher", code: `for p in (0.1, 0.5, 0.8):
    assert abs(fisher_bern(p) - 1 / (p * (1 - p))) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fisher_mc(lam, reps=200000, seed=0)</C>, returning the simulated mean and variance of the Poisson score
          x/λ − 1 and the mean of x/λ², and <C>mle_sd(lam, n, reps=20000, seed=1)</C>, returning the simulated standard
          deviation of X̄ for samples of size n and the theoretical value √(λ/n).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fisher_mc(lam, reps=200000, seed=0):
    return 0.0, 0.0, 0.0

def mle_sd(lam, n, reps=20000, seed=1):
    return 0.0, 0.0
`,
        solution: MC,
        tests: [
          { name: "mc", code: `m, v, h = fisher_mc(2.0, reps=100000)
assert abs(m) < 0.02 and abs(v - 0.5) < 0.02 and abs(h - 0.5) < 0.02` },
          { name: "sd", code: `s, t = mle_sd(9.0, 9, reps=10000)
assert t == 1.0 and abs(s - 1) < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Assuming differentiation under the integral sign is allowed, prove that the score has mean 0 and that its variance equals −E[∂²/∂θ² log f(X; θ)].</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates ∫ f(x; θ) dx = 1 and uses ∂f/∂θ = s·f to get E[s] = 0.",
          "Differentiates ∫ s f dx = 0 again, using the product rule and ∂f/∂θ = s·f, to get E[∂s/∂θ] + E[s²] = 0.",
          "Concludes Var(s) = E[s²] (since E[s] = 0) = −E[∂² log f/∂θ²].",
        ],
      },
    },
    {
      key: "logit",
      rung: "stretch",
      prompt: <p>For one Bernoulli observation parametrised by the logit η = log(p/(1 − p)), what is the Fisher information I(η) when p = 0.2?</p>,
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the score and the Fisher information are, why the score has mean zero, why the information equals the expected curvature of the log-likelihood, and what it says about how precisely a parameter can be estimated.",

  glimpse: (
    <>
      <p>
        In every example, 1/(nI) matched the variance of the maximum likelihood estimator. The next lesson proves that no
        unbiased estimator can ever do better: 1/(nI) is a floor, the Cramér-Rao bound.
      </p>
    </>
  ),
};
