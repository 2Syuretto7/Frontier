import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { Fp8GranularityViz } from "@/components/viz/Fp8GranularityViz";
import type { LessonContent } from "@/lib/types";

const QUANT = `import math

def round_e4m3(x):
    if x == 0:
        return 0.0
    a = min(abs(x), 448.0)
    e = max(math.floor(math.log2(a)), -6)        # below 2**-6 the spacing stays 2**-9
    step = 2.0 ** (e - 3)                         # 3 mantissa bits
    return math.copysign(min(round(a / step) * step, 448.0), x)   # round half to even

def quantise(xs, block):
    block = block or len(xs)                      # None: one scale for the whole tensor
    q, scales = [], []
    for b in range(0, len(xs), block):
        g = xs[b:b + block]
        s = max(abs(v) for v in g) / 448.0 or 1.0
        scales.append(s)
        q += [round_e4m3(v / s) for v in g]
    return q, scales

def dequantise(q, scales, block):
    block = block or len(q)
    return [v * scales[i // block] for i, v in enumerate(q)]`;

const GEMM = `import math

def fp8_matmul_rowcol(Aq, sa, Bq, sb):
    return [[sa[i] * sb[j] * sum(a * Bq[k][j] for k, a in enumerate(row)) for j in range(len(sb))]
            for i, row in enumerate(Aq)]          # scales factor out: applied in the epilogue

def fp8_matmul_kblocks(Aq, sa, Bq, sb, BK):
    M, N, K = len(Aq), len(Bq[0]), len(Bq)
    C = [[0.0] * N for _ in range(M)]
    for kb in range(0, K, BK):                    # scales change along k: apply per block
        for i in range(M):
            for j in range(N):
                part = sum(Aq[i][k] * Bq[k][j] for k in range(kb, min(kb + BK, K)))
                C[i][j] += part * sa[i][kb // BK] * sb[kb // BK][j]
    return C

def accumulate(xs, bits, promote_every):
    def rnd(x):                                   # keep \`bits\` bits after the leading one
        if x == 0:
            return 0.0
        step = 2.0 ** (math.floor(math.log2(abs(x))) - bits)
        return round(x / step) * step
    total, part = 0.0, 0.0
    for i, x in enumerate(xs, 1):
        part = rnd(part + x)
        if promote_every and i % promote_every == 0:
            total, part = total + part, 0.0       # promote the partial sum to float32
    return total + part`;

const KERNEL = `@triton.jit
def fp8_gemm_blockscaled(a_ptr, b_ptr, c_ptr, sa_ptr, sb_ptr, M, N, K,
                         BM: tl.constexpr, BN: tl.constexpr, BK: tl.constexpr):
    pid_m, pid_n = tl.program_id(0), tl.program_id(1)
    offs_m = pid_m * BM + tl.arange(0, BM)
    offs_n = pid_n * BN + tl.arange(0, BN)
    offs_k = tl.arange(0, BK)
    KB = tl.cdiv(K, BK)
    acc = tl.zeros((BM, BN), dtype=tl.float32)
    for kb in range(0, KB):
        a = tl.load(a_ptr + offs_m[:, None] * K + (kb * BK + offs_k)[None, :])    # float8 E4M3
        b = tl.load(b_ptr + (kb * BK + offs_k)[:, None] * N + offs_n[None, :])
        sa = tl.load(sa_ptr + offs_m * KB + kb)          # a scale per row of A and k-block
        sb = tl.load(sb_ptr + kb * tl.cdiv(N, BN) + pid_n)   # a scale per k-block and column block
        part = tl.dot(a, b)                               # FP8 tensor cores over BK
        acc += part * sa[:, None] * sb                    # promote to float32, with the scales
    tl.store(c_ptr + offs_m[:, None] * N + offs_n[None, :], acc.to(tl.bfloat16))`;

