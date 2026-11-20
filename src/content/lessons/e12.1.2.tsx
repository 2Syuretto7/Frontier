import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KvMemoryViz } from "@/components/viz/KvMemoryViz";
import type { LessonContent } from "@/lib/types";

const SIZE = `def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value):
    return 2 * layers * kv_heads * head_dim * bytes_per_value   # a key and a value per head per layer

def kv_cache_bytes(layers, kv_heads, head_dim, bytes_per_value, seq_len, batch):
    return kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value) * seq_len * batch

def max_batch(mem_bytes, weight_bytes, per_seq_bytes):
    return (mem_bytes - weight_bytes) // per_seq_bytes         # sequences whose full cache fits beside the weights`;

const TRAFFIC = `def decode_step_bytes(weight_bytes, kv_per_token, context_lens):
    return weight_bytes + kv_per_token * sum(context_lens)      # weights once, plus every sequence's cache

def step_time(n_bytes, bw):
    return n_bytes / bw

def kv_share(weight_bytes, kv_per_token, context_lens):
    kv = kv_per_token * sum(context_lens)
    return kv / (weight_bytes + kv)`;

export const lesson: LessonContent = {
  id: "e12.1.2",
  minutes: 50,
  links: {
    requires: ["e12.1.1", "l8.2.2"],
    revisits: ["l5.3.4", "l8.7.3"],
    foreshadows: ["e12.1.3"],
  },

  puzzle: (
    <>
      <p>
        A team serves a 7B-parameter model on an 80 GB accelerator. Its weights take 14 GB, so there seems to be room for hundreds of
        conversations. Yet with 4,096-token contexts the server refuses new requests at about thirty, and when contexts grow to 32,000
        tokens it can hold only three or four. Switching to a model of the same size with grouped-query attention multiplies capacity
        several times over. What is taking the memory?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        To avoid recomputing attention over the whole context at every step, each layer stores the key and value vectors of every
        earlier token: the KV cache (l5.3.4). It grows with layers, KV heads, head dimension, context length and the number of
        sequences, and it belongs to each sequence separately, unlike the weights, which are shared. At long contexts or large batches
        it is the cache, not the model, that fills memory, and each decode step must also read it, so it adds to the step time too.
        Attention variants that share keys and values across heads (l8.2.2) shrink it directly.
      </p>
      <KvMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sizing the cache">
        <p>
          <C>kv_bytes_per_token</C> counts a key and a value vector of size <C>head_dim</C> for each KV head in each layer.{" "}
          <C>kv_cache_bytes</C> multiplies by context length and batch. <C>max_batch</C> is the number of sequences whose full cache fits
          in the memory left after the weights, rounded down.
        </p>
        <Code>{SIZE}</Code>
      </Definition>

      <Theorem title="size of the KV cache">
        <p>
          With L layers, <M>{"h_{kv}"}</M> KV heads of dimension d, b bytes per value, contexts of length S and batch B, the cache holds{" "}
          <M>{"2 L h_{kv} d b S B"}</M> bytes. Grouped-query attention with g query heads per KV head uses <M>{"1/g"}</M> of the
          multi-head cache.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the S tokens of each of the B sequences stores, in each of the L layers and for each of the <M>{"h_{kv}"}</M> KV heads,
          one key and one value of d numbers of b bytes each: <M>{"2db"}</M> bytes. Multiplying the counts gives the total. Multi-head
          attention has <M>{"h_{kv} = h"}</M>, the number of query heads; grouped-query attention sets <M>{"h_{kv} = h/g"}</M>, dividing
          the total by g. Nothing else in the formula changes, so the saving is exact.
        </p>
      </Proof>

      <Definition title="the cache in each decode step">
        <p>
          <C>decode_step_bytes</C> adds the weights, read once per step, to the caches of all sequences, each read in full by attention.{" "}
          <C>step_time</C> divides bytes by bandwidth, and <C>kv_share</C> is the fraction of the bytes that are cache.
        </p>
        <Code>{TRAFFIC}</Code>
      </Definition>

      <Theorem title="when the cache dominates">
        <p>
          With weight bytes W and k cache bytes per token, a memory-bound decode step reads more cache than weights exactly when the
          total context across the batch, <M>{"\\sum_i S_i"}</M>, exceeds <M>{"W/k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The step reads W bytes of weights and <M>{"k \\sum_i S_i"}</M> bytes of cache. The second exceeds the first exactly when{" "}
          <M>{"\\sum_i S_i > W/k"}</M>. Unlike the weight read, the cache read grows with the batch, so batching stops being free once
          total context approaches this threshold: beyond it, step time rises roughly in proportion to the number of sequences.
        </p>
      </Proof>

      <Remark title="the KV cache in practice">
        <p>
          Models designed for serving use grouped-query attention with a handful of KV heads, or latent attention that caches a
          compressed vector per token; some interleave sliding-window layers whose cache stops growing. Servers reserve most free memory
          for the cache and admit requests only while it fits, and long-context evaluation (l8.7.3) is as much a memory problem as a
          modelling one. The next lessons cover attention variants for inference, cache paging, and cache quantisation.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The 7B model has 32 layers and 32 KV heads of dimension 128, so in 16-bit precision each token needs 512 KiB of cache, and a
          4,096-token conversation needs 2 GiB; about 66 GB of free memory holds roughly thirty such caches, and only a few at 32,000
          tokens. A model with 8 KV heads needs a quarter as much per token, so four times as many conversations fit.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "per_token",
      rung: "check",
      prompt: (
        <p>
          A model has 40 layers, 40 KV heads and head dimension 128, with a 16-bit cache. How many KiB of KV cache does each token need?
        </p>
      ),
      answer: { kind: "numeric", value: 800, tolerance: 0 },
    },
    {
      key: "fit",
      rung: "check",
      prompt: (
        <p>
          An 80 GiB accelerator holds 16 GiB of weights. Each sequence has 4,096 tokens with 128 KiB of cache per token. How many full
          sequences fit?
        </p>
      ),
      answer: { kind: "numeric", value: 128, tolerance: 0 },
    },
    {
      key: "gqa",
      rung: "apply",
      prompt: <p>Why does grouped-query attention speed up decoding at large batch sizes?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fewer KV heads mean a smaller cache, so each step reads fewer bytes and more sequences fit in memory",
          "It removes the need to read the weights",
          "It reduces the number of layers",
          "It makes attention independent of context length",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value):
    return 2 * layers * kv_heads * head_dim * bytes_per_value   # a key and a value per head per layer

def kv_cache_bytes(layers, kv_heads, head_dim, bytes_per_value, seq_len, batch):
    return kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value) * seq_len * batch

def max_batch(mem_bytes, weight_bytes, per_seq_bytes):
    return (mem_bytes - weight_bytes) // per_seq_bytes         # sequences whose full cache fits beside the weights

per = kv_bytes_per_token(32, 8, 128, 2)
print(per, kv_cache_bytes(32, 8, 128, 2, 4096, 4) / 2**30, max_batch(80 * 2**30, 16 * 2**30, 2 * 2**30))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["131072 2.0 32", "65536 1.0 32", "131072 2.0 40", "131072 0.5 32"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def decode_step_bytes(weight_bytes, kv_per_token, context_lens):
    return weight_bytes + kv_per_token * sum(context_lens)      # weights once, plus every sequence's cache

def step_time(n_bytes, bw):
    return n_bytes / bw

def kv_share(weight_bytes, kv_per_token, context_lens):
    kv = kv_per_token * sum(context_lens)
    return kv / (weight_bytes + kv)

lens = [1000, 3000]
print(decode_step_bytes(10**6, 100, lens), step_time(decode_step_bytes(10**6, 100, lens), 10**8), round(kv_share(10**6, 100, lens), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1400000 0.014 0.29", "1004000 0.01004 0.0", "1400000 0.014 0.4", "1400000 0.14 0.29"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value)</C>,{" "}
          <C>kv_cache_bytes(layers, kv_heads, head_dim, bytes_per_value, seq_len, batch)</C> and{" "}
          <C>max_batch(mem_bytes, weight_bytes, per_seq_bytes)</C>, which returns an integer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value):
    return layers * kv_heads * head_dim * bytes_per_value

def kv_cache_bytes(layers, kv_heads, head_dim, bytes_per_value, seq_len, batch):
    return kv_bytes_per_token(layers, kv_heads, head_dim, bytes_per_value) * seq_len

def max_batch(mem_bytes, weight_bytes, per_seq_bytes):
    return mem_bytes // per_seq_bytes
`,
        solution: SIZE,
        tests: [
          { name: "size", code: `assert kv_bytes_per_token(2, 3, 4, 1) == 48 and kv_cache_bytes(2, 3, 4, 1, 10, 5) == 2400 and kv_cache_bytes(1, 1, 1, 2, 7, 0) == 0` },
          { name: "fit", code: `assert max_batch(100, 30, 20) == 3 and max_batch(100, 100, 1) == 0 and isinstance(max_batch(50, 10, 7), int)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>decode_step_bytes(weight_bytes, kv_per_token, context_lens)</C>, <C>step_time(n_bytes, bw)</C> and{" "}
          <C>kv_share(weight_bytes, kv_per_token, context_lens)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def decode_step_bytes(weight_bytes, kv_per_token, context_lens):
    return weight_bytes

def step_time(n_bytes, bw):
    return n_bytes * bw

def kv_share(weight_bytes, kv_per_token, context_lens):
    return 0.0
`,
        solution: TRAFFIC,
        tests: [
          { name: "bytes", code: `assert decode_step_bytes(50, 2, [5, 10]) == 80 and decode_step_bytes(50, 2, []) == 50 and step_time(80, 40) == 2.0` },
          { name: "share", code: `assert kv_share(30, 1, [10, 20]) == 0.5 and kv_share(30, 1, []) == 0.0 and abs(kv_share(10, 3, [10]) - 0.75) < 1e-12` },
        ],
      },
    },
    {
      key: "crossover",
      rung: "stretch",
      prompt: (
        <p>
          A 70B-parameter model has 140 GB (140 × 10⁹ bytes) of 16-bit weights, 80 layers and 8 KV heads of dimension 128, with a 16-bit
          cache. Above what total context across the batch, to the nearest thousand tokens, does a decode step read more cache than
          weights?
        </p>
      ),
      answer: { kind: "numeric", value: 427000, tolerance: 500 },
    },
  ],

  glimpse: (
    <>
      <p>
        Grouped-query attention is one way to shrink the cache. The next lesson compares the others: multi-query and latent attention,
        sliding windows, and the trade-offs each makes between memory, speed and quality.
      </p>
    </>
  ),
};
