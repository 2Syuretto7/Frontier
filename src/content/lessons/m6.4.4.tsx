import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FilterFactorViz } from "@/components/viz/FilterFactorViz";
import type { LessonContent } from "@/lib/types";

const PINV = `import numpy as np

def pinv_svd(A, rcond=1e-12):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    s_inv = np.zeros_like(s)
    keep = s > rcond * s.max()
    s_inv[keep] = 1 / s[keep]
    return (Vt.T * s_inv) @ U.T

def penrose_ok(A, X, tol=1e-9):
    AX, XA = A @ X, X @ A
    return bool(np.allclose(AX @ A, A, atol=tol) and np.allclose(XA @ X, X, atol=tol)
                and np.allclose(AX, AX.T, atol=tol) and np.allclose(XA, XA.T, atol=tol))`;

const RIDGE = `def ridge_svd(A, b, lam):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return Vt.T @ (s / (s ** 2 + lam) * (U.T @ b))

def gd_from_zero(A, b, lr, steps):
    x = np.zeros(A.shape[1])
    for _ in range(steps):
        x = x - lr * A.T @ (A @ x - b)
    return x`;

export const lesson: LessonContent = {
  id: "m6.4.4",
  minutes: 55,
  links: {
    requires: ["m6.4.1", "m6.2.4"],
    revisits: ["m3.5.3"],
    foreshadows: ["m6.5.4"],
  },

  puzzle: (
    <>
      <p>
        Least squares via the normal equations needs independent columns; the minimum-norm formula needs independent rows.
        A real design matrix may have neither: duplicated features, more parameters than data. Is there one formula that
        always gives a sensible answer? And why does gradient descent started from zero land on that answer without being
        told to?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the SVD coordinates, A is diagonal: it scales the j-th input coordinate by <M>{"\\sigma_j"}</M>. The natural
        inverse divides by <M>{"\\sigma_j"}</M> where it can and does nothing where <M>{"\\sigma_j = 0"}</M>. That is the
        pseudoinverse. Dividing by tiny but nonzero singular values is legal but dangerous, which is why practical methods
        replace 1/σ by something tamer.
      </p>
      <FilterFactorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Moore–Penrose pseudoinverse">
        <p>
          If <M>{"A = U\\Sigma V^\\top"}</M> is a thin SVD with positive singular values <M>{"\\sigma_1, \\dots, \\sigma_r"}</M>,
          then <M>{"A^+ = V\\Sigma^{-1}U^\\top = \\sum_{j=1}^r \\sigma_j^{-1} v_j u_j^\\top"}</M>. Without coordinates:{" "}
          <M>{"A^+ b"}</M> is the unique vector in <M>{"(\\operatorname{null}A)^\\perp"}</M> that A maps to{" "}
          <M>{"P_{\\operatorname{range}A}\\,b"}</M>, so A⁺ does not depend on which SVD is used.
        </p>
      </Definition>

      <Theorem title="minimum-norm least squares">
        <p>
          For any A and b, <M>{"x^+ = A^+b"}</M> minimises <M>{"\\|Ax - b\\|"}</M>, and among all minimisers it has the
          smallest norm.
        </p>
      </Theorem>
      <Proof>
        <p>
          Extend to square orthogonal U and V and set <M>{"y = V^\\top x"}</M>, <M>{"c = U^\\top b"}</M>. Orthogonal
          matrices preserve norms, so{" "}
          <M>{"\\|Ax - b\\|^2 = \\|\\Sigma y - c\\|^2 = \\sum_{j \\le r}(\\sigma_j y_j - c_j)^2 + \\sum_{j > r} c_j^2"}</M>.
          This is minimal exactly when <M>{"y_j = c_j/\\sigma_j"}</M> for j ≤ r; the <M>{"y_j"}</M> for j &gt; r are free.
          Since <M>{"\\|x\\| = \\|y\\|"}</M>, the smallest minimiser sets those free coordinates to 0, which is{" "}
          <M>{"y = \\Sigma^+c"}</M>, i.e. <M>{"x = V\\Sigma^+U^\\top b = A^+b"}</M>.
        </p>
      </Proof>

      <Theorem title="properties">
        <p>
          <M>{"AA^+"}</M> is the orthogonal projection onto range A and <M>{"A^+A"}</M> the orthogonal projection onto{" "}
          <M>{"(\\operatorname{null}A)^\\perp"}</M>, the row space. A⁺ is the unique X satisfying the four Penrose
          conditions <M>{"AXA = A"}</M>, <M>{"XAX = X"}</M>, <M>{"(AX)^\\top = AX"}</M>, <M>{"(XA)^\\top = XA"}</M>. With
          independent columns <M>{"A^+ = (A^\\top A)^{-1}A^\\top"}</M>; with independent rows{" "}
          <M>{"A^+ = A^\\top(AA^\\top)^{-1}"}</M>; for invertible A, <M>{"A^+ = A^{-1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"AA^+ = U\\Sigma V^\\top V\\Sigma^{-1}U^\\top = UU^\\top"}</M>, the projection onto the span of{" "}
          <M>{"u_1, \\dots, u_r"}</M>, which is range A; similarly <M>{"A^+A = VV^\\top"}</M>. The four conditions follow
          from these. The special formulas agree with <M>{"V\\Sigma^{-1}U^\\top"}</M> on substituting the SVD. (Uniqueness:
          the conditions force AX and XA to be the two orthogonal projections, which pins down X.)
        </p>
      </Proof>
      <Code>{PINV}</Code>

      <Example title="ridge as a filtered pseudoinverse">
        <p>
          Ridge regression minimises <M>{"\\|Ax - b\\|^2 + \\lambda\\|x\\|^2"}</M>, with solution{" "}
          <M>{"(A^\\top A + \\lambda I)^{-1}A^\\top b = \\sum_j \\frac{\\sigma_j}{\\sigma_j^2 + \\lambda}(u_j^\\top b)\\,v_j"}</M>.
          For <M>{"\\sigma_j^2 \\gg \\lambda"}</M> the factor is about <M>{"1/\\sigma_j"}</M>; for{" "}
          <M>{"\\sigma_j^2 \\ll \\lambda"}</M> it is about <M>{"\\sigma_j/\\lambda"}</M>, so weak directions are damped
          instead of amplified. As <M>{"\\lambda \\to 0"}</M> the ridge solution tends to <M>{"A^+b"}</M>.
        </p>
      </Example>

      <Remark title="the implicit bias of gradient descent">
        <p>
          Gradient descent on <M>{"\\tfrac12\\|Ax - b\\|^2"}</M> from x = 0 moves along{" "}
          <M>{"A^\\top(Ax - b)"}</M>, which lies in the row space of A, so every iterate stays there. With a small enough
          step it converges to a minimiser, and the only minimiser in the row space is <M>{"A^+b"}</M>. Overparameterised
          linear models trained this way therefore pick the minimum-norm interpolant; when the smallest nonzero singular value
          is tiny, that solution has a huge norm, one ingredient of the &ldquo;double descent&rdquo; curve.
        </p>
        <Code>{RIDGE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "diag",
      rung: "check",
      prompt: <p>What is the trace of the pseudoinverse of diag(2, 0)?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 1e-9 },
    },
    {
      key: "column",
      rung: "check",
      prompt: <p>A is the single column (1, 1) and b = (1, 3). What is A⁺b?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
    {
      key: "proj",
      rung: "apply",
      prompt: <p>For any real matrix A, what is AA⁺?</p>,
      answer: {
        kind: "choice",
        options: [
          "the orthogonal projection onto the range of A",
          "the identity matrix",
          "the orthogonal projection onto the null space of A",
          "the same matrix as A⁺A",
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

def pinv_svd(A, rcond=1e-12):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    s_inv = np.zeros_like(s)
    keep = s > rcond * s.max()
    s_inv[keep] = 1 / s[keep]
    return (Vt.T * s_inv) @ U.T

def penrose_ok(A, X, tol=1e-9):
    AX, XA = A @ X, X @ A
    return bool(np.allclose(AX @ A, A, atol=tol) and np.allclose(XA @ X, X, atol=tol)
                and np.allclose(AX, AX.T, atol=tol) and np.allclose(XA, XA.T, atol=tol))

A = np.array([[1.0, 1.0], [1.0, 1.0], [0.0, 0.0]])
P = pinv_svd(A)
print(np.round(P, 4) + 0.0)
b = np.array([1.0, 3.0, 5.0])
print(penrose_ok(A, P), penrose_ok(A, A.T / 2), P @ b, A @ P @ b)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25 0.25 0.  ]\n [0.25 0.25 0.  ]]\nTrue False [1. 1.] [2. 2. 0.]",
          "[[0.5 0.5 0. ]\n [0.5 0.5 0. ]]\nTrue False [2. 2.] [4. 4. 0.]",
          "[[0.25 0.25 0.  ]\n [0.25 0.25 0.  ]]\nTrue True [1. 1.] [2. 2. 0.]",
          "[[0.25 0.25 0.  ]\n [0.25 0.25 0.  ]]\nTrue False [1. 1.] [1. 3. 5.]",
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

def ridge_svd(A, b, lam):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return Vt.T @ (s / (s ** 2 + lam) * (U.T @ b))

def gd_from_zero(A, b, lr, steps):
    x = np.zeros(A.shape[1])
    for _ in range(steps):
        x = x - lr * A.T @ (A @ x - b)
    return x

A = np.array([[1.0, 1.0], [1.0, 1.0], [0.0, 0.0]])
b = np.array([1.0, 3.0, 5.0])
print(np.round(ridge_svd(A, b, 1e-8), 4), np.round(ridge_svd(A, b, 4.0), 4))
print(np.round(gd_from_zero(A, b, 0.1, 500), 4), np.round(gd_from_zero(A, b, 0.1, 1), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1. 1.] [0.5 0.5]\n[1. 1.] [0.4 0.4]", "[1. 1.] [1. 1.]\n[1. 1.] [0.4 0.4]", "[1. 1.] [0.5 0.5]\n[2. 0.] [0.4 0.4]", "[1. 1.] [0.25 0.25]\n[1. 1.] [0.8 0.8]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pinv_svd(A, rcond=1e-12)</C>, the pseudoinverse from a thin SVD, treating singular values at most
          rcond·σ₁ as zero, and <C>penrose_ok(A, X, tol=1e-9)</C>, True when X satisfies all four Penrose conditions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pinv_svd(A, rcond=1e-12):
    return A.T

def penrose_ok(A, X, tol=1e-9):
    return bool(np.allclose(A @ X @ A, A, atol=tol))
`,
        solution: PINV,
        tests: [
          { name: "pinv", code: `rng = np.random.default_rng(0)
for shape in [(5, 3), (3, 5)]:
    A = rng.normal(size=shape)
    assert np.allclose(pinv_svd(A), np.linalg.pinv(A))
D = rng.normal(size=(6, 2)) @ rng.normal(size=(2, 4))
assert np.allclose(pinv_svd(D), np.linalg.pinv(D)) and pinv_svd(D).shape == (4, 6)
assert np.allclose(pinv_svd(np.diag([2.0, 0.0])), np.diag([0.5, 0.0]))` },
          { name: "penrose", code: `A = np.array([[1.0, 1.0], [1.0, 1.0], [0.0, 0.0]])
assert penrose_ok(A, np.linalg.pinv(A)) is True
assert penrose_ok(A, A.T / 2) is False
X = np.linalg.pinv(A) + np.array([[0.0, 0.0, 1.0], [0.0, 0.0, -1.0]])
assert np.allclose(A @ X @ A, A) and penrose_ok(A, X) is False` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ridge_svd(A, b, lam)</C>, the ridge solution computed from a thin SVD with filter factors σ/(σ² + λ), and{" "}
          <C>gd_from_zero(A, b, lr, steps)</C>, plain gradient descent on ½‖Ax − b‖² starting from the zero vector.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ridge_svd(A, b, lam):
    return np.linalg.lstsq(A, b, rcond=None)[0]

def gd_from_zero(A, b, lr, steps):
    return np.zeros(A.shape[1])
`,
        solution: `import numpy as np

${RIDGE}`,
        tests: [
          { name: "ridge", code: `rng = np.random.default_rng(1)
A = rng.normal(size=(8, 3)); b = rng.normal(size=8)
assert np.allclose(ridge_svd(A, b, 0.7), np.linalg.solve(A.T @ A + 0.7 * np.eye(3), A.T @ b))
assert np.allclose(ridge_svd(np.diag([2.0, 0.1]), np.ones(2), 0.01), [2 / 4.01, 5.0])` },
          { name: "implicit bias", code: `rng = np.random.default_rng(2)
A = rng.normal(size=(3, 6)); b = rng.normal(size=3)
x = gd_from_zero(A, b, 0.05, 3000)
assert np.allclose(x, np.linalg.pinv(A) @ b, atol=1e-6)
assert np.allclose(gd_from_zero(A, b, 0.05, 1), 0.05 * A.T @ b)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that A⁺b minimises ‖Ax − b‖ and has the smallest norm among all minimisers. You may use the SVD A = UΣVᵀ with
          U and V square orthogonal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Changes variables y = Vᵀx, c = Uᵀb and uses that orthogonal matrices preserve norms, so ‖Ax − b‖² = Σⱼ≤ᵣ(σⱼyⱼ − cⱼ)² + Σⱼ>ᵣ cⱼ².",
          "Concludes the minimisers are exactly yⱼ = cⱼ/σⱼ for j ≤ r with yⱼ (j > r) arbitrary.",
          "Uses ‖x‖ = ‖y‖ to show the minimum-norm minimiser sets yⱼ = 0 for j > r, which is x = VΣ⁺Uᵀb = A⁺b.",
        ],
      },
    },
    {
      key: "damp",
      rung: "stretch",
      prompt: (
        <p>
          A = diag(2, 0.1), b = (1, 1). The pseudoinverse solution has second component 10. What is the second component of
          the ridge solution with λ = 0.01?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend how the pseudoinverse is built from the SVD, why A⁺b is the minimum-norm least squares solution, and how ridge regression and truncation tame small singular values.",

  glimpse: (
    <>
      <p>
        The ratio of the largest to the smallest kept singular value controls how badly 1/σ amplifies errors. Later in the
        course that ratio gets a name, the condition number, and a theorem bounding the error of any linear solve in terms
        of it.
      </p>
      <p>
        Next, the last SVD lesson: principal component analysis, where the singular vectors of a centred data matrix are the
        directions of greatest variance.
      </p>
    </>
  ),
};
