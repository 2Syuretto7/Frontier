import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { MVTViz } from "@/components/viz/MVTViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.5.1",
  minutes: 85,
  links: {
    revisits: ["m2.3.3"],
    foreshadows: ["m2.6.3", "m8.6.2", "m8.6.3"],
  },

  puzzle: (
    <>
      <p>
        On some expressways, speed is checked not at one point but over a stretch. Two cameras stand 10 km apart. A car
        passes the first at 10:00 and the second at 10:05, so its average speed was 120 km per hour. The limit is 100.
      </p>
      <p>
        The driver protests: &ldquo;You never measured my speed at any moment. Perhaps I was always under 100.&rdquo; Is
        there any way that could be true?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the car never went faster than 100 km per hour, then in 5 minutes it could not have covered more than about 8.3
        km. So at some moment its speed must have been at least 120; in fact, if speed changes smoothly, at some moment it
        was exactly 120. In the language of graphs: the chord from <M>{"(a, f(a))"}</M> to <M>{"(b, f(b))"}</M> has slope
        equal to the average rate of change, and somewhere in between a tangent is parallel to the chord.
      </p>
      <MVTViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="interior extremes (Fermat)">
        <p>
          If f has a maximum or a minimum at a point c inside an open interval, and f is differentiable at c, then{" "}
          <M>{"f'(c) = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Say f has a maximum at c. For small <M>{"h > 0"}</M>, <M>{"f(c + h) - f(c) \\le 0"}</M>, so the difference
          quotient is <M>{"\\le 0"}</M>, and its limit <M>{"f'(c)"}</M> is <M>{"\\le 0"}</M>. For small{" "}
          <M>{"h < 0"}</M>, the numerator is still <M>{"\\le 0"}</M> but h is negative, so the quotient is{" "}
          <M>{"\\ge 0"}</M>, and <M>{"f'(c) \\ge 0"}</M>. Hence <M>{"f'(c) = 0"}</M>. A minimum is similar.
        </p>
      </Proof>

      <Theorem title="Rolle's theorem">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, differentiable on <M>{"(a, b)"}</M>, and <M>{"f(a) = f(b)"}</M>, then
          there is a c in <M>{"(a, b)"}</M> with <M>{"f'(c) = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the extreme value theorem, f attains a maximum and a minimum on <M>{"[a, b]"}</M>. If both occur at the
          endpoints, then since <M>{"f(a) = f(b)"}</M> the maximum equals the minimum, f is constant, and every c works.
          Otherwise one of them occurs at some c inside, and Fermat&rsquo;s theorem gives <M>{"f'(c) = 0"}</M>.
        </p>
      </Proof>

      <Theorem title="the mean value theorem">
        <p>
          If f is continuous on <M>{"[a, b]"}</M> and differentiable on <M>{"(a, b)"}</M>, then there is a c in{" "}
          <M>{"(a, b)"}</M> with
        </p>
        <MD>{"f'(c) = \\frac{f(b) - f(a)}{b - a}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let m be the slope of the chord, and subtract the chord from f: <M>{"g(x) = f(x) - f(a) - m(x - a)"}</M>. Then g
          is continuous on <M>{"[a, b]"}</M>, differentiable inside, and <M>{"g(a) = g(b) = 0"}</M>. Rolle&rsquo;s theorem
          gives c with <M>{"0 = g'(c) = f'(c) - m"}</M>.
        </p>
      </Proof>

      <Remark title="what the theorem does not say">
        <p>
          The theorem promises that c exists; it does not say where. For the driver that is enough: at some instant
          between the cameras the speed was exactly 120 km per hour, whatever the speedometer showed at the cameras
          themselves. The hypotheses matter. The graph of |x| from <M>{"-1"}</M> to 2 has a corner, and no tangent is
          parallel to its chord. A function that is not continuous at an endpoint can fail too: <M>{"f(x) = x"}</M> on{" "}
          <M>{"[0, 1)"}</M> with <M>{"f(1) = 0"}</M> has a horizontal chord but slope 1 everywhere inside.
        </p>
      </Remark>

      <Theorem title="consequences">
        <ul>
          <li>If <M>{"f' = 0"}</M> on an interval, f is constant there.</li>
          <li>If <M>{"f' = g'"}</M> on an interval, then <M>{"f - g"}</M> is constant there.</li>
          <li>
            If <M>{"|f'(x)| \\le K"}</M> on an interval, then <M>{"|f(x) - f(y)| \\le K|x - y|"}</M> for all x and y in it.
          </li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          For the first, take any x &lt; y in the interval. The mean value theorem gives{" "}
          <M>{"f(y) - f(x) = f'(c)(y - x) = 0"}</M>. Apply this to <M>{"f - g"}</M> for the second. For the third,{" "}
          <M>{"|f(x) - f(y)| = |f'(c)|\\,|x - y| \\le K|x - y|"}</M>.
        </p>
      </Proof>

      <Example title="a bound for sine">
        <p>
          Since <M>{"|\\cos| \\le 1"}</M>, the third consequence gives <M>{"|\\sin x - \\sin y| \\le |x - y|"}</M> for all x
          and y. With <M>{"y = 0"}</M>: <M>{"|\\sin x| \\le |x|"}</M>.
        </p>
      </Example>

      <Remark title="why this theorem matters">
        <p>
          The first consequence looks obvious: a function whose rate of change is always zero does not change. But it needs
          a proof, and the proof needs the completeness of the real numbers, through the extreme value theorem. On the
          rational numbers it would be false. The mean value theorem is the bridge between information at single points,
          the derivative, and information over whole intervals. Much of the rest of calculus crosses it, including the
          fundamental theorem of calculus.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "square",
      rung: "check",
      prompt: (
        <p>
          For <M>{"f(x) = x^2"}</M> on <M>{"[0, 2]"}</M>, which c satisfies the conclusion of the mean value theorem?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "rolle",
      rung: "check",
      prompt: (
        <p>
          For which of these functions do the hypotheses of Rolle&rsquo;s theorem hold on <M>{"[-1, 1]"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["x²", "|x|", "1/x (with f(0) = 0)", "x³"], correct: [0] },
    },
    {
      key: "cube",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x) = x^3"}</M> on <M>{"[0, 3]"}</M>, find the c in <M>{"(0, 3)"}</M> given by the mean value theorem.
        </p>
      ),
      answer: { kind: "numeric", value: Math.sqrt(3), tolerance: 0.001 },
    },
    {
      key: "camera",
      rung: "apply",
      prompt: (
        <p>
          Two cameras are 12 km apart. A car passes them 8 minutes apart. What speed, in km per hour, must it have had at
          some instant in between?
        </p>
      ),
      answer: { kind: "numeric", value: 90 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: (
        <p>
          f is differentiable everywhere, <M>{"|f'(x)| \\le 2"}</M> for all x, and <M>{"f(1) = 5"}</M>. What is the largest
          possible value of <M>{"f(4)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "one-root",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"x^3 + x - 1 = 0"}</M> has exactly one real solution.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the intermediate value theorem, for example on [0, 1], to show there is at least one solution.",
          "Supposes there are two solutions and applies Rolle's theorem to get a point where 3c² + 1 = 0.",
          "Notes that 3c² + 1 > 0 always, a contradiction, so there is exactly one.",
        ],
      },
    },
    {
      key: "cauchy",
      rung: "stretch",
      prompt: (
        <p>
          Let f and g be continuous on <M>{"[a, b]"}</M> and differentiable inside. Apply Rolle&rsquo;s theorem to{" "}
          <M>{"h(x) = (f(b) - f(a))\\,g(x) - (g(b) - g(a))\\,f(x)"}</M> to prove that there is a c in <M>{"(a, b)"}</M> with{" "}
          <M>{"(f(b) - f(a))\\,g'(c) = (g(b) - g(a))\\,f'(c)"}</M>. Which choice of g gives back the mean value theorem?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Checks that h(a) = h(b), for instance by expanding both to f(b)g(a) − f(a)g(b).",
          "Applies Rolle's theorem to get h′(c) = 0, which is the stated equation.",
          "Notes that g(x) = x gives the mean value theorem.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why a car whose average speed over a stretch was 120 km per hour must have been doing exactly 120 at some instant, and what could go wrong if the speed jumped.",

  glimpse: (
    <p>
      Next, the first payoff: the sign of the derivative decides where a function rises and falls, and the second derivative decides how it bends. The mean value theorem is also used to prove the fundamental theorem of calculus later in this course, and it extends to Taylor&rsquo;s theorem, which says how well a polynomial can approximate a function.
    </p>
  ),
};
