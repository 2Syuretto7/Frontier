import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RdCurveViz } from "@/components/viz/RdCurveViz";
import type { LessonContent } from "@/lib/types";

const RD = `import numpy as np

def h2(p):
    return 0.0 if p <= 0 or p >= 1 else float(-p * np.log2(p) - (1 - p) * np.log2(1 - p))

def rd_bernoulli(p, D):
    return h2(p) - h2(D) if D < min(p, 1 - p) else 0.0

def ba_rd(px, d, beta, iters=500):
    r = np.full(d.shape[1], 1 / d.shape[1])
    for _ in range(iters):
        q = r[None, :] * np.exp(-beta * d); q /= q.sum(axis=1, keepdims=True)
        r = px @ q
    rs = np.where(r > 0, r, 1)[None, :]
    D = float(np.sum(px[:, None] * q * d))
    R = float(np.sum(px[:, None] * q * np.log2(np.where(q > 0, q, rs) / rs)))
    return R, D`;

const LQ = `import numpy as np

def lloyd(samples, k, iters=100):
    c = np.quantile(samples, (np.arange(k) + 0.5) / k)
    for _ in range(iters):
        idx = np.abs(samples[:, None] - c[None, :]).argmin(axis=1)
        c = np.array([samples[idx == j].mean() for j in range(k)])
    idx = np.abs(samples[:, None] - c[None, :]).argmin(axis=1)
    return c, float(np.mean((samples - c[idx]) ** 2))

def shannon_distortion(R, var=1.0):
    return var * 2 ** (-2 * R)`;

