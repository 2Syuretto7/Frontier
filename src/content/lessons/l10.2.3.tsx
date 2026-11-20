import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ClusterSeViz } from "@/components/viz/ClusterSeViz";
import type { LessonContent } from "@/lib/types";

const CLUSTER = `import math

def cluster_se(scores, clusters):
    n = len(scores)
    m = sum(scores) / n
    sums = {}
    for s, c in zip(scores, clusters):
        sums[c] = sums.get(c, 0.0) + (s - m)
    return m, math.sqrt(sum(v * v for v in sums.values())) / n

def design_effect(m, icc):
    return 1 + (m - 1) * icc

def effective_n(n, m, icc):
    return n / design_effect(m, icc)`;

const ICC = `import math

def naive_se(scores):
    n = len(scores)
    m = sum(scores) / n
    return math.sqrt(sum((x - m) ** 2 for x in scores) / (n - 1) / n)

def cluster_means(scores, clusters):
    tot, cnt = {}, {}
    for s, c in zip(scores, clusters):
        tot[c] = tot.get(c, 0) + s
        cnt[c] = cnt.get(c, 0) + 1
    return {c: tot[c] / cnt[c] for c in tot}

def icc_estimate(groups):
    k, m = len(groups), len(groups[0])
    means = [sum(g) / m for g in groups]
    grand = sum(means) / k
    msb = m * sum((x - grand) ** 2 for x in means) / (k - 1)
    msw = sum((x - gm) ** 2 for g, gm in zip(groups, means) for x in g) / (k * (m - 1))
    return (msb - msw) / (msb + (m - 1) * msw)`;

