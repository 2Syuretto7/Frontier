import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProbeViz } from "@/components/viz/ProbeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.3.2",
  minutes: 60,
  links: {
    requires: ["e2.3.1", "e2.1.2"],
    revisits: ["m4.6.3"],
    foreshadows: ["e2.3.3", "e3.3.1"],
  },

  puzzle: (
    <>
      <p>
        A hash table with 1000 slots holds 900 keys. One design keeps a list in each slot; the other stores every key directly in
        the array and, on a collision, tries the next slot along. Searching for a missing key takes about 1 step in the first
        design and about 50 in the second. Yet Python&rsquo;s dict, and most fast hash tables, use the second design. Why would
        anyone choose it, and what stops it from reaching 90 per cent full?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Storing keys directly in the array (<strong>open addressing</strong>) avoids a separate allocation per key and keeps
        probes in neighbouring memory, which is fast. Its weakness is that collisions pile up: with <strong>linear probing</strong>{" "}
        a run of full slots catches every key that hashes anywhere into it, so runs grow and merge, and the cost explodes as the
        table fills. So such tables keep the <strong>load factor</strong> α, the fraction of slots used, below a threshold and
        resize, paying an amortised O(1) per insertion. Push the load factor up below and compare the two probing schemes.
      </p>
      <ProbeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="load factor">
        <p>
          A table with n keys in m slots has <strong>load factor</strong> <M>{"\\alpha = n/m"}</M>. The analysis assumes{" "}
          <strong>uniform hashing</strong>: every key is equally likely to hash to any slot, independently of other keys.
        </p>
      </Definition>

      <Theorem title="separate chaining">
        <p>
          With chaining, an unsuccessful search examines α keys on average, and a successful one about{" "}
          <M>{"1 + \\alpha/2"}</M>. Both are O(1) when α is bounded.
        </p>
      </Theorem>
      <Proof>
        <p>
          A missing key hashes to a uniformly random chain, whose expected length is the average chain length n/m = α. For a
          successful search of the i-th inserted key, the keys ahead of it in its chain were inserted later; each of the n − i
          later keys is there with probability 1/m, so the expected number examined is{" "}
          <M>{"1 + \\frac1n \\sum_{i=1}^n \\frac{n-i}{m} = 1 + \\frac{n-1}{2m} < 1 + \\frac{\\alpha}{2}"}</M>, if new keys go
          to the front of the chain.
        </p>
      </Proof>

      <Definition title="open addressing">
        <p>
          Every slot holds at most one key. Key k has a <strong>probe sequence</strong> of slots to try in order: linear
          probing tries <M>{"h(k), h(k) + 1, h(k) + 2, \\dots"}</M>; quadratic probing{" "}
          <M>{"h(k) + i^2"}</M>; <strong>double hashing</strong> <M>{"h_1(k) + i\\,h_2(k)"}</M>, with a second hash giving
          each key its own step, coprime to m. Insertion takes the first empty slot; search stops at the key or at an empty slot.
        </p>
      </Definition>

      <Theorem title="expected probes (Knuth)">
        <p>Under uniform hashing, a search for a missing key in a table with load factor α examines on average</p>
        <ul>
          <li>about <M>{"\\frac{1}{1-\\alpha}"}</M> slots with double hashing (close to ideal random probing);</li>
          <li>about <M>{"\\frac12\\left(1 + \\frac{1}{(1-\\alpha)^2}\\right)"}</M> slots with linear probing.</li>
        </ul>
        <p>At α = 0.5 these are 2 and 2.5; at α = 0.9, 10 and 50.5.</p>
      </Theorem>
      <Example title="where 1/(1 − α) comes from">
        <p>
          If each probe independently hits a full slot with probability α, the number of probes until an empty one is
          geometric with success probability 1 − α, whose mean is <M>{"1/(1-\\alpha)"}</M>. Linear probing is worse because its
          probes are not independent: a full slot is likely to be next to more full slots. This is{" "}
          <strong>primary clustering</strong>.
        </p>
      </Example>

      <Definition title="deletion and tombstones">
        <p>
          In open addressing you cannot simply empty a slot, because a search for a key further along the same probe sequence
          would stop at the hole. Instead mark the slot with a <strong>tombstone</strong>: searches skip over it, insertions may
          reuse it. Tombstones count towards the load when deciding to resize, and a resize rebuilds the table without them.
        </p>
      </Definition>

      <Remark title="resizing">
        <p>
          When the load would pass a threshold (two-thirds for CPython&rsquo;s dict), allocate a bigger table and re-insert every
          key, since positions depend on m. Growing by a constant factor makes this amortised O(1) per insertion, by the argument
          of e2.1.2. Table sizes are often powers of two, so <M>{"h \\bmod m"}</M> is a cheap bit mask; that keeps only the low
          bits of the hash, so the hash must mix its input well. CPython adds a perturbation that gradually feeds in the high
          bits when probing.
        </p>
      </Remark>

      <Remark title="why linear probing is popular anyway">
        <p>
          At a moderate load factor linear probing&rsquo;s extra probes land in the same cache line or the next one, so they cost
          almost nothing, while double hashing jumps around memory. Variants such as Robin Hood hashing (which lets a key that has
          travelled further take a slot from one that has travelled less) keep the variance of probe lengths small. Engineering
          choices like this are why measurements, not asymptotics alone, settle which table is faster.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chain",
      rung: "check",
      prompt: <p>With separate chaining, 750 keys and 1000 chains, how many keys does an unsuccessful search examine on average?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "tombstone",
      rung: "check",
      prompt: <p>Why does open addressing mark deleted slots with a tombstone instead of emptying them?</p>,
      answer: {
        kind: "choice",
        options: ["An empty slot would stop searches for keys placed further along the same probe sequence", "To save memory", "So that deleted keys can be restored", "Because Python cannot store None in a list"],
        correct: [0],
      },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Linear probing at α = 0.5: by Knuth&rsquo;s formula, how many slots does a search for a missing key examine on average?</p>,
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "double",
      rung: "apply",
      prompt: <p>With double hashing, at what load factor does an unsuccessful search examine 4 slots on average?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "resize",
      rung: "apply",
      prompt: <p>A table of 8 slots must keep at most two-thirds of its slots used. Inserting distinct keys one by one into the empty table, which insertion is the first that forces a resize?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`m = 7
table = [None] * m
probes = []
for k in [10, 3, 17, 24, 5, 12]:
    i, p = k % m, 1
    while table[i] is not None:
        i, p = (i + 1) % m, p + 1
    table[i] = k
    probes.append(p)
print(table, probes)`}</Code>
          <p>Linear probing into 7 slots. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 12, None, 10, 3, 17, 24] [1, 2, 3, 4, 3, 4]",
          "[None, None, 12, 10, 3, 17, 24] [1, 2, 3, 4, 3, 4]",
          "[5, 12, None, 10, 3, 17, 24] [1, 2, 3, 4, 1, 2]",
          "[12, 5, None, 10, 3, 17, 24] [1, 2, 3, 4, 3, 4]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`DEL = object()

