import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BigramTrainViz } from "@/components/viz/BigramTrainViz";
import type { LessonContent } from "@/lib/types";

const OPT = `import numpy as np

def lr_schedule(step, peak, warmup, total, floor=0.1):
    if step < warmup:
        return peak * (step + 1) / warmup
    frac = min((step - warmup) / max(total - warmup, 1), 1.0)
    return float(peak * (floor + (1 - floor) * 0.5 * (1 + np.cos(np.pi * frac))))

def clip_grads(grads, max_norm):
    norm = float(np.sqrt(sum((g * g).sum() for g in grads)))
    scale = min(1.0, max_norm / (norm + 1e-12))
    return [g * scale for g in grads], norm

def adamw_step(p, g, m, v, t, lr, b1=0.9, b2=0.95, eps=1e-8, wd=0.1):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g * g
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    p = p - lr * (mh / (np.sqrt(vh) + eps) + wd * p)
    return p, m, v`;

const DATA = `import numpy as np

def sample_batch(data, B, T, rng):
    data = np.asarray(data)
    starts = rng.integers(0, len(data) - T, size=B)
    x = np.stack([data[s : s + T] for s in starts])
    y = np.stack([data[s + 1 : s + T + 1] for s in starts])
    return x, y

def accumulate(grads, counts):
    counts = np.asarray(counts, float)
    return sum(c * g for c, g in zip(counts, grads)) / counts.sum()

def smooth(losses, beta=0.9):
    out, m = [], 0.0
    for t, x in enumerate(losses, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out`;

