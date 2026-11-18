import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NanSpreadViz } from "@/components/viz/NanSpreadViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

def nan_hook(name):
    def hook(module, inputs, output):
        out = output if isinstance(output, torch.Tensor) else output[0]
        if not torch.isfinite(out).all():
            raise RuntimeError(f"first non-finite output in {name}")
    return hook

for name, m in model.named_modules():
    m.register_forward_hook(nan_hook(name))

with torch.autograd.detect_anomaly():      # backward: names the forward op whose gradient went bad
    loss = model(batch).loss
    loss.backward()

# in production, keep it cheap: check once per step, skip the update, keep the batch
if not torch.isfinite(loss):
    torch.save({"batch": batch, "step": step}, f"bad_{step}.pt")
    opt.zero_grad(set_to_none=True)          # skip; do not let NaN reach the weights
# JAX: jax.config.update("jax_debug_nans", True) re-runs the failing op un-jitted and raises`;

const HUNT = `import math
import numpy as np

def run_with_checks(layers, x):
    report, first = [], None
    with np.errstate(all='ignore'):
        for name, fn in layers:
            x = fn(x)
            bad = int(np.size(x) - np.count_nonzero(np.isfinite(x)))
            report.append((name, bad))
            if bad and first is None:
                first = name
    return x, first, report

def first_bad_step(losses):
    for i, loss in enumerate(losses):
        if not math.isfinite(loss):
            return i
    return None

def bisect_first(check, lo, hi):
    while lo < hi:
        mid = (lo + hi) // 2
        if check(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo`;

const SAFE = `import numpy as np

def log_softmax(z):
    m = np.max(z, axis=-1, keepdims=True)
    return z - m - np.log(np.sum(np.exp(z - m), axis=-1, keepdims=True))

def masked_mean(x, mask):
    total = np.sum(np.where(mask, x, 0.0))
    return float(total / max(int(np.sum(mask)), 1))

def safe_sqrt(x):
    pos = x > 0
    xs = np.where(pos, x, 1.0)
    return np.where(pos, np.sqrt(xs), 0.0), np.where(pos, 0.5 / np.sqrt(xs), 0.0)`;

