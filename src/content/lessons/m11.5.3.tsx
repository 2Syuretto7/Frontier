import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PrecondSpectrumViz } from "@/components/viz/PrecondSpectrumViz";
import type { LessonContent } from "@/lib/types";

const PCG = `import numpy as np

def pcg(matvec, b, minv, tol=1e-10, maxiter=1000):
    x, r = np.zeros_like(b), b.copy()
    z = minv(r)
    p, rz = z.copy(), float(r @ z)
    for k in range(maxiter):
        if np.linalg.norm(r) <= tol * np.linalg.norm(b):
            return x, k
        Ap = matvec(p)
        alpha = rz / float(p @ Ap)
        x, r = x + alpha * p, r - alpha * Ap
        z = minv(r)
        rz_new = float(r @ z)
        p, rz = z + (rz_new / rz) * p, rz_new
    return x, maxiter

def scaled_spd(n, spread, rng):
    G = rng.normal(size=(n, n))
    C = G @ G.T / n + np.eye(n)
    d = np.logspace(0, spread, n)
    return d[:, None] * C * d[None, :]

def jacobi(A):
    d = np.diag(A).copy()
    return lambda r: r / d`;

const SPEC = `import numpy as np

def precond_cond(A, M):
    Li = np.linalg.inv(np.linalg.cholesky(M))
    e = np.linalg.eigvalsh(Li @ A @ Li.T)
    return float(e[-1] / e[0])

def block_diag_part(A, bs):
    M = np.zeros_like(A)
    for i in range(0, A.shape[0], bs):
        M[i:i + bs, i:i + bs] = A[i:i + bs, i:i + bs]
    return M`;

