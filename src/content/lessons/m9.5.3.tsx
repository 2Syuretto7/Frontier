import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PermTestViz } from "@/components/viz/PermTestViz";
import type { LessonContent } from "@/lib/types";

const EXACT = `from itertools import combinations

def diff(a, b):
    return sum(a) / len(a) - sum(b) / len(b)

def perm_exact(a, b):
    pooled, obs = a + b, diff(a, b)
    count = n = 0
    for idx in combinations(range(len(pooled)), len(a)):
        ga = [pooled[i] for i in idx]
        gb = [pooled[i] for i in range(len(pooled)) if i not in idx]
        count += diff(ga, gb) >= obs - 1e-12
        n += 1
    return count, n`;

const MC = `import numpy as np

def perm_test(a, b, B=10000, seed=0):
    rng = np.random.default_rng(seed)
    pooled, na = np.concatenate([a, b]), len(a)
    obs = a.mean() - b.mean()
    hits = 0
    for _ in range(B):
        p = rng.permutation(pooled)
        hits += p[:na].mean() - p[na:].mean() >= obs - 1e-12
    return (1 + hits) / (1 + B)

def sign_flip(d, B=10000, seed=0):
    rng = np.random.default_rng(seed)
    flips = rng.choice([-1.0, 1.0], size=(B, len(d)))
    return (1 + np.sum((flips * d).mean(axis=1) >= d.mean() - 1e-12)) / (1 + B)`;

