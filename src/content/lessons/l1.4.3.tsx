import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { TreeViz } from "@/components/viz/TreeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.4.3",
  minutes: 55,
  links: {
    revisits: ["l0.3.3", "l1.1.3"],
    parallels: ["m4.3.3", "e2.4.1"],
    foreshadows: ["l1.4.4", "l2.4.1", "l2.4.4"],
  },

  puzzle: (
    <>
      <p>
        A bank has ten past loan applicants: six repaid and four did not. One yes-or-no question splits them into a group of
        four who all repaid, and a group of six with two who repaid and four who did not.
      </p>
      <p>
        Another question splits them into two groups of five, each with three who repaid. Which question taught you more?
        Can you put a number on how &ldquo;mixed&rdquo; a group is, so a computer could choose?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The second question is useless: both groups look exactly like the whole. The first question produced one pure group
        and one that is mostly defaulters. A decision tree is built by repeatedly asking whichever question makes the groups
        purest, then asking again inside each group.
      </p>
      <TreeViz />
      <p>
        Each question compares one feature with a threshold, so every region is a rectangle. Grow the tree deep enough and
        every leaf becomes pure: training accuracy reaches 100%, while accuracy on new points falls, because the last few
        splits exist only to wall off individual noisy points.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decision tree">
        <p>
          A <strong>decision tree</strong> is a binary tree. Each internal node holds a test &ldquo;<M>{"x_j \\le t"}</M>&rdquo;
          on one feature <M>j</M> and a threshold <M>t</M>, and sends a point left or right. Each leaf holds a prediction: the
          majority class of the training points that reach it, or for regression their mean.
        </p>
      </Definition>

      <Definition title="Gini impurity">
        <p>
          For a node whose training points have class proportions <M>{"p_1, \\dots, p_K"}</M>, the <strong>Gini
          impurity</strong> is
        </p>
        <MD>{"G = 1 - \\sum_{k=1}^K p_k^2 ."}</MD>
        <p>
          It is 0 for a pure node and largest when the classes are evenly mixed. It is the chance that two points drawn at
          random from the node, with replacement, have different labels. An alternative is the entropy{" "}
          <M>{"H = -\\sum_k p_k \\log_2 p_k"}</M>.
        </p>
      </Definition>

      <Definition title="choosing a split">
        <p>
          A split sends <M>{"n_L"}</M> of a node&rsquo;s <M>n</M> points left and <M>{"n_R"}</M> right. Its cost is the
          weighted impurity of the children,
        </p>
        <MD>{"\\frac{n_L}{n} G_L + \\frac{n_R}{n} G_R ,"}</MD>
        <p>
          and the tree tries every feature and every threshold between consecutive data values, keeping the cheapest. It then
          recurses into each child until a stopping rule fires: a maximum depth, a minimum number of points per leaf, or a
          pure node. This greedy method does not find the best tree overall, which is computationally hard, but it is fast and
          works well.
        </p>
      </Definition>

      <Example title="the loan question">
        <p>
          The parent has six repaid and four defaults, so <M>{"G = 1 - 0.6^2 - 0.4^2 = 0.48"}</M>. The first question gives a
          pure child of four, with <M>{"G = 0"}</M>, and a child of six with proportions <M>{"\\tfrac13, \\tfrac23"}</M>, so{" "}
          <M>{"G = 1 - \\tfrac19 - \\tfrac49 = \\tfrac49"}</M>. The weighted cost is{" "}
          <M>{"\\tfrac{4}{10} \\cdot 0 + \\tfrac{6}{10} \\cdot \\tfrac49 \\approx 0.267"}</M>, a decrease of about 0.213. The
          second question leaves both children at 0.48: no decrease at all.
        </p>
      </Example>

      <Theorem title="depth and leaves">
        <p>
          A binary tree of depth <M>D</M> has at most <M>{"2^D"}</M> leaves.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on <M>D</M>. A tree of depth 0 is a single leaf, and <M>{"2^0 = 1"}</M>. A tree of depth{" "}
          <M>{"D + 1"}</M> is either a leaf or a root with two subtrees of depth at most <M>D</M>, each with at most{" "}
          <M>{"2^D"}</M> leaves, so it has at most <M>{"2 \\cdot 2^D = 2^{D+1}"}</M>.
        </p>
      </Proof>

      <Remark title="strengths and the weakness">
        <p>
          Trees need no rescaling of features, because a threshold test gives the same answer under any increasing change of
          units. They handle mixed numeric and categorical data and can be read as a list of rules. Their weakness is
          instability: a small change in the training data can change the first split, and with it the whole tree. In the
          language of model selection, a deep tree has high variance. The next lesson turns that weakness into a strength.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>With two numeric features, what shape are the regions of a decision tree?</p>,
      answer: { kind: "choice", options: ["Rectangles with sides parallel to the axes", "Circles", "Arbitrary polygons"], correct: [0] },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>If you convert one feature from metres to centimetres and refit, do a decision tree&rsquo;s predictions change?</p>,
      answer: { kind: "choice", options: ["No", "Yes"], correct: [0] },
    },
    {
      key: "gini",
      rung: "apply",
      prompt: <p>A node holds 6 points of one class and 4 of the other. What is its Gini impurity?</p>,
      answer: { kind: "numeric", value: 0.48 },
    },
    {
      key: "weighted",
      rung: "apply",
      prompt: <p>That node is split into a child with 4 and 0, and a child with 2 and 4. What is the weighted Gini impurity of the children? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.4 * 0 + 0.6 * (4 / 9), tolerance: 0.0006 },
    },
    {
      key: "useless",
      rung: "apply",
      prompt: <p>A different split gives two children of 5 points, each with 3 of one class and 2 of the other. By how much does it reduce the Gini impurity?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from sklearn.tree import DecisionTreeClassifier, export_text
X = [[1], [2], [3], [7], [8], [9]]
y = [0, 0, 0, 1, 1, 1]
t = DecisionTreeClassifier().fit(X, y)
print(t.get_depth(), t.tree_.threshold[0])`}</Code>
          <p>A tree learns one split. What are its depth and the threshold it chooses?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 5.0", "1 3.0", "2 5.0", "1 7.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
y = np.array([0, 0, 1, 1, 1, 1])
p = y.mean()
H = -(p * np.log2(p) + (1 - p) * np.log2(1 - p))
print(round(p, 4), round(H, 4), round(1 - p ** 2 - (1 - p) ** 2, 4))`}</Code>
          <p>The class share, entropy and Gini impurity of one node. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.6667 0.9183 0.4444", "0.6667 0.6365 0.4444", "0.6667 0.9183 0.2222", "0.3333 0.9183 0.4444"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>build_tree(X, y, depth)</C>, a recursive classification tree on numpy arrays. A node is a leaf (its majority label, smallest on ties) when depth is 0 or the labels are pure; otherwise split on the feature and midpoint threshold minimising weighted Gini impurity. Return nested dicts <C>{'{"leaf": label}'}</C> or <C>{'{"f": j, "t": t, "l": left, "r": right}'}</C> with x[j] ≤ t going left. Also write <C>predict_one(tree, x)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def build_tree(X, y, depth):
    return {'leaf': int(np.bincount(y).argmax())}