def insert(t, k):
    i = k % len(t)
    while t[i] is not None and t[i] is not DEL:
        i = (i + 1) % len(t)
    t[i] = k

def find(t, k):
    i = k % len(t)
    while t[i] is not None:
        if t[i] == k:
            return i
        i = (i + 1) % len(t)
    return -1

a, b = [None] * 7, [None] * 7
for t in (a, b):
    for k in (10, 3, 17):
        insert(t, k)
a[a.index(3)] = None
b[b.index(3)] = DEL
insert(b, 24)
print(find(a, 17), find(b, 17), b.index(24), find(b, 3))`}</Code>
          <p>Two ways to delete the key 3. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-1 5 4 -1", "5 5 4 -1", "-1 5 6 -1", "-1 -1 4 -1"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>OpenMap</C>, a hash map with linear probing. Keep <C>self.slots</C>, a list whose length is a power of two
            (8 to start), each entry <C>None</C>, the module-level object <C>TOMBSTONE</C>, or a <C>(key, value)</C> tuple. The
            starter&rsquo;s <C>_probe(slots, k)</C> walks from the home slot and returns where k is, and where it would go (the
            first tombstone on the path, if any). Support <C>m[k] = v</C>, <C>m[k]</C> (raising <C>KeyError</C>),{" "}
            <C>del m[k]</C> (leaving a tombstone; <C>KeyError</C> if absent), <C>k in m</C> and <C>len(m)</C>. Before an
            insertion into an empty slot that would make live keys plus tombstones exceed two-thirds of the slots, rebuild
            without tombstones, doubling the number of slots if live keys + 1 would be more than a third of them.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `TOMBSTONE = object()

def _probe(slots, k):
    # Returns (the index holding k, or None; the slot where k would be inserted).
    mask = len(slots) - 1
    i = hash(k) & mask
    first_dead = None
    while slots[i] is not None:
        if slots[i] is TOMBSTONE:
            if first_dead is None:
                first_dead = i
        elif slots[i][0] == k:
            return i, None
        i = (i + 1) & mask
    return None, (first_dead if first_dead is not None else i)

