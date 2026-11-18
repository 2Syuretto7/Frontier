import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AttentionRecallViz } from "@/components/viz/AttentionRecallViz";
import type { LessonContent } from "@/lib/types";

const DECODER = `import numpy as np

def dot_attention(s, H):
    z = H @ s
    a = np.exp(z - z.max())
    a /= a.sum()
    return a @ H, a

def decoder_contexts(S, H):
    pairs = [dot_attention(s, H) for s in S]
    return np.array([c for c, _ in pairs]), np.array([a for _, a in pairs])

def coverage(A):
    return A.sum(axis=0)`;

const SCORES = `import numpy as np

def additive_scores(s, H, P):
    return np.tanh(H @ P["Wk"].T + P["Wq"] @ s) @ P["v"]

def path_length(S, T, attention):
    t, s = np.meshgrid(np.arange(1, T + 1), np.arange(1, S + 1), indexing="ij")
    return np.ones((T, S), dtype=int) if attention else S + t - s`;

export const lesson: LessonContent = {
  id: "l4.4.2",
  minutes: 50,
  links: {
    requires: ["l4.4.1", "l4.3.5"],
    revisits: ["l4.3.3"],
    foreshadows: ["l4.4.3"],
  },

  puzzle: (
    <>
      <p>
        Plot the translation quality of a 2014 encoder-decoder against sentence length and it falls off a cliff past about
        twenty words. Add one component, which lets the decoder look back at the encoder&apos;s state for every source word,
        and the curve goes flat. As a side effect, the model starts producing a matrix that says which source word each output
        word was translated from, although it was never trained to align words. Where does that matrix come from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep all the encoder states instead of only the last. Before producing each output word, the decoder forms a query from
        its own state and runs a soft lookup over the encoder states, getting a context vector focused on the source words that
        matter now. The decoder&apos;s memory of the source no longer has to fit into one vector, and the gradient from an output
        word reaches the relevant source word in a single step instead of travelling through the whole recurrence. The weights
        of each lookup, stacked over output steps, are the alignment.
      </p>
      <AttentionRecallViz />
    </>
  ),

  theory: (
    <>
      <Definition title="attention-based decoder">
        <p>
          Let <M>{"h_1, \\dots, h_S"}</M> be the encoder states (often from a bidirectional RNN, so each describes its word in
          context). At decoder step t, with previous decoder state <M>{"s_{t-1}"}</M>,
        </p>
        <MD>{"e_{t,j} = \\operatorname{score}(s_{t-1}, h_j), \\quad \\alpha_{t,\\cdot} = \\operatorname{softmax}(e_{t,\\cdot}), \\quad c_t = \\sum_{j=1}^S \\alpha_{t,j} h_j, \\quad s_t = f(s_{t-1}, y_{t-1}, c_t),"}</MD>
        <p>
          and the next-token distribution depends on <M>{"s_t"}</M> and <M>{"c_t"}</M>. Common scores are the dot product{" "}
          <M>{"s^\\top h"}</M>, the bilinear form <M>{"s^\\top W h"}</M>, and the additive score{" "}
          <M>{"v^\\top\\tanh(W_q s + W_k h)"}</M> of Bahdanau, Cho and Bengio. The matrix <M>{"(\\alpha_{t,j})"}</M> is the
          alignment; its rows sum to 1.
        </p>
        <Code>{DECODER}</Code>
      </Definition>

      <Theorem title="gradient path lengths">
        <p>
          In an encoder-decoder without attention, the shortest path in the computational graph from source position j to the
          output at step t passes through <M>{"S + t - j"}</M> recurrent transitions. With attention there is a path through one
          softmax and one weighted sum, independent of j and t.
        </p>
      </Theorem>
      <Proof>
        <p>
          Without attention, <M>{"x_j"}</M> enters <M>{"h_j"}</M>, which reaches the summary <M>{"h_S"}</M> only through{" "}
          <M>{"S - j"}</M> encoder transitions; the decoder state <M>{"s_t"}</M> depends on <M>{"h_S"}</M> only through t decoder
          transitions. There is no other route. With attention, <M>{"c_t"}</M> depends on <M>{"h_j"}</M> directly, both through
          the weighted sum and through <M>{"\\alpha_{t,j}"}</M>, and <M>{"s_t"}</M> depends on <M>{"c_t"}</M> in one step. Since the
          gradient shrinks or grows by a factor per transition, as in the BPTT lesson, a path of constant length removes the
          dependence on distance.
        </p>
        <Code>{SCORES}</Code>
      </Proof>

      <Example title="memory that grows with the input">
        <p>
          The figure repeats the read-back task from the bottleneck lesson. With 16-dimensional states, a single summary
          vector recovers about 20% of the tokens of a 60-token sequence, barely above chance, while attention over 60 states
          keyed by 16-dimensional position codes recovers 97%. With 64 dimensions attention is perfect at every length shown.
          The price is memory and compute proportional to the source length at every decoder step, <M>{"O(ST)"}</M> scores
          per sentence.
        </p>
      </Example>

      <Remark title="reading alignments, and their limits">
        <p>
          For English to French, the alignment is mostly diagonal, with small swaps where adjectives follow nouns, and it was
          learned only from the translation loss. Summing the columns gives each source word&apos;s coverage; since each row sums
          to 1, total coverage equals the output length, and a word with coverage near 0 has probably been left untranslated.
          Attention weights show where the model looked, not necessarily why it decided, so they are a hint about the model and
          not an explanation of it. The next lesson drops the recurrence entirely and lets every position attend to every
          other.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          A 50-word source is translated into a 40-word target with an attention decoder. How many attention scores are
          computed in total?
        </p>
      ),
      answer: { kind: "numeric", value: 2000, tolerance: 0.5 },
    },
    {
      key: "path",
      rung: "check",
      prompt: (
        <p>
          Without attention, how many recurrent transitions separate the first source word of a 30-word sentence from the 25th
          output word?
        </p>
      ),
      answer: { kind: "numeric", value: 54, tolerance: 0.5 },
    },
    {
      key: "swap",
      rung: "apply",
      prompt: (
        <p>
          A model translates &quot;the black cat&quot; into &quot;le chat noir&quot;. What does the alignment matrix (rows
          are output words) most likely look like?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Uniform rows, since every output word depends on the whole sentence",
          "Diagonal, since translation is word for word",
          "Le on the, then chat on cat and noir on black: a diagonal with the last two entries swapped",
          "All weight on the last source word, which holds the summary",
        ],
        correct: [2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def dot_attention(s, H):
    z = H @ s
    a = np.exp(z - z.max())
    a /= a.sum()
    return a @ H, a

def decoder_contexts(S, H):
    pairs = [dot_attention(s, H) for s in S]
    return np.array([c for c, _ in pairs]), np.array([a for _, a in pairs])

def coverage(A):
    return A.sum(axis=0)

H = np.array([[1.0, 0], [0, 1], [-1, 0]])
c, a = dot_attention(np.array([0.0, 0]), H); print(np.round(a, 3).tolist(), np.round(c, 3).tolist())
C, A = decoder_contexts(np.array([[5.0, 0], [0, 5], [-5, 0]]), H); print(A.argmax(axis=1).tolist(), np.round(coverage(A), 2).tolist(), C.shape)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.333, 0.333, 0.333] [0.0, 0.333]\n[0, 1, 2] [1.0, 1.0, 1.0] (3, 2)",
          "[0.333, 0.333, 0.333] [0.0, 0.0]\n[0, 1, 2] [1.0, 1.0, 1.0] (3, 2)",
          "[0.333, 0.333, 0.333] [0.0, 0.333]\n[0, 1, 0] [2.0, 1.0, 0.0] (3, 2)",
          "[0.333, 0.333, 0.333] [0.0, 0.333]\n[0, 1, 2] [1.0, 1.0, 1.0] (3, 3)",
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

def additive_scores(s, H, P):
    return np.tanh(H @ P["Wk"].T + P["Wq"] @ s) @ P["v"]

def path_length(S, T, attention):
    t, s = np.meshgrid(np.arange(1, T + 1), np.arange(1, S + 1), indexing="ij")
    return np.ones((T, S), dtype=int) if attention else S + t - s

P = {"Wq": np.eye(2), "Wk": np.eye(2), "v": np.array([1.0, -1.0])}
print(np.round(additive_scores(np.zeros(2), np.array([[1.0, 0], [0, 1], [0, 0]]), P), 3).tolist(), np.round(additive_scores(np.array([100.0, 0]), np.array([[1.0, 0], [5, 0]]), P), 3).tolist())
L0, L1 = path_length(4, 3, False), path_length(4, 3, True); print(L0[0].tolist(), int(L0.max()), int(L1.max()), L0.shape)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.762, -0.762, 0.0] [1.0, 1.0]\n[4, 3, 2, 1] 6 1 (3, 4)",
          "[0.762, -0.762, 0.0] [1.0, 5.0]\n[4, 3, 2, 1] 6 1 (3, 4)",
          "[0.762, 0.762, 0.0] [1.0, 1.0]\n[4, 3, 2, 1] 6 1 (3, 4)",
          "[0.762, -0.762, 0.0] [1.0, 1.0]\n[1, 2, 3, 4] 7 1 (4, 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dot_attention(s, H)</C> returning the context vector and weights for one decoder state,{" "}
          <C>decoder_contexts(S, H)</C> doing this for every row of S and returning the stacked contexts and the alignment
          matrix, and <C>coverage(A)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dot_attention(s, H):
    return None, None

