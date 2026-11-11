import { M, MD } from "@/components/Math";
import { Definition, Example, Quote, Remark, Theorem } from "@/components/lesson/Blocks";
import { BoxViz } from "@/components/viz/BoxViz";
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