export const lesson: LessonContent = {
  id: "e9.5.1",
  minutes: 55,
  links: {
    requires: ["e9.4.4", "m11.1.4"],
    revisits: ["e6.4.1", "e9.3.1", "m11.1.5"],
    foreshadows: ["e9.5.2", "e13.3.2"],
  },

  puzzle: (
    <>
      <p>
        FP8 tensor cores do twice the arithmetic of bfloat16 ones, and an E4M3 number carries a relative error of at most about 6%. Yet
        a matrix multiplication that simply casts its bfloat16 inputs to FP8 can lose some rows of its output entirely, and one that
        uses FP8 carefully on the same hardware trains frontier models. What separates the two?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        E4M3 has only 4 exponent bits: its values run from about 0.002 to 448, a range of about 2<sup>18</sup>. Real tensors span more
        than that, and a few outliers sit far above the rest. So FP8 is always used with scales: each group of values is divided by its
        own scale before rounding, and the scales are multiplied back in after the multiplication. The kernel&apos;s work is to choose the
        groups, carry their scales through the tile loop, and keep the accumulation itself in higher precision.
      </p>
      <Fp8GranularityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scaled FP8">
        <p>
          A group of values x is stored as E4M3 numbers q with one scale s, so that <M>{"x \\approx s q"}</M>. The usual choice is{" "}
          <M>{"s = \\max|x| / 448"}</M>, which maps the largest magnitude to the largest finite E4M3 value and can never overflow.
          Groups can be a whole tensor, a row or column, or blocks along the reduction dimension: 1 by 128 blocks of activations and
          128 by 128 blocks of weights are common, and the microscaling (MX) formats fix blocks of 32 with a power-of-two scale, which
          multiplies exactly.
        </p>
        <Code>{QUANT}</Code>
      </Definition>

      <Theorem title="relative error of scaled E4M3">
        <p>
          With <M>{"s = \\max|x|/448"}</M>, every x in the group with <M>{"|x| \\ge 2^{-6}s"}</M> is quantised with relative error at
          most <M>{"2^{-4}"}</M>. That covers every value within a factor of <M>{"448 \\cdot 2^6 = 28672"}</M> of the group&apos;s
          largest; smaller values lose relative accuracy, and those below <M>{"2^{-10}s"}</M> become zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"y = |x|/s \\le 448"}</M>, so no saturation occurs. If <M>{"2^e \\le y < 2^{e+1}"}</M> with <M>{"e \\ge -6"}</M>, the
          E4M3 values in that interval are spaced <M>{"2^{e-3}"}</M> apart, and rounding to the nearest moves y by at most{" "}
          <M>{"2^{e-4} \\le 2^{-4}y"}</M>. Multiplying back by s preserves relative error. The condition <M>{"y \\ge 2^{-6}"}</M> is{" "}
          <M>{"|x| \\ge 2^{-6}s = \\max|x| / (448 \\cdot 2^6)"}</M>. Below <M>{"2^{-6}"}</M> the spacing stays <M>{"2^{-9}"}</M>, so the
          absolute error stays <M>{"2^{-10}"}</M> while y shrinks, and any <M>{"y < 2^{-10}"}</M> rounds to 0.
        </p>
      </Proof>

      <Definition title="where the scales go in a GEMM">
        <p>
          If A has one scale per row and B one per column, then{" "}
          <M>{"\\sum_k s^A_i q^A_{ik} s^B_j q^B_{kj} = s^A_i s^B_j \\sum_k q^A_{ik} q^B_{kj}"}</M>, so the kernel multiplies FP8 tiles
          as usual and applies the scales once, in the epilogue. When scales change along k, they no longer factor out: the kernel
          multiplies one k-block on the tensor cores, scales that partial sum, and adds it to a float32 accumulator.
        </p>
        <Code>{KERNEL}</Code>
        <Code>{GEMM}</Code>
      </Definition>

      <Remark title="accumulation precision">
        <p>
          Hopper&apos;s FP8 tensor cores accumulate internally with fewer bits than float32; DeepSeek-V3&apos;s report measured roughly
          14. A long reduction then stagnates, as in m11.1.5: once the running sum is large, small products round away. The remedy, used
          there, is to promote: accumulate one k-block (128 elements) on the tensor cores and add the partial sum into float32 registers,
          which the block-scaled kernel does anyway. <C>accumulate</C> above simulates both behaviours.
        </p>
      </Remark>

      <Remark title="choosing scales in practice">
        <p>
          Computing <M>{"\\max|x|"}</M> before quantising costs a pass over the tensor. Per-tensor recipes often use delayed scaling, a
          scale from the maxima of recent steps, which saves the pass but fails on a sudden outlier; fine-grained recipes compute each
          block&apos;s maximum on the fly inside the producing kernel, where the block is already in registers. Weights and activations
          usually use E4M3; gradients, with wider range and less need for precision, sometimes use E5M2.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A plain cast is scaling by 1: values beyond 448 saturate and values below about 0.001 vanish, and with a per-tensor scale one
          outlier pushes small rows into the same fate, as the figure shows. Careful FP8 uses fine-grained scales so that every group
          sits in E4M3&apos;s accurate range, applies the scales in the right place in the kernel, and promotes partial sums to float32.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "roundtrip",
      rung: "check",
      prompt: (
        <p>
          A tensor whose largest magnitude is 1792 is quantised to E4M3 with a single scale <M>{"\\max|x|/448"}</M>. What value does the
          element 3.3 become after quantising and dequantising?
        </p>
      ),
      answer: { kind: "numeric", value: 3.25, tolerance: 0.0001 },
    },
    {
      key: "smallest",
      rung: "check",
      prompt: <p>For the same tensor and scale, what is the smallest positive value that survives the round trip?</p>,
      answer: { kind: "numeric", value: 0.0078125, tolerance: 1e-9 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: (
        <p>
          A kernel uses one scale per row of A and one scale per 128-element k-block for each column block of B. Where must the B scales
          be applied?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Inside the k loop, to each k-block's partial product before it is added to the accumulator",
          "Once, in the epilogue, after the whole reduction",
          "Before the kernel, by dequantising B to bfloat16",
          "Nowhere, since FP8 tensor cores apply scales automatically to E4M3 inputs",
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

def round_e4m3(x):
    if x == 0:
        return 0.0
    a = min(abs(x), 448.0)
    e = max(math.floor(math.log2(a)), -6)        # below 2**-6 the spacing stays 2**-9
    step = 2.0 ** (e - 3)                         # 3 mantissa bits
    return math.copysign(min(round(a / step) * step, 448.0), x)   # round half to even

def quantise(xs, block):
    block = block or len(xs)                      # None: one scale for the whole tensor
    q, scales = [], []
    for b in range(0, len(xs), block):
        g = xs[b:b + block]
        s = max(abs(v) for v in g) / 448.0 or 1.0
        scales.append(s)
        q += [round_e4m3(v / s) for v in g]
    return q, scales

def dequantise(q, scales, block):
    block = block or len(q)
    return [v * scales[i // block] for i, v in enumerate(q)]

q, s = quantise([1.0, -2.6, 448.0, 0.01], None)
print(round_e4m3(0.3), round_e4m3(1000.0), q, s, [round(v, 4) for v in quantise([1.0, 2.0, 100.0, 200.0], 2)[1]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3125 448.0 [1.0, -2.5, 448.0, 0.009765625] [1.0] [0.0045, 0.4464]",
          "0.3125 448.0 [1.0, -2.5, 448.0, 0.0] [1.0] [0.0045, 0.4464]",
          "0.3125 448.0 [1.0, -2.75, 448.0, 0.009765625] [1.0] [0.0045, 0.4464]",
          "0.3 448.0 [1.0, -2.6, 448.0, 0.01] [1.0] [0.0045, 0.4464]",
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

def fp8_matmul_rowcol(Aq, sa, Bq, sb):
    return [[sa[i] * sb[j] * sum(a * Bq[k][j] for k, a in enumerate(row)) for j in range(len(sb))]
            for i, row in enumerate(Aq)]          # scales factor out: applied in the epilogue

def fp8_matmul_kblocks(Aq, sa, Bq, sb, BK):
    M, N, K = len(Aq), len(Bq[0]), len(Bq)
    C = [[0.0] * N for _ in range(M)]
    for kb in range(0, K, BK):                    # scales change along k: apply per block
        for i in range(M):
            for j in range(N):
                part = sum(Aq[i][k] * Bq[k][j] for k in range(kb, min(kb + BK, K)))
                C[i][j] += part * sa[i][kb // BK] * sb[kb // BK][j]
    return C

def accumulate(xs, bits, promote_every):
    def rnd(x):                                   # keep \`bits\` bits after the leading one
        if x == 0:
            return 0.0
        step = 2.0 ** (math.floor(math.log2(abs(x))) - bits)
        return round(x / step) * step
    total, part = 0.0, 0.0
    for i, x in enumerate(xs, 1):
        part = rnd(part + x)
        if promote_every and i % promote_every == 0:
            total, part = total + part, 0.0       # promote the partial sum to float32
    return total + part

Aq, Bq = [[1.0, 2.0], [3.0, 4.0]], [[1.0], [1.0]]
print(fp8_matmul_rowcol(Aq, [1.0, 0.5], Bq, [2.0]), fp8_matmul_kblocks(Aq, [[1.0, 2.0], [1.0, 1.0]], Bq, [[1.0], [0.5]], 1), accumulate([4.0] + [0.25] * 4, 2, 0), accumulate([4.0] + [0.25] * 4, 2, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[6.0], [7.0]] [[3.0], [5.0]] 4.0 4.75",
          "[[6.0], [7.0]] [[3.0], [5.0]] 5.0 5.0",
          "[[6.0], [14.0]] [[3.0], [5.0]] 4.0 4.75",
          "[[6.0], [7.0]] [[3.0], [5.0]] 4.0 4.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>round_e4m3(x)</C>, rounding to the nearest E4M3 value with ties to even and saturating at 448;{" "}
          <C>quantise(xs, block)</C>, returning (q, scales) with one scale <M>{"\\max|x|/448"}</M> per block of consecutive elements
          (None for one block, and scale 1 for an all-zero block); and <C>dequantise(q, scales, block)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def round_e4m3(x):
    return x

def quantise(xs, block):
    return list(xs), [1.0]

def dequantise(q, scales, block):
    return list(q)
`,
        solution: QUANT,
        tests: [
          { name: "rounding", code: `assert round_e4m3(17.0) == 16.0 and round_e4m3(19.0) == 20.0 and round_e4m3(-500.0) == -448.0\nassert round_e4m3(2 ** -10) == 0.0 and round_e4m3(0.0) == 0.0 and round_e4m3(3 * 2 ** -10) == 2 ** -8` },
          { name: "scales", code: `q, s = quantise([0.5, -896.0, 3.0, 7.0], 2)\nassert s == [2.0, 7 / 448] and q == [0.25, -448.0, 192.0, 448.0]\nassert dequantise(q, s, 2) == [0.5, -896.0, 3.0, 7.0]\nassert quantise([0.0, 0.0], None) == ([0.0, 0.0], [1.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fp8_matmul_rowcol(Aq, sa, Bq, sb)</C> with a scale per row of A and per column of B;{" "}
          <C>fp8_matmul_kblocks(Aq, sa, Bq, sb, BK)</C>, where <C>sa[i][kb]</C> and <C>sb[kb][j]</C> scale k-block kb; and{" "}
          <C>accumulate(xs, bits, promote_every)</C>, which rounds the running partial sum to <C>bits</C> bits after its leading bit
          after every addition and, if <C>promote_every</C> is non-zero, adds the partial sum into an exact total every that many
          elements.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fp8_matmul_rowcol(Aq, sa, Bq, sb):
    return [[0.0] * len(sb) for _ in Aq]

def fp8_matmul_kblocks(Aq, sa, Bq, sb, BK):
    return [[0.0] * len(Bq[0]) for _ in Aq]

def accumulate(xs, bits, promote_every):
    return sum(xs)
`,
        solution: GEMM,
        tests: [
          { name: "matmul", code: `assert fp8_matmul_rowcol([[1.0, -1.0]], [3.0], [[2.0, 0.0], [1.0, 1.0]], [1.0, 0.5]) == [[3.0, -1.5]]\nassert fp8_matmul_kblocks([[1.0, 1.0, 1.0, 1.0]], [[1.0, 2.0]], [[1.0]] * 4, [[1.0], [3.0]], 2) == [[14.0]]` },
          { name: "accumulate", code: `assert accumulate([1.0] * 300, 6, 0) == 128.0\nassert accumulate([1.0] * 300, 6, 100) == 300.0` },
        ],
      },
    },
    {
      key: "stall",
      rung: "stretch",
      prompt: (
        <p>
          An accumulator keeps 10 bits after the leading bit and rounds to nearest, ties to even, after every addition. Starting from 0,
          it adds 0.25 again and again. At what value does the sum stop growing?
        </p>
      ),
      answer: { kind: "numeric", value: 512, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Inference often goes further than FP8, storing weights in 4 bits or fewer. Tensor cores cannot multiply such formats directly
        in every case, so kernels unpack and dequantise on the fly. The next lesson writes such kernels.
      </p>
    </>
  ),
};
