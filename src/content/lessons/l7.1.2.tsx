import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarginalEstimateViz } from "@/components/viz/MarginalEstimateViz";
import type { LessonContent } from "@/lib/types";

const LATENT = `import math

def log_normal(x, mu, var):
    return -0.5 * math.log(2 * math.pi * var) - (x - mu) ** 2 / (2 * var)

def logsumexp(vs):
    m = max(vs)
    if m == -math.inf:
        return m
    return m + math.log(sum(math.exp(v - m) for v in vs))

def mc_log_marginal(x, g, sigma, zs):
    return logsumexp([log_normal(x, g(z), sigma ** 2) for z in zs]) - math.log(len(zs))`;

const IMPLICIT = `import math

def push(g, zs):
    return [g(z) for z in zs]

def kernel(a, b, h):
    return math.exp(-(a - b) ** 2 / (2 * h * h))

def mmd2(xs, ys, h):
    kxx = sum(kernel(a, b, h) for a in xs for b in xs) / len(xs) ** 2
    kyy = sum(kernel(a, b, h) for a in ys for b in ys) / len(ys) ** 2
    kxy = sum(kernel(a, b, h) for a in xs for b in ys) / (len(xs) * len(ys))
    return kxx + kyy - 2 * kxy`;

export const lesson: LessonContent = {
  id: "l7.1.2",
  minutes: 45,
  links: {
    requires: ["l7.1.1", "m13.1.3"],
    revisits: ["m11.2.3", "m13.1.1"],
    foreshadows: ["l7.3.1", "l7.4.1", "l7.5.1", "l7.6.1"],
  },

  puzzle: (
    <>
      <p>
        Here is a recipe for a generator of faces: draw a hundred numbers from a standard Gaussian and pass them through a
        large neural network that outputs an image. Sampling is one forward pass. Now someone hands you a photograph and asks
        how probable it is under your generator. Which hundred numbers produced it? Possibly none; possibly many. The recipe
        that makes sampling trivial seems to make the likelihood unreachable. Must a generative model choose between the two?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Generative models split according to what they let you compute. Some give the likelihood exactly, by building the
        distribution from pieces whose probabilities multiply (autoregressive models) or by using an invertible map whose
        effect on volume is known (flows). Some give only a bound on it (variational autoencoders) or give it up to an unknown
        constant (energy-based models). Some give nothing but samples (GANs), and must be trained and judged by comparing
        samples with data.
      </p>
      <p>
        The face recipe is a <em>latent-variable model</em>. If the network adds a little noise to its output, the
        likelihood is an average over all hidden codes of how well each code explains the image. Averaging by sampling codes at
        random works badly: almost every code explains a given image terribly, and the few that explain it well are rarely
        drawn. The less noise, the worse it gets.
      </p>
      <MarginalEstimateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="latent-variable model">
        <p>
          A latent-variable model draws a code <M>{"z \\sim p(z)"}</M>, usually a standard Gaussian, and then{" "}
          <M>{"x \\sim p_\\theta(x \\mid z)"}</M>, for example <M>{"\\mathcal{N}(g_\\theta(z), \\sigma^2 I)"}</M> with a neural
          network <M>{"g_\\theta"}</M>. Its likelihood is the marginal
        </p>
        <MD>{"p_\\theta(x) = \\int p_\\theta(x \\mid z)\\, p(z)\\, dz = \\mathbb{E}_{z \\sim p(z)}[p_\\theta(x \\mid z)],"}</MD>
        <p>
          an integral with no closed form when <M>{"g_\\theta"}</M> is a network. Sampling is easy (ancestral sampling, l7.1.1);
          evaluation is not. The plain Monte Carlo estimate averages <M>{"p_\\theta(x \\mid z_k)"}</M> over K prior draws, computed
          in log space with log-sum-exp to avoid underflow (m11.2.3, <C>mc_log_marginal</C>).
        </p>
        <Code>{LATENT}</Code>
      </Definition>

      <Theorem title="the log of an unbiased estimate is biased low">
        <p>
          Let <M>{"\\hat p_K = \\frac{1}{K} \\sum_k p_\\theta(x \\mid z_k)"}</M> with <M>{"z_k"}</M> drawn independently from p(z).
          Then <M>{"\\mathbb{E}[\\hat p_K] = p_\\theta(x)"}</M>, but <M>{"\\mathbb{E}[\\log \\hat p_K] \\le \\log p_\\theta(x)"}</M>, with equality
          only if <M>{"\\hat p_K"}</M> is constant.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each term has expectation <M>{"\\int p_\\theta(x \\mid z) p(z) dz = p_\\theta(x)"}</M>, so the average does too. The
          logarithm is strictly concave, so Jensen&apos;s inequality gives{" "}
          <M>{"\\mathbb{E}[\\log \\hat p_K] \\le \\log \\mathbb{E}[\\hat p_K] = \\log p_\\theta(x)"}</M>, with equality exactly when{" "}
          <M>{"\\hat p_K"}</M> is almost surely constant. So a model scored by such estimates looks worse than it is, by an amount
          that falls as K grows and as the estimate&apos;s variance falls.
        </p>
      </Proof>

      <Remark title="why prior sampling fails">
        <p>
          The variance is the problem. Only codes near those that could have produced x contribute, and their prior probability
          shrinks with the noise level σ and, in high dimensions, exponentially with the dimension. Importance sampling (m13.1.3)
          fixes this by drawing z from a proposal <M>{"q(z \\mid x)"}</M> concentrated where <M>{"p(z \\mid x)"}</M> is large. Learning
          such a proposal alongside the model is the idea of the variational autoencoder (l7.3.1).
        </p>
      </Remark>

      <Definition title="implicit model">
        <p>
          An <em>implicit</em> model is a sampler with no density: <M>{"x = g_\\theta(z)"}</M>, <M>{"z \\sim p(z)"}</M>, with no added
          noise. Its distribution is the <em>pushforward</em> of p(z) through <M>{"g_\\theta"}</M> (<C>push</C>). If z has fewer
          dimensions than x, every sample lies on the image of <M>{"g_\\theta"}</M>, a surface of lower dimension that has zero
          volume, so the distribution has no density with respect to volume and the likelihood of real data is undefined.
          (If <M>{"g_\\theta"}</M> is invertible and smooth with equal dimensions there is a density, which is how flows work, l7.4.1.)
        </p>
      </Definition>

      <Definition title="comparing with samples">
        <p>
          Without densities, a model is trained and judged by a <em>two-sample</em> discrepancy between its samples and the data.
          The <em>maximum mean discrepancy</em> with kernel k is
        </p>
        <MD>{"\\mathrm{MMD}^2 = \\mathbb{E}[k(x, x')] + \\mathbb{E}[k(y, y')] - 2\\,\\mathbb{E}[k(x, y)],"}</MD>
        <p>
          with x, x′ independent draws from one distribution and y, y′ from the other, estimated by averaging over all pairs of
          samples (<C>mmd2</C>). For the Gaussian kernel{" "}
          <M>{"k(a, b) = e^{-(a - b)^2 / 2h^2}"}</M> it is zero exactly when the two distributions are equal. GANs (l7.5.1) replace a
          fixed kernel by a learned classifier that tries to tell samples from data.
        </p>
        <Code>{IMPLICIT}</Code>
      </Definition>

      <Remark title="a map of the course">
        <p>
          Autoregressive models (Part 2) and flows (Part 4) give exact likelihoods, at the price of sequential sampling or
          invertible architectures. VAEs (Part 3) give a lower bound and fast sampling. GANs (Part 5) give fast, sharp samples
          and no likelihood. Energy-based and score models (Part 6) give an unnormalised density or its gradient, and sample by
          iterative procedures. Diffusion models (l12.1.1) combine ideas from several of these.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "marginal",
      rung: "check",
      prompt: (
        <p>
          A latent-variable model draws z from N(0, 1) and outputs x = z plus independent noise from N(0, 0.25). What is the
          density p(0)? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3568, tolerance: 0.0001 },
    },
    {
      key: "jensen",
      rung: "check",
      prompt: (
        <p>
          An unbiased estimator of p(x) = 0.2 returns 0.1 or 0.3 with equal probability. What is the expected value of the log of
          the estimate minus log p(x)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.144, tolerance: 0.001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which model families give an exact log-likelihood that can be maximised directly?</p>,
      answer: {
        kind: "choice",
        options: [
          "Autoregressive models and normalising flows",
          "GANs and variational autoencoders",
          "Energy-based models and GANs",
          "Any latent-variable model with a neural decoder",
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

def log_normal(x, mu, var):
    return -0.5 * math.log(2 * math.pi * var) - (x - mu) ** 2 / (2 * var)

def logsumexp(vs):
    m = max(vs)
    if m == -math.inf:
        return m
    return m + math.log(sum(math.exp(v - m) for v in vs))

def mc_log_marginal(x, g, sigma, zs):
    return logsumexp([log_normal(x, g(z), sigma ** 2) for z in zs]) - math.log(len(zs))

print(round(log_normal(0, 0, 1), 4), round(logsumexp([0, 0]), 4), logsumexp([-math.inf, -math.inf]))
print(round(mc_log_marginal(1.0, lambda z: z, 1.0, [0.0, 2.0]), 4), round(mc_log_marginal(0.0, lambda z: 2 * z, 0.1, [0.0, 1.0]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.9189 0.6931 -inf\n-1.4189 0.6905",
          "-0.9189 0.0 -inf\n-1.4189 0.6905",
          "-0.9189 0.6931 -inf\n-1.4189 1.3836",
          "-0.9189 0.6931 -inf\n-0.9189 0.6905",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def push(g, zs):
    return [g(z) for z in zs]

def kernel(a, b, h):
    return math.exp(-(a - b) ** 2 / (2 * h * h))

def mmd2(xs, ys, h):
    kxx = sum(kernel(a, b, h) for a in xs for b in xs) / len(xs) ** 2
    kyy = sum(kernel(a, b, h) for a in ys for b in ys) / len(ys) ** 2
    kxy = sum(kernel(a, b, h) for a in xs for b in ys) / (len(xs) * len(ys))
    return kxx + kyy - 2 * kxy

print(push(lambda z: z * z, [1, -2, 3]), kernel(0, 0, 1), round(kernel(0, 2, 1), 4))
print(mmd2([0], [0], 1), round(mmd2([0], [2], 1), 4), round(mmd2([0, 2], [2, 0], 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 4, 9] 1.0 0.1353\n0.0 1.7293 0.0",
          "[1, 4, 9] 1.0 0.1353\n0.0 1.7293 1.7293",
          "[1, 4, 9] 0.0 0.1353\n0.0 1.7293 0.0",
          "[1, 4, 9] 1.0 0.1353\n0.0 0.8647 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_normal(x, mu, var)</C>, a stable <C>logsumexp(vs)</C> that returns <C>-math.inf</C> when every value is{" "}
          <C>-math.inf</C>, and <C>mc_log_marginal(x, g, sigma, zs)</C>, the log of the average of{" "}
          <M>{"\\mathcal{N}(x; g(z), \\sigma^2)"}</M> over the codes zs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_normal(x, mu, var):
    return 0.0

def logsumexp(vs):
    return math.log(sum(math.exp(v) for v in vs))

def mc_log_marginal(x, g, sigma, zs):
    return 0.0
`,
        solution: LATENT,
        tests: [
          { name: "log_normal and logsumexp", code: `assert abs(log_normal(1, 1, 1) + 0.5 * math.log(2 * math.pi)) < 1e-9 and abs(log_normal(2, 0, 4) + 0.5 * math.log(8 * math.pi) + 0.5) < 1e-9
assert abs(logsumexp([1000, 1000]) - 1000 - math.log(2)) < 1e-9 and logsumexp([-math.inf, -math.inf]) == -math.inf and abs(logsumexp([-1000, 0]) - 0) < 1e-9` },
          { name: "marginal", code: `assert abs(mc_log_marginal(3.0, lambda z: z, 1.0, [3.0]) - log_normal(0, 0, 1)) < 1e-9
v = mc_log_marginal(0.0, lambda z: z, 1.0, [0.0, 0.0, 1.0]); assert abs(v - math.log((2 * math.exp(log_normal(0, 0, 1)) + math.exp(log_normal(0, 1, 1))) / 3)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>push(g, zs)</C>, the samples of the implicit model with generator g; the Gaussian <C>kernel(a, b, h)</C>; and{" "}
          <C>mmd2(xs, ys, h)</C>, the estimate of the squared maximum mean discrepancy that averages over all pairs, including
          each point with itself.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def push(g, zs):
    return list(zs)

def kernel(a, b, h):
    return 0.0

def mmd2(xs, ys, h):
    return 0.0
`,
        solution: IMPLICIT,
        tests: [
          { name: "push and kernel", code: `assert push(lambda z: 2 * z + 1, [0, 1]) == [1, 3] and kernel(1, 1, 3) == 1.0 and abs(kernel(0, 1, 1) - math.exp(-0.5)) < 1e-12
assert abs(kernel(0, 2, 2) - math.exp(-0.5)) < 1e-12` },
          { name: "mmd", code: `assert abs(mmd2([0, 1], [1, 0], 1)) < 1e-12 and abs(mmd2([0], [1], 1) - (2 - 2 * math.exp(-0.5))) < 1e-12
v = mmd2([0, 0], [0, 5], 1); assert abs(v - (1 + (1 + math.exp(-12.5)) / 2 - 2 * (1 + math.exp(-12.5)) / 2)) < 1e-12 and v > 0.49` },
        ],
      },
    },
    {
      key: "push",
      rung: "stretch",
      prompt: (
        <p>
          An implicit model draws z from N(0, 1) and outputs x = 2z + 1, with no noise. This map is invertible, so the model
          does have a density. What is log p(1)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -1.612, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If likelihoods can be hard to compute, how are generative models compared at all? The next lesson covers held-out
        likelihood in bits per dimension, sample-based scores such as FID, and why no single number settles the question.
      </p>
    </>
  ),
};
