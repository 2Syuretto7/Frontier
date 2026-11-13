import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PoissonLimitViz } from "@/components/viz/PoissonLimitViz";
import type { LessonContent } from "@/lib/types";

const PMFS = `from math import comb, exp, lgamma, log

def binom_pmf(n, p, k):
    return comb(n, k) * p ** k * (1 - p) ** (n - k)

def poisson_pmf(lam, k):
    return exp(-lam + k * log(lam) - lgamma(k + 1))

def tv_distance(n, lam):
    p = lam / n
    inside = sum(abs(binom_pmf(n, p, k) - poisson_pmf(lam, k)) for k in range(n + 1))
    tail = 1 - sum(poisson_pmf(lam, k) for k in range(n + 1))
    return (inside + tail) / 2`;

const SAMPLE = `import numpy as np

def sample_categorical(probs, u):
    return np.searchsorted(np.cumsum(probs), u, side='right')

def geometric_from_uniform(p, u):
    return np.ceil(np.log(1 - u) / np.log(1 - p)).astype(int)`;

export const lesson: LessonContent = {
  id: "m7.2.2",
  minutes: 65,
  links: {
    requires: ["m7.2.1", "m4.1.2"],
    revisits: ["m2.8.5"],
    foreshadows: ["m7.2.3", "m7.3.2", "m7.3.3"],
  },

  puzzle: (
    <>
      <p>
        Ten thousand users each have a 0.03% chance of sending a request in a given minute, independently. What is the chance
        of more than six requests in a minute? The exact binomial answer needs huge binomial coefficients and tiny powers; a
        single number, the average rate 3, turns out to be almost all you need.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A few distributions arise again and again because they come from simple stories. Count successes in a fixed number
        of independent trials: binomial. Wait for the first success: geometric. Count rare events among very many chances:
        Poisson, the limit of the binomial when trials are many and each is unlikely. Pick one of K labels: categorical.
      </p>
      <PoissonLimitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Bernoulli and binomial">
        <p>
          X ~ Bernoulli(p) takes the value 1 with probability p and 0 otherwise. X ~ Binomial(n, p) is the number of
          successes in n independent Bernoulli(p) trials.
        </p>
      </Definition>
      <Theorem title="binomial pmf">
        <p>
          <M>{"P(X = k) = \\binom{n}{k}p^k(1-p)^{n-k}"}</M> for k = 0, …, n.
        </p>
      </Theorem>
      <Proof>
        <p>
          A particular sequence with k successes and n − k failures has probability <M>{"p^k(1-p)^{n-k}"}</M> by
          independence, and there are <M>{"\\binom{n}{k}"}</M> such sequences, which are disjoint events. By the binomial
          theorem the probabilities add to <M>{"(p + 1 - p)^n = 1"}</M>.
        </p>
      </Proof>

      <Definition title="geometric">
        <p>
          X ~ Geometric(p) is the number of independent Bernoulli(p) trials up to and including the first success:{" "}
          <M>{"P(X = k) = (1-p)^{k-1}p"}</M> for k = 1, 2, …, and <M>{"P(X > k) = (1-p)^k"}</M>. (Some books count only the
          failures before the success, shifting everything by one.)
        </p>
      </Definition>
      <Theorem title="memorylessness">
        <p>
          A Geometric(p) variable satisfies <M>{"P(X > m + n \\mid X > m) = P(X > n)"}</M> for all m, n ≥ 0. Conversely, a
          random variable on 1, 2, … with this property and 0 &lt; P(X &gt; 1) &lt; 1 is geometric.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"P(X > m+n)/P(X > m) = (1-p)^{m+n}/(1-p)^m = (1-p)^n"}</M>. Conversely, let <M>{"S(n) = P(X > n)"}</M>; the
          property says <M>{"S(m + n) = S(m)S(n)"}</M>, so <M>{"S(n) = S(1)^n"}</M> by induction. With q = S(1) this gives{" "}
          <M>{"P(X = k) = S(k-1) - S(k) = q^{k-1}(1-q)"}</M>, the Geometric(1 − q) pmf.
        </p>
      </Proof>

      <Definition title="Poisson">
        <p>
          X ~ Poisson(λ), for λ &gt; 0, has <M>{"P(X = k) = e^{-\\lambda}\\lambda^k/k!"}</M> for k = 0, 1, 2, …. These add to 1
          because <M>{"\\sum_k \\lambda^k/k! = e^{\\lambda}"}</M>.
        </p>
      </Definition>
      <Theorem title="the Poisson limit">
        <p>
          If n → ∞ with <M>{"p = \\lambda/n"}</M>, then for each fixed k,{" "}
          <M>{"\\binom{n}{k}p^k(1-p)^{n-k} \\to e^{-\\lambda}\\lambda^k/k!"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>Rewrite the binomial probability as</p>
        <MD>{"\\frac{\\lambda^k}{k!}\\cdot\\frac{n(n-1)\\cdots(n-k+1)}{n^k}\\cdot\\Big(1 - \\frac{\\lambda}{n}\\Big)^{n}\\cdot\\Big(1 - \\frac{\\lambda}{n}\\Big)^{-k}."}</MD>
        <p>
          The second factor is a product of k terms each tending to 1, the third tends to <M>{"e^{-\\lambda}"}</M>, and the
          fourth to 1, since k is fixed.
        </p>
        <Code>{PMFS}</Code>
      </Proof>
      <Remark title="how good is the approximation">
        <p>
          Le Cam&apos;s inequality says that if <M>{"X_1, \\dots, X_n"}</M> are independent Bernoulli(<M>{"p_i"}</M>), then
          for every set A of integers,{" "}
          <M>{"|P(\\sum X_i \\in A) - P(Y \\in A)| \\le \\sum p_i^2"}</M>, where Y ~ Poisson(<M>{"\\sum p_i"}</M>). The trials
          need not even have equal probabilities: many independent, individually rare events give a Poisson count. For the
          puzzle the bound is <M>{"10^4 \\cdot (3 \\times 10^{-4})^2 = 0.0009"}</M>.
        </p>
      </Remark>

      <Definition title="categorical">
        <p>
          X ~ Categorical(<M>{"p_1, \\dots, p_K"}</M>) takes value i with probability <M>{"p_i"}</M>. It is the distribution
          of the next token of a language model, given by a softmax. Its one-hot encoding is a vector of K Bernoulli variables
          summing to 1, and the counts of each label in n independent draws are multinomial.
        </p>
      </Definition>

      <Example title="sampling by inversion">
        <p>
          With U uniform on [0, 1), the index of the first cumulative sum <M>{"p_1 + \\dots + p_i"}</M> exceeding U is
          categorical: it equals i exactly when U lands in an interval of length <M>{"p_i"}</M>. For the geometric,{" "}
          <M>{"X = \\lceil \\log(1 - U)/\\log(1 - p) \\rceil"}</M> works, because X &gt; k exactly when{" "}
          <M>{"1 - U < (1-p)^k"}</M>, which has probability <M>{"(1-p)^k"}</M>. Every discrete distribution can be sampled
          this way from one uniform number.
        </p>
        <Code>{SAMPLE}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "heads3",
      rung: "check",
      prompt: <p>A fair coin is tossed 10 times. What is the probability of exactly 3 heads? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1172, tolerance: 0.0001 },
    },
    {
      key: "geo",
      rung: "check",
      prompt: <p>X ~ Geometric(0.2), counting trials up to the first success. What is P(X &gt; 5)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3277, tolerance: 0.0001 },
    },
    {
      key: "memory",
      rung: "apply",
      prompt: <p>A die has been rolled 10 times without a six. What is the probability that the next three rolls also contain no six?</p>,
      answer: { kind: "choice", options: ["(5/6)³", "(5/6)¹³", "1 − (5/6)³", "(1/6)(5/6)³"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb, exp, lgamma, log

def binom_pmf(n, p, k):
    return comb(n, k) * p ** k * (1 - p) ** (n - k)

def poisson_pmf(lam, k):
    return exp(-lam + k * log(lam) - lgamma(k + 1))

def tv_distance(n, lam):
    p = lam / n
    inside = sum(abs(binom_pmf(n, p, k) - poisson_pmf(lam, k)) for k in range(n + 1))
    tail = 1 - sum(poisson_pmf(lam, k) for k in range(n + 1))
    return (inside + tail) / 2

print(round(binom_pmf(10, 0.3, 3), 4), round(poisson_pmf(3.0, 3), 4))
print(round(sum(binom_pmf(10, 0.3, k) for k in range(11)), 6), poisson_pmf(2.0, 0) == exp(-2))
print(round(tv_distance(10, 3.0), 4), round(tv_distance(1000, 3.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2668 0.224\n1.0 True\n0.0864 0.0008",
          "0.2668 0.224\n1.0 False\n0.0864 0.0008",
          "0.2335 0.224\n1.0 True\n0.0864 0.0008",
          "0.2668 0.224\n1.0 True\n0.0008 0.0864",
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

def sample_categorical(probs, u):
    return np.searchsorted(np.cumsum(probs), u, side='right')

def geometric_from_uniform(p, u):
    return np.ceil(np.log(1 - u) / np.log(1 - p)).astype(int)

print(sample_categorical([0.2, 0.5, 0.3], np.array([0.1, 0.2, 0.69, 0.71, 0.95])))
print(geometric_from_uniform(0.5, np.array([0.1, 0.5, 0.6, 0.9])))
u = np.random.default_rng(0).random(100000)
print(np.bincount(sample_categorical([0.2, 0.5, 0.3], u)).round(-3), round(geometric_from_uniform(0.25, u).mean(), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0 1 1 2 2]\n[1 1 2 4]\n[20000 50000 30000] 4.0",
          "[0 0 1 2 2]\n[1 1 2 4]\n[20000 50000 30000] 4.0",
          "[0 1 1 2 2]\n[1 1 2 3]\n[20000 50000 30000] 4.0",
          "[0 1 1 2 2]\n[1 1 2 4]\n[20000 50000 30000] 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_pmf(n, p, k)</C>, <C>poisson_pmf(lam, k)</C> (computed through logarithms so that large k does not
          overflow), and <C>tv_distance(n, lam)</C>, the total variation distance between Binomial(n, lam/n) and Poisson(lam):
          half the sum of absolute differences of the pmfs over all k, where for k &gt; n the binomial is 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb, exp, lgamma, log

def binom_pmf(n, p, k):
    return 0.0

def poisson_pmf(lam, k):
    return 0.0

def tv_distance(n, lam):
    return 0.0
`,
        solution: PMFS,
        tests: [
          { name: "pmfs", code: `assert abs(binom_pmf(10, 0.5, 3) - 120 / 1024) < 1e-12
assert abs(sum(binom_pmf(20, 0.3, k) for k in range(21)) - 1) < 1e-12
assert abs(poisson_pmf(3.0, 3) - exp(-3) * 4.5) < 1e-12
assert abs(sum(poisson_pmf(4.0, k) for k in range(100)) - 1) < 1e-12 and poisson_pmf(4.0, 500) >= 0` },
          { name: "total variation", code: `assert abs(tv_distance(10, 3.0) - 0.08641) < 1e-4
d = [tv_distance(n, 2.0) for n in (10, 100, 1000)]
assert d[0] > d[1] > d[2] and d[2] < 2.0 ** 2 / 1000
assert 0 <= tv_distance(3, 2.0) <= 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_categorical(probs, u)</C>, which maps an array of uniform numbers to category indices by inversion
          (the first index whose cumulative sum exceeds u), and <C>geometric_from_uniform(p, u)</C>, which maps them to
          Geometric(p) values (trials up to the first success) as an integer array.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_categorical(probs, u):
    return np.zeros(len(u), dtype=int)

def geometric_from_uniform(p, u):
    return np.ones(len(u), dtype=int)
`,
        solution: SAMPLE,
        tests: [
          { name: "categorical", code: `assert list(sample_categorical([0.2, 0.5, 0.3], np.array([0.0, 0.19, 0.2, 0.69, 0.71, 0.999]))) == [0, 0, 1, 1, 2, 2]
u = np.random.default_rng(1).random(200000)
f = np.bincount(sample_categorical([0.1, 0.6, 0.3], u), minlength=3) / len(u)
assert np.allclose(f, [0.1, 0.6, 0.3], atol=0.005)` },
          { name: "geometric", code: `assert list(geometric_from_uniform(0.5, np.array([0.1, 0.5, 0.6, 0.9]))) == [1, 1, 2, 4]
u = np.random.default_rng(2).random(200000)
g = geometric_from_uniform(0.3, u)
assert g.min() >= 1 and abs(g.mean() - 1 / 0.3) < 0.03 and abs(np.mean(g > 4) - 0.7 ** 4) < 0.005` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for fixed λ &gt; 0 and fixed k, <M>{"\\binom{n}{k}(\\lambda/n)^k(1-\\lambda/n)^{n-k} \\to e^{-\\lambda}\\lambda^k/k!"}</M>{" "}
          as n → ∞.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the expression as (λᵏ/k!) · [n(n−1)⋯(n−k+1)/nᵏ] · (1 − λ/n)ⁿ · (1 − λ/n)^(−k).",
          "Shows n(n−1)⋯(n−k+1)/nᵏ → 1 because it is a product of k factors (1 − j/n), with k fixed.",
          "Uses (1 − λ/n)ⁿ → e^(−λ) and (1 − λ/n)^(−k) → 1, and combines the limits.",
        ],
      },
    },
    {
      key: "requests",
      rung: "stretch",
      prompt: (
        <p>
          In the puzzle (10,000 users, each with probability 0.0003 per minute, independently), what is the probability of more
          than six requests in a minute? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0335, tolerance: 0.0005 },
    },
  ],

  teachBack:
    "Explain to a friend the stories behind the Bernoulli, binomial, geometric, Poisson and categorical distributions, why the geometric is memoryless, and why the binomial with many rare trials is nearly Poisson.",

  glimpse: (
    <>
      <p>
        Each of these distributions has a mean and a spread that follow from its story, and linearity of expectation, the
        next lesson, finds the means with almost no computation. The geometric has a continuous twin, the exponential, also
        memoryless, and the Poisson count of events in time is the start of the Poisson process.
      </p>
    </>
  ),
};
