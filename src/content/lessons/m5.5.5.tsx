import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LagrangeViz } from "@/components/viz/LagrangeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.5.5",
  minutes: 65,
  links: {
    requires: ["m5.5.3", "m5.2.4"],
    revisits: ["m5.1.2"],
    foreshadows: ["m5.6.2"],
  },

  puzzle: (
    <>
      <p>
        You must split a fixed budget between several projects to maximise the total return, or find the most uncertain
        probability distribution with a given mean. In each case the variables are tied by a constraint, so the gradient of the
        objective need not be zero at the best point.
      </p>
      <p>What replaces &ldquo;the gradient is zero&rdquo; when you are only allowed to move along a surface?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        On the constraint surface you can only move in tangent directions. At a best point, f cannot increase in any of them,
        so <M>{"\\nabla f"}</M> must be perpendicular to the surface. The surface&rsquo;s normal is <M>{"\\nabla g"}</M>. So the
        two gradients are parallel: <M>{"\\nabla f = \\lambda \\nabla g"}</M>.
      </p>
      <LagrangeViz />
      <p>
        Geometrically, the best level set of f just touches the constraint without crossing it. The factor λ is not a nuisance:
        it says how fast the best value improves as the constraint is relaxed.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="Lagrange multipliers">
        <p>
          Let f and <M>{"g_1, \\dots, g_k"}</M> be <M>{"C^1"}</M> on <M>{"\\mathbb R^n"}</M>, and let a be a local extremum of f
          on <M>{"\\{x : g_1(x) = \\dots = g_k(x) = 0\\}"}</M>. If <M>{"\\nabla g_1(a), \\dots, \\nabla g_k(a)"}</M> are linearly
          independent, there are numbers <M>{"\\lambda_1, \\dots, \\lambda_k"}</M> with
        </p>
        <MD>{"\\nabla f(a) = \\sum_{i=1}^k \\lambda_i \\nabla g_i(a)."}</MD>
        <p>
          Equivalently, (a, λ) is a critical point of the Lagrangian{" "}
          <M>{"\\mathcal L(x, \\lambda) = f(x) - \\sum_i \\lambda_i g_i(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) The independence condition and the implicit function theorem, in chapter 6, show that the constraint set is
          a smooth surface near a whose tangent directions are exactly the vectors v with <M>{"\\nabla g_i(a) \\cdot v = 0"}</M>{" "}
          for all i, and that every such v is the velocity <M>{"\\gamma'(0)"}</M> of a curve γ in the surface through a. Along
          such a curve, <M>{"f(\\gamma(t))"}</M> has a local extremum at t = 0, so{" "}
          <M>{"\\nabla f(a) \\cdot \\gamma'(0) = 0"}</M>. So <M>{"\\nabla f(a)"}</M> is perpendicular to every vector that is
          perpendicular to all the <M>{"\\nabla g_i(a)"}</M>, which means it lies in their span.
        </p>
      </Proof>

      <Example title="nearest point on a line">
        <p>
          Minimise <M>{"x^2 + y^2"}</M> subject to x + y = 1. Then <M>{"(2x, 2y) = \\lambda (1, 1)"}</M> gives x = y, so{" "}
          <M>{"x = y = \\tfrac12"}</M>, value ½, and λ = 1.
        </p>
      </Example>

      <Example title="equality-constrained quadratics">
        <p>
          Minimise <M>{"\\tfrac12 x^\\top A x - b^\\top x"}</M> subject to Cx = d. Setting the gradient of{" "}
          <M>{"\\tfrac12 x^\\top Ax - b^\\top x + \\mu^\\top(Cx - d)"}</M> to zero gives one linear system,
        </p>
        <MD>{"\\begin{pmatrix} A & C^\\top \\\\ C & 0 \\end{pmatrix} \\begin{pmatrix} x \\\\ \\mu \\end{pmatrix} = \\begin{pmatrix} b \\\\ d \\end{pmatrix},"}</MD>
        <p>the KKT system, which every constrained optimiser solves in some form.</p>
      </Example>

      <Remark title="what the multiplier means">
        <p>
          If the constraint is g(x) = c and <M>{"V(c)"}</M> is the optimal value, then under mild conditions{" "}
          <M>{"V'(c) = \\lambda"}</M>: the multiplier is the marginal value of relaxing the constraint, a &ldquo;shadow
          price&rdquo;. In the example above, <M>{"V(c) = c^2/2"}</M> and <M>{"V'(1) = 1 = \\lambda"}</M>. Inequality
          constraints lead to the KKT conditions, where multipliers must also be non-negative.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cond",
      rung: "check",
      prompt: <p>At a constrained extremum of f on g = 0, with <M>{"\\nabla g \\ne 0"}</M>, which must hold?</p>,
      answer: {
        kind: "choice",
        options: ["∇f is a multiple of ∇g", "∇f = 0", "∇f is perpendicular to ∇g", "∇g = 0"],
        correct: [0],
      },
    },
    {
      key: "circle",
      rung: "check",
      prompt: <p>What is the largest value of x + 2y on the unit circle? Give three decimal places.</p>,
      answer: { kind: "numeric", value: Math.sqrt(5), tolerance: 1e-3 },
    },
    {
      key: "line",
      rung: "apply",
      prompt: <p>Minimise <M>{"x^2 + 2y^2"}</M> subject to x + y = 3. What is the minimum value?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 1e-9 },
    },
    {
      key: "lam",
      rung: "apply",
      prompt: (
        <p>
          In the previous problem, with <M>{"\\nabla f = \\lambda \\nabla g"}</M> and g(x, y) = x + y − 3, what is λ?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.diag([2.0, 4.0])
b = np.zeros(2)
Cm = np.array([[1.0, 1.0]])
d = np.array([3.0])
K = np.block([[A, Cm.T], [Cm, np.zeros((1, 1))]])
sol = np.linalg.solve(K, np.concatenate([b, d]))
print(np.round(sol, 6))`}</Code>
          <p>A KKT system for minimising <M>{"x^2 + 2y^2"}</M> with x + y = 3. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 2.  1. -4.]", "[2. 1. 4.]", "[1. 2. -4.]", "[1.5 1.5 -3. ]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
t = np.linspace(0, 2 * np.pi, 3601)
vals = np.cos(t) + 2 * np.sin(t)
k = vals.argmax()
x, y = np.cos(t[k]), np.sin(t[k])
print(round(vals[k], 3), round(y / x, 2))`}</Code>
          <p>Brute force on the circle, and the slope of the optimal point. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.236 2.0", "2.236 0.5", "3.0 2.0", "2.0 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kkt_solve(A, b, Cm, d)</C>, which minimises <M>{"\\tfrac12 x^\\top Ax - b^\\top x"}</M> subject to{" "}
          <M>{"C x = d"}</M> by solving the KKT system from the lesson, and returns the pair (x, μ). Cm is k × n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kkt_solve(A, b, Cm, d):
    return np.zeros(len(b)), np.zeros(len(d))
`,
        solution: `import numpy as np

def kkt_solve(A, b, Cm, d):
    A, Cm = np.asarray(A, float), np.asarray(Cm, float)
    b, d = np.asarray(b, float), np.asarray(d, float)
    n, k = A.shape[0], Cm.shape[0]
    K = np.block([[A, Cm.T], [Cm, np.zeros((k, k))]])
    sol = np.linalg.solve(K, np.concatenate([b, d]))
    return sol[:n], sol[n:]
`,
        tests: [
          { name: "line", code: `import numpy as np
x, mu = kkt_solve(np.diag([2.0, 4.0]), [0.0, 0.0], [[1.0, 1.0]], [3.0])
assert np.allclose(x, [2, 1]) and np.allclose(mu, [-4])` },
          { name: "two constraints, optimality", code: `import numpy as np
rng = np.random.default_rng(0)
M = rng.standard_normal((4, 4))
A = M @ M.T + np.eye(4)
b = rng.standard_normal(4)
Cm = np.array([[1.0, 1.0, 1.0, 1.0], [1.0, -1.0, 0.0, 2.0]])
d = np.array([1.0, 0.5])
x, mu = kkt_solve(A, b, Cm, d)
assert np.allclose(Cm @ x, d), 'The solution must satisfy the constraints.'
f = lambda z: 0.5 * z @ A @ z - b @ z
N = np.linalg.svd(Cm)[2][2:]
for v in N:
    assert f(x + 0.01 * v) > f(x) and f(x - 0.01 * v) > f(x)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Maximise <M>{"\\sum_i a_i \\log x_i"}</M> subject to <M>{"\\sum_i x_i = B"}</M>, with all <M>{"a_i > 0"}</M>. Lagrange
          gives <M>{"a_i / x_i = \\lambda"}</M> for every i. Write <C>allocate(a, B)</C>, returning the optimal x as an array, and{" "}
          <C>shadow_price(a, B)</C>, returning λ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def allocate(a, B):
    return np.full(len(a), B / len(a))

def shadow_price(a, B):
    return 0.0
`,
        solution: `import numpy as np

def allocate(a, B):
    a = np.asarray(a, float)
    return B * a / a.sum()

def shadow_price(a, B):
    return float(np.sum(a) / B)
`,
        tests: [
          { name: "allocation", code: `import numpy as np
x = allocate([1.0, 2.0, 5.0], 16.0)
assert np.allclose(x, [2, 4, 10]) and abs(x.sum() - 16) < 1e-12
assert np.allclose(np.array([1.0, 2.0, 5.0]) / x, shadow_price([1.0, 2.0, 5.0], 16.0))` },
          { name: "optimal, and the price is the marginal value", code: `import numpy as np
a, B = np.array([1.0, 3.0, 2.0]), 12.0
V = lambda B: np.sum(a * np.log(allocate(a, B)))
x = allocate(a, B)
for v in ([1.0, -1.0, 0.0], [0.0, 1.0, -1.0]):
    assert np.sum(a * np.log(x + 0.01 * np.array(v))) < V(B)
assert abs((V(B + 1e-5) - V(B - 1e-5)) / 2e-5 - shadow_price(a, B)) < 1e-6` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let a be a local maximum of f on the curve <M>{"\\{g = 0\\}"}</M> in <M>{"\\mathbb R^2"}</M>, with{" "}
          <M>{"\\nabla g(a) \\ne 0"}</M>. Assuming the curve has a differentiable parametrisation γ(t) with γ(0) = a and{" "}
          <M>{"\\gamma'(0) \\ne 0"}</M>, prove that <M>{"\\nabla f(a) = \\lambda\\nabla g(a)"}</M> for some λ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates g(γ(t)) = 0 to get ∇g(a) · γ′(0) = 0.",
          "Notes f(γ(t)) has a local maximum at t = 0, so ∇f(a) · γ′(0) = 0 by the chain rule.",
          "Concludes both gradients are perpendicular to the non-zero vector γ′(0) in ℝ², so they are parallel; since ∇g(a) ≠ 0, ∇f(a) = λ∇g(a).",
        ],
      },
    },
    {
      key: "price",
      rung: "stretch",
      prompt: (
        <p>
          For min <M>{"x^2 + y^2"}</M> subject to x + y = c, the multiplier at c = 1 is λ = 1. Use it to estimate how much the
          minimum value increases when c changes from 1 to 1.1.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why, at the best point on a constraint surface, the gradient of the objective is a multiple of the gradient of the constraint, and what the multiplier measures.",

  glimpse: (
    <p>
      The proof relied on the constraint set being a smooth surface. Chapter 6 proves the theorems that guarantee it: the
      inverse and implicit function theorems.
    </p>
  ),
};
