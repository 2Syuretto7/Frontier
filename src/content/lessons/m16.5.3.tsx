import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KrrSpectrumViz } from "@/components/viz/KrrSpectrumViz";
import type { LessonContent } from "@/lib/types";

const FIT = `def solve(A, b):
    n = len(b)
    M = [row[:] + [v] for row, v in zip(A, b)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            t = M[r][c] / M[c][c]
            M[r] = [u - t * v for u, v in zip(M[r], M[c])]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (M[r][n] - sum(M[r][j] * x[j] for j in range(r + 1, n))) / M[r][r]
    return x

def krr_fit(xs, ys, k, lam):
    m = len(xs)
    A = [[k(a, b) + (lam * m if i == j else 0) for j, b in enumerate(xs)] for i, a in enumerate(xs)]
    return solve(A, ys)

def krr_predict(alpha, xs, k, x):
    return sum(a * k(xi, x) for a, xi in zip(alpha, xs))`;

const SPECTRUM = `def shrink_factors(eigs, lam, m):
    return [mu / (mu + lam * m) for mu in eigs]

def effective_dof(eigs, lam, m):
    return sum(shrink_factors(eigs, lam, m))

def loo_residuals(ys, fitted, s_diag):
    return [(y - f) / (1 - s) for y, f, s in zip(ys, fitted, s_diag)]`;

