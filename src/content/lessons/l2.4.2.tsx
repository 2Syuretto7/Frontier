import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BagAverageViz } from "@/components/viz/BagAverageViz";
import type { LessonContent } from "@/lib/types";

const BOOT = `import numpy as np

def inclusion_fraction(n, reps=2000, seed=0):
    idx = np.random.default_rng(seed).integers(0, n, size=(reps, n))
    return float(np.mean([len(np.unique(row)) / n for row in idx]))

def aggregation_gap(preds, y):
    single = np.mean((preds - y) ** 2)
    bagged = (preds.mean() - y) ** 2
    return float(single), float(bagged), float(preds.var())`;

const BAG = `import numpy as np

def fit_tree(x, y, depth):
    if depth == 0 or np.all(x == x[0]):
        return float(y.mean())
    ts = np.unique(x)[:-1]
    sse = [((y[x <= t] - y[x <= t].mean()) ** 2).sum() + ((y[x > t] - y[x > t].mean()) ** 2).sum() for t in ts]
    t = ts[int(np.argmin(sse))]
    return (float(t), fit_tree(x[x <= t], y[x <= t], depth - 1), fit_tree(x[x > t], y[x > t], depth - 1))

def predict(tree, v):
    while isinstance(tree, tuple):
        tree = tree[1] if v <= tree[0] else tree[2]
    return tree

def bagged(x, y, xs, depth, B, seed=0):
    rng = np.random.default_rng(seed); out = np.zeros(len(xs))
    for _ in range(B):
        i = rng.integers(0, len(x), len(x))
        tree = fit_tree(x[i], y[i], depth)
        out += np.array([predict(tree, v) for v in xs])
    return out / B`;

