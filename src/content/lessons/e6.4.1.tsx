import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LossScaleViz } from "@/components/viz/LossScaleViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

model = model.cuda()                               # parameters stay float32: the master weights
opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
scaler = torch.amp.GradScaler("cuda")              # needed for float16, not for bfloat16

for x, y in loader:
    with torch.autocast("cuda", dtype=torch.float16):
        loss = loss_fn(model(x), y)                # matmuls in fp16, reductions and softmax in fp32
    scaler.scale(loss).backward()                  # gradients of loss * S
    scaler.unscale_(opt)                           # divide by S, record whether any inf or nan appeared
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    scaler.step(opt)                               # skipped if an inf was found
    scaler.update()                                # halve S after an overflow, double it after 2000 clean steps
    opt.zero_grad(set_to_none=True)`;

const ROUND = `import numpy as np

def to_bf16(x):
    u = np.asarray(x, dtype=np.float32).view(np.uint32)
    u = (u + np.uint32(0x7FFF) + ((u >> np.uint32(16)) & np.uint32(1))) & np.uint32(0xFFFF0000)
    return u.view(np.float32)

def cast(x, kind):
    if kind == 'bf16':
        return to_bf16(x)
    with np.errstate(over='ignore'):
        return np.asarray(x, dtype={'fp16': np.float16, 'fp32': np.float32}[kind]).astype(np.float32)

def update_run(w0, delta, steps, kind, master=False):
    w32, w = np.float32(w0), cast(w0, kind)
    for _ in range(steps):
        if master:
            w32 = np.float32(w32 + np.float32(delta))
            w = cast(w32, kind)
        else:
            w = cast(w + cast(delta, kind), kind)
    return float(w)`;

const SCALE = `import numpy as np

def to_fp16(grads, scale):
    with np.errstate(over='ignore'):
        h = (np.asarray(grads, dtype=np.float32) * np.float32(scale)).astype(np.float16)
    lost = int(np.sum((h == 0) & (np.asarray(grads) != 0)))
    return h, lost

def unscale(h, scale):
    g = h.astype(np.float32) / np.float32(scale)
    return g, bool(not np.all(np.isfinite(g)))

