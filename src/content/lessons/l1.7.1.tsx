import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ScalingViz } from "@/components/viz/ScalingViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.7.1",
  minutes: 50,
  links: {
    revisits: ["l1.4.1", "l1.5.3", "l1.2.2"],
    parallels: ["e1.7.2"],
    foreshadows: ["l1.7.2", "l3.5.2"],
  },

  puzzle: (
    <>
      <p>
        A nearest-neighbour model predicts whether a person will buy a pension plan from two features: age in years and annual
        pay in rupees. In truth, only age matters.
      </p>
      <p>
        Two people differ by 20 years in age and by ₹50,000 in pay. A third differs from the first by 1 year in age and by
        ₹2,00,000 in pay. Which of the two is &ldquo;nearer&rdquo; to the first person, as the model measures distance? Does
        that match what matters?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Measured raw, the first gap is about <M>{"\\sqrt{20^2 + 50000^2} \\approx 50{,}000"}</M> and the second about 2,00,000.
        Pay swamps age completely, simply because rupees are small units. The model is blind to the one feature that matters.
      </p>
      <ScalingViz />
      <p>
        Rescale each feature to mean 0 and standard deviation 1, and both get a fair say. This is one of several routine
        steps, called <strong>preprocessing</strong>, that turn raw columns into features a model can use well.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="standardising and min-max scaling">
        <p>
          With mean <M>{"\\mu_j"}</M> and standard deviation <M>{"\\sigma_j"}</M> of feature <M>j</M>{" "}
          <em>computed on the training set</em>, <strong>standardising</strong> replaces <M>{"x_j"}</M> by{" "}
          <M>{"(x_j - \\mu_j)/\\sigma_j"}</M>. <strong>Min-max scaling</strong> replaces it by{" "}
          <M>{"(x_j - \\min_j)/(\\max_j - \\min_j)"}</M>, mapping the training range to <M>{"[0, 1]"}</M>. The same numbers are
          then applied, unchanged, to validation, test and live data.
        </p>
      </Definition>

      <Remark title="who needs scaling">
        <p>
          Methods built on distances (nearest neighbours, k-means), on penalties (ridge, lasso) or on gradient descent are
          sensitive to scale. Decision trees and forests are not, because a threshold test is unaffected by any increasing
          change of units. Plain least squares is not either, as the next theorem shows.
        </p>
      </Remark>

      <Theorem title="least squares ignores units">
        <p>
          For least squares with an intercept, replacing a feature <M>{"x_j"}</M> by <M>{"a x_j + b"}</M>, with{" "}
          <M>{"a \\ne 0"}</M>, leaves every fitted prediction unchanged.
        </p>
      </Theorem>
      <Proof>
        <p>
          Any model on the old feature, <M>{"w_0 + w_j x_j + \\dots"}</M>, equals the model on the new feature with weights{" "}
          <M>{"w_j' = w_j/a"}</M> and <M>{"w_0' = w_0 - w_j b/a"}</M>, and conversely. So both feature sets describe exactly the
          same set of prediction functions, and least squares picks the one with the smallest error from that same set. Ridge
          is different: the penalty <M>{"w_j^2"}</M> becomes <M>{"a^2 w_j'^2"}</M>, so the units change which model wins.
        </p>
      </Proof>

      <Definition title="one-hot encoding">
        <p>
          A categorical feature with <M>m</M> values, such as a city, becomes <M>m</M> binary columns, exactly one of which is 1.
          Coding the cities as 1, 2, 3, &hellip; instead would tell a linear model that city 3 is &ldquo;three times&rdquo;
          city 1, which is meaningless. With an intercept, one column is often dropped, since the <M>m</M> columns always sum
          to 1.
        </p>
      </Definition>

      <Remark title="missing values and skew">
        <p>
          A missing value can be filled with the training median, together with a new binary feature recording that it was
          missing, since missingness itself often carries information. Features spanning many orders of magnitude, such as
          incomes or counts, often work better after taking logarithms, which turn ratios into differences.
        </p>
      </Remark>

      <Example title="standardising by hand">
        <p>
          Training values 40, 50, 60 have mean 50 and population standard deviation <M>{"\\sqrt{200/3} \\approx 8.16"}</M>.
          A new value 65 becomes <M>{"15/8.16 \\approx 1.84"}</M>. Notice that the new value is scaled with the training
          statistics; it does not get a say in them.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "who",
      rung: "check",
      prompt: <p>Which of these are sensitive to the units of the features? Select all that apply.</p>,
      answer: { kind: "choice", options: ["k-nearest neighbours", "Ridge regression", "A decision tree"], correct: [0, 1] },
    },
    {
      key: "fit",
      rung: "check",
      prompt: <p>On which data should the mean and standard deviation for standardising be computed?</p>,
      answer: { kind: "choice", options: ["The training data only", "All the data, including the test set", "The test data only"], correct: [0] },
    },
    {
      key: "z",
      rung: "apply",
      prompt: <p>A feature has training mean 50 and standard deviation 10. What is the standardised value of 65?</p>,
      answer: { kind: "numeric", value: 1.5 },
    },
    {
      key: "minmax",
      rung: "apply",
      prompt: <p>Training values run from 10 to 60. What does min-max scaling map 30 to?</p>,
      answer: { kind: "numeric", value: 0.4 },
    },
    {
      key: "onehot",
      rung: "apply",
      prompt: <p>A feature takes five values: Pune, Delhi, Chennai, Kolkata and Mumbai. How many binary columns does one-hot encoding, with one column per value, create?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pandas as pd
df = pd.DataFrame({"city": ["Pune", "Delhi", "Pune"]})
print(pd.get_dummies(df, columns=["city"], dtype=int).values.tolist())`}</Code>
          <p>One-hot encoding a category, columns in alphabetical order. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[0, 1], [1, 0], [0, 1]]", "[[1, 0], [0, 1], [1, 0]]", "[[1], [0], [1]]", "[[0, 1, 0], [1, 0, 0], [0, 1, 0]]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.array([1.0, 2.0, 3.0, 100.0])
z = (x - x.mean()) / x.std()
r = (x - np.median(x)) / (np.percentile(x, 75) - np.percentile(x, 25))
print(np.round(z, 2), np.round(r, 2))`}</Code>
          <p>Standard scaling against robust scaling (median and interquartile range) with one outlier. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-0.6  -0.58 -0.55  1.73] [-0.06 -0.02  0.02  3.82]", "[-0.6  -0.58 -0.55  1.73] [-1.  -0.5  0.5 97.5]", "[-1.  -0.5  0.5  1. ] [-0.06 -0.02  0.02  3.82]", "[0.   0.01 0.02 1.  ] [-0.06 -0.02  0.02  3.82]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>Scaler</C> with <C>fit(self, X)</C>, which stores each column&rsquo;s mean and standard deviation (a standard deviation of 0 is replaced by 1) and returns self, and <C>transform(self, X)</C>, which applies them. Fitting on training data and reusing the numbers on test data is the whole point.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

