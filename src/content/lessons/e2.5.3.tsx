import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QuickselectViz } from "@/components/viz/QuickselectViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.5.3",
  minutes: 55,
  links: {
    requires: ["e2.5.1", "e2.4.3"],
    revisits: ["e2.1.1", "m4.5.1"],
    foreshadows: ["e2.7.1", "e2.7.4", "l5.5.2"],
  },

  puzzle: (
    <>
      <p>
        A language model scores 100,000 possible next tokens, and top-k sampling needs only the 50 best. A search engine scores
        a million documents and shows ten. A robust statistic needs the median of a column with a billion rows. Sorting
        everything costs n log n and throws away almost all of the order it computes. How much cheaper can it be to find only
        the k-th smallest item, or only the k largest?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Quicksort partitions around a pivot and then sorts both sides. If you want only the item of rank k, you know after one
        partition which side it is on, because the pivot has landed in its final position. So recurse into that side alone and
        ignore the other. With a good pivot the work shrinks geometrically, n + n/2 + n/4 + &hellip;, which sums to about 2n:
        linear, not n log n. For the k largest of a stream, keep a min-heap of the best k seen so far; a new item gets in only
        if it beats the weakest of them, at the top of the heap.
      </p>
      <QuickselectViz />
    </>
  ),

  theory: (
    <>
      <Definition title="selection">
        <p>
          The item of <strong>rank k</strong> (0-based) in a list is the one at index k after sorting. Rank 0 is the minimum,
          rank n − 1 the maximum, and rank ⌊(n − 1)/2⌋ the lower median. <strong>Quickselect</strong> finds it by partitioning
          and keeping only the side that holds rank k:
        </p>
        <Code>{`import random

def select(items, k):
    while True:
        pivot = random.choice(items)
        less = [x for x in items if x < pivot]
        equal = [x for x in items if x == pivot]
        if k < len(less):
            items = less
        elif k < len(less) + len(equal):
            return pivot
        else:
            k -= len(less) + len(equal)
            items = [x for x in items if x > pivot]`}</Code>
      </Definition>

      <Theorem title="quickselect is linear on average">
        <p>
          With the pivot chosen uniformly at random, quickselect makes O(n) comparisons in expectation, for every input and
          every k. In the worst case it makes Θ(n²).
        </p>
      </Theorem>
      <Proof>
        <p>
          Call a pivot <em>good</em> if its rank lies in the middle half of the current list. Then both sides have at most 3/4
          of the items, so whichever side is kept, the list shrinks to at most 3/4 of its size. A random pivot is good with
          probability at least 1/2, so the expected number of partitions until a good one is at most 2. Group the run into
          phases, where phase j is the stretch during which the size is between <M>{"(3/4)^{j+1}n"}</M> and{" "}
          <M>{"(3/4)^{j}n"}</M>. Each partition in phase j costs at most <M>{"(3/4)^{j}n"}</M> comparisons, and the phase lasts
          at most 2 partitions on average, so the expected total is at most{" "}
          <M>{"\\sum_j 2c(3/4)^j n = 8cn"}</M> for a constant c per item. A pivot that is always the smallest or largest
          item removes one item each time, giving <M>{"n + (n-1) + \\dots = \\Theta(n^2)"}</M>; with a fixed rule such as
          &ldquo;the last item&rdquo;, sorted input does exactly that.
        </p>
      </Proof>

      <Example title="median of medians">
        <p>
          Linear time is also possible in the worst case. Split the items into groups of 5, take the median of each group, and
          recursively select the median of those n/5 medians as the pivot. At least half the groups have a median no greater
          than it, and each of those groups has 3 items no greater than it, so at least about 3n/10 items lie on each side. The
          kept side has at most 7n/10 items, and{" "}
          <M>{"T(n) \\le T(n/5) + T(7n/10) + cn"}</M>. Since 1/5 + 7/10 &lt; 1, this solves to T(n) ≤ 10cn. The constant is
          large, so libraries use <strong>introselect</strong>: quickselect, falling back to median of medians only when the
          recursion goes badly. NumPy&rsquo;s <C>np.partition</C> and <C>np.argpartition</C> do this.
        </p>
      </Example>

      <Example title="top-k with a heap">
        <p>
          To keep the k largest items of a stream, hold them in a min-heap of size k. For each new item compare it with the
          heap&rsquo;s minimum; if it is larger, replace the minimum. That is O(n log k) time and O(k) memory, and works when
          the data does not fit in memory or never ends. Python&rsquo;s <C>heapq.nlargest(k, xs, key=...)</C> does this, and
          its result equals <C>sorted(xs, key=key, reverse=True)[:k]</C>, ties included. For k close to n, sorting is simpler;
          for a list already in memory and a moderate k, quickselect then sorting the top k costs O(n + k log k).
        </p>
      </Example>

      <Remark title="top-k in machine learning">
        <p>
          Top-k sampling keeps the k most likely tokens, then renormalises; on a GPU this is <C>torch.topk</C>, which selects
          in parallel rather than sorting the whole vocabulary. Top-p (nucleus) sampling needs the smallest set whose
          probabilities sum to p, which does need the items in order, but only the head of it. The same selection appears in
          beam search, which keeps the best k partial answers at each step, and in retrieval, which keeps the k nearest vectors.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: <p>What is the expected number of comparisons quickselect makes, with a random pivot, to find the median of n items?</p>,
      answer: { kind: "choice", options: ["Θ(n)", "Θ(n log n)", "Θ(log n)", "Θ(n²)"], correct: [0] },
    },
    {
      key: "worst",
      rung: "apply",
      prompt: (
        <p>
          Quickselect that always pivots on the last item is asked for rank 0 of <C>[1, 2, 3, &hellip;, 10]</C>. Each partition
          compares the pivot with every other item in the current range. How many comparisons does it make in total?
        </p>
      ),
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "groups",
      rung: "apply",
      prompt: <p>Median of medians runs on 100 items in groups of 5. How many medians does it recursively select the pivot from?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "heap",
      rung: "apply",
      prompt: <p>Which heap finds the 50 largest scores among a stream of 10⁶, in O(n log k) time and O(k) memory?</p>,
      answer: {
        kind: "choice",
        options: ["A min-heap of size 50, whose top is the weakest of the best so far", "A max-heap of all 10⁶ scores", "A max-heap of size 50", "A min-heap of all 10⁶ scores"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def select(a, k):
    a = list(a)
    lo, hi, path = 0, len(a), []
    while True:
        pivot, i = a[hi - 1], lo
        for j in range(lo, hi - 1):
            if a[j] < pivot:
                a[i], a[j] = a[j], a[i]
                i += 1
        a[i], a[hi - 1] = a[hi - 1], a[i]
        path.append(pivot)
        if i == k:
            return a[i], path
        if i < k:
            lo = i + 1
        else:
            hi = i

print(select([9, 1, 8, 2, 7, 3, 6, 4, 5], 6), select([1, 2, 3, 4, 5], 0)[1])`}</Code>
          <p>Quickselect with the last item as pivot, recording each pivot. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(7, [5, 7]) [5, 4, 3, 2, 1]", "(7, [5, 7]) [1]", "(6, [5, 6]) [5, 4, 3, 2, 1]", "(7, [5, 8, 7]) [5, 4, 3, 2, 1]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

def top3(stream):
    heap, pushes = [], 0
    for x in stream:
        if len(heap) < 3:
            heapq.heappush(heap, x)
            pushes += 1
        elif x > heap[0]:
            heapq.heapreplace(heap, x)
            pushes += 1
    return heap[0], sorted(heap, reverse=True), pushes

print(*top3([4, 9, 2, 7, 7, 1, 8, 3, 10, 5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8 [10, 9, 8] 7", "8 [10, 9, 8] 10", "10 [10, 9, 8] 7", "8 [10, 9, 8] 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kth_smallest(a, k)</C>, the item of rank k in a (negative k counts from the end, as in indexing;{" "}
            <C>IndexError</C> if out of range), without changing a, in expected linear time. Pick the pivot at random and split
            into less, equal and greater in one pass that compares each item with the pivot at most twice, so that all-equal and
            sorted inputs are fast too. Then write <C>median_low(a)</C>, the item of rank ⌊(n − 1)/2⌋, with{" "}
            <C>ValueError</C> for an empty list. The tests count comparisons: at most 9 per item on random input, which rules out
            sorting.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kth_smallest(a, k):
    return sorted(a)[k]

def median_low(a):
    return sorted(a)[len(a) // 2]
`,
        solution: `import random

def kth_smallest(a, k):
    if not -len(a) <= k < len(a):
        raise IndexError('rank out of range')
    if k < 0:
        k += len(a)
    items = list(a)
    while True:
        pivot = random.choice(items)
        less, equal, more = [], [], []
        for x in items:
            if x < pivot:
                less.append(x)
            elif pivot < x:
                more.append(x)
            else:
                equal.append(x)
        if k < len(less):
            items = less
        elif k < len(less) + len(equal):
            return pivot
        else:
            k -= len(less) + len(equal)
            items = more

def median_low(a):
    if not a:
        raise ValueError('empty')
    return kth_smallest(a, (len(a) - 1) // 2)
`,
        tests: [
          { name: "ranks", code: `import random, statistics, time
rng = random.Random(1)
for _ in range(300):
    a = [rng.randint(0, 20) for _ in range(rng.randint(1, 30))]
    s = sorted(a)
    for k in range(len(a)):
        assert kth_smallest(a, k) == s[k]
    assert kth_smallest(a, -1) == s[-1]
    b = list(a); kth_smallest(b, len(b) // 2); assert b == a, 'Do not modify the input.'
    assert median_low(a) == statistics.median_low(a)
for bad in [5, -6]:
    try:
        kth_smallest([1, 2, 3, 4, 5], bad); assert False
    except IndexError: pass
try:
    median_low([]); assert False
except ValueError: pass` },
          { name: "linear", code: `class TooMany(Exception):
    pass

class K:
    count, limit = 0, None
    __hash__ = None
    def __init__(self, v): self.v = v
    def _n(self):
        K.count += 1
        if K.limit is not None and K.count > K.limit:
            raise TooMany(f'more than {K.limit} comparisons')
    def __lt__(self, o): self._n(); return self.v < o.v
    def __gt__(self, o): self._n(); return self.v > o.v
    def __le__(self, o): self._n(); return self.v <= o.v
    def __ge__(self, o): self._n(); return self.v >= o.v
    def __eq__(self, o): self._n(); return self.v == o.v
import random
n = 1 << 14
rng = random.Random(5)
K.count, K.limit = 0, 4 * 9 * n
try:
    for _ in range(4):
        vals = rng.sample(range(n), n)
        k = rng.randrange(n)
        assert kth_smallest([K(v) for v in vals], k).v == k
except TooMany:
    raise AssertionError('Over 9 comparisons per item on random input: that is not linear.')
per = K.count / (4 * n)
assert per <= 9, f'{per:.1f} comparisons per item on average: that is not linear.'
for vals in [list(range(n)), list(range(n, 0, -1)), [7] * n]:
    K.count, K.limit = 0, 40 * n
    try:
        got = kth_smallest([K(v) for v in vals], n // 3)
    except TooMany:
        raise AssertionError('Sorted, reversed or all-equal input takes quadratic time: pick a random pivot and group the items equal to it.')
    assert got.v == sorted(vals)[n // 3]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two streaming problems with heaps, each touching every item once:</p>
          <ul>
            <li>
              <C>top_k(iterable, k, key=None)</C>: the k items with the largest keys, largest first, equal to{" "}
              <C>sorted(iterable, key=key, reverse=True)[:k]</C> including the order of ties, holding at most k items at once (
              <C>ValueError</C> if k &lt; 0);
            </li>
            <li>
              <C>running_median(stream)</C>: a generator that yields the lower median of the items seen so far after each item,
              in O(log n) per item, using a max-heap of the lower half and a min-heap of the upper half.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def top_k(iterable, k, key=None):
    return list(iterable)[:k]

def running_median(stream):
    for x in stream:
        yield x
`,
        solution: `import heapq
from itertools import count

def top_k(iterable, k, key=None):
    if k < 0:
        raise ValueError('k must be non-negative')
    if key is None:
        key = lambda x: x
    heap, order = [], count()
    for x in iterable:
        entry = (key(x), -next(order), x)
        if len(heap) < k:
            heapq.heappush(heap, entry)
        elif k and entry[:2] > heap[0][:2]:
            heapq.heapreplace(heap, entry)
    return [x for *_, x in sorted(heap, key=lambda e: e[:2], reverse=True)]

def running_median(stream):
    low, high = [], []          # low: max-heap (negated), high: min-heap
    for x in stream:
        if not low or x <= -low[0]:
            heapq.heappush(low, -x)
        else:
            heapq.heappush(high, x)
        if len(low) > len(high) + 1:
            heapq.heappush(high, -heapq.heappop(low))
        elif len(high) > len(low):
            heapq.heappush(low, -heapq.heappop(high))
        yield -low[0]
`,
        tests: [
          { name: "top-k", code: `import random
rng = random.Random(6)
assert top_k([4, 9, 2, 7, 7, 1, 8], 3) == [9, 8, 7]
assert top_k([], 3) == [] and top_k([1, 2], 0) == [] and top_k([1, 2], 5) == [2, 1]
words = ['fig', 'kiwi', 'plum', 'date', 'banana', 'pear', 'apple']
assert top_k(words, 3, key=len) == ['banana', 'apple', 'kiwi'], 'Ties keep their original order.'
for _ in range(300):
    xs = [(rng.randint(0, 9), i) for i in range(rng.randint(0, 40))]
    k = rng.randint(0, 12)
    assert top_k(xs, k, key=lambda p: p[0]) == sorted(xs, key=lambda p: p[0], reverse=True)[:k], (xs, k)
try:
    top_k([1], -1)
    assert False, 'Negative k raises ValueError.'
except ValueError:
    pass` },
          { name: "constant memory", code: `class Item:
    alive = peak = 0
    def __init__(self, v):
        self.v = v
        Item.alive += 1
        Item.peak = max(Item.peak, Item.alive)
    def __del__(self):
        Item.alive -= 1
def stream(n, seed):
    import random
    rng = random.Random(seed)
    for _ in range(n):
        yield Item(rng.random())
best = top_k(stream(100000, 1), 5, key=lambda it: it.v)
import random
rng = random.Random(1)
ref = sorted((rng.random() for _ in range(100000)), reverse=True)[:5]
assert [it.v for it in best] == ref
assert Item.peak <= 5 + 3, f'{Item.peak} items held at once: keep only k.'` },
          { name: "running median", code: `import random, statistics
rng = random.Random(8)
assert list(running_median([5, 1, 9, 3, 7])) == [5, 1, 5, 3, 5]
assert list(running_median([])) == []
for _ in range(100):
    xs = [rng.randint(0, 30) for _ in range(rng.randint(1, 40))]
    assert list(running_median(xs)) == [statistics.median_low(xs[:i + 1]) for i in range(len(xs))], xs
xs = [rng.random() for _ in range(50000)]
med = list(running_median(iter(xs)))
assert med[-1] == statistics.median_low(xs) and len(med) == 50000` },
        ],
      },
    },
    {
      key: "expected",
      rung: "prove",
      prompt: <p>Prove that quickselect with a uniformly random pivot makes O(n) comparisons in expectation.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines a good pivot as one whose rank is in the middle half, so the kept side has at most 3/4 of the items.",
          "Notes a random pivot is good with probability at least 1/2, so on average at most 2 partitions pass before the size drops by a factor 3/4.",
          "Bounds each partition by a constant times the current size, at most (3/4)ʲ n in phase j.",
          "Sums the geometric series, giving at most a constant times n in expectation.",
        ],
      },
    },
    {
      key: "mom",
      rung: "stretch",
      prompt: (
        <p>
          Show that median of medians with groups of 5 runs in O(n) in the worst case, and explain why the same argument fails
          with groups of 3.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows at least about 3n/10 items are no greater than the pivot (and likewise no smaller), so the kept side has at most about 7n/10 items.",
          "Writes T(n) ≤ T(n/5) + T(7n/10) + cn and proves T(n) ≤ 10cn by induction, since 1/5 + 7/10 = 9/10 < 1.",
          "With groups of 3 the pivot beats only about n/3 items, giving T(n) ≤ T(n/3) + T(2n/3) + cn.",
          "Since 1/3 + 2/3 = 1, that recurrence gives Θ(n log n), not O(n).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why finding the median does not need sorting, and how to keep the ten best scores from a stream too large to store.",

  glimpse: (
    <p>
      Chapter 5 is done: you can sort, search and select. Chapter 6 turns to graphs, where the heap returns as the engine of
      Dijkstra&rsquo;s algorithm, and the keep-the-best-k idea returns in chapter 7 as beam search.
    </p>
  ),
};
