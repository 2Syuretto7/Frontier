import { M, MD } from "@/components/Math";
import { Definition, Example, Quote, Remark, Theorem } from "@/components/lesson/Blocks";
import { BoxViz } from "@/components/viz/BoxViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.5.3",
  minutes: 85,
  links: {
    revisits: ["m0.3.3", "m2.3.3"],
    foreshadows: ["m5.5.5"],
  },

  puzzle: (
    <>
      <p>
        You have a square sheet of card, 12 cm on each side. Cut a small square from each corner, fold up the four flaps,
        and you have an open box. Cut tiny squares and the box is a shallow tray; cut large ones and it is a narrow
        chimney with almost no base.
      </p>
      <p>Somewhere in between is the cut that holds the most. Where exactly, and how can you be sure it is the best?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        As the cut grows from 0 to 6, the volume starts at 0, rises, and falls back to 0. At the very top of the hump the
        graph is flat for an instant: rising has stopped and falling has not begun. So the best cut is where the derivative
        of the volume is 0. Try to find it by hand before revealing it.
      </p>
      <BoxViz />
    </>
  ),

  theory: (
    <>
      <Definition title="critical point">
        <p>
          A <strong>critical point</strong> of f is a point c in the interior of its domain where <M>{"f'(c) = 0"}</M> or{" "}
          <M>{"f'(c)"}</M> does not exist.
        </p>
      </Definition>

      <Theorem title="the closed interval method">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, it has a largest and a smallest value there, and each occurs either at an
          endpoint or at a critical point. So to find them: list the critical points in <M>{"(a, b)"}</M>, evaluate f at
          these and at a and b, and compare.
        </p>
      </Theorem>
      <p>
        The extreme value theorem says the extremes exist. Fermat&rsquo;s theorem says that an extreme inside the interval,
        at a point where f is differentiable, has <M>{"f' = 0"}</M>. So every extreme is on the list.
      </p>

      <Example title="the box">
        <p>
          With cut x, the box has base <M>{"12 - 2x"}</M> by <M>{"12 - 2x"}</M> and height x, so{" "}
          <M>{"V(x) = x(12 - 2x)^2"}</M> on <M>{"[0, 6]"}</M>. By the product rule,
        </p>
        <MD>{"V'(x) = (12 - 2x)^2 - 4x(12 - 2x) = (12 - 2x)(12 - 6x),"}</MD>
        <p>
          which is 0 only at <M>{"x = 2"}</M> inside the interval. Compare: <M>{"V(0) = 0"}</M>, <M>{"V(6) = 0"}</M>,{" "}
          <M>{"V(2) = 2 \\cdot 8^2 = 128"}</M>. The best cut is 2 cm, giving 128 cubic centimetres.
        </p>
      </Example>

      <Example title="the cheapest can">
        <p>
          A can must hold a volume V. Which shape uses the least metal? With radius r and height h,{" "}
          <M>{"V = \\pi r^2 h"}</M>, so <M>{"h = V/(\\pi r^2)"}</M>, and the surface area is
        </p>
        <MD>{"A(r) = 2\\pi r^2 + 2\\pi r h = 2\\pi r^2 + \\frac{2V}{r}, \\qquad r > 0."}</MD>
        <p>
          <M>{"A'(r) = 4\\pi r - 2V/r^2"}</M>, which is 0 when <M>{"r^3 = V/(2\\pi)"}</M>. Then{" "}
          <M>{"h = V/(\\pi r^2) = 2r"}</M>: the best can is as tall as it is wide. The domain{" "}
          <M>{"(0, \\infty)"}</M> is not closed, so the closed interval method does not apply directly. Instead,{" "}
          <M>{"A'"}</M> is negative before the critical point and positive after it, so A decreases and then increases, and
          the critical point gives the smallest value on the whole domain.
        </p>
      </Example>

      <Remark title="a method for word problems">
        <ol>
          <li>Name the quantity to be made largest or smallest, and the variables it depends on.</li>
          <li>Use the constraints to write it as a function of one variable.</li>
          <li>Find the domain: which values make physical sense, including the endpoints.</li>
          <li>Find the critical points, and compare values, or use a derivative test.</li>
          <li>Answer the question that was asked, with units, and check that it is sensible.</li>
        </ol>
        <p>
          The third step is the one most often forgotten. A critical point is only a candidate, and the best value can be at
          an endpoint, as the practice questions show.
        </p>
      </Remark>

      <Quote source={<>Leonhard Euler, <cite>Methodus inveniendi lineas curvas</cite> (1744), first appendix</>}>
        <p>
          For since the fabric of the universe is most perfect and the work of a most wise Creator, nothing at all takes
          place in the universe in which some rule of maximum or minimum does not appear.
        </p>
      </Quote>
      <p>
        Euler&rsquo;s confidence was theological, but the physics has borne him out surprisingly often. Light travels
        between two points along the path that takes least time, and a hanging chain settles into the shape with the lowest
        centre of gravity.
      </p>
    </>
  ),

  practice: [
    {
      key: "critical",
      rung: "check",
      prompt: (
        <p>
          At what x does <M>{"x^2 - 4x + 1"}</M> have its critical point?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "product",
      rung: "check",
      prompt: (
        <p>
          What is the largest value of <M>{"x(10 - x)"}</M> on <M>{"[0, 10]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 25 },
    },
    {
      key: "endpoint",
      rung: "apply",
      prompt: (
        <p>
          What is the largest value of <M>{"x^3 - 3x"}</M> on <M>{"[0, 3]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "river",
      rung: "apply",
      prompt: (
        <p>
          A farmer has 100 m of fencing to enclose a rectangular field beside a straight river. No fence is needed along
          the river. What is the largest area, in square metres, that can be enclosed?
        </p>
      ),
      answer: { kind: "numeric", value: 1250 },
    },
    {
      key: "split",
      rung: "apply",
      prompt: (
        <p>
          Two non-negative numbers add up to 20. What is the largest possible value of the first times the square of the
          second? (Give the answer to two decimal places.)
        </p>
      ),
      answer: { kind: "numeric", value: 32000 / 27, tolerance: 0.0001 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
best = min(((x, 2 * x + 50 / x) for x in [k / 10 for k in range(10, 101)]), key=lambda t: t[1])
print(best, math.sqrt(25))`}</Code>
          <p>Minimising 2x + 50/x over x = 1.0, 1.1, …, 10.0. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(5.0, 20.0) 5.0", "(5.0, 20.0) 25", "(25.0, 52.0) 5.0", "(4.9, 20.004081632653) 5.0"], correct: [0] },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gradient_descent(grad, x0, lr, steps)</C> for a function of several variables (x as a list), and <C>minimise_with_backtracking(f, grad, x0, steps)</C>, gradient descent where each step starts with step size 1 and halves it until the Armijo condition f(x − t∇f) ≤ f(x) − (t/2)‖∇f‖² holds. Return the final point as a list. The tests minimise a badly scaled quadratic and the Rosenbrock function.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def gradient_descent(grad, x0, lr, steps):
    return list(x0)

def minimise_with_backtracking(f, grad, x0, steps):
    return list(x0)
`,
        solution: `def gradient_descent(grad, x0, lr, steps):
    x = list(x0)
    for _ in range(steps):
        g = grad(x)
        x = [a - lr * b for a, b in zip(x, g)]
    return x

def minimise_with_backtracking(f, grad, x0, steps):
    x = list(x0)
    for _ in range(steps):
        g = grad(x)
        gg = sum(v * v for v in g)
        if gg == 0:
            break
        t, fx = 1.0, f(x)
        while True:
            y = [a - t * b for a, b in zip(x, g)]
            if f(y) <= fx - t / 2 * gg or t < 1e-20:
                break
            t /= 2
        x = y
    return x
`,
        tests: [
          { name: "plain", code: `x = gradient_descent(lambda v: [2 * (v[0] - 3), 4 * (v[1] + 1)], [0, 0], 0.1, 200)
assert abs(x[0] - 3) < 1e-9 and abs(x[1] + 1) < 1e-9, 'Minimum at (3, −1).'` },
          { name: "diverges", code: `x = gradient_descent(lambda v: [2 * v[0]], [1.0], 1.1, 50)
assert abs(x[0]) > 1e3, 'Too large a step diverges: each step multiplies by −1.2.'` },
          { name: "scaled", code: `f = lambda v: v[0] ** 2 + 100 * v[1] ** 2
g = lambda v: [2 * v[0], 200 * v[1]]
x = minimise_with_backtracking(f, g, [5.0, 1.0], 2000)
assert f(x) < 1e-10, 'Backtracking adapts the step size.'` },
          { name: "rosenbrock", code: `f = lambda v: (1 - v[0]) ** 2 + 100 * (v[1] - v[0] ** 2) ** 2
g = lambda v: [-2 * (1 - v[0]) - 400 * v[0] * (v[1] - v[0] ** 2), 200 * (v[1] - v[0] ** 2)]
x = minimise_with_backtracking(f, g, [-1.2, 1.0], 20000)
assert abs(x[0] - 1) < 1e-3 and abs(x[1] - 1) < 2e-3, f'Reach (1, 1), got {x}.'` },
        ],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.linspace(0.01, 10, 100000)
area = x * (20 - 2 * x) / 2
print(round(x[np.argmax(area)], 2))`}</Code>
          <p>A fence problem: what x maximises x(20 − 2x)/2?</p>
        </>
      ),
      answer: { kind: "numeric", value: 5.0, tolerance: 0.002 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A box with a square base of side x and volume 32 has surface area x² + 128/x (open top). Write <C>best_side()</C>, which returns the x that minimises it, found from f′(x) = 2x − 128/x² = 0 by bisection on [1, 10].
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def best_side():
    return 1.0
`,
        solution: `def best_side():
    g = lambda x: 2 * x - 128 / x ** 2
    lo, hi = 1.0, 10.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if g(mid) < 0:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2
`,
        tests: [
          { name: "answer", code: `assert abs(best_side() - 4) < 1e-9, 'Solve 2x = 128/x², that is x³ = 64.'` },
          { name: "is a minimum", code: `x = best_side()
A = lambda x: x * x + 128 / x
assert A(x) <= min(A(x - 0.01), A(x + 0.01)) and abs(A(x) - 48) < 1e-9, 'The least surface area is 16 + 32 = 48.'` },
          { name: "not hard-coded", code: `import inspect
src = inspect.getsource(best_side)
assert 'return 4' not in src.replace(' ', '').replace('return4', 'return 4'), 'Find the root by bisection.'` },
        ],
      },
    },
    {
      key: "square",
      rung: "prove",
      prompt: <p>Prove that among all rectangles with a given perimeter P, the square has the largest area.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the area as A(x) = x(P/2 − x) on [0, P/2], where x is one side.",
          "Finds the only critical point, x = P/4, from A′(x) = P/2 − 2x.",
          "Compares with the endpoints, where A = 0 (or uses the second derivative test), and concludes both sides are P/4.",
        ],
      },
    },
    {
      key: "lifeguard",
      rung: "stretch",
      prompt: (
        <p>
          A lifeguard runs along the beach at speed u and swims at speed w. The shoreline is a straight line; the lifeguard
          starts at distance a from it on the sand, and the swimmer is at distance b from it in the water, a horizontal
          distance d away. Show that the quickest route crosses the shoreline at the point where{" "}
          <M>{"\\sin\\alpha / u = \\sin\\beta / w"}</M>, where <M>{"\\alpha"}</M> and <M>{"\\beta"}</M> are the angles the
          two parts of the route make with the line perpendicular to the shore.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the time as T(x) = √(a² + x²)/u + √(b² + (d − x)²)/w, where x is the crossing point.",
          "Differentiates and sets T′(x) = 0, getting x/(u√(a² + x²)) = (d − x)/(w√(b² + (d − x)²)).",
          "Recognises the two fractions as sin α / u and sin β / w, and ideally notes this is Snell's law of refraction.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how to find the best cut for the box, why the answer must be at a critical point or an endpoint, and why you should check the endpoints.",

  glimpse: (
    <p>
      Next, Newton&rsquo;s method, which finds where a derivative, or any function, is zero when algebra cannot. When the quantity depends on several variables tied together by a constraint, Multivariable and Matrix Calculus replaces the single derivative by Lagrange multipliers, and when no formula for the minimum exists, the gradient descent of Optimisation for Deep Learning walks downhill towards it.
    </p>
  ),
};
