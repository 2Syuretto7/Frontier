import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KernelTestSuiteViz } from "@/components/viz/KernelTestSuiteViz";
import type { LessonContent } from "@/lib/types";

const COMPARE = `import math

def ulp_bf16(x):
    return 2.0 ** (math.floor(math.log2(abs(x))) - 7)   # 7 stored mantissa bits

def max_abs_err(a, b):
    return max(abs(x - y) for x, y in zip(a, b))

def passes_baseline(out, ref, base, factor):
    # the kernel may be at most \`factor\` times as far from a high-precision reference
    # as a trusted low-precision implementation is
    return max_abs_err(out, ref) <= factor * max_abs_err(base, ref)`;

const HARNESS = `def boundary_sizes(BLOCK):
    return sorted({1, BLOCK - 1, BLOCK, BLOCK + 1, 2 * BLOCK - 1, 2 * BLOCK, 2 * BLOCK + 1})

def guarded_run(kernel, x, pad, canary):
    out = [0.0] * len(x) + [canary] * pad          # guard values after the real output
    kernel(x, out)
    return out[:len(x)], all(v == canary for v in out[len(x):])

def deterministic(kernel, x, runs):
    first = kernel(x)
    return all(kernel(x) == first for _ in range(runs - 1))   # bitwise equality`;

const PYTEST = `import pytest
import torch

BLOCK = 128
SIZES = [1, BLOCK - 1, BLOCK, BLOCK + 1, 2 * BLOCK + 1, 1000, 4096]

@pytest.mark.parametrize("n", SIZES)
@pytest.mark.parametrize("dtype", [torch.float32, torch.bfloat16])
@pytest.mark.parametrize("transposed", [False, True])
def test_rmsnorm(n, dtype, transposed):
    torch.manual_seed(n)
    x = torch.randn(64, n, device="cuda", dtype=dtype)
    if transposed:
        x = torch.randn(n, 64, device="cuda", dtype=dtype).t()     # non-contiguous rows
    w = torch.randn(n, device="cuda", dtype=dtype)
    ref = rmsnorm_reference(x.double(), w.double(), 1e-6)            # float64 reference
    base = rmsnorm_reference(x, w, 1e-6)                             # plain PyTorch, same dtype
    out = torch.ops.mylib.rmsnorm(x, w, 1e-6)[0]
    err, base_err = (out.double() - ref).abs().max(), (base.double() - ref).abs().max()
    assert err <= 2 * base_err + 1e-6, (err, base_err)
    assert torch.equal(out, torch.ops.mylib.rmsnorm(x, w, 1e-6)[0])  # same inputs, same bits`;

