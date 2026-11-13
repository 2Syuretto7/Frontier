import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReliabilityViz } from "@/components/viz/ReliabilityViz";
import type { LessonContent } from "@/lib/types";

const REL = `import numpy as np

def reliability(q, y, bins=10):
    idx = np.minimum((q * bins).astype(int), bins - 1)
    conf, freq, count = [], [], []
    for b in range(bins):
        m = idx == b
        if m.any():
            conf.append(q[m].mean()); freq.append(y[m].mean()); count.append(int(m.sum()))
    return np.array(conf), np.array(freq), np.array(count)

def ece(q, y, bins=10):
    conf, freq, count = reliability(q, y, bins)
    return float((count * np.abs(conf - freq)).sum() / count.sum())`;

const FIX = `import numpy as np

def platt(q, y, iters=50):
    s = np.log(q / (1 - q))
    X = np.stack([s, np.ones_like(s)], axis=1)
    w = np.zeros(2)
    for _ in range(iters):
        p = 1 / (1 + np.exp(-X @ w))
        H = X.T @ (X * (p * (1 - p))[:, None])
        w = w + np.linalg.solve(H, X.T @ (y - p))
    return w

def murphy(q, y):
    base = y.mean()
    rel = res = 0.0
    for v in np.unique(q):
        m = q == v
        rel += m.mean() * (v - y[m].mean()) ** 2
        res += m.mean() * (y[m].mean() - base) ** 2
    return float(rel), float(res), float(base * (1 - base))`;

