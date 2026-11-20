import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GemmLadderViz } from "@/components/viz/GemmLadderViz";
import type { LessonContent } from "@/lib/types";

const LOOPS = `def matmul_naive(A, B):
    K = len(B)
    return [[sum(A[i][k] * B[k][j] for k in range(K)) for j in range(len(B[0]))] for i in range(len(A))]

def matmul_tiled(A, B, T):
    M, K, N = len(A), len(B), len(B[0])
    C = [[0] * N for _ in range(M)]
    for i0 in range(0, M, T):
        for j0 in range(0, N, T):
            for k0 in range(0, K, T):
                for i in range(i0, min(i0 + T, M)):
                    for j in range(j0, min(j0 + T, N)):
                        C[i][j] += sum(A[i][k] * B[k][j] for k in range(k0, min(k0 + T, K)))
    return C

def global_loads(M, N, K, BM, BN):
    return M * N * K // BN + M * N * K // BM`;

const BOUNDS = `def intensity(M, N, K, BM, BN, word=4):
    loads = M * N * K / BN + M * N * K / BM + M * N
    return 2 * M * N * K / (word * loads)

def smem_reads_per_fma(rm, rn):
    return (rm + rn) / (rm * rn)

def attainable(peak, bw, ai):
    return min(peak, bw * ai)`;

const NAIVE = `// C = A B with A of shape M x K, B of shape K x N, all row-major
__global__ void sgemm_naive(const float* A, const float* B, float* C, int M, int N, int K) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;
    if (row < M && col < N) {
        float acc = 0.0f;
        for (int k = 0; k < K; k++)
            acc += A[row * K + k] * B[k * N + col];   // two global loads per multiply-add
        C[row * N + col] = acc;
    }
}`;

const SHARED = `#define T 32
__global__ void sgemm_shared(const float* A, const float* B, float* C, int M, int N, int K) {
    __shared__ float As[T][T], Bs[T][T];
    int ty = threadIdx.y, tx = threadIdx.x;
    int row = blockIdx.y * T + ty, col = blockIdx.x * T + tx;
    float acc = 0.0f;
    for (int k0 = 0; k0 < K; k0 += T) {
        // each thread loads one element of each tile; tx runs along rows, so loads coalesce
        As[ty][tx] = (row < M && k0 + tx < K) ? A[row * K + k0 + tx] : 0.0f;
        Bs[ty][tx] = (k0 + ty < K && col < N) ? B[(k0 + ty) * N + col] : 0.0f;
        __syncthreads();
        for (int k = 0; k < T; k++)
            acc += As[ty][k] * Bs[k][tx];          // operands from shared memory
        __syncthreads();                           // before the tiles are overwritten
    }
    if (row < M && col < N) C[row * N + col] = acc;
}`;

const REGS = `// inner loop of a register-tiled kernel: each thread owns an RM x RN block of C in registers
for (int k = 0; k < BK; k++) {
    float a[RM], b[RN];
    for (int i = 0; i < RM; i++) a[i] = As[k][ty * RM + i];   // RM shared loads
    for (int j = 0; j < RN; j++) b[j] = Bs[k][tx * RN + j];   // RN shared loads
    for (int i = 0; i < RM; i++)
        for (int j = 0; j < RN; j++)
            acc[i][j] += a[i] * b[j];                         // RM * RN multiply-adds
}`;

