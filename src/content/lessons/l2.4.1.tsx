import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ImpurityViz } from "@/components/viz/ImpurityViz";
import type { LessonContent } from "@/lib/types";

const SPLIT = `import numpy as np

def best_split_brute(x, y):
    best = (np.inf, None)
    for t in np.unique(x)[:-1]:
        L, R = y[x <= t], y[x > t]
        sse = ((L - L.mean()) ** 2).sum() + ((R - R.mean()) ** 2).sum()
        best = min(best, (float(sse), float(t)))
    return best

def best_split_sorted(x, y):
    o = np.argsort(x); xs, ys = x[o], y[o]
    n = len(y); c1, c2 = np.cumsum(ys), np.cumsum(ys ** 2)
    k = np.arange(1, n)
    left = c2[:-1] - c1[:-1] ** 2 / k
    right = (c2[-1] - c2[:-1]) - (c1[-1] - c1[:-1]) ** 2 / (n - k)
    sse = np.where(xs[:-1] < xs[1:], left + right, np.inf)
    i = int(np.argmin(sse))
    return float(sse[i]), float(xs[i])`;

const IMP = `import numpy as np

def gini(counts):
    p = np.asarray(counts, dtype=float) / np.sum(counts)
    return float(1 - (p ** 2).sum())

def entropy(counts):
    p = np.asarray(counts, dtype=float) / np.sum(counts)
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

def split_gain(parent, left, right, impurity):
    n, nl, nr = sum(parent), sum(left), sum(right)
    return impurity(parent) - nl / n * impurity(left) - nr / n * impurity(right)`;

