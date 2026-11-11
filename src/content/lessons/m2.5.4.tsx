import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { NewtonViz } from "@/components/viz/NewtonViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.5.4",
  minutes: 60,
  links: {
    requires: ["m2.4.1", "m2.3.2"],
    revisits: ["m2.5.3"],
    foreshadows: ["m10.6.3", "m11.7.3", "m8.9.3"],
  },

  puzzle: (
    <>
      <p>
        Your calculator gives <M>{"\\sqrt{2} = 1.41421356\\ldots"}</M> instantly, but it has no table of square roots. The
        intermediate value theorem promises that <M>{"x^2 = 2"}</M> has a solution between 1 and 2, and bisection would find
        it, gaining one binary digit per step: about 30 steps for nine correct decimals.
      </p>
      <p>
        There is a method that gets nine decimals in four steps from a rough start. What does it know that bisection
        ignores?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Bisection uses only the sign of f. Newton&rsquo;s method also uses the slope. Near a guess, the curve is almost its
        tangent line, and a line is easy to solve: just see where it crosses zero. That crossing is the next guess. Step
        through the method below, and watch how fast the errors shrink once the guess is close.
      </p>
      <NewtonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Newton's method">
        <p>
          To solve <M>{"f(x) = 0"}</M>, start from a guess <M>{"x_0"}</M> and repeat
        </p>
        <MD>{"x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}."}</MD>
        <p>
          This is where the tangent line <M>{"y = f(x_n) + f'(x_n)(x - x_n)"}</M> crosses zero: the local linear approximation
          of f, solved exactly.
        </p>
      </Definition>

      <Example title="square roots">
        <p>
          For <M>{"f(x) = x^2 - a"}</M>, the step is <M>{"x_{n+1} = x_n - \\dfrac{x_n^2 - a}{2x_n} = \\tfrac12\\left(x_n + \\dfrac{a}{x_n}\\right)"}</M>,
          the average of a guess and a divided by the guess. From <M>{"x_0 = 1"}</M> with <M>{"a = 2"}</M>: 1.5, 1.416667,
          1.41421569, 1.41421356237469. This rule was known in Babylon nearly four thousand years ago.
        </p>
      </Example>

      <Theorem title="quadratic convergence">
        <p>
          Let f have a continuous second derivative near a root r, with <M>{"f'(r) \\ne 0"}</M>. Then for <M>{"x_0"}</M> close
          enough to r, the errors <M>{"e_n = x_n - r"}</M> satisfy
        </p>
        <MD>{"e_{n+1} \\approx \\frac{f''(r)}{2 f'(r)}\\, e_n^2."}</MD>
        <p>
          Squaring the error roughly doubles the number of correct digits at each step.
        </p>
      </Theorem>
      <Remark title="why the error is squared">
        <p>
          The tangent line differs from f by an amount proportional to the square of the distance from <M>{"x_n"}</M>, as the
          Taylor polynomials, later in this course, make precise. Solving the line instead of f therefore costs an error of order{" "}
          <M>{"e_n^2"}</M>. Real Analysis turns this into a proof.
        </p>
      </Remark>

      <Remark title="when it fails">
        <p>
          Newton&rsquo;s method is fast but not safe. If <M>{"f'(x_n) = 0"}</M> the tangent is flat and the step is undefined;
          if it is nearly 0, the step is huge. The iterates can cycle, as for <M>{"x^3 - 2x + 2"}</M> from 0, or run away
          from the root. Practical root-finders combine it with bisection: take Newton steps while they stay inside a
          bracketing interval, and bisect when they do not.
        </p>
      </Remark>

      <Remark title="Newton's method for optimisation">
        <p>
          A minimum of g is a root of <M>{"g'"}</M>, so Newton&rsquo;s method applied to <M>{"g'"}</M> gives{" "}
          <M>{"x_{n+1} = x_n - g'(x_n)/g''(x_n)"}</M>: a gradient step scaled by the inverse of the curvature. In many dimensions
          the curvature is a matrix, the Hessian, and much of modern optimisation consists of cheap approximations to it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "formula",
      rung: "check",
      prompt: <p>What is the Newton step for solving <M>{"f(x) = 0"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["x − f(x) / f′(x)", "x − f′(x) / f(x)", "x − f(x) · f′(x)", "(x + f(x)) / 2"],
        correct: [0],
      },
    },
    {
      key: "flat",
      rung: "check",
      prompt: <p>What goes wrong if <M>{"f'(x_n) = 0"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["The tangent is horizontal and never crosses zero, so the step is undefined", "The method has found the root", "Nothing; the step is zero"],
        correct: [0],
      },
    },
    {
      key: "step1",
      rung: "apply",
      prompt: <p>Apply one Newton step to <M>{"f(x) = x^2 - 2"}</M> starting from <M>{"x_0 = 1"}</M>. What is <M>{"x_1"}</M>?</p>,
      answer: { kind: "numeric", value: 1.5 },
    },
    {
      key: "step2",
      rung: "apply",
      prompt: <p>Take a second step from <M>{"x_1 = 1.5"}</M>. What is <M>{"x_2"}</M>? Give six decimal places.</p>,
      answer: { kind: "numeric", value: 1.416667, tolerance: 0.000001 },
    },
    {
      key: "recip",
      rung: "apply",
      prompt: (
        <p>
          Early computers found <M>{"1/a"}</M> without dividing, by applying Newton&rsquo;s method to <M>{"f(x) = 1/x - a"}</M>,
          which gives <M>{"x_{n+1} = x_n(2 - a x_n)"}</M>. With <M>{"a = 3"}</M> and <M>{"x_0 = 0.3"}</M>, what is{" "}
          <M>{"x_1"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.33, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 1.0
for _ in range(4):
    x = x - (x * x - 2) / (2 * x)
print(round(x, 10))`}</Code>
          <p>Newton's method on x² − 2 from 1. What does this print, to ten decimal places?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.4142135624, tolerance: 1e-10 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x = 1.0
for _ in range(4):
    x = x - (x * x - 2) / (2 * x)
    print(f"{x:.12f}")`}</Code>
          <p>Newton's method for √2 from 1. How many correct decimal places does the third iterate have (√2 = 1.414213562373…)?</p>
        </>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>newton(f, df, x0, steps)</C>, which applies Newton&rsquo;s update x ← x − f(x)/f′(x) the given number of times and returns x.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def newton(f, df, x0, steps=20):
    return x0
`,
        solution: `def newton(f, df, x0, steps=20):
    x = x0
    for _ in range(steps):
        x = x - f(x) / df(x)
    return x
`,
        tests: [
          { name: "root two", code: `assert abs(newton(lambda x: x * x - 2, lambda x: 2 * x, 1.0) - 2 ** 0.5) < 1e-14, 'Newton on x² − 2 should reach √2.'` },
          { name: "fast", code: `assert abs(newton(lambda x: x * x - 2, lambda x: 2 * x, 1.0, 5) - 2 ** 0.5) < 1e-12, 'Five steps should already give twelve correct digits.'` },
          { name: "cos", code: `import math
assert abs(newton(lambda x: math.cos(x) - x, lambda x: -math.sin(x) - 1, 1.0) - 0.7390851332151607) < 1e-12, 'The fixed point of cos is about 0.739.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>newton_order(f, df, x0, root, steps)</C>, which runs Newton&rsquo;s method and returns the list of errors |xₖ − root| (starting with x0&rsquo;s), stopping early once an error is below 1e−15 or is exactly 0. Then write <C>estimated_order(errors)</C>, the convergence order estimated from the last three usable errors e₀, e₁, e₂ (all positive) as log(e₂/e₁)/log(e₁/e₀). Newton is quadratic at a simple root and only linear at a double root, and the tests check both.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def newton_order(f, df, x0, root, steps):
    return [abs(x0 - root)]

def estimated_order(errors):
    return 1.0
`,
        solution: `import math

def newton_order(f, df, x0, root, steps):
    x = x0
    errs = [abs(x - root)]
    for _ in range(steps):
        if errs[-1] < 1e-15:
            break
        d = df(x)
        if d == 0:
            break
        x = x - f(x) / d
        errs.append(abs(x - root))
    return errs

def estimated_order(errors):
    e = [v for v in errors if v > 0]
    e0, e1, e2 = e[-3], e[-2], e[-1]
    return math.log(e2 / e1) / math.log(e1 / e0)
`,
        tests: [
          { name: "errors", code: `errs = newton_order(lambda x: x * x - 2, lambda x: 2 * x, 1.0, 2 ** 0.5, 10)
assert len(errs) <= 7 and errs[-1] < 1e-15 and errs[1] < errs[0], 'The error collapses within a few steps.'` },
          { name: "quadratic", code: `from fractions import Fraction
errs = newton_order(lambda x: x ** 3 - 2 * x - 5, lambda x: 3 * x * x - 2, 3.0, 2.0945514815423265, 4)
q = estimated_order(errs[:4])
assert 1.7 < q < 2.3, f'Order about 2 at a simple root, got {q:.2f}.'` },
          { name: "linear", code: `errs = newton_order(lambda x: (x - 1) ** 2, lambda x: 2 * (x - 1), 2.0, 1.0, 30)
q = estimated_order(errs[:12])
assert abs(q - 1) < 0.05 and abs(errs[5] / errs[4] - 0.5) < 1e-12, 'At a double root each step only halves the error.'` },
        ],
      },
    },
    {
      key: "sqrt-error",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"f(x) = x^2 - a"}</M> with <M>{"a > 0"}</M>, let <M>{"r = \\sqrt{a}"}</M> and <M>{"e_n = x_n - r"}</M>. Show
          that <M>{"e_{n+1} = e_n^2 / (2x_n)"}</M>. Deduce that if <M>{"x_0 > 0"}</M>, every later iterate is at least r, and
          the error at least squares (up to a constant) at each step.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x_{n+1} − r = (x_n² + a)/(2x_n) − r and puts it over the common denominator 2x_n.",
          "Recognises the numerator x_n² − 2r x_n + r² as (x_n − r)².",
          "Concludes e_{n+1} ≥ 0 when x_n > 0, so x_{n+1} ≥ r for n ≥ 0, and all iterates stay positive.",
          "Notes that for n ≥ 1, x_n ≥ r, so e_{n+1} ≤ e_n²/(2r): quadratic convergence.",
        ],
      },
    },
    {
      key: "digits",
      rung: "stretch",
      prompt: (
        <p>
          Suppose the errors satisfy <M>{"e_{n+1} = e_n^2"}</M> exactly, and <M>{"e_0 = 0.01"}</M>. How many steps does it take
          for the error to fall below <M>{"10^{-15}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend how Newton's method uses the tangent line to improve a guess, why it doubles the number of correct digits near a root, and how it can fail.",

  glimpse: (
    <p>
      Next, L&rsquo;Hôpital&rsquo;s rule, which uses derivatives to settle limits of the form 0/0. Newton&rsquo;s method
      returns in Convex Optimisation as the second-order method that converges fastest near a minimum, and in Numerical
      Linear Algebra and Scientific Computing as the Newton-Schulz iteration, which orthogonalises matrices inside the Muon
      optimiser.
    </p>
  ),
};
