import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CgConvergenceViz } from "@/components/viz/CgConvergenceViz";
import type { LessonContent } from "@/lib/types";

const CG = `import numpy as np

def cg(matvec, b, iters):
    x, r = np.zeros_like(b), b.copy()
    p, rr = r.copy(), float(r @ r)
    for _ in range(iters):
        Ap = matvec(p)
        alpha = rr / float(p @ Ap)
        x = x + alpha * p
        r = r - alpha * Ap
        rr_new = float(r @ r)
        if rr_new == 0.0:
            break
        p = r + (rr_new / rr) * p
        rr = rr_new
    return x

def steepest(matvec, b, iters):
    x, r = np.zeros_like(b), b.copy()
    for _ in range(iters):
        Ar = matvec(r)
        a = float(r @ r) / float(r @ Ar)
        x, r = x + a * r, r - a * Ar
    return x

def a_error(A, x, xs):
    e = x - xs
    return float(np.sqrt(e @ A @ e))`;

const VEC = `import numpy as np

def cg_vectors(A, b, k):
    r = b.copy()
    p = r.copy()
    P, Rs = [], []
    for _ in range(k):
        P.append(p)
        Rs.append(r)
        Ap = A @ p
        alpha = (r @ r) / (p @ Ap)
        r_new = r - alpha * Ap
        p = r_new + (r_new @ r_new) / (r @ r) * p
        r = r_new
    return np.array(P).T, np.array(Rs).T

def off_diag_ratio(M):
    d = np.sqrt(np.abs(np.diag(M)))
    C = M / np.outer(d, d)
    return float(np.max(np.abs(C - np.diag(np.diag(C)))))`;

