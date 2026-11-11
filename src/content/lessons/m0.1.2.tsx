import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { SignedMovesViz } from "@/components/viz/SignedMovesViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.1.2",
  minutes: 60,
  links: {
    foreshadows: ["m1.6.2"],
  },

  puzzle: (
    <>
      <p>
        At school you were probably told that &ldquo;a minus times a minus is a plus&rdquo;. Why should that be true?
      </p>
      <p>
        Try to give a <em>reason</em>, not a rule. If someone insisted that <M>{"(-1) \\times (-1) = -1"}</M>, what exactly
        would go wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the natural numbers you can always add, but you cannot always subtract: <M>{"3 - 5"}</M> has no answer among
        0, 1, 2, and so on. Yet the question makes perfect sense. A thermometer at 3 degrees that falls by 5 shows
        something. A bank account with 3 rupees that pays out 5 is 2 rupees in debt.
      </p>
      <p>
        So we extend the number line to the left of 0. A number now has a size <em>and</em> a direction. Adding a
        positive number moves you right; adding a negative number moves you left; subtracting is the same as adding the
        opposite. Multiplying by <M>{"-1"}</M> turns you around through 0, and turning around twice leaves you facing
        the way you started. That is the picture behind the rule you were taught. Play with it below.
      </p>
      <SignedMovesViz />
      <p>
        The picture is suggestive, but a picture is not a reason. The real reason is better: once we insist that the
        new numbers obey the same laws as the old ones, the rule for signs is <em>forced</em>. There is no other choice.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the integers">
        <p>
          The <strong>integers</strong> are the numbers <M>{"\\ldots, -3, -2, -1, 0, 1, 2, 3, \\ldots"}</M>. We write{" "}
          <M>{"\\mathbb{Z}"}</M> for the set of all of them (from the German <em>Zahlen</em>, numbers). For each natural
          number <M>n</M> there is an integer <M>{"-n"}</M>, its <strong>negative</strong>, with{" "}
          <M>{"n + (-n) = 0"}</M>.
        </p>
      </Definition>

      <p>
        We want arithmetic on <M>{"\\mathbb{Z}"}</M> to behave like arithmetic on the natural numbers. So we ask that the
        following laws hold for all integers <M>a</M>, <M>b</M>, <M>c</M>. They are the rules you have always used,
        written down so that we can see exactly what each step of an argument rests on.
      </p>

      <Definition title="the laws of arithmetic">
        <ol>
          <li><strong>Commutativity.</strong> <M>{"a + b = b + a"}</M> and <M>{"ab = ba"}</M>.</li>
          <li><strong>Associativity.</strong> <M>{"(a + b) + c = a + (b + c)"}</M> and <M>{"(ab)c = a(bc)"}</M>.</li>
          <li><strong>Identities.</strong> <M>{"a + 0 = a"}</M> and <M>{"1 \\cdot a = a"}</M>.</li>
          <li><strong>Additive inverses.</strong> Every <M>a</M> has an integer <M>{"-a"}</M> with <M>{"a + (-a) = 0"}</M>.</li>
          <li><strong>Distributivity.</strong> <M>{"a(b + c) = ab + ac"}</M>.</li>
        </ol>
      </Definition>

      <Definition title="subtraction">
        <p>
          <M>{"a - b"}</M> means <M>{"a + (-b)"}</M>. Subtracting is adding the opposite.
        </p>
      </Definition>

      <p>
        Before the main theorem we need two small facts. Each proof uses only the laws above; read them slowly and name
        the law behind each equals sign.
      </p>

      <Theorem title="cancellation">
        <p>If <M>{"x + a = a"}</M>, then <M>{"x = 0"}</M>. More generally, if <M>{"x + a = y + a"}</M>, then <M>{"x = y"}</M>.</p>
      </Theorem>
      <Proof>
        <p>Add <M>{"-a"}</M> to both sides of <M>{"x + a = y + a"}</M> and regroup:</p>
        <MD>{"x = x + 0 = x + (a + (-a)) = (x + a) + (-a) = (y + a) + (-a) = y + (a + (-a)) = y + 0 = y."}</MD>
        <p>The first statement is the case <M>{"y = 0"}</M>, since <M>{"0 + a = a"}</M>.</p>
      </Proof>

      <Theorem title="zero absorbs">
        <p>For every integer <M>a</M>, <M>{"a \\cdot 0 = 0"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"0 + 0 = 0"}</M>, distributivity gives <M>{"a \\cdot 0 = a(0 + 0) = a \\cdot 0 + a \\cdot 0"}</M>.
          Written as <M>{"0 + a \\cdot 0 = a \\cdot 0 + a \\cdot 0"}</M>, cancellation gives <M>{"0 = a \\cdot 0"}</M>.
        </p>
      </Proof>

      <Theorem title="the rule of signs">
        <p>For all integers <M>a</M> and <M>b</M>:</p>
        <ol>
          <li><M>{"(-1)a = -a"}</M>;</li>
          <li><M>{"-(-a) = a"}</M>;</li>
          <li><M>{"(-a)(-b) = ab"}</M>. In particular <M>{"(-1)(-1) = 1"}</M>.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          <em>(1)</em> We show that <M>{"(-1)a"}</M> does the job of <M>{"-a"}</M>, which is to add to <M>a</M> and give 0:
        </p>
        <MD>{"a + (-1)a = 1 \\cdot a + (-1)a = (1 + (-1))a = 0 \\cdot a = 0."}</MD>
        <p>
          So <M>{"a + (-1)a = 0 = a + (-a)"}</M>, and cancellation (with <M>a</M> on the left, using commutativity) gives{" "}
          <M>{"(-1)a = -a"}</M>.
        </p>
        <p>
          <em>(2)</em> <M>{"-(-a)"}</M> is the number that adds to <M>{"-a"}</M> to give 0. But <M>a</M> already does
          that, since <M>{"(-a) + a = 0"}</M>. By cancellation the two are equal.
        </p>
        <p><em>(3)</em> Using (1) twice, commutativity and associativity, then (1) and (2):</p>
        <MD>{"(-a)(-b) = ((-1)a)((-1)b) = (-1)\\big((-1)(ab)\\big) = (-1)(-(ab)) = -(-(ab)) = ab."}</MD>
      </Proof>

      <p>
        Now the puzzle has an answer. If <M>{"(-1)(-1)"}</M> were <M>{"-1"}</M>, distributivity would fail:{" "}
        <M>{"(-1)\\big(1 + (-1)\\big)"}</M> must be <M>{"(-1) \\cdot 0 = 0"}</M>, but it would also be{" "}
        <M>{"(-1)(1) + (-1)(-1) = -1 + (-1) = -2"}</M>. The sign rule is the price of keeping the laws.
      </p>

      <Definition title="order">
        <p>
          We say <M>{"a < b"}</M> if <M>{"b - a"}</M> is a positive integer, that is, one of <M>{"1, 2, 3, \\ldots"}</M>.
          On the number line, <M>a</M> lies to the left of <M>b</M>.
        </p>
      </Definition>

      <Theorem title="multiplying an inequality">
        <p>
          If <M>{"a < b"}</M> and <M>{"c > 0"}</M> then <M>{"ac < bc"}</M>. If <M>{"a < b"}</M> and <M>{"c < 0"}</M>{" "}
          then <M>{"ac > bc"}</M>: multiplying by a negative number reverses an inequality.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"bc - ac = (b - a)c"}</M> by distributivity. If <M>c</M> is positive, this is a product of two positive
          integers, which is positive, so <M>{"ac < bc"}</M>. If <M>c</M> is negative, write <M>{"c = -d"}</M> with{" "}
          <M>d</M> positive. Then <M>{"(b - a)c = -\\big((b - a)d\\big)"}</M> is the negative of a positive integer, so{" "}
          <M>{"ac - bc"}</M> is positive and <M>{"ac > bc"}</M>.
        </p>
      </Proof>

      <Example>
        <p>
          <M>{"2 < 5"}</M>, but <M>{"2 \\cdot (-3) = -6"}</M> and <M>{"5 \\cdot (-3) = -15"}</M>, and <M>{"-6 > -15"}</M>.
          Turning around through 0 reverses left and right.
        </p>
      </Example>

      <Remark title="what the integers really are">
        <p>
          We spoke as if the negative numbers were simply there, waiting. A mathematician can build them from the
          natural numbers alone. Think of a pair <M>{"(a, b)"}</M> of natural numbers as standing for &ldquo;
          <M>a</M> minus <M>b</M>&rdquo;, and count two pairs as the same integer when <M>{"a + d = b + c"}</M>. Then{" "}
          <M>{"(2, 7)"}</M> and <M>{"(0, 5)"}</M> are both <M>{"-5"}</M>. Notice that the test uses only addition, which the
          natural numbers already have. This trick, building new objects as classes of old ones, returns in Proof and
          Logic as an equivalence relation, and again whenever mathematics needs new numbers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "add",
      rung: "check",
      prompt: <p>Compute <M>{"(-7) + 12"}</M>.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "mixed",
      rung: "check",
      prompt: <p>Compute <M>{"(-3)(-4) - 2(-5)"}</M>.</p>,
      answer: { kind: "numeric", value: 22 },
    },
    {
      key: "thermometer",
      rung: "apply",
      prompt: (
        <p>
          At 6 a.m. in Leh the temperature is <M>{"-4"}</M>&deg;C. It rises by 3 degrees every hour. What is the
          temperature, in degrees Celsius, at 11 a.m.?
        </p>
      ),
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "expand",
      rung: "apply",
      prompt: <p>Expand and simplify <M>{"-2(x - 3) + x"}</M>.</p>,
      answer: { kind: "expression", value: "6 - x", variables: ["x"] },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: (
        <p>
          In the remark, a pair <M>{"(a, b)"}</M> of natural numbers stands for <M>{"a - b"}</M>. Select every pair that
          stands for the same integer as <M>{"(2, 7)"}</M>.
        </p>
      ),
      answer: { kind: "choice", options: ["(0, 5)", "(5, 0)", "(10, 15)", "(7, 2)"], correct: [0, 2] },
    },
    {
      key: "flip",
      rung: "apply",
      prompt: <p>If <M>{"x < 4"}</M>, what can you say about <M>{"-3x"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["-3x < -12", "-3x > -12", "-3x < 12", "Nothing can be said."],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(-7 // 2, -7 % 2, abs(-7))`}</Code>
          <p>Python's floor division rounds down, towards minus infinity. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["-4 1 7", "-3 -1 7", "-3 1 7", "-4 -1 -7"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [5, -3, 8, -10, 2]
total, low = 0, 0
for x in xs:
    total += x
    low = min(low, total)
print(total, low)`}</Code>
          <p>A running balance starts at 0. What are the final balance and the lowest balance reached?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 0", "2 -10", "2 -5", "-2 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sign(x)</C>, which returns 1 for a positive number, −1 for a negative one and 0 for zero, and <C>distance(a, b)</C>, the distance between two integers on the number line.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sign(x):
    return 1

def distance(a, b):
    return a - b
`,
        solution: `def sign(x):
    if x > 0:
        return 1
    if x < 0:
        return -1
    return 0

def distance(a, b):
    return abs(a - b)
`,
        tests: [
          { name: "sign", code: `assert [sign(-5), sign(0), sign(3)] == [-1, 0, 1], 'Three cases: negative, zero, positive.'` },
          { name: "distance", code: `assert distance(-3, 4) == 7 and distance(4, -3) == 7, 'Distance never depends on the order: use abs.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Python&rsquo;s <C>//</C> rounds towards minus infinity, but many languages truncate towards zero. Write <C>trunc_div(a, b)</C>, which rounds the quotient towards zero, and <C>trunc_mod(a, b)</C>, the remainder that goes with it, so that <C>a == b * trunc_div(a, b) + trunc_mod(a, b)</C>. Use integer arithmetic only, not floats or <C>math.trunc</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def trunc_div(a, b):
    return a // b

def trunc_mod(a, b):
    return a % b
`,
        solution: `def trunc_div(a, b):
    q = abs(a) // abs(b)
    return q if (a < 0) == (b < 0) else -q

def trunc_mod(a, b):
    return a - b * trunc_div(a, b)
`,
        tests: [
          { name: "positive", code: `assert trunc_div(7, 2) == 3 and trunc_mod(7, 2) == 1, 'For positive numbers both conventions agree.'` },
          { name: "negative", code: `assert trunc_div(-7, 2) == -3 and trunc_mod(-7, 2) == -1 and trunc_div(7, -2) == -3 and trunc_mod(7, -2) == 1, 'Truncation drops the fraction: −3.5 becomes −3.'` },
          { name: "both negative", code: `assert trunc_div(-7, -2) == 3 and trunc_mod(-7, -2) == -1, 'Two negatives give a positive quotient.'` },
          { name: "identity", code: `assert all(a == b * trunc_div(a, b) + trunc_mod(a, b) and abs(trunc_mod(a, b)) < abs(b) for a in range(-30, 31) for b in list(range(-7, 0)) + list(range(1, 8))), 'The remainder takes the sign of a and is smaller than |b|.'` },
          { name: "huge", code: `a = -10 ** 30 - 1
assert trunc_div(a, 10) == -10 ** 29, 'Floats lose precision here; stay with integers.'` },
        ],
      },
    },
    {
      key: "neg-neg",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"(-a)b = -(ab)"}</M> for all integers <M>a</M>, <M>b</M>. You may use the laws of arithmetic and
          part (1) of the rule of signs. Name the law behind each step.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites -a as (-1)a, citing part (1) of the rule of signs.",
          "Regroups ((-1)a)b as (-1)(ab) using associativity.",
          "Concludes (-1)(ab) = -(ab), again citing part (1).",
          "Every step names the law or result it uses.",
        ],
      },
    },
    {
      key: "alternating",
      rung: "stretch",
      prompt: <p>Compute <M>{"(-1)^1 + (-1)^2 + (-1)^3 + \\cdots + (-1)^{101}"}</M>.</p>,
      answer: { kind: "numeric", value: -1 },
    },
  ],

  teachBack:
    "Explain to a friend why a negative times a negative must be positive. Do not just state the rule: show what would break if it were negative instead.",

  glimpse: (
    <p>
      Next, dividing will force a further extension, to fractions. The laws you listed here are the first draft of the
      field and order axioms that open Calculus, and the same few laws hold in many worlds besides the integers, including
      the vectors and matrices of Linear Algebra. The pairs <M>{"(a, b)"}</M> come back as your first equivalence
      relation.
    </p>
  ),
};
