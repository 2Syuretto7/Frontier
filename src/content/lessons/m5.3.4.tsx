import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VjpJvpViz } from "@/components/viz/VjpJvpViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.3.4",
  minutes: 60,
  links: {
    requires: ["m5.3.3", "m5.2.3"],
    revisits: ["m3.3.1"],
    foreshadows: ["m5.4.5", "m5.5.4", "e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        A layer y = tanh(Wx) with 4096 inputs and 4096 outputs has a Jacobian with respect to x of about 17 million entries,
        and with respect to W of about 69 billion.
      </p>
      <p>Backpropagation passes through such layers constantly. How can it, if it never has room to store their Jacobians?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Forward mode never needs J itself, only J times a vector. Reverse mode needs only a row vector times J. For the common
        operations these products have short formulas that cost about as much as the operation itself.
      </p>
      <VjpJvpViz />
      <p>
        So an automatic differentiation library is a table: for each operation, a rule for its Jacobian-vector product (JVP)
        and one for its vector-Jacobian product (VJP). The chain rule composes the rules; no Jacobian is ever built.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="JVP and VJP">
        <p>For <M>{"f : \\mathbb R^n \\to \\mathbb R^m"}</M> differentiable at x:</p>
        <ul>
          <li>
            the Jacobian-vector product is <M>{"\\mathrm{jvp}(x, v) = J_f(x)\\, v \\in \\mathbb R^m"}</M> for{" "}
            <M>{"v \\in \\mathbb R^n"}</M>, the directional derivative along v;
          </li>
          <li>
            the vector-Jacobian product is <M>{"\\mathrm{vjp}(x, u) = u^\\top J_f(x) \\in \\mathbb R^n"}</M> (written as a
            column, <M>{"J_f(x)^\\top u"}</M>) for <M>{"u \\in \\mathbb R^m"}</M>, the gradient of <M>{"u \\cdot f"}</M>.
          </li>
        </ul>
      </Definition>

      <Theorem title="composing products">
        <p>For <M>{"h = g \\circ f"}</M> with y = f(x):</p>
        <MD>{"J_h v = J_g(y)\\,\\big(J_f(x)\\, v\\big), \\qquad u^\\top J_h = \\big(u^\\top J_g(y)\\big)\\, J_f(x)."}</MD>
        <p>So JVPs are chained from the input side, VJPs from the output side, each a vector at every stage.</p>
      </Theorem>
      <Proof>
        <p>
          The chain rule <M>{"J_h = J_g(y) J_f(x)"}</M> and associativity of matrix multiplication.
        </p>
      </Proof>

      <Example title="rules for common operations">
        <ul>
          <li>
            Linear map y = Wx: JVP in x is <M>{"W v"}</M>; VJP in x is <M>{"W^\\top u"}</M>. As a function of W, the VJP is{" "}
            <M>{"u x^\\top"}</M>, an outer product with the shape of W.
          </li>
          <li>
            Elementwise <M>{"y_i = \\sigma(x_i)"}</M>: the Jacobian is diagonal, so both products are{" "}
            <M>{"\\sigma'(x) \\odot v"}</M> and <M>{"\\sigma'(x) \\odot u"}</M>, elementwise.
          </li>
          <li>
            Sum <M>{"y = \\sum_i x_i"}</M>: VJP of a scalar u is u copied into every entry. Broadcasting a scalar has the
            reverse rule, summing.
          </li>
        </ul>
      </Example>

      <Theorem title="the gradient with respect to a weight matrix">
        <p>
          If y = Wx and L is a scalar function of y with gradient <M>{"\\bar y = \\nabla_y L"}</M>, then{" "}
          <M>{"\\nabla_W L = \\bar y \\, x^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Change W to W + H. Then y changes by Hx, so L changes, to first order, by{" "}
          <M>{"\\bar y^\\top H x = \\sum_{i, j} \\bar y_i x_j H_{ij}"}</M>. The coefficient of <M>{"H_{ij}"}</M> is{" "}
          <M>{"\\bar y_i x_j"}</M>, the (i, j) entry of <M>{"\\bar y x^\\top"}</M>.
        </p>
      </Proof>

      <Remark title="building a Jacobian when you must">
        <p>
          The full Jacobian can be recovered from n JVPs with the basis vectors <M>{"e_j"}</M> (its columns) or from m VJPs with{" "}
          <M>{"e_i"}</M> (its rows). Choose whichever count is smaller.
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
          For <M>{"f : \\mathbb R^n \\to \\mathbb R^m"}</M>, what is the length of a vector-Jacobian product{" "}
          <M>{"u^\\top J_f(x)"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["n", "m", "m × n", "1"], correct: [0] },
    },
    {
      key: "lin",
      rung: "check",
      prompt: (
        <p>
          For y = Wx with <M>{"W = \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}"}</M> and u = (1, 1), what is the first entry
          of the VJP with respect to x?
        </p>
      ),
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "tanh",
      rung: "apply",
      prompt: <p>For elementwise y = tanh(x), what is the VJP at x = (0, 0) with u = (3, −1)? Give its first entry.</p>,
      answer: { kind: "numeric", value: 3, tolerance: 1e-12 },
    },
    {
      key: "gw",
      rung: "apply",
      prompt: (
        <p>
          For y = Wx and a scalar loss with <M>{"\\bar y = \\nabla_y L"}</M>, what is <M>{"\\nabla_W L"}</M>?
        </p>
      ),
      answer: { kind: "choice", options: ["ȳ xᵀ", "x ȳᵀ", "Wᵀ ȳ", "ȳᵀ W x"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
W = np.array([[1.0, 2.0], [0.0, 1.0], [3.0, -1.0]])
x = np.array([1.0, 2.0])
u = np.array([1.0, 0.0, 2.0])
gx = W.T @ u
gW = np.outer(u, x)
print(gx, gW.shape, gW[2])`}</Code>
          <p>The VJP of a linear layer, in x and in W. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[7. 0.] (3, 2) [2. 4.]", "[7. 0.] (2, 3) [2. 4.]", "[1. 2.] (3, 2) [2. 4.]", "[7. 0.] (3, 2) [1. 2.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
f = lambda x: np.array([x[0] * x[1], x[0] + x[2], x[2] ** 2])
def vjp(x, u):
    return np.array([u[0] * x[1] + u[1], u[0] * x[0], u[1] + 2 * x[2] * u[2]])
x = np.array([1.0, 2.0, 3.0])
J = np.array([vjp(x, e) for e in np.eye(3)])
print(J[0], J[2])`}</Code>
          <p>Rebuilding a Jacobian row by row from VJPs. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2. 1. 0.] [0. 0. 6.]", "[2. 1. 1.] [0. 0. 6.]", "[2. 0. 0.] [1. 0. 6.]", "[1. 2. 0.] [0. 0. 3.]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>linear_vjp(W, x, u)</C>, which returns the pair (gradient with respect to x, gradient with respect to W) of{" "}
          <M>{"u \\cdot (Wx)"}</M>, and <C>tanh_vjp(x, u)</C>, the VJP of elementwise tanh. Do not build any Jacobian.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def linear_vjp(W, x, u):
    return np.zeros(len(x)), np.zeros_like(W)

def tanh_vjp(x, u):
    return np.zeros(len(x))
`,
        solution: `import numpy as np

def linear_vjp(W, x, u):
    W, x, u = np.asarray(W, float), np.asarray(x, float), np.asarray(u, float)
    return W.T @ u, np.outer(u, x)

def tanh_vjp(x, u):
    x, u = np.asarray(x, float), np.asarray(u, float)
    return u * (1 - np.tanh(x) ** 2)
`,
        tests: [
          { name: "linear layer", code: `import numpy as np
rng = np.random.default_rng(0)
W, x, u = rng.standard_normal((3, 5)), rng.standard_normal(5), rng.standard_normal(3)
gx, gW = linear_vjp(W, x, u)
assert gx.shape == (5,) and gW.shape == (3, 5), 'The gradient in W has the shape of W.'
L = lambda W, x: u @ (W @ x)
h = 1e-6
E = np.zeros((3, 5))
E[1, 2] = 1.0
assert abs(gW[1, 2] - (L(W + h * E, x) - L(W - h * E, x)) / (2 * h)) < 1e-6
assert np.allclose(gx, [(L(W, x + h * e) - L(W, x - h * e)) / (2 * h) for e in np.eye(5)], atol=1e-6)` },
          { name: "tanh", code: `import numpy as np
x, u = np.array([0.0, 1.0, -2.0]), np.array([3.0, 1.0, 2.0])
num = [(u @ np.tanh(x + 1e-6 * e) - u @ np.tanh(x - 1e-6 * e)) / 2e-6 for e in np.eye(3)]
assert np.allclose(tanh_vjp(x, u), num, atol=1e-6)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>jacobian_from_vjps(vjp, x, m)</C> and <C>jacobian_from_jvps(jvp, x, n)</C>. Here <C>vjp(x, u)</C> returns{" "}
          <M>{"u^\\top J"}</M> and <C>jvp(x, v)</C> returns <M>{"J v"}</M>. Each function should return the full m × n
          Jacobian, using m VJPs with basis vectors or n JVPs with basis vectors respectively.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def jacobian_from_vjps(vjp, x, m):
    return np.zeros((m, len(x)))

def jacobian_from_jvps(jvp, x, n):
    return np.zeros((1, n))
`,
        solution: `import numpy as np

def jacobian_from_vjps(vjp, x, m):
    return np.array([vjp(x, e) for e in np.eye(m)], float)

def jacobian_from_jvps(jvp, x, n):
    return np.array([jvp(x, e) for e in np.eye(n)], float).T
`,
        tests: [
          { name: "agree", code: `import numpy as np
def vjp(x, u):
    return np.array([u[0] * x[1] + u[1], u[0] * x[0], u[1] + 2 * x[2] * u[2]])
def jvp(x, v):
    return np.array([x[1] * v[0] + x[0] * v[1], v[0] + v[2], 2 * x[2] * v[2]])
x = np.array([1.0, 2.0, 3.0])
A, B = jacobian_from_vjps(vjp, x, 3), jacobian_from_jvps(jvp, x, 3)
assert np.allclose(A, [[2, 1, 0], [1, 0, 1], [0, 0, 6]]) and np.allclose(A, B)` },
          { name: "non-square", code: `import numpy as np
W = np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
A = jacobian_from_vjps(lambda x, u: W.T @ u, np.zeros(3), 2)
B = jacobian_from_jvps(lambda x, v: W @ v, np.zeros(3), 3)
assert A.shape == (2, 3) and B.shape == (2, 3), 'JVPs give columns: transpose the stack.'
assert np.allclose(A, W) and np.allclose(B, W)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if y = Wx and L is a differentiable scalar function of y with <M>{"\\bar y = \\nabla_y L"}</M>, then{" "}
          <M>{"\\partial L / \\partial W_{ij} = \\bar y_i x_j"}</M>, so <M>{"\\nabla_W L = \\bar y x^\\top"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes y_k = Σ_j W_kj x_j, so ∂y_k/∂W_ij is x_j when k = i and 0 otherwise (or perturbs W by H to get δy = Hx).",
          "Applies the chain rule: ∂L/∂W_ij = Σ_k ȳ_k ∂y_k/∂W_ij = ȳ_i x_j.",
          "Assembles the entries into the outer product ȳ xᵀ.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          You need the full Jacobian of a map from <M>{"\\mathbb R^{1000}"}</M> to <M>{"\\mathbb R^{10}"}</M>, using whichever
          kind of product needs fewer calls. How many calls?
        </p>
      ),
      answer: { kind: "numeric", value: 10 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between a Jacobian-vector product and a vector-Jacobian product, which mode of differentiation computes each, and why neither needs the Jacobian itself.",

  glimpse: (
    <p>
      Reverse mode gets a whole gradient for the price of a few function evaluations. The last lesson of this chapter makes that
      claim precise, and looks at its hidden cost, memory.
    </p>
  ),
};
