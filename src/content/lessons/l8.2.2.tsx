import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KvCacheViz } from "@/components/viz/KvCacheViz";
import type { LessonContent } from "@/lib/types";

const CACHE = `def kv_cache_bytes(n_layers, n_kv_heads, d_head, seq, batch=1, bytes_per=2):
    return 2 * n_layers * n_kv_heads * d_head * seq * batch * bytes_per

def mla_cache_bytes(n_layers, d_c, d_r, seq, batch=1, bytes_per=2):
    return n_layers * (d_c + d_r) * seq * batch * bytes_per

def kv_group(head, n_heads, n_kv_heads):
    return head // (n_heads // n_kv_heads)`;

const ATTEND = `import math

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]

def gqa_attend(qs, K, V):
    per = len(qs) // len(K)
    out = []
    for h, q in enumerate(qs):
        g = h // per
        d = len(q)
        p = softmax([sum(a * b for a, b in zip(q, k)) / math.sqrt(d) for k in K[g]])
        out.append([sum(p[t] * V[g][t][j] for t in range(len(p))) for j in range(len(V[g][0]))])
    return out

def absorb(W_uk, q):
    return [sum(W_uk[i][j] * q[i] for i in range(len(q))) for j in range(len(W_uk[0]))]`;

export const lesson: LessonContent = {
  id: "l8.2.2",
  minutes: 50,
  links: {
    requires: ["l8.2.1", "l5.3.4", "l4.4.4"],
    revisits: ["l5.2.1", "m6.4.1"],
    foreshadows: ["e12.1.1", "l8.8.1"],
  },

  puzzle: (
    <>
      <p>
        When a language model generates text, each new token must attend to the keys and values of every earlier token, so
        these are cached. For a long context the cache, not the weights, fills the accelerator, and it is read in full for
        every token generated. Multi-head attention gives every head its own keys and values. Do the heads really need them,
        and how far can the cache be shrunk before quality suffers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Queries are used once, at the token that issues them; keys and values are stored and reread for the rest of the
        sequence. So the cheap place to economise is the keys and values. Grouped-query attention lets several query heads
        share one key-value head. Multi-head latent attention goes further: it stores one small latent vector per token and
        reconstructs every head&apos;s keys and values from it on the fly, folding the reconstruction into the query so that
        it costs nothing extra.
      </p>
      <KvCacheViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cache size">
        <p>
          A model with L layers, <M>{"n_{kv}"}</M> key-value heads of width <M>{"d_h"}</M> and b bytes per number caches
        </p>
        <MD>{"2\\, L\\, n_{kv}\\, d_h\\, b"}</MD>
        <p>
          bytes per token, the 2 for keys and values (<C>kv_cache_bytes</C>). Multi-head attention (MHA) has{" "}
          <M>{"n_{kv} = n_h"}</M>, multi-query attention (MQA) has <M>{"n_{kv} = 1"}</M>, and grouped-query attention (GQA) has{" "}
          <M>{"1 < n_{kv} < n_h"}</M>, with query head h reading key-value head <M>{"\\lfloor h / (n_h / n_{kv}) \\rfloor"}</M> (<C>kv_group</C>). At
          decode time each token reads the whole cache, so its size sets both the memory per sequence and the time per step.
        </p>
        <Code>{CACHE}</Code>
      </Definition>

      <Definition title="grouped-query attention">
        <p>
          Each group of <M>{"n_h / n_{kv}"}</M> query heads attends with its own queries over the same keys and values (<C>gqa_attend</C>), so
          the heads still form different attention patterns. Ainslie and colleagues showed that GQA with eight groups comes
          close to MHA quality at near-MQA speed, and that an MHA checkpoint can be converted by mean-pooling its key and value
          heads within each group and training briefly. Llama 2 70B and all Llama 3 models use eight key-value heads.
        </p>
        <Code>{ATTEND}</Code>
      </Definition>

      <Theorem title="absorbing the up-projection">
        <p>
          In multi-head latent attention, each token caches a latent <M>{"c \\in \\mathbb{R}^{d_c}"}</M>, and head i forms its key as{" "}
          <M>{"k_i = W^{UK}_i c"}</M>. Then for a query <M>{"q_i"}</M>,
        </p>
        <MD>{"q_i^\\top k_i = \\big((W^{UK}_i)^\\top q_i\\big)^\\top c"}</MD>
        <p>
          so the score can be computed directly against the cached latent with a transformed query (<C>absorb</C>), and the full
          keys never need to be materialised. The same holds for values, whose up-projection folds into the output projection.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"q_i^\\top (W^{UK}_i c) = (q_i^\\top W^{UK}_i) c = ((W^{UK}_i)^\\top q_i)^\\top c"}</M> by associativity of matrix products. For values, the head
          output <M>{"\\sum_t p_t W^{UV}_i c_t = W^{UV}_i \\sum_t p_t c_t"}</M>, and <M>{"W^O_i W^{UV}_i"}</M> is one fixed matrix.
        </p>
      </Proof>

      <Remark title="why RoPE needs a separate path">
        <p>
          RoPE rotates keys by a position-dependent matrix <M>{"R_n"}</M>, and <M>{"q^\\top R_m^\\top R_n W^{UK} c"}</M> puts <M>{"R_{n-m}"}</M> between the query and{" "}
          <M>{"W^{UK}"}</M>, so the absorption no longer gives one fixed matrix. DeepSeek-V2 therefore splits each key into a part from the
          latent, with no rotation, and a small rotated part of width <M>{"d_R"}</M> shared across heads and cached alongside the latent.
          The cache per token per layer is <M>{"d_c + d_R"}</M> numbers (<C>mla_cache_bytes</C>); with <M>{"d_c = 512"}</M> and <M>{"d_R = 64"}</M> this
          is far below MHA, and DeepSeek reported quality slightly above it.
        </p>
      </Remark>

      <Example title="a cache budget">
        <p>
          An 80-gigabyte accelerator holding a model&apos;s weights in 16 GB has 64 GB for caches. If a 32K-token sequence needs 4.3
          GB, at most 14 sequences decode together; at 17.2 GB, only 3. Because decoding is limited by memory bandwidth, the
          step time barely depends on the batch size, so throughput is roughly proportional to the number of sequences, and a
          fourfold smaller cache is close to a fourfold cheaper token.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: (
        <p>
          A model has 80 layers, 8 key-value heads of width 128, and stores its cache in bf16. How large is the cache for one
          sequence of 32,768 tokens, in gigabytes (10⁹ bytes)? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 10.74, tolerance: 0.005 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          A layer has 128 heads of width 128. How many times smaller is an MLA cache with d_c = 512 and d_R = 64 than the MHA
          cache for the same layer? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 56.89, tolerance: 0.01 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why do these schemes share or compress keys and values but never queries?</p>,
      answer: {
        kind: "choice",
        options: [
          "Queries are used only at the step that produces them, while keys and values are cached and reread at every later step",
          "Queries are much smaller than keys and values",
          "Sharing queries would make every head attend to the same position",
          "Queries do not pass through RoPE",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_cache_bytes(n_layers, n_kv_heads, d_head, seq, batch=1, bytes_per=2):
    return 2 * n_layers * n_kv_heads * d_head * seq * batch * bytes_per

def mla_cache_bytes(n_layers, d_c, d_r, seq, batch=1, bytes_per=2):
    return n_layers * (d_c + d_r) * seq * batch * bytes_per

def kv_group(head, n_heads, n_kv_heads):
    return head // (n_heads // n_kv_heads)

print(kv_cache_bytes(2, 4, 8, 10), kv_cache_bytes(2, 1, 8, 10), mla_cache_bytes(2, 16, 4, 10))
print([kv_group(h, 8, 2) for h in range(8)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2560 640 800\n[0, 0, 0, 0, 1, 1, 1, 1]",
          "1280 320 400\n[0, 0, 0, 0, 1, 1, 1, 1]",
          "2560 640 800\n[0, 1, 0, 1, 0, 1, 0, 1]",
          "2560 640 1600\n[0, 0, 0, 0, 1, 1, 1, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def softmax(z):
    m = max(z)
    e = [math.exp(v - m) for v in z]
    s = sum(e)
    return [v / s for v in e]

def gqa_attend(qs, K, V):
    per = len(qs) // len(K)
    out = []
    for h, q in enumerate(qs):
        g = h // per
        d = len(q)
        p = softmax([sum(a * b for a, b in zip(q, k)) / math.sqrt(d) for k in K[g]])
        out.append([sum(p[t] * V[g][t][j] for t in range(len(p))) for j in range(len(V[g][0]))])
    return out

def absorb(W_uk, q):
    return [sum(W_uk[i][j] * q[i] for i in range(len(q))) for j in range(len(W_uk[0]))]

K, V = [[[1.0, 0.0], [0.0, 1.0]]], [[[2.0], [4.0]]]; out = gqa_attend([[0.0, 0.0], [5.0, -5.0]], K, V)
print([round(o[0], 4) for o in out], absorb([[1.0, 2.0, 0.0], [0.0, 1.0, 3.0]], [2.0, -1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 2.0017] [2.0, 3.0, -3.0]",
          "[3.0, 3.9983] [2.0, 3.0, -3.0]",
          "[3.0, 2.0017] [2.0, -1.0]",
          "[2.0, 2.0017] [2.0, 3.0, -3.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_cache_bytes(n_layers, n_kv_heads, d_head, seq, batch, bytes_per)</C>,{" "}
          <C>mla_cache_bytes(n_layers, d_c, d_r, seq, batch, bytes_per)</C> and <C>kv_group(head, n_heads, n_kv_heads)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_cache_bytes(n_layers, n_kv_heads, d_head, seq, batch=1, bytes_per=2):
    return n_layers * n_kv_heads * d_head * seq * batch * bytes_per

def mla_cache_bytes(n_layers, d_c, d_r, seq, batch=1, bytes_per=2):
    return 2 * n_layers * d_c * seq * batch * bytes_per

def kv_group(head, n_heads, n_kv_heads):
    return head % n_kv_heads
`,
        solution: CACHE,
        tests: [
          { name: "bytes", code: `assert kv_cache_bytes(80, 8, 128, 1) == 327680 and kv_cache_bytes(1, 2, 3, 4, 5, 1) == 240 and mla_cache_bytes(60, 512, 64, 1) == 69120` },
          { name: "groups", code: `assert [kv_group(h, 6, 3) for h in range(6)] == [0, 0, 1, 1, 2, 2] and [kv_group(h, 4, 1) for h in range(4)] == [0, 0, 0, 0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax(z)</C>, <C>gqa_attend(qs, K, V)</C>, where <C>K[g]</C> and <C>V[g]</C> are the cached keys and values of group g and
          consecutive query heads share a group, using scores scaled by <M>{"1/\\sqrt{d}"}</M>, and <C>absorb(W_uk, q)</C>, returning{" "}
          <M>{"W_{uk}^\\top q"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(z):
    s = sum(math.exp(v) for v in z)
    return [math.exp(v) / s for v in z]

def gqa_attend(qs, K, V):
    return [V[0][0] for q in qs]

def absorb(W_uk, q):
    return q
`,
        solution: ATTEND,
        tests: [
          { name: "attend", code: `out = gqa_attend([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [0.0, 0.0]], [[[1.0, 0.0], [0.0, 1.0]], [[2.0, 0.0], [0.0, 0.0]]], [[[1.0, 0.0], [0.0, 1.0]], [[3.0, 1.0], [1.0, 3.0]]])\nassert abs(out[0][0] - 0.6697615493) < 1e-9 and abs(out[2][0] - 2.6088593650) < 1e-9 and out[3] == [2.0, 2.0]` },
          { name: "absorb", code: `W, q, c = [[1.0, 2.0, 0.0], [0.0, 1.0, 3.0]], [2.0, -1.0], [0.5, 1.0, -2.0]\nWc = [sum(W[i][j] * c[j] for j in range(3)) for i in range(2)]\nassert abs(sum(a * b for a, b in zip(absorb(W, q), c)) - sum(a * b for a, b in zip(q, Wc))) < 1e-12 and softmax([1000.0, 1000.0]) == [0.5, 0.5]` },
        ],
      },
    },
    {
      key: "batch",
      rung: "stretch",
      prompt: (
        <p>
          An 8-billion-parameter model with 32 layers and 8 key-value heads of width 128 has 66 GB (10⁹ bytes) free for its bf16
          cache. What is the largest number of 4,096-token sequences it can decode at once?
        </p>
      ),
      answer: { kind: "numeric", value: 122, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Shrinking keys and values changes what flows through attention. The next lesson looks at a quantity that matters for
        stability rather than memory: the size of the attention logits, and how normalising queries and keys keeps them in
        check.
      </p>
    </>
  ),
};
