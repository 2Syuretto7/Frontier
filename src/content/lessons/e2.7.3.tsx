import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KnapsackTableViz } from "@/components/viz/KnapsackTableViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.7.3",
  minutes: 65,
  links: {
    requires: ["e2.7.1", "e2.6.2"],
    revisits: ["e2.5.2", "e2.7.2", "m4.2.2"],
    foreshadows: ["e2.7.4", "e2.8.3"],
  },

  puzzle: (
    <>
      <p>
        The obvious recursive Fibonacci function takes about a minute for n = 45 and would take longer than the age of the
        universe for n = 100. Add one line, a cache, and n = 100 is instant. The same move turns hopeless searches over all
        subsets, all alignments or all orderings into tables you fill in seconds. Which problems allow it, and how do you find
        the table?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Recursion is wasteful when the same subproblem turns up again and again. Fibonacci(45) recomputes Fibonacci(2) about
        700 million times. Dynamic programming solves each distinct subproblem once and stores the answer. Two conditions make
        it work: the best answer is built from best answers to smaller subproblems (<strong>optimal substructure</strong>), and
        there are few distinct subproblems even though the recursion visits them many times (<strong>overlapping
        subproblems</strong>). Below, each knapsack cell needs only two cells of the row above.
      </p>
      <KnapsackTableViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the recipe">
        <ol>
          <li>Define the subproblem in words, with its parameters: best[i][c] = the best value using items 0 to i − 1 with capacity c.</li>
          <li>Write the recurrence, by asking about the last decision: skip item i − 1, or take it if it fits.</li>
          <li>Fix the base cases and an order in which every cell&rsquo;s inputs come first.</li>
          <li>Read off the answer, and walk back through the choices to rebuild the solution.</li>
        </ol>
        <MD>{"\\text{best}[i][c] = \\max\\big(\\text{best}[i-1][c],\\; \\text{best}[i-1][c-w_{i-1}] + v_{i-1}\\big)"}</MD>
        <p>The subproblems and their dependencies form a DAG; any topological order of it works (E2.6.2).</p>
      </Definition>

      <Example title="top-down and bottom-up">
        <Code>{`from functools import cache

@cache                                # top-down: recursion plus memo
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

def fib_table(n):                     # bottom-up: fill in order
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a`}</Code>
        <p>
          Top-down is quicker to write and computes only the subproblems actually reached; it is limited by Python&rsquo;s
          recursion depth. Bottom-up avoids recursion and often lets you keep only the last row or two, as{" "}
          <C>fib_table</C> keeps two numbers. Time is (number of subproblems) × (work per subproblem): knapsack is O(nC), which
          is <em>pseudo-polynomial</em>, polynomial in the value of C but exponential in its number of digits; the problem is
          NP-hard in general.
        </p>
      </Example>

      <Theorem title="longest increasing subsequence in O(n log n)">
        <p>
          Keep <C>tails[k]</C>, the smallest possible last item of a strictly increasing subsequence of length k + 1 seen so far.
          For each new x, replace the first tail ≥ x (found with <C>bisect_left</C>), or append x if there is none. The final
          length of <C>tails</C> is the length of the longest increasing subsequence.
        </p>
      </Theorem>
      <Proof>
        <p>
          The list <C>tails</C> is strictly increasing: a subsequence of length k + 2 contains one of length k + 1 ending
          earlier and lower. When x arrives, the longest subsequence it can end has length k + 1 where k is the number of
          tails below x, which is exactly the position <C>bisect_left</C> returns; x then becomes the smallest known tail for
          that length. So each length present in <C>tails</C> is achievable, and every achievable length is recorded, since
          each item updates the entry for the longest subsequence it ends. To rebuild a subsequence, store for each item the
          index of the tail before it.
        </p>
      </Proof>

      <Example title="interval DP: the order of matrix products">
        <p>
          Multiplying a p × q matrix by a q × r one costs pqr scalar multiplications, and matrix products can be bracketed in
          any order. For shapes 10 × 30, 30 × 5 and 5 × 60, <M>{"(AB)C"}</M> costs 1,500 + 3,000 = 4,500, while{" "}
          <M>{"A(BC)"}</M> costs 9,000 + 18,000 = 27,000. Let cost[i][j] be the cheapest way to multiply matrices i to j; it
          tries every last split k: <M>{"\\text{cost}[i][k] + \\text{cost}[k+1][j] + d_i d_{k+1} d_{j+1}"}</M>. Filling by
          interval length gives O(n³). <C>np.einsum(..., optimize=True)</C> and <C>opt_einsum</C> solve this problem for
          tensor contractions.
        </p>
      </Example>

      <Remark title="dynamic programming everywhere">
        <p>
          Shortest paths were DP: Bellman–Ford is the recurrence on paths with at most k edges. The Viterbi algorithm for the
          most likely hidden state sequence, CTC loss in speech recognition and the forward–backward algorithm are DP over
          time steps. The Bellman equation of reinforcement learning is DP over states, which is where the name came from:
          Richard Bellman chose &ldquo;dynamic programming&rdquo; in the 1950s partly because it sounded impressive to the
          people funding him.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "conditions",
      rung: "check",
      prompt: <p>Which pair of properties makes dynamic programming useful for a problem?</p>,
      answer: {
        kind: "choice",
        options: ["Optimal substructure and overlapping subproblems", "Optimal substructure and a greedy choice", "Independent subproblems and a balanced split", "A sorted input and a monotone predicate"],
        correct: [0],
      },
    },
    {
      key: "cells",
      rung: "apply",
      prompt: <p>The knapsack table for 50 items and capacity 1,000 has rows 0 to 50 and columns 0 to 1,000. How many cells does it have?</p>,
      answer: { kind: "numeric", value: 51051 },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: <p>Matrices have shapes 2 × 50, 50 × 2 and 2 × 50. What is the cheapest number of scalar multiplications to compute their product?</p>,
      answer: { kind: "numeric", value: 400 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from functools import lru_cache

calls = 0

@lru_cache(maxsize=None)
def ways(n):
    global calls
    calls += 1
    if n < 0:
        return 0
    if n == 0:
        return 1
    return ways(n - 1) + ways(n - 2) + ways(n - 3)

print(ways(10), calls, ways(4), calls)`}</Code>
          <p>Counting ways to climb n stairs taking 1, 2 or 3 at a time, with a cache. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["274 13 7 13", "274 11 7 11", "274 13 7 14", "149 13 7 13"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from bisect import bisect_left

def lis_tails(a):
    tails = []
    for x in a:
        i = bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return tails

t = lis_tails([3, 1, 4, 1, 5, 9, 2, 6, 5, 3])
print(t, len(t), lis_tails([5, 5, 5]))`}</Code>
          <p>The tails list of the O(n log n) longest increasing subsequence. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 2, 3, 6] 4 [5]", "[1, 4, 5, 9] 4 [5]", "[1, 2, 3, 6] 4 [5, 5, 5]", "[1, 2, 5, 6] 4 [5]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>knapsack(items, cap)</C> for items <C>(weight, value)</C> with positive integer weights, returning{" "}
            <C>(best_value, chosen)</C> with chosen the sorted indices of the items taken, rebuilt from the table. Then write{" "}
            <C>lis(a)</C>, returning one longest strictly increasing subsequence of a (as a list of values) in O(n log n), by
            keeping for each item the index of its predecessor.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def knapsack(items, cap):
    chosen, total, room = [], 0, cap
    for i, (w, v) in sorted(enumerate(items), key=lambda p: -p[1][1] / p[1][0]):
        if w <= room:
            chosen.append(i); total += v; room -= w
    return total, sorted(chosen)

