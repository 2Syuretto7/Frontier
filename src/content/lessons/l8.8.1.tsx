import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RecallCapacityViz } from "@/components/viz/RecallCapacityViz";
import type { LessonContent } from "@/lib/types";

const FORMS = `def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def parallel_linear_attn(Q, K, V, gamma=1.0):
    out = []
    for t in range(len(Q)):
        o = [0.0] * len(V[0])
        for i in range(t + 1):
            w = gamma ** (t - i) * dot(Q[t], K[i])
            o = [a + w * b for a, b in zip(o, V[i])]
        out.append(o)
    return out

def recurrent_linear_attn(Q, K, V, gamma=1.0):
    S = [[0.0] * len(V[0]) for _ in K[0]]
    out = []
    for q, k, v in zip(Q, K, V):
        S = [[gamma * S[i][j] + k[i] * v[j] for j in range(len(v))] for i in range(len(k))]
        out.append([sum(q[i] * S[i][j] for i in range(len(q))) for j in range(len(v))])
    return out`;

const DELTA = `def read_state(S, q):
    return [sum(q[i] * S[i][j] for i in range(len(q))) for j in range(len(S[0]))]

def delta_update(S, k, v, beta):
    pred = read_state(S, k)
    return [[S[i][j] + beta * k[i] * (v[j] - pred[j]) for j in range(len(v))] for i in range(len(k))]

def recall_error(keys, values, beta=1.0):
    S = [[0.0] * len(values[0]) for _ in keys[0]]
    for k, v in zip(keys, values):
        S = delta_update(S, k, v, beta)
    return sum((a - b) ** 2 for k, v in zip(keys, values) for a, b in zip(read_state(S, k), v))`;

