import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PoissonGlmViz } from "@/components/viz/PoissonGlmViz";
import type { LessonContent } from "@/lib/types";

const GLM = `import numpy as np

FAMILIES = {
    "gaussian": (lambda eta: eta, lambda mu: np.ones_like(mu)),
    "poisson": (np.exp, lambda mu: mu),
    "bernoulli": (lambda eta: 1 / (1 + np.exp(-eta)), lambda mu: mu * (1 - mu)),
}

def score(X, y, w, family):
    inv_link, _ = FAMILIES[family]
    return X.T @ (y - inv_link(X @ w))

def fit_glm_gd(X, y, family, lr, steps):
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w += lr * score(X, y, w, family) / len(y)
    return w`;

const POIS = `import numpy as np

def poisson_nll(X, y, w, offset=0.0):
    eta = X @ w + offset
    return float(np.sum(np.exp(eta) - y * eta))

def poisson_deviance(y, mu):
    safe = np.where(y > 0, y, 1.0)
    term = np.where(y > 0, y * np.log(safe / mu), 0.0)
    return float(2 * np.sum(term - (y - mu)))`;

export const lesson: LessonContent = {
  id: "l2.2.4",
  minutes: 55,
  links: {
    requires: ["l2.2.3", "m9.3.2"],
    revisits: ["l2.1.2", "m7.2.2"],
    foreshadows: ["l2.2.5"],
  },

  puzzle: (
    <>
      <p>
        You need to predict how many support tickets each customer files per month. Least squares will happily predict −0.7
        tickets for small customers, and it assumes a customer who files 50 tickets is as predictable as one who files 1.
        Logistic regression fixed the analogous problems for labels. What is the general recipe behind both fixes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick a distribution that suits the kind of target: Gaussian for real values, Bernoulli for labels, Poisson for
        counts. Keep a linear score, and connect it to the mean through a link function that respects the target&apos;s
        range. For the families of the exponential family there is a natural link, and with it every model has the same
        gradient, data minus prediction, times the features.
      </p>
      <PoissonGlmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="generalised linear model">
        <p>A GLM has three parts:</p>
        <ul>
          <li>
            a distribution for y from an exponential dispersion family,{" "}
            <M>{"p(y \\mid \\theta) = h(y, \\phi)\\exp\\big((y\\theta - A(\\theta))/\\phi\\big)"}</M>, with mean{" "}
            <M>{"\\mu = A'(\\theta)"}</M> and variance <M>{"\\phi A''(\\theta)"}</M>;
          </li>
          <li>a linear predictor <M>{"\\eta = x^\\top w"}</M>;</li>
          <li>
            a link g with <M>{"g(\\mu) = \\eta"}</M>. The canonical link takes θ = η, that is{" "}
            <M>{"g = (A')^{-1}"}</M>.
          </li>
        </ul>
        <p>
          Gaussian: <M>{"A(\\theta) = \\theta^2/2"}</M>, identity link. Bernoulli: <M>{"A(\\theta) = \\log(1 + e^\\theta)"}</M>,
          logit link. Poisson: <M>{"A(\\theta) = e^\\theta"}</M>, log link, variance equal to the mean.
        </p>
      </Definition>

      <Theorem title="the canonical-link score">
        <p>
          With the canonical link, the gradient of the log-likelihood is <M>{"X^\\top(y - \\mu)/\\phi"}</M> and its Hessian is{" "}
          <M>{"-X^\\top V X/\\phi"}</M> with <M>{"V = \\mathrm{diag}(A''(\\eta_i))"}</M>, so the log-likelihood is concave in
          w.
        </p>
      </Theorem>
      <Proof>
        <p>
          The log-likelihood is <M>{"\\sum_i (y_i\\eta_i - A(\\eta_i))/\\phi"}</M> plus terms free of w, with{" "}
          <M>{"\\eta_i = x_i^\\top w"}</M>. Differentiating, <M>{"\\partial/\\partial w = \\sum_i (y_i - A'(\\eta_i))x_i/\\phi = X^\\top(y - \\mu)/\\phi"}</M>.
          Differentiating again gives <M>{"-\\sum_i A''(\\eta_i)x_ix_i^\\top/\\phi"}</M>, and <M>{"A'' \\geq 0"}</M> because it
          is a variance, so the Hessian is negative semidefinite.
        </p>
        <Code>{GLM}</Code>
      </Proof>
      <Remark title="consequences of the score equation">
        <p>
          At the maximum, <M>{"X^\\top(y - \\hat\\mu) = 0"}</M>. If X has an intercept column, the fitted means add up to the
          observed total, as the code&apos;s check 32.0 = 32.0 shows. The same equations are the normal equations for the
          Gaussian family and the logistic gradient for the Bernoulli family, which is why one routine fits them all.
        </p>
      </Remark>

      <Example title="Poisson regression with exposure">
        <p>
          Counts are often collected over different exposures: tickets over different numbers of days, events over
          different populations. Modelling the rate, <M>{"\\log\\mu_i = \\log t_i + x_i^\\top w"}</M>, puts{" "}
          <M>{"\\log t_i"}</M> into the predictor with coefficient fixed at 1, called an offset. A coefficient{" "}
          <M>{"w_j"}</M> then multiplies the rate by <M>{"e^{w_j}"}</M> per unit of <M>{"x_j"}</M>.
        </p>
        <p>
          The deviance, twice the gap between the log-likelihood of a model that fits every point exactly and that of the
          fitted model, plays the role of the residual sum of squares; for the Gaussian family it is RSS/σ².
        </p>
        <Code>{POIS}</Code>
      </Example>
      <Remark title="when the variance is wrong">
        <p>
          Real counts are often overdispersed, with variance well above the mean. The Poisson GLM still estimates the mean
          consistently, but its standard errors are too small. A negative binomial family, or scaling the variance by an
          estimated φ, fixes the uncertainty without changing the recipe.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mu",
      rung: "check",
      prompt: <p>A Poisson GLM has log μ = 0.5 + 0.2x. What is μ at x = 5? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 4.4817, tolerance: 0.0001 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>In the same model, by what factor does the mean count multiply when x increases by 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.2214, tolerance: 0.0001 },
    },
    {
      key: "link",
      rung: "apply",
      prompt: <p>What is the canonical link for a Bernoulli response?</p>,
      answer: { kind: "choice", options: ["The logit, log(μ/(1 − μ))", "The identity", "The log", "The probit, Φ⁻¹(μ)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

FAMILIES = {
    "gaussian": (lambda eta: eta, lambda mu: np.ones_like(mu)),
    "poisson": (np.exp, lambda mu: mu),
    "bernoulli": (lambda eta: 1 / (1 + np.exp(-eta)), lambda mu: mu * (1 - mu)),
}

def score(X, y, w, family):
    inv_link, _ = FAMILIES[family]
    return X.T @ (y - inv_link(X @ w))

def fit_glm_gd(X, y, family, lr, steps):
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w += lr * score(X, y, w, family) / len(y)
    return w

X = np.column_stack([np.ones(5), np.arange(5.0)]); y = np.array([1.0, 3.0, 4.0, 9.0, 15.0])
w = fit_glm_gd(X, y, "poisson", 0.02, 20000)
print(np.round(w, 3), np.allclose(score(X, y, w, "poisson"), 0, atol=1e-6))
print(np.round(fit_glm_gd(X, y, "gaussian", 0.1, 5000), 3), np.round(np.linalg.lstsq(X, y, rcond=None)[0], 3))
print(round(float(np.exp(X @ w).sum()), 3), y.sum())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.281 0.613] True\n[-0.4  3.4] [-0.4  3.4]\n32.0 32.0", "[0.281 0.613] True\n[-0.4  3.4] [-0.4  3.4]\n30.1 32.0", "[0.281 0.613] False\n[-0.4  3.4] [-0.4  3.4]\n32.0 32.0", "[0.281 0.613] True\n[0.281 0.613] [-0.4  3.4]\n32.0 32.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def poisson_nll(X, y, w, offset=0.0):
    eta = X @ w + offset
    return float(np.sum(np.exp(eta) - y * eta))

def poisson_deviance(y, mu):
    safe = np.where(y > 0, y, 1.0)
    term = np.where(y > 0, y * np.log(safe / mu), 0.0)
    return float(2 * np.sum(term - (y - mu)))

expo = np.array([1.0, 2.0, 4.0]); c = np.array([2.0, 4.0, 8.0]); one = np.ones((3, 1))
print(round(poisson_nll(one, c, np.array([np.log(2.0)]), np.log(expo)), 3), round(poisson_nll(one, c, np.array([0.0]), np.log(expo)), 3))
print(poisson_deviance(c, c), round(poisson_deviance(np.array([0.0, 2.0]), np.array([1.0, 1.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-9.567 -6.863\n0.0 2.7726", "-6.863 -9.567\n0.0 2.7726", "-9.567 -6.863\n2.7726 0.0", "-9.567 -6.863\n0.0 1.3863"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write a dictionary <C>FAMILIES</C> mapping "gaussian", "poisson" and "bernoulli" to a pair (inverse canonical link,
          variance function), <C>score(X, y, w, family)</C>, the gradient Xᵀ(y − μ), and{" "}
          <C>fit_glm_gd(X, y, family, lr, steps)</C>, gradient ascent from zero using the score divided by n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

FAMILIES = {}

def score(X, y, w, family):
    return np.zeros(X.shape[1])

def fit_glm_gd(X, y, family, lr, steps):
    return np.zeros(X.shape[1])
`,
        solution: GLM,
        tests: [
          { name: "score", code: `X = np.ones((2, 1)); y = np.array([0.0, 1.0])
assert np.allclose(score(X, y, np.zeros(1), "bernoulli"), [0.0]) and np.allclose(score(X, y, np.zeros(1), "poisson"), [-1.0]) and np.allclose(FAMILIES["poisson"][1](np.array([3.0])), [3.0])` },
          { name: "fit", code: `X = np.ones((4, 1)); y = np.array([1.0, 2.0, 3.0, 6.0])
assert abs(fit_glm_gd(X, y, "poisson", 0.1, 3000)[0] - np.log(3)) < 1e-6 and abs(fit_glm_gd(X, np.array([0, 1, 1, 1.0]), "bernoulli", 0.5, 5000)[0] - np.log(3)) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>poisson_nll(X, y, w, offset=0.0)</C>, the Poisson negative log-likelihood Σ(μᵢ − yᵢηᵢ) without the
          log yᵢ! term, where ηᵢ = xᵢᵀw + offset, and <C>poisson_deviance(y, mu)</C>, 2Σ(yᵢ log(yᵢ/μᵢ) − (yᵢ − μᵢ)) with the
          log term taken as 0 when yᵢ = 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def poisson_nll(X, y, w, offset=0.0):
    return 0.0

def poisson_deviance(y, mu):
    return 0.0
`,
        solution: POIS,
        tests: [
          { name: "nll", code: `assert abs(poisson_nll(np.ones((2, 1)), np.array([1.0, 3.0]), np.array([0.0]), np.log(np.array([1.0, 2.0]))) - (3.0 - 3 * np.log(2))) < 1e-12` },
          { name: "dev", code: `assert abs(poisson_deviance(np.array([3.0]), np.array([1.0])) - 2 * (3 * np.log(3) - 2)) < 1e-12 and abs(poisson_deviance(np.array([0.0]), np.array([2.0])) - 4.0) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a GLM with canonical link, log-likelihood Σ(yᵢηᵢ − A(ηᵢ))/φ and ηᵢ = xᵢᵀw, prove that the gradient is Xᵀ(y − μ)/φ and that the log-likelihood is concave in w.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates each term using ∂ηᵢ/∂w = xᵢ and A′(ηᵢ) = μᵢ to get Σ(yᵢ − μᵢ)xᵢ/φ = Xᵀ(y − μ)/φ.",
          "Differentiates again to get the Hessian −Σ A″(ηᵢ)xᵢxᵢᵀ/φ.",
          "Argues A″ ≥ 0 (it is a variance up to φ > 0), so the Hessian is negative semidefinite and the log-likelihood concave.",
        ],
      },
    },
    {
      key: "dev",
      rung: "stretch",
      prompt: <p>What is the Poisson deviance of one observation y = 3 with fitted mean μ = 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.5917, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what the three parts of a generalised linear model are, what a canonical link is, why every canonical GLM has gradient Xᵀ(y − μ), and how Poisson regression with an offset models rates.",

  glimpse: (
    <>
      <p>
        Gradient ascent on a GLM is slow when features are badly scaled. Because the Hessian has the simple form XᵀVX, a
        Newton step is a weighted least-squares solve, and the next lesson turns that into the standard fitting algorithm.
      </p>
    </>
  ),
};