def lis(a):
    out = []
    for x in a:
        if not out or x > out[-1]:
            out.append(x)
    return out
`,
        solution: `from bisect import bisect_left

def knapsack(items, cap):
    n = len(items)
    best = [[0] * (cap + 1) for _ in range(n + 1)]
    for i, (w, v) in enumerate(items, 1):
        for c in range(cap + 1):
            best[i][c] = best[i - 1][c]
            if w <= c and best[i - 1][c - w] + v > best[i][c]:
                best[i][c] = best[i - 1][c - w] + v
    chosen, c = [], cap
    for i in range(n, 0, -1):
        if best[i][c] != best[i - 1][c]:
            chosen.append(i - 1)
            c -= items[i - 1][0]
    return best[n][cap], chosen[::-1]

def lis(a):
    tails, tail_idx, prev = [], [], [None] * len(a)
    for i, x in enumerate(a):
        k = bisect_left(tails, x)
        if k == len(tails):
            tails.append(x); tail_idx.append(i)
        else:
            tails[k] = x; tail_idx[k] = i
        prev[i] = tail_idx[k - 1] if k else None
    out, i = [], tail_idx[-1] if tail_idx else None
    while i is not None:
        out.append(a[i])
        i = prev[i]
    return out[::-1]
`,
        tests: [
          { name: "knapsack", code: `import random, itertools
