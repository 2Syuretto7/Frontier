import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CollapseViz } from "@/components/viz/CollapseViz";
import type { LessonContent } from "@/lib/types";

const LINEAR = `import math

def linear_vae_dim(v, c):
    if v <= c:
        return 0.0, 0.0, v
    return v - c, 0.5 * math.log(v / c), c

def rate_distortion(vs, sigma2, beta):
    dims = [linear_vae_dim(v, beta * sigma2) for v in vs]
    return sum(d[1] for d in dims), sum(d[2] for d in dims)

def active_units(means, threshold=0.01):
    n, count = len(means), 0
    for j in range(len(means[0])):
        col = [m[j] for m in means]
        mu = sum(col) / n
        if sum((x - mu) ** 2 for x in col) / n > threshold:
            count += 1
    return count`;

const REMEDIES = `def kl_weight_linear(step, warmup):
    return min(1.0, step / warmup)

def kl_weight_cyclical(step, period, ramp=0.5):
    frac = (step % period) / period
    return min(1.0, frac / ramp)

def objective(recon, kls, beta, free_bits=0.0):
    return recon - beta * sum(max(k, free_bits) for k in kls)`;

export const lesson: LessonContent = {
  id: "l7.3.3",
  minutes: 45,
  links: {
    requires: ["l7.3.2", "m12.6.3"],
    revisits: ["l7.3.1", "l7.2.1", "l4.2.3"],
    foreshadows: ["l7.3.4", "l11.4.1"],
  },

  puzzle: (
    <>
      <p>
        A team trains a VAE on sentences with a powerful autoregressive decoder, hoping the 32-dimensional code will capture
        each sentence&apos;s topic and style. Training goes smoothly and the likelihood is excellent. Then they discover that the
        KL term is almost exactly zero: the encoder outputs the prior for every sentence, and the decoder ignores the code
        entirely. Nothing crashed. Why is ignoring the code a good solution for the ELBO, and what can be done about it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The ELBO charges for every nat of information the code carries, through the KL term, and pays back only if the
        decoder uses that information to reconstruct better than it could alone. A decoder that can model the data well
        without the code, such as an autoregressive model, gains little from it, so the cheapest solution is to send nothing.
        This is <em>posterior collapse</em>.
      </p>
      <p>
        Even a simple linear decoder shows the effect. Directions in which the data vary less than the decoder&apos;s noise
        level are cheaper to explain as noise than to encode, so their latent dimensions switch off. The weight β on the KL
        term sets the price of information, and moves the threshold.
      </p>
      <CollapseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rate and distortion">
        <p>
          Averaged over data, the KL term <M>{"R = \\mathbb{E}_x \\mathrm{KL}(q(z \\mid x) \\| p(z))"}</M> is the <em>rate</em>, an upper
          bound on the mutual information between x and z under the encoder, and the negative reconstruction term{" "}
          <M>{"D = -\\mathbb{E}_x \\mathbb{E}_q \\log p(x \\mid z)"}</M> is the <em>distortion</em>. The ELBO is −(D + R); the β-VAE
          objective is −(D + βR). Different points on the curve of D against R can have the same ELBO (Alemi and others, 2018),
          so the ELBO alone does not say how much the code is used.
        </p>
      </Definition>

      <Theorem title="collapse in a linear VAE">
        <p>
          Let data in one dimension have variance v, the decoder be <M>{"x \\mid z \\sim \\mathcal{N}(wz, \\sigma^2)"}</M>, the encoder{" "}
          <M>{"q(z \\mid x) = \\mathcal{N}(ax, s^2)"}</M>, and c = βσ². The β-ELBO is maximised by <M>{"w^2 = \\max(0, v - c)"}</M>. If{" "}
          <M>{"v \\le c"}</M> the dimension collapses: w = a = 0, q is the prior, the rate is 0 and the distortion term is v. If v &gt; c,
          the rate is <M>{"\\tfrac12 \\log(v / c)"}</M> and the expected squared reconstruction error is c.
        </p>
      </Theorem>
      <Proof>
        <p>
          For fixed w, setting the derivatives with respect to a and s² to zero gives <M>{"a = w/(w^2 + c)"}</M> and{" "}
          <M>{"s^2 = c/(w^2 + c)"}</M>. Substituting, with <M>{"t = w^2 + c"}</M>, the expected squared error{" "}
          <M>{"v(1 - wa)^2 + w^2 s^2"}</M> becomes <M>{"vc^2/t^2 + w^2 c/t"}</M> and the KL term{" "}
          <M>{"\\tfrac12(a^2 v + s^2 - 1 - \\log s^2)"}</M> becomes <M>{"\\tfrac12(v w^2/t^2 + c/t - 1 + \\log(t/c))"}</M>. Since the
          squared error is divided by 2σ² = 2c/β, the objective is, up to a constant, <M>{"-\\tfrac{\\beta}{2}\\big(v/t + \\log t\\big)"}</M>,
          and the bracket is minimised over <M>{"t \\ge c"}</M> at t = v if v ≥ c and at t = c otherwise. At t = v,{" "}
          <M>{"s^2 = c/v"}</M> and <M>{"a^2 v + s^2 = 1"}</M>, so the rate is <M>{"\\tfrac12\\log(v/c)"}</M>, and the squared error is{" "}
          <M>{"c^2/v + (v - c)c/v = c"}</M> (<C>linear_vae_dim</C>).
        </p>
      </Proof>

      <Remark title="reverse water-filling">
        <p>
          With independent dimensions of variances <M>{"v_j"}</M>, each is treated separately: dimensions above the level c are
          coded down to error c, those below are dropped (<C>rate_distortion</C>). This is exactly the rate-distortion solution
          for Gaussian sources (m12.6.3), so a linear VAE is a rate-distortion code and probabilistic PCA (l4.2.3) at once. A
          diagnostic for real models is the number of <em>active units</em>, latent dimensions whose encoder mean varies across
          the data by more than a small threshold (<C>active_units</C>).
        </p>
        <Code>{LINEAR}</Code>
      </Remark>

      <Theorem title="a decoder that needs no code">
        <p>
          If the decoder family contains <M>{"p_{\\text{data}}"}</M> itself, ignoring z, then the global maximum of the expected
          ELBO is achieved with q(z | x) = p(z) for every x, and the rate is zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          The expected ELBO is at most the expected log-likelihood, which is at most <M>{"-H(p_{\\text{data}})"}</M> (l7.1.1). A decoder
          equal to <M>{"p_{\\text{data}}"}</M> with q equal to the prior has zero KL term and reconstruction term{" "}
          <M>{"\\mathbb{E}\\log p_{\\text{data}}(x) = -H(p_{\\text{data}})"}</M>, so it attains the bound. An autoregressive decoder
          (l7.2.1) can represent any distribution, so collapse is always among its optimal solutions, and early in training,
          when the encoder&apos;s codes are still noise, it is the easy one to reach.
        </p>
      </Proof>

      <Definition title="remedies">
        <p>
          <em>KL annealing</em> multiplies the KL term by a weight that rises from 0 to 1 over a warm-up, so codes become useful
          before they are charged for (<C>kl_weight_linear</C>); cyclical schedules repeat the ramp (<C>kl_weight_cyclical</C>).{" "}
          <em>Free bits</em> charge each dimension at least λ nats, so the optimiser gains nothing by pushing a dimension&apos;s KL
          below λ (<C>objective</C>). Other remedies weaken the decoder, for example by restricting its context, or constrain q
          so that its KL cannot reach zero. Discrete bottlenecks, the subject of the next lesson, sidestep the issue by fixing
          the rate.
        </p>
        <Code>{REMEDIES}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: <p>In a linear VAE with β = 1, a data dimension has variance 3 and the decoder noise variance is 1. What is the rate for that dimension at the optimum, in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5493, tolerance: 0.0001 },
    },
    {
      key: "active",
      rung: "check",
      prompt: <p>Data dimensions have variances 8, 4, 2 and 1, the decoder noise variance is 1 and β = 2. How many latent dimensions stay active at the optimum of a linear VAE?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why are VAEs with autoregressive decoders particularly prone to posterior collapse?</p>,
      answer: {
        kind: "choice",
        options: [
          "The decoder can model the data well without the code, so paying KL cost for information in z buys little reconstruction gain",
          "Autoregressive decoders cannot accept a latent code as input",
          "The reparameterisation trick does not work with autoregressive decoders",
          "Autoregressive decoders make the KL term negative",
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

def linear_vae_dim(v, c):
    if v <= c:
        return 0.0, 0.0, v
    return v - c, 0.5 * math.log(v / c), c

def rate_distortion(vs, sigma2, beta):
    dims = [linear_vae_dim(v, beta * sigma2) for v in vs]
    return sum(d[1] for d in dims), sum(d[2] for d in dims)

def active_units(means, threshold=0.01):
    n, count = len(means), 0
    for j in range(len(means[0])):
        col = [m[j] for m in means]
        mu = sum(col) / n
        if sum((x - mu) ** 2 for x in col) / n > threshold:
            count += 1
    return count

print([round(x, 4) for x in linear_vae_dim(4, 1)], linear_vae_dim(0.5, 1), [round(x, 4) for x in rate_distortion([4, 1, 0.25], 1, 1)])
print(active_units([[0.0, 1.0], [0.01, -1.0], [0.0, 0.5]]), [round(x, 4) for x in rate_distortion([4, 1, 0.25], 0.5, 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 0.6931, 1] (0.0, 0.0, 0.5) [0.6931, 2.25]\n1 [0.6931, 2.25]",
          "[3, 0.6931, 1] (0.0, 0.0, 0.0) [0.6931, 2.0]\n1 [0.6931, 2.25]",
          "[3, 0.6931, 1] (0.0, 0.0, 0.5) [0.6931, 2.25]\n2 [0.6931, 2.25]",
          "[3, 0.6931, 1] (0.0, 0.0, 0.5) [0.6931, 2.25]\n1 [1.3863, 1.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kl_weight_linear(step, warmup):
    return min(1.0, step / warmup)

def kl_weight_cyclical(step, period, ramp=0.5):
    frac = (step % period) / period
    return min(1.0, frac / ramp)

def objective(recon, kls, beta, free_bits=0.0):
    return recon - beta * sum(max(k, free_bits) for k in kls)

print(kl_weight_linear(500, 1000), kl_weight_linear(2000, 1000), kl_weight_cyclical(1500, 1000), kl_weight_cyclical(1100, 1000))
print(objective(-10.0, [0.05, 2.0], 1.0, 0.5), objective(-10.0, [0.05, 2.0], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 1.0 1.0 0.2\n-12.5 -11.025",
          "0.5 2.0 1.0 0.2\n-12.5 -11.025",
          "0.5 1.0 0.5 0.1\n-12.5 -11.025",
          "0.5 1.0 1.0 0.2\n-12.05 -11.025",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linear_vae_dim(v, c)</C>, returning <C>(w2, rate, distortion)</C> at the optimum with c = βσ²;{" "}
          <C>rate_distortion(vs, sigma2, beta)</C>, the total rate and distortion; and <C>active_units(means, threshold=0.01)</C>,
          counting dimensions whose encoder means have population variance above the threshold.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def linear_vae_dim(v, c):
    return v, 0.0, 0.0

def rate_distortion(vs, sigma2, beta):
    return 0.0, sum(vs)

def active_units(means, threshold=0.01):
    return len(means[0])
`,
        solution: LINEAR,
        tests: [
          { name: "one dimension", code: `w2, r, d = linear_vae_dim(9, 1); assert w2 == 8 and abs(r - math.log(3)) < 1e-12 and d == 1
assert linear_vae_dim(1, 1) == (0.0, 0.0, 1) and linear_vae_dim(0.2, 2) == (0.0, 0.0, 0.2)` },
          { name: "totals and active units", code: `r, d = rate_distortion([4, 0.5], 2, 0.5); assert abs(r - math.log(2)) < 1e-12 and abs(d - 1.5) < 1e-12
assert active_units([[0, 0], [1, 0.05], [2, 0]]) == 1 and active_units([[0, 0], [1, 1]], 0.3) == 0 and active_units([[0, 0], [1, 1]], 0.2) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_weight_linear(step, warmup)</C>, rising linearly to 1; <C>kl_weight_cyclical(step, period, ramp=0.5)</C>,
          rising over the first <C>ramp</C> fraction of each period and then staying at 1; and{" "}
          <C>objective(recon, kls, beta, free_bits=0.0)</C>, charging each dimension&apos;s KL at least <C>free_bits</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kl_weight_linear(step, warmup):
    return 1.0

def kl_weight_cyclical(step, period, ramp=0.5):
    return 1.0

def objective(recon, kls, beta, free_bits=0.0):
    return recon - sum(kls)
`,
        solution: REMEDIES,
        tests: [
          { name: "schedules", code: `assert kl_weight_linear(0, 10) == 0 and kl_weight_linear(5, 10) == 0.5 and kl_weight_linear(50, 10) == 1.0
assert kl_weight_cyclical(0, 100) == 0 and kl_weight_cyclical(25, 100) == 0.5 and kl_weight_cyclical(80, 100) == 1.0 and kl_weight_cyclical(110, 100, 0.2) == 0.5` },
          { name: "objective", code: `assert objective(-5.0, [1.0, 2.0], 1.0) == -8.0 and objective(-5.0, [1.0, 2.0], 0.5) == -6.5
assert objective(0.0, [0.0, 0.1, 3.0], 1.0, 1.0) == -5.0 and objective(0.0, [], 2.0, 1.0) == 0.0` },
        ],
      },
    },
    {
      key: "total",
      rung: "stretch",
      prompt: (
        <p>
          A linear VAE with β = 1 and decoder noise variance 0.5 models data whose independent dimensions have variances 8, 4,
          2, 1 and 0.5. What is the total rate at the optimum, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.466, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A code made of discrete symbols from a fixed codebook has a rate set by its size and cannot quietly fall to zero. The
        VQ-VAE builds on this, and its codes became the tokens that let transformers generate images and sound.
      </p>
    </>
  ),
};
