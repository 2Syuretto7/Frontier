import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SemicircleViz } from "@/components/viz/SemicircleViz";
import type { LessonContent } from "@/lib/types";

const WIG = `import math

def wigner(n, rng):
    W = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            W[i][j] = W[j][i] = rng.gauss(0, 1) / math.sqrt(n)
    return W

def moment(M, k):
    n = len(M)
    P = [[float(i == j) for j in range(n)] for i in range(n)]
    for _ in range(k):
        P = [[sum(P[i][t] * M[t][j] for t in range(n)) for j in range(n)] for i in range(n)]
    return sum(P[i][i] for i in range(n)) / n

def catalan(k):
    return math.comb(2 * k, k) // (k + 1)`;

const SEMI = `import math

def semicircle(x):
    return math.sqrt(4 - x * x) / (2 * math.pi) if abs(x) < 2 else 0.0

def semicircle_mass(a, b, steps=10000):
    h = (b - a) / steps
    return h * sum(math.sqrt(max(0.0, 4 - (a + (i + 0.5) * h) ** 2)) for i in range(steps)) / (2 * math.pi)

def count_below(M, x):
    n = len(M)
    A = [[M[i][j] - (x if i == j else 0) for j in range(n)] for i in range(n)]
    neg = 0
    for k in range(n):
        if A[k][k] < 0:
            neg += 1
        for i in range(k + 1, n):
            f = A[i][k] / A[k][k]
            for j in range(k + 1, n):
                A[i][j] -= f * A[k][j]
    return neg`;

