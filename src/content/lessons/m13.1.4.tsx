import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EssDimViz } from "@/components/viz/EssDimViz";
import type { LessonContent } from "@/lib/types";

const KE = `import numpy as np

def kish_ess(logw):
    w = np.exp(logw - np.max(logw))
    return float(w.sum() ** 2 / (w ** 2).sum())

def ess_fraction(sigma, d):
    m = sigma ** 2 / np.sqrt(2 * sigma ** 2 - 1)
    return float(m ** (-d))

def ess_sim(sigma, d, n, rng):
    z = rng.normal(0, sigma, size=(n, d))
    logw = (-0.5 * z ** 2 + 0.5 * (z / sigma) ** 2 + np.log(sigma)).sum(axis=1)
    return kish_ess(logw) / n`;

const AC = `import numpy as np

def ar1(rho, n, rng):
    x, e = np.empty(n), rng.normal(size=n) * np.sqrt(1 - rho ** 2)
    x[0] = rng.normal()
    for t in range(1, n):
        x[t] = rho * x[t - 1] + e[t]
    return x

def ess_autocorr(x, max_lag=500):
    x = x - x.mean(); v = x @ x / len(x); s = 0.0
    for k in range(1, max_lag):
        r = (x[:-k] @ x[k:]) / len(x) / v
        if r < 0.05:
            break
        s += r
    return len(x) / (1 + 2 * s)`;

