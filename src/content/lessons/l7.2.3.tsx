import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResidualVqViz } from "@/components/viz/ResidualVqViz";
import type { LessonContent } from "@/lib/types";

const SCALAR = `def quantise(x, lo, hi, levels):
    i = int((x - lo) / (hi - lo) * levels)
    return min(max(i, 0), levels - 1)

def dequantise(i, lo, hi, levels):
    return lo + (i + 0.5) * (hi - lo) / levels

def vq_assign(points, codebook):
    return [min(range(len(codebook)), key=lambda k: sum((u - v) ** 2 for u, v in zip(p, codebook[k])))
            for p in points]`;

const RESIDUAL = `def nearest(v, codebook):
    best, bd = 0, float("inf")
    for k, c in enumerate(codebook):
        d = sum((a - b) ** 2 for a, b in zip(v, c))
        if d < bd:
            best, bd = k, d
    return best

def rvq_encode(v, codebooks):
    codes, r = [], list(v)
    for cb in codebooks:
        k = nearest(r, cb)
        codes.append(k)
        r = [a - b for a, b in zip(r, cb[k])]
    return codes

def rvq_decode(codes, codebooks):
    out = [0] * len(codebooks[0][0])
    for k, cb in zip(codes, codebooks):
        out = [a + b for a, b in zip(out, cb[k])]
    return out`;