export const lesson: LessonContent = {
  id: "m16.5.3",
  minutes: 45,
  links: {
    requires: ["m16.5.2", "m16.4.2"],
    revisits: ["m9.6.4", "m6.3.3"],
    foreshadows: ["m16.5.4", "m16.7.2"],
  },

  puzzle: (
    <>
      <p>
        Ridge regression has a closed form, and so, thanks to the representer theorem, does its kernel version: one linear
        system of size m. But a closed form is not an explanation. Which features of the data does the fit keep and which
        does it throw away, how many parameters is it really using, and how can its leave-one-out error be computed without
        refitting m times?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Diagonalise the Gram matrix. Its eigenvectors are patterns across the training points, from smooth ones with large
        eigenvalues to rough ones with tiny eigenvalues. Kernel ridge regression projects the labels onto each pattern and
        keeps a fraction μ/(μ + λm) of it: smooth patterns survive almost intact, rough ones are almost erased. λ sets where the
        cut falls, and the sum of the kept fractions counts the effective number of parameters.
      </p>
      <KrrSpectrumViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="kernel ridge regression">
        <p>The minimiser over the RKHS of</p>
        <MD>{"\\frac1m \\sum_{i=1}^m (f(x_i) - y_i)^2 + \\lambda \\|f\\|_H^2"}</MD>
        <p>
          is <M>{"f = \\sum_i \\alpha_i k(x_i, \\cdot)"}</M> with <M>{"\\alpha = (K + \\lambda m I)^{-1} y"}</M>, and its fitted values are{" "}
          <M>{"\\hat y = K(K + \\lambda m I)^{-1} y"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the representer theorem (m16.5.2) it suffices to minimise{" "}
          <M>{"J(\\alpha) = \\tfrac1m\\|K\\alpha - y\\|^2 + \\lambda\\alpha^\\top K\\alpha"}</M>. Its gradient is{" "}
          <M>{"\\tfrac2m K(K\\alpha - y) + 2\\lambda K\\alpha = \\tfrac2m K\\big((K + \\lambda m I)\\alpha - y\\big)"}</M>, which vanishes at the
          stated α; J is convex, so this is a minimum (<C>krr_fit</C> solves the system, <C>krr_predict</C> evaluates f). If K is
          singular other α give the same function. The cost is dominated by the solve, about <M>{"m^3/3"}</M> operations.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Theorem title="spectral form">
        <p>
          If <M>{"K = \\sum_j \\mu_j u_j u_j^\\top"}</M> with orthonormal <M>{"u_j"}</M> (m6.5.1), then
        </p>
        <MD>{"\\hat y = \\sum_j \\frac{\\mu_j}{\\mu_j + \\lambda m} \\langle u_j, y\\rangle u_j, \\qquad \\operatorname{df}(\\lambda) = \\operatorname{tr} S = \\sum_j \\frac{\\mu_j}{\\mu_j + \\lambda m},"}</MD>
        <p>where <M>{"S = K(K + \\lambda m I)^{-1}"}</M> is the smoother matrix.</p>
      </Theorem>
      <Proof>
        <p>
          K and <M>{"K + \\lambda m I"}</M> share eigenvectors, with eigenvalues <M>{"\\mu_j"}</M> and <M>{"\\mu_j + \\lambda m"}</M>, so S has
          eigenvalues <M>{"\\mu_j / (\\mu_j + \\lambda m)"}</M> (<C>shrink_factors</C>). Its trace, the effective degrees of freedom
          (<C>effective_dof</C>), equals the number of parameters for ordinary least squares and falls smoothly towards 0 as λ
          grows. For a smooth kernel the <M>{"\\mu_j"}</M> decay fast, so only a few directions matter whatever m is.
        </p>
      </Proof>

      <Theorem title="leave-one-out in closed form">
        <p>
          The residual at <M>{"x_i"}</M> of the fit computed without example i is{" "}
          <M>{"(y_i - \\hat y_i) / (1 - S_{ii})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\tilde y"}</M> equal y except that <M>{"\\tilde y_i"}</M> is the leave-one-out prediction <M>{"f^{(-i)}(x_i)"}</M>. The
          function <M>{"f^{(-i)}"}</M> also minimises the full objective with labels <M>{"\\tilde y"}</M>, since its i-th residual is
          zero, so <M>{"f^{(-i)}(x_i) = (S\\tilde y)_i = \\hat y_i + S_{ii}(f^{(-i)}(x_i) - y_i)"}</M>. Solving for{" "}
          <M>{"y_i - f^{(-i)}(x_i)"}</M> gives the formula (<C>loo_residuals</C>). One fit thus yields the whole leave-one-out
          curve, which is how λ is usually chosen.
        </p>
        <Code>{SPECTRUM}</Code>
      </Proof>

      <Definition title="the Gaussian process view">
        <p>
          If f is a Gaussian process with covariance k and <M>{"y_i = f(x_i) + \\varepsilon_i"}</M> with noise variance{" "}
          <M>{"\\sigma^2"}</M>, the posterior mean of f is the kernel ridge regression estimate with{" "}
          <M>{"\\lambda m = \\sigma^2"}</M>. The posterior variance, which ridge regression does not report, is{" "}
          <M>{"k(x, x) - k_x^\\top (K + \\sigma^2 I)^{-1} k_x"}</M>. Regularisation and prior beliefs are again two names for one
          object, as in the Bayesian reading of ridge regression (m9.6.4).
        </p>
      </Definition>

      <Remark title="rates">
        <p>
          With the oracle inequality of m16.4.2 the excess risk is <M>{"O(\\|f^*\\|_H / \\sqrt m)"}</M>. Sharper analyses using the
          eigenvalue decay give faster rates: if <M>{"\\mu_j \\sim j^{-b}"}</M> and the target is smooth enough, the best λ balances{" "}
          <M>{"\\operatorname{df}(\\lambda)/m"}</M> against the bias and the error falls nearly like 1/m for very smooth kernels. The same
          spectral calculation describes wide neural networks in the kernel regime and the interpolating limit λ → 0 (m16.7.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dof",
      rung: "check",
      prompt: <p>A Gram matrix has eigenvalues 10, 5, 1 and 0.5, and λm = 1. What are the effective degrees of freedom? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.5758, tolerance: 0.0001 },
    },
    {
      key: "loo",
      rung: "check",
      prompt: <p>A point has label 3, fitted value 2.4 and smoother diagonal S_ii = 0.4. What is its leave-one-out residual?</p>,
      answer: { kind: "numeric", value: 1.0, tolerance: 0.0001 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>If the Gram matrix is invertible, what happens to kernel ridge regression as λ → 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "It converges to the minimum-norm interpolant, which fits every training label exactly",
          "It converges to the zero function",
          "The effective degrees of freedom fall to zero",
          "The coefficients α stay bounded and the fit becomes a constant",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def solve(A, b):
    n = len(b)
    M = [row[:] + [v] for row, v in zip(A, b)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            t = M[r][c] / M[c][c]
            M[r] = [u - t * v for u, v in zip(M[r], M[c])]
    x = [0.0] * n
    for r in range(n - 1, -1, -1):
        x[r] = (M[r][n] - sum(M[r][j] * x[j] for j in range(r + 1, n))) / M[r][r]
    return x

def krr_fit(xs, ys, k, lam):
    m = len(xs)
    A = [[k(a, b) + (lam * m if i == j else 0) for j, b in enumerate(xs)] for i, a in enumerate(xs)]
    return solve(A, ys)

def krr_predict(alpha, xs, k, x):
    return sum(a * k(xi, x) for a, xi in zip(alpha, xs))

k = lambda a, b: 1.0 if a == b else 0.5; xs = [0, 1]; a = krr_fit(xs, [1.0, 3.0], k, 0.25); print([round(v, 4) for v in a], round(krr_predict(a, xs, k, 0), 4), round(krr_predict(a, xs, k, 7), 4))
print([round(v, 4) for v in krr_fit([0, 1], [2.0, 2.0], lambda a, b: float(a == b), 1.0)], solve([[2.0, 0.0], [0.0, 4.0]], [1.0, 1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 2.0] 1.0 1.0\n[0.6667, 0.6667] [0.5, 0.25]",
          "[0.0, 2.0] 1.0 0.0\n[0.6667, 0.6667] [0.5, 0.25]",
          "[0.0, 2.0] 1.0 1.0\n[1.0, 1.0] [0.5, 0.25]",
          "[0.0, 2.0] 1.0 1.0\n[0.6667, 0.6667] [2.0, 4.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shrink_factors(eigs, lam, m):
    return [mu / (mu + lam * m) for mu in eigs]

def effective_dof(eigs, lam, m):
    return sum(shrink_factors(eigs, lam, m))

def loo_residuals(ys, fitted, s_diag):
    return [(y - f) / (1 - s) for y, f, s in zip(ys, fitted, s_diag)]

print([round(v, 4) for v in shrink_factors([4.0, 1.0, 0.1], 0.1, 10)], round(effective_dof([4.0, 1.0, 0.1], 0.1, 10), 4))
print(loo_residuals([1.0, 2.0], [0.5, 1.0], [0.5, 0.75]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8, 0.5, 0.0909] 1.3909\n[1.0, 4.0]",
          "[0.8, 0.5, 0.0909] 1.3909\n[0.25, 0.25]",
          "[0.9756, 0.9091, 0.5] 2.3847\n[1.0, 4.0]",
          "[0.8, 0.5, 0.0909] 1.6091\n[1.0, 4.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve(A, b)</C> by Gaussian elimination with partial pivoting, <C>krr_fit(xs, ys, k, lam)</C> returning α =
          (K + λmI)⁻¹y, and <C>krr_predict(alpha, xs, k, x)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def solve(A, b):
    return [0.0] * len(b)

def krr_fit(xs, ys, k, lam):
    return [0.0] * len(xs)

def krr_predict(alpha, xs, k, x):
    return 0.0
`,
        solution: FIT,
        tests: [
          { name: "solve", code: `assert solve([[0.0, 1.0], [1.0, 0.0]], [2.0, 3.0]) == [3.0, 2.0] and solve([[4.0]], [2.0]) == [0.5] and all(abs(u - v) < 1e-12 for u, v in zip(solve([[2.0, 1.0], [1.0, 3.0]], [3.0, 5.0]), [0.8, 1.4]))` },
          { name: "kernel ridge", code: `d = lambda a, b: float(a == b); al = krr_fit([1, 2, 3], [3.0, 6.0, 9.0], d, 1 / 3)
assert all(abs(u - v) < 1e-12 for u, v in zip(al, [1.5, 3.0, 4.5])) and abs(krr_predict(al, [1, 2, 3], d, 2) - 3.0) < 1e-12 and krr_predict(al, [1, 2, 3], d, 9) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shrink_factors(eigs, lam, m)</C>, <C>effective_dof(eigs, lam, m)</C> and{" "}
          <C>loo_residuals(ys, fitted, s_diag)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shrink_factors(eigs, lam, m):
    return [1.0 for _ in eigs]

def effective_dof(eigs, lam, m):
    return float(len(eigs))

def loo_residuals(ys, fitted, s_diag):
    return [y - f for y, f in zip(ys, fitted)]
`,
        solution: SPECTRUM,
        tests: [
          { name: "spectrum", code: `assert shrink_factors([3.0], 1.0, 1) == [0.75] and effective_dof([1.0, 1.0], 0.5, 2) == 1.0 and effective_dof([5.0], 0.0, 9) == 1.0` },
          { name: "leave one out", code: `assert loo_residuals([0.0], [1.0], [0.5]) == [-2.0] and loo_residuals([2.0, 1.0], [1.0, 1.0], [0.0, 0.9]) == [1.0, 0.0]` },
        ],
      },
    },
    {
      key: "twodof",
      rung: "stretch",
      prompt: (
        <p>
          A Gram matrix has eigenvalues 9, 3 and 1, and m = 1. What value of λ makes the effective degrees of freedom exactly 2?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.314, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Everything here costs a cube in m. For millions of examples that is impossible. The next lesson approximates the
        kernel by an explicit random feature map of modest size, turning kernel methods back into linear ones.
      </p>
    </>
  ),
};
