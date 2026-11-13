import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ImplicitBranchViz } from "@/components/viz/ImplicitBranchViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.6.2",
  minutes: 60,
  links: {
    requires: ["m5.6.1"],
    revisits: ["m2.4.5", "m5.1.2"],
    foreshadows: ["m5.6.3", "m5.5.5"],
  },

  puzzle: (
    <>
      <p>
        The equation <M>{"x^3 + y^3 = 6xy"}</M> cannot be solved for y in a usable formula. Yet its curve clearly has a slope
        at (3, 3), and near that point it is the graph of some function y = g(x).
      </p>
      <p>When does an equation secretly define a function, and how do you differentiate a function you cannot write down?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Linearise. Near a point on the curve, F(x, y) ≈ <M>{"F_x\\,dx + F_y\\,dy"}</M>, and staying on the curve means this is
        0. If <M>{"F_y \\ne 0"}</M> you can solve for dy in terms of dx, so y is locally a function of x with slope{" "}
        <M>{"-F_x / F_y"}</M>.
      </p>
      <ImplicitBranchViz />
      <p>
        Where <M>{"F_y = 0"}</M> the linearisation cannot be solved for dy, and indeed the curve may turn back on itself
        there. In many dimensions the same reasoning needs the matrix <M>{"D_yF"}</M> to be invertible.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="implicit function theorem">
        <p>
          Let <M>{"F : \\mathbb R^n \\times \\mathbb R^m \\to \\mathbb R^m"}</M> be <M>{"C^1"}</M>, with <M>{"F(a, b) = 0"}</M>{" "}
          and the m × m matrix <M>{"D_yF(a, b)"}</M> invertible. Then there are open sets U ∋ a and W ∋ b and a unique{" "}
          <M>{"C^1"}</M> function <M>{"g : U \\to W"}</M> with g(a) = b such that, for (x, y) in U × W,{" "}
          <M>{"F(x, y) = 0 \\iff y = g(x)"}</M>. Its derivative is
        </p>
        <MD>{"Dg(x) = -\\,D_yF(x, g(x))^{-1}\\, D_xF(x, g(x))."}</MD>
      </Theorem>
      <Proof>
        <p>
          Apply the inverse function theorem to <M>{"\\Phi(x, y) = (x, F(x, y))"}</M>. Its Jacobian is{" "}
          <M>{"\\begin{pmatrix} I & 0 \\\\ D_xF & D_yF \\end{pmatrix}"}</M>, with determinant <M>{"\\det D_yF \\ne 0"}</M>. So Φ
          has a <M>{"C^1"}</M> local inverse, which must have the form <M>{"(x, z) \\mapsto (x, h(x, z))"}</M>; set g(x) = h(x,
          0). Then <M>{"F(x, g(x)) = 0"}</M>. For the formula, differentiate this identity by the chain rule:{" "}
          <M>{"D_xF + D_yF\\, Dg = 0"}</M>, and solve for Dg.
        </p>
      </Proof>

      <Example title="the folium">
        <p>
          <M>{"F(x, y) = x^3 + y^3 - 6xy"}</M>. At (3, 3): <M>{"F_x = 3x^2 - 6y = 9"}</M>, <M>{"F_y = 3y^2 - 6x = 9"}</M>, so the
          curve is locally y = g(x) with g&prime;(3) = −1.
        </p>
      </Example>

      <Example title="level sets are surfaces">
        <p>
          A level set <M>{"\\{x \\in \\mathbb R^n : g(x) = c\\}"}</M> with <M>{"\\nabla g \\ne 0"}</M> is locally the graph of a
          function of n − 1 of the coordinates: a smooth hypersurface. Its tangent directions are the vectors perpendicular to{" "}
          <M>{"\\nabla g"}</M>. This is the fact the Lagrange multiplier proof needed.
        </p>
      </Example>

      <Remark title="tracing curves numerically">
        <p>
          To follow a curve F = 0, step along the tangent (perpendicular to <M>{"\\nabla F"}</M>), then pull back onto the curve
          with a few Newton steps. This predictor-corrector scheme is how continuation methods track solutions as a parameter
          changes, and the implicit function theorem is what guarantees the corrector has something to converge to.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cond",
      rung: "check",
      prompt: <p>For a single equation F(x, y) = 0, which condition at a point guarantees y is locally a function of x?</p>,
      answer: { kind: "choice", options: ["∂F/∂y ≠ 0", "∂F/∂x ≠ 0", "F(x, y) ≠ 0", "∇F = 0"], correct: [0] },
    },
    {
      key: "circle",
      rung: "check",
      prompt: <p>On the circle <M>{"x^2 + y^2 = 1"}</M>, what is dy/dx at (0.6, 0.8)?</p>,
      answer: { kind: "numeric", value: -0.75, tolerance: 1e-12 },
    },
    {
      key: "folium",
      rung: "apply",
      prompt: <p>For <M>{"x^3 + y^3 = 6xy"}</M>, what is dy/dx at the point (3, 3)?</p>,
      answer: { kind: "numeric", value: -1, tolerance: 1e-12 },
    },
    {
      key: "shape",
      rung: "apply",
      prompt: (
        <p>
          F maps <M>{"\\mathbb R^5 \\times \\mathbb R^2 \\to \\mathbb R^2"}</M> and defines y = g(x) with{" "}
          <M>{"x \\in \\mathbb R^5"}</M>. What shape is Dg?
        </p>
      ),
      answer: { kind: "choice", options: ["2 × 5", "5 × 2", "2 × 2", "5 × 5"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
F = lambda x, y: x ** 3 + y ** 3 - 6 * x * y
Fy = lambda x, y: 3 * y ** 2 - 6 * x
y = 3.0
for x in [3.1, 3.15, 3.2]:
    for _ in range(20):
        y = y - F(x, y) / Fy(x, y)
    print(x, round(y, 3), abs(F(x, y)) < 1e-9)`}</Code>
          <p>Solving for y on the folium as x moves away from 3, each time starting from the previous solution. The loop of the folium reaches only to x ≈ 3.17. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.1 2.862 True\n3.15 2.728 True\n3.2 -5.066 True",
          "3.1 2.862 True\n3.15 2.728 True\n3.2 2.594 True",
          "3.1 2.862 True\n3.15 2.728 True\n3.2 2.594 False",
          "3.1 2.9 True\n3.15 2.85 True\n3.2 2.8 True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
DxF = np.array([[1.0, 2.0], [0.0, 1.0]])
DyF = np.array([[2.0, 0.0], [1.0, 1.0]])
Dg = -np.linalg.solve(DyF, DxF)
print(Dg + 0.0)`}</Code>
          <p>The implicit Jacobian for a system of two equations. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[-0.5 -1. ]\n [ 0.5  0. ]]", "[[ 0.5  1. ]\n [-0.5  0. ]]", "[[-0.5 -1. ]\n [ 0.  -1. ]]", "[[-2. -4.]\n [ 1.  2.]]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>implicit_jacobian(DxF, DyF)</C>, returning <M>{"-D_yF^{-1} D_xF"}</M> by a linear solve, and{" "}
          <C>solve_y(F, DyF, x, y0, steps=30)</C>, which finds y with F(x, y) = 0 by Newton&rsquo;s method in y for the fixed x
          (F returns a 1-D array of length m and DyF the m × m matrix).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def implicit_jacobian(DxF, DyF):
    return np.zeros((1, 1))

def solve_y(F, DyF, x, y0, steps=30):
    return np.asarray(y0, float)
`,
        solution: `import numpy as np

def implicit_jacobian(DxF, DyF):
    return -np.linalg.solve(np.asarray(DyF, float), np.asarray(DxF, float))

def solve_y(F, DyF, x, y0, steps=30):
    y = np.asarray(y0, float)
    for _ in range(steps):
        y = y - np.linalg.solve(DyF(x, y), F(x, y))
    return y
`,
        tests: [
          { name: "Jacobian", code: `import numpy as np
D = implicit_jacobian([[1.0, 2.0], [0.0, 1.0]], [[2.0, 0.0], [1.0, 1.0]])
assert np.allclose(D, [[-0.5, -1.0], [0.5, 0.0]])
assert np.allclose(implicit_jacobian([[1.2]], [[1.6]]), [[-0.75]])` },
          { name: "a system", code: `import numpy as np
F = lambda x, y: np.array([y[0] ** 2 + y[1] - x[0], y[0] - y[1] ** 3 - x[1]])
DyF = lambda x, y: np.array([[2 * y[0], 1.0], [1.0, -3 * y[1] ** 2]])
DxF = lambda x, y: np.array([[-1.0, 0.0], [0.0, -1.0]])
x = np.array([2.0, 0.5])
y = solve_y(F, DyF, x, [1.0, 1.0])
assert np.allclose(F(x, y), 0, atol=1e-12)
num = np.array([(solve_y(F, DyF, x + 1e-6 * e, y) - solve_y(F, DyF, x - 1e-6 * e, y)) / 2e-6 for e in np.eye(2)]).T
assert np.allclose(implicit_jacobian(DxF(x, y), DyF(x, y)), num, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>trace_curve(F, grad, p0, h, n)</C> for a curve F(x, y) = 0 in the plane. From a point p on the curve, step
          a distance h along the unit tangent <M>{"(-F_y, F_x)/\\|\\nabla F\\|"}</M>, then correct with five Newton steps along
          the gradient, <M>{"p \\leftarrow p - F(p)\\, \\nabla F(p) / \\|\\nabla F(p)\\|^2"}</M>. Return an (n + 1) × 2 array of
          points starting with p0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def trace_curve(F, grad, p0, h, n):
    return np.array([p0])
`,
        solution: `import numpy as np

def trace_curve(F, grad, p0, h, n):
    p = np.asarray(p0, float)
    pts = [p]
    for _ in range(n):
        g = np.asarray(grad(p), float)
        p = p + h * np.array([-g[1], g[0]]) / np.linalg.norm(g)
        for _ in range(5):
            g = np.asarray(grad(p), float)
            p = p - F(p) * g / (g @ g)
        pts.append(p)
    return np.array(pts)
`,
        tests: [
          { name: "circle", code: `import numpy as np
F = lambda p: p[0] ** 2 + p[1] ** 2 - 1
grad = lambda p: np.array([2 * p[0], 2 * p[1]])
P = trace_curve(F, grad, [1.0, 0.0], 0.1, 70)
assert P.shape == (71, 2) and np.allclose(P[0], [1, 0])
assert max(abs(F(p)) for p in P) < 1e-12, 'Every point must be corrected back onto the curve.'
steps = np.linalg.norm(np.diff(P, axis=0), axis=1)
assert np.allclose(steps, 0.1, atol=1e-3)
assert P[16, 1] > 0.99, 'Anticlockwise from (1, 0) the curve rises first, and a quarter turn takes about 16 steps.'` },
          { name: "passes a turning point", code: `import numpy as np
F = lambda p: p[0] ** 3 + p[1] ** 3 - 6 * p[0] * p[1]
grad = lambda p: np.array([3 * p[0] ** 2 - 6 * p[1], 3 * p[1] ** 2 - 6 * p[0]])
P = trace_curve(F, grad, [3.0, 3.0], 0.05, 60)
assert max(abs(F(p)) for p in P) < 1e-8
assert P[:, 1].max() > 3.15 and P[-1, 0] < 1.0, 'The tracer passes the top of the loop, where the curve is not a graph x = h(y).'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Assuming the implicit function theorem gives a differentiable g with <M>{"F(x, g(x)) = 0"}</M>, derive{" "}
          <M>{"Dg = -D_yF^{-1} D_xF"}</M>. Explain where invertibility of <M>{"D_yF"}</M> is used.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates the identity F(x, g(x)) = 0 with the chain rule, treating x ↦ (x, g(x)) as a composition.",
          "Gets D_xF + D_yF · Dg = 0, with the shapes m × n, m × m and m × n.",
          "Multiplies by D_yF⁻¹, which exists by hypothesis, to solve for Dg.",
        ],
      },
    },
    {
      key: "sphere",
      rung: "stretch",
      prompt: (
        <p>
          Near (1/3, 2/3, 2/3) the sphere <M>{"x^2 + y^2 + z^2 = 1"}</M> is a graph z = g(x, y). What is{" "}
          <M>{"\\partial g/\\partial x"}</M> there?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 1e-12 },
    },
  ],

  teachBack:
    "Explain to a friend when an equation F(x, y) = 0 defines y as a function of x, and how to find that function's derivative without solving the equation.",

  glimpse: (
    <p>
      Many quantities in machine learning are defined as the solution of an equation: the optimum of an inner problem, the
      equilibrium of a layer. Next, differentiating through solvers with the implicit function theorem.
    </p>
  ),
};
