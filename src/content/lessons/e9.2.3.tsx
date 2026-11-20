import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CuteLayoutViz } from "@/components/viz/CuteLayoutViz";
import type { LessonContent } from "@/lib/types";

const LAYOUT = `def offset(coord, stride):
    return sum(c * s for c, s in zip(coord, stride))

def row_major_stride(shape):
    out, s = [], 1
    for n in reversed(shape):
        out.append(s)
        s *= n
    return tuple(reversed(out))

def tiled_offset(r, c, tr, tc, ncols):
    tile = (r // tr) * (ncols // tc) + c // tc
    return tile * tr * tc + (r % tr) * tc + c % tc`;

const SCHEDULE = `import math

def pipeline_time(n, L, C, S):
    done = []
    for i in range(n):
        load_done = (done[i - S] if i >= S else 0) + L
        done.append(max(load_done, done[i - 1] if i else 0) + C)
    return done[-1]

def wave_util(tiles, sms):
    return tiles / (math.ceil(tiles / sms) * sms)

def splitk_util(tiles, sms, s):
    return wave_util(tiles * s, sms)`;

const TEMPLATE = `// in the style of CUTLASS 2.x: every design choice is a template parameter
using Gemm = cutlass::gemm::device::Gemm<
    cutlass::half_t, cutlass::layout::RowMajor,        // A
    cutlass::half_t, cutlass::layout::ColumnMajor,     // B
    float, cutlass::layout::RowMajor,                  // C
    float,                                             // accumulator
    cutlass::arch::OpClassTensorOp, cutlass::arch::Sm80,
    cutlass::gemm::GemmShape<128, 128, 32>,            // threadblock tile
    cutlass::gemm::GemmShape<64, 64, 32>,              // warp tile
    cutlass::gemm::GemmShape<16, 8, 16>,               // instruction tile
    cutlass::epilogue::thread::LinearCombination<float, 4, float, float>,   // D = alpha AB + beta C
    cutlass::gemm::threadblock::GemmIdentityThreadblockSwizzle<>,
    3>;                                                // pipeline stages`;

