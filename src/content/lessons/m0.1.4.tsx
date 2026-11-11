import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { LongDivisionViz } from "@/components/viz/LongDivisionViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.1.4",
  minutes: 80,
  links: {
    foreshadows: ["m1.3.3", "m4.1.4", "m8.1.1", "m2.8.2", "m11.1.1"],
  },

  puzzle: (
    <>
      <p>
        Draw a square whose sides are 1 metre long. Its diagonal is some length <M>d</M>, and by Pythagoras{" "}
        <M>{"d^2 = 1^2 + 1^2 = 2"}</M>.
      </p>
      <p>
        Can you find a fraction <M>{"\\tfrac{a}{b}"}</M> with <M>{"\\left(\\tfrac{a}{b}\\right)^2 = 2"}</M>? Try{" "}
        <M>{"\\tfrac{7}{5}"}</M>, then <M>{"\\tfrac{17}{12}"}</M>. You will get close. Will you ever get there?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <M>{"\\left(\\tfrac{7}{5}\\right)^2 = \\tfrac{49}{25} = 1.96"}</M>, a little short. <M>{"\\left(\\tfrac{17}{12}\\right)^2 = \\tfrac{289}{144} \\approx 2.007"}</M>,
        a little over. You can keep improving forever, and you will never land exactly on 2. The followers of
        Pythagoras discovered this about 2,500 years ago, and legend says it so disturbed them that they kept it secret.
        It means there are lengths that no fraction measures exactly.
      </p>
      <p>
        To see what such numbers look like, it helps to look first at what fractions look like as decimals. Divide 1 by
        7 the way you learnt at school, and watch the remainders. They can only be 1, 2, 3, 4, 5 or 6. Sooner or later
        one comes back, and from that moment the digits repeat for ever.
      </p>
      <LongDivisionViz />
      <p>
        So every fraction&rsquo;s decimal either stops or repeats. A decimal that does neither cannot be a fraction.
        Those are the numbers the Pythagoreans had stumbled on.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decimal notation">
        <p>A decimal is shorthand for a sum of powers of ten. For example</p>
        <MD>{"3.142 = 3 + \\frac{1}{10} + \\frac{4}{100} + \\frac{2}{1000}."}</MD>
        <p>
          A decimal with finitely many digits after the point is <strong>terminating</strong>. One whose digits from
          some point on repeat a fixed block for ever is <strong>repeating</strong>, written with a bar:{" "}
          <M>{"0.\\overline{27} = 0.272727\\ldots"}</M>.
        </p>
      </Definition>

      <p>
        A terminating decimal with <M>k</M> digits after the point is a fraction with denominator <M>{"10^k"}</M>, so it
        is rational. What about the other direction?
      </p>

      <Theorem title="fractions repeat">
        <p>
          The decimal of any fraction <M>{"\\tfrac{a}{b}"}</M> (with <M>{"a \\geq 0"}</M>, <M>{"b > 0"}</M>) either
          terminates or repeats, and the repeating block has at most <M>{"b - 1"}</M> digits.
        </p>
      </Theorem>
      <Proof>
        <p>
          Long division produces each new digit from a remainder <M>r</M>: the digit is the whole part of{" "}
          <M>{"\\tfrac{10r}{b}"}</M>, and the next remainder is what is left of <M>{"10r"}</M> after taking away that
          many <M>b</M>s. Every remainder is one of <M>{"0, 1, \\ldots, b - 1"}</M>.
        </p>
        <p>
          If a remainder of 0 ever appears, every later digit is 0 and the decimal terminates. Otherwise every
          remainder is one of the <M>{"b - 1"}</M> values <M>{"1, \\ldots, b - 1"}</M>. Among the first <M>b</M>{" "}
          remainders, two must be equal, since there are more remainders than possible values. Each remainder
          determines everything that follows it, so once a remainder recurs, the same digits and remainders recur in
          the same order, for ever. The block between the two equal remainders has at most <M>{"b - 1"}</M> digits.
        </p>
      </Proof>

      <p>
        The counting step in that proof, &ldquo;more things than boxes means two share a box&rdquo;, is called the{" "}
        <strong>pigeonhole principle</strong>. It looks too simple to be useful, and it is one of the sharpest tools in
        mathematics.
      </p>

      <Proposition title="repeating decimals are fractions">
        <p>Every repeating decimal is a rational number.</p>
      </Proposition>
      <Proof>
        <p>
          We show the method on an example; it works the same way every time. Let{" "}
          <M>{"x = 0.\\overline{27} = 0.272727\\ldots"}</M>. The block has 2 digits, so multiply by <M>{"10^2"}</M>:
        </p>
        <MD>{"100x = 27.272727\\ldots = 27 + x."}</MD>
        <p>
          Subtracting, <M>{"99x = 27"}</M>, so <M>{"x = \\tfrac{27}{99} = \\tfrac{3}{11}"}</M>. If the repeating part
          starts later, first multiply by a power of ten to move the point to where it begins.
        </p>
      </Proof>

      <Example title="a famous consequence">
        <p>
          Let <M>{"x = 0.\\overline{9}"}</M>. Then <M>{"10x = 9 + x"}</M>, so <M>{"9x = 9"}</M> and <M>{"x = 1"}</M>. The
          decimals <M>{"0.999\\ldots"}</M> and <M>{"1.000\\ldots"}</M> are two names for the same number, just as{" "}
          <M>{"\\tfrac{1}{2}"}</M> and <M>{"\\tfrac{2}{4}"}</M> are. If this feels like a trick, you are in good company. It
          is not a trick, but saying exactly what an infinite decimal <em>means</em> needs limits, which you will meet in
          Calculus.
        </p>
      </Example>

      <p>
        Decimals have one more job. Science and computing deal with numbers far too large or too small to write out
        digit by digit, and a decimal point that can float to wherever it is needed solves this.
      </p>

      <Definition title="scientific notation">
        <p>
          A positive number is in <strong>scientific notation</strong> when it is written as
        </p>
        <MD>{"m \\times 10^{k}, \\qquad 1 \\le m < 10, \\quad k \\text{ an integer}."}</MD>
        <p>
          The number <M>m</M> is the <strong>mantissa</strong> (it carries the digits) and <M>k</M> is the{" "}
          <strong>exponent</strong> (it says where the point goes). A negative exponent means dividing by a power of ten:{" "}
          <M>{"10^{-3} = \\tfrac{1}{1000}"}</M>.
        </p>
      </Definition>

      <Example title="from the very large to the very small">
        <p>
          A language model with 175 billion parameters has <M>{"1.75 \\times 10^{11}"}</M> of them. Light crosses a
          metre in about <M>{"3.3 \\times 10^{-9}"}</M> seconds. To multiply, multiply the mantissas and add the exponents:
        </p>
        <MD>{"(1.75 \\times 10^{11}) \\times (4 \\times 10^{3}) = 7 \\times 10^{14}."}</MD>
        <p>
          To divide, divide the mantissas and subtract the exponents. If the new mantissa falls outside{" "}
          <M>{"[1, 10)"}</M>, move the point and adjust the exponent: <M>{"12 \\times 10^{5} = 1.2 \\times 10^{6}"}</M>.
        </p>
      </Example>

      <Remark title="how a computer stores a number">
        <p>
          Writing <M>{"1.75 \\times 10^{11}"}</M> keeps three significant digits and throws the rest away. Computers do
          exactly this, in base 2 instead of base 10: a <em>floating-point</em> number is a mantissa with a fixed number of
          binary digits and an exponent. So a computer cannot store <M>{"\\tfrac{1}{3}"}</M>, or even <M>{"0.1"}</M>,
          exactly, since <M>{"0.1"}</M> repeats for ever in binary. Training a large model in low precision means choosing
          how many digits each number keeps, and that choice is a major engineering decision you will meet later.
        </p>
      </Remark>

      <Definition title="irrational numbers">
        <p>
          A number that is not rational is <strong>irrational</strong>. By the two results above, these are exactly the
          numbers whose decimals neither terminate nor repeat.
        </p>
      </Definition>

      <p>To prove the Pythagoreans&rsquo; discovery we need one small fact about even and odd numbers.</p>

      <Proposition title="squares keep parity">
        <p>If <M>{"n^2"}</M> is even, then <M>n</M> is even.</p>
      </Proposition>
      <Proof>
        <p>
          We show the equivalent statement: if <M>n</M> is odd, then <M>{"n^2"}</M> is odd. An odd number has the form{" "}
          <M>{"n = 2k + 1"}</M>. Then <M>{"n^2 = 4k^2 + 4k + 1 = 2(2k^2 + 2k) + 1"}</M>, which is odd.
        </p>
      </Proof>

      <Theorem title="the square root of 2 is irrational">
        <p>There are no integers <M>a</M>, <M>b</M> with <M>{"b \\neq 0"}</M> and <M>{"\\left(\\tfrac{a}{b}\\right)^2 = 2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose, to reach a contradiction, that there were. Write the fraction in lowest terms, so <M>a</M> and{" "}
          <M>b</M> have no common factor except <M>{"\\pm 1"}</M>. Then <M>{"a^2 = 2b^2"}</M>.
        </p>
        <p>
          So <M>{"a^2"}</M> is even, and by the proposition <M>a</M> is even: <M>{"a = 2c"}</M>. Substituting,{" "}
          <M>{"4c^2 = 2b^2"}</M>, so <M>{"b^2 = 2c^2"}</M>. Now <M>{"b^2"}</M> is even, so <M>b</M> is even.
        </p>
        <p>
          Then 2 is a common factor of <M>a</M> and <M>b</M>, contradicting lowest terms. So no such fraction exists.
        </p>
      </Proof>

      <Remark title="how the proof is built">
        <p>
          This is a <em>proof by contradiction</em>: assume the opposite, follow it carefully, and reach something
          impossible. The same pattern shows that <M>{"\\sqrt{3}"}</M>, <M>{"\\sqrt{5}"}</M> and many other roots are
          irrational. Famous irrationals such as <M>{"\\pi"}</M> and <M>e</M> need harder proofs, which come much later.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eighth",
      rung: "check",
      prompt: <p>Write <M>{"\\tfrac{3}{8}"}</M> as a decimal.</p>,
      answer: { kind: "numeric", value: 0.375 },
    },
    {
      key: "terminate",
      rung: "check",
      prompt: <p>Select every fraction whose decimal terminates.</p>,
      answer: { kind: "choice", options: ["7/20", "1/3", "5/16", "2/7"], correct: [0, 2] },
    },
    {
      key: "to-fraction",
      rung: "apply",
      prompt: <p>Write <M>{"0.\\overline{36} = 0.363636\\ldots"}</M> as a fraction in lowest terms.</p>,
      answer: { kind: "numeric", value: 4 / 11 },
    },
    {
      key: "period",
      rung: "apply",
      prompt: <p>How many digits are in the repeating block of the decimal for <M>{"\\tfrac{1}{7}"}</M>?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "which-irrational",
      rung: "apply",
      prompt: <p>Select every irrational number.</p>,
      answer: {
        kind: "choice",
        options: [
          "√2",
          "√9",
          "0.101001000100001…, where each block of 0s is one longer than the last",
          "22/7",
          "0.123123123…",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "scientific",
      rung: "apply",
      prompt: (
        <p>
          A training run processes <M>{"2 \\times 10^{12}"}</M> tokens, and each token costs <M>{"6 \\times 10^{9}"}</M>{" "}
          arithmetic operations. Write the total in scientific notation, <M>{"m \\times 10^k"}</M>. What is <M>k</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 22 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print(0.1 + 0.2 == 0.3, abs(0.1 + 0.2 - 0.3) < 1e-9)`}</Code>
          <p>Decimals are stored in binary, which cannot hold 0.1 exactly. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["False True", "True True", "True False", "False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sci(x)</C>, which returns (m, e) with x = m × 10<sup>e</sup>, 1 ≤ |m| &lt; 10 and e an integer, for any non-zero x. Use <C>math.log10</C> and <C>math.floor</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sci(x):
    return (x, 0)
`,
        solution: `import math

def sci(x):
    e = math.floor(math.log10(abs(x)))
    return (x / 10 ** e, e)
`,
        tests: [
          { name: "big", code: `m, e = sci(299792458)
assert e == 8 and abs(m - 2.99792458) < 1e-9, 'The speed of light is 2.99792458 × 10⁸ m/s.'` },
          { name: "small", code: `m, e = sci(0.00042)
assert e == -4 and abs(m - 4.2) < 1e-9, '0.00042 is 4.2 × 10⁻⁴.'` },
          { name: "negative", code: `m, e = sci(-5000)
assert e == 3 and abs(m + 5) < 1e-9, 'Take the logarithm of |x| and keep the sign in m.'` },
        ],
      },
    },
    {
      key: "root-three",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"\\sqrt{3}"}</M> is irrational. You will need a fact like the parity proposition: if{" "}
          <M>{"n^2"}</M> is divisible by 3, then <M>n</M> is divisible by 3. Prove that fact too.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Proves the lemma: if n is not divisible by 3, then n = 3k + 1 or n = 3k + 2, and in both cases n² leaves remainder 1 on division by 3.",
          "Assumes √3 = a/b in lowest terms and derives a² = 3b².",
          "Uses the lemma to get a = 3c, then b² = 3c², so b is divisible by 3.",
          "Concludes with the contradiction to lowest terms.",
        ],
      },
    },
    {
      key: "hundredth",
      rung: "stretch",
      prompt: <p>What is the 100th digit after the decimal point in the decimal for <M>{"\\tfrac{1}{7}"}</M>?</p>,
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain why every fraction gives a decimal that either stops or repeats. Pretend you are talking someone through long division by 7, and make them see why the repeat cannot be avoided.",

  glimpse: (
    <p>
      Next you will put rational and irrational numbers together on one line, the real numbers. The proof by
      contradiction you just read is studied as a method in Proof and Logic, the pigeonhole principle has its own lesson
      in Discrete Mathematics, and the question of what an infinite decimal means is answered by series in Calculus and
      by the construction of the reals in Real Analysis. Scientific notation returns, in base 2, as the floating-point
      formats of Numerical Linear Algebra and Scientific Computing.
    </p>
  ),
};
