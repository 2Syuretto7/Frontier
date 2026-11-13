import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InverseCdfViz } from "@/components/viz/InverseCdfViz";
import type { LessonContent } from "@/lib/types";

const QUANT = `def quantile(F, u, lo=-1e6, hi=1e6, iters=200):
    for _ in range(iters):
        mid = (lo + hi) / 2
        if F(mid) >= u:
            hi = mid
        else:
            lo = mid
    return hi

def discrete_quantile(values, probs, u):
    total = 0.0
    for x, p in zip(values, probs):
        total += p
        if total >= u:
            return x
    return values[-1]`;

const PIT = `import numpy as np

def pit(samples, F):
    return np.array([F(x) for x in samples])

def ks_uniform(v):
    v = np.sort(v)
    n = len(v)
    upper = np.arange(1, n + 1) / n - v
    lower = v - np.arange(0, n) / n
    return float(max(upper.max(), lower.max()))`;

export const lesson: LessonContent = {
  id: "m7.3.3",
  minutes: 55,
  links: {
    requires: ["m7.3.2", "m7.2.1"],
    revisits: ["m7.2.2"],
    foreshadows: ["m7.3.4", "m7.7.3"],
  },

  puzzle: (
    <>
      <p>
        A computer gives you uniform random numbers on (0, 1) and nothing else. How do you turn them into exponential
        waiting times, logistic noise, or rolls of a loaded die? And in the other direction: a forecaster issues
        probability distributions for tomorrow&apos;s temperature. How can you test, from the outcomes alone, whether those
        distributions are right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The CDF maps values to [0, 1]; its inverse maps [0, 1] back to values. Feed a uniform number into the inverse and the
        output has exactly the distribution F. Run it the other way, applying a continuous CDF to its own random variable,
        and the result is uniform. One uniform number is therefore as good as any random variable.
      </p>
      <InverseCdfViz />
    </>
  ),

  theory: (
    <>
      <Definition title="quantile function">
        <p>
          For a CDF F and 0 &lt; u &lt; 1, let <M>{"Q(u) = \\inf\\{x : F(x) \\ge u\\}"}</M>. When F is continuous and strictly
          increasing, Q is the ordinary inverse <M>{"F^{-1}"}</M>; in general it is the smallest x at which F reaches u.
        </p>
      </Definition>

      <Theorem title="the switching lemma">
        <p>For 0 &lt; u &lt; 1 and real x, <M>{"Q(u) \\le x \\iff u \\le F(x)"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          If u ≤ F(x), then x belongs to the set whose infimum is Q(u), so Q(u) ≤ x. Conversely, the set{" "}
          <M>{"\\{x : F(x) \\ge u\\}"}</M> is an interval unbounded above (F is non-decreasing), non-empty and bounded below
          (F tends to 1 and 0), and it contains its infimum because F is right-continuous. So{" "}
          <M>{"F(Q(u)) \\ge u"}</M>, and if Q(u) ≤ x then <M>{"F(x) \\ge F(Q(u)) \\ge u"}</M>.
        </p>
      </Proof>

      <Theorem title="inverse-CDF sampling">
        <p>If U ~ Uniform(0, 1), then Q(U) has CDF F.</p>
      </Theorem>
      <Proof>
        <p>
          By the lemma, <M>{"P(Q(U) \\le x) = P(U \\le F(x)) = F(x)"}</M>.
        </p>
        <Code>{QUANT}</Code>
      </Proof>

      <Example title="a gallery">
        <p>
          Exponential(λ): <M>{"-\\log(1 - U)/\\lambda"}</M>. Logistic: <M>{"\\log(U/(1 - U))"}</M>, the logit, inverse of the
          sigmoid. Cauchy: <M>{"\\tan(\\pi(U - \\tfrac12))"}</M>. Pareto with <M>{"F(x) = 1 - x^{-\\alpha}"}</M>:{" "}
          <M>{"(1 - U)^{-1/\\alpha}"}</M>. Gumbel: <M>{"-\\log(-\\log U)"}</M>; adding independent Gumbel noise to log
          probabilities and taking the argmax samples a categorical, the Gumbel-max trick used in sampling and in relaxations
          of discrete choices. For the normal, Q has no closed form and faster methods are used, but inversion still works
          numerically.
        </p>
      </Example>

      <Theorem title="probability integral transform">
        <p>If X has a continuous CDF F, then F(X) ~ Uniform(0, 1).</p>
      </Theorem>
      <Proof>
        <p>
          The lemma, negated, says F(x) &lt; u exactly when x &lt; Q(u). So{" "}
          <M>{"P(F(X) < u) = P(X < Q(u)) = F(Q(u))"}</M>, using continuity of F (no atom at Q(u)). By continuity and the
          lemma, <M>{"F(Q(u)) \\ge u"}</M> while <M>{"F(y) < u"}</M> for every y &lt; Q(u); letting y increase to Q(u) gives{" "}
          <M>{"F(Q(u)) \\le u"}</M>. So P(F(X) &lt; u) = u for every u in (0, 1), which is the uniform distribution.
        </p>
      </Proof>
      <Remark title="when F jumps">
        <p>
          For a discrete X, F(X) takes only a few values and cannot be uniform. Inversion still works in the sampling
          direction, as the die in the figure shows; for the transform direction a randomised version fills in the jumps.
        </p>
      </Remark>

      <Example title="checking forecasts">
        <p>
          If a model&apos;s predictive CDF <M>{"F_t"}</M> is correct, the values <M>{"F_t(y_t)"}</M> at the observed outcomes
          are independent uniforms. A histogram of them that is U-shaped means overconfident forecasts; a hump means
          underconfident ones. The Kolmogorov–Smirnov statistic, the largest gap between the empirical CDF of these values
          and the diagonal, measures the departure with one number.
        </p>
        <Code>{PIT}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "expq",
      rung: "check",
      prompt: <p>By inversion, which value of an Exponential(2) variable does u = 0.5 produce? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3466, tolerance: 0.0001 },
    },
    {
      key: "unifq",
      rung: "check",
      prompt: <p>What is Q(0.25) for the Uniform(3, 7) distribution?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "oneminus",
      rung: "apply",
      prompt: <p>X has a continuous CDF F. What is the distribution of 1 − F(X)?</p>,
      answer: { kind: "choice", options: ["Uniform(0, 1)", "Exponential(1)", "The same as the distribution of X", "It depends on F"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def quantile(F, u, lo=-1e6, hi=1e6, iters=200):
    for _ in range(iters):
        mid = (lo + hi) / 2
        if F(mid) >= u:
            hi = mid
        else:
            lo = mid
    return hi

def discrete_quantile(values, probs, u):
    total = 0.0
    for x, p in zip(values, probs):
        total += p
        if total >= u:
            return x
    return values[-1]

F_exp = lambda x: 1 - math.exp(-x) if x > 0 else 0.0
print(round(quantile(F_exp, 0.5), 4), round(quantile(lambda x: 1 / (1 + math.exp(-x)), 0.75), 4))
print([discrete_quantile([1, 2, 3], [0.25, 0.5, 0.25], u) for u in (0.1, 0.25, 0.26, 0.75, 0.99)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.6931 1.0986\n[1, 1, 2, 2, 3]", "0.6931 1.0986\n[1, 2, 2, 2, 3]", "0.5 1.0986\n[1, 1, 2, 2, 3]", "0.6931 0.75\n[1, 1, 2, 2, 3]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
import numpy as np

def pit(samples, F):
    return np.array([F(x) for x in samples])

def ks_uniform(v):
    v = np.sort(v)
    n = len(v)
    upper = np.arange(1, n + 1) / n - v
    lower = v - np.arange(0, n) / n
    return float(max(upper.max(), lower.max()))

z = np.random.default_rng(0).normal(size=20000)
Phi = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
print(round(ks_uniform(pit(z, Phi)), 2), round(ks_uniform(pit(2 * z, Phi)), 2))
print(ks_uniform(np.array([0.25, 0.75])), ks_uniform(np.array([0.5, 0.5])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.01 0.17\n0.25 0.5", "0.01 0.01\n0.25 0.5", "0.17 0.01\n0.25 0.5", "0.01 0.17\n0.25 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quantile(F, u, lo=-1e6, hi=1e6, iters=200)</C>, which finds Q(u) for a CDF by bisection (keep hi with F(hi)
          ≥ u), and <C>discrete_quantile(values, probs, u)</C>, the smallest value (in the given increasing order) at which
          the cumulative probability reaches u.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def quantile(F, u, lo=-1e6, hi=1e6, iters=200):
    return 0.0

def discrete_quantile(values, probs, u):
    return values[0]
`,
        solution: QUANT,
        tests: [
          { name: "continuous", code: `import math
F = lambda x: 1 - math.exp(-2 * x) if x > 0 else 0.0
assert abs(quantile(F, 0.5) - math.log(2) / 2) < 1e-9
G = lambda x: min(1.0, max(0.0, (x - 3) / 4))
assert abs(quantile(G, 0.25) - 4) < 1e-9 and abs(quantile(lambda x: 1 / (1 + math.exp(-x)) if x > -700 else 0.0, 0.9) - math.log(9)) < 1e-9` },
          { name: "discrete", code: `assert [discrete_quantile([1, 2, 3], [0.25, 0.5, 0.25], u) for u in (0.1, 0.25, 0.26, 0.75, 0.99)] == [1, 1, 2, 2, 3]
assert discrete_quantile(['a', 'b'], [0.5, 0.5], 0.5) == 'a' and discrete_quantile(['a', 'b'], [0.5, 0.5], 0.51) == 'b'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pit(samples, F)</C>, returning the array of F applied to each sample, and <C>ks_uniform(v)</C>, the
          Kolmogorov–Smirnov distance <M>{"\\sup_x |\\hat F(x) - x|"}</M> between the empirical CDF of the values v and the
          Uniform(0, 1) CDF, as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pit(samples, F):
    return np.asarray(samples)

def ks_uniform(v):
    return 0.0
`,
        solution: PIT,
        tests: [
          { name: "ks", code: `assert abs(ks_uniform(np.array([0.25, 0.75])) - 0.25) < 1e-12 and abs(ks_uniform(np.array([0.5, 0.5])) - 0.5) < 1e-12
assert abs(ks_uniform(np.array([0.1])) - 0.9) < 1e-12 and isinstance(ks_uniform(np.array([0.3, 0.6])), float)` },
          { name: "pit", code: `import math
x = np.random.default_rng(9).exponential(1.0, size=20000)
good = pit(x, lambda t: 1 - math.exp(-t))
bad = pit(x, lambda t: 1 - math.exp(-2 * t))
assert good.shape == (20000,) and ks_uniform(good) < 0.02 and ks_uniform(bad) > 0.2` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let F be a continuous, strictly increasing CDF with inverse <M>{"F^{-1}"}</M>, and U ~ Uniform(0, 1). Prove that{" "}
          <M>{"X = F^{-1}(U)"}</M> has CDF F, and that F(X) is uniform.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses that F is strictly increasing to show F⁻¹(U) ≤ x if and only if U ≤ F(x).",
          "Concludes P(X ≤ x) = P(U ≤ F(x)) = F(x), since U is uniform and F(x) is in [0, 1].",
          "Notes F(X) = F(F⁻¹(U)) = U, which is uniform (or proves P(F(X) ≤ u) = u directly).",
        ],
      },
    },
    {
      key: "pareto",
      rung: "stretch",
      prompt: <p>By inversion, which sample does u = 0.9 give for the Pareto distribution with F(x) = 1 − 1/x² for x ≥ 1? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 3.1623, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how one uniform random number can be turned into a sample from any distribution, why F(X) is uniform when F is continuous, and how that fact lets you check whether probabilistic forecasts are calibrated.",

  glimpse: (
    <>
      <p>
        Inversion is one transformation of a random variable; the next lesson handles general ones, finding the density of
        g(X) from the density of X through the change-of-variables formula, the one-dimensional case of the Jacobian rule
        behind normalising flows.
      </p>
    </>
  ),
};
