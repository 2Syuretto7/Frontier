import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LeastSquaresViz } from "@/components/viz/LeastSquaresViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.2.1",
  minutes: 55,
  links: {
    revisits: ["l0.3.1", "l0.2.2"],
    parallels: ["m0.8.1", "m0.6.2"],
    foreshadows: ["m3.5.3", "l2.2.1", "m9.6.2"],
  },

  puzzle: (
    <>
      <p>
        Eight students report how many hours they revised and the marks they got. You want a straight line that predicts
        marks from hours. Many lines look reasonable.
      </p>
      <p>
        You need a rule that picks out exactly one line, so that two people given the same data always get the same answer.
        What would you measure about a line to decide how good it is? Why might you square the errors rather than just add
        them up?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For each student, the line&rsquo;s error is the gap between the actual mark and the predicted one. Adding the errors
        does not work, because positive and negative errors cancel. Squaring them makes every error count, and counts large
        errors heavily. The <strong>least-squares</strong> line is the one with the smallest total of squared errors.
      </p>
      <p>Try to find it by hand. Then let the formula find it.</p>
      <LeastSquaresViz />
    </>
  ),

  theory: (
    <>
      <Definition title="simple linear regression">
        <p>
          Given examples <M>{"(x_1, y_1), \\ldots, (x_n, y_n)"}</M>, the model is <M>{"\\hat y = w_0 + w_1 x"}</M>. The{" "}
          <strong>residual</strong> of example <M>i</M> is <M>{"r_i = y_i - (w_0 + w_1 x_i)"}</M>, and the{" "}
          <strong>least-squares</strong> line chooses <M>{"w_0, w_1"}</M> to minimise the sum of squared errors
        </p>
        <MD>{"\\text{SSE}(w_0, w_1) = \\sum_{i=1}^{n} \\big(y_i - w_0 - w_1 x_i\\big)^2."}</MD>
      </Definition>

      <Theorem title="the least-squares line">
        <p>
          With means <M>{"\\bar x"}</M> and <M>{"\\bar y"}</M>, the minimum is at
        </p>
        <MD>{"w_1 = \\frac{\\sum_i (x_i - \\bar x)(y_i - \\bar y)}{\\sum_i (x_i - \\bar x)^2}, \\qquad w_0 = \\bar y - w_1 \\bar x."}</MD>
        <p>In particular, the line passes through the point of means <M>{"(\\bar x, \\bar y)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Fix <M>{"w_1"}</M> and write <M>{"u_i = y_i - w_1 x_i"}</M>. Then <M>{"\\text{SSE} = \\sum_i (u_i - w_0)^2"}</M>,
          and a sum of squared distances from <M>{"w_0"}</M> is smallest when <M>{"w_0"}</M> is the mean of the{" "}
          <M>{"u_i"}</M>: writing <M>{"u_i - w_0 = (u_i - \\bar u) + (\\bar u - w_0)"}</M> and expanding gives{" "}
          <M>{"\\sum_i (u_i - \\bar u)^2 + n(\\bar u - w_0)^2"}</M>, because the cross terms add to zero. That mean is <M>{"\\bar y - w_1 \\bar x"}</M>. Substituting, the
          SSE becomes <M>{"\\sum_i \\big((y_i - \\bar y) - w_1 (x_i - \\bar x)\\big)^2"}</M>, a quadratic in{" "}
          <M>{"w_1"}</M> of the form <M>{"A w_1^2 - 2B w_1 + C"}</M> with <M>{"A = \\sum (x_i - \\bar x)^2"}</M> and{" "}
          <M>{"B = \\sum (x_i - \\bar x)(y_i - \\bar y)"}</M>. Its minimum is at <M>{"w_1 = B/A"}</M>, the vertex of the
          parabola.
        </p>
      </Proof>

      <Definition title="many features, in matrix form">
        <p>
          With <M>d</M> features, put a column of ones in front of the feature matrix to make <M>X</M>, so that{" "}
          <M>{"\\hat y = Xw"}</M> for a weight vector <M>w</M>. The least-squares weights solve the{" "}
          <strong>normal equations</strong>
        </p>
        <MD>{"X^\\top X\\, w = X^\\top y."}</MD>
        <p>Linear Algebra I shows why: <M>{"Xw"}</M> is then the projection of <M>y</M> onto the columns of <M>X</M>.</p>
      </Definition>

      <Example title="three points">
        <p>
          For <M>{"(1, 2), (2, 4), (3, 5)"}</M>: <M>{"\\bar x = 2"}</M>, <M>{"\\bar y = 11/3"}</M>. The numerator of{" "}
          <M>{"w_1"}</M> is <M>{"(-1)(-\\tfrac53) + 0 + (1)(\\tfrac43) = 3"}</M> and the denominator is 2, so{" "}
          <M>{"w_1 = 1.5"}</M> and <M>{"w_0 = \\tfrac{11}{3} - 3 = \\tfrac23"}</M>. The line predicts{" "}
          <M>{"\\tfrac23 + 1.5 \\times 4 \\approx 6.67"}</M> at <M>{"x = 4"}</M>.
        </p>
      </Example>

      <Remark title="how good is the fit">
        <p>
          The <strong>coefficient of determination</strong>{" "}
          <M>{"R^2 = 1 - \\text{SSE} / \\sum_i (y_i - \\bar y)^2"}</M> compares the line with the best constant prediction,{" "}
          <M>{"\\bar y"}</M>. It is 1 for a perfect fit and 0 for a line no better than the mean. Squared error is not the
          only choice; it is popular because it gives this clean formula, but it lets a single wild point drag the line.
          Absolute error is more robust to outliers, at the cost of a messier calculation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "minimise",
      rung: "check",
      prompt: <p>What does the least-squares line minimise?</p>,
      answer: { kind: "choice", options: ["The sum of the squared residuals", "The sum of the residuals", "The largest residual", "The number of points off the line"], correct: [0] },
    },
    {
      key: "means",
      rung: "check",
      prompt: <p>Which point always lies on the least-squares line?</p>,
      answer: { kind: "choice", options: ["The point of means (x̄, ȳ)", "The first data point", "The origin", "The point with the largest y"], correct: [0] },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: <p>For the points <M>{"(1, 2), (2, 4), (3, 5)"}</M>, what is the least-squares slope <M>{"w_1"}</M>?</p>,
      answer: { kind: "numeric", value: 1.5 },
    },
    {
      key: "intercept",
      rung: "apply",
      prompt: <p>For the same points, what is the intercept <M>{"w_0"}</M>? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.67, tolerance: 0.01 },
    },
    {
      key: "predict",
      rung: "apply",
      prompt: <p>What does that line predict at <M>{"x = 4"}</M>? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 6.67, tolerance: 0.002 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1, 0], [1, 1], [1, 2]], dtype=float)
