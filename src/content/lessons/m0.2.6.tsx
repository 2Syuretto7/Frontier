import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { AreaModelViz } from "@/components/viz/AreaModelViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.2.6",
  minutes: 75,
  links: {
    revisits: ["m0.2.1"],
    foreshadows: ["m0.3.3", "m0.6.4", "m2.7.2"],
  },

  puzzle: (
    <>
      <p>Two numbers add up to 13 and multiply to 40. What are they?</p>
      <p>
        You may find them by trial. Now suppose they added to 13 and multiplied to 41. Trial will not help. Is there a
        method that always works?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Call one number <M>x</M>; the other is <M>{"13 - x"}</M>, so <M>{"x(13 - x) = 40"}</M>, or{" "}
        <M>{"x^2 - 13x + 40 = 0"}</M>. Solving a problem like this means turning an expression such as{" "}
        <M>{"x^2 - 13x + 40"}</M> back into a product. A product is zero only when one of its factors is.
      </p>
      <p>
        Multiplying out is easy to picture as area: a rectangle with sides <M>{"x + a"}</M> and <M>{"x + b"}</M> is cut
        into a square, two strips and a small block. Factorising is reading the pieces back into a rectangle.
      </p>
      <AreaModelViz />
      <p>
        For <M>{"x^2 - 13x + 40"}</M> we want two numbers with sum <M>{"-13"}</M> and product 40: <M>{"-5"}</M> and{" "}
        <M>{"-8"}</M>. So <M>{"(x - 5)(x - 8) = 0"}</M>, and the numbers are 5 and 8. For the product 41, no such pair
        is easy to spot, and you need a method that does not rely on spotting: completing the square.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="polynomials">
        <p>A <strong>polynomial</strong> in <M>x</M> is an expression of the form</p>
        <MD>{"p(x) = a_n x^n + a_{n-1} x^{n-1} + \\cdots + a_1 x + a_0,"}</MD>
        <p>
          where the <strong>coefficients</strong> <M>{"a_0, \\ldots, a_n"}</M> are numbers and <M>{"a_n \\neq 0"}</M>. Its{" "}
          <strong>degree</strong> is <M>n</M>. Degree 1 is <em>linear</em>, 2 <em>quadratic</em>, 3 <em>cubic</em>. A{" "}
          <strong>root</strong> of <M>p</M> is a number <M>r</M> with <M>{"p(r) = 0"}</M>.
        </p>
      </Definition>

      <Proposition title="zero products">
        <p>If <M>{"AB = 0"}</M>, then <M>{"A = 0"}</M> or <M>{"B = 0"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          Suppose <M>{"AB = 0"}</M> and <M>{"A \\neq 0"}</M>. Multiply both sides by <M>{"\\tfrac1A"}</M>:{" "}
          <M>{"B = \\tfrac1A \\cdot 0 = 0"}</M>.
        </p>
      </Proof>
      <p>This is why factorising solves equations: the roots of <M>{"(x - 5)(x - 8)"}</M> are exactly 5 and 8.</p>

      <Definition title="four ways to factorise">
        <ol>
          <li><strong>Common factor.</strong> <M>{"6x^3 - 9x^2 = 3x^2(2x - 3)"}</M>.</li>
          <li><strong>Difference of squares.</strong> <M>{"a^2 - b^2 = (a - b)(a + b)"}</M>, so <M>{"x^2 - 9 = (x - 3)(x + 3)"}</M>.</li>
          <li><strong>Sum and product.</strong> <M>{"x^2 + sx + p = (x + u)(x + v)"}</M> when <M>{"u + v = s"}</M> and <M>{"uv = p"}</M>.</li>
          <li><strong>Grouping.</strong> <M>{"x^3 + 2x^2 + 3x + 6 = x^2(x + 2) + 3(x + 2) = (x^2 + 3)(x + 2)"}</M>.</li>
        </ol>
      </Definition>

      <p>
        When no factors can be spotted, <strong>completing the square</strong> always works. The identity{" "}
        <M>{"(x + h)^2 = x^2 + 2hx + h^2"}</M> says that <M>{"x^2 + 2hx"}</M> is a perfect square missing only{" "}
        <M>{"h^2"}</M>.
      </p>

      <Theorem title="the quadratic formula">
        <p>
          Let <M>{"a \\neq 0"}</M> and let <M>{"\\Delta = b^2 - 4ac"}</M>, the <strong>discriminant</strong>. The equation{" "}
          <M>{"ax^2 + bx + c = 0"}</M> has two real solutions if <M>{"\\Delta > 0"}</M>, one if <M>{"\\Delta = 0"}</M>, and
          none if <M>{"\\Delta < 0"}</M>. When <M>{"\\Delta \\ge 0"}</M> they are
        </p>
        <MD>{"x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}."}</MD>
      </Theorem>
      <Proof>
        <p>Divide by <M>a</M>, then complete the square with <M>{"h = \\tfrac{b}{2a}"}</M>:</p>
        <MD>{"x^2 + \\frac{b}{a}x + \\frac{c}{a} = 0 \\iff \\left(x + \\frac{b}{2a}\\right)^2 - \\frac{b^2}{4a^2} + \\frac{c}{a} = 0 \\iff \\left(x + \\frac{b}{2a}\\right)^2 = \\frac{b^2 - 4ac}{4a^2}."}</MD>
        <p>
          The left side is a square, so it is never negative, and the denominator <M>{"4a^2"}</M> is positive. If{" "}
          <M>{"\\Delta < 0"}</M> the right side is negative and there is no solution. Otherwise, a number whose square is{" "}
          <M>{"\\tfrac{\\Delta}{4a^2}"}</M> is <M>{"\\pm\\tfrac{\\sqrt\\Delta}{2a}"}</M> (taking the sign of <M>a</M> into
          the <M>{"\\pm"}</M>), so <M>{"x = -\\tfrac{b}{2a} \\pm \\tfrac{\\sqrt\\Delta}{2a}"}</M>. These two values coincide
          exactly when <M>{"\\Delta = 0"}</M>.
        </p>
      </Proof>

      <Example title="the puzzle, finished">
        <p>
          Sum 13 and product 41: <M>{"x^2 - 13x + 41 = 0"}</M>, so <M>{"\\Delta = 169 - 164 = 5"}</M> and{" "}
          <M>{"x = \\tfrac{13 \\pm \\sqrt5}{2}"}</M>. The two numbers are <M>{"\\tfrac{13 + \\sqrt5}{2}"}</M> and{" "}
          <M>{"\\tfrac{13 - \\sqrt5}{2}"}</M>; check that they add to 13 and multiply to <M>{"\\tfrac{169 - 5}{4} = 41"}</M>.
        </p>
      </Example>

      <Theorem title="the factor theorem">
        <p>For a polynomial <M>p</M> and a number <M>r</M>: <M>{"p(r) = 0"}</M> exactly when <M>{"p(x) = (x - r)q(x)"}</M> for some polynomial <M>q</M>.</p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"p(x) = (x - r)q(x)"}</M>, then <M>{"p(r) = 0 \\cdot q(r) = 0"}</M>. Conversely, for each <M>k</M> the
          identity
        </p>
        <MD>{"x^k - r^k = (x - r)(x^{k-1} + x^{k-2}r + \\cdots + r^{k-1})"}</MD>
        <p>
          (check it by expanding: everything cancels except the two ends) shows that <M>{"x^k - r^k"}</M> has the factor{" "}
          <M>{"x - r"}</M>. Now <M>{"p(x) = p(x) - p(r) = \\sum a_k (x^k - r^k)"}</M>, a sum of terms each with that
          factor, so <M>{"x - r"}</M> divides <M>{"p(x)"}</M>.
        </p>
      </Proof>

      <Remark title="consequences">
        <p>
          The same argument shows that <M>{"p(r)"}</M> is the remainder when <M>{"p(x)"}</M> is divided by <M>{"x - r"}</M>.
          And a polynomial of degree <M>n</M> has at most <M>n</M> roots: each root splits off a factor <M>{"x - r"}</M> and
          lowers the degree by one. Whether every polynomial has a root at all, if we allow more numbers than the reals,
          is the fundamental theorem of algebra, which comes with complex numbers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "roots",
      rung: "check",
      prompt: <p>What is the larger root of <M>{"x^2 - 5x + 6 = 0"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "squares",
      rung: "check",
      prompt: <p>Which is a factorisation of <M>{"4x^2 - 25"}</M>?</p>,
      answer: { kind: "choice", options: ["(4x - 5)(x + 5)", "(2x - 5)(2x + 5)", "(2x - 5)²", "(4x - 25)(x + 1)"], correct: [1] },
    },
    {
      key: "sum-product",
      rung: "apply",
      prompt: <p>Two numbers have sum 13 and product 40. What is the larger?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "discriminant",
      rung: "apply",
      prompt: <p>How many real solutions does <M>{"2x^2 - 4x + 5 = 0"}</M> have?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "remainder",
      rung: "apply",
      prompt: <p>What is the remainder when <M>{"x^3 - 2x + 5"}</M> is divided by <M>{"x - 2"}</M>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
print(np.polymul([1, 2], [1, -3]))`}</Code>
          <p>numpy stores a polynomial by its coefficients, highest power first. What does (x + 2)(x − 3) give?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1 -1 -6]", "[ 1  5 -6]", "[ 1 -1  6]", "[ 1 -6]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
p = np.poly1d([1, -5, 6])
q = np.poly1d([1, -2])
quot, rem = np.polydiv(p.coeffs, q.coeffs)
print(quot, rem)`}</Code>
          <p>Dividing x² − 5x + 6 by x − 2. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1. -3.] [0.]", "[ 1. 3.] [0.]", "[ 1. -3.] [6.]", "[-3. 1.] [0.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>multiply(p, q)</C>, which multiplies two polynomials given as coefficient lists [a₀, a₁, …], lowest power first, by adding each product aᵢbⱼ into position i + j.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def multiply(p, q):
    return [a * b for a, b in zip(p, q)]
`,
        solution: `def multiply(p, q):
    out = [0] * (len(p) + len(q) - 1)
    for i, a in enumerate(p):
        for j, b in enumerate(q):
            out[i + j] += a * b
    return out
`,
        tests: [
          { name: "binomials", code: `assert multiply([2, 1], [-3, 1]) == [-6, -1, 1], '(2 + x)(−3 + x) = −6 − x + x².'` },
          { name: "square", code: `assert multiply([1, 1], [1, 1]) == [1, 2, 1] and multiply([1, 0, 1], [1, 0, -1]) == [1, 0, 0, 0, -1], '(1 + x)² = 1 + 2x + x².'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>divide(p, d)</C>, polynomial long division with coefficient lists highest power first (as in <C>[1, -5, 6]</C> for x² − 5x + 6), returning (quotient, remainder) with the remainder shorter than d. Use <C>fractions.Fraction</C> so the results are exact. Then write <C>rational_roots(p)</C> for a polynomial with integer coefficients and non-zero constant term, the sorted list of its rational roots, testing every ±(divisor of constant)/(divisor of leading).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction

def divide(p, d):
    return ([Fraction(p[0], d[0])], [])

def rational_roots(p):
    return []
`,
        solution: `from fractions import Fraction

def divide(p, d):
    p = [Fraction(c) for c in p]
    q = []
    while len(p) >= len(d):
        c = p[0] / d[0]
        q.append(c)
        for i in range(len(d)):
            p[i] -= c * d[i]
        p.pop(0)
    return (q, p)

def divisors(n):
    n = abs(n)
    return [k for k in range(1, n + 1) if n % k == 0]

def rational_roots(p):
    def val(x):
        r = Fraction(0)
        for c in p:
            r = r * x + c
        return r
    cands = {Fraction(s * a, b) for a in divisors(p[-1]) for b in divisors(p[0]) for s in (1, -1)}
    return sorted(x for x in cands if val(x) == 0)
`,
        tests: [
          { name: "exact", code: `q, r = divide([1, -5, 6], [1, -2])
assert q == [1, -3] and all(c == 0 for c in r), 'x² − 5x + 6 = (x − 2)(x − 3).'` },
          { name: "remainder", code: `q, r = divide([2, 0, 3, -1], [1, 1])
assert q == [2, -2, 5] and r == [-6], 'Divide by x + 1: the remainder is p(−1) = −6.'` },
          { name: "fractions", code: `from fractions import Fraction
q, r = divide([1, 0, 1], [2, 1])
assert q == [Fraction(1, 2), Fraction(-1, 4)] and r == [Fraction(5, 4)], 'Keep exact fractions.'` },
          { name: "roots", code: `from fractions import Fraction
assert rational_roots([1, -5, 6]) == [2, 3] and rational_roots([2, -1, -1]) == [Fraction(-1, 2), 1] and rational_roots([1, 0, 1]) == [], 'Test every candidate p/q.'` },
          { name: "cubic", code: `from fractions import Fraction
assert rational_roots([6, -11, -3, 2]) == [Fraction(-1, 2), Fraction(1, 3), 2], '6x³ − 11x² − 3x + 2 has three rational roots.'` },
        ],
      },
    },
    {
      key: "formula",
      rung: "prove",
      prompt: (
        <p>
          Derive the solutions of <M>{"x^2 + bx + c = 0"}</M> by completing the square. Show each step, and say what happens
          when <M>{"b^2 < 4c"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x² + bx as (x + b/2)² - b²/4.",
          "Rearranges to (x + b/2)² = (b² - 4c)/4.",
          "Takes square roots with ±, giving x = (-b ± √(b² - 4c))/2.",
          "Explains that if b² < 4c the right side is negative, so there is no real solution because squares are non-negative.",
        ],
      },
    },
    {
      key: "find-k",
      rung: "stretch",
      prompt: <p>For which value of <M>k</M> is <M>{"x - 1"}</M> a factor of <M>{"x^3 + kx^2 - 4x + 2"}</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
  ],

  teachBack:
    "Explain the idea behind completing the square to someone who only knows how to factorise by spotting numbers. A picture of a square with a corner missing may help.",

  glimpse: (
    <p>
      This completes algebra. Next, functions: instead of solving for one value of <M>x</M>, you study how an expression
      changes as <M>x</M> varies, and quadratics become parabolas. When <M>{"\\Delta < 0"}</M>, the complex numbers
      supply the missing roots. Factorising returns as partial fractions in Calculus, and when a polynomial has no neat
      factors, Newton&rsquo;s method in Calculus finds its roots to any accuracy you like.
    </p>
  ),
};
