import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProjectSeparateViz } from "@/components/viz/ProjectSeparateViz";
import type { LessonContent } from "@/lib/types";

const PROJ = `import numpy as np

def proj_box(x, lo, hi):
    return np.clip(x, lo, hi)

def proj_ball(x, c, r):
    d = x - c
    n = np.linalg.norm(d)
    return x.copy() if n <= r else c + r * d / n

def separate_point(proj, x):
    p = proj(x)
    a = x - p
    if np.linalg.norm(a) < 1e-12:
        return None
    return a, float(a @ (p + x) / 2)`;

const ALT = `import numpy as np

def closest_pair(proj_C, proj_D, x0, iters=200):
    d = np.asarray(x0, dtype=float)
    for _ in range(iters):
        c = proj_C(d)
        d = proj_D(c)
    return proj_C(d), d

def separates(a, b, P, Q):
    return bool(np.all(P @ a < b) and np.all(Q @ a > b))`;

export const lesson: LessonContent = {
  id: "m10.1.3",
  minutes: 50,
  links: {
    requires: ["m10.1.2", "m6.6.1", "m8.9.1"],
    revisits: ["m3.1.4", "l2.3.1"],
    foreshadows: ["m10.4.2", "m10.8.1"],
  },

  puzzle: (
    <>
      <p>
        A linear classifier exists for two classes exactly when some hyperplane has one class on each side. Draw two
        clouds of points and it is easy to see when that fails: some point of one cloud sits inside the outline of the
        other. Is overlap of the convex hulls the only obstruction, so that two disjoint convex sets can always be split by
        a hyperplane? And how would you find that hyperplane?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take a point outside a convex set and find the nearest point of the set. The segment joining them is perpendicular
        to the set&apos;s edge there, and no part of the set can bulge back across the perpendicular line, because a bulge
        would contain an even nearer point. So the perpendicular bisector of that segment separates the point from the
        whole set.
      </p>
      <ProjectSeparateViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="projection onto a closed convex set">
        <p>
          Let C be nonempty, closed and convex. For every x there is a unique nearest point{" "}
          <M>{"p = P_C(x)"}</M> of C, and a point p of C is that nearest point exactly when
        </p>
        <MD>{"\\langle x - p,\\ z - p\\rangle \\leq 0 \\quad \\text{for all } z \\in C."}</MD>
      </Theorem>
      <Proof>
        <p>
          Existence: pick any <M>{"z_0 \\in C"}</M>; the nearest point, if any, lies in the closed bounded set{" "}
          <M>{"C \\cap \\{z : \\lVert z - x\\rVert \\leq \\lVert z_0 - x\\rVert\\}"}</M>, on which the continuous distance
          attains its minimum. Characterisation: for z in C and θ in [0, 1] the point{" "}
          <M>{"p + \\theta(z - p)"}</M> lies in C, and{" "}
          <M>{"\\lVert x - p - \\theta(z - p)\\rVert^2 = \\lVert x - p\\rVert^2 - 2\\theta\\langle x - p, z - p\\rangle + \\theta^2\\lVert z - p\\rVert^2"}</M>.
          If p is nearest this is at least its value at θ = 0, so the derivative at 0, <M>{"-2\\langle x - p, z - p\\rangle"}</M>,
          is nonnegative. Conversely, if the inequality holds, setting θ = 1 gives{" "}
          <M>{"\\lVert x - z\\rVert^2 \\geq \\lVert x - p\\rVert^2 + \\lVert z - p\\rVert^2"}</M>, so p is nearest, and
          strictly nearer than any z ≠ p, which is uniqueness.
        </p>
        <Code>{PROJ}</Code>
      </Proof>

      <Theorem title="separating a point from a convex set">
        <p>
          If C is nonempty, closed and convex and <M>{"x \\notin C"}</M>, then with <M>{"a = x - P_C(x) \\neq 0"}</M>,{" "}
          <M>{"a^\\top z \\leq a^\\top P_C(x) < a^\\top x"}</M> for all z in C. In particular the hyperplane{" "}
          <M>{"a^\\top z = a^\\top(P_C(x) + x)/2"}</M> strictly separates x from C.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first inequality is the characterisation, rearranged. The second is{" "}
          <M>{"a^\\top x - a^\\top P_C(x) = \\lVert a\\rVert^2 > 0"}</M>. The midpoint value lies strictly between them.
        </p>
      </Proof>

      <Theorem title="separating two convex sets">
        <p>
          If C and D are disjoint nonempty closed convex sets and one of them is bounded, there are a ≠ 0 and b with{" "}
          <M>{"a^\\top c < b < a^\\top d"}</M> for all c in C and d in D.
        </p>
      </Theorem>
      <Proof>
        <p>
          The set <M>{"D - C = \\{d - c\\}"}</M> is convex (an affine image of <M>{"D \\times C"}</M>), closed because one
          set is bounded, and does not contain 0 because the sets are disjoint. Separating 0 from it gives a with{" "}
          <M>{"a^\\top(d - c) \\geq \\lVert a\\rVert^2 > 0"}</M> for all c, d, so{" "}
          <M>{"\\sup_C a^\\top c < \\inf_D a^\\top d"}</M>, and any b strictly between works.
        </p>
        <Code>{ALT}</Code>
      </Proof>

      <Definition title="supporting hyperplane">
        <p>
          A hyperplane <M>{"a^\\top z = a^\\top p"}</M> with a ≠ 0 supports C at a boundary point p if{" "}
          <M>{"a^\\top z \\leq a^\\top p"}</M> for all z in C. Every boundary point of a convex set with nonempty interior has
          one: take points outside C converging to p, separate each, normalise the vectors a, and pass to a convergent
          subsequence.
        </p>
      </Definition>

      <Remark title="where this leads">
        <p>
          In the code, the projection onto the box [0, 1]² is a clip, the point (0.5, 0.5) inside gets no hyperplane, and (2,
          2) is separated by a = (1, 1), b = 3. Alternating projections between the box and the ball of radius 1 around (3,
          3) converge to the closest pair (1, 1) and (2.293, 2.293), at distance <M>{"2\\sqrt2 - 1 \\approx 1.8284"}</M>, and
          their perpendicular bisector separates the sets. The boundedness condition matters: the closed convex sets{" "}
          <M>{"\\{y \\leq 0\\}"}</M> and <M>{"\\{y \\geq 1/x, x > 0\\}"}</M> are disjoint, but no hyperplane separates them
          strictly. Separation is the engine of duality: Farkas&apos; lemma, Lagrange duality and the KKT conditions are all
          separation arguments in disguise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "box",
      rung: "check",
      prompt: <p>What is the distance from (3, −1) to the box [0, 1]²? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.2361, tolerance: 0.0001 },
    },
    {
      key: "ball",
      rung: "check",
      prompt: <p>What is the distance from (3, 4) to the closed unit ball centred at the origin?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "char",
      rung: "apply",
      prompt: <p>A point p of a closed convex set C is the projection of x onto C exactly when which condition holds?</p>,
      answer: {
        kind: "choice",
        options: [
          "⟨x − p, z − p⟩ ≤ 0 for every z in C",
          "⟨x − p, z − p⟩ ≥ 0 for every z in C",
          "x − p is orthogonal to p",
          "‖x − p‖ ≤ ‖x − z‖ for at least one other z in C",
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

def proj_box(x, lo, hi):
    return np.clip(x, lo, hi)

def proj_ball(x, c, r):
    d = x - c
    n = np.linalg.norm(d)
    return x.copy() if n <= r else c + r * d / n

def separate_point(proj, x):
    p = proj(x)
    a = x - p
    if np.linalg.norm(a) < 1e-12:
        return None
    return a, float(a @ (p + x) / 2)

box = lambda x: proj_box(x, np.array([0.0, 0.0]), np.array([1.0, 1.0]))
print(box(np.array([2.0, 0.5])), box(np.array([-1.0, 3.0])), separate_point(box, np.array([0.5, 0.5])))
a, b = separate_point(box, np.array([2.0, 2.0]))
print(a, b, a @ np.array([1.0, 1.0]) < b < a @ np.array([2.0, 2.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.  0.5] [0. 1.] None\n[1. 1.] 3.0 True", "[1.  0.5] [0. 1.] None\n[1. 1.] 2.0 True", "[1.  0.5] [-1.  1.] None\n[1. 1.] 3.0 True", "[2.  0.5] [0. 1.] None\n[1. 1.] 3.0 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def closest_pair(proj_C, proj_D, x0, iters=200):
    d = np.asarray(x0, dtype=float)
    for _ in range(iters):
        c = proj_C(d)
        d = proj_D(c)
    return proj_C(d), d

def separates(a, b, P, Q):
    return bool(np.all(P @ a < b) and np.all(Q @ a > b))

box = lambda x: np.clip(x, 0.0, 1.0)
ball = lambda x: x if np.linalg.norm(x - 3) <= 1 else 3 + (x - 3) / np.linalg.norm(x - 3)
c, d = closest_pair(box, ball, [0.0, 0.0])
print(np.round(c, 3), np.round(d, 3), round(float(np.linalg.norm(c - d)), 4))
a = d - c; b = float(a @ (c + d) / 2)
P = np.array([[0.0, 0.0], [1.0, 1.0], [1.0, 0.0]]); Q = np.array([[3.0, 3.0], [2.4, 2.4], [3.0, 2.0]])
print(separates(a, b, P, Q), separates(a, b, P, np.array([[1.1, 1.1]])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 1.] [2.293 2.293] 1.8284\nTrue False", "[1. 1.] [2.293 2.293] 1.8284\nTrue True", "[1. 1.] [2. 2.] 1.4142\nTrue False", "[0. 0.] [2.293 2.293] 3.2426\nTrue False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>proj_box(x, lo, hi)</C>, <C>proj_ball(x, c, r)</C> for the Euclidean ball, and{" "}
          <C>separate_point(proj, x)</C>, returning (a, b) for the hyperplane aᵀz = b through the midpoint of x and its
          projection with a = x − proj(x), or None if x is in the set.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def proj_box(x, lo, hi):
    return x

def proj_ball(x, c, r):
    return x

def separate_point(proj, x):
    return None
`,
        solution: PROJ,
        tests: [
          { name: "proj", code: `assert np.allclose(proj_box(np.array([2.0, -3.0, 0.5]), -1.0, 1.0), [1, -1, 0.5])
assert np.allclose(proj_ball(np.array([4.0, 5.0]), np.array([1.0, 1.0]), 2.5), [2.5, 3.0]) and np.allclose(proj_ball(np.array([1.5, 1.0]), np.array([1.0, 1.0]), 2.5), [1.5, 1.0])` },
          { name: "sep", code: `ball = lambda x: proj_ball(x, np.zeros(2), 1.0)
a, b = separate_point(ball, np.array([0.0, 3.0]))
assert np.allclose(a, [0, 2]) and abs(b - 4.0) < 1e-12 and separate_point(ball, np.array([0.3, 0.4])) is None` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>closest_pair(proj_C, proj_D, x0, iters=200)</C>, alternating projections starting from x0 (project onto
          C, then D, repeatedly) and returning the final pair (point of C, point of D), and <C>separates(a, b, P, Q)</C>,
          checking that every row p of P has aᵀp &lt; b and every row q of Q has aᵀq &gt; b.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def closest_pair(proj_C, proj_D, x0, iters=200):
    x = np.asarray(x0, dtype=float)
    return x, x

def separates(a, b, P, Q):
    return False
`,
        solution: ALT,
        tests: [
          { name: "pair", code: `C = lambda x: np.array([min(x[0], 0.0), x[1]]); D = lambda x: x if np.linalg.norm(x - [3, 0]) <= 1 else np.array([3.0, 0.0]) + (x - [3, 0]) / np.linalg.norm(x - [3, 0])
c, d = closest_pair(C, D, [5.0, 4.0])
assert abs(c[0]) < 1e-9 and np.linalg.norm(c - d) < 2.0 + 1e-6 and abs(np.linalg.norm(d - [3, 0]) - 1) < 1e-9` },
          { name: "sep", code: `a = np.array([1.0, 0.0])
assert separates(a, 0.5, np.array([[0.0, 5.0], [0.4, -2.0]]), np.array([[1.0, 0.0]])) and not separates(a, 0.5, np.array([[0.5, 0.0]]), np.array([[1.0, 0.0]]))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let C be a nonempty closed convex set, x a point not in C, and p its nearest point in C. Prove that ⟨x − p, z − p⟩
          ≤ 0 for every z in C, and deduce that a = x − p satisfies aᵀz &lt; aᵀx for every z in C.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Considers the points p + θ(z − p), θ ∈ [0, 1], which lie in C by convexity, and expands ‖x − p − θ(z − p)‖².",
          "Uses minimality of p to conclude that the derivative at θ = 0, −2⟨x − p, z − p⟩, is nonnegative (or argues with small θ directly).",
          "Deduces aᵀz ≤ aᵀp = aᵀx − ‖a‖² < aᵀx, using a ≠ 0 because x is not in C.",
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: <p>What is the distance from (2, 2, 2) to the halfspace x₁ + x₂ + x₃ ≤ 3? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 1.7321, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a closed convex set has a unique nearest point to any x, how the projection inequality characterises it, how this gives a hyperplane separating x from the set, how two disjoint convex sets are separated, and what a supporting hyperplane is.",

  glimpse: (
    <>
      <p>
        Convex sets are the stage; convex functions are the actors. A function is convex when the region above its graph is
        a convex set, and the next chapter turns every fact about sets into one about functions.
      </p>
    </>
  ),
};
