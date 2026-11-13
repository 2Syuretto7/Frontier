import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PeekingViz } from "@/components/viz/PeekingViz";
import type { LessonContent } from "@/lib/types";

const PVAL = `from math import erf, sqrt

def p_two_sided(z):
    return 1 - erf(abs(z) / sqrt(2))

def prob_null_given_sig(prior_null, alpha, power):
    false_pos = prior_null * alpha
    true_pos = (1 - prior_null) * power
    return false_pos / (false_pos + true_pos)`;

const SIM = `import numpy as np

def uniform_check(n, reps=100000, seed=0):
    z = np.random.default_rng(seed).normal(size=(reps, n)).mean(axis=1) * np.sqrt(n)
    return [round(float(np.mean(np.abs(z) > c)), 3) for c in (0.674, 1.645, 1.96)]

def peeking_rate(looks, step=10, reps=20000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, looks * step))
    S = X.cumsum(axis=1)[:, step - 1::step]
    z = S / np.sqrt(step * np.arange(1, looks + 1))
    return float(np.mean((np.abs(z) > 1.96).any(axis=1)))`;

export const lesson: LessonContent = {
  id: "m9.4.4",
  minutes: 55,
  links: {
    requires: ["m9.4.3", "m7.1.4"],
    revisits: ["m7.3.3", "m9.4.1"],
    foreshadows: ["m9.4.5", "m9.8.1"],
  },

  puzzle: (
    <>
      <p>
        A paper reports that a new training trick improves accuracy with p = 0.03. Many readers conclude there is a 97%
        chance the trick works. That is wrong, and in fields where most tried ideas fail, the chance it works can be below
        one half. What does a p-value actually measure, and how do honest experimenters end up fooling themselves with it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A p-value asks: if nothing were going on, how often would data at least this extreme turn up? It says nothing
        directly about how likely the null is. And because it is calibrated only for a plan fixed in advance, looking at
        the data repeatedly and stopping when it looks good breaks the calibration.
      </p>
      <PeekingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="p-value">
        <p>For a test that rejects for large values of a statistic T, the p-value of observed data x is</p>
        <MD>{"p(x) = \\sup_{\\theta \\in \\Theta_0} P_\\theta\\big(T(X) \\geq T(x)\\big)."}</MD>
        <p>
          The level α test rejects exactly when p(x) ≤ α. For the two-sided z-test, <M>{"p = 2\\Phi(-|z|)"}</M>.
        </p>
      </Definition>

      <Theorem title="p-values are uniform under the null">
        <p>
          If the null is simple and T has a continuous distribution function F under it, then p(X) is Uniform(0, 1) under
          the null. In particular <M>{"P(p \\leq \\alpha) = \\alpha"}</M> for every α.
        </p>
      </Theorem>
      <Proof>
        <p>
          Here <M>{"p(X) = 1 - F(T(X))"}</M>. By the probability integral transform, F(T) is Uniform(0, 1) when F is continuous,
          and so is one minus it. Concretely, <M>{"P(p \\leq \\alpha) = P(F(T) \\geq 1 - \\alpha) = \\alpha"}</M>.
        </p>
        <Code>{PVAL}</Code>
      </Proof>

      <Example title="misuse 1: p is not the probability that the null is true">
        <p>
          Suppose a fraction π of the ideas you test do nothing, you test at level α, and the power for real effects is β.
          Among significant results, the fraction that are false alarms is, by Bayes&apos; rule,
        </p>
        <MD>{"P(H_0 \\mid \\text{significant}) = \\frac{\\pi\\alpha}{\\pi\\alpha + (1 - \\pi)\\beta}."}</MD>
        <p>
          With π = 0.9, α = 0.05, β = 0.8, this is 0.36: over a third of &quot;discoveries&quot; are false, even though
          each test is valid.
        </p>
      </Example>

      <Example title="misuse 2: optional stopping and other forking paths">
        <p>
          The simulation checks the uniformity theorem for a fixed n, then peeks at the data every 10 observations. With 20
          looks, about a quarter of null experiments eventually hit p &lt; 0.05. Trying several metrics, seeds, subsets or
          preprocessing choices and reporting the best has the same effect. The cures are to fix the analysis in advance,
          or to use methods designed for sequential looks.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="misuse 3 and 4: size of effect, and absence of evidence">
        <p>
          A p-value mixes effect size with sample size: with a million test examples, a 0.1% accuracy gain can have a tiny
          p-value and still not matter. Report the effect with a confidence interval instead. Conversely, p &gt; 0.05 from a
          small, low-power experiment is not evidence that there is no effect; it may simply be too small to see. A p-value
          is one summary of one fixed procedure, not a verdict.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "z",
      rung: "check",
      prompt: <p>What is the two-sided p-value for z = 2.5? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0124, tolerance: 0.0001 },
    },
    {
      key: "fdr",
      rung: "check",
      prompt: <p>If 80% of tested ideas are null, α = 0.05 and power is 0.5, what fraction of significant results are false alarms? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2857, tolerance: 0.0002 },
    },
    {
      key: "meaning",
      rung: "apply",
      prompt: <p>An experiment reports p = 0.03. Which statement is correct?</p>,
      answer: {
        kind: "choice",
        options: [
          "If the null hypothesis were true, a result at least this extreme would occur about 3% of the time",
          "There is a 3% chance the null hypothesis is true",
          "There is a 97% chance the effect is real",
          "The effect is large",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import erf, sqrt

def p_two_sided(z):
    return 1 - erf(abs(z) / sqrt(2))

def prob_null_given_sig(prior_null, alpha, power):
    false_pos = prior_null * alpha
    true_pos = (1 - prior_null) * power
    return false_pos / (false_pos + true_pos)

print(round(p_two_sided(1.96), 4), round(p_two_sided(-1.0), 4), p_two_sided(0))
print(round(prob_null_given_sig(0.9, 0.05, 0.8), 4), round(prob_null_given_sig(0.5, 0.05, 0.8), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.05 0.3173 1.0\n0.36 0.0588", "0.025 0.1587 0.5\n0.36 0.0588", "0.05 0.3173 1.0\n0.0588 0.36", "0.05 0.6827 1.0\n0.36 0.0588"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def uniform_check(n, reps=100000, seed=0):
    z = np.random.default_rng(seed).normal(size=(reps, n)).mean(axis=1) * np.sqrt(n)
    return [round(float(np.mean(np.abs(z) > c)), 3) for c in (0.674, 1.645, 1.96)]

def peeking_rate(looks, step=10, reps=20000, seed=0):
    X = np.random.default_rng(seed).normal(size=(reps, looks * step))
    S = X.cumsum(axis=1)[:, step - 1::step]
    z = S / np.sqrt(step * np.arange(1, looks + 1))
    return float(np.mean((np.abs(z) > 1.96).any(axis=1)))

print(uniform_check(10))
print([round(peeking_rate(k), 3) for k in (1, 5, 20)])`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.5, 0.1, 0.05]\n[0.049, 0.141, 0.249]", "[0.5, 0.1, 0.05]\n[0.049, 0.049, 0.049]", "[0.25, 0.05, 0.025]\n[0.049, 0.141, 0.249]", "[0.5, 0.1, 0.05]\n[0.049, 0.25, 0.64]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_two_sided(z)</C>, the two-sided normal p-value 2Φ(−|z|) using math.erf, and{" "}
          <C>prob_null_given_sig(prior_null, alpha, power)</C>, the probability that a significant result came from a true
          null.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import erf, sqrt

def p_two_sided(z):
    return 0.0

def prob_null_given_sig(prior_null, alpha, power):
    return alpha
`,
        solution: PVAL,
        tests: [
          { name: "p", code: `assert abs(p_two_sided(0) - 1) < 1e-12 and abs(p_two_sided(-2.576) - 0.01) < 1e-4` },
          { name: "bayes", code: `assert abs(prob_null_given_sig(0.5, 0.05, 0.05) - 0.5) < 1e-12
assert abs(prob_null_given_sig(0.8, 0.05, 0.5) - 0.04 / 0.14) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>uniform_check(n, reps=100000, seed=0)</C>, which simulates z-statistics of standard normal samples and
          returns the fractions with |z| above 0.674, 1.645 and 1.96 (rounded to 3 places), and{" "}
          <C>peeking_rate(looks, step=10, reps=20000, seed=0)</C>, the fraction of null experiments in which |z| exceeds 1.96
          at any of the looks after step, 2·step, … observations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def uniform_check(n, reps=100000, seed=0):
    return [0.0, 0.0, 0.0]

def peeking_rate(looks, step=10, reps=20000, seed=0):
    return 0.05
`,
        solution: SIM,
        tests: [
          { name: "uniform", code: `u = uniform_check(5, reps=40000)
assert abs(u[0] - 0.5) < 0.015 and abs(u[2] - 0.05) < 0.006` },
          { name: "peek", code: `a, b = peeking_rate(1, reps=10000), peeking_rate(10, reps=10000)
assert abs(a - 0.05) < 0.008 and b > 0.15` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Let T have a continuous, strictly increasing distribution function F under a simple null, and let p = 1 − F(T). Prove that P(p ≤ α) = α for every α in [0, 1].</p>,
      answer: {
        kind: "written",
        rubric: [
          "Rewrites the event p ≤ α as F(T) ≥ 1 − α, equivalently T ≥ F⁻¹(1 − α).",
          "Uses continuity of F to get P(T ≥ F⁻¹(1 − α)) = 1 − F(F⁻¹(1 − α)).",
          "Concludes this equals 1 − (1 − α) = α, so p is Uniform(0, 1).",
        ],
      },
    },
    {
      key: "many",
      rung: "stretch",
      prompt: <p>You run 20 independent tests at α = 0.05 and every null is true. What is the probability that at least one test is significant? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6415, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend what a p-value is and is not, why it is uniformly distributed under the null, how the fraction of false discoveries depends on the prior and the power, and how optional stopping inflates false positives.",

  glimpse: (
    <>
      <p>
        Running 20 tests on true nulls gives a 64% chance of at least one false alarm. The next lesson controls such
        multiple testing, first by the family-wise error rate and then by the false discovery rate.
      </p>
    </>
  ),
};
