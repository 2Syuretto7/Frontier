import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { HashBucketViz } from "@/components/viz/HashBucketViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.4.4",
  minutes: 55,
  links: {
    requires: ["m4.4.3", "m4.1.4"],
    foreshadows: ["e2.3.1", "e2.3.2", "e2.3.3"],
  },

  puzzle: (
    <>
      <p>
        A Python dictionary finds a key among millions in about the same time as among ten. It does not search: it computes
        where the key should be. How can a computation send millions of different keys to a few thousand places without
        hopeless crowding?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A hash function turns a key into a bucket number. A good one spreads the keys out evenly, even when the keys follow a
        pattern. Below, the keys are 10, 20, …, 240. With k mod 10 they all land in bucket 0. Change m to 11, or switch to the
        multiplicative hash, and the crowd disperses.
      </p>
      <HashBucketViz />
    </>
  ),

  theory: (
    <>
      <Definition title="hash function and hash table">
        <p>
          A <strong>hash function</strong> maps a large set U of keys to the buckets {"{0, 1, …, m − 1}"}. A{" "}
          <strong>hash table</strong> stores each key in the bucket h(key); to look a key up, compute h and search only that
          bucket. Two keys with the same hash <strong>collide</strong>. When |U| &gt; m collisions are unavoidable, by the
          pigeonhole principle.
        </p>
      </Definition>

      <Theorem title="patterns and the modulus">
        <p>
          Under h(k) = k mod m, keys that are all multiples of d land only in buckets that are multiples of gcd(d, m). There
          are m / gcd(d, m) of them.
        </p>
      </Theorem>
      <Proof>
        <p>
          If k = dj, then k mod m = dj − qm, which is divisible by g = gcd(d, m). Conversely, every multiple of g below m is
          reached: by Bézout, dx ≡ g (mod m) for some x, so the keys dx, 2dx, … reach g, 2g, …. So exactly the m / g multiples
          of g are hit.
        </p>
      </Proof>
      <Remark title="choose a prime">
        <p>
          This is why textbook hash tables use a prime number of buckets: a prime m shares no factor with any pattern d &lt; m,
          so regular keys spread over all buckets.
        </p>
      </Remark>

      <Definition title="universal hashing">
        <p>
          No single hash function is good for every set of keys: an adversary who knows h can choose keys that all collide.
          The fix is to choose h at random from a family. A family is <strong>universal</strong> if for any two distinct keys
          x ≠ y, <M>{"P(h(x) = h(y)) \\le 1/m"}</M> when h is drawn at random. For integer keys below a prime p, the family{" "}
          <M>{"h_{a,b}(k) = ((ak + b) \\bmod p) \\bmod m"}</M> with <M>{"1 \\le a < p"}</M>, <M>{"0 \\le b < p"}</M> is
          universal.
        </p>
      </Definition>

      <Theorem title="expected chain length">
        <p>
          With a universal family, n keys in m buckets, the expected number of other keys sharing a given key&rsquo;s bucket is
          at most (n − 1)/m. Keeping the <strong>load factor</strong> n/m bounded keeps lookups fast on average.
        </p>
      </Theorem>
      <Proof>
        <p>
          For each other key y let <M>{"X_y"}</M> be 1 if y collides with x. The number of collisions is{" "}
          <M>{"\\sum_y X_y"}</M>, and by linearity of expectation its mean is{" "}
          <M>{"\\sum_y P(h(x) = h(y)) \\le (n-1)/m"}</M>.
        </p>
      </Proof>

      <Example title="the birthday bound">
        <p>
          Collisions arrive early. Hashing n keys uniformly into m buckets, the expected number of colliding pairs is{" "}
          <M>{"\\binom{n}{2}/m"}</M>, which reaches 1 when n is about <M>{"\\sqrt{2m}"}</M>. With 365 buckets, 23 keys already
          give a better than even chance of some collision.
        </p>
      </Example>

      <Remark title="other uses">
        <p>
          Hashing is also used to check files for corruption (checksums), to name content (git commits are SHA-1 hashes), to
          deduplicate data at scale, and in cryptographic hash functions where finding any collision must be infeasible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bucket",
      rung: "check",
      prompt: <p>With h(k) = k mod 13, which bucket does the key 100 go to?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "used",
      rung: "check",
      prompt: <p>Keys 12, 24, 36, … (all multiples of 12) are hashed by k mod 18. How many different buckets can they reach?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "load",
      rung: "apply",
      prompt: <p>A table has 1000 buckets and holds 3000 keys. What is its load factor?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>100 keys are hashed uniformly at random into 1000 buckets. What is the expected number of colliding pairs?</p>,
      answer: { kind: "numeric", value: 4.95, tolerance: 0.001 },
    },
    {
      key: "birthday",
      rung: "apply",
      prompt: <p>Using the approximation n ≈ √(2m), about how many random 32-bit hashes can you generate before expecting one collision? Give the nearest thousand.</p>,
      answer: { kind: "numeric", value: 93000, tolerance: 1000 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`keys = [10 * i for i in range(1, 25)]
print(len({k % 10 for k in keys}), len({k % 11 for k in keys}))`}</Code>
          <p>24 patterned keys hashed by k mod 10 and k mod 11. How many buckets does each use?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 11", "10 11", "1 24", "24 24"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def h(s, m):
    v = 0
    for ch in s:
        v = (v * 31 + ord(ch)) % m
    return v
print(h("ab", 1000), h("ba", 1000), h("", 1000))`}</Code>
          <p>A polynomial string hash with base 31 (ord('a') is 97). What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["105 135 0", "195 195 0", "105 105 0", "3105 3135 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>HashTable</C> with separate chaining: <C>__init__(self, m)</C> makes m empty lists, <C>put(self, key, value)</C> stores or replaces a value, <C>get(self, key)</C> returns it or raises <C>KeyError</C>, and <C>longest_chain(self)</C> returns the length of the fullest bucket. Use <C>hash(key) % m</C> as the bucket.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class HashTable:
    def __init__(self, m):
        self.m = m
        self.items = []
    def put(self, key, value):
        self.items.append((key, value))
    def get(self, key):
        for k, v in self.items:
            if k == key:
                return v
        raise KeyError(key)
    def longest_chain(self):
        return len(self.items)
`,
        solution: `class HashTable:
    def __init__(self, m):
        self.m = m
        self.buckets = [[] for _ in range(m)]
    def _bucket(self, key):
        return self.buckets[hash(key) % self.m]
    def put(self, key, value):
        b = self._bucket(key)
        for i, (k, _) in enumerate(b):
            if k == key:
                b[i] = (key, value)
                return
        b.append((key, value))
    def get(self, key):
        for k, v in self._bucket(key):
            if k == key:
                return v
        raise KeyError(key)
    def longest_chain(self):
        return max(len(b) for b in self.buckets)
`,
        tests: [
          { name: "put get", code: `t = HashTable(7)
t.put('a', 1); t.put('b', 2); t.put('a', 3)
assert t.get('a') == 3 and t.get('b') == 2, 'put must replace an existing key.'
try:
    t.get('z')
    ok = False
except KeyError:
    ok = True
assert ok, 'A missing key raises KeyError.'` },
          { name: "chains", code: `t = HashTable(10)
for k in range(10, 250, 10):
    t.put(k, k)
u = HashTable(11)
for k in range(10, 250, 10):
    u.put(k, k)
assert t.longest_chain() == 24 and u.longest_chain() <= 3, 'Integers hash to themselves, so multiples of 10 all land in bucket 0 of 10.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>find_all(text, pattern)</C>, every start index where the pattern occurs (overlaps allowed), by Rabin–Karp: compare a rolling polynomial hash modulo the prime 2⁶¹ − 1 and confirm each hash match by comparing the strings, so collisions can never give a wrong answer. An empty pattern occurs at every index 0 … len(text). Then write <C>longest_repeated(s)</C>, returning (L, t), where t is a substring of length L occurring at least twice (overlaps allowed) and L is as large as possible: binary search on L, testing each length with rolling hashes in a dict.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def find_all(text, pattern):
    return []

def longest_repeated(s):
    return 0, ''
`,
        solution: `M = (1 << 61) - 1
B = 257

def find_all(text, pattern):
    n, m = len(text), len(pattern)
    if m == 0:
        return list(range(n + 1))
    if m > n:
        return []
    hp = ht = 0
    for i in range(m):
        hp = (hp * B + ord(pattern[i])) % M
        ht = (ht * B + ord(text[i])) % M
    top = pow(B, m - 1, M)
    out = []
    for i in range(n - m + 1):
        if ht == hp and text[i:i + m] == pattern:
            out.append(i)
        if i + m < n:
            ht = ((ht - ord(text[i]) * top) * B + ord(text[i + m])) % M
    return out

def _repeat(s, L):
    h = 0
    for i in range(L):
        h = (h * B + ord(s[i])) % M
    top = pow(B, L - 1, M)
    seen = {h: [0]}
    for i in range(1, len(s) - L + 1):
        h = ((h - ord(s[i - 1]) * top) * B + ord(s[i + L - 1])) % M
        for j in seen.get(h, ()):
            if s[j:j + L] == s[i:i + L]:
                return j
        seen.setdefault(h, []).append(i)
    return None

def longest_repeated(s):
    lo, hi, pos = 0, max(len(s) - 1, 0), 0
    while lo < hi:
        mid = (lo + hi + 1) // 2
        j = _repeat(s, mid)
        if j is not None:
            lo, pos = mid, j
        else:
            hi = mid - 1
    return lo, s[pos:pos + lo]
`,
        tests: [
          { name: "find", code: `assert find_all('abababa', 'aba') == [0, 2, 4] and find_all('abc', 'd') == [] and find_all('ab', '') == [0, 1, 2] and find_all('a', 'aa') == [], 'Overlapping matches count.'` },
          { name: "brute find", code: `import random
random.seed(15)
for _ in range(200):
    t = ''.join(random.choice('ab') for _ in range(random.randint(0, 40)))
    q = ''.join(random.choice('ab') for _ in range(random.randint(1, 4)))
    assert find_all(t, q) == [i for i in range(len(t) - len(q) + 1) if t[i:i + len(q)] == q]` },
          { name: "repeated", code: `assert longest_repeated('banana') == (3, 'ana') and longest_repeated('abcd') == (0, '') and longest_repeated('aaaa') == (3, 'aaa') and longest_repeated('') == (0, ''), 'Overlaps are allowed: ana occurs at 1 and 3.'` },
          { name: "brute repeated", code: `import random
random.seed(16)
for _ in range(100):
    s = ''.join(random.choice('abc') for _ in range(random.randint(1, 30)))
    want = max([L for L in range(len(s)) if len({s[i:i + L] for i in range(len(s) - L + 1)}) < len(s) - L + 1], default=0)
    L, t = longest_repeated(s)
    assert L == want and len(t) == L and len(find_all(s, t)) >= 2, f'For {s!r}'` },
          { name: "fast", code: `import random
random.seed(17)
s = ''.join(random.choice('acgt') for _ in range(20000))
s = s[:5000] + s[9000:9100] + s[5000:]
L, t = longest_repeated(s)
assert L >= 100 and len(find_all(s, t)) >= 2, 'A planted repeat of length 100 in 20000 letters.'` },
        ],
      },
    },
    {
      key: "patterns",
      rung: "prove",
      prompt: <p>Prove that if m is prime and d is not a multiple of m, the keys d, 2d, …, md land in m different buckets under k mod m.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes id ≡ jd (mod m) with 1 ≤ i < j ≤ m.",
          "Uses that d is invertible modulo the prime m (or Euclid's lemma) to get i ≡ j (mod m).",
          "Notes 0 < j − i < m, a contradiction, so the m remainders are distinct.",
        ],
      },
    },
    {
      key: "prob",
      rung: "stretch",
      prompt: <p>5 keys are hashed uniformly into 10 buckets. What is the probability that no two collide? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3024, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a hash table does, why collisions cannot be avoided, and why a prime number of buckets spreads patterned keys better than a round number.",

  glimpse: (
    <p>
      Data Structures and Algorithms builds hash tables, handles collisions by chaining and open addressing, and uses hashing for
      Bloom filters and MinHash, which estimate membership and similarity in a tiny fraction of the memory.
    </p>
  ),
};
