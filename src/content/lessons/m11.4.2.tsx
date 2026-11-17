import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QrIterViz } from "@/components/viz/QrIterViz";
import type { LessonContent } from "@/lib/types";

const QRA = `import numpy as np

def qr_unshifted(A, iters):
    for _ in range(iters):
        Q, R = np.linalg.qr(A)
        A = R @ Q
    return A

def wilkinson_shift(a, b, c):
    d = (a - c) / 2
    return c - np.copysign(b * b, d) / (abs(d) + np.hypot(d, b))

def qr_shifted_eigs(A, tol=1e-12):
    A = A.astype(float).copy()
    eigs, steps = [], 0
    while A.shape[0] > 1:
        n = A.shape[0]
        while abs(A[n - 1, n - 2]) > tol * (abs(A[n - 1, n - 1]) + abs(A[n - 2, n - 2])):
            mu = wilkinson_shift(A[n - 2, n - 2], A[n - 1, n - 2], A[n - 1, n - 1])
            Q, R = np.linalg.qr(A - mu * np.eye(n))
            A = R @ Q + mu * np.eye(n)
            steps += 1
        eigs.append(float(A[n - 1, n - 1]))
        A = A[:n - 1, :n - 1]
    eigs.append(float(A[0, 0]))
    return sorted(eigs), steps`;

const SUB = `import numpy as np

def subspace_iteration(A, iters):
    Q = np.eye(A.shape[0])
    for _ in range(iters):
        Q, R = np.linalg.qr(A @ Q)
    return Q

def qr_with_q(A, iters):
    Qacc = np.eye(A.shape[0])
    for _ in range(iters):
        Q, R = np.linalg.qr(A)
        A, Qacc = R @ Q, Qacc @ Q
    return A, Qacc

def same_up_to_signs(Q1, Q2):
    return bool(np.allclose(np.abs(Q1.T @ Q2), np.eye(Q1.shape[1]), atol=1e-8))`;

