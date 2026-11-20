import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TailLatencyViz } from "@/components/viz/TailLatencyViz";
import type { LessonContent } from "@/lib/types";

const METRICS = `def percentile_from_buckets(bounds, counts, q):
    target, total = q * sum(counts), 0
    for b, c in zip(bounds, counts):
        total += c
        if total >= target:
            return b
    return bounds[-1]

def rate(samples):
    increase = 0
    for (t0, v0), (t1, v1) in zip(samples, samples[1:]):
        increase += v1 - v0 if v1 >= v0 else v1
    return increase / (samples[-1][0] - samples[0][0])

def fanout_slow(p, n):
    return 1 - (1 - p) ** n`;

const MONITOR = `def ema(xs, alpha):
    s, out = xs[0], [xs[0]]
    for x in xs[1:]:
        s = alpha * x + (1 - alpha) * s
        out.append(s)
    return out

def spikes(xs, window, k):
    out = []
    for i in range(window, len(xs)):
        prev = xs[i - window:i]
        m = sum(prev) / window
        sd = (sum((x - m) ** 2 for x in prev) / window) ** 0.5
        if abs(xs[i] - m) > k * sd:
            out.append(i)
    return out

def stragglers(step_times, k):
    s, n = sorted(step_times), len(step_times)
    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    return [r for r, t in enumerate(step_times) if t > k * med]`;

