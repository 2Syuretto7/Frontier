import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HutchErrorViz } from "@/components/viz/HutchErrorViz";
import type { LessonContent } from "@/lib/types";

const HUT = `import numpy as np

def hutchinson(matvec, n, m, rng, kind="rademacher"):
    total = 0.0
    for _ in range(m):
        v = rng.choice([-1.0, 1.0], size=n) if kind == "rademacher" else rng.normal(size=n)
        total += float(v @ matvec(v))
    return total / m

def var_gauss(A):
    return float(2 * np.sum(A ** 2))

def var_rademacher(A):
    return float(2 * (np.sum(A ** 2) - np.sum(np.diag(A) ** 2)))`;

const HPP = `import numpy as np

def hutch_pp(matvec, n, m, rng):
    k = m // 3
    S = rng.choice([-1.0, 1.0], size=(n, k))
    Q, _ = np.linalg.qr(np.column_stack([matvec(S[:, j]) for j in range(k)]))
    t1 = sum(float(Q[:, j] @ matvec(Q[:, j])) for j in range(k))
    t2 = 0.0
    for _ in range(m - 2 * k):
        v = rng.choice([-1.0, 1.0], size=n)
        v = v - Q @ (Q.T @ v)
        w = matvec(v)
        t2 += float(v @ (w - Q @ (Q.T @ w)))
    return t1 + t2 / (m - 2 * k)

def psd_with_eigs(lams, rng):
    Q, _ = np.linalg.qr(rng.normal(size=(len(lams), len(lams))))
    return (Q * lams) @ Q.T`;

