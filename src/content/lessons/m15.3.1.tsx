import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SampleSpectrumViz } from "@/components/viz/SampleSpectrumViz";
import type { LessonContent } from "@/lib/types";

const COV = `import math

def sample_cov(X):
    n, d = len(X), len(X[0])
    return [[sum(x[i] * x[j] for x in X) / n for j in range(d)] for i in range(d)]

def quad_form(M, u):
    return sum(u[i] * M[i][j] * u[j] for i in range(len(u)) for j in range(len(u)))

def frob_rms(d, n):
    return math.sqrt(d * (d + 1) / n)`;

const SPEC = `import math

def op_norm(M, iters=200):
    v = [1.0 / (i + 1) for i in range(len(M))]
    lam = 0.0
    for _ in range(iters):
        w = [sum(a * b for a, b in zip(row, v)) for row in M]
        lam = math.sqrt(sum(x * x for x in w))
        if lam == 0:
            return 0.0
        v = [x / lam for x in w]
    return lam

def edge_prediction(d, n):
    r = math.sqrt(d / n)
    return (max(0.0, 1 - r) ** 2, (1 + r) ** 2)

def shrink(S, alpha):
    d = len(S)
    mu = sum(S[i][i] for i in range(d)) / d
    return [[(1 - alpha) * S[i][j] + (alpha * mu if i == j else 0.0) for j in range(d)] for i in range(d)]`;

