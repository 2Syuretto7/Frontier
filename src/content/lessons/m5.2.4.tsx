import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DirectionalDerivViz } from "@/components/viz/DirectionalDerivViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.2.4",
  minutes: 55,
  links: {
    requires: ["m5.2.3", "m5.1.2"],
    revisits: ["m3.1.2", "m2.5.3"],
    foreshadows: ["m5.5.3", "m5.5.5"],
  },

  puzzle: (
    <>
      <p>
        You stand on a hillside in fog, with an altimeter and a compass. You can measure the slope in any direction you face,
        but each measurement costs a step.
      </p>
      <p>How few measurements tell you the slope in every direction, and which way is steepest?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        For a function <M>{"f : \\mathbb R^n \\to \\mathbb R"}</M> the Jacobian is a single row. Stand it upright and it is the
        gradient <M>{"\\nabla f"}</M>. The slope in any unit direction u is the dot product <M>{"\\nabla f \\cdot u"}</M>, so n
        measurements, one per axis, give every direction.
      </p>
      <DirectionalDerivViz />
      <p>
        Turn the direction. The slope traces a cosine: largest along the gradient, zero along the level curve, most negative
        straight against the gradient. That is why gradient descent steps along <M>{"-\\nabla f"}</M>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="gradient and directional derivative">
        <p>
          For <M>{"f : \\mathbb R^n \\to \\mathbb R"}</M> differentiable at a, the gradient is the column vector{" "}
          <M>{"\\nabla f(a) = (\\partial_1 f(a), \\dots, \\partial_n f(a))^\\top"}</M>, the transpose of the 1 × n Jacobian. For a
          unit vector u, the directional derivative is
        </p>
        <MD>{"D_u f(a) = \\lim_{t \\to 0} \\frac{f(a + t u) - f(a)}{t}."}</MD>
      </Definition>

      <Theorem title="slopes are dot products with the gradient">
        <p>
          If f is differentiable at a, then <M>{"D_u f(a) = \\nabla f(a) \\cdot u"}</M> for every unit vector u. If{" "}
          <M>{"\\nabla f(a) \\ne 0"}</M>, the largest value is <M>{"\\|\\nabla f(a)\\|"}</M>, attained only at{" "}
          <M>{"u = \\nabla f(a) / \\|\\nabla f(a)\\|"}</M>, and the smallest is its negative.
        </p>
      </Theorem>
      <Proof>
        <p>
          Put h = tu in the definition of the derivative: <M>{"f(a + tu) - f(a) = t\\, \\nabla f(a) \\cdot u + o(t)"}</M>. Divide
          by t and let t → 0. For the maximum, Cauchy–Schwarz gives{" "}
          <M>{"\\nabla f \\cdot u \\le \\|\\nabla f\\| \\|u\\| = \\|\\nabla f\\|"}</M>, with equality exactly when u is a
          non-negative multiple of <M>{"\\nabla f"}</M>. Apply the same to <M>{"-u"}</M> for the minimum.
        </p>
      </Proof>

      <Theorem title="the gradient is perpendicular to level sets">
        <p>
          If <M>{"\\gamma(t)"}</M> is a differentiable curve lying in the level set <M>{"f = c"}</M> with{" "}
          <M>{"\\gamma(0) = a"}</M>, then <M>{"\\nabla f(a) \\cdot \\gamma'(0) = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"f(\\gamma(t)) = c"}</M> for all t, so its derivative is 0. By the definition of the derivative,{" "}
          <M>{"f(\\gamma(t)) - f(a) = \\nabla f(a) \\cdot (\\gamma(t) - a) + o(\\|\\gamma(t) - a\\|)"}</M>; divide by t and let t →
          0 to get <M>{"0 = \\nabla f(a) \\cdot \\gamma'(0)"}</M>. (This is the chain rule, the subject of the next lesson.)
        </p>
      </Proof>

      <Example title="a warning">
        <p>
          All directional derivatives can exist without f being differentiable. For{" "}
          <M>{"f(x, y) = x^2 y / (x^2 + y^2)"}</M> with f(0) = 0, <M>{"f(tu) = t u_1^2 u_2"}</M>, so{" "}
          <M>{"D_u f(0) = u_1^2 u_2"}</M>. That is not linear in u, so it is not <M>{"\\nabla f(0) \\cdot u"}</M>, and f is not
          differentiable at 0.
        </p>
      </Example>

      <Remark title="gradients in machine learning">
        <p>
          A loss is a function from millions of parameters to one number, so its derivative is a gradient with one entry per
          parameter. Gradient descent, <M>{"x \\leftarrow x - \\eta \\nabla f(x)"}</M>, moves in the locally steepest downhill
          direction. Too large a step overshoots in steep directions, as the second code exercise shows.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "up",
      rung: "check",
      prompt: <p>The gradient of f at a point is (3, 4). What is the largest directional derivative of f there?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 1e-9 },
    },
    {
      key: "level",
      rung: "check",
      prompt: <p>At a point where the gradient is non-zero, how does the gradient sit relative to the level curve through that point?</p>,
      answer: {
        kind: "choice",
        options: ["Perpendicular to it", "Tangent to it", "At 45° to it", "It depends on the function"],
        correct: [0],
      },
    },
    {
      key: "dir",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x, y, z) = xy + z^2"}</M>, find the directional derivative at (1, 2, 3) in the direction of (1, 2, 2).
          Remember to make the direction a unit vector.
        </p>
      ),
      answer: { kind: "numeric", value: 16 / 3, tolerance: 1e-6 },
    },
    {
      key: "steep",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x, y) = x^2 + 3y^2"}</M> at (1, 1), which unit direction decreases f fastest?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["(−1, −3)/√10", "(−1, −1)/√2", "(1, 3)/√10", "(−3, 1)/√10"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: v[0]**2 + 3 * v[1]**2
