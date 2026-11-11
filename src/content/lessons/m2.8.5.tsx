import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { TaylorViz } from "@/components/viz/TaylorViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.8.5",
  minutes: 70,
  links: {
    requires: ["m2.8.4", "m2.5.1"],
    revisits: ["m2.4.1"],
    foreshadows: ["m8.6.3", "m5.5.1", "m2.9.2"],
  },

  puzzle: (
    <>
      <p>
        The tangent line matches a function&rsquo;s value and slope at a point. A parabola could also match its curvature, a
        cubic its rate of change of curvature, and so on. Matching more and more derivatives at one point, you build better
        and better polynomial copies of the function.
      </p>
      <p>
        Do these copies always converge to the function? Consider <M>{"f(x) = e^{-1/x^2}"}</M>, with <M>{"f(0) = 0"}</M>.
        Every one of its derivatives at 0 is 0. What polynomial copy does that give, and is it any good?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The degree n Taylor polynomial is the unique polynomial of degree n that agrees with f in value and first n derivatives
        at a chosen centre. Raise the degree below and watch the polynomial hug the curve over a wider and wider stretch. For
        some functions the stretch grows without limit; for others it stops at a wall.
      </p>
      <TaylorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Taylor polynomials and series">
        <p>If f has n derivatives at a, its <strong>Taylor polynomial</strong> of degree n about a is</p>
        <MD>{"T_n(x) = \\sum_{k=0}^n \\frac{f^{(k)}(a)}{k!}(x - a)^k."}</MD>
        <p>
          Differentiating k times and putting <M>{"x = a"}</M> kills every term but one, which is why the coefficient is{" "}
          <M>{"f^{(k)}(a)/k!"}</M>. Letting n go to infinity gives the <strong>Taylor series</strong>. About{" "}
          <M>{"a = 0"}</M> it is also called the Maclaurin series.
        </p>
      </Definition>

      <Theorem title="Taylor's theorem with the Lagrange remainder">
        <p>
          If f has <M>{"n + 1"}</M> continuous derivatives on an interval containing a and x, then for some c between a and x,
        </p>
        <MD>{"f(x) = T_n(x) + \\frac{f^{(n+1)}(c)}{(n + 1)!}(x - a)^{n+1}."}</MD>
        <p>
          For <M>{"n = 0"}</M> this is the mean value theorem. Real Analysis proves the general case by applying the same idea
          to a cleverly chosen auxiliary function, or by repeated integration by parts.
        </p>
      </Theorem>

      <Example title="the standard series">
        <MD>{"e^x = \\sum_{n \\ge 0}\\frac{x^n}{n!}, \\quad \\sin x = x - \\frac{x^3}{3!} + \\frac{x^5}{5!} - \\dots, \\quad \\cos x = 1 - \\frac{x^2}{2!} + \\frac{x^4}{4!} - \\dots"}</MD>
        <MD>{"(1 + x)^\\alpha = 1 + \\alpha x + \\frac{\\alpha(\\alpha - 1)}{2!}x^2 + \\dots \\quad (|x| < 1)."}</MD>
        <p>
          The first three hold for every x: the remainder for <M>{"e^x"}</M>, for example, is at most{" "}
          <M>{"e^{|x|}|x|^{n+1}/(n + 1)!"}</M>, and factorials beat powers. The last one is Newton&rsquo;s binomial series,
          valid for any real exponent α.
        </p>
      </Example>

      <Example title="using the remainder">
        <p>
          To compute e to six decimal places from <M>{"T_n(1) = \\sum_{k \\le n} 1/k!"}</M>, bound the remainder by{" "}
          <M>{"e^c/(n + 1)! < 3/(n + 1)!"}</M>. This is below <M>{"10^{-6}"}</M> once <M>{"(n + 1)! > 3 \\times 10^6"}</M>,
          that is, from <M>{"n = 9"}</M>.
        </p>
      </Example>

      <Remark title="when the series lies">
        <p>
          The function <M>{"e^{-1/x^2}"}</M> of the puzzle has every derivative 0 at 0, so its Taylor series about 0 is the
          zero series. It converges everywhere, but to 0, not to the function. A function equal to its Taylor series near
          every point is called <strong>analytic</strong>. Most formulas you meet are analytic, but smoothness alone does not
          guarantee it. The remainder, not the series, is what tells you whether to trust the approximation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "coef",
      rung: "check",
      prompt: <p>What is the coefficient of <M>{"(x - a)^n"}</M> in the Taylor series of f about a?</p>,
      answer: { kind: "choice", options: ["f⁽ⁿ⁾(a) / n!", "f⁽ⁿ⁾(a)", "f(a) / n!", "n! f⁽ⁿ⁾(a)"], correct: [0] },
    },
    {
      key: "flat",
      rung: "check",
      prompt: <p>Does the Taylor series of <M>{"e^{-1/x^2}"}</M> (with value 0 at 0) about 0 equal the function near 0?</p>,
      answer: { kind: "choice", options: ["No; it is the zero series, which equals the function only at 0", "Yes", "The series diverges"], correct: [0] },
    },
    {
      key: "sin3",
      rung: "apply",
      prompt: <p>What is the coefficient of <M>{"x^3"}</M> in the Taylor series of <M>{"\\sin x"}</M> about 0? Give four decimal places.</p>,
      answer: { kind: "numeric", value: -0.1667, tolerance: 0.0002 },
    },
    {
      key: "sqrt",
      rung: "apply",
      prompt: (
        <p>
          Use the degree 2 Taylor polynomial of <M>{"\\sqrt{1 + x}"}</M> about 0 to estimate <M>{"\\sqrt{1.2}"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 1.095, tolerance: 0.0001 },
    },
    {
      key: "degree",
      rung: "apply",
      prompt: (
        <p>
          Using the bound <M>{"3/(n + 1)!"}</M> on the remainder, what is the smallest n for which <M>{"T_n(1)"}</M> is
          guaranteed to be within <M>{"10^{-6}"}</M> of e?
        </p>
      ),
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 1.0
approx = sum((-1) ** k * x ** (2 * k + 1) / math.factorial(2 * k + 1) for k in range(3))
print(abs(math.sin(x) - approx) < x ** 7 / math.factorial(7))`}</Code>
          <p>Is the error of this Taylor polynomial for sin within the remainder bound x⁷/7!?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
x = 0.1
p3 = x - x ** 3 / 6
err = abs(math.sin(x) - p3)
print(f"{err:.2e}", f"{x ** 5 / 120:.2e}")`}</Code>
          <p>The error of the cubic Taylor polynomial of sin at 0.1 and the Lagrange bound x⁵/5!. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["8.33e-08 8.33e-08", "8.33e-08 1.67e-04", "1.67e-04 8.33e-08", "0.00e+00 8.33e-08"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>taylor_exp(x, n)</C>, the Taylor polynomial of eˣ at 0 of degree n, and <C>degree_needed(x, tol)</C>, the smallest n with |eˣ − taylor_exp(x, n)| &lt; tol.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def taylor_exp(x, n):
    return 1.0

def degree_needed(x, tol):
    return 0
`,
        solution: `import math

def taylor_exp(x, n):
    return sum(x ** k / math.factorial(k) for k in range(n + 1))

def degree_needed(x, tol):
    n = 0
    while abs(math.exp(x) - taylor_exp(x, n)) >= tol:
        n += 1
    return n
`,
        tests: [
          { name: "value", code: `assert abs(taylor_exp(1, 10) - math.e) < 1e-7, 'Degree 10 at x = 1 is within 10⁻⁷ of e.'` },
          { name: "degree", code: `assert degree_needed(1, 1e-6) == 9, 'Degree 9 is the first to get e within 10⁻⁶.'` },
          { name: "further out", code: `assert degree_needed(5, 1e-6) > degree_needed(1, 1e-6), 'Further from 0 needs more terms.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>taylor_coeffs(derivs, a)</C>, the Taylor coefficients f⁽ᵏ⁾(a)/k! from a list of derivative functions, and <C>taylor_eval(coeffs, a, x)</C>. Then write <C>degree_for(f_bound, a, x, tol)</C>, the smallest n for which the Lagrange bound M_{"{n+1}"}|x − a|ⁿ⁺¹/(n + 1)! is below tol, where <C>f_bound(k)</C> gives a bound on |f⁽ᵏ⁾| between a and x. Check in the tests that the actual error is within the bound.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def taylor_coeffs(derivs, a):
    return [d(a) for d in derivs]

def taylor_eval(coeffs, a, x):
    return coeffs[0]

def degree_for(f_bound, a, x, tol):
    return 1
`,
        solution: `import math

def taylor_coeffs(derivs, a):
    return [d(a) / math.factorial(k) for k, d in enumerate(derivs)]

def taylor_eval(coeffs, a, x):
    r = 0.0
    for c in reversed(coeffs):
        r = r * (x - a) + c
    return r

def degree_for(f_bound, a, x, tol):
    n = 0
    while f_bound(n + 1) * abs(x - a) ** (n + 1) / math.factorial(n + 1) >= tol:
        n += 1
    return n
`,
        tests: [
          { name: "sin", code: `import math
ds = [math.sin, math.cos, lambda x: -math.sin(x), lambda x: -math.cos(x)] * 3
c = taylor_coeffs(ds, 0)
assert abs(taylor_eval(c, 0, 0.5) - math.sin(0.5)) < 1e-11, 'Degree 11 at 0.5.'` },
          { name: "shifted", code: `import math
ds = [math.exp] * 15
c = taylor_coeffs(ds, 1.0)
assert abs(taylor_eval(c, 1.0, 1.5) - math.exp(1.5)) < 1e-14, 'Expand eˣ about 1.'` },
          { name: "degree", code: `import math
n = degree_for(lambda k: math.e, 0, 1, 1e-10)
assert n == 13 and math.e / math.factorial(14) < 1e-10 <= math.e / math.factorial(13), 'For eˣ on [0, 1] use M = e.'` },
          { name: "within", code: `import math
n = degree_for(lambda k: 1, 0, 2.0, 1e-8)
ds = [math.cos, lambda x: -math.sin(x), lambda x: -math.cos(x), math.sin] * 10
c = taylor_coeffs(ds[:n + 1], 0)
assert abs(taylor_eval(c, 0, 2.0) - math.cos(2.0)) < 1e-8, 'The actual error is within the bound.'` },
        ],
      },
    },
    {
      key: "exp-all",
      rung: "prove",
      prompt: (
        <p>
          Prove that the Taylor series of <M>{"e^x"}</M> about 0 converges to <M>{"e^x"}</M> for every real x, using the
          Lagrange remainder.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes every derivative of eˣ is eˣ, so the remainder is e^c xⁿ⁺¹/(n + 1)! with c between 0 and x.",
          "Bounds e^c ≤ e^|x|, a constant once x is fixed.",
          "Shows |x|ⁿ⁺¹/(n + 1)! → 0 for fixed x, for example because the ratio of consecutive terms |x|/(n + 2) tends to 0.",
          "Concludes the remainder tends to 0, so the partial sums converge to eˣ.",
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: <p>Use Taylor series to find <M>{"\\lim_{x \\to 0} \\dfrac{e^x - 1 - x}{x^2}"}</M>.</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend how a Taylor polynomial is built from derivatives at one point, what the remainder tells you, and why a function can differ from its own Taylor series.",

  glimpse: (
    <p>
      This completes sequences and series. The last chapter turns Taylor&rsquo;s theorem into a working tool for estimating
      sizes and errors, starting with big-O notation. Multivariable and Matrix Calculus extends Taylor&rsquo;s theorem to
      functions of many variables, where the second-order term is built from the Hessian matrix, the key to understanding
      the curvature of a loss surface.
    </p>
  ),
};
