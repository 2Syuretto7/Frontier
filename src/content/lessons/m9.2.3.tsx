import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BetaPostViz } from "@/components/viz/BetaPostViz";
import type { LessonContent } from "@/lib/types";

const BETA = `def beta_post(a, b, xs):
    h = sum(xs)
    return a + h, b + len(xs) - h

def post_summary(a, b):
    mean = a / (a + b)
    mode = (a - 1) / (a + b - 2) if a > 1 and b > 1 else None
    return mean, mode`;

const GRID = `import numpy as np

def grid_posterior(prior, xs, m=1001):
    p = np.linspace(0, 1, m)
    h, n = sum(xs), len(xs)
    w = prior(p) * p ** h * (1 - p) ** (n - h)
    return p, w / w.sum()

def risk(p, n, a=1, b=1, reps=100000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    mle, pm = h / n, (h + a) / (n + a + b)
    return ((mle - p) ** 2).mean(), ((pm - p) ** 2).mean()`;

export const lesson: LessonContent = {
  id: "m9.2.3",
  minutes: 55,
  links: {
    requires: ["m9.2.2", "m7.1.4"],
    revisits: ["m7.6.3", "m7.3.1"],
    foreshadows: ["m9.7.1", "m9.7.2", "m9.2.4"],
  },

  puzzle: (
    <>
      <p>
        A new coin lands heads on all three of its first three flips. Maximum likelihood says it always lands heads: p̂ = 1.
        Nobody believes that. You know most coins are close to fair, and three flips are not enough to overturn that. How
        can that knowledge enter the estimate in a principled way?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Treat the unknown parameter itself as random, with a prior distribution describing what you believe before the
        data. Bayes&apos; rule turns prior and likelihood into a posterior. A single number can then be read off the
        posterior: its mean, median or mode.
      </p>
      <BetaPostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="prior, posterior and Bayes estimators">
        <p>
          With prior density <M>{"\\pi(\\theta)"}</M> and likelihood <M>{"L(\\theta)"}</M>, the posterior is
        </p>
        <MD>{"\\pi(\\theta \\mid x) = \\frac{L(\\theta)\\,\\pi(\\theta)}{\\int L(t)\\,\\pi(t)\\,dt} \\propto L(\\theta)\\,\\pi(\\theta)."}</MD>
        <p>
          For a loss function <M>{"\\ell(\\theta, a)"}</M>, the Bayes estimator chooses the a minimising the posterior expected
          loss <M>{"\\mathbb{E}[\\ell(\\theta, a) \\mid x]"}</M>. The posterior mode is the maximum a posteriori (MAP) estimate.
        </p>
      </Definition>

      <Example title="the beta prior for a coin">
        <p>
          With prior <M>{"\\mathrm{Beta}(a, b) \\propto p^{a-1}(1-p)^{b-1}"}</M> and h heads in n flips, the posterior is
          proportional to <M>{"p^{a+h-1}(1-p)^{b+n-h-1}"}</M>, which is <M>{"\\mathrm{Beta}(a + h, b + n - h)"}</M>. Its mean is
        </p>
        <MD>{"\\frac{a + h}{a + b + n} = \\frac{a + b}{a + b + n}\\cdot\\frac{a}{a + b} + \\frac{n}{a + b + n}\\cdot\\frac{h}{n},"}</MD>
        <p>
          a weighted average of the prior mean and the MLE, with the prior acting like a + b extra flips. A uniform prior
          (a = b = 1) after three heads gives 4/5 = 0.8, Laplace&apos;s rule of succession (h + 1)/(n + 2).
        </p>
        <Code>{BETA}</Code>
      </Example>

      <Theorem title="squared loss gives the posterior mean">
        <p>
          Under squared loss <M>{"(\\theta - a)^2"}</M> the Bayes estimator is the posterior mean{" "}
          <M>{"\\mathbb{E}[\\theta \\mid x]"}</M>. Under absolute loss <M>{"|\\theta - a|"}</M> it is a posterior median.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write m for the posterior mean. Then{" "}
          <M>{"\\mathbb{E}[(\\theta - a)^2 \\mid x] = \\mathbb{E}[(\\theta - m)^2 \\mid x] + (m - a)^2"}</M>, because the
          cross term <M>{"2(m - a)\\,\\mathbb{E}[\\theta - m \\mid x]"}</M> is 0. The first term does not depend on a, so the
          minimum is at a = m. For absolute loss, the derivative of the expected loss in a is{" "}
          <M>{"P(\\theta < a \\mid x) - P(\\theta > a \\mid x)"}</M>, which changes sign at a median.
        </p>
      </Proof>

      <Example title="any prior, on a grid">
        <p>
          When the posterior has no closed form, evaluate prior times likelihood on a grid and normalise. The second function
          compares the mean squared error of the MLE and of the uniform-prior posterior mean by simulation, for a coin of
          bias p flipped 10 times.
        </p>
        <Code>{GRID}</Code>
      </Example>

      <Remark title="no estimator wins everywhere">
        <p>
          The posterior mean shrinks towards the prior mean. Near p = 1/2 that helps, cutting the error; near p = 0.95 it
          hurts, because the shrinkage introduces bias. This tradeoff between bias and variance is the subject of the next
          lesson. In machine learning, a prior is a regulariser: weight decay is the MAP estimate under a normal prior on the
          weights, and label smoothing resembles adding pseudo-counts as the beta prior does.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "post",
      rung: "check",
      prompt: <p>With prior Beta(2, 2) and 6 heads in 10 flips, what is the first parameter of the posterior beta distribution?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "mean",
      rung: "check",
      prompt: <p>With a uniform prior and 3 heads in 3 flips, what is the posterior mean of p?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "loss",
      rung: "apply",
      prompt: <p>Under absolute error loss, which summary of the posterior is the Bayes estimator?</p>,
      answer: { kind: "choice", options: ["The posterior median", "The posterior mean", "The posterior mode", "The maximum likelihood estimate"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def beta_post(a, b, xs):
    h = sum(xs)
    return a + h, b + len(xs) - h

def post_summary(a, b):
    mean = a / (a + b)
    mode = (a - 1) / (a + b - 2) if a > 1 and b > 1 else None
    return mean, mode

print(beta_post(1, 1, [1, 1, 1]), post_summary(4, 1))
print(post_summary(*beta_post(2, 2, [1, 0, 1, 1])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(4, 1) (0.8, None)\n(0.625, 0.6666666666666666)", "(4, 1) (0.8, 1.0)\n(0.625, 0.6666666666666666)", "(1, 4) (0.2, None)\n(0.625, 0.6666666666666666)", "(4, 1) (0.8, None)\n(0.6666666666666666, 0.625)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def grid_posterior(prior, xs, m=1001):
    p = np.linspace(0, 1, m)
    h, n = sum(xs), len(xs)
    w = prior(p) * p ** h * (1 - p) ** (n - h)
    return p, w / w.sum()

def risk(p, n, a=1, b=1, reps=100000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    mle, pm = h / n, (h + a) / (n + a + b)
    return ((mle - p) ** 2).mean(), ((pm - p) ** 2).mean()

p, w = grid_posterior(lambda p: np.ones_like(p), [1, 1, 1])
print(round(float((p * w).sum()), 3))
for q in (0.5, 0.95):
    print(q, [round(float(r), 4) for r in risk(q, 10)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.8\n0.5 [0.025, 0.0173]\n0.95 [0.0047, 0.0089]", "1.0\n0.5 [0.025, 0.0173]\n0.95 [0.0047, 0.0089]", "0.8\n0.5 [0.0173, 0.025]\n0.95 [0.0089, 0.0047]", "0.8\n0.5 [0.025, 0.0173]\n0.95 [0.0047, 0.0031]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>beta_post(a, b, xs)</C>, returning the posterior beta parameters after the 0/1 observations xs, and{" "}
          <C>post_summary(a, b)</C>, returning the mean and the mode of Beta(a, b), with the mode None unless a &gt; 1 and b &gt; 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def beta_post(a, b, xs):
    return a, b

def post_summary(a, b):
    return 0.5, None
`,
        solution: BETA,
        tests: [
          { name: "post", code: `assert beta_post(1, 1, [1, 0, 0]) == (2, 3)
assert beta_post(3, 5, []) == (3, 5)` },
          { name: "summary", code: `m, d = post_summary(3, 3)
assert m == 0.5 and d == 0.5
assert post_summary(1, 2) == (1 / 3, None)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid_posterior(prior, xs, m=1001)</C>, returning the grid of m equally spaced points on [0, 1] and the
          normalised posterior weights for 0/1 data xs, and <C>risk(p, n, a=1, b=1, reps=100000, seed=0)</C>, returning the
          simulated mean squared errors of h/n and of (h + a)/(n + a + b), with h drawn by default_rng(seed).binomial.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def grid_posterior(prior, xs, m=1001):
    p = np.linspace(0, 1, m)
    return p, np.ones(m) / m

def risk(p, n, a=1, b=1, reps=100000, seed=0):
    return 0.0, 0.0
`,
        solution: GRID,
        tests: [
          { name: "grid", code: `import numpy as np
p, w = grid_posterior(lambda p: np.ones_like(p), [1, 0])
assert abs(w.sum() - 1) < 1e-12 and abs((p * w).sum() - 0.5) < 1e-9
p, w = grid_posterior(lambda p: np.ones_like(p), [1, 1, 1, 1])
assert abs((p * w).sum() - 5 / 6) < 1e-3` },
          { name: "risk", code: `m1, m2 = risk(0.5, 20, reps=20000)
assert abs(m1 - 0.0125) < 0.001 and m2 < m1` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the posterior mean minimises the posterior expected squared loss E[(θ − a)² | x] over all real a.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Introduces m = E[θ | x] and writes θ − a = (θ − m) + (m − a).",
          "Expands the square and shows the cross term vanishes because E[θ − m | x] = 0.",
          "Concludes the expected loss is Var(θ | x) + (m − a)², minimised exactly at a = m.",
        ],
      },
    },
    {
      key: "map",
      rung: "stretch",
      prompt: <p>With prior Beta(3, 3) and 4 heads in 4 flips, what is the MAP estimate of p? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a prior and the likelihood combine into a posterior, why the beta prior gives a beta posterior for a coin, why squared loss leads to the posterior mean, and how the posterior mean compromises between the prior and the data.",

  glimpse: (
    <>
      <p>
        We now have several estimators for the same quantity, and simulation showed each can beat the others somewhere.
        The next lesson measures them with mean squared error and splits that error into bias and variance.
      </p>
    </>
  ),
};
