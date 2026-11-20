import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LindebergViz } from "@/components/viz/LindebergViz";
import type { LessonContent } from "@/lib/types";

const CONDITIONS = `def var(law):
    return sum(p * x * x for x, p in law.items())

def lindeberg_sum(laws, eps):
    s2 = sum(var(L) for L in laws)
    cut = eps * s2 ** 0.5
    return sum(p * x * x for L in laws for x, p in L.items() if abs(x) > cut) / s2

def lyapunov_ratio(laws, delta):
    s2 = sum(var(L) for L in laws)
    return sum(p * abs(x) ** (2 + delta) for L in laws for x, p in L.items()) / s2 ** (1 + delta / 2)`;

const EXACT = `import math

def convolve_all(laws):
    dist = {0: 1.0}
    for L in laws:
        new = {}
        for s, p in dist.items():
            for x, q in L.items():
                new[s + x] = new.get(s + x, 0) + p * q
        dist = new
    return dist

def normal_cdf(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def ks_to_normal(pmf):
    s = math.sqrt(sum(p * x * x for x, p in pmf.items()))
    F, worst = 0.0, 0.0
    for x in sorted(pmf):
        z = normal_cdf(x / s)
        worst = max(worst, abs(F - z))
        F += pmf[x]
        worst = max(worst, abs(F - z))
    return worst`;

