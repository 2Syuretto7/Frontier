import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InterlaceViz } from "@/components/viz/InterlaceViz";
import type { LessonContent } from "@/lib/types";

const RQ = `import numpy as np

def rayleigh(A, x):
    return float(x @ A @ x / (x @ x))

def rq_iteration(A, x, iters=10):
    x = x / np.linalg.norm(x)
    for _ in range(iters):
        r = rayleigh(A, x)
        try:
            y = np.linalg.solve(A - r * np.eye(len(A)), x)
        except np.linalg.LinAlgError:
            break
        x = y / np.linalg.norm(y)
    return rayleigh(A, x), x`;

const CF = `def max_rayleigh_on_subspace(A, V):
    Q, _ = np.linalg.qr(np.asarray(V, dtype=float))
    return float(np.linalg.eigvalsh(Q.T @ A @ Q).max())

def block_eigs(A):
    return [np.linalg.eigvalsh(A[:k, :k]) for k in range(1, len(A) + 1)]

def interlaces(A, tol=1e-9):
    ev = block_eigs(A)
    return all(bool(np.all(a[:-1] <= b + tol) and np.all(b <= a[1:] + tol)) for b, a in zip(ev, ev[1:]))`;

export const lesson: LessonContent = {
  id: "m6.3.5",
  minutes: 60,
  links: {
    requires: ["m6.3.3", "m6.3.4"],
    revisits: ["m3.7.4"],
    foreshadows: ["m6.4.5", "m6.5.3"],
  },

  puzzle: (
    <>
      <p>
        The first principal component is the direction of largest variance; the second is the direction of largest variance
        perpendicular to the first. Spectral clustering uses the eigenvector of the second-smallest Laplacian eigenvalue.
        Both describe eigenvalues as answers to optimisation problems. Can every eigenvalue of a symmetric matrix be described
        that way, without reference to the others&apos; eigenvectors?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The Rayleigh quotient <M>{"R(x) = \\langle Ax, x\\rangle / \\langle x, x\\rangle"}</M> averages the eigenvalues with
        weights given by how much of x lies along each eigenvector. Its extremes are the extreme eigenvalues. For the k-th
        eigenvalue, give an adversary a k-dimensional subspace and let them pick the worst vector in it; the best subspace
        you can offer makes the worst case exactly <M>{"\\lambda_k"}</M>. One consequence is that eigenvalues move in an
        orderly way when a matrix grows or is perturbed.
      </p>
      <InterlaceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Rayleigh quotient">
        <p>
          For a self-adjoint operator A on an n-dimensional real or complex inner product space and x ≠ 0,{" "}
          <M>{"R(x) = \\langle Ax, x\\rangle / \\langle x, x\\rangle"}</M>. Write the eigenvalues in increasing order,{" "}
          <M>{"\\lambda_1 \\le \\dots \\le \\lambda_n"}</M>, with an orthonormal eigenbasis <M>{"e_1, \\dots, e_n"}</M>.
        </p>
      </Definition>

      <Theorem title="extremes of the Rayleigh quotient">
        <p>
          <M>{"\\lambda_1 \\le R(x) \\le \\lambda_n"}</M> for all x ≠ 0, with the bounds attained at <M>{"e_1"}</M> and{" "}
          <M>{"e_n"}</M>. In the real case the critical points of R are exactly the eigenvectors.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"x = \\sum_j c_j e_j"}</M>. Then <M>{"Ax = \\sum_j \\lambda_j c_j e_j"}</M>, so{" "}
          <M>{"R(x) = \\sum_j \\lambda_j |c_j|^2 / \\sum_j |c_j|^2"}</M>, a weighted average of the eigenvalues, which lies
          between the smallest and the largest. For the critical points, in <M>{"\\mathbb{R}^n"}</M> the gradient is{" "}
          <M>{"\\nabla R(x) = 2(Ax - R(x)x)/\\|x\\|^2"}</M>, which vanishes exactly when <M>{"Ax = R(x)x"}</M>.
        </p>
      </Proof>

      <Theorem title="Courant–Fischer">
        <p>For k = 1, …, n,</p>
        <MD>{"\\lambda_k = \\min_{\\dim U = k}\\ \\max_{0 \\ne x \\in U} R(x) = \\max_{\\dim U = n-k+1}\\ \\min_{0 \\ne x \\in U} R(x)."}</MD>
      </Theorem>
      <Proof>
        <p>
          For the first formula, take <M>{"U = \\operatorname{span}(e_1, \\dots, e_k)"}</M>: on it R is a weighted average of{" "}
          <M>{"\\lambda_1, \\dots, \\lambda_k"}</M>, so its maximum is <M>{"\\lambda_k"}</M>. Conversely, let U be any
          k-dimensional subspace and <M>{"W = \\operatorname{span}(e_k, \\dots, e_n)"}</M>, of dimension n − k + 1. Since{" "}
          <M>{"\\dim U + \\dim W = n + 1 > n"}</M>, they share a nonzero x. On W, R is an average of{" "}
          <M>{"\\lambda_k, \\dots, \\lambda_n"}</M>, so <M>{"R(x) \\ge \\lambda_k"}</M>, and the maximum over U is at least{" "}
          <M>{"\\lambda_k"}</M>. The second formula follows by applying the first to −A.
        </p>
      </Proof>

      <Theorem title="Cauchy interlacing">
        <p>
          If B is the (n − 1)×(n − 1) leading block of a symmetric A, with eigenvalues{" "}
          <M>{"\\mu_1 \\le \\dots \\le \\mu_{n-1}"}</M>, then <M>{"\\lambda_k \\le \\mu_k \\le \\lambda_{k+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The Rayleigh quotient of B at y equals that of A at (y, 0). So{" "}
          <M>{"\\mu_k"}</M> is the min–max of R over k-dimensional subspaces of the hyperplane{" "}
          <M>{"\\{x_n = 0\\}"}</M>, a smaller family than all k-dimensional subspaces, so{" "}
          <M>{"\\mu_k \\ge \\lambda_k"}</M>. Applying the max–min form in the same way gives{" "}
          <M>{"\\mu_k \\le \\lambda_{k+1}"}</M>.
        </p>
      </Proof>
      <Code>{CF}</Code>

      <Example title="Rayleigh quotient iteration">
        <p>
          If x is close to an eigenvector, R(x) is very close to its eigenvalue: the error in R is of the order of the square
          of the error in x, because x is a critical point. Inverse iteration with the shift R(x),{" "}
          <M>{"x \\leftarrow (A - R(x)I)^{-1}x"}</M>, then converges cubically for symmetric matrices. The shifted matrix
          becomes nearly singular as it converges, which is exactly what makes the step so effective.
        </p>
        <Code>{RQ}</Code>
      </Example>

      <Remark title="in machine learning">
        <p>
          PCA maximises the variance <M>{"w^\\top\\Sigma w"}</M> over unit w, the Rayleigh quotient of the covariance, and
          the k-th component comes from the max–min with the earlier ones excluded. In spectral clustering the graph Laplacian
          L has <M>{"\\lambda_1 = 0"}</M> with eigenvector <M>{"\\mathbf{1}"}</M>, and the second eigenvalue is the minimum of{" "}
          <M>{"x^\\top Lx / x^\\top x"}</M> over x orthogonal to <M>{"\\mathbf{1}"}</M>, a relaxed version of finding a
          balanced cut.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rq",
      rung: "check",
      prompt: <p>A = diag(1, 2, 5). What is the Rayleigh quotient R(x) at x = (1, 1, 1)? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 2.6666667, tolerance: 1e-4 },
    },
    {
      key: "max",
      rung: "check",
      prompt: <p>What is the largest value of xᵀAx over unit vectors x, for A = [[2, 1], [1, 2]]?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "cf",
      rung: "apply",
      prompt: <p>For a symmetric A with eigenvalues λ₁ ≤ λ₂ ≤ … ≤ λₙ, which expression equals λ₂?</p>,
      answer: {
        kind: "choice",
        options: [
          "the minimum over 2-dimensional subspaces U of the maximum of R(x) over nonzero x in U",
          "the maximum over 2-dimensional subspaces U of the maximum of R(x) over nonzero x in U",
          "the minimum over 2-dimensional subspaces U of the minimum of R(x) over nonzero x in U",
          "R(e₂), where e₂ is the second standard basis vector",
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

def rayleigh(A, x):
    return float(x @ A @ x / (x @ x))

def rq_iteration(A, x, iters=10):
    x = x / np.linalg.norm(x)
    for _ in range(iters):
        r = rayleigh(A, x)
        try:
            y = np.linalg.solve(A - r * np.eye(len(A)), x)
        except np.linalg.LinAlgError:
            break
        x = y / np.linalg.norm(y)
    return rayleigh(A, x), x

A = np.diag([1.0, 2.0, 5.0])
print(rayleigh(A, np.array([1.0, 1.0, 0.0])), round(rayleigh(A, np.ones(3)), 4))
lam, x = rq_iteration(A, np.array([0.1, 1.0, 0.1]))
print(round(lam, 6), np.round(np.abs(x), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5 2.6667\n2.0 [0. 1. 0.]", "1.5 2.6667\n5.0 [0. 0. 1.]", "3.0 8.0\n2.0 [0. 1. 0.]", "1.5 2.6667\n1.0 [1. 0. 0.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def max_rayleigh_on_subspace(A, V):
    Q, _ = np.linalg.qr(np.asarray(V, dtype=float))
    return float(np.linalg.eigvalsh(Q.T @ A @ Q).max())

def block_eigs(A):
    return [np.linalg.eigvalsh(A[:k, :k]) for k in range(1, len(A) + 1)]

def interlaces(A, tol=1e-9):
    ev = block_eigs(A)
    return all(bool(np.all(a[:-1] <= b + tol) and np.all(b <= a[1:] + tol)) for b, a in zip(ev, ev[1:]))

B = np.array([[2.0, 1.0, 0.0], [1.0, 2.0, 1.0], [0.0, 1.0, 2.0]])
print(max_rayleigh_on_subspace(B, np.eye(3)[:, :1]), round(max_rayleigh_on_subspace(B, np.eye(3)[:, :2]), 4))
print(np.round(np.linalg.eigvalsh(B), 4), interlaces(B))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 3.0\n[0.5858 2.     3.4142] True",
          "2.0 3.4142\n[0.5858 2.     3.4142] True",
          "3.4142 3.4142\n[0.5858 2.     3.4142] True",
          "2.0 3.0\n[0.5858 2.     3.4142] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rayleigh(A, x)</C> (a float) and <C>rq_iteration(A, x, iters=10)</C>: normalise x, then repeat: shift by
          r = R(x), solve (A − rI)y = x, normalise y. Stop early if the solve raises <C>np.linalg.LinAlgError</C>. Return
          (R(x), x).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rayleigh(A, x):
    return float(x @ A @ x)

def rq_iteration(A, x, iters=10):
    return rayleigh(A, x), x
`,
        solution: RQ,
        tests: [
          { name: "quotient", code: `A = np.diag([1.0, 2.0, 5.0])
assert rayleigh(A, np.array([1.0, 1.0, 0.0])) == 1.5
assert abs(rayleigh(A, 3 * np.ones(3)) - 8 / 3) < 1e-12
assert isinstance(rayleigh(A, np.ones(3)), float)` },
          { name: "iteration", code: `rng = np.random.default_rng(0)
Q, _ = np.linalg.qr(rng.normal(size=(5, 5)))
A = Q @ np.diag([-1.0, 0.5, 2.0, 3.0, 7.0]) @ Q.T
lam, x = rq_iteration(A, Q[:, 3] + 0.05 * rng.normal(size=5))
assert abs(lam - 3.0) < 1e-9 and np.isclose(np.linalg.norm(x), 1.0)
assert np.allclose(A @ x, lam * x, atol=1e-8)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_rayleigh_on_subspace(A, V)</C>, the maximum of R over the column space of V (orthonormalise V, then
          take the largest eigenvalue of the compressed matrix); <C>block_eigs(A)</C>, the list of sorted eigenvalue arrays of
          the leading 1×1, 2×2, …, n×n blocks of a symmetric A; and <C>interlaces(A, tol=1e-9)</C>, True when every
          consecutive pair of those arrays interlaces.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def max_rayleigh_on_subspace(A, V):
    return float(np.linalg.eigvalsh(A).max())

def block_eigs(A):
    return [np.linalg.eigvalsh(A)]

def interlaces(A, tol=1e-9):
    return True
`,
        solution: `import numpy as np

${CF}`,
        tests: [
          { name: "subspace", code: `B = np.array([[2.0, 1.0, 0.0], [1.0, 2.0, 1.0], [0.0, 1.0, 2.0]])
assert np.isclose(max_rayleigh_on_subspace(B, np.eye(3)[:, :1]), 2.0)
assert np.isclose(max_rayleigh_on_subspace(B, np.array([[1.0, 1.0], [0.0, 1.0], [0.0, 0.0]])), 3.0)
lam = np.linalg.eigvalsh(B)
rng = np.random.default_rng(1)
for _ in range(5):
    assert max_rayleigh_on_subspace(B, rng.normal(size=(3, 2))) >= lam[1] - 1e-9` },
          { name: "interlacing", code: `rng = np.random.default_rng(2)
X = rng.normal(size=(6, 6)); A = X + X.T
ev = block_eigs(A)
assert len(ev) == 6 and [len(e) for e in ev] == [1, 2, 3, 4, 5, 6]
assert np.isclose(ev[0][0], A[0, 0]) and np.allclose(ev[-1], np.linalg.eigvalsh(A))
assert np.allclose(block_eigs(np.diag([3.0, 1.0, 2.0]))[1], [1.0, 3.0])
assert interlaces(A) is True and interlaces(np.diag([1.0, 3.0, 2.0])) is True` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a self-adjoint A with smallest and largest eigenvalues λ₁ and λₙ, every x ≠ 0 satisfies λ₁ ≤
          ⟨Ax, x⟩/⟨x, x⟩ ≤ λₙ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the spectral theorem to expand x = Σ cⱼeⱼ in an orthonormal eigenbasis, so ⟨Ax, x⟩ = Σ λⱼ|cⱼ|² and ⟨x, x⟩ = Σ|cⱼ|².",
          "Bounds Σ λⱼ|cⱼ|² between λ₁Σ|cⱼ|² and λₙΣ|cⱼ|² and divides by Σ|cⱼ|² > 0.",
        ],
      },
    },
    {
      key: "fiedler",
      rung: "stretch",
      prompt: (
        <p>
          The path graph on 3 vertices has Laplacian L = [[1, −1, 0], [−1, 2, −1], [0, −1, 1]]. What is the minimum of xᵀLx /
          xᵀx over nonzero x orthogonal to (1, 1, 1)?
        </p>
      ),
      answer: { kind: "numeric", value: 1, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend why the Rayleigh quotient of a symmetric matrix is a weighted average of its eigenvalues, how Courant–Fischer describes the k-th eigenvalue as a min–max, and why that forces interlacing.",

  glimpse: (
    <>
      <p>
        This finishes the spectral theory of a single self-adjoint operator. The next chapter applies it to{" "}
        <M>{"A^*A"}</M> for an arbitrary A: its eigenvalues give the singular values, and Courant–Fischer for{" "}
        <M>{"A^*A"}</M> becomes a min–max formula for them.
      </p>
      <p>
        The same min–max argument proves Weyl&apos;s inequality, that adding a symmetric E moves each eigenvalue by at most
        ‖E‖, which is the starting point of perturbation theory later in the course.
      </p>
    </>
  ),
};
