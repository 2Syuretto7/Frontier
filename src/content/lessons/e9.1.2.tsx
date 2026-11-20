import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WarpAccessViz } from "@/components/viz/WarpAccessViz";
import type { LessonContent } from "@/lib/types";

const LAYOUT = `def aos_addr(i, field, nfields, size=4):
    return (i * nfields + field) * size

def soa_addr(i, field, n, size=4):
    return (field * n + i) * size

def sectors(addrs, width=4, sector=32):
    return len({s for a in addrs for s in range(a // sector, (a + width - 1) // sector + 1)})`;

const ACCESS = `def efficiency(addrs, width=4, sector=32):
    secs = {s for a in addrs for s in range(a // sector, (a + width - 1) // sector + 1)}
    return len(addrs) * width / (len(secs) * sector)

def expected_gather_sectors(n_words, warp=32, words_per_sector=8):
    m = n_words / words_per_sector
    return m * (1 - (1 - 1 / m) ** warp)

def can_vectorise(addr, vec_bytes):
    return addr % vec_bytes == 0`;

const STRUCTS = `struct Particle { float x, y, z, vx, vy, vz, mass, charge; };   // 32 bytes

// array of structures: lane l reads p[i].x at byte 32 * i, one sector per lane
__global__ void drift_aos(Particle* p, float dt, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) p[i].x += dt * p[i].vx;
}

// structure of arrays: lane l reads x[i] at byte 4 * i, four sectors per warp
__global__ void drift_soa(float* x, const float* vx, float dt, int n) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) x[i] += dt * vx[i];
}

// vectorised: each lane moves 16 bytes; x must be 16-byte aligned and n a multiple of 4
__global__ void copy4(const float4* __restrict__ src, float4* __restrict__ dst, int n4) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n4) dst[i] = src[i];
}`;

