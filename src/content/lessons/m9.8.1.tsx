import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BenchPairViz } from "@/components/viz/BenchPairViz";
import type { LessonContent } from "@/lib/types";

const MCN = `from math import comb, sqrt

def mcnemar_exact(b, c):
    m, k = b + c, min(b, c)
    tail = sum(comb(m, j) for j in range(k + 1)) / 2 ** m
    return min(1.0, 2 * tail)

def paired_se(b, c, n):
    d = (b - c) / n
    return sqrt(((b + c) / n - d * d) / n)`;

const SIM = `import numpy as np

def correlated(n, pa, pb, rho, rng):
    z = rng.uniform(size=n)
    zb = np.where(rng.uniform(size=n) < rho, z, rng.uniform(size=n))
    return (z < pa).astype(float), (zb < pb).astype(float)

def reject_rates(pa, pb, n=1000, rho=0.8, reps=4000, seed=0):
    rng = np.random.default_rng(seed)
    unp = pair = 0
    for _ in range(reps):
        a, b = correlated(n, pa, pb, rho, rng)
        d = a.mean() - b.mean()
        se_u = np.sqrt((a.mean() * (1 - a.mean()) + b.mean() * (1 - b.mean())) / n)
        se_p = (a - b).std() / np.sqrt(n)
        unp += abs(d) > 1.96 * se_u
        pair += abs(d) > 1.96 * se_p
    return float(unp) / reps, float(pair) / reps`;

