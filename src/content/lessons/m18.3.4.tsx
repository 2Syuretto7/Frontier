import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ModesViz } from "@/components/viz/ModesViz";
import type { LessonContent } from "@/lib/types";

const MODES = `def prob_far(X, n, eps, grid):
    return sum(1 for w in grid if abs(X(n, w)) > eps) / len(grid)

def mean_abs(X, n, grid):
    return sum(abs(X(n, w)) for w in grid) / len(grid)

def tail_sup(X, w, n, N):
    return max(abs(X(k, w)) for k in range(n, N))`;

const DIST = `def ecdf(xs, x):
    return sum(1 for v in xs if v <= x) / len(xs)

def ks_distance(xs, F):
    xs = sorted(xs)
    m = len(xs)
    return max(max(abs((i + 1) / m - F(v)), abs(i / m - F(v))) for i, v in enumerate(xs))

def scaled_max_cdf(n, t):
    if t <= 0:
        return 0.0
    return 1 - (1 - t / n) ** n if t < n else 1.0`;

export const lesson: LessonContent = {
  id: "m18.3.4",
  minutes: 45,
  links: {
    requires: ["m18.3.3", "m18.2.2"],
    revisits: ["m7.7.1", "m8.5.1"],
    foreshadows: ["m18.6.1", "m18.6.2"],
  },

  puzzle: (
    <>
      <p>
        The weak law of large numbers says the sample mean is probably close to μ for large n. The strong law says it
        actually converges to μ. The central limit theorem says a rescaled sample mean has nearly a normal histogram, even
        though the rescaled values themselves never settle down. These are three different meanings of &quot;a sequence of random
        variables converges&quot;. How are they related, and which implies which?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A random variable is a function of ω, so a sequence of them can converge pointwise for almost every ω, or it can
        merely put less and less probability far from the limit, or its mean distance from the limit can shrink, or only
        its histogram can converge. A bump that sweeps across [0, 1) forever is small in probability but never settles at
        any point; a tall thin spike vanishes at every point but keeps its mass.
      </p>
      <ModesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="four modes">
        <p>Let <M>{"X, X_1, X_2, \\dots"}</M> be random variables, with distribution functions <M>{"F, F_n"}</M>.</p>
        <ul>
          <li>Almost surely: <M>{"P(X_n \\to X) = 1"}</M>.</li>
          <li>In probability: <M>{"P(|X_n - X| > \\varepsilon) \\to 0"}</M> for every ε &gt; 0.</li>
          <li>In <M>{"L^p"}</M>, p ≥ 1: <M>{"\\mathbb E|X_n - X|^p \\to 0"}</M>.</li>
          <li>In distribution: <M>{"F_n(x) \\to F(x)"}</M> at every x where F is continuous, written <M>{"X_n \\Rightarrow X"}</M>.</li>
        </ul>
        <p>
          The first three need the variables on one probability space; the last compares laws only. On a grid of ω the
          first three can be estimated directly (<C>prob_far</C>, <C>mean_abs</C>, and <C>tail_sup</C> for the behaviour at one ω).
        </p>
        <Code>{MODES}</Code>
      </Definition>

      <Theorem title="the implications">
        <p>
          Almost sure convergence implies convergence in probability. Convergence in <M>{"L^p"}</M> implies convergence in probability.
          Convergence in probability implies convergence in distribution. No other implication holds in general.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"X_n \\to X"}</M> a.s., the indicators <M>{"\\mathbb 1[|X_n - X| > \\varepsilon]"}</M> tend to 0 a.s. and are bounded by 1, so dominated
          convergence (m18.2.2) sends their means to 0. For <M>{"L^p"}</M>, Markov gives{" "}
          <M>{"P(|X_n - X| > \\varepsilon) \\le \\varepsilon^{-p}\\mathbb E|X_n - X|^p"}</M>. For distribution, if x is a continuity point then
        </p>
        <MD>{"F(x - \\varepsilon) - P(|X_n - X| > \\varepsilon) \\le F_n(x) \\le F(x + \\varepsilon) + P(|X_n - X| > \\varepsilon),"}</MD>
        <p>
          so the limit points of <M>{"F_n(x)"}</M> lie in <M>{"[F(x - \\varepsilon), F(x + \\varepsilon)]"}</M> for every ε, which shrinks to F(x). The
          figure supplies the counterexamples: the typewriter (in probability and in mean, not a.s.), the spike{" "}
          <M>{"n\\mathbb 1_{[0, 1/n)}"}</M> (a.s., not in mean), and the binary digits (in distribution, not in probability).
        </p>
      </Proof>

      <Theorem title="a subsequence converges almost surely">
        <p>If <M>{"X_n \\to X"}</M> in probability, some subsequence <M>{"X_{n_k} \\to X"}</M> almost surely.</p>
      </Theorem>
      <Proof>
        <p>
          Choose <M>{"n_k"}</M> increasing with <M>{"P(|X_{n_k} - X| > 1/k) \\le 2^{-k}"}</M>. These probabilities are summable, so by the first
          Borel-Cantelli lemma (m18.3.3) almost surely <M>{"|X_{n_k} - X| \\le 1/k"}</M> for all large k. In the typewriter, the subsequence
          of first intervals <M>{"[0, 2^{-k})"}</M> converges to 0 at every ω &gt; 0.
        </p>
      </Proof>

      <Theorem title="from probability to mean">
        <p>
          If <M>{"X_n \\to X"}</M> in probability and <M>{"|X_n| \\le Y"}</M> with Y integrable, then <M>{"X_n \\to X"}</M> in <M>{"L^1"}</M>. More generally
          this holds exactly when the <M>{"X_n"}</M> are uniformly integrable:{" "}
          <M>{"\\sup_n \\mathbb E\\big[|X_n|\\, \\mathbb 1[|X_n| > K]\\big] \\to 0"}</M> as K → ∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose not: some subsequence has <M>{"\\mathbb E|X_{n} - X| \\ge \\delta"}</M>. By the previous theorem a further subsequence converges
          a.s., and dominated convergence with bound 2Y sends its mean distance to 0, a contradiction. The spike fails
          uniform integrability: all its mass sits above any K once n &gt; K.
        </p>
      </Proof>

      <Example title="convergence in distribution">
        <p>
          The empirical distribution function of a sample (<C>ecdf</C>) estimates F, and the Kolmogorov-Smirnov distance{" "}
          <C>ks_distance</C> measures the largest gap. If <M>{"M_n"}</M> is the maximum of n independent uniforms, then{" "}
          <M>{"P(n(1 - M_n) \\le t) = 1 - (1 - t/n)^n \\to 1 - e^{-t}"}</M> (<C>scaled_max_cdf</C>). So <M>{"n(1 - M_n) \\Rightarrow"}</M> Exponential(1),
          although the values <M>{"n(1 - M_n)"}</M> do not converge for any fixed ω.
        </p>
        <Code>{DIST}</Code>
      </Example>

      <Remark title="limits that are constants">
        <p>
          If the limit is a constant c, convergence in distribution implies convergence in probability, since{" "}
          <M>{"P(|X_n - c| > \\varepsilon) \\le F_n(c - \\varepsilon) + 1 - F_n(c + \\varepsilon) \\to 0"}</M>. This is why the weak law of m7.7.1 can be
          stated either way. Conversely, Skorokhod&apos;s theorem says that if <M>{"X_n \\Rightarrow X"}</M>, the quantile transforms of
          m18.3.1, all applied to one uniform U, converge almost surely: a weak mode can always be realised by the strongest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cheb",
      rung: "check",
      prompt: (
        <p>
          X̄ is the mean of 100 independent variables with mean μ and variance 4. Give the Chebyshev bound on
          P(|X̄ − μ| &gt; 0.5).
        </p>
      ),
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0001 },
    },
    {
      key: "spike",
      rung: "check",
      prompt: <p>For the spike Xₙ = n·1[0, 1/n) on [0, 1) with Lebesgue measure, compute E[min(Xₙ, 1)] when n = 200.</p>,
      answer: { kind: "numeric", value: 0.005, tolerance: 0.0001 },
    },
    {
      key: "sub",
      rung: "apply",
      prompt: <p>Xₙ → X in probability. Which of these is guaranteed?</p>,
      answer: {
        kind: "choice",
        options: [
          "Some subsequence converges to X almost surely",
          "Xₙ → X almost surely",
          "E|Xₙ − X| → 0",
          "Xₙ(ω) → X(ω) for at least one ω",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def prob_far(X, n, eps, grid):
    return sum(1 for w in grid if abs(X(n, w)) > eps) / len(grid)

def mean_abs(X, n, grid):
    return sum(abs(X(n, w)) for w in grid) / len(grid)

def tail_sup(X, w, n, N):
    return max(abs(X(k, w)) for k in range(n, N))

grid = [(i + 0.5) / 100 for i in range(100)]; spike = lambda n, w: n if w < 1 / n else 0; power = lambda n, w: w ** n; print(prob_far(spike, 10, 0.5, grid), mean_abs(spike, 10, grid), prob_far(power, 2, 0.5, grid))
print(tail_sup(spike, 0.3, 5, 50), tail_sup(spike, 0.005, 5, 50), round(mean_abs(power, 3, grid), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.1 1.0 0.29\n0 49 0.25",
          "0.1 1.0 0.29\n0 10 0.25",
          "0.1 0.1 0.29\n0 49 0.25",
          "0.9 1.0 0.71\n5 49 0.3333",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ecdf(xs, x):
    return sum(1 for v in xs if v <= x) / len(xs)

def ks_distance(xs, F):
    xs = sorted(xs)
    m = len(xs)
    return max(max(abs((i + 1) / m - F(v)), abs(i / m - F(v))) for i, v in enumerate(xs))

def scaled_max_cdf(n, t):
    if t <= 0:
        return 0.0
    return 1 - (1 - t / n) ** n if t < n else 1.0

print(ecdf([3, 1, 2, 2], 2), ecdf([3, 1, 2, 2], 0.5), round(ks_distance([0.1, 0.5, 0.9], lambda x: x), 4))
print(scaled_max_cdf(2, 1), scaled_max_cdf(4, 2), scaled_max_cdf(3, 5), round(ks_distance([0.25, 0.75], lambda x: x), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 0.0 0.2333\n0.75 0.9375 1.0 0.25",
          "0.5 0.0 0.2333\n0.75 0.9375 1.0 0.25",
          "0.75 0.0 0.1\n0.75 0.875 1.0 0.25",
          "0.75 0.25 0.2333\n0.5 0.9375 0.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A sequence is a function X(n, ω) and a grid is a list of ω values standing in for [0, 1). Write{" "}
          <C>prob_far(X, n, eps, grid)</C>, the fraction of the grid where |X(n, ω)| &gt; eps; <C>mean_abs(X, n, grid)</C>; and{" "}
          <C>tail_sup(X, w, n, N)</C>, the largest |X(k, w)| for n ≤ k &lt; N.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def prob_far(X, n, eps, grid):
    return 0.0

def mean_abs(X, n, grid):
    return 0.0

def tail_sup(X, w, n, N):
    return 0.0
`,
        solution: MODES,
        tests: [
          { name: "grid", code: `g = [(i + 0.5) / 10 for i in range(10)]
X = lambda n, w: w * n
assert abs(prob_far(X, 2, 1.0, g) - 0.5) < 1e-12 and abs(mean_abs(X, 2, g) - 1.0) < 1e-9` },
          { name: "tail", code: `assert abs(tail_sup(lambda n, w: (-1) ** n / n, 0.1, 2, 10) - 0.5) < 1e-12 and tail_sup(lambda n, w: n * w, 0.5, 1, 5) == 2.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ecdf(xs, x)</C>, <C>ks_distance(xs, F)</C>, the largest gap between the empirical distribution function of xs
          and F (check both sides of each jump), and <C>scaled_max_cdf(n, t)</C> = P(n(1 − Mₙ) ≤ t) for the maximum Mₙ of n
          independent uniforms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ecdf(xs, x):
    return 0.0

def ks_distance(xs, F):
    return 0.0

def scaled_max_cdf(n, t):
    return 0.0
`,
        solution: DIST,
        tests: [
          { name: "ks", code: `assert abs(ecdf([1, 2, 3, 4], 2.5) - 0.5) < 1e-12 and abs(ks_distance([0.5], lambda x: x) - 0.5) < 1e-12 and abs(ks_distance([0.2, 0.4, 0.6, 0.8], lambda x: x) - 0.2) < 1e-12` },
          { name: "max", code: `assert abs(scaled_max_cdf(1, 0.5) - 0.5) < 1e-12 and scaled_max_cdf(2, -1) == 0.0 and abs(scaled_max_cdf(10, 3) - 0.9717524751) < 1e-9` },
        ],
      },
    },
    {
      key: "gumbel",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"M_n"}</M> is the maximum of n independent Exponential(1) variables. Compute <M>{"\\lim_n P(M_n - \\ln n \\le 0)"}</M>. Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3679, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Part 4 asks when one measure can be written as a density times another. That question underlies likelihood ratios,
        KL divergence and, in Part 5, conditional expectation itself.
      </p>
    </>
  ),
};
