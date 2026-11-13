import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QuadGradViz } from "@/components/viz/QuadGradViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.4.2",
  minutes: 55,
  links: {
    requires: ["m5.4.1"],
    revisits: ["m3.5.3", "m3.7.5"],
    foreshadows: ["m5.5.2", "m5.5.3"],
  },

  puzzle: (
    <>
      <p>
        Fitting a line by least squares means minimising <M>{"\\|Ax - b\\|^2"}</M>. Set the gradient to zero and you get the
        normal equations <M>{"A^\\top A x = A^\\top b"}</M>.
      </p>
      <p>Where does the <M>{"A^\\top"}</M> come from, and why is there no factor of 2 left?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Linear functions have constant gradients, and quadratic ones have linear gradients. With the differential rules of the
        last lesson every such gradient is two lines of algebra, and the transposes appear exactly where the trace trick puts
        them.
      </p>
      <QuadGradViz />
      <p>
        One surprise: in <M>{"x^\\top A x"}</M> only the symmetric part of A matters. That is why quadratic forms are usually
        written with symmetric matrices, and why their gradient is <M>{"2Ax"}</M> only when A is symmetric.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="gradients of linear and quadratic forms">
        <p>For constant a, b, A and variables x, X of the right shapes:</p>
        <ul>
          <li><M>{"\\nabla_x (a^\\top x) = a"}</M>;</li>
          <li><M>{"\\nabla_x (x^\\top A x) = (A + A^\\top) x"}</M>, which is <M>{"2Ax"}</M> when A is symmetric;</li>
          <li><M>{"\\nabla_x \\tfrac12 \\|Ax - b\\|^2 = A^\\top (Ax - b)"}</M>;</li>
          <li><M>{"\\nabla_X (a^\\top X b) = a b^\\top"}</M> and <M>{"\\nabla_X \\mathrm{tr}(X^\\top A X) = (A + A^\\top) X"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          <M>{"d(x^\\top A x) = dx^\\top A x + x^\\top A\\, dx"}</M>. The first term is a scalar, so it equals its transpose{" "}
          <M>{"x^\\top A^\\top dx"}</M>. Together, <M>{"x^\\top (A + A^\\top) dx"}</M>, so the gradient is{" "}
          <M>{"(A + A^\\top)x"}</M>. For least squares, with r = Ax − b, <M>{"d(\\tfrac12 r^\\top r) = r^\\top dr = r^\\top A\\, dx"}</M>
          , so the gradient is <M>{"A^\\top r"}</M>; the ½ cancels the 2. The matrix cases follow from{" "}
          <M>{"a^\\top dX\\, b = \\mathrm{tr}(b a^\\top dX)"}</M> and the same expansion.
        </p>
      </Proof>

      <Example title="normal equations and ridge regression">
        <p>
          Setting <M>{"A^\\top(Ax - b) = 0"}</M> gives <M>{"A^\\top A x = A^\\top b"}</M>. Adding{" "}
          <M>{"\\tfrac\\lambda2 \\|x\\|^2"}</M> to the loss adds <M>{"\\lambda x"}</M> to the gradient, so ridge regression solves
        </p>
        <MD>{"(A^\\top A + \\lambda I)\\,x = A^\\top b,"}</MD>
        <p>which has a unique solution for every λ &gt; 0, even when <M>{"A^\\top A"}</M> is singular.</p>
      </Example>

      <Remark title="symmetric part">
        <p>
          Any square A is <M>{"\\tfrac12(A + A^\\top) + \\tfrac12(A - A^\\top)"}</M>, and{" "}
          <M>{"x^\\top K x = 0"}</M> for antisymmetric K, since it equals its own negative. So{" "}
          <M>{"x^\\top A x = x^\\top \\tfrac12(A + A^\\top) x"}</M>, and the Hessian of a quadratic form, next chapter, is
          always the symmetric matrix <M>{"A + A^\\top"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lin",
      rung: "check",
      prompt: <p>What is <M>{"\\nabla_x (a^\\top x)"}</M>?</p>,
      answer: { kind: "choice", options: ["a", "aᵀ x", "x", "a aᵀ"], correct: [0] },
    },
    {
      key: "quad",
      rung: "check",
      prompt: (
        <p>
          For <M>{"A = \\begin{pmatrix} 2 & 1 \\\\ 3 & 4 \\end{pmatrix}"}</M> and x = (1, −1), what is the second entry of{" "}
          <M>{"\\nabla_x (x^\\top A x)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -4 },
    },
    {
      key: "ls",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"A = \\mathrm{diag}(1, 2)"}</M>, b = (1, 1) and x = (0, 0), what is the second entry of{" "}
          <M>{"\\nabla \\tfrac12 \\|Ax - b\\|^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: -2 },
    },
    {
      key: "bil",
      rung: "apply",
      prompt: <p>What is <M>{"\\nabla_X (a^\\top X b)"}</M>?</p>,
      answer: { kind: "choice", options: ["a bᵀ", "b aᵀ", "aᵀ b", "a ⊙ b"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 2.0]])
b = np.array([1.0, 2.0, 4.0])
x = np.linalg.solve(A.T @ A, A.T @ b)
r = A @ x - b
print(np.round(x, 3), np.round(A.T @ r, 10))`}</Code>
          <p>A line through three points, by the normal equations. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.833 1.5  ] [0. 0.]", "[1. 1.5] [0. 0.]", "[0.833 1.5  ] [0.5 0.5]", "[1.5   0.833] [0. 0.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[2.0, 3.0], [-1.0, 3.0]])
S = (A + A.T) / 2
x = np.array([1.0, 2.0])
print(x @ A @ x, x @ S @ x, (A + A.T) @ x)`}</Code>
          <p>A quadratic form and its symmetric part. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["18.0 18.0 [ 8. 14.]", "18.0 16.0 [ 8. 14.]", "18.0 18.0 [ 8. 10.]", "16.0 18.0 [ 4.  7.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ls_grad(A, b, x)</C>, the gradient of <M>{"\\tfrac12\\|Ax - b\\|^2"}</M>, and{" "}
          <C>ridge_solve(A, b, lam)</C>, the minimiser of <M>{"\\tfrac12\\|Ax - b\\|^2 + \\tfrac{\\lambda}{2}\\|x\\|^2"}</M>,
          found by solving a linear system (not by inverting a matrix).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ls_grad(A, b, x):
    return np.zeros(len(x))

def ridge_solve(A, b, lam):
    return np.zeros(np.shape(A)[1])
`,
        solution: `import numpy as np

def ls_grad(A, b, x):
    A, b, x = np.asarray(A, float), np.asarray(b, float), np.asarray(x, float)
    return A.T @ (A @ x - b)

def ridge_solve(A, b, lam):
    A, b = np.asarray(A, float), np.asarray(b, float)
    n = A.shape[1]
    return np.linalg.solve(A.T @ A + lam * np.eye(n), A.T @ b)
`,
        tests: [
          { name: "gradient", code: `import numpy as np
rng = np.random.default_rng(0)
A, b, x = rng.standard_normal((5, 3)), rng.standard_normal(5), rng.standard_normal(3)
f = lambda z: 0.5 * np.sum((A @ z - b) ** 2)
num = [(f(x + 1e-6 * e) - f(x - 1e-6 * e)) / 2e-6 for e in np.eye(3)]
assert np.allclose(ls_grad(A, b, x), num, atol=1e-6), 'A transpose times the residual; no factor of 2.'` },
          { name: "ridge", code: `import numpy as np
assert np.allclose(ridge_solve([[3.0]], [6.0], 1.0), [1.8])
A = np.array([[1.0, 1.0], [1.0, 1.0]])
x = ridge_solve(A, [2.0, 2.0], 0.1)
assert np.allclose(ls_grad(A, [2.0, 2.0], x) + 0.1 * x, 0), 'At the minimiser the full gradient is 0.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"f(x) = \\tfrac12 x^\\top A x - b^\\top x"}</M> with a square, possibly non-symmetric A, write{" "}
          <C>quad_grad(A, b, x)</C>, and <C>newton_step(A, b, x)</C>, which returns{" "}
          <M>{"x - H^{-1}\\nabla f(x)"}</M> with <M>{"H = \\tfrac12(A + A^\\top)"}</M>, computed with a linear solve. For a
          positive definite H, one step lands on the minimiser from anywhere.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def quad_grad(A, b, x):
    return np.asarray(A) @ x - b

def newton_step(A, b, x):
    return x
`,
        solution: `import numpy as np

def quad_grad(A, b, x):
    A, b, x = np.asarray(A, float), np.asarray(b, float), np.asarray(x, float)
    return 0.5 * (A + A.T) @ x - b

def newton_step(A, b, x):
    A, x = np.asarray(A, float), np.asarray(x, float)
    H = 0.5 * (A + A.T)
    return x - np.linalg.solve(H, quad_grad(A, b, x))
`,
        tests: [
          { name: "non-symmetric", code: `import numpy as np
A, b = np.array([[2.0, 3.0], [-1.0, 3.0]]), np.array([1.0, 1.0])
x = np.array([0.5, -2.0])
f = lambda z: 0.5 * z @ A @ z - b @ z
num = [(f(x + 1e-6 * e) - f(x - 1e-6 * e)) / 2e-6 for e in np.eye(2)]
assert np.allclose(quad_grad(A, b, x), num, atol=1e-6), 'Use the symmetric part, not A itself.'` },
          { name: "one Newton step", code: `import numpy as np
A, b = np.array([[2.0, 3.0], [-1.0, 3.0]]), np.array([1.0, 1.0])
for x0 in ([5.0, 5.0], [-3.0, 1.0]):
    x = newton_step(A, b, np.array(x0))
    assert np.allclose(quad_grad(A, b, x), 0, atol=1e-12)
assert np.allclose(newton_step(A, b, np.zeros(2)), np.linalg.solve([[2.0, 1.0], [1.0, 3.0]], b))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Using differentials, prove that <M>{"\\nabla_x (x^\\top A x) = (A + A^\\top)x"}</M> and that{" "}
          <M>{"\\nabla_x \\tfrac12\\|Ax - b\\|^2 = A^\\top(Ax - b)"}</M>. Deduce the normal equations.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Applies the product rule: d(xᵀAx) = dxᵀ A x + xᵀ A dx.",
          "Transposes the scalar dxᵀAx to xᵀAᵀdx and reads off the gradient (A + Aᵀ)x.",
          "For least squares, writes r = Ax − b, d(½rᵀr) = rᵀ dr = rᵀ A dx, so the gradient is Aᵀr.",
          "Sets the gradient to 0 to obtain AᵀAx = Aᵀb.",
        ],
      },
    },
    {
      key: "ridge",
      rung: "stretch",
      prompt: (
        <p>
          With a single feature, A = (3) and b = (6), what is the ridge solution for λ = 1?
        </p>
      ),
      answer: { kind: "numeric", value: 1.8, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend how to derive the gradient of a least-squares loss with differentials, and why only the symmetric part of A matters in xᵀAx.",

  glimpse: (
    <p>
      Quadratics are the easy case. Next: the gradients of norms, traces and determinants, including the beautiful fact that the
      gradient of log det X is the inverse transpose.
    </p>
  ),
};
