import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PowerCurveViz } from "@/components/viz/PowerCurveViz";
import type { LessonContent } from "@/lib/types";

const BINOM = `from math import comb

def binom_tail(n, k, p=0.5):
    return sum(comb(n, j) * p ** j * (1 - p) ** (n - j) for j in range(k, n + 1))

def reject_from(n, alpha, p=0.5):
    k = n + 1
    while k > 0 and binom_tail(n, k - 1, p) <= alpha:
        k -= 1
    return k`;

const ZTEST = `import numpy as np
from math import erf, sqrt

def Phi(x):
    return 0.5 * (1 + erf(x / sqrt(2)))

def z_power(delta, n, sigma=1.0, z=1.96):
    s = sqrt(n) * delta / sigma
    return Phi(-z + s) + Phi(-z - s)

def sim_power(delta, n, reps=100000, seed=0):
    X = np.random.default_rng(seed).normal(delta, 1.0, size=(reps, n))
    return float(np.mean(np.sqrt(n) * np.abs(X.mean(axis=1)) > 1.96))`;

export const lesson: LessonContent = {
  id: "m9.4.1",
  minutes: 55,
  links: {
    requires: ["m9.3.5", "m9.1.2"],
    revisits: ["m7.2.2", "m7.7.2"],
    foreshadows: ["m9.4.2", "m9.4.4", "m9.8.4"],
  },

  puzzle: (
    <>
      <p>
        A friend claims a coin is fair. You flip it 20 times and get 15 heads. Is that enough to call the claim false?
        Fair coins do sometimes give 15 heads, so no amount of data proves unfairness for certain. What you can do is fix
        in advance how often you are willing to wrongly accuse a fair coin, and design the rule around that.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A test is a rule, decided before seeing data, that says which outcomes are too surprising under the claim. The
        rule&apos;s false alarm rate is controlled at α; its ability to detect a real effect, the power, depends on how big
        the effect is and how much data you have.
      </p>
      <PowerCurveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tests, errors, size and power">
        <p>
          A test of a null hypothesis <M>{"H_0: \\theta \\in \\Theta_0"}</M> against an alternative{" "}
          <M>{"H_1: \\theta \\in \\Theta_1"}</M> is a rejection region R: reject H₀ when the data fall in R. Its power
          function is <M>{"\\beta(\\theta) = P_\\theta(X \\in R)"}</M>.
        </p>
        <ul>
          <li>A type I error rejects a true H₀; its probability is β(θ) for θ ∈ Θ₀.</li>
          <li>A type II error fails to reject a false H₀; its probability is 1 − β(θ) for θ ∈ Θ₁.</li>
          <li>The size is <M>{"\\sup_{\\theta \\in \\Theta_0} \\beta(\\theta)"}</M>; a test has level α if its size is at most α.</li>
        </ul>
      </Definition>

      <Example title="an exact binomial test">
        <p>
          To test p = 1/2 against p &gt; 1/2 with 20 flips, reject when the number of heads is at least k, choosing the
          smallest k with <M>{"P_{1/2}(X \\geq k) \\leq 0.05"}</M>. That is k = 15, with size 0.0207: discreteness means the
          size is below the nominal 0.05, since k = 14 would give 0.0577. With 5 flips and α = 0.01 no rejection region
          works at all, since even 5 heads has probability 1/32. The power against p = 0.7 is only 0.42.
        </p>
        <Code>{BINOM}</Code>
      </Example>

      <Theorem title="the z-test">
        <p>
          For a normal sample with known σ, the test rejecting μ = 0 when{" "}
          <M>{"|\\sqrt n\\,\\bar X/\\sigma| > z_{\\alpha/2}"}</M> has size α and power
        </p>
        <MD>{"\\beta(\\mu) = \\Phi(-z_{\\alpha/2} + s) + \\Phi(-z_{\\alpha/2} - s), \\qquad s = \\sqrt n\\,\\mu/\\sigma,"}</MD>
        <p>which tends to 1 as n → ∞ for every μ ≠ 0.</p>
      </Theorem>
      <Proof>
        <p>
          Under μ, <M>{"Z = \\sqrt n\\,\\bar X/\\sigma"}</M> is N(s, 1), so Z − s is standard normal. Then{" "}
          <M>{"P(Z > z) = P(Z - s > z - s) = \\Phi(-z + s)"}</M> and <M>{"P(Z < -z) = \\Phi(-z - s)"}</M>. At μ = 0 the sum is{" "}
          <M>{"2\\Phi(-z_{\\alpha/2}) = \\alpha"}</M>. For μ ≠ 0, |s| → ∞, so one of the two terms tends to 1.
        </p>
        <Code>{ZTEST}</Code>
      </Proof>

      <Remark title="asymmetry and its consequences">
        <p>
          The two hypotheses are not treated alike: α is controlled, the type II error is not. &quot;Fail to reject&quot; is
          therefore not &quot;accept&quot;: with low power, a real effect is often missed. Before running an experiment,
          choose α, the smallest effect worth detecting, and a sample size giving enough power, commonly 80%. For a
          two-sided z-test that needs roughly <M>{"n = ((z_{\\alpha/2} + z_{0.2})\\sigma/\\delta)^2"}</M>, with{" "}
          <M>{"z_{0.2} \\approx 0.84"}</M>. Comparing two models on a benchmark is a test of exactly this kind, as the final
          chapter will show.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>The test rejecting p = 1/2 when at least 15 of 20 flips are heads: what is its exact size? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0207, tolerance: 0.0001 },
    },
    {
      key: "power",
      rung: "check",
      prompt: <p>For the two-sided z-test at α = 0.05 with σ = 1 and n = 25, what is the power when μ = 0.5? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.7054, tolerance: 0.0005 },
    },
    {
      key: "type2",
      rung: "apply",
      prompt: <p>What is a type II error?</p>,
      answer: { kind: "choice", options: ["Failing to reject a false null hypothesis", "Rejecting a true null hypothesis", "Choosing the wrong significance level", "Rejecting a false null hypothesis"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb

def binom_tail(n, k, p=0.5):
    return sum(comb(n, j) * p ** j * (1 - p) ** (n - j) for j in range(k, n + 1))

def reject_from(n, alpha, p=0.5):
    k = n + 1
    while k > 0 and binom_tail(n, k - 1, p) <= alpha:
        k -= 1
    return k

k = reject_from(20, 0.05)
print(k, round(binom_tail(20, k), 4), round(binom_tail(20, k - 1), 4))
print(round(binom_tail(20, k, 0.7), 4), reject_from(5, 0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["15 0.0207 0.0577\n0.4164 6", "14 0.0577 0.1316\n0.4164 6", "15 0.0207 0.0577\n0.4164 5", "15 0.0577 0.0207\n0.4164 6"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from math import erf, sqrt

def Phi(x):
    return 0.5 * (1 + erf(x / sqrt(2)))

def z_power(delta, n, sigma=1.0, z=1.96):
    s = sqrt(n) * delta / sigma
    return Phi(-z + s) + Phi(-z - s)

def sim_power(delta, n, reps=100000, seed=0):
    X = np.random.default_rng(seed).normal(delta, 1.0, size=(reps, n))
    return float(np.mean(np.sqrt(n) * np.abs(X.mean(axis=1)) > 1.96))

print(round(z_power(0, 25), 4), round(z_power(0.5, 25), 4))
print(round(sim_power(0, 25), 3), round(sim_power(0.5, 25), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.05 0.7054\n0.05 0.704", "0.025 0.7054\n0.025 0.704", "0.05 0.2946\n0.05 0.296", "0.0 0.7054\n0.05 0.704"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>binom_tail(n, k, p=0.5)</C>, the probability of at least k successes, and <C>reject_from(n, alpha, p=0.5)</C>,
          the smallest k with tail probability at most alpha, or n + 1 if even k = n fails.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb

def binom_tail(n, k, p=0.5):
    return 0.0

def reject_from(n, alpha, p=0.5):
    return n + 1
`,
        solution: BINOM,
        tests: [
          { name: "tail", code: `assert abs(binom_tail(3, 2) - 0.5) < 1e-12 and abs(binom_tail(4, 0, 0.3) - 1) < 1e-12` },
          { name: "region", code: `assert reject_from(10, 0.05) == 9
assert reject_from(3, 0.1) == 4 and reject_from(4, 0.1) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>Phi(x)</C> using math.erf, <C>z_power(delta, n, sigma=1.0, z=1.96)</C>, the power formula of the two-sided
          z-test, and <C>sim_power(delta, n, reps=100000, seed=0)</C>, which estimates the same power by simulating N(δ, 1)
          samples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import erf, sqrt

def Phi(x):
    return 0.5

def z_power(delta, n, sigma=1.0, z=1.96):
    return 0.0

def sim_power(delta, n, reps=100000, seed=0):
    return 0.0
`,
        solution: ZTEST,
        tests: [
          { name: "formula", code: `assert abs(Phi(0) - 0.5) < 1e-12 and abs(Phi(1.96) - 0.975) < 1e-3
assert abs(z_power(0, 10) - 0.05) < 1e-3 and z_power(1, 16) > 0.97` },
          { name: "sim", code: `assert abs(sim_power(0.3, 50, reps=40000) - z_power(0.3, 50)) < 0.01` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For iid N(μ, σ²) data with σ known, prove that the test rejecting μ = 0 when |√n X̄/σ| &gt; z_(α/2) has size α and that its power at any fixed μ ≠ 0 tends to 1 as n → ∞.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes that Z = √n X̄/σ is N(√nμ/σ, 1), in particular N(0, 1) under μ = 0.",
          "Computes the size: P(|Z| > z_(α/2)) = 2Φ(−z_(α/2)) = α under μ = 0.",
          "Shows the power Φ(−z + s) + Φ(−z − s) with s = √nμ/σ tends to 1 because |s| → ∞, or an equivalent argument.",
        ],
      },
    },
    {
      key: "n80",
      rung: "stretch",
      prompt: <p>Using n = ((1.96 + 0.8416)/δ)² for the two-sided z-test with σ = 1, how many observations give 80% power at δ = 0.25? Round up to a whole number.</p>,
      answer: { kind: "numeric", value: 126, tolerance: 0.5 },
    },
  ],

  teachBack:
    "Explain to a friend what a hypothesis test is, the difference between type I and type II errors, what size and power mean, why a failure to reject is not evidence for the null, and how sample size controls power.",

  glimpse: (
    <>
      <p>
        Many rejection regions have the same size. Which one has the most power? For a simple null against a simple
        alternative, the Neyman-Pearson lemma answers exactly: reject where the likelihood ratio is large.
      </p>
    </>
  ),
};
