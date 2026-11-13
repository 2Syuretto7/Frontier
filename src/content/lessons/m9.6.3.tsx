import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PredBandViz } from "@/components/viz/PredBandViz";
import type { LessonContent } from "@/lib/types";

const TABLE = `import numpy as np

def fit_stats(X, y):
    n, p = X.shape
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    resid = y - X @ beta
    return beta, resid @ resid / (n - p), np.linalg.inv(X.T @ X)

def coef_t(X, y):
    beta, s2, V = fit_stats(X, y)
    se = np.sqrt(s2 * np.diag(V))
    return beta, se, beta / se

def bands(X, y, x0, tcrit):
    beta, s2, V = fit_stats(X, y)
    q = x0 @ V @ x0
    return x0 @ beta, tcrit * np.sqrt(s2 * q), tcrit * np.sqrt(s2 * (1 + q))`;

const SIM = `import numpy as np

def s2_check(n, p, reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, p))
    H = X @ np.linalg.solve(X.T @ X, X.T)
    E = rng.normal(size=(reps, n))
    sse = ((E - E @ H) ** 2).sum(axis=1)
    return round(float((sse / n).mean()), 3), round(float((sse / (n - p)).mean()), 3)

def slope_cover(n, tcrit, reps=20000, seed=0, df=None):
    rng = np.random.default_rng(seed)
    x = np.linspace(0, 1, n)
    xc = x - x.mean()
    eps = rng.normal(size=(reps, n)) if df is None else rng.standard_t(df, size=(reps, n))
    y = 1 + 2 * x + eps
    b1 = y @ xc / (xc @ xc)
    r = y - y.mean(axis=1, keepdims=True) - b1[:, None] * xc
    se = np.sqrt((r ** 2).sum(axis=1) / (n - 2) / (xc @ xc))
    return round(float(np.mean(np.abs(b1 - 2) <= tcrit * se)), 3)`;