export const lesson: LessonContent = {
  id: "m9.5.3",
  minutes: 50,
  links: {
    requires: ["m9.5.2", "m9.4.4"],
    revisits: ["m7.1.2", "m9.1.3"],
    foreshadows: ["m9.8.3"],
  },

  puzzle: (
    <>
      <p>
        Three runs with a new augmentation score 5, 7 and 9; three runs without it score 1, 2 and 3. The numbers are not
        normal, the samples are tiny, and you do not want to assume anything about the distribution. Is there still an
        exact test? There is, and it needs nothing but counting.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the augmentation does nothing, the labels &quot;with&quot; and &quot;without&quot; are arbitrary: any relabelling of
        the six scores was just as likely to occur. Compute the difference for every relabelling. If the observed one is
        among the most extreme, the labels mattered.
      </p>
      <PermTestViz />
    </>
  ),

  theory: (
    <>
      <Definition title="exchangeability and the permutation test">
        <p>
          Random variables are exchangeable if every reordering has the same joint distribution. Under the null hypothesis
          that two groups come from the same distribution, the pooled observations are exchangeable. The permutation test
          compares the observed statistic T with its values over relabellings of the pooled data, all of them or B random
          ones.
        </p>
      </Definition>

      <Example title="exact enumeration">
        <p>
          With groups of 3 there are <M>{"\\binom{6}{3} = 20"}</M> ways to choose which three scores are &quot;with&quot;.
          For 5, 7, 9 against 1, 2, 3 the observed split gives the largest difference, so the one-sided p-value is 1/20 =
          0.05. That is the smallest p-value possible with these group sizes, whatever the data.
        </p>
        <Code>{EXACT}</Code>
      </Example>

      <Theorem title="validity of the Monte Carlo p-value">
        <p>
          Let T₁, …, T_B be the statistic on B independent uniformly random permutations, and{" "}
          <M>{"p = (1 + \\#\\{b : T_b \\geq T\\})/(1 + B)"}</M>. Under the null, <M>{"P(p \\leq \\alpha) \\leq \\alpha"}</M> for
          every α, with no assumption on the distribution of the data.
        </p>
      </Theorem>
      <Proof>
        <p>
          Under the null, permuting exchangeable data leaves their distribution unchanged, so the observed arrangement is
          just one more uniformly random permutation and T, T₁, …, T_B are exchangeable. Hence, ignoring ties, the rank of T
          among these B + 1 values is uniform on {"{1, …, B + 1}"}. Now p ≤ α exactly when at most{" "}
          <M>{"\\lfloor \\alpha(B + 1)\\rfloor - 1"}</M> of the T_b are at least T, that is, when T is among the top{" "}
          <M>{"\\lfloor\\alpha(B + 1)\\rfloor"}</M> values, which has probability{" "}
          <M>{"\\lfloor\\alpha(B + 1)\\rfloor/(B + 1) \\leq \\alpha"}</M>. Ties only make p larger. The &quot;+1&quot; counts
          the observed arrangement and is what makes the bound hold.
        </p>
      </Proof>

      <Example title="paired comparisons by sign flipping">
        <p>
          To compare two models on the same test examples, take per-example differences dᵢ. If the models are equally good
          in the sense that each dᵢ is symmetric about 0, flipping the sign of any dᵢ leaves the distribution unchanged.
          Randomly flipping signs gives the null distribution of the mean difference: a paired permutation test.
        </p>
        <Code>{MC}</Code>
      </Example>

      <Remark title="what is being tested">
        <p>
          A permutation test of equal distributions is exact; used as a test of equal means when variances differ, it is
          only approximately valid. Unlike the bootstrap, which estimates variability around the truth, the permutation test
          builds the distribution under the null exactly. Choose the statistic for power (a difference in means, medians,
          or any metric), and keep the unit of permutation the unit that was randomised.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "splits",
      rung: "check",
      prompt: <p>Two groups of 4 observations are pooled. How many distinct ways are there to choose which 4 belong to the first group?</p>,
      answer: { kind: "numeric", value: 70, tolerance: 0.0001 },
    },
    {
      key: "min",
      rung: "check",
      prompt: <p>With groups of 5 and 2 and an exact one-sided permutation test, what is the smallest possible p-value? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0476, tolerance: 0.0001 },
    },
    {
      key: "assume",
      rung: "apply",
      prompt: <p>What does the permutation test need under the null hypothesis?</p>,
      answer: {
        kind: "choice",
        options: ["The observations are exchangeable across the group labels", "The data are normally distributed", "The groups have large samples", "The variances are known"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def diff(a, b):
    return sum(a) / len(a) - sum(b) / len(b)

def perm_exact(a, b):
    pooled, obs = a + b, diff(a, b)
    count = n = 0
    for idx in combinations(range(len(pooled)), len(a)):
        ga = [pooled[i] for i in idx]
        gb = [pooled[i] for i in range(len(pooled)) if i not in idx]
        count += diff(ga, gb) >= obs - 1e-12
        n += 1
    return count, n

print(diff([5, 7, 9], [1, 2, 3]), perm_exact([5, 7, 9], [1, 2, 3]))
print(perm_exact([3, 1], [2, 4]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5.0 (1, 20)\n(5, 6)", "5.0 (1, 20)\n(1, 6)", "5.0 (0, 20)\n(5, 6)", "5.0 (1, 6)\n(5, 20)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def perm_test(a, b, B=10000, seed=0):
    rng = np.random.default_rng(seed)
    pooled, na = np.concatenate([a, b]), len(a)
    obs = a.mean() - b.mean()
    hits = 0
    for _ in range(B):
        p = rng.permutation(pooled)
        hits += p[:na].mean() - p[na:].mean() >= obs - 1e-12
    return (1 + hits) / (1 + B)

def sign_flip(d, B=10000, seed=0):
    rng = np.random.default_rng(seed)
    flips = rng.choice([-1.0, 1.0], size=(B, len(d)))
    return (1 + np.sum((flips * d).mean(axis=1) >= d.mean() - 1e-12)) / (1 + B)

print(round(perm_test(np.array([5.0, 7, 9]), np.array([1.0, 2, 3])), 2))
d = np.array([0.02, 0.01, 0.03, -0.01, 0.02, 0.015, 0.0, 0.025])
print(round(float(sign_flip(d)), 3), round(float(sign_flip(-d)), 3))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.05\n0.023 0.993", "0.0\n0.023 0.993", "0.05\n0.023 0.023", "0.5\n0.023 0.993"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>diff(a, b)</C>, the difference in means, and <C>perm_exact(a, b)</C>, which enumerates all choices of
          len(a) positions from the pooled list a + b (with itertools.combinations) and returns (number of splits whose
          difference is at least the observed one, total number of splits).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def diff(a, b):
    return 0.0

def perm_exact(a, b):
    return 0, 1
`,
        solution: EXACT,
        tests: [
          { name: "diff", code: `assert diff([2, 4], [1]) == 2` },
          { name: "exact", code: `assert perm_exact([1, 2], [3, 4]) == (6, 6)
assert perm_exact([10, 9], [1, 2, 3]) == (1, 10)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>perm_test(a, b, B=10000, seed=0)</C>, the Monte Carlo one-sided permutation p-value (1 + hits)/(1 + B)
          for the difference in means using rng.permutation, and <C>sign_flip(d, B=10000, seed=0)</C>, the paired version
          that multiplies the differences by random signs from rng.choice([-1.0, 1.0]).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def perm_test(a, b, B=10000, seed=0):
    return 1.0

def sign_flip(d, B=10000, seed=0):
    return 1.0
`,
        solution: MC,
        tests: [
          { name: "perm", code: `import numpy as np
p = perm_test(np.array([10.0, 9, 8, 7]), np.array([1.0, 2, 3, 4]), B=4000)
assert abs(p - 1 / 70) < 0.008
assert perm_test(np.array([1.0, 2]), np.array([3.0, 4]), B=500) == 1.0` },
          { name: "flip", code: `import numpy as np
p = sign_flip(np.ones(6), B=6000)
assert abs(p - 1 / 64) < 0.006 and sign_flip(-np.ones(6), B=100) == 1.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Assume that under the null the observed statistic T and the B permuted statistics T₁, …, T_B are exchangeable with no ties. Prove that p = (1 + #{"{b : T_b ≥ T}"})/(1 + B) satisfies P(p ≤ α) ≤ α.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses exchangeability to argue that the rank of T among the B + 1 values is uniform on {1, …, B + 1}.",
          "Shows p ≤ α exactly when T is among the top ⌊α(B + 1)⌋ values.",
          "Concludes P(p ≤ α) = ⌊α(B + 1)⌋/(B + 1) ≤ α.",
        ],
      },
    },
    {
      key: "flip10",
      rung: "stretch",
      prompt: <p>A new model beats the old one on all 10 of 10 paired test sets. What is the exact one-sided sign-flip p-value for the statistic &quot;number of wins&quot;? Give six decimal places.</p>,
      answer: { kind: "numeric", value: 0.000977, tolerance: 0.000002 },
    },
  ],

  teachBack:
    "Explain to a friend why shuffling labels simulates the null hypothesis, how an exact permutation test is computed, why the Monte Carlo p-value with the plus one is valid, and how sign flipping compares two models on the same test examples.",

  glimpse: (
    <>
      <p>
        So far each sample had one variable. Next we model one variable as a function of others, starting with linear
        regression and its geometry as a projection.
      </p>
    </>
  ),
};
