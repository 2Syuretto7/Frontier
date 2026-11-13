import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LogLikViz } from "@/components/viz/LogLikViz";
import type { LessonContent } from "@/lib/types";

const MLE = `import math

def bern_loglik(p, xs):
    h = sum(xs)
    return h * math.log(p) + (len(xs) - h) * math.log(1 - p)

def normal_mle(xs):
    n = len(xs)
    mu = sum(xs) / n
    return mu, sum((x - mu) ** 2 for x in xs) / n`;

const FIT = `import numpy as np

def poisson_nll(lam, xs):
    xs = np.asarray(xs, dtype=float)
    return float(np.mean(lam - xs * np.log(lam)))

def fit_poisson(xs, steps=200, lr=0.2):
    xs = np.asarray(xs, dtype=float)
    a = 0.0
    for _ in range(steps):
        a -= lr * (np.exp(a) - xs.mean())
    return float(np.exp(a))`;

export const lesson: LessonContent = {
  id: "m9.2.2",
  minutes: 55,
  links: {
    requires: ["m9.2.1", "m5.5.3"],
    revisits: ["m5.4.4", "m7.2.2"],
    foreshadows: ["m9.3.5", "m9.4.3"],
  },

  puzzle: (
    <>
      <p>
        A coin lands heads 7 times in 10 flips. Every bias p strictly between 0 and 1 could have produced that, so no value
        is ruled out. Yet 0.7 feels like the right guess and 0.1 feels absurd. What exactly makes 0.7 better, and does the
        same reasoning give an answer for any model at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Turn the probability of the data around and read it as a function of the parameter. Under p = 0.1, seeing 7 heads
        has probability about 0.0000087; under p = 0.7 it is about 0.27. Pick the parameter that makes the observed data
        most probable.
      </p>
      <LogLikViz />
    </>
  ),

  theory: (
    <>
      <Definition title="likelihood and maximum likelihood">
        <p>
          For iid observations with density or mass function <M>{"f(x; \\theta)"}</M>, the likelihood and log-likelihood are
        </p>
        <MD>{"L(\\theta) = \\prod_{i=1}^n f(X_i; \\theta), \\qquad \\ell(\\theta) = \\sum_{i=1}^n \\log f(X_i; \\theta)."}</MD>
        <p>
          A maximum likelihood estimator <M>{"\\hat\\theta"}</M> maximises L, equivalently ℓ. The likelihood is not a density
          in θ; it need not integrate to 1.
        </p>
      </Definition>

      <Example title="Bernoulli and normal">
        <p>
          With h heads in n flips, <M>{"\\ell(p) = h \\log p + (n - h)\\log(1 - p)"}</M>. Setting{" "}
          <M>{"\\ell'(p) = h/p - (n - h)/(1 - p) = 0"}</M> gives <M>{"\\hat p = h/n"}</M>. For a normal sample, maximising over μ
          and σ² gives <M>{"\\hat\\mu = \\bar X"}</M> and <M>{"\\hat\\sigma^2 = \\frac1n\\sum (X_i - \\bar X)^2"}</M>, the divisor
          n version, which is biased.
        </p>
        <Code>{MLE}</Code>
      </Example>

      <Example title="the uniform, revisited">
        <p>
          For Uniform(0, θ), <M>{"L(\\theta) = \\theta^{-n}"}</M> when θ is at least every observation, and 0 otherwise. This
          is decreasing in θ on its support, so <M>{"\\hat\\theta = \\max_i X_i"}</M>. Calculus would not find it: the maximum
          sits at a boundary where L jumps, not where a derivative vanishes. Unlike 2X̄, it can never fall below an
          observation.
        </p>
      </Example>

      <Theorem title="invariance">
        <p>
          If <M>{"\\hat\\theta"}</M> maximises the likelihood and g is a bijection, then <M>{"g(\\hat\\theta)"}</M> maximises
          the likelihood in the parameter η = g(θ).
        </p>
      </Theorem>
      <Proof>
        <p>
          In terms of η the likelihood is <M>{"L^*(\\eta) = L(g^{-1}(\\eta))"}</M>. For every η,{" "}
          <M>{"L^*(\\eta) = L(g^{-1}(\\eta)) \\leq L(\\hat\\theta) = L^*(g(\\hat\\theta))"}</M>, so <M>{"g(\\hat\\theta)"}</M>{" "}
          attains the maximum. (For g not injective one defines the induced likelihood as a maximum over each fibre, and the
          same conclusion holds.)
        </p>
      </Proof>

      <Theorem title="maximum likelihood minimises cross-entropy">
        <p>
          Let <M>{"\\hat P_n"}</M> be the empirical distribution of the sample. Then
        </p>
        <MD>{"-\\tfrac1n \\ell(\\theta) = \\mathbb{E}_{X \\sim \\hat P_n}[-\\log f(X; \\theta)] = H(\\hat P_n) + \\mathrm{KL}(\\hat P_n \\,\\|\\, f_\\theta)"}</MD>
        <p>
          for discrete models, so maximising the likelihood is minimising the cross-entropy from the data to the model, and
          also the KL divergence, since the entropy term does not depend on θ.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first equality holds because the empirical distribution puts mass 1/n on each observation. For the second,
          write <M>{"-\\log f = -\\log \\hat p + \\log(\\hat p / f)"}</M> and average under <M>{"\\hat P_n"}</M>: the first
          term gives the entropy and the second the KL divergence.
        </p>
      </Proof>

      <Remark title="training is maximum likelihood">
        <p>
          The cross-entropy loss of a classifier is the negative log-likelihood of a categorical model, and squared error is
          the negative log-likelihood of a normal model with fixed variance, up to constants. When no closed form exists,
          the likelihood is maximised numerically, as below, by gradient descent on the negative log-likelihood. Working
          with log λ instead of λ keeps the rate positive without constraints, which invariance allows.
        </p>
        <Code>{FIT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coin",
      rung: "check",
      prompt: <p>A coin shows 13 heads in 20 flips. What is the maximum likelihood estimate of the probability of heads?</p>,
      answer: { kind: "numeric", value: 0.65, tolerance: 0.0001 },
    },
    {
      key: "exp",
      rung: "check",
      prompt: <p>An exponential sample with rate λ has mean 4. What is the maximum likelihood estimate of λ?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "unif",
      rung: "apply",
      prompt: <p>A sample from Uniform(0, θ) is 0.2, 0.9, 0.1. What is the maximum likelihood estimate of θ?</p>,
      answer: { kind: "choice", options: ["0.9", "0.8", "0.4", "1.0"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def bern_loglik(p, xs):
    h = sum(xs)
    return h * math.log(p) + (len(xs) - h) * math.log(1 - p)

def normal_mle(xs):
    n = len(xs)
    mu = sum(xs) / n
    return mu, sum((x - mu) ** 2 for x in xs) / n

xs = [1, 0, 1, 1]
print(round(bern_loglik(0.75, xs), 4), round(bern_loglik(0.5, xs), 4))
print(normal_mle([1, 2, 3, 6]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-2.2493 -2.7726\n(3.0, 3.5)", "-2.7726 -2.2493\n(3.0, 3.5)", "-2.2493 -2.7726\n(3.0, 4.666666666666667)", "-2.2493 -2.7726\n(3.0, 1.8708286933869707)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def poisson_nll(lam, xs):
    xs = np.asarray(xs, dtype=float)
    return float(np.mean(lam - xs * np.log(lam)))

def fit_poisson(xs, steps=200, lr=0.2):
    xs = np.asarray(xs, dtype=float)
    a = 0.0
    for _ in range(steps):
        a -= lr * (np.exp(a) - xs.mean())
    return float(np.exp(a))

xs = [2, 3, 1, 4, 5]
print(round(fit_poisson(xs), 4), round(fit_poisson(xs, steps=3), 4))
print(round(poisson_nll(3.0, xs), 4), round(poisson_nll(2.0, xs), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 2.4552\n-0.2958 -0.0794", "3.0 3.0\n-0.2958 -0.0794", "3.0 2.4552\n-0.0794 -0.2958", "2.4552 3.0\n-0.2958 -0.0794"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bern_loglik(p, xs)</C>, the Bernoulli log-likelihood of a list of 0s and 1s, and <C>normal_mle(xs)</C>,
          returning the maximum likelihood estimates (μ̂, σ̂²).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bern_loglik(p, xs):
    return 0.0

def normal_mle(xs):
    return 0.0, 1.0
`,
        solution: MLE,
        tests: [
          { name: "bern", code: `import math
assert abs(bern_loglik(0.5, [1, 0]) - 2 * math.log(0.5)) < 1e-12
assert abs(bern_loglik(0.25, [1, 0, 0]) - (math.log(0.25) + 2 * math.log(0.75))) < 1e-12` },
          { name: "normal", code: `m, v = normal_mle([0, 2, 4])
assert m == 2 and abs(v - 8 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>poisson_nll(lam, xs)</C>, the average Poisson negative log-likelihood without the log x! term (mean of
          λ − x log λ), and <C>fit_poisson(xs, steps=200, lr=0.2)</C>, which starts at a = 0 and runs gradient descent on that
          loss as a function of a = log λ, returning exp(a).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poisson_nll(lam, xs):
    return 0.0

def fit_poisson(xs, steps=200, lr=0.2):
    return 1.0
`,
        solution: FIT,
        tests: [
          { name: "nll", code: `import math
assert abs(poisson_nll(2.0, [1, 3]) - (2 - 2 * math.log(2))) < 1e-12` },
          { name: "fit", code: `assert abs(fit_poisson([0, 1, 2, 5]) - 2.0) < 1e-6
import math
assert abs(fit_poisson([4, 4], steps=1) - math.exp(0.6)) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>With h heads in n Bernoulli(p) flips, prove that p̂ = h/n maximises the likelihood over [0, 1], including the cases h = 0 and h = n.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the log-likelihood h log p + (n − h) log(1 − p) and finds its derivative vanishes only at p = h/n when 0 < h < n.",
          "Shows this is a maximum, for example by the negative second derivative −h/p² − (n − h)/(1 − p)² or by the sign change of the derivative, noting the likelihood is 0 at p = 0 and p = 1.",
          "Handles h = 0, where L = (1 − p)^n is decreasing and maximised at 0, and h = n, where L = p^n is maximised at 1.",
        ],
      },
    },
    {
      key: "inv",
      rung: "stretch",
      prompt: <p>A Poisson sample has mean 3. Using invariance, what is the maximum likelihood estimate of P(X = 0) = e^(−λ)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0498, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the likelihood is, how to find the maximum likelihood estimate for a coin, a normal sample and a uniform sample, why the estimate is invariant under reparametrisation, and why minimising cross-entropy loss is maximum likelihood.",

  glimpse: (
    <>
      <p>
        Maximum likelihood uses only the data. The Bayesian estimators of the next lesson also bring in a prior belief about
        the parameter, which matters most exactly when the data are few, such as a coin that showed heads on every one of
        its three flips.
      </p>
    </>
  ),
};