v, ch = knapsack([(6, 7), (5, 5), (5, 5)], 10)
assert (v, ch) == (10, [1, 2]), (v, ch)
assert knapsack([], 5) == (0, []) and knapsack([(3, 4)], 2) == (0, [])
rng = random.Random(31)
for _ in range(200):
    items = [(rng.randint(1, 10), rng.randint(1, 20)) for _ in range(rng.randint(1, 8))]
    cap = rng.randint(0, 30)
    best = max(sum(items[i][1] for i in s) for r in range(len(items) + 1) for s in itertools.combinations(range(len(items)), r) if sum(items[i][0] for i in s) <= cap)
    val, chosen = knapsack(items, cap)
    assert val == best, (items, cap)
    assert len(set(chosen)) == len(chosen) and sum(items[i][0] for i in chosen) <= cap and sum(items[i][1] for i in chosen) == val, (items, cap, chosen)
items = [(rng.randint(1, 100), rng.randint(1, 100)) for _ in range(100)]
val, chosen = knapsack(items, 1000)
assert sum(items[i][0] for i in chosen) <= 1000 and sum(items[i][1] for i in chosen) == val` },
          { name: "longest increasing subsequence", code: `import random, time
def check(a, s):
    assert all(x < y for x, y in zip(s, s[1:])), f'{s} is not strictly increasing.'
    it = iter(a)
    assert all(any(x == y for y in it) for x in s), f'{s} is not a subsequence.'
assert lis([]) == []
s = lis([3, 1, 4, 1, 5, 9, 2, 6, 5, 3]); check([3, 1, 4, 1, 5, 9, 2, 6, 5, 3], s); assert len(s) == 4
assert lis([5, 5, 5]) == [5]
rng = random.Random(32)
for _ in range(300):
    a = [rng.randint(0, 15) for _ in range(rng.randint(0, 14))]
    L = [1] * len(a)
    for i in range(len(a)):
        for j in range(i):
            if a[j] < a[i]:
                L[i] = max(L[i], L[j] + 1)
    s = lis(a)
    check(a, s)
    assert len(s) == max(L, default=0), (a, s)
