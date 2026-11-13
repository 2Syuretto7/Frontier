import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PolarStepsViz } from "@/components/viz/PolarStepsViz";
import type { LessonContent } from "@/lib/types";

const POLAR = `import numpy as np

def polar(A):
    U, s, Vt = np.linalg.svd(A)
    return U @ Vt, Vt.T @ np.diag(s) @ Vt

def procrustes(X, Y):
    U, _, Vt = np.linalg.svd(X.T @ Y)
    return U @ Vt`;

const NS = `def newton_schulz(G, steps=30):
    X = G / np.linalg.norm(G)
    for _ in range(steps):
        X = 1.5 * X - 0.5 * X @ X.T @ X
    return X

def orth_error(X):
    return float(np.linalg.norm(X.T @ X - np.eye(X.shape[1])))`;

export const lesson: LessonContent = {
  id: "m6.4.2",
  minutes: 55,
  links: {
    requires: ["m6.4.1"],
    revisits: ["m6.3.4"],
    foreshadows: ["m6.6.2"],
  },

  puzzle: (
    <>
      <p>
        Two sets of word embeddings, trained separately, describe the same words in coordinates that differ by an unknown
        rotation. Which rotation best aligns them? Some recent optimisers replace each gradient matrix by &ldquo;the nearest
        orthogonal matrix&rdquo; before stepping. What is that matrix, and how can it be computed without an SVD?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A complex number is its modulus times a unit number: <M>{"z = e^{i\\theta}|z|"}</M>. An operator is likewise a
        positive operator, its &ldquo;modulus&rdquo; <M>{"\\sqrt{T^*T}"}</M>, followed by an isometry, its
        &ldquo;phase&rdquo;. The phase is the isometry closest to T, and it answers both questions above.
      </p>
      <PolarStepsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="isometry">
        <p>
          An operator S on V is an isometry if <M>{"\\|Sv\\| = \\|v\\|"}</M> for all v. On real spaces these are the
          orthogonal operators, on complex ones the unitary operators.
        </p>
      </Definition>

      <Theorem title="characterisations of isometries">
        <p>
          For an operator S on a finite-dimensional inner product space, the following are equivalent: S is an isometry;{" "}
          <M>{"\\langle Su, Sv\\rangle = \\langle u, v\\rangle"}</M> for all u, v; <M>{"S^*S = I"}</M>; S maps some (hence
          every) orthonormal basis to an orthonormal basis.
        </p>
      </Theorem>
      <Proof>
        <p>
          If S preserves norms it preserves inner products, because the inner product can be recovered from norms (over ℝ,{" "}
          <M>{"\\langle u, v\\rangle = (\\|u + v\\|^2 - \\|u - v\\|^2)/4"}</M>, and over ℂ a similar polarisation identity
          with four terms). Preserving inner products means{" "}
          <M>{"\\langle S^*Su, v\\rangle = \\langle u, v\\rangle"}</M> for all u, v, i.e. <M>{"S^*S = I"}</M>. Then the
          images of an orthonormal basis are orthonormal. Conversely, if <M>{"Se_j"}</M> is orthonormal, then{" "}
          <M>{"\\|S\\sum a_je_j\\|^2 = \\sum |a_j|^2 = \\|\\sum a_je_j\\|^2"}</M>.
        </p>
      </Proof>

      <Theorem title="polar decomposition">
        <p>
          Every operator T on a finite-dimensional inner product space can be written{" "}
          <M>{"T = S\\sqrt{T^*T}"}</M> with S an isometry. The positive factor is always unique, and S is unique when T is
          invertible, namely <M>{"S = T(T^*T)^{-1/2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take a square SVD, <M>{"T = U\\Sigma V^*"}</M> with U, V unitary. Then{" "}
          <M>{"T = (UV^*)(V\\Sigma V^*)"}</M>. <M>{"UV^*"}</M> is unitary, and <M>{"V\\Sigma V^*"}</M> is positive with square{" "}
          <M>{"V\\Sigma^2V^* = T^*T"}</M>, so it is <M>{"\\sqrt{T^*T}"}</M> by uniqueness of positive square roots. If{" "}
          <M>{"T = SP"}</M> is any such factorisation with P positive, then <M>{"T^*T = PS^*SP = P^2"}</M>, so{" "}
          <M>{"P = \\sqrt{T^*T}"}</M>. When T is invertible so is P, and <M>{"S = TP^{-1}"}</M>.
        </p>
      </Proof>
      <p>
        For a rectangular m×n matrix with m ≥ n the same argument gives <M>{"A = QP"}</M> with Q (m×n) having orthonormal
        columns: Q = UVᵀ from the thin SVD.
      </p>

      <Theorem title="the nearest isometry (orthogonal Procrustes)">
        <p>
          For a real n×n matrix A with SVD <M>{"U\\Sigma V^\\top"}</M>, the orthogonal Q minimising{" "}
          <M>{"\\|A - Q\\|_F"}</M> is <M>{"Q = UV^\\top"}</M>, the polar factor. Consequently the orthogonal R minimising{" "}
          <M>{"\\|XR - Y\\|_F"}</M> is the polar factor of <M>{"X^\\top Y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\|A - Q\\|_F^2 = \\|A\\|_F^2 + n - 2\\operatorname{tr}(Q^\\top A)"}</M>, since{" "}
          <M>{"\\|Q\\|_F^2 = \\operatorname{tr}(Q^\\top Q) = n"}</M>. So maximise{" "}
          <M>{"\\operatorname{tr}(Q^\\top U\\Sigma V^\\top) = \\operatorname{tr}(Z\\Sigma) = \\sum_k \\sigma_k Z_{kk}"}</M>{" "}
          where <M>{"Z = V^\\top Q^\\top U"}</M> is orthogonal, so <M>{"|Z_{kk}| \\le 1"}</M>. The sum is at most{" "}
          <M>{"\\sum\\sigma_k"}</M>, attained at Z = I, i.e. <M>{"Q = UV^\\top"}</M>. For the second claim,{" "}
          <M>{"\\|XR - Y\\|_F^2 = \\|X\\|_F^2 + \\|Y\\|_F^2 - 2\\operatorname{tr}(R^\\top X^\\top Y)"}</M>, the same problem
          with <M>{"A = X^\\top Y"}</M>.
        </p>
      </Proof>
      <Code>{POLAR}</Code>

      <Example title="Newton–Schulz">
        <p>
          The polar factor can be computed with matrix products only. Scale G so that all its singular values are at most 1
          (dividing by the Frobenius norm does it), then iterate{" "}
          <M>{"X \\leftarrow \\tfrac32 X - \\tfrac12 XX^\\top X"}</M>. In the SVD basis this acts on each singular value
          separately as <M>{"\\sigma \\leftarrow \\tfrac32\\sigma - \\tfrac12\\sigma^3"}</M>, whose fixed point 1 attracts every
          σ in <M>{"(0, \\sqrt3)"}</M>, while U and V never change. So X tends to <M>{"UV^\\top"}</M>.
        </p>
        <Code>{NS}</Code>
      </Example>

      <Remark title="where this is used">
        <p>
          Aligning two embedding spaces with a dictionary of known pairs is Procrustes. The Muon optimiser orthogonalises each
          weight matrix&apos;s momentum with a few Newton–Schulz steps, so that the update has all singular values near 1 and
          moves every direction equally. Orthogonal initialisation uses the polar (or QR) factor of a random Gaussian matrix.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "modulus",
      rung: "check",
      prompt: <p>A = diag(−3, 2). What is the trace of the positive factor √(AᵀA) in its polar decomposition?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "ns",
      rung: "check",
      prompt: <p>One Newton–Schulz step maps a singular value σ to 1.5σ − 0.5σ³. What does σ = 0.5 become?</p>,
      answer: { kind: "numeric", value: 0.6875, tolerance: 1e-9 },
    },
    {
      key: "factor",
      rung: "apply",
      prompt: <p>For an invertible real matrix A, which expression is the orthogonal factor S in A = S√(AᵀA)?</p>,
      answer: { kind: "choice", options: ["A(AᵀA)^(−1/2)", "(AᵀA)^(−1/2)", "Aᵀ", "A/‖A‖_F"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def polar(A):
    U, s, Vt = np.linalg.svd(A)
    return U @ Vt, Vt.T @ np.diag(s) @ Vt

def procrustes(X, Y):
    U, _, Vt = np.linalg.svd(X.T @ Y)
    return U @ Vt

A = np.array([[0.0, -2.0], [1.0, 0.0]])
S, P = polar(A)
print((np.round(S, 4) + 0.0).tolist(), (np.round(P, 4) + 0.0).tolist())
t = np.pi / 6
R0 = np.array([[np.cos(t), -np.sin(t)], [np.sin(t), np.cos(t)]])
X = np.random.default_rng(0).normal(size=(5, 2))
print(np.allclose(procrustes(X, X @ R0), R0), np.allclose(procrustes(X, 3 * X @ R0), R0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, -1.0], [1.0, 0.0]] [[1.0, 0.0], [0.0, 2.0]]\nTrue True",
          "[[0.0, -1.0], [1.0, 0.0]] [[2.0, 0.0], [0.0, 1.0]]\nTrue True",
          "[[0.0, -1.0], [1.0, 0.0]] [[1.0, 0.0], [0.0, 2.0]]\nTrue False",
          "[[0.0, 1.0], [-1.0, 0.0]] [[1.0, 0.0], [0.0, 2.0]]\nTrue True",
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

def newton_schulz(G, steps=30):
    X = G / np.linalg.norm(G)
    for _ in range(steps):
        X = 1.5 * X - 0.5 * X @ X.T @ X
    return X

def orth_error(X):
    return float(np.linalg.norm(X.T @ X - np.eye(X.shape[1])))

G = np.array([[3.0, 0.0], [4.0, 5.0]])
Q = newton_schulz(G)
print(np.round(Q, 4), round(orth_error(Q), 6))
U, _, Vt = np.linalg.svd(G)
print(np.allclose(Q, U @ Vt), round(orth_error(G / np.linalg.norm(G)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[ 0.8944 -0.4472]\n [ 0.4472  0.8944]] 0.0\nTrue 0.9055",
          "[[ 0.4243  0.    ]\n [ 0.5657  0.7071]] 0.0\nTrue 0.9055",
          "[[ 0.8944 -0.4472]\n [ 0.4472  0.8944]] 0.0\nTrue 0.0",
          "[[ 0.8944  0.4472]\n [-0.4472  0.8944]] 0.0\nFalse 0.9055",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>polar(A)</C>, returning (S, P) with A = SP, S orthogonal and P positive semidefinite, for a square real A,
          and <C>procrustes(X, Y)</C>, the orthogonal R minimising ‖XR − Y‖_F.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def polar(A):
    return np.eye(len(A)), A

def procrustes(X, Y):
    return np.linalg.lstsq(X, Y, rcond=None)[0]
`,
        solution: POLAR,
        tests: [
          { name: "polar", code: `A = np.random.default_rng(0).normal(size=(4, 4))
S, P = polar(A)
assert np.allclose(S @ P, A) and np.allclose(S.T @ S, np.eye(4))
assert np.allclose(P, P.T) and np.linalg.eigvalsh(P).min() > -1e-10
S2, P2 = polar(np.diag([-3.0, 2.0]))
assert np.allclose(P2, np.diag([3.0, 2.0])) and np.allclose(S2, np.diag([-1.0, 1.0]))` },
          { name: "procrustes", code: `rng = np.random.default_rng(1)
Q, _ = np.linalg.qr(rng.normal(size=(3, 3)))
X = rng.normal(size=(10, 3))
assert np.allclose(procrustes(X, X @ Q), Q)
R = procrustes(X, X @ Q + 0.01 * rng.normal(size=(10, 3)))
assert np.allclose(R.T @ R, np.eye(3)) and np.linalg.norm(R - Q) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>newton_schulz(G, steps=30)</C>: divide G by its Frobenius norm, then apply X ← 1.5X − 0.5XXᵀX the given
          number of times. Also write <C>orth_error(X)</C>, the Frobenius norm of XᵀX − I.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def newton_schulz(G, steps=30):
    return G / np.linalg.norm(G)

def orth_error(X):
    return 0.0
`,
        solution: `import numpy as np

${NS}`,
        tests: [
          { name: "square", code: `G = np.array([[3.0, 0.0], [4.0, 5.0]])
U, _, Vt = np.linalg.svd(G)
Q = newton_schulz(G)
assert np.allclose(Q, U @ Vt, atol=1e-8) and orth_error(Q) < 1e-8
assert abs(orth_error(np.eye(3)) - 0.0) < 1e-12 and abs(orth_error(2 * np.eye(2)) - 3 * 2 ** 0.5) < 1e-9` },
          { name: "tall", code: `G = np.random.default_rng(2).normal(size=(6, 3))
U, _, Vt = np.linalg.svd(G, full_matrices=False)
Q = newton_schulz(G, steps=40)
assert Q.shape == (6, 3) and np.allclose(Q, U @ Vt, atol=1e-6)
assert orth_error(newton_schulz(G, steps=1)) > orth_error(newton_schulz(G, steps=10))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let T be invertible and P = √(T*T). Prove that S = TP⁻¹ is an isometry, so that T = SP is a polar decomposition.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes P is positive and invertible (T*T is positive definite since T is invertible), so P⁻¹ exists and is self-adjoint.",
          "Computes S*S = (P⁻¹)*T*TP⁻¹ = P⁻¹P²P⁻¹ = I.",
          "Concludes S is an isometry (S*S = I) and T = SP.",
        ],
      },
    },
    {
      key: "nearest",
      rung: "stretch",
      prompt: <p>What is the top-left entry of the orthogonal matrix nearest (in Frobenius norm) to [[3, 0], [4, 5]]? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.8944272, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend how every square matrix factors as an isometry times a positive matrix, why the isometry is the nearest orthogonal matrix, and how Newton–Schulz computes it.",

  glimpse: (
    <>
      <p>
        The polar factor is the nearest matrix with all singular values equal to 1. The next lesson asks the companion
        question: what is the nearest matrix of rank at most k? The answer, again from the SVD, is to keep the k largest
        singular values and drop the rest.
      </p>
      <p>
        Isometries come back later as orthogonal and unitary matrices in their own right: their eigenvalues lie on the unit
        circle, their products stay isometries, and they are the reason Householder and Givens methods are numerically stable.
      </p>
    </>
  ),
};
