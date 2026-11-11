import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { BestOfKViz } from "@/components/viz/BestOfKViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.1.4",
  minutes: 50,
  links: {
    revisits: ["l1.1.2", "l1.1.3", "l0.5.3"],
    parallels: ["m9.8.1"],
    foreshadows: ["l1.5.2", "l10.1.3", "l10.2.1"],
  },

  puzzle: (
    <>
      <p>
        A team tries 50 versions of a model, scores each on the test set, and reports the best: 74% accuracy, up from 70%.
        In fact, every one of the 50 versions is exactly as good as the original.
      </p>
      <p>
        How could the reported number be 74%? What should the team have done differently so that the number they report
        means what it seems to mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A test score is a measurement with random error: on a different sample of questions, the same model would score a
        little higher or lower. If you try many models and keep the one with the luckiest score, you have selected for luck.
        The test set has quietly become part of training.
      </p>
      <BestOfKViz />
      <p>
        The cure is to keep decisions and final measurement apart. Make every choice on one set of data, and measure the
        final, chosen model once on another that played no part in the choice.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="three sets">
        <p>The available labelled data are split, before any modelling, into three disjoint parts:</p>
        <ul>
          <li>the <strong>training set</strong>, used to fit each model&rsquo;s parameters;</li>
          <li>the <strong>validation set</strong>, used to compare models and choose settings such as the degree, called <strong>hyperparameters</strong>;</li>
          <li>the <strong>test set</strong>, used once, at the very end, to estimate the error of the single chosen model.</li>
        </ul>
        <p>A common split is 70%, 15% and 15%, though with very large datasets far smaller fractions suffice for validation and test.</p>
      </Definition>

      <Definition title="selection bias">
        <p>
          Suppose <M>K</M> models each have true accuracy <M>a</M>, and each is scored on its own test sample of <M>m</M>{" "}
          questions, giving scores that vary by about
        </p>
        <MD>{"\\sigma = \\sqrt{\\frac{a(1 - a)}{m}}."}</MD>
        <p>
          The best of <M>K</M> such scores exceeds <M>a</M> on average by a multiple of <M>{"\\sigma"}</M> that grows with{" "}
          <M>K</M>: about <M>{"0.56\\,\\sigma"}</M> for 2 models, <M>{"1.9\\,\\sigma"}</M> for 20, and{" "}
          <M>{"2.5\\,\\sigma"}</M> for 100. Reporting the best score therefore overstates the chosen model by an amount that
          depends on how many models were tried.
        </p>
      </Definition>

      <Example title="the puzzle explained">
        <p>
          With 200 test questions and true accuracy 70%, <M>{"\\sigma = \\sqrt{0.21/200} \\approx 3.2"}</M> percentage
          points. The best of 50 is typically about <M>{"2.2\\,\\sigma \\approx 7"}</M> points above 70%. A report of 74%
          is entirely unsurprising even though nothing improved. Had the team chosen on a validation set and then measured
          once on an untouched test set, they would have seen about 70%.
        </p>
      </Example>

      <Remark title="leaks are subtle">
        <p>
          The test set can leak in quieter ways: looking at test errors to decide which features to add, tuning a threshold
          after seeing test results, or re-splitting the data until the numbers look good. Each is a decision made with test
          data. In machine learning research the same problem appears at the scale of a whole field, when many papers tune
          against one public benchmark. When data are scarce, cross-validation, later in this course, makes the most of
          every example while keeping the same discipline.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "once",
      rung: "check",
      prompt: <p>When should the test set be used?</p>,
      answer: { kind: "choice", options: ["Once, at the end, to measure the chosen model", "Whenever comparing two models", "To fit the parameters"], correct: [0] },
    },
    {
      key: "hyper",
      rung: "check",
      prompt: <p>Which set is used to choose the degree of a polynomial model?</p>,
      answer: { kind: "choice", options: ["The validation set", "The training set", "The test set"], correct: [0] },
    },
    {
      key: "split",
      rung: "apply",
      prompt: <p>10,000 labelled examples are split 70%, 15% and 15%. How many are in the test set?</p>,
      answer: { kind: "numeric", value: 1500 },
    },
    {
      key: "sigma",
      rung: "apply",
      prompt: <p>A model with true accuracy 70% is tested on 200 questions. By the lesson&rsquo;s formula, about how many percentage points is <M>{"\\sigma"}</M>? Give one decimal place.</p>,
      answer: { kind: "numeric", value: 3.2, tolerance: 0.02 },
    },
    {
      key: "scenario",
      rung: "apply",
      prompt: <p>A student tunes a model&rsquo;s threshold until its test accuracy is highest, then reports that accuracy. The reported number is most likely:</p>,
      answer: { kind: "choice", options: ["Too optimistic", "Too pessimistic", "Unbiased"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`n = 1000
idx = list(range(n))
train, val, test = idx[:700], idx[700:850], idx[850:]
print(len(train), len(val), len(test), set(train) & set(test) == set())`}</Code>
          <p>A 70/15/15 split. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["700 150 150 True", "700 150 150 False", "700 15 15 True", "700 150 149 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>select_and_report(models, X, y)</C>. Split the rows in order 60/20/20 into train, validation and test. Fit every model on train, pick the one with the best validation score, and return (index of that model, its test score). The test set is touched once, at the end.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def select_and_report(models, X, y):
    scores = [m.fit(X, y).score(X, y) for m in models]
    i = scores.index(max(scores))
    return i, scores[i]
`,
        solution: `def select_and_report(models, X, y):
    n = len(X)
    a, b = int(0.6 * n), int(0.8 * n)
    val = [m.fit(X[:a], y[:a]).score(X[a:b], y[a:b]) for m in models]
    i = val.index(max(val))
    return i, models[i].score(X[b:], y[b:])
`,
        tests: [
          { name: "choose", code: `import numpy as np
from sklearn.tree import DecisionTreeClassifier
rng = np.random.default_rng(0)
X = rng.normal(size=(500, 2)); y = (X[:, 0] + 0.5 * rng.normal(size=500) > 0).astype(int)
models = [DecisionTreeClassifier(max_depth=d, random_state=0) for d in (1, 2, None)]
i, s = select_and_report(models, X, y)
assert i != 2 and 0.7 < s < 1.0, 'Choose on validation data; the unlimited tree only wins on training data.'` },
        ],
      },
    },
    {
      key: "why",
      rung: "prove",
      prompt: (
        <p>
          Explain why choosing the best of many models by their test scores makes the winning test score an overestimate,
          even if every model is equally good, and describe a procedure that gives an unbiased estimate of the chosen
          model&rsquo;s accuracy.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that each test score contains random error from the particular sample of test examples.",
          "Explains that picking the maximum selects the score with the most favourable error, so its expected value exceeds the true accuracy.",
          "Notes that the overestimate grows with the number of models compared.",
          "Describes choosing with a validation set and then measuring the single chosen model once on a separate, untouched test set.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: (
        <p>
          The expected maximum of two independent standard normal variables is <M>{"1/\\sqrt{\\pi}"}</M>. With{" "}
          <M>{"\\sigma"}</M> as in the exercise above, by how many percentage points does choosing the better of two equally
          good models inflate the expected reported score? Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 1.83, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend why data are split into training, validation and test sets, and how choosing the best of many models by test score inflates the result.",

  glimpse: (
    <p>
      This completes The learning problem. Next, linear regression, the first model fitted in earnest. Cross-validation
      returns to the validation set when data are scarce, and Evaluation and the Science of Deep Learning studies
      contamination and error bars for the benchmarks that whole fields tune against.
    </p>
  ),
};
