import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { W4A16Viz } from "@/components/viz/W4A16Viz";
import type { LessonContent } from "@/lib/types";

const PACK = `def pack_int4(vals):
    out = []
    for i in range(0, len(vals), 2):
        lo = vals[i]
        hi = vals[i + 1] if i + 1 < len(vals) else 0
        out.append(lo | (hi << 4))                # two 4-bit codes per byte, low nibble first
    return out

def unpack_int4(packed, n):
    return [(packed[i // 2] >> (4 * (i % 2))) & 15 for i in range(n)]

def quantise_groups(w, group):
    q, scales, zeros = [], [], []
    for g in range(0, len(w), group):
        lo, hi = min(w[g:g + group]), max(w[g:g + group])
        s = (hi - lo) / 15 or 1.0
        z = round(-lo / s)                        # the code that represents 0.0
        scales.append(s)
        zeros.append(z)
        q += [min(15, max(0, round(v / s) + z)) for v in w[g:g + group]]
    return q, scales, zeros`;

const GEMV = `def dequant_gemv(packed, scales, zeros, x, K, N, group):
    G = K // group                                # groups per row of the weight matrix
    y = []
    for n in range(N):                            # W is stored as N rows of K codes
        acc = 0.0
        for k in range(K):
            i = n * K + k
            code = (packed[i // 2] >> (4 * (i % 2))) & 15
            g = n * G + k // group
            acc += x[k] * (code - zeros[g]) * scales[g]   # dequantised in registers
        y.append(acc)
    return y

def bytes_per_weight(bits, group, meta_bytes):
    return bits / 8 + meta_bytes / group          # codes plus scales and zero points

def crossover_batch(bytes_per_w, bw_tbs, peak_tflops):
    return bytes_per_w * peak_tflops / (2 * bw_tbs)   # below this batch, reading weights dominates`;

const KERNEL = `@triton.jit
def w4a16_gemm(x_ptr, wq_ptr, s_ptr, z_ptr, y_ptr, M, N, K,
               BM: tl.constexpr, BN: tl.constexpr, BK: tl.constexpr, GROUP: tl.constexpr):
    pid_m, pid_n = tl.program_id(0), tl.program_id(1)
    offs_m = pid_m * BM + tl.arange(0, BM)
    offs_n = pid_n * BN + tl.arange(0, BN)
    acc = tl.zeros((BM, BN), dtype=tl.float32)
    for k0 in range(0, K, BK):
        offs_k = k0 + tl.arange(0, BK)
        x = tl.load(x_ptr + offs_m[:, None] * K + offs_k[None, :], mask=offs_m[:, None] < M, other=0.0)
        byte = tl.load(wq_ptr + (offs_k // 2)[:, None] * N + offs_n[None, :])   # two k per byte
        code = (byte >> ((offs_k % 2) * 4)[:, None]) & 0xF                     # unpack in registers
        g = offs_k // GROUP
        s = tl.load(s_ptr + g[:, None] * N + offs_n[None, :])
        z = tl.load(z_ptr + g[:, None] * N + offs_n[None, :])
        w = ((code - z) * s).to(tl.bfloat16)                                     # dequantise
        acc += tl.dot(x, w)                                                      # 16-bit tensor cores
    tl.store(y_ptr + offs_m[:, None] * N + offs_n[None, :], acc.to(tl.bfloat16), mask=offs_m[:, None] < M)`;

