import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LeakageViz } from "@/components/viz/LeakageViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.7.2",
  minutes: 45,
  links: {
    requires: ["l1.1.4", "l1.5.2"],
    revisits: ["l1.7.1"],
    parallels: ["m4.6.2"],
    foreshadows: ["l1.7.3"],
  },

  puzzle: (
    <>
      <p>
        A team reports a model that predicts hospital readmission with 99% accuracy. Its most important feature turns out to be
        &ldquo;number of days of follow-up care billed&rdquo;.
      </p>
      <p>
        Why might that feature be so predictive? Would the model work on the day a patient is discharged, when it is actually
        needed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Follow-up care is billed after the outcome is already known, and mostly for patients who came back. The feature smuggles
        the answer into the input. At discharge it is not yet available, so the model that looked brilliant would be useless.
        This is <strong>leakage</strong>: information reaching the model during training or evaluation that it will not have
        when it is used.
      </p>
      <p>
        Leakage rarely announces itself. It shows up as results that are too good, and it is found by asking of every feature
        and every processing step: would this exist, computed this way, at the moment of prediction?
      </p>
      <LeakageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="leakage">
        <p>
          <strong>Leakage</strong> is any path by which information about the evaluation targets, or about the future, reaches
          the model or its design, so that measured performance overstates real performance.
        </p>
      </Definition>

      <Remark title="three common forms">
        <ul>
          <li>
            <strong>Target leakage</strong>: a feature recorded after, or because of, the outcome. Closure dates, billing
            codes, &ldquo;reason for refund&rdquo;.
          </li>
          <li>
            <strong>Train-test contamination</strong>: the same example or the same entity (patient, user, document) on both
            sides of the split, or a preprocessing step, such as a scaler or feature selection, fitted on all the data.
          </li>
          <li>
            <strong>Temporal leakage</strong>: training on data from after the time being predicted, typically by shuffling a
            time series.
          </li>
        </ul>
      </Remark>

      <Remark title="the rule that prevents it">
        <p>
          Simulate deployment. Split first, by the unit that will be new in use (time, patient, user), and then fit every step
          that learns from data, including scaling, imputation and feature selection, on the training part only. Libraries
          provide <strong>pipelines</strong> that bundle these steps with the model, so that cross-validation refits all of
          them inside each fold.
        </p>
      </Remark>

      <Example title="selection on noise">
        <p>
          Take 1,000 features of pure noise and test each for correlation with the label at the 5% level. About{" "}
          <M>{"1000 \\times 0.05 = 50"}</M> will pass by chance. Train on those 50 and cross-validate, and the scores look
          respectable, because the validation folds helped choose the features. Repeat the selection inside each fold and the
          scores fall to chance, as they should.
        </p>
      </Example>

      <Remark title="leakage at frontier scale">
        <p>
          Language models are pretrained on much of the public web, and benchmark questions are often on the web too. If test
          questions appear in the training data, a high score may reflect memory rather than ability. This{" "}
          <strong>benchmark contamination</strong> is leakage on a huge scale, and careful evaluations check for it by searching
          the training data for overlaps and by writing fresh, private test questions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "target",
      rung: "check",
      prompt: <p>Which of these features would be target leakage in a model predicting, at the time of application, whether a loan will default?</p>,
      answer: { kind: "choice", options: ["Number of missed repayments", "Applicant's income at application", "Length of credit history at application"], correct: [0] },
    },
    {
      key: "group",
      rung: "check",
      prompt: <p>A dataset has several photos per patient. How should it be split?</p>,
      answer: { kind: "choice", options: ["By patient, so each patient's photos are all on one side", "By photo, at random", "By file size"], correct: [0] },
    },
    {
      key: "noise",
      rung: "apply",
      prompt: <p>You test 1,000 pure-noise features at the 5% significance level. How many do you expect to pass by chance?</p>,
      answer: { kind: "numeric", value: 50 },
    },
    {
      key: "twin",
      rung: "apply",
      prompt: <p>A dataset contains pairs of exact duplicates and is split at random, 80% to training and 20% to test. For a duplicated row that lands in the test set, what is the probability, roughly, that its twin is in training?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.01 },
    },
    {
      key: "contam",
      rung: "apply",
      prompt: <p>A benchmark has 500 questions; 60 appear verbatim in a model&rsquo;s training data. It answers 90% of those correctly and 70% of the other 440. What overall percentage does it report?</p>,
      answer: { kind: "numeric", value: 72.4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
X = rng.normal(size=(100, 2000)); y = rng.integers(0, 2, 100)
top = np.argsort(-np.abs(X[y == 1].mean(0) - X[y == 0].mean(0)))[:20]
print(cross_val_score(LogisticRegression(), X[:, top], y, cv=5).mean() > 0.7)`}</Code>
          <p>Labels are pure noise, but features were chosen using all the labels before cross-validation. Does it report accuracy above 0.7?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([1.0, 2.0, 3.0, 100.0])
train, test = X[:3], X[3:]
leaky = (test - X.mean()) / X.std()
honest = (test - train.mean()) / train.std()
print(np.round(leaky, 3), np.round(honest, 3))`}</Code>
          <p>Scaling the test point with statistics from all the data, against training data only. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.732] [120.025]", "[1.732] [1.732]", "[120.025] [1.732]", "[0.5] [120.025]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Fix the leak. Write <C>honest_score(X, y)</C>, which does the same feature selection (the 20 features with the largest gap between class means) <em>inside</em> each of 5 folds, using only that fold&rsquo;s training rows, and returns the mean accuracy of <C>LogisticRegression()</C>. Use <C>KFold(5)</C> without shuffling.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from sklearn.model_selection import cross_val_score
