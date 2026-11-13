import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BlockingViz } from "@/components/viz/BlockingViz";
import type { LessonContent } from "@/lib/types";

const RAND = `import numpy as np

def complete_rand(n, seed):
    z = np.zeros(n, dtype=int)
    z[np.random.default_rng(seed).permutation(n)[: n // 2]] = 1
    return z

def blocked_rand(blocks, seed):
    rng = np.random.default_rng(seed)
    z = np.zeros(len(blocks), dtype=int)
    for b in np.unique(blocks):
        idx = np.flatnonzero(blocks == b)
        z[rng.permutation(idx)[: len(idx) // 2]] = 1
    return z

def diff_means(y, z):
    return float(y[z == 1].mean() - y[z == 0].mean())`;

const LEAK = `import numpy as np

def top_features(X, y, k):
    gap = np.abs(X[y == 1].mean(axis=0) - X[y == 0].mean(axis=0))
    return np.argsort(-gap)[:k]

def centroid_acc(Xtr, ytr, Xte, yte):
    m1, m0 = Xtr[ytr == 1].mean(axis=0), Xtr[ytr == 0].mean(axis=0)
    d1, d0 = ((Xte - m1) ** 2).sum(axis=1), ((Xte - m0) ** 2).sum(axis=1)
    return float(np.mean((d1 < d0).astype(int) == yte))

def cv_acc(X, y, k, folds=5, leak=False):
    fold = np.arange(len(y)) % folds
    chosen = top_features(X, y, k)
    accs = []
    for f in range(folds):
        tr, te = fold != f, fold == f
        s = chosen if leak else top_features(X[tr], y[tr], k)
        accs.append(centroid_acc(X[tr][:, s], y[tr], X[te][:, s], y[te]))
    return round(float(np.mean(accs)), 3)`;