def decoder_contexts(S, H):
    return None, None

def coverage(A):
    return None
`,
        solution: DECODER,
        tests: [
          { name: "single", code: `H = np.array([[1.0, 2], [3, -1], [0, 0], [2, 2]]); s = np.array([0.5, -0.2]); c, a = dot_attention(s, H); z = H @ s; w = np.exp(z) / np.exp(z).sum()
assert np.allclose(a, w) and np.allclose(c, w @ H) and np.allclose(dot_attention(np.array([800.0, 0]), H)[1], [0, 1, 0, 0])` },
          { name: "alignment", code: `H = np.eye(3) * 20; C, A = decoder_contexts(np.array([[0, 0, 1.0], [1, 0, 0], [0, 1, 0], [0, 1, 0]]), H)
assert A.shape == (4, 3) and C.shape == (4, 3) and A.argmax(1).tolist() == [2, 0, 1, 1] and np.allclose(coverage(A), [1, 2, 1], atol=1e-6) and np.isclose(coverage(A).sum(), 4)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>additive_scores(s, H, P)</C>, the scores <M>{"v^\\top\\tanh(W_q s + W_k h_j)"}</M> for every row of H with
          parameters Wq, Wk and v, and <C>path_length(S, T, attention)</C>, the (T, S) matrix of transitions between source j and
          output t from the theorem (all ones with attention).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def additive_scores(s, H, P):
    return np.zeros(len(H))

