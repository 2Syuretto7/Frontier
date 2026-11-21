import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JkoGaussViz } from "@/components/viz/JkoGaussViz";
import type { LessonContent } from "@/lib/types";

const STEP = `import numpy as np

def minimizing_movement(F, x, tau, grid):
    return float(grid[np.argmin(F(grid) + (grid - x) ** 2 / (2 * tau))])   # one implicit Euler step

def gauss_free_energy(m, s2):
    return (m ** 2 + s2) / 2 - 0.5 * np.log(2 * np.pi * np.e * s2)   # int V rho + int rho log rho, V = x^2 / 2

def gauss_flow_step(m, s2, dt):
    return m - dt * m, s2 + dt * (2 - 2 * s2)                         # explicit Euler of the exact flow`;

const JKO = `import numpy as np

def jko_gauss_step(m, s, tau):
    s_new = (s + np.sqrt(s ** 2 + 4 * tau * (1 + tau))) / (2 * (1 + tau))
    return m / (1 + tau), float(s_new)

def fisher_info_gauss(m, s2):
    return m ** 2 + s2 - 2 + 1 / s2                  # E|grad(V + log rho)|^2, the rate of energy loss

def kl_to_std_normal(m, s2):
    return 0.5 * (m ** 2 + s2 - 1 - np.log(s2))`;

