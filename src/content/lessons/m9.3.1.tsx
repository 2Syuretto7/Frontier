import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RaoBlackwellViz } from "@/components/viz/RaoBlackwellViz";
import type { LessonContent } from "@/lib/types";

const SUFF = `import math
from itertools import product

def cond_dist(n, h, p):
    seqs = [s for s in product([0, 1], repeat=n) if sum(s) == h]
    probs = [math.prod(p if x else 1 - p for x in s) for s in seqs]
    return [round(q / sum(probs), 4) for q in probs]

def normal_ll(mu, stats):
    n, s1, s2 = stats
    return -0.5 * (s2 - 2 * mu * s1 + n * mu * mu) - 0.5 * n * math.log(2 * math.pi)`;

const RB = `import numpy as np

def rb_zero(T, n):
    return ((n - 1) / n) ** T

def compare(lam, n, reps=100000, seed=0):
    X = np.random.default_rng(seed).poisson(lam, size=(reps, n))
    crude = (X[:, 0] == 0).astype(float)
    rb = rb_zero(X.sum(axis=1), n)
    t = np.exp(-lam)
    out = (crude.mean() - t, rb.mean() - t, ((crude - t) ** 2).mean(), ((rb - t) ** 2).mean())
    return [round(float(v), 4) for v in out]`;

