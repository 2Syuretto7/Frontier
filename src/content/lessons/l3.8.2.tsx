import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LossDiagnosisViz } from "@/components/viz/LossDiagnosisViz";
import type { LessonContent } from "@/lib/types";

const SMOOTH = `import numpy as np

def ema_smooth(xs, beta):
    out, m = [], 0.0
    for t, x in enumerate(xs, start=1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out

def spike_steps(xs, factor, window):
    xs = np.asarray(xs, dtype=float)
    return [t for t in range(window, len(xs)) if xs[t] > factor * np.median(xs[t - window:t])]`;

const CLASSIFY = `def classify(train, val, target):
    if train[-1] > 0.9 * train[0]:
        return "not learning"
    if val[-1] > 1.1 * min(val):
        return "overfitting"
    if train[-1] > target:
        return "underfitting"
    return "good"

def best_epoch(val):
    return int(np.argmin(val))`;

export const lesson: LessonContent = {
  id: "l3.8.2",
  minutes: 40,
  links: {
    requires: ["l3.8.1"],
    revisits: ["l3.7.4", "l3.6.3"],
    foreshadows: ["l3.8.3"],
  },

  puzzle: (
    <>
      <p>
        Two training runs end with the same validation loss. In the first, training loss is far below validation loss; in
        the second, the two are almost equal. The right next step is opposite in the two cases: one needs more
        regularisation, the other less, or a bigger model. The final number cannot tell them apart. The curves can.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training run produces two curves: training loss, noisy because each step sees a different minibatch, and validation
        loss, measured now and then on held-out data. Their levels, slopes and the gap between them separate a handful of
        common situations, each with its own remedy. Smoothing the training curve first makes the shape readable.
      </p>
      <LossDiagnosisViz />
    </>
  ),

  theory: (
    <>
      <Definition title="smoothing">
        <p>
          Per-step training loss is a noisy estimate. An exponential moving average{" "}
          <M>{"m_t = \\beta m_{t-1} + (1 - \\beta)x_t"}</M> with <M>{"m_0 = 0"}</M> smooths it over roughly{" "}
          <M>{"1/(1 - \\beta)"}</M> steps; dividing by <M>{"1 - \\beta^t"}</M> removes the pull towards 0 at the start.
        </p>
      </Definition>

      <Theorem title="bias correction">
        <p>
          If every <M>{"x_t"}</M> equals c, then <M>{"m_t = (1 - \\beta^t)c"}</M>, so{" "}
          <M>{"m_t/(1 - \\beta^t) = c"}</M> exactly.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"m_t = (1 - \\beta)\\sum_{s=1}^{t}\\beta^{t-s}x_s = (1 - \\beta)c\\sum_{k=0}^{t-1}\\beta^k = (1 - \\beta)c\\,\\frac{1 - \\beta^t}{1 - \\beta}"}</M>.
          This is the same correction Adam applies to its moment estimates.
        </p>
        <Code>{SMOOTH}</Code>
      </Proof>

      <Definition title="the generalisation gap">
        <p>
          The difference between validation and training loss. A small gap with high losses is underfitting: the model
          cannot even fit the training data, so add capacity or train longer, and remove regularisation. A gap that grows
          while validation loss rises is overfitting: stop early, regularise, or get more data.
        </p>
      </Definition>

      <Remark title="optimisation pathologies">
        <p>
          A curve that drops fast and then plateaus noisily, with occasional spikes, is the noise floor of a learning rate
          that is too high; decay it. A smooth curve still falling steadily at the end means the learning rate is too low or
          training too short. Isolated spikes that recover often come from a few bad batches or from instability in Adam's
          second moment estimate; clipping or a lower learning rate helps. A plateau at exactly <M>{"\\log K"}</M> means the
          model is outputting the uniform distribution: nothing is being learnt at all.
        </p>
        <Code>{CLASSIFY}</Code>
      </Remark>

      <Example title="plotting habits">
        <p>
          Plot loss on a log scale, since the interesting changes late in training are small in absolute terms; plot against
          steps or examples seen, not epochs, so runs with different batch sizes compare; and always plot the raw curve
          faintly behind the smoothed one, since heavy smoothing can hide spikes and delays every change by about{" "}
          <M>{"1/(1 - \\beta)"}</M> steps.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ema",
      rung: "check",
      prompt: <p>An EMA with β = 0.9 and m₀ = 0 sees a first loss of 2.0. What is m₁ before bias correction?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 1e-9 },
    },
    {
      key: "window",
      rung: "check",
      prompt: <p>Roughly how many steps does an EMA with β = 0.98 average over?</p>,
      answer: { kind: "numeric", value: 50, tolerance: 1e-6 },
    },
    {
      key: "under",
      rung: "apply",
      prompt: <p>Training loss 1.2, validation loss 1.25, both flat for the last half of training, and a good model reaches 0.3. What should change?</p>,
      answer: {
        kind: "choice",
        options: [
          "Increase capacity or reduce regularisation: the model is underfitting",
          "Add dropout: the model is overfitting",
          "Stop earlier",
          "Nothing: the small gap shows the model is good",
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

def ema_smooth(xs, beta):
    out, m = [], 0.0
    for t, x in enumerate(xs, start=1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out

def spike_steps(xs, factor, window):
    xs = np.asarray(xs, dtype=float)
    return [t for t in range(window, len(xs)) if xs[t] > factor * np.median(xs[t - window:t])]

print([round(v, 3) for v in ema_smooth([2.0, 1.0, 1.0], 0.5)])
print(spike_steps([1.0, 0.9, 0.95, 0.9, 3.0, 0.85, 0.9], 2.0, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2.0, 1.333, 1.143]\n[4]", "[1.0, 1.0, 1.0]\n[4]", "[2.0, 1.5, 1.25]\n[4]", "[2.0, 1.333, 1.143]\n[4, 5]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def classify(train, val, target):
    if train[-1] > 0.9 * train[0]:
        return "not learning"
    if val[-1] > 1.1 * min(val):
        return "overfitting"
    if train[-1] > target:
        return "underfitting"
    return "good"

def best_epoch(val):
    return int(np.argmin(val))

tr = [2.0, 1.0, 0.5, 0.2, 0.1]
print(classify(tr, [2.1, 1.2, 0.9, 1.0, 1.3], 0.3), classify(tr, [2.1, 1.2, 0.8, 0.7, 0.7], 0.3))
print(classify([2.0, 1.5, 1.2, 1.1, 1.0], [2.0, 1.6, 1.3, 1.2, 1.1], 0.3), best_epoch([2.1, 1.2, 0.9, 1.0, 1.3]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["overfitting good\nunderfitting 2", "good overfitting\nunderfitting 2", "overfitting good\nnot learning 2", "overfitting good\nunderfitting 4"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ema_smooth(xs, beta)</C>, the bias-corrected moving average as a list, and{" "}
          <C>spike_steps(xs, factor, window)</C>, the list of steps t ≥ window at which xs[t] is more than factor times the
          median of the previous window values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ema_smooth(xs, beta):
    return list(xs)

def spike_steps(xs, factor, window):
    return []
`,
        solution: SMOOTH,
        tests: [
          { name: "ema", code: `s = ema_smooth([2.0, 1.0, 1.0], 0.5)
assert np.allclose(s, [2.0, 4 / 3, 8 / 7])
assert np.allclose(ema_smooth([3.0] * 20, 0.9), 3.0)
assert np.allclose(ema_smooth([1.0, 5.0], 0.0), [1.0, 5.0])` },
          { name: "spikes", code: `assert spike_steps([1.0, 0.9, 0.95, 0.9, 3.0, 0.85, 0.9], 2.0, 3) == [4]
xs = [1.0] * 10 + [2.5] + [1.0] * 5 + [5.0]
assert spike_steps(xs, 2.0, 4) == [10, 16]
assert spike_steps([1.0, 2.0], 1.5, 5) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>classify(train, val, target)</C> for per-epoch loss lists. In this order: <C>"not learning"</C> if the last
          training loss exceeds 0.9 times the first; <C>"overfitting"</C> if the last validation loss exceeds 1.1 times its
          minimum; <C>"underfitting"</C> if the last training loss is above target; otherwise <C>"good"</C>. Also write{" "}
          <C>best_epoch(val)</C>, the index of the lowest validation loss, as an int.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def classify(train, val, target):
    return "good"

def best_epoch(val):
    return len(val) - 1
`,
        solution: `import numpy as np

${CLASSIFY}`,
        tests: [
          { name: "verdicts", code: `tr = [2.0, 1.0, 0.5, 0.2, 0.1]
assert classify(tr, [2.1, 1.2, 0.9, 1.0, 1.3], 0.3) == "overfitting"
assert classify(tr, [2.1, 1.2, 0.8, 0.7, 0.7], 0.3) == "good"
assert classify([2.0, 1.5, 1.2, 1.1, 1.0], [2.0, 1.6, 1.3, 1.2, 1.1], 0.3) == "underfitting"
assert classify([2.3, 2.3, 2.2], [2.3, 2.3, 2.3], 0.3) == "not learning"` },
          { name: "best epoch", code: `assert best_epoch([2.1, 1.2, 0.9, 1.0, 1.3]) == 2
b = best_epoch(np.array([3.0, 1.0, 1.0, 2.0]))
assert b == 1 and isinstance(b, int)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that the bias-corrected EMA m_t/(1 − βᵗ), with m₀ = 0, equals c at every step when every input equals c.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Unrolls the recurrence to m_t = (1 − β)Σ βᵗ⁻ˢ x_s, or proves m_t = (1 − βᵗ)c by induction.",
          "Sums the geometric series (1 − β)Σₖ₌₀ᵗ⁻¹ βᵏ = 1 − βᵗ.",
          "Divides by 1 − βᵗ to obtain c.",
        ],
      },
    },
    {
      key: "lag",
      rung: "stretch",
      prompt: <p>The loss drops suddenly from 2 to 1 and stays there. With β = 0.9 (and many earlier steps at 2), after how many steps has the EMA fallen below 1.1? Give the smallest whole number.</p>,
      answer: { kind: "numeric", value: 22 },
    },
  ],

  teachBack:
    "Explain to a friend how to tell overfitting, underfitting and learning-rate problems apart from training and validation curves, and how to smooth a noisy curve properly.",

  glimpse: (
    <p>
      Loss curves show that something is wrong, not where. Next: activation and gradient statistics, which look inside the
      network layer by layer.
    </p>
  ),
};
