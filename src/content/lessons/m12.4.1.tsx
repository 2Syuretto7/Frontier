import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContextModelViz } from "@/components/viz/ContextModelViz";
import type { LessonContent } from "@/lib/types";

const CM = `from collections import defaultdict
import math

def context_probs(text, k, alpha=0.5, A=256):
    counts, totals, out = defaultdict(lambda: defaultdict(float)), defaultdict(float), []
    for t, ch in enumerate(text):
        ctx = text[max(0, t - k):t]
        out.append((counts[ctx][ch] + alpha) / (totals[ctx] + alpha * A))
        counts[ctx][ch] += 1; totals[ctx] += 1
    return out

def code_bits(probs):
    return -sum(math.log2(q) for q in probs)

def mixture_bits(prob_lists, w=None):
    post = list(w) if w else [1 / len(prob_lists)] * len(prob_lists)
    total = 0.0
    for qs in zip(*prob_lists):
        mix = sum(a * q for a, q in zip(post, qs))
        total -= math.log2(mix)
        post = [a * q / mix for a, q in zip(post, qs)]
    return total`;

const NC = `import zlib

def C(s):
    return len(zlib.compress(s.encode(), 9))

def ncd(x, y):
    cx, cy = C(x), C(y)
    return (C(x + y) - min(cx, cy)) / max(cx, cy)

def classify(text, refs):
    return min(refs, key=lambda name: ncd(text, refs[name]))`;

