import { M } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PascalViz } from "@/components/viz/PascalViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.1.3",
  minutes: 60,
  links: {
    requires: ["m4.1.2", "m0.7.5", "m1.5.1"],
    foreshadows: ["m4.2.3", "m7.2.2"],
  },

  puzzle: (
    <>
      <p>
        Add up a row of Pascal&rsquo;s triangle: 1 + 4 + 6 + 4 + 1 = 16. Every row seems to give a power of 2. Why? And why
        is each entry the sum of the two above it?
      </p>
      <p>
        You could push algebra through factorials. There is a better way: find a set that both sides of the equation count.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <M>{"\\binom{n}{k}"}</M> counts k-element subsets of an n-element set. An identity between such numbers is usually a
        statement that two ways of counting the same collection of subsets agree. Pascal&rsquo;s rule splits the subsets by
        whether they contain one chosen element. Look at the triangle below with that in mind.
      </p>
      <PascalViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Pascal's rule">
        <p>
          For <M>{"1 \\le k \\le n"}</M>, <M>{"\\displaystyle \\binom{n+1}{k} = \\binom{n}{k-1} + \\binom{n}{k}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Count the k-subsets of <M>{"\\{1, \\dots, n+1\\}"}</M>. Those containing n + 1 are fixed by choosing the other k − 1
          elements from <M>{"\\{1, \\dots, n\\}"}</M>: <M>{"\\binom{n}{k-1}"}</M> of them. Those not containing n + 1 are
          k-subsets of <M>{"\\{1, \\dots, n\\}"}</M>: <M>{"\\binom{n}{k}"}</M>. The two kinds are disjoint and cover
          everything, so the sum rule finishes the proof.
        </p>
      </Proof>

      <Theorem title="the binomial theorem">
        <p>
          <M>{"\\displaystyle (x + y)^n = \\sum_{k=0}^{n} \\binom{n}{k} x^k y^{n-k}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expanding the product of n brackets <M>{"(x+y)(x+y)\\cdots(x+y)"}</M> picks x or y from each bracket. A term{" "}
          <M>{"x^k y^{n-k}"}</M> arises once for each choice of which k brackets supply x, and there are{" "}
          <M>{"\\binom{n}{k}"}</M> such choices.
        </p>
      </Proof>

      <Theorem title="consequences">
        <p>
          Putting x = y = 1 gives <M>{"\\sum_k \\binom{n}{k} = 2^n"}</M>: all subsets, counted by size. Putting x = −1, y = 1
          gives <M>{"\\sum_k (-1)^k \\binom{n}{k} = 0"}</M> for n ≥ 1: an n-element set has as many even-sized subsets as
          odd-sized ones.
        </p>
      </Theorem>

      <Theorem title="Vandermonde's identity">
        <p>
          <M>{"\\displaystyle \\binom{m+n}{r} = \\sum_{k=0}^{r} \\binom{m}{k}\\binom{n}{r-k}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Choose r people from a group of m women and n men. Split by the number k of women chosen: there are{" "}
          <M>{"\\binom{m}{k}\\binom{n}{r-k}"}</M> such committees, and summing over k counts every committee once.
        </p>
      </Proof>

      <Theorem title="the hockey stick">
        <p>
          <M>{"\\displaystyle \\sum_{j=r}^{n} \\binom{j}{r} = \\binom{n+1}{r+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The right side counts (r + 1)-subsets of <M>{"\\{1, \\dots, n+1\\}"}</M>. Classify each by its largest element, j +
          1. The other r elements are chosen from <M>{"\\{1, \\dots, j\\}"}</M>, in <M>{"\\binom{j}{r}"}</M> ways, and j ranges
          from r to n.
        </p>
      </Proof>

      <Example title="a sum by the hockey stick">
        <p>
          <M>{"1 + 2 + \\dots + n = \\binom{1}{1} + \\binom{2}{1} + \\dots + \\binom{n}{1} = \\binom{n+1}{2} = \\tfrac{n(n+1)}{2}"}</M>.
        </p>
      </Example>

      <Remark title="double counting">
        <p>
          The method in every proof here is <strong>double counting</strong>: describe one set, count it two ways, and equate.
          It often explains an identity where algebra only verifies it. The identity <M>{"k\\binom{n}{k} = n\\binom{n-1}{k-1}"}</M>
          counts committees of k with a chair: choose the committee then the chair, or the chair first then the other k − 1.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "row",
      rung: "check",
      prompt: <p>What is the sum of the entries in row 10 of Pascal&rsquo;s triangle (the row with 11 entries)?</p>,
      answer: { kind: "numeric", value: 1024 },
    },
    {
      key: "coef",
      rung: "check",
      prompt: <p>What is the coefficient of x³ in (1 + x)⁷?</p>,
      answer: { kind: "numeric", value: 35 },
    },
    {
      key: "coef2",
      rung: "apply",
      prompt: <p>What is the coefficient of x²y³ in (2x − y)⁵?</p>,
      answer: { kind: "numeric", value: -40 },
    },
    {
      key: "vander",
      rung: "apply",
      prompt: <p>Use Vandermonde&rsquo;s identity to find the sum of the squares of the entries of row 6: <M>{"\\sum_k \\binom{6}{k}^2"}</M>.</p>,
      answer: { kind: "numeric", value: 924 },
    },
    {
      key: "hockey",
      rung: "apply",
      prompt: <p>Find <M>{"\\binom{2}{2} + \\binom{3}{2} + \\dots + \\binom{10}{2}"}</M>.</p>,
      answer: { kind: "numeric", value: 165 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb
print(sum(comb(8, k) for k in range(9)), sum((-1) ** k * comb(8, k) for k in range(9)), comb(9, 4) == comb(8, 3) + comb(8, 4))`}</Code>
          <p>Three identities checked for n = 8. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["256 0 True", "256 1 True", "255 0 True", "256 0 False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pascal(n)</C>, which returns rows 0 to n of Pascal&rsquo;s triangle as a list of lists, building each row from the one above with Pascal&rsquo;s rule. Do not use <C>math.comb</C> or factorials.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def pascal(n):
    return [[1] * (i + 1) for i in range(n + 1)]
`,
        solution: `def pascal(n):
    rows = [[1]]
    for _ in range(n):
        prev = rows[-1]
        rows.append([1] + [prev[i] + prev[i + 1] for i in range(len(prev) - 1)] + [1])
    return rows
`,
        tests: [
          { name: "small", code: `assert pascal(4) == [[1], [1, 1], [1, 2, 1], [1, 3, 3, 1], [1, 4, 6, 4, 1]], 'Each entry is the sum of the two above it.'` },
          { name: "comb", code: `import math
rows = pascal(20)
assert all(rows[n][k] == math.comb(n, k) for n in range(21) for k in range(n + 1)), 'Row n should hold C(n, k).'` },
          { name: "vandermonde", code: `rows = pascal(12)
assert sum(x * x for x in rows[6]) == rows[12][6], 'Sum of squares of row 6 equals C(12, 6).'` },
        ],
      },
    },
    {
      key: "chair",
      rung: "prove",
      prompt: (
        <p>
          Prove <M>{"\\sum_{k=0}^{n} k\\binom{n}{k} = n\\,2^{n-1}"}</M> by double counting pairs (committee, chair of the
          committee) drawn from n people.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Counting committees by size: a committee of k has k choices of chair, giving the sum of k·C(n, k).",
          "Counting chair first: n choices of chair, then any subset of the other n − 1 people joins, giving n·2ⁿ⁻¹.",
          "Concludes the two counts of the same set are equal.",
        ],
      },
    },
    {
      key: "even",
      rung: "stretch",
      prompt: <p>How many subsets of a 12-element set have an even number of elements (including the empty set)?</p>,
      answer: { kind: "numeric", value: 2048 },
    },
  ],

  teachBack:
    "Explain to a friend how to prove an identity by counting one set in two ways, using Pascal's rule and the fact that each row of Pascal's triangle sums to a power of 2.",

  glimpse: (
    <p>
      Generating functions, later in this course, turn the binomial theorem into a general tool for counting. The binomial
      distribution in Probability gives the chance of k successes in n trials as <M>{"\\binom{n}{k}p^k(1-p)^{n-k}"}</M>, and the
      fact that these sum to 1 is the binomial theorem with x = p and y = 1 − p.
    </p>
  ),
};