def predict_one(tree, x):
    return tree['leaf']
`,
        solution: `import numpy as np

def gini(y):
    p = np.bincount(y) / len(y)
    return 1 - (p ** 2).sum()

def build_tree(X, y, depth):
    if depth == 0 or len(set(y.tolist())) == 1:
        return {'leaf': int(np.bincount(y).argmax())}
    best = None
    for j in range(X.shape[1]):
        vals = np.unique(X[:, j])
        for t in (vals[:-1] + vals[1:]) / 2:
            m = X[:, j] <= t
            s = (m.sum() * gini(y[m]) + (~m).sum() * gini(y[~m])) / len(y)
            if best is None or s < best[0]:
                best = (s, j, t)
    if best is None:
        return {'leaf': int(np.bincount(y).argmax())}
    _, j, t = best
    m = X[:, j] <= t
    return {'f': j, 't': float(t), 'l': build_tree(X[m], y[m], depth - 1), 'r': build_tree(X[~m], y[~m], depth - 1)}

def predict_one(tree, x):
    while 'leaf' not in tree:
        tree = tree['l'] if x[tree['f']] <= tree['t'] else tree['r']
    return tree['leaf']
`,
        tests: [
          { name: "stump", code: `import numpy as np
X = np.array([[1.0], [2.0], [3.0], [7.0], [8.0], [9.0]]); y = np.array([0, 0, 0, 1, 1, 1])
t = build_tree(X, y, 3)
assert t['f'] == 0 and t['t'] == 5.0 and t['l'] == {'leaf': 0} and t['r'] == {'leaf': 1}, 'Split at the midpoint 5 and stop when pure.'` },
          { name: "xor", code: `import numpy as np
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]] * 5, dtype=float); y = np.array([0, 1, 1, 0] * 5)
t = build_tree(X, y, 2)
assert all(predict_one(t, x) == v for x, v in zip(X, y)), 'Two levels of splits solve XOR.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>regression_stump(x, y)</C>, the best single split of one numeric feature for regression: sort by x, use prefix sums of y and y² so that every split is evaluated in O(1) after sorting (O(n log n) in total), consider thresholds at midpoints between consecutive distinct x values, and minimise the total squared error of predicting each side by its mean. Return (threshold, left mean, right mean, sse), or <C>None</C> if x has a single distinct value.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def regression_stump(x, y):
    return None
