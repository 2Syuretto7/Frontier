import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NsPlateauViz } from "@/components/viz/NsPlateauViz";
import type { LessonContent } from "@/lib/types";

const NI = `import numpy as np

def ns_inverse(A, iters):
    X = A.T / (np.linalg.norm(A, 1) * np.linalg.norm(A, np.inf))
    I = np.eye(len(A))
    for _ in range(iters):
        X = X @ (2 * I - A @ X)
    return X

def ns_residuals(A, iters):
    X = A.T / (np.linalg.norm(A, 1) * np.linalg.norm(A, np.inf))
    I = np.eye(len(A)); out = []
    for _ in range(iters):
        out.append(np.linalg.norm(I - A @ X, 2))
        X = X @ (2 * I - A @ X)
    return out`;

const NR = `import numpy as np

def ns_inv_sqrt(A, iters):
    c = np.linalg.norm(A)
    I = np.eye(len(A))
    Y, Z = A / c, I.copy()
    for _ in range(iters):
        T = 0.5 * (3 * I - Z @ Y)
        Y, Z = Y @ T, T @ Z
    return Y * np.sqrt(c), Z / np.sqrt(c)

def ns_sign(A, iters):
    X = A / np.linalg.norm(A)
    for _ in range(iters):
        X = 1.5 * X - 0.5 * X @ X @ X
    return X`;

