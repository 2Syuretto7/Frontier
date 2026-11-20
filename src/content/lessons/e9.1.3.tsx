import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HaloTileViz } from "@/components/viz/HaloTileViz";
import type { LessonContent } from "@/lib/types";

const COUNTS = `def tile_loads(T, r, dims=1):
    return (T + 2 * r) ** dims

def reads_per_output(T, r, dims=1):
    return tile_loads(T, r, dims) / T ** dims

def max_tile(r, smem_bytes, word=4, dims=2):
    T = 0
    while (T + 1 + 2 * r) ** dims * word <= smem_bytes:
        T += 1
    return T`;

const STAGE = `def stencil_tiled(x, r, T):
    out = []
    for start in range(0, len(x), T):
        tile = [x[i] if 0 <= i < len(x) else 0 for i in range(start - r, start + T + r)]
        for j in range(min(T, len(x) - start)):
            out.append(sum(tile[j:j + 2 * r + 1]))
    return out

def needs_sync(writes, reads):
    owner = {a: t for t, ws in enumerate(writes) for a in ws}
    return any(owner.get(a, t) != t for t, rs in enumerate(reads) for a in rs)

def halo_fraction(T, r, dims=2):
    return 1 - T ** dims / (T + 2 * r) ** dims`;

const BLUR = `#define T 16
#define R 2
#define S (T + 2 * R)

__global__ void blur(const float* in, float* out, int h, int w) {
    __shared__ float tile[S][S];
    int row0 = blockIdx.y * T - R, col0 = blockIdx.x * T - R;
    // phase 1: the block's T * T threads load S * S inputs, zero outside the image;
    // consecutive threads load consecutive columns, so the loads coalesce
    for (int k = threadIdx.y * T + threadIdx.x; k < S * S; k += T * T) {
        int r = row0 + k / S, c = col0 + k % S;
        tile[k / S][k % S] = (r >= 0 && r < h && c >= 0 && c < w) ? in[r * w + c] : 0.0f;
    }
    __syncthreads();   // every load is finished before any thread reads the tile
    // phase 2: each thread computes one output from shared memory only
    int r = blockIdx.y * T + threadIdx.y, c = blockIdx.x * T + threadIdx.x;
    if (r < h && c < w) {
        float s = 0.0f;
        for (int i = 0; i <= 2 * R; i++)
            for (int j = 0; j <= 2 * R; j++)
                s += tile[threadIdx.y + i][threadIdx.x + j];
        out[r * w + c] = s / ((2 * R + 1) * (2 * R + 1));
    }
}`;

