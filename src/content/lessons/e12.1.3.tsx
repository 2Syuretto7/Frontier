import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SlidingWindowViz } from "@/components/viz/SlidingWindowViz";
import type { LessonContent } from "@/lib/types";

const ATTN = `import numpy as np

def gqa_attention(q, k, v):
    h, d = q.shape                                  # one query token per head (decode)
    g = h // k.shape[0]                             # query heads per KV head
    out = np.empty_like(q)
    for i in range(h):
        kk, vv = k[i // g], v[i // g]               # heads in a group share keys and values
        s = kk @ q[i] / np.sqrt(d)
        w = np.exp(s - s.max())
        out[i] = (w / w.sum()) @ vv
    return out

def sliding_window_mask(S, w):
    i, j = np.arange(S)[:, None], np.arange(S)[None, :]
    return (j <= i) & (i - j < w)                   # causal, and at most w - 1 tokens back

def cache_len(t, window):
    return min(t, window)                           # a sliding-window layer keeps only the last window tokens`;

const CACHE = `def cache_per_token(kind, h, d, g=1, latent=0, rope=0):
    if kind == "mha":
        return 2 * h * d                            # keys and values for every head
    if kind == "gqa":
        return 2 * (h // g) * d                     # one KV head per group of g query heads
    if kind == "mqa":
        return 2 * d                                # a single shared KV head
    return latent + rope                            # mla: a compressed latent plus a small positional key

def mixed_cache(t, n_global, n_local, window, per_layer):
    return per_layer * (n_global * t + n_local * min(t, window))

def long_context_ratio(t, n_global, n_local, window):
    layers = n_global + n_local
    return (n_global * t + n_local * min(t, window)) / (layers * t)   # cache relative to all-global layers`;

