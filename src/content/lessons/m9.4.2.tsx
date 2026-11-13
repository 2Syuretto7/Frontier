import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NpRocViz } from "@/components/viz/NpRocViz";
import type { LessonContent } from "@/lib/types";

const NP = `import math

def lr_normal(x, mu0, mu1, sigma=1.0):
    return math.exp(((x - mu0) ** 2 - (x - mu1) ** 2) / (2 * sigma ** 2))

def np_region(p0, p1, alpha):
    order = sorted(range(len(p0)), key=lambda i: p1[i] / p0[i], reverse=True)
    region, size, power = [], 0.0, 0.0
    for i in order:
        if size + p0[i] > alpha + 1e-12:
            break
        region.append(i)
        size += p0[i]
        power += p1[i]
    return sorted(region), round(size, 4), round(power, 4)`;

const ROC = `import numpy as np

def roc_points(stat0, stat1, alphas):
    out = []
    for a in alphas:
        c = np.quantile(stat0, 1 - a)
        out.append(round(float(np.mean(stat1 > c)), 3))
    return out

def compare(reps=200000, seed=0):
    rng = np.random.default_rng(seed)
    x0, x1 = rng.normal(0, 1, reps), rng.normal(0, 2, reps)
    a = [0.01, 0.05, 0.2]
    return roc_points(np.abs(x0), np.abs(x1), a), roc_points(x0, x1, a)`;

