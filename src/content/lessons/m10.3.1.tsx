import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LpVertexViz } from "@/components/viz/LpVertexViz";
import type { LessonContent } from "@/lib/types";

const LP = `import itertools
import numpy as np

def lp_vertices(A, b, tol=1e-9):
    V = []
    for i, j in itertools.combinations(range(len(A)), 2):
        M = A[[i, j]]
        if abs(np.linalg.det(M)) < tol:
            continue
        v = np.linalg.solve(M, b[[i, j]])
        if np.all(A @ v <= b + tol) and not any(np.allclose(v, u) for u in V):
            V.append(v)
    return V

def solve_lp_2d(c, A, b):
    V = lp_vertices(A, b)
    k = int(np.argmin([c @ v for v in V]))
    return V[k], float(c @ V[k])`;

const QP = `import numpy as np

def eq_qp(P, q, A, b):
    n, m = len(q), len(b)
    K = np.block([[P, A.T], [A, np.zeros((m, m))]])
    sol = np.linalg.solve(K, np.concatenate([-q, b]))
    return sol[:n], sol[n:]

def box_qp(P, q, lo, hi, steps=500):
    x = np.clip(np.zeros(len(q)), lo, hi)
    t = 1 / np.linalg.eigvalsh(P)[-1]
    for _ in range(steps):
        x = np.clip(x - t * (P @ x + q), lo, hi)
    return x`;