export const lesson: LessonContent = {
  id: "m13.1.4",
  minutes: 45,
  links: {
    requires: ["m13.1.3"],
    revisits: ["m12.2.5", "m13.1.1"],
    foreshadows: ["m13.3.3", "m13.4.1"],
  },

  puzzle: (
    <>
      <p>
        You run importance sampling with 10,000 draws and report an estimate with a standard error computed as if you had
        10,000 independent samples. On inspection, a single draw carries 60% of the total weight. How many samples did you
        really have? And a Markov chain sampler that produces 10,000 highly correlated draws faces the same question. Is
        there one number that says what a pile of unequal or dependent samples is worth?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If all weights are equal, every sample counts fully. If one weight dominates, the estimate is essentially that one
        sample. The effective sample size interpolates: it is the number of equally weighted independent samples that would
        give the same variance. For weights it depends on how uneven they are; for a chain it depends on how slowly
        correlations die away. In high dimensions, small mismatches per coordinate multiply, and the effective size of an
        importance sampler collapses exponentially.
      </p>
      <EssDimViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Kish effective sample size">
        <p>For weights <M>{"w_1, \\dots, w_n \\ge 0"}</M>, not all zero, with normalised weights <M>{"\\bar w_i = w_i / \\sum_j w_j"}</M>,</p>
        <MD>{"\\mathrm{ESS} = \\frac{\\bigl(\\sum_i w_i\\bigr)^2}{\\sum_i w_i^2} = \\frac{1}{\\sum_i \\bar w_i^2}."}</MD>
        <p>
          It is the n for which an equally weighted average has the same variance as{" "}
          <M>{"\\sum_i \\bar w_i Y_i"}</M> with independent <M>{"Y_i"}</M> of equal variance.
        </p>
      </Definition>

      <Theorem title="range of the ESS">
        <p>1 ≤ ESS ≤ n, with ESS = n exactly when all weights are equal and ESS = 1 exactly when one weight is non-zero.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{Var}(\\sum \\bar w_i Y_i) = \\sigma^2\\sum \\bar w_i^2"}</M>, which justifies the definition. By
          Cauchy–Schwarz, <M>{"1 = (\\sum \\bar w_i)^2 \\le n\\sum \\bar w_i^2"}</M>, with equality iff the <M>{"\\bar w_i"}</M> are
          equal. And <M>{"\\sum \\bar w_i^2 \\le \\sum \\bar w_i = 1"}</M> since each <M>{"\\bar w_i \\le 1"}</M>, with equality iff a
          single <M>{"\\bar w_i"}</M> is 1.
        </p>
        <Code>{KE}</Code>
      </Proof>

      <Theorem title="the ESS measures a divergence">
        <p>
          For importance weights <M>{"w = p/q"}</M> of normalised densities and samples from q,{" "}
          <M>{"\\mathrm{ESS}/n \\to 1/\\mathbb E_q[w^2] = e^{-D_2(p \\| q)} \\le e^{-D(p \\| q)}"}</M>, where{" "}
          <M>{"D_2(p \\| q) = \\ln \\int p^2/q"}</M> is the Rényi divergence of order 2. For product densities over d coordinates,{" "}
          <M>{"\\mathbb E_q[w^2]"}</M> is a product of d factors, so the efficiency decays exponentially in d.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the law of large numbers, <M>{"\\frac1n\\sum w_i \\to \\mathbb E_q[w] = 1"}</M> and{" "}
          <M>{"\\frac1n \\sum w_i^2 \\to \\mathbb E_q[w^2]"}</M>; divide. Next,{" "}
          <M>{"\\mathbb E_q[w^2] = \\mathbb E_p[p/q] \\ge \\exp \\mathbb E_p[\\ln(p/q)] = e^{D(p\\|q)}"}</M> by Jensen. For products,
          the integral factorises. With target N(0, 1) and proposal <M>{"N(0, 1.5^2)"}</M> each factor is{" "}
          <M>{"2.25/\\sqrt{3.5} \\approx 1.203"}</M>: efficiency 83% in one dimension, 16% in ten, and about 0.01% in fifty.
        </p>
      </Proof>

      <Theorem title="effective size of a correlated chain">
        <p>
          For a stationary sequence with variance <M>{"\\sigma^2"}</M> and autocorrelations <M>{"\\rho_k"}</M> that are summable, the
          sample mean has variance <M>{"\\frac{\\sigma^2}{n}\\bigl(1 + 2\\sum_{k \\ge 1}\\rho_k\\bigr)(1 + o(1))"}</M>, so{" "}
          <M>{"\\mathrm{ESS} \\approx n/(1 + 2\\sum_k \\rho_k)"}</M>. For an AR(1) chain with <M>{"\\rho_k = \\rho^k"}</M> this is{" "}
          <M>{"n(1-\\rho)/(1+\\rho)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{Var}(\\bar X) = \\frac{1}{n^2}\\sum_{s,t}\\mathrm{Cov}(X_s, X_t) = \\frac{\\sigma^2}{n}\\bigl(1 + 2\\sum_{k=1}^{n-1}(1 - k/n)\\rho_k\\bigr)"}</M>,
          counting the n − k pairs at lag k. Summability lets the weights <M>{"1 - k/n"}</M> tend to 1 by dominated convergence.
          For AR(1), <M>{"1 + 2\\rho/(1-\\rho) = (1+\\rho)/(1-\\rho)"}</M>: with ρ = 0.9, 20,000 draws are worth about 1,050
          independent ones. In practice the <M>{"\\rho_k"}</M> are estimated and the sum is cut off once they become
          negligible, since the noisy tail would otherwise swamp it.
        </p>
        <Code>{AC}</Code>
      </Proof>

      <Remark title="what the ESS cannot see">
        <p>
          The ESS is computed from the samples you have, so it cannot warn about regions you never sampled. If the target has
          two modes and the proposal covers one, the weights can be nearly equal and the ESS close to n while the estimate
          is badly wrong. The same is true of a Markov chain stuck in one mode. A large ESS is necessary, not sufficient.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kish",
      rung: "check",
      prompt: <p>Four samples have weights 1, 1, 1 and 5. What is their effective sample size? Give three decimals.</p>,
      answer: { kind: "numeric", value: 2.286, tolerance: 0.001 },
    },
    {
      key: "ar",
      rung: "check",
      prompt: <p>An AR(1) chain with lag-one correlation 0.8 produces 9,000 draws. What is their effective sample size?</p>,
      answer: { kind: "numeric", value: 1000, tolerance: 0.5 },
    },
    {
      key: "blind",
      rung: "apply",
      prompt: <p>An importance sampler reports ESS close to n, yet its estimate is far from the truth. What is the likeliest cause?</p>,
      answer: {
        kind: "choice",
        options: [
          "The proposal never reaches part of the target, so the weights look even over the region it does cover",
          "The weights are too unequal",
          "n is too large",
          "The ESS formula is biased upwards for large n",
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

def kish_ess(logw):
    w = np.exp(logw - np.max(logw))
    return float(w.sum() ** 2 / (w ** 2).sum())

def ess_fraction(sigma, d):
    m = sigma ** 2 / np.sqrt(2 * sigma ** 2 - 1)
    return float(m ** (-d))

def ess_sim(sigma, d, n, rng):
    z = rng.normal(0, sigma, size=(n, d))
    logw = (-0.5 * z ** 2 + 0.5 * (z / sigma) ** 2 + np.log(sigma)).sum(axis=1)
    return kish_ess(logw) / n

print(kish_ess(np.zeros(10)), round(kish_ess(np.log(np.array([1.0, 1.0, 1.0, 5.0]))), 3), kish_ess(np.array([0.0, -1000.0, -1000.0])))
print([round(ess_fraction(1.5, d), 3) for d in (1, 10, 50)], abs(ess_sim(1.5, 10, 20000, np.random.default_rng(0)) - ess_fraction(1.5, 10)) < 0.02)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10.0 2.286 1.0\n[0.831, 0.158, 0.0] True",
          "10.0 2.286 3.0\n[0.831, 0.158, 0.0] True",
          "10.0 4.0 1.0\n[0.831, 0.158, 0.0] True",
          "10.0 2.286 1.0\n[0.831, 0.831, 0.831] True",
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

def ar1(rho, n, rng):
    x, e = np.empty(n), rng.normal(size=n) * np.sqrt(1 - rho ** 2)
    x[0] = rng.normal()
    for t in range(1, n):
        x[t] = rho * x[t - 1] + e[t]
    return x

def ess_autocorr(x, max_lag=500):
    x = x - x.mean(); v = x @ x / len(x); s = 0.0
    for k in range(1, max_lag):
        r = (x[:-k] @ x[k:]) / len(x) / v
        if r < 0.05:
            break
        s += r
    return len(x) / (1 + 2 * s)

x = ar1(0.9, 20000, np.random.default_rng(1)); print(round(float(np.corrcoef(x[:-1], x[1:])[0, 1]), 1), 900 < ess_autocorr(x) < 1300)
print(ess_autocorr(np.random.default_rng(2).normal(size=1000)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.9 True\n1000.0", "0.9 False\n1000.0", "0.81 True\n1000.0", "0.9 True\n52.6"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kish_ess(logw)</C> from log weights, stably; <C>ess_fraction(sigma, d)</C>, the limiting ESS/n for target
          N(0, I) and proposal <M>{"N(0, \\sigma^2 I)"}</M> in d dimensions; and <C>ess_sim(sigma, d, n, rng)</C>, its simulated
          value.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def kish_ess(logw):
    return float(len(logw))

def ess_fraction(sigma, d):
    return 1.0

def ess_sim(sigma, d, n, rng):
    return 1.0
`,
        solution: KE,
        tests: [
          { name: "kish", code: `assert kish_ess(np.zeros(7)) == 7.0 and abs(kish_ess(np.log(np.array([1.0, 1.0, 1.0, 5.0]))) - 64 / 28) < 1e-12
assert abs(kish_ess(np.array([0.0, -1000.0, -1000.0])) - 1.0) < 1e-12 and abs(kish_ess(np.array([5000.0, 5000.0])) - 2.0) < 1e-12` },
          { name: "dimension", code: `assert ess_fraction(1.0, 5) == 1.0 and abs(ess_fraction(2.0, 2) - 7 / 16) < 1e-12
assert abs(ess_sim(1.5, 3, 20000, np.random.default_rng(0)) - ess_fraction(1.5, 3)) < 0.03 and ess_sim(1.0, 4, 100, np.random.default_rng(1)) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ar1(rho, n, rng)</C>, a stationary chain with unit variance and lag-one correlation rho, and{" "}
          <C>ess_autocorr(x, max_lag)</C>, which sums the sample autocorrelations until the first one below 0.05.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ar1(rho, n, rng):
    return rng.normal(size=n)

def ess_autocorr(x, max_lag=500):
    return float(len(x))
`,
        solution: AC,
        tests: [
          { name: "chain", code: `x = ar1(0.5, 20000, np.random.default_rng(7)); assert abs(np.corrcoef(x[:-1], x[1:])[0, 1] - 0.5) < 0.03 and abs(x.std() - 1) < 0.05` },
          { name: "ess", code: `x = ar1(0.5, 20000, np.random.default_rng(7)); assert 5500 < ess_autocorr(x) < 8000
assert ess_autocorr(np.random.default_rng(2).normal(size=1000)) == 1000.0` },
        ],
      },
    },
    {
      key: "five",
      rung: "stretch",
      prompt: (
        <p>
          Target N(0, I) in five dimensions, proposal <M>{"N(0, 4I)"}</M>. What fraction of the samples is effective in the limit?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1266, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every method so far assumed we could draw from some convenient distribution. The next section builds samplers from
        scratch, starting with the simplest of all: push a uniform number through an inverse distribution function.
      </p>
    </>
  ),
};