export const lesson: LessonContent = {
  id: "e9.1.3",
  minutes: 55,
  links: {
    requires: ["e9.1.2", "e7.3.4"],
    revisits: ["e7.3.2", "e7.4.2"],
    foreshadows: ["e9.2.1", "e9.4.2"],
  },

  puzzle: (
    <>
      <p>
        A 5 by 5 blur reads 25 inputs for every output. Written directly, the kernel asks global memory for 25 times as many values as
        the image holds, and it runs at a fraction of the speed of a plain copy, even though each input is needed only by its 25
        neighbours. How can a kernel arrange for each input to come from global memory about once, and what limits how close it gets?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Shared memory is a small, fast scratchpad that all threads of a block can read and write. A block that will need the same inputs
        many times copies them in once, with coalesced loads, waits until the copy is complete, and then computes from the scratchpad.
        The cost is a border: a block computing a square of outputs needs the inputs one radius beyond it. Bigger squares make the border
        relatively thinner, but the scratchpad is small and shared by all blocks on a multiprocessor.
      </p>
      <HaloTileViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shared memory and barriers">
        <p>
          A variable declared <C>__shared__</C> has one copy per block, lives on the multiprocessor, and is visible to every thread of the
          block (its banks and conflicts are in e7.3.2). <C>__syncthreads()</C> is a barrier: no thread of the block continues until all
          have reached it, and writes to shared memory made before it are visible to every thread after it. A tiled kernel alternates
          phases: load into shared memory, barrier, compute from shared memory, and, if the tile is reused for the next piece of work,
          another barrier before it is overwritten.
        </p>
        <Code>{BLUR}</Code>
      </Definition>

      <Theorem title="the halo overhead">
        <p>
          A d-dimensional stencil of radius r computed in tiles of <M>{"T^d"}</M> outputs, each loading its tile and halo once, reads{" "}
          <M>{"(1 + 2r/T)^d"}</M> inputs from global memory per output (<C>tile_loads</C>, <C>reads_per_output</C>), against{" "}
          <M>{"(2r + 1)^d"}</M> without tiling. The ratio decreases towards 1 as T grows, and the share of loaded values in the halo is{" "}
          <M>{"1 - T^d / (T + 2r)^d"}</M> (<C>halo_fraction</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Every output in the tile depends on the inputs within distance r of it in each coordinate, so the union of dependencies is the
          box of side T + 2r, which holds <M>{"(T + 2r)^d"}</M> inputs; dividing by the <M>{"T^d"}</M> outputs gives{" "}
          <M>{"((T + 2r)/T)^d = (1 + 2r/T)^d"}</M>. Since 2r/T decreases in T and is positive, so does the ratio, with limit 1. The halo
          is the box minus the tile, which gives the stated share. Without tiling each output reads its own box of side 2r + 1.
        </p>
      </Proof>

      <Definition title="choosing the tile">
        <p>
          The tile and halo must fit the block&apos;s shared memory: <M>{"(T + 2r)^d"}</M> values times the bytes per value
          (<C>max_tile</C>). A block can declare up to 48 KB statically; recent GPUs allow more per block through dynamic allocation and an
          explicit opt-in. Shared memory per block also limits how many blocks share a multiprocessor (e7.3.4), so the largest tile is not
          always the fastest. The thread count matters too: the kernel above uses one thread per output and loops to load the larger
          tile, a common pattern.
        </p>
        <Code>{COUNTS}</Code>
      </Definition>

      <Remark title="races and the barrier">
        <p>
          The barrier is needed exactly when a thread reads a shared location that a different thread wrote in the previous phase
          (<C>needs_sync</C>); without it the reader may see the old value, and the bug appears only on some runs. Every thread of the
          block must reach the same <C>__syncthreads()</C>, so it must not sit inside a branch that some threads skip, such as the bounds
          check above: the load loop and the barrier come first, and only the computation is guarded. The Python below simulates the
          staged computation one tile at a time (<C>stencil_tiled</C>); its result must match the untiled computation exactly.
        </p>
        <Code>{STAGE}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With 16 by 16 tiles and radius 2 the block loads a 20 by 20 square for 256 outputs, so global memory supplies about 1.6 values
          per output instead of 25, and the 1.6 KB tile leaves room for many blocks per multiprocessor. The remaining excess is the halo,
          which shrinks as the tile grows, at the cost of shared memory.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "global",
      rung: "check",
      prompt: (
        <p>
          A two-dimensional stencil of radius 3 is computed in 16 by 16 output tiles. How many values are read from global memory per
          output? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.891, tolerance: 0.001 },
    },
    {
      key: "budget",
      rung: "check",
      prompt: (
        <p>
          A block may use 48 KB (49,152 bytes) of shared memory for a square tile of floats with a halo of radius 3. What is the largest
          output tile side T?
        </p>
      ),
      answer: { kind: "numeric", value: 104, tolerance: 0 },
    },
    {
      key: "barrier",
      rung: "apply",
      prompt: <p>What can go wrong if the blur kernel above omits the <C>__syncthreads()</C> after loading the tile?</p>,
      answer: {
        kind: "choice",
        options: [
          "A thread may read tile entries that other threads have not yet written, getting stale values on some runs",
          "The kernel fails to compile, because shared memory requires a barrier",
          "Nothing, because all threads of a block always run in lockstep",
          "The loads stop coalescing",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tile_loads(T, r, dims=1):
    return (T + 2 * r) ** dims

def reads_per_output(T, r, dims=1):
    return tile_loads(T, r, dims) / T ** dims

def max_tile(r, smem_bytes, word=4, dims=2):
    T = 0
    while (T + 1 + 2 * r) ** dims * word <= smem_bytes:
        T += 1
    return T

n = tile_loads(8, 1)
print(n, reads_per_output(4, 2, dims=2), max_tile(1, 400, dims=2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10 4.0 8",
          "10 2.0 8",
          "9 4.0 8",
          "10 4.0 10",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def stencil_tiled(x, r, T):
    out = []
    for start in range(0, len(x), T):
        tile = [x[i] if 0 <= i < len(x) else 0 for i in range(start - r, start + T + r)]
        for j in range(min(T, len(x) - start)):
            out.append(sum(tile[j:j + 2 * r + 1]))
    return out

def needs_sync(writes, reads):
    owner = {a: t for t, ws in enumerate(writes) for a in ws}
    return any(owner.get(a, t) != t for t, rs in enumerate(reads) for a in rs)

def halo_fraction(T, r, dims=2):
    return 1 - T ** dims / (T + 2 * r) ** dims

x = [1, 2, 3, 4, 5]
print(stencil_tiled(x, 1, 2), needs_sync([[0], [1]], [[0], [1]]), needs_sync([[0], [1]], [[1], [0]]), halo_fraction(2, 1, dims=1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 6, 9, 12, 9] False True 0.5",
          "[3, 6, 9, 12, 5] False True 0.5",
          "[3, 6, 9, 12, 9] True True 0.5",
          "[3, 6, 9, 12, 9] False True 0.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tile_loads(T, r, dims=1)</C>, the inputs a tile of <M>{"T^d"}</M> outputs loads; <C>reads_per_output(T, r, dims=1)</C>;
          and <C>max_tile(r, smem_bytes, word=4, dims=2)</C>, the largest T whose tile and halo fit in smem_bytes, or 0 if none does.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tile_loads(T, r, dims=1):
    return T ** dims

def reads_per_output(T, r, dims=1):
    return 1.0

def max_tile(r, smem_bytes, word=4, dims=2):
    return 0
`,
        solution: COUNTS,
        tests: [
          { name: "loads", code: `assert tile_loads(16, 2, 2) == 400\nassert abs(reads_per_output(32, 1) - 34 / 32) < 1e-12` },
          { name: "budget", code: `assert max_tile(2, 1024, dims=1) == 252 and max_tile(0, 256, dims=2) == 8\nassert max_tile(5, 100, dims=2) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stencil_tiled(x, r, T)</C>, the sums of each window of radius r (zero outside x), computed tile by tile from a staged
          copy of the tile and its halo; <C>needs_sync(writes, reads)</C>, which takes, for each thread, the shared addresses it writes in
          one phase and reads in the next, and says whether some thread reads an address another thread wrote; and{" "}
          <C>halo_fraction(T, r, dims=2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def stencil_tiled(x, r, T):
    return list(x)

def needs_sync(writes, reads):
    return False

def halo_fraction(T, r, dims=2):
    return 0.0
`,
        solution: STAGE,
        tests: [
          { name: "stencil", code: `x = list(range(7))\nnaive = [sum(x[j] for j in range(i - 2, i + 3) if 0 <= j < 7) for i in range(7)]\nassert stencil_tiled(x, 2, 3) == naive and stencil_tiled([4, 5], 0, 1) == [4, 5]` },
          { name: "sync", code: `assert not needs_sync([[0, 1], [2, 3]], [[0, 1], [2, 3]]) and needs_sync([[0], [1], [2]], [[0], [1], [0]])\nassert not needs_sync([[], []], [[5], [6]]) and abs(halo_fraction(8, 1, 2) - 0.36) < 1e-12` },
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: (
        <p>
          A three-dimensional stencil of radius 1 is computed in T by T by T tiles. What is the smallest T for which global reads per
          output are at most 1.2?
        </p>
      ),
      answer: { kind: "numeric", value: 32, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Tiling pays most when every input is reused many times, and nothing reuses inputs like matrix multiplication. The next chapter
        applies the same load, barrier, compute pattern to it, but first a different use of cooperation inside a block: reductions.
      </p>
    </>
  ),
};
