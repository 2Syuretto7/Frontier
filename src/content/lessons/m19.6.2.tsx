import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SolverOrderViz } from "@/components/viz/SolverOrderViz";
import type { LessonContent } from "@/lib/types";

const STEP = `def euler_step(v, x, t, h):
    return x + h * v(x, t)

def heun_step(v, x, t, h):
    k1 = v(x, t)
    k2 = v(x + h * k1, t + h)                    # slope at the Euler prediction
    return x + h / 2 * (k1 + k2)

def solve(step, v, x, t0, t1, n):
    h = (t1 - t0) / n
    for k in range(n):
        x = step(v, x, t0 + k * h, h)
    return x`;

const SIGMA = `import numpy as np

def edm_velocity(x, sigma, m, s2):
    return sigma * (x - m) / (s2 + sigma ** 2)   # (x - D(x; sigma)) / sigma for data N(m, s2)

def ddim_step(x, eps_hat, sigma, sigma_next):
    return x + (sigma_next - sigma) * eps_hat    # Euler in sigma with the predicted noise as slope

def order_estimate(e_coarse, e_fine):
    return float(np.log2(e_coarse / e_fine))     # errors at n and 2n steps`;

export const lesson: LessonContent = {
  id: "m19.6.2",
  minutes: 55,
  links: {
    requires: ["m19.6.1", "m19.5.1"],
    revisits: ["m11.8.1", "m19.4.3"],
    foreshadows: ["m19.6.3"],
  },

  puzzle: (
    <>
      <p>
        Each step of a diffusion sampler calls a large network once, so the cost of a sample is the number of network
        evaluations. Early samplers used a thousand. Modern ones produce comparable images with thirty or fewer, from the same
        trained network. Nothing about the model changed. What changed in the way the ODE is solved, and why is one particular
        first-order method, DDIM, so much better than its order suggests?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Euler&apos;s method follows the slope at the start of each step, and its error shrinks only in proportion to the step.
        Heun&apos;s method takes a trial Euler step, measures the slope again at its end, and uses the average of the two slopes;
        the first-order errors cancel and the error shrinks with the square of the step, for two evaluations per step. The choice
        of variables matters too: written in terms of the noise level σ, the probability flow ODE has a slope equal to the predicted
        noise, which changes slowly, and Euler in these variables, DDIM, is exact when the data are a single point.
      </p>
      <SolverOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="order of a one-step method">
        <p>
          A method <M>{"x_{k+1} = x_k + h\\,\\Phi(x_k, t_k, h)"}</M> for <M>{"\\dot x = v(x, t)"}</M> has order p if one step from
          the exact solution errs by <M>{"O(h^{p+1})"}</M>. If Φ is Lipschitz in x, the errors of n = T/h steps, each amplified by at
          most <M>{"e^{LT}"}</M> afterwards, add to a global error of <M>{"O(h^p)"}</M>. <C>euler_step</C>, <C>heun_step</C> and{" "}
          <C>solve</C> implement the two methods compared in the visualisation.
        </p>
        <Code>{STEP}</Code>
      </Definition>

      <Theorem title="Heun's method has order two">
        <p>
          If v is twice continuously differentiable, the Heun step{" "}
          <M>{"x + \\tfrac h2 (k_1 + k_2)"}</M> with <M>{"k_1 = v(x, t)"}</M> and <M>{"k_2 = v(x + hk_1, t + h)"}</M> has local error{" "}
          <M>{"O(h^3)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Along the exact solution <M>{"\\ddot x = \\partial_t v + (\\partial_x v)\\,v"}</M>, so Taylor&apos;s theorem gives{" "}
          <M>{"x(t + h) = x + hv + \\tfrac{h^2}{2}(\\partial_t v + v\\,\\partial_x v) + O(h^3)"}</M>. Expanding{" "}
          <M>{"k_2 = v + h(\\partial_t v + v\\,\\partial_x v) + O(h^2)"}</M>, the Heun step is{" "}
          <M>{"x + hv + \\tfrac{h^2}{2}(\\partial_t v + v\\,\\partial_x v) + O(h^3)"}</M>, which agrees to that order. Euler stops at{" "}
          <M>{"x + hv"}</M> and has local error <M>{"O(h^2)"}</M>, order one (m11.8.1).
        </p>
      </Proof>

      <Theorem title="the ODE in the noise level">
        <p>
          For the variance-exploding process <M>{"X_\\sigma = X_0 + \\sigma Z"}</M>, with denoiser{" "}
          <M>{"D(x; \\sigma) = \\mathbb{E}[X_0 \\mid X_\\sigma = x]"}</M>, the probability flow ODE written with σ as time is
        </p>
        <MD>{"\\frac{dx}{d\\sigma} = \\frac{x - D(x; \\sigma)}{\\sigma} = \\hat\\varepsilon(x; \\sigma) ,"}</MD>
        <p>the predicted noise.</p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"dX = g\\,dW"}</M> with <M>{"g^2 = d(\\sigma^2)/dt"}</M>, the probability flow velocity of m19.5.1 is{" "}
          <M>{"-\\tfrac12 g^2 \\nabla \\log p = -\\sigma \\dot\\sigma \\nabla \\log p"}</M>. Dividing by <M>{"\\dot\\sigma"}</M>,{" "}
          <M>{"dx/d\\sigma = -\\sigma \\nabla \\log p"}</M>, and Tweedie&apos;s formula{" "}
          <M>{"\\nabla \\log p = (D - x)/\\sigma^2"}</M> finishes the proof. The noise prediction is the network of m19.4.3.
        </p>
      </Proof>

      <Example title="DDIM is Euler in σ">
        <p>
          The DDIM update <M>{"x_{\\sigma'} = x_\\sigma + (\\sigma' - \\sigma)\\,\\hat\\varepsilon(x_\\sigma; \\sigma)"}</M> is one
          Euler step of this ODE (<C>ddim_step</C>). If the data are a single point m, then D = m, and{" "}
          <M>{"x - m"}</M> is proportional to σ along every solution, so <M>{"\\hat\\varepsilon"}</M> is constant and the Euler step is
          exact for any step size. At high noise every data distribution looks like a point, its mean, which is why DDIM takes huge
          steps there with little error. For Gaussian data <M>{"N(m, s^2)"}</M>, <C>edm_velocity</C> gives the slope{" "}
          <M>{"\\sigma(x - m)/(s^2 + \\sigma^2)"}</M>, and the exact solution is{" "}
          <M>{"x_\\sigma - m = (x_{\\sigma_0} - m)\\sqrt{(s^2 + \\sigma^2)/(s^2 + \\sigma_0^2)}"}</M>. <C>order_estimate</C> reads off
          the empirical order from errors at n and 2n steps.
        </p>
        <Code>{SIGMA}</Code>
      </Example>

      <Remark title="what practical samplers add">
        <p>
          Heun cannot evaluate its second slope at σ = 0, where the ODE is singular, so samplers take a final Euler step. Exponential
          integrators such as DPM-Solver go further: they solve the part of the ODE that is linear in x exactly and approximate only
          the slowly varying network output by a polynomial in log σ, reaching orders two and three with one evaluation per step by
          reusing earlier evaluations. All of them depend on the grid of noise levels, the subject of the last lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "heun",
      rung: "check",
      prompt: (
        <p>
          One Heun step of size h = 0.25 is applied to <M>{"\\dot x = -2x"}</M> from <M>{"x = 1"}</M>. What is the new value?
        </p>
      ),
      answer: { kind: "numeric", value: 0.625, tolerance: 0.0005 },
    },
    {
      key: "steps",
      rung: "check",
      prompt: (
        <p>
          A second-order sampler has error 0.01 with 20 steps. About how many steps does it need for error 0.0001?
        </p>
      ),
      answer: { kind: "numeric", value: 200, tolerance: 0.5 },
    },
    {
      key: "ddim",
      rung: "apply",
      prompt: <p>Why can DDIM take very large steps at high noise levels with little error?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is Euler's method in σ with the predicted noise as slope, and at high noise the data look like a single point, for which the predicted noise is constant along the path and Euler is exact",
          "It is a second-order method",
          "It adds fresh noise that corrects the error of each step",
          "The network is trained only at high noise levels",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def euler_step(v, x, t, h):
    return x + h * v(x, t)

def heun_step(v, x, t, h):
    k1 = v(x, t)
    k2 = v(x + h * k1, t + h)                    # slope at the Euler prediction
    return x + h / 2 * (k1 + k2)

def solve(step, v, x, t0, t1, n):
    h = (t1 - t0) / n
    for k in range(n):
        x = step(v, x, t0 + k * h, h)
    return x

v = lambda x, t: x
print(euler_step(v, 1.0, 0.0, 0.5), heun_step(v, 1.0, 0.0, 0.5), round(solve(heun_step, v, 1.0, 0.0, 1.0, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5 1.625 2.6406", "1.5 1.75 2.6406", "1.5 1.625 2.7183", "1.5 1.625 2.25"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def edm_velocity(x, sigma, m, s2):
    return sigma * (x - m) / (s2 + sigma ** 2)   # (x - D(x; sigma)) / sigma for data N(m, s2)

def ddim_step(x, eps_hat, sigma, sigma_next):
    return x + (sigma_next - sigma) * eps_hat    # Euler in sigma with the predicted noise as slope

def order_estimate(e_coarse, e_fine):
    return float(np.log2(e_coarse / e_fine))     # errors at n and 2n steps

print(edm_velocity(3.0, 2.0, 1.0, 4.0), ddim_step(1.0, 0.5, 2.0, 0.5), order_estimate(0.08, 0.02))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 0.25 2.0", "0.25 0.25 2.0", "0.5 1.75 2.0", "0.5 0.25 4.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>euler_step(v, x, t, h)</C>, <C>heun_step(v, x, t, h)</C> and <C>solve(step, v, x, t0, t1, n)</C>, which applies n
          equal steps of the given method.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def euler_step(v, x, t, h):
    return x + v(x, t)

def heun_step(v, x, t, h):
    return x + h * v(x + h / 2, t + h / 2)

def solve(step, v, x, t0, t1, n):
    return step(v, x, t0, t1 - t0)
`,
        solution: STEP,
        tests: [
          { name: "steps", code: `v = lambda x, t: t + 0 * x\nassert euler_step(v, 0.0, 1.0, 0.25) == 0.25 and heun_step(v, 0.0, 1.0, 0.25) == 0.28125` },
          { name: "solve", code: `assert abs(solve(euler_step, lambda x, t: x, 1.0, 0.0, 1.0, 4) - 1.25 ** 4) < 1e-12 and abs(solve(heun_step, lambda x, t: 2 * t, 0.0, 0.0, 1.0, 1) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>edm_velocity(x, sigma, m, s2)</C> for data <M>{"N(m, s_2)"}</M>, <C>ddim_step(x, eps_hat, sigma, sigma_next)</C>{" "}
          and <C>order_estimate(e_coarse, e_fine)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def edm_velocity(x, sigma, m, s2):
    return (x - m) / sigma

def ddim_step(x, eps_hat, sigma, sigma_next):
    return x - sigma_next * eps_hat

def order_estimate(e_coarse, e_fine):
    return float(e_coarse / e_fine)
`,
        solution: SIGMA,
        tests: [
          { name: "edm", code: `assert abs(edm_velocity(2.0, 1.0, 0.0, 1.0) - 1.0) < 1e-12 and abs(ddim_step(3.0, 2.0, 1.0, 0.25) - 1.5) < 1e-12` },
          { name: "order", code: `assert abs(order_estimate(0.5, 0.0625) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "oneshot",
      rung: "stretch",
      prompt: (
        <p>
          Data follow <M>{"N(0, 1)"}</M>. DDIM takes a single step from σ = 2 to σ = 0 starting at <M>{"x = \\sqrt 5"}</M>, using the
          exact noise prediction. Where does it land? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.447, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every result in this lesson assumed a grid of noise levels. The final lesson asks where to put them: how the error of a
        step depends on where it is taken, and why the grids used in practice crowd the steps towards low noise.
      </p>
    </>
  ),
};
