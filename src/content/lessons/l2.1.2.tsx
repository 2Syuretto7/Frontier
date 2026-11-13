import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SigmaMleViz } from "@/components/viz/SigmaMleViz";
import type { LessonContent } from "@/lib/types";

const GAUSS = `import numpy as np

def fit_gaussian(X, y):
    w = np.linalg.lstsq(X, y, rcond=None)[0]
    sigma2 = float(np.mean((y - X @ w) ** 2))
    return w, sigma2

def gauss_nll(X, y, w, sigma2):
    r = y - X @ w
    return float(0.5 * len(y) * np.log(2 * np.pi * sigma2) + (r @ r) / (2 * sigma2))

def fit_weighted(X, y, var):
    s = 1 / np.sqrt(var)
    return np.linalg.lstsq(X * s[:, None], y * s, rcond=None)[0]`;

const LAD = `import numpy as np

def laplace_nll(r, b):
    return float(len(r) * np.log(2 * b) + np.abs(r).sum() / b)

def fit_lad(X, y, iters=200, eps=1e-8):
    w = np.linalg.lstsq(X, y, rcond=None)[0]
    for _ in range(iters):
        s = 1 / np.sqrt(np.maximum(np.abs(y - X @ w), eps))
        w = np.linalg.lstsq(X * s[:, None], y * s, rcond=None)[0]
    return w`;

