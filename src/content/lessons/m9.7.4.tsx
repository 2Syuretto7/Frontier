import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PoolingViz } from "@/components/viz/PoolingViz";
import type { LessonContent } from "@/lib/types";

const EB = `def shrink(xbar, s2, mu, tau2):
    B = s2 / (s2 + tau2)
    return B * mu + (1 - B) * xbar

def eb_moments(xbars, s2):
    k = len(xbars)
    mu = sum(xbars) / k
    v = sum((x - mu) ** 2 for x in xbars) / (k - 1)
    return mu, max(v - s2, 0.0)`;

const JS = `import numpy as np

def james_stein(X, sigma2=1.0):
    p = X.shape[-1]
    c = 1 - (p - 2) * sigma2 / np.sum(X ** 2, axis=-1, keepdims=True)
    return c * X

def risks(theta, reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    X = theta + rng.normal(size=(reps, len(theta)))
    mle = ((X - theta) ** 2).sum(axis=1).mean()
    js = ((james_stein(X) - theta) ** 2).sum(axis=1).mean()
    return round(float(mle), 2), round(float(js), 2)`;

export const lesson: LessonContent = {
  id: "m9.7.4",
  minutes: 60,
  links: {
    requires: ["m9.7.2", "m9.6.4"],
    revisits: ["m7.6.2", "m9.2.4"],
    foreshadows: ["m9.8.1", "m9.8.2"],
  },

  puzzle: (
    <>
      <p>
        A model is evaluated on 40 benchmark categories. One category has 5 questions and the model got all 5 right: 100%.
        Another has 400 questions and the model scored 78%. Should you report that the model is perfect at the first
        category? Treating each category alone ignores what the other 39 say about typical accuracy; lumping them together
        ignores real differences. There is a principled middle.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Suppose the categories&apos; true accuracies are themselves drawn from a common distribution. Then that distribution
        is a prior for each category, and it can be estimated from all the categories together. Small categories, whose
        raw numbers are noisy, borrow strength from the rest and are pulled towards the common mean.
      </p>
      <PoolingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a two-level normal model">
        <p>For groups j = 1, …, k with observed means x̄_j of known sampling variance σ_j²,</p>
        <MD>{"\\bar x_j \\mid \\theta_j \\sim N(\\theta_j, \\sigma_j^2), \\qquad \\theta_j \\sim N(\\mu, \\tau^2) \\text{ independently}."}</MD>
        <p>
          τ = 0 is complete pooling (one common θ); τ = ∞ is no pooling (each group alone). μ and τ are hyperparameters.
        </p>
      </Definition>

      <Theorem title="partial pooling">
        <p>Given μ and τ, the posterior of each θ_j is normal with</p>
        <MD>{"\\mathbb{E}[\\theta_j \\mid \\bar x_j] = B_j\\mu + (1 - B_j)\\bar x_j, \\qquad B_j = \\frac{\\sigma_j^2}{\\sigma_j^2 + \\tau^2},"}</MD>
        <p>
          and variance <M>{"(1 - B_j)\\sigma_j^2"}</M>. Marginally, <M>{"\\bar x_j \\sim N(\\mu, \\sigma_j^2 + \\tau^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first part is the normal-normal update with prior N(μ, τ²) and one observation of variance σ_j²: the
          posterior precision is <M>{"1/\\tau^2 + 1/\\sigma_j^2"}</M>, and the posterior mean weights μ and x̄_j by their
          precisions, which gives the shrinkage factor B_j. For the marginal, x̄_j = θ_j + e_j with independent normal parts,
          so it is normal with mean μ and, by the law of total variance, variance{" "}
          <M>{"\\mathbb{E}[\\mathrm{Var}(\\bar x_j \\mid \\theta_j)] + \\mathrm{Var}(\\mathbb{E}[\\bar x_j \\mid \\theta_j]) = \\sigma_j^2 + \\tau^2"}</M>.
        </p>
      </Proof>

      <Example title="empirical Bayes">
        <p>
          The marginal distribution lets the data estimate the hyperparameters. With equal σ², the spread of the group means
          has expectation <M>{"\\sigma^2 + \\tau^2"}</M>, so <M>{"\\hat\\tau^2 = \\max(v - \\sigma^2, 0)"}</M> with v the
          sample variance of the x̄_j. If the means vary no more than noise alone explains, τ̂ = 0 and everything is pooled.
        </p>
        <Code>{EB}</Code>
      </Example>

      <Theorem title="James-Stein">
        <p>
          Let <M>{"X \\sim N(\\theta, I_p)"}</M> with p ≥ 3. The estimator{" "}
          <M>{"\\hat\\theta_{JS} = \\big(1 - (p - 2)/\\|X\\|^2\\big)X"}</M> has strictly smaller total mean squared error than X
          itself, for every θ.
        </p>
      </Theorem>
      <Proof>
        <p>
          We sketch it. Stein&apos;s identity, <M>{"\\mathbb{E}[(X_i - \\theta_i)g(X)] = \\mathbb{E}[\\partial_i g(X)]"}</M> for
          smooth g, applied to <M>{"g(X) = (p - 2)X/\\|X\\|^2"}</M>, gives the risk{" "}
          <M>{"p - (p - 2)^2\\,\\mathbb{E}[1/\\|X\\|^2]"}</M>, which is below p because the expectation is positive (and
          finite when p ≥ 3). The simulation below shows the gain: large near the shrinkage target 0, small far away.
        </p>
        <Code>{JS}</Code>
      </Proof>

      <Remark title="using it">
        <p>
          A full hierarchical Bayesian model puts a prior on μ and τ too, and so accounts for their uncertainty, usually
          via sampling. Partial pooling is the right default when reporting many small-sample metrics: per-category
          benchmark accuracy, A/B test effects across countries, per-user click rates, or performance across random seeds
          and tasks. It also underlies random-effects models and the multi-task idea of sharing statistical strength.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "B",
      rung: "check",
      prompt: <p>A group mean has sampling variance σ² = 0.04 and the between-group variance is τ² = 0.01. What is the shrinkage factor B?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "est",
      rung: "check",
      prompt: <p>With x̄ = 0.9, μ = 0.7, σ² = 0.01 and τ² = 0.03, what is the partially pooled estimate?</p>,
      answer: { kind: "numeric", value: 0.85, tolerance: 0.0001 },
    },
    {
      key: "pool",
      rung: "apply",
      prompt: <p>Which value of τ gives complete pooling, where every group gets the same estimate?</p>,
      answer: { kind: "choice", options: ["τ = 0", "τ = ∞", "τ = 1", "τ equal to σ"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shrink(xbar, s2, mu, tau2):
    B = s2 / (s2 + tau2)
    return B * mu + (1 - B) * xbar

def eb_moments(xbars, s2):
    k = len(xbars)
    mu = sum(xbars) / k
    v = sum((x - mu) ** 2 for x in xbars) / (k - 1)
    return mu, max(v - s2, 0.0)

print(round(shrink(0.9, 0.01, 0.7, 0.01), 4), round(shrink(0.9, 0.04, 0.7, 0.01), 4))
mu, tau2 = eb_moments([0.6, 0.7, 0.8, 0.9], 0.01)
print(round(mu, 4), round(tau2, 4), eb_moments([0.7, 0.72], 0.01)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.8 0.74\n0.75 0.0067 0.0", "0.8 0.86\n0.75 0.0067 0.0", "0.8 0.74\n0.75 0.0167 0.0", "0.8 0.74\n0.75 0.0067 -0.0098"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def james_stein(X, sigma2=1.0):
    p = X.shape[-1]
    c = 1 - (p - 2) * sigma2 / np.sum(X ** 2, axis=-1, keepdims=True)
    return c * X

def risks(theta, reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    X = theta + rng.normal(size=(reps, len(theta)))
    mle = ((X - theta) ** 2).sum(axis=1).mean()
    js = ((james_stein(X) - theta) ** 2).sum(axis=1).mean()
    return round(float(mle), 2), round(float(js), 2)

for t in (0.0, 1.0, 5.0):
    print(t, risks(np.full(10, t)))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 (10.02, 2.0)\n1.0 (10.02, 6.19)\n5.0 (10.02, 9.77)", "0.0 (10.02, 10.02)\n1.0 (10.02, 10.02)\n5.0 (10.02, 10.02)", "0.0 (10.02, 2.0)\n1.0 (10.02, 6.19)\n5.0 (10.02, 12.4)", "0.0 (1.0, 0.2)\n1.0 (1.0, 0.62)\n5.0 (1.0, 0.98)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shrink(xbar, s2, mu, tau2)</C>, the partially pooled estimate, and <C>eb_moments(xbars, s2)</C>, returning the
          mean of the group means and the moment estimate max(v − s2, 0) of τ², with v the sample variance (divisor k − 1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shrink(xbar, s2, mu, tau2):
    return xbar

def eb_moments(xbars, s2):
    return 0.0, 0.0
`,
        solution: EB,
        tests: [
          { name: "shrink", code: `assert shrink(1.0, 1.0, 0.0, 1.0) == 0.5 and shrink(2.0, 0.0, 0.0, 1.0) == 2.0` },
          { name: "eb", code: `m, t = eb_moments([1.0, 3.0], 0.5)
assert m == 2 and abs(t - 1.5) < 1e-12 and eb_moments([1.0, 1.1], 1.0)[1] == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>james_stein(X, sigma2=1.0)</C>, applying (1 − (p − 2)σ²/‖x‖²)x to each row of X (or to a single vector),
          and <C>risks(theta, reps=20000, seed=0)</C>, returning the simulated total mean squared errors of X and of the
          James-Stein estimate for X ~ N(θ, I), rounded to 2 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def james_stein(X, sigma2=1.0):
    return X

def risks(theta, reps=20000, seed=0):
    return 0.0, 0.0
`,
        solution: JS,
        tests: [
          { name: "js", code: `import numpy as np
assert np.allclose(james_stein(np.array([3.0, 4.0, 0.0])), [3 * 24 / 25, 4 * 24 / 25, 0])` },
          { name: "risk", code: `import numpy as np
a, b = risks(np.zeros(20), reps=5000)
assert abs(a - 20) < 0.5 and abs(b - 2) < 0.3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>In the model x̄ | θ ~ N(θ, σ²), θ ~ N(μ, τ²), prove that marginally x̄ ~ N(μ, σ² + τ²).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes x̄ = θ + e with θ ~ N(μ, τ²) and e ~ N(0, σ²) independent (or argues equivalently via the joint density).",
          "Computes E[x̄] = μ and Var(x̄) = τ² + σ², for example by the laws of total expectation and variance.",
          "Concludes normality, since a sum of independent normals is normal (or by completing the square in the marginal integral).",
        ],
      },
    },
    {
      key: "risk0",
      rung: "stretch",
      prompt: <p>For p = 20 and θ = 0, the James-Stein risk is p − (p − 2)² E[1/‖X‖²] with E[1/‖X‖²] = 1/(p − 2). What is it?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between no pooling, complete pooling and partial pooling, how the shrinkage factor depends on the group's noise and the between-group spread, how empirical Bayes estimates that spread, and what the James-Stein result says.",

  glimpse: (
    <>
      <p>
        A posterior is most useful when it makes testable predictions about new data. The posterior predictive
        distribution, next, does this, and comparing its predictions with the actual data checks the model itself.
      </p>
    </>
  ),
};