export const lesson: LessonContent = {
  id: "e6.6.1",
  minutes: 45,
  links: {
    requires: ["e6.5.4"],
    revisits: ["e6.4.1", "e4.2.3"],
    foreshadows: ["e6.6.2", "m14.6.2", "e13.3.3"],
  },

  puzzle: (
    <>
      <p>
        At step 41,212 of a long run the loss becomes NaN, and stays NaN. Every weight in the checkpoint saved at step
        42,000 is NaN, so the last 800 steps are lost and there is no clue in them. The NaN could have come from a bad
        batch, a division by zero in a normalisation, a log of zero, an overflow in a mixed-precision matmul, or a learning
        rate spike. Where do you look, and how do you find the first operation that produced it rather than the thousands
        it spread to?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        NaN is contagious: almost every operation with a NaN input has a NaN output, and a matrix multiply turns one bad
        number into a whole bad layer. So the place you notice it, the loss, is nearly never the place it began. The hunt
        has three parts: stop it spreading into the weights, by checking each step and skipping bad updates; reproduce the
        failing step from a checkpoint and the saved batch; then run that step with a check after every operation, so the
        first one to produce a non-finite value names itself. If the failure needs many steps to appear, bisect over steps
        from the last good checkpoint.
      </p>
      <NanSpreadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sources of non-finite values">
        <p>
          In IEEE arithmetic, overflow gives ±inf (exp of a large number, a float16 matmul past 65504), and NaN comes from
          undefined operations: 0/0, inf − inf, 0 × inf, log or sqrt of a negative number, and any operation on a NaN.
          Gradients add their own: the derivative of sqrt or of a norm at zero is infinite, and{" "}
          <C>where(x &gt; 0, sqrt(x), 0)</C> still backpropagates inf × 0 = NaN through the branch it did not choose.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="bisection finds the first bad step">
        <p>
          If a run is deterministic and reproducible from checkpoints, and once non-finite it stays non-finite, then the
          first bad step in an interval of length L is found with ⌈log₂ L⌉ replays of the check.
        </p>
      </Theorem>
      <Proof>
        <p>
          The predicate &quot;the state after step s is non-finite&quot; is false up to some first step s* and true after
          it, so it is monotone. Bisection keeps an interval [lo, hi] with the predicate true at hi and false before lo;
          testing the midpoint halves the interval, and after ⌈log₂ L⌉ tests it has one element, s*. Each test replays from
          the nearest earlier checkpoint, which is why checkpoints and the data order must make replay exact, as an earlier
          lesson arranged. Within the step, running each layer with a finiteness check names the first operation.
        </p>
        <Code>{HUNT}</Code>
      </Proof>

      <Example title="writing operations that cannot produce NaN">
        <p>
          Subtract the maximum before exponentiating. Use <C>where</C>, not multiplication by a mask, to remove values,
          since NaN × 0 is NaN. Divide by a count clamped to at least one, so an empty mask gives zero, not 0/0. For sqrt,
          norm and log near zero, use the double-where trick: replace the unsafe inputs with a safe value before the
          operation, then select, so that neither branch&apos;s value nor its gradient is ever computed at the bad point.
        </p>
        <Code>{SAFE}</Code>
      </Example>

      <Remark title="usual suspects, in order">
        <p>
          A corrupt or extreme batch (save it when the loss is bad); a learning-rate or loss spike, often from attention
          logits growing without bound; float16 overflow without loss scaling; division by a variance or norm that can be
          zero; log of a probability that underflowed; and uninitialised memory from <C>torch.empty</C>. Track the gradient
          norm every step: it usually explodes some steps before anything is NaN.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bisect",
      rung: "check",
      prompt: <p>The last good checkpoint is at step 40,000 and the loss is NaN at step 42,048. How many replays does bisection need, at most, to find the first bad step?</p>,
      answer: { kind: "numeric", value: 11, tolerance: 0.1 },
    },
    {
      key: "spread",
      rung: "check",
      prompt: <p>One input of a 4096-wide linear layer is NaN. How many of the layer&apos;s 4096 outputs are NaN?</p>,
      answer: { kind: "numeric", value: 4096, tolerance: 0.1 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>Padding positions in an attention score matrix hold NaN, and the code computes <C>scores * mask</C> before the softmax. What happens?</p>,
      answer: {
        kind: "choice",
        options: [
          "The NaNs survive, because NaN × 0 is NaN, and the softmax makes every score in those rows NaN; the fix is where(mask, scores, -inf) or a large negative value",
          "The mask zeroes them, so the softmax is correct",
          "The softmax ignores NaN entries",
          "Only the masked positions become NaN",
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
import numpy as np

def run_with_checks(layers, x):
    report, first = [], None
    with np.errstate(all='ignore'):
        for name, fn in layers:
            x = fn(x)
            bad = int(np.size(x) - np.count_nonzero(np.isfinite(x)))
            report.append((name, bad))
            if bad and first is None:
                first = name
    return x, first, report

def first_bad_step(losses):
    for i, loss in enumerate(losses):
        if not math.isfinite(loss):
            return i
    return None

def bisect_first(check, lo, hi):
    while lo < hi:
        mid = (lo + hi) // 2
        if check(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo

layers = [('scale', lambda x: x * 1000), ('exp', np.exp), ('norm', lambda x: x / x.sum()), ('log', np.log)]
out, first, report = run_with_checks(layers, np.array([0.05, 0.1], dtype=np.float32)); print(first, report, out.tolist())
out, first, report = run_with_checks(layers[1:], np.array([-800.0, -900.0])); print(first, report)
print(first_bad_step([2.3, 1.9, float('inf'), float('nan')]), first_bad_step([1.0]), bisect_first(lambda s: s * s > 50, 0, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "exp [('scale', 0), ('exp', 1), ('norm', 1), ('log', 2)] [-inf, nan]\nnorm [('exp', 0), ('norm', 2), ('log', 2)]\n2 None 8",
          "exp [('scale', 0), ('exp', 1), ('norm', 2), ('log', 2)] [nan, nan]\nnorm [('exp', 0), ('norm', 2), ('log', 2)]\n2 None 8",
          "exp [('scale', 0), ('exp', 1), ('norm', 1), ('log', 2)] [-inf, nan]\nexp [('exp', 2), ('norm', 2), ('log', 2)]\n2 None 8",
          "exp [('scale', 0), ('exp', 1), ('norm', 1), ('log', 2)] [-inf, nan]\nnorm [('exp', 0), ('norm', 2), ('log', 2)]\n3 None 7",
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

def log_softmax(z):
    m = np.max(z, axis=-1, keepdims=True)
    return z - m - np.log(np.sum(np.exp(z - m), axis=-1, keepdims=True))

def masked_mean(x, mask):
    total = np.sum(np.where(mask, x, 0.0))
    return float(total / max(int(np.sum(mask)), 1))

def safe_sqrt(x):
    pos = x > 0
    xs = np.where(pos, x, 1.0)
    return np.where(pos, np.sqrt(xs), 0.0), np.where(pos, 0.5 / np.sqrt(xs), 0.0)

print(log_softmax(np.array([1000.0, 1000.0])).tolist(), masked_mean(np.array([np.nan, 2.0, 4.0]), np.array([False, True, True])), masked_mean(np.ones(2), np.zeros(2, bool)))
y, g = safe_sqrt(np.array([4.0, 0.0, -1.0])); print(y.tolist(), g.tolist(), np.nan * 0.0, np.where(False, np.nan, 0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.6931471805599453, -0.6931471805599453] 3.0 0.0\n[2.0, 0.0, 0.0] [0.25, 0.0, 0.0] nan 0.0",
          "[nan, nan] 3.0 0.0\n[2.0, 0.0, 0.0] [0.25, 0.0, 0.0] nan 0.0",
          "[-0.6931471805599453, -0.6931471805599453] nan nan\n[2.0, 0.0, 0.0] [0.25, 0.0, 0.0] nan 0.0",
          "[-0.6931471805599453, -0.6931471805599453] 3.0 0.0\n[2.0, 0.0, nan] [0.25, inf, nan] 0.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run_with_checks(layers, x)</C>, which applies named layers in order with floating-point warnings
          suppressed and returns the output, the name of the first layer whose output has a non-finite value (or None) and a
          report of (name, number of non-finite values) per layer, <C>first_bad_step(losses)</C>, and{" "}
          <C>bisect_first(check, lo, hi)</C>, the smallest s in [lo, hi] with check(s) true for a monotone check.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def run_with_checks(layers, x):
    for name, fn in layers:
        x = fn(x)
    return x, None, []

def first_bad_step(losses):
    return None

def bisect_first(check, lo, hi):
    return hi
`,
        solution: HUNT,
        tests: [
          { name: "layers", code: `layers = [('a', lambda x: x - 1.0), ('b', np.sqrt), ('c', lambda x: x * 0.0), ('d', lambda x: x + 1.0)]
out, first, rep = run_with_checks(layers, np.array([4.0, 0.5, 1.0]))
assert first == 'b' and rep == [('a', 0), ('b', 1), ('c', 1), ('d', 1)] and out[0] == 1.0 and np.isnan(out[1])
assert run_with_checks(layers[:1], np.ones(2))[1:] == (None, [('a', 0)])` },
          { name: "search", code: `assert first_bad_step([1.0, float('-inf'), 2.0]) == 1 and first_bad_step([]) is None and first_bad_step([0.5, 0.25]) is None
calls = []
def check(s):
    calls.append(s)
    return s >= 41212
assert bisect_first(check, 40000, 42048) == 41212 and len(calls) <= 11 and bisect_first(lambda s: True, 3, 9) == 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_softmax(z)</C> along the last axis, stable for large inputs, <C>masked_mean(x, mask)</C>, which
          ignores masked-out values even if they are NaN and returns 0.0 for an empty mask, and <C>safe_sqrt(x)</C>,
          returning sqrt(x) and its derivative, both 0 where x ≤ 0, without ever evaluating either at such points.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_softmax(z):
    return np.log(np.exp(z) / np.sum(np.exp(z), axis=-1, keepdims=True))

def masked_mean(x, mask):
    return float(np.mean(x * mask))

def safe_sqrt(x):
    return np.sqrt(x), 0.5 / np.sqrt(x)
`,
        solution: SAFE,
        tests: [
          { name: "softmax", code: `z = np.array([[800.0, 799.0, -800.0], [0.0, 0.0, 0.0]]); out = log_softmax(z)
assert np.all(np.isfinite(out)) and np.allclose(out[1], -np.log(3)) and np.allclose(np.exp(out).sum(axis=1), 1.0) and abs(out[0, 0] + np.log1p(np.exp(-1.0))) < 1e-12` },
          { name: "masks", code: `assert masked_mean(np.array([np.nan, 1.0, np.inf, 5.0]), np.array([False, True, False, True])) == 3.0 and masked_mean(np.array([np.nan]), np.array([False])) == 0.0
with np.errstate(all='raise'):
    y, g = safe_sqrt(np.array([9.0, 0.0, -4.0, 0.25]))
assert y.tolist() == [3.0, 0.0, 0.0, 0.5] and g.tolist() == [1 / 6, 0.0, 0.0, 1.0]` },
        ],
      },
    },
    {
      key: "fp16",
      rung: "stretch",
      prompt: (
        <p>
          A dot product of length 4096 is accumulated in float16, and every term equals 20. Ignoring rounding, at what
          length does the running sum first exceed 65504, the largest finite float16 value?
        </p>
      ),
      answer: { kind: "numeric", value: 3276, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        A NaN at least announces itself. The next lesson is about bugs that do not: a model that trains, reaches a
        plausible loss, and is quietly wrong.
      </p>
    </>
  ),
};