export const lesson: LessonContent = {
  id: "e12.1.3",
  minutes: 50,
  links: {
    requires: ["e12.1.2", "l8.2.2"],
    revisits: ["m3.8.3", "l8.7.3"],
    foreshadows: ["e12.2.1"],
  },

  puzzle: (
    <>
      <p>
        Three open models of similar quality cache, per token per layer, 8,192 numbers, 1,024 numbers, and 576 numbers respectively.
        A fourth caches the full amount in only one layer of every six and a fixed window of recent tokens in the rest. Each design
        claims long contexts at low cost. What do these designs give up, and how much memory does each actually save?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Multi-head attention gives every query head its own keys and values. Multi-query attention shares one KV head among all query
        heads, and grouped-query attention shares one per group, cutting the cache by the group size at a small cost in quality (l8.2.2).
        Latent attention caches a single compressed vector per token, from which each head&apos;s keys and values are reconstructed by
        learned projections, a low-rank factorisation (m3.8.3). Sliding-window attention lets a layer see only the last w tokens, so its
        cache stops growing; stacking such layers still lets information travel further, and interleaving a few global layers keeps
        long-range retrieval.
      </p>
      <SlidingWindowViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shared heads and windows">
        <p>
          <C>gqa_attention</C> computes one decode step of attention for h query heads, each a row of <C>q</C>, against cached keys and
          values of shape (KV heads, S, d), where query head i uses KV head <M>{"\\lfloor i/g \\rfloor"}</M> with g the number of query
          heads per KV head. <C>sliding_window_mask</C> is the causal mask restricted to the last w positions, and <C>cache_len</C> the
          number of tokens a window-w layer keeps after t tokens.
        </p>
        <Code>{ATTN}</Code>
      </Definition>

      <Theorem title="reach of stacked windows">
        <p>
          In a stack of L sliding-window layers of window w, the output at position i can depend on input positions down to{" "}
          <M>{"i - L(w - 1)"}</M>, and on none earlier.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on L. One layer lets position i attend to positions <M>{"i - w + 1, \\dots, i"}</M>, so it depends on inputs down
          to <M>{"i - (w - 1)"}</M>. If after L layers each position j depends on inputs down to <M>{"j - L(w - 1)"}</M>, then layer{" "}
          <M>{"L + 1"}</M> at position i combines positions down to <M>{"i - (w - 1)"}</M>, whose dependencies reach{" "}
          <M>{"i - (w - 1) - L(w - 1) = i - (L + 1)(w - 1)"}</M>, and no position below that is involved. The reach is only potential:
          information must survive several hops, which is why retrieval over long distances usually needs some global layers.
        </p>
      </Proof>

      <Definition title="cache sizes of the variants">
        <p>
          <C>cache_per_token</C> gives the numbers cached per token per layer for multi-head, grouped-query with group size g,
          multi-query, and latent attention with a latent of size <C>latent</C> plus a small decoupled positional key of size{" "}
          <C>rope</C>. <C>mixed_cache</C> totals the cache for a model with global and sliding-window layers, and{" "}
          <C>long_context_ratio</C> compares it with a model whose layers are all global.
        </p>
        <Code>{CACHE}</Code>
      </Definition>

      <Theorem title="savings from interleaving windows">
        <p>
          With <M>{"n_g"}</M> global and <M>{"n_l"}</M> window-w layers, at context <M>{"t \\ge w"}</M> the cache is the fraction{" "}
          <M>{"(n_g t + n_l w)/((n_g + n_l)t)"}</M> of an all-global model&apos;s, which falls to <M>{"n_g/(n_g + n_l)"}</M> as t grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each global layer caches t tokens and each window layer <M>{"\\min(t, w) = w"}</M>, each token costing the same per layer, while
          an all-global model caches t in each of <M>{"n_g + n_l"}</M> layers. Dividing gives the fraction, and{" "}
          <M>{"n_l w/((n_g + n_l)t) \\to 0"}</M> as <M>{"t \\to \\infty"}</M>. So at long contexts the saving approaches the share of
          window layers, but no further: the global layers set the floor.
        </p>
      </Proof>

      <Remark title="variants in practice">
        <p>
          Grouped-query attention with eight KV heads is the common default for dense models. Latent attention, introduced in the
          DeepSeek-V2 model, caches a 512-dimensional latent plus a 64-dimensional positional key per layer and absorbs the up-projections
          into the query and output projections at inference, so the full keys and values are never materialised. Several model
          families interleave sliding-window and global layers, for example in a ratio of five to one. Each variant should be checked on
          long-context evaluations (l8.7.3), not only on short benchmarks.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The first model is multi-head with 32 heads of dimension 128; the second uses grouped-query attention with four KV heads, an
          eighth of the cache; the third uses latent attention, about a fourteenth. The fourth keeps a full cache in one layer of six, so
          at long contexts its cache approaches a sixth of the full size. Each trades some modelling freedom, shared or compressed keys
          and values or limited reach, for memory.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "reach",
      rung: "check",
      prompt: (
        <p>
          A model has 32 sliding-window layers with window 4,096. How many positions back can the last layer&apos;s output at most depend
          on?
        </p>
      ),
      answer: { kind: "numeric", value: 131040, tolerance: 0 },
    },
    {
      key: "mla",
      rung: "check",
      prompt: (
        <p>
          Multi-head attention with 128 heads of dimension 128 is replaced by latent attention caching 512 + 64 numbers per token per
          layer. By what factor does the cache shrink? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 56.9, tolerance: 0.1 },
    },
    {
      key: "tradeoff",
      rung: "apply",
      prompt: <p>What is the main cost of multi-query attention compared with grouped-query attention?</p>,
      answer: {
        kind: "choice",
        options: [
          "All query heads share one set of keys and values, which can lower quality, whereas groups keep some diversity",
          "It needs a larger cache",
          "It cannot be used with causal masking",
          "It makes prefill memory-bound",
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

def gqa_attention(q, k, v):
    h, d = q.shape                                  # one query token per head (decode)
    g = h // k.shape[0]                             # query heads per KV head
    out = np.empty_like(q)
    for i in range(h):
        kk, vv = k[i // g], v[i // g]               # heads in a group share keys and values
        s = kk @ q[i] / np.sqrt(d)
        w = np.exp(s - s.max())
        out[i] = (w / w.sum()) @ vv
    return out

def sliding_window_mask(S, w):
    i, j = np.arange(S)[:, None], np.arange(S)[None, :]
    return (j <= i) & (i - j < w)                   # causal, and at most w - 1 tokens back

def cache_len(t, window):
    return min(t, window)                           # a sliding-window layer keeps only the last window tokens

q = np.ones((4, 2)); k = np.zeros((2, 3, 2)); v = np.arange(12.0).reshape(2, 3, 2)
print(np.round(gqa_attention(q, k, v), 2).tolist(), sliding_window_mask(4, 2).sum(), cache_len(10, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[2.0, 3.0], [2.0, 3.0], [8.0, 9.0], [8.0, 9.0]] 7 4",
          "[[2.0, 3.0], [8.0, 9.0], [2.0, 3.0], [8.0, 9.0]] 7 4",
          "[[2.0, 3.0], [2.0, 3.0], [8.0, 9.0], [8.0, 9.0]] 10 4",
          "[[2.0, 3.0], [2.0, 3.0], [8.0, 9.0], [8.0, 9.0]] 7 10",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cache_per_token(kind, h, d, g=1, latent=0, rope=0):
    if kind == "mha":
        return 2 * h * d                            # keys and values for every head
    if kind == "gqa":
        return 2 * (h // g) * d                     # one KV head per group of g query heads
    if kind == "mqa":
        return 2 * d                                # a single shared KV head
    return latent + rope                            # mla: a compressed latent plus a small positional key

def mixed_cache(t, n_global, n_local, window, per_layer):
    return per_layer * (n_global * t + n_local * min(t, window))

def long_context_ratio(t, n_global, n_local, window):
    layers = n_global + n_local
    return (n_global * t + n_local * min(t, window)) / (layers * t)   # cache relative to all-global layers

per = {kind: cache_per_token(kind, 32, 128, g=4, latent=512, rope=64) for kind in ["mha", "gqa", "mqa", "mla"]}
print(per, mixed_cache(8192, 1, 3, 1024, 256), round(long_context_ratio(8192, 1, 3, 1024), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'mha': 8192, 'gqa': 2048, 'mqa': 256, 'mla': 576} 2883584 0.34",
          "{'mha': 8192, 'gqa': 32768, 'mqa': 256, 'mla': 576} 2883584 0.34",
          "{'mha': 8192, 'gqa': 2048, 'mqa': 256, 'mla': 576} 8388608 0.34",
          "{'mha': 8192, 'gqa': 2048, 'mqa': 256, 'mla': 576} 2883584 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gqa_attention(q, k, v)</C>, using a numerically stable softmax and scaling scores by <M>{"1/\\sqrt d"}</M>;{" "}
          <C>sliding_window_mask(S, w)</C>, returning a boolean array; and <C>cache_len(t, window)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gqa_attention(q, k, v):
    return np.zeros_like(q)

def sliding_window_mask(S, w):
    return np.tril(np.ones((S, S), dtype=bool))

def cache_len(t, window):
    return t
`,
        solution: ATTN,
        tests: [
          { name: "attention", code: `q = np.array([[10.0, 0.0], [0.0, 10.0]])\nk = np.array([[[1.0, 0.0], [0.0, 1.0]]])\nv = np.array([[[1.0, 0.0], [0.0, 1.0]]])\no = gqa_attention(q, k, v)\nassert o.shape == (2, 2) and o[0, 0] > 0.99 and o[1, 1] > 0.99\nk2 = np.zeros((2, 2, 2)); v2 = np.array([[[0.0, 0.0], [2.0, 2.0]], [[4.0, 4.0], [6.0, 6.0]]])\nassert np.allclose(gqa_attention(np.ones((2, 2)), k2, v2), [[1.0, 1.0], [5.0, 5.0]])` },
          { name: "window", code: `m = sliding_window_mask(3, 1)\nassert m.dtype == bool and m.tolist() == [[True, False, False], [False, True, False], [False, False, True]]\nassert sliding_window_mask(5, 9).sum() == 15 and cache_len(3, 8) == 3 and cache_len(30, 8) == 8` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cache_per_token(kind, h, d, g=1, latent=0, rope=0)</C> for kinds <C>&quot;mha&quot;</C>, <C>&quot;gqa&quot;</C>,{" "}
          <C>&quot;mqa&quot;</C> and <C>&quot;mla&quot;</C>; <C>mixed_cache(t, n_global, n_local, window, per_layer)</C>; and{" "}
          <C>long_context_ratio(t, n_global, n_local, window)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cache_per_token(kind, h, d, g=1, latent=0, rope=0):
    return 2 * h * d

def mixed_cache(t, n_global, n_local, window, per_layer):
    return per_layer * (n_global + n_local) * t

def long_context_ratio(t, n_global, n_local, window):
    return 1.0
`,
        solution: CACHE,
        tests: [
          { name: "kinds", code: `assert [cache_per_token(k, 8, 16, g=2, latent=40, rope=8) for k in ["mha", "gqa", "mqa", "mla"]] == [256, 128, 32, 48]` },
          { name: "mixed", code: `assert mixed_cache(100, 2, 4, 10, 3) == 720 and mixed_cache(5, 2, 4, 10, 3) == 90\nassert long_context_ratio(100, 1, 1, 20) == 0.6 and long_context_ratio(10, 1, 3, 20) == 1.0` },
        ],
      },
    },
    {
      key: "interleave",
      rung: "stretch",
      prompt: (
        <p>
          A model has one global layer for every five sliding-window layers of window 1,024. At a context of 131,072 tokens, what
          fraction of an all-global model&apos;s cache does it need? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.173, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Smaller caches let more sequences share an accelerator. The next chapter is about how to schedule them: how requests of
        different lengths are batched together as they arrive and finish.
      </p>
    </>
  ),
};