export const lesson: LessonContent = {
  id: "l5.3.2",
  minutes: 50,
  links: {
    requires: ["l5.3.1", "m14.2.4", "m14.4.2"],
    revisits: ["m14.4.1", "m14.6.1"],
    foreshadows: ["l5.3.3"],
  },

  puzzle: (
    <>
      <p>
        Large models are trained with batches of millions of tokens, far more than fit on one GPU at once. The batch is cut
        into pieces, each piece&apos;s gradient is computed separately, and the pieces are combined before one optimiser step.
        Is the result the same gradient as one giant batch, and what else has to happen between computing a gradient and
        changing the weights?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A training step for a language model is a short recipe. Cut random windows of T + 1 tokens from the corpus; run the
        model on the first T and score it against the last T; average gradients over all windows in the batch, possibly
        over several passes; clip the gradient if it is unusually large; read the learning rate off a schedule that warms up
        and then decays; take an AdamW step. Each piece exists for a reason you have met before, and together they turn the
        loss curve from log V down towards the entropy of the data.
      </p>
      <BigramTrainViz />
    </>
  ),

  theory: (
    <>
      <Definition title="one optimiser step">
        <p>
          At step t the learning rate is <M>{"\\eta_t"}</M>, which rises linearly for the first w steps to a peak{" "}
          <M>{"\\eta_{\\max}"}</M> and then follows a cosine down to <M>{"\\phi\\,\\eta_{\\max}"}</M> at the last step. The
          gradient <M>{"g"}</M> of all parameters together is clipped to global norm at most c, and AdamW updates every
          parameter with the clipped gradient.
        </p>
        <Code>{OPT}</Code>
      </Definition>

      <Theorem title="clipping keeps the direction">
        <p>
          The clipped gradient <M>{"\\tilde g = g\\min(1, c/\\|g\\|)"}</M> points in the direction of g and has norm{" "}
          <M>{"\\min(\\|g\\|, c)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          It is a non-negative multiple of g, and <M>{"\\|\\tilde g\\| = \\|g\\|\\min(1, c/\\|g\\|) = \\min(\\|g\\|, c)"}</M>.
          Because the norm is taken over all parameters at once, every tensor is scaled by the same factor, unlike clipping
          each tensor or each entry separately, which bends the direction. A spike in the gradient norm, from a bad batch or
          an unstable layer, therefore cannot throw the weights far, and it is common to log the unclipped norm to watch for
          such spikes.
        </p>
      </Proof>

      <Theorem title="gradient accumulation is exact">
        <p>
          Split a batch into micro-batches with <M>{"n_k"}</M> target tokens and mean gradients <M>{"g_k"}</M>. The gradient of
          the mean loss over the whole batch is <M>{"\\sum_kn_kg_k\\big/\\sum_kn_k"}</M>, which is the plain average of the{" "}
          <M>{"g_k"}</M> when all <M>{"n_k"}</M> are equal.
        </p>
      </Theorem>
      <Proof>
        <p>
          The batch loss is <M>{"\\frac1N\\sum_i\\ell_i"}</M> with <M>{"N = \\sum_kn_k"}</M>. Group the terms by micro-batch:{" "}
          <M>{"\\frac1N\\sum_kn_k\\big(\\frac1{n_k}\\sum_{i \\in k}\\ell_i\\big)"}</M>, and differentiate, using linearity. Each
          token&apos;s loss depends only on its own window, and every normalisation in a transformer acts within one
          position, so nothing couples micro-batches; a batch norm across examples would break this. Averaging unequal
          micro-batches with equal weights instead over-weights the tokens of the small ones.
        </p>
      </Proof>

      <Theorem title="the average of a cosine decay">
        <p>
          Over the decay phase, the cosine schedule from <M>{"\\eta_{\\max}"}</M> to <M>{"\\phi\\,\\eta_{\\max}"}</M> has mean{" "}
          <M>{"\\eta_{\\max}(1 + \\phi)/2"}</M>, in the limit of many steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"u \\in [0, 1]"}</M> the fraction of the decay done,{" "}
          <M>{"\\eta(u) = \\eta_{\\max}\\big(\\phi + (1 - \\phi)\\tfrac12(1 + \\cos\\pi u)\\big)"}</M>. Since{" "}
          <M>{"\\int_0^1\\cos\\pi u\\,du = 0"}</M>, the mean is{" "}
          <M>{"\\eta_{\\max}(\\phi + \\tfrac12(1 - \\phi)) = \\eta_{\\max}(1 + \\phi)/2"}</M>. A schedule is therefore partly a
          choice of total step size, which is why comparing two schedules at the same peak can mislead.
        </p>
      </Proof>

      <Definition title="batches and logging">
        <p>
          Each sequence in a batch is a window of T + 1 consecutive tokens starting at a random place in the tokenised corpus;
          the inputs are its first T tokens and the targets its last T. The training loss is noisy from batch to batch, so
          logs show an exponential moving average, corrected for its start at zero as in Adam.
        </p>
        <Code>{DATA}</Code>
      </Definition>

      <Remark title="what the loss can reach">
        <p>
          On the first AdamW step the bias corrections make the update <M>{"\\eta\\,g/(|g| + \\epsilon)"}</M>, about η times
          the sign of each gradient entry, whatever the gradient&apos;s scale. Later the loss falls from about log V, where the
          previous lesson said it starts, towards the entropy of the data per token, which no model can beat on average. Real
          training mixes this recipe with mixed precision, data and model parallelism and checkpointing, which the systems
          courses cover.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "meanlr",
      rung: "check",
      prompt: <p>A cosine decay runs from a peak of 3 × 10⁻⁴ down to 10% of the peak. What is its mean learning rate, in units of 10⁻⁴?</p>,
      answer: { kind: "numeric", value: 1.65, tolerance: 1e-9 },
    },
    {
      key: "tokens",
      rung: "check",
      prompt: <p>Each of 16 GPUs processes micro-batches of 8 sequences of 2048 tokens and accumulates 4 of them per step. How many tokens does one optimiser step see?</p>,
      answer: { kind: "numeric", value: 1048576, tolerance: 0 },
    },
    {
      key: "clip",
      rung: "apply",
      prompt: <p>The gradient over all parameters has norm 12 and the clipping threshold is 1. What happens?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every gradient entry is multiplied by 1/12, so the direction is kept and the norm becomes 1",
          "Every entry larger than 1 in absolute value is set to ±1",
          "Each tensor is rescaled separately to norm 1",
          "The step is skipped",
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

def lr_schedule(step, peak, warmup, total, floor=0.1):
    if step < warmup:
        return peak * (step + 1) / warmup
    frac = min((step - warmup) / max(total - warmup, 1), 1.0)
    return float(peak * (floor + (1 - floor) * 0.5 * (1 + np.cos(np.pi * frac))))

def clip_grads(grads, max_norm):
    norm = float(np.sqrt(sum((g * g).sum() for g in grads)))
    scale = min(1.0, max_norm / (norm + 1e-12))
    return [g * scale for g in grads], norm

def adamw_step(p, g, m, v, t, lr, b1=0.9, b2=0.95, eps=1e-8, wd=0.1):
    m = b1 * m + (1 - b1) * g
    v = b2 * v + (1 - b2) * g * g
    mh, vh = m / (1 - b1 ** t), v / (1 - b2 ** t)
    p = p - lr * (mh / (np.sqrt(vh) + eps) + wd * p)
    return p, m, v

print([round(lr_schedule(s, 1.0, 2, 6), 4) for s in range(7)])
g, n = clip_grads([np.array([3.0]), np.array([4.0])], 1.0); print(n, [round(float(x[0]), 4) for x in g])
p, m, v = adamw_step(np.array([1.0]), np.array([-2.0]), 0.0, 0.0, 1, 0.1, wd=0.0); print(np.round(p, 4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 1.0, 1.0, 0.8682, 0.55, 0.2318, 0.1]\n5.0 [0.6, 0.8]\n[1.1]",
          "[0.0, 0.5, 1.0, 0.8682, 0.55, 0.2318, 0.1]\n5.0 [0.6, 0.8]\n[1.1]",
          "[0.5, 1.0, 1.0, 0.8536, 0.5, 0.1464, 0.0]\n5.0 [0.6, 0.8]\n[1.1]",
          "[0.5, 1.0, 1.0, 0.8682, 0.55, 0.2318, 0.1]\n5.0 [0.6, 0.8]\n[1.2]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sample_batch(data, B, T, rng):
    data = np.asarray(data)
    starts = rng.integers(0, len(data) - T, size=B)
    x = np.stack([data[s : s + T] for s in starts])
    y = np.stack([data[s + 1 : s + T + 1] for s in starts])
    return x, y

def accumulate(grads, counts):
    counts = np.asarray(counts, float)
    return sum(c * g for c, g in zip(counts, grads)) / counts.sum()

def smooth(losses, beta=0.9):
    out, m = [], 0.0
    for t, x in enumerate(losses, 1):
        m = beta * m + (1 - beta) * x
        out.append(m / (1 - beta ** t))
    return out

x, y = sample_batch(np.arange(10), 2, 3, np.random.default_rng(0)); print(x.shape, (y - x).tolist())
print(accumulate([np.array([1.0]), np.array([4.0])], [1, 2]).tolist(), [round(s, 3) for s in smooth([2.0, 1.0, 1.0], 0.5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 3) [[1, 1, 1], [1, 1, 1]]\n[3.0] [2.0, 1.333, 1.143]",
          "(2, 3) [[1, 1, 1], [1, 1, 1]]\n[2.5] [2.0, 1.333, 1.143]",
          "(2, 3) [[1, 1, 1], [1, 1, 1]]\n[3.0] [1.0, 1.0, 1.0]",
          "(2, 4) [[1, 1, 1, 1], [1, 1, 1, 1]]\n[3.0] [2.0, 1.333, 1.143]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lr_schedule(step, peak, warmup, total, floor=0.1)</C>, with linear warmup reaching the peak at step warmup −
          1 and a cosine reaching <C>floor * peak</C> at step total, returning a float; <C>clip_grads(grads, max_norm)</C>,
          returning the clipped list and the unclipped global norm as a float; and{" "}
          <C>adamw_step(p, g, m, v, t, lr, b1=0.9, b2=0.95, eps=1e-8, wd=0.1)</C> with bias correction and decoupled decay,
          returning <C>(p, m, v)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lr_schedule(step, peak, warmup, total, floor=0.1):
    return peak

def clip_grads(grads, max_norm):
    return grads, 0.0

def adamw_step(p, g, m, v, t, lr, b1=0.9, b2=0.95, eps=1e-8, wd=0.1):
    return p - lr * g, m, v
`,
        solution: OPT,
        tests: [
          { name: "schedule and clip", code: `s = [lr_schedule(i, 2.0, 4, 10) for i in range(11)]
assert np.allclose(s[:4], [0.5, 1.0, 1.5, 2.0]) and abs(s[7] - 1.1) < 1e-12 and abs(s[10] - 0.2) < 1e-12 and isinstance(s[7], float)
assert abs(lr_schedule(20, 2.0, 4, 10) - 0.2) < 1e-12
g, n = clip_grads([np.array([3.0, 0.0]), np.array([[4.0]])], 1.0); assert abs(n - 5) < 1e-12 and np.allclose(g[0], [0.6, 0]) and np.allclose(g[1], [[0.8]])
g, n = clip_grads([np.array([0.3])], 1.0); assert np.allclose(g[0], [0.3]) and abs(n - 0.3) < 1e-12` },
          { name: "adamw", code: `p, m, v = adamw_step(np.array([1.0, -1.0]), np.array([-2.0, 0.5]), 0.0, 0.0, 1, 0.1, wd=0.0)
assert np.allclose(p, [1.1, -1.1]) and np.allclose(m, [-0.2, 0.05]) and np.allclose(v, [0.2, 0.0125])
rng = np.random.default_rng(0); p0 = rng.standard_normal(4); p, m, v = p0.copy(), np.zeros(4), np.zeros(4); P, Mm, Vv = p0.copy(), np.zeros(4), np.zeros(4)
for t in range(1, 6):
    g = rng.standard_normal(4); p, m, v = adamw_step(p, g, m, v, t, 0.01)
    Mm = 0.9 * Mm + 0.1 * g; Vv = 0.95 * Vv + 0.05 * g * g; P = P - 0.01 * (Mm / (1 - 0.9 ** t) / (np.sqrt(Vv / (1 - 0.95 ** t)) + 1e-8) + 0.1 * P)
assert np.allclose(p, P)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_batch(data, B, T, rng)</C>, drawing B start positions with{" "}
          <C>rng.integers(0, len(data) - T, size=B)</C> and returning the B × T inputs and targets;{" "}
          <C>accumulate(grads, counts)</C>, the token-weighted mean of micro-batch gradients; and{" "}
          <C>smooth(losses, beta=0.9)</C>, the bias-corrected exponential moving average as a list.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_batch(data, B, T, rng):
    data = np.asarray(data)
    return data[:T][None].repeat(B, 0), data[:T][None].repeat(B, 0)

def accumulate(grads, counts):
    return sum(grads) / len(grads)

def smooth(losses, beta=0.9):
    return list(losses)
`,
        solution: DATA,
        tests: [
          { name: "batch", code: `data = np.arange(100) * 3; x, y = sample_batch(data, 5, 7, np.random.default_rng(1))
starts = np.random.default_rng(1).integers(0, 93, size=5)
assert x.shape == (5, 7) and np.all(y - x == 3) and np.array_equal(x[:, 0], data[starts])
x, y = sample_batch(np.arange(5), 50, 4, np.random.default_rng(2)); assert y.max() == 4 and x.min() == 0` },
          { name: "accumulate and smooth", code: `assert np.allclose(accumulate([np.array([1.0, 0.0]), np.array([5.0, 2.0])], [100, 300]), [4.0, 1.5])
assert np.allclose(accumulate([np.array([1.0]), np.array([3.0])], [8, 8]), [2.0])
s = smooth([2.0, 1.0, 1.0], 0.5); assert np.allclose(s, [2.0, 4 / 3, 8 / 7]) and isinstance(s, list)
assert np.allclose(smooth([5.0] * 30), 5.0)` },
        ],
      },
    },
    {
      key: "halflife",
      rung: "stretch",
      prompt: <p>With a constant learning rate of 10⁻³ and weight decay 0.1, the decay term alone multiplies every weight by (1 − ηλ) each step. After how many steps has it halved a weight? Give one decimal.</p>,
      answer: { kind: "numeric", value: 6931.1, tolerance: 0.06 },
    },
  ],

  glimpse: (
    <>
      <p>
        A training run is bought in FLOPs. Next we count them: the parameters of each part of a GPT, and the roughly 6N
        floating-point operations per token that training costs.
      </p>
    </>
  ),
};
