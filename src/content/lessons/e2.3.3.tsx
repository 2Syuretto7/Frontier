import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BloomViz } from "@/components/viz/BloomViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.3.3",
  minutes: 55,
  links: {
    requires: ["e2.3.2"],
    revisits: ["m4.6.3", "m0.4.3"],
    foreshadows: ["e2.3.4", "e11.4.1", "e11.8.3"],
  },

  puzzle: (
    <>
      <p>
        A web crawler has visited 5 billion URLs and must not fetch any of them again. Storing the URLs takes hundreds of
        gigabytes; even their 8-byte hashes take 40 GB. Suppose instead you are allowed to wrongly answer &ldquo;already
        seen&rdquo; for 1 per cent of new URLs, skipping a few pages, but must never answer &ldquo;new&rdquo; for one you have
        seen. Then about 6 GB will do, a little under 10 bits per URL, whatever their length. How?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep an array of m bits, all 0, and k hash functions. To add an item, set the k bits it hashes to. To ask about an
        item, look at its k bits: if any is 0 the item was certainly never added, and if all are 1 it probably was, though
        other items might have set those bits between them. Errors go only one way, and their rate depends on how full the
        array is. Watch the false positive rate as you add items and change k.
      </p>
      <BloomViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Bloom filter">
        <p>
          A <strong>Bloom filter</strong> for a set S is an array of m bits and k hash functions{" "}
          <M>{"h_1, \\dots, h_k"}</M> into <M>{"\\{0, \\dots, m-1\\}"}</M>. Adding x sets bits <M>{"h_i(x)"}</M>; a query for
          x answers &ldquo;maybe in S&rdquo; if all k bits are 1 and &ldquo;not in S&rdquo; otherwise. There are{" "}
          <strong>no false negatives</strong>; the <strong>false positive rate</strong> is the probability that a query for an
          item not in S answers &ldquo;maybe&rdquo;.
        </p>
      </Definition>

      <Theorem title="the false positive rate">
        <p>
          After n items are added, treating the hash values as independent and uniform, a given bit is still 0 with probability{" "}
          <M>{"(1 - 1/m)^{kn} \\approx e^{-kn/m}"}</M>, and the false positive rate is approximately{" "}
          <M>{"p = \\left(1 - e^{-kn/m}\\right)^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the kn bit settings misses a given bit with probability 1 − 1/m, independently, which gives the first
          expression; <M>{"(1 - 1/m)^m \\to e^{-1}"}</M> gives the approximation. A new item&rsquo;s k positions are, by the same
          assumption, independent uniform bits, each set with probability about <M>{"1 - e^{-kn/m}"}</M>. (The fill fraction is
          sharply concentrated around its mean, which justifies treating the k bits as independent.)
        </p>
      </Proof>

      <Theorem title="choosing m and k">
        <p>
          For fixed bits per item m/n, the rate is smallest at <M>{"k = \\frac{m}{n}\\ln 2"}</M>, where half the bits are set
          and <M>{"p = 2^{-k}"}</M>. To reach a target rate p one therefore needs{" "}
          <M>{"\\frac{m}{n} = \\frac{-\\ln p}{(\\ln 2)^2} \\approx 1.44 \\log_2 \\frac1p"}</M> bits per item: about 9.6 bits for
          1 per cent and 14.4 bits for 0.1 per cent, independent of how big the items are.
        </p>
      </Theorem>

      <Example title="k hash functions from two">
        <p>
          Computing k independent hashes is expensive. Kirsch and Mitzenmacher showed that{" "}
          <M>{"g_i(x) = h_1(x) + i\\,h_2(x) \\bmod m"}</M> for i = 0, …, k − 1, with two good hashes, gives the same false
          positive rate asymptotically. A practical recipe takes <M>{"h_1"}</M> and <M>{"h_2"}</M> from two halves of one
          cryptographic or fast hash digest, making <M>{"h_2"}</M> odd.
        </p>
        <Code>{`import hashlib
d = hashlib.sha256(item.encode()).digest()
h1 = int.from_bytes(d[:8], "big")
h2 = int.from_bytes(d[8:16], "big") | 1
positions = [(h1 + i * h2) % m for i in range(k)]`}</Code>
      </Example>

      <Remark title="what you can and cannot do">
        <ul>
          <li><strong>Union:</strong> two filters with the same m and hashes combine by bitwise OR.</li>
          <li>
            <strong>Count:</strong> with X bits set, <M>{"\\hat n = -\\frac{m}{k}\\ln\\left(1 - \\frac{X}{m}\\right)"}</M>{" "}
            estimates how many items were added, by inverting the expected fill.
          </li>
          <li>
            <strong>Deletion:</strong> clearing a bit could erase other items, so a plain filter cannot delete. A{" "}
            <strong>counting Bloom filter</strong> keeps a small counter per position instead of a bit, at about four times the
            memory.
          </li>
          <li><strong>Listing:</strong> the filter does not store the items, so it cannot list them.</li>
        </ul>
      </Remark>

      <Remark title="where they are used">
        <p>
          Databases built on log-structured merge trees keep a Bloom filter per file on disk, so a lookup skips files that cannot
          contain the key; content delivery networks avoid caching pages requested only once; and data pipelines for language
          models use Bloom filters over n-grams to drop duplicated text and to check that benchmark questions have not leaked
          into the training data.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "no",
      rung: "check",
      prompt: <p>A Bloom filter answers &ldquo;not in the set&rdquo; for x. What do you know?</p>,
      answer: { kind: "choice", options: ["x was certainly never added", "x was probably not added", "x was added and later removed", "Nothing, the filter may be full"], correct: [0] },
    },
    {
      key: "bits",
      rung: "check",
      prompt: <p>An empty filter of 100 bits uses k = 3 hash functions. After one item is added, at most how many bits are set?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "rate",
      rung: "apply",
      prompt: <p>With 10 bits per item and k = 7, what is the false positive rate <M>{"(1 - e^{-kn/m})^k"}</M>? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0082, tolerance: 0.0001 },
    },
    {
      key: "bestk",
      rung: "apply",
      prompt: <p>With 10 bits per item, what is the best whole number of hash functions?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "perbit",
      rung: "apply",
      prompt: <p>How many bits per item does an optimally tuned Bloom filter need for a 1 per cent false positive rate? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 9.59, tolerance: 0.01 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`m = 16
bits = [0] * m

def positions(x):
    return [x % m, (x * 7 + 3) % m, (x * x) % m]

for x in [3, 10, 14]:
    for p in positions(x):
        bits[p] = 1

print(sum(bits), [y for y in range(20) if all(bits[p] for p in positions(y))])`}</Code>
          <p>A toy filter with three hash functions. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7 [3, 10, 14, 19]", "9 [3, 10, 14]", "7 [3, 10, 14]", "7 [3, 10, 14, 19, 26]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def fpr(m, n, k):
    return (1 - math.exp(-k * n / m)) ** k

