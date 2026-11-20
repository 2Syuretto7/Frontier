import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DiscordantViz } from "@/components/viz/DiscordantViz";
import type { LessonContent } from "@/lib/types";

const PAIRED = `import math

def discordant(a, b):
    only_a = sum(1 for x, y in zip(a, b) if x and not y)
    only_b = sum(1 for x, y in zip(a, b) if y and not x)
    return only_a, only_b

def paired_diff_se(a, b):
    d = [x - y for x, y in zip(a, b)]
    n = len(d)
    m = sum(d) / n
    return math.sqrt((sum(x * x for x in d) / n - m * m) / n)

def mcnemar_stat(only_a, only_b):
    if only_a + only_b == 0:
        return 0.0
    return (only_a - only_b) ** 2 / (only_a + only_b)`;

const TESTS = `import math

def mcnemar_exact(only_a, only_b):
    m = only_a + only_b
    tail = sum(math.comb(m, i) for i in range(min(only_a, only_b) + 1)) / 2 ** m
    return min(1.0, 2 * tail)

def unpaired_se(pa, pb, n):
    return math.sqrt((pa * (1 - pa) + pb * (1 - pb)) / n)

def holm(pvals, alpha):
    order = sorted(range(len(pvals)), key=lambda i: pvals[i])
    reject = [False] * len(pvals)
    for rank, i in enumerate(order):
        if pvals[i] > alpha / (len(pvals) - rank):
            break
        reject[i] = True
    return reject`;

