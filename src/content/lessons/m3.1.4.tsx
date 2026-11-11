import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { LinePlaneViz } from "@/components/viz/LinePlaneViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.1.4",
  minutes: 55,
  links: {
    requires: ["m3.1.2"],
    revisits: ["m0.6.2"],
    parallels: ["l1.3.2"],
    foreshadows: ["l2.3.1", "m10.1.3"],
  },

  puzzle: (
    <>
      <p>
        A linear classifier labels an email as spam when <M>{"2x_1 - x_2 + 2x_3 > 6"}</M>, where the x&rsquo;s are three
        features of the email. The emails exactly on the boundary form a flat surface in feature space.
      </p>
      <p>
        How far is that surface from the origin, the email with all features zero? And how would you describe the boundary to
        someone who wants to walk along it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A line can be described in two ways. You can say how to walk along it: start at p and move in direction d, giving the
        points <M>{"\\mathbf p + t\\mathbf d"}</M>. Or you can give a test a point must pass: <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M>,
        where n is perpendicular to the line. Drag t below: the walking point changes, but its dot product with n never does.
      </p>
      <LinePlaneViz />
    </>
  ),

  theory: (
    <>
      <Definition title="parametric and implicit forms">
        <p>
          A <strong>line</strong> through p with direction d ≠ 0 is the set of points <M>{"\\mathbf p + t\\mathbf d"}</M>,{" "}
          <M>{"t \\in \\mathbb R"}</M>. A <strong>plane</strong> in <M>{"\\mathbb R^3"}</M> through p is{" "}
          <M>{"\\mathbf p + s\\mathbf d_1 + t\\mathbf d_2"}</M> with two directions, neither a multiple of the other. A{" "}
          <strong>hyperplane</strong> in <M>{"\\mathbb R^n"}</M> is the set of x with <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M>{" "}
          for a fixed non-zero normal vector n.
        </p>
      </Definition>

      <Theorem title="the normal vector">
        <p>
          The coefficients of <M>{"a_1x_1 + \\dots + a_nx_n = c"}</M> form a vector <M>{"\\mathbf n = (a_1, \\dots, a_n)"}</M>{" "}
          perpendicular to the hyperplane: if x and y both lie on it, then <M>{"\\mathbf n \\cdot (\\mathbf x - \\mathbf y) = c - c = 0"}</M>.
        </p>
      </Theorem>

      <Theorem title="distance to a hyperplane">
        <p>The distance from a point q to the hyperplane <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M> is</p>
        <MD>{"\\frac{|\\mathbf n \\cdot \\mathbf q - c|}{\\|\\mathbf n\\|}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The closest point is reached by moving from q along the normal: <M>{"\\mathbf x = \\mathbf q - s\\,\\mathbf n"}</M>.
          It lies on the hyperplane when <M>{"\\mathbf n\\cdot\\mathbf q - s\\|\\mathbf n\\|^2 = c"}</M>, so{" "}
          <M>{"s = (\\mathbf n\\cdot\\mathbf q - c)/\\|\\mathbf n\\|^2"}</M>, and the distance moved is{" "}
          <M>{"|s|\\,\\|\\mathbf n\\|"}</M>. Any other point of the hyperplane is further, by Pythagoras, since the step along n
          is perpendicular to the hyperplane.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          The boundary is <M>{"2x_1 - x_2 + 2x_3 = 6"}</M> with normal n = (2, −1, 2) and <M>{"\\|\\mathbf n\\| = 3"}</M>. The
          origin is at distance |0 − 6|/3 = 2. To walk along the boundary, start at p = (3, 0, 0) and use directions
          perpendicular to n, such as (1, 2, 0) and (0, 2, 1).
        </p>
      </Example>

      <Example title="where a line meets a plane">
        <p>
          The line (1, 0, 2) + t(1, 1, −1) meets the plane x + y + z = 6 when (1 + t) + t + (2 − t) = 6, so t = 3 and the
          point is (4, 3, −1). Substituting the parametric form into the implicit one is the general method.
        </p>
      </Example>

      <Remark title="margins">
        <p>
          The signed distance <M>{"(\\mathbf n \\cdot \\mathbf q - c)/\\|\\mathbf n\\|"}</M> tells a linear classifier not just
          which side a point is on but how confidently. Support vector machines choose the boundary that keeps the closest
          training points as far away as possible.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "normal",
      rung: "check",
      prompt: <p>Which vector is perpendicular to the plane 2x − y + 3z = 6?</p>,
      answer: { kind: "choice", options: ["(2, −1, 3)", "(6, 6, 6)", "(1, 2, 0)", "(2, −1, 3, 6)"], correct: [0] },
    },
    {
      key: "on",
      rung: "check",
      prompt: <p>Does the point (1, 1, 1) lie on the plane x + y + z = 3?</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [0] },
    },
    {
      key: "origin",
      rung: "apply",
      prompt: <p>Find the distance from the origin to the plane 2x − y + 2z = 6.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "meet",
      rung: "apply",
      prompt: <p>The line (2, 1, 0) + t(1, 0, 2) meets the plane x + y + z = 9. Find t.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "dist",
      rung: "apply",
      prompt: <p>Find the distance from the point (3, 1, 4) to the plane x + 2y + 2z = 1.</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
n = np.array([2.0, -1.0, 2.0])
c = 6.0
q = np.array([5.0, 1.0, 3.0])
print((n @ q - c) / np.linalg.norm(n))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
n = np.array([1.0, 2.0, 2.0])
c = 9.0
q = np.array([0.0, 0.0, 0.0])
t = (c - n @ q) / (n @ n)
foot = q + t * n
print(foot, abs(n @ q - c) / np.linalg.norm(n))`}</Code>
          <p>The foot of the perpendicular from the origin to the plane x + 2y + 2z = 9, and its distance. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 2. 2.] 3.0", "[1. 2. 2.] 9.0", "[3. 3. 3.] 3.0", "[0.33 0.67 0.67] 3.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>distance(n, c, q)</C>, which returns the distance from the point q to the hyperplane n · x = c.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def distance(n, c, q):
    n, q = np.asarray(n, float), np.asarray(q, float)
    return n @ q - c
`,
        solution: `import numpy as np

def distance(n, c, q):
    n, q = np.asarray(n, float), np.asarray(q, float)
    return abs(n @ q - c) / np.linalg.norm(n)
`,
        tests: [
          { name: "origin", code: `assert abs(distance([2, -1, 2], 6, [0, 0, 0]) - 2) < 1e-9, 'The origin is 2 away from 2x − y + 2z = 6. Did you divide by the length of n?'` },
          { name: "other side", code: `assert abs(distance([1, 2, 2], 1, [3, 1, 4]) - 4) < 1e-9, 'Distance is never negative.'` },
          { name: "on the plane", code: `assert abs(distance([1, 1, 1], 3, [1, 1, 1])) < 1e-9, 'A point on the plane is at distance 0.'` },
          { name: "below", code: `assert abs(distance([0, 0, 1], 5, [7, 7, 1]) - 4) < 1e-9, 'Points on the other side are still a positive distance away.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>plane_through(p, q, r)</C>, the plane through three points in ℝ³ as (n, c) with n · x = c, where n is the unit normal (from the cross product, sign chosen so that its first non-zero entry is positive), raising <C>ValueError</C> if the points are collinear. Then write <C>line_plane(a, d, n, c)</C>, the intersection of the line a + td with the plane, or <C>None</C> if the line is parallel to it (|n · d| &lt; 1e−12), and <C>line_distance(a1, d1, a2, d2)</C>, the shortest distance between two lines in ℝ³ (handle parallel lines).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def plane_through(p, q, r):
    return (np.array([0.0, 0.0, 1.0]), 0.0)

def line_plane(a, d, n, c):
    return None

def line_distance(a1, d1, a2, d2):
    return 0.0
`,
        solution: `import numpy as np

def plane_through(p, q, r):
    p, q, r = (np.asarray(x, float) for x in (p, q, r))
    n = np.cross(q - p, r - p)
    L = np.linalg.norm(n)
    if L < 1e-12:
        raise ValueError('collinear')
    n = n / L
    first = n[np.nonzero(np.abs(n) > 1e-12)[0][0]]
    if first < 0:
        n = -n
    return (n, float(n @ p))

def line_plane(a, d, n, c):
    a, d, n = (np.asarray(x, float) for x in (a, d, n))
    nd = n @ d
    if abs(nd) < 1e-12:
        return None
    t = (c - n @ a) / nd
    return a + t * d

def line_distance(a1, d1, a2, d2):
    a1, d1, a2, d2 = (np.asarray(x, float) for x in (a1, d1, a2, d2))
    w = a2 - a1
    m = np.cross(d1, d2)
    if np.linalg.norm(m) < 1e-12:
        return float(np.linalg.norm(np.cross(w, d1)) / np.linalg.norm(d1))
    return float(abs(w @ m) / np.linalg.norm(m))
`,
        tests: [
          { name: "plane", code: `import numpy as np
n, c = plane_through((1, 0, 0), (0, 1, 0), (0, 0, 1))
assert np.allclose(n, np.ones(3) / 3 ** 0.5) and abs(c - 1 / 3 ** 0.5) < 1e-12, 'x + y + z = 1, normalised.'` },
          { name: "sign", code: `import numpy as np
n, c = plane_through((0, 0, 0), (0, 1, 0), (1, 0, 0))
assert np.allclose(n, [0, 0, 1]) and abs(c) < 1e-12, 'First non-zero entry positive.'` },
          { name: "collinear", code: `try:
    plane_through((0, 0, 0), (1, 1, 1), (2, 2, 2))
    ok = False
except ValueError:
    ok = True
assert ok, 'Three collinear points fix no plane.'` },
          { name: "intersect", code: `import numpy as np
x = line_plane((0, 0, 0), (1, 1, 1), (1, 2, 2), 10)
assert np.allclose(x, [2, 2, 2]) and line_plane((0, 0, 0), (2, -1, 0), (1, 2, 2), 10) is None, 'Parallel lines miss the plane.'` },
          { name: "skew", code: `assert abs(line_distance((0, 0, 0), (1, 0, 0), (0, 1, 5), (0, 1, 0)) - 5) < 1e-12 and abs(line_distance((0, 0, 0), (1, 1, 0), (0, 3, 0), (2, 2, 0)) - 3 / 2 ** 0.5) < 1e-12, 'Skew lines and parallel lines.'` },
        ],
      },
    },
    {
      key: "formula",
      rung: "prove",
      prompt: (
        <p>
          Prove that the distance from q to the hyperplane <M>{"\\mathbf n \\cdot \\mathbf x = c"}</M> is{" "}
          <M>{"|\\mathbf n \\cdot \\mathbf q - c| / \\|\\mathbf n\\|"}</M>. Show both that this distance is achieved and that no
          point of the hyperplane is closer.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds the point x₀ = q − s n on the hyperplane with s = (n·q − c)/‖n‖², and computes ‖q − x₀‖ = |n·q − c|/‖n‖.",
          "For any other point x on the hyperplane, notes that x − x₀ is perpendicular to n.",
          "Uses Pythagoras: ‖q − x‖² = ‖q − x₀‖² + ‖x₀ − x‖² ≥ ‖q − x₀‖².",
        ],
      },
    },
    {
      key: "dihedral",
      rung: "stretch",
      prompt: <p>Find the angle in degrees between the planes x + y = 1 and y + z = 1, measured as the angle between their normals.</p>,
      answer: { kind: "numeric", value: 60 },
    },
  ],

  teachBack:
    "Explain to a friend the two ways to describe a line or plane, why the coefficients of an equation give a perpendicular vector, and how to find the distance from a point to a plane.",

  glimpse: (
    <p>
      Next chapter: many planes at once. Solving a system of linear equations is finding where several hyperplanes meet.
      Statistical Machine Learning returns to hyperplanes and margins with support vector machines, and Convex Optimisation
      uses separating hyperplanes to prove its central theorems.
    </p>
  ),
};
