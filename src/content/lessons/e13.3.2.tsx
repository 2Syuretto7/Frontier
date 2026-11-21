import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { Fp8ScalingViz } from "@/components/viz/Fp8ScalingViz";
import type { LessonContent } from "@/lib/types";

const DELAYED = `def push_amax(hist, amax, n):
    return (hist + [amax])[-n:]                            # keep the last n maxima

def delayed_scale(hist, fmax, margin):
    return fmax / (max(hist) * 2 ** margin)               # chosen from past maxima, not this step's

def overflow_count(xs, scale, fmax):
    return sum(1 for x in xs if abs(x * scale) > fmax)    # values that saturate after scaling`;

const BLOCKS = `def block_scales(xs, b, fmax):
    out = []
    for i in range(0, len(xs), b):
        m = max(abs(v) for v in xs[i:i + b])
        out.append(fmax / m if m > 0 else 1.0)            # one scale per block of b values
    return out

def flushed(xs, scales, b, tiny):
    return sum(1 for i, x in enumerate(xs) if x != 0 and abs(x * scales[i // b]) < tiny)

def tensor_vs_block(xs, b, fmax, tiny):
    whole = block_scales(xs, len(xs), fmax)
    return flushed(xs, whole, len(xs), tiny), flushed(xs, block_scales(xs, b, fmax), b, tiny)`;

