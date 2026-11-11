import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PartitionStepViz } from "@/components/viz/PartitionStepViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.5.1",
  minutes: 65,
  links: {
    requires: ["e2.1.1", "e2.4.1"],
    revisits: ["m4.5.3", "m4.5.1"],
    foreshadows: ["e2.5.3", "e2.7.1"],
  },

  puzzle: (
    <>
      <p>
        Merge sort always takes O(n log n) time. Quicksort takes Θ(n²) on bad inputs, yet for decades it was the default sort of
        C libraries and it is still the basis of the sort in C++ and NumPy. Python&rsquo;s own <C>sorted</C> is neither: it is a
        merge sort that finishes an already sorted list in one pass. What does each design buy, and what does it cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Merge sort does the easy split (cut in half) and the hard combine (merge). Quicksort does the hard split (partition
        around a pivot, so everything left is smaller) and has no combine at all: once both sides are sorted, so is the whole.
        Partitioning happens in place with two pointers marching through contiguous memory, which is very fast. The danger is
        a bad pivot. Step through a partition below; with the sorted input the pivot is the largest item and the split is as
        lopsided as possible.
      </p>
      <PartitionStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="quicksort">
        <p>
          To sort a[lo … hi]: choose a pivot, <strong>partition</strong> so that items less than the pivot come before it and
          the rest after, then sort the two sides recursively. The Lomuto partition keeps an index i such that a[lo … i − 1] are
          less than the pivot, scanning j from lo to hi − 1 and swapping a[j] to position i when it is smaller; finally it swaps
          the pivot (kept at a[hi]) into position i.
        </p>
        <Code>{`def partition(a, lo, hi):
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i`}</Code>
      </Definition>

      <Theorem title="the cost of quicksort">
        <p>
          In the worst case, every pivot is the smallest or largest item and quicksort makes{" "}
          <M>{"n(n-1)/2"}</M> comparisons. With the pivot chosen uniformly at random, the expected number of comparisons on any
          input of distinct items is <M>{"2(n+1)H_n - 4n \\approx 2n\\ln n \\approx 1.39\\,n\\log_2 n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let the items in sorted order be <M>{"z_1 < \\dots < z_n"}</M>. Items <M>{"z_i"}</M> and <M>{"z_j"}</M> (i &lt; j)
          are compared exactly when one of them is the first pivot chosen from <M>{"z_i, \\dots, z_j"}</M>: until then they stay
          on the same side, and a pivot strictly between them separates them for ever. Each of these j − i + 1 items is equally
          likely to be first, so the probability is <M>{"2/(j - i + 1)"}</M>. Summing over pairs,{" "}
          <M>{"\\sum_{i<j} \\frac{2}{j-i+1} \\le 2n \\sum_{k=2}^{n} \\frac1k < 2nH_n"}</M>. This is the same argument as for the
          depth of a random binary search tree, and no accident: quicksort&rsquo;s pivots form exactly such a tree.
        </p>
      </Proof>

      <Remark title="making quicksort robust">
        <ul>
          <li><strong>Random pivots</strong> make the bad case a matter of bad luck, not bad input.</li>
          <li>
            <strong>Three-way partitioning</strong> (less, equal, greater) stops runs of equal keys from producing lopsided
            splits; an array of identical items then takes one pass.
          </li>
          <li>
            <strong>Recurse on the smaller side and loop on the larger</strong> keeps the stack O(log n) even in the worst case.
          </li>
          <li>
            <strong>Introsort</strong> (C++&rsquo;s <C>std::sort</C>) switches to heapsort if recursion gets too deep, and to
            insertion sort for tiny ranges, guaranteeing O(n log n).
          </li>
        </ul>
      </Remark>

      <Definition title="stability">
        <p>
          A sort is <strong>stable</strong> if items with equal keys keep their original order. Merge sort is stable when the
          merge takes from the left run on ties; quicksort and heapsort are not. Stability lets you sort by several keys in
          passes, least significant key first: sort by date, then stably by customer, and each customer&rsquo;s rows stay in date
          order.
        </p>
      </Definition>

      <Example title="Timsort">
        <p>
          Python&rsquo;s <C>list.sort</C> and <C>sorted</C> use Timsort: it finds runs that are already ascending (reversing
          strictly descending ones), extends short runs with insertion sort, and merges runs pairwise with a stable merge, keeping
          a stack of run lengths balanced so that merges stay cheap. Real data is often partly sorted, so Timsort is often much
          faster than n log n: on sorted input it makes n − 1 comparisons. It is stable, and it is O(n log n) in the worst case.
        </p>
      </Example>

      <Remark title="beating n log n">
        <p>
          Any sort that learns about items only by comparing them needs at least <M>{"\\log_2 n! \\approx n\\log_2 n"}</M>{" "}
          comparisons in the worst case, as M4 showed. Sorts that look inside the keys escape this bound. Counting sort places
          integers in a range of size k in O(n + k). Radix sort applies a stable counting sort to each digit, least significant
          first: 32-bit integers with 8-bit digits take four passes, O(n) in all. GPUs sort keys for things like top-k sampling
          and mixture-of-experts routing this way.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stable",
      rung: "check",
      prompt: <p>Which of these sorts is stable as usually implemented?</p>,
      answer: { kind: "choice", options: ["Merge sort", "Quicksort", "Heapsort", "Selection sort with swaps"], correct: [0] },
    },
    {
      key: "worst",
      rung: "check",
      prompt: <p>Quicksort with the last item as pivot is run on 10 items already in sorted order. How many comparisons does it make?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "pivot-pos",
      rung: "apply",
      prompt: <p>The Lomuto partition is run on <C>[3, 8, 2, 5, 1, 4, 7, 6]</C> with pivot 6. At what index does the pivot end up?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "timsort",
      rung: "apply",
      prompt: <p>How many comparisons does Python&rsquo;s sort make on a list of n items that is already sorted?</p>,
      answer: { kind: "choice", options: ["n − 1", "about n log₂ n", "n(n − 1)/2", "0"], correct: [0] },
    },
    {
      key: "radix",
      rung: "apply",
      prompt: <p>Least-significant-digit radix sort on 32-bit unsigned integers uses 8-bit digits. How many counting-sort passes does it make?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`comps = 0

def partition(a, lo, hi):
    global comps
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        comps += 1
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]
    return i

def quicksort(a, lo, hi):
    if lo < hi:
        p = partition(a, lo, hi)
        quicksort(a, lo, p - 1)
        quicksort(a, p + 1, hi)

a = [3, 8, 2, 5, 1, 4, 7, 6]
p = partition(a, 0, 7)
b = list(range(1, 9))
quicksort(b, 0, 7)
print(p, a, comps - 7)`}</Code>
          <p>One partition of a shuffled array, then a full quicksort of a sorted one. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 [3, 2, 5, 1, 4, 6, 7, 8] 28", "5 [3, 2, 5, 1, 4, 6, 8, 7] 28", "5 [3, 2, 5, 1, 4, 6, 7, 8] 13", "4 [3, 2, 5, 1, 6, 4, 7, 8] 28"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`recs = [("b", 2), ("a", 1), ("b", 1), ("a", 2)]
by_num = sorted(recs, key=lambda r: r[1])
both = sorted(by_num, key=lambda r: r[0])
print(both, sorted(recs, key=lambda r: r[0])[1])`}</Code>
          <p>Python&rsquo;s sort is stable. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[('a', 1), ('a', 2), ('b', 1), ('b', 2)] ('a', 2)", "[('a', 2), ('a', 1), ('b', 2), ('b', 1)] ('a', 1)", "[('a', 1), ('a', 2), ('b', 1), ('b', 2)] ('a', 1)", "[('a', 1), ('b', 1), ('a', 2), ('b', 2)] ('a', 2)"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>quicksort(a, seed=0)</C>, sorting the list a in place and returning nothing. Choose each pivot uniformly at
            random with <C>random.Random(seed)</C>, partition three ways (less than, equal to, greater than the pivot, using only{" "}
            <C>&lt;</C>), and recurse on the smaller of the two unequal parts while looping on the larger, so the recursion
            depth stays O(log n). It must handle sorted input, reversed input and long runs of equal items quickly.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import random

def quicksort(a, seed=0):
    pass
`,
        solution: `import random

def quicksort(a, seed=0):
    rng = random.Random(seed)

    def sort(lo, hi):
        while lo < hi:
            p = a[rng.randint(lo, hi)]
            lt, i, gt = lo, lo, hi
            while i <= gt:
                if a[i] < p:
                    a[lt], a[i] = a[i], a[lt]
                    lt += 1
                    i += 1
                elif p < a[i]:
                    a[i], a[gt] = a[gt], a[i]
                    gt -= 1
                else:
                    i += 1
            if lt - lo < hi - gt:
                sort(lo, lt - 1)
                lo = gt + 1
            else:
                sort(gt + 1, hi)
                hi = lt - 1

    sort(0, len(a) - 1)
`,
        tests: [
          { name: "sorts", code: `import random
rng = random.Random(1)
for n in range(0, 30):
    xs = [rng.randint(0, 9) for _ in range(n)]
    a = list(xs)
    assert quicksort(a, n) is None and a == sorted(xs), xs` },
          { name: "hard inputs", code: `import time, sys
old = sys.getrecursionlimit()
sys.setrecursionlimit(250)
t = time.time()
for xs in [list(range(60000)), list(range(60000, 0, -1)), [7] * 60000, [i % 3 for i in range(60000)]]:
    a = list(xs)
    quicksort(a, 5)
    assert a == sorted(xs)
sys.setrecursionlimit(old)
assert time.time() - t < 6, 'Random pivots and a three-way partition keep these fast.'` },
          { name: "only less-than", code: `class K:
    def __init__(self, v): self.v = v
    def __lt__(self, o): return self.v < o.v
    def __eq__(self, o): raise AssertionError('Compare with < only.')
    def __gt__(self, o): raise AssertionError('Compare with < only.')
import random
rng = random.Random(2)
vals = [rng.randint(0, 50) for _ in range(500)]
a = [K(v) for v in vals]
quicksort(a, 3)
assert [k.v for k in a] == sorted(vals)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>merge_sort(xs, key=None)</C>, a stable, bottom-up (non-recursive) merge sort returning a new list: start with
            runs of length 1 and merge neighbouring runs of width 1, 2, 4, …, taking from the left run on ties. Then write{" "}
            <C>count_inversions(xs)</C>, the number of pairs i &lt; j with xs[i] &gt; xs[j], in O(n log n) by counting, during each
            merge, how many items of the left run each item of the right run jumps over.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def merge_sort(xs, key=None):
    return list(xs)

def count_inversions(xs):
    return 0
`,
        solution: `def _merge_pass(src, width, key):
    out, n = [], len(src)
    for lo in range(0, n, 2 * width):
        mid, hi = min(lo + width, n), min(lo + 2 * width, n)
        i, j = lo, mid
        while i < mid and j < hi:
            if key(src[j]) < key(src[i]):
                out.append(src[j]); j += 1
            else:
                out.append(src[i]); i += 1
        out.extend(src[i:mid])
        out.extend(src[j:hi])
    return out

def merge_sort(xs, key=None):
    key = key or (lambda x: x)
    a, width = list(xs), 1
    while width < len(a):
        a = _merge_pass(a, width, key)
        width *= 2
    return a

def count_inversions(xs):
    a, width, inv = list(xs), 1, 0
    n = len(a)
    while width < n:
        out = []
        for lo in range(0, n, 2 * width):
            mid, hi = min(lo + width, n), min(lo + 2 * width, n)
            i, j = lo, mid
            while i < mid and j < hi:
                if a[j] < a[i]:
                    out.append(a[j]); j += 1
                    inv += mid - i
                else:
                    out.append(a[i]); i += 1
            out.extend(a[i:mid])
            out.extend(a[j:hi])
        a, width = out, width * 2
    return inv
`,
        tests: [
          { name: "sorts stably", code: `recs = [("b", 2), ("a", 1), ("b", 1), ("a", 2), ("c", 0), ("a", 0)]
assert merge_sort(recs, key=lambda r: r[0]) == sorted(recs, key=lambda r: r[0]), 'Equal keys keep their order.'
import random
rng = random.Random(4)
for n in range(0, 40):
    xs = [rng.randint(0, 5) for _ in range(n)]
    assert merge_sort(xs) == sorted(xs)
    pairs = [(x, i) for i, x in enumerate(xs)]
    assert merge_sort(pairs, key=lambda p: p[0]) == sorted(pairs, key=lambda p: p[0])
data = [3, 1, 2]
merge_sort(data)
assert data == [3, 1, 2], 'Return a new list.'` },
          { name: "no recursion", code: `import sys
old = sys.getrecursionlimit()
sys.setrecursionlimit(120)
try:
    xs = list(range(5000, 0, -1))
    assert merge_sort(xs) == sorted(xs) and count_inversions(xs) == 5000 * 4999 // 2
finally:
    sys.setrecursionlimit(old)` },
          { name: "inversions", code: `import random, time
rng = random.Random(5)
for n in range(0, 30):
    xs = [rng.randint(0, 6) for _ in range(n)]
    assert count_inversions(xs) == sum(xs[i] > xs[j] for i in range(n) for j in range(i + 1, n)), xs
big = [rng.random() for _ in range(100000)]
t = time.time()
inv = count_inversions(big)
assert 0.45 < inv / (100000 * 99999 / 2) < 0.55 and time.time() - t < 6` },
        ],
      },
    },
    {
      key: "expected",
      rung: "prove",
      prompt: <p>Prove that randomised quicksort makes fewer than 2nH<sub>n</sub> comparisons in expectation on n distinct items, where H<sub>n</sub> = 1 + 1/2 + … + 1/n.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the count as a sum of indicators X_ij over pairs z_i < z_j of the sorted items, using linearity of expectation.",
          "Shows z_i and z_j are compared if and only if one of them is the first pivot chosen from z_i, …, z_j.",
          "Each of those j − i + 1 items is equally likely to be first, so P(X_ij = 1) = 2/(j − i + 1).",
          "Sums: Σ_i Σ_{k=2}^{n−i+1} 2/k < 2n H_n.",
        ],
      },
    },
    {
      key: "equal-keys",
      rung: "stretch",
      prompt: (
        <p>
          Show that quicksort with the two-way Lomuto partition takes Θ(n²) time on an array of n equal items, even with random
          pivots, and that with a three-way partition it takes Θ(n). Then argue that with three-way partitioning and random
          pivots, an array with only k distinct values takes O(n log k) expected time.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "With all items equal, Lomuto puts nothing on the left (no item is less than the pivot), so each call removes only the pivot: Σ (n − i) = Θ(n²).",
          "Three-way partition puts every item in the equal part in one pass of n − 1 comparisons, and both recursive calls are empty: Θ(n).",
          "With k distinct values, each partition removes every copy of the pivot's value; the recursion acts like quicksort on the k distinct values.",
          "Each level of the recursion costs O(n) and the expected depth in distinct values is O(log k), giving O(n log k).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why quicksort is usually fast but can be quadratic, how random pivots and three-way partitioning fix that, and why stability matters when sorting by several keys.",

  glimpse: (
    <p>
      Binary search, next, is what sorted data makes possible. Partitioning returns in selection, finding the k-th smallest item
      in expected linear time without sorting at all. And the divide-and-conquer pattern of merge sort and quicksort is the first
      of the algorithm design paradigms of chapter 7.
    </p>
  ),
};
