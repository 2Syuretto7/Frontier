import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PpcViz } from "@/components/viz/PpcViz";
import type { LessonContent } from "@/lib/types";

const PRED = `def beta_binom_next(a, b, xs):
    return (a + sum(xs)) / (a + b + len(xs))

def normal_predictive(m0, v0, xs, s2):
    prec = 1 / v0 + len(xs) / s2
    m1 = (m0 / v0 + sum(xs) / s2) / prec
    return m1, 1 / prec + s2`;

const PPC = `import numpy as np

def dispersion(c):
    return c.var() / c.mean()

def ppc(counts, stat, a=1.0, b=0.01, reps=4000, seed=0):
    rng = np.random.default_rng(seed)
    counts = np.asarray(counts)
    lam = rng.gamma(a + counts.sum(), 1 / (b + len(counts)), size=reps)
    rep = rng.poisson(lam[:, None], size=(reps, len(counts)))
    t_obs = stat(counts)
    t_rep = np.array([stat(r) for r in rep])
    return round(float(t_obs), 2), float(np.mean(t_rep >= t_obs))`;

export const lesson: LessonContent = {
  id: "m9.7.5",
  minutes: 55,
  links: {
    requires: ["m9.7.4", "m9.7.3"],
    revisits: ["m7.6.2", "m9.4.4"],
    foreshadows: ["m9.8.1", "m9.8.5"],
  },

  puzzle: (
    <>
      <p>
        A Poisson model for daily incident counts fits the average perfectly. Yet the operations team keeps seeing days
        with ten incidents, which the model calls nearly impossible, and more quiet days than it predicts. The fitted
        parameter is fine; the model is wrong. How can a Bayesian analysis notice that its own model is wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A fitted model is a machine for generating data. Generate many fake data sets from it, using the posterior to
        average over the parameter, and compare them with the real data. If the real data look unlike anything the model
        produces in some respect that matters, the model is missing something.
      </p>
      <PpcViz />
    </>
  ),

  theory: (
    <>
      <Definition title="posterior predictive distribution">
        <p>The distribution of a new observation x̃, given data x, is</p>
        <MD>{"p(\\tilde x \\mid x) = \\int p(\\tilde x \\mid \\theta)\\,\\pi(\\theta \\mid x)\\,d\\theta,"}</MD>
        <p>
          assuming x̃ and x are conditionally independent given θ. It averages the model&apos;s predictions over parameter
          uncertainty, instead of plugging in a single estimate.
        </p>
      </Definition>

      <Theorem title="predictive mean and variance">
        <p>
          Writing <M>{"\\mu(\\theta)"}</M> and <M>{"\\sigma^2(\\theta)"}</M> for the mean and variance of x̃ given θ,
        </p>
        <MD>{"\\mathbb{E}[\\tilde x \\mid x] = \\mathbb{E}[\\mu(\\theta) \\mid x], \\qquad \\mathrm{Var}(\\tilde x \\mid x) = \\mathbb{E}[\\sigma^2(\\theta) \\mid x] + \\mathrm{Var}(\\mu(\\theta) \\mid x)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Apply the laws of total expectation and total variance to x̃, conditioning on θ, with every probability also
          conditioned on the data x. The first term of the variance is noise that remains even if θ were known; the second is
          uncertainty about θ, which shrinks as data accumulate.
        </p>
      </Proof>

      <Example title="two closed forms">
        <p>
          Beta-Bernoulli: the probability that the next trial succeeds is the posterior mean (a + h)/(a + b + n); with a
          uniform prior and three successes in three trials, 0.8. Normal-normal: the predictive is{" "}
          <M>{"N(m_1, v_1 + \\sigma^2)"}</M>, wider than the plug-in <M>{"N(m_1, \\sigma^2)"}</M> by the posterior variance v₁.
        </p>
        <Code>{PRED}</Code>
      </Example>

      <Definition title="posterior predictive check">
        <p>
          Choose a statistic T. Draw θ from the posterior, simulate a replicated data set x^rep of the same size, and record
          T(x^rep); repeat. The posterior predictive p-value is <M>{"P(T(x^{\\text{rep}}) \\geq T(x) \\mid x)"}</M>. Values near
          0 or 1 mean the model rarely produces data like the observed in this respect.
        </p>
      </Definition>

      <Example title="checking a Poisson model">
        <p>
          For genuinely Poisson counts the dispersion check gives an unremarkable p-value. For overdispersed counts with the
          same mean, the observed variance-to-mean ratio of about 2.7 is never matched by replicated data, while the check
          based on the mean passes. A statistic the model was fitted to will always look fine; choose statistics that probe
          what the model assumes but did not fit, such as spread, zeros or tails.
        </p>
        <Code>{PPC}</Code>
      </Example>

      <Remark title="predictive thinking in machine learning">
        <p>
          A classifier&apos;s softmax output is a predictive distribution, and evaluating it with log loss or calibration
          plots is predictive checking. Plug-in predictions understate uncertainty, most of all far from the training data,
          where the Var(μ(θ) | x) term is large; ensembles and Bayesian approximations try to recover it. Posterior
          predictive p-values are diagnostics, not calibrated tests: they use the data twice and tend towards 1/2.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "next",
      rung: "check",
      prompt: <p>With a Beta(2, 2) prior and 3 successes in 4 trials, what is the posterior predictive probability that the next trial succeeds?</p>,
      answer: { kind: "numeric", value: 0.625, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>A normal mean has posterior variance 0.05 and the observation noise variance is 0.5. What is the variance of the posterior predictive distribution of a new observation?</p>,
      answer: { kind: "numeric", value: 0.55, tolerance: 0.0001 },
    },
    {
      key: "stat",
      rung: "apply",
      prompt: <p>Why is the sample mean a poor statistic for a posterior predictive check of a Poisson model?</p>,
      answer: {
        kind: "choice",
        options: ["The model was fitted to the mean, so replicated data reproduce it whatever the true distribution", "The mean of Poisson data is always an integer", "The posterior of the mean is improper", "Replicated data sets have a different size"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def beta_binom_next(a, b, xs):
    return (a + sum(xs)) / (a + b + len(xs))

def normal_predictive(m0, v0, xs, s2):
    prec = 1 / v0 + len(xs) / s2
    m1 = (m0 / v0 + sum(xs) / s2) / prec
    return m1, 1 / prec + s2

print(beta_binom_next(1, 1, [1, 1, 1]), beta_binom_next(1, 1, []))
print(normal_predictive(0.0, 1.0, [2.0] * 4, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.8 0.5\n(1.6, 1.2)", "1.0 0.5\n(1.6, 1.2)", "0.8 0.5\n(1.6, 0.2)", "0.8 0.0\n(2.0, 1.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dispersion(c):
    return c.var() / c.mean()

def ppc(counts, stat, a=1.0, b=0.01, reps=4000, seed=0):
    rng = np.random.default_rng(seed)
    counts = np.asarray(counts)
    lam = rng.gamma(a + counts.sum(), 1 / (b + len(counts)), size=reps)
    rep = rng.poisson(lam[:, None], size=(reps, len(counts)))
    t_obs = stat(counts)
    t_rep = np.array([stat(r) for r in rep])
    return round(float(t_obs), 2), float(np.mean(t_rep >= t_obs))

rng = np.random.default_rng(5)
pois, over = rng.poisson(2.0, 100), rng.negative_binomial(1, 1 / 3, 100)
print(ppc(pois, dispersion), ppc(over, dispersion))
print(ppc(over, lambda c: c.mean()))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0.86, 0.81775) (2.68, 0.0)\n(1.84, 0.5325)", "(0.86, 0.0) (2.68, 0.81775)\n(1.84, 0.5325)", "(0.86, 0.81775) (2.68, 0.0)\n(1.84, 0.0)", "(1.0, 0.5) (1.0, 0.5)\n(2.0, 0.5)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>beta_binom_next(a, b, xs)</C>, the predictive probability that the next 0/1 observation is 1, and{" "}
          <C>normal_predictive(m0, v0, xs, s2)</C>, returning the mean and variance of the predictive distribution of a new
          observation under the normal-normal model.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def beta_binom_next(a, b, xs):
    return 0.5

def normal_predictive(m0, v0, xs, s2):
    return m0, v0
`,
        solution: PRED,
        tests: [
          { name: "bb", code: `assert beta_binom_next(2, 2, [1, 1, 1, 0]) == 0.625` },
          { name: "np", code: `m, v = normal_predictive(0.0, 1.0, [], 2.0)
assert m == 0 and v == 3
m, v = normal_predictive(0.0, 1.0, [1.0], 1.0)
assert abs(m - 0.5) < 1e-12 and abs(v - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dispersion(c)</C>, the variance (divisor n) divided by the mean of a numpy array, and{" "}
          <C>ppc(counts, stat, a=1.0, b=0.01, reps=4000, seed=0)</C>, which draws reps rates from the Gamma(a + Σc, b + n)
          posterior (numpy uses shape and scale), simulates a Poisson data set of size n for each, and returns the observed
          statistic rounded to 2 places and the fraction of replicated statistics at least as large.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dispersion(c):
    return 1.0

def ppc(counts, stat, a=1.0, b=0.01, reps=4000, seed=0):
    return 0.0, 0.5
`,
        solution: PPC,
        tests: [
          { name: "disp", code: `import numpy as np
assert abs(dispersion(np.array([1, 3])) - 0.5) < 1e-12` },
          { name: "ppc", code: `import numpy as np
c = np.array([0, 0, 0, 0, 10, 10, 0, 0, 0, 10] * 5)
t, p = ppc(c, dispersion, reps=1000)
assert t > 5 and p == 0.0
t, p = ppc(np.random.default_rng(1).poisson(3.0, 200), dispersion, reps=1000)
assert 0.02 < p < 0.98` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that Var(x̃ | x) = E[σ²(θ) | x] + Var(μ(θ) | x), where μ(θ) and σ²(θ) are the mean and variance of x̃ given θ, and x̃ is conditionally independent of x given θ.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses conditional independence to identify E[x̃ | θ, x] = μ(θ) and Var(x̃ | θ, x) = σ²(θ).",
          "Applies the law of total variance (conditioning on θ) under the posterior given x.",
          "Writes the result as E[σ²(θ) | x] + Var(μ(θ) | x), or derives it from E[x̃² | x] − E[x̃ | x]² directly.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: <p>With a uniform prior and 3 successes in 3 trials (posterior Beta(4, 1)), what is the posterior predictive probability that the next two trials both succeed? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the posterior predictive distribution is, why its variance has two parts, why it is wider than a plug-in prediction, and how posterior predictive checks reveal a misspecified model.",

  glimpse: (
    <>
      <p>
        The final chapter turns all of these tools on the experiments that machine learning research runs every day,
        starting with a deceptively simple question: is model A better than model B on this benchmark?
      </p>
    </>
  ),
};
