import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DpiViz } from "@/components/viz/DpiViz";
import type { LessonContent } from "@/lib/types";

const CH = `import numpy as np

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def mi_channel(px, K):
    P = np.asarray(px)[:, None] * K
    return H(px) + H(P.sum(axis=0)) - H(P)

def bsc(eps):
    return np.array([[1 - eps, eps], [eps, 1 - eps]])`;

const SF = `import numpy as np
from itertools import product

def joint_theta_flips(thetas, n):
    seqs = list(product([0, 1], repeat=n))
    P = np.array([[t ** sum(s) * (1 - t) ** (n - sum(s)) for s in seqs] for t in thetas])
    return P / len(thetas), seqs

def mi_table(P):
    px, py = P.sum(axis=1, keepdims=True), P.sum(axis=0, keepdims=True); m = P > 0
    return float((P[m] * np.log2(P[m] / (px @ py)[m])).sum())

def merge_columns(P, labels):
    keys = sorted(set(labels))
    return np.stack([P[:, [i for i, l in enumerate(labels) if l == k]].sum(axis=1) for k in keys], axis=1)`;

export const lesson: LessonContent = {
  id: "m12.2.4",
  minutes: 40,
  links: {
    requires: ["m12.2.3"],
    revisits: ["m9.3.1", "m7.1.5"],
    foreshadows: ["m12.2.5", "m12.6.4"],
  },

  puzzle: (
    <>
      <p>
        A message is whispered down a line of people, each mishearing a bit now and then. Everyone agrees the last person
        cannot know more about the original than the first listener did. But what about clever processing: denoising,
        feature extraction, a deep network&apos;s tenth layer? Could some transformation of the data ever reveal more about the
        label than the raw data contained? And if processing can only lose information, which summaries lose none at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If Z is computed from Y, with or without extra randomness, then everything Z knows about X it learned through Y.
        So I(X; Z) ≤ I(X; Y): no processing can create information about X, it can only keep or destroy it. The summaries
        that keep all of it are the sufficient statistics. When flipping a coin of unknown bias, the number of heads is
        enough, and the order of the flips adds nothing.
      </p>
      <DpiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Markov chains of three variables">
        <p>
          X → Y → Z is a Markov chain if <M>{"p(x, y, z) = p(x)\\,p(y \\mid x)\\,p(z \\mid y)"}</M>: Z depends on X only
          through Y. Equivalently X and Z are conditionally independent given Y, so{" "}
          <M>{"I(X; Z \\mid Y) = 0"}</M>, and the chain can be read backwards, Z → Y → X. Any Z = f(Y), or Z produced from Y
          with independent noise, gives such a chain.
        </p>
      </Definition>

      <Theorem title="the data processing inequality">
        <p>
          If X → Y → Z, then <M>{"I(X; Z) \\le I(X; Y)"}</M>, with equality if and only if <M>{"I(X; Y \\mid Z) = 0"}</M>.
          In particular <M>{"I(X; f(Y)) \\le I(X; Y)"}</M> for every function f.
        </p>
      </Theorem>
      <Proof>
        <p>Expand I(X; Y, Z) with the chain rule in two orders:</p>
        <MD>{"I(X; Y, Z) = I(X; Z) + I(X; Y \\mid Z) = I(X; Y) + I(X; Z \\mid Y)."}</MD>
        <p>
          The Markov property gives <M>{"I(X; Z \\mid Y) = 0"}</M>, so{" "}
          <M>{"I(X; Z) = I(X; Y) - I(X; Y \\mid Z) \\le I(X; Y)"}</M>, since conditional mutual information is an average of
          mutual informations and so nonnegative. Equality holds exactly when <M>{"I(X; Y \\mid Z) = 0"}</M>.
        </p>
        <Code>{CH}</Code>
      </Proof>

      <Remark title="noisy chains">
        <p>
          A fair bit sent through a channel that flips it with probability 0.1 keeps 1 − h(0.1) = 0.531 bits. Two such stages
          act like one channel with flip probability 0.18, keeping 0.320 bits, and the information keeps falling, to 0.198
          and 0.125, as the code shows. A noiseless stage keeps everything, and a channel with flip probability ½ destroys
          everything.
        </p>
      </Remark>

      <Definition title="sufficient statistics">
        <p>
          A statistic T = T(Y) is sufficient for X when Y and X are conditionally independent given T, so that X → T → Y
          is also a Markov chain. Then the inequality applies both ways round, and <M>{"I(X; T) = I(X; Y)"}</M>: T keeps
          every bit of information Y has about X.
        </p>
      </Definition>

      <Theorem title="the number of heads is sufficient">
        <p>
          If θ is a random bias and Y = (Y₁, …, Yₙ) are flips that are independent given θ, then T = Σᵢ Yᵢ satisfies{" "}
          <M>{"I(\\theta; T) = I(\\theta; Y)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"p(y \\mid \\theta) = \\theta^{t}(1 - \\theta)^{n - t}"}</M> with t = Σyᵢ, so given T = t every sequence with t
          heads has conditional probability <M>{"1/\\binom nt"}</M>, whatever θ is. Hence Y is independent of θ given T,
          θ → T → Y is a Markov chain, and the data processing inequality gives <M>{"I(\\theta; Y) \\le I(\\theta; T)"}</M>.
          The reverse inequality holds because T is a function of Y. In the code, with three biases and three flips, both
          are 0.4454 bits, the first flip alone carries only 0.1854, and a constant carries nothing.
        </p>
        <Code>{SF}</Code>
      </Proof>

      <Remark title="what this does and does not say about deep networks">
        <p>
          Layers of a network form a chain X → h₁ → h₂ → …, and for a label Y the inequality gives{" "}
          <M>{"I(Y; h_k) \\le I(Y; X)"}</M>: no layer knows more about the label than the input. That does not make layers
          useless. Learning makes the information usable, for example linearly separable, which mutual information does not
          measure. And for deterministic networks with continuous inputs the mutual information between input and layer is
          typically infinite, a warning that matters when the information bottleneck is read critically at the end of the
          course. Processing also cannot increase KL divergence: passing two distributions through the same channel can
          only make them harder to tell apart, a fact the next lesson generalises.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bound",
      rung: "check",
      prompt: <p>If X → Y → Z and I(X; Y) = 0.8 bits, what is the largest possible value of I(X; Z)?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "two",
      rung: "check",
      prompt: (
        <p>
          A fair bit passes through two independent stages, each flipping it with probability 0.1. What is the overall
          probability that the output differs from the input?
        </p>
      ),
      answer: { kind: "numeric", value: 0.18, tolerance: 0.0001 },
    },
    {
      key: "suff",
      rung: "apply",
      prompt: <p>When does a statistic T(Y) keep all the information Y has about X?</p>,
      answer: {
        kind: "choice",
        options: [
          "When Y and X are conditionally independent given T, so that X → T → Y is a Markov chain",
          "Whenever T takes as many values as Y",
          "Whenever T is a deterministic function of Y",
          "Only when T = Y",
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

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def mi_channel(px, K):
    P = np.asarray(px)[:, None] * K
    return H(px) + H(P.sum(axis=0)) - H(P)

def bsc(eps):
    return np.array([[1 - eps, eps], [eps, 1 - eps]])

px = np.array([0.5, 0.5])
print([round(mi_channel(px, np.linalg.matrix_power(bsc(0.1), k)), 4) for k in range(1, 5)])
print(round(mi_channel(px, bsc(0.1) @ bsc(0.0)), 4), mi_channel(px, bsc(0.5)) + 0.0, mi_channel(px, np.eye(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.531, 0.3199, 0.1984, 0.1247]\n0.531 0.0 1.0",
          "[0.531, 0.531, 0.531, 0.531]\n0.531 0.0 1.0",
          "[0.531, 0.2819, 0.1497, 0.0795]\n0.531 0.0 1.0",
          "[0.531, 0.3199, 0.1984, 0.1247]\n0.469 1.0 0.0",
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
from itertools import product

def joint_theta_flips(thetas, n):
    seqs = list(product([0, 1], repeat=n))
    P = np.array([[t ** sum(s) * (1 - t) ** (n - sum(s)) for s in seqs] for t in thetas])
    return P / len(thetas), seqs

def mi_table(P):
    px, py = P.sum(axis=1, keepdims=True), P.sum(axis=0, keepdims=True); m = P > 0
    return float((P[m] * np.log2(P[m] / (px @ py)[m])).sum())

def merge_columns(P, labels):
    keys = sorted(set(labels))
    return np.stack([P[:, [i for i, l in enumerate(labels) if l == k]].sum(axis=1) for k in keys], axis=1)

P, seqs = joint_theta_flips([0.2, 0.5, 0.8], 3); full = mi_table(P)
by_count = mi_table(merge_columns(P, [sum(s) for s in seqs])); first = mi_table(merge_columns(P, [s[0] for s in seqs]))
print(round(full, 4), bool(np.isclose(full, by_count)), round(first, 4), mi_table(merge_columns(P, [0] * len(seqs))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.4454 True 0.1854 0.0", "0.4454 False 0.1854 0.0", "0.4454 True 0.4454 0.0", "1.585 True 0.1854 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>H(p)</C> in bits; <C>mi_channel(px, K)</C>, the mutual information between an input with distribution{" "}
          <C>px</C> and the output of the channel whose row-stochastic matrix is K; and <C>bsc(eps)</C>, the 2 × 2 channel
          that flips its input with probability eps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def H(p):
    return 0.0

def mi_channel(px, K):
    return 0.0

def bsc(eps):
    return np.eye(2)
`,
        solution: CH,
        tests: [
          { name: "bsc", code: `assert np.allclose(bsc(0.25), [[0.75, 0.25], [0.25, 0.75]]) and np.isclose(mi_channel(np.array([0.5, 0.5]), bsc(0.0)), 1.0)
assert np.isclose(mi_channel(np.array([0.5, 0.5]), bsc(0.11)), 1 + 0.11 * np.log2(0.11) + 0.89 * np.log2(0.89))` },
          { name: "dpi", code: `px = np.array([0.2, 0.3, 0.5]); K1 = np.array([[0.7, 0.3], [0.4, 0.6], [0.1, 0.9]]); K2 = np.array([[0.8, 0.2], [0.3, 0.7]])
assert mi_channel(px, K1 @ K2) < mi_channel(px, K1) and np.isclose(mi_channel(px, np.eye(3)), H(px))
assert np.isclose(mi_channel(px, np.ones((3, 2)) / 2), 0.0, atol=1e-12)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>joint_theta_flips(thetas, n)</C>, returning the joint table of a uniformly chosen bias and n flips (rows
          biases, columns sequences from <C>itertools.product([0, 1], repeat=n)</C>) together with the list of sequences;{" "}
          <C>mi_table(P)</C> in bits; and <C>merge_columns(P, labels)</C>, summing the columns with equal labels, in sorted
          label order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import product

def joint_theta_flips(thetas, n):
    return np.zeros((len(thetas), 2 ** n)), []

def mi_table(P):
    return 0.0

def merge_columns(P, labels):
    return P
`,
        solution: SF,
        tests: [
          { name: "joint", code: `P, seqs = joint_theta_flips([0.5, 1.0], 2)
assert seqs == [(0, 0), (0, 1), (1, 0), (1, 1)] and np.allclose(P, [[0.125] * 4, [0, 0, 0, 0.5]])
assert np.allclose(merge_columns(P, [0, 1, 1, 2]), [[0.125, 0.25, 0.125], [0, 0, 0.5]])` },
          { name: "suff", code: `P, seqs = joint_theta_flips([0.1, 0.6], 4)
assert np.isclose(mi_table(P), mi_table(merge_columns(P, [sum(s) for s in seqs])))
assert mi_table(merge_columns(P, [s[0] + s[1] for s in seqs])) < mi_table(P) and np.isclose(mi_table(np.eye(2) / 2), 1.0)` },
        ],
      },
    },
    {
      key: "two2",
      rung: "stretch",
      prompt: (
        <p>
          A fair bit passes through two independent stages, each flipping it with probability 0.2. How many bits of
          information about the input does the final output carry? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0956, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        KL divergence is one way to compare distributions; total variation and the Hellinger and chi-squared distances are
        others. The next lesson shows they are all members of one family, the f-divergences, and that every member obeys a
        data processing inequality.
      </p>
    </>
  ),
};