def scaler_run(grad_batches, scale=2.0 ** 16, growth_interval=2):
    scales, skipped, good = [], 0, 0
    for grads in grad_batches:
        h, _ = to_fp16(grads, scale)
        _, found_inf = unscale(h, scale)
        scales.append(scale)
        if found_inf:
            scale, skipped, good = scale / 2, skipped + 1, 0
        else:
            good += 1
            if good == growth_interval:
                scale, good = scale * 2, 0
    return scales, skipped`;

export const lesson: LessonContent = {
  id: "e6.4.1",
  minutes: 50,
  links: {
    requires: ["e6.3.3"],
    revisits: ["m11.1.4", "e3.1.2"],
    foreshadows: ["e6.4.4", "e6.6.1"],
  },

  puzzle: (
    <>
      <p>
        Switching a model&apos;s matrix multiplies from float32 to sixteen-bit formats makes each step two to eight times
        faster on modern GPUs and halves activation memory. Done naively, the float16 run stops learning within a few hundred
        steps: the loss flattens, and inspection shows that most gradients are exactly zero and the weights have not moved
        since step 50. A bfloat16 run with the same code learns, but slightly worse. What is being lost, and where must the
        extra bits go?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Sixteen-bit formats lose in two different ways. Float16 has 10 fraction bits but only 5 exponent bits, so its range
        runs out: gradients smaller than about 6 × 10⁻⁸ become zero. Bfloat16 keeps float32&apos;s 8 exponent bits and so its
        range, but has only 7 fraction bits, so it rounds coarsely: adding 10⁻⁴ to 1 does nothing. Mixed precision answers
        each loss with a fix. Multiply the loss by a large scale so gradients land in float16&apos;s range, and keep a float32
        master copy of the weights so small updates accumulate. Do the expensive matrix products in sixteen bits and the
        sensitive reductions in float32.
      </p>
      <LossScaleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="autocast and master weights">
        <p>
          Inside <C>torch.autocast</C>, operations on an allow list (matrix multiplies, convolutions) cast their inputs to
          the low-precision type, and operations on a deny list (softmax, log, norms, losses, large sums) run in float32.
          Parameters stay float32 and the optimiser updates them in float32; only the copies used in the forward pass are
          cast. A model converted wholesale with <C>.half()</C> has no master weights.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="stagnation">
        <p>
          In a format with p fraction bits and round-to-nearest, if <C>2^e ≤ |w| &lt; 2^(e+1)</C> and{" "}
          <C>|δ| &lt; 2^(e − p − 2)</C>, then w + δ rounds back to w. At w = 1 this means every update smaller than 2⁻¹²
          ≈ 2.4 × 10⁻⁴ is lost in float16 (p = 10), and every update smaller than 2⁻⁹ ≈ 2.0 × 10⁻³ in bfloat16 (p = 7).
        </p>
      </Theorem>
      <Proof>
        <p>
          Numbers in [2^e, 2^(e+1)) are spaced 2^(e − p) apart, and those just below 2^e are spaced 2^(e − p − 1) apart, so
          both neighbours of w are at least 2^(e − p − 1) away. The value w + δ is then closer to w than to either neighbour
          whenever |δ| is less than half of that, 2^(e − p − 2), and rounds to w. Any number of such updates leaves w
          unchanged. A float32 master weight has p = 23, so it absorbs them, and the low-precision copy moves once the
          accumulated change passes half a spacing. The function below rounds float32 to bfloat16 by adding just under half
          a unit of the 16 dropped bits, plus one more when the kept part is odd (ties to even), and clearing those bits.
        </p>
        <Code>{ROUND}</Code>
      </Proof>

      <Example title="dynamic loss scaling">
        <p>
          Multiplying the loss by S multiplies every gradient by S, which by linearity of the backward pass changes nothing
          but where the values sit on the exponent scale. Before the optimiser step the gradients are divided by S in float32.
          If any is infinite, the step is skipped and S is halved; after a run of clean steps S is doubled, so S hovers just
          below the overflow point. bfloat16 does not need this.
        </p>
        <Code>{SCALE}</Code>
      </Example>

      <Remark title="choosing a format">
        <p>
          On GPUs that support it, bfloat16 autocast without a scaler is the usual default for training, since it cannot
          overflow where float32 would not. Float16 with a scaler gives three more fraction bits. FP8 training, covered with
          the formats themselves in an earlier lesson, scales per tensor or per block and keeps even more of the computation
          in higher precision. Keep in float32: master weights, optimiser moments, loss values, softmax and normalisation
          statistics, and any long sum.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "spacing",
      rung: "check",
      prompt: <p>What is the spacing between float16 numbers in [1024, 2048)? Float16 has 10 fraction bits.</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: <p>The largest float16 is 65504. A gradient&apos;s largest entry is 0.01. What is the largest power of two loss scale that does not overflow it? Give the exponent.</p>,
      answer: { kind: "numeric", value: 22, tolerance: 0.1 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Why does training a model converted wholesale with <C>model.half()</C> often stall even when gradients are scaled?</p>,
      answer: {
        kind: "choice",
        options: [
          "The weights themselves are float16, so updates smaller than half the spacing around each weight round away; mixed precision keeps float32 master weights for this reason",
          "Float16 matrix multiplies are slower than float32 ones",
          "Loss scaling only works with bfloat16",
          "The optimiser cannot read float16 gradients",
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

def to_bf16(x):
    u = np.asarray(x, dtype=np.float32).view(np.uint32)
    u = (u + np.uint32(0x7FFF) + ((u >> np.uint32(16)) & np.uint32(1))) & np.uint32(0xFFFF0000)
    return u.view(np.float32)

def cast(x, kind):
    if kind == 'bf16':
        return to_bf16(x)
    with np.errstate(over='ignore'):
        return np.asarray(x, dtype={'fp16': np.float16, 'fp32': np.float32}[kind]).astype(np.float32)

def update_run(w0, delta, steps, kind, master=False):
    w32, w = np.float32(w0), cast(w0, kind)
    for _ in range(steps):
        if master:
            w32 = np.float32(w32 + np.float32(delta))
            w = cast(w32, kind)
        else:
            w = cast(w + cast(delta, kind), kind)
    return float(w)

print(to_bf16([1.0, 3.14159, 1.00390625, 1.01171875]).tolist(), cast(70000.0, 'fp16').tolist(), cast(70000.0, 'bf16').tolist())
print([round(update_run(1.0, 1e-4, 1000, k), 4) for k in ['fp32', 'fp16', 'bf16']], round(update_run(1.0, 1e-4, 1000, 'fp16', master=True), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 3.140625, 1.0, 1.015625] inf 70144.0\n[1.1, 1.0, 1.0] 1.0996",
          "[1.0, 3.140625, 1.0078125, 1.015625] inf 70144.0\n[1.1, 1.0, 1.0] 1.0996",
          "[1.0, 3.140625, 1.0, 1.015625] 65504.0 70144.0\n[1.1, 1.0, 1.0] 1.0996",
          "[1.0, 3.140625, 1.0, 1.015625] inf 70144.0\n[1.1, 1.1, 1.0] 1.1",
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

def to_fp16(grads, scale):
    with np.errstate(over='ignore'):
        h = (np.asarray(grads, dtype=np.float32) * np.float32(scale)).astype(np.float16)
    lost = int(np.sum((h == 0) & (np.asarray(grads) != 0)))
    return h, lost

def unscale(h, scale):
    g = h.astype(np.float32) / np.float32(scale)
    return g, bool(not np.all(np.isfinite(g)))

def scaler_run(grad_batches, scale=2.0 ** 16, growth_interval=2):
    scales, skipped, good = [], 0, 0
    for grads in grad_batches:
        h, _ = to_fp16(grads, scale)
        _, found_inf = unscale(h, scale)
        scales.append(scale)
        if found_inf:
            scale, skipped, good = scale / 2, skipped + 1, 0
        else:
            good += 1
            if good == growth_interval:
                scale, good = scale * 2, 0
    return scales, skipped

h, lost = to_fp16([1e-8, 0.5, 1.0], 1.0); print(h.tolist(), lost, to_fp16([1e-8, 0.5, 1.0], 1024.0)[1])
g, bad = unscale(to_fp16([2.0 ** -10, 2.0], 2.0 ** 16)[0], 2.0 ** 16); print(g.tolist(), bad)
print(scaler_run([[1.0], [1.0], [1.0], [1.0]], 2.0 ** 15), scaler_run([[0.1]] * 3, 2.0 ** 20, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.5, 1.0] 1 0\n[0.0009765625, inf] True\n([32768.0, 32768.0, 65536.0, 32768.0], 1) ([1048576.0, 524288.0, 1048576.0], 2)",
          "[0.0, 0.5, 1.0] 1 1\n[0.0009765625, inf] True\n([32768.0, 32768.0, 65536.0, 32768.0], 1) ([1048576.0, 524288.0, 1048576.0], 2)",
          "[0.0, 0.5, 1.0] 1 0\n[0.0009765625, 2.0] False\n([32768.0, 32768.0, 65536.0, 131072.0], 0) ([1048576.0, 524288.0, 1048576.0], 2)",
          "[0.0, 0.5, 1.0] 1 0\n[0.0009765625, inf] True\n([32768.0, 32768.0, 65536.0, 32768.0], 1) ([1048576.0, 524288.0, 262144.0], 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_bf16(x)</C>, rounding float32 to the nearest bfloat16 with ties to even through the uint32 bit
          pattern, <C>cast(x, kind)</C> for kind &apos;fp16&apos;, &apos;bf16&apos; or &apos;fp32&apos;, returning float32
          values, and <C>update_run(w0, delta, steps, kind, master=False)</C>, which adds delta to a weight held in that
          format steps times, either directly or through a float32 master copy, and returns the low-precision weight.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def to_bf16(x):
    return np.asarray(x, dtype=np.float32)

def cast(x, kind):
    return np.asarray(x, dtype=np.float32)

def update_run(w0, delta, steps, kind, master=False):
    return float(w0 + steps * delta)
`,
        solution: ROUND,
        tests: [
          { name: "round", code: `x = np.array([1.0 + 2.0 ** -8, 1.0 + 3 * 2.0 ** -8, 1.0 + 2.0 ** -9, -2.5e-3, 1e30], dtype=np.float32)
assert to_bf16(x).tolist()[:4] == [1.0, 1.015625, 1.0, float(np.float32(-0.002502441406250))] and abs(to_bf16(x)[4] / 1e30 - 1) < 4e-3 and to_bf16(x).dtype == np.float32
assert cast(1e-8, 'fp16').tolist() == 0.0 and cast(1e-8, 'bf16').tolist() != 0.0 and cast(1 / 3, 'fp32').tolist() == float(np.float32(1 / 3)) and cast(1e5, 'fp16').tolist() == float('inf')` },
          { name: "updates", code: `assert update_run(1.0, 1e-4, 500, 'bf16') == 1.0 and update_run(1.0, 6e-4, 10, 'fp16') == float(np.float16(1.0) + 10 * np.float16(2.0 ** -10))
assert update_run(1.0, 1e-4, 1000, 'bf16', master=True) == 1.1015625
assert abs(update_run(1.0, 1e-4, 1000, 'fp16', master=True) - 1.1) < 1e-3 and update_run(1.0, 1e-4, 1000, 'fp16') == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_fp16(grads, scale)</C>, returning the scaled float16 array and how many nonzero gradients became zero,{" "}
          <C>unscale(h, scale)</C>, returning float32 gradients and whether any is not finite, and{" "}
          <C>scaler_run(grad_batches, scale=2.0 ** 16, growth_interval=2)</C>, returning the scale used at each step and the
          number of skipped steps, halving after an overflow and doubling after growth_interval clean steps in a row.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def to_fp16(grads, scale):
    return np.asarray(grads, dtype=np.float16), 0

def unscale(h, scale):
    return h.astype(np.float32), False

def scaler_run(grad_batches, scale=2.0 ** 16, growth_interval=2):
    return [scale] * len(grad_batches), 0
`,
        solution: SCALE,
        tests: [
          { name: "scale", code: `h, n = to_fp16([1e-9, 2e-8, 3.0, 0.0], 1.0); assert h.dtype == np.float16 and n == 2 and h.tolist()[2] == 3.0
h, n = to_fp16([1e-9, 2e-8, 3.0, 0.0], 2.0 ** 10); assert n == 0 and h.tolist()[2] == 3072.0
g, bad = unscale(h, 2.0 ** 10); assert g.dtype == np.float32 and g[2] == 3.0 and not bad and unscale(to_fp16([70.0], 1024.0)[0], 1024.0)[1]` },
          { name: "dynamic", code: `s, k = scaler_run([[1.0]] * 6, 2.0 ** 14, 2); assert s == [16384.0, 16384.0, 32768.0, 32768.0, 65536.0, 32768.0] and k == 1
s, k = scaler_run([[100.0]] * 4, 2.0 ** 16, 3); assert s == [65536.0, 32768.0, 16384.0, 8192.0] and k == 4` },
        ],
      },
    },
    {
      key: "bytes",
      rung: "stretch",
      prompt: (
        <p>
          Mixed-precision training with Adam keeps float32 master weights and two float32 moments, plus a bfloat16 copy of
          the weights and bfloat16 gradients. How many bytes is that per parameter?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Mixed precision speeds up each kernel. The next lesson speeds up the program around them: <C>torch.compile</C>{" "}
        captures the Python code as a graph and fuses many small operations into a few kernels.
      </p>
    </>
  ),
};
