import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DoubleDescentViz } from "@/components/viz/DoubleDescentViz";
import type { LessonContent } from "@/lib/types";

const RISK = `def risk_under(n, p, signal_out, sigma2):
    return (signal_out + sigma2) * (1 + p / (n - p - 1))

def risk_over(n, p, signal_in, signal_out, sigma2):
    return signal_in * (1 - n / p) + (signal_out + sigma2) * (1 + n / (p - n - 1))

def risk_curve(n, beta_sq, sigma2):
    total, inside, out = sum(beta_sq), 0.0, []
    for p in range(1, len(beta_sq) + 1):
        inside += beta_sq[p - 1]
        if p < n - 1:
            out.append(risk_under(n, p, total - inside, sigma2))
        elif p > n + 1:
            out.append(risk_over(n, p, inside, total - inside, sigma2))
        else:
            out.append(None)
    return out`;

const MINNORM = `def solve(A, b):
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

def min_norm_ls(X, y):
    n, p = len(X), len(X[0])
    if p <= n:
        A = [[sum(r[i] * r[j] for r in X) for j in range(p)] for i in range(p)]
        return solve(A, [sum(r[i] * v for r, v in zip(X, y)) for i in range(p)])
    a = solve([[sum(u * v for u, v in zip(r, s)) for s in X] for r in X], y)
    return [sum(r[j] * c for r, c in zip(X, a)) for j in range(p)]

def train_mse(X, y, w):
    return sum((sum(a * b for a, b in zip(r, w)) - v) ** 2 for r, v in zip(X, y)) / len(y)`;

