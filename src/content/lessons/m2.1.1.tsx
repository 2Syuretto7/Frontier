import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { ModFieldViz } from "@/components/viz/ModFieldViz";
import { OrderViz } from "@/components/viz/OrderViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.1.1",
  minutes: 90,
  links: {
    revisits: ["m0.1.5", "m1.3.3"],
    foreshadows: ["m8.1.1", "m2.5.2"],
  },

  puzzle: (
    <>
      <p>
        At school you learnt that a negative times a negative is a positive, that anything times 0 is 0, and that you may never
        divide by 0. You were probably told these as rules. But are they separate rules, or do they follow from something
        simpler?
      </p>
      <p>
        Here is a test. Suppose you only know that addition and multiplication behave in the familiar tidy ways: order does not
        matter, brackets do not matter, and multiplication spreads over addition. Can you prove that <M>{"a \\cdot 0 = 0"}</M>{" "}
        for every number a?
      </p>
      <p>
        And once order enters, more questions follow. Why does multiplying both sides of an inequality by a negative number
        turn it round, and why is a square never negative?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Calculus is about the real numbers, so this course begins by saying exactly what they are. Rather than building them
        from anything, we list their properties as <strong>axioms</strong> and derive everything else. The first group of
        axioms, the field axioms, says only how addition and multiplication behave. Every rule of school algebra follows from
        them.
      </p>
      <p>
        The real numbers are not the only system that satisfies these axioms. The rationals do, and so does clock arithmetic
        modulo some numbers n, though not others. Below is the multiplication table modulo n. A field needs every non-zero
        element to have an inverse, a partner that multiplies with it to give 1. Try n = 5, 6 and 7, and click a row to find
        its inverse.
      </p>
      <ModFieldViz />
      <p>
        When n is not prime, say <M>{"n = 6 = 2 \\times 3"}</M>, two non-zero numbers multiply to 0, and neither of them can
        then have an inverse. When n is prime, every non-zero number has one.
      </p>
      <p>
        The second group of axioms says how numbers are arranged on a line.
        Remarkably, it is enough to say which numbers are <strong>positive</strong>, and to require that sums and products of
        positive numbers are positive. Everything else about inequalities follows.
      </p>
      <p>
        Below, a and b sit on a number line, and below them their multiples ca and cb. Move c through positive values, then 0,
        then negative values, and watch what happens to the order.
      </p>
      <OrderViz />
      <p>
        Multiplying by a positive number stretches the line, so order is kept. Multiplying by a negative number also reflects
        the line through 0, so order is reversed. Multiplying by 0 squashes everything to a single point.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="field">
        <p>
          A <strong>field</strong> is a set F with two operations, + and &middot;, and two elements 0 and 1 with{" "}
          <M>{"0 \\ne 1"}</M>, such that for all a, b, c in F:
        </p>
        <ol>
          <li>
            (associativity) <M>{"(a + b) + c = a + (b + c)"}</M> and <M>{"(ab)c = a(bc)"}</M>;
          </li>
          <li>
            (commutativity) <M>{"a + b = b + a"}</M> and <M>{"ab = ba"}</M>;
          </li>
          <li>
            (identities) <M>{"a + 0 = a"}</M> and <M>{"a \\cdot 1 = a"}</M>;
          </li>
          <li>
            (negatives) there is an element <M>{"-a"}</M> with <M>{"a + (-a) = 0"}</M>;
          </li>
          <li>
            (inverses) if <M>{"a \\ne 0"}</M>, there is an element <M>{"a^{-1}"}</M> with <M>{"a a^{-1} = 1"}</M>;
          </li>
          <li>
            (distributivity) <M>{"a(b + c) = ab + ac"}</M>.
          </li>
        </ol>
        <p>
          We define subtraction by <M>{"a - b = a + (-b)"}</M> and division by <M>{"a / b = a b^{-1}"}</M> for{" "}
          <M>{"b \\ne 0"}</M>. Our first axiom about the real numbers is that <M>{"\\mathbb{R}"}</M> is a field.
        </p>
      </Definition>

      <Example title="fields and non-fields">
        <p>
          <M>{"\\mathbb{Q}"}</M> and <M>{"\\mathbb{R}"}</M> are fields. <M>{"\\mathbb{Z}"}</M> is not: 2 has no inverse in{" "}
          <M>{"\\mathbb{Z}"}</M>, since <M>{"2x = 1"}</M> has no integer solution. The integers modulo 5 form a field: the
          inverses of 1, 2, 3, 4 are 1, 3, 2, 4. The integers modulo 6 do not, since <M>{"2 \\cdot 3 = 0"}</M>.
        </p>
      </Example>

      <Theorem title="anything times zero is zero">
        <p>
          In any field, <M>{"a \\cdot 0 = 0"}</M> for every a.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the identity axiom, <M>{"0 + 0 = 0"}</M>. Multiply by a and use distributivity:
        </p>
        <MD>{"a \\cdot 0 = a(0 + 0) = a \\cdot 0 + a \\cdot 0."}</MD>
        <p>
          Now add <M>{"-(a \\cdot 0)"}</M> to both sides. The left side becomes 0, and the right side becomes{" "}
          <M>{"a \\cdot 0"}</M>, using associativity and the negatives axiom. So <M>{"0 = a \\cdot 0"}</M>.
        </p>
      </Proof>

      <Remark title="why you cannot divide by zero">
        <p>
          Suppose 0 had an inverse x, so that <M>{"0 \\cdot x = 1"}</M>. By the theorem, <M>{"0 \\cdot x = 0"}</M>, so{" "}
          <M>{"1 = 0"}</M>, which the axioms forbid. This is a proof by contradiction: division by zero is not merely
          forbidden by a rule, it is impossible in any field.
        </p>
      </Remark>

      <Theorem title="signs">
        <p>
          In any field, <M>{"(-1)a = -a"}</M>, and <M>{"(-a)(-b) = ab"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          First, <M>{"a + (-1)a = 1 \\cdot a + (-1)a = (1 + (-1))a = 0 \\cdot a = 0"}</M>. So <M>{"(-1)a"}</M> is a negative of
          a. Negatives are unique: if <M>{"a + x = 0"}</M> and <M>{"a + y = 0"}</M>, then{" "}
          <M>{"x = x + (a + y) = (x + a) + y = y"}</M>. So <M>{"(-1)a = -a"}</M>. In particular{" "}
          <M>{"(-1)(-1) = -(-1)"}</M>, which is 1, since <M>{"(-1) + 1 = 0"}</M> shows 1 is a negative of <M>{"-1"}</M>.
          Finally, <M>{"(-a)(-b) = (-1)a(-1)b = (-1)(-1)ab = ab"}</M>.
        </p>
      </Proof>

      <Theorem title="no zero divisors">
        <p>
          In any field, if <M>{"ab = 0"}</M> then <M>{"a = 0"}</M> or <M>{"b = 0"}</M>.
        </p>
      </Theorem>
      <p>
        This is the fact you use whenever you solve <M>{"(x - 2)(x - 3) = 0"}</M> by setting each bracket to zero. You will
        prove it in the practice. It explains the visualisation: in the integers modulo 6, <M>{"2 \\cdot 3 = 0"}</M>, so they
        cannot form a field.
      </p>

      <Definition title="ordered field">
        <p>
          An <strong>ordered field</strong> is a field F together with a subset P, the <strong>positive</strong> elements, such
          that:
        </p>
        <ol>
          <li>(closure) if a and b are in P, so are <M>{"a + b"}</M> and <M>{"ab"}</M>;</li>
          <li>
            (trichotomy) for every a in F, exactly one of these holds: a is in P, <M>{"a = 0"}</M>, or <M>{"-a"}</M> is in P.
          </li>
        </ol>
        <p>
          We write <M>{"a < b"}</M>, or <M>{"b > a"}</M>, when <M>{"b - a"}</M> is in P, and <M>{"a \\le b"}</M> when{" "}
          <M>{"a < b"}</M> or <M>{"a = b"}</M>. So a is positive exactly when <M>{"a > 0"}</M>. The second group of axioms says that{" "}
          <M>{"\\mathbb{R}"}</M> is an ordered field.
        </p>
      </Definition>

      <Theorem title="the order is total">
        <p>
          In an ordered field, <M>{"\\le"}</M> is a total order: for any a and b, exactly one of <M>{"a < b"}</M>,{" "}
          <M>{"a = b"}</M> and <M>{"a > b"}</M> holds, and if <M>{"a < b"}</M> and <M>{"b < c"}</M> then <M>{"a < c"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply trichotomy to <M>{"b - a"}</M>: exactly one of <M>{"b - a \\in P"}</M>, <M>{"b - a = 0"}</M> and{" "}
          <M>{"-(b - a) = a - b \\in P"}</M> holds. For transitivity, <M>{"c - a = (c - b) + (b - a)"}</M> is a sum of two
          positive elements, so it is positive by closure.
        </p>
      </Proof>

      <Theorem title="rules for inequalities">
        <p>Suppose <M>{"a < b"}</M>. Then:</p>
        <ol>
          <li>
            <M>{"a + c < b + c"}</M> for every c;
          </li>
          <li>
            if <M>{"c > 0"}</M>, then <M>{"ac < bc"}</M>;
          </li>
          <li>
            if <M>{"c < 0"}</M>, then <M>{"ac > bc"}</M>.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          For 1, <M>{"(b + c) - (a + c) = b - a"}</M>, which is positive. For 2, <M>{"bc - ac = (b - a)c"}</M> is a product of
          two positives. For 3, <M>{"-c"}</M> is positive, so <M>{"ac - bc = (b - a)(-c)"}</M> is positive, and{" "}
          <M>{"bc < ac"}</M>. (The algebra uses the sign rules proved above.)
        </p>
      </Proof>

      <Theorem title="squares are not negative">
        <p>
          If <M>{"a \\ne 0"}</M>, then <M>{"a^2 > 0"}</M>. In particular <M>{"1 = 1^2 > 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By trichotomy, either a is positive or <M>{"-a"}</M> is. In the first case <M>{"a^2 = a \\cdot a"}</M> is positive by
          closure. In the second, <M>{"a^2 = (-a)(-a)"}</M>, again a product of two positives.
        </p>
      </Proof>

      <Example title="the complex numbers cannot be ordered">
        <p>
          Suppose the complex numbers were an ordered field. Since <M>{"i \\ne 0"}</M>, the theorem gives{" "}
          <M>{"i^2 = -1 > 0"}</M>. But also <M>{"1 > 0"}</M>, so by trichotomy <M>{"-1"}</M> is not positive. This
          contradiction shows no ordering of <M>{"\\mathbb{C}"}</M> is possible. Finite fields cannot be ordered either: in the
          integers modulo 5,
        </p>
        <MD>{"1 + 1 + 1 + 1 + 1 = 0,"}</MD>
        <p>yet a sum of positive elements must be positive.</p>
      </Example>

      <Remark title="a common slip">
        <p>
          Squaring does not always keep order: <M>{"-3 < 2"}</M>, but <M>{"9 > 4"}</M>. It does keep order between non-negative
          numbers, as you will prove. Whenever you manipulate an inequality, ask which of the rules above justifies the step,
          and whether its condition on the sign holds.
        </p>
      </Remark>

      <Remark title="what the axioms do not say">
        <p>
          Neither group says anything about gaps. The rationals satisfy every axiom so far, yet there is no rational number
          whose square is 2. The last axiom, completeness, fills the gaps and pins <M>{"\mathbb{R}"}</M> down.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "not-field",
      rung: "check",
      prompt: <p>Which of these is not a field, with the usual addition and multiplication?</p>,
      answer: { kind: "choice", options: ["the rationals", "the integers", "the real numbers", "the integers modulo 5"], correct: [1] },
    },
    {
      key: "negative",
      rung: "check",
      prompt: (
        <p>
          If <M>{"a < b"}</M> and <M>{"c < 0"}</M>, which of these must be true?
        </p>
      ),
      answer: { kind: "choice", options: ["ac < bc", "ac > bc", "ac = bc", "none of these need hold"], correct: [1] },
    },
    {
      key: "orderable",
      rung: "apply",
      prompt: <p>Which of these fields can be made into an ordered field? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["the rationals", "the real numbers", "the complex numbers", "the integers modulo 5"],
        correct: [0, 1],
      },
    },
    {
      key: "which-n",
      rung: "apply",
      prompt: <p>For which of these n do the integers modulo n form a field? Choose all that apply.</p>,
      answer: { kind: "choice", options: ["4", "5", "6", "7", "9"], correct: [1, 3] },
    },
    {
      key: "solve",
      rung: "apply",
      prompt: (
        <p>
          The inequality <M>{"-3x < 12"}</M> is equivalent to <M>{"x > k"}</M>. What is k?
        </p>
      ),
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a = 0.1 + 0.2
b = 0.3
print(a == b, abs(a - b) < 1e-12)`}</Code>
          <p>Floating-point numbers do not obey every field axiom exactly. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False True", "True True", "False False", "True False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>assoc_gap(a, b, c)</C>, which returns |(a + b) + c − (a + (b + c))| computed in floating point. The real numbers obey associativity exactly; floats do not.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def assoc_gap(a, b, c):
    return 0.0
`,
        solution: `def assoc_gap(a, b, c):
    return abs((a + b) + c - (a + (b + c)))
`,
        tests: [
          { name: "small and large", code: `assert assoc_gap(1e16, -1e16, 1.0) == 1.0, 'Try a = 10¹⁶, b = −10¹⁶, c = 1 by hand: the two groupings differ by 1.'` },
          { name: "tenths", code: `assert assoc_gap(0.1, 0.2, 0.3) > 0, 'Even 0.1, 0.2 and 0.3 give a tiny non-zero gap.'` },
          { name: "integers", code: `assert assoc_gap(1.0, 2.0, 3.0) == 0.0, 'Small whole numbers are exact in floating point.'` },
        ],
      },
    },
    {
      key: "no-zero-div",
      rung: "prove",
      prompt: (
        <p>
          Prove from the field axioms (and the theorem that <M>{"a \\cdot 0 = 0"}</M>) that if <M>{"ab = 0"}</M>, then{" "}
          <M>{"a = 0"}</M> or <M>{"b = 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Considers the case a ≠ 0 (the case a = 0 being immediate).",
          "Multiplies both sides of ab = 0 by the inverse of a.",
          "Uses associativity, the inverse and identity axioms, and a · 0 = 0 to conclude b = 0.",
        ],
      },
    },
    {
      key: "composite",
      rung: "stretch",
      prompt: (
        <p>
          Let n be a whole number with <M>{"n = rs"}</M>, where <M>{"1 < r, s < n"}</M>. Prove that the integers modulo n do
          not form a field.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that r and s are non-zero modulo n, since they lie strictly between 0 and n.",
          "Notes that rs = n is 0 modulo n.",
          "Uses the no-zero-divisors theorem (or directly the inverse of r) to reach a contradiction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what a field and an ordered field are, why a · 0 = 0, and why multiplying an inequality by a negative number reverses it.",

  glimpse: (
    <p>
      Next, the axiom that separates the reals from the rationals: completeness, the promise that every bounded set has a
      least upper bound. The order axioms then do steady work throughout the course, above all when derivatives decide where
      a function rises and falls. Real Analysis builds the reals from the rationals and checks every axiom of this chapter.
    </p>
  ),
};
