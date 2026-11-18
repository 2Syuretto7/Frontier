import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SharedNoiseViz } from "@/components/viz/SharedNoiseViz";
import type { LessonContent } from "@/lib/types";

const PW = `import numpy as np

def em_tangent(rng, theta, sigma, x0, T, n, m):
    h, x, J = T / n, np.full(m, float(x0)), np.zeros(m)
    for _ in range(n):
        J = J * (1 - theta * h) - x * h
        x = x - theta * x * h + sigma * np.sqrt(h) * rng.normal(size=m)
    return x, J

def pathwise_grad(f_prime, x, J):
    return float(np.mean(f_prime(x) * J))`;

const IM = `import numpy as np

def implicit_dx(dF_dtheta, pdf, x):
    return -dF_dtheta(x) / pdf(x)

def smoothed_step_grad(mu, tau, eps):
    s = 1 / (1 + np.exp(-(mu + eps) / tau))
    g = s * (1 - s) / tau
    return float(g.mean()), float(g.std())`;

export const lesson: LessonContent = {
  id: "m13.6.2",
  minutes: 55,
  links: {
    requires: ["m13.2.4", "m13.5.3"],
    revisits: ["m13.6.1", "m13.2.1"],
    foreshadows: ["m13.6.3"],
  },

  puzzle: (
    <>
      <p>
        A simulation of a drug in the bloodstream depends on an elimination rate, and you want the derivative of the average
        peak concentration with respect to that rate. Running the simulation twice, at the rate and a nudged rate, and
        subtracting gives an answer so noisy as to be useless. Running it twice with the same random numbers gives a
        beautifully stable answer. Pushed to its limit, that trick differentiates the simulation itself, path by path. When
        does this work, and what breaks it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write every random quantity as a deterministic, smooth function of θ and some noise whose law does not involve θ.
        Then the expectation is an average over fixed noise of a smooth function of θ, and its derivative is the average of
        ordinary derivatives, computed by the chain rule through every step of the simulation. The estimator looks at how f
        changes, not merely at how big it is, which is why it is usually far less noisy than the score function. It needs f
        and the whole sampling path to be differentiable; a single jump or discrete choice along the way defeats it.
      </p>
      <SharedNoiseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the pathwise estimator">
        <p>
          If <M>{"X = g_\\theta(\\varepsilon)"}</M> with ε drawn from a fixed law and both f and <M>{"g_\\theta"}</M> differentiable,
          the pathwise estimate of <M>{"\\nabla_\\theta\\mathbb E f(X)"}</M> from one draw is{" "}
          <M>{"\\nabla f(g_\\theta(\\varepsilon))^\\top\\partial_\\theta g_\\theta(\\varepsilon)"}</M>. The reparameterisation lesson
          proved it unbiased under domination; here we study its variance and its reach.
        </p>
      </Definition>

      <Theorem title="a variance bound from smoothness">
        <p>
          If f is L-Lipschitz, the pathwise estimate has second moment at most{" "}
          <M>{"L^2\\,\\mathbb E\\lVert\\partial_\\theta g_\\theta(\\varepsilon)\\rVert^2"}</M>. For{" "}
          <M>{"X = \\mu + \\sigma\\varepsilon"}</M> with standard normal ε, the variance of the μ-derivative estimate is at most{" "}
          <M>{"L^2"}</M>, whatever the size of f.
        </p>
      </Theorem>
      <Proof>
        <p>
          By Cauchy-Schwarz, <M>{"|\\nabla f^\\top\\partial_\\theta g| \\le \\lVert\\nabla f\\rVert\\,\\lVert\\partial_\\theta g\\rVert \\le L\\lVert\\partial_\\theta g\\rVert"}</M>;
          square and take expectations, and variance is at most the second moment. For the location parameter{" "}
          <M>{"\\partial_\\mu g = 1"}</M>. Contrast the score function, whose variance grows with the magnitude of f: adding a
          constant c to f changes the score-function variance by roughly <M>{"c^2"}</M> times the variance of the score, and
          leaves the pathwise estimate untouched.
        </p>
      </Proof>

      <Theorem title="differentiating through a simulation">
        <p>
          Let <M>{"X_{k+1} = \\Phi_\\theta(X_k, \\varepsilon_k)"}</M> with noise independent of θ and Φ differentiable. Then{" "}
          <M>{"J_k = \\partial X_k/\\partial\\theta"}</M> obeys{" "}
          <M>{"J_{k+1} = \\partial_x\\Phi_\\theta\\,J_k + \\partial_\\theta\\Phi_\\theta"}</M>, <M>{"J_0 = 0"}</M>, and{" "}
          <M>{"\\mathbb E[f'(X_n)J_n]"}</M> is the exact derivative of <M>{"\\mathbb E f(X_n)"}</M> for the discretised process.
        </p>
      </Theorem>
      <Proof>
        <p>
          With the noise held fixed, <M>{"X_n"}</M> is a composition of differentiable maps of θ, and the recursion is the chain
          rule, applied forwards. Unbiasedness follows from the pathwise theorem with ε the whole noise sequence. For Euler-Maruyama
          on <M>{"dX = -\\theta X\\,dt + \\sigma\\,dB"}</M>,{" "}
          <M>{"\\Phi = x - \\theta xh + \\sigma\\sqrt h\\,\\varepsilon"}</M>, so <M>{"J_{k+1} = (1 - \\theta h)J_k - X_kh"}</M>. With
          σ = 0 this reproduces the derivative of <M>{"x_0(1 - \\theta h)^n"}</M> exactly. The shared-noise finite difference in
          the figure is this derivative with a finite step. With many parameters, the same chain rule is run backwards, which is
          the adjoint method and backpropagation through time.
        </p>
        <Code>{PW}</Code>
      </Proof>

      <Theorem title="implicit reparameterisation">
        <p>
          If X has a continuous CDF <M>{"F(x; \\theta)"}</M> and density p, the sample <M>{"X = F^{-1}(U; \\theta)"}</M> has{" "}
          <M>{"\\partial X/\\partial\\theta = -\\partial_\\theta F(X; \\theta)/p(X; \\theta)"}</M>, computable without inverting F.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiate the identity <M>{"F(X(\\theta); \\theta) = U"}</M> in θ, with U fixed:{" "}
          <M>{"p(X)\\,\\partial_\\theta X + \\partial_\\theta F(X) = 0"}</M>. For the exponential with rate λ,{" "}
          <M>{"F = 1 - e^{-\\lambda x}"}</M>, <M>{"\\partial_\\lambda F = xe^{-\\lambda x}"}</M> and <M>{"p = \\lambda e^{-\\lambda x}"}</M>,
          giving <M>{"-x/\\lambda"}</M>, which matches differentiating <M>{"X = -\\log U/\\lambda"}</M> directly. For gamma and
          beta variables, whose inverse CDFs have no closed form, <M>{"\\partial_\\theta F"}</M> is computed numerically and the
          formula gives exact pathwise gradients for samples drawn by any method.
        </p>
      </Proof>

      <Example title="where it breaks: discontinuities">
        <p>
          For <M>{"f(x) = \\mathbf 1\\{x > 0\\}"}</M> and <M>{"X = \\mu + \\varepsilon"}</M>, the true gradient of{" "}
          <M>{"P(X > 0)"}</M> is <M>{"\\varphi(\\mu)"}</M>, but <M>{"f' = 0"}</M> almost everywhere, so the pathwise estimate is
          identically 0: the domination condition fails because all the change happens at a single point. Replacing f by{" "}
          <M>{"\\sigma(x/\\tau)"}</M> restores a gradient with bias that vanishes as τ → 0, but the estimate is a spike of height{" "}
          <M>{"1/4\\tau"}</M> and width of order τ, so its standard deviation grows like <M>{"\\tau^{-1/2}"}</M>. At μ = 0.5 the
          smoothed means are about 0.20 at τ = 1 and 0.35 at τ = 0.1, against the true 0.352, while the standard deviation
          rises from 0.05 to 0.68 and keeps rising. The same trade-off governs the Gumbel-softmax relaxation.
        </p>
        <Code>{IM}</Code>
      </Example>

      <Remark title="discrete steps inside a simulation">
        <p>
          A Metropolis accept-reject step, a branching event or an argmax inside the simulator is a discontinuity of the path
          in θ, and pathwise gradients through it are biased, often badly. The remedies are to smooth the step, to switch to the
          score function for those choices, or to mix the two, using the pathwise estimator wherever the path is smooth.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "exp",
      rung: "check",
      prompt: <p>A sample x = 0.5 is drawn from an exponential distribution with rate λ = 4 by inversion. What is ∂x/∂λ?</p>,
      answer: { kind: "numeric", value: -0.125, tolerance: 0.0001 },
    },
    {
      key: "lip",
      rung: "check",
      prompt: (
        <p>
          f is 3-Lipschitz and <M>{"X = \\mu + \\sigma\\varepsilon"}</M> with standard normal ε. What is the largest possible
          variance of the one-sample pathwise estimate of the μ-derivative?
        </p>
      ),
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
    {
      key: "step",
      rung: "apply",
      prompt: <p>Why does the pathwise estimator return 0 for the derivative of P(μ + ε &gt; 0)?</p>,
      answer: {
        kind: "choice",
        options: [
          "The indicator has zero derivative wherever it is differentiable, and all of the change is concentrated at a jump the samples almost never hit",
          "The normal distribution cannot be reparameterised",
          "The estimator is biased by the variance of ε",
          "The probability does not depend on μ",
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

def em_tangent(rng, theta, sigma, x0, T, n, m):
    h, x, J = T / n, np.full(m, float(x0)), np.zeros(m)
    for _ in range(n):
        J = J * (1 - theta * h) - x * h
        x = x - theta * x * h + sigma * np.sqrt(h) * rng.normal(size=m)
    return x, J

def pathwise_grad(f_prime, x, J):
    return float(np.mean(f_prime(x) * J))

x, J = em_tangent(np.random.default_rng(0), 1.0, 0.5, 2.0, 1.0, 100, 20000)
print(round(pathwise_grad(lambda x: np.ones_like(x), x, J), 2), round(pathwise_grad(lambda x: 2 * x, x, J), 2))
x, J = em_tangent(np.random.default_rng(0), 1.0, 0.0, 2.0, 1.0, 4, 3); print(J.tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.74 -1.16\n[-0.84375, -0.84375, -0.84375]",
          "-0.74 -1.16\n[0.0, 0.0, 0.0]",
          "0.74 1.16\n[-0.84375, -0.84375, -0.84375]",
          "-0.74 -0.74\n[-0.84375, -0.84375, -0.84375]",
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

def implicit_dx(dF_dtheta, pdf, x):
    return -dF_dtheta(x) / pdf(x)

def smoothed_step_grad(mu, tau, eps):
    s = 1 / (1 + np.exp(-(mu + eps) / tau))
    g = s * (1 - s) / tau
    return float(g.mean()), float(g.std())

lam = 2.0; print(implicit_dx(lambda x: x * np.exp(-lam * x), lambda x: lam * np.exp(-lam * x), np.array([0.1, 0.5, 1.3])).round(3).tolist())
e = np.random.default_rng(1).normal(size=100000); print([round(smoothed_step_grad(0.5, t, e)[0], 2) for t in (1.0, 0.1)], smoothed_step_grad(0.5, 0.01, e)[1] > smoothed_step_grad(0.5, 0.1, e)[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.05, -0.25, -0.65]\n[0.2, 0.35] True",
          "[0.05, 0.25, 0.65]\n[0.2, 0.35] True",
          "[-0.05, -0.25, -0.65]\n[0.35, 0.2] True",
          "[-0.05, -0.25, -0.65]\n[0.2, 0.35] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>em_tangent(rng, theta, sigma, x0, T, n, m)</C>, simulating m Euler-Maruyama paths of{" "}
          <M>{"dX = -\\theta X\\,dt + \\sigma\\,dB"}</M> and returning the final values together with their derivatives in θ, and{" "}
          <C>pathwise_grad(f_prime, x, J)</C>, the pathwise estimate of the derivative of <M>{"\\mathbb E f(X_T)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def em_tangent(rng, theta, sigma, x0, T, n, m):
    return np.full(m, float(x0)), np.zeros(m)

def pathwise_grad(f_prime, x, J):
    return 0.0
`,
        solution: PW,
        tests: [
          { name: "deterministic", code: `x, J = em_tangent(np.random.default_rng(0), 0.5, 0.0, 3.0, 2.0, 10, 2); assert np.allclose(x, 3 * 0.9 ** 10) and np.allclose(J, -20 * 0.1 * 3 * 0.9 ** 9)` },
          { name: "noisy", code: `a = em_tangent(np.random.default_rng(5), 0.8, 0.6, 1.5, 2.0, 50, 4000); b = em_tangent(np.random.default_rng(5), 0.8 + 1e-6, 0.6, 1.5, 2.0, 50, 4000)
assert np.abs((b[0] - a[0]) / 1e-6 - a[1]).max() < 1e-4 and abs(pathwise_grad(lambda x: 3 * x ** 2, a[0], a[1]) - np.mean((b[0] ** 3 - a[0] ** 3) / 1e-6)) < 1e-4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>implicit_dx(dF_dtheta, pdf, x)</C>, the implicit reparameterisation derivative, and{" "}
          <C>smoothed_step_grad(mu, tau, eps)</C>, returning the mean and standard deviation over the noise array eps of the
          pathwise derivative in μ of <M>{"\\sigma((\\mu + \\varepsilon)/\\tau)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def implicit_dx(dF_dtheta, pdf, x):
    return np.zeros_like(x)

def smoothed_step_grad(mu, tau, eps):
    return 0.0, 0.0
`,
        solution: IM,
        tests: [
          { name: "implicit", code: `k = 2.0; x = np.array([0.3, 1.0, 2.5])
d = implicit_dx(lambda x: (x ** k) * np.log(x) * np.exp(-(x ** k)), lambda x: k * x ** (k - 1) * np.exp(-(x ** k)), x)
assert np.allclose(d, -x * np.log(x) / k)` },
          { name: "smooth", code: `m, s = smoothed_step_grad(0.0, 1.0, np.zeros(3)); assert abs(m - 0.25) < 1e-12 and s == 0.0
m, s = smoothed_step_grad(1.0, 0.5, np.array([-1.0, 0.0])); assert abs(m - 0.5 * (0.5 + 2 * 0.104994)) < 1e-5 and abs(s - 0.5 * (0.5 - 2 * 0.104994)) < 1e-5` },
        ],
      },
    },
    {
      key: "phi",
      rung: "stretch",
      prompt: <p>What is the exact derivative of P(μ + ε &gt; 0) at μ = 0.5, for standard normal ε?</p>,
      answer: { kind: "numeric", value: 0.3521, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Two unbiased estimators of the same gradient, one needing only log-probabilities and the other needing derivatives of
        everything. The last lesson compares their variances head to head and shows how to combine them.
      </p>
    </>
  ),
};
