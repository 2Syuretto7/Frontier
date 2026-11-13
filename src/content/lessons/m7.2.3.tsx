import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TailSumViz } from "@/components/viz/TailSumViz";
import type { LessonContent } from "@/lib/types";

const EXPECT = `from fractions import Fraction

def expect(dist, g=lambda x: x):
    return sum(g(x) * p for x, p in dist.items())

def tail_sum_mean(dist):
    top = max(dist)
    return sum(sum(p for x, p in dist.items() if x >= k) for k in range(1, top + 1))`;

const INDIC = `def count_runs(seq):
    return 1 + sum(a != b for a, b in zip(seq, seq[1:]))

def expected_runs(n, p):
    return 1 + (n - 1) * 2 * p * (1 - p)

def expected_distinct(n, k):
    return n * (1 - (1 - 1 / n) ** k)`;

export const lesson: LessonContent = {
  id: "m7.2.3",
  minutes: 60,
  links: {
    requires: ["m7.2.2", "m4.6.3"],
    revisits: ["m0.8.4"],
    foreshadows: ["m7.2.4", "m7.4.2", "m7.6.1"],
  },

  puzzle: (
    <>
      <p>
        365 people each have a birthday chosen uniformly at random. How many different birthdays are there among them, on
        average? The distribution of that count is a mess, but its average takes one line. And a casino offers a game whose
        average payout is infinite: toss a coin until heads, and receive <M>{"2^k"}</M> rupees if that takes k tosses. How
        much would you pay to play?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The expectation is the probability-weighted average of the values, the balance point of the pmf. Two facts make it
        powerful. It is linear, whatever the dependence between the pieces, so complicated counts can be broken into
        indicators. And it can be computed by summing tail probabilities, which are often simpler than point probabilities.
      </p>
      <TailSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="expectation">
        <p>
          For discrete X, <M>{"E[X] = \\sum_x x\\,P(X = x)"}</M>, provided <M>{"\\sum_x |x|P(X = x) < \\infty"}</M>. If X ≥ 0
          the sum always makes sense, possibly as +∞.
        </p>
      </Definition>
      <Remark title="the St Petersburg game">
        <p>
          The payout <M>{"2^k"}</M> has probability <M>{"2^{-k}"}</M>, so every term of the sum is 1 and E = ∞. Yet few people
          would pay even ₹50. Infinite expectations are possible, averages of repeated plays grow without settling, and the
          resolution of the paradox lies in utility and in the casino&apos;s finite bank, not in the arithmetic.
        </p>
      </Remark>

      <Theorem title="law of the unconscious statistician">
        <p>
          <M>{"E[g(X)] = \\sum_x g(x)P(X = x)"}</M>, whenever the sum converges absolutely.
        </p>
      </Theorem>
      <Proof>
        <p>
          By definition <M>{"E[g(X)] = \\sum_y y\\,P(g(X) = y)"}</M>, and <M>{"P(g(X) = y) = \\sum_{x: g(x) = y}P(X = x)"}</M>.
          Substituting and regrouping the absolutely convergent double sum by x gives{" "}
          <M>{"\\sum_x g(x)P(X = x)"}</M>.
        </p>
      </Proof>

      <Theorem title="linearity">
        <p>
          If X and Y have finite expectations, then <M>{"E[aX + bY] = aE[X] + bE[Y]"}</M> for all constants a, b, whether or
          not X and Y are independent. Also, if X ≤ Y always, then E[X] ≤ E[Y].
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply the law of the unconscious statistician to the pair (X, Y) with g(x, y) = ax + by:{" "}
          <M>{"E[aX + bY] = \\sum_{x,y}(ax + by)P(X = x, Y = y)"}</M>. Split the sum; summing the joint pmf over y gives{" "}
          <M>{"P(X = x)"}</M>, and over x gives <M>{"P(Y = y)"}</M>, leaving <M>{"a\\sum_x xP(X = x) + b\\sum_y yP(Y = y)"}</M>.
          For monotonicity, Y − X ≥ 0 has non-negative expectation, and linearity moves it across.
        </p>
      </Proof>

      <Theorem title="tail-sum formula">
        <p>
          If X takes values in {"{0, 1, 2, …}"}, then <M>{"E[X] = \\sum_{k=1}^{\\infty}P(X \\ge k)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"x = \\sum_{k=1}^{\\infty}\\mathbf{1}[k \\le x]"}</M> for each value x. Then{" "}
          <M>{"E[X] = \\sum_x\\sum_k \\mathbf{1}[k \\le x]P(X = x)"}</M>, and since all terms are non-negative the order of
          summation can be swapped, giving <M>{"\\sum_k\\sum_{x \\ge k}P(X = x) = \\sum_k P(X \\ge k)"}</M>.
        </p>
        <Code>{EXPECT}</Code>
      </Proof>

      <Example title="the named means">
        <p>
          Bernoulli(p): E = p. Binomial(n, p) is a sum of n Bernoullis, so E = np by linearity. Geometric(p): by tail sums,{" "}
          <M>{"E = \\sum_{k \\ge 1}(1-p)^{k-1} = 1/p"}</M>. Poisson(λ):{" "}
          <M>{"\\sum_k k e^{-\\lambda}\\lambda^k/k! = \\lambda\\sum_{k \\ge 1}e^{-\\lambda}\\lambda^{k-1}/(k-1)! = \\lambda"}</M>.
        </p>
      </Example>

      <Example title="counting with indicators">
        <p>
          The number of distinct birthdays among k people is <M>{"\\sum_{d=1}^{n}\\mathbf{1}[\\text{day } d \\text{ is used}]"}</M>,
          and each day is used with probability <M>{"1 - (1 - 1/n)^k"}</M>, so the mean is{" "}
          <M>{"n(1 - (1-1/n)^k)"}</M>: about 230.9 for 365 people, roughly <M>{"365(1 - 1/e)"}</M>. The indicators are
          dependent, and it does not matter. Likewise the number of runs in n tosses is 1 plus the number of positions where
          the coin changes, giving <M>{"1 + 2(n-1)p(1-p)"}</M>.
        </p>
        <Code>{INDIC}</Code>
      </Example>

      <Theorem title="products of independent variables">
        <p>
          If X and Y are independent with finite expectations, then <M>{"E[XY] = E[X]E[Y]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"E[XY] = \\sum_{x,y}xy\\,P(X = x)P(Y = y) = \\big(\\sum_x xP(X = x)\\big)\\big(\\sum_y yP(Y = y)\\big)"}</M>, the
          rearrangement being justified by absolute convergence. The converse fails: X uniform on {"{−1, 0, 1}"} and Y = X²
          have E[XY] = 0 = E[X]E[Y], yet Y is a function of X.
        </p>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "binmean",
      rung: "check",
      prompt: <p>What is the expectation of a Binomial(20, 0.35) random variable?</p>,
      answer: { kind: "numeric", value: 7, tolerance: 0.0001 },
    },
    {
      key: "distinct",
      rung: "check",
      prompt: <p>A die is rolled 10 times. What is the expected number of different faces that appear? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 5.031, tolerance: 0.0001 },
    },
    {
      key: "uncorr",
      rung: "apply",
      prompt: <p>X is uniform on {"{−1, 0, 1}"} and Y = X². Which is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "E[XY] = E[X]E[Y], but X and Y are not independent.",
          "X and Y are independent.",
          "E[XY] ≠ E[X]E[Y].",
          "E[Y] = E[X]².",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def expect(dist, g=lambda x: x):
    return sum(g(x) * p for x, p in dist.items())

def tail_sum_mean(dist):
    top = max(dist)
    return sum(sum(p for x, p in dist.items() if x >= k) for k in range(1, top + 1))

die = {x: Fraction(1, 6) for x in range(1, 7)}
print(expect(die), expect(die, lambda x: x * x), expect(die, lambda x: (x - 3.5) ** 2))
geo = {k: Fraction(1, 2) ** k for k in range(1, 30)}
print(tail_sum_mean(die), round(float(tail_sum_mean(geo)), 6), tail_sum_mean({0: Fraction(1)}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7/2 91/6 2.9166666666666665\n7/2 2.0 0",
          "7/2 49/4 2.9166666666666665\n7/2 2.0 0",
          "7/2 91/6 2.9166666666666665\n5/2 2.0 0",
          "7/2 91/6 2.9166666666666665\n7/2 1.0 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def count_runs(seq):
    return 1 + sum(a != b for a, b in zip(seq, seq[1:]))

def expected_runs(n, p):
    return 1 + (n - 1) * 2 * p * (1 - p)

def expected_distinct(n, k):
    return n * (1 - (1 - 1 / n) ** k)

print(count_runs('HHTHTT'), count_runs('H'), expected_runs(6, 0.5))
print(round(expected_distinct(365, 365), 1), round(expected_distinct(10, 1), 6))
rng = np.random.default_rng(0)
print(round(np.mean([len(set(rng.integers(0, 10, 10))) for _ in range(20000)]), 1), round(expected_distinct(10, 10), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4 1 3.5\n230.9 1.0\n6.5 6.51", "3 1 3.5\n230.9 1.0\n6.5 6.51", "4 1 3.0\n230.9 1.0\n6.5 6.51", "4 1 3.5\n182.5 1.0\n6.5 6.51"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expect(dist, g=lambda x: x)</C>, which computes E[g(X)] from a pmf dict by the law of the unconscious
          statistician, and <C>tail_sum_mean(dist)</C>, which computes E[X] for a variable with values in 0, 1, 2, … as the sum
          of P(X ≥ k) for k ≥ 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def expect(dist, g=lambda x: x):
    return 0

def tail_sum_mean(dist):
    return 0
`,
        solution: EXPECT,
        tests: [
          { name: "lotus", code: `die = {x: Fraction(1, 6) for x in range(1, 7)}
assert expect(die) == Fraction(7, 2) and expect(die, lambda x: x * x) == Fraction(91, 6)
assert expect({-1: Fraction(1, 3), 0: Fraction(1, 3), 1: Fraction(1, 3)}, abs) == Fraction(2, 3)` },
          { name: "tail sums", code: `from math import comb
b = {k: Fraction(comb(5, k), 32) for k in range(6)}
assert tail_sum_mean(b) == expect(b) == Fraction(5, 2)
assert tail_sum_mean({0: Fraction(1, 2), 3: Fraction(1, 2)}) == Fraction(3, 2)
g = {k: Fraction(1, 3) * Fraction(2, 3) ** (k - 1) for k in range(1, 60)}
assert abs(float(tail_sum_mean(g)) - 3) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>count_runs(seq)</C>, the number of maximal blocks of equal consecutive symbols in a non-empty sequence;{" "}
          <C>expected_runs(n, p)</C>, its mean for n independent tosses with P(heads) = p, by indicators; and{" "}
          <C>expected_distinct(n, k)</C>, the mean number of distinct values among k uniform draws from n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def count_runs(seq):
    return len(seq)

def expected_runs(n, p):
    return n * p

def expected_distinct(n, k):
    return min(n, k)
`,
        solution: INDIC,
        tests: [
          { name: "runs", code: `from itertools import product
assert count_runs('HHTHTT') == 4 and count_runs('H') == 1 and count_runs([1, 1, 1]) == 1
for n, p in [(4, 0.5), (5, 0.3)]:
    exact = sum(count_runs(s) * p ** s.count('H') * (1 - p) ** s.count('T') for s in map(''.join, product('HT', repeat=n)))
    assert abs(exact - expected_runs(n, p)) < 1e-12` },
          { name: "distinct", code: `from itertools import product
assert abs(expected_distinct(10, 1) - 1) < 1e-12 and abs(expected_distinct(365, 365) - 230.908) < 0.001
exact = sum(len(set(t)) for t in product(range(4), repeat=3)) / 4 ** 3
assert abs(expected_distinct(4, 3) - exact) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if X takes values in {"{0, 1, 2, …}"}, then <M>{"E[X] = \\sum_{k \\ge 1}P(X \\ge k)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes P(X ≥ k) = Σ_{x ≥ k} P(X = x), so the right side is a double sum over pairs 1 ≤ k ≤ x.",
          "Justifies exchanging the order of summation (all terms non-negative).",
          "Notes that for each x the number of k with 1 ≤ k ≤ x is x, giving Σ x P(X = x) = E[X].",
        ],
      },
    },
    {
      key: "empty",
      rung: "stretch",
      prompt: <p>20 balls are thrown independently and uniformly into 10 boxes. What is the expected number of empty boxes? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.2158, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what the expectation of a discrete random variable is, why linearity holds even for dependent variables, how indicators turn counting problems into one-line expectations, and where the tail-sum formula comes from.",

  glimpse: (
    <>
      <p>
        The expectation locates a distribution but says nothing about its spread. The next lesson measures spread with the
        variance, where independence, irrelevant for linearity of means, becomes essential. Later, Markov&apos;s inequality
        turns a known mean into a bound on tail probabilities.
      </p>
    </>
  ),
};