export const lesson: LessonContent = {
  id: "m20.3.3",
  minutes: 50,
  links: {
    requires: ["m20.3.2", "m19.3.3"],
    revisits: ["m10.7.2", "m19.3.2"],
    foreshadows: ["m20.4.1"],
  },

  puzzle: (
    <>
      <p>
        Heat spreads out, and the entropy of the temperature profile rises. Particles in a potential well jiggle and settle into
        the Gibbs distribution, and a free energy falls. Both look like something rolling downhill, but downhill on what, and with
        respect to which notion of distance between distributions? In 1998 Jordan, Kinderlehrer and Otto found that the
        Fokker-Planck equation is exactly gradient descent on free energy, if distance is measured by <M>{"W_2"}</M>.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent on a function of a point can be written without derivatives: from the current point, step to the point
        that minimises the function plus a penalty on the squared distance travelled. Replace points by distributions and the
        squared distance by <M>{"W_2^2"}</M>, and you get a scheme that moves mass downhill on any functional of a density. For the
        free energy, potential energy plus entropy, these steps converge to the Fokker-Planck equation: the potential pulls mass
        towards low energy, the entropy pushes it to spread.
      </p>
      <JkoGaussViz />
    </>
  ),

  theory: (
    <>
      <Definition title="minimising movements">
        <p>
          For a function F on <M>{"\\mathbb{R}^d"}</M> and step τ &gt; 0, the minimising movement step is
        </p>
        <MD>{"x_{k+1} = \\arg\\min_y \\Big( F(y) + \\frac{|y - x_k|^2}{2\\tau} \\Big) ,"}</MD>
        <p>
          the proximal step of m10.7.2. If F is differentiable the optimality condition is{" "}
          <M>{"x_{k+1} = x_k - \\tau \\nabla F(x_{k+1})"}</M>, implicit Euler for <M>{"\\dot x = -\\nabla F(x)"}</M>, and{" "}
          <M>{"F(x_{k+1}) \\le F(x_k)"}</M> for every τ because <M>{"y = x_k"}</M> is a candidate. <C>minimizing_movement</C> takes
          one step on a grid.
        </p>
      </Definition>

      <Definition title="the JKO scheme">
        <p>
          For a functional F of probability densities, the Jordan-Kinderlehrer-Otto scheme is
        </p>
        <MD>{"\\rho_{k+1} = \\arg\\min_\\rho \\Big( F(\\rho) + \\frac{W_2^2(\\rho, \\rho_k)}{2\\tau} \\Big) ."}</MD>
        <p>
          The free energy with potential V is <M>{"F(\\rho) = \\int V \\rho\\, dx + \\int \\rho \\log \\rho\\, dx"}</M>, minimised by
          the Gibbs density <M>{"\\rho_\\infty \\propto e^{-V}"}</M>, and <M>{"F(\\rho) - F(\\rho_\\infty) = \\mathrm{KL}(\\rho \\,\\|\\, \\rho_\\infty)"}</M>.
        </p>
      </Definition>

      <Theorem title="the Fokker-Planck equation is a Wasserstein gradient flow">
        <p>
          As τ → 0, the JKO iterates for the free energy converge to the solution of{" "}
          <M>{"\\partial_t \\rho = \\nabla \\cdot (\\rho \\nabla V) + \\Delta \\rho"}</M>, the Fokker-Planck equation of{" "}
          <M>{"dX = -\\nabla V(X)\\, dt + \\sqrt 2\\, dW"}</M> (m19.3.3). Along it,
        </p>
        <MD>{"\\frac{d}{dt} F(\\rho_t) = -\\int |\\nabla (V + \\log \\rho_t)|^2 \\rho_t\\, dx ."}</MD>
      </Theorem>
      <Proof>
        <p>
          The convergence proof of Jordan, Kinderlehrer and Otto uses compactness estimates beyond this lesson; here is why the
          limit is this equation. Moving ρ for a short time τ by a velocity field v costs about <M>{"\\tau^2 \\int |v|^2 \\rho"}</M> in{" "}
          <M>{"W_2^2"}</M> (m20.3.2) and changes F by about <M>{"\\tau \\int \\nabla \\tfrac{\\delta F}{\\delta \\rho} \\cdot v\\, \\rho"}</M>,
          where <M>{"\\tfrac{\\delta F}{\\delta\\rho} = V + \\log \\rho + 1"}</M> is the first variation. Minimising{" "}
          <M>{"\\tau \\int \\nabla \\tfrac{\\delta F}{\\delta\\rho} \\cdot v\\,\\rho + \\tfrac{\\tau}{2}\\int |v|^2 \\rho"}</M> over v gives{" "}
          <M>{"v = -\\nabla(V + \\log\\rho)"}</M>, and the continuity equation for this velocity is{" "}
          <M>{"\\partial_t\\rho = \\nabla \\cdot (\\rho \\nabla V + \\nabla \\rho)"}</M>, since <M>{"\\rho \\nabla \\log \\rho = \\nabla \\rho"}</M>.
          The energy identity is <M>{"\\frac{d}{dt}F = \\int \\tfrac{\\delta F}{\\delta\\rho}\\, \\partial_t \\rho = -\\int \\nabla \\tfrac{\\delta F}{\\delta\\rho} \\cdot v\\, \\rho"}</M>{" "}
          after integrating by parts, which is minus the integral of <M>{"|v|^2 \\rho"}</M>.
        </p>
      </Proof>

      <Example title="Gaussians">
        <p>
          Take <M>{"V(x) = x^2/2"}</M>, so the flow is the Ornstein-Uhlenbeck Fokker-Planck equation (m19.3.2) and Gaussians stay
          Gaussian. For <M>{"N(m, s^2)"}</M>, <M>{"F = \\tfrac12(m^2 + s^2) - \\tfrac12\\log(2\\pi e s^2)"}</M>
          (<C>gauss_free_energy</C>), and the flow is <M>{"\\dot m = -m"}</M>, <M>{"\\tfrac{d}{dt}s^2 = 2 - 2s^2"}</M>
          (<C>gauss_flow_step</C>), so <M>{"s^2(t) = 1 + (s^2(0) - 1)e^{-2t}"}</M>. The rate of energy loss is{" "}
          <M>{"\\mathbb{E}|X - (X - m)/s^2|^2 = m^2 + s^2 - 2 + 1/s^2"}</M> (<C>fisher_info_gauss</C>). Restricted to Gaussians,{" "}
          <M>{"W_2^2"}</M> is the Euclidean distance in (m, s), so a JKO step solves two scalar problems:{" "}
          <M>{"m' = m/(1 + \\tau)"}</M> and <M>{"s'"}</M> the positive root of <M>{"(1 + \\tau)s'^2 - s s' - \\tau = 0"}</M>
          (<C>jko_gauss_step</C>).
        </p>
        <Code>{STEP}</Code>
        <Code>{JKO}</Code>
      </Example>

      <Remark title="why this view pays off">
        <p>
          The gradient-flow view explains exponential convergence to equilibrium when V is strongly convex, because the free energy is
          then displacement convex (m20.3.2). It also says that Langevin sampling is gradient descent on <M>{"\\mathrm{KL}(\\rho \\,\\|\\, \\rho_\\infty)"}</M>{" "}
          (<C>kl_to_std_normal</C> in the Gaussian case), and it suggests new algorithms: particle methods such as Stein variational
          gradient descent, and the training dynamics of wide two-layer networks, which are Wasserstein gradient flows of the loss
          over the distribution of neurons.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "prox",
      rung: "check",
      prompt: (
        <p>
          One minimising movement step with τ = 0.5 is taken on <M>{"F(x) = \\tfrac32 x^2"}</M> from <M>{"x_0 = 2"}</M>. Where does
          it land?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0005 },
    },
    {
      key: "ou",
      rung: "check",
      prompt: (
        <p>
          Under the Wasserstein gradient flow of the free energy with <M>{"V(x) = x^2/2"}</M>, a Gaussian starts with variance 5. What
          is its variance at t = 0.5? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.472, tolerance: 0.0006 },
    },
    {
      key: "terms",
      rung: "apply",
      prompt: <p>In the free energy ∫ V ρ + ∫ ρ log ρ, what does each term contribute to the Fokker-Planck flow?</p>,
      answer: {
        kind: "choice",
        options: [
          "The potential term gives the drift down the gradient of V, and the entropy term gives the diffusion Δρ, since ρ times the gradient of log ρ is the gradient of ρ",
          "The potential term gives the diffusion and the entropy term gives the drift",
          "Both terms give drifts; the diffusion comes from the step size",
          "The entropy term has no effect on the flow",
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

def minimizing_movement(F, x, tau, grid):
    return float(grid[np.argmin(F(grid) + (grid - x) ** 2 / (2 * tau))])   # one implicit Euler step

def gauss_free_energy(m, s2):
    return (m ** 2 + s2) / 2 - 0.5 * np.log(2 * np.pi * np.e * s2)   # int V rho + int rho log rho, V = x^2 / 2

def gauss_flow_step(m, s2, dt):
    return m - dt * m, s2 + dt * (2 - 2 * s2)                         # explicit Euler of the exact flow

m, s2 = gauss_flow_step(2.0, 3.0, 0.1)
print(minimizing_movement(lambda y: y ** 2, 1.0, 0.5, np.linspace(-2, 2, 401)), round(float(gauss_free_energy(0.0, 1.0)), 4), round(m, 4), round(s2, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 -0.9189 1.8 2.6", "0.0 -0.9189 1.8 2.6", "0.5 0.5 1.8 2.6", "0.5 -0.9189 1.8 3.4"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def jko_gauss_step(m, s, tau):
    s_new = (s + np.sqrt(s ** 2 + 4 * tau * (1 + tau))) / (2 * (1 + tau))
    return m / (1 + tau), float(s_new)

def fisher_info_gauss(m, s2):
    return m ** 2 + s2 - 2 + 1 / s2                  # E|grad(V + log rho)|^2, the rate of energy loss

def kl_to_std_normal(m, s2):
    return 0.5 * (m ** 2 + s2 - 1 - np.log(s2))

print(jko_gauss_step(2.0, 1.0, 1.0), fisher_info_gauss(1.0, 2.0), float(kl_to_std_normal(1.0, 1.0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(1.0, 1.0) 1.5 0.5", "(1.0, 0.5) 1.5 0.5", "(2.0, 1.0) 1.5 0.5", "(1.0, 1.0) 2.5 0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>minimizing_movement(F, x, tau, grid)</C>, <C>gauss_free_energy(m, s2)</C> for <M>{"V = x^2/2"}</M> and{" "}
          <C>gauss_flow_step(m, s2, dt)</C>, one explicit Euler step of the exact flow.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def minimizing_movement(F, x, tau, grid):
    return float(grid[np.argmin(F(grid))])

def gauss_free_energy(m, s2):
    return (m ** 2 + s2) / 2

def gauss_flow_step(m, s2, dt):
    return m - dt * m, s2 - dt * s2
`,
        solution: STEP,
        tests: [
          { name: "mm", code: `g = np.linspace(-3, 3, 601)\nassert abs(minimizing_movement(lambda y: 2 * y ** 2, 2.0, 0.25, g) - 1.0) < 1e-9` },
          { name: "gauss", code: `assert abs(gauss_free_energy(1.0, np.exp(-1.0)) - (0.5 + np.exp(-1.0) / 2 - 0.5 * np.log(2 * np.pi))) < 1e-12 and np.allclose(gauss_flow_step(1.0, 0.5, 0.5), (0.5, 1.0))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jko_gauss_step(m, s, tau)</C> returning the new mean and standard deviation, <C>fisher_info_gauss(m, s2)</C> and{" "}
          <C>kl_to_std_normal(m, s2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def jko_gauss_step(m, s, tau):
    return m * (1 - tau), s

def fisher_info_gauss(m, s2):
    return m ** 2

def kl_to_std_normal(m, s2):
    return 0.5 * m ** 2
`,
        solution: JKO,
        tests: [
          { name: "jko", code: `m, s = jko_gauss_step(3.0, 0.5, 0.5)\nassert abs(m - 2.0) < 1e-12 and abs(1.5 * s * s - 0.5 * s - 0.5) < 1e-12 and s > 0` },
          { name: "fisher", code: `assert abs(fisher_info_gauss(0.0, 0.5) - 0.5) < 1e-12 and abs(kl_to_std_normal(0.0, np.e) - (np.e - 2) / 2) < 1e-12` },
        ],
      },
    },
    {
      key: "jko",
      rung: "stretch",
      prompt: (
        <p>
          For the same free energy, one JKO step with τ = 0.5 is taken from a Gaussian with standard deviation 2. What is the new
          standard deviation? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.549, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Entropy appeared here as the driver of diffusion. The next chapter puts it into the transport problem itself: adding a
        small entropy term to Kantorovich&apos;s problem makes it smooth, strictly convex and solvable by a few lines of matrix
        scaling.
      </p>
    </>
  ),
};
