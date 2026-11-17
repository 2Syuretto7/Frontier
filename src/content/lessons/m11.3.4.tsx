import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VanderFitViz } from "@/components/viz/VanderFitViz";
import type { LessonContent } from "@/lib/types";

const LS = `import numpy as np

def lstsq_normal(A, b):
    L = np.linalg.cholesky(A.T @ A)
    y = np.linalg.solve(L, A.T @ b)
    return np.linalg.solve(L.T, y)

def lstsq_qr(A, b):
    Q, R = np.linalg.qr(A)
    return np.linalg.solve(R, Q.T @ b)

def lauchli(eps):
    return np.array([[1.0, 1.0], [eps, 0.0], [0.0, eps]])`;

const FIT = `import numpy as np

def vander(t, deg):
    return t[:, None] ** np.arange(deg + 1)

def fit_errors(deg, n=100):
    A = vander(np.linspace(0, 1, n), deg)
    c = np.ones(deg + 1)
    b = A @ c
    Q, R = np.linalg.qr(A)
    x_qr = np.linalg.solve(R, Q.T @ b)
    x_ne = np.linalg.solve(A.T @ A, A.T @ b)
    err = lambda x: float(np.linalg.norm(x - c) / np.linalg.norm(c))
    return float(np.linalg.cond(A)), err(x_ne), err(x_qr)`;

