import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { FactorTreeViz } from "@/components/viz/FactorTreeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.5.2",
  minutes: 65,
  links: {
    revisits: ["m0.1.1", "m1.3.3"],
  },

  puzzle: (
    <>
      <p>
        A country issues only two stamps, worth ₹4 and ₹5. Which postage amounts can be paid exactly? ₹8 can (4 + 4), ₹9 can
        (4 + 5), but ₹11 cannot. Work out a few more.
      </p>
      <p>
        You should find that from ₹12 onwards, every amount seems possible. Why? And how would you prove it for every amount,
        when knowing how to pay ₹k does not obviously tell you how to pay ₹(k + 1)?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Knowing ₹k does not help directly, but knowing ₹(k − 3) does: add a ₹4 stamp to pay ₹(k + 1). So once the four
        amounts ₹12, ₹13, ₹14, ₹15 are possible, every later amount follows, each from the one four places before it.
      </p>
      <p>
        This is <strong>strong induction</strong>: to prove the next case you may assume <em>all</em> earlier cases, not just
        the last one. Below is the most important example. Every whole number above 1 is a product of primes, because a
        number that is not prime splits into two smaller numbers, and both of those are covered by earlier cases.
      </p>
      <FactorTreeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the principle of strong induction">
        <p>Let <M>{"P(n)"}</M> be a statement about natural numbers <M>{"n \\ge a"}</M>. Suppose that for every <M>{"k \\ge a"}</M>,</p>
        <MD>{"\\text{if } P(a), P(a + 1), \\dots, P(k - 1) \\text{ are all true, then } P(k) \\text{ is true.}"}</MD>
        <p>
          Then <M>{"P(n)"}</M> is true for every <M>{"n \\ge a"}</M>. For <M>{"k = a"}</M> there are no earlier cases, so this
          includes proving <M>{"P(a)"}</M> outright. In practice, a few small cases are checked directly as base cases.
        </p>
      </Definition>

      <Theorem title="existence of prime factorisations">
        <p>Every integer <M>{"n \\ge 2"}</M> is a product of one or more primes.</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"n \\ge 2"}</M> and assume every integer m with <M>{"2 \\le m < n"}</M> is a product of primes. If n is prime,
          it is a product of one prime. Otherwise <M>{"n = ab"}</M> with <M>{"2 \\le a, b < n"}</M>. By the assumption, a and b
          are each products of primes, so their product n is too. By strong induction the claim holds for all{" "}
          <M>{"n \\ge 2"}</M>.
        </p>
      </Proof>

      <Theorem title="the stamps">
        <p>Every amount of at least ₹12 can be paid with ₹4 and ₹5 stamps.</p>
      </Theorem>
      <Proof>
        <p>
          <em>Base cases.</em> <M>{"12 = 4 + 4 + 4"}</M>, <M>{"13 = 4 + 4 + 5"}</M>, <M>{"14 = 4 + 5 + 5"}</M>,{" "}
          <M>{"15 = 5 + 5 + 5"}</M>.
        </p>
        <p>
          <em>Step.</em> Let <M>{"k \\ge 16"}</M> and assume every amount from 12 to <M>{"k - 1"}</M> can be paid. Then{" "}
          <M>{"k - 4 \\ge 12"}</M> can be paid, and adding one ₹4 stamp pays k.
        </p>
      </Proof>

      <Example title="a Fibonacci bound">
        <p>
          The Fibonacci numbers satisfy <M>{"F_1 = F_2 = 1"}</M> and <M>{"F_{k} = F_{k-1} + F_{k-2}"}</M>. Claim:{" "}
          <M>{"F_n < 2^n"}</M> for all <M>{"n \\ge 1"}</M>. Both base cases hold. For <M>{"k \\ge 3"}</M>, assuming the claim for
          all smaller cases,
        </p>
        <MD>{"F_k = F_{k-1} + F_{k-2} < 2^{k-1} + 2^{k-2} < 2^{k-1} + 2^{k-1} = 2^k."}</MD>
        <p>The step uses two earlier cases, which is why strong induction, and two base cases, are needed.</p>
      </Example>

      <Remark title="strong is not stronger">
        <p>
          Despite the name, strong induction proves nothing that ordinary induction cannot. Apply ordinary induction to the
          statement <M>{"Q(n)"}</M>: &ldquo;<M>{"P(a), \\dots, P(n)"}</M> are all true&rdquo;. The two principles are
          equivalent; strong induction is simply more convenient when a case depends on cases further back.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eleven",
      rung: "check",
      prompt: <p>With only ₹4 and ₹5 stamps, what is the largest amount that cannot be paid exactly?</p>,
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "factor",
      rung: "check",
      prompt: <p>How many prime factors, counted with repetition, does 360 have? (360 = 2 · 2 · 2 · 3 · 3 · 5.)</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "three-five",
      rung: "apply",
      prompt: <p>With ₹3 and ₹5 stamps, what is the largest amount that cannot be paid exactly?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "base-count",
      rung: "apply",
      prompt: (
        <p>
          To prove that every amount from ₹8 upwards can be paid with ₹3 and ₹5 stamps, using the step &ldquo;add a ₹3
          stamp to the amount three less&rdquo;, how many base cases must be checked directly?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "chocolate",
      rung: "apply",
      prompt: (
        <p>
          A chocolate bar is a grid of 24 squares. Each break splits one piece into two along a line. How many breaks are needed
          to separate all 24 squares, whatever order you break them in?
        </p>
      ),
      answer: { kind: "numeric", value: 23 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def factor(n):
    for d in range(2, n):
        if n % d == 0:
            return factor(d) + factor(n // d)
    return [n]
print(factor(360))`}</Code>
          <p>Strong induction justifies this recursion. How many prime factors, with repetition, does it return for 360?</p>
        </>
      ),
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reach(n):
    if n in (0, 3, 5):
        return True
    if n < 0:
        return False
    return reach(n - 3) or reach(n - 5)

print([n for n in range(1, 15) if not reach(n)], reach(23))`}</Code>
          <p>reach(n) asks whether ₹n can be paid with ₹3 and ₹5 stamps, leaning on smaller cases. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1, 2, 4, 7] True", "[1, 2, 4, 7, 11] True", "[1, 2, 4] True", "[1, 2, 4, 7] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Every amount of postage n ≥ 12 can be made from ₹4 and ₹5 stamps, by strong induction from 12, 13, 14 and 15. Write <C>stamps(n)</C>, which returns (fours, fives) recursively: base cases for 12 to 15, and stamps(n − 4) with one more ₹4 stamp otherwise.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def stamps(n):
    return (0, 0)
`,
        solution: `def stamps(n):
    base = {12: (3, 0), 13: (2, 1), 14: (1, 2), 15: (0, 3)}
    if n in base:
        return base[n]
    a, b = stamps(n - 4)
    return (a + 1, b)
`,
        tests: [
          { name: "bases", code: `assert all(4 * stamps(n)[0] + 5 * stamps(n)[1] == n for n in (12, 13, 14, 15)), 'Check the four base cases.'` },
          { name: "many", code: `assert all(4 * a + 5 * b == n and a >= 0 and b >= 0 for n in range(12, 300) for a, b in [stamps(n)]), 'Every n from 12 up should be made exactly.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Zeckendorf&rsquo;s theorem: every n ≥ 0 is a sum of distinct Fibonacci numbers (1, 2, 3, 5, 8, …) no two of which are consecutive in that list. The strong-induction proof is an algorithm: take the largest Fibonacci number f ≤ n and recurse on n − f, which is smaller than the next Fibonacci number after f minus f. Write <C>zeckendorf(n)</C>, returning the parts in decreasing order (the empty list for 0), recursively.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def zeckendorf(n):
    return [1] * n
`,
        solution: `def zeckendorf(n):
    if n == 0:
        return []
    a, b = 1, 2
    while b <= n:
        a, b = b, a + b
    return [a] + zeckendorf(n - a)
`,
        tests: [
          { name: "small", code: `assert zeckendorf(0) == [] and zeckendorf(1) == [1] and zeckendorf(4) == [3, 1] and zeckendorf(100) == [89, 8, 3], 'Take the largest Fibonacci number each time.'` },
          { name: "valid", code: `fib = [1, 2]
while fib[-1] < 10 ** 6:
    fib.append(fib[-1] + fib[-2])
pos = {f: i for i, f in enumerate(fib)}
for n in range(1, 3000):
    z = zeckendorf(n)
    assert sum(z) == n and z == sorted(z, reverse=True), f'{n}: parts must sum to n, largest first.'
    idx = [pos[f] for f in z]
    assert all(i - j >= 2 for i, j in zip(idx, idx[1:])), f'{n}: no two consecutive Fibonacci numbers.'` },
          { name: "large", code: `z = zeckendorf(10 ** 6)
assert sum(z) == 10 ** 6 and len(z) <= 15` },
        ],
      },
    },
    {
      key: "chocolate-proof",
      rung: "prove",
      prompt: <p>Prove by strong induction that a bar of n squares always needs exactly <M>{"n - 1"}</M> breaks.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks the base case n = 1: no breaks are needed.",
          "Assumes the claim for all bars with fewer than n squares.",
          "Considers the first break, splitting the bar into pieces of a and b squares with a + b = n and a, b ≥ 1.",
          "Uses the hypothesis to count 1 + (a − 1) + (b − 1) = n − 1 breaks, and concludes.",
        ],
      },
    },
    {
      key: "fib-lower",
      rung: "stretch",
      prompt: <p>Prove that <M>{"F_n \\ge (3/2)^{n-2}"}</M> for every <M>{"n \\ge 1"}</M>, where <M>{"F_1 = F_2 = 1"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Checks both base cases: F₁ = 1 ≥ (3/2)⁻¹ and F₂ = 1 ≥ (3/2)⁰.",
          "For k ≥ 3, uses the two previous cases to get Fₖ ≥ (3/2)ᵏ⁻³ + (3/2)ᵏ⁻⁴.",
          "Shows (3/2)ᵏ⁻³ + (3/2)ᵏ⁻⁴ = (3/2)ᵏ⁻⁴ · (5/2) ≥ (3/2)ᵏ⁻⁴ · (9/4) = (3/2)ᵏ⁻².",
          "Concludes by strong induction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why every whole number above 1 is a product of primes, and why ordinary induction from n − 1 would not help.",

  glimpse: (
    <p>
      The next lesson looks at induction from the opposite end: instead of climbing up from the bottom, look at the smallest case where something goes wrong. The existence of prime factorisations proved here is half of the fundamental theorem of arithmetic; the other half, uniqueness, rests on Euclid&rsquo;s algorithm for the highest common factor, which Discrete Mathematics develops.
    </p>
  ),
};