export const lesson: LessonContent = {
  id: "e9.2.3",
  minutes: 55,
  links: {
    requires: ["e9.2.2"],
    revisits: ["e7.3.1", "e9.1.3"],
    foreshadows: ["e9.3.1", "e9.4.4"],
  },

  puzzle: (
    <>
      <p>
        A GPU math library ships thousands of matrix multiplication kernels: one for each combination of data types, memory layouts,
        tile shapes, pipeline depths and post-processing steps, tuned for several GPU generations. Nobody writes thousands of kernels by
        hand. What small set of ideas are they all assembled from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        CUTLASS, NVIDIA&apos;s open-source library of matrix multiplication building blocks, factors a fast kernel into independent
        decisions. How the problem is cut into block, warp and instruction tiles. How data is laid out, expressed as functions from
        coordinates to offsets rather than hand-written index arithmetic. How loads are pipelined so that memory and math overlap. What
        happens to the accumulators before they are written. And how tiles are scheduled onto the GPU. Each decision is a parameter, and
        a kernel is a combination of choices.
      </p>
      <CuteLayoutViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the hierarchy as parameters">
        <p>
          A CUTLASS GEMM is specified by the three tile shapes of the previous lessons, the element types and layouts of each operand, the
          instruction class (tensor cores or ordinary arithmetic), the number of pipeline stages, an epilogue, and a rule for mapping tiles
          to blocks. Changing a shape or a type produces a different kernel from the same code.
        </p>
        <Code>{TEMPLATE}</Code>
      </Definition>

      <Definition title="layouts as functions">
        <p>
          CuTe, the layout library in CUTLASS 3, describes a layout by a shape and a stride: coordinate x maps to offset{" "}
          <M>{"\\sum_i x_i s_i"}</M> (<C>offset</C>). Row-major order for a shape is the stride whose last entry is 1 and each earlier
          entry is the product of the later extents (<C>row_major_stride</C>). Modes can themselves be hierarchical: a 4 by 4 blocked
          layout of an 8 by 8 tile splits each coordinate into a position within a block and a block index, each with its own stride
          (<C>tiled_offset</C>). Partitioning a tile among threads, swizzling and transposing all become operations on these functions,
          so the same kernel text works for every layout.
        </p>
        <Code>{LAYOUT}</Code>
      </Definition>

      <Theorem title="how many pipeline stages hide latency">
        <p>
          A block processes n tiles along k. Loading a tile into one of S shared-memory buffers takes time L, computing on it takes C, a
          buffer is reused only after the computation that used it ends, and computations run in order. Then the finishing time{" "}
          <M>{"d_{n-1}"}</M> of the last computation (<C>pipeline_time</C>) satisfies{" "}
          <M>{"\\max\\big(L + nC,\\ \\lceil n/S \\rceil (L + C)\\big) \\le d_{n-1} \\le L + C + (n - 1)\\max\\big(C, (L + C)/S\\big)"}</M>.
          In particular the kernel runs at the compute rate once <M>{"S \\ge 1 + L/C"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The rules give <M>{"d_i = \\max(d_{i-S} + L,\\ d_{i-1}) + C"}</M>, with <M>{"d_{i-S}"}</M> read as 0 for i &lt; S. Lower bounds:
          the first load ends at L and n computations follow in sequence, so <M>{"d_{n-1} \\ge L + nC"}</M>; and{" "}
          <M>{"d_i \\ge d_{i-S} + L + C"}</M> gives <M>{"d_{(k-1)S + j} \\ge k(L + C)"}</M>, so{" "}
          <M>{"d_{n-1} \\ge \\lceil n/S \\rceil (L + C)"}</M>. Upper bound: let <M>{"p = \\max(C, (L + C)/S)"}</M> and show by induction{" "}
          <M>{"d_i \\le L + C + ip"}</M>. For i &lt; S the first term is L and <M>{"d_i \\le \\max(L, L + C + (i - 1)p) + C \\le L + C + ip"}</M>{" "}
          since C &#8804; p. For i &#8805; S, <M>{"d_{i-S} + L + C \\le 2L + 2C + (i - S)p \\le L + C + ip"}</M> because L + C &#8804; Sp, and{" "}
          <M>{"d_{i-1} + C \\le L + C + (i - 1)p + C \\le L + C + ip"}</M>. When S &#8805; 1 + L/C, p = C and the bounds meet at L + nC.
        </p>
      </Proof>

      <Remark title="epilogues and scheduling">
        <p>
          The epilogue is everything done to the accumulators before they leave the chip: scaling, adding a bias or a residual, applying an
          activation, converting to a lower precision. Fusing it saves writing C to memory and reading it back. Scheduling decides which
          block computes which tile. When the number of output tiles is not a multiple of the number of multiprocessors, the last wave
          leaves many idle (<C>wave_util</C>); split-K divides the k loop of each tile among several blocks that add their partial results
          (<C>splitk_util</C>), and stream-K gives every block an equal share of the total k iterations, crossing tile boundaries. A tile
          swizzle orders the tiles so that blocks running together share rows of A and columns of B in L2.
        </p>
        <Code>{SCHEDULE}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A kernel is a point in a product of small spaces: tile shapes, layouts, instruction, stage count, epilogue and tile schedule.
          Libraries generate many points, measure them, and keep the fastest for each problem shape and GPU. The same decomposition reappears
          in Triton&apos;s block-level programs and in attention kernels later in this course.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "offset",
      rung: "check",
      prompt: <p>A layout has shape (4, 8) and stride (1, 4). What offset does coordinate (2, 5) map to?</p>,
      answer: { kind: "numeric", value: 22, tolerance: 0 },
    },
    {
      key: "waves",
      rung: "check",
      prompt: (
        <p>
          A 3072 by 3072 output is computed in 128 by 128 tiles, one tile per block, on a GPU with 132 multiprocessors that each run one
          block at a time. What fraction of multiprocessor slots across all waves does useful work? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.873, tolerance: 0.001 },
    },
    {
      key: "epilogue",
      rung: "apply",
      prompt: <p>Why fuse a bias addition and activation into the matrix multiplication&apos;s epilogue rather than run them as a separate kernel?</p>,
      answer: {
        kind: "choice",
        options: [
          "The separate kernel would read the whole output back from memory and write it again; fused, the work happens on values still in registers",
          "Tensor cores can only add biases inside a matrix multiplication",
          "The activation would otherwise be applied in lower precision",
          "Separate kernels cannot run on the same GPU",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def offset(coord, stride):
    return sum(c * s for c, s in zip(coord, stride))

def row_major_stride(shape):
    out, s = [], 1
    for n in reversed(shape):
        out.append(s)
        s *= n
    return tuple(reversed(out))

def tiled_offset(r, c, tr, tc, ncols):
    tile = (r // tr) * (ncols // tc) + c // tc
    return tile * tr * tc + (r % tr) * tc + c % tc

o = offset((2, 3), (8, 1))
print(o, row_major_stride((4, 8)), row_major_stride((2, 3, 4)), tiled_offset(5, 2, 4, 4, 8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "19 (8, 1) (12, 4, 1) 38",
          "19 (1, 4) (12, 4, 1) 38",
          "19 (8, 1) (4, 2, 1) 38",
          "19 (8, 1) (12, 4, 1) 42",
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

def pipeline_time(n, L, C, S):
    done = []
    for i in range(n):
        load_done = (done[i - S] if i >= S else 0) + L
        done.append(max(load_done, done[i - 1] if i else 0) + C)
    return done[-1]

def wave_util(tiles, sms):
    return tiles / (math.ceil(tiles / sms) * sms)

def splitk_util(tiles, sms, s):
    return wave_util(tiles * s, sms)

print(pipeline_time(4, 10, 5, 1), pipeline_time(4, 10, 5, 2), round(wave_util(10, 4), 3), round(splitk_util(10, 4, 2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "60 35 0.833 1.0",
          "60 30 0.833 1.0",
          "40 35 0.833 1.0",
          "60 35 0.833 0.833",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>offset(coord, stride)</C>; <C>row_major_stride(shape)</C>, returned as a tuple; and{" "}
          <C>tiled_offset(r, c, tr, tc, ncols)</C>, the offset of (r, c) when a matrix with ncols columns is stored as tr by tc tiles,
          tiles in row-major order and each tile&apos;s elements contiguous and row-major.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def offset(coord, stride):
    return 0

def row_major_stride(shape):
    return tuple(1 for _ in shape)

def tiled_offset(r, c, tr, tc, ncols):
    return r * ncols + c
`,
        solution: LAYOUT,
        tests: [
          { name: "layout", code: `assert offset((1, 2, 3), (12, 4, 1)) == 23\nassert row_major_stride((5,)) == (1,) and row_major_stride((3, 4)) == (4, 1)` },
          { name: "tiled", code: `assert tiled_offset(0, 0, 2, 2, 4) == 0 and tiled_offset(1, 0, 2, 2, 4) == 2 and tiled_offset(1, 3, 2, 2, 4) == 7\nassert sorted(tiled_offset(r, c, 2, 4, 8) for r in range(4) for c in range(8)) == list(range(32))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pipeline_time(n, L, C, S)</C>, the finishing time of the last computation under the recurrence in the proof;{" "}
          <C>wave_util(tiles, sms)</C>; and <C>splitk_util(tiles, sms, s)</C>, the utilisation when every tile is split into s pieces.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def pipeline_time(n, L, C, S):
    return n * C

def wave_util(tiles, sms):
    return 1.0

def splitk_util(tiles, sms, s):
    return 1.0
`,
        solution: SCHEDULE,
        tests: [
          { name: "pipeline", code: `assert pipeline_time(3, 4, 4, 1) == 24 and pipeline_time(3, 4, 4, 3) == 16\nassert pipeline_time(1, 7, 2, 4) == 9` },
          { name: "waves", code: `assert wave_util(132, 132) == 1.0 and abs(wave_util(133, 132) - 133 / 264) < 1e-12\nassert splitk_util(3, 4, 4) == 1.0` },
        ],
      },
    },
    {
      key: "stages",
      rung: "stretch",
      prompt: (
        <p>
          Loading a k-tile takes 900 cycles and computing on it takes 250. What is the smallest number of pipeline stages for which, over a
          long k loop, the kernel runs at the compute rate?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Before choosing among kernels you have to measure them, and timing a GPU kernel correctly is harder than it looks. The next lesson
        covers benchmarking.
      </p>
    </>
  ),
};
