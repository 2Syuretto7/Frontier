import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CompactDictViz } from "@/components/viz/CompactDictViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.3.1",
  minutes: 60,
  links: {
    requires: ["e2.2.1"],
    revisits: ["m4.4.4", "e0.4.2", "e1.3.1"],
    parallels: ["e1.7.1"],
    foreshadows: ["e2.3.2", "e11.4.1"],
  },

  puzzle: (
    <>
      <p>
        You have 5 million training examples and 2 million labels, each tagged with an example id, and you need to attach each
        label to its example. Comparing every example with every label is 10¹³ comparisons. A database does this join in about
        the time it takes to read both tables once. What does it build first?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        It builds a hash table on the smaller table, keyed by id, and then streams through the larger one, looking each id up in
        O(1). A hash table turns a key into an array position by computing a number from the key, its <strong>hash</strong>,
        and reducing it to the size of the array. Python&rsquo;s <C>dict</C> and <C>set</C> are hash tables, and the most
        useful thing to know about them is the contract that keys must keep: equal keys must have equal hashes, and a key&rsquo;s
        hash must never change while it is in the table.
      </p>
      <p>
        Since Python 3.6 a dict keeps two arrays: a sparse table of small integers, indexed by hash, and a dense list of
        entries in insertion order. That is why dicts remember insertion order, and why they use less memory than the sparse
        table alone would.
      </p>
      <CompactDictViz />
    </>
  ),

  theory: (
    <>
      <Definition title="hash table">
        <p>
          A <strong>hash table</strong> stores key-value pairs in an array of m slots. A <strong>hash function</strong> h maps
          each key to an integer, and the key lives at or near slot <M>{"h(k) \\bmod m"}</M>. Different keys can land in the
          same slot, a <strong>collision</strong>; the next lesson covers how tables resolve them and why, with a good hash and
          the table kept less than about two-thirds full, lookup, insertion and deletion take O(1) expected time.
        </p>
      </Definition>

      <Definition title="the contract">
        <p>A key type must provide <C>__hash__</C> and <C>__eq__</C> such that:</p>
        <ul>
          <li>if <C>a == b</C> then <C>hash(a) == hash(b)</C> (otherwise equal keys land in different slots and are never compared);</li>
          <li>the hash of a key never changes while it is in a table (otherwise it is looked for in the wrong slot).</li>
        </ul>
        <p>
          This is why Python&rsquo;s mutable built-ins (<C>list</C>, <C>dict</C>, <C>set</C>) are unhashable while{" "}
          <C>tuple</C>, <C>str</C>, <C>int</C> and <C>frozenset</C> are hashable. A class that defines <C>__eq__</C> without{" "}
          <C>__hash__</C> becomes unhashable; one that defines neither hashes by identity. Numbers that are equal hash
          equally across types, so <C>hash(1) == hash(1.0) == hash(True)</C> and <C>{"{1: 'a'}[1.0]"}</C> works.
        </p>
      </Definition>

      <Example title="hashing a string">
        <p>
          A classic hash for a string <M>{"s_0 s_1 \\dots s_{L-1}"}</M> treats it as a number in base B modulo a prime p:{" "}
          <M>{"h(s) = \\left(\\sum_i s_i B^{L-1-i}\\right) \\bmod p"}</M>, computed left to right by{" "}
          <C>h = (h * B + ord(c)) % p</C>. Python uses SipHash with a random key chosen at start-up, so{" "}
          <C>hash("cat")</C> differs between runs unless <C>PYTHONHASHSEED</C> is set. Never store Python&rsquo;s{" "}
          <C>hash()</C> of a string on disk or use it to split data between machines; use <C>hashlib</C> instead.
        </p>
      </Example>

      <Theorem title="collisions of the polynomial hash">
        <p>
          For two different strings of length L and a base B chosen uniformly from <M>{"\\{0, \\dots, p-1\\}"}</M>, the
          probability that they hash equally is at most <M>{"(L-1)/p"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The difference of the two hashes is a polynomial in B of degree at most L − 1 with coefficients{" "}
          <M>{"s_i - t_i"}</M>, not all zero modulo p. Over the field of integers mod p, a nonzero polynomial of degree at most
          L − 1 has at most L − 1 roots, so at most L − 1 of the p bases make it vanish.
        </p>
      </Proof>

      <Example title="patterns that hash tables make linear">
        <ul>
          <li><strong>Membership and de-duplication:</strong> a set of seen items.</li>
          <li><strong>Counting:</strong> <C>collections.Counter</C>, or <C>d[k] = d.get(k, 0) + 1</C>.</li>
          <li><strong>Grouping:</strong> <C>defaultdict(list)</C> from a group key to its items.</li>
          <li>
            <strong>Hash join:</strong> build a dict from join key to the rows of the smaller table, then probe it with each row
            of the larger: O(n + m + output) instead of O(nm).
          </li>
          <li><strong>Memoisation:</strong> a dict from arguments to results, as in <C>functools.cache</C>.</li>
        </ul>
      </Example>

      <Remark title="when not to use a hash table">
        <p>
          A hash table answers &ldquo;is this exact key present?&rdquo; and nothing else. It cannot find the smallest key, all
          keys between two values, or the nearest key; for those you need the ordered structures of the next chapter. And its
          O(1) is an expectation: a bad hash, or an adversary who knows your hash, can make every key collide.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hashable",
      rung: "check",
      prompt: <p>Which of these can be a key in a Python dict?</p>,
      answer: { kind: "choice", options: ["(1, 2, (3, 4))", "[1, 2]", "{1, 2}", "(1, [2])"], correct: [0] },
    },
    {
      key: "member",
      rung: "check",
      prompt: <p>What is the expected cost of <C>x in s</C> for a Python set s of n items?</p>,
      answer: { kind: "choice", options: ["O(1)", "Θ(log n)", "Θ(n)", "Θ(n log n)"], correct: [0] },
    },
    {
      key: "eqonly",
      rung: "apply",
      prompt: <p>A class defines <C>__eq__</C> but not <C>__hash__</C>. What happens when you put an instance in a set?</p>,
      answer: { kind: "choice", options: ["TypeError: unhashable type", "It hashes by identity", "It hashes by its fields", "It works, but lookups are O(n)"], correct: [0] },
    },
    {
      key: "anagrams",
      rung: "apply",
      prompt: <p>Group the words <C>listen silent enlist google tinsel banana inlets elgoog</C> by the key <C>"".join(sorted(word))</C>. How many groups are there?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "join",
      rung: "apply",
      prompt: <p>A hash join of tables with n and m rows producing k output rows costs, in expectation:</p>,
      answer: { kind: "choice", options: ["O(n + m + k)", "O(nm)", "O(n log m)", "O(k²)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class P:
    def __init__(self, x):
        self.x = x
    def __eq__(self, other):
        return isinstance(other, P) and self.x == other.x
    def __hash__(self):
        return hash(self.x)

a, b = P(1), P(1)
s = {a}
a.x = 2
print(b in s, a in s, P(2) in s, len({a, b}))`}</Code>
          <p>A key is changed after it was put in a set. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False False False 2", "True True False 1", "False True True 2", "True False False 2"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`d = {}
for w in "the cat sat on the mat".split():
    d[w] = d.get(w, 0) + 1
del d["cat"]
d["cat"] = 9
d["the"] = 0
print(list(d.items())[:3], list(d)[-1], hash(1) == hash(1.0), {1: "a"}.get(True))`}</Code>
          <p>Dicts keep insertion order, and equal numbers hash equally. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('the', 0), ('sat', 1), ('on', 1)] cat True a",
          "[('the', 0), ('cat', 9), ('sat', 1)] mat True a",
          "[('sat', 1), ('on', 1), ('mat', 1)] the True a",
          "[('the', 0), ('sat', 1), ('on', 1)] cat True None",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>hash_join(left, right, lkey, rkey)</C> for lists of dicts: for every pair with{" "}
            <C>l[lkey] == r[rkey]</C>, output <C>{"{**l, **r}"}</C>, ordered by left row, then by right row within a left row,
            exactly as the nested loop would. Build a dict on <C>right</C> so the cost is O(n + m + output). Then write{" "}
            <C>group_by(rows, key, field, agg)</C>, returning a dict from each value of <C>row[key]</C> (in order of first
            appearance) to the aggregate of <C>row[field]</C> over its rows, where agg is <C>"sum"</C>, <C>"count"</C>,{" "}
            <C>"mean"</C> or <C>"max"</C>, in one pass.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def hash_join(left, right, lkey, rkey):
    return []

def group_by(rows, key, field, agg):
    return {}
`,
        solution: `def hash_join(left, right, lkey, rkey):
    index = {}
    for r in right:
        index.setdefault(r[rkey], []).append(r)
    out = []
    for l in left:
        for r in index.get(l[lkey], ()):
            out.append({**l, **r})
    return out

def group_by(rows, key, field, agg):
    acc = {}
    for row in rows:
        k, v = row[key], row[field]
        if k not in acc:
            acc[k] = [0, 0, v]
        a = acc[k]
        a[0] += v
        a[1] += 1
        a[2] = max(a[2], v)
    if agg == "sum":
        return {k: a[0] for k, a in acc.items()}
    if agg == "count":
        return {k: a[1] for k, a in acc.items()}
    if agg == "mean":
        return {k: a[0] / a[1] for k, a in acc.items()}
    if agg == "max":
        return {k: a[2] for k, a in acc.items()}
    raise ValueError(agg)
`,
        tests: [
          { name: "join", code: `ex = [{'id': 1, 'text': 'a'}, {'id': 2, 'text': 'b'}, {'id': 3, 'text': 'c'}]
lab = [{'ex': 2, 'y': 0}, {'ex': 1, 'y': 1}, {'ex': 2, 'y': 1}, {'ex': 9, 'y': 0}]
assert hash_join(ex, lab, 'id', 'ex') == [
    {'id': 1, 'text': 'a', 'ex': 1, 'y': 1},
    {'id': 2, 'text': 'b', 'ex': 2, 'y': 0},
    {'id': 2, 'text': 'b', 'ex': 2, 'y': 1},
], 'Left order, then right order; unmatched rows vanish.'` },
          { name: "random join", code: `import random
rng = random.Random(4)
for _ in range(100):
    L = [{'k': rng.randint(0, 5), 'i': i} for i in range(rng.randint(0, 12))]
    R = [{'k2': rng.randint(0, 5), 'j': j} for j in range(rng.randint(0, 12))]
    assert hash_join(L, R, 'k', 'k2') == [{**l, **r} for l in L for r in R if l['k'] == r['k2']]` },
          { name: "big join", code: `import time
n = 100000
L = [{'id': i, 'x': i} for i in range(n)]
R = [{'rid': (i * 7) % n, 'y': i} for i in range(n)]
t = time.time()
out = hash_join(L, R, 'id', 'rid')
assert len(out) == n and time.time() - t < 3, 'Build a dict; do not compare every pair.'` },
          { name: "group", code: `rows = [{'city': 'Pune', 'v': 3}, {'city': 'Delhi', 'v': 5}, {'city': 'Pune', 'v': 7}, {'city': 'Agra', 'v': -2}]
assert group_by(rows, 'city', 'v', 'sum') == {'Pune': 10, 'Delhi': 5, 'Agra': -2}
assert list(group_by(rows, 'city', 'v', 'count')) == ['Pune', 'Delhi', 'Agra'], 'Keys in order of first appearance.'
assert group_by(rows, 'city', 'v', 'mean') == {'Pune': 5.0, 'Delhi': 5.0, 'Agra': -2.0}
assert group_by(rows, 'city', 'v', 'max') == {'Pune': 7, 'Delhi': 5, 'Agra': -2}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write an immutable value class <C>Ratio(p, q)</C> for exact fractions that obeys the hash contract. Store it in
            lowest terms with q &gt; 0 (raise <C>ZeroDivisionError</C> if q = 0), expose <C>p</C> and <C>q</C>, and make
            assigning to any attribute raise <C>AttributeError</C>. <C>__eq__</C> compares with other <C>Ratio</C>s and with{" "}
            <C>int</C>s (so <C>Ratio(6, 2) == 3</C>) and returns <C>NotImplemented</C> for anything else. <C>__hash__</C> must
            make equal values hash equally, including <C>hash(Ratio(6, 2)) == hash(3)</C>, so that ratios and integers can
            find each other in dicts and sets.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Ratio:
    def __init__(self, p, q):
        self.p, self.q = p, q

    def __eq__(self, other):
        return isinstance(other, Ratio) and self.p == other.p and self.q == other.q
`,
        solution: `from math import gcd

class Ratio:
    __slots__ = ('p', 'q')

    def __init__(self, p, q):
        if q == 0:
            raise ZeroDivisionError('q = 0')
        if q < 0:
            p, q = -p, -q
        g = gcd(p, q)
        object.__setattr__(self, 'p', p // g)
        object.__setattr__(self, 'q', q // g)

    def __setattr__(self, name, value):
        raise AttributeError('Ratio is immutable')

    def __delattr__(self, name):
        raise AttributeError('Ratio is immutable')

    def __eq__(self, other):
        if isinstance(other, Ratio):
            return self.p == other.p and self.q == other.q
        if isinstance(other, int):
            return self.q == 1 and self.p == other
        return NotImplemented

    def __hash__(self):
        return hash(self.p) if self.q == 1 else hash((self.p, self.q))

    def __repr__(self):
        return f'Ratio({self.p}, {self.q})'
`,
        tests: [
          { name: "normal form", code: `r = Ratio(6, -4)
assert (r.p, r.q) == (-3, 2) and Ratio(0, 5) == Ratio(0, -7) and Ratio(-2, -4) == Ratio(1, 2)
try:
    Ratio(1, 0)
    assert False, 'q = 0 must raise ZeroDivisionError.'
except ZeroDivisionError:
    pass` },
          { name: "hash contract", code: `assert len({Ratio(1, 2), Ratio(2, 4), Ratio(-3, -6)}) == 1
assert hash(Ratio(6, 2)) == hash(3) and Ratio(6, 2) == 3 and 3 == Ratio(6, 2)
d = {3: 'three', Ratio(1, 2): 'half'}
assert d[Ratio(9, 3)] == 'three' and d[Ratio(5, 10)] == 'half' and Ratio(4, 2) in {2, 5}
assert (Ratio(1, 2) == 0.5) is False and Ratio(1, 2) != 'x'
import random
rng = random.Random(2)
for _ in range(2000):
    a, b, c, d2 = (rng.randint(-20, 20) for _ in range(4))
    if b and d2 and Ratio(a, b) == Ratio(c, d2):
        assert hash(Ratio(a, b)) == hash(Ratio(c, d2)) and a * d2 == b * c` },
          { name: "immutable", code: `r = Ratio(1, 3)
for name in ('p', 'q', 'other'):
    try:
        setattr(r, name, 5)
        assert False, f'Setting {name} must raise AttributeError.'
    except AttributeError:
        pass
assert (r.p, r.q) == (1, 3)` },
        ],
      },
    },
    {
      key: "contract",
      rung: "prove",
      prompt: (
        <p>
          A table with separate chaining finds a key k by computing <M>{"i = h(k) \\bmod m"}</M> and comparing k with each key
          in chain i. Prove that if some pair of keys has <C>a == b</C> but <M>{"h(a) \\ne h(b)"}</M>, then for some table size
          m, inserting a and then looking up b fails, and explain why mutating a stored key breaks lookups in the same way.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Chooses m larger than |h(a) − h(b)| (or any m not dividing the difference), so a and b go to different chains.",
          "Looking up b searches only chain h(b) mod m, which does not contain a, so b is reported absent though a == b is stored.",
          "Mutating a stored key changes its hash (or its equality), so later lookups go to a chain that does not hold it, or compare unequal.",
          "Concludes that a == b must imply h(a) == h(b), and hashes of stored keys must not change.",
        ],
      },
    },
    {
      key: "flooding",
      rung: "stretch",
      prompt: (
        <p>
          In 2011 attackers took down web servers by sending HTTP requests with thousands of form fields whose names all
          collided in the server&rsquo;s string hash. Explain why this makes parsing one request quadratic, and why giving the
          hash a secret random key, as Python now does, defeats the attack.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "If n keys share a hash, they all land in one chain or probe sequence, so the i-th insertion compares with up to i keys: Θ(n²) for the request.",
          "With a fixed, public hash function an attacker can precompute many colliding strings offline.",
          "A keyed hash (such as SipHash with a random key per process) makes collisions unpredictable without the key.",
          "So the attacker cannot choose colliding names, and keys behave like random ones, restoring O(1) expected operations.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a hash join attaches labels to examples in linear time, and the two rules a key must follow to live in a dict.",

  glimpse: (
    <p>
      The next lesson opens up the table: what happens when keys collide, how full a table may get, and why Python probes rather
      than chains. Later in the chapter hashing is used for something else entirely, compact sketches of huge sets: Bloom filters
      and MinHash, which data pipelines use to find duplicate documents among billions.
    </p>
  ),
};
