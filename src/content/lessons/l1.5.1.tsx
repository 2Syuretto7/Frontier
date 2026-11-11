import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { BiasVarianceViz } from "@/components/viz/BiasVarianceViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.5.1",
  minutes: 55,
  links: {
    revisits: ["l1.1.3", "l1.4.4", "l1.2.3"],
    parallels: ["m4.6.3"],
    foreshadows: ["l1.5.3", "l2.1.3", "l3.7.1"],
  },

  puzzle: (
    <>
      <p>
        Two archers shoot ten arrows each. The first archer&rsquo;s arrows land in a tight cluster, but the cluster is a hand
        to the left of the bullseye. The second archer&rsquo;s arrows are scattered all over the target, but their average
        position is dead centre.
      </p>
      <p>
        Which archer is better? What would you change about each one? Now imagine each arrow is a model trained on a
        different random dataset.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The first archer is <strong>biased</strong>: consistently wrong in the same direction. The second has high{" "}
        <strong>variance</strong>: right on average, but any single shot can be far off. A model trained on one dataset is one
        arrow. Train the same kind of model on many independent datasets and you see its bias and variance directly.
      </p>
      <BiasVarianceViz />
      <p>
        A straight line cannot bend to follow a sine wave, however much data you give it: that is bias. A degree-9 polynomial
        on 15 points can follow anything, including the noise, so it changes wildly from one dataset to the next: that is
        variance. Expected test error is the sum of the two, plus the noise in the data, and the best model balances them.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the setting">
        <p>
          Data come from <M>{"y = f(x) + \\varepsilon"}</M>, where <M>{"\\varepsilon"}</M> has mean 0 and variance{" "}
          <M>{"\\sigma^2"}</M> and is independent of everything else. A learning method, trained on a random dataset{" "}
          <M>D</M>, produces a prediction <M>{"\\hat f_D(x)"}</M>. At a fixed input <M>x</M>, define
        </p>
        <MD>{"\\bar f(x) = \\mathbb{E}_D \\hat f_D(x), \\quad \\operatorname{bias}(x) = \\bar f(x) - f(x), \\quad \\operatorname{var}(x) = \\mathbb{E}_D\\big(\\hat f_D(x) - \\bar f(x)\\big)^2 ."}</MD>
      </Definition>

      <Theorem title="bias-variance decomposition">
        <p>
          For a new point <M>{"y = f(x) + \\varepsilon"}</M> independent of <M>D</M>,
        </p>
        <MD>{"\\mathbb{E}\\big(y - \\hat f_D(x)\\big)^2 = \\sigma^2 + \\operatorname{bias}(x)^2 + \\operatorname{var}(x)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"y - \\hat f_D = \\varepsilon + (f - \\bar f) + (\\bar f - \\hat f_D)"}</M>, dropping the <M>x</M>. Square
          and take expectations. The three squares give <M>{"\\sigma^2"}</M>, <M>{"\\operatorname{bias}^2"}</M> and{" "}
          <M>{"\\operatorname{var}"}</M>. The cross terms vanish: <M>{"\\varepsilon"}</M> has mean 0 and is independent of{" "}
          <M>D</M>, so both terms containing it have expectation 0; and <M>{"f - \\bar f"}</M> is a constant, while{" "}
          <M>{"\\mathbb{E}_D(\\bar f - \\hat f_D) = 0"}</M> by the definition of <M>{"\\bar f"}</M>.
        </p>
      </Proof>

      <Example title="shrinking an average">
        <p>
          Estimate a mean <M>{"\\mu"}</M> from <M>n</M> samples of variance <M>{"\\sigma^2"}</M> by <M>{"c\\,\\bar x"}</M>{" "}
          for some <M>{"0 < c \\le 1"}</M>. The bias is <M>{"(c - 1)\\mu"}</M> and the variance is{" "}
          <M>{"c^2 \\sigma^2 / n"}</M>. With <M>{"\\mu = 2"}</M>, <M>{"\\sigma^2 = 4"}</M>, <M>{"n = 10"}</M> and{" "}
          <M>{"c = 0.5"}</M>, the squared bias is 1 and the variance is 0.1, so the mean squared error is 1.1. The plain
          average, <M>{"c = 1"}</M>, has no bias and variance 0.4: better here. But when <M>{"\\sigma^2/n"}</M> is large compared
          with <M>{"\\mu^2"}</M>, shrinking wins. Accepting a little bias to buy a large cut in variance is the idea behind
          regularisation.
        </p>
      </Example>

      <Remark title="what to do about each">
        <p>
          High bias, seen as training error itself being high: use a more flexible model or better features. High variance,
          seen as a large gap between training and validation error: get more data, simplify the model, regularise, or
          average many models as a random forest does. The noise term <M>{"\\sigma^2"}</M> is a floor no model goes below.
        </p>
      </Remark>

      <Remark title="a modern twist">
        <p>
          The U-shaped curve is not the whole story. Very large models, with far more parameters than training examples, can
          see test error fall again after the point where they fit the training data exactly, an effect called{" "}
          <strong>double descent</strong>. The decomposition still holds; what changes is how variance behaves in such models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>A degree-12 polynomial is fitted to 15 noisy points. Which term of its expected test error is likely to be large?</p>,
      answer: { kind: "choice", options: ["Variance", "Squared bias", "Neither"], correct: [0] },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>Which term can no choice of model reduce?</p>,
      answer: { kind: "choice", options: ["The noise variance σ²", "The squared bias", "The variance"], correct: [0] },
    },
    {
      key: "sum",
      rung: "apply",
      prompt: <p>At some input, a method has squared bias 0.04 and variance 0.10, and the noise variance is 0.09. What is its expected squared error on a new point there?</p>,
      answer: { kind: "numeric", value: 0.23 },
    },
    {
      key: "bias2",
      rung: "apply",
      prompt: <p>The estimator <M>{"0.5\\,\\bar x"}</M> estimates a mean <M>{"\\mu = 2"}</M>. What is its squared bias?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "msec",
      rung: "apply",
      prompt: <p>With <M>{"\\sigma^2 = 4"}</M> and <M>{"n = 10"}</M> as well, what is the mean squared error of <M>{"0.5\\,\\bar x"}</M>?</p>,
      answer: { kind: "numeric", value: 1.1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
rng = np.random.default_rng(0)
preds = []
for _ in range(500):
    x = rng.uniform(-1, 1, 10); y = x ** 2 + rng.normal(0, 0.1, 10)
    preds.append(np.polyval(np.polyfit(x, y, 1), 0.0))
print(round(np.mean(preds) - 0.0, 1) > 0, np.var(preds) < 0.05)`}</Code>
          <p>A straight line fitted to y = x², predicting at x = 0, over 500 datasets. Is it biased upward, and is its variance small?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True", "True False", "False True", "False False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
preds = np.array([2.0, 4.0, 3.0, 5.0])
truth = 3.0
print(np.mean((preds - truth) ** 2), (preds.mean() - truth) ** 2 + preds.var())`}</Code>
          <p>Mean squared error of four predictions of the same quantity, against bias² + variance. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.5 1.5", "1.5 1.25", "1.25 1.5", "6.0 1.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bias_variance(degree, x0, trials, seed)</C>. With <C>np.random.default_rng(seed)</C>, repeat <C>trials</C> times: draw 15 x values uniform on [−1, 1], set y = sin(3x) + noise with standard deviation 0.3, fit <C>np.polyfit</C> of the given degree and predict at x0. Return (bias², variance) of the predictions against the truth sin(3·x0).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bias_variance(degree, x0, trials, seed):
    return (0.0, 0.0)
`,
        solution: `import numpy as np

def bias_variance(degree, x0, trials, seed):
    rng = np.random.default_rng(seed)
    preds = []
    for _ in range(trials):
        x = rng.uniform(-1, 1, 15)
        y = np.sin(3 * x) + rng.normal(0, 0.3, 15)
        preds.append(np.polyval(np.polyfit(x, y, degree), x0))
    preds = np.array(preds)
    return (float((preds.mean() - np.sin(3 * x0)) ** 2), float(preds.var()))
`,
        tests: [
          { name: "trade-off", code: `b1, v1 = bias_variance(1, 0.5, 400, 0)
b5, v5 = bias_variance(5, 0.5, 400, 0)
assert b1 > b5 and v5 > v1, 'Simple models have more bias; flexible ones have more variance.'` },
          { name: "seeded", code: `a = bias_variance(3, 0.2, 50, 1); b = bias_variance(3, 0.2, 50, 1)
assert a == b and all(isinstance(v, float) and v >= 0 for v in a), 'Seeded, non-negative floats.'` },
          { name: "flexible", code: `b7, v7 = bias_variance(7, 0.0, 300, 2)
b0, v0 = bias_variance(0, 0.9, 300, 2)
assert b7 < 0.01 and b0 > 0.1, 'A degree-7 fit is nearly unbiased; a constant is badly biased where sin(3x) is far from its average.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>decompose(preds, truth, noise_var)</C> for a matrix of predictions (rows are repeated trainings, columns are test points) and the true function values at those points: return (bias², variance, expected error), each averaged over points, where expected error = bias² + variance + noise. Then write <C>bagging_variance(preds, B, seed)</C>, which estimates the variance of an average of B models: draw, with one <C>np.random.default_rng(seed)</C>, 2000 groups of B row indices (<C>rng.integers</C>, shape (2000, B)), average each group&rsquo;s rows, and return the mean over points of the variance of those averages.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def decompose(preds, truth, noise_var):
    return 0.0, 0.0, noise_var

def bagging_variance(preds, B, seed):
    return 0.0
`,
        solution: `import numpy as np

def decompose(preds, truth, noise_var):
    preds = np.asarray(preds, float)
    b2 = float(np.mean((preds.mean(0) - truth) ** 2))
    v = float(np.mean(preds.var(0)))
    return b2, v, b2 + v + noise_var

def bagging_variance(preds, B, seed):
    rng = np.random.default_rng(seed)
    idx = rng.integers(0, len(preds), (2000, B))
    avg = np.asarray(preds, float)[idx].mean(1)
    return float(np.mean(avg.var(0)))
`,
        tests: [
          { name: "values", code: `import numpy as np
b2, v, e = decompose(np.array([[2.0, 0.0], [4.0, 2.0]]), np.array([3.0, 0.0]), 0.5)
assert b2 == (0 + 1) / 2 and v == 1 and e == 2, 'Point 1 is unbiased with variance 1; point 2 has bias 1 and variance 1.'` },
          { name: "monte carlo", code: `import numpy as np
rng = np.random.default_rng(0)
truth = np.sin(np.linspace(0, 3, 20)); preds = truth + 0.3 + rng.normal(0, 0.5, (5000, 20))
b2, v, e = decompose(preds, truth, 0.1)
assert abs(b2 - 0.09) < 0.005 and abs(v - 0.25) < 0.01 and abs(e - (b2 + v + 0.1)) < 1e-12` },
          { name: "bagging", code: `import numpy as np
rng = np.random.default_rng(1)
preds = rng.normal(0, 1, (3000, 10))
v1, v10 = bagging_variance(preds, 1, 0), bagging_variance(preds, 10, 0)
assert abs(v1 - 1) < 0.1 and abs(v10 - 0.1) < 0.02, 'Averaging B independent models divides the variance by B.'
same = np.tile(rng.normal(0, 1, (1, 10)), (3000, 1)) + rng.normal(0, 0.01, (3000, 10))
assert bagging_variance(same, 10, 0) < 1e-3, 'Identical models gain nothing from averaging.'` },
        ],
      },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Prove the bias-variance decomposition <M>{"\\mathbb{E}(y - \\hat f_D(x))^2 = \\sigma^2 + \\operatorname{bias}^2 + \\operatorname{var}"}</M>,
          stating exactly where you use independence and where you use the definition of <M>{"\\bar f"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Splits y − f̂ into ε + (f − f̄) + (f̄ − f̂) and expands the square into three squares and three cross terms.",
          "Identifies the expectations of the squares as σ², bias² and variance.",
          "Kills the cross terms with ε using E ε = 0 and the independence of ε from the training data.",
          "Kills the remaining cross term because f − f̄ is constant in D and E_D(f̄ − f̂) = 0 by definition of f̄.",
        ],
      },
    },
    {
      key: "bestc",
      rung: "stretch",
      prompt: <p>For the estimator <M>{"c\\,\\bar x"}</M> with <M>{"\\mu = 1"}</M>, <M>{"\\sigma^2 = 4"}</M> and <M>{"n = 4"}</M>, which <M>c</M> minimises the mean squared error?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend what bias and variance are, using the archers, and why the best model is usually not the most flexible one.",

  glimpse: (
    <p>
      Next, cross-validation, the practical way to find where bias and variance balance. Statistical Machine Learning shows that
      regularisation is a prior belief in disguise, and Neural Networks from Scratch meets the same trade-off in weight decay,
      dropout and early stopping.
    </p>
  ),
};