export const lesson: LessonContent = {
  id: "l2.1.2",
  minutes: 50,
  links: {
    requires: ["l2.1.1", "l1.2.1"],
    revisits: ["m9.2.2", "m9.6.2"],
    foreshadows: ["l2.2.1", "l2.2.4"],
  },

  puzzle: (
    <>
      <p>
        Least squares was introduced as a sensible way to fit a line: make the squared residuals small. But why squares,
        rather than absolute values or fourth powers? And once the line is fitted, what should you say about how far new
        points are likely to fall from it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every loss corresponds to a belief about the noise. Squared error is what you get from maximum likelihood when the
        noise is Gaussian; absolute error comes from Laplace noise, whose heavier tails make a big residual less surprising,
        so outliers pull less. The likelihood also gives you the noise scale, which turns a line into a predictive
        distribution.
      </p>
      <SigmaMleViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Gaussian noise gives least squares">
        <p>
          Suppose <M>{"y_i = x_i^\\top w + \\varepsilon_i"}</M> with <M>{"\\varepsilon_i"}</M> independent N(0, σ²). Then
          the maximum-likelihood w minimises the residual sum of squares <M>{"\\mathrm{RSS}(w) = \\|y - Xw\\|^2"}</M>, for
          every σ, and the maximum-likelihood variance is <M>{"\\hat\\sigma^2 = \\mathrm{RSS}(\\hat w)/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>The negative log-likelihood is</p>
        <MD>{"\\mathrm{NLL}(w, \\sigma^2) = \\frac n2\\log(2\\pi\\sigma^2) + \\frac{\\mathrm{RSS}(w)}{2\\sigma^2}."}</MD>
        <p>
          For fixed σ² the first term is constant and the second is a positive multiple of RSS(w), so the minimising w is the
          least-squares solution whatever σ is. Putting in <M>{"\\hat w"}</M> and differentiating in <M>{"v = \\sigma^2"}</M>{" "}
          gives <M>{"\\frac{n}{2v} - \\frac{\\mathrm{RSS}}{2v^2} = 0"}</M>, so v = RSS/n, and the derivative changes sign from
          negative to positive there, so it is a minimum.
        </p>
        <Code>{GAUSS}</Code>
      </Proof>

      <Remark title="RSS/n versus RSS/(n − p)">
        <p>
          The maximum-likelihood variance divides by n and is biased low, for the same reason as the sample variance: the
          fitted line sits closer to the data than the true one. Regression software usually reports RSS/(n − p), which is
          unbiased when the model has p coefficients.
        </p>
      </Remark>

      <Example title="unequal noise gives weighted least squares">
        <p>
          If <M>{"\\varepsilon_i \\sim N(0, \\sigma_i^2)"}</M> with known variances, the NLL in w is{" "}
          <M>{"\\sum_i (y_i - x_i^\\top w)^2/(2\\sigma_i^2)"}</M>, so each squared residual is weighted by{" "}
          <M>{"1/\\sigma_i^2"}</M>. Scaling row i of X and y by <M>{"1/\\sigma_i"}</M> turns this into ordinary least
          squares, which is what <C>fit_weighted</C> does. A point with variance 100 counts a hundred times less.
        </p>
      </Example>

      <Theorem title="Laplace noise gives least absolute deviations">
        <p>
          If the noise has the Laplace density <M>{"\\frac{1}{2b}e^{-|\\varepsilon|/b}"}</M>, the NLL is{" "}
          <M>{"n\\log(2b) + \\frac1b\\sum_i |y_i - x_i^\\top w|"}</M>, so the maximum-likelihood w minimises the sum of
          absolute residuals. For a constant model the minimiser is a median of the data.
        </p>
      </Theorem>
      <Proof>
        <p>
          The NLL formula is the sum of <M>{"\\log(2b) + |r_i|/b"}</M>, and for fixed b only the absolute residuals depend on
          w. For a constant c, the function <M>{"\\sum_i |y_i - c|"}</M> has slope (number of points below c) − (number
          above c) away from the data points; this is negative while fewer than half lie below c and positive once more than
          half do, so the minimum is at a median.
        </p>
        <Code>{LAD}</Code>
      </Proof>
      <Remark title="choosing the noise model">
        <p>
          On the five points of the code, moving the last target from 10 to 30 drags the least-squares line to slope 6.19,
          while the least-absolute-deviation line keeps slope 2.2. Neither loss is right in general; plotting residuals tells
          you whether Gaussian tails are plausible. The same recipe, picking a noise distribution and minimising its NLL,
          produces Poisson regression for counts and logistic regression for labels.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "s2",
      rung: "check",
      prompt: <p>A fitted line leaves residuals 1, −1, 2 and −2. What is the maximum-likelihood noise variance RSS/n?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.001 },
    },
    {
      key: "median",
      rung: "check",
      prompt: <p>Under Laplace noise, what is the maximum-likelihood constant for the data 1, 2, 3, 10, 50?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.001 },
    },
    {
      key: "wls",
      rung: "apply",
      prompt: <p>Measurements have Gaussian noise with known but different variances σᵢ². What does maximum likelihood fit?</p>,
      answer: {
        kind: "choice",
        options: [
          "Least squares with each squared residual weighted by 1/σᵢ²",
          "Ordinary least squares, ignoring the variances",
          "Least squares with each squared residual weighted by σᵢ²",
          "Least absolute deviations",
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

def fit_gaussian(X, y):
    w = np.linalg.lstsq(X, y, rcond=None)[0]
    sigma2 = float(np.mean((y - X @ w) ** 2))
    return w, sigma2

def gauss_nll(X, y, w, sigma2):
    r = y - X @ w
    return float(0.5 * len(y) * np.log(2 * np.pi * sigma2) + (r @ r) / (2 * sigma2))

def fit_weighted(X, y, var):
    s = 1 / np.sqrt(var)
    return np.linalg.lstsq(X * s[:, None], y * s, rcond=None)[0]

X = np.column_stack([np.ones(5), np.arange(5.0)]); y = np.array([1.0, 3.2, 4.8, 7.1, 10.0])
w, s2 = fit_gaussian(X, y)
print(np.round(w, 3), round(s2, 4))
print(round(gauss_nll(X, y, w, s2), 3), np.round(fit_weighted(X, y, np.array([1, 1, 1, 1, 100.0])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.84 2.19] 0.0974\n1.272 [1.035 1.995]", "[0.84 2.19] 0.1217\n1.272 [1.035 1.995]", "[0.84 2.19] 0.0974\n1.272 [0.84 2.19]", "[1.035 1.995] 0.0974\n1.272 [0.84 2.19]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_gaussian(X, y):
    w = np.linalg.lstsq(X, y, rcond=None)[0]
    sigma2 = float(np.mean((y - X @ w) ** 2))
    return w, sigma2

def gauss_nll(X, y, w, sigma2):
    r = y - X @ w
    return float(0.5 * len(y) * np.log(2 * np.pi * sigma2) + (r @ r) / (2 * sigma2))

def fit_weighted(X, y, var):
    s = 1 / np.sqrt(var)
    return np.linalg.lstsq(X * s[:, None], y * s, rcond=None)[0]

import numpy as np

def laplace_nll(r, b):
    return float(len(r) * np.log(2 * b) + np.abs(r).sum() / b)

def fit_lad(X, y, iters=200, eps=1e-8):
    w = np.linalg.lstsq(X, y, rcond=None)[0]
    for _ in range(iters):
        s = 1 / np.sqrt(np.maximum(np.abs(y - X @ w), eps))
        w = np.linalg.lstsq(X * s[:, None], y * s, rcond=None)[0]
    return w

X = np.column_stack([np.ones(5), np.arange(5.0)]); y = np.array([1.0, 3.2, 4.8, 7.1, 10.0])
y2 = y.copy(); y2[4] = 30.0
print(np.round(fit_gaussian(X, y2)[0], 3), np.round(fit_lad(X, y2), 3))
print(round(laplace_nll(np.array([1.0, -1.0, 2.0]), 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-3.16  6.19] [1.  2.2]\n6.0794", "[1.  2.2] [-3.16  6.19]\n6.0794", "[-3.16  6.19] [-3.16  6.19]\n6.0794", "[-3.16  6.19] [1.  2.2]\n4.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_gaussian(X, y)</C> returning the least-squares w and the maximum-likelihood variance as a float,{" "}
          <C>gauss_nll(X, y, w, sigma2)</C>, the total Gaussian negative log-likelihood, and{" "}
          <C>fit_weighted(X, y, var)</C>, the maximum-likelihood w when point i has noise variance var[i].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_gaussian(X, y):
    return np.zeros(X.shape[1]), 1.0

def gauss_nll(X, y, w, sigma2):
    return 0.0

def fit_weighted(X, y, var):
    return np.zeros(X.shape[1])
`,
        solution: GAUSS,
        tests: [
          { name: "fit", code: `X = np.column_stack([np.ones(4), np.arange(4.0)]); y = np.array([0.0, 2.0, 1.0, 3.0])
w, s2 = fit_gaussian(X, y)
assert np.allclose(w, [0.3, 0.8]) and abs(s2 - 0.45) < 1e-12 and abs(gauss_nll(X, y, w, s2) - 2 * (np.log(2 * np.pi * 0.45) + 1)) < 1e-9` },
          { name: "weighted", code: `X = np.ones((3, 1)); y = np.array([0.0, 0.0, 3.0])
assert abs(fit_weighted(X, y, np.array([1.0, 1.0, 1.0]))[0] - 1.0) < 1e-12 and abs(fit_weighted(X, y, np.array([1.0, 1.0, 0.5]))[0] - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>laplace_nll(r, b)</C>, the total Laplace negative log-likelihood of residuals r with scale b, and{" "}
          <C>fit_lad(X, y, iters=200, eps=1e-8)</C>, which starts from least squares and repeatedly solves weighted least
          squares with weights 1/max(|rᵢ|, eps), converging to the least-absolute-deviation fit.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def laplace_nll(r, b):
    return 0.0

def fit_lad(X, y, iters=200, eps=1e-8):
    return np.linalg.lstsq(X, y, rcond=None)[0]
`,
        solution: LAD,
        tests: [
          { name: "nll", code: `assert abs(laplace_nll(np.array([0.0, 2.0]), 2.0) - (2 * np.log(4) + 1)) < 1e-12` },
          { name: "median", code: `X = np.ones((5, 1)); y = np.array([1.0, 2.0, 3.0, 10.0, 50.0])
assert abs(fit_lad(X, y)[0] - 3.0) < 1e-3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"y_i = x_i^\\top w + \\varepsilon_i"}</M> with independent N(0, σ²) noise, prove that the maximum-likelihood
          w is a least-squares solution whatever σ is, and that the maximum-likelihood σ² is RSS(ŵ)/n.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the negative log-likelihood as (n/2)log(2πσ²) + RSS(w)/(2σ²).",
          "Observes that for fixed σ only RSS(w) depends on w, with a positive coefficient, so the minimiser is the least-squares w.",
          "Differentiates in σ² at ŵ, solves to get RSS/n, and checks it is a minimum (sign change or second derivative).",
        ],
      },
    },
    {
      key: "nllmin",
      rung: "stretch",
      prompt: <p>At the maximum-likelihood fit the Gaussian NLL equals (n/2)(log(2πσ̂²) + 1). Evaluate it for n = 10 and σ̂² = 1, to four decimal places.</p>,
      answer: { kind: "numeric", value: 14.1894, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend why least squares is maximum likelihood under Gaussian noise, how the noise variance is estimated, what changes when points have different known variances, and why Laplace noise leads to absolute error and robustness to outliers.",

  glimpse: (
    <>
      <p>
        Maximum likelihood trusts the data completely and can overfit. Adding a prior on the weights and maximising the
        posterior instead turns into the familiar regularisers: a Gaussian prior gives ridge, a Laplace prior gives lasso.
      </p>
    </>
  ),
};
