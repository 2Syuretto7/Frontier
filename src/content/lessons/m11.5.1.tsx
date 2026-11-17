import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChebResidualViz } from "@/components/viz/ChebResidualViz";
import type { LessonContent } from "@/lib/types";

const ARN = `import numpy as np

def arnoldi(matvec, b, k):
    Q = np.zeros((len(b), k + 1))
    H = np.zeros((k + 1, k))
    Q[:, 0] = b / np.linalg.norm(b)
    for j in range(k):
        w = matvec(Q[:, j])
        for i in range(j + 1):
            H[i, j] = Q[:, i] @ w
            w = w - H[i, j] * Q[:, i]
        H[j + 1, j] = np.linalg.norm(w)
        if H[j + 1, j] < 1e-12:
            return Q[:, : j + 2], H[: j + 2, : j + 1]
        Q[:, j + 1] = w / H[j + 1, j]
    return Q, H

def gmres(matvec, b, k):
    Q, H = arnoldi(matvec, b, k)
    e = np.zeros(H.shape[0])
    e[0] = np.linalg.norm(b)
    y = np.linalg.lstsq(H, e, rcond=None)[0]
    return Q[:, : H.shape[1]] @ y`;

const KRY = `import numpy as np

def krylov_matrix(A, b, k):
    K = np.zeros((len(b), k))
    K[:, 0] = b
    for j in range(1, k):
        K[:, j] = A @ K[:, j - 1]
    return K

def krylov_solve(A, b, k):
    Q, _ = np.linalg.qr(krylov_matrix(A, b, k))
    y = np.linalg.lstsq(A @ Q, b, rcond=None)[0]
    return Q @ y`;

