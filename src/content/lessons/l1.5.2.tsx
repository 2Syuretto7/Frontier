import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { CrossValViz } from "@/components/viz/CrossValViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.5.2",
  minutes: 50,
  links: {
    requires: ["l1.1.4"],
    revisits: ["l1.5.1"],
    parallels: ["m4.6.3"],
    foreshadows: ["l1.5.4", "l1.7.2"],
  },

  puzzle: (
    <>
      <p>
        You have only 30 labelled examples. Holding out 10 for validation leaves just 20 to train on, and the validation score
        from 10 points is itself very noisy: a different choice of 10 might reverse your decision.
      </p>
      <p>
        Is there a way to let every example serve both as training data and as validation data, without ever scoring a model
        on a point it was trained on?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take turns. Split the 30 examples into 5 groups of 6. Train on four groups and score on the fifth; repeat five times
        so each group is held out once. Every example is used for validation exactly once and for training four times, and no
        model is ever scored on its own training data. Average the five scores.
      </p>
      <CrossValViz />
      <p>
        The estimate is not equal to the true test error, but it rises and falls with it, so the degree it picks is close to
        the best. That is all model selection needs.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="k-fold cross-validation">
        <p>
          Split the <M>n</M> training examples into <M>k</M> disjoint folds <M>{"F_1, \\dots, F_k"}</M> of nearly equal size.
          For each <M>j</M>, train on every fold except <M>{"F_j"}</M>, giving <M>{"\\hat f^{(-j)}"}</M>. The cross-validation
          estimate of the error is
        </p>
        <MD>{"\\mathrm{CV} = \\frac1n \\sum_{j=1}^k \\sum_{i \\in F_j} L\\big(y_i, \\hat f^{(-j)}(x_i)\\big)."}</MD>
        <p>
          With <M>{"k = n"}</M>, each fold is a single example: <strong>leave-one-out</strong> cross-validation.
        </p>
      </Definition>

      <Remark title="choosing k">
        <p>
          Each model trains on a fraction <M>{"(k - 1)/k"}</M> of the data, so it is a little worse than one trained on all of
          it, and the estimate is slightly pessimistic, most of all for small <M>k</M>. Larger <M>k</M> reduces that bias but
          costs <M>k</M> fits and gives fold models that are nearly identical, so their errors are highly correlated. Five or
          ten folds is the usual compromise.
        </p>
      </Remark>

      <Example title="the arithmetic">
        <p>
          With 1,000 examples and 5 folds, each model trains on 800 and is scored on 200. If the five fold errors are 0.20,
          0.25, 0.15, 0.22 and 0.18, the estimate is their mean, 0.20, and their spread hints at how uncertain it is. Comparing
          12 hyperparameter settings this way costs <M>{"12 \\times 5 = 60"}</M> fits.
        </p>
      </Example>

      <Remark title="splits must respect the structure of the data">
        <p>
          The folds must mimic how the model will meet new data. If several examples come from the same patient, all of them
          go in the same fold, or the model is scored on a patient it has seen. For data ordered in time, train on the past
          and validate on the future, never the other way round. For rare classes, <strong>stratify</strong>: give each fold
          the same class proportions.
        </p>
      </Remark>

      <Remark title="cross-validation selects; it does not certify">
        <p>
          After trying many settings and keeping the one with the best cross-validation score, that score is optimistic: you
          chose it partly for its luck. To report a trustworthy number, keep a separate test set untouched, or use{" "}
          <strong>nested</strong> cross-validation, where an inner loop selects settings and an outer loop scores the whole
          selection procedure.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "once",
      rung: "check",
      prompt: <p>In k-fold cross-validation, how many times is each example used for validation?</p>,
      answer: { kind: "choice", options: ["Exactly once", "k times", "k − 1 times"], correct: [0] },
    },
    {
      key: "time",
      rung: "check",
      prompt: <p>You are forecasting next month&rsquo;s sales from monthly history. How should you split for validation?</p>,
      answer: { kind: "choice", options: ["Train on earlier months and validate on later ones", "Shuffle the months into random folds", "Either; it makes no difference"], correct: [0] },
    },
    {
      key: "trainsize",
      rung: "apply",
      prompt: <p>With 1,000 examples and 5-fold cross-validation, how many examples does each model train on?</p>,
      answer: { kind: "numeric", value: 800 },
    },
    {
      key: "mean",
      rung: "apply",
      prompt: <p>The five fold errors are 0.20, 0.25, 0.15, 0.22 and 0.18, with equal fold sizes. What is the cross-validation estimate?</p>,
      answer: { kind: "numeric", value: 0.2 },
    },
    {
      key: "fits",
      rung: "apply",
      prompt: <p>How many models are trained to compare 12 hyperparameter settings by 10-fold cross-validation?</p>,
      answer: { kind: "numeric", value: 120 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n, k = 10, 3
folds = [list(range(i, n, k)) for i in range(k)]
print(folds[0], sum(len(f) for f in folds))`}</Code>
          <p>Splitting 10 indices into 3 folds by stepping. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 3, 6, 9] 10", "[0, 1, 2] 9", "[0, 3, 6] 10", "[0, 3, 6, 9] 12"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from sklearn.model_selection import KFold
f = [test.tolist() for _, test in KFold(3).split(np.zeros(7))]
print(f)`}</Code>
          <p>scikit-learn&rsquo;s KFold with three folds on seven rows, without shuffling. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[0, 1, 2], [3, 4], [5, 6]]", "[[0, 1], [2, 3], [4, 5, 6]]", "[[0, 3, 6], [1, 4], [2, 5]]", "[[0, 1, 2], [3, 4, 5], [6]]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kfold_score(model_fn, X, y, k)</C>, which splits the rows in order into k contiguous folds with <C>np.array_split</C>, trains a fresh <C>model_fn()</C> on k − 1 folds, scores it on the held-out fold, and returns the mean score.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kfold_score(model_fn, X, y, k):
    return model_fn().fit(X, y).score(X, y)
