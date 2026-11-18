import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CacheConflictViz } from "@/components/viz/CacheConflictViz";
import type { LessonContent } from "@/lib/types";

const SETS = `def set_index(addr, num_sets, line=64):
    return addr // line % num_sets

def sets_hit(stride, count, num_sets, line=64):
    return len({set_index(i * stride, num_sets, line) for i in range(count)})

def column_rehits(stride, count, num_sets, ways, line=64):
    per_set = {}
    for i in range(count):
        s = set_index(i * stride, num_sets, line)
        per_set[s] = per_set.get(s, 0) + 1
    return sum(c for c in per_set.values() if c <= ways)`;

const TILES = `import math

def best_tile(cache_words):
    return math.isqrt(cache_words // 3)

def matmul_traffic(n, b):
    return 2 * n ** 3 // b + 2 * n * n

def false_shared(writes, line=64):
    owners = {}
    for thread, addrs in writes.items():
        for a in addrs:
            owners.setdefault(a // line, set()).add(thread)
    return sorted(l for l, ts in owners.items() if len(ts) > 1)`;

export const lesson: LessonContent = {
  id: "e7.2.3",
  minutes: 55,
  links: {
    requires: ["e7.2.2", "e3.3.2"],
    revisits: ["e3.3.1", "e7.1.3"],
    foreshadows: ["e7.3.2", "e7.4.2"],
  },

  puzzle: (
    <>
      <p>
        Transposing a 1024 × 1024 matrix of floats takes noticeably longer than transposing a 1040 × 1040 one, even though
        the larger matrix has 3% more elements. Nothing about the algorithm changes with the size. What about the number
        1024 upsets the cache?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A cache is not one big pool. Each address may live only in a small set of places, chosen by a few bits of the
        address. Addresses that are a large power of two apart share those bits, so they fight over the same few places
        while the rest of the cache sits empty. Walking down a column of a matrix whose rows are a power of two bytes long
        does exactly that.
      </p>
      <CacheConflictViz />
      <p>
        The other half of the story is reuse. A cache only helps if data is used again before it is evicted, and the way
        to make that happen in matrix multiplication is to work on tiles small enough that all the data a tile needs stays
        in the cache.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="set index">
        <p>
          A cache with S sets and lines of L bytes keeps the line holding address a in set{" "}
          <M>{"\\lfloor a / L \\rfloor \\bmod S"}</M>; each set has W ways (e3.3.1). Real L1 caches are small and highly
          regular: 32 KB or 48 KB, 64-byte lines, 64 sets.
        </p>
        <Code>{SETS}</Code>
      </Definition>

      <Theorem title="sets reached by a stride">
        <p>
          Accesses at addresses <M>{"0, kL, 2kL, \\dots"}</M> for a whole number k reach exactly{" "}
          <MD>{"\\frac{S}{\\gcd(k, S)}"}</MD>
          different sets, once there are at least that many accesses. When S is a power of two and k is a multiple of S,
          they all land in one set.
        </p>
      </Theorem>
      <Proof>
        <p>
          The i-th access lands in set <M>{"ik \\bmod S"}</M>. Let <M>{"g = \\gcd(k, S)"}</M>. Every value ik mod S is a
          multiple of g, so at most S/g sets are reached. Conversely, <M>{"ik \\equiv jk \\pmod S"}</M> means S divides{" "}
          <M>{"(i - j)k"}</M>, that is, <M>{"S/g"}</M> divides <M>{"(i - j)(k/g)"}</M>, and since <M>{"S/g"}</M> and{" "}
          <M>{"k/g"}</M> are coprime, <M>{"S/g"}</M> divides <M>{"i - j"}</M>. So the first S/g accesses reach distinct sets.
          With a row of 1024 floats, k = 4096/64 = 64 = S and one set is reached; with 1040 floats, k = 65 is coprime to 64
          and every set is reached.
        </p>
      </Proof>

      <Example title="padding">
        <p>
          The cure is to allocate rows a little longer than needed, so that the stride in lines is odd, and keep using only
          the first n columns. This is why some libraries pad leading dimensions, and why benchmark curves of matrix
          operations have spikes at powers of two. In the viz, a column of 256 rows needs 256 lines; with 8 ways the cache
          can keep them only if they spread over at least 32 sets, as they do for every row length except those near 1024.
        </p>
      </Example>

      <Theorem title="traffic of tiled matrix multiplication">
        <p>
          Multiply two n × n matrices in b × b tiles, with b dividing n, so that for each tile of C the tile stays in cache
          while the matching tiles of A and B are streamed through. If three tiles fit in the cache, that is{" "}
          <M>{"3b^2 \\le M"}</M> words, the number of words moved between memory and cache is
        </p>
        <MD>{"\\frac{2n^3}{b} + 2n^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          There are <M>{"(n/b)^2"}</M> tiles of C. Each is read once and written once, <M>{"2b^2"}</M> words, and for each of
          the n/b tile products that contribute to it, one tile of A and one of B are read, <M>{"2b^2"}</M> words. Since
          three tiles fit, nothing is read twice within a tile product. The total is{" "}
          <M>{"(n/b)^2\\,(2b^2 + (n/b)\\,2b^2) = 2n^2 + 2n^3/b"}</M>. Without tiling (b = 1) this is about{" "}
          <M>{"2n^3"}</M>; the largest tile that fits, <M>{"b \\approx \\sqrt{M/3}"}</M>, divides the traffic by about b.
          Hong and Kung proved that no ordering of the classical algorithm moves fewer than order{" "}
          <M>{"n^3/\\sqrt{M}"}</M> words, so tiling is optimal up to a constant.
        </p>
        <Code>{TILES}</Code>
      </Proof>

      <Remark title="coherence and false sharing">
        <p>
          With several cores, each with its own cache, a line that one core writes must be invalidated in the others. The
          unit is the whole line. Two threads that write different variables in the same 64-byte line therefore keep
          stealing it from each other, although they share no data: <em>false sharing</em>. Per-thread counters packed into
          one array are the classic case; padding each to its own line, as <C>false_shared</C> lets you check, can make such
          code many times faster. The same tiling idea returns on GPUs, where the fast memory is managed by hand.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sets",
      rung: "check",
      prompt: <p>A cache has 64 sets and 64-byte lines. Accesses are 2560 bytes apart. How many different sets do they reach, given enough accesses?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "traffic",
      rung: "check",
      prompt: <p>Tiled multiplication of two 512 × 512 matrices with 32 × 32 tiles moves how many words between memory and cache, by the formula of this lesson?</p>,
      answer: { kind: "numeric", value: 8912896, tolerance: 0 },
    },
    {
      key: "false",
      rung: "apply",
      prompt: <p>Eight threads each increment their own counter in <C>counts = np.zeros(8, dtype=np.int64)</C>, and the program scales badly with the number of threads. Which change is most likely to help?</p>,
      answer: {
        kind: "choice",
        options: [
          "Give each counter its own 64-byte line, for example by spacing them 8 int64 apart",
          "Use int32 counters, so that all eight fit in half a line",
          "Make the array larger at the end without moving the counters",
          "Have each thread read the other counters before writing",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def set_index(addr, num_sets, line=64):
    return addr // line % num_sets

def sets_hit(stride, count, num_sets, line=64):
    return len({set_index(i * stride, num_sets, line) for i in range(count)})

def column_rehits(stride, count, num_sets, ways, line=64):
    per_set = {}
    for i in range(count):
        s = set_index(i * stride, num_sets, line)
        per_set[s] = per_set.get(s, 0) + 1
    return sum(c for c in per_set.values() if c <= ways)

print(set_index(4096, 64), set_index(4160, 64), sets_hit(4096, 256, 64), sets_hit(4160, 256, 64), sets_hit(2048, 256, 64))
print(column_rehits(4096, 256, 64, 8), column_rehits(4160, 256, 64, 8), column_rehits(4224, 256, 64, 8))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0 1 1 64 2\n0 256 256", "0 1 1 64 2\n0 256 0", "0 1 64 64 32\n0 256 256", "64 65 1 64 2\n0 256 256"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def best_tile(cache_words):
    return math.isqrt(cache_words // 3)

def matmul_traffic(n, b):
    return 2 * n ** 3 // b + 2 * n * n

def false_shared(writes, line=64):
    owners = {}
    for thread, addrs in writes.items():
        for a in addrs:
            owners.setdefault(a // line, set()).add(thread)
    return sorted(l for l, ts in owners.items() if len(ts) > 1)

print(best_tile(12288), best_tile(100), matmul_traffic(1024, 64) // 1024 ** 2, matmul_traffic(1024, 1) // matmul_traffic(1024, 64))
print(false_shared({0: [0, 8], 1: [16, 64], 2: [128]}), false_shared({0: [0], 1: [64]}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["64 5 34 60\n[0] []", "64 5 34 64\n[0] []", "64 5 32 60\n[0] []", "64 5 34 60\n[0, 1] []"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>set_index(addr, num_sets, line=64)</C>; <C>sets_hit(stride, count, num_sets, line=64)</C>, the number of
          distinct sets reached by addresses 0, stride, 2·stride and so on; and{" "}
          <C>column_rehits(stride, count, num_sets, ways, line=64)</C>, the number of those count lines still cached on a
          second pass with LRU, which is the number of lines in sets that received at most ways of them.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def set_index(addr, num_sets, line=64):
    return 0

def sets_hit(stride, count, num_sets, line=64):
    return num_sets

def column_rehits(stride, count, num_sets, ways, line=64):
    return count
`,
        solution: SETS,
        tests: [
          { name: "sets", code: `assert set_index(4096, 64) == 0 and set_index(4160, 64) == 1 and set_index(63, 64) == 0 and set_index(64 * 70, 64) == 6
assert sets_hit(4096, 256, 64) == 1 and sets_hit(4160, 256, 64) == 64 and sets_hit(2560, 1000, 64) == 8 and sets_hit(4160, 10, 64) == 10
assert sets_hit(48, 4, 64) == 3, 'Several accesses can share a line, so count sets, not accesses.'` },
          { name: "rehits", code: `assert column_rehits(4096, 256, 64, 8) == 0 and column_rehits(4160, 256, 64, 8) == 256 and column_rehits(4224, 256, 64, 8) == 256
assert column_rehits(4096, 8, 64, 8) == 8 and column_rehits(4096, 9, 64, 8) == 0
assert column_rehits(4092, 256, 64, 8) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>best_tile(cache_words)</C>, the largest b with <M>{"3b^2"}</M> at most the cache size;{" "}
          <C>matmul_traffic(n, b)</C>, the words moved by tiled multiplication as an integer, assuming b divides n; and{" "}
          <C>false_shared(writes, line=64)</C>, where writes maps each thread to the byte addresses it writes, returning the
          sorted line numbers written by more than one thread.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def best_tile(cache_words):
    return 1

def matmul_traffic(n, b):
    return 2 * n ** 3

def false_shared(writes, line=64):
    return []
`,
        solution: TILES,
        tests: [
          { name: "tiles", code: `assert best_tile(12288) == 64 and best_tile(100) == 5 and best_tile(2) == 0 and best_tile(3 * 10 ** 12) == 10 ** 6
assert matmul_traffic(1024, 64) == 2 * 1024 ** 3 // 64 + 2 * 1024 ** 2 and matmul_traffic(512, 32) == 8912896 and matmul_traffic(4, 4) == 64` },
          { name: "sharing", code: `assert false_shared({0: [0, 8], 1: [16, 64], 2: [128]}) == [0] and false_shared({0: [0], 1: [64]}) == []
w = {t: [8 * t] for t in range(8)}
assert false_shared(w) == [0] and false_shared({t: [64 * t] for t in range(8)}) == []
assert false_shared({0: [0, 200], 1: [130], 2: [255, 70]}, line=128) == [0, 1]` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          A cache holds 12 288 words. By what factor does tiled multiplication of two 1024 × 1024 matrices with the best tile
          reduce the traffic compared with b = 1? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 60.294, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A CPU core runs a few instructions at a time, each on a few lanes. A GPU takes the opposite bet: thousands of
        simple threads, grouped so that each group shares one instruction stream. The next chapter starts with how they
        are organised.
      </p>
    </>
  ),
};