export const lesson: LessonContent = {
  id: "m12.6.3",
  minutes: 55,
  links: {
    requires: ["m12.5.2", "m12.6.2"],
    revisits: ["m12.2.3", "m12.5.1"],
    foreshadows: ["m12.6.4"],
  },

  puzzle: (
    <>
      <p>
        A fair coin is flipped a million times and you may store only half a million bits. Lossless compression is
        impossible, since the entropy is a full bit per flip. The obvious fallback is to store half the flips exactly and
        guess the rest, getting a quarter of them wrong. Shannon showed you can do far better, getting only 11% wrong. How
        can error be spread so cleverly, and what is the exact trade-off between bits and mistakes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Lossless coding asks how many bits identify the source exactly. If some error is allowed, we only need to identify a
        reconstruction close enough to it, and many sources share the same close reconstruction. The rate needed is the
        information the reconstruction must carry about the source, minimised over all ways of making the reconstruction
        that keep the average error within budget. It is the channel capacity problem turned upside down: there we
        maximise information through a fixed channel; here we design the least informative channel that is still good
        enough.
      </p>
      <RdCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rate-distortion function">
        <p>
          For a source X with distribution p, a reconstruction alphabet and a distortion measure <M>{"d(x, \\hat x) \\ge 0"}</M>,
        </p>
        <MD>{"R(D) = \\min_{q(\\hat x \\mid x) \\,:\\, \\mathbb E[d(X, \\hat X)] \\le D} I(X; \\hat X)."}</MD>
        <p>
          It is non-increasing and convex in D, because mixing two test channels mixes their distortions linearly while
          mutual information is convex in the channel for a fixed source.
        </p>
      </Definition>

      <Theorem title="rate-distortion theorem">
        <p>
          Blocks of n source symbols can be described with R bits per symbol and average distortion at most D + ε for large n
          if R &gt; R(D); if R &lt; R(D), the average distortion of any such code exceeds D for every n.
        </p>
      </Theorem>
      <Proof>
        <p>
          Outline only. Achievability: fix the optimal test channel and draw <M>{"2^{nR}"}</M> reconstruction sequences at
          random from the resulting distribution of <M>{"\\hat X"}</M>. A source sequence is jointly typical with a given
          random reconstruction with probability about <M>{"2^{-nI(X;\\hat X)}"}</M>, so with more than{" "}
          <M>{"2^{nI}"}</M> of them one usually is, and jointly typical pairs have distortion close to D. The converse is the
          chain <M>{"nR \\ge H(\\hat X^n) \\ge I(X^n; \\hat X^n) \\ge \\sum_i I(X_i; \\hat X_i) \\ge \\sum_i R(\\mathbb E d_i) \\ge nR(D)"}</M>,
          using independence of the source symbols and then convexity of R.
        </p>
      </Proof>

      <Theorem title="the biased coin">
        <p>
          For a Bernoulli(p) source with Hamming distortion (the error rate),{" "}
          <M>{"R(D) = h(p) - h(D)"}</M> for <M>{"0 \\le D < \\min(p, 1-p)"}</M>, and R(D) = 0 beyond that.
        </p>
      </Theorem>
      <Proof>
        <p>
          Lower bound: let <M>{"E = X \\oplus \\hat X"}</M>, with <M>{"P(E = 1) \\le D"}</M>. Then{" "}
          <M>{"I(X; \\hat X) = h(p) - H(X \\mid \\hat X) = h(p) - H(E \\mid \\hat X) \\ge h(p) - H(E) \\ge h(p) - h(D)"}</M>, the
          last step because h increases on [0, ½]. Achievability: take <M>{"\\hat X"}</M> with{" "}
          <M>{"P(\\hat X = 1) = (p - D)/(1 - 2D)"}</M> and pass it through a symmetric channel with crossover D to produce X; the
          joint distribution has the right marginal for X, error rate D, and <M>{"H(X \\mid \\hat X) = h(D)"}</M>. Beyond{" "}
          <M>{"\\min(p, 1-p)"}</M>, always guessing the likelier symbol costs no bits. For the fair coin at half a bit,{" "}
          <M>{"h(D) = 0.5"}</M> gives D ≈ 0.11.
        </p>
      </Proof>

      <Remark title="computing R(D): Gibbs again">
        <p>
          Minimising <M>{"I(X;\\hat X) + \\beta\\,\\mathbb E[d]"}</M> with β &gt; 0 as a Lagrange multiplier gives an optimal
          channel of Gibbs form, <M>{"q(\\hat x \\mid x) \\propto r(\\hat x)\\,e^{-\\beta d(x, \\hat x)}"}</M>, where r is the output
          marginal. The Blahut–Arimoto algorithm alternates the two conditions, each step an exact minimisation, and each β
          gives one point on the curve with slope −β (in nats). For a fair coin and β = 2 it lands on D = 0.119 and the
          formula&apos;s rate 0.473 exactly.
        </p>
        <Code>{RD}</Code>
      </Remark>

      <Remark title="real numbers and real codecs">
        <p>
          For a Gaussian source of variance <M>{"\\sigma^2"}</M> with squared error, <M>{"R(D) = \\tfrac12\\log_2(\\sigma^2/D)"}</M>,
          so each extra bit cuts the distortion by a factor of 4. The best one-dimensional quantiser, found by Lloyd&apos;s
          algorithm (k-means in one dimension), falls short: with 2 levels it reaches 0.36 against the bound 0.25, because
          the bound needs long blocks. Transform codecs such as JPEG approximate the multivariate answer, called reverse
          water-filling, by spending bits only on components whose variance exceeds a threshold. And a β-VAE is a
          rate-distortion trade-off in disguise: its KL term is a rate and its reconstruction loss a distortion.
        </p>
        <Code>{LQ}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fair",
      rung: "check",
      prompt: <p>What is R(0.11) for a fair coin under Hamming distortion, in bits per flip? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "gauss",
      rung: "check",
      prompt: <p>A Gaussian source has variance 4. How many bits per sample are needed for mean squared error 1?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Why is R(D) = 0 for a Bernoulli(0.2) source once D ≥ 0.2?</p>,
      answer: {
        kind: "choice",
        options: [
          "Always reconstructing 0 is wrong 20% of the time and needs no bits at all",
          "The entropy of the source is below 0.2 bits",
          "Mutual information is negative at that distortion",
          "Any code of rate 0.2 is lossless",
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

def h2(p):
    return 0.0 if p <= 0 or p >= 1 else float(-p * np.log2(p) - (1 - p) * np.log2(1 - p))

def rd_bernoulli(p, D):
    return h2(p) - h2(D) if D < min(p, 1 - p) else 0.0

def ba_rd(px, d, beta, iters=500):
    r = np.full(d.shape[1], 1 / d.shape[1])
    for _ in range(iters):
        q = r[None, :] * np.exp(-beta * d); q /= q.sum(axis=1, keepdims=True)
        r = px @ q
    rs = np.where(r > 0, r, 1)[None, :]
    D = float(np.sum(px[:, None] * q * d))
    R = float(np.sum(px[:, None] * q * np.log2(np.where(q > 0, q, rs) / rs)))
    return R, D

print(round(rd_bernoulli(0.5, 0.11), 3), rd_bernoulli(0.2, 0.3), round(h2(0.2), 3))
d = np.array([[0.0, 1.0], [1.0, 0.0]]); R, D = ba_rd(np.array([0.5, 0.5]), d, 2.0); print(round(R, 3), round(D, 3), abs(R - rd_bernoulli(0.5, D)) < 1e-9)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.0 0.722\n0.473 0.119 True",
          "0.5 0.0 0.722\n0.119 0.473 True",
          "0.5 -0.159 0.722\n0.473 0.119 True",
          "0.5 0.0 0.722\n0.473 0.119 False",
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

def lloyd(samples, k, iters=100):
    c = np.quantile(samples, (np.arange(k) + 0.5) / k)
    for _ in range(iters):
        idx = np.abs(samples[:, None] - c[None, :]).argmin(axis=1)
        c = np.array([samples[idx == j].mean() for j in range(k)])
    idx = np.abs(samples[:, None] - c[None, :]).argmin(axis=1)
    return c, float(np.mean((samples - c[idx]) ** 2))

def shannon_distortion(R, var=1.0):
    return var * 2 ** (-2 * R)

rng = np.random.default_rng(0); s = rng.normal(size=20000); c, D = lloyd(s, 2); print(round(D, 2), shannon_distortion(1.0), D > shannon_distortion(1.0))
print(round(lloyd(s, 4)[1], 2), shannon_distortion(2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.36 0.25 True\n0.12 0.0625",
          "0.25 0.25 False\n0.0625 0.0625",
          "0.36 0.5 False\n0.12 0.25",
          "0.36 0.25 True\n0.12 0.125",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>h2(p)</C>; <C>rd_bernoulli(p, D)</C>; and <C>ba_rd(px, d, beta, iters)</C>, the Blahut–Arimoto iteration for
          rate-distortion, returning the rate in bits and the distortion of the final channel.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def h2(p):
    return 0.0

def rd_bernoulli(p, D):
    return 0.0

def ba_rd(px, d, beta, iters=500):
    return 0.0, 0.0
`,
        solution: RD,
        tests: [
          { name: "formula", code: `assert abs(rd_bernoulli(0.5, 0.0) - 1.0) < 1e-12 and rd_bernoulli(0.2, 0.25) == 0.0 and abs(h2(0.25) - 0.811278) < 1e-6` },
          { name: "blahut", code: `d = np.array([[0.0, 1.0], [1.0, 0.0]]); R, D = ba_rd(np.array([0.7, 0.3]), d, 3.0)
assert abs(R - rd_bernoulli(0.3, D)) < 1e-6 and 0 < D < 0.3 and ba_rd(np.array([0.7, 0.3]), d, 5.0)[1] < D` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lloyd(samples, k, iters)</C>, starting the k levels at the sample quantiles (j + ½)/k and returning the levels
          and the mean squared error, and <C>shannon_distortion(R, var)</C>, the Gaussian bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lloyd(samples, k, iters=100):
    return np.zeros(k), float(np.mean(samples ** 2))

def shannon_distortion(R, var=1.0):
    return var
`,
        solution: LQ,
        tests: [
          { name: "levels", code: `s = np.concatenate([-1 + 0.01 * np.arange(-5, 6), 1 + 0.01 * np.arange(-5, 6)]); c, D = lloyd(s, 2)
assert np.allclose(c, [-1, 1]) and abs(D - 0.001) < 1e-12 and np.isclose(lloyd(np.array([1.0, 2, 3, 4]), 1)[1], 1.25)` },
          { name: "bound", code: `assert np.isclose(shannon_distortion(1.5, 4.0), 0.5) and np.isclose(shannon_distortion(0.0, 2.0), 2.0)` },
        ],
      },
    },
    {
      key: "biased",
      rung: "stretch",
      prompt: (
        <p>
          How many bits per symbol does a Bernoulli(0.2) source need to be reconstructed with at most 5% of symbols wrong? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4355, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Rate-distortion compresses X while keeping a reconstruction of X. The information bottleneck keeps instead what X says
        about another variable Y, which is a tempting theory of what neural networks learn. The last lesson reads that claim
        critically.
      </p>
    </>
  ),
};
