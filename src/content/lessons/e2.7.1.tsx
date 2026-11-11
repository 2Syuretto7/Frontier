import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RecursionTreeViz } from "@/components/viz/RecursionTreeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.7.1",
  minutes: 60,
  links: {
    requires: ["e2.5.1", "e2.1.1"],
    revisits: ["m4.2.2", "e2.5.3"],
    foreshadows: ["e2.7.3", "e2.8.2"],
  },

  puzzle: (
    <>
      <p>
        In 1960 Kolmogorov conjectured that multiplying two n-digit numbers needs about n² digit operations, the way it is
        taught in school. Within a week of hearing this, a 23-year-old student, Anatoly Karatsuba, found a way to do it in about
        n<sup>1.585</sup>. The trick was to split each number in half and get away with three half-size products instead of
        four. Why does saving one multiplication out of four change the exponent, and where else does the same idea pay?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Divide and conquer splits a problem into smaller copies of itself, solves those recursively, and combines the answers.
        Its cost is set by a contest between two forces: the number of subproblems, which multiplies at every level, and their
        size, which shrinks. Draw the recursion tree and add up the work level by level. If the work per level shrinks, the top
        level dominates; if it grows, the leaves dominate; if it stays level, you pay that amount once per level, a log factor.
        Try the presets: four half-size products cost n², three cost n<sup>1.585</sup>.
      </p>
      <RecursionTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the pattern">
        <p>
          A divide-and-conquer algorithm on input of size n makes a recursive calls on inputs of size n/b and spends{" "}
          <M>{"O(n^d)"}</M> dividing and combining, so <M>{"T(n) = aT(n/b) + O(n^d)"}</M>. Level i of the recursion tree has{" "}
          <M>{"a^i"}</M> calls on size <M>{"n/b^i"}</M>, doing <M>{"n^d (a/b^d)^i"}</M> work in all: a geometric series with
          ratio <M>{"a/b^d"}</M>. That ratio decides the master theorem of E2.1.1: below 1 the first term wins,{" "}
          <M>{"\\Theta(n^d)"}</M>; equal to 1, every level ties, <M>{"\\Theta(n^d \\log n)"}</M>; above 1 the last level wins,{" "}
          <M>{"\\Theta(n^{\\log_b a})"}</M>.
        </p>
      </Definition>

      <Theorem title="Karatsuba multiplication">
        <p>
          Two n-digit numbers can be multiplied with <M>{"O(n^{\\log_2 3}) \\approx O(n^{1.585})"}</M> digit operations.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"x = x_1 B + x_0"}</M> and <M>{"y = y_1 B + y_0"}</M> with <M>{"B = 10^{n/2}"}</M>. Then{" "}
          <M>{"xy = x_1 y_1 B^2 + (x_1 y_0 + x_0 y_1) B + x_0 y_0"}</M>, which looks like four half-size products. But{" "}
          <M>{"x_1 y_0 + x_0 y_1 = (x_1 + x_0)(y_1 + y_0) - x_1 y_1 - x_0 y_0"}</M>, so three products suffice:{" "}
          <M>{"x_1y_1"}</M>, <M>{"x_0y_0"}</M> and <M>{"(x_1+x_0)(y_1+y_0)"}</M>. The additions, subtractions and shifts cost
          O(n). So <M>{"T(n) = 3T(n/2) + O(n)"}</M>; since 3 &gt; 2¹ the leaves dominate and{" "}
          <M>{"T(n) = \\Theta(n^{\\log_2 3})"}</M>. (The sums can have one extra digit, which changes only constants.)
        </p>
      </Proof>

      <Example title="counting inversions">
        <p>
          An inversion is a pair i &lt; j with a[i] &gt; a[j]; it measures how far a list is from sorted, and two rankings
          disagree on exactly the inversions between them (Kendall&rsquo;s tau). Checking all pairs is O(n²). Instead, count
          inversions within each half recursively, then count the pairs that cross while merging: whenever an item from the
          right half is taken before items still waiting in the left half, it forms an inversion with each of them. Merge sort
          does the rest, so the whole count is O(n log n).
        </p>
        <Code>{`if left[i] <= right[j]:
    merged.append(left[i]); i += 1
else:
    merged.append(right[j]); j += 1
    cross += len(left) - i       # right[j] is smaller than all of left[i:]`}</Code>
      </Example>

      <Example title="closest pair of points">
        <p>
          Sort points by x and split at the median line. Recursively find the closest distance d on each side. A closer pair
          must straddle the line, so both points lie in a strip of width 2d. Sorted by y, each strip point needs comparing only
          with the next 7: any more would put two points of one side closer than d. Keeping lists sorted by y while merging
          gives <M>{"T(n) = 2T(n/2) + O(n) = O(n \\log n)"}</M>.
        </p>
      </Example>

      <Remark title="further">
        <p>
          Strassen multiplies matrices with 7 half-size products instead of 8, <M>{"O(n^{2.807})"}</M>; in practice blocked
          (tiled) matrix multiplication, which splits for the cache rather than to save products, is how GPUs and BLAS
          libraries reach their speed. The fast Fourier transform splits a polynomial into even and odd coefficients, giving{" "}
          <M>{"O(n \\log n)"}</M> multiplication of polynomials and of very large integers. Divide and conquer also parallelises
          naturally: the two halves are independent.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "case",
      rung: "check",
      prompt: <p>Which bound solves T(n) = 2T(n/2) + O(n)?</p>,
      answer: { kind: "choice", options: ["Θ(n log n)", "Θ(n)", "Θ(n²)", "Θ(n^1.585)"], correct: [0] },
    },
    {
      key: "four",
      rung: "apply",
      prompt: <p>Splitting each number in half and computing all four products gives T(n) = 4T(n/2) + O(n). What is the exponent k in T(n) = Θ(nᵏ)?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "strassen",
      rung: "apply",
      prompt: <p>Strassen&rsquo;s recurrence is T(n) = 7T(n/2) + O(n²). Give the exponent of n in its running time, to three decimal places.</p>,
      answer: { kind: "numeric", value: 2.807, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def sort_count(a):
    if len(a) <= 1:
        return a, 0
    mid = len(a) // 2
    left, x = sort_count(a[:mid])
    right, y = sort_count(a[mid:])
    merged, i, j, cross = [], 0, 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            merged.append(left[i]); i += 1
        else:
            merged.append(right[j]); j += 1
            cross += len(left) - i
    merged += left[i:] + right[j:]
    return merged, x + y + cross

print(sort_count([3, 1, 4, 1, 5, 9, 2, 6])[1], sort_count([5, 4, 3, 2, 1])[1], sort_count([2, 2, 2])[1])`}</Code>
          <p>Counting inversions while merging. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8 10 0", "8 10 3", "7 10 0", "8 9 0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`calls = 0

def karatsuba(x, y):
    global calls
    if x < 10 or y < 10:
        calls += 1
        return x * y
    m = max(len(str(x)), len(str(y))) // 2
    hx, lx = divmod(x, 10 ** m)
    hy, ly = divmod(y, 10 ** m)
    a = karatsuba(hx, hy)
    b = karatsuba(lx, ly)
    c = karatsuba(hx + lx, hy + ly)
    return a * 10 ** (2 * m) + (c - a - b) * 10 ** m + b

print(karatsuba(1234, 5678), calls)`}</Code>
          <p>Karatsuba in base 10, counting the single-digit products at the leaves. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7006652 11", "7006652 9", "7006652 16", "7006652 27"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_inversions(a)</C>, the number of pairs i &lt; j with a[i] &gt; a[j], in O(n log n) without changing
            a, and <C>max_subarray(a)</C>, the largest sum of a non-empty run of consecutive items, by divide and conquer
            (<C>ValueError</C> for an empty list). For the second, have each call return four numbers about its range: the best
            sum inside it, the best prefix sum, the best suffix sum and the total; then combine two ranges in O(1).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_inversions(a):
    return sum(1 for i in range(len(a) - 1) if a[i] > a[i + 1])

def max_subarray(a):
    return max(a)
`,
        solution: `def count_inversions(a):
    def go(lo, hi):
        if hi - lo <= 1:
            return a[lo:hi], 0
        mid = (lo + hi) // 2
        left, x = go(lo, mid)
        right, y = go(mid, hi)
        merged, i, j, cross = [], 0, 0, 0
        while i < len(left) and j < len(right):
            if left[i] <= right[j]:
                merged.append(left[i]); i += 1
            else:
                merged.append(right[j]); j += 1
                cross += len(left) - i
        merged += left[i:]
        merged += right[j:]
        return merged, x + y + cross
    return go(0, len(a))[1]

def max_subarray(a):
    if not a:
        raise ValueError('empty list')
    def go(lo, hi):                      # returns (best, prefix, suffix, total)
        if hi - lo == 1:
            v = a[lo]
            return v, v, v, v
        mid = (lo + hi) // 2
        b1, p1, s1, t1 = go(lo, mid)
        b2, p2, s2, t2 = go(mid, hi)
        return max(b1, b2, s1 + p2), max(p1, t1 + p2), max(s2, s1 + t2), t1 + t2
    return go(0, len(a))[0]
`,
        tests: [
          { name: "inversions", code: `assert count_inversions([3, 1, 4, 1, 5, 9, 2, 6]) == 8
assert count_inversions([]) == 0 and count_inversions([2, 2, 2]) == 0 and count_inversions([5, 4, 3, 2, 1]) == 10
import random, time
rng = random.Random(23)
for _ in range(300):
    a = [rng.randint(0, 9) for _ in range(rng.randint(0, 25))]
    assert count_inversions(a) == sum(a[i] > a[j] for i in range(len(a)) for j in range(i + 1, len(a))), a
a = list(range(100000, 0, -1))
b = list(a)
start = time.perf_counter()
assert count_inversions(a) == 100000 * 99999 // 2
assert a == b, 'Do not modify the input.'
assert time.perf_counter() - start < 10, 'Too slow: count while merging.'` },
          { name: "maximum subarray", code: `assert max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]) == 6
assert max_subarray([-3, -1, -2]) == -1, 'The subarray must be non-empty.'
assert max_subarray([5]) == 5 and max_subarray([2, -1, 2]) == 3
try:
    max_subarray([])
    assert False, 'Empty input raises ValueError.'
except ValueError:
    pass
import random
rng = random.Random(24)
for _ in range(300):
    a = [rng.randint(-9, 9) for _ in range(rng.randint(1, 20))]
    assert max_subarray(a) == max(sum(a[i:j]) for i in range(len(a)) for j in range(i + 1, len(a) + 1)), a
a = [rng.randint(-100, 100) for _ in range(100000)]
best = cur = a[0]
for x in a[1:]:
    cur = max(x, cur + x)
    best = max(best, cur)
assert max_subarray(a) == best` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two harder merges:</p>
          <ul>
            <li>
              <C>closest_pair(points)</C>: the smallest distance between two of the given <C>(x, y)</C> points (0 if two
              coincide), in O(n log n) with the strip argument; <C>ValueError</C> for fewer than two points. 20,000 random
              points must be quick.
            </li>
            <li>
              <C>count_smaller_after(a)</C>: a list whose i-th entry is the number of j &gt; i with a[j] &lt; a[i], in O(n log
              n). Merge sort the positions, not the values, so you know whose count to increase.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def closest_pair(points):
    p = sorted(points)
    return min(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))

def count_smaller_after(a):
    return [0] * len(a)
`,
        solution: `import math

def closest_pair(points):
    if len(points) < 2:
        raise ValueError('need two points')
    px = sorted(points)
    def go(p):                               # p sorted by x; returns (d, p sorted by y)
        n = len(p)
        if n <= 3:
            d = min((math.dist(p[i], p[j]) for i in range(n) for j in range(i + 1, n)), default=math.inf)
            return d, sorted(p, key=lambda q: q[1])
        mid = n // 2
        xm = p[mid][0]
        d1, ly = go(p[:mid])
        d2, ry = go(p[mid:])
        d = min(d1, d2)
        merged, i, j = [], 0, 0
        while i < len(ly) and j < len(ry):
            if ly[i][1] <= ry[j][1]:
                merged.append(ly[i]); i += 1
            else:
                merged.append(ry[j]); j += 1
        merged += ly[i:] + ry[j:]
        strip = [q for q in merged if abs(q[0] - xm) < d]
        for i in range(len(strip)):
            for j in range(i + 1, min(i + 8, len(strip))):
                if strip[j][1] - strip[i][1] >= d:
                    break
                d = min(d, math.dist(strip[i], strip[j]))
        return d, merged
    return go(px)[0]

def count_smaller_after(a):
    n = len(a)
    counts = [0] * n
    def go(idx):                             # idx: positions, returned sorted by value
        if len(idx) <= 1:
            return idx
        mid = len(idx) // 2
        left, right = go(idx[:mid]), go(idx[mid:])
        merged, j = [], 0
        for i in left:
            while j < len(right) and a[right[j]] < a[i]:
                merged.append(right[j]); j += 1
            counts[i] += j
            merged.append(i)
        merged += right[j:]
        return merged
    go(list(range(n)))
    return counts
`,
        tests: [
          { name: "closest pair", code: `import math, random, time
assert closest_pair([(0, 0), (3, 4), (10, 0)]) == 5.0
assert closest_pair([(0, 0), (5, 1), (0, 10), (5.5, 9), (1, 4)]) == math.dist((0, 0), (1, 4))
assert closest_pair([(0, 0), (1, 100), (2, 0)]) == 2.0, 'Neighbours in x are not always closest.'
assert closest_pair([(1, 1), (1, 1), (5, 5)]) == 0.0
try:
    closest_pair([(0, 0)])
    assert False, 'One point raises ValueError.'
except ValueError:
    pass
rng = random.Random(25)
for _ in range(200):
    pts = [(rng.randint(0, 30), rng.randint(0, 30)) for _ in range(rng.randint(2, 25))]
    want = min(math.dist(pts[i], pts[j]) for i in range(len(pts)) for j in range(i + 1, len(pts)))
    assert math.isclose(closest_pair(pts), want, abs_tol=1e-12), pts
pts = [(rng.random(), rng.random()) for _ in range(20000)]
start = time.perf_counter()
got = closest_pair(pts)
assert time.perf_counter() - start < 15, 'Too slow for 20,000 points: divide and conquer.'
grid = {}
for p in pts:
    grid.setdefault((int(p[0] * 200), int(p[1] * 200)), []).append(p)
best = math.inf
for (gx, gy), cell in grid.items():
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            for q in grid.get((gx + dx, gy + dy), []):
                for p in cell:
                    if p != q:
                        best = min(best, math.dist(p, q))
assert math.isclose(got, best), (got, best)` },
          { name: "smaller after", code: `assert count_smaller_after([5, 2, 6, 1]) == [2, 1, 1, 0]
assert count_smaller_after([]) == [] and count_smaller_after([3, 3, 3]) == [0, 0, 0]
import random, time
rng = random.Random(26)
for _ in range(300):
    a = [rng.randint(0, 9) for _ in range(rng.randint(0, 20))]
    assert count_smaller_after(a) == [sum(a[j] < a[i] for j in range(i + 1, len(a))) for i in range(len(a))], a
a = [rng.randint(0, 10 ** 6) for _ in range(50000)]
start = time.perf_counter()
c = count_smaller_after(a)
assert time.perf_counter() - start < 15, 'Too slow: count while merging.'
assert c[-1] == 0 and c[0] == sum(x < a[0] for x in a[1:]) and c[25000] == sum(x < a[25000] for x in a[25001:])` },
        ],
      },
    },
    {
      key: "levels",
      rung: "prove",
      prompt: <p>Using the recursion tree, prove that T(n) = aT(n/b) + n^d with a &gt; b^d is Θ(n^(log_b a)) for n a power of b.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Level i has aⁱ subproblems of size n/bⁱ, so its work is n^d (a/b^d)ⁱ.",
          "There are log_b n + 1 levels, and the series is geometric with ratio r = a/b^d > 1.",
          "The sum is within a constant factor (depending on r) of its last term, n^d r^(log_b n).",
          "Simplifies n^d (a/b^d)^(log_b n) = a^(log_b n) = n^(log_b a).",
        ],
      },
    },
    {
      key: "strip",
      rung: "stretch",
      prompt: <p>In the closest-pair algorithm, prove that each point in the strip needs comparing only with a constant number of the points that follow it in y order.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers a d × 2d rectangle in the strip starting at the point's y and spanning both sides of the dividing line.",
          "Splits it into eight d/2 × d/2 squares, four on each side of the line.",
          "Each square holds at most one point, since two points in one square would be on the same side at distance at most d/√2 < d.",
          "So at most 7 other points lie within distance d above it in y order, and later points are farther than d in y.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how Karatsuba multiplies with three half-size products instead of four, and why that changes n² into n to the 1.585.",

  glimpse: (
    <p>
      Divide and conquer works when the subproblems are independent. When they overlap, solving each once and remembering the
      answer is dynamic programming; and sometimes no splitting is needed at all, because the best local choice is always
      safe, which is where we go next.
    </p>
  ),
};