def path_length(S, T, attention):
    return np.zeros((T, S), dtype=int)
`,
        solution: SCORES,
        tests: [
          { name: "additive", code: `rng = np.random.default_rng(3); P = {"Wq": rng.normal(size=(4, 2)), "Wk": rng.normal(size=(4, 3)), "v": rng.normal(size=4)}; H, s = rng.normal(size=(5, 3)), rng.normal(size=2)
assert np.allclose(additive_scores(s, H, P), [P["v"] @ np.tanh(P["Wq"] @ s + P["Wk"] @ h) for h in H])` },
          { name: "paths", code: `L = path_length(3, 2, False); assert L.tolist() == [[3, 2, 1], [4, 3, 2]] and path_length(5, 4, True).shape == (4, 5) and (path_length(5, 4, True) == 1).all() and path_length(30, 20, False).mean() == 25` },
        ],
      },
    },
    {
      key: "mean",
      rung: "stretch",
      prompt: (
        <p>
          Without attention, what is the average path length over all pairs of source and output positions for a 30-word source
          and a 20-word output?
        </p>
      ),
      answer: { kind: "numeric", value: 25, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If attention can carry information from any position to any other in one step, the recurrence is no longer needed to
        move information around. The next lesson lets each position of a single sequence attend to all the others.
      </p>
    </>
  ),
};
