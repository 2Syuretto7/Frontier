import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MultipleTestsViz } from "@/components/viz/MultipleTestsViz";
import type { LessonContent } from "@/lib/types";

const PAIRED = `import random

def bootstrap_ci(xs, B, alpha, seed=0):
    rng, n = random.Random(seed), len(xs)
    means = sorted(sum(rng.choice(xs) for _ in range(n)) / n for _ in range(B))
    return means[int(alpha / 2 * B)], means[int((1 - alpha / 2) * B) - 1]

def discordant(a, b):
    only_a = sum(x and not y for x, y in zip(a, b))        # items A gets right and B gets wrong
    only_b = sum(y and not x for x, y in zip(a, b))
    return only_a, only_b

def mcnemar(a, b):
    n10, n01 = discordant(a, b)
    return 0.0 if n10 + n01 == 0 else (abs(n10 - n01) - 1) ** 2 / (n10 + n01)`;

const CORRECT = `def bonferroni(pvals):
    return [min(1.0, p * len(pvals)) for p in pvals]

def holm(pvals):
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    adj, running = [0.0] * m, 0.0
    for rank, i in enumerate(order):
        running = max(running, min(1.0, (m - rank) * pvals[i]))   # adjusted values never decrease
        adj[i] = running
    return adj

def fmt_row(name, mean, lo, hi):
    return f"{name:<10}{mean:.3f} [{lo:.3f}, {hi:.3f}]"`;

