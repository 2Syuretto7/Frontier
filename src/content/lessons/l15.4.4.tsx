import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PairedTestViz } from "@/components/viz/PairedTestViz";
import type { LessonContent } from "@/lib/types";

const PAIRED = `import math

def paired_diffs(a, b):
    return [x - y for x, y in zip(a, b)]                   # same examples, so difficulty cancels

def win_loss(a, b):
    d = paired_diffs(a, b)
    return sum(x > 0 for x in d), sum(x < 0 for x in d)    # ties are dropped

def sign_test_p(wins, losses):
    n, k = wins + losses, max(wins, losses)
    tail = sum(math.comb(n, i) for i in range(k, n + 1)) / 2**n
    return min(1.0, 2 * tail)                              # two-sided`;

const AUDIT = `def rounding_ok(reported, value, decimals):
    return abs(reported - value) <= 0.5 * 10**-decimals + 1e-9

def check_claims(claims, results):
    return sorted(k for k, (num, dec) in claims.items() if not rounding_ok(num, results[k], dec))

def relative_ok(claimed_pct, base, new, decimals):
    actual = 100 * ((1 - base) - (1 - new)) / (1 - base)   # relative error reduction in per cent
    return rounding_ok(claimed_pct, actual, decimals)`;

export const lesson: LessonContent = {
  id: "l15.4.4",
  minutes: 60,
  links: {
    requires: ["l15.4.3", "l15.3.3"],
    revisits: ["l15.3.1", "l15.1.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        The last part of the thesis is a paper built from the proposal, the reproduction and the extension, and a
        defence of it. Parton will play the examiner and ask the hardest questions it can find: is the gain real, is it
        your idea that causes it, does it hold beyond your setup, and does every number in the abstract match the
        tables? Which of these can you answer with evidence already in hand, and which need one more analysis?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A defence is won before it starts, by anticipating the questions and putting the answers in the paper. Most hard
        questions fall into a few families: statistical (is the difference larger than noise, after accounting for how
        many things were tried), causal (does the ablation isolate the idea), external (does it hold on other benchmarks
        and scales), and factual (do the stated numbers match the results). Each has a standard piece of evidence. Two
        are especially cheap and often missing: comparing systems on the same examples, which removes shared difficulty
        from the noise, and auditing every number in the text against the tables.
      </p>
      <PairedTestViz />
    </>
  ),

  theory: (
    <>
      <Definition title="assembling the paper">
        <p>
          The proposal&apos;s question and the map of the subfield become the introduction and related work. The
          reproduction becomes the baseline section, with its margin and verdict. The extension becomes the method and
          the main experiments, with the factorial or ablation table and the correction for the variants tried. The
          limitations section records where the idea failed or was not tested. The structure of l15.3.1 applies: the
          main claim, with a number, in the title, abstract, introduction and first figure.
        </p>
      </Definition>

      <Theorem title="paired comparisons">
        <p>
          Score two systems on the same n examples, with per-example standard deviations <M>{"\\sigma_a, \\sigma_b"}</M>
          and correlation ρ. The mean of the per-example differences (<C>paired_diffs</C>) has standard error
        </p>
        <MD>{"\\sqrt{\\frac{\\sigma_a^2 + \\sigma_b^2 - 2\\rho\\sigma_a\\sigma_b}{n}},"}</MD>
        <p>
          smaller than the unpaired <M>{"\\sqrt{(\\sigma_a^2 + \\sigma_b^2)/n}"}</M> whenever ρ &gt; 0. Across benchmarks,
          where scales differ, count wins and losses (<C>win_loss</C>); if neither system is better, each non-tied
          comparison favours either with probability one half, and the two-sided sign test p-value is{" "}
          <M>{"\\min(1, 2P(X \\ge \\max(w, l)))"}</M> with <M>{"X \\sim \\mathrm{Bin}(w + l, 1/2)"}</M> (<C>sign_test_p</C>).
        </p>
        <Code>{PAIRED}</Code>
      </Theorem>
      <Proof>
        <p>
          For one example, <M>{"\\mathrm{Var}(a - b) = \\sigma_a^2 + \\sigma_b^2 - 2\\,\\mathrm{Cov}(a, b)"}</M> with{" "}
          <M>{"\\mathrm{Cov}(a, b) = \\rho\\sigma_a\\sigma_b"}</M>; averaging n independent examples divides the variance
          by n. Unpaired comparison treats the two means as independent and so omits the covariance term. For the sign
          test, under the null hypothesis the number of wins among the n = w + l non-tied comparisons is{" "}
          <M>{"\\mathrm{Bin}(n, 1/2)"}</M>, which is symmetric, so the probability of a result at least as extreme in
          either direction is twice the upper tail at <M>{"\\max(w, l)"}</M>, capped at 1 because the two tails overlap
          when w = l. The test assumes only independence between benchmarks, which is why it is recommended for comparing
          methods across datasets.
        </p>
      </Proof>

      <Definition title="auditing the numbers">
        <p>
          A number reported to d decimals is consistent with a computed value v when they differ by at most half a unit
          in the last place, <M>{"0.5 \\times 10^{-d}"}</M> (<C>rounding_ok</C>). Check every claimed number against the
          results it came from (<C>check_claims</C>), and recompute every derived claim, such as a relative error
          reduction, from the underlying accuracies (<C>relative_ok</C>). The audit should be a script run on the logged
          results, as in l15.2.3, so it can be rerun after every change to the paper.
        </p>
        <Code>{AUDIT}</Code>
      </Definition>

      <Example title="questions to expect">
        <p>
          Statistical: how many seeds, what are the intervals, was the comparison paired, how many variants were tried?
          Causal: what happens with the idea but not the trick, and with the trick but not the idea? External: does the
          gain hold on a second benchmark, at a second scale, with a tuned baseline? Factual: where does the number in the
          abstract come from? Conceptual: why should the idea work, and what result would show that it does not? For each,
          the answer should point to a table, figure or appendix, or honestly to the limitations section.
        </p>
      </Example>

      <Remark title="the defence with Parton">
        <p>
          Give Parton the full paper and ask it to examine you as a hostile but fair expert: one question at a time, each
          targeting the weakest claim it can find, with a follow-up when the answer is vague. Answer with evidence from
          the paper. Where you cannot, decide whether the paper needs a new analysis, a weaker claim or a new limitation,
          and change it. As l15.3.3 warned, ask it to argue against the paper, since model reviewers drift towards
          agreement. The thesis is complete when the hardest remaining question is one the paper already answers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sign",
      rung: "check",
      prompt: (
        <p>
          A new method beats the baseline on 9 of 12 benchmarks and loses on 3, with no ties. What is the two-sided sign
          test p-value? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.146, tolerance: 0.001 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          Two systems have equal per-example standard deviations and per-example scores with correlation 0.8. By what
          factor does pairing multiply the standard error of the mean difference? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4472, tolerance: 0.0005 },
    },
    {
      key: "family",
      rung: "apply",
      prompt: (
        <p>
          An examiner asks whether the gain comes from your idea or from the extra trick in your best variant. Which
          evidence answers this?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "A factorial table with the baseline, idea only, trick only and both, with seeds and intervals",
          "A larger number of benchmarks for the best variant",
          "A sign test across benchmarks",
          "A more detailed related work section",
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

def paired_diffs(a, b):
    return [x - y for x, y in zip(a, b)]                   # same examples, so difficulty cancels

def win_loss(a, b):
    d = paired_diffs(a, b)
    return sum(x > 0 for x in d), sum(x < 0 for x in d)    # ties are dropped

def sign_test_p(wins, losses):
    n, k = wins + losses, max(wins, losses)
    tail = sum(math.comb(n, i) for i in range(k, n + 1)) / 2**n
    return min(1.0, 2 * tail)                              # two-sided

a = [0.9, 0.8, 0.7, 0.6]; b = [0.8, 0.8, 0.5, 0.7]
print([round(d, 2) for d in paired_diffs(a, b)], win_loss(a, b), round(sign_test_p(3, 0), 4), sign_test_p(1, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.1, 0.0, 0.2, -0.1] (2, 1) 0.25 1.0",
          "[0.1, 0.0, 0.2, -0.1] (2, 2) 0.25 1.0",
          "[0.1, 0.0, 0.2, -0.1] (2, 1) 0.125 1.5",
          "[0.1, 0.0, 0.2, 0.1] (3, 0) 0.25 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rounding_ok(reported, value, decimals):
    return abs(reported - value) <= 0.5 * 10**-decimals + 1e-9

def check_claims(claims, results):
    return sorted(k for k, (num, dec) in claims.items() if not rounding_ok(num, results[k], dec))

def relative_ok(claimed_pct, base, new, decimals):
    actual = 100 * ((1 - base) - (1 - new)) / (1 - base)   # relative error reduction in per cent
    return rounding_ok(claimed_pct, actual, decimals)

claims = {"acc": (74.0, 1), "gain": (2.1, 1)}; results = {"acc": 73.96, "gain": 2.04}
print(rounding_ok(74.0, 73.96, 1), rounding_ok(2.1, 2.04, 1), check_claims(claims, results), relative_ok(25, 0.8, 0.85, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False ['gain'] True",
          "True True [] True",
          "False False ['acc', 'gain'] True",
          "True False ['gain'] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>paired_diffs(a, b)</C>; <C>win_loss(a, b)</C>, the numbers of positive and negative differences;
          and <C>sign_test_p(wins, losses)</C>, the two-sided sign test p-value capped at 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def paired_diffs(a, b):
    return [sum(a) / len(a) - sum(b) / len(b)]

def win_loss(a, b):
    return len(a), 0

def sign_test_p(wins, losses):
    return 0.5 ** (wins + losses)
`,
        solution: PAIRED,
        tests: [
          { name: "wins", code: `assert paired_diffs([3, 1], [1, 2]) == [2, -1] and win_loss([1, 2, 3, 4], [0, 2, 5, 1]) == (2, 1)` },
          { name: "sign", code: `assert abs(sign_test_p(5, 0) - 0.0625) < 1e-12 and sign_test_p(2, 2) == 1.0 and abs(sign_test_p(1, 4) - 0.375) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Claims map names to (reported number, decimals). Write <C>rounding_ok(reported, value, decimals)</C>, allowing
          half a unit in the last place plus <M>{"10^{-9}"}</M>; <C>check_claims(claims, results)</C>, the sorted names
          of inconsistent claims; and <C>relative_ok(claimed_pct, base, new, decimals)</C> for a claimed relative error
          reduction in per cent, given accuracies as fractions.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rounding_ok(reported, value, decimals):
    return reported == value

def check_claims(claims, results):
    return []

def relative_ok(claimed_pct, base, new, decimals):
    return rounding_ok(claimed_pct, 100 * (new - base), decimals)
`,
        solution: AUDIT,
        tests: [
          { name: "round", code: `assert rounding_ok(3.1, 3.149, 1) and not rounding_ok(3.1, 3.16, 1) and rounding_ok(12, 12.4, 0) and check_claims({"b": (1.0, 0), "a": (5.5, 1)}, {"a": 5.7, "b": 1.2}) == ["a"]` },
          { name: "relative", code: `assert relative_ok(50, 0.9, 0.95, 0) and not relative_ok(5, 0.9, 0.95, 0) and relative_ok(33.3, 0.7, 0.8, 1)` },
        ],
      },
    },
    {
      key: "need",
      rung: "stretch",
      prompt: (
        <p>
          A method is compared with a baseline on 15 benchmarks with no ties. What is the smallest number of wins for which
          the two-sided sign test gives p ≤ 0.05?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course ends where research begins: with a question of your own, answered carefully enough that a sceptical
        reader is convinced. The habits practised here, reading critically, reproducing before extending, testing one
        idea honestly and writing for the reader, apply to every question you take up next.
      </p>
    </>
  ),
};
