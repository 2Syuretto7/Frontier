import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BhStepViz } from "@/components/viz/BhStepViz";
import type { LessonContent } from "@/lib/types";

const FWER = `def bonferroni(ps, alpha):
    m = len(ps)
    return [i for i, p in enumerate(ps) if p <= alpha / m]

def holm(ps, alpha):
    m = len(ps)
    order = sorted(range(m), key=lambda i: ps[i])
    out = []
    for k, i in enumerate(order):
        if ps[i] > alpha / (m - k):
            break
        out.append(i)
    return sorted(out)`;

const FDR = `import numpy as np

def bh(ps, q):
    ps = np.asarray(ps)
    m = len(ps)
    order = np.argsort(ps)
    ok = ps[order] <= q * np.arange(1, m + 1) / m
    k = ok.nonzero()[0].max() + 1 if ok.any() else 0
    return np.sort(order[:k])

def simulate(m=100, m1=20, q=0.1, reps=2000, seed=0):
    rng = np.random.default_rng(seed)
    fdp, any_false = [], []
    for _ in range(reps):
        ps = np.concatenate([rng.beta(0.1, 1, m1), rng.uniform(size=m - m1)])
        R = bh(ps, q)
        V = int((R >= m1).sum())
        fdp.append(V / max(len(R), 1))
        any_false.append(V > 0)
    return round(float(np.mean(fdp)), 3), round(float(np.mean(any_false)), 3)`;

