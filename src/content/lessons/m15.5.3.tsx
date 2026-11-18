import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BenignOverfitViz } from "@/components/viz/BenignOverfitViz";
import type { LessonContent } from "@/lib/types";

const RISK = `import math

def iso_risk(n, p, sigma2, b2):
    if p < n - 1:
        return sigma2 * p / (n - p - 1)
    if p > n + 1:
        return b2 * (1 - n / p) + sigma2 * n / (p - n - 1)
    return math.inf

def effective_ranks(lams, k):
    tail = lams[k:]
    return sum(tail) / tail[0], sum(tail) ** 2 / sum(x * x for x in tail)

def k_star(lams, n, b=1.0):
    for k in range(len(lams)):
        if effective_ranks(lams, k)[0] >= b * n:
            return k
    return None`;

const MINNORM = `import math

def solve(A, b):
    n = len(A)
    M = [row[:] + [v] for row, v in zip(A, b)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [a - f * e for a, e in zip(M[r], M[c])]
    x = [0.0] * n
    for c in range(n - 1, -1, -1):
        x[c] = (M[c][n] - sum(M[c][k] * x[k] for k in range(c + 1, n))) / M[c][c]
    return x

def min_norm(X, y):
    G = [[sum(a * b for a, b in zip(r, s)) for s in X] for r in X]
    alpha = solve(G, y)
    return [sum(alpha[i] * X[i][j] for i in range(len(X))) for j in range(len(X[0]))]

def max_residual(X, y, theta):
    return max(abs(yi - sum(a * t for a, t in zip(row, theta))) for row, yi in zip(X, y))`;