export const lesson: LessonContent = {
  id: "m11.4.2",
  minutes: 55,
  links: {
    requires: ["m11.4.1", "m11.3.3"],
    revisits: ["m3.7.2"],
    foreshadows: ["m11.4.3"],
  },

  puzzle: (
    <>
      <p>
        Factor a matrix as A = QR, multiply the factors back in the other order to get RQ, and repeat. Nothing in this
        recipe mentions eigenvalues, yet after a few dozen rounds the diagonal holds every eigenvalue of A, sorted, and with
        one extra trick the last eigenvalue appears to full precision in two or three rounds. This is, essentially, what
        every eigenvalue routine in NumPy, MATLAB and LAPACK does. Why should swapping the order of two factors find
        eigenvalues?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        RQ = Qᵀ(QR)Q is a similarity transform, so the eigenvalues never change; only the basis does. The basis that
        emerges is the one power iteration would find if you ran it on n vectors at once and kept them orthonormal: the
        first column chases the top eigenvector, the second the next one in the orthogonal complement, and so on. The QR
        algorithm is that simultaneous iteration, written so that the matrix itself, in the new basis, is what you track.
        Shifts turn the slow power iteration into fast inverse iteration on the last row.
      </p>
      <QrIterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the QR algorithm">
        <p>Set <M>{"A_0 = A"}</M> and for k = 0, 1, 2, …</p>
        <MD>{"A_k = Q_kR_k, \\qquad A_{k+1} = R_kQ_k = Q_k^\\top A_kQ_k."}</MD>
        <p>Every <M>{"A_k"}</M> is orthogonally similar to A, so it has the same eigenvalues.</p>
      </Definition>

      <Theorem title="QR algorithm = simultaneous iteration">
        <p>
          With <M>{"\\bar Q_k = Q_0Q_1\\cdots Q_{k-1}"}</M> and <M>{"\\bar R_k = R_{k-1}\\cdots R_1R_0"}</M>,
        </p>
        <MD>{"A^k = \\bar Q_k\\bar R_k \\qquad\\text{and}\\qquad A_k = \\bar Q_k^\\top A\\bar Q_k."}</MD>
      </Theorem>
      <Proof>
        <p>
          The second identity follows from <M>{"A_{k+1} = Q_k^\\top A_kQ_k"}</M> by induction, and it says{" "}
          <M>{"A\\bar Q_k = \\bar Q_kA_k"}</M>. For the first, k = 0 is I = I·I, and if{" "}
          <M>{"A^k = \\bar Q_k\\bar R_k"}</M> then{" "}
          <M>{"A^{k+1} = A\\bar Q_k\\bar R_k = \\bar Q_kA_k\\bar R_k = \\bar Q_kQ_kR_k\\bar R_k = \\bar Q_{k+1}\\bar R_{k+1}"}</M>.
        </p>
        <p>
          Since <M>{"\\bar R_k"}</M> is upper triangular, the first j columns of <M>{"\\bar Q_k"}</M> span the same space as{" "}
          <M>{"A^ke_1, \\ldots, A^ke_j"}</M>: power iteration on j vectors at once, re-orthonormalised. If the eigenvalues
          have distinct absolute values, that space converges to the span of the top j eigenvectors, and the subdiagonal
          entry <M>{"(A_k)_{j+1,j}"}</M> shrinks like <M>{"|\\lambda_{j+1}/\\lambda_j|^k"}</M>. The code confirms both: subspace
          iteration and the accumulated Q agree up to signs, and the two subdiagonal entries shrink per step by 0.265 and
          0.356, the ratios of neighbouring eigenvalues 0.650, 2.454 and 6.896.
        </p>
        <Code>{SUB}</Code>
      </Proof>

      <Theorem title="shifts">
        <p>
          If <M>{"A_k - \\mu_kI = Q_kR_k"}</M> and <M>{"A_{k+1} = R_kQ_k + \\mu_kI"}</M>, then still{" "}
          <M>{"A_{k+1} = Q_k^\\top A_kQ_k"}</M>, and the last row of <M>{"A_{k+1}"}</M> is what one step of inverse iteration with
          shift <M>{"\\mu_k"}</M> produces.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"Q_k^\\top A_kQ_k = Q_k^\\top(Q_kR_k + \\mu_kI)Q_k = R_kQ_k + \\mu_kI"}</M>. From{" "}
          <M>{"A_k - \\mu_kI = Q_kR_k"}</M>, transposing and inverting gives{" "}
          <M>{"(A_k - \\mu_kI)^{-\\top} = Q_kR_k^{-\\top}"}</M>, so{" "}
          <M>{"(A_k - \\mu_kI)^{-\\top}e_n = Q_ke_n/r_{nn}"}</M>: the last column of <M>{"Q_k"}</M>, the new basis vector for the
          last row, is one step of inverse iteration with <M>{"A_k^\\top"}</M> and shift <M>{"\\mu_k"}</M> applied to{" "}
          <M>{"e_n"}</M>.
        </p>
        <p>
          Taking <M>{"\\mu_k = (A_k)_{nn}"}</M>, a Rayleigh quotient, gives Rayleigh quotient iteration on the last row, and
          the last subdiagonal entry converges quadratically, cubically for symmetric matrices. That shift can stall (for the
          matrix with rows (0, 1) and (1, 0) the QR step changes nothing), so the Wilkinson shift, the eigenvalue of the
          trailing 2 × 2 block nearer to <M>{"(A_k)_{nn}"}</M>, is used instead; for symmetric tridiagonal matrices it always
          converges. Once the last subdiagonal entry is negligible, the last diagonal entry is an eigenvalue and the problem
          deflates to the leading (n − 1) × (n − 1) block. In the code, four shifted steps in total find all three
          eigenvalues of a 3 × 3 matrix that unshifted QR still has wrong in the third decimal after five steps.
        </p>
        <Code>{QRA}</Code>
      </Proof>

      <Remark title="the practical algorithm">
        <p>
          A QR step on a full matrix costs <M>{"O(n^3)"}</M>. So first reduce A by Householder similarity transforms to upper
          Hessenberg form (zero below the first subdiagonal), or tridiagonal form if A is symmetric, at a one-time cost of
          about <M>{"\\tfrac{10}{3}n^3"}</M> or <M>{"\\tfrac43n^3"}</M> flops. A QR step preserves this form and costs{" "}
          <M>{"O(n^2)"}</M>, or <M>{"O(n)"}</M> for tridiagonal, and with shifts only a few steps per eigenvalue are needed,
          so the total is <M>{"O(n^3)"}</M>. Real nonsymmetric matrices use double shifts to handle complex conjugate pairs
          in real arithmetic. The whole process uses orthogonal transformations only, so it is backward stable: the computed
          eigenvalues are exact for some A + E with ‖E‖ = O(u‖A‖), and for symmetric A each eigenvalue is then within ‖E‖ of
          the true one, by Weyl&apos;s inequality.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rate",
      rung: "check",
      prompt: (
        <p>
          Without shifts, a subdiagonal entry between eigenvalues 4 and 3 shrinks by 3/4 per step. By what factor does it
          shrink in 10 steps? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0563, tolerance: 0.0001 },
    },
    {
      key: "tri",
      rung: "check",
      prompt: <p>Using (4/3)n³, how many billion flops does reducing a symmetric 3000 × 3000 matrix to tridiagonal form take?</p>,
      answer: { kind: "numeric", value: 36, tolerance: 0.01 },
    },
    {
      key: "hess",
      rung: "apply",
      prompt: <p>Why do practical QR algorithms first reduce A to Hessenberg or tridiagonal form?</p>,
      answer: {
        kind: "choice",
        options: [
          "The form is preserved by QR steps, which then cost O(n²) or O(n) instead of O(n³)",
          "It makes the eigenvalues appear on the diagonal immediately",
          "It improves the condition number of the eigenvalues",
          "QR factorisation is only defined for Hessenberg matrices",
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

def qr_unshifted(A, iters):
    for _ in range(iters):
        Q, R = np.linalg.qr(A)
        A = R @ Q
    return A

def wilkinson_shift(a, b, c):
    d = (a - c) / 2
    return c - np.copysign(b * b, d) / (abs(d) + np.hypot(d, b))

def qr_shifted_eigs(A, tol=1e-12):
    A = A.astype(float).copy()
    eigs, steps = [], 0
    while A.shape[0] > 1:
        n = A.shape[0]
        while abs(A[n - 1, n - 2]) > tol * (abs(A[n - 1, n - 1]) + abs(A[n - 2, n - 2])):
            mu = wilkinson_shift(A[n - 2, n - 2], A[n - 1, n - 2], A[n - 1, n - 1])
            Q, R = np.linalg.qr(A - mu * np.eye(n))
            A = R @ Q + mu * np.eye(n)
            steps += 1
        eigs.append(float(A[n - 1, n - 1]))
        A = A[:n - 1, :n - 1]
    eigs.append(float(A[0, 0]))
    return sorted(eigs), steps

A = np.array([[4.0, 1.0, 0.0], [1.0, 3.0, 1.0], [0.0, 1.0, 2.0]])
print(np.round(np.diag(qr_unshifted(A, 5)), 4) + 0.0, np.round(np.diag(qr_unshifted(A, 40)), 4) + 0.0)
eigs, steps = qr_shifted_eigs(A)
print(np.round(eigs, 4) + 0.0, steps)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.7224 3.0095 1.2681] [4.7321 3.     1.2679]\n[1.2679 3.     4.7321] 4",
          "[1.2681 3.0095 4.7224] [1.2679 3.     4.7321]\n[1.2679 3.     4.7321] 4",
          "[4.7224 3.0095 1.2681] [4.7321 3.     1.2679]\n[1.2679 3.     4.7321] 40",
          "[4. 3. 2.] [4.7321 3.     1.2679]\n[1.2679 3.     4.7321] 4",
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

def subspace_iteration(A, iters):
    Q = np.eye(A.shape[0])
    for _ in range(iters):
        Q, R = np.linalg.qr(A @ Q)
    return Q

def qr_with_q(A, iters):
    Qacc = np.eye(A.shape[0])
    for _ in range(iters):
        Q, R = np.linalg.qr(A)
        A, Qacc = R @ Q, Qacc @ Q
    return A, Qacc

def same_up_to_signs(Q1, Q2):
    return bool(np.allclose(np.abs(Q1.T @ Q2), np.eye(Q1.shape[1]), atol=1e-8))

A = np.array([[5.0, 2.0, 1.0], [2.0, 4.0, 1.0], [1.0, 1.0, 1.0]])
A10, Q10 = qr_with_q(A, 10); A11, _ = qr_with_q(A, 11)
print(same_up_to_signs(subspace_iteration(A, 10), Q10), np.allclose(Q10.T @ A @ Q10, A10))
print(round(abs(A11[2, 1] / A10[2, 1]), 3), round(abs(A11[1, 0] / A10[1, 0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True\n0.265 0.356", "True True\n0.356 0.265", "False True\n0.265 0.356", "True True\n0.07 0.127"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>qr_unshifted(A, iters)</C>; <C>wilkinson_shift(a, b, c)</C>, the eigenvalue of the symmetric 2 × 2 matrix
          with rows (a, b) and (b, c) nearer to c; and <C>qr_shifted_eigs(A, tol=1e-12)</C>, which runs Wilkinson-shifted
          QR steps on a symmetric matrix with deflation and returns (sorted eigenvalues, number of QR steps).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def qr_unshifted(A, iters):
    return A

def wilkinson_shift(a, b, c):
    return c

def qr_shifted_eigs(A, tol=1e-12):
    return sorted(np.diag(A).tolist()), 0
`,
        solution: QRA,
        tests: [
          { name: "shift", code: `assert abs(wilkinson_shift(2.0, 1.0, 0.0) - (1 - np.sqrt(2))) < 1e-12 and abs(wilkinson_shift(0.0, 1.0, 2.0) - (1 + np.sqrt(2))) < 1e-12
A = np.diag([3.0, 2.0, 1.0]) + 0.1 * (np.eye(3, k=1) + np.eye(3, k=-1))
assert np.allclose(np.sort(np.diag(qr_unshifted(A, 200))), np.linalg.eigvalsh(A))` },
          { name: "eigs", code: `G = np.random.default_rng(18).normal(size=(6, 6)); A = G + G.T
e, s = qr_shifted_eigs(A)
assert np.allclose(e, np.linalg.eigvalsh(A), atol=1e-9) and 0 < s < 60
e, s = qr_shifted_eigs(np.array([[0.0, 1.0], [1.0, 0.0]]))
assert np.allclose(e, [-1.0, 1.0])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>subspace_iteration(A, iters)</C>, which starts from Q = I and repeats Q ← the Q factor of AQ;{" "}
          <C>qr_with_q(A, iters)</C>, which runs unshifted QR steps and returns (Aₖ, the accumulated product of the Q
          factors); and <C>same_up_to_signs(Q1, Q2)</C>, true when the columns agree up to sign.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def subspace_iteration(A, iters):
    return np.eye(A.shape[0])

def qr_with_q(A, iters):
    return A, np.eye(A.shape[0])

def same_up_to_signs(Q1, Q2):
    return False
`,
        solution: SUB,
        tests: [
          { name: "signs", code: `assert same_up_to_signs(np.eye(3), np.diag([1.0, -1.0, 1.0])) and not same_up_to_signs(np.eye(2), np.array([[0.0, 1.0], [1.0, 0.0]]))` },
          { name: "agree", code: `G = np.random.default_rng(19).normal(size=(4, 4)); A = G @ G.T
Ak, Q = qr_with_q(A, 15)
assert np.allclose(Q.T @ Q, np.eye(4)) and np.allclose(Q.T @ A @ Q, Ak) and same_up_to_signs(subspace_iteration(A, 15), Q)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For the unshifted QR algorithm, with Q̄ₖ = Q₀⋯Qₖ₋₁ and R̄ₖ = Rₖ₋₁⋯R₀, prove that Aₖ = Q̄ₖᵀAQ̄ₖ and Aᵏ = Q̄ₖR̄ₖ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows Aₖ₊₁ = RₖQₖ = QₖᵀAₖQₖ and deduces Aₖ = Q̄ₖᵀAQ̄ₖ by induction, equivalently AQ̄ₖ = Q̄ₖAₖ.",
          "Sets up the induction for Aᵏ = Q̄ₖR̄ₖ with a correct base case.",
          "Carries out the step Aᵏ⁺¹ = AQ̄ₖR̄ₖ = Q̄ₖAₖR̄ₖ = Q̄ₖQₖRₖR̄ₖ = Q̄ₖ₊₁R̄ₖ₊₁.",
        ],
      },
    },
    {
      key: "wilk",
      rung: "stretch",
      prompt: <p>What is the Wilkinson shift for the trailing block with rows (3, 1) and (1, 1)? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5858, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why the QR algorithm preserves eigenvalues, why it is simultaneous power iteration in disguise, how shifts and deflation make it fast, and why practical codes reduce to Hessenberg or tridiagonal form first.",

  glimpse: (
    <>
      <p>
        The QR algorithm needs the whole matrix. A neural network&apos;s Hessian has billions of rows and is available only
        through Hessian-vector products. The next lesson builds an algorithm, Lanczos, that estimates its extreme
        eigenvalues and even its whole spectral density from a few hundred such products.
      </p>
    </>
  ),
};