n = 1_000_000
best = min(range(1, 20), key=lambda k: fpr(8 * n, n, k))
mib = -n * math.log(0.01) / math.log(2) ** 2 / 8 / 2**20
print(best, round(fpr(8 * n, n, best), 4), round(mib, 2))`}</Code>
          <p>Tuning a filter for a million items. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 0.0216 1.14", "5 0.0217 1.14", "6 0.0216 9.59", "8 0.0255 1.14"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>BloomFilter(m, k)</C> storing its bits in <C>self.bits</C>, a <C>bytearray</C> of <C>(m + 7) // 8</C>{" "}
            bytes (bit j is bit <C>j % 8</C> of byte <C>j // 8</C>). Positions for a string come from SHA-256 as in the lesson:{" "}
            <C>h1</C> and <C>h2</C> from the first and second 8 bytes (big-endian), <C>h2</C> made odd, and positions{" "}
            <C>(h1 + i * h2) % m</C>. Implement <C>add(s)</C>, <C>s in f</C>, <C>union(other)</C> (a new filter; raise{" "}
            <C>ValueError</C> unless m and k match) and <C>estimate_count()</C> from the number of set bits.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class BloomFilter:
    def __init__(self, m, k):
        self.m, self.k = m, k
        self.items = set()

    def add(self, s):
        self.items.add(s)

    def __contains__(self, s):
        return s in self.items

    def union(self, other):
        return self

    def estimate_count(self):
        return len(self.items)
`,
        solution: `import hashlib
import math

class BloomFilter:
    def __init__(self, m, k):
        self.m, self.k = m, k
        self.bits = bytearray((m + 7) // 8)

    def _positions(self, s):
        d = hashlib.sha256(s.encode()).digest()
        h1 = int.from_bytes(d[:8], 'big')
        h2 = int.from_bytes(d[8:16], 'big') | 1
        return [(h1 + i * h2) % self.m for i in range(self.k)]

    def add(self, s):
        for j in self._positions(s):
            self.bits[j // 8] |= 1 << (j % 8)

    def __contains__(self, s):
        return all(self.bits[j // 8] >> (j % 8) & 1 for j in self._positions(s))

    def union(self, other):
        if (self.m, self.k) != (other.m, other.k):
            raise ValueError('filters must share m and k')
        out = BloomFilter(self.m, self.k)
        out.bits = bytearray(a | b for a, b in zip(self.bits, other.bits))
        return out

    def estimate_count(self):
        x = sum(bin(b).count('1') for b in self.bits)
        return -self.m / self.k * math.log(1 - x / self.m)
`,
        tests: [
          { name: "storage", code: `f = BloomFilter(1000, 3)
assert isinstance(f.bits, bytearray) and len(f.bits) == 125
f.add("cat")
import hashlib
d = hashlib.sha256(b"cat").digest()
h1, h2 = int.from_bytes(d[:8], 'big'), int.from_bytes(d[8:16], 'big') | 1
for i in range(3):
    j = (h1 + i * h2) % 1000
    assert f.bits[j // 8] >> (j % 8) & 1, 'Set the bits given by the double-hashing recipe.'
assert sum(bin(b).count('1') for b in f.bits) <= 3` },
          { name: "rate", code: `import math
n, m, k = 2000, 20000, 7
f = BloomFilter(m, k)
for i in range(n):
    f.add(f"member-{i}")
assert all(f"member-{i}" in f for i in range(n)), 'No false negatives.'
fp = sum(f"other-{i}" in f for i in range(20000)) / 20000
want = (1 - math.exp(-k * n / m)) ** k
assert abs(fp - want) < 0.004, f'False positive rate {fp} against {want}'` },
          { name: "union and count", code: `a, b = BloomFilter(50000, 5), BloomFilter(50000, 5)
for i in range(3000):
    a.add(f"a{i}")
    b.add(f"b{i}")
u = a.union(b)
assert all(f"a{i}" in u and f"b{i}" in u for i in range(3000))
assert abs(a.estimate_count() - 3000) < 150 and abs(u.estimate_count() - 6000) < 300
try:
    a.union(BloomFilter(50000, 4))
    assert False, 'Mismatched filters must raise ValueError.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bloom_params(n, p)</C>, returning <C>(m, k)</C> with m = ⌈−n ln p / (ln 2)²⌉ and k = max(1, round((m/n) ln
            2)). Then write <C>CountingBloom(m, k, positions)</C>, where <C>positions(x)</C> is a given function returning k
            indices, keeping a list of m counters capped at 15 (a counter that reaches 15 stays there, since its true count is
            no longer known). Implement <C>add(x)</C>, <C>x in f</C>, and <C>remove(x)</C>, which raises <C>ValueError</C>{" "}
            without changing anything if x is definitely absent, and otherwise decrements each of its counters except those
            stuck at 15.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bloom_params(n, p):
    return (n, 1)

class CountingBloom:
    def __init__(self, m, k, positions):
        self.c = [0] * m
        self.positions = positions

    def add(self, x):
        for j in self.positions(x):
            self.c[j] = 1

    def __contains__(self, x):
        return all(self.c[j] for j in self.positions(x))

    def remove(self, x):
        for j in self.positions(x):
            self.c[j] = 0
`,
        solution: `import math

def bloom_params(n, p):
    m = math.ceil(-n * math.log(p) / math.log(2) ** 2)
    k = max(1, round(m / n * math.log(2)))
    return (m, k)

class CountingBloom:
    CAP = 15

    def __init__(self, m, k, positions):
        self.c = [0] * m
        self.k = k
        self.positions = positions

    def add(self, x):
        for j in self.positions(x):
            if self.c[j] < self.CAP:
                self.c[j] += 1

    def __contains__(self, x):
        return all(self.c[j] for j in self.positions(x))

    def remove(self, x):
        ps = self.positions(x)
        if not all(self.c[j] for j in ps):
            raise ValueError('item is not in the filter')
        for j in ps:
            if self.c[j] < self.CAP:
                self.c[j] -= 1
`,
        tests: [
          { name: "params", code: `assert bloom_params(1000000, 0.01) == (9585059, 7)
assert bloom_params(1000, 0.001) == (14378, 10)
m, k = bloom_params(10, 0.5)
assert k >= 1 and m == 15` },
          { name: "counting", code: `pos = lambda x: [x % 10, (3 * x) % 10]
f = CountingBloom(10, 2, pos)
f.add(1); f.add(11)
assert 1 in f and 11 in f and 21 in f, '21 shares both positions: a false positive.'
f.remove(1)
assert 11 in f, 'Removing one item keeps the other.'
f.remove(11)
assert 1 not in f and f.c == [0] * 10
try:
    f.remove(4)
    assert False, 'Removing an absent item must raise ValueError.'
except ValueError:
    pass
f.add(2)
before = list(f.c)
try:
    f.remove(5)
except ValueError:
    pass
assert f.c == before, 'A failed remove changes nothing.'` },
          { name: "saturation", code: `pos = lambda x: [0, 1 + x % 3]
f = CountingBloom(4, 2, pos)
for _ in range(20):
    f.add(0)
assert f.c[0] == 15 and f.c[1] == 15
for _ in range(20):
    f.remove(0)
assert f.c[0] == 15 and 0 in f, 'A saturated counter must never be decremented: a false negative is worse than a false positive.'` },
        ],
      },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Derive the approximate false positive rate <M>{"(1 - e^{-kn/m})^k"}</M>, stating where you assume independence, and
          explain why a Bloom filter can never give a false negative.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "A given bit is missed by one hash with probability 1 − 1/m; by all kn hashes with probability (1 − 1/m)^{kn} ≈ e^{−kn/m}.",
          "A non-member's k positions are uniform and assumed independent of each other and of the fill, each set with probability ≈ 1 − e^{−kn/m}.",
          "Multiplies to get (1 − e^{−kn/m})^k.",
          "No false negatives: adding x sets all its bits, and bits are never cleared, so a query for x finds them all set.",
        ],
      },
    },
    {
      key: "optimise",
      rung: "stretch",
      prompt: <p>Show that for fixed m/n the rate <M>{"(1 - e^{-kn/m})^k"}</M> is minimised at <M>{"k = (m/n)\\ln 2"}</M>, and deduce the bits per item needed for a target rate p.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes q = e^{−kn/m}, so k = −(m/n) ln q and ln p = k ln(1 − q) = −(m/n) ln q ln(1 − q).",
          "ln q · ln(1 − q) is symmetric in q ↔ 1 − q and maximised at q = 1/2, so ln p is minimised there.",
          "q = 1/2 gives k = (m/n) ln 2 and p = 2^{−k}.",
          "Solving p = 2^{−(m/n) ln 2} gives m/n = −ln p / (ln 2)² ≈ 1.44 log₂(1/p).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a Bloom filter answers set membership in about ten bits per item, which way its errors go, and how to choose the number of hash functions.",

  glimpse: (
    <p>
      MinHash, next, uses hashing to compress a whole set into a short signature from which similarity can be estimated. Data
      engineering for foundation models uses both, Bloom filters for exact n-gram de-duplication and decontamination, MinHash
      for near-duplicates, over corpora of trillions of tokens.
    </p>
  ),
};