export const lesson: LessonContent = {
  id: "m11.5.1",
  minutes: 50,
  links: {
    requires: ["m11.4.3"],
    revisits: ["m3.4.4", "m11.3.3"],
    foreshadows: ["m11.5.2", "m11.5.3"],
  },

  puzzle: (
    <>
      <p>
        A 10⁶ × 10⁶ sparse system arises from a physics simulation, and the only thing you can do cheaply is multiply a
        vector by the matrix. With nothing but b, Ab, A²b, … you must build the solution. If the matrix happens to have only
        three distinct eigenvalues, three products are enough to solve it exactly, whatever its size. What do the
        eigenvalues have to do with how many matrix-vector products you need?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Anything built from b by k − 1 multiplications by A is p(A)b for a polynomial p. So searching the Krylov subspace
        is searching over polynomials, and the residual b − Ax becomes q(A)b for a polynomial q with q(0) = 1. In the
        eigenbasis, q(A) multiplies each eigencomponent by q(λ), so the question becomes: how small can a polynomial pinned
        to 1 at zero be on the eigenvalues? Few distinct eigenvalues, or eigenvalues in a tight cluster away from zero, make
        that easy; a spread reaching close to zero makes it hard.
      </p>
      <ChebResidualViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Krylov subspace">
        <MD>{"\\mathcal K_k(A, b) = \\mathrm{span}\\{b, Ab, \\ldots, A^{k-1}b\\} = \\{p(A)b : \\deg p \\leq k - 1\\}."}</MD>
        <p>
          For <M>{"x \\in \\mathcal K_k"}</M>, the residual is <M>{"b - Ax = q(A)b"}</M> with{" "}
          <M>{"q(t) = 1 - tp(t)"}</M>, a polynomial of degree at most k with q(0) = 1, and every such q arises.
        </p>
      </Definition>

      <Theorem title="the solution lies in a small Krylov subspace">
        <p>
          If A is invertible and its minimal polynomial has degree m, then <M>{"A^{-1}b \\in \\mathcal K_m(A, b)"}</M>. In
          particular, a diagonalisable A with m distinct eigenvalues is solved exactly from m matrix-vector products.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\mu(t) = c_0 + c_1t + \\cdots + c_mt^m"}</M> be the minimal polynomial, so <M>{"\\mu(A) = 0"}</M>. Its roots
          are the eigenvalues and 0 is not one, so <M>{"c_0 = \\mu(0) \\neq 0"}</M>. Then{" "}
          <M>{"A(c_1I + c_2A + \\cdots + c_mA^{m-1}) = -c_0I"}</M>, so{" "}
          <M>{"A^{-1} = -\\frac{1}{c_0}\\sum_{j=1}^m c_jA^{j-1}"}</M> and{" "}
          <M>{"A^{-1}b \\in \\mathrm{span}\\{b, \\ldots, A^{m-1}b\\}"}</M>. For diagonalisable A the minimal polynomial is{" "}
          <M>{"\\prod(t - \\lambda_i)"}</M> over the distinct eigenvalues. In the code, a 50 × 50 symmetric matrix with
          eigenvalues 1, 2 and 5 leaves a residual above 0.1 from a 2-dimensional Krylov subspace and below 10⁻¹⁰ from a
          3-dimensional one.
        </p>
      </Proof>

      <Remark title="the monomial basis is useless">
        <p>
          The vectors <M>{"A^jb"}</M> all turn towards the top eigenvector, which is power iteration, so as a basis they
          become nearly dependent fast. For A = diag(1, …, 50), the Krylov matrix with 5, 10 and 20 columns has condition
          number about 10⁷, 10¹⁶ and 10³⁷. Any practical method must orthonormalise as it goes.
        </p>
        <Code>{KRY}</Code>
      </Remark>

      <Theorem title="Arnoldi relation">
        <p>
          Orthonormalising each new <M>{"Aq_j"}</M> against <M>{"q_1, \\ldots, q_j"}</M> (Gram-Schmidt) gives{" "}
          <M>{"Q_{k+1}"}</M> with orthonormal columns spanning <M>{"\\mathcal K_{k+1}"}</M> and an upper Hessenberg{" "}
          <M>{"(k + 1) \\times k"}</M> matrix <M>{"\\tilde H_k"}</M> with <M>{"AQ_k = Q_{k+1}\\tilde H_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By construction <M>{"Aq_j = \\sum_{i \\leq j+1} h_{ij}q_i"}</M> with <M>{"h_{ij} = q_i^\\top Aq_j"}</M> for i ≤ j and{" "}
          <M>{"h_{j+1,j}"}</M> the norm of what remains; collecting columns gives the relation, and the zero pattern below
          the first subdiagonal is the Hessenberg shape. For symmetric A, <M>{"H_k = Q_k^\\top AQ_k"}</M> is also symmetric,
          hence tridiagonal: that is Lanczos.
        </p>
      </Proof>

      <Theorem title="GMRES and its bound">
        <p>
          GMRES picks <M>{"x_k \\in \\mathcal K_k"}</M> minimising ‖b − Ax‖. Writing <M>{"x = Q_ky"}</M>, this is the small
          least-squares problem <M>{"\\min_y \\|\\beta e_1 - \\tilde H_ky\\|"}</M> with β = ‖b‖. If{" "}
          <M>{"A = V\\Lambda V^{-1}"}</M>, then
        </p>
        <MD>{"\\frac{\\|r_k\\|}{\\|b\\|} \\leq \\kappa(V)\\min_{\\deg q \\leq k,\\ q(0) = 1}\\ \\max_i |q(\\lambda_i)|."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"b - AQ_ky = Q_{k+1}(\\beta e_1 - \\tilde H_ky)"}</M> since <M>{"b = \\beta q_1"}</M>, and{" "}
          <M>{"Q_{k+1}"}</M> preserves norms. For the bound, the GMRES residual is no larger than q(A)b for any admissible q,
          and <M>{"\\|q(A)b\\| = \\|Vq(\\Lambda)V^{-1}b\\| \\leq \\|V\\|\\|V^{-1}\\|\\max_i|q(\\lambda_i)|\\,\\|b\\|"}</M>.
        </p>
        <p>
          In the code the eigenvalues of I + 0.3G/√n lie in a disc of radius about 0.3 around 1, so{" "}
          <M>{"q(t) = (1 - t)^k"}</M> shows the residual can fall like <M>{"0.3^k"}</M>: GMRES reaches about 10⁻³, 10⁻⁵ and
          10⁻¹¹ after 5, 10 and 20 steps. If the eigenvalues fill an interval [a, b] with 0 &lt; a, rescaled Chebyshev
          polynomials give <M>{"\\min\\max|q| \\leq 2\\left(\\frac{\\sqrt\\kappa - 1}{\\sqrt\\kappa + 1}\\right)^k"}</M> with
          κ = b/a, the bound behind conjugate gradients in the next lesson.
        </p>
        <Code>{ARN}</Code>
      </Proof>
    </>
  ),

  practice: [
    {
      key: "disc",
      rung: "check",
      prompt: <p>With all eigenvalues within 0.3 of 1 and κ(V) = 1, what is log₁₀ of the bound 0.3¹⁰ on the relative residual after 10 steps?</p>,
      answer: { kind: "numeric", value: -5.229, tolerance: 0.002 },
    },
    {
      key: "cheb",
      rung: "check",
      prompt: <p>Evaluate the Chebyshev bound 2((√κ − 1)/(√κ + 1))ᵏ for κ = 100 and k = 10, to four decimals.</p>,
      answer: { kind: "numeric", value: 0.2689, tolerance: 0.0002 },
    },
    {
      key: "basis",
      rung: "apply",
      prompt: <p>Why do Krylov methods build an orthonormal basis with Arnoldi or Lanczos instead of using b, Ab, A²b, … directly?</p>,
      answer: {
        kind: "choice",
        options: [
          "The vectors Aʲb all turn towards the dominant eigenvector, so the monomial basis is catastrophically ill conditioned",
          "The monomial vectors do not span the Krylov subspace",
          "Orthonormal bases need fewer matrix-vector products",
          "The monomial basis only works for symmetric matrices",
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

def arnoldi(matvec, b, k):
    Q = np.zeros((len(b), k + 1))
    H = np.zeros((k + 1, k))
    Q[:, 0] = b / np.linalg.norm(b)
    for j in range(k):
        w = matvec(Q[:, j])
        for i in range(j + 1):
            H[i, j] = Q[:, i] @ w
            w = w - H[i, j] * Q[:, i]
        H[j + 1, j] = np.linalg.norm(w)
        if H[j + 1, j] < 1e-12:
            return Q[:, : j + 2], H[: j + 2, : j + 1]
        Q[:, j + 1] = w / H[j + 1, j]
    return Q, H

def gmres(matvec, b, k):
    Q, H = arnoldi(matvec, b, k)
    e = np.zeros(H.shape[0])
    e[0] = np.linalg.norm(b)
    y = np.linalg.lstsq(H, e, rcond=None)[0]
    return Q[:, : H.shape[1]] @ y

rng = np.random.default_rng(0); n = 200
A = np.eye(n) + 0.3 * rng.normal(size=(n, n)) / np.sqrt(n); b = rng.normal(size=n)
print([round(float(np.log10(np.linalg.norm(b - A @ gmres(lambda x: A @ x, b, k)) / np.linalg.norm(b)))) for k in [5, 10, 20]])
H = arnoldi(lambda x: A @ x, b, 6)[1]
print(H.shape, np.allclose(np.tril(H, -2), 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-3, -5, -11]\n(7, 6) True", "[-3, -5, -11]\n(6, 6) True", "[-3, -5, -11]\n(7, 6) False", "[-1, -2, -4]\n(7, 6) True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def krylov_matrix(A, b, k):
    K = np.zeros((len(b), k))
    K[:, 0] = b
    for j in range(1, k):
        K[:, j] = A @ K[:, j - 1]
    return K

def krylov_solve(A, b, k):
    Q, _ = np.linalg.qr(krylov_matrix(A, b, k))
    y = np.linalg.lstsq(A @ Q, b, rcond=None)[0]
    return Q @ y

rng = np.random.default_rng(1); b = rng.normal(size=50)
Q, _ = np.linalg.qr(rng.normal(size=(50, 50))); A = Q @ np.diag(np.repeat([1.0, 2.0, 5.0], [20, 20, 10])) @ Q.T
r = [np.linalg.norm(b - A @ krylov_solve(A, b, k)) for k in [2, 3]]
print(r[0] > 0.1, r[1] < 1e-10)
print([round(float(np.log10(np.linalg.cond(krylov_matrix(np.diag(np.arange(1.0, 51.0)), np.ones(50), k))))) for k in [5, 10, 20]])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True\n[7, 16, 37]", "False True\n[7, 16, 37]", "True True\n[1, 1, 1]", "True False\n[7, 16, 37]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>arnoldi(matvec, b, k)</C>, returning Q (n × (k + 1)) and the Hessenberg H ((k + 1) × k), stopping early with
          truncated arrays if a new vector has norm below 10⁻¹², and <C>gmres(matvec, b, k)</C>, which solves the small
          least-squares problem and returns x.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def arnoldi(matvec, b, k):
    return np.zeros((len(b), k + 1)), np.zeros((k + 1, k))

def gmres(matvec, b, k):
    return np.zeros(len(b))
`,
        solution: ARN,
        tests: [
          { name: "relation", code: `rng = np.random.default_rng(22); A = rng.normal(size=(30, 30)); b = rng.normal(size=30)
Q, H = arnoldi(lambda x: A @ x, b, 8)
assert Q.shape == (30, 9) and H.shape == (9, 8) and np.allclose(Q.T @ Q, np.eye(9)) and np.allclose(A @ Q[:, :8], Q @ H) and np.allclose(np.tril(H, -2), 0)` },
          { name: "gmres", code: `rng = np.random.default_rng(23); A = np.eye(40) + 0.2 * rng.normal(size=(40, 40)) / np.sqrt(40); b = rng.normal(size=40)
res = [np.linalg.norm(b - A @ gmres(lambda x: A @ x, b, k)) for k in [2, 4, 8]]
assert res[0] >= res[1] >= res[2] and res[2] < 1e-4 * np.linalg.norm(b)
A = np.diag(np.repeat([1.0, 3.0], 20)); x = gmres(lambda v: A @ v, b, 5)
assert np.allclose(A @ x, b)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>krylov_matrix(A, b, k)</C>, whose columns are b, Ab, …, Aᵏ⁻¹b, and <C>krylov_solve(A, b, k)</C>, which
          orthonormalises those columns with QR and returns the x in their span minimising ‖b − Ax‖.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def krylov_matrix(A, b, k):
    return np.zeros((len(b), k))

def krylov_solve(A, b, k):
    return np.zeros(len(b))
`,
        solution: KRY,
        tests: [
          { name: "matrix", code: `A = np.array([[2.0, 1.0], [0.0, 3.0]]); K = krylov_matrix(A, np.array([1.0, 1.0]), 3)
assert np.allclose(K, [[1.0, 3.0, 9.0], [1.0, 3.0, 9.0]])` },
          { name: "solve", code: `rng = np.random.default_rng(24); Q, _ = np.linalg.qr(rng.normal(size=(20, 20)))
A = Q @ np.diag(np.repeat([1.0, 4.0], 10)) @ Q.T; b = rng.normal(size=20)
assert np.linalg.norm(b - A @ krylov_solve(A, b, 1)) > 0.1 and np.allclose(A @ krylov_solve(A, b, 2), b)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be invertible with minimal polynomial μ of degree m. Prove that A⁻¹b lies in span{"{"}b, Ab, …, Aᵐ⁻¹b{"}"}.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes μ(t) = c₀ + c₁t + … + c_m tᵐ with μ(A) = 0.",
          "Argues c₀ ≠ 0, because the roots of the minimal polynomial are eigenvalues and 0 is not an eigenvalue of an invertible matrix.",
          "Rearranges to A⁻¹ = −(1/c₀)(c₁I + c₂A + … + c_m Aᵐ⁻¹) and concludes A⁻¹b is in the stated span.",
        ],
      },
    },
    {
      key: "rank1",
      rung: "stretch",
      prompt: (
        <p>
          A = I + uvᵀ is 1000 × 1000, invertible and diagonalisable, with vᵀu ≠ 0. At most how many GMRES steps give the exact
          solution in exact arithmetic?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why searching a Krylov subspace is searching over polynomials in A, why few distinct or tightly clustered eigenvalues mean fast convergence, why the basis must be built by Arnoldi rather than by repeated multiplication, and what GMRES minimises.",

  glimpse: (
    <>
      <p>
        GMRES must store every basis vector and re-solve a growing least-squares problem. For symmetric positive definite
        matrices a short recurrence suffices, as Lanczos suggested, and minimising the right norm turns it into the
        conjugate gradient method.
      </p>
    </>
  ),
};
