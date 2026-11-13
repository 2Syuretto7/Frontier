import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OpNormViz } from "@/components/viz/OpNormViz";
import type { LessonContent } from "@/lib/types";

const OPN = `import numpy as np

def op_norm(A, p):
    A = np.asarray(A, dtype=float)
    if p == 1:
        return float(np.abs(A).sum(axis=0).max())
    if p == np.inf:
        return float(np.abs(A).sum(axis=1).max())
    if p == 2:
        return float(np.linalg.svd(A, compute_uv=False)[0])
    raise ValueError("p must be 1, 2 or inf")

def schatten(A, p):
    s = np.linalg.svd(np.asarray(A, dtype=float), compute_uv=False)
    return float(s.max()) if p == np.inf else float((s ** p).sum() ** (1 / p))`;

const SVT = `def nuclear_norm(A):
    return float(np.linalg.svd(A, compute_uv=False).sum())

def svt(A, tau):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U * np.maximum(s - tau, 0.0)) @ Vt`;

export const lesson: LessonContent = {
  id: "m6.5.2",
  minutes: 55,
  links: {
    requires: ["m6.5.1", "m6.4.1"],
    revisits: ["m6.4.3"],
    foreshadows: ["m6.5.3", "m6.5.4"],
  },

  puzzle: (
    <>
      <p>
        &ldquo;How big is this weight matrix?&rdquo; has several good answers. Weight decay penalises the sum of squared
        entries; Lipschitz bounds use the largest stretch factor; matrix completion minimises the sum of singular values to
        find low-rank solutions. Which of these are norms, how do they compare, and how are they related to each other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An operator norm measures a matrix by what it does: the most it can stretch a unit vector, with lengths measured in
        your chosen vector norm. Other matrix norms measure the singular values directly: the largest (spectral), the
        root-sum-square (Frobenius) or the sum (nuclear). They are the ℓ∞, ℓ₂ and ℓ₁ norms of the vector of singular values,
        and duality works just as it did for vectors.
      </p>
      <OpNormViz />
    </>
  ),

  theory: (
    <>
      <Definition title="operator norm">
        <p>
          For norms on <M>{"\\mathbb{R}^n"}</M> and <M>{"\\mathbb{R}^m"}</M>, the induced norm of an m×n matrix is{" "}
          <M>{"\\|A\\| = \\max_{x \\ne 0}\\|Ax\\|/\\|x\\|"}</M>. It is a norm on matrices, satisfies{" "}
          <M>{"\\|Ax\\| \\le \\|A\\|\\,\\|x\\|"}</M> and <M>{"\\|AB\\| \\le \\|A\\|\\,\\|B\\|"}</M>, and has{" "}
          <M>{"\\|I\\| = 1"}</M>.
        </p>
      </Definition>

      <Theorem title="the three common operator norms">
        <p>
          <M>{"\\|A\\|_1 = \\max_j \\sum_i |a_{ij}|"}</M> (largest column sum),{" "}
          <M>{"\\|A\\|_\\infty = \\max_i \\sum_j |a_{ij}|"}</M> (largest row sum), and{" "}
          <M>{"\\|A\\|_2 = \\sigma_1(A)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For p = 1: <M>{"\\|Ax\\|_1 = \\|\\sum_j x_ja_j\\|_1 \\le \\sum_j|x_j|\\,\\|a_j\\|_1 \\le \\max_j\\|a_j\\|_1\\,\\|x\\|_1"}</M>,
          where <M>{"a_j"}</M> are the columns, with equality at <M>{"x = e_j"}</M> for the best j. For p = ∞: each{" "}
          <M>{"|(Ax)_i| \\le \\sum_j|a_{ij}|\\,\\|x\\|_\\infty"}</M>, with equality for the best row i when{" "}
          <M>{"x_j = \\operatorname{sign}(a_{ij})"}</M>. For p = 2 this is the SVD lesson:{" "}
          <M>{"\\max_{\\|x\\|=1}\\|Ax\\|^2 = \\lambda_{\\max}(A^\\top A) = \\sigma_1^2"}</M>.
        </p>
      </Proof>

      <Definition title="Frobenius, nuclear and Schatten norms">
        <p>
          <M>{"\\|A\\|_F = \\sqrt{\\sum_{ij}a_{ij}^2} = \\sqrt{\\operatorname{tr}A^\\top A} = \\sqrt{\\sum_j\\sigma_j^2}"}</M>,
          and the nuclear norm is <M>{"\\|A\\|_* = \\sum_j \\sigma_j"}</M>. More generally the Schatten p-norm is the
          ℓ_p norm of the singular values; p = ∞, 2, 1 give the spectral, Frobenius and nuclear norms. All are unchanged by
          multiplying A by orthogonal matrices on either side.
        </p>
      </Definition>
      <p>
        For a matrix of rank r, comparing ℓ_p norms of an r-vector gives{" "}
        <M>{"\\|A\\|_2 \\le \\|A\\|_F \\le \\sqrt r\\,\\|A\\|_2"}</M> and{" "}
        <M>{"\\|A\\|_F \\le \\|A\\|_* \\le \\sqrt r\\,\\|A\\|_F"}</M>. The Frobenius norm is not an operator norm for n ≥ 2,
        since <M>{"\\|I\\|_F = \\sqrt n"}</M>, but it is submultiplicative, and{" "}
        <M>{"\\|AB\\|_F \\le \\|A\\|_2\\|B\\|_F"}</M>.
      </p>
      <Code>{OPN}</Code>

      <Theorem title="spectral and nuclear norms are dual">
        <p>
          With the trace inner product <M>{"\\langle A, B\\rangle = \\operatorname{tr}(A^\\top B)"}</M>,{" "}
          <M>{"\\langle A, B\\rangle \\le \\|A\\|_2\\|B\\|_*"}</M>, and{" "}
          <M>{"\\|B\\|_* = \\max\\{\\langle A, B\\rangle : \\|A\\|_2 \\le 1\\}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"B = \\sum_j\\sigma_ju_jv_j^\\top"}</M>. Then{" "}
          <M>{"\\operatorname{tr}(A^\\top B) = \\sum_j\\sigma_j\\operatorname{tr}(A^\\top u_jv_j^\\top) = \\sum_j\\sigma_j\\,u_j^\\top Av_j"}</M>,
          and <M>{"|u_j^\\top Av_j| \\le \\|u_j\\|\\,\\|Av_j\\| \\le \\|A\\|_2"}</M>. So the trace is at most{" "}
          <M>{"\\|A\\|_2\\sum_j\\sigma_j"}</M>. Taking <M>{"A = \\sum_j u_jv_j^\\top"}</M>, which has spectral norm 1, gives{" "}
          <M>{"u_j^\\top Av_j = 1"}</M> for every j and attains the bound.
        </p>
      </Proof>

      <Example title="the nuclear norm and low rank">
        <p>
          Rank is not convex, but on the set <M>{"\\|A\\|_2 \\le 1"}</M> the nuclear norm is the largest convex function
          below it, so minimising <M>{"\\|A\\|_*"}</M> is the standard convex surrogate for minimising rank, as in matrix
          completion. Its proximal operator, singular value thresholding, subtracts τ from every singular value and clips at
          zero, which sets the small ones to zero exactly, just as soft-thresholding produces exact zeros for the ℓ₁ norm.
        </p>
        <Code>{SVT}</Code>
      </Example>

      <Remark title="which norm for which job">
        <p>
          The spectral norm controls worst-case amplification, so it appears in Lipschitz bounds, stability and
          generalisation bounds. The Frobenius norm is the Euclidean norm on the entries, so weight decay penalises its
          square and gradient-based fitting of matrices is least squares in it. The nuclear norm promotes low rank. The ℓ₁ and
          ℓ∞ operator norms are cheap to compute exactly and are useful upper bounds for the spectral norm:{" "}
          <M>{"\\|A\\|_2 \\le \\sqrt{\\|A\\|_1\\|A\\|_\\infty}"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inf",
      rung: "check",
      prompt: <p>What is ‖A‖_∞, the operator norm induced by ℓ∞, for A = [[1, −2], [3, 4]]?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "nuclear",
      rung: "check",
      prompt: <p>What is the nuclear norm of diag(3, −1, 0.5)?</p>,
      answer: { kind: "numeric", value: 4.5, tolerance: 1e-9 },
    },
    {
      key: "induced",
      rung: "apply",
      prompt: <p>Which of these matrix norms on n×n matrices (n ≥ 2) is not induced by any vector norm?</p>,
      answer: {
        kind: "choice",
        options: ["the Frobenius norm", "the spectral norm", "the largest column sum of absolute values", "the largest row sum of absolute values"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def op_norm(A, p):
    A = np.asarray(A, dtype=float)
    if p == 1:
        return float(np.abs(A).sum(axis=0).max())
    if p == np.inf:
        return float(np.abs(A).sum(axis=1).max())
    if p == 2:
        return float(np.linalg.svd(A, compute_uv=False)[0])
    raise ValueError("p must be 1, 2 or inf")

def schatten(A, p):
    s = np.linalg.svd(np.asarray(A, dtype=float), compute_uv=False)
    return float(s.max()) if p == np.inf else float((s ** p).sum() ** (1 / p))

A = np.array([[1.0, -2.0], [3.0, 4.0]])
print(op_norm(A, 1), op_norm(A, np.inf), round(op_norm(A, 2), 4))
print(round(schatten(A, 2), 4), round(schatten(A, 1), 4), schatten(A, np.inf) == op_norm(A, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["6.0 7.0 5.1167\n5.4772 7.0711 True", "7.0 6.0 5.1167\n5.4772 7.0711 True", "6.0 7.0 5.4772\n5.4772 7.0711 False", "6.0 7.0 5.1167\n5.4772 10.0 True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def nuclear_norm(A):
    return float(np.linalg.svd(A, compute_uv=False).sum())

def svt(A, tau):
    U, s, Vt = np.linalg.svd(A, full_matrices=False)
    return (U * np.maximum(s - tau, 0.0)) @ Vt

M = np.diag([3.0, 1.0, 0.5])
print(np.round(np.diag(svt(M, 0.8)), 4), round(nuclear_norm(svt(M, 0.8)), 4))
print(np.linalg.matrix_rank(svt(M, 1.5)), round(nuclear_norm(M), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2.2 0.2 0. ] 2.4\n1 4.5", "[2.2 0.2 0. ] 2.4\n2 4.5", "[2.2 0.2 0.5] 2.9\n1 4.5", "[3.  1.  0.5] 4.5\n3 4.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>op_norm(A, p)</C> for p in 1, 2, np.inf (raise ValueError otherwise), using the column-sum, singular-value
          and row-sum formulas, and <C>schatten(A, p)</C>, the ℓ_p norm of the singular values (p = np.inf allowed).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def op_norm(A, p):
    return float(np.abs(A).max())

def schatten(A, p):
    return float(np.linalg.norm(A))
`,
        solution: OPN,
        tests: [
          { name: "operator", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(4, 6))
for p in (1, 2, np.inf):
    assert np.isclose(op_norm(A, p), np.linalg.norm(A, p))
    x = rng.normal(size=6)
    assert np.linalg.norm(A @ x, p) <= op_norm(A, p) * np.linalg.norm(x, p) + 1e-12
try:
    op_norm(A, 3)
    assert False
except ValueError:
    pass` },
          { name: "schatten", code: `A = np.random.default_rng(1).normal(size=(5, 3))
assert np.isclose(schatten(A, 2), np.linalg.norm(A))
assert np.isclose(schatten(A, 1), np.linalg.norm(A, 'nuc'))
assert np.isclose(schatten(A, np.inf), np.linalg.norm(A, 2))
assert np.isclose(schatten(np.diag([3.0, -4.0]), 2), 5.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>nuclear_norm(A)</C> and <C>svt(A, tau)</C>, singular value thresholding: replace each singular value σ by
          max(σ − τ, 0).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def nuclear_norm(A):
    return float(np.abs(A).sum())

def svt(A, tau):
    return np.maximum(A - tau, 0.0)
`,
        solution: `import numpy as np

${SVT}`,
        tests: [
          { name: "nuclear", code: `assert np.isclose(nuclear_norm(np.diag([3.0, -1.0, 0.5])), 4.5)
A = np.random.default_rng(2).normal(size=(4, 4))
assert np.isclose(nuclear_norm(A), np.linalg.norm(A, 'nuc'))` },
          { name: "threshold", code: `rng = np.random.default_rng(3)
A = rng.normal(size=(6, 4))
s = np.linalg.svd(A, compute_uv=False)
T = svt(A, (s[1] + s[2]) / 2)
assert np.linalg.matrix_rank(T, tol=1e-6) == 2
assert np.allclose(np.linalg.svd(svt(A, 0.3), compute_uv=False), np.maximum(s - 0.3, 0))
assert np.allclose(svt(A, 0.0), A) and np.allclose(svt(A, s[0] + 1), 0)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that tr(AᵀB) ≤ ‖A‖₂ ‖B‖_* for real matrices of the same shape.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes B = Σ σⱼuⱼvⱼᵀ (SVD) and computes tr(AᵀB) = Σ σⱼ uⱼᵀAvⱼ, using linearity of trace and tr(Aᵀuvᵀ) = uᵀAv.",
          "Bounds each |uⱼᵀAvⱼ| ≤ ‖uⱼ‖‖Avⱼ‖ ≤ ‖A‖₂ by Cauchy–Schwarz and the definition of the spectral norm.",
          "Sums to get tr(AᵀB) ≤ ‖A‖₂ Σ σⱼ = ‖A‖₂‖B‖_*.",
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: <p>Over all matrices of rank 4, what is the largest possible value of ‖A‖_* / ‖A‖_F?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between operator norms and norms of the singular values, why the spectral and nuclear norms are dual, and why the nuclear norm encourages low rank.",

  glimpse: (
    <>
      <p>
        With norms on matrices we can say how much a perturbation E is. Next: how much can eigenvalues, singular values and
        eigenvectors move when A becomes A + E? Weyl&apos;s inequality bounds the eigenvalues by ‖E‖₂, and the Davis–Kahan
        theorem bounds the rotation of eigenvectors by ‖E‖₂ divided by an eigenvalue gap.
      </p>
      <p>
        After that, the condition number ‖A‖‖A⁻¹‖ measures how much a linear solve can amplify relative errors.
      </p>
    </>
  ),
};