export const lesson: LessonContent = {
  id: "e15.5.2",
  minutes: 45,
  links: {
    requires: ["e15.5.1"],
    revisits: ["e15.1.3", "e13.5.1", "l9.6.3"],
    foreshadows: ["e15.5.4"],
  },

  puzzle: (
    <>
      <p>
        The evaluation plan has run: a dozen tasks, four checkpoints, two decoding settings. The table has nearly a
        hundred numbers, and some of the differences look promising. A reader will ask which differences are real.
        Reporting every comparison at the 5% level guarantees a few false wins; refusing to compare guarantees a report
        nobody can use. How should the report state its results?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give every number an interval, computed by resampling the evaluation items. Compare models on the same items,
        which cancels the variation from item difficulty and makes small differences detectable. Test only the
        comparisons the plan named in advance, and correct those tests for their number, so that the chance of any false
        claim in the whole report stays at the stated level. Everything else is labelled as exploratory.
      </p>
      <MultipleTestsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="intervals and paired tests">
        <p>
          A percentile bootstrap resamples the item scores with replacement many times and takes the middle 1 − α of the
          resampled means as the interval (<C>bootstrap_ci</C>). Two models scored on the same items differ only on the
          discordant items, those one gets right and the other wrong (<C>discordant</C>). McNemar&apos;s test compares
          the two discordant counts <M>{"n_{10}"}</M> and <M>{"n_{01}"}</M> with the statistic{" "}
          <M>{"(|n_{10} - n_{01}| - 1)^2 / (n_{10} + n_{01})"}</M>, approximately chi-squared with one degree of freedom
          under no difference (<C>mcnemar</C>).
        </p>
        <Code>{PAIRED}</Code>
      </Definition>

      <Definition title="corrections for many tests">
        <p>
          With m tests, Bonferroni multiplies each p-value by m (<C>bonferroni</C>). Holm&apos;s method sorts the p-values
          and multiplies the k-th smallest by m − k + 1, then makes the adjusted values non-decreasing in that order{" "}
          (<C>holm</C>); a test is significant if its adjusted value is at most α. Holm rejects everything Bonferroni does
          and sometimes more. The report prints each result with its mean and interval (<C>fmt_row</C>).
        </p>
        <Code>{CORRECT}</Code>
      </Definition>

      <Theorem title="Holm controls the family-wise error rate">
        <p>
          If each p-value of a true null hypothesis is valid, so that it is at most t with probability at most t, then the
          probability that Holm&apos;s method rejects at least one true null is at most α, whatever the dependence between
          tests.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"m_0"}</M> nulls be true. Consider the first true null in the sorted order. At most{" "}
          <M>{"m - m_0"}</M> p-values come before it, all false nulls, so its rank k satisfies{" "}
          <M>{"k \\le m - m_0 + 1"}</M>, and its threshold <M>{"\\alpha/(m - k + 1)"}</M> is at most{" "}
          <M>{"\\alpha/m_0"}</M>. Holm stops at the first failure, so any false rejection requires this p-value, the
          smallest among true nulls, to be at most <M>{"\\alpha/m_0"}</M>. By the union bound, the chance that any of the{" "}
          <M>{"m_0"}</M> true-null p-values is at most <M>{"\\alpha/m_0"}</M> is at most{" "}
          <M>{"m_0 \\cdot \\alpha/m_0 = \\alpha"}</M>. The union bound needs no independence, which matters because
          benchmark results of one model are correlated.
        </p>
      </Proof>

      <Example title="the capstone report table">
        <p>
          Rows for each task with the base, fine-tuned, preference-tuned and RL checkpoints, each a mean and a 95%
          bootstrap interval over items. Below the table, the five comparisons named in the plan, such as RL against
          preference-tuned on arithmetic, each with its discordant counts, McNemar statistic and Holm-adjusted p-value.
          Judge-based win rates, as in l9.6.3, report their judge and its known biases. Comparisons the plan did not name
          appear in a separate exploratory section, without p-values.
        </p>
      </Example>

      <Remark title="what intervals do not cover">
        <p>
          A bootstrap over items captures sampling noise in the benchmark, not variation between training runs with
          different seeds, which is often larger for small models. Where the budget allowed repeat runs of the last
          stage, their spread is reported too. And no interval corrects for contamination, which is why the report also
          states the decontamination results from e15.1.3.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mcnemar",
      rung: "check",
      prompt: (
        <p>
          On the same items, model A is right and B wrong on 37 items, and A wrong and B right on 18. What is the McNemar
          statistic? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.8909, tolerance: 0.0002 },
    },
    {
      key: "holm",
      rung: "check",
      prompt: (
        <p>
          The plan names five comparisons, with raw p-values 0.004, 0.03, 0.012, 0.2 and 0.009. What is the
          Holm-adjusted p-value of the second comparison, the one with raw value 0.03?
        </p>
      ),
      answer: { kind: "numeric", value: 0.06, tolerance: 0.0001 },
    },
    {
      key: "paired",
      rung: "apply",
      prompt: <p>Why are two models compared on the same items rather than on independent samples?</p>,
      answer: {
        kind: "choice",
        options: [
          "Item difficulty affects both models alike, so pairing cancels it and smaller differences become detectable",
          "Independent samples cannot be bootstrapped",
          "Pairing removes the need for any statistical test",
          "Models cannot be run on different items",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random

def bootstrap_ci(xs, B, alpha, seed=0):
    rng, n = random.Random(seed), len(xs)
    means = sorted(sum(rng.choice(xs) for _ in range(n)) / n for _ in range(B))
    return means[int(alpha / 2 * B)], means[int((1 - alpha / 2) * B) - 1]

def discordant(a, b):
    only_a = sum(x and not y for x, y in zip(a, b))        # items A gets right and B gets wrong
    only_b = sum(y and not x for x, y in zip(a, b))
    return only_a, only_b

def mcnemar(a, b):
    n10, n01 = discordant(a, b)
    return 0.0 if n10 + n01 == 0 else (abs(n10 - n01) - 1) ** 2 / (n10 + n01)

print(bootstrap_ci([2, 2, 2], 50, 0.1), discordant([1, 1, 0, 0, 1], [1, 0, 1, 0, 0]))
print(mcnemar([1, 1, 1, 0], [0, 0, 0, 1]), mcnemar([1], [1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(2.0, 2.0) (2, 1)\n0.25 0.0", "(2.0, 2.0) (1, 2)\n0.25 0.0", "(2.0, 2.0) (2, 1)\n1.0 0.0", "(2.0, 2.0) (2, 1)\n0.25 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bonferroni(pvals):
    return [min(1.0, p * len(pvals)) for p in pvals]

def holm(pvals):
    m = len(pvals)
    order = sorted(range(m), key=lambda i: pvals[i])
    adj, running = [0.0] * m, 0.0
    for rank, i in enumerate(order):
        running = max(running, min(1.0, (m - rank) * pvals[i]))   # adjusted values never decrease
        adj[i] = running
    return adj

def fmt_row(name, mean, lo, hi):
    return f"{name:<10}{mean:.3f} [{lo:.3f}, {hi:.3f}]"

print(bonferroni([0.01, 0.25, 0.04]), holm([0.01, 0.25, 0.04]))
print(fmt_row("arc", 0.5, 0.4567, 0.61))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.03, 0.75, 0.12] [0.03, 0.25, 0.08]\narc       0.500 [0.457, 0.610]",
          "[0.03, 0.75, 0.12] [0.03, 0.75, 0.08]\narc       0.500 [0.457, 0.610]",
          "[0.03, 0.75, 0.12] [0.03, 0.25, 0.12]\narc       0.500 [0.457, 0.610]",
          "[0.03, 0.75, 0.12] [0.03, 0.25, 0.08]\narc 0.5 [0.4567, 0.61]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bootstrap_ci(xs, B, alpha, seed=0)</C>, drawing with <C>random.Random(seed).choice</C> and returning the
          sorted means at indices int(α/2 · B) and int((1 − α/2) · B) − 1; <C>discordant(a, b)</C>; and{" "}
          <C>mcnemar(a, b)</C>, 0.0 when there are no discordant items.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import random

def bootstrap_ci(xs, B, alpha, seed=0):
    m = sum(xs) / len(xs)
    return m, m

def discordant(a, b):
    return 0, 0

def mcnemar(a, b):
    return 0.0
`,
        solution: PAIRED,
        tests: [
          { name: "pairs", code: `assert discordant([1, 0, 1], [0, 1, 1]) == (1, 1) and mcnemar([1] * 6 + [0], [0] * 6 + [1]) == 16 / 7 and mcnemar([0], [0]) == 0.0` },
          { name: "ci", code: `lo, hi = bootstrap_ci([0, 1] * 50, 400, 0.1, 3); assert 0.3 < lo < 0.5 < hi < 0.7 and bootstrap_ci([0, 1] * 50, 400, 0.1, 3) == (lo, hi) and lo < hi` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bonferroni(pvals)</C> and <C>holm(pvals)</C>, returning adjusted p-values capped at 1 in the original
          order; and <C>fmt_row(name, mean, lo, hi)</C>, the name left-aligned in 10 characters followed by three-decimal
          numbers as in the example.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bonferroni(pvals):
    return list(pvals)

def holm(pvals):
    return list(pvals)

def fmt_row(name, mean, lo, hi):
    return name
`,
        solution: CORRECT,
        tests: [
          { name: "adjust", code: `assert bonferroni([0.5, 0.25]) == [1.0, 0.5] and holm([0.04, 0.01, 0.02]) == [0.04, 0.03, 0.04] and holm([]) == []` },
          { name: "row", code: `assert fmt_row("hs", 1, 0.25, 0.9996) == "hs        1.000 [0.250, 1.000]"` },
        ],
      },
    },
    {
      key: "pvalue",
      rung: "stretch",
      prompt: (
        <p>
          Using the chi-squared distribution with one degree of freedom, what p-value does the McNemar statistic of the
          first check give? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0152, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The report says what the model can do. The next lesson asks how it does some of it, with a small
        interpretability study of the trained model.
      </p>
    </>
  ),
};
