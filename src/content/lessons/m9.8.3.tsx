import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PairedTViz } from "@/components/viz/PairedTViz";
import type { LessonContent } from "@/lib/types";

const TT = `from statistics import mean, stdev

def paired_t(a, b):
    d = [x - y for x, y in zip(a, b)]
    return mean(d) / (stdev(d) / len(d) ** 0.5)

def welch_t(a, b):
    va, vb = stdev(a) ** 2 / len(a), stdev(b) ** 2 / len(b)
    return (mean(a) - mean(b)) / (va + vb) ** 0.5`;

const RANKS = `import numpy as np
from itertools import product
from math import comb

def signed_rank_p(d):
    d = np.asarray(d, dtype=float)
    ranks = np.argsort(np.argsort(np.abs(d))) + 1
    w_obs = ranks[d > 0].sum()
    ws = [sum(r for r, s in zip(ranks, signs) if s) for signs in product([0, 1], repeat=len(d))]
    return float(np.mean(np.array(ws) >= w_obs))

def sign_test_p(d):
    d = np.asarray(d, dtype=float)
    n, k = int(np.sum(d != 0)), int(np.sum(d > 0))
    return sum(comb(n, j) for j in range(k, n + 1)) / 2 ** n`;

export const lesson: LessonContent = {
  id: "m9.8.3",
  minutes: 55,
  links: {
    requires: ["m9.8.2", "m9.5.3"],
    revisits: ["m9.1.2", "m7.5.2"],
    foreshadows: ["m9.8.4", "m9.8.5"],
  },

  puzzle: (
    <>
      <p>
        A new model beats the old one on all six tasks of a suite, by margins between 0.3 and 1.3 points. But the tasks
        range from 55% to 88% accuracy, so a two-sample t-test sees two huge, overlapping spreads and finds nothing:
        t = 0.11. Six wins out of six cannot be nothing. Which test asks the right question?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each task is its own comparison: same data, same difficulty, two models. Subtract within each task and the
        difficulty disappears, leaving only the improvement and a little noise. Pairing turns between-task variation,
        which is irrelevant, into nothing.
      </p>
      <PairedTViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the paired t-test">
        <p>
          Let dᵢ = bᵢ − aᵢ be the differences on n units, iid N(δ, σ_d²). Under δ = 0,
        </p>
        <MD>{"T = \\frac{\\bar d}{s_d/\\sqrt n} \\sim t_{n-1}."}</MD>
        <p>
          This is the one-sample t-test applied to the differences, so its exactness follows from the t distribution
          result for normal samples.
        </p>
      </Theorem>

      <Theorem title="how much pairing gains">
        <p>
          If aᵢ and bᵢ have variances σ_A², σ_B² and correlation ρ within units, then{" "}
          <M>{"\\sigma_d^2 = \\sigma_A^2 + \\sigma_B^2 - 2\\rho\\sigma_A\\sigma_B"}</M>. With equal variances σ², the paired
          variance is <M>{"2\\sigma^2(1 - \\rho)"}</M> against <M>{"2\\sigma^2"}</M> for independent groups of the same size,
          so pairing is worth a factor 1/(1 − ρ) in sample size.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathrm{Var}(b - a) = \\mathrm{Var}(b) + \\mathrm{Var}(a) - 2\\mathrm{Cov}(a, b)"}</M> and{" "}
          <M>{"\\mathrm{Cov}(a, b) = \\rho\\sigma_A\\sigma_B"}</M>. With equal variances this is 2σ²(1 − ρ). To reach the same
          standard error, the unpaired design needs n′ with <M>{"2\\sigma^2/n' = 2\\sigma^2(1 - \\rho)/n"}</M>, that is{" "}
          <M>{"n' = n/(1 - \\rho)"}</M>.
        </p>
        <Code>{TT}</Code>
      </Proof>

      <Definition title="sign and signed-rank tests">
        <p>
          Without assuming normality, suppose the differences are symmetric about 0 under H₀. The sign test counts positive
          differences, Binomial(n, 1/2) under H₀. The Wilcoxon signed-rank test ranks |dᵢ| from 1 to n and sums the ranks
          of the positive differences, W⁺; under H₀ each rank is positive with probability 1/2 independently, so the exact
          null distribution comes from enumerating the 2ⁿ sign patterns, the sign-flip permutation test applied to ranks.
        </p>
      </Definition>

      <Example title="choosing among them">
        <p>
          With differences 1.1, −0.2, 0.9, 0.4, 1.3, −0.5, 0.7, 0.8, the signed-rank test gives p = 0.027, since the two
          losses are small, while the sign test, which ignores magnitudes, gives 0.145. With differences 0.5, −2.0, 0.3, 0.4,
          the single loss is the largest, and the signed-rank p-value is higher than the sign test&apos;s. The paired
          t-test uses magnitudes most fully and is most powerful for roughly normal differences; signed-rank is a robust
          default for comparisons across many datasets.
        </p>
        <Code>{RANKS}</Code>
      </Example>

      <Remark title="pairing in practice">
        <p>
          Pair whatever is shared: tasks, datasets, test questions, seeds or prompts. Pairing costs one thing, the
          degrees of freedom of the comparison, and gains nothing when ρ ≤ 0, which is rare in practice. With very few
          units (say three datasets) no test has much power, however consistent the wins look; that is a reason to gather
          more units, and the next lesson shows how many.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "t",
      rung: "check",
      prompt: <p>Four paired differences have mean 0.8 and standard deviation 0.4. What is the paired t-statistic?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0001 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>Both models have score standard deviation 2 across units and correlation 0.75. What is the variance of the per-unit difference?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "sign",
      rung: "apply",
      prompt: <p>What information does the sign test ignore that the signed-rank test uses?</p>,
      answer: { kind: "choice", options: ["The relative sizes of the differences", "The signs of the differences", "The number of units", "Which model is which"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from statistics import mean, stdev

def paired_t(a, b):
    d = [x - y for x, y in zip(a, b)]
    return mean(d) / (stdev(d) / len(d) ** 0.5)

def welch_t(a, b):
    va, vb = stdev(a) ** 2 / len(a), stdev(b) ** 2 / len(b)
    return (mean(a) - mean(b)) / (va + vb) ** 0.5

a = [71.2, 64.5, 88.1, 55.0, 79.3, 60.8]
b = [70.1, 63.9, 87.0, 54.6, 78.0, 60.5]
print(round(paired_t(a, b), 2), round(welch_t(a, b), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.67 0.11", "0.11 4.67", "4.67 4.67", "1.91 0.11"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
from itertools import product
from math import comb

def signed_rank_p(d):
    d = np.asarray(d, dtype=float)
    ranks = np.argsort(np.argsort(np.abs(d))) + 1
    w_obs = ranks[d > 0].sum()
    ws = [sum(r for r, s in zip(ranks, signs) if s) for signs in product([0, 1], repeat=len(d))]
    return float(np.mean(np.array(ws) >= w_obs))

def sign_test_p(d):
    d = np.asarray(d, dtype=float)
    n, k = int(np.sum(d != 0)), int(np.sum(d > 0))
    return sum(comb(n, j) for j in range(k, n + 1)) / 2 ** n

d = [1.1, -0.2, 0.9, 0.4, 1.3, -0.5, 0.7, 0.8]
print(signed_rank_p(d), sign_test_p(d))
print(signed_rank_p([0.5, -2.0, 0.3, 0.4]), sign_test_p([0.5, -2.0, 0.3, 0.4]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.02734375 0.14453125\n0.4375 0.3125", "0.14453125 0.02734375\n0.3125 0.4375", "0.02734375 0.14453125\n0.3125 0.4375", "0.0546875 0.2890625\n0.875 0.625"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>paired_t(a, b)</C>, the t-statistic of the differences a − b, and <C>welch_t(a, b)</C>, the unpaired
          statistic (ā − b̄)/√(s_a²/n_a + s_b²/n_b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from statistics import mean, stdev

def paired_t(a, b):
    return 0.0

def welch_t(a, b):
    return 0.0
`,
        solution: TT,
        tests: [
          { name: "paired", code: `assert abs(paired_t([3, 5, 7], [2, 3, 4]) - 2 / (1 / 3 ** 0.5)) < 1e-9` },
          { name: "welch", code: `assert abs(welch_t([1, 3], [0, 0, 0]) - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>signed_rank_p(d)</C>, the exact one-sided p-value P(W⁺ ≥ observed) by enumerating all sign patterns of
          the ranks of |d| (assume no ties or zeros), and <C>sign_test_p(d)</C>, the one-sided sign test p-value
          P(Binomial(n, 1/2) ≥ number of positive differences), ignoring zeros.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import product
from math import comb

def signed_rank_p(d):
    return 1.0

def sign_test_p(d):
    return 1.0
`,
        solution: RANKS,
        tests: [
          { name: "rank", code: `assert signed_rank_p([1.0, 2.0, 3.0]) == 1 / 8 and signed_rank_p([-1.0, 2.0, 3.0]) == 2 / 8` },
          { name: "sign", code: `assert sign_test_p([1.0, 2.0, 3.0]) == 1 / 8 and sign_test_p([1.0, 0.0, -2.0]) == 0.75` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Two scores on each unit have equal variance σ² and correlation ρ. Prove that the paired difference has variance 2σ²(1 − ρ), and that an unpaired design needs n/(1 − ρ) units per group to match the precision of n pairs.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Expands Var(b − a) = Var(a) + Var(b) − 2Cov(a, b) with Cov = ρσ², giving 2σ²(1 − ρ).",
          "States the unpaired difference of means with n′ per group has variance 2σ²/n′, and the paired mean difference has 2σ²(1 − ρ)/n.",
          "Equates the two and solves n′ = n/(1 − ρ).",
        ],
      },
    },
    {
      key: "all7",
      rung: "stretch",
      prompt: <p>A new model wins on all 7 datasets. What is the exact one-sided Wilcoxon signed-rank p-value? Give seven decimal places.</p>,
      answer: { kind: "numeric", value: 0.0078125, tolerance: 0.0000001 },
    },
  ],

  teachBack:
    "Explain to a friend why paired tests are more powerful when units vary a lot, how the gain depends on the correlation, how the paired t, sign and signed-rank tests differ, and when each is appropriate for comparing models across tasks.",

  glimpse: (
    <>
      <p>
        How many tasks, questions or seeds are enough? The next lesson turns power from an afterthought into a design
        calculation made before any experiment runs.
      </p>
    </>
  ),
};
