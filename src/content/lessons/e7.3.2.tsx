import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CoalescingViz } from "@/components/viz/CoalescingViz";
import type { LessonContent } from "@/lib/types";

const COALESCE = `def strided_addrs(base, stride, size=4, warp=32):
    return [base + lane * stride * size for lane in range(warp)]

def sectors(addrs, size=4, sector=32):
    return len({b // sector for a in addrs for b in (a, a + size - 1)})

def coalesce_efficiency(addrs, size=4, sector=32):
    return len(set(addrs)) * size / (sectors(addrs, size, sector) * sector)`;

const BANKS = `def bank(addr, banks=32, width=4):
    return addr // width % banks

def conflict_degree(addrs, banks=32, width=4):
    words = {}
    for a in addrs:
        words.setdefault(bank(a, banks, width), set()).add(a // width)
    return max(len(w) for w in words.values())

def column_addrs(row_len, col, pad=0, warp=32):
    return [(r * (row_len + pad) + col) * 4 for r in range(warp)]`;

export const lesson: LessonContent = {
  id: "e7.3.2",
  minutes: 55,
  links: {
    requires: ["e7.3.1", "e7.2.3"],
    revisits: ["e7.1.1"],
    foreshadows: ["e7.3.4", "e7.4.3"],
  },

  puzzle: (
    <>
      <p>
        Two GPU kernels transpose the same large matrix. Both read every element once and write it once, so they move the
        same number of bytes, and both run on a device with more than three terabytes per second of memory bandwidth. One
        reaches nearly that speed; the other is four or five times slower. The difference is only in which thread handles
        which element. Why does that matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        GPU memory does not deliver single numbers. It delivers sectors of 32 bytes, and the memory system serves a warp by
        gathering the sectors its 32 threads ask for. If neighbouring threads read neighbouring numbers, a few sectors
        serve the whole warp. If each thread reads from a different row, every thread costs a whole sector and most of each
        sector is thrown away.
      </p>
      <CoalescingViz />
      <p>
        The fix is to stage data through the small, fast memory inside each multiprocessor: read a tile in the good order,
        and let threads pick from it in whatever order they need. That memory has rules of its own, which this lesson also
        covers.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the GPU memory hierarchy">
        <p>
          On an H100 the levels are, from large and slow to small and fast: 80 GB of <em>HBM</em> (high-bandwidth memory,
          stacked next to the chip) at about 3.35 TB/s; a 50 MB <em>L2 cache</em> shared by all SMs; on each SM, up to 228 KB
          of <em>shared memory</em>, a scratchpad that the program manages itself and that shares storage with the L1 cache;
          and on each SM a 256 KB <em>register file</em> of 65 536 32-bit registers, divided among the resident threads.
          Latency grows from a cycle or so for a register to tens of cycles for shared memory and several hundred for HBM.
        </p>
      </Definition>

      <Theorem title="coalescing">
        <p>
          Let the 32 threads of a warp read 4-byte words at word addresses <M>{"o + \\ell s"}</M> for lanes{" "}
          <M>{"\\ell = 0, \\dots, 31"}</M>, with o a multiple of 8 so the start is sector-aligned, and stride{" "}
          <M>{"s \\ge 1"}</M>. The number of 32-byte sectors fetched is <M>{"4\\min(s, 8)"}</M>, and the fraction of fetched
          bytes that are used is <M>{"1/\\min(s, 8)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sector holds 8 words. If <M>{"s \\ge 8"}</M>, consecutive lanes are at least a sector apart, so each lane is in a
          sector of its own: 32 sectors. If <M>{"s \\le 8"}</M>, the lanes cover the word range from o to{" "}
          <M>{"o + 31s"}</M>, which lies in the 4s sectors starting at o, since <M>{"31s < 32s"}</M> words is 4s sectors. Every
          one of them is hit, because no two consecutive lanes are more than a sector apart. The warp uses 128 bytes, so the
          used fraction is <M>{"128 / (32 \\cdot 4\\min(s,8)) = 1/\\min(s,8)"}</M>.
        </p>
        <Code>{COALESCE}</Code>
      </Proof>

      <Definition title="shared memory banks">
        <p>
          Shared memory is split into 32 <em>banks</em>; consecutive 4-byte words go to consecutive banks, so word w is in bank{" "}
          <M>{"w \\bmod 32"}</M>. Each bank serves one word per cycle. If several lanes of a warp read different words in the
          same bank, the access is replayed once per word, a <em>bank conflict</em>; lanes reading the same word get it by
          broadcast at no cost. The <em>conflict degree</em> is the largest number of distinct words requested from one bank.
        </p>
        <Code>{BANKS}</Code>
      </Definition>

      <Theorem title="strided shared-memory access">
        <p>
          If lane <M>{"\\ell"}</M> reads word <M>{"\\ell s"}</M> for a whole number <M>{"s \\ge 1"}</M>, the conflict degree is{" "}
          <M>{"\\gcd(s, 32)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The words <M>{"\\ell s"}</M> are distinct. Lane <M>{"\\ell"}</M> uses bank <M>{"\\ell s \\bmod 32"}</M>; by the
          argument of the stride theorem in the previous chapter (e7.2.3), the 32 lanes reach exactly{" "}
          <M>{"32/g"}</M> banks with <M>{"g = \\gcd(s, 32)"}</M>, and lanes l and l&prime; share a bank exactly when{" "}
          <M>{"32/g"}</M> divides <M>{"\\ell - \\ell'"}</M>, so each bank receives exactly g lanes, each with its own word.
        </p>
      </Proof>

      <Example title="the transpose, done well">
        <p>
          A naive transpose reads rows, which coalesces, and writes columns, which does not: every write of a warp lands in 32
          different sectors. The standard fix stages a 32 × 32 tile in shared memory. The block reads the tile row by row,
          coalesced, and writes it out row by row of the transposed matrix, also coalesced, reading the tile by columns in
          between. A column of a 32 × 32 tile is stride 32, the worst case with conflict degree 32; declaring the tile 32 × 33
          makes the stride 33, coprime to 32, and removes every conflict at the price of 32 unused words.
        </p>
      </Example>

      <Remark title="registers">
        <p>
          Registers are the fastest storage and the most contended. A kernel that needs many registers per thread leaves
          room for fewer threads on each SM, and one that needs more than the limit of 255 <em>spills</em> them to local
          memory, which lives in HBM behind the caches. How the register, shared-memory and thread budgets together limit
          the number of resident warps is the subject of occupancy, two lessons on.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sectors",
      rung: "check",
      prompt: <p>A warp reads float32 values at a stride of 5 floats from a sector-aligned start. How many 32-byte sectors are fetched?</p>,
      answer: { kind: "numeric", value: 20, tolerance: 0 },
    },
    {
      key: "banks",
      rung: "check",
      prompt: <p>A shared-memory tile of float32 has rows of 48 floats. A warp reads one column, lane i reading row i. What is the conflict degree?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
    {
      key: "pad",
      rung: "apply",
      prompt: <p>Why do many CUDA kernels declare a shared-memory tile as <C>float tile[32][33]</C> but use only 32 columns?</p>,
      answer: {
        kind: "choice",
        options: [
          "A column of a 32-wide tile has stride 32 words and so every lane hits the same bank; stride 33 spreads the lanes over all 32 banks",
          "Shared memory must be allocated in multiples of 33 words",
          "The extra column stores the row index",
          "It aligns each row to a 32-byte sector of HBM",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def strided_addrs(base, stride, size=4, warp=32):
    return [base + lane * stride * size for lane in range(warp)]

def sectors(addrs, size=4, sector=32):
    return len({b // sector for a in addrs for b in (a, a + size - 1)})

def coalesce_efficiency(addrs, size=4, sector=32):
    return len(set(addrs)) * size / (sectors(addrs, size, sector) * sector)

print([sectors(strided_addrs(0, s)) for s in (1, 2, 32)], sectors(strided_addrs(4, 1)), sectors([0] * 32))
print(coalesce_efficiency(strided_addrs(0, 1)), coalesce_efficiency(strided_addrs(0, 2)), coalesce_efficiency(strided_addrs(0, 32)), coalesce_efficiency([0] * 32))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4, 8, 32] 5 1\n1.0 0.5 0.125 0.125",
          "[4, 8, 128] 5 1\n1.0 0.5 0.03125 0.125",
          "[4, 8, 32] 4 1\n1.0 0.5 0.125 0.125",
          "[4, 8, 32] 5 32\n1.0 0.5 0.125 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bank(addr, banks=32, width=4):
    return addr // width % banks

def conflict_degree(addrs, banks=32, width=4):
    words = {}
    for a in addrs:
        words.setdefault(bank(a, banks, width), set()).add(a // width)
    return max(len(w) for w in words.values())

def column_addrs(row_len, col, pad=0, warp=32):
    return [(r * (row_len + pad) + col) * 4 for r in range(warp)]

print(bank(132), conflict_degree(column_addrs(32, 5)), conflict_degree(column_addrs(32, 5, pad=1)), conflict_degree([0] * 32))
print(conflict_degree([8 * i for i in range(32)]), conflict_degree([12 * i for i in range(32)]), conflict_degree(column_addrs(64, 0, pad=2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1 32 1 1\n2 1 2", "1 32 1 32\n2 1 2", "33 32 1 1\n2 3 2", "1 32 2 1\n2 1 1"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>strided_addrs(base, stride, size=4, warp=32)</C>, the byte addresses a warp reads when lane l reads element l
          × stride; <C>sectors(addrs, size=4, sector=32)</C>, the number of distinct sectors that the accessed bytes fall
          in; and <C>coalesce_efficiency(addrs, size=4, sector=32)</C>, the distinct bytes used divided by the bytes fetched.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def strided_addrs(base, stride, size=4, warp=32):
    return [base] * warp

def sectors(addrs, size=4, sector=32):
    return len(addrs)

def coalesce_efficiency(addrs, size=4, sector=32):
    return 1.0
`,
        solution: COALESCE,
        tests: [
          { name: "sectors", code: `assert strided_addrs(0, 2)[:3] == [0, 8, 16] and strided_addrs(100, 1, size=8, warp=4) == [100, 108, 116, 124]
assert [sectors(strided_addrs(0, s)) for s in (1, 2, 3, 5, 8, 32)] == [4, 8, 12, 20, 32, 32]
assert sectors(strided_addrs(4, 1)) == 5 and sectors([0] * 32) == 1
assert sectors(strided_addrs(2, 1)) == 5 and sectors([30]) == 2, 'A misaligned word can straddle two sectors.'` },
          { name: "efficiency", code: `assert coalesce_efficiency(strided_addrs(0, 1)) == 1.0 and coalesce_efficiency(strided_addrs(0, 2)) == 0.5 and coalesce_efficiency(strided_addrs(0, 32)) == 0.125
assert coalesce_efficiency([0] * 32) == 0.125 and coalesce_efficiency(strided_addrs(0, 1, size=8, warp=4), size=8) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bank(addr, banks=32, width=4)</C>; <C>conflict_degree(addrs, banks=32, width=4)</C>, the largest number
          of distinct words requested from one bank; and <C>column_addrs(row_len, col, pad=0, warp=32)</C>, the byte
          addresses of column col of a float32 tile whose rows are row_len + pad floats long, lane r reading row r.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bank(addr, banks=32, width=4):
    return 0

def conflict_degree(addrs, banks=32, width=4):
    return 1

def column_addrs(row_len, col, pad=0, warp=32):
    return []
`,
        solution: BANKS,
        tests: [
          { name: "banks", code: `assert bank(132) == 1 and bank(128) == 0 and bank(4) == 1 and bank(131) == 0 and bank(8, banks=4, width=8) == 1
assert conflict_degree([0] * 32) == 1 and conflict_degree([0, 128, 4]) == 2 and conflict_degree([0, 2, 128]) == 2
assert conflict_degree([4 * 2 * i for i in range(32)]) == 2 and conflict_degree([4 * 3 * i for i in range(32)]) == 1` },
          { name: "tiles", code: `assert column_addrs(32, 5)[:2] == [20, 148] and len(column_addrs(32, 0, warp=16)) == 16
assert conflict_degree(column_addrs(32, 5)) == 32 and conflict_degree(column_addrs(32, 5, pad=1)) == 1
assert conflict_degree(column_addrs(48, 0)) == 16 and conflict_degree(column_addrs(64, 0, pad=2)) == 2` },
        ],
      },
    },
    {
      key: "transpose",
      rung: "stretch",
      prompt: (
        <p>
          Model a naive transpose of an 8192 × 8192 float32 matrix: reads are fully coalesced, and every write costs a whole
          32-byte sector. At 3.35 TB/s, what is the least time it can take, in milliseconds (with 1 TB = 10<sup>12</sup>{" "}
          bytes)? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.721, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far a thread does one multiply-add at a time. Tensor cores multiply whole small matrices in one instruction, and
        they are where nearly all of a modern GPU&apos;s arithmetic lives.
      </p>
    </>
  ),
};
