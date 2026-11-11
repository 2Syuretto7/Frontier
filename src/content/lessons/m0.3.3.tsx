import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { LineParabolaViz } from "@/components/viz/LineParabolaViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.3.3",
  minutes: 75,
  links: {
    revisits: ["m0.2.6"],
    foreshadows: ["m0.7.1", "m3.8.1"],
  },

  puzzle: (
    <>
      <p>
        A farmer has 40 metres of fencing and wants a rectangular pen against a long straight wall, so only three sides
        need fencing. What shape gives the largest area?
      </p>
      <p>
        Try a few: sides of 5 and 30 give 150 square metres; 15 and 10 give 150 again. Somewhere in between is better. Where
        exactly, and how can you be sure nothing beats it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let each side touching the wall be <M>x</M> metres. The side parallel to the wall uses what is left,{" "}
        <M>{"40 - 2x"}</M>, so the area is <M>{"A(x) = x(40 - 2x)"}</M>. That is a quadratic, and its graph is a parabola
        opening downwards. The largest area is at the top of the parabola, its <strong>vertex</strong>.
      </p>
      <p>
        Parabolas are symmetric, and the two trials that gave 150, at <M>{"x = 5"}</M> and <M>{"x = 15"}</M>, sit at the
        same height, so the vertex is halfway between them, at <M>{"x = 10"}</M>: a pen 10 by 20, area 200. To make such
        arguments routine, we need to understand the two simplest families of functions. Lines change at a constant rate;
        parabolas are lines&rsquo; first departure from constancy. Explore both.
      </p>
      <LineParabolaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear function and slope">
        <p>
          A <strong>linear function</strong> has the form <M>{"f(x) = mx + c"}</M>. Its graph is a straight line with{" "}
          <strong>slope</strong> (or gradient) <M>m</M> and <M>y</M>-intercept <M>{"(0, c)"}</M>.
        </p>
      </Definition>

      <Proposition title="constant rate of change">
        <p>
          For a linear function <M>{"f(x) = mx + c"}</M> and any two inputs <M>{"x_1 \\neq x_2"}</M>,
        </p>
        <MD>{"\\frac{f(x_2) - f(x_1)}{x_2 - x_1} = m."}</MD>
      </Proposition>
      <Proof>
        <p>
          <M>{"f(x_2) - f(x_1) = (mx_2 + c) - (mx_1 + c) = m(x_2 - x_1)"}</M>. Divide by <M>{"x_2 - x_1"}</M>.
        </p>
      </Proof>
      <p>
        So the slope is &ldquo;rise over run&rdquo; between <em>any</em> two points, and that is what makes the graph
        straight. It also gives the line through a point <M>{"(x_1, y_1)"}</M> with slope <M>m</M>:{" "}
        <M>{"y - y_1 = m(x - x_1)"}</M>. Lines with the same slope are parallel. Two lines with slopes{" "}
        <M>{"m_1, m_2"}</M>, neither vertical, are perpendicular exactly when <M>{"m_1 m_2 = -1"}</M>: turning a slope
        triangle with run 1 and rise <M>m</M> through a right angle gives run <M>{"-m"}</M> and rise 1, so slope{" "}
        <M>{"-\\tfrac{1}{m}"}</M>.
      </p>

      <Definition title="quadratic function">
        <p>
          A <strong>quadratic function</strong> has the form <M>{"f(x) = ax^2 + bx + c"}</M> with <M>{"a \\neq 0"}</M>. Its
          graph is a <strong>parabola</strong>, opening upwards when <M>{"a > 0"}</M> and downwards when{" "}
          <M>{"a < 0"}</M>.
        </p>
      </Definition>

      <Theorem title="vertex form">
        <p>Every quadratic can be written as</p>
        <MD>{"ax^2 + bx + c = a(x - h)^2 + k, \\quad \\text{where } h = -\\frac{b}{2a}, \\ k = c - \\frac{b^2}{4a}."}</MD>
        <p>
          If <M>{"a > 0"}</M> the least value of <M>f</M> is <M>k</M>, taken only at <M>{"x = h"}</M>; if{" "}
          <M>{"a < 0"}</M>, <M>k</M> is the greatest value. The graph is symmetric in the vertical line <M>{"x = h"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>Complete the square, as in the proof of the quadratic formula:</p>
        <MD>{"a\\left(x^2 + \\frac{b}{a}x\\right) + c = a\\left(x + \\frac{b}{2a}\\right)^2 - \\frac{b^2}{4a} + c."}</MD>
        <p>
          Suppose <M>{"a > 0"}</M>. The square <M>{"(x - h)^2"}</M> is never negative and is zero only at{" "}
          <M>{"x = h"}</M>, so <M>{"f(x) \\ge k"}</M> with equality only there. For <M>{"a < 0"}</M> the inequality
          reverses. Finally <M>{"f(h + t) = at^2 + k = f(h - t)"}</M> for every <M>t</M>, which is the symmetry.
        </p>
      </Proof>

      <Example title="the puzzle, proved">
        <p>
          <M>{"A(x) = 40x - 2x^2 = -2(x^2 - 20x) = -2(x - 10)^2 + 200"}</M>. Since <M>{"-2(x - 10)^2 \\le 0"}</M>, the area
          is at most 200, and it equals 200 only when <M>{"x = 10"}</M>. No guessing, and no pen can do better.
        </p>
      </Example>

      <Remark title="three forms, three uses">
        <p>
          The same quadratic can be written in standard form <M>{"ax^2 + bx + c"}</M>, which shows the{" "}
          <M>y</M>-intercept <M>c</M>; in vertex form <M>{"a(x - h)^2 + k"}</M>, which shows the turning point; and, when
          it has real roots, in factored form <M>{"a(x - r)(x - s)"}</M>, which shows where it crosses the axis. The axis of
          symmetry sits midway between the roots: <M>{"h = \\tfrac{r + s}{2}"}</M>, the trick used in the puzzle. Choosing
          the right form for the question is half the work.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "slope",
      rung: "check",
      prompt: <p>What is the slope of the line through <M>{"(1, 2)"}</M> and <M>{"(4, 11)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "line",
      rung: "check",
      prompt: <p>Write the equation of the line through <M>{"(2, 3)"}</M> with slope <M>{"-2"}</M>, as <M>{"y = \\ldots"}</M> in terms of <M>x</M>.</p>,
      answer: { kind: "expression", value: "-2x + 7", variables: ["x"] },
    },
    {
      key: "perpendicular",
      rung: "apply",
      prompt: <p>Which line is perpendicular to <M>{"y = 2x + 1"}</M>?</p>,
      answer: {
        kind: "choice",
        options: ["y = 2x − 1", "y = −2x + 1", "y = −x/2 + 3", "y = x/2 + 1"],
        correct: [2],
      },
    },
    {
      key: "minimum",
      rung: "apply",
      prompt: <p>What is the least value of <M>{"x^2 - 6x + 11"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "maximum",
      rung: "apply",
      prompt: <p>What is the greatest value of <M>{"-2x^2 + 8x + 1"}</M>?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a, b, c = 1, -6, 5
xv = -b / (2 * a)
print(xv, a * xv ** 2 + b * xv + c)`}</Code>
          <p>The vertex of y = x² − 6x + 5 is at x = −b/(2a). What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 -4.0", "-3.0 32.0", "3.0 4.0", "6.0 5.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>roots(a, b, c)</C>, which returns the sorted list of real roots of ax² + bx + c with a ≠ 0: two, one or none, by the sign of the discriminant.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import math

def roots(a, b, c):
    r = math.sqrt(b * b - 4 * a * c)
    return [(-b - r) / (2 * a), (-b + r) / (2 * a)]
`,
        solution: `import math

def roots(a, b, c):
    D = b * b - 4 * a * c
    if D < 0:
        return []
    if D == 0:
        return [-b / (2 * a)]
    r = math.sqrt(D)
    return sorted([(-b - r) / (2 * a), (-b + r) / (2 * a)])
`,
        tests: [
          { name: "two", code: `r = roots(1, -6, 5)
assert len(r) == 2 and abs(r[0] - 1) < 1e-9 and abs(r[1] - 5) < 1e-9, 'x² − 6x + 5 = (x − 1)(x − 5).'` },
          { name: "one", code: `r = roots(1, 2, 1)
assert len(r) == 1 and abs(r[0] + 1) < 1e-9, 'A zero discriminant gives one repeated root.'` },
          { name: "none", code: `assert roots(1, 0, 1) == [], 'x² + 1 has no real roots.'` },
          { name: "negative a", code: `r = roots(-1, 0, 4)
assert len(r) == 2 and r[0] < r[1], 'Return the roots in increasing order, even when a < 0.'` },
        ],
      },
    },
    {
      key: "square-pen",
      rung: "prove",
      prompt: (
        <p>
          A rectangle has perimeter 4 metres. Prove that its area is at most 1 square metre, with equality only for the
          square. Use vertex form.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Lets one side be x, so the other is 2 − x, and the area is x(2 − x).",
          "Rewrites the area as 1 − (x − 1)².",
          "Argues that (x − 1)² ≥ 0, so the area is at most 1.",
          "Notes equality exactly when x = 1, so both sides are 1 and the rectangle is a square.",
        ],
      },
    },
    {
      key: "ball",
      rung: "stretch",
      prompt: (
        <p>
          A ball thrown upwards is at height <M>{"h(t) = 20t - 5t^2"}</M> metres after <M>t</M> seconds. What is the
          greatest height it reaches, in metres?
        </p>
      ),
      answer: { kind: "numeric", value: 20 },
    },
  ],

  teachBack:
    "Explain to a friend how to find the biggest pen the farmer can build, without calculus. Say why the vertex form makes the answer certain rather than a good guess.",

  glimpse: (
    <p>
      Next, building new functions from old ones: doing one function after another, and undoing a function. Lines return
      in the chapter on the plane, and arithmetic sequences are linear functions on the whole numbers.
      In Calculus, the slope of a line becomes the derivative, the slope of a curve at a point, and the vertex is where that
      slope is zero. In Linear Algebra, &ldquo;linear&rdquo; acquires a stricter meaning: <M>{"mx + c"}</M> with{" "}
      <M>{"c \\neq 0"}</M> no longer qualifies.
    </p>
  ),
};
