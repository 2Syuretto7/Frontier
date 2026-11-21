import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarginalFlowViz } from "@/components/viz/MarginalFlowViz";
import type { LessonContent } from "@/lib/types";

const CFM = `import numpy as np

def cond_path(x0, x1, t):
    return (1 - t) * x0 + t * x1, x1 - x0         # point on the straight line and its velocity

def cfm_loss(v, x0, x1, t):
    xt, u = cond_path(x0, x1, t)
    return float(np.mean((v(xt, t) - u) ** 2))

def euler_sample(v, x0, n):
    x = x0
    for k in range(n):
        x = x + v(x, k / n) / n                   # integrate dx/dt = v from t = 0 to 1
    return x`;

const GAUSS = `def gauss_marginal(t, m, s2):
    return t * m, (1 - t) ** 2 + t ** 2 * s2      # law of x_t for x0 ~ N(0, 1), x1 ~ N(m, s2)

def gauss_velocity(x, t, m, s2):
    a, b = 1 - t, t
    c = (b * s2 - a) / (a ** 2 + b ** 2 * s2)     # Cov(x1 - x0, x_t) / Var(x_t)
    return m + c * (x - b * m)

def cfm_constant(t, m, s2):
    a, b = 1 - t, t
    return 1 + s2 - (b * s2 - a) ** 2 / (a ** 2 + b ** 2 * s2)   # Var(u) minus Var(v(x_t))`;

