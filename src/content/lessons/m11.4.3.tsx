import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RitzPlotViz } from "@/components/viz/RitzPlotViz";
import type { LessonContent } from "@/lib/types";

const LZ = `import numpy as np

def lanczos(matvec, v, k, reorth=True):
    Q = [v / np.linalg.norm(v)]
    alpha, beta = [], []
    for j in range(k):
        w = matvec(Q[j])
        alpha.append(float(Q[j] @ w))
        w = w - alpha[j] * Q[j] - (beta[j - 1] * Q[j - 1] if j > 0 else 0)
        if reorth:
            for q in Q:
                w = w - (q @ w) * q
        beta.append(float(np.linalg.norm(w)))
        Q.append(w / beta[j])
    return np.array(alpha), np.array(beta[:-1])

def ritz(alpha, beta):
    T = np.diag(alpha) + np.diag(beta, 1) + np.diag(beta, -1)
    return np.linalg.eigvalsh(T)`;

const SLQ = `import numpy as np

def tridiag(matvec, v, k):
    Q = np.zeros((k, len(v)))
    Q[0] = v / np.linalg.norm(v)
    T = np.zeros((k, k))
    for j in range(k):
        w = matvec(Q[j])
        w = w - Q[: j + 1].T @ (Q[: j + 1] @ w)
        T[j, j] = Q[j] @ matvec(Q[j])
        if j + 1 < k:
            T[j, j + 1] = T[j + 1, j] = np.linalg.norm(w)
            Q[j + 1] = w / T[j, j + 1]
    return T

def gauss_nodes(T):
    theta, S = np.linalg.eigh(T)
    return theta, S[0] ** 2

def slq_trace(matvec, n, f, k, nv, rng):
    total = 0.0
    for _ in range(nv):
        theta, tau = gauss_nodes(tridiag(matvec, rng.choice([-1.0, 1.0], size=n), k))
        total += n * float(tau @ f(theta))
    return total / nv`;