export const lesson: LessonContent = {
  id: "m11.3.4",
  minutes: 45,
  links: {
    requires: ["m11.3.3", "m11.3.2", "m3.5.3"],
    revisits: ["m11.2.1"],
    foreshadows: ["m11.5.3"],
  },

  puzzle: (
    <>
      <p>
        Least squares has a famous one-line solution: x = (AᵀA)⁻¹Aᵀb, or better, solve AᵀAx = Aᵀb by Cholesky. It is
        exact, fast, and taught everywhere. Fit a degree-9 polynomial to 100 points that lie exactly on a polynomial with
        all coefficients 1, and this route recovers the coefficients to about 4 digits, while QR on the same data gets 10.
        Both methods are backward stable at what they do. Where do six digits go?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Forming AᵀA squares every singular value of A, so it squares the condition number: a matrix that costs you 7 digits
        becomes one that costs you 14. Worse, the squaring happens in floating point before any solving starts, and entries
        like 1 + ε² simply forget ε once ε² is below the unit roundoff. QR works on A itself, and its error is governed by
        κ(A), not κ(A)². The normal equations are fine when κ(A) is modest and are often used then because they are cheaper,
        but they turn a moderately ill-conditioned problem into a hopeless one.
      </p>
      <VanderFitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="squaring the condition number">
        <p>If A has full column rank, <M>{"\\kappa_2(A^\\top A) = \\kappa_2(A)^2"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          With the thin SVD <M>{"A = U\\Sigma V^\\top"}</M>, <M>{"A^\\top A = V\\Sigma U^\\top U\\Sigma V^\\top = V\\Sigma^2V^\\top"}</M>,
          a symmetric eigendecomposition, so the singular values of AᵀA are <M>{"\\sigma_i^2"}</M> and the ratio of the largest
          to the smallest is <M>{"(\\sigma_1/\\sigma_n)^2"}</M>.
        </p>
      </Proof>

      <Theorem title="sensitivity of least squares">
        <p>
          Let x minimise ‖Ax − b‖ with residual r, and let θ be the angle between b and the range of A, so{" "}
          <M>{"\\sin\\theta = \\|r\\|/\\|b\\|"}</M>. For perturbations of A and b of relative size ε,
        </p>
        <MD>{"\\frac{\\|\\hat x - x\\|}{\\|x\\|} \\leq \\epsilon\\left(\\frac{2\\kappa(A)}{\\cos\\theta} + \\kappa(A)^2\\tan\\theta\\right) + O(\\epsilon^2)."}</MD>
      </Theorem>
      <Remark title="what this says about the methods">
        <p>
          The κ² term is part of the problem, but it is multiplied by tan θ, which is zero when the data fit exactly and small
          when the fit is good. Householder QR is backward stable for least squares, so its error is bounded by the right-hand
          side with ε ≈ u: about κu for a small residual. The normal equations are backward stable only for the system AᵀAx =
          Aᵀb; the rounding in forming AᵀA alone is a perturbation of relative size u to a matrix with condition κ², so their
          error is about κ²u whatever the residual. When the residual is large the two are comparable; when it is small, QR
          wins by a factor of κ. The bound itself is a standard first-order perturbation result; its proof differentiates
          the normal equations and bounds the two terms that appear, one through{" "}
          <M>{"\\|A^+\\| = 1/\\sigma_n"}</M> and one through <M>{"\\|(A^\\top A)^{-1}\\| = 1/\\sigma_n^2"}</M> acting on r.
        </p>
      </Remark>

      <Remark title="the Läuchli matrix">
        <p>
          The 3 × 2 matrix with rows (1, 1), (ε, 0), (0, ε) has full rank, with{" "}
          <M>{"\\kappa(A) = \\sqrt{2 + \\epsilon^2}/\\epsilon"}</M>. Its Gram matrix has 1 + ε² on the diagonal and 1 off it.
          For ε = 10⁻⁸, ε² = 10⁻¹⁶ is below half the spacing of floats near 1, so the stored AᵀA is the all-ones matrix,
          exactly singular: NumPy reports rank 2 for A but rank 1 for AᵀA, while QR still solves to full accuracy. At ε =
          10⁻⁷ Cholesky succeeds on AᵀA but the solution is wrong in the second decimal place.
        </p>
        <Code>{LS}</Code>
      </Remark>

      <Remark title="polynomial fitting">
        <p>
          The monomial basis 1, t, t², … on [0, 1] produces Vandermonde matrices whose condition grows exponentially with the
          degree. In the code, degrees 3, 6 and 9 have κ ≈ 10², 10⁴ and 10⁷; the normal equations keep about 12, 9 and 4
          correct digits and QR about 14, 13 and 10, roughly 16 − 2 log₁₀ κ against 16 − log₁₀ κ. The cure for the
          remaining loss is a better basis (orthogonal polynomials such as Chebyshev or Legendre), which makes κ small to
          begin with. The practical rules: use QR (or the SVD when A may be rank deficient) by default; use Cholesky on AᵀA
          when κ(A)²u is comfortably small and speed matters, as with very tall, well-scaled feature matrices; and never
          form the inverse.
        </p>
        <Code>{FIT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sq",
      rung: "check",
      prompt: <p>If κ₂(A) = 10⁵, what is log₁₀ κ₂(AᵀA)?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.0001 },
    },
    {
      key: "gram",
      rung: "check",
      prompt: <p>For the Läuchli matrix with ε = 0.01, what is κ₂(AᵀA) = (2 + ε²)/ε²?</p>,
      answer: { kind: "numeric", value: 20001, tolerance: 0.01 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>When is solving least squares by Cholesky on AᵀA a reasonable choice?</p>,
      answer: {
        kind: "choice",
        options: [
          "When κ(A)² times the unit roundoff is comfortably small and the speed or memory savings matter",
          "Whenever the residual is small, since the κ² term then vanishes",
          "Never, since it is not backward stable for anything",
          "Whenever A has more rows than columns",
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

def lstsq_normal(A, b):
    L = np.linalg.cholesky(A.T @ A)
    y = np.linalg.solve(L, A.T @ b)
    return np.linalg.solve(L.T, y)

def lstsq_qr(A, b):
    Q, R = np.linalg.qr(A)
    return np.linalg.solve(R, Q.T @ b)

def lauchli(eps):
    return np.array([[1.0, 1.0], [eps, 0.0], [0.0, eps]])

A = lauchli(1e-8); b = A @ np.array([1.0, 1.0])
print(np.linalg.matrix_rank(A), np.linalg.matrix_rank(A.T @ A), np.round(lstsq_qr(A, b), 6) + 0.0)
A = lauchli(1e-7); b = A @ np.array([1.0, 1.0])
print(round(float(np.abs(lstsq_normal(A, b) - 1).max()), 3), float(np.abs(lstsq_qr(A, b) - 1).max()) < 1e-14)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 1 [1. 1.]\n0.011 True", "2 2 [1. 1.]\n0.011 True", "1 1 [1. 1.]\n0.011 True", "2 1 [1. 1.]\n0.0 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def vander(t, deg):
    return t[:, None] ** np.arange(deg + 1)

def fit_errors(deg, n=100):
    A = vander(np.linspace(0, 1, n), deg)
    c = np.ones(deg + 1)
    b = A @ c
    Q, R = np.linalg.qr(A)
    x_qr = np.linalg.solve(R, Q.T @ b)
    x_ne = np.linalg.solve(A.T @ A, A.T @ b)
    err = lambda x: float(np.linalg.norm(x - c) / np.linalg.norm(c))
    return float(np.linalg.cond(A)), err(x_ne), err(x_qr)

for deg in [3, 6, 9]:
    k, ne, qr = fit_errors(deg)
    print(deg, round(np.log10(k)), round(-np.log10(ne)), round(-np.log10(qr)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 2 12 14\n6 4 9 13\n9 7 4 10", "3 2 14 12\n6 4 13 9\n9 7 10 4", "3 2 12 14\n6 4 12 14\n9 7 12 14", "3 4 12 14\n6 8 9 13\n9 14 4 10"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lstsq_normal(A, b)</C> (Cholesky on AᵀA, then two triangular solves), <C>lstsq_qr(A, b)</C> (thin QR,
          then solve Rx = Qᵀb), and <C>lauchli(eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lstsq_normal(A, b):
    return np.zeros(A.shape[1])

def lstsq_qr(A, b):
    return np.zeros(A.shape[1])

def lauchli(eps):
    return np.zeros((3, 2))
`,
        solution: LS,
        tests: [
          { name: "agree", code: `rng = np.random.default_rng(15); A = rng.normal(size=(20, 4)); b = rng.normal(size=20)
x = np.linalg.lstsq(A, b, rcond=None)[0]
assert np.allclose(lstsq_normal(A, b), x) and np.allclose(lstsq_qr(A, b), x)
assert np.array_equal(lauchli(0.5), np.array([[1.0, 1.0], [0.5, 0.0], [0.0, 0.5]]))` },
          { name: "ill", code: `A = lauchli(1e-9); b = A @ np.array([1.0, 2.0])
assert np.allclose(lstsq_qr(A, b), [1.0, 2.0], atol=1e-6)
try:
    lstsq_normal(A, b); raise AssertionError("expected failure")
except np.linalg.LinAlgError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vander(t, deg)</C>, the matrix with columns 1, t, …, t^deg, and <C>fit_errors(deg, n=100)</C>, which fits
          b = A·(1, …, 1) on n equally spaced points of [0, 1] and returns (κ₂(A), relative error of the normal-equations
          solution, relative error of the QR solution).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vander(t, deg):
    return np.ones((len(t), deg + 1))

def fit_errors(deg, n=100):
    return 1.0, 0.0, 0.0
`,
        solution: FIT,
        tests: [
          { name: "vander", code: `assert np.array_equal(vander(np.array([2.0, 3.0]), 2), np.array([[1.0, 2.0, 4.0], [1.0, 3.0, 9.0]]))
k, ne, qr = fit_errors(2)
assert 1 < k < 1e3 and ne < 1e-10 and qr < 1e-10` },
          { name: "gap", code: `k, ne, qr = fit_errors(9)
assert 1e6 < k < 1e8 and ne > 100 * qr and qr < 1e-8
k2, _, _ = fit_errors(9, n=50)
assert k2 != k` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if A has full column rank then κ₂(AᵀA) = κ₂(A)².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the SVD A = UΣVᵀ (thin or full) with σ₁ ≥ … ≥ σₙ > 0 by full column rank.",
          "Computes AᵀA = VΣ²Vᵀ using UᵀU = I, and identifies its singular values (or eigenvalues) as σᵢ².",
          "Concludes κ₂(AᵀA) = σ₁²/σₙ² = κ₂(A)².",
        ],
      },
    },
    {
      key: "kl",
      rung: "stretch",
      prompt: <p>For the Läuchli matrix with ε = 0.01, what is κ₂(A)? Give two decimals.</p>,
      answer: { kind: "numeric", value: 141.42, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend why forming AᵀA squares the condition number, what the Läuchli matrix shows about information lost in forming it, how the least-squares perturbation bound splits into a κ term and a κ² tan θ term, and when the normal equations are still acceptable.",

  glimpse: (
    <>
      <p>
        Factorisations solve systems. The next chapter asks for eigenvalues, which no finite formula can give for matrices
        larger than 4 × 4, so every eigenvalue algorithm is an iteration, starting with the simplest: multiply by A again
        and again.
      </p>
    </>
  ),
};
