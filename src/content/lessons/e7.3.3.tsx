import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AccumulatorPrecisionViz } from "@/components/viz/AccumulatorPrecisionViz";
import type { LessonContent } from "@/lib/types";

const TILES = `def pad_to(x, multiple):
    return -(-x // multiple) * multiple

def mma_count(m, n, k, tm=16, tn=8, tk=16):
    return (pad_to(m, tm) // tm) * (pad_to(n, tn) // tn) * (pad_to(k, tk) // tk)

def padding_efficiency(m, n, k, tm=16, tn=8, tk=16):
    return m * n * k / (pad_to(m, tm) * pad_to(n, tn) * pad_to(k, tk))`;

const LOWP = `import struct

def f32(x):
    return struct.unpack('<f', struct.pack('<f', x))[0]

def to_bf16(x):
    b = struct.unpack('<I', struct.pack('<f', x))[0]
    b += 0x7FFF + ((b >> 16) & 1)
    return struct.unpack('<f', struct.pack('<I', b >> 16 << 16))[0]

def dot_lowp(a, b, bf16_acc=False):
    s = 0.0
    for x, y in zip(a, b):
        p = to_bf16(x) * to_bf16(y)
        s = to_bf16(s + p) if bf16_acc else f32(s + p)
    return s`;

export const lesson: LessonContent = {
  id: "e7.3.3",
  minutes: 50,
  links: {
    requires: ["e7.3.2", "m11.1.4"],
    revisits: ["e7.2.2"],
    foreshadows: ["e7.4.1", "e7.5.1"],
  },

  puzzle: (
    <>
      <p>
        An H100 can do about 67 trillion float32 operations a second on its ordinary cores, and about 989 trillion in
        bfloat16 on its tensor cores, nearly fifteen times as many. Yet if you summed a long vector in bfloat16 you would
        get nonsense: two thousand numbers between 0 and 1 add up to 256. How can the same chip be both so fast and so
        careless, and how do training runs get the speed without the nonsense?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A tensor core is a small matrix-multiply unit. Instead of one multiply-add per lane per instruction, a warp hands it
        small tiles of two matrices and gets back their product added to a third, hundreds of multiply-adds in one go.
        Making the inputs narrow, 16 bits instead of 32, halves the wiring and the data to move, which is where the speed
        comes from. The trick that keeps it accurate is to multiply in low precision but accumulate in float32.
      </p>
      <AccumulatorPrecisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tensor cores and MMA">
        <p>
          A <em>matrix multiply-accumulate</em> (MMA) instruction computes <M>{"D = AB + C"}</M> for small tiles, executed
          by a warp together: on Ampere and Hopper GPUs one shape for 16-bit inputs is <C>m16n8k16</C>, a 16 × 16 tile of A
          times a 16 × 8 tile of B added to a 16 × 8 tile of C, which is 2048 multiply-adds. Inputs may be fp16, bf16, tf32
          or fp8; the accumulator C and D are usually fp32. A large matrix product is tiled into such instructions, so each
          dimension is padded up to a multiple of the tile.
        </p>
        <Code>{TILES}</Code>
      </Definition>

      <Theorem title="padding waste">
        <p>
          Covering an <M>{"m \\times k"}</M> by <M>{"k \\times n"}</M> product with tiles of shape <M>{"t_m, t_n, t_k"}</M>{" "}
          takes <M>{"\\lceil m/t_m \\rceil \\lceil n/t_n \\rceil \\lceil k/t_k \\rceil"}</M> instructions, and the fraction
          of their multiply-adds that is useful is
        </p>
        <MD>{"\\frac{mnk}{t_m\\lceil m/t_m \\rceil \; t_n\\lceil n/t_n \\rceil \; t_k\\lceil k/t_k \\rceil}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Along each dimension the smallest number of tiles that covers it is the ceiling (as for grid sizes in e7.3.1),
          and the tiles of the three dimensions combine independently, so the count is the product. Each instruction does{" "}
          <M>{"t_m t_n t_k"}</M> multiply-adds over the padded box, of which the <M>{"mnk"}</M> inside the real matrices are
          useful. The fraction is close to 1 for large dimensions but can be poor for small or awkward ones, which is why
          model dimensions are chosen as multiples of 64 or 128, and why padding a vocabulary of 50 257 tokens to 50 304
          speeds up a language model&apos;s output layer even though it adds work.
        </p>
      </Proof>

      <Theorem title="bf16 products are exact in fp32">
        <p>
          The product of two finite bf16 numbers is exactly representable in fp32, unless it overflows or underflows the
          fp32 range.
        </p>
      </Theorem>
      <Proof>
        <p>
          A bf16 number is <M>{"\\pm m \\cdot 2^e"}</M> with an integer significand <M>{"m < 2^8"}</M>. The product of two
          is <M>{"\\pm m m' 2^{e + e'}"}</M> with <M>{"m m' < 2^{16}"}</M>, and fp32 represents every integer significand below{" "}
          <M>{"2^{24}"}</M> at any exponent in its range. So the only rounding in a tensor-core dot product with fp32
          accumulation is in the additions, which fp32 does with 24 significant bits.
        </p>
      </Proof>

      <Theorem title="a bf16 accumulator stalls">
        <p>
          If every term is in <M>{"[0, 1)"}</M> and the running sum is rounded to bf16 after each addition, starting from 0,
          the sum never exceeds 256, whatever the number of terms.
        </p>
      </Theorem>
      <Proof>
        <p>
          With 8 significant bits, bf16 numbers in <M>{"[256, 512)"}</M> are spaced 2 apart, and those in{" "}
          <M>{"[128, 256)"}</M> are spaced 1 apart. Suppose the sum s is at most 256. Then <M>{"s + x < 257"}</M>, and every
          real number below 257 is nearer to 256 or to a smaller bf16 number than to 258, so the rounded sum is at most 256
          again. By induction the sum stays at or below 256, while the true sum of n uniform terms grows like n/2. The
          same argument with the terms scaled shows that a bf16 accumulator stalls once the gap between neighbouring
          values exceeds twice the largest term.
        </p>
        <Code>{LOWP}</Code>
      </Proof>

      <Example title="what the hardware numbers mean">
        <p>
          On an H100 SXM, dense bf16 tensor-core throughput is about 989 TFLOPS, against about 67 TFLOPS for fp32 on the
          ordinary cores; fp8 doubles the tensor figure again. A 4096 × 4096 × 4096 matrix product is{" "}
          <M>{"2 \\cdot 4096^3 \\approx 1.37 \\times 10^{11}"}</M> floating-point operations, about 0.14 ms at the bf16 peak.
          Anything that is not a matrix product, a softmax, a layer norm, an activation, runs on the ordinary cores at a
          fifteenth of that rate, which is why such operations are fused into the matrix products wherever possible.
        </p>
      </Example>

      <Remark title="tf32 and fp8">
        <p>
          TF32 is fp32 with the significand cut to 11 bits, which tensor cores can take in place of fp32 inputs so that
          existing fp32 code runs on them; PyTorch enables it for matrix products with{" "}
          <C>torch.backends.cuda.matmul.allow_tf32</C>. FP8 halves the bits again, and with so little range it needs scale
          factors per tensor or per block (m11.1.4). In every case the accumulator stays wide.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many m16n8k16 MMA instructions does a 128 × 128 × 128 matrix product need?</p>,
      answer: { kind: "numeric", value: 1024, tolerance: 0 },
    },
    {
      key: "time",
      rung: "check",
      prompt: <p>At 989 TFLOPS, how long does a 4096 × 4096 × 4096 matrix product take at the very least, in milliseconds? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.139, tolerance: 0.0006 },
    },
    {
      key: "acc",
      rung: "apply",
      prompt: <p>Why do tensor cores take bf16 inputs but accumulate in fp32?</p>,
      answer: {
        kind: "choice",
        options: [
          "Products of bf16 numbers are exact in fp32, and a long sum needs fp32's 24 significant bits or small terms round away",
          "fp32 accumulators are faster than bf16 ones",
          "bf16 cannot represent numbers larger than 256",
          "The inputs are converted to fp32 before multiplying, so the products are rounded",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pad_to(x, multiple):
    return -(-x // multiple) * multiple

def mma_count(m, n, k, tm=16, tn=8, tk=16):
    return (pad_to(m, tm) // tm) * (pad_to(n, tn) // tn) * (pad_to(k, tk) // tk)

def padding_efficiency(m, n, k, tm=16, tn=8, tk=16):
    return m * n * k / (pad_to(m, tm) * pad_to(n, tn) * pad_to(k, tk))

print(pad_to(1000, 16), pad_to(64, 16), mma_count(16, 8, 16), mma_count(1000, 1000, 1000))
print(round(padding_efficiency(1000, 1000, 1000), 4), padding_efficiency(4096, 4096, 4096), round(padding_efficiency(17, 8, 16), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1008 64 1 496125\n0.9842 1.0 0.5312",
          "1008 64 1 488281\n0.9842 1.0 0.5312",
          "1008 80 1 496125\n0.9842 1.0 0.5312",
          "1008 64 1 496125\n0.9842 1.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import struct

def f32(x):
    return struct.unpack('<f', struct.pack('<f', x))[0]

def to_bf16(x):
    b = struct.unpack('<I', struct.pack('<f', x))[0]
    b += 0x7FFF + ((b >> 16) & 1)
    return struct.unpack('<f', struct.pack('<I', b >> 16 << 16))[0]

def dot_lowp(a, b, bf16_acc=False):
    s = 0.0
    for x, y in zip(a, b):
        p = to_bf16(x) * to_bf16(y)
        s = to_bf16(s + p) if bf16_acc else f32(s + p)
    return s

print(to_bf16(1.0), to_bf16(1.00390625), to_bf16(1.01171875), to_bf16(3.14159), f32(0.1) == 0.1)
print(dot_lowp([1.0] * 1000, [1.0] * 1000), dot_lowp([1.0] * 1000, [1.0] * 1000, bf16_acc=True), dot_lowp([3.0], [0.1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 1.0 1.015625 3.140625 False\n1000.0 256.0 0.30029296875",
          "1.0 1.0078125 1.015625 3.140625 False\n1000.0 256.0 0.30029296875",
          "1.0 1.0 1.0078125 3.140625 False\n1000.0 256.0 0.30029296875",
          "1.0 1.0 1.015625 3.140625 False\n1000.0 1000.0 0.30000001192092896",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pad_to(x, multiple)</C>, the smallest multiple at least x; <C>mma_count(m, n, k, tm=16, tn=8, tk=16)</C>;
          and <C>padding_efficiency(m, n, k, tm=16, tn=8, tk=16)</C>, the useful fraction of the multiply-adds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pad_to(x, multiple):
    return x

def mma_count(m, n, k, tm=16, tn=8, tk=16):
    return m * n * k // (tm * tn * tk)

def padding_efficiency(m, n, k, tm=16, tn=8, tk=16):
    return 1.0
`,
        solution: TILES,
        tests: [
          { name: "count", code: `assert pad_to(1000, 16) == 1008 and pad_to(64, 16) == 64 and pad_to(1, 128) == 128 and pad_to(0, 8) == 0 and pad_to(50257, 64) == 50304
assert mma_count(16, 8, 16) == 1 and mma_count(128, 128, 128) == 1024 and mma_count(1000, 1000, 1000) == 496125 and mma_count(17, 9, 1) == 4
assert mma_count(64, 64, 64, tm=64, tn=64, tk=16) == 4` },
          { name: "efficiency", code: `assert padding_efficiency(4096, 4096, 4096) == 1.0 and abs(padding_efficiency(17, 8, 16) - 17 / 32) < 1e-12
assert abs(padding_efficiency(1000, 1000, 1000) - 1e9 / (1008 * 1000 * 1008)) < 1e-12 and abs(padding_efficiency(1, 1, 1) - 1 / 2048) < 1e-15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using <C>struct</C>, write <C>f32(x)</C>, rounding a Python float to float32; <C>to_bf16(x)</C>, rounding the
          float32 value of x to bfloat16 by keeping the top 16 bits of its pattern with round to nearest, ties to even; and{" "}
          <C>dot_lowp(a, b, bf16_acc=False)</C>, which rounds each input to bf16, multiplies, and adds into an accumulator
          rounded to fp32, or to bf16 when bf16_acc is true.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import struct

def f32(x):
    return x

def to_bf16(x):
    return x

def dot_lowp(a, b, bf16_acc=False):
    return sum(x * y for x, y in zip(a, b))
`,
        solution: LOWP,
        tests: [
          { name: "rounding", code: `assert f32(0.1) == 0.10000000149011612 and f32(1.0) == 1.0
assert to_bf16(1.0) == 1.0 and to_bf16(3.14159) == 3.140625 and to_bf16(-2.71875) == -2.71875 and to_bf16(65.0) == 65.0
assert to_bf16(1.00390625) == 1.0 and to_bf16(1.01171875) == 1.015625, 'Ties go to the even neighbour.'
assert to_bf16(1.0040) == 1.0078125 and to_bf16(0.1) == 0.10009765625` },
          { name: "dot", code: `assert dot_lowp([1.0] * 1000, [1.0] * 1000) == 1000.0 and dot_lowp([1.0] * 1000, [1.0] * 1000, bf16_acc=True) == 256.0
assert dot_lowp([3.0], [0.1]) == 0.30029296875 and dot_lowp([0.1, 0.2], [10, 10]) == 3.0029296875 and dot_lowp([], []) == 0.0
assert dot_lowp([0.01] * 2000, [1.0] * 2000, bf16_acc=True) == 4.0` },
        ],
      },
    },
    {
      key: "stall",
      rung: "stretch",
      prompt: (
        <p>
          Every term is a bf16 number in <M>{"[0, 0.25)"}</M>, and a bf16 accumulator starts at 0. What is the largest value
          the accumulator can ever reach, however the terms are chosen?
        </p>
      ),
      answer: { kind: "numeric", value: 64, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fast units are only useful when they are busy. The last lesson on the GPU asks how many warps an SM can keep
        resident at once, and why that number decides whether memory latency is hidden.
      </p>
    </>
  ),
};
