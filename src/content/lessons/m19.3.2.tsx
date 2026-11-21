import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrnsteinUhlenbeckViz } from "@/components/viz/OrnsteinUhlenbeckViz";
import type { LessonContent } from "@/lib/types";

const OU = `import numpy as np

def ou_mean(x0, theta, t):
    return x0 * np.exp(-theta * t)

def ou_var(theta, sigma, t):
    return sigma ** 2 * (1 - np.exp(-2 * theta * t)) / (2 * theta)

def ou_exact_step(x, theta, sigma, dt, z):
    return ou_mean(x, theta, dt) + np.sqrt(ou_var(theta, sigma, dt)) * z   # no discretisation error`;

const VP = `import numpy as np

def vp_alpha(beta, t):
    return np.exp(-beta * t / 2)                         # dX = -beta X / 2 dt + sqrt(beta) dB

def vp_sample(x0, beta, t, eps):
    a = vp_alpha(beta, t)
    return a * x0 + np.sqrt(1 - a ** 2) * eps            # signal shrinks, noise fills the variance back to 1

def stationary_cov(theta, sigma, lag):
    return sigma ** 2 / (2 * theta) * np.exp(-theta * abs(lag))`;

export const lesson: LessonContent = {
  id: "m19.3.2",
  minutes: 55,
  links: {
    requires: ["m19.3.1", "m19.2.3"],
    revisits: ["m13.4.4", "m19.2.2"],
    foreshadows: ["m19.3.3"],
  },

  puzzle: (
    <>
      <p>
        A diffusion model adds noise to an image by running an SDE for some time, and training needs noisy images at thousands of
        random times. Simulating the SDE step by step for each one would be far too slow. Yet training code draws the noisy image at
        any time t in one line: <M>{"x_t = \\alpha_t x_0 + \\sqrt{1 - \\alpha_t^2}\\, \\varepsilon"}</M> with ε standard normal. Which
        SDE has this property, and why does its solution not need to be simulated?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Ornstein–Uhlenbeck process is Brownian motion on a spring: the drift <M>{"-\\theta X"}</M> pulls it back to zero at a rate
        proportional to its distance, and the noise pushes it about. The equation is linear, so the solution is the decayed initial
        value plus a weighted sum of Gaussian noise, which is Gaussian. Its mean decays like <M>{"e^{-\\theta t}"}</M> and its
        variance rises to <M>{"\\sigma^2/(2\\theta)"}</M>, whatever the starting point. With the right choice of constants, the
        variance stays exactly 1 for unit-variance data, and the process slides each image towards pure noise along a path whose law
        at every time is known in closed form.
      </p>
      <OrnsteinUhlenbeckViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the Ornstein–Uhlenbeck process">
        <p>
          The SDE <M>{"dX = -\\theta X\\, dt + \\sigma\\, dB"}</M>, <M>{"X_0 = x_0"}</M>, with θ &gt; 0 has the unique solution
        </p>
        <MD>{"X_t = e^{-\\theta t} x_0 + \\sigma \\int_0^t e^{-\\theta(t - s)}\\, dB_s,"}</MD>
        <p>
          which is Gaussian with mean <M>{"e^{-\\theta t} x_0"}</M> and variance{" "}
          <M>{"\\frac{\\sigma^2}{2\\theta}(1 - e^{-2\\theta t})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The coefficients are Lipschitz, so the solution is unique (m19.3.1). Apply Itô&apos;s formula to{" "}
          <M>{"f(t, x) = e^{\\theta t} x"}</M>: <M>{"\\partial_t f = \\theta f"}</M>, <M>{"\\partial_x f = e^{\\theta t}"}</M>,{" "}
          <M>{"\\partial_x^2 f = 0"}</M>, so{" "}
          <M>{"d(e^{\\theta t} X_t) = \\theta e^{\\theta t} X\\, dt + e^{\\theta t}(-\\theta X\\, dt + \\sigma\\, dB) = \\sigma e^{\\theta t} dB"}</M>
          . Integrating and multiplying by <M>{"e^{-\\theta t}"}</M> gives the formula. The integral is a Wiener integral of a
          deterministic function, Gaussian with mean zero and, by the isometry (m19.2.2), variance{" "}
          <M>{"\\sigma^2\\int_0^t e^{-2\\theta(t-s)} ds = \\frac{\\sigma^2}{2\\theta}(1 - e^{-2\\theta t})"}</M>.
        </p>
      </Proof>

      <Definition title="exact simulation">
        <p>
          <C>ou_mean</C> and <C>ou_var</C> are the mean and variance after time t. Because the process is Markov with these Gaussian
          transitions, <C>ou_exact_step</C> advances any step size with no discretisation error, given a standard normal z.
        </p>
        <Code>{OU}</Code>
      </Definition>

      <Theorem title="stationarity">
        <p>
          The law <M>{"N(0, \\sigma^2/(2\\theta))"}</M> is stationary: if <M>{"X_0"}</M> has this law and is independent of B, so does
          every <M>{"X_t"}</M>, and then <M>{"\\operatorname{Cov}(X_s, X_t) = \\frac{\\sigma^2}{2\\theta} e^{-\\theta|t - s|}"}</M>. From any
          starting point, the law of <M>{"X_t"}</M> converges to it.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"X_0 \\sim N(0, v)"}</M> and <M>{"v = \\sigma^2/(2\\theta)"}</M>, <M>{"X_t"}</M> is a sum of independent Gaussians
          with variance <M>{"e^{-2\\theta t} v + v(1 - e^{-2\\theta t}) = v"}</M>. For s &lt; t, the solution from time s gives{" "}
          <M>{"X_t = e^{-\\theta(t-s)} X_s + (\\text{noise after } s)"}</M>, independent of <M>{"X_s"}</M>, so the covariance is{" "}
          <M>{"e^{-\\theta(t-s)}v"}</M>. From a fixed <M>{"x_0"}</M>, the mean tends to 0 and the variance to v, and Gaussian laws with
          converging parameters converge.
        </p>
      </Proof>

      <Definition title="the variance-preserving SDE">
        <p>
          Diffusion models use <M>{"dX = -\\tfrac12\\beta(t) X\\, dt + \\sqrt{\\beta(t)}\\, dB"}</M>, an OU process with a time-varying
          rate. With constant β it has θ = β/2 and <M>{"\\sigma^2 = \\beta"}</M>, so the stationary variance is 1, and{" "}
          <M>{"X_t = \\alpha_t X_0 + \\sqrt{1 - \\alpha_t^2}\\, \\varepsilon"}</M> with <M>{"\\alpha_t = e^{-\\beta t/2}"}</M> (
          <C>vp_alpha</C>, <C>vp_sample</C>). For a general schedule, <M>{"\\alpha_t = \\exp(-\\tfrac12\\int_0^t \\beta(s)\\, ds)"}</M>.{" "}
          <C>stationary_cov</C> is the stationary covariance at a given lag.
        </p>
        <Code>{VP}</Code>
      </Definition>

      <Example title="the puzzle, resolved">
        <p>
          The forward process of a diffusion model is the variance-preserving OU process. Its solution is explicit, so the noisy image
          at time t is drawn directly from <M>{"N(\\alpha_t x_0, (1 - \\alpha_t^2) I)"}</M>, without simulating the path. If the data
          have unit variance, so does <M>{"X_t"}</M> at every time, and as t grows <M>{"\\alpha_t \\to 0"}</M> and the image becomes
          standard Gaussian noise, the stationary law, which is where sampling starts.
        </p>
      </Example>

      <Remark title="Langevin dynamics">
        <p>
          The OU process is the Langevin diffusion <M>{"dX = \\nabla \\log p(X)\\, dt + \\sqrt 2\\, dB"}</M> (m13.4.4) for the Gaussian
          target <M>{"p = N(0, 1)"}</M>, for which <M>{"\\nabla \\log p(x) = -x"}</M>. Replace the Gaussian with any density and the same
          equation has p as its stationary law, as the Fokker–Planck equation of the next lesson shows; this is the bridge between
          scores and sampling.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          For <M>{"dX = -2X\\, dt + dB"}</M> with <M>{"X_0 = 0"}</M>, what is the variance of <M>{"X_1"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.245, tolerance: 0.0006 },
    },
    {
      key: "noise",
      rung: "check",
      prompt: (
        <p>
          In the variance-preserving SDE with constant β = 4, what is the variance of the noise part of <M>{"X_1"}</M>,{" "}
          <M>{"1 - \\alpha_1^2"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.982, tolerance: 0.0006 },
    },
    {
      key: "exact",
      rung: "apply",
      prompt: <p>Why can <C>ou_exact_step</C> take a step of any size without error, unlike a generic SDE solver?</p>,
      answer: {
        kind: "choice",
        options: [
          "The process is Markov and its transition law over any time is a known Gaussian, so each step samples it exactly",
          "The drift is zero on average, so it can be ignored",
          "The noise is small compared with the drift",
          "Large steps are always accurate for linear equations solved by the Euler method",
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

def ou_mean(x0, theta, t):
    return x0 * np.exp(-theta * t)

def ou_var(theta, sigma, t):
    return sigma ** 2 * (1 - np.exp(-2 * theta * t)) / (2 * theta)

def ou_exact_step(x, theta, sigma, dt, z):
    return ou_mean(x, theta, dt) + np.sqrt(ou_var(theta, sigma, dt)) * z   # no discretisation error

theta, sigma = 1.0, 2.0
print(round(ou_mean(2.0, 0.5, 2.0), 4), round(ou_var(theta, sigma, 100.0), 4), round(ou_exact_step(1.0, theta, sigma, 0.5, 0.0), 4), round(ou_exact_step(1.0, theta, sigma, 0.5, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.7358 2.0 0.6065 1.7309", "0.7358 4.0 0.6065 1.7309", "1.2131 2.0 0.6065 1.7309", "0.7358 2.0 0.3679 1.7309"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def vp_alpha(beta, t):
    return np.exp(-beta * t / 2)                         # dX = -beta X / 2 dt + sqrt(beta) dB

def vp_sample(x0, beta, t, eps):
    a = vp_alpha(beta, t)
    return a * x0 + np.sqrt(1 - a ** 2) * eps            # signal shrinks, noise fills the variance back to 1

def stationary_cov(theta, sigma, lag):
    return sigma ** 2 / (2 * theta) * np.exp(-theta * abs(lag))

a = vp_alpha(2.0, 0.5)
print(round(a, 4), round(vp_sample(3.0, 2.0, 0.5, 1.0), 4), stationary_cov(1.0, 2.0, 0.0), round(stationary_cov(1.0, 2.0, -1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6065 2.6147 2.0 0.7358", "0.3679 2.0349 2.0 0.7358", "0.6065 2.6147 4.0 1.4715", "0.6065 1.8196 2.0 0.7358"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ou_mean(x0, theta, t)</C>, <C>ou_var(theta, sigma, t)</C> and <C>ou_exact_step(x, theta, sigma, dt, z)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ou_mean(x0, theta, t):
    return x0

def ou_var(theta, sigma, t):
    return sigma ** 2 * t

def ou_exact_step(x, theta, sigma, dt, z):
    return x - theta * x * dt + sigma * np.sqrt(dt) * z
`,
        solution: OU,
        tests: [
          { name: "moments", code: `assert abs(ou_mean(3.0, 2.0, 0.5) - 3 / np.e) < 1e-12 and abs(ou_var(0.5, 1.0, 2.0) - (1 - np.exp(-2))) < 1e-12` },
          { name: "step", code: `assert abs(ou_exact_step(2.0, 1.0, np.sqrt(2.0), 1.0, 2.0) - (2 / np.e + 2 * np.sqrt(1 - np.exp(-2)))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vp_alpha(beta, t)</C>, <C>vp_sample(x0, beta, t, eps)</C> and <C>stationary_cov(theta, sigma, lag)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vp_alpha(beta, t):
    return np.exp(-beta * t)

def vp_sample(x0, beta, t, eps):
    return x0 + eps

def stationary_cov(theta, sigma, lag):
    return sigma ** 2 / (2 * theta)
`,
        solution: VP,
        tests: [
          { name: "alpha", code: `assert abs(vp_alpha(1.0, 2.0) - np.exp(-1)) < 1e-12 and abs(vp_sample(1.0, 2.0, 1.0, 0.0) - np.exp(-1)) < 1e-12\nassert abs(vp_sample(0.0, 2.0 * np.log(2), 1.0, 1.0) - np.sqrt(0.75)) < 1e-12` },
          { name: "cov", code: `assert abs(stationary_cov(0.5, 1.0, 2.0) - np.exp(-1)) < 1e-12 and abs(stationary_cov(0.5, 1.0, -2.0) - np.exp(-1)) < 1e-12` },
        ],
      },
    },
    {
      key: "decor",
      rung: "stretch",
      prompt: (
        <p>
          A stationary OU process has θ = 0.25. After how long does the correlation between <M>{"X_0"}</M> and <M>{"X_t"}</M> fall to
          one half? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.77, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The OU process sends every starting distribution towards the same Gaussian. The next lesson writes down how the density of
        any SDE evolves, the Fokker–Planck equation, and uses it to show which densities a drift and noise leave unchanged.
      </p>
    </>
  ),
};