export const lesson: LessonContent = {
  id: "l2.4.2",
  minutes: 50,
  links: {
    requires: ["l2.4.1", "l1.4.4", "m9.5.2"],
    revisits: ["m9.2.4", "m7.4.2"],
    foreshadows: ["l2.4.3"],
  },

  puzzle: (
    <>
      <p>
        You have one training set. Resampling it with replacement and fitting a tree to each resample gives trees that
        never saw any new data, yet their average predicts better than a tree fitted to the full original set. Where does
        the improvement come from, if not from information? And why does the same trick do almost nothing for linear
        regression?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A deep tree&apos;s prediction depends heavily on accidents of the sample, which split was chosen at the top and
        which few points ended up in each leaf. Bootstrap resamples mimic drawing fresh samples, so the trees fitted to them
        show how much those accidents move the prediction. Averaging cancels that movement. It removes variance, never
        bias, so it helps exactly the learners whose error is mostly variance.
      </p>
      <BagAverageViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="what a bootstrap sample contains">
        <p>
          In a bootstrap sample of size n drawn with replacement from n points, each point is included with probability{" "}
          <M>{"1 - (1 - 1/n)^n"}</M>, which tends to <M>{"1 - 1/e \\approx 0.632"}</M> as n → ∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          A given point is missed by one draw with probability <M>{"1 - 1/n"}</M>, and the n draws are independent, so it is
          missed by all of them with probability <M>{"(1 - 1/n)^n"}</M>. Since <M>{"n\\log(1 - 1/n) = -1 - \\tfrac{1}{2n} - \\dots \\to -1"}</M>,
          this tends to <M>{"e^{-1}"}</M>. The roughly 37% left out of each resample are the out-of-bag points.
        </p>
      </Proof>

      <Theorem title="averaging removes exactly the variance">
        <p>
          Fix an input x and a target value y. Let <M>{"\\hat f"}</M> be the prediction at x of a learner fitted to a random
          resample, and <M>{"\\bar f = \\mathbb E\\hat f"}</M> the bagged prediction in the limit of many resamples. Then
        </p>
        <MD>{"\\mathbb E(\\hat f - y)^2 = (\\bar f - y)^2 + \\mathrm{Var}(\\hat f),"}</MD>
        <p>so the bagged predictor&apos;s squared error is never larger than a single resampled learner&apos;s on average.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\hat f - y = (\\hat f - \\bar f) + (\\bar f - y)"}</M> and expand the square. The cross term has
          expectation <M>{"2(\\bar f - y)\\mathbb E(\\hat f - \\bar f) = 0"}</M>, leaving the two stated terms. The variance is
          non-negative, which gives the inequality; equality holds only if <M>{"\\hat f"}</M> does not vary. The same holds
          with y random and independent of the resampling, by averaging over y.
        </p>
        <Code>{BOOT}</Code>
      </Proof>
      <Remark title="stable and unstable learners">
        <p>
          The gain is <M>{"\\mathrm{Var}(\\hat f)"}</M>, the instability of the learner under resampling. Deep trees are very
          unstable and gain a lot. Least squares with few features is stable, and its bootstrap average is nearly the fit on
          the full data, so bagging does little. The theorem compares with a tree trained on a resample; a tree trained on
          the full data is usually a little better than that, but the variance term dominates for deep trees, as the example
          shows.
        </p>
      </Remark>

      <Example title="bagged trees on a noisy curve">
        <p>
          Sixty noisy points from sin x. A depth-6 tree on the full data has mean squared error 0.086 against the true curve;
          the average of 50 depth-6 trees on bootstrap resamples has 0.048. The code grows trees recursively by exhaustive
          threshold search, which is clear but slow; production code uses the sorted running sums of the previous lesson.
        </p>
        <Code>{BAG}</Code>
      </Example>
      <Remark title="classification and correlation">
        <p>
          For classification, bagging averages predicted probabilities or takes a majority vote. Voting can make a learner
          that is right less than half the time on some input worse, since the vote then locks in the wrong answer; averaging
          probabilities is usually safer. The bootstrap trees are correlated because they share most of their data, and the
          variance of their average cannot fall below ρσ². Random forests lower ρ by restricting each split to a random
          subset of features.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "incl",
      rung: "check",
      prompt: <p>For n = 10, what is the probability that a given point appears in a bootstrap sample, 1 − (1 − 1/n)ⁿ? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6513, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: <p>Resampled trees predict 2, 4 and 6 at a point whose target is 3. What is the average squared error of the single trees minus the squared error of their average?</p>,
      answer: { kind: "numeric", value: 2.6667, tolerance: 0.001 },
    },
    {
      key: "stable",
      rung: "apply",
      prompt: <p>For which learner does bagging typically improve test error the most?</p>,
      answer: {
        kind: "choice",
        options: ["A deep, unpruned decision tree", "Ordinary least squares with three features", "A depth-1 stump on a strongly nonlinear target", "A constant predictor equal to the training mean"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def inclusion_fraction(n, reps=2000, seed=0):
    idx = np.random.default_rng(seed).integers(0, n, size=(reps, n))
    return float(np.mean([len(np.unique(row)) / n for row in idx]))

def aggregation_gap(preds, y):
    single = np.mean((preds - y) ** 2)
    bagged = (preds.mean() - y) ** 2
    return float(single), float(bagged), float(preds.var())

print(round(inclusion_fraction(100), 3), round(1 - (1 - 1 / 100) ** 100, 3), round(1 - np.exp(-1), 3))
s, b, v = aggregation_gap(np.array([1.0, 2.0, 4.0, 5.0]), 2.0)
print(s, b, v, s - b == v)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.635 0.634 0.632\n3.5 1.0 2.5 True", "0.5 0.634 0.632\n3.5 1.0 2.5 True", "0.635 0.634 0.632\n3.5 1.0 1.25 False", "0.635 0.634 0.632\n2.5 1.0 1.5 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_tree(x, y, depth):
    if depth == 0 or np.all(x == x[0]):
        return float(y.mean())
    ts = np.unique(x)[:-1]
    sse = [((y[x <= t] - y[x <= t].mean()) ** 2).sum() + ((y[x > t] - y[x > t].mean()) ** 2).sum() for t in ts]
    t = ts[int(np.argmin(sse))]
    return (float(t), fit_tree(x[x <= t], y[x <= t], depth - 1), fit_tree(x[x > t], y[x > t], depth - 1))

def predict(tree, v):
    while isinstance(tree, tuple):
        tree = tree[1] if v <= tree[0] else tree[2]
    return tree

def bagged(x, y, xs, depth, B, seed=0):
    rng = np.random.default_rng(seed); out = np.zeros(len(xs))
    for _ in range(B):
        i = rng.integers(0, len(x), len(x))
        tree = fit_tree(x[i], y[i], depth)
        out += np.array([predict(tree, v) for v in xs])
    return out / B

rng = np.random.default_rng(1); x = np.sort(rng.uniform(0, 6, 60)); y = np.sin(x) + 0.4 * rng.normal(size=60)
xs = np.linspace(0.1, 5.9, 200); single = fit_tree(x, y, 6)
mse1 = np.mean((np.array([predict(single, v) for v in xs]) - np.sin(xs)) ** 2)
mseB = np.mean((bagged(x, y, xs, 6, 50) - np.sin(xs)) ** 2)
print(round(float(mse1), 3), round(float(mseB), 3), predict((1.0, (0.5, 3.0, 4.0), 7.0), 0.7))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.086 0.048 4.0", "0.048 0.086 4.0", "0.086 0.048 3.0", "0.086 0.086 4.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inclusion_fraction(n, reps=2000, seed=0)</C>, the average fraction of distinct points in simulated
          bootstrap samples, and <C>aggregation_gap(preds, y)</C>, returning the mean squared error of the individual
          predictions, the squared error of their mean and their variance, as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inclusion_fraction(n, reps=2000, seed=0):
    return 0.0

def aggregation_gap(preds, y):
    return 0.0, 0.0, 0.0
`,
        solution: BOOT,
        tests: [
          { name: "incl", code: `assert abs(inclusion_fraction(50) - (1 - (1 - 1 / 50) ** 50)) < 0.01 and inclusion_fraction(1) == 1.0` },
          { name: "gap", code: `s, b, v = aggregation_gap(np.array([2.0, 4.0, 6.0]), 3.0)
assert abs(s - 11 / 3) < 1e-12 and abs(b - 1.0) < 1e-12 and abs(v - 8 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_tree(x, y, depth)</C> for one feature, returning a leaf mean or a tuple (threshold, left, right) chosen
          by exhaustive SSE search over distinct values except the largest; <C>predict(tree, v)</C>; and{" "}
          <C>bagged(x, y, xs, depth, B, seed=0)</C>, the average prediction at xs of B trees fitted to bootstrap resamples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_tree(x, y, depth):
    return float(y.mean())

def predict(tree, v):
    return tree

def bagged(x, y, xs, depth, B, seed=0):
    return np.zeros(len(xs))
`,
        solution: BAG,
        tests: [
          { name: "tree", code: `x = np.array([1.0, 2.0, 3.0, 4.0]); y = np.array([0.0, 0.0, 5.0, 5.0])
t = fit_tree(x, y, 1)
assert t == (2.0, 0.0, 5.0) and predict(t, 2.5) == 5.0 and fit_tree(x, y, 0) == 2.5` },
          { name: "bag", code: `x = np.arange(10.0); y = 2 * x
p = bagged(x, y, np.array([0.0, 9.0]), 5, 20)
assert p.shape == (2,) and p[0] < p[1] and np.all(bagged(x, np.full(10, 3.0), np.array([4.0]), 3, 5) == 3.0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a random prediction f̂ with mean f̄ and a fixed target y, prove that E(f̂ − y)² = (f̄ − y)² + Var(f̂), and conclude that the averaged prediction f̄ has squared error no larger than E(f̂ − y)².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes f̂ − y = (f̂ − f̄) + (f̄ − y) and expands the square.",
          "Shows the cross term has expectation zero because E(f̂ − f̄) = 0.",
          "Identifies E(f̂ − f̄)² as Var(f̂) ≥ 0 and concludes (f̄ − y)² ≤ E(f̂ − y)².",
        ],
      },
    },
    {
      key: "oob",
      rung: "stretch",
      prompt: <p>With 200 bootstrap trees, about how many of them leave out a given training point, using the limiting out-of-bag probability e⁻¹? Give one decimal place.</p>,
      answer: { kind: "numeric", value: 73.6, tolerance: 0.1 },
    },
  ],

  teachBack:
    "Explain to a friend what fraction of points a bootstrap sample contains, why averaging resampled predictors removes exactly their variance, which learners benefit from bagging and which do not, and why bagged trees stay correlated.",

  glimpse: (
    <>
      <p>
        Bagging fits many strong, high-variance learners independently and averages them. Boosting does the opposite: it
        fits weak, high-bias learners one after another, each focusing on the mistakes of those before it.
      </p>
    </>
  ),
};