export const lesson: LessonContent = {
  id: "m9.4.5",
  minutes: 55,
  links: {
    requires: ["m9.4.4", "m7.1.1"],
    revisits: ["m9.1.3", "m7.2.3"],
    foreshadows: ["m9.8.1", "m9.8.5"],
  },

  puzzle: (
    <>
      <p>
        A hyperparameter sweep compares 40 configurations against a baseline, each with its own test at α = 0.05. Three
        come out significant. If none of the configurations truly helped, you would expect two significant results anyway.
        How should the threshold change when many questions are asked at once, and how strict must it be?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are two reasonable goals. Either make it unlikely that even one false claim slips through, which demands very
        small p-values, or accept a few false claims as long as they are a small fraction of everything claimed, which
        lets many more real effects through.
      </p>
      <BhStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="error rates for many tests">
        <p>
          Test m hypotheses, m₀ of them true nulls. Let R be the number of rejections and V the number of those that are
          true nulls. The family-wise error rate is <M>{"\\mathrm{FWER} = P(V \\geq 1)"}</M>. The false discovery rate is{" "}
          <M>{"\\mathrm{FDR} = \\mathbb{E}[V / \\max(R, 1)]"}</M>, the expected fraction of false claims.
        </p>
      </Definition>

      <Theorem title="Bonferroni and Holm">
        <p>
          Bonferroni rejects every hypothesis with <M>{"p_i \\leq \\alpha/m"}</M>. Holm sorts the p-values{" "}
          <M>{"p_{(1)} \\leq \\dots \\leq p_{(m)}"}</M> and rejects <M>{"p_{(1)}, \\dots, p_{(k)}"}</M> while{" "}
          <M>{"p_{(j)} \\leq \\alpha/(m - j + 1)"}</M>, stopping at the first failure. Both have FWER ≤ α under any
          dependence, and Holm rejects everything Bonferroni does.
        </p>
      </Theorem>
      <Proof>
        <p>
          Bonferroni: by the union bound, <M>{"P(V \\geq 1) \\leq \\sum_{i \\in H_0} P(p_i \\leq \\alpha/m) \\leq m_0 \\alpha/m \\leq \\alpha"}</M>.
          Holm: let j be the sorted position of the smallest true-null p-value. At most m − m₀ hypotheses come before it,
          so j ≤ m − m₀ + 1 and its threshold is <M>{"\\alpha/(m - j + 1) \\leq \\alpha/m_0"}</M>. A false rejection
          requires reaching position j, so it requires some true-null <M>{"p_i \\leq \\alpha/m_0"}</M>, which has
          probability at most <M>{"m_0 \\cdot \\alpha/m_0 = \\alpha"}</M>. Holm&apos;s first threshold is α/m and the others
          are larger, so it rejects at least what Bonferroni does.
        </p>
        <Code>{FWER}</Code>
      </Proof>

      <Theorem title="Benjamini-Hochberg">
        <p>
          Let k be the largest j with <M>{"p_{(j)} \\leq jq/m"}</M>, and reject <M>{"p_{(1)}, \\dots, p_{(k)}"}</M>. If the
          true-null p-values are independent and uniform, and independent of the others, then{" "}
          <M>{"\\mathrm{FDR} = (m_0/m)\\, q \\leq q"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sketch. For a true null i, write <M>{"V = \\sum_{i \\in H_0} \\mathbf 1\\{i \\text{ rejected}\\}"}</M>, so the FDR
          is the sum over true nulls of <M>{"\\mathbb{E}[\\mathbf 1\\{i \\text{ rejected}\\}/\\max(R, 1)]"}</M>. On the event{" "}
          R = r, null i is rejected exactly when <M>{"p_i \\leq rq/m"}</M>. Conditioning on the other p-values and using that
          p_i is uniform, each term works out to (rq/m)/r = q/m. Summing over the m₀ true nulls gives m₀q/m.
        </p>
        <Code>{FDR}</Code>
      </Proof>

      <Example title="reading the simulation">
        <p>
          With 100 tests, 20 real effects and q = 0.1, the simulated FDR is 0.078, close to (80/100)(0.1) = 0.08. But
          two-thirds of runs contain at least one false discovery: BH does not control the FWER, and is not meant to.
        </p>
      </Example>

      <Remark title="choosing a guard">
        <p>
          Use FWER control when any single false claim is costly, such as a confirmatory result you will build on; use FDR
          control for screening, such as which of thousands of features or genes to follow up. In machine learning, the
          multiplicity is often hidden: every configuration, seed and metric you looked at counts, and repeated evaluation
          on a public test set overfits the leaderboard in exactly this way. A held-out set used once is the simplest
          protection.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "bonf",
      rung: "check",
      prompt: <p>With 50 tests and α = 0.05, what is the Bonferroni per-test threshold?</p>,
      answer: { kind: "numeric", value: 0.001, tolerance: 0.000001 },
    },
    {
      key: "bh",
      rung: "check",
      prompt: <p>Benjamini-Hochberg with q = 0.1 is applied to the p-values 0.01, 0.04, 0.05, 0.3. How many hypotheses are rejected?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "fdr",
      rung: "apply",
      prompt: <p>What does the false discovery rate measure?</p>,
      answer: {
        kind: "choice",
        options: ["The expected fraction of rejected hypotheses that are true nulls", "The probability of at least one false rejection", "The fraction of true nulls among all hypotheses", "The probability that a given null is rejected"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bonferroni(ps, alpha):
    m = len(ps)
    return [i for i, p in enumerate(ps) if p <= alpha / m]

def holm(ps, alpha):
    m = len(ps)
    order = sorted(range(m), key=lambda i: ps[i])
    out = []
    for k, i in enumerate(order):
        if ps[i] > alpha / (m - k):
            break
        out.append(i)
    return sorted(out)

ps = [0.001, 0.02, 0.03, 0.2, 0.012]
print(bonferroni(ps, 0.05), holm(ps, 0.05))
print(holm([0.04, 0.01], 0.05), bonferroni([0.04, 0.01], 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0] [0, 4]\n[0, 1] [1]", "[0] [0]\n[1] [1]", "[0, 4] [0, 4]\n[0, 1] [1]", "[0] [0, 1, 2, 4]\n[0, 1] [0, 1]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def bh(ps, q):
    ps = np.asarray(ps)
    m = len(ps)
    order = np.argsort(ps)
    ok = ps[order] <= q * np.arange(1, m + 1) / m
    k = ok.nonzero()[0].max() + 1 if ok.any() else 0
    return np.sort(order[:k])

def simulate(m=100, m1=20, q=0.1, reps=2000, seed=0):
    rng = np.random.default_rng(seed)
    fdp, any_false = [], []
    for _ in range(reps):
        ps = np.concatenate([rng.beta(0.1, 1, m1), rng.uniform(size=m - m1)])
        R = bh(ps, q)
        V = int((R >= m1).sum())
        fdp.append(V / max(len(R), 1))
        any_false.append(V > 0)
    return round(float(np.mean(fdp)), 3), round(float(np.mean(any_false)), 3)

print([int(i) for i in bh([0.001, 0.02, 0.03, 0.2, 0.012], 0.05)], len(bh([0.5, 0.9], 0.05)))
print(simulate())`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, 1, 2, 4] 0\n(0.078, 0.664)", "[0, 4] 0\n(0.078, 0.664)", "[0, 1, 2, 4] 0\n(0.664, 0.078)", "[0, 1, 2, 3, 4] 2\n(0.078, 0.664)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bonferroni(ps, alpha)</C> and <C>holm(ps, alpha)</C>, each returning the sorted list of indices of rejected
          hypotheses.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bonferroni(ps, alpha):
    return []

def holm(ps, alpha):
    return []
`,
        solution: FWER,
        tests: [
          { name: "bonf", code: `assert bonferroni([0.01, 0.02, 0.001], 0.03) == [0, 2]` },
          { name: "holm", code: `assert holm([0.01, 0.02, 0.001], 0.03) == [0, 1, 2]
assert holm([0.5, 0.001, 0.02], 0.03) == [1]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bh(ps, q)</C>, returning the sorted array of indices rejected by Benjamini-Hochberg, and{" "}
          <C>simulate(m=100, m1=20, q=0.1, reps=2000, seed=0)</C>, which draws the first m1 p-values from Beta(0.1, 1) and the
          rest uniform, and returns the mean false discovery proportion and the fraction of runs with any false discovery,
          both rounded to 3 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bh(ps, q):
    return np.array([], dtype=int)

def simulate(m=100, m1=20, q=0.1, reps=2000, seed=0):
    return 0.0, 0.0
`,
        solution: FDR,
        tests: [
          { name: "bh", code: `assert list(bh([0.01, 0.04, 0.05, 0.3], 0.1)) == [0, 1, 2]
assert list(bh([0.04, 0.2, 0.01], 0.05)) == [2] and list(bh([0.03, 0.2, 0.01], 0.05)) == [0, 2] and len(bh([0.9], 0.1)) == 0` },
          { name: "sim", code: `f, a = simulate(m=50, m1=0, q=0.2, reps=3000)
assert abs(f - 0.2) < 0.03 and abs(a - f) < 1e-9` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that Holm&apos;s step-down procedure controls the family-wise error rate at α, for any dependence between the p-values.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers the first true null in sorted order, at position j, and notes that at most m − m₀ hypotheses precede it, so j ≤ m − m₀ + 1.",
          "Concludes its threshold α/(m − j + 1) is at most α/m₀, so any false rejection requires some true-null p-value ≤ α/m₀.",
          "Applies the union bound over the m₀ true nulls: probability at most m₀ · α/m₀ = α.",
        ],
      },
    },
    {
      key: "sidak",
      rung: "stretch",
      prompt: <p>For 10 independent tests, what per-test level a gives exactly 1 − (1 − a)^10 = 0.05? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0051, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why many tests need adjusted thresholds, the difference between controlling the family-wise error rate and the false discovery rate, how Bonferroni, Holm and Benjamini-Hochberg work, and where hidden multiplicity arises in machine learning experiments.",

  glimpse: (
    <>
      <p>
        Tests answer yes or no. Confidence intervals, next, report a whole range of parameter values consistent with the
        data, and they are just tests turned inside out.
      </p>
    </>
  ),
};
