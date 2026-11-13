import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JacobianOrderViz } from "@/components/viz/JacobianOrderViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.2.5",
  minutes: 60,
  links: {
    requires: ["m5.2.3", "m5.2.4"],
    revisits: ["m2.4.3"],
    foreshadows: ["m5.3.2", "m5.3.3", "m5.3.5"],
  },

  puzzle: (
    <>
      <p>
        A neural network is a long composition: layer after layer, each a function of the last. Its loss is one number that
        depends on every parameter through all those layers.
      </p>
      <p>
        In one variable, the derivative of a composition is a product of derivatives. What is it here, when each layer changes
        the dimension, and does the order in which you multiply matter?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each map, near a point, is approximately linear. A composition of approximately linear maps is approximately the
        composition of the linear maps, which is the product of their matrices. So the Jacobian of a composition is the product
        of the Jacobians, in the same order as the maps, each evaluated at the right point.
      </p>
      <JacobianOrderViz />
      <p>
        The product is the same in either order, but not the work. When the final output is a single number, multiplying from
        the output end keeps every intermediate result a thin row. That observation is the whole reason training large networks
        is affordable, and chapter 3 builds on it.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="chain rule">
        <p>
          If f is differentiable at a and g is differentiable at f(a), then <M>{"g \\circ f"}</M> is differentiable at a and
        </p>
        <MD>{"D(g \\circ f)(a) = Dg(f(a)) \\, Df(a), \\qquad J_{g \\circ f}(a) = J_g(f(a)) \\, J_f(a)."}</MD>
        <p>
          With <M>{"f : \\mathbb R^n \\to \\mathbb R^m"}</M> and <M>{"g : \\mathbb R^m \\to \\mathbb R^p"}</M>, the shapes are{" "}
          <M>{"(p \\times m)(m \\times n) = p \\times n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write b = f(a), A = Df(a), B = Dg(b). Then <M>{"f(a + h) = b + Ah + r(h)"}</M> with{" "}
          <M>{"\\|r(h)\\| / \\|h\\| \\to 0"}</M>, and <M>{"g(b + k) = g(b) + Bk + s(k)"}</M> with{" "}
          <M>{"\\|s(k)\\| / \\|k\\| \\to 0"}</M>. Put k = Ah + r(h):
        </p>
        <MD>{"g(f(a + h)) = g(b) + BAh + B r(h) + s(Ah + r(h))."}</MD>
        <p>
          The term <M>{"\\|B r(h)\\| \\le \\|B\\| \\, \\|r(h)\\|"}</M> is <M>{"o(\\|h\\|)"}</M>. For the last term,{" "}
          <M>{"\\|k\\| \\le (\\|A\\| + 1)\\|h\\|"}</M> for small h, so{" "}
          <M>{"\\|s(k)\\| / \\|h\\| \\le (\\|A\\| + 1) \\|s(k)\\| / \\|k\\| \\to 0"}</M> (and it is 0 when k = 0). So the
          remainder is <M>{"o(\\|h\\|)"}</M> and the derivative is BA.
        </p>
      </Proof>

      <Example title="the chain rule entry by entry">
        <p>
          Reading off one entry of the product gives the familiar form: if <M>{"z = g(y)"}</M> and <M>{"y = f(x)"}</M>,
        </p>
        <MD>{"\\frac{\\partial z_i}{\\partial x_j} = \\sum_{k=1}^m \\frac{\\partial z_i}{\\partial y_k} \\frac{\\partial y_k}{\\partial x_j}."}</MD>
        <p>
          Each path from <M>{"x_j"}</M> through some <M>{"y_k"}</M> to <M>{"z_i"}</M> contributes a product, and the paths add.
          For instance, along a curve <M>{"\\gamma(t)"}</M>, <M>{"\\frac{d}{dt} g(\\gamma(t)) = \\nabla g(\\gamma(t)) \\cdot \\gamma'(t)"}</M>.
        </p>
      </Example>

      <Example title="polar coordinates">
        <p>
          With <M>{"x = r\\cos\\theta"}</M>, <M>{"y = r \\sin\\theta"}</M> and a function g(x, y),{" "}
          <M>{"\\partial g / \\partial r = g_x \\cos\\theta + g_y \\sin\\theta"}</M> and{" "}
          <M>{"\\partial g/\\partial\\theta = -g_x r\\sin\\theta + g_y r\\cos\\theta"}</M>: the row{" "}
          <M>{"(g_x, g_y)"}</M> times the polar Jacobian.
        </p>
      </Example>

      <Remark title="order of multiplication">
        <p>
          For a chain of K maps the Jacobian is <M>{"J_K \\cdots J_2 J_1"}</M>. Multiplying from the right (input side) is{" "}
          <em>forward mode</em>; from the left (output side) is <em>reverse mode</em>. When the final output is a scalar, reverse
          mode only ever multiplies a row by a matrix, and its cost is about that of evaluating the function a few times,
          however many inputs there are.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: (
        <p>
          f maps <M>{"\\mathbb R^3 \\to \\mathbb R^2"}</M> and g maps <M>{"\\mathbb R^2 \\to \\mathbb R^4"}</M>. What shape is the
          Jacobian of <M>{"g \\circ f"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["4 × 3", "3 × 4", "2 × 2", "4 × 2"], correct: [0] },
    },
    {
      key: "curve",
      rung: "check",
      prompt: (
        <p>
          For <M>{"g(x, y) = x^2 y"}</M> and <M>{"\\gamma(t) = (t, t^2)"}</M>, what is{" "}
          <M>{"\\frac{d}{dt} g(\\gamma(t))"}</M> at t = 1?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
    {
      key: "polar",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"g(x, y) = x^2 + y^2"}</M> in polar coordinates, compute <M>{"\\partial g / \\partial r"}</M> at r = 3,
          θ = 1 by the chain rule.
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 1e-9 },
    },
    {
      key: "order",
      rung: "apply",
      prompt: <p>Which expression is the Jacobian of <M>{"g \\circ f"}</M> at a?</p>,
      answer: {
        kind: "choice",
        options: ["J_g(f(a)) J_f(a)", "J_f(a) J_g(f(a))", "J_g(a) J_f(a)", "J_g(f(a)) + J_f(a)"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda v: np.array([v[0] + v[1], v[0] * v[1]])
Jf = lambda v: np.array([[1.0, 1.0], [v[1], v[0]]])
g = lambda w: np.array([w[0] ** 2 - w[1]])
Jg = lambda w: np.array([[2 * w[0], -1.0]])
a = np.array([1.0, 2.0])
print(Jg(f(a)) @ Jf(a), Jg(a) @ Jf(a))`}</Code>
          <p>The chain rule done right and done wrong. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[4. 5.]] [[0. 1.]]", "[[4. 5.]] [[4. 5.]]", "[[6. 6.]] [[0. 1.]]", "[[5. 4.]] [[1. 0.]]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
J1 = np.ones((4, 3))
J2 = np.ones((2, 4))
J3 = np.ones((1, 2))
P = J3 @ J2 @ J1
print(P.shape, P[0, 0])`}</Code>
          <p>A product of three Jacobians. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(1, 3) 8.0", "(3, 1) 8.0", "(1, 3) 24.0", "(4, 1) 6.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chain_jacobian(fs, Js, x)</C>. fs is a list of functions applied in order, and Js the matching list of
          functions returning their Jacobians. Push x through the chain, and multiply each new Jacobian, evaluated at the input
          of its own map, on the left of the running product. Return the pair (final output, Jacobian of the whole chain at x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def chain_jacobian(fs, Js, x):
    return x, np.eye(len(x))
`,
        solution: `import numpy as np

def chain_jacobian(fs, Js, x):
    x = np.asarray(x, float)
    J = np.eye(len(x))
    for f, Jf in zip(fs, Js):
        J = np.asarray(Jf(x), float) @ J
        x = np.asarray(f(x), float)
    return x, J
`,
        tests: [
          { name: "two maps", code: `import numpy as np
f = lambda v: np.array([v[0] + v[1], v[0] * v[1]])
Jf = lambda v: np.array([[1.0, 1.0], [v[1], v[0]]])
g = lambda w: np.array([w[0] ** 2 - w[1]])
Jg = lambda w: np.array([[2 * w[0], -1.0]])
y, J = chain_jacobian([f, g], [Jf, Jg], [1.0, 2.0])
assert np.allclose(y, [7.0]) and np.allclose(J, [[4.0, 5.0]]), (y, J)` },
          { name: "matches finite differences", code: `import numpy as np
A = np.array([[1.0, 2.0, 0.0], [0.5, -1.0, 3.0]])
fs = [lambda v: A @ v, np.tanh, lambda v: np.array([v @ v])]
Js = [lambda v: A, lambda v: np.diag(1 - np.tanh(v) ** 2), lambda v: 2 * v[None, :]]
x = np.array([0.3, -0.2, 0.1])
y, J = chain_jacobian(fs, Js, x)
F = lambda v: np.tanh(A @ v) @ np.tanh(A @ v)
num = [(F(x + 1e-6 * e) - F(x - 1e-6 * e)) / 2e-6 for e in np.eye(3)]
assert J.shape == (1, 3) and np.allclose(J[0], num, atol=1e-6), 'Evaluate each Jacobian at the input of its own map.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Multiplying a p × q matrix by a q × r matrix costs pqr multiplications. For a chain with dimensions{" "}
          <C>dims = [n0, n1, ..., nK]</C> (map k goes from <M>{"n_{k-1}"}</M> to <M>{"n_k"}</M>), write{" "}
          <C>chain_costs(dims)</C> returning (forward, reverse): the cost of computing <M>{"J_K \\cdots J_1"}</M> starting with{" "}
          <M>{"J_1"}</M> and multiplying on the left, and the cost starting with <M>{"J_K"}</M> and multiplying on the right.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def chain_costs(dims):
    return 0, 0
`,
        solution: `def chain_costs(dims):
    K = len(dims) - 1
    n0, nK = dims[0], dims[-1]
    forward = 0
    for k in range(2, K + 1):
        forward += dims[k] * dims[k - 1] * n0
    reverse = 0
    for k in range(K - 1, 0, -1):
        reverse += nK * dims[k] * dims[k - 1]
    return forward, reverse
`,
        tests: [
          { name: "scalar output", code: `f, r = chain_costs([1000, 500, 200, 1])
assert (f, r) == (100_200_000, 600_000), (f, r)` },
          { name: "other shapes", code: `assert chain_costs([1, 200, 500, 1000]) == (600_000, 100_200_000)
assert chain_costs([5, 7]) == (0, 0), 'A single map needs no multiplication.'
assert chain_costs([2, 3, 4]) == (24, 24)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the chain rule: if f is differentiable at a and g at f(a), then{" "}
          <M>{"D(g \\circ f)(a) = Dg(f(a))\\,Df(a)"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes f(a + h) = f(a) + Ah + r(h) and g(b + k) = g(b) + Bk + s(k) with remainders that are o(‖h‖) and o(‖k‖).",
          "Substitutes k = Ah + r(h) to get g(f(a + h)) = g(f(a)) + BAh + Br(h) + s(k).",
          "Shows B r(h) is o(‖h‖) using ‖B r(h)‖ ≤ ‖B‖ ‖r(h)‖.",
          "Shows s(k) is o(‖h‖) by bounding ‖k‖ ≤ C‖h‖ for small h, handling the case k = 0.",
        ],
      },
    },
    {
      key: "sum",
      rung: "stretch",
      prompt: (
        <p>
          Let <M>{"g(x, y) = xy"}</M> and <M>{"(x, y) = (s + t, s - t)"}</M>. Compute{" "}
          <M>{"\\partial g / \\partial s"}</M> at (s, t) = (2, 1) by the chain rule, adding the contributions of the paths
          through x and through y.
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why the Jacobian of a composition is the product of Jacobians, why each must be evaluated at the right point, and why the order of multiplying them matters for cost but not for the answer.",

  glimpse: (
    <p>
      To use this in a computer, we write a function as a graph of elementary operations, each with a tiny Jacobian. Chapter 3
      turns the two multiplication orders into forward-mode and reverse-mode automatic differentiation.
    </p>
  ),
};