export const lesson: LessonContent = {
  id: "m9.4.2",
  minutes: 55,
  links: {
    requires: ["m9.4.1"],
    revisits: ["m9.3.2", "m7.1.4"],
    foreshadows: ["m9.4.3"],
  },

  puzzle: (
    <>
      <p>
        A detector must decide whether a signal is plain noise, N(0, 1), or noise with a louder amplifier, N(0, 4). It may
        raise false alarms on 5% of pure noise. Should it alarm when the reading is large, or when it is large in absolute
        value, or by some other rule? Among all rules with 5% false alarms, one is provably best, and a single formula finds
        it.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every outcome costs some false-alarm budget (its probability under the null) and buys some power (its probability
        under the alternative). To buy the most power with a fixed budget, spend on the outcomes with the best exchange
        rate: the highest likelihood ratio.
      </p>
      <NpRocViz />
    </>
  ),

  theory: (
    <>
      <Definition title="likelihood ratio test">
        <p>
          For a simple null f₀ and simple alternative f₁, the likelihood ratio test with threshold k rejects when{" "}
          <M>{"\\Lambda(x) = f_1(x)/f_0(x) > k"}</M>. A test is most powerful at level α if no other level α test has larger
          power against f₁.
        </p>
      </Definition>

      <Theorem title="Neyman-Pearson lemma">
        <p>
          If the likelihood ratio test with threshold k has size exactly α, it is most powerful among all tests of level α.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let φ* be the indicator of the LR region and φ any test with <M>{"\\int \\varphi f_0 \\leq \\alpha"}</M>. For every
          x, <M>{"(\\varphi^*(x) - \\varphi(x))(f_1(x) - k f_0(x)) \\geq 0"}</M>: where f₁ &gt; kf₀ we have φ* = 1 ≥ φ, and
          where f₁ ≤ kf₀ we have φ* = 0 ≤ φ. Integrating,
        </p>
        <MD>{"\\int (\\varphi^* - \\varphi) f_1 \\geq k \\int (\\varphi^* - \\varphi) f_0 = k\\Big(\\alpha - \\int \\varphi f_0\\Big) \\geq 0,"}</MD>
        <p>so the power of φ* is at least the power of φ.</p>
      </Proof>

      <Example title="the greedy view">
        <p>
          For discrete data, sort outcomes by likelihood ratio and add them to the region until the size budget is spent.
          Discreteness may leave budget unused; exact size α then needs a randomised test that rejects the next outcome
          with some probability, which the lemma also covers.
        </p>
        <Code>{NP}</Code>
      </Example>

      <Example title="normal mean and variance">
        <p>
          For iid N(μ, 1) with μ₀ = 0 and μ₁ &gt; 0, the log likelihood ratio is <M>{"n\\mu_1\\bar X - n\\mu_1^2/2"}</M>,
          increasing in X̄, so the most powerful test rejects when X̄ &gt; c. The cut-off c depends only on α and n, not on μ₁,
          so the same test is most powerful against every μ₁ &gt; 0: it is uniformly most powerful for the one-sided
          alternative. For the variance alternative N(0, σ²) with σ &gt; 1, the ratio increases with |x|, and the region is
          |x| &gt; c. The simulation estimates the powers at α = 0.01, 0.05, 0.2.
        </p>
        <Code>{ROC}</Code>
      </Example>

      <Remark title="limits and connections">
        <p>
          Against the two-sided alternative μ ≠ 0 no uniformly most powerful test exists: the best test against μ₁ &gt; 0
          rejects for large X̄ and is useless against μ₁ &lt; 0. The general recipe for composite hypotheses is the
          likelihood ratio test of the next lesson. In classification, the lemma says that among all classifiers with a
          given false positive rate, thresholding the true likelihood ratio, or equivalently the posterior probability,
          gives the highest true positive rate; its ROC curve lies above every other classifier&apos;s.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lr",
      rung: "check",
      prompt: <p>For one observation, what is the likelihood ratio f₁(x)/f₀(x) of N(1, 1) against N(0, 1) at x = 2? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 4.4817, tolerance: 0.0005 },
    },
    {
      key: "greedy",
      rung: "check",
      prompt: <p>Four outcomes have null probabilities 0.05, 0.05, 0.3, 0.6 and alternative probabilities 0.3, 0.1, 0.4, 0.2. What is the power of the most powerful non-randomised test of size 0.1?</p>,
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0001 },
    },
    {
      key: "shape",
      rung: "apply",
      prompt: <p>For iid N(μ, 1) data, what does the most powerful test of μ = 0 against μ = 1 reject on?</p>,
      answer: { kind: "choice", options: ["Large values of X̄", "Large values of |X̄|", "Small values of X̄", "Large values of the sample variance"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def lr_normal(x, mu0, mu1, sigma=1.0):
    return math.exp(((x - mu0) ** 2 - (x - mu1) ** 2) / (2 * sigma ** 2))

def np_region(p0, p1, alpha):
    order = sorted(range(len(p0)), key=lambda i: p1[i] / p0[i], reverse=True)
    region, size, power = [], 0.0, 0.0
    for i in order:
        if size + p0[i] > alpha + 1e-12:
            break
        region.append(i)
        size += p0[i]
        power += p1[i]
    return sorted(region), round(size, 4), round(power, 4)

p0, p1 = [0.1, 0.2, 0.3, 0.4], [0.4, 0.3, 0.2, 0.1]
print(round(lr_normal(1.0, 0, 1), 4), np_region(p0, p1, 0.3))
print(np_region(p0, p1, 0.5), np_region(p1, p0, 0.15))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.6487 ([0, 1], 0.3, 0.7)\n([0, 1], 0.3, 0.7) ([3], 0.1, 0.4)", "1.6487 ([0, 1], 0.3, 0.7)\n([0, 1, 2], 0.6, 0.9) ([3], 0.1, 0.4)", "0.6065 ([0, 1], 0.3, 0.7)\n([0, 1], 0.3, 0.7) ([3], 0.1, 0.4)", "1.6487 ([2, 3], 0.7, 0.3)\n([0, 1], 0.3, 0.7) ([0], 0.4, 0.1)"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def roc_points(stat0, stat1, alphas):
    out = []
    for a in alphas:
        c = np.quantile(stat0, 1 - a)
        out.append(round(float(np.mean(stat1 > c)), 3))
    return out

def compare(reps=200000, seed=0):
    rng = np.random.default_rng(seed)
    x0, x1 = rng.normal(0, 1, reps), rng.normal(0, 2, reps)
    a = [0.01, 0.05, 0.2]
    return roc_points(np.abs(x0), np.abs(x1), a), roc_points(x0, x1, a)

lr_test, naive = compare()
print(lr_test)
print(naive)`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.198, 0.328, 0.524]\n[0.122, 0.206, 0.338]", "[0.122, 0.206, 0.338]\n[0.198, 0.328, 0.524]", "[0.01, 0.05, 0.2]\n[0.01, 0.05, 0.2]", "[0.198, 0.328, 0.524]\n[0.198, 0.328, 0.524]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lr_normal(x, mu0, mu1, sigma=1.0)</C>, the likelihood ratio of N(μ₁, σ²) to N(μ₀, σ²) at x, and{" "}
          <C>np_region(p0, p1, alpha)</C>, which adds outcomes in decreasing order of p1/p0 while the size stays within alpha,
          stopping at the first that does not fit, and returns (sorted region, size, power) with the numbers rounded to 4
          places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def lr_normal(x, mu0, mu1, sigma=1.0):
    return 1.0

def np_region(p0, p1, alpha):
    return [], 0.0, 0.0
`,
        solution: NP,
        tests: [
          { name: "lr", code: `import math
assert abs(lr_normal(0.5, 0, 1) - 1) < 1e-12
assert abs(lr_normal(3, 0, 2, sigma=2) - math.exp(1)) < 1e-12` },
          { name: "region", code: `assert np_region([0.05, 0.05, 0.3, 0.6], [0.3, 0.1, 0.4, 0.2], 0.1) == ([0, 1], 0.1, 0.4)
assert np_region([0.5, 0.5], [0.9, 0.1], 0.2) == ([], 0.0, 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>roc_points(stat0, stat1, alphas)</C>, which for each α sets the cut-off at the 1 − α quantile of the null
          statistics and returns the fraction of alternative statistics above it, rounded to 3 places, and{" "}
          <C>compare(reps=200000, seed=0)</C>, which simulates N(0, 1) and N(0, 4) draws and returns the ROC points of |x| and of
          x at α = 0.01, 0.05, 0.2.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def roc_points(stat0, stat1, alphas):
    return [0.0 for a in alphas]

def compare(reps=200000, seed=0):
    return [], []
`,
        solution: ROC,
        tests: [
          { name: "points", code: `import numpy as np
s0 = np.arange(100.0)
assert roc_points(s0, s0 + 1000, [0.1]) == [1.0] and roc_points(s0, s0 - 1000, [0.1]) == [0.0]` },
          { name: "compare", code: `a, b = compare(reps=40000)
assert all(x > y for x, y in zip(a, b)) and abs(a[1] - 0.327) < 0.02` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove the Neyman-Pearson lemma: if the test rejecting when f₁(x) &gt; k f₀(x) has size α, then no test of level α has greater power.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Lets φ* be the likelihood ratio test and φ any level α test (values in [0, 1]).",
          "Shows (φ* − φ)(f₁ − k f₀) ≥ 0 pointwise by considering the cases f₁ > k f₀ and f₁ ≤ k f₀.",
          "Integrates to get ∫(φ* − φ) f₁ ≥ k(α − ∫ φ f₀) ≥ 0, so the power of φ* is at least that of φ.",
        ],
      },
    },
    {
      key: "pow",
      rung: "stretch",
      prompt: <p>With n = 4 observations from N(μ, 1), the most powerful size 0.05 test of μ = 0 against μ = 1 rejects when X̄ &gt; 1.645/2. What is its power? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.639, tolerance: 0.002 },
    },
  ],

  teachBack:
    "Explain to a friend what the Neyman-Pearson lemma says, why spending the false alarm budget on outcomes with the highest likelihood ratio maximises power, how it gives the uniformly most powerful one-sided test for a normal mean, and how it relates to ROC curves.",

  glimpse: (
    <>
      <p>
        Real hypotheses are rarely simple: &quot;the two models are equally accurate&quot; leaves the common accuracy
        unspecified. The generalised likelihood ratio test of the next lesson handles such composite hypotheses, and
        Wilks&apos; theorem gives its null distribution.
      </p>
    </>
  ),
};
