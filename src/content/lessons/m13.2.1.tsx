import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PitViz } from "@/components/viz/PitViz";
import type { LessonContent } from "@/lib/types";

const IV = `import numpy as np

def sample_exponential(lam, u):
    return -np.log1p(-u) / lam

def sample_discrete(p, u):
    idx = np.searchsorted(np.cumsum(p), u, side="right")
    return np.minimum(idx, len(p) - 1)

def pit(x, cdf):
    return cdf(x)`;

const NI = `import numpy as np
from math import erf, sqrt

def norm_cdf(x):
    return 0.5 * (1 + erf(x / sqrt(2)))

def invert(cdf, u, lo=-50.0, hi=50.0, iters=100):
    for _ in range(iters):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if cdf(mid) < u else (lo, mid)
    return (lo + hi) / 2

def ks_stat(samples, cdf):
    x = np.sort(samples); n = len(x); F = np.array([cdf(v) for v in x])
    return float(max(np.max(np.arange(1, n + 1) / n - F), np.max(F - np.arange(n) / n)))`;

export const lesson: LessonContent = {
  id: "m13.2.1",
  minutes: 45,
  links: {
    requires: ["m7.3.3", "m13.1.1"],
    revisits: ["m7.3.2"],
    foreshadows: ["m13.2.2", "m13.2.3"],
  },

  puzzle: (
    <>
      <p>
        A computer produces only uniform random numbers, yet every library offers exponential, Poisson and categorical
        samples. One trick turns a uniform number into a draw from any distribution on the real line at all, continuous,
        discrete or a mixture. Run backwards, the same trick gives a test: if a weather model&apos;s forecasts are honest, its
        predicted probabilities, evaluated at what actually happened, must look uniform. What is the trick, and why does
        it work even when the distribution function has jumps and flat stretches?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The distribution function F climbs from 0 to 1. Pick a height u uniformly and find where F first reaches it. Steep
        stretches of F, where the density is high, catch a wide range of heights, so they are chosen often. Jumps catch a
        band of heights as wide as the jump, which is exactly the probability of that value. In reverse, F maps data from F
        to uniform heights, and any departure from uniformity points to a specific way the model is wrong.
      </p>
      <PitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="generalised inverse">
        <p>
          For a distribution function F, define <M>{"F^-(u) = \\inf\\{x : F(x) \\ge u\\}"}</M> for u in (0, 1). When F is
          continuous and strictly increasing this is the ordinary inverse; in general it is the quantile function.
        </p>
      </Definition>

      <Theorem title="inverse transform sampling">
        <p>
          For every u in (0, 1) and real x, <M>{"F^-(u) \\le x \\iff u \\le F(x)"}</M>. Hence if U is uniform on (0, 1),{" "}
          <M>{"X = F^-(U)"}</M> has distribution function F.
        </p>
      </Theorem>
      <Proof>
        <p>
          If <M>{"u \\le F(x)"}</M> then x belongs to the set whose infimum is <M>{"F^-(u)"}</M>, so <M>{"F^-(u) \\le x"}</M>.
          Conversely, F is right-continuous and non-decreasing, so the set <M>{"\\{x : F(x) \\ge u\\}"}</M> is a closed interval{" "}
          <M>{"[F^-(u), \\infty)"}</M>; if <M>{"F^-(u) \\le x"}</M> then x is in it. Therefore{" "}
          <M>{"P(X \\le x) = P(U \\le F(x)) = F(x)"}</M>. For a discrete distribution with cumulative sums{" "}
          <M>{"c_0 < c_1 < \\dots"}</M> this is: return the first k with <M>{"c_k \\ge u"}</M>, a binary search in{" "}
          <M>{"O(\\log K)"}</M>. Floating-point sums may end just below 1, so guard the last index.
        </p>
        <Code>{IV}</Code>
      </Proof>

      <Theorem title="probability integral transform">
        <p>If X has a continuous distribution function F, then F(X) is uniform on (0, 1).</p>
      </Theorem>
      <Proof>
        <p>
          For u in (0, 1), continuity gives <M>{"F(F^-(u)) = u"}</M>, and by the equivalence above{" "}
          <M>{"F(X) \\ge u \\iff X \\ge F^-(u)"}</M> up to an event of probability zero. So{" "}
          <M>{"P(F(X) \\ge u) = 1 - F(F^-(u)) = 1 - u"}</M>. For discrete X this fails (F(X) takes only a few values); the fix
          is to draw F(X) uniformly between the left and right limits of F at X. In forecast verification, the histogram of{" "}
          <M>{"F_{\\text{model}}(x_{\\text{observed}})"}</M> diagnoses calibration: tilted for bias, U-shaped for overconfidence,
          humped for underconfidence.
        </p>
      </Proof>

      <Remark title="when there is no formula">
        <p>
          The exponential, Cauchy and logistic have closed-form inverses; the normal does not. Then invert numerically:
          bisection on a monotone F gains one bit per evaluation, so about 50 evaluations reach double precision, and
          Newton&apos;s method using the density is faster near the answer. Libraries use rational approximations of the
          normal quantile instead. To test any sampler, compare its output with F by the Kolmogorov–Smirnov statistic, the
          largest gap between the empirical and true distribution functions, which for correct samples is about{" "}
          <M>{"1/\\sqrt n"}</M> in size. Inversion also preserves order, which matters for common random numbers and copulas.
        </p>
        <Code>{NI}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "expo",
      rung: "check",
      prompt: <p>Inverse transform sampling from an exponential with rate 2 uses u = 0.5. What sample results? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.347, tolerance: 0.001 },
    },
    {
      key: "cauchy",
      rung: "check",
      prompt: <p>The standard Cauchy has F(x) = ½ + arctan(x)/π. What is the sample produced by u = 0.75?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "ushape",
      rung: "apply",
      prompt: <p>The PIT histogram of a forecasting model is U-shaped. What does that say about the model?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its predictive distributions are too narrow: outcomes land in its tails too often",
          "Its predictive distributions are too wide",
          "It is biased upwards",
          "It is perfectly calibrated",
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

def sample_exponential(lam, u):
    return -np.log1p(-u) / lam

def sample_discrete(p, u):
    idx = np.searchsorted(np.cumsum(p), u, side="right")
    return np.minimum(idx, len(p) - 1)

def pit(x, cdf):
    return cdf(x)

print(np.round(sample_exponential(2.0, np.array([0.0, 0.5, 0.9])), 3).tolist())
print(sample_discrete(np.array([0.2, 0.3, 0.5]), np.array([0.1, 0.2, 0.49, 0.5, 0.99])).tolist())
x = sample_exponential(1.0, np.random.default_rng(0).random(100000)); print(round(x.mean(), 2), round(float(np.mean(pit(x, lambda t: 1 - np.exp(-t)) < 0.25)), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.347, 1.151]\n[0, 1, 1, 2, 2]\n1.0 0.25",
          "[0.0, 0.347, 1.151]\n[0, 0, 1, 1, 2]\n1.0 0.25",
          "[0.0, 0.693, 2.303]\n[0, 1, 1, 2, 2]\n1.0 0.25",
          "[0.0, 0.347, 1.151]\n[0, 1, 1, 2, 2]\n1.0 0.75",
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
from math import erf, sqrt

def norm_cdf(x):
    return 0.5 * (1 + erf(x / sqrt(2)))

def invert(cdf, u, lo=-50.0, hi=50.0, iters=100):
    for _ in range(iters):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if cdf(mid) < u else (lo, mid)
    return (lo + hi) / 2

def ks_stat(samples, cdf):
    x = np.sort(samples); n = len(x); F = np.array([cdf(v) for v in x])
    return float(max(np.max(np.arange(1, n + 1) / n - F), np.max(F - np.arange(n) / n)))

print(round(invert(norm_cdf, 0.975), 3), round(invert(norm_cdf, 0.5), 6) + 0.0)
z = np.array([invert(norm_cdf, u) for u in np.random.default_rng(1).random(2000)]); print(ks_stat(z, norm_cdf) < 0.03, ks_stat(z + 0.2, norm_cdf) > 0.05)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.96 0.0\nTrue True", "1.96 0.5\nTrue True", "0.975 0.0\nTrue True", "1.96 0.0\nTrue False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sample_exponential(lam, u)</C> using <C>log1p</C>; <C>sample_discrete(p, u)</C> by binary search on the
          cumulative sums, returning the first k with cumulative sum above u and never an index past the end; and{" "}
          <C>pit(x, cdf)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sample_exponential(lam, u):
    return u / lam

def sample_discrete(p, u):
    return np.zeros(len(u), dtype=int)

def pit(x, cdf):
    return x
`,
        solution: IV,
        tests: [
          { name: "continuous", code: `assert abs(sample_exponential(1.0, np.array([1 - np.exp(-2.0)]))[0] - 2.0) < 1e-12 and sample_exponential(3.0, np.array([0.0]))[0] == 0
assert np.allclose(pit(np.array([0.0, 1.0]), lambda t: 1 - np.exp(-t)), [0.0, 1 - np.exp(-1)])` },
          { name: "discrete", code: `assert sample_discrete(np.array([0.1, 0.9]), np.array([0.05, 0.1, 0.95])).tolist() == [0, 1, 1]
assert sample_discrete(np.array([0.1] * 10), np.array([0.9999999999999999])).tolist() == [9]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_cdf(x)</C> with <C>erf</C>; <C>invert(cdf, u, lo, hi, iters)</C> by bisection; and{" "}
          <C>ks_stat(samples, cdf)</C>, the largest gap between the empirical distribution function (on both sides of each jump)
          and cdf.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import erf, sqrt

def norm_cdf(x):
    return 0.5

def invert(cdf, u, lo=-50.0, hi=50.0, iters=100):
    return 0.0

def ks_stat(samples, cdf):
    return 0.0
`,
        solution: NI,
        tests: [
          { name: "invert", code: `assert norm_cdf(0.0) == 0.5 and abs(invert(lambda x: 1 - np.exp(-x) if x > 0 else 0.0, 0.5) - np.log(2)) < 1e-9 and abs(invert(norm_cdf, 0.8413447460685429) - 1) < 1e-9` },
          { name: "ks", code: `n = 50; q = np.array([invert(norm_cdf, (i + 0.5) / n) for i in range(n)]); assert abs(ks_stat(q, norm_cdf) - 0.01) < 1e-9
assert abs(ks_stat(np.array([0.0]), lambda x: 0.3) - 0.7) < 1e-12` },
        ],
      },
    },
    {
      key: "logistic",
      rung: "stretch",
      prompt: (
        <p>
          The logistic distribution with location 2 and scale 1 has <M>{"F(x) = 1/(1 + e^{-(x-2)})"}</M>. What sample does u = 0.9
          produce? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.197, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Inversion needs F and its inverse. Rejection sampling needs only the density, and only up to a constant: propose
        from something easy and accept with the right probability.
      </p>
    </>
  ),
};
