import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EditTableViz } from "@/components/viz/EditTableViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.8.3",
  minutes: 55,
  links: {
    requires: ["e2.7.3", "e2.8.1"],
    revisits: ["e2.6.3", "e2.8.2"],
    foreshadows: ["l12.6.2"],
  },

  puzzle: (
    <>
      <p>
        Type &ldquo;recieve&rdquo; and the spell checker offers &ldquo;receive&rdquo;. A speech recogniser is scored by how
        many words it got wrong, though its output may be longer or shorter than the truth. <C>git diff</C> shows the fewest
        lines to delete and add. Biologists line up two genes to see where they differ. Each needs a number for how far apart
        two sequences are, and each sequence can be stretched in many ways to line up with the other. How do you find the best
        of exponentially many alignments?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Look at the last characters. Either the last character of a was deleted, or the last character of b was inserted, or
        the two were lined up, costing nothing if equal and one substitution if not. Each option leaves a smaller pair of
        prefixes. So the distance between the first i characters of a and the first j of b depends only on three smaller
        cells, and the whole problem is a table of (len(a) + 1) × (len(b) + 1) cells. Walking back from the corner along the
        choices that gave each minimum recovers the alignment.
      </p>
      <EditTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="edit distance">
        <p>
          The <strong>Levenshtein distance</strong> between strings a and b is the least number of single-character
          insertions, deletions and substitutions turning a into b. With D[i][j] the distance between a[:i] and b[:j]:
        </p>
        <MD>{"D[i][0] = i, \\qquad D[0][j] = j"}</MD>
        <MD>{"D[i][j] = \\min\\big(D[i-1][j] + 1,\\; D[i][j-1] + 1,\\; D[i-1][j-1] + [a_{i-1} \\ne b_{j-1}]\\big)"}</MD>
      </Definition>

      <Theorem title="the recurrence is correct">
        <p>D[i][j] defined by the recurrence equals the edit distance between a[:i] and b[:j].</p>
      </Theorem>
      <Proof>
        <p>
          Any edit sequence can be drawn as an alignment, writing a above b with gaps, where each column is a match,
          substitution, deletion (a character over a gap) or insertion (a gap over a character), and the cost is the number of
          non-match columns. The last column of an optimal alignment of a[:i] and b[:j] is one of three kinds: a[i − 1] over a
          gap, leaving an alignment of a[:i − 1] and b[:j]; a gap over b[j − 1]; or a[i − 1] over b[j − 1]. Removing it leaves
          an alignment of the smaller prefixes, which must itself be optimal or the whole could be improved. So D[i][j] is the
          least, over the three kinds, of the last column&rsquo;s cost plus the smaller distance, which is the recurrence. By
          induction on i + j it gives the true distance.
        </p>
      </Proof>

      <Example title="time, space and the band">
        <p>
          The table takes O(nm) time. Row i needs only row i − 1, so the distance alone needs O(min(n, m)) memory; the
          alignment needs the table, or Hirschberg&rsquo;s divide-and-conquer trick, which recovers it in linear space. When
          you only care whether the distance is at most k, every cell with |i − j| &gt; k is already more than k, since
          reaching it needs that many insertions or deletions; computing only the band of width 2k + 1 around the diagonal
          costs O(k n). Spell checkers and fuzzy search use this with k = 1 or 2.
        </p>
      </Example>

      <Example title="the same table, other names">
        <p>
          Word error rate, the standard metric for speech recognition, is the edit distance between word sequences divided by
          the reference length; it can exceed 1 when the output has many extra words. Longest common subsequence is the same
          table with substitutions forbidden, and is what <C>diff</C> computes over lines. Needleman–Wunsch alignment in
          biology uses scores that depend on which bases or amino acids are paired, and Smith–Waterman finds the best matching
          pieces rather than whole strings. Dynamic time warping aligns two time series the same way. The table is a grid DAG,
          and the distance is a shortest path through it from corner to corner (E2.6.3).
        </p>
      </Example>

      <Remark title="limits">
        <p>
          No algorithm is known that computes edit distance in time <M>{"O(n^{2-\\varepsilon})"}</M>, and one would refute the
          strong exponential time hypothesis, a widely believed conjecture in complexity theory. So fast tools approximate or
          filter: they find candidate matches with exact seeds, such as k-mers looked up in a suffix array or a hash table, or
          MinHash sketches (E2.3.4), and run the quadratic DP only on the few survivors.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cells",
      rung: "check",
      prompt: <p>How many cells does the full edit-distance table have for strings of lengths 7 and 9?</p>,
      answer: { kind: "numeric", value: 80 },
    },
    {
      key: "bounds",
      rung: "check",
      prompt: <p>For strings of lengths n ≤ m, which bounds always hold for their edit distance d?</p>,
      answer: { kind: "choice", options: ["m − n ≤ d ≤ m", "0 ≤ d ≤ n", "n ≤ d ≤ m", "m − n ≤ d ≤ n + m − 1"], correct: [0] },
    },
    {
      key: "wer",
      rung: "apply",
      prompt: <p>The reference is &ldquo;please call stella&rdquo; and the recogniser outputs &ldquo;please call a taller&rdquo;. What is the word error rate? Give a decimal.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def edit(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y)))
        prev = cur
    return prev[-1]

