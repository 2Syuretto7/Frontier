import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckpointPlanViz } from "@/components/viz/CheckpointPlanViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch
from torch.utils.checkpoint import checkpoint, checkpoint_sequential

class Block(torch.nn.Module):
    def forward(self, x):
        return x + self.mlp(self.norm(x))

class Model(torch.nn.Module):
    def forward(self, x):
        for blk in self.blocks:
            # keep only blk's input; rerun blk's forward during backward
            x = checkpoint(blk, x, use_reentrant=False)
        return self.head(x)

# or split an nn.Sequential into segments, checkpointing each segment's input
y = checkpoint_sequential(model.layers, segments=8, input=x, use_reentrant=False)

# selective: save matmul outputs, recompute cheap elementwise ops and attention scores
from torch.utils.checkpoint import create_selective_checkpoint_contexts, CheckpointPolicy`;

const CKPT = `import math
import numpy as np

def layer(w, x):
    return np.tanh(w * x)

def layer_back(w, x, g):
    d = g * (1 - np.tanh(w * x) ** 2)
    return d * w, float(np.sum(d * x))

def grads(ws, x, every):
    n, ckpt, h, calls = len(ws), {}, x, 0
    for i, w in enumerate(ws):
        if i % every == 0:
            ckpt[i] = h
        h, calls = layer(w, h), calls + 1
    g, gw, peak = np.ones_like(h), [0.0] * n, len(ckpt)
    for s in sorted(ckpt, reverse=True):
        inputs = [ckpt[s]]
        for i in range(s, min(s + every, n) - 1):
            inputs.append(layer(ws[i], inputs[-1]))
            calls += 1
        peak = max(peak, len(ckpt) + len(inputs) - 1)
        for i in reversed(range(s, s + len(inputs))):
            g, gw[i] = layer_back(ws[i], inputs[i - s], g)
    return gw, calls, peak

def plan(n, every):
    return math.ceil(n / every) + min(every, n) - 1, n - math.ceil(n / every)

def best_every(n):
    return min(range(1, n + 1), key=lambda k: (plan(n, k)[0], k))`;

const BUDGET = `def layer_bytes(s, b, h, a, mode='none'):
    if mode == 'full':
        return 2 * s * b * h
    if mode == 'selective':
        return 34 * s * b * h
    return s * b * h * (34 + 5 * a * s / h)

def total_gb(L, s, b, h, a, mode='none'):
    total = L * layer_bytes(s, b, h, a, mode)
    if mode == 'full':
        total += layer_bytes(s, b, h, a)
    return total / 1e9

