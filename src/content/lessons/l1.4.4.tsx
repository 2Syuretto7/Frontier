import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ForestViz } from "@/components/viz/ForestViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.4.4",
  minutes: 50,
  links: {
    requires: ["l1.4.3"],
    revisits: ["m4.6.3"],
    parallels: ["m4.1.2"],
    foreshadows: ["l1.5.1", "l2.4.2", "l2.4.3"],
  },

  puzzle: (
    <>
      <p>
        Twenty-five students each answer a true-or-false question independently, and each is right 60% of the time. You go
        with the majority.
      </p>
      <p>
        Is the majority right more or less often than a single student? What if the students had all copied from the same
        friend?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the students are independent, the majority is right about 85% of the time, far better than any one of them. If
        they all copied the same friend, the majority is exactly as good as the friend. Averaging helps only to the extent
        that the voters make <em>different</em> mistakes.
      </p>
      <p>
        A deep decision tree is a nervous voter: low bias but high variance. A <strong>random forest</strong> grows many such
        trees and deliberately makes them different, by giving each a different resampled dataset and letting each split
        consider only a random subset of features.
      </p>
      <ForestViz />
      <p>
        One tree is blocky and wrong in places. As trees are added, their individual mistakes disagree and cancel, and the
        averaged vote traces the true shape. Adding trees never makes the forest overfit more; the test accuracy simply
        levels off.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="bootstrap and bagging">
        <p>
          A <strong>bootstrap sample</strong> of <M>n</M> training points is <M>n</M> draws from them with replacement, so
          some points appear several times and some not at all. <strong>Bagging</strong>, short for bootstrap aggregating,
          fits one model to each of <M>B</M> bootstrap samples and averages their predictions, or takes a majority vote.
        </p>
      </Definition>

      <Definition title="random forest">
        <p>
          A <strong>random forest</strong> is bagging of deep decision trees, with one more source of randomness: at each
          split, only a random subset of <M>m</M> of the <M>d</M> features is considered. A common default for classification
          is <M>{"m \\approx \\sqrt d"}</M>.
        </p>
      </Definition>

      <Theorem title="variance of an average of correlated predictors">
        <p>
          Let <M>{"Z_1, \\dots, Z_B"}</M> each have variance <M>{"\\sigma^2"}</M>, with correlation <M>{"\\rho"}</M> between
          every pair. Then
        </p>
        <MD>{"\\operatorname{Var}\\Big(\\frac1B \\sum_{b=1}^B Z_b\\Big) = \\rho\\,\\sigma^2 + \\frac{1 - \\rho}{B}\\,\\sigma^2 ."}</MD>
      </Theorem>
      <Proof>
        <p>
          The variance of a sum is the sum of all covariances. There are <M>B</M> diagonal terms equal to{" "}
          <M>{"\\sigma^2"}</M> and <M>{"B(B - 1)"}</M> off-diagonal terms equal to <M>{"\\rho\\sigma^2"}</M>, so
        </p>
        <MD>{"\\operatorname{Var}\\Big(\\sum_b Z_b\\Big) = B\\sigma^2 + B(B - 1)\\rho\\sigma^2 ."}</MD>
        <p>
          Dividing by <M>{"B^2"}</M> gives <M>{"\\sigma^2/B + (1 - 1/B)\\rho\\sigma^2"}</M>, which rearranges to the claim.
        </p>
      </Proof>
      <p>
        As <M>B</M> grows, the second term vanishes but the first, <M>{"\\rho\\sigma^2"}</M>, remains. More trees cannot remove
        the variance the trees share. That is exactly why a random forest restricts the features at each split: it lowers{" "}
        <M>{"\\rho"}</M>, at the cost of slightly worse individual trees.
      </p>

      <Example title="out-of-bag points">
        <p>
          A given point is missed by one draw with probability <M>{"1 - 1/n"}</M>, so it is absent from a bootstrap sample
          with probability <M>{"(1 - 1/n)^n"}</M>, which tends to <M>{"1/e \\approx 0.368"}</M>. Each tree therefore never
          sees about a third of the data. Predicting each point using only the trees that did not see it gives the{" "}
          <strong>out-of-bag error</strong>, an estimate of test error that costs no separate validation set.
        </p>
      </Example>

      <Remark title="where forests stand">
        <p>
          Random forests need little tuning, rarely overfit badly, and work out of the box on tabular data. Boosted trees
          usually beat them when tuned well. The principle behind them, averaging diverse models, reappears in ensembles of
          neural networks and in averaging the weights of models along a training run.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "random",
      rung: "check",
      prompt: <p>Which sources of randomness does a random forest use? Select all that apply.</p>,
      answer: { kind: "choice", options: ["A bootstrap sample of the rows for each tree", "A random subset of features at each split", "Random labels for some training points"], correct: [0, 1] },
    },
    {
      key: "more",
      rung: "check",
      prompt: <p>What typically happens to test error as you add more and more trees to a random forest?</p>,
      answer: { kind: "choice", options: ["It decreases and then levels off", "It decreases and then rises because of overfitting", "It stays the same"], correct: [0] },
    },
    {
      key: "oob",
      rung: "apply",
      prompt: <p>With <M>{"n = 10"}</M> training points, what is the probability that a given point is absent from a bootstrap sample? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.349, tolerance: 0.0006 },
    },
    {
      key: "var",
      rung: "apply",
      prompt: <p>Trees with variance <M>{"\\sigma^2 = 4"}</M> and pairwise correlation <M>{"\\rho = 0.25"}</M> are averaged, <M>{"B = 100"}</M> of them. What is the variance of the average?</p>,
      answer: { kind: "numeric", value: 1.03 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>With the same trees, what does the variance of the average approach as <M>B</M> grows without limit?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(0)
n = 1000
sample = [random.randrange(n) for _ in range(n)]
print(round(len(set(sample)) / n, 2))`}</Code>
          <p>A bootstrap sample draws n rows with replacement. What fraction of distinct rows does it contain, to two decimal places?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.63, tolerance: 0.021 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
n = 1000
idx = rng.integers(0, n, n)
print(round(len(np.unique(idx)) / n, 2), round(1 - (1 - 1 / n) ** n, 4))`}</Code>
          <p>How many distinct rows does a bootstrap sample of size n contain, against the limit 1 − 1/e? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.62 0.6323", "1.0 0.6323", "0.5 0.5", "0.62 0.3677"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bagged_predict(X, y, X_test, n_trees, seed)</C>: with <C>np.random.default_rng(seed)</C>, fit <C>n_trees</C> scikit-learn <C>DecisionTreeClassifier(random_state=0)</C> models on bootstrap samples (rows drawn with replacement) and return the majority vote for each test row. Labels are 0 or 1; ties go to 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from sklearn.tree import DecisionTreeClassifier

def bagged_predict(X, y, X_test, n_trees, seed):
    return DecisionTreeClassifier(random_state=0).fit(X, y).predict(X_test)
`,
        solution: `import numpy as np
from sklearn.tree import DecisionTreeClassifier

def bagged_predict(X, y, X_test, n_trees, seed):
    rng = np.random.default_rng(seed)
    votes = np.zeros(len(X_test))
    for _ in range(n_trees):
        idx = rng.integers(0, len(X), len(X))
        votes += DecisionTreeClassifier(random_state=0).fit(X[idx], y[idx]).predict(X_test)
    return (votes >= n_trees / 2).astype(int)
`,
        tests: [
          { name: "better", code: `from sklearn.datasets import make_moons
from sklearn.tree import DecisionTreeClassifier
X, y = make_moons(600, noise=0.35, random_state=0)
single = (DecisionTreeClassifier(random_state=0).fit(X[:300], y[:300]).predict(X[300:]) == y[300:]).mean()
bag = (bagged_predict(X[:300], y[:300], X[300:], 50, 0) == y[300:]).mean()
assert bag > single + 0.02, 'Averaging many bootstrapped trees should beat one tree on noisy data.'` },
          { name: "one tree", code: `import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import make_moons
X, y = make_moons(200, noise=0.3, random_state=1)
rng = np.random.default_rng(5); idx = rng.integers(0, 100, 100)
ref = DecisionTreeClassifier(random_state=0).fit(X[:100][idx], y[:100][idx]).predict(X[100:])
out = bagged_predict(X[:100], y[:100], X[100:], 1, 5)
assert (out == ref).all() and (bagged_predict(X[:100], y[:100], X[100:], 9, 2) == bagged_predict(X[:100], y[:100], X[100:], 9, 2)).all(), 'Draw rows with rng.integers from the seeded generator.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Each bootstrap sample leaves out about 37% of the rows, which can serve as free validation data. Write <C>oob_accuracy(X, y, n_trees, seed)</C>: with one <C>np.random.default_rng(seed)</C>, fit <C>DecisionTreeClassifier(random_state=0)</C> on each bootstrap sample (<C>rng.integers(0, n, n)</C>), and for every row collect the votes only of trees whose sample left it out; return the accuracy of the majority vote (ties to 1, labels 0/1) over rows that were left out at least once. Then write <C>permutation_importance(model, X, y, seed)</C>, the drop in <C>model.score</C> when each column in turn is shuffled with <C>rng.permutation</C> (one generator, columns in order).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def oob_accuracy(X, y, n_trees, seed):
    return 1.0

def permutation_importance(model, X, y, seed):
    return np.zeros(X.shape[1])
`,
        solution: `import numpy as np

from sklearn.tree import DecisionTreeClassifier

def oob_accuracy(X, y, n_trees, seed):
    rng = np.random.default_rng(seed)
    n = len(X)
    votes, counts = np.zeros(n), np.zeros(n)
    for _ in range(n_trees):
        idx = rng.integers(0, n, n)
        out = np.ones(n, bool); out[idx] = False
        if out.any():
            t = DecisionTreeClassifier(random_state=0).fit(X[idx], y[idx])
            votes[out] += t.predict(X[out]); counts[out] += 1
    m = counts > 0
    pred = (votes[m] >= counts[m] / 2).astype(int)
    return float(np.mean(pred == y[m]))

def permutation_importance(model, X, y, seed):
    rng = np.random.default_rng(seed)
    base = model.score(X, y)
    out = []
    for j in range(X.shape[1]):
        Xp = X.copy(); Xp[:, j] = Xp[rng.permutation(len(X)), j]
        out.append(base - model.score(Xp, y))
    return np.array(out)
`,
        tests: [
          { name: "oob", code: `from sklearn.datasets import make_moons
from sklearn.ensemble import BaggingClassifier
X, y = make_moons(800, noise=0.3, random_state=0)
oob = oob_accuracy(X[:400], y[:400], 60, 0)
test = BaggingClassifier(n_estimators=60, random_state=0).fit(X[:400], y[:400]).score(X[400:], y[400:])
assert abs(oob - test) < 0.05 and 0.8 < oob < 0.95, f'Out-of-bag accuracy {oob:.3f} should estimate test accuracy {test:.3f}.'` },
          { name: "tiny", code: `import numpy as np
X = np.array([[0.0], [1.0], [2.0], [3.0]]); y = np.array([0, 0, 1, 1])
a = oob_accuracy(X, y, 5, 3)
assert a == oob_accuracy(X, y, 5, 3) and 0 <= a <= 1, 'Seeded.'` },
          { name: "importance", code: `import numpy as np
from sklearn.ensemble import RandomForestClassifier
rng = np.random.default_rng(1)
X = rng.normal(size=(500, 3)); y = (X[:, 1] > 0).astype(int)
m = RandomForestClassifier(50, random_state=0).fit(X[:300], y[:300])
imp = permutation_importance(m, X[300:], y[300:], 0)
assert imp.argmax() == 1 and imp[1] > 0.3 and abs(imp[0]) < 0.05 and abs(imp[2]) < 0.05, 'Only the informative column matters.'
rng2 = np.random.default_rng(0); Xp = X[300:].copy(); Xp[:, 0] = Xp[rng2.permutation(200), 0]
assert abs(imp[0] - (m.score(X[300:], y[300:]) - m.score(Xp, y[300:]))) < 1e-12, 'Columns shuffled in order with one generator.'` },
        ],
      },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Derive the formula for the variance of an average of <M>B</M> predictors with common variance <M>{"\\sigma^2"}</M> and
          pairwise correlation <M>{"\\rho"}</M>. Use it to explain why a random forest restricts the features at each split.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the variance of the sum as the sum of all pairwise covariances.",
          "Counts B diagonal terms σ² and B(B − 1) off-diagonal terms ρσ².",
          "Divides by B² and simplifies to ρσ² + (1 − ρ)σ²/B.",
          "Explains that the ρσ² term does not shrink with B, so reducing the correlation between trees, by restricting features, is what lowers it further.",
        ],
      },
    },
    {
      key: "vote",
      rung: "stretch",
      prompt: <p>Twenty-five independent voters are each right with probability 0.6. What is the probability that the majority is right? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.846, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend why averaging many deep trees beats one, why the trees must be made different, and what out-of-bag error is.",

  glimpse: (
    <p>
      Next, the bias and variance you have now met twice, made precise. Statistical Machine Learning develops bagging and
      boosting side by side: bagging averages away variance, while boosting builds a strong model from weak ones by attacking
      bias.
    </p>
  ),
};