print(edit("kitten", "sitting"), edit("flaw", "lawn"), edit("", "abc"), edit("abc", "cab"))`}</Code>
          <p>Edit distance with two rows. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 2 3 2", "3 2 3 3", "2 2 3 2", "3 3 3 2"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def align(a, b):
    n, m = len(a), len(b)
    d = [[i + j if i * j == 0 else 0 for j in range(m + 1)] for i in range(n + 1)]
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
    ops, i, j = [], n, m
    while i or j:
        if i and j and d[i][j] == d[i - 1][j - 1] + (a[i - 1] != b[j - 1]):
            ops.append("M" if a[i - 1] == b[j - 1] else "S")
            i, j = i - 1, j - 1
        elif i and d[i][j] == d[i - 1][j] + 1:
            ops.append("D")
            i -= 1
        else:
            ops.append("I")
            j -= 1
    return "".join(reversed(ops))

print(align("sunday", "saturday"), align("abc", "abc"), align("ab", ""))`}</Code>
          <p>Tracing back through the full table, preferring the diagonal, then deletion. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["MIIMSMMM MMM DD", "MIIMSMMM MMM II", "MSIISMMM MMM DD", "MIIMDMMM MMM DD"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>edit_distance(a, b)</C> keeping only two rows, with the shorter string along the row, and{" "}
            <C>alignment(a, b)</C>, a list of operations turning a into b at minimum cost: <C>(&apos;M&apos;, c)</C> keeps a
            matching character c, <C>(&apos;S&apos;, c)</C> replaces the next character of a by a different c,{" "}
            <C>(&apos;D&apos;, c)</C> deletes the next character c of a, and <C>(&apos;I&apos;, c)</C> inserts c.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def edit_distance(a, b):
    return sum(x != y for x, y in zip(a, b)) + abs(len(a) - len(b))

def alignment(a, b):
    return [('S', y) for y in b]
`,
        solution: `def edit_distance(a, b):
    if len(a) < len(b):
        a, b = b, a
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i] + [0] * len(b)
        for j, y in enumerate(b, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y))
        prev = cur
    return prev[-1]

def alignment(a, b):
    n, m = len(a), len(b)
    d = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        d[i][0] = i
    for j in range(m + 1):
        d[0][j] = j
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] != b[j - 1]))
    ops, i, j = [], n, m
    while i or j:
        if i and j and d[i][j] == d[i - 1][j - 1] + (a[i - 1] != b[j - 1]):
            ops.append(('M', a[i - 1]) if a[i - 1] == b[j - 1] else ('S', b[j - 1]))
            i, j = i - 1, j - 1
        elif i and d[i][j] == d[i - 1][j] + 1:
            ops.append(('D', a[i - 1]))
            i -= 1
        else:
            ops.append(('I', b[j - 1]))
            j -= 1
    return ops[::-1]