export const lesson: LessonContent = {
  id: "l10.2.2",
  minutes: 45,
  links: {
    requires: ["l10.2.1", "m9.8.3"],
    revisits: ["m9.4.1", "m9.4.5", "m7.5.2"],
    foreshadows: ["l10.2.3", "l10.2.4", "l10.3.4"],
  },

  puzzle: (
    <>
      <p>
        Two models are scored on the same 1,000 questions: 74.1% and 72.3%. Each score has a 95% interval of about ±2.7 points, and
        the intervals overlap heavily. Yet on the questions where the two models disagree, the first wins 60 times and the second 42.
        Is the first model better? Comparing two separate error bars is the wrong test, and on shared questions a much more powerful
        one is available.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most of the variation in a benchmark score comes from which questions happen to be in it, and both models face the same
        questions. A question both get right, or both get wrong, says nothing about which is better. Only the questions where they
        disagree carry information, and the comparison should be built from those.
      </p>
      <DiscordantViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the paired standard error">
        <p>
          Let <M>{"a_i, b_i"}</M> be the two models&apos; scores on question i and <M>{"d_i = a_i - b_i"}</M>. The estimated difference{" "}
          <M>{"\\bar d"}</M> has variance <M>{"\\operatorname{Var}(d)/n"}</M>, with
        </p>
        <MD>{"\\operatorname{Var}(d) = \\operatorname{Var}(a) + \\operatorname{Var}(b) - 2\\operatorname{Cov}(a, b)."}</MD>
        <p>
          For right-or-wrong scores with discordant fractions <M>{"f_{10}"}</M> (only A right) and <M>{"f_{01}"}</M> (only B right),{" "}
          <M>{"\\operatorname{Var}(d) = f_{10} + f_{01} - (f_{10} - f_{01})^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first identity is the variance of a difference (m7.5.2). For binary scores <M>{"d_i \\in \\{-1, 0, 1\\}"}</M>, so{" "}
          <M>{"d_i^2"}</M> is 1 exactly on discordant questions: <M>{"\\mathbb{E}[d^2] = f_{10} + f_{01}"}</M> and{" "}
          <M>{"\\mathbb{E}[d] = f_{10} - f_{01}"}</M>. Subtract the squared mean. The covariance of two models on the same questions is
          usually strongly positive, because question difficulty is shared, so the paired variance is much smaller than the sum of the
          two separate variances (<C>unpaired_se</C>), which ignores it. In code, take the standard deviation of the differences
          (<C>paired_diff_se</C>); with several sampled answers per question, take <M>{"a_i, b_i"}</M> to be the per-question means.
        </p>
        <Code>{PAIRED}</Code>
      </Proof>

      <Definition title="McNemar's test">
        <p>
          Let <M>{"n_{10}"}</M> and <M>{"n_{01}"}</M> be the discordant counts (<C>discordant</C>). Under the null hypothesis that the models
          are equally accurate, each discordant question is equally likely to go either way, so <M>{"n_{10}"}</M> given{" "}
          <M>{"m = n_{10} + n_{01}"}</M> is Binomial(m, 1/2). The exact two-sided p-value doubles the smaller tail (<C>mcnemar_exact</C>);
          for large m the statistic <M>{"(n_{10} - n_{01})^2 / m"}</M> is close to chi-squared with one degree of freedom
          (<C>mcnemar_stat</C>) and the result matches a z-test with the paired standard error.
        </p>
        <Code>{TESTS}</Code>
      </Definition>

      <Example title="the puzzle, resolved">
        <p>
          With 60 and 42 discordant questions, the statistic is <M>{"18^2/102 \\approx 3.18"}</M>, below the 3.84 needed for p &lt; 0.05: on
          this evidence the gap is suggestive, not established. The paired standard error is about{" "}
          <M>{"\\sqrt{(0.102 - 0.018^2)/1000} \\approx 0.0100"}</M>, roughly half the unpaired one; the pairing helped, but the gap is still
          under two standard errors.
        </p>
      </Example>

      <Remark title="many models, many comparisons">
        <p>
          A leaderboard of k models has <M>{"k(k-1)/2"}</M> pairs, and testing each at 0.05 will find spurious differences (m9.4.5). Holm&apos;s
          procedure controls the chance of any false rejection: sort the m p-values, compare the j-th smallest with{" "}
          <M>{"\\alpha/(m - j + 1)"}</M>, and stop at the first that fails (<C>holm</C>). It is never less powerful than Bonferroni. Reporting a
          ranking with confidence intervals on ranks, or grouping models that cannot be told apart, is more honest than a strict order.
        </p>
      </Remark>

      <Remark title="what pairing needs">
        <p>
          Pairing requires per-question results for both models on identical questions, prompts and scoring. Published aggregate scores
          from different papers cannot be paired, which is one reason to release per-question outputs alongside a headline number.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stat",
      rung: "check",
      prompt: (
        <p>
          On 1,000 shared questions, only model A is right on 60 and only model B is right on 35. What is the McNemar statistic? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.579, tolerance: 0.001 },
    },
    {
      key: "se",
      rung: "check",
      prompt: (
        <p>
          For the same counts, what is the paired standard error of the accuracy difference, as a proportion? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0097, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: (
        <p>
          Two models score 81% and 79% on the same 500 questions. Their separate 95% intervals overlap. What follows?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Nothing yet: overlap of separate intervals ignores the shared questions, so a paired test may still find the gap significant",
          "The difference is not significant, because the intervals overlap",
          "The difference is significant, because the scores differ",
          "The benchmark is too small to compare any two models",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def discordant(a, b):
    only_a = sum(1 for x, y in zip(a, b) if x and not y)
    only_b = sum(1 for x, y in zip(a, b) if y and not x)
    return only_a, only_b

def paired_diff_se(a, b):
    d = [x - y for x, y in zip(a, b)]
    n = len(d)
    m = sum(d) / n
    return math.sqrt((sum(x * x for x in d) / n - m * m) / n)

def mcnemar_stat(only_a, only_b):
    if only_a + only_b == 0:
        return 0.0
    return (only_a - only_b) ** 2 / (only_a + only_b)

print(discordant([1, 1, 0, 0, 1], [1, 0, 1, 0, 0]), round(paired_diff_se([1, 0], [0, 0]), 3))
print(mcnemar_stat(3, 3), mcnemar_stat(4, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2, 1) 0.354\n0.0 4.0",
          "(1, 2) 0.354\n0.0 4.0",
          "(2, 1) 0.5\n0.0 4.0",
          "(2, 1) 0.354\n0.0 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def mcnemar_exact(only_a, only_b):
    m = only_a + only_b
    tail = sum(math.comb(m, i) for i in range(min(only_a, only_b) + 1)) / 2 ** m
    return min(1.0, 2 * tail)

def unpaired_se(pa, pb, n):
    return math.sqrt((pa * (1 - pa) + pb * (1 - pb)) / n)

def holm(pvals, alpha):
    order = sorted(range(len(pvals)), key=lambda i: pvals[i])
    reject = [False] * len(pvals)
    for rank, i in enumerate(order):
        if pvals[i] > alpha / (len(pvals) - rank):
            break
        reject[i] = True
    return reject

print(mcnemar_exact(2, 0), round(unpaired_se(0.5, 0.5, 50), 3))
print(holm([0.04, 0.01, 0.03], 0.05), holm([0.02, 0.5], 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.1\n[False, True, False] [True, False]",
          "0.25 0.1\n[False, True, False] [True, False]",
          "0.5 0.1\n[True, True, True] [True, False]",
          "0.5 0.071\n[False, True, False] [True, False]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>discordant(a, b)</C>, returning the counts of questions only A got right and only B got right,{" "}
          <C>paired_diff_se(a, b)</C> using the divide-by-n variance of the differences, and <C>mcnemar_stat(only_a, only_b)</C>, which is
          0.0 when there are no discordant questions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def discordant(a, b):
    return 0, 0

def paired_diff_se(a, b):
    return 0.0

def mcnemar_stat(only_a, only_b):
    return only_a - only_b
`,
        solution: PAIRED,
        tests: [
          { name: "count", code: `assert discordant([1, 1, 0, 1], [0, 1, 1, 0]) == (2, 1)\nassert mcnemar_stat(0, 0) == 0.0 and abs(mcnemar_stat(10, 2) - 64 / 12) < 1e-12` },
          { name: "se", code: `assert abs(paired_diff_se([1, 1, 0, 0], [1, 0, 1, 0]) - 0.3535533906) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mcnemar_exact(only_a, only_b)</C>, the two-sided exact p-value capped at 1, <C>unpaired_se(pa, pb, n)</C>, and{" "}
          <C>holm(pvals, alpha)</C>, returning a list of rejections in the original order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mcnemar_exact(only_a, only_b):
    return 0.05

def unpaired_se(pa, pb, n):
    return math.sqrt(pa * (1 - pa) / n)

def holm(pvals, alpha):
    return [p <= alpha for p in pvals]
`,
        solution: TESTS,
        tests: [
          { name: "exact", code: `assert abs(mcnemar_exact(8, 2) - 0.109375) < 1e-12 and mcnemar_exact(5, 5) == 1.0 and mcnemar_exact(0, 0) == 1.0` },
          { name: "rest", code: `assert abs(unpaired_se(0.8, 0.6, 100) - 0.0632455532) < 1e-9\nassert holm([0.01, 0.04, 0.03, 0.005], 0.05) == [True, False, False, True]` },
        ],
      },
    },
    {
      key: "exact",
      rung: "stretch",
      prompt: (
        <p>
          A small agent benchmark: only model A succeeds on 9 tasks and only model B on 1. What is the exact two-sided McNemar p-value?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0215, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Both lessons so far assumed the questions are independent. Many benchmarks are built from passages, documents or code
        repositories with several questions each, and the next lesson shows how that clustering widens the error bars.
      </p>
    </>
  ),
};