export const lesson: LessonContent = {
  id: "m15.5.3",
  minutes: 60,
  links: {
    requires: ["m15.5.2", "m15.3.3"],
    revisits: ["l1.1.3", "l1.2.1"],
    foreshadows: ["m16.7.1", "l10.6.3"],
  },

  puzzle: (
    <>
      <p>
        The classical advice (l1.1.3) is that a model which fits noisy training data exactly has overfitted and will
        predict badly. Large neural networks routinely reach zero training error on noisy labels and still predict well.
        Even plain linear regression with more features than samples can do it. When does fitting the noise exactly do no
        harm, and where does the noise go?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With more features than samples there are infinitely many exact fits, and the natural one is the fit of smallest
        norm. It has to put the noise somewhere. If there are a great many weak features, it can spread each noisy label
        over all of them, a little in each, so the noise ends up as a large number of tiny coefficients that hardly affect a
        new prediction. Meanwhile a few strong features carry the signal and are fitted much as they would be without the
        extra features. Overfitting is benign when the data have both.
      </p>
      <BenignOverfitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="minimum-norm interpolation">
        <p>
          Let X be n × p with n &lt; p and rank n, and <M>{"y = X\\theta^* + \\varepsilon"}</M> with noise of variance{" "}
          <M>{"\\sigma^2"}</M>. Among all θ with <M>{"X\\theta = y"}</M>, the one of smallest Euclidean norm is{" "}
          <M>{"\\hat\\theta = X^\\top(XX^\\top)^{-1}y"}</M>. It is the limit of ridge regression as the penalty tends to 0, and the
          point gradient descent on the squared loss converges to from θ = 0. Its <em>excess risk</em> on a new x with covariance
          Σ is <M>{"\\mathbb{E}_x\\langle x, \\hat\\theta - \\theta^*\\rangle^2 = (\\hat\\theta - \\theta^*)^\\top\\Sigma(\\hat\\theta - \\theta^*)"}</M>.
        </p>
      </Definition>

      <Theorem title="the minimum-norm interpolator">
        <p>
          <M>{"\\hat\\theta"}</M> interpolates, and every other interpolator is <M>{"\\hat\\theta + v"}</M> with{" "}
          <M>{"Xv = 0"}</M> and <M>{"\\|\\hat\\theta + v\\|^2 = \\|\\hat\\theta\\|^2 + \\|v\\|^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"X\\hat\\theta = XX^\\top(XX^\\top)^{-1}y = y"}</M>. Two interpolators differ by a v with Xv = 0. Since{" "}
          <M>{"\\hat\\theta = X^\\top\\alpha"}</M> lies in the row space,{" "}
          <M>{"\\langle\\hat\\theta, v\\rangle = \\langle\\alpha, Xv\\rangle = 0"}</M>, and Pythagoras gives the rest. Gradient descent from
          0 moves only along gradients <M>{"X^\\top(X\\theta - y)"}</M>, which lie in the row space, so it stays there and ends at{" "}
          <M>{"\\hat\\theta"}</M>. <C>min_norm</C> computes it by solving <M>{"XX^\\top\\alpha = y"}</M>.
        </p>
        <Code>{MINNORM}</Code>
      </Proof>

      <Theorem title="double descent for isotropic features">
        <p>
          Let the rows of X be independent <M>{"N(0, I_p)"}</M> and <M>{"\\theta^*"}</M> have a uniformly random direction with{" "}
          <M>{"\\|\\theta^*\\|^2 = b^2"}</M>. The expected excess risk of least squares for <M>{"p < n - 1"}</M>, and of the
          minimum-norm interpolator for <M>{"p > n + 1"}</M>, is
        </p>
        <MD>{"\\frac{\\sigma^2p}{n - p - 1} \\quad\\text{and}\\quad b^2\\Bigl(1 - \\frac np\\Bigr) + \\frac{\\sigma^2n}{p - n - 1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          For <M>{"p < n"}</M>, least squares is unbiased and its error is <M>{"(X^\\top X)^{-1}X^\\top\\varepsilon"}</M>, whose expected
          squared norm is <M>{"\\sigma^2\\,\\mathbb{E}\\,\\mathrm{tr}(X^\\top X)^{-1}"}</M>. For p &gt; n,{" "}
          <M>{"\\hat\\theta - \\theta^* = -(I - P)\\theta^* + X^\\top(XX^\\top)^{-1}\\varepsilon"}</M>, where P projects onto the row space;
          the two parts are orthogonal. The row space is a uniformly random n-dimensional subspace, so the bias part has expected
          squared norm <M>{"b^2(1 - n/p)"}</M>, and the noise part has <M>{"\\sigma^2\\,\\mathbb{E}\\,\\mathrm{tr}(XX^\\top)^{-1}"}</M>. Both traces
          are means of inverse Wishart matrices: <M>{"\\mathbb{E}(W^{-1}) = I/(m - k - 1)"}</M> for a k × k Wishart matrix with m degrees
          of freedom, giving <M>{"p/(n - p - 1)"}</M> and <M>{"n/(p - n - 1)"}</M>. <C>iso_risk</C> evaluates the formula.
        </p>
      </Proof>

      <Remark title="reading the curve">
        <p>
          The variance blows up at p = n, where <M>{"XX^\\top"}</M> becomes singular: its smallest eigenvalue is at the lower
          Marchenko-Pastur edge <M>{"(1 - \\sqrt{n/p})^2"}</M>, which reaches 0 (m15.3.3). Past it the variance falls again, like{" "}
          <M>{"\\sigma^2n/p"}</M>, which is the second descent. But for isotropic features the bias rises towards all of{" "}
          <M>{"b^2"}</M>: n samples can only learn the part of <M>{"\\theta^*"}</M> in an n-dimensional random subspace. The noise
          is harmless, but the fit has forgotten the signal.
        </p>
      </Remark>

      <Definition title="effective ranks">
        <p>
          For a covariance with eigenvalues <M>{"\\lambda_1 \\ge \\lambda_2 \\ge \\dots"}</M>, the effective ranks of its tail after k
          are{" "}
          <M>{"r_k = \\frac{\\sum_{i>k}\\lambda_i}{\\lambda_{k+1}}"}</M> and{" "}
          <M>{"R_k = \\frac{(\\sum_{i>k}\\lambda_i)^2}{\\sum_{i>k}\\lambda_i^2}"}</M> (<C>effective_ranks</C>). Both equal the number of
          tail eigenvalues when they are all equal, and are small when one dominates. Let{" "}
          <M>{"k^* = \\min\\{k : r_k \\ge bn\\}"}</M> for a constant b (<C>k_star</C>).
        </p>
        <Code>{RISK}</Code>
      </Definition>

      <Theorem title="benign overfitting">
        <p>
          (Bartlett, Long, Lugosi and Tsigler, 2020.) For Gaussian features with covariance Σ, the noise contribution to the
          excess risk of the minimum-norm interpolator is, with high probability and up to constants,
        </p>
        <MD>{"\\sigma^2\\Bigl(\\frac{k^*}{n} + \\frac{n}{R_{k^*}}\\Bigr)."}</MD>
        <p>
          Overfitting is benign, the risk tending to 0, when <M>{"k^*/n \\to 0"}</M> and <M>{"n/R_{k^*} \\to 0"}</M>, and the bias
          is controlled when <M>{"\\theta^*"}</M> lies mostly in the top <M>{"k^*"}</M> directions.
        </p>
      </Theorem>
      <Remark title="where the noise goes">
        <p>
          The first <M>{"k^*"}</M> directions are learnt as ordinary regression would learn them, at a variance cost of{" "}
          <M>{"\\sigma^2k^*/n"}</M>. The tail is so large and flat that its sample covariance is nearly a multiple of the identity:
          it acts like a ridge penalty of size <M>{"\\sum_{i>k^*}\\lambda_i/n"}</M> on the head, and the noise is spread across{" "}
          <M>{"R_{k^*}"}</M> effective directions, so its effect on a new prediction is of order <M>{"n/R_{k^*}"}</M>. In the picture,
          5 strong features carry the signal and 795 weak features with total variance 2 absorb the noise: the interpolator fits
          all 40 noisy labels and has excess risk about 0.1. Benign overfitting therefore needs many more dimensions than
          samples and a covariance spectrum that decays, but not too fast: two conditions that the spectra of real data and
          of the features of wide networks often satisfy (m16.7.1).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ls",
      rung: "check",
      prompt: <p>What is the expected excess risk of least squares with n = 100 samples, p = 50 isotropic features and noise variance 1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.0204, tolerance: 0.00006 },
    },
    {
      key: "interp",
      rung: "check",
      prompt: <p>What is the expected excess risk of the minimum-norm interpolator with n = 100, p = 400 isotropic features, noise variance 1 and <M>{"b^2 = 1"}</M>? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.0844, tolerance: 0.00006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>With isotropic features and p much larger than n, the interpolator&apos;s noise term is small, yet its risk approaches <M>{"b^2"}</M>. Why?</p>,
      answer: {
        kind: "choice",
        options: [
          "The estimate lies in the n-dimensional row space, which captures only a fraction n/p of a signal with a random direction",
          "The noise is amplified by the singular matrix XXᵀ",
          "Minimum-norm interpolation is biased towards large coefficients",
          "The training error is not exactly zero",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def iso_risk(n, p, sigma2, b2):
    if p < n - 1:
        return sigma2 * p / (n - p - 1)
    if p > n + 1:
        return b2 * (1 - n / p) + sigma2 * n / (p - n - 1)
    return math.inf

def effective_ranks(lams, k):
    tail = lams[k:]
    return sum(tail) / tail[0], sum(tail) ** 2 / sum(x * x for x in tail)

def k_star(lams, n, b=1.0):
    for k in range(len(lams)):
        if effective_ranks(lams, k)[0] >= b * n:
            return k
    return None

print(iso_risk(10, 4, 1, 1), iso_risk(10, 10, 1, 1), round(iso_risk(10, 21, 1, 1), 4), round(iso_risk(10, 40, 1, 1), 4))
print([round(v, 4) for v in effective_ranks([4, 2, 1, 1], 0)], [round(v, 4) for v in effective_ranks([4, 2, 1, 1], 1)], k_star([4, 2, 1, 1], 1), k_star([5, 1], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 inf 1.5238 1.0948\n[2.0, 2.9091] [2.0, 2.6667] 0 None",
          "0.8 inf 1.5238 1.0948\n[2.0, 2.9091] [2.0, 2.6667] 1 None",
          "0.8 inf 0.5238 1.0948\n[2.0, 2.9091] [2.0, 2.6667] 0 None",
          "0.8 inf 1.5238 1.0948\n[2.0, 2.9091] [1.0, 2.6667] 0 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def solve(A, b):
    n = len(A)
    M = [row[:] + [v] for row, v in zip(A, b)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        M[c], M[p] = M[p], M[c]
        for r in range(c + 1, n):
            f = M[r][c] / M[c][c]
            M[r] = [a - f * e for a, e in zip(M[r], M[c])]
    x = [0.0] * n
    for c in range(n - 1, -1, -1):
        x[c] = (M[c][n] - sum(M[c][k] * x[k] for k in range(c + 1, n))) / M[c][c]
    return x

def min_norm(X, y):
    G = [[sum(a * b for a, b in zip(r, s)) for s in X] for r in X]
    alpha = solve(G, y)
    return [sum(alpha[i] * X[i][j] for i in range(len(X))) for j in range(len(X[0]))]

def max_residual(X, y, theta):
    return max(abs(yi - sum(a * t for a, t in zip(row, theta))) for row, yi in zip(X, y))

print(solve([[2, 1], [1, 3]], [3, 5]), min_norm([[1, 1]], [2]), [round(v, 4) for v in min_norm([[3, 4]], [5])])
X = [[1, 0, 2], [0, 1, 1]]; t = min_norm(X, [1, 3]); print(round(max_residual(X, [1, 3], t), 10), round(sum(v * v for v in t), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8, 1.4] [1.0, 1.0] [0.6, 0.8]\n0.0 5.8333",
          "[0.8, 1.4] [2.0, 0.0] [0.6, 0.8]\n0.0 5.8333",
          "[1.4, 0.8] [1.0, 1.0] [0.6, 0.8]\n0.0 5.8333",
          "[0.8, 1.4] [1.0, 1.0] [1.6667, 0.0]\n0.0 5.8333",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iso_risk(n, p, sigma2, b2)</C>, the double-descent formula, returning <C>math.inf</C> when{" "}
          <M>{"n - 1 \\le p \\le n + 1"}</M>; <C>effective_ranks(lams, k)</C>, the pair <M>{"(r_k, R_k)"}</M> for eigenvalues sorted in
          decreasing order; and <C>k_star(lams, n, b=1.0)</C>, the smallest k with <M>{"r_k \\ge bn"}</M>, or None.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def iso_risk(n, p, sigma2, b2):
    return 0.0

def effective_ranks(lams, k):
    return (0.0, 0.0)

def k_star(lams, n, b=1.0):
    return None
`,
        solution: RISK,
        tests: [
          { name: "risk", code: `import math
assert iso_risk(10, 4, 1, 1) == 0.8 and iso_risk(10, 10, 1, 1) == math.inf and iso_risk(10, 9, 1, 1) == math.inf and iso_risk(10, 11, 1, 1) == math.inf
assert abs(iso_risk(100, 50, 1, 1) - 50 / 49) < 1e-15 and abs(iso_risk(100, 400, 1, 1) - (0.75 + 100 / 299)) < 1e-15 and abs(iso_risk(10, 21, 2, 0) - 2) < 1e-15` },
          { name: "ranks", code: `assert effective_ranks([1, 1, 1, 1], 0) == (4, 4) and effective_ranks([4, 2, 1, 1], 1) == (2, 16 / 6) and effective_ranks([3, 1], 1) == (1, 1)
lams = [1.0] * 5 + [0.01] * 1000
assert k_star(lams, 40) == 5 and k_star(lams, 2) == 0 and k_star([4, 2, 1, 1], 1) == 0 and k_star([5, 1], 3) is None and k_star([8, 1, 1, 1, 1], 3) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>solve(A, b)</C>, Gaussian elimination with partial pivoting for a square system;{" "}
          <C>min_norm(X, y)</C>, the minimum-norm interpolator for an n × p list of rows with n ≤ p and full row rank; and{" "}
          <C>max_residual(X, y, theta)</C>, the largest <M>{"|y_i - \\langle x_i, \\theta\\rangle|"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def solve(A, b):
    return [0.0] * len(b)

def min_norm(X, y):
    return [0.0] * len(X[0])

def max_residual(X, y, theta):
    return 0.0
`,
        solution: MINNORM,
        tests: [
          { name: "solve", code: `assert solve([[2, 1], [1, 3]], [3, 5]) == [0.8, 1.4] and solve([[0, 1], [1, 0]], [2, 3]) == [3, 2]
A = [[1, 2, 0], [3, 1, 1], [0, 2, 5]]; x = solve(A, [5, 6, 13]); assert all(abs(sum(a * b for a, b in zip(row, x)) - c) < 1e-12 for row, c in zip(A, [5, 6, 13]))
assert A == [[1, 2, 0], [3, 1, 1], [0, 2, 5]]
assert max_residual([[1, 0], [0, 1]], [1, 2], [1, 1]) == 1 and max_residual([[2, 1]], [5], [2, 1]) == 0` },
          { name: "minnorm", code: `import math, random
assert min_norm([[1, 1]], [2]) == [1.0, 1.0] and all(abs(a - b) < 1e-12 for a, b in zip(min_norm([[3, 4]], [5]), [0.6, 0.8]))
r = random.Random(0); X = [[r.gauss(0, 1) for _ in range(12)] for _ in range(5)]; y = [r.gauss(0, 1) for _ in range(5)]
t = min_norm(X, y); assert max_residual(X, y, t) < 1e-10
v = [r.gauss(0, 1) for _ in range(12)]; G = [[sum(a * b for a, b in zip(p, q)) for q in X] for p in X]
c = solve(G, [sum(a * b for a, b in zip(row, v)) for row in X]); w = [vj - sum(c[i] * X[i][j] for i in range(5)) for j, vj in enumerate(v)]
assert max_residual(X, y, [a + b for a, b in zip(t, w)]) < 1e-9 and sum(a * a for a in t) < sum((a + b) ** 2 for a, b in zip(t, w))` },
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: (
        <p>
          With n = 100, noise variance 1 and <M>{"b^2 = 4"}</M>, which number of isotropic features p &gt; n + 1 minimises the
          expected excess risk of the minimum-norm interpolator?
        </p>
      ),
      answer: { kind: "numeric", value: 202, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the course. Concentration of sums led to the geometry of high dimensions, to random matrices, to
        suprema of random processes, and finally to estimators that work with more parameters than data. Double descent
        and benign overfitting return in the study of deep learning theory (m16.7.1) and of how large models memorise and
        generalise (l10.6.3).
      </p>
    </>
  ),
};
