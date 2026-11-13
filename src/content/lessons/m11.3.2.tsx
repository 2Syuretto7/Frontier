import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CholPivotViz } from "@/components/viz/CholPivotViz";
import type { LessonContent } from "@/lib/types";

const CHOL = `import numpy as np

def cholesky(A):
    n = A.shape[0]
    L = np.zeros((n, n))
    for j in range(n):
        d = A[j, j] - L[j, :j] @ L[j, :j]
        if d <= 0:
            raise ValueError("not positive definite")
        L[j, j] = np.sqrt(d)
        for i in range(j + 1, n):
            L[i, j] = (A[i, j] - L[i, :j] @ L[j, :j]) / L[j, j]
    return L

def logdet_spd(A):
    return float(2 * np.sum(np.log(np.diag(cholesky(A)))))

def is_pd(A):
    try:
        cholesky(A)
        return True
    except ValueError:
        return False`;

const GP = `import numpy as np

def rbf_kernel(x, ell):
    return np.exp(-0.5 * (x[:, None] - x[None, :]) ** 2 / ell ** 2)

def chol_jitter(K):
    jitter = 0.0
    while True:
        try:
            return np.linalg.cholesky(K + jitter * np.eye(len(K))), jitter
        except np.linalg.LinAlgError:
            jitter = 1e-10 if jitter == 0.0 else jitter * 10

def sample_mvn(mu, K, n, rng):
    L, _ = chol_jitter(K)
    return mu + rng.normal(size=(n, len(mu))) @ L.T`;

