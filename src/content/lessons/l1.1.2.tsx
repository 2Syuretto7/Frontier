import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LearningCurveViz } from "@/components/viz/LearningCurveViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.1.2",
  minutes: 50,
  links: {
    revisits: ["l0.1.2", "l0.1.3", "l1.1.1"],
    parallels: ["m0.8.1"],
    foreshadows: ["l1.5.1", "m7.6.3"],
  },

  puzzle: (
    <>
      <p>
        A student prepares for an exam by memorising the answers to last year&rsquo;s paper. On last year&rsquo;s paper they
        score 100%.
      </p>
      <p>
        What does that score tell you about how they will do this year? What score would actually tell you how well they have
        learned the subject? Now replace &ldquo;student&rdquo; with &ldquo;model&rdquo;.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model is fitted to make its errors small on the examples it is trained on, so its error there flatters it, just as
        last year&rsquo;s paper flatters the student. What we care about is its error on <em>new</em> examples. The honest
        estimate comes from examples kept aside and never used in training: a <strong>test set</strong>.
      </p>
      <p>
        Below, the same flexible model is trained on datasets of different sizes. Watch the gap between the two errors.
      </p>
      <LearningCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="loss">
        <p>
          A <strong>loss function</strong> <M>{"\\ell(\\hat y, y)"}</M> measures how bad a prediction <M>{"\\hat y"}</M> is
          when the truth is <M>y</M>. For regression the usual choice is the squared error{" "}
          <M>{"(\\hat y - y)^2"}</M>; for classification, the <strong>0-1 loss</strong>, which is 1 for a wrong label and 0
          for a right one.
        </p>
      </Definition>

      <Definition title="training and test error">
        <p>
          The <strong>training error</strong> of a model <M>f</M> is its average loss on the <M>n</M> training examples:
        </p>
        <MD>{"\\text{train error} = \\frac{1}{n} \\sum_{i=1}^{n} \\ell\\big(f(x_i), y_i\\big)."}</MD>
        <p>
          The <strong>test error</strong> is the same average over a separate set of examples not used in training. With
          squared error, these averages are called the <strong>mean squared error</strong> (MSE); with 0-1 loss, the{" "}
          <strong>error rate</strong>, one minus the accuracy.
        </p>
      </Definition>

      <Definition title="generalisation">
        <p>
          Assume the training and test examples are drawn independently from the same distribution, the{" "}
          <strong>i.i.d. assumption</strong>. The <strong>generalisation error</strong> is the expected loss on a fresh
          example from that distribution. The test error estimates it; the training error does not, because the model was
          chosen to make the training error small. The difference is the <strong>generalisation gap</strong>.
        </p>
      </Definition>

      <Example title="computing an error">
        <p>
          A model predicts 3, 5 and 7 for three test flats whose true prices are 2, 5 and 9. Its test MSE is{" "}
          <M>{"\\tfrac13\\big((3-2)^2 + 0^2 + (7-9)^2\\big) = \\tfrac53 \\approx 1.67"}</M>. A classifier that gets 18 of 240
          test emails wrong has error rate <M>{"18/240 = 0.075"}</M>, or accuracy 92.5%.
        </p>
      </Example>

      <Remark title="the noise floor and the learning curve">
        <p>
          If the label itself contains noise, so that <M>{"y = g(x) + \\varepsilon"}</M> with noise of variance{" "}
          <M>{"\\sigma^2"}</M>, then even the perfect model <M>g</M> has expected squared error <M>{"\\sigma^2"}</M> on new
          data. This is the <strong>irreducible error</strong>, the dotted line in the visualisation. A plot of training and
          test error against the amount of data is a <strong>learning curve</strong>. A large gap says more data, or a simpler
          model, would help; two curves that have met above the noise floor say the model itself is too simple. And when the
          i.i.d. assumption fails, for example because the world changes after training, even an honest test error can be
          too optimistic.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>Which error estimates how well a model will do on new data?</p>,
      answer: { kind: "choice", options: ["Test error", "Training error", "Neither"], correct: [0] },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>What sets a lower limit on the test error that any model can reach?</p>,
      answer: { kind: "choice", options: ["The noise in the labels", "The number of features", "The learning rate"], correct: [0] },
    },
    {
      key: "mse",
      rung: "apply",
      prompt: <p>A model predicts 4, 1 and 6 where the true values are 2, 1 and 7. What is its mean squared error? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 1.67, tolerance: 0.005 },
    },
    {
      key: "rate",
      rung: "apply",
      prompt: <p>A classifier gets 18 of 240 test examples wrong. What is its error rate, as a decimal?</p>,
      answer: { kind: "numeric", value: 0.075 },
    },
    {
      key: "curve",
      rung: "apply",
      prompt: <p>A model&rsquo;s training error is 0.02 and its test error 0.40, far above the noise level. Which change is most likely to help?</p>,
      answer: { kind: "choice", options: ["More training data or a simpler model", "A more flexible model", "Measuring training error more carefully"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train = [(1, 2.1), (2, 3.9), (3, 6.2), (4, 7.8)]
test = [(1.4, 2.8), (2.6, 5.2), (3.5, 7.0)]

def predict(x):
    best = train[0]
    for p in train:
        if abs(p[0] - x) < abs(best[0] - x):
            best = p
    return best[1]

def mse(data):
    return sum((predict(x) - y) ** 2 for x, y in data) / len(data)

print(mse(train), round(mse(test), 2))`}</Code>
          <p>A model that memorises its training points and answers with the nearest one. What are its training and test errors?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 0.71", "0.71 0.0", "0.0 2.13", "0.0 0.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [0, 1, 2, 3]
ys = [x ** 2 for x in xs]
mx, my = sum(xs) / 4, sum(ys) / 4
m = sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sum((x - mx) ** 2 for x in xs)
c = my - m * mx
print(m, c, [m * x + c for x in (4, 5)])`}</Code>
          <p>The least-squares line through the first four points of y = x², then used at x = 4 and 5, where the true values are 16 and 25. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 -1.0 [11.0, 14.0]", "3.0 -1.0 [16.0, 25.0]", "3.0 1.0 [13.0, 16.0]", "2.0 0.0 [8.0, 10.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>errors(model, X, y, n_train)</C>, which fits the model on the first n_train rows and returns (training MSE, test MSE) on the two parts. The gap between them is what this lesson is about.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def errors(model, X, y, n_train):
    model.fit(X, y)
    e = ((model.predict(X) - y) ** 2).mean()
    return (e, e)
`,
        solution: `def errors(model, X, y, n_train):
    model.fit(X[:n_train], y[:n_train])
    tr = ((model.predict(X[:n_train]) - y[:n_train]) ** 2).mean()
    te = ((model.predict(X[n_train:]) - y[n_train:]) ** 2).mean()
    return (tr, te)
`,
        tests: [
          { name: "gap", code: `import numpy as np
from sklearn.tree import DecisionTreeRegressor
rng = np.random.default_rng(0)
X = rng.uniform(0, 1, (200, 1)); y = np.sin(6 * X[:, 0]) + rng.normal(0, 0.3, 200)
tr, te = errors(DecisionTreeRegressor(random_state=0), X, y, 100)
assert tr < 1e-12 and te > 0.05, 'Train on the first part only; the test error must use rows the model never saw.'` },
          { name: "mean model", code: `import numpy as np
from sklearn.dummy import DummyRegressor
tr, te = errors(DummyRegressor(), np.zeros((4, 1)), np.array([0.0, 0.0, 2.0, 2.0]), 2)
assert tr == 0 and te == 4, 'The mean of the first two targets is 0, which is off by 2 on the rest.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Fit a line through the origin, y ≈ wx, to n noisy points. The training error comes out below the noise level σ², about σ²(1 − 1/n), while the test error comes out above it. Check this by simulation. Write <C>simulate_errors(n, sigma, trials, seed)</C>: with one <C>random.Random(seed)</C>, in each trial draw n values of x from <C>rng.gauss(0, 1)</C> and set each y = 2x + <C>rng.gauss(0, sigma)</C>; fit w = Σxy / Σx²; then draw 500 test points the same way. Record both mean squared errors, and return (mean training error, mean test error) over the trials.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def simulate_errors(n, sigma, trials, seed):
    return sigma ** 2, sigma ** 2
`,
        solution: `import random

def simulate_errors(n, sigma, trials, seed):
    rng = random.Random(seed)
    train, test = [], []
    for _ in range(trials):
        xs = [rng.gauss(0, 1) for _ in range(n)]
        ys = [2 * x + rng.gauss(0, sigma) for x in xs]
        w = sum(x * y for x, y in zip(xs, ys)) / sum(x * x for x in xs)
        train.append(sum((w * x - y) ** 2 for x, y in zip(xs, ys)) / n)
        xt = [rng.gauss(0, 1) for _ in range(500)]
        yt = [2 * x + rng.gauss(0, sigma) for x in xt]
        test.append(sum((w * x - y) ** 2 for x, y in zip(xt, yt)) / 500)
    return sum(train) / trials, sum(test) / trials
`,
        tests: [
          { name: "theory", code: `tr, te = simulate_errors(5, 1.0, 400, 0)
assert abs(tr - 0.8) < 0.06, f'Training error {tr:.3f} should be close to 1 − 1/5 = 0.8.'
assert 1.15 < te < 1.5, f'Test error {te:.3f} should be clearly above the noise level 1.'` },
          { name: "one point", code: `tr, te = simulate_errors(1, 1.0, 50, 1)
assert tr < 1e-20 and te > 5, 'With one point the line fits the noise exactly and fails on new data.'` },
          { name: "seeded", code: `assert simulate_errors(10, 2.0, 20, 5) == simulate_errors(10, 2.0, 20, 5)` },
        ],
      },
    },
    {
      key: "optimistic",
      rung: "prove",
      prompt: (
        <p>
          Explain why the training error of a fitted model is usually lower than its error on new data, and why the test set
          must not be used in any way during training.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that fitting chooses the model to make the training error small, including by fitting the noise in those particular examples.",
          "Notes that the noise in new examples is different, so what was fitted to noise does not carry over.",
          "Explains that the test error estimates generalisation only if the test examples played no part in choosing the model.",
          "Notes that any use of the test set in training or choosing makes its error optimistic too.",
        ],
      },
    },
    {
      key: "sigma",
      rung: "stretch",
      prompt: <p>Labels contain noise with standard deviation 0.3. What is the smallest test mean squared error any model can expect?</p>,
      answer: { kind: "numeric", value: 0.09 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between training error and test error, why the first is optimistic, and what a learning curve tells you.",

  glimpse: (
    <p>
      Next, overfitting: what happens when a model is flexible enough to memorise its training data. The noise floor and the
      gap between the errors return as bias and variance later in this course, and Probability explains why the best
      possible prediction under squared error is a conditional mean.
    </p>
  ),
};
