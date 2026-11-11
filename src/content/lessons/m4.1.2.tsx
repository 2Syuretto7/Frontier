import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ChooseViz } from "@/components/viz/ChooseViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.1.2",
  minutes: 60,
  links: {
    requires: ["m4.1.1", "m0.7.4"],
    foreshadows: ["m4.1.3", "m4.6.1", "m7.2.2"],
  },

  puzzle: (
    <>
      <p>
        A cricket selector must pick a squad of 11 from 16 players, then a batting order for the 11. Are there more possible
        squads or more possible batting orders for one squad?
      </p>
      <p>
        Both are products of choices, but in one case the order matters and in the other it does not. How do you count the
        unordered case without listing anything?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Counting ordered choices is the product rule: n options, then n − 1, and so on. An unordered choice of r things is
        counted r! times among the ordered ones, once for each way to arrange it, so divide by r!. Change n and r below: the
        list shows each set once.
      </p>
      <ChooseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="permutations">
        <p>
          An <strong>r-permutation</strong> of an n-element set is an ordered list of r distinct elements. There are{" "}
          <M>{"P(n, r) = n(n-1)\\cdots(n-r+1) = \\dfrac{n!}{(n-r)!}"}</M> of them, by the product rule. In particular there are{" "}
          <M>{"n!"}</M> orderings of all n elements, with <M>{"0! = 1"}</M>.
        </p>
      </Definition>

      <Definition title="combinations">
        <p>
          An <strong>r-combination</strong> is an r-element subset. Their number is written{" "}
          <M>{"\\binom{n}{r}"}</M>, read &ldquo;n choose r&rdquo;.
        </p>
      </Definition>
      <Theorem title="the formula for n choose r">
        <p>
          <M>{"\\displaystyle \\binom{n}{r} = \\frac{n!}{r!\\,(n-r)!}"}</M> for <M>{"0 \\le r \\le n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Count the r-permutations in two ways. Directly there are <M>{"n!/(n-r)!"}</M>. Alternatively, first choose the set
          of r elements, in <M>{"\\binom{n}{r}"}</M> ways, then order it, in r! ways; each r-permutation arises exactly once.
          So <M>{"\\binom{n}{r}\\, r! = n!/(n-r)!"}</M>.
        </p>
      </Proof>
      <Remark title="the division principle">
        <p>
          The proof is an instance of a general rule: if a counting procedure produces every object exactly k times, the number
          of objects is the count divided by k. Seating n people round a table, where rotations count as the same, gives{" "}
          <M>{"n!/n = (n-1)!"}</M> arrangements.
        </p>
      </Remark>

      <Example title="the squad">
        <p>
          Squads: <M>{"\\binom{16}{11} = \\binom{16}{5} = 4368"}</M>. Batting orders for one squad:{" "}
          <M>{"11! = 39\\,916\\,800"}</M>, nearly ten thousand times more.
        </p>
      </Example>

      <Theorem title="words with repeated letters">
        <p>
          The number of distinct arrangements of n objects of which <M>{"n_1"}</M> are of one kind, <M>{"n_2"}</M> of another,
          and so on, is <M>{"\\dfrac{n!}{n_1!\\,n_2!\\cdots n_k!}"}</M>.
        </p>
      </Theorem>
      <Example title="MISSISSIPPI">
        <p>
          11 letters: one M, four I, four S, two P. Arrangements: <M>{"\\dfrac{11!}{1!\\,4!\\,4!\\,2!} = 34\\,650"}</M>.
        </p>
      </Example>

      <Theorem title="stars and bars">
        <p>
          The number of ways to write n as an ordered sum of k non-negative integers, <M>{"x_1 + \\dots + x_k = n"}</M>, is{" "}
          <M>{"\\binom{n+k-1}{k-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write n stars in a row and insert k − 1 bars to cut them into k groups, possibly empty. Each solution corresponds to
          exactly one arrangement of n stars and k − 1 bars, and such an arrangement is fixed by choosing which of the{" "}
          <M>{"n + k - 1"}</M> positions hold bars.
        </p>
      </Proof>
      <Example title="sharing sweets">
        <p>
          10 identical sweets among 3 children, some possibly getting none: <M>{"\\binom{12}{2} = 66"}</M> ways. If each child
          must get at least one, give each one first and share the remaining 7: <M>{"\\binom{9}{2} = 36"}</M>.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "podium",
      rung: "check",
      prompt: <p>In a race of 8 runners, how many ways can gold, silver and bronze be awarded?</p>,
      answer: { kind: "numeric", value: 336 },
    },
    {
      key: "committee",
      rung: "check",
      prompt: <p>How many 3-person committees can be formed from 10 people?</p>,
      answer: { kind: "numeric", value: 120 },
    },
    {
      key: "banana",
      rung: "apply",
      prompt: <p>How many distinct arrangements are there of the letters of BANANA?</p>,
      answer: { kind: "numeric", value: 60 },
    },
    {
      key: "mixed",
      rung: "apply",
      prompt: <p>A team of 5 is chosen from 6 women and 4 men, with exactly 2 men. How many teams?</p>,
      answer: { kind: "numeric", value: 120 },
    },
    {
      key: "stars",
      rung: "apply",
      prompt: <p>How many solutions in non-negative integers does x + y + z + w = 8 have?</p>,
      answer: { kind: "numeric", value: 165 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import permutations, combinations
from math import comb, perm
print(len(list(permutations(range(6), 3))) == perm(6, 3), len(list(combinations(range(6), 3))), comb(6, 3) * 6)`}</Code>
          <p>Ordered and unordered choices of 3 from 6. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True 20 120", "True 120 20", "False 20 120", "True 20 20"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>arrangements(word)</C>, the number of distinct arrangements of the letters of a word, using n!/(n₁! n₂! …), and <C>stars_and_bars(n, k)</C>, the number of solutions of x₁ + … + x_k = n in non-negative integers. Use <C>math.factorial</C> and <C>math.comb</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def arrangements(word):
    return math.factorial(len(word))

def stars_and_bars(n, k):
    return math.comb(n, k)
`,
        solution: `import math
from collections import Counter

def arrangements(word):
    out = math.factorial(len(word))
    for c in Counter(word).values():
        out //= math.factorial(c)
    return out

def stars_and_bars(n, k):
    return math.comb(n + k - 1, k - 1)
`,
        tests: [
          { name: "words", code: `assert arrangements('MISSISSIPPI') == 34650 and arrangements('BANANA') == 60 and arrangements('ABC') == 6, 'Divide by the factorial of each letter count.'` },
          { name: "brute force", code: `from itertools import permutations
assert arrangements('AABBC') == len(set(permutations('AABBC'))), 'Compare with listing every distinct arrangement.'` },
          { name: "stars", code: `from itertools import product
assert stars_and_bars(5, 3) == sum(1 for t in product(range(6), repeat=3) if sum(t) == 5) and stars_and_bars(10, 3) == 66, 'Place k − 1 bars among n + k − 1 positions.'` },
        ],
      },
    },
    {
      key: "symmetry",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\binom{n}{r} = \\binom{n}{n-r}"}</M> twice: once from the formula, and once by a bijection between
          r-element subsets and (n − r)-element subsets.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Algebra: substituting n − r for r in n!/(r!(n − r)!) gives the same expression.",
          "Bijection: sends a subset to its complement, which has n − r elements.",
          "Checks the complement map is its own inverse, so it is a bijection, and concludes the counts are equal.",
        ],
      },
    },
    {
      key: "necklace",
      rung: "stretch",
      prompt: <p>In how many ways can 6 people sit round a circular table if two particular people refuse to sit next to each other? Rotations count as the same.</p>,
      answer: { kind: "numeric", value: 72 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between permutations and combinations, and why dividing by r! turns one count into the other.",

  glimpse: (
    <p>
      Next, the identities that binomial coefficients satisfy, proved by counting the same set two ways. In Probability, the
      binomial distribution is built from <M>{"\\binom{n}{k}"}</M>, and stars and bars counts the bags of words used by simple
      language models.
    </p>
  ),
};
