import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ScoreLangevinViz } from "@/components/viz/ScoreLangevinViz";
import type { LessonContent } from "@/lib/types";

const SCORE = `import numpy as np

def mixture_score(x, means, sds, weights):
    means, sds, weights = map(np.asarray, (means, sds, weights))
    logw = np.log(weights) - np.log(sds) - (x - means) ** 2 / (2 * sds ** 2)
    post = np.exp(logw - logw.max())
    post /= post.sum()                                   # which component x probably came from
    return float(np.sum(post * -(x - means) / sds ** 2))  # posterior-weighted component scores

def numeric_score(logp, x, h):
    return (logp(x + h) - logp(x - h)) / (2 * h)         # the normalising constant cancels

def stein_check(xs, score, f, f1):
    return float(np.mean(score(xs) * f(xs) + f1(xs)))    # zero in expectation under the true density`;

const USE = `import numpy as np

def tweedie(x, sigma2, score_val):
    return x + sigma2 * score_val                        # E[x0 | x] for x = x0 + noise of variance sigma2

def langevin_step(x, score_val, eps, z):
    return x + eps * score_val + np.sqrt(2 * eps) * z

def fisher_div(xs, s1, s2):
    return float(np.mean((s1(xs) - s2(xs)) ** 2))`;

export const lesson: LessonContent = {
  id: "m19.4.2",
  minutes: 55,
  links: {
    requires: ["m19.4.1", "m13.4.4"],
    revisits: ["m13.6.1", "m19.3.3"],
    foreshadows: ["m19.4.3"],
  },

  puzzle: (
    <>
      <p>
        An energy-based model defines a density <M>{"p(x) = e^{-E(x)}/Z"}</M>, but the normaliser Z is an integral over all images and
        cannot be computed, so neither can p. Yet the reverse SDE needs only <M>{"\\nabla \\log p"}</M>, and Langevin dynamics samples
        from p using nothing else. How can a quantity that ignores Z carry enough information to generate samples, and what does it
        look like for a density with several modes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The score <M>{"\\nabla \\log p"}</M> is a vector field pointing in the direction in which the density increases fastest,
        relative to its current value. Multiplying p by a constant adds a constant to <M>{"\\log p"}</M>, which the gradient removes,
        so Z never appears. The field still determines p: integrate it along a path to recover <M>{"\\log p"}</M> up to a constant.
        For a mixture, the score at x is the average of the component scores, weighted by how likely each component is to have
        produced x. Noise smooths the density, and the score of the noisy density tells you, by Tweedie&apos;s formula, the best guess
        of the clean point.
      </p>
      <ScoreLangevinViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the score">
        <p>
          The score of a positive differentiable density p is <M>{"s(x) = \\nabla \\log p(x) = \\nabla p(x)/p(x)"}</M>. For{" "}
          <M>{"p = e^{-E}/Z"}</M>, <M>{"s = -\\nabla E"}</M>, independent of Z; <C>numeric_score</C> computes it by central differences
          from an unnormalised log density. For a Gaussian <M>{"N(\\mu, \\sigma^2)"}</M>, <M>{"s(x) = -(x - \\mu)/\\sigma^2"}</M>.
        </p>
        <Code>{SCORE}</Code>
      </Definition>

      <Theorem title="the score of a mixture">
        <p>
          If <M>{"p = \\sum_k w_k p_k"}</M>, then <M>{"\\nabla \\log p(x) = \\sum_k \\pi_k(x) \\nabla \\log p_k(x)"}</M> with posterior
          weights <M>{"\\pi_k(x) = w_k p_k(x)/p(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\nabla p = \\sum_k w_k \\nabla p_k = \\sum_k w_k p_k \\nabla \\log p_k"}</M>; dividing by p gives the result.{" "}
          <C>mixture_score</C> computes it for Gaussian components, working with log weights for numerical stability. The weights are
          the probabilities, given x, of each component, so far from the trough between two modes the score is essentially that of the
          nearer component.
        </p>
      </Proof>

      <Theorem title="Stein's identity">
        <p>
          If X has a smooth positive density p on <M>{"\\mathbb{R}"}</M> with score s, and f is smooth with{" "}
          <M>{"f p \\to 0"}</M> at <M>{"\\pm\\infty"}</M> and the expectations finite, then{" "}
          <M>{"\\mathbb{E}[s(X) f(X) + f'(X)] = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}[s f] = \\int \\frac{p'}{p} f p\\, dx = \\int p' f\\, dx = [p f]_{-\\infty}^{\\infty} - \\int p f'\\, dx = -\\mathbb{E}[f']"}</M>
          . <C>stein_check</C> evaluates the sample average, which is near zero for samples from p and the true score; a wrong score
          leaves a nonzero average for some f. This identity is what makes score matching possible without knowing p.
        </p>
      </Proof>

      <Theorem title="Tweedie's formula">
        <p>
          Let <M>{"X = X_0 + \\sigma \\varepsilon"}</M> with <M>{"\\varepsilon \\sim N(0, 1)"}</M> independent of <M>{"X_0"}</M>, and let p
          be the density of X. Then <M>{"\\mathbb{E}[X_0 \\mid X = x] = x + \\sigma^2 \\nabla \\log p(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"p(x) = \\int \\varphi_\\sigma(x - x_0)\\, \\mu(dx_0)"}</M> with <M>{"\\varphi_\\sigma"}</M> the{" "}
          <M>{"N(0, \\sigma^2)"}</M> density and μ the law of <M>{"X_0"}</M>. Differentiating under the integral,{" "}
          <M>{"\\nabla p(x) = \\int -\\frac{x - x_0}{\\sigma^2}\\varphi_\\sigma(x - x_0)\\, \\mu(dx_0)"}</M>. Divide by p: the ratio{" "}
          <M>{"\\varphi_\\sigma(x - x_0)\\mu(dx_0)/p(x)"}</M> is the posterior of <M>{"X_0"}</M> given <M>{"X = x"}</M>, so{" "}
          <M>{"\\nabla \\log p(x) = -(x - \\mathbb{E}[X_0 \\mid X = x])/\\sigma^2"}</M>, which rearranges to the formula.
        </p>
      </Proof>

      <Definition title="using a score">
        <p>
          <C>tweedie</C> turns a noisy point and the score there into the posterior mean of the clean point. <C>langevin_step</C> is one
          step of Langevin dynamics (m13.4.4), <M>{"x \\leftarrow x + \\varepsilon s(x) + \\sqrt{2\\varepsilon}\\, z"}</M>, whose
          stationary law is p (m19.3.3). <C>fisher_div</C> estimates the Fisher divergence{" "}
          <M>{"\\mathbb{E}_p|s_1 - s_2|^2"}</M> between two score functions from samples, the quantity score matching minimises.
        </p>
        <Code>{USE}</Code>
      </Definition>

      <Remark title="two meanings of score">
        <p>
          In statistics the score is the gradient of the log likelihood with respect to parameters, as in the score-function estimator
          (m13.6.1); here it is the gradient with respect to the data point x. Both have mean zero under the model, by the same
          integration by parts. Langevin dynamics with a learned score mixes slowly between separated modes, as the visualisation
          shows; diffusion models avoid this by starting at high noise, where the modes are merged, and annealing down.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mix",
      rung: "check",
      prompt: (
        <p>
          What is the score of <M>{"\\tfrac12 N(-2, 1) + \\tfrac12 N(2, 1)"}</M> at x = 1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.928, tolerance: 0.0006 },
    },
    {
      key: "tweedie",
      rung: "check",
      prompt: (
        <p>
          Clean data follow <M>{"N(1, 1)"}</M> and are observed with Gaussian noise of variance 0.25. Using Tweedie&apos;s formula, what is{" "}
          <M>{"\\mathbb{E}[X_0 \\mid X = 2]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1.8, tolerance: 0.0005 },
    },
    {
      key: "z",
      rung: "apply",
      prompt: <p>Why can the score of an energy-based model be computed when its density cannot?</p>,
      answer: {
        kind: "choice",
        options: [
          "The normaliser is a constant, so it adds a constant to log p and disappears under the gradient, leaving minus the gradient of the energy",
          "The score is defined only up to a constant, so any value will do",
          "The normaliser cancels because energies are always positive",
          "The score is computed by Monte Carlo estimates of the normaliser",
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

def mixture_score(x, means, sds, weights):
    means, sds, weights = map(np.asarray, (means, sds, weights))
    logw = np.log(weights) - np.log(sds) - (x - means) ** 2 / (2 * sds ** 2)
    post = np.exp(logw - logw.max())
    post /= post.sum()                                   # which component x probably came from
    return float(np.sum(post * -(x - means) / sds ** 2))  # posterior-weighted component scores

def numeric_score(logp, x, h):
    return (logp(x + h) - logp(x - h)) / (2 * h)         # the normalising constant cancels

def stein_check(xs, score, f, f1):
    return float(np.mean(score(xs) * f(xs) + f1(xs)))    # zero in expectation under the true density

xs = np.array([-1.0, 1.0])
print(round(mixture_score(0.0, [0.0, 3.0], [1.0, 1.0], [0.5, 0.5]), 4), round(numeric_score(lambda x: -x ** 4, 1.0, 1e-3), 3), stein_check(xs, lambda x: -x, lambda x: x, lambda x: 1.0 + 0 * x), stein_check(xs + 1, lambda x: -x, lambda x: x, lambda x: 1.0 + 0 * x))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.033 -4.0 0.0 -1.0", "1.5 -4.0 0.0 -1.0", "0.033 -4.0 0.0 0.0", "0.033 -1.0 0.0 -1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def tweedie(x, sigma2, score_val):
    return x + sigma2 * score_val                        # E[x0 | x] for x = x0 + noise of variance sigma2

def langevin_step(x, score_val, eps, z):
    return x + eps * score_val + np.sqrt(2 * eps) * z

def fisher_div(xs, s1, s2):
    return float(np.mean((s1(xs) - s2(xs)) ** 2))

xs = np.array([0.0, 1.0, 2.0])
print(tweedie(2.0, 0.5, -1.0), langevin_step(1.0, -1.0, 0.125, 2.0), round(fisher_div(xs, lambda x: -x, lambda x: -2 * x), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5 1.875 1.6667", "2.5 1.875 1.6667", "1.5 1.375 1.6667", "1.5 1.875 5.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mixture_score(x, means, sds, weights)</C> for a mixture of one-dimensional Gaussians, returning a float,{" "}
          <C>numeric_score(logp, x, h)</C> and <C>stein_check(xs, score, f, f1)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mixture_score(x, means, sds, weights):
    return float(-(x - np.mean(means)))

def numeric_score(logp, x, h):
    return (logp(x + h) - logp(x)) / h

def stein_check(xs, score, f, f1):
    return float(np.mean(score(xs) * f(xs)))
`,
        solution: SCORE,
        tests: [
          { name: "mixture", code: `assert abs(mixture_score(1.0, [1.0], [2.0], [1.0])) < 1e-12 and abs(mixture_score(0.0, [-1.0, 30.0], [1.0, 1.0], [0.5, 0.5]) + 1.0) < 1e-12\nassert abs(mixture_score(1.0, [0.0, 2.0], [1.0, 1.0], [0.5, 0.5])) < 1e-12 and abs(mixture_score(4.0, [0.0], [2.0], [1.0]) + 1.0) < 1e-12` },
          { name: "stein", code: `assert abs(numeric_score(lambda x: x ** 3, 2.0, 1e-4) - 12.0) < 1e-6\nassert stein_check(np.array([1.0, 3.0]), lambda x: -x, lambda x: x ** 2, lambda x: 2 * x) == -10.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tweedie(x, sigma2, score_val)</C>, <C>langevin_step(x, score_val, eps, z)</C> and <C>fisher_div(xs, s1, s2)</C>,
          returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tweedie(x, sigma2, score_val):
    return x - sigma2 * score_val

def langevin_step(x, score_val, eps, z):
    return x + eps * score_val + eps * z

def fisher_div(xs, s1, s2):
    return float(np.mean(s1(xs) - s2(xs)))
`,
        solution: USE,
        tests: [
          { name: "tweedie", code: `assert tweedie(3.0, 2.0, -0.5) == 2.0 and langevin_step(0.0, 1.0, 0.5, 1.0) == 1.5` },
          { name: "fisher", code: `assert fisher_div(np.array([1.0, -1.0]), lambda x: x, lambda x: 0 * x) == 1.0 and fisher_div(np.array([2.0]), lambda x: x, lambda x: -x) == 16.0` },
        ],
      },
    },
    {
      key: "fisher",
      rung: "stretch",
      prompt: (
        <p>
          What is the Fisher divergence <M>{"\\mathbb{E}_p|s_p(X) - s_q(X)|^2"}</M> between <M>{"p = N(0, 1)"}</M> and{" "}
          <M>{"q = N(0, 2)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tweedie&apos;s formula links the score of noisy data to denoising. The next lesson turns that link into a training objective:
        a network trained to predict the noise added to data, by plain regression, learns the score at every noise level.
      </p>
    </>
  ),
};
