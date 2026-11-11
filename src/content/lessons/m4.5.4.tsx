import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SubsetSumViz } from "@/components/viz/SubsetSumViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.5.4",
  minutes: 60,
  links: {
    requires: ["m4.5.2", "m4.3.5"],
    foreshadows: ["e2.7.2", "e2.7.3"],
  },

  puzzle: (
    <>
      <p>
        Checking a finished Sudoku takes a minute. Solving a hard one can take an hour. Is there a deep reason that finding
        answers is harder than checking them, or have we just not found the clever method yet?
      </p>
      <p>This is the P versus NP question, and nobody knows the answer.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Choose numbers below that add up to the target. Once you have them, anyone can check your answer with one addition. But
        finding them by trying every subset takes <M>{"2^n"}</M> attempts, which is hopeless for n = 100. Problems like this,
        easy to check, are called NP.
      </p>
      <SubsetSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="decision problems and P">
        <p>
          A <strong>decision problem</strong> asks a yes-or-no question about an input, such as &ldquo;is this graph
          3-colourable?&rdquo;. <strong>P</strong> is the class of decision problems solvable by an algorithm whose running time
          is <M>{"O(n^k)"}</M> for some fixed k, where n is the length of the input. Polynomial time is the working definition
          of &ldquo;efficient&rdquo;.
        </p>
      </Definition>

      <Definition title="NP">
        <p>
          <strong>NP</strong> is the class of decision problems for which every yes-instance has a{" "}
          <strong>certificate</strong> of polynomial length that can be checked in polynomial time. For subset sum, a
          certificate is the chosen subset. For 3-colouring, it is the colouring. For Hamiltonian cycle, it is the cycle.
        </p>
      </Definition>

      <Theorem title="P is contained in NP">
        <p>Every problem in P is in NP.</p>
      </Theorem>
      <Proof>
        <p>
          The checker can ignore the certificate and solve the problem itself in polynomial time.
        </p>
      </Proof>

      <Definition title="reductions and NP-completeness">
        <p>
          Problem A <strong>reduces</strong> to problem B if there is a polynomial-time transformation turning each instance of
          A into an instance of B with the same answer. Then a fast algorithm for B gives one for A. B is{" "}
          <strong>NP-complete</strong> if it is in NP and every problem in NP reduces to it.
        </p>
      </Definition>

      <Theorem title="Cook and Levin (1971)">
        <p>
          Boolean satisfiability, deciding whether a formula in the variables <M>{"x_1, \\dots, x_n"}</M> can be made true, is
          NP-complete.
        </p>
      </Theorem>
      <Remark title="a family of hard problems">
        <p>
          Thousands of natural problems are now known to be NP-complete, by chains of reductions from satisfiability: subset
          sum, 3-colouring, Hamiltonian cycle, the travelling salesman decision problem, scheduling and many puzzles. A
          polynomial-time algorithm for any one of them would give one for all, and would show P = NP. Most researchers believe
          P ≠ NP, but it is one of the great open problems of mathematics.
        </p>
      </Remark>

      <Example title="a reduction">
        <p>
          Hamiltonian cycle reduces to the travelling salesman problem: given a graph on n vertices, make a complete graph with
          distance 1 on the original edges and 2 on the others. The graph has a Hamiltonian cycle exactly when there is a tour
          of length n.
        </p>
      </Example>

      <Remark title="living with hardness">
        <p>
          NP-completeness is about the worst case. In practice, hard problems are attacked with algorithms that are exponential
          but fast on typical inputs (modern satisfiability solvers handle millions of variables), with approximation algorithms
          that guarantee near-optimal answers, and with heuristics such as greedy choices and beam search. Note also that the
          numbers in subset sum matter: when they are small integers, dynamic programming solves it in time proportional to n
          times the target.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "subsets",
      rung: "check",
      prompt: <p>How many subsets does a brute-force search try for a set of 30 numbers?</p>,
      answer: { kind: "numeric", value: 1073741824 },
    },
    {
      key: "inP",
      rung: "check",
      prompt: <p>Which of these problems is known to be in P?</p>,
      answer: { kind: "choice", options: ["Is this graph 2-colourable?", "Is this graph 3-colourable?", "Does this graph have a Hamiltonian cycle?", "Is this formula satisfiable?"], correct: [0] },
    },
    {
      key: "time",
      rung: "apply",
      prompt: <p>At 10⁹ subsets a second, about how many years does trying all subsets of 60 numbers take? Give the nearest whole number of years.</p>,
      answer: { kind: "numeric", value: 37, tolerance: 1 },
    },
    {
      key: "cert",
      rung: "apply",
      prompt: <p>For which question is there no obvious short certificate for a yes answer?</p>,
      answer: { kind: "choice", options: ["Does this graph have a clique of size 10?", "Is this number composite?", "Does this formula have no satisfying assignment?", "Can these items fit in 3 boxes?"], correct: [2] },
    },
    {
      key: "dp",
      rung: "apply",
      prompt: <p>Dynamic programming for subset sum fills a table with one entry for each pair (number of items considered, partial sum from 0 to the target). How many entries for 100 items and target 1000, counting 0 to 100 items and sums 0 to 1000?</p>,
      answer: { kind: "numeric", value: 101101 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations
nums, target = [8, 6, 7, 5, 3, 10, 9], 15
sols = [c for r in range(len(nums) + 1) for c in combinations(nums, r) if sum(c) == target]
print(len(sols), 2 ** len(nums))`}</Code>
          <p>Brute-force subset sum. How many subsets reach 15, and how many were tried?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 128", "3 128", "4 64", "4 49"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations
nums = [3, 34, 4, 12, 5, 2]
hits = [c for r in range(len(nums) + 1) for c in combinations(nums, r) if sum(c) == 9]
print(len(hits), 2 ** len(nums), min(hits, key=len))`}</Code>
          <p>Subset sum by trying every subset. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 64 (4, 5)", "3 64 (4, 5)", "2 36 (4, 5)", "2 64 (3, 4, 2)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>verify(nums, target, subset_indices)</C>, a polynomial-time certificate check for subset sum (distinct valid indices whose numbers add to the target), and <C>subset_sum_dp(nums, target)</C>, which decides subset sum for non-negative integers by dynamic programming over reachable sums, in time proportional to len(nums) × target.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def verify(nums, target, subset_indices):
    return True

def subset_sum_dp(nums, target):
    reach = [True] + [False] * target
    # Mark each sum reachable using the numbers so far.
    return reach[target]
`,
        solution: `def verify(nums, target, subset_indices):
    idx = list(subset_indices)
    if len(set(idx)) != len(idx) or any(not 0 <= i < len(nums) for i in idx):
        return False
    return sum(nums[i] for i in idx) == target

def subset_sum_dp(nums, target):
    reach = [True] + [False] * target
    for x in nums:
        for s in range(target, x - 1, -1):
            if reach[s - x]:
                reach[s] = True
    return reach[target]
`,
        tests: [
          { name: "verify", code: `nums = [8, 6, 7, 5, 3, 10, 9]
assert verify(nums, 15, [0, 2]) and not verify(nums, 15, [0, 0]) and not verify(nums, 15, [1, 9]) and not verify(nums, 15, [1, 2]), 'Check indices are distinct and valid, then add.'` },
          { name: "dp small", code: `assert subset_sum_dp([8, 6, 7, 5, 3, 10, 9], 15) and not subset_sum_dp([2, 4, 6], 7), 'Track which sums are reachable.'` },
          { name: "dp large", code: `nums = [3 * i + 1 for i in range(60)]
assert subset_sum_dp(nums, 2000) and not subset_sum_dp([2 * i for i in range(1, 61)], 2001), 'Sixty numbers: 2⁶⁰ subsets, but only 60 × 2000 table cells.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Two NP problems, solved exactly. Write <C>subset_sum(nums, target)</C> for non-negative integers by dynamic programming over reachable sums (record how each sum was first reached so you can walk back), returning a sorted list of indices whose values sum to the target, or <C>None</C>. Its running time is about n · target, which is pseudo-polynomial. Then write <C>sat_solve(n_vars, clauses)</C>, where variables are 1 … n and each clause is a list of non-zero integers (−3 means not x₃): return a list of n booleans satisfying every clause, or <C>None</C>, by trying all 2ⁿ assignments.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def subset_sum(nums, target):
    return None

def sat_solve(n_vars, clauses):
    return [True] * n_vars
`,
        solution: `from itertools import product

def subset_sum(nums, target):
    how = {0: None}
    for i, x in enumerate(nums):
        for s in list(how):
            t = s + x
            if t <= target and t not in how:
                how[t] = (s, i)
    if target not in how:
        return None
    out, s = [], target
    while how[s] is not None:
        s, i = how[s]
        out.append(i)
    return sorted(out)

def sat_solve(n_vars, clauses):
    for bits in product((False, True), repeat=n_vars):
        if all(any(bits[abs(l) - 1] == (l > 0) for l in c) for c in clauses):
            return list(bits)
    return None
`,
        tests: [
          { name: "subset", code: `nums = [3, 34, 4, 12, 5, 2]
s = subset_sum(nums, 9)
assert s is not None and sum(nums[i] for i in s) == 9 and len(set(s)) == len(s) and s == sorted(s), 'Indices of distinct items.'
assert subset_sum(nums, 30) is None and subset_sum(nums, 0) == [] and subset_sum([], 1) is None, '30 cannot be made.'` },
          { name: "brute subset", code: `from itertools import combinations
import random
random.seed(23)
for _ in range(100):
    nums = [random.randint(0, 20) for _ in range(random.randint(0, 9))]
    t = random.randint(0, 60)
    can = any(sum(c) == t for r in range(len(nums) + 1) for c in combinations(nums, r))
    s = subset_sum(nums, t)
    assert (s is not None) == can and (s is None or (sum(nums[i] for i in s) == t and len(set(s)) == len(s))), f'{nums}, {t}'` },
          { name: "big subset", code: `import random
random.seed(24)
nums = [random.randint(1, 1000) for _ in range(100)]
s = subset_sum(nums, 20000)
assert s is not None and sum(nums[i] for i in s) == 20000, 'n · target is about 2 million steps.'` },
          { name: "sat", code: `assert sat_solve(1, [[1], [-1]]) is None and sat_solve(2, [[1, 2], [-1, 2], [1, -2]]) == [True, True] and sat_solve(0, []) == [], 'x ∧ ¬x is unsatisfiable.'
v = lambda p, h: 2 * p + h + 1
php = [[v(p, 0), v(p, 1)] for p in range(3)] + [[-v(p, h), -v(q, h)] for h in range(2) for p in range(3) for q in range(p + 1, 3)]
assert sat_solve(6, php) is None, 'Three pigeons do not fit in two holes.'` },
          { name: "planted", code: `import random
random.seed(25)
for _ in range(10):
    n = 12
    secret = [random.random() < 0.5 for _ in range(n)]
    cl = []
    while len(cl) < 50:
        c = [random.choice([1, -1]) * random.randint(1, n) for _ in range(3)]
        if any(secret[abs(l) - 1] == (l > 0) for l in c):
            cl.append(c)
    a = sat_solve(n, cl)
    assert a is not None and all(any(a[abs(l) - 1] == (l > 0) for l in c) for c in cl), 'The returned assignment must satisfy every clause.'` },
        ],
      },
    },
    {
      key: "reduction",
      rung: "prove",
      prompt: (
        <p>
          Explain why, if problem A reduces to problem B in polynomial time and B is in P, then A is in P.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Runs the reduction on an instance of A of size n, taking polynomial time, so the output has polynomial size.",
          "Runs B's polynomial algorithm on that output; a polynomial of a polynomial is a polynomial.",
          "Notes the answers agree by the definition of a reduction, so this decides A in polynomial time.",
        ],
      },
    },
    {
      key: "tsp",
      rung: "stretch",
      prompt: <p>How many distinct round trips through 10 cities are there, starting and ending at a fixed city, if a tour and its reverse count as the same?</p>,
      answer: { kind: "numeric", value: 181440 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between P and NP using subset sum, what a certificate is, and what it would mean if someone found a fast algorithm for one NP-complete problem.",

  glimpse: (
    <p>
      Data Structures and Algorithms meets the practical side: greedy algorithms that are fast but not always optimal, dynamic
      programming for problems with small numbers, and beam search, the heuristic that language models use to decode text.
    </p>
  ),
};
