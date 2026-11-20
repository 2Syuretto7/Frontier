import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MmaFragmentViz } from "@/components/viz/MmaFragmentViz";
import type { LessonContent } from "@/lib/types";

const FRAGS = `def c_frag(lane):
    g, t = lane // 4, lane % 4
    return [(g + 8 * (i // 2), 2 * t + i % 2) for i in range(4)]

def a_frag(lane):
    g, t = lane // 4, lane % 4
    return [(g + 8 * ((i // 2) % 2), 2 * t + i % 2 + 8 * (i // 4)) for i in range(8)]

def mma_count(wm, wn, wk, m=16, n=8, k=16):
    return (wm // m) * (wn // n) * (wk // k)`;

const SWIZZLE = `def swizzle_chunk(row, chunk):
    return chunk ^ (row % 8)

def chunk_addr(row, chunk, row_bytes=128, swizzle=False):
    c = chunk ^ (row % 8) if swizzle else chunk
    return row * row_bytes + c * 16

def conflict_ways(addrs, width=16):
    count = {}
    for a in set(addrs):
        for j in range(width // 4):
            b = (a // 4 + j) % 32
            count[b] = count.get(b, 0) + 1
    return max(count.values())`;

const WMMA = `#include <mma.h>
using namespace nvcuda;

// one warp computes one 16 x 16 tile of C = A B; A is M x K, B is K x N, half precision, row-major
__global__ void wmma_gemm(const half* A, const half* B, float* C, int M, int N, int K) {
    int warp = (blockIdx.x * blockDim.x + threadIdx.x) / 32;
    int tm = warp / (N / 16), tn = warp % (N / 16);
    wmma::fragment<wmma::matrix_a, 16, 16, 16, half, wmma::row_major> a;
    wmma::fragment<wmma::matrix_b, 16, 16, 16, half, wmma::row_major> b;
    wmma::fragment<wmma::accumulator, 16, 16, 16, float> acc;
    wmma::fill_fragment(acc, 0.0f);
    for (int k = 0; k < K; k += 16) {
        wmma::load_matrix_sync(a, A + tm * 16 * K + k, K);    // all 32 lanes take part
        wmma::load_matrix_sync(b, B + k * N + tn * 16, N);
        wmma::mma_sync(acc, a, b, acc);                         // acc += a b on tensor cores
    }
    wmma::store_matrix_sync(C + tm * 16 * N + tn * 16, acc, N, wmma::mem_row_major);
}`;

