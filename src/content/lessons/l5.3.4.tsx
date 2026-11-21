import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KvCacheGridViz } from "@/components/viz/KvCacheGridViz";
import type { LessonContent } from "@/lib/types";

const CACHE = `import numpy as np

def attend(q, K, V):
    s = K @ q / np.sqrt(len(q))
    a = np.exp(s - s.max())
    return (a / a.sum()) @ V

def full_outputs(X, Wq, Wk, Wv):
    out = []
    for t in range(len(X)):
        P = X[: t + 1]
        out.append(attend(X[t] @ Wq, P @ Wk, P @ Wv))
    return np.array(out)

def cached_outputs(X, Wq, Wk, Wv):
    Ks, Vs, out = [], [], []
    for x in X:
        Ks.append(x @ Wk)
        Vs.append(x @ Wv)
        out.append(attend(x @ Wq, np.array(Ks), np.array(Vs)))
    return np.array(out)`;

const COST = `def kv_cache_bytes(L, n_kv_heads, head_dim, T, batch=1, bytes_per=2):
    return 2 * L * n_kv_heads * head_dim * T * batch * bytes_per

def step_flops(n_matmul, L, d, t):
    return 2 * n_matmul + 4 * L * d * t

def generation_flops(n_matmul, L, d, n, cached=True):
    if cached:
        return sum(step_flops(n_matmul, L, d, t) for t in range(1, n + 1))
    return sum(step_flops(n_matmul, L, d, i) for t in range(1, n + 1) for i in range(1, t + 1))`;

