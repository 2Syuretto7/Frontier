import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { FTCViz } from "@/components/viz/FTCViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.6.3",
  minutes: 90,
  links: {
    revisits: ["m2.5.1"],
  },

  puzzle: (
    <>
      <p>
        Finding <M>{"\\int_0^1 x^2\\,dx"}</M> took a formula for sums of squares and a limit. Finding{" "}
        <M>{"\\int_0^\\pi \\sin x\\,dx"}</M> the same way would need a formula for sums of sines. Every new function seems
        to need a new trick.
      </p>
      <p>
        Derivatives, by contrast, are routine: a handful of rules handle everything. Two questions that look unrelated,
        the slope of a curve and the area under it, turn out to be one question asked forwards and backwards. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fix a starting point and let A(x) be the area under f from there to x. Push x a little to the right, by h. The area
        grows by a thin strip of width h and height about <M>{"f(x)"}</M>, so <M>{"A(x + h) - A(x) \\approx f(x)\\,h"}</M>.
        Divide by h and let h shrink: the rate at which area grows is the height of the curve. So A is a function whose
        derivative is f.
      </p>
      <FTCViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the fundamental theorem of calculus, part 1">
        <p>
          Let f be continuous on <M>{"[a, b]"}</M>, and define <M>{"A(x) = \\int_a^x f(t)\\,dt"}</M>. Then A is
          differentiable on <M>{"(a, b)"}</M> and <M>{"A'(x) = f(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>For <M>{"h > 0"}</M>, by additivity,</p>
        <MD>{"\\frac{A(x + h) - A(x)}{h} = \\frac{1}{h} \\int_x^{x+h} f(t)\\,dt."}</MD>
        <p>
          If m and M are the minimum and maximum of f on <M>{"[x, x + h]"}</M>, the integral lies between <M>{"mh"}</M> and{" "}
          <M>{"Mh"}</M>, so the quotient lies between m and M. As <M>{"h \\to 0"}</M>, both m and M tend to{" "}
          <M>{"f(x)"}</M>, because f is continuous at x. By the squeeze theorem the quotient tends to <M>{"f(x)"}</M>. The
          case <M>{"h < 0"}</M> is the same.
        </p>
      </Proof>

      <Definition title="antiderivative">
        <p>
          F is an <strong>antiderivative</strong> of f on an interval if <M>{"F' = f"}</M> there. Part 1 says that every
          continuous function has one, namely its area function.
        </p>
      </Definition>

      <Theorem title="the fundamental theorem of calculus, part 2">
        <p>If f is continuous on <M>{"[a, b]"}</M> and F is any antiderivative of f there, then</p>
        <MD>{"\\int_a^b f(x)\\,dx = F(b) - F(a), \\qquad \\text{written } \\big[F(x)\\big]_a^b."}</MD>
      </Theorem>
      <Proof>
        <p>
          A and F have the same derivative, f, so by a consequence of the mean value theorem they differ by a constant:{" "}
          <M>{"A(x) = F(x) + C"}</M>. Putting <M>{"x = a"}</M> gives <M>{"0 = F(a) + C"}</M>. So{" "}
          <M>{"\\int_a^b f = A(b) = F(b) - F(a)"}</M>.
        </p>
      </Proof>

      <Example title="areas without limits">
        <ul>
          <li>
            <M>{"\\int_0^1 x^2\\,dx = \\left[\\tfrac{x^3}{3}\\right]_0^1 = \\tfrac{1}{3}"}</M>, in one line.
          </li>
          <li>
            <M>{"\\int_0^\\pi \\sin x\\,dx = \\big[-\\cos x\\big]_0^\\pi = 1 - (-1) = 2"}</M>.
          </li>
          <li>
            <M>{"\\int_1^4 \\sqrt{x}\\,dx = \\left[\\tfrac{2}{3}x^{3/2}\\right]_1^4 = \\tfrac{2}{3}(8 - 1) = \\tfrac{14}{3}"}</M>.
          </li>
        </ul>
      </Example>

      <Example title="differentiating an integral">
        <p>
          Part 1, with the chain rule, differentiates integrals whose upper limit moves: if{" "}
          <M>{"G(x) = \\int_0^{x^2} \\cos t\\,dt"}</M>, then G is A composed with <M>{"x^2"}</M>, so{" "}
          <M>{"G'(x) = \\cos(x^2) \\cdot 2x"}</M>. Here no formula for G is needed.
        </p>
      </Example>

      <Remark title="indefinite integrals">
        <p>
          An antiderivative is written <M>{"\\int f(x)\\,dx"}</M>, with no limits, as in{" "}
          <M>{"\\int x^2\\,dx = \\tfrac{x^3}{3} + C"}</M>. The constant C is there because antiderivatives on an interval
          are determined only up to a constant. It cancels in <M>{"F(b) - F(a)"}</M>, which is why any antiderivative will
          do. Leibniz&rsquo;s notation shows the whole story: the long s, ∫, is a summa, a sum, and dx is the width of a
          very thin strip.
        </p>
      </Remark>

      <Remark title="the hypotheses matter">
        <p>
          Blind use of part 2 gives <M>{"\\int_{-1}^{1} \\frac{1}{x^2}\\,dx = \\left[-\\tfrac{1}{x}\\right]_{-1}^{1} = -2"}</M>,
          a negative area under a positive function. The error: <M>{"1/x^2"}</M> is not continuous on{" "}
          <M>{"[-1, 1]"}</M>, nor even bounded, so the theorem does not apply.
        </p>
      </Remark>

      <Remark title="who discovered it">
        <p>
          Newton and Leibniz each found the theorem independently, in the 1660s and 1670s, and each saw that it turned the
          solution of area problems into the reversal of differentiation. Isaac Barrow, Newton&rsquo;s teacher, had stated
          a geometric form of it a little earlier. Calculus, as a single subject, begins here.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cube",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\int_0^2 x^3\\,dx"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "part1",
      rung: "check",
      prompt: (
        <p>
          Find <M>{"\\dfrac{d}{dx}\\displaystyle\\int_0^x \\sin(t^2)\\,dt"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "sin(x^2)", variables: ["x"] },
    },
    {
      key: "root",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\int_1^9 \\sqrt{x}\\,dx"}</M>. (Give a decimal or a fraction.)
        </p>
      ),
      answer: { kind: "numeric", value: 52 / 3, tolerance: 0.001 },
    },
    {
      key: "cos",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\int_0^{\\pi/2} \\cos x\\,dx"}</M>.
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: (
        <p>
          Find <M>{"\\dfrac{d}{dx}\\displaystyle\\int_0^{x^3} \\cos t\\,dt"}</M>.
        </p>
      ),
      answer: { kind: "expression", value: "3x^2 cos(x^3)", variables: ["x"] },
    },
    {
      key: "proof1",
      rung: "prove",
      prompt: (
        <p>
          Prove part 1 of the fundamental theorem: if f is continuous and <M>{"A(x) = \\int_a^x f"}</M>, then{" "}
          <M>{"A'(x) = f(x)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the difference quotient of A as (1/h) times the integral of f from x to x + h.",
          "Bounds this between the minimum and maximum of f on the small interval.",
          "Uses continuity of f to show both bounds tend to f(x), and concludes by squeezing.",
        ],
      },
    },
    {
      key: "average",
      rung: "stretch",
      prompt: (
        <p>
          The average value of f on <M>{"[a, b]"}</M> is <M>{"\\frac{1}{b - a}\\int_a^b f"}</M>. Prove that a continuous f
          actually takes its average value somewhere in <M>{"[a, b]"}</M>. Then find the average of <M>{"\\sin x"}</M> on{" "}
          <M>{"[0, \\pi]"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the mean value theorem to the area function A, or uses the bounds m(b − a) ≤ ∫f ≤ M(b − a) with the intermediate value theorem.",
          "Concludes there is c with f(c) equal to the average.",
          "Computes the average of sin on [0, π] as 2/π.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why the rate at which the area under a curve grows is the height of the curve, and how that turns finding areas into undoing derivatives.",

  glimpse: (
    <p>
      Next, substitution, the chain rule run backwards, the first technique for finding antiderivatives. The fundamental theorem has grand generalisations: in Multivariable and Matrix Calculus integrals over regions are computed one variable at a time, and in Probability a density is the derivative of a distribution function, so probabilities of intervals are differences of one function at two points.
    </p>
  ),
};
