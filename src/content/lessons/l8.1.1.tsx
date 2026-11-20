import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrequentialCodeViz } from "@/components/viz/PrequentialCodeViz";
import type { LessonContent } from "@/lib/types";

const UNITS = `import math

def code_length_bits(probs):
    return sum(-math.log2(p) for p in probs)

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats * n_tokens / (n_bytes * math.log(2))

def compression_ratio(n_bytes, bits):
    return 8 * n_bytes / bits`;

const CODER = `from fractions import Fraction
import math

def kt_prob(counts, sym, alpha=Fraction(1, 2)):
    total = sum(counts.values()) + alpha * len(counts)
    return (counts[sym] + alpha) / total

def encode_interval(seq, alphabet, alpha=Fraction(1, 2)):
    counts = {s: 0 for s in alphabet}
    low, width = Fraction(0), Fraction(1)
    for s in seq:
        for t in alphabet:
            if t == s:
                break
            low += width * kt_prob(counts, t, alpha)
        width *= kt_prob(counts, s, alpha)
        counts[s] += 1
    return low, width

def arithmetic_bits(width):
    return math.ceil(-math.log2(width)) + 1`;

export const lesson: LessonContent = {
  id: "l8.1.1",
  minutes: 50,
  links: {
    requires: ["l5.3.2", "m12.4.2"],
    revisits: ["m12.3.4", "l3.3.2"],
    foreshadows: ["l8.4.1"],
  },

  puzzle: (
    <>
      <p>
        A language model trained only to guess the next token can be turned, with no further training, into a lossless
        compressor that beats gzip on text by a wide margin. Its training loss, read in the right units, is exactly the size
        of the compressed file. Why are prediction and compression the same problem, and what does that say about what
        pretraining is optimising?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A good code gives short codewords to likely messages and long ones to unlikely messages. A model that predicts the
        next token assigns each possible continuation a probability, and a coder can turn that probability into a codeword of
        about <M>{"-\\log_2 p"}</M> bits. Summed over a text, this is the model&apos;s cross-entropy loss in bits. Lower loss
        means a shorter file, and the decoder can recover the text exactly because it runs the same model and sees the same
        probabilities.
      </p>
      <PrequentialCodeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="code length and loss">
        <p>
          A model q assigns the text <M>{"x_1, \\dots, x_T"}</M> the probability <M>{"q(x_{1:T}) = \\prod_t q(x_t \\mid x_{<t})"}</M>. Its
          ideal code length is
        </p>
        <MD>{"\\ell(x_{1:T}) = -\\log_2 q(x_{1:T}) = \\sum_{t=1}^{T} -\\log_2 q(x_t \\mid x_{<t})"}</MD>
        <p>
          bits (<C>code_length_bits</C>), which is T times the mean next-token loss converted from nats to bits by dividing by
          ln 2. Because tokenisers differ, losses are compared in bits per byte of raw text:
          multiply the loss per token by the number of tokens, divide by the number of bytes and by ln 2 (<C>bits_per_byte</C>).
          Eight bits per byte divided by that gives the compression ratio (<C>compression_ratio</C>).
        </p>
        <Code>{UNITS}</Code>
      </Definition>

      <Theorem title="arithmetic coding achieves the model's code length">
        <p>
          Arithmetic coding maps the text to a subinterval of [0, 1) of width exactly <M>{"q(x_{1:T})"}</M>, by splitting the
          current interval in proportion to the model&apos;s next-symbol probabilities and keeping the piece of the symbol that
          occurs (<C>encode_interval</C>). Any binary fraction with <M>{"\\lceil -\\log_2 q(x_{1:T}) \\rceil + 1"}</M> digits that lies in
          the interval identifies it (<C>arithmetic_bits</C>), so the cost is within two bits of the ideal code length for the
          whole text, not per symbol.
        </p>
        <Code>{CODER}</Code>
      </Theorem>
      <Proof>
        <p>
          The interval for <M>{"x_{1:t}"}</M> is nested inside that for <M>{"x_{1:t-1}"}</M> with width multiplied by{" "}
          <M>{"q(x_t \\mid x_{<t})"}</M>, so the final width is the product. Write <M>{"w"}</M> for the width and{" "}
          <M>{"k = \\lceil -\\log_2 w \\rceil + 1"}</M>, so <M>{"2^{-k} \\le w/2"}</M>. Every interval of width w contains a multiple of{" "}
          <M>{"2^{-k}"}</M> whose dyadic interval <M>{"[m2^{-k}, (m+1)2^{-k})"}</M> lies entirely inside it, so k bits name a point
          whose every continuation stays in the interval and the code is prefix-free. The decoder, running the same model,
          retraces the same splits and reads off each symbol in turn.
        </p>
      </Proof>

      <Theorem title="expected code length is cross-entropy">
        <p>
          If the text is drawn from the true distribution p and coded with the model q, the expected code length per symbol is
        </p>
        <MD>{"\\mathbb{E}_p[-\\log_2 q(X)] = H(p) + D_{\\mathrm{KL}}(p \\,\\|\\, q)"}</MD>
        <p>
          bits. No code does better than H(p) on average, and each bit of KL divergence is a bit wasted. Minimising the
          pretraining loss is therefore minimising the compressed size of the training distribution, and the irreducible
          part of the loss is the entropy of the text itself.
        </p>
      </Theorem>

      <Definition title="prequential code length">
        <p>
          A compressor must also tell the decoder the model. A two-part code sends the weights and then the data, which for a
          billion-parameter network is enormous. The prequential code avoids this: encoder and decoder start from the same
          initialisation, code each token with the current model, and then both take the same training step on it. The total
          cost is the sum of the losses seen during one pass of training, the area under the online loss curve, and the
          weights never need to be sent. The viz does this with counting models: the add-α rule (<C>kt_prob</C>, with α = 1/2 the
          Krichevsky–Trofimov estimator) is the model, and updating the counts is the training step.
        </p>
      </Definition>

      <Example title="from loss to file size">
        <p>
          A model with a loss of 2.0 nats per token on text averaging four bytes per token achieves{" "}
          <M>{"2.0/(4 \\ln 2) \\approx 0.72"}</M> bits per byte, a compression ratio of about 11. General-purpose compressors such as
          gzip reach about 2 to 3 bits per byte on English, so the model is several times better. Delétang and colleagues
          showed that large models used as arithmetic-coding compressors also beat standard compressors on images and audio,
          though only when the cost of the weights is ignored.
        </p>
      </Example>

      <Remark title="what the equivalence does and does not say">
        <p>
          The equivalence explains why the scaling laws of Part 4 are stated in loss: loss is description length, and lower
          description length means the model has found more of the structure in the data. It also explains bits per byte as
          the honest unit across tokenisers, since a tokeniser that merges more bytes per token raises the per-token loss
          without changing the compression. It does not say that every bit of compression is equally useful: much of the loss
          sits in names, numbers and formatting, and the last fractions of a bit can track the capabilities people care about
          well or badly, a question taken up in l8.4.5.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bpb",
      rung: "check",
      prompt: <p>A model reaches 2.4 nats per token on text with four bytes per token on average. What is its loss in bits per byte? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8656, tolerance: 0.0002 },
    },
    {
      key: "codelen",
      rung: "check",
      prompt: <p>A model gives the three tokens of a message probabilities 0.2, 0.05 and 0.4 in turn. What is the ideal code length in bits? Give three decimals.</p>,
      answer: { kind: "numeric", value: 7.966, tolerance: 0.002 },
    },
    {
      key: "preq",
      rung: "apply",
      prompt: <p>Why does the prequential code not need to transmit the model&apos;s weights?</p>,
      answer: {
        kind: "choice",
        options: [
          "The decoder starts from the same initialisation and repeats every training step on the tokens it has already decoded, so it rebuilds the model as it goes",
          "The weights are small enough to be ignored for any realistic model",
          "Arithmetic coding stores the weights inside the interval",
          "The decoder only needs the final model, which can be inferred from the compressed length",
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

def code_length_bits(probs):
    return sum(-math.log2(p) for p in probs)

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats * n_tokens / (n_bytes * math.log(2))

def compression_ratio(n_bytes, bits):
    return 8 * n_bytes / bits

print(code_length_bits([0.5, 0.25, 0.125]), code_length_bits([1.0, 0.5]))
print(round(bits_per_byte(2.0, 100, 400), 4), compression_ratio(10, 20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.0 1.0\n0.7213 4.0",
          "6.0 1.5\n0.7213 4.0",
          "7.0 1.0\n0.5 4.0",
          "6.0 1.0\n0.7213 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
import math

def kt_prob(counts, sym, alpha=Fraction(1, 2)):
    total = sum(counts.values()) + alpha * len(counts)
    return (counts[sym] + alpha) / total

def encode_interval(seq, alphabet, alpha=Fraction(1, 2)):
    counts = {s: 0 for s in alphabet}
    low, width = Fraction(0), Fraction(1)
    for s in seq:
        for t in alphabet:
            if t == s:
                break
            low += width * kt_prob(counts, t, alpha)
        width *= kt_prob(counts, s, alpha)
        counts[s] += 1
    return low, width

def arithmetic_bits(width):
    return math.ceil(-math.log2(width)) + 1

low, width = encode_interval("ab", "ab")
print(low, width, arithmetic_bits(width), kt_prob({"x": 3, "y": 1}, "y"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3/8 1/8 4 3/10",
          "1/2 1/4 3 3/10",
          "3/8 1/8 3 1/4",
          "1/4 1/8 4 3/10",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>code_length_bits(probs)</C>, <C>bits_per_byte(loss_nats, n_tokens, n_bytes)</C> and{" "}
          <C>compression_ratio(n_bytes, bits)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def code_length_bits(probs):
    return sum(-math.log(p) for p in probs)

def bits_per_byte(loss_nats, n_tokens, n_bytes):
    return loss_nats / n_bytes

def compression_ratio(n_bytes, bits):
    return bits / n_bytes
`,
        solution: UNITS,
        tests: [
          { name: "bits", code: `assert abs(code_length_bits([0.5, 0.125]) - 4) < 1e-12 and abs(code_length_bits([0.8] * 3) + 3 * math.log2(0.8)) < 1e-12` },
          { name: "rate", code: `assert abs(bits_per_byte(math.log(2), 50, 100) - 0.5) < 1e-12 and abs(compression_ratio(100, 200) - 4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kt_prob(counts, sym, alpha)</C>, the add-α probability, <C>encode_interval(seq, alphabet, alpha)</C>, the
          arithmetic-coding interval (low, width) with adaptive counts and symbols ordered as in <C>alphabet</C>, and{" "}
          <C>arithmetic_bits(width)</C>. Use exact fractions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction
import math

def kt_prob(counts, sym, alpha=Fraction(1, 2)):
    return Fraction(1, len(counts))

def encode_interval(seq, alphabet, alpha=Fraction(1, 2)):
    return Fraction(0), Fraction(1)

def arithmetic_bits(width):
    return 0
`,
        solution: CODER,
        tests: [
          { name: "prob", code: `assert kt_prob({"a": 0, "b": 2, "c": 1}, "a") == Fraction(1, 9) and kt_prob({"a": 2, "b": 0}, "a", Fraction(1)) == Fraction(3, 4)` },
          { name: "interval", code: `low, width = encode_interval("aab", "ab", Fraction(1))\nassert low == Fraction(1, 4) and width == Fraction(1, 12) and arithmetic_bits(width) == 5` },
        ],
      },
    },
    {
      key: "kt",
      rung: "stretch",
      prompt: (
        <p>
          Code the binary string 0001 prequentially with the Krichevsky–Trofimov rule (α = 1/2, alphabet {"{0, 1}"}), starting from
          zero counts. What is the ideal code length in bits? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.6781, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        If loss is compressed size, the data decides how small the file can get. The next lesson asks which data to train on
        and in what proportions, since the mixture is the distribution whose entropy the model is learning to approach.
      </p>
    </>
  ),
};
