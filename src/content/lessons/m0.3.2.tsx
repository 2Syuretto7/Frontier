import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { VerticalLineViz } from "@/components/viz/VerticalLineViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.3.2",
  minutes: 60,
  links: {
    revisits: ["m0.2.2"],
    foreshadows: ["m0.3.5", "m0.6.1", "m2.3.1"],
  },

  puzzle: (
    <>
      <p>
        A train leaves a station and you plot its distance from the station against time. Could part of that graph be a
        vertical line segment? Could part of it be horizontal? Could the graph ever bend back on itself, like the letter
        S lying on its side?
      </p>
      <p>Each answer says something about trains, and something about functions.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A horizontal piece is fine: the train is standing still, the same distance at many times. A vertical piece is
        impossible: at one instant the train would be at many distances at once. A sideways S is impossible for the same
        reason. The rule &ldquo;at each time, exactly one distance&rdquo; is the definition of a function, and on a graph it
        becomes something you can see: <em>no vertical line meets the graph more than once</em>.
      </p>
      <p>
        Slide the vertical line across each curve below. The circle and the sideways parabola are perfectly good curves,
        but they are not graphs of functions of <M>x</M>.
      </p>
      <VerticalLineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="graph">
        <p>The <strong>graph</strong> of a function <M>f</M> with domain <M>D</M> is the set of points</p>
        <MD>{"\\{\\, (x, y) : x \\in D \\text{ and } y = f(x) \\,\\}."}</MD>
        <p>
          A point <M>{"(p, q)"}</M> lies on the graph exactly when <M>p</M> is in the domain and{" "}
          <M>{"q = f(p)"}</M>. The equation <M>{"y = f(x)"}</M> is a test that each point passes or fails.
        </p>
      </Definition>

      <Theorem title="the vertical line test">
        <p>
          A set <M>S</M> of points in the plane is the graph of a function of <M>x</M> exactly when every vertical line
          meets <M>S</M> at most once. The domain of that function is the set of <M>c</M> for which the line{" "}
          <M>{"x = c"}</M> meets <M>S</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>S</M> is the graph of <M>f</M> and the line <M>{"x = c"}</M> met it at <M>{"(c, q_1)"}</M> and{" "}
          <M>{"(c, q_2)"}</M>, then <M>{"q_1 = f(c) = q_2"}</M>, so the two points are the same. Conversely, suppose each
          vertical line meets <M>S</M> at most once. Let <M>D</M> be the set of <M>c</M> whose line meets <M>S</M>, and for
          such <M>c</M> let <M>{"f(c)"}</M> be the height of the one meeting point. Then <M>f</M> gives each <M>c</M> in{" "}
          <M>D</M> exactly one value, and its graph is <M>S</M>.
        </p>
      </Proof>

      <p>Reading a graph means translating between its geometry and the function:</p>
      <ul>
        <li>The <strong>y-intercept</strong> is <M>{"(0, f(0))"}</M>; the <strong>x-intercepts</strong> are the roots, where <M>{"f(x) = 0"}</M>.</li>
        <li>The solutions of <M>{"f(x) = k"}</M> are where the graph meets the horizontal line <M>{"y = k"}</M>.</li>
        <li>The solutions of <M>{"f(x) = g(x)"}</M> are the <M>x</M>-coordinates where the two graphs cross.</li>
        <li>
          <M>f</M> is <strong>increasing</strong> on an interval if <M>{"a < b"}</M> implies <M>{"f(a) < f(b)"}</M> there:
          the graph rises from left to right. <strong>Decreasing</strong> is the reverse.
        </li>
      </ul>

      <Example title="solving by picture, then by algebra">
        <p>
          How many solutions does <M>{"x^2 = x + 2"}</M> have? Sketch the parabola <M>{"y = x^2"}</M> and the line{" "}
          <M>{"y = x + 2"}</M>: the line crosses the parabola twice, once on each side of the axis. Algebra confirms it:{" "}
          <M>{"x^2 - x - 2 = (x - 2)(x + 1)"}</M>, so <M>{"x = 2"}</M> or <M>{"x = -1"}</M>, at the points{" "}
          <M>{"(2, 4)"}</M> and <M>{"(-1, 1)"}</M>. The picture tells you what to expect; the algebra makes it exact.
        </p>
      </Example>

      <Definition title="even and odd functions">
        <p>
          A function is <strong>even</strong> if <M>{"f(-x) = f(x)"}</M> for every <M>x</M> in its domain, and{" "}
          <strong>odd</strong> if <M>{"f(-x) = -f(x)"}</M>. (The domain must contain <M>{"-x"}</M> whenever it contains{" "}
          <M>x</M>.) <M>{"x^2"}</M>, <M>{"x^4"}</M> and <M>{"|x|"}</M> are even; <M>x</M>, <M>{"x^3"}</M> and{" "}
          <M>{"\\tfrac1x"}</M> are odd; <M>{"x^2 + x"}</M> is neither.
        </p>
      </Definition>

      <Proposition title="symmetry">
        <p>
          The graph of an even function is symmetric in the <M>y</M>-axis. The graph of an odd function is symmetric about
          the origin: turning it through half a turn about <M>{"(0, 0)"}</M> leaves it unchanged.
        </p>
      </Proposition>
      <Proof>
        <p>
          Reflection in the <M>y</M>-axis sends <M>{"(x, y)"}</M> to <M>{"(-x, y)"}</M>. If <M>f</M> is even and{" "}
          <M>{"(x, y)"}</M> is on the graph, then <M>{"y = f(x) = f(-x)"}</M>, so <M>{"(-x, y)"}</M> is on the graph too.
          A half turn about the origin sends <M>{"(x, y)"}</M> to <M>{"(-x, -y)"}</M>. If <M>f</M> is odd and{" "}
          <M>{"y = f(x)"}</M>, then <M>{"f(-x) = -f(x) = -y"}</M>, so <M>{"(-x, -y)"}</M> is on the graph.
        </p>
      </Proof>

      <Remark title="what a graph cannot show">
        <p>
          A drawn graph shows a window of the plane at finite resolution. It cannot show what happens far outside the
          window, it hides very small wiggles, and it cannot distinguish 1.9999 from 2. Treat a graph as evidence and a
          guide, and confirm what it suggests by algebra, as in the example above. Calculus is, in part, the toolkit for
          finding out exactly what a graph only hints at: where it turns, how steeply it climbs, and whether it has gaps.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "on-graph",
      rung: "check",
      prompt: <p>Which of these points lie on the graph of <M>{"y = x^2 + 1"}</M>?</p>,
      answer: { kind: "choice", options: ["(2, 5)", "(−2, 5)", "(1, 1)", "(0, 1)"], correct: [0, 1, 3] },
    },
    {
      key: "intercept",
      rung: "check",
      prompt: <p>What is the <M>y</M>-coordinate of the <M>y</M>-intercept of <M>{"y = 3x^2 - x + 4"}</M>?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "parity",
      rung: "apply",
      prompt: <p>Select every <strong>odd</strong> function.</p>,
      answer: {
        kind: "choice",
        options: ["f(x) = x³ − x", "f(x) = x² + 1", "f(x) = 5x", "f(x) = x³ + 1"],
        correct: [0, 2],
      },
    },
    {
      key: "intersections",
      rung: "apply",
      prompt: (
        <p>
          The graphs of <M>{"y = x^2"}</M> and <M>{"y = 2 - x"}</M> cross at two points. What is the <M>x</M>-coordinate
          of the crossing point on the left?
        </p>
      ),
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "circle",
      rung: "apply",
      prompt: (
        <p>
          The circle <M>{"x^2 + y^2 = 25"}</M> is not the graph of a function. Which choice of points gives a function whose
          graph is part of the circle?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "the points with y ≥ 0, that is y = √(25 − x²)",
          "the points with x ≥ 0",
          "the points with x ≤ 3",
          "the whole circle, if we allow two outputs",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [x / 2 for x in range(-4, 5)]
ys = [x * x - 1 for x in xs]
print(len(xs), min(ys), xs[ys.index(min(ys))], sum(1 for y in ys if y < 0))`}</Code>
          <p>Sampling y = x² − 1 at x = −2, −1.5, …, 2. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9 -1.0 0.0 3", "9 -1.0 0.0 2", "8 -1.0 0.0 3", "9 -1 0 3"], correct: [0] },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>sign_changes(f, a, b, n)</C>, which samples f at n + 1 evenly spaced points from a to b and returns the list of subintervals (x, x + h) on which f changes sign (from negative to positive or positive to negative), so a root lies inside. A sample exactly equal to 0 should count as a root interval (x, x) of its own, and it should not also produce a sign change with its neighbours.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def sign_changes(f, a, b, n):
    return []
`,
        solution: `def sign_changes(f, a, b, n):
    h = (b - a) / n
    xs = [a + i * h for i in range(n + 1)]
    ys = [f(x) for x in xs]
    out = []
    for i in range(n + 1):
        if ys[i] == 0:
            out.append((xs[i], xs[i]))
        elif i < n and ys[i + 1] != 0 and (ys[i] < 0) != (ys[i + 1] < 0):
            out.append((xs[i], xs[i + 1]))
    return out
`,
        tests: [
          { name: "two roots", code: `iv = sign_changes(lambda x: x * x - 2, -3, 3, 6)
assert iv == [(-2.0, -1.0), (1.0, 2.0)], '±√2 lie in (−2, −1) and (1, 2).'` },
          { name: "exact zero", code: `iv = sign_changes(lambda x: x * x - 1, -2, 2, 4)
assert iv == [(-1.0, -1.0), (1.0, 1.0)], 'Samples at ±1 are roots themselves.'` },
          { name: "none", code: `assert sign_changes(lambda x: x * x + 1, -5, 5, 10) == [], 'No sign change, no root found.'` },
          { name: "cubic", code: `iv = sign_changes(lambda x: x ** 3 - x - 0.5, -2, 2, 8)
assert len(iv) == 1 and iv[0][0] < 1.19 < iv[0][1], 'One real root near 1.19.'` },
        ],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`xs = [-2, -1, 0, 1, 2]
print([x * x - 1 for x in xs])`}</Code>
          <p>A table of values for y = x² − 1. Where does the graph cross the x-axis, inside this table?</p>
        </>
      ),
      answer: { kind: "choice", options: ["At x = −1 and x = 1", "At x = 0 only", "Nowhere", "At x = −2 and x = 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>table(f, a, b, n)</C>, which returns the list of n + 1 points (x, f(x)) with x evenly spaced from a to b, the first step in drawing any graph.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def table(f, a, b, n):
    return [(a, f(a)), (b, f(b))]
`,
        solution: `def table(f, a, b, n):
    h = (b - a) / n
    return [(a + i * h, f(a + i * h)) for i in range(n + 1)]
`,
        tests: [
          { name: "square", code: `pts = table(lambda x: x * x, 0, 2, 4)
assert len(pts) == 5 and all(abs(x - y) < 1e-9 for (x, _), y in zip(pts, [0, 0.5, 1, 1.5, 2])) and abs(pts[3][1] - 2.25) < 1e-9, 'Step by (b − a)/n, and include both ends.'` },
          { name: "reversed and one step", code: `pts = table(lambda x: 3 * x - 1, 1, -1, 1)
assert pts == [(1, 2), (-1, -4)], 'n = 1 gives just the two ends, even when a > b.'` },
          { name: "many points", code: `pts = table(abs, -3, 3, 6)
assert [round(x, 9) for x, _ in pts] == [-3, -2, -1, 0, 1, 2, 3] and [y for _, y in pts] == [3, 2, 1, 0, 1, 2, 3], 'n steps give n + 1 points.'` },
        ],
      },
    },
    {
      key: "even-proof",
      rung: "prove",
      prompt: (
        <p>
          Suppose <M>f</M> and <M>g</M> are both odd functions on the reals. Prove that their product{" "}
          <M>{"h(x) = f(x)g(x)"}</M> is even, and say what this means for the graph of <M>h</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes h(−x) = f(−x)g(−x).",
          "Uses oddness to write this as (−f(x))(−g(x)).",
          "Concludes h(−x) = f(x)g(x) = h(x), so h is even.",
          "States that the graph of h is symmetric in the y-axis.",
        ],
      },
    },
    {
      key: "abs-equation",
      rung: "stretch",
      prompt: (
        <p>
          How many real solutions does <M>{"|x| = x^2 - 2"}</M> have? Sketch both graphs first, then confirm by algebra,
          treating <M>{"x \\ge 0"}</M> and <M>{"x < 0"}</M> separately.
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain the vertical line test to a friend, using the train puzzle. Then say why a horizontal line meeting a graph twice is no problem at all.",

  glimpse: (
    <p>
      Next, the two families of graphs you will meet most: straight lines and parabolas. The Cartesian plane returns in
      the chapter on coordinates and vectors, where curves like the circle are described by equations that are not
      functions. In Calculus, continuity makes precise the idea of a graph with no gaps, and the derivative measures how
      steeply a graph climbs.
    </p>
  ),
};
