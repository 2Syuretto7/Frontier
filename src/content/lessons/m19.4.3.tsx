import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DsmRegressionViz } from "@/components/viz/DsmRegressionViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import numpy as np

def dsm_targets(x0, eps, sigma):
    xt = x0 + sigma * eps
    return xt, -eps / sigma                      # the score of p(xt | x0), known exactly

def fit_linear(xt, target):
    a, b = np.polyfit(xt, target, 1)             # least squares s(x) = a x + b
    return float(a), float(b)

def dsm_loss(a, b, xt, target):
    return float(np.mean((a * xt + b - target) ** 2))`;

const LINK = `def true_score_coeffs(m, s2, sigma):
    v = s2 + sigma ** 2
    return -1 / v, m / v                         # score of N(m, s2 + sigma^2) is -(x - m) / v

def dsm_constant(s2, sigma):
    return 1 / sigma ** 2 - 1 / (s2 + sigma ** 2)   # the loss left when the score is perfect

def eps_from_score(score, sigma):
    return -sigma * score                        # noise prediction and score are the same thing`;

export const lesson: LessonContent = {
  id: "m19.4.3",
  minutes: 55,
  links: {
    requires: ["m19.4.2", "m19.4.1"],
    revisits: ["m7.6.1", "m9.6.2"],
    foreshadows: ["m19.5.1"],
  },

  puzzle: (
    <>
      <p>
        To run the reverse SDE we need the score of the noised data distribution at every noise level, but we have only samples of
        the data, never its density. Score matching (m19.4.2) asks us to minimise{" "}
        <M>{"\\mathbb{E}|s_\\theta(X) - \\nabla \\log p(X)|^2"}</M>, and the target in that loss is exactly the unknown quantity.
        How can a network be trained to match a function nobody can evaluate, using a loss that can be computed from samples?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take a clean sample <M>{"x_0"}</M>, add noise to get <M>{"x = x_0 + \\sigma\\varepsilon"}</M>, and ask for the score of the
        conditional density <M>{"p(x \\mid x_0)"}</M>. That density is a Gaussian centred at <M>{"x_0"}</M>, so its score is{" "}
        <M>{"-(x - x_0)/\\sigma^2 = -\\varepsilon/\\sigma"}</M>, known exactly. Each such target is a very noisy guess at the true
        score, because it depends on which <M>{"x_0"}</M> happened to produce x. Regression averages over that randomness: the best
        predictor of the target given x is its conditional mean, and that conditional mean is the true score of the noised data.
        Predicting the noise <M>{"\\varepsilon"}</M> instead of the score is the same regression, rescaled.
      </p>
      <DsmRegressionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the denoising objective">
        <p>
          Let <M>{"X_0 \\sim p_0"}</M>, <M>{"\\varepsilon \\sim N(0, I)"}</M> independent, and{" "}
          <M>{"X = X_0 + \\sigma\\varepsilon"}</M> with density <M>{"p_\\sigma"}</M>. The denoising score matching loss of a function s
          is
        </p>
        <MD>{"J_{\\mathrm{DSM}}(s) = \\mathbb{E}\\left|s(X) + \\varepsilon/\\sigma\\right|^2 ."}</MD>
        <p>
          <C>dsm_targets</C> forms the pairs <M>{"(x, -\\varepsilon/\\sigma)"}</M>, <C>fit_linear</C> fits the best linear score by
          least squares (m9.6.2), and <C>dsm_loss</C> evaluates the empirical loss of a linear score.
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="Vincent's equivalence">
        <p>
          If <M>{"\\mathbb{E}|s(X)|^2 < \\infty"}</M>, then{" "}
          <M>{"J_{\\mathrm{DSM}}(s) = \\mathbb{E}|s(X) - \\nabla \\log p_\\sigma(X)|^2 + C"}</M>, where C does not depend on s. So
          minimising the denoising loss minimises the Fisher divergence to the true score, and the minimiser over all functions is{" "}
          <M>{"s = \\nabla \\log p_\\sigma"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"T = -\\varepsilon/\\sigma"}</M>. For any square-integrable random variable T and function s,{" "}
          <M>{"\\mathbb{E}|s(X) - T|^2 = \\mathbb{E}|s(X) - \\mathbb{E}[T \\mid X]|^2 + \\mathbb{E}|T - \\mathbb{E}[T \\mid X]|^2"}</M>
          , because the cross term vanishes by the tower property (m7.6.1): <M>{"T - \\mathbb{E}[T \\mid X]"}</M> is orthogonal to
          every function of X. The second term does not involve s. It remains to show{" "}
          <M>{"\\mathbb{E}[T \\mid X = x] = \\nabla \\log p_\\sigma(x)"}</M>. Since{" "}
          <M>{"\\varepsilon = (X - X_0)/\\sigma"}</M>,{" "}
          <M>{"\\mathbb{E}[T \\mid X = x] = -(x - \\mathbb{E}[X_0 \\mid X = x])/\\sigma^2"}</M>, and by Tweedie&apos;s formula
          (m19.4.2) this is <M>{"\\nabla \\log p_\\sigma(x)"}</M>.
        </p>
      </Proof>

      <Theorem title="the irreducible loss for Gaussian data">
        <p>
          If <M>{"p_0 = N(m, s^2)"}</M> in one dimension, then <M>{"p_\\sigma = N(m, s^2 + \\sigma^2)"}</M>, its score is linear with
          slope <M>{"-1/(s^2 + \\sigma^2)"}</M> and intercept <M>{"m/(s^2 + \\sigma^2)"}</M>, and the minimum of{" "}
          <M>{"J_{\\mathrm{DSM}}"}</M> is <M>{"C = 1/\\sigma^2 - 1/(s^2 + \\sigma^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum of independent Gaussians is Gaussian with the variances added, which gives the score. With{" "}
          <M>{"v = s^2 + \\sigma^2"}</M>, the minimum is <M>{"\\mathbb{E}|T|^2 - \\mathbb{E}|\\mathbb{E}[T \\mid X]|^2"}</M>. Here{" "}
          <M>{"\\mathbb{E}|T|^2 = 1/\\sigma^2"}</M>, and <M>{"\\mathbb{E}[T \\mid X] = -(X - m)/v"}</M> has second moment{" "}
          <M>{"v/v^2 = 1/v"}</M>. <C>true_score_coeffs</C> and <C>dsm_constant</C> compute these.
        </p>
      </Proof>

      <Definition title="noise prediction">
        <p>
          Writing <M>{"s(x) = -\\hat\\varepsilon(x)/\\sigma"}</M> gives{" "}
          <M>{"J_{\\mathrm{DSM}} = \\sigma^{-2}\\,\\mathbb{E}|\\hat\\varepsilon(X) - \\varepsilon|^2"}</M>: the network predicts the
          noise that was added, and the score is recovered by dividing by <M>{"-\\sigma"}</M>. <C>eps_from_score</C> converts in the
          other direction.
        </p>
        <Code>{LINK}</Code>
      </Definition>

      <Example title="weighting across noise levels">
        <p>
          Diffusion models train one network <M>{"s_\\theta(x, \\sigma)"}</M> for all noise levels by sampling σ and minimising{" "}
          <M>{"\\mathbb{E}_\\sigma\\, \\lambda(\\sigma) J_{\\mathrm{DSM}}(s_\\theta(\\cdot, \\sigma))"}</M>. The constant C grows like{" "}
          <M>{"1/\\sigma^2"}</M> as σ falls, so with <M>{"\\lambda = 1"}</M> small noise levels would dominate the gradient. The
          choice <M>{"\\lambda(\\sigma) = \\sigma^2"}</M> turns the loss into the plain noise-prediction loss{" "}
          <M>{"\\mathbb{E}|\\hat\\varepsilon - \\varepsilon|^2"}</M>, which has comparable size at every level.
        </p>
      </Example>

      <Remark title="why the targets can be so noisy">
        <p>
          A loss that stays large at its minimum is not a sign of a bad fit: C is the variance of the target around its conditional
          mean, and no function of x can remove it. This is also why the denoising loss is a poor guide to sample quality, and why
          training curves of diffusion models flatten at a high value. At small σ the variance is huge, so estimates of the score
          near the data need many samples, which is one reason the smallest noise levels are hardest to learn.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "const",
      rung: "check",
      prompt: (
        <p>
          Data follow <M>{"N(0, 1)"}</M> and the noise level is σ = 0.5. What is the smallest possible value of the denoising score
          matching loss <M>{"\\mathbb{E}|s(X) + \\varepsilon/\\sigma|^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3.2, tolerance: 0.0005 },
    },
    {
      key: "eps",
      rung: "check",
      prompt: (
        <p>
          A noise-prediction network outputs <M>{"\\hat\\varepsilon = 0.6"}</M> at noise level σ = 0.3. What score does this
          correspond to?
        </p>
      ),
      answer: { kind: "numeric", value: -2, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does regressing onto the targets −ε/σ, which depend on the unseen clean point, recover the true score?</p>,
      answer: {
        kind: "choice",
        options: [
          "The least squares minimiser is the conditional mean of the target given x, and by Tweedie's formula that conditional mean is the score of the noised density",
          "The noise is small, so the targets are close to the true score",
          "The clean points are recovered exactly from the noisy ones",
          "The targets have mean zero, so the network learns zero, which is the score",
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

def dsm_targets(x0, eps, sigma):
    xt = x0 + sigma * eps
    return xt, -eps / sigma                      # the score of p(xt | x0), known exactly

def fit_linear(xt, target):
    a, b = np.polyfit(xt, target, 1)             # least squares s(x) = a x + b
    return float(a), float(b)

def dsm_loss(a, b, xt, target):
    return float(np.mean((a * xt + b - target) ** 2))

xt, tg = dsm_targets(np.array([0.0, 2.0]), np.array([1.0, -1.0]), 0.5)
print(xt.tolist(), tg.tolist(), [round(v, 4) for v in fit_linear(xt, tg)], round(dsm_loss(0.0, 0.0, xt, tg), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.5] [-2.0, 2.0] [4.0, -4.0] 4.0",
          "[0.5, 1.5] [2.0, -2.0] [-4.0, 4.0] 4.0",
          "[0.5, 1.5] [-2.0, 2.0] [4.0, -4.0] 0.0",
          "[1.0, 1.0] [-2.0, 2.0] [4.0, -4.0] 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def true_score_coeffs(m, s2, sigma):
    v = s2 + sigma ** 2
    return -1 / v, m / v                         # score of N(m, s2 + sigma^2) is -(x - m) / v

def dsm_constant(s2, sigma):
    return 1 / sigma ** 2 - 1 / (s2 + sigma ** 2)   # the loss left when the score is perfect

def eps_from_score(score, sigma):
    return -sigma * score                        # noise prediction and score are the same thing

a, b = true_score_coeffs(1.0, 3.0, 1.0)
print(a, b, dsm_constant(3.0, 1.0), eps_from_score(-0.5, 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-0.25 0.25 0.75 1.0", "-0.25 0.25 0.75 -1.0", "-0.333 0.333 0.75 1.0", "-0.25 0.25 1.25 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dsm_targets(x0, eps, sigma)</C> returning the noised points and their targets, <C>fit_linear(xt, target)</C>{" "}
          returning the least squares slope and intercept as floats, and <C>dsm_loss(a, b, xt, target)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dsm_targets(x0, eps, sigma):
    return x0 + eps, -eps

def fit_linear(xt, target):
    return 0.0, float(np.mean(target))

def dsm_loss(a, b, xt, target):
    return float(np.mean(np.abs(a * xt + b - target)))
`,
        solution: FIT,
        tests: [
          { name: "targets", code: `x, t = dsm_targets(np.array([1.0, 0.0]), np.array([2.0, -1.0]), 0.5)\nassert x.shape == (2,) and t.shape == (2,)\nassert np.allclose(x, [2.0, -0.5]) and np.allclose(t, [-4.0, 2.0])` },
          { name: "fit", code: `a, b = fit_linear(np.array([0.0, 1.0, 2.0]), np.array([1.0, 3.0, 5.0]))\nassert abs(a - 2.0) < 1e-9 and abs(b - 1.0) < 1e-9 and isinstance(a, float)\nassert abs(dsm_loss(1.0, 0.0, np.array([0.0, 1.0]), np.array([2.0, 1.0])) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>true_score_coeffs(m, s2, sigma)</C> for data <M>{"N(m, s_2)"}</M>, <C>dsm_constant(s2, sigma)</C> and{" "}
          <C>eps_from_score(score, sigma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def true_score_coeffs(m, s2, sigma):
    return -1 / s2, m / s2

def dsm_constant(s2, sigma):
    return 1 / sigma ** 2

def eps_from_score(score, sigma):
    return score / sigma
`,
        solution: LINK,
        tests: [
          { name: "coeffs", code: `a, b = true_score_coeffs(2.0, 1.0, 1.0)\nassert abs(a + 0.5) < 1e-12 and abs(b - 1.0) < 1e-12` },
          { name: "constant", code: `assert abs(dsm_constant(1.0, 1.0) - 0.5) < 1e-12 and abs(eps_from_score(-3.0, 0.5) - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "tweedie",
      rung: "stretch",
      prompt: (
        <p>
          Data follow <M>{"N(2, 0.5)"}</M>, noise of variance 0.5 is added, and the optimal denoising network is evaluated at x = 3.
          Converting its score to a denoised estimate with Tweedie&apos;s formula, what is <M>{"\\mathbb{E}[X_0 \\mid X = 3]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With a learned score we can run the reverse SDE. But the same marginal densities can also be produced by a deterministic flow
        with no noise at all. The next lesson derives this probability flow ODE, which turns sampling into solving an ordinary
        differential equation and makes exact likelihoods computable.
      </p>
    </>
  ),
};
