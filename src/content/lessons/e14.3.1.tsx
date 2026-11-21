import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TileCacheViz } from "@/components/viz/TileCacheViz";
import type { LessonContent } from "@/lib/types";

const LOOPS = `from collections import OrderedDict

def tile_order(M, N, tm, tn):
    return [(i, j) for io in range(0, M, tm) for jo in range(0, N, tn)
            for i in range(io, min(io + tm, M)) for j in range(jo, min(jo + tn, N))]

def matmul_reads(order, K):
    return [r for i, j in order for k in range(K) for r in (("A", i, k), ("B", k, j))]

def lru_misses(accesses, capacity):
    cache, misses = OrderedDict(), 0
    for a in accesses:
        if a in cache:
            cache.move_to_end(a)                           # now the most recently used
        else:
            misses += 1
            cache[a] = True
            if len(cache) > capacity:
                cache.popitem(last=False)                  # evict the least recently used
    return misses`;

const MODEL = `def tile_traffic(M, N, K, tm, tn):
    tiles = (M // tm) * (N // tn)
    return tiles * (tm * K + K * tn) + M * N               # each tile loads its A rows and B columns once

def fits(tm, tn, tk, capacity):
    return tm * tk + tk * tn <= capacity                   # one slice of A and of B on chip at a time

def best_tile(M, N, K, cands, capacity):
    ok = [c for c in cands if fits(*c, capacity)]
    return min(ok, key=lambda c: tile_traffic(M, N, K, c[0], c[1])) if ok else None`;