export const lesson: LessonContent = {
  id: "l2.4.1",
  minutes: 55,
  links: {
    requires: ["l1.4.3", "l2.1.4"],
    revisits: ["m7.4.2", "m9.2.4"],
    foreshadows: ["l2.4.2", "l2.4.4"],
  },

  puzzle: (
    <>
      <p>
        A tree library grows a deep tree on a million rows with fifty features in seconds, even though each split tries
        every threshold of every feature. Recomputing the loss for each candidate threshold from scratch would take hours.
        And why do libraries score classification splits with Gini impurity or entropy rather than the error rate, which
        is what you actually care about?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A split replaces one constant prediction with two. For squared error, the improvement depends only on the sizes and
        means of the two sides, which running sums deliver for every threshold in one pass over sorted data. For
        classification, a good split criterion must reward every move towards purer children; impurities that are strictly
        concave in the class proportions do, while the error rate is flat over long stretches and can report no progress
        for a split that is genuinely useful.
      </p>
      <ImpurityViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the gain of a regression split">
        <p>
          Split n targets with mean ȳ into a left group of size <M>{"n_L"}</M> with mean <M>{"\\bar y_L"}</M> and a right
          group of size <M>{"n_R"}</M> with mean <M>{"\\bar y_R"}</M>. The fall in the sum of squared errors, each group
          predicted by its mean, is
        </p>
        <MD>{"\\mathrm{SSE} - \\mathrm{SSE}_L - \\mathrm{SSE}_R = \\frac{n_Ln_R}{n}(\\bar y_L - \\bar y_R)^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          Within each group, <M>{"\\sum (y_i - \\bar y)^2 = \\sum (y_i - \\bar y_g)^2 + n_g(\\bar y_g - \\bar y)^2"}</M>, since
          the cross term sums to zero. Adding over the two groups, the fall is{" "}
          <M>{"n_L(\\bar y_L - \\bar y)^2 + n_R(\\bar y_R - \\bar y)^2"}</M>. Because{" "}
          <M>{"\\bar y = (n_L\\bar y_L + n_R\\bar y_R)/n"}</M>, we have{" "}
          <M>{"\\bar y_L - \\bar y = \\frac{n_R}{n}(\\bar y_L - \\bar y_R)"}</M> and{" "}
          <M>{"\\bar y_R - \\bar y = -\\frac{n_L}{n}(\\bar y_L - \\bar y_R)"}</M>, so the fall is{" "}
          <M>{"\\big(\\frac{n_Ln_R^2}{n^2} + \\frac{n_Rn_L^2}{n^2}\\big)(\\bar y_L - \\bar y_R)^2 = \\frac{n_Ln_R}{n}(\\bar y_L - \\bar y_R)^2"}</M>.
        </p>
      </Proof>
      <Example title="every threshold in one pass">
        <p>
          The SSE of a group is <M>{"\\sum y^2 - (\\sum y)^2/k"}</M>, so after sorting by the feature, cumulative sums of y and
          y² give the SSE on both sides of every cut in O(n), and the whole search costs O(n log n) per feature for the sort.
          Cuts between equal feature values are not real thresholds and are skipped. The sorted version matches brute force
          on 200 random points.
        </p>
        <Code>{SPLIT}</Code>
      </Example>

      <Definition title="classification impurities">
        <p>For a node with class proportions <M>{"p_1, \\dots, p_K"}</M>:</p>
        <ul>
          <li>
            Gini <M>{"G = 1 - \\sum_k p_k^2"}</M>, the probability that two labels drawn independently from the node differ;
          </li>
          <li>entropy <M>{"H = -\\sum_k p_k\\log_2 p_k"}</M>, whose decrease is the information gain;</li>
          <li>misclassification error <M>{"1 - \\max_k p_k"}</M>.</li>
        </ul>
        <p>The gain of a split is the parent impurity minus the size-weighted impurities of the children.</p>
      </Definition>

      <Theorem title="concave impurities never lose">
        <p>
          If the impurity is a concave function of the proportion vector, every split has gain ≥ 0. If it is strictly concave,
          the gain is 0 only when both children have the parent&apos;s proportions.
        </p>
      </Theorem>
      <Proof>
        <p>
          The parent&apos;s proportions are the weighted average of the children&apos;s:{" "}
          <M>{"p = \\frac{n_L}{n}p_L + \\frac{n_R}{n}p_R"}</M>, since counts add. By concavity (Jensen with two points),{" "}
          <M>{"I(p) \\geq \\frac{n_L}{n}I(p_L) + \\frac{n_R}{n}I(p_R)"}</M>, which says the gain is non-negative. Strict
          concavity makes the inequality strict unless <M>{"p_L = p_R"}</M>, in which case both equal p. Gini and entropy are
          strictly concave; misclassification error is concave but piecewise linear.
        </p>
        <Code>{IMP}</Code>
      </Proof>
      <Remark title="why not optimise the error rate directly">
        <p>
          Splitting [8, 2] into [5, 0] and [3, 2] produces a pure child, a clear step forward, yet both sides still predict
          the majority class, so the error rate is unchanged and its gain is exactly 0; Gini gains 0.08. Greedy growth needs a
          criterion that sees such intermediate progress, and the strictly concave impurities provide it.
        </p>
      </Remark>

      <Remark title="pruning">
        <p>
          A fully grown tree overfits. Cost-complexity pruning minimises <M>{"R(T) + \\alpha|T|"}</M>, where R is the
          training error and |T| the number of leaves. For an internal node t with subtree <M>{"T_t"}</M>, collapsing it
          becomes worthwhile once{" "}
          <M>{"\\alpha \\geq g(t) = \\frac{R(t) - R(T_t)}{|T_t| - 1}"}</M>; repeatedly collapsing the node with the smallest
          g gives a nested sequence of trees, and cross-validation picks α. Pruning back a deep tree beats stopping early,
          because greedy growth cannot see splits that only pay off one level later, as in XOR.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gini",
      rung: "check",
      prompt: <p>What is the Gini impurity of a node with class counts 3 and 1?</p>,
      answer: { kind: "numeric", value: 0.375, tolerance: 0.0001 },
    },
    {
      key: "red",
      rung: "check",
      prompt: <p>A split puts 4 points with mean 1.05 on the left and 4 with mean 3.05 on the right. By how much does the sum of squared errors fall?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "xor",
      rung: "apply",
      prompt: <p>Labels follow XOR of two binary features, with all four combinations equally common. What does greedy splitting see at the root?</p>,
      answer: {
        kind: "choice",
        options: [
          "Zero gain for either feature, although a depth-2 tree classifies perfectly",
          "A large gain for the first feature only",
          "Equal positive gains for both features",
          "A negative gain, so the root cannot be split",
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

def best_split_brute(x, y):
    best = (np.inf, None)
    for t in np.unique(x)[:-1]:
        L, R = y[x <= t], y[x > t]
        sse = ((L - L.mean()) ** 2).sum() + ((R - R.mean()) ** 2).sum()
        best = min(best, (float(sse), float(t)))
    return best

def best_split_sorted(x, y):
    o = np.argsort(x); xs, ys = x[o], y[o]
    n = len(y); c1, c2 = np.cumsum(ys), np.cumsum(ys ** 2)
    k = np.arange(1, n)
    left = c2[:-1] - c1[:-1] ** 2 / k
    right = (c2[-1] - c2[:-1]) - (c1[-1] - c1[:-1]) ** 2 / (n - k)
    sse = np.where(xs[:-1] < xs[1:], left + right, np.inf)
    i = int(np.argmin(sse))
    return float(sse[i]), float(xs[i])

x = np.arange(1.0, 9.0); y = np.array([1.0, 1.2, 0.9, 1.1, 3.0, 3.2, 2.9, 3.1])
print(np.round(best_split_brute(x, y), 3), np.round(best_split_sorted(x, y), 3))
rng = np.random.default_rng(0); xr, yr = rng.normal(size=200), rng.normal(size=200)
print(np.allclose(best_split_brute(xr, yr), best_split_sorted(xr, yr)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.1 4. ] [0.1 4. ]\nTrue", "[0.1 4. ] [0.1 5. ]\nTrue", "[8.1 4. ] [0.1 4. ]\nTrue", "[0.1 4. ] [0.1 4. ]\nFalse"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gini(counts):
    p = np.asarray(counts, dtype=float) / np.sum(counts)
    return float(1 - (p ** 2).sum())

def entropy(counts):
    p = np.asarray(counts, dtype=float) / np.sum(counts)
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

def split_gain(parent, left, right, impurity):
    n, nl, nr = sum(parent), sum(left), sum(right)
    return impurity(parent) - nl / n * impurity(left) - nr / n * impurity(right)

err = lambda c: 1 - max(c) / sum(c)
print(gini([5, 5]), entropy([5, 5]), round(split_gain([5, 5], [4, 1], [1, 4], gini), 4))
print(round(split_gain([8, 2], [5, 0], [3, 2], err), 4) + 0.0, round(split_gain([8, 2], [5, 0], [3, 2], gini), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 1.0 0.18\n0.0 0.08", "0.5 1.0 0.18\n0.08 0.08", "0.25 1.0 0.18\n0.0 0.08", "0.5 0.693 0.18\n0.0 0.08"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_split_brute(x, y)</C>, returning (smallest SSE, threshold) over thresholds at each distinct value of
          x except the largest, with points x ≤ t going left, and <C>best_split_sorted(x, y)</C>, which returns the same
          using sorting and cumulative sums.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def best_split_brute(x, y):
    return (0.0, 0.0)

def best_split_sorted(x, y):
    return (0.0, 0.0)
`,
        solution: SPLIT,
        tests: [
          { name: "small", code: `x = np.array([3.0, 1.0, 2.0, 4.0]); y = np.array([5.0, 0.0, 1.0, 6.0])
assert np.allclose(best_split_brute(x, y), (1.0, 2.0)) and np.allclose(best_split_sorted(x, y), (1.0, 2.0))` },
          { name: "ties", code: `x = np.array([1.0, 1.0, 2.0, 2.0, 3.0]); y = np.array([0.0, 0.0, 1.0, 1.0, 9.0])
assert np.allclose(best_split_sorted(x, y), best_split_brute(x, y)) and best_split_sorted(x, y)[1] == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gini(counts)</C> and <C>entropy(counts)</C> (base 2, skipping zero proportions), each returning a float,
          and <C>split_gain(parent, left, right, impurity)</C>, the parent impurity minus the size-weighted child impurities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gini(counts):
    return 0.0

def entropy(counts):
    return 0.0

def split_gain(parent, left, right, impurity):
    return 0.0
`,
        solution: IMP,
        tests: [
          { name: "imp", code: `assert gini([3, 1]) == 0.375 and abs(entropy([1, 1, 1, 1]) - 2.0) < 1e-12 and entropy([4, 0]) == 0.0` },
          { name: "gain", code: `assert abs(split_gain([5, 5], [5, 0], [0, 5], entropy) - 1.0) < 1e-12 and abs(split_gain([4, 4], [2, 2], [2, 2], gini)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that splitting n targets into groups of sizes n_L and n_R with means ȳ_L and ȳ_R reduces the sum of squared errors by (n_L n_R/n)(ȳ_L − ȳ_R)².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Decomposes each group's squared deviations from ȳ into deviations from the group mean plus n_g(ȳ_g − ȳ)², so the fall is n_L(ȳ_L − ȳ)² + n_R(ȳ_R − ȳ)².",
          "Uses ȳ = (n_Lȳ_L + n_Rȳ_R)/n to write ȳ_L − ȳ = (n_R/n)(ȳ_L − ȳ_R) and ȳ_R − ȳ = −(n_L/n)(ȳ_L − ȳ_R).",
          "Substitutes and simplifies n_Ln_R²/n² + n_Rn_L²/n² = n_Ln_R/n.",
        ],
      },
    },
    {
      key: "prune",
      rung: "stretch",
      prompt: <p>An internal node has error R(t) = 0.30 if collapsed, and its subtree has 3 leaves with total error 0.18. At what α does collapsing it become worthwhile?</p>,
      answer: { kind: "numeric", value: 0.06, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the gain of a regression split depends only on group sizes and means, how sorting and running sums find the best threshold quickly, why Gini and entropy are better split criteria than the error rate, and how cost-complexity pruning works.",

  glimpse: (
    <>
      <p>
        A single deep tree has low bias and high variance: change a few training points and the top split can change,
        reshaping everything below it. The next lesson reduces that variance by averaging trees trained on resampled data.
      </p>
    </>
  ),
};