`,
        solution: `import numpy as np

def regression_stump(x, y):
    o = np.argsort(x, kind='stable')
    x, y = np.asarray(x, float)[o], np.asarray(y, float)[o]
    n = len(x)
    c1, c2 = np.cumsum(y), np.cumsum(y * y)
    best = None
    for i in range(1, n):
        if x[i] == x[i - 1]:
            continue
        sl, ql = c1[i - 1], c2[i - 1]
        sr, qr = c1[-1] - sl, c2[-1] - ql
        sse = (ql - sl * sl / i) + (qr - sr * sr / (n - i))
        if best is None or sse < best[3] - 1e-12:
            best = ((x[i - 1] + x[i]) / 2, sl / i, sr / (n - i), float(sse))
    return best
`,
        tests: [
          { name: "simple", code: `t, l, r, sse = regression_stump([1, 2, 3, 10, 11], [1.0, 1.0, 1.0, 5.0, 7.0])
assert t == 6.5 and l == 1 and r == 6 and abs(sse - 2) < 1e-9 and regression_stump([3, 3], [1, 2]) is None` },
          { name: "brute", code: `import numpy as np
rng = np.random.default_rng(0)
for _ in range(50):
    x = rng.integers(0, 15, 30).astype(float); y = rng.normal(size=30) + (x > 7)
    vals = np.unique(x)
    best = min(np.sum((y[x <= t] - y[x <= t].mean()) ** 2) + np.sum((y[x > t] - y[x > t].mean()) ** 2) for t in (vals[:-1] + vals[1:]) / 2)
    assert abs(regression_stump(x, y)[3] - best) < 1e-8, 'The smallest squared error over all splits.'` },
          { name: "sklearn", code: `import numpy as np
from sklearn.tree import DecisionTreeRegressor
rng = np.random.default_rng(1)
x = rng.uniform(0, 10, 200); y = np.sin(x) + rng.normal(0, 0.2, 200)
m = DecisionTreeRegressor(max_depth=1).fit(x[:, None], y)
t, l, r, sse = regression_stump(x, y)
assert abs(m.tree_.threshold[0] - t) < 1e-6 and np.allclose(sorted(m.tree_.value[1:, 0, 0]), sorted([l, r])), 'The same split as a depth-1 scikit-learn tree.'` },
          { name: "fast", code: `import numpy as np
rng = np.random.default_rng(2)
x = rng.uniform(size=200000); y = (x > 0.3) + rng.normal(0, 0.1, 200000)
t = regression_stump(x, y)[0]
assert abs(t - 0.3) < 0.01, 'O(n log n) on 200000 rows.'` },
        ],
      },
    },
    {
      key: "pure",
      rung: "prove",
      prompt: (
        <p>
          Prove that if no two training points have the same input but different labels, a decision tree grown without a depth
          limit reaches zero training error. Then explain why a depth limit is usually imposed anyway.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues that any impure node contains two points with different labels and hence different inputs, so they differ in some feature.",
          "Notes a threshold between their values of that feature splits the node into two non-empty children.",
          "Concludes, since each split strictly reduces the number of points per node, that splitting must end with every leaf pure, so every training point is classified correctly.",
          "Explains that the final splits fit noise, isolating single points, so test error rises; a depth limit or minimum leaf size controls this overfitting.",
        ],
      },
    },
    {
      key: "entropy",
      rung: "stretch",
      prompt: <p>What is the entropy, in bits, of a node with 6 points of one class and 4 of the other? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.971, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend how a decision tree chooses its first question, what Gini impurity measures, and why a very deep tree overfits.",

  glimpse: (
    <p>
      Next, random forests, which average hundreds of deliberately varied trees. Statistical Machine Learning derives the CART
      algorithm in full and builds gradient boosting, in which each new tree corrects the mistakes of the ones before; boosted
      trees remain the method to beat on tables of data.
    </p>
  ),
};
