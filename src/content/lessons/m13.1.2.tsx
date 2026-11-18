import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ControlVariateViz } from "@/components/viz/ControlVariateViz";
import type { LessonContent } from "@/lib/types";

const CV = `import numpy as np

def optimal_c(fx, gx):
    return float(np.cov(fx, gx)[0, 1] / np.var(gx, ddof=1))

def cv_estimate(fx, gx, g_mean):
    c = optimal_c(fx, gx)
    return float(np.mean(fx - c * (gx - g_mean)))

def variance_ratio(fx, gx):
    return float(1 - np.corrcoef(fx, gx)[0, 1] ** 2)`;

const RG = `import numpy as np

def cv_regression(fx, G, g_means):
    X = np.column_stack([np.ones(len(fx)), G - g_means])
    beta = np.linalg.lstsq(X, fx, rcond=None)[0]
    return float(beta[0]), beta[1:]

def residual_ratio(fx, G):
    X = np.column_stack([np.ones(len(fx)), G])
    r = fx - X @ np.linalg.lstsq(X, fx, rcond=None)[0]
    return float(np.var(r) / np.var(fx))`;

export const lesson: LessonContent = {
  id: "m13.1.2",
  minutes: 45,
  links: {
    requires: ["m13.1.1"],
    revisits: ["m7.5.2"],
    foreshadows: ["m13.6.1", "m13.6.3"],
  },

  puzzle: (
    <>
      <p>
        You want <M>{"\\mathbb E[e^U]"}</M> for U uniform, and you already know <M>{"\\mathbb E[U] = \\tfrac12"}</M> exactly. That
        seems useless: U is not what you are estimating. Yet using it, the same 10,000 samples give an answer about sixty
        times less variable. How can knowing the mean of the wrong thing help, and how much can it help?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In any particular run, if the samples of U happen to average a bit above ½, the samples of <M>{"e^U"}</M> almost
        certainly average a bit high too, because the two move together. You can see the error in U, since you know its
        true mean, so correct the estimate of <M>{"\\mathbb E[e^U]"}</M> by a proportional amount. The correction removes the
        part of the error that U explains, which is the fraction <M>{"\\rho^2"}</M> of the variance.
      </p>
      <ControlVariateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="control variate">
        <p>
          A control variate for <M>{"\\theta = \\mathbb E[f(X)]"}</M> is a function g whose mean <M>{"\\mu_g = \\mathbb E[g(X)]"}</M> is
          known exactly. For any constant c,
        </p>
        <MD>{"\\hat\\theta_c = \\frac1n\\sum_i \\bigl(f(X_i) - c\\,(g(X_i) - \\mu_g)\\bigr)"}</MD>
        <p>is unbiased for θ.</p>
      </Definition>

      <Theorem title="the best coefficient">
        <p>
          The variance of <M>{"\\hat\\theta_c"}</M> is smallest at <M>{"c^* = \\mathrm{Cov}(f, g)/\\mathrm{Var}(g)"}</M>, where it equals{" "}
          <M>{"(1 - \\rho^2)\\,\\mathrm{Var}(f)/n"}</M>, with ρ the correlation of f(X) and g(X).
        </p>
      </Theorem>
      <Proof>
        <p>
          Per sample, <M>{"\\mathrm{Var}(f - cg) = \\mathrm{Var} f - 2c\\,\\mathrm{Cov}(f, g) + c^2\\,\\mathrm{Var}\\, g"}</M>, a parabola in
          c with minimum at <M>{"c^*"}</M>. Substituting gives{" "}
          <M>{"\\mathrm{Var} f - \\mathrm{Cov}^2/\\mathrm{Var}\\, g = \\mathrm{Var} f\\,(1 - \\rho^2)"}</M>. Unbiasedness holds for every
          fixed c because <M>{"g(X) - \\mu_g"}</M> has mean zero. For <M>{"f = e^U"}</M> and g = U, <M>{"c^* \\approx 1.690"}</M> and{" "}
          <M>{"1 - \\rho^2 \\approx 0.016"}</M>.
        </p>
      </Proof>

      <Remark title="estimating c">
        <p>
          In practice <M>{"c^*"}</M> is unknown and is estimated from the same samples. That introduces a bias of order 1/n,
          negligible beside the standard error of order <M>{"1/\\sqrt n"}</M>; a pilot run, or splitting the samples, removes it
          entirely. The sign of c takes care of itself: a negatively correlated control works just as well.
        </p>
        <Code>{CV}</Code>
      </Remark>

      <Theorem title="several controls are a regression">
        <p>
          With controls <M>{"g_1, \\dots, g_k"}</M> of known means, regress f(X) on the centred controls{" "}
          <M>{"g_j(X) - \\mu_j"}</M> with an intercept. The fitted intercept is the control variate estimate with the
          estimated optimal coefficients, and the remaining variance is the residual variance of that regression,{" "}
          <M>{"(1 - R^2)\\,\\mathrm{Var} f"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Least squares with an intercept makes the residuals average to zero, so the intercept equals{" "}
          <M>{"\\bar f - \\sum_j \\hat c_j(\\bar g_j - \\mu_j)"}</M>, which is <M>{"\\hat\\theta_{\\hat c}"}</M>. The slope vector{" "}
          <M>{"\\hat c"}</M> solves the sample version of <M>{"\\mathrm{Cov}(g)\\,c = \\mathrm{Cov}(g, f)"}</M>, the multivariate{" "}
          <M>{"c^*"}</M>. Adding <M>{"U^2"}</M> (mean ⅓) to U for <M>{"e^U"}</M> cuts the remaining variance from 1.6% to about 0.01%.
        </p>
        <Code>{RG}</Code>
      </Proof>

      <Remark title="where they appear">
        <p>
          Control variates are everywhere once you look. The baseline subtracted in policy-gradient reinforcement learning is a
          control variate for the score-function estimator, met again at the end of this course. Quasi-Monte Carlo and
          antithetic sampling are cousins. The limiting factor is always the same: you need a cheap function, correlated with
          f, whose mean you know exactly. A good approximation of f with a closed-form integral, such as a Taylor polynomial,
          is often the best choice.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rho",
      rung: "check",
      prompt: <p>A control variate has correlation 0.9 with f. What fraction of the variance remains with the best coefficient?</p>,
      answer: { kind: "numeric", value: 0.19, tolerance: 0.0001 },
    },
    {
      key: "cstar",
      rung: "check",
      prompt: <p>Cov(f, g) = 3 and Var(g) = 2. What is the best coefficient c*?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "known",
      rung: "apply",
      prompt: <p>Why must the mean of a control variate be known exactly rather than estimated from the same samples?</p>,
      answer: {
        kind: "choice",
        options: [
          "An error in μ_g shifts the estimate by c times that error, so the information that cancels the noise would be lost",
          "Because Var(g) would become zero",
          "Because the optimal coefficient would always be zero",
          "Because then f and g could no longer be correlated",
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

def optimal_c(fx, gx):
    return float(np.cov(fx, gx)[0, 1] / np.var(gx, ddof=1))

def cv_estimate(fx, gx, g_mean):
    c = optimal_c(fx, gx)
    return float(np.mean(fx - c * (gx - g_mean)))

def variance_ratio(fx, gx):
    return float(1 - np.corrcoef(fx, gx)[0, 1] ** 2)

u = np.random.default_rng(0).random(10000); fx = np.exp(u)
print(round(optimal_c(fx, u), 2), round(variance_ratio(fx, u), 3), abs(cv_estimate(fx, u, 0.5) - (np.e - 1)) < 0.002)
print(round(optimal_c(fx, -u), 2), round(variance_ratio(fx, 1 - u), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.69 0.016 True\n-1.69 0.016",
          "1.69 0.984 True\n-1.69 0.016",
          "1.69 0.016 True\n1.69 0.984",
          "0.14 0.016 True\n-0.14 0.016",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def cv_regression(fx, G, g_means):
    X = np.column_stack([np.ones(len(fx)), G - g_means])
    beta = np.linalg.lstsq(X, fx, rcond=None)[0]
    return float(beta[0]), beta[1:]

def residual_ratio(fx, G):
    X = np.column_stack([np.ones(len(fx)), G])
    r = fx - X @ np.linalg.lstsq(X, fx, rcond=None)[0]
    return float(np.var(r) / np.var(fx))

u = np.random.default_rng(0).random(10000); fx = np.exp(u); G = np.column_stack([u, u ** 2])
est, beta = cv_regression(fx, G, np.array([1 / 2, 1 / 3])); print(abs(est - (np.e - 1)) < 1e-3, round(residual_ratio(fx, u[:, None]), 3), round(residual_ratio(fx, G), 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True 0.016 0.00011", "True 0.016 0.016", "False 0.016 0.00011", "True 0.00011 0.016"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>optimal_c(fx, gx)</C> from the sample covariance and variance (ddof = 1); <C>cv_estimate(fx, gx, g_mean)</C>;
          and <C>variance_ratio(fx, gx)</C>, the fraction 1 − ρ² of variance left.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def optimal_c(fx, gx):
    return 0.0

def cv_estimate(fx, gx, g_mean):
    return float(np.mean(fx))

def variance_ratio(fx, gx):
    return 1.0
`,
        solution: CV,
        tests: [
          { name: "linear", code: `g = np.array([0.1, 0.5, 0.2, 0.9]); f = 3 * g + 1
assert abs(optimal_c(f, g) - 3) < 1e-12 and variance_ratio(f, g) < 1e-12 and abs(cv_estimate(f, g, 0.5) - 2.5) < 1e-12` },
          { name: "noisy", code: `rng = np.random.default_rng(0); g = rng.random(5000); f = g + 0.1 * rng.normal(size=5000)
assert abs(optimal_c(f, g) - 1) < 0.05 and 0.05 < variance_ratio(f, g) < 0.2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cv_regression(fx, G, g_means)</C>, returning the intercept and slopes of the regression of fx on the
          centred columns of G, and <C>residual_ratio(fx, G)</C>, the residual variance over the variance of fx.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cv_regression(fx, G, g_means):
    return float(np.mean(fx)), np.zeros(G.shape[1])

def residual_ratio(fx, G):
    return 1.0
`,
        solution: RG,
        tests: [
          { name: "exact", code: `rng = np.random.default_rng(1); G = rng.random((50, 2)); f = 1 + 2 * G[:, 0] - G[:, 1]
est, beta = cv_regression(f, G, np.array([0.5, 0.25])); assert abs(est - 1.75) < 1e-9 and np.allclose(beta, [2, -1]) and residual_ratio(f, G) < 1e-12` },
          { name: "independent", code: `rng = np.random.default_rng(2); G = rng.random((4000, 1)); f = rng.random(4000); assert residual_ratio(f, G) > 0.99` },
        ],
      },
    },
    {
      key: "square",
      rung: "stretch",
      prompt: (
        <p>
          Estimating <M>{"\\mathbb E[U^2]"}</M> for U uniform with control variate U, what fraction of the variance remains at the best
          coefficient? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Control variates change what is averaged. Importance sampling changes where the samples are drawn, sending them to
        the regions that matter and correcting with weights, which is the cure for rare events.
      </p>
    </>
  ),
};
