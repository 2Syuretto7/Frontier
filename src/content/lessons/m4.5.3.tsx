import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { MergeTreeViz } from "@/components/viz/MergeTreeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.5.3",
  minutes: 65,
  links: {
    requires: ["m4.5.2", "m4.2.2"],
    foreshadows: ["e2.5.1", "e2.7.1"],
  },

  puzzle: (
    <>
      <p>
        Insertion sort needs about 500 billion comparisons for a million items. Merge sort needs about 20 million. Where do
        the savings come from? Merge sort does nothing clever: it sorts each half and merges.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Splitting a problem in half and solving each half recursively creates a tree of subproblems. If combining the halves
        costs n, every level of the tree costs n in total, and halving gives only about <M>{"\\log_2 n"}</M> levels. Grow n
        below and compare the total with insertion sort.
      </p>
      <MergeTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recursion and divide and conquer">
        <p>
          A <strong>recursive</strong> algorithm solves an input by solving smaller inputs of the same problem, down to base
          cases solved directly. <strong>Divide and conquer</strong> splits an input into parts, solves each recursively, and
          combines the answers. Correctness is proved by strong induction on the input size.
        </p>
      </Definition>

      <Example title="merge sort">
        <p>
          To sort a list of length n ≥ 2: sort the first half, sort the second half, then <strong>merge</strong> the two sorted
          halves by repeatedly moving the smaller front element to the output. Merging two lists with n elements in total takes
          at most n − 1 comparisons. A list of length 1 is already sorted.
        </p>
      </Example>
      <Theorem title="merge sort is correct">
        <p>For every list, merge sort returns its elements in sorted order.</p>
      </Theorem>
      <Proof>
        <p>
          Strong induction on n. Lists of length 0 or 1 are sorted. For n ≥ 2, both halves are shorter, so by hypothesis they
          come back sorted. The merge keeps the invariant that the output is sorted and every element in it is at most every
          element still waiting, because it always takes the smaller of the two front elements, each the smallest in its list.
        </p>
      </Proof>

      <Theorem title="the cost of merge sort">
        <p>
          The number of comparisons satisfies <M>{"T(n) \\le 2T(n/2) + n"}</M> with <M>{"T(1) = 0"}</M>, so for n a power of 2,{" "}
          <M>{"T(n) \\le n\\log_2 n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unroll: level d of the recursion has <M>{"2^d"}</M> subproblems of size <M>{"n/2^d"}</M>, whose merges cost at most{" "}
          <M>{"2^d \\cdot n/2^d = n"}</M>. There are <M>{"\\log_2 n"}</M> levels with merging, so the total is at most{" "}
          <M>{"n\\log_2 n"}</M>. (An induction check: <M>{"2\\cdot\\tfrac n2\\log_2\\tfrac n2 + n = n(\\log_2 n - 1) + n = n\\log_2 n"}</M>.)
        </p>
      </Proof>

      <Theorem title="the master theorem (simple form)">
        <p>
          If <M>{"T(n) = aT(n/b) + \\Theta(n^d)"}</M> with a ≥ 1, b &gt; 1, d ≥ 0, then T(n) is{" "}
          <M>{"\\Theta(n^d)"}</M> if <M>{"a < b^d"}</M>, <M>{"\\Theta(n^d\\log n)"}</M> if <M>{"a = b^d"}</M>, and{" "}
          <M>{"\\Theta(n^{\\log_b a})"}</M> if <M>{"a > b^d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Level k of the recursion tree has <M>{"a^k"}</M> subproblems of size <M>{"n/b^k"}</M>, costing{" "}
          <M>{"a^k (n/b^k)^d = n^d (a/b^d)^k"}</M>. Summing a geometric series over <M>{"\\log_b n"}</M> levels: if the ratio{" "}
          <M>{"a/b^d"}</M> is below 1 the top level dominates; if it equals 1 every level costs the same; if above 1 the leaves
          dominate, and there are <M>{"a^{\\log_b n} = n^{\\log_b a}"}</M> of them.
        </p>
      </Proof>

      <Example title="three examples">
        <p>
          Binary search: <M>{"T(n) = T(n/2) + 1"}</M>, so a = 1, b = 2, d = 0, equal case: <M>{"\\Theta(\\log n)"}</M>. Merge
          sort: a = 2, b = 2, d = 1, equal case: <M>{"\\Theta(n\\log n)"}</M>. Karatsuba multiplication of n-digit numbers uses
          3 half-size products: a = 3, b = 2, d = 1, leaves dominate: <M>{"\\Theta(n^{\\log_2 3}) \\approx \\Theta(n^{1.585})"}</M>,
          beating the schoolbook <M>{"n^2"}</M>.
        </p>
      </Example>

      <Remark title="a lower bound">
        <p>
          No sorting algorithm that only compares elements can beat <M>{"\\log_2 (n!) = \\Theta(n\\log n)"}</M> comparisons in
          the worst case: each comparison has two outcomes, and the algorithm must distinguish all n! orders. Merge sort is
          therefore optimal up to a constant.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "levels",
      rung: "check",
      prompt: <p>Merge sort on 1024 items: how many levels of merging are there?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "merge",
      rung: "check",
      prompt: <p>What is the largest number of comparisons needed to merge two sorted lists of 5 elements each?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: <p>Using T(n) ≤ n log₂ n, at most how many comparisons does merge sort make on 1024 items?</p>,
      answer: { kind: "numeric", value: 10240 },
    },
    {
      key: "master",
      rung: "apply",
      prompt: <p>What does the master theorem give for T(n) = 4T(n/2) + n?</p>,
      answer: { kind: "choice", options: ["Θ(n)", "Θ(n log n)", "Θ(n²)", "Θ(n⁴)"], correct: [2] },
    },
    {
      key: "strassen",
      rung: "apply",
      prompt: <p>Strassen multiplies n × n matrices with 7 half-size products and Θ(n²) extra work. What is the exponent log₂ 7, to three decimal places?</p>,
      answer: { kind: "numeric", value: 2.807, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def merge(a, b):
    out = []
    while a and b:
        out.append(a.pop(0) if a[0] <= b[0] else b.pop(0))
    return out + a + b
print(merge([1, 4, 9], [2, 3, 10, 11]))`}</Code>
          <p>Merging two sorted lists. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 2, 3, 4, 9, 10, 11]", "[1, 4, 9, 2, 3, 10, 11]", "[1, 2, 3, 4, 9]", "[11, 10, 9, 4, 3, 2, 1]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>merge_sort(xs)</C>, which returns (sorted list, number of comparisons), splitting at the middle and merging with index pointers. Check that the comparison count never exceeds n log₂ n.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def merge_sort(xs):
    return sorted(xs), 0
`,
        solution: `def merge_sort(xs):
    if len(xs) <= 1:
        return list(xs), 0
    mid = len(xs) // 2
    a, ca = merge_sort(xs[:mid])
    b, cb = merge_sort(xs[mid:])
    out, i, j, c = [], 0, 0, ca + cb
    while i < len(a) and j < len(b):
        c += 1
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out += a[i:] + b[j:]
    return out, c
`,
        tests: [
          { name: "sorts", code: `import random
random.seed(3)
xs = [random.randint(0, 999) for _ in range(500)]
assert merge_sort(xs)[0] == sorted(xs), 'The result must be sorted.'` },
          { name: "bound", code: `import math, random
random.seed(4)
for n in (8, 64, 1000, 4096):
    xs = random.sample(range(10 * n), n)
    _, c = merge_sort(xs)
    assert 0 < c <= n * math.log2(n), 'Merge sort makes at most n log₂ n comparisons.'` },
        ],
      },
    },
    {
      key: "induct",
      rung: "prove",
      prompt: (
        <p>
          Prove by strong induction that if T(1) = 0 and T(n) = 2T(n/2) + n for n a power of 2, then{" "}
          <M>{"T(n) = n\\log_2 n"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Base case n = 1: T(1) = 0 = 1 · log₂ 1.",
          "Assumes T(n/2) = (n/2) log₂(n/2).",
          "Computes 2 · (n/2)(log₂ n − 1) + n = n log₂ n.",
        ],
      },
    },
    {
      key: "sortbound",
      rung: "stretch",
      prompt: <p>Any comparison sort needs at least ⌈log₂(n!)⌉ comparisons in the worst case. What is this for n = 5?</p>,
      answer: { kind: "numeric", value: 7 },
    },
  ],

  teachBack:
    "Explain to a friend how merge sort works, why its recursion tree has about log₂ n levels each costing n, and what the master theorem says.",

  glimpse: (
    <p>
      Data Structures and Algorithms implements merge sort and quicksort and applies divide and conquer widely. The recursion
      tree picture returns whenever you analyse a recursive program, including the backward pass through a deep network.
    </p>
  ),
};
