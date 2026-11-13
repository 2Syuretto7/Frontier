import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PropCiViz } from "@/components/viz/PropCiViz";
import type { LessonContent } from "@/lib/types";

const CI = `from math import sqrt

def t_interval(xs, tcrit):
    n = len(xs)
    m = sum(xs) / n
    s = sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))
    return m - tcrit * s / sqrt(n), m + tcrit * s / sqrt(n)

def wilson(h, n, z=1.96):
    p = h / n
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    w = z * sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return c - w, c + w`;

const COVER = `import numpy as np

def wald_cover(p, n, reps=200000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    ph = h / n
    w = 1.96 * np.sqrt(ph * (1 - ph) / n)
    return float(np.mean((ph - w <= p) & (p <= ph + w)))

def wilson_cover(p, n, reps=200000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    ph, z2 = h / n, 1.96 ** 2
    c = (ph + z2 / (2 * n)) / (1 + z2 / n)
    w = 1.96 * np.sqrt(ph * (1 - ph) / n + z2 / (4 * n * n)) / (1 + z2 / n)
    return float(np.mean((c - w <= p) & (p <= c + w)))`;

export const lesson: LessonContent = {
  id: "m9.5.1",
  minutes: 55,
  links: {
    requires: ["m9.4.1", "m9.3.5"],
    revisits: ["m9.1.2", "m7.7.2"],
    foreshadows: ["m9.5.2", "m9.8.2"],
  },

  puzzle: (
    <>
      <p>
        A model gets 19 of 20 held-out examples right. The usual recipe, accuracy ± 1.96 standard errors, gives 0.95 ±
        0.096, an interval reaching past 1. With 20 of 20 correct it gives 1 ± 0, claiming perfect certainty from twenty
        examples. Something is wrong with the recipe, but what exactly is a confidence interval supposed to guarantee?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A 95% confidence interval is a procedure: applied to sample after sample, it captures the true value 95% of the
        time. Whether a particular recipe keeps that promise is a fact you can check, and near the edges of the parameter
        space the naive recipe breaks it badly.
      </p>
      <PropCiViz />
    </>
  ),

  theory: (
    <>
      <Definition title="confidence set">
        <p>
          A random set C(X) is a 1 − α confidence set for θ if <M>{"P_\\theta(\\theta \\in C(X)) \\geq 1 - \\alpha"}</M> for
          every θ. The left side is its coverage at θ. An interval is the usual case.
        </p>
      </Definition>

      <Example title="pivots">
        <p>
          A pivot is a function of data and parameter whose distribution does not depend on the parameter. For a normal
          sample, <M>{"T = (\\bar X - \\mu)/(S/\\sqrt n)"}</M> has the t distribution with n − 1 degrees of freedom whatever
          μ and σ are. From <M>{"P(|T| \\leq t_{n-1, \\alpha/2}) = 1 - \\alpha"}</M> we get the interval{" "}
          <M>{"\\bar X \\pm t_{n-1,\\alpha/2}\\, S/\\sqrt n"}</M>, with exact coverage.
        </p>
        <Code>{CI}</Code>
      </Example>

      <Theorem title="duality of tests and intervals">
        <p>
          Suppose for each θ₀ there is a level α test of H₀: θ = θ₀ with acceptance region A(θ₀). Then{" "}
          <M>{"C(x) = \\{\\theta_0 : x \\in A(\\theta_0)\\}"}</M> is a 1 − α confidence set. Conversely, a 1 − α confidence
          set gives a level α test: reject θ₀ when θ₀ ∉ C(x).
        </p>
      </Theorem>
      <Proof>
        <p>
          For any true θ, <M>{"\\theta \\in C(X)"}</M> exactly when <M>{"X \\in A(\\theta)"}</M>, and the test of θ has level α,
          so <M>{"P_\\theta(X \\in A(\\theta)) \\geq 1 - \\alpha"}</M>. The converse reads the same equivalence the other way:
          the test rejects a true θ₀ exactly when the set misses it, which has probability at most α.
        </p>
      </Proof>

      <Example title="Wald against Wilson">
        <p>
          The Wald interval <M>{"\\hat p \\pm z\\sqrt{\\hat p(1 - \\hat p)/n}"}</M> plugs the estimate into the standard
          error. The Wilson interval instead inverts the score test: it collects all p with{" "}
          <M>{"|\\hat p - p| \\leq z\\sqrt{p(1 - p)/n}"}</M>, using the null value p in the standard error. Solving that
          quadratic in p gives the formula in the code. For n = 20 and p = 0.05 the simulation shows Wald covering only 64%
          of the time and Wilson 93%.
        </p>
        <Code>{COVER}</Code>
      </Example>

      <Remark title="interpretation">
        <p>
          After the data are in, the interval [0.24, 0.76] either contains p or it does not; the 95% describes the method,
          not this interval. A Bayesian credible interval does make a probability statement about p given the data, at the
          price of a prior. For model evaluation, always report accuracy with an interval, prefer Wilson or exact
          intervals for small test sets or accuracies near 0 or 1, and remember that a test set of 1000 examples cannot
          resolve differences much below about ±3 percentage points.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "z",
      rung: "check",
      prompt: <p>A normal sample of size 16 with known σ = 2 has mean 10. What is the upper end of the 95% interval X̄ ± 1.96σ/√n?</p>,
      answer: { kind: "numeric", value: 10.98, tolerance: 0.0001 },
    },
    {
      key: "wald",
      rung: "check",
      prompt: <p>A model scores p̂ = 0.8 on n = 100 examples. What is the half-width of the 95% Wald interval?</p>,
      answer: { kind: "numeric", value: 0.0784, tolerance: 0.0001 },
    },
    {
      key: "meaning",
      rung: "apply",
      prompt: <p>Which statement correctly describes a 95% confidence interval procedure?</p>,
      answer: {
        kind: "choice",
        options: [
          "Over repeated samples, 95% of the intervals it produces contain the true parameter",
          "The true parameter lies in this particular interval with probability 0.95",
          "95% of the data lie inside the interval",
          "The estimate is correct with probability 0.95",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import sqrt

def t_interval(xs, tcrit):
    n = len(xs)
    m = sum(xs) / n
    s = sqrt(sum((x - m) ** 2 for x in xs) / (n - 1))
    return m - tcrit * s / sqrt(n), m + tcrit * s / sqrt(n)

def wilson(h, n, z=1.96):
    p = h / n
    c = (p + z * z / (2 * n)) / (1 + z * z / n)
    w = z * sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / (1 + z * z / n)
    return c - w, c + w

print([round(v, 3) for v in t_interval([4.0, 6.0, 5.0, 7.0, 3.0], 2.776)])
print([round(v, 4) for v in wilson(1, 10)], [round(v, 4) for v in wilson(5, 10)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[3.037, 6.963]\n[0.0179, 0.4042] [0.2366, 0.7634]", "[3.244, 6.756]\n[0.0179, 0.4042] [0.2366, 0.7634]", "[3.037, 6.963]\n[-0.0859, 0.2859] [0.1901, 0.8099]", "[3.037, 6.963]\n[0.0179, 0.4042] [0.1901, 0.8099]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def wald_cover(p, n, reps=200000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    ph = h / n
    w = 1.96 * np.sqrt(ph * (1 - ph) / n)
    return float(np.mean((ph - w <= p) & (p <= ph + w)))

def wilson_cover(p, n, reps=200000, seed=0):
    h = np.random.default_rng(seed).binomial(n, p, size=reps)
    ph, z2 = h / n, 1.96 ** 2
    c = (ph + z2 / (2 * n)) / (1 + z2 / n)
    w = 1.96 * np.sqrt(ph * (1 - ph) / n + z2 / (4 * n * n)) / (1 + z2 / n)
    return float(np.mean((c - w <= p) & (p <= c + w)))

for p in (0.5, 0.05):
    print(p, round(wald_cover(p, 20), 3), round(wilson_cover(p, 20), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 0.959 0.959\n0.05 0.639 0.926", "0.5 0.95 0.95\n0.05 0.95 0.95", "0.5 0.959 0.959\n0.05 0.926 0.639", "0.5 0.639 0.926\n0.05 0.959 0.959"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>t_interval(xs, tcrit)</C>, returning X̄ ± tcrit · S/√n, and <C>wilson(h, n, z=1.96)</C>, returning the
          Wilson interval for h successes in n trials.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import sqrt

def t_interval(xs, tcrit):
    return 0.0, 0.0

def wilson(h, n, z=1.96):
    return 0.0, 1.0
`,
        solution: CI,
        tests: [
          { name: "t", code: `lo, hi = t_interval([1.0, 3.0], 12.706)
assert abs(lo - (2 - 12.706)) < 1e-9 and abs(hi - (2 + 12.706)) < 1e-9` },
          { name: "wilson", code: `lo, hi = wilson(10, 20)
assert abs(lo + hi - 1) < 1e-12 and 0.29 < lo < 0.3
lo, hi = wilson(0, 10)
assert abs(lo) < 1e-12 and 0.27 < hi < 0.28` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wald_cover(p, n, reps=200000, seed=0)</C> and <C>wilson_cover(p, n, reps=200000, seed=0)</C>, which
          simulate binomial counts with default_rng(seed).binomial and return the fraction of 95% intervals containing p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def wald_cover(p, n, reps=200000, seed=0):
    return 0.95

def wilson_cover(p, n, reps=200000, seed=0):
    return 0.95
`,
        solution: COVER,
        tests: [
          { name: "wald", code: `assert wald_cover(0.02, 10, reps=20000) < 0.3` },
          { name: "wilson", code: `assert abs(wilson_cover(0.3, 200, reps=20000) - 0.95) < 0.015 and wilson_cover(0.02, 10, reps=20000) > 0.9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Suppose that for every θ₀ the acceptance region A(θ₀) defines a level α test of θ = θ₀. Prove that C(x) = {"{θ₀ : x ∈ A(θ₀)}"} is a 1 − α confidence set.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Fixes the true parameter θ and observes that θ ∈ C(X) if and only if X ∈ A(θ).",
          "Uses the level of the test of θ: P_θ(X ∉ A(θ)) ≤ α.",
          "Concludes P_θ(θ ∈ C(X)) = P_θ(X ∈ A(θ)) ≥ 1 − α, for every θ.",
        ],
      },
    },
    {
      key: "zero",
      rung: "stretch",
      prompt: <p>A model makes no errors on 100 independent test cases. Solving (1 − p)^100 = 0.05, what is the one-sided 95% upper bound on its error rate p? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0295, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what coverage means for a confidence interval, how pivots give exact intervals, why intervals and tests are two views of the same thing, and why the Wilson interval beats the Wald interval for small samples near 0 or 1.",

  glimpse: (
    <>
      <p>
        Pivots and asymptotic formulas need a known distribution. The bootstrap, next, gets standard errors and intervals
        for almost any statistic by resampling the data themselves.
      </p>
    </>
  ),
};