export const lesson: LessonContent = {
  id: "m9.6.3",
  minutes: 60,
  links: {
    requires: ["m9.6.2", "m9.1.2"],
    revisits: ["m7.5.4", "m9.5.1"],
    foreshadows: ["m9.6.4", "m9.8.1"],
  },

  puzzle: (
    <>
      <p>
        A regression of final loss on log model size gives slope −0.31. Is the dependence real or could it be noise? And
        if you train one more model of a new size, how close to the line should its loss be? These are two different
        questions, and their answers differ by a surprising amount.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The coefficients are linear functions of the data, so with normal errors they are exactly normal. Estimating σ
        costs p degrees of freedom and turns z-statistics into t-statistics. Uncertainty about the line shrinks with n;
        uncertainty about a single new point does not, because the new point brings its own noise.
      </p>
      <PredBandViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="distribution of the coefficients">
        <p>
          If <M>{"y = X\\beta + \\varepsilon"}</M> with <M>{"\\varepsilon \\sim N(0, \\sigma^2 I)"}</M> and X fixed of full rank
          p, then <M>{"\\hat\\beta \\sim N\\big(\\beta, \\sigma^2(X^\\top X)^{-1}\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\hat\\beta = (X^\\top X)^{-1}X^\\top y = \\beta + (X^\\top X)^{-1}X^\\top\\varepsilon"}</M> is an affine function
          of a normal vector, hence normal, with mean β and covariance{" "}
          <M>{"(X^\\top X)^{-1}X^\\top(\\sigma^2 I)X(X^\\top X)^{-1} = \\sigma^2(X^\\top X)^{-1}"}</M>.
        </p>
      </Proof>

      <Theorem title="estimating σ²">
        <p>
          The residual sum of squares satisfies <M>{"\\mathbb{E}[\\mathrm{SSE}] = (n - p)\\sigma^2"}</M>, so{" "}
          <M>{"s^2 = \\mathrm{SSE}/(n - p)"}</M> is unbiased. Under normality, <M>{"\\mathrm{SSE}/\\sigma^2 \\sim \\chi^2_{n-p}"}</M>{" "}
          independently of <M>{"\\hat\\beta"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The residual is <M>{"e = (I - H)y = (I - H)\\varepsilon"}</M>, since (I − H)X = 0. With <M>{"I - H"}</M> symmetric and
          idempotent, <M>{"\\mathrm{SSE} = \\varepsilon^\\top(I - H)\\varepsilon"}</M> and{" "}
          <M>{"\\mathbb{E}[\\varepsilon^\\top A\\varepsilon] = \\sigma^2\\,\\mathrm{tr}A = \\sigma^2(n - p)"}</M>. For the
          distributional claims, rotate coordinates so that col(X) is spanned by the first p axes; a spherical normal stays
          spherical, SSE becomes a sum of n − p squared independent N(0, σ²) coordinates, and β̂ depends only on the other p.
        </p>
        <Code>{TABLE}</Code>
      </Proof>

      <Example title="t-tests, confidence and prediction intervals">
        <p>
          With <M>{"\\mathrm{se}_j = s\\sqrt{[(X^\\top X)^{-1}]_{jj}}"}</M>, the statistic{" "}
          <M>{"(\\hat\\beta_j - \\beta_j)/\\mathrm{se}_j"}</M> has the t distribution with n − p degrees of freedom; the
          interval <M>{"\\hat\\beta_j \\pm t_{n-p,0.025}\\,\\mathrm{se}_j"}</M> has exact 95% coverage. At a new input x₀,
        </p>
        <MD>{"x_0^\\top\\hat\\beta \\pm t\\, s\\sqrt{x_0^\\top(X^\\top X)^{-1}x_0} \\quad\\text{(mean)}, \\qquad x_0^\\top\\hat\\beta \\pm t\\, s\\sqrt{1 + x_0^\\top(X^\\top X)^{-1}x_0} \\quad\\text{(new observation)}."}</MD>
        <p>The extra 1 is the variance of the new observation&apos;s own noise, which does not shrink with n.</p>
      </Example>

      <Example title="checking by simulation">
        <p>
          Dividing SSE by n underestimates σ² = 1 by the factor (n − p)/n; dividing by n − p does not. The slope interval
          with the t critical value 2.306 (8 degrees of freedom) covers 95%; with the normal 1.96 it undercovers. With
          heavy-tailed t₃ errors, the coverage happens to stay close to 95% for this design.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="assumptions">
        <p>
          The exact results need linearity, independent errors, constant variance and normality. Normality matters least:
          for large n the central limit theorem rescues the intervals. Unequal variances matter more; heteroscedasticity-
          robust (sandwich) standard errors fix the coefficient intervals but not the prediction interval. Dependence, such
          as several rows from the same training run, matters most, and calls for clustered errors or aggregating to the
          independent unit. Testing many coefficients at once brings back the multiple-testing problem.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "s2",
      rung: "check",
      prompt: <p>A regression with n = 20 observations and p = 2 coefficients has SSE = 36. What is the unbiased estimate s² of σ²?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "t",
      rung: "check",
      prompt: <p>A coefficient estimate is 1.2 with standard error 0.4. What is its t-statistic for testing that it is 0?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "wider",
      rung: "apply",
      prompt: <p>At the same x₀ and confidence level, which interval is wider?</p>,
      answer: { kind: "choice", options: ["The prediction interval for a new observation", "The confidence interval for the mean response", "They have the same width", "It depends on the sign of the slope"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_stats(X, y):
    n, p = X.shape
    beta = np.linalg.lstsq(X, y, rcond=None)[0]
    resid = y - X @ beta
    return beta, resid @ resid / (n - p), np.linalg.inv(X.T @ X)

def coef_t(X, y):
    beta, s2, V = fit_stats(X, y)
    se = np.sqrt(s2 * np.diag(V))
    return beta, se, beta / se

def bands(X, y, x0, tcrit):
    beta, s2, V = fit_stats(X, y)
    q = x0 @ V @ x0
    return x0 @ beta, tcrit * np.sqrt(s2 * q), tcrit * np.sqrt(s2 * (1 + q))

X = np.column_stack([np.ones(4), [1.0, 2, 3, 4]])
y = np.array([2.0, 3, 5, 6])
beta, se, t = coef_t(X, y)
print([round(float(v), 4) for v in se], [round(float(v), 2) for v in t])
print([round(float(v), 4) for v in bands(X, y, np.array([1.0, 2.5]), 4.303)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.3873, 0.1414] [1.29, 9.9]\n[4.0, 0.6804, 1.5213]", "[0.3873, 0.1414] [1.29, 9.9]\n[4.0, 1.5213, 0.6804]", "[0.2739, 0.1] [1.83, 14.0]\n[4.0, 0.6804, 1.5213]", "[0.3873, 0.1414] [1.29, 9.9]\n[3.5, 0.6804, 1.5213]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def s2_check(n, p, reps=20000, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, p))
    H = X @ np.linalg.solve(X.T @ X, X.T)
    E = rng.normal(size=(reps, n))
    sse = ((E - E @ H) ** 2).sum(axis=1)
    return round(float((sse / n).mean()), 3), round(float((sse / (n - p)).mean()), 3)

def slope_cover(n, tcrit, reps=20000, seed=0, df=None):
    rng = np.random.default_rng(seed)
    x = np.linspace(0, 1, n)
    xc = x - x.mean()
    eps = rng.normal(size=(reps, n)) if df is None else rng.standard_t(df, size=(reps, n))
    y = 1 + 2 * x + eps
    b1 = y @ xc / (xc @ xc)
    r = y - y.mean(axis=1, keepdims=True) - b1[:, None] * xc
    se = np.sqrt((r ** 2).sum(axis=1) / (n - 2) / (xc @ xc))
    return round(float(np.mean(np.abs(b1 - 2) <= tcrit * se)), 3)

print(s2_check(10, 4))
print(slope_cover(10, 2.306), slope_cover(10, 1.96), slope_cover(10, 2.306, df=3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0.606, 1.01)\n0.952 0.916 0.956", "(1.01, 0.606)\n0.952 0.916 0.956", "(0.606, 1.01)\n0.916 0.952 0.956", "(0.909, 1.01)\n0.952 0.916 0.956"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_stats(X, y)</C>, returning (β̂, s², (XᵀX)⁻¹); <C>coef_t(X, y)</C>, returning (β̂, standard errors,
          t-statistics); and <C>bands(X, y, x0, tcrit)</C>, returning the fitted value at x0 and the half-widths of the
          confidence interval for the mean and of the prediction interval.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_stats(X, y):
    return np.zeros(X.shape[1]), 1.0, np.eye(X.shape[1])

def coef_t(X, y):
    return None, None, None

def bands(X, y, x0, tcrit):
    return 0.0, 0.0, 0.0
`,
        solution: TABLE,
        tests: [
          { name: "coef", code: `import numpy as np
X = np.column_stack([np.ones(5), [0.0, 1, 2, 3, 4]])
y = np.array([1.0, 2.0, 2.0, 4.0, 5.0])
b, se, t = coef_t(X, y)
assert np.allclose(b, [0.8, 1.0]) and abs(se[1] - np.sqrt(0.8 / 30)) < 1e-9 and np.allclose(t, b / se)` },
          { name: "bands", code: `import numpy as np
X = np.column_stack([np.ones(4), [1.0, 2, 3, 4]])
f, c, p = bands(X, np.array([2.0, 3, 5, 6]), np.array([1.0, 2.5]), 1.0)
assert abs(f - 4) < 1e-9 and abs(c - 0.025 ** 0.5) < 1e-9 and abs(p - 0.125 ** 0.5) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>s2_check(n, p, reps=20000, seed=0)</C>, which fixes a random n × p design, simulates standard normal
          errors and returns the average of SSE/n and of SSE/(n − p), and{" "}
          <C>slope_cover(n, tcrit, reps=20000, seed=0, df=None)</C>, the coverage of the slope interval for
          y = 1 + 2x + error on x = linspace(0, 1, n), with standard normal errors or, when df is given, t errors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def s2_check(n, p, reps=20000, seed=0):
    return 0.0, 0.0

def slope_cover(n, tcrit, reps=20000, seed=0, df=None):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "s2", code: `a, b = s2_check(12, 3, reps=20000)
assert abs(a - 0.75) < 0.03 and abs(b - 1) < 0.03` },
          { name: "cover", code: `assert abs(slope_cover(6, 2.776, reps=20000) - 0.95) < 0.01 and slope_cover(6, 1.96, reps=20000) < 0.9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For y = Xβ + ε with E[ε] = 0, Cov(ε) = σ²I and X of full rank p, prove that E[SSE] = (n − p)σ².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows the residual vector is (I − H)ε, using (I − H)X = 0.",
          "Uses that I − H is symmetric and idempotent to write SSE = εᵀ(I − H)ε.",
          "Computes E[εᵀAε] = σ² tr(A) and tr(I − H) = n − p, giving (n − p)σ².",
        ],
      },
    },
    {
      key: "pi",
      rung: "stretch",
      prompt: <p>A simple regression has n = 12, s = 2 and t critical value 2.228. What is the half-width of the 95% prediction interval at x₀ = x̄? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 4.6379, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend the distribution of the least squares coefficients under normal errors, why SSE is divided by n − p, how t-tests and confidence intervals for coefficients work, and why prediction intervals stay wide however much data you have.",

  glimpse: (
    <>
      <p>
        When predictors are many or nearly collinear, these standard errors explode. Ridge regression, next, accepts a
        little bias to cut the variance, the same trade we met for a single mean.
      </p>
    </>
  ),
};
