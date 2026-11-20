import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LatencyThroughputViz } from "@/components/viz/LatencyThroughputViz";
import type { LessonContent } from "@/lib/types";

const METRICS = `import math

def latency_metrics(arrive, first, last, n_out):
    ttft = first - arrive                       # waiting plus prefill
    tpot = (last - first) / (n_out - 1)         # mean time between the remaining tokens
    return ttft, tpot, last - arrive

def percentile(xs, p):
    xs = sorted(xs)
    k = max(math.ceil(p / 100 * len(xs)), 1)    # nearest rank
    return xs[k - 1]

def goodput(ttfts, tpots, ttft_slo, tpot_slo, seconds):
    ok = sum(1 for a, b in zip(ttfts, tpots) if a <= ttft_slo and b <= tpot_slo)
    return ok / seconds                         # requests per second that met both targets`;

const COST = `def step_time(batch, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    return (weight_bytes + batch * ctx * kv_bytes_per_token) / bandwidth   # decode reads weights and every cache

def cost_per_million(gpu_hour_price, gpus, tokens_per_s):
    return gpu_hour_price * gpus / (tokens_per_s * 3600) * 1e6

def max_batch_for_slo(tpot_slo, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    spare = tpot_slo * bandwidth - weight_bytes                            # bytes left after the weights
    return max(int(spare // (ctx * kv_bytes_per_token)), 0)`;

