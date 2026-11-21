import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VariantSearchViz } from "@/components/viz/VariantSearchViz";
import type { LessonContent } from "@/lib/types";

const ABLATE = `def ablation_drops(full, ablated):
    return {name: full - score for name, score in ablated.items()}   # what removing each component costs

def largest_drop(full, ablated):
    d = ablation_drops(full, ablated)
    return max(sorted(d), key=lambda n: d[n])

def factorial(y):
    a = ((y[1, 0] - y[0, 0]) + (y[1, 1] - y[0, 1])) / 2    # main effect of A, averaged over B
    b = ((y[0, 1] - y[0, 0]) + (y[1, 1] - y[1, 0])) / 2
    ab = (y[1, 1] - y[0, 1]) - (y[1, 0] - y[0, 0])        # how much A's effect depends on B
    return a, b, ab`;

const MULTI = `def family_error(k, alpha):
    return 1 - (1 - alpha) ** k                            # chance of at least one false positive in k tests

def bonferroni(pvals, alpha):
    return [i for i, p in enumerate(pvals) if p <= alpha / len(pvals)]

def holm(pvals, alpha):
    m, out = len(pvals), []
    for rank, i in enumerate(sorted(range(m), key=lambda j: pvals[j])):
        if pvals[i] > alpha / (m - rank):
            break                                          # stop at the first that fails
        out.append(i)
    return sorted(out)`;

