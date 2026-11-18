import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SystolicArrayViz } from "@/components/viz/SystolicArrayViz";
import type { LessonContent } from "@/lib/types";

const SYSTOLIC = `def systolic_matmul(A, B):
    n, k, m = len(A), len(B), len(B[0])
    C = [[0] * m for _ in range(n)]
    a = [[None] * m for _ in range(n)]
    b = [[None] * m for _ in range(n)]
    t = 0
    while t < n + m + k - 2:
        for i in range(n):
            a[i] = [A[i][t - i] if 0 <= t - i < k else None] + a[i][:-1]
        for j in range(m):
            col = [B[t - j][j] if 0 <= t - j < k else None] + [b[i][j] for i in range(n - 1)]
            for i in range(n):
                b[i][j] = col[i]
        for i in range(n):
            for j in range(m):
                if a[i][j] is not None and b[i][j] is not None:
                    C[i][j] += a[i][j] * b[i][j]
        t += 1
    return C, t

def systolic_cycles(n, m, k):
    return n + m + k - 2

def pe_utilisation(n, m, k):
    return k / (n + m + k - 2)`;

const COSTS = `def reuse_factor(n, m, k):
    return 2 * n * m * k / (n * k + k * m)

def mxu_efficiency(m, n, k, size=128):
    pad = lambda x: -(-x // size) * size
    return m * n * k / (pad(m) * pad(n) * pad(k))

def energy_pj(macs, sram_words, dram_words, costs=(1.0, 10.0, 640.0)):
    return macs * costs[0] + sram_words * costs[1] + dram_words * costs[2]`;

