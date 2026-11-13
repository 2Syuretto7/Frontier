import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContourViz } from "@/components/viz/ContourViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.1.2",
  minutes: 55,
  links: {
    requires: ["m5.1.1", "m2.3.1"],
    revisits: ["m3.7.5"],
    foreshadows: ["m5.2.4", "m5.5.3"],
  },

  puzzle: (
    <>
      <p>
        A loss depends on two weights. You cannot draw its graph on paper, since that needs three dimensions, but a hiker&rsquo;s
        map shows a mountain in two: it draws the curves of constant height.
      </p>
      <p>What can you read from such a map of a loss without ever computing a derivative?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A function that assigns a number to each point of the plane, or of <M>{"\\mathbb R^n"}</M>, is a scalar field. Its
        level sets, where it takes one fixed value, are curves in the plane and surfaces in space. Their shapes describe the
        landscape: closed rings around a minimum, crossing lines at a saddle, and close spacing where the function is steep.
      </p>
      <ContourViz />
      <p>
        Stretching one direction (x² + 4y²) squeezes the rings into ellipses, and the valley becomes narrow in y. Gradient
        descent on such a landscape zigzags across the narrow direction, which is why the shape of level sets matters for
        optimisation.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="scalar fields, level sets and sublevel sets">
        <p>
          A scalar field is a function <M>{"f : U \\to \\mathbb R"}</M> with U a subset of <M>{"\\mathbb R^n"}</M>. For a number
          c, the <em>level set</em> is <M>{"\\{x : f(x) = c\\}"}</M> and the <em>sublevel set</em> is{" "}
          <M>{"\\{x : f(x) \\le c\\}"}</M>. The graph <M>{"\\{(x, f(x))\\}"}</M> lives in <M>{"\\mathbb R^{n+1}"}</M>; the level
          sets live in <M>{"\\mathbb R^n"}</M>, which is why they are what we can draw.
        </p>
      </Definition>

      <Example title="quadratics">
        <p>
          For a symmetric positive definite matrix A, the level sets of <M>{"f(x) = x^\\top A x"}</M> are ellipses (ellipsoids in
          higher dimensions) whose axes point along the eigenvectors of A, with semi-axis <M>{"\\sqrt{c/\\lambda_i}"}</M> along
          the eigenvector of eigenvalue <M>{"\\lambda_i"}</M>. If A has eigenvalues of both signs, as for{" "}
          <M>{"x^2 - y^2"}</M>, the level sets are hyperbolas and the origin is a saddle.
        </p>
      </Example>

      <Definition title="limits and continuity">
        <p>
          <M>{"\\lim_{x \\to a} f(x) = L"}</M> means: for every ε &gt; 0 there is δ &gt; 0 with{" "}
          <M>{"|f(x) - L| < \\varepsilon"}</M> whenever <M>{"0 < \\|x - a\\| < \\delta"}</M>. f is continuous at a if the limit is f(a).
          Sums, products, quotients with non-zero denominator and compositions of continuous functions are continuous, so
          polynomials in the coordinates are continuous everywhere.
        </p>
      </Definition>

      <Theorem title="limits along paths">
        <p>
          If <M>{"f(x) \\to L"}</M> as <M>{"x \\to a"}</M>, then <M>{"f(\\gamma(t)) \\to L"}</M> along every path γ with{" "}
          <M>{"\\gamma(t) \\to a"}</M> and <M>{"\\gamma(t) \\ne a"}</M>. So two paths giving different limits prove that no limit
          exists.
        </p>
      </Theorem>
      <Proof>
        <p>
          Given ε, take δ from the definition. Since <M>{"\\gamma(t) \\to a"}</M>, eventually <M>{"0 < \\|\\gamma(t) - a\\| < \\delta"}</M>
          , and then <M>{"|f(\\gamma(t)) - L| < \\varepsilon"}</M>.
        </p>
      </Proof>

      <Example title="a function with no limit at the origin">
        <p>Let <M>{"f(x, y) = xy / (x^2 + y^2)"}</M> away from the origin. Along the line y = mx,</p>
        <MD>{"f(x, mx) = \\frac{m x^2}{(1 + m^2) x^2} = \\frac{m}{1 + m^2},"}</MD>
        <p>
          which is 0 along the x-axis and 1/2 along y = x. Different limits along different lines, so no limit. Every one of its
          level sets is a pair of lines through the origin.
        </p>
      </Example>

      <Remark title="paths are not enough to prove a limit">
        <p>
          Agreeing limits along every line do not prove a limit exists: <M>{"x^2 y / (x^4 + y^2)"}</M> tends to 0 along every
          line through the origin but equals 1/2 along the parabola <M>{"y = x^2"}</M>. To prove a limit, bound{" "}
          <M>{"|f(x) - L|"}</M> by something that tends to 0 with <M>{"\\|x - a\\|"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "value",
      rung: "check",
      prompt: <p>For <M>{"f(x, y) = x^2 + 4y^2"}</M>, what is f(1, 1)?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "ellipse",
      rung: "check",
      prompt: <p>What is the level set <M>{"x^2 + 4y^2 = 4"}</M>?</p>,
      answer: {
        kind: "choice",
        options: [
          "An ellipse with semi-axes 2 along x and 1 along y",
          "A circle of radius 2",
          "An ellipse with semi-axes 1 along x and 2 along y",
          "A pair of lines",
        ],
        correct: [0],
      },
    },
    {
      key: "line",
      rung: "apply",
      prompt: <p>What value does <M>{"xy/(x^2 + y^2)"}</M> take at every point of the line y = 2x, other than the origin?</p>,
      answer: { kind: "numeric", value: 0.4 },
    },
    {
      key: "limits",
      rung: "apply",
      prompt: <p>Which of these have a limit as (x, y) → (0, 0)?</p>,
      answer: {
        kind: "choice",
        options: ["x²y / (x² + y²)", "xy / (x² + y²)", "(x² − y²) / (x² + y²)", "sin(x² + y²) / (x² + y²)"],
        correct: [0, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
xs = np.linspace(-2, 2, 5)
X, Y = np.meshgrid(xs, xs)
F = X**2 + 4 * Y**2
print(F.shape, int((F <= 4).sum()), F[0, 0])`}</Code>
          <p>A scalar field on a grid, and a sublevel set. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(5, 5) 7 20.0", "(5, 5) 9 20.0", "(5,) 7 20.0", "(5, 5) 7 8.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`f = lambda x, y: x * y / (x**2 + y**2)
for t in [1e-1, 1e-3, 1e-6]:
    print(round(f(t, 0), 3), round(f(t, t), 3), round(f(t, -2 * t), 3))`}</Code>
          <p>Approaching the origin along three lines. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 0.5 -0.4\n0.0 0.5 -0.4\n0.0 0.5 -0.4",
          "0.0 0.5 -0.4\n0.0 0.05 -0.04\n0.0 0.0 -0.0",
          "0.0 0.0 0.0\n0.0 0.0 0.0\n0.0 0.0 0.0",
          "0.0 0.5 0.4\n0.0 0.5 0.4\n0.0 0.5 0.4",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The first step of drawing contours. Write <C>crossing_points(f, c, xs, ys)</C>: on the grid of points{" "}
          <C>(xs[j], ys[i])</C>, for every pair of horizontally or vertically adjacent points where{" "}
          <C>f - c</C> is negative at one end and not at the other, interpolate linearly along that edge to where{" "}
          <C>f - c</C> would be 0. Return the list of these (x, y) points, in any order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def crossing_points(f, c, xs, ys):
    return []
`,
        solution: `def crossing_points(f, c, xs, ys):
    v = [[f(x, y) - c for x in xs] for y in ys]
    out = []
    def edge(p, q, a, b):
        if (a < 0) != (b < 0):
            t = a / (a - b)
            out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
    for i, y in enumerate(ys):
        for j, x in enumerate(xs):
            if j + 1 < len(xs):
                edge((x, y), (xs[j + 1], y), v[i][j], v[i][j + 1])
            if i + 1 < len(ys):
                edge((x, y), (x, ys[i + 1]), v[i][j], v[i + 1][j])
    return out
`,
        tests: [
          { name: "circle", code: `import math
grid = [-1.5 + 0.1 * k for k in range(31)]
pts = crossing_points(lambda x, y: x * x + y * y, 1.0, grid, grid)
assert len(pts) > 40, f'Only {len(pts)} points found on the unit circle.'
assert all(abs(math.hypot(x, y) - 1) < 0.01 for x, y in pts), 'Every point should lie close to the circle x² + y² = 1.'
assert {(x > 0, y > 0) for x, y in pts} == {(True, True), (True, False), (False, True), (False, False)}` },
          { name: "linear is exact", code: `grid = [0.0, 0.5, 1.0, 1.5, 2.0]
pts = crossing_points(lambda x, y: x + 2 * y, 1.7, grid, grid)
assert pts and all(abs(x + 2 * y - 1.7) < 1e-12 for x, y in pts), 'For a linear f, interpolation lands exactly on the level set.'
assert len(pts) == 6, len(pts)
assert crossing_points(lambda x, y: x, 5.0, grid, grid) == []` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sublevel_area(f, c, lo, hi, n)</C>, which estimates the area of <M>{"\\{f \\le c\\}"}</M> inside the square{" "}
          <M>{"[\\text{lo}, \\text{hi}]^2"}</M> by splitting it into n × n equal cells and counting those whose midpoint satisfies{" "}
          f ≤ c. f accepts NumPy arrays, so evaluate it once on the whole grid of midpoints rather than in a loop.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sublevel_area(f, c, lo, hi, n):
    return 0.0
`,
        solution: `import numpy as np

def sublevel_area(f, c, lo, hi, n):
    h = (hi - lo) / n
    mids = lo + h * (np.arange(n) + 0.5)
    X, Y = np.meshgrid(mids, mids)
    return float(np.count_nonzero(f(X, Y) <= c) * h * h)
`,
        tests: [
          { name: "disc and ellipse", code: `import numpy as np
assert abs(sublevel_area(lambda x, y: x**2 + y**2, 1, -2, 2, 800) - np.pi) < 0.01
assert abs(sublevel_area(lambda x, y: x**2 + 4 * y**2, 4, -3, 3, 800) - 2 * np.pi) < 0.02
assert sublevel_area(lambda x, y: x**2 + y**2, -1, -2, 2, 50) == 0.0
assert abs(sublevel_area(lambda x, y: x + 0 * y, 0, -1, 1, 10) - 2.0) < 1e-12, 'Half of the square [−1, 1]² has x ≤ 0.'` },
          { name: "vectorised", code: `import time
t = time.time()
sublevel_area(lambda x, y: x**2 + y**2, 1, -2, 2, 1500)
assert time.time() - t < 5, 'Evaluate f on whole arrays, not point by point.'` },
        ],
      },
    },
    {
      key: "nolimit",
      rung: "prove",
      prompt: (
        <p>
          Prove that <M>{"xy/(x^2 + y^2)"}</M> has no limit at the origin, and that <M>{"x^2 y/(x^2 + y^2)"}</M> tends to 0 there.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "For the first, computes the value along two lines, such as 0 on the x-axis and 1/2 on y = x, and uses the path theorem to conclude no limit exists.",
          "For the second, bounds the absolute value by |y|, because x² ≤ x² + y².",
          "Concludes from |y| ≤ ‖(x, y)‖ → 0 (with an ε-δ or squeeze argument) that the limit is 0.",
        ],
      },
    },
    {
      key: "area",
      rung: "stretch",
      prompt: <p>What is the area of the sublevel set <M>{"\\{(x, y) : x^2 + 4y^2 \\le 4\\}"}</M>? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 6.283, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what the level sets of a function of two variables are, what their shapes tell you about the landscape, and why checking limits along straight lines can mislead.",

  glimpse: (
    <p>
      Level sets show where a function is constant; derivatives measure how fast it changes. Before derivatives, one more
      object: curves, the paths along which a point moves, such as the trajectory of the weights during training.
    </p>
  ),
};
