import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ImportanceTailViz } from "@/components/viz/ImportanceTailViz";
import type { LessonContent } from "@/lib/types";

const IS = `import numpy as np
from math import erfc, sqrt

def norm_logpdf(x, mu=0.0, s=1.0):
    return -0.5 * ((x - mu) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi))

def tail_plain(n, rng, t=3.0):
    return float(np.mean(rng.normal(size=n) > t))

def tail_is(n, rng, t=3.0):
    z = rng.normal(t, 1.0, size=n); h = (z > t) * np.exp(norm_logpdf(z) - norm_logpdf(z, t))
    return float(np.mean(h)), float(np.std(h, ddof=1) / np.sqrt(n))`;

const SN = `import numpy as np

def snis(logp_unnorm, f, z, logq):
    lw = logp_unnorm(z) - logq; w = np.exp(lw - lw.max()); w /= w.sum()
    return float(np.sum(w * f(z)))

def second_moment(sigma):
    return float("inf") if sigma ** 2 <= 0.5 else float(sigma ** 2 / np.sqrt(2 * sigma ** 2 - 1))`;

export const lesson: LessonContent = {
  id: "m13.1.3",
  minutes: 50,
  links: {
    requires: ["m13.1.1"],
    revisits: ["m12.2.1", "m13.1.2"],
    foreshadows: ["m13.1.4", "m13.2.2"],
  },

  puzzle: (
    <>
      <p>
        The probability that a standard normal exceeds 3 is 0.00135. Draw 10,000 normals and about 13 of them land there,
        so the estimate has a relative error of 27%. To get 1% you would need some 7 million draws. Yet with 10,000 draws
        from a different distribution, one that is wrong on purpose, the relative error is under 2%. How can sampling from
        the wrong distribution give a better answer about the right one?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Plain sampling wastes almost every draw on the region that contributes nothing. Instead, draw from a proposal q
        that concentrates on the important region, and correct for the change by weighting each sample by{" "}
        <M>{"p(x)/q(x)"}</M>: samples from places q over-visits count for less. The estimate stays unbiased, and if q looks
        like the integrand, every weighted sample says roughly the same thing, so the variance collapses. The danger is the
        opposite mistake: a proposal that under-visits somewhere important produces rare, enormous weights.
      </p>
      <ImportanceTailViz />
    </>
  ),

  theory: (
    <>
      <Definition title="importance sampling">
        <p>
          To estimate <M>{"\\theta = \\mathbb E_p[f(X)]"}</M>, draw <M>{"X_1, \\dots, X_n"}</M> from a proposal q with{" "}
          <M>{"q(x) > 0"}</M> wherever <M>{"f(x)p(x) \\ne 0"}</M>, and use
        </p>
        <MD>{"\\hat\\theta_{\\mathrm{IS}} = \\frac1n\\sum_{i=1}^n w(X_i) f(X_i), \\qquad w(x) = \\frac{p(x)}{q(x)}."}</MD>
      </Definition>

      <Theorem title="unbiasedness, variance and the ideal proposal">
        <p>
          <M>{"\\hat\\theta_{\\mathrm{IS}}"}</M> is unbiased with variance{" "}
          <M>{"\\frac1n\\bigl(\\mathbb E_q[w^2 f^2] - \\theta^2\\bigr)"}</M>. For f ≥ 0 the proposal{" "}
          <M>{"q^*(x) = f(x)p(x)/\\theta"}</M> gives variance zero, and for general f,{" "}
          <M>{"q \\propto |f|\\,p"}</M> minimises the variance.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb E_q[wf] = \\int \\frac{p}{q} f\\, q = \\int fp = \\theta"}</M>, using the support condition. The variance of
          one term is its second moment minus <M>{"\\theta^2"}</M>. Under <M>{"q^*"}</M> every term equals{" "}
          <M>{"f p / q^* = \\theta"}</M>, a constant. For general f, Cauchy–Schwarz gives{" "}
          <M>{"\\mathbb E_q[w^2f^2] = \\int \\frac{f^2p^2}{q} \\ge \\bigl(\\int |f| p\\bigr)^2"}</M>, with equality when q is
          proportional to |f| p. The ideal needs θ itself, so in practice we choose a q that roughly follows <M>{"|f|p"}</M>:
          for the normal tail, N(3, 1) gives a relative error per sample of 1.84 instead of 27.
        </p>
        <Code>{IS}</Code>
      </Proof>

      <Theorem title="light-tailed proposals can be fatal">
        <p>
          For target N(0, 1) and proposal <M>{"N(0, \\sigma^2)"}</M>,{" "}
          <M>{"\\mathbb E_q[w^2] = \\sigma^2 / \\sqrt{2\\sigma^2 - 1}"}</M> when <M>{"\\sigma^2 > \\tfrac12"}</M>, and it is infinite
          when <M>{"\\sigma^2 \\le \\tfrac12"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb E_q[w^2] = \\int p^2/q = \\frac{\\sigma}{\\sqrt{2\\pi}}\\int \\exp\\bigl(-z^2(1 - \\tfrac{1}{2\\sigma^2})\\bigr)\\,dz"}</M>.
          The integral diverges unless <M>{"1 - 1/(2\\sigma^2) > 0"}</M>, and otherwise equals{" "}
          <M>{"\\sqrt{\\pi\\cdot 2\\sigma^2/(2\\sigma^2 - 1)}"}</M>, which simplifies to the stated value. With infinite variance
          the estimator is still unbiased and consistent, but its error bar is meaningless and it can look converged for a long
          time before one huge weight arrives. The safe rule is that the proposal&apos;s tails should be at least as heavy as
          the target&apos;s.
        </p>
      </Proof>

      <Remark title="self-normalised importance sampling">
        <p>
          Often p is known only up to a constant, as with a Bayesian posterior <M>{"\\tilde p = Zp"}</M>. Then use normalised
          weights <M>{"\\bar w_i = \\tilde w_i / \\sum_j \\tilde w_j"}</M> with <M>{"\\tilde w = \\tilde p / q"}</M>, and estimate{" "}
          <M>{"\\sum_i \\bar w_i f(X_i)"}</M>. The constant Z cancels. The estimator is a ratio of two unbiased averages, so it is
          biased by O(1/n) but consistent. Computing the weights in log space and subtracting the largest before
          exponentiating avoids overflow. The same reweighting powers off-policy evaluation in reinforcement learning and
          sequential Monte Carlo.
        </p>
        <Code>{SN}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "weight",
      rung: "check",
      prompt: <p>Target N(0, 1), proposal N(3, 1). What is the importance weight at x = 3? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0111, tolerance: 0.0001 },
    },
    {
      key: "moment",
      rung: "check",
      prompt: <p>Target N(0, 1), proposal N(0, 1.5²). What is the second moment of the weights? Give three decimals.</p>,
      answer: { kind: "numeric", value: 1.203, tolerance: 0.001 },
    },
    {
      key: "tails",
      rung: "apply",
      prompt: <p>Why is a proposal with lighter tails than the target dangerous?</p>,
      answer: {
        kind: "choice",
        options: [
          "Far out, p/q grows without bound, so rare samples carry huge weights and the variance can be infinite",
          "The estimator becomes biased",
          "The weights no longer average to one",
          "The proposal can no longer be sampled from",
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
from math import erfc, sqrt

def norm_logpdf(x, mu=0.0, s=1.0):
    return -0.5 * ((x - mu) / s) ** 2 - np.log(s * np.sqrt(2 * np.pi))

def tail_plain(n, rng, t=3.0):
    return float(np.mean(rng.normal(size=n) > t))

def tail_is(n, rng, t=3.0):
    z = rng.normal(t, 1.0, size=n); h = (z > t) * np.exp(norm_logpdf(z) - norm_logpdf(z, t))
    return float(np.mean(h)), float(np.std(h, ddof=1) / np.sqrt(n))

rng = np.random.default_rng(1); truth = 0.5 * erfc(3 / sqrt(2)); est, se = tail_is(10000, rng); print(round(truth, 5), abs(est - truth) < 2 * se, round(se / truth, 3))
print(round(sqrt((1 - truth) / (10000 * truth)), 3), tail_plain(100, np.random.default_rng(2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.00135 True 0.018\n0.272 0.0",
          "0.00135 True 0.272\n0.018 0.0",
          "0.00135 False 0.018\n0.272 0.0",
          "0.00135 True 0.018\n0.272 0.00135",
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

def snis(logp_unnorm, f, z, logq):
    lw = logp_unnorm(z) - logq; w = np.exp(lw - lw.max()); w /= w.sum()
    return float(np.sum(w * f(z)))

def second_moment(sigma):
    return float("inf") if sigma ** 2 <= 0.5 else float(sigma ** 2 / np.sqrt(2 * sigma ** 2 - 1))

rng = np.random.default_rng(3); z = rng.normal(0, 2, size=20000); lq = -0.5 * (z / 2) ** 2 - np.log(2 * np.sqrt(2 * np.pi))
print(round(snis(lambda x: -0.5 * (x - 1) ** 2, lambda x: x, z, lq), 1), round(snis(lambda x: -0.5 * (x - 1) ** 2, lambda x: x ** 2, z, lq), 1))
print(second_moment(1.0), round(second_moment(2.0), 3), second_moment(0.6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 2.0\n1.0 1.512 inf", "1.0 1.0\n1.0 1.512 inf", "0.0 4.0\n1.0 1.512 inf", "1.0 2.0\n1.0 0.661 inf"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>norm_logpdf(x, mu, s)</C>; <C>tail_plain(n, rng, t)</C>, the plain estimate of P(Z &gt; t); and{" "}
          <C>tail_is(n, rng, t)</C>, sampling from N(t, 1) and returning the importance sampling estimate and its standard
          error.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import erfc, sqrt

def norm_logpdf(x, mu=0.0, s=1.0):
    return 0.0

def tail_plain(n, rng, t=3.0):
    return 0.0

def tail_is(n, rng, t=3.0):
    return 0.0, 1.0
`,
        solution: IS,
        tests: [
          { name: "basics", code: `assert abs(norm_logpdf(0.0) + 0.5 * np.log(2 * np.pi)) < 1e-12 and abs(norm_logpdf(3.0, 1.0, 2.0) - (-0.5 - np.log(2 * np.sqrt(2 * np.pi)))) < 1e-12
assert tail_plain(100, np.random.default_rng(0), t=-100.0) == 1.0` },
          { name: "tail", code: `truth = 0.5 * erfc(4 / sqrt(2)); est, se = tail_is(5000, np.random.default_rng(5), t=4.0)
assert abs(est - truth) < 4 * se and se / truth < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>snis(logp_unnorm, f, z, logq)</C>, the self-normalised estimate from samples z with proposal log density
          logq, computing weights stably in log space, and <C>second_moment(sigma)</C> from the theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def snis(logp_unnorm, f, z, logq):
    return float(np.mean(f(z)))

def second_moment(sigma):
    return 1.0
`,
        solution: SN,
        tests: [
          { name: "snis", code: `z = np.array([0.0, 1.0, 2.0]); lq = np.array([0.0, 0.0, 0.0])
assert abs(snis(lambda x: np.log(np.array([1.0, 1.0, 2.0])), lambda x: x, z, lq) - 1.25) < 1e-12
assert abs(snis(lambda x: 1000.0 + 0 * x, lambda x: x, z, lq) - 1.0) < 1e-12` },
          { name: "moment", code: `assert second_moment(1.0) == 1.0 and second_moment(0.7) == float("inf") and abs(second_moment(2.0) - 4 / np.sqrt(7)) < 1e-12` },
        ],
      },
    },
    {
      key: "relerr",
      rung: "stretch",
      prompt: (
        <p>
          Estimating P(Z &gt; 3) with proposal N(μ, 1), the second moment of each term is <M>{"e^{\\mu^2}\\,Q(3 + \\mu)"}</M>, where Q is the
          normal tail. What is the relative standard error per sample at μ = 3? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.84, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        A bad proposal shows itself in the weights: a few dominate and the rest are wasted. The effective sample size turns
        that into a single number, telling you how many plain samples your weighted ones are worth.
      </p>
    </>
  ),
};
