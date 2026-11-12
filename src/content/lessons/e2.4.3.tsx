import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HeapViz } from "@/components/viz/HeapViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.4.3",
  minutes: 60,
  links: {
    requires: ["e2.4.1", "e2.2.1"],
    revisits: ["m4.3.3"],
    foreshadows: ["e2.5.3", "e2.6.3", "e2.7.4", "e3.4.2"],
  },

  puzzle: (
    <>
      <p>
        A training cluster has a queue of jobs, each with a priority, and new jobs arrive all the time. Whenever a GPU frees up
        it must start the most urgent job waiting. A sorted list makes taking the top job O(1) but inserting O(n); an unsorted
        list is the other way round. A balanced tree does both in O(log n), but stores three pointers per job and keeps far more
        order than needed. What is the least order you must maintain to always know the minimum?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Only that each item is no bigger than the items &ldquo;below&rdquo; it. A <strong>heap</strong> is a complete binary tree
        in which every parent is at most its children, so the minimum sits at the root, but siblings and cousins are in no
        particular order. A complete tree packs perfectly into an array, level by level, so the heap needs no pointers at all. A
        new item goes at the end and swaps upward while it is smaller than its parent; removing the minimum moves the last item
        to the root and swaps it downward with its smaller child. Both walk one path of length about log₂ n.
      </p>
      <HeapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="binary heap">
        <p>
          A <strong>binary min-heap</strong> stores n items in an array a[0 … n − 1] so that{" "}
          <M>{"a[\\lfloor (i-1)/2 \\rfloor] \\le a[i]"}</M> for every i ≥ 1: each item is at least its parent. Viewed as a tree,
          item i has children 2i + 1 and 2i + 2. Its height is <M>{"\\lfloor \\log_2 n \\rfloor"}</M>. A max-heap reverses the
          inequality.
        </p>
      </Definition>

      <Theorem title="priority queue operations">
        <ul>
          <li><strong>peek:</strong> a[0], O(1).</li>
          <li><strong>push:</strong> append, then <em>sift up</em>: swap with the parent while smaller. O(log n).</li>
          <li>
            <strong>pop:</strong> save a[0], move the last item to index 0, then <em>sift down</em>: swap with the smaller child
            while larger than it. O(log n).
          </li>
        </ul>
      </Theorem>

      <Theorem title="heapify in linear time">
        <p>
          Sifting down every node from the last parent, index <M>{"\\lfloor n/2 \\rfloor - 1"}</M>, back to the root turns any
          array into a heap in O(n) time.
        </p>
      </Theorem>
      <Proof>
        <p>
          When a node is processed its subtrees are already heaps, so sifting it down makes its own subtree a heap. A node at
          height h costs O(h), and there are at most <M>{"\\lceil n / 2^{h+1} \\rceil"}</M> nodes of height h. The total is{" "}
          <M>{"\\sum_h \\frac{n}{2^{h+1}}\\,O(h) = O\\!\\left(n \\sum_h \\frac{h}{2^h}\\right) = O(n)"}</M>, because{" "}
          <M>{"\\sum_{h \\ge 0} h/2^h = 2"}</M>. Most nodes are near the bottom, where sifting is cheap.
        </p>
      </Proof>

      <Example title="heapq">
        <p>
          Python&rsquo;s <C>heapq</C> module provides these operations on a plain list: <C>heappush</C>, <C>heappop</C>,{" "}
          <C>heapify</C>, and <C>heapreplace</C>. It is a min-heap; for a max-heap push negated keys. Push tuples{" "}
          <C>(priority, counter, item)</C> so ties are broken by insertion order and items themselves are never compared.
        </p>
        <Code>{`import heapq, itertools
tie = itertools.count()
jobs = []
heapq.heappush(jobs, (2, next(tie), "eval"))
heapq.heappush(jobs, (1, next(tie), "train"))
priority, _, job = heapq.heappop(jobs)    # (1, 1, "train")`}</Code>
      </Example>

      <Example title="three patterns">
        <ul>
          <li>
            <strong>Top k of a stream:</strong> keep a min-heap of the k largest seen so far; a new item replaces the root if it
            is larger. O(n log k) time and O(k) memory, for n items you never need to store.
          </li>
          <li>
            <strong>Merging k sorted lists:</strong> a heap holds the current head of each list; pop the smallest, push its
            successor. O(N log k) for N items in total. This is how external sorting merges sorted runs from disk.
          </li>
          <li>
            <strong>Running median:</strong> a max-heap of the smaller half and a min-heap of the larger half, kept within one
            item of each other in size; the median is at their tops.
          </li>
        </ul>
      </Example>

      <Remark title="heapsort, and what heaps cannot do">
        <p>
          Heapify, then pop n times, sorts in O(n log n) time with O(1) extra memory, though in practice it loses to quicksort
          and merge sort because its jumps around the array defeat the cache. A heap cannot search for an arbitrary item in less
          than O(n). Changing an item&rsquo;s priority therefore needs either a dict from item to array index, updated on every
          swap, or <strong>lazy deletion</strong>: push the item again with its new priority, and when an outdated entry is
          popped, skip it. Dijkstra&rsquo;s algorithm in chapter 6 uses the second.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "parent",
      rung: "check",
      prompt: <p>In an array-stored binary heap, what is the index of the parent of index 9?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "heapify",
      rung: "check",
      prompt: <p>What does bottom-up heapify cost on an array of n items?</p>,
      answer: { kind: "choice", options: ["Θ(n)", "Θ(n log n)", "Θ(log n)", "Θ(n²)"], correct: [0] },
    },
    {
      key: "height",
      rung: "apply",
      prompt: <p>A binary heap holds 100 items. What is its height, the number of edges on the longest root-to-leaf path?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "topk",
      rung: "apply",
      prompt: <p>To keep the 10 largest values of a long stream, which structure do you maintain?</p>,
      answer: { kind: "choice", options: ["A min-heap of size 10, evicting its root when a larger value arrives", "A max-heap of every value seen", "A max-heap of size 10", "A sorted list of every value seen"], correct: [0] },
    },
    {
      key: "swaps",
      rung: "apply",
      prompt: <p>A min-heap holds 31 items. At most how many swaps can a single pop make while sifting down?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq
h = []
for x in [5, 3, 8, 1, 9, 2]:
    heapq.heappush(h, x)
a = list(h)
b = [heapq.heappop(h) for _ in range(3)]
print(a, b, h)`}</Code>
          <p>Trace the sift-ups and sift-downs. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1, 3, 2, 5, 9, 8] [1, 2, 3] [5, 9, 8]", "[1, 2, 3, 5, 8, 9] [1, 2, 3] [5, 8, 9]", "[1, 3, 2, 5, 9, 8] [1, 2, 3] [5, 8, 9]", "[1, 3, 8, 5, 9, 2] [1, 2, 3] [5, 9, 8]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

def merge(lists):
    h = [(xs[0], i, 0) for i, xs in enumerate(lists) if xs]
    heapq.heapify(h)
    out = []
    while h:
        v, i, j = heapq.heappop(h)
        out.append((v, i))
        if j + 1 < len(lists[i]):
            heapq.heappush(h, (lists[i][j + 1], i, j + 1))
    return out

print(merge([[1, 4, 9], [2, 4], [], [0, 10]]))`}</Code>
          <p>A k-way merge, recording which list each value came from. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 3), (1, 0), (2, 1), (4, 0), (4, 1), (9, 0), (10, 3)]",
          "[(0, 3), (1, 0), (2, 1), (4, 1), (4, 0), (9, 0), (10, 3)]",
          "[(1, 0), (2, 1), (0, 3), (4, 0), (4, 1), (9, 0), (10, 3)]",
          "[(0, 3), (1, 0), (2, 1), (4, 0), (9, 0), (4, 1), (10, 3)]",
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
            Write a binary min-heap from scratch, as functions on a plain list <C>a</C>, comparing items only with{" "}
            <C>&lt;</C>. Write <C>sift_down(a, i)</C>, which moves <C>a[i]</C> down until it is no larger than its children:
            compare the two children with each other first, then the smaller child with the parent. Write <C>push(a, x)</C>,
            which appends x and moves it up past larger parents, and <C>pop(a)</C>, which removes and returns the smallest item
            (raising <C>IndexError</C> when empty) by moving the last item to the root and sifting it down. The
            starter&rsquo;s <C>heapify(a)</C> uses your <C>sift_down</C> to build a heap in O(n).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sift_down(a, i):
    pass

