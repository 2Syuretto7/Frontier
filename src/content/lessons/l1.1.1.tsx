import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { TaskSorterViz } from "@/components/viz/TaskSorterViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.1.1",
  minutes: 45,
  links: {
    revisits: ["l0.1.1", "l0.2.1", "l0.2.2", "l0.2.3"],
    parallels: ["e1.5.1"],
    foreshadows: ["l6.2.1", "l10.1.4"],
  },

  puzzle: (
    <>
      <p>
        Your email provider says its spam filter &ldquo;learns&rdquo;. You want to check the claim.
      </p>
      <p>
        What exactly would have to be true for the word &ldquo;learns&rdquo; to be justified? Write down three things you
        would need to specify before you could test it: what the filter is trying to do, what it learns from, and how you
        would tell that it has got better.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The three things in the puzzle are the standard definition of machine learning: a <strong>task</strong>, some{" "}
        <strong>experience</strong>, and a <strong>performance</strong> measure. A program learns if its performance at the
        task improves with experience. Saying all three precisely is the first step of every machine learning project, and
        getting them wrong is a common reason projects fail.
      </p>
      <p>
        How Machines Learn introduced three families of task. Sort each task below into its family, and read how its
        experience and performance would be defined.
      </p>
      <TaskSorterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="learning">
        <p>
          Following Tom Mitchell (1997): a program <strong>learns</strong> from experience <M>E</M> with respect to a class
          of tasks <M>T</M> and a performance measure <M>P</M> if its performance at tasks in <M>T</M>, as measured by{" "}
          <M>P</M>, improves with experience <M>E</M>.
        </p>
      </Definition>

      <Definition title="examples, features and labels">
        <p>
          In <strong>supervised learning</strong>, the experience is a dataset of <M>n</M> <strong>examples</strong>{" "}
          <M>{"(x_1, y_1), \\ldots, (x_n, y_n)"}</M>. Each input <M>{"x_i"}</M> is a list of <M>d</M> numbers called{" "}
          <strong>features</strong>, and <M>{"y_i"}</M> is its <strong>label</strong> or <strong>target</strong>. The inputs
          are stacked as the rows of an <M>{"n \\times d"}</M> matrix <M>X</M>:
        </p>
        <MD>{"X = \\begin{pmatrix} x_{11} & \\cdots & x_{1d} \\\\ \\vdots & & \\vdots \\\\ x_{n1} & \\cdots & x_{nd} \\end{pmatrix}, \\qquad y = \\begin{pmatrix} y_1 \\\\ \\vdots \\\\ y_n \\end{pmatrix}."}</MD>
        <p>
          The goal is a function <M>f</M>, the <strong>model</strong>, with <M>{"f(x) \\approx y"}</M> for inputs it has not
          seen. When <M>y</M> is a number the task is <strong>regression</strong>; when it is one of a fixed set of
          categories, <strong>classification</strong>.
        </p>
      </Definition>

      <Definition title="unsupervised learning">
        <p>
          In <strong>unsupervised learning</strong> there are no labels, only inputs. The task is to find structure in them:
          groups (<strong>clustering</strong>), a few directions that capture most of the variation (dimensionality
          reduction), or the distribution the data came from. A third family, <strong>reinforcement learning</strong>, learns
          from rewards gained by acting, as in the bandit lesson of How Machines Learn.
        </p>
      </Definition>

      <Example title="a dataset of flats">
        <table className="table">
          <thead><tr><th>size (m²)</th><th>floor</th><th>age (years)</th><th>price (&#8377; lakh)</th></tr></thead>
          <tbody>
            <tr><td>64</td><td>3</td><td>12</td><td>58</td></tr>
            <tr><td>88</td><td>7</td><td>4</td><td>82</td></tr>
            <tr><td>45</td><td>1</td><td>25</td><td>38</td></tr>
          </tbody>
        </table>
        <p>
          Each row is an example, the first three columns are its features (<M>{"d = 3"}</M>) and the price is its label.
          The task is regression; the performance measure might be the average error in lakh on flats sold next month.
        </p>
      </Example>

      <Remark title="the measure shapes the system">
        <p>
          A learning system becomes good at exactly what <M>P</M> measures, and no more. A spam filter scored only on the spam
          it catches learns to block everything, including your bank&rsquo;s messages. A recommender scored on clicks learns
          to show what gets clicked, which is not always what users value. Choosing <M>P</M> is a design decision with
          consequences, and it is the first thing to examine in any claim that a system has learned.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "label",
      rung: "check",
      prompt: <p>In the flats dataset, what is the label?</p>,
      answer: { kind: "choice", options: ["The price", "The size", "The whole row", "The number of flats"], correct: [0] },
    },
    {
      key: "kind",
      rung: "check",
      prompt: <p>A bank wants to predict whether each loan applicant will repay. What kind of task is this?</p>,
      answer: { kind: "choice", options: ["Classification", "Regression", "Clustering"], correct: [0] },
    },
    {
      key: "matrix",
      rung: "apply",
      prompt: <p>A dataset has 1,200 flats, each described by 8 features. How many numbers are in its feature matrix <M>X</M>?</p>,
      answer: { kind: "numeric", value: 9600 },
    },
    {
      key: "supervised",
      rung: "apply",
      prompt: <p>Select every task that is supervised learning.</p>,
      answer: {
        kind: "choice",
        options: [
          "Predicting exam marks from hours studied, using last year's students",
          "Finding groups of similar songs with no genres given",
          "Detecting tumours in scans that radiologists have marked",
          "Compressing images by finding the directions of greatest variation",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "measure",
      rung: "apply",
      prompt: <p>A spam filter is judged only by the fraction of spam it catches. What will a system that maximises this measure tend to do?</p>,
      answer: {
        kind: "choice",
        options: ["Mark almost every message as spam", "Mark almost nothing as spam", "Become a perfect filter"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`y = [1, 1, 0, 1, 1, 1, 0, 1, 0, 1]
guess = 1 if y.count(1) > y.count(0) else 0
right = sum(1 for label in y if label == guess)
print(right / len(y))`}</Code>
          <p>Task, experience and performance: a model that ignores its input and always gives the commonest label. What accuracy does it score?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.7, tolerance: 1e-09 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`y = [1, 0, 1, 1, 0, 1, 1, 1]
for n in (2, 4, 8):
    p = sum(y[:n]) / n
    guess = 1 if p > 0.5 else 0
    print(n, p, sum(1 for label in y if label == guess) / len(y))`}</Code>
          <p>A majority-vote predictor trained on the first n labels, scored on all eight. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 0.5 0.25\n4 0.75 0.75\n8 0.75 0.75", "2 0.5 0.75\n4 0.75 0.75\n8 0.75 0.75", "2 0.5 0.25\n4 0.75 0.75\n8 0.75 1.0", "2 0.5 0.5\n4 0.75 0.75\n8 0.75 0.75"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>learning_curve(model_fn, X, y, sizes)</C>, which for each n in <C>sizes</C> fits <C>model_fn()</C> on the first n rows and returns the list of accuracies on the last 100 rows. Performance at a task should improve with experience.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def learning_curve(model_fn, X, y, sizes):
    return [0.0 for n in sizes]
`,
        solution: `def learning_curve(model_fn, X, y, sizes):
    Xte, yte = X[-100:], y[-100:]
    return [model_fn().fit(X[:n], y[:n]).score(Xte, yte) for n in sizes]
`,
        tests: [
          { name: "improves", code: `import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
X = rng.normal(size=(600, 5)); y = (X @ np.arange(1, 6) + rng.normal(size=600) > 0).astype(int)
accs = learning_curve(lambda: LogisticRegression(), X, y, [10, 50, 400])
assert len(accs) == 3 and accs[-1] > 0.85 and accs[-1] >= accs[0], 'Fit on the first n rows and score on the last 100.'` },
          { name: "rows", code: `class M:
    def fit(self, X, y):
        self.n = len(X)
        return self
    def score(self, X, y):
        return self.n + len(X) / 1000 + X[0] / 1e6
accs = learning_curve(M, list(range(500)), list(range(500)), [5, 50, 300])
assert all(abs(a - b) < 1e-12 for a, b in zip(accs, [5.1004, 50.1004, 300.1004])), 'Fit on the first n rows; score on rows 400 … 499.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            One learning curve from one split is noisy. Write <C>learning_curve_repeat(model_fn, X, y, sizes, repeats, seed)</C> for lists X and y. The test set is the last 20% of rows, and the first <C>int(0.8 * len(X))</C> rows form the pool. With one <C>random.Random(seed)</C>, for each size in order and each repeat in order, pick that many pool rows with <C>rng.sample(range(pool_size), size)</C>, fit a fresh <C>model_fn()</C> on them and score it on the test set. Return (means, spreads), two lists with one entry per size, using <C>statistics.mean</C> and <C>statistics.pstdev</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random, statistics

def learning_curve_repeat(model_fn, X, y, sizes, repeats, seed):
    return [0.0] * len(sizes), [0.0] * len(sizes)
`,
        solution: `import random, statistics

def learning_curve_repeat(model_fn, X, y, sizes, repeats, seed):
    rng = random.Random(seed)
    a = int(0.8 * len(X))
    Xte, yte = X[a:], y[a:]
    means, spreads = [], []
    for n in sizes:
        scores = []
        for _ in range(repeats):
            idx = rng.sample(range(a), n)
            m = model_fn().fit([X[i] for i in idx], [y[i] for i in idx])
            scores.append(m.score(Xte, yte))
        means.append(statistics.mean(scores))
        spreads.append(statistics.pstdev(scores))
    return means, spreads
`,
        tests: [
          { name: "sampling", code: `import random, statistics
class M:
    def fit(self, X, y):
        self.s = sum(row[0] for row in X)
        return self
    def score(self, X, y):
        return self.s + len(X) / 1000
X = [[float(i)] for i in range(50)]; y = [0] * 50
m, s = learning_curve_repeat(M, X, y, [3, 5], 2, 7)
rng = random.Random(7)
want = [[sum(rng.sample(range(40), n)) + 0.01 for _ in range(2)] for n in [3, 5]]
assert all(abs(a - statistics.mean(w)) < 1e-9 for a, w in zip(m, want)) and all(abs(a - statistics.pstdev(w)) < 1e-9 for a, w in zip(s, want)), 'One generator, sizes in order, repeats in order; test on the last 10 rows.'` },
          { name: "improves", code: `import numpy as np
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
X = rng.normal(size=(1000, 10)); y = (X @ rng.normal(size=10) + rng.normal(size=1000) > 0).astype(int)
m, s = learning_curve_repeat(LogisticRegression, X.tolist(), y.tolist(), [20, 100, 600], 8, 1)
assert m[0] < m[1] < m[2] and s[0] > s[2], 'More data: higher accuracy and less spread between repeats.'` },
        ],
      },
    },
    {
      key: "tep",
      rung: "prove",
      prompt: (
        <p>
          A hospital wants a system that reads chest X-rays and flags those needing urgent review. Specify the task, the
          experience and the performance measure precisely, and explain one way a badly chosen performance measure could make
          the system harmful.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Task: classify each X-ray as urgent or not urgent (or score its urgency).",
          "Experience: past X-rays labelled by radiologists, ideally checked against later outcomes.",
          "Performance: a measure that weighs missed urgent cases against false alarms, evaluated on X-rays not used for training, ideally from other hospitals.",
          "Explains a failure, such as plain accuracy rewarding a system that never flags anything when urgent cases are rare.",
        ],
      },
    },
    {
      key: "pixels",
      rung: "stretch",
      prompt: (
        <p>
          A dataset holds 50,000 greyscale images of 28 by 28 pixels, each pixel one feature. How many feature values are
          there in total, in millions?
        </p>
      ),
      answer: { kind: "numeric", value: 39.2 },
    },
  ],

  teachBack:
    "Explain to a friend what it means for a program to learn, using task, experience and performance, and the difference between supervised and unsupervised learning.",

  glimpse: (
    <p>
      Next, how to measure performance honestly: training error and test error. Reinforcement learning, the third family,
      has a whole course, and Evaluation and the Science of Deep Learning returns to what happens when a measure becomes a
      target.
    </p>
  ),
};