export const lesson: LessonContent = {
  id: "m16.7.1",
  minutes: 45,
  links: {
    requires: ["m16.5.4", "m9.6.4"],
    revisits: ["m16.2.3", "m15.5.3"],
    foreshadows: ["m16.7.2", "l10.6.3"],
  },

  puzzle: (
    <>
      <p>
        The textbook picture of model selection is a U: as the model grows, bias falls, variance rises, and test error is
        smallest somewhere in between. Yet huge neural networks that fit their training data perfectly often predict better
        than smaller ones. If you keep adding parameters past the point where the model can interpolate the data, does the
        test error keep exploding, or can it come back down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        When the number of parameters p equals the number of examples n, there is exactly one interpolating solution, and
        it must contort itself to pass through every noisy label: its norm and its test error blow up. With more parameters
        than examples there are infinitely many interpolants, and the one of smallest norm spreads the noise thinly over
        many directions. The test error comes down again, sometimes below the best small model.
      </p>
      <DoubleDescentViz />
    </>
  ),

  theory: (
    <>
      <Definition title="minimum-norm least squares">
        <p>
          For a design X ∈ ℝ<sup>n×p</sup> and labels y, the estimator <M>{"\\hat w = X^+ y"}</M> is the least-squares solution when{" "}
          <M>{"p \\le n"}</M> and X has full column rank, <M>{"\\hat w = (X^\\top X)^{-1}X^\\top y"}</M>, and the interpolant of smallest norm when{" "}
          <M>{"p \\ge n"}</M> and X has full row rank, <M>{"\\hat w = X^\\top (XX^\\top)^{-1} y"}</M> (<C>min_norm_ls</C>). It is also the limit
          of ridge regression as λ → 0 (m9.6.4).
        </p>
      </Definition>

      <Theorem title="double descent for least squares (Belkin, Hsu and Xu)">
        <p>
          Let <M>{"x \\sim N(0, I_D)"}</M> and <M>{"y = x^\\top \\beta + \\varepsilon"}</M> with noise variance <M>{"\\sigma^2"}</M>. Fit{" "}
          <M>{"\\hat w"}</M> by minimum-norm least squares on the first p coordinates using n samples, and split{" "}
          <M>{"\\beta = (\\beta_P, \\beta_{P^c})"}</M>. The expected test risk <M>{"\\mathbb E (y - x_P^\\top \\hat w)^2"}</M> is
        </p>
        <MD>{"\\begin{cases} (\\|\\beta_{P^c}\\|^2 + \\sigma^2)\\Big(1 + \\dfrac{p}{n - p - 1}\\Big), & p \\le n - 2, \\\\[2ex] \\|\\beta_P\\|^2\\Big(1 - \\dfrac np\\Big) + (\\|\\beta_{P^c}\\|^2 + \\sigma^2)\\Big(1 + \\dfrac{n}{p - n - 1}\\Big), & p \\ge n + 2, \\end{cases}"}</MD>
        <p>and it is infinite for <M>{"n - 1 \\le p \\le n + 1"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          For isotropic x the risk is <M>{"\\|\\hat w - \\beta_P\\|^2 + \\|\\beta_{P^c}\\|^2 + \\sigma^2"}</M>. Write{" "}
          <M>{"y = X_P \\beta_P + \\xi"}</M>, where <M>{"\\xi = X_{P^c}\\beta_{P^c} + \\varepsilon"}</M> is independent of <M>{"X_P"}</M> with independent{" "}
          <M>{"N(0, s^2)"}</M> entries, <M>{"s^2 = \\|\\beta_{P^c}\\|^2 + \\sigma^2"}</M>: the omitted features act as extra noise.
        </p>
        <p>
          If <M>{"p < n"}</M>, <M>{"\\hat w - \\beta_P = (X_P^\\top X_P)^{-1}X_P^\\top \\xi"}</M>, whose expected squared norm is{" "}
          <M>{"s^2\\, \\mathbb E \\operatorname{tr}(X_P^\\top X_P)^{-1} = s^2 p/(n - p - 1)"}</M> by the mean of the inverse Wishart
          distribution. If <M>{"p > n"}</M>, <M>{"\\hat w = \\Pi \\beta_P + X_P^+\\xi"}</M> where Π projects onto the n-dimensional row space of{" "}
          <M>{"X_P"}</M>. By rotation invariance that row space is a uniformly random subspace, so{" "}
          <M>{"\\mathbb E\\|(I - \\Pi)\\beta_P\\|^2 = (1 - n/p)\\|\\beta_P\\|^2"}</M>, and the noise term contributes{" "}
          <M>{"s^2\\, \\mathbb E \\operatorname{tr}(X_P X_P^\\top)^{-1} = s^2 n/(p - n - 1)"}</M>. The two pieces are orthogonal in expectation
          (<C>risk_under</C>, <C>risk_over</C>, <C>risk_curve</C>).
        </p>
        <Code>{RISK}</Code>
      </Proof>

      <Remark title="why the peak, and why the second descent">
        <p>
          The factor <M>{"\\operatorname{tr}(X^\\top X)^{-1}"}</M> is a sum of inverse squared singular values. When p is close to n the
          smallest singular value of a random n × p matrix is close to zero (by Marchenko–Pastur its edge is{" "}
          <M>{"(\\sqrt n - \\sqrt p)^2"}</M>), so a tiny direction must carry a large coefficient to fit the noise. Past the threshold
          the extra columns lift the singular values again and the noise is spread over p directions, of which a fraction n/p
          is visible in the fit. The price is the bias term <M>{"\\|\\beta_P\\|^2(1 - n/p)"}</M>: the interpolant only sees β through n
          random projections.
        </p>
      </Remark>

      <Theorem title="ridge removes the peak">
        <p>
          For the same model with all features used (<M>{"\\beta_{P^c} = 0"}</M>), ridge regression with the optimal λ has a test
          risk, averaged over a Gaussian prior on β, that is non-increasing in n and has no singularity at p = n.
        </p>
      </Theorem>
      <Proof>
        <p>
          With a Gaussian prior <M>{"\\beta \\sim N(0, (r^2/p) I)"}</M>, the posterior mean is ridge with{" "}
          <M>{"\\lambda = \\sigma^2 p / (n r^2)"}</M> in the scaling of m16.5.3, and it minimises the Bayes risk among all estimators. One
          more example can only add information, so the Bayes risk cannot increase, and at p = n it is at most the risk of
          predicting zero, <M>{"r^2 + \\sigma^2"}</M>. The peak is therefore an artefact of insisting on interpolation with no
          regularisation, not a law of learning.
        </p>
        <Code>{MINNORM}</Code>
      </Proof>

      <Remark title="what this means for capacity">
        <p>
          The VC bound of m16.2.3 counts parameters and so predicts only the first, U-shaped half of the curve. Beyond the
          threshold, what controls the error of the minimum-norm interpolant is its norm, which falls as p grows. The same
          shape appears for random features (m16.5.4) as D crosses m, and in deep networks as width, training time or sample
          size varies (Nakkiran and coauthors). When interpolation is harmless at all, as in m15.5.3, the next lesson makes
          precise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "under",
      rung: "check",
      prompt: <p>With n = 50, p = 10, ‖β_out‖² = 0.2 and σ² = 1, what is the expected test risk of least squares? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.5077, tolerance: 0.0001 },
    },
    {
      key: "over",
      rung: "check",
      prompt: <p>With n = 50 and p = 100 features that include all the signal, ‖β‖² = 1 and σ² = 1, what is the expected test risk of the minimum-norm interpolant? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.5204, tolerance: 0.0001 },
    },
    {
      key: "peak",
      rung: "apply",
      prompt: <p>What causes the test risk of minimum-norm least squares to blow up when p ≈ n?</p>,
      answer: {
        kind: "choice",
        options: [
          "The smallest singular value of the design is near zero, so fitting the noise needs a huge coefficient in that direction",
          "The model has too few parameters to represent the target",
          "The training error becomes very large",
          "Gradient descent fails to converge at p = n",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def risk_under(n, p, signal_out, sigma2):
    return (signal_out + sigma2) * (1 + p / (n - p - 1))

def risk_over(n, p, signal_in, signal_out, sigma2):
    return signal_in * (1 - n / p) + (signal_out + sigma2) * (1 + n / (p - n - 1))

def risk_curve(n, beta_sq, sigma2):
    total, inside, out = sum(beta_sq), 0.0, []
    for p in range(1, len(beta_sq) + 1):
        inside += beta_sq[p - 1]
        if p < n - 1:
            out.append(risk_under(n, p, total - inside, sigma2))
        elif p > n + 1:
            out.append(risk_over(n, p, inside, total - inside, sigma2))
        else:
            out.append(None)
    return out

print(risk_under(10, 4, 0.5, 0.5), round(risk_over(10, 20, 0.5, 0.0, 0.5), 4), round(risk_over(10, 12, 1.0, 0.0, 0.0), 4))
print([None if v is None else round(v, 3) for v in risk_curve(4, [0.5, 0.25, 0.25, 0.0, 0.0, 0.0], 1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.8 1.3056 0.1667\n[2.25, 3.75, None, None, None, 5.333]",
          "1.8 1.3056 0.1667\n[2.25, 3.75, 5.0, None, None, 5.333]",
          "1.4 1.3056 0.1667\n[2.25, 3.75, None, None, None, 5.333]",
          "1.8 1.0556 0.8333\n[1.5, 2.5, None, None, None, 5.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
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

def min_norm_ls(X, y):
    n, p = len(X), len(X[0])
    if p <= n:
        A = [[sum(r[i] * r[j] for r in X) for j in range(p)] for i in range(p)]
        return solve(A, [sum(r[i] * v for r, v in zip(X, y)) for i in range(p)])
    a = solve([[sum(u * v for u, v in zip(r, s)) for s in X] for r in X], y)
    return [sum(r[j] * c for r, c in zip(X, a)) for j in range(p)]

def train_mse(X, y, w):
    return sum((sum(a * b for a, b in zip(r, w)) - v) ** 2 for r, v in zip(X, y)) / len(y)

print(min_norm_ls([[1.0, 1.0]], [2.0]), min_norm_ls([[1.0], [1.0]], [1.0, 3.0]), min_norm_ls([[2.0, 0.0], [0.0, 4.0]], [1.0, 1.0]))
print(train_mse([[1.0], [1.0]], [1.0, 3.0], [2.0]), train_mse([[1.0, 2.0]], [5.0], min_norm_ls([[1.0, 2.0]], [5.0])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0] [2.0] [0.5, 0.25]\n1.0 0.0",
          "[2.0, 0.0] [2.0] [0.5, 0.25]\n1.0 0.0",
          "[1.0, 1.0] [2.0] [2.0, 4.0]\n1.0 0.0",
          "[1.0, 1.0] [1.0] [0.5, 0.25]\n2.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>risk_under(n, p, signal_out, sigma2)</C>, <C>risk_over(n, p, signal_in, signal_out, sigma2)</C> and{" "}
          <C>risk_curve(n, beta_sq, sigma2)</C>, which returns the risk for p = 1, …, len(beta_sq), using the first p squared
          coefficients as the signal inside the model and None for n − 1 ≤ p ≤ n + 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def risk_under(n, p, signal_out, sigma2):
    return signal_out + sigma2

def risk_over(n, p, signal_in, signal_out, sigma2):
    return signal_out + sigma2

def risk_curve(n, beta_sq, sigma2):
    return [sigma2 for _ in beta_sq]
`,
        solution: RISK,
        tests: [
          { name: "formulas", code: `assert abs(risk_under(20, 9, 1.0, 1.0) - 3.8) < 1e-12 and abs(risk_over(20, 40, 2.0, 0.5, 0.5) - (1.0 + 1.0 * (1 + 20 / 19))) < 1e-12` },
          { name: "curve", code: `c = risk_curve(3, [0.5, 0.5, 0.0, 0.0, 0.0, 0.0], 0.0)
assert c[1:4] == [None, None, None] and abs(c[0] - 1.0) < 1e-12 and abs(c[4] - 0.4) < 1e-12 and abs(c[5] - 0.5) < 1e-12 and len(c) == 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve(A, b)</C> by Gaussian elimination with partial pivoting, <C>min_norm_ls(X, y)</C> using the normal
          equations when p ≤ n and <M>{"X^\\top(XX^\\top)^{-1}y"}</M> otherwise, and <C>train_mse(X, y, w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def solve(A, b):
    return [0.0] * len(b)

def min_norm_ls(X, y):
    return [0.0] * len(X[0])

def train_mse(X, y, w):
    return 0.0
`,
        solution: MINNORM,
        tests: [
          { name: "least squares", code: `w = min_norm_ls([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], [1.0, 2.0, 4.0])
assert all(abs(a - b) < 1e-12 for a, b in zip(w, [4 / 3, 7 / 3])) and abs(train_mse([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]], [1.0, 2.0, 4.0], w) - 1 / 9) < 1e-12` },
          { name: "minimum norm", code: `v = min_norm_ls([[1.0, 2.0, 2.0]], [9.0]); u = min_norm_ls([[1.0, 0.0, 1.0], [0.0, 1.0, 0.0]], [2.0, 3.0])
assert all(abs(a - b) < 1e-12 for a, b in zip(v, [1.0, 2.0, 2.0])) and all(abs(a - b) < 1e-12 for a, b in zip(u, [1.0, 3.0, 1.0])) and train_mse([[1.0, 0.0, 1.0], [0.0, 1.0, 0.0]], [2.0, 3.0], u) < 1e-20` },
        ],
      },
    },
    {
      key: "spread",
      rung: "stretch",
      prompt: (
        <p>
          Take n = 20 examples, D = 100 features with every <M>{"\\beta_j^2 = 0.01"}</M>, and σ² = 0.25. Over all p from 1 to 100
          (excluding 19, 20 and 21), what is the smallest expected test risk of minimum-norm least squares on the first p
          features? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.113, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The second descent depended on the noise being spread out. The next lesson asks exactly when fitting noisy labels
        perfectly still gives near-optimal predictions, and finds the answer in the spectrum of the data.
      </p>
    </>
  ),
};
