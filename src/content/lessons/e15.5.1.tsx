import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ServingTradeoffViz } from "@/components/viz/ServingTradeoffViz";
import type { LessonContent } from "@/lib/types";

const MEMORY = `def kv_per_token(layers, kv_heads, head_dim, width):
    return 2 * layers * kv_heads * head_dim * width        # a key and a value per head per layer

def max_batch(mem, weights, kv_tok, avg_ctx, overhead):
    free = mem * (1 - overhead) - weights                  # memory left for the cache
    return max(0, int(free // (kv_tok * avg_ctx)))

def step_ms(weights, batch, ctx, kv_tok, bw):
    return (weights + batch * ctx * kv_tok) / bw * 1000    # decode reads every weight and every cached token once`;

const ECON = `def throughput(batch, ms):
    return batch * 1000 / ms                               # one token per sequence per step

def cost_per_million(tps, price_per_hour):
    return price_per_hour / 3600 / tps * 1e6

def pick_batch(batches, step, slo):
    ok = [b for b in batches if step(b) <= slo]
    return max(ok) if ok else None                         # the largest batch that meets the latency target`;

export const lesson: LessonContent = {
  id: "e15.5.1",
  minutes: 45,
  links: {
    requires: ["e15.4.3"],
    revisits: ["e12.1.1", "e12.1.2", "e12.2.1", "e12.2.2", "e12.5.2", "e12.4.2"],
    foreshadows: ["e15.5.2"],
  },

  puzzle: (
    <>
      <p>
        The post-trained model works in a notebook, one prompt at a time, at a few dozen tokens per second. The inference
        engine of E12 can serve hundreds of users at once from the same GPU. How many, exactly, and at what latency and
        cost? The answer decides whether the evaluation report can run its thousands of samples in an hour, and whether
        a demo survives its first busy afternoon.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Decoding a small model is limited by memory bandwidth, not arithmetic. Each step reads every weight once, however
        many sequences are in the batch, and reads each sequence&apos;s cached keys and values. Batching more sequences
        shares the weight reads, so throughput rises almost linearly at first, then levels off once cache reads dominate.
        The key-value cache also bounds the batch, since it must fit in what memory the weights leave. Within those
        limits, the batch is chosen to meet a latency target per token.
      </p>
      <ServingTradeoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="memory and step time">
        <p>
          Each token of each sequence caches a key and a value per key-value head per layer (<C>kv_per_token</C>), as in
          e12.1.2. With paged attention, as in e12.2.2, nearly all memory left after the weights and a margin can hold
          cache, so the number of concurrent sequences is that free memory divided by the cache of an average sequence{" "}
          (<C>max_batch</C>). A decode step for b sequences of context c reads the weights W and the caches, taking{" "}
          <M>{"(W + bck)/\\text{BW}"}</M> for cache k bytes per token and bandwidth BW (<C>step_ms</C>), as in e12.1.1.
        </p>
        <Code>{MEMORY}</Code>
      </Definition>

      <Theorem title="where batching stops paying">
        <p>
          Under this model, throughput <M>{"T(b) = b\\,\\text{BW}/(W + bck)"}</M> tokens per second rises with b towards{" "}
          <M>{"\\text{BW}/(ck)"}</M>, and reaches half of that limit at <M>{"b = W/(ck)"}</M>, where the cache reads equal
          the weight reads.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each step produces one token for each of b sequences in time <M>{"(W + bck)/\\text{BW}"}</M>, giving T(b). Dividing
          numerator and denominator by b gives <M>{"\\text{BW}/(W/b + ck)"}</M>, which increases in b and tends to{" "}
          <M>{"\\text{BW}/(ck)"}</M>. At <M>{"b = W/(ck)"}</M> the denominator is 2ck, half the limit. Beyond that point,
          doubling the batch adds less than a third to throughput while nearly doubling the step time each user waits. A
          shorter context or a smaller cache, from grouped-query attention or a quantised cache, raises both the limit and
          the batch at which it is reached.
        </p>
      </Proof>

      <Definition title="economics">
        <p>
          Throughput is b tokens per step (<C>throughput</C>), and the cost of a million generated tokens is the
          GPU&apos;s hourly price divided by the tokens it produces in an hour (<C>cost_per_million</C>), as in e12.5.2.
          A service promises a step time per token, and the batch is the largest that keeps it (<C>pick_batch</C>), with
          continuous batching, from e12.2.1, keeping the batch full as requests finish.
        </p>
        <Code>{ECON}</Code>
      </Definition>

      <Example title="serving the capstone">
        <p>
          The model&apos;s 0.43 GB of bf16 weights leave most of a 24 GB GPU for cache: at 16 KiB per token and contexts of a
          few thousand tokens, several hundred sequences fit. The evaluation report&apos;s sampling, thousands of prompts with
          several samples each, finishes in minutes at large batch, while an interactive demo runs at a smaller batch for
          a few milliseconds per token. Weight-only quantisation, as in e12.4.2, hardly matters for a model this small,
          because the cache, not the weights, dominates memory traffic at useful batch sizes.
        </p>
      </Example>

      <Remark title="what the model leaves out">
        <p>
          Prefill is compute-bound and competes with decoding for the GPU, which chunked prefill smooths; attention kernels
          do not reach full bandwidth; and the engine has its own overheads per step. The model gives the shape of the
          trade-off, and a load test with the evaluation plan&apos;s prompts gives the real numbers, which go in the
          technical report.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "batch",
      rung: "check",
      prompt: (
        <p>
          The capstone model has 16 layers and 4 key-value heads of width 64, cached in bf16. On a 24 GB GPU (taking 1 GB as
          10⁹ bytes) with 0.428 GB of weights and 10% of memory held back, how many sequences averaging 3000 tokens fit?
        </p>
      ),
      answer: { kind: "numeric", value: 430, tolerance: 0 },
    },
    {
      key: "step",
      rung: "check",
      prompt: (
        <p>
          For the same model at 10¹² bytes per second of bandwidth, how many milliseconds does a decode step take for 64
          sequences of context 2000? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.525, tolerance: 0.001 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: <p>Why does batching more sequences raise decode throughput almost for free at first?</p>,
      answer: {
        kind: "choice",
        options: [
          "The weights are read once per step whatever the batch, so extra sequences add only their own cache reads",
          "Larger batches use faster kernels for every operation",
          "The key-value cache shrinks as the batch grows",
          "Each sequence needs fewer steps in a larger batch",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_per_token(layers, kv_heads, head_dim, width):
    return 2 * layers * kv_heads * head_dim * width        # a key and a value per head per layer

def max_batch(mem, weights, kv_tok, avg_ctx, overhead):
    free = mem * (1 - overhead) - weights                  # memory left for the cache
    return max(0, int(free // (kv_tok * avg_ctx)))

def step_ms(weights, batch, ctx, kv_tok, bw):
    return (weights + batch * ctx * kv_tok) / bw * 1000    # decode reads every weight and every cached token once

print(kv_per_token(2, 1, 4, 2), max_batch(100, 10, 2, 5, 0.1), max_batch(10, 12, 1, 1, 0))
print(step_ms(4, 2, 3, 1, 1000))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["32 8 0\n10.0", "16 8 0\n10.0", "32 9 0\n10.0", "32 8 0\n4.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def throughput(batch, ms):
    return batch * 1000 / ms                               # one token per sequence per step

def cost_per_million(tps, price_per_hour):
    return price_per_hour / 3600 / tps * 1e6

def pick_batch(batches, step, slo):
    ok = [b for b in batches if step(b) <= slo]
    return max(ok) if ok else None                         # the largest batch that meets the latency target

print(throughput(8, 4), cost_per_million(500, 3.6))
print(pick_batch([1, 2, 4, 8], lambda b: 3 + b, 7), pick_batch([4], lambda b: 9, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2000.0 2.0\n4 None", "2.0 2000.0\n4 None", "2000.0 2.0\n8 None", "2000.0 0.002\n4 4"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_per_token(layers, kv_heads, head_dim, width)</C>;{" "}
          <C>max_batch(mem, weights, kv_tok, avg_ctx, overhead)</C>, a whole number and never negative; and{" "}
          <C>step_ms(weights, batch, ctx, kv_tok, bw)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_per_token(layers, kv_heads, head_dim, width):
    return layers * head_dim

def max_batch(mem, weights, kv_tok, avg_ctx, overhead):
    return 1

def step_ms(weights, batch, ctx, kv_tok, bw):
    return weights / bw
`,
        solution: MEMORY,
        tests: [
          { name: "mem", code: `assert kv_per_token(3, 2, 8, 1) == 96 and max_batch(50, 5, 3, 5, 0.2) == 2 and max_batch(1, 5, 1, 1, 0) == 0` },
          { name: "step", code: `assert step_ms(10, 4, 5, 2, 100) == 500.0 and step_ms(0, 0, 9, 9, 1) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>throughput(batch, ms)</C> in tokens per second; <C>cost_per_million(tps, price_per_hour)</C>; and{" "}
          <C>pick_batch(batches, step, slo)</C>, the largest batch whose step time is within the target, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def throughput(batch, ms):
    return batch

def cost_per_million(tps, price_per_hour):
    return price_per_hour

def pick_batch(batches, step, slo):
    return batches[0]
`,
        solution: ECON,
        tests: [
          { name: "rate", code: `assert throughput(3, 0.5) == 6000 and cost_per_million(1000, 7.2) == 2.0` },
          { name: "pick", code: `assert pick_batch([16, 2, 8], lambda b: b, 8) == 8 and pick_batch([], lambda b: 0, 1) is None and pick_batch([3], lambda b: 3, 3) == 3` },
        ],
      },
    },
    {
      key: "slo",
      rung: "stretch",
      prompt: (
        <p>
          In the setting of the second check, the service allows at most 5 ms per step and chooses among batches of 32, 64,
          128 and 256. What throughput does it reach, in tokens per second to the nearest whole number?
        </p>
      ),
      answer: { kind: "numeric", value: 27692, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the model served at scale, the evaluation plan can finally run in full. The next lesson turns its results
        into the evaluation report.
      </p>
    </>
  ),
};
