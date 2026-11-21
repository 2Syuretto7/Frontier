import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InterpolantSdeViz } from "@/components/viz/InterpolantSdeViz";
import type { LessonContent } from "@/lib/types";

const INTERP = `import numpy as np

def trig_coeffs(t):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    return float(a), float(b), float(-np.pi / 2 * b), float(np.pi / 2 * a)   # alpha, beta and their derivatives

def interp_point(x0, x1, a, b, da, db):
    return a * x0 + b * x1, da * x0 + db * x1      # x_t and its time derivative

def score_from_x0(x0_hat, alpha):
    return -x0_hat / alpha                         # Gaussian x0: score = -E[x0 | x_t] / alpha`;

const FAMILY = `import numpy as np

def sde_drift(b, s, eps):
    return b + eps * s                             # pair with noise sqrt(2 eps) dW

def trig_velocity_gauss(x, t, s2):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    da, db = -np.pi / 2 * b, np.pi / 2 * a
    return float((a * da + b * db * s2) / (a ** 2 + b ** 2 * s2) * x)

def trig_score_gauss(x, t, s2):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    return float(-x / (a ** 2 + b ** 2 * s2))`;

export const lesson: LessonContent = {
  id: "m19.5.4",
  minutes: 55,
  links: {
    requires: ["m19.5.3", "m19.4.2"],
    revisits: ["m19.3.3", "m19.5.1"],
    foreshadows: ["m19.6.1"],
  },

  puzzle: (
    <>
      <p>
        Diffusion models add noise to data along an SDE and learn a score; flow matching joins noise to data by straight lines and
        learns a velocity. One samples with an SDE, the other with an ODE, and the papers that introduced them use different
        notation, losses and schedules. Are these two genuinely different methods, or two settings of one construction, and if so,
        what are the other settings?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Both methods choose a random path between a noise sample and a data point and ask for the density of the points on those
        paths at each time. Any such interpolation, with any schedule, defines a path of densities from noise to data. The
        conditional average of the path&apos;s velocity carries that path, as in flow matching, and when the noise is Gaussian the
        score comes for free from a prediction of the noise. With both in hand, one can trade drift for diffusion: a whole family
        of SDEs, from the ODE to very noisy samplers, shares the same marginals.
      </p>
      <InterpolantSdeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stochastic interpolant">
        <p>
          Let <M>{"X_0 \\sim N(0, I)"}</M>, the data <M>{"X_1 \\sim p_1"}</M> and <M>{"Z \\sim N(0, I)"}</M> be independent. For
          smooth <M>{"\\alpha, \\beta, \\gamma"}</M> on [0, 1] with <M>{"\\alpha(0) = \\beta(1) = 1"}</M>,{" "}
          <M>{"\\alpha(1) = \\beta(0) = 0"}</M> and <M>{"\\gamma(0) = \\gamma(1) = 0"}</M>, the stochastic interpolant is
        </p>
        <MD>{"X_t = \\alpha_t X_0 + \\beta_t X_1 + \\gamma_t Z ."}</MD>
        <p>
          The term γZ adds latent noise in the middle that vanishes at both ends; we take <M>{"\\gamma = 0"}</M> below, where the
          ideas are already present. Flow matching uses <M>{"\\alpha_t = 1 - t, \\beta_t = t"}</M>. The trigonometric interpolant{" "}
          <M>{"\\alpha_t = \\cos(\\pi t/2), \\beta_t = \\sin(\\pi t/2)"}</M> keeps <M>{"\\alpha^2 + \\beta^2 = 1"}</M>, and up to a
          change of time variable it is the variance-preserving diffusion of m19.3.2 run backwards. <C>trig_coeffs</C> and{" "}
          <C>interp_point</C> compute it.
        </p>
      </Definition>

      <Theorem title="velocity and score">
        <p>
          Let <M>{"p_t"}</M> be the density of <M>{"X_t"}</M>. The velocity{" "}
          <M>{"b_t(x) = \\mathbb{E}[\\dot\\alpha_t X_0 + \\dot\\beta_t X_1 \\mid X_t = x]"}</M> satisfies{" "}
          <M>{"\\partial_t p_t + \\nabla \\cdot (p_t b_t) = 0"}</M>, and for <M>{"0 \\le t < 1"}</M> the score is
        </p>
        <MD>{"\\nabla \\log p_t(x) = -\\mathbb{E}[X_0 \\mid X_t = x]/\\alpha_t ."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first claim is the proof of m19.5.3 with <M>{"U = \\dot\\alpha_t X_0 + \\dot\\beta_t X_1"}</M>. For the second,
          given <M>{"X_1 = x_1"}</M>, <M>{"X_t \\sim N(\\beta_t x_1, \\alpha_t^2 I)"}</M>, whose score at <M>{"X_t"}</M> is{" "}
          <M>{"-(X_t - \\beta_t x_1)/\\alpha_t^2 = -X_0/\\alpha_t"}</M>. The density <M>{"p_t"}</M> is a mixture of these
          conditionals over <M>{"x_1"}</M>, and the score of a mixture is the posterior average of the component scores (m19.4.2),
          which is <M>{"-\\mathbb{E}[X_0 \\mid X_t]/\\alpha_t"}</M>. <C>score_from_x0</C> applies this to a predicted noise.
        </p>
        <Code>{INTERP}</Code>
      </Proof>

      <Theorem title="a family of samplers">
        <p>
          For every <M>{"\\varepsilon \\ge 0"}</M>, the SDE{" "}
          <M>{"dX_t = (b_t + \\varepsilon \\nabla \\log p_t)(X_t)\\,dt + \\sqrt{2\\varepsilon}\\, dW_t"}</M> started from{" "}
          <M>{"N(0, I)"}</M> has law <M>{"p_t"}</M> at every time.
        </p>
      </Theorem>
      <Proof>
        <p>
          The Fokker-Planck equation (m19.3.3) of this SDE is{" "}
          <M>{"\\partial_t q = -\\nabla \\cdot ((b + \\varepsilon s) q) + \\varepsilon \\Delta q"}</M>. Substitute{" "}
          <M>{"q = p_t"}</M>: since <M>{"s\\, p_t = \\nabla p_t"}</M>, the terms{" "}
          <M>{"-\\nabla \\cdot (\\varepsilon \\nabla p_t) + \\varepsilon \\Delta p_t"}</M> cancel, leaving the continuity equation
          for <M>{"b_t"}</M>, which <M>{"p_t"}</M> satisfies. Uniqueness for the Fokker-Planck equation with this initial value gives{" "}
          <M>{"q = p_t"}</M>. The probability flow ODE of m19.5.1 is the same trade read in the other direction.
        </p>
      </Proof>

      <Example title="Gaussian data on the trigonometric interpolant">
        <p>
          For <M>{"p_1 = N(0, s^2)"}</M> in one dimension, <M>{"X_t \\sim N(0, \\alpha^2 + \\beta^2 s^2)"}</M>, the score is{" "}
          <M>{"-x/(\\alpha^2 + \\beta^2 s^2)"}</M>, and the velocity is the regression of U on <M>{"X_t"}</M>:
        </p>
        <MD>{"b_t(x) = \\frac{\\alpha\\dot\\alpha + \\beta\\dot\\beta s^2}{\\alpha^2 + \\beta^2 s^2}\\, x ."}</MD>
        <p>
          When <M>{"s^2 = 1"}</M> the numerator is <M>{"\\tfrac12 \\frac{d}{dt}(\\alpha^2 + \\beta^2) = 0"}</M>: nothing needs to
          move, and the SDE family reduces to Ornstein-Uhlenbeck processes that hold <M>{"N(0, 1)"}</M> fixed. <C>sde_drift</C>,{" "}
          <C>trig_velocity_gauss</C> and <C>trig_score_gauss</C> compute the pieces.
        </p>
        <Code>{FAMILY}</Code>
      </Example>

      <Remark title="one network is enough">
        <p>
          Writing <M>{"\\hat x_0, \\hat x_1"}</M> for the conditional means of <M>{"X_0, X_1"}</M> given <M>{"X_t = x"}</M>, linearity
          gives <M>{"x = \\alpha \\hat x_0 + \\beta \\hat x_1"}</M> and <M>{"b = \\dot\\alpha \\hat x_0 + \\dot\\beta \\hat x_1"}</M>,
          so a network that predicts the noise determines the data prediction, the velocity and the score. Which one to regress on
          is a choice of loss weighting, not of model. The choice of ε is made at sampling time: larger ε corrects errors in the
          learned drift but needs smaller steps, which is the subject of the final chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "score",
      rung: "check",
      prompt: (
        <p>
          With the interpolant <M>{"X_t = (1 - t)X_0 + tX_1"}</M> and Gaussian noise <M>{"X_0"}</M>, a network predicts{" "}
          <M>{"\\mathbb{E}[X_0 \\mid X_t = x] = 0.6"}</M> at t = 0.25. What is the score there?
        </p>
      ),
      answer: { kind: "numeric", value: -0.8, tolerance: 0.0005 },
    },
    {
      key: "vel",
      rung: "check",
      prompt: (
        <p>
          On the trigonometric interpolant with data <M>{"N(0, 4)"}</M>, what is the velocity <M>{"b_t(x)"}</M> at x = 1 and t = 0.5?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.942, tolerance: 0.0006 },
    },
    {
      key: "eps",
      rung: "apply",
      prompt: <p>Why does adding ε times the score to the drift, together with noise of variance 2ε per unit time, not change the marginals?</p>,
      answer: {
        kind: "choice",
        options: [
          "In the Fokker-Planck equation the extra drift contributes minus ε times the Laplacian of p, which cancels the diffusion term exactly",
          "The noise has mean zero, so it does not affect the distribution",
          "The score is zero on average, so the extra drift has no effect",
          "It does change them, but only by an amount of order ε squared",
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

def trig_coeffs(t):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    return float(a), float(b), float(-np.pi / 2 * b), float(np.pi / 2 * a)   # alpha, beta and their derivatives

def interp_point(x0, x1, a, b, da, db):
    return a * x0 + b * x1, da * x0 + db * x1      # x_t and its time derivative

def score_from_x0(x0_hat, alpha):
    return -x0_hat / alpha                         # Gaussian x0: score = -E[x0 | x_t] / alpha

xt, u = interp_point(2.0, 4.0, 0.5, 0.5, -1.0, 1.0)
print([round(v, 4) for v in trig_coeffs(1 / 3)], xt, u, score_from_x0(1.5, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.866, 0.5, -0.7854, 1.3603] 3.0 2.0 -3.0",
          "[0.5, 0.866, -0.7854, 1.3603] 3.0 2.0 -3.0",
          "[0.866, 0.5, -0.7854, 1.3603] 3.0 2.0 -6.0",
          "[0.866, 0.5, 0.7854, 1.3603] 3.0 -2.0 -3.0",
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

def sde_drift(b, s, eps):
    return b + eps * s                             # pair with noise sqrt(2 eps) dW

def trig_velocity_gauss(x, t, s2):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    da, db = -np.pi / 2 * b, np.pi / 2 * a
    return float((a * da + b * db * s2) / (a ** 2 + b ** 2 * s2) * x)

def trig_score_gauss(x, t, s2):
    a, b = np.cos(np.pi * t / 2), np.sin(np.pi * t / 2)
    return float(-x / (a ** 2 + b ** 2 * s2))

print(sde_drift(1.0, -2.0, 0.25), round(trig_velocity_gauss(2.0, 0.5, 2.0), 4), round(trig_score_gauss(2.0, 0.5, 3.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 1.0472 -1.0", "1.5 1.0472 -1.0", "0.5 0.0 -1.0", "0.5 1.0472 -0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>trig_coeffs(t)</C> returning <M>{"\\alpha, \\beta, \\dot\\alpha, \\dot\\beta"}</M> as floats,{" "}
          <C>interp_point(x0, x1, a, b, da, db)</C> and <C>score_from_x0(x0_hat, alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def trig_coeffs(t):
    return 1 - t, t, -1.0, 1.0

def interp_point(x0, x1, a, b, da, db):
    return a * x0 + b * x1, x1 - x0

def score_from_x0(x0_hat, alpha):
    return -x0_hat / alpha ** 2
`,
        solution: INTERP,
        tests: [
          { name: "coeffs", code: `a, b, da, db = trig_coeffs(0.5)\nassert abs(a - np.sqrt(0.5)) < 1e-12 and abs(b - np.sqrt(0.5)) < 1e-12 and abs(da + np.pi / 2 * np.sqrt(0.5)) < 1e-12 and abs(db - np.pi / 2 * np.sqrt(0.5)) < 1e-12` },
          { name: "point", code: `assert interp_point(1.0, 2.0, 0.5, 0.5, -2.0, 1.0) == (1.5, 0.0) and abs(score_from_x0(1.0, 0.5) + 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sde_drift(b, s, eps)</C>, and for data <M>{"N(0, s_2)"}</M> on the trigonometric interpolant,{" "}
          <C>trig_velocity_gauss(x, t, s2)</C> and <C>trig_score_gauss(x, t, s2)</C>, returning floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sde_drift(b, s, eps):
    return b + np.sqrt(2 * eps) * s

def trig_velocity_gauss(x, t, s2):
    return float(x)

def trig_score_gauss(x, t, s2):
    return float(-x / s2)
`,
        solution: FAMILY,
        tests: [
          { name: "drift", code: `assert abs(sde_drift(1.0, 2.0, 2.0) - 5.0) < 1e-12 and abs(trig_velocity_gauss(3.0, 0.3, 1.0)) < 1e-12` },
          { name: "gauss", code: `assert abs(trig_velocity_gauss(1.0, 1 / 3, 4.0) - np.pi * 3 * np.sqrt(3) / 8 / 1.75) < 1e-9 and abs(trig_score_gauss(1.0, 0.5, 4.0) + 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "drift",
      rung: "stretch",
      prompt: (
        <p>
          With the interpolant <M>{"X_t = (1 - t)X_0 + tX_1"}</M>, noise and data both <M>{"N(0, 1)"}</M>, what is the drift{" "}
          <M>{"b_t + \\varepsilon \\nabla \\log p_t"}</M> of the sampler with ε = 0.25 at x = 1 and t = 0.5?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every sampler in this chapter is an ODE or SDE that must be solved numerically with a learned drift. The final chapter
        turns to the solvers: Euler-Maruyama, its convergence, and higher-order methods that reach the data in few steps.
      </p>
    </>
  ),
};
