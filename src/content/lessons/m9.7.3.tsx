import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MapReparamViz } from "@/components/viz/MapReparamViz";
import type { LessonContent } from "@/lib/types";

const MAPS = `import math

def map_beta(a, b):
    return (a - 1) / (a + b - 2)

def map_logit(a, b, m=20001):
    best, arg = -math.inf, None
    for i in range(m):
        eta = -10 + 20 * i / (m - 1)
        p = 1 / (1 + math.exp(-eta))
        logd = a * math.log(p) + b * math.log(1 - p)
        if logd > best:
            best, arg = logd, p
    return arg`;

const LOGIT = `import numpy as np

def fit_map(x, y, lam, steps=5000, lr=0.1):
    w = 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-w * x))
        w -= lr * (np.sum((p - y) * x) + lam * w)
    return float(w)

def bayes_predict(x, y, x_new, lam):
    grid = np.linspace(-20, 20, 4001)
    s = 2 * y - 1
    logpost = -np.logaddexp(0, -np.outer(grid, s * x)).sum(axis=1) - lam * grid ** 2 / 2
    post = np.exp(logpost - logpost.max())
    post /= post.sum()
    return float(np.sum(post / (1 + np.exp(-grid * x_new))))`;

export const lesson: LessonContent = {
  id: "m9.7.3",
  minutes: 55,
  links: {
    requires: ["m9.7.2", "m9.6.4"],
    revisits: ["m7.3.4", "m5.5.3"],
    foreshadows: ["m9.7.5"],
  },

  puzzle: (
    <>
      <p>
        Training a network with weight decay finds the most probable weights under a normal prior: a MAP estimate. It is
        tempting to call this &quot;the Bayesian answer&quot;. But if you rewrite the model in terms of log-scales or
        log-odds, the most probable value moves, even though nothing about your beliefs changed. What, then, does the
        posterior&apos;s peak actually represent?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A density&apos;s peak depends on the coordinates you draw it in, because stretching the axis rescales the density.
        Probabilities of regions, medians and predictions averaged over the posterior do not have this problem. MAP is a
        convenient regularised fit; full Bayes keeps the whole distribution.
      </p>
      <MapReparamViz />
    </>
  ),

  theory: (
    <>
      <Definition title="MAP estimate">
        <p>The maximum a posteriori estimate maximises the posterior density, equivalently</p>
        <MD>{"\\hat\\theta_{\\mathrm{MAP}} = \\arg\\max_\\theta\\ \\big[\\log p(x \\mid \\theta) + \\log \\pi(\\theta)\\big]."}</MD>
        <p>
          So it is penalised maximum likelihood with penalty −log π. A normal prior <M>{"N(0, \\tau^2 I)"}</M> gives the
          penalty <M>{"\\|\\theta\\|^2/(2\\tau^2)"}</M>, which is ridge or weight decay; a Laplace prior gives an L1 penalty, the
          lasso.
        </p>
      </Definition>

      <Theorem title="MAP depends on the parametrisation">
        <p>
          If η = g(θ) with g a smooth bijection, the posterior density of η is{" "}
          <M>{"\\pi_\\eta(\\eta \\mid x) = \\pi(g^{-1}(\\eta) \\mid x)\\,\\big|(g^{-1})'(\\eta)\\big|"}</M>, and its maximiser is
          in general not <M>{"g(\\hat\\theta_{\\mathrm{MAP}})"}</M>. In contrast, the MLE and posterior quantiles (for
          increasing g) transform correctly.
        </p>
      </Theorem>
      <Proof>
        <p>
          The density formula is the change-of-variables rule. For a counterexample, take a uniform prior on p and h heads in
          n flips, so <M>{"\\pi(p \\mid x) \\propto p^h(1 - p)^{n-h}"}</M> with mode h/n. For η = log(p/(1 − p)),{" "}
          <M>{"dp/d\\eta = p(1 - p)"}</M>, so <M>{"\\pi_\\eta \\propto p^{h+1}(1 - p)^{n-h+1}"}</M>, maximised at{" "}
          <M>{"p = (h + 1)/(n + 2)"}</M>, which differs from h/n unless h/n = 1/2. The likelihood carries no Jacobian, so the
          MLE moves with g; and <M>{"P(\\eta \\leq g(q)) = P(\\theta \\leq q)"}</M> shows quantiles do too.
        </p>
        <Code>{MAPS}</Code>
      </Proof>

      <Example title="separable data">
        <p>
          For logistic regression on perfectly separated data, the likelihood keeps increasing as the weight grows, so
          gradient ascent without a prior drifts off to infinity. A normal prior gives a finite MAP weight. Yet predicting
          with that single weight is overconfident: averaging the predicted probability over the posterior gives 0.90 at x =
          3, where the MAP plug-in says 0.95.
        </p>
        <Code>{LOGIT}</Code>
      </Example>

      <Theorem title="decisions use the posterior, not its mode">
        <p>
          For any loss, the action minimising posterior expected loss depends on the whole posterior. In particular the
          optimal predictive probability of an event is its posterior mean,{" "}
          <M>{"\\int P(\\text{event} \\mid \\theta)\\,\\pi(\\theta \\mid x)\\,d\\theta"}</M>, under squared or log loss.
        </p>
      </Theorem>
      <Proof>
        <p>
          For squared loss <M>{"(1_{\\text{event}} - q)^2"}</M>, the expected loss given the data is minimised at q equal to
          the probability of the event given the data, which by the law of total probability is the stated integral. For
          log loss, <M>{"-r\\log q - (1 - r)\\log(1 - q)"}</M> with r that same probability is minimised at q = r.
        </p>
      </Proof>

      <Remark title="between the extremes">
        <p>
          The Laplace approximation keeps the MAP but adds a normal with covariance equal to the inverse Hessian of the
          negative log posterior there; it recovers much of the predictive benefit cheaply. In high dimensions the mode can
          be atypical: most posterior mass may lie far from it. Deep ensembles, dropout at test time and stochastic weight
          averaging are practical approximations to averaging over weights instead of trusting one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mode",
      rung: "check",
      prompt: <p>What is the MAP estimate (the mode) of p for a Beta(5, 3) posterior? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
    {
      key: "logit",
      rung: "check",
      prompt: <p>With a uniform prior on p and 6 heads in 8 flips, the posterior mode of the log-odds η corresponds to which value of p?</p>,
      answer: { kind: "numeric", value: 0.7, tolerance: 0.0001 },
    },
    {
      key: "lasso",
      rung: "apply",
      prompt: <p>Which prior on regression coefficients makes the MAP estimate the lasso?</p>,
      answer: { kind: "choice", options: ["A Laplace prior centred at 0", "A normal prior centred at 0", "A uniform prior", "A Cauchy prior"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def map_beta(a, b):
    return (a - 1) / (a + b - 2)

def map_logit(a, b, m=20001):
    best, arg = -math.inf, None
    for i in range(m):
        eta = -10 + 20 * i / (m - 1)
        p = 1 / (1 + math.exp(-eta))
        logd = a * math.log(p) + b * math.log(1 - p)
        if logd > best:
            best, arg = logd, p
    return arg

print(map_beta(4, 2), round(map_logit(4, 2), 3))
print(map_beta(4, 1), round(map_logit(4, 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.75 0.667\n1.0 0.8", "0.75 0.75\n1.0 1.0", "0.667 0.75\n0.8 1.0", "0.75 0.667\n1.0 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_map(x, y, lam, steps=5000, lr=0.1):
    w = 0.0
    for _ in range(steps):
        p = 1 / (1 + np.exp(-w * x))
        w -= lr * (np.sum((p - y) * x) + lam * w)
    return float(w)

def bayes_predict(x, y, x_new, lam):
    grid = np.linspace(-20, 20, 4001)
    s = 2 * y - 1
    logpost = -np.logaddexp(0, -np.outer(grid, s * x)).sum(axis=1) - lam * grid ** 2 / 2
    post = np.exp(logpost - logpost.max())
    post /= post.sum()
    return float(np.sum(post / (1 + np.exp(-grid * x_new))))

x, y = np.array([-2.0, -1, 1, 2]), np.array([0.0, 0, 1, 1])
print(round(fit_map(x, y, 0.0, steps=200), 2), round(fit_map(x, y, 0.0, steps=2000), 2))
w = fit_map(x, y, 1.0)
print(round(w, 3), round(float(1 / (1 + np.exp(-3 * w))), 3), round(bayes_predict(x, y, 3.0, 1.0), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.8 6.01\n1.007 0.953 0.898", "3.8 3.8\n1.007 0.953 0.898", "3.8 6.01\n1.007 0.898 0.953", "6.01 3.8\n1.007 0.953 0.898"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>map_beta(a, b)</C>, the mode of Beta(a, b) for a, b &gt; 1, and <C>map_logit(a, b, m=20001)</C>, which
          searches a grid of m log-odds values from −10 to 10 for the maximum of the posterior density of η (which is
          proportional to p^a(1 − p)^b) and returns the corresponding p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def map_beta(a, b):
    return a / (a + b)

def map_logit(a, b, m=20001):
    return 0.5
`,
        solution: MAPS,
        tests: [
          { name: "beta", code: `assert map_beta(3, 3) == 0.5 and abs(map_beta(5, 3) - 2 / 3) < 1e-12` },
          { name: "logit", code: `assert abs(map_logit(2, 6) - 0.25) < 1e-3 and abs(map_logit(5, 5) - 0.5) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_map(x, y, lam, steps=5000, lr=0.1)</C>, gradient descent on the one-weight logistic loss
          Σ log(1 + e^(−(2y − 1)wx)) + λw²/2 starting from w = 0, and <C>bayes_predict(x, y, x_new, lam)</C>, the posterior
          mean of σ(w·x_new) computed on a grid of 4001 weights from −20 to 20.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_map(x, y, lam, steps=5000, lr=0.1):
    return 0.0

def bayes_predict(x, y, x_new, lam):
    return 0.5
`,
        solution: LOGIT,
        tests: [
          { name: "map", code: `import numpy as np
x, y = np.array([-1.0, 1.0]), np.array([0.0, 1.0])
w = fit_map(x, y, 1.0)
assert abs(2 / (1 + np.exp(w)) - w) < 1e-6` },
          { name: "bayes", code: `import numpy as np
x, y = np.array([-1.0, 1.0, -1.0, 1.0]), np.array([1.0, 1.0, 0.0, 0.0])
assert abs(bayes_predict(x, y, 2.0, 1.0) - 0.5) < 1e-9
x, y = np.array([-2.0, -1, 1, 2]), np.array([0.0, 0, 1, 1])
assert abs(bayes_predict(x, y, 3.0, 1.0) - 0.898) < 2e-3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>With a uniform prior on p and h heads in n flips (0 &lt; h &lt; n), prove that the posterior mode of η = log(p/(1 − p)) corresponds to p = (h + 1)/(n + 2), so MAP is not invariant to reparametrisation.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Applies the change of variables: the density of η is π(p | x)·|dp/dη| with dp/dη = p(1 − p).",
          "Obtains a density in η proportional to p^(h+1)(1 − p)^(n−h+1), and maximises it (in p, since η ↦ p is increasing) at (h + 1)/(n + 2).",
          "Compares with the mode h/n of the density in p and notes they differ in general.",
        ],
      },
    },
    {
      key: "lam",
      rung: "stretch",
      prompt: <p>In linear regression with noise variance σ² = 1, a N(0, τ²) prior on each coefficient with τ² = 0.25 makes the MAP estimate ridge regression with which λ (penalty λ‖β‖² added to the sum of squares)?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how MAP estimation relates to regularised maximum likelihood, why the MAP estimate changes under reparametrisation while quantiles do not, why predictions should average over the posterior, and what the Laplace approximation offers in between.",

  glimpse: (
    <>
      <p>
        When many related groups each have little data, such as accuracy on many small benchmark subsets, a prior can be
        learned from the groups themselves. That is the hierarchical model, next.
      </p>
    </>
  ),
};