class Scaler:
    def fit(self, X):
        return self
    def transform(self, X):
        return (X - X.mean(0)) / X.std(0)
`,
        solution: `import numpy as np

class Scaler:
    def fit(self, X):
        self.mean = X.mean(axis=0)
        sd = X.std(axis=0)
        self.sd = np.where(sd == 0, 1, sd)
        return self
    def transform(self, X):
        return (X - self.mean) / self.sd
`,
        tests: [
          { name: "reuse", code: `import numpy as np
Xtr = np.array([[0.0, 5.0], [2.0, 5.0]]); Xte = np.array([[4.0, 5.0]])
s = Scaler().fit(Xtr)
assert np.allclose(s.transform(Xte), [[3.0, 0.0]]), 'Use the training mean and standard deviation on the test rows.'` },
          { name: "sklearn", code: `import numpy as np
from sklearn.preprocessing import StandardScaler
rng = np.random.default_rng(0)
X = rng.normal(3, 2, size=(50, 3))
assert np.allclose(Scaler().fit(X).transform(X), StandardScaler().fit_transform(X)), 'Match StandardScaler.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>OneHot</C> with <C>fit(self, column)</C>, which records the sorted distinct categories, and <C>transform(self, column)</C>, which returns a 0/1 NumPy matrix with one column per category (an unseen category becomes a row of zeros); <C>fit</C> returns self. Then write <C>quantile_bins(x, k)</C>, which returns (edges, bins): edges are <C>np.quantile(x, np.linspace(0, 1, k + 1))</C> and each value&rsquo;s bin is <C>np.searchsorted(edges[1:-1], value, side="right")</C>, so bins run 0 … k − 1 with roughly equal counts.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

