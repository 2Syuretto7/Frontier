import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { BaselineViz } from "@/components/viz/BaselineViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.7.3",
  minutes: 45,
  links: {
    revisits: ["l1.3.3", "l1.3.4", "l1.6.1"],
    parallels: ["m4.6.3"],
    foreshadows: ["l1.7.4", "l2.1.4"],
  },

  puzzle: (
    <>
      <p>
        A startup announces a model that detects a rare disease from blood tests with 97% accuracy. The disease affects 3% of
        the people tested.
      </p>
      <p>
        Can you write down, in one line, a &ldquo;model&rdquo; that matches that accuracy without looking at any blood test?
        What should the startup have reported alongside its number?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        &ldquo;Everyone is healthy&rdquo; is right 97% of the time. A score means little until it is compared with what a
        trivial rule achieves on the same data. That trivial rule is a <strong>baseline</strong>, and beating it is the first
        thing any model has to do.
      </p>
      <BaselineViz />
      <p>
        The model here catches 80% of positives and clears 90% of negatives, whatever the prevalence. When positives are
        common it beats the baseline easily. When they fall below one in nine, the do-nothing rule has higher accuracy, though it
        never finds a single case. The fix is not to give up on the model but to measure what matters.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="baseline">
        <p>
          A <strong>baseline</strong> is a simple predictor whose score sets the bar for a task. Common ones are:
        </p>
        <ul>
          <li>the <strong>majority class</strong>, for classification;</li>
          <li>the <strong>training mean</strong> (or median), for regression;</li>
          <li><strong>persistence</strong>, &ldquo;tomorrow will be like today&rdquo;, for time series;</li>
          <li>a <strong>simple model</strong>, such as logistic regression on a few obvious features;</li>
          <li>the <strong>current system</strong> or <strong>human performance</strong>, when they exist.</li>
        </ul>
      </Definition>

      <Theorem title="the best constant prediction">
        <p>
          Among constant predictions <M>c</M>, the mean <M>{"\\bar y"}</M> minimises the mean squared error, and its error is the
          variance of <M>y</M>:
        </p>
        <MD>{"\\min_c \\frac1n \\sum_i (y_i - c)^2 = \\frac1n \\sum_i (y_i - \\bar y)^2 ."}</MD>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"\\sum_i (y_i - c)^2 = \\sum_i (y_i - \\bar y)^2 + n(\\bar y - c)^2"}</M>; the cross term vanishes because{" "}
          <M>{"\\sum_i (y_i - \\bar y) = 0"}</M>. This is the same argument that put k-means centres at cluster means. The
          second term is zero exactly when <M>{"c = \\bar y"}</M>.
        </p>
      </Proof>

      <Definition title="R²">
        <p>
          The <strong>coefficient of determination</strong> compares a regression model with the mean baseline:
        </p>
        <MD>{"R^2 = 1 - \\frac{\\text{MSE of the model}}{\\text{MSE of predicting } \\bar y} ."}</MD>
        <p>
          It is 0 for the baseline, 1 for a perfect model, and negative for a model worse than the baseline on new data.
        </p>
      </Definition>

      <Definition title="balanced accuracy">
        <p>
          The <strong>balanced accuracy</strong> of a classifier is the average of its recall on each class. For two classes it
          is (recall + specificity)/2. Any rule that ignores its input scores 0.5, whatever the prevalence.
        </p>
      </Definition>

      <Example title="where the lines cross">
        <p>
          A model with recall 0.8 and specificity 0.9, at prevalence <M>{"\\pi"}</M>, has accuracy{" "}
          <M>{"0.8\\pi + 0.9(1 - \\pi) = 0.9 - 0.1\\pi"}</M>. The majority baseline has <M>{"1 - \\pi"}</M>. They are equal when{" "}
          <M>{"0.9\\pi = 0.1"}</M>, that is, <M>{"\\pi = 1/9"}</M>. Below that, accuracy prefers the useless rule, while balanced
          accuracy, 0.85 against 0.5, does not.
        </p>
      </Example>

      <Remark title="baselines keep you honest">
        <p>
          A strong baseline also catches bugs: if a deep network barely beats logistic regression, either the task is simple
          or something is wrong. And when a paper reports a gain, the first question is always: over which baseline, tuned how
          hard?
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "majority",
      rung: "check",
      prompt: <p>97% of cases are negative. What accuracy, as a percentage, does &ldquo;always predict negative&rdquo; achieve?</p>,
      answer: { kind: "numeric", value: 97 },
    },
    {
      key: "r2zero",
      rung: "check",
      prompt: <p>What is the <M>{"R^2"}</M> of a regression model that always predicts the training mean, scored on the training data?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "acc",
      rung: "apply",
      prompt: <p>A model with recall 0.8 and specificity 0.9 is used where 5% of cases are positive. What is its accuracy?</p>,
      answer: { kind: "numeric", value: 0.895 },
    },
    {
      key: "balanced",
      rung: "apply",
      prompt: <p>What is that model&rsquo;s balanced accuracy?</p>,
      answer: { kind: "numeric", value: 0.85 },
    },
    {
      key: "r2",
      rung: "apply",
      prompt: <p>A model&rsquo;s mean squared error is 4, and the variance of the target is 16. What is its <M>{"R^2"}</M>?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
y = np.array([10, 12, 11, 30, 13])
print(np.mean(np.abs(y - y.mean())), np.mean(np.abs(y - np.median(y))))`}</Code>
          <p>Two constant baselines, judged by mean absolute error. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.92 4.4", "4.4 5.92", "5.92 5.92", "0.0 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>baselines(y_train, y_test)</C>, which returns a dict of test mean squared errors for three baselines: <C>"mean"</C> (predict the training mean), <C>"median"</C> (the training median) and <C>"last"</C> (for a time series, predict each test value by the previous actual value, using the last training value for the first).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def baselines(y_train, y_test):
    return {'mean': 0.0, 'median': 0.0, 'last': 0.0}
`,
        solution: `import numpy as np

def baselines(y_train, y_test):
    mse = lambda p: float(np.mean((y_test - p) ** 2))
    prev = np.concatenate([[y_train[-1]], y_test[:-1]])
    return {'mean': mse(np.mean(y_train)), 'median': mse(np.median(y_train)), 'last': mse(prev)}
`,
        tests: [
          { name: "values", code: `import numpy as np
b = baselines(np.array([1.0, 2.0, 3.0, 10.0]), np.array([11.0, 12.0]))
assert abs(b['mean'] - ((11 - 4) ** 2 + (12 - 4) ** 2) / 2) < 1e-9 and abs(b['median'] - ((11 - 2.5) ** 2 + (12 - 2.5) ** 2) / 2) < 1e-9 and abs(b['last'] - 1.0) < 1e-9, 'For a trend, predicting the last value is a hard baseline to beat.'` },
        ],
      },
    },
    {
      key: "meanbest",
      rung: "prove",
      prompt: <p>Prove that the constant minimising the mean squared error on <M>{"y_1, \\dots, y_n"}</M> is <M>{"\\bar y"}</M>, that its error is the variance, and deduce the value of <M>{"R^2"}</M> for this predictor.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes y_i − c = (y_i − ȳ) + (ȳ − c) and expands the sum of squares.",
          "Shows the cross term is zero because the deviations from the mean sum to zero.",
          "Concludes the sum is Σ(y_i − ȳ)² + n(ȳ − c)², minimised uniquely at c = ȳ, with mean error equal to the variance.",
          "Deduces R² = 1 − variance / variance = 0.",
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: <p>At what prevalence of positives does a model with recall 0.8 and specificity 0.9 have the same accuracy as the majority baseline? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 1 / 9, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend why a model's score means nothing without a baseline, name three baselines, and say why balanced accuracy suits rare classes better than accuracy.",

  glimpse: (
    <p>
      Next, error analysis: reading what a model gets wrong to decide what to do next. Statistical Machine Learning grounds the
      choice of metric in decision theory, where the costs of different mistakes are made explicit.
    </p>
  ),
};
