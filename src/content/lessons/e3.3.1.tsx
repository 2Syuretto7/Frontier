import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CacheViz } from "@/components/viz/CacheViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.3.1",
  minutes: 60,
  links: {
    requires: ["e3.2.2"],
    revisits: ["e3.2.3", "e3.1.3", "e1.5.6"],
    foreshadows: ["e3.3.2", "e3.3.3", "e4.5.1"],
  },

  puzzle: (
    <>
      <p>
        A modern processor can add two numbers in a third of a nanosecond, but fetching a number from main memory takes about
        a hundred nanoseconds: three hundred additions&rsquo; worth of waiting. Yet most programs run as if memory were nearly
        as fast as the processor. Two loops that do identical arithmetic on identical data can still differ in speed by ten
        times. What sits between the processor and memory, and what makes it work or fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>cache</strong> is a small, fast memory that keeps copies of recently used data. It works in whole{" "}
        <strong>lines</strong>, typically 64 bytes, so reading one byte brings its neighbours along. Each line of memory may
        only go into one <strong>set</strong> of the cache, chosen by its address; a set holds a few lines (its{" "}
        <strong>ways</strong>), and when it is full the least recently used line is evicted. A hit costs a nanosecond; a miss
        costs a trip to memory. Choose an access pattern and an associativity below and watch which accesses hit.
      </p>
      <CacheViz />
    </>
  ),

  theory: (
    <>
      <Definition title="addresses in a cache">
        <p>
          A cache with S sets, W ways and lines of L bytes (S and L powers of two) holds S × W × L bytes. An address splits
          into three fields: the low <M>{"\\log_2 L"}</M> bits are the <strong>offset</strong> within the line; the next{" "}
          <M>{"\\log_2 S"}</M> bits are the <strong>index</strong> that picks the set; the remaining high bits are the{" "}
          <strong>tag</strong>, stored with the line to tell which of the many lines mapping to that set is present. W = 1 is{" "}
          <em>direct-mapped</em>; S = 1 is <em>fully associative</em>.
        </p>
        <Code>{`offset = addr % L
index  = (addr // L) % S
tag    = addr // (L * S)`}</Code>
      </Definition>

      <Example title="the hierarchy">
        <p>
          A typical desktop core has a 32 to 48 KiB L1 data cache (about 1 ns), a 1 to 2 MiB L2 (about 4 ns), and a shared L3
          of tens of MiB (10 to 40 ns), in front of DRAM (about 80 to 100 ns). Each level is larger and slower than the one
          before. A GPU has the same shape: registers, shared memory and L1 per streaming multiprocessor, an L2, then
          high-bandwidth memory (HBM).
        </p>
      </Example>

      <Theorem title="average memory access time">
        <p>
          For a hierarchy of levels with hit times <M>{"h_i"}</M> and local miss rates <M>{"m_i"}</M> (the fraction of
          accesses reaching level i that miss there), backed by memory with access time T, the average access time is
        </p>
        <MD>{"\\text{AMAT} = h_1 + m_1\\bigl(h_2 + m_2(h_3 + \\cdots + m_k T)\\bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          By induction from the bottom. Memory alone costs T. Suppose the levels below level i, together with memory, have
          average time <M>{"A_{i+1}"}</M> for the accesses that reach them. Every access to level i pays <M>{"h_i"}</M> to
          look; with probability <M>{"m_i"}</M> it misses and then costs <M>{"A_{i+1}"}</M> more on average. By linearity of
          expectation <M>{"A_i = h_i + m_i A_{i+1}"}</M>, and unwinding from i = k to i = 1 gives the formula. With 1 ns, a 5%
          miss rate and 100 ns memory, AMAT is 6 ns: the 5% of misses cost five times more than all the hits together.
        </p>
      </Proof>

      <Example title="the three kinds of miss">
        <p>
          A <strong>compulsory</strong> miss is the first ever touch of a line; no cache avoids it. A{" "}
          <strong>capacity</strong> miss would happen even in a fully associative LRU cache of the same total size: the
          program&rsquo;s working set is too big. A <strong>conflict</strong> miss is one that the fully associative cache
          would have hit: too many hot lines mapped to the same set, as when two arrays sit a power-of-two distance apart.
          More ways cure conflicts; only a bigger cache or a smaller working set cures capacity.
        </p>
      </Example>

      <Remark title="caches and machine learning">
        <p>
          Writes are cached too: a write-back cache marks a line dirty and writes it to memory only on eviction. On a GPU,
          reading a matrix from HBM costs far more than the arithmetic done on it, and the speed of attention depends on
          keeping tiles of Q, K and V in on-chip memory. FlashAttention computes exact attention while never writing the full
          attention matrix to HBM; it is a cache-aware rearrangement of the same arithmetic, which is the subject of the next
          lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sets",
      rung: "check",
      prompt: <p>An L1 cache holds 32 KiB in 64-byte lines and is 8-way set associative. How many sets does it have?</p>,
      answer: { kind: "numeric", value: 64 },
    },
    {
      key: "amat",
      rung: "apply",
      prompt: <p>L1 hits take 1 ns and 4% of accesses miss L1. An L2 hit takes 5 ns and 25% of the accesses reaching L2 miss there; memory takes 100 ns. What is the average access time in nanoseconds?</p>,
      answer: { kind: "numeric", value: 2.2, tolerance: 0.001 },
    },
    {
      key: "scan",
      rung: "apply",
      prompt: <p>A loop reads every element of an array of 1,000,000 4-byte ints once, in order, starting from a cold cache with 64-byte lines. The array starts at a line boundary. How many cache misses occur?</p>,
      answer: { kind: "numeric", value: 62500 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run(trace, sets, ways, line=16):
    cache = [[] for _ in range(sets)]
    hits = 0
    for addr in trace:
        ln = addr // line
        s = cache[ln % sets]
        if ln in s:
            hits += 1
            s.remove(ln)
        elif len(s) == ways:
            s.pop(0)
        s.append(ln)
    return hits

a = [0, 128, 0, 128, 0, 128]
b = list(range(0, 64, 4)) * 2
print(run(a, 8, 1), run(a, 4, 2), run(b, 8, 1), run(b, 1, 2))`}</Code>
          <p>A set-associative LRU cache in a few lines. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0 4 28 24", "0 4 28 28", "4 4 28 24", "0 4 30 24"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def split(addr, line, sets):
    return addr // (line * sets), (addr // line) % sets, addr % line

size = 32 * 1024
line, ways = 64, 8
sets = size // (line * ways)
bits = [(line - 1).bit_length(), (sets - 1).bit_length()]
print(split(1000, 64, 8), split(0x2A7F, 32, 16), sets, bits, 48 - sum(bits))`}</Code>
          <p>Splitting addresses. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(1, 7, 40) (21, 3, 31) 64 [6, 6] 36", "(0, 15, 40) (21, 3, 31) 64 [6, 6] 36", "(1, 7, 40) (21, 3, 31) 512 [6, 9] 33", "(1, 7, 40) (42, 3, 31) 64 [6, 6] 36"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>split(addr, line_size, num_sets)</C> returning <C>(tag, index, offset)</C>, and a class{" "}
            <C>Cache(num_sets, ways, line_size)</C> with LRU replacement in each set. <C>access(addr)</C> returns True on a
            hit and False on a miss (and then loads the line), and the attributes <C>hits</C> and <C>misses</C> count them.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def split(addr, line_size, num_sets):
    return 0, 0, addr % line_size


class Cache:
    def __init__(self, num_sets, ways, line_size):
        self.hits = self.misses = 0

    def access(self, addr):
        self.misses += 1
        return False
`,
        solution: `def split(addr, line_size, num_sets):
    offset = addr % line_size
    line = addr // line_size
    return line // num_sets, line % num_sets, offset


class Cache:
    def __init__(self, num_sets, ways, line_size):
        self.num_sets, self.ways, self.line_size = num_sets, ways, line_size
        self.sets = [[] for _ in range(num_sets)]   # each set: tags, least recently used first
        self.hits = self.misses = 0

    def access(self, addr):
        tag, index, _ = split(addr, self.line_size, self.num_sets)
        s = self.sets[index]
        if tag in s:
            s.remove(tag)
            s.append(tag)
            self.hits += 1
            return True
        if len(s) == self.ways:
            s.pop(0)
        s.append(tag)
        self.misses += 1
        return False
`,
        tests: [
          { name: "split", code: `assert split(0, 64, 64) == (0, 0, 0)
assert split(100, 64, 64) == (0, 1, 36), 'Address 100 is byte 36 of line 1.'
assert split(64 * 64 + 5, 64, 64) == (1, 0, 5), 'Line 64 wraps round to set 0 with tag 1.'
assert split(0x12345, 16, 8) == (0x12345 // 128, (0x12345 // 16) % 8, 5)
for addr in range(0, 5000, 37):
    t, i, o = split(addr, 32, 16)
    assert (t * 16 + i) * 32 + o == addr, 'Tag, index and offset must rebuild the address.'` },
          { name: "LRU cache", code: `def ref_hits(trace, num_sets, ways, line):
    sets = [[] for _ in range(num_sets)]
    out = []
    for a in trace:
        ln = a // line
        s = sets[ln % num_sets]
        tag = ln // num_sets
        if tag in s:
            s.remove(tag); s.append(tag); out.append(True)
        else:
            if len(s) == ways:
                s.pop(0)
            s.append(tag); out.append(False)
    return out

c = Cache(4, 1, 16)
assert [c.access(a) for a in [0, 4, 15, 16, 0]] == [False, True, True, False, True], 'Bytes of one line share it.'
c = Cache(4, 1, 16)
assert [c.access(a) for a in [0, 64, 0, 64]] == [False] * 4, 'Direct-mapped: 0 and 64 fight over set 0.'
c = Cache(4, 2, 16)
assert [c.access(a) for a in [0, 64, 0, 64]] == [False, False, True, True], 'Two ways hold both.'
c = Cache(1, 2, 16)
assert [c.access(a) for a in [0, 16, 0, 32, 16]] == [False, False, True, False, False], 'LRU evicts the least recently used line, 16.'
import random
rng = random.Random(5)
for sets, ways, line in [(8, 1, 16), (4, 2, 32), (2, 4, 8), (1, 8, 64)]:
    trace = [rng.randrange(2048) for _ in range(400)] + [rng.randrange(256) for _ in range(400)]
    c = Cache(sets, ways, line)
    got = [c.access(a) for a in trace]
    assert got == ref_hits(trace, sets, ways, line), f'Mismatch for {sets} sets, {ways} ways, {line}-byte lines.'
    assert c.hits == sum(got) and c.misses == len(got) - sum(got), 'Keep hits and misses counts.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>amat(levels, memory_time)</C>, where levels is a list of <C>(hit_time, local_miss_rate)</C> pairs, fastest
            first, and <C>classify_misses(trace, num_sets, ways, line_size)</C>, which simulates an LRU cache on a list of
            addresses and returns a dict counting <C>&apos;hit&apos;</C>, <C>&apos;compulsory&apos;</C>,{" "}
            <C>&apos;capacity&apos;</C> and <C>&apos;conflict&apos;</C>. A non-compulsory miss is a capacity miss if a fully
            associative LRU cache with the same number of lines, run on the same trace, also misses on it, and a conflict miss
            otherwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def amat(levels, memory_time):
    hit_time, miss_rate = levels[0]
    return hit_time + miss_rate * memory_time


def classify_misses(trace, num_sets, ways, line_size):
    lines = [a // line_size for a in trace]
    return {'hit': len(lines) - len(set(lines)), 'compulsory': len(set(lines)), 'capacity': 0, 'conflict': 0}
`,
        solution: `def amat(levels, memory_time):
    # levels: list of (hit_time, miss_rate), fastest first
    t = memory_time
    for hit_time, miss_rate in reversed(levels):
        t = hit_time + miss_rate * t
    return t


def classify_misses(trace, num_sets, ways, line_size):
    capacity_lines = num_sets * ways
    seen = set()
    sets = [[] for _ in range(num_sets)]
    full = []                       # a fully associative LRU cache of the same size
    counts = {'hit': 0, 'compulsory': 0, 'capacity': 0, 'conflict': 0}
    for addr in trace:
        ln = addr // line_size
        s = sets[ln % num_sets]
        hit = ln in s
        if hit:
            s.remove(ln)
        elif len(s) == ways:
            s.pop(0)
        s.append(ln)
        full_hit = ln in full
        if full_hit:
            full.remove(ln)
        elif len(full) == capacity_lines:
            full.pop(0)
        full.append(ln)
        if hit:
            counts['hit'] += 1
        elif ln not in seen:
            counts['compulsory'] += 1
        elif not full_hit:
            counts['capacity'] += 1
        else:
            counts['conflict'] += 1
        seen.add(ln)
    return counts
`,
        tests: [
          { name: "AMAT", code: `from math import isclose
assert isclose(amat([(1, 0.05)], 100), 6), 'One level: 1 + 0.05 * 100.'
assert isclose(amat([(1, 0.1), (10, 0.2)], 100), 1 + 0.1 * (10 + 0.2 * 100)), 'An L1 miss pays the L2 time, an L2 miss the memory time.'
assert isclose(amat([(4, 0.1), (12, 0.5), (40, 0.25)], 200), 4 + 0.1 * (12 + 0.5 * (40 + 0.25 * 200)))
assert isclose(amat([], 80), 80), 'No caches: every access goes to memory.'
assert isclose(amat([(1, 0.0), (10, 1.0)], 100), 1), 'A perfect L1 hides everything.'` },
          { name: "miss classes", code: `def ref(trace, S, W, L):
    seen, sets, full = set(), [[] for _ in range(S)], []
    c = {'hit': 0, 'compulsory': 0, 'capacity': 0, 'conflict': 0}
    for a in trace:
        ln = a // L
        s = sets[ln % S]
        h = ln in s
        if h: s.remove(ln)
        elif len(s) == W: s.pop(0)
        s.append(ln)
        fh = ln in full
        if fh: full.remove(ln)
        elif len(full) == S * W: full.pop(0)
        full.append(ln)
        k = 'hit' if h else 'compulsory' if ln not in seen else 'capacity' if not fh else 'conflict'
        c[k] += 1
        seen.add(ln)
    return c

r = classify_misses([0, 64, 0, 64], 4, 1, 16)
assert r == {'hit': 0, 'compulsory': 2, 'capacity': 0, 'conflict': 2}, f'Ping-pong in one set is conflict misses, got {r}.'
r = classify_misses(list(range(0, 80, 16)) * 2, 4, 1, 16)
assert r == {'hit': 3, 'compulsory': 5, 'capacity': 2, 'conflict': 0}, f'Lines 0 and 4 share set 0; their misses would happen in a fully associative LRU cache of four lines too, so they are capacity misses. Got {r}.'
r = classify_misses(list(range(64)) * 3, 2, 2, 16)
assert r == {'hit': 188, 'compulsory': 4, 'capacity': 0, 'conflict': 0}, f'Everything fits, got {r}.'
import random
rng = random.Random(11)
for S, W, L in [(8, 1, 16), (4, 2, 16), (2, 4, 32), (16, 2, 8)]:
    trace = [rng.choice([rng.randrange(512), rng.randrange(4096)]) for _ in range(600)]
    assert classify_misses(trace, S, W, L) == ref(trace, S, W, L), f'Mismatch for {S} sets, {W} ways.'` },
        ],
      },
    },
    {
      key: "cyclic",
      rung: "prove",
      prompt: <p>A fully associative LRU cache holds C lines. A program reads C + 1 distinct lines in a fixed cyclic order, over and over. Prove that every access misses, and show that a cache which kept C of the lines fixed and never replaced them would hit on almost a fraction C/(C + 1) of accesses.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Observes that just before an access to line x, the C most recently used lines are exactly the other C lines of the cycle.",
          "So x is not among the C lines LRU holds, and the access misses; the same holds for every access after the first round, and the first round misses compulsorily.",
          "For the fixed cache: C of the C + 1 lines in each cycle are always present, so after warm-up C of every C + 1 accesses hit.",
          "Concludes that LRU can be the worst possible policy for loops slightly larger than the cache, which is why some caches use other policies.",
        ],
      },
    },
    {
      key: "inclusion",
      rung: "stretch",
      prompt: <p>Prove that for any trace, a fully associative LRU cache of C + 1 lines misses no more often than one of C lines.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that a fully associative LRU cache of size C always holds the C most recently used distinct lines (or all of them, if fewer).",
          "Concludes that at every moment the size-C contents are a subset of the size-(C + 1) contents (the inclusion property).",
          "So any access that hits in the smaller cache also hits in the larger one, and the larger cache's misses are a subset.",
          "Mentions that FIFO lacks this property (Belady's anomaly), so a bigger FIFO cache can miss more.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why reading an array in order is fast even though memory is slow, and why two arrays exactly 4 KiB apart can be slow together.",

  glimpse: (
    <p>
      A cache only helps programs that reuse what it holds. Next, locality: how loop order, memory layout and tiling decide
      whether your program hits or misses, from matrix multiplication to NumPy strides.
    </p>
  ),
};