export const lesson: LessonContent = {
  id: "m9.8.5",
  minutes: 55,
  links: {
    requires: ["m9.8.4", "m9.5.3"],
    revisits: ["m9.4.4", "m9.4.5", "m9.8.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A team reports that a new augmentation lifts accuracy by three points. The new runs used a newer GPU driver, the
        baseline was tuned for one day and the new method for a week, the features were normalised on the whole dataset,
        and the metric was chosen after looking at five candidates. Which of these could produce the gain on its own, and
        how would you design the comparison so that none of them can?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A controlled experiment changes one thing and lets chance, not you, decide which units get it. Randomisation
        balances everything you did not think of on average; blocking removes the variation you did think of; a held-out
        test set that nothing has touched keeps the measurement honest; and writing the plan down first stops the analysis
        from bending towards the answer you hoped for.
      </p>
      <BlockingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="randomised experiment">
        <p>
          Each unit i has two potential outcomes, <M>{"y_i(1)"}</M> with the treatment and <M>{"y_i(0)"}</M> without, and
          we see only one of them. The average treatment effect is{" "}
          <M>{"\\tau = \\frac1N\\sum_i (y_i(1) - y_i(0))"}</M>. In a completely randomised experiment a uniformly random
          subset of N/2 units gets the treatment, with assignment <M>{"z_i \\in \\{0, 1\\}"}</M>, and the estimate is the
          difference in means of the observed outcomes.
        </p>
      </Definition>

      <Theorem title="randomisation gives an unbiased estimate">
        <p>Under complete randomisation the difference in means has expectation τ, whatever the potential outcomes are.</p>
      </Theorem>
      <Proof>
        <p>
          By symmetry each unit lands in the treated half with probability 1/2. The treated mean is{" "}
          <M>{"\\frac{2}{N}\\sum_i z_i y_i(1)"}</M>, whose expectation is <M>{"\\frac{2}{N}\\sum_i \\tfrac12 y_i(1) = \\frac1N\\sum_i y_i(1)"}</M>.
          Likewise the control mean has expectation <M>{"\\frac1N\\sum_i y_i(0)"}</M>, and subtracting gives τ. No property of
          the units entered the argument: a confounder such as a driver version or a question&apos;s difficulty is balanced in
          expectation because the coin, not a person, chose the arms.
        </p>
      </Proof>

      <Theorem title="blocking removes block effects">
        <p>
          Suppose <M>{"y_i(0) = a_{g(i)} + \\varepsilon_i"}</M> and <M>{"y_i(1) = y_i(0) + \\tau"}</M>, with blocks of equal
          even size, and exactly half of each block is treated. Then the difference in means equals τ plus the difference of
          the ε means of the two arms, so the block effects <M>{"a_g"}</M> cancel exactly.
        </p>
      </Theorem>
      <Proof>
        <p>
          With G blocks of size m, each arm holds m/2 units from every block, so the treated mean is{" "}
          <M>{"\\frac1G\\sum_g a_g + \\tau + \\bar\\varepsilon_1"}</M> and the control mean is{" "}
          <M>{"\\frac1G\\sum_g a_g + \\bar\\varepsilon_0"}</M>. Subtracting leaves{" "}
          <M>{"\\tau + \\bar\\varepsilon_1 - \\bar\\varepsilon_0"}</M>, which has mean τ and, for independent ε of variance σ²,
          variance <M>{"4\\sigma^2/N"}</M>, with no trace of the a terms. Under complete randomisation the arms can hold
          different numbers of units from each block, and the a terms add to the variance.
        </p>
        <Code>{RAND}</Code>
      </Proof>

      <Example title="blocking in numbers">
        <p>
          With 40 units in four blocks whose baselines are 0, 4, 8 and 12, noise σ = 1 and true effect 1, both designs average
          about 1 over 2000 repeats, but the spread of the estimate is about 1.45 under complete randomisation and 0.32 when
          each block is split in half. Pairing two models on the same questions, or two configurations on the same seed, is
          blocking with blocks of size two.
        </p>
      </Example>

      <Remark title="controls and ablations">
        <p>
          Compare against a baseline run under the same conditions: same data, hardware, software, number of seeds and
          tuning budget. A method tuned for a week against a baseline tuned for a day measures the tuning, not the method.
          An ablation removes one component at a time from the full system, so the drop it causes can be attributed to that
          component; changing two things at once confounds them.
        </p>
      </Remark>

      <Example title="data leakage">
        <p>
          Leakage is any route by which the test set influences training or model selection. A classic case is selecting
          features on the whole dataset before cross-validation. On pure noise, 60 points with 2000 random features and
          random labels, picking the 20 features most correlated with the labels on all the data and then cross-validating
          reports 95% accuracy; doing the selection inside each training fold gives about 52%, which is chance. Normalising
          with statistics of the full dataset, deduplicating after the split, and tuning on the test set leak in the same way.
        </p>
        <Code>{LEAK}</Code>
      </Example>

      <Remark title="preregistration">
        <p>
          Before running, write down the hypothesis, the primary metric, the test, the sample size from a power calculation,
          and the stopping rule. Choosing among many metrics, subsets or analyses after seeing results is multiple testing in
          disguise: with twenty independent tries at level 0.05 and no real effect, one significant result is expected. What
          was not in the plan can still be reported, labelled as exploratory.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sd",
      rung: "check",
      prompt: <p>With 20 units per arm and noise σ = 1, blocking leaves an estimate with standard deviation √(2σ²/20). Give it to four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3162, tolerance: 0.0001 },
    },
    {
      key: "forks",
      rung: "check",
      prompt: <p>You try 20 independent analyses at level 0.05 on data with no real effect. How many significant results do you expect?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.001 },
    },
    {
      key: "leak",
      rung: "apply",
      prompt: <p>Which of these is data leakage?</p>,
      answer: {
        kind: "choice",
        options: [
          "Standardising features with the mean and standard deviation of the full dataset before splitting into train and test",
          "Standardising features with statistics computed on the training split only",
          "Choosing hyperparameters on a validation split that is separate from the test set",
          "Running the baseline and the new method on the same random seeds",
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

def complete_rand(n, seed):
    z = np.zeros(n, dtype=int)
    z[np.random.default_rng(seed).permutation(n)[: n // 2]] = 1
    return z

def blocked_rand(blocks, seed):
    rng = np.random.default_rng(seed)
    z = np.zeros(len(blocks), dtype=int)
    for b in np.unique(blocks):
        idx = np.flatnonzero(blocks == b)
        z[rng.permutation(idx)[: len(idx) // 2]] = 1
    return z

def diff_means(y, z):
    return float(y[z == 1].mean() - y[z == 0].mean())

blocks = np.repeat([0, 1, 2, 3], 10); rng = np.random.default_rng(1)
ests = []
for s in range(2000):
    y0 = 4.0 * blocks + rng.normal(0, 1, 40)
    ests.append([diff_means(y0 + z, z) for z in (complete_rand(40, s), blocked_rand(blocks, s))])
print(np.round(np.mean(ests, axis=0), 2), np.round(np.std(ests, axis=0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.01 1.  ] [1.45 0.31]", "[1.01 1.  ] [0.31 1.45]", "[1.01 4.  ] [1.45 0.31]", "[1.01 1.  ] [1.45 1.45]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def top_features(X, y, k):
    gap = np.abs(X[y == 1].mean(axis=0) - X[y == 0].mean(axis=0))
    return np.argsort(-gap)[:k]

def centroid_acc(Xtr, ytr, Xte, yte):
    m1, m0 = Xtr[ytr == 1].mean(axis=0), Xtr[ytr == 0].mean(axis=0)
    d1, d0 = ((Xte - m1) ** 2).sum(axis=1), ((Xte - m0) ** 2).sum(axis=1)
    return float(np.mean((d1 < d0).astype(int) == yte))

def cv_acc(X, y, k, folds=5, leak=False):
    fold = np.arange(len(y)) % folds
    chosen = top_features(X, y, k)
    accs = []
    for f in range(folds):
        tr, te = fold != f, fold == f
        s = chosen if leak else top_features(X[tr], y[tr], k)
        accs.append(centroid_acc(X[tr][:, s], y[tr], X[te][:, s], y[te]))
    return round(float(np.mean(accs)), 3)

rng = np.random.default_rng(3); X = rng.normal(size=(60, 2000)); y = np.tile([0, 1], 30)
print(cv_acc(X, y, 20, leak=True), cv_acc(X, y, 20, leak=False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.95 0.517", "0.517 0.95", "0.95 0.95", "0.517 0.517"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>complete_rand(n, seed)</C>, a 0/1 array with exactly n // 2 ones at random positions,{" "}
          <C>blocked_rand(blocks, seed)</C>, which treats a random half (rounded down) of the units in each block, and{" "}
          <C>diff_means(y, z)</C>, the treated mean minus the control mean as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def complete_rand(n, seed):
    return np.zeros(n, dtype=int)

def blocked_rand(blocks, seed):
    return np.zeros(len(blocks), dtype=int)

def diff_means(y, z):
    return 0.0
`,
        solution: RAND,
        tests: [
          { name: "blocks", code: `b = np.repeat([0, 1, 2], 4)
z = blocked_rand(b, 0)
assert all(z[b == k].sum() == 2 for k in range(3))` },
          { name: "complete", code: `assert complete_rand(10, 3).sum() == 5 and diff_means(np.array([1.0, 2.0, 3.0, 4.0]), np.array([0, 1, 0, 1])) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>top_features(X, y, k)</C>, the indices of the k columns with the largest absolute gap between class means;{" "}
          <C>centroid_acc(Xtr, ytr, Xte, yte)</C>, the test accuracy of predicting the class whose training mean is nearer;
          and <C>cv_acc(X, y, k, folds=5, leak=False)</C>, the mean accuracy over folds where row i is in fold i % folds,
          selecting features on all the data if leak is true and on the training rows of each fold otherwise, rounded to 3
          places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def top_features(X, y, k):
    return np.arange(k)

def centroid_acc(Xtr, ytr, Xte, yte):
    return 0.5

def cv_acc(X, y, k, folds=5, leak=False):
    return 0.5
`,
        solution: LEAK,
        tests: [
          { name: "signal", code: `X = np.random.default_rng(0).normal(size=(40, 50)); y = np.tile([0, 1], 20); X[:, 7] += 6 * y
assert list(top_features(X, y, 1)) == [7] and cv_acc(X, y, 1) == 1.0` },
          { name: "leak", code: `X = np.random.default_rng(3).normal(size=(60, 2000)); y = np.tile([0, 1], 30)
assert cv_acc(X, y, 20, leak=True) > 0.85 and cv_acc(X, y, 20) < 0.75` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Units fall into blocks of equal even size, with <M>{"y_i(0) = a_{g(i)} + \\varepsilon_i"}</M> and{" "}
          <M>{"y_i(1) = y_i(0) + \\tau"}</M>. Prove that if exactly half of each block is treated, the difference in means is{" "}
          <M>{"\\tau + \\bar\\varepsilon_1 - \\bar\\varepsilon_0"}</M>, so the block effects do not affect it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that each arm contains the same number of units from every block.",
          "Writes the treated mean as the average of the a_g plus τ plus the mean ε of the treated units, and the control mean as the same average of a_g plus the mean ε of the controls.",
          "Subtracts so that the a_g terms cancel, leaving τ + ε̄₁ − ε̄₀.",
        ],
      },
    },
    {
      key: "spread",
      rung: "stretch",
      prompt: (
        <p>
          Without blocking, 40 units whose observed outcomes have variance S² = 21 (dividing by N − 1) are split 20/20 at
          random. The difference in means then has standard deviation √(S²(1/20 + 1/20)). Give it to four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.4491, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend why random assignment gives an unbiased comparison, how blocking makes it more precise, what controls and ablations are for, how feature selection on the whole dataset leaks, and why writing the analysis plan down first matters.",

  glimpse: (
    <>
      <p>
        This closes the course on statistical inference: estimators and their limits, tests, intervals, regression, Bayesian
        updating and the experimental practice that makes ML results trustworthy. The next course builds on these tools to
        study how learning algorithms generalise from data.
      </p>
    </>
  ),
};