export const lesson: LessonContent = {
  id: "e13.3.2",
  minutes: 45,
  links: {
    requires: ["e13.3.1"],
    revisits: ["e9.5.1", "e6.4.1"],
    foreshadows: ["e13.3.3"],
  },

  puzzle: (
    <>
      <p>
        A team switches its matrix multiplications from BF16 to FP8 and gets a third more throughput. A short proxy run
        matches the BF16 loss curve to the third decimal. The full run tracks it for weeks, then begins to spike and
        diverges, while an identical BF16 run carries on. Nothing in the code changed during the run. What did the
        proxy fail to show?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An FP8 number has only 256 bit patterns, so every tensor must be multiplied by a scale that places its values
        inside the format&apos;s narrow range before casting. Scales chosen from past maxima lag behind a tensor whose
        values are growing, and one scale for a whole tensor is set by its largest outlier, pushing small values below
        the smallest representable number. Short runs rarely grow such outliers. Long runs do, so FP8 failures tend to
        appear late, exactly where a proxy cannot see.
      </p>
      <Fp8ScalingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="FP8 formats and scaling">
        <p>
          E4M3 has four exponent bits and three mantissa bits, a largest value of 448 and a smallest positive subnormal
          of <M>{"2^{-9}"}</M>; E5M2 has a largest value of 57344 and a smallest subnormal of <M>{"2^{-16}"}</M>, with
          one fewer mantissa bit. Before a cast, a tensor is multiplied by a scale s and the result is divided by s
          after the matrix multiplication, which is accumulated in higher precision. Delayed scaling sets s from a
          history of recent absolute maxima (amax), with a margin of powers of two for growth (<C>push_amax</C>,{" "}
          <C>delayed_scale</C>); a value whose scaled magnitude exceeds the format&apos;s largest value saturates{" "}
          (<C>overflow_count</C>).
        </p>
        <Code>{DELAYED}</Code>
      </Definition>

      <Theorem title="precision and range">
        <p>
          A format with m mantissa bits rounds a normal number to nearest with relative error at most{" "}
          <M>{"2^{-(m+1)}"}</M>: <M>{"1/16"}</M> for E4M3 and <M>{"1/8"}</M> for E5M2. With one scale for a tensor whose
          largest magnitude is A, scaled so that A maps to the format&apos;s maximum F, a value x is flushed to zero in
          this model when <M>{"|x| F / A"}</M> is below the smallest subnormal, so the representable values span a
          fixed ratio below A whatever the scale.
        </p>
      </Theorem>
      <Proof>
        <p>
          Between consecutive powers of two, <M>{"2^e"}</M> and <M>{"2^{e+1}"}</M>, the format has <M>{"2^m"}</M>{" "}
          equally spaced values with gap <M>{"2^{e-m}"}</M>. Rounding to nearest moves x by at most half a gap,{" "}
          <M>{"2^{e-m-1}"}</M>, and dividing by <M>{"x \\ge 2^e"}</M> gives the bound. For the second claim, the scale is{" "}
          <M>{"s = F/A"}</M>, so x becomes <M>{"xF/A"}</M>, and the condition for flushing depends on x only through{" "}
          <M>{"x/A"}</M>. For E4M3 the ratio from F to the smallest subnormal is <M>{"448 \\cdot 2^9"}</M>, about 18
          powers of two, and a single outlier of size A decides which 18.
        </p>
      </Proof>

      <Example title="recipes in use">
        <p>
          The first widely used recipe, in NVIDIA&apos;s Transformer Engine, keeps E4M3 for weights and activations and
          E5M2 for gradients, one scale per tensor, and delayed scaling from an amax history. DeepSeek-V3 used E4M3
          everywhere with finer scales: one per 1×128 tile of activations and one per 128×128 block of weights{" "}
          (<C>block_scales</C>), and it promoted partial sums to FP32 at regular intervals along the inner dimension,
          because the tensor cores&apos; own accumulator kept too few bits. Embeddings, the output head, normalisation,
          attention softmax, master weights and optimiser states stay in higher precision in both.
        </p>
        <Code>{BLOCKS}</Code>
      </Example>

      <Remark title="late failures">
        <p>
          A study of FP8 training over trillions of tokens reported divergence that appeared only late in long runs,
          traced to activation outliers in SwiGLU layers that grew as weights aligned during training; a modified
          activation that bounded them restored stability. The operational lessons are general. Log the amax of the
          tensors you cast and the fraction of values that saturate or flush (<C>flushed</C>,{" "}
          <C>tensor_vs_block</C>); compare against a BF16 shadow run at intervals, not only at the start; and keep the
          option of switching the offending layers back to BF16 from a checkpoint, which costs throughput but not the
          run.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stale",
      rung: "check",
      prompt: (
        <p>
          A tensor is cast to E4M3 with delayed scaling and no margin. Its amax history has largest value 3.5, but this
          step&apos;s amax is 5.2. By what factor does its largest scaled magnitude exceed the format&apos;s largest
          value?
        </p>
      ),
      answer: { kind: "numeric", value: 1.4857, tolerance: 0.001 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: (
        <p>
          A tensor has one outlier of magnitude 1000 and is cast to E4M3 with one scale mapping 1000 to 448. Using the
          lesson&apos;s model, what is the smallest magnitude that is not flushed to zero, to three significant figures?
        </p>
      ),
      answer: { kind: "numeric", value: 0.00436, tolerance: 0.002 },
    },
    {
      key: "formats",
      rung: "apply",
      prompt: <p>Why do per-tensor recipes use E5M2 for gradients but E4M3 for activations?</p>,
      answer: {
        kind: "choice",
        options: [
          "Gradients span a much wider range of magnitudes, so the extra exponent bit matters more than the lost mantissa bit",
          "E5M2 is more precise than E4M3",
          "Gradients are always smaller than one",
          "Activations never contain outliers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def push_amax(hist, amax, n):
    return (hist + [amax])[-n:]                            # keep the last n maxima

def delayed_scale(hist, fmax, margin):
    return fmax / (max(hist) * 2 ** margin)               # chosen from past maxima, not this step's

def overflow_count(xs, scale, fmax):
    return sum(1 for x in xs if abs(x * scale) > fmax)    # values that saturate after scaling

h = push_amax(push_amax([1.0, 4.0], 2.0, 3), 1.0, 3)
print(h, delayed_scale(h, 448, 1), overflow_count([1.0, -3.0, 2.5, 3.6], delayed_scale(h, 448, 1), 150))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 2.0, 1.0] 56.0 2",
          "[2.0, 1.0] 112.0 3",
          "[4.0, 2.0, 1.0] 112.0 3",
          "[4.0, 2.0, 1.0] 56.0 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def block_scales(xs, b, fmax):
    out = []
    for i in range(0, len(xs), b):
        m = max(abs(v) for v in xs[i:i + b])
        out.append(fmax / m if m > 0 else 1.0)            # one scale per block of b values
    return out

def flushed(xs, scales, b, tiny):
    return sum(1 for i, x in enumerate(xs) if x != 0 and abs(x * scales[i // b]) < tiny)

def tensor_vs_block(xs, b, fmax, tiny):
    whole = block_scales(xs, len(xs), fmax)
    return flushed(xs, whole, len(xs), tiny), flushed(xs, block_scales(xs, b, fmax), b, tiny)

print(block_scales([1, -4, 0, 0, 2, 8], 2, 16), flushed([1, -4, 0.01, 0.1], [4, 0.5], 2, 0.1))
print(tensor_vs_block([100, 0.5, 0.02, 0.4], 2, 400, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 1.0, 2.0] 2\n(1, 0)",
          "[4.0, 4.0, 2.0] 2\n(1, 0)",
          "[4.0, 1.0, 2.0] 1\n(1, 0)",
          "[4.0, 1.0, 2.0] 2\n(0, 1)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>push_amax(hist, amax, n)</C>, the history with amax appended and only the last n kept;{" "}
          <C>delayed_scale(hist, fmax, margin)</C>, fmax divided by the largest amax times 2 to the margin; and{" "}
          <C>overflow_count(xs, scale, fmax)</C>, the number of values whose scaled magnitude exceeds fmax.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def push_amax(hist, amax, n):
    return hist

def delayed_scale(hist, fmax, margin):
    return fmax / max(hist)

def overflow_count(xs, scale, fmax):
    return 0
`,
        solution: DELAYED,
        tests: [
          { name: "hist", code: `assert push_amax([], 2, 2) == [2] and push_amax([1, 2, 3], 4, 2) == [3, 4] and delayed_scale([2, 8, 4], 448, 0) == 56.0 and delayed_scale([7], 448, 2) == 16.0` },
          { name: "overflow", code: `assert overflow_count([1, -5, 2.5, 6], 64, 300) == 2 and overflow_count([0.5], 2, 4) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_scales(xs, b, fmax)</C>, fmax over each block&apos;s largest magnitude, or 1.0 for an all-zero
          block; <C>flushed(xs, scales, b, tiny)</C>, the number of nonzero values whose scaled magnitude is below tiny;
          and <C>tensor_vs_block(xs, b, fmax, tiny)</C>, the flushed counts with one scale and with block scales.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def block_scales(xs, b, fmax):
    return [1.0 for i in range(0, len(xs), b)]

def flushed(xs, scales, b, tiny):
    return 0

def tensor_vs_block(xs, b, fmax, tiny):
    return 0, 0
`,
        solution: BLOCKS,
        tests: [
          { name: "scales", code: `assert block_scales([2, -8, 1, 0, 0], 2, 448) == [56.0, 448.0, 1.0] and block_scales([0, 0], 2, 448) == [1.0]` },
          { name: "flush", code: `assert flushed([0.5, 1, 0, 2], [1, 0.2], 2, 0.6) == 2 and tensor_vs_block([64, 0.1, 0.5, 0.25], 2, 448, 2) == (2, 1)` },
        ],
      },
    },
    {
      key: "growth",
      rung: "stretch",
      prompt: (
        <p>
          A delayed scale is computed from an amax history whose largest value equals the current amax, with a margin of
          one power of two, and is then held fixed. The tensor&apos;s amax grows by 3% per step. On which step after the
          scale was computed does the tensor first saturate?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        When an FP8 run, or any run, produces a NaN, someone must find the first operation that went wrong. The next
        lesson is about numerical debugging: bisecting a failure down to a layer, a kernel and a value.
      </p>
    </>
  ),
};
