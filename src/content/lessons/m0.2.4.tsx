import { M, MD } from "@/components/Math";
import { Axiom, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { SignChartViz } from "@/components/viz/SignChartViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.4",
  minutes: 65,
  links: {
    revisits: ["m0.1.2", "m0.1.5"],
    foreshadows: ["m2.1.3", "m2.5.3"],
  },

  puzzle: (
    <>
      <p>True or false: if <M>{"a < b"}</M>, then <M>{"a^2 < b^2"}</M>.</p>
      <p>
        And: if <M>{"a < b"}</M>, then <M>{"\\tfrac{1}{a} > \\tfrac{1}{b}"}</M>. Before deciding, try a few pairs, and
        make sure some of them include negative numbers.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Both are false in general. <M>{"-3 < 1"}</M>, but <M>{"9 > 1"}</M>. And <M>{"-1 < 2"}</M>, but{" "}
        <M>{"\\tfrac{1}{-1} = -1"}</M> is not greater than <M>{"\\tfrac12"}</M>. Both statements are true when{" "}
        <M>a</M> and <M>b</M> are positive, and that is exactly the kind of condition that makes inequalities harder than
        equations.
      </p>
      <p>
        An equation is a balance; an inequality is a balance that tips one way. Adding the same amount to both sides keeps
        the tilt. Multiplying by a positive number keeps it. Multiplying by a negative number turns the number line round
        through 0, and the tilt reverses. Squaring is only safe once you know the sign.
      </p>
      <p>
        When the expression is a product, the question becomes: where is it positive, and where negative? A product of two
        factors is negative exactly where they disagree in sign. Move the roots and watch.
      </p>
      <SignChartViz />
    </>
  ),

  theory: (
    <>
      <p>Everything about inequalities follows from four properties of the real numbers.</p>
      <Axiom title="order">
        <ol>
          <li><strong>Trichotomy.</strong> For any <M>a</M>, <M>b</M>, exactly one of <M>{"a < b"}</M>, <M>{"a = b"}</M>, <M>{"a > b"}</M> holds.</li>
          <li><strong>Transitivity.</strong> If <M>{"a < b"}</M> and <M>{"b < c"}</M>, then <M>{"a < c"}</M>.</li>
          <li><strong>Addition.</strong> If <M>{"a < b"}</M>, then <M>{"a + c < b + c"}</M> for every <M>c</M>.</li>
          <li><strong>Positive multiplication.</strong> If <M>{"a < b"}</M> and <M>{"c > 0"}</M>, then <M>{"ac < bc"}</M>.</li>
        </ol>
      </Axiom>
      <p>
        You proved the fifth rule, that multiplying by a negative number reverses an inequality, for integers; the same
        proof works for all reals. Here are the facts you will use constantly.
      </p>

      <Proposition title="squares are never negative">
        <p>For every real <M>a</M>, <M>{"a^2 \\ge 0"}</M>, with equality only when <M>{"a = 0"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          By trichotomy, <M>a</M> is positive, zero or negative. If <M>{"a > 0"}</M>, multiply <M>{"0 < a"}</M> by the
          positive number <M>a</M>: <M>{"0 < a^2"}</M>. If <M>{"a < 0"}</M>, multiplying <M>{"a < 0"}</M> by the negative
          number <M>a</M> reverses it: <M>{"a^2 > 0"}</M>. If <M>{"a = 0"}</M>, then <M>{"a^2 = 0"}</M>.
        </p>
      </Proof>

      <Proposition title="squaring positive numbers">
        <p>If <M>{"0 \\le a < b"}</M>, then <M>{"a^2 < b^2"}</M>. If <M>{"0 < a < b"}</M>, then <M>{"\\tfrac{1}{a} > \\tfrac{1}{b}"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          <M>{"b^2 - a^2 = (b - a)(b + a)"}</M>. Here <M>{"b - a > 0"}</M> and <M>{"b + a > 0"}</M>, so the product is
          positive. For reciprocals, <M>{"\\tfrac1a - \\tfrac1b = \\tfrac{b - a}{ab}"}</M>, a positive number divided by a
          positive number.
        </p>
      </Proof>

      <Example title="a linear inequality">
        <MD>{"3 - 2x > 7 \\iff -2x > 4 \\iff x < -2."}</MD>
        <p>
          The first step adds <M>{"-3"}</M>; the second multiplies by <M>{"-\\tfrac12"}</M> and so reverses the inequality.
          Each step can be undone, so the solution set is exactly <M>{"(-\\infty, -2)"}</M>. Check with a value: at{" "}
          <M>{"x = -3"}</M>, <M>{"3 - 2(-3) = 9 > 7"}</M>.
        </p>
      </Example>

      <Theorem title="sign of a product">
        <p>
          <M>{"AB > 0"}</M> exactly when <M>A</M> and <M>B</M> are both positive or both negative, and <M>{"AB < 0"}</M>{" "}
          exactly when they have opposite signs.
        </p>
      </Theorem>
      <Proof>
        <p>
          If both are positive, positive multiplication gives <M>{"AB > 0"}</M>. If both are negative,{" "}
          <M>{"AB = (-A)(-B)"}</M> with both factors positive. If they have opposite signs, say <M>{"A > 0 > B"}</M>,
          multiplying <M>{"B < 0"}</M> by the positive <M>A</M> gives <M>{"AB < 0"}</M>. If either is 0, so is the product.
        </p>
      </Proof>

      <Example title="a sign chart">
        <p>
          Solve <M>{"x^2 - 5x + 4 \\le 0"}</M>. Factorise: <M>{"(x - 1)(x - 4) \\le 0"}</M>. The factor <M>{"x - 1"}</M>{" "}
          changes sign at 1, and <M>{"x - 4"}</M> at 4. So:
        </p>
        <table className="table">
          <thead><tr><th></th><th>x &lt; 1</th><th>1 &lt; x &lt; 4</th><th>x &gt; 4</th></tr></thead>
          <tbody>
            <tr><td><M>{"x - 1"}</M></td><td>−</td><td>+</td><td>+</td></tr>
            <tr><td><M>{"x - 4"}</M></td><td>−</td><td>−</td><td>+</td></tr>
            <tr><td>product</td><td>+</td><td>−</td><td>+</td></tr>
          </tbody>
        </table>
        <p>Including the roots, where the product is 0, the solution set is <M>{"[1, 4]"}</M>.</p>
      </Example>

      <Theorem title="two numbers and their average">
        <p>For all real <M>a</M>, <M>b</M>: <M>{"a^2 + b^2 \\ge 2ab"}</M>, with equality exactly when <M>{"a = b"}</M>. Consequently, for <M>{"x, y \\ge 0"}</M>,</p>
        <MD>{"\\frac{x + y}{2} \\ge \\sqrt{xy}."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"a^2 + b^2 - 2ab = (a - b)^2 \\ge 0"}</M>, with equality exactly when <M>{"a - b = 0"}</M>. For the second
          statement, put <M>{"a = \\sqrt{x}"}</M> and <M>{"b = \\sqrt{y}"}</M>: then <M>{"x + y \\ge 2\\sqrt{xy}"}</M>; divide
          by 2.
        </p>
      </Proof>

      <Remark title="why this matters">
        <p>
          The second inequality says the arithmetic mean of two non-negative numbers is at least their geometric mean. It
          answers questions like: of all rectangles with perimeter 20, which has the largest area? (If the sides are{" "}
          <M>x</M> and <M>y</M>, then <M>{"\\sqrt{xy} \\le \\tfrac{x + y}{2} = 5"}</M>, so the area is at most 25, reached by
          the square.) Calculus will find such maxima by other means; inequalities often get there first.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "linear",
      rung: "check",
      prompt: <p>Solve <M>{"5 - 3x \\ge 11"}</M>.</p>,
      answer: { kind: "choice", options: ["x ≥ -2", "x ≤ -2", "x ≥ 2", "x ≤ 2"], correct: [1] },
    },
    {
      key: "always",
      rung: "check",
      prompt: <p>Suppose <M>{"a < b"}</M>. Select every statement that must be true.</p>,
      answer: { kind: "choice", options: ["a + 5 < b + 5", "-a > -b", "a² < b²", "2a < 2b"], correct: [0, 1, 3] },
    },
    {
      key: "product",
      rung: "apply",
      prompt: <p>Which set is the solution set of <M>{"(x + 2)(x - 3) > 0"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["(-2, 3)", "x < -2 or x > 3", "x < -3 or x > 2", "(-3, 2)"],
        correct: [1],
      },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>How many integers <M>x</M> satisfy <M>{"x^2 < 10"}</M>?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "reciprocal",
      rung: "apply",
      prompt: <p>Which is the solution set of <M>{"\\tfrac{1}{x} < 1"}</M>? (Careful: you do not know the sign of <M>x</M>.)</p>,
      answer: {
        kind: "choice",
        options: ["x > 1", "x < 0 or x > 1", "0 < x < 1", "x < 1"],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`print([x for x in range(-5, 6) if -2 * x + 1 > 5])`}</Code>
          <p>Dividing an inequality by a negative number flips it. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-5, -4, -3]", "[3, 4, 5]", "[-5, -4, -3, -2]", "[]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>solve_ineq(a, b, c)</C> for ax + b &gt; c with a ≠ 0, returning a pair (direction, bound): <C>("&gt;", t)</C> when the solution is x &gt; t and <C>("&lt;", t)</C> when it is x &lt; t.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def solve_ineq(a, b, c):
    return ('>', (c - b) / a)
`,
        solution: `def solve_ineq(a, b, c):
    t = (c - b) / a
    return ('>', t) if a > 0 else ('<', t)
`,
        tests: [
          { name: "positive", code: `d, t = solve_ineq(3, 1, 7)
assert d == '>' and abs(t - 2) < 1e-9, '3x + 1 > 7 gives x > 2.'` },
          { name: "negative", code: `d, t = solve_ineq(-2, 1, 5)
assert d == '<' and abs(t + 2) < 1e-9, 'Dividing by −2 flips the inequality: x < −2.'` },
        ],
      },
    },
    {
      key: "am-gm",
      rung: "prove",
      prompt: (
        <p>
          Prove that for all real <M>a</M> and <M>b</M>, <M>{"a^2 + b^2 \\ge 2ab"}</M>, and that equality holds exactly when{" "}
          <M>{"a = b"}</M>. Then use it to show that a rectangle with perimeter 20 has area at most 25.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the difference as (a - b)² and uses that squares are non-negative.",
          "Proves both directions of the equality condition.",
          "Sets up the rectangle with sides x and y, x + y = 10.",
          "Derives xy ≤ 25, for example from (x - y)² ≥ 0 or the mean inequality.",
        ],
      },
    },
    {
      key: "min",
      rung: "stretch",
      prompt: <p>For <M>{"x > 0"}</M>, what is the smallest possible value of <M>{"x + \\tfrac{1}{x}"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend why multiplying both sides of an inequality by a negative number flips it, and why 'if a < b then a² < b²' can fail. Use the number line.",

  glimpse: (
    <p>
      Next, exponents and roots. The four order properties are the order axioms that open Calculus, and the inequalities
      you met here, especially the triangle inequality and the mean inequality, are the everyday tools of analysis. In
      optimisation you will see calculus confirm what the mean inequality already told you.
    </p>
  ),
};
