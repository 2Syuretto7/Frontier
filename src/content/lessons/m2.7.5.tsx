import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { QuadratureViz } from "@/components/viz/QuadratureViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.7.5",
  minutes: 55,
  links: {
    requires: ["m2.6.2"],
    revisits: ["m2.6.1"],
    foreshadows: ["m7.7.3", "m11.8.1"],
  },

  puzzle: (
    <>
      <p>
        You need <M>{"\\int_0^1 e^{-x^2}\\,dx"}</M> to six decimal places, and there is no antiderivative to use. Riemann sums
        converge, but slowly: with left endpoints, a thousand rectangles still leave an error in the fourth decimal place.
      </p>
      <p>
        A small change, using the midpoint of each strip instead of its left edge, or joining the curve by straight lines,
        makes the same work far more accurate. Why should such small changes matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each rule replaces the curve on each small strip by something simple whose area is easy: a flat top, a slanted top, or
        a parabola. The better the stand-in matches the curve&rsquo;s shape, the faster the error shrinks as the strips get
        thinner. Compare the rules below and look at the ratio column: it shows how much the error drops each time the number
        of strips doubles.
      </p>
      <QuadratureViz />
    </>
  ),

  theory: (
    <>
      <Definition title="three rules">
        <p>Split <M>{"[a, b]"}</M> into n strips of width <M>{"h = (b - a)/n"}</M>, with points <M>{"x_i = a + ih"}</M>.</p>
        <ul>
          <li><strong>Midpoint</strong>: <M>{"M_n = h \\sum_{i=0}^{n-1} f(x_i + h/2)"}</M>.</li>
          <li>
            <strong>Trapezoid</strong>:
            <MD>{"T_n = h\\left(\\tfrac12 f(x_0) + f(x_1) + \\dots + f(x_{n-1}) + \\tfrac12 f(x_n)\\right)."}</MD>
          </li>
          <li>
            <strong>Simpson</strong> (n even):
            <MD>{"S_n = \\tfrac{h}{3}\\bigl(f(x_0) + 4f(x_1) + 2f(x_2) + \\dots + 4f(x_{n-1}) + f(x_n)\\bigr),"}</MD>
            which integrates a parabola through each consecutive triple of points.
          </li>
        </ul>
      </Definition>

      <Theorem title="error bounds">
        <p>If f has the derivatives named, continuous on <M>{"[a, b]"}</M>, then</p>
        <MD>{"|E_{T}| \\le \\frac{(b - a)h^2}{12}\\max|f''|,"}</MD>
        <MD>{"|E_{M}| \\le \\frac{(b - a)h^2}{24}\\max|f''|,"}</MD>
        <MD>{"|E_{S}| \\le \\frac{(b - a)h^4}{180}\\max|f^{(4)}|."}</MD>
        <p>
          Left and right endpoint sums have error proportional to h. So halving h halves the endpoint error, quarters the
          trapezoid and midpoint errors, and divides Simpson&rsquo;s error by 16.
        </p>
      </Theorem>
      <Remark title="where the powers come from">
        <p>
          A straight line matches f to first order, so on one strip of width h the error is about{" "}
          <M>{"f'' h^2"}</M> in height times h in width, and there are <M>{"(b - a)/h"}</M> strips: total error of order{" "}
          <M>{"h^2"}</M>. Simpson&rsquo;s parabolas happen to integrate cubics exactly too, by symmetry, so its error depends
          on the fourth derivative. Real Analysis and Numerical Linear Algebra and Scientific Computing prove these bounds
          with Taylor&rsquo;s theorem.
        </p>
      </Remark>

      <Example title="Richardson extrapolation">
        <p>
          Since <M>{"T_n \\approx I + Ch^2"}</M>, doubling n gives <M>{"T_{2n} \\approx I + Ch^2/4"}</M>, and the combination{" "}
          <M>{"(4T_{2n} - T_n)/3"}</M> cancels the <M>{"h^2"}</M> term. This combination is exactly Simpson&rsquo;s rule. Knowing
          the form of an error lets you remove it: a trick used far beyond integration.
        </p>
      </Example>

      <Remark title="many dimensions">
        <p>
          A grid with 10 points per axis needs <M>{"10^d"}</M> points in d dimensions: a million in six dimensions, and far
          more than atoms in the universe for the millions of dimensions of a neural network&rsquo;s weights. There, Monte
          Carlo methods take over: average f at random points. Their error shrinks only like <M>{"1/\\sqrt{N}"}</M>, but that
          rate does not depend on the dimension at all.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: <p>If you double the number of strips, by roughly what factor does the trapezoid rule&rsquo;s error fall, for a smooth f?</p>,
      answer: { kind: "choice", options: ["4", "2", "16", "it does not change"], correct: [0] },
    },
    {
      key: "exact",
      rung: "check",
      prompt: <p>For which of these does Simpson&rsquo;s rule give the exact integral? Select all that apply.</p>,
      answer: { kind: "choice", options: ["x²", "x³", "x⁴", "eˣ"], correct: [0, 1] },
    },
    {
      key: "trap",
      rung: "apply",
      prompt: <p>Apply the trapezoid rule with n = 2 to <M>{"\\int_0^2 x^2\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "mid",
      rung: "apply",
      prompt: <p>Apply the midpoint rule with n = 2 to <M>{"\\int_0^2 x^2\\,dx"}</M>.</p>,
      answer: { kind: "numeric", value: 2.5 },
    },
    {
      key: "simp",
      rung: "apply",
      prompt: <p>Apply Simpson&rsquo;s rule with n = 2 to <M>{"\\int_0^2 x^2\\,dx"}</M>. Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.6667, tolerance: 0.0001 },
    },
    {
      key: "trap-error",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"f(x) = x^2"}</M> on <M>{"[0, 1]"}</M>, show that <M>{"T_n - \\tfrac13 = \\dfrac{1}{6n^2}"}</M>. You may use{" "}
          <M>{"\\sum_{i=1}^{n} i^2 = \\tfrac{n(n + 1)(2n + 1)}{6}"}</M>. Then explain why the trapezoid rule overestimates
          the integral of every convex function.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes T_n = (1/n)(Σ_{i=1}^{n−1} i²/n² + ½), or an equivalent form.",
          "Uses the sum-of-squares formula to simplify to 1/3 + 1/(6n²).",
          "Notes the error is proportional to 1/n², as the bound predicts.",
          "Explains that on a convex function each chord lies above the curve, so each trapezoid contains its strip of area.",
        ],
      },
    },
    {
      key: "howmany",
      rung: "stretch",
      prompt: (
        <p>
          The trapezoid rule with n = 10 has error <M>{"10^{-3}"}</M> on some smooth integral. Roughly how many strips are
          needed for an error of <M>{"10^{-7}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1000 },
    },
  ],

  teachBack:
    "Explain to a friend how the midpoint, trapezoid and Simpson rules approximate an integral, and why Simpson's error falls so much faster as the strips get thinner.",

  glimpse: (
    <p>
      This completes the techniques of integration. Next, sequences and series: what it means for infinitely many numbers to
      approach a limit, or to add up to one. Monte Carlo estimation in Probability takes over where grids fail, and
      Numerical Linear Algebra and Scientific Computing uses the same ideas to step differential equations forward in time.
    </p>
  ),
};
