import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IrlsConvViz } from "@/components/viz/IrlsConvViz";
import type { LessonContent } from "@/lib/types";

const IRLS = `import numpy as np

LINKS = {"poisson": (np.exp, lambda mu: mu, lambda y: np.log(y + 0.5)),
         "bernoulli": (lambda eta: 1 / (1 + np.exp(-eta)), lambda mu: mu * (1 - mu),
                       lambda y: np.log((y + 0.5) / (1.5 - y)))}

def irls(X, y, family, iters=25):
    inv_link, var, start = LINKS[family]
    eta = start(y)
    for _ in range(iters):
        mu = inv_link(eta); V = var(mu)
        z = eta + (y - mu) / V
        s = np.sqrt(V)
        w = np.linalg.lstsq(X * s[:, None], z * s, rcond=None)[0]
        eta = X @ w
    return w

def glm_se(X, w, family):
    inv_link, var, _ = LINKS[family]
    V = var(inv_link(X @ w))
    return np.sqrt(np.diag(np.linalg.inv(X.T @ (X * V[:, None]))))`;

const NEWT = `import numpy as np

def newton_1d(f1, f2, x, steps):
    path = [x]
    for _ in range(steps):
        x = x - f1(x) / f2(x)
        path.append(x)
    return path

def errors(path, target):
    return [float(abs(p - target)) for p in path]`;