export const lesson: LessonContent = {
  id: "l10.2.3",
  minutes: 45,
  links: {
    requires: ["l10.2.2", "m7.6.2"],
    revisits: ["l10.2.1", "m7.5.3", "m9.5.2"],
    foreshadows: ["l10.2.4", "l10.4.1", "l10.3.3"],
  },

  puzzle: (
    <>
      <p>
        A reading-comprehension benchmark has 2,000 questions, but they come from 200 passages, ten per passage. A model that
        misunderstands a passage tends to miss most of its questions; one that grasps it gets most right. Is this a benchmark of 2,000
        independent observations, or closer to 200? The answer changes the error bar by a factor that can exceed two.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Questions that share a passage, a document, a code repository or a task template are correlated: they rise and fall together.
        Ten correlated questions carry less information than ten independent ones, so the naive standard error, which treats every
        question as a fresh draw, is too small. The fix is to treat the cluster, not the question, as the unit that was sampled.
      </p>
      <ClusterSeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="intra-cluster correlation and the design effect">
        <p>
          If clusters all have size m and two scores from the same cluster have correlation ρ (the intra-cluster correlation, ICC),
          while scores from different clusters are independent, then the variance of the mean is the naive variance times the design
          effect <M>{"\\mathrm{DE} = 1 + (m - 1)\\rho"}</M> (<C>design_effect</C>). The benchmark is worth{" "}
          <M>{"n/\\mathrm{DE}"}</M> independent questions (<C>effective_n</C>).
        </p>
      </Definition>

      <Theorem title="the design effect">
        <p>
          With n = km scores of common variance <M>{"\\sigma^2"}</M>, correlation ρ within a cluster and 0 across,{" "}
          <M>{"\\operatorname{Var}(\\bar s) = \\frac{\\sigma^2}{n}\\,(1 + (m-1)\\rho)."}</M>
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum of one cluster has variance <M>{"m\\sigma^2 + m(m-1)\\rho\\sigma^2"}</M>: m variances and <M>{"m(m-1)"}</M> ordered pairs
          of covariances <M>{"\\rho\\sigma^2"}</M>. The k cluster sums are independent, so the total has k times this variance, and dividing
          by <M>{"n^2 = k^2 m^2"}</M> gives <M>{"\\sigma^2(1 + (m-1)\\rho)/(km)"}</M>. Even a small ρ matters when clusters are large: with
          m = 20 and ρ = 0.1 the design effect is 2.9.
        </p>
      </Proof>

      <Definition title="the clustered standard error">
        <p>
          Without assuming equal sizes or a known ρ, sum the deviations <M>{"s_i - \\bar s"}</M> within each cluster c to get{" "}
          <M>{"S_c"}</M>, and estimate
        </p>
        <MD>{"\\widehat{\\mathrm{se}}_{\\text{cl}} = \\frac{1}{n}\\sqrt{\\sum_c S_c^2}"}</MD>
        <p>
          (<C>cluster_se</C>). This is the cluster-robust, or sandwich, estimator for a mean: the variance of a sum of independent
          cluster totals, estimated by their squared deviations. With one question per cluster it reduces to the naive formula with a
          divide-by-n variance. Software often multiplies by <M>{"C/(C-1)"}</M> for C clusters, and with few clusters, say under 30,
          the interval still covers too rarely, as the figure shows for 20 clusters; a t-distribution with C − 1 degrees of freedom or a
          bootstrap over clusters (m9.5.2) helps.
        </p>
        <Code>{CLUSTER}</Code>
      </Definition>

      <Remark title="estimating ρ">
        <p>
          For k clusters of equal size m, the one-way analysis-of-variance estimator compares the mean square between clusters,{" "}
          <M>{"\\mathrm{MSB} = m\\sum_c(\\bar s_c - \\bar s)^2/(k-1)"}</M>, with the mean square within,{" "}
          <M>{"\\mathrm{MSW} = \\sum_c\\sum_i(s_{ci} - \\bar s_c)^2/(k(m-1))"}</M>, and sets{" "}
          <M>{"\\hat\\rho = (\\mathrm{MSB} - \\mathrm{MSW})/(\\mathrm{MSB} + (m-1)\\mathrm{MSW})"}</M> (<C>icc_estimate</C>). It can be negative
          when clusters are more alike than chance would allow. Compare the naive standard error (<C>naive_se</C>) with the clustered one
          to see the design effect directly; per-cluster accuracies (<C>cluster_means</C>) are worth reporting too.
        </p>
        <Code>{ICC}</Code>
      </Remark>

      <Example title="where clusters hide">
        <p>
          Reading comprehension with several questions per passage; coding benchmarks with several tests or tasks per repository; agent
          suites with variants of the same environment; translation sets with many sentences per document; and any benchmark where a
          model is sampled several times per question, since repeated answers to one question form a cluster. Miller (2024) reports
          clustered standard errors over three times the naive ones on some popular benchmarks.
        </p>
      </Example>

      <Remark title="pairing and clustering together">
        <p>
          For a paired comparison, compute per-question differences <M>{"d_i"}</M> and apply the clustered formula to them. Clustering
          often matters less for differences than for raw scores, because a hard passage tends to be hard for both models and its
          effect cancels.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "eff",
      rung: "check",
      prompt: (
        <p>
          A benchmark has 50 passages with 8 questions each, and the intra-cluster correlation is 0.2. How many independent questions is
          it worth? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 166.7, tolerance: 0.05 },
    },
    {
      key: "inflate",
      rung: "check",
      prompt: (
        <p>
          The naive standard error is 0.015, clusters have 10 questions each and the intra-cluster correlation is 0.35. What is the
          standard error after accounting for clustering? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0306, tolerance: 0.0001 },
    },
    {
      key: "samples",
      rung: "apply",
      prompt: (
        <p>
          You sample 8 answers per question on 300 questions and report the standard error of the 2,400 answer-level scores as if they
          were independent. What is wrong?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Answers to the same question are correlated, so they form clusters; the error bar should be computed over the 300 question means or clustered by question",
          "Nothing; more answers always mean a proportionally smaller error bar",
          "The error bar is too large, because answers to the same question agree",
          "Sampling several answers makes standard errors undefined",
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

def cluster_se(scores, clusters):
    n = len(scores)
    m = sum(scores) / n
    sums = {}
    for s, c in zip(scores, clusters):
        sums[c] = sums.get(c, 0.0) + (s - m)
    return m, math.sqrt(sum(v * v for v in sums.values())) / n

def design_effect(m, icc):
    return 1 + (m - 1) * icc

def effective_n(n, m, icc):
    return n / design_effect(m, icc)

print(cluster_se([1, 0, 1, 0], ["x", "x", "y", "y"]), design_effect(1, 0.9))
print(design_effect(11, 0.2), effective_n(300, 6, 0.4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.5, 0.0) 1.0\n3.0 100.0",
          "(0.5, 0.25) 1.0\n3.0 100.0",
          "(0.5, 0.0) 0.1\n3.0 100.0",
          "(0.5, 0.0) 1.0\n3.0 50.0",
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

def naive_se(scores):
    n = len(scores)
    m = sum(scores) / n
    return math.sqrt(sum((x - m) ** 2 for x in scores) / (n - 1) / n)

def cluster_means(scores, clusters):
    tot, cnt = {}, {}
    for s, c in zip(scores, clusters):
        tot[c] = tot.get(c, 0) + s
        cnt[c] = cnt.get(c, 0) + 1
    return {c: tot[c] / cnt[c] for c in tot}

def icc_estimate(groups):
    k, m = len(groups), len(groups[0])
    means = [sum(g) / m for g in groups]
    grand = sum(means) / k
    msb = m * sum((x - grand) ** 2 for x in means) / (k - 1)
    msw = sum((x - gm) ** 2 for g, gm in zip(groups, means) for x in g) / (k * (m - 1))
    return (msb - msw) / (msb + (m - 1) * msw)

print(round(naive_se([1, 0, 1, 0]), 3), cluster_means([1, 0, 1], ["p", "q", "p"]))
print(icc_estimate([[1, 1], [0, 0]]), icc_estimate([[1, 0], [1, 0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.289 {'p': 1.0, 'q': 0.0}\n1.0 -1.0",
          "0.25 {'p': 1.0, 'q': 0.0}\n1.0 -1.0",
          "0.289 {'p': 0.5, 'q': 0.0}\n1.0 -1.0",
          "0.289 {'p': 1.0, 'q': 0.0}\n1.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cluster_se(scores, clusters)</C>, returning the mean and the clustered standard error without a small-sample
          correction, <C>design_effect(m, icc)</C>, and <C>effective_n(n, m, icc)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cluster_se(scores, clusters):
    return sum(scores) / len(scores), 0.0

def design_effect(m, icc):
    return 1.0

def effective_n(n, m, icc):
    return n
`,
        solution: CLUSTER,
        tests: [
          { name: "se", code: `m, se = cluster_se([1, 1, 0, 0], [1, 1, 2, 2])\nassert abs(m - 0.5) < 1e-12 and abs(se - 0.3535533906) < 1e-9\nm, se = cluster_se([1, 0, 1, 1, 0, 0], [1, 2, 3, 1, 2, 3])\nassert abs(se - 0.2357022604) < 1e-9` },
          { name: "deff", code: `assert design_effect(5, 0.25) == 2.0 and effective_n(200, 5, 0.25) == 100.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>naive_se(scores)</C> with the n − 1 variance, <C>cluster_means(scores, clusters)</C>, returning a dictionary from
          cluster to mean score, and <C>icc_estimate(groups)</C>, the analysis-of-variance estimator for a list of equal-sized lists.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def naive_se(scores):
    return 0.0

def cluster_means(scores, clusters):
    return {}

def icc_estimate(groups):
    return 0.0
`,
        solution: ICC,
        tests: [
          { name: "naive", code: `assert abs(naive_se([1, 1, 0]) - 1 / 3) < 1e-12 and cluster_means([2, 4, 6], ["a", "b", "a"]) == {"a": 4.0, "b": 4.0}` },
          { name: "icc", code: `assert abs(icc_estimate([[1, 1, 0], [0, 0, 0], [1, 1, 1]]) - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "small",
      rung: "stretch",
      prompt: (
        <p>
          Nine questions from three passages score 1, 1, 1 (passage A), 0, 0, 0 (passage B) and 1, 0, 1 (passage C). What is the clustered
          standard error of the mean score, without a small-sample correction? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.24, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Error bars tell you how precise an evaluation was after the fact. The next lesson turns the question round: before running an
        evaluation, how many questions does it need to detect the difference you care about?
      </p>
    </>
  ),
};
