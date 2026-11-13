import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CurvatureDirViz } from "@/components/viz/CurvatureDirViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m5.5.2",
  minutes: 60,
  links: {
    requires: ["m5.5.1", "m3.7.5"],
    revisits: ["m3.7.1", "m5.4.2"],
    foreshadows: ["m5.5.3", "m5.5.4"],
  },

  puzzle: (
    <>
      <p>
        Gradient descent on some losses races to the minimum; on others it zigzags for thousands of steps. Both losses can
        have the same minimum value and the same gradient at the start.
      </p>
      <p>What property of the function, invisible to the gradient, makes the difference?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Curvature. The Hessian H gives the curvature <M>{"u^\\top H u"}</M> in every unit direction u. Being symmetric, it has
        perpendicular eigenvectors, and along them the curvatures are its eigenvalues, the largest and smallest of all.
      </p>
      <CurvatureDirViz />
      <p>
        When the largest curvature is much bigger than the smallest, the function is a narrow valley. A step size small enough
        not to bounce across the valley is far too small to travel along it.
      </p>
    </>
  ),

  theory: (
    <>
      <Theorem title="symmetry (Clairaut–Schwarz)">
        <p>
          If the second partial derivatives of f exist and are continuous near a, then{" "}
          <M>{"\\partial_i\\partial_j f(a) = \\partial_j \\partial_i f(a)"}</M>, so <M>{"H_f(a)"}</M> is symmetric.
        </p>
      </Theorem>
      <Proof>
        <p>
          (Sketch.) Both mixed partials are limits of the same double difference{" "}
          <M>{"[f(a + se_i + te_j) - f(a + se_i) - f(a + te_j) + f(a)]/(st)"}</M>. Applying the mean value theorem twice, in
          either order, writes it as a mixed partial at a nearby point; continuity makes both limits equal.
        </p>
      </Proof>

      <Theorem title="curvature and eigenvalues">
        <p>
          Let H be symmetric with eigenvalues <M>{"\\lambda_1 \\le \\dots \\le \\lambda_n"}</M> and orthonormal eigenvectors{" "}
          <M>{"q_1, \\dots, q_n"}</M>. For every unit vector u,
        </p>
        <MD>{"\\lambda_1 \\le u^\\top H u \\le \\lambda_n,"}</MD>
        <p>with equality at <M>{"u = q_1"}</M> and <M>{"u = q_n"}</M> respectively.</p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"u = \\sum_i c_i q_i"}</M> with <M>{"\\sum c_i^2 = 1"}</M>. Then{" "}
          <M>{"u^\\top H u = \\sum_i \\lambda_i c_i^2"}</M>, a weighted average of the eigenvalues with weights{" "}
          <M>{"c_i^2"}</M>. An average lies between the smallest and largest values, and puts all its weight on one when u is that
          eigenvector.
        </p>
      </Proof>

      <Example title="Hessians that come up constantly">
        <ul>
          <li>Quadratic <M>{"\\tfrac12 x^\\top A x"}</M> with A symmetric: H = A, the same everywhere.</li>
          <li>Least squares <M>{"\\tfrac12\\|Ax - b\\|^2"}</M>: <M>{"H = A^\\top A"}</M>, always positive semidefinite.</li>
          <li>
            Logistic regression, mean binary cross-entropy with <M>{"p = \\sigma(Xw)"}</M>: gradient{" "}
            <M>{"X^\\top(p - y)/N"}</M> and <M>{"H = X^\\top \\mathrm{diag}(p \\odot (1 - p)) X / N"}</M>, also positive
            semidefinite, which is why that loss is convex.
          </li>
        </ul>
      </Example>

      <Remark title="condition number">
        <p>
          For positive definite H, <M>{"\\kappa = \\lambda_n / \\lambda_1"}</M> is the condition number. Gradient descent on a
          quadratic with the best fixed step shrinks the error by a factor of about <M>{"(\\kappa - 1)/(\\kappa + 1)"}</M> per
          step, so κ = 100 needs about a hundred times as many steps as κ = 1. Preconditioning and adaptive optimisers such as
          Adam try to reduce the effective κ.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "quad",
      rung: "check",
      prompt: <p>What is the Hessian of <M>{"\\tfrac12\\|Ax - b\\|^2"}</M>?</p>,
      answer: { kind: "choice", options: ["AᵀA", "A", "A + Aᵀ", "Aᵀ(Ax − b)"], correct: [0] },
    },
    {
      key: "sym",
      rung: "check",
      prompt: <p>Why is the Hessian of a <M>{"C^2"}</M> function symmetric?</p>,
      answer: {
        kind: "choice",
        options: [
          "Mixed partial derivatives are equal when they are continuous",
          "Every square matrix is symmetric",
          "The gradient is symmetric",
          "Because the function is convex",
        ],
        correct: [0],
      },
    },
    {
      key: "max",
      rung: "apply",
      prompt: (
        <p>
          What is the largest curvature <M>{"u^\\top H u"}</M> over unit vectors u for{" "}
          <M>{"H = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 1e-9 },
    },
    {
      key: "entry",
      rung: "apply",
      prompt: <p>For <M>{"f(x, y) = x^2 y + y^3"}</M>, what is <M>{"\\partial^2 f / \\partial y^2"}</M> at (1, 1)?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
H = np.array([[2.0, 1.0], [1.0, -1.0]])
lam, Q = np.linalg.eigh(H)
u = np.array([1.0, 0.0])
print(np.round(lam, 3), u @ H @ u, round(Q[:, 1] @ H @ Q[:, 1], 3))`}</Code>
          <p>Eigenvalues and curvatures of an indefinite Hessian. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[-1.303  2.303] 2.0 2.303", "[ 2.303 -1.303] 2.0 2.303", "[-1.303  2.303] 2.0 -1.303", "[-1.  2.] 2.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
X = np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]])
w = np.zeros(2)
p = 1 / (1 + np.exp(-X @ w))
H = X.T @ np.diag(p * (1 - p)) @ X / len(X)
print(H, np.linalg.eigvalsh(H).min() >= 0)`}</Code>
          <p>The Hessian of logistic regression at w = 0. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25  0.375]\n [0.375 0.875]] True",
          "[[1.  1.5]\n [1.5 3.5]] True",
          "[[0.25  0.375]\n [0.375 0.875]] False",
          "[[0.5  0.75]\n [0.75 1.75]] True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hessian_from_grad(grad, x, h=1e-5)</C>, the Hessian as the Jacobian of the gradient function by central
          differences, symmetrised as <M>{"\\tfrac12(J + J^\\top)"}</M>, and <C>curvature(H, u)</C>, the curvature{" "}
          <M>{"u^\\top H u / u^\\top u"}</M> in the direction of a non-zero u.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hessian_from_grad(grad, x, h=1e-5):
    return np.eye(len(x))

