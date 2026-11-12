import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BinarySearchViz } from "@/components/viz/BinarySearchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.5.2",
  minutes: 55,
  links: {
    requires: ["e2.5.1"],
    revisits: ["m4.5.1", "e1.2.4", "m1.3.5"],
    foreshadows: ["e2.5.3", "e2.8.2", "e10.1.1"],
  },

  puzzle: (
    <>
      <p>
        Binary search is ten lines long, and the first correct version was not published until some fifteen years after the
        idea; decades later the version in Java&rsquo;s standard library was found to overflow. Meanwhile the same ten lines
        answer questions that have no array at all: what is the largest batch size that fits in GPU memory, or the smallest
        learning rate at which training diverges? What is the idea that makes both work, and how do you write it so it is
        right first time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Forget &ldquo;find x&rdquo;. Think of a test that is false for a while and then true for ever, like &ldquo;is a[i] ≥
        x?&rdquo; on a sorted array, or &ldquo;does batch size b run out of memory?&rdquo;. Binary search finds the first place
        the test is true. Keep a range [lo, hi) known to contain that place, test the middle, and throw away the half that
        cannot contain it. Each test halves the range. All the off-by-one errors disappear if you write down that invariant and
        keep it exactly. The two library functions differ only in their test: <C>a[i] ≥ x</C> for <C>bisect_left</C>,{" "}
        <C>a[i] &gt; x</C> for <C>bisect_right</C>.
      </p>
      <BinarySearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the first-true search">
        <p>
          Let p be a predicate on the integers in [lo, hi) that is <strong>monotone</strong>: once true, true from then on. The
          search below returns the first i with p(i) true, or hi if there is none, using{" "}
          <M>{"\\lceil \\log_2 (hi - lo + 1) \\rceil"}</M> evaluations of p at most.
        </p>
        <Code>{`def first_true(lo, hi, p):
    while lo < hi:               # answer is in [lo, hi]
        mid = (lo + hi) // 2     # lo <= mid < hi
        if p(mid):
            hi = mid             # answer <= mid
        else:
            lo = mid + 1         # answer > mid
    return lo`}</Code>
      </Definition>

      <Theorem title="correctness">
        <p>The function returns the first index in [lo, hi) where p is true, or the original hi if there is none.</p>
      </Theorem>
      <Proof>
        <p>
          Invariant: p is false at every index below lo, and p is true at hi or hi is the original upper end. It holds at the
          start. If p(mid) is true, setting hi = mid keeps it; if false, monotonicity makes p false at every index up to mid, so
          setting lo = mid + 1 keeps it. Since lo ≤ mid &lt; hi, the range shrinks every step, so the loop ends, with lo = hi,
          which by the invariant is the answer. In Python integers do not overflow; in languages where they do, write{" "}
          <C>mid = lo + (hi - lo) / 2</C>, the fix for the bug in Java&rsquo;s library.
        </p>
      </Proof>

      <Example title="bisect">
        <p>
          <C>bisect_left(a, x)</C> is <C>first_true</C> with p(i) = (a[i] ≥ x): the first position of x, or where it would go.{" "}
          <C>bisect_right(a, x)</C> uses a[i] &gt; x: just after the last x. So{" "}
          <C>bisect_right(a, x) - bisect_left(a, x)</C> counts copies of x, and the keys in [lo, hi] are{" "}
          <C>a[bisect_left(a, lo):bisect_right(a, hi)]</C>. <C>insort</C> inserts while keeping a list sorted (O(log n) to
          find the place, O(n) to shift).
        </p>
      </Example>

      <Example title="searching on the answer">
        <p>
          Many optimisation questions have a monotone yes/no version. The smallest ship capacity that delivers packages within D
          days: &ldquo;can capacity c do it?&rdquo; is monotone in c and checked greedily in O(n), so binary search over c costs
          O(n log W) for weights summing to W. The largest batch size that fits in memory, the smallest number of machines for a
          deadline, the square root of a big integer: all are a monotone predicate plus binary search. For real numbers, bisect
          until the interval is shorter than the tolerance, as in the bisection method of M1.
        </p>
      </Example>

      <Example title="unbounded search">
        <p>
          When there is no known upper end, gallop first: test lo + 1, lo + 2, lo + 4, … until the predicate changes, then
          binary search inside the last gap. If the answer is d steps away this costs about <M>{"2\\log_2 d"}</M> tests. Timsort
          uses galloping when merging runs, and <C>git bisect</C> is binary search over history.
        </p>
      </Example>

      <Remark title="a lower bound, and the cache">
        <p>
          Any algorithm that searches a sorted array by comparisons needs <M>{"\\lceil \\log_2(n+1) \\rceil"}</M> comparisons
          in the worst case, since there are n + 1 possible answers and each comparison at best halves them. Binary search
          meets the bound. In practice its first probes jump far apart and each misses the cache; layouts such as the Eytzinger
          (breadth-first heap) order, or B-tree-like blocks, put the early probes together and can be several times faster on
          large arrays.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "comparisons",
      rung: "check",
      prompt: <p>At most how many comparisons does binary search need to find where a value belongs among 1000 sorted items?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "left",
      rung: "check",
      prompt: <p>What does <C>bisect_left(a, x)</C> return for a sorted list a?</p>,
      answer: { kind: "choice", options: ["The first index i with a[i] ≥ x, or len(a)", "The index of the last x", "The first index i with a[i] > x", "−1 if x is absent"], correct: [0] },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>With <C>a = [1, 2, 2, 2, 5]</C>, what is <C>bisect_right(a, 2) - bisect_left(a, 2)</C>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "gallop",
      rung: "apply",
      prompt: <p>Galloping tests indices 1, 2, 4, 8, … until it reaches an index at least as large as the answer, which is 100. How many indices does it test before switching to binary search?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "monotone",
      rung: "apply",
      prompt: <p>You binary search for the largest batch size that trains without running out of memory. What must be true for this to be valid?</p>,
      answer: {
        kind: "choice",
        options: ["If a batch size fits, every smaller one fits too", "Memory use must be linear in batch size", "The batch sizes must be powers of two", "Training must be deterministic"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def first_true(lo, hi, pred):
    steps = []
    while lo < hi:
        mid = (lo + hi) // 2
        steps.append(mid)
        if pred(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo, steps

print(first_true(0, 100, lambda x: x * x >= 2000), first_true(0, 10, lambda x: False)[0])`}</Code>
          <p>Searching on the answer for a square root. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(45, [50, 25, 38, 44, 47, 46, 45]) 10", "(44, [50, 25, 38, 44, 47, 46, 45]) 10", "(45, [50, 25, 37, 43, 46, 45]) 10", "(45, [50, 25, 38, 44, 47, 46, 45]) 9"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from bisect import bisect_left, bisect_right
xs = [1, 3, 3, 3, 7, 9]
grades = "".join("FDCBA"[bisect_right([60, 70, 80, 90], s)] for s in [59, 60, 85, 90, 100])
print(bisect_left(xs, 3), bisect_right(xs, 3), bisect_left(xs, 4), bisect_right(xs, 10), bisect_left(xs, 0), grades)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 4 4 6 0 FDBAA", "1 3 4 6 0 FDBAA", "1 4 4 6 0 FFBBA", "2 4 4 5 0 FDBAA"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            The starter gives <C>bisect_left(a, x, key=None)</C>, matching Python&rsquo;s <C>bisect</C> module (with key applied to
            the items of a, not to x). Write <C>bisect_right(a, x, key=None)</C> to match it. Then write <C>search_rotated(a, x)</C>: a is a
            sorted list of distinct items rotated by an unknown amount, such as <C>[6, 8, 9, 1, 3, 4]</C>; return the index of x
            or −1, in O(log n) comparisons.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bisect_left(a, x, key=None):
    k = key or (lambda v: v)
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if k(a[mid]) < x:
            lo = mid + 1
        else:
            hi = mid
    return lo

def bisect_right(a, x, key=None):
    return bisect_left(a, x, key) + 1

def search_rotated(a, x):
    return a.index(x) if x in a else -1
`,
        solution: `def bisect_left(a, x, key=None):
    k = key or (lambda v: v)
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if k(a[mid]) < x:
            lo = mid + 1
        else:
            hi = mid
    return lo

def bisect_right(a, x, key=None):
    k = key or (lambda v: v)
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if x < k(a[mid]):
            hi = mid
        else:
            lo = mid + 1
    return lo

def search_rotated(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
`,
        tests: [
          { name: "bisect", code: `import bisect, random
rng = random.Random(1)
for _ in range(500):
    a = sorted(rng.randint(0, 9) for _ in range(rng.randint(0, 12)))
    x = rng.randint(-1, 10)
    assert bisect_left(a, x) == bisect.bisect_left(a, x) and bisect_right(a, x) == bisect.bisect_right(a, x), (a, x)
recs = [("a", 1), ("b", 3), ("c", 3), ("d", 7)]
assert bisect_left(recs, 3, key=lambda r: r[1]) == 1 and bisect_right(recs, 3, key=lambda r: r[1]) == 3` },
          { name: "rotated", code: `import random
rng = random.Random(2)
for n in range(0, 25):
    base = sorted(rng.sample(range(100), n))
    for r in range(max(n, 1)):
        a = base[r:] + base[:r]
        for x in range(-1, 101, 7):
            assert search_rotated(a, x) == (a.index(x) if x in a else -1), (a, x)` },
          { name: "logarithmic", code: `class K:
    count = 0
    def __init__(self, v): self.v = v
    def _c(self, o):
        K.count += 1
        return o.v if isinstance(o, K) else o
    def __lt__(self, o): return self.v < self._c(o)
    def __le__(self, o): return self.v <= self._c(o)
    def __gt__(self, o): return self.v > self._c(o)
    def __ge__(self, o): return self.v >= self._c(o)
    def __eq__(self, o): return self.v == self._c(o)
    __hash__ = None
n = 1 << 16
base = [K(i) for i in range(n)]
a = base[12345:] + base[:12345]
K.count = 0
i = search_rotated(a, K(777))
assert i >= 0 and a[i].v == 777, i
assert K.count <= 6 * 17 * 2, f'{K.count} comparisons is not logarithmic.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Three searches on the answer, each with a monotone predicate:</p>
          <ul>
            <li><C>isqrt(n)</C>, the largest r with r² ≤ n, for integers up to 10¹⁰⁰, without floats or <C>math.isqrt</C> (<C>ValueError</C> if n &lt; 0);</li>
            <li>
              <C>min_capacity(weights, days)</C>, the least capacity with which packages, shipped in the given order, fit into at
              most <C>days</C> loads, each day taking as many next packages as fit (<C>ValueError</C> if days &lt; 1); the starter&rsquo;s <C>_days_needed(weights, cap)</C> counts the loads for a given capacity;
            </li>
            <li>
              <C>largest_true(pred, lo)</C>, the largest b ≥ lo with pred(b) true, given that pred(lo) is true and pred is true
              then false; gallop (lo + 1, lo + 2, lo + 4, …) and then binary search, calling pred O(log d) times when the answer is
              d above lo.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def _days_needed(weights, cap):
    days, load = 1, 0
    for w in weights:
        if load + w > cap:
            days, load = days + 1, 0
        load += w
    return days

def isqrt(n):
    return int(n ** 0.5)

def min_capacity(weights, days):
    return max(weights)

def largest_true(pred, lo):
    b = lo
    while pred(b + 1):
        b += 1
    return b
`,
        solution: `def isqrt(n):
    if n < 0:
        raise ValueError('negative')
    lo, hi = 0, 1 << (n.bit_length() // 2 + 1)
    while lo < hi:                      # first r with r * r > n
        mid = (lo + hi) // 2
        if mid * mid > n:
            hi = mid
        else:
            lo = mid + 1
    return lo - 1

def _days_needed(weights, cap):
    days, load = 1, 0
    for w in weights:
        if load + w > cap:
            days, load = days + 1, 0
        load += w
    return days

def min_capacity(weights, days):
    if days < 1:
        raise ValueError('days must be at least 1')
    lo, hi = max(weights), sum(weights)
    while lo < hi:
        mid = (lo + hi) // 2
        if _days_needed(weights, mid) <= days:
            hi = mid
        else:
            lo = mid + 1
    return lo

def largest_true(pred, lo):
    step = 1
    while pred(lo + step):
        step *= 2
    good, bad = lo + step // 2, lo + step
    while bad - good > 1:
        mid = (good + bad) // 2
        if pred(mid):
            good = mid
        else:
            bad = mid
    return good
`,
        tests: [
          { name: "isqrt", code: `import math, random
rng = random.Random(3)
for n in list(range(200)) + [rng.randrange(10 ** rng.randint(1, 100)) for _ in range(300)]:
    assert isqrt(n) == math.isqrt(n), n
assert isqrt(10 ** 100) == 10 ** 50
try:
    isqrt(-1)
    assert False, 'Negative input raises ValueError.'
except ValueError:
    pass` },
          { name: "capacity", code: `assert min_capacity([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5) == 15
assert min_capacity([3, 2, 2, 4, 1, 4], 3) == 6 and min_capacity([1, 2, 3, 1, 1], 4) == 3
assert min_capacity([5], 3) == 5 and min_capacity([7, 2, 5, 10, 8], 1) == 32
import random
rng = random.Random(4)
def days_for(ws, c):
    d, load = 1, 0
    for w in ws:
        if load + w > c:
            d, load = d + 1, 0
        load += w
    return d
for _ in range(200):
    ws = [rng.randint(1, 9) for _ in range(rng.randint(1, 10))]
    D = rng.randint(1, 6)
    best = next(c for c in range(max(ws), sum(ws) + 1) if days_for(ws, c) <= D)
    assert min_capacity(ws, D) == best, (ws, D)` },
          { name: "gallop", code: `import math
for answer in [0, 1, 2, 3, 7, 100, 1000, 12345, 10 ** 9]:
    calls = []
    def pred(b):
        calls.append(b)
        return b <= answer
    assert largest_true(pred, 0) == answer, answer
    assert len(calls) <= 2 * math.log2(answer + 2) + 3, f'{len(calls)} calls for answer {answer}'
assert largest_true(lambda b: b <= 57, 50) == 57` },
        ],
      },
    },
    {
      key: "invariant",
      rung: "prove",
      prompt: <p>Prove that <C>first_true</C> terminates after at most ⌈log₂(hi − lo + 1)⌉ evaluations of the predicate.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Tracks the number of candidate answers, hi − lo + 1 (the answer lies in [lo, hi]).",
          "With mid = ⌊(lo + hi)/2⌋, both new ranges [lo, mid] and [mid + 1, hi] have at most ⌈(hi − lo + 1)/2⌉ candidates.",
          "So after k evaluations at most ⌈N/2ᵏ⌉ candidates remain, with N = hi − lo + 1.",
          "The loop stops when one candidate remains, which takes at most ⌈log₂ N⌉ evaluations.",
        ],
      },
    },
    {
      key: "lower",
      rung: "stretch",
      prompt: <p>Prove that any algorithm that finds the insertion position of x in a sorted array of n items, using only comparisons of x with items, must make at least ⌈log₂(n + 1)⌉ comparisons in the worst case.</p>,
      answer: {
        kind: "written",
        rubric: [
          "There are n + 1 possible answers (positions 0 to n), and each is the right answer for some input.",
          "Models the algorithm as a binary decision tree whose leaves give answers; each answer needs at least one leaf.",
          "A binary tree of depth d has at most 2ᵈ leaves, so 2ᵈ ≥ n + 1.",
          "Hence the worst-case number of comparisons d is at least ⌈log₂(n + 1)⌉.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend binary search as finding where a true-or-false test first becomes true, and use it to find the largest batch size that fits in memory.",

  glimpse: (
    <p>
      Selection, next, finds the k-th smallest item without sorting. Binary search over suffixes is how suffix arrays answer
      substring queries in chapter 8, and searching on the answer reappears whenever a system is tuned: the largest batch, the
      shortest timeout, the fewest machines that meet a deadline.
    </p>
  ),
};
