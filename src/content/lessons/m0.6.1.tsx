import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark, Theorem } from "@/components/lesson/Blocks";
import { DistanceViz } from "@/components/viz/DistanceViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.6.1",
  minutes: 60,
  links: {
    revisits: ["m0.3.2"],
    foreshadows: ["m3.1.1"],
  },

  puzzle: (
    <>
      <p>
        A story, probably invented, says that René Descartes, lying in bed, watched a fly crawl across the ceiling and
        wondered how to describe exactly where it was. His answer: say how far it is from two walls.
      </p>
      <p>
        Try the idea. Which point is closer to <M>{"(1, 7)"}</M>: the point <M>{"(4, 3)"}</M> or the point{" "}
        <M>{"(-3, 4)"}</M>? You cannot measure with a ruler. Can you decide with arithmetic alone?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two numbers fix a point: how far across and how far up. Once points are pairs of numbers, geometric questions become
        calculations. The distance between two points is the hypotenuse of a right triangle whose legs are the gaps across
        and up, so Pythagoras does the measuring.
      </p>
      <p>
        From <M>{"(1, 7)"}</M> to <M>{"(4, 3)"}</M> the gaps are 3 and 4, a distance of 5. To <M>{"(-3, 4)"}</M> they are 4
        and 3, also 5. A tie, which no eye could judge with confidence. Move B below and watch the triangle.
      </p>
      <DistanceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="coordinates">
        <p>
          Draw two perpendicular number lines, the <M>x</M>-axis across and the <M>y</M>-axis up, crossing at their zeros, the{" "}
          <strong>origin</strong>. Each point P of the plane corresponds to exactly one ordered pair <M>{"(x, y)"}</M>: drop
          perpendiculars from P to the axes and read off where they land. The axes split the plane into four{" "}
          <strong>quadrants</strong>.
        </p>
      </Definition>

      <Theorem title="the distance formula">
        <p>The distance between <M>{"(x_1, y_1)"}</M> and <M>{"(x_2, y_2)"}</M> is</p>
        <MD>{"\\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}."}</MD>
      </Theorem>
      <Proof>
        <p>
          If the points differ in both coordinates, the point <M>{"(x_2, y_1)"}</M> makes a right-angled triangle with them.
          Its legs lie along the grid lines and have lengths <M>{"|x_2 - x_1|"}</M> and <M>{"|y_2 - y_1|"}</M>, and the
          distance we want is the hypotenuse. Apply Pythagoras; squaring removes the absolute values. If the points share a
          coordinate, the formula reduces to the distance along one line.
        </p>
      </Proof>

      <Proposition title="the midpoint">
        <p>
          The midpoint of the segment from <M>{"(x_1, y_1)"}</M> to <M>{"(x_2, y_2)"}</M> is{" "}
          <M>{"\\left(\\tfrac{x_1 + x_2}{2}, \\tfrac{y_1 + y_2}{2}\\right)"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          Moving from the first point to this one changes each coordinate by half as much as moving to the second point. So
          it lies on the segment, halfway along, and the distance formula confirms that its distance to each end is half of
          the whole.
        </p>
      </Proof>

      <Definition title="the graph of an equation">
        <p>
          The <strong>graph</strong> of an equation in <M>x</M> and <M>y</M> is the set of all points whose coordinates
          satisfy it. For example, by the distance formula, the circle with centre <M>{"(a, b)"}</M> and radius <M>r</M> is
          the graph of
        </p>
        <MD>{"(x - a)^2 + (y - b)^2 = r^2."}</MD>
      </Definition>

      <Example title="reading an equation">
        <p>
          What is the graph of <M>{"x^2 + y^2 - 4x + 6y = 12"}</M>? Complete the square in each variable:{" "}
          <M>{"(x - 2)^2 - 4 + (y + 3)^2 - 9 = 12"}</M>, so <M>{"(x - 2)^2 + (y + 3)^2 = 25"}</M>. It is the circle with
          centre <M>{"(2, -3)"}</M> and radius 5, something you could not see in the original equation.
        </p>
      </Example>

      <Remark title="geometry becomes algebra">
        <p>
          Descartes published the method in 1637, in <em>La Géométrie</em>, an appendix to his <em>Discourse on Method</em>;
          Pierre de Fermat had found much the same idea independently. For two thousand years, geometry had been done with
          figures and ingenuity. Now a curve could be an equation, and a problem about curves could be solved by algebra that
          anyone could follow step by step. Almost every later idea in this curriculum, from calculus to the spaces of many
          dimensions in Linear Algebra, stands on this one.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "distance",
      rung: "check",
      prompt: <p>What is the distance between <M>{"(1, 2)"}</M> and <M>{"(4, 6)"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "midpoint",
      rung: "check",
      prompt: <p>What is the <M>y</M>-coordinate of the midpoint of <M>{"(-2, 5)"}</M> and <M>{"(6, 1)"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "on-circle",
      rung: "apply",
      prompt: <p>The circle has centre <M>{"(2, -1)"}</M> and radius 5. Select every point that lies on it.</p>,
      answer: { kind: "choice", options: ["(5, 3)", "(−3, −1)", "(2, 4)", "(6, 1)"], correct: [0, 1, 2] },
    },
    {
      key: "radius",
      rung: "apply",
      prompt: <p>What is the radius of the circle <M>{"x^2 + y^2 - 6x + 8y = 0"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "equidistant",
      rung: "apply",
      prompt: <p>A point on the <M>x</M>-axis is the same distance from <M>{"(1, 3)"}</M> as from <M>{"(5, 1)"}</M>. What is its <M>x</M>-coordinate?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`pts = [(3, -1), (-2, 4), (-5, -5), (0, 2)]
print([(x > 0) - (x < 0) + 2 * ((y > 0) - (y < 0)) for x, y in pts])`}</Code>
          <p>This encodes the signs of x and y. Which point lies on an axis?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0, 2)", "(3, −1)", "(−2, 4)", "(−5, −5)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`pts = [(3, 4), (-1, 2), (0, -5), (-2, -2)]
far = max(pts, key=lambda p: p[0] ** 2 + p[1] ** 2)
mid = (sum(x for x, _ in pts) / 4, sum(y for _, y in pts) / 4)
print(far, mid)`}</Code>
          <p>The point farthest from the origin, and the centroid. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(3, 4) (0.0, -0.25)", "(0, -5) (0.0, -0.25)", "(3, 4) (0, -1)", "(0, -5) (0.0, 0.25)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>quadrant(x, y)</C>, which returns 1, 2, 3 or 4 for the quadrant of the point, numbered anticlockwise from the top right, and 0 for a point on an axis.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def quadrant(x, y):
    return 1
`,
        solution: `def quadrant(x, y):
    if x == 0 or y == 0:
        return 0
    if x > 0:
        return 1 if y > 0 else 4
    return 2 if y > 0 else 3
`,
        tests: [
          { name: "quadrants", code: `assert [quadrant(1, 1), quadrant(-1, 1), quadrant(-1, -1), quadrant(1, -1)] == [1, 2, 3, 4], 'Anticlockwise from the top right.'` },
          { name: "axes", code: `assert quadrant(0, 5) == 0 and quadrant(-3, 0) == 0, 'Points on an axis are in no quadrant.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>polygon_area(pts)</C>, the area of a simple polygon whose vertices are listed in order (either direction), by the shoelace formula ½|Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)|, and <C>orientation(pts)</C>, which returns <C>"anticlockwise"</C> or <C>"clockwise"</C> from the sign of that sum. Then write <C>lattice_points(pts)</C> for a polygon with integer vertices: the number of integer points strictly inside, from Pick&rsquo;s theorem A = I + B/2 − 1, where B, the number of lattice points on the boundary, is the sum of gcd(|dx|, |dy|) over the edges.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def polygon_area(pts):
    return 0.0

def orientation(pts):
    return 'anticlockwise'

def lattice_points(pts):
    return 0
`,
        solution: `import math

def _twice(pts):
    n = len(pts)
    return sum(pts[i][0] * pts[(i + 1) % n][1] - pts[(i + 1) % n][0] * pts[i][1] for i in range(n))

def polygon_area(pts):
    return abs(_twice(pts)) / 2

def orientation(pts):
    return 'anticlockwise' if _twice(pts) > 0 else 'clockwise'

def lattice_points(pts):
    n = len(pts)
    B = sum(math.gcd(abs(pts[(i + 1) % n][0] - pts[i][0]), abs(pts[(i + 1) % n][1] - pts[i][1])) for i in range(n))
    A2 = abs(_twice(pts))
    return (A2 - B + 2) // 2
`,
        tests: [
          { name: "square", code: `assert polygon_area([(0, 0), (4, 0), (4, 3), (0, 3)]) == 12 and polygon_area([(0, 3), (4, 3), (4, 0), (0, 0)]) == 12, 'Either direction gives the same area.'` },
          { name: "orientation", code: `assert orientation([(0, 0), (1, 0), (0, 1)]) == 'anticlockwise' and orientation([(0, 0), (0, 1), (1, 0)]) == 'clockwise', 'The signed sum is positive anticlockwise.'` },
          { name: "concave", code: `assert polygon_area([(0, 0), (4, 0), (4, 4), (2, 1), (0, 4)]) == 10, 'The shoelace formula handles concave polygons.'` },
          { name: "pick", code: `assert lattice_points([(0, 0), (4, 0), (4, 3), (0, 3)]) == 6 and lattice_points([(0, 0), (5, 0), (0, 5)]) == 6, 'A 4 × 3 rectangle has 3 × 2 interior points.'` },
          { name: "brute", code: `pts = [(0, 0), (7, 2), (3, 9), (-2, 4)]
def inside(px, py):
    s = []
    for i in range(4):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % 4]
        s.append((x2 - x1) * (py - y1) - (y2 - y1) * (px - x1))
    return all(v > 0 for v in s) or all(v < 0 for v in s)
assert lattice_points(pts) == sum(inside(x, y) for x in range(-3, 9) for y in range(-1, 11)), 'Pick agrees with counting.'` },
        ],
      },
    },
    {
      key: "midpoint-proof",
      rung: "prove",
      prompt: (
        <p>
          Let A be <M>{"(x_1, y_1)"}</M>, B be <M>{"(x_2, y_2)"}</M>, and M be the midpoint given by the formula. Use the
          distance formula to prove that <M>{"MA = MB = \\tfrac12 AB"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the coordinate differences from M to A as half of those from B to A, up to sign.",
          "Applies the distance formula to get MA = ½·√((x₂ − x₁)² + (y₂ − y₁)²).",
          "Does the same for MB.",
          "Concludes that both equal half of AB.",
        ],
      },
    },
    {
      key: "circumradius",
      rung: "stretch",
      prompt: <p>What is the radius of the circle passing through <M>{"(0, 0)"}</M>, <M>{"(6, 0)"}</M> and <M>{"(0, 8)"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
  ],

  teachBack:
    "Explain to a friend how the distance formula comes from Pythagoras, and why coordinates turn geometry questions into arithmetic.",

  glimpse: (
    <p>
      Next, distance, lines and slopes: the length of a segment and the equation of a line, both read off from
      coordinates. In Linear Algebra, points become lists of any number of coordinates and the distance formula works
      unchanged in every dimension. In Real Analysis, distance itself becomes the object of study, defined by a few rules
      that the distance formula obeys.
    </p>
  ),
};