def push(a, x):
    a.append(x)
    a.sort()

def pop(a):
    return a.pop(0)

def heapify(a):
    for i in range(len(a) // 2 - 1, -1, -1):
        sift_down(a, i)
`,
        solution: `def sift_down(a, i):
    n = len(a)
    while 2 * i + 1 < n:
        c = 2 * i + 1
        if c + 1 < n and a[c + 1] < a[c]:
            c += 1
        if not a[c] < a[i]:
            return
        a[i], a[c] = a[c], a[i]
        i = c

def push(a, x):
    a.append(x)
    i = len(a) - 1
    while i > 0 and a[i] < a[(i - 1) // 2]:
        p = (i - 1) // 2
        a[i], a[p] = a[p], a[i]
        i = p

def pop(a):
    if not a:
        raise IndexError('pop from empty heap')
    top, last = a[0], a.pop()
    if a:
        a[0] = last
        sift_down(a, 0)
    return top

def heapify(a):
    for i in range(len(a) // 2 - 1, -1, -1):
        sift_down(a, i)
`,
        tests: [
          { name: "heap order", code: `import random
rng = random.Random(1)
a = []
xs = [rng.randint(0, 100) for _ in range(300)]
for x in xs:
    push(a, x)
    assert all(not a[i] < a[(i - 1) // 2] for i in range(1, len(a))), 'Every item must be at least its parent.'
assert a[0] == min(xs) and [pop(a) for _ in range(300)] == sorted(xs)
try:
    pop(a)
    assert False, 'An empty heap raises IndexError.'
except IndexError:
    pass` },
          { name: "heapify", code: `import random
class Counted:
    count = 0
    def __init__(self, v): self.v = v
    def __lt__(self, o):
        Counted.count += 1
        return self.v < o.v
rng = random.Random(2)
n = 2 ** 14 - 1
vals = [rng.random() for _ in range(n)]
a = [Counted(v) for v in vals]
heapify(a)
assert Counted.count <= 2 * n, f'{Counted.count} comparisons is not linear.'
assert all(not a[i] < a[(i - 1) // 2] for i in range(1, n))
assert [pop(a).v for _ in range(100)] == sorted(vals)[:100]` },
          { name: "mixed", code: `import random, heapq
rng = random.Random(3)
a, ref = [5, 1, 4], [5, 1, 4]
heapify(a); heapq.heapify(ref)
for _ in range(5000):
    if ref and rng.random() < 0.45:
        assert pop(a) == heapq.heappop(ref)
    else:
        x = rng.randint(-50, 50)
        push(a, x); heapq.heappush(ref, x)
    assert len(a) == len(ref) and (not ref or a[0] == ref[0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two streaming tools with <C>heapq</C>:</p>
          <ul>
            <li>
              <C>top_k(iterable, k, key=lambda x: x)</C> returns the k items with the largest keys, largest first, with ties
              going to the item that came earlier. It must not store or sort the whole stream: keep a min-heap of at most k
              entries <C>(key, -index, item)</C>-style so items themselves are never compared.
            </li>
            <li>
              <C>RunningMedian</C> with <C>add(x)</C> and <C>median()</C> (the middle value, or the mean of the two middle
              values as a float; <C>ValueError</C> if empty), each <C>add</C> O(log n), using a max-heap of the lower half and a
              min-heap of the upper half.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import heapq

def top_k(iterable, k, key=lambda x: x):
    return sorted(iterable, key=key, reverse=True)[:k]

class RunningMedian:
    def __init__(self):
        self.xs = []

    def add(self, x):
        self.xs.append(x)

    def median(self):
        return self.xs[len(self.xs) // 2]
`,
        solution: `import heapq

def top_k(iterable, k, key=lambda x: x):
    if k <= 0:
        return []
    h = []
    for i, item in enumerate(iterable):
        entry = (key(item), -i, item)
        if len(h) < k:
            heapq.heappush(h, (entry[0], entry[1], i, item))
        elif (entry[0], entry[1]) > (h[0][0], h[0][1]):
            heapq.heapreplace(h, (entry[0], entry[1], i, item))
    h.sort(key=lambda e: (-e[0], e[2]))
    return [e[3] for e in h]

class RunningMedian:
    def __init__(self):
        self.lo = []   # max-heap of the lower half, as negatives
        self.hi = []   # min-heap of the upper half

    def add(self, x):
        if self.lo and x > -self.lo[0]:
            heapq.heappush(self.hi, x)
        else:
            heapq.heappush(self.lo, -x)
        if len(self.lo) > len(self.hi) + 1:
            heapq.heappush(self.hi, -heapq.heappop(self.lo))
        elif len(self.hi) > len(self.lo):
            heapq.heappush(self.lo, -heapq.heappop(self.hi))

    def median(self):
        if not self.lo:
            raise ValueError('no data')
        if len(self.lo) > len(self.hi):
            return -self.lo[0]
        return (-self.lo[0] + self.hi[0]) / 2
`,
        tests: [
          { name: "top k", code: `words = ['bb', 'a', 'ccc', 'dd', 'e', 'fff', 'gg']
assert top_k(words, 3, key=len) == ['ccc', 'fff', 'bb'], 'Ties go to the earlier item.'
assert top_k([3, 1, 2], 5) == [3, 2, 1] and top_k([1, 2], 0) == []
assert top_k([{'s': 1}, {'s': 3}, {'s': 3}], 2, key=lambda d: d['s']) == [{'s': 3}, {'s': 3}], 'Never compare the items themselves.'
import random
rng = random.Random(4)
for _ in range(200):
    xs = [rng.randint(0, 9) for _ in range(rng.randint(0, 20))]
    k = rng.randint(0, 8)
    want = [x for _, x in sorted(enumerate(xs), key=lambda p: (-p[1], p[0]))][:k]
    assert top_k(xs, k) == want` },
          { name: "stream", code: `import time
def stream():
    x = 1
    for _ in range(300000):
        x = (x * 1103515245 + 12345) % 2147483648
        yield x
t = time.time()
got = top_k(stream(), 5)
assert got == sorted(stream(), reverse=True)[:5]
assert time.time() - t < 4` },
          { name: "median", code: `import random, statistics
m = RunningMedian()
try:
    m.median()
    assert False, 'Empty raises ValueError.'
except ValueError:
    pass
rng = random.Random(5)
xs = []
for _ in range(2000):
    x = rng.randint(-100, 100)
    xs.append(x); m.add(x)
    assert m.median() == statistics.median(xs)` },
        ],
      },
    },
    {
      key: "linear",
      rung: "prove",
      prompt: <p>Prove that bottom-up heapify on n items makes O(n) swaps, by counting nodes at each height and summing.</p>,
      answer: {
        kind: "written",
        rubric: [
          "A node of height h sifts down at most h levels, so at most h swaps.",
          "There are at most ⌈n/2^{h+1}⌉ nodes of height h in a complete binary tree.",
          "The total is at most Σ_h h·⌈n/2^{h+1}⌉ ≤ n Σ h/2^{h+1} + O(log² n).",
          "Uses Σ_{h≥0} h/2^h = 2 to conclude the total is at most about n swaps, O(n).",
        ],
      },
    },
    {
      key: "dary",
      rung: "stretch",
      prompt: (
        <p>
          A d-ary heap gives each node d children. Find the cost of push, pop and decrease-key in terms of n and d, and explain
          why a large d suits an algorithm that does many more decrease-keys than pops, such as Dijkstra&rsquo;s on a dense
          graph.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "The height is log_d n.",
          "Push and decrease-key sift up, one comparison per level: O(log_d n).",
          "Pop sifts down, comparing all d children per level: O(d log_d n).",
          "With E decrease-keys and V pops, total O(E log_d V + V d log_d V); choosing d ≈ E/V balances the terms and makes decrease-keys cheap on dense graphs.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a heap finds the minimum in O(1) and inserts in O(log n) while keeping only partial order, and how to keep the top 10 of a stream with a heap of size 10.",

  glimpse: (
    <p>
      Heaps run the selection algorithms of chapter 5, Dijkstra&rsquo;s shortest paths and Prim&rsquo;s spanning trees in chapter
      6, and the beam search of chapter 7, which keeps the best k partial sequences at each step. Operating systems schedule
      processes with priority queues, and inference servers use them to pick which request to serve next.
    </p>
  ),
};
