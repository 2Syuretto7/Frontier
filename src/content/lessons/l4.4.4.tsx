import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HeadSplitViz } from "@/components/viz/HeadSplitViz";
import type { LessonContent } from "@/lib/types";

const MHA = `import numpy as np

def split_heads(X, h):
    n, d = X.shape
    return X.reshape(n, h, d // h).transpose(1, 0, 2)

def merge_heads(Y):
    h, n, dk = Y.shape
    return Y.transpose(1, 0, 2).reshape(n, h * dk)

def multi_head(X, P, h):
    Q, K, V = (split_heads(X @ P[k], h) for k in "qkv")
    S = Q @ K.transpose(0, 2, 1) / np.sqrt(Q.shape[2])
    A = np.exp(S - S.max(axis=-1, keepdims=True))
    A /= A.sum(axis=-1, keepdims=True)
    return merge_heads(A @ V) @ P["o"], A`;

const KV = `import numpy as np

def kv_cache_bytes(layers, ctx, kv_heads, d_head, bytes_per):
    return 2 * layers * ctx * kv_heads * d_head * bytes_per

def repeat_kv(K, h):
    return np.repeat(K, h // K.shape[0], axis=0)`;

export const lesson: LessonContent = {
  id: "l4.4.4",
  minutes: 50,
  links: {
    requires: ["l4.4.3"],
    revisits: ["m3.8.3", "l3.2.3"],
    foreshadows: ["l4.6.1"],
  },

  puzzle: (
    <>
      <p>
        A transformer layer of width 768 could use one attention with 768-dimensional queries and keys. Instead it cuts the
        width into twelve heads of 64 and runs twelve attentions side by side. The parameter count is exactly the same, and
        each head&apos;s comparisons are made in a space twelve times smaller. What does the model gain by splitting, and what
        could a single wide head not do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        One attention computes one probability distribution per position, and its output is a single weighted average of the
        values. If a word needs to gather two unrelated pieces of information, say its syntactic head and the previous word,
        one distribution has to split its mass and the two pieces arrive blended. Several heads compute several distributions,
        each free to look somewhere different, and their outputs are concatenated rather than averaged. Interpretability work
        has found heads that track the previous token, heads that copy earlier repetitions, and heads that follow syntax.
      </p>
      <HeadSplitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="multi-head attention">
        <p>
          With h heads of size <M>{"d_k = d/h"}</M>, split the columns of <M>{"Q = XW_q"}</M>, <M>{"K = XW_k"}</M> and{" "}
          <M>{"V = XW_v"}</M> into h blocks, attend within each block, concatenate and mix:
        </p>
        <MD>{"\\operatorname{MHA}(X) = [\\,A_1 V_1 \\mid \\dots \\mid A_h V_h\\,]\\,W_o, \\qquad A_i = \\operatorname{softmax}\\Bigl(\\frac{Q_i K_i^\\top}{\\sqrt{d_k}}\\Bigr)."}</MD>
        <p>
          The four d × d matrices give <M>{"4d^2"}</M> weights (plus biases if used) for any h, and the cost of the scores is the
          same as one head of width d. The split is a reshape, not extra computation.
        </p>
        <Code>{MHA}</Code>
      </Definition>

      <Theorem title="heads add up">
        <p>
          Writing <M>{"W_o"}</M> as row blocks <M>{"W_o^{(1)}, \\dots, W_o^{(h)}"}</M>,{" "}
          <M>{"\\operatorname{MHA}(X) = \\sum_{i=1}^{h} A_i X W_v^{(i)} W_o^{(i)}"}</M>. Each head&apos;s attention pattern depends
          only on <M>{"W_q^{(i)} W_k^{(i)\\top}"}</M>, a d × d matrix of rank at most <M>{"d_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiplying a row of blocks by a column of blocks sums the products of matching blocks, which gives the first
          identity, with <M>{"V_i = XW_v^{(i)}"}</M>. For the second, the scores are{" "}
          <M>{"Q_i K_i^\\top = X W_q^{(i)} W_k^{(i)\\top} X^\\top"}</M>, and a product through a <M>{"d_k"}</M>-dimensional space has
          rank at most <M>{"d_k"}</M>. So h heads give h independent low-rank bilinear similarity measures, each with its own
          value-output map, and the layer is their sum.
        </p>
      </Proof>

      <Theorem title="one head returns one mixture">
        <p>
          Each output row of a single head is <M>{"\\sum_j \\alpha_{ij} v_j"}</M> with α a probability vector, a point in the
          convex hull of the value vectors.
        </p>
      </Theorem>
      <Proof>
        <p>
          The weights are non-negative and sum to one. To return two different value vectors exactly, a single head would need
          all its weight on each of them at once, which is impossible unless the values themselves are arranged to carry both
          pieces in separate coordinates. Separate heads have separate α and so avoid the trade-off.
        </p>
      </Proof>

      <Example title="previous token and first token">
        <p>
          In the figure each position must output its previous token and the first token. Two heads, each sharply focused,
          solve it with mean squared error below 0.0001. A single head of the same total width splits its weight 0.499 and 0.499
          between the two positions, outputs the average of the two tokens for both halves, and has error 0.458.
        </p>
      </Example>

      <Remark title="heads at inference time">
        <p>
          Generating text one token at a time, a model stores the keys and values of all earlier positions, the KV cache, so
          they need not be recomputed. Its size, two tensors per layer of shape context × heads × head size, often exceeds the
          weights for long contexts. Multi-query attention shares one key and value head among all query heads, and grouped-query
          attention shares each of g key-value heads among h/g query heads, shrinking the cache by h/g with little loss.
        </p>
        <Code>{KV}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>How many weights (no biases) does a multi-head attention layer of width 512 with 8 heads have?</p>,
      answer: { kind: "numeric", value: 1048576, tolerance: 0.5 },
    },
    {
      key: "dk",
      rung: "check",
      prompt: <p>A model of width 768 uses 12 heads. What is the dimension of each head&apos;s queries and keys?</p>,
      answer: { kind: "numeric", value: 64, tolerance: 0.001 },
    },
    {
      key: "same",
      rung: "apply",
      prompt: <p>Why does the parameter count of a multi-head attention layer not depend on the number of heads?</p>,
      answer: {
        kind: "choice",
        options: [
          "Heads share the same projection matrices",
          "Each head uses a d/h slice of the same d × d projections, so the slices together make up exactly the full matrices",
          "Only the first head has parameters; the others are copies",
          "The output projection shrinks as heads are added",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def split_heads(X, h):
    n, d = X.shape
    return X.reshape(n, h, d // h).transpose(1, 0, 2)

def merge_heads(Y):
    h, n, dk = Y.shape
    return Y.transpose(1, 0, 2).reshape(n, h * dk)

def multi_head(X, P, h):
    Q, K, V = (split_heads(X @ P[k], h) for k in "qkv")
    S = Q @ K.transpose(0, 2, 1) / np.sqrt(Q.shape[2])
    A = np.exp(S - S.max(axis=-1, keepdims=True))
    A /= A.sum(axis=-1, keepdims=True)
    return merge_heads(A @ V) @ P["o"], A

X = np.arange(12.0).reshape(2, 6); S = split_heads(X, 3); print(S.shape, S[1].tolist(), np.array_equal(merge_heads(S), X))
P = {k: np.eye(4) for k in "qkvo"}; Y, A = multi_head(np.zeros((3, 4)), P, 2); print(Y.shape, A.shape, np.allclose(A, 1 / 3))
P["q"] = np.zeros((4, 4)); print(multi_head(np.array([[1.0, 2, 3, 4], [3, 2, 1, 0]]), P, 2)[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 2, 2) [[2.0, 3.0], [8.0, 9.0]] True\n(3, 4) (2, 3, 3) True\n[[2.0, 2.0, 2.0, 2.0], [2.0, 2.0, 2.0, 2.0]]",
          "(3, 2, 2) [[1.0, 4.0], [7.0, 10.0]] True\n(3, 4) (2, 3, 3) True\n[[2.0, 2.0, 2.0, 2.0], [2.0, 2.0, 2.0, 2.0]]",
          "(3, 2, 2) [[2.0, 3.0], [8.0, 9.0]] True\n(3, 4) (3, 3) True\n[[2.0, 2.0, 2.0, 2.0], [2.0, 2.0, 2.0, 2.0]]",
          "(3, 2, 2) [[2.0, 3.0], [8.0, 9.0]] True\n(3, 4) (2, 3, 3) True\n[[1.0, 2.0, 3.0, 4.0], [3.0, 2.0, 1.0, 0.0]]",
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

def kv_cache_bytes(layers, ctx, kv_heads, d_head, bytes_per):
    return 2 * layers * ctx * kv_heads * d_head * bytes_per

def repeat_kv(K, h):
    return np.repeat(K, h // K.shape[0], axis=0)

print(kv_cache_bytes(32, 4096, 32, 128, 2) / 2 ** 30, kv_cache_bytes(32, 4096, 8, 128, 2) / 2 ** 30)
K = np.arange(8.0).reshape(2, 2, 2); R = repeat_kv(K, 4); print(R.shape, R[1].tolist() == K[0].tolist(), R[2].tolist() == K[1].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.5\n(4, 2, 2) True True",
          "1.0 0.25\n(4, 2, 2) True True",
          "2.0 0.5\n(4, 2, 2) True False",
          "2.0 2.0\n(2, 4, 2) True True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>split_heads(X, h)</C> taking an (n, d) array to (h, n, d/h) with head i holding columns i·d/h onwards,{" "}
          <C>merge_heads(Y)</C> undoing it, and <C>multi_head(X, P, h)</C> with P holding q, k, v and o matrices, returning the
          output and the (h, n, n) weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def split_heads(X, h):
    return X[None]

def merge_heads(Y):
    return Y[0]

def multi_head(X, P, h):
    return X, None
`,
        solution: MHA,
        tests: [
          { name: "reshape", code: `X = np.arange(24.0).reshape(3, 8); S = split_heads(X, 4); assert S.shape == (4, 3, 2) and np.array_equal(S[2], X[:, 4:6]) and np.array_equal(merge_heads(S), X)` },
          { name: "heads", code: `rng = np.random.default_rng(0); X = rng.normal(size=(5, 6)); P = {k: rng.normal(size=(6, 6)) for k in "qkvo"}; Y, A = multi_head(X, P, 3); Q, K, V = X @ P["q"], X @ P["k"], X @ P["v"]
outs = []
for i in range(3):
    s = slice(2 * i, 2 * i + 2); S = Q[:, s] @ K[:, s].T / np.sqrt(2); E = np.exp(S); W = E / E.sum(1, keepdims=True); assert np.allclose(A[i], W); outs.append(W @ V[:, s])
assert np.allclose(Y, np.hstack(outs) @ P["o"]) and np.allclose(multi_head(X, P, 1)[1][0].sum(1), 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_cache_bytes(layers, ctx, kv_heads, d_head, bytes_per)</C> for keys and values of every layer, and{" "}
          <C>repeat_kv(K, h)</C>, which expands g key-value heads of shape (g, n, d_k) to h query heads, each group of h/g
          consecutive query heads sharing one key-value head.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kv_cache_bytes(layers, ctx, kv_heads, d_head, bytes_per):
    return 0

def repeat_kv(K, h):
    return K
`,
        solution: KV,
        tests: [
          { name: "cache", code: `assert kv_cache_bytes(1, 1, 1, 1, 1) == 2 and kv_cache_bytes(80, 32768, 8, 128, 2) == 10 * 2 ** 30 and kv_cache_bytes(2, 10, 4, 8, 4) == 5120` },
          { name: "repeat", code: `K = np.random.default_rng(1).normal(size=(2, 3, 4)); R = repeat_kv(K, 6); assert R.shape == (6, 3, 4) and all(np.array_equal(R[i], K[i // 3]) for i in range(6)) and np.array_equal(repeat_kv(K, 2), K)` },
        ],
      },
    },
    {
      key: "cache",
      rung: "stretch",
      prompt: (
        <p>
          A model has 80 layers and 8 key-value heads of size 128, stored in 2 bytes per number. How many GiB does its KV cache
          occupy for one sequence of 32768 tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 10, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Self-attention treats its input as a set, and that turns out to be a feature. The next section looks at models built for
        sets and graphs, starting with what it means for a function not to care about order.
      </p>
    </>
  ),
};
