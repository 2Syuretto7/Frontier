import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HalfspaceViz } from "@/components/viz/HalfspaceViz";
import type { LessonContent } from "@/lib/types";

const AFF = `import numpy as np

def in_poly(A, b, x, tol=1e-12):
    return bool(np.all(A @ x <= b + tol))

def ellipsoid_boundary(P, c, n=8):
    t = 2 * np.pi * np.arange(n) / n
    return c + np.stack([np.cos(t), np.sin(t)], axis=1) @ P.T

def in_ellipsoid(P, c, x):
    u = np.linalg.solve(P, x - c)
    return bool(u @ u <= 1 + 1e-12)`;

const PERSP = `import numpy as np

def in_spectrahedron(A0, As, x, tol=1e-10):
    M = A0 + sum(xi * Ai for xi, Ai in zip(x, As))
    return bool(np.linalg.eigvalsh(M).min() >= -tol)

def perspective(points):
    P = np.asarray(points, dtype=float)
    assert np.all(P[:, -1] > 0)
    return P[:, :-1] / P[:, -1:]`;

export const lesson: LessonContent = {
  id: "m10.1.2",
  minutes: 45,
  links: {
    requires: ["m10.1.1", "m3.7.5"],
    revisits: ["m6.6.1"],
    foreshadows: ["m10.2.3", "m10.3.2"],
  },

  puzzle: (
    <>
      <p>
        Is the set of 2-by-2 symmetric matrices [[1 + a, b], [b, 1 − a]] that are positive semidefinite, viewed as a set
        of points (a, b), convex? You could test pairs of points for ever. Or you could notice how the set is built: an
        affine map followed by a convex cone. Which ways of building sets keep convexity, so that you never have to go back
        to the definition?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Intersecting convex sets can only cut away, never create a dent, because a segment that stays in every set stays in
        their common part. Linear maps send segments to segments, so they carry convex sets to convex sets, forwards and
        backwards. Unions are different: two convex pieces side by side can leave a gap between them.
      </p>
      <HalfspaceViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="intersections">
        <p>The intersection of any collection of convex sets, finite or infinite, is convex.</p>
      </Theorem>
      <Proof>
        <p>
          If x and y lie in the intersection, they lie in every set of the collection, and so does each point of the
          segment between them, since each set is convex. So the segment lies in the intersection.
        </p>
      </Proof>
      <p>
        A halfspace <M>{"\\{x : a^\\top x \\leq b\\}"}</M> is convex, so a polyhedron{" "}
        <M>{"\\{x : Ax \\leq b\\}"}</M>, an intersection of finitely many halfspaces, is convex. The PSD cone is the
        intersection over all v of the halfspaces <M>{"\\{X : v^\\top Xv \\geq 0\\}"}</M>, which gives a second proof that
        it is convex.
      </p>

      <Theorem title="affine images and preimages">
        <p>
          Let <M>{"f(x) = Ax + c"}</M>. If C is convex, so are its image <M>{"f(C)"}</M> and, for convex D, the preimage{" "}
          <M>{"f^{-1}(D) = \\{x : f(x) \\in D\\}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The key identity is <M>{"f(\\theta x + (1 - \\theta)y) = \\theta f(x) + (1 - \\theta)f(y)"}</M>, since the
          constant c gets total weight 1. For the image, take <M>{"f(x), f(y)"}</M> with x, y in C: their combination is{" "}
          <M>{"f"}</M> of a point of C. For the preimage, if <M>{"f(x), f(y) \\in D"}</M> then{" "}
          <M>{"f(\\theta x + (1 - \\theta)y) \\in D"}</M> by convexity of D.
        </p>
        <Code>{AFF}</Code>
      </Proof>
      <p>
        An ellipsoid <M>{"\\{c + Pu : \\lVert u\\rVert_2 \\leq 1\\}"}</M> is the image of the unit ball. A spectrahedron{" "}
        <M>{"\\{x : A_0 + x_1A_1 + \\dots + x_mA_m \\succeq 0\\}"}</M> is the preimage of the PSD cone under an affine map.
      </p>

      <Theorem title="the perspective map">
        <p>
          The perspective <M>{"P(x, t) = x/t"}</M>, defined for t &gt; 0, maps convex sets to convex sets, because it maps
          each segment onto a segment.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take (x, t) and (y, s) with t, s &gt; 0 and a point <M>{"\\theta(x, t) + (1 - \\theta)(y, s)"}</M> between them.
          Its image is
        </p>
        <MD>{"\\frac{\\theta x + (1 - \\theta)y}{\\theta t + (1 - \\theta)s} = \\mu\\frac{x}{t} + (1 - \\mu)\\frac{y}{s}, \\qquad \\mu = \\frac{\\theta t}{\\theta t + (1 - \\theta)s} \\in [0, 1],"}</MD>
        <p>
          a point of the segment between the images, and as θ runs from 0 to 1 so does μ. So if C is convex and two points
          of P(C) are given, the segment between them is the image of a segment in C.
        </p>
        <Code>{PERSP}</Code>
      </Proof>

      <Remark title="examples in the code">
        <p>
          The spectrahedron with <M>{"A_0 = I"}</M>, <M>{"A_1 = \\mathrm{diag}(1, -1)"}</M> and{" "}
          <M>{"A_2 = \\begin{pmatrix}0 & 1\\\\ 1 & 0\\end{pmatrix}"}</M> is the matrix of the puzzle, whose determinant is{" "}
          <M>{"1 - a^2 - b^2"}</M>: it is the unit disc, so (0.6, 0.8) is on its boundary and (0.8, 0.8) is outside. Three
          collinear points in <M>{"\\mathbb R^3"}</M> go under the perspective to (1, 0), (1.5, 1) and (1.6667, 1.3333),
          again collinear. Other operations that preserve convexity include Minkowski sums{" "}
          <M>{"C + D = \\{x + y\\}"}</M> and linear-fractional maps, which are perspectives composed with affine maps.
          Unions do not, as the viz shows, which is why a constraint like &quot;x = 0 or x ≥ 1&quot; makes a problem hard.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "area",
      rung: "check",
      prompt: <p>What is the area of the polyhedron x ≥ 0, y ≥ 0, x + y ≤ 2?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "ell",
      rung: "check",
      prompt: <p>The unit disc is mapped by x ↦ Px with P = diag(2, 0.5). What is the area of the resulting ellipse? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 3.1416, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which operation can turn convex sets into a set that is not convex?</p>,
      answer: {
        kind: "choice",
        options: ["Taking the union of two convex sets", "Taking the intersection of infinitely many convex sets", "Applying an affine map", "Taking the preimage under an affine map"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def in_poly(A, b, x, tol=1e-12):
    return bool(np.all(A @ x <= b + tol))

def ellipsoid_boundary(P, c, n=8):
    t = 2 * np.pi * np.arange(n) / n
    return c + np.stack([np.cos(t), np.sin(t)], axis=1) @ P.T

def in_ellipsoid(P, c, x):
    u = np.linalg.solve(P, x - c)
    return bool(u @ u <= 1 + 1e-12)

A = np.array([[1.0, 0.0], [0.0, 1.0], [-1.0, -1.0]]); b = np.array([1.0, 1.0, 0.0])
print(in_poly(A, b, np.array([0.5, 0.5])), in_poly(A, b, np.array([-1.0, 0.5])), in_poly(A, b, np.array([1.0, -1.0])))
P = np.array([[2.0, 0.0], [0.0, 0.5]]); c = np.array([1.0, 0.0])
E = ellipsoid_boundary(P, c, 4)
print(np.round(E, 2)[:, 0] + 0.0, in_ellipsoid(P, c, np.array([2.5, 0.3])), in_ellipsoid(P, c, np.array([1.0, 0.6])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False True\n[ 3.  1. -1.  1.] True False", "True False False\n[ 3.  1. -1.  1.] True False", "True False True\n[ 2.  0. -2.  0.] True False", "True False True\n[ 3.  1. -1.  1.] False True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def in_spectrahedron(A0, As, x, tol=1e-10):
    M = A0 + sum(xi * Ai for xi, Ai in zip(x, As))
    return bool(np.linalg.eigvalsh(M).min() >= -tol)

def perspective(points):
    P = np.asarray(points, dtype=float)
    assert np.all(P[:, -1] > 0)
    return P[:, :-1] / P[:, -1:]

A0 = np.eye(2); As = [np.array([[1.0, 0.0], [0.0, -1.0]]), np.array([[0.0, 1.0], [1.0, 0.0]])]
print(in_spectrahedron(A0, As, [0.0, 0.0]), in_spectrahedron(A0, As, [0.6, 0.8]), in_spectrahedron(A0, As, [0.8, 0.8]))
seg = np.array([[1.0, 0.0, 1.0], [3.0, 2.0, 2.0], [5.0, 4.0, 3.0]])
print(perspective(seg).round(4).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False\n[[1.0, 0.0], [1.5, 1.0], [1.6667, 1.3333]]", "True False False\n[[1.0, 0.0], [1.5, 1.0], [1.6667, 1.3333]]", "True True True\n[[1.0, 0.0], [1.5, 1.0], [1.6667, 1.3333]]", "True True False\n[[1.0, 0.0], [3.0, 2.0], [5.0, 4.0]]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>in_poly(A, b, x, tol=1e-12)</C> for membership of {"{"}x : Ax ≤ b{"}"},{" "}
          <C>ellipsoid_boundary(P, c, n=8)</C>, returning the images under x = c + Pu of n equally spaced points of the
          unit circle starting at angle 0, and <C>in_ellipsoid(P, c, x)</C> for invertible P.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_poly(A, b, x, tol=1e-12):
    return True

def ellipsoid_boundary(P, c, n=8):
    return np.zeros((n, 2))

def in_ellipsoid(P, c, x):
    return True
`,
        solution: AFF,
        tests: [
          { name: "poly", code: `A = np.array([[-1.0, 0.0], [0.0, -1.0], [1.0, 1.0]]); b = np.array([0.0, 0.0, 2.0])
assert in_poly(A, b, np.array([1.0, 1.0])) and not in_poly(A, b, np.array([1.5, 1.0])) and not in_poly(A, b, np.array([-0.1, 0.5]))` },
          { name: "ell", code: `P = np.array([[1.0, 1.0], [0.0, 2.0]]); c = np.array([0.0, 1.0])
E = ellipsoid_boundary(P, c, 4)
assert np.allclose(E, [[1, 1], [1, 3], [-1, 1], [-1, -1]]) and in_ellipsoid(P, c, np.array([0.5, 1.5])) and not in_ellipsoid(P, c, np.array([2.0, 1.0]))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>in_spectrahedron(A0, As, x, tol=1e-10)</C>, testing whether A0 + Σ xᵢAᵢ is positive semidefinite, and{" "}
          <C>perspective(points)</C>, mapping each row (x, t) with t &gt; 0 to x/t.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_spectrahedron(A0, As, x, tol=1e-10):
    return True

def perspective(points):
    return np.asarray(points, dtype=float)
`,
        solution: PERSP,
        tests: [
          { name: "lmi", code: `A0 = np.diag([1.0, 2.0]); As = [np.diag([-1.0, 0.0]), np.diag([0.0, -1.0])]
assert in_spectrahedron(A0, As, [1.0, 2.0]) and not in_spectrahedron(A0, As, [1.1, 0.0]) and in_spectrahedron(A0, As, [-5.0, -5.0])` },
          { name: "persp", code: `Q = perspective([[2.0, 4.0, 2.0], [3.0, 0.0, 0.5]])
assert np.allclose(Q, [[1, 2], [6, 0]])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A₀, A₁, …, A_m be symmetric n-by-n matrices. Prove that {"{"}x ∈ ℝᵐ : A₀ + x₁A₁ + ⋯ + x_mA_m is positive
          semidefinite{"}"} is convex.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Identifies the set as the preimage of the PSD cone under the affine map F(x) = A₀ + Σ xᵢAᵢ, or works directly with this map.",
          "Uses F(θx + (1 − θ)y) = θF(x) + (1 − θ)F(y).",
          "Concludes using convexity of the PSD cone (for example vᵀ(θF(x) + (1 − θ)F(y))v ≥ 0 for every v).",
        ],
      },
    },
    {
      key: "mu",
      rung: "stretch",
      prompt: <p>Under the perspective map, the midpoint (θ = 0.5) of the segment from (x, 1) to (y, 3) maps to μx + (1 − μ)(y/3). What is μ?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why intersections, affine images and affine preimages of convex sets are convex, how polyhedra, ellipsoids and spectrahedra arise this way, why the perspective map preserves convexity, and why unions do not.",

  glimpse: (
    <>
      <p>
        Two disjoint convex sets can always be pulled apart by a hyperplane, something that fails for sets with dents. This
        separation fact is behind duality, optimality conditions and much of what follows.
      </p>
    </>
  ),
};
