import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SnrShiftViz } from "@/components/viz/SnrShiftViz";
import type { LessonContent } from "@/lib/types";

const LATENT = `def latent_shape(h, w, f, c):
    return h // f, w // f, c

def compression(h, w, f, c):
    lh, lw, lc = latent_shape(h, w, f, c)
    return (h * w * 3) / (lh * lw * lc)                        # RGB numbers per latent number

def attention_ratio(h, w, f, p):
    n_pix = (h // p) * (w // p)                                # tokens from p-by-p patches of pixels
    n_lat = (h // f // p) * (w // f // p)                      # tokens from p-by-p patches of latents
    return (n_pix / n_lat) ** 2                                # attention cost grows with tokens squared`;

const SNR = `import math

def scale_factor(xs):
    m = sum(xs) / len(xs)
    return 1 / math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))

def log_snr(t, data_std):
    return 2 * math.log(data_std * (1 - t) / t)                # straight path, t = 1 is pure noise

def shift_time(t, k):
    return k * t / (1 + (k - 1) * t)`;

export const lesson: LessonContent = {
  id: "l12.3.3",
  minutes: 55,
  links: {
    requires: ["l12.3.2", "l4.2.3"],
    revisits: ["l7.3.4", "l7.1.3"],
    foreshadows: ["l12.4.1"],
  },

  puzzle: (
    <>
      <p>
        A 512 by 512 colour image has 786,432 numbers. A diffusion model on pixels runs a large network on all of them at
        every one of dozens of sampling steps, and most of its capacity goes into details no viewer would notice: the exact
        grain of a texture, the precise value of a pixel in a smooth sky. Stable Diffusion runs on a laptop. What did it
        throw away, how does it get it back, and what must change in the noise schedule when the data are no longer pixels?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Split the work. An autoencoder learns, once, to compress images into a small grid of latent vectors and decompress
        them with sharp, realistic detail, using perceptual and adversarial losses so that what it drops is what people do
        not see. The diffusion model then works only in that grid, where every number carries meaning. The schedule must be
        adapted to the new data: what matters is not the time t but the signal-to-noise ratio, and that depends on the scale
        of the latents and on how many numbers share the same signal.
      </p>
      <SnrShiftViz />
    </>
  ),

  theory: (
    <>
      <Definition title="latent diffusion">
        <p>
          Train an encoder E and decoder D so that <M>{"D(E(x)) \\approx x"}</M>, with E mapping an h × w × 3 image to an{" "}
          (h/f) × (w/f) × c latent (<C>latent_shape</C>, <C>compression</C>). The loss combines a pixel reconstruction term, a
          perceptual term comparing deep features, a patch-wise adversarial term, and a light regulariser on the latents:
          either a KL term towards <M>{"\\mathcal{N}(0, I)"}</M> with a tiny weight or vector quantisation as in l7.3.4. Then train
          any diffusion or flow model on <M>{"z = E(x)"}</M>, and sample by generating z and decoding <M>{"D(z)"}</M>.
        </p>
        <Code>{LATENT}</Code>
      </Definition>

      <Theorem title="what the compression saves">
        <p>
          Downsampling by f reduces the number of spatial positions by <M>{"f^2"}</M>. For a transformer that splits its input
          into p × p patches, the token count falls by <M>{"f^2"}</M> and the cost of attention, quadratic in tokens, by{" "}
          <M>{"f^4"}</M> (<C>attention_ratio</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The pixel image yields <M>{"(h/p)(w/p)"}</M> patches and the latent <M>{"(h/(fp))(w/(fp))"}</M>, a ratio of{" "}
          <M>{"f^2"}</M> when f and p divide the sides. Attention compares every pair of tokens, so its cost scales with the
          square of this ratio. Feed-forward and convolution costs scale linearly with positions, saving <M>{"f^2"}</M> at
          equal width.
        </p>
      </Proof>

      <Remark title="perceptual and semantic compression">
        <p>
          Rombach and colleagues observed that a likelihood-trained pixel model spends most of its bits on imperceptible
          detail, the point of l7.1.3 that likelihood and sample quality measure different things. The autoencoder takes over
          this perceptual compression with losses designed for it; the diffusion model handles the semantic part, the
          composition and content. Stable Diffusion uses f = 8 and c = 4, so a 512 × 512 image becomes a 64 × 64 × 4 latent,
          48 times fewer numbers; Stable Diffusion 3 and Flux use c = 16 to reconstruct fine detail and text better, at the
          price of a latent that is harder to model.
        </p>
      </Remark>

      <Theorem title="scale is part of the schedule">
        <p>
          For the straight path <M>{"x_t = (1 - t)\\, x_0 + t\\, \\varepsilon"}</M> with data of standard deviation s per
          coordinate, the signal-to-noise ratio is <M>{"s^2 (1 - t)^2/t^2"}</M> (<C>log_snr</C>). Multiplying the data by a
          constant k adds <M>{"2 \\log k"}</M> to the log ratio at every t.
        </p>
      </Theorem>
      <Proof>
        <p>
          The signal part <M>{"(1 - t) x_0"}</M> has variance <M>{"(1 - t)^2 s^2"}</M> and the noise part variance{" "}
          <M>{"t^2"}</M>. Replacing s by ks multiplies the ratio by <M>{"k^2"}</M>. Schedules are designed for unit variance, so
          latents are multiplied by the reciprocal of their standard deviation over the training set (<C>scale_factor</C>);
          Stable Diffusion&apos;s factor 0.18215 is of this kind.
        </p>
      </Proof>

      <Theorem title="higher resolution needs a shifted schedule">
        <p>
          Suppose m coordinates share the same signal and carry independent noise. Their average has signal-to-noise ratio m
          times that of one coordinate. The time shift <M>{"t' = kt/(1 + (k - 1)t)"}</M> (<C>shift_time</C>) subtracts{" "}
          <M>{"2 \\log k"}</M> from the log ratio of the straight path at every t, so k = √m restores the single-coordinate
          curve.
        </p>
      </Theorem>
      <Proof>
        <p>
          The average keeps the signal and divides the noise variance by m. For the shift,{" "}
          <M>{"(1 - t')/t' = (1 + (k - 1)t - kt)/(kt) = (1 - t)/(kt)"}</M>, and squaring and taking logs subtracts{" "}
          <M>{"2 \\log k"}</M>.
        </p>
        <Code>{SNR}</Code>
      </Proof>

      <Example title="reading the figure">
        <p>
          Neighbouring pixels of a large image are nearly equal, so its coarse structure behaves like an average of many
          coordinates and survives far more noise than a small image does under the same schedule. The model then wastes its
          early steps on images whose layout is already visible. Stable Diffusion 3 trains and samples at 1024 × 1024 with
          the shift k = 3, the same correction as in the figure. The theorem idealises the coordinates as sharing the
          signal exactly; real neighbouring latents are only correlated, so in practice k is tuned.
        </p>
      </Example>

      <Definition title="conditioning by cross-attention">
        <p>
          Text enters through cross-attention: queries come from the latent&apos;s feature maps and keys and values from the
          token embeddings of a frozen text encoder, such as CLIP&apos;s (l12.5.1) or T5&apos;s. Each image position can thus
          look up the words relevant to it. Classifier-free guidance of l12.3.2 is applied unchanged, with the empty prompt as
          the null condition.
        </p>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "comp",
      rung: "check",
      prompt: <p>A 1024 × 1024 RGB image is encoded with f = 8 and c = 16. By what factor does the number of values shrink?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
    {
      key: "shift",
      rung: "check",
      prompt: <p>With shift k = 3, what time t&apos; replaces t = 0.4?</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0005 },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: <p>Why are latents rescaled to unit variance before diffusion training?</p>,
      answer: {
        kind: "choice",
        options: [
          "The noise schedule fixes signal-to-noise ratios assuming unit-variance data; another scale shifts every ratio",
          "The decoder only accepts unit-variance inputs",
          "It makes the KL regulariser vanish",
          "It reduces the number of latent channels",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def latent_shape(h, w, f, c):
    return h // f, w // f, c

def compression(h, w, f, c):
    lh, lw, lc = latent_shape(h, w, f, c)
    return (h * w * 3) / (lh * lw * lc)                        # RGB numbers per latent number

def attention_ratio(h, w, f, p):
    n_pix = (h // p) * (w // p)                                # tokens from p-by-p patches of pixels
    n_lat = (h // f // p) * (w // f // p)                      # tokens from p-by-p patches of latents
    return (n_pix / n_lat) ** 2                                # attention cost grows with tokens squared

s = latent_shape(512, 512, 8, 4); r = compression(512, 512, 8, 4)
print(s, r, attention_ratio(512, 512, 8, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(64, 64, 4) 48.0 4096.0",
          "(64, 64, 4) 48.0 64.0",
          "(64, 64, 4) 16.0 4096.0",
          "(512, 512, 4) 48.0 4096.0",
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

def scale_factor(xs):
    m = sum(xs) / len(xs)
    return 1 / math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))

def log_snr(t, data_std):
    return 2 * math.log(data_std * (1 - t) / t)                # straight path, t = 1 is pure noise

def shift_time(t, k):
    return k * t / (1 + (k - 1) * t)

t2 = shift_time(0.5, 3.0); k = scale_factor([0.0, 4.0, 0.0, 4.0])
print(t2, k, round(log_snr(0.5, 1.0), 4), round(log_snr(t2, 1.0) - log_snr(0.5, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0.5 0.0 -2.1972",
          "0.75 0.25 0.0 -2.1972",
          "0.75 0.5 0.0 2.1972",
          "0.6 0.5 0.0 -2.1972",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>latent_shape(h, w, f, c)</C>, <C>compression(h, w, f, c)</C> for RGB inputs, and{" "}
          <C>attention_ratio(h, w, f, p)</C>, the ratio of attention costs for p × p patches of pixels and of latents.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def latent_shape(h, w, f, c):
    return h, w, c

def compression(h, w, f, c):
    return f

def attention_ratio(h, w, f, p):
    return f * f
`,
        solution: LATENT,
        tests: [
          { name: "shape", code: `assert tuple(latent_shape(256, 128, 4, 3)) == (64, 32, 3) and abs(compression(256, 128, 4, 3) - 16.0) < 1e-12` },
          { name: "attn", code: `assert abs(attention_ratio(256, 256, 4, 2) - 256.0) < 1e-12 and abs(attention_ratio(64, 32, 2, 1) - 16.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>scale_factor(xs)</C>, the reciprocal of the population standard deviation; <C>log_snr(t, data_std)</C> for
          the straight path; and <C>shift_time(t, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def scale_factor(xs):
    return 1.0

def log_snr(t, data_std):
    return math.log((1 - t) / t)

def shift_time(t, k):
    return t
`,
        solution: SNR,
        tests: [
          { name: "scale", code: `import math\nassert abs(scale_factor([1.0, 3.0, 1.0, 3.0]) - 1.0) < 1e-12 and abs(scale_factor([0.0, 10.0]) - 0.2) < 1e-12\nassert abs(log_snr(0.2, 2.0) - 2 * math.log(8.0)) < 1e-12` },
          { name: "shift", code: `import math\nassert abs(shift_time(0.2, 4.0) - 0.5) < 1e-12\nfor t in (0.1, 0.5, 0.9):\n    assert abs(log_snr(shift_time(t, 2.0), 1.0) - log_snr(t, 1.0) + 2 * math.log(2.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "zero",
      rung: "stretch",
      prompt: (
        <p>
          Latents with standard deviation 5 are used without rescaling on the straight path. At what t does the log
          signal-to-noise ratio cross zero?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8333, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the work moved into a latent grid, the network itself became the bottleneck. The convolutional U-Nets of the
        first latent diffusion models gave way to transformers operating on latent patches, which scale predictably with
        compute, the subject of the next chapter.
      </p>
    </>
  ),
};
