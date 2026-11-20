import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DenoisingScoreViz } from "@/components/viz/DenoisingScoreViz";
import type { LessonContent } from "@/lib/types";

const SCORES = `import math

def gaussian_score(x, mu, var):
    return -(x - mu) / var

def mixture_score(x, ws, mus, vs):
    dens = [w * math.exp(-(x - m) ** 2 / (2 * v)) / math.sqrt(v) for w, m, v in zip(ws, mus, vs)]
    return sum(d * gaussian_score(x, m, v) for d, m, v in zip(dens, mus, vs)) / sum(dens)

def hyvarinen_loss_gauss(xs, mu, var):
    return sum(-1 / var + 0.5 * gaussian_score(x, mu, var) ** 2 for x in xs) / len(xs)`;

const DSM = `def dsm_targets(x, eps, sigma):
    return x + sigma * eps, -eps / sigma

def dsm_loss(score, xs, eps, sigma):
    total = 0.0
    for x, e in zip(xs, eps):
        xt, target = dsm_targets(x, e, sigma)
        total += 0.5 * (score(xt) - target) ** 2
    return total / len(xs)

def tweedie_denoise(x_noisy, score_value, sigma):
    return x_noisy + sigma ** 2 * score_value`;

export const lesson: LessonContent = {
  id: "l7.6.2",
  minutes: 45,
  links: {
    requires: ["l7.6.1", "l4.2.3"],
    revisits: ["l7.3.2", "m13.4.4"],
    foreshadows: ["l7.6.3", "l12.1.1", "l12.1.2"],
  },

  puzzle: (
    <>
      <p>
        You cannot normalise an energy-based model, so you cannot compute its likelihood, and training it needs samples from
        the model at every step. But look at the gradient of the log-density with respect to x rather than θ: the normaliser,
        a constant, disappears. If a network could be trained to output this gradient, the direction in which data become more
        probable, it would never meet Z at all. Yet the true gradient of the data density is unknown too. What could the
        network be trained against?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Add a little noise to a data point. The direction from the noisy point back to the clean one points, on average, up
        the slope of the noise-blurred data density. So a network trained to predict that direction from the noisy point, a
        denoiser, is learning the gradient of the log-density of the blurred data, its <em>score</em>, with no normaliser and
        no sampling.
      </p>
      <p>
        Each individual target is noisy, since many clean points could have produced the same noisy one, but least squares
        regression recovers the average, and the average is exactly the score.
      </p>
      <DenoisingScoreViz />
    </>
  ),

  theory: (
    <>
      <Definition title="score and Fisher divergence">
        <p>
          The <em>score</em> of a density p is <M>{"s_p(x) = \\nabla_x \\log p(x)"}</M>. For an EBM it is <M>{"-\\nabla_x E(x)"}</M>, free of Z;
          for a Gaussian it is <M>{"-(x - \\mu)/\\sigma^2"}</M> (<C>gaussian_score</C>); for a mixture it is the average of the
          components&apos; scores weighted by their posterior responsibilities (<C>mixture_score</C>). Score matching fits a model
          score <M>{"s_\\theta"}</M> by minimising the Fisher divergence{" "}
          <M>{"\\tfrac12\\mathbb{E}_p\\|s_\\theta(x) - s_p(x)\\|^2"}</M>.
        </p>
      </Definition>

      <Theorem title="Hyvärinen's identity">
        <p>Under mild decay conditions, in one dimension,</p>
        <MD>{"\\tfrac12 \\mathbb{E}_p\\big[(s_\\theta - s_p)^2\\big] = \\mathbb{E}_p\\big[s_\\theta'(x) + \\tfrac12 s_\\theta(x)^2\\big] + \\text{const},"}</MD>
        <p>and in d dimensions <M>{"s_\\theta'"}</M> becomes the trace of the Jacobian of <M>{"s_\\theta"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Expanding the square, <M>{"\\tfrac12 \\mathbb{E}[s_p^2]"}</M> does not involve θ. The cross term is{" "}
          <M>{"-\\mathbb{E}_p[s_\\theta s_p] = -\\int s_\\theta(x) p'(x)\\, dx"}</M>, since <M>{"s_p\\, p = p'"}</M>. Integrating by parts,
          with <M>{"s_\\theta p \\to 0"}</M> at ±∞, it equals <M>{"\\int s_\\theta'(x) p(x)\\, dx"}</M>. Every term is now an expectation
          under p, estimable from data (<C>hyvarinen_loss_gauss</C>). For a Gaussian model its minimiser is the sample mean and
          variance, the maximum-likelihood estimate.
        </p>
        <Code>{SCORES}</Code>
      </Proof>

      <Theorem title="denoising score matching">
        <p>
          (Vincent, 2011.) Let <M>{"\\tilde x = x + \\sigma\\varepsilon"}</M> with <M>{"x \\sim p"}</M> and <M>{"\\varepsilon \\sim \\mathcal{N}(0, I)"}</M>,
          so that <M>{"\\tilde x \\sim p_\\sigma"}</M>, the data blurred by noise. Then
        </p>
        <MD>{"\\mathbb{E}_{x, \\varepsilon}\\Big\\|s_\\theta(\\tilde x) + \\frac{\\varepsilon}{\\sigma}\\Big\\|^2 = \\mathbb{E}_{p_\\sigma}\\big\\|s_\\theta(\\tilde x) - \\nabla \\log p_\\sigma(\\tilde x)\\big\\|^2 + \\text{const},"}</MD>
        <p>so the denoising objective is minimised by the score of <M>{"p_\\sigma"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"p_\\sigma(\\tilde x) = \\int p(x)\\, \\mathcal{N}(\\tilde x; x, \\sigma^2 I)\\, dx"}</M>. Differentiating under the integral,{" "}
          <M>{"\\nabla p_\\sigma(\\tilde x) = \\int p(x) \\mathcal{N}(\\tilde x; x, \\sigma^2 I) \\frac{x - \\tilde x}{\\sigma^2} dx"}</M>, and dividing
          by <M>{"p_\\sigma(\\tilde x)"}</M> gives <M>{"\\nabla \\log p_\\sigma(\\tilde x) = \\mathbb{E}[(x - \\tilde x)/\\sigma^2 \\mid \\tilde x] = \\mathbb{E}[-\\varepsilon/\\sigma \\mid \\tilde x]"}</M>.
          The left side is a least-squares regression of the target <M>{"-\\varepsilon/\\sigma"}</M> on <M>{"\\tilde x"}</M>
          (<C>dsm_targets</C>, <C>dsm_loss</C>), and the squared error to any target splits into the squared error to its
          conditional mean plus the target&apos;s conditional variance, which does not depend on θ.
        </p>
      </Proof>

      <Theorem title="Tweedie's formula">
        <p>
          <M>{"\\mathbb{E}[x \\mid \\tilde x] = \\tilde x + \\sigma^2 \\nabla \\log p_\\sigma(\\tilde x)"}</M>: the best denoiser in squared error is
          one step up the score.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiply the identity <M>{"\\nabla \\log p_\\sigma(\\tilde x) = \\mathbb{E}[(x - \\tilde x)/\\sigma^2 \\mid \\tilde x]"}</M> by{" "}
          <M>{"\\sigma^2"}</M> and rearrange (<C>tweedie_denoise</C>). So a denoising network and a score network are the same
          object up to scaling, which is why denoising autoencoders (l4.2.3) learn about the data density.
        </p>
        <Code>{DSM}</Code>
      </Proof>

      <Remark title="one noise level is not enough">
        <p>
          With small σ the score of <M>{"p_\\sigma"}</M> is close to the data score but is learned only where data lie; in the empty
          regions between modes, where a sampler starting from noise must travel, it is never trained. With large σ the score
          is learned everywhere but describes a blurred distribution. Song and Ermon (2019) trained one network on many noise
          levels, conditioned on σ, and annealed from large to small during sampling. That is the step from score matching to
          diffusion models (l12.1.1, l12.1.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "score",
      rung: "check",
      prompt: <p>What is the score of N(2, 4) (variance 4) at x = 5?</p>,
      answer: { kind: "numeric", value: -0.75, tolerance: 0.0001 },
    },
    {
      key: "tweedie",
      rung: "check",
      prompt: <p>Data are N(0, 1) and are corrupted by noise with σ = 1. What is the best estimate in squared error of the clean value when the noisy value is 3?</p>,
      answer: { kind: "numeric", value: 1.5, tolerance: 0.0001 },
    },
    {
      key: "targets",
      rung: "apply",
      prompt: <p>Denoising score matching regresses on targets −ε/σ that differ even for the same noisy input. Why does it still learn the right function?</p>,
      answer: {
        kind: "choice",
        options: [
          "Least squares recovers the conditional mean of the target given the input, and that mean is the score of the noisy data",
          "The noise averages to zero within each minibatch, so the targets are exact",
          "The network learns the score of the clean data, which does not depend on ε",
          "Each noisy input is produced by exactly one clean point",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def gaussian_score(x, mu, var):
    return -(x - mu) / var

def mixture_score(x, ws, mus, vs):
    dens = [w * math.exp(-(x - m) ** 2 / (2 * v)) / math.sqrt(v) for w, m, v in zip(ws, mus, vs)]
    return sum(d * gaussian_score(x, m, v) for d, m, v in zip(dens, mus, vs)) / sum(dens)

def hyvarinen_loss_gauss(xs, mu, var):
    return sum(-1 / var + 0.5 * gaussian_score(x, mu, var) ** 2 for x in xs) / len(xs)

print(gaussian_score(3, 1, 2), mixture_score(0, [0.5, 0.5], [-1, 1], [1, 1]), mixture_score(2, [1.0], [0], [4]), round(mixture_score(1, [0.5, 0.5], [-1, 1], [1, 1]), 4))
print(hyvarinen_loss_gauss([0, 2], 1, 1), hyvarinen_loss_gauss([0, 2], 1, 2), hyvarinen_loss_gauss([0, 2], 1, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.0 0.0 -0.5 -0.2384\n-0.5 -0.375 0.0",
          "-1.0 0.0 -0.5 -0.2384\n-0.5 -0.25 0.0",
          "1.0 0.0 -0.5 -0.2384\n-0.5 -0.375 0.0",
          "-1.0 0.0 -2.0 -0.2384\n-0.5 -0.375 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dsm_targets(x, eps, sigma):
    return x + sigma * eps, -eps / sigma

def dsm_loss(score, xs, eps, sigma):
    total = 0.0
    for x, e in zip(xs, eps):
        xt, target = dsm_targets(x, e, sigma)
        total += 0.5 * (score(xt) - target) ** 2
    return total / len(xs)

def tweedie_denoise(x_noisy, score_value, sigma):
    return x_noisy + sigma ** 2 * score_value

print(dsm_targets(1.0, 0.5, 0.2), round(tweedie_denoise(1.1, -2.5, 0.2), 4))
print(dsm_loss(lambda y: -y, [0.0, 0.0], [1.0, -1.0], 1.0), dsm_loss(lambda y: -y, [0.0, 0.0], [1.0, -1.0], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1.1, -2.5) 1.0\n0.0 1.125",
          "(1.1, 2.5) 1.0\n0.0 1.125",
          "(1.1, -2.5) 0.6\n0.0 1.125",
          "(1.1, -2.5) 1.0\n1.0 1.125",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_score(x, mu, var)</C>; <C>mixture_score(x, ws, mus, vs)</C> for a one-dimensional Gaussian mixture with
          weights ws, means mus and variances vs; and <C>hyvarinen_loss_gauss(xs, mu, var)</C>, the average of{" "}
          <M>{"s_\\theta' + \\tfrac12 s_\\theta^2"}</M> for a Gaussian model.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gaussian_score(x, mu, var):
    return x - mu

def mixture_score(x, ws, mus, vs):
    return 0.0

def hyvarinen_loss_gauss(xs, mu, var):
    return 0.0
`,
        solution: SCORES,
        tests: [
          { name: "scores", code: `assert gaussian_score(0, 2, 4) == 0.5 and mixture_score(3.0, [1.0], [1.0], [2.0]) == -1.0
v = mixture_score(0.5, [0.25, 0.75], [0.0, 2.0], [1.0, 1.0]); a, b = 0.25 * math.exp(-0.125), 0.75 * math.exp(-1.125)
assert abs(v - (a * -0.5 + b * 1.5) / (a + b)) < 1e-12` },
          { name: "hyvarinen", code: `assert abs(hyvarinen_loss_gauss([1, 3], 2, 1) + 0.5) < 1e-12 and abs(hyvarinen_loss_gauss([0], 0, 2) + 0.5) < 1e-12
xs = [0, 2, 4]; best = hyvarinen_loss_gauss(xs, 2, 8 / 3); assert best < hyvarinen_loss_gauss(xs, 2, 2) and best < hyvarinen_loss_gauss(xs, 2, 3.5) and best < hyvarinen_loss_gauss(xs, 2.4, 8 / 3)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dsm_targets(x, eps, sigma)</C>, returning the noisy point and the target; <C>dsm_loss(score, xs, eps, sigma)</C>,
          the mean of half the squared error over pairs of data points and noise values; and{" "}
          <C>tweedie_denoise(x_noisy, score_value, sigma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dsm_targets(x, eps, sigma):
    return x, eps

def dsm_loss(score, xs, eps, sigma):
    return 0.0

def tweedie_denoise(x_noisy, score_value, sigma):
    return x_noisy
`,
        solution: DSM,
        tests: [
          { name: "targets and denoising", code: `assert dsm_targets(2.0, -1.0, 0.5) == (1.5, 2.0) and tweedie_denoise(3.0, -1.5, 1.0) == 1.5 and tweedie_denoise(1.0, 4.0, 0.5) == 2.0` },
          { name: "loss", code: `assert dsm_loss(lambda y: 0.0, [0.0], [2.0], 1.0) == 2.0 and dsm_loss(lambda y: -4 * y, [0.0, 0.0], [1.0, -1.0], 0.5) == 0.0
assert dsm_loss(lambda y: 1.0, [5.0, 5.0], [0.0, 0.0], 2.0) == 0.5` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: <p>A Gaussian model is fitted to the data 0, 1 and 5 by minimising Hyvärinen&apos;s score-matching objective. What variance does it choose? Give three decimals.</p>,
      answer: { kind: "numeric", value: 4.667, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A learned score tells you which way is uphill in probability at every point. The next lesson turns that into a
        sampler: follow the score, add the right amount of noise, and the points end up distributed as the data.
      </p>
    </>
  ),
};