from sklearn.linear_model import LogisticRegression

def honest_score(X, y):
    top = np.argsort(-np.abs(X[y == 1].mean(0) - X[y == 0].mean(0)))[:20]
    return cross_val_score(LogisticRegression(), X[:, top], y, cv=5).mean()
`,
        solution: `import numpy as np
from sklearn.model_selection import KFold
from sklearn.linear_model import LogisticRegression

def honest_score(X, y):
    scores = []
    for tr, te in KFold(5).split(X):
        Xtr, ytr = X[tr], y[tr]
        top = np.argsort(-np.abs(Xtr[ytr == 1].mean(0) - Xtr[ytr == 0].mean(0)))[:20]
        m = LogisticRegression().fit(Xtr[:, top], ytr)
        scores.append(m.score(X[te][:, top], y[te]))
    return float(np.mean(scores))
`,
        tests: [
          { name: "no leak", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(100, 2000)); y = rng.integers(0, 2, 100)
assert honest_score(X, y) < 0.65, 'On pure noise an honest estimate should be near 0.5.'` },
          { name: "still works", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(size=(200, 500)); y = (X[:, 0] + X[:, 1] > 0).astype(int)
assert honest_score(X, y) > 0.8, 'With a real signal, selection inside the folds still finds it.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>group_split(groups, test_frac, seed)</C>, which keeps every group wholly on one side: shuffle the distinct groups (sorted first) with <C>np.random.default_rng(seed).permutation</C>, then move groups to the test side in that order until it holds at least test_frac of the rows. Return (train indices, test indices), sorted. Then write <C>time_split(times, cutoff)</C> (train strictly before the cutoff, test from it on) and <C>leaked_rows(train_X, test_X)</C>, the number of test rows identical to some training row.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def group_split(groups, test_frac, seed):
    n = len(groups)
    k = int(n * (1 - test_frac))
    return np.arange(k), np.arange(k, n)

def time_split(times, cutoff):
    n = len(times)
    return np.arange(n // 2), np.arange(n // 2, n)

def leaked_rows(train_X, test_X):
    return 0
`,
        solution: `import numpy as np

def group_split(groups, test_frac, seed):
    groups = np.asarray(groups)
    order = np.random.default_rng(seed).permutation(np.unique(groups))
    test, count = set(), 0
    for g in order:
        if count >= test_frac * len(groups):
            break
        test.add(g); count += int((groups == g).sum())
    mask = np.isin(groups, list(test))
    return np.nonzero(~mask)[0], np.nonzero(mask)[0]

def time_split(times, cutoff):
    t = np.asarray(times)
    return np.nonzero(t < cutoff)[0], np.nonzero(t >= cutoff)[0]

def leaked_rows(train_X, test_X):
    seen = {tuple(r) for r in np.asarray(train_X).tolist()}
    return sum(tuple(r) in seen for r in np.asarray(test_X).tolist())
`,
        tests: [
          { name: "groups", code: `import numpy as np
g = np.array(['p1'] * 5 + ['p2'] * 3 + ['p3'] * 4 + ['p4'] * 8)
tr, te = group_split(g, 0.25, 0)
assert set(g[tr]).isdisjoint(set(g[te])) and len(te) >= 5 and sorted(np.r_[tr, te].tolist()) == list(range(20)), 'No patient on both sides.'
order = np.random.default_rng(0).permutation(np.unique(g))
assert order[0] in set(g[te]) and all((x == y).all() for x, y in zip((tr, te), group_split(g, 0.25, 0))), 'Take groups in permutation order.'` },
          { name: "sklearn", code: `import numpy as np
rng = np.random.default_rng(1)
g = rng.integers(0, 30, 300)
tr, te = group_split(g, 0.3, 5)
assert len(set(g[tr]) & set(g[te])) == 0 and 0.3 <= len(te) / 300 < 0.45` },
          { name: "time", code: `tr, te = time_split([5, 1, 9, 3, 7], 5)
assert tr.tolist() == [1, 3] and te.tolist() == [0, 2, 4], 'Train strictly before the cutoff.'` },
          { name: "dupes", code: `import numpy as np
assert leaked_rows(np.array([[1, 2], [3, 4]]), np.array([[3, 4], [5, 6], [1, 2], [1, 2]])) == 3 and leaked_rows(np.zeros((0, 2)), np.ones((2, 2))) == 0` },
        ],
      },
    },
    {
      key: "pipeline",
      rung: "prove",
      prompt: (
        <p>
          A colleague standardises all the data and selects the 20 best features using all the labels, then runs 5-fold
          cross-validation. Explain precisely how information leaks into each validation fold, which step leaks more, and how to
          restructure the procedure.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the scaler's mean and standard deviation include the validation fold's values, a mild leak of input information.",
          "Notes feature selection used the validation fold's labels, so features were chosen partly for fitting those labels, a severe leak.",
          "Explains this makes the cross-validation score optimistic, possibly far above chance even on pure noise.",
          "Prescribes fitting the scaler and the selection inside each training fold, for example with a pipeline, and applying them unchanged to the held-out fold.",
        ],
      },
    },
    {
      key: "anyone",
      rung: "stretch",
      prompt: <p>With 50 independent pure-noise features, what is the probability that at least one passes a test at the 5% level? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.923, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend what leakage is, give one example each of target leakage, contamination and temporal leakage, and state the rule that prevents all three.",

  glimpse: (
    <p>
      Next, baselines: the simple predictors every model must beat before its score means anything. Evaluation and the Science of
      Deep Learning treats benchmark contamination and its detection in depth.
    </p>
  ),
};