export const lesson: LessonContent = {
  id: "m10.3.1",
  minutes: 50,
  links: {
    requires: ["m10.2.2", "m10.1.2", "m5.5.5"],
    revisits: ["m10.1.1", "l2.3.1"],
    foreshadows: ["m10.4.3", "m10.8.1"],
  },

  puzzle: (
    <>
      <p>
        A factory makes two products from two scarce resources and wants the most profitable mix. There are infinitely
        many feasible mixes, yet the answer always turns out to be one of a handful of corner points, where some of the
        resource limits are exactly used up. Why corners? And what changes when the cost is quadratic, as in least
        squares or portfolio risk?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A linear cost has flat, parallel level sets. Sliding them across a polygon in the direction of decreasing cost, the
        last contact with the polygon is at a corner, or along a whole edge in a tie. A quadratic cost has curved level
        sets, so the last contact can be in the middle of an edge or even inside the region; then the answer is found by
        solving a linear system rather than by checking corners.
      </p>
      <LpVertexViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convex optimisation problem">
        <p>A problem in standard form is</p>
        <MD>{"\\text{minimise } f_0(x) \\quad \\text{subject to } f_i(x) \\leq 0,\\ i = 1, \\dots, m, \\quad Ax = b."}</MD>
        <p>
          It is convex when <M>{"f_0, \\dots, f_m"}</M> are convex. The feasible set is then convex, as an intersection of
          sublevel sets and an affine set, and so is the set of optimal points, a sublevel set of <M>{"f_0"}</M> intersected
          with it. Every local optimum is global by the same argument as for convex functions.
        </p>
      </Definition>

      <Definition title="linear and quadratic programs">
        <p>
          A linear program minimises <M>{"c^\\top x"}</M> subject to <M>{"Gx \\leq h"}</M> and <M>{"Ax = b"}</M>. A quadratic
          program minimises <M>{"\\frac12x^\\top Px + q^\\top x"}</M>, with <M>{"P \\succeq 0"}</M>, subject to the same kind
          of linear constraints. Least squares, the lasso (after splitting x into positive and negative parts) and the
          support vector machine are quadratic programs.
        </p>
      </Definition>

      <Theorem title="LP optima at vertices">
        <p>
          If the feasible set of a linear program is a bounded polyhedron, the minimum is attained at a vertex.
        </p>
      </Theorem>
      <Proof>
        <p>
          A bounded polyhedron is the convex hull of its finitely many vertices <M>{"v_1, \\dots, v_k"}</M> (Minkowski&apos;s
          theorem, which we take as known). Any feasible x is <M>{"\\sum_i\\theta_iv_i"}</M> with weights summing to 1, so{" "}
          <M>{"c^\\top x = \\sum_i\\theta_ic^\\top v_i \\geq \\min_ic^\\top v_i"}</M>. The vertex achieving that minimum is
          optimal.
        </p>
        <Code>{LP}</Code>
      </Proof>

      <Theorem title="equality-constrained quadratic programs">
        <p>
          With <M>{"P \\succeq 0"}</M>, a point x is optimal for minimising{" "}
          <M>{"\\frac12x^\\top Px + q^\\top x"}</M> subject to Ax = b exactly when there is ν with
        </p>
        <MD>{"\\begin{pmatrix} P & A^\\top \\\\ A & 0 \\end{pmatrix}\\begin{pmatrix} x \\\\ \\nu \\end{pmatrix} = \\begin{pmatrix} -q \\\\ b \\end{pmatrix}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Sufficiency: if the system holds, then for any feasible y, <M>{"A(y - x) = 0"}</M> and{" "}
          <M>{"\\nabla f(x)^\\top(y - x) = (Px + q)^\\top(y - x) = -\\nu^\\top A(y - x) = 0"}</M>, so the first-order condition
          gives <M>{"f(y) \\geq f(x)"}</M>. Necessity: if x is optimal, f cannot decrease along any direction d with Ad = 0,
          in either sign, so <M>{"\\nabla f(x)^\\top d = 0"}</M> for all d in the null space of A. Hence{" "}
          <M>{"\\nabla f(x)"}</M> lies in the orthogonal complement of that null space, the range of <M>{"A^\\top"}</M>, which
          is the existence of ν.
        </p>
        <Code>{QP}</Code>
      </Proof>

      <Remark title="solving them">
        <p>
          The code&apos;s LP has four vertices; minimising −x − y picks (1.6, 1.2) with value −2.8, and minimising −y picks
          (0, 2). Enumerating vertices is only feasible in tiny problems, since their number can grow exponentially; the
          simplex method walks from vertex to better vertex, and interior-point methods cut through the middle, both
          practical for millions of variables. The equality QP of projecting 0 onto x₁ + x₂ + x₃ = 3 gives (1, 1, 1) with
          ν = −1. With inequality constraints there is no single linear system; the box QP in the code is solved by
          projected gradient steps, which land on (1, 0) where one variable sits at each bound.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "max",
      rung: "check",
      prompt: <p>Maximise 2x + y subject to x + 2y ≤ 4, 3x + y ≤ 6, x ≥ 0, y ≥ 0. What is the optimal value?</p>,
      answer: { kind: "numeric", value: 4.4, tolerance: 0.0001 },
    },
    {
      key: "verts",
      rung: "check",
      prompt: <p>How many vertices does the cube [0, 1]³ have, the feasible set of an LP with six inequality constraints?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is a bounded LP always solved by some vertex of its feasible polyhedron?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every feasible point is a convex combination of vertices, and a linear cost of a convex combination is at least the smallest vertex cost",
          "The cost is convex, so its minimum is on the boundary",
          "The gradient of a linear cost is zero only at vertices",
          "The feasible set is a cone",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def lp_vertices(A, b, tol=1e-9):
    V = []
    for i, j in itertools.combinations(range(len(A)), 2):
        M = A[[i, j]]
        if abs(np.linalg.det(M)) < tol:
            continue
        v = np.linalg.solve(M, b[[i, j]])
        if np.all(A @ v <= b + tol) and not any(np.allclose(v, u) for u in V):
            V.append(v)
    return V

def solve_lp_2d(c, A, b):
    V = lp_vertices(A, b)
    k = int(np.argmin([c @ v for v in V]))
    return V[k], float(c @ V[k])

A = np.array([[1.0, 2.0], [3.0, 1.0], [-1.0, 0.0], [0.0, -1.0]]); b = np.array([4.0, 6.0, 0.0, 0.0])
print(len(lp_vertices(A, b)))
x, val = solve_lp_2d(np.array([-1.0, -1.0]), A, b)
print(np.round(x, 3), round(val, 3))
x, val = solve_lp_2d(np.array([0.0, -1.0]), A, b)
print(np.round(x, 3) + 0.0, round(val, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4\n[1.6 1.2] -2.8\n[0. 2.] -2.0", "6\n[1.6 1.2] -2.8\n[0. 2.] -2.0", "4\n[2. 0.] -2.0\n[0. 2.] -2.0", "4\n[1.6 1.2] -2.8\n[1.6 1.2] -1.2"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def eq_qp(P, q, A, b):
    n, m = len(q), len(b)
    K = np.block([[P, A.T], [A, np.zeros((m, m))]])
    sol = np.linalg.solve(K, np.concatenate([-q, b]))
    return sol[:n], sol[n:]

def box_qp(P, q, lo, hi, steps=500):
    x = np.clip(np.zeros(len(q)), lo, hi)
    t = 1 / np.linalg.eigvalsh(P)[-1]
    for _ in range(steps):
        x = np.clip(x - t * (P @ x + q), lo, hi)
    return x

x, nu = eq_qp(np.eye(3), np.zeros(3), np.ones((1, 3)), np.array([3.0]))
print(x, nu)
print(box_qp(np.diag([2.0, 2.0]), np.array([-6.0, 2.0]), 0.0, 1.0), np.round(box_qp(np.array([[2.0, 1.0], [1.0, 2.0]]), np.array([-3.0, 0.0]), 0.0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 1. 1.] [-1.]\n[1. 0.] [1. 0.]", "[1. 1. 1.] [1.]\n[1. 0.] [1. 0.]", "[1. 1. 1.] [-1.]\n[3. -1.] [1. 0.]", "[1. 1. 1.] [-1.]\n[1. 0.] [1. 1.]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a two-variable LP with constraints Ax ≤ b, write <C>lp_vertices(A, b, tol=1e-9)</C>, intersecting each pair of
          constraint lines and keeping the distinct feasible points, and <C>solve_lp_2d(c, A, b)</C>, returning the best
          vertex and its cost (assume the feasible set is bounded and nonempty).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def lp_vertices(A, b, tol=1e-9):
    return []

def solve_lp_2d(c, A, b):
    return np.zeros(2), 0.0
`,
        solution: LP,
        tests: [
          { name: "square", code: `A = np.array([[1.0, 0.0], [-1.0, 0.0], [0.0, 1.0], [0.0, -1.0], [1.0, 1.0]]); b = np.array([1.0, 1.0, 1.0, 1.0, 5.0])
assert len(lp_vertices(A, b)) == 4` },
          { name: "solve", code: `A = np.array([[1.0, 1.0], [-1.0, 0.0], [0.0, -1.0]]); b = np.array([2.0, 0.0, 0.0])
x, v = solve_lp_2d(np.array([1.0, -3.0]), A, b)
assert np.allclose(x, [0, 2]) and abs(v + 6) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eq_qp(P, q, A, b)</C>, solving the KKT system and returning (x, ν), and{" "}
          <C>box_qp(P, q, lo, hi, steps=500)</C>, minimising ½xᵀPx + qᵀx over the box by projected gradient with step 1/λ_max(P),
          starting from the projection of 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def eq_qp(P, q, A, b):
    return np.zeros(len(q)), np.zeros(len(b))

def box_qp(P, q, lo, hi, steps=500):
    return np.zeros(len(q))
`,
        solution: QP,
        tests: [
          { name: "eq", code: `x, nu = eq_qp(np.diag([2.0, 1.0]), np.array([0.0, -1.0]), np.array([[1.0, 1.0]]), np.array([1.0]))
assert np.allclose(x, [0.0, 1.0]) and np.allclose(nu, [0.0])` },
          { name: "box", code: `x = box_qp(np.diag([1.0, 4.0]), np.array([-0.5, 8.0]), -1.0, 1.0)
assert np.allclose(x, [0.5, -1.0], atol=1e-8)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let P be positive semidefinite. Suppose x and ν satisfy Px + q + Aᵀν = 0 and Ax = b. Prove that x minimises
          ½xᵀPx + qᵀx over all points satisfying Ax = b.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that f is convex because P is positive semidefinite, so f(y) ≥ f(x) + ∇f(x)ᵀ(y − x) with ∇f(x) = Px + q.",
          "For feasible y, uses A(y − x) = 0 and ∇f(x) = −Aᵀν to show ∇f(x)ᵀ(y − x) = −νᵀA(y − x) = 0.",
          "Concludes f(y) ≥ f(x) for every feasible y.",
        ],
      },
    },
    {
      key: "proj",
      rung: "stretch",
      prompt: <p>Minimise ½‖x‖² subject to x₁ + 2x₂ = 5. What is the optimal value?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes an optimisation problem convex, what linear and quadratic programs are, why a bounded LP is solved at a vertex, and how an equality-constrained QP reduces to one linear system.",

  glimpse: (
    <>
      <p>
        Some constraints are not linear but still convex, such as a norm bounded by a linear function or a matrix required
        to be positive semidefinite. Second-order cone and semidefinite programs handle them, and they include LPs and QPs
        as special cases.
      </p>
    </>
  ),
};
