import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ElboGapViz } from "@/components/viz/ElboGapViz";
import type { LessonContent } from "@/lib/types";

const VAE = `import math

def kl_std_normal(mu, logvar):
    return 0.5 * sum(math.exp(lv) + m * m - 1 - lv for m, lv in zip(mu, logvar))

def gaussian_recon_ll(x, xhat, sigma):
    return sum(-0.5 * math.log(2 * math.pi * sigma ** 2) - (a - b) ** 2 / (2 * sigma ** 2) for a, b in zip(x, xhat))

def elbo(x, xhat, mu, logvar, sigma):
    return gaussian_recon_ll(x, xhat, sigma) - kl_std_normal(mu, logvar)`;

const IWAE = `import math

def log_weights(x, m, s, log_joint, zs):
    return [log_joint(x, z) + 0.5 * math.log(2 * math.pi * s * s) + (z - m) ** 2 / (2 * s * s) for z in zs]

def elbo_estimate(lw):
    return sum(lw) / len(lw)

def iwae_bound(lw):
    top = max(lw)
    return top + math.log(sum(math.exp(v - top) for v in lw) / len(lw))`;

export const lesson: LessonContent = {
  id: "l7.3.1",
  minutes: 45,
  links: {
    requires: ["l7.1.2", "l2.5.3", "m12.2.1"],
    revisits: ["l4.2.3", "m7.4.2", "m13.1.3"],
    foreshadows: ["l7.3.2", "l7.3.3", "l12.1.1"],
  },

  puzzle: (
    <>
      <p>
        A latent-variable model with a neural decoder has a likelihood that cannot be computed, and the previous part showed
        that estimating it by sampling codes from the prior fails. Expectation-maximisation (l2.5.2) would need the exact
        posterior over codes for every training image, which is just as intractable. Yet variational autoencoders train such
        models on millions of images with ordinary gradient descent. What do they optimise instead of the likelihood, and how
        far from it are they?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train a second network, the <em>encoder</em>, to guess for each image a simple distribution over the codes that could
        have produced it. Then optimise a lower bound on the log-likelihood, the evidence lower bound, which can be estimated
        by sampling from the encoder&apos;s guess rather than from the prior. The bound is tight exactly when the guess equals
        the true posterior, so improving the encoder tightens the bound and improving the decoder raises it.
      </p>
      <p>
        The bound reads as an autoencoder&apos;s objective: reconstruct the image from a code drawn from the encoder&apos;s
        distribution, and pay a penalty for how far that distribution strays from the prior.
      </p>
      <ElboGapViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the evidence lower bound">
        <p>For any distribution q(z) with the same support as the posterior,</p>
        <MD>{"\\log p_\\theta(x) = \\underbrace{\\mathbb{E}_{q}[\\log p_\\theta(x, z) - \\log q(z)]}_{\\mathrm{ELBO}(q, \\theta)} + \\mathrm{KL}\\big(q(z) \\,\\|\\, p_\\theta(z \\mid x)\\big),"}</MD>
        <p>so the ELBO is at most <M>{"\\log p_\\theta(x)"}</M>, with equality exactly when q is the posterior.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\log p_\\theta(x, z) = \\log p_\\theta(x) + \\log p_\\theta(z \\mid x)"}</M>. Substituting into the ELBO gives{" "}
          <M>{"\\log p_\\theta(x) + \\mathbb{E}_q[\\log p_\\theta(z \\mid x) - \\log q(z)] = \\log p_\\theta(x) - \\mathrm{KL}(q \\| p_\\theta(\\cdot \\mid x))"}</M>.
          The KL divergence is non-negative and zero only when the distributions agree (m12.2.1). This is the identity of l2.5.3;
          EM alternates between setting q to the exact posterior and maximising over θ, which is impossible when the posterior
          is intractable.
        </p>
      </Proof>

      <Definition title="variational autoencoder">
        <p>
          A VAE (Kingma and Welling; Rezende, Mohamed and Wierstra, 2014) uses an <em>amortised</em> approximate posterior: an
          encoder network maps x to the mean and log-variance of a diagonal Gaussian{" "}
          <M>{"q_\\phi(z \\mid x) = \\mathcal{N}(\\mu_\\phi(x), \\operatorname{diag} \\sigma^2_\\phi(x))"}</M>, so one network serves every
          example. Splitting <M>{"p_\\theta(x, z) = p_\\theta(x \\mid z) p(z)"}</M> rewrites the bound as
        </p>
        <MD>{"\\mathrm{ELBO} = \\mathbb{E}_{q_\\phi(z \\mid x)}[\\log p_\\theta(x \\mid z)] - \\mathrm{KL}\\big(q_\\phi(z \\mid x) \\,\\|\\, p(z)\\big),"}</MD>
        <p>
          a reconstruction term and a regulariser. Both θ and φ are trained by gradient ascent on the average ELBO over the
          data.
        </p>
      </Definition>

      <Theorem title="the Gaussian terms in closed form">
        <p>For a diagonal Gaussian encoder and a standard normal prior,</p>
        <MD>{"\\mathrm{KL}\\big(\\mathcal{N}(\\mu, \\operatorname{diag}\\sigma^2) \\,\\|\\, \\mathcal{N}(0, I)\\big) = \\tfrac{1}{2} \\sum_j \\big(\\sigma_j^2 + \\mu_j^2 - 1 - \\log \\sigma_j^2\\big),"}</MD>
        <p>
          and a Gaussian decoder with fixed variance <M>{"\\sigma_x^2"}</M> gives{" "}
          <M>{"\\log p_\\theta(x \\mid z) = -\\frac{D}{2}\\log(2\\pi\\sigma_x^2) - \\|x - \\hat x\\|^2 / (2\\sigma_x^2)"}</M> with{" "}
          <M>{"\\hat x = g_\\theta(z)"}</M>, a scaled squared error (<C>kl_std_normal</C>, <C>gaussian_recon_ll</C>, <C>elbo</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Both distributions factorise over dimensions, so the KL divergence is a sum of one-dimensional terms. In one dimension,{" "}
          <M>{"\\mathbb{E}_q[\\log q] = -\\tfrac12 \\log(2\\pi\\sigma^2) - \\tfrac12"}</M> and{" "}
          <M>{"\\mathbb{E}_q[\\log p] = -\\tfrac12 \\log(2\\pi) - \\tfrac12(\\sigma^2 + \\mu^2)"}</M>, whose difference is{" "}
          <M>{"\\tfrac12(\\sigma^2 + \\mu^2 - 1 - \\log \\sigma^2)"}</M>. The decoder term is the Gaussian log-density summed over
          the D output dimensions.
        </p>
        <Code>{VAE}</Code>
      </Proof>

      <Remark title="what the gap means">
        <p>
          The gap between log-likelihood and ELBO has two sources: the encoder family may not contain the true posterior (a
          diagonal Gaussian cannot be skewed or multimodal), and the amortised encoder may not find the best member for each x.
          Maximising the ELBO over φ shrinks the gap without changing the likelihood; maximising over θ can raise the
          likelihood or shrink the gap by making the true posterior easier to fit, so a VAE&apos;s decoder is biased towards
          models with simple posteriors.
        </p>
      </Remark>

      <Definition title="importance-weighted bound">
        <p>
          With K samples <M>{"z_k \\sim q"}</M> and log-weights <M>{"\\log w_k = \\log p_\\theta(x, z_k) - \\log q(z_k)"}</M> (<C>log_weights</C>),
          the ELBO is estimated by their mean (<C>elbo_estimate</C>). The importance-weighted bound (Burda,
          Grosse and Salakhutdinov, 2016) is <M>{"\\mathbb{E}[\\log \\tfrac{1}{K}\\sum_k w_k]"}</M> (<C>iwae_bound</C>). By Jensen&apos;s
          inequality (m7.4.2) it lies between the ELBO and <M>{"\\log p_\\theta(x)"}</M>, rises with K and tends to{" "}
          <M>{"\\log p_\\theta(x)"}</M>. With a good encoder as proposal it is the importance-sampling estimate of l7.1.2
          (m13.1.3), and it is how VAE likelihoods are reported.
        </p>
        <Code>{IWAE}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "kl",
      rung: "check",
      prompt: <p>An encoder outputs mean 1 and standard deviation 0.5 for a one-dimensional code. What is the KL divergence to N(0, 1) in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8181, tolerance: 0.0001 },
    },
    {
      key: "posterior",
      rung: "check",
      prompt: <p>In the model z ~ N(0, 1), x | z ~ N(2z, 1), what is the variance of the true posterior p(z | x)?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "encoder",
      rung: "apply",
      prompt: <p>What does increasing the ELBO with respect to the encoder parameters alone achieve?</p>,
      answer: {
        kind: "choice",
        options: [
          "It reduces the KL divergence from q to the true posterior, tightening the bound without changing log p(x)",
          "It increases log p(x)",
          "It makes the decoder reconstruct more sharply",
          "It increases the KL divergence from q to the prior without any effect on the bound",
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

def kl_std_normal(mu, logvar):
    return 0.5 * sum(math.exp(lv) + m * m - 1 - lv for m, lv in zip(mu, logvar))

def gaussian_recon_ll(x, xhat, sigma):
    return sum(-0.5 * math.log(2 * math.pi * sigma ** 2) - (a - b) ** 2 / (2 * sigma ** 2) for a, b in zip(x, xhat))

def elbo(x, xhat, mu, logvar, sigma):
    return gaussian_recon_ll(x, xhat, sigma) - kl_std_normal(mu, logvar)

print(kl_std_normal([0, 0], [0, 0]), kl_std_normal([1], [0]), round(kl_std_normal([0], [math.log(4)]), 4))
print(round(gaussian_recon_ll([1], [1], 1), 4), round(elbo([1, 2], [1, 1], [1], [0], 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.5 0.8069\n-0.9189 -2.8379",
          "0.0 1.0 0.8069\n-0.9189 -2.8379",
          "0.0 0.5 0.8069\n-0.9189 -1.8379",
          "0.0 0.5 1.5\n-0.9189 -2.8379",
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

def log_weights(x, m, s, log_joint, zs):
    return [log_joint(x, z) + 0.5 * math.log(2 * math.pi * s * s) + (z - m) ** 2 / (2 * s * s) for z in zs]

def elbo_estimate(lw):
    return sum(lw) / len(lw)

def iwae_bound(lw):
    top = max(lw)
    return top + math.log(sum(math.exp(v - top) for v in lw) / len(lw))

lj = lambda x, z: -math.log(2 * math.pi) - z * z / 2 - (x - z) ** 2 / 2; lw = log_weights(0.0, 0.0, 0.5 ** 0.5, lj, [-1, 0, 1]); print([round(v, 4) for v in lw])
lw = log_weights(0.0, 0.0, 1.0, lj, [-1.5, 0, 1.5]); print(round(elbo_estimate(lw), 4), round(iwae_bound(lw), 4), round(-0.5 * math.log(4 * math.pi), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1.2655, -1.2655, -1.2655]\n-1.6689 -1.5172 -1.2655",
          "[-1.7655, -1.2655, -1.7655]\n-1.6689 -1.5172 -1.2655",
          "[-1.2655, -1.2655, -1.2655]\n-1.5172 -1.6689 -1.2655",
          "[-1.2655, -1.2655, -1.2655]\n-1.6689 -1.1689 -1.2655",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_std_normal(mu, logvar)</C> for a diagonal Gaussian, <C>gaussian_recon_ll(x, xhat, sigma)</C> summed over
          dimensions, and <C>elbo(x, xhat, mu, logvar, sigma)</C> for a single decoded sample.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def kl_std_normal(mu, logvar):
    return 0.0

def gaussian_recon_ll(x, xhat, sigma):
    return -sum((a - b) ** 2 for a, b in zip(x, xhat))

def elbo(x, xhat, mu, logvar, sigma):
    return gaussian_recon_ll(x, xhat, sigma)
`,
        solution: VAE,
        tests: [
          { name: "kl", code: `assert kl_std_normal([0], [0]) == 0 and abs(kl_std_normal([2, 0], [0, 0]) - 2) < 1e-12 and abs(kl_std_normal([0], [1]) - 0.5 * (math.e - 2)) < 1e-12` },
          { name: "recon and elbo", code: `assert abs(gaussian_recon_ll([0, 0], [0, 0], 1) + math.log(2 * math.pi)) < 1e-12 and abs(gaussian_recon_ll([3], [1], 2) + 0.5 * math.log(8 * math.pi) + 0.5) < 1e-12
assert abs(elbo([3], [1], [2, 0], [0, 0], 2) - (gaussian_recon_ll([3], [1], 2) - 2)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For q = N(m, s²) and a function <C>log_joint(x, z)</C>, write <C>log_weights(x, m, s, log_joint, zs)</C>, the values of{" "}
          <M>{"\\log p(x, z) - \\log q(z)"}</M> at the codes zs; <C>elbo_estimate(lw)</C>; and a numerically stable{" "}
          <C>iwae_bound(lw)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def log_weights(x, m, s, log_joint, zs):
    return [log_joint(x, z) for z in zs]

def elbo_estimate(lw):
    return max(lw)

def iwae_bound(lw):
    return sum(lw) / len(lw)
`,
        solution: IWAE,
        tests: [
          { name: "weights", code: `lw = log_weights(1.0, 0.0, 1.0, lambda x, z: 0.0, [0.0, 1.0])
assert abs(lw[0] - 0.5 * math.log(2 * math.pi)) < 1e-12 and abs(lw[1] - 0.5 * math.log(2 * math.pi) - 0.5) < 1e-12
assert abs(log_weights(0, 2.0, 0.5, lambda x, z: -z, [2.0])[0] - (-2 + 0.5 * math.log(2 * math.pi * 0.25))) < 1e-12` },
          { name: "bounds", code: `assert abs(elbo_estimate([-1.0, -3.0]) + 2) < 1e-12 and abs(iwae_bound([-1.0, -3.0]) - math.log((math.exp(-1) + math.exp(-3)) / 2)) < 1e-12
assert abs(iwae_bound([-1000.0, -1000.0]) + 1000) < 1e-9 and abs(iwae_bound([-2.0]) + 2) < 1e-12` },
        ],
      },
    },
    {
      key: "gap",
      rung: "stretch",
      prompt: (
        <p>
          In the model z ~ N(0, 1), x | z ~ N(z, 1), with x = 2 observed, an encoder proposes q = N(0.5, 1). By how many nats
          does the ELBO fall short of log p(x)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.403, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The ELBO is an expectation over q, and q depends on the encoder&apos;s parameters. Differentiating through a sampling
        step is the problem the next lesson solves with the reparameterisation trick.
      </p>
    </>
  ),
};