export const lesson: LessonContent = {
  id: "m11.5.3",
  minutes: 50,
  links: {
    requires: ["m11.5.2"],
    revisits: ["m10.5.4", "m5.5.2"],
    foreshadows: ["m11.7.2"],
  },

  puzzle: (
    <>
      <p>
        A regression problem has one feature measured in millimetres and another in kilometres. The normal-equations
        matrix has condition number around 10⁶ and conjugate gradient fails to converge in a thousand steps. Dividing each
        row and column by the square root of its diagonal entry, one line of code that costs nothing, brings CG down to 28
        steps. On a different matrix the same trick does nothing at all. What exactly does such a rescaling fix, and what
        would fix the rest?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        CG&apos;s speed is governed by the spread of the eigenvalues, and that spread is partly an accident of how the
        problem was written down. If M is a cheap approximation to A, solving with M⁻¹A instead of A changes nothing about
        the answer but can change the spread completely: if M were A itself, every eigenvalue would be 1. A preconditioner
        is a compromise between being close to A and being cheap to apply. Dividing by the diagonal fixes bad units
        exactly; coupling between unknowns needs a richer M.
      </p>
      <PrecondSpectrumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="preconditioned conjugate gradient">
        <p>
          Let M be symmetric positive definite with <M>{"M = LL^\\top"}</M>. CG applied to{" "}
          <M>{"(L^{-1}AL^{-\\top})y = L^{-1}b"}</M>, with <M>{"x = L^{-\\top}y"}</M>, can be rewritten in terms of x so that
          only products with A and solves with M appear: with <M>{"z_k = M^{-1}r_k"}</M>,
        </p>
        <MD>{"\\alpha_k = \\frac{r_k^\\top z_k}{p_k^\\top Ap_k},\\ \\ x_{k+1} = x_k + \\alpha_kp_k,\\ \\ r_{k+1} = r_k - \\alpha_kAp_k,\\ \\ p_{k+1} = z_{k+1} + \\frac{r_{k+1}^\\top z_{k+1}}{r_k^\\top z_k}p_k."}</MD>
        <p>L is never needed; only the action of <M>{"M^{-1}"}</M> on a vector.</p>
      </Definition>

      <Theorem title="what governs convergence">
        <p>
          <M>{"M^{-1}A"}</M> is similar to the symmetric positive definite <M>{"L^{-1}AL^{-\\top}"}</M>, so its eigenvalues are
          real and positive, and PCG satisfies the CG bound with <M>{"\\kappa = \\lambda_{\\max}(M^{-1}A)/\\lambda_{\\min}(M^{-1}A)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"L^{-\\top}(L^{-1}AL^{-\\top})L^\\top = L^{-\\top}L^{-1}A = (LL^\\top)^{-1}A = M^{-1}A"}</M>, a similarity. The
          matrix <M>{"L^{-1}AL^{-\\top}"}</M> is symmetric and <M>{"y^\\top L^{-1}AL^{-\\top}y = (L^{-\\top}y)^\\top A(L^{-\\top}y) > 0"}</M>{" "}
          for y ≠ 0. For the rewriting, set <M>{"\\hat r = L^{-1}r"}</M> and <M>{"\\hat p = L^\\top p"}</M>; then{" "}
          <M>{"\\hat r^\\top\\hat r = r^\\top M^{-1}r = r^\\top z"}</M> and <M>{"\\hat p^\\top(L^{-1}AL^{-\\top})\\hat p = p^\\top Ap"}</M>, and
          substituting into plain CG gives the recurrences above.
        </p>
      </Proof>

      <Theorem title="Jacobi preconditioning removes scaling">
        <p>
          If A = DCD with D positive diagonal, then the Jacobi-scaled matrix{" "}
          <M>{"\\mathrm{diag}(A)^{-1/2}A\\,\\mathrm{diag}(A)^{-1/2} = \\mathrm{diag}(C)^{-1/2}C\\,\\mathrm{diag}(C)^{-1/2}"}</M>{" "}
          does not depend on D.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{diag}(A) = D\\,\\mathrm{diag}(C)D"}</M>, so{" "}
          <M>{"\\mathrm{diag}(A)^{-1/2} = D^{-1}\\mathrm{diag}(C)^{-1/2}"}</M>, since diagonal matrices commute, and the D factors
          cancel. Van der Sluis showed more: among all diagonal scalings, the one giving unit diagonal is within a factor n
          of the best possible condition number. In the code, a 200 × 200 matrix with variables on scales spanning 10³ makes
          plain CG run out its 1000 iterations, while Jacobi-preconditioned CG converges in 28.
        </p>
        <Code>{PCG}</Code>
      </Proof>

      <Remark title="when the diagonal is not enough">
        <p>
          The 60 × 60 second-difference matrix (2 on the diagonal, −1 beside it), a one-dimensional Laplacian, has a nearly
          constant diagonal, so Jacobi changes nothing: κ stays at 510. Its ill conditioning comes from coupling, not units.
          Keeping the three diagonal 20 × 20 blocks, block Jacobi, cuts κ to 32, because each block captures the coupling
          inside it. Stronger general-purpose choices are incomplete Cholesky (run Cholesky but drop fill-in outside a
          sparsity pattern) and multigrid, which for Laplacians gives κ bounded independently of the grid size. The code
          also checks that the eigenvalues of <M>{"M^{-1}A"}</M> coincide with those of <M>{"L^{-1}AL^{-\\top}"}</M>.
        </p>
        <Code>{SPEC}</Code>
      </Remark>

      <Remark title="optimisers are preconditioners">
        <p>
          Gradient descent with update <M>{"x \\leftarrow x - \\eta M^{-1}\\nabla f"}</M> is gradient descent on the rescaled
          variables <M>{"L^\\top x"}</M>, and on a quadratic its rate depends on <M>{"\\kappa(M^{-1}H)"}</M>. Newton&apos;s method
          is the ideal M = H. Adagrad and Adam use a diagonal M built from running averages of squared gradients, a Jacobi-like
          correction for badly scaled parameters. K-FAC and Shampoo use Kronecker-factored block-diagonal M, block Jacobi at
          the level of layers, and Shampoo needs inverse fourth roots of its factors, which the matrix-function chapter
          computes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "jac2",
      rung: "check",
      prompt: <p>Jacobi-precondition A with rows (4, 1) and (1, 9). What is the condition number of the scaled matrix?</p>,
      answer: { kind: "numeric", value: 1.4, tolerance: 0.0001 },
    },
    {
      key: "sqrt",
      rung: "check",
      prompt: <p>A preconditioner lowers κ from 10⁶ to 10. By about what factor does √κ, which governs the CG iteration count, fall?</p>,
      answer: { kind: "numeric", value: 316.23, tolerance: 0.05 },
    },
    {
      key: "good",
      rung: "apply",
      prompt: <p>Which property matters most for a preconditioner M in PCG?</p>,
      answer: {
        kind: "choice",
        options: [
          "The eigenvalues of M⁻¹A are tightly clustered, and applying M⁻¹ to a vector is cheap",
          "M has the same sparsity pattern as A",
          "M is diagonal",
          "M is as close as possible to the identity",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def pcg(matvec, b, minv, tol=1e-10, maxiter=1000):
    x, r = np.zeros_like(b), b.copy()
    z = minv(r)
    p, rz = z.copy(), float(r @ z)
    for k in range(maxiter):
        if np.linalg.norm(r) <= tol * np.linalg.norm(b):
            return x, k
        Ap = matvec(p)
        alpha = rz / float(p @ Ap)
        x, r = x + alpha * p, r - alpha * Ap
        z = minv(r)
        rz_new = float(r @ z)
        p, rz = z + (rz_new / rz) * p, rz_new
    return x, maxiter

def scaled_spd(n, spread, rng):
    G = rng.normal(size=(n, n))
    C = G @ G.T / n + np.eye(n)
    d = np.logspace(0, spread, n)
    return d[:, None] * C * d[None, :]

def jacobi(A):
    d = np.diag(A).copy()
    return lambda r: r / d

A = scaled_spd(200, 3, np.random.default_rng(0)); b = np.ones(200); mv = lambda v: A @ v
_, k0 = pcg(mv, b, lambda r: r); x, k1 = pcg(mv, b, jacobi(A))
print(k0, k1, np.allclose(A @ x, b, atol=1e-6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1000 28 True", "28 1000 True", "1000 28 False", "200 28 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def precond_cond(A, M):
    Li = np.linalg.inv(np.linalg.cholesky(M))
    e = np.linalg.eigvalsh(Li @ A @ Li.T)
    return float(e[-1] / e[0])

def block_diag_part(A, bs):
    M = np.zeros_like(A)
    for i in range(0, A.shape[0], bs):
        M[i:i + bs, i:i + bs] = A[i:i + bs, i:i + bs]
    return M

rng = np.random.default_rng(1); n = 60
T = np.diag(np.full(n, 2.0)) - np.diag(np.ones(n - 1), 1) - np.diag(np.ones(n - 1), -1)
A = T + np.diag(rng.uniform(0.0, 0.01, n))
print(round(np.linalg.cond(A)), round(precond_cond(A, np.diag(np.diag(A)))), round(precond_cond(A, block_diag_part(A, 20))))
M = block_diag_part(A, 20); Li = np.linalg.inv(np.linalg.cholesky(M))
print(np.allclose(np.sort(np.linalg.eigvals(np.linalg.solve(M, A)).real), np.linalg.eigvalsh(Li @ A @ Li.T)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["510 510 32\nTrue", "510 32 32\nTrue", "510 1 32\nTrue", "510 510 32\nFalse"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pcg(matvec, b, minv, tol=1e-10, maxiter=1000)</C>, returning (x, iterations used) and stopping when ‖r‖ ≤
          tol·‖b‖; <C>scaled_spd(n, spread, rng)</C>, returning DCD with C = GGᵀ/n + I and D = diag(logspace(0, spread, n));
          and <C>jacobi(A)</C>, returning the function r ↦ r / diag(A).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pcg(matvec, b, minv, tol=1e-10, maxiter=1000):
    return np.zeros_like(b), 0

def scaled_spd(n, spread, rng):
    return np.eye(n)

def jacobi(A):
    return lambda r: r
`,
        solution: PCG,
        tests: [
          { name: "solve", code: `rng = np.random.default_rng(27); A = scaled_spd(30, 2, rng); b = rng.normal(size=30)
assert np.allclose(A, A.T) and abs(A[29, 29] / A[0, 0]) > 1e3
x, k = pcg(lambda v: A @ v, b, jacobi(A))
assert np.allclose(A @ x, b, atol=1e-6 * np.linalg.norm(b)) and 0 < k < 60
assert np.allclose(jacobi(np.diag([2.0, 4.0]))(np.array([2.0, 2.0])), [1.0, 0.5])` },
          { name: "faster", code: `A = scaled_spd(80, 3, np.random.default_rng(28)); b = np.ones(80)
_, k0 = pcg(lambda v: A @ v, b, lambda r: r, maxiter=500); _, k1 = pcg(lambda v: A @ v, b, jacobi(A), maxiter=500)
assert k1 < k0 / 3 and k1 < 50` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>precond_cond(A, M)</C>, the condition number of L⁻¹AL⁻ᵀ with M = LLᵀ, and <C>block_diag_part(A, bs)</C>,
          which keeps the diagonal blocks of size bs and zeros everything else.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def precond_cond(A, M):
    return 1.0

def block_diag_part(A, bs):
    return A
`,
        solution: SPEC,
        tests: [
          { name: "blocks", code: `A = np.arange(16.0).reshape(4, 4); B = block_diag_part(A, 2)
assert np.array_equal(B, [[0.0, 1.0, 0.0, 0.0], [4.0, 5.0, 0.0, 0.0], [0.0, 0.0, 10.0, 11.0], [0.0, 0.0, 14.0, 15.0]])` },
          { name: "cond", code: `A = np.array([[4.0, 1.0], [1.0, 9.0]])
assert abs(precond_cond(A, np.diag([4.0, 9.0])) - 1.4) < 1e-12 and abs(precond_cond(A, A) - 1.0) < 1e-12
assert abs(precond_cond(A, np.eye(2)) - np.linalg.cond(A)) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A and M = LLᵀ be symmetric positive definite. Prove that M⁻¹A has real positive eigenvalues, the same as those of
          L⁻¹AL⁻ᵀ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows L⁻ᵀ(L⁻¹AL⁻ᵀ)Lᵀ = M⁻¹A, so the two matrices are similar and share eigenvalues.",
          "Shows L⁻¹AL⁻ᵀ is symmetric, so its eigenvalues are real.",
          "Shows it is positive definite via yᵀL⁻¹AL⁻ᵀy = (L⁻ᵀy)ᵀA(L⁻ᵀy) > 0 for y ≠ 0, so the eigenvalues are positive.",
        ],
      },
    },
    {
      key: "scaled",
      rung: "stretch",
      prompt: <p>What is the condition number of the Jacobi-scaled version of A with rows (100, 30) and (30, 25)?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a preconditioner does to the spectrum, why PCG needs only the action of M⁻¹, why Jacobi preconditioning exactly undoes bad units but cannot fix coupling, and how adaptive optimisers are preconditioners.",

  glimpse: (
    <>
      <p>
        So far every method touched the whole matrix, at least through products. The next chapter asks what can be learned
        from a few random products: randomised projections, low-rank approximations and trace estimates whose accuracy is
        guaranteed with high probability.
      </p>
    </>
  ),
};