`,
        tests: [
          { name: "distance", code: `import random, time
from functools import lru_cache
assert edit_distance('kitten', 'sitting') == 3 and edit_distance('flaw', 'lawn') == 2
assert edit_distance('', 'abc') == 3 and edit_distance('abc', '') == 3 and edit_distance('', '') == 0
assert edit_distance('intention', 'execution') == 5
rng = random.Random(46)
for _ in range(300):
    a = ''.join(rng.choice('abc') for _ in range(rng.randint(0, 8)))
    b = ''.join(rng.choice('abc') for _ in range(rng.randint(0, 8)))
    @lru_cache(maxsize=None)
    def D(i, j):
        if i == 0 or j == 0:
            return i + j
        return min(D(i - 1, j) + 1, D(i, j - 1) + 1, D(i - 1, j - 1) + (a[i - 1] != b[j - 1]))
    assert edit_distance(a, b) == D(len(a), len(b)), (a, b)
a = ''.join(rng.choice('acgt') for _ in range(1500))
b = ''.join(rng.choice('acgt') for _ in range(1200))
start = time.perf_counter()
d = edit_distance(a, b)
assert 300 <= d <= 1500 and edit_distance(a, a) == 0 and edit_distance(a, a[1:]) == 1
assert time.perf_counter() - start < 30` },
          { name: "alignment", code: `import random
def apply(a, ops):
    out, i = [], 0
    for op, ch in ops:
        if op == 'M':
            assert a[i] == ch, 'M must keep a matching character.'
            out.append(ch); i += 1
        elif op == 'S':
            assert a[i] != ch, 'S must change the character.'
            out.append(ch); i += 1
        elif op == 'D':
            assert a[i] == ch, 'D names the deleted character.'
            i += 1
        else:
            assert op == 'I', op
            out.append(ch)
    assert i == len(a), 'Every character of a must be used.'
    return ''.join(out)
def cost(ops):
    return sum(op != 'M' for op, _ in ops)
ops = alignment('sunday', 'saturday')
assert apply('sunday', ops) == 'saturday' and cost(ops) == 3
assert alignment('abc', 'abc') == [('M', 'a'), ('M', 'b'), ('M', 'c')] and alignment('ab', '') == [('D', 'a'), ('D', 'b')]
assert alignment('', '') == []
rng = random.Random(47)
for _ in range(300):
    a = ''.join(rng.choice('ab') for _ in range(rng.randint(0, 9)))
    b = ''.join(rng.choice('ab') for _ in range(rng.randint(0, 9)))
    ops = alignment(a, b)
    assert apply(a, ops) == b and cost(ops) == edit_distance(a, b), (a, b, ops)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two applications:</p>
          <ul>
            <li>
              <C>word_error_rate(reference, hypothesis)</C>: the word-level edit distance (words split on whitespace) divided
              by the number of reference words; <C>ValueError</C> if the reference has none.
            </li>
            <li>
              <C>within_k(a, b, k)</C>: whether the edit distance is at most k, computing only cells with |i − j| ≤ k and
              stopping early once a whole band row exceeds k. Strings of 30,000 characters with k = 5 must be quick.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def word_error_rate(reference, hypothesis):
    ref, hyp = reference.split(), hypothesis.split()
    return sum(r != h for r, h in zip(ref, hyp)) / len(ref)

def within_k(a, b, k):
    return abs(len(a) - len(b)) <= k
`,
        solution: `def word_error_rate(reference, hypothesis):
    ref, hyp = reference.split(), hypothesis.split()
    if not ref:
        raise ValueError('empty reference')
    prev = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        cur = [i] + [0] * len(hyp)
        for j, h in enumerate(hyp, 1):
            cur[j] = min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (r != h))
        prev = cur
    return prev[-1] / len(ref)