export const lesson: LessonContent = {
  id: "m12.4.1",
  minutes: 55,
  links: {
    requires: ["m12.3.4"],
    revisits: ["m12.2.2", "m12.1.4"],
    foreshadows: ["m12.4.2", "m12.4.3"],
  },

  puzzle: (
    <>
      <p>
        You are offered two programs. One predicts the next character of English text; the other compresses English text
        files. Which is the more impressive achievement? The surprising answer is that they are the same achievement: each
        can be turned into the other with no loss, so a model that predicts well is, by construction, a compressor that
        compresses well. How exactly, and what does that say about the training loss of a language model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Arithmetic coding spends −log₂ q bits on a symbol to which the model gave probability q, up to two bits for the
        whole message. So the size of the compressed file is simply the model&apos;s total surprise at the text. Confident
        correct predictions are nearly free; confident wrong ones are expensive. A context model predicts the next
        character from counts of what followed the same few characters before, learning as it reads, and the decoder
        rebuilds the same counts from the text it has already decoded.
      </p>
      <ContextModelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sequential predictor and its code length">
        <p>
          A sequential predictor assigns, for every prefix <M>{"x_{<t}"}</M>, a distribution <M>{"q(\\cdot \\mid x_{<t})"}</M>{" "}
          over the next symbol. By the chain rule these define a distribution on whole messages,{" "}
          <M>{"q(x_{1:n}) = \\prod_t q(x_t \\mid x_{<t})"}</M>, and its code length is
        </p>
        <MD>{"L_q(x_{1:n}) = -\\log_2 q(x_{1:n}) = \\sum_{t=1}^{n} -\\log_2 q(x_t \\mid x_{<t})."}</MD>
        <p>Arithmetic coding with q achieves this to within two bits for every message.</p>
      </Definition>

      <Theorem title="the cost of a wrong model is the KL divergence">
        <p>
          If the messages are drawn from P, the expected code length with predictor q is the cross-entropy, and it exceeds
          the best possible length by exactly the divergence:
        </p>
        <MD>{"\\mathbb E_P[L_q] = H(P) + D(P \\,\\|\\, q)."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb E_P[-\\log_2 q(X)] = \\mathbb E_P[-\\log_2 P(X)] + \\mathbb E_P[\\log_2 (P(X)/q(X))]"}</M>, and the two
          terms are H(P) and D(P ‖ q). Applying the chain rule for divergence splits the excess into one term per step,
          the expected divergence of the next-symbol predictions given the past. So minimising average code length and
          minimising average log loss of next-symbol prediction are the same problem.
        </p>
      </Proof>

      <Theorem title="mixtures lose at most log M bits">
        <p>
          Given predictors <M>{"q_1, \\dots, q_M"}</M> and prior weights <M>{"w_i > 0"}</M> summing to one, the mixture{" "}
          <M>{"\\bar q(x_{1:n}) = \\sum_i w_i\\, q_i(x_{1:n})"}</M> satisfies, for every message and every i,
        </p>
        <MD>{"L_{\\bar q}(x_{1:n}) \\le L_{q_i}(x_{1:n}) + \\log_2 \\frac{1}{w_i}."}</MD>
        <p>
          It is itself a sequential predictor: its next-symbol prediction is <M>{"\\sum_i \\pi_{i,t}\\, q_i(x_t \\mid x_{<t})"}</M>{" "}
          with posterior weights <M>{"\\pi_{i,t} \\propto w_i\\, q_i(x_{<t})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum is at least its i-th term, so <M>{"\\bar q(x) \\ge w_i q_i(x)"}</M>; take <M>{"-\\log_2"}</M>. For the
          sequential form, divide <M>{"\\bar q(x_{\\le t})"}</M> by <M>{"\\bar q(x_{<t})"}</M> and write each{" "}
          <M>{"q_i(x_{\\le t}) = q_i(x_{<t})\\, q_i(x_t \\mid x_{<t})"}</M>. This is Bayes&apos; rule, so with uniform weights the
          mixture tracks the best of M models in hindsight at a fixed cost of <M>{"\\log_2 M"}</M> bits, however long the message.
        </p>
        <Code>{CM}</Code>
      </Proof>

      <Remark title="the other direction">
        <p>
          A compressor also gives a predictor: if C(x) is the length of the code for x, the Kraft inequality makes{" "}
          <M>{"2^{-C(x)}"}</M> a sub-probability, and conditional predictions follow from ratios such as{" "}
          <M>{"2^{-(C(xa) - C(x))}"}</M>. Even a crude compressor carries usable statistics. The normalised compression
          distance compares how much better x and y compress together than apart, and classifying a text by the reference it
          compresses best with is a simple, model-free method that works surprisingly often. Its weakness is plain: zlib
          only sees repeats within a 32 KB window, so it measures shared substrings rather than meaning.
        </p>
        <Code>{NC}</Code>
      </Remark>

      <Remark title="language models as compressors">
        <p>
          The cross-entropy loss of a language model in nats per token, divided by ln 2, is exactly the number of bits per
          token an arithmetic coder driven by that model would use. Delétang and colleagues (2023) reported that a large text
          model used this way compressed ImageNet patches and LibriSpeech audio better than PNG and FLAC, although it never
          saw images or audio in training. The catch is that the decoder needs the model too: counting the model&apos;s own
          size in the code length is exactly the minimum description length principle, two lessons ahead.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ideal",
      rung: "check",
      prompt: (
        <p>
          A predictor gave the three characters of a message probabilities 1/2, 1/4 and 1/8 just before seeing each of
          them. What is the ideal code length of the message in bits?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "mix",
      rung: "check",
      prompt: (
        <p>
          A uniform mixture of 8 predictors is used to compress a long file. At most how many more bits than the best of the
          8 can it use?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "excess",
      rung: "apply",
      prompt: <p>Data come from P but are coded with predictor q. What is the expected code length per message?</p>,
      answer: {
        kind: "choice",
        options: [
          "H(P) + D(P ‖ q), the cross-entropy of q relative to P",
          "H(q) + D(q ‖ P)",
          "H(P) − D(P ‖ q)",
          "H(P), because arithmetic coding is optimal whatever the model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import defaultdict
import math

def context_probs(text, k, alpha=0.5, A=256):
    counts, totals, out = defaultdict(lambda: defaultdict(float)), defaultdict(float), []
    for t, ch in enumerate(text):
        ctx = text[max(0, t - k):t]
        out.append((counts[ctx][ch] + alpha) / (totals[ctx] + alpha * A))
        counts[ctx][ch] += 1; totals[ctx] += 1
    return out

def code_bits(probs):
    return -sum(math.log2(q) for q in probs)

def mixture_bits(prob_lists, w=None):
    post = list(w) if w else [1 / len(prob_lists)] * len(prob_lists)
    total = 0.0
    for qs in zip(*prob_lists):
        mix = sum(a * q for a, q in zip(post, qs))
        total -= math.log2(mix)
        post = [a * q / mix for a, q in zip(post, qs)]
    return total

text = "abracadabra " * 8; P = [context_probs(text, k, A=6) for k in range(4)]
print([round(code_bits(q) / len(text), 2) for q in P])
m = mixture_bits(P); best = min(code_bits(q) for q in P)
print(round(m / len(text), 2), best <= m <= best + 2, round(code_bits(context_probs("ab", 0, A=2)), 3))
print(len(text) * 8, int(len(text) * math.log2(6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.43, 1.4, 1.01, 1.09]\n1.03 True 3.0\n768 248",
          "[2.43, 1.4, 1.01, 1.09]\n1.01 True 3.0\n768 248",
          "[2.43, 1.4, 1.01, 1.09]\n1.03 True 2.0\n768 248",
          "[2.58, 2.58, 2.58, 2.58]\n2.58 True 2.0\n768 248",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import zlib

def C(s):
    return len(zlib.compress(s.encode(), 9))

def ncd(x, y):
    cx, cy = C(x), C(y)
    return (C(x + y) - min(cx, cy)) / max(cx, cy)

def classify(text, refs):
    return min(refs, key=lambda name: ncd(text, refs[name]))

a = "the cat sat on the mat and the dog sat on the log " * 4; b = "colourless green ideas sleep furiously in the night " * 4
print(ncd(a, a) < 0.1, ncd(a, b) > 0.5, classify("the dog sat on the cat", {"pets": a, "ideas": b}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True pets", "False True pets", "True False ideas", "True True ideas"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>context_probs(text, k, alpha, A)</C>, the adaptive order-k prediction for each character (counts in each
          context start at alpha over an alphabet of size A); <C>code_bits(probs)</C>; and <C>mixture_bits(prob_lists, w)</C>,
          the code length of the Bayesian mixture computed sequentially with posterior weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import defaultdict
import math

def context_probs(text, k, alpha=0.5, A=256):
    return [1 / A for _ in text]

def code_bits(probs):
    return 0.0

def mixture_bits(prob_lists, w=None):
    return 0.0
`,
        solution: CM,
        tests: [
          { name: "context", code: `assert all(abs(a - b) < 1e-12 for a, b in zip(context_probs("aab", 0, 0.5, 2), [0.5, 0.75, 1 / 6]))
assert all(abs(a - b) < 1e-12 for a, b in zip(context_probs("abab", 1, 1, 2), [0.5, 0.5, 0.5, 2 / 3])) and abs(code_bits([0.5, 0.25]) - 3) < 1e-12` },
          { name: "mixture", code: `assert abs(mixture_bits([[0.5, 0.5], [0.25, 1.0]]) - 2.0) < 1e-12
P = [[0.9, 0.2, 0.7], [0.3, 0.6, 0.5], [0.5, 0.5, 0.5]]; w = [0.5, 0.3, 0.2]
assert abs(mixture_bits(P, w) + math.log2(sum(a * math.prod(q) for a, q in zip(w, P)))) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using zlib at level 9, write <C>C(s)</C>, the compressed size in bytes; <C>ncd(x, y)</C>, the normalised compression
          distance; and <C>classify(text, refs)</C>, the name of the reference with the smallest distance to text.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import zlib

def C(s):
    return len(s)

def ncd(x, y):
    return 0.0

def classify(text, refs):
    return next(iter(refs))
`,
        solution: NC,
        tests: [
          { name: "distance", code: `a = "the cat sat on the mat and the dog sat on the log " * 4; b = "colourless green ideas sleep furiously in the night " * 4
assert ncd(a, a) < 0.1 and ncd(a, b) > 0.5 and C(a) < len(a) // 2` },
          { name: "classify", code: `a = "the cat sat on the mat and the dog sat on the log " * 4; b = "colourless green ideas sleep furiously in the night " * 4
assert classify("green ideas sleep", {"pets": a, "ideas": b}) == "ideas"` },
        ],
      },
    },
    {
      key: "twomodels",
      rung: "stretch",
      prompt: (
        <p>
          Predictor A always says the next bit is 0 with probability 0.9; predictor B says 0.5. With equal prior weights, how
          many bits does the mixture spend on the message 0, 0, 0, 0, 1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.368, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If code length is total surprise, then the familiar way of reporting a language model&apos;s quality, perplexity, is
        just compression in disguise. The next lesson makes the conversions exact, including why bits per byte is the fair
        way to compare models with different tokenisers.
      </p>
    </>
  ),
};