class OpenMap:
    def __init__(self):
        self.slots = [None] * 8
        self.d = {}

    def __setitem__(self, k, v):
        self.d[k] = v

    def __getitem__(self, k):
        return self.d[k]

    def __delitem__(self, k):
        del self.d[k]

    def __contains__(self, k):
        return k in self.d

    def __len__(self):
        return len(self.d)
`,
        solution: `TOMBSTONE = object()

def _probe(slots, k):
    # Returns (the index holding k, or None; the slot where k would be inserted).
    mask = len(slots) - 1
    i = hash(k) & mask
    first_dead = None
    while slots[i] is not None:
        if slots[i] is TOMBSTONE:
            if first_dead is None:
                first_dead = i
        elif slots[i][0] == k:
            return i, None
        i = (i + 1) & mask
    return None, (first_dead if first_dead is not None else i)

class OpenMap:
    def __init__(self, size=8):
        self.slots = [None] * size
        self.live = self.dead = 0

    def _rebuild(self):
        old = self.slots
        self.__init__(len(old) * (2 if 3 * (self.live + 1) > len(old) else 1))
        for s in old:
            if isinstance(s, tuple):
                self[s[0]] = s[1]

    def __setitem__(self, k, v):
        at, free = _probe(self.slots, k)
        if at is None and self.slots[free] is None and 3 * (self.live + self.dead + 1) > 2 * len(self.slots):
            self._rebuild()
            at, free = _probe(self.slots, k)
        if at is None:
            self.live += 1
            if self.slots[free] is TOMBSTONE:
                self.dead -= 1
        self.slots[free if at is None else at] = (k, v)

    def __getitem__(self, k):
        at = _probe(self.slots, k)[0]
        if at is None:
            raise KeyError(k)
        return self.slots[at][1]

    def __delitem__(self, k):
        at = _probe(self.slots, k)[0]
        if at is None:
            raise KeyError(k)
        self.slots[at] = TOMBSTONE
        self.live, self.dead = self.live - 1, self.dead + 1

    def __contains__(self, k):
        return _probe(self.slots, k)[0] is not None

    def __len__(self):
        return self.live
`,
        tests: [
          { name: "map", code: `m = OpenMap()
for i in range(20):
    m[i] = i * i
m[3] = 'three'
assert len(m) == 20 and m[3] == 'three' and m[19] == 361 and 7 in m and 25 not in m
del m[7]
assert 7 not in m and len(m) == 19
for bad in (lambda: m[7], lambda: m.__delitem__(7)):
    try:
        bad()
        assert False, 'Missing keys raise KeyError.'
    except KeyError:
        pass` },
          { name: "layout", code: `m = OpenMap()
for k in ['a', 'b', 'c', 'd', 'e']:
    m[k] = 1
n = len(m.slots)
assert n & (n - 1) == 0 and n >= 8
live = sum(1 for s in m.slots if isinstance(s, tuple))
assert live == 5 and 3 * live <= 2 * n
del m['a']
assert sum(1 for s in m.slots if s is TOMBSTONE) == 1, 'Deletion leaves a tombstone.'` },
          { name: "collisions", code: `class H:
    def __init__(self, v): self.v = v
    def __hash__(self): return 42
    def __eq__(self, o): return isinstance(o, H) and o.v == self.v
m = OpenMap()
keys = [H(i) for i in range(6)]
for i, k in enumerate(keys):
    m[k] = i
del m[keys[1]]
assert m[keys[5]] == 5 and keys[1] not in m, 'Searches must probe past tombstones.'
m[H(1)] = 'again'
assert m[keys[1]] == 'again' and len(m) == 6
assert sum(1 for s in m.slots if s is TOMBSTONE) == 0, 'Re-inserting reuses the tombstone on the path.'` },
          { name: "random", code: `import random
rng = random.Random(8)
m, ref = OpenMap(), {}
for i in range(20000):
    k = rng.randrange(300)
    r = rng.random()
    if r < 0.5:
        m[k] = i; ref[k] = i
    elif r < 0.8 and k in ref:
        del m[k]; del ref[k]
    else:
        assert (k in m) == (k in ref) and (k not in ref or m[k] == ref[k])
    used = sum(1 for s in m.slots if s is not None)
    assert 3 * used <= 2 * len(m.slots) and len(m) == len(ref)
