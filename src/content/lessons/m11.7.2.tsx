import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NewtonSqrtViz } from "@/components/viz/NewtonSqrtViz";
import type { LessonContent } from "@/lib/types";

const SQ = `import numpy as np

def sqrtm_eig(A):
    lam, V = np.linalg.eigh(A)
    return (V * np.sqrt(lam)) @ V.T

def newton_sqrt(A, iters):
    X = np.eye(len(A))
    for _ in range(iters):
        X = 0.5 * (X + np.linalg.solve(X, A))
    return X

def db_sqrt(A, iters):
    Y, Z = A.copy(), np.eye(len(A))
    for _ in range(iters):
        Y, Z = 0.5 * (Y + np.linalg.inv(Z)), 0.5 * (Z + np.linalg.inv(Y))
    return Y, Z`;

const SH = `import numpy as np

def inv_root(A, p, eps):
    lam, V = np.linalg.eigh(A)
    return (V * (np.maximum(lam, 0.0) + eps) ** (-1.0 / p)) @ V.T

def shampoo_direction(G, L, R, eps):
    return inv_root(L, 4, eps) @ G @ inv_root(R, 4, eps)`;

export const lesson: LessonContent = {
  id: "m11.7.2",
  minutes: 50,
  links: {
    requires: ["m11.7.1", "m11.3.2"],
    revisits: ["m6.3.4", "m11.5.3"],
    foreshadows: ["m11.7.3", "m11.7.4"],
  },

  puzzle: (
    <>
      <p>
        Newton&apos;s method for √a, x ← (x + a/x)/2, is one of the oldest and most reliable algorithms there is. The same
        formula for a matrix, X ← (X + X⁻¹A)/2, converges quadratically in exact arithmetic to the square root of any
        positive definite matrix. Run it in double precision on a 6 × 6 matrix with condition number 10⁴: after 11 steps it
        is accurate to seven digits, and after 20 steps the error is a billion. Nothing about the matrix changed. What
        went wrong, and how does a two-line modification fix it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The matrix iteration is the scalar one applied to each eigenvalue, but only if every iterate commutes with A, which
        is true in exact arithmetic and false after the first rounding error. The part of the error that does not commute
        with A is not corrected by the iteration; it is multiplied at each step by factors that depend on ratios of
        eigenvalues and exceed 1 once the condition number is above 9. The coupled Denman–Beavers iteration tracks the
        square root and the inverse square root together, which makes the error map contract instead of expand. Inverse
        roots of this kind are what the Shampoo optimiser applies to its gradient statistics.
      </p>
      <NewtonSqrtViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the principal square root">
        <p>
          A symmetric positive definite A = VΛVᵀ has exactly one symmetric positive definite square root,{" "}
          <M>{"A^{1/2} = V\\Lambda^{1/2}V^\\top"}</M>. More generally{" "}
          <M>{"A^{-1/p} = V\\Lambda^{-1/p}V^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Existence: <M>{"(V\\Lambda^{1/2}V^\\top)^2 = V\\Lambda V^\\top"}</M> since <M>{"V^\\top V = I"}</M>. Uniqueness: if X is
          symmetric positive definite with X² = A, then <M>{"XA = X^3 = AX"}</M>, so X maps each eigenspace of A into itself.
          On the eigenspace for λ, X is symmetric positive definite with square λI, so all its eigenvalues there are √λ,
          and it equals √λ·I. That determines X.
        </p>
      </Proof>

      <Definition title="Newton's iteration">
        <p>Applying Newton&apos;s method to X² = A and assuming the iterates commute with A gives</p>
        <MD>{"X_0 = I, \\qquad X_{k+1} = \\tfrac12\\left(X_k + X_k^{-1}A\\right)."}</MD>
      </Definition>

      <Theorem title="in exact arithmetic it is Heron's method on each eigenvalue">
        <p>
          With <M>{"X_0 = I"}</M>, <M>{"X_k = V\\,\\mathrm{diag}(x_k(\\lambda_i))\\,V^\\top"}</M> where{" "}
          <M>{"x_0 = 1"}</M>, <M>{"x_{k+1} = \\tfrac12(x_k + \\lambda/x_k)"}</M>, and{" "}
          <M>{"x_{k+1} - \\sqrt\\lambda = \\frac{(x_k - \\sqrt\\lambda)^2}{2x_k}"}</M>, so convergence is quadratic.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction, if <M>{"X_k = Vf(\\Lambda)V^\\top"}</M> then <M>{"X_k^{-1}A = Vf(\\Lambda)^{-1}\\Lambda V^\\top"}</M>, and the
          average is again diagonal in the same basis, with entries given by the scalar recurrence. For the error,{" "}
          <M>{"x_{k+1} - \\sqrt\\lambda = \\frac{x_k^2 + \\lambda - 2x_k\\sqrt\\lambda}{2x_k} = \\frac{(x_k - \\sqrt\\lambda)^2}{2x_k}"}</M>.
          For x₀ = 1 &gt; 0 all <M>{"x_k"}</M> stay positive and, after the first step, at least √λ.
        </p>
      </Proof>

      <Remark title="instability">
        <p>
          Perturb <M>{"X_k = A^{1/2} + E"}</M> near convergence. To first order the next error is{" "}
          <M>{"\\tfrac12(E - A^{-1/2}EA^{1/2})"}</M>, and in the eigenbasis the (i, j) entry of E is multiplied by{" "}
          <M>{"\\tfrac12\\left(1 - \\sqrt{\\lambda_j/\\lambda_i}\\right)"}</M>. If some ratio <M>{"\\lambda_j/\\lambda_i"}</M>{" "}
          exceeds 9, that factor is larger than 1 in absolute value and rounding errors grow geometrically (Higham). In the
          code, κ = 4 is harmless, but with κ = 10⁴ the iteration is accurate after 11 steps and useless after 20.
        </p>
      </Remark>

      <Theorem title="Denman–Beavers iteration">
        <p>With <M>{"Y_0 = A"}</M>, <M>{"Z_0 = I"}</M>,</p>
        <MD>{"Y_{k+1} = \\tfrac12\\left(Y_k + Z_k^{-1}\\right), \\qquad Z_{k+1} = \\tfrac12\\left(Z_k + Y_k^{-1}\\right)."}</MD>
        <p>
          In exact arithmetic <M>{"Y_k = X_{k+1}"}</M>-style Newton iterates converging to <M>{"A^{1/2}"}</M> and{" "}
          <M>{"Z_k = A^{-1}Y_k \\to A^{-1/2}"}</M>; the coupled form is numerically stable.
        </p>
      </Theorem>
      <Proof>
        <p>
          Check by induction that <M>{"Z_k = A^{-1}Y_k"}</M> and that <M>{"Y_k"}</M> commutes with A: it holds for k = 0, and
          then <M>{"Y_{k+1} = \\tfrac12(Y_k + Y_k^{-1}A)"}</M>, which is a Newton step from <M>{"Y_k"}</M>, while{" "}
          <M>{"Z_{k+1} = \\tfrac12(A^{-1}Y_k + Y_k^{-1}) = A^{-1}\\cdot\\tfrac12(Y_k + AY_k^{-1}) = A^{-1}Y_{k+1}"}</M>, using{" "}
          <M>{"AY_k^{-1} = Y_k^{-1}A"}</M>. So <M>{"Y_k"}</M> runs Newton from <M>{"Y_0 = A"}</M> (one step ahead of{" "}
          <M>{"X_0 = I"}</M>, since <M>{"X_1 = (I + A)/2"}</M> and <M>{"Y_1 = (A + I)/2"}</M>). The stability analysis of the
          coupled map shows its error amplification factors are at most 1/2 in size near the fixed point, so rounding
          errors are damped instead of amplified. In the code it is accurate after 20 steps for both condition numbers.
        </p>
        <Code>{SQ}</Code>
      </Proof>

      <Remark title="inverse roots in Shampoo">
        <p>
          Shampoo keeps, for a weight matrix with gradient G, the statistics <M>{"L = \\sum GG^\\top"}</M> and{" "}
          <M>{"R = \\sum G^\\top G"}</M>, and steps along <M>{"L^{-1/4}GR^{-1/4}"}</M>, a Kronecker-factored approximation of
          full-matrix Adagrad. These matrices are badly conditioned, so a damping ε is added and the roots are computed by
          eigendecomposition or by coupled Newton iterations like the one above, in higher precision and only every few
          steps. With a single gradient, <M>{"(GG^\\top)^{-1/4}G(G^\\top G)^{-1/4} = UV^\\top"}</M> for the SVD G = UΣVᵀ: every
          singular value becomes 1, as the code shows. That orthogonalised gradient is exactly what the Muon optimiser uses,
          computed far more cheaply, in the next two lessons.
        </p>
        <Code>{SH}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "heron",
      rung: "check",
      prompt: <p>Run Heron&apos;s iteration x ← (x + 4/x)/2 from x₀ = 1. What is x₂?</p>,
      answer: { kind: "numeric", value: 2.05, tolerance: 0.0001 },
    },
    {
      key: "amp",
      rung: "check",
      prompt: <p>For κ(A) = 100, what is the largest amplification factor |1 − √κ|/2 of plain Newton&apos;s error map?</p>,
      answer: { kind: "numeric", value: 4.5, tolerance: 0.0001 },
    },
    {
      key: "stable",
      rung: "apply",
      prompt: <p>Why does the plain Newton iteration X ← (X + X⁻¹A)/2 become unstable for ill-conditioned A?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rounding makes the iterate fail to commute with A, and the non-commuting part of the error is amplified by eigenvalue ratios",
          "Newton's method only converges linearly for matrices",
          "The inverse X⁻¹ cannot be computed for ill-conditioned matrices",
          "The square root of an ill-conditioned matrix does not exist",
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

def sqrtm_eig(A):
    lam, V = np.linalg.eigh(A)
    return (V * np.sqrt(lam)) @ V.T

def newton_sqrt(A, iters):
    X = np.eye(len(A))
    for _ in range(iters):
        X = 0.5 * (X + np.linalg.solve(X, A))
    return X

def db_sqrt(A, iters):
    Y, Z = A.copy(), np.eye(len(A))
    for _ in range(iters):
        Y, Z = 0.5 * (Y + np.linalg.inv(Z)), 0.5 * (Z + np.linalg.inv(Y))
    return Y, Z

Q, _ = np.linalg.qr(np.random.default_rng(0).normal(size=(6, 6)))
for kappa in [4.0, 1e4]:
    A = (Q * np.logspace(0, -np.log10(kappa), 6)) @ Q.T; S = sqrtm_eig(A); n = np.linalg.norm(S)
    errs = [np.linalg.norm(newton_sqrt(A, k) - S) / n for k in [11, 20]] + [np.linalg.norm(db_sqrt(A, 20)[0] - S) / n]
    print(kappa, [bool(e < 1e-5) for e in errs])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 [True, True, True]\n10000.0 [True, False, True]",
          "4.0 [True, True, True]\n10000.0 [True, True, True]",
          "4.0 [True, False, True]\n10000.0 [True, False, True]",
          "4.0 [True, True, True]\n10000.0 [False, False, False]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def inv_root(A, p, eps):
    lam, V = np.linalg.eigh(A)
    return (V * (np.maximum(lam, 0.0) + eps) ** (-1.0 / p)) @ V.T

def shampoo_direction(G, L, R, eps):
    return inv_root(L, 4, eps) @ G @ inv_root(R, 4, eps)

G = np.random.default_rng(1).normal(size=(5, 3))
D = shampoo_direction(G, G @ G.T, G.T @ G, 1e-12)
U, s, Vt = np.linalg.svd(G, full_matrices=False)
print(np.round(np.linalg.svd(D, compute_uv=False), 6), np.allclose(D, U @ Vt, atol=1e-5))
A = np.array([[4.0, 1.0], [1.0, 3.0]]); X = inv_root(A, 4, 0.0)
print(np.allclose(np.linalg.matrix_power(X, 4) @ A, np.eye(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 1. 1.] True\nTrue", "[1. 1. 1.] False\nTrue", "[3. 2. 1.] True\nTrue", "[1. 1. 1.] True\nFalse"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sqrtm_eig(A)</C> for symmetric positive definite A; <C>newton_sqrt(A, iters)</C> from X₀ = I using{" "}
          <C>np.linalg.solve</C>; and <C>db_sqrt(A, iters)</C>, returning (Y, Z) from the Denman–Beavers iteration.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sqrtm_eig(A):
    return A

def newton_sqrt(A, iters):
    return A

def db_sqrt(A, iters):
    return A, np.eye(len(A))
`,
        solution: SQ,
        tests: [
          { name: "small", code: `A = np.array([[5.0, 2.0], [2.0, 2.0]]); S = sqrtm_eig(A)
assert np.allclose(S, S.T) and np.allclose(S @ S, A) and np.all(np.linalg.eigvalsh(S) > 0)
assert np.allclose(newton_sqrt(A, 8), S) and np.allclose(newton_sqrt(np.diag([9.0, 4.0]), 1), np.diag([5.0, 2.5]))` },
          { name: "db", code: `Q, _ = np.linalg.qr(np.random.default_rng(46).normal(size=(5, 5))); A = (Q * np.logspace(0, -5, 5)) @ Q.T
Y, Z = db_sqrt(A, 30)
assert np.allclose(Y, sqrtm_eig(A), atol=1e-10) and np.allclose(Y @ Z, np.eye(5), atol=1e-8)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inv_root(A, p, eps)</C>, returning (A + εI)^(−1/p) for symmetric positive semidefinite A via its
          eigendecomposition, clipping negative eigenvalues to 0, and <C>shampoo_direction(G, L, R, eps)</C>, returning
          L^(−1/4) G R^(−1/4) with damping ε.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inv_root(A, p, eps):
    return np.eye(len(A))

def shampoo_direction(G, L, R, eps):
    return G
`,
        solution: SH,
        tests: [
          { name: "root", code: `assert np.allclose(inv_root(np.diag([16.0, 81.0]), 4, 0.0), np.diag([0.5, 1.0 / 3.0]))
A = np.array([[2.0, 1.0], [1.0, 2.0]]); X = inv_root(A, 2, 0.0)
assert np.allclose(X @ A @ X, np.eye(2)) and np.allclose(inv_root(np.zeros((2, 2)), 2, 4.0), 0.5 * np.eye(2))` },
          { name: "shampoo", code: `G = np.random.default_rng(47).normal(size=(4, 6)); D = shampoo_direction(G, G @ G.T, G.T @ G, 1e-12)
U, s, Vt = np.linalg.svd(G, full_matrices=False)
assert D.shape == (4, 6) and np.allclose(D, U @ Vt, atol=1e-5)
assert np.allclose(shampoo_direction(G, np.eye(4), np.eye(6), 0.0), G)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For λ &gt; 0 and Heron&apos;s recurrence x_(k+1) = (x_k + λ/x_k)/2, prove that x_(k+1) − √λ = (x_k − √λ)²/(2x_k), and
          deduce that from x₀ = 1 every x_k with k ≥ 1 satisfies x_k ≥ √λ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes x_(k+1) − √λ = (x_k² + λ − 2x_k√λ)/(2x_k).",
          "Recognises the numerator as (x_k − √λ)² to obtain the identity.",
          "Argues by induction that x_k > 0 for all k, so the right side is nonnegative and x_k ≥ √λ for k ≥ 1.",
        ],
      },
    },
    {
      key: "tr",
      rung: "stretch",
      prompt: <p>What is the trace of A^(−1/4) for A = diag(16, 81)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.8333, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the matrix Newton iteration for the square root is Heron's method on each eigenvalue in exact arithmetic, why rounding makes it blow up for ill-conditioned matrices, how the Denman–Beavers coupling fixes it, and where inverse fourth roots appear in Shampoo.",

  glimpse: (
    <>
      <p>
        Every method in this lesson needs a matrix inverse or an eigendecomposition at each step, which is slow on GPUs and
        fragile in low precision. The next lesson builds iterations from matrix multiplications alone.
      </p>
    </>
  ),
};
