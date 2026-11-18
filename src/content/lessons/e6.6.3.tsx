import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LossSpikeViz } from "@/components/viz/LossSpikeViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import time, torch

def log_step(step, loss, grad_norm, model, prev, opt, t0, tokens):
    # grad_norm: what clip_grad_norm_ returned before opt.step(), the norm before clipping
    # prev: copies of the parameters taken just before opt.step()
    stats = {
        "loss": loss.item(),
        "grad_norm": grad_norm.item(),
        "lr": opt.param_groups[0]["lr"],
        "tokens_per_s": tokens / (time.perf_counter() - t0),
        "max_mem_gb": torch.cuda.max_memory_allocated() / 1e9,
    }
    if step % 100 == 0:                                   # cheaper, per-layer statistics less often
        for name, p in model.named_parameters():
            stats[f"update_ratio/{name}"] = ((p - prev[name]).norm() / p.norm()).item()
    logger.log(stats, step=step)                          # wandb, TensorBoard, or plain JSON lines`;

const STATS = `import numpy as np

def ema(values, beta, debias=True):
    out, m = [], 0.0
    for t, v in enumerate(values, 1):
        m = beta * m + (1 - beta) * v
        out.append(m / (1 - beta ** t) if debias else m)
    return out

def spikes(values, window, z):
    found = []
    for i in range(window, len(values)):
        prev = np.array(values[i - window:i])
        if values[i] > prev.mean() + z * prev.std():
            found.append(i)
    return found

def update_ratio(before, after):
    out = {}
    for k in before:
        w = np.linalg.norm(before[k])
        out[k] = float(np.linalg.norm(after[k] - before[k]) / w) if w > 0 else float('inf')
    return out`;

const ONLINE = `import math

class Welford:
    def __init__(self):
        self.n, self.mean, self.m2 = 0, 0.0, 0.0

    def update(self, x):
        self.n += 1
        d = x - self.mean
        self.mean += d / self.n
        self.m2 += d * (x - self.mean)

    @property
    def std(self):
        return math.sqrt(self.m2 / self.n) if self.n else 0.0

def diverging(losses, k):
    if any(not math.isfinite(v) for v in losses):
        return True
    tail = losses[-(k + 1):]
    return len(tail) == k + 1 and all(b > a for a, b in zip(tail, tail[1:]))

def throughput(step_times, tokens_per_step, skip=0):
    times = sorted(step_times[skip:])
    mid = len(times) // 2
    median = times[mid] if len(times) % 2 else (times[mid - 1] + times[mid]) / 2
    return tokens_per_step / median`;