a = [rng.randint(0, 10 ** 9) for _ in range(100000)]
start = time.perf_counter()
s = lis(a)
assert time.perf_counter() - start < 10, 'Too slow: use binary search on the tails.'
check(a, s)
assert 560 < len(s) < 700` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two more recurrences:</p>
          <ul>
            <li>
              <C>count_decodings(s)</C>: letters are encoded as A = 1, &hellip;, Z = 26 and written together, so &ldquo;226&rdquo;
              could be BZ, VF or BBF. Count the decodings of a digit string modulo 10⁹ + 7, in O(n) time and O(1) extra memory
              (1 for the empty string). Strings can be 100,000 digits long.
            </li>
            <li>
              <C>matrix_chain(dims)</C>: matrix k has shape <C>dims[k] × dims[k + 1]</C>. Return the least number of scalar
              multiplications and an optimal bracketing written like <C>&apos;((M0 M1) M2)&apos;</C>, with a single matrix as{" "}
              <C>&apos;M0&apos;</C>. Raise <C>ValueError</C> if there are no matrices.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_decodings(s, mod=10 ** 9 + 7):
    return 1

def matrix_chain(dims):
    n = len(dims) - 1
    cost, rows = 0, dims[0]
    for k in range(1, n):
        cost += rows * dims[k] * dims[k + 1]
    expr = 'M0'
    for k in range(1, n):
        expr = f'({expr} M{k})'
    return cost, expr
`,
        solution: `def count_decodings(s, mod=10 ** 9 + 7):
    prev2, prev1 = 0, 1                       # ways for s[:i-2], s[:i-1]; start: empty string has 1
    for i, ch in enumerate(s):
        cur = prev1 if ch != '0' else 0
        if i and s[i - 1] != '0' and 10 <= int(s[i - 1:i + 1]) <= 26:
            cur += prev2 if i > 1 else 1
        prev2, prev1 = prev1, cur % mod
    return prev1 if s else 1

def matrix_chain(dims):
    n = len(dims) - 1
    if n < 1:
        raise ValueError('need at least one matrix')
    cost = [[0] * n for _ in range(n)]
    split = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            cost[i][j] = float('inf')
            for k in range(i, j):
                c = cost[i][k] + cost[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
                if c < cost[i][j]:
                    cost[i][j], split[i][j] = c, k
    def paren(i, j):
        if i == j:
            return f'M{i}'
        k = split[i][j]
        return f'({paren(i, k)} {paren(k + 1, j)})'
    return cost[0][n - 1], paren(0, n - 1)
`,
        tests: [
          { name: "decodings", code: `assert count_decodings('12') == 2 and count_decodings('226') == 3 and count_decodings('11106') == 2
assert count_decodings('0') == 0 and count_decodings('06') == 0 and count_decodings('100') == 0 and count_decodings('') == 1
assert count_decodings('27') == 1 and count_decodings('1010') == 1 and count_decodings('2611055971756562') == 4
import random
rng = random.Random(33)
def brute(s):
    if not s:
        return 1
    total = 0
    if s[0] != '0':
        total += brute(s[1:])
        if len(s) > 1 and int(s[:2]) <= 26:
            total += brute(s[2:])
    return total
for _ in range(400):
    s = ''.join(rng.choice('0112223456789') for _ in range(rng.randint(1, 14)))
    assert count_decodings(s) == brute(s), s
fib = [1, 1]
for _ in range(100000):
    fib.append((fib[-1] + fib[-2]) % (10 ** 9 + 7))
assert count_decodings('1' * 100000) == fib[100000], 'Ones decode like Fibonacci numbers; work modulo 10**9 + 7.'` },
          { name: "matrix chain", code: `import re
def evaluate(expr, dims):
    tokens = re.findall(r'M[0-9]+|[()]', expr)
    stack, total = [], 0
    for t in tokens:
        if t.startswith('M'):
            k = int(t[1:])
            stack.append((dims[k], dims[k + 1]))
        elif t == ')':
            (a, b), (b2, c) = stack[-2], stack[-1]
            assert b == b2, 'Shapes must match.'
            stack[-2:] = [(a, c)]
            total += a * b * c
    assert len(stack) == 1 and stack[0] == (dims[0], dims[-1]), expr
    return total
assert matrix_chain([10, 30, 5, 60])[0] == 4500
c, e = matrix_chain([10, 30, 5, 60])
assert e == '((M0 M1) M2)' and evaluate(e, [10, 30, 5, 60]) == 4500
assert matrix_chain([5, 7]) == (0, 'M0')
c, e = matrix_chain([40, 20, 30, 10, 30])
assert c == 26000 and evaluate(e, [40, 20, 30, 10, 30]) == 26000
try:
    matrix_chain([3])
    assert False, 'No matrices: raise ValueError.'
except ValueError:
    pass
import random, itertools
from functools import lru_cache
rng = random.Random(34)
for _ in range(100):
    dims = [rng.randint(1, 30) for _ in range(rng.randint(2, 8))]
    @lru_cache(maxsize=None)
    def best(i, j):
        if i == j:
            return 0
        return min(best(i, k) + best(k + 1, j) + dims[i] * dims[k + 1] * dims[j + 1] for k in range(i, j))
    c, e = matrix_chain(dims)
    assert c == best(0, len(dims) - 2) and evaluate(e, dims) == c, (dims, c, e)
dims = [rng.randint(1, 100) for _ in range(61)]
c, e = matrix_chain(dims)
assert evaluate(e, dims) == c` },
        ],
      },
    },
    {
      key: "knapproof",
      rung: "prove",
      prompt: <p>Prove that the knapsack recurrence best[i][c] = max(best[i − 1][c], best[i − 1][c − wᵢ₋₁] + vᵢ₋₁) (the second option only when wᵢ₋₁ ≤ c) is correct.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers an optimal choice S from the first i items with capacity c, and splits on whether item i − 1 is in S.",
          "If not, S is a valid choice from the first i − 1 items with capacity c, so its value is at most best[i − 1][c].",
          "If so, S without item i − 1 fits capacity c − wᵢ₋₁, so its value is at most best[i − 1][c − wᵢ₋₁] + vᵢ₋₁.",
          "Both options are achievable, so the maximum equals best[i][c]; induction on i with base row 0 completes it.",
        ],
      },
    },
    {
      key: "space",
      rung: "stretch",
      prompt: <p>Show how to compute the knapsack value with one array of length C + 1 instead of a full table, explain why the inner loop must run over capacities from high to low, and say what is lost.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Keeps one row best[c] and updates best[c] = max(best[c], best[c − w] + v) for each item.",
          "Running c downwards means best[c − w] still holds the previous row's value when it is read.",
          "Running upwards would read an already updated cell and allow an item to be taken more than once (the unbounded knapsack).",
          "The full table is gone, so the chosen items cannot be rebuilt by walking back without extra storage or recomputation.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a cache turns a recursive function that would never finish into one that is instant, and how to find the table for a new problem.",

  glimpse: (
    <p>
      Dynamic programming needs every subproblem. When there are too many, as in choosing the best sentence from a vocabulary
      of 100,000 words, keep only the most promising few at each step: beam search, next.
    </p>
  ),
};
