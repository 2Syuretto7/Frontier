import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HouseholderViz } from "@/components/viz/HouseholderViz";
import type { LessonContent } from "@/lib/types";

const HH = `import numpy as np

def householder(x):
    v = np.array(x, dtype=float)
    v[0] += np.copysign(np.linalg.norm(v), v[0])
    return v / np.linalg.norm(v)

def apply_householder(v, A):
    return A - 2 * np.outer(v, v @ A)`;

const QR = `def householder_qr(A):
    R = np.array(A, dtype=float)
    m, n = R.shape
    Q = np.eye(m)
    for k in range(min(m - 1, n)):
        v = R[k:, k].copy()
        v[0] += np.copysign(np.linalg.norm(v), v[0])
        nv = np.linalg.norm(v)
        if nv == 0:
            continue
        v = v / nv
        R[k:] -= 2 * np.outer(v, v @ R[k:])
        Q[:, k:] -= 2 * np.outer(Q[:, k:] @ v, v)
    return Q, R

def cayley(S):
    I = np.eye(len(S))
    return np.linalg.solve(I - S, I + S)`;

export const lesson: LessonContent = {
  id: "m6.6.2",
  minutes: 55,
  links: {
    requires: ["m6.4.2", "m6.3.3"],
    revisits: ["m3.5.4", "m6.5.4"],
    foreshadows: ["m6.6.3"],
  },

  puzzle: (
    <>
      <p>
        Library QR factorisations do not use Gram–Schmidt; they use reflections. Deep linear networks initialised with
        orthogonal weight matrices train at the same speed whatever their depth, while Gaussian initialisations slow down.
        What is special about matrices that preserve length, what do their eigenvalues look like, and how are they built and
        parameterised in practice?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An orthogonal matrix is a rigid motion fixing the origin: rotations, reflections and their combinations. It changes
        neither lengths nor angles, so it never amplifies errors (κ = 1) and its inverse is just its transpose. Every such
        matrix is a product of simple reflections, and one reflection is enough to send any vector onto an axis, which is all
        QR needs.
      </p>
      <HouseholderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="orthogonal and unitary matrices">
        <p>
          A real square Q is orthogonal if <M>{"Q^\\top Q = I"}</M>; a complex U is unitary if <M>{"U^*U = I"}</M>. By the
          isometry lesson these are exactly the matrices with orthonormal columns, equivalently those that preserve inner
          products and norms. Products and inverses of orthogonal matrices are orthogonal, and{" "}
          <M>{"\\det Q = \\pm1"}</M>.
        </p>
      </Definition>

      <Theorem title="eigenvalues and normal form">
        <p>
          Every eigenvalue of a unitary matrix has absolute value 1. A unitary matrix is normal, so it is{" "}
          <M>{"W\\operatorname{diag}(e^{i\\theta_1}, \\dots, e^{i\\theta_n})W^*"}</M> with W unitary. A real orthogonal matrix
          is, in a suitable orthonormal basis, block diagonal with 2×2 rotation blocks and entries ±1.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"Uv = \\lambda v"}</M> with v ≠ 0, then{" "}
          <M>{"\\|v\\| = \\|Uv\\| = |\\lambda|\\,\\|v\\|"}</M>. <M>{"UU^* = I = U^*U"}</M>, so U is normal and the complex
          spectral theorem applies. For real Q, non-real eigenvalues come in conjugate pairs{" "}
          <M>{"e^{\\pm i\\theta}"}</M> with eigenvectors <M>{"z, \\bar z"}</M>; the real and imaginary parts of z span a
          real invariant plane on which Q acts as a rotation by θ, and the eigenvectors for ±1 can be taken real.
        </p>
      </Proof>

      <Definition title="Householder reflections and Givens rotations">
        <p>
          For a unit vector v, <M>{"H = I - 2vv^\\top"}</M> is the reflection in the hyperplane <M>{"v^\\perp"}</M>: it fixes{" "}
          <M>{"v^\\perp"}</M> and sends v to −v. It is symmetric, orthogonal and its own inverse, and{" "}
          <M>{"H = I - 2P"}</M> with P the orthogonal projection onto span(v). A Givens rotation is the identity except for a
          2×2 rotation block in coordinates i and j.
        </p>
      </Definition>

      <Theorem title="reflecting a vector onto an axis">
        <p>
          For x ≠ 0 with <M>{"x \\ne -\\|x\\|e_1"}</M>, let{" "}
          <M>{"v = (x + \\|x\\|e_1)/\\|x + \\|x\\|e_1\\|"}</M>. Then <M>{"(I - 2vv^\\top)x = -\\|x\\|e_1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"w = x + \\|x\\|e_1"}</M>. Then{" "}
          <M>{"w^\\top x = \\|x\\|^2 + \\|x\\|x_1"}</M> and{" "}
          <M>{"w^\\top w = \\|x\\|^2 + 2\\|x\\|x_1 + \\|x\\|^2 = 2w^\\top x"}</M>. So{" "}
          <M>{"Hx = x - 2w\\frac{w^\\top x}{w^\\top w} = x - w = -\\|x\\|e_1"}</M>. In floating point one uses{" "}
          <M>{"x + \\operatorname{sign}(x_1)\\|x\\|e_1"}</M>, which never cancels, and lands on{" "}
          <M>{"-\\operatorname{sign}(x_1)\\|x\\|e_1"}</M>.
        </p>
      </Proof>
      <Code>{HH}</Code>

      <Example title="Householder QR">
        <p>
          Reflect the first column of A onto the first axis, then the part of the second column below the diagonal onto its
          axis, and so on. After min(m − 1, n) reflections the matrix is upper triangular:{" "}
          <M>{"H_k\\cdots H_1A = R"}</M>, so <M>{"A = QR"}</M> with <M>{"Q = H_1\\cdots H_k"}</M>. Each step is orthogonal, so
          rounding errors are never amplified, and Q is orthogonal to machine precision, which classical Gram–Schmidt cannot
          promise.
        </p>
      </Example>

      <Remark title="parameterising orthogonal matrices">
        <p>
          Training an orthogonal weight needs a parameterisation. If S is skew-symmetric (<M>{"S^\\top = -S"}</M>), both{" "}
          <M>{"e^S"}</M> and the Cayley transform <M>{"(I - S)^{-1}(I + S)"}</M> are orthogonal with determinant 1; a product
          of Householder reflections with learned vectors is another option. Orthogonal initialisation makes every singular
          value of a deep linear network&apos;s end-to-end map equal to 1 at the start, so signals and gradients neither
          explode nor vanish with depth.
        </p>
        <Code>{QR}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "trace",
      rung: "check",
      prompt: <p>H = I − 2vvᵀ with v a unit vector in ℝ⁵. What is trace H?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "eig",
      rung: "check",
      prompt: <p>The rotation of ℝ² by 60° has eigenvalues e^(±iθ). What is their real part?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 1e-9 },
    },
    {
      key: "always",
      rung: "apply",
      prompt: <p>v is a unit vector and S a skew-symmetric matrix. Which matrix is always orthogonal?</p>,
      answer: { kind: "choice", options: ["I − 2vvᵀ", "I − vvᵀ", "I + S", "vvᵀ"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def householder(x):
    v = np.array(x, dtype=float)
    v[0] += np.copysign(np.linalg.norm(v), v[0])
    return v / np.linalg.norm(v)

def apply_householder(v, A):
    return A - 2 * np.outer(v, v @ A)

x = np.array([3.0, 4.0])
v = householder(x)
print(np.round(v, 4), np.round(apply_householder(v, x[:, None]).ravel(), 4) + 0.0)
H = apply_householder(v, np.eye(2))
print(np.round(H, 4), round(np.linalg.det(H), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8944 0.4472] [-5.  0.]\n[[-0.6 -0.8]\n [-0.8  0.6]] -1.0",
          "[0.8944 0.4472] [5. 0.]\n[[-0.6 -0.8]\n [-0.8  0.6]] -1.0",
          "[0.6 0.8] [-5.  0.]\n[[-0.6 -0.8]\n [-0.8  0.6]] 1.0",
          "[0.8944 0.4472] [-5.  0.]\n[[ 0.6  0.8]\n [ 0.8 -0.6]] -1.0",
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

def householder_qr(A):
    R = np.array(A, dtype=float)
    m, n = R.shape
    Q = np.eye(m)
    for k in range(min(m - 1, n)):
        v = R[k:, k].copy()
        v[0] += np.copysign(np.linalg.norm(v), v[0])
        nv = np.linalg.norm(v)
        if nv == 0:
            continue
        v = v / nv
        R[k:] -= 2 * np.outer(v, v @ R[k:])
        Q[:, k:] -= 2 * np.outer(Q[:, k:] @ v, v)
    return Q, R

def cayley(S):
    I = np.eye(len(S))
    return np.linalg.solve(I - S, I + S)

A = np.array([[3.0, 1.0], [4.0, 2.0]])
Q, R = householder_qr(A)
print(np.round(R, 4) + 0.0, np.allclose(Q @ R, A))
C = cayley(np.array([[0.0, -1.0], [1.0, 0.0]]))
print(np.round(C, 4) + 0.0, np.allclose(C.T @ C, np.eye(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-5.  -2.2]\n [ 0.   0.4]] True\n[[ 0. -1.]\n [ 1.  0.]] True",
          "[[ 5.   2.2]\n [ 0.  -0.4]] True\n[[ 0. -1.]\n [ 1.  0.]] True",
          "[[-5.  -2.2]\n [ 0.   0.4]] True\n[[ 1. -1.]\n [ 1.  1.]] False",
          "[[-5.  -2.2]\n [ 0.   0.4]] False\n[[ 0. -1.]\n [ 1.  0.]] True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>householder(x)</C>, the unit vector v with (I − 2vvᵀ)x = −sign(x₁)‖x‖e₁ (use v ∝ x + sign(x₁)‖x‖e₁, with{" "}
          <C>np.copysign</C>), and <C>apply_householder(v, A)</C>, computing (I − 2vvᵀ)A without forming the matrix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def householder(x):
    return x / np.linalg.norm(x)

def apply_householder(v, A):
    return A - np.outer(v, v @ A)
`,
        solution: HH,
        tests: [
          { name: "reflect", code: `rng = np.random.default_rng(0)
for _ in range(3):
    x = rng.normal(size=5)
    v = householder(x)
    y = apply_householder(v, x[:, None]).ravel()
    assert np.isclose(np.linalg.norm(v), 1) and np.allclose(y[1:], 0) and np.isclose(abs(y[0]), np.linalg.norm(x))
    assert np.sign(y[0]) == -np.sign(x[0])` },
          { name: "matrix", code: `v = householder(np.array([3.0, 4.0]))
H = apply_householder(v, np.eye(2))
assert np.allclose(H, [[-0.6, -0.8], [-0.8, 0.6]]) and np.allclose(H @ H, np.eye(2))
A = np.random.default_rng(1).normal(size=(4, 3)); u = householder(np.ones(4))
assert np.allclose(apply_householder(u, A), (np.eye(4) - 2 * np.outer(u, u)) @ A)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>householder_qr(A)</C> for an m×n matrix, returning square orthogonal Q and upper-triangular R with A = QR,
          using a Householder reflection for each of the first min(m − 1, n) columns; and <C>cayley(S)</C>, the Cayley
          transform (I − S)⁻¹(I + S).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def householder_qr(A):
    return np.eye(A.shape[0]), np.array(A, dtype=float)

def cayley(S):
    return np.eye(len(S)) + S
`,
        solution: `import numpy as np

${QR}`,
        tests: [
          { name: "qr", code: `rng = np.random.default_rng(2)
for shape in [(5, 3), (4, 4), (3, 5)]:
    A = rng.normal(size=shape)
    Q, R = householder_qr(A)
    assert Q.shape == (shape[0], shape[0]) and R.shape == shape
    assert np.allclose(Q @ R, A) and np.allclose(Q.T @ Q, np.eye(shape[0])) and np.allclose(np.tril(R, -1), 0)` },
          { name: "cayley", code: `rng = np.random.default_rng(3)
X = rng.normal(size=(4, 4)); S = X - X.T
C = cayley(S)
assert np.allclose(C.T @ C, np.eye(4)) and np.isclose(np.linalg.det(C), 1.0)
assert np.allclose(cayley(np.array([[0.0, -1.0], [1.0, 0.0]])), [[0.0, -1.0], [1.0, 0.0]])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that every eigenvalue λ of a unitary (or real orthogonal) matrix satisfies |λ| = 1.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes an eigenvector v ≠ 0 with Uv = λv (allowing complex λ and v).",
          "Uses that U preserves norms (from U*U = I: ‖Uv‖² = ⟨U*Uv, v⟩ = ‖v‖²) to get ‖v‖ = |λ|‖v‖, hence |λ| = 1.",
        ],
      },
    },
    {
      key: "cayleyangle",
      rung: "stretch",
      prompt: (
        <p>
          The Cayley transform of S = [[0, −t], [t, 0]] is a rotation of ℝ². For t = 0.5, through how many degrees does it
          rotate? Give 2 decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 53.130102, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend what an orthogonal matrix is, why its eigenvalues lie on the unit circle, and how Householder reflections compute a QR factorisation stably.",

  glimpse: (
    <>
      <p>
        The discrete Fourier matrix, scaled by <M>{"1/\\sqrt n"}</M>, is unitary, and it diagonalises every circulant matrix
        at once. That is the subject of the next lesson: circulant and Toeplitz matrices, and why convolution is
        multiplication in the Fourier basis.
      </p>
      <p>
        Unitary matrices also give the cleanest picture of signal propagation: a network whose layer Jacobians are all
        orthogonal preserves the norm of every gradient, the ideal that orthogonal initialisation aims for.
      </p>
    </>
  ),
};