export const lesson: LessonContent = {
  id: "e14.3.1",
  minutes: 50,
  links: {
    requires: ["e14.2.3", "e9.1.3"],
    revisits: ["e9.2.1", "e7.2.3", "e7.4.2"],
    foreshadows: ["e14.3.2"],
  },

  puzzle: (
    <>
      <p>
        The three nested loops of a matrix multiplication compute the same result in any of six orders, and with any
        blocking of the loops into tiles. On a GPU, the fastest arrangement runs more than ten times faster than the
        naive one. In e9.2.1 you found it by hand. A compiler generating code for thousands of different fused kernels
        cannot. How does it describe the space of arrangements, and how does it predict which ones are good?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Separate what is computed from the order it is computed in. The algorithm says that each output is a sum of
        products; the schedule says how the loops are split, reordered, tiled, and mapped to threads. Every schedule
        computes the same values, so the compiler is free to choose the one that keeps data in fast memory. Tiling is
        the central move: computing a block of outputs together lets them share the rows and columns they read.
      </p>
      <TileCacheViz />
    </>
  ),

  theory: (
    <>
      <Definition title="schedules">
        <p>
          A schedule transforms the loop nest without changing the set of iterations: splitting a loop into an outer
          loop over blocks and an inner loop within a block, reordering loops, and tiling, which splits two loops and
          moves both outer loops outside both inner ones (<C>tile_order</C>). The order of iterations determines the
          sequence of memory reads (<C>matmul_reads</C>), and a cache simulation counts how many of them miss{" "}
          (<C>lru_misses</C>).
        </p>
        <Code>{LOOPS}</Code>
      </Definition>

      <Theorem title="traffic of a tiled matrix multiplication">
        <p>
          Computing the M by N output of a matrix multiplication with inner dimension K in tiles of <M>{"t_m \\times t_n"}</M>, each tile loading its rows of A and columns of B once, moves <M>{"MNK(1/t_n + 1/t_m) + MN"}</M> elements
          between slow and fast memory. For square tiles of side T, the arithmetic intensity of the loads is T/2 FLOPs
          per element moved.
        </p>
      </Theorem>
      <Proof>
        <p>
          There are <M>{"(M/t_m)(N/t_n)"}</M> tiles. Each needs <M>{"t_m K"}</M> elements of A and{" "}
          <M>{"K t_n"}</M> of B, so loads total <M>{"(M/t_m)(N/t_n)(t_m + t_n)K = MNK(1/t_n + 1/t_m)"}</M>; each output
          is written once, adding MN (<C>tile_traffic</C>). With <M>{"t_m = t_n = T"}</M>, loads are{" "}
          <M>{"2MNK/T"}</M> elements for <M>{"2MNK"}</M> FLOPs, an intensity of T/2 FLOPs per element. Larger tiles
          raise intensity linearly, which is why the roofline of e7.4.2 pushes tiles as large as fast memory allows.
        </p>
      </Proof>

      <Example title="schedules in practice">
        <p>
          Halide introduced the separation of algorithm and schedule for image processing, and TVM carried it to deep
          learning, with scheduling primitives such as split, reorder, tile, vectorise and bind-to-thread. On GPUs the
          tiling is hierarchical: a thread block computes a tile from shared memory, each warp a sub-tile, and each
          tensor core instruction a fragment held in registers (e9.1.3, e9.2.1). Triton fixes the block level as the unit
          of programming, so its users choose block sizes, and its compiler schedules everything inside a block.
        </p>
      </Example>

      <Remark title="constraints and legality">
        <p>
          A tile must fit: the slices of A and B in flight, plus accumulators, must fit in shared memory and registers{" "}
          (<C>fits</C>), and among the tiles that fit the model picks the least traffic (<C>best_tile</C>). Reordering
          must respect dependences; the reduction over k may be split and reordered only because addition is treated as
          associative, which in floating point changes the last bits of the result. The traffic model ignores caches
          between levels, bank conflicts and occupancy, so compilers use it to prune candidates and then measure the
          survivors, the subject of the next lesson.
        </p>
        <Code>{MODEL}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "traffic",
      rung: "check",
      prompt: (
        <p>
          A 4096 × 4096 × 4096 matrix multiplication uses 128 × 128 output tiles, each loading its rows of A and columns
          of B once, and writes each output once. How many elements move between slow and fast memory?
        </p>
      ),
      answer: { kind: "numeric", value: 1090519040, tolerance: 0 },
    },
    {
      key: "intensity",
      rung: "check",
      prompt: (
        <p>
          Counting only the loads of A and B in BF16 (2 bytes an element), with square T × T tiles, what is the smallest
          T for which a tiled matrix multiplication reaches 295 FLOPs per byte, roughly the ridge point of a recent
          GPU?
        </p>
      ),
      answer: { kind: "numeric", value: 590, tolerance: 0 },
    },
    {
      key: "toobig",
      rung: "apply",
      prompt: <p>In the figure, why do the largest tiles miss more often than medium ones?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their rows of A and columns of B no longer fit in the cache together, so data is evicted before it is reused",
          "Large tiles compute different values",
          "Large tiles read fewer elements",
          "The cache is flushed between tiles",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import OrderedDict

def tile_order(M, N, tm, tn):
    return [(i, j) for io in range(0, M, tm) for jo in range(0, N, tn)
            for i in range(io, min(io + tm, M)) for j in range(jo, min(jo + tn, N))]

def matmul_reads(order, K):
    return [r for i, j in order for k in range(K) for r in (("A", i, k), ("B", k, j))]

def lru_misses(accesses, capacity):
    cache, misses = OrderedDict(), 0
    for a in accesses:
        if a in cache:
            cache.move_to_end(a)                           # now the most recently used
        else:
            misses += 1
            cache[a] = True
            if len(cache) > capacity:
                cache.popitem(last=False)                  # evict the least recently used
    return misses

print(tile_order(4, 4, 2, 2)[:5], matmul_reads([(1, 2)], 2))
print(lru_misses(["a", "b", "a", "c", "b"], 2), lru_misses(["a", "b", "a", "c", "b"], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 0), (0, 1), (1, 0), (1, 1), (0, 2)] [('A', 1, 0), ('B', 0, 2), ('A', 1, 1), ('B', 1, 2)]\n4 3",
          "[(0, 0), (0, 1), (0, 2), (0, 3), (1, 0)] [('A', 1, 0), ('B', 0, 2), ('A', 1, 1), ('B', 1, 2)]\n4 3",
          "[(0, 0), (0, 1), (1, 0), (1, 1), (0, 2)] [('A', 1, 0), ('B', 0, 2), ('A', 1, 1), ('B', 1, 2)]\n3 3",
          "[(0, 0), (0, 1), (1, 0), (1, 1), (0, 2)] [('A', 1, 0), ('A', 1, 1), ('B', 0, 2), ('B', 1, 2)]\n4 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tile_traffic(M, N, K, tm, tn):
    tiles = (M // tm) * (N // tn)
    return tiles * (tm * K + K * tn) + M * N               # each tile loads its A rows and B columns once

def fits(tm, tn, tk, capacity):
    return tm * tk + tk * tn <= capacity                   # one slice of A and of B on chip at a time

def best_tile(M, N, K, cands, capacity):
    ok = [c for c in cands if fits(*c, capacity)]
    return min(ok, key=lambda c: tile_traffic(M, N, K, c[0], c[1])) if ok else None

print(tile_traffic(8, 8, 8, 4, 4), fits(64, 64, 32, 4096), fits(64, 64, 32, 4095))
print(best_tile(64, 64, 64, [(16, 16, 16), (32, 32, 32), (32, 16, 64)], 2048))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "320 True False\n(32, 32, 32)",
          "256 True False\n(32, 32, 32)",
          "320 True True\n(32, 16, 64)",
          "320 True False\n(16, 16, 16)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tile_order(M, N, tm, tn)</C>, the (i, j) visits of the tiled loops; <C>matmul_reads(order, K)</C>,
          reading (&quot;A&quot;, i, k) then (&quot;B&quot;, k, j) for each k; and{" "}
          <C>lru_misses(accesses, capacity)</C> for a least-recently-used cache.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import OrderedDict

def tile_order(M, N, tm, tn):
    return [(i, j) for i in range(M) for j in range(N)]

def matmul_reads(order, K):
    return []

def lru_misses(accesses, capacity):
    return len(set(accesses))
`,
        solution: LOOPS,
        tests: [
          { name: "order", code: `assert tile_order(2, 3, 2, 2) == [(0, 0), (0, 1), (1, 0), (1, 1), (0, 2), (1, 2)] and tile_order(1, 1, 4, 4) == [(0, 0)] and matmul_reads([(0, 0)], 1) == [("A", 0, 0), ("B", 0, 0)] and matmul_reads([], 5) == []` },
          { name: "lru", code: `assert lru_misses([1, 2, 3, 1, 2, 3], 2) == 6 and lru_misses([1, 2, 3, 1, 2, 3], 3) == 3 and lru_misses([1, 1, 1], 1) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tile_traffic(M, N, K, tm, tn)</C> for tiles dividing the matrix exactly; <C>fits(tm, tn, tk,
          capacity)</C>, whether a tm × tk slice of A and a tk × tn slice of B fit; and{" "}
          <C>best_tile(M, N, K, cands, capacity)</C>, the fitting (tm, tn, tk) candidate with least traffic, the first on
          ties, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tile_traffic(M, N, K, tm, tn):
    return 2 * M * N * K

def fits(tm, tn, tk, capacity):
    return True

def best_tile(M, N, K, cands, capacity):
    return cands[0]
`,
        solution: MODEL,
        tests: [
          { name: "traffic", code: `assert tile_traffic(16, 16, 4, 8, 4) == 640 and fits(8, 8, 8, 128) and not fits(8, 8, 9, 128)` },
          { name: "best", code: `assert best_tile(32, 32, 32, [(8, 8, 8), (16, 16, 16)], 100) is None and best_tile(32, 32, 32, [(8, 8, 8), (16, 16, 4)], 128) == (16, 16, 4)` },
        ],
      },
    },
    {
      key: "smem",
      rung: "stretch",
      prompt: (
        <p>
          Square T × T output tiles stream slices with tk = 64 through 192 KB (196,608 bytes) of shared memory, holding
          one BF16 slice of A and one of B at a time, with accumulators in registers. What is the largest T that is a
          multiple of 64 and fits?
        </p>
      ),
      answer: { kind: "numeric", value: 768, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A model narrows the choices but cannot pick the winner reliably. The next lesson lets the hardware decide, by
        measuring candidates and searching the space efficiently.
      </p>
    </>
  ),
};
