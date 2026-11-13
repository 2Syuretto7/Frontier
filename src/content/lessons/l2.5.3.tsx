import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ElboGapViz } from "@/components/viz/ElboGapViz";
import type { LessonContent } from "@/lib/types";

const ELBO = `import numpy as np

def log_evidence(x, noise):
    v = 1 + noise
    return float(-0.5 * np.log(2 * np.pi * v) - x ** 2 / (2 * v))

def elbo(x, noise, m, s):
    exp_lik = -0.5 * np.log(2 * np.pi * noise) - ((x - m) ** 2 + s ** 2) / (2 * noise)
    kl_prior = 0.5 * (m ** 2 + s ** 2 - 1) - np.log(s)
    return float(exp_lik - kl_prior)

def kl_normal(m1, s1, m2, s2):
    return float(np.log(s2 / s1) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2) - 0.5)`;

const VI = `import numpy as np

def elbo_mc(x, noise, m, s, n=100000, seed=0):
    z = m + s * np.random.default_rng(seed).normal(size=n)
    log_joint = -0.5 * np.log(2 * np.pi) - z ** 2 / 2 - 0.5 * np.log(2 * np.pi * noise) - (x - z) ** 2 / (2 * noise)
    return float(log_joint.mean() + 0.5 * np.log(2 * np.pi * np.e * s ** 2))

def fit_q(x, noise, steps=2000, lr=0.05):
    m, log_s = 0.0, 0.0
    for _ in range(steps):
        s = np.exp(log_s)
        m, log_s = m + lr * ((x - m) / noise - m), log_s + lr * (1 - s ** 2 - s ** 2 / noise)
    return round(float(m), 4), round(float(np.exp(log_s)), 4)`;

