import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProjGradViz } from "@/components/viz/ProjGradViz";
import type { LessonContent } from "@/lib/types";

const PJ = `import numpy as np

def proj_ball(v, r):
    n = np.linalg.norm(v)
    return v if n <= r else v * (r / n)

def proj_halfspace(v, a, b):
    s = float(a @ v) - b
    return v if s <= 0 else v - s * a / float(a @ a)

def proj_affine(v, A, b):
    return v - A.T @ np.linalg.solve(A @ A.T, A @ v - b)`;

const PGD = `import numpy as np

def pgd(grad, proj, x0, t, iters):
    x = proj(np.array(x0, dtype=float))
    for _ in range(iters):
        x = proj(x - t * grad(x))
    return x

def first_order_gap(grad, x, corners):
    g = grad(x)
    return min(float(g @ (z - x)) for z in corners)`;

export const lesson: LessonContent = {
  id: "m10.8.1",
  minutes: 45,
  links: {
    requires: ["m10.7.2", "m10.1.3"],
    revisits: ["m10.5.3"],
    foreshadows: ["m10.8.2"],
  },

  puzzle: (
    <>
      <p>
        Probabilities must be nonnegative and sum to 1; pixel intensities lie between 0 and 1; a weight vector must have
        norm at most 1. Gradient descent ignores all of this and happily steps outside. The obvious repair is to snap back
        to the nearest allowed point after every step. Does snapping back preserve the guarantees of gradient descent, and
        how do you know when you have arrived, given that the gradient at a constrained minimum need not be zero?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        At a constrained minimum on the boundary, the gradient is not zero; it points straight out of the set, so every
        feasible direction goes uphill. A gradient step from such a point leaves the set along that outward direction, and
        projecting brings it straight back. So constrained minima are exactly the fixed points of step-then-project. And
        because projection never increases distances, it cannot undo the progress the gradient step made towards the
        minimiser.
      </p>
      <ProjGradViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="projection">
        <p>
          For a nonempty closed convex set C, every v has a unique nearest point <M>{"P_C(v)"}</M>, characterised by
        </p>
        <MD>{"(v - P_C(v))^\\top(z - P_C(v)) \\leq 0 \\quad\\text{for all } z \\in C,"}</MD>
        <p>
          and <M>{"\\|P_C(u) - P_C(v)\\| \\leq \\|u - v\\|"}</M>. It is the proximal operator of the indicator of C, so these
          are the results of the proximal lesson.
        </p>
      </Theorem>
      <Proof>
        <p>
          With h the indicator of C, <M>{"\\partial h(p)"}</M> is the normal cone{" "}
          <M>{"\\{a : a^\\top(z - p) \\leq 0 \\text{ for all } z \\in C\\}"}</M>, and the prox characterisation{" "}
          <M>{"v - p \\in \\partial h(p)"}</M> is the displayed inequality. Nonexpansiveness is that of the prox.
        </p>
        <Code>{PJ}</Code>
      </Proof>

      <Theorem title="optimality and fixed points">
        <p>
          For convex differentiable f, x* ∈ C minimises f over C if and only if{" "}
          <M>{"\\nabla f(x^*)^\\top(z - x^*) \\geq 0"}</M> for all z ∈ C, and if and only if{" "}
          <M>{"x^* = P_C(x^* - t\\nabla f(x^*))"}</M> for some (equivalently every) t &gt; 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the inequality holds, convexity gives <M>{"f(z) \\geq f(x^*) + \\nabla f(x^*)^\\top(z - x^*) \\geq f(x^*)"}</M>.
          Conversely, if some z has <M>{"\\nabla f(x^*)^\\top(z - x^*) < 0"}</M>, then f decreases along the feasible segment
          from x* to z. The projection characterisation with <M>{"v = x^* - t\\nabla f(x^*)"}</M> and{" "}
          <M>{"P_C(v) = x^*"}</M> reads <M>{"-t\\nabla f(x^*)^\\top(z - x^*) \\leq 0"}</M>, the same inequality.
        </p>
      </Proof>

      <Theorem title="convergence">
        <p>
          Projected gradient descent <M>{"x_{k+1} = P_C(x_k - t\\nabla f(x_k))"}</M> with t = 1/L, for convex L-smooth f,
          satisfies <M>{"f(x_k) - f^* \\leq L\\|x_0 - x^*\\|^2/(2k)"}</M>. If f is twice differentiable with{" "}
          <M>{"\\mu I \\preceq \\nabla^2 f \\preceq LI"}</M> and <M>{"0 < t \\leq 2/(\\mu + L)"}</M>, then{" "}
          <M>{"\\|x_{k+1} - x^*\\| \\leq q\\|x_k - x^*\\|"}</M> with <M>{"q = \\max(|1 - t\\mu|, |1 - tL|) < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first is the proximal gradient rate with h the indicator. For the second, x* is a fixed point, so by
          nonexpansiveness{" "}
          <M>{"\\|x_{k+1} - x^*\\| \\leq \\|(x_k - t\\nabla f(x_k)) - (x^* - t\\nabla f(x^*))\\|"}</M>. By the mean value theorem
          for the gradient, this difference is <M>{"(I - tH)(x_k - x^*)"}</M> with H an average of Hessians on the segment,
          whose eigenvalues lie in [μ, L], so its norm is at most <M>{"q\\|x_k - x^*\\|"}</M>.
        </p>
      </Proof>

      <Remark title="cheap projections and checking optimality">
        <p>
          The method is practical when projection is cheap: boxes (clip each coordinate), Euclidean balls (rescale),
          halfspaces and affine sets (closed-form corrections), and the simplex (sort, as in the last lesson). Projection
          onto an intersection of such sets is usually not cheap, which motivates the splitting methods of the coming
          lessons. Over a polytope, optimality can be checked at its vertices: the minimum of{" "}
          <M>{"\\nabla f(x)^\\top(z - x)"}</M> over the polytope is attained at a vertex, and it is 0 exactly at the
          optimum. In the code, PGD on the unit box towards (2, 0.5) reaches (1, 0.5), where this quantity is 0; at (0.5,
          0.5) it is −0.75, exposing a descent direction towards the vertex (1, 0) or (1, 1).
        </p>
        <Code>{PGD}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ball",
      rung: "check",
      prompt: <p>Project (6, 8) onto the Euclidean ball of radius 2 centred at 0. What is the first coordinate?</p>,
      answer: { kind: "numeric", value: 1.2, tolerance: 0.0001 },
    },
    {
      key: "q",
      rung: "check",
      prompt: <p>With μ = 1, L = 9 and t = 2/(μ + L), what is the contraction factor q of projected gradient descent?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.0001 },
    },
    {
      key: "opt",
      rung: "apply",
      prompt: <p>Which condition characterises a minimiser x* of a convex differentiable f over a closed convex set C?</p>,
      answer: {
        kind: "choice",
        options: ["∇f(x*)ᵀ(z − x*) ≥ 0 for every z ∈ C", "∇f(x*) = 0", "∇f(x*)ᵀ(z − x*) ≤ 0 for every z ∈ C", "x* lies on the boundary of C"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def proj_ball(v, r):
    n = np.linalg.norm(v)
    return v if n <= r else v * (r / n)

def proj_halfspace(v, a, b):
    s = float(a @ v) - b
    return v if s <= 0 else v - s * a / float(a @ a)

def proj_affine(v, A, b):
    return v - A.T @ np.linalg.solve(A @ A.T, A @ v - b)

print(np.round(proj_ball(np.array([3.0, 4.0]), 1.0), 4).tolist(), proj_ball(np.array([0.3, 0.4]), 1.0).tolist())
a = np.array([1.0, 1.0])
print(proj_halfspace(np.array([2.0, 1.0]), a, 1.0).tolist(), proj_affine(np.array([2.0, 1.0]), a.reshape(1, 2), np.array([1.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.6, 0.8] [0.3, 0.4]\n[1.0, 0.0] [1.0, 0.0]", "[0.6, 0.8] [0.6, 0.8]\n[1.0, 0.0] [1.0, 0.0]", "[0.6, 0.8] [0.3, 0.4]\n[2.0, 1.0] [1.0, 0.0]", "[3.0, 4.0] [0.3, 0.4]\n[1.0, 0.0] [1.0, 0.0]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def pgd(grad, proj, x0, t, iters):
    x = proj(np.array(x0, dtype=float))
    for _ in range(iters):
        x = proj(x - t * grad(x))
    return x

def first_order_gap(grad, x, corners):
    g = grad(x)
    return min(float(g @ (z - x)) for z in corners)

c = np.array([2.0, 0.5]); grad = lambda x: x - c; box = lambda v: np.clip(v, 0.0, 1.0)
x = pgd(grad, box, [0.0, 0.0], 0.5, 50)
corners = [np.array(p) for p in [(0.0, 0.0), (1.0, 0.0), (0.0, 1.0), (1.0, 1.0)]]
print(np.round(x, 4).tolist(), round(first_order_gap(grad, x, corners), 6) + 0.0, first_order_gap(grad, np.array([0.5, 0.5]), corners))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1.0, 0.5] 0.0 -0.75", "[1.0, 1.0] 0.0 -0.75", "[2.0, 0.5] 0.0 -0.75", "[1.0, 0.5] -0.75 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>proj_ball(v, r)</C>, <C>proj_halfspace(v, a, b)</C> for the set aᵀx ≤ b, and{" "}
          <C>proj_affine(v, A, b)</C> for the set Ax = b with A of full row rank.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def proj_ball(v, r):
    return v

def proj_halfspace(v, a, b):
    return v

def proj_affine(v, A, b):
    return v
`,
        solution: PJ,
        tests: [
          { name: "ball_half", code: `assert np.allclose(proj_ball(np.array([6.0, 8.0]), 2.0), [1.2, 1.6]) and np.allclose(proj_ball(np.array([0.1, 0.0]), 2.0), [0.1, 0.0])
a = np.array([1.0, 2.0])
p = proj_halfspace(np.array([3.0, 3.0]), a, 4.0)
assert abs(a @ p - 4.0) < 1e-12 and np.allclose(np.cross(np.append(p - [3.0, 3.0], 0), np.append(a, 0)), 0) and np.allclose(proj_halfspace(np.zeros(2), a, 4.0), 0)` },
          { name: "aff", code: `rng = np.random.default_rng(6); A = rng.normal(size=(2, 5)); b = rng.normal(size=2); v = rng.normal(size=5)
p = proj_affine(v, A, b)
z = p + (np.eye(5) - A.T @ np.linalg.solve(A @ A.T, A)) @ rng.normal(size=5)
assert np.allclose(A @ p, b) and np.linalg.norm(v - p) <= np.linalg.norm(v - z) + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pgd(grad, proj, x0, t, iters)</C>, which projects x0 first and then iterates, and{" "}
          <C>first_order_gap(grad, x, corners)</C>, the minimum of ∇f(x)ᵀ(z − x) over a list of vertices z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pgd(grad, proj, x0, t, iters):
    return np.array(x0, dtype=float)

def first_order_gap(grad, x, corners):
    return 0.0
`,
        solution: PGD,
        tests: [
          { name: "simplex", code: `def ps(v):
    u = np.sort(v)[::-1]; css = np.cumsum(u); k = np.nonzero(u - (css - 1) / np.arange(1, len(v) + 1) > 0)[0][-1]
    return np.maximum(v - (css[k] - 1) / (k + 1), 0.0)
c = np.array([0.9, 0.6, -0.3]); x = pgd(lambda x: x - c, ps, [5.0, 5.0, 5.0], 0.5, 100)
assert np.allclose(x, [0.65, 0.35, 0.0]) and abs(first_order_gap(lambda x: x - c, x, list(np.eye(3)))) < 1e-9` },
          { name: "gap", code: `g = lambda x: np.array([1.0, -2.0])
assert abs(first_order_gap(g, np.array([0.5, 0.5]), [np.array(p) for p in [(0.0, 0.0), (1.0, 0.0), (0.0, 1.0)]]) - (-1.5)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose the map x ↦ x − t∇f(x) is a contraction with factor q &lt; 1 and x* minimises f over the closed convex set
          C. Prove that projected gradient descent satisfies ‖x_(k+1) − x*‖ ≤ q‖x_k − x*‖.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows x* = P_C(x* − t∇f(x*)), from the optimality condition and the characterisation of projection.",
          "Uses nonexpansiveness of P_C to bound ‖x_(k+1) − x*‖ by ‖(x_k − t∇f(x_k)) − (x* − t∇f(x*))‖.",
          "Applies the contraction property to conclude ‖x_(k+1) − x*‖ ≤ q‖x_k − x*‖.",
        ],
      },
    },
    {
      key: "box",
      rung: "stretch",
      prompt: <p>Minimise ½‖x − c‖² over the box [0, 1]² with c = (3, −1). What is the optimal value?</p>,
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why projected gradient descent steps then projects, why its fixed points are exactly the constrained minimisers, how nonexpansiveness of projection preserves the convergence rates of gradient descent, and which constraint sets have cheap projections.",

  glimpse: (
    <>
      <p>
        Some sets, like the nuclear-norm ball or the set of permutation-like matrices, are expensive to project onto but
        easy to optimise a linear function over. Frank-Wolfe replaces projection by that linear step, and stays inside the
        set without ever projecting.
      </p>
    </>
  ),
};