export const lesson: LessonContent = {
  id: "e9.5.2",
  minutes: 55,
  links: {
    requires: ["e9.5.1"],
    revisits: ["e9.2.1", "e9.3.1"],
    foreshadows: ["e12.4.2", "e12.4.4"],
  },

  puzzle: (
    <>
      <p>
        Storing a model&apos;s weights in 4 bits makes single-user generation almost four times faster, although no GPU in wide use
        multiplies 4-bit integers by 16-bit activations, and every weight must be unpacked and rescaled before it is used. The same
        kernel serving a large batch of users can be slower than plain bfloat16. How can extra work make a kernel faster, and why does
        the advantage depend on the batch?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Generating one token multiplies each weight matrix by a single vector: two FLOPs per weight, against two bytes to read it in
        bfloat16. The tensor cores wait on memory almost all the time, so shrinking the weights speeds the kernel up nearly in proportion,
        and unpacking them in registers is free because the arithmetic units were idle anyway. With a large batch the same weights feed
        many rows, the kernel becomes bound by arithmetic, and the unpacking competes with useful work.
      </p>
      <W4A16Viz />
    </>
  ),

  theory: (
    <>
      <Definition title="group-wise integer quantisation">
        <p>
          A row of weights is split into groups of g consecutive elements (often 128). Each group gets a scale s and an integer zero
          point z, and each weight a b-bit code <M>{"q = \\operatorname{clamp}(\\operatorname{round}(w/s) + z, 0, 2^b - 1)"}</M>, so that{" "}
          <M>{"w \\approx (q - z)s"}</M>. Taking <M>{"s = (\\max - \\min)/(2^b - 1)"}</M> and <M>{"z = \\operatorname{round}(-\\min/s)"}</M>{" "}
          spreads the codes over the group&apos;s range, and 0.0 maps to the code z. Two 4-bit codes are packed into each byte.
        </p>
        <Code>{PACK}</Code>
      </Definition>

      <Definition title="a weight-only quantised kernel">
        <p>
          A W4A16 kernel keeps activations in 16 bits. Each program loads packed weight bytes, extracts codes with shifts and masks,
          subtracts zero points, multiplies by scales, converts to bfloat16 and feeds the 16-bit tensor cores, accumulating in float32.
          The weights cross the memory bus in 4 bits and exist in 16 bits only in registers. The Python below computes the same product
          for a single activation vector, the decoding case.
        </p>
        <Code>{KERNEL}</Code>
        <Code>{GEMV}</Code>
      </Definition>

      <Theorem title="when weight quantisation pays">
        <p>
          For a K by N layer applied to a batch of B tokens on a GPU with bandwidth W and peak P, with weights of b bytes each, the time
          is at least <M>{"\\max(KNb/W,\\ 2BKN/P)"}</M>. The layer is memory-bound when <M>{"B < bP/(2W)"}</M>, and there the speedup of
          b-byte weights over 2-byte weights is at most <M>{"2/b"}</M>. When both versions are compute-bound, quantised weights give no
          speedup at all, and any dequantisation work makes them slower.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every weight must be read at least once, which takes KNb/W, and the product needs 2BKN operations, which take at least 2BKN/P;
          the kernel cannot finish before either. The first bound is larger exactly when <M>{"KNb/W > 2BKN/P"}</M>, that is{" "}
          <M>{"B < bP/(2W)"}</M>. If both kernels reach their memory bound, the ratio of times is (2KN/W)/(KNb/W) = 2/b, and a kernel
          cannot beat its own bound. If both are compute-bound, both need the same 2BKN tensor core operations, so their lower bounds
          coincide, and the quantised kernel also spends instructions on unpacking.
        </p>
      </Proof>

      <Remark title="making dequantisation cheap">
        <p>
          Production kernels avoid the obvious shift, mask, subtract, convert sequence. Marlin rearranges the packed weights offline so
          that each thread&apos;s loaded bytes unpack directly into its tensor core fragment (e9.2.2), and converts 4-bit integers to
          16-bit floats with a few bit operations: placing a code in the mantissa of the half-precision number 1024 and subtracting 1024
          gives the code exactly. Nonuniform 4-bit formats, such as NF4, replace the affine map with a 16-entry lookup table.
        </p>
      </Remark>

      <Remark title="quantising activations too">
        <p>
          At large batch, the way to go faster is lower-precision arithmetic, not smaller weights. W8A8 kernels quantise activations to
          int8 with a scale per token and weights with a scale per output channel; the scales factor out as in e9.5.1, and int8 tensor
          cores accumulate exactly in int32. Activation outliers make per-token scales coarse, which methods such as SmoothQuant address
          by moving part of each channel&apos;s range from the activations into the weights.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Decoding is bound by reading weights, and 4-bit weights with a 16-bit scale per 128 cost about 0.52 bytes each instead of 2,
          so the time falls by nearly 3.9 times while the unpacking hides in idle arithmetic slots. A large batch is bound by arithmetic,
          where 4-bit weights save nothing and the unpacking, repeated by every program, costs time. Servers therefore pick kernels, or
          formats, by batch size.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bits",
      rung: "check",
      prompt: (
        <p>
          Weights are stored as 4-bit codes in groups of 64, each group with a 16-bit scale and a 16-bit zero point. How many bits per
          weight is that, on average?
        </p>
      ),
      answer: { kind: "numeric", value: 4.5, tolerance: 0 },
    },
    {
      key: "int3",
      rung: "check",
      prompt: (
        <p>
          A memory-bound decoding layer moves from bfloat16 weights to 3-bit codes with one 16-bit scale per group of 128. By the
          theorem, what is the largest possible speedup? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.12, tolerance: 0.001 },
    },
    {
      key: "batch",
      rung: "apply",
      prompt: <p>A server running W4A16 kernels sees throughput fall behind bfloat16 kernels as its batches grow. Why?</p>,
      answer: {
        kind: "choice",
        options: [
          "At large batch the layer is compute-bound, so smaller weights save nothing and dequantisation adds work",
          "4-bit weights lose accuracy faster at large batch",
          "Packed weights cannot be read with coalesced loads",
          "The activations are quantised to 4 bits at large batch",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pack_int4(vals):
    out = []
    for i in range(0, len(vals), 2):
        lo = vals[i]
        hi = vals[i + 1] if i + 1 < len(vals) else 0
        out.append(lo | (hi << 4))                # two 4-bit codes per byte, low nibble first
    return out

def unpack_int4(packed, n):
    return [(packed[i // 2] >> (4 * (i % 2))) & 15 for i in range(n)]

def quantise_groups(w, group):
    q, scales, zeros = [], [], []
    for g in range(0, len(w), group):
        lo, hi = min(w[g:g + group]), max(w[g:g + group])
        s = (hi - lo) / 15 or 1.0
        z = round(-lo / s)                        # the code that represents 0.0
        scales.append(s)
        zeros.append(z)
        q += [min(15, max(0, round(v / s) + z)) for v in w[g:g + group]]
    return q, scales, zeros

q, s, z = quantise_groups([0.0, 1.2, 3.0, -1.0, 0.0, 2.0], 3)
print(pack_int4([1, 2, 15, 0]), unpack_int4(pack_int4([3, 4, 5]), 3), q, [round(v, 3) for v in s], z)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[33, 15] [3, 4, 5] [0, 6, 15, 0, 5, 15] [0.2, 0.2] [0, 5]",
          "[18, 240] [3, 4, 5] [0, 6, 15, 0, 5, 15] [0.2, 0.2] [0, 5]",
          "[33, 15] [3, 4, 5] [0, 6, 15, 0, 0, 10] [0.2, 0.2] [0, 0]",
          "[33, 15] [3, 4, 5] [0, 6, 15, 0, 5, 15] [0.2, 0.2] [0, -5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def dequant_gemv(packed, scales, zeros, x, K, N, group):
    G = K // group                                # groups per row of the weight matrix
    y = []
    for n in range(N):                            # W is stored as N rows of K codes
        acc = 0.0
        for k in range(K):
            i = n * K + k
            code = (packed[i // 2] >> (4 * (i % 2))) & 15
            g = n * G + k // group
            acc += x[k] * (code - zeros[g]) * scales[g]   # dequantised in registers
        y.append(acc)
    return y

def bytes_per_weight(bits, group, meta_bytes):
    return bits / 8 + meta_bytes / group          # codes plus scales and zero points

def crossover_batch(bytes_per_w, bw_tbs, peak_tflops):
    return bytes_per_w * peak_tflops / (2 * bw_tbs)   # below this batch, reading weights dominates

packed, s, z = [33, 15], [0.5, 1.0], [0, 8]
print(dequant_gemv(packed, s, z, [1.0, 1.0, 1.0, 1.0], 4, 1, 2), bytes_per_weight(4, 128, 2), round(crossover_batch(2.0, 3.35, 989.0), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5] 0.515625 295.2",
          "[16.5] 0.515625 295.2",
          "[0.5] 0.5 295.2",
          "[0.5] 0.515625 147.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pack_int4(vals)</C>, packing 4-bit codes two per byte with the first in the low nibble (padding an odd tail with 0);{" "}
          <C>unpack_int4(packed, n)</C>; and <C>quantise_groups(w, group)</C>, returning (codes, scales, zero points) as in the
          definition, with scale 1.0 for a constant group.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pack_int4(vals):
    return list(vals)

def unpack_int4(packed, n):
    return list(packed[:n])

def quantise_groups(w, group):
    return list(w), [1.0], [0]
`,
        solution: PACK,
        tests: [
          { name: "packing", code: `assert pack_int4([15, 0, 7]) == [15, 7] and unpack_int4([0xAB, 0x0C], 3) == [11, 10, 12]\nassert unpack_int4(pack_int4(list(range(16))), 16) == list(range(16))` },
          { name: "groups", code: `q, s, z = quantise_groups([-2.0, 0.0, 1.0, 4.0, 10.0, 10.0], 3)\nassert q == [0, 10, 15, 0, 15, 15] and z == [10, -10]\nassert abs(s[0] - 0.2) < 1e-12 and abs(s[1] - 0.4) < 1e-12\nassert quantise_groups([3.0, 3.0], 2) == ([0, 0], [1.0], [-3])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dequant_gemv(packed, scales, zeros, x, K, N, group)</C> for a weight matrix stored as N rows of K packed codes, with
          scales and zero points listed row by row and group by group; <C>bytes_per_weight(bits, group, meta_bytes)</C>; and{" "}
          <C>crossover_batch(bytes_per_w, bw_tbs, peak_tflops)</C>, the batch below which the layer is memory-bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def dequant_gemv(packed, scales, zeros, x, K, N, group):
    return [0.0] * N

def bytes_per_weight(bits, group, meta_bytes):
    return bits / 8

def crossover_batch(bytes_per_w, bw_tbs, peak_tflops):
    return 0.0
`,
        solution: GEMV,
        tests: [
          { name: "gemv", code: `packed = [240, 136, 17, 17]\ny = dequant_gemv(packed, [1.0, 0.5, 2.0, 2.0], [8, 8, 0, 0], [1.0, 2.0, 3.0, 4.0], 4, 2, 2)\nassert y == [6.0, 20.0]` },
          { name: "model", code: `assert bytes_per_weight(8, 32, 2) == 1.0625\nassert crossover_batch(1.0, 2.0, 400.0) == 100.0` },
        ],
      },
    },
    {
      key: "crossover",
      rung: "stretch",
      prompt: (
        <p>
          With the weights of the first check and a GPU with 3.35 TB/s of bandwidth and 989 TFLOP/s of 16-bit tensor core arithmetic,
          below what batch size is a layer memory-bound, by the theorem? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 83, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        A kernel is only useful once a framework can call it, differentiate through it and compile around it. The final chapter
        registers kernels as PyTorch operators and then asks how to know that they are right.
      </p>
    </>
  ),
};