export const lesson: LessonContent = {
  id: "e9.6.2",
  minutes: 50,
  links: {
    requires: ["e9.6.1", "e4.1.3"],
    revisits: ["e5.4.1", "e9.4.3"],
    foreshadows: ["e10.8.4", "e13.3.3"],
  },

  puzzle: (
    <>
      <p>
        A new attention kernel passes a test suite of a hundred cases with <C>torch.allclose</C> at the default tolerances. In training
        it slowly diverges from the reference implementation. The suite used sequence lengths 512, 1024 and 2048, contiguous float32
        inputs and one run per case. Which bugs could such a suite never have seen, and what should it have compared against?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Kernels fail in characteristic places: at the edges of blocks, on inputs whose strides are not the expected ones, in low
        precision over long reductions, in memory just past the output, and in races between programs. A suite built from convenient
        sizes misses almost all of them. Good kernel tests choose inputs to straddle every boundary the kernel has, compare against a
        high-precision reference with a tolerance that is justified rather than guessed, check memory the kernel should not touch, and
        run the same input twice.
      </p>
      <KernelTestSuiteViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inputs that straddle boundaries">
        <p>
          For a kernel with block size B, test sizes 1, B - 1, B, B + 1, 2B - 1, 2B and 2B + 1 (<C>boundary_sizes</C>), plus one size
          large enough that every program does several iterations of its loops, and one where a row no longer fits in a single block.
          Test non-contiguous views, such as transposes and slices with a step, and dimensions of size 1. Integer index arithmetic needs
          one case large enough to overflow 32-bit offsets, run rarely because it is expensive.
        </p>
      </Definition>

      <Definition title="tolerances against a baseline">
        <p>
          Compute the reference in float64. Run a trusted implementation, usually plain PyTorch, in the kernel&apos;s own dtype, and
          measure its error against the reference. Require the kernel&apos;s error to be at most a small factor times that baseline
          error, plus a tiny absolute floor (<C>passes_baseline</C>). The tolerance then scales automatically with dtype, problem size and
          conditioning, and a kernel that is merely as accurate as PyTorch passes while one that is ten times worse fails.
        </p>
        <Code>{COMPARE}</Code>
      </Definition>

      <Theorem title="rounding error of a sum">
        <p>
          Summing <M>{"x_1, \\dots, x_K"}</M> left to right in floating point with unit roundoff u gives <M>{"\\hat{s}"}</M> with{" "}
          <M>{"|\\hat{s} - s| \\le \\gamma_{K-1}\\sum_i |x_i|"}</M>, where <M>{"\\gamma_n = nu/(1 - nu)"}</M> and{" "}
          <M>{"(K-1)u < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each addition is exact up to a relative error: <M>{"\\hat{s}_k = (\\hat{s}_{k-1} + x_k)(1 + \\delta_k)"}</M> with{" "}
          <M>{"|\\delta_k| \\le u"}</M> and <M>{"\\hat{s}_1 = x_1"}</M>. Unrolling,{" "}
          <M>{"\\hat{s} = \\sum_i x_i \\prod_{k=\\max(i,2)}^{K}(1 + \\delta_k)"}</M>, and each product contains at most K - 1 factors. A
          product of n factors <M>{"1 + \\delta"}</M> with <M>{"|\\delta| \\le u"}</M> lies within <M>{"\\gamma_n"}</M> of 1, by induction
          on n using <M>{"(1+\\gamma_{n-1})(1+u) \\le 1 + \\gamma_n"}</M>. So{" "}
          <M>{"|\\hat{s} - s| \\le \\sum_i |x_i|\\,\\gamma_{K-1}"}</M>.
        </p>
      </Proof>

      <Remark title="what the bound says about tests">
        <p>
          The error scales with the length of the reduction and with <M>{"\\sum|x_i|"}</M>, not with <M>{"|s|"}</M>. A fixed relative
          tolerance is therefore wrong in both directions: too strict when terms cancel, too loose for short sums. Errors in practice grow
          more like <M>{"\\sqrt{K}\\,u"}</M> because rounding errors partly cancel, which is why a measured baseline beats the worst-case
          bound for setting tolerances. The bound also explains the bfloat16 accumulator bug in the figure: with u = 2⁻⁸, a reduction of
          a thousand terms can lose all its digits, while small test sizes hide it.
        </p>
      </Remark>

      <Definition title="guards, determinism and gradients">
        <p>
          Allocate the output with extra elements after it, fill them with a canary value and check them afterwards (<C>guarded_run</C>);{" "}
          <C>compute-sanitizer</C> finds out-of-bounds accesses and shared-memory races more thoroughly but runs far slower. Run every
          case twice and compare bits (<C>deterministic</C>): kernels without atomics should match exactly, and kernels with atomics
          should be documented as non-deterministic. Check backward kernels with finite differences in float64 (e5.4.1) on small shapes,
          and against the reference on large ones.
        </p>
        <Code>{HARNESS}</Code>
        <Code>{PYTEST}</Code>
      </Definition>

      <Example title="the puzzle, resolved">
        <p>
          Sizes that are multiples of every block size never exercise masks or tails; contiguous inputs never test strides; float32
          inputs hide bfloat16 accumulation error; and a single run cannot reveal a race. <C>allclose</C> with fixed tolerances was
          either too loose to see a slow drift or would have been too strict for honest bfloat16 error. The suite should have used
          boundary sizes, strided views, both dtypes, a float64 reference with a baseline-relative tolerance, guard values and repeated
          runs.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ulp",
      rung: "check",
      prompt: <p>What is the spacing between consecutive bfloat16 numbers near 3.0?</p>,
      answer: { kind: "numeric", value: 0.015625, tolerance: 1e-9 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A kernel sums 4096 terms in float32 (u = 2⁻²⁴), and the absolute values of the terms add up to 100. Ignoring the{" "}
          <M>{"1/(1 - nu)"}</M> factor, what is the worst-case error bound of the theorem? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0244, tolerance: 0.0001 },
    },
    {
      key: "guard",
      rung: "apply",
      prompt: <p>A kernel&apos;s mask lets it write one element past the end of its output. Which test is designed to catch this?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fill memory after the output with a canary value and check it is unchanged",
          "Compare the output with a float64 reference",
          "Run the kernel twice and compare the outputs bit for bit",
          "Check the gradient with finite differences",
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

def ulp_bf16(x):
    return 2.0 ** (math.floor(math.log2(abs(x))) - 7)   # 7 stored mantissa bits

def max_abs_err(a, b):
    return max(abs(x - y) for x, y in zip(a, b))

def passes_baseline(out, ref, base, factor):
    # the kernel may be at most \`factor\` times as far from a high-precision reference
    # as a trusted low-precision implementation is
    return max_abs_err(out, ref) <= factor * max_abs_err(base, ref)

ref, out, base = [1.0, 2.0, -3.0], [1.0, 2.01, -3.0], [1.0, 2.0, -2.98]
print(ulp_bf16(1.0), ulp_bf16(-200.0), round(max_abs_err(out, ref), 3), passes_baseline(out, ref, base, 2.0), passes_baseline(base, ref, out, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0078125 1.0 0.01 True False",
          "0.0078125 2.0 0.01 True False",
          "0.00390625 1.0 0.01 True False",
          "0.0078125 1.0 0.01 False False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def boundary_sizes(BLOCK):
    return sorted({1, BLOCK - 1, BLOCK, BLOCK + 1, 2 * BLOCK - 1, 2 * BLOCK, 2 * BLOCK + 1})

def guarded_run(kernel, x, pad, canary):
    out = [0.0] * len(x) + [canary] * pad          # guard values after the real output
    kernel(x, out)
    return out[:len(x)], all(v == canary for v in out[len(x):])

def deterministic(kernel, x, runs):
    first = kernel(x)
    return all(kernel(x) == first for _ in range(runs - 1))   # bitwise equality

bad = lambda x, out: out.__setitem__(slice(0, len(x) + 1), [2 * v for v in x] + [0.0])
print(boundary_sizes(4), guarded_run(bad, [1.0, 2.0], 2, -1.0), deterministic(lambda x: sum(sorted(x)), [0.1, 0.2, 0.3], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 3, 4, 5, 7, 8, 9] ([2.0, 4.0], False) True",
          "[1, 3, 4, 5, 7, 8, 9] ([2.0, 4.0], True) True",
          "[3, 4, 5, 7, 8, 9] ([2.0, 4.0], False) True",
          "[1, 3, 4, 5, 7, 8, 9] ([2.0, 4.0, 0.0], False) True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ulp_bf16(x)</C>, the spacing of bfloat16 numbers at a non-zero x; <C>max_abs_err(a, b)</C>; and{" "}
          <C>passes_baseline(out, ref, base, factor)</C>, true when the output&apos;s largest error against the reference is at most
          factor times the baseline&apos;s.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ulp_bf16(x):
    return 0.0

def max_abs_err(a, b):
    return 0.0

def passes_baseline(out, ref, base, factor):
    return True
`,
        solution: COMPARE,
        tests: [
          { name: "ulp", code: `assert ulp_bf16(0.75) == 2 ** -8 and ulp_bf16(-1000.0) == 4.0\nassert max_abs_err([1.0, 2.0], [1.5, 1.0]) == 1.0` },
          { name: "baseline", code: `assert passes_baseline([1.0, 1.1], [1.0, 1.0], [1.0, 1.04], 2.0) is False\nassert passes_baseline([1.0, 1.1], [1.0, 1.0], [1.0, 1.04], 3.0) is True\nassert passes_baseline([2.0], [2.0], [2.0], 1.0) is True` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>boundary_sizes(BLOCK)</C>, the sorted sizes of the definition without duplicates;{" "}
          <C>guarded_run(kernel, x, pad, canary)</C>, which calls <C>kernel(x, out)</C> on an output followed by pad canaries and returns
          (output, whether the canaries survived); and <C>deterministic(kernel, x, runs)</C>, which calls <C>kernel(x)</C> runs times and
          reports whether every result equals the first.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def boundary_sizes(BLOCK):
    return [BLOCK]

def guarded_run(kernel, x, pad, canary):
    return list(x), True

def deterministic(kernel, x, runs):
    return True
`,
        solution: HARNESS,
        tests: [
          { name: "sizes", code: `assert boundary_sizes(128) == [1, 127, 128, 129, 255, 256, 257] and boundary_sizes(2) == [1, 2, 3, 4, 5]\ngood = lambda x, out: out.__setitem__(slice(0, len(x)), [v + 1 for v in x])\nassert guarded_run(good, [1.0, 5.0], 3, 9.0) == ([2.0, 6.0], True)` },
          { name: "races", code: `import itertools\norders = itertools.cycle([[0, 1, 2], [2, 1, 0]])\ndef racy(x):\n    s = 0.0\n    for i in next(orders):\n        s += x[i]\n    return s\nassert deterministic(racy, [1.0, 1e-16, 1e-16], 2) is False\nassert deterministic(lambda x: sum(x), [0.1] * 3, 5) is True` },
        ],
      },
    },
    {
      key: "atomics",
      rung: "stretch",
      prompt: (
        <p>
          Three programs add 1, 2⁻²⁴ and 2⁻²⁴ with float32 atomic additions into an accumulator that starts at 0, in a uniformly random
          order. Rounding is to nearest, ties to even. What is the probability that the result is larger than 1?
        </p>
      ),
      answer: { kind: "numeric", value: 0.333, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course has gone from threads and warps to tiled matrix multiplication, Triton, FlashAttention, low-precision kernels and the
        engineering that makes them usable. The next course scales out instead of in: many GPUs, the collectives that connect them, and
        the parallelism strategies that keep each one as busy as the kernels here keep a single SM.
      </p>
    </>
  ),
};