export const lesson: LessonContent = {
  id: "m11.4.3",
  minutes: 55,
  links: {
    requires: ["m11.4.2", "m5.5.4"],
    revisits: ["m11.3.3"],
    foreshadows: ["m11.5.1", "m11.6.4"],
  },

  puzzle: (
    <>
      <p>
        A network with a hundred million parameters has a Hessian with 10¹⁶ entries, which you will never store, let alone
        factor. Yet papers routinely plot its entire eigenvalue density: a bulk piled up near zero, plus a handful of large
        outliers. They do it with a few hundred Hessian-vector products. How can a few hundred products with a matrix
        reveal the shape of its whole spectrum?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Power iteration keeps only its latest vector and throws away v, Av, A²v, … that it passed on the way. Those
        vectors span the Krylov subspace, and the best eigenvalue estimates available from it are far better than the
        latest Rayleigh quotient. For a symmetric matrix, an orthonormal basis of the Krylov subspace can be built with a
        three-term recurrence, and in that basis A becomes a small tridiagonal matrix whose eigenvalues, the Ritz values,
        converge to the extreme eigenvalues fast. The same small matrix encodes how the starting vector&apos;s weight is spread
        over the spectrum, and averaging over random starting vectors turns that into a picture of the whole density.
      </p>
      <RitzPlotViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Lanczos iteration">
        <p>
          For symmetric A and unit <M>{"q_1"}</M>, the Krylov subspace is{" "}
          <M>{"\\mathcal K_k = \\mathrm{span}\\{q_1, Aq_1, \\ldots, A^{k-1}q_1\\}"}</M>. Lanczos builds an orthonormal basis{" "}
          <M>{"q_1, \\ldots, q_k"}</M> of it by
        </p>
        <MD>{"\\beta_jq_{j+1} = Aq_j - \\alpha_jq_j - \\beta_{j-1}q_{j-1}, \\qquad \\alpha_j = q_j^\\top Aq_j,"}</MD>
        <p>
          with <M>{"\\beta_j"}</M> the norm of the right-hand side. Each step costs one product with A. The Ritz values are the
          eigenvalues of the tridiagonal matrix <M>{"T_k"}</M> with diagonal α and off-diagonal β.
        </p>
      </Definition>

      <Theorem title="A is tridiagonal in the Lanczos basis">
        <p>
          With <M>{"Q_k = [q_1, \\ldots, q_k]"}</M> orthonormal and spanning <M>{"\\mathcal K_j"}</M> in its first j columns for
          every j, <M>{"Q_k^\\top AQ_k = T_k"}</M> is symmetric tridiagonal, which is why three terms suffice.
        </p>
      </Theorem>
      <Proof>
        <p>
          The (i, j) entry is <M>{"q_i^\\top Aq_j"}</M>. Since <M>{"q_j \\in \\mathcal K_j"}</M>,{" "}
          <M>{"Aq_j \\in \\mathcal K_{j+1} = \\mathrm{span}\\{q_1, \\ldots, q_{j+1}\\}"}</M>, so the entry is zero for i &gt; j + 1.
          By symmetry, <M>{"q_i^\\top Aq_j = q_j^\\top Aq_i"}</M>, which is zero for j &gt; i + 1. So <M>{"Aq_j"}</M> has components
          only along <M>{"q_{j-1}, q_j, q_{j+1}"}</M>, which is the recurrence.
        </p>
      </Proof>

      <Theorem title="Ritz values beat power iteration">
        <p>
          The largest Ritz value is <M>{"\\theta_{\\max} = \\max_{0 \\neq x \\in \\mathcal K_k} x^\\top Ax/x^\\top x"}</M>, so it is
          at least the Rayleigh quotient of the power iterate <M>{"A^{k-1}q_1"}</M>, and it never exceeds <M>{"\\lambda_{\\max}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every x in <M>{"\\mathcal K_k"}</M> is <M>{"Q_ky"}</M>, and <M>{"x^\\top Ax/x^\\top x = y^\\top T_ky/y^\\top y"}</M>, whose maximum over
          y is the largest eigenvalue of <M>{"T_k"}</M>. The power iterate lies in <M>{"\\mathcal K_k"}</M>, and the maximum over a
          subspace is at most the maximum over all of ℝⁿ. Chebyshev polynomial arguments sharpen this: with relative gap g
          between the top two eigenvalues, the error decays roughly like <M>{"e^{-2k\\sqrt g}"}</M> rather than{" "}
          <M>{"(1 - g)^k"}</M>. In the code, eight steps give the outliers 5 and 10 to six decimals.
        </p>
      </Proof>

      <Remark title="ghosts">
        <p>
          In floating point the Lanczos vectors lose orthogonality, and Paige showed the loss is tied to convergence: as soon
          as a Ritz value converges, the new vectors pick up components along its eigenvector again, and the eigenvalue is
          found a second, third and later time. These copies, the ghosts, are harmless for locating eigenvalues but distort
          multiplicities and densities. With 80 steps on a 100 × 100 matrix, plain Lanczos reports the eigenvalue 10 seven
          times; full reorthogonalisation against all previous vectors, at O(nk) extra cost per step, reports it once.
        </p>
        <Code>{LZ}</Code>
      </Remark>

      <Theorem title="stochastic Lanczos quadrature">
        <p>
          For unit v with <M>{"v = \\sum c_iu_i"}</M> in the eigenbasis of A,{" "}
          <M>{"v^\\top f(A)v = \\sum_i c_i^2f(\\lambda_i)"}</M>, an integral of f against a discrete measure. If{" "}
          <M>{"T_k = S\\Theta S^\\top"}</M> comes from Lanczos started at v, then with <M>{"\\tau_j = S_{1j}"}</M>,
        </p>
        <MD>{"v^\\top f(A)v \\approx \\sum_{j=1}^k \\tau_j^2f(\\theta_j),"}</MD>
        <p>
          the k-point Gauss quadrature rule for that measure, exact for polynomials f of degree up to 2k − 1. For Rademacher
          or Gaussian v with <M>{"\\mathbb E[vv^\\top] = I"}</M>, <M>{"\\mathbb E[v^\\top f(A)v] = \\mathrm{tr}\\,f(A)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first identity is <M>{"f(A) = \\sum f(\\lambda_i)u_iu_i^\\top"}</M>. For j ≤ k − 1,{" "}
          <M>{"A^jq_1 = Q_kT_k^je_1"}</M>, by induction: A maps <M>{"\\mathcal K_{k-1}"}</M> into <M>{"\\mathcal K_k"}</M>, where
          multiplying by A is the same as multiplying the coordinates by <M>{"T_k = Q_k^\\top AQ_k"}</M>. Any power m ≤ 2k − 1
          splits as m = a + c + b with a, b ≤ k − 1 and c ∈ {"{"}0, 1{"}"}, so{" "}
          <M>{"q_1^\\top A^mq_1 = (A^aq_1)^\\top A^c(A^bq_1) = e_1^\\top T_k^aQ_k^\\top A^cQ_kT_k^be_1 = e_1^\\top T_k^me_1"}</M>, and{" "}
          <M>{"e_1^\\top T_k^me_1 = \\sum\\tau_j^2\\theta_j^m"}</M>. By linearity the rule is exact for every polynomial of degree
          up to 2k − 1. The trace statement is <M>{"\\mathbb E[v^\\top Mv] = \\mathrm{tr}(M\\,\\mathbb E[vv^\\top])"}</M>; for a
          vector of norm √n, scale by n.
        </p>
      </Proof>

      <Remark title="Hessian spectra">
        <p>
          Replace the product Av by a Hessian-vector product, computed by differentiating the gradient along v at about
          the cost of two gradients. Each probe vector gives nodes <M>{"\\theta_j"}</M> and weights{" "}
          <M>{"\\tau_j^2"}</M>; smoothing the nodes with small Gaussians and averaging over probes gives a spectral density
          estimate. In the code, 30 steps from one vector recover all five outliers of a 300 × 300 matrix exactly, and 20
          probes estimate tr A and tr log A to within 10% and 1%: the trace of A is dominated by the outliers, which random
          probes sample noisily, a variance problem taken up with Hutchinson&apos;s estimator later in the course. For trained
          classifiers such densities show a bulk near zero and roughly one outlier per class, and the largest eigenvalue,
          the sharpness, tends to settle near 2/η for learning rate η.
        </p>
        <Code>{SLQ}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "hvps",
      rung: "check",
      prompt: <p>Stochastic Lanczos quadrature with 10 probe vectors and 100 Lanczos steps each needs how many Hessian-vector products?</p>,
      answer: { kind: "numeric", value: 1000, tolerance: 0.0001 },
    },
    {
      key: "beta",
      rung: "check",
      prompt: <p>Run Lanczos on A = diag(1, 3) from q₁ = (1, 1)/√2. What is β₁?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "ghost",
      rung: "apply",
      prompt: <p>Plain Lanczos in floating point reports the same eigenvalue several times. Why?</p>,
      answer: {
        kind: "choice",
        options: [
          "Once a Ritz value converges, rounding makes the Lanczos vectors lose orthogonality and regain components along its eigenvector",
          "The matrix truly has that eigenvalue with high multiplicity",
          "The tridiagonal eigenvalue solver is inaccurate",
          "The starting vector was chosen badly",
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

def lanczos(matvec, v, k, reorth=True):
    Q = [v / np.linalg.norm(v)]
    alpha, beta = [], []
    for j in range(k):
        w = matvec(Q[j])
        alpha.append(float(Q[j] @ w))
        w = w - alpha[j] * Q[j] - (beta[j - 1] * Q[j - 1] if j > 0 else 0)
        if reorth:
            for q in Q:
                w = w - (q @ w) * q
        beta.append(float(np.linalg.norm(w)))
        Q.append(w / beta[j])
    return np.array(alpha), np.array(beta[:-1])

def ritz(alpha, beta):
    T = np.diag(alpha) + np.diag(beta, 1) + np.diag(beta, -1)
    return np.linalg.eigvalsh(T)

A = np.diag(np.concatenate([np.linspace(0, 1, 98), [5.0, 10.0]])); mv = lambda x: A @ x
print(np.round(ritz(*lanczos(mv, np.ones(100), 8))[-2:], 6) + 0.0)
for r in [False, True]:
    print(r, int(np.sum(np.abs(ritz(*lanczos(mv, np.ones(100), 80, reorth=r)) - 10) < 1e-6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 5. 10.]\nFalse 7\nTrue 1", "[ 5. 10.]\nFalse 1\nTrue 1", "[ 5. 10.]\nFalse 7\nTrue 7", "[ 1. 10.]\nFalse 7\nTrue 1"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def tridiag(matvec, v, k):
    Q = np.zeros((k, len(v)))
    Q[0] = v / np.linalg.norm(v)
    T = np.zeros((k, k))
    for j in range(k):
        w = matvec(Q[j])
        w = w - Q[: j + 1].T @ (Q[: j + 1] @ w)
        T[j, j] = Q[j] @ matvec(Q[j])
        if j + 1 < k:
            T[j, j + 1] = T[j + 1, j] = np.linalg.norm(w)
            Q[j + 1] = w / T[j, j + 1]
    return T

def gauss_nodes(T):
    theta, S = np.linalg.eigh(T)
    return theta, S[0] ** 2

def slq_trace(matvec, n, f, k, nv, rng):
    total = 0.0
    for _ in range(nv):
        theta, tau = gauss_nodes(tridiag(matvec, rng.choice([-1.0, 1.0], size=n), k))
        total += n * float(tau @ f(theta))
    return total / nv

rng = np.random.default_rng(0)
Q, _ = np.linalg.qr(rng.normal(size=(300, 300))); lam = np.concatenate([rng.uniform(0.1, 1.0, 295), [20.0, 30.0, 40.0, 50.0, 60.0]])
H = Q @ np.diag(lam) @ Q.T; mv = lambda x: H @ x
print(np.round(gauss_nodes(tridiag(mv, np.ones(300), 30))[0][-5:], 4) + 0.0)
est = [slq_trace(mv, 300, f, 30, 20, rng) for f in [lambda t: t, np.log]]
print(round(est[0] / lam.sum(), 2), round(est[1] / np.log(lam).sum(), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[20. 30. 40. 50. 60.]\n1.1 1.01", "[20. 30. 40. 50. 60.]\n1.0 1.0", "[ 1. 20. 30. 40. 60.]\n1.1 1.01", "[20. 30. 40. 50. 60.]\n1.01 1.1"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lanczos(matvec, v, k, reorth=True)</C>, returning the arrays α (length k) and β (length k − 1), with
          optional full reorthogonalisation against all previous vectors, and <C>ritz(alpha, beta)</C>, the sorted
          eigenvalues of the tridiagonal matrix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def lanczos(matvec, v, k, reorth=True):
    return np.zeros(k), np.zeros(k - 1)

def ritz(alpha, beta):
    return np.sort(alpha)
`,
        solution: LZ,
        tests: [
          { name: "exact", code: `A = np.diag(np.arange(1.0, 7.0)); a, b = lanczos(lambda x: A @ x, np.ones(6), 6)
assert len(a) == 6 and len(b) == 5 and np.allclose(ritz(a, b), np.arange(1.0, 7.0))
a, b = lanczos(lambda x: np.diag([1.0, 3.0]) @ x, np.ones(2), 2)
assert np.allclose(a, [2.0, 2.0]) and np.allclose(b, [1.0])` },
          { name: "beats", code: `rng = np.random.default_rng(20); G = rng.normal(size=(40, 40)); A = G @ G.T; v = rng.normal(size=40)
x = v.copy()
for _ in range(7):
    x = A @ x; x /= np.linalg.norm(x)
th = ritz(*lanczos(lambda y: A @ y, v, 8))
assert x @ A @ x <= th[-1] + 1e-9 and th[-1] <= np.linalg.eigvalsh(A)[-1] + 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tridiag(matvec, v, k)</C>, returning the k × k Lanczos matrix T with full reorthogonalisation;{" "}
          <C>gauss_nodes(T)</C>, returning the eigenvalues θ and the squared first components τ² of the eigenvectors; and{" "}
          <C>slq_trace(matvec, n, f, k, nv, rng)</C>, the average over nv Rademacher probes of n·Σ τⱼ² f(θⱼ).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tridiag(matvec, v, k):
    return np.zeros((k, k))

def gauss_nodes(T):
    return np.zeros(len(T)), np.zeros(len(T))

def slq_trace(matvec, n, f, k, nv, rng):
    return 0.0
`,
        solution: SLQ,
        tests: [
          { name: "nodes", code: `A = np.diag(np.arange(1.0, 6.0)); T = tridiag(lambda x: A @ x, np.ones(5), 5)
th, w = gauss_nodes(T)
assert np.allclose(T, T.T) and np.allclose(np.triu(T, 2), 0) and np.allclose(th, np.arange(1.0, 6.0)) and np.allclose(w, 0.2)` },
          { name: "trace", code: `G = np.random.default_rng(21).normal(size=(30, 30)); A = G @ G.T / 30; mv = lambda x: A @ x
assert abs(slq_trace(mv, 30, np.ones_like, 5, 3, np.random.default_rng(1)) - 30) < 1e-9
rng = np.random.default_rng(2); vs = [rng.choice([-1.0, 1.0], size=30) for _ in range(4)]
assert abs(slq_trace(mv, 30, lambda t: t ** 2, 6, 4, np.random.default_rng(2)) - np.mean([v @ A @ A @ v for v in vs])) < 1e-8` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be symmetric and q₁, …, q_k orthonormal with span{"{"}q₁, …, q_j{"}"} = K_j(A, q₁) for each j. Prove that
          T = QᵀAQ is tridiagonal.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Identifies the (i, j) entry as qᵢᵀAqⱼ.",
          "Uses qⱼ ∈ K_j to get Aqⱼ ∈ K_(j+1) = span{q₁, …, q_(j+1)}, so the entry vanishes for i > j + 1 by orthonormality.",
          "Uses the symmetry of A to conclude the entry also vanishes for j > i + 1.",
        ],
      },
    },
    {
      key: "deg",
      rung: "stretch",
      prompt: <p>The k-point Gauss quadrature rule from 10 Lanczos steps is exact for polynomials up to what degree?</p>,
      answer: { kind: "numeric", value: 19, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how Lanczos turns a symmetric matrix into a small tridiagonal one using only matrix-vector products, why Ritz values find extreme eigenvalues faster than power iteration, where ghost eigenvalues come from, and how stochastic Lanczos quadrature estimates a Hessian's spectral density.",

  glimpse: (
    <>
      <p>
        Krylov subspaces are good for more than eigenvalues. The next chapter uses the same subspaces to solve linear
        systems with only matrix-vector products, which leads to the conjugate gradient method.
      </p>
    </>
  ),
};
