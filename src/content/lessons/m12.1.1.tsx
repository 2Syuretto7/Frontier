import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SurpriseViz } from "@/components/viz/SurpriseViz";
import type { LessonContent } from "@/lib/types";

const SU = `import numpy as np

def surprisal(p, base=2.0):
    return -np.log(p) / np.log(base)

def sequence_surprisal(probs):
    return float(np.sum(surprisal(np.asarray(probs, dtype=float))))

def questions_needed(n):
    return int(np.ceil(np.log2(n) - 1e-12))`;

const BG = `import numpy as np

def bigram_model(text, alpha=1.0):
    chars = sorted(set(text)); idx = {c: i for i, c in enumerate(chars)}
    C = np.full((len(chars), len(chars)), alpha)
    for a, b in zip(text, text[1:]):
        C[idx[a], idx[b]] += 1
    return idx, C / C.sum(axis=1, keepdims=True)

def token_surprisals(text, idx, P):
    return [float(-np.log2(P[idx[a], idx[b]])) for a, b in zip(text, text[1:])]`;

export const lesson: LessonContent = {
  id: "m12.1.1",
  minutes: 40,
  links: {
    requires: ["m7.1.5", "m2.4.4"],
    revisits: ["m7.2.2"],
    foreshadows: ["m12.1.2", "m12.2.2", "m12.4.2"],
  },

  puzzle: (
    <>
      <p>
        A friend tells you a fair coin came up heads. Another tells you a fair die came up 6. A third tells you both. The
        second piece of news feels more informative than the first, and the third should be worth exactly the first two
        together, since the coin and the die have nothing to do with each other. Is there a way to measure the information
        in a piece of news that behaves like this, and is it unique? And what does it have to do with the number a language
        model prints as its training loss?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        News of a likely event tells you little; news of an unlikely one tells you a lot. Independent probabilities
        multiply, and the one function that turns multiplication into addition is the logarithm. So the information, or
        surprise, of an event with probability p is −log p. In base 2 it counts yes/no questions: an outcome that is one of
        8 equally likely possibilities takes 3 questions to pin down and carries 3 bits. A language model&apos;s loss on a
        token is exactly the surprise of the token that actually came next.
      </p>
      <SurpriseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="surprise">
        <p>
          The surprise, or self-information, of an outcome x of probability <M>{"p(x) > 0"}</M> is
        </p>
        <MD>{"h(x) = -\\log_2 p(x) \\text{ bits}, \\qquad \\text{or} \\quad -\\ln p(x) \\text{ nats}."}</MD>
        <p>
          One nat is <M>{"1/\\ln 2 \\approx 1.443"}</M> bits. A certain event has surprise 0, a fair coin 1 bit, a fair die{" "}
          <M>{"\\log_2 6 \\approx 2.585"}</M> bits.
        </p>
      </Definition>

      <Theorem title="surprise is forced by additivity">
        <p>
          Let <M>{"I : (0, 1] \\to \\mathbb{R}"}</M> be nonincreasing, with <M>{"I(pq) = I(p) + I(q)"}</M> for all p, q and{" "}
          <M>{"I(1/2) = 1"}</M>. Then <M>{"I(p) = -\\log_2 p"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put <M>{"f(x) = I(2^{-x})"}</M> for x ≥ 0. Then <M>{"f(x + y) = f(x) + f(y)"}</M>, f(1) = 1, and f is nondecreasing.
          Additivity gives f(0) = 0 and, by induction, f(n) = n for whole numbers n. For m/n with n ≥ 1,{" "}
          <M>{"n\\,f(m/n) = f(m) = m"}</M>, so f(r) = r for every nonnegative rational r. For real x ≥ 0 and rationals{" "}
          <M>{"r < x < r'"}</M>, monotonicity gives <M>{"r \\le f(x) \\le r'"}</M>, and letting r, r′ approach x gives f(x) = x.
          Finally, any p ∈ (0, 1] is <M>{"2^{-x}"}</M> with <M>{"x = -\\log_2 p"}</M>, so <M>{"I(p) = -\\log_2 p"}</M>.
        </p>
      </Proof>

      <Theorem title="surprise counts questions">
        <p>
          To identify one of n equally likely items by yes/no questions takes <M>{"\\lceil \\log_2 n\\rceil"}</M> questions in
          the worst case. When n = 2^k, every item has surprise exactly k bits.
        </p>
      </Theorem>
      <Proof>
        <p>
          k questions have at most <M>{"2^k"}</M> possible answer sequences, and different items must produce different
          sequences, so <M>{"2^k \\ge n"}</M>, that is <M>{"k \\ge \\log_2 n"}</M>. Conversely, number the items in binary using{" "}
          <M>{"\\lceil \\log_2 n\\rceil"}</M> digits and ask for each digit in turn. Each item has probability 1/n and so
          surprise <M>{"\\log_2 n"}</M>.
        </p>
        <Code>{SU}</Code>
      </Proof>

      <Remark title="surprise is the log loss">
        <p>
          A classifier that assigns probability <M>{"q(y \\mid x)"}</M> to the true label y has loss{" "}
          <M>{"-\\ln q(y \\mid x)"}</M>: its surprise at the truth, in nats. A language model factors the probability of a
          text as a product of next-token probabilities, so the surprise of the whole text is the sum of the per-token
          surprises, and the reported loss is their average. The code fits a bigram model, the simplest such predictor,
          with add-one smoothing so that no transition has probability zero and infinite surprise. Trained on alternating
          a and b, it finds &quot;ab&quot; and &quot;ba&quot; unsurprising and &quot;bb&quot; costly at 2.81 bits. The average
          surprise over many outcomes is the subject of the next lesson.
        </p>
        <Code>{BG}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>What is the surprise, in bits, of rolling a 6 with a fair die? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.585, tolerance: 0.001 },
    },
    {
      key: "nats",
      rung: "check",
      prompt: <p>What is the surprise, in nats, of an event with probability 0.1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.3026, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is the surprise of an event a logarithm of its probability rather than, say, 1/p or 1 − p?</p>,
      answer: {
        kind: "choice",
        options: [
          "Probabilities of independent events multiply, and the logarithm is the monotone function that turns that product into a sum",
          "The logarithm is the only function that is zero at p = 1",
          "Logarithms are cheaper to compute than reciprocals",
          "1/p is not defined for p = 0, while the logarithm is",
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

def surprisal(p, base=2.0):
    return -np.log(p) / np.log(base)

def sequence_surprisal(probs):
    return float(np.sum(surprisal(np.asarray(probs, dtype=float))))

def questions_needed(n):
    return int(np.ceil(np.log2(n) - 1e-12))

print(surprisal(0.5), round(float(surprisal(1 / 6)), 3), round(float(surprisal(1 / 8, np.e)), 4))
print(np.isclose(sequence_surprisal([0.5, 0.25]), surprisal(0.125)), [questions_needed(n) for n in (2, 6, 8, 1000)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 2.585 2.0794\nTrue [1, 3, 3, 10]",
          "1.0 2.585 3.0\nTrue [1, 3, 3, 10]",
          "1.0 2.585 2.0794\nTrue [1, 3, 4, 10]",
          "0.6931 1.7918 2.0794\nFalse [1, 2, 3, 9]",
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

def bigram_model(text, alpha=1.0):
    chars = sorted(set(text)); idx = {c: i for i, c in enumerate(chars)}
    C = np.full((len(chars), len(chars)), alpha)
    for a, b in zip(text, text[1:]):
        C[idx[a], idx[b]] += 1
    return idx, C / C.sum(axis=1, keepdims=True)

def token_surprisals(text, idx, P):
    return [float(-np.log2(P[idx[a], idx[b]])) for a, b in zip(text, text[1:])]

idx, P = bigram_model("abababababab")
print(np.round(P, 3))
s = token_surprisals("abba", idx, P)
print([round(v, 2) for v in s], round(sum(s) / len(s), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.125 0.875]\n [0.857 0.143]]\n[0.19, 2.81, 0.22] 1.07",
          "[[0.    1.   ]\n [1.    0.   ]]\n[0.0, inf, 0.0] inf",
          "[[0.125 0.875]\n [0.857 0.143]]\n[0.19, 0.22, 2.81] 1.07",
          "[[0.875 0.125]\n [0.143 0.857]]\n[2.81, 0.19, 2.81] 1.94",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>surprisal(p, base=2.0)</C>, working on scalars and arrays; <C>sequence_surprisal(probs)</C>, the total
          surprise in bits of independent outcomes with these probabilities, as a float; and <C>questions_needed(n)</C>, the
          worst-case number of yes/no questions to identify one of n items.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def surprisal(p, base=2.0):
    return p

def sequence_surprisal(probs):
    return 0.0

def questions_needed(n):
    return n
`,
        solution: SU,
        tests: [
          { name: "surprise", code: `assert np.isclose(surprisal(0.25), 2.0) and np.isclose(surprisal(np.exp(-3.0), np.e), 3.0)
assert np.allclose(surprisal(np.array([1.0, 0.5, 0.125])), [0.0, 1.0, 3.0]) and np.isclose(surprisal(0.01, 10.0), 2.0)` },
          { name: "total", code: `assert np.isclose(sequence_surprisal([0.5, 0.5, 0.25]), 4.0) and isinstance(sequence_surprisal([0.5]), float)
assert [questions_needed(n) for n in (1, 2, 3, 4, 5, 1024, 1025)] == [0, 1, 2, 2, 3, 10, 11]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bigram_model(text, alpha=1.0)</C>, returning a dict from each character (in sorted order) to its index
          and the matrix of next-character probabilities with add-α smoothing, and{" "}
          <C>token_surprisals(text, idx, P)</C>, the list of surprises in bits of each character after the first.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bigram_model(text, alpha=1.0):
    return {}, np.zeros((0, 0))

def token_surprisals(text, idx, P):
    return []
`,
        solution: BG,
        tests: [
          { name: "model", code: `idx, P = bigram_model("aab")
assert idx == {"a": 0, "b": 1} and np.allclose(P, [[2 / 4, 2 / 4], [1 / 2, 1 / 2]])
idx, P = bigram_model("abc", 0.5)
assert np.allclose(P.sum(axis=1), 1.0) and np.isclose(P[0, 1], 1.5 / 2.5)` },
          { name: "surprise", code: `idx, P = bigram_model("aab")
assert np.allclose(token_surprisals("aaba", idx, P), [1.0, 1.0, 1.0])
idx, P = bigram_model("abab", 0.0)
assert np.allclose(token_surprisals("abab", idx, P), [0.0, 0.0, 0.0])` },
        ],
      },
    },
    {
      key: "avg",
      rung: "stretch",
      prompt: (
        <p>
          A model gives the three tokens of a sentence probabilities 0.5, 0.25 and 0.125. What is its average surprise per
          token, in bits?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Surprise belongs to one outcome. Averaging it over all outcomes of a random variable gives its entropy, the
        expected number of bits needed to describe a draw, which the next lesson defines and bounds.
      </p>
    </>
  ),
};
