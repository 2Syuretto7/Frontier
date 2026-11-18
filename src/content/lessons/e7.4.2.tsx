import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IntensityMapViz } from "@/components/viz/IntensityMapViz";
import type { LessonContent } from "@/lib/types";

const RATIO = `def intensity(flops, nbytes):
    return flops / nbytes

def matmul_intensity(m, n, k, size=2):
    return 2 * m * n * k / (size * (m * k + k * n + m * n))

def ridge(peak_flops, bandwidth):
    return peak_flops / bandwidth`;

const SHAPES = `def min_batch(d_in, d_out, ridge, size=2):
    limit = 2 / (size * (1 / d_in + 1 / d_out))
    if limit <= ridge:
        return None
    m = 1
    while 2 * m * d_in * d_out < ridge * size * (m * d_in + d_in * d_out + m * d_out):
        m += 1
    return m

def tiled_intensity(n, b, size=2):
    return n * b / (size * (n + b))

def chain_intensity(flops_per, size=2, fused=True):
    return sum(flops_per) / (2 * size * (1 if fused else len(flops_per)))`;

export const lesson: LessonContent = {
  id: "e7.4.2",
  minutes: 50,
  links: {
    requires: ["e7.4.1"],
    revisits: ["e6.4.5", "e7.2.3"],
    foreshadows: ["e7.4.3", "e7.6.3"],
  },

  puzzle: (
    <>
      <p>
        Serving a language model to one user at a time, the GPU&apos;s arithmetic units sit idle almost all the time. Serve
        a few hundred users at once, batching their requests into one matrix product, and each user&apos;s tokens arrive
        almost as fast as before while the GPU does a few hundred times more work. Where did the spare capacity come from,
        and why does it run out at a few hundred?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Divide an operation&apos;s FLOPs by its bytes. A GPU can supply a fixed number of FLOPs for every byte it moves, a
        few hundred on current hardware. An operation that needs fewer FLOPs per byte than that leaves arithmetic idle while
        it waits for data; one that needs more keeps the arithmetic busy. For a matrix product the ratio is governed by the
        smallest of its three dimensions, so a product with one row, or one column, can never keep a GPU busy.
      </p>
      <IntensityMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="arithmetic intensity and the ridge">
        <p>
          The <em>arithmetic intensity</em> of an operation is <M>{"I = F/Q"}</M>, its FLOPs divided by the bytes it moves
          (e6.4.5). A machine with peak compute P FLOP/s and memory bandwidth β bytes/s has <em>ridge point</em>{" "}
          <M>{"P/\\beta"}</M>: about 295 FLOPs per byte for an H100 in bf16. An operation is memory-bound if{" "}
          <M>{"I < P/\\beta"}</M> and can be compute-bound otherwise.
        </p>
        <Code>{RATIO}</Code>
      </Definition>

      <Theorem title="intensity of a matrix product">
        <p>With s bytes per element, the intensity of an m × k by k × n product is</p>
        <MD>{"I = \\frac{2}{s}\\cdot\\frac{1}{1/m + 1/n + 1/k},"}</MD>
        <p>
          so <M>{"\\tfrac{2}{3s}\\min(m,n,k) \\le I < \\tfrac{2}{s}\\min(m,n,k)"}</M>. In particular the product can reach a
          ridge R only if every dimension exceeds <M>{"sR/2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Divide <M>{"2mnk"}</M> by <M>{"s(mk + kn + mn)"}</M> and then numerator and denominator by mnk: the denominator
          becomes <M>{"s(1/n + 1/m + 1/k)"}</M>. Each reciprocal is at most <M>{"1/\\min"}</M>, so the sum is at most{" "}
          <M>{"3/\\min"}</M>, which gives the lower bound; the sum is more than the largest reciprocal, <M>{"1/\\min"}</M>,
          which gives the upper bound. If <M>{"I \\ge R"}</M> then <M>{"1/x < 1/m + 1/n + 1/k \\le 2/(sR)"}</M> for each
          dimension x, so <M>{"x > sR/2"}</M>.
        </p>
      </Proof>

      <Example title="batching">
        <p>
          A linear layer with a <M>{"d \\times d"}</M> weight applied to a batch of b rows has intensity{" "}
          <M>{"1/(1/b + 2/d)"}</M> in bf16, which is about b while b is much less than d. With one request the intensity is
          about 1, three hundred times below the ridge; with b in the low hundreds the layer approaches it, and beyond it
          the layer is compute-bound and more batching makes each step slower. That is the spare capacity of the puzzle and
          where it runs out. <C>min_batch</C> finds the smallest batch that reaches a given ridge, or reports that none can,
          since the intensity can never exceed <M>{"(2/s)/(1/d_{\\text{in}} + 1/d_{\\text{out}})"}</M>.
        </p>
        <Code>{SHAPES}</Code>
      </Example>

      <Theorem title="intensity is a property of the memory level">
        <p>
          Multiplying two <M>{"n \\times n"}</M> matrices in tiles of side b that fit in fast memory (e7.2.3) has intensity{" "}
          <M>{"nb / (s(n + b))"}</M> with respect to the slow memory, which increases with b and is about b/s while b is much smaller
          than n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The FLOPs are <M>{"2n^3"}</M> and the traffic from slow memory is <M>{"s(2n^3/b + 2n^2)"}</M> by the tiling
          theorem. Dividing, <M>{"2n^3 / (s(2n^3/b + 2n^2)) = nb/(s(n + b))"}</M>. So the same operation has many intensities:
          large with respect to HBM if it is tiled well, small with respect to shared memory or registers. Each level of the
          hierarchy has its own bandwidth and its own ridge, and a kernel is limited by whichever level it is furthest below.
        </p>
      </Proof>

      <Remark title="everything else is memory-bound">
        <p>
          Elementwise operations, normalisations and softmax do a handful of FLOPs per element, so their intensity is about
          one, and fusion raises it only by the number of operations fused: <C>chain_intensity</C> shows four operations
          at 0.44 FLOPs per byte unfused and 1.75 fused, both far below any ridge. Such operations should be fused into the
          neighbouring matrix product, so that their data never makes a separate trip to memory at all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "square",
      rung: "check",
      prompt: <p>What is the arithmetic intensity, in FLOPs per byte, of a 1024 × 1024 by 1024 × 1024 product in bf16? Give two decimals.</p>,
      answer: { kind: "numeric", value: 341.33, tolerance: 0.006 },
    },
    {
      key: "ridge",
      rung: "check",
      prompt: <p>What is the ridge point, in FLOPs per byte, of a GPU with 312 TFLOP/s of bf16 compute and 2.0 TB/s of bandwidth?</p>,
      answer: { kind: "numeric", value: 156, tolerance: 0.001 },
    },
    {
      key: "batch",
      rung: "apply",
      prompt: <p>Why does batching 64 requests into one matrix product make inference far more efficient on a GPU?</p>,
      answer: {
        kind: "choice",
        options: [
          "The weights are read once for all 64 rows, so the intensity rises from about 1 to about 64 FLOPs per byte",
          "Each request needs fewer FLOPs when batched",
          "Batching reduces the size of the weights",
          "The GPU clock speed increases with batch size",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def intensity(flops, nbytes):
    return flops / nbytes

def matmul_intensity(m, n, k, size=2):
    return 2 * m * n * k / (size * (m * k + k * n + m * n))

def ridge(peak_flops, bandwidth):
    return peak_flops / bandwidth

print(round(ridge(989e12, 3.35e12)), round(matmul_intensity(4096, 4096, 4096), 2), matmul_intensity(1, 4096, 4096) < 1)
print(round(matmul_intensity(1, 4096, 4096), 4), round(matmul_intensity(512, 4096, 4096)), intensity(10, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "295 1365.33 True\n0.9995 410 2.5",
          "295 1365.33 False\n0.9995 410 2.5",
          "295 2048.0 True\n0.9995 410 2.5",
          "295 1365.33 True\n0.9995 512 2.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def min_batch(d_in, d_out, ridge, size=2):
    limit = 2 / (size * (1 / d_in + 1 / d_out))
    if limit <= ridge:
        return None
    m = 1
    while 2 * m * d_in * d_out < ridge * size * (m * d_in + d_in * d_out + m * d_out):
        m += 1
    return m

def tiled_intensity(n, b, size=2):
    return n * b / (size * (n + b))

def chain_intensity(flops_per, size=2, fused=True):
    return sum(flops_per) / (2 * size * (1 if fused else len(flops_per)))

print(min_batch(4096, 4096, 295), min_batch(4096, 4096, 5000), min_batch(8192, 28672, 295))
print(round(tiled_intensity(4096, 64), 2), tiled_intensity(4096, 4096), chain_intensity([1, 1, 4, 1]), chain_intensity([1, 1, 4, 1], fused=False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "345 None 310\n31.51 1024.0 1.75 0.4375",
          "295 None 310\n31.51 1024.0 1.75 0.4375",
          "345 5000 310\n31.51 1024.0 1.75 0.4375",
          "345 None 310\n32.0 2048.0 1.75 0.4375",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>intensity(flops, nbytes)</C>; <C>matmul_intensity(m, n, k, size=2)</C>; and{" "}
          <C>ridge(peak_flops, bandwidth)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def intensity(flops, nbytes):
    return 0.0

def matmul_intensity(m, n, k, size=2):
    return 0.0

def ridge(peak_flops, bandwidth):
    return 0.0
`,
        solution: RATIO,
        tests: [
          { name: "intensity", code: `assert intensity(10, 4) == 2.5 and abs(matmul_intensity(1024, 1024, 1024) - 1024 / 3) < 1e-9 and abs(matmul_intensity(4096, 4096, 4096) - 4096 / 3) < 1e-9
assert abs(matmul_intensity(1, 4096, 4096) - 1 / (1 + 2 / 4096)) < 1e-12 and abs(matmul_intensity(2, 3, 6, size=4) - 0.5) < 1e-12` },
          { name: "ridge", code: `assert round(ridge(989e12, 3.35e12)) == 295 and ridge(312e12, 2e12) == 156.0
for m, n, k in [(7, 300, 50), (1, 1, 1), (4096, 64, 9000)]:
    I = matmul_intensity(m, n, k); lo = min(m, n, k)
    assert lo / 3 - 1e-9 <= I < lo, (m, n, k, I)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Without using the earlier functions, write <C>min_batch(d_in, d_out, ridge, size=2)</C>, the smallest m for which an
          m × d_in by d_in × d_out product reaches the ridge, or <C>None</C> if no m can; <C>tiled_intensity(n, b, size=2)</C>;
          and <C>chain_intensity(flops_per, size=2, fused=True)</C>, the FLOPs per byte of a chain of unary elementwise
          operations whose FLOPs per element are listed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def min_batch(d_in, d_out, ridge, size=2):
    return 1

def tiled_intensity(n, b, size=2):
    return 0.0

def chain_intensity(flops_per, size=2, fused=True):
    return 0.0
`,
        solution: SHAPES,
        tests: [
          { name: "batch", code: `assert min_batch(4096, 4096, 295) == 345 and min_batch(8192, 28672, 295) == 310 and min_batch(4096, 4096, 5000) is None
assert min_batch(100, 100, 10) == 13 and min_batch(100, 100, 50) is None and min_batch(4096, 4096, 0.5) == 1 and min_batch(4096, 4096, 295, size=1) == 159` },
          { name: "tiles and chains", code: `assert abs(tiled_intensity(4096, 64) - 4096 * 64 / (2 * 4160)) < 1e-9 and tiled_intensity(4096, 4096) == 1024.0 and tiled_intensity(10, 10) == 2.5
assert chain_intensity([1, 1, 4, 1]) == 1.75 and chain_intensity([1, 1, 4, 1], fused=False) == 0.4375 and chain_intensity([3]) == 0.75 and chain_intensity([3], size=1) == 1.5` },
        ],
      },
    },
    {
      key: "smallest",
      rung: "stretch",
      prompt: (
        <p>
          On a GPU with a ridge of 156 FLOPs per byte, what is the smallest batch m for which an m × 8192 by 8192 × 8192
          product in bf16 reaches the ridge?
        </p>
      ),
      answer: { kind: "numeric", value: 163, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Intensity and the ridge combine into a single picture of what a kernel can achieve: the roofline, which the next
        lesson extends with several memory levels and with ceilings below the peak.
      </p>
    </>
  ),
};