export const lesson: LessonContent = {
  id: "e7.5.1",
  minutes: 55,
  links: {
    requires: ["e7.4.4"],
    revisits: ["e7.3.3", "e7.4.2"],
    foreshadows: ["e7.5.2", "e7.5.3"],
  },

  puzzle: (
    <>
      <p>
        Reading a 32-bit number from DRAM costs on the order of a hundred times more energy than multiplying two of them.
        A chip that fetched both operands of every multiplication from memory would spend nearly all its power moving
        data. A TPU does tens of thousands of multiply-adds per cycle while reading each input from its memory only once.
        How can a single value serve hundreds of multiplications without being fetched again?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Arrange the multipliers in a grid and let the data flow through it. A number from A enters at the left edge of a
        row and is passed from cell to cell to the right, meeting a different number from B in each cell; numbers from B
        flow down the columns in the same way. Each cell multiplies whatever pair passes through it and keeps a running
        sum. Values are read from memory once, at the edge, and then reused by every cell they pass. The data pulses
        through the array like blood through the body, which is where the name systolic comes from.
      </p>
      <SystolicArrayViz />
    </>
  ),

  theory: (
    <>
      <Definition title="systolic arrays">
        <p>
          A <em>systolic array</em> is a grid of identical processing elements (PEs), each connected only to its neighbours.
          In each cycle every PE takes inputs from its neighbours, computes, and passes values on. In an{" "}
          <em>output-stationary</em> array for <M>{"C = AB"}</M>, PE (i, j) accumulates <M>{"c_{ij}"}</M>; row i of A enters
          the left edge delayed by i cycles and column j of B enters the top delayed by j cycles. The matrix unit of a
          Google TPU is a 128 × 128 array of bf16 multipliers with fp32 accumulation (most TPUs keep the weights stationary
          instead, but the timing argument is the same).
        </p>
        <Code>{SYSTOLIC}</Code>
      </Definition>

      <Theorem title="timing of the array">
        <p>
          For an <M>{"n \\times k"}</M> by <M>{"k \\times m"}</M> product on an <M>{"n \\times m"}</M> output-stationary
          array, <M>{"a_{il}"}</M> and <M>{"b_{lj}"}</M> meet in PE (i, j) at cycle <M>{"i + j + l"}</M>, so the product is
          complete after <M>{"n + m + k - 2"}</M> cycles, and the fraction of PE-cycles that do useful work is{" "}
          <M>{"k/(n + m + k - 2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"a_{il}"}</M> enters row i at cycle <M>{"i + l"}</M> and moves one column per cycle, so it is in column j at
          cycle <M>{"i + l + j"}</M>; likewise <M>{"b_{lj}"}</M> enters column j at cycle <M>{"j + l"}</M> and reaches row i at
          cycle <M>{"j + l + i"}</M>. They meet at the same cycle, so every PE sees exactly the pairs it needs, each once. The
          last pair, <M>{"i = n-1, j = m-1, l = k-1"}</M>, meets at cycle <M>{"n + m + k - 3"}</M>, counting from 0, so{" "}
          <M>{"n + m + k - 2"}</M> cycles are needed. There are nmk useful multiply-adds among{" "}
          <M>{"nm(n + m + k - 2)"}</M> PE-cycles. The fill and drain cost <M>{"n + m - 2"}</M> cycles, so the array is efficient
          only when k, the length streamed through it, is long compared with its size.
        </p>
      </Proof>

      <Theorem title="reuse in the array">
        <p>
          The array reads each entry of A and B once from memory and performs 2nmk FLOPs, a reuse of
        </p>
        <MD>{"\\frac{2nmk}{nk + km} = \\frac{2}{1/m + 1/n}"}</MD>
        <p>FLOPs per value read, independent of k.</p>
      </Theorem>
      <Proof>
        <p>
          Entry <M>{"a_{il}"}</M> enters once and is used by all m PEs of row i; entry <M>{"b_{lj}"}</M> by all n PEs of
          column j. The C values never leave the array until the end. Dividing the FLOPs by the nk + km values read and then
          numerator and denominator by nmk gives the formula. For a 128 × 128 array it is 128 FLOPs per value, the same
          reuse a GPU obtains by tiling into shared memory (e7.4.2), but achieved by wiring rather than by software.
        </p>
        <Code>{COSTS}</Code>
      </Proof>

      <Example title="energy">
        <p>
          Horowitz&apos;s widely quoted estimates for a 45 nm process put a 32-bit DRAM access at about 640 pJ, a read from a
          small on-chip SRAM at about 5 to 10 pJ, and a 32-bit floating-point multiply at about 4 pJ; smaller formats and
          newer processes shrink the arithmetic far more than the wires. <C>energy_pj</C> uses relative costs of 1, 10 and
          640. A chip that fetched both operands of every multiply-add from DRAM would spend over a thousand times as much
          on data as on arithmetic; a systolic array reading each operand once brings the two to the same order.
        </p>
      </Example>

      <Remark title="TPUs in practice">
        <p>
          A TPU has a few large cores, each with matrix units, a vector unit for elementwise work and a large on-chip
          memory, all scheduled statically by the XLA compiler rather than by thousands of hardware threads. This makes
          performance predictable but strict: shapes must be known at compile time, and dimensions should be multiples of
          128 or the unused rows and columns of the array do nothing. Chips are joined into pods by a dedicated
          interconnect, the subject of the last lesson of this chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cycles",
      rung: "check",
      prompt: <p>How many cycles does a 128 × 128 output-stationary array take to compute a 128 × 512 by 512 × 128 product?</p>,
      answer: { kind: "numeric", value: 766, tolerance: 0 },
    },
    {
      key: "util",
      rung: "check",
      prompt: <p>What fraction of its PE-cycles does the array do useful work in the previous question? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.668, tolerance: 0.0006 },
    },
    {
      key: "pad",
      rung: "apply",
      prompt: <p>A model on a TPU has a hidden size of 1000. Why might changing it to 1024 make training faster even though it adds work?</p>,
      answer: {
        kind: "choice",
        options: [
          "The matrix unit is 128 wide, so 1000 is padded to 1024 anyway, and 1024 makes the padded work useful",
          "TPUs cannot store matrices whose sizes are not powers of two",
          "Larger hidden sizes need fewer FLOPs per token",
          "1024 fits in the L1 cache and 1000 does not",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def systolic_matmul(A, B):
    n, k, m = len(A), len(B), len(B[0])
    C = [[0] * m for _ in range(n)]
    a = [[None] * m for _ in range(n)]
    b = [[None] * m for _ in range(n)]
    t = 0
    while t < n + m + k - 2:
        for i in range(n):
            a[i] = [A[i][t - i] if 0 <= t - i < k else None] + a[i][:-1]
        for j in range(m):
            col = [B[t - j][j] if 0 <= t - j < k else None] + [b[i][j] for i in range(n - 1)]
            for i in range(n):
                b[i][j] = col[i]
        for i in range(n):
            for j in range(m):
                if a[i][j] is not None and b[i][j] is not None:
                    C[i][j] += a[i][j] * b[i][j]
        t += 1
    return C, t

def systolic_cycles(n, m, k):
    return n + m + k - 2

def pe_utilisation(n, m, k):
    return k / (n + m + k - 2)

print(systolic_matmul([[1, 2], [3, 4]], [[5, 6], [7, 8]]), systolic_matmul([[1, 2, 3]], [[1], [1], [1]]))
print(systolic_cycles(128, 128, 128), round(pe_utilisation(128, 128, 128), 4), round(pe_utilisation(128, 128, 10 ** 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([[19, 22], [43, 50]], 4) ([[6]], 3)\n382 0.3351 0.9752",
          "([[19, 22], [43, 50]], 6) ([[6]], 3)\n382 0.3351 0.9752",
          "([[19, 22], [43, 50]], 4) ([[6]], 1)\n382 0.3351 0.9752",
          "([[23, 34], [31, 46]], 4) ([[6]], 3)\n384 0.3333 0.9752",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reuse_factor(n, m, k):
    return 2 * n * m * k / (n * k + k * m)

def mxu_efficiency(m, n, k, size=128):
    pad = lambda x: -(-x // size) * size
    return m * n * k / (pad(m) * pad(n) * pad(k))

def energy_pj(macs, sram_words, dram_words, costs=(1.0, 10.0, 640.0)):
    return macs * costs[0] + sram_words * costs[1] + dram_words * costs[2]

print(reuse_factor(128, 128, 128), round(reuse_factor(1, 4096, 4096), 4), round(mxu_efficiency(1000, 1000, 1000), 4), mxu_efficiency(64, 128, 128))
print(energy_pj(100, 0, 0), energy_pj(1000, 200, 2), energy_pj(1, 1, 1, costs=(2, 3, 4)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "128.0 1.9995 0.9313 0.5\n100.0 4280.0 9",
          "256.0 1.9995 0.9313 0.5\n100.0 4280.0 9",
          "128.0 4096.0 0.9313 0.5\n100.0 4280.0 9",
          "128.0 1.9995 0.9313 1.0\n100.0 1840.0 9",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>systolic_matmul(A, B)</C>, a cycle-by-cycle simulation of an output-stationary array that shifts values of
          A right and of B down each cycle, injecting skewed inputs at the edges, and returns (C, cycles) where cycles is the
          number simulated; <C>systolic_cycles(n, m, k)</C>; and <C>pe_utilisation(n, m, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def systolic_matmul(A, B):
    C = [[sum(a * b for a, b in zip(row, col)) for col in zip(*B)] for row in A]
    return C, 0

def systolic_cycles(n, m, k):
    return k

def pe_utilisation(n, m, k):
    return 1.0
`,
        solution: SYSTOLIC,
        tests: [
          { name: "simulation", code: `import random
r = random.Random(0)
for n, k, m in [(2, 2, 2), (3, 5, 4), (1, 1, 1), (6, 2, 3), (4, 7, 1)]:
    A = [[r.randint(-5, 5) for _ in range(k)] for _ in range(n)]
    B = [[r.randint(-5, 5) for _ in range(m)] for _ in range(k)]
    C, t = systolic_matmul(A, B)
    assert C == [[sum(A[i][q] * B[q][j] for q in range(k)) for j in range(m)] for i in range(n)], (n, k, m)
    assert t == n + m + k - 2, (n, k, m, t)` },
          { name: "timing", code: `assert systolic_cycles(128, 128, 128) == 382 and systolic_cycles(128, 128, 512) == 766 and systolic_cycles(1, 1, 1) == 1
assert abs(pe_utilisation(128, 128, 512) - 512 / 766) < 1e-12 and pe_utilisation(1, 1, 5) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reuse_factor(n, m, k)</C>, FLOPs per value of A and B read; <C>mxu_efficiency(m, n, k, size=128)</C>, the
          useful fraction after padding every dimension to a multiple of size; and{" "}
          <C>energy_pj(macs, sram_words, dram_words, costs=(1.0, 10.0, 640.0))</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reuse_factor(n, m, k):
    return 1.0

def mxu_efficiency(m, n, k, size=128):
    return 1.0

def energy_pj(macs, sram_words, dram_words, costs=(1.0, 10.0, 640.0)):
    return 0.0
`,
        solution: COSTS,
        tests: [
          { name: "reuse", code: `assert reuse_factor(128, 128, 128) == 128.0 and abs(reuse_factor(1, 4096, 4096) - 2 / (1 + 1 / 4096)) < 1e-12 and reuse_factor(4, 4, 99) == 4.0
assert abs(mxu_efficiency(1000, 1000, 1000) - 1e9 / 1024 ** 3) < 1e-12 and mxu_efficiency(64, 128, 128) == 0.5 and mxu_efficiency(256, 384, 128) == 1.0
assert abs(mxu_efficiency(10, 10, 10, size=8) - 1000 / 4096) < 1e-12` },
          { name: "energy", code: `assert energy_pj(100, 0, 0) == 100.0 and energy_pj(1000, 200, 2) == 4280.0 and energy_pj(1, 1, 1, costs=(2, 3, 4)) == 9 and energy_pj(0, 0, 1) == 640.0` },
        ],
      },
    },
    {
      key: "energy",
      rung: "stretch",
      prompt: (
        <p>
          With relative costs of 1 per multiply-add and 640 per DRAM word, compare a 1024 × 1024 × 1024 product that reads
          both operands of every multiply-add from DRAM with one that reads each entry of A and B from DRAM once. How many
          times more energy does the first use? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 569.33, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The TPU is one answer to the cost of moving data. The next lesson surveys others: wafer-scale chips, chips built
        around on-chip SRAM, and dataflow designs, and what each gives up.
      </p>
    </>
  ),
};
