import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConformalBandViz } from "@/components/viz/ConformalBandViz";
import type { LessonContent } from "@/lib/types";

const CONF = `import numpy as np

def conformal_radius(pred_cal, y_cal, alpha):
    scores = np.sort(np.abs(y_cal - pred_cal))
    k = int(np.ceil((len(scores) + 1) * (1 - alpha)))
    return float(scores[k - 1]) if k <= len(scores) else float("inf")

def conformal_interval(pred_test, radius):
    return pred_test - radius, pred_test + radius

def coverage(lo, hi, y):
    return float(((lo <= y) & (y <= hi)).mean())`;

const ENS = `import numpy as np

def bootstrap_poly(x, y, deg, M, seed=0):
    rng = np.random.default_rng(seed)
    fits = []
    for _ in range(M):
        i = rng.integers(0, len(x), len(x))
        c = np.polyfit(x[i], y[i], deg)
        fits.append((c, float(np.mean((np.polyval(c, x[i]) - y[i]) ** 2))))
    return fits

def decompose(fits, x):
    means = np.array([np.polyval(c, x) for c, _ in fits])
    noise = np.array([s2 for _, s2 in fits])
    aleatoric = np.full(len(x), noise.mean())
    epistemic = means.var(axis=0)
    return means.mean(axis=0), aleatoric, epistemic`;

