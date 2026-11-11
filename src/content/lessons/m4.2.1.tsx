import { M } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { InclusionGridViz } from "@/components/viz/InclusionGridViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.2.1",
  minutes: 60,
  links: {
    requires: ["m4.1.3", "m1.4.3"],
    foreshadows: ["m4.6.1", "m7.1.1"],
  },

  puzzle: (
    <>
      <p>
        A secretary puts n letters into n addressed envelopes at random. What is the chance that no letter reaches the right
        envelope? Does it go to 0 as n grows, or to 1, or to something in between?
      </p>
      <p>
        Counting the arrangements with no letter in place is hard directly. Counting the bad arrangements is easy, but they
        overlap. The method of this lesson handles the overlaps.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Adding the sizes of overlapping sets counts the overlaps too often. Subtract the pairwise overlaps and you remove too
        much where three sets meet, so add those back. The signs alternate. Toggle the divisors below and match the shaded
        count with the alternating sum.
      </p>
      <InclusionGridViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="inclusion-exclusion for two and three sets">
        <p>
          <M>{"|A \\cup B| = |A| + |B| - |A \\cap B|"}</M>, and
        </p>
        <p>
          <M>{"|A \\cup B \\cup C| = |A| + |B| + |C| - |A\\cap B| - |A\\cap C| - |B\\cap C| + |A\\cap B\\cap C|"}</M>.
        </p>
      </Theorem>

      <Theorem title="the general formula">
        <p>
          <M>{"\\displaystyle \\Big|\\bigcup_{i=1}^n A_i\\Big| = \\sum_{\\emptyset \\ne S \\subseteq \\{1,\\dots,n\\}} (-1)^{|S|+1} \\Big|\\bigcap_{i \\in S} A_i\\Big|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take an element x that lies in exactly m ≥ 1 of the sets. It is counted once on the left. On the right it appears in
          the intersection over S exactly when S is a non-empty subset of those m sets, so its total contribution is{" "}
          <M>{"\\sum_{j=1}^{m} (-1)^{j+1}\\binom{m}{j} = 1 - \\sum_{j=0}^{m}(-1)^j\\binom{m}{j} = 1 - 0 = 1"}</M>, by the
          alternating-sum identity of the previous lesson. Elements in none of the sets contribute 0 to both sides.
        </p>
      </Proof>

      <Example title="numbers coprime to 30">
        <p>
          How many of 1, …, 30 share no factor with 30 = 2 · 3 · 5? Multiples of 2, 3, 5: 15, 10, 6. Of 6, 10, 15: 5, 3, 2. Of
          30: 1. So <M>{"15 + 10 + 6 - 5 - 3 - 2 + 1 = 22"}</M> are divisible by 2, 3 or 5, and 30 − 22 = 8 are coprime to 30.
          This is Euler&rsquo;s <M>{"\\varphi(30) = 30(1 - \\tfrac12)(1 - \\tfrac13)(1 - \\tfrac15) = 8"}</M>.
        </p>
      </Example>

      <Theorem title="derangements">
        <p>
          The number of permutations of n items with no fixed point is{" "}
          <M>{"\\displaystyle D_n = n!\\sum_{k=0}^{n} \\frac{(-1)^k}{k!}"}</M>, and <M>{"D_n / n! \\to 1/e \\approx 0.3679"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"A_i"}</M> be the permutations fixing item i. Any k of these sets intersect in the permutations fixing k given
          items, of which there are (n − k)!, and there are <M>{"\\binom{n}{k}"}</M> ways to choose the k items. So{" "}
          <M>{"|\\bigcup A_i| = \\sum_{k \\ge 1} (-1)^{k+1}\\binom{n}{k}(n-k)! = \\sum_{k\\ge1} (-1)^{k+1} n!/k!"}</M>, and{" "}
          <M>{"D_n = n! - |\\bigcup A_i|"}</M>. The sum is the Taylor series of <M>{"e^{-1}"}</M>, cut off after n terms.
        </p>
      </Proof>
      <Example title="the letters">
        <p>
          <M>{"D_4 = 24(1 - 1 + \\tfrac12 - \\tfrac16 + \\tfrac1{24}) = 9"}</M>, so the chance for 4 letters is 9/24 = 0.375.
          For any n beyond about 6 it is 0.368 to three places: neither 0 nor 1.
        </p>
      </Example>

      <Example title="surjections">
        <p>
          The number of functions from an m-set onto an n-set is{" "}
          <M>{"\\sum_{k=0}^{n} (-1)^k \\binom{n}{k}(n-k)^m"}</M>: subtract the functions that miss some value. For m = 4, n = 3:{" "}
          <M>{"81 - 3\\cdot16 + 3\\cdot1 - 0 = 36"}</M>.
        </p>
      </Example>

      <Remark title="truncating gives bounds">
        <p>
          Stopping inclusion-exclusion after an odd number of terms gives an upper bound on the union; after an even number, a
          lower bound (the Bonferroni inequalities). The first, <M>{"|\\bigcup A_i| \\le \\sum |A_i|"}</M>, is the{" "}
          <strong>union bound</strong>, used constantly in probability and learning theory.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: <p>Of 100 students, 60 take maths, 45 take physics and 25 take both. How many take neither?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "div",
      rung: "check",
      prompt: <p>How many integers from 1 to 1000 are divisible by 3 or by 7?</p>,
      answer: { kind: "numeric", value: 428 },
    },
    {
      key: "three",
      rung: "apply",
      prompt: <p>How many integers from 1 to 1000 are divisible by none of 2, 3 and 5?</p>,
      answer: { kind: "numeric", value: 266 },
    },
    {
      key: "derange",
      rung: "apply",
      prompt: <p>How many permutations of 5 items leave no item in its original place?</p>,
      answer: { kind: "numeric", value: 44 },
    },
    {
      key: "onto",
      rung: "apply",
      prompt: <p>How many functions from a 5-element set onto a 3-element set are there?</p>,
      answer: { kind: "numeric", value: 150 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`N = 100
print(sum(1 for x in range(1, N + 1) if x % 2 == 0 or x % 3 == 0), N // 2 + N // 3 - N // 6)`}</Code>
          <p>Counting multiples of 2 or 3 up to 100, directly and by inclusion-exclusion. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["67 67", "83 83", "67 83", "66 67"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`N = 30
A = {n for n in range(1, N + 1) if n % 2 == 0}
B = {n for n in range(1, N + 1) if n % 3 == 0}
C = {n for n in range(1, N + 1) if n % 5 == 0}
print(len(A | B | C), len(A) + len(B) + len(C) - len(A & B) - len(A & C) - len(B & C) + len(A & B & C), N - len(A | B | C))`}</Code>
          <p>Numbers up to 30 divisible by 2, 3 or 5, counted two ways. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["22 22 8", "31 22 8", "22 21 8", "22 22 7"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>count_divisible(N, divisors)</C>, the number of integers from 1 to N divisible by at least one of the given pairwise coprime divisors, by inclusion-exclusion over all non-empty subsets (use <C>itertools.combinations</C>), and <C>derangements(n)</C>, the number of permutations of n items with no fixed point.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def count_divisible(N, divisors):
    return sum(N // d for d in divisors)

def derangements(n):
    return 0
`,
        solution: `from itertools import combinations
from math import comb, factorial, prod

def count_divisible(N, divisors):
    total = 0
    for r in range(1, len(divisors) + 1):
        for S in combinations(divisors, r):
            total += (-1) ** (r + 1) * (N // prod(S))
    return total

def derangements(n):
    return sum((-1) ** k * comb(n, k) * factorial(n - k) for k in range(n + 1))
`,
        tests: [
          { name: "divisible", code: `assert count_divisible(1000, [2, 3, 5]) == sum(1 for x in range(1, 1001) if x % 2 == 0 or x % 3 == 0 or x % 5 == 0), 'Alternate signs over subsets of divisors.'` },
          { name: "derange", code: `from itertools import permutations
assert [derangements(n) for n in range(7)] == [1, 0, 1, 2, 9, 44, 265] and derangements(6) == sum(1 for p in permutations(range(6)) if all(p[i] != i for i in range(6))), 'D(4) = 9 and D(5) = 44.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Three classic inclusion–exclusion counts. Write <C>derangements(n)</C>, the permutations of n items with no fixed point, Σ (−1)ᵏ C(n, k)(n − k)!; <C>surjections(n, k)</C>, the functions from an n-set onto a k-set, Σ (−1)ʲ C(k, j)(k − j)ⁿ; and <C>euler_phi(n)</C>, how many of 1 … n are coprime to n, by removing the multiples of each prime factor of n (factor n by trial division).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from math import factorial

def derangements(n):
    return factorial(n)

def surjections(n, k):
    return k ** n

def euler_phi(n):
    return n - 1
`,
        solution: `from math import comb, factorial

def derangements(n):
    return sum((-1) ** k * comb(n, k) * factorial(n - k) for k in range(n + 1))

def surjections(n, k):
    return sum((-1) ** j * comb(k, j) * (k - j) ** n for j in range(k + 1))

def euler_phi(n):
    r, m, q = n, n, 2
    while q * q <= m:
        if m % q == 0:
            while m % q == 0:
                m //= q
            r -= r // q
        q += 1
    if m > 1:
        r -= r // m
    return r
`,
        tests: [
          { name: "derangements", code: `from itertools import permutations
assert [derangements(n) for n in range(7)] == [1, 0, 1, 2, 9, 44, 265], 'D(0) = 1, D(1) = 0, D(2) = 1, …'
assert derangements(7) == sum(all(q[i] != i for i in range(7)) for q in permutations(range(7)))` },
          { name: "surjections", code: `from itertools import product
from math import factorial
for n in range(6):
    for k in range(5):
        assert surjections(n, k) == sum(len(set(f)) == k for f in product(range(k), repeat=n)), f'n={n}, k={k}'
assert surjections(8, 8) == factorial(8) and surjections(3, 4) == 0` },
          { name: "phi", code: `from math import gcd
assert all(euler_phi(n) == sum(gcd(i, n) == 1 for i in range(1, n + 1)) for n in range(1, 300)), 'Agree with a direct count.'
assert euler_phi(36) == 12 and euler_phi(1000000000039) == 1000000000038, '10¹² + 39 is prime.'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove the formula for <M>{"|A \\cup B \\cup C|"}</M> by checking how many times an element lying in exactly one, two
          or three of the sets is counted on the right-hand side.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "An element in exactly one set is counted once by the single terms and never by intersections.",
          "An element in exactly two sets is counted 2 − 1 = 1 times.",
          "An element in all three is counted 3 − 3 + 1 = 1 times, and elements in none contribute 0, so both sides agree.",
        ],
      },
    },
    {
      key: "hats",
      rung: "stretch",
      prompt: <p>Six people check their hats and get them back at random. What is the probability that exactly two people get their own hat? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1875, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why inclusion-exclusion alternates signs, using three overlapping sets, and how it counts the arrangements where no letter reaches its envelope.",

  glimpse: (
    <p>
      In Probability the same formula holds with P in place of | · |, and the union bound, its first term, controls the chance
      that any of many bad events happens. Learning theory uses it to bound the chance that any of many hypotheses looks good
      by luck.
    </p>
  ),
};