`,
        solution: `import numpy as np

def kfold_score(model_fn, X, y, k):
    folds = np.array_split(np.arange(len(X)), k)
    scores = []
    for i, test in enumerate(folds):
        train = np.concatenate([f for j, f in enumerate(folds) if j != i])
        scores.append(model_fn().fit(X[train], y[train]).score(X[test], y[test]))
    return float(np.mean(scores))
`,
        tests: [
          { name: "sklearn", code: `import numpy as np
from sklearn.model_selection import cross_val_score, KFold
from sklearn.linear_model import LogisticRegression
from sklearn.datasets import make_classification
X, y = make_classification(200, random_state=0)
ref = cross_val_score(LogisticRegression(), X, y, cv=KFold(5)).mean()
assert abs(kfold_score(lambda: LogisticRegression(), X, y, 5) - ref) < 1e-9, 'Match cross_val_score with unshuffled folds.'` },
          { name: "folds", code: `import numpy as np
sizes = []
class M:
    def fit(self, X, y):
        sizes.append(len(X))
        return self
    def score(self, X, y):
        return len(X)
s = kfold_score(M, np.arange(10)[:, None], np.arange(10), 3)
assert sizes == [6, 7, 7] and abs(s - 10 / 3) < 1e-12, 'np.array_split gives folds of 4, 3 and 3.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Choosing hyperparameters by cross-validation and then reporting that same score is optimistic. Write <C>nested_cv(model_fn, grid, X, y, outer, inner)</C>: split the rows with <C>KFold(outer)</C>; in each outer training part, choose parameters from the dict of lists <C>grid</C> by mean <C>cross_val_score</C> over <C>KFold(inner)</C> (the first best combination on ties, in <C>itertools.product</C> order), refit on the whole outer training part, and score on the outer test fold. Return (mean outer score, list of chosen parameter dicts).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nested_cv(model_fn, grid, X, y, outer, inner):
    return 1.0, []
`,
        solution: `import numpy as np

from itertools import product
from sklearn.model_selection import KFold, cross_val_score

def nested_cv(model_fn, grid, X, y, outer, inner):
    keys = list(grid)
    scores, chosen = [], []
    for tr, te in KFold(outer).split(X):
        best = None
        for vals in product(*grid.values()):
            params = dict(zip(keys, vals))
            s = cross_val_score(model_fn(**params), X[tr], y[tr], cv=KFold(inner)).mean()
            if best is None or s > best[0]:
                best = (s, params)
        chosen.append(best[1])
        scores.append(model_fn(**best[1]).fit(X[tr], y[tr]).score(X[te], y[te]))
    return float(np.mean(scores)), chosen
`,
        tests: [
          { name: "sklearn", code: `from sklearn.model_selection import GridSearchCV, KFold, cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import make_classification
X, y = make_classification(240, n_informative=4, random_state=0)
grid = {'max_depth': [1, 3, None], 'min_samples_leaf': [1, 8]}
s, chosen = nested_cv(lambda **kw: DecisionTreeClassifier(random_state=0, **kw), grid, X, y, 4, 3)
ref = cross_val_score(GridSearchCV(DecisionTreeClassifier(random_state=0), grid, cv=KFold(3)), X, y, cv=KFold(4)).mean()
assert abs(s - ref) < 1e-12 and len(chosen) == 4, 'The same as GridSearchCV inside cross_val_score.'` },
          { name: "optimism", code: `import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import KFold, cross_val_score
rng = np.random.default_rng(0)
X = rng.normal(size=(120, 20)); y = rng.integers(0, 2, 120)
grid = {'n_neighbors': list(range(1, 40, 2))}
inner_best = max(cross_val_score(KNeighborsClassifier(k), X, y, cv=KFold(4)).mean() for k in grid['n_neighbors'])
s, _ = nested_cv(lambda **kw: KNeighborsClassifier(**kw), grid, X, y, 4, 4)
assert inner_best > s and s < 0.6, 'On pure noise, the best inner score is optimistic; the nested score is honest.'` },
        ],
      },
    },
    {
      key: "nested",
      rung: "prove",
      prompt: (
        <p>
          You try 200 settings and report the best 5-fold cross-validation accuracy as your model&rsquo;s accuracy. Explain why
          this number is biased upwards, and describe a procedure that gives an honest estimate.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that each cross-validation score is a noisy estimate, so the maximum of 200 of them tends to be one whose noise happened to be favourable.",
          "Concludes that the reported score overstates how the chosen model will do on new data.",
          "Describes keeping a final test set untouched until selection is finished, or nested cross-validation with selection inside each outer training split.",
          "States that the honest estimate must score the whole selection procedure on data it never influenced.",
        ],
      },
    },
    {
      key: "folds",
      rung: "stretch",
      prompt: <p>103 examples are split into 10 folds as evenly as possible. How many folds hold 11 examples?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how k-fold cross-validation works, why it beats a single small validation set, and why the best cross-validation score is not an honest final number.",

  glimpse: (
    <p>
      Next, ridge and lasso, which give you a dial for bias and variance that cross-validation can set. In large-scale deep
      learning one training run can cost a fortune, so cross-validation gives way to a single held-out set and to scaling laws
      fitted on small runs.
    </p>
  ),
};