export const lesson: LessonContent = {
  id: "l2.8.3",
  minutes: 55,
  links: {
    requires: ["l2.8.2", "l2.4.2", "m7.6.1"],
    revisits: ["l2.2.2", "l2.3.3"],
    foreshadows: ["l7.7.1"],
  },

  puzzle: (
    <>
      <p>
        A regression model predicts a house price of 50 lakh. A buyer wants to know how far off that could be, and gets
        two very different answers depending on whom they ask: one statistician quotes the noise in prices of similar
        houses, another points out that the model has never seen a house in this district. Both are uncertainty. Can you
        attach to every prediction an interval that really contains the truth 90% of the time, whatever the model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Some uncertainty is noise that no amount of data would remove; some is ignorance that more data would. Ensembles
        expose the second: models trained on resampled data agree where data are plentiful and disagree where they are
        not. For a guaranteed interval, a simpler idea suffices. Hold out a calibration set, see how large the errors are
        there, and widen every prediction by an error size that only a fraction α of calibration cases exceed. If new cases
        are like the calibration cases, the same fraction of them will exceed it.
      </p>
      <ConformalBandViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="aleatoric and epistemic uncertainty">
        <p>
          If the parameters θ have a posterior (or an ensemble) distribution, the predictive variance splits as
        </p>
        <MD>{"\\mathrm{Var}(y \\mid x) = \\underbrace{\\mathbb E_\\theta\\big[\\mathrm{Var}(y \\mid x, \\theta)\\big]}_{\\text{aleatoric}} + \\underbrace{\\mathrm{Var}_\\theta\\big(\\mathbb E[y \\mid x, \\theta]\\big)}_{\\text{epistemic}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          This is the law of total variance with θ as the conditioning variable: write{" "}
          <M>{"y - \\mathbb E y = (y - \\mathbb E[y \\mid \\theta]) + (\\mathbb E[y \\mid \\theta] - \\mathbb E y)"}</M>, square
          and take expectations. The cross term vanishes because the first bracket has conditional mean zero given θ, the
          first square averages to the expected conditional variance, and the second is the variance of the conditional
          mean. The epistemic term shrinks as data pin down θ; the aleatoric term does not.
        </p>
        <Code>{ENS}</Code>
      </Proof>

      <Definition title="split conformal prediction">
        <p>
          Fit any predictor <M>{"\\hat f"}</M> on one part of the data. On a separate calibration set of n points compute
          scores <M>{"s_i = \\lvert y_i - \\hat f(x_i)\\rvert"}</M>, and let <M>{"\\hat q"}</M> be the k-th smallest with{" "}
          <M>{"k = \\lceil (n + 1)(1 - \\alpha)\\rceil"}</M> (infinite if k exceeds n). The interval for a new x is{" "}
          <M>{"\\hat f(x) \\pm \\hat q"}</M>.
        </p>
        <Code>{CONF}</Code>
      </Definition>

      <Theorem title="conformal coverage">
        <p>
          If the calibration points and the test point are exchangeable (for example independent and identically
          distributed), then <M>{"P(y_{n+1} \\in \\hat f(x_{n+1}) \\pm \\hat q) \\geq 1 - \\alpha"}</M>, whatever the predictor
          and the distribution.
        </p>
      </Theorem>
      <Proof>
        <p>
          The predictor is fixed by data independent of these n + 1 points, so the scores <M>{"s_1, \\dots, s_{n+1}"}</M>{" "}
          are exchangeable. Assume first that they are distinct with probability 1. Then the rank of{" "}
          <M>{"s_{n+1}"}</M> among all n + 1 scores is uniform on 1, …, n + 1. The test point is covered exactly when{" "}
          <M>{"s_{n+1} \\leq \\hat q"}</M>, that is when fewer than k of the calibration scores lie below it, which means its
          rank among all n + 1 is at most k. That has probability{" "}
          <M>{"k/(n + 1) \\geq 1 - \\alpha"}</M>. Ties only make <M>{"s_{n+1} \\leq \\hat q"}</M> easier, so the bound still
          holds.
        </p>
      </Proof>

      <Remark title="what the guarantees do and do not say">
        <p>
          In the code a cubic fitted to noisy sin x gets half-width 0.5 at α = 0.1 (the noise has standard deviation 0.3,
          and 1.645 × 0.3 ≈ 0.49), and covers 0.92 of new points; on any one calibration set coverage fluctuates around
          the target, the guarantee being on average. With 9 calibration scores, α = 0.1 needs the 9th smallest, and α =
          0.05 needs a 10th that does not exist, so the interval is infinite. The coverage is marginal: averaged over x, not
          for each x, as the viz shows with noise that grows. Exchangeability fails under distribution shift, and then so
          does the guarantee. A bootstrap ensemble of cubics fitted to 100 points in [0, 3] has epistemic variance 0.002 at
          x = 1.5 and 4.8 at x = 5, where its mean prediction is badly wrong; the aleatoric estimate, 0.09, is the same
          at both. That is the signature to look for: a model can be confidently wrong out of range, and only the
          disagreement between plausible models reveals it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "k",
      rung: "check",
      prompt: <p>With n = 99 calibration scores and α = 0.1, which order statistic k is the conformal radius?</p>,
      answer: { kind: "numeric", value: 90, tolerance: 0 },
    },
    {
      key: "tv",
      rung: "check",
      prompt: <p>Three equally weighted ensemble members predict means 1, 2 and 3 at a point, each with noise variance 0.5. What is the total predictive variance? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.1667, tolerance: 0.0001 },
    },
    {
      key: "marg",
      rung: "apply",
      prompt: <p>Split conformal prediction with α = 0.1 guarantees what?</p>,
      answer: {
        kind: "choice",
        options: [
          "That over random draws of calibration and test data, the interval covers a new exchangeable point with probability at least 0.9",
          "That for every input x, the interval covers y with probability at least 0.9",
          "That the interval is the shortest one with 90% coverage",
          "That 90% coverage holds even if the test data come from a different distribution",
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

def conformal_radius(pred_cal, y_cal, alpha):
    scores = np.sort(np.abs(y_cal - pred_cal))
    k = int(np.ceil((len(scores) + 1) * (1 - alpha)))
    return float(scores[k - 1]) if k <= len(scores) else float("inf")

def conformal_interval(pred_test, radius):
    return pred_test - radius, pred_test + radius

def coverage(lo, hi, y):
    return float(((lo <= y) & (y <= hi)).mean())

rng = np.random.default_rng(1); f = lambda x: np.sin(x)
xs = rng.uniform(0, 3, 3000); ys = f(xs) + rng.normal(0, 0.3, 3000)
c = np.polyfit(xs[:500], ys[:500], 3)
r = conformal_radius(np.polyval(c, xs[500:1500]), ys[500:1500], 0.1)
lo, hi = conformal_interval(np.polyval(c, xs[1500:]), r)
print(round(r, 1), round(coverage(lo, hi, ys[1500:]), 2))
print(conformal_radius(np.zeros(9), np.arange(1.0, 10.0), 0.1), conformal_radius(np.zeros(9), np.arange(1.0, 10.0), 0.05))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 0.92\n9.0 inf", "0.5 0.92\n9.0 9.0", "0.3 0.68\n9.0 inf", "0.5 0.92\n8.0 9.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def bootstrap_poly(x, y, deg, M, seed=0):
    rng = np.random.default_rng(seed)
    fits = []
    for _ in range(M):
        i = rng.integers(0, len(x), len(x))
        c = np.polyfit(x[i], y[i], deg)
        fits.append((c, float(np.mean((np.polyval(c, x[i]) - y[i]) ** 2))))
    return fits

def decompose(fits, x):
    means = np.array([np.polyval(c, x) for c, _ in fits])
    noise = np.array([s2 for _, s2 in fits])
    aleatoric = np.full(len(x), noise.mean())
    epistemic = means.var(axis=0)
    return means.mean(axis=0), aleatoric, epistemic

rng = np.random.default_rng(1); f = lambda x: np.sin(x)
xs = rng.uniform(0, 3, 3000); ys = f(xs) + rng.normal(0, 0.3, 3000)
fits = bootstrap_poly(xs[:100], ys[:100], 3, 200)
m, al, ep = decompose(fits, np.array([1.5, 5.0]))
print(np.round(al, 2), np.round(ep, 2) > 0.1, round(float(np.sqrt(al[0])), 1))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.09 0.09] [False  True] 0.3", "[0.09 4.8 ] [False  True] 0.3", "[0.09 0.09] [ True False] 0.3", "[0.09 0.09] [False False] 0.3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conformal_radius(pred_cal, y_cal, alpha)</C>, returning the split conformal half-width (infinity when k
          exceeds n), <C>conformal_interval(pred_test, radius)</C>, returning the lower and upper ends, and{" "}
          <C>coverage(lo, hi, y)</C>, the fraction of y inside.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conformal_radius(pred_cal, y_cal, alpha):
    return 1.0

def conformal_interval(pred_test, radius):
    return pred_test, pred_test

def coverage(lo, hi, y):
    return 0.0
`,
        solution: CONF,
        tests: [
          { name: "radius", code: `p = np.zeros(19); y = np.arange(19.0, 0.0, -1.0)
assert conformal_radius(p, y, 0.05) == 19.0 and conformal_radius(p, y, 0.5) == 10.0 and conformal_radius(p, y, 0.04) == float("inf")` },
          { name: "cover", code: `rng = np.random.default_rng(4); e = rng.standard_t(3, 40000)
r = conformal_radius(np.zeros(2000), e[:2000], 0.2)
lo, hi = conformal_interval(np.zeros(38000), r)
assert np.allclose(hi - lo, 2 * r) and abs(coverage(lo, hi, e[2000:]) - 0.8) < 0.03` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bootstrap_poly(x, y, deg, M, seed=0)</C>, returning M pairs (polynomial coefficients, in-sample mean
          squared error) fitted to bootstrap resamples, and <C>decompose(fits, x)</C>, returning the ensemble mean, the
          aleatoric variance (the mean of the noise estimates) and the epistemic variance (the variance of the member
          predictions) at each x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bootstrap_poly(x, y, deg, M, seed=0):
    return []

def decompose(fits, x):
    z = np.zeros(len(x))
    return z, z, z
`,
        solution: ENS,
        tests: [
          { name: "fits", code: `x = np.linspace(0, 1, 50); y = 2 * x + 1
fits = bootstrap_poly(x, y, 1, 20)
assert len(fits) == 20 and all(np.allclose(c, [2, 1]) and s2 < 1e-20 for c, s2 in fits)` },
          { name: "decomp", code: `fits = [(np.array([1.0, 0.0]), 0.2), (np.array([3.0, 0.0]), 0.4)]
m, al, ep = decompose(fits, np.array([0.0, 1.0, 2.0]))
assert np.allclose(m, [0, 2, 4]) and np.allclose(al, 0.3) and np.allclose(ep, [0, 1, 4])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Scores s₁, …, s_(n+1) are exchangeable and almost surely distinct, and q̂ is the k-th smallest of s₁, …, s_n with
          k = ⌈(n + 1)(1 − α)⌉ ≤ n. Prove that P(s_(n+1) ≤ q̂) ≥ 1 − α.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses exchangeability to argue that the rank of s_(n+1) among all n + 1 scores is uniform on 1, …, n + 1.",
          "Shows that s_(n+1) ≤ q̂ exactly when that rank is at most k (fewer than k calibration scores lie below s_(n+1)).",
          "Concludes the probability is k/(n + 1) ≥ 1 − α by the choice of k.",
        ],
      },
    },
    {
      key: "nmin",
      rung: "stretch",
      prompt: <p>What is the smallest number n of calibration points for which split conformal prediction with α = 0.01 gives a finite interval?</p>,
      answer: { kind: "numeric", value: 99, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between aleatoric and epistemic uncertainty, how an ensemble estimates each, how split conformal prediction builds intervals, why its coverage guarantee holds under exchangeability, and what that guarantee does not promise.",

  glimpse: (
    <>
      <p>
        This course built statistical learning from likelihood upwards. Deep networks reuse almost every idea here, from
        cross-entropy as a proper score to ensembles and calibration, but at a scale where new questions about
        optimisation, generalisation and uncertainty arise.
      </p>
    </>
  ),
};
