import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TokeniserBitsViz } from "@/components/viz/TokeniserBitsViz";
import type { LessonContent } from "@/lib/types";

const LFQ = `import math

def lfq_quantise(z):
    return [1 if v > 0 else -1 for v in z]                   # each latent coordinate becomes one bit

def lfq_index(bits):
    return sum(2 ** i for i, b in enumerate(bits) if b > 0)  # read the signs as a binary number

def bit_entropy(ps):
    return sum(-p * math.log2(p) - (1 - p) * math.log2(1 - p) for p in ps if 0 < p < 1)`;

const RATE = `import math
from collections import Counter

def bits_per_image(n_tokens, K):
    return n_tokens * math.log2(K)

def bpp(n_tokens, K, H, W):
    return bits_per_image(n_tokens, K) / (H * W)

def usage_perplexity(indices):
    n = len(indices)
    h = -sum(c / n * math.log2(c / n) for c in Counter(indices).values())
    return 2 ** h                                            # the number of codes effectively in use`;

export const lesson: LessonContent = {
  id: "l12.5.3",
  minutes: 50,
  links: {
    requires: ["l12.5.2", "l7.3.4"],
    revisits: ["l7.2.3", "l12.3.3"],
    foreshadows: ["l12.5.4"],
  },

  puzzle: (
    <>
      <p>
        A language model writes text one token at a time from a vocabulary of perhaps a hundred thousand entries. To let the
        same model write images, each image must be turned into a short sequence of tokens from a finite vocabulary, and
        back again. A 256 × 256 photograph holds about 1.5 million bits of raw pixels. How few tokens can describe it well
        enough, and why do large codebooks trained the obvious way end up using only a small fraction of their entries?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An image tokeniser is an autoencoder with a discrete bottleneck: an encoder shrinks the image to a grid of latent
        vectors, each is replaced by the index of a code, and a decoder rebuilds the image from the codes. The number of
        tokens and the size of the codebook fix how many bits survive; everything else the decoder must invent, and
        perceptual and adversarial losses teach it to invent plausibly rather than blurrily. Below, each tokeniser&apos;s
        budget is compared with the raw image.
      </p>
      <TokeniserBitsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the rate of a tokeniser">
        <p>
          A tokeniser that downsamples an H × W image by a factor f gives <M>{"(H/f)(W/f)"}</M> tokens, each an index into a
          codebook of K entries. It can describe at most
        </p>
        <MD>{"n \\log_2 K"}</MD>
        <p>
          bits per image (<C>bits_per_image</C>), or that divided by HW bits per pixel (<C>bpp</C>). The vector-quantised
          autoencoder of the earlier lesson is the basic instance: nearest-neighbour lookup in a learned codebook with a
          straight-through gradient and commitment loss.
        </p>
        <Code>{RATE}</Code>
      </Definition>

      <Example title="VQGAN">
        <p>
          A VQ-VAE trained with pixel loss alone at f = 16 gives blurry reconstructions, because the mean of the plausible
          details is a blur. VQGAN adds a perceptual loss, a distance between deep features of the image and its
          reconstruction, and a patch discriminator, so the decoder fills in sharp texture consistent with the codes. With K
          = 1024 a 256 × 256 image becomes 256 tokens, 2560 bits, and a transformer trained on these sequences generates
          images autoregressively. The same perceptual and adversarial training sits behind the continuous autoencoders of
          latent diffusion.
        </p>
      </Example>

      <Definition title="codebook usage">
        <p>
          The codebook is used well when its entries are chosen about equally often over the data. The usage perplexity{" "}
          <M>{"2^{H}"}</M>, with H the entropy in bits of the empirical distribution of chosen indices (<C>usage_perplexity</C>),
          is the number of codes effectively in use. A tokeniser whose perplexity is far below K wastes its rate:{" "}
          <M>{"\\log_2"}</M> of the perplexity is the number of bits per token it actually carries.
        </p>
      </Definition>

      <Remark title="why large codebooks collapse">
        <p>
          Only the code nearest to some encoder output receives a gradient. Codes initialised far from the data are never
          chosen, never move, and stay dead, while the encoder learns to land near the few that work. Enlarging K then adds
          dead entries rather than rate, which is why plain VQ stalls at a few thousand useful codes. Remedies include
          resetting dead codes to recent encoder outputs, lower-dimensional and normalised lookup, and removing the learned
          codebook altogether.
        </p>
      </Remark>

      <Definition title="lookup-free quantisation">
        <p>
          LFQ, used in MAGVIT-v2, takes a latent of d coordinates and quantises each to its sign (<C>lfq_quantise</C>). The
          code is the binary number formed by the signs (<C>lfq_index</C>), so the codebook is the <M>{"2^d"}</M> corners of
          a cube, fixed and fully reachable, with no nearest-neighbour search. Finite scalar quantisation, from the earlier
          lesson, is the same idea with more than two levels per coordinate. To make the codes informative, training adds an
          entropy penalty: the entropy of each sample&apos;s soft assignment should be low, so that it commits to a code,
          while the entropy of the assignment averaged over the batch should be high, so that all codes are used.
        </p>
        <Code>{LFQ}</Code>
      </Definition>

      <Theorem title="the entropy of independent bits adds">
        <p>
          If the d bits of an LFQ code are independent with probabilities <M>{"p_1, \\dots, p_d"}</M> of being positive, the
          entropy of the code over all <M>{"2^d"}</M> values is
        </p>
        <MD>{"H = \\sum_{i=1}^d h(p_i), \\quad h(p) = -p \\log_2 p - (1-p) \\log_2 (1-p)"}</MD>
        <p>
          (<C>bit_entropy</C>). It equals d, full use of the codebook, exactly when every <M>{"p_i = 1/2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The probability of a code b is the product <M>{"\\prod_i q_i(b_i)"}</M>, with <M>{"q_i(1) = p_i"}</M> and{" "}
          <M>{"q_i(0) = 1 - p_i"}</M>. Its logarithm is the sum of the <M>{"\\log_2 q_i(b_i)"}</M>, and the expectation of a
          sum is the sum of expectations, each of which is <M>{"-h(p_i)"}</M>. Each h is at most 1, with equality only at
          one half, so H = d exactly when all bits are fair. This is why the batch-entropy term can be computed in O(d)
          rather than over <M>{"2^{18}"}</M> codes when the bits are treated as independent; real implementations compute
          it over groups of bits to capture some dependence.
        </p>
      </Proof>

      <Example title="one-dimensional tokenisers">
        <p>
          A grid of tokens spends the same budget on sky as on faces. TiTok instead appends 32 learned query tokens to the
          patch tokens of a vision transformer and keeps only those queries as the latent, so the tokens are an ordered
          sequence free of the grid. With K = 4096 a 256 × 256 image costs 384 bits, and generators trained on these
          sequences are several times faster than on a 16 × 16 grid at similar quality. Fewer bits always mean more
          invention by the decoder: reconstructions keep the layout and identity but not the exact texture.
        </p>
      </Example>

      <Remark title="choosing the rate">
        <p>
          Reconstruction improves with the rate, but generation need not: a generator must model every bit the tokeniser
          keeps, and a rate high enough to record noise-like texture makes the token sequence harder to predict. As with the
          compression factor of latent diffusion, the best tokeniser for generation is the one that keeps what the generator
          can learn and leaves the rest to the decoder.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bits",
      rung: "check",
      prompt: <p>An LFQ tokeniser with d = 18 and downsampling factor 16 encodes a 512 × 512 image. How many bits does it keep?</p>,
      answer: { kind: "numeric", value: 18432, tolerance: 0 },
    },
    {
      key: "usage",
      rung: "check",
      prompt: (
        <p>
          A VQ tokeniser has K = 16384 codes, but over the data it uses only 1024 of them, each equally often. How many bits
          per token does it actually carry?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0 },
    },
    {
      key: "entropy",
      rung: "apply",
      prompt: <p>What does the LFQ entropy penalty ask of the soft code assignments?</p>,
      answer: {
        kind: "choice",
        options: [
          "Low entropy for each sample, so it commits to a code, and high entropy averaged over the batch, so all codes are used",
          "High entropy for each sample and low entropy over the batch",
          "Low entropy both for each sample and over the batch",
          "That every latent coordinate be exactly zero",
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

def lfq_quantise(z):
    return [1 if v > 0 else -1 for v in z]                   # each latent coordinate becomes one bit

def lfq_index(bits):
    return sum(2 ** i for i, b in enumerate(bits) if b > 0)  # read the signs as a binary number

def bit_entropy(ps):
    return sum(-p * math.log2(p) - (1 - p) * math.log2(1 - p) for p in ps if 0 < p < 1)

q = lfq_quantise([0.3, -1.2, 0.0, 2.5])
print(q, lfq_index(q), round(bit_entropy([0.5, 0.5, 0.9]), 4), bit_entropy([0.5] * 18))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, -1, -1, 1] 9 2.469 18.0",
          "[1, -1, 1, 1] 13 2.469 18.0",
          "[1, -1, -1, 1] 6 2.469 18.0",
          "[1, -1, -1, 1] 9 2.9 9.0",
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
from collections import Counter

def bits_per_image(n_tokens, K):
    return n_tokens * math.log2(K)

def bpp(n_tokens, K, H, W):
    return bits_per_image(n_tokens, K) / (H * W)

def usage_perplexity(indices):
    n = len(indices)
    h = -sum(c / n * math.log2(c / n) for c in Counter(indices).values())
    return 2 ** h                                            # the number of codes effectively in use

print(bits_per_image(256, 1024), round(bpp(32, 4096, 256, 256), 5))
print(usage_perplexity([3, 3, 3, 3]), usage_perplexity([0, 1, 2, 3, 0, 1, 2, 3]), round(usage_perplexity([0, 0, 1, 2]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2560.0 0.00586\n1.0 4.0 2.8284",
          "2560.0 0.00586\n4.0 8.0 3.0",
          "10240.0 0.00586\n1.0 4.0 2.8284",
          "2560.0 0.04688\n1.0 4.0 1.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lfq_quantise(z)</C>, mapping positive coordinates to 1 and the rest to -1, <C>lfq_index(bits)</C> reading
          bit i as <M>{"2^i"}</M>, and <C>bit_entropy(ps)</C>, the entropy in bits of independent bits with the given
          probabilities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def lfq_quantise(z):
    return z

def lfq_index(bits):
    return 0

def bit_entropy(ps):
    return 0.0
`,
        solution: LFQ,
        tests: [
          { name: "quant", code: `assert lfq_quantise([0.5, -0.1, 0.0]) == [1, -1, -1] and lfq_index([1, -1, 1]) == 5` },
          { name: "ent", code: `assert abs(bit_entropy([0.5, 0.25]) - 1.811278124459133) < 1e-9 and bit_entropy([1.0, 0.0]) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bits_per_image(n_tokens, K)</C>, <C>bpp(n_tokens, K, H, W)</C>, and <C>usage_perplexity(indices)</C>, two
          to the power of the entropy in bits of the empirical distribution of the indices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from collections import Counter

def bits_per_image(n_tokens, K):
    return n_tokens

def bpp(n_tokens, K, H, W):
    return n_tokens / (H * W)

def usage_perplexity(indices):
    return float(len(indices))
`,
        solution: RATE,
        tests: [
          { name: "rate", code: `assert bits_per_image(16, 256) == 128 and abs(bpp(64, 1024, 32, 32) - 0.625) < 1e-12` },
          { name: "ppl", code: `assert abs(usage_perplexity([1, 1, 2, 2]) - 2) < 1e-9 and abs(usage_perplexity([5, 5, 5]) - 1) < 1e-9` },
        ],
      },
    },
    {
      key: "skew",
      rung: "stretch",
      prompt: (
        <p>
          In an LFQ tokeniser with d = 18, each bit is independently positive with probability 0.9 over the data. What is the
          usage perplexity of the codebook, to the nearest whole number?
        </p>
      ),
      answer: { kind: "numeric", value: 348, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        With images as tokens from a vocabulary, nothing stops a single transformer from reading and writing text and image
        tokens in one sequence. Natively multimodal models do exactly this, and must decide whether images are best
        generated token by token or by diffusion inside the same network.
      </p>
    </>
  ),
};
