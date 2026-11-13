import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChernoffViz } from "@/components/viz/ChernoffViz";
import type { LessonContent } from "@/lib/types";

const MGF = `import math

def mgf(dist, t):
    return sum(p * math.exp(t * x) for x, p in dist.items())

def moment(dist, k, h=1e-3):
    if k == 1:
        return (mgf(dist, h) - mgf(dist, -h)) / (2 * h)
    return (mgf(dist, h) - 2 * mgf(dist, 0) + mgf(dist, -h)) / h ** 2`;

const CHERNOFF = `from math import comb, exp

def binom_dist(n, p):
    return {k: comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)}

def chernoff(dist, a, ts):
    best = 1.0
    for t in ts:
        m = sum(p * exp(t * x) for x, p in dist.items())
        best = min(best, exp(-t * a) * m)
    return best`;

export const lesson: LessonContent = {
  id: "m7.4.1",
  minutes: 60,
  links: {
    requires: ["m7.3.4", "m2.8.4"],
    revisits: ["m7.2.2"],
    foreshadows: ["m7.4.2", "m7.7.2", "m15.1.1"],
  },

  puzzle: (
    <>
      <p>
        Toss a fair coin 100 times. How unlikely are 70 or more heads? The exact answer is a sum of 31 binomial terms. Is
        there a short argument giving a bound with the right order of magnitude, one that also works when the exact
        distribution is too complicated to write down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The moment generating function packs all the moments of X into one function, <M>{"E[e^{tX}]"}</M>. Its two great
        properties are that independent sums multiply their MGFs, turning convolutions into products, and that the MGF
        controls tails: large values of X make <M>{"e^{tX}"}</M> enormous, so a modest MGF forces large values to be rare.
        Optimising over t gives the Chernoff bound.
      </p>
      <ChernoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="moment generating function">
        <p>
          <M>{"M_X(t) = E[e^{tX}]"}</M>, for those t at which it is finite. We say X has an MGF if it is finite on an open
          interval around 0.
        </p>
      </Definition>

      <Theorem title="moments from derivatives">
        <p>
          If <M>{"M_X"}</M> is finite on (−δ, δ), then all moments of X are finite,{" "}
          <M>{"M_X(t) = \\sum_{n \\ge 0}E[X^n]\\,t^n/n!"}</M> there, and <M>{"M_X^{(n)}(0) = E[X^n]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand <M>{"e^{tX} = \\sum_n (tX)^n/n!"}</M>. For |t| &lt; δ the sum of absolute values,{" "}
          <M>{"e^{|tX|} \\le e^{tX} + e^{-tX}"}</M>, has finite expectation, which justifies taking the expectation term by
          term (a fact about exchanging sums and expectations proved in measure theory). So M is a power series with
          coefficients <M>{"E[X^n]/n!"}</M>, and power series can be differentiated term by term.
        </p>
        <Code>{MGF}</Code>
      </Proof>

      <Theorem title="sums and uniqueness">
        <p>
          If X and Y are independent, <M>{"M_{X+Y}(t) = M_X(t)M_Y(t)"}</M>. If two random variables have MGFs that agree on an
          open interval around 0, they have the same distribution (stated without proof).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"e^{t(X+Y)} = e^{tX}e^{tY}"}</M>, and functions of independent variables are independent, so the expectation
          of the product is the product of the expectations.
        </p>
      </Proof>

      <Example title="a table, and what it buys">
        <p>
          Bernoulli(p): <M>{"1 - p + pe^t"}</M>, so Binomial(n, p) has <M>{"(1 - p + pe^t)^n"}</M>. Poisson(λ):{" "}
          <M>{"\\sum_k e^{tk}e^{-\\lambda}\\lambda^k/k! = e^{\\lambda(e^t - 1)}"}</M>. Exponential(λ):{" "}
          <M>{"\\lambda/(\\lambda - t)"}</M> for t &lt; λ. Normal N(μ, σ²): completing the square,{" "}
          <M>{"e^{\\mu t + \\sigma^2t^2/2}"}</M>. Multiplying, a sum of independent Poissons is Poisson with the summed rate,
          and a sum of independent normals is normal with summed means and variances, both by uniqueness.
        </p>
      </Example>

      <Remark title="cumulants">
        <p>
          The logarithm <M>{"K(t) = \\log M(t)"}</M> is the cumulant generating function. It adds over independent sums, and
          its derivatives at 0 are the mean, the variance, and higher cumulants. For a normal, K is a quadratic, so every
          cumulant beyond the second is 0.
        </p>
      </Remark>

      <Theorem title="the Chernoff bound">
        <p>For every t &gt; 0, <M>{"P(X \\ge a) \\le e^{-ta}M_X(t)"}</M>, and so <M>{"P(X \\ge a) \\le \\inf_{t > 0}e^{-ta}M_X(t)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          For t &gt; 0, <M>{"e^{tX} \\ge e^{ta}\\mathbf{1}[X \\ge a]"}</M>, since the left side is positive and is at least{" "}
          <M>{"e^{ta}"}</M> whenever X ≥ a. Take expectations: <M>{"M_X(t) \\ge e^{ta}P(X \\ge a)"}</M>.
        </p>
        <Code>{CHERNOFF}</Code>
      </Proof>
      <p>
        For a sum of n independent bounded terms the MGF is a product of n factors, so the bound decays exponentially in n.
        For 100 fair tosses the best Chernoff bound on 70 or more heads is about <M>{"2.7 \\times 10^{-4}"}</M>, against an
        exact value of <M>{"3.9 \\times 10^{-5}"}</M>: off by a modest factor, but with the right exponential rate. This is
        the basic tool of concentration inequalities.
      </p>
      <Remark title="when there is no MGF">
        <p>
          A log-normal variable has every moment finite, yet <M>{"E[e^{tX}] = \\infty"}</M> for every t &gt; 0; a Cauchy
          variable has no mean at all. Heavy tails are exactly the situation where these exponential bounds are unavailable.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bern",
      rung: "check",
      prompt: <p>What is the MGF of a Bernoulli(0.3) variable at t = ln 2?</p>,
      answer: { kind: "numeric", value: 1.3, tolerance: 0.0001 },
    },
    {
      key: "normalvar",
      rung: "check",
      prompt: <p>X has MGF <M>{"e^{2t + 4.5t^2}"}</M> for all t. What is Var(X)?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.0001 },
    },
    {
      key: "poissum",
      rung: "apply",
      prompt: <p>X ~ Poisson(2) and Y ~ Poisson(3) are independent. What is the distribution of X + Y?</p>,
      answer: { kind: "choice", options: ["Poisson(5)", "Poisson(6)", "Binomial(5, 1/2)", "Not Poisson, since sums of Poissons are not Poisson"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def mgf(dist, t):
    return sum(p * math.exp(t * x) for x, p in dist.items())

def moment(dist, k, h=1e-3):
    if k == 1:
        return (mgf(dist, h) - mgf(dist, -h)) / (2 * h)
    return (mgf(dist, h) - 2 * mgf(dist, 0) + mgf(dist, -h)) / h ** 2

die = {x: 1 / 6 for x in range(1, 7)}
print(mgf(die, 0), round(moment(die, 1), 4), round(moment(die, 2), 3))
two = {}
for a in die:
    for b in die:
        two[a + b] = two.get(a + b, 0) + 1 / 36
print(round(mgf(two, 0.3), 6) == round(mgf(die, 0.3) ** 2, 6), round(math.log(mgf(die, 0.3)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 3.5 15.167\nTrue 1.1778", "1.0 3.5 12.25\nTrue 1.1778", "0.0 3.5 15.167\nTrue 1.1778", "1.0 3.5 15.167\nFalse 1.1778"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

from math import comb, exp

def binom_dist(n, p):
    return {k: comb(n, k) * p ** k * (1 - p) ** (n - k) for k in range(n + 1)}

def chernoff(dist, a, ts):
    best = 1.0
    for t in ts:
        m = sum(p * exp(t * x) for x, p in dist.items())
        best = min(best, exp(-t * a) * m)
    return best

b = binom_dist(100, 0.5)
exact = sum(p for k, p in b.items() if k >= 70)
print(f"{exact:.1e} {chernoff(b, 70, np.linspace(0, 2, 2001)):.1e} {exp(-2 * 20 ** 2 / 100):.1e}")
print(chernoff(b, 40, np.linspace(0, 2, 201)), round(chernoff(binom_dist(10, 0.5), 10, np.linspace(0, 20, 2001)), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.9e-05 2.7e-04 3.4e-04\n1.0 0.000977",
          "2.7e-04 3.9e-05 3.4e-04\n1.0 0.000977",
          "3.9e-05 2.7e-04 3.4e-04\n0.0 0.000977",
          "3.9e-05 2.7e-04 3.4e-04\n1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mgf(dist, t)</C> for a pmf dict, and <C>moment(dist, k, h=1e-3)</C> for k = 1 or 2, estimating E[X] by the
          central difference of the MGF at 0 and E[X²] by the second central difference.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mgf(dist, t):
    return 1.0

def moment(dist, k, h=1e-3):
    return 0.0
`,
        solution: MGF,
        tests: [
          { name: "mgf", code: `b = {0: 0.7, 1: 0.3}
assert abs(mgf(b, math.log(2)) - 1.3) < 1e-12 and mgf(b, 0) == 1.0
two = {s: 0.0 for s in range(3)}
for x in b:
    for y in b:
        two[x + y] += b[x] * b[y]
assert abs(mgf(two, 0.7) - mgf(b, 0.7) ** 2) < 1e-12` },
          { name: "moments", code: `die = {x: 1 / 6 for x in range(1, 7)}
assert abs(moment(die, 1) - 3.5) < 1e-4 and abs(moment(die, 2) - 91 / 6) < 1e-3
pois = {k: math.exp(-2) * 2 ** k / math.factorial(k) for k in range(60)}
assert abs(moment(pois, 1) - 2) < 1e-4 and abs(moment(pois, 2) - 6) < 1e-3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_dist(n, p)</C>, the Binomial pmf as a dict, and <C>chernoff(dist, a, ts)</C>, the smallest value of{" "}
          <M>{"e^{-ta}M(t)"}</M> over the given t values, capped at 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb, exp

def binom_dist(n, p):
    return {}

def chernoff(dist, a, ts):
    return 1.0
`,
        solution: CHERNOFF,
        tests: [
          { name: "binomial", code: `b = binom_dist(10, 0.3)
assert len(b) == 11 and abs(sum(b.values()) - 1) < 1e-12 and abs(b[3] - comb(10, 3) * 0.3 ** 3 * 0.7 ** 7) < 1e-15` },
          { name: "chernoff", code: `import numpy as np
b = binom_dist(100, 0.5)
exact = sum(p for k, p in b.items() if k >= 70)
c = chernoff(b, 70, np.linspace(0, 2, 2001))
assert exact <= c <= exp(-2 * 20 ** 2 / 100) and abs(c - 2.65e-4) < 1e-5
assert chernoff(b, 40, [0.0, 0.5, 1.0]) == 1.0 and abs(chernoff(binom_dist(10, 0.5), 10, [30.0]) - 0.5 ** 10) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if X and Y are independent and both have MGFs, then <M>{"M_{X+Y}(t) = M_X(t)M_Y(t)"}</M>.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes e^{t(X+Y)} = e^{tX}·e^{tY}.",
          "Notes that e^{tX} and e^{tY} are independent because they are functions of the independent X and Y.",
          "Uses E[UV] = E[U]E[V] for independent U, V with finite expectations to conclude.",
        ],
      },
    },
    {
      key: "z4",
      rung: "stretch",
      prompt: <p>Using the MGF <M>{"e^{t^2/2}"}</M> of the standard normal Z, find E[Z⁴].</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a moment generating function is, why sums of independent variables multiply their MGFs, and how optimising Markov's inequality applied to e^(tX) gives the Chernoff bound.",

  glimpse: (
    <>
      <p>
        The Chernoff argument was Markov&apos;s inequality applied to a cleverly chosen function. The next lesson collects
        Markov, Chebyshev and Jensen, the three inequalities used everywhere afterwards. Concentration inequalities,
        Hoeffding and beyond, push the Chernoff method much further in the high-dimensional probability course.
      </p>
    </>
  ),
};