assert len(m.slots) <= 4096, 'Rebuilding must clear tombstones rather than grow for ever.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Check Knuth&rsquo;s formulas by experiment. Write <C>unsuccessful_cost(m, alpha, scheme, trials, seed)</C>: with{" "}
            <C>rng = random.Random(seed)</C>, insert <C>int(alpha * m)</C> keys <C>rng.randrange(10**9)</C> into an empty table
            of m slots (m prime) by open addressing, then for <C>trials</C> fresh keys from the same generator count the slots
            examined until the first empty one, including it, and return the average. Key k starts at <C>k % m</C> and steps by 1
            for <C>"linear"</C>, or by <C>1 + (k // m) % (m - 1)</C> for <C>"double"</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def unsuccessful_cost(m, alpha, scheme, trials, seed):
    return 1 / (1 - alpha)
`,
        solution: `import random

def unsuccessful_cost(m, alpha, scheme, trials, seed):
    rng = random.Random(seed)
    table = [False] * m

    def step(k):
        return 1 if scheme == "linear" else 1 + (k // m) % (m - 1)

    for _ in range(int(alpha * m)):
        k = rng.randrange(10**9)
        i, s = k % m, step(k)
        while table[i]:
            i = (i + s) % m
        table[i] = True
    total = 0
    for _ in range(trials):
        k = rng.randrange(10**9)
        i, s, c = k % m, step(k), 1
        while table[i]:
            i, c = (i + s) % m, c + 1
        total += c
    return total / trials
`,
        tests: [
          { name: "small exact", code: `assert unsuccessful_cost(7, 0, "linear", 10, 1) == 1.0, 'An empty table costs one probe.'
r = unsuccessful_cost(11, 10 / 11, "linear", 200, 2)
assert 1 <= r <= 11` },
          { name: "double hashing", code: `for a in (0.5, 0.8, 0.9):
    r = unsuccessful_cost(10007, a, "double", 20000, 1)
    assert abs(r - 1 / (1 - a)) < 0.1 / (1 - a), f'alpha={a}: {r} against {1 / (1 - a)}'` },
          { name: "linear probing", code: `for a in (0.5, 0.8):
    want = 0.5 * (1 + 1 / (1 - a) ** 2)
    r = unsuccessful_cost(10007, a, "linear", 20000, 1)
    assert abs(r - want) < 0.15 * want, f'alpha={a}: {r} against {want}'
assert unsuccessful_cost(10007, 0.8, "linear", 20000, 3) > 2 * unsuccessful_cost(10007, 0.8, "double", 20000, 3), 'Clustering makes linear probing worse.'` },
        ],
      },
    },
    {
      key: "amortise",
      rung: "prove",
      prompt: (
        <p>
          A chained hash table doubles m and re-inserts every key whenever α would exceed 1. Assuming uniform hashing, prove that
          any sequence of n insertions into an initially empty table with m = 1 takes O(n) expected time.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Between resizes α ≤ 1, so each insertion (which checks for an existing key) costs O(1 + α) = O(1) expected.",
          "Resizes happen when n reaches 1, 2, 4, …, and the resize at size 2ʲ re-inserts 2ʲ keys at O(1) each.",
          "The total re-insertion work is 1 + 2 + … + 2ᵏ < 2n.",
          "Adds the two parts to get O(n) expected, i.e. O(1) amortised expected per insertion.",
        ],
      },
    },
    {
      key: "cuckoo",
      rung: "stretch",
      prompt: (
        <p>
          Cuckoo hashing gives every key two possible slots, h₁(k) and h₂(k), and stores it in one of them. Explain why lookup
          and deletion are O(1) in the worst case, how insertion works when both slots are full, and what the table does when an
          insertion goes round in a loop.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lookup and delete check exactly two slots, so they are worst-case O(1).",
          "Insertion places k in h₁(k); if occupied, it evicts the occupant, which moves to its other slot, possibly evicting another, and so on.",
          "A long chain of evictions or a cycle is detected by a step limit.",
          "On failure the table rehashes with new hash functions (or grows), which happens rarely when the load is below about one half, so insertion is O(1) expected amortised.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why linear probing slows down sharply as a hash table fills, why deleted slots need tombstones, and how resizing keeps operations O(1).",

  glimpse: (
    <p>
      The next two lessons use hashing without storing the keys at all: a Bloom filter answers &ldquo;have I seen this?&rdquo;
      in a few bits per item, and MinHash estimates how similar two documents are from a short signature. The trade-off between
      probe count and memory locality met here returns in Computer Systems, where caches decide what is fast.
    </p>
  ),
};