a = np.array([1.0, 0.6])
g = np.array([2.0, 3.6])
h = 1e-6
for u in [np.array([1.0, 0.0]), np.array([0.0, -1.0]), np.array([0.6, 0.8])]:
    num = (f(a + h * u) - f(a - h * u)) / (2 * h)
    print(round(num, 3), round(g @ u, 3))`}</Code>
          <p>Directional derivatives by finite differences and by the gradient. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 2.0\n-3.6 -3.6\n4.08 4.08",
          "2.0 2.0\n3.6 3.6\n4.08 4.08",
          "2.0 2.0\n-3.6 -3.6\n4.12 4.12",
          "1.0 2.0\n-1.8 -3.6\n2.04 4.08",
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
grad = lambda v: np.array([2 * v[0], 6 * v[1]])
x = np.array([1.0, 1.0])
for _ in range(3):
    x = x - 0.25 * grad(x)
print(x)`}</Code>
          <p>Three steps of gradient descent on <M>{"x^2 + 3y^2"}</M>. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[ 0.125 -0.125]", "[0.125 0.125]", "[ 0.125 -0.5  ]", "[0. 0.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grad(f, x, h=1e-6)</C>, the gradient of a scalar function f by central differences, as a 1-D array, and{" "}
          <C>directional(f, x, v)</C>, the directional derivative in the direction of the (not necessarily unit) vector v,
          computed as the dot product of <C>grad(f, x)</C> with v normalised.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def grad(f, x, h=1e-6):
    return np.zeros(len(x))

def directional(f, x, v):
    return 0.0
`,
        solution: `import numpy as np

def grad(f, x, h=1e-6):
    x = np.asarray(x, float)
    g = np.zeros(len(x))
    for i in range(len(x)):
        e = np.zeros(len(x))
        e[i] = h
        g[i] = (f(x + e) - f(x - e)) / (2 * h)
    return g

def directional(f, x, v):
    v = np.asarray(v, float)
    return float(grad(f, x) @ (v / np.linalg.norm(v)))
`,
        tests: [
          { name: "gradient", code: `import numpy as np
f = lambda v: v[0] * v[1] + v[2] ** 2
assert np.allclose(grad(f, [1.0, 2.0, 3.0]), [2, 1, 6], atol=1e-6)` },
          { name: "directional", code: `import numpy as np
f = lambda v: v[0] * v[1] + v[2] ** 2
assert abs(directional(f, [1.0, 2.0, 3.0], [1, 2, 2]) - 16 / 3) < 1e-6, 'Normalise v first.'
g = lambda v: v[0] ** 2 + 3 * v[1] ** 2
assert abs(directional(g, [1.0, 0.6], [-3.6, 2.0])) < 1e-6, 'Along the level curve the slope is 0.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>descend(grad_f, x0, lr, tol=1e-8, max_steps=10000)</C>. Starting at x0, repeat{" "}
          <M>{"x \\leftarrow x - \\text{lr} \\cdot \\nabla f(x)"}</M> until <M>{"\\|\\nabla f(x)\\| < \\text{tol}"}</M> or
          max_steps steps have been taken. Return the pair (x, number of steps taken). If the norm of x ever exceeds 1e6, stop and
          return (x, -1) to signal divergence.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def descend(grad_f, x0, lr, tol=1e-8, max_steps=10000):
    return np.asarray(x0, float), 0
`,
        solution: `import numpy as np

def descend(grad_f, x0, lr, tol=1e-8, max_steps=10000):
    x = np.asarray(x0, float)
    for k in range(max_steps):
        g = np.asarray(grad_f(x), float)
        if np.linalg.norm(g) < tol:
            return x, k
        x = x - lr * g
        if np.linalg.norm(x) > 1e6:
            return x, -1
    return x, max_steps
`,
        tests: [
          { name: "converges", code: `import numpy as np
gq = lambda v: np.array([2 * v[0], 6 * v[1]])
x, k = descend(gq, [1.0, 1.0], 0.1)
assert np.allclose(x, 0, atol=1e-8) and 0 < k < 1000, (x, k)
x, k = descend(gq, [0.0, 0.0], 0.1)
assert k == 0, 'Already at a stationary point: zero steps.'` },
          { name: "diverges", code: `import numpy as np
gq = lambda v: np.array([2 * v[0], 6 * v[1]])
x, k = descend(gq, [1.0, 1.0], 0.4)
assert k == -1, 'With lr = 0.4 the y-coordinate is multiplied by 1 - 2.4 = -1.4 each step.'
x, k = descend(gq, [1.0, 1.0], 0.01, max_steps=5)
assert k == 5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if f is differentiable at a with <M>{"\\nabla f(a) \\ne 0"}</M>, then among unit vectors u the directional
          derivative <M>{"D_u f(a)"}</M> is largest exactly for <M>{"u = \\nabla f(a) / \\|\\nabla f(a)\\|"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows D_u f(a) = ∇f(a) · u from the definition of the derivative with h = tu.",
          "Applies Cauchy–Schwarz: ∇f · u ≤ ‖∇f‖ ‖u‖ = ‖∇f‖.",
          "Checks that u = ∇f/‖∇f‖ attains ‖∇f‖.",
          "Argues uniqueness: equality in Cauchy–Schwarz needs u to be a non-negative multiple of ∇f, and the unit length fixes it.",
        ],
      },
    },
    {
      key: "notlin",
      rung: "stretch",
      prompt: (
        <p>
          For <M>{"f(x, y) = x^2 y / (x^2 + y^2)"}</M> with f(0) = 0, compute <M>{"D_u f(0)"}</M> for{" "}
          <M>{"u = (1, 1)/\\sqrt 2"}</M>. (The gradient at 0 is (0, 0), so a non-zero answer shows f is not differentiable there.)
        </p>
      ),
      answer: { kind: "numeric", value: 1 / (2 * Math.SQRT2), tolerance: 1e-3 },
    },
  ],

  teachBack:
    "Explain to a friend why knowing the n partial derivatives of a differentiable function gives its slope in every direction, and why the gradient points in the steepest uphill direction.",

  glimpse: (
    <p>
      The gradient's perpendicularity to level sets came from differentiating along a curve. That is a special case of the chain
      rule, which in several variables is a product of Jacobians: next.
    </p>
  ),
};
