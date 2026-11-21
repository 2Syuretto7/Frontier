import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProbabilityFlowViz } from "@/components/viz/ProbabilityFlowViz";
import type { LessonContent } from "@/lib/types";

const ODE = `import numpy as np

def pf_drift(f, g, score):
    return f - 0.5 * g ** 2 * score              # same marginals as dX = f dt + g dW

def euler_ode(drift, x, t0, t1, n):
    h = (t1 - t0) / n
    for k in range(n):
        x = x + h * drift(x, t0 + k * h)
    return x

def ve_score(x, m, s2, t):
    return -(x - m) / (s2 + t)                   # score of N(m, s2 + t), data N(m, s2) after VE noise`;

const LIK = `import numpy as np

def flow_map(x0, m, s2, t):
    return m + (x0 - m) * np.sqrt((s2 + t) / s2)   # exact solution of dx/dt = (x - m) / (2 (s2 + t))

def log_jac(s2, t):
    return 0.5 * np.log((s2 + t) / s2)             # log of d x_t / d x_0

def push_logpdf(logp0, s2, t):
    return logp0 - log_jac(s2, t)                  # change of variables along the flow`;

export const lesson: LessonContent = {
  id: "m19.5.1",
  minutes: 55,
  links: {
    requires: ["m19.4.3", "m19.3.3"],
    revisits: ["m11.8.1", "m5.7.3"],
    foreshadows: ["m19.5.2"],
  },

  puzzle: (
    <>
      <p>
        The reverse SDE generates data by injecting fresh noise at every step, so the same starting point gives a different sample
        each time, and the likelihood of a given image is out of reach. Yet a diffusion model only promises that the samples at each
        time have the right distribution; it says nothing about how individual paths should behave. Is there a deterministic
        dynamics, with no noise at all, whose samples have exactly the same distribution at every time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Fokker-Planck equation (m19.3.3) describes how the density of an SDE changes. Its diffusion term spreads probability
        mass, and spreading mass down a density gradient is exactly what a deterministic velocity field pointing down that gradient
        would do. Replacing the noise by this drift, which is minus half the squared diffusion coefficient times the score, leaves
        the density unchanged at every time. The resulting ODE moves each point smoothly, maps noise to data one to one, and lets us
        track how the density at a point changes along its path.
      </p>
      <ProbabilityFlowViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the probability flow ODE">
        <p>
          Let <M>{"dX_t = f(X_t, t)\\,dt + g(t)\\,dW_t"}</M> in one dimension have smooth positive densities <M>{"p_t"}</M>. Then{" "}
          <M>{"p_t"}</M> also solves the continuity equation{" "}
          <M>{"\\partial_t p_t + \\partial_x(v_t p_t) = 0"}</M> for the velocity
        </p>
        <MD>{"v_t(x) = f(x, t) - \\tfrac12 g(t)^2\\, \\partial_x \\log p_t(x) ,"}</MD>
        <p>
          so the ODE <M>{"\\dot x = v_t(x)"}</M>, started from <M>{"p_0"}</M>, has marginal <M>{"p_t"}</M> at every time t.
        </p>
      </Theorem>
      <Proof>
        <p>
          The Fokker-Planck equation is <M>{"\\partial_t p = -\\partial_x(f p) + \\tfrac12 g^2 \\partial_x^2 p"}</M>. Since g does
          not depend on x, <M>{"\\tfrac12 g^2 \\partial_x^2 p = \\partial_x(\\tfrac12 g^2 \\partial_x p) = \\partial_x(\\tfrac12 g^2 p\\, \\partial_x \\log p)"}</M>
          , so <M>{"\\partial_t p = -\\partial_x[(f - \\tfrac12 g^2 \\partial_x \\log p) p]"}</M>. That the density of an ODE solves
          the continuity equation with its own velocity, and that a smooth solution with given initial density is unique, is proved in
          the next lesson; together they give the claim.
        </p>
      </Proof>

      <Definition title="computing the flow">
        <p>
          <C>pf_drift</C> forms the velocity from the SDE coefficients and a score. <C>euler_ode</C> integrates an ODE by Euler&apos;s
          method (m11.8.1); for sampling it runs backwards from <M>{"t = T"}</M> to 0 with a negative step. <C>ve_score</C> is the
          score of Gaussian data <M>{"N(m, s^2)"}</M> under the variance-exploding SDE <M>{"dX = dW"}</M>, whose marginal at time t is{" "}
          <M>{"N(m, s^2 + t)"}</M>.
        </p>
        <Code>{ODE}</Code>
      </Definition>

      <Example title="an exact flow for Gaussian data">
        <p>
          For <M>{"dX = dW"}</M> and <M>{"p_0 = N(m, s^2)"}</M>, the velocity is{" "}
          <M>{"v_t(x) = (x - m)/(2(s^2 + t))"}</M>. Separating variables,{" "}
          <M>{"\\log|x_t - m| = \\tfrac12 \\log(s^2 + t) + c"}</M>, so
        </p>
        <MD>{"x_t = m + (x_0 - m)\\sqrt{(s^2 + t)/s^2} ."}</MD>
        <p>
          This linear map sends <M>{"N(m, s^2)"}</M> to <M>{"N(m, s^2 + t)"}</M>, as the theorem promises. The SDE reaches the same
          law by adding independent noise; the ODE reaches it by stretching every point away from the mean.
        </p>
      </Example>

      <Theorem title="likelihoods along the flow">
        <p>
          If <M>{"x_t"}</M> solves <M>{"\\dot x = v_t(x)"}</M> and the densities are carried by the flow, then{" "}
          <M>{"\\frac{d}{dt} \\log p_t(x_t) = -\\partial_x v_t(x_t)"}</M>, so{" "}
          <M>{"\\log p_t(x_t) = \\log p_0(x_0) - \\int_0^t \\partial_x v_s(x_s)\\, ds"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule and the continuity equation,{" "}
          <M>{"\\frac{d}{dt} p_t(x_t) = \\partial_t p_t + v_t \\partial_x p_t = -p_t\\, \\partial_x v_t"}</M>; divide by{" "}
          <M>{"p_t"}</M>. The integral is the log of the derivative of the flow map, as in the change of variables formula (m5.7.3).
          In the Gaussian example <M>{"\\partial_x v_r = 1/(2(s^2 + r))"}</M> at time r, which integrates to{" "}
          <M>{"\\tfrac12 \\log((s^2 + t)/s^2)"}</M>; <C>flow_map</C>, <C>log_jac</C> and <C>push_logpdf</C> compute these. In higher
          dimensions the derivative becomes the divergence of v.
        </p>
        <Code>{LIK}</Code>
      </Proof>

      <Remark title="what the ODE gives up and gains">
        <p>
          The ODE matches the SDE&apos;s marginals, not its paths: one ODE path is a smooth curve, one SDE path is rough. With a learned
          score the two samplers behave differently, because the SDE&apos;s noise partly corrects errors made earlier while the ODE
          carries them forward. In exchange the ODE is deterministic and invertible, so it encodes data into noise, gives exact
          likelihoods by integrating the divergence, and can be solved with fewer, larger steps by higher-order methods
          (m11.8.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "drift",
      rung: "check",
      prompt: (
        <p>
          The variance-preserving SDE <M>{"dX = -X\\,dt + \\sqrt{2}\\,dW"}</M> has, at some time t, marginal{" "}
          <M>{"N(0, 4)"}</M>. What is the velocity of its probability flow ODE at x = 2 at that time?
        </p>
      ),
      answer: { kind: "numeric", value: -1.5, tolerance: 0.0005 },
    },
    {
      key: "map",
      rung: "check",
      prompt: (
        <p>
          Data follow <M>{"N(0, 1)"}</M> and are noised by <M>{"dX = dW"}</M>. The probability flow ODE starts at{" "}
          <M>{"x_0 = 1.5"}</M>. Where is it at t = 3?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "same",
      rung: "apply",
      prompt: <p>In what sense do the probability flow ODE and the SDE it comes from agree?</p>,
      answer: {
        kind: "choice",
        options: [
          "At every time their solutions have the same distribution, although individual paths differ: ODE paths are smooth and deterministic, SDE paths are rough",
          "Their paths coincide when both start from the same point",
          "They agree only at the final time T",
          "The ODE is the SDE with the noise set to zero",
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

def pf_drift(f, g, score):
    return f - 0.5 * g ** 2 * score              # same marginals as dX = f dt + g dW

def euler_ode(drift, x, t0, t1, n):
    h = (t1 - t0) / n
    for k in range(n):
        x = x + h * drift(x, t0 + k * h)
    return x

def ve_score(x, m, s2, t):
    return -(x - m) / (s2 + t)                   # score of N(m, s2 + t), data N(m, s2) after VE noise

x = euler_ode(lambda x, t: 0.5 * x / (1 + t), 1.0, 0.0, 3.0, 3)
print(pf_drift(-1.0, 2.0, 0.5), round(x, 4), ve_score(3.0, 1.0, 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-2.0 2.1875 -1.0", "0.0 2.1875 -1.0", "-2.0 2.0 -1.0", "-2.0 2.1875 -2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def flow_map(x0, m, s2, t):
    return m + (x0 - m) * np.sqrt((s2 + t) / s2)   # exact solution of dx/dt = (x - m) / (2 (s2 + t))

def log_jac(s2, t):
    return 0.5 * np.log((s2 + t) / s2)             # log of d x_t / d x_0

def push_logpdf(logp0, s2, t):
    return logp0 - log_jac(s2, t)                  # change of variables along the flow

y = flow_map(3.0, 1.0, 1.0, 8.0)
print(y, round(float(log_jac(1.0, 8.0)), 4), round(float(push_logpdf(-1.0, 1.0, 8.0)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["7.0 1.0986 -2.0986", "7.0 2.1972 -3.1972", "9.0 1.0986 -2.0986", "7.0 1.0986 0.0986"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pf_drift(f, g, score)</C>, <C>euler_ode(drift, x, t0, t1, n)</C>, which takes n Euler steps of{" "}
          <M>{"\\dot x = \\text{drift}(x, t)"}</M> from <M>{"t_0"}</M> to <M>{"t_1"}</M>, and <C>ve_score(x, m, s2, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pf_drift(f, g, score):
    return f - g ** 2 * score

def euler_ode(drift, x, t0, t1, n):
    return x + (t1 - t0) * drift(x, t0)

def ve_score(x, m, s2, t):
    return -(x - m) / s2
`,
        solution: ODE,
        tests: [
          { name: "drift", code: `assert pf_drift(1.0, 2.0, 1.0) == -1.0 and ve_score(2.0, 0.0, 1.0, 3.0) == -0.5` },
          { name: "euler", code: `assert abs(euler_ode(lambda x, t: t, 0.0, 0.0, 1.0, 2) - 0.25) < 1e-12 and abs(euler_ode(lambda x, t: x, 1.0, 1.0, 0.0, 1) - 0.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For data <M>{"N(m, s_2)"}</M> under <M>{"dX = dW"}</M>, write <C>flow_map(x0, m, s2, t)</C>, <C>log_jac(s2, t)</C> and{" "}
          <C>push_logpdf(logp0, s2, t)</C>, which returns <M>{"\\log p_t(x_t)"}</M> given <M>{"\\log p_0(x_0)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def flow_map(x0, m, s2, t):
    return x0 + t

def log_jac(s2, t):
    return np.log((s2 + t) / s2)

def push_logpdf(logp0, s2, t):
    return logp0 + log_jac(s2, t)
`,
        solution: LIK,
        tests: [
          { name: "map", code: `assert abs(flow_map(2.0, 0.0, 1.0, 3.0) - 4.0) < 1e-12 and abs(flow_map(1.0, 1.0, 2.0, 5.0) - 1.0) < 1e-12` },
          { name: "logp", code: `assert abs(log_jac(1.0, 3.0) - np.log(2.0)) < 1e-12 and abs(push_logpdf(0.0, 2.0, 6.0) + np.log(2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "lik",
      rung: "stretch",
      prompt: (
        <p>
          Data follow <M>{"N(0, 1)"}</M> under <M>{"dX = dW"}</M>. Along a probability flow trajectory from t = 0 to t = 3, by how
          much does <M>{"\\log p_t(x_t)"}</M> change? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.693, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The proof leaned on one fact still owed: the density of points moved by a velocity field obeys the continuity equation. The
        next lesson proves it, in any dimension, and shows that it is the single equation behind normalising flows, the probability
        flow ODE and flow matching.
      </p>
    </>
  ),
};