export const lesson: LessonContent = {
  id: "m15.3.2",
  minutes: 55,
  links: {
    requires: ["m15.3.1", "m6.3.3"],
    revisits: ["m1.5.4"],
    foreshadows: ["m15.3.3", "m15.3.4"],
  },

  puzzle: (
    <>
      <p>
        Fill a large symmetric matrix with coin flips, ±1 above the diagonal and mirrored below. Its eigenvalues are
        complicated functions of all the entries at once. Do it again with Gaussian entries instead. Plot both sets of
        eigenvalues as histograms. They are the same shape, a perfect half-ellipse, and it is the same shape every time.
        Why should anything so specific come out of so much randomness?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Eigenvalues are hard to compute but their moments are easy: the average of <M>{"\\lambda^k"}</M> over the
        eigenvalues is a normalised trace of <M>{"W^k"}</M>, a sum of products of entries. Taking expectations, almost all
        of those products vanish, and the ones that survive are counted by a combinatorial rule that only sees the variance
        of the entries. The rule produces the Catalan numbers, and the Catalan numbers are the moments of the semicircle.
      </p>
      <SemicircleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Wigner matrix">
        <p>
          A <em>Wigner matrix</em> is a symmetric n × n random matrix H whose entries <M>{"H_{ij}"}</M> for{" "}
          <M>{"i \\le j"}</M> are independent with mean 0 and variance 1, and <M>{"H_{ji} = H_{ij}"}</M>. Write{" "}
          <M>{"W = H/\\sqrt n"}</M>. By the spectral theorem (m6.3.3), W has n real eigenvalues; their{" "}
          <em>empirical spectral distribution</em> puts mass 1/n on each. Its k-th moment is{" "}
          <M>{"\\tfrac1n\\sum_i\\lambda_i^k = \\tfrac1n\\mathrm{tr}\\,W^k"}</M>, computed by <C>moment</C>.
        </p>
        <Code>{WIG}</Code>
      </Definition>

      <Theorem title="Wigner’s semicircle law">
        <p>
          As <M>{"n \\to \\infty"}</M>, the empirical spectral distribution of W converges, with probability 1, to the
          semicircle law with density
        </p>
        <MD>{"\\rho(x) = \\frac{1}{2\\pi}\\sqrt{4 - x^2}, \\qquad |x| \\le 2,"}</MD>
        <p>
          whose moments are <M>{"\\int x^{2k}\\rho(x)\\,dx = C_k = \\frac{1}{k + 1}\\binom{2k}{k}"}</M>, the Catalan numbers of
          m1.5.4, and 0 for odd powers.
        </p>
      </Theorem>
      <Proof>
        <p>
          (The moment computation, the heart of the proof.) Expand{" "}
          <M>{"\\tfrac1n\\mathbb{E}\\,\\mathrm{tr}\\,W^k = n^{-1 - k/2}\\sum\\mathbb{E}[H_{i_1i_2}H_{i_2i_3}\\cdots H_{i_ki_1}]"}</M>, a
          sum over closed walks <M>{"i_1 \\to i_2 \\to \\dots \\to i_1"}</M> on the indices. By independence and mean zero, a walk
          contributes nothing if it uses some edge exactly once, so every edge is used at least twice and the walk has at most
          k/2 distinct edges. A connected graph with e edges has at most e + 1 vertices, so a walk has at most k/2 + 1 distinct
          indices and there are at most about <M>{"n^{k/2 + 1}"}</M> such walks: after the normalisation, only walks with exactly
          k/2 + 1 distinct indices survive. Those walks trace a tree with k/2 edges, each crossed exactly twice, once out and
          once back, so each contributes <M>{"\\mathbb{E}H_{ij}^2 \\cdot \\dots = 1"}</M>. For odd k there are none. For even k
          the shapes of such walks are in bijection with the Dyck paths of length k (step up when the walk moves to a new
          vertex, down when it returns), which are counted by <M>{"C_{k/2}"}</M>. Convergence of the expected moments,
          plus concentration of each moment around its mean, plus the fact that the semicircle is determined by its moments,
          give the theorem.
        </p>
      </Proof>

      <Example title="the first moments">
        <p>
          For k = 2 the walks are <M>{"i \\to j \\to i"}</M>: <M>{"\\tfrac1n\\mathbb{E}\\,\\mathrm{tr}\\,W^2 = n^{-2}\\sum_{i,j}\\mathbb{E}H_{ij}^2 = 1"}</M>{" "}
          exactly. For k = 4 the surviving walks are <M>{"i \\to j \\to i \\to l \\to i"}</M> and{" "}
          <M>{"i \\to j \\to k \\to j \\to i"}</M>, about <M>{"n^3"}</M> each, so the limit is <M>{"C_2 = 2"}</M>. The crossing pattern{" "}
          <M>{"i \\to j \\to i \\to j \\to i"}</M> has only two free indices and disappears in the limit. For a 60 × 60 sample the
          second, fourth and sixth moments are already 1.0, 2.0 and 5.0 to one decimal place.
        </p>
      </Example>

      <Remark title="universality">
        <p>
          The proof used only the means and variances of the entries (plus enough moments to bound the error terms), which is
          why coin flips and Gaussians give the same picture. This <em>universality</em> runs deep: the spacing between
          neighbouring eigenvalues, and the fluctuations of the largest eigenvalue around 2, are also universal, and match
          those seen in nuclear energy levels and in the zeros of the Riemann zeta function.
        </p>
      </Remark>

      <Example title="counting eigenvalues without computing them">
        <p>
          To compare with the semicircle we only need the number of eigenvalues below x. By Sylvester&apos;s law of inertia,
          this is the number of negative pivots when Gaussian elimination is run on <M>{"W - xI"}</M>, because elimination
          writes <M>{"W - xI = LDL^\\top"}</M> and congruent matrices have the same number of negative eigenvalues.{" "}
          <C>count_below</C> does this in about <M>{"n^3/3"}</M> operations, assuming no pivot is exactly zero, which happens
          with probability 0 for random matrices. <C>semicircle_mass</C> integrates the density by the midpoint rule.
        </p>
        <Code>{SEMI}</Code>
      </Example>

      <Remark title="the edge">
        <p>
          The semicircle&apos;s support ends at ±2, which suggests that <M>{"\\|H\\| \\approx 2\\sqrt n"}</M>. The law alone does
          not prove this, since it allows o(n) eigenvalues to stray; that the largest one does not is a separate theorem
          (m15.3.4). The sample covariance has its own limiting shape, the Marchenko-Pastur law (m15.3.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "inner",
      rung: "check",
      prompt: <p>For a large Wigner matrix scaled by 1/√n, what fraction of eigenvalues lie in [−1, 1]? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.609, tolerance: 0.00006 },
    },
    {
      key: "m8",
      rung: "check",
      prompt: <p>What is the limit of <M>{"\\tfrac1n\\mathbb{E}\\,\\mathrm{tr}\\,W^8"}</M> for a Wigner matrix W scaled by 1/√n?</p>,
      answer: { kind: "numeric", value: 14, tolerance: 0.5 },
    },
    {
      key: "universal",
      rung: "apply",
      prompt: <p>Why does the limiting spectrum not depend on whether the entries are signs or Gaussians?</p>,
      answer: {
        kind: "choice",
        options: [
          "Only walks that use each entry exactly twice survive in the limit, and they see only the variance",
          "Signs are approximately Gaussian when n is large",
          "Every symmetric matrix has a semicircular spectrum",
          "The eigenvalues are averages of the entries, so the central limit theorem applies to each one",
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

def wigner(n, rng):
    W = [[0.0] * n for _ in range(n)]
    for i in range(n):
        for j in range(i, n):
            W[i][j] = W[j][i] = rng.gauss(0, 1) / math.sqrt(n)
    return W

def moment(M, k):
    n = len(M)
    P = [[float(i == j) for j in range(n)] for i in range(n)]
    for _ in range(k):
        P = [[sum(P[i][t] * M[t][j] for t in range(n)) for j in range(n)] for i in range(n)]
    return sum(P[i][i] for i in range(n)) / n

def catalan(k):
    return math.comb(2 * k, k) // (k + 1)

print(moment([[0, 1], [1, 0]], 2), moment([[2, 0], [0, 0]], 3), [catalan(k) for k in range(6)])
import random; W = wigner(60, random.Random(1)); print(W[3][7] == W[7][3], round(moment(W, 2), 1), round(moment(W, 4)), round(moment(W, 6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 4.0 [1, 1, 2, 5, 14, 42]\nTrue 1.0 2 5",
          "1.0 8.0 [1, 1, 2, 5, 14, 42]\nTrue 1.0 2 5",
          "2.0 4.0 [1, 1, 2, 5, 14, 42]\nTrue 1.0 2 5",
          "1.0 4.0 [1, 1, 2, 5, 14, 42]\nTrue 1.0 3 15",
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

def semicircle(x):
    return math.sqrt(4 - x * x) / (2 * math.pi) if abs(x) < 2 else 0.0

def semicircle_mass(a, b, steps=10000):
    h = (b - a) / steps
    return h * sum(math.sqrt(max(0.0, 4 - (a + (i + 0.5) * h) ** 2)) for i in range(steps)) / (2 * math.pi)

def count_below(M, x):
    n = len(M)
    A = [[M[i][j] - (x if i == j else 0) for j in range(n)] for i in range(n)]
    neg = 0
    for k in range(n):
        if A[k][k] < 0:
            neg += 1
        for i in range(k + 1, n):
            f = A[i][k] / A[k][k]
            for j in range(k + 1, n):
                A[i][j] -= f * A[k][j]
    return neg

print(round(semicircle(0), 4), semicircle(2.5), round(semicircle_mass(-2, 2), 4), round(semicircle_mass(0, 2), 4))
print(count_below([[2, 0], [0, -1]], 0), count_below([[0, 1], [1, 0]], 0.5), count_below([[0, 1], [1, 0]], -2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3183 0.0 1.0 0.5\n1 1 0",
          "0.3183 0.0 1.0 0.5\n1 0 0",
          "0.6366 0.0 1.0 0.5\n1 1 0",
          "0.3183 0.0 1.0 0.5\n1 1 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wigner(n, rng)</C>, filling <M>{"W_{ij} = W_{ji}"}</M> for i ≤ j in row order with{" "}
          <C>rng.gauss(0, 1) / math.sqrt(n)</C>; <C>moment(M, k)</C>, the normalised trace <M>{"\\tfrac1n\\mathrm{tr}\\,M^k"}</M>{" "}
          (1.0 when k = 0); and <C>catalan(k)</C>, as an integer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def wigner(n, rng):
    return []

def moment(M, k):
    return 0.0

def catalan(k):
    return 0
`,
        solution: WIG,
        tests: [
          { name: "wigner", code: `import math, random
W = wigner(3, random.Random(4)); r = random.Random(4); vals = [r.gauss(0, 1) / math.sqrt(3) for _ in range(6)]
assert [W[0][0], W[0][1], W[0][2], W[1][1], W[1][2], W[2][2]] == vals and W[2][0] == W[0][2] and W[2][1] == W[1][2]
assert moment([[0, 1], [1, 0]], 2) == 1 and moment([[2, 0], [0, 0]], 3) == 4 and moment([[5, 1], [1, 3]], 0) == 1.0 and moment([[1, 2], [3, 4]], 1) == 2.5` },
          { name: "catalan", code: `import random
assert [catalan(k) for k in range(8)] == [1, 1, 2, 5, 14, 42, 132, 429] and catalan(20) == 6564120420
W = wigner(80, random.Random(3)); assert abs(moment(W, 2) - 1) < 0.05 and abs(moment(W, 4) - 2) < 0.15 and abs(moment(W, 3)) < 0.15` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>semicircle(x)</C>, the density (0 outside [−2, 2]); <C>semicircle_mass(a, b, steps=10000)</C>, its integral
          over [a, b] by the midpoint rule; and <C>count_below(M, x)</C>, the number of eigenvalues of the symmetric matrix M
          below x, from the signs of the pivots of Gaussian elimination without row exchanges on <M>{"M - xI"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def semicircle(x):
    return 0.0

def semicircle_mass(a, b, steps=10000):
    return 0.0

def count_below(M, x):
    return 0
`,
        solution: SEMI,
        tests: [
          { name: "density", code: `import math
assert abs(semicircle(0) - 1 / math.pi) < 1e-15 and semicircle(2.5) == 0.0 and semicircle(-3) == 0.0 and abs(semicircle(1) - math.sqrt(3) / (2 * math.pi)) < 1e-15
assert abs(semicircle_mass(-2, 2) - 1) < 1e-5 and abs(semicircle_mass(-1, 1) - (math.sqrt(3) / 2 + math.pi / 3) / math.pi) < 1e-6 and abs(semicircle_mass(-3, 3, 30000) - 1) < 1e-5` },
          { name: "count", code: `A = [[4, 1, 0, 2], [1, 3, 1, 0], [0, 1, 2, 1], [2, 0, 1, 5]]
assert [count_below(A, x) for x in [0.5, 1.5, 2.5, 3, 4.5, 5.5, 6.5, 7.5]] == [0, 1, 1, 2, 3, 3, 3, 4]
assert count_below([[0, 1], [1, 0]], 0.5) == 1 and count_below([[0, 1], [1, 0]], -2) == 0 and count_below([[-1]], 0) == 1` },
        ],
      },
    },
    {
      key: "tail",
      rung: "stretch",
      prompt: (
        <p>
          What fraction of the eigenvalues of a large Wigner matrix scaled by 1/√n lie above 1.5? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0721, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The sample covariance of m15.3.1 is not a Wigner matrix: it is <M>{"X^\\top X/n"}</M>, always positive semidefinite.
        The next lesson finds its limiting spectrum, the Marchenko-Pastur law, and with it the exact shape of the spreading
        seen there.
      </p>
    </>
  ),
};
