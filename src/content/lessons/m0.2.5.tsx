import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { PowerLadderViz } from "@/components/viz/PowerLadderViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.5",
  minutes: 65,
  links: {
    revisits: ["m0.1.2"],
    foreshadows: ["m0.4.2", "m0.4.3"],
  },

  puzzle: (
    <>
      <p>
        <M>{"2^3"}</M> means <M>{"2 \\times 2 \\times 2"}</M>, three twos multiplied together. So what could{" "}
        <M>{"2^0"}</M> mean? Zero twos multiplied together? And <M>{"2^{-1}"}</M>, minus one two? Or{" "}
        <M>{"2^{1/2}"}</M>, half a two?
      </p>
      <p>These look meaningless. Can you find a reason to give them a value, and only one possible value?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Look at the powers of 2 in a column: 32, 16, 8, 4, 2. Each step down divides by 2. The pattern has an obvious next
        step, and the one after that.
      </p>
      <PowerLadderViz />
      <p>
        So <M>{"2^0 = 1"}</M> and <M>{"2^{-1} = \\tfrac12"}</M>, if the pattern is to continue. This is the same move you
        saw with negative numbers: we extend a definition in the only way that keeps the rules working. With exponents the
        rules are the laws of indices, and keeping them forces every value, even <M>{"2^{1/2}"}</M>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="positive integer powers">
        <p>
          For a real number <M>a</M> and a positive integer <M>n</M>, <M>{"a^n"}</M> is the product of <M>n</M> copies of{" "}
          <M>a</M>. Here <M>a</M> is the <strong>base</strong> and <M>n</M> the <strong>exponent</strong>.
        </p>
      </Definition>

      <Theorem title="the laws of indices">
        <p>For real <M>a</M>, <M>b</M> and positive integers <M>m</M>, <M>n</M>:</p>
        <MD>{"a^m a^n = a^{m + n}, \\qquad (a^m)^n = a^{mn}, \\qquad (ab)^n = a^n b^n."}</MD>
      </Theorem>
      <Proof>
        <p>
          Count factors. <M>{"a^m a^n"}</M> is <M>m</M> copies of <M>a</M> followed by <M>n</M> more: <M>{"m + n"}</M>{" "}
          copies. <M>{"(a^m)^n"}</M> is <M>n</M> blocks of <M>m</M> copies: <M>{"mn"}</M> copies. <M>{"(ab)^n"}</M> is{" "}
          <M>n</M> copies of <M>{"ab"}</M>; by commutativity and associativity, rearrange them as <M>n</M> copies of{" "}
          <M>a</M> times <M>n</M> copies of <M>b</M>.
        </p>
      </Proof>

      <p>Now extend the definition, keeping the first law. Throughout, <M>{"a \\neq 0"}</M>.</p>

      <Definition title="zero and negative exponents">
        <MD>{"a^0 = 1, \\qquad a^{-n} = \\frac{1}{a^n}."}</MD>
      </Definition>
      <p>
        These are forced. If <M>{"a^m a^0 = a^{m + 0} = a^m"}</M> is to hold, then <M>{"a^0"}</M> must be 1 (divide by{" "}
        <M>{"a^m \\neq 0"}</M>). If <M>{"a^n a^{-n} = a^0 = 1"}</M> is to hold, then <M>{"a^{-n}"}</M> must be the
        reciprocal of <M>{"a^n"}</M>. One can check that all three laws then hold for all integer exponents.
      </p>

      <Definition title="roots">
        <p>
          Let <M>{"a \\ge 0"}</M> and let <M>n</M> be a positive integer. The <strong><M>n</M>th root</strong>{" "}
          <M>{"\\sqrt[n]{a}"}</M> is the unique number <M>{"b \\ge 0"}</M> with <M>{"b^n = a"}</M>. When <M>{"n = 2"}</M> we
          write <M>{"\\sqrt{a}"}</M>.
        </p>
      </Definition>
      <p>
        Why does such a <M>b</M> exist, and why only one? Uniqueness follows from the last lesson: if{" "}
        <M>{"0 \\le b < c"}</M> then <M>{"b^n < c^n"}</M>, so two different non-negative numbers cannot have the same{" "}
        <M>n</M>th power. Existence needs completeness: you can trap <M>b</M> in shrinking intervals exactly as you trapped{" "}
        <M>{"\\sqrt{2}"}</M>. This is one of the places where the real numbers, and not just the rationals, are needed.
      </p>

      <Definition title="fractional exponents">
        <p>For <M>{"a > 0"}</M>, an integer <M>m</M> and a positive integer <M>n</M>,</p>
        <MD>{"a^{1/n} = \\sqrt[n]{a}, \\qquad a^{m/n} = \\left(\\sqrt[n]{a}\\right)^m."}</MD>
      </Definition>
      <p>
        Forced again: if <M>{"(a^{1/n})^n = a^{(1/n) \\cdot n} = a^1"}</M> is to hold, then <M>{"a^{1/n}"}</M> must be a
        number whose <M>n</M>th power is <M>a</M>. With these definitions the three laws hold for all rational exponents,
        provided the bases are positive.
      </p>

      <Example>
        <p>
          <M>{"27^{2/3} = (\\sqrt[3]{27})^2 = 3^2 = 9"}</M>. <M>{"16^{-3/4} = \\tfrac{1}{(\\sqrt[4]{16})^3} = \\tfrac{1}{8}"}</M>.{" "}
          <M>{"\\dfrac{x^3 y^{-2}}{x^{-1} y} = x^{3 - (-1)} y^{-2 - 1} = \\dfrac{x^4}{y^3}"}</M>.
        </p>
      </Example>

      <Example title="simplifying roots">
        <p>
          Since <M>{"\\sqrt{ab} = \\sqrt a \\sqrt b"}</M> for <M>{"a, b \\ge 0"}</M> (the law <M>{"(ab)^{1/2} = a^{1/2}b^{1/2}"}</M>),
          we can pull out square factors: <M>{"\\sqrt{12} = \\sqrt{4 \\cdot 3} = 2\\sqrt3"}</M>. To clear a root from a
          denominator, multiply top and bottom by it: <M>{"\\tfrac{1}{\\sqrt2} = \\tfrac{\\sqrt2}{2}"}</M>. And by the
          difference of squares, <M>{"\\tfrac{1}{\\sqrt3 - 1} = \\tfrac{\\sqrt3 + 1}{(\\sqrt3)^2 - 1} = \\tfrac{\\sqrt3 + 1}{2}"}</M>.
        </p>
      </Example>

      <Remark title="where the rules break">
        <p>
          Negative bases need care. <M>{"\\sqrt[3]{-8} = -2"}</M> makes sense, since <M>{"(-2)^3 = -8"}</M>. But{" "}
          <M>{"(-8)^{2/6}"}</M> would be <M>{"\\left(\\sqrt[6]{-8}\\right)^2"}</M>, and no real number has a negative sixth
          power, even though <M>{"\\tfrac26 = \\tfrac13"}</M>. That is why the laws are stated for positive bases. And{" "}
          <M>{"0^0"}</M> is left undefined in some settings and taken to be 1 in others, such as counting and power series,
          where 1 is the value that keeps the formulas working.
        </p>
      </Remark>

      <Remark title="very large and very small">
        <p>
          <strong>Scientific notation</strong> writes a number as <M>{"m \\times 10^k"}</M> with <M>{"1 \\le m < 10"}</M>.
          The Earth&rsquo;s mass is about <M>{"5.97 \\times 10^{24}"}</M> kg; a hydrogen atom is about{" "}
          <M>{"1.1 \\times 10^{-10}"}</M> m across. Multiplying such numbers is adding exponents, which is the idea behind
          logarithms, three lessons from now.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "product",
      rung: "check",
      prompt: <p>Compute <M>{"2^5 \\cdot 2^{-3}"}</M>.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "fraction",
      rung: "check",
      prompt: <p>Compute <M>{"27^{2/3}"}</M>.</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "combine",
      rung: "apply",
      prompt: <p>Compute <M>{"\\dfrac{(3^4)^{1/2}}{3^{-1}}"}</M>.</p>,
      answer: { kind: "numeric", value: 27 },
    },
    {
      key: "simplify",
      rung: "apply",
      prompt: <p>Simplify <M>{"(x^3 y^{-2})^2 \\cdot x^{-4} y^5"}</M> for positive <M>x</M>, <M>y</M>.</p>,
      answer: { kind: "expression", value: "x^2 * y", variables: ["x", "y"] },
    },
    {
      key: "surds",
      rung: "apply",
      prompt: <p>Which is equal to <M>{"\\sqrt{12} + \\sqrt{27}"}</M>?</p>,
      answer: { kind: "choice", options: ["√39", "5√3", "6√3", "13√3"], correct: [1] },
    },
    {
      key: "forced",
      rung: "prove",
      prompt: (
        <p>
          Explain, as a short proof, why <M>{"a^0"}</M> must equal 1 and <M>{"a^{-n}"}</M> must equal{" "}
          <M>{"\\tfrac{1}{a^n}"}</M> (for <M>{"a \\neq 0"}</M>) if the law <M>{"a^m a^n = a^{m + n}"}</M> is to keep
          holding. Then say why the argument fails for <M>{"a = 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the law with exponent 0 to get a^m · a^0 = a^m and divides by a^m, noting a^m ≠ 0.",
          "Applies the law with n and -n to get a^n · a^{-n} = a^0 = 1, so a^{-n} is the reciprocal of a^n.",
          "Identifies that for a = 0 the division by a^m (or by a^n) is impossible.",
        ],
      },
    },
    {
      key: "compare",
      rung: "stretch",
      prompt: <p>Which is larger, <M>{"2^{300}"}</M> or <M>{"3^{200}"}</M>? Decide without a calculator.</p>,
      answer: { kind: "choice", options: ["2^300", "3^200", "They are equal."], correct: [1] },
    },
  ],

  teachBack:
    "Explain to a friend why 2 to the power 0 is 1, not 0, without just quoting a rule. Then explain what 2 to the power one half must be, and why.",

  glimpse: (
    <p>
      Next, polynomials and factoring. In the chapter on exponentials, you will ask what <M>{"2^x"}</M> means when{" "}
      <M>x</M> is irrational, and meet the logarithm as the inverse of exponentiation. Calculus finally gives{" "}
      <M>{"a^x"}</M> a fully rigorous definition for every real <M>x</M>, through the exponential function.
    </p>
  ),
};
