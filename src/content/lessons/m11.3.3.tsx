import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OrthLossViz } from "@/components/viz/OrthLossViz";
import type { LessonContent } from "@/lib/types";

const HH = `import numpy as np

def householder_qr(A):
    R = A.astype(float).copy()
    m, n = R.shape
    vs = []
    for k in range(n):
        x = R[k:, k]
        v = x.copy()
        v[0] += np.copysign(np.linalg.norm(x), x[0])
        v /= np.linalg.norm(v)
        R[k:, k:] -= 2 * np.outer(v, v @ R[k:, k:])
        vs.append(v)
    return vs, np.triu(R[:n])

def form_q(vs, m):
    Q = np.eye(m)[:, :len(vs)]
    for k in range(len(vs) - 1, -1, -1):
        Q[k:] -= 2 * np.outer(vs[k], vs[k] @ Q[k:])
    return Q`;

const GS = `import numpy as np

def cgs(A):
    Q = np.zeros(A.shape)
    for j in range(A.shape[1]):
        v = A[:, j] - Q[:, :j] @ (Q[:, :j].T @ A[:, j])
        Q[:, j] = v / np.linalg.norm(v)
    return Q

def mgs(A):
    Q = A.astype(float).copy()
    for j in range(Q.shape[1]):
        Q[:, j] /= np.linalg.norm(Q[:, j])
        Q[:, j + 1:] -= np.outer(Q[:, j], Q[:, j] @ Q[:, j + 1:])
    return Q

def orth_loss(Q):
    return float(np.linalg.norm(Q.T @ Q - np.eye(Q.shape[1])))`;

