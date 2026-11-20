import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CodebookViz } from "@/components/viz/CodebookViz";
import type { LessonContent } from "@/lib/types";

const VQ = `import math

def assign(points, codebook):
    return [min(range(len(codebook)), key=lambda k: sum((a - b) ** 2 for a, b in zip(p, codebook[k])))
            for p in points]

def ema_update(counts, sums, points, idx, gamma):
    K, d = len(counts), len(sums[0])
    n = [0] * K
    s = [[0.0] * d for _ in range(K)]
    for p, k in zip(points, idx):
        n[k] += 1
        s[k] = [a + b for a, b in zip(s[k], p)]
    counts = [gamma * c + (1 - gamma) * m for c, m in zip(counts, n)]
    sums = [[gamma * a + (1 - gamma) * b for a, b in zip(u, v)] for u, v in zip(sums, s)]
    codebook = [[a / c for a in u] for u, c in zip(sums, counts)]
    return counts, sums, codebook

def perplexity(idx, K):
    h = 0.0
    for k in range(K):
        p = idx.count(k) / len(idx)
        if p > 0:
            h -= p * math.log(p)
    return math.exp(h)`;

const FSQ = `import math

def fsq_round(z, levels):
    return [round((L - 1) / 2 * math.tanh(x)) for x, L in zip(z, levels)]

def fsq_index(code, levels):
    idx, mult = 0, 1
    for c, L in zip(code, levels):
        idx += (c + (L - 1) // 2) * mult
        mult *= L
    return idx

def fsq_codebook_size(levels):
    return math.prod(levels)`;