class OneHot:
    def fit(self, column):
        return self
    def transform(self, column):
        return np.zeros((len(column), 0))

def quantile_bins(x, k):
    return np.zeros(k + 1), np.zeros(len(x), dtype=int)
`,
        solution: `import numpy as np

class OneHot:
    def fit(self, column):
        self.cats = sorted(set(column))
        return self
    def transform(self, column):
        idx = {c: i for i, c in enumerate(self.cats)}
        M = np.zeros((len(column), len(self.cats)))
        for r, c in enumerate(column):
            if c in idx:
                M[r, idx[c]] = 1
        return M

def quantile_bins(x, k):
    edges = np.quantile(x, np.linspace(0, 1, k + 1))
    return edges, np.searchsorted(edges[1:-1], x, side='right')
`,
        tests: [
          { name: "onehot", code: `e = OneHot().fit(['b', 'a', 'c', 'a'])
assert e.cats == ['a', 'b', 'c'] and e.transform(['c', 'z', 'a']).tolist() == [[0, 0, 1], [0, 0, 0], [1, 0, 0]], 'Sorted categories; unseen values become zeros.'` },
          { name: "sklearn", code: `import numpy as np
from sklearn.preprocessing import OneHotEncoder
col = ['red', 'green', 'blue', 'green', 'red']
ref = OneHotEncoder(handle_unknown='ignore').fit(np.array(col)[:, None])
test = ['green', 'purple', 'red']
assert np.array_equal(OneHot().fit(col).transform(test), ref.transform(np.array(test)[:, None]).toarray())` },
          { name: "bins", code: `import numpy as np
rng = np.random.default_rng(0)
x = rng.exponential(size=1000)
edges, b = quantile_bins(x, 4)
assert b.min() == 0 and b.max() == 3 and all(240 <= c <= 260 for c in np.bincount(b)), 'Quantile bins hold about equal counts, even for skewed data.'
edges, b = quantile_bins(np.array([1.0, 2, 3, 4, 5]), 2)
assert edges.tolist() == [1, 3, 5] and b.tolist() == [0, 0, 1, 1, 1], 'A value equal to an inner edge goes right.'` },
        ],
      },
    },
    {
      key: "invariance",
      rung: "prove",
      prompt: (
        <p>
          Prove that rescaling one feature as <M>{"x_j \\mapsto a x_j + b"}</M> with <M>{"a \\ne 0"}</M> does not change the
          predictions of least squares with an intercept, and explain why the same is false for ridge regression.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows that each linear model in the old feature equals one in the new feature, with w_j' = w_j / a and an adjusted intercept, and vice versa.",
          "Concludes the two feature sets give the same set of prediction functions, so the least-squares minimiser gives the same predictions.",
          "Notes the ridge penalty on w_j' corresponds to a penalty a²w_j'² in the old parametrisation, so the trade-off changes.",
          "Concludes the ridge solution, and its predictions, depend on the units.",
        ],
      },
    },
    {
      key: "zstretch",
      rung: "stretch",
      prompt: <p>Training values are 2, 4, 6 and 8. Using the population standard deviation, what is the standardised value of a new point 10? Give three decimal places.</p>,
      answer: { kind: "numeric", value: Math.sqrt(5), tolerance: 0.0003 },
    },
  ],

  teachBack:
    "Explain to a friend why a nearest-neighbour model needs standardised features, why the scaling must be learned from training data alone, and why categories are one-hot encoded.",

  glimpse: (
    <p>
      Next, leakage: the many ways information from the test set or the future creeps into training. Python, NumPy and the
      Command Line shows how to load and clean real tables, and Neural Networks from Scratch puts normalisation inside the network
      itself, layer by layer.
    </p>
  ),
};