export const lesson: LessonContent = {
  id: "l2.5.3",
  minutes: 60,
  links: {
    requires: ["l2.5.2", "l2.1.1"],
    revisits: ["m9.7.1", "m7.4.2"],
    foreshadows: ["l2.7.3"],
  },

  puzzle: (
    <>
      <p>
        For most latent-variable models the posterior over hidden variables, p(z | x), has a normalising constant p(x)
        that is an intractable sum or integral. Yet variational autoencoders and topic models are trained by maximising
        something closely tied to log p(x), using only samples from a simple distribution. What quantity can you compute
        that stands in for the log-likelihood you cannot?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pick any distribution q over the hidden variables. The expected log of p(x, z)/q(z) under q is a lower bound on
        log p(x), and the amount by which it falls short is exactly how far q is from the true posterior, measured by KL
        divergence. So raising the bound does two useful things at once: it pushes the model&apos;s evidence up and it
        pulls q towards the posterior.
      </p>
      <ElboGapViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the ELBO decomposition">
        <p>For any distribution q(z) that is positive wherever p(z | x) is,</p>
        <MD>{"\\log p(x) = \\underbrace{\\mathbb E_q\\big[\\log p(x, z) - \\log q(z)\\big]}_{\\mathrm{ELBO}(q)} + \\mathrm{KL}\\big(q(z)\\,\\|\\,p(z \\mid x)\\big)."}</MD>
        <p>Hence ELBO(q) ≤ log p(x), with equality exactly when q is the posterior.</p>
      </Theorem>
      <Proof>
        <p>
          For every z, <M>{"\\log p(x) = \\log p(x, z) - \\log p(z \\mid x)"}</M>. Add and subtract{" "}
          <M>{"\\log q(z)"}</M> and take expectations under q:{" "}
          <M>{"\\log p(x) = \\mathbb E_q[\\log p(x, z) - \\log q(z)] + \\mathbb E_q[\\log q(z) - \\log p(z \\mid x)]"}</M>. The
          second term is the KL divergence, which is non-negative and zero only when the two distributions agree, by the
          same Jensen argument that showed the expected log loss is minimised by the truth.
        </p>
      </Proof>
      <Remark title="two readings of the ELBO">
        <p>
          Splitting <M>{"\\log p(x, z) = \\log p(x \\mid z) + \\log p(z)"}</M> gives{" "}
          <M>{"\\mathrm{ELBO} = \\mathbb E_q\\log p(x \\mid z) - \\mathrm{KL}(q(z)\\,\\|\\,p(z))"}</M>: reconstruct the data
          well, while staying close to the prior. EM is coordinate ascent on the ELBO: the E-step sets q to the exact
          posterior, closing the gap, and the M-step raises the ELBO in the model parameters with q held fixed, which is the
          proof of the previous lesson in this language.
        </p>
      </Remark>

      <Example title="a model where everything is known">
        <p>
          Let <M>{"z \\sim N(0, 1)"}</M> and <M>{"x \\mid z \\sim N(z, \\sigma^2)"}</M>. Then{" "}
          <M>{"p(x) = N(x; 0, 1 + \\sigma^2)"}</M> and the posterior is{" "}
          <M>{"N\\big(\\frac{x}{1 + \\sigma^2}, \\frac{\\sigma^2}{1 + \\sigma^2}\\big)"}</M>. For{" "}
          <M>{"q = N(m, s^2)"}</M> both parts of the ELBO have closed forms. With x = 2 and σ² = 1: log p(x) = −2.2655, the
          ELBO at the posterior is also −2.2655, and the ELBO of q = N(0, 1) is −3.4189. The difference, 1.1534, equals{" "}
          <M>{"\\mathrm{KL}(N(0, 1)\\,\\|\\,N(1, \\tfrac12))"}</M>, as the theorem demands.
        </p>
        <Code>{ELBO}</Code>
      </Example>

      <Theorem title="the reparameterisation gradient">
        <p>
          If <M>{"z = m + s\\varepsilon"}</M> with <M>{"\\varepsilon \\sim N(0, 1)"}</M>, then for differentiable f,{" "}
          <M>{"\\nabla_{m, s}\\,\\mathbb E_q f(z) = \\mathbb E_\\varepsilon\\big[\\nabla_{m, s} f(m + s\\varepsilon)\\big]"}</M>,
          which can be estimated by averaging over samples of ε.
        </p>
      </Theorem>
      <Proof>
        <p>
          The expectation over q equals <M>{"\\mathbb E_\\varepsilon f(m + s\\varepsilon)"}</M>, and the distribution of ε
          does not depend on (m, s), so the gradient passes inside the expectation (under the usual integrability
          conditions that justify differentiating under the integral sign).
        </p>
      </Proof>
      <Remark title="variational inference">
        <p>
          When the posterior is intractable, restrict q to a tractable family, such as Gaussians with diagonal covariance or
          a product of independent factors (mean field), and maximise the ELBO over that family by stochastic gradients. The
          code estimates the ELBO by sampling and fits (m, s) by gradient ascent, recovering the exact posterior N(1, 0.707²)
          because it lies in the family. When it does not, minimising <M>{"\\mathrm{KL}(q\\,\\|\\,p)"}</M> makes q avoid regions
          where p is small: faced with a two-humped posterior, a Gaussian q settles on one hump and understates the
          uncertainty.
        </p>
        <Code>{VI}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gap",
      rung: "check",
      prompt: <p>A model has log p(x) = −2.27 and a variational distribution achieves ELBO = −3.42. What is KL(q ‖ p(z | x))?</p>,
      answer: { kind: "numeric", value: 1.15, tolerance: 0.001 },
    },
    {
      key: "kl",
      rung: "check",
      prompt: <p>What is KL(N(0, 1) ‖ N(1, 1))?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "mode",
      rung: "apply",
      prompt: <p>The true posterior has two well-separated modes. What does a single Gaussian q found by maximising the ELBO typically do?</p>,
      answer: {
        kind: "choice",
        options: [
          "It concentrates on one mode and underestimates the spread",
          "It covers both modes with a wide variance",
          "It places its mean between the modes where the posterior is small",
          "It recovers the exact posterior",
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

def log_evidence(x, noise):
    v = 1 + noise
    return float(-0.5 * np.log(2 * np.pi * v) - x ** 2 / (2 * v))

def elbo(x, noise, m, s):
    exp_lik = -0.5 * np.log(2 * np.pi * noise) - ((x - m) ** 2 + s ** 2) / (2 * noise)
    kl_prior = 0.5 * (m ** 2 + s ** 2 - 1) - np.log(s)
    return float(exp_lik - kl_prior)

def kl_normal(m1, s1, m2, s2):
    return float(np.log(s2 / s1) + (s1 ** 2 + (m1 - m2) ** 2) / (2 * s2 ** 2) - 0.5)

x, noise = 2.0, 1.0; pm, ps = x / (1 + noise), np.sqrt(noise / (1 + noise))
print(round(log_evidence(x, noise), 4), round(elbo(x, noise, pm, ps), 4), round(elbo(x, noise, 0.0, 1.0), 4))
print(round(log_evidence(x, noise) - elbo(x, noise, 0.0, 1.0), 4), round(kl_normal(0.0, 1.0, pm, ps), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-2.2655 -2.2655 -3.4189\n1.1534 1.1534", "-2.2655 -2.2655 -3.4189\n1.1534 0.5", "-2.2655 -3.4189 -2.2655\n1.1534 1.1534", "-2.2655 -2.0 -3.4189\n1.1534 1.1534"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def elbo_mc(x, noise, m, s, n=100000, seed=0):
    z = m + s * np.random.default_rng(seed).normal(size=n)
    log_joint = -0.5 * np.log(2 * np.pi) - z ** 2 / 2 - 0.5 * np.log(2 * np.pi * noise) - (x - z) ** 2 / (2 * noise)
    return float(log_joint.mean() + 0.5 * np.log(2 * np.pi * np.e * s ** 2))

def fit_q(x, noise, steps=2000, lr=0.05):
    m, log_s = 0.0, 0.0
    for _ in range(steps):
        s = np.exp(log_s)
        m, log_s = m + lr * ((x - m) / noise - m), log_s + lr * (1 - s ** 2 - s ** 2 / noise)
    return round(float(m), 4), round(float(np.exp(log_s)), 4)

x, noise = 2.0, 1.0; pm, ps = x / (1 + noise), np.sqrt(noise / (1 + noise))
print(round(elbo_mc(x, noise, 0.0, 1.0), 3), round(elbo_mc(x, noise, pm, ps), 3))
print(fit_q(x, noise), round(float(ps), 4))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-3.421 -2.266\n(1.0, 0.7071) 0.7071", "-2.266 -3.421\n(1.0, 0.7071) 0.7071", "-3.421 -2.266\n(2.0, 1.0) 0.7071", "-3.421 -2.266\n(1.0, 0.5) 0.7071"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For z ~ N(0, 1) and x | z ~ N(z, noise), write <C>log_evidence(x, noise)</C>, <C>elbo(x, noise, m, s)</C> for
          q = N(m, s²) in closed form, and <C>kl_normal(m1, s1, m2, s2)</C>, the KL divergence between univariate normals
          given standard deviations. All return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_evidence(x, noise):
    return 0.0

def elbo(x, noise, m, s):
    return 0.0

def kl_normal(m1, s1, m2, s2):
    return 0.0
`,
        solution: ELBO,
        tests: [
          { name: "kl", code: `assert abs(kl_normal(0, 1, 1, 1) - 0.5) < 1e-12 and abs(kl_normal(0, 1, 0, 2) - (np.log(2) + 1 / 8 - 0.5)) < 1e-12 and kl_normal(3, 2, 3, 2) == 0.0` },
          { name: "gap", code: `x, nz = -1.0, 0.5; pm, ps = x / 1.5, np.sqrt(0.5 / 1.5)
assert abs(elbo(x, nz, pm, ps) - log_evidence(x, nz)) < 1e-12 and abs(log_evidence(x, nz) - elbo(x, nz, 0.3, 0.9) - kl_normal(0.3, 0.9, pm, ps)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>elbo_mc(x, noise, m, s, n=100000, seed=0)</C>, a Monte Carlo ELBO using reparameterised samples z = m + sε
          and the exact entropy of q, and <C>fit_q(x, noise, steps=2000, lr=0.05)</C>, gradient ascent on the exact ELBO in m
          and log s from (0, 0), returning (m, s) rounded to 4 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def elbo_mc(x, noise, m, s, n=100000, seed=0):
    return 0.0

def fit_q(x, noise, steps=2000, lr=0.05):
    return 0.0, 1.0
`,
        solution: VI,
        tests: [
          { name: "mc", code: `exact = -0.5 * np.log(2 * np.pi * 2.0) - 1.0
assert abs(elbo_mc(2.0, 1.0, 1.0, np.sqrt(0.5)) - exact) < 0.01` },
          { name: "fit", code: `m, s = fit_q(3.0, 2.0)
assert abs(m - 1.0) < 1e-3 and abs(s - np.sqrt(2 / 3)) < 1e-3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that log p(x) = E_q[log p(x, z) − log q(z)] + KL(q(z) ‖ p(z | x)) for any q positive where the posterior is, and conclude that the first term is a lower bound on log p(x).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes log p(x) = log p(x, z) − log p(z | x) for each z, which holds by the definition of conditional probability.",
          "Adds and subtracts log q(z) and takes the expectation under q, identifying the second part as the KL divergence.",
          "Uses KL ≥ 0 to conclude the ELBO is at most log p(x), with equality when q equals the posterior.",
        ],
      },
    },
    {
      key: "kl2",
      rung: "stretch",
      prompt: <p>What is KL(N(0, 1) ‖ N(0, 2²))? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3181, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how the ELBO is defined, why log-likelihood equals the ELBO plus a KL divergence, how EM and variational inference both maximise it, and how the reparameterisation trick gives low-variance gradients.",

  glimpse: (
    <>
      <p>
        Mixtures have one hidden variable per point, independent of the others. In sequences, hidden states follow one
        another in a chain. The next lesson shows that exact inference is still possible there, by dynamic programming:
        the forward-backward algorithm for hidden Markov models.
      </p>
    </>
  ),
};