def curvature(H, u):
    return 0.0
`,
        solution: `import numpy as np

def hessian_from_grad(grad, x, h=1e-5):
    x = np.asarray(x, float)
    cols = []
    for j in range(len(x)):
        e = np.zeros(len(x))
        e[j] = h
        cols.append((np.asarray(grad(x + e)) - np.asarray(grad(x - e))) / (2 * h))
    J = np.array(cols).T
    return 0.5 * (J + J.T)

def curvature(H, u):
    H, u = np.asarray(H, float), np.asarray(u, float)
    return float(u @ H @ u / (u @ u))
`,
        tests: [
          { name: "Hessian", code: `import numpy as np
grad = lambda v: np.array([2 * v[0] * v[1], v[0] ** 2 + 3 * v[1] ** 2])
H = hessian_from_grad(grad, [1.0, 1.0])
assert np.allclose(H, [[2, 2], [2, 6]], atol=1e-6) and np.allclose(H, H.T)` },
          { name: "curvature", code: `import numpy as np
H = np.array([[2.0, 1.0], [1.0, 2.0]])
assert abs(curvature(H, [1.0, 1.0]) - 3) < 1e-12, 'Divide by the squared length of u.'
assert abs(curvature(H, [3.0, -3.0]) - 1) < 1e-12
cs = [curvature(H, [np.cos(t), np.sin(t)]) for t in np.linspace(0, np.pi, 50)]
assert 1 - 1e-12 <= min(cs) and max(cs) <= 3 + 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logistic_grad_hess(X, y, w)</C> for the mean binary cross-entropy of logistic regression,{" "}
          <M>{"L(w) = -\\frac1N \\sum_i [y_i \\log p_i + (1 - y_i)\\log(1 - p_i)]"}</M> with <M>{"p = \\sigma(Xw)"}</M>. Return
          the pair (gradient, Hessian) using the formulas in the lesson.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def logistic_grad_hess(X, y, w):
    return np.zeros(len(w)), np.eye(len(w))