export const lesson: LessonContent = {
  id: "m9.3.1",
  minutes: 55,
  links: {
    requires: ["m9.2.2", "m7.5.1"],
    revisits: ["m7.6.1", "m9.2.4"],
    foreshadows: ["m9.3.2", "m9.3.4"],
  },

  puzzle: (
    <>
      <p>
        You flip a coin 1000 times to learn its bias and record the full sequence of heads and tails. A colleague says only
        the number of heads matters and the order can be thrown away. That sounds plausible for estimating p, but can it be
        made precise? And could discarding information ever make an estimator better?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Once you know there were 600 heads, every arrangement of those heads is equally likely, whatever p is. The order is
        pure noise with no information about p left in it. Better still, averaging any estimator over that noise can only
        reduce its error.
      </p>
      <RaoBlackwellViz />
    </>
  ),

  theory: (
    <>
      <Definition title="sufficient statistic">
        <p>
          A statistic T = T(X₁, …, Xₙ) is sufficient for θ if the conditional distribution of the sample given T does not
          depend on θ.
        </p>
      </Definition>

      <Theorem title="factorisation">
        <p>
          T is sufficient if and only if the joint density or mass function factors as
        </p>
        <MD>{"f(x; \\theta) = g(T(x), \\theta)\\, h(x)"}</MD>
        <p>for some functions g and h, where h does not involve θ.</p>
      </Theorem>
      <Proof>
        <p>
          Discrete case. If the factorisation holds, then for x with T(x) = t,
        </p>
        <MD>{"P(X = x \\mid T = t) = \\frac{g(t, \\theta) h(x)}{\\sum_{y : T(y) = t} g(t, \\theta) h(y)} = \\frac{h(x)}{\\sum_{y: T(y) = t} h(y)},"}</MD>
        <p>
          free of θ. Conversely, if T is sufficient, write{" "}
          <M>{"P(X = x) = P(T = T(x))\\,P(X = x \\mid T = T(x))"}</M>; the first factor is g(T(x), θ) and the second, by
          sufficiency, is h(x).
        </p>
      </Proof>

      <Example title="three models">
        <p>
          Bernoulli: <M>{"\\prod p^{x_i}(1 - p)^{1 - x_i} = p^{t}(1 - p)^{n - t}"}</M> with t = Σxᵢ, so the count of heads is
          sufficient. Normal with σ = 1: the density is a function of <M>{"(\\sum x_i, \\sum x_i^2)"}</M> times a constant, so
          those two sums are sufficient, and the log-likelihood can be computed from them alone. Uniform(0, θ):{" "}
          <M>{"\\theta^{-n}\\mathbf{1}\\{\\max x_i \\leq \\theta\\}"}</M> for nonnegative data, so the maximum is sufficient.
        </p>
        <Code>{SUFF}</Code>
      </Example>

      <Theorem title="Rao-Blackwell">
        <p>
          Let T be sufficient and <M>{"\\tilde\\theta"}</M> any estimator with finite variance. Then{" "}
          <M>{"\\hat\\theta = \\mathbb{E}[\\tilde\\theta \\mid T]"}</M> is an estimator (it does not involve θ), has the same
          bias, and <M>{"\\mathrm{MSE}(\\hat\\theta) \\leq \\mathrm{MSE}(\\tilde\\theta)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By sufficiency the conditional distribution of the sample given T is free of θ, so the conditional expectation is
          a function of the data only. The tower property gives{" "}
          <M>{"\\mathbb{E}\\hat\\theta = \\mathbb{E}\\tilde\\theta"}</M>, hence equal bias. The law of total variance gives{" "}
          <M>{"\\mathrm{Var}(\\tilde\\theta) = \\mathrm{Var}(\\hat\\theta) + \\mathbb{E}[\\mathrm{Var}(\\tilde\\theta \\mid T)] \\geq \\mathrm{Var}(\\hat\\theta)"}</M>,
          and the decomposition MSE = bias² + variance finishes it.
        </p>
      </Proof>

      <Example title="Poisson zeros">
        <p>
          To estimate <M>{"P(X = 0) = e^{-\\lambda}"}</M> from a Poisson sample, the indicator 1(X₁ = 0) is unbiased but
          crude. Given T = ΣXᵢ = t, X₁ is binomial with t trials and success probability 1/n, so{" "}
          <M>{"\\mathbb{E}[\\mathbf{1}(X_1 = 0) \\mid T] = (1 - 1/n)^T"}</M>. With λ = 1 and n = 10, this cuts the MSE from
          about 0.23 to 0.014.
        </p>
        <Code>{RB}</Code>
      </Example>

      <Remark title="compression without loss">
        <p>
          A sufficient statistic is a lossless summary for the purpose of inference about θ: the likelihood, and therefore
          the MLE and every posterior, depend on the data only through it. The whole sample is trivially sufficient; a
          minimal sufficient statistic compresses as far as possible. Streaming and federated systems exploit this: to fit a
          Gaussian or a linear regression, each worker need only send counts, sums and sums of squares or cross-products.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>Given that 3 heads occurred in 5 Bernoulli flips, what is the conditional probability that the sequence was exactly HHHTT?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0001 },
    },
    {
      key: "rb",
      rung: "check",
      prompt: <p>A Poisson sample of size 4 has sum T = 2. What is the Rao-Blackwellised estimate (1 − 1/n)^T of P(X = 0)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.5625, tolerance: 0.0001 },
    },
    {
      key: "unif",
      rung: "apply",
      prompt: <p>For an iid sample from Uniform(0, θ), which statistic is sufficient for θ?</p>,
      answer: { kind: "choice", options: ["The maximum", "The sample mean", "The minimum", "The sample median"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
from itertools import product

def cond_dist(n, h, p):
    seqs = [s for s in product([0, 1], repeat=n) if sum(s) == h]
    probs = [math.prod(p if x else 1 - p for x in s) for s in seqs]
    return [round(q / sum(probs), 4) for q in probs]

def normal_ll(mu, stats):
    n, s1, s2 = stats
    return -0.5 * (s2 - 2 * mu * s1 + n * mu * mu) - 0.5 * n * math.log(2 * math.pi)

print(cond_dist(3, 1, 0.2), cond_dist(3, 1, 0.9) == cond_dist(3, 1, 0.2))
xs = [1.0, 2.0, 4.0]
print(round(normal_ll(2.0, (3, sum(xs), sum(x * x for x in xs))), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.3333, 0.3333, 0.3333] True\n-5.2568", "[0.0081, 0.0081, 0.0081] False\n-5.2568", "[0.3333, 0.3333, 0.3333] True\n-2.5", "[0.0667, 0.1333, 0.8] False\n-5.2568"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def rb_zero(T, n):
    return ((n - 1) / n) ** T

def compare(lam, n, reps=100000, seed=0):
    X = np.random.default_rng(seed).poisson(lam, size=(reps, n))
    crude = (X[:, 0] == 0).astype(float)
    rb = rb_zero(X.sum(axis=1), n)
    t = np.exp(-lam)
    out = (crude.mean() - t, rb.mean() - t, ((crude - t) ** 2).mean(), ((rb - t) ** 2).mean())
    return [round(float(v), 4) for v in out]

print(round(rb_zero(6, 3), 4))
print(compare(1.0, 10))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0878\n[-0.0015, -0.0002, 0.2322, 0.0142]", "0.0878\n[-0.0015, -0.0002, 0.0142, 0.2322]", "0.6667\n[-0.0015, -0.0002, 0.2322, 0.0142]", "0.0878\n[-0.0015, 0.0335, 0.2322, 0.0142]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cond_dist(n, h, p)</C>, listing over all 0/1 sequences of length n with h ones (in itertools.product
          order) the conditional probability of each given the count, rounded to 4 places, and <C>normal_ll(mu, stats)</C>,
          the log-likelihood of a normal sample with σ = 1 computed only from stats = (n, Σx, Σx²).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
from itertools import product

def cond_dist(n, h, p):
    return []

def normal_ll(mu, stats):
    return 0.0
`,
        solution: SUFF,
        tests: [
          { name: "cond", code: `assert cond_dist(4, 2, 0.3) == [0.1667] * 6
assert cond_dist(2, 2, 0.7) == [1.0]` },
          { name: "ll", code: `import math
xs = [0.5, -1.0, 2.0]
want = sum(-0.5 * (x - 0.3) ** 2 - 0.5 * math.log(2 * math.pi) for x in xs)
assert abs(normal_ll(0.3, (3, sum(xs), sum(x * x for x in xs))) - want) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rb_zero(T, n)</C>, returning ((n − 1)/n)^T, and <C>compare(lam, n, reps=100000, seed=0)</C>, which
          simulates Poisson samples with default_rng(seed).poisson and returns, rounded to 4 places, the biases and then the
          MSEs of the crude estimator 1(X₁ = 0) and of rb_zero applied to the sum.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rb_zero(T, n):
    return 0.0

def compare(lam, n, reps=100000, seed=0):
    return [0.0, 0.0, 0.0, 0.0]
`,
        solution: RB,
        tests: [
          { name: "rb", code: `assert abs(rb_zero(2, 4) - 0.5625) < 1e-12 and rb_zero(0, 7) == 1` },
          { name: "compare", code: `b1, b2, m1, m2 = compare(0.5, 5, reps=40000)
assert abs(b1) < 0.01 and abs(b2) < 0.01 and m2 < m1 / 3` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For an iid Bernoulli(p) sample, prove directly from the definition that T = ΣXᵢ is sufficient for p.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Computes P(X = x) = p^t(1 − p)^(n − t) for a sequence x with t ones.",
          "Uses that T is Binomial(n, p), so P(T = t) = C(n, t) p^t(1 − p)^(n − t).",
          "Divides to get P(X = x | T = t) = 1/C(n, t) for x with t ones (and 0 otherwise), which does not depend on p.",
        ],
      },
    },
    {
      key: "unb",
      rung: "stretch",
      prompt: <p>For a Poisson(λ) sample of size n, T = ΣXᵢ is Poisson(nλ). Compute E[((n − 1)/n)^T] when n = 5 and λ = 2, giving four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1353, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a statistic sufficient, how the factorisation theorem identifies sufficient statistics for the Bernoulli, normal and uniform models, and how conditioning on a sufficient statistic improves an estimator.",

  glimpse: (
    <>
      <p>
        The Bernoulli, Poisson and normal all had sufficient statistics of fixed size, however large n is. That is no
        accident: next we meet the exponential families, the models whose likelihoods have exactly this shape.
      </p>
    </>
  ),
};