export const lesson: LessonContent = {
  id: "l2.8.2",
  minutes: 50,
  links: {
    requires: ["l2.8.1", "l2.2.3"],
    revisits: ["l2.2.5", "m7.6.1"],
    foreshadows: ["l2.8.3", "l7.7.4"],
  },

  puzzle: (
    <>
      <p>
        Two classifiers have the same accuracy. On the cases where the first says 90%, the event happens 90% of the time;
        on the cases where the second says 90%, it happens 65% of the time. A doctor deciding whether to treat cares about
        the difference, because a 90% risk and a 65% risk call for different actions. How do you measure this property,
        and can you repair a model that lacks it without retraining?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Group the cases by what the model said and compare each group&apos;s forecast with how often the event actually
        occurred. A calibrated model&apos;s groups line up with the diagonal. Calibration alone is cheap: always predicting
        the base rate is perfectly calibrated and useless. What a good forecaster adds is resolution, forecasts that
        differ a lot between cases whose outcomes differ. The Brier score rewards both, and splits neatly into the two.
      </p>
      <ReliabilityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="calibration">
        <p>
          A binary forecast q(X) is calibrated if <M>{"P(Y = 1 \\mid q(X) = v) = v"}</M> for every value v it takes. A
          reliability diagram bins the forecasts and plots each bin&apos;s observed frequency against its mean forecast.
          The expected calibration error averages the gaps, weighted by bin size:{" "}
          <M>{"\\mathrm{ECE} = \\sum_b \\frac{n_b}{n}\\,\\lvert \\bar q_b - \\bar y_b\\rvert"}</M>. It depends on the binning,
          and with few cases per bin it is biased upwards by noise.
        </p>
        <Code>{REL}</Code>
      </Definition>

      <Theorem title="the Murphy decomposition">
        <p>
          Let the forecast take values v with frequencies <M>{"w_v"}</M>, let <M>{"f_v"}</M> be the event rate when the
          forecast is v, and <M>{"\\bar y = \\sum_v w_vf_v"}</M> the base rate. The mean Brier score{" "}
          <M>{"\\frac1n\\sum (q_i - y_i)^2"}</M> equals
        </p>
        <MD>{"\\underbrace{\\sum_v w_v(v - f_v)^2}_{\\text{reliability}} - \\underbrace{\\sum_v w_v(f_v - \\bar y)^2}_{\\text{resolution}} + \\underbrace{\\bar y(1 - \\bar y)}_{\\text{uncertainty}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Within the group with forecast v, the outcomes have mean <M>{"f_v"}</M> and, being 0 or 1, variance{" "}
          <M>{"f_v(1 - f_v)"}</M>, so the group&apos;s mean of <M>{"(v - y)^2"}</M> is{" "}
          <M>{"(v - f_v)^2 + f_v(1 - f_v)"}</M>. Averaging over groups, the first terms give the reliability. For the
          second, the total variance of y is the mean within-group variance plus the variance of the group means:{" "}
          <M>{"\\bar y(1 - \\bar y) = \\sum_v w_vf_v(1 - f_v) + \\sum_v w_v(f_v - \\bar y)^2"}</M>. Substituting gives the
          formula.
        </p>
      </Proof>

      <Theorem title="recalibration removes the reliability term">
        <p>
          Replace each forecast v by <M>{"g(v) = f_v"}</M>. The new forecast is calibrated, and its Brier score is the old
          one minus the old reliability term.
        </p>
      </Theorem>
      <Proof>
        <p>
          Cases that get the same new forecast u are the union of old groups with <M>{"f_v = u"}</M>, so their event rate
          is u: the new forecast is calibrated and its reliability is 0. Merging groups with equal rates leaves{" "}
          <M>{"\\sum w(f - \\bar y)^2"}</M> unchanged, and the uncertainty depends only on y. By the decomposition the
          Brier score drops by exactly the old reliability.
        </p>
        <Code>{FIX}</Code>
      </Proof>

      <Remark title="recalibration in practice">
        <p>
          The map g must be estimated, on data not used to train the model. Platt scaling fits{" "}
          <M>{"g(v) = \\sigma(a\\,\\mathrm{logit}(v) + b)"}</M> by logistic regression; isotonic regression fits any
          increasing g; temperature scaling, for K classes, divides all logits by one fitted constant. In the code a model
          whose logits are 2.5 times too large has ECE 0.12; Platt scaling finds a = 0.4 and b = 0 and brings the ECE to
          about 0. The toy forecasts give reliability 0.02, resolution 0.04 and uncertainty 0.24, and indeed the Brier
          score is 0.02 − 0.04 + 0.24 = 0.22. Calibration is a statement about groups of cases, not about any single case,
          and a model can be calibrated overall while miscalibrated within a subgroup, which matters when decisions differ
          between groups.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "unc",
      rung: "check",
      prompt: <p>The event happens in 30% of cases. What is the uncertainty term of the Murphy decomposition?</p>,
      answer: { kind: "numeric", value: 0.21, tolerance: 0.0001 },
    },
    {
      key: "ece",
      rung: "check",
      prompt: <p>A model says 0.9 on 100 cases, of which 80 are positive, and 0.2 on another 100 cases, of which 30 are positive. What is its ECE with these two groups as bins?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "const",
      rung: "apply",
      prompt: <p>A forecaster always announces the base rate of the event. What does the Murphy decomposition say about it?</p>,
      answer: {
        kind: "choice",
        options: [
          "Reliability 0 and resolution 0, so its Brier score equals the uncertainty term",
          "Reliability 0 and maximal resolution, so it is the best possible forecaster",
          "Its reliability equals the uncertainty term",
          "The decomposition does not apply to constant forecasts",
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

def reliability(q, y, bins=10):
    idx = np.minimum((q * bins).astype(int), bins - 1)
    conf, freq, count = [], [], []
    for b in range(bins):
        m = idx == b
        if m.any():
            conf.append(q[m].mean()); freq.append(y[m].mean()); count.append(int(m.sum()))
    return np.array(conf), np.array(freq), np.array(count)

def ece(q, y, bins=10):
    conf, freq, count = reliability(q, y, bins)
    return float((count * np.abs(conf - freq)).sum() / count.sum())

rng = np.random.default_rng(0); z = rng.normal(0, 2, 20000)
y = (rng.random(20000) < 1 / (1 + np.exp(-z))).astype(float); q = 1 / (1 + np.exp(-2.5 * z))
print(round(ece(q, y), 2), round(ece(np.full(20000, y.mean()), y), 2))
q = np.array([0.2] * 5 + [0.8] * 5); y = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 0.0])
print(np.round(reliability(q, y, 5)[1], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.12 0.0\n[0.4 0.8]", "0.0 0.12\n[0.4 0.8]", "0.12 0.0\n[0.2 0.8]", "0.12 0.5\n[0.4 0.8]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def platt(q, y, iters=50):
    s = np.log(q / (1 - q))
    X = np.stack([s, np.ones_like(s)], axis=1)
    w = np.zeros(2)
    for _ in range(iters):
        p = 1 / (1 + np.exp(-X @ w))
        H = X.T @ (X * (p * (1 - p))[:, None])
        w = w + np.linalg.solve(H, X.T @ (y - p))
    return w

def murphy(q, y):
    base = y.mean()
    rel = res = 0.0
    for v in np.unique(q):
        m = q == v
        rel += m.mean() * (v - y[m].mean()) ** 2
        res += m.mean() * (y[m].mean() - base) ** 2
    return float(rel), float(res), float(base * (1 - base))

rng = np.random.default_rng(0); z = rng.normal(0, 2, 20000)
y = (rng.random(20000) < 1 / (1 + np.exp(-z))).astype(float); q = 1 / (1 + np.exp(-2.5 * z))
a, b = platt(q, y); q2 = 1 / (1 + np.exp(-(a * np.log(q / (1 - q)) + b)))
print(round(a, 1), round(abs(b), 1))
q = np.array([0.2] * 5 + [0.8] * 5); y = np.array([0, 0, 0, 1, 1, 1, 1, 1, 1, 0.0])
rel, res, unc = murphy(q, y)
print(round(rel, 4), round(res, 4), round(unc, 4), round(float(((q - y) ** 2).mean()), 4))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.4 0.0\n0.02 0.04 0.24 0.22", "2.5 0.0\n0.02 0.04 0.24 0.22", "0.4 0.0\n0.04 0.02 0.24 0.26", "0.4 0.3\n0.02 0.04 0.24 0.22"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reliability(q, y, bins=10)</C>, returning for each non-empty bin of [0, 1] (the last bin includes 1) the
          mean forecast, the observed frequency and the count, and <C>ece(q, y, bins=10)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reliability(q, y, bins=10):
    return np.zeros(0), np.zeros(0), np.zeros(0)

def ece(q, y, bins=10):
    return 0.0
`,
        solution: REL,
        tests: [
          { name: "bins", code: `q = np.array([0.05, 0.15, 0.12, 1.0, 0.95]); y = np.array([0, 1, 0, 1, 1.0])
c, f, n = reliability(q, y)
assert np.allclose(c, [0.05, 0.135, 0.975]) and np.allclose(f, [0, 0.5, 1]) and list(n) == [1, 2, 2]` },
          { name: "ece", code: `q = np.array([0.9] * 10 + [0.2] * 10); y = np.array([1] * 8 + [0] * 2 + [1] * 3 + [0] * 7, dtype=float)
assert abs(ece(q, y) - 0.1) < 1e-12 and abs(ece(q, y, bins=2) - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>platt(q, y, iters=50)</C>, fitting σ(a·logit(q) + b) to the outcomes by Newton&apos;s method from a = b = 0
          and returning the array (a, b), and <C>murphy(q, y)</C>, returning the reliability, resolution and uncertainty
          terms, grouping by the distinct forecast values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def platt(q, y, iters=50):
    return np.array([1.0, 0.0])

def murphy(q, y):
    return 0.0, 0.0, 0.0
`,
        solution: FIX,
        tests: [
          { name: "platt", code: `rng = np.random.default_rng(2); z = rng.normal(0, 1.5, 40000)
y = (rng.random(40000) < 1 / (1 + np.exp(-(0.5 * z + 0.3)))).astype(float)
a, b = platt(1 / (1 + np.exp(-z)), y)
assert abs(a - 0.5) < 0.05 and abs(b - 0.3) < 0.05` },
          { name: "murphy", code: `rng = np.random.default_rng(3); q = rng.choice([0.1, 0.4, 0.7], 500); y = (rng.random(500) < q).astype(float)
rel, res, unc = murphy(q, y)
assert abs(rel - res + unc - ((q - y) ** 2).mean()) < 1e-12 and rel >= 0 and res >= 0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A binary forecast takes finitely many values v with frequencies w_v, and f_v is the event rate among cases with
          forecast v. Prove the Murphy decomposition: the mean Brier score equals Σ w_v(v − f_v)² − Σ w_v(f_v − ȳ)² + ȳ(1 − ȳ),
          where ȳ is the overall event rate.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows that within the group with forecast v the mean of (v − y)² is (v − f_v)² + f_v(1 − f_v), using that y is 0 or 1.",
          "Shows ȳ(1 − ȳ) = Σ w_v f_v(1 − f_v) + Σ w_v (f_v − ȳ)², by the law of total variance or by direct expansion using ȳ = Σ w_v f_v.",
          "Combines the two to obtain the stated decomposition.",
        ],
      },
    },
    {
      key: "bs",
      rung: "stretch",
      prompt: <p>A forecaster has reliability 0.01 and resolution 0.05 on an event with base rate 0.4. What is its mean Brier score?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a probabilistic classifier to be calibrated, how a reliability diagram and the ECE measure it, how the Brier score splits into reliability, resolution and uncertainty, and how Platt scaling repairs calibration.",

  glimpse: (
    <>
      <p>
        A calibrated probability for a class label is one kind of uncertainty. For regression, and for models that may face
        unfamiliar inputs, you also want intervals that cover the truth as often as they claim, and some sense of whether
        the uncertainty comes from noise in the data or from ignorance in the model.
      </p>
    </>
  ),
};