def max_batch(L, s, h, a, mode, budget_gb):
    b = 0
    while total_gb(L, s, b + 1, h, a, mode) <= budget_gb:
        b += 1
    return b`;

export const lesson: LessonContent = {
  id: "e6.4.3",
  minutes: 45,
  links: {
    requires: ["e6.4.2"],
    revisits: ["e5.1.2"],
    foreshadows: ["e6.4.4"],
  },

  puzzle: (
    <>
      <p>
        A 32-layer transformer with sequence length 2048 runs out of memory at batch size 2 on an 80 GB GPU, although its
        weights and optimiser state take only 20 GB. The rest is activations: every intermediate tensor the forward pass
        produced and the backward pass will need. Wrapping each block in one function call lets the same GPU run batch size
        25, at the cost of about a third more compute. What is being thrown away, and why is this the right trade?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The backward pass of a layer needs that layer&apos;s input, and often several of its intermediates. Storing all of
        them for every layer makes activation memory grow with depth. But any activation can be recomputed from an earlier
        one by running the forward pass again. Activation checkpointing keeps only a few tensors, the checkpoints, and during
        the backward pass reruns each segment&apos;s forward from its checkpoint just before it is needed. Memory then
        depends on the number of checkpoints plus one segment, and the cost is roughly one extra forward pass.
      </p>
      <CheckpointPlanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="checkpointing">
        <p>
          <C>checkpoint(f, x)</C> runs f without saving its intermediates for backward, keeping only x (and the random
          state, so dropout masks repeat). When the gradient reaches its output, it reruns f on x with recording on and
          backpropagates through the recomputed graph. Checkpointing every transformer block keeps one tensor per block;
          selective checkpointing keeps the expensive matmul outputs and recomputes only cheap or large intermediates such
          as attention scores.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="square-root checkpointing">
        <p>
          For a chain of n layers with equal activation sizes, checkpointing every k-th layer input stores at most{" "}
          <C>⌈n/k⌉ + k − 1</C> layer inputs at once and recomputes <C>n − ⌈n/k⌉</C> layer forwards. Taking k near √n
          gives peak memory about 2√n, compared with n without checkpointing, for fewer than n extra layer forwards.
        </p>
      </Theorem>
      <Proof>
        <p>
          The forward pass keeps the ⌈n/k⌉ checkpoints. The backward pass handles segments from the last to the first; for
          a segment starting at s it recomputes the inputs of layers s + 1 to s + k − 1 from the checkpoint at s, which is
          k − 1 more tensors, and backpropagates through them before moving on, so at most ⌈n/k⌉ + k − 1 are held. Every
          layer input that is not a checkpoint is recomputed exactly once, n − ⌈n/k⌉ forwards. The function{" "}
          <C>⌈n/k⌉ + k − 1</C> is minimised near k = √n, where it is about 2√n − 1. Since the gradients are computed from
          exactly the same inputs, they are identical to those without checkpointing.
        </p>
        <Code>{CKPT}</Code>
      </Proof>

      <Example title="a transformer's activation budget">
        <p>
          For a transformer layer with sequence length s, batch b, hidden size h and a heads, in sixteen-bit precision,
          Korthikanti and others count about <C>s·b·h·(34 + 5·a·s/h)</C> bytes of activations; the second term is the
          attention scores and their softmax and dropout. Selective recomputation of attention removes that term. Full
          checkpointing stores only the 2·s·b·h-byte input of each layer, plus one layer&apos;s full activations while it is
          being recomputed.
        </p>
        <Code>{BUDGET}</Code>
      </Example>

      <Remark title="costs and pitfalls">
        <p>
          A forward pass is about one third of forward plus backward, so full checkpointing adds about 33% compute;
          selective recomputation of attention adds a few percent. Recomputation must reproduce the original forward: random
          operations need the saved generator state, which <C>checkpoint</C> handles, and modules that change state in their
          forward, such as batch norm&apos;s running statistics, update twice unless guarded. With flash attention, scores are
          never stored anyway, so the 5as/h term is already gone.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "peak",
      rung: "check",
      prompt: <p>For a chain of 100 equal layers, what is the smallest possible peak number of stored layer inputs with checkpointing every k layers?</p>,
      answer: { kind: "numeric", value: 19, tolerance: 0.1 },
    },
    {
      key: "over",
      rung: "check",
      prompt: <p>If backward costs twice a forward, by what fraction does full checkpointing (one extra forward) increase compute? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.33, tolerance: 0.006 },
    },
    {
      key: "bn",
      rung: "apply",
      prompt: <p>A checkpointed block contains batch normalisation in training mode. What goes wrong?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its running mean and variance are updated twice per step, once in the forward pass and again in the recomputation, unless the update is skipped during recomputation",
          "Its gradients are wrong because the batch statistics change",
          "Checkpointing cannot be applied to modules with buffers",
          "The recomputed output differs because the weights have already been updated",
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

def layer(w, x):
    return np.tanh(w * x)

def layer_back(w, x, g):
    d = g * (1 - np.tanh(w * x) ** 2)
    return d * w, float(np.sum(d * x))

def grads(ws, x, every):
    n, ckpt, h, calls = len(ws), {}, x, 0
    for i, w in enumerate(ws):
        if i % every == 0:
            ckpt[i] = h
        h, calls = layer(w, h), calls + 1
    g, gw, peak = np.ones_like(h), [0.0] * n, len(ckpt)
    for s in sorted(ckpt, reverse=True):
        inputs = [ckpt[s]]
        for i in range(s, min(s + every, n) - 1):
            inputs.append(layer(ws[i], inputs[-1]))
            calls += 1
        peak = max(peak, len(ckpt) + len(inputs) - 1)
        for i in reversed(range(s, s + len(inputs))):
            g, gw[i] = layer_back(ws[i], inputs[i - s], g)
    return gw, calls, peak

def plan(n, every):
    return math.ceil(n / every) + min(every, n) - 1, n - math.ceil(n / every)

def best_every(n):
    return min(range(1, n + 1), key=lambda k: (plan(n, k)[0], k))

ws, x = [0.9, 1.1, -0.7, 1.3, 0.8, -1.2], np.array([0.5, -0.3])
full, c1, p1 = grads(ws, x, 1); part, c3, p3 = grads(ws, x, 3); print(np.allclose(full, part), c1, p1, c3, p3, grads(ws, x, 6)[1:])
print(plan(16, 4), plan(16, 1), plan(16, 16), best_every(16), best_every(10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 6 6 10 4 (11, 6)\n(7, 12) (16, 0) (16, 15) 4 2",
          "True 6 6 10 4 (11, 1)\n(7, 12) (16, 0) (16, 15) 4 2",
          "False 6 6 10 4 (11, 6)\n(7, 12) (16, 0) (16, 15) 4 2",
          "True 6 6 8 4 (11, 6)\n(7, 12) (16, 0) (1, 15) 4 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def layer_bytes(s, b, h, a, mode='none'):
    if mode == 'full':
        return 2 * s * b * h
    if mode == 'selective':
        return 34 * s * b * h
    return s * b * h * (34 + 5 * a * s / h)

def total_gb(L, s, b, h, a, mode='none'):
    total = L * layer_bytes(s, b, h, a, mode)
    if mode == 'full':
        total += layer_bytes(s, b, h, a)
    return total / 1e9

def max_batch(L, s, h, a, mode, budget_gb):
    b = 0
    while total_gb(L, s, b + 1, h, a, mode) <= budget_gb:
        b += 1
    return b

print(layer_bytes(1, 1, 1, 1, 'full'), layer_bytes(2048, 1, 4096, 32, 'selective') / 1e6, round(layer_bytes(2048, 1, 4096, 32) / 1e6, 1))
print(round(total_gb(32, 2048, 1, 4096, 32), 2), round(total_gb(32, 2048, 1, 4096, 32, 'full'), 2), max_batch(32, 2048, 4096, 32, 'none', 40), max_batch(32, 2048, 4096, 32, 'full', 40))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 285.212672 956.3\n30.6 1.49 1 26",
          "2 285.212672 956.3\n30.6 0.54 1 26",
          "2 285.212672 285.2\n9.13 1.49 4 26",
          "2 285.212672 956.3\n30.6 1.49 1 74",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>layer</C> and <C>layer_back</C>, write <C>grads(ws, x, every)</C>, which checkpoints every
          every-th layer input, recomputes each segment in the backward pass and returns the weight gradients of the sum of
          the output, the number of layer forwards and the peak number of stored inputs, as well as <C>plan(n, every)</C>{" "}
          and <C>best_every(n)</C>, the interval with the smallest peak, the smallest such interval on a tie.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def layer(w, x):
    return np.tanh(w * x)

def layer_back(w, x, g):
    d = g * (1 - np.tanh(w * x) ** 2)
    return d * w, float(np.sum(d * x))

def grads(ws, x, every):
    return [0.0] * len(ws), len(ws), len(ws)

def plan(n, every):
    return n, 0

def best_every(n):
    return 1
`,
        solution: CKPT,
        tests: [
          { name: "grads", code: `ws, x = [0.6, -1.4, 0.9, 1.2, -0.5, 0.7, 1.1], np.array([0.4, -0.8, 0.1])
ref, c1, p1 = grads(ws, x, 1); assert (c1, p1) == (7, 7)
def f(w):
    h = x
    for wi in w:
        h = layer(wi, h)
    return np.sum(h)
num = []
for i in range(len(ws)):
    up, dn = list(ws), list(ws); up[i] += 1e-6; dn[i] -= 1e-6
    num.append((f(up) - f(dn)) / 2e-6)
assert np.allclose(ref, num, atol=1e-6)
for k in [2, 3, 7]:
    g, c, p = grads(ws, x, k); assert np.allclose(g, ref) and (p, c - 7) == plan(7, k)` },
          { name: "plan", code: `assert plan(16, 4) == (7, 12) and plan(10, 3) == (6, 6) and plan(5, 8) == (5, 4) and best_every(16) == 4 and best_every(100) == 10 and best_every(1) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_bytes(s, b, h, a, mode=&apos;none&apos;)</C> for modes &apos;none&apos;, &apos;selective&apos; and
          &apos;full&apos; as in the example, <C>total_gb(L, s, b, h, a, mode=&apos;none&apos;)</C> for L layers in
          gigabytes (adding one full layer when mode is &apos;full&apos;), and <C>max_batch(L, s, h, a, mode, budget_gb)</C>,
          the largest batch that fits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def layer_bytes(s, b, h, a, mode='none'):
    return 0

def total_gb(L, s, b, h, a, mode='none'):
    return 0.0

def max_batch(L, s, h, a, mode, budget_gb):
    return 0
`,
        solution: BUDGET,
        tests: [
          { name: "bytes", code: `assert layer_bytes(1024, 2, 1024, 16) == 1024 * 2 * 1024 * (34 + 80) and layer_bytes(1024, 2, 1024, 16, 'selective') == 34 * 1024 * 2 * 1024 and layer_bytes(10, 3, 7, 1, 'full') == 420
assert abs(total_gb(24, 1024, 2, 1024, 16) - 24 * 1024 * 2 * 1024 * 114 / 1e9) < 1e-9 and abs(total_gb(24, 1024, 2, 1024, 16, 'full') - (24 * 2 + 114) * 1024 * 2 * 1024 / 1e9) < 1e-9` },
          { name: "batch", code: `assert max_batch(24, 1024, 1024, 16, 'none', 10) == 3 and max_batch(24, 1024, 1024, 16, 'selective', 10) == 11 and max_batch(24, 1024, 1024, 16, 'full', 10) == 58 and max_batch(24, 1024, 1024, 16, 'none', 1) == 0` },
        ],
      },
    },
    {
      key: "sel",
      rung: "stretch",
      prompt: (
        <p>
          For s = 4096, h = 4096 and a = 32, what fraction of a layer&apos;s activation bytes does selective recomputation of
          attention remove? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.825, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Activations are one line of a GPU&apos;s memory budget. The next lesson adds up the others, weights, gradients,
        optimiser state, workspace and fragmentation, and asks which knob to turn first when a model does not fit.
      </p>
    </>
  ),
};