export const lesson: LessonContent = {
  id: "l5.3.4",
  minutes: 40,
  links: {
    requires: ["l5.3.3"],
    revisits: ["l5.3.1"],
    foreshadows: ["l8.2.2", "e12.1.2"],
  },

  puzzle: (
    <>
      <p>
        To generate text, a GPT predicts one token, appends it, and runs again on the longer sequence. Run naively, step t
        processes all t tokens, so producing a thousand tokens processes about half a million. Yet the predictions for the
        earlier positions never change. Which parts of the computation can be kept from one step to the next, and what does
        keeping them cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At each layer, a new token needs three things from the past: nothing from the earlier queries, but the keys and
        values of every earlier position. Because the model is causal, those keys and values depend only on the tokens up
        to their own position, so appending a token cannot change them. Store them as they are made, and each step only has
        to compute the new token&apos;s query, key and value and attend over the stored rows. The work per step drops from
        the whole prefix to one token, and the price is memory that grows with the context.
      </p>
      <KvCacheGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the KV cache">
        <p>
          During generation, the KV cache holds, for every layer and every position generated or read so far, the key{" "}
          <M>{"k_i"}</M> and value <M>{"v_i"}</M> that the attention sublayer computed. At each new step the model runs on the
          new token alone: at each layer it computes <M>{"q_t, k_t, v_t"}</M>, appends <M>{"k_t, v_t"}</M> to the cache, and
          attends with <M>{"q_t"}</M> over all cached rows. Below is a single attention layer, generated both ways.
        </p>
        <Code>{CACHE}</Code>
      </Definition>

      <Theorem title="the cache is exact">
        <p>
          For a causal transformer, generating with a KV cache gives the same logits at every step as recomputing the whole
          prefix.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the causality theorem of the lesson on assembling a GPT, the hidden state <M>{"x^{(\\ell)}_i"}</M> depends only on{" "}
          <M>{"t_1, \\dots, t_i"}</M>. Appending tokens after position i therefore leaves it unchanged, and so leaves the key
          and value computed from it unchanged, at every layer. The new position&apos;s state at layer ℓ needs its own state at
          layer ℓ − 1, which the step computes, and the keys and values of positions up to t at layer ℓ, which are the cached
          ones and its own. Induction on ℓ gives the same output as the full recomputation. In floating point the two can
          differ in the last bits, because sums are taken in a different order.
        </p>
      </Proof>

      <Theorem title="what the cache saves">
        <p>
          With <M>{"N_{\\text{mm}}"}</M> weights in matrix products, L layers and width d, a step whose token attends to t
          positions costs <M>{"2N_{\\text{mm}} + 4Ldt"}</M> FLOPs. Generating n tokens from nothing costs
        </p>
        <MD>{"2N_{\\text{mm}}n + 2Ld\\,n(n+1)"}</MD>
        <p>
          with a cache, and
        </p>
        <MD>{"N_{\\text{mm}}n(n+1) + \\tfrac23Ld\\,n(n+1)(n+2)"}</MD>
        <p>
          without.
        </p>
      </Theorem>
      <Proof>
        <p>
          The per-step cost is the forward count of the previous lesson for one token and t keys. With a cache, step t costs
          exactly that; sum over t = 1, …, n using <M>{"\\sum t = n(n+1)/2"}</M>. Without a cache, step t runs every position{" "}
          <M>{"i \\le t"}</M>, costing <M>{"\\sum_{i \\le t}(2N_{\\text{mm}} + 4Ldi)"}</M>; summing over t uses{" "}
          <M>{"\\sum_tt(t+1)/2 = n(n+1)(n+2)/6"}</M>. The weight term grows by a factor (n + 1)/2 and the attention term by
          (n + 2)/3: linear and quadratic costs become quadratic and cubic.
        </p>
      </Proof>

      <Theorem title="what the cache costs">
        <p>
          With <M>{"h_{kv}"}</M> key-value heads of dimension <M>{"d_h"}</M> per layer and b bytes per number, the cache for a
          batch of B sequences of length T takes <M>{"2Lh_{kv}d_hTBb"}</M> bytes. With ordinary multi-head attention,{" "}
          <M>{"h_{kv}d_h = d"}</M> and each token costs <M>{"2Ldb"}</M> bytes.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each layer stores a key and a value, the 2, each with <M>{"h_{kv}d_h"}</M> numbers, for every position and every
          sequence.
        </p>
        <Code>{COST}</Code>
      </Proof>

      <Remark title="prefill and decode">
        <p>
          A prompt is processed in one pass, the <em>prefill</em>, which fills the cache with many tokens at once and is
          limited by arithmetic. The following <em>decode</em> steps each do little arithmetic per byte they read: every
          weight and the whole cache must come from memory to produce one token. Shrinking the cache, by sharing keys and
          values across heads or storing them in fewer bits, therefore speeds up generation directly; the inference course
          returns to all of this.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>A model has 80 layers and 8 key-value heads of dimension 128, stored in 2 bytes. How many GiB (2³⁰ bytes) does the cache for one sequence of 32768 tokens take?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 1e-9 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>Counting only the weight FLOPs, how many times more work does generating 1000 tokens take without a cache than with one?</p>,
      answer: { kind: "numeric", value: 500.5, tolerance: 1e-9 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why may a transformer reuse the keys and values of earlier positions instead of recomputing them after each new token?</p>,
      answer: {
        kind: "choice",
        options: [
          "Causal attention makes every earlier position's hidden states, and so its keys and values, independent of later tokens",
          "Keys and values are the same at every layer",
          "Attention weights for earlier positions are zero",
          "The weights do not change during generation, so every activation is constant",
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

def attend(q, K, V):
    s = K @ q / np.sqrt(len(q))
    a = np.exp(s - s.max())
    return (a / a.sum()) @ V

def full_outputs(X, Wq, Wk, Wv):
    out = []
    for t in range(len(X)):
        P = X[: t + 1]
        out.append(attend(X[t] @ Wq, P @ Wk, P @ Wv))
    return np.array(out)

def cached_outputs(X, Wq, Wk, Wv):
    Ks, Vs, out = [], [], []
    for x in X:
        Ks.append(x @ Wk)
        Vs.append(x @ Wv)
        out.append(attend(x @ Wq, np.array(Ks), np.array(Vs)))
    return np.array(out)

rng = np.random.default_rng(0); X = rng.standard_normal((5, 4)); Wq, Wk, Wv = (rng.standard_normal((4, 4)) for _ in range(3))
print(np.allclose(full_outputs(X, Wq, Wk, Wv), cached_outputs(X, Wq, Wk, Wv)), np.round(attend(np.zeros(2), np.eye(2), np.array([[2.0], [4.0]])), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True [3.0]", "False [3.0]", "True [4.0]", "True [2.0]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_cache_bytes(L, n_kv_heads, head_dim, T, batch=1, bytes_per=2):
    return 2 * L * n_kv_heads * head_dim * T * batch * bytes_per

def step_flops(n_matmul, L, d, t):
    return 2 * n_matmul + 4 * L * d * t

def generation_flops(n_matmul, L, d, n, cached=True):
    if cached:
        return sum(step_flops(n_matmul, L, d, t) for t in range(1, n + 1))
    return sum(step_flops(n_matmul, L, d, i) for t in range(1, n + 1) for i in range(1, t + 1))

print(kv_cache_bytes(32, 32, 128, 4096), kv_cache_bytes(32, 8, 128, 4096) / 2 ** 20)
print(generation_flops(10, 1, 1, 3), generation_flops(10, 1, 1, 3, cached=False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2147483648 512.0\n84 160",
          "1073741824 256.0\n84 160",
          "2147483648 512.0\n84 252",
          "2147483648 2048.0\n84 160",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attend(q, K, V)</C>, softmax attention of one query over the rows of K and V with scores scaled by{" "}
          <C>1/sqrt(len(q))</C>; <C>full_outputs(X, Wq, Wk, Wv)</C>, which for each t recomputes the keys and values of rows 0
          to t of X; and <C>cached_outputs(X, Wq, Wk, Wv)</C>, which computes each key and value once.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def attend(q, K, V):
    return V.mean(0)

def full_outputs(X, Wq, Wk, Wv):
    return X @ Wv

def cached_outputs(X, Wq, Wk, Wv):
    return X @ Wv
`,
        solution: CACHE,
        tests: [
          { name: "attend", code: `assert np.allclose(attend(np.zeros(2), np.eye(2), np.array([[2.0], [4.0]])), [3.0])
q = np.array([2.0, 0.0]); K = np.array([[1.0, 0.0], [0.0, 1.0]]); w = np.exp([2 / np.sqrt(2), 0]); w /= w.sum()
assert np.allclose(attend(q, K, np.array([[1.0, 0.0], [0.0, 1.0]])), w)` },
          { name: "equal", code: `rng = np.random.default_rng(3); X = rng.standard_normal((7, 5)); Wq, Wk, Wv = (rng.standard_normal((5, 3)) for _ in range(3))
F, Cc = full_outputs(X, Wq, Wk, Wv), cached_outputs(X, Wq, Wk, Wv); assert F.shape == (7, 3) and np.allclose(F, Cc)
assert np.allclose(F[0], X[0] @ Wv) and np.allclose(full_outputs(X[:4], Wq, Wk, Wv), F[:4])
assert not np.allclose(F[3], (X[:4] @ Wv).mean(0))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_cache_bytes(L, n_kv_heads, head_dim, T, batch=1, bytes_per=2)</C>;{" "}
          <C>step_flops(n_matmul, L, d, t)</C>, the cost of one token attending to t positions; and{" "}
          <C>generation_flops(n_matmul, L, d, n, cached=True)</C>, the total for generating n tokens from nothing.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_cache_bytes(L, n_kv_heads, head_dim, T, batch=1, bytes_per=2):
    return 0

def step_flops(n_matmul, L, d, t):
    return 2 * n_matmul

def generation_flops(n_matmul, L, d, n, cached=True):
    return n * step_flops(n_matmul, L, d, n)
`,
        solution: COST,
        tests: [
          { name: "bytes", code: `assert kv_cache_bytes(32, 32, 128, 4096) == 2 ** 31 and kv_cache_bytes(80, 8, 128, 32768) == 10 * 2 ** 30
assert kv_cache_bytes(2, 1, 4, 10, batch=3, bytes_per=1) == 480 and step_flops(10, 2, 3, 5) == 140` },
          { name: "generation", code: `assert generation_flops(10, 1, 1, 3) == 84 and generation_flops(10, 1, 1, 3, cached=False) == 160
for n in [1, 5, 17]:
    nm, L, d = 1000, 3, 8
    assert generation_flops(nm, L, d, n) == 2 * nm * n + 2 * L * d * n * (n + 1)
    assert 3 * generation_flops(nm, L, d, n, cached=False) == 3 * nm * n * (n + 1) + 2 * L * d * n * (n + 1) * (n + 2)` },
        ],
      },
    },
    {
      key: "fit",
      rung: "stretch",
      prompt: <p>A model with 32 layers and d = 4096 uses ordinary multi-head attention and a cache in 2-byte numbers. How many tokens, summed over all sequences in a batch, fit in 40 GiB of cache?</p>,
      answer: { kind: "numeric", value: 81920, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes a working GPT. The next part steps back to compare it with the other two transformer families,
        encoders such as BERT and encoder-decoders such as T5, starting with what a model learns when it can see both sides
        of a gap.
      </p>
    </>
  ),
};
