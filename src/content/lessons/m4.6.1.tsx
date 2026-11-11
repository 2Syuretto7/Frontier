import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DiceGridViz } from "@/components/viz/DiceGridViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.6.1",
  minutes: 55,
  links: {
    requires: ["m4.1.2", "m4.2.1", "m0.8.3"],
    foreshadows: ["m4.6.2", "m7.1.1", "m7.1.2"],
  },

  puzzle: (
    <>
      <p>
        Two dice are rolled. A gambler in the seventeenth century noticed that a total of 9 seemed to come up less often than a
        total of 10, even though each can be made from two pairs of numbers: 3 + 6, 4 + 5 against 4 + 6, 5 + 5. Was the
        gambler imagining it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The trick is to list outcomes that are equally likely. The two dice are different objects, so 3 then 6 and 6 then 3
        are different outcomes, each with chance 1/36, while 5 then 5 happens only one way. Slide the target total below and
        count its cells.
      </p>
      <DiceGridViz mode="event" />
    </>
  ),

  theory: (
    <>
      <Definition title="sample space and events">
        <p>
          A <strong>sample space</strong> Ω is the set of possible outcomes of an experiment. An <strong>event</strong> is a
          subset of Ω. A <strong>probability</strong> on a finite Ω assigns each outcome ω a number{" "}
          <M>{"p(\\omega) \\ge 0"}</M> with <M>{"\\sum_\\omega p(\\omega) = 1"}</M>, and an event A has probability{" "}
          <M>{"P(A) = \\sum_{\\omega \\in A} p(\\omega)"}</M>.
        </p>
      </Definition>

      <Definition title="uniform probability">
        <p>
          When all outcomes are equally likely, <M>{"P(A) = |A| / |\\Omega|"}</M>: probability becomes counting, and every tool
          of this course applies.
        </p>
      </Definition>

      <Example title="the gambler">
        <p>
          With Ω the 36 ordered pairs, a total of 9 has 4 outcomes, (3, 6), (6, 3), (4, 5), (5, 4), and a total of 10 has 3,
          (4, 6), (6, 4), (5, 5). So P(9) = 4/36 and P(10) = 3/36. The gambler was right, and the mistake was to count unordered
          pairs, which are not equally likely.
        </p>
      </Example>

      <Theorem title="basic rules">
        <p>
          <M>{"P(\\Omega) = 1"}</M>, <M>{"P(\\emptyset) = 0"}</M>; <M>{"P(A^c) = 1 - P(A)"}</M>; if A ⊆ B then P(A) ≤ P(B);{" "}
          <M>{"P(A \\cup B) = P(A) + P(B) - P(A \\cap B)"}</M>; and <M>{"P(A \\cup B) \\le P(A) + P(B)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each follows from writing events as disjoint unions of outcomes and adding. For instance A and its complement are
          disjoint with union Ω, so P(A) + P(Aᶜ) = 1. The union formula is inclusion-exclusion for sums of p(ω).
        </p>
      </Proof>

      <Example title="the birthday problem">
        <p>
          With 23 people and 365 equally likely birthdays, the probability that all differ is{" "}
          <M>{"\\dfrac{365 \\cdot 364 \\cdots 343}{365^{23}} \\approx 0.493"}</M>, so the chance of a shared birthday is about
          0.507. The complement was easier to count.
        </p>
      </Example>

      <Example title="a poker hand">
        <p>
          The probability that 5 cards dealt from a shuffled deck form a flush (all one suit, including straight flushes) is{" "}
          <M>{"4\\binom{13}{5}/\\binom{52}{5} = 5148/2\\,598\\,960 \\approx 0.00198"}</M>.
        </p>
      </Example>

      <Remark title="choosing the sample space">
        <p>
          The same question can be modelled with different sample spaces. Choose one whose outcomes are equally likely if you
          want to count, and make sure every event you care about is a set of its outcomes. Infinite and continuous sample
          spaces need more care; Probability builds them from axioms.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "seven",
      rung: "check",
      prompt: <p>Two fair dice are rolled. What is the probability that the total is 7? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1667, tolerance: 0.0001 },
    },
    {
      key: "atleast",
      rung: "check",
      prompt: <p>Three fair coins are tossed. What is the probability of at least one head?</p>,
      answer: { kind: "numeric", value: 0.875 },
    },
    {
      key: "six",
      rung: "apply",
      prompt: <p>Four fair dice are rolled. What is the probability of at least one six? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.5177, tolerance: 0.0001 },
    },
    {
      key: "committee",
      rung: "apply",
      prompt: <p>A committee of 3 is chosen at random from 5 women and 4 men. What is the probability that it has exactly 2 women? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.4762, tolerance: 0.0001 },
    },
    {
      key: "birthday",
      rung: "apply",
      prompt: <p>What is the smallest number of people for which the probability that two share a birthday (365 equally likely days) exceeds 0.9?</p>,
      answer: { kind: "numeric", value: 41 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
rolls = list(product(range(1, 7), repeat=2))
print(sum(1 for a, b in rolls if a + b == 9), sum(1 for a, b in rolls if a + b == 10), len(rolls))`}</Code>
          <p>The gambler's question, settled by listing ordered outcomes. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 3 36", "2 2 36", "3 4 36", "4 3 21"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>prob(event, space)</C>, the probability of an event (a predicate) under the uniform distribution on a finite list of outcomes, returned as a <C>fractions.Fraction</C>, and <C>p_shared_birthday(n, days=365)</C>, the exact probability that n people do not all have different birthdays, as a float.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def prob(event, space):
    return Fraction(1, 2)

def p_shared_birthday(n, days=365):
    return n / days
`,
        solution: `from fractions import Fraction

def prob(event, space):
    space = list(space)
    return Fraction(sum(1 for w in space if event(w)), len(space))

def p_shared_birthday(n, days=365):
    p = 1.0
    for i in range(n):
        p *= (days - i) / days
    return 1 - p
`,
        tests: [
          { name: "dice", code: `from fractions import Fraction
from itertools import product
S = list(product(range(1, 7), repeat=2))
assert prob(lambda w: sum(w) == 9, S) == Fraction(1, 9) and prob(lambda w: sum(w) == 10, S) == Fraction(1, 12), 'Count favourable outcomes over all outcomes.'` },
          { name: "birthday", code: `assert abs(p_shared_birthday(23) - 0.5073) < 1e-4 and p_shared_birthday(1) == 0 and p_shared_birthday(366) == 1, 'Use the complement: all birthdays different.'` },
        ],
      },
    },
    {
      key: "union",
      rung: "prove",
      prompt: <p>Prove from the definition of P on a finite sample space that <M>{"P(A \\cup B) = P(A) + P(B) - P(A \\cap B)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes P(A) and P(B) as sums of p(ω) over their outcomes.",
          "Notes outcomes in A ∩ B are counted twice in P(A) + P(B), and others once.",
          "Subtracts P(A ∩ B) to count each outcome of A ∪ B exactly once.",
        ],
      },
    },
    {
      key: "fullhouse",
      rung: "stretch",
      prompt: <p>What is the probability that a 5-card hand is a full house (three of one rank and two of another)? Give it to six decimal places.</p>,
      answer: { kind: "numeric", value: 0.001441, tolerance: 0.000001 },
    },
  ],

  teachBack:
    "Explain to a friend what a sample space and an event are, and why a total of 9 with two dice is more likely than a total of 10.",

  glimpse: (
    <p>
      Next, conditional probability: how probabilities change when you learn something. Probability builds everything here on
      axioms that also cover infinite and continuous sample spaces.
    </p>
  ),
};