export const lesson: LessonContent = {
  id: "e9.2.2",
  minutes: 55,
  links: {
    requires: ["e9.2.1", "e7.3.3"],
    revisits: ["e7.3.2"],
    foreshadows: ["e9.2.3", "e9.4.4"],
  },

  puzzle: (
    <>
      <p>
        Port the register-tiled kernel of the last lesson to 16-bit inputs and it still reaches only a small fraction of the 16-bit
        throughput on the GPU&apos;s data sheet. The data sheet is not lying: that throughput belongs to tensor cores, which no ordinary
        multiply-add instruction can reach. What changes in a kernel when the unit of multiplication is no longer a thread but a whole
        warp?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A tensor core instruction multiplies two small matrices at once, and the warp issues it together: the operands are spread across
        the registers of all 32 lanes in a pattern fixed by the hardware, and so is the result. Programming tensor cores therefore means
        arranging data so that each lane holds exactly the pieces the instruction expects, and keeping the instructions fed from shared
        memory fast enough. The tiling hierarchy of the last lesson stays, with a new level: block tiles split into warp tiles, which
        split into instruction tiles.
      </p>
      <MmaFragmentViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the WMMA interface">
        <p>
          CUDA&apos;s <C>wmma</C> functions hide the layout. A warp declares opaque fragments for A, B and the accumulator, loads them
          from memory with <C>load_matrix_sync</C>, multiplies with <C>mma_sync</C> and stores with <C>store_matrix_sync</C>. Every lane
          of the warp must make each call. The shapes are fixed, such as 16 by 16 by 16 for half precision with a float32 accumulator
          (the formats and their exactness are in e7.3.3).
        </p>
        <Code>{WMMA}</Code>
      </Definition>

      <Definition title="fragments of mma.sync">
        <p>
          High-performance kernels use the lower-level <C>mma.sync.m16n8k16</C> instruction, whose layout is documented. Number the lanes
          by group g = lane / 4 and position t = lane mod 4. Lane l holds accumulator elements c0, c1 at row g, columns 2t and 2t + 1,
          and c2, c3 at row g + 8, same columns (<C>c_frag</C>). For A it holds eight 16-bit values: a0 to a3 in columns 2t, 2t + 1 of
          rows g and g + 8, and a4 to a7 eight columns further right (<C>a_frag</C>). A warp tile of WM by WN outputs needs{" "}
          <M>{"(W_M/16)(W_N/8)"}</M> instructions for every 16 along k (<C>mma_count</C>).
        </p>
        <Code>{FRAGS}</Code>
      </Definition>

      <Theorem title="the accumulator layout is a partition">
        <p>
          The map from (lane, i), for 32 lanes and i = 0, ..., 3, to <M>{"(g + 8\\lfloor i/2 \\rfloor,\\ 2t + (i \\bmod 2))"}</M> is a
          bijection onto the 128 positions of the 16 by 8 tile. Consequently a warp tile of WM by WN float32 outputs occupies{" "}
          <M>{"W_M W_N / 32"}</M> registers in every lane.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both sets have 128 elements, so it suffices to recover (lane, i) from the position (r, c). The row gives g = r mod 8 and{" "}
          <M>{"\\lfloor i/2 \\rfloor = \\lfloor r/8 \\rfloor"}</M>; the column gives t = <M>{"\\lfloor c/2 \\rfloor"}</M> and i mod 2 = c mod 2.
          Then lane = 4g + t and i is determined, so the map is injective, hence bijective. Each instruction tile thus places exactly 4 of
          its 128 results in each lane, and a warp tile made of <M>{"W_M W_N/128"}</M> instruction tiles places{" "}
          <M>{"4 W_M W_N / 128 = W_M W_N / 32"}</M> in each.
        </p>
      </Proof>

      <Remark title="feeding the instruction: ldmatrix and swizzling">
        <p>
          Operands reach the fragments through shared memory. The <C>ldmatrix</C> instruction loads 8 by 8 matrices of 16-bit values, each
          lane supplying the address of one 16-byte row. If a tile is stored with rows of 128 bytes, the eight rows of one column chunk
          start at multiples of 128 bytes, all in the same four banks: an 8-way conflict (<C>chunk_addr</C>, <C>conflict_ways</C>).
          Padding the rows works, but kernels usually swizzle instead: store chunk c of row r at chunk position c XOR (r mod 8)
          (<C>swizzle_chunk</C>), which spreads every column of chunks across all banks without wasting memory.
        </p>
        <Code>{SWIZZLE}</Code>
        <p>
          Accumulators are the main cost in registers: by the theorem a 64 by 128 warp tile would need 256 registers in every lane,
          more than the 255 a thread may use, and even smaller tiles limit occupancy, which is why tile shapes are tuned per GPU. Newer GPUs add instructions that read operands directly from
          shared memory, taken up in e9.4.4.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A thread-level multiply-add moves through the ordinary arithmetic units, whose throughput is a small fraction of the tensor
          cores&apos;. To reach the advertised rate, the kernel must issue warp-wide MMA instructions, place operands in the registers the
          layout prescribes, load them from shared memory without bank conflicts, and choose warp tiles large enough to reuse each fragment
          many times without running out of registers.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mmas",
      rung: "check",
      prompt: (
        <p>
          A warp computes a 32 by 64 tile of C with m16n8k16 instructions. How many instructions does it issue for one step of 32 along k?
        </p>
      ),
      answer: { kind: "numeric", value: 32, tolerance: 0 },
    },
    {
      key: "regs",
      rung: "check",
      prompt: (
        <p>
          A warp accumulates a 64 by 64 tile of C in float32. How many accumulator values does each of its 32 lanes hold in registers?
        </p>
      ),
      answer: { kind: "numeric", value: 128, tolerance: 0 },
    },
    {
      key: "warpwide",
      rung: "apply",
      prompt: <p>Why must all 32 lanes of a warp execute <C>wmma::mma_sync</C> together?</p>,
      answer: {
        kind: "choice",
        options: [
          "The operands and result are spread across the registers of all 32 lanes, and the instruction is issued by the warp as a whole",
          "Each lane computes a separate 16 by 16 product and the results are summed",
          "Only lane 0 performs the multiplication; the others wait",
          "It is a convention for readability; any subset of lanes would give the same result",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def c_frag(lane):
    g, t = lane // 4, lane % 4
    return [(g + 8 * (i // 2), 2 * t + i % 2) for i in range(4)]

def a_frag(lane):
    g, t = lane // 4, lane % 4
    return [(g + 8 * ((i // 2) % 2), 2 * t + i % 2 + 8 * (i // 4)) for i in range(8)]

def mma_count(wm, wn, wk, m=16, n=8, k=16):
    return (wm // m) * (wn // n) * (wk // k)

f = c_frag(0)
print(f, c_frag(6)[2], a_frag(1)[4:6], mma_count(64, 64, 32))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 0), (0, 1), (8, 0), (8, 1)] (9, 4) [(0, 10), (0, 11)] 64",
          "[(0, 0), (0, 1), (1, 0), (1, 1)] (9, 4) [(0, 10), (0, 11)] 64",
          "[(0, 0), (0, 1), (8, 0), (8, 1)] (1, 12) [(0, 10), (0, 11)] 64",
          "[(0, 0), (0, 1), (8, 0), (8, 1)] (9, 4) [(0, 10), (0, 11)] 32",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def swizzle_chunk(row, chunk):
    return chunk ^ (row % 8)

def chunk_addr(row, chunk, row_bytes=128, swizzle=False):
    c = chunk ^ (row % 8) if swizzle else chunk
    return row * row_bytes + c * 16

def conflict_ways(addrs, width=16):
    count = {}
    for a in set(addrs):
        for j in range(width // 4):
            b = (a // 4 + j) % 32
            count[b] = count.get(b, 0) + 1
    return max(count.values())

plain = [chunk_addr(r, 0) for r in range(8)]
print(plain[:3], conflict_ways(plain), conflict_ways([chunk_addr(r, 0, swizzle=True) for r in range(8)]), swizzle_chunk(5, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 128, 256] 8 1 6",
          "[0, 128, 256] 1 1 6",
          "[0, 128, 256] 8 2 6",
          "[0, 128, 256] 8 1 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>c_frag(lane)</C> and <C>a_frag(lane)</C>, the lists of (row, column) positions of c0 to c3 and a0 to a7 described
          above, and <C>mma_count(wm, wn, wk, m=16, n=8, k=16)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def c_frag(lane):
    return [(0, 0)] * 4

def a_frag(lane):
    return [(0, 0)] * 8

def mma_count(wm, wn, wk, m=16, n=8, k=16):
    return 1
`,
        solution: FRAGS,
        tests: [
          { name: "layout", code: `assert c_frag(31) == [(7, 6), (7, 7), (15, 6), (15, 7)]\nassert a_frag(0) == [(0, 0), (0, 1), (8, 0), (8, 1), (0, 8), (0, 9), (8, 8), (8, 9)]\nassert sorted(p for l in range(32) for p in a_frag(l)) == [(r, c) for r in range(16) for c in range(16)]` },
          { name: "count", code: `assert mma_count(128, 128, 16) == 128 and mma_count(32, 16, 64) == 16` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>swizzle_chunk(row, chunk)</C>; <C>chunk_addr(row, chunk, row_bytes=128, swizzle=False)</C>, the byte address of a
          16-byte chunk; and <C>conflict_ways(addrs, width=16)</C>, the largest number of distinct addresses whose width-byte accesses use
          the same one of 32 four-byte banks.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def swizzle_chunk(row, chunk):
    return chunk

def chunk_addr(row, chunk, row_bytes=128, swizzle=False):
    return row * row_bytes

def conflict_ways(addrs, width=16):
    return 1
`,
        solution: SWIZZLE,
        tests: [
          { name: "swizzle", code: `assert swizzle_chunk(0, 7) == 7 and swizzle_chunk(9, 2) == 3\nassert chunk_addr(2, 1) == 272 and chunk_addr(2, 1, swizzle=True) == 304` },
          { name: "conflicts", code: `assert conflict_ways([0, 16, 32, 48, 64, 80, 96, 112]) == 1 and conflict_ways([0, 128]) == 2\nassert conflict_ways([0, 4], width=4) == 1` },
        ],
      },
    },
    {
      key: "reuse",
      rung: "stretch",
      prompt: (
        <p>
          A warp tile of WM by WN outputs with WM times WN equal to 4096 is computed with m16n8k16 instructions. Each step of 16 along k
          loads WM/16 fragments of A and WN/8 of B. Over all choices of WM (a multiple of 16) and WN (a multiple of 8), what is the
          smallest number of fragment loads per instruction?
        </p>
      ),
      answer: { kind: "numeric", value: 0.375, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fragments, warp tiles, swizzled shared memory and pipelined loads are a lot to write by hand for every shape and data type. The
        next lesson looks at how CUTLASS organises them into reusable pieces.
      </p>
    </>
  ),
};