export const lesson: LessonContent = {
  id: "m11.3.3",
  minutes: 50,
  links: {
    requires: ["m11.3.1", "m3.5.4"],
    revisits: ["m11.2.2"],
    foreshadows: ["m11.3.4", "m11.4.2"],
  },

  puzzle: (
    <>
      <p>
        Gram-Schmidt is how everyone first learns to orthonormalise a set of vectors, and in exact arithmetic it is
        perfect. Run it in double precision on ten columns whose condition number is 10⁸ and the &quot;orthonormal&quot;
        columns it returns have inner products of order 0.1: not orthogonal in any useful sense. Reflecting vectors in
        mirrors, an apparently roundabout idea, produces columns orthogonal to sixteen digits on the same matrix. What does a
        reflection do that subtracting projections cannot?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gram-Schmidt builds each new direction by subtracting from a column its components along the earlier ones. When
        the columns are nearly dependent, what is left is a small difference of large vectors, which is cancellation: the
        rounding errors in the subtracted parts survive into the result, which then points partly along the earlier
        directions. Householder QR never subtracts to find a direction. It applies orthogonal reflections to the whole
        matrix, each chosen to zero out a column below the diagonal, and an orthogonal map moves every rounding error
        without stretching it. The orthogonal factor is a product of exact mirrors, so it stays orthogonal however
        badly conditioned A is.
      </p>
      <OrthLossViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Householder reflector">
        <p>For a unit vector v,</p>
        <MD>{"H = I - 2vv^\\top"}</MD>
        <p>
          reflects in the hyperplane perpendicular to v: Hv = −v and Hw = w for w ⊥ v. It is symmetric and orthogonal,
          since <M>{"H^\\top H = I - 4vv^\\top + 4v(v^\\top v)v^\\top = I"}</M>. Applying it costs one dot product and one
          update per column, <M>{"Hx = x - 2v(v^\\top x)"}</M>; H is never formed.
        </p>
      </Definition>

      <Theorem title="reflecting a vector onto an axis">
        <p>
          Let x ≠ 0, σ = sign(x₁) (with sign(0) = 1), and <M>{"u = x + \\sigma\\|x\\|e_1"}</M>, v = u/‖u‖. Then{" "}
          <M>{"Hx = -\\sigma\\|x\\|e_1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"u^\\top x = \\|x\\|^2 + \\sigma\\|x\\|x_1"}</M> and{" "}
          <M>{"\\|u\\|^2 = \\|x\\|^2 + 2\\sigma\\|x\\|x_1 + \\|x\\|^2 = 2u^\\top x"}</M>. So{" "}
          <M>{"Hx = x - 2u(u^\\top x)/\\|u\\|^2 = x - u = -\\sigma\\|x\\|e_1"}</M>. The sign is chosen so that{" "}
          <M>{"u_1 = x_1 + \\sigma\\|x\\|"}</M> adds two numbers of the same sign: the other choice, which also reflects x
          onto the axis, would cancel catastrophically when x is nearly a multiple of e₁.
        </p>
      </Proof>

      <Definition title="Householder QR">
        <p>
          For an m × n matrix A with m ≥ n, step k applies a reflector to rows k, …, m that zeros column k below the
          diagonal. After n steps, <M>{"H_n\\cdots H_1A = R"}</M> is upper triangular, so A = QR with{" "}
          <M>{"Q = H_1\\cdots H_n"}</M>. Storing only the vectors v, it costs <M>{"2mn^2 - \\tfrac23n^3"}</M> flops; Q, or
          its first n columns, is formed only if needed, by applying the reflectors to the columns of the identity in reverse
          order.
        </p>
        <Code>{HH}</Code>
      </Definition>

      <Theorem title="backward stability">
        <p>
          The computed <M>{"\\hat R"}</M> satisfies <M>{"A + \\Delta A = \\tilde Q\\hat R"}</M> for an exactly orthogonal{" "}
          <M>{"\\tilde Q"}</M> with <M>{"\\|\\Delta a_j\\| \\leq c\\,mn\\,u\\,\\|a_j\\|"}</M> for every column, and the computed
          Q satisfies <M>{"\\|\\hat Q^\\top\\hat Q - I\\| = O(mnu)"}</M>, independent of κ(A).
        </p>
      </Theorem>
      <Proof>
        <p>
          Each step applies a computed reflector, which differs from an exact one by O(u), to a vector. Write the computed
          result as the exact reflection of a slightly perturbed input. Since an orthogonal map preserves norms, the
          perturbations of earlier steps pass through later ones unchanged in size and simply add: after n steps the total
          is a sum of n terms, each O(mu) times the column norm. Nothing in this argument involves the singular values of
          A, so the conditioning never enters. Gram-Schmidt has no such structure: its errors are divided by the norm of
          what is left after subtraction, which can be as small as <M>{"\\sigma_n"}</M>.
        </p>
      </Proof>

      <Remark title="Gram-Schmidt, classical and modified">
        <p>
          Classical Gram-Schmidt computes all projections of a column from the original column; modified Gram-Schmidt
          subtracts each projection as soon as a new direction is known, so later projections are computed from the
          already-reduced vectors. In exact arithmetic they agree. In floating point, the loss of orthogonality{" "}
          <M>{"\\|Q^\\top Q - I\\|"}</M> is of order κ²u for classical (when κ²u &lt; 1) and κu for modified. For κ = 10⁸
          the code measures 10⁻¹, 10⁻⁹ and 10⁻¹⁵ for classical, modified and NumPy&apos;s Householder QR. Running classical
          Gram-Schmidt twice (&quot;twice is enough&quot;) restores orthogonality to O(u) when κu is well below 1, and is
          popular in Krylov methods because it parallelises well.
        </p>
        <Code>{GS}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "x34",
      rung: "check",
      prompt: <p>For x = (3, 4) and the reflector with the stable sign choice, what is the first entry of Hx?</p>,
      answer: { kind: "numeric", value: -5, tolerance: 0.0001 },
    },
    {
      key: "flops",
      rung: "check",
      prompt: <p>Using 2mn² − (2/3)n³, how many million flops does Householder QR of a 1000 × 100 matrix take?</p>,
      answer: { kind: "numeric", value: 19.333, tolerance: 0.01 },
    },
    {
      key: "sign",
      rung: "apply",
      prompt: <p>Why is u = x + sign(x₁)‖x‖e₁ used rather than u = x − sign(x₁)‖x‖e₁?</p>,
      answer: {
        kind: "choice",
        options: [
          "The other choice cancels in the first entry when x is nearly a multiple of e₁, making v inaccurate",
          "The other choice does not map x onto the e₁ axis",
          "The other choice gives a matrix H that is not orthogonal",
          "The other choice makes R lower triangular",
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

def householder_qr(A):
    R = A.astype(float).copy()
    m, n = R.shape
    vs = []
    for k in range(n):
        x = R[k:, k]
        v = x.copy()
        v[0] += np.copysign(np.linalg.norm(x), x[0])
        v /= np.linalg.norm(v)
        R[k:, k:] -= 2 * np.outer(v, v @ R[k:, k:])
        vs.append(v)
    return vs, np.triu(R[:n])

def form_q(vs, m):
    Q = np.eye(m)[:, :len(vs)]
    for k in range(len(vs) - 1, -1, -1):
        Q[k:] -= 2 * np.outer(vs[k], vs[k] @ Q[k:])
    return Q

A = np.array([[3.0, 1.0], [4.0, 2.0], [0.0, 2.0]])
vs, R = householder_qr(A)
Q = form_q(vs, 3)
print(np.round(R, 4) + 0.0, np.allclose(Q @ R, A), np.allclose(Q.T @ Q, np.eye(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-5.     -2.2   ]\n [ 0.     -2.0396]] True True",
          "[[5.     2.2   ]\n [0.     2.0396]] True True",
          "[[-5.     -2.2   ]\n [ 0.     -2.0396]] True False",
          "[[-5.     -2.2   ]\n [ 0.     -2.    ]] True True",
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

def cgs(A):
    Q = np.zeros(A.shape)
    for j in range(A.shape[1]):
        v = A[:, j] - Q[:, :j] @ (Q[:, :j].T @ A[:, j])
        Q[:, j] = v / np.linalg.norm(v)
    return Q

def mgs(A):
    Q = A.astype(float).copy()
    for j in range(Q.shape[1]):
        Q[:, j] /= np.linalg.norm(Q[:, j])
        Q[:, j + 1:] -= np.outer(Q[:, j], Q[:, j] @ Q[:, j + 1:])
    return Q

def orth_loss(Q):
    return float(np.linalg.norm(Q.T @ Q - np.eye(Q.shape[1])))

rng = np.random.default_rng(0)
U, _ = np.linalg.qr(rng.normal(size=(40, 10))); V, _ = np.linalg.qr(rng.normal(size=(10, 10)))
A = U @ np.diag(np.logspace(0, -8, 10)) @ V.T
print([round(float(np.log10(orth_loss(Q)))) for Q in [cgs(A), mgs(A), np.linalg.qr(A)[0]]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-1, -9, -15]", "[-9, -9, -15]", "[-1, -1, -15]", "[-15, -15, -15]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>householder_qr(A)</C>, returning the list of unit reflector vectors and the n × n upper triangular R, and{" "}
          <C>form_q(vs, m)</C>, returning the m × n matrix with orthonormal columns such that A = QR.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def householder_qr(A):
    return [], np.triu(A[:A.shape[1]])

def form_q(vs, m):
    return np.eye(m)[:, :len(vs)]
`,
        solution: HH,
        tests: [
          { name: "qr", code: `A = np.random.default_rng(12).normal(size=(7, 4))
vs, R = householder_qr(A); Q = form_q(vs, 7)
assert R.shape == (4, 4) and np.allclose(R, np.triu(R)) and Q.shape == (7, 4)
assert np.allclose(Q @ R, A) and np.allclose(Q.T @ Q, np.eye(4)) and all(abs(np.linalg.norm(v) - 1) < 1e-12 for v in vs)` },
          { name: "sign", code: `vs, R = householder_qr(np.array([[3.0], [4.0]]))
assert abs(R[0, 0] + 5.0) < 1e-12
vs, R = householder_qr(np.array([[-1.0, 0.0], [0.0, 2.0]]))
assert abs(R[0, 0] - 1.0) < 1e-12 and abs(abs(R[1, 1]) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cgs(A)</C> and <C>mgs(A)</C>, classical and modified Gram-Schmidt returning Q, and <C>orth_loss(Q)</C>,
          the Frobenius norm of QᵀQ − I.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cgs(A):
    return A

def mgs(A):
    return A

def orth_loss(Q):
    return 0.0
`,
        solution: GS,
        tests: [
          { name: "basic", code: `A = np.random.default_rng(13).normal(size=(6, 3))
for Q in [cgs(A), mgs(A)]:
    assert np.allclose(Q.T @ Q, np.eye(3)) and np.allclose(np.tril(Q.T @ A, -1), 0)
assert orth_loss(np.eye(3)[:, :2]) == 0.0 and abs(orth_loss(np.array([[1.0, 1.0], [0.0, 0.0]])) - np.sqrt(2.0)) < 1e-12` },
          { name: "ill", code: `rng = np.random.default_rng(14)
U, _ = np.linalg.qr(rng.normal(size=(30, 8))); V, _ = np.linalg.qr(rng.normal(size=(8, 8)))
A = U @ np.diag(np.logspace(0, -7, 8)) @ V.T
assert orth_loss(mgs(A)) < 1e-6 and orth_loss(cgs(A)) > 1e3 * orth_loss(mgs(A))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let x ≠ 0, σ = sign(x₁), u = x + σ‖x‖e₁ and H = I − 2uuᵀ/‖u‖². Prove that H is orthogonal and that Hx = −σ‖x‖e₁.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows H is symmetric and HᵀH = H² = I by expanding (I − 2vvᵀ)² with v = u/‖u‖ a unit vector.",
          "Computes uᵀx = ‖x‖² + σ‖x‖x₁ and ‖u‖² = 2‖x‖² + 2σ‖x‖x₁, so ‖u‖² = 2uᵀx.",
          "Concludes Hx = x − 2u(uᵀx)/‖u‖² = x − u = −σ‖x‖e₁.",
        ],
      },
    },
    {
      key: "unorm",
      rung: "stretch",
      prompt: <p>For x = (1, 1, 1, 1), what is ‖u‖² for u = x + sign(x₁)‖x‖e₁?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a Householder reflection zeros a column below the diagonal, why the sign choice matters, and why Householder QR keeps Q orthogonal to working precision while Gram-Schmidt loses orthogonality on ill-conditioned matrices.",

  glimpse: (
    <>
      <p>
        With a stable QR in hand, least squares can be solved through it. The textbook alternative, forming AᵀA and solving
        the normal equations, is faster and shorter, and the next lesson shows exactly what it throws away.
      </p>
    </>
  ),
};