export const lesson: LessonContent = {
  id: "l2.2.5",
  minutes: 55,
  links: {
    requires: ["l2.2.4", "l1.2.4"],
    revisits: ["m9.3.5", "l2.2.1"],
    foreshadows: ["l2.5.2"],
  },

  puzzle: (
    <>
      <p>
        Statistical software fits a logistic regression with thousands of rows in five or six iterations and reports
        standard errors alongside, while gradient descent on the same problem needs hundreds of steps and gives no standard
        errors at all. What is the software doing differently, and why does it come with uncertainty for free?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent uses only the slope, so its step size must be safe for the steepest direction and is then too
        timid for the flat ones. Newton&apos;s method also uses the curvature: it jumps to the minimum of the local quadratic
        approximation. Near the answer that approximation is excellent and the error squares each step. For a GLM the
        Newton step is a weighted least-squares fit, and the curvature it uses is exactly the Fisher information.
      </p>
      <IrlsConvViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Newton's method converges quadratically">
        <p>
          Let f be three times continuously differentiable near a minimiser x* with f″(x*) &gt; 0. The Newton iteration{" "}
          <M>{"x_{k+1} = x_k - f'(x_k)/f''(x_k)"}</M> started close enough to x* satisfies{" "}
          <M>{"|x_{k+1} - x^*| \\leq C|x_k - x^*|^2"}</M> for a constant C.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"e_k = x_k - x^*"}</M>. Taylor&apos;s theorem with <M>{"f'(x^*) = 0"}</M> gives{" "}
          <M>{"0 = f'(x^*) = f'(x_k) - f''(x_k)e_k + \\tfrac12 f^{\\prime\\prime\\prime}(\\xi)e_k^2"}</M> for some ξ between them. Dividing by{" "}
          <M>{"f''(x_k)"}</M> and rearranging, <M>{"e_{k+1} = e_k - f'(x_k)/f''(x_k) = \\frac{f^{\\prime\\prime\\prime}(\\xi)}{2f''(x_k)}e_k^2"}</M>.
          Near x*, f″ is bounded away from 0 and f‴ is bounded, so the factor is at most some C; if{" "}
          <M>{"C|e_0| < 1"}</M> the errors shrink and stay in the region.
        </p>
      </Proof>
      <Example title="digits double, or everything breaks">
        <p>
          For <M>{"f(x) = x - \\log x"}</M>, the step is <M>{"x_{k+1} = 2x_k - x_k^2"}</M>, so{" "}
          <M>{"1 - x_{k+1} = (1 - x_k)^2"}</M>: from 0.5 the errors are 0.5, 0.25, 0.0625, 0.0039, 0.000015. From 3 the same
          formula gives −3, outside the domain. Newton&apos;s guarantee is local; practical code halves the step when the
          objective does not decrease and chooses a sensible start.
        </p>
        <Code>{NEWT}</Code>
      </Example>

      <Theorem title="Newton for a GLM is iteratively reweighted least squares">
        <p>
          For a canonical-link GLM with current <M>{"\\eta = Xw"}</M>, <M>{"\\mu"}</M> and{" "}
          <M>{"V = \\mathrm{diag}(A''(\\eta_i))"}</M>, the Newton step is
        </p>
        <MD>{"w_{\\text{new}} = (X^\\top VX)^{-1}X^\\top V z, \\qquad z = \\eta + V^{-1}(y - \\mu),"}</MD>
        <p>the weighted least-squares fit of the working response z with weights V.</p>
      </Theorem>
      <Proof>
        <p>
          The negative log-likelihood (with φ = 1) has gradient <M>{"-X^\\top(y - \\mu)"}</M> and Hessian{" "}
          <M>{"X^\\top VX"}</M>, so Newton gives{" "}
          <M>{"w_{\\text{new}} = w + (X^\\top VX)^{-1}X^\\top(y - \\mu) = (X^\\top VX)^{-1}\\big(X^\\top VXw + X^\\top VV^{-1}(y - \\mu)\\big) = (X^\\top VX)^{-1}X^\\top Vz"}</M>.
          Scaling the rows of X and z by <M>{"\\sqrt{V_{ii}}"}</M> turns this into ordinary least squares, which is how the
          code solves it stably.
        </p>
        <Code>{IRLS}</Code>
      </Proof>
      <Remark title="standard errors for free">
        <p>
          At convergence, <M>{"X^\\top VX"}</M> is the observed and expected Fisher information, and the asymptotic
          normality of maximum likelihood gives <M>{"\\mathrm{Cov}(\\hat w) \\approx (X^\\top VX)^{-1}"}</M>. The last IRLS
          step has already formed this matrix, so standard errors cost one more inversion. Newton is also unchanged by an
          invertible linear change of features, which is why rescaling a feature in the viz does not slow it.
        </p>
      </Remark>
      <Remark title="when not to use Newton">
        <p>
          Each step costs about <M>{"np^2 + p^3"}</M> operations and <M>{"p^2"}</M> memory. With millions of parameters,
          as in neural networks, that is impossible, and quasi-Newton methods such as L-BFGS or first-order methods with
          adaptive steps take over. For GLMs with up to a few thousand features, IRLS remains the standard.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "step",
      rung: "check",
      prompt: <p>Apply one Newton step to f(x) = x − log x from x = 0.8. What is the new x?</p>,
      answer: { kind: "numeric", value: 0.96, tolerance: 0.0001 },
    },
    {
      key: "digits",
      rung: "check",
      prompt: <p>The error is 10⁻³ and each Newton step squares it. How many correct decimal digits are there after one more step?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "weights",
      rung: "apply",
      prompt: <p>In IRLS for a canonical-link GLM, what are the weights of the least-squares fit?</p>,
      answer: {
        kind: "choice",
        options: ["The variance function evaluated at the current means, A″(ηᵢ)", "The residuals yᵢ − μᵢ", "The reciprocals of the observed yᵢ", "All equal to 1"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

LINKS = {"poisson": (np.exp, lambda mu: mu, lambda y: np.log(y + 0.5)),
         "bernoulli": (lambda eta: 1 / (1 + np.exp(-eta)), lambda mu: mu * (1 - mu),
                       lambda y: np.log((y + 0.5) / (1.5 - y)))}

def irls(X, y, family, iters=25):
    inv_link, var, start = LINKS[family]
    eta = start(y)
    for _ in range(iters):
        mu = inv_link(eta); V = var(mu)
        z = eta + (y - mu) / V
        s = np.sqrt(V)
        w = np.linalg.lstsq(X * s[:, None], z * s, rcond=None)[0]
        eta = X @ w
    return w

def glm_se(X, w, family):
    inv_link, var, _ = LINKS[family]
    V = var(inv_link(X @ w))
    return np.sqrt(np.diag(np.linalg.inv(X.T @ (X * V[:, None]))))

X = np.column_stack([np.ones(5), np.arange(5.0)]); y = np.array([1.0, 3.0, 4.0, 9.0, 15.0])
print(np.round(irls(X, y, "poisson", 1), 3), np.round(irls(X, y, "poisson", 2), 3), np.round(irls(X, y, "poisson", 5), 3))
print(np.round(glm_se(X, irls(X, y, "poisson"), "poisson"), 3))
Xb = np.column_stack([np.ones(6), [-2.0, -1.0, -0.5, 0.5, 1.0, 2.0]]); yb = np.array([0, 1, 0, 1, 0, 1.0])
print(np.round(irls(Xb, yb, "bernoulli"), 4) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.317 0.604] [0.282 0.613] [0.281 0.613]\n[0.507 0.155]\n[0.     0.6304]", "[0.281 0.613] [0.281 0.613] [0.281 0.613]\n[0.507 0.155]\n[0.     0.6304]", "[0.317 0.604] [0.282 0.613] [0.281 0.613]\n[0.257 0.024]\n[0.     0.6304]", "[0.317 0.604] [0.282 0.613] [0.281 0.613]\n[0.507 0.155]\n[0.6304 0.    ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def newton_1d(f1, f2, x, steps):
    path = [x]
    for _ in range(steps):
        x = x - f1(x) / f2(x)
        path.append(x)
    return path

def errors(path, target):
    return [float(abs(p - target)) for p in path]

f1, f2 = (lambda x: 1 - 1 / x), (lambda x: 1 / x ** 2)
print([round(e, 6) for e in errors(newton_1d(f1, f2, 0.5, 4), 1.0)])
print([round(v, 6) for v in newton_1d(f1, f2, 3.0, 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 0.25, 0.0625, 0.003906, 1.5e-05]\n[3.0, -3.0, -15.0]", "[0.5, 0.25, 0.125, 0.0625, 0.03125]\n[3.0, -3.0, -15.0]", "[0.5, 0.25, 0.0625, 0.003906, 1.5e-05]\n[3.0, 1.0, 1.0]", "[0.5, 0.5, 0.5, 0.5, 0.5]\n[3.0, -3.0, -15.0]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>LINKS</C>, mapping "poisson" and "bernoulli" to (inverse link, variance function, starting η from y),{" "}
          <C>irls(X, y, family, iters=25)</C>, which starts from η = start(y) and repeats the weighted least-squares update,
          and <C>glm_se(X, w, family)</C>, the square roots of the diagonal of (XᵀVX)⁻¹.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

LINKS = {}

def irls(X, y, family, iters=25):
    return np.zeros(X.shape[1])

def glm_se(X, w, family):
    return np.zeros(X.shape[1])
`,
        solution: IRLS,
        tests: [
          { name: "poisson", code: `X = np.ones((4, 1)); y = np.array([1.0, 2.0, 3.0, 6.0])
w = irls(X, y, "poisson")
assert abs(w[0] - np.log(3)) < 1e-10 and abs(glm_se(X, w, "poisson")[0] - 1 / np.sqrt(12)) < 1e-10` },
          { name: "logit", code: `X = np.ones((100, 1)); y = np.r_[np.ones(25), np.zeros(75)]
w = irls(X, y, "bernoulli")
assert abs(w[0] - np.log(1 / 3)) < 1e-10 and abs(glm_se(X, w, "bernoulli")[0] - 1 / np.sqrt(18.75)) < 1e-10` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newton_1d(f1, f2, x, steps)</C>, returning the list of iterates including the start, given functions for
          f′ and f″, and <C>errors(path, target)</C>, the absolute errors as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def newton_1d(f1, f2, x, steps):
    return [x]

def errors(path, target):
    return []
`,
        solution: NEWT,
        tests: [
          { name: "quad", code: `p = newton_1d(lambda x: 2 * (x - 3), lambda x: 2.0, 10.0, 2)
assert p == [10.0, 3.0, 3.0] and errors(p, 3.0) == [7.0, 0.0, 0.0]` },
          { name: "sqrt2", code: `p = newton_1d(lambda x: x ** 2 - 2, lambda x: 2 * x, 1.5, 4)
e = errors(p, 2 ** 0.5)
assert len(p) == 5 and e[3] < 1e-10 and e[2] < e[1] ** 2` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a canonical-link GLM with gradient of the NLL −Xᵀ(y − μ) and Hessian XᵀVX, prove that the Newton step from w equals (XᵀVX)⁻¹XᵀVz with z = Xw + V⁻¹(y − μ).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the Newton update w + (XᵀVX)⁻¹Xᵀ(y − μ).",
          "Rewrites w as (XᵀVX)⁻¹XᵀVXw so both terms share the factor (XᵀVX)⁻¹.",
          "Combines XᵀVXw + Xᵀ(y − μ) = XᵀV(Xw + V⁻¹(y − μ)) = XᵀVz, giving the stated form.",
        ],
      },
    },
    {
      key: "se",
      rung: "stretch",
      prompt: <p>An intercept-only logistic regression on 100 examples, 25 of them positive. What is the standard error of the fitted intercept, 1/√(n p̂(1 − p̂))? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2309, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why Newton's method converges quadratically near a minimum, why it can fail far from one, how a Newton step for a GLM becomes a weighted least-squares fit, and where the standard errors come from.",

  glimpse: (
    <>
      <p>
        Linear models are now complete: likelihoods, priors, posteriors and fitting. The next chapter keeps the linearity
        but moves it into a feature space you never compute explicitly, starting with the classifier that maximises the
        margin between classes.
      </p>
    </>
  ),
};