def within_k(a, b, k):
    n, m = len(a), len(b)
    if abs(n - m) > k:
        return False
    INF = k + 1
    prev = {j: j for j in range(0, min(m, k) + 1)}
    for i in range(1, n + 1):
        cur = {}
        for j in range(max(0, i - k), min(m, i + k) + 1):
            if j == 0:
                v = i
            else:
                v = min(prev.get(j, INF) + 1, cur.get(j - 1, INF) + 1, prev.get(j - 1, INF) + (a[i - 1] != b[j - 1]))
            cur[j] = min(v, INF)
        if min(cur.values()) > k:
            return False
        prev = cur
    return prev.get(m, INF) <= k
`,
        tests: [
          { name: "word error rate", code: `import math
assert word_error_rate('the cat sat on the mat', 'the cat sat on the mat') == 0
assert math.isclose(word_error_rate('the cat sat on the mat', 'the cat sat on mat'), 1 / 6), 'One deleted word out of six.'
assert math.isclose(word_error_rate('the cat sat on the mat', 'a cat sat on the hat today'), 3 / 6)
assert math.isclose(word_error_rate('turn the lights off', 'turn lights of please now'), 4 / 4)
assert word_error_rate('hi', 'oh hi there you') == 3.0, 'Three inserted words against a one-word reference: WER can exceed 1.'
try:
    word_error_rate('', 'anything')
    assert False, 'An empty reference raises ValueError.'
except ValueError:
    pass` },
          { name: "banded", code: `import random, time
assert within_k('kitten', 'sitting', 3) and not within_k('kitten', 'sitting', 2)
assert within_k('', '', 0) and not within_k('abc', '', 2) and within_k('abc', '', 3)
rng = random.Random(48)
def full(a, b):
    prev = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        cur = [i]
        for j, y in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x != y)))
        prev = cur
    return prev[-1]
for _ in range(400):
    a = ''.join(rng.choice('ab') for _ in range(rng.randint(0, 10)))
    b = ''.join(rng.choice('ab') for _ in range(rng.randint(0, 10)))
    k = rng.randint(0, 6)
    assert within_k(a, b, k) == (full(a, b) <= k), (a, b, k)
base = ''.join(rng.choice('acgt') for _ in range(30000))
near = list(base)
for p in rng.sample(range(30000), 4):
    near[p] = 'x'
near = ''.join(near[:20000] + near[20001:])
start = time.perf_counter()
assert within_k(base, near, 5) and not within_k(base, near, 4)
assert time.perf_counter() - start < 15, 'Too slow: only cells within k of the diagonal can be at most k.'` },
        ],
      },
    },
    {
      key: "metric",
      rung: "prove",
      prompt: <p>Prove that edit distance satisfies the triangle inequality: d(a, c) ≤ d(a, b) + d(b, c).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes an optimal edit sequence from a to b, of length d(a, b), and one from b to c, of length d(b, c).",
          "Concatenates them into a sequence of single-character edits turning a into c.",
          "Its length is d(a, b) + d(b, c), and d(a, c) is the minimum over all such sequences.",
          "Notes symmetry (reverse each edit) and d = 0 only for equal strings, so edit distance is a metric.",
        ],
      },
    },
    {
      key: "band",
      rung: "stretch",
      prompt: <p>Prove that D[i][j] ≥ |i − j| for every cell, and use it to justify computing only the band |i − j| ≤ k when deciding whether the distance is at most k. What is the cost?</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows any edit sequence between strings of lengths i and j needs at least |i − j| insertions or deletions, since substitutions keep the length.",
          "Argues that any optimal path to cell (n, m) with value at most k passes only through cells with value at most k.",
          "Since values never decrease along a path through the table, such a path stays inside |i − j| ≤ k, so cells outside the band can be treated as more than k.",
          "Gives the cost O(k · min(n, m)) time and O(k) memory per row.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a spell checker can work out that recieve is one or two edits from receive, by filling in a table.",

  glimpse: (
    <p>
      That completes E2. The structures and techniques here, heaps, hash tables, tries, graphs, dynamic programming and beam
      search, are the vocabulary the rest of the course uses to talk about how models are trained, stored and decoded.
    </p>
  ),
};
