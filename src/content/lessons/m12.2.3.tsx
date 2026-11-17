import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MiScatterViz } from "@/components/viz/MiScatterViz";
import type { LessonContent } from "@/lib/types";

const MI = `import numpy as np

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def mutual_information(P):
    px, py = P.sum(axis=1), P.sum(axis=0)
    return H(px) + H(py) - H(P)

def gaussian_mi(rho):
    return float(-0.5 * np.log2(1 - rho ** 2))`;

const BM = `import numpy as np

def binned_mi(x, y, bins):
    C, _, _ = np.histogram2d(x, y, bins=bins)
    P = C / C.sum(); px, py = P.sum(axis=1, keepdims=True), P.sum(axis=0, keepdims=True)
    m = P > 0
    return float((P[m] * np.log2(P[m] / (px @ py)[m])).sum())

def permutation_baseline(x, y, bins, reps, seed):
    rng = np.random.default_rng(seed)
    return float(np.mean([binned_mi(x, rng.permutation(y), bins) for _ in range(reps)]))`;

export const lesson: LessonContent = {
  id: "m12.2.3",
  minutes: 45,
  links: {
    requires: ["m12.2.1", "m12.1.4"],
    revisits: ["m7.5.2", "m7.5.4"],
    foreshadows: ["m12.2.4", "m12.5.1", "m12.6.4"],
  },

  puzzle: (
    <>
      <p>
        Draw X from a standard normal and let Y = X² plus a little noise. Knowing X tells you Y almost exactly, yet the
        correlation between them is essentially zero, because large positive and large negative X give the same Y. So
        correlation is a poor measure of how much one variable tells you about another. What quantity measures that
        directly, treats all kinds of dependence alike, and is zero only for genuinely independent variables?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Mutual information is the reduction in uncertainty about X from learning Y: H(X) − H(X | Y). It is also the KL
        divergence between the joint distribution and the product of the marginals, that is, how far the pair is from being
        independent. It is symmetric, never negative, and zero exactly under independence, and for jointly Gaussian
        variables it is a function of the correlation alone. For anything nonlinear it sees what correlation misses.
      </p>
      <MiScatterViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mutual information">
        <MD>{"I(X; Y) = D\\big(p(x, y)\\,\\|\\,p(x)p(y)\\big) = \\sum_{x, y} p(x, y)\\log\\frac{p(x, y)}{p(x)p(y)}."}</MD>
      </Definition>

      <Theorem title="mutual information in terms of entropy">
        <MD>{"I(X; Y) = H(X) - H(X \\mid Y) = H(Y) - H(Y \\mid X) = H(X) + H(Y) - H(X, Y)."}</MD>
        <p>
          Hence I(X; Y) = I(Y; X), <M>{"I(X; Y) \\ge 0"}</M> with equality exactly when X and Y are independent, and{" "}
          <M>{"I(X; X) = H(X)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Split the logarithm: <M>{"\\log\\frac{p(x, y)}{p(x)p(y)} = -\\log p(x) - \\log p(y) + \\log p(x, y)"}</M>, and take the
          expectation under p(x, y) to get H(X) + H(Y) − H(X, Y). The chain rule turns this into H(X) − H(X | Y) or H(Y) − H(Y
          | X). Nonnegativity and the equality case are Gibbs&apos; inequality, since p(x)p(y) = p(x, y) is independence. For
          X = Y, H(X | X) = 0.
        </p>
      </Proof>

      <Definition title="conditional mutual information and its chain rule">
        <p>
          <M>{"I(X; Y \\mid Z) = H(X \\mid Z) - H(X \\mid Y, Z)"}</M>, the information Y adds about X once Z is known. Then
        </p>
        <MD>{"I(X; Y, Z) = I(X; Z) + I(X; Y \\mid Z)."}</MD>
        <p>
          Indeed <M>{"I(X; Y, Z) = H(X) - H(X \\mid Y, Z) = [H(X) - H(X \\mid Z)] + [H(X \\mid Z) - H(X \\mid Y, Z)]"}</M>.
        </p>
        <Code>{MI}</Code>
      </Definition>

      <Theorem title="Gaussian mutual information">
        <p>
          If (X, Y) is bivariate normal with correlation ρ, then <M>{"I(X; Y) = -\\tfrac12\\log(1 - \\rho^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Mutual information does not change when X and Y are rescaled, so take unit variances. Then
        </p>
        <MD>{"\\log\\frac{p(x, y)}{p(x)p(y)} = -\\tfrac12\\log(1 - \\rho^2) - \\frac{x^2 - 2\\rho xy + y^2}{2(1 - \\rho^2)} + \\frac{x^2 + y^2}{2}."}</MD>
        <p>
          With <M>{"\\mathbb{E}X^2 = \\mathbb{E}Y^2 = 1"}</M> and <M>{"\\mathbb{E}XY = \\rho"}</M>, the middle term has
          expectation <M>{"-(2 - 2\\rho^2)/(2(1 - \\rho^2)) = -1"}</M> and the last +1, leaving{" "}
          <M>{"-\\tfrac12\\log(1 - \\rho^2)"}</M>. At ρ = 0.5 this is 0.21 bits, and it grows without bound as |ρ| → 1, since
          a perfectly correlated continuous pair carries infinitely many bits about each other.
        </p>
      </Proof>

      <Remark title="estimating mutual information">
        <p>
          The plug-in estimate from a two-dimensional histogram is biased upwards, by roughly{" "}
          <M>{"(b - 1)^2/(2n\\ln 2)"}</M> bits for b × b bins and n samples, because chance fluctuations look like
          dependence. A permutation baseline estimates this: shuffling Y destroys any dependence, so the average estimate on
          shuffled data shows what independence looks like. On the parabola the correlation is 0.01 and the binned estimate
          0.9 bits, against a shuffled baseline of 0.01. For high-dimensional data, histograms fail, and methods such as the
          InfoNCE bound used in contrastive learning estimate a lower bound on mutual information with a neural network.
        </p>
        <Code>{BM}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "copy",
      rung: "check",
      prompt: <p>X is a fair bit and Y = X. What is I(X; Y) in bits?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "rho",
      rung: "check",
      prompt: <p>What is the mutual information in bits between two jointly Gaussian variables with correlation 0.6? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3219, tolerance: 0.0001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Which statement is true for any pair of random variables?</p>,
      answer: {
        kind: "choice",
        options: [
          "I(X; Y) = 0 if and only if X and Y are independent, while zero correlation does not imply independence",
          "Zero correlation implies I(X; Y) = 0",
          "I(X; Y) can be negative when X and Y are negatively correlated",
          "I(X; Y) = H(X, Y) − H(X) − H(Y)",
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

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def mutual_information(P):
    px, py = P.sum(axis=1), P.sum(axis=0)
    return H(px) + H(py) - H(P)

def gaussian_mi(rho):
    return float(-0.5 * np.log2(1 - rho ** 2))

P = np.array([[0.4, 0.1], [0.1, 0.4]])
print(round(mutual_information(P), 4), round(mutual_information(np.outer([0.3, 0.7], [0.5, 0.5])), 4) + 0.0, mutual_information(np.eye(4) / 4))
print(round(gaussian_mi(0.5), 4), round(gaussian_mi(0.99), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2781 0.0 2.0\n0.2075 2.826",
          "0.2781 0.8813 2.0\n0.2075 2.826",
          "0.2781 0.0 0.0\n0.2075 2.826",
          "0.7219 0.0 2.0\n0.415 5.652",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def binned_mi(x, y, bins):
    C, _, _ = np.histogram2d(x, y, bins=bins)
    P = C / C.sum(); px, py = P.sum(axis=1, keepdims=True), P.sum(axis=0, keepdims=True)
    m = P > 0
    return float((P[m] * np.log2(P[m] / (px @ py)[m])).sum())

def permutation_baseline(x, y, bins, reps, seed):
    rng = np.random.default_rng(seed)
    return float(np.mean([binned_mi(x, rng.permutation(y), bins) for _ in range(reps)]))

rng = np.random.default_rng(0); x = rng.normal(size=5000); y = x ** 2 + 0.1 * rng.normal(size=5000)
print(round(float(np.corrcoef(x, y)[0, 1]), 2) + 0.0, round(binned_mi(x, y, 10), 1), round(permutation_baseline(x, y, 10, 20, 1), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.01 0.9 0.01", "0.01 0.0 0.0", "0.97 0.9 0.01", "0.01 0.9 0.9"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>H(p)</C> in bits, <C>mutual_information(P)</C> for a joint table P, and <C>gaussian_mi(rho)</C> in bits.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def H(p):
    return 0.0

def mutual_information(P):
    return 0.0

def gaussian_mi(rho):
    return 0.0
`,
        solution: MI,
        tests: [
          { name: "tables", code: `assert np.isclose(mutual_information(np.eye(2) / 2), 1.0) and np.isclose(mutual_information(np.full((3, 3), 1 / 9)), 0.0, atol=1e-12)
P = np.array([[0.3, 0.1], [0.2, 0.4]])
assert np.isclose(mutual_information(P), mutual_information(P.T)) and np.isclose(mutual_information(P), np.sum(P * np.log2(P / np.outer(P.sum(1), P.sum(0)))))` },
          { name: "gauss", code: `assert np.isclose(gaussian_mi(0.0), 0.0) and np.isclose(gaussian_mi(np.sqrt(0.75)), 1.0) and np.isclose(gaussian_mi(-0.6), gaussian_mi(0.6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binned_mi(x, y, bins)</C>, the plug-in mutual information in bits of a <C>np.histogram2d</C> with that
          many bins, and <C>permutation_baseline(x, y, bins, reps, seed)</C>, the average of <C>binned_mi</C> over{" "}
          <C>reps</C> random permutations of y drawn with <C>np.random.default_rng(seed)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def binned_mi(x, y, bins):
    return 0.0

def permutation_baseline(x, y, bins, reps, seed):
    return 0.0
`,
        solution: BM,
        tests: [
          { name: "binned", code: `x = np.array([0.0, 0.0, 1.0, 1.0]); assert np.isclose(binned_mi(x, x, 2), 1.0)
assert np.isclose(binned_mi(x, np.array([0.0, 1.0, 0.0, 1.0]), 2), 0.0)` },
          { name: "perm", code: `rng = np.random.default_rng(3); x = rng.normal(size=2000); y = x + 0.3 * rng.normal(size=2000)
b = permutation_baseline(x, y, 8, 10, 0); m = binned_mi(x, y, 8)
assert 0 < b < 0.05 and m > 1.0 and isinstance(b, float)` },
        ],
      },
    },
    {
      key: "bsc",
      rung: "stretch",
      prompt: (
        <p>
          X is a fair bit and Y is X flipped with probability 0.1. What is I(X; Y) in bits? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.531, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        If Z is computed from Y alone, can Z know more about X than Y does? Intuition says no, and the next lesson proves it:
        the data processing inequality, a ceiling on what any representation can extract.
      </p>
    </>
  ),
};