export const lesson: LessonContent = {
  id: "m11.6.4",
  minutes: 45,
  links: {
    requires: ["m11.6.2", "m11.4.3"],
    revisits: ["m7.2.4"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        Continuous normalising flows and diffusion models need the divergence of a vector field, the trace of its Jacobian,
        at every step of training. For an image model the Jacobian has a billion entries on the diagonal alone, and forming
        it would take one backward pass per input dimension. Instead, practitioners multiply the Jacobian by a single
        random vector of ±1 entries and take one dot product. That one number is an unbiased estimate of the trace. Why,
        and how noisy is it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For a random vector v with independent entries of mean 0 and variance 1, the quadratic form vᵀAv = Σ aᵢⱼvᵢvⱼ keeps
        the diagonal terms aᵢᵢvᵢ² on average and sees the off-diagonal ones cancel, because vᵢvⱼ has mean zero for i ≠ j.
        With ±1 entries, vᵢ² is exactly 1, so the diagonal is captured without noise and only the off-diagonal entries
        contribute variance. Averaging m probes cuts the standard deviation by √m. If a few large eigenvalues dominate the
        trace, it pays to find them first and compute their contribution exactly.
      </p>
      <HutchErrorViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="Hutchinson's estimator is unbiased">
        <p>
          If <M>{"\\mathbb E[vv^\\top] = I"}</M> then <M>{"\\mathbb E[v^\\top Av] = \\mathrm{tr}\\,A"}</M>, so{" "}
          <M>{"\\frac1m\\sum_{i=1}^m v_i^\\top Av_i"}</M> with independent probes estimates the trace using m products with A.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"v^\\top Av = \\mathrm{tr}(v^\\top Av) = \\mathrm{tr}(Avv^\\top)"}</M>, and trace and expectation are both
          linear, so <M>{"\\mathbb E[v^\\top Av] = \\mathrm{tr}(A\\,\\mathbb E[vv^\\top]) = \\mathrm{tr}\\,A"}</M>.
        </p>
      </Proof>

      <Theorem title="variance of one probe">
        <p>For symmetric A,</p>
        <MD>{"\\mathrm{Var}_{\\text{Gaussian}}[v^\\top Av] = 2\\|A\\|_F^2, \\qquad \\mathrm{Var}_{\\text{Rademacher}}[v^\\top Av] = 2\\Big(\\|A\\|_F^2 - \\sum_ia_{ii}^2\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Rademacher: <M>{"v_i^2 = 1"}</M>, so <M>{"v^\\top Av - \\mathrm{tr}A = \\sum_{i \\neq j}a_{ij}v_iv_j"}</M>. Squaring and
          taking expectations, <M>{"\\mathbb E[v_iv_jv_kv_l]"}</M> for i ≠ j and k ≠ l is 1 when {"{"}k, l{"}"} = {"{"}i, j{"}"}{" "}
          and 0 otherwise, since any index appearing once leaves a factor of mean zero. The surviving terms are{" "}
          <M>{"\\sum_{i \\neq j}a_{ij}(a_{ij} + a_{ji}) = 2\\sum_{i \\neq j}a_{ij}^2"}</M>. Gaussian: rotate to the eigenbasis,
          where by rotation invariance <M>{"v^\\top Av = \\sum\\lambda_iz_i^2"}</M> with independent standard normal{" "}
          <M>{"z_i"}</M>, and <M>{"\\mathrm{Var}(z^2) = 2"}</M> gives <M>{"2\\sum\\lambda_i^2 = 2\\|A\\|_F^2"}</M>.
        </p>
        <p>
          In the code, 4000 single-probe estimates for a matrix with a large diagonal have mean equal to the trace and
          variance matching each formula; the Rademacher variance here is 0.03% of the Gaussian one, because the diagonal
          carries most of the Frobenius norm. For positive semidefinite A, <M>{"\\|A\\|_F \\leq \\mathrm{tr}\\,A"}</M>, so{" "}
          <M>{"m = O(\\log(1/\\delta)/\\epsilon^2)"}</M> probes give relative error ε with probability 1 − δ, independent of
          the dimension.
        </p>
        <Code>{HUT}</Code>
      </Proof>

      <Theorem title="Hutch++">
        <p>
          Split m products into three equal parts. Use the first to sketch the range, Q = orth(AS); compute{" "}
          <M>{"\\mathrm{tr}(Q^\\top AQ)"}</M> exactly with the second; and apply Hutchinson with the third to the deflated
          matrix <M>{"(I - QQ^\\top)A(I - QQ^\\top)"}</M>. The two parts add to tr A, and for positive semidefinite A the
          relative error is O(1/m) rather than O(1/√m).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{tr}A = \\mathrm{tr}(QQ^\\top A) + \\mathrm{tr}((I - QQ^\\top)A) = \\mathrm{tr}(Q^\\top AQ) + \\mathrm{tr}((I - QQ^\\top)A(I - QQ^\\top))"}</M>,
          using the cyclic property and that <M>{"I - QQ^\\top"}</M> is an idempotent projector. The first term has no
          random error. The second is estimated by Hutchinson, whose error is proportional to the Frobenius norm of the
          deflated matrix; for positive semidefinite A, the randomised SVD bound shows that after removing k = m/3
          directions this norm is at most about <M>{"\\mathrm{tr}A/\\sqrt k"}</M>, so the error is about{" "}
          <M>{"\\mathrm{tr}A/\\sqrt{k}\\cdot 1/\\sqrt{k} = O(\\mathrm{tr}A/m)"}</M>. With eigenvalues 1/j², 30 products give a
          mean relative error of 12.5% for Hutchinson and 0.57% for Hutch++.
        </p>
        <Code>{HPP}</Code>
      </Proof>

      <Remark title="where trace estimates are used">
        <p>
          The trace of the Hessian measures curvature for flatness-based generalisation studies and some regularisers; log
          determinants, tr log A, combine Hutchinson with the Lanczos quadrature of the eigenvalue chapter; and
          continuous normalising flows (FFJORD) and score-matching objectives estimate the divergence tr(∂f/∂x) with one
          vector-Jacobian product per probe, which automatic differentiation provides at the cost of one backward pass.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rad",
      rung: "check",
      prompt: <p>For A with rows (2, 1) and (1, 3), what is the variance of vᵀAv with a Rademacher probe?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "gau",
      rung: "check",
      prompt: <p>For the same A, what is the variance with a Gaussian probe?</p>,
      answer: { kind: "numeric", value: 30, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why are random sign probes usually preferred to Gaussian probes?</p>,
      answer: {
        kind: "choice",
        options: [
          "Their variance omits the diagonal entries, so it is never larger and can be far smaller",
          "They are unbiased while Gaussian probes are not",
          "They need fewer matrix-vector products per probe",
          "Their estimate is always exact",
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

def hutchinson(matvec, n, m, rng, kind="rademacher"):
    total = 0.0
    for _ in range(m):
        v = rng.choice([-1.0, 1.0], size=n) if kind == "rademacher" else rng.normal(size=n)
        total += float(v @ matvec(v))
    return total / m

def var_gauss(A):
    return float(2 * np.sum(A ** 2))

def var_rademacher(A):
    return float(2 * (np.sum(A ** 2) - np.sum(np.diag(A) ** 2)))

rng = np.random.default_rng(0); G = rng.normal(size=(100, 100)); A = G @ G.T / 100 + np.diag(np.arange(100.0))
mv = lambda v: A @ v
for kind, var in [("rademacher", var_rademacher(A)), ("gauss", var_gauss(A))]:
    est = np.array([hutchinson(mv, 100, 1, rng, kind) for _ in range(4000)])
    print(kind, round(float(est.mean() / np.trace(A)), 2), round(float(est.var() / var), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["rademacher 1.0 1.0\ngauss 1.0 1.0", "rademacher 1.0 0.0\ngauss 1.0 1.0", "rademacher 1.0 1.0\ngauss 1.0 2.0", "rademacher 0.5 1.0\ngauss 1.0 1.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def hutch_pp(matvec, n, m, rng):
    k = m // 3
    S = rng.choice([-1.0, 1.0], size=(n, k))
    Q, _ = np.linalg.qr(np.column_stack([matvec(S[:, j]) for j in range(k)]))
    t1 = sum(float(Q[:, j] @ matvec(Q[:, j])) for j in range(k))
    t2 = 0.0
    for _ in range(m - 2 * k):
        v = rng.choice([-1.0, 1.0], size=n)
        v = v - Q @ (Q.T @ v)
        w = matvec(v)
        t2 += float(v @ (w - Q @ (Q.T @ w)))
    return t1 + t2 / (m - 2 * k)

def psd_with_eigs(lams, rng):
    Q, _ = np.linalg.qr(rng.normal(size=(len(lams), len(lams))))
    return (Q * lams) @ Q.T

rng = np.random.default_rng(1); A = psd_with_eigs(1.0 / np.arange(1, 301) ** 2, rng); mv = lambda v: A @ v; t = np.trace(A)
e1 = [abs(np.mean([v @ A @ v for v in rng.choice([-1.0, 1.0], size=(30, 300))]) - t) / t for _ in range(200)]
e2 = [abs(hutch_pp(mv, 300, 30, rng) - t) / t for _ in range(200)]
print(round(float(np.mean(e1)), 3), round(float(np.mean(e2)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.125 0.0057", "0.0057 0.125", "0.125 0.125", "0.0057 0.0057"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hutchinson(matvec, n, m, rng, kind=&quot;rademacher&quot;)</C>, averaging m probes drawn with{" "}
          <C>rng.choice([-1.0, 1.0], size=n)</C> or <C>rng.normal(size=n)</C>, and <C>var_gauss(A)</C> and{" "}
          <C>var_rademacher(A)</C>, the single-probe variances for symmetric A.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hutchinson(matvec, n, m, rng, kind="rademacher"):
    return 0.0

def var_gauss(A):
    return 0.0

def var_rademacher(A):
    return 0.0
`,
        solution: HUT,
        tests: [
          { name: "var", code: `A = np.array([[2.0, 1.0], [1.0, 3.0]])
assert abs(var_rademacher(A) - 4.0) < 1e-12 and abs(var_gauss(A) - 30.0) < 1e-12
assert hutchinson(lambda v: 5.0 * v, 7, 3, np.random.default_rng(42)) == 35.0` },
          { name: "mean", code: `rng = np.random.default_rng(43); G = rng.normal(size=(30, 30)); A = G + G.T
for kind, var in [("rademacher", var_rademacher(A)), ("gauss", var_gauss(A))]:
    assert abs(hutchinson(lambda v: A @ v, 30, 20000, rng, kind) - np.trace(A)) < 5 * np.sqrt(var / 20000)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>hutch_pp(matvec, n, m, rng)</C> with k = m // 3 sign vectors for the sketch, k exact quadratic forms on the
          orthonormal basis, and the remaining m − 2k probes on the deflated matrix; and <C>psd_with_eigs(lams, rng)</C>,
          QΛQᵀ for a random orthogonal Q.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def hutch_pp(matvec, n, m, rng):
    return 0.0

def psd_with_eigs(lams, rng):
    return np.diag(lams)
`,
        solution: HPP,
        tests: [
          { name: "psd", code: `A = psd_with_eigs(np.array([3.0, 2.0, 1.0, 0.5]), np.random.default_rng(44))
assert np.allclose(A, A.T) and np.allclose(np.linalg.eigvalsh(A), [0.5, 1.0, 2.0, 3.0]) and not np.allclose(A, np.diag(np.diag(A)))` },
          { name: "pp", code: `rng = np.random.default_rng(45); A = psd_with_eigs(np.concatenate([np.ones(5) * 10, np.zeros(45)]), rng)
assert abs(hutch_pp(lambda v: A @ v, 50, 18, rng) - 50.0) < 1e-8
A = psd_with_eigs(1.0 / np.arange(1, 81) ** 2, rng); t = np.trace(A)
errs = [abs(hutch_pp(lambda v: A @ v, 80, 30, rng) - t) / t for _ in range(30)]
assert np.mean(errs) < 0.03` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let A be symmetric and v have independent entries equal to ±1 with probability 1/2. Prove that Var[vᵀAv] = 2Σ_(i≠j)
          aᵢⱼ².
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses vᵢ² = 1 to write vᵀAv − tr A = Σ_(i≠j) aᵢⱼvᵢvⱼ, which has mean zero.",
          "Computes E[vᵢvⱼvₖvₗ] for i ≠ j, k ≠ l: it is 1 if {k, l} = {i, j} and 0 otherwise.",
          "Sums the surviving terms using symmetry aᵢⱼ = aⱼᵢ to get 2Σ_(i≠j) aᵢⱼ².",
        ],
      },
    },
    {
      key: "sd",
      rung: "stretch",
      prompt: (
        <p>
          Gaussian Hutchinson with m = 50 probes is applied to the 100 × 100 identity. What is the standard deviation of the
          estimate divided by the trace?
        </p>
      ),
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why vᵀAv estimates the trace, why random signs beat Gaussian probes, how the error shrinks with the number of probes, and how Hutch++ gets a faster rate by computing the top part of the spectrum exactly.",

  glimpse: (
    <>
      <p>
        So far the matrices were applied or factored. The next chapter computes functions of matrices: the exponential,
        square roots and inverse roots, and the orthogonal polar factor at the heart of recent optimisers.
      </p>
    </>
  ),
};
