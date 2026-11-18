import { M } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VocabCostViz } from "@/components/viz/VocabCostViz";
import type { LessonContent } from "@/lib/types";

const COST = `import numpy as np

def embed_params(V, d, tied):
    return V * d if tied else 2 * V * d

def flops_per_byte(V, d, P, bytes_per_token):
    return (2 * P + 2 * d * V) / bytes_per_token

def best_vocab(Vs, cs, d, P):
    costs = [flops_per_byte(V, d, P, c) for V, c in zip(Vs, cs)]
    return Vs[int(np.argmin(costs))]`;

const ZIPF = `import numpy as np

def zipf_probs(V, s):
    w = np.arange(1, V + 1, dtype=float) ** -s
    return w / w.sum()

def tail_mass(V, s, r):
    return float(zipf_probs(V, s)[r:].sum())

def rarest_count(V, s, N):
    return float(N * zipf_probs(V, s)[-1])`;

export const lesson: LessonContent = {
  id: "l5.1.2",
  minutes: 40,
  links: {
    requires: ["l5.1.1"],
    revisits: ["l4.2.1"],
    foreshadows: ["l5.1.3", "l5.3.3"],
  },

  puzzle: (
    <>
      <p>
        GPT-2 used about 50,000 tokens. Llama 3 uses about 128,000 and Gemma about 256,000. Each extra token costs a row in
        the embedding table and a row in the output layer, and every prediction computes a score for every token. Yet the
        trend is towards larger vocabularies, and mostly for larger models. What is being traded, and why should the right
        answer depend on the size of the model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A larger vocabulary means each token carries more text, so a document becomes fewer tokens: less compute in the body
        of the network and more text in a fixed context window. Against that, the output layer must score every token at
        every step, and the embedding tables grow. Each extra merge also helps less than the last, because it captures a
        rarer pair, and the rarest tokens are seen so seldom in training that their embeddings stay poorly learned. In a
        small model the output layer is a large share of the work, so its cost dominates; in a large model the body
        dominates, and the shorter sequences win.
      </p>
      <VocabCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the costs of a vocabulary">
        <p>
          With vocabulary size V and model width d, the input embedding table and the output (unembedding) matrix each hold
          Vd parameters, or Vd in total when they are tied. Computing the logits for one position costs about 2dV
          floating-point operations, against about 2P for the rest of a model with P non-embedding parameters. If the
          tokeniser packs c(V) bytes of text into a token on average, the compute per byte of text is
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{"f(V) = \\dfrac{2P + 2dV}{c(V)}."}</M>
        </p>
        <Code>{COST}</Code>
      </Definition>

      <Theorem title="where the cheapest vocabulary sits">
        <p>
          If c is differentiable and f has a minimum at an interior V, then there
        </p>
        <p style={{ textAlign: "center" }}>
          <M>{"\\dfrac{V\\,c'(V)}{c(V)} = \\dfrac{dV}{P + dV}."}</M>
        </p>
        <p>
          In words: the elasticity of compression with respect to vocabulary size equals the output layer&apos;s fraction of the compute. If the output layer does 10% of the work, a 1% larger vocabulary must buy 0.1% more bytes per token.
        </p>
      </Theorem>
      <Proof>
        <p>
          At an interior minimum the derivative of <M>{"\\log f = \\log(2P + 2dV) - \\log c(V)"}</M> vanishes:{" "}
          <M>{"2d/(2P + 2dV) = c'(V)/c(V)"}</M>. Multiply both sides by V. Compression gains shrink as V grows, so the left
          side falls with V, while the right side rises towards 1; for a larger P the right side is smaller at every V, so
          the crossing moves to a larger vocabulary.
        </p>
      </Proof>

      <Theorem title="rare tokens are seen rarely">
        <p>
          Suppose token frequencies follow Zipf&apos;s law, <M>{"p_r \\propto r^{-s}"}</M> for rank r = 1, …, V. With s = 1 the
          rarest token has probability <M>{"1/(VH_V)"}</M>, where <M>{"H_V = \\sum_{r \\le V}1/r \\approx \\ln V"}</M>, so in a
          corpus of N tokens it is expected about <M>{"N/(V\\ln V)"}</M> times.
        </p>
      </Theorem>
      <Proof>
        <p>
          The normalising constant is <M>{"\\sum_{r \\le V}r^{-1} = H_V"}</M>, so <M>{"p_V = V^{-1}/H_V"}</M>. The expected count
          is <M>{"Np_V"}</M>. The harmonic number lies between <M>{"\\ln(V+1)"}</M> and <M>{"1 + \\ln V"}</M>.
        </p>
        <Code>{ZIPF}</Code>
      </Proof>

      <Remark title="in practice">
        <p>
          The rare-token effect is real: tokens that occurred in the tokeniser&apos;s training data but almost never in the
          model&apos;s, such as usernames scraped from one website, end up with nearly untrained embeddings and can make a
          model behave erratically when they appear. Studies that fit scaling laws including vocabulary size find, like the
          figure, that the best vocabulary grows with model size, and that many models use smaller vocabularies than their
          compute would justify. Multilingual models need larger vocabularies still, since the same budget is shared
          among many scripts. Numbers are often split into single digits, which costs tokens but makes arithmetic regular.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>A model has V = 128,000 and d = 4096, with separate embedding and unembedding matrices. How many million parameters do the two hold together?</p>,
      answer: { kind: "numeric", value: 1048.576, tolerance: 0.001 },
    },
    {
      key: "tail",
      rung: "check",
      prompt: <p>Four tokens follow Zipf&apos;s law with s = 1. What probability do the two rarest together have? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.28, tolerance: 0.006 },
    },
    {
      key: "bigger",
      rung: "apply",
      prompt: <p>Why does the compute-optimal vocabulary grow with model size?</p>,
      answer: {
        kind: "choice",
        options: [
          "The output layer's cost 2dV is a smaller share of each token's compute in a large model, so shorter sequences are worth more than a wider output layer",
          "Large models cannot learn to combine short tokens into words",
          "A larger vocabulary reduces the number of parameters in the body of the model",
          "Zipf's law changes with model size",
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

def embed_params(V, d, tied):
    return V * d if tied else 2 * V * d

def flops_per_byte(V, d, P, bytes_per_token):
    return (2 * P + 2 * d * V) / bytes_per_token

def best_vocab(Vs, cs, d, P):
    costs = [flops_per_byte(V, d, P, c) for V, c in zip(Vs, cs)]
    return Vs[int(np.argmin(costs))]

print(embed_params(50000, 768, True), embed_params(50000, 768, False), flops_per_byte(1000, 10, 5000, 2.0))
print(best_vocab([1000, 10000, 100000], [2.0, 3.0, 4.0], 100, 1e6), best_vocab([1000, 10000, 100000], [2.0, 3.0, 4.0], 100, 1e8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "38400000 76800000 15000.0\n1000 100000",
          "38400000 76800000 15000.0\n1000 1000",
          "76800000 38400000 15000.0\n1000 100000",
          "38400000 76800000 30000.0\n100000 1000",
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

def zipf_probs(V, s):
    w = np.arange(1, V + 1, dtype=float) ** -s
    return w / w.sum()

def tail_mass(V, s, r):
    return float(zipf_probs(V, s)[r:].sum())

def rarest_count(V, s, N):
    return float(N * zipf_probs(V, s)[-1])

print(zipf_probs(3, 1.0).round(3).tolist(), round(tail_mass(4, 1.0, 2), 3))
print(round(rarest_count(1000, 1.0, 1e6), 1), round(rarest_count(1000, 0.0, 1e6), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.545, 0.273, 0.182] 0.28\n133.6 1000.0",
          "[0.545, 0.273, 0.182] 0.72\n133.6 1000.0",
          "[0.333, 0.333, 0.333] 0.28\n133.6 1000.0",
          "[0.545, 0.273, 0.182] 0.28\n1000.0 133.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed_params(V, d, tied)</C>; <C>flops_per_byte(V, d, P, bytes_per_token)</C>, the formula for f; and{" "}
          <C>best_vocab(Vs, cs, d, P)</C>, returning the candidate vocabulary size with the lowest compute per byte, given
          the matching bytes-per-token values cs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def embed_params(V, d, tied):
    return V * d

def flops_per_byte(V, d, P, bytes_per_token):
    return 2 * P + 2 * d * V

def best_vocab(Vs, cs, d, P):
    return Vs[0]
`,
        solution: COST,
        tests: [
          { name: "costs", code: `assert embed_params(50000, 768, True) == 38400000 and embed_params(10, 4, False) == 80
assert abs(flops_per_byte(1000, 10, 5000, 2.0) - 15000) < 1e-9 and abs(flops_per_byte(0, 10, 7, 0.5) - 28) < 1e-12` },
          { name: "best", code: `assert best_vocab([1000, 10000, 100000], [2.0, 3.0, 4.0], 100, 1e6) == 1000 and best_vocab([1000, 10000, 100000], [2.0, 3.0, 4.0], 100, 1e8) == 100000
assert best_vocab([1000, 10000, 100000], [2.0, 3.0, 4.0], 100, 1e7) == 10000` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>zipf_probs(V, s)</C>, the probabilities for ranks 1 to V; <C>tail_mass(V, s, r)</C>, the probability of
          all ranks above r; and <C>rarest_count(V, s, N)</C>, the expected count of the rarest token in N tokens.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def zipf_probs(V, s):
    return np.ones(V) / V

def tail_mass(V, s, r):
    return 0.0

def rarest_count(V, s, N):
    return N / V
`,
        solution: ZIPF,
        tests: [
          { name: "zipf", code: `p = zipf_probs(3, 1.0); assert np.allclose(p, np.array([1, 1 / 2, 1 / 3]) / (11 / 6)) and abs(zipf_probs(50, 1.3).sum() - 1) < 1e-12
assert abs(tail_mass(4, 1.0, 2) - (7 / 12) / (25 / 12)) < 1e-12 and tail_mass(5, 2.0, 5) == 0.0` },
          { name: "rare", code: `H = sum(1 / r for r in range(1, 1001)); assert abs(rarest_count(1000, 1.0, 1e6) - 1e6 / (1000 * H)) < 1e-6 and abs(rarest_count(1000, 0.0, 1e6) - 1000) < 1e-6` },
        ],
      },
    },
    {
      key: "elastic",
      rung: "stretch",
      prompt: (
        <p>
          A model has P = 10⁹ non-embedding parameters and d = 2048. If V = 50,000 is its cheapest vocabulary, by what
          percentage must a 1% larger vocabulary increase the bytes per token there? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.093, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Once text is a sequence of token ids, the model&apos;s first act is to look each id up in a table of vectors, and
        its last is to turn a vector back into scores over the vocabulary. The next lesson studies those two matrices.
      </p>
    </>
  ),
};
