import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { CurveShapeViz } from "@/components/viz/CurveShapeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m2.5.2",
  minutes: 80,
  links: {
    revisits: ["m0.3.3", "m2.3.2"],
    foreshadows: ["m7.4.2"],
  },

  puzzle: (
    <>
      <p>
        A newspaper reports: &ldquo;Prices are still rising, but more slowly than last month.&rdquo; Another says:
        &ldquo;The fall in sales is accelerating.&rdquo; Each sentence is about a quantity, how it changes, and how its
        change changes.
      </p>
      <p>
        If you knew only the derivative of a function, how much could you say about the shape of its graph? Where it rises,
        where it falls, where it turns, and which way it bends?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The sign of <M>{"f'"}</M> says whether the graph is rising or falling. The sign of <M>{"f''"}</M> says whether the
        slope itself is rising or falling: whether the graph bends upwards like a bowl or downwards like a cap. The first
        newspaper describes <M>{"f' > 0"}</M> and <M>{"f'' < 0"}</M>. Move the point below and watch the strips.
      </p>
      <CurveShapeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="increasing and decreasing">
        <p>
          f is <strong>increasing</strong> on an interval I if <M>{"x < y"}</M> implies <M>{"f(x) \\le f(y)"}</M> for x, y
          in I, and <strong>strictly increasing</strong> if it implies <M>{"f(x) < f(y)"}</M>. Decreasing is defined in the
          same way.
        </p>
      </Definition>

      <Theorem title="the sign of the derivative">
        <p>
          Let f be continuous on an interval I and differentiable inside it. If <M>{"f' \\ge 0"}</M> inside I, f is
          increasing on I; if <M>{"f' > 0"}</M>, strictly increasing. Likewise for <M>{"f' \\le 0"}</M> and{" "}
          <M>{"f' < 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"x < y"}</M> in I. By the mean value theorem, <M>{"f(y) - f(x) = f'(c)(y - x)"}</M> for some c between
          them. The factor <M>{"y - x"}</M> is positive, so <M>{"f(y) - f(x)"}</M> has the sign of <M>{"f'(c)"}</M>.
        </p>
      </Proof>

      <Remark title="the converse is weaker">
        <p>
          <M>{"x^3"}</M> is strictly increasing on all of ℝ, yet its derivative is 0 at 0. A strictly increasing
          differentiable function has <M>{"f' \\ge 0"}</M>, not necessarily <M>{"f' > 0"}</M>.
        </p>
      </Remark>

      <Theorem title="the first derivative test">
        <p>
          Let c be a point where <M>{"f'(c) = 0"}</M>, with f differentiable near c. If <M>{"f'"}</M> is positive just
          to the left of c and negative just to the right, f has a local maximum at c. If it goes from negative to positive,
          a local minimum. If it does not change sign, neither.
        </p>
      </Theorem>
      <p>This follows at once from the last theorem: f rises up to c and falls after it, or the reverse.</p>

      <Definition title="convex and concave">
        <p>
          f is <strong>convex</strong> on I if every chord lies on or above the graph: for x, y in I and{" "}
          <M>{"0 \\le t \\le 1"}</M>,
        </p>
        <MD>{"f\\big(t x + (1 - t) y\\big) \\le t f(x) + (1 - t) f(y)."}</MD>
        <p>
          f is <strong>concave</strong> if every chord lies on or below the graph. A point where the graph changes from one
          to the other is an <strong>inflection point</strong>.
        </p>
      </Definition>

      <Theorem title="the sign of the second derivative">
        <p>
          If <M>{"f'' \\ge 0"}</M> on an open interval, f is convex there; if <M>{"f'' \\le 0"}</M>, concave.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"x < z < y"}</M>. By the mean value theorem, the chord from x to z has slope <M>{"f'(c_1)"}</M> and the
          chord from z to y has slope <M>{"f'(c_2)"}</M>, with <M>{"c_1 < z < c_2"}</M>. Since <M>{"f'' \\ge 0"}</M>,{" "}
          <M>{"f'"}</M> is increasing, so the first slope is at most the second. A path that climbs no faster on the left
          part than on the right part must pass at or below the straight line from <M>{"(x, f(x))"}</M> to{" "}
          <M>{"(y, f(y))"}</M>; writing this out with <M>{"z = tx + (1 - t)y"}</M> gives exactly the inequality in the
          definition.
        </p>
      </Proof>

      <Theorem title="the second derivative test">
        <p>
          If <M>{"f'(c) = 0"}</M> and <M>{"f''(c) > 0"}</M>, f has a local minimum at c. If <M>{"f'(c) = 0"}</M> and{" "}
          <M>{"f''(c) < 0"}</M>, a local maximum. If <M>{"f''(c) = 0"}</M>, the test says nothing.
        </p>
      </Theorem>
      <p>
        If <M>{"f''(c) > 0"}</M>, then <M>{"f'(c + h)/h = (f'(c + h) - f'(c))/h"}</M> tends to <M>{"f''(c)"}</M>, so it is
        positive for small <M>{"h \\ne 0"}</M>. Hence{" "}
        <M>{"f'"}</M> is negative just left of c and positive just right, and the first derivative test applies. The last
        sentence is shown by <M>{"x^4"}</M>, <M>{"-x^4"}</M> and <M>{"x^3"}</M> at 0: second derivative 0, and a minimum,
        a maximum, and neither.
      </p>

      <Example title="a cubic, completely">
        <p>
          For <M>{"f(x) = x^3 - 3x"}</M>: <M>{"f'(x) = 3(x - 1)(x + 1)"}</M>, positive outside <M>{"[-1, 1]"}</M> and
          negative inside. So f increases, then decreases, then increases, with a local maximum <M>{"f(-1) = 2"}</M> and a
          local minimum <M>{"f(1) = -2"}</M>. And <M>{"f''(x) = 6x"}</M>: concave for <M>{"x < 0"}</M>, convex for{" "}
          <M>{"x > 0"}</M>, with an inflection point at the origin. These few facts fix the shape of the graph.
        </p>
      </Example>

      <Remark title="tangents and convexity">
        <p>
          A differentiable convex function lies above each of its tangent lines, as the visualisation shows. This simple
          picture gives many inequalities. For instance, <M>{"x^2 \\ge 2x - 1"}</M> because the right side is the tangent to{" "}
          <M>{"x^2"}</M> at 1. Later, the same idea gives the inequality between arithmetic and geometric means, and much of
          probability theory.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "square-derivative",
      rung: "check",
      prompt: (
        <p>
          A function has derivative <M>{"f'(x) = (x - 2)^2"}</M>. Which is true?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["f is increasing on all of ℝ", "f is decreasing on all of ℝ", "f has a local maximum at 2", "f has a local minimum at 2"],
        correct: [0],
      },
    },
    {
      key: "news",
      rung: "check",
      prompt: <p>&ldquo;Prices are still rising, but more slowly.&rdquo; If p(t) is the price at time t, this says&hellip;</p>,
      answer: { kind: "choice", options: ["p′ > 0 and p″ > 0", "p′ > 0 and p″ < 0", "p′ < 0 and p″ < 0", "p′ < 0 and p″ > 0"], correct: [1] },
    },
    {
      key: "local-max",
      rung: "apply",
      prompt: (
        <p>
          What is the local maximum value of <M>{"x^3 - 12x"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "inflection",
      rung: "apply",
      prompt: (
        <p>
          At what x does <M>{"x^3 - 6x^2 + 5"}</M> have its inflection point?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "concave",
      rung: "apply",
      prompt: (
        <p>
          On which interval is <M>{"x^4 - 2x^2"}</M> concave?
        </p>
      ),
      answer: { kind: "choice", options: ["(−1, 1)", "(−1/√3, 1/√3)", "(0, ∞)", "(−∞, −1) and (1, ∞)"], correct: [1] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
x = np.linspace(-2, 2, 9)
f2 = 12 * x ** 2 - 4
print(int((f2 < 0).sum()))`}</Code>
          <p>f(x) = x⁴ − 2x² has f″ = 12x² − 4. On how many of these nine points is f concave?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x: x ** 4 - 4 * x ** 3
d2 = lambda x: 12 * x * x - 24 * x
xs = [x / 2 for x in range(-2, 7)]
print([x for x in xs if d2(x) < 0], d2(0), d2(2))`}</Code>
          <p>Where is x⁴ − 4x³ concave (second derivative negative) on a grid? What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 1.0, 1.5] 0 0", "[0.0, 0.5, 1.0, 1.5, 2.0] 0 0", "[0.5, 1.0, 1.5, 2.0] 0 0", "[-1.0, -0.5] 0 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>increasing_intervals(df, a, b, n)</C>: sample df at n + 1 evenly spaced points of [a, b] and return the fraction of them where df &gt; 0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def increasing_intervals(df, a, b, n=1000):
    return 1.0
`,
        solution: `def increasing_intervals(df, a, b, n=1000):
    xs = [a + (b - a) * k / n for k in range(n + 1)]
    return sum(df(x) > 0 for x in xs) / (n + 1)
`,
        tests: [
          { name: "cubic", code: `frac = increasing_intervals(lambda x: 3 * x * x - 3, -2, 2, 4000)
assert abs(frac - 0.5) < 0.01, 'x³ − 3x increases on [−2, −1] and [1, 2], half of [−2, 2].'` },
          { name: "always", code: `assert increasing_intervals(lambda x: 1, 0, 1) == 1.0, 'A positive derivative everywhere gives 1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_convex(xs, ys)</C> for sample points with increasing xs, true when every point lies on or below the chord of its neighbours (the slopes between consecutive points never decrease), allowing 1e−12 slack. Then write <C>convex_hull_lower(xs, ys)</C>, the lower convex hull of the points as a list of indices (a monotone chain: keep a stack and pop while the last turn is not strictly convex), and <C>convex_envelope(xs, ys)</C>, the values at each x of the largest convex function below the data, by interpolating along the hull.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_convex(xs, ys):
    return True

def convex_hull_lower(xs, ys):
    return list(range(len(xs)))

def convex_envelope(xs, ys):
    return list(ys)
`,
        solution: `def is_convex(xs, ys):
    s = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(len(xs) - 1)]
    return all(b >= a - 1e-12 for a, b in zip(s, s[1:]))

def convex_hull_lower(xs, ys):
    st = []
    for i in range(len(xs)):
        while len(st) >= 2:
            a, b = st[-2], st[-1]
            cross = (xs[b] - xs[a]) * (ys[i] - ys[a]) - (ys[b] - ys[a]) * (xs[i] - xs[a])
            if cross <= 0:
                st.pop()
            else:
                break
        st.append(i)
    return st

def convex_envelope(xs, ys):
    h = convex_hull_lower(xs, ys)
    out = []
    j = 0
    for i, x in enumerate(xs):
        while j + 1 < len(h) and xs[h[j + 1]] < x:
            j += 1
        if j + 1 < len(h):
            a, b = h[j], h[j + 1]
            t = (x - xs[a]) / (xs[b] - xs[a])
            out.append(ys[a] + t * (ys[b] - ys[a]))
        else:
            out.append(ys[h[-1]])
    return out
`,
        tests: [
          { name: "convex", code: `xs = [i / 10 for i in range(-20, 21)]
assert is_convex(xs, [x * x for x in xs]) and not is_convex(xs, [x ** 3 for x in xs]) and is_convex([0, 1, 2], [0, 1, 2]), 'x² is convex, x³ is not.'` },
          { name: "hull", code: `assert convex_hull_lower([0, 1, 2, 3, 4], [0, 3, 1, 4, 0]) == [0, 4] and convex_hull_lower([0, 1, 2, 3], [3, 1, 0, 2]) == [0, 1, 2, 3], 'Keep only strictly convex turns.'` },
          { name: "envelope", code: `env = convex_envelope([0, 1, 2, 3, 4], [0, 3, 1, 4, 0])
assert env == [0, 0, 0, 0, 0], 'The chord from the first to the last point.'` },
          { name: "below and convex", code: `import math
xs = [i / 20 for i in range(201)]
ys = [math.sin(3 * x) + 0.1 * x * x for x in xs]
env = convex_envelope(xs, ys)
assert is_convex(xs, env) and all(e <= y + 1e-12 for e, y in zip(env, ys)), 'The envelope is convex and lies below the data.'` },
        ],
      },
    },
    {
      key: "strict",
      rung: "prove",
      prompt: (
        <p>
          Prove that if <M>{"f'(x) > 0"}</M> for every x in an open interval I, then f is strictly increasing on I. Then use
          this to prove that <M>{"\\sin x < x"}</M> for every <M>{"x > 0"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Takes x < y in I and applies the mean value theorem to get f(y) − f(x) = f′(c)(y − x) > 0.",
          "Considers g(x) = x − sin x, with g(0) = 0 and g′(x) = 1 − cos x ≥ 0.",
          "Concludes g(x) > 0 for x > 0, for example because g′ > 0 on (0, 2π), and sin x ≤ 1 < x once x > 1.",
        ],
      },
    },
    {
      key: "wiggle",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"g(x) = x + 2x^2 \\sin(1/x)"}</M> for <M>{"x \\ne 0"}</M> and <M>{"g(0) = 0"}</M>. Show that{" "}
          <M>{"g'(0) = 1"}</M>, but that g is not increasing on any open interval containing 0. Why does this not contradict
          the theorem of this lesson?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes g′(0) from the definition: the quotient is 1 + 2h sin(1/h), which tends to 1.",
          "Computes g′(x) = 1 + 4x sin(1/x) − 2cos(1/x) for x ≠ 0 and notes it is negative at points such as x = 1/(2nπ), arbitrarily close to 0.",
          "Explains that the theorem needs f′ > 0 on a whole interval, not at a single point.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend what the first and second derivatives tell you about the shape of a graph, using the cubic x³ − 3x as your example.",

  glimpse: (
    <p>
      Next, optimisation: finding the largest or smallest value of a function. Convexity is one of the most useful ideas in mathematics. In Probability it becomes Jensen&rsquo;s inequality, which compares the average of a convex function with the function of the average, and in Convex Optimisation it is the property that makes every local minimum a global one.
    </p>
  ),
};