`,
        solution: `import numpy as np

def logistic_grad_hess(X, y, w):
    X, y, w = np.asarray(X, float), np.asarray(y, float), np.asarray(w, float)
    N = len(X)
    p = 1 / (1 + np.exp(-X @ w))
    g = X.T @ (p - y) / N
    H = (X.T * (p * (1 - p))) @ X / N
    return g, H
`,
        tests: [
          { name: "at zero", code: `import numpy as np
X = np.array([[1.0, 0.0], [1.0, 1.0], [1.0, 2.0], [1.0, 3.0]])
y = np.array([0.0, 0.0, 1.0, 1.0])
g, H = logistic_grad_hess(X, y, np.zeros(2))
assert np.allclose(g, [0.0, -0.5]) and np.allclose(H, [[0.25, 0.375], [0.375, 0.875]])` },
          { name: "finite differences", code: `import numpy as np
rng = np.random.default_rng(0)
X, y, w = rng.standard_normal((20, 3)), (rng.random(20) < 0.5).astype(float), rng.standard_normal(3)
def L(w):
    p = 1 / (1 + np.exp(-X @ w))
    return -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
g, H = logistic_grad_hess(X, y, w)
num = np.array([(L(w + 1e-6 * e) - L(w - 1e-6 * e)) / 2e-6 for e in np.eye(3)])
assert np.allclose(g, num, atol=1e-6)
gp = logistic_grad_hess(X, y, w + 1e-6 * np.eye(3)[1])[0]
gm = logistic_grad_hess(X, y, w - 1e-6 * np.eye(3)[1])[0]
assert np.allclose(H[:, 1], (gp - gm) / 2e-6, atol=1e-6)
assert np.linalg.eigvalsh(H).min() >= -1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let H be symmetric with eigenvalues <M>{"\\lambda_1 \\le \\dots \\le \\lambda_n"}</M>. Prove that{" "}
          <M>{"\\lambda_1 \\le u^\\top H u \\le \\lambda_n"}</M> for every unit vector u, with equality at the corresponding
          eigenvectors.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the spectral theorem: an orthonormal basis of eigenvectors q_i exists.",
          "Expands u = Σ c_i q_i with Σ c_i² = 1 (by orthonormality and ‖u‖ = 1).",
          "Computes uᵀHu = Σ λ_i c_i², a weighted average of the eigenvalues.",
          "Bounds the average between λ_1 and λ_n and checks equality at q_1 and q_n.",
        ],
      },
    },
    {
      key: "kappa",
      rung: "stretch",
      prompt: (
        <p>
          What is the condition number of <M>{"H = \\begin{pmatrix} 1 & 0.9 \\\\ 0.9 & 1 \\end{pmatrix}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 19, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend what the eigenvalues and eigenvectors of a Hessian say about the shape of a function, and why a large condition number slows gradient descent.",

  glimpse: (
    <p>
      At a point where the gradient vanishes, the signs of the Hessian&rsquo;s eigenvalues decide whether it is a minimum, a
      maximum or a saddle. Next.
    </p>
  ),
};
