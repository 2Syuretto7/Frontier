import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { DivisionViz } from "@/components/viz/DivisionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m1.5.3",
  minutes: 60,
  links: {
    revisits: ["m1.3.3", "m1.4.2"],
    foreshadows: ["m4.4.2"],
  },

  puzzle: (
    <>
      <p>Answer quickly:</p>
      <ul>
        <li>Is there a smallest positive whole number?</li>
        <li>Is there a smallest positive fraction?</li>
        <li>Is there a smallest negative integer?</li>
      </ul>
      <p>
        Only the first answer is yes. What is special about the natural numbers that guarantees a smallest element, and why
        might that be useful in a proof?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Below any positive fraction there is a smaller one (halve it), and below any negative integer there is a smaller one
        (subtract 1). But you cannot keep going down through the natural numbers forever: you hit 0. So any non-empty
        collection of natural numbers has a least member.
      </p>
      <p>
        That simple fact powers many proofs. Here is one. To divide n by d, keep subtracting d while the result stays at least
        0. The results form a set of natural numbers, and its least element is the remainder. Try it below.
      </p>
      <DivisionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the well-ordering principle">
        <p>Every non-empty set of natural numbers has a least element.</p>
      </Definition>

      <Theorem title="the division algorithm">
        <p>
          For integers <M>{"n \\ge 0"}</M> and <M>{"d \\ge 1"}</M>, there are integers q and r with
        </p>
        <MD>{"n = qd + r \\quad \\text{and} \\quad 0 \\le r < d."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"S = \\{\\, n - qd : q \\in \\mathbb{Z},\\ n - qd \\ge 0 \\,\\}"}</M>. S is a set of natural numbers, and it is
          non-empty, since <M>{"n = n - 0 \\cdot d"}</M> is in it. By well-ordering, S has a least element{" "}
          <M>{"r = n - qd"}</M>. Then <M>{"r \\ge 0"}</M>. If <M>{"r \\ge d"}</M>, then <M>{"r - d = n - (q + 1)d"}</M> would be
          a smaller element of S, a contradiction. So <M>{"0 \\le r < d"}</M>.
        </p>
      </Proof>

      <Definition title="the minimal counterexample">
        <p>
          A common way to use well-ordering: to prove <M>{"P(n)"}</M> for all natural numbers, suppose not. Then the set of
          counterexamples is non-empty, so it has a <strong>least</strong> counterexample m. Now show that m being the least
          counterexample is impossible, typically by finding a smaller one.
        </p>
      </Definition>

      <Example title="the square root of 2, again">
        <p>
          Suppose <M>{"\\sqrt 2 = a/b"}</M> with positive integers a and b. Among all such fractions choose the one with the
          least denominator b, by well-ordering. As in the earlier proof, a and b are both even, so{" "}
          <M>{"\\sqrt 2 = (a/2)/(b/2)"}</M> has the smaller denominator b/2. Contradiction. This version needs no talk of lowest
          terms: well-ordering does that work.
        </p>
      </Example>

      <Remark title="three faces of one idea">
        <p>
          Ordinary induction, strong induction and well-ordering are equivalent: assuming any one, you can prove the other two.
          For instance, induction follows from well-ordering: if <M>{"P(1)"}</M> holds and each <M>{"P(k)"}</M> gives{" "}
          <M>{"P(k + 1)"}</M>, a least counterexample m could not be 1, and <M>{"P(m - 1)"}</M> would hold, giving{" "}
          <M>{"P(m)"}</M>. Choose whichever face makes your proof clearest.
        </p>
      </Remark>

      <Remark title="infinite descent">
        <p>
          Fermat used this method, which he called <em>infinite descent</em>, to prove that no right-angled triangle with whole
          number sides has an area that is a perfect square: from any such triangle he constructed a smaller one, and an endless
          chain of ever smaller positive integers is impossible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>Which of these sets have a least element?</p>,
      answer: {
        kind: "choice",
        options: ["the even natural numbers greater than 7", "the positive rational numbers", "the negative integers", "the primes greater than 100"],
        correct: [0, 3],
      },
    },
    {
      key: "remainder",
      rung: "check",
      prompt: <p>What is the remainder when 100 is divided by 7?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "quotient",
      rung: "apply",
      prompt: <p>In <M>{"100 = q \\cdot 7 + r"}</M> with <M>{"0 \\le r < 7"}</M>, what is q?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "set-s",
      rung: "apply",
      prompt: <p>For n = 23 and d = 5, how many elements does <M>{"S = \\{\\, 23 - 5q \\ge 0 : q \\ge 0 \\,\\}"}</M> have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "minimal",
      rung: "apply",
      prompt: <p>In a minimal counterexample proof, what is the usual way to reach a contradiction?</p>,
      answer: {
        kind: "choice",
        options: [
          "Show the least counterexample is also the largest.",
          "Produce an even smaller counterexample.",
          "Check the first ten cases.",
          "Show there are infinitely many counterexamples.",
        ],
        correct: [1],
      },
    },
    {
      key: "every-n",
      rung: "prove",
      prompt: (
        <p>
          Use a minimal counterexample to prove that every integer <M>{"n \\ge 2"}</M> has at least one prime factor.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes some n ≥ 2 has no prime factor, and takes the least such m by well-ordering.",
          "Notes m is not prime (else it is its own prime factor), so m = ab with 2 ≤ a < m.",
          "Uses the minimality of m: a has a prime factor p, which then divides m.",
          "Concludes this contradicts the choice of m.",
        ],
      },
    },
    {
      key: "descent",
      rung: "stretch",
      prompt: (
        <p>
          Prove that there are no positive integers x and y with <M>{"x^2 = 3y^2"}</M>, by taking a solution with the least
          possible y and finding a smaller one.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes a solution with y least, by well-ordering.",
          "Shows 3 divides x² and hence x (using the earlier result about 3 and squares), writing x = 3z.",
          "Derives y² = 3z², another solution, with z < y since z² = y²/3 < y².",
          "Concludes this contradicts the minimality of y.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why every non-empty set of natural numbers has a least element but the positive fractions do not, and how that fact proves the division algorithm.",

  glimpse: (
    <p>
      The last lesson of this chapter turns induction from a method of proof into a method of definition: defining a sequence by a starting value and a rule. The division algorithm is the engine of Euclid&rsquo;s algorithm for highest common factors in Discrete Mathematics, and the same &ldquo;smallest counterexample&rdquo; argument proves that algorithms terminate in Data Structures and Algorithms.
    </p>
  ),
};