export const lesson: LessonContent = {
  id: "e12.5.2",
  minutes: 50,
  links: {
    requires: ["e12.5.1", "e12.1.1"],
    revisits: ["e12.1.2", "e12.2.4"],
    foreshadows: ["e12.5.3"],
  },

  puzzle: (
    <>
      <p>
        A team doubles the batch size on its servers. Throughput rises by 70%, and the cost per million tokens falls accordingly. The
        average latency barely moves, yet complaints that responses feel sluggish rise sharply. A second team, serving the same model,
        reports a cost per token three times lower but much slower streaming. Which team is doing better, and how should either measure
        it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A user feels two delays: the time to the first token (TTFT), which covers queueing and prefill, and the time per output token
        (TPOT), which sets the streaming speed. The operator pays for GPU-hours and earns per token, so cares about throughput. In decode
        a step reads the weights once and each sequence&apos;s cache (e12.1.2), so step time grows linearly with the batch: throughput
        rises with the batch while each user slows. There is no single best batch, only the cheapest one that meets latency targets.
        Averages hide the users who wait longest, so targets are set on percentiles such as p99, and the useful throughput is goodput:
        requests per second that met their targets.
      </p>
      <LatencyThroughputViz />
    </>
  ),

  theory: (
    <>
      <Definition title="latency metrics">
        <p>
          For a request arriving at time <C>arrive</C> whose first and last tokens are emitted at <C>first</C> and <C>last</C>,{" "}
          <C>latency_metrics</C> returns TTFT, TPOT and end-to-end latency. <C>percentile</C> uses the nearest-rank definition: the
          smallest value with at least p% of values at or below it. <C>goodput</C> counts the requests per second that met both targets.
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Theorem title="Little's law">
        <p>
          In a system in steady state where requests arrive at rate λ and each stays for an average time W, the average number of
          requests in the system is <M>{"L = \\lambda W"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Over a long interval of length T, about λT requests arrive and, in steady state, about as many leave. Integrate the number in
          the system over the interval: the integral is the total time spent inside by all requests, about{" "}
          <M>{"\\lambda T \\cdot W"}</M>, apart from requests straddling the ends, whose share vanishes as T grows. Dividing by T gives the average number{" "}
          <M>{"\\lambda W"}</M>. For serving, L is the number of concurrent sequences and so the KV cache needed: halving TPOT halves the
          time each request holds its cache.
        </p>
      </Proof>

      <Definition title="the cost of decoding">
        <p>
          <C>step_time</C> is the memory-bound time of one decode step: the weights plus <C>batch</C> caches of <C>ctx</C> tokens, read at{" "}
          <C>bandwidth</C> bytes per second. <C>cost_per_million</C> converts a price per GPU-hour and a throughput into a cost per
          million tokens. <C>max_batch_for_slo</C> is the largest batch whose step time is at most the TPOT target.
        </p>
        <Code>{COST}</Code>
      </Definition>

      <Theorem title="the latency-throughput trade-off">
        <p>
          With step time <M>{"t(B) = a + cB"}</M> for a batch of B sequences, throughput <M>{"B/t(B)"}</M> increases with B towards{" "}
          <M>{"1/c"}</M>, per-user speed <M>{"1/t(B)"}</M> decreases, and under a TPOT target τ the cheapest batch per token is the
          largest with <M>{"t(B) \\le \\tau"}</M>, namely <M>{"\\lfloor (\\tau - a)/c \\rfloor"}</M>, if memory allows.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"B/(a + cB) = 1/(a/B + c)"}</M>, and <M>{"a/B"}</M> decreases to 0, so throughput increases towards <M>{"1/c"}</M>. Step
          time increases with B, so per-user speed decreases. The cost per token is the price of the GPUs divided by throughput, which
          decreases in B, so it is least at the largest feasible B; <M>{"a + cB \\le \\tau"}</M> is{" "}
          <M>{"B \\le (\\tau - a)/c"}</M>. At small B the weights dominate (<M>{"a \\gg cB"}</M>) and doubling the batch nearly doubles
          throughput for free; at large B each added sequence adds its own cache reads and the gains shrink.
        </p>
      </Proof>

      <Remark title="measuring serving in practice">
        <p>
          Benchmarks replay realistic arrival processes and length distributions and report TTFT and TPOT at p50, p90 and p99, alongside
          throughput. Prefill competes with decode in the same steps, so long prompts arriving raise other users&apos; TPOT unless prefill
          is chunked or disaggregated (e12.2.4). Prices are often set separately for input and output tokens, because output tokens, made
          one per step, cost more. Throughput measured without latency targets is misleading: a server can always raise it by queueing
          requests longer.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Doubling the batch raised throughput and lengthened each step, and the tail of TPOT and TTFT grew most, which averages hide. The
          right comparison is goodput under the same percentile targets for TTFT and TPOT, and cost per token at that goodput. The second
          team&apos;s lower cost is not comparable unless it meets the same targets.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "little",
      rung: "check",
      prompt: (
        <p>
          Requests arrive at 20 per second. Each has a TTFT of 0.5 s and produces 300 tokens at a TPOT of 40 ms. On average, how many
          requests are in progress? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 249.2, tolerance: 0.05 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          A replica of 8 GPUs at $2.50 per GPU-hour produces 5,000 output tokens per second. What is the cost per million output tokens
          in dollars? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.11, tolerance: 0.005 },
    },
    {
      key: "tail",
      rung: "apply",
      prompt: <p>Why are serving targets set on high percentiles such as p99 rather than on mean latency?</p>,
      answer: {
        kind: "choice",
        options: [
          "Delays fall unevenly, so a good mean can hide a sizeable fraction of users who wait far longer",
          "The mean of latencies cannot be computed while requests are still running",
          "p99 is always smaller than the mean, so targets are easier to meet",
          "Percentiles measure throughput, which is what users feel",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def latency_metrics(arrive, first, last, n_out):
    ttft = first - arrive                       # waiting plus prefill
    tpot = (last - first) / (n_out - 1)         # mean time between the remaining tokens
    return ttft, tpot, last - arrive

def percentile(xs, p):
    xs = sorted(xs)
    k = max(math.ceil(p / 100 * len(xs)), 1)    # nearest rank
    return xs[k - 1]

def goodput(ttfts, tpots, ttft_slo, tpot_slo, seconds):
    ok = sum(1 for a, b in zip(ttfts, tpots) if a <= ttft_slo and b <= tpot_slo)
    return ok / seconds                         # requests per second that met both targets

m = latency_metrics(10.0, 10.5, 14.5, 101)
print(m, percentile([5, 1, 9, 3, 7], 50), percentile([5, 1, 9, 3, 7], 99), goodput([0.2, 0.9, 0.3], [0.05, 0.02, 0.08], 0.5, 0.06, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.5, 0.04, 4.5) 5 9 0.5",
          "(0.5, 0.04, 4.5) 5 9 1.0",
          "(0.5, 0.0396, 4.5) 5 9 0.5",
          "(0.5, 0.04, 4.0) 3 7 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def step_time(batch, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    return (weight_bytes + batch * ctx * kv_bytes_per_token) / bandwidth   # decode reads weights and every cache

def cost_per_million(gpu_hour_price, gpus, tokens_per_s):
    return gpu_hour_price * gpus / (tokens_per_s * 3600) * 1e6

def max_batch_for_slo(tpot_slo, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    spare = tpot_slo * bandwidth - weight_bytes                            # bytes left after the weights
    return max(int(spare // (ctx * kv_bytes_per_token)), 0)

B = max_batch_for_slo(0.02, 100, 1e9, 1e5, 1e12)
print(B, round(step_time(B, 100, 1e9, 1e5, 1e12) * 1000, 2), round(cost_per_million(3.0, 8, B / step_time(B, 100, 1e9, 1e5, 1e12)), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1900 20.0 0.07", "2000 21.0 0.07", "1900 20.0 0.01", "1900 19.0 0.07"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>latency_metrics(arrive, first, last, n_out)</C>, <C>percentile(xs, p)</C> by nearest rank, and{" "}
          <C>goodput(ttfts, tpots, ttft_slo, tpot_slo, seconds)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def latency_metrics(arrive, first, last, n_out):
    return first - arrive, (last - first) / n_out, last - first

def percentile(xs, p):
    return sum(xs) / len(xs)

def goodput(ttfts, tpots, ttft_slo, tpot_slo, seconds):
    return len(ttfts) / seconds
`,
        solution: METRICS,
        tests: [
          { name: "metrics", code: `assert latency_metrics(1.0, 2.0, 5.0, 4) == (1.0, 1.0, 4.0)\nassert percentile([4, 1, 3, 2], 50) == 2 and percentile([4, 1, 3, 2], 99) == 4 and percentile([4, 1, 3, 2], 0) == 1` },
          { name: "goodput", code: `assert goodput([1, 1, 3, 1], [1, 2, 1, 1], 2, 1, 4) == 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>step_time(batch, ctx, weight_bytes, kv_bytes_per_token, bandwidth)</C>,{" "}
          <C>cost_per_million(gpu_hour_price, gpus, tokens_per_s)</C> and{" "}
          <C>max_batch_for_slo(tpot_slo, ctx, weight_bytes, kv_bytes_per_token, bandwidth)</C>, which is never negative.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def step_time(batch, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    return weight_bytes / bandwidth

def cost_per_million(gpu_hour_price, gpus, tokens_per_s):
    return gpu_hour_price / tokens_per_s

def max_batch_for_slo(tpot_slo, ctx, weight_bytes, kv_bytes_per_token, bandwidth):
    return 1
`,
        solution: COST,
        tests: [
          { name: "time", code: `assert step_time(4, 10, 100, 5, 50) == 6.0 and abs(cost_per_million(3.6, 2, 1000) - 2.0) < 1e-12` },
          { name: "slo", code: `assert max_batch_for_slo(6.0, 10, 100, 5, 50) == 4 and max_batch_for_slo(1.0, 10, 100, 5, 50) == 0` },
        ],
      },
    },
    {
      key: "cheapest",
      rung: "stretch",
      prompt: (
        <p>
          A 70-billion-parameter model (140 GB of weights) runs on 8 GPUs with 3.35 TB/s of bandwidth each, at $2.50 per GPU-hour. The
          cache takes 327,680 bytes per token and contexts are 2,048 tokens. At the largest batch meeting a TPOT target of 20 ms, what is
          the cost per million output tokens in dollars? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.19, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        These numbers describe one replica under a steady load. Real traffic rises and falls through the day and arrives unevenly, so
        the next lesson spreads requests across replicas and adds or removes them as demand changes.
      </p>
    </>
  ),
};