export const lesson: LessonContent = {
  id: "m15.3.1",
  minutes: 55,
  links: {
    requires: ["m15.2.4", "m7.5.3"],
    revisits: ["m15.1.1"],
    foreshadows: ["m15.3.3", "m15.4.1"],
  },

  puzzle: (
    <>
      <p>
        You have 160 samples of a 40-dimensional vector whose true covariance is the identity. Each entry of the sample
        covariance is an average of 160 terms, accurate to about 0.08. Yet the largest eigenvalue of the sample covariance is
        about 2 and the smallest about 0.26, when both should be 1. How can every entry be nearly right while the matrix
        is so wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An eigenvalue is the variance along the worst direction, and the worst direction is chosen after seeing the data.
        For any one direction fixed in advance, the estimated variance is an average of n terms and is accurate. But there
        are exponentially many essentially different directions in d dimensions, and the data always find some along which
        the sample variance is inflated. The cure is more samples: about d of them, times <M>{"1/\\varepsilon^2"}</M>.
      </p>
      <SampleSpectrumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sample covariance">
        <p>
          For independent mean-zero vectors <M>{"x_1, \\dots, x_n"}</M> in <M>{"\\mathbb{R}^d"}</M> with covariance Σ (m7.5.3), the{" "}
          <em>sample covariance</em> is <M>{"\\hat\\Sigma = \\tfrac1n\\sum_k x_kx_k^\\top"}</M>, which is unbiased:{" "}
          <M>{"\\mathbb{E}\\hat\\Sigma = \\Sigma"}</M>. The estimated variance along a unit vector u is the quadratic form{" "}
          <M>{"u^\\top\\hat\\Sigma u = \\tfrac1n\\sum_k\\langle x_k, u\\rangle^2"}</M>. Accuracy of the whole matrix is measured in
          operator norm, <M>{"\\|\\hat\\Sigma - \\Sigma\\| = \\max_{\\|u\\| = 1}|u^\\top(\\hat\\Sigma - \\Sigma)u|"}</M>, the worst
          error over all directions.
        </p>
        <Code>{COV}</Code>
      </Definition>

      <Theorem title="one direction at a time">
        <p>
          If the <M>{"x_k"}</M> are <M>{"N(0, \\Sigma)"}</M> and u is a fixed unit vector with{" "}
          <M>{"\\sigma_u^2 = u^\\top\\Sigma u > 0"}</M>, then for <M>{"0 < \\varepsilon \\le 1"}</M>,{" "}
          <M>{"P(|u^\\top\\hat\\Sigma u/\\sigma_u^2 - 1| \\ge \\varepsilon) \\le 2e^{-n\\varepsilon^2/8}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The numbers <M>{"\\langle x_k, u\\rangle/\\sigma_u"}</M> are independent standard Gaussians, so{" "}
          <M>{"n\\,u^\\top\\hat\\Sigma u/\\sigma_u^2"}</M> is a chi-square variable with n degrees of freedom. The proof of the
          distributional Johnson–Lindenstrauss bound (m15.2.4) applies word for word with n in place of k.
        </p>
      </Proof>

      <Theorem title="entrywise accuracy is not enough">
        <p>
          If the <M>{"x_k"}</M> are <M>{"N(0, I_d)"}</M>, then <M>{"\\mathbb{E}\\|\\hat\\Sigma - I\\|_F^2 = d(d + 1)/n"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The squared Frobenius norm is the sum of the squared entry errors, and each entry is an average of n independent
          copies of <M>{"x_ix_j"}</M>, so its mean squared error is <M>{"\\mathrm{Var}(x_ix_j)/n"}</M>. For i = j the variance
          is <M>{"\\mathbb{E}x_i^4 - 1 = 2"}</M>; for i ≠ j it is <M>{"\\mathbb{E}x_i^2\\mathbb{E}x_j^2 = 1"}</M>. Summing,{" "}
          <M>{"(2d + d(d - 1))/n = d(d + 1)/n"}</M>.
        </p>
      </Proof>

      <Remark title="what this says">
        <p>
          Each entry has error about <M>{"1/\\sqrt n"}</M>, but there are <M>{"d^2"}</M> of them, and since the operator norm is at
          most the Frobenius norm this only guarantees accuracy once n is much larger than <M>{"d^2"}</M>. <C>frob_rms</C>{" "}
          gives the root-mean-square Frobenius error: about 1 for d = 100 and n = 10,000. The truth for the operator norm
          lies between the two theorems.
        </p>
      </Remark>

      <Theorem title="covariance estimation">
        <p>
          There is an absolute constant C such that, for independent <M>{"N(0, \\Sigma)"}</M> vectors (and more generally
          sub-Gaussian ones) and every <M>{"t \\ge 0"}</M>, with probability at least <M>{"1 - 2e^{-t^2}"}</M>,
        </p>
        <MD>{"\\|\\hat\\Sigma - \\Sigma\\| \\le C\\|\\Sigma\\|\\Bigl(\\sqrt{\\frac{d + t^2}{n}} + \\frac{d + t^2}{n}\\Bigr)."}</MD>
        <p>So <M>{"n \\approx Cd/\\varepsilon^2"}</M> samples give relative error ε in operator norm.</p>
      </Theorem>
      <Proof>
        <p>
          (Sketch; the full argument is in m15.4.1.) Replace the maximum over all unit u by a maximum over a finite set N of
          unit vectors such that every unit vector is within 1/4 of one of them; such an <em>ε-net</em> exists with{" "}
          <M>{"|N| \\le 9^d"}</M>, and the maximum over N is at least half the maximum over the sphere. The one-direction bound
          and a union bound over the <M>{"9^d"}</M> points then need <M>{"n\\varepsilon^2/8 \\gtrsim d\\log 9"}</M>: the log of
          the number of directions is proportional to d, and that is where the d in the sample size comes from.
        </p>
      </Proof>

      <Example title="the spectrum spreads">
        <p>
          The theorem&apos;s √(d/n) is sharp. For Gaussian data with Σ = I and d/n fixed, the extreme eigenvalues of{" "}
          <M>{"\\hat\\Sigma"}</M> converge to <M>{"(1 \\pm \\sqrt{d/n})^2"}</M>, computed by <C>edge_prediction</C>; the picture
          above matches this, and m15.3.3 derives the whole distribution of eigenvalues between the edges. <C>op_norm</C>{" "}
          estimates the operator norm of a symmetric matrix by power iteration. With d = 100 and n = 400 the eigenvalues of{" "}
          <M>{"\\hat\\Sigma"}</M> spread from 0.25 to 2.25, so <M>{"\\hat\\Sigma^{-1}"}</M>, used in Gaussian classifiers and
          portfolio weights, amplifies some directions by a factor of 4 that should not be amplified at all.
        </p>
        <Code>{SPEC}</Code>
      </Example>

      <Remark title="shrinkage">
        <p>
          Since the sample eigenvalues are too spread out, pull them back together. <C>shrink</C> forms{" "}
          <M>{"(1 - \\alpha)\\hat\\Sigma + \\alpha\\mu I"}</M>, where μ is the average eigenvalue (the trace over d): it keeps the
          eigenvectors, moves every eigenvalue a fraction α of the way to μ, and is always well conditioned for{" "}
          <M>{"\\alpha > 0"}</M>. Ledoit and Wolf showed how to choose α from the data to minimise the expected Frobenius error;
          it is the default covariance estimator in many statistics libraries when d is not small compared with n.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dir",
      rung: "check",
      prompt: <p>With 2000 Gaussian samples, bound the probability that the estimated variance along a fixed direction is off by 10% or more. Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1642, tolerance: 0.00006 },
    },
    {
      key: "frob",
      rung: "check",
      prompt: <p>What is the root-mean-square Frobenius error of the sample covariance of 1000 standard Gaussian vectors in 50 dimensions? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.5969, tolerance: 0.00006 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why can the operator-norm error of the sample covariance be large even when each fixed direction is estimated well?</p>,
      answer: {
        kind: "choice",
        options: [
          "The worst direction is chosen after seeing the data, and there are exponentially many directions in d dimensions to choose from",
          "The sample covariance is biased",
          "The operator norm counts every entry's error twice",
          "Quadratic forms are not linear in the data",
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

def sample_cov(X):
    n, d = len(X), len(X[0])
    return [[sum(x[i] * x[j] for x in X) / n for j in range(d)] for i in range(d)]

def quad_form(M, u):
    return sum(u[i] * M[i][j] * u[j] for i in range(len(u)) for j in range(len(u)))

def frob_rms(d, n):
    return math.sqrt(d * (d + 1) / n)

X = [[1, 2], [-1, 0], [3, -2], [1, 0]]; print(sample_cov(X), quad_form(sample_cov(X), [1, 1]))
print(quad_form([[2, 1], [1, 3]], [1, -1]), frob_rms(3, 12), round(frob_rms(100, 10000), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[3.0, -1.0], [-1.0, 2.0]] 3.0\n3 1.0 1.005",
          "[[3.0, -1.0], [-1.0, 2.0]] 5.0\n3 1.0 1.005",
          "[[2.0, -1.0], [-1.0, 2.0]] 2.0\n3 1.0 1.005",
          "[[3.0, -1.0], [-1.0, 2.0]] 3.0\n7 1.0 1.005",
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

def op_norm(M, iters=200):
    v = [1.0 / (i + 1) for i in range(len(M))]
    lam = 0.0
    for _ in range(iters):
        w = [sum(a * b for a, b in zip(row, v)) for row in M]
        lam = math.sqrt(sum(x * x for x in w))
        if lam == 0:
            return 0.0
        v = [x / lam for x in w]
    return lam

def edge_prediction(d, n):
    r = math.sqrt(d / n)
    return (max(0.0, 1 - r) ** 2, (1 + r) ** 2)

def shrink(S, alpha):
    d = len(S)
    mu = sum(S[i][i] for i in range(d)) / d
    return [[(1 - alpha) * S[i][j] + (alpha * mu if i == j else 0.0) for j in range(d)] for i in range(d)]

print(round(op_norm([[2, 0], [0, -5]]), 4), op_norm([[0, 0], [0, 0]]), edge_prediction(25, 100), edge_prediction(4, 1))
print(shrink([[3, 1], [1, 1]], 0.5), shrink([[4, 2], [2, 0]], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 0.0 (0.25, 2.25) (0.0, 9.0)\n[[2.5, 0.5], [0.5, 1.5]] [[2.0, 0.0], [0.0, 2.0]]",
          "2.0 0.0 (0.25, 2.25) (0.0, 9.0)\n[[2.5, 0.5], [0.5, 1.5]] [[2.0, 0.0], [0.0, 2.0]]",
          "5.0 0.0 (0.25, 2.25) (1.0, 9.0)\n[[2.5, 0.5], [0.5, 1.5]] [[2.0, 0.0], [0.0, 2.0]]",
          "5.0 0.0 (0.25, 2.25) (0.0, 9.0)\n[[2.5, 1.0], [1.0, 1.5]] [[2.0, 0.0], [0.0, 2.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_cov(X)</C>, the matrix <M>{"\\tfrac1n\\sum_k x_kx_k^\\top"}</M> for a list of n mean-zero samples, as a
          list of rows; <C>quad_form(M, u)</C>, <M>{"u^\\top Mu"}</M>; and <C>frob_rms(d, n)</C>, the root-mean-square Frobenius
          error <M>{"\\sqrt{d(d + 1)/n}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def sample_cov(X):
    return []

def quad_form(M, u):
    return 0.0

def frob_rms(d, n):
    return 0.0
`,
        solution: COV,
        tests: [
          { name: "cov", code: `assert sample_cov([[1, 2], [-1, 0], [3, -2], [1, 0]]) == [[3.0, -1.0], [-1.0, 2.0]] and sample_cov([[2, 0, 1]]) == [[4, 0, 2], [0, 0, 0], [2, 0, 1]]
assert quad_form([[2, 1], [1, 3]], [1, -1]) == 3 and quad_form([[1, 0], [0, 1]], [0.6, 0.8]) - 1 < 1e-15 and quad_form([[0, 1], [0, 0]], [1, 1]) == 1` },
          { name: "frob", code: `import math, random
assert frob_rms(3, 12) == 1.0 and abs(frob_rms(50, 1000) - math.sqrt(2.55)) < 1e-15
r = random.Random(0); d, n, tot = 4, 50, 0.0
for _ in range(400):
    S = sample_cov([[r.gauss(0, 1) for _ in range(d)] for _ in range(n)])
    tot += sum((S[i][j] - (i == j)) ** 2 for i in range(d) for j in range(d))
assert abs(math.sqrt(tot / 400) / frob_rms(d, n) - 1) < 0.08` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>op_norm(M, iters=200)</C>, the power iteration for a symmetric matrix starting from the vector with entries{" "}
          <M>{"1/(i + 1)"}</M> and returning the length of the last product <M>{"Mv"}</M> (or 0.0 if it vanishes);{" "}
          <C>edge_prediction(d, n)</C>, the pair <M>{"((1 - \\sqrt{d/n})_+^2, (1 + \\sqrt{d/n})^2)"}</M>; and{" "}
          <C>shrink(S, alpha)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def op_norm(M, iters=200):
    return 0.0

def edge_prediction(d, n):
    return (1.0, 1.0)

def shrink(S, alpha):
    return S
`,
        solution: SPEC,
        tests: [
          { name: "power", code: `import math
assert abs(op_norm([[2, 0], [0, -5]]) - 5) < 1e-9 and op_norm([[0, 0], [0, 0]]) == 0.0 and abs(op_norm([[2, 1], [1, 2]]) - 3) < 1e-9
assert abs(op_norm([[4, 1, 0], [1, 3, 1], [0, 1, 2]]) - (3 + math.sqrt(3))) < 1e-9 and abs(op_norm([[7]]) - 7) < 1e-12` },
          { name: "edges", code: `assert edge_prediction(25, 100) == (0.25, 2.25) and edge_prediction(4, 1) == (0.0, 9.0) and edge_prediction(9, 9) == (0.0, 4.0)
assert shrink([[3, 1], [1, 1]], 0.5) == [[2.5, 0.5], [0.5, 1.5]] and shrink([[4, 2], [2, 0]], 1) == [[2.0, 0.0], [0.0, 2.0]]
assert shrink([[1, 2], [2, 1]], 0) == [[1, 2], [2, 1]]` },
        ],
      },
    },
    {
      key: "samples",
      rung: "stretch",
      prompt: (
        <p>
          For standard Gaussian data in 200 dimensions, how many samples are needed before the predicted largest eigenvalue
          of the sample covariance, <M>{"(1 + \\sqrt{d/n})^2"}</M>, is at most 1.1? Give the smallest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 83953, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The sample covariance is one random matrix; the next lesson looks at random matrices in general, and at the
        surprising regularity of their eigenvalues, starting with the symmetric matrices whose entries are independent.
      </p>
    </>
  ),
};
