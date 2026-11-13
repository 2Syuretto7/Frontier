import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VarianceCancelViz } from "@/components/viz/VarianceCancelViz";
import type { LessonContent } from "@/lib/types";

const MV = `from fractions import Fraction
from itertools import permutations

def mean_var(dist):
    mu = sum(x * p for x, p in dist.items())
    return mu, sum((x - mu) ** 2 * p for x, p in dist.items())

def fixed_point_dist(n):
    perms = list(permutations(range(n)))
    dist = {}
    for s in perms:
        k = sum(s[i] == i for i in range(n))
        dist[k] = dist.get(k, 0) + Fraction(1, len(perms))
    return dist`;

const WELFORD = `import numpy as np

def naive_var(xs, dtype=np.float32):
    x = np.asarray(xs, dtype=dtype)
    return np.mean(x * x, dtype=dtype) - np.mean(x, dtype=dtype) ** 2

def welford(xs):
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    return mean, m2 / n`;

export const lesson: LessonContent = {
  id: "m7.2.4",
  minutes: 60,
  links: {
    requires: ["m7.2.3"],
    revisits: ["l3.4.1", "l1.5.1"],
    foreshadows: ["m7.4.2", "m7.5.2", "m7.7.1"],
  },

  puzzle: (
    <>
      <p>
        Shuffle n letters into n addressed envelopes. On average exactly one letter lands in its own envelope, whatever n is.
        How much does that count vary from shuffle to shuffle: more for large n, or less? And a practical twist: the textbook
        shortcut for computing a variance, run in 32-bit floats on data near 10,000, returns nonsense. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The variance is the mean squared distance from the mean. It adds up exactly over independent pieces, which is why the
        average of n independent measurements has standard deviation shrinking like 1/√n, and it picks up covariance terms
        when the pieces are dependent. Computing it by subtracting two large nearly equal numbers, as the shortcut formula
        does, throws away precision that the definition keeps.
      </p>
      <VarianceCancelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="variance and standard deviation">
        <p>
          For X with finite mean μ, <M>{"\\operatorname{Var}(X) = E[(X - \\mu)^2]"}</M>, and the standard deviation is{" "}
          <M>{"\\sigma = \\sqrt{\\operatorname{Var}(X)}"}</M>, in the same units as X.
        </p>
      </Definition>

      <Theorem title="basic rules">
        <p>
          <M>{"\\operatorname{Var}(X) = E[X^2] - \\mu^2"}</M>, <M>{"\\operatorname{Var}(aX + b) = a^2\\operatorname{Var}(X)"}</M>,
          and Var(X) = 0 exactly when P(X = μ) = 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand: <M>{"E[X^2 - 2\\mu X + \\mu^2] = E[X^2] - 2\\mu^2 + \\mu^2"}</M> by linearity. Next, aX + b has mean aμ + b,
          so its deviation is a(X − μ) and the squared deviation picks up <M>{"a^2"}</M>. Finally, a non-negative variable with
          zero mean must be 0 with probability 1: if <M>{"P((X - \\mu)^2 > \\varepsilon) > 0"}</M> for some ε &gt; 0, the
          expectation would be at least ε times that probability.
        </p>
        <Code>{MV}</Code>
      </Proof>

      <Theorem title="variance of a sum">
        <p>
          With <M>{"\\operatorname{Cov}(X, Y) = E[(X - EX)(Y - EY)]"}</M>,
        </p>
        <MD>{"\\operatorname{Var}\\Big(\\sum_{i=1}^{n}X_i\\Big) = \\sum_i \\operatorname{Var}(X_i) + 2\\sum_{i<j}\\operatorname{Cov}(X_i, X_j)."}</MD>
        <p>If the <M>{"X_i"}</M> are independent, or merely pairwise uncorrelated, the variances simply add.</p>
      </Theorem>
      <Proof>
        <p>
          The centred sum is <M>{"\\sum_i(X_i - \\mu_i)"}</M>; its square is{" "}
          <M>{"\\sum_i(X_i - \\mu_i)^2 + 2\\sum_{i<j}(X_i - \\mu_i)(X_j - \\mu_j)"}</M>, and linearity of expectation gives the
          formula. For independent <M>{"X_i, X_j"}</M>, the product rule for expectations gives{" "}
          <M>{"\\operatorname{Cov} = E[X_i - \\mu_i]E[X_j - \\mu_j] = 0"}</M>.
        </p>
      </Proof>

      <Example title="the named variances">
        <p>
          Bernoulli(p): <M>{"E[X^2] = p"}</M>, so Var = p(1 − p). Binomial(n, p): a sum of n independent Bernoullis, so np(1 −
          p). Poisson(λ): <M>{"E[X(X-1)] = \\sum_k k(k-1)e^{-\\lambda}\\lambda^k/k! = \\lambda^2"}</M>, so{" "}
          <M>{"E[X^2] = \\lambda^2 + \\lambda"}</M> and Var = λ, equal to the mean. Geometric(p): differentiating{" "}
          <M>{"\\sum_k q^k = 1/(1-q)"}</M> twice gives <M>{"E[X(X-1)] = 2q/p^2"}</M> with q = 1 − p, hence Var ={" "}
          <M>{"q/p^2"}</M>.
        </p>
      </Example>

      <Example title="averages and the √n law">
        <p>
          If <M>{"X_1, \\dots, X_n"}</M> are independent with variance <M>{"\\sigma^2"}</M>, the mean{" "}
          <M>{"\\bar X = \\frac1n\\sum X_i"}</M> has variance <M>{"n\\sigma^2/n^2 = \\sigma^2/n"}</M> and standard deviation{" "}
          <M>{"\\sigma/\\sqrt{n}"}</M>. Halving the error of a Monte Carlo estimate or a minibatch gradient costs four times
          as many samples. The same calculation is behind variance-preserving weight initialisation: a sum of n independent
          terms has n times the variance of one.
        </p>
      </Example>

      <Example title="the puzzle: fixed points">
        <p>
          Let <M>{"I_i"}</M> indicate that letter i is in its own envelope, so the count is <M>{"\\sum I_i"}</M>. Each{" "}
          <M>{"I_i"}</M> has variance <M>{"\\frac1n(1 - \\frac1n)"}</M>, and for i ≠ j,{" "}
          <M>{"\\operatorname{Cov}(I_i, I_j) = \\frac{1}{n(n-1)} - \\frac{1}{n^2} = \\frac{1}{n^2(n-1)}"}</M>. So the variance
          is <M>{"(1 - \\frac1n) + n(n-1)\\cdot\\frac{1}{n^2(n-1)} = 1"}</M> for every n ≥ 2. Both the mean and the variance
          are those of a Poisson(1) variable, and indeed the count is approximately Poisson(1).
        </p>
      </Example>

      <Remark title="computing a variance">
        <p>
          The formula <M>{"E[X^2] - \\mu^2"}</M> is fine on paper and dangerous in floating point: when μ is large compared
          with σ, it subtracts two nearly equal numbers and the relative error is amplified by roughly{" "}
          <M>{"\\mu^2/\\sigma^2"}</M>. Two passes (mean first, then mean squared deviation) or Welford&apos;s one-pass update,
          which tracks the running mean and the sum of squared deviations from it, avoid this. Normalisation layers that
          compute variances in low precision face exactly this issue.
        </p>
        <Code>{WELFORD}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "die",
      rung: "check",
      prompt: <p>What is the variance of the roll of a fair die? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.9167, tolerance: 0.0001 },
    },
    {
      key: "affine",
      rung: "check",
      prompt: <p>Var(X) = 4. What is Var(3X − 2)?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "diff",
      rung: "apply",
      prompt: <p>X and Y are independent, each with variance 1. What is Var(X − Y)?</p>,
      answer: { kind: "choice", options: ["2", "0", "1", "4"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction
from itertools import permutations

def mean_var(dist):
    mu = sum(x * p for x, p in dist.items())
    return mu, sum((x - mu) ** 2 * p for x, p in dist.items())

def fixed_point_dist(n):
    perms = list(permutations(range(n)))
    dist = {}
    for s in perms:
        k = sum(s[i] == i for i in range(n))
        dist[k] = dist.get(k, 0) + Fraction(1, len(perms))
    return dist

die = {x: Fraction(1, 6) for x in range(1, 7)}
print(*mean_var(die), *mean_var({0: Fraction(1, 2), 10: Fraction(1, 2)}))
print(*mean_var(fixed_point_dist(4)), *mean_var(fixed_point_dist(6)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["7/2 35/12 5 25\n1 1 1 1", "7/2 35/12 5 50\n1 1 1 1", "7/2 91/6 5 25\n1 1 1 1", "7/2 35/12 5 25\n1 1 1 5"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def naive_var(xs, dtype=np.float32):
    x = np.asarray(xs, dtype=dtype)
    return np.mean(x * x, dtype=dtype) - np.mean(x, dtype=dtype) ** 2

def welford(xs):
    n, mean, m2 = 0, 0.0, 0.0
    for x in xs:
        n += 1
        delta = x - mean
        mean += delta / n
        m2 += delta * (x - mean)
    return mean, m2 / n

xs = [1.0, 2.0, 3.0, 4.0]
print(welford(xs), float(naive_var(xs)))
big = [1e4 + v for v in (0.0, 1.0, 2.0, 3.0)]
print(welford(big), float(naive_var(big)), float(naive_var(big, np.float64)))`}</Code>
          <p>What does this print? (The float32 arithmetic is the point.)</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2.5, 1.25) 1.25\n(10001.5, 1.25) 0.0 1.25",
          "(2.5, 1.6666666666666667) 1.25\n(10001.5, 1.6666666666666667) 0.0 1.25",
          "(2.5, 1.25) 1.25\n(10001.5, 1.25) 1.25 1.25",
          "(2.5, 1.25) 1.25\n(10001.5, 0.0) 0.0 1.25",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mean_var(dist)</C>, returning (mean, variance) of a pmf dict computed from the definition, and{" "}
          <C>fixed_point_dist(n)</C>, the exact distribution (Fractions) of the number of fixed points of a uniformly random
          permutation of range(n), by enumeration.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from fractions import Fraction
from itertools import permutations

def mean_var(dist):
    return 0, 0

def fixed_point_dist(n):
    return {}
`,
        solution: MV,
        tests: [
          { name: "mean and variance", code: `die = {x: Fraction(1, 6) for x in range(1, 7)}
assert mean_var(die) == (Fraction(7, 2), Fraction(35, 12))
from math import comb
b = {k: Fraction(comb(6, k), 64) for k in range(7)}
assert mean_var(b) == (3, Fraction(3, 2))` },
          { name: "fixed points", code: `d = fixed_point_dist(4)
assert d[0] == Fraction(9, 24) and d[4] == Fraction(1, 24) and d.get(3, 0) == 0
for n in (2, 3, 5):
    assert mean_var(fixed_point_dist(n)) == (1, 1)
assert sum(fixed_point_dist(5).values()) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>naive_var(xs, dtype=np.float32)</C>, the population variance by E[X²] − E[X]² with every operation in the
          given dtype, and <C>welford(xs)</C>, a one-pass computation of (mean, population variance) using Welford&apos;s update
          in Python floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def naive_var(xs, dtype=np.float32):
    return 0.0

def welford(xs):
    return 0.0, 0.0
`,
        solution: WELFORD,
        tests: [
          { name: "welford", code: `rng = np.random.default_rng(0)
x = rng.normal(5, 3, size=1000)
m, v = welford(x)
assert abs(m - x.mean()) < 1e-10 and abs(v - x.var()) < 1e-9
big = 1e9 + rng.normal(0, 1, size=500)
assert abs(welford(big)[1] - np.var(big - 1e9)) < 1e-6` },
          { name: "naive", code: `assert abs(float(naive_var([1.0, 2.0, 3.0, 4.0])) - 1.25) < 1e-6
assert abs(float(naive_var([1e4, 1e4 + 1, 1e4 + 2, 1e4 + 3], np.float64)) - 1.25) < 1e-6
assert abs(float(naive_var([1e4, 1e4 + 1, 1e4 + 2, 1e4 + 3])) - 1.25) > 0.5
assert np.asarray(naive_var([1.0, 2.0])).dtype == np.float32` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if X and Y are independent with finite variances, then Var(X + Y) = Var(X) + Var(Y).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Expands Var(X + Y) = E[((X − μ_X) + (Y − μ_Y))²] = Var(X) + Var(Y) + 2E[(X − μ_X)(Y − μ_Y)] using linearity.",
          "Uses independence (of X − μ_X and Y − μ_Y) to write the cross term as E[X − μ_X]·E[Y − μ_Y].",
          "Notes each factor is 0, so the cross term vanishes.",
        ],
      },
    },
    {
      key: "distinctvar",
      rung: "stretch",
      prompt: <p>A die is rolled 10 times. What is the variance of the number of different faces that appear? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.5503, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what the variance measures, why variances add for independent variables but need covariance terms otherwise, why an average of n samples has standard deviation σ/√n, and why E[X²] − E[X]² is a poor way to compute a variance in floating point.",

  glimpse: (
    <>
      <p>
        Mean and variance already control probabilities: Chebyshev&apos;s inequality bounds the chance of being k standard
        deviations away by 1/k². Covariance, met here as a correction term, becomes a subject of its own with joint
        distributions, and the σ/√n law is the first step towards the law of large numbers and the central limit theorem.
      </p>
    </>
  ),
};
