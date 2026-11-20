import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QuantGridViz } from "@/components/viz/QuantGridViz";
import type { LessonContent } from "@/lib/types";

const AFFINE = `import numpy as np

def quantize(x, scale, zero, bits):
    q = np.round(x / scale) + zero
    return np.clip(q, 0, 2 ** bits - 1).astype(int)   # unsigned integers 0 .. 2^bits - 1

def dequantize(q, scale, zero):
    return (q - zero) * scale

def minmax_params(x, bits):
    scale = (x.max() - x.min()) / (2 ** bits - 1)       # the range spread over all levels
    zero = int(round(-x.min() / scale))                  # the integer that represents 0.0
    return float(scale), zero`;

const GROUPS = `import numpy as np

def symmetric_scale(x, bits):
    return float(np.abs(x).max() / (2 ** (bits - 1) - 1))   # zero point 0, levels -(2^(b-1)-1) .. 2^(b-1)-1

def group_scales(w, group, bits):
    return np.array([symmetric_scale(g, bits) for g in w.reshape(-1, group)])   # one scale per contiguous group

def quant_error(w, group, bits):
    s = np.repeat(group_scales(w, group, bits), group)
    return float(np.mean((np.round(w / s) * s - w) ** 2))`;

export const lesson: LessonContent = {
  id: "e12.4.1",
  minutes: 50,
  links: {
    requires: ["e12.1.1", "m11.1.2"],
    revisits: ["m11.1.4", "e9.5.2"],
    foreshadows: ["e12.4.2"],
  },

  puzzle: (
    <>
      <p>
        Decode is limited by reading weights, so storing them in 4 bits instead of 16 should make it nearly four times faster. A team
        maps each weight matrix to 4-bit integers using its largest absolute value as the scale, and the model&apos;s output turns to
        nonsense. Using the same 4 bits but a separate scale for every 128 weights, the model is almost unaffected. What is a scale, why
        did one per matrix fail, and what does the extra scale cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Integer quantisation represents a real number x as an integer q with <M>{"x \\approx s(q - z)"}</M>: the scale s is the step
        between representable values and the zero point z is the integer standing for 0. With b bits there are only <M>{"2^b"}</M>{" "}
        levels, so the scale is set by the range to be covered, and every value is rounded to the nearest level (m11.1.2). A single large
        value stretches the range and coarsens the grid for all others, rounding small weights to zero. Giving each channel or small
        group of weights its own scale confines the damage, at the cost of storing the scales.
      </p>
      <QuantGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="affine quantisation">
        <p>
          <C>quantize</C> divides by the scale, rounds, adds the zero point and clips to the unsigned range{" "}
          <M>{"0, \\dots, 2^b - 1"}</M>. <C>dequantize</C> inverts the map. <C>minmax_params</C> chooses the scale so that the
          minimum-to-maximum range spans all levels, and the zero point so that 0.0 is exactly representable.
        </p>
        <Code>{AFFINE}</Code>
      </Definition>

      <Theorem title="rounding error">
        <p>
          For x inside the representable range, <M>{"|x - s(q - z)| \\le s/2"}</M>. If the position of x within its step is uniformly
          distributed, the mean squared error is <M>{"s^2/12"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Within the range no clipping occurs, and rounding <M>{"x/s"}</M> to the nearest integer moves it by at most 1/2, so after
          multiplying by s the error is at most s/2. If the error e is uniform on <M>{"[-s/2, s/2]"}</M>, then{" "}
          <M>{"\\mathbb{E}[e^2] = \\frac{1}{s}\\int_{-s/2}^{s/2} e^2\\,de = s^2/12"}</M>. Each extra bit halves s and so cuts the mean
          squared error by four; any value that stretches the range raises s for every value sharing the scale.
        </p>
      </Proof>

      <Definition title="symmetric scales and granularity">
        <p>
          <C>symmetric_scale</C> uses zero point 0 and levels <M>{"\\pm(2^{b-1} - 1)"}</M>, with the scale set by the largest absolute
          value. <C>group_scales</C> computes one symmetric scale per contiguous group of <C>group</C> weights, and <C>quant_error</C>{" "}
          is the mean squared error of quantising with those scales.
        </p>
        <Code>{GROUPS}</Code>
      </Definition>

      <Theorem title="finer groups never hurt the bound">
        <p>
          With symmetric scales, splitting a tensor into groups gives every element a step no larger than the per-tensor step, so its
          worst-case rounding error is no larger.
        </p>
      </Theorem>
      <Proof>
        <p>
          A group&apos;s scale is its largest absolute value divided by <M>{"2^{b-1} - 1"}</M>, and a group&apos;s largest absolute
          value is at most the tensor&apos;s. So each group step <M>{"s_g \\le s"}</M>, and by the previous theorem each element&apos;s
          error is at most <M>{"s_g/2 \\le s/2"}</M>. The price is storage: with groups of g weights and a 16-bit scale per group, each
          weight costs <M>{"b + 16/g"}</M> bits on average.
        </p>
      </Proof>

      <Remark title="granularity in practice">
        <p>
          Weights are usually quantised per output channel or in groups of 32 to 128 along the input dimension; activations, which change
          with every input, per token or per tensor, sometimes with scales computed on the fly. Floating-point formats such as FP8 and the
          microscaling formats store a shared exponent per small block, a related idea (m11.1.4). Quantised kernels (e9.5.2) dequantise in
          registers just before multiplying, so the memory saving becomes a speed-up in memory-bound decode.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A few weights per matrix are far larger than the rest. With one scale per matrix and only fourteen non-zero levels, the step was
          set by those few, and most weights rounded to zero or to a single level. With a scale per 128 weights, only the groups that
          contain a large weight get a coarse step, and the rest keep fine ones; the cost is a 16-bit scale per 128 weights, an eighth of a
          bit per weight.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "scale",
      rung: "check",
      prompt: <p>A tensor&apos;s largest absolute value is 2.54. What is its symmetric 8-bit scale?</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.00001 },
    },
    {
      key: "zero",
      rung: "check",
      prompt: <p>Values range from −1 to 2 and are quantised to 4-bit unsigned integers by the min-max rule. What is the zero point?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
    {
      key: "groups",
      rung: "apply",
      prompt: <p>Why does a scale per group of weights preserve accuracy better than one scale per matrix?</p>,
      answer: {
        kind: "choice",
        options: [
          "A large weight coarsens the step only for its own group, so small weights elsewhere keep a fine grid",
          "Groups use more bits for each weight",
          "Group scales remove all rounding error",
          "Groups make the matrix smaller in memory than per-matrix quantisation",
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

def quantize(x, scale, zero, bits):
    q = np.round(x / scale) + zero
    return np.clip(q, 0, 2 ** bits - 1).astype(int)   # unsigned integers 0 .. 2^bits - 1

def dequantize(q, scale, zero):
    return (q - zero) * scale

def minmax_params(x, bits):
    scale = (x.max() - x.min()) / (2 ** bits - 1)       # the range spread over all levels
    zero = int(round(-x.min() / scale))                  # the integer that represents 0.0
    return float(scale), zero

x = np.array([-1.0, 0.0, 0.5, 2.0]); s, z = minmax_params(x, 2); q = quantize(x, s, z, 2)
print(s, z, q.tolist(), dequantize(q, s, z).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1 [0, 1, 1, 3] [-1.0, 0.0, 0.0, 2.0]",
          "1.0 1 [0, 1, 2, 3] [-1.0, 0.0, 1.0, 2.0]",
          "0.75 1 [0, 1, 1, 3] [-1.0, 0.0, 0.0, 2.0]",
          "1.0 0 [0, 1, 1, 3] [0.0, 1.0, 1.0, 3.0]",
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

def symmetric_scale(x, bits):
    return float(np.abs(x).max() / (2 ** (bits - 1) - 1))   # zero point 0, levels -(2^(b-1)-1) .. 2^(b-1)-1

def group_scales(w, group, bits):
    return np.array([symmetric_scale(g, bits) for g in w.reshape(-1, group)])   # one scale per contiguous group

def quant_error(w, group, bits):
    s = np.repeat(group_scales(w, group, bits), group)
    return float(np.mean((np.round(w / s) * s - w) ** 2))

w = np.array([0.1, -0.2, 0.05, 4.0])
print(round(symmetric_scale(w, 8), 4), np.round(group_scales(w, 2, 8), 4).tolist(), quant_error(w, 4, 8) > quant_error(w, 2, 8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0315 [0.0016, 0.0315] True",
          "0.0157 [0.0016, 0.0315] True",
          "0.0315 [0.0008, 0.0315] True",
          "0.0315 [0.0016, 0.0315] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quantize(x, scale, zero, bits)</C>, returning an integer array; <C>dequantize(q, scale, zero)</C>; and{" "}
          <C>minmax_params(x, bits)</C>, returning a float scale and an int zero point.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def quantize(x, scale, zero, bits):
    return np.round(x / scale).astype(int)

def dequantize(q, scale, zero):
    return q * scale

def minmax_params(x, bits):
    return 1.0, 0
`,
        solution: AFFINE,
        tests: [
          { name: "round_trip", code: `x = np.array([-2.0, 0.0, 1.0, 10.0])\nq = quantize(x, 1.0, 2, 3)\nassert q.tolist() == [0, 2, 3, 7] and dequantize(q, 1.0, 2).tolist() == [-2.0, 0.0, 1.0, 5.0]` },
          { name: "params", code: `s, z = minmax_params(np.array([-3.0, 0.0, 12.0]), 4)\nassert abs(s - 1.0) < 1e-12 and z == 3 and isinstance(z, int)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>symmetric_scale(x, bits)</C>, returning a float; <C>group_scales(w, group, bits)</C> for a 1-D array whose length is
          a multiple of <C>group</C>; and <C>quant_error(w, group, bits)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def symmetric_scale(x, bits):
    return float(np.abs(x).max())

def group_scales(w, group, bits):
    return np.array([symmetric_scale(w, bits)])

def quant_error(w, group, bits):
    return 0.0
`,
        solution: GROUPS,
        tests: [
          { name: "scales", code: `assert symmetric_scale(np.array([0.5, -7.0]), 4) == 1.0\nassert np.allclose(group_scales(np.array([1.0, -3.0, 6.0, 0.0]), 2, 3), [1.0, 2.0])` },
          { name: "error", code: `w = np.array([1.0, 0.4, 3.0, 2.0])\nassert abs(quant_error(w, 2, 2) - (0.16 + 1.0) / 4) < 1e-12 and quant_error(np.array([2.0, -2.0]), 2, 4) == 0.0` },
        ],
      },
    },
    {
      key: "overhead",
      rung: "stretch",
      prompt: (
        <p>
          Weights are stored in 4 bits with one 16-bit scale per group of 128 weights. How many bits per weight is that on average?
        </p>
      ),
      answer: { kind: "numeric", value: 4.125, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Rounding each weight to its nearest level is the simplest choice, but not the best one: errors in different weights can be made
        to cancel. The next lesson shows how weight-only methods choose levels using a little calibration data.
      </p>
    </>
  ),
};
