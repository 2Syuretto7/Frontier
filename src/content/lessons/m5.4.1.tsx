import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayoutViz } from "@/components/viz/LayoutViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.4.1",
  minutes: 60,
  links: {
    requires: ["m5.2.2", "m5.3.4"],
    revisits: ["m3.3.1"],
    foreshadows: ["m5.4.2", "m5.4.3", "m5.4.5"],
  },

  puzzle: (
    <>
      <p>
        One textbook says the derivative of <M>{"Ax"}</M> with respect to x is A. Another says it is <M>{"A^\\top"}</M>. Both
        are careful authors.
      </p>
      <p>
        Who is right, and how do you differentiate a function of a matrix without drowning in indices?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Both are right: they lay the same numbers out in different arrangements. The arrangement is a convention, but the
        linear map is not. So work with the linear map directly: write how a small change dX changes the output. That is the
        differential, and it obeys simple algebraic rules that never mention layout.
      </p>
      <LayoutViz />
      <p>
        For a scalar function of a matrix, one more step turns the differential into a gradient of the same shape as the input,
        which is what gradient descent needs.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="differential">
        <p>
          For a differentiable F, the differential at X is the linear map <M>{"dX \\mapsto dF = DF(X)[dX]"}</M>. We write{" "}
          <M>{"dF"}</M> as an expression linear in <M>{"dX"}</M>, read as &ldquo;the first-order change in F&rdquo;.
        </p>
      </Definition>

      <Theorem title="rules for differentials">
        <p>For matrices of compatible shapes, with A constant:</p>
        <ul>
          <li><M>{"d(A) = 0"}</M>, <M>{"d(X + Y) = dX + dY"}</M>, <M>{"d(AX) = A\\,dX"}</M>, <M>{"d(X^\\top) = (dX)^\\top"}</M>;</li>
          <li><M>{"d(XY) = dX\\,Y + X\\,dY"}</M> (product rule, order preserved);</li>
          <li><M>{"d(X^{-1}) = -X^{-1}\\,dX\\,X^{-1}"}</M>;</li>
          <li><M>{"d\\,\\mathrm{tr}(X) = \\mathrm{tr}(dX)"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          For the product rule, <M>{"(X + dX)(Y + dY) - XY = dX\\,Y + X\\,dY + dX\\,dY"}</M>, and the last term is second order.
          For the inverse, differentiate <M>{"X X^{-1} = I"}</M>: <M>{"dX\\,X^{-1} + X\\,d(X^{-1}) = 0"}</M>, then multiply by{" "}
          <M>{"X^{-1}"}</M> on the left. The trace is linear, so it is its own derivative.
        </p>
      </Proof>

      <Theorem title="from differential to gradient">
        <p>
          For a scalar f of a matrix X, the Frobenius inner product is{" "}
          <M>{"\\langle G, H \\rangle = \\mathrm{tr}(G^\\top H) = \\sum_{ij} G_{ij} H_{ij}"}</M>. If you can write
        </p>
        <MD>{"df = \\mathrm{tr}(G^\\top dX),"}</MD>
        <p>
          then <M>{"\\nabla_X f = G"}</M>, a matrix of the same shape as X.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{tr}(G^\\top dX) = \\sum_{ij} G_{ij}\\, dX_{ij}"}</M>, so the coefficient of <M>{"dX_{ij}"}</M>, which is{" "}
          <M>{"\\partial f/\\partial X_{ij}"}</M>, is <M>{"G_{ij}"}</M>.
        </p>
      </Proof>

      <Example title="the trace trick">
        <p>
          For <M>{"f(X) = \\mathrm{tr}(AX)"}</M>: <M>{"df = \\mathrm{tr}(A\\,dX) = \\mathrm{tr}((A^\\top)^\\top dX)"}</M>, so{" "}
          <M>{"\\nabla_X f = A^\\top"}</M>. Useful identities: <M>{"\\mathrm{tr}(AB) = \\mathrm{tr}(BA)"}</M>,{" "}
          <M>{"\\mathrm{tr}(A^\\top) = \\mathrm{tr}(A)"}</M>, and a scalar equals its own trace, so{" "}
          <M>{"a^\\top dX\\, b = \\mathrm{tr}(b a^\\top dX)"}</M>, giving <M>{"\\nabla_X (a^\\top X b) = a b^\\top"}</M>.
        </p>
      </Example>

      <Remark title="conventions in this course">
        <p>
          Jacobians are numerator layout (outputs index rows). Gradients of scalars have the shape of the input. With these two,
          the chain rule for a scalar loss reads <M>{"\\nabla_x L = J^\\top \\nabla_y L"}</M>, which is the VJP of the previous
          chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "gshape",
      rung: "check",
      prompt: <p>f is a scalar function of a 3 × 4 matrix X. In this course&rsquo;s convention, what shape is <M>{"\\nabla_X f"}</M>?</p>,
      answer: { kind: "choice", options: ["3 × 4", "4 × 3", "12 × 1", "1 × 12"], correct: [0] },
    },
    {
      key: "num",
      rung: "check",
      prompt: (
        <p>
          In numerator layout, what shape is <M>{"\\partial y / \\partial x"}</M> for <M>{"y \\in \\mathbb R^5"}</M> and{" "}
          <M>{"x \\in \\mathbb R^2"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["5 × 2", "2 × 5", "5 × 5", "10 × 1"], correct: [0] },
    },
    {
      key: "dxx",
      rung: "apply",
      prompt: (
        <p>
          <M>{"d(x^\\top x) = 2 x^\\top dx"}</M>. At x = (1, 2) with dx = (0.1, 0), what is the first-order change?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 1e-12 },
    },
    {
      key: "tr",
      rung: "apply",
      prompt: <p>What is the gradient of <M>{"f(X) = \\mathrm{tr}(AX)"}</M> with respect to X?</p>,
      answer: { kind: "choice", options: ["Aᵀ", "A", "tr(A) I", "AX"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
A = np.array([[1.0, 2.0], [3.0, 4.0]])
dX = np.array([[0.0, 1.0], [0.0, 0.0]])
print(np.trace(A @ dX), np.sum(A.T * dX), np.sum(A * dX))`}</Code>
          <p>The trace trick, checked on one perturbation. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3.0 3.0 2.0", "2.0 2.0 3.0", "3.0 2.0 2.0", "1.0 3.0 2.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1.0, -1.0], [2.0, 0.5]])
Xi = np.linalg.inv(X)
dX = 1e-6 * np.array([[1.0, 0.0], [0.0, 0.0]])
actual = np.linalg.inv(X + dX) - Xi
predicted = -Xi @ dX @ Xi
print(np.allclose(actual, predicted, atol=1e-10), np.allclose(actual, -dX, atol=1e-10))`}</Code>
          <p>The differential of the inverse. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True False", "True True", "False False", "False True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>num_grad(f, X, h=1e-6)</C>, the gradient of a scalar function f of an array X of any shape, by central
          differences, returned with the shape of X. Then write <C>trace_grad(A)</C>, the exact gradient of{" "}
          <M>{"\\mathrm{tr}(AX)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def num_grad(f, X, h=1e-6):
    return np.zeros_like(X)

def trace_grad(A):
    return A
`,
        solution: `import numpy as np

def num_grad(f, X, h=1e-6):
    X = np.asarray(X, float)
    G = np.zeros(X.size)
    for i in range(X.size):
        E = np.zeros(X.size)
        E[i] = h
        E = E.reshape(X.shape)
        G[i] = (f(X + E) - f(X - E)) / (2 * h)
    return G.reshape(X.shape)

def trace_grad(A):
    return np.asarray(A, float).T
`,
        tests: [
          { name: "shapes and values", code: `import numpy as np
X = np.arange(6.0).reshape(2, 3)
G = num_grad(lambda Z: np.sum(Z ** 2), X)
assert G.shape == (2, 3) and np.allclose(G, 2 * X, atol=1e-6)
v = num_grad(lambda z: z @ z, np.array([1.0, 2.0]))
assert np.allclose(v, [2, 4], atol=1e-6)` },
          { name: "trace", code: `import numpy as np
A = np.array([[1.0, 2.0, 0.0], [3.0, -1.0, 4.0]])
X = np.ones((3, 2))
f = lambda Z: np.trace(A @ Z)
assert trace_grad(A).shape == (3, 2), 'The gradient has the shape of X, which is 3 x 2.'
assert np.allclose(trace_grad(A), num_grad(f, X), atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Flattening turns a matrix function into a vector function. Write <C>vec_jacobian(F, X, h=1e-6)</C>: flatten X and
          F(X) row by row (NumPy&rsquo;s default <C>ravel</C>) and return the Jacobian of the flattened map by central
          differences, with shape (number of entries of F(X), number of entries of X). The checks confirm that for F(X) = AX it
          equals <C>np.kron(A, np.eye(q))</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vec_jacobian(F, X, h=1e-6):
    return np.zeros((1, 1))
`,
        solution: `import numpy as np

def vec_jacobian(F, X, h=1e-6):
    X = np.asarray(X, float)
    cols = []
    for i in range(X.size):
        E = np.zeros(X.size)
        E[i] = h
        E = E.reshape(X.shape)
        cols.append((np.ravel(F(X + E)) - np.ravel(F(X - E))) / (2 * h))
    return np.array(cols).T
`,
        tests: [
          { name: "left multiplication", code: `import numpy as np
A = np.array([[1.0, 2.0], [0.0, 3.0], [4.0, -1.0]])
X = np.ones((2, 4))
J = vec_jacobian(lambda Z: A @ Z, X)
assert J.shape == (12, 8), J.shape
assert np.allclose(J, np.kron(A, np.eye(4)), atol=1e-6)` },
          { name: "right multiplication", code: `import numpy as np
B = np.array([[1.0, 2.0], [3.0, 4.0], [0.0, 1.0]])
X = np.zeros((2, 3))
J = vec_jacobian(lambda Z: Z @ B, X)
assert np.allclose(J, np.kron(np.eye(2), B.T), atol=1e-6)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the product rule <M>{"d(XY) = dX\\,Y + X\\,dY"}</M>, and use it to derive{" "}
          <M>{"d(X^{-1}) = -X^{-1}\\,dX\\,X^{-1}"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands (X + dX)(Y + dY) − XY = dX Y + X dY + dX dY and argues dX dY is second order (bounded by ‖dX‖‖dY‖).",
          "Keeps the order of factors, noting matrices need not commute.",
          "Differentiates X X⁻¹ = I to get dX X⁻¹ + X d(X⁻¹) = 0.",
          "Solves by multiplying on the left by X⁻¹ to get d(X⁻¹) = −X⁻¹ dX X⁻¹.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          How many entries does the full Jacobian of a map from 100 × 100 matrices to 100 × 100 matrices have?
        </p>
      ),
      answer: { kind: "numeric", value: 100000000 },
    },
  ],

  teachBack:
    "Explain to a friend why the derivative of Ax is written as A in one book and Aᵀ in another, and how differentials and the trace trick avoid the confusion.",

  glimpse: (
    <p>
      With these rules, the gradients that appear everywhere, of linear and quadratic forms and of least squares, take a line
      each. Next.
    </p>
  ),
};