export const lesson: LessonContent = {
  id: "l7.2.3",
  minutes: 40,
  links: {
    requires: ["l7.2.2", "l5.1.1"],
    revisits: ["l5.1.2", "m12.6.3"],
    foreshadows: ["l7.3.4", "l12.5.3", "l12.6.1"],
  },

  puzzle: (
    <>
      <p>
        A transformer reads a sequence of tokens from a fixed vocabulary and predicts the next one. Text arrives in that form
        after byte-pair encoding. A photograph does not: it is three million numbers between 0 and 255. Ten seconds of audio
        is 240 000 numbers. Yet the same next-token architecture now generates text, images, speech and music. What has to be
        done to an image or a sound to make it look like text, and what is lost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two things: make the values discrete, and make the sequence short. Discreteness comes from quantisation, rounding
        each value or each small vector to the nearest entry of a codebook. Shortness matters because the cost of attention
        grows with the square of the sequence length: one token per audio sample would make ten seconds of speech a quarter of
        a million tokens long.
      </p>
      <p>
        The tension is between the number of tokens, the size of the vocabulary and the fidelity of the reconstruction. Vector
        quantisation packs many numbers into one token; residual quantisation then refines the leftover error with further
        small codebooks, which buys fidelity without an enormous vocabulary.
      </p>
      <ResidualVqViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scalar quantisation">
        <p>
          A uniform quantiser with L levels on [lo, hi] maps x to the index of its bin of width{" "}
          <M>{"\\Delta = (\\text{hi} - \\text{lo}) / L"}</M>, clamping values outside the range (<C>quantise</C>), and decodes an
          index to its bin centre (<C>dequantise</C>). An 8-bit pixel is already quantised this way; μ-law audio (l7.2.2) first
          warps the amplitude so that bins are finer near zero.
        </p>
        <Code>{SCALAR}</Code>
      </Definition>

      <Theorem title="quantisation noise">
        <p>
          If x is spread smoothly enough that within each bin it is close to uniform, the mean squared error of uniform
          quantisation is <M>{"\\Delta^2 / 12"}</M>. Each extra bit halves Δ and divides the error by 4, about 6.02 dB.
        </p>
      </Theorem>
      <Proof>
        <p>
          Within a bin the error <M>{"x - \\hat x"}</M> is uniform on <M>{"[-\\Delta/2, \\Delta/2]"}</M>, whose second moment is{" "}
          <M>{"\\frac{1}{\\Delta} \\int_{-\\Delta/2}^{\\Delta/2} e^2\\, de = \\frac{\\Delta^2}{12}"}</M>. Averaging over bins gives the
          same value. Doubling L halves Δ, and <M>{"10 \\log_{10} 4 \\approx 6.02"}</M>.
        </p>
      </Proof>

      <Definition title="vector quantisation">
        <p>
          A <em>vector quantiser</em> maps a vector to the index of the nearest of K code vectors (<C>vq_assign</C>), costing{" "}
          <M>{"\\log_2 K"}</M> bits however many numbers the vector holds. The codebook is fitted by k-means. Image GPT (Chen and
          others, 2020) clustered RGB colours into 512 codes, so a 32 by 32 image became 1024 tokens; later image tokenisers
          quantise learned feature vectors of whole patches, a 16 by 16 grid of tokens for a 256 by 256 image (l7.3.4).
        </p>
      </Definition>

      <Definition title="residual vector quantisation">
        <p>
          Residual quantisation with M codebooks of K vectors encodes v by choosing the nearest code in the first codebook,
          subtracting it, quantising the residual with the second, and so on (<C>nearest</C>, <C>rvq_encode</C>); decoding adds
          the chosen codes (<C>rvq_decode</C>). It addresses <M>{"K^M"}</M> reconstructions with M log₂ K bits while storing and
          searching only MK vectors. Neural audio codecs such as SoundStream and EnCodec use it: an encoder turns audio into
          about 75 vectors a second, each quantised by 8 codebooks of 1024 entries, 6 kilobits a second.
        </p>
        <Code>{RESIDUAL}</Code>
      </Definition>

      <Remark title="laying out the tokens">
        <p>
          Residual codes give several tokens per time step. A model can flatten them into one long sequence, predict the
          coarse code first and the finer ones conditioned on it, or predict all codebooks of a step in parallel with a small
          delay between them. The choice trades sequence length against modelling accuracy, the same trade-off as in choosing a
          vocabulary for text (l5.1.2).
        </p>
      </Remark>

      <Remark title="what tokenisation costs">
        <p>
          Every tokeniser sets a ceiling: the model can never generate detail that the decoder cannot reconstruct from codes.
          It also shapes what is easy to learn, as digit-by-digit tokenisation of numbers does for arithmetic. Seen through
          rate-distortion theory (m12.6.3), a tokeniser chooses a point on the curve of bits against distortion, and the
          generative model is then trained to compress the tokens further.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rms",
      rung: "check",
      prompt: <p>Values in [−1, 1] are quantised uniformly to 256 levels. What is the root-mean-square quantisation error? Give five decimals.</p>,
      answer: { kind: "numeric", value: 0.00226, tolerance: 0.00001 },
    },
    {
      key: "bitrate",
      rung: "check",
      prompt: <p>A codec produces 75 frames a second, each quantised by 8 residual codebooks of 1024 entries. What is its bitrate in kilobits per second?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "why-rvq",
      rung: "apply",
      prompt: <p>Why do audio codecs use 8 residual codebooks of 1024 entries instead of one codebook with the same number of bits?</p>,
      answer: {
        kind: "choice",
        options: [
          "One codebook would need 2⁸⁰ entries, impossible to store, search or train; residual stages give the same bits with 8192 vectors",
          "Residual codebooks always give a lower error than any single codebook",
          "A single codebook cannot represent negative amplitudes",
          "Transformers cannot read tokens from a vocabulary larger than 1024",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def quantise(x, lo, hi, levels):
    i = int((x - lo) / (hi - lo) * levels)
    return min(max(i, 0), levels - 1)

def dequantise(i, lo, hi, levels):
    return lo + (i + 0.5) * (hi - lo) / levels

def vq_assign(points, codebook):
    return [min(range(len(codebook)), key=lambda k: sum((u - v) ** 2 for u, v in zip(p, codebook[k])))
            for p in points]

print(quantise(0.0, -1, 1, 4), quantise(1.0, -1, 1, 4), quantise(-1.0, -1, 1, 4), dequantise(2, -1, 1, 4), dequantise(quantise(0.9, 0, 1, 10), 0, 1, 10))
print(vq_assign([(0, 0), (5, 5), (1, 0), (2, 2)], [(0, 0), (4, 4)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 3 0 0.25 0.95\n[0, 1, 0, 0]",
          "2 4 0 0.25 0.95\n[0, 1, 0, 0]",
          "2 3 0 0.0 0.9\n[0, 1, 0, 0]",
          "2 3 0 0.25 0.95\n[0, 1, 0, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def nearest(v, codebook):
    best, bd = 0, float("inf")
    for k, c in enumerate(codebook):
        d = sum((a - b) ** 2 for a, b in zip(v, c))
        if d < bd:
            best, bd = k, d
    return best

def rvq_encode(v, codebooks):
    codes, r = [], list(v)
    for cb in codebooks:
        k = nearest(r, cb)
        codes.append(k)
        r = [a - b for a, b in zip(r, cb[k])]
    return codes

def rvq_decode(codes, codebooks):
    out = [0] * len(codebooks[0][0])
    for k, cb in zip(codes, codebooks):
        out = [a + b for a, b in zip(out, cb[k])]
    return out

cbs = [[(0, 0), (4, 4)], [(0, 0), (1, 0), (0, 1)]]; print(rvq_encode((5, 4), cbs), rvq_encode((3, 1), cbs), nearest((2, 2), [(0, 0), (4, 4)]))
print(rvq_decode([1, 2], cbs), rvq_decode(rvq_encode((3, 1), cbs), cbs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1] [0, 1] 0\n[4, 5] [1, 0]",
          "[1, 1] [1, 2] 0\n[4, 5] [4, 5]",
          "[1, 1] [0, 1] 1\n[4, 5] [1, 0]",
          "[1, 0] [0, 1] 0\n[4, 5] [1, 0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quantise(x, lo, hi, levels)</C>, clamping to the valid indices; <C>dequantise(i, lo, hi, levels)</C>, the bin
          centre; and <C>vq_assign(points, codebook)</C>, the index of the nearest code for each point, taking the first on ties.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def quantise(x, lo, hi, levels):
    return int(x)

def dequantise(i, lo, hi, levels):
    return float(i)

def vq_assign(points, codebook):
    return [0] * len(points)
`,
        solution: SCALAR,
        tests: [
          { name: "scalar", code: `assert quantise(0.49, 0, 1, 2) == 0 and quantise(0.5, 0, 1, 2) == 1 and quantise(7, 0, 1, 2) == 1 and quantise(-3, 0, 1, 2) == 0
assert dequantise(0, 0, 1, 2) == 0.25 and dequantise(3, -2, 2, 4) == 1.5 and abs(dequantise(quantise(0.33, 0, 1, 100), 0, 1, 100) - 0.335) < 1e-12` },
          { name: "vector", code: `assert vq_assign([(0, 0), (3, 1), (9, 9)], [(1, 1), (3, 0)]) == [0, 1, 1] and vq_assign([(2,)], [(1,), (3,)]) == [0] and vq_assign([(0, 0, 5)], [(0, 0, 0), (0, 0, 4)]) == [1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nearest(v, codebook)</C>, taking the first on ties; <C>rvq_encode(v, codebooks)</C>, the list of chosen indices,
          quantising the running residual at each stage; and <C>rvq_decode(codes, codebooks)</C>, returning a list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def nearest(v, codebook):
    return 0

def rvq_encode(v, codebooks):
    return [nearest(v, cb) for cb in codebooks]

def rvq_decode(codes, codebooks):
    return list(codebooks[0][codes[0]])
`,
        solution: RESIDUAL,
        tests: [
          { name: "nearest", code: `assert nearest((1, 1), [(0, 0), (2, 2)]) == 0 and nearest((2, 1), [(0, 0), (2, 2)]) == 1 and nearest((5,), [(1,), (4,), (6,)]) == 1` },
          { name: "residual", code: `cbs = [[(0,), (8,)], [(-2,), (2,)], [(-1,), (1,)]]
assert rvq_encode((7,), cbs) == [1, 0, 1] and rvq_decode([1, 0, 1], cbs) == [7] and rvq_encode((2.5,), cbs) == [0, 1, 1] and rvq_decode([0, 1, 0], cbs) == [1]
assert rvq_decode(rvq_encode((3, 4), [[(0, 0), (4, 4)], [(0, 0), (-1, 0)]]), [[(0, 0), (4, 4)], [(0, 0), (-1, 0)]]) == [3, 4]` },
        ],
      },
    },
    {
      key: "attention",
      rung: "stretch",
      prompt: (
        <p>
          Ten seconds of 24 kHz audio can be modelled as one μ-law token per sample, or as codec tokens at 75 frames a second
          with 8 codebooks flattened into one sequence. If attention cost grows with the square of sequence length, how many times
          more does attention cost for the μ-law sequence?
        </p>
      ),
      answer: { kind: "numeric", value: 1600, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Autoregressive models put all their capacity into predicting one token at a time. The next part takes the opposite
        approach: explain each example by a hidden code, and learn to infer the code. That is the variational autoencoder.
      </p>
    </>
  ),
};