export const lesson: LessonContent = {
  id: "l7.3.4",
  minutes: 45,
  links: {
    requires: ["l7.3.3", "l7.2.3", "l1.6.1"],
    revisits: ["l7.3.2", "l7.1.3"],
    foreshadows: ["l12.3.3", "l12.5.3", "l12.6.1"],
  },

  puzzle: (
    <>
      <p>
        An image generator built on a transformer needs images as sequences of a few hundred tokens from a vocabulary of a few
        thousand. Pixel colours are far too many tokens; k-means on pixels (l7.2.3) is too crude. What is wanted is a learned
        compressor whose output is discrete: an autoencoder whose bottleneck is a grid of symbols. But rounding to the nearest
        symbol has a derivative of zero almost everywhere. How do you train an encoder through a step function?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The VQ-VAE replaces the Gaussian code of a VAE by a lookup: the encoder outputs a vector, which is snapped to the
        nearest entry of a learned codebook, and the decoder sees only the snapped vector. In the backward pass the snapping is
        simply skipped, copying the decoder&apos;s gradient straight to the encoder. Extra loss terms pull codebook entries
        towards the encoder outputs that use them and keep the encoder from wandering away from its codes.
      </p>
      <p>
        Because the code is a choice among K symbols, its information content is fixed at log K nats per position and cannot
        collapse to zero. The practical failure is different: codebook entries that are never chosen are never updated, and
        die.
      </p>
      <CodebookViz />
    </>
  ),

  theory: (
    <>
      <Definition title="VQ-VAE">
        <p>
          (van den Oord, Vinyals and Kavukcuoglu, 2017.) An encoder maps x to vectors <M>{"z_e"}</M>, one per position of a grid.
          Each is replaced by its nearest codebook vector, <M>{"z_q = e_k"}</M> with <M>{"k = \\arg\\min_j \\|z_e - e_j\\|"}</M>
          (<C>assign</C>), and a decoder reconstructs x from <M>{"z_q"}</M>. Writing sg for stop-gradient, the loss is
        </p>
        <MD>{"\\|x - \\hat x\\|^2 + \\|\\mathrm{sg}[z_e] - e_k\\|^2 + \\beta \\|z_e - \\mathrm{sg}[e_k]\\|^2,"}</MD>
        <p>
          a reconstruction term, a codebook term that moves <M>{"e_k"}</M> towards the encoder outputs assigned to it, and a{" "}
          <em>commitment</em> term, with β around 0.25, that keeps the encoder near its codes.
        </p>
      </Definition>

      <Definition title="the straight-through estimator">
        <p>
          The decoder input is computed as <M>{"z_q = z_e + \\mathrm{sg}[e_k - z_e]"}</M>, whose value is <M>{"e_k"}</M> and whose
          gradient with respect to <M>{"z_e"}</M> is the identity. The encoder therefore receives the gradient the decoder computed
          at <M>{"e_k"}</M>, a biased estimate that is good when <M>{"z_e"}</M> is close to <M>{"e_k"}</M>, which the commitment term
          encourages.
        </p>
      </Definition>

      <Theorem title="the KL term is a constant">
        <p>
          Viewed as a VAE with a uniform prior over K codes and a deterministic posterior <M>{"q(k \\mid x) = 1"}</M> for the chosen
          code, the KL term is <M>{"\\log K"}</M> per position, whatever the encoder does.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{KL}(q \\| p) = \\sum_j q(j) \\log(q(j)/p(j)) = 1 \\cdot \\log(1 / (1/K)) = \\log K"}</M>. So the ELBO reduces to
          the reconstruction term plus a constant, the rate is fixed by the grid size and K, and the collapse of l7.3.3 cannot
          happen. The uniform prior is a placeholder: after training, a second model, typically an autoregressive transformer,
          is fitted to the grids of codes, and it is this learned prior that generates new images.
        </p>
      </Proof>

      <Definition title="codebook learning and utilisation">
        <p>
          Instead of the codebook loss, each code is often set to a moving average of the encoder outputs assigned to it:
          counts <M>{"N_k \\leftarrow \\gamma N_k + (1 - \\gamma) n_k"}</M>, sums{" "}
          <M>{"m_k \\leftarrow \\gamma m_k + (1 - \\gamma) \\sum_{i: k_i = k} z_{e,i}"}</M> and <M>{"e_k = m_k / N_k"}</M> (<C>ema_update</C>),
          an online k-means (l1.6.1). Codes that are never chosen never move. Utilisation is measured by the <em>perplexity</em>{" "}
          <M>{"e^{H}"}</M> of the empirical code frequencies (<C>perplexity</C>), the effective number of codes in use; dead codes
          are revived by resetting them to recent encoder outputs.
        </p>
        <Code>{VQ}</Code>
      </Definition>

      <Definition title="finite scalar quantisation">
        <p>
          FSQ (Mentzer and others, 2023) drops the learned codebook. The encoder outputs a few numbers, each squashed and rounded
          to one of <M>{"L_i"}</M> levels, <M>{"\\operatorname{round}(\\tfrac{L_i - 1}{2} \\tanh z_i)"}</M> for odd <M>{"L_i"}</M>
          (<C>fsq_round</C>), with straight-through gradients for the rounding. The implicit codebook is the grid of all
          combinations, of size <M>{"\\prod_i L_i"}</M> (<C>fsq_codebook_size</C>), and a code&apos;s index is its mixed-radix
          number (<C>fsq_index</C>). Every grid point is reachable, so there are no dead codes and no auxiliary losses.
        </p>
        <Code>{FSQ}</Code>
      </Definition>

      <Remark title="from VQ-VAE to modern tokenisers">
        <p>
          VQGAN added perceptual and adversarial losses (Part 5), letting a 16 by 16 grid of codes reconstruct a 256 by 256 image
          with sharp detail; transformers trained on those grids gave the first strong token-based image generators. Latent
          diffusion (l12.3.3) keeps the same autoencoder idea with continuous latents. Audio tokenisers use residual quantisation
          (l7.2.3), and video tokenisers extend the grid in time.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bits",
      rung: "check",
      prompt: <p>An image tokeniser produces a 16 by 16 grid of codes from a codebook of 8192 entries. How many bits does one image&apos;s code take?</p>,
      answer: { kind: "numeric", value: 3328, tolerance: 0 },
    },
    {
      key: "fsq",
      rung: "check",
      prompt: <p>An FSQ tokeniser uses levels (8, 5, 5, 5). How many codes does its implicit codebook have?</p>,
      answer: { kind: "numeric", value: 1000, tolerance: 0 },
    },
    {
      key: "st",
      rung: "apply",
      prompt: <p>Why does a VQ-VAE need the straight-through estimator?</p>,
      answer: {
        kind: "choice",
        options: [
          "Snapping to the nearest code is piecewise constant, so its true derivative is zero almost everywhere and the encoder would receive no gradient",
          "The decoder is not differentiable",
          "The codebook loss has no gradient with respect to the codebook",
          "The KL term would otherwise be infinite",
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

def assign(points, codebook):
    return [min(range(len(codebook)), key=lambda k: sum((a - b) ** 2 for a, b in zip(p, codebook[k])))
            for p in points]

def ema_update(counts, sums, points, idx, gamma):
    K, d = len(counts), len(sums[0])
    n = [0] * K
    s = [[0.0] * d for _ in range(K)]
    for p, k in zip(points, idx):
        n[k] += 1
        s[k] = [a + b for a, b in zip(s[k], p)]
    counts = [gamma * c + (1 - gamma) * m for c, m in zip(counts, n)]
    sums = [[gamma * a + (1 - gamma) * b for a, b in zip(u, v)] for u, v in zip(sums, s)]
    codebook = [[a / c for a in u] for u, c in zip(sums, counts)]
    return counts, sums, codebook

def perplexity(idx, K):
    h = 0.0
    for k in range(K):
        p = idx.count(k) / len(idx)
        if p > 0:
            h -= p * math.log(p)
    return math.exp(h)

c, s, cb = ema_update([1, 1], [[0, 0], [4, 4]], [(1, 1), (2, 2)], [0, 0], 0.5); print(assign([(0, 0), (3, 3)], [(0, 0), (2, 2), (4, 4)]), c, cb)
print(perplexity([0, 0, 1, 1], 2), perplexity([0, 0, 0, 0], 4), round(perplexity([0, 1, 2, 2], 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 1] [1.5, 0.5] [[1.0, 1.0], [4.0, 4.0]]\n2.0 1.0 2.8284",
          "[0, 2] [1.5, 0.5] [[1.0, 1.0], [4.0, 4.0]]\n2.0 1.0 2.8284",
          "[0, 1] [1.5, 0.5] [[1.5, 1.5], [2.0, 2.0]]\n2.0 1.0 2.8284",
          "[0, 1] [1.5, 0.5] [[1.0, 1.0], [4.0, 4.0]]\n2.0 4.0 2.8284",
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

def fsq_round(z, levels):
    return [round((L - 1) / 2 * math.tanh(x)) for x, L in zip(z, levels)]

def fsq_index(code, levels):
    idx, mult = 0, 1
    for c, L in zip(code, levels):
        idx += (c + (L - 1) // 2) * mult
        mult *= L
    return idx

def fsq_codebook_size(levels):
    return math.prod(levels)

print(fsq_round([0.0, 2.0, -5.0], [5, 5, 3]), fsq_round([0.3, -0.3], [7, 3]), fsq_index([0, 2, -1], [5, 5, 3]))
print(fsq_index([-2, -2, -1], [5, 5, 3]), fsq_index([2, 2, 1], [5, 5, 3]), fsq_codebook_size([5, 5, 3]), fsq_codebook_size([8, 5, 5, 5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2, -1] [1, 0] 22\n0 74 75 1000",
          "[0, 2, -1] [1, 0] 14\n0 74 75 1000",
          "[0, 1, -1] [1, 0] 22\n0 74 75 1000",
          "[0, 2, -1] [1, 0] 22\n0 75 75 1000",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>assign(points, codebook)</C>, taking the first nearest code on ties; <C>ema_update(counts, sums, points, idx, gamma)</C>,
          returning the new counts, sums and codebook as lists; and <C>perplexity(idx, K)</C> of the code usage.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def assign(points, codebook):
    return [0] * len(points)

def ema_update(counts, sums, points, idx, gamma):
    return counts, sums, sums

def perplexity(idx, K):
    return float(K)
`,
        solution: VQ,
        tests: [
          { name: "assign and perplexity", code: `assert assign([(1, 0), (2, 0), (9, 9)], [(0, 0), (4, 0), (9, 8)]) == [0, 0, 2] and assign([(5,)], [(5,), (5,)]) == [0]
assert perplexity([3, 3, 3], 4) == 1.0 and abs(perplexity([0, 1, 2, 3], 4) - 4) < 1e-12 and abs(perplexity([0, 0, 0, 1], 2) - math.exp(0.75 * math.log(4 / 3) + 0.25 * math.log(4))) < 1e-12` },
          { name: "ema", code: `c, s, cb = ema_update([2.0, 1.0], [[2.0], [5.0]], [(1.0,), (3.0,), (7.0,)], [0, 0, 1], 0.5)
assert c == [2.0, 1.0] and s == [[3.0], [6.0]] and cb == [[1.5], [6.0]]
c, s, cb = ema_update([1.0], [[0.0, 2.0]], [(4.0, 4.0)], [0], 0.0); assert c == [1.0] and cb == [[4.0, 4.0]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For odd numbers of levels, write <C>fsq_round(z, levels)</C>, <C>fsq_index(code, levels)</C> with the first coordinate
          as the least significant digit, and <C>fsq_codebook_size(levels)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fsq_round(z, levels):
    return [round(x) for x in z]

def fsq_index(code, levels):
    return sum(code)

def fsq_codebook_size(levels):
    return sum(levels)
`,
        solution: FSQ,
        tests: [
          { name: "round", code: `assert fsq_round([10.0, -10.0, 0.1], [3, 7, 9]) == [1, -3, 0] and fsq_round([0.6], [5]) == [1] and fsq_round([0.2], [5]) == [0]` },
          { name: "index and size", code: `assert fsq_index([-1, -1], [3, 3]) == 0 and fsq_index([1, 1], [3, 3]) == 8 and fsq_index([0, -1], [3, 3]) == 1 and fsq_index([-1, 0], [3, 3]) == 3
assert fsq_codebook_size([7, 5, 5, 5, 5]) == 4375 and fsq_codebook_size([3]) == 3 and fsq_index([2, 0, 1], [5, 3, 3]) == 4 + 5 + 30` },
        ],
      },
    },
    {
      key: "ppl",
      rung: "stretch",
      prompt: <p>Over a batch, a codebook of 4 entries is used with counts 6, 2, 0 and 0. What is the usage perplexity? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.755, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        VAEs and VQ-VAEs settle for a bound or a two-stage model. Normalising flows get an exact likelihood from latent
        variables by insisting that the map from code to data be invertible, and tracking how it stretches volume.
      </p>
    </>
  ),
};