export const lesson: LessonContent = {
  id: "m11.5.2",
  minutes: 55,
  links: {
    requires: ["m11.5.1", "m11.3.2"],
    revisits: ["m10.5.4", "m10.6.1"],
    foreshadows: ["m11.5.3"],
  },

  puzzle: (
    <>
      <p>
        Steepest descent on a quadratic with condition number 100 can need about 700 steps to shrink its error by 10⁻⁶,
        zigzagging across the valley. Conjugate gradient, which costs the same per step, one matrix-vector product and a
        few dot products, needs about 70, and on a 100 × 100 system it is guaranteed to finish in at most 100 steps in exact
        arithmetic. It keeps only four vectors in memory. How can such a frugal method be optimal over everything reachable
        with its products?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Steepest descent undoes its own progress: each new direction partly re-explores old ones. Conjugate gradient
        chooses directions that are orthogonal in the geometry of A, so minimising along a new direction never spoils
        the minimisation along the previous ones. After k steps the iterate is the best point in the whole k-dimensional
        Krylov subspace, measured in the energy norm, and the symmetry of A lets each new direction be made conjugate to
        all previous ones using only the last one: a short recurrence, just like Lanczos.
      </p>
      <CgConvergenceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the conjugate gradient method">
        <p>
          For symmetric positive definite A, solving Ax = b is minimising{" "}
          <M>{"\\varphi(x) = \\tfrac12x^\\top Ax - b^\\top x"}</M>, and{" "}
          <M>{"\\varphi(x) - \\varphi(x_*) = \\tfrac12\\|x - x_*\\|_A^2"}</M> with <M>{"\\|e\\|_A^2 = e^\\top Ae"}</M>. Starting
          from <M>{"x_0 = 0"}</M>, <M>{"r_0 = p_0 = b"}</M>, repeat
        </p>
        <MD>{"\\alpha_k = \\frac{r_k^\\top r_k}{p_k^\\top Ap_k},\\quad x_{k+1} = x_k + \\alpha_kp_k,\\quad r_{k+1} = r_k - \\alpha_kAp_k,\\quad p_{k+1} = r_{k+1} + \\frac{r_{k+1}^\\top r_{k+1}}{r_k^\\top r_k}p_k."}</MD>
      </Definition>

      <Theorem title="conjugate directions decouple the minimisation">
        <p>
          If <M>{"p_0, \\ldots, p_{k-1}"}</M> are nonzero and A-conjugate (<M>{"p_i^\\top Ap_j = 0"}</M> for i ≠ j), then the
          minimiser of φ over their span is <M>{"\\sum_i c_ip_i"}</M> with <M>{"c_i = p_i^\\top b/p_i^\\top Ap_i"}</M>, so it is
          reached by exact line searches along the directions one at a time.
        </p>
      </Theorem>
      <Proof>
        <p>
          For <M>{"x = \\sum c_ip_i"}</M>, the cross terms in <M>{"x^\\top Ax"}</M> vanish, so{" "}
          <M>{"\\varphi(x) = \\sum_i\\left(\\tfrac12c_i^2\\,p_i^\\top Ap_i - c_i\\,p_i^\\top b\\right)"}</M>, a sum of separate
          one-variable quadratics, each minimised at the stated <M>{"c_i"}</M>. A line search along <M>{"p_j"}</M> changes only{" "}
          <M>{"c_j"}</M>, so it cannot undo the earlier ones.
        </p>
      </Proof>

      <Theorem title="what CG computes">
        <p>
          Until the exact solution is reached, <M>{"\\mathrm{span}\\{p_0, \\ldots, p_{k-1}\\} = \\mathrm{span}\\{r_0, \\ldots, r_{k-1}\\} = \\mathcal K_k(A, b)"}</M>,
          the residuals are mutually orthogonal, the directions are A-conjugate, and{" "}
          <M>{"x_k = \\arg\\min_{x \\in \\mathcal K_k}\\|x - x_*\\|_A"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The spans grow by one Krylov dimension each step since <M>{"r_{k+1} = r_k - \\alpha_kAp_k"}</M>. Induction gives the
          orthogonality: the choice of <M>{"\\alpha_k"}</M> makes <M>{"r_{k+1} \\perp p_k"}</M> (and hence <M>{"\\perp r_k"}</M>),
          and for i &lt; k, <M>{"r_{k+1}^\\top r_i = r_k^\\top r_i - \\alpha_kp_k^\\top Ar_i = 0"}</M> because{" "}
          <M>{"Ar_i \\in \\mathrm{span}\\{p_0, \\ldots, p_{i+1}\\}"}</M>, to which <M>{"p_k"}</M> is A-conjugate when i + 1 &lt; k.
          The β coefficient is exactly what makes <M>{"p_{k+1}"}</M> A-conjugate to <M>{"p_k"}</M>, and conjugacy to the
          earlier directions holds automatically by the same argument, using symmetry of A. With conjugate directions
          spanning <M>{"\\mathcal K_k"}</M>, the previous theorem says the line searches give the minimiser of φ there,
          which is the minimiser of the A-norm error.
        </p>
      </Proof>

      <Theorem title="convergence">
        <p>With κ = κ₂(A),</p>
        <MD>{"\\frac{\\|x_k - x_*\\|_A}{\\|x_*\\|_A} \\leq \\min_{\\deg q \\leq k,\\ q(0) = 1}\\ \\max_i|q(\\lambda_i)| \\leq 2\\left(\\frac{\\sqrt\\kappa - 1}{\\sqrt\\kappa + 1}\\right)^k."}</MD>
      </Theorem>
      <Proof>
        <p>
          Every <M>{"x \\in \\mathcal K_k"}</M> has error <M>{"x - x_* = -q(A)x_*"}</M> for some q of degree at most k with q(0) =
          1, and CG achieves the smallest A-norm among them. Expanding <M>{"x_* = \\sum c_iu_i"}</M> in orthonormal eigenvectors,{" "}
          <M>{"\\|q(A)x_*\\|_A^2 = \\sum\\lambda_iq(\\lambda_i)^2c_i^2 \\leq \\max_i q(\\lambda_i)^2\\,\\|x_*\\|_A^2"}</M>. The final
          inequality is the Chebyshev bound on <M>{"[\\lambda_{\\min}, \\lambda_{\\max}]"}</M>. Steepest descent only achieves{" "}
          <M>{"((\\kappa - 1)/(\\kappa + 1))^k"}</M>, so CG replaces κ by √κ.
        </p>
        <p>
          In the code, κ = 100 with eigenvalues spread evenly: after 30 steps CG has reduced the error by 10^−2.9, better
          than the bound&apos;s 10^−2.3, while steepest descent manages only 10^−0.6. With three distinct eigenvalues, three
          steps solve the system exactly.
        </p>
        <Code>{CG}</Code>
      </Proof>

      <Remark title="finite precision">
        <p>
          In floating point the recurrences lose orthogonality just as Lanczos does, for the same reason: CG is Lanczos with
          an LU factorisation of the tridiagonal matrix folded in. For a 100 × 100 matrix with κ = 10⁴, residuals and
          directions are orthogonal and conjugate to roundoff after 10 steps, but not after 80. The method still converges,
          because each step remains a good local step, but the finite termination promise is lost and convergence is delayed,
          as if converged eigenvalues had to be found again. In practice CG is stopped when ‖r_k‖ ≤ tol · ‖b‖, often long
          before n steps, and its cost is one matrix-vector product and about 10n flops per step with four stored vectors.
        </p>
        <Code>{VEC}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "iters",
      rung: "check",
      prompt: (
        <p>
          How many CG iterations does the bound 2((√κ − 1)/(√κ + 1))ᵏ ≤ 10⁻⁶ require for κ = 10⁴? Give the real number k
          that makes it an equality.
        </p>
      ),
      answer: { kind: "numeric", value: 725.4, tolerance: 2 },
    },
    {
      key: "rate",
      rung: "check",
      prompt: <p>For κ = 100, what is the CG rate (√κ − 1)/(√κ + 1)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8182, tolerance: 0.0001 },
    },
    {
      key: "min",
      rung: "apply",
      prompt: <p>What does the k-th conjugate gradient iterate minimise over the Krylov subspace 𝒦ₖ(A, b)?</p>,
      answer: {
        kind: "choice",
        options: [
          "The A-norm of the error, equivalently the quadratic ½xᵀAx − bᵀx",
          "The 2-norm of the residual, as GMRES does",
          "The 2-norm of the error",
          "Nothing: it only takes a line search along the latest direction",
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

def cg(matvec, b, iters):
    x, r = np.zeros_like(b), b.copy()
    p, rr = r.copy(), float(r @ r)
    for _ in range(iters):
        Ap = matvec(p)
        alpha = rr / float(p @ Ap)
        x = x + alpha * p
        r = r - alpha * Ap
        rr_new = float(r @ r)
        if rr_new == 0.0:
            break
        p = r + (rr_new / rr) * p
        rr = rr_new
    return x

def steepest(matvec, b, iters):
    x, r = np.zeros_like(b), b.copy()
    for _ in range(iters):
        Ar = matvec(r)
        a = float(r @ r) / float(r @ Ar)
        x, r = x + a * r, r - a * Ar
    return x

def a_error(A, x, xs):
    e = x - xs
    return float(np.sqrt(e @ A @ e))

lam = np.linspace(1.0, 100.0, 100); A = np.diag(lam); b = np.ones(100); xs = b / lam; mv = lambda v: A @ v
e0 = a_error(A, np.zeros(100), xs)
print([round(float(np.log10(a_error(A, f(mv, b, 30), xs) / e0)), 1) for f in [cg, steepest]], round(np.log10(2 * (9 / 11) ** 30), 1))
A3 = np.diag(np.repeat([1.0, 10.0, 100.0], [30, 30, 40])); x = cg(lambda v: A3 @ v, b, 3)
print(np.allclose(A3 @ x, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-2.9, -0.6] -2.3\nTrue", "[-0.6, -2.9] -2.3\nTrue", "[-2.9, -0.6] -2.3\nFalse", "[-2.3, -0.6] -2.9\nTrue"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def cg_vectors(A, b, k):
    r = b.copy()
    p = r.copy()
    P, Rs = [], []
    for _ in range(k):
        P.append(p)
        Rs.append(r)
        Ap = A @ p
        alpha = (r @ r) / (p @ Ap)
        r_new = r - alpha * Ap
        p = r_new + (r_new @ r_new) / (r @ r) * p
        r = r_new
    return np.array(P).T, np.array(Rs).T

def off_diag_ratio(M):
    d = np.sqrt(np.abs(np.diag(M)))
    C = M / np.outer(d, d)
    return float(np.max(np.abs(C - np.diag(np.diag(C)))))

rng = np.random.default_rng(0); Q, _ = np.linalg.qr(rng.normal(size=(100, 100)))
A = Q @ np.diag(np.logspace(0, 4, 100)) @ Q.T; b = rng.normal(size=100)
for k in [10, 80]:
    P, R = cg_vectors(A, b, k)
    print(k, off_diag_ratio(P.T @ A @ P) < 1e-8, off_diag_ratio(R.T @ R) < 1e-8)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10 True True\n80 False False", "10 True True\n80 True True", "10 False False\n80 False False", "10 True False\n80 False False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cg(matvec, b, iters)</C> from x₀ = 0, stopping early if the residual becomes exactly zero;{" "}
          <C>steepest(matvec, b, iters)</C>, steepest descent with exact line search; and <C>a_error(A, x, xs)</C>, the
          A-norm of x − xs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cg(matvec, b, iters):
    return np.zeros_like(b)

def steepest(matvec, b, iters):
    return np.zeros_like(b)

def a_error(A, x, xs):
    return 0.0
`,
        solution: CG,
        tests: [
          { name: "exact", code: `rng = np.random.default_rng(25); G = rng.normal(size=(12, 12)); A = G @ G.T + 12 * np.eye(12); b = rng.normal(size=12)
assert np.allclose(cg(lambda v: A @ v, b, 12), np.linalg.solve(A, b))
assert abs(a_error(np.diag([4.0, 1.0]), np.array([1.0, 1.0]), np.array([0.0, 3.0])) - np.sqrt(8.0)) < 1e-12` },
          { name: "faster", code: `lam = np.linspace(1.0, 50.0, 60); A = np.diag(lam); b = np.ones(60); xs = b / lam; mv = lambda v: A @ v
ec, es = a_error(A, cg(mv, b, 15), xs), a_error(A, steepest(mv, b, 15), xs)
assert ec < 0.1 * es and es < a_error(A, np.zeros(60), xs)
assert np.allclose(cg(lambda v: np.diag([2.0, 2.0, 5.0]) @ v, np.ones(3), 10), [0.5, 0.5, 0.2])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cg_vectors(A, b, k)</C>, returning the matrices whose columns are the first k search directions and the
          first k residuals of CG from x₀ = 0, and <C>off_diag_ratio(M)</C>, the largest |mᵢⱼ|/√(|mᵢᵢ||mⱼⱼ|) over i ≠ j.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cg_vectors(A, b, k):
    return np.zeros((len(b), k)), np.zeros((len(b), k))

def off_diag_ratio(M):
    return 0.0
`,
        solution: VEC,
        tests: [
          { name: "ratio", code: `assert off_diag_ratio(np.diag([1.0, 4.0])) == 0.0 and abs(off_diag_ratio(np.array([[1.0, 1.0], [1.0, 4.0]])) - 0.5) < 1e-12` },
          { name: "conj", code: `rng = np.random.default_rng(26); G = rng.normal(size=(20, 20)); A = G @ G.T + 20 * np.eye(20); b = rng.normal(size=20)
P, R = cg_vectors(A, b, 6)
assert P.shape == (20, 6) and np.allclose(R[:, 0], b) and np.allclose(P[:, 0], b)
assert off_diag_ratio(P.T @ A @ P) < 1e-8 and off_diag_ratio(R.T @ R) < 1e-8` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be symmetric positive definite and p₀, …, p_(k−1) nonzero and A-conjugate. Prove that φ(x) = ½xᵀAx − bᵀx
          restricted to their span is minimised at Σ cᵢpᵢ with cᵢ = pᵢᵀb/(pᵢᵀApᵢ).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes a point of the span as x = Σ cᵢpᵢ and uses conjugacy to remove all cross terms in xᵀAx.",
          "Obtains φ(x) = Σ (½cᵢ² pᵢᵀApᵢ − cᵢ pᵢᵀb), a sum of independent one-variable quadratics.",
          "Minimises each using pᵢᵀApᵢ > 0 (positive definiteness), giving cᵢ = pᵢᵀb/(pᵢᵀApᵢ).",
        ],
      },
    },
    {
      key: "k100",
      rung: "stretch",
      prompt: <p>For κ = 100, what real k makes the CG bound 2((√κ − 1)/(√κ + 1))ᵏ equal to 10⁻⁶? Give one decimal.</p>,
      answer: { kind: "numeric", value: 72.3, tolerance: 0.2 },
    },
  ],

  teachBack:
    "Explain to a friend what conjugate directions are and why they make line searches independent, what CG minimises over the Krylov subspace, why its rate depends on √κ rather than κ, and what changes in floating point.",

  glimpse: (
    <>
      <p>
        CG&apos;s speed depends on the spectrum, and nothing forces us to keep the spectrum we were given. The next lesson
        transforms the system so its eigenvalues cluster, which is preconditioning, and connects it to the adaptive
        optimisers used to train networks.
      </p>
    </>
  ),
};