y = np.array([1, 3, 5], dtype=float)
print(np.linalg.solve(X.T @ X, X.T @ y))`}</Code>
          <p>The normal equations for a line through three points. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 2.]", "[2. 1.]", "[0. 2.]", "[1. 3.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1, 0], [1, 1], [1, 2]], dtype=float)
y = np.array([1.0, 2.0, 2.0])
w = np.linalg.solve(X.T @ X, X.T @ y)
r = y - X @ w
print(np.round(w, 4), np.round(np.abs(X.T @ r), 10))`}</Code>
          <p>The normal equations, and the residuals checked against the columns. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.1667 0.5   ] [0. 0.]", "[1.  0.5] [0. 0.]", "[1.1667 0.5   ] [0.3333 0.    ]", "[0.5    1.1667] [0. 0.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>least_squares(X, y)</C>, which adds a column of ones to X for the intercept and returns the coefficient vector (intercept first) using <C>np.linalg.lstsq</C>, and <C>predict(w, X)</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def least_squares(X, y):
    return np.linalg.lstsq(X, y, rcond=None)[0]

def predict(w, X):
    return X @ w
`,
        solution: `import numpy as np

def least_squares(X, y):
    A = np.column_stack([np.ones(len(X)), X])
    return np.linalg.lstsq(A, y, rcond=None)[0]

def predict(w, X):
    return w[0] + X @ w[1:]
`,
        tests: [
          { name: "recover", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(100, 2)); y = 3 + X @ np.array([2.0, -1.0])
w = least_squares(X, y)
assert np.allclose(w, [3, 2, -1]) and np.allclose(predict(w, X), y), 'Prepend a column of ones so the intercept is fitted too.'` },
          { name: "polyfit", code: `import numpy as np
rng = np.random.default_rng(1)
x = rng.normal(size=50); y = 4 - 2 * x + rng.normal(size=50)
w = least_squares(x[:, None], y)
assert np.allclose(w, np.polyfit(x, y, 1)[::-1]) and predict(w, np.array([[0.0], [1.0]])).shape == (2,), 'One feature: the same as fitting a line.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Leave-one-out error for least squares needs no refitting. With an intercept column added, the hat matrix is H = A(AᵀA)⁻¹Aᵀ, and the residual at row i when that row is left out is rᵢ/(1 − hᵢᵢ). Write <C>hat_diagonal(X)</C>, the leverages hᵢᵢ computed from a thin QR of A (hᵢᵢ is the squared norm of row i of Q), without forming H. Then write <C>loo_residuals(X, y)</C> by the shortcut and <C>loo_residuals_brute(X, y)</C> by refitting n times with <C>np.linalg.lstsq</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hat_diagonal(X):
    return np.zeros(len(X))

def loo_residuals(X, y):
    return np.zeros(len(X))

def loo_residuals_brute(X, y):
    return np.zeros(len(X))
`,
        solution: `import numpy as np

def _A(X):
    return np.column_stack([np.ones(len(X)), X])

def hat_diagonal(X):
    Q, _ = np.linalg.qr(_A(X))
    return (Q ** 2).sum(1)

def loo_residuals(X, y):
    A = _A(X)
    w = np.linalg.lstsq(A, y, rcond=None)[0]
    return (y - A @ w) / (1 - hat_diagonal(X))

def loo_residuals_brute(X, y):
    A = _A(X)
    out = np.empty(len(X))
    for i in range(len(X)):
        m = np.arange(len(X)) != i
        w = np.linalg.lstsq(A[m], y[m], rcond=None)[0]
        out[i] = y[i] - A[i] @ w
    return out
`,
        tests: [
          { name: "leverage", code: `import numpy as np
h = hat_diagonal(np.array([[0.0], [1.0], [2.0], [10.0]]))
assert abs(h.sum() - 2) < 1e-12 and h.argmax() == 3 and h[3] > 0.9, 'Leverages sum to the number of coefficients; the far point dominates.'` },
          { name: "agree", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(40, 3)); y = X @ [1.0, 2.0, -1.0] + rng.normal(size=40)
assert np.allclose(loo_residuals(X, y), loo_residuals_brute(X, y)), 'The shortcut equals refitting.'` },
          { name: "sklearn", code: `import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_predict, LeaveOneOut
rng = np.random.default_rng(1)
X = rng.normal(size=(25, 2)); y = X[:, 0] - X[:, 1] + rng.normal(size=25)
ref = y - cross_val_predict(LinearRegression(), X, y, cv=LeaveOneOut())
assert np.allclose(loo_residuals(X, y), ref), 'Agree with scikit-learn leave-one-out.'` },
        ],
      },
    },
    {
      key: "sumzero",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"w_0 = \\bar y - w_1 \\bar x"}</M>, the residuals <M>{"r_i = y_i - w_0 - w_1 x_i"}</M> add up
          to zero, whatever the value of <M>{"w_1"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the sum of residuals as the sum of y_i minus n w_0 minus w_1 times the sum of x_i.",
          "Replaces the sums by n ȳ and n x̄.",
          "Substitutes w_0 = ȳ − w_1 x̄ and simplifies to n ȳ − n ȳ + n w_1 x̄ − n w_1 x̄ = 0.",
        ],
      },
    },
    {
      key: "r2",
      rung: "stretch",
      prompt: <p>For the three points <M>{"(1, 2), (2, 4), (3, 5)"}</M> and their least-squares line, what is <M>{"R^2"}</M>? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.96, tolerance: 0.006 },
    },
  ],

  teachBack:
    "Explain to a friend why least squares squares the errors, the formulas for the best slope and intercept, and what R² measures.",

  glimpse: (
    <p>
      Next, what the fitted coefficients mean, and when they mislead. Linear Algebra I derives the normal equations as a
      projection, Statistical Machine Learning derives least squares from a model of the noise, and Mathematical Statistics
      asks how certain the coefficients are.
    </p>
  ),
};
