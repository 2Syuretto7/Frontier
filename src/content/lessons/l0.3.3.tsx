import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { TreeSplitViz } from "@/components/viz/TreeSplitViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.3.3",
  minutes: 50,
  links: {
    foreshadows: ["l1.4.3", "l1.4.4", "l2.4.1"],
  },

  puzzle: (
    <>
      <p>
        In the game Twenty Questions, one player thinks of an object and the other may ask up to twenty yes-or-no questions
        to find it.
      </p>
      <p>
        Why is &ldquo;Is it alive?&rdquo; a good first question and &ldquo;Is it a giraffe?&rdquo; a bad one? What makes one
        question better than another, and could a computer choose its questions the same way?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;Is it alive?&rdquo; splits the possibilities roughly in half, whatever the answer. &ldquo;Is it a
        giraffe?&rdquo; almost always gets &ldquo;no&rdquo; and leaves you nearly where you started. A good question is one
        whose answer, either way, leaves you much more certain.
      </p>
      <p>
        A <strong>decision tree</strong> classifies by asking questions of exactly this kind about the features: &ldquo;Is
        income below 5?&rdquo; then, depending on the answer, &ldquo;Is debt below 4?&rdquo;. Each answer leads to another
        question or to a final prediction. Below, you choose three thresholds for a tree that predicts whether a customer
        will accept a loan offer.
      </p>
      <TreeSplitViz />
      <p>
        Every question cuts the space with a straight line parallel to an axis, so a tree carves the plane into boxes. With
        well-chosen thresholds this tree makes no mistakes at all. Can you find them?
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decision tree">
        <p>
          A <strong>decision tree</strong> is a sequence of yes-or-no questions arranged as a branching diagram. Each{" "}
          <strong>internal node</strong> asks whether one feature is below a threshold. Each branch leads to another node or
          to a <strong>leaf</strong>, which gives the prediction: the majority class of the training examples that reach it
          (or their mean, for regression).
        </p>
      </Definition>

      <Definition title="impurity">
        <p>
          A leaf is <strong>pure</strong> if all its training examples share one label. A simple measure of how impure a set
          of examples is: the number of examples that disagree with its majority, which is the number of mistakes a leaf there
          would make. Good questions split a set into parts that are purer than the whole.
        </p>
      </Definition>

      <Example title="choosing the first question by hand">
        <p>
          The fifteen customers include six who accepted. A single leaf would predict &ldquo;no&rdquo; and make 6 mistakes.
          Split at income 5: the left side has five customers, four of whom refused, so a leaf there makes 1 mistake. The right
          side has five who accepted and five who refused, and makes 5. Total 6: no better yet. But the right side splits
          perfectly by debt, which is why the second level matters. A good first question is judged by what it makes possible,
          not only by what it fixes at once.
        </p>
      </Example>

      <p>
        A computer builds a tree <em>greedily</em>: at each node it tries every feature and every threshold, picks the one
        that most reduces impurity, and repeats on each side until the leaves are pure or a size limit is reached.
      </p>

      <Remark title="readable, and easily overgrown">
        <p>
          A small tree can be read like a checklist, which is why trees are popular in medicine and finance, where decisions
          must be explained. But a tree allowed to grow until every leaf is pure will carve a tiny box around every training
          point, noise and all. That is overfitting again. Limiting the depth, or averaging many different trees, keeps them
          honest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "leaf",
      rung: "check",
      prompt: <p>A leaf receives 7 training examples labelled yes and 3 labelled no. It predicts its majority label. How many of these 10 examples does it get wrong?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "boxes",
      rung: "check",
      prompt: <p>A tree has three levels of questions, and every node at each level asks a question. How many leaves does it have?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "split",
      rung: "apply",
      prompt: (
        <p>
          A set has 10 positive and 10 negative examples. Question P splits it into (8 positive, 2 negative) and (2 positive, 8
          negative). Question Q splits it into (10 positive, 6 negative) and (0 positive, 4 negative). How many mistakes do the
          leaves make after the better question?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "thresholds",
      rung: "apply",
      prompt: <p>In the visualisation, what is the smallest number of mistakes you can reach?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "axis",
      rung: "apply",
      prompt: <p>Why are the boundaries of a decision tree always horizontal or vertical lines?</p>,
      answer: {
        kind: "choice",
        options: ["Each question compares one feature with a threshold", "Trees are always trained on two features", "The loss function forces it"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tree(age, income):
    if age < 30:
        return "rent" if income < 50 else "buy"
    return "buy" if income > 20 else "rent"
print(tree(25, 60), tree(40, 10), tree(29, 50))`}</Code>
          <p>A hand-built decision tree. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["buy rent buy", "buy rent rent", "rent rent buy", "buy buy buy"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gini(ls):
    n = len(ls)
    return 1 - sum((ls.count(c) / n) ** 2 for c in set(ls))
left, right = ["a", "a", "b"], ["b", "b", "b", "a"]
w = (len(left) * gini(left) + len(right) * gini(right)) / 7
print(round(gini(left), 4), round(gini(right), 4), round(w, 4))`}</Code>
          <p>Gini impurity of the two sides of a split and their weighted average. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.4444 0.375 0.4048", "0.4444 0.375 0.4097", "0.5 0.375 0.4286", "0.4444 0.4375 0.4405"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A decision stump is a tree with one split. Write <C>gini(labels)</C>, the Gini impurity 1 − Σ pₖ², and <C>best_split(xs, ys)</C>, which returns the threshold t from the values of xs minimising the weighted Gini impurity of the two groups x &lt; t and x ≥ t. Skip thresholds that leave a group empty; break ties by the smallest t.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def gini(labels):
    return 0.0

def best_split(xs, ys):
    return xs[0]
`,
        solution: `from collections import Counter

def gini(labels):
    n = len(labels)
    return 1 - sum((c / n) ** 2 for c in Counter(labels).values())

def best_split(xs, ys):
    best, best_t = None, None
    for t in sorted(set(xs)):
        left = [y for x, y in zip(xs, ys) if x < t]
        right = [y for x, y in zip(xs, ys) if x >= t]
        if not left or not right:
            continue
        score = (len(left) * gini(left) + len(right) * gini(right)) / len(ys)
        if best is None or score < best:
            best, best_t = score, t
    return best_t
`,
        tests: [
          { name: "gini", code: `assert gini(['a', 'a']) == 0 and abs(gini(['a', 'b']) - 0.5) < 1e-9 and abs(gini(['a', 'b', 'c']) - 2 / 3) < 1e-9, 'A pure group has impurity 0.'` },
          { name: "split", code: `assert best_split([1, 2, 3, 4, 5, 6], ['n', 'n', 'n', 'y', 'y', 'y']) == 4, 'x < 4 and x ≥ 4 separate the labels perfectly.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Grow a whole tree. Write <C>build_tree(X, y, max_depth)</C> for rows of numbers X and labels y. A leaf is a label (the majority, the smallest label on ties); an internal node is a tuple (feature, threshold, left, right) where rows with x[feature] ≤ threshold go left. Make a leaf when the labels are pure, the depth limit is reached, or no split lowers the weighted Gini impurity; otherwise use the split with the lowest weighted Gini, trying thresholds at midpoints between consecutive distinct values (lowest feature, then lowest threshold, on ties). Then write <C>predict(tree, x)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def build_tree(X, y, max_depth):
    return y[0]

def predict(tree, x):
    return tree
`,
        solution: `def _gini(ls):
    n = len(ls)
    return 1 - sum((ls.count(c) / n) ** 2 for c in set(ls))

def _majority(y):
    return min(set(y), key=lambda c: (-y.count(c), c))

def build_tree(X, y, max_depth):
    if len(set(y)) == 1 or max_depth == 0:
        return _majority(y)
    best, here = None, _gini(y)
    for f in range(len(X[0])):
        vals = sorted(set(r[f] for r in X))
        for a, b in zip(vals, vals[1:]):
            t = (a + b) / 2
            L = [lab for r, lab in zip(X, y) if r[f] <= t]
            Rr = [lab for r, lab in zip(X, y) if r[f] > t]
            g = (len(L) * _gini(L) + len(Rr) * _gini(Rr)) / len(y)
            if g < here - 1e-12 and (best is None or g < best[0] - 1e-12):
                best = (g, f, t)
    if best is None:
        return _majority(y)
    _, f, t = best
    li = [i for i, r in enumerate(X) if r[f] <= t]
    ri = [i for i, r in enumerate(X) if r[f] > t]
    return (f, t, build_tree([X[i] for i in li], [y[i] for i in li], max_depth - 1), build_tree([X[i] for i in ri], [y[i] for i in ri], max_depth - 1))

def predict(tree, x):
    while isinstance(tree, tuple):
        f, t, L, Rr = tree
        tree = L if x[f] <= t else Rr
    return tree
`,
        tests: [
          { name: "stump", code: `X = [[1], [2], [3], [10], [11]]
y = ['a', 'a', 'a', 'b', 'b']
t = build_tree(X, y, 3)
assert t == (0, 6.5, 'a', 'b') and predict(t, [5]) == 'a' and predict(t, [7]) == 'b', 'One split at the midpoint 6.5 separates them.'` },
          { name: "depth zero", code: `assert build_tree([[0], [1], [2]], ['b', 'a', 'b'], 0) == 'b' and build_tree([[0], [1]], ['b', 'a'], 0) == 'a', 'Majority, smallest label on ties.'` },
          { name: "xor", code: `X = [[0, 0], [0, 1], [1, 0], [1, 1]] * 3
y = [0, 1, 1, 0] * 3
t = build_tree(X, y, 2)
assert t == 0, 'Balanced XOR: no single split lowers the impurity, so the greedy tree stops at a leaf (0 wins the tie).'
X2 = [[0, 0], [0, 1], [1, 0], [1, 1], [1, 1]]
y2 = [0, 1, 1, 0, 0]
t2 = build_tree(X2, y2, 2)
assert all(predict(t2, x) == lab for x, lab in zip(X2, y2)), 'A slight imbalance lets the greedy tree find XOR in two levels.'` },
          { name: "fit", code: `import random
random.seed(3)
X = [[random.uniform(0, 10), random.uniform(0, 10)] for _ in range(200)]
y = [int(a > 4) + int(b > 6) for a, b in X]
t = build_tree(X, y, 4)
acc = sum(predict(t, x) == lab for x, lab in zip(X, y)) / len(y)
assert acc == 1.0, f'Axis-aligned regions are learned exactly; training accuracy {acc}.'` },
        ],
      },
    },
    {
      key: "overgrown",
      rung: "prove",
      prompt: (
        <p>
          Explain why a decision tree grown until every leaf is pure will always have zero training error, and why that does
          not mean it will do well on new data.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that the tree can keep splitting until each leaf contains examples of only one label, possibly one example each, as long as no two identical inputs have different labels.",
          "Concludes that every training example is then classified correctly: zero training error.",
          "Explains that the tiny boxes around individual points capture noise and accidents of the sample, so predictions on new points near them are unreliable: overfitting.",
        ],
      },
    },
    {
      key: "questions",
      rung: "stretch",
      prompt: (
        <p>
          In Twenty Questions, if every question splits the remaining possibilities exactly in half, how many objects can be
          told apart with 20 questions? Give the answer in millions, to one decimal place.
        </p>
      ),
      answer: { kind: "numeric", value: 1.0, tolerance: 0.05 },
    },
  ],

  teachBack:
    "Explain to a friend how a decision tree classifies by asking a series of questions, what makes a good question, and why a tree should not be allowed to grow without limit.",

  glimpse: (
    <p>
      Next, the building block of every neural network: a single artificial neuron. In Introduction to Machine Learning you
      will grow trees automatically and combine hundreds of them into a random forest, and in Statistical Machine Learning
      you will meet boosting, which builds trees one after another, each correcting the last.
    </p>
  ),
};
