import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CondGdViz } from "@/components/viz/CondGdViz";
import type { LessonContent } from "@/lib/types";

const COND = `import numpy as np

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return float(s[0] / s[-1]) if s[-1] > 1e-14 * s[0] else float("inf")

def worst_rhs_perturbation(A):
    U = np.linalg.svd(A)[0]
    return U[:, 0], U[:, -1]`;

const GD = `def gd_quadratic(A, b, steps):
    lam = np.linalg.eigvalsh(A)
    eta = 2 / (lam[0] + lam[-1])
    x_star = np.linalg.solve(A, b)
    x, errs = np.zeros_like(b), []
    for _ in range(steps + 1):
        errs.append(np.linalg.norm(x - x_star))
        x = x - eta * (A @ x - b)
    return np.array(errs)

def predicted_rate(A):
    lam = np.linalg.eigvalsh(A)
    k = lam[-1] / lam[0]
    return float((k - 1) / (k + 1))`;

export const lesson: LessonContent = {
  id: "m6.5.4",
  minutes: 55,
  links: {
    requires: ["m6.5.2", "m6.4.1"],
    revisits: ["m6.4.4", "m6.5.3"],
    foreshadows: ["m6.6.2"],
  },

  puzzle: (
    <>
      <p>
        Solving a 10×10 linear system in double precision can return an answer with no correct digits, even though every
        step was exact to sixteen digits. Gradient descent on a perfectly convex quadratic can need millions of steps. Both
        failures are measured by the same number. What is it, and why does it control both?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A matrix stretches some directions by <M>{"\\sigma_1"}</M> and others by only <M>{"\\sigma_n"}</M>. Inverting it
        reverses that, so an error in a weakly stretched direction comes back magnified by <M>{"1/\\sigma_n"}</M> while the
        answer itself may be governed by <M>{"1/\\sigma_1"}</M>. The ratio <M>{"\\sigma_1/\\sigma_n"}</M> is the worst
        relative magnification. For optimisation the same ratio, now of Hessian eigenvalues, measures how elongated the
        valley is, and a single step size cannot suit both its steep walls and its gentle floor.
      </p>
      <CondGdViz />
    </>
  ),

  theory: (
    <>
      <Definition title="condition number">
        <p>
          For an invertible A and an operator norm, <M>{"\\kappa(A) = \\|A\\|\\,\\|A^{-1}\\|"}</M>. In the spectral norm,{" "}
          <M>{"\\kappa_2(A) = \\sigma_1/\\sigma_n"}</M>; for symmetric positive definite A it is{" "}
          <M>{"\\lambda_{\\max}/\\lambda_{\\min}"}</M>. Always <M>{"\\kappa \\ge 1"}</M>, with equality for multiples of
          orthogonal matrices; for singular A, <M>{"\\kappa = \\infty"}</M>.
        </p>
      </Definition>

      <Theorem title="sensitivity of linear systems">
        <p>
          If Ax = b with b ≠ 0 and <M>{"A(x + \\delta x) = b + \\delta b"}</M>, then{" "}
          <M>{"\\frac{\\|\\delta x\\|}{\\|x\\|} \\le \\kappa(A)\\frac{\\|\\delta b\\|}{\\|b\\|}"}</M>, and for the spectral
          norm there are b and δb with equality.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\delta x = A^{-1}\\delta b"}</M>, so <M>{"\\|\\delta x\\| \\le \\|A^{-1}\\|\\,\\|\\delta b\\|"}</M>, and{" "}
          <M>{"\\|b\\| = \\|Ax\\| \\le \\|A\\|\\,\\|x\\|"}</M>, so <M>{"1/\\|x\\| \\le \\|A\\|/\\|b\\|"}</M>. Multiply. For
          equality take <M>{"b = u_1"}</M> (so <M>{"x = v_1/\\sigma_1"}</M>) and <M>{"\\delta b = \\varepsilon u_n"}</M> (so{" "}
          <M>{"\\delta x = \\varepsilon v_n/\\sigma_n"}</M>): the ratio of relative errors is{" "}
          <M>{"\\sigma_1/\\sigma_n"}</M>.
        </p>
      </Proof>
      <p>
        A similar bound holds for errors in A itself,{" "}
        <M>{"\\|\\delta x\\|/\\|x + \\delta x\\| \\le \\kappa(A)\\|\\delta A\\|/\\|A\\|"}</M>. Since a backward-stable solver
        returns the exact solution of a problem with relative error about the machine precision{" "}
        <M>{"10^{-16}"}</M>, you can expect to lose about <M>{"\\log_{10}\\kappa"}</M> of your sixteen digits.
      </p>

      <Theorem title="distance to singularity">
        <p>
          The smallest <M>{"\\|E\\|_2"}</M> making A + E singular is <M>{"\\sigma_n"}</M>, so the relative distance{" "}
          <M>{"\\min\\|E\\|_2/\\|A\\|_2"}</M> is <M>{"1/\\kappa_2(A)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A singular A + E has <M>{"\\sigma_n(A + E) = 0"}</M>, and by Weyl&apos;s inequality for singular values{" "}
          <M>{"\\sigma_n(A) \\le \\sigma_n(A + E) + \\|E\\|_2 = \\|E\\|_2"}</M>. The choice{" "}
          <M>{"E = -\\sigma_n u_nv_n^\\top"}</M> attains it.
        </p>
      </Proof>
      <Code>{COND}</Code>

      <Theorem title="gradient descent on a quadratic">
        <p>
          Let A be symmetric positive definite with eigenvalues in{" "}
          <M>{"[\\lambda_{\\min}, \\lambda_{\\max}]"}</M>, and <M>{"f(x) = \\tfrac12x^\\top Ax - b^\\top x"}</M>. Gradient
          descent <M>{"x_{k+1} = x_k - \\eta(Ax_k - b)"}</M> with{" "}
          <M>{"\\eta = 2/(\\lambda_{\\min} + \\lambda_{\\max})"}</M> satisfies{" "}
          <M>{"\\|x_k - x^*\\| \\le \\left(\\frac{\\kappa - 1}{\\kappa + 1}\\right)^k\\|x_0 - x^*\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The error <M>{"e_k = x_k - x^*"}</M> satisfies <M>{"e_{k+1} = (I - \\eta A)e_k"}</M>, and{" "}
          <M>{"I - \\eta A"}</M> is symmetric with eigenvalues <M>{"1 - \\eta\\lambda"}</M>, so{" "}
          <M>{"\\|e_{k+1}\\| \\le \\max_\\lambda|1 - \\eta\\lambda|\\,\\|e_k\\|"}</M>. The maximum over the interval is at an
          endpoint, and this η makes both endpoint values equal to{" "}
          <M>{"\\frac{\\lambda_{\\max} - \\lambda_{\\min}}{\\lambda_{\\max} + \\lambda_{\\min}} = \\frac{\\kappa - 1}{\\kappa + 1}"}</M>,
          the smallest possible maximum.
        </p>
      </Proof>
      <Code>{GD}</Code>

      <Remark title="squaring and preconditioning">
        <p>
          <M>{"\\kappa_2(A^\\top A) = \\kappa_2(A)^2"}</M>, because the singular values get squared: solving least squares
          through the normal equations doubles the digits lost, which is why QR or the SVD is preferred. Since about{" "}
          <M>{"\\kappa\\log(1/\\varepsilon)/2"}</M> gradient steps are needed, optimisers try to reduce the effective κ:
          feature standardisation, batch and layer normalisation, Adam&apos;s per-coordinate scaling and second-order methods
          are all forms of preconditioning, replacing A by <M>{"P^{-1/2}AP^{-1/2}"}</M> with smaller condition number.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kappa",
      rung: "check",
      prompt: <p>What is κ₂(diag(5, 0.05))?</p>,
      answer: { kind: "numeric", value: 100, tolerance: 1e-9 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>κ(A) = 10⁴ and the right-hand side has relative error 10⁻⁶. What is the worst-case relative error in x?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 1e-9 },
    },
    {
      key: "normal",
      rung: "apply",
      prompt: <p>For a matrix A with independent columns, what is κ₂(AᵀA)?</p>,
      answer: { kind: "choice", options: ["κ₂(A)²", "κ₂(A)", "√κ₂(A)", "always 1"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def cond2(A):
    s = np.linalg.svd(A, compute_uv=False)
    return float(s[0] / s[-1]) if s[-1] > 1e-14 * s[0] else float("inf")

def worst_rhs_perturbation(A):
    U = np.linalg.svd(A)[0]
    return U[:, 0], U[:, -1]

A = np.diag([100.0, 1.0])
print(cond2(A), cond2(np.array([[1.0, 2.0], [2.0, 4.0]])))
b, db = worst_rhs_perturbation(A)
x, dx = np.linalg.solve(A, b), np.linalg.solve(A, db)
print(np.abs(b), np.abs(db), round(np.linalg.norm(dx) / np.linalg.norm(x), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["100.0 inf\n[1. 0.] [0. 1.] 100.0", "100.0 inf\n[0. 1.] [1. 0.] 0.01", "100.0 0.0\n[1. 0.] [0. 1.] 100.0", "10.0 inf\n[1. 0.] [0. 1.] 10.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gd_quadratic(A, b, steps):
    lam = np.linalg.eigvalsh(A)
    eta = 2 / (lam[0] + lam[-1])
    x_star = np.linalg.solve(A, b)
    x, errs = np.zeros_like(b), []
    for _ in range(steps + 1):
        errs.append(np.linalg.norm(x - x_star))
        x = x - eta * (A @ x - b)
    return np.array(errs)

def predicted_rate(A):
    lam = np.linalg.eigvalsh(A)
    k = lam[-1] / lam[0]
    return float((k - 1) / (k + 1))

errs = gd_quadratic(np.diag([10.0, 1.0]), np.array([1.0, 1.0]), 3)
print(np.round(errs, 4), round(predicted_rate(np.diag([10.0, 1.0])), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.005  0.8223 0.6728 0.5504] 0.8182",
          "[1.005  0.9045 0.814  0.7326] 0.9",
          "[1.005  0.8223 0.6728 0.5504] 0.9",
          "[1.005  0.1005 0.0101 0.001 ] 0.8182",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cond2(A)</C>, σ₁/σₙ as a float, returning <C>float(&quot;inf&quot;)</C> when σₙ ≤ 10⁻¹⁴σ₁, and{" "}
          <C>worst_rhs_perturbation(A)</C>, returning unit vectors (b, δb) for which the relative error bound is attained.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cond2(A):
    return float(np.abs(A).max() / np.abs(A).min())

def worst_rhs_perturbation(A):
    n = len(A)
    return np.eye(n)[0], np.eye(n)[0]
`,
        solution: COND,
        tests: [
          { name: "cond", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(5, 5))
assert np.isclose(cond2(A), np.linalg.cond(A))
assert cond2(np.array([[1.0, 2.0], [2.0, 4.0]])) == float("inf")
assert np.isclose(cond2(np.diag([5.0, 0.05])), 100.0) and np.isclose(cond2(np.eye(3)), 1.0)` },
          { name: "worst case", code: `rng = np.random.default_rng(1)
A = rng.normal(size=(4, 4))
b, db = worst_rhs_perturbation(A)
x, dx = np.linalg.solve(A, b), np.linalg.solve(A, db)
amp = (np.linalg.norm(dx) / np.linalg.norm(x)) / (np.linalg.norm(db) / np.linalg.norm(b))
assert np.isclose(amp, np.linalg.cond(A))
assert np.isclose(np.linalg.norm(b), 1) and np.isclose(np.linalg.norm(db), 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gd_quadratic(A, b, steps)</C>: from x = 0, run the given number of gradient steps on ½xᵀAx − bᵀx with
          η = 2/(λ_min + λ_max), and return the array of errors ‖x_k − x*‖ for k = 0, …, steps. Also write{" "}
          <C>predicted_rate(A)</C>, (κ − 1)/(κ + 1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_quadratic(A, b, steps):
    return np.zeros(steps + 1)

def predicted_rate(A):
    return 0.0
`,
        solution: `import numpy as np

${GD}`,
        tests: [
          { name: "diagonal", code: `errs = gd_quadratic(np.diag([10.0, 1.0]), np.array([1.0, 1.0]), 3)
assert len(errs) == 4 and np.allclose(errs, 1.01 ** 0.5 * (9 / 11) ** np.arange(4))
assert np.isclose(predicted_rate(np.diag([10.0, 1.0])), 9 / 11)` },
          { name: "rate bound", code: `rng = np.random.default_rng(2)
Q, _ = np.linalg.qr(rng.normal(size=(5, 5)))
A = Q @ np.diag([50.0, 20.0, 5.0, 2.0, 1.0]) @ Q.T
errs = gd_quadratic(A, rng.normal(size=5), 40)
r = predicted_rate(A)
assert all(errs[k + 1] <= r * errs[k] + 1e-12 for k in range(40))
assert errs[-1] < errs[0]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if Ax = b (b ≠ 0, A invertible) and A(x + δx) = b + δb, then ‖δx‖/‖x‖ ≤ ‖A‖‖A⁻¹‖ · ‖δb‖/‖b‖ for any
          operator norm.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Derives δx = A⁻¹δb and bounds ‖δx‖ ≤ ‖A⁻¹‖‖δb‖.",
          "Uses ‖b‖ = ‖Ax‖ ≤ ‖A‖‖x‖ to get 1/‖x‖ ≤ ‖A‖/‖b‖.",
          "Multiplies the two inequalities to obtain the bound.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          Gradient descent with the optimal fixed step on a quadratic with κ = 10 contracts the error by 9/11 per step. What
          is the smallest number of steps that guarantees the error has shrunk by a factor of 10⁶?
        </p>
      ),
      answer: { kind: "numeric", value: 69 },
    },
  ],

  teachBack:
    "Explain to a friend what the condition number of a matrix is, why it bounds the relative error of a linear solve, and why it also sets the speed of gradient descent on a quadratic.",

  glimpse: (
    <>
      <p>
        This ends the chapter on norms and perturbation. The next chapter turns to matrices with structure: projections,
        orthogonal and unitary matrices, circulant and Toeplitz matrices, low-rank plus diagonal and Kronecker products.
      </p>
      <p>
        Orthogonal matrices have κ = 1, the best possible, which is why algorithms built from them (QR, Householder, Givens)
        never amplify rounding errors, and why orthogonal initialisation keeps deep linear networks well conditioned.
      </p>
    </>
  ),
};
