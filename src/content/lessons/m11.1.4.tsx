import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LowPrecisionViz } from "@/components/viz/LowPrecisionViz";
import type { LessonContent } from "@/lib/types";

const MX = `import numpy as np

FP4 = np.array([0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0])

def to_fp4(x):
    a = np.abs(np.asarray(x, dtype=float))
    idx = np.abs(a[..., None] - FP4).argmin(axis=-1)
    return np.sign(x) * FP4[idx]

def mx_quantise(x, block=32):
    x = np.asarray(x, dtype=float).reshape(-1, block)
    amax = np.abs(x).max(axis=1, keepdims=True)
    e = np.floor(np.log2(np.where(amax > 0, amax, 1.0))) - 2
    scale = 2.0 ** e
    return (to_fp4(x / scale) * scale).ravel()`;

const BF = `import numpy as np

def to_bf16(x):
    b = np.asarray(x, dtype=np.float32).view(np.uint32).astype(np.uint64)
    b = (b + 0x7FFF + ((b >> 16) & 1)) >> 16 << 16
    return b.astype(np.uint32).view(np.float32)

def fmt_stats(ebits, mbits):
    bias = 2 ** (ebits - 1) - 1
    return 2.0 ** (bias + 1) * (1 - 2.0 ** -(mbits + 1)), 2.0 ** (1 - bias), 2.0 ** -(mbits + 1)`;