export const lesson: LessonContent = {
  id: "m19.5.3",
  minutes: 55,
  links: {
    requires: ["m19.5.2", "m19.4.3"],
    revisits: ["m7.6.1", "m19.5.1"],
    foreshadows: ["m19.5.4"],
  },

  puzzle: (
    <>
      <p>
        Draw a noise sample and a data point, and join them by a straight line travelled at constant speed. Its velocity is simply
        the difference of the two endpoints. A network trained to output these velocities sees, at the same point and time, lines
        heading in completely different directions, and the lines cross one another everywhere. An ODE&apos;s paths can never cross.
        So what does such a network learn, and why does following it turn noise into data?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At a given point and time, many lines pass through, each with its own velocity. The best single prediction, in the least
        squares sense, is their average, weighted by how likely each line is to pass there. This averaged velocity field is smooth
        and its paths do not cross. The continuity equation is linear, so averaging conditional velocities, each of which carries its
        own simple density path, gives a velocity that carries the averaged density path, whose ends are the noise and the data. The
        regression argument is the one that gave denoising score matching.
      </p>
      <MarginalFlowViz />
    </>
  ),

  theory: (
    <>
      <Definition title="conditional and marginal paths">
        <p>
          Let <M>{"X_0 \\sim p_0 = N(0, I)"}</M> and <M>{"X_1 \\sim p_1"}</M>, the data, be independent, and let{" "}
          <M>{"X_t = (1 - t) X_0 + t X_1"}</M> for t in [0, 1]. Given the pair, <M>{"X_t"}</M> moves with velocity{" "}
          <M>{"U = X_1 - X_0"}</M>. Write <M>{"p_t"}</M> for the density of <M>{"X_t"}</M> and define the marginal velocity
        </p>
        <MD>{"v_t(x) = \\mathbb{E}[X_1 - X_0 \\mid X_t = x] ."}</MD>
      </Definition>

      <Theorem title="the marginal velocity generates the path">
        <p>
          Under smoothness and integrability conditions, <M>{"\\partial_t p_t + \\nabla \\cdot (p_t v_t) = 0"}</M>, so the ODE{" "}
          <M>{"\\dot x = v_t(x)"}</M> started from <M>{"p_0"}</M> has law <M>{"p_t"}</M> at time t, and in particular reaches the
          data distribution at t = 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a test function φ,{" "}
          <M>{"\\frac{d}{dt}\\mathbb{E}\\varphi(X_t) = \\mathbb{E}[\\nabla\\varphi(X_t) \\cdot U] = \\mathbb{E}[\\nabla\\varphi(X_t) \\cdot \\mathbb{E}[U \\mid X_t]] = \\int \\nabla\\varphi \\cdot v_t\\, p_t\\, dx"}</M>
          , by the tower property (m7.6.1). This is the weak form of the continuity equation used in m19.5.2, and uniqueness of its
          solution for the smooth field <M>{"v_t"}</M> identifies <M>{"p_t"}</M> with the law of the ODE.
        </p>
      </Proof>

      <Theorem title="conditional flow matching">
        <p>
          For any square-integrable model <M>{"v^\\theta"}</M>,
        </p>
        <MD>{"\\mathbb{E}|v^\\theta_t(X_t) - U|^2 = \\mathbb{E}|v^\\theta_t(X_t) - v_t(X_t)|^2 + \\mathbb{E}|U - v_t(X_t)|^2 ."}</MD>
        <p>
          The last term does not depend on θ, so regressing on the conditional velocity U, which needs only samples, has the same
          minimiser as regressing on the unknown marginal velocity.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"v^\\theta - U = (v^\\theta - v) + (v - U)"}</M>. The cross term is{" "}
          <M>{"2\\mathbb{E}[(v^\\theta_t(X_t) - v_t(X_t)) \\cdot (v_t(X_t) - U)]"}</M>, and conditioning on <M>{"X_t"}</M> turns the
          second factor into <M>{"v_t(X_t) - \\mathbb{E}[U \\mid X_t] = 0"}</M>. This is the argument of m19.4.3 with a different
          target. <C>cond_path</C>, <C>cfm_loss</C> and <C>euler_sample</C> implement training targets, the loss at one t, and
          sampling.
        </p>
        <Code>{CFM}</Code>
      </Proof>

      <Example title="Gaussian data">
        <p>
          If <M>{"p_1 = N(m, s^2)"}</M> in one dimension, write <M>{"a = 1 - t"}</M> and <M>{"b = t"}</M>. Then{" "}
          <M>{"X_t \\sim N(bm, a^2 + b^2 s^2)"}</M>, and <M>{"(U, X_t)"}</M> is jointly Gaussian with{" "}
          <M>{"\\operatorname{Cov}(U, X_t) = b s^2 - a"}</M>, so by the Gaussian conditioning formula
        </p>
        <MD>{"v_t(x) = m + \\frac{b s^2 - a}{a^2 + b^2 s^2}(x - bm) ."}</MD>
        <p>
          The irreducible loss is <M>{"\\operatorname{Var} U - \\operatorname{Var} v_t(X_t) = 1 + s^2 - (bs^2 - a)^2/(a^2 + b^2 s^2)"}</M>
          . <C>gauss_marginal</C>, <C>gauss_velocity</C> and <C>cfm_constant</C> compute these. The flow is linear in x at every
          time, so it maps <M>{"N(0, 1)"}</M> to <M>{"N(m, s^2)"}</M> by the increasing linear map <M>{"x \\mapsto m + s x"}</M>.
        </p>
        <Code>{GAUSS}</Code>
      </Example>

      <Remark title="choices hidden in the recipe">
        <p>
          Nothing forced the straight line or the independent pairing of noise and data. Other interpolations give other density
          paths, including the paths of diffusion models, for which the marginal velocity is the probability flow velocity of
          m19.5.1. Pairing each noise sample with a nearby data point, by an optimal transport coupling, makes the conditional lines
          cross less, so the marginal paths are straighter and need fewer integration steps.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "vel",
      rung: "check",
      prompt: (
        <p>
          With straight-line paths from <M>{"N(0, 1)"}</M> noise to data <M>{"N(2, 4)"}</M>, what is the marginal velocity at x = 2
          when t = 0.5?
        </p>
      ),
      answer: { kind: "numeric", value: 3.2, tolerance: 0.0005 },
    },
    {
      key: "const",
      rung: "check",
      prompt: (
        <p>
          Noise is <M>{"N(0, 1)"}</M>, data are <M>{"N(0, 1)"}</M>, and paths are straight lines. What is the smallest possible value
          of the conditional flow matching loss <M>{"\\mathbb{E}|v(X_t) - U|^2"}</M> at t = 0.5?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.0005 },
    },
    {
      key: "cross",
      rung: "apply",
      prompt: <p>Conditional paths cross each other. Why do the paths of the learned flow not cross?</p>,
      answer: {
        kind: "choice",
        options: [
          "The network learns the conditional average of the velocities at each point, a single smooth field, and the solutions of an ODE with a smooth field cannot meet",
          "The network memorises one conditional path for each noise sample",
          "Crossings are removed by adding noise during sampling",
          "The paths do cross, but only at t = 0.5",
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

def cond_path(x0, x1, t):
    return (1 - t) * x0 + t * x1, x1 - x0         # point on the straight line and its velocity

def cfm_loss(v, x0, x1, t):
    xt, u = cond_path(x0, x1, t)
    return float(np.mean((v(xt, t) - u) ** 2))

def euler_sample(v, x0, n):
    x = x0
    for k in range(n):
        x = x + v(x, k / n) / n                   # integrate dx/dt = v from t = 0 to 1
    return x

xt, u = cond_path(np.array([0.0, 1.0]), np.array([2.0, 3.0]), 0.25)
print(xt.tolist(), u.tolist(), cfm_loss(lambda x, t: 0 * x + 1.0, np.array([0.0, 1.0]), np.array([2.0, 3.0]), 0.25), euler_sample(lambda x, t: 2 * t + 0 * x, 0.0, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.5] [2.0, 2.0] 1.0 0.5",
          "[1.5, 2.5] [2.0, 2.0] 1.0 0.5",
          "[0.5, 1.5] [2.0, 2.0] 1.0 1.0",
          "[0.5, 1.5] [-2.0, -2.0] 9.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def gauss_marginal(t, m, s2):
    return t * m, (1 - t) ** 2 + t ** 2 * s2      # law of x_t for x0 ~ N(0, 1), x1 ~ N(m, s2)

def gauss_velocity(x, t, m, s2):
    a, b = 1 - t, t
    c = (b * s2 - a) / (a ** 2 + b ** 2 * s2)     # Cov(x1 - x0, x_t) / Var(x_t)
    return m + c * (x - b * m)

def cfm_constant(t, m, s2):
    a, b = 1 - t, t
    return 1 + s2 - (b * s2 - a) ** 2 / (a ** 2 + b ** 2 * s2)   # Var(u) minus Var(v(x_t))

mu, var = gauss_marginal(0.25, 4.0, 1.0)
print(mu, var, round(gauss_velocity(1.0, 0.25, 0.0, 1.0), 4), round(cfm_constant(0.25, 0.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.625 -0.8 1.6", "1.0 0.625 0.8 1.6", "3.0 0.625 -0.8 1.6", "1.0 0.625 -0.8 2.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cond_path(x0, x1, t)</C> returning the point and its velocity, <C>cfm_loss(v, x0, x1, t)</C> for a model{" "}
          <C>v(x, t)</C>, and <C>euler_sample(v, x0, n)</C>, which takes n Euler steps from t = 0 to t = 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cond_path(x0, x1, t):
    return t * x0 + (1 - t) * x1, x0 - x1

def cfm_loss(v, x0, x1, t):
    xt, u = cond_path(x0, x1, t)
    return float(np.mean(np.abs(v(xt, t) - u)))

def euler_sample(v, x0, n):
    return x0 + v(x0, 0.0)
`,
        solution: CFM,
        tests: [
          { name: "path", code: `xt, u = cond_path(np.array([0.0]), np.array([4.0]), 0.25)\nassert np.allclose(xt, [1.0]) and np.allclose(u, [4.0])\nassert abs(cfm_loss(lambda x, t: 0 * x, np.array([0.0, 0.0]), np.array([1.0, 3.0]), 0.5) - 5.0) < 1e-12` },
          { name: "sample", code: `assert abs(euler_sample(lambda x, t: t + 0 * x, 0.0, 4) - 0.375) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For noise <M>{"N(0, 1)"}</M> and data <M>{"N(m, s_2)"}</M> joined by straight lines, write <C>gauss_marginal(t, m, s2)</C>{" "}
          returning the mean and variance of <M>{"X_t"}</M>, <C>gauss_velocity(x, t, m, s2)</C> and <C>cfm_constant(t, m, s2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def gauss_marginal(t, m, s2):
    return t * m, t * s2

def gauss_velocity(x, t, m, s2):
    return m

def cfm_constant(t, m, s2):
    return 0.0
`,
        solution: GAUSS,
        tests: [
          { name: "marginal", code: `mu, var = gauss_marginal(0.5, 2.0, 3.0)\nassert abs(mu - 1.0) < 1e-12 and abs(var - 1.0) < 1e-12` },
          { name: "velocity", code: `assert abs(gauss_velocity(2.0, 0.5, 0.0, 3.0) - 2.0) < 1e-12 and abs(cfm_constant(0.5, 1.0, 3.0) - 3.0) < 1e-12` },
        ],
      },
    },
    {
      key: "end",
      rung: "stretch",
      prompt: (
        <p>
          With straight-line paths from <M>{"N(0, 1)"}</M> noise to data <M>{"N(2, 4)"}</M>, the exact marginal flow is started at{" "}
          <M>{"x_0 = 0.5"}</M>. Where is it at t = 1?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Straight lines between independent noise and data are one interpolation among many. The next lesson treats them all at
        once: stochastic interpolants mix noise and data with any schedule, possibly with extra noise, and recover both diffusion
        models and flow matching as special cases.
      </p>
    </>
  ),
};
