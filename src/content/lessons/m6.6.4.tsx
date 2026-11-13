import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WoodburyCostViz } from "@/components/viz/WoodburyCostViz";
import type { LessonContent } from "@/lib/types";

const WOOD = `import numpy as np

def sherman_morrison(Ainv, u, v):
    Au, vA = Ainv @ u, v @ Ainv
    return Ainv - np.outer(Au, vA) / (1 + v @ Au)

def woodbury_solve(d, U, b):
    Dinv_b, Dinv_U = b / d, U / d[:, None]
    small = np.eye(U.shape[1]) + U.T @ Dinv_U
    return Dinv_b - Dinv_U @ np.linalg.solve(small, U.T @ Dinv_b)`;

const LOGDET = `def logdet_dplr(d, U):
    small = np.eye(U.shape[1]) + U.T @ (U / d[:, None])
    return float(np.log(d).sum() + np.linalg.slogdet(small)[1])

def dplr_quadform(x, d, U):
    Dinv_x, Dinv_U = x / d, U / d[:, None]
    small = np.eye(U.shape[1]) + U.T @ Dinv_U
    w = U.T @ Dinv_x
    return float(x @ Dinv_x - w @ np.linalg.solve(small, w))`;

export const lesson: LessonContent = {
  id: "m6.6.4",
  minutes: 55,
  links: {
    requires: ["m6.4.3", "m6.6.1"],
    revisits: ["m6.4.5", "m6.3.4"],
    foreshadows: ["l2.6.2"],
  },

  puzzle: (
    <>
      <p>
        A Gaussian with covariance <M>{"D + WW^\\top"}</M>, D diagonal and W of size 100,000×20, appears in factor analysis,
        probabilistic PCA and sparse Gaussian processes. Its likelihood needs <M>{"\\Sigma^{-1}x"}</M> and{" "}
        <M>{"\\log\\det\\Sigma"}</M>. Storing Σ would take 80 GB and factorising it about <M>{"10^{15}"}</M> operations. How
        can both be computed in a fraction of a second?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        D is trivial to invert, and the low-rank part only acts inside a k-dimensional subspace. So the inverse of the sum
        should be D⁻¹ plus a correction that also lives in that subspace and needs only a k×k solve. The Woodbury identity is
        that correction, and the matrix determinant lemma does the same for the determinant.
      </p>
      <WoodburyCostViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Sherman–Morrison">
        <p>
          If A is invertible and <M>{"1 + v^\\top A^{-1}u \\ne 0"}</M>, then
        </p>
        <MD>{"(A + uv^\\top)^{-1} = A^{-1} - \\frac{A^{-1}uv^\\top A^{-1}}{1 + v^\\top A^{-1}u}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Multiply A + uvᵀ by the right side and write <M>{"\\beta = v^\\top A^{-1}u"}</M>:{" "}
          <M>{"I + uv^\\top A^{-1} - \\frac{uv^\\top A^{-1} + u\\beta v^\\top A^{-1}}{1 + \\beta} = I + uv^\\top A^{-1} - uv^\\top A^{-1} = I"}</M>.
        </p>
      </Proof>

      <Theorem title="Woodbury identity">
        <p>
          If A (n×n) and C (k×k) are invertible, U is n×k and V is n×k, and{" "}
          <M>{"C^{-1} + V^\\top A^{-1}U"}</M> is invertible, then
        </p>
        <MD>{"(A + UCV^\\top)^{-1} = A^{-1} - A^{-1}U(C^{-1} + V^\\top A^{-1}U)^{-1}V^\\top A^{-1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"K = C^{-1} + V^\\top A^{-1}U"}</M>. Multiplying A + UCVᵀ by the right side gives{" "}
          <M>{"I + UCV^\\top A^{-1} - U K^{-1}V^\\top A^{-1} - UCV^\\top A^{-1}UK^{-1}V^\\top A^{-1}"}</M>. The last two terms
          are <M>{"-UC(C^{-1} + V^\\top A^{-1}U)K^{-1}V^\\top A^{-1} = -UCV^\\top A^{-1}"}</M>, which cancels the second term.
        </p>
      </Proof>

      <Theorem title="matrix determinant lemma">
        <p>
          <M>{"\\det(A + UV^\\top) = \\det(A)\\det(I_k + V^\\top A^{-1}U)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Factor <M>{"A + UV^\\top = A(I_n + A^{-1}UV^\\top)"}</M>, so it suffices to show{" "}
          <M>{"\\det(I_n + XY^\\top) = \\det(I_k + Y^\\top X)"}</M> for n×k X, Y. Compute the determinant of{" "}
          <M>{"\\begin{pmatrix} I_n & -X \\\\ Y^\\top & I_k\\end{pmatrix}"}</M> by eliminating in two ways: clearing the
          bottom-left block leaves <M>{"\\det(I_n)\\det(I_k + Y^\\top X)"}</M>, and clearing the top-right block leaves{" "}
          <M>{"\\det(I_n + XY^\\top)\\det(I_k)"}</M>.
        </p>
      </Proof>

      <Example title="diagonal plus low rank">
        <p>
          For <M>{"\\Sigma = D + UU^\\top"}</M> with D diagonal and positive, apply Woodbury with A = D and C = I. Solving{" "}
          <M>{"\\Sigma x = b"}</M> needs D⁻¹b and D⁻¹U (O(nk)), the k×k matrix <M>{"I + U^\\top D^{-1}U"}</M> (O(nk²)) and a
          k×k solve (O(k³)). The determinant lemma gives{" "}
          <M>{"\\log\\det\\Sigma = \\sum_i\\log d_i + \\log\\det(I + U^\\top D^{-1}U)"}</M> at the same cost. Together they
          give the Gaussian log-likelihood without ever forming Σ.
        </p>
        <Code>{WOOD}</Code>
      </Example>

      <Remark title="where it appears, and a caution">
        <p>
          Factor analysis and probabilistic PCA model covariances as diagonal plus low rank; inducing-point Gaussian
          processes use the same structure; L-BFGS stores its inverse-Hessian approximation as a low-rank update of a
          diagonal; Kalman filters and online least squares update inverses one rank at a time with Sherman–Morrison. The
          identities are exact, but if <M>{"C^{-1} + V^\\top A^{-1}U"}</M> is badly conditioned, cancellation can lose
          accuracy, so the k×k system should be solved with a Cholesky factorisation when it is positive definite rather than
          inverted.
        </p>
        <Code>{LOGDET}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sm",
      rung: "check",
      prompt: <p>A = 2I (2×2), u = (1, 0), v = (0, 1). What is the entry in row 1, column 2 of (A + uvᵀ)⁻¹?</p>,
      answer: { kind: "numeric", value: -0.25, tolerance: 1e-9 },
    },
    {
      key: "det",
      rung: "check",
      prompt: <p>u, v ∈ ℝⁿ with vᵀu = 3. What is det(I + uvᵀ)?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "cost",
      rung: "apply",
      prompt: <p>Roughly how many operations does solving (D + UUᵀ)x = b by Woodbury take, for D diagonal n×n and U n×k?</p>,
      answer: { kind: "choice", options: ["O(nk² + k³)", "O(n³)", "O(n²k)", "O(k³) only"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def sherman_morrison(Ainv, u, v):
    Au, vA = Ainv @ u, v @ Ainv
    return Ainv - np.outer(Au, vA) / (1 + v @ Au)

def woodbury_solve(d, U, b):
    Dinv_b, Dinv_U = b / d, U / d[:, None]
    small = np.eye(U.shape[1]) + U.T @ Dinv_U
    return Dinv_b - Dinv_U @ np.linalg.solve(small, U.T @ Dinv_b)

print(sherman_morrison(np.eye(2) / 2, np.array([1.0, 0.0]), np.array([0.0, 1.0])))
d = np.array([1.0, 2.0, 4.0])
U = np.ones((3, 1))
b = np.ones(3)
x = woodbury_solve(d, U, b)
print(np.round(x, 4), np.allclose((np.diag(d) + U @ U.T) @ x, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[ 0.5  -0.25]\n [ 0.    0.5 ]]\n[0.3636 0.1818 0.0909] True",
          "[[ 0.5   0.25]\n [ 0.    0.5 ]]\n[0.3636 0.1818 0.0909] True",
          "[[ 0.5  -0.25]\n [ 0.    0.5 ]]\n[1.   0.5  0.25] False",
          "[[ 0.5  0. ]\n [-0.25  0.5 ]]\n[0.3636 0.1818 0.0909] True",
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

def logdet_dplr(d, U):
    small = np.eye(U.shape[1]) + U.T @ (U / d[:, None])
    return float(np.log(d).sum() + np.linalg.slogdet(small)[1])

def dplr_quadform(x, d, U):
    Dinv_x, Dinv_U = x / d, U / d[:, None]
    small = np.eye(U.shape[1]) + U.T @ Dinv_U
    w = U.T @ Dinv_x
    return float(x @ Dinv_x - w @ np.linalg.solve(small, w))

d = np.array([1.0, 2.0, 4.0])
U = np.ones((3, 1))
b = np.ones(3)
print(round(logdet_dplr(d, U), 4), round(np.log(22.0), 4))
print(round(dplr_quadform(b, d, U), 4), round(dplr_quadform(b, d, np.zeros((3, 1))), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.091 3.091\n0.6364 1.75", "2.0794 3.091\n0.6364 1.75", "3.091 3.091\n1.75 0.6364", "3.091 3.091\n0.6364 3.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sherman_morrison(Ainv, u, v)</C>, returning (A + uvᵀ)⁻¹ from A⁻¹, and <C>woodbury_solve(d, U, b)</C>,
          solving (diag(d) + UUᵀ)x = b without forming any n×n matrix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sherman_morrison(Ainv, u, v):
    return Ainv

def woodbury_solve(d, U, b):
    return b / d
`,
        solution: WOOD,
        tests: [
          { name: "sherman-morrison", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(5, 5)) + 5 * np.eye(5); u, v = rng.normal(size=5), rng.normal(size=5)
assert np.allclose(sherman_morrison(np.linalg.inv(A), u, v), np.linalg.inv(A + np.outer(u, v)))
assert np.allclose(sherman_morrison(np.eye(2) / 2, np.array([1.0, 0.0]), np.array([0.0, 1.0])), [[0.5, -0.25], [0.0, 0.5]])` },
          { name: "woodbury", code: `rng = np.random.default_rng(1)
n, k = 50, 3
d = rng.uniform(0.5, 2.0, size=n); U = rng.normal(size=(n, k)); b = rng.normal(size=n)
x = woodbury_solve(d, U, b)
assert np.allclose((np.diag(d) + U @ U.T) @ x, b)
assert np.allclose(woodbury_solve(np.array([1.0, 2.0, 4.0]), np.ones((3, 1)), np.ones(3)), np.array([1.0, 0.5, 0.25]) / 2.75)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For Σ = diag(d) + UUᵀ, write <C>logdet_dplr(d, U)</C>, log det Σ by the determinant lemma, and{" "}
          <C>dplr_quadform(x, d, U)</C>, the quadratic form xᵀΣ⁻¹x by Woodbury, both as floats and without forming Σ.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def logdet_dplr(d, U):
    return float(np.log(d).sum())

def dplr_quadform(x, d, U):
    return float(x @ (x / d))
`,
        solution: `import numpy as np

${LOGDET}`,
        tests: [
          { name: "logdet", code: `rng = np.random.default_rng(2)
d = rng.uniform(0.5, 2.0, size=30); U = rng.normal(size=(30, 4))
S = np.diag(d) + U @ U.T
assert np.isclose(logdet_dplr(d, U), np.linalg.slogdet(S)[1])
assert np.isclose(logdet_dplr(np.array([1.0, 2.0, 4.0]), np.ones((3, 1))), np.log(22.0))` },
          { name: "quadform", code: `rng = np.random.default_rng(3)
d = rng.uniform(0.5, 2.0, size=30); U = rng.normal(size=(30, 4)); x = rng.normal(size=30)
S = np.diag(d) + U @ U.T
assert np.isclose(dplr_quadform(x, d, U), x @ np.linalg.solve(S, x))
assert isinstance(dplr_quadform(x, d, U), float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the Sherman–Morrison formula for (A + uvᵀ)⁻¹, assuming A is invertible and 1 + vᵀA⁻¹u ≠ 0.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Multiplies A + uvᵀ by the proposed inverse and expands into I + uvᵀA⁻¹ minus a fraction.",
          "Uses that vᵀA⁻¹u = β is a scalar, so u(vᵀA⁻¹u)vᵀA⁻¹ = βuvᵀA⁻¹, and simplifies (1 + β)uvᵀA⁻¹/(1 + β) to get I.",
        ],
      },
    },
    {
      key: "detlemma",
      rung: "stretch",
      prompt: <p>What is det(diag(1, 2, 4) + 11ᵀ), where 1 = (1, 1, 1)?</p>,
      answer: { kind: "numeric", value: 22, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend the Woodbury identity and the matrix determinant lemma, and why they make solves and log-determinants with diagonal-plus-low-rank matrices cost O(nk²) instead of O(n³).",

  glimpse: (
    <>
      <p>
        One more structure closes the chapter: Kronecker products A ⊗ B, whose inverse, eigenvalues and SVD all come from
        those of A and B, so that a matrix of size mn×mn can be handled through two small ones.
      </p>
      <p>
        In the learning course, probabilistic PCA writes the data covariance as σ²I + WWᵀ, and the identities here are what
        make fitting it by maximum likelihood or EM cheap.
      </p>
    </>
  ),
};
