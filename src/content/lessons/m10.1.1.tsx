import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SegmentTestViz } from "@/components/viz/SegmentTestViz";
import type { LessonContent } from "@/lib/types";

const HULL = `import numpy as np

def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def convex_hull(points):
    pts = sorted(map(tuple, points))
    if len(pts) <= 2:
        return pts
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def in_hull(hull, x):
    n = len(hull)
    return all(cross(hull[i], hull[(i + 1) % n], x) >= -1e-12 for i in range(n))`;

const CONES = `import numpy as np

def in_soc(x, t):
    return bool(np.linalg.norm(x) <= t + 1e-12)

def in_psd(A, tol=1e-10):
    return bool(np.allclose(A, A.T) and np.linalg.eigvalsh(A).min() >= -tol)

def segment_test(member, a, b, trials=200, seed=0):
    rng = np.random.default_rng(seed)
    for th in rng.random(trials):
        if not member(th * a + (1 - th) * b):
            return False
    return True`;

export const lesson: LessonContent = {
  id: "m10.1.1",
  minutes: 45,
  links: {
    requires: ["m6.2.1", "m3.7.5", "m5.1.1"],
    revisits: ["m6.5.1"],
    foreshadows: ["m10.1.2", "m10.3.2", "m10.8.1"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent on a bumpy landscape can stall in a poor local minimum. On some problems, though, every local
        minimum is a global one, and an algorithm that only ever looks nearby is guaranteed to find the best answer. Much
        of that guarantee comes from the shape of the region you search over. What property must that region have?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A set is convex if you can walk in a straight line between any two of its points without leaving it. Discs,
        squares, half-planes and boxes pass; a crescent or a pair of separate islands fails. The test is local to pairs of
        points, but it rules out the dents and gaps in which a local search could get trapped.
      </p>
      <SegmentTestViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convex set and convex hull">
        <p>
          A set <M>{"C \\subseteq \\mathbb R^n"}</M> is convex if <M>{"\\theta x + (1 - \\theta)y \\in C"}</M> for all{" "}
          <M>{"x, y \\in C"}</M> and <M>{"\\theta \\in [0, 1]"}</M>. A convex combination of <M>{"x_1, \\dots, x_k"}</M> is{" "}
          <M>{"\\sum_i \\theta_ix_i"}</M> with <M>{"\\theta_i \\geq 0"}</M> and <M>{"\\sum_i \\theta_i = 1"}</M>. The convex
          hull of a set S is the set of all convex combinations of its points; it is the smallest convex set containing S.
        </p>
      </Definition>

      <Theorem title="convex sets contain all convex combinations">
        <p>If C is convex, every convex combination of finitely many points of C lies in C.</p>
      </Theorem>
      <Proof>
        <p>
          Induction on k. For k = 1 there is nothing to prove and k = 2 is the definition. For k ≥ 3, if{" "}
          <M>{"\\theta_k = 1"}</M> the combination is <M>{"x_k"}</M>. Otherwise write
        </p>
        <MD>{"\\sum_{i=1}^k\\theta_ix_i = (1 - \\theta_k)\\sum_{i=1}^{k-1}\\frac{\\theta_i}{1 - \\theta_k}x_i + \\theta_kx_k."}</MD>
        <p>
          The inner sum is a convex combination of k − 1 points, since its weights are nonnegative and sum to 1, so it lies
          in C by induction; the whole is then a combination of two points of C.
        </p>
        <Code>{HULL}</Code>
      </Proof>

      <Theorem title="norm balls are convex">
        <p>For any norm, the ball <M>{"\\{x : \\lVert x - c\\rVert \\leq r\\}"}</M> is convex.</p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"\\lVert x - c\\rVert \\leq r"}</M> and <M>{"\\lVert y - c\\rVert \\leq r"}</M>, then{" "}
          <M>{"\\theta x + (1 - \\theta)y - c = \\theta(x - c) + (1 - \\theta)(y - c)"}</M>, so by the triangle inequality and
          homogeneity its norm is at most <M>{"\\theta r + (1 - \\theta)r = r"}</M>.
        </p>
      </Proof>

      <Definition title="cones">
        <p>
          A set K is a cone if <M>{"\\lambda x \\in K"}</M> for every <M>{"x \\in K"}</M> and <M>{"\\lambda \\geq 0"}</M>, and
          a convex cone if also <M>{"\\theta_1x + \\theta_2y \\in K"}</M> for all <M>{"x, y \\in K"}</M> and{" "}
          <M>{"\\theta_1, \\theta_2 \\geq 0"}</M>. Three appear throughout this course: the nonnegative orthant{" "}
          <M>{"\\mathbb R^n_+"}</M>, the second-order cone <M>{"\\{(x, t) : \\lVert x\\rVert_2 \\leq t\\}"}</M>, and the cone{" "}
          <M>{"\\mathbb S^n_+"}</M> of positive semidefinite matrices.
        </p>
      </Definition>

      <Theorem title="the PSD cone is a convex cone">
        <p>If A and B are symmetric positive semidefinite and <M>{"\\theta_1, \\theta_2 \\geq 0"}</M>, so is <M>{"\\theta_1A + \\theta_2B"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The combination is symmetric, and for every v,{" "}
          <M>{"v^\\top(\\theta_1A + \\theta_2B)v = \\theta_1v^\\top Av + \\theta_2v^\\top Bv \\geq 0"}</M>. The second-order
          cone works the same way: <M>{"\\lVert \\theta_1x + \\theta_2y\\rVert \\leq \\theta_1\\lVert x\\rVert + \\theta_2\\lVert y\\rVert \\leq \\theta_1t + \\theta_2s"}</M>.
        </p>
        <Code>{CONES}</Code>
      </Proof>

      <Remark title="computing with convex sets">
        <p>
          The code finds the convex hull of points in the plane by the monotone chain method, in{" "}
          <M>{"O(n\\log n)"}</M> time: of the seven points, only the four corners of the square survive, and interior points
          like (1, 1) or the edge point (1, 0) are dropped. A point is inside a convex polygon exactly when it lies on the
          left of every edge taken anticlockwise. Carathéodory&apos;s theorem says that in <M>{"\\mathbb R^n"}</M> any point of
          a convex hull is a convex combination of at most n + 1 of the points. Random segment tests like those in the viz
          and the code can refute convexity, as for the two discs, but never prove it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "weights",
      rung: "check",
      prompt: <p>Write (1, 1) as a convex combination of (0, 0), (3, 0) and (0, 3). What is the weight on (0, 0)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "soc",
      rung: "check",
      prompt: <p>What is the smallest t for which ((1, 2, 2), t) lies in the second-order cone?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which of these sets is not convex?</p>,
      answer: {
        kind: "choice",
        options: [
          "The set of x with ‖x‖₂ ≥ 1",
          "The set of x with Ax ≤ b, componentwise",
          "The set of symmetric matrices X with X − I positive semidefinite",
          "The set of x with ‖x‖₁ ≤ 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def cross(o, a, b):
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def convex_hull(points):
    pts = sorted(map(tuple, points))
    if len(pts) <= 2:
        return pts
    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower[:-1] + upper[:-1]

def in_hull(hull, x):
    n = len(hull)
    return all(cross(hull[i], hull[(i + 1) % n], x) >= -1e-12 for i in range(n))

P = [(0, 0), (2, 0), (2, 2), (0, 2), (1, 1), (1, 0), (0.5, 1.5)]
H = convex_hull(P)
print(len(H), H[0], in_hull(H, (1.5, 0.5)), in_hull(H, (2.5, 1)))
print(in_hull(convex_hull([(0, 0), (3, 0), (0, 3)]), (1, 1)), in_hull(convex_hull([(0, 0), (3, 0), (0, 3)]), (2, 2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4 (0, 0) True False\nTrue False", "5 (0, 0) True False\nTrue False", "4 (0, 0) True True\nTrue False", "4 (2, 2) True False\nTrue True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def in_soc(x, t):
    return bool(np.linalg.norm(x) <= t + 1e-12)

def in_psd(A, tol=1e-10):
    return bool(np.allclose(A, A.T) and np.linalg.eigvalsh(A).min() >= -tol)

def segment_test(member, a, b, trials=200, seed=0):
    rng = np.random.default_rng(seed)
    for th in rng.random(trials):
        if not member(th * a + (1 - th) * b):
            return False
    return True

A = np.array([[2.0, 1.0], [1.0, 1.0]]); B = np.array([[1.0, 0.0], [0.0, -0.5]])
print(in_psd(A), in_psd(B), in_psd(0.3 * A + 0.7 * B), in_psd(A + B))
print(in_soc(np.array([3.0, 4.0]), 5.0), in_soc(np.array([3.0, 4.0]) + np.array([1.0, 0.0]), 5.0 + 1.0))
two = lambda p: np.linalg.norm(p - [-1, 0]) <= 0.6 or np.linalg.norm(p - [1, 0]) <= 0.6
print(segment_test(two, np.array([-1.0, 0.0]), np.array([1.0, 0.0])), segment_test(two, np.array([-1.0, 0.3]), np.array([-1.2, -0.2])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False False True\nTrue True\nFalse True", "True False True True\nTrue True\nFalse True", "True False False False\nTrue False\nFalse True", "True False False True\nTrue True\nTrue True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>convex_hull(points)</C>, returning the hull vertices of points in the plane as tuples in anticlockwise
          order starting from the lowest-then-leftmost sorted point (drop collinear points), and <C>in_hull(hull, x)</C>,
          which says whether x lies in the closed hull. A helper <C>cross(o, a, b)</C> is part of the solution.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cross(o, a, b):
    return 0.0

def convex_hull(points):
    return list(map(tuple, points))

def in_hull(hull, x):
    return True
`,
        solution: HULL,
        tests: [
          { name: "hull", code: `H = convex_hull([(0, 0), (4, 0), (2, 1), (4, 4), (0, 4), (2, 0), (1, 3)])
assert H == [(0, 0), (4, 0), (4, 4), (0, 4)]` },
          { name: "inside", code: `rng = np.random.default_rng(0); P = rng.normal(size=(40, 2)); H = convex_hull(P)
assert all(in_hull(H, p) for p in P) and not in_hull(H, P.max(axis=0) + 0.1) and len(H) < 40` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>in_soc(x, t)</C> for membership of (x, t) in the second-order cone, <C>in_psd(A, tol=1e-10)</C> for
          symmetric positive semidefiniteness, and <C>segment_test(member, a, b, trials=200, seed=0)</C>, which checks{" "}
          <C>member</C> at random points of the segment from a to b and returns False on the first failure.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def in_soc(x, t):
    return True

def in_psd(A, tol=1e-10):
    return True

def segment_test(member, a, b, trials=200, seed=0):
    return True
`,
        solution: CONES,
        tests: [
          { name: "cones", code: `assert in_soc(np.array([1.0, 2.0, 2.0]), 3.0) and not in_soc(np.array([1.0, 2.0, 2.0]), 2.9)
assert in_psd(np.array([[1.0, 1.0], [1.0, 1.0]])) and not in_psd(np.array([[1.0, 2.0], [2.0, 1.0]])) and not in_psd(np.array([[1.0, 0.5], [0.0, 1.0]]))` },
          { name: "segment", code: `ring = lambda p: 0.5 <= np.linalg.norm(p) <= 1
assert not segment_test(ring, np.array([0.8, 0.0]), np.array([-0.8, 0.0])) and segment_test(ring, np.array([0.8, 0.0]), np.array([0.9, 0.1]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let ‖·‖ be any norm on ℝⁿ. Prove that the ball {"{"}x : ‖x − c‖ ≤ r{"}"} is convex, and that the set{" "}
          {"{"}(x, t) : ‖x‖ ≤ t{"}"} is a convex cone.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "For the ball, writes θx + (1 − θ)y − c = θ(x − c) + (1 − θ)(y − c) and bounds its norm by θr + (1 − θ)r = r using the triangle inequality and homogeneity.",
          "For the cone, shows closure under scaling by λ ≥ 0, using ‖λx‖ = λ‖x‖ ≤ λt.",
          "Shows closure under nonnegative combinations: ‖θ₁x + θ₂y‖ ≤ θ₁‖x‖ + θ₂‖y‖ ≤ θ₁t + θ₂s.",
        ],
      },
    },
    {
      key: "cara",
      rung: "stretch",
      prompt: <p>By Carathéodory&apos;s theorem, at most how many of the given points are needed to write any point of the convex hull of a finite set in ℝ³ as a convex combination?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a set convex, why convex sets contain all convex combinations of their points, why norm balls and the positive semidefinite cone are convex, and what a cone is.",

  glimpse: (
    <>
      <p>
        Checking convexity from the definition is tedious. Most convex sets in practice are built from simple ones by
        intersections, affine maps and a few other operations that are known to preserve convexity, which turns the check
        into bookkeeping.
      </p>
    </>
  ),
};
