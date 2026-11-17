import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ArithViz } from "@/components/viz/ArithViz";
import type { LessonContent } from "@/lib/types";

const AR = `from fractions import Fraction as F
import math

def narrow(msg, p):
    c = [F(0)]
    for q in p:
        c.append(c[-1] + F(q))
    lo, width = F(0), F(1)
    for s in msg:
        lo += width * c[s]; width *= F(p[s])
    return lo, width

def encode(msg, p):
    lo, width = narrow(msg, p); k = 1
    while True:
        n = math.ceil(lo * 2 ** k)
        if F(n + 1, 2 ** k) <= lo + width:
            return format(n, "b").zfill(k)
        k += 1

def decode(bits, p, n):
    c = [F(0)]
    for q in p:
        c.append(c[-1] + F(q))
    x, out = F(int(bits, 2), 2 ** len(bits)), []
    for _ in range(n):
        s = max(i for i in range(len(p)) if c[i] <= x)
        out.append(s); x = (x - c[s]) / F(p[s])
    return out`;

const KT = `import numpy as np

def kt_probs(msg, k):
    counts, out = np.full(k, 0.5), []
    for s in msg:
        out.append(counts[s] / counts.sum()); counts[s] += 1
    return np.array(out)

def adaptive_bits(msg, k):
    return float(-np.log2(kt_probs(msg, k)).sum())`;

