import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ExpectedValueViz } from "@/components/viz/ExpectedValueViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.6.3",
  minutes: 60,
  links: {
    requires: ["m4.6.2", "m0.8.4"],
    foreshadows: ["m4.6.4", "m7.2.3", "e2.5.1"],
  },

  puzzle: (
    <>
      <p>
        Shuffle a deck and turn the cards over one by one while counting 1, 2, …, 52. How many times, on average, does the card
        you turn match the number you say (taking A = 1, J = 11, Q = 12, K = 13, and counting modulo 13)? Working out the full
        distribution is a nightmare. The average takes one line.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The expected value is the long-run average of a random quantity: each value weighted by its probability. Set the
        prizes on the die below and play the game many times; the running average settles at the expected value.
      </p>
      <ExpectedValueViz />
    </>
  ),

  theory: (
    <>
      <Definition title="random variable and expectation">
        <p>
          A <strong>random variable</strong> is a function X from the sample space to the real numbers. On a finite sample space
          its <strong>expectation</strong> is{" "}
          <M>{"E[X] = \\sum_\\omega X(\\omega)p(\\omega) = \\sum_x x\\,P(X = x)"}</M>.
        </p>
      </Definition>

      <Theorem title="linearity of expectation">
        <p>
          For any random variables X and Y and constants a, b, <M>{"E[aX + bY] = aE[X] + bE[Y]"}</M>. No independence is
          needed.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"E[aX + bY] = \\sum_\\omega (aX(\\omega) + bY(\\omega))p(\\omega) = a\\sum_\\omega X(\\omega)p(\\omega) + b\\sum_\\omega Y(\\omega)p(\\omega)"}</M>.
        </p>
      </Proof>

      <Definition title="indicator variables">
        <p>
          The <strong>indicator</strong> of an event A is the random variable <M>{"\\mathbf 1_A"}</M> equal to 1 on A and 0
          elsewhere. Its expectation is <M>{"E[\\mathbf 1_A] = P(A)"}</M>.
        </p>
      </Definition>

      <Theorem title="counting by indicators">
        <p>
          If X counts how many of the events <M>{"A_1, \\dots, A_n"}</M> occur, then{" "}
          <M>{"E[X] = \\sum_i P(A_i)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>X is the sum of the indicators <M>{"\\mathbf 1_{A_i}"}</M>; apply linearity.</p>
      </Proof>

      <Example title="the matching cards">
        <p>
          Let <M>{"A_i"}</M> be the event that card i matches its count. Each card position is equally likely to hold any of the
          13 ranks, so <M>{"P(A_i) = 4/52 = 1/13"}</M>, and the expected number of matches is 52 / 13 = 4. The events are far
          from independent, but linearity does not care.
        </p>
      </Example>

      <Example title="the coupon collector">
        <p>
          A cereal box contains one of n toys at random. Once you have i different toys, a new box gives a new toy with
          probability (n − i)/n, so on average you wait n/(n − i) boxes. Summing,{" "}
          <M>{"E[\\text{boxes}] = n(1 + \\tfrac12 + \\dots + \\tfrac1n) \\approx n\\ln n"}</M>. For n = 50 that is about 225.
        </p>
      </Example>

      <Example title="expected comparisons in quicksort">
        <p>
          Randomised quicksort compares the i-th and j-th smallest elements exactly when one of them is the first pivot chosen
          from the j − i + 1 elements between them, which has probability 2/(j − i + 1). Summing the indicators gives about{" "}
          <M>{"2n\\ln n"}</M> comparisons on average.
        </p>
      </Example>

      <Remark title="expectation is not typical">
        <p>
          The expected value need not be a possible value (a die averages 3.5) and can be dominated by rare large outcomes. A
          lottery ticket with a tiny chance of a huge prize can have a large expected value and still almost always lose.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>What is the expected total of three fair dice?</p>,
      answer: { kind: "numeric", value: 10.5 },
    },
    {
      key: "heads",
      rung: "check",
      prompt: <p>A coin with P(heads) = 0.3 is tossed 50 times. What is the expected number of heads?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "fixed",
      rung: "apply",
      prompt: <p>A random permutation of 20 items is chosen. What is the expected number of items left in their original place?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "coupon",
      rung: "apply",
      prompt: <p>How many rolls of a fair die do you expect to need to see all six faces? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 14.7, tolerance: 0.01 },
    },
    {
      key: "runs",
      rung: "apply",
      prompt: <p>A fair coin is tossed 10 times. What is the expected number of places where a toss differs from the one before it?</p>,
      answer: { kind: "numeric", value: 4.5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(0)
trials = 20000
total = 0
for _ in range(trials):
    p = list(range(10))
    random.shuffle(p)
    total += sum(1 for i in range(10) if p[i] == i)
print(round(total / trials, 1))`}</Code>
          <p>The average number of fixed points of a random permutation of 10 items, over many shuffles. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.0, tolerance: 0.051 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
vals = range(1, 7)
E = Fraction(sum(vals), 6)
E2 = Fraction(sum(v * v for v in vals), 6)
print(E, E2 - E ** 2, 2 * E)`}</Code>
          <p>Mean and variance of one die, and the mean of the total of two. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["7/2 35/12 7", "7/2 91/6 7", "7/2 35/12 7/2", "3 35/12 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>coupon_expected(n)</C>, the exact expected number of draws to collect all n coupons, n(1 + 1/2 + … + 1/n), as a <C>Fraction</C>, and <C>coupon_simulate(n, trials, seed)</C>, which seeds <C>random</C>, simulates the collector <C>trials</C> times with <C>random.randrange(n)</C>, and returns the average.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def coupon_expected(n):
    return Fraction(n)

def coupon_simulate(n, trials, seed):
    return float(n)
`,
        solution: `import random
from fractions import Fraction

def coupon_expected(n):
    return n * sum(Fraction(1, k) for k in range(1, n + 1))

def coupon_simulate(n, trials, seed):
    random.seed(seed)
    total = 0
    for _ in range(trials):
        seen, draws = set(), 0
        while len(seen) < n:
            seen.add(random.randrange(n))
            draws += 1
        total += draws
    return total / trials
`,
        tests: [
          { name: "exact", code: `from fractions import Fraction
assert coupon_expected(6) == Fraction(147, 10) and coupon_expected(1) == 1, 'For a die, 14.7 rolls on average.'` },
          { name: "simulate", code: `assert abs(coupon_simulate(6, 20000, 1) - 14.7) < 0.2, 'The simulated average should be close to the exact expectation.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>expected_max(k, sides)</C>, the exact expected maximum of k fair dice with the given number of sides, using P(max ≤ m) = (m/sides)ᵏ so that P(max = m) is a difference of two such terms. Then write <C>expected_records(n)</C>, the expected number of left-to-right maxima (records) in a uniformly random permutation of n items: by linearity, position i is a record with probability 1/i. Return <C>Fraction</C>s.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def expected_max(k, sides):
    return Fraction(sides + 1, 2)

def expected_records(n):
    return Fraction(1)
`,
        solution: `from fractions import Fraction

def expected_max(k, sides):
    return sum(m * Fraction(m ** k - (m - 1) ** k, sides ** k) for m in range(1, sides + 1))

def expected_records(n):
    return sum((Fraction(1, i) for i in range(1, n + 1)), Fraction(0))
`,
        tests: [
          { name: "dice", code: `from fractions import Fraction
assert expected_max(1, 6) == Fraction(7, 2) and expected_max(2, 6) == Fraction(161, 36) and isinstance(expected_max(3, 6), Fraction), 'Two dice: 161/36.'` },
          { name: "brute max", code: `from itertools import product
from fractions import Fraction
for k in range(1, 5):
    for s in (2, 3, 4):
        rolls = list(product(range(1, s + 1), repeat=k))
        assert expected_max(k, s) == Fraction(sum(max(r) for r in rolls), len(rolls)), f'k={k}, sides={s}'` },
          { name: "records", code: `from itertools import permutations
from fractions import Fraction
for n in range(1, 7):
    ps = list(permutations(range(n)))
    want = Fraction(sum(sum(1 for i in range(n) if q[i] == max(q[:i + 1])) for q in ps), len(ps))
    assert expected_records(n) == want, f'n = {n}'
assert expected_records(3) == Fraction(11, 6) and expected_records(0) == 0` },
        ],
      },
    },
    {
      key: "linear",
      rung: "prove",
      prompt: <p>Prove that the expected number of fixed points of a uniformly random permutation of n items is 1, using indicators.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines the indicator Xᵢ of the event that item i stays in place.",
          "Computes P(item i fixed) = (n − 1)!/n! = 1/n.",
          "Sums by linearity to get n · (1/n) = 1, noting independence is not needed.",
        ],
      },
    },
    {
      key: "birthday",
      rung: "stretch",
      prompt: <p>In a group of 30 people with 365 equally likely birthdays, what is the expected number of pairs who share a birthday? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 1.192, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend linearity of expectation and how indicator variables turn a hard average, like the number of matching cards, into a one-line sum.",

  glimpse: (
    <p>
      Next, the probabilistic method, which uses expectation to prove that objects exist. Probability develops expectation and
      variance in full, and Data Structures and Algorithms uses indicator variables to analyse randomised quicksort and hash
      tables.
    </p>
  ),
};
