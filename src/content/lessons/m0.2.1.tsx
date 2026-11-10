import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ThinkOfNumberViz } from "@/components/viz/ThinkOfNumberViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.1",
  minutes: 55,
  links: {
    revisits: ["m0.1.2"],
    foreshadows: ["m0.7.5", "m1.2.2"],
  },

  puzzle: (
    <>
      <p>
        Think of a number. Double it. Add 6. Halve the result. Now take away the number you first thought of.
      </p>
      <p>
        You have 3. Everyone who does this gets 3, whatever number they chose. How could you be <em>sure</em> of that
        without trying every number, which would take for ever?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Trying examples can make you confident, but it can never make you certain: there are infinitely many numbers to
        try. The way out is to run the trick once on a number you have not chosen yet. Call it <M>n</M>. Every
        instruction then acts on <M>n</M>, and you can watch what happens to it.
      </p>
      <ThinkOfNumberViz />
      <p>
        After halving you have <M>{"n + 3"}</M>; taking away <M>n</M> leaves <M>3</M>. The letter did not stand for a
        particular number. It stood for <em>whatever number you like</em>, and one calculation covered all of them at
        once. That is the whole idea of algebra: arithmetic done on numbers you have not chosen yet.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="variables and expressions">
        <p>
          A <strong>variable</strong> is a letter standing for a number that is not fixed in advance. An{" "}
          <strong>expression</strong> is built from numbers and variables using <M>{"+"}</M>, <M>{"-"}</M>,{" "}
          <M>{"\\times"}</M>, <M>{"\\div"}</M>, powers and brackets, such as <M>{"3x^2 - 2xy + 5"}</M>. To{" "}
          <strong>evaluate</strong> an expression, substitute numbers for its variables and calculate.
        </p>
        <p>
          We write <M>{"3x"}</M> for <M>{"3 \\times x"}</M> and <M>{"x^2"}</M> for <M>{"x \\times x"}</M>. Powers come before
          multiplication and division, which come before addition and subtraction; brackets override all of these.
        </p>
      </Definition>

      <Definition title="equivalent expressions">
        <p>
          Two expressions are <strong>equivalent</strong> if they have the same value for every choice of values of their
          variables. We then write them as equal: <M>{"\\tfrac{2n + 6}{2} - n = 3"}</M> is a statement about every number{" "}
          <M>n</M>. A statement of this kind, true for all values, is an <strong>identity</strong>.
        </p>
      </Definition>

      <p>
        Every rule you use to simplify an expression is one of the laws of arithmetic from the integers lesson, applied to
        numbers you have not yet chosen. Since the laws hold for <em>every</em> number, the result holds for every value
        of the variables. This is why algebra is reliable.
      </p>

      <Example title="collecting like terms">
        <p>
          <M>{"3x + 2y - x + 5y"}</M>. By commutativity and associativity we may reorder and regroup:{" "}
          <M>{"(3x - x) + (2y + 5y)"}</M>. By distributivity, <M>{"3x - x = (3 - 1)x = 2x"}</M> and{" "}
          <M>{"2y + 5y = (2 + 5)y = 7y"}</M>. So the expression is equivalent to <M>{"2x + 7y"}</M>. Terms with the same
          variables raised to the same powers, such as <M>{"3x"}</M> and <M>{"-x"}</M>, are <em>like terms</em>.
        </p>
      </Example>

      <Example title="expanding brackets">
        <p>Distributivity, used twice:</p>
        <MD>{"(x + 3)(x - 5) = x(x - 5) + 3(x - 5) = x^2 - 5x + 3x - 15 = x^2 - 2x - 15."}</MD>
        <p>Every term in the first bracket multiplies every term in the second. Nothing more is going on.</p>
      </Example>

      <Theorem title="three identities">
        <p>For all numbers <M>a</M> and <M>b</M>:</p>
        <MD>{"(a + b)^2 = a^2 + 2ab + b^2, \\qquad (a - b)^2 = a^2 - 2ab + b^2, \\qquad (a + b)(a - b) = a^2 - b^2."}</MD>
      </Theorem>
      <Proof>
        <p>Expand, using distributivity and commutativity (<M>{"ba = ab"}</M>):</p>
        <MD>{"(a + b)^2 = (a + b)(a + b) = a^2 + ab + ba + b^2 = a^2 + 2ab + b^2."}</MD>
        <p>
          The second follows from the first by replacing <M>b</M> with <M>{"-b"}</M>, since <M>{"(-b)^2 = b^2"}</M> by the
          rule of signs. For the third, <M>{"(a + b)(a - b) = a^2 - ab + ba - b^2 = a^2 - b^2"}</M>.
        </p>
      </Proof>

      <Example title="arithmetic made easy">
        <p>
          <M>{"99 \\times 101 = (100 - 1)(100 + 1) = 100^2 - 1^2 = 9999"}</M>. And{" "}
          <M>{"41^2 = (40 + 1)^2 = 1600 + 80 + 1 = 1681"}</M>.
        </p>
      </Example>

      <Remark title="the most common mistakes">
        <p>
          <M>{"(a + b)^2"}</M> is <em>not</em> <M>{"a^2 + b^2"}</M>; it is missing the <M>{"2ab"}</M>. Try{" "}
          <M>{"a = b = 1"}</M>: <M>{"(1 + 1)^2 = 4"}</M> but <M>{"1^2 + 1^2 = 2"}</M>. Likewise{" "}
          <M>{"\\sqrt{a + b} \\neq \\sqrt{a} + \\sqrt{b}"}</M> and <M>{"\\tfrac{1}{a + b} \\neq \\tfrac{1}{a} + \\tfrac{1}{b}"}</M>{" "}
          in general.
        </p>
        <p>
          Notice the logic. One value where two expressions differ <em>proves</em> they are not equivalent: it is a
          counterexample, a single case that breaks a general claim. But any number of values where they
          agree proves nothing about the rest. To show an identity, you must reason from the laws, as in the proof above.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "like-terms",
      rung: "check",
      prompt: <p>Simplify <M>{"3x + 2y - x + 5y"}</M>.</p>,
      answer: { kind: "expression", value: "2x + 7y", variables: ["x", "y"] },
    },
    {
      key: "evaluate",
      rung: "check",
      prompt: <p>Evaluate <M>{"2a^2 - 3b"}</M> when <M>{"a = -2"}</M> and <M>{"b = 4"}</M>.</p>,
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "expand",
      rung: "apply",
      prompt: <p>Expand <M>{"(2x - 1)(x + 4)"}</M>.</p>,
      answer: { kind: "expression", value: "2x^2 + 7x - 4", variables: ["x"] },
    },
    {
      key: "which-equal",
      rung: "apply",
      prompt: <p>Select every expression equivalent to <M>{"(a + b)^2"}</M>.</p>,
      answer: {
        kind: "choice",
        options: ["a² + b²", "a² + 2ab + b²", "(b + a)²", "a(a + b) + b(a + b)"],
        correct: [1, 2, 3],
      },
    },
    {
      key: "mental",
      rung: "apply",
      prompt: <p>Use an identity to compute <M>{"103 \\times 97"}</M> without a calculator.</p>,
      answer: { kind: "numeric", value: 9991 },
    },
    {
      key: "trick",
      rung: "prove",
      prompt: (
        <p>
          A new trick: think of a number, add 4, multiply by 3, subtract 6, divide by 3, then take away the number you
          first thought of. Prove that the answer is always the same, and say what it is.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Introduces a variable for the unknown number.",
          "Tracks each instruction as an expression: n + 4, 3n + 12, 3n + 6, n + 2, 2.",
          "Concludes the answer is always 2.",
          "Explains why this covers every possible number, not just tested examples.",
        ],
      },
    },
    {
      key: "cube",
      rung: "stretch",
      prompt: <p>Expand <M>{"(a + b)^3"}</M>.</p>,
      answer: { kind: "expression", value: "a^3 + 3a^2 b + 3a b^2 + b^3", variables: ["a", "b"] },
    },
  ],

  teachBack:
    "Explain to a friend why checking a number trick on ten examples does not prove it always works, but one line of algebra does.",

  glimpse: (
    <p>
      Next you will turn the question around: instead of evaluating an expression, find the value that makes it equal
      something, which is solving an equation. The cube you expanded is the first step towards the binomial theorem later in
      this course, and the phrase &ldquo;for every number <M>n</M>&rdquo; becomes the universal quantifier in Proof
      and Logic.
    </p>
  ),
};
