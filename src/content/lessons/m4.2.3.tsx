import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CoinGenViz } from "@/components/viz/CoinGenViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.2.3",
  minutes: 70,
  links: {
    requires: ["m4.2.2", "m4.1.3", "m2.8.4"],
    foreshadows: ["m7.4.1", "e2.7.3"],
  },

  puzzle: (
    <>
      <p>
        In how many ways can you pay 20 rupees with 1-, 2- and 5-rupee coins? You could list the cases. But what if the
        amount were 1000, or the coins were different?
      </p>
      <p>
        There is a device that packages an entire sequence of answers into one function, so that combining choices becomes
        multiplying functions.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write the ways to use 2-rupee coins as <M>{"1 + x^2 + x^4 + \\cdots"}</M>: the exponent records the amount paid. When
        you multiply such series, exponents add, so the coefficient of <M>{"x^n"}</M> in the product counts the ways to reach n
        in total. Toggle the coins below and click a bar to read off a count.
      </p>
      <CoinGenViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ordinary generating function">
        <p>
          The <strong>generating function</strong> of a sequence <M>{"a_0, a_1, a_2, \\dots"}</M> is the formal power series{" "}
          <M>{"A(x) = \\sum_{n \\ge 0} a_n x^n"}</M>. &ldquo;Formal&rdquo; means x is a placeholder: we add and multiply series
          by collecting coefficients and need not worry about convergence.
        </p>
      </Definition>

      <Theorem title="the product rule for generating functions">
        <p>
          If <M>{"A(x)"}</M> counts objects of type A by size and <M>{"B(x)"}</M> counts objects of type B, then the coefficient
          of <M>{"x^n"}</M> in <M>{"A(x)B(x)"}</M>, which is <M>{"\\sum_{k=0}^{n} a_k b_{n-k}"}</M>, counts pairs (one of each)
          of total size n.
        </p>
      </Theorem>
      <Proof>
        <p>
          A pair of total size n has the A part of some size k and the B part of size n − k; for each k there are{" "}
          <M>{"a_k b_{n-k}"}</M> such pairs, and the sum rule adds over k. That sum is exactly the coefficient of{" "}
          <M>{"x^n"}</M> when the two series are multiplied.
        </p>
      </Proof>

      <Example title="the basic series">
        <p>
          <M>{"\\dfrac{1}{1 - x} = 1 + x + x^2 + \\cdots"}</M>, since <M>{"(1 - x)(1 + x + x^2 + \\cdots) = 1"}</M>. Replacing
          x by <M>{"x^c"}</M>: <M>{"\\dfrac{1}{1 - x^c} = 1 + x^c + x^{2c} + \\cdots"}</M>, the ways to use any number of
          c-rupee coins. And <M>{"(1 + x)^n = \\sum_k \\binom{n}{k} x^k"}</M>, the binomial theorem.
        </p>
      </Example>

      <Example title="the coins">
        <p>
          The ways to make n from 1-, 2- and 5-rupee coins are the coefficients of{" "}
          <M>{"\\dfrac{1}{(1 - x)(1 - x^2)(1 - x^5)}"}</M>. For n = 20 the coefficient is 29.
        </p>
      </Example>

      <Example title="stars and bars again">
        <p>
          <M>{"\\dfrac{1}{(1 - x)^k}"}</M> is the product of k copies of <M>{"1 + x + x^2 + \\cdots"}</M>, so its{" "}
          <M>{"x^n"}</M> coefficient counts solutions of <M>{"x_1 + \\dots + x_k = n"}</M>: it is{" "}
          <M>{"\\binom{n+k-1}{k-1}"}</M>.
        </p>
      </Example>

      <Theorem title="solving a recurrence">
        <p>
          For <M>{"F(x) = \\sum F_n x^n"}</M> with <M>{"F_n = F_{n-1} + F_{n-2}"}</M>, <M>{"F_0 = 0, F_1 = 1"}</M>:{" "}
          <M>{"F(x) = \\dfrac{x}{1 - x - x^2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Multiply the recurrence by <M>{"x^n"}</M> and sum over n ≥ 2: <M>{"F(x) - F_0 - F_1 x = x(F(x) - F_0) + x^2F(x)"}</M>.
          So <M>{"F(x)(1 - x - x^2) = x"}</M>. Splitting the right side into partial fractions over the roots of{" "}
          <M>{"1 - x - x^2"}</M> and expanding each as a geometric series recovers Binet&rsquo;s formula.
        </p>
      </Proof>

      <Remark title="why this is useful">
        <p>
          Generating functions turn convolutions into products and recurrences into algebra. Their coefficients can be computed
          by machine: multiplying truncated series is exactly the dynamic programming loop that counts coin combinations. In
          probability, the same idea with <M>{"x^n"}</M> weighted by <M>{"P(X = n)"}</M> gives the probability generating
          function, and the moment generating function is its continuous cousin.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coefficient",
      rung: "check",
      prompt: <p>What is the coefficient of x⁴ in 1/(1 − x)³?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "dice",
      rung: "check",
      prompt: <p>Two dice are thrown. Using <M>{"(x + x^2 + \\dots + x^6)^2"}</M>, how many outcomes give a total of 8?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "coins",
      rung: "apply",
      prompt: <p>In how many ways can you make 10 rupees from 1-, 2- and 5-rupee coins?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "bounded",
      rung: "apply",
      prompt: <p>In how many ways can 10 be written as an ordered sum <M>{"x_1 + x_2 + x_3"}</M> with each <M>{"0 \\le x_i \\le 4"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "odd",
      rung: "apply",
      prompt: <p>How many partitions does 8 have into odd parts (order not mattering), using <M>{"\\prod_{k \\text{ odd}} 1/(1 - x^k)"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
print(np.polymul([1, 1, 1], [1, 1, 1]))`}</Code>
          <p>Multiplying (1 + x + x²) by itself. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1 2 3 2 1]", "[1 1 1 1 1]", "[1 2 1]", "[1 3 3 1]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>coin_ways(coins, n)</C>, the number of ways to make each amount 0 to n from the given coin values (any number of each, order not mattering), returned as a list of coefficients of the generating function ∏ 1/(1 − xᶜ) truncated after xⁿ. Multiply in one factor per coin.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def coin_ways(coins, n):
    return [1] * (n + 1)
`,
        solution: `def coin_ways(coins, n):
    c = [1] + [0] * n
    for k in coins:
        for i in range(k, n + 1):
            c[i] += c[i - k]
    return c
`,
        tests: [
          { name: "lesson", code: `w = coin_ways([1, 2, 5], 20)
assert w[10] == 10 and w[20] == 29, '10 ways to make 10 and 29 ways to make 20.'` },
          { name: "brute", code: `from itertools import product
brute = sum(1 for a, b, c in product(range(31), range(16), range(7)) if a + 2 * b + 5 * c == 30)
assert coin_ways([1, 2, 5], 30)[30] == brute, 'Compare with counting (a, b, c) directly.'` },
          { name: "fifty", code: `assert coin_ways([1, 2, 5, 10], 50)[50] == 341, 'Four coins make 50 in 341 ways.'` },
        ],
      },
    },
    {
      key: "derive",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"a_0 = 1"}</M> and <M>{"a_n = 2a_{n-1}"}</M> for n ≥ 1. Use the generating function <M>{"A(x)"}</M> to show{" "}
          <M>{"A(x) = 1/(1 - 2x)"}</M> and hence <M>{"a_n = 2^n"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Multiplies the recurrence by xⁿ and sums over n ≥ 1 to get A(x) − 1 = 2x A(x).",
          "Solves for A(x) = 1/(1 − 2x).",
          "Expands 1/(1 − 2x) as a geometric series with coefficients 2ⁿ and reads off aₙ.",
        ],
      },
    },
    {
      key: "change",
      rung: "stretch",
      prompt: <p>In how many ways can you make 50 rupees from 1-, 2-, 5- and 10-rupee coins?</p>,
      answer: { kind: "numeric", value: 341 },
    },
  ],

  teachBack:
    "Explain to a friend how multiplying generating functions counts combined choices, using the coins, and why the coefficient of xⁿ is the answer.",

  glimpse: (
    <p>
      Probability uses moment generating functions, which encode a distribution as a function in the same way. Data Structures
      and Algorithms computes the same coin counts with dynamic programming, which is multiplying truncated series one factor
      at a time.
    </p>
  ),
};
