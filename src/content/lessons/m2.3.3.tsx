import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { EVTViz } from "@/components/viz/EVTViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.3.3",
  minutes: 80,
  links: {
    revisits: ["m2.1.2", "m1.3.3"],
    foreshadows: ["m8.5.2", "m8.4.2", "m2.5.3"],
  },

  puzzle: (
    <>
      <p>
        Among all numbers strictly between 0 and 1, which is the largest? There is none: whatever you choose, there is a
        larger one still below 1. So the simple function <M>{"f(x) = x"}</M>, on the open interval <M>{"(0, 1)"}</M>, has
        no maximum value.
      </p>
      <p>
        Optimisation problems ask for the largest or smallest value of something: the most profit, the least material. When
        can we be sure the best value is actually reached, and not merely approached?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The answer is a theorem with three hypotheses: the function is continuous, and the interval is both closed (it
        contains its endpoints) and bounded. Under those conditions, the function reaches a highest and a lowest value.
        Drop any one hypothesis and the conclusion can fail. Each case below drops one.
      </p>
      <EVTViz />
    </>
  ),

  theory: (
    <>
      <Definition title="maximum and minimum">
        <p>
          f <strong>attains a maximum</strong> on a set D at a point c in D if <M>{"f(x) \\le f(c)"}</M> for every x in D.
          Minimum is defined likewise. f is <strong>bounded</strong> on D if there is an M with <M>{"|f(x)| \\le M"}</M> for
          every x in D.
        </p>
      </Definition>

      <Theorem title="boundedness">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, then f is bounded on <M>{"[a, b]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let S be the set of x in <M>{"[a, b]"}</M> such that f is bounded on <M>{"[a, x]"}</M>. S contains a, and is bounded
          above by b; let <M>{"s = \\sup S"}</M>. By continuity at s (one-sided if <M>{"s = b"}</M>), with{" "}
          <M>{"\\varepsilon = 1"}</M>, there is a <M>{"\\delta > 0"}</M> such that <M>{"|f(x)| < |f(s)| + 1"}</M> for x in{" "}
          <M>{"[a, b]"}</M> within <M>{"\\delta"}</M> of s.
        </p>
        <p>
          By the approximation property, some <M>{"x_0 \\in S"}</M> has <M>{"x_0 > s - \\delta"}</M>. Then f is bounded on{" "}
          <M>{"[a, x_0]"}</M>, and on <M>{"[x_0, \\min(s + \\delta/2, b)]"}</M> by <M>{"|f(s)| + 1"}</M>, so f is bounded on{" "}
          <M>{"[a, \\min(s + \\delta/2, b)]"}</M>. If <M>{"s < b"}</M>, this puts a point larger than s in S, which is
          impossible. So <M>{"s = b"}</M>, and the same argument shows b itself is in S.
        </p>
      </Proof>

      <Theorem title="the extreme value theorem">
        <p>
          If f is continuous on <M>{"[a, b]"}</M>, then f attains a maximum and a minimum on <M>{"[a, b]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the last theorem, the set of values <M>{"\\{f(x) : a \\le x \\le b\\}"}</M> is bounded above, so it has a
          supremum M. Suppose, for contradiction, that <M>{"f(x) < M"}</M> for every x in <M>{"[a, b]"}</M>. Then{" "}
          <M>{"g(x) = 1/(M - f(x))"}</M> is continuous on <M>{"[a, b]"}</M>, since the denominator is never 0, so g is bounded,
          say by K. But by the approximation property, f(x) comes within any distance of M, so <M>{"M - f(x)"}</M> can be made
          smaller than <M>{"1/K"}</M>, making <M>{"g(x) > K"}</M>. This contradiction shows <M>{"f(c) = M"}</M> for some c.
          For the minimum, apply this to <M>{"-f"}</M>.
        </p>
      </Proof>

      <Remark title="each hypothesis matters">
        <ul>
          <li>
            Not closed: <M>{"x"}</M> on <M>{"(0, 1)"}</M> has supremum 1 but no maximum, and <M>{"1/x"}</M> on{" "}
            <M>{"(0, 1]"}</M> is not even bounded.
          </li>
          <li>
            Not bounded: <M>{"x"}</M> on <M>{"[0, \\infty)"}</M> has no maximum.
          </li>
          <li>
            Not continuous: the jump in the visualisation has supremum 1 on <M>{"[0, 2]"}</M>, never attained.
          </li>
        </ul>
        <p>
          The completeness of the reals is hidden in both proofs, through suprema. If only rational numbers existed,{" "}
          <M>{"-(x^2 - 2)^2"}</M> on <M>{"[0, 2]"}</M> would have supremum 0 and never reach it, since it is 0 only at the
          irrational <M>{"\\sqrt{2}"}</M>.
        </p>
      </Remark>

      <Example title="a guarantee for optimisation">
        <p>
          A rectangle has its base on the x-axis and its top corners on the parabola <M>{"y = 4 - x^2"}</M>. Its area is{" "}
          <M>{"A(x) = 2x(4 - x^2)"}</M>, where <M>{"0 \\le x \\le 2"}</M>. A is continuous on the closed, bounded interval{" "}
          <M>{"[0, 2]"}</M>, so the theorem guarantees a largest rectangle before we look for it. (Allowing the degenerate
          rectangles at <M>{"x = 0"}</M> and <M>{"x = 2"}</M>, with area 0, is what makes the interval closed.) Derivatives
          will find it later in the course.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>On which of these intervals must every continuous function attain a maximum?</p>,
      answer: { kind: "choice", options: ["(0, 1)", "[0, 1]", "[0, ∞)", "(0, 1]"], correct: [1] },
    },
    {
      key: "max",
      rung: "check",
      prompt: (
        <p>
          What is the maximum value of <M>{"x(2 - x)"}</M> on <M>{"[0, 2]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "min-quad",
      rung: "apply",
      prompt: (
        <p>
          What is the minimum value of <M>{"x^2 - 4x + 7"}</M> on <M>{"[0, 5]"}</M>? (Complete the square.)
        </p>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "max-quad",
      rung: "apply",
      prompt: (
        <p>
          What is the maximum value of <M>{"x^2 - 4x + 7"}</M> on <M>{"[0, 5]"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 12 },
    },
    {
      key: "fails",
      rung: "apply",
      prompt: <p>Which of these functions fails to attain a maximum on its interval? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["x² on [−1, 2]", "x² on (−1, 2)", "1/(1 + x²) on (−∞, ∞)", "x on [0, ∞)"],
        correct: [1, 3],
      },
    },
    {
      key: "bounded-proof",
      rung: "prove",
      prompt: (
        <p>
          Give an example of a function on <M>{"[0, 1]"}</M> that is defined at every point but is not bounded. Explain which
          step of the boundedness theorem&rsquo;s proof breaks down for your example.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a valid example, such as f(x) = 1/x for x > 0 and f(0) = 0.",
          "Checks that it is unbounded on [0, 1].",
          "Identifies the failure of continuity at a point, which is exactly where the proof used continuity to bound f near s.",
        ],
      },
    },
    {
      key: "image",
      rung: "stretch",
      prompt: (
        <p>
          Combine the intermediate and extreme value theorems to prove: if f is continuous on <M>{"[a, b]"}</M>, then the set
          of its values <M>{"\\{f(x) : a \\le x \\le b\\}"}</M> is a closed, bounded interval <M>{"[m, M]"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the extreme value theorem to get m = f(c) and M = f(d) attained.",
          "Shows every value lies in [m, M].",
          "Applies the intermediate value theorem on the interval between c and d to show every value in [m, M] is attained.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the extreme value theorem, and give an example showing why each of its hypotheses is needed.",

  glimpse: (
    <p>
      Real Analysis reveals what makes closed, bounded intervals special: they are compact, and continuous functions on compact sets always attain their extremes. Later in this course, optimisation problems will find the extremes that this theorem promises exist, and Convex Optimisation asks the same question in many dimensions. Next, a stronger kind of continuity that holds on such intervals.
    </p>
  ),
};
