import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TrainingSignalsViz } from "@/components/viz/TrainingSignalsViz";
import type { LessonContent } from "@/lib/types";

const STATS = `def welford_update(state, x):
    n, mean, m2 = state
    n += 1
    delta = x - mean
    mean += delta / n
    m2 += delta * (x - mean)                               # uses the old and the new mean
    return n, mean, m2

def welford_var(state):
    n, _, m2 = state
    return m2 / n if n else 0.0                            # population variance

def merge(a, b):
    na, ma, qa = a; nb, mb, qb = b
    n = na + nb
    delta = mb - ma
    return n, ma + delta * nb / n, qa + qb + delta**2 * na * nb / n   # combine ranks without raw data`;

const SIGNALS = `import math

def grad_norm(grads):
    return math.sqrt(sum(g * g for block in grads for g in block))   # one global L2 norm

def update_ratio(update_norm, weight_norm):
    return update_norm / weight_norm if weight_norm else 0.0

def ema_debiased(xs, beta):
    out, m = [], 0.0
    for t, x in enumerate(xs, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta**t))                      # remove the bias towards the zero start
    return out`;

export const lesson: LessonContent = {
  id: "e13.2.1",
  minutes: 45,
  links: {
    requires: ["e13.1.3", "l8.6.1"],
    revisits: ["e10.2.1"],
    foreshadows: ["e13.2.2", "e13.2.3", "e13.3.1"],
  },

  puzzle: (
    <>
      <p>
        A run logs only its training loss. On day nine the loss jumps and does not recover. Looking back, the gradient
        norm had been creeping up for two days and the attention logits had been growing for a week, but neither was
        logged. Which quantities should a large run record at every step, and how can thousands of GPUs report
        statistics of their own shards without sending all their raw values to one place?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The training loss is the outcome; other metrics are the causes, and they often move first. The gradient norm
        shows how hard the optimiser is being pushed, the ratio of update size to weight size shows whether the
        effective learning rate is sensible, and per-layer statistics of activations and attention logits show where a
        problem starts. Each GPU can summarise its share of a statistic with a count, a mean and a sum of squares, and
        these summaries merge exactly, so the whole cluster&apos;s statistics cost almost nothing to gather.
      </p>
      <TrainingSignalsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="metrics worth logging">
        <p>
          Every step: training loss, global gradient norm before clipping (<C>grad_norm</C>) and whether clipping fired,
          learning rate, the ratio of update norm to weight norm per layer group (<C>update_ratio</C>), step time,
          tokens per second and MFU. Every few hundred steps: per-layer RMS of activations and of weights, the largest
          attention logit, the fraction of tokens dropped by mixture-of-experts routers, and held-out loss on a few fixed
          data subsets. Plot noisy series with a bias-corrected moving average (<C>ema_debiased</C>) alongside the raw
          values, as l8.6.1 recommended for reading loss curves.
        </p>
        <Code>{SIGNALS}</Code>
      </Definition>

      <Theorem title="streaming and merging statistics">
        <p>
          Welford&apos;s update keeps a count n, a mean and <M>{"M_2 = \\sum (x_i - \\bar x)^2"}</M> for a stream of
          values without storing them (<C>welford_update</C>, with variance <M>{"M_2/n"}</M> in <C>welford_var</C>). Two
          summaries with counts <M>{"n_a, n_b"}</M>, means <M>{"\\bar x_a, \\bar x_b"}</M> and sums{" "}
          <M>{"M_{2,a}, M_{2,b}"}</M> combine exactly as
        </p>
        <MD>{"n = n_a + n_b,\\quad \\bar x = \\bar x_a + \\delta\\frac{n_b}{n},\\quad M_2 = M_{2,a} + M_{2,b} + \\delta^2\\frac{n_a n_b}{n}"}</MD>
        <p>
          with <M>{"\\delta = \\bar x_b - \\bar x_a"}</M> (<C>merge</C>), so ranks can be reduced in any order.
        </p>
        <Code>{STATS}</Code>
      </Theorem>
      <Proof>
        <p>
          The combined mean is the count-weighted average <M>{"(n_a\\bar x_a + n_b\\bar x_b)/n"}</M>, which equals{" "}
          <M>{"\\bar x_a + \\delta n_b/n"}</M>. For <M>{"M_2"}</M>, write each deviation from the combined mean as the
          deviation from the group mean plus the group mean&apos;s offset. The cross terms vanish because deviations from
          a group mean sum to zero, leaving{" "}
          <M>{"M_{2,a} + M_{2,b} + n_a(\\bar x_a - \\bar x)^2 + n_b(\\bar x_b - \\bar x)^2"}</M>. Since{" "}
          <M>{"\\bar x_a - \\bar x = -\\delta n_b/n"}</M> and <M>{"\\bar x_b - \\bar x = \\delta n_a/n"}</M>, the last two
          terms sum to <M>{"\\delta^2 n_a n_b (n_b + n_a)/n^2 = \\delta^2 n_a n_b/n"}</M>. Welford&apos;s update is the
          case <M>{"n_b = 1"}</M>. Unlike summing squares directly, both avoid the cancellation that ruins the variance
          of large values in floating point.
        </p>
      </Proof>

      <Theorem title="bias correction of moving averages">
        <p>
          The moving average <M>{"m_t = \\beta m_{t-1} + (1 - \\beta)x_t"}</M> started at <M>{"m_0 = 0"}</M> puts total
          weight <M>{"1 - \\beta^t"}</M> on the data, so <M>{"m_t/(1 - \\beta^t)"}</M> is a weighted average with weights
          summing to one; on a constant series it returns the constant exactly.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"m_t = (1 - \\beta)\\sum_{i=1}^{t}\\beta^{t-i}x_i"}</M>, and the weights sum to{" "}
          <M>{"(1 - \\beta)(1 + \\beta + \\dots + \\beta^{t-1}) = 1 - \\beta^t"}</M>. Dividing by that sum normalises
          them. Without the correction, early values are biased towards zero, which on a dashboard looks like a dip at the
          start of every restart. Adam applies the same correction to its moment estimates for the same reason.
        </p>
      </Proof>

      <Example title="which signal moves first">
        <p>
          In the viz, a learning rate that is too high raises the update-to-weight ratio at once and the gradient norm
          within tens of steps, while the loss responds only later; a bad data shard moves the loss at once and recovers.
          A ratio of update norm to weight norm around <M>{"10^{-3}"}</M> per step is a common sanity range for Adam-style
          optimisers; values far above it are a warning before anything else goes wrong.
        </p>
      </Example>

      <Remark title="cost and cardinality">
        <p>
          Every metric has a cost: a reduction across ranks, storage, and attention on a dashboard. Log per-step scalars
          globally, per-layer statistics less often, and full histograms rarely. Tag every metric with the run, the
          configuration hash of e15-style plans and the step, so it can be compared across restarts. The next lessons turn
          these series into dashboards and alerts.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "merge",
      rung: "check",
      prompt: (
        <p>
          One rank has 4 values with mean 2 and <M>{"M_2 = 8"}</M>; another has 6 values with mean 5 and{" "}
          <M>{"M_2 = 30"}</M>. What is the population variance of all 10 values? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.96, tolerance: 0.005 },
    },
    {
      key: "ema",
      rung: "check",
      prompt: (
        <p>
          With β = 0.8, what is the bias-corrected moving average after the values 2, 5 and 1? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.5738, tolerance: 0.0005 },
    },
    {
      key: "first",
      rung: "apply",
      prompt: <p>A learning rate set too high usually shows up first in which metric?</p>,
      answer: {
        kind: "choice",
        options: [
          "The ratio of update norm to weight norm, followed by the gradient norm",
          "The held-out loss on a fixed subset",
          "Tokens per second",
          "The fraction of tokens dropped by routers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def welford_update(state, x):
    n, mean, m2 = state
    n += 1
    delta = x - mean
    mean += delta / n
    m2 += delta * (x - mean)                               # uses the old and the new mean
    return n, mean, m2

def welford_var(state):
    n, _, m2 = state
    return m2 / n if n else 0.0                            # population variance

def merge(a, b):
    na, ma, qa = a; nb, mb, qb = b
    n = na + nb
    delta = mb - ma
    return n, ma + delta * nb / n, qa + qb + delta**2 * na * nb / n   # combine ranks without raw data

from functools import reduce; s = reduce(welford_update, [2, 4, 4, 4, 5, 5, 7, 9], (0, 0.0, 0.0))
print(s, welford_var(s), merge((2, 3.0, 2.0), (2, 5.0, 2.0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(8, 5.0, 32.0) 4.0 (4, 4.0, 8.0)",
          "(8, 5.0, 32.0) 4.571 (4, 4.0, 4.0)",
          "(8, 5.0, 4.0) 0.5 (4, 4.0, 8.0)",
          "(8, 4.5, 32.0) 4.0 (4, 4.0, 8.0)",
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

def grad_norm(grads):
    return math.sqrt(sum(g * g for block in grads for g in block))   # one global L2 norm

def update_ratio(update_norm, weight_norm):
    return update_norm / weight_norm if weight_norm else 0.0

def ema_debiased(xs, beta):
    out, m = [], 0.0
    for t, x in enumerate(xs, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta**t))                      # remove the bias towards the zero start
    return out

print(grad_norm([[3.0], [4.0, 0.0]]), update_ratio(0.01, 2.0), [round(v, 4) for v in ema_debiased([1.0, 3.0], 0.9)])
print(round(ema_debiased([4.0] * 5, 0.5)[-1], 6), update_ratio(0, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 0.005 [1.0, 2.0526]\n4.0 0.0",
          "7.0 0.005 [1.0, 2.0526]\n4.0 0.0",
          "5.0 0.005 [0.1, 0.39]\n3.875 0.0",
          "5.0 200.0 [1.0, 2.0526]\n4.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A summary is (n, mean, M2). Write <C>welford_update(state, x)</C>, <C>welford_var(state)</C>, the population
          variance or 0.0 when empty, and <C>merge(a, b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def welford_update(state, x):
    n, mean, m2 = state
    return n + 1, x, m2

def welford_var(state):
    return state[2]

def merge(a, b):
    return a
`,
        solution: STATS,
        tests: [
          { name: "stream", code: `s = (0, 0.0, 0.0)\nfor x in [1, 2, 3, 4]:\n    s = welford_update(s, x)\nassert s == (4, 2.5, 5.0) and welford_var(s) == 1.25 and welford_var((0, 0.0, 0.0)) == 0.0` },
          { name: "merge", code: `a = (3, 2.0, 2.0); b = (1, 6.0, 0.0)\nn, m, q = merge(a, b)\nassert n == 4 and abs(m - 3) < 1e-12 and abs(q - 14) < 1e-12 and merge((0, 0.0, 0.0), (2, 1.0, 2.0)) == (2, 1.0, 2.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grad_norm(grads)</C>, the global L2 norm over a list of lists; <C>update_ratio(update_norm,
          weight_norm)</C>, or 0.0 for zero weights; and <C>ema_debiased(xs, beta)</C>, returning the corrected average
          after each value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def grad_norm(grads):
    return max(abs(g) for block in grads for g in block)

def update_ratio(update_norm, weight_norm):
    return update_norm

def ema_debiased(xs, beta):
    return list(xs)
`,
        solution: SIGNALS,
        tests: [
          { name: "norm", code: `assert grad_norm([[1.0, 2.0], [2.0]]) == 3.0 and grad_norm([[]]) == 0.0 and update_ratio(1, 4) == 0.25 and update_ratio(1, 0) == 0.0` },
          { name: "ema", code: `e = ema_debiased([2.0, 4.0], 0.5)\nassert e[0] == 2.0 and abs(e[1] - 10 / 3) < 1e-12 and ema_debiased([], 0.9) == []` },
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: (
        <p>
          Three ranks report (n, mean, <M>{"M_2"}</M>) of (2, 1, 2), (3, 4, 6) and (5, 2, 10). What is the population
          variance of all their values? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.04, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hundreds of series are useless if nobody can read them. The next lesson is about dashboards: which plots to put
        side by side, on which axes, so that a problem is visible at a glance.
      </p>
    </>
  ),
};
