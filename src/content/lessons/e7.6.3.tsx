import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DecodeThroughputViz } from "@/components/viz/DecodeThroughputViz";
import type { LessonContent } from "@/lib/types";

const CACHE = `def kv_bytes(layers, n_kv, head_dim, seq, batch=1, bytes_per=2):
    return 2 * layers * n_kv * head_dim * seq * batch * bytes_per

def max_batch(gpu_bytes, weight_bytes, kv_per_seq):
    return max(0, int((gpu_bytes - weight_bytes) // kv_per_seq))

def decode_throughput(batch, weight_bytes, kv_per_seq, bandwidth):
    return batch * bandwidth / (weight_bytes + batch * kv_per_seq)`;

const PAGES = `def blocks_needed(tokens, block):
    return -(-tokens // block)

def waste_contiguous(lengths, max_len):
    return sum(max_len - n for n in lengths) / (len(lengths) * max_len)

def waste_paged(lengths, block):
    held = sum(-(-n // block) * block for n in lengths)
    return (held - sum(lengths)) / held`;

export const lesson: LessonContent = {
  id: "e7.6.3",
  minutes: 55,
  links: {
    requires: ["e7.6.2", "l5.3.4"],
    revisits: ["e7.4.2", "e7.5.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        An 8-billion-parameter model takes 16 GB in bf16, a fifth of an 80 GB GPU. A serving system on that GPU handles
        about thirty users with 4000-token conversations, and adding more makes it run out of memory, though the model has
        not grown. A newer model of the same size, with a quarter of the key-value heads, serves about 120 users on the same
        GPU. What is using the other 64 GB, and why does it depend on the number of key-value heads?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Generating each token needs the keys and values of every earlier token of the same sequence, at every layer, so a
        server keeps them in the KV cache (l5.3.4). The cache grows with every token of every sequence in the batch. Each
        decode step reads all the weights once for the whole batch, but each sequence&apos;s cache separately, so a larger
        batch shares the cost of the weights but not of the caches.
      </p>
      <DecodeThroughputViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inference memory">
        <p>
          Serving memory is the weights, at the bytes per parameter of their format, plus the KV cache, plus small
          transient activations. With L layers, g key-value heads of dimension <M>{"d_h"}</M>, and e bytes per value, the
          cache of b sequences of s tokens takes
        </p>
        <MD>{"2\\,L\\,g\\,d_h\\,s\\,b\\,e \\text{ bytes}."}</MD>
        <Code>{CACHE}</Code>
      </Definition>

      <Theorem title="the size of the cache">
        <p>
          The formula above is exact for a decoder that caches the keys and values of every layer, and grouped-query attention
          with g of h heads shrinks it by <M>{"h/g"}</M>, without changing the weights of the queries.
        </p>
      </Theorem>
      <Proof>
        <p>
          At each layer each token contributes a key and a value for each of the g key-value heads, vectors of length{" "}
          <M>{"d_h"}</M>: <M>{"2gd_h"}</M> values. Multiply by layers, tokens, sequences and bytes per value. With
          multi-head attention <M>{"g = h"}</M> and <M>{"gd_h = d"}</M>; with grouped-query attention several query heads share
          one key-value head, so g, and the cache, are h/g times smaller. For a 32-layer model with 32 heads of 128 at 4096
          tokens this is 2 GiB per sequence in bf16; with 8 key-value heads, 0.5 GiB.
        </p>
      </Proof>

      <Theorem title="decode throughput">
        <p>
          If each decode step reads the weights W once and the cache K of each of b sequences once, and is memory-bound,
          the throughput is
        </p>
        <MD>{"\\frac{b\\beta}{W + bK} \\text{ tokens per second},"}</MD>
        <p>
          which increases with b towards <M>{"\\beta/K"}</M> and is largest at the biggest batch that fits,{" "}
          <M>{"b = \\lfloor (M - W)/K \\rfloor"}</M> on a device with memory M.
        </p>
      </Theorem>
      <Proof>
        <p>
          The step moves <M>{"W + bK"}</M> bytes at bandwidth β and produces b tokens. Writing the throughput as{" "}
          <M>{"\\beta/(W/b + K)"}</M> shows it increasing in b with limit <M>{"\\beta/K"}</M>. While <M>{"bK \\ll W"}</M> it grows
          almost linearly in b: batching is nearly free. Once the caches dominate, each extra sequence brings its own bytes and
          throughput saturates, so the cache size per sequence, not the model, sets the ceiling. The compute, 2N FLOPs per
          token, stays far below the roofline&apos;s ridge until b reaches the hundreds (e7.4.2), so the memory-bound
          assumption holds in this regime.
        </p>
      </Proof>

      <Example title="paged allocation">
        <p>
          A server that reserves the maximum context for every sequence wastes the unused part: three sequences of 100, 300
          and 2048 tokens in slots of 2048 waste 60% of their reservation. Paged attention (Kwon et al., 2023) allocates the
          cache in fixed blocks of, say, 16 tokens, like pages of virtual memory, so a sequence wastes less than one block; the
          same three waste under 1%. The memory freed becomes a larger batch, and by the throughput theorem, more tokens per
          second.
        </p>
        <Code>{PAGES}</Code>
      </Example>

      <Remark title="shrinking the bytes">
        <p>
          Every term above has a bytes-per-value factor. Weights quantised to 8 or 4 bits shrink W, which matters most at
          small batches; caches stored in 8 bits halve K, which matters most at large ones. Architectural changes such as
          grouped-query attention and compressed latent caches shrink K further. Each of these is the same lesson read from
          the other side: on memory-bound hardware, speed is bytes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kv",
      rung: "check",
      prompt: <p>How many KiB (1024 bytes) of bf16 KV cache does one token need in a model with 80 layers, 8 key-value heads and head dimension 128?</p>,
      answer: { kind: "numeric", value: 320, tolerance: 0 },
    },
    {
      key: "fit",
      rung: "check",
      prompt: <p>An 80 GB (8 × 10<sup>10</sup> bytes) GPU holds an 8-billion-parameter model in bf16 (16 GB). Each sequence of 8192 tokens has a cache for 32 layers, 8 key-value heads of dimension 128, in bf16. How many sequences fit?</p>,
      answer: { kind: "numeric", value: 59, tolerance: 0 },
    },
    {
      key: "gqa",
      rung: "apply",
      prompt: <p>Why does grouped-query attention raise serving throughput even though it barely changes the FLOPs per token?</p>,
      answer: {
        kind: "choice",
        options: [
          "It shrinks the KV cache, so more sequences fit and each step reads fewer cache bytes per token",
          "It makes the weights smaller by a factor of h/g",
          "It removes the attention computation for most heads",
          "It lets the GPU skip the logits",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_bytes(layers, n_kv, head_dim, seq, batch=1, bytes_per=2):
    return 2 * layers * n_kv * head_dim * seq * batch * bytes_per

def max_batch(gpu_bytes, weight_bytes, kv_per_seq):
    return max(0, int((gpu_bytes - weight_bytes) // kv_per_seq))

def decode_throughput(batch, weight_bytes, kv_per_seq, bandwidth):
    return batch * bandwidth / (weight_bytes + batch * kv_per_seq)

print(kv_bytes(80, 8, 128, 1), kv_bytes(32, 32, 128, 4096) / 2 ** 30, kv_bytes(32, 32, 128, 4096, bytes_per=1) / 2 ** 30)
print(max_batch(80e9, 14e9, 2 ** 31), max_batch(80e9, 140e9, 1), round(decode_throughput(1, 14e9, 2e9, 3.35e12)), round(decode_throughput(32, 14e9, 2e9, 3.35e12)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "327680 2.0 1.0\n30 0 209 1374",
          "163840 1.0 0.5\n30 0 209 1374",
          "327680 2.0 1.0\n30 0 239 1374",
          "327680 2.0 1.0\n31 0 209 6700",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def blocks_needed(tokens, block):
    return -(-tokens // block)

def waste_contiguous(lengths, max_len):
    return sum(max_len - n for n in lengths) / (len(lengths) * max_len)

def waste_paged(lengths, block):
    held = sum(-(-n // block) * block for n in lengths)
    return (held - sum(lengths)) / held

print(blocks_needed(100, 16), blocks_needed(0, 16), waste_contiguous([100, 300, 2048], 2048), round(waste_paged([100, 300, 2048], 16), 4))
print(waste_paged([16, 32], 16), waste_contiguous([10], 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7 0 0.6015625 0.0065\n0.0 0.0",
          "6 0 0.6015625 0.0065\n0.0 0.0",
          "7 1 0.6015625 0.0065\n0.0 0.0",
          "7 0 0.3984375 0.0065\n0.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_bytes(layers, n_kv, head_dim, seq, batch=1, bytes_per=2)</C>;{" "}
          <C>max_batch(gpu_bytes, weight_bytes, kv_per_seq)</C>, never below 0; and{" "}
          <C>decode_throughput(batch, weight_bytes, kv_per_seq, bandwidth)</C>, in tokens per second for a memory-bound step.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_bytes(layers, n_kv, head_dim, seq, batch=1, bytes_per=2):
    return 0

def max_batch(gpu_bytes, weight_bytes, kv_per_seq):
    return 1

def decode_throughput(batch, weight_bytes, kv_per_seq, bandwidth):
    return 0.0
`,
        solution: CACHE,
        tests: [
          { name: "cache", code: `assert kv_bytes(80, 8, 128, 1) == 327680 and kv_bytes(32, 32, 128, 4096) == 2 ** 31 and kv_bytes(32, 32, 128, 4096, bytes_per=1) == 2 ** 30
assert kv_bytes(2, 1, 4, 10, batch=3) == 2 * 2 * 4 * 10 * 3 * 2 and kv_bytes(32, 8, 128, 8192) == 2 ** 30` },
          { name: "serving", code: `assert max_batch(80e9, 14e9, 2 ** 31) == 30 and max_batch(80e9, 140e9, 1) == 0 and max_batch(80e9, 16e9, 2 ** 30) == 59
assert decode_throughput(1, 14e9, 2e9, 3.35e12) == 3.35e12 / 16e9 and abs(decode_throughput(32, 14e9, 2e9, 3.35e12) - 32 * 3.35e12 / 78e9) < 1e-6
assert decode_throughput(10 ** 9, 1.0, 2.0, 10.0) < 5.0 and decode_throughput(10 ** 9, 1.0, 2.0, 10.0) > 4.99` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>blocks_needed(tokens, block)</C>; <C>waste_contiguous(lengths, max_len)</C>, the unused fraction of a
          max_len slot per sequence; and <C>waste_paged(lengths, block)</C>, the unused fraction of the blocks held.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def blocks_needed(tokens, block):
    return tokens // block

def waste_contiguous(lengths, max_len):
    return 0.0

def waste_paged(lengths, block):
    return 0.0
`,
        solution: PAGES,
        tests: [
          { name: "blocks", code: `assert blocks_needed(100, 16) == 7 and blocks_needed(0, 16) == 0 and blocks_needed(16, 16) == 1 and blocks_needed(17, 16) == 2
assert waste_contiguous([100, 300, 2048], 2048) == 0.6015625 and waste_contiguous([10], 10) == 0.0 and waste_contiguous([0, 4], 4) == 0.5` },
          { name: "paged", code: `assert abs(waste_paged([100, 300, 2048], 16) - 16 / 2464) < 1e-12 and waste_paged([16, 32], 16) == 0.0 and waste_paged([1], 16) == 15 / 16
import random
r = random.Random(3); ls = [r.randint(1, 4000) for _ in range(50)]
assert waste_paged(ls, 16) < 16 * 50 / sum(ls) and waste_paged(ls, 16) < waste_contiguous(ls, 4000)` },
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          A model with 32 layers and 32 key-value heads of dimension 128 serves 4096-token contexts in bf16 at 3.35 TB/s. If
          memory were unlimited, what is the upper limit on decode throughput, in tokens per second, as the batch grows? Round to
          a whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 1560, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. From the latency of a single load to the memory of a served model, every question has
        had the same shape: count the work, count the bytes, and compare each with what the hardware can supply.
      </p>
    </>
  ),
};
