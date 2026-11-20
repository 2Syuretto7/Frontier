import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GoodhartSelectionViz } from "@/components/viz/GoodhartSelectionViz";
import type { LessonContent } from "@/lib/types";

const SELECT = `def correlation(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    return sxy / (sxx * syy) ** 0.5

def top_fraction(scores, frac):
    m = max(1, int(len(scores) * frac))
    return sorted(range(len(scores)), key=lambda i: -scores[i])[:m]

def selection_gain(true, proxy, frac):
    idx = top_fraction(proxy, frac)
    return sum(true[i] for i in idx) / len(idx) - sum(true) / len(true)`;

const LEADERBOARD = `import math

def accuracy_se(p, n):
    return math.sqrt(p * (1 - p) / n)

def expected_max_bias(se, k):
    return se * math.sqrt(2 * math.log(k))

def selection_bias(true_acc, observed):
    i = max(range(len(observed)), key=lambda j: observed[j])
    return observed[i] - true_acc[i]`;

export const lesson: LessonContent = {
  id: "l10.1.4",
  minutes: 50,
  links: {
    requires: ["l10.1.3", "l9.3.3"],
    revisits: ["m7.5.2", "m2.3.3", "e2.5.3"],
    foreshadows: ["l10.2.1", "l13.4.3", "l14.2.2"],
  },

  puzzle: (
    <>
      <p>
        The economist Charles Goodhart observed in 1975 that a statistical regularity tends to break down once it is used for
        control; the anthropologist Marilyn Strathern later put it as &quot;when a measure becomes a target, it ceases to be a good
        measure&quot;. A benchmark is a measure. Once a field starts selecting models, methods and papers by their benchmark score, the
        score is a target. Does that make it useless, and if not, how much of a score gain can be trusted?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any proxy is the true quantity plus an error. Choosing what scores highest on the proxy chooses partly for true value and
        partly for error, so the winners are a little worse than their scores suggest. That is mild and predictable. The danger
        grows when selection is very strong and the error has heavy tails, or when the thing being selected can push on the error
        directly: then the very top of the proxy belongs to whatever exploits the error best.
      </p>
      <GoodhartSelectionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="four ways a proxy fails">
        <p>
          Manheim and Garrabrant (2018) separate four mechanisms. Regressional: selecting on a noisy proxy also selects for the noise.
          Extremal: the relation between proxy and target, measured over ordinary cases, does not hold in the extreme region that
          optimisation reaches. Causal: intervening on the proxy does not move the target, because the two were only correlated.
          Adversarial: an agent being measured changes its behaviour to raise the proxy at the target&apos;s expense. Reward hacking in
          reinforcement learning (l9.3.3) is the adversarial case; benchmark leaderboards show all four.
        </p>
      </Definition>

      <Theorem title="regressional Goodhart">
        <p>
          Let the true value V and the error X be independent normal variables with means 0 and variances <M>{"\\sigma_V^2"}</M> and{" "}
          <M>{"\\sigma_X^2"}</M>, and let the proxy be U = V + X. Then
        </p>
        <MD>{"\\mathbb{E}[V \\mid U = u] = \\frac{\\sigma_V^2}{\\sigma_V^2 + \\sigma_X^2}\\, u,"}</MD>
        <p>
          and for any selection rule that depends only on U, the mean true value of the selected set is the same factor times its mean
          proxy.
        </p>
      </Theorem>
      <Proof>
        <p>
          (V, U) is jointly normal with <M>{"\\operatorname{Cov}(V, U) = \\sigma_V^2"}</M> and{" "}
          <M>{"\\operatorname{Var}(U) = \\sigma_V^2 + \\sigma_X^2"}</M>. For a jointly normal pair with zero means the conditional mean is
          linear, <M>{"\\mathbb{E}[V \\mid U = u] = (\\operatorname{Cov}(V, U)/\\operatorname{Var}(U))\\,u"}</M> (m7.5.2). If a selection
          keeps a set S of proxy values, the tower property gives{" "}
          <M>{"\\mathbb{E}[V \\mid U \\in S] = \\mathbb{E}[\\mathbb{E}[V \\mid U] \\mid U \\in S]"}</M>, which is the same factor times{" "}
          <M>{"\\mathbb{E}[U \\mid U \\in S]"}</M>. In standardised units the factor is the correlation ρ between proxy and target
          (<C>correlation</C>), so selection still helps: it just delivers a fraction ρ of the proxy gain (<C>selection_gain</C>).
        </p>
        <Code>{SELECT}</Code>
      </Proof>

      <Remark title="extremal Goodhart and heavy tails">
        <p>
          The shrinkage factor is constant only because both variables are normal. If the error has heavier tails than the true value,
          for example a t-distribution against a normal, then a very large proxy value is far more likely to come from a huge error
          than from a large true value, and the conditional mean of V falls back towards its average as the selection threshold rises.
          The figure shows this: a moderate cut gains true value, and an extreme cut gains almost nothing. Benchmark errors are often
          heavy-tailed in exactly this way: a few items with wrong labels, a formatting quirk a model can exploit, or a leaked answer
          key can produce scores far above what ability alone explains.
        </p>
      </Remark>

      <Definition title="adaptive overfitting of a test set">
        <p>
          A test set of n items measures an accuracy p with standard error <M>{"\\sqrt{p(1-p)/n}"}</M> (<C>accuracy_se</C>). If k
          models of equal true accuracy are scored and the best reported, its score exceeds its true accuracy on average, by roughly{" "}
          <M>{"\\mathrm{se}\\sqrt{2 \\ln k}"}</M> for large k with independent errors, the growth rate of the maximum of k normals (m2.3.3)
          (<C>expected_max_bias</C>). Correlated errors, from models that share items they find easy or hard, shrink this. The realised
          inflation of a chosen winner is its observed minus its true score (<C>selection_bias</C>).
        </p>
        <Code>{LEADERBOARD}</Code>
      </Definition>

      <Example title="a crowded leaderboard">
        <p>
          A test set has 1,000 items and models score about 75%. The standard error is <M>{"\\sqrt{0.75 \\times 0.25/1000} \\approx 0.0137"}</M>.
          If 20 equally good variants are tried and the best is published, it is expected to beat its true accuracy by about{" "}
          <M>{"0.0137 \\sqrt{2 \\ln 20} \\approx 0.034"}</M>, over three points, from nothing but selection.
        </p>
      </Example>

      <Remark title="what the evidence says">
        <p>
          Recht and colleagues (2019) rebuilt the CIFAR-10 and ImageNet test sets following the original collection process. Accuracy
          fell by roughly 3 to 15 points on CIFAR-10 and 11 to 14 points on ImageNet, yet the ranking of models was almost unchanged,
          and models with higher original accuracy lost no more than the others. The drop was mostly a shift in the data, not years of
          adaptive overfitting. Goodhart effects are real but measurable: keep a held-out set that is rarely looked at, refresh
          benchmarks, report how many variants were tried, and check gains on independent measures.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shrink",
      rung: "check",
      prompt: (
        <p>
          True value and error are independent and normal with mean 0, variances 1 and 3. A candidate&apos;s proxy score is 2.6. What is
          its expected true value? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.65, tolerance: 0.005 },
    },
    {
      key: "board",
      rung: "check",
      prompt: (
        <p>
          A test set has 2,000 items and submissions score about 80%. Fifty equally good submissions are made and the best is kept. Using{" "}
          <M>{"\\mathrm{se}\\sqrt{2 \\ln k}"}</M>, by how many percentage points is the winner expected to overstate its true accuracy? Give
          two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.01 },
    },
    {
      key: "recht",
      rung: "apply",
      prompt: (
        <p>
          On a freshly collected copy of a test set, every model loses about 12 points, but their order is the same as on the original.
          Which explanation fits best?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The new set differs slightly in distribution from the old one; heavy adaptive overfitting would have hurt the most-tuned models most and reshuffled the order",
          "The field has heavily overfitted the old test set, which is why every model drops",
          "The best models have memorised the old test set",
          "The old test set was too small to rank models",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def correlation(xs, ys):
    n = len(xs)
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    return sxy / (sxx * syy) ** 0.5

def top_fraction(scores, frac):
    m = max(1, int(len(scores) * frac))
    return sorted(range(len(scores)), key=lambda i: -scores[i])[:m]

def selection_gain(true, proxy, frac):
    idx = top_fraction(proxy, frac)
    return sum(true[i] for i in idx) / len(idx) - sum(true) / len(true)

print(round(correlation([1, 2, 3], [2, 4, 7]), 3), top_fraction([0.2, 0.9, 0.5, 0.9], 0.5))
print(top_fraction([3, 1, 2], 0.1), round(selection_gain([1, 0, 0, 1], [5, 4, 1, 2], 0.5), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.993 [1, 3]\n[0] 0.0",
          "0.993 [1, 3]\n[] 0.0",
          "0.993 [3, 1]\n[0] 0.0",
          "0.993 [1, 3]\n[0] 0.5",
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

def accuracy_se(p, n):
    return math.sqrt(p * (1 - p) / n)

def expected_max_bias(se, k):
    return se * math.sqrt(2 * math.log(k))

def selection_bias(true_acc, observed):
    i = max(range(len(observed)), key=lambda j: observed[j])
    return observed[i] - true_acc[i]

print(round(accuracy_se(0.5, 100), 3), round(expected_max_bias(0.05, 1), 3))
print(round(selection_bias([0.7, 0.72, 0.69], [0.74, 0.71, 0.73]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.05 0.0\n0.04",
          "0.025 0.0\n0.04",
          "0.05 0.05\n0.04",
          "0.05 0.0\n0.02",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>correlation(xs, ys)</C> (Pearson), <C>top_fraction(scores, frac)</C>, returning the indices of the highest{" "}
          <C>max(1, int(len(scores) * frac))</C> scores from highest to lowest, ties in index order, and{" "}
          <C>selection_gain(true, proxy, frac)</C>, the mean true value of the items selected by proxy minus the overall mean.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def correlation(xs, ys):
    return 0.0

def top_fraction(scores, frac):
    return list(range(len(scores)))

def selection_gain(true, proxy, frac):
    return 0.0
`,
        solution: SELECT,
        tests: [
          { name: "corr", code: `assert abs(correlation([1, 2, 3, 4], [2, 4, 6, 8]) - 1) < 1e-9 and abs(correlation([1, 2, 3], [3, 2, 1]) + 1) < 1e-9` },
          { name: "select", code: `assert top_fraction([5, 1, 9, 3], 0.5) == [2, 0] and top_fraction([1, 2], 0.01) == [1]\nassert abs(selection_gain([0, 1, 2, 3], [3, 2, 1, 0], 0.25) + 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accuracy_se(p, n)</C>, <C>expected_max_bias(se, k)</C> using the <M>{"\\sqrt{2 \\ln k}"}</M> rule, and{" "}
          <C>selection_bias(true_acc, observed)</C>, the observed minus true accuracy of the model with the highest observed score.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def accuracy_se(p, n):
    return p / n

def expected_max_bias(se, k):
    return se

def selection_bias(true_acc, observed):
    return 0.0
`,
        solution: LEADERBOARD,
        tests: [
          { name: "se", code: `assert abs(accuracy_se(0.9, 100) - 0.03) < 1e-12 and expected_max_bias(0.01, 1) == 0` },
          { name: "bias", code: `import math\nassert abs(selection_bias([0.5, 0.6], [0.58, 0.57]) - 0.08) < 1e-12\nassert abs(expected_max_bias(0.02, 55) - 0.02 * math.sqrt(2 * math.log(55))) < 1e-12` },
        ],
      },
    },
    {
      key: "cut",
      rung: "stretch",
      prompt: (
        <p>
          Proxy and true value are standard normal with correlation 0.6. You keep the top 10% by proxy. What is the expected true value
          of the kept items? Use <M>{"\\mathbb{E}[U \\mid U > z] = \\varphi(z)/P(U > z)"}</M> for a standard normal U. Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.053, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every argument here rested on the standard error of a benchmark score. The next module makes that precise: how to put error
        bars on an evaluation, and when a difference between two models is real.
      </p>
    </>
  ),
};
