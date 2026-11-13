import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RegToMeanViz } from "@/components/viz/RegToMeanViz";
import type { LessonContent } from "@/lib/types";

const FIT = `def fit_line(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    b1 = sxy / sxx
    return my - b1 * mx, b1

def r_squared(xs, ys, b0, b1):
    my = sum(ys) / len(ys)
    sse = sum((y - b0 - b1 * x) ** 2 for x, y in zip(xs, ys))
    sst = sum((y - my) ** 2 for y in ys)
    return 1 - sse / sst`;

const SIM = `import numpy as np

def slope_spread(n, b0=1.0, b1=2.0, sigma=1.0, reps=5000, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.uniform(0, 1, size=(reps, n))
    y = b0 + b1 * x + rng.normal(0, sigma, size=(reps, n))
    xc = x - x.mean(axis=1, keepdims=True)
    slope = (xc * y).sum(axis=1) / (xc ** 2).sum(axis=1)
    return float(slope.mean()), float(slope.std())

def regression_to_mean(rho, reps=100000, seed=0):
    rng = np.random.default_rng(seed)
    a = rng.normal(size=reps)
    b = rho * a + np.sqrt(1 - rho ** 2) * rng.normal(size=reps)
    top = a > 1.5
    return float(a[top].mean()), float(b[top].mean())`;