export const lesson: LessonContent = {
  id: "m9.8.1",
  minutes: 55,
  links: {
    requires: ["m9.4.3", "m9.5.1"],
    revisits: ["m9.4.5", "m9.5.3"],
    foreshadows: ["m9.8.3", "m9.8.4"],
  },

  puzzle: (
    <>
      <p>
        On a 1000-question benchmark, model A scores 80.0% and model B 78.5%. Each accuracy has a standard error of about
        1.3 points, so the usual two-proportion test calls the 1.5-point gap noise. Yet the same two models disagree on only
        45 questions, and A wins 30 of them. Is the gap real? The answer depends entirely on recognising that both models
        answered the same questions.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Questions that both models get right, or both get wrong, say nothing about which model is better; they only add
        noise if you compare accuracies as though they came from separate test sets. Look at the questions where the models
        disagree, and the comparison becomes far sharper.
      </p>
      <BenchPairViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="variance of a paired difference">
        <p>
          Let aᵢ, bᵢ ∈ {"{0, 1}"} record whether models A and B answer question i correctly, for n questions drawn iid. The
          estimated gap <M>{"\\bar d = \\bar a - \\bar b"}</M> has
        </p>
        <MD>{"\\mathrm{Var}(\\bar d) = \\frac{\\mathrm{Var}(a) + \\mathrm{Var}(b) - 2\\,\\mathrm{Cov}(a, b)}{n} = \\frac{(p_{10} + p_{01}) - (p_{10} - p_{01})^2}{n},"}</MD>
        <p>
          where p₁₀ and p₀₁ are the probabilities that only A, or only B, is correct. The unpaired formula omits the
          covariance term, so when the models tend to succeed on the same questions it overstates the standard error.
        </p>
      </Theorem>
      <Proof>
        <p>
          The differences dᵢ = aᵢ − bᵢ are iid, so <M>{"\\mathrm{Var}(\\bar d) = \\mathrm{Var}(d)/n"}</M>, and{" "}
          <M>{"\\mathrm{Var}(a - b) = \\mathrm{Var}(a) + \\mathrm{Var}(b) - 2\\mathrm{Cov}(a, b)"}</M>. Alternatively, d takes the
          values 1, −1 and 0 with probabilities p₁₀, p₀₁ and the rest, so <M>{"\\mathbb{E}[d^2] = p_{10} + p_{01}"}</M> and{" "}
          <M>{"\\mathbb{E}[d] = p_{10} - p_{01}"}</M>.
        </p>
      </Proof>

      <Theorem title="McNemar's exact test">
        <p>
          Let b and c count the questions only A and only B gets right. Under H₀: p₁₀ = p₀₁, conditional on m = b + c, b is
          Binomial(m, 1/2). The two-sided p-value is <M>{"\\min\\big(1, 2P(\\mathrm{Bin}(m, \\tfrac12) \\leq \\min(b, c))\\big)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each question independently falls in one of four cells. Conditional on being discordant, it is an &quot;A
          only&quot; question with probability <M>{"p_{10}/(p_{10} + p_{01})"}</M>, which is 1/2 under H₀; given m discordant
          questions, these are m independent such trials. The concordant questions carry no information about H₀ and drop
          out.
        </p>
        <Code>{MCN}</Code>
      </Proof>

      <Example title="what pairing buys">
        <p>
          In the puzzle, b = 30 and c = 15 give an exact McNemar p-value of 0.036 and a paired standard error of 0.67
          points, against 1.81 points from the unpaired formula. The simulation draws correlated correctness for two
          models: with equal accuracies the unpaired test almost never rejects (it is far too conservative), the paired test
          rejects about 5% of the time, and with a 2-point gap the paired test has about 61% power against 4% unpaired.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="the hidden assumptions">
        <p>
          The formulas treat questions as independent draws from a population of questions. When items come in clusters,
          such as several questions per passage or many prompts generated from one template, correctness is correlated
          within clusters and the effective sample size shrinks by the design effect 1 + (m − 1)ρ for clusters of size m
          with intra-cluster correlation ρ; resample or average by cluster instead. A public test set reused across many
          papers is also a multiple-comparison problem: leaderboard gains of a fraction of the standard error mean little.
          Report the gap with a paired confidence interval, not two separate accuracies.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "se",
      rung: "check",
      prompt: <p>A model scores 90% on 400 independent questions. What is the standard error of its accuracy?</p>,
      answer: { kind: "numeric", value: 0.015, tolerance: 0.0001 },
    },
    {
      key: "mcn",
      rung: "check",
      prompt: <p>Two models disagree on 10 questions: A alone is right on 8, B alone on 2. What is McNemar&apos;s exact two-sided p-value? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1094, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>Which questions does McNemar&apos;s test use to compare two models?</p>,
      answer: { kind: "choice", options: ["Only those on which exactly one model is correct", "Only those both models get right", "All questions equally", "Only those both models get wrong"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from math import comb, sqrt

def mcnemar_exact(b, c):
    m, k = b + c, min(b, c)
    tail = sum(comb(m, j) for j in range(k + 1)) / 2 ** m
    return min(1.0, 2 * tail)

def paired_se(b, c, n):
    d = (b - c) / n
    return sqrt(((b + c) / n - d * d) / n)

print(round(mcnemar_exact(30, 15), 4), round(mcnemar_exact(5, 5), 4))
print(round(paired_se(30, 15, 1000), 4), round(sqrt(0.8 * 0.2 / 1000 + 0.785 * 0.215 / 1000), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0357 1.0\n0.0067 0.0181", "0.0179 1.0\n0.0067 0.0181", "0.0357 0.5\n0.0067 0.0181", "0.0357 1.0\n0.0181 0.0067"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def correlated(n, pa, pb, rho, rng):
    z = rng.uniform(size=n)
    zb = np.where(rng.uniform(size=n) < rho, z, rng.uniform(size=n))
    return (z < pa).astype(float), (zb < pb).astype(float)

def reject_rates(pa, pb, n=1000, rho=0.8, reps=4000, seed=0):
    rng = np.random.default_rng(seed)
    unp = pair = 0
    for _ in range(reps):
        a, b = correlated(n, pa, pb, rho, rng)
        d = a.mean() - b.mean()
        se_u = np.sqrt((a.mean() * (1 - a.mean()) + b.mean() * (1 - b.mean())) / n)
        se_p = (a - b).std() / np.sqrt(n)
        unp += abs(d) > 1.96 * se_u
        pair += abs(d) > 1.96 * se_p
    return float(unp) / reps, float(pair) / reps

print(reject_rates(0.8, 0.8))
print(reject_rates(0.8, 0.78))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(0.0, 0.04725)\n(0.038, 0.6115)", "(0.05, 0.05)\n(0.6115, 0.038)", "(0.04725, 0.0)\n(0.6115, 0.038)", "(0.05, 0.04725)\n(0.6, 0.6115)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mcnemar_exact(b, c)</C>, the exact two-sided McNemar p-value, and <C>paired_se(b, c, n)</C>, the standard
          error √((b + c)/n − d²)/√n of the accuracy gap, with d = (b − c)/n.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from math import comb, sqrt

def mcnemar_exact(b, c):
    return 1.0

def paired_se(b, c, n):
    return 0.0
`,
        solution: MCN,
        tests: [
          { name: "mcn", code: `assert abs(mcnemar_exact(8, 2) - 112 / 1024) < 1e-12 and abs(mcnemar_exact(2, 8) - 112 / 1024) < 1e-12
assert mcnemar_exact(0, 0) == 1.0` },
          { name: "se", code: `from math import sqrt
assert abs(paired_se(10, 10, 100) - sqrt(0.2 / 100)) < 1e-12
assert paired_se(5, 0, 5) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>correlated(n, pa, pb, rho, rng)</C>, returning 0/1 float arrays for A and B, where A is correct when a
          uniform z is below pa and B uses the same z with probability ρ (else a fresh uniform) compared with pb, and{" "}
          <C>reject_rates(pa, pb, n=1000, rho=0.8, reps=4000, seed=0)</C>, the fractions of simulated benchmarks on which the
          unpaired and the paired z-tests reject at 5%.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def correlated(n, pa, pb, rho, rng):
    return np.zeros(n), np.zeros(n)

def reject_rates(pa, pb, n=1000, rho=0.8, reps=4000, seed=0):
    return 0.0, 0.0
`,
        solution: SIM,
        tests: [
          { name: "corr", code: `import numpy as np
a, b = correlated(100000, 0.7, 0.7, 1.0, np.random.default_rng(0))
assert np.array_equal(a, b) and abs(a.mean() - 0.7) < 0.01
a, b = correlated(100000, 0.7, 0.6, 0.0, np.random.default_rng(1))
assert abs(np.mean(a * b) - 0.42) < 0.01` },
          { name: "rates", code: `u, p = reject_rates(0.8, 0.8, reps=1500)
assert u < 0.01 and abs(p - 0.05) < 0.02` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For iid pairs (aᵢ, bᵢ) of 0/1 outcomes, prove that Var(ā − b̄) = (Var(a) + Var(b) − 2Cov(a, b))/n, and conclude that the unpaired standard error √((Var(a) + Var(b))/n) is too large whenever Cov(a, b) &gt; 0.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes ā − b̄ as the mean of the iid differences dᵢ = aᵢ − bᵢ, so its variance is Var(d)/n.",
          "Expands Var(a − b) = Var(a) + Var(b) − 2Cov(a, b).",
          "Concludes that a positive covariance makes the true variance smaller than (Var(a) + Var(b))/n, so the unpaired formula overstates the standard error.",
        ],
      },
    },
    {
      key: "deff",
      rung: "stretch",
      prompt: <p>A benchmark has 1000 questions in clusters of 10 with intra-cluster correlation 0.2. What is the effective sample size n/(1 + (m − 1)ρ)? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 357.14, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend why two models evaluated on the same benchmark should be compared with a paired analysis, how McNemar's test works, how much pairing reduces the standard error when models agree, and how clustered questions shrink the effective sample size.",

  glimpse: (
    <>
      <p>
        Questions are not the only source of noise. Retrain the same model with a different random seed and its score
        moves too. The next lesson measures that variance and shows how to account for it.
      </p>
    </>
  ),
};
