import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AlphaBetaFitViz } from "@/components/viz/AlphaBetaFitViz";
import type { LessonContent } from "@/lib/types";

const FIT = `def fit_alpha_beta(sizes, times):
    k = len(sizes)
    mx, my = sum(sizes) / k, sum(times) / k
    slope = sum((x - mx) * (y - my) for x, y in zip(sizes, times)) / sum((x - mx) ** 2 for x in sizes)
    return my - slope * mx, 1 / slope

def effective_bandwidth(n, alpha, beta):
    return n / (alpha + n / beta)

def half_size(alpha, beta):
    return alpha * beta`;

const EXTEND = `def bucketed_time(sizes, bucket, alpha, beta):
    total, cur = 0, 0
    for s in sizes:
        cur += s
        if cur >= bucket:
            total += alpha + cur / beta
            cur = 0
    if cur:
        total += alpha + cur / beta
    return total

def ring_cost(p, n, alpha, beta, gamma):
    return 2 * (p - 1) * alpha + 2 * (p - 1) / p * n / beta + (p - 1) / p * n * gamma

def shared_link_time(n, flows, alpha, beta):
    return alpha + flows * n / beta`;

export const lesson: LessonContent = {
  id: "e8.2.5",
  minutes: 45,
  links: {
    requires: ["e8.2.4"],
    revisits: ["e7.1.1", "e7.1.3"],
    foreshadows: ["e8.5.3"],
  },

  puzzle: (
    <>
      <p>
        A network card is advertised at 25 GB/s. A benchmark that sends 4 KB messages one after another measures 0.8 GB/s, and
        one that sends 64 MB messages measures 24.9 GB/s. Both are honest. What single model explains both numbers, and how
        should it change the way a training framework sends its gradients?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every message pays a fixed start-up cost, the latency α, before its first byte arrives, and then streams at the link&apos;s
        bandwidth β. For a small message the start-up cost is almost all of the time, so the bandwidth it achieves is tiny;
        for a large one it is negligible. The crossover is at the size αβ: the number of bytes the link could have carried
        during one latency. Below it, the remedy is to send fewer, larger messages; above it, the only remedy is a faster link
        or fewer bytes.
      </p>
      <AlphaBetaFitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the α–β model">
        <p>
          (Hockney, 1994.) A message of n bytes between two ranks takes <M>{"t(n) = \\alpha + n/\\beta"}</M>. The latency α
          gathers every per-message cost: software overhead in the library, the network card, and the hops through switches.
          The bandwidth β is that of the slowest link on the path. The achieved, or effective, bandwidth is{" "}
          <M>{"n/t(n)"}</M>. To measure the two, time a ping-pong (one rank sends, the other replies, and half the round trip
          is t) over a range of sizes and fit a straight line by least squares (<C>fit_alpha_beta</C>), as in e7.1.3.
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="the half-bandwidth size">
        <p>
          The effective bandwidth <M>{"n/(\\alpha + n/\\beta)"}</M> increases with n towards β, equals β/2 exactly at{" "}
          <M>{"n_{1/2} = \\alpha\\beta"}</M>, and reaches a fraction 1 − ε of β only when{" "}
          <M>{"n \\ge \\alpha\\beta(1 - \\varepsilon)/\\varepsilon"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write the effective bandwidth as <M>{"\\beta\\,\\frac{n}{n + \\alpha\\beta}"}</M>. The fraction{" "}
          <M>{"n/(n + \\alpha\\beta)"}</M> increases in n and tends to 1, and equals 1/2 when <M>{"n = \\alpha\\beta"}</M>. It is
          at least 1 − ε when <M>{"n \\ge (1 - \\varepsilon)(n + \\alpha\\beta)"}</M>, that is{" "}
          <M>{"\\varepsilon n \\ge (1 - \\varepsilon)\\alpha\\beta"}</M>. So 90% of the bandwidth needs messages of 9αβ: about
          1.1 MB at α = 5 µs and β = 25 GB/s.
        </p>
      </Proof>

      <Definition title="what the model leaves out">
        <p>
          Three additions are common. A reduction also computes: summing n bytes at γ seconds per byte adds a term, so the ring
          all-reduce costs <M>{"2(p-1)\\alpha + 2\\frac{p-1}{p}\\frac{n}{\\beta} + \\frac{p-1}{p}n\\gamma"}</M>{" "}
          (<C>ring_cost</C>). <em>Contention</em>: when k flows share one link, each sees bandwidth β/k (<C>shared_link_time</C>),
          which is what limits all-to-all across a network with less bisection bandwidth than its endpoints. And the LogP model
          (Culler et al., 1993) splits α into the CPU overhead o of sending, which the processor cannot overlap, and the wire
          latency L, which it can, and adds a gap g between successive messages.
        </p>
      </Definition>

      <Definition title="bucketing gradients">
        <p>
          A model has hundreds of parameter tensors, many of them small. All-reducing each one separately would pay α hundreds of
          times. Data-parallel training libraries instead pack consecutive gradients into buckets of a set size (25 MB by default
          in PyTorch&apos;s <C>DistributedDataParallel</C>) and all-reduce a bucket as soon as all of its gradients have been
          computed, overlapping communication with the rest of the backward pass. <C>bucketed_time</C> fills buckets greedily,
          sending one as soon as it holds at least <C>bucket</C> bytes; a bucket size of 0 sends every tensor alone.
        </p>
        <Code>{EXTEND}</Code>
      </Definition>

      <Remark title="using the model">
        <p>
          The model is crude but predictive enough to plan with. Before a large training run, measure α and β for each level of
          the machine, predict the time of each collective in a step, and compare it with the compute time. If the predicted
          communication exceeds what can be overlapped, change the parallel layout before spending the compute. Measured
          collective times far above prediction usually mean contention or a misconfigured network, which monitoring should
          flag (e8.5.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "half",
      rung: "check",
      prompt: <p>A link has α = 2 µs and β = 100 GB/s (10¹¹ bytes per second). At what message size, in bytes, does it reach half its bandwidth?</p>,
      answer: { kind: "numeric", value: 200000, tolerance: 0.5 },
    },
    {
      key: "eff",
      rung: "check",
      prompt: <p>What effective bandwidth, in GB/s, does a 1 MB (10⁶ byte) message achieve with α = 10 µs and β = 10 GB/s? Give two decimals.</p>,
      answer: { kind: "numeric", value: 9.09, tolerance: 0.005 },
    },
    {
      key: "bucket",
      rung: "apply",
      prompt: <p>Why does data-parallel training all-reduce gradients in buckets rather than one tensor at a time?</p>,
      answer: {
        kind: "choice",
        options: [
          "Many tensors are smaller than αβ, so sending them separately is dominated by latency; buckets pay α once for many tensors",
          "Buckets reduce the number of bytes that must be sent",
          "A single tensor cannot be all-reduced on its own",
          "Bucketing avoids the need for a reduction operation",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fit_alpha_beta(sizes, times):
    k = len(sizes)
    mx, my = sum(sizes) / k, sum(times) / k
    slope = sum((x - mx) * (y - my) for x, y in zip(sizes, times)) / sum((x - mx) ** 2 for x in sizes)
    return my - slope * mx, 1 / slope

def effective_bandwidth(n, alpha, beta):
    return n / (alpha + n / beta)

def half_size(alpha, beta):
    return alpha * beta

a, b = fit_alpha_beta([0, 100, 200, 300], [5.0, 7.0, 9.0, 11.0]); print(a, b, effective_bandwidth(100, a, b), half_size(a, b))
print(round(effective_bandwidth(250, 5, 50) / 50, 3), fit_alpha_beta([1, 2, 3], [3, 5, 7]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 50.0 14.285714285714286 250.0\n0.5 (1.0, 0.5)",
          "5.0 0.02 14.285714285714286 250.0\n0.5 (1.0, 0.5)",
          "5.0 50.0 14.285714285714286 250.0\n0.5 (1.0, 2.0)",
          "5.0 50.0 20.0 250.0\n0.25 (1.0, 0.5)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bucketed_time(sizes, bucket, alpha, beta):
    total, cur = 0, 0
    for s in sizes:
        cur += s
        if cur >= bucket:
            total += alpha + cur / beta
            cur = 0
    if cur:
        total += alpha + cur / beta
    return total

def ring_cost(p, n, alpha, beta, gamma):
    return 2 * (p - 1) * alpha + 2 * (p - 1) / p * n / beta + (p - 1) / p * n * gamma

def shared_link_time(n, flows, alpha, beta):
    return alpha + flows * n / beta

print(bucketed_time([4, 4, 4, 4, 4], 0, 1, 2), bucketed_time([4, 4, 4, 4, 4], 10, 1, 2), bucketed_time([4, 4, 4, 4, 4], 100, 1, 2))
print(ring_cost(4, 400, 1, 100, 0), ring_cost(4, 400, 1, 100, 0.01), shared_link_time(100, 4, 2, 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "15.0 12.0 11.0\n12.0 15.0 10.0",
          "15.0 13.0 11.0\n12.0 15.0 10.0",
          "11.0 12.0 11.0\n12.0 15.0 10.0",
          "15.0 12.0 11.0\n12.0 12.03 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_alpha_beta(sizes, times)</C>, the least-squares fit of <M>{"t = \\alpha + n/\\beta"}</M> returning{" "}
          <C>(alpha, beta)</C>; <C>effective_bandwidth(n, alpha, beta)</C>; and <C>half_size(alpha, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fit_alpha_beta(sizes, times):
    return 0.0, 1.0

def effective_bandwidth(n, alpha, beta):
    return beta

def half_size(alpha, beta):
    return 0.0
`,
        solution: FIT,
        tests: [
          { name: "fit", code: `a, b = fit_alpha_beta([10, 20], [3, 5])
assert abs(a - 1) < 1e-12 and abs(b - 5) < 1e-12
a, b = fit_alpha_beta([1, 2, 3, 4], [2.1, 2.9, 4.1, 4.9])
assert abs(a - 1.1) < 1e-9 and abs(b - 1 / 0.96) < 1e-9` },
          { name: "bandwidth", code: `assert effective_bandwidth(0, 1, 2) == 0 and abs(effective_bandwidth(10, 0, 7) - 7) < 1e-12 and half_size(3, 4) == 12
assert abs(effective_bandwidth(half_size(2.5, 8), 2.5, 8) - 4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bucketed_time(sizes, bucket, alpha, beta)</C>, filling buckets greedily in order and sending each as soon
          as it holds at least <C>bucket</C> bytes, with any remainder sent at the end; <C>ring_cost(p, n, alpha, beta, gamma)</C>;
          and <C>shared_link_time(n, flows, alpha, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bucketed_time(sizes, bucket, alpha, beta):
    return alpha + sum(sizes) / beta

def ring_cost(p, n, alpha, beta, gamma):
    return 0.0

def shared_link_time(n, flows, alpha, beta):
    return alpha + n / beta
`,
        solution: EXTEND,
        tests: [
          { name: "buckets", code: `assert bucketed_time([], 5, 1, 1) == 0 and bucketed_time([3, 3, 3], 6, 1, 1) == 11 and bucketed_time([10, 1, 1], 5, 2, 1) == 16
assert bucketed_time([2, 2, 2], 0, 1, 1) == 9` },
          { name: "extensions", code: `assert ring_cost(1, 10, 1, 1, 1) == 0 and abs(ring_cost(2, 10, 1, 5, 0.5) - 6.5) < 1e-12 and shared_link_time(8, 1, 1, 4) == 3
assert shared_link_time(8, 4, 1, 4) == 9` },
        ],
      },
    },
    {
      key: "ddp",
      rung: "stretch",
      prompt: (
        <p>
          A model has 100 gradient tensors of 4 MB (4 × 10⁶ bytes) each, and an all-reduce costs α = 50 µs plus the bytes over an
          effective 10 GB/s. How many milliseconds does <C>bucketed_time</C> give with 25 MB (25 × 10⁶ byte) buckets? Give two
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 40.75, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        The models of this part assume that every rank and every link keeps working. At the scale of thousands of machines
        that is false: something fails every few hours. The next part asks what can go wrong in a distributed system, and how
        a group of machines can agree on anything when some of them may have crashed.
      </p>
    </>
  ),
};