export const lesson: LessonContent = {
  id: "m11.7.3",
  minutes: 50,
  links: {
    requires: ["m11.7.2", "m2.5.4"],
    revisits: ["m3.8.3"],
    foreshadows: ["m11.7.4", "m14.3.4"],
  },

  puzzle: (
    <>
      <p>
        Early computers had no division instruction, and some GPU kernels still avoid it. The reciprocal 1/a can be found
        with multiplications alone: x ← x(2 − ax) converges to 1/a, doubling the number of correct digits at each step. The
        matrix version X ← X(2I − AX) inverts a matrix using nothing but matrix products, which GPUs perform at close to
        peak speed. Yet for a diagonal matrix with condition number 1000 it needs 25 steps to reach ten digits, while for
        condition number 10 it needs 12. If convergence is quadratic, why does the count depend on κ at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Quadratic convergence is a statement about the end game: once the residual is small it squares at each step. The
        start is different. Each eigenvalue t of AX is sent to t(2 − t), which roughly doubles a small t, so an eigenvalue
        that starts near 1/κ² needs about log₂κ² = 2 log₂κ doublings before the squaring takes over. Iterations built from
        matrix products are cheap per step but pay this plateau, and the next lesson shows how to shorten it with a better
        polynomial.
      </p>
      <NsPlateauViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Newton–Schulz iteration for the inverse">
        <p>
          Newton&apos;s method on <M>{"f(x) = 1/x - a"}</M> gives <M>{"x - f(x)/f'(x) = x + (1/x - a)x^2 = x(2 - ax)"}</M>, with
          no division. The matrix analogue is
        </p>
        <MD>{"X_{k+1} = X_k(2I - AX_k), \\qquad R_k = I - AX_k."}</MD>
      </Definition>

      <Theorem title="the residual squares">
        <p>
          <M>{"R_{k+1} = R_k^2"}</M>. Hence <M>{"R_k = R_0^{2^k}"}</M>, and if <M>{"\\|R_0\\| < 1"}</M> in a submultiplicative
          norm then <M>{"\\|R_k\\| \\le \\|R_0\\|^{2^k} \\to 0"}</M> and <M>{"X_k = A^{-1}(I - R_k) \\to A^{-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"AX_{k+1} = AX_k(2I - AX_k) = 2AX_k - (AX_k)^2"}</M>, so{" "}
          <M>{"I - AX_{k+1} = I - 2AX_k + (AX_k)^2 = (I - AX_k)^2"}</M>. Induction gives <M>{"R_k = R_0^{2^k}"}</M>, and
          submultiplicativity gives the bound. Finally <M>{"AX_k = I - R_k"}</M>, so <M>{"X_k = A^{-1}(I - R_k)"}</M>.
        </p>
      </Proof>

      <Theorem title="a safe starting point">
        <p>
          For nonsingular A, <M>{"X_0 = A^\\top/(\\|A\\|_1\\|A\\|_\\infty)"}</M> gives{" "}
          <M>{"\\|R_0\\|_2 = 1 - \\sigma_{\\min}^2/(\\|A\\|_1\\|A\\|_\\infty) < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write c = ‖A‖₁‖A‖∞. Then <M>{"AX_0 = AA^\\top/c"}</M> is symmetric with eigenvalues <M>{"\\sigma_i^2/c"}</M>. Since{" "}
          <M>{"\\|A\\|_2^2 = \\rho(A^\\top A) \\le \\|A^\\top A\\|_1 \\le \\|A^\\top\\|_1\\|A\\|_1 = \\|A\\|_\\infty\\|A\\|_1"}</M>, these
          eigenvalues lie in (0, 1], so the eigenvalues of the symmetric <M>{"R_0"}</M> lie in{" "}
          <M>{"[0, 1 - \\sigma_{\\min}^2/c]"}</M>.
        </p>
        <Code>{NI}</Code>
      </Proof>

      <Remark title="the plateau and when it pays">
        <p>
          With this start the worst eigenvalue of <M>{"R_0"}</M> is about <M>{"1 - 1/\\kappa^2"}</M>, and{" "}
          <M>{"(1 - 1/\\kappa^2)^{2^k}"}</M> is small only once <M>{"2^k"}</M> is several times κ², so roughly{" "}
          <M>{"2\\log_2\\kappa"}</M> steps are spent before quadratic convergence begins. In the code, κ = 10, 100, 1000 need
          12, 18 and 25 steps. Each step costs two matrix products, about <M>{"4n^3"}</M> flops, against{" "}
          <M>{"\\tfrac{2}{3}n^3"}</M> for LU, so from a cold start Newton–Schulz does far more arithmetic. It wins when products
          are much faster than factorisations (GPUs, low precision, batches of small matrices) and above all when a good
          starting guess exists, such as last step&apos;s inverse of a slowly changing matrix: then one or two steps suffice.
        </p>
      </Remark>

      <Theorem title="coupled Newton–Schulz for the inverse square root">
        <p>
          Newton on <M>{"1/z^2 - a"}</M> gives the division-free <M>{"z \\leftarrow \\tfrac12 z(3 - az^2)"}</M>, and with{" "}
          <M>{"e = 1 - az^2"}</M> the error obeys <M>{"e_{k+1} = \\tfrac14 e_k^2(3 + e_k)"}</M>, which converges to 0 whenever{" "}
          <M>{"|e_0| < 1"}</M>. For symmetric positive definite A scaled so that <M>{"\\|I - A\\|_2 < 1"}</M>, the coupled form
        </p>
        <MD>{"Y_0 = A,\; Z_0 = I, \\qquad T_k = \\tfrac12(3I - Z_kY_k), \\quad Y_{k+1} = Y_kT_k, \\quad Z_{k+1} = T_kZ_k"}</MD>
        <p>
          gives <M>{"Y_k \\to A^{1/2}"}</M> and <M>{"Z_k \\to A^{-1/2}"}</M> using only products.
        </p>
      </Theorem>
      <Proof>
        <p>
          Scalar step: with u = az², <M>{"1 - \\tfrac14 u(3 - u)^2 = \\tfrac14(4 - 9u + 6u^2 - u^3) = \\tfrac14(1 - u)^2(4 - u)"}</M>,
          and 4 − u = 3 + e. For |e| &lt; 1 the factor (3 + e)/4 is below 1, so <M>{"|e_{k+1}| < e_k^2 < |e_k|"}</M> and the
          errors fall to 0, quadratically at the end. Matrix form: by induction <M>{"Z_k = p_k(A)"}</M> and{" "}
          <M>{"Y_k = Ap_k(A)"}</M> for a polynomial <M>{"p_k"}</M>, since <M>{"T_k = \\tfrac12(3I - Ap_k(A)^2)"}</M> is again a
          polynomial in A. All these commute, so in the eigenbasis of A each eigenvalue λ has{" "}
          <M>{"p_{k+1}(\\lambda) = \\tfrac12 p_k(\\lambda)(3 - \\lambda p_k(\\lambda)^2)"}</M>, the scalar iteration from z = 1,
          whose error 1 − λ is below 1 in size. So <M>{"p_k(\\lambda) \\to \\lambda^{-1/2}"}</M>. Carrying Y and Z together,
          as in Denman–Beavers, keeps rounding errors from being amplified. The code divides A by its Frobenius norm, which is
          at least ‖A‖₂, and rescales at the end.
        </p>
      </Proof>

      <Remark title="the sign function">
        <p>
          For symmetric nonsingular A, <M>{"\\mathrm{sign}(A) = A(A^2)^{-1/2} = V\\,\\mathrm{sign}(\\Lambda)V^\\top"}</M>. Track z ≈ (s²)^(−1/2)
          with the scalar step z ← z(3 − s²z²)/2; then x = sz is multiplied by the same factor, which gives the cubic{" "}
          <M>{"X \\leftarrow \\tfrac12 X(3I - X^2)"}</M>, which sends each eigenvalue s to <M>{"\\tfrac12 s(3 - s^2)"}</M>. Its
          fixed points are 0 and ±1, and from <M>{"X_0 = A/\\|A\\|_F"}</M> every eigenvalue moves to its sign. Small
          eigenvalues only grow by a factor of about 3/2 per step: in the code the eigenvalue 10⁻³ is still 0.019 after 10
          steps, and only reaches 1 by step 30. The same plateau again.
        </p>
        <Code>{NR}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "recip",
      rung: "check",
      prompt: <p>Run x ← x(2 − 4x) from x₀ = 0.1. What is x₂?</p>,
      answer: { kind: "numeric", value: 0.2176, tolerance: 0.00005 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>If ‖I − AX₀‖ = 0.5 in a submultiplicative norm, what is the Newton–Schulz bound on ‖I − AX₃‖? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0039, tolerance: 0.0001 },
    },
    {
      key: "plateau",
      rung: "apply",
      prompt: <p>Starting from X₀ = Aᵀ/(‖A‖₁‖A‖∞), why does Newton–Schulz need roughly 2 log₂κ steps before converging fast?</p>,
      answer: {
        kind: "choice",
        options: [
          "The smallest eigenvalue of AX₀ is about 1/κ², and t ← t(2 − t) only roughly doubles it each step until it nears 1",
          "Each step loses a fixed number of digits to rounding when A is ill-conditioned",
          "The residual must first become non-symmetric before it can be squared",
          "Matrix products are inexact for ill-conditioned matrices, so many steps are wasted",
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

def ns_inverse(A, iters):
    X = A.T / (np.linalg.norm(A, 1) * np.linalg.norm(A, np.inf))
    I = np.eye(len(A))
    for _ in range(iters):
        X = X @ (2 * I - A @ X)
    return X

def ns_residuals(A, iters):
    X = A.T / (np.linalg.norm(A, 1) * np.linalg.norm(A, np.inf))
    I = np.eye(len(A)); out = []
    for _ in range(iters):
        out.append(np.linalg.norm(I - A @ X, 2))
        X = X @ (2 * I - A @ X)
    return out

A = np.array([[4.0, 1.0], [2.0, 3.0]]); r = ns_residuals(A, 5)
print(np.allclose(ns_inverse(A, 10), np.linalg.inv(A)), all(r[k + 1] <= r[k] ** 2 + 1e-15 for k in range(4)))
steps = []
for kappa in [10.0, 100.0, 1000.0]:
    r = ns_residuals(np.diag([1.0, 1.0 / kappa]), 30)
    steps.append(next(k for k, v in enumerate(r) if v < 1e-10))
print(steps)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True True\n[12, 18, 25]", "True True\n[4, 7, 10]", "True True\n[12, 12, 12]", "True False\n[12, 18, 25]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ns_inv_sqrt(A, iters):
    c = np.linalg.norm(A)
    I = np.eye(len(A))
    Y, Z = A / c, I.copy()
    for _ in range(iters):
        T = 0.5 * (3 * I - Z @ Y)
        Y, Z = Y @ T, T @ Z
    return Y * np.sqrt(c), Z / np.sqrt(c)

def ns_sign(A, iters):
    X = A / np.linalg.norm(A)
    for _ in range(iters):
        X = 1.5 * X - 0.5 * X @ X @ X
    return X

A = np.array([[5.0, 2.0], [2.0, 2.0]]); Y, Z = ns_inv_sqrt(A, 30)
print(np.round(Y @ Y, 6) + 0.0, np.allclose(Y @ Z, np.eye(2)))
D = np.diag([3.0, -0.5, 1e-3])
print(np.round(np.diag(ns_sign(D, 10)), 3) + 0.0, np.round(np.diag(ns_sign(D, 30)), 3) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[5. 2.]\n [2. 2.]] True\n[ 1.    -1.     0.019] [ 1. -1.  1.]",
          "[[5. 2.]\n [2. 2.]] True\n[ 1. -1.  1.] [ 1. -1.  1.]",
          "[[5. 2.]\n [2. 2.]] False\n[ 1.    -1.     0.019] [ 1. -1.  1.]",
          "[[5. 2.]\n [2. 2.]] True\n[ 1.    -1.     0.019] [ 1.    -1.     0.019]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ns_inverse(A, iters)</C>, running Newton–Schulz from X₀ = Aᵀ/(‖A‖₁‖A‖∞), and{" "}
          <C>ns_residuals(A, iters)</C>, returning the list of ‖I − AX_k‖₂ for k = 0, …, iters − 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ns_inverse(A, iters):
    return A

def ns_residuals(A, iters):
    return []
`,
        solution: NI,
        tests: [
          { name: "inverse", code: `A = np.random.default_rng(48).normal(size=(5, 5)) + 3 * np.eye(5)
assert np.allclose(ns_inverse(A, 60) @ A, np.eye(5), atol=1e-8)
assert np.allclose(ns_inverse(A, 0), A.T / (np.linalg.norm(A, 1) * np.linalg.norm(A, np.inf)))` },
          { name: "residuals", code: `r = ns_residuals(np.diag([1.0, 0.5]), 4)
assert len(r) == 4 and np.allclose(r, [0.75 ** (2 ** k) for k in range(4)])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ns_inv_sqrt(A, iters)</C> for symmetric positive definite A, scaling by c = ‖A‖_F, running the coupled
          iteration and returning (A^(1/2), A^(−1/2)), and <C>ns_sign(A, iters)</C>, running X ← (3X − X³)/2 from A/‖A‖_F.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ns_inv_sqrt(A, iters):
    return A, np.eye(len(A))

def ns_sign(A, iters):
    return A
`,
        solution: NR,
        tests: [
          { name: "invsqrt", code: `Q, _ = np.linalg.qr(np.random.default_rng(49).normal(size=(4, 4))); lam = np.logspace(1, -1, 4)
A = (Q * lam) @ Q.T; S = (Q * np.sqrt(lam)) @ Q.T; Y, Z = ns_inv_sqrt(A, 40)
assert np.allclose(Y, S) and np.allclose(Z, np.linalg.inv(S))` },
          { name: "sign", code: `Q, _ = np.linalg.qr(np.random.default_rng(50).normal(size=(4, 4)))
D = (Q * np.array([2.0, -1.0, 0.5, -3.0])) @ Q.T
assert np.allclose(ns_sign(D, 40), (Q * np.array([1.0, -1.0, 1.0, -1.0])) @ Q.T)
assert np.allclose(ns_sign(-2 * np.eye(3), 30), -np.eye(3))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For the iteration X_(k+1) = X_k(2I − AX_k) with R_k = I − AX_k, prove that R_(k+1) = R_k², and deduce that if
          ‖R₀‖ &lt; 1 in a submultiplicative norm then X_k → A⁻¹.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Expands AX_(k+1) = 2AX_k − (AX_k)² and so I − AX_(k+1) = (I − AX_k)².",
          "Uses induction and submultiplicativity to get ‖R_k‖ ≤ ‖R₀‖^(2^k), which tends to 0.",
          "Concludes from AX_k = I − R_k that X_k = A⁻¹(I − R_k) → A⁻¹ (A is invertible since ‖I − AX₀‖ < 1).",
        ],
      },
    },
    {
      key: "slow",
      rung: "stretch",
      prompt: <p>Apply s ← s(3 − s²)/2 starting from s₀ = 0.001. After how many steps does s first exceed 0.5?</p>,
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend how Newton–Schulz inverts a matrix with products alone, why its residual squares at each step, why ill-conditioning shows up as a plateau of about 2 log₂κ steps rather than slower final convergence, and how the same idea gives inverse square roots and the matrix sign function.",

  glimpse: (
    <>
      <p>
        The cubic X ← (3X − X³)/2 makes sense for rectangular matrices if X³ is read as XXᵀX: it then drives every singular
        value to 1 and converges to the polar factor UVᵀ. The next lesson studies that map and how a tuned quintic shortens
        the plateau, which is how the Muon optimiser orthogonalises its updates.
      </p>
    </>
  ),
};