export const lesson: LessonContent = {
  id: "m12.3.4",
  minutes: 55,
  links: {
    requires: ["m12.3.3"],
    revisits: ["m12.1.4", "m12.3.2"],
    foreshadows: ["m12.4.1"],
  },

  puzzle: (
    <>
      <p>
        A Huffman code must give every symbol a whole number of bits, so a coin that lands heads 99% of the time costs a
        full bit per flip although its entropy is 0.08 bits. Coding blocks helps, but the table for blocks of twenty flips
        has a million entries. Can a single message of a thousand flips be given a code of about 81 bits, without any table
        at all, and with probabilities that are allowed to change from one flip to the next?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of every possible message as a slice of the unit interval, with width equal to its probability. The first
        symbol picks one of a few slices; the second symbol cuts that slice again in the same proportions, and so on. After
        the whole message we hold a tiny interval of width P(message). To name it we only need a binary fraction that
        lands inside, and an interval of width w contains such a fraction with about −log₂ w digits. The bits are paid for
        the message as a whole, so the rounding loss is at most two bits in total rather than up to one bit per symbol.
      </p>
      <ArithViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the interval of a message">
        <p>
          Order the symbols and let <M>{"c(x) = \\sum_{y < x} p(y)"}</M> be the cumulative probability before x. Start with{" "}
          <M>{"[\\ell, \\ell + w) = [0, 1)"}</M>, and for each symbol x of the message update
        </p>
        <MD>{"\\ell \\leftarrow \\ell + w\\,c(x), \\qquad w \\leftarrow w\\,p(x)."}</MD>
        <p>
          The symbol probabilities may depend on the symbols before them: at step t use{" "}
          <M>{"p(x_t \\mid x_{<t})"}</M> and its own cumulative sums.
        </p>
      </Definition>

      <Theorem title="intervals tile [0, 1)">
        <p>
          The final width is the probability of the message, <M>{"w = \\prod_t p(x_t \\mid x_{<t}) = P(x_1, \\dots, x_n)"}</M>,
          and the intervals of the different messages of length n are disjoint and together cover [0, 1).
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is the chain rule for probabilities. For the second, induct on n. The slices of the current
          interval at one step are <M>{"[\\ell + w c(x), \\ell + w c(x) + w p(x))"}</M> for the different x; since the c(x)
          are the running sums of the p(x), these slices sit end to end and fill <M>{"[\\ell, \\ell + w)"}</M> exactly.
          Refining a tiling of [0, 1) piece by piece gives a tiling.
        </p>
        <Code>{AR}</Code>
      </Proof>

      <Theorem title="arithmetic codes come within two bits of the surprise">
        <p>
          Let the codeword of a message be the binary digits of the shortest k for which some dyadic interval{" "}
          <M>{"[n 2^{-k}, (n+1) 2^{-k})"}</M> fits inside its interval. Then the code is prefix-free on messages of length n
          and its length satisfies <M>{"k < -\\log_2 P(x_1, \\dots, x_n) + 2"}</M>. Hence the expected length is less than{" "}
          <M>{"H(X_1, \\dots, X_n) + 2"}</M>, an overhead of 2/n bits per symbol.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"k = \\lceil -\\log_2 w \\rceil + 1"}</M>, so <M>{"2^{-k} \\le w/2"}</M>. The smallest multiple of{" "}
          <M>{"2^{-k}"}</M> that is at least ℓ is below <M>{"\\ell + 2^{-k}"}</M>, so its dyadic interval ends by{" "}
          <M>{"\\ell + 2 \\cdot 2^{-k} \\le \\ell + w"}</M>. Thus the shortest k is at most{" "}
          <M>{"\\lceil -\\log_2 w \\rceil + 1 < -\\log_2 w + 2"}</M>.
        </p>
        <p>
          A binary string b names a dyadic interval, and any extension of b names a sub-interval of it. If one codeword were a
          prefix of another, the second&apos;s dyadic interval would lie inside the first&apos;s, so the two message intervals
          would overlap, which the previous theorem forbids. Averaging the length bound over messages gives the expected
          length bound, and by the Kraft inequality nothing prefix-free does better than H.
        </p>
      </Proof>

      <Remark title="adaptive models">
        <p>
          Because only <M>{"p(x_t \\mid x_{<t})"}</M> is needed at each step, the model can learn as it goes, and the decoder
          can learn the same way since it has already decoded <M>{"x_{<t}"}</M>. The Krichevsky–Trofimov estimator starts every
          count at ½ and predicts in proportion to the counts. For a binary message the product of its predictions depends
          only on the numbers of zeros and ones, not their order, and its code length exceeds that of the best fixed
          distribution chosen in hindsight by at most <M>{"\\tfrac12 \\log_2 n + 1"}</M> bits: the price of learning one
          parameter. For one hundred flips with ten ones the adaptive code needs 50.6 bits against 46.9 for the true
          distribution.
        </p>
        <Code>{KT}</Code>
      </Remark>

      <Remark title="in practice">
        <p>
          Exact fractions grow without bound, so real coders keep ℓ and w as fixed-width integers, shift out leading bits once
          they are settled, and rescale. The rounding costs a tiny fraction of a bit per symbol. Range coders and the related
          asymmetric numeral systems sit inside zstd, the CABAC stage of H.264 video and the image format JPEG XL. The
          separation is the important idea: compression becomes a modelling problem, and any model that outputs next-symbol
          probabilities becomes a compressor with code length <M>{"\\sum_t -\\log_2 p(x_t \\mid x_{<t})"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A message has probability 1/1000 under the model. What is the largest number of bits the encoder in the lesson can
          output for it?
        </p>
      ),
      answer: { kind: "numeric", value: 11, tolerance: 0 },
    },
    {
      key: "low",
      rung: "check",
      prompt: (
        <p>
          With p(a) = 0.7 and p(b) = 0.3, a ordered before b, what is the lower end ℓ of the interval after encoding a then b?
        </p>
      ),
      answer: { kind: "numeric", value: 0.49, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does arithmetic coding beat symbol-by-symbol Huffman coding on a very skewed source?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its rounding loss of at most two bits is paid once per message rather than up to one bit per symbol",
          "It uses fewer bits than the entropy of the source",
          "It needs no probability model",
          "Its codewords all have the same length",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction as F
import math

def narrow(msg, p):
    c = [F(0)]
    for q in p:
        c.append(c[-1] + F(q))
    lo, width = F(0), F(1)
    for s in msg:
        lo += width * c[s]; width *= F(p[s])
    return lo, width

def encode(msg, p):
    lo, width = narrow(msg, p); k = 1
    while True:
        n = math.ceil(lo * 2 ** k)
        if F(n + 1, 2 ** k) <= lo + width:
            return format(n, "b").zfill(k)
        k += 1

def decode(bits, p, n):
    c = [F(0)]
    for q in p:
        c.append(c[-1] + F(q))
    x, out = F(int(bits, 2), 2 ** len(bits)), []
    for _ in range(n):
        s = max(i for i in range(len(p)) if c[i] <= x)
        out.append(s); x = (x - c[s]) / F(p[s])
    return out

p = [F(1, 2), F(1, 4), F(1, 4)]; lo, w = narrow([0, 2, 1], p); print(lo, w)
code = encode([0, 2, 1], p); print(code, len(code), decode(code, p, 3))
q = [F(9, 10), F(1, 10)]; msg = [0] * 20 + [1]; code = encode(msg, q)
print(len(code), round(-math.log2(narrow(msg, q)[1]), 2), decode(code, q, 21) == msg)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7/16 1/32\n01110 5 [0, 2, 1]\n8 6.36 True",
          "7/16 1/32\n0111 4 [0, 2, 1]\n7 6.36 True",
          "3/8 1/32\n01110 5 [0, 2, 1]\n8 6.36 True",
          "7/16 1/32\n01110 5 [0, 2, 1]\n21 6.36 True",
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

def kt_probs(msg, k):
    counts, out = np.full(k, 0.5), []
    for s in msg:
        out.append(counts[s] / counts.sum()); counts[s] += 1
    return np.array(out)

def adaptive_bits(msg, k):
    return float(-np.log2(kt_probs(msg, k)).sum())

msg = [0, 0, 1, 0]; print([round(float(x), 3) for x in kt_probs(msg, 2)], round(adaptive_bits(msg, 2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.75, 0.167, 0.625] 4.678",
          "[0.5, 0.5, 0.5, 0.5] 4.0",
          "[0.5, 0.75, 0.25, 0.75] 3.83",
          "[0.5, 0.667, 0.25, 0.6] 4.322",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With exact fractions, write <C>narrow(msg, p)</C> returning the final (ℓ, w); <C>encode(msg, p)</C> returning the
          shortest binary string whose dyadic interval fits inside; and <C>decode(bits, p, n)</C> recovering n symbols.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction as F
import math

def narrow(msg, p):
    return F(0), F(1)

def encode(msg, p):
    return ""

def decode(bits, p, n):
    return []
`,
        solution: AR,
        tests: [
          { name: "interval", code: `assert narrow([1, 1], [F(1, 3), F(2, 3)]) == (F(5, 9), F(4, 9))
assert narrow([2, 0], [F(1, 2), F(1, 4), F(1, 4)]) == (F(3, 4), F(1, 8))` },
          { name: "roundtrip", code: `p = [F(1, 10), F(6, 10), F(3, 10)]
for msg in [[1, 1, 2, 0, 1], [0, 0, 0], [2] * 7]:
    code = encode(msg, p)
    assert decode(code, p, len(msg)) == msg and len(code) < -math.log2(narrow(msg, p)[1]) + 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kt_probs(msg, k)</C>, the Krichevsky–Trofimov probability of each symbol given those before it (counts
          start at ½), and <C>adaptive_bits(msg, k)</C>, the total code length in bits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kt_probs(msg, k):
    return np.full(len(msg), 1 / k)

def adaptive_bits(msg, k):
    return 0.0
`,
        solution: KT,
        tests: [
          { name: "probs", code: `assert np.allclose(kt_probs([0, 0, 1, 0], 2), [0.5, 0.75, 1 / 6, 0.625])
assert np.allclose(kt_probs([2, 2], 3), [1 / 3, 0.6])` },
          { name: "bits", code: `assert np.isclose(adaptive_bits([0, 1, 2], 3), np.log2(105))
assert np.isclose(adaptive_bits([2, 0, 0, 1], 3), adaptive_bits([0, 1, 0, 2], 3))` },
        ],
      },
    },
    {
      key: "kt",
      rung: "stretch",
      prompt: (
        <p>
          How many bits does the Krichevsky–Trofimov adaptive code spend on the binary message 1, 1, 0, 0? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.415, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Arithmetic coding turns any predictor into a compressor whose length is the predictor&apos;s total surprise. So a
        better model of text is, quite literally, a better zip, and the cross-entropy loss of a language model is its
        compression rate. That is the subject of the next section.
      </p>
    </>
  ),
};
