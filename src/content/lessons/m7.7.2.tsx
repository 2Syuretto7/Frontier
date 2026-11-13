import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CltHistViz } from "@/components/viz/CltHistViz";
import type { LessonContent } from "@/lib/types";

const APPROX = `import math

def phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def clt_approx(n, mu, sigma, a, b):
    s = sigma * math.sqrt(n)
    return phi((b - n * mu) / s) - phi((a - n * mu) / s)`;

const SIM = `import numpy as np

def standardized_sums(rng, sampler, mu, sigma, n, reps):
    s = sampler(rng, (reps, n)).sum(axis=1)
    return (s - n * mu) / (sigma * np.sqrt(n))

def frac_below(z, t):
    return float(np.mean(z <= t))`;

export const lesson: LessonContent = {
  id: "m7.7.2",
  minutes: 65,
  links: {
    requires: ["m7.7.1", "m7.4.1", "m7.3.2"],
    revisits: ["m7.2.2", "m7.5.4"],
    foreshadows: ["m7.7.3", "m9.5.1"],
  },

  puzzle: (
    <>
      <p>
        Heights, measurement errors, exam totals, the noise in a minibatch gradient: bell curves appear everywhere, even
        when the underlying pieces look nothing like a bell. Why should a sum of skewed, lumpy or even two-valued random
        variables end up with the same shape every time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sum of many small independent pieces forgets the details of each piece. After centring and scaling, only the mean
        and variance survive; the skewness and everything higher shrink away as n grows. The one shape that is stable under
        adding independent copies and rescaling, with finite variance, is the normal.
      </p>
      <CltHistViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="central limit theorem">
        <p>
          Let <M>{"X_1, X_2, \\dots"}</M> be i.i.d. with mean μ and variance <M>{"0 < \\sigma^2 < \\infty"}</M>, and{" "}
          <M>{"S_n = X_1 + \\dots + X_n"}</M>. Then for every real z,
        </p>
        <MD>{"P\\Big(\\frac{S_n - n\\mu}{\\sigma\\sqrt n} \\le z\\Big) \\to \\Phi(z), \\qquad \\text{equivalently} \\qquad P\\Big(\\frac{\\sqrt n(\\bar X_n - \\mu)}{\\sigma} \\le z\\Big) \\to \\Phi(z)."}</MD>
        <p>This mode of convergence, of CDFs at every point, is convergence in distribution.</p>
      </Theorem>
      <Proof>
        <p>
          We prove it when the MGF of <M>{"X_1"}</M> exists near 0, using the continuity theorem: if MGFs converge to an MGF
          on an interval around 0, the distributions converge. Let <M>{"Y_i = (X_i - \\mu)/\\sigma"}</M>, with mean 0 and
          variance 1, and MGF <M>{"M(s) = 1 + s^2/2 + o(s^2)"}</M> as <M>{"s \\to 0"}</M> by Taylor&apos;s theorem. The
          standardised sum is <M>{"Z_n = (Y_1 + \\dots + Y_n)/\\sqrt n"}</M>, so by independence
        </p>
        <MD>{"M_{Z_n}(t) = M(t/\\sqrt n)^n = \\Big(1 + \\frac{t^2}{2n} + o(1/n)\\Big)^n \\to e^{t^2/2},"}</MD>
        <p>
          which is the MGF of N(0, 1). The general case uses characteristic functions in the same way.
        </p>
      </Proof>
      <Remark title="what it does and does not say">
        <p>
          It is a statement about distributions, for large n, of standardised sums. It does not say a single draw is normal,
          and it says nothing about how large n must be. The Berry–Esseen theorem gives a rate: the CDF error is at most a
          constant times <M>{"E|Y_1|^3/\\sqrt n"}</M>, so skewed or heavy-tailed draws need larger n. Infinite variance breaks it
          altogether.
        </p>
      </Remark>

      <Example title="normal approximation to the binomial">
        <p>
          A Bin(n, p) count is a sum of n Bernoulli draws, so it is approximately{" "}
          <M>{"N(np, np(1 - p))"}</M>. For 100 fair coin tosses, P(40 ≤ S ≤ 60) ≈ Φ(2) − Φ(−2) = 0.9545, against the exact
          0.9648. Because S takes integer values, widening the interval by a half at each end, the continuity correction,
          gives 0.9643, much closer.
        </p>
        <Code>{APPROX}</Code>
      </Example>

      <Example title="watching the skew fade">
        <p>
          For exponential draws the standardised sum has skewness <M>{"2/\\sqrt n"}</M>. The fraction of standardised sums
          below 0, which is 0.5 for the normal, starts at 0.63 for n = 1 and creeps down.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="error bars">
        <p>
          The practical form: <M>{"\\bar X_n"}</M> is approximately <M>{"N(\\mu, \\sigma^2/n)"}</M>, so{" "}
          <M>{"\\bar X_n \\pm 1.96\\,\\sigma/\\sqrt n"}</M> covers μ about 95% of the time. To halve the error you need four
          times the data. This is where the standard error of every reported accuracy, A/B test and Monte Carlo estimate comes
          from.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sd",
      rung: "check",
      prompt: <p>100 i.i.d. draws each have variance 4. What is the standard deviation of their sum?</p>,
      answer: { kind: "numeric", value: 20, tolerance: 0.0001 },
    },
    {
      key: "approx",
      rung: "check",
      prompt: <p>With mean 3 per draw in the same setting, use the CLT to approximate P(S₁₀₀ ≤ 320). Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8413, tolerance: 0.0002 },
    },
    {
      key: "bar",
      rung: "apply",
      prompt: <p>400 i.i.d. measurements have σ = 2. What is the half-width of the approximate 95% interval X̄ ± 1.96σ/√n?</p>,
      answer: { kind: "choice", options: ["0.196", "0.0098", "3.92", "0.1"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def phi(z):
    return 0.5 * (1 + math.erf(z / math.sqrt(2)))

def clt_approx(n, mu, sigma, a, b):
    s = sigma * math.sqrt(n)
    return phi((b - n * mu) / s) - phi((a - n * mu) / s)

print(round(phi(1.96), 4), round(clt_approx(100, 0.5, 0.5, 40, 60), 4))
print(round(clt_approx(100, 0.5, 0.5, 39.5, 60.5), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.975 0.9545\n0.9643", "0.975 0.9772\n0.9643", "0.95 0.9545\n0.9643", "0.975 0.9545\n0.9545"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def standardized_sums(rng, sampler, mu, sigma, n, reps):
    s = sampler(rng, (reps, n)).sum(axis=1)
    return (s - n * mu) / (sigma * np.sqrt(n))

def frac_below(z, t):
    return float(np.mean(z <= t))

rng = np.random.default_rng(0)
expo = lambda r, size: r.exponential(1.0, size)
for n in (1, 30, 1000):
    print(n, round(frac_below(standardized_sums(rng, expo, 1, 1, n, 20000), 0), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0.63\n30 0.53\n1000 0.51",
          "1 0.5\n30 0.5\n1000 0.5",
          "1 0.37\n30 0.47\n1000 0.49",
          "1 0.63\n30 0.63\n1000 0.63",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>phi(z)</C>, the standard normal CDF using math.erf, and <C>clt_approx(n, mu, sigma, a, b)</C>, the normal
          approximation to P(a ≤ Sₙ ≤ b) for a sum of n i.i.d. draws with mean mu and standard deviation sigma.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def phi(z):
    return 0.5

def clt_approx(n, mu, sigma, a, b):
    return 0.0
`,
        solution: APPROX,
        tests: [
          { name: "phi", code: `assert abs(phi(0) - 0.5) < 1e-12 and abs(phi(1.96) - 0.9750021) < 1e-6 and abs(phi(-1) + phi(1) - 1) < 1e-12` },
          { name: "approx", code: `assert abs(clt_approx(100, 0.5, 0.5, 40, 60) - 0.9544997) < 1e-6
assert abs(clt_approx(100, 3, 2, -1e9, 320) - 0.8413447) < 1e-6
assert abs(clt_approx(4, 0, 1, -2, 2) - (phi(1) - phi(-1))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>standardized_sums(rng, sampler, mu, sigma, n, reps)</C>, where <C>sampler(rng, size)</C> returns draws of
          the given shape: draw a (reps, n) array, sum each row and return the array of (S − nμ)/(σ√n). Also write{" "}
          <C>frac_below(z, t)</C>, the fraction of entries ≤ t, as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def standardized_sums(rng, sampler, mu, sigma, n, reps):
    return np.zeros(reps)

def frac_below(z, t):
    return 0.0
`,
        solution: SIM,
        tests: [
          { name: "deterministic", code: `ones = lambda r, size: np.ones(size)
z = standardized_sums(np.random.default_rng(0), ones, 0.5, 2.0, 16, 7)
assert z.shape == (7,) and np.allclose(z, (16 - 8) / 8)
assert frac_below(np.array([-1.0, 0.0, 2.0, 3.0]), 0) == 0.5 and isinstance(frac_below(np.zeros(2), 1), float)` },
          { name: "moments", code: `u = lambda r, size: r.random(size)
z = standardized_sums(np.random.default_rng(2), u, 0.5, (1 / 12) ** 0.5, 12, 50000)
assert abs(z.mean()) < 0.02 and abs(z.std() - 1) < 0.02 and abs(frac_below(z, 1.0) - 0.8413) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let <M>{"Y_1, Y_2, \\dots"}</M> be i.i.d. with mean 0, variance 1 and an MGF M that exists near 0. Show that the MGF of{" "}
          <M>{"Z_n = (Y_1 + \\dots + Y_n)/\\sqrt n"}</M> tends to <M>{"e^{t^2/2}"}</M>, and say why this proves the CLT for them.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses independence to write M_{Z_n}(t) = M(t/√n)^n.",
          "Expands M(s) = 1 + s²/2 + o(s²) from mean 0 and variance 1, and shows (1 + t²/2n + o(1/n))^n → e^{t²/2} (for example via logs).",
          "Identifies e^{t²/2} as the N(0, 1) MGF and invokes the continuity theorem to get convergence in distribution.",
        ],
      },
    },
    {
      key: "cc",
      rung: "stretch",
      prompt: (
        <p>
          Use the normal approximation with continuity correction to estimate P(S ≥ 60) for the number of heads S in 100 fair
          tosses. Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0287, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what the central limit theorem says about standardised sums, why only the mean and variance survive, how the MGF proof goes, and how it gives the familiar ±1.96σ/√n error bar.",

  glimpse: (
    <>
      <p>
        The two limit theorems together justify Monte Carlo: estimate an expectation by averaging simulated draws, and the
        CLT says how large the error is. The next lesson builds estimators this way and learns to make their variance smaller.
      </p>
    </>
  ),
};
