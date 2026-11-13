import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UnrollVsImplicitViz } from "@/components/viz/UnrollVsImplicitViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.6.3",
  minutes: 65,
  links: {
    requires: ["m5.6.2", "m5.3.4"],
    revisits: ["m5.4.2"],
    foreshadows: ["l1.5.4"],
  },

  puzzle: (
    <>
      <p>
        A model&rsquo;s weights are the result of an optimisation that ran for ten thousand steps. You want the gradient of the
        validation loss with respect to a hyperparameter, such as the regularisation strength.
      </p>
      <p>Must you backpropagate through all ten thousand steps, storing every one of them?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        No. The trained weights satisfy an equation: the training gradient is zero. That equation defines the weights
        implicitly as a function of the hyperparameter, and the implicit function theorem gives its derivative from the final
        weights alone. How the solver got there is irrelevant.
      </p>
      <UnrollVsImplicitViz />
      <p>
        The same trick differentiates through fixed-point layers, physics simulations at equilibrium, and the solutions of
        optimisation problems inside a network, with memory that does not grow with the number of iterations.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="differentiating a solution">
        <p>
          Suppose <M>{"x^*(\\theta)"}</M> satisfies <M>{"F(x^*(\\theta), \\theta) = 0"}</M>, with F a <M>{"C^1"}</M> map and{" "}
          <M>{"\\partial_x F"}</M> invertible at the solution. Then
        </p>
        <MD>{"\\frac{\\partial x^*}{\\partial \\theta} = -\\big(\\partial_x F\\big)^{-1} \\partial_\\theta F."}</MD>
        <p>
          For a fixed point <M>{"x^* = T(x^*, \\theta)"}</M>, take F = x − T:{" "}
          <M>{"\\frac{\\partial x^*}{\\partial \\theta} = (I - \\partial_x T)^{-1} \\partial_\\theta T"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          This is the implicit function theorem with x as the dependent variable and θ as the independent one. For the fixed
          point, <M>{"\\partial_x F = I - \\partial_x T"}</M> and <M>{"\\partial_\\theta F = -\\partial_\\theta T"}</M>. If{" "}
          <M>{"\\|\\partial_x T\\| < 1"}</M>, as for a contraction, then <M>{"I - \\partial_x T"}</M> is invertible, with inverse
          the Neumann series <M>{"\\sum_k (\\partial_x T)^k"}</M>, which is what unrolling infinitely many steps would compute.
        </p>
      </Proof>

      <Remark title="the adjoint form">
        <p>
          For a scalar loss L(x*), the chain rule gives{" "}
          <M>{"\\nabla_\\theta L = -(\\partial_\\theta F)^\\top w"}</M> where <M>{"(\\partial_x F)^\\top w = \\nabla_x L"}</M>. So
          one linear solve with the transpose, then one VJP, gives the gradient with respect to all of θ at once. The solve can
          itself use only matrix-vector products, for example conjugate gradients with Hessian-vector products.
        </p>
      </Remark>

      <Example title="hyperparameter gradient for ridge regression">
        <p>
          The ridge solution satisfies <M>{"(A^\\top A + \\lambda I)x = A^\\top b"}</M>. Differentiating in λ:{" "}
          <M>{"(A^\\top A + \\lambda I)\\, \\tfrac{dx}{d\\lambda} + x = 0"}</M>, so{" "}
          <M>{"\\tfrac{dx}{d\\lambda} = -(A^\\top A + \\lambda I)^{-1} x"}</M>. With a validation loss{" "}
          <M>{"\\tfrac12\\|A_v x - b_v\\|^2"}</M>, the hypergradient is{" "}
          <M>{"(A_v^\\top(A_v x - b_v))^\\top \\tfrac{dx}{d\\lambda}"}</M>, from one extra linear solve.
        </p>
      </Example>

      <Remark title="when it goes wrong">
        <p>
          The formula assumes the solver actually reached the solution. An optimisation stopped early, or a fixed point that is
          not unique, gives a derivative of the wrong function. Where <M>{"\\partial_x F"}</M> is nearly singular, the derivative
          is huge, because the solution itself is sensitive. Implicit layers in practice check convergence before trusting the
          gradient.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "formula",
      rung: "check",
      prompt: <p>For a scalar fixed point x* = T(x*, θ), what is dx*/dθ?</p>,
      answer: {
        kind: "choice",
        options: ["T_θ / (1 − T_x)", "T_θ / T_x", "T_θ (1 − T_x)", "−T_x / T_θ"],
        correct: [0],
      },
    },
    {
      key: "memory",
      rung: "check",
      prompt: <p>How does the memory of implicit differentiation depend on the number of solver iterations?</p>,
      answer: {
        kind: "choice",
        options: ["It does not depend on it", "It grows linearly", "It grows quadratically", "It shrinks"],
        correct: [0],
      },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: <p>x* solves x = 0.5x + θ. What is dx*/dθ?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-12 },
    },
    {
      key: "ridge",
      rung: "apply",
      prompt: (
        <p>
          With one feature, the ridge solution is <M>{"x(\\lambda) = ab/(a^2 + \\lambda)"}</M>. For a = 1, b = 2, λ = 1, what is
          dx/dλ?
        </p>
      ),
      answer: { kind: "numeric", value: -0.5, tolerance: 1e-12 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
theta = 1.0
x, d = 0.0, 0.0
for k in range(1, 41):
    d = -0.5 * np.sin(x) * d + 1
    x = 0.5 * np.cos(x) + theta
    if k in (1, 2, 40):
        print(k, round(d, 4))
print(round(1 / (1 + 0.5 * np.sin(x)), 4))`}</Code>
          <p>Unrolled derivatives of a fixed-point iteration, then the implicit formula. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1 1.0\n2 0.5013\n40 0.6832\n0.6832", "1 1.0\n2 1.0\n40 1.0\n0.6832", "1 1.0\n2 0.5013\n40 0.5013\n0.6832", "1 0.0\n2 0.5013\n40 0.6832\n0.6832"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 0.0], [1.0, 1.0], [0.0, 2.0]])
b = np.array([1.0, 2.0, 2.0])
solve = lambda lam: np.linalg.solve(A.T @ A + lam * np.eye(2), A.T @ b)
lam = 0.5
x = solve(lam)
dx = -np.linalg.solve(A.T @ A + lam * np.eye(2), x)
fd = (solve(lam + 1e-6) - solve(lam - 1e-6)) / 2e-6
print(np.allclose(dx, fd, atol=1e-8), bool(np.all(dx < 0)))`}</Code>
          <p>The derivative of a ridge solution with respect to λ. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True", "True False", "False True", "False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fixed_point(T, x0, theta, iters=200)</C>, which iterates x ← T(x, θ) for 1-D arrays, and{" "}
          <C>fixed_point_jac(Tx, Ttheta)</C>, which takes <M>{"\\partial_x T"}</M> (n × n) and <M>{"\\partial_\\theta T"}</M>{" "}
          (n × p) at the fixed point and returns <M>{"\\partial x^*/\\partial\\theta = (I - \\partial_x T)^{-1}\\partial_\\theta T"}</M>{" "}
          by a linear solve.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fixed_point(T, x0, theta, iters=200):
    return np.asarray(x0, float)

def fixed_point_jac(Tx, Ttheta):
    return np.asarray(Ttheta, float)
`,
        solution: `import numpy as np

def fixed_point(T, x0, theta, iters=200):
    x = np.asarray(x0, float)
    for _ in range(iters):
        x = T(x, theta)
    return x

def fixed_point_jac(Tx, Ttheta):
    Tx = np.asarray(Tx, float)
    return np.linalg.solve(np.eye(len(Tx)) - Tx, np.asarray(Ttheta, float))
`,
        tests: [
          { name: "scalar example", code: `import numpy as np
T = lambda x, th: 0.5 * np.cos(x) + th
xs = fixed_point(T, np.zeros(1), 1.0)
assert abs(xs[0] - T(xs, 1.0)[0]) < 1e-12
J = fixed_point_jac([[-0.5 * np.sin(xs[0])]], [[1.0]])
assert abs(J[0, 0] - 1 / (1 + 0.5 * np.sin(xs[0]))) < 1e-12` },
          { name: "a vector fixed point", code: `import numpy as np
W = np.array([[0.2, -0.3], [0.1, 0.4]])
T = lambda x, th: np.tanh(W @ x + th)
th = np.array([0.5, -0.2])
xs = fixed_point(T, np.zeros(2), th)
s = 1 - np.tanh(W @ xs + th) ** 2
J = fixed_point_jac(s[:, None] * W, np.diag(s))
num = np.array([(fixed_point(T, xs, th + 1e-6 * e) - fixed_point(T, xs, th - 1e-6 * e)) / 2e-6 for e in np.eye(2)]).T
assert J.shape == (2, 2) and np.allclose(J, num, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridge_hypergrad(A, b, lam, Av, bv)</C>. Compute the ridge solution x for training data (A, b), then the
          derivative of the validation loss <M>{"\\tfrac12\\|A_v x - b_v\\|^2"}</M> with respect to λ by implicit
          differentiation. Return the pair (validation loss, derivative).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ridge_hypergrad(A, b, lam, Av, bv):
    return 0.0, 0.0
`,
        solution: `import numpy as np

def ridge_hypergrad(A, b, lam, Av, bv):
    A, b, Av, bv = (np.asarray(m, float) for m in (A, b, Av, bv))
    M = A.T @ A + lam * np.eye(A.shape[1])
    x = np.linalg.solve(M, A.T @ b)
    r = Av @ x - bv
    dx = -np.linalg.solve(M, x)
    return 0.5 * float(r @ r), float((Av.T @ r) @ dx)
`,
        tests: [
          { name: "matches finite differences", code: `import numpy as np
rng = np.random.default_rng(0)
A, b = rng.standard_normal((20, 4)), rng.standard_normal(20)
Av, bv = rng.standard_normal((10, 4)), rng.standard_normal(10)
L, g = ridge_hypergrad(A, b, 0.7, Av, bv)
Lp, _ = ridge_hypergrad(A, b, 0.7 + 1e-6, Av, bv)
Lm, _ = ridge_hypergrad(A, b, 0.7 - 1e-6, Av, bv)
assert abs(g - (Lp - Lm) / 2e-6) < 1e-6, (g, (Lp - Lm) / 2e-6)` },
          { name: "one feature", code: `import numpy as np
L, g = ridge_hypergrad([[1.0]], [2.0], 1.0, [[1.0]], [0.0])
assert abs(L - 0.5) < 1e-12 and abs(g - (-0.5)) < 1e-12, 'x = 1, dx/dlam = -0.5, and the residual is 1.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"x^*(\\theta) = T(x^*(\\theta), \\theta)"}</M> with T a <M>{"C^1"}</M> map and{" "}
          <M>{"\\|\\partial_x T\\| < 1"}</M> at the fixed point. Assuming x* is differentiable, prove that{" "}
          <M>{"\\partial x^*/\\partial\\theta = (I - \\partial_x T)^{-1}\\partial_\\theta T"}</M>, and explain why the inverse
          exists.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Differentiates the identity x*(θ) = T(x*(θ), θ) by the chain rule: Dx* = ∂_xT · Dx* + ∂_θT.",
          "Rearranges to (I − ∂_xT) Dx* = ∂_θT.",
          "Shows I − ∂_xT is invertible since ‖∂_xT‖ < 1: if (I − ∂_xT)v = 0 then ‖v‖ = ‖∂_xT v‖ < ‖v‖ unless v = 0 (or via the Neumann series).",
        ],
      },
    },
    {
      key: "lin",
      rung: "stretch",
      prompt: <p>For T(x, θ) = θx + 1 with |θ| &lt; 1, what is <M>{"dx^*/d\\theta"}</M> at θ = 0.5?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend how the implicit function theorem lets you differentiate the output of an iterative solver without backpropagating through its iterations, and when the answer can be wrong.",

  glimpse: (
    <p>
      That completes differentiation. The final chapter turns to integration in several variables: double integrals, changes of
      variables, and why high-dimensional integrals call for randomness.
    </p>
  ),
};