export const lesson: LessonContent = {
  id: "l15.4.3",
  minutes: 50,
  links: {
    requires: ["l15.4.2", "l8.2.4"],
    revisits: ["l15.2.2", "l15.1.1"],
    foreshadows: ["l15.4.4"],
  },

  puzzle: (
    <>
      <p>
        The third part of the thesis adds one new idea to the reproduced baseline. You try twelve versions of it. One
        beats the baseline by a margin that would be significant on its own, and it also uses a second trick you added
        along the way. Is the gain real? And is it the idea that made the difference, or the trick, or the two together?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        One new idea, tested honestly, is worth more than several tested loosely. Honesty here has two parts. First,
        attribution: to say the idea caused the gain, compare runs that differ only in the idea, and when there are two
        changes, run all four combinations, because the effect of one can depend on the other. Second, selection: trying
        many variants and reporting the best turns noise into apparent gains, so the significance threshold must
        account for how many were tried, and the final comparison should be rerun on fresh seeds.
      </p>
      <VariantSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ablations">
        <p>
          An ablation removes one component from the full system and measures the drop (<C>ablation_drops</C>); the
          component with the largest drop matters most in that context (<C>largest_drop</C>). With two components A and
          B, a 2 × 2 factorial design runs all four combinations, giving the main effect of each, averaged over the other,
          and their interaction, how much the effect of A changes when B is present (<C>factorial</C>). l8.2.4 discussed
          ablating architecture choices; the same logic applies to any new idea.
        </p>
        <Code>{ABLATE}</Code>
      </Definition>

      <Theorem title="ablation drops add up only without interaction">
        <p>
          Let <M>{"y_{ab}"}</M> be the score with A on when a = 1 and B on when b = 1. The drops from removing each
          component from the full system sum to the total improvement over the baseline exactly when the interaction{" "}
          <M>{"(y_{11} - y_{01}) - (y_{10} - y_{00})"}</M> is zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          The drops are <M>{"y_{11} - y_{01}"}</M> for A and <M>{"y_{11} - y_{10}"}</M> for B, and the total improvement
          is <M>{"y_{11} - y_{00}"}</M>. Their difference is{" "}
          <M>{"(y_{11} - y_{01}) + (y_{11} - y_{10}) - (y_{11} - y_{00}) = y_{11} - y_{01} - y_{10} + y_{00}"}</M>,
          which is the interaction. With a positive interaction the drops overstate the parts, and each component can
          look essential although neither helps much alone; only the full factorial reveals this.
        </p>
      </Proof>

      <Theorem title="correcting for many tries">
        <p>
          If k independent tests of true null hypotheses each use level α, at least one false positive occurs with
          probability <M>{"1 - (1-\\alpha)^k"}</M> (<C>family_error</C>). Rejecting only p-values at most α/k
          (Bonferroni, <C>bonferroni</C>) keeps the probability of any false rejection at most α, whatever the
          dependence between tests. Holm&apos;s procedure, which compares the j-th smallest p-value with{" "}
          <M>{"\\alpha/(k - j + 1)"}</M> and stops at the first failure (<C>holm</C>), has the same guarantee and rejects at
          least as much.
        </p>
        <Code>{MULTI}</Code>
      </Theorem>
      <Proof>
        <p>
          Independence gives the first formula. For Bonferroni, the union bound gives P(some true null has{" "}
          <M>{"p \\le \\alpha/k"}</M>) <M>{"\\le k \\cdot \\alpha/k = \\alpha"}</M>, using only that each null p-value
          is uniform or conservative. For Holm, let <M>{"k_0"}</M> nulls be true and consider the first of them rejected.
          Before it, at most <M>{"k - k_0"}</M> hypotheses were rejected, so it was compared with a threshold at most{" "}
          <M>{"\\alpha/k_0"}</M>. A false rejection therefore requires some true null to have{" "}
          <M>{"p \\le \\alpha/k_0"}</M>, which by the union bound over the <M>{"k_0"}</M> true nulls has probability at
          most α. Holm&apos;s thresholds are never smaller than α/k, so it rejects everything Bonferroni does.
        </p>
      </Proof>

      <Example title="the puzzle's twelve versions">
        <p>
          With twelve tries at the 5% level, the chance that some version looks significant by luck alone is nearly one
          in two. The remedy is to pick the version on validation runs, then confirm it once, on fresh seeds and the
          held-out test set, as a single pre-declared comparison. To separate the idea from the trick, run the 2 × 2
          design: baseline, idea only, trick only, and both.
        </p>
      </Example>

      <Remark title="the extension deliverable">
        <p>
          State the idea and why it should help before running it, as the proposal required. Report the factorial or
          ablation table with seeds and intervals, the number of variants tried, and the correction used. Include a
          negative or partial result honestly: an idea that helps only with the trick, or only at small scale, is a
          finding. The analysis of where the idea fails belongs in the limitations section of the final paper.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "main",
      rung: "check",
      prompt: (
        <p>
          A 2 × 2 experiment gives 70.0 for the baseline, 72.5 with the idea only, 71.0 with the trick only and 74.0 with
          both. What is the main effect of the idea, averaged over the trick?
        </p>
      ),
      answer: { kind: "numeric", value: 2.75, tolerance: 0.001 },
    },
    {
      key: "family",
      rung: "check",
      prompt: (
        <p>
          Twelve variants, none truly better, are each tested at the 5% level independently. What is the chance that at
          least one appears significant? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4596, tolerance: 0.0005 },
    },
    {
      key: "design",
      rung: "apply",
      prompt: <p>The best variant uses both your idea and a trick. Which experiment shows how much the idea alone contributes?</p>,
      answer: {
        kind: "choice",
        options: [
          "Running all four combinations of idea and trick, with several seeds each",
          "Removing the trick from the best variant only",
          "Running the best variant with more seeds",
          "Comparing the best variant with the published baseline number",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ablation_drops(full, ablated):
    return {name: full - score for name, score in ablated.items()}   # what removing each component costs

def largest_drop(full, ablated):
    d = ablation_drops(full, ablated)
    return max(sorted(d), key=lambda n: d[n])

def factorial(y):
    a = ((y[1, 0] - y[0, 0]) + (y[1, 1] - y[0, 1])) / 2    # main effect of A, averaged over B
    b = ((y[0, 1] - y[0, 0]) + (y[1, 1] - y[1, 0])) / 2
    ab = (y[1, 1] - y[0, 1]) - (y[1, 0] - y[0, 0])        # how much A's effect depends on B
    return a, b, ab

y = {(0, 0): 10, (1, 0): 14, (0, 1): 11, (1, 1): 17}
print(factorial(y), ablation_drops(17, {"a": 11, "b": 14}), largest_drop(17, {"a": 11, "b": 14}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(5.0, 2.0, 2) {'a': 6, 'b': 3} a",
          "(4.0, 1.0, 2) {'a': 6, 'b': 3} a",
          "(5.0, 2.0, 2) {'a': 3, 'b': 6} b",
          "(5.0, 2.0, -2) {'a': 6, 'b': 3} a",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def family_error(k, alpha):
    return 1 - (1 - alpha) ** k                            # chance of at least one false positive in k tests

def bonferroni(pvals, alpha):
    return [i for i, p in enumerate(pvals) if p <= alpha / len(pvals)]

def holm(pvals, alpha):
    m, out = len(pvals), []
    for rank, i in enumerate(sorted(range(m), key=lambda j: pvals[j])):
        if pvals[i] > alpha / (m - rank):
            break                                          # stop at the first that fails
        out.append(i)
    return sorted(out)

ps = [0.01, 0.02, 0.04]
print(round(family_error(3, 0.05), 6), bonferroni(ps, 0.05), holm(ps, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.142625 [0] [0, 1, 2]",
          "0.15 [0] [0, 1, 2]",
          "0.142625 [0, 1] [0, 1, 2]",
          "0.142625 [0] [0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ablation_drops(full, ablated)</C>; <C>largest_drop(full, ablated)</C>, the name with the largest drop,
          alphabetically first on ties; and <C>factorial(y)</C>, returning the main effects of A and B and their
          interaction from a dict keyed by (a, b).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ablation_drops(full, ablated):
    return dict(ablated)

def largest_drop(full, ablated):
    return min(ablated, key=lambda n: ablated[n])

def factorial(y):
    return y[1, 0] - y[0, 0], y[0, 1] - y[0, 0], 0
`,
        solution: ABLATE,
        tests: [
          { name: "drops", code: `assert ablation_drops(10, {"x": 7, "y": 9}) == {"x": 3, "y": 1} and largest_drop(10, {"y": 8, "x": 8}) == "x"` },
          { name: "factorial", code: `assert factorial({(0, 0): 0, (1, 0): 2, (0, 1): 4, (1, 1): 10}) == (4.0, 6.0, 4) and factorial({(0, 0): 1, (1, 0): 3, (0, 1): 2, (1, 1): 4}) == (2.0, 1.0, 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>family_error(k, alpha)</C>; <C>bonferroni(pvals, alpha)</C>, the indices of rejected hypotheses; and{" "}
          <C>holm(pvals, alpha)</C>, the rejected indices in increasing order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def family_error(k, alpha):
    return alpha

def bonferroni(pvals, alpha):
    return [i for i, p in enumerate(pvals) if p <= alpha]

def holm(pvals, alpha):
    return bonferroni(pvals, alpha)
`,
        solution: MULTI,
        tests: [
          { name: "bonf", code: `assert abs(family_error(2, 0.5) - 0.75) < 1e-12 and bonferroni([0.02, 0.03, 0.5], 0.06) == [0] and bonferroni([], 0.05) == []` },
          { name: "holm", code: `assert holm([0.03, 0.01, 0.04], 0.05) == [1] and holm([0.04, 0.01, 0.02], 0.06) == [0, 1, 2] and holm([0.5, 0.001], 0.05) == [1]` },
        ],
      },
    },
    {
      key: "holmcount",
      rung: "stretch",
      prompt: (
        <p>
          Five variants give p-values 0.001, 0.012, 0.02, 0.04 and 0.3. How many hypotheses does Holm&apos;s procedure
          reject at α = 0.05?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The proposal, the reproduction and the extension now become one paper. The final lesson is writing it and
        defending it against the hardest questions Parton can ask.
      </p>
    </>
  ),
};