export const lesson: LessonContent = {
  id: "l8.8.1",
  minutes: 50,
  links: {
    requires: ["l8.7.3", "l8.2.2", "l5.6.1"],
    revisits: ["m17.6.3"],
    foreshadows: ["l8.8.2", "l8.8.3"],
  },

  puzzle: (
    <>
      <p>
        Generating each new token with softmax attention means reading the keys and values of every earlier token, so the cache
        and the time per token grow with the length. A recurrent network carries a fixed-size state instead. Drop the softmax
        from attention and the two turn out to be the same computation written two ways. What is gained, and what does a
        fixed-size state have to give up?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Without the softmax, attention&apos;s output is <M>{"\\sum_{i \\le t} (q_t \\cdot k_i) v_i = q_t^\\top \\sum_{i \\le t} k_i v_i^\\top"}</M>. The sum is a
        matrix that can be updated one token at a time, so it is a recurrent state of size <M>{"d_k \\times d_v"}</M>, whatever the
        length. Training can use the parallel form, inference the recurrent one. The price is memory: a d-by-d matrix can hold
        only about d independent associations, while a softmax cache keeps every token.
      </p>
      <RecallCapacityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear attention in two forms">
        <p>
          With decay <M>{"\\gamma \\in (0, 1]"}</M>, the parallel form is <M>{"o_t = \\sum_{i \\le t} \\gamma^{t-i}(q_t \\cdot k_i)\\,v_i"}</M>, costing{" "}
          <M>{"O(n^2 d)"}</M> for n tokens (<C>parallel_linear_attn</C>). The recurrent form keeps <M>{"S_t = \\gamma S_{t-1} + k_t v_t^\\top"}</M> and
          outputs <M>{"o_t = S_t^\\top q_t"}</M>, costing <M>{"O(n d^2)"}</M> time and <M>{"O(d^2)"}</M> memory (<C>recurrent_linear_attn</C>).
          Katharopoulos and colleagues introduced it with a positive feature map <M>{"\\phi(x) = \\mathrm{elu}(x) + 1"}</M> on queries and keys
          and a normaliser; RetNet used a fixed decay per head; gated linear attention makes the decay depend on the input.
        </p>
        <Code>{FORMS}</Code>
      </Definition>

      <Theorem title="the two forms agree">
        <p>
          For any queries, keys, values and <M>{"\\gamma"}</M>, the recurrent outputs equal the parallel ones.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction, <M>{"S_t = \\sum_{i \\le t}\\gamma^{t-i}k_i v_i^\\top"}</M>: true for t = 1, and{" "}
          <M>{"\\gamma S_{t-1} + k_t v_t^\\top = \\sum_{i < t}\\gamma^{t-i}k_i v_i^\\top + k_t v_t^\\top"}</M>. Then{" "}
          <M>{"S_t^\\top q_t = \\sum_{i \\le t}\\gamma^{t-i} v_i (k_i^\\top q_t)"}</M>, which is the parallel form. Training implementations use a
          chunkwise mix of both: parallel within chunks of length C and recurrent across them, for <M>{"O(nCd + nd^2)"}</M> work that runs
          well on matrix units.
        </p>
      </Proof>

      <Definition title="the delta rule">
        <p>
          The additive update keeps piling associations into S, so a key that resembles an earlier one retrieves a blend.
          DeltaNet replaces it with an error-correcting step: read what the key currently retrieves, <M>{"S^\\top k"}</M> (<C>read_state</C>),
          and move towards the target,
        </p>
        <MD>{"S \\leftarrow S + \\beta\\,k\\,(v - S^\\top k)^\\top"}</MD>
        <p>
          (<C>delta_update</C>), one step of gradient descent on <M>{"\\tfrac12\\|S^\\top k - v\\|^2"}</M> with step <M>{"\\beta"}</M>. With orthonormal keys and{" "}
          <M>{"\\beta = 1"}</M> every pair is recalled exactly (<C>recall_error</C>). Yang and colleagues showed how to train it in parallel,
          and gated DeltaNet adds a decay gate.
        </p>
        <Code>{DELTA}</Code>
      </Definition>

      <Remark title="the recall gap">
        <p>
          Arora and colleagues traced most of the perplexity gap between attention and efficient alternatives on real text to
          associative recall: retrieving a value that was paired with a key earlier in the context, as in-context learning
          (l5.6.1) often requires. A fixed state of size <M>{"d_k d_v"}</M> per head can store roughly <M>{"d_k"}</M> such pairs; a softmax cache
          stores all of them. This is the trade-off every architecture in this module negotiates.
        </p>
      </Remark>

      <Example title="memory at inference">
        <p>
          The key-value cache of softmax attention holds <M>{"2 \\cdot n_{\\text{layer}} \\cdot h \\cdot d_h \\cdot n"}</M> numbers for n tokens; a linear
          attention state holds <M>{"n_{\\text{layer}} \\cdot h \\cdot d_h^2"}</M>, independent of n. At short lengths the cache is smaller; past{" "}
          <M>{"n = d_h/2"}</M> tokens the state wins, and at long contexts by orders of magnitude, which is why generation with these models
          has constant cost per token.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mem",
      rung: "check",
      prompt: (
        <p>
          A model has 32 layers, 32 heads and head dimension 128. At a context of 100,000 tokens, how many times larger is its
          key-value cache than the state of a linear-attention model of the same shape?
        </p>
      ),
      answer: { kind: "numeric", value: 1562.5, tolerance: 0.5 },
    },
    {
      key: "decay",
      rung: "check",
      prompt: <p>With decay γ = 0.9, after how many steps does a token&apos;s weight in the state first fall below 0.01 of its original value?</p>,
      answer: { kind: "numeric", value: 44, tolerance: 0.5 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>Which task should a linear-attention model with small heads find hardest compared with a softmax transformer?</p>,
      answer: {
        kind: "choice",
        options: [
          "Looking up the value paired with a key mentioned once, thousands of tokens earlier, among many other key-value pairs",
          "Predicting the next word of a common phrase",
          "Continuing a sentence in the same language",
          "Copying the previous token",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def parallel_linear_attn(Q, K, V, gamma=1.0):
    out = []
    for t in range(len(Q)):
        o = [0.0] * len(V[0])
        for i in range(t + 1):
            w = gamma ** (t - i) * dot(Q[t], K[i])
            o = [a + w * b for a, b in zip(o, V[i])]
        out.append(o)
    return out

def recurrent_linear_attn(Q, K, V, gamma=1.0):
    S = [[0.0] * len(V[0]) for _ in K[0]]
    out = []
    for q, k, v in zip(Q, K, V):
        S = [[gamma * S[i][j] + k[i] * v[j] for j in range(len(v))] for i in range(len(k))]
        out.append([sum(q[i] * S[i][j] for i in range(len(q))) for j in range(len(v))])
    return out

Q, K, V = [[1.0], [1.0]], [[2.0], [1.0]], [[1.0], [3.0]]
print(parallel_linear_attn(Q, K, V), recurrent_linear_attn(Q, K, V, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2.0], [5.0]] [[2.0], [4.0]]\n11 [[0.0]]",
          "[[2.0], [5.0]] [[2.0], [5.0]]\n11 [[0.0]]",
          "[[2.0], [3.0]] [[2.0], [4.0]]\n11 [[0.0]]",
          "[[2.0], [5.0]] [[1.0], [3.5]]\n10 [[35.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def read_state(S, q):
    return [sum(q[i] * S[i][j] for i in range(len(q))) for j in range(len(S[0]))]

def delta_update(S, k, v, beta):
    pred = read_state(S, k)
    return [[S[i][j] + beta * k[i] * (v[j] - pred[j]) for j in range(len(v))] for i in range(len(k))]

def recall_error(keys, values, beta=1.0):
    S = [[0.0] * len(values[0]) for _ in keys[0]]
    for k, v in zip(keys, values):
        S = delta_update(S, k, v, beta)
    return sum((a - b) ** 2 for k, v in zip(keys, values) for a, b in zip(read_state(S, k), v))

print(dot([1, 2], [3, 4]), parallel_linear_attn([[0.0]], [[5.0]], [[7.0]]))
S = delta_update([[0.0], [0.0]], [1.0, 0.0], [2.0], 0.5)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0], [0.0]] [1.0]\n0.0 4.0",
          "[[2.0], [0.0]] [2.0]\n0.0 4.0",
          "[[1.0], [0.0]] [1.0]\n0.0 2.0",
          "[[1.0], [1.0]] [2.0]\n25.0 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dot(a, b)</C>, <C>parallel_linear_attn(Q, K, V, gamma=1.0)</C> and <C>recurrent_linear_attn(Q, K, V, gamma=1.0)</C>, with
          inputs as lists of vectors and outputs as lists of vectors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def parallel_linear_attn(Q, K, V, gamma=1.0):
    return [list(v) for v in V]

def recurrent_linear_attn(Q, K, V, gamma=1.0):
    return [list(v) for v in V]
`,
        solution: FORMS,
        tests: [
          { name: "parallel", code: `Q = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]\nK = [[1.0, 1.0], [0.0, 2.0], [1.0, 0.0]]\nV = [[1.0, 0.0], [0.0, 1.0], [2.0, 2.0]]\nassert parallel_linear_attn(Q, K, V) == [[1.0, 0.0], [1.0, 2.0], [4.0, 4.0]]\nassert parallel_linear_attn(Q, K, V, 0.5) == [[1.0, 0.0], [0.5, 2.0], [2.5, 3.0]]` },
          { name: "agree", code: `Q = [[0.3, -1.0], [2.0, 0.5], [-0.7, 1.1], [0.2, 0.2]]\nK = [[1.0, 0.4], [-0.5, 0.9], [0.3, 0.3], [1.5, -2.0]]\nV = [[0.5, 1.0, -1.0], [2.0, 0.0, 1.0], [-1.0, 0.5, 0.5], [0.0, 3.0, 1.0]]\nfor g in [1.0, 0.8]:\n    a, b = parallel_linear_attn(Q, K, V, g), recurrent_linear_attn(Q, K, V, g)\n    assert all(abs(x - y) < 1e-9 for ra, rb in zip(a, b) for x, y in zip(ra, rb))\nassert abs(b[1][0] - (0.8 * dot(Q[1], K[0]) * 0.5 + dot(Q[1], K[1]) * 2.0)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>read_state(S, q)</C>, <C>delta_update(S, k, v, beta)</C> and <C>recall_error(keys, values, beta=1.0)</C>, the total squared
          error after writing all pairs in order into a zero state and reading each key back.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def read_state(S, q):
    return [sum(q[i] * S[i][j] for i in range(len(q))) for j in range(len(S[0]))]

def delta_update(S, k, v, beta):
    return [[S[i][j] + k[i] * v[j] for j in range(len(v))] for i in range(len(k))]

def recall_error(keys, values, beta=1.0):
    return 0.0
`,
        solution: DELTA,
        tests: [
          { name: "update", code: `S = delta_update([[1.0, 0.0], [0.0, 0.0]], [1.0, 0.0], [3.0, 2.0], 0.5)\nassert S == [[2.0, 1.0], [0.0, 0.0]]` },
          { name: "recall", code: `assert recall_error([[0.0, 1.0], [1.0, 0.0]], [[2.0], [5.0]]) == 0.0\nassert abs(recall_error([[0.0, 1.0], [0.0, 1.0]], [[2.0], [5.0]]) - 9.0) < 1e-12` },
        ],
      },
    },
    {
      key: "interfere",
      rung: "stretch",
      prompt: (
        <p>
          Two pairs are written into a zero state with the delta rule and β = 1: key (1, 0) with value 1, then key (0.6, 0.8) with
          value 1. Reading each key back, what is the total squared recall error? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.058, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        A decaying matrix state is one kind of recurrence. State space models arrive at a similar recurrence from continuous-time
        signal processing, and with input-dependent parameters they became Mamba, the subject of the next lesson.
      </p>
    </>
  ),
};
