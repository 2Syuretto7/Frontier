import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { IVTViz } from "@/components/viz/IVTViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.3.2",
  minutes: 80,
  links: {
    revisits: ["m1.3.5", "m2.1.2"],
    foreshadows: ["m2.5.1"],
  },

  puzzle: (
    <>
      <p>
        A monk sets off at sunrise to climb a mountain path, and reaches the temple at the top by sunset. Next morning, at
        sunrise, the monk walks back down the same path, at a different and varying pace, arriving at the bottom by sunset.
      </p>
      <p>
        Must there be some time of day at which the monk was at exactly the same spot on the path on both days? It seems
        unlikely to be forced. Yet it is.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Picture both journeys on the same day: one person climbing up, another walking down. They must meet somewhere. The
        meeting point is the spot in the puzzle. Behind this lies one of the most useful facts in analysis: a continuous
        function cannot get from one value to another without passing through every value in between.
      </p>
      <p>
        Move the level k below. For the continuous function, every level in the shaded band is crossed. The other two cases
        show why both continuity and the completeness of the real numbers are needed.
      </p>
      <IVTViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the intermediate value theorem">
        <p>
          Let f be continuous on <M>{"[a, b]"}</M>, and let k be any number strictly between <M>{"f(a)"}</M> and{" "}
          <M>{"f(b)"}</M>. Then there is a c in <M>{"(a, b)"}</M> with <M>{"f(c) = k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replacing f by <M>{"f - k"}</M>, or by <M>{"k - f"}</M>, we may assume <M>{"f(a) < 0 < f(b)"}</M> and{" "}
          <M>{"k = 0"}</M>. Let
        </p>
        <MD>{"S = \\{x \\in [a, b] : f(x) < 0\\}."}</MD>
        <p>
          S contains a and is bounded above by b, so by completeness it has a supremum c, with <M>{"a \\le c \\le b"}</M>. We
          show <M>{"f(c) = 0"}</M> by ruling out the other two possibilities.
        </p>
        <p>
          Suppose <M>{"f(c) < 0"}</M>. Then <M>{"c < b"}</M>, and by continuity, with <M>{"\\varepsilon = -f(c)"}</M>, f stays
          negative on some interval <M>{"[c, c + \\delta)"}</M>. Those points lie in S, so c is not an upper bound of S, a
          contradiction.
        </p>
        <p>
          Suppose <M>{"f(c) > 0"}</M>. Then <M>{"c > a"}</M>, and by continuity, with <M>{"\\varepsilon = f(c)"}</M>, f stays
          positive on some interval <M>{"(c - \\delta, c]"}</M>. No point of S lies there, so <M>{"c - \\delta"}</M> is an
          upper bound of S smaller than c, again a contradiction. So <M>{"f(c) = 0"}</M>, and c is neither a nor b.
        </p>
      </Proof>

      <Remark title="where the hypotheses were used">
        <p>
          Completeness supplied the point c; continuity made the sign of f near c match its sign at c. Remove either and the
          theorem fails, as the visualisation shows. In the rationals, <M>{"x^2 - 2"}</M> changes sign on <M>{"[1, 2]"}</M>{" "}
          without a rational root. With a jump, a function can leap over a level. The theorem is a pure existence result:
          like the existence proofs of Proof and Logic, it says a root is there without saying where.
        </p>
      </Remark>

      <Example title="the monk">
        <p>
          Let <M>{"u(t)"}</M> and <M>{"d(t)"}</M> be the monk&rsquo;s distance along the path from the bottom at time t on the
          upward and downward days, for t from sunrise to sunset. Both are continuous. Let <M>{"g(t) = u(t) - d(t)"}</M>. At
          sunrise <M>{"g = 0 - L < 0"}</M>, where L is the length of the path; at sunset <M>{"g = L - 0 > 0"}</M>. By the
          theorem, <M>{"g(t) = 0"}</M> at some time t, and then the monk is at the same spot on both days.
        </p>
      </Example>

      <Example title="every odd-degree polynomial has a real root">
        <p>
          Take <M>{"p(x) = x^3 - 4x^2 + x + 5"}</M>. For large positive x, the <M>{"x^3"}</M> term dominates and{" "}
          <M>{"p(x) > 0"}</M>; for large negative x, <M>{"p(x) < 0"}</M>. Indeed <M>{"p(-2) = -21"}</M> and{" "}
          <M>{"p(0) = 5"}</M>. So p has a root between <M>{"-2"}</M> and 0. The same argument works for every polynomial of
          odd degree. Even-degree ones can miss the axis entirely, like <M>{"x^2 + 1"}</M>.
        </p>
      </Example>

      <Theorem title="square roots exist">
        <p>
          For every <M>{"y \\ge 0"}</M> there is an <M>{"x \\ge 0"}</M> with <M>{"x^2 = y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"y = 0"}</M>, take <M>{"x = 0"}</M>. Otherwise <M>{"f(x) = x^2"}</M> is continuous on{" "}
          <M>{"[0, y + 1]"}</M>, with <M>{"f(0) = 0 < y"}</M> and <M>{"f(y + 1) = y^2 + 2y + 1 > y"}</M>. By the theorem,{" "}
          <M>{"f(x) = y"}</M> for some x in between.
        </p>
      </Proof>

      <Remark title="finding the root">
        <p>
          The proof by bisection, which you met in Proof and Logic, also finds the root: halve the interval, keep the half on
          which f changes sign, and repeat. Each step gains one binary digit of accuracy. This is how calculators find roots
          when no formula exists.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hypotheses",
      rung: "check",
      prompt: <p>Which hypotheses does the intermediate value theorem need? Choose all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["f is continuous on [a, b]", "f is differentiable", "k lies between f(a) and f(b)", "f is increasing"],
        correct: [0, 2],
      },
    },
    {
      key: "sign",
      rung: "check",
      prompt: (
        <p>
          For <M>{"p(x) = x^3 - 4x^2 + x + 5"}</M>, what is <M>{"p(-2)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -21 },
    },
    {
      key: "interval",
      rung: "apply",
      prompt: (
        <p>
          The equation <M>{"x^3 + x = 5"}</M> has a root between two consecutive integers n and <M>{"n + 1"}</M>. What is n?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "bisect",
      rung: "apply",
      prompt: (
        <p>
          Bisection on <M>{"[1, 2]"}</M> for <M>{"x^2 - 3"}</M>: after checking the midpoint 1.5, which half do you keep?
        </p>
      ),
      answer: { kind: "choice", options: ["[1, 1.5]", "[1.5, 2]"], correct: [1] },
    },
    {
      key: "fails",
      rung: "apply",
      prompt: (
        <p>
          <M>{"f(x) = 1/x"}</M> has <M>{"f(-1) = -1"}</M> and <M>{"f(1) = 1"}</M>, but never equals 0. Why does this not
          contradict the theorem?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "f is not continuous on [−1, 1], since it is not even defined at 0",
          "0 is not between −1 and 1",
          "the theorem only applies to polynomials",
          "f is decreasing",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: x ** 3 - x - 2
lo, hi = 1.0, 2.0
for _ in range(20):
    mid = (lo + hi) / 2
    if f(mid) > 0:
        hi = mid
    else:
        lo = mid
print(round(lo, 3))`}</Code>
          <p>Bisection finds a root guaranteed by the intermediate value theorem. What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1.521, tolerance: 0.0005 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bisect(f, lo, hi, tol)</C>, which assumes f(lo) and f(hi) have opposite signs and halves the interval until it is shorter than tol, then returns its midpoint.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bisect(f, lo, hi, tol=1e-10):
    return (lo + hi) / 2
`,
        solution: `def bisect(f, lo, hi, tol=1e-10):
    flo = f(lo)
    while hi - lo > tol:
        mid = (lo + hi) / 2
        fm = f(mid)
        if (fm > 0) == (flo > 0):
            lo, flo = mid, fm
        else:
            hi = mid
    return (lo + hi) / 2
`,
        tests: [
          { name: "cube root", code: `assert abs(bisect(lambda x: x ** 3 - 2, 0, 2) - 2 ** (1 / 3)) < 1e-9, 'The root of x³ − 2 is the cube root of 2.'` },
          { name: "decreasing", code: `import math
assert abs(bisect(lambda x: math.cos(x) - x, 0, 1) - 0.7390851332) < 1e-9, 'Handle a function that goes from positive to negative too.'` },
        ],
      },
    },
    {
      key: "fixed",
      rung: "prove",
      prompt: (
        <p>
          Let f be continuous on <M>{"[0, 1]"}</M> with values in <M>{"[0, 1]"}</M>. Prove that f has a fixed point: some c
          with <M>{"f(c) = c"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines g(x) = f(x) − x, and notes it is continuous.",
          "Shows g(0) ≥ 0 and g(1) ≤ 0.",
          "Handles the cases where g(0) = 0 or g(1) = 0, and otherwise applies the theorem.",
        ],
      },
    },
    {
      key: "antipodes",
      rung: "stretch",
      prompt: (
        <p>
          Prove that at any moment there are two diametrically opposite points on the equator with exactly the same
          temperature. Assume temperature varies continuously along the equator.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Parametrises the equator by angle θ, with temperature T(θ) continuous and 2π-periodic.",
          "Defines g(θ) = T(θ) − T(θ + π).",
          "Observes g(θ + π) = −g(θ), so g takes values of both signs (or is 0).",
          "Applies the theorem on [0, π] to find θ with g(θ) = 0.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend the intermediate value theorem, why it needs both continuity and the completeness of the real numbers, and how it solves the monk puzzle.",

  glimpse: (
    <p>
      Next, the extreme value theorem, the second great fact about continuous functions on closed intervals. The fixed-point exercise is the one-dimensional case of Brouwer&rsquo;s fixed point theorem, and bisection, the algorithm hidden in the proof, returns as the most reliable root-finder in Numerical Linear Algebra and Scientific Computing. Closer at hand, the theorem is one ingredient of the mean value theorem later in this course.
    </p>
  ),
};