export const lesson: LessonContent = {
  id: "e9.2.1",
  minutes: 60,
  links: {
    requires: ["e9.1.3", "e7.4.3"],
    revisits: ["e7.4.2", "e9.1.2"],
    foreshadows: ["e9.2.2", "e9.2.3"],
  },

  puzzle: (
    <>
      <p>
        Multiplying two 8192 by 8192 float32 matrices takes 1.1 trillion floating-point operations, and the two inputs occupy 537 MB. A
        kernel that computes each output with its own loop asks global memory for 4.4 TB, eight thousand times the size of the inputs,
        and it runs at a tiny fraction of the GPU&apos;s peak. The data is the same and the arithmetic is the same. What has to change to
        get from that kernel to one that keeps the arithmetic units busy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every element of A is used N times and every element of B M times, so the work offers enormous reuse; the question is where the
        reuse happens. The naive kernel reuses nothing and fetches both operands of every multiply from global memory. Staging tiles in
        shared memory makes each global load serve a whole tile of outputs. Then shared memory becomes the bottleneck, and giving each
        thread a small block of outputs in registers makes each shared load serve several multiplies. Each step moves the reuse one level
        closer to the arithmetic.
      </p>
      <GemmLadderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the naive kernel">
        <p>
          One thread per element of C, each looping over k. Every multiply-add, 2 FLOP, loads 8 bytes, an arithmetic intensity of 0.25
          FLOP per byte (e7.4.2), far below the ridge point of any GPU. The loads of B coalesce, since neighbouring threads read
          neighbouring columns, and caches catch some reuse of A, but the design leaves almost all reuse on the table.
        </p>
        <Code>{NAIVE}</Code>
      </Definition>

      <Theorem title="global traffic of a block-tiled kernel">
        <p>
          Let each block compute a BM by BN tile of C, loading the BM by K strip of A and the K by BN strip of B from global memory once.
          Then the kernel loads <M>{"MNK(1/B_N + 1/B_M)"}</M> elements (<C>global_loads</C>), and with the MN stores of C its arithmetic
          intensity in float32 is <M>{"2MNK / \\big(4(MNK/B_N + MNK/B_M + MN)\\big)"}</M> (<C>intensity</C>), which for large K tends to{" "}
          <M>{"\\tfrac{1}{2}(1/B_M + 1/B_N)^{-1}"}</M> FLOP per byte.
        </p>
      </Theorem>
      <Proof>
        <p>
          There are <M>{"MN/(B_M B_N)"}</M> blocks. Each loads <M>{"B_M K"}</M> elements of A and <M>{"K B_N"}</M> of B, so the total is{" "}
          <M>{"\\frac{MN}{B_M B_N}(B_M + B_N)K = MNK(1/B_N + 1/B_M)"}</M>. Adding MN stores and multiplying by 4 bytes gives the
          denominator; the numerator counts one multiply and one add for each of the MNK products. Dividing numerator and denominator by
          MNK and letting K grow removes the store term. The naive kernel is the case <M>{"B_M = B_N = 1"}</M>.
        </p>
      </Proof>

      <Definition title="shared-memory tiling">
        <p>
          A block of 32 by 32 threads walks along K in steps of 32. At each step it loads a tile of A and a tile of B into shared memory,
          coalesced, waits, and accumulates 32 products per thread from shared memory, then waits again before the tiles are replaced.
          Global intensity rises from 0.25 to 8 FLOP per byte. But each multiply-add still reads two values from shared memory, and shared
          memory, though fast, is now the limit.
        </p>
        <Code>{SHARED}</Code>
        <p>The Python below performs the same tiled loop order and must agree exactly with the plain triple loop.</p>
        <Code>{LOOPS}</Code>
      </Definition>

      <Definition title="register tiling">
        <p>
          Let each thread compute an RM by RN block of outputs held in registers. At each k it reads RM values of A and RN of B from shared
          memory and performs RM times RN multiply-adds, so it needs <M>{"(R_M + R_N)/(R_M R_N)"}</M> shared loads per multiply-add
          (<C>smem_reads_per_fma</C>): 2 for a 1 by 1 tile, 1/2 for 4 by 4, 1/4 for 8 by 8. With block tiles of 128 by 128 and 8 by 8
          register tiles, 256 threads cover a block, and the kernel can approach the arithmetic peak (<C>attainable</C>).
        </p>
        <Code>{REGS}</Code>
        <Code>{BOUNDS}</Code>
      </Definition>

      <Remark title="the rest of the ladder">
        <p>
          Real kernels add more rungs: vectorised 16-byte loads, transposing the A tile as it is stored so that the inner loop reads
          shared memory without bank conflicts, double buffering so that the next tiles load while the current ones are used, and an
          intermediate warp tile that matches how tensor cores consume operands (next lesson). Well-known walkthroughs that climb this
          ladder by hand report reaching most of the vendor library&apos;s float32 throughput, with each rung attributable to a bottleneck
          a roofline predicts.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The naive kernel loads two operands per multiply-add: 2 times 8192 cubed floats, 4.4 TB. Tiles of 128 by 128 divide global
          traffic by 128, to about 34 GB, which the memory system delivers in a few hundredths of a second, and 8 by 8 register tiles cut
          shared-memory traffic by a factor of eight. Both bottlenecks are removed by reuse at the right level, and the kernel becomes
          limited by arithmetic, as a matrix multiplication should be.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "naive",
      rung: "check",
      prompt: (
        <p>
          A naive kernel multiplies two 4096 by 4096 float32 matrices, loading both operands of every multiply-add from global memory. How
          many gigabytes (<M>{"10^9"}</M> bytes) does it load?
        </p>
      ),
      answer: { kind: "numeric", value: 549.756, tolerance: 0.1 },
    },
    {
      key: "tile",
      rung: "check",
      prompt: (
        <p>
          A float32 kernel uses block tiles of 256 by 128 outputs. Ignoring the cost of writing C, what is its global arithmetic intensity
          in FLOP per byte for large K? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 42.667, tolerance: 0.01 },
    },
    {
      key: "regs",
      rung: "apply",
      prompt: <p>A shared-memory tiled kernel with one output per thread runs well below peak even though its global intensity is high. Why does register tiling help?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each multiply-add still reads two values from shared memory; a register tile lets each value read serve several multiply-adds",
          "Registers are larger than shared memory, so bigger tiles fit",
          "Register tiling removes the need for __syncthreads",
          "It reduces the number of global loads per output to zero",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matmul_naive(A, B):
    K = len(B)
    return [[sum(A[i][k] * B[k][j] for k in range(K)) for j in range(len(B[0]))] for i in range(len(A))]

def matmul_tiled(A, B, T):
    M, K, N = len(A), len(B), len(B[0])
    C = [[0] * N for _ in range(M)]
    for i0 in range(0, M, T):
        for j0 in range(0, N, T):
            for k0 in range(0, K, T):
                for i in range(i0, min(i0 + T, M)):
                    for j in range(j0, min(j0 + T, N)):
                        C[i][j] += sum(A[i][k] * B[k][j] for k in range(k0, min(k0 + T, K)))
    return C

def global_loads(M, N, K, BM, BN):
    return M * N * K // BN + M * N * K // BM

A, B = [[1, 2], [3, 4]], [[5, 6], [7, 8]]
print(matmul_naive(A, B), matmul_tiled(A, B, 1) == matmul_naive(A, B), global_loads(64, 64, 64, 1, 1), global_loads(64, 64, 64, 32, 32))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[19, 22], [43, 50]] True 524288 16384",
          "[[19, 22], [43, 50]] True 524288 32768",
          "[[5, 12], [21, 32]] True 524288 16384",
          "[[19, 22], [43, 50]] True 262144 16384",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def intensity(M, N, K, BM, BN, word=4):
    loads = M * N * K / BN + M * N * K / BM + M * N
    return 2 * M * N * K / (word * loads)

def smem_reads_per_fma(rm, rn):
    return (rm + rn) / (rm * rn)

def attainable(peak, bw, ai):
    return min(peak, bw * ai)

ai = intensity(128, 128, 128, 128, 128)
print(round(ai, 3), smem_reads_per_fma(4, 4), attainable(20e12, 1e12, 0.25) / 1e12)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "21.333 0.5 0.25",
          "32.0 0.5 0.25",
          "21.333 0.25 0.25",
          "21.333 0.5 20.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matmul_naive(A, B)</C> for lists of rows; <C>matmul_tiled(A, B, T)</C>, the same product computed by looping over T by
          T tiles of C and, inside each, over chunks of T along k, accumulating partial sums; and{" "}
          <C>global_loads(M, N, K, BM, BN)</C>, the element count from the theorem, as an integer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matmul_naive(A, B):
    return [[0] * len(B[0]) for _ in A]

def matmul_tiled(A, B, T):
    return [[0] * len(B[0]) for _ in A]

def global_loads(M, N, K, BM, BN):
    return 0
`,
        solution: LOOPS,
        tests: [
          { name: "products", code: `import random\nr = random.Random(1)\nA = [[r.randint(-5, 5) for _ in range(7)] for _ in range(5)]\nB = [[r.randint(-5, 5) for _ in range(3)] for _ in range(7)]\nassert matmul_naive([[1, 0, 2]], [[1], [2], [3]]) == [[7]]\nassert matmul_tiled(A, B, 2) == matmul_naive(A, B) and matmul_tiled(A, B, 4) == matmul_naive(A, B)` },
          { name: "loads", code: `assert global_loads(128, 256, 64, 64, 128) == 49152\nassert global_loads(8, 8, 8, 1, 1) == 1024` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>intensity(M, N, K, BM, BN, word=4)</C>, FLOP per byte including the stores of C; <C>smem_reads_per_fma(rm, rn)</C>; and{" "}
          <C>attainable(peak, bw, ai)</C>, the roofline bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def intensity(M, N, K, BM, BN, word=4):
    return 0.0

def smem_reads_per_fma(rm, rn):
    return 2.0

def attainable(peak, bw, ai):
    return peak
`,
        solution: BOUNDS,
        tests: [
          { name: "intensity", code: `want = 2 * 64 * 64 * 4096 / (4 * (2 * 64 * 4096 + 64 * 64))\nassert abs(intensity(64, 64, 4096, 64, 64) - want) < 1e-9\nassert abs(smem_reads_per_fma(8, 4) - 0.375) < 1e-12` },
          { name: "roofline", code: `assert attainable(10, 2, 3) == 6 and attainable(10, 2, 8) == 10` },
        ],
      },
    },
    {
      key: "shape",
      rung: "stretch",
      prompt: (
        <p>
          A float32 kernel stages a BM by 32 tile of A and a 32 by BN tile of B in 48 KB (49,152 bytes) of shared memory. Ignoring the
          stores of C, what is the highest global arithmetic intensity, in FLOP per byte, that any choice of BM and BN allows?
        </p>
      ),
      answer: { kind: "numeric", value: 48, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        On modern GPUs most of the arithmetic peak is available only through tensor cores, which multiply small matrices in a single
        instruction. The next lesson adapts the tiling hierarchy to feed them.
      </p>
    </>
  ),
};