export const lesson: LessonContent = {
  id: "m11.1.4",
  minutes: 50,
  links: {
    requires: ["m11.1.2"],
    revisits: ["e3.1.2"],
    foreshadows: ["m11.1.5"],
  },

  puzzle: (
    <>
      <p>
        Large models are trained with matrix multiplications in 16-bit and even 8-bit floating point, and served with
        weights in 4 bits. A 4-bit float has exactly fifteen distinct values. A tensor of activations may span ten orders of
        magnitude. How can a format with fifteen values represent such a tensor, and why did the industry settle on a
        16-bit format with less precision than the older half precision?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A floating-point format spends its bits on two things: exponent bits buy range, fraction bits buy precision.
        Training needs range above all, because gradients and activations span many orders of magnitude, while each
        individual number tolerates a surprisingly large relative error. Narrow formats have so little range that they
        cannot cover a whole tensor; the fix is to give each small block of numbers its own scale factor, a shared power of
        two, so that each block only needs to cover its own few binades.
      </p>
      <LowPrecisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the formats">
        <p>Writing ExMy for x exponent bits and y fraction bits:</p>
        <ul>
          <li>FP16 = E5M10: largest 65504, smallest normal <M>{"2^{-14}"}</M>, u = <M>{"2^{-11}"}</M>.</li>
          <li>BF16 = E8M7: the range of FP32 (largest about 3.4 × 10³⁸), u = <M>{"2^{-8}"}</M>; it is FP32 with the low 16 bits dropped.</li>
          <li>FP8 E5M2: IEEE-like, largest 57344, u = <M>{"2^{-3}"}</M>; FP8 E4M3: no infinities, largest 448, u = <M>{"2^{-4}"}</M>.</li>
          <li>FP4 E2M1: the values ±0, 0.5, 1, 1.5, 2, 3, 4, 6.</li>
        </ul>
        <p>
          A microscaling (MX) format stores a block of k elements (k = 32 in the OCP standard) in a narrow element format
          together with one shared 8-bit scale <M>{"2^s"}</M>; element i represents <M>{"2^s q_i"}</M>. The scale is chosen
          from the block&apos;s largest magnitude: <M>{"s = \\lfloor\\log_2 \\max_i|x_i|\\rfloor - e_{\\max}"}</M>, where{" "}
          <M>{"e_{\\max}"}</M> is the exponent of the element format&apos;s largest binade (2 for E2M1), clamping anything that
          lands above the largest element.
        </p>
      </Definition>

      <Theorem title="power-of-two scaling is free">
        <p>
          If x and <M>{"2^kx"}</M> are both in the normal range of a binary format, then{" "}
          <M>{"\\mathrm{fl}(2^kx) = 2^k\\,\\mathrm{fl}(x)"}</M>. So the relative rounding error of each element of a block is
          the same as if the element format had unlimited range, as long as the scaled element is normal.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiplying by <M>{"2^k"}</M> maps the binade <M>{"[2^e, 2^{e+1})"}</M> onto <M>{"[2^{e+k}, 2^{e+k+1})"}</M> and its
          floats, spaced <M>{"2^{e-p}"}</M>, onto the floats of the image binade, spaced <M>{"2^{e+k-p}"}</M>. The map
          preserves order and distances up to the factor <M>{"2^k"}</M>, so the nearest float to x (with the same tie rule,
          since fraction bits are unchanged) maps to the nearest float to <M>{"2^kx"}</M>.
        </p>
        <Code>{MX}</Code>
      </Proof>

      <Remark title="choosing a format">
        <p>
          FP16 training needs loss scaling: multiply the loss by a large power of two so small gradients do not underflow,
          then divide it out, which by the theorem costs no accuracy. BF16 needs none, because its range matches FP32, and
          its 8 significant bits are enough for most activations and gradients with FP32 accumulation; this is why it became
          the default. FP8 training uses E4M3 for weights and activations and E5M2 for gradients, with per-tensor or per-block
          scales; FP4 with MX block scales is used for inference and increasingly for training. Elements much smaller than
          the block maximum still lose precision or flush to zero, which is the price of a shared scale. In the code, a
          tensor whose two halves differ by a factor of 1000 is quantised to FP4 with median relative error 0.138 using a
          scale per block of 32, against 0.985 with no scale at all. Rounding FP32 to BF16 by adding 0x7FFF plus the lowest
          kept bit and truncating is round-to-nearest-even; 1 + 2⁻⁸ is a tie and goes to 1.
        </p>
        <Code>{BF}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ubf",
      rung: "check",
      prompt: <p>What is the unit roundoff u of BF16?</p>,
      answer: { kind: "numeric", value: 0.00390625, tolerance: 0.0000001 },
    },
    {
      key: "binades",
      rung: "check",
      prompt: <p>FP16 normal numbers have unbiased exponents from −14 to 15. How many binades [2ᵉ, 2ᵉ⁺¹) of normal numbers is that?</p>,
      answer: { kind: "numeric", value: 30, tolerance: 0.5 },
    },
    {
      key: "bf16why",
      rung: "apply",
      prompt: <p>Why is BF16 usually preferred to FP16 for training, despite having fewer fraction bits?</p>,
      answer: {
        kind: "choice",
        options: [
          "It has the exponent range of FP32, so gradients rarely overflow or underflow and no loss scaling is needed",
          "It has more significant bits than FP16",
          "It rounds more accurately than FP16 because it uses stochastic rounding",
          "Its arithmetic is exact for integers up to 2³²",
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

FP4 = np.array([0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0])

def to_fp4(x):
    a = np.abs(np.asarray(x, dtype=float))
    idx = np.abs(a[..., None] - FP4).argmin(axis=-1)
    return np.sign(x) * FP4[idx]

def mx_quantise(x, block=32):
    x = np.asarray(x, dtype=float).reshape(-1, block)
    amax = np.abs(x).max(axis=1, keepdims=True)
    e = np.floor(np.log2(np.where(amax > 0, amax, 1.0))) - 2
    scale = 2.0 ** e
    return (to_fp4(x / scale) * scale).ravel()

print(to_fp4(np.array([0.7, -2.4, 5.1, 9.0, 0.2])).tolist())
x = np.random.default_rng(0).normal(size=64) * np.repeat([1.0, 1000.0], 32)
rel = lambda q: round(float(np.median(np.abs(q - x) / np.abs(x))), 3)
print(rel(mx_quantise(x)), rel(to_fp4(x)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, -2.0, 6.0, 6.0, 0.0]\n0.138 0.985", "[1.0, -2.0, 6.0, 9.0, 0.0]\n0.138 0.985", "[0.5, -2.0, 6.0, 6.0, 0.5]\n0.138 0.985", "[0.5, -2.0, 6.0, 6.0, 0.0]\n0.985 0.138"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def to_bf16(x):
    b = np.asarray(x, dtype=np.float32).view(np.uint32).astype(np.uint64)
    b = (b + 0x7FFF + ((b >> 16) & 1)) >> 16 << 16
    return b.astype(np.uint32).view(np.float32)

def fmt_stats(ebits, mbits):
    bias = 2 ** (ebits - 1) - 1
    return 2.0 ** (bias + 1) * (1 - 2.0 ** -(mbits + 1)), 2.0 ** (1 - bias), 2.0 ** -(mbits + 1)

print(fmt_stats(5, 10), fmt_stats(8, 7)[1] == 2.0 ** -126)
print(to_bf16(np.float32(1 / 3)), np.float16(1 / 3), to_bf16(np.float32(3e38)), to_bf16(np.float32(1.00390625)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(65504.0, 6.103515625e-05, 0.00048828125) True\n0.33398438 0.3333 3.0040553e+38 1.0", "(65504.0, 6.103515625e-05, 0.0009765625) True\n0.33398438 0.3333 3.0040553e+38 1.0039062", "(65536.0, 6.103515625e-05, 0.00048828125) True\n0.33398438 0.3333 3.0040553e+38 1.0", "(65504.0, 6.103515625e-05, 0.00048828125) True\n0.33203125 0.3333 inf 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_fp4(x)</C>, rounding each entry to the nearest FP4 E2M1 value (keeping the sign, saturating at ±6), and{" "}
          <C>mx_quantise(x, block=32)</C>, which scales each block by 2^(⌊log₂ max|x|⌋ − 2), rounds to FP4 and scales back.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

FP4 = np.array([0.0, 0.5, 1.0, 1.5, 2.0, 3.0, 4.0, 6.0])

def to_fp4(x):
    return np.asarray(x, dtype=float)

def mx_quantise(x, block=32):
    return np.asarray(x, dtype=float)
`,
        solution: MX,
        tests: [
          { name: "fp4", code: `assert to_fp4(np.array([0.2, 0.8, -1.3, 2.6, -4.9, 100.0])).tolist() == [0.0, 1.0, -1.5, 3.0, -4.0, 6.0]` },
          { name: "mx", code: `x = np.concatenate([np.full(4, 13.7), np.full(4, 0.003)])
q = mx_quantise(x, block=4)
assert np.allclose(q[:4], 12.0) and np.allclose(q[4:], 0.003 * 0 + 2.0 ** -9 * 1.5)
rng = np.random.default_rng(1); y = rng.normal(size=256) * 10.0 ** rng.integers(-3, 4, size=256).repeat(1)
assert np.all(np.abs(mx_quantise(y) - y) <= np.abs(y).reshape(-1, 32).max(axis=1).repeat(32) * 0.5 + 1e-12)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>to_bf16(x)</C>, rounding float32 values to the nearest BF16 (ties to even) and returning float32, and{" "}
          <C>fmt_stats(ebits, mbits)</C>, returning (largest finite, smallest normal, unit roundoff) of an IEEE-like format
          whose top exponent is reserved.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def to_bf16(x):
    return np.asarray(x, dtype=np.float32)

def fmt_stats(ebits, mbits):
    return 0.0, 0.0, 0.0
`,
        solution: BF,
        tests: [
          { name: "bf", code: `x = np.array([1 / 3, 1.00390625, 1.01171875, -2.5, 1e-30], dtype=np.float32)
y = to_bf16(x)
assert y.dtype == np.float32 and np.all(y.view(np.uint32) & 0xFFFF == 0)
assert y[1] == 1.0 and y[2] == np.float32(1.015625) and y[3] == -2.5 and abs(y[4] / x[4] - 1) <= 2.0 ** -8` },
          { name: "stats", code: `assert fmt_stats(5, 10) == (65504.0, 2.0 ** -14, 2.0 ** -11) and fmt_stats(8, 23)[0] == float(np.finfo(np.float32).max)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if x and 2ᵏx both lie in the normal range of a binary floating-point format with round-to-nearest-even,
          then fl(2ᵏx) = 2ᵏ fl(x).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that multiplication by 2ᵏ maps the binade [2ᵉ, 2ᵉ⁺¹) onto [2ᵉ⁺ᵏ, 2ᵉ⁺ᵏ⁺¹) and its floats onto the floats there, with the same fraction bits.",
          "Observes that the map scales all distances by 2ᵏ and preserves order, so nearest points correspond.",
          "Checks that ties are broken identically because the fraction bits (and so their parity) are unchanged.",
        ],
      },
    },
    {
      key: "mxv",
      rung: "stretch",
      prompt: <p>An MX block with FP4 E2M1 elements has largest magnitude 13.7. The scale is 2^(⌊log₂ 13.7⌋ − 2). What value does the element 13.7 decode to after quantisation?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how exponent bits and fraction bits trade range against precision in FP16, BF16, FP8 and FP4, why BF16 replaced FP16 for training, and how a shared power-of-two scale per block lets a 4-bit format represent tensors with a huge dynamic range.",

  glimpse: (
    <>
      <p>
        With only a few bits, rounding to nearest has a subtle flaw: small updates to a large number round away to nothing,
        every time. The next lesson fixes this by rounding up or down at random.
      </p>
    </>
  ),
};
