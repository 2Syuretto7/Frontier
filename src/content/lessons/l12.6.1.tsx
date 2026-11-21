import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DelayPatternViz } from "@/components/viz/DelayPatternViz";
import type { LessonContent } from "@/lib/types";

const CODEC = `import math

def bitrate(sr, hop, n_q, K):
    return sr / hop * n_q * math.log2(K)                   # frames per second times bits per frame

def rvq_encode(x, codebooks):
    idx, rec = [], 0.0
    for cb in codebooks:
        k = min(range(len(cb)), key=lambda i: abs(x - rec - cb[i]))   # quantise what is left
        idx.append(k)
        rec += cb[k]
    return idx, rec

def rvq_decode(idx, codebooks):
    return sum(cb[k] for k, cb in zip(idx, codebooks))`;

const STREAMS = `def flatten(codes):
    return [codes[q][t] for t in range(len(codes[0])) for q in range(len(codes))]   # frame by frame

def delay_grid(T, n_q):
    return [[t + q for t in range(T)] for q in range(n_q)]  # codebook q is generated q steps late

def n_steps(T, n_q, pattern):
    return {"flat": T * n_q, "parallel": T, "delay": T + n_q - 1}[pattern]`;

export const lesson: LessonContent = {
  id: "l12.6.1",
  minutes: 50,
  links: {
    requires: ["l12.5.3", "l7.2.3"],
    revisits: ["l7.3.4", "l12.5.4"],
    foreshadows: ["l12.6.2", "l12.6.3"],
  },

  puzzle: (
    <>
      <p>
        Speech at 24 kHz is 24,000 numbers a second. A language model that predicted them one by one would need 240,000
        steps for ten seconds of talk, and a pixel-style codebook would not capture the structure of sound. A telephone codec
        squeezes speech into a few kilobits per second, but its bits were designed for ears, not for a model to predict. How
        can sound become a short sequence of tokens that a transformer can both read and write?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Train an autoencoder on waveforms whose encoder downsamples time by a few hundred, giving tens of frames per second.
        Quantise each frame with a stack of codebooks, each coding what the previous ones missed, so that the first codebook
        carries the coarse content and later ones add detail. A frame is then several tokens, one per codebook, and a
        generator must decide in what order to produce them.
      </p>
      <DelayPatternViz />
    </>
  ),

  theory: (
    <>
      <Definition title="neural audio codec">
        <p>
          SoundStream and EnCodec encode a waveform at sample rate <M>{"f_s"}</M> with strided convolutions of total stride h,
          giving <M>{"f_s / h"}</M> frames per second; at 24 kHz with h = 320 that is 75. Each frame is quantised by residual
          vector quantisation with <M>{"n_q"}</M> codebooks of K entries (<C>rvq_encode</C>, <C>rvq_decode</C>), and a
          convolutional decoder rebuilds the waveform. The bitrate is
          <MD>{"\\frac{f_s}{h}\\, n_q \\log_2 K"}</MD>
          (<C>bitrate</C>): eight codebooks of 1024 at 75 Hz give 6 kbps. Training combines reconstruction losses on the
          waveform and on spectrograms at several resolutions with adversarial and feature-matching losses, for the same
          reason as in image tokenisers: plausible detail rather than an average.
        </p>
        <Code>{CODEC}</Code>
      </Definition>

      <Theorem title="each stage can only help">
        <p>
          If every codebook contains the zero vector, the error <M>{"\\lVert x - \\hat x_m \\rVert"}</M> of residual
          quantisation after m stages is non-increasing in m.
        </p>
      </Theorem>
      <Proof>
        <p>
          Stage m + 1 picks the code c nearest to the residual <M>{"r = x - \\hat x_m"}</M>, and the new error is{" "}
          <M>{"\\lVert r - c \\rVert"}</M>. Choosing the zero code would leave the error at <M>{"\\lVert r \\rVert"}</M>, and the
          nearest code does at least as well. Learned codebooks need not contain zero exactly, but training drives each stage
          to reduce the residual, and in practice the error falls steadily with the number of codebooks used.
        </p>
      </Proof>

      <Definition title="quantiser dropout">
        <p>
          During training, SoundStream samples a number of codebooks <M>{"m \\le n_q"}</M> for each batch and decodes from
          the first m only. The decoder learns to work from any prefix, so one model serves every bitrate from a few to
          eighteen kilobits per second, and the coarse-to-fine ordering of the codebooks is enforced rather than hoped for.
        </p>
      </Definition>

      <Definition title="semantic and acoustic tokens">
        <p>
          Codec tokens describe sound faithfully but say little directly about what is being said; a model trained on them
          alone babbles plausible-sounding syllables. AudioLM added semantic tokens, k-means cluster indices of features
          from a self-supervised speech model at 25 Hz, and generated in stages: semantic tokens first for long-range
          structure, then codec tokens conditioned on them for voice and acoustics. Mimi, the codec of Moshi, folds both
          into one stream: 12.5 frames per second, eight codebooks of 2048, with the first codebook trained to predict
          self-supervised speech features so that it carries the semantic content.
        </p>
      </Definition>

      <Definition title="modelling several codebooks">
        <p>
          A clip of T frames gives an <M>{"n_q \\times T"}</M> grid of tokens. Flattening it frame by frame (<C>flatten</C>)
          gives an exact autoregressive model in <M>{"T n_q"}</M> steps. Predicting all codebooks of a frame in one step
          takes T steps but treats them as independent given the past. The delay pattern of MusicGen generates codebook q of
          frame t at step t + q (<C>delay_grid</C>), several codebooks at once from different frames, in{" "}
          <M>{"T + n_q - 1"}</M> steps (<C>n_steps</C>).
        </p>
        <Code>{STREAMS}</Code>
      </Definition>

      <Theorem title="what the delay pattern conditions on">
        <p>
          Under the delay pattern, the token for codebook q of frame t is generated after every token of the same frame from
          coarser codebooks, and after every token of earlier frames from codebooks no finer than q.
        </p>
      </Theorem>
      <Proof>
        <p>
          Token (t&apos;, q&apos;) is generated at step t&apos; + q&apos;, strictly before step t + q exactly when t&apos; +
          q&apos; &lt; t + q. If t&apos; = t and q&apos; &lt; q this holds, and likewise if t&apos; &lt; t and q&apos; ≤ q.
          What is lost relative to flattening are the finer codebooks of recent frames, such as codebook q + 1 of frame t − 1,
          which are generated at the same step or later; since fine codebooks carry little information, little quality is
          lost for a speed-up of nearly <M>{"n_q"}</M> times.
        </p>
      </Proof>

      <Remark title="the cost of tokens per second">
        <p>
          A transformer&apos;s cost grows with sequence length, so the frame rate matters more than the bitrate: 75 frames
          per second with eight codebooks is 600 tokens a second if flattened, while Mimi&apos;s 12.5 Hz makes a minute of
          speech 750 frames, short enough for a dialogue model to hold several minutes in context.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: (
        <p>
          A codec runs at 12.5 frames per second with eight codebooks of 2048 entries each. What is its bitrate in bits per
          second?
        </p>
      ),
      answer: { kind: "numeric", value: 1100, tolerance: 0 },
    },
    {
      key: "steps",
      rung: "check",
      prompt: (
        <p>
          Ten seconds of audio are coded at 50 frames per second with four codebooks. How many steps does the delay pattern
          need to generate it?
        </p>
      ),
      answer: { kind: "numeric", value: 503, tolerance: 0 },
    },
    {
      key: "dropout",
      rung: "apply",
      prompt: <p>What does quantiser dropout give a codec?</p>,
      answer: {
        kind: "choice",
        options: [
          "One model that decodes from any prefix of its codebooks, and so works at many bitrates",
          "A larger codebook with the same number of bits",
          "Protection against overfitting of the decoder by dropping frames",
          "Semantic tokens without a self-supervised model",
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

def bitrate(sr, hop, n_q, K):
    return sr / hop * n_q * math.log2(K)                   # frames per second times bits per frame

def rvq_encode(x, codebooks):
    idx, rec = [], 0.0
    for cb in codebooks:
        k = min(range(len(cb)), key=lambda i: abs(x - rec - cb[i]))   # quantise what is left
        idx.append(k)
        rec += cb[k]
    return idx, rec

def rvq_decode(idx, codebooks):
    return sum(cb[k] for k, cb in zip(idx, codebooks))

cbs = [[-1.0, 0.0, 1.0], [-0.25, 0.0, 0.25]]; idx, rec = rvq_encode(0.8, cbs)
print(idx, rec, rvq_decode([0, 1], cbs), bitrate(24000, 320, 8, 1024))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 0] 0.75 -1.0 6000.0",
          "[2, 1] 1.0 -1.0 6000.0",
          "[2, 0] 0.75 -1.25 6000.0",
          "[2, 0] 0.75 -1.0 7500.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def flatten(codes):
    return [codes[q][t] for t in range(len(codes[0])) for q in range(len(codes))]   # frame by frame

def delay_grid(T, n_q):
    return [[t + q for t in range(T)] for q in range(n_q)]  # codebook q is generated q steps late

def n_steps(T, n_q, pattern):
    return {"flat": T * n_q, "parallel": T, "delay": T + n_q - 1}[pattern]

print(flatten([[1, 2, 3], [4, 5, 6]]), delay_grid(3, 2))
print(n_steps(750, 4, "flat"), n_steps(750, 4, "delay"), n_steps(750, 4, "parallel"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 4, 2, 5, 3, 6] [[0, 1, 2], [1, 2, 3]]\n3000 753 750",
          "[1, 2, 3, 4, 5, 6] [[0, 1, 2], [1, 2, 3]]\n3000 753 750",
          "[1, 4, 2, 5, 3, 6] [[0, 1, 2], [0, 1, 2]]\n3000 754 750",
          "[1, 4, 2, 5, 3, 6] [[0, 1, 2], [1, 2, 3]]\n750 753 3000",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bitrate(sr, hop, n_q, K)</C> in bits per second, and scalar residual quantisation: <C>rvq_encode(x,
          codebooks)</C> returning the chosen indices and the reconstruction, and <C>rvq_decode(idx, codebooks)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bitrate(sr, hop, n_q, K):
    return sr / hop

def rvq_encode(x, codebooks):
    return [], 0.0

def rvq_decode(idx, codebooks):
    return 0.0
`,
        solution: CODEC,
        tests: [
          { name: "rate", code: `assert abs(bitrate(16000, 320, 4, 1024) - 2000) < 1e-9` },
          { name: "rvq", code: `cbs = [[0.0, 2.0], [0.0, 0.5]]\nassert rvq_encode(2.4, cbs) == ([1, 1], 2.5) and rvq_decode([1, 0], cbs) == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For codes given as <C>codes[q][t]</C>, write <C>flatten(codes)</C> frame by frame, <C>delay_grid(T, n_q)</C> giving
          the step of each token under the delay pattern, and <C>n_steps(T, n_q, pattern)</C> for &quot;flat&quot;,
          &quot;parallel&quot; and &quot;delay&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flatten(codes):
    return sum(codes, [])

def delay_grid(T, n_q):
    return [[t for t in range(T)] for q in range(n_q)]

def n_steps(T, n_q, pattern):
    return T
`,
        solution: STREAMS,
        tests: [
          { name: "grid", code: `assert flatten([[1, 2], [3, 4], [5, 6]]) == [1, 3, 5, 2, 4, 6] and delay_grid(2, 3) == [[0, 1], [1, 2], [2, 3]]` },
          { name: "steps", code: `assert n_steps(10, 3, "delay") == 12 and n_steps(10, 3, "flat") == 30` },
        ],
      },
    },
    {
      key: "song",
      rung: "stretch",
      prompt: (
        <p>
          A two-minute song is coded at 50 frames per second with four codebooks. How many more steps does flattening take
          than the delay pattern?
        </p>
      ),
      answer: { kind: "numeric", value: 17997, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tokens let a model write speech. Reading it, turning a waveform into text, is the older problem of speech
        recognition, where the difficulty is that nobody tells the model which stretch of audio belongs to which letter.
      </p>
    </>
  ),
};