export const lesson: LessonContent = {
  id: "e9.1.2",
  minutes: 50,
  links: {
    requires: ["e9.1.1", "e7.3.2"],
    revisits: ["e3.2.2", "m4.6.3"],
    foreshadows: ["e9.1.3", "e9.3.1"],
  },

  puzzle: (
    <>
      <p>
        A particle simulation stores each particle as a 32-byte struct of eight floats, and one kernel only updates positions from
        velocities. Rewriting the data as separate arrays, one per field, makes that kernel about eight times faster, without changing a
        single arithmetic operation. Where did the time go, and how can you predict such a speedup before trying it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The memory system does not deliver single words. When the 32 lanes of a warp issue a load together, the hardware gathers the
        addresses and fetches every 32-byte sector that contains any of them. If the lanes read neighbouring words, a few sectors serve
        the whole warp. If each lane&apos;s word sits in its own sector, the warp pays for 32 sectors and uses one word of each. Kernel
        design is largely the art of arranging data and threads so that lanes that run together read together.
      </p>
      <WarpAccessViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the cost of a warp's request">
        <p>
          Recall from e7.3.2 that a warp&apos;s load is served by fetching the set of 32-byte sectors that cover the requested bytes
          (<C>sectors</C>); efficiency is the share of fetched bytes that are used (<C>efficiency</C>). The layout of the data decides
          the addresses. For an array of structures with k fields of size s, element i&apos;s field f is at byte (ik + f)s; for a
          structure of arrays of length n it is at (fn + i)s (<C>aos_addr</C>, <C>soa_addr</C>). In the first, consecutive lanes are ks
          bytes apart; in the second, s bytes apart.
        </p>
        <Code>{LAYOUT}</Code>
        <Code>{STRUCTS}</Code>
      </Definition>

      <Definition title="alignment and vector loads">
        <p>
          A lane can load 8 or 16 bytes in one instruction (<C>float2</C>, <C>float4</C>) if the address is a multiple of the width
          (<C>can_vectorise</C>); a misaligned vector access is an error, not a slow path. Vector loads cut the number of load
          instructions by up to four, and they rescue arrays of small structures: a lane that loads its whole 16-byte struct with one{" "}
          <C>float4</C> uses every byte fetched. A scalar access that is merely offset from a sector boundary costs one extra sector per
          warp. Allocations from <C>cudaMalloc</C> are aligned to at least 256 bytes, so misalignment usually comes from offsets into a
          buffer, such as a slice that starts at an odd element.
        </p>
        <Code>{ACCESS}</Code>
      </Definition>

      <Theorem title="the cost of a random gather">
        <p>
          Let the 32 lanes of a warp read independent, uniformly random words from an array occupying M sectors. The expected number of
          distinct sectors fetched is <M>{"M\\left(1 - (1 - 1/M)^{32}\\right)"}</M> (<C>expected_gather_sectors</C>), which approaches 32
          as M grows.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"I_j"}</M> be 1 if sector j is fetched and 0 otherwise. Sector j is missed exactly when all 32 lanes pick other
          sectors, which by independence has probability <M>{"(1 - 1/M)^{32}"}</M>. The number of sectors fetched is{" "}
          <M>{"\\sum_j I_j"}</M>, and by linearity of expectation its mean is{" "}
          <M>{"\\sum_j P(I_j = 1) = M(1 - (1 - 1/M)^{32})"}</M>. As M grows, <M>{"(1 - 1/M)^{32} = 1 - 32/M + O(1/M^2)"}</M>, so the mean
          tends to 32. For a large table a random gather therefore uses about one word in eight of what it fetches, unless other warps
          reuse the same sectors while they are still in cache.
        </p>
      </Proof>

      <Remark title="caches and gathers in practice">
        <p>
          Sectors pass through L2 and, for loads, usually L1, so a wasteful pattern costs less when neighbouring warps soon use the rest
          of each sector, as in a stencil that reads overlapping neighbourhoods. Marking inputs <C>const __restrict__</C> lets the compiler
          use the read-only data path. Many gathers in deep learning, such as looking up rows of an embedding table, are cheap when a warp
          handles one row: the row&apos;s start is random but the lanes read consecutive words within it. Profilers report the ratio of
          sectors to requests for each load, which is exactly the quantity this lesson computes.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With 32-byte particles, lane l&apos;s x is 32 bytes from lane l + 1&apos;s, so a warp fetches 32 sectors to use 128 bytes: one
          eighth efficiency, and the same again for the velocities. With one array per field the same loads touch 4 sectors each. A
          kernel limited by memory bandwidth, as this one is, speeds up by close to the ratio, eight. The arithmetic was never the cost.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "aos",
      rung: "check",
      prompt: (
        <p>
          Particles are stored as 12-byte structs of three floats, aligned at byte 0. A warp reads the first float of 32 consecutive
          particles. How many 32-byte sectors does it fetch?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
    {
      key: "offset",
      rung: "check",
      prompt: (
        <p>
          A warp reads 32 consecutive 8-byte doubles starting at byte 8. What fraction of the bytes fetched are used? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.889, tolerance: 0.001 },
    },
    {
      key: "embed",
      rung: "apply",
      prompt: (
        <p>
          A kernel looks up random rows of a large embedding table, each row 1024 contiguous floats, with one warp copying each row. Is
          its memory access efficient?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Yes: only the row start is random, and within a row the lanes read consecutive words, so each request is coalesced",
          "No: every lane reads from a random sector, so efficiency is one word in eight",
          "No: gathers can never be coalesced",
          "Yes, but only if the table is small enough to fit in shared memory",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def aos_addr(i, field, nfields, size=4):
    return (i * nfields + field) * size

def soa_addr(i, field, n, size=4):
    return (field * n + i) * size

def sectors(addrs, width=4, sector=32):
    return len({s for a in addrs for s in range(a // sector, (a + width - 1) // sector + 1)})

a = [aos_addr(3, 1, 4), soa_addr(3, 1, 100)]
print(*a, sectors([0, 4, 8, 60]), sectors([28, 64], width=8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "52 412 2 3",
          "52 412 2 2",
          "16 412 2 3",
          "52 103 2 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def efficiency(addrs, width=4, sector=32):
    secs = {s for a in addrs for s in range(a // sector, (a + width - 1) // sector + 1)}
    return len(addrs) * width / (len(secs) * sector)

def expected_gather_sectors(n_words, warp=32, words_per_sector=8):
    m = n_words / words_per_sector
    return m * (1 - (1 - 1 / m) ** warp)

def can_vectorise(addr, vec_bytes):
    return addr % vec_bytes == 0

print(efficiency([4 * i for i in range(8)]), efficiency([32 * i for i in range(4)]), round(expected_gather_sectors(16, warp=2), 3), can_vectorise(48, 16), can_vectorise(40, 16))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.125 1.5 True False",
          "1.0 0.5 1.5 True False",
          "1.0 0.125 2.0 True False",
          "1.0 0.125 1.5 True True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>aos_addr(i, field, nfields, size=4)</C> and <C>soa_addr(i, field, n, size=4)</C>, the byte address of element i&apos;s
          field in each layout; and <C>sectors(addrs, width=4, sector=32)</C>, the number of distinct sectors covering accesses of width
          bytes at the given addresses.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def aos_addr(i, field, nfields, size=4):
    return i * size

def soa_addr(i, field, n, size=4):
    return i * size

def sectors(addrs, width=4, sector=32):
    return len(addrs)
`,
        solution: LAYOUT,
        tests: [
          { name: "layout", code: `assert aos_addr(2, 0, 3) == 24 and aos_addr(0, 2, 3, 8) == 16\nassert soa_addr(2, 1, 10) == 48 and soa_addr(0, 0, 5) == 0` },
          { name: "sectors", code: `assert sectors([0, 32, 64]) == 3 and sectors([30], width=4) == 2\nassert sectors([4 * i for i in range(32)]) == 4 and sectors([]) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>efficiency(addrs, width=4, sector=32)</C>, used bytes over fetched bytes for distinct accesses;{" "}
          <C>expected_gather_sectors(n_words, warp=32, words_per_sector=8)</C>, the theorem&apos;s formula for an array of n_words words;
          and <C>can_vectorise(addr, vec_bytes)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def efficiency(addrs, width=4, sector=32):
    return 1.0

def expected_gather_sectors(n_words, warp=32, words_per_sector=8):
    return float(warp)

def can_vectorise(addr, vec_bytes):
    return True
`,
        solution: ACCESS,
        tests: [
          { name: "efficiency", code: `assert efficiency([4 * i for i in range(32)]) == 1.0\nassert abs(efficiency([8 + 4 * i for i in range(16)]) - 2 / 3) < 1e-12` },
          { name: "gather", code: `assert abs(expected_gather_sectors(8, warp=5) - 1.0) < 1e-12 and abs(expected_gather_sectors(64, warp=3) - 2.640625) < 1e-12\nassert can_vectorise(32, 16) and not can_vectorise(8, 16) and can_vectorise(8, 8)` },
        ],
      },
    },
    {
      key: "table",
      rung: "stretch",
      prompt: (
        <p>
          A warp gathers 32 independent, uniformly random words from a table of M sectors. What is the smallest whole number M for which
          the expected number of distinct sectors fetched is at least 30?
        </p>
      ),
      answer: { kind: "numeric", value: 238, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Some access patterns cannot be made contiguous, such as reading a matrix by columns. The next lesson stages data through shared
        memory so that global memory is always read in coalesced rows, whatever order the computation needs.
      </p>
    </>
  ),
};
