import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradEstimatorViz } from "@/components/viz/GradEstimatorViz";
import type { LessonContent } from "@/lib/types";

const GRADS = `def pathwise_grads(f_prime, mu, sigma, eps):
    gm = sum(f_prime(mu + sigma * e) for e in eps) / len(eps)
    gs = sum(f_prime(mu + sigma * e) * e for e in eps) / len(eps)
    return gm, gs

def score_grads(f, mu, sigma, eps, baseline=0.0):
    gm = sum((f(mu + sigma * e) - baseline) * e / sigma for e in eps) / len(eps)
    gs = sum((f(mu + sigma * e) - baseline) * (e * e - 1) / sigma for e in eps) / len(eps)
    return gm, gs

def sample_var(xs):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)`;

const GUMBEL = `import math

def gumbel(u):
    return -math.log(-math.log(u))

def gumbel_softmax(logits, us, tau):
    ys = [(l + gumbel(u)) / tau for l, u in zip(logits, us)]
    m = max(ys)
    es = [math.exp(y - m) for y in ys]
    return [e / sum(es) for e in es]

def argmax_sample(logits, us):
    ys = [l + gumbel(u) for l, u in zip(logits, us)]
    return ys.index(max(ys))`;

export const lesson: LessonContent = {
  id: "l7.3.2",
  minutes: 45,
  links: {
    requires: ["l7.3.1", "m13.2.4", "m13.6.1"],
    revisits: ["m13.6.2", "m13.6.3", "m13.2.3"],
    foreshadows: ["l7.3.4", "l7.6.2"],
  },

  puzzle: (
    <>
      <p>
        The ELBO is an average over codes drawn from the encoder&apos;s distribution, and that distribution is what the encoder
        controls. Backpropagation needs a derivative of the loss with respect to the encoder&apos;s outputs, but in the middle
        of the computation sits a random draw, and the derivative of a random number with respect to the mean it was drawn
        with is not obviously defined. How do VAEs get gradients through the sampling step, and why does the way they do it
        matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Move the randomness out of the way. Draw noise ε from a fixed standard normal and set{" "}
        <M>{"z = \\mu + \\sigma \\varepsilon"}</M>. Now z is an ordinary differentiable function of μ and σ, with ε an input like
        any other, and backpropagation goes straight through. This is the reparameterisation trick of m13.2.4 put to work.
      </p>
      <p>
        The alternative, the score-function estimator (m13.6.1), never differentiates the loss at all; it weights the loss by
        how the sample&apos;s log-probability changes. It is unbiased too, but it sees only the value of the loss, not its slope,
        and its noise can be hundreds of times larger.
      </p>
      <GradEstimatorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the pathwise gradient">
        <p>For z = μ + σε with ε ~ N(0, 1) and differentiable f,</p>
        <MD>{"\\frac{\\partial}{\\partial \\mu} \\mathbb{E}[f(z)] = \\mathbb{E}[f'(\\mu + \\sigma\\varepsilon)], \\qquad \\frac{\\partial}{\\partial \\sigma} \\mathbb{E}[f(z)] = \\mathbb{E}[\\varepsilon\\, f'(\\mu + \\sigma\\varepsilon)]."}</MD>
      </Theorem>
      <Proof>
        <p>
          The distribution of ε does not depend on μ or σ, so the expectation is over a fixed distribution and the derivative
          can move inside it (under mild growth conditions on f′). By the chain rule,{" "}
          <M>{"\\partial z / \\partial \\mu = 1"}</M> and <M>{"\\partial z / \\partial \\sigma = \\varepsilon"}</M>. Averaging over
          samples gives unbiased estimates (<C>pathwise_grads</C>). In a VAE, f is the decoder&apos;s log-likelihood, and automatic
          differentiation computes f′ through the decoder; the KL term to the prior is usually differentiated in closed form.
        </p>
      </Proof>

      <Theorem title="the score-function gradient">
        <p>For z ~ N(μ, σ²) and any integrable f, with b any constant,</p>
        <MD>{"\\frac{\\partial}{\\partial \\mu} \\mathbb{E}[f(z)] = \\mathbb{E}\\Big[(f(z) - b)\\,\\frac{\\varepsilon}{\\sigma}\\Big], \\qquad \\frac{\\partial}{\\partial \\sigma} \\mathbb{E}[f(z)] = \\mathbb{E}\\Big[(f(z) - b)\\,\\frac{\\varepsilon^2 - 1}{\\sigma}\\Big]."}</MD>
      </Theorem>
      <Proof>
        <p>
          Differentiating <M>{"\\int f(z) q(z) dz"}</M> gives <M>{"\\mathbb{E}[f(z)\\, \\partial \\log q(z)]"}</M> (m13.6.1). For the
          Gaussian, <M>{"\\partial_\\mu \\log q = (z - \\mu)/\\sigma^2 = \\varepsilon / \\sigma"}</M> and{" "}
          <M>{"\\partial_\\sigma \\log q = ((z - \\mu)^2 - \\sigma^2)/\\sigma^3 = (\\varepsilon^2 - 1)/\\sigma"}</M>. Both scores have
          mean zero, so subtracting a baseline b changes no expectation (<C>score_grads</C>).
        </p>
        <Code>{GRADS}</Code>
      </Proof>

      <Remark title="why the pathwise estimator wins here">
        <p>
          The score estimator carries the whole value of f, including large constants such as the normalising terms of
          thousands of pixels, multiplied by <M>{"\\varepsilon/\\sigma"}</M>; its variance grows like <M>{"f^2/\\sigma^2"}</M> and
          explodes as the encoder becomes confident. The pathwise estimator uses only the slope of f near the sample; for f with
          slope bounded by L its variance is at most <M>{"L^2"}</M>, independent of constant offsets and of σ when σ is small. A
          baseline helps the score estimator but cannot use slope information (m13.6.3). In high dimensions the gap grows: the
          score estimator&apos;s noise adds up over all latent dimensions.
        </p>
      </Remark>

      <Definition title="discrete latents and the Gumbel-softmax">
        <p>
          A categorical code has no location-scale form, so the trick does not apply directly. The Gumbel-max trick (m13.2.3)
          samples category k with probability proportional to <M>{"e^{\\ell_k}"}</M> as{" "}
          <M>{"\\arg\\max_k (\\ell_k + g_k)"}</M>, with Gumbel noise <M>{"g_k = -\\log(-\\log u_k)"}</M> (<C>gumbel</C>,{" "}
          <C>argmax_sample</C>). The <em>Gumbel-softmax</em> (Jang, Gu and Poole; Maddison, Mnih and Teh, 2017) replaces the argmax
          by <M>{"\\operatorname{softmax}((\\ell + g)/\\tau)"}</M> (<C>gumbel_softmax</C>), a differentiable relaxation that tends to
          the one-hot sample as the temperature τ falls to 0, at the price of bias for τ &gt; 0 and high variance as τ → 0. The{" "}
          <em>straight-through</em> variant uses the hard one-hot vector in the forward pass and the relaxed gradient in the
          backward pass, the device used again for vector quantisation in l7.3.4.
        </p>
        <Code>{GUMBEL}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "path",
      rung: "check",
      prompt: (
        <p>
          For f(z) = z² with z = μ + σε, μ = 1 and σ = 0.5, what is the one-sample pathwise estimate of the derivative of E[f(z)]
          with respect to σ when ε = 2?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "gumbel",
      rung: "check",
      prompt: <p>What Gumbel noise value does u = 0.9 give? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.25, tolerance: 0.001 },
    },
    {
      key: "discrete",
      rung: "apply",
      prompt: <p>Why does a VAE with categorical latent codes need something like the Gumbel-softmax?</p>,
      answer: {
        kind: "choice",
        options: [
          "A categorical sample is a step function of its parameters, so it has no useful pathwise derivative; the relaxation makes it smooth at the cost of bias",
          "Categorical distributions have no log-probability, so the score-function estimator cannot be used",
          "The KL divergence to a categorical prior is always infinite",
          "Softmax outputs cannot be fed to a decoder",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pathwise_grads(f_prime, mu, sigma, eps):
    gm = sum(f_prime(mu + sigma * e) for e in eps) / len(eps)
    gs = sum(f_prime(mu + sigma * e) * e for e in eps) / len(eps)
    return gm, gs

def score_grads(f, mu, sigma, eps, baseline=0.0):
    gm = sum((f(mu + sigma * e) - baseline) * e / sigma for e in eps) / len(eps)
    gs = sum((f(mu + sigma * e) - baseline) * (e * e - 1) / sigma for e in eps) / len(eps)
    return gm, gs

def sample_var(xs):
    m = sum(xs) / len(xs)
    return sum((x - m) ** 2 for x in xs) / (len(xs) - 1)

print(pathwise_grads(lambda z: 2 * z, 1.0, 0.5, [1, -1]), score_grads(lambda z: z * z, 1.0, 0.5, [1, -1]))
print(score_grads(lambda z: z * z, 1.0, 0.5, [2, 0]), score_grads(lambda z: z * z, 1.0, 0.5, [2, 0], 1.0), round(sample_var([1, 2, 3, 6]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.0, 1.0) (2.0, 0.0)\n(8.0, 11.0) (6.0, 9.0) 4.6667",
          "(2.0, 1.0) (2.0, 1.0)\n(8.0, 11.0) (6.0, 9.0) 4.6667",
          "(2.0, 1.0) (2.0, 0.0)\n(8.0, 11.0) (8.0, 11.0) 4.6667",
          "(2.0, 1.0) (2.0, 0.0)\n(8.0, 11.0) (6.0, 9.0) 3.5",
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

def gumbel(u):
    return -math.log(-math.log(u))

def gumbel_softmax(logits, us, tau):
    ys = [(l + gumbel(u)) / tau for l, u in zip(logits, us)]
    m = max(ys)
    es = [math.exp(y - m) for y in ys]
    return [e / sum(es) for e in es]

def argmax_sample(logits, us):
    ys = [l + gumbel(u) for l, u in zip(logits, us)]
    return ys.index(max(ys))

print(round(gumbel(0.5), 4), gumbel_softmax([0, 0], [0.5, 0.5], 1.0), argmax_sample([0, 1], [0.9, 0.1]))
print([round(p, 3) for p in gumbel_softmax([0, 1], [0.9, 0.1], 1.0)], [round(p, 3) for p in gumbel_softmax([0, 1], [0.9, 0.1], 0.1)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3665 [0.5, 0.5] 0\n[0.889, 0.111] [1.0, 0.0]",
          "0.3665 [0.5, 0.5] 1\n[0.889, 0.111] [1.0, 0.0]",
          "0.3665 [0.5, 0.5] 0\n[0.111, 0.889] [0.0, 1.0]",
          "0.3665 [0.5, 0.5] 0\n[0.889, 0.111] [0.889, 0.111]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For z = μ + σε, write <C>pathwise_grads(f_prime, mu, sigma, eps)</C> and <C>score_grads(f, mu, sigma, eps, baseline=0.0)</C>,
          each returning the estimated derivatives of E[f(z)] with respect to μ and σ averaged over the noise values eps, and{" "}
          <C>sample_var(xs)</C> with divisor n − 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pathwise_grads(f_prime, mu, sigma, eps):
    return f_prime(mu), 0.0

def score_grads(f, mu, sigma, eps, baseline=0.0):
    return f(mu), 0.0

def sample_var(xs):
    return 0.0
`,
        solution: GRADS,
        tests: [
          { name: "pathwise", code: `gm, gs = pathwise_grads(lambda z: 3 * z * z, 0.0, 2.0, [1.0]); assert abs(gm - 12) < 1e-12 and abs(gs - 12) < 1e-12
gm, gs = pathwise_grads(lambda z: 1.0, 5.0, 1.0, [0.3, -2.0]); assert abs(gm - 1) < 1e-12 and abs(gs + 0.85) < 1e-12` },
          { name: "score and variance", code: `gm, gs = score_grads(lambda z: z, 0.0, 2.0, [1.0, -1.0]); assert abs(gm - 1) < 1e-12 and abs(gs) < 1e-12
gm, gs = score_grads(lambda z: 10.0, 0.0, 0.5, [2.0], 10.0); assert gm == 0 and gs == 0
gm, gs = score_grads(lambda z: 1.0, 0.0, 0.5, [2.0]); assert abs(gm - 4) < 1e-12 and abs(gs - 6) < 1e-12
assert abs(sample_var([1, 3]) - 2) < 1e-12 and abs(sample_var([2, 2, 2]) - 0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gumbel(u)</C>, <C>gumbel_softmax(logits, us, tau)</C>, computed stably, and <C>argmax_sample(logits, us)</C>,
          the Gumbel-max sample, taking the first index on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def gumbel(u):
    return u

def gumbel_softmax(logits, us, tau):
    return [1 / len(logits)] * len(logits)

def argmax_sample(logits, us):
    return logits.index(max(logits))
`,
        solution: GUMBEL,
        tests: [
          { name: "noise and sample", code: `assert abs(gumbel(math.exp(-math.exp(-2)) ) - 2) < 1e-9 and abs(gumbel(0.9) - 2.2504) < 1e-4
assert argmax_sample([0, 1], [0.9, 0.1]) == 0 and argmax_sample([0, 1], [0.5, 0.5]) == 1 and argmax_sample([5, 0, 0], [0.01, 0.99, 0.5]) == 1` },
          { name: "relaxation", code: `p = gumbel_softmax([1000, 0], [0.5, 0.5], 1.0); assert abs(p[0] - 1) < 1e-12 and abs(sum(p) - 1) < 1e-12
p = gumbel_softmax([0, math.log(3)], [0.5, 0.5], 1.0); assert abs(p[1] - 0.75) < 1e-12
p = gumbel_softmax([0, math.log(3)], [0.5, 0.5], 2.0); assert abs(p[1] - math.sqrt(3) / (1 + math.sqrt(3))) < 1e-12` },
        ],
      },
    },
    {
      key: "variance",
      rung: "stretch",
      prompt: (
        <p>
          For f(z) = −20 − 2(2 − 1.5z)² with z = μ + σε and σ = 0.3, what is the exact variance of the one-sample pathwise
          estimate of the derivative with respect to μ? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 7.29, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the trick, a VAE trains like any autoencoder. Yet a powerful decoder often learns to ignore the code entirely,
        driving the KL term to zero. The next lesson asks why the ELBO permits this posterior collapse, and what prevents it.
      </p>
    </>
  ),
};