export const lesson: LessonContent = {
  id: "e8.5.3",
  minutes: 45,
  links: {
    requires: ["e8.5.1", "e8.4.2"],
    revisits: ["e8.3.1", "e6.6.3", "e8.2.5"],
    foreshadows: ["e10.1.1"],
  },

  puzzle: (
    <>
      <p>
        A training run on two thousand GPUs is ten per cent slower today than yesterday. Nothing has crashed and no error has
        been logged. Somewhere one GPU may be running hot and throttling, one network link may be dropping packets, or one
        data loader may be stalling, and every rank waits for the slowest at each all-reduce. How do engineers find one sick
        component among thousands, ideally before anyone notices the slowdown?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Measure everything, cheaply and all the time, and look at distributions rather than averages. Each component exports
        counters and histograms; a monitoring system scrapes them every few seconds and stores them as time series; alerts fire
        when a series leaves its normal range. Distributions matter because in a parallel system the slowest part decides the
        speed of the whole: a delay that strikes one server in a hundred strikes most requests that wait for a hundred
        servers.
      </p>
      <TailLatencyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="metrics, logs and traces">
        <p>
          <em>Metrics</em> are numeric time series: a <em>counter</em> only increases (requests served, bytes sent) and is
          reported as a rate; a <em>gauge</em> goes up and down (memory in use, temperature); a <em>histogram</em> counts
          observations in fixed buckets, from which percentiles are estimated. <em>Logs</em> are timestamped records of events.{" "}
          <em>Traces</em> follow one request through every service it touches, as a tree of timed spans. Metrics are cheap
          enough to collect from everything; logs and traces explain what the metrics reveal.
        </p>
      </Definition>

      <Definition title="percentiles and rates">
        <p>
          With bucket upper bounds <M>{"b_1 < \\dots < b_k"}</M> and counts <M>{"c_1, \\dots, c_k"}</M>, the q-quantile is estimated
          as the first bound whose cumulative count reaches q times the total (<C>percentile_from_buckets</C>), accurate to the
          bucket width. A counter resets to zero when its process restarts, so a rate sums the increases between samples,
          treating a drop as a reset (<C>rate</C>).
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Theorem title="the tail at scale">
        <p>
          (Dean and Barroso, 2013.) If each of n servers independently replies slowly with probability p, a request that waits for
          all of them is slow with probability <M>{"1 - (1 - p)^n"}</M>, which is about np when np is small and tends to 1 as n
          grows. If each sub-request is hedged, sending a second copy to another server when the first is late and using the
          first reply, the probability falls to about <M>{"1 - (1 - p^2)^n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The request is fast only if every reply is fast, which by independence has probability <M>{"(1 - p)^n"}</M> (<C>fanout_slow</C>).
          By the binomial expansion <M>{"(1 - p)^n \\ge 1 - np"}</M>, with near-equality when np is small, and{" "}
          <M>{"(1 - p)^n \\le e^{-np} \\to 0"}</M>. With hedging, a sub-request is slow only if both independent copies are,
          probability <M>{"p^2"}</M>, and the same argument applies with <M>{"p^2"}</M> in place of p.
        </p>
      </Proof>

      <Definition title="objectives and alerts">
        <p>
          A <em>service-level objective</em> states a target, such as 99.9% of requests answered within 200 ms over 30 days. Its
          complement is an <em>error budget</em>, here 0.1% of requests or 43.2 minutes of full outage, which the team may spend on
          risky changes; alerts fire when the budget is being consumed too quickly, rather than on every blip.
        </p>
      </Definition>

      <Definition title="watching a training run">
        <p>
          A training run adds its own signals (e6.6.3): loss, gradient norm, throughput and step time per rank. A noisy curve is
          smoothed by an exponential moving average (<C>ema</C>); a <em>spike</em> is a value more than k standard deviations
          from the mean of the preceding window (<C>spikes</C>); a <em>straggler</em> is a rank whose step time exceeds k times
          the median across ranks (<C>stragglers</C>), the usual sign of a throttling GPU or a failing link.
        </p>
        <Code>{MONITOR}</Code>
      </Definition>

      <Remark title="tools">
        <p>
          A typical stack scrapes metrics with Prometheus, draws them in Grafana and collects traces through OpenTelemetry. GPU
          clusters add the vendor&apos;s counters (utilisation, memory errors, temperature, power and clock throttling) and the
          collective library&apos;s watchdog, which reports a rank stuck in an all-reduce rather than letting the whole job hang
          silently. Comparing measured collective times with the α–β prediction (e8.2.5) and step time with the model FLOPs
          utilisation (e7.4.4) turns vague slowness into a specific suspect.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "budget",
      rung: "check",
      prompt: <p>A service promises 99.9% availability over 30 days. How many minutes of full outage does its error budget allow?</p>,
      answer: { kind: "numeric", value: 43.2, tolerance: 0.001 },
    },
    {
      key: "tail",
      rung: "check",
      prompt: <p>Each of 50 servers is slow 2% of the time, independently. What fraction of requests that wait for all 50 is slow? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.6358, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why do distributed systems monitor the 99th percentile of latency rather than only the mean?</p>,
      answer: {
        kind: "choice",
        options: [
          "Requests that fan out to many servers are as slow as the slowest reply, so rare slow replies dominate what users experience",
          "The mean cannot be computed from a histogram",
          "Percentiles are cheaper to store than means",
          "The mean latency is always zero",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def percentile_from_buckets(bounds, counts, q):
    target, total = q * sum(counts), 0
    for b, c in zip(bounds, counts):
        total += c
        if total >= target:
            return b
    return bounds[-1]

def rate(samples):
    increase = 0
    for (t0, v0), (t1, v1) in zip(samples, samples[1:]):
        increase += v1 - v0 if v1 >= v0 else v1
    return increase / (samples[-1][0] - samples[0][0])

def fanout_slow(p, n):
    return 1 - (1 - p) ** n

print(percentile_from_buckets([0.1, 0.5, 1.0, 5.0], [50, 30, 15, 5], 0.5), percentile_from_buckets([0.1, 0.5, 1.0, 5.0], [50, 30, 15, 5], 0.99), round(fanout_slow(0.01, 100), 4))
print(rate([(0, 10), (10, 30), (20, 5), (30, 25)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 5.0 0.634\n1.5",
          "0.5 5.0 0.634\n1.5",
          "0.1 1.0 0.634\n1.5",
          "0.1 5.0 0.634\n0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ema(xs, alpha):
    s, out = xs[0], [xs[0]]
    for x in xs[1:]:
        s = alpha * x + (1 - alpha) * s
        out.append(s)
    return out

def spikes(xs, window, k):
    out = []
    for i in range(window, len(xs)):
        prev = xs[i - window:i]
        m = sum(prev) / window
        sd = (sum((x - m) ** 2 for x in prev) / window) ** 0.5
        if abs(xs[i] - m) > k * sd:
            out.append(i)
    return out

def stragglers(step_times, k):
    s, n = sorted(step_times), len(step_times)
    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    return [r for r, t in enumerate(step_times) if t > k * med]

print([round(x, 3) for x in ema([1, 2, 3, 10], 0.5)], spikes([1, 1, 2, 1, 1, 9, 1], 3, 3))
print(stragglers([1.0, 1.1, 0.9, 2.5, 1.0], 1.5), stragglers([3, 1, 2, 10], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 1.5, 2.25, 6.125] [5]\n[3] [3]",
          "[1, 1.5, 2.25, 6.125] [5, 6]\n[3] [3]",
          "[1, 1.5, 2.0, 6.0] [5]\n[3] [3]",
          "[1, 1.5, 2.25, 6.125] [5]\n[3] [2, 3]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>percentile_from_buckets(bounds, counts, q)</C>, <C>rate(samples)</C> for counter samples <C>(time, value)</C>{" "}
          that may reset to a lower value, and <C>fanout_slow(p, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def percentile_from_buckets(bounds, counts, q):
    return bounds[0]

def rate(samples):
    return (samples[-1][1] - samples[0][1]) / (samples[-1][0] - samples[0][0])

def fanout_slow(p, n):
    return p
`,
        solution: METRICS,
        tests: [
          { name: "percentile", code: `assert percentile_from_buckets([1, 2, 3], [0, 0, 4], 0.1) == 3 and percentile_from_buckets([1, 2, 3], [1, 1, 2], 0.5) == 2
assert percentile_from_buckets([1, 2], [3, 1], 1.0) == 2 and percentile_from_buckets([1, 2], [3, 1], 0.75) == 1` },
          { name: "rate", code: `assert rate([(0, 0), (5, 10)]) == 2 and rate([(0, 5), (2, 1), (4, 3)]) == 0.75
assert abs(fanout_slow(0.5, 2) - 0.75) < 1e-12 and fanout_slow(0.1, 0) == 0 and abs(fanout_slow(0.01, 1) - 0.01) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema(xs, alpha)</C>, starting from the first value; <C>spikes(xs, window, k)</C>, the indices whose value differs
          from the mean of the previous <C>window</C> values by more than k population standard deviations of them; and{" "}
          <C>stragglers(step_times, k)</C>, the ranks slower than k times the median.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ema(xs, alpha):
    return list(xs)

def spikes(xs, window, k):
    return []

def stragglers(step_times, k):
    return []
`,
        solution: MONITOR,
        tests: [
          { name: "ema and spikes", code: `assert ema([4], 0.3) == [4] and ema([0, 10], 0.1) == [0, 1.0]
assert spikes([5, 5, 5, 6], 3, 100) == [3] and spikes([1, 2], 3, 1) == [] and spikes([1, 3, 1, 3, 10, 2], 2, 2) == [4]` },
          { name: "stragglers", code: `assert stragglers([1], 1.5) == [] and stragglers([1, 1, 3, 1], 2) == [2] and stragglers([2, 4, 6, 100], 3) == [3]
assert stragglers([3, 1, 2, 10], 2) == [3]` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          Each server is slow 0.5% of the time, independently. What is the smallest number of servers a request can wait for
          such that more than half of such requests are slow?
        </p>
      ),
      answer: { kind: "numeric", value: 139, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course has built the tools of distributed computing: messages and collectives, failures and consensus, data
        systems and clusters. Distributed training (e10) puts them together to train one model on thousands of accelerators,
        combining data, tensor, pipeline and expert parallelism.
      </p>
    </>
  ),
};
