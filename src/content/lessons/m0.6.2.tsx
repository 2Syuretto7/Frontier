import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { SlopeViz } from "@/components/viz/SlopeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.6.2",
  minutes: 70,
  links: {
    revisits: ["m0.3.3", "m0.5.1"],
    foreshadows: ["m3.1.4", "l2.3.1"],
  },

  puzzle: (
    <>
      <p>
        Your house is at the origin of a map marked in kilometres. A straight road passes through the points{" "}
        <M>{"(2, 1)"}</M> and <M>{"(-2, 4)"}</M>. You want to lay a footpath from your house to the road.
      </p>
      <p>
        Where should the path meet the road to be as short as possible, and how long will it be? Guess the direction of
        the path before you calculate anything.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Everyone&rsquo;s instinct is right: the shortest path meets the road at a right angle. If it met the road at a
        slant, the path and the road would make a right triangle with a shorter path as one leg and your slanting path as
        the hypotenuse, and the hypotenuse is always the longest side.
      </p>
      <p>
        To turn that instinct into numbers you need three things, all read off from coordinates. The{" "}
        <strong>slope</strong> of the road, which says how steeply it climbs. The slope of a line at right angles to it.
        And the distance formula from the last lesson, to measure the path. Move P and Q below and watch the slope, the
        equation of the line and the perpendicular change together.
      </p>
      <SlopeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="slope">
        <p>
          The <strong>slope</strong> of the line through <M>{"(x_1, y_1)"}</M> and <M>{"(x_2, y_2)"}</M>, with{" "}
          <M>{"x_1 \\neq x_2"}</M>, is
        </p>
        <MD>{"m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{\\text{rise}}{\\text{run}}."}</MD>
        <p>
          A vertical line, where <M>{"x_1 = x_2"}</M>, has no slope: the run is zero and we cannot divide by it.
        </p>
      </Definition>

      <p>
        Does the slope depend on which two points of the line we pick? It does not. Take any two other points on the same
        line and draw their rise and run. The two right triangles have the same angles, since their hypotenuses lie along
        the same line and their legs are horizontal and vertical, so they are similar, and similar triangles have sides in
        the same ratio. That ratio is the slope.
      </p>

      <Theorem title="equations of lines">
        <p>
          The line through <M>{"(x_1, y_1)"}</M> with slope <M>m</M> is the graph of
        </p>
        <MD>{"y - y_1 = m(x - x_1)."}</MD>
        <p>
          Every line, vertical ones included, is the graph of an equation <M>{"ax + by = c"}</M> with <M>a</M> and{" "}
          <M>b</M> not both zero, and every such equation has a line as its graph.
        </p>
      </Theorem>
      <Proof>
        <p>
          A point <M>{"(x, y)"}</M> other than <M>{"(x_1, y_1)"}</M> lies on the line exactly when the slope from{" "}
          <M>{"(x_1, y_1)"}</M> to it is <M>m</M>, that is, when <M>{"\\tfrac{y - y_1}{x - x_1} = m"}</M>. Multiply out to
          get the equation, which <M>{"(x_1, y_1)"}</M> also satisfies. Rearranged, it reads{" "}
          <M>{"-mx + y = y_1 - mx_1"}</M>, of the form <M>{"ax + by = c"}</M>. A vertical line is <M>{"x = c"}</M>, which is{" "}
          <M>{"a = 1, b = 0"}</M>. Conversely, if <M>{"b \\neq 0"}</M>, then <M>{"ax + by = c"}</M> is{" "}
          <M>{"y = -\\tfrac{a}{b}x + \\tfrac{c}{b}"}</M>, a line of slope <M>{"-\\tfrac{a}{b}"}</M>; if <M>{"b = 0"}</M> it
          is the vertical line <M>{"x = \\tfrac{c}{a}"}</M>.
        </p>
      </Proof>

      <Example title="the road in the puzzle">
        <p>
          Through <M>{"(2, 1)"}</M> and <M>{"(-2, 4)"}</M> the slope is <M>{"\\tfrac{4 - 1}{-2 - 2} = -\\tfrac34"}</M>.
          So the road is <M>{"y - 1 = -\\tfrac34(x - 2)"}</M>. Multiply by 4 and tidy up: <M>{"3x + 4y = 10"}</M>.
        </p>
      </Example>

      <Proposition title="parallel and perpendicular lines">
        <p>
          Two non-vertical lines are parallel exactly when their slopes are equal. Two lines, neither of them vertical or
          horizontal, are perpendicular exactly when their slopes multiply to <M>{"-1"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          Lines with the same slope rise by the same amount for every step across, so the vertical gap between them never
          changes: they never meet, unless they are the same line. Lines with different slopes do meet, as the lesson on
          systems of two linear equations showed.
        </p>
        <p>
          For perpendicular lines: on a line of slope <M>m</M>, a run of 1 gives a rise of <M>m</M>. Turn this little
          step a quarter turn anticlockwise about its start. The run of 1 becomes a rise of 1, and the rise of <M>m</M>{" "}
          becomes a run of <M>{"-m"}</M>. So the perpendicular direction has slope <M>{"\\tfrac{1}{-m}"}</M>, and{" "}
          <M>{"m \\times \\left(-\\tfrac1m\\right) = -1"}</M>. Running the argument backwards gives the converse.
        </p>
      </Proof>

      <Theorem title="distance from a point to a line">
        <p>
          The shortest distance from the point <M>{"(x_0, y_0)"}</M> to the line <M>{"ax + by = c"}</M> is
        </p>
        <MD>{"\\frac{|ax_0 + by_0 - c|}{\\sqrt{a^2 + b^2}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The shortest path is perpendicular to the line, by the argument in the intuition. The line{" "}
          <M>{"ax + by = c"}</M> has direction <M>{"(b, -a)"}</M>, since moving by that step changes <M>{"ax + by"}</M> by{" "}
          <M>{"ab - ba = 0"}</M>. A perpendicular direction is <M>{"(a, b)"}</M>. So the foot of the perpendicular is{" "}
          <M>{"(x_0 + ta, \\, y_0 + tb)"}</M> for some number <M>t</M>. It lies on the line when
        </p>
        <MD>{"a(x_0 + ta) + b(y_0 + tb) = c, \\quad\\text{that is,}\\quad t = \\frac{c - ax_0 - by_0}{a^2 + b^2}."}</MD>
        <p>
          The distance from <M>{"(x_0, y_0)"}</M> to the foot is <M>{"\\sqrt{(ta)^2 + (tb)^2} = |t|\\sqrt{a^2 + b^2}"}</M>.
          Substituting <M>t</M> gives the formula.
        </p>
      </Proof>

      <Example title="the puzzle, solved">
        <p>
          From the origin to <M>{"3x + 4y = 10"}</M>: the distance is <M>{"\\tfrac{|0 + 0 - 10|}{\\sqrt{9 + 16}} = \\tfrac{10}{5} = 2"}</M>{" "}
          kilometres. From the proof, <M>{"t = \\tfrac{10}{25} = 0.4"}</M>, so the path meets the road at{" "}
          <M>{"(0.4 \\times 3, \\, 0.4 \\times 4) = (1.2, 1.6)"}</M>. Check: <M>{"3(1.2) + 4(1.6) = 10"}</M>, and the
          path&rsquo;s slope <M>{"\\tfrac{1.6}{1.2} = \\tfrac43"}</M> times the road&rsquo;s slope <M>{"-\\tfrac34"}</M> is{" "}
          <M>{"-1"}</M>.
        </p>
      </Example>

      <Remark title="the same formula, many dimensions">
        <p>
          Nothing in the proof used the fact that the plane has two dimensions, except for writing two coordinates. In
          three dimensions, <M>{"ax + by + cz = d"}</M> is a plane and the distance to it is{" "}
          <M>{"\\tfrac{|ax_0 + by_0 + cz_0 - d|}{\\sqrt{a^2 + b^2 + c^2}}"}</M>. In a thousand dimensions the pattern is the
          same. A linear classifier in machine learning splits its inputs by exactly such a flat surface, and its
          confidence about a point is measured by this distance, the point&rsquo;s <em>margin</em>.
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
      key: "perpendicular",
      rung: "check",
      prompt: <p>A line has slope <M>{"\\tfrac23"}</M>. What is the slope of a line perpendicular to it?</p>,
      answer: { kind: "numeric", value: -1.5 },
    },
    {
      key: "intercept",
      rung: "apply",
      prompt: <p>The line through <M>{"(2, 5)"}</M> with slope <M>{"-3"}</M> crosses the <M>y</M>-axis at <M>{"(0, c)"}</M>. What is <M>c</M>?</p>,
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "parallel",
      rung: "apply",
      prompt: <p>Select every line parallel to <M>{"2x - y = 5"}</M>.</p>,
      answer: { kind: "choice", options: ["y = 2x + 1", "4x - 2y = 3", "y = -2x + 5", "x - 2y = 5"], correct: [0, 1] },
    },
    {
      key: "point-line",
      rung: "apply",
      prompt: <p>How far is the point <M>{"(1, 2)"}</M> from the line <M>{"5x + 12y = 3"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`x1, y1, x2, y2 = 1, 2, 4, 8
m = (y2 - y1) / (x2 - x1)
print(m, y1 - m * x1)`}</Code>
          <p>The line through (1, 2) and (4, 8). What are its slope and intercept?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 0.0", "0.5 1.5", "2.0 2.0", "6.0 -4.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def line(p, q):
    (x1, y1), (x2, y2) = p, q
    m = (y2 - y1) / (x2 - x1)
    return m, y1 - m * x1
print(line((1, 2), (3, 8)), line((-2, 5), (2, -3)))`}</Code>
          <p>Slope and intercept of the line through two points. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(3.0, -1.0) (-2.0, 1.0)", "(3.0, -1.0) (2.0, 1.0)", "(0.33, 1.67) (-2.0, 1.0)", "(3.0, 1.0) (-2.0, -1.0)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>distance(p, q)</C> between two points and <C>perpendicular(m1, m2)</C>, which says whether lines with slopes m1 and m2 are perpendicular (m1 · m2 = −1, to within 1e-9).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def distance(p, q):
    return abs(p[0] - q[0]) + abs(p[1] - q[1])

def perpendicular(m1, m2):
    return m1 == -m2
`,
        solution: `import math

def distance(p, q):
    return math.hypot(p[0] - q[0], p[1] - q[1])

def perpendicular(m1, m2):
    return abs(m1 * m2 + 1) < 1e-9
`,
        tests: [
          { name: "distance", code: `assert abs(distance((1, 2), (4, 6)) - 5) < 1e-9, 'Pythagoras on the differences: 3, 4, 5.'` },
          { name: "perpendicular", code: `assert perpendicular(2, -0.5) and not perpendicular(1, -1.5), 'Slopes of perpendicular lines multiply to −1.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>intersect(p1, p2, p3, p4)</C>, the intersection point of the line segments p1p2 and p3p4 (points as tuples), or <C>None</C> if they do not meet. Use the parametric form p1 + t(p2 − p1) = p3 + u(p4 − p3) and require 0 ≤ t, u ≤ 1. For parallel segments return <C>None</C> (even if they overlap). Also write <C>point_line_distance(p, a, b)</C>, the distance from p to the infinite line through a and b.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def intersect(p1, p2, p3, p4):
    return None

def point_line_distance(p, a, b):
    return 0.0
`,
        solution: `import math

def intersect(p1, p2, p3, p4):
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = p1, p2, p3, p4
    d = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3)
    if d == 0:
        return None
    t = ((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3)) / d
    u = ((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1)) / d
    if 0 <= t <= 1 and 0 <= u <= 1:
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))
    return None

def point_line_distance(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    return abs((x2 - x1) * (y1 - y) - (x1 - x) * (y2 - y1)) / math.hypot(x2 - x1, y2 - y1)
`,
        tests: [
          { name: "cross", code: `assert intersect((0, 0), (4, 4), (0, 4), (4, 0)) == (2.0, 2.0), 'The diagonals of a square meet at the centre.'` },
          { name: "miss", code: `assert intersect((0, 0), (1, 1), (3, 0), (2, 1)) is None, 'The lines meet at (1.5, 1.5), outside both segments.'` },
          { name: "endpoint", code: `assert intersect((0, 0), (2, 0), (2, -1), (2, 5)) == (2.0, 0.0), 'Touching at an endpoint counts.'` },
          { name: "parallel", code: `assert intersect((0, 0), (1, 1), (0, 1), (1, 2)) is None and intersect((0, 0), (2, 2), (1, 1), (3, 3)) is None, 'Parallel segments give None.'` },
          { name: "distance", code: `assert abs(point_line_distance((0, 5), (-1, 0), (1, 0)) - 5) < 1e-12 and abs(point_line_distance((1, 1), (0, 0), (3, 4)) - 0.2) < 1e-12, 'Distance to y = 4x/3 from (1, 1) is 1/5.'` },
        ],
      },
    },
    {
      key: "perp-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that the lines <M>{"ax + by = c"}</M> and <M>{"bx - ay = d"}</M> are perpendicular whenever <M>a</M> and{" "}
          <M>b</M> are both nonzero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds the slope of the first line as −a/b, using b ≠ 0.",
          "Finds the slope of the second line as b/a, using a ≠ 0.",
          "Multiplies the slopes to get −1.",
          "Concludes by the perpendicularity criterion, noting neither line is vertical or horizontal.",
        ],
      },
    },
    {
      key: "bisector",
      rung: "stretch",
      prompt: (
        <p>
          The points equally far from <M>{"A = (1, 1)"}</M> and <M>{"B = (5, 3)"}</M> form a line. Square both distances and
          simplify to find it. Where does it cross the <M>y</M>-axis? Give the <M>y</M>-coordinate.
        </p>
      ),
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend why the slope of a line is the same whichever two points you use, and why the shortest path from a point to a line meets it at a right angle.",

  glimpse: (
    <p>
      Next, vectors, arrows that can be added and stretched, which give a cleaner language for lines and directions: the
      step <M>{"(a, b)"}</M> in the proof above is already a vector. In Linear Algebra, the equation{" "}
      <M>{"ax + by = c"}</M> grows into planes and hyperplanes in any number of dimensions, and in Statistical Machine
      Learning the distance to a hyperplane becomes the margin that support vector machines maximise.
    </p>
  ),
};