export const lesson: LessonContent = {
  id: "e6.6.3",
  minutes: 45,
  links: {
    requires: ["e6.6.2"],
    revisits: ["e6.4.5", "e6.3.3"],
    foreshadows: ["m14.6.2", "e7.1.3"],
  },

  puzzle: (
    <>
      <p>
        A run that will cost three weeks of a cluster is in its second day. The loss is still falling, a little more
        slowly than in the smaller pilot. There was a brief spike last night that recovered. Throughput dropped by 8%
        after a node was replaced. Is the run healthy? Stopping it wastes two days; letting it continue might waste three
        weeks. What should have been logged, and how do you read it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Training health shows up in a few numbers, each telling you something the others cannot. Smoothed loss shows the
        trend through minibatch noise. Spikes, judged against recent variability rather than a fixed threshold, show
        instability before it becomes divergence. Gradient norm and the ratio of each update to its weight show whether the
        optimiser is taking sensible steps. Throughput and memory show whether the hardware is doing what it should. Logged
        every step, cheaply, they let you decide early and with evidence.
      </p>
      <LossSpikeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="what to log">
        <p>
          Every step: loss, gradient norm (before clipping), learning rate, tokens per second, peak memory, and the number of
          skipped or clipped steps. Every few hundred steps: per-layer weight norms and update-to-weight ratios, activation
          statistics such as attention logit maxima, and evaluation loss on held-out data. Log raw values and smooth when
          plotting, so nothing is lost.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="bias-corrected moving averages">
        <p>
          The exponential moving average <C>mₜ = β mₜ₋₁ + (1 − β) xₜ</C> with m₀ = 0 is biased toward zero:
          for a constant input c it equals <C>(1 − βᵗ) c</C>. Dividing by <C>1 − βᵗ</C> removes the bias exactly, and the
          corrected average weights the last 1/(1 − β) steps or so.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling the recursion, <C>mₜ = (1 − β) Σᵢ βᵗ⁻ⁱ xᵢ</C> for i from 1 to t. The weights sum to{" "}
          <C>(1 − β)(1 − βᵗ)/(1 − β) = 1 − βᵗ</C>, so a constant input gives (1 − βᵗ) c, and dividing by 1 − βᵗ makes the
          weights sum to one: a proper weighted average, exact for constants. The weight on a value k steps old is
          proportional to βᵏ, which halves every ln 2 / ln(1/β) steps, about 0.69/(1 − β); with β = 0.99 the average reflects
          roughly the last hundred steps. This is the same correction Adam applies to its moments.
        </p>
        <Code>{STATS}</Code>
      </Proof>

      <Example title="statistics without storing history">
        <p>
          Welford&apos;s algorithm updates a running mean and variance from one value at a time, numerically stably, so a
          monitor can track the distribution of a metric over a whole run in constant memory. Divergence shows as a loss that
          rises several steps in a row or turns non-finite; throughput is best summarised by a median after warm-up, since
          compilation, checkpoint saves and evaluation make the mean misleading.
        </p>
        <Code>{ONLINE}</Code>
      </Example>

      <Remark title="reading the dashboard">
        <p>
          Update-to-weight ratios near 10⁻³ per step are typical for Adam; much larger means the learning rate is too high
          for that layer, much smaller that it is barely learning. A gradient norm that grows steadily usually precedes loss
          spikes. Spikes that recover are common in large runs; repeated or growing ones call for a lower learning rate,
          clipping, or a restart from a checkpoint before the spike with the offending batches skipped. A drop in throughput
          with unchanged loss behaviour is a hardware or input-pipeline problem, and the profiler from earlier in this
          course will find it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bias",
      rung: "check",
      prompt: <p>With β = 0.99 and m₀ = 0, what does the uncorrected moving average of a constant loss of 3 read after 10 steps? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.287, tolerance: 0.0006 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: <p>A weight matrix has Frobenius norm 40 and one update changes it by a matrix of norm 0.02. What is the update-to-weight ratio?</p>,
      answer: { kind: "numeric", value: 0.0005, tolerance: 0.000001 },
    },
    {
      key: "throughput",
      rung: "apply",
      prompt: <p>Why summarise throughput by the median step time after warm-up rather than the mean over all steps?</p>,
      answer: {
        kind: "choice",
        options: [
          "Occasional long steps from compilation, checkpointing and evaluation inflate the mean, hiding whether ordinary steps got slower; the median reflects the typical step",
          "The median is cheaper to compute",
          "The mean is biased by the moving average",
          "Throughput is not defined during warm-up",
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

def ema(values, beta, debias=True):
    out, m = [], 0.0
    for t, v in enumerate(values, 1):
        m = beta * m + (1 - beta) * v
        out.append(m / (1 - beta ** t) if debias else m)
    return out

def spikes(values, window, z):
    found = []
    for i in range(window, len(values)):
        prev = np.array(values[i - window:i])
        if values[i] > prev.mean() + z * prev.std():
            found.append(i)
    return found

def update_ratio(before, after):
    out = {}
    for k in before:
        w = np.linalg.norm(before[k])
        out[k] = float(np.linalg.norm(after[k] - before[k]) / w) if w > 0 else float('inf')
    return out

print([round(v, 3) for v in ema([1.0, 1.0, 1.0], 0.9)], [round(v, 3) for v in ema([1.0, 1.0, 1.0], 0.9, debias=False)])
loss = [2.0, 1.9, 2.1, 2.0, 1.95, 2.05, 6.0, 2.0, 1.9]; print(spikes(loss, 4, 4.0), spikes(loss, 4, 100.0))
print({k: round(v, 4) for k, v in update_ratio({'a': np.ones(4), 'b': np.zeros(2)}, {'a': np.full(4, 1.002), 'b': np.ones(2)}).items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 1.0] [0.1, 0.19, 0.271]\n[6] []\n{'a': 0.002, 'b': inf}",
          "[0.1, 0.19, 0.271] [1.0, 1.0, 1.0]\n[6] []\n{'a': 0.002, 'b': inf}",
          "[1.0, 1.0, 1.0] [0.1, 0.19, 0.271]\n[6, 7] [6]\n{'a': 0.002, 'b': inf}",
          "[1.0, 1.0, 1.0] [0.1, 0.19, 0.271]\n[6] []\n{'a': 0.002, 'b': 1.4142}",
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

class Welford:
    def __init__(self):
        self.n, self.mean, self.m2 = 0, 0.0, 0.0

    def update(self, x):
        self.n += 1
        d = x - self.mean
        self.mean += d / self.n
        self.m2 += d * (x - self.mean)

    @property
    def std(self):
        return math.sqrt(self.m2 / self.n) if self.n else 0.0

def diverging(losses, k):
    if any(not math.isfinite(v) for v in losses):
        return True
    tail = losses[-(k + 1):]
    return len(tail) == k + 1 and all(b > a for a, b in zip(tail, tail[1:]))

def throughput(step_times, tokens_per_step, skip=0):
    times = sorted(step_times[skip:])
    mid = len(times) // 2
    median = times[mid] if len(times) % 2 else (times[mid - 1] + times[mid]) / 2
    return tokens_per_step / median

w = Welford()
for x in [2.0, 4.0, 4.0, 4.0, 5.0, 5.0, 7.0, 9.0]: w.update(x)
print(w.n, w.mean, w.std, diverging([3.0, 2.0, 2.1, 2.2, 2.3], 3), diverging([3.0, 2.0, 2.1, 2.2, 2.3], 4), diverging([1.0, float('nan')], 5))
print(throughput([9.0, 1.0, 1.2, 0.8, 1.0, 5.0], 4096, skip=1), throughput([2.0, 1.0, 1.0], 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["8 5.0 2.0 True False True\n4096.0 100.0", "8 5.0 2.138 True False True\n4096.0 100.0", "8 5.0 2.0 True True True\n4096.0 100.0", "8 5.0 2.0 True False True\n1137.8 75.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema(values, beta, debias=True)</C>, returning the moving average after each value, <C>spikes(values,
          window, z)</C>, the indices whose value exceeds the mean of the previous window values by more than z population
          standard deviations, and <C>update_ratio(before, after)</C>, mapping each name in two dicts of arrays to
          ‖after − before‖ / ‖before‖, or inf when ‖before‖ is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ema(values, beta, debias=True):
    return list(values)

def spikes(values, window, z):
    return []

def update_ratio(before, after):
    return {}
`,
        solution: STATS,
        tests: [
          { name: "ema", code: `v = ema([2.0, 4.0, 4.0], 0.5); assert np.allclose(v, [2.0, (0.5 + 2.0) / 0.75, (1.25 + 2.0) / 0.875])
assert np.allclose(ema([3.0] * 5, 0.9), [3.0] * 5) and np.allclose(ema([3.0, 3.0], 0.9, debias=False), [0.3, 0.57])` },
          { name: "spikes", code: `x = [1.0, 1.1, 0.9, 1.0, 1.05, 3.0, 1.0, 0.95, 1.0, 1.02]
assert spikes(x, 3, 3.0) == [5] and spikes(x, 5, 50.0) == [] and spikes([1.0, 1.0, 1.0, 1.0001], 3, 10.0) == [3]
r = update_ratio({'w': np.array([3.0, 4.0]), 'z': np.zeros(3)}, {'w': np.array([3.0, 4.01]), 'z': np.ones(3)}); assert abs(r['w'] - 0.002) < 1e-12 and r['z'] == float('inf')` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write a class <C>Welford</C> with <C>update(x)</C> and attributes n and mean and a property std (population),{" "}
          <C>diverging(losses, k)</C>, true if any loss is non-finite or the last k + 1 losses strictly increase, and{" "}
          <C>throughput(step_times, tokens_per_step, skip=0)</C>, tokens per second at the median step time after skipping
          the first skip steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

class Welford:
    def __init__(self):
        self.n, self.mean = 0, 0.0

    def update(self, x):
        self.n += 1

    @property
    def std(self):
        return 0.0

def diverging(losses, k):
    return False

def throughput(step_times, tokens_per_step, skip=0):
    return tokens_per_step / (sum(step_times) / len(step_times))
`,
        solution: ONLINE,
        tests: [
          { name: "welford", code: `w = Welford(); xs = [1e9 + 4, 1e9 + 7, 1e9 + 13, 1e9 + 16]
for x in xs:
    w.update(x)
assert w.n == 4 and w.mean == 1e9 + 10 and abs(w.std - math.sqrt(22.5)) < 1e-6 and Welford().std == 0.0` },
          { name: "monitor", code: `assert diverging([5.0, 4.0, 4.5, 4.6], 2) and not diverging([5.0, 4.0, 4.5, 4.6], 3) and diverging([float('inf')], 9)
assert throughput([10.0, 2.0, 1.0, 1.5, 0.5], 1000, 1) == 1000 / 1.25 and throughput([4.0, 2.0, 1.0], 60) == 30.0` },
        ],
      },
    },
    {
      key: "halflife",
      rung: "stretch",
      prompt: <p>For β = 0.98, after how many steps does a value&apos;s weight in the moving average fall to half? Give one decimal.</p>,
      answer: { kind: "numeric", value: 34.3, tolerance: 0.06 },
    },
  ],

  glimpse: (
    <>
      <p>
        That ends the course on the engine room of deep learning frameworks. The next engineering course steps down a level,
        to the hardware itself: latency and bandwidth, caches, SIMD and the arithmetic of making programs fast.
      </p>
    </>
  ),
};
