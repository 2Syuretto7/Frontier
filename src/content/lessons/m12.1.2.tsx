import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EntropyViz } from "@/components/viz/EntropyViz";
import type { LessonContent } from "@/lib/types";

const EN = `import numpy as np

def entropy(p, base=2.0):
    p = np.asarray(p, dtype=float); p = p[p > 0]
    return float(-(p * np.log(p)).sum() / np.log(base)) + 0.0

def binary_entropy(q):
    return entropy([q, 1 - q])

def expected_code_length(p, lengths):
    return float(np.dot(p, lengths))`;

const ES = `import numpy as np

def plugin_entropy(samples, k):
    p = np.bincount(samples, minlength=k) / len(samples); p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

def miller_madow(samples, k):
    m = np.count_nonzero(np.bincount(samples, minlength=k))
    return plugin_entropy(samples, k) + (m - 1) / (2 * len(samples) * np.log(2))

def softmax_entropy(logits, temperature):
    z = np.asarray(logits, dtype=float) / temperature; p = np.exp(z - z.max()); p /= p.sum()
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())`;

export const lesson: LessonContent = {
  id: "m12.1.2",
  minutes: 45,
  links: {
    requires: ["m12.1.1", "m7.4.2"],
    revisits: ["m7.2.3"],
    foreshadows: ["m12.1.3", "m12.3.2", "m12.6.1"],
  },

  puzzle: (
    <>
      <p>
        A weather station reports one of four conditions each hour: sunny half the time, cloudy a quarter, rain and snow an
        eighth each. Sending the condition as a fixed two-bit code costs 2 bits an hour. A cleverer code, 0 for sunny, 10 for
        cloudy, 110 and 111 for the others, costs 1.75 bits an hour on average and can still be decoded without separators.
        Can any code do better than 1.75? And if you only had twenty hours of records, how would you estimate that number,
        and would your estimate be too high or too low?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The surprise of an outcome measures how much you learn when it happens. Averaging over outcomes gives the entropy,
        the average information per draw. It is largest when every outcome is equally likely, since then nothing can be
        predicted, and zero when one outcome is certain. In the weather example the cleverer code gives each condition
        exactly as many bits as its surprise, so its average length is the entropy. A later lesson shows that no decodable
        code can beat that.
      </p>
      <EntropyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="entropy">
        <p>For a discrete random variable X with probabilities <M>{"p(x)"}</M>,</p>
        <MD>{"H(X) = \\mathbb{E}\\left[-\\log_2 p(X)\\right] = -\\sum_x p(x)\\log_2 p(x),"}</MD>
        <p>
          with the convention <M>{"0\\log 0 = 0"}</M>, since <M>{"q\\log q \\to 0"}</M> as q → 0. It depends only on the
          probabilities, not on the values X takes. The binary entropy is{" "}
          <M>{"h(q) = -q\\log_2 q - (1 - q)\\log_2(1 - q)"}</M>, which is 1 at q = ½ and 0 at q = 0 or 1.
        </p>
      </Definition>

      <Theorem title="the range of entropy">
        <p>
          If X takes at most n values, <M>{"0 \\le H(X) \\le \\log_2 n"}</M>. H(X) = 0 exactly when X is constant, and{" "}
          <M>{"H(X) = \\log_2 n"}</M> exactly when X is uniform on n values.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each term <M>{"-p\\log_2 p"}</M> is at least 0 for p ∈ [0, 1] and is 0 only at p = 0 or 1, so H ≥ 0 with equality
          exactly when one outcome has probability 1. For the upper bound, log is concave, so Jensen&apos;s inequality gives{" "}
          <M>{"H(X) = \\mathbb{E}[\\log_2(1/p(X))] \\le \\log_2\\mathbb{E}[1/p(X)] = \\log_2\\sum_{p(x) > 0} p(x)\\cdot\\frac{1}{p(x)} \\le \\log_2 n"}</M>.
          Equality in Jensen for the strictly concave log needs 1/p(X) to be constant, and the last step needs all n values
          to have positive probability, which together mean X is uniform on n values.
        </p>
      </Proof>

      <Remark title="entropy as code length">
        <p>
          When every probability is a power of ½ (a dyadic distribution), give outcome x a codeword of length{" "}
          <M>{"\\ell(x) = -\\log_2 p(x)"}</M>, as with 0, 10, 110, 111 for ½, ¼, ⅛, ⅛. No codeword is a prefix of
          another, so a stream can be decoded left to right, and the expected length is{" "}
          <M>{"\\sum_x p(x)\\ell(x) = H(X)"}</M> = 1.75 bits. Later lessons prove that no such code has expected length below
          H, and that for any distribution one can get within 1 bit of it, so entropy is the cost of describing a draw.
        </p>
        <Code>{EN}</Code>
      </Remark>

      <Theorem title="the plug-in estimate is biased downwards">
        <p>
          If <M>{"\\hat p"}</M> is the vector of observed frequencies in a sample, then{" "}
          <M>{"\\mathbb{E}[H(\\hat p)] \\le H(p)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"H(q) = \\sum_x -q_x\\log q_x"}</M> is a sum of concave functions of the coordinates, so H is concave on the
          probability simplex. Each frequency is unbiased, <M>{"\\mathbb{E}[\\hat p] = p"}</M>, so Jensen&apos;s inequality for
          concave functions gives <M>{"\\mathbb{E}[H(\\hat p)] \\le H(\\mathbb{E}[\\hat p]) = H(p)"}</M>. Intuitively, a small
          sample misses rare outcomes and looks more predictable than the truth.
        </p>
      </Proof>

      <Remark title="corrections, and entropy of predictions">
        <p>
          The Miller–Madow correction adds <M>{"(m - 1)/(2n)"}</M> nats, where m is the number of distinct outcomes seen
          and n the sample size; it removes the leading term of the bias. In the code, 20 draws from 8 equally likely
          outcomes give a plug-in average of 2.72 bits against the true 3, and the correction brings it to 2.95. Entropy
          also measures how unsure a model&apos;s prediction is. Dividing logits by a temperature T before the softmax moves
          the prediction from nearly certain (entropy near 0 as T → 0) to uniform (entropy <M>{"\\log_2 k"}</M> as T → ∞),
          which is how sampling temperature trades predictability for variety.
        </p>
        <Code>{ES}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "d8",
      rung: "check",
      prompt: <p>What is the entropy, in bits, of a fair eight-sided die?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "h25",
      rung: "check",
      prompt: <p>What is the binary entropy h(0.25) in bits? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8113, tolerance: 0.0001 },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: <p>Why does the plug-in entropy of a small sample tend to underestimate the true entropy?</p>,
      answer: {
        kind: "choice",
        options: [
          "Entropy is concave in the probabilities and the observed frequencies are unbiased, so by Jensen the average estimate is at most the truth; rare outcomes are often missed",
          "The logarithm of a frequency is always smaller than the logarithm of a probability",
          "Small samples always contain every outcome, which lowers the entropy",
          "The plug-in estimate uses natural logarithms instead of base 2",
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

def entropy(p, base=2.0):
    p = np.asarray(p, dtype=float); p = p[p > 0]
    return float(-(p * np.log(p)).sum() / np.log(base)) + 0.0

def binary_entropy(q):
    return entropy([q, 1 - q])

def expected_code_length(p, lengths):
    return float(np.dot(p, lengths))

p = [0.5, 0.25, 0.125, 0.125]
print(entropy(p), entropy([0.25] * 4), round(binary_entropy(0.1), 4))
print(expected_code_length(p, [1, 2, 3, 3]), entropy([1.0, 0.0]), round(entropy([0.5, 0.5], np.e), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.75 2.0 0.469\n1.75 0.0 0.6931",
          "1.75 2.0 0.469\n2.0 0.0 0.6931",
          "1.75 2.0 0.469\n1.75 0.0 1.0",
          "2.0 2.0 0.531\n1.75 1.0 0.6931",
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

def plugin_entropy(samples, k):
    p = np.bincount(samples, minlength=k) / len(samples); p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

def miller_madow(samples, k):
    m = np.count_nonzero(np.bincount(samples, minlength=k))
    return plugin_entropy(samples, k) + (m - 1) / (2 * len(samples) * np.log(2))

def softmax_entropy(logits, temperature):
    z = np.asarray(logits, dtype=float) / temperature; p = np.exp(z - z.max()); p /= p.sum()
    p = p[p > 0]
    return float(-(p * np.log2(p)).sum())

rng = np.random.default_rng(0)
runs = [rng.integers(0, 8, size=20) for _ in range(2000)]
print(round(np.mean([plugin_entropy(s, 8) for s in runs]), 2), round(np.mean([miller_madow(s, 8) for s in runs]), 2))
print([round(softmax_entropy([2.0, 1.0, 0.0, 0.0], T), 3) for T in (0.1, 1.0, 100.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.72 2.95\n[0.001, 1.513, 2.0]",
          "3.0 3.0\n[0.001, 1.513, 2.0]",
          "2.95 2.72\n[0.001, 1.513, 2.0]",
          "2.72 2.95\n[2.0, 1.513, 0.001]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>entropy(p, base=2.0)</C>, returning a float and treating 0 log 0 as 0; <C>binary_entropy(q)</C>; and{" "}
          <C>expected_code_length(p, lengths)</C>, the average codeword length.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def entropy(p, base=2.0):
    return 0.0

def binary_entropy(q):
    return 0.0

def expected_code_length(p, lengths):
    return 0.0
`,
        solution: EN,
        tests: [
          { name: "entropy", code: `assert np.isclose(entropy([0.5, 0.5]), 1.0) and np.isclose(entropy([1 / 3] * 3, 3.0), 1.0)
assert entropy([1.0, 0.0, 0.0]) == 0.0 and np.isclose(entropy([0.9, 0.1], np.e), -(0.9 * np.log(0.9) + 0.1 * np.log(0.1)))
assert isinstance(entropy([0.5, 0.5]), float)` },
          { name: "binary", code: `assert np.isclose(binary_entropy(0.5), 1.0) and np.isclose(binary_entropy(0.0), 0.0)
assert np.isclose(binary_entropy(0.2), binary_entropy(0.8)) and np.isclose(expected_code_length([0.5, 0.5], [1, 3]), 2.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>plugin_entropy(samples, k)</C> in bits for integer samples in 0, …, k − 1;{" "}
          <C>miller_madow(samples, k)</C>, adding (m − 1)/(2n) nats converted to bits; and{" "}
          <C>softmax_entropy(logits, temperature)</C>, the entropy in bits of the softmax of logits/temperature.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def plugin_entropy(samples, k):
    return 0.0

def miller_madow(samples, k):
    return 0.0

def softmax_entropy(logits, temperature):
    return 0.0
`,
        solution: ES,
        tests: [
          { name: "plugin", code: `s = np.array([0, 0, 1, 1, 2, 2, 3, 3])
assert np.isclose(plugin_entropy(s, 4), 2.0) and np.isclose(plugin_entropy(np.array([1, 1, 1]), 5), 0.0)
assert np.isclose(miller_madow(s, 4), 2.0 + 3 / (16 * np.log(2))) and np.isclose(miller_madow(np.array([2, 2]), 3), 0.0)` },
          { name: "softmax", code: `assert np.isclose(softmax_entropy([0.0, 0.0, 0.0, 0.0], 1.0), 2.0)
assert softmax_entropy([5.0, 0.0], 0.01) < 1e-6 and np.isclose(softmax_entropy([1000.0, 0.0], 1.0), 0.0)
assert np.isclose(softmax_entropy([np.log(3.0), 0.0], 1.0), -(0.75 * np.log2(0.75) + 0.25 * np.log2(0.25)))` },
        ],
      },
    },
    {
      key: "dice",
      rung: "stretch",
      prompt: <p>What is the entropy, in bits, of the sum of two fair six-sided dice? Give four decimals.</p>,
      answer: { kind: "numeric", value: 3.2744, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        One variable at a time is only the start. With two variables, how much uncertainty remains about one after you learn
        the other? The next lesson defines joint and conditional entropy to answer that.
      </p>
    </>
  ),
};
