import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BandwidthCurveViz } from "@/components/viz/BandwidthCurveViz";
import type { LessonContent } from "@/lib/types";

const MODEL = `def transfer_time(n, latency, bandwidth):
    return latency + n / bandwidth

def effective_bandwidth(n, latency, bandwidth):
    return n / transfer_time(n, latency, bandwidth)

def half_power_size(latency, bandwidth):
    return latency * bandwidth`;

const FLIGHT = `import math
import numpy as np

def bytes_in_flight(latency, bandwidth):
    return latency * bandwidth

def outstanding_requests(latency, bandwidth, request_size):
    return math.ceil(bytes_in_flight(latency, bandwidth) / request_size)

def fit_alpha_beta(sizes, times):
    A = np.column_stack([np.ones(len(sizes)), np.asarray(sizes, float)])
    a, inv_b = np.linalg.lstsq(A, np.asarray(times, float), rcond=None)[0]
    return float(a), float(1 / inv_b)`;

export const lesson: LessonContent = {
  id: "e7.1.1",
  minutes: 40,
  links: {
    requires: ["e3.3.1"],
    revisits: ["e3.6.2"],
    foreshadows: ["e7.1.2", "e7.4.2"],
  },

  puzzle: (
    <>
      <p>
        A GPU&apos;s memory can deliver two terabytes a second, yet copying a 4-kilobyte buffer through it takes about as
        long as copying 400 kilobytes would at full speed. A network link rated at 100 gigabits a second moves small
        messages at a few percent of that. Neither device is broken. What does a single number such as &quot;bandwidth&quot;
        leave out, and how much data must be on the move before the advertised rate appears?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every transfer pays a fixed cost before the first byte arrives, the <em>latency</em>, and then streams at the
        peak rate, the <em>bandwidth</em>. For small transfers the fixed cost dominates; for large ones the streaming does.
        The crossover is the size at which the two take equal time, latency times bandwidth, and it is also how many bytes
        must be in flight at once to keep the link busy. Hardware designers fight latency, which barely improves, by
        keeping many requests outstanding at the same time.
      </p>
      <BandwidthCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the latency-bandwidth model">
        <p>
          A transfer of n bytes over a link with latency α (seconds) and bandwidth β (bytes per second) takes{" "}
          <M>{"T(n) = \\alpha + n/\\beta"}</M>. Its effective bandwidth is <M>{"n/T(n)"}</M>. The model fits memory, buses
          and networks alike, with α ranging from tens of nanoseconds to tens of microseconds.
        </p>
        <Code>{MODEL}</Code>
      </Definition>

      <Theorem title="the half-power size">
        <p>
          The effective bandwidth is <MD>{"\\frac{n}{T(n)} = \\beta\\,\\frac{n}{n + \\alpha\\beta},"}</MD> which reaches half the
          peak at <M>{"n_{1/2} = \\alpha\\beta"}</M> and a fraction f of the peak at{" "}
          <M>{"n = \\frac{f}{1 - f}\\alpha\\beta"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiply numerator and denominator of <M>{"n/(\\alpha + n/\\beta)"}</M> by β. Setting{" "}
          <M>{"n/(n + \\alpha\\beta) = f"}</M> and solving gives <M>{"n(1 - f) = f\\alpha\\beta"}</M>. Reaching 90% of the peak
          therefore needs nine times the half-power size, and 99% needs 99 times.
        </p>
      </Proof>

      <Theorem title="Little&apos;s law for links">
        <p>
          To sustain bandwidth β when each request takes latency α to be answered, at least <M>{"\\alpha\\beta"}</M> bytes
          must be in flight on average; with requests of s bytes, at least <M>{"\\lceil\\alpha\\beta/s\\rceil"}</M> must be
          outstanding at once.
        </p>
      </Theorem>
      <Proof>
        <p>
          Little&apos;s law says that the average number of items in a system equals the arrival rate times the average time
          each spends there. Bytes arrive at rate β and each spends at least α in flight, so at least αβ are in flight. Dividing
          by the request size counts requests. A core that waits for each cache miss before issuing the next has one request
          outstanding and gets <M>{"s/\\alpha"}</M>; this is why processors track many misses at once and GPUs run thousands
          of threads.
        </p>
        <Code>{FLIGHT}</Code>
      </Proof>

      <Remark title="measuring α and β">
        <p>
          Time transfers of several sizes and fit a straight line <M>{"T = \\alpha + n/\\beta"}</M> by least squares: the
          intercept is the latency and the slope the inverse bandwidth, as the last function does. Measured curves bend
          away from the line where caches, page boundaries or protocol limits change the cost per byte, which the next
          lessons and the lesson on benchmarking take up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pcie",
      rung: "check",
      prompt: <p>A link has latency 5 µs and bandwidth 25 GB/s. How many microseconds does a 4 MB (4 × 10⁶ byte) transfer take?</p>,
      answer: { kind: "numeric", value: 165, tolerance: 1e-6 },
    },
    {
      key: "inflight",
      rung: "check",
      prompt: <p>Memory with latency 500 ns and bandwidth 2 × 10¹² bytes per second is read in 64-byte requests. How many must be outstanding at once to reach full bandwidth?</p>,
      answer: { kind: "numeric", value: 15625, tolerance: 0 },
    },
    {
      key: "small",
      rung: "apply",
      prompt: <p>Why does copying many small buffers one at a time reach only a small fraction of a link&apos;s bandwidth?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each copy pays the full latency, which dominates when the buffer is much smaller than latency times bandwidth",
          "Small buffers are compressed less well",
          "Bandwidth is only available to transfers that are powers of two",
          "The link slows down when it is idle",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def transfer_time(n, latency, bandwidth):
    return latency + n / bandwidth

def effective_bandwidth(n, latency, bandwidth):
    return n / transfer_time(n, latency, bandwidth)

def half_power_size(latency, bandwidth):
    return latency * bandwidth

print(transfer_time(1e6, 5e-6, 25e9), round(effective_bandwidth(125e3, 5e-6, 25e9) / 1e9, 3), round(half_power_size(5e-6, 25e9)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4.5e-05 12.5 125000", "4e-05 12.5 125000", "4.5e-05 25.0 125000", "4.5e-05 12.5 5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
import numpy as np

def bytes_in_flight(latency, bandwidth):
    return latency * bandwidth

def outstanding_requests(latency, bandwidth, request_size):
    return math.ceil(bytes_in_flight(latency, bandwidth) / request_size)

def fit_alpha_beta(sizes, times):
    A = np.column_stack([np.ones(len(sizes)), np.asarray(sizes, float)])
    a, inv_b = np.linalg.lstsq(A, np.asarray(times, float), rcond=None)[0]
    return float(a), float(1 / inv_b)

print(round(bytes_in_flight(100e-9, 50e9)), outstanding_requests(100e-9, 50e9, 64))
lat, bw = fit_alpha_beta([1e3, 1e4, 1e5], [2e-6, 1.1e-5, 1.01e-4]); print(round(lat * 1e6, 6), round(bw / 1e9, 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5000 79\n1.0 1.0", "5000 78\n1.0 1.0", "5 79\n1.0 1.0", "5000 79\n2.0 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>transfer_time(n, latency, bandwidth)</C>, <C>effective_bandwidth(n, latency, bandwidth)</C> and{" "}
          <C>half_power_size(latency, bandwidth)</C> for the latency-bandwidth model.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def transfer_time(n, latency, bandwidth):
    return n / bandwidth

def effective_bandwidth(n, latency, bandwidth):
    return bandwidth

def half_power_size(latency, bandwidth):
    return 0.0
`,
        solution: MODEL,
        tests: [
          { name: "time", code: `assert abs(transfer_time(4e6, 5e-6, 25e9) - 165e-6) < 1e-15 and transfer_time(0, 1e-6, 1e9) == 1e-6
assert abs(effective_bandwidth(1e9, 1e-6, 1e9) - 1e9 / 1.000001) < 1e-3` },
          { name: "half power", code: `for a, b in [(5e-6, 25e9), (80e-9, 50e9), (1e-3, 1e6)]:
    n = half_power_size(a, b); assert abs(n - a * b) < 1e-6 * a * b and abs(effective_bandwidth(n, a, b) - b / 2) < 1e-9 * b
    assert abs(effective_bandwidth(9 * n, a, b) - 0.9 * b) < 1e-9 * b` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bytes_in_flight(latency, bandwidth)</C>; <C>outstanding_requests(latency, bandwidth, request_size)</C>, the
          smallest whole number of requests that covers it; and <C>fit_alpha_beta(sizes, times)</C>, returning the latency
          and bandwidth of the least-squares line through the measurements, as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def bytes_in_flight(latency, bandwidth):
    return bandwidth

def outstanding_requests(latency, bandwidth, request_size):
    return 1

def fit_alpha_beta(sizes, times):
    return 0.0, 1.0
`,
        solution: FLIGHT,
        tests: [
          { name: "little", code: `assert abs(bytes_in_flight(500e-9, 2e12) - 1e6) < 1e-6 and outstanding_requests(500e-9, 2e12, 64) == 15625
assert outstanding_requests(100e-9, 50e9, 64) == 79 and outstanding_requests(1e-6, 1e3, 4096) == 1` },
          { name: "fit", code: `a, b = fit_alpha_beta([1e3, 1e4, 1e5], [2e-6, 1.1e-5, 1.01e-4]); assert abs(a - 1e-6) < 1e-12 and abs(b - 1e9) < 1e-3 and isinstance(a, float)
rng = np.random.default_rng(0); n = np.logspace(3, 8, 40); t = 7e-6 + n / 3e10 + rng.normal(0, 1e-8, 40)
a, b = fit_alpha_beta(n, t); assert abs(a - 7e-6) < 1e-7 and abs(b / 3e10 - 1) < 1e-3` },
        ],
      },
    },
    {
      key: "ninety",
      rung: "stretch",
      prompt: <p>For the 5 µs, 25 GB/s link, how many kilobytes (10³ bytes) must one transfer carry to reach 90% of peak bandwidth?</p>,
      answer: { kind: "numeric", value: 1125, tolerance: 1e-6 },
    },
  ],

  glimpse: (
    <>
      <p>
        Latency and bandwidth describe one link. A whole program has fast and slow parts, and speeding up only some of them
        has a hard limit. Next: Amdahl&apos;s law.
      </p>
    </>
  ),
};