export const lesson: LessonContent = {
  id: "m9.6.1",
  minutes: 55,
  links: {
    requires: ["m9.2.2", "m7.6.3"],
    revisits: ["m7.5.2", "m5.5.3"],
    foreshadows: ["m9.6.2", "m9.6.3"],
  },

  puzzle: (
    <>
      <p>
        You pick the ten best configurations from a hyperparameter sweep and rerun them with new seeds. Almost all of them
        do worse the second time. Did rerunning break something? No: the same thing happens to pilots praised after a
        great landing and to students tested twice. Explaining it needs the simplest model of how one quantity depends on
        another.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Regression predicts Y from X by the best straight line in the least squares sense. Its slope, in standardised
        units, is the correlation, which is less than 1 whenever the relationship is noisy. So the prediction for an
        extreme X is always less extreme: regression to the mean.
      </p>
      <RegToMeanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="regression function and linear model">
        <p>
          The regression function <M>{"m(x) = \\mathbb{E}[Y \\mid X = x]"}</M> is the predictor of Y from X with the least
          mean squared error. The simple linear model assumes{" "}
          <M>{"Y_i = \\beta_0 + \\beta_1 x_i + \\varepsilon_i"}</M> with errors of mean 0 and common variance σ².
        </p>
      </Definition>

      <Theorem title="least squares line">
        <p>
          The values minimising <M>{"\\sum_i (y_i - b_0 - b_1 x_i)^2"}</M> are
        </p>
        <MD>{"\\hat\\beta_1 = \\frac{S_{xy}}{S_{xx}} = \\frac{\\sum (x_i - \\bar x)(y_i - \\bar y)}{\\sum (x_i - \\bar x)^2}, \\qquad \\hat\\beta_0 = \\bar y - \\hat\\beta_1 \\bar x,"}</MD>
        <p>provided the xᵢ are not all equal. The residuals sum to zero and the line passes through (x̄, ȳ).</p>
      </Theorem>
      <Proof>
        <p>
          The objective is a convex quadratic in (b₀, b₁). Setting the derivative in b₀ to zero gives{" "}
          <M>{"\\sum (y_i - b_0 - b_1 x_i) = 0"}</M>, so the residuals sum to zero and <M>{"b_0 = \\bar y - b_1\\bar x"}</M>.
          Substituting, the derivative in b₁ gives{" "}
          <M>{"\\sum x_i\\big((y_i - \\bar y) - b_1(x_i - \\bar x)\\big) = 0"}</M>. Since{" "}
          <M>{"\\sum \\bar x(\\cdot) = 0"}</M> by the first equation, x_i can be replaced by <M>{"x_i - \\bar x"}</M>, which
          gives <M>{"S_{xy} = b_1 S_{xx}"}</M>.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Theorem title="least squares is maximum likelihood">
        <p>
          If the errors are iid N(0, σ²), the MLE of (β₀, β₁) is the least squares line and the MLE of σ² is SSE/n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The log-likelihood is <M>{"-\\tfrac n2\\log(2\\pi\\sigma^2) - \\tfrac{1}{2\\sigma^2}\\sum (y_i - \\beta_0 - \\beta_1 x_i)^2"}</M>.
          For any σ it is maximised over β by minimising the sum of squares. Substituting the minimum SSE and setting the
          derivative in σ² to zero gives σ̂² = SSE/n.
        </p>
      </Proof>

      <Example title="goodness of fit and sampling variability">
        <p>
          The coefficient of determination <M>{"R^2 = 1 - \\mathrm{SSE}/\\mathrm{SST}"}</M> is the fraction of the variation in
          y explained by the line; for one predictor it equals the squared correlation. The simulation shows the slope
          estimate is unbiased and that its spread shrinks like 1/√n.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Theorem title="regression to the mean">
        <p>
          The fitted slope can be written <M>{"\\hat\\beta_1 = r\\, s_y/s_x"}</M> with r the sample correlation. In standard
          units the prediction is <M>{"\\hat z_y = r z_x"}</M>, and |r| ≤ 1, so predictions are never more extreme than the
          predictor.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"r = S_{xy}/\\sqrt{S_{xx}S_{yy}}"}</M>, so <M>{"S_{xy}/S_{xx} = r\\sqrt{S_{yy}/S_{xx}} = r\\,s_y/s_x"}</M>.
          Dividing <M>{"\\hat y - \\bar y = \\hat\\beta_1(x - \\bar x)"}</M> by s_y gives the standardised form, and |r| ≤ 1 by
          Cauchy-Schwarz.
        </p>
      </Proof>

      <Remark title="in practice">
        <p>
          &quot;Linear&quot; means linear in the parameters: polynomial, spline or learned features all keep the same
          machinery. A slope describes association, not the effect of intervening on x. And when you select the best of many
          noisy runs, expect them to regress: re-evaluate selected configurations on fresh seeds before reporting.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "slope",
      rung: "check",
      prompt: <p>A data set has S_xy = 12 and S_xx = 4. What is the least squares slope?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "icept",
      rung: "check",
      prompt: <p>The least squares slope is 3, x̄ = 2 and ȳ = 7. What is the intercept?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "mle",
      rung: "apply",
      prompt: <p>With iid normal errors of unknown variance, what is the maximum likelihood estimate of the regression coefficients?</p>,
      answer: { kind: "choice", options: ["The least squares estimate", "The least absolute deviations estimate", "The estimate minimising the largest residual", "It depends on σ²"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fit_line(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    b1 = sxy / sxx
    return my - b1 * mx, b1

def r_squared(xs, ys, b0, b1):
    my = sum(ys) / len(ys)
    sse = sum((y - b0 - b1 * x) ** 2 for x, y in zip(xs, ys))
    sst = sum((y - my) ** 2 for y in ys)
    return 1 - sse / sst

b0, b1 = fit_line([1, 2, 3, 4], [2, 3, 5, 6])
print(round(b0, 4), round(b1, 4), round(r_squared([1, 2, 3, 4], [2, 3, 5, 6], b0, b1), 4))
print(fit_line([0, 1, 2], [5, 5, 5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 1.4 0.98\n(5.0, 0.0)", "0.5 1.4 0.02\n(5.0, 0.0)", "1.4 0.5 0.98\n(5.0, 0.0)", "0.5 1.4 0.98\n(0.0, 5.0)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def slope_spread(n, b0=1.0, b1=2.0, sigma=1.0, reps=5000, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.uniform(0, 1, size=(reps, n))
    y = b0 + b1 * x + rng.normal(0, sigma, size=(reps, n))
    xc = x - x.mean(axis=1, keepdims=True)
    slope = (xc * y).sum(axis=1) / (xc ** 2).sum(axis=1)
    return float(slope.mean()), float(slope.std())

def regression_to_mean(rho, reps=100000, seed=0):
    rng = np.random.default_rng(seed)
    a = rng.normal(size=reps)
    b = rho * a + np.sqrt(1 - rho ** 2) * rng.normal(size=reps)
    top = a > 1.5
    return float(a[top].mean()), float(b[top].mean())

print([round(v, 2) for v in slope_spread(10)], [round(v, 2) for v in slope_spread(100)])
print([round(v, 2) for v in regression_to_mean(0.5)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2.0, 1.23] [2.0, 0.35]\n[1.94, 0.97]", "[2.0, 1.23] [2.0, 0.35]\n[1.94, 1.94]", "[2.0, 0.35] [2.0, 1.23]\n[1.94, 0.97]", "[1.0, 1.23] [1.0, 0.35]\n[1.94, 0.97]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_line(xs, ys)</C>, returning the least squares (intercept, slope), and{" "}
          <C>r_squared(xs, ys, b0, b1)</C>, returning 1 − SSE/SST.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fit_line(xs, ys):
    return 0.0, 0.0

def r_squared(xs, ys, b0, b1):
    return 0.0
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `b0, b1 = fit_line([0, 1, 2], [1, 3, 5])
assert abs(b0 - 1) < 1e-12 and abs(b1 - 2) < 1e-12` },
          { name: "r2", code: `assert abs(r_squared([0, 1, 2], [1, 3, 5], 1, 2) - 1) < 1e-12
assert abs(r_squared([0, 1, 2], [0, 2, 1], 0.5, 0.5) - 0.25) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>slope_spread(n, b0=1.0, b1=2.0, sigma=1.0, reps=5000, seed=0)</C>, which simulates reps data sets with
          x ~ Uniform(0, 1) and normal errors and returns the mean and standard deviation of the fitted slopes, and{" "}
          <C>regression_to_mean(rho, reps=100000, seed=0)</C>, which draws standard normal pairs with correlation ρ and
          returns the mean of both coordinates among pairs whose first coordinate exceeds 1.5.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def slope_spread(n, b0=1.0, b1=2.0, sigma=1.0, reps=5000, seed=0):
    return 0.0, 0.0

def regression_to_mean(rho, reps=100000, seed=0):
    return 0.0, 0.0
`,
        solution: SIM,
        tests: [
          { name: "slope", code: `m, s = slope_spread(400, reps=2000)
assert abs(m - 2) < 0.03 and abs(s - 12 ** 0.5 / 20) < 0.02` },
          { name: "rtm", code: `a, b = regression_to_mean(0.8, reps=50000)
assert abs(b / a - 0.8) < 0.03 and abs(regression_to_mean(0.0)[1]) < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Derive the least squares estimates β̂₁ = S_xy/S_xx and β̂₀ = ȳ − β̂₁x̄ for simple linear regression, and show the residuals sum to zero.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates the sum of squares in b₀ and sets it to zero, giving Σ residuals = 0 and b₀ = ȳ − b₁x̄.",
          "Differentiates in b₁, substitutes b₀, and simplifies (using Σ(xᵢ − x̄) = 0) to S_xy = b₁S_xx.",
          "Notes the objective is a convex quadratic (or checks the second-order condition) so the stationary point is the minimum, assuming S_xx > 0.",
        ],
      },
    },
    {
      key: "r",
      rung: "stretch",
      prompt: <p>Two variables have correlation 0.6, standard deviations s_x = 2 and s_y = 5. What is the least squares slope of y on x?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the least squares line is derived, why it is the maximum likelihood fit under normal errors, what R² measures, and why regression to the mean happens whenever we select on a noisy measurement.",

  glimpse: (
    <>
      <p>
        With many predictors the formulas become matrix equations. The next lesson shows that least squares is an
        orthogonal projection of y onto the column space of the design matrix, which makes its properties almost
        geometric facts.
      </p>
    </>
  ),
};