export const lesson: LessonContent = {
  id: "m11.3.2",
  minutes: 45,
  links: {
    requires: ["m11.3.1", "m3.7.5"],
    revisits: ["m7.5.3"],
    foreshadows: ["m11.5.2"],
  },

  puzzle: (
    <>
      <p>
        A Gaussian process library hands you a 50 × 50 covariance matrix, mathematically positive definite, and the call to
        factor it crashes with &quot;matrix is not positive definite&quot;. Adding 10⁻¹⁰ to the diagonal makes the crash go
        away and changes no prediction you could measure. Why does the most stable factorisation in numerical linear algebra
        refuse a matrix that is positive definite, and why is it the right test to trust?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For a symmetric positive definite matrix, elimination never meets a bad pivot: each pivot is a positive number, and
        the symmetry lets us split it evenly between a lower factor and its transpose, A = LLᵀ. That halves the work and
        storage, and since every row of L has squared length equal to a diagonal entry of A, no entry can grow. The
        algorithm is its own certificate: it succeeds exactly when the matrix is positive definite, and a zero or negative
        pivot means the matrix, as stored in floating point, is not.
      </p>
      <CholPivotViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Cholesky factorisation">
        <p>
          A symmetric matrix A is positive definite if and only if <M>{"A = LL^\\top"}</M> for a lower triangular L with
          positive diagonal, and then L is unique.
        </p>
      </Theorem>
      <Proof>
        <p>Write</p>
        <MD>{"A = \\begin{pmatrix} a & w^\\top \\\\ w & B \\end{pmatrix} = \\begin{pmatrix} \\sqrt a & 0 \\\\ w/\\sqrt a & L_2 \\end{pmatrix}\\begin{pmatrix} \\sqrt a & w^\\top/\\sqrt a \\\\ 0 & L_2^\\top \\end{pmatrix},"}</MD>
        <p>
          which holds exactly when <M>{"L_2L_2^\\top = S = B - ww^\\top/a"}</M>, the Schur complement. If A is positive
          definite then <M>{"a = e_1^\\top Ae_1 > 0"}</M>, and for y ≠ 0 the vector <M>{"x = (-w^\\top y/a,\\ y)"}</M> gives{" "}
          <M>{"0 < x^\\top Ax = y^\\top Sy"}</M>, so S is positive definite and induction on the size factors it. The first
          column of L is forced, and so by induction is everything else, which gives uniqueness. Conversely, if{" "}
          <M>{"A = LL^\\top"}</M> with L invertible, <M>{"x^\\top Ax = \\|L^\\top x\\|^2 > 0"}</M> for x ≠ 0.
        </p>
        <p>
          Unrolled into a loop over columns, the entries are{" "}
          <M>{"l_{jj} = \\sqrt{a_{jj} - \\sum_{k<j} l_{jk}^2}"}</M> and{" "}
          <M>{"l_{ij} = (a_{ij} - \\sum_{k<j} l_{ik}l_{jk})/l_{jj}"}</M> for i &gt; j, about <M>{"\\tfrac13 n^3"}</M> flops,
          half of LU. The quantity under the square root is the pivot; it is the first diagonal entry of the current Schur
          complement, so it is positive for a positive definite matrix, and the code raises an error as soon as it is not.
        </p>
        <Code>{CHOL}</Code>
      </Proof>

      <Theorem title="no growth, no pivoting">
        <p>
          If <M>{"A = LL^\\top"}</M> then <M>{"|l_{ij}| \\leq \\sqrt{a_{ii}}"}</M> for all i, j. The computed factor satisfies{" "}
          <M>{"\\hat L\\hat L^\\top = A + \\Delta A"}</M> with{" "}
          <M>{"|\\Delta A| \\leq \\gamma_{n+1}|\\hat L||\\hat L^\\top|"}</M>, so Cholesky is backward stable without any row
          swaps.
        </p>
      </Theorem>
      <Proof>
        <p>
          The diagonal of <M>{"LL^\\top"}</M> gives <M>{"a_{ii} = \\sum_k l_{ik}^2 \\geq l_{ij}^2"}</M>. By the Cauchy–Schwarz
          inequality, each entry of <M>{"|L||L^\\top|"}</M> is at most{" "}
          <M>{"\\sqrt{a_{ii}a_{jj}}"}</M>, which is bounded by the largest diagonal entry, so the rounding analysis (the same
          as for dot products) yields a backward error of order u relative to A.
        </p>
      </Proof>

      <Remark title="what the factor is for">
        <p>
          Once A = LLᵀ: solve Ax = b by two triangular solves; compute{" "}
          <M>{"\\log\\det A = 2\\sum_j \\log l_{jj}"}</M> without overflow (in the code both give 4.1589 for a determinant of
          64); sample from <M>{"\\mathcal N(\\mu, A)"}</M> as <M>{"\\mu + Lz"}</M> with z standard normal, since{" "}
          <M>{"\\mathrm{Cov}(Lz) = LL^\\top"}</M>; and whiten data by <M>{"L^{-1}"}</M>. The matrix with rows (1, 2) and (2, 1)
          is indefinite and the all-ones 2 × 2 matrix is only semidefinite: both fail.
        </p>
      </Remark>

      <Remark title="jitter">
        <p>
          A kernel matrix such as <M>{"K_{ij} = \\exp(-(x_i - x_j)^2/(2\\ell^2))"}</M> on many nearby points has eigenvalues
          decaying faster than geometrically, so its smallest ones are below u times the largest. Rounding perturbs them by
          about that much, some become numerically zero or negative, and Cholesky rightly reports failure: the matrix it was
          given is not positive definite to working precision. Adding a small multiple of I, the jitter, lifts every
          eigenvalue by that amount; the code tries 10⁻¹⁰ first and multiplies by 10 until the factorisation succeeds. For the
          50-point kernel with ℓ = 0.5 jitter is needed, and the resulting factor still reproduces K to 10⁻⁶. Sampling with it
          gives an empirical covariance that matches the target to one decimal.
        </p>
        <Code>{GP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "l22",
      rung: "check",
      prompt: <p>For A with rows (4, 6) and (6, 25), what is the entry l₂₂ of its Cholesky factor?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "speed",
      rung: "check",
      prompt: <p>By leading-order flop counts, how many times fewer flops does Cholesky take than LU on the same n × n matrix?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "fail",
      rung: "apply",
      prompt: <p>Cholesky stops at step j because the pivot aⱼⱼ − Σₖ lⱼₖ² is negative. What can you conclude?</p>,
      answer: {
        kind: "choice",
        options: [
          "The matrix, as stored, is not positive definite: its leading j × j block is not positive definite",
          "The algorithm needs row pivoting to continue",
          "The matrix is singular",
          "Rounding error has occurred, and the matrix is certainly positive definite",
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

def cholesky(A):
    n = A.shape[0]
    L = np.zeros((n, n))
    for j in range(n):
        d = A[j, j] - L[j, :j] @ L[j, :j]
        if d <= 0:
            raise ValueError("not positive definite")
        L[j, j] = np.sqrt(d)
        for i in range(j + 1, n):
            L[i, j] = (A[i, j] - L[i, :j] @ L[j, :j]) / L[j, j]
    return L

def logdet_spd(A):
    return float(2 * np.sum(np.log(np.diag(cholesky(A)))))

def is_pd(A):
    try:
        cholesky(A)
        return True
    except ValueError:
        return False

A = np.array([[4.0, 2.0, 2.0], [2.0, 5.0, 3.0], [2.0, 3.0, 6.0]])
print(cholesky(A)[2], round(logdet_spd(A), 4), round(float(np.log(np.linalg.det(A))), 4))
print(is_pd(A), is_pd(np.array([[1.0, 2.0], [2.0, 1.0]])), is_pd(np.array([[1.0, 1.0], [1.0, 1.0]])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[1. 1. 2.] 4.1589 4.1589\nTrue False False", "[1. 1. 2.] 4.1589 4.1589\nTrue False True", "[2. 3. 6.] 4.1589 4.1589\nTrue False False", "[1. 1. 2.] 2.0794 4.1589\nTrue False False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rbf_kernel(x, ell):
    return np.exp(-0.5 * (x[:, None] - x[None, :]) ** 2 / ell ** 2)

def chol_jitter(K):
    jitter = 0.0
    while True:
        try:
            return np.linalg.cholesky(K + jitter * np.eye(len(K))), jitter
        except np.linalg.LinAlgError:
            jitter = 1e-10 if jitter == 0.0 else jitter * 10

def sample_mvn(mu, K, n, rng):
    L, _ = chol_jitter(K)
    return mu + rng.normal(size=(n, len(mu))) @ L.T

K = rbf_kernel(np.linspace(0, 1, 50), 0.5)
L, jit = chol_jitter(K)
print(jit > 0, np.allclose(L @ L.T, K, atol=1e-6))
C = np.array([[1.0, 0.8, 0.0], [0.8, 1.0, 0.0], [0.0, 0.0, 4.0]])
X = sample_mvn(np.zeros(3), C, 200000, np.random.default_rng(0))
print(np.round(np.cov(X.T), 1) + 0.0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True True\n[[1.  0.8 0. ]\n [0.8 1.  0. ]\n [0.  0.  4. ]]",
          "True True\n[[1.  0.8 0. ]\n [0.8 1.  0. ]\n [0.  0.  2. ]]",
          "False True\n[[1.  0.8 0. ]\n [0.8 1.  0. ]\n [0.  0.  4. ]]",
          "True True\n[[1.  0.6 0. ]\n [0.6 1.  0. ]\n [0.  0.  4. ]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cholesky(A)</C>, column by column, raising <C>ValueError</C> when a pivot is not positive;{" "}
          <C>logdet_spd(A)</C> from the factor; and <C>is_pd(A)</C>, which returns whether the factorisation succeeds.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cholesky(A):
    return np.eye(A.shape[0])

def logdet_spd(A):
    return 0.0

def is_pd(A):
    return True
`,
        solution: CHOL,
        tests: [
          { name: "factor", code: `G = np.random.default_rng(10).normal(size=(6, 6)); A = G @ G.T + np.eye(6)
L = cholesky(A)
assert np.allclose(L, np.tril(L)) and np.all(np.diag(L) > 0) and np.allclose(L @ L.T, A)
assert abs(logdet_spd(A) - np.linalg.slogdet(A)[1]) < 1e-9` },
          { name: "pd", code: `assert is_pd(np.eye(3)) and not is_pd(np.array([[1.0, 2.0], [2.0, 1.0]])) and not is_pd(np.zeros((2, 2)))
try:
    cholesky(-np.eye(2)); raise AssertionError("expected ValueError")
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rbf_kernel(x, ell)</C>, the matrix exp(−(xᵢ − xⱼ)²/(2ℓ²)); <C>chol_jitter(K)</C>, which tries{" "}
          <C>np.linalg.cholesky</C> with jitter 0, then 10⁻¹⁰, multiplying by 10 after each failure, and returns (L, jitter);
          and <C>sample_mvn(mu, K, n, rng)</C>, returning an n × d array of samples via the factor.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rbf_kernel(x, ell):
    return np.eye(len(x))

def chol_jitter(K):
    return np.eye(len(K)), 0.0

def sample_mvn(mu, K, n, rng):
    return np.zeros((n, len(mu)))
`,
        solution: GP,
        tests: [
          { name: "kernel", code: `K = rbf_kernel(np.array([0.0, 1.0, 3.0]), 2.0)
assert abs(K[0, 1] - np.exp(-0.125)) < 1e-12 and abs(K[1, 2] - np.exp(-0.5)) < 1e-12 and np.allclose(np.diag(K), 1)
L, j = chol_jitter(np.eye(3)); assert j == 0.0 and np.allclose(L, np.eye(3))
L, j = chol_jitter(np.ones((2, 2))); assert j > 0 and np.allclose(L @ L.T, np.ones((2, 2)) + j * np.eye(2))` },
          { name: "sample", code: `C = np.array([[2.0, -1.0], [-1.0, 3.0]])
X = sample_mvn(np.array([1.0, -2.0]), C, 100000, np.random.default_rng(11))
assert X.shape == (100000, 2) and np.allclose(X.mean(0), [1.0, -2.0], atol=0.03) and np.allclose(np.cov(X.T), C, atol=0.05)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be symmetric positive definite with first diagonal entry a, the rest of its first column w, and trailing
          block B. Prove that the Schur complement S = B − wwᵀ/a is symmetric positive definite.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes a = e₁ᵀAe₁ > 0, so S is defined, and that S is symmetric because B is and wwᵀ is.",
          "For y ≠ 0 chooses x = (−wᵀy/a, y), or an equivalent vector, which is nonzero.",
          "Expands xᵀAx and shows it equals yᵀSy, which is positive since A is positive definite.",
        ],
      },
    },
    {
      key: "d2",
      rung: "stretch",
      prompt: (
        <p>
          For the 5 × 5 matrix with 1 on the diagonal and 0.5 everywhere else, what is the second Cholesky pivot,
          a₂₂ − l₂₁²?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why a positive definite matrix factors as LLᵀ, why Cholesky needs no pivoting, why its failure is a reliable test of positive definiteness, and what jitter does to a kernel matrix.",

  glimpse: (
    <>
      <p>
        LU and Cholesky solve square systems. For least squares, and for building orthonormal bases stably, we need
        orthogonal transformations, which never amplify errors at all. The next lesson builds QR from reflections.
      </p>
    </>
  ),
};