export const lesson: LessonContent = {
  id: "m18.6.3",
  minutes: 55,
  links: {
    requires: ["m18.6.2"],
    revisits: ["m7.7.2", "m18.6.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        The number of records in a random permutation of n items is a sum of independent Bernoulli variables with
        different success probabilities 1, 1/2, 1/3, …, 1/n. Measurement errors are sums of many small independent
        effects of different sizes. Neither is a sum of identically distributed terms, yet both look normal. When does a
        sum of independent, non-identical terms obey the central limit theorem, and when must it fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The normal limit is what is left when no single term matters. If one term carries a fixed share of the variance,
        its own shape survives in the sum. If the variance is carried by rare large values, the sum counts rare events and
        becomes Poisson. Lindeberg&apos;s condition says precisely that the variance coming from terms that are large relative to
        the total spread vanishes.
      </p>
      <LindebergViz />
    </>
  ),

  theory: (
    <>
      <Definition title="triangular arrays and the Lindeberg condition">
        <p>
          For each n let <M>{"X_{n,1}, \\dots, X_{n,k_n}"}</M> be independent with mean 0 and finite variances <M>{"\\sigma_{n,k}^2"}</M>, and let{" "}
          <M>{"s_n^2 = \\sum_k \\sigma_{n,k}^2"}</M> and <M>{"S_n = \\sum_k X_{n,k}"}</M>. The Lindeberg condition is
        </p>
        <MD>{"L_n(\\varepsilon) = \\frac{1}{s_n^2} \\sum_{k=1}^{k_n} \\mathbb E\\big[X_{n,k}^2\\, \\mathbb 1[|X_{n,k}| > \\varepsilon s_n]\\big] \\to 0 \\quad \\text{for every } \\varepsilon > 0."}</MD>
        <p>
          It implies that the largest variance share <M>{"\\max_k \\sigma_{n,k}^2 / s_n^2"}</M> tends to 0, since{" "}
          <M>{"\\sigma_{n,k}^2 \\le \\varepsilon^2 s_n^2 + s_n^2 L_n(\\varepsilon)"}</M>. For laws with finitely many values both are finite sums (
          <C>lindeberg_sum</C>).
        </p>
        <Code>{CONDITIONS}</Code>
      </Definition>

      <Theorem title="Lindeberg-Feller">
        <p>
          Under the Lindeberg condition, <M>{"S_n / s_n \\Rightarrow N(0, 1)"}</M>. Conversely (Feller), if{" "}
          <M>{"\\max_k \\sigma_{n,k}^2 / s_n^2 \\to 0"}</M> and <M>{"S_n / s_n \\Rightarrow N(0, 1)"}</M>, then the Lindeberg condition holds.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take <M>{"s_n = 1"}</M>. By Lévy&apos;s continuity theorem (m18.6.2) it suffices that{" "}
          <M>{"\\prod_k \\varphi_{n,k}(t) \\to e^{-t^2/2}"}</M>. For complex numbers of modulus at most 1,{" "}
          <M>{"|\\prod a_k - \\prod b_k| \\le \\sum |a_k - b_k|"}</M>. Compare <M>{"a_k = \\varphi_{n,k}(t)"}</M> with{" "}
          <M>{"b_k = 1 - \\tfrac12 t^2\\sigma_{n,k}^2"}</M>. Using{" "}
          <M>{"|e^{ix} - 1 - ix + \\tfrac12 x^2| \\le \\min(|x|^3/6,\\, x^2)"}</M>, split each expectation at <M>{"|X_{n,k}| = \\varepsilon"}</M>:
        </p>
        <MD>{"\\sum_k |a_k - b_k| \\le \\frac{|t|^3}{6}\\, \\varepsilon \\sum_k \\sigma_{n,k}^2 + t^2 L_n(\\varepsilon) = \\frac{|t|^3 \\varepsilon}{6} + t^2 L_n(\\varepsilon)."}</MD>
        <p>
          Let n → ∞, then ε → 0. Finally <M>{"\\prod_k (1 - \\tfrac12 t^2 \\sigma_{n,k}^2) \\to e^{-t^2/2}"}</M> because the largest{" "}
          <M>{"\\sigma_{n,k}^2"}</M> tends to 0 and their sum is 1. Feller&apos;s converse compares the real parts of{" "}
          <M>{"\\log \\varphi_{n,k}"}</M> with <M>{"-\\tfrac12 t^2\\sigma_{n,k}^2"}</M> in the same way, and we omit it.
        </p>
      </Proof>

      <Theorem title="Lyapunov's condition">
        <p>
          If <M>{"s_n^{-(2+\\delta)} \\sum_k \\mathbb E|X_{n,k}|^{2+\\delta} \\to 0"}</M> for some δ &gt; 0, the Lindeberg condition holds (
          <C>lyapunov_ratio</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          On <M>{"\\{|X| > \\varepsilon s_n\\}"}</M>, <M>{"X^2 \\le |X|^{2+\\delta} / (\\varepsilon s_n)^{\\delta}"}</M>, so{" "}
          <M>{"L_n(\\varepsilon) \\le \\varepsilon^{-\\delta}"}</M> times the Lyapunov ratio.
        </p>
      </Proof>

      <Example title="i.i.d. steps and records">
        <p>
          For i.i.d. steps with variance σ², <M>{"L_n(\\varepsilon) = \\sigma^{-2}\\,\\mathbb E[X^2 \\mathbb 1[|X| > \\varepsilon\\sigma\\sqrt n]] \\to 0"}</M> by
          dominated convergence, which recovers the classical theorem of m7.7.2 with only a second moment. For records in a
          random permutation, the k-th item is a record with probability 1/k, independently, so the count has mean{" "}
          <M>{"H_n \\approx \\ln n"}</M> and variance <M>{"\\sum_k (1/k)(1 - 1/k) \\to \\infty"}</M>; the terms are bounded, so Lindeberg holds and
          the count is approximately normal with mean and variance near ln n.
        </p>
      </Example>

      <Remark title="failures and rates">
        <p>
          The figure shows both failures. A single step of size 2√n keeps four fifths of the variance, and the limit is a
          mixture of two normals. Bernoulli(1/n) jumps carry all their variance in values of size about 1 = <M>{"s_n"}</M>, so{" "}
          <M>{"L_n \\to 1"}</M> and the sum is Poisson. When the condition holds, the Berry-Esseen theorem bounds the error:{" "}
          <M>{"\\sup_x |P(S_n/s_n \\le x) - \\Phi(x)| \\le C \\sum_k \\mathbb E|X_{n,k}|^3 / s_n^3"}</M> with C below 0.56, which the exact
          distances computed by <C>convolve_all</C> and <C>ks_to_normal</C> respect.
        </p>
        <Code>{EXACT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lyap",
      rung: "check",
      prompt: <p>For 100 independent fair ±1 signs, compute the Lyapunov ratio with δ = 1.</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "records",
      rung: "check",
      prompt: <p>Compute the variance of the number of records in a uniformly random permutation of 10 items. Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.3792, tolerance: 0.0001 },
    },
    {
      key: "share",
      rung: "apply",
      prompt: <p>In a triangular array, one term always carries half of the variance of the row sum. What can you conclude?</p>,
      answer: {
        kind: "choice",
        options: [
          "Lindeberg fails, and the limit is normal only if that term is itself normal",
          "The central limit theorem still holds, because the other terms are small",
          "Lindeberg holds, because each term has finite variance",
          "The row sums cannot converge in distribution",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def var(law):
    return sum(p * x * x for x, p in law.items())

def lindeberg_sum(laws, eps):
    s2 = sum(var(L) for L in laws)
    cut = eps * s2 ** 0.5
    return sum(p * x * x for L in laws for x, p in L.items() if abs(x) > cut) / s2

def lyapunov_ratio(laws, delta):
    s2 = sum(var(L) for L in laws)
    return sum(p * abs(x) ** (2 + delta) for L in laws for x, p in L.items()) / s2 ** (1 + delta / 2)

coin = {-1: 0.5, 1: 0.5}; big = {-3: 0.5, 3: 0.5}; print(var(big), lindeberg_sum([coin] * 9, 0.5), lindeberg_sum([coin] * 9 + [big], 0.5), lindeberg_sum([coin] * 9 + [big], 0.99))
print(round(lyapunov_ratio([coin] * 4, 1), 4), round(lyapunov_ratio([coin] * 16, 1), 4), round(lyapunov_ratio([big], 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "9.0 0.0 0.5 0.0\n0.5 0.25 1.0",
          "9.0 1.0 0.5 0.0\n0.5 0.25 1.0",
          "9.0 0.0 0.5 0.5\n0.5 0.25 1.0",
          "3.0 0.0 0.3333 0.0\n0.25 0.0625 1.0",
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

def convolve_all(laws):
    dist = {0: 1.0}
    for L in laws:
        new = {}
        for s, p in dist.items():
            for x, q in L.items():
                new[s + x] = new.get(s + x, 0) + p * q
        dist = new
    return dist

def normal_cdf(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def ks_to_normal(pmf):
    s = math.sqrt(sum(p * x * x for x, p in pmf.items()))
    F, worst = 0.0, 0.0
    for x in sorted(pmf):
        z = normal_cdf(x / s)
        worst = max(worst, abs(F - z))
        F += pmf[x]
        worst = max(worst, abs(F - z))
    return worst

print(sorted(convolve_all([coin, coin]).items()), convolve_all([]), round(normal_cdf(0), 4), round(normal_cdf(1.0), 4))
print(round(ks_to_normal({-1: 0.5, 1: 0.5}), 4), round(ks_to_normal(convolve_all([coin] * 2)), 4), round(ks_to_normal(convolve_all([coin] * 4)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(-2, 0.25), (0, 0.5), (2, 0.25)] {0: 1.0} 0.5 0.8413\n0.3413 0.25 0.1875",
          "[(-2, 0.25), (0, 0.5), (2, 0.25)] {} 0.5 0.8413\n0.3413 0.25 0.1875",
          "[(-2, 0.25), (0, 0.5), (2, 0.25)] {0: 1.0} 0.5 0.8413\n0.5 0.25 0.125",
          "[(-1, 0.25), (0, 0.5), (1, 0.25)] {0: 1.0} 0.0 0.6827\n0.3413 0.25 0.1875",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A row of a triangular array is a list of mean-zero laws, each a dict of weights. Write <C>var(law)</C>,{" "}
          <C>lindeberg_sum(laws, eps)</C> and <C>lyapunov_ratio(laws, delta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def var(law):
    return 0.0

def lindeberg_sum(laws, eps):
    return 0.0

def lyapunov_ratio(laws, delta):
    return 0.0
`,
        solution: CONDITIONS,
        tests: [
          { name: "lindeberg", code: `c = {-1: 0.5, 1: 0.5}
assert abs(var({-2: 0.5, 2: 0.5}) - 4) < 1e-12 and abs(lindeberg_sum([c] * 4, 0.4) - 1.0) < 1e-12 and lindeberg_sum([c] * 4, 0.6) == 0` },
          { name: "lyapunov", code: `assert abs(lyapunov_ratio([{-1: 0.5, 1: 0.5}] * 9, 1) - 1 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>convolve_all(laws)</C>, the exact law of the sum; <C>normal_cdf(z)</C> using <C>math.erf</C>; and{" "}
          <C>ks_to_normal(pmf)</C>, the largest gap between the distribution function of a mean-zero pmf, scaled by its standard
          deviation, and Φ, checked on both sides of every atom.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def convolve_all(laws):
    return {0: 1.0}

def normal_cdf(z):
    return 0.5

def ks_to_normal(pmf):
    return 0.0
`,
        solution: EXACT,
        tests: [
          { name: "convolve", code: `d = convolve_all([{0: 0.5, 1: 0.5}] * 3)
assert abs(d[1] - 0.375) < 1e-12 and abs(normal_cdf(-1) - 0.1586552539) < 1e-9` },
          { name: "ks", code: `assert abs(ks_to_normal(convolve_all([{-1: 0.5, 1: 0.5}] * 3)) - 0.2181485692) < 1e-9 and abs(ks_to_normal({-3: 0.5, 3: 0.5}) - 0.3413447461) < 1e-9` },
        ],
      },
    },
    {
      key: "mixture",
      rung: "stretch",
      prompt: (
        <p>
          Row n has n fair ±1 signs and one extra independent step ±√n. Find the limit law of <M>{"S_n / s_n"}</M> and compute the limit
          of <M>{"P(S_n / s_n \\le 0.5)"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6705, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This completes the measure-theoretic foundation: laws as measures, expectations as integrals, densities as
        Radon-Nikodym derivatives, conditioning as projection, and the limit theorems proved with martingales and Fourier
        transforms. Stochastic processes in continuous time, such as Brownian motion, are built on exactly these tools.
      </p>
    </>
  ),
};
