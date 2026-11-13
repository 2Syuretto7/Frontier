import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PowerIterHvpViz } from "@/components/viz/PowerIterHvpViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.5.4",
  minutes: 60,
  links: {
    requires: ["m5.5.2", "m5.3.4"],
    revisits: ["m3.7.1"],
    foreshadows: ["m5.6.3"],
  },

  puzzle: (
    <>
      <p>
        A network with a hundred million parameters has a Hessian with <M>{"10^{16}"}</M> entries: tens of petabytes. Yet
        researchers routinely measure its largest eigenvalue, the &ldquo;sharpness&rdquo; of the loss, on a single GPU.
      </p>
      <p>How can you learn about a matrix you cannot even store?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Many questions about a matrix only need its action on vectors. The product Hv is the derivative of the gradient in the
        direction v, and that costs about as much as a couple of gradients. Repeating <M>{"v \\leftarrow Hv / \\|Hv\\|"}</M>{" "}
        turns the vector towards the top eigenvector.
      </p>
      <PowerIterHvpViz />
      <p>
        With Hessian-vector products you can find extreme curvatures, solve Newton systems by conjugate gradients, and estimate
        traces, all without forming H.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="a Hessian-vector product is a gradient">
        <p>For <M>{"C^2"}</M> f and a fixed vector v,</p>
        <MD>{"H_f(x)\\, v = \\nabla_x \\big( \\nabla f(x)^\\top v \\big) = \\frac{d}{d\\varepsilon} \\nabla f(x + \\varepsilon v) \\Big|_{\\varepsilon = 0}."}</MD>
      </Theorem>
      <Proof>
        <p>
          The i-th entry of <M>{"\\nabla_x(\\sum_j \\partial_j f(x) v_j)"}</M> is <M>{"\\sum_j \\partial_i \\partial_j f(x) v_j = (Hv)_i"}</M>.
          The second form is the directional derivative of the gradient, the Jacobian of <M>{"\\nabla f"}</M> times v, and that
          Jacobian is H.
        </p>
      </Proof>

      <Remark title="three ways to compute it">
        <ul>
          <li>
            Finite differences: <M>{"Hv \\approx (\\nabla f(x + \\varepsilon v) - \\nabla f(x - \\varepsilon v)) / (2\\varepsilon)"}</M>
            , two gradients, error <M>{"O(\\varepsilon^2)"}</M> plus rounding.
          </li>
          <li>Forward over reverse: a JVP (forward mode) of the gradient function. Exact, about the cost of a few gradients.</li>
          <li>Reverse over reverse: the gradient of the scalar <M>{"\\nabla f \\cdot v"}</M>. Also exact.</li>
        </ul>
        <p>In each case the cost is a constant times the cost of f, independent of the number of parameters.</p>
      </Remark>

      <Theorem title="power iteration">
        <p>
          Let H be symmetric with eigenvalues <M>{"|\\lambda_1| > |\\lambda_2| \\ge \\dots"}</M> and eigenvector <M>{"q_1"}</M>{" "}
          for <M>{"\\lambda_1"}</M>. If <M>{"v_0 \\cdot q_1 \\ne 0"}</M>, then <M>{"v_k = H^k v_0 / \\|H^k v_0\\|"}</M> converges to{" "}
          <M>{"\\pm q_1"}</M>, and <M>{"v_k^\\top H v_k \\to \\lambda_1"}</M>, with error shrinking like{" "}
          <M>{"|\\lambda_2 / \\lambda_1|^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"v_0 = \\sum_i c_i q_i"}</M>. Then <M>{"H^k v_0 = \\lambda_1^k \\big(c_1 q_1 + \\sum_{i \\ge 2} c_i (\\lambda_i / \\lambda_1)^k q_i\\big)"}</M>
          , and every ratio has absolute value below 1, so after normalising, the other components vanish geometrically.
        </p>
      </Proof>

      <Example title="sharpness and the learning rate">
        <p>
          On a quadratic with largest Hessian eigenvalue λ, gradient descent with step η is stable only if{" "}
          <M>{"\\eta < 2/\\lambda"}</M>, since the error along the top eigenvector is multiplied by{" "}
          <M>{"1 - \\eta\\lambda"}</M> each step. Measuring λ by power iteration tells you how large a step the current region
          tolerates.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "hv",
      rung: "check",
      prompt: (
        <p>
          For <M>{"H = \\begin{pmatrix} 2 & 1 \\\\ 1 & 3 \\end{pmatrix}"}</M> and v = (1, 0), what is the second entry of Hv?
        </p>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "cost",
      rung: "check",
      prompt: <p>How does the cost of one exact Hessian-vector product compare with the cost of one gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "A small constant multiple, whatever the number of parameters",
          "n times larger for n parameters",
          "n² times larger",
          "The same as building the full Hessian",
        ],
        correct: [0],
      },
    },
    {
      key: "x2y",
      rung: "apply",
      prompt: <p>For <M>{"f(x, y) = x^2 y"}</M> at (1, 2), what is the first entry of Hv with v = (1, 1)?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "lr",
      rung: "apply",
      prompt: <p>Power iteration reports a top Hessian eigenvalue of 50. Below what step size is gradient descent stable on the quadratic model?</p>,
      answer: { kind: "numeric", value: 0.04, tolerance: 1e-9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
grad = lambda v: np.array([2 * v[0] * v[1], v[0] ** 2 + 3 * v[1] ** 2])
x, v, e = np.array([1.0, 2.0]), np.array([1.0, -1.0]), 1e-5
hv = (grad(x + e * v) - grad(x - e * v)) / (2 * e)
print(np.round(hv, 6))`}</Code>
          <p>A Hessian-vector product from two gradients. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[  2. -10.]", "[ 6. 14.]", "[ 4. -2.]", "[  2. -12.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
H = np.array([[4.0, 1.0], [1.0, 1.0]])
v = np.array([0.0, 1.0])
for k in range(30):
    w = H @ v
    v = w / np.linalg.norm(w)
print(round(v @ H @ v, 4), round(max(np.linalg.eigvalsh(H)), 4))`}</Code>
          <p>Power iteration. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.3028 4.3028", "4.0 4.3028", "0.6972 4.3028", "5.0 5.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hvp_fd(grad, x, v, eps=1e-5)</C>, a Hessian-vector product by central differences of the gradient, and{" "}
          <C>top_eig(hvp, n, iters=200, seed=0)</C>, which runs power iteration from a random unit vector of length n (use{" "}
          <C>np.random.default_rng(seed)</C>) using only calls <C>hvp(v)</C>, and returns the pair (estimate{" "}
          <M>{"v^\\top H v"}</M>, unit vector v).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hvp_fd(grad, x, v, eps=1e-5):
    return np.zeros(len(x))

def top_eig(hvp, n, iters=200, seed=0):
    return 0.0, np.zeros(n)
`,
        solution: `import numpy as np

def hvp_fd(grad, x, v, eps=1e-5):
    x, v = np.asarray(x, float), np.asarray(v, float)
    return (np.asarray(grad(x + eps * v)) - np.asarray(grad(x - eps * v))) / (2 * eps)

def top_eig(hvp, n, iters=200, seed=0):
    v = np.random.default_rng(seed).standard_normal(n)
    v = v / np.linalg.norm(v)
    for _ in range(iters):
        w = np.asarray(hvp(v), float)
        v = w / np.linalg.norm(w)
    return float(v @ hvp(v)), v
`,
        tests: [
          { name: "finite-difference HVP", code: `import numpy as np
grad = lambda v: np.array([2 * v[0] * v[1], v[0] ** 2 + 3 * v[1] ** 2])
assert np.allclose(hvp_fd(grad, [1.0, 2.0], [1.0, 1.0]), [6.0, 14.0], atol=1e-6)` },
          { name: "power iteration", code: `import numpy as np
rng = np.random.default_rng(3)
Q, _ = np.linalg.qr(rng.standard_normal((6, 6)))
H = Q @ np.diag([9.0, 4.0, 3.0, 1.0, 0.5, 0.1]) @ Q.T
calls = []
def hvp(v):
    calls.append(1)
    return H @ v
lam, v = top_eig(hvp, 6)
assert abs(lam - 9) < 1e-6 and np.allclose(np.abs(v), np.abs(Q[:, 0]), atol=1e-4)
assert len(calls) <= 205, 'Use only HVP calls, about one per iteration.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Hessian-free Newton solves <M>{"Hx = b"}</M> using only products Hv. Write <C>cg_solve(hvp, b, iters=100, tol=1e-10)</C>,
          the conjugate gradient method for symmetric positive definite H, starting from x = 0. With r = b, p = r: repeat{" "}
          <M>{"\\alpha = r^\\top r / p^\\top Hp"}</M>, <M>{"x \\mathrel{+}= \\alpha p"}</M>, <M>{"r_{\\text{new}} = r - \\alpha Hp"}</M>
          ; stop if <M>{"\\|r_{\\text{new}}\\| < \\text{tol}"}</M>; else{" "}
          <M>{"p = r_{\\text{new}} + (r_{\\text{new}}^\\top r_{\\text{new}} / r^\\top r)\\, p"}</M>. Return x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cg_solve(hvp, b, iters=100, tol=1e-10):
    return np.zeros(len(b))
`,
        solution: `import numpy as np

def cg_solve(hvp, b, iters=100, tol=1e-10):
    b = np.asarray(b, float)
    x = np.zeros(len(b))
    r = b.copy()
    p = r.copy()
    for _ in range(iters):
        Hp = np.asarray(hvp(p), float)
        alpha = (r @ r) / (p @ Hp)
        x = x + alpha * p
        r_new = r - alpha * Hp
        if np.linalg.norm(r_new) < tol:
            break
        p = r_new + (r_new @ r_new) / (r @ r) * p
        r = r_new
    return x
`,
        tests: [
          { name: "solves", code: `import numpy as np
H = np.array([[4.0, 1.0], [1.0, 3.0]])
x = cg_solve(lambda v: H @ v, [1.0, 2.0])
assert np.allclose(H @ x, [1.0, 2.0], atol=1e-9)` },
          { name: "n steps for n dimensions", code: `import numpy as np
rng = np.random.default_rng(0)
A = rng.standard_normal((8, 8))
H = A @ A.T + 8 * np.eye(8)
b = rng.standard_normal(8)
calls = []
def hvp(v):
    calls.append(1)
    return H @ v
x = cg_solve(hvp, b)
assert np.allclose(x, np.linalg.solve(H, b), atol=1e-8)
assert len(calls) <= 9, 'In exact arithmetic CG finishes in at most n steps.'` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a <M>{"C^2"}</M> function f and a fixed vector v,{" "}
          <M>{"\\nabla_x(\\nabla f(x)^\\top v) = H_f(x) v"}</M>. Explain why this means a Hessian-vector product costs only a
          constant times a function evaluation.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes g(x) = Σ_j ∂_j f(x) v_j with v constant.",
          "Differentiates: ∂_i g = Σ_j ∂_i ∂_j f(x) v_j = (Hv)_i, using that v does not depend on x (and symmetry or the definition of H).",
          "Notes g is a scalar function computed by one gradient evaluation plus a dot product, so its gradient by reverse mode costs a constant times that, by the cheap gradient principle.",
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: <p>How many Hessian-vector products are needed to build the full Hessian of a function of 1000 variables?</p>,
      answer: { kind: "numeric", value: 1000 },
    },
  ],

  teachBack:
    "Explain to a friend how to compute a Hessian-vector product without the Hessian, and how power iteration uses such products to find the sharpness of a loss.",

  glimpse: (
    <p>
      Minimising subject to a constraint changes the condition for a minimum: the gradient need not vanish, only point
      perpendicular to the constraint. Next, Lagrange multipliers.
    </p>
  ),
};
