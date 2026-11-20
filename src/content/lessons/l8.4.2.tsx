import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KaplanCurvesViz } from "@/components/viz/KaplanCurvesViz";
import type { LessonContent } from "@/lib/types";

const LAWS = `NC, DC, AN, AD = 8.8e13, 5.4e13, 0.076, 0.095

def kaplan_loss_N(N):
    return (NC / N) ** AN

def kaplan_loss_D(D):
    return (DC / D) ** AD

def kaplan_loss_ND(N, D):
    return ((NC / N) ** (AN / AD) + DC / D) ** AD`;

const ALLOC = `def tokens_for(C, N):
    return C / (6 * N)

def scale_allocation(C1, C2, N1, a):
    N2 = N1 * (C2 / C1) ** a
    return N2, tokens_for(C2, N2)

def tokens_per_param(N, D):
    return D / N`;

export const lesson: LessonContent = {
  id: "l8.4.2",
  minutes: 50,
  links: {
    requires: ["l8.4.1", "l5.3.3"],
    revisits: ["m17.5.2", "m14.4.2"],
    foreshadows: ["l8.4.3", "l8.5.2"],
  },

  puzzle: (
    <>
      <p>
        In 2020 Kaplan and colleagues trained hundreds of language models across seven orders of magnitude of compute and
        found that loss followed smooth power laws in parameters, data and compute, with almost nothing else mattering. From
        those laws they concluded that a bigger budget should go mostly into a bigger model trained on relatively few tokens.
        GPT-3 was built that way: 175 billion parameters, 300 billion tokens. Two years later the conclusion was reversed. What
        did the laws say, and where did the advice go wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If a larger model learns more from each token, then for a fixed number of tokens it ends up with lower loss, and the
        laws said this advantage was large: a model ten times bigger needed far fewer than ten times the data to make use of
        its size. Followed through, the cheapest way to reach a target loss was a very large model stopped early. The curves
        themselves were well measured; the allocation depended on how the runs of different lengths were trained, and that is
        where a hidden bias entered.
      </p>
      <KaplanCurvesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the Kaplan laws">
        <p>
          With N the number of non-embedding parameters and D the number of training tokens, and the other factor not limiting,
        </p>
        <MD>{"L(N) = \\left(\\frac{N_c}{N}\\right)^{\\alpha_N}, \\qquad L(D) = \\left(\\frac{D_c}{D}\\right)^{\\alpha_D}"}</MD>
        <p>
          with <M>{"\\alpha_N \\approx 0.076"}</M>, <M>{"N_c \\approx 8.8 \\times 10^{13}"}</M>, <M>{"\\alpha_D \\approx 0.095"}</M>, <M>{"D_c \\approx 5.4 \\times 10^{13}"}</M>{" "}
          (<C>kaplan_loss_N</C>, <C>kaplan_loss_D</C>). Jointly,
        </p>
        <MD>{"L(N, D) = \\left[\\left(\\frac{N_c}{N}\\right)^{\\alpha_N/\\alpha_D} + \\frac{D_c}{D}\\right]^{\\alpha_D}"}</MD>
        <p>
          (<C>kaplan_loss_ND</C>), which reduces to each single law when the other variable is unlimited. There is no constant term:
          these fits did not include an irreducible loss.
        </p>
        <Code>{LAWS}</Code>
      </Definition>

      <Theorem title="the joint law dominates both single laws">
        <p>
          For all N and D, <M>{"L(N, D) \\ge \\max\\{L(N), L(D)\\}"}</M>, and <M>{"L(N, D) \\to L(N)"}</M> as <M>{"D \\to \\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Both terms inside the bracket are positive and <M>{"t \\mapsto t^{\\alpha_D}"}</M> is increasing, so the bracket raised to{" "}
          <M>{"\\alpha_D"}</M> is at least either term raised to <M>{"\\alpha_D"}</M>. The first gives{" "}
          <M>{"((N_c/N)^{\\alpha_N/\\alpha_D})^{\\alpha_D} = L(N)"}</M>, the second <M>{"L(D)"}</M>. As D grows, <M>{"D_c/D \\to 0"}</M> and the bracket tends to its first
          term.
        </p>
      </Proof>

      <Definition title="the compute-efficient allocation">
        <p>
          With training compute <M>{"C \\approx 6ND"}</M> (<C>tokens_for</C>), Kaplan and colleagues found the compute-efficient frontier at{" "}
          <M>{"N \\propto C^{0.73}"}</M> and <M>{"D \\propto C^{0.27}"}</M>: a hundredfold budget buys a model about 29 times larger trained on
          about 3.5 times more tokens (<C>scale_allocation</C>). Tokens per parameter therefore fall as compute grows
          (<C>tokens_per_param</C>), and at the frontier models stop well short of convergence.
        </p>
        <Code>{ALLOC}</Code>
      </Definition>

      <Remark title="why the allocation was wrong">
        <p>
          The laws were fitted to runs that all used the same learning-rate schedule length, so a run stopped at a small number
          of tokens was evaluated before its cosine schedule had decayed. Short runs therefore looked worse than they would with a
          schedule matched to their length, which inflated the apparent value of large models trained briefly. Later analyses
          added further causes: counting only non-embedding parameters, which matters at small scale; ignoring the cost of the
          output layer in compute; and optimiser settings, warmup and AdamW&apos;s second-moment decay, not adapted to small
          models and batches. Correcting these moves the exponents close to 0.5 for both N and D, the Chinchilla result of the
          next lesson.
        </p>
      </Remark>

      <Example title="what survived">
        <p>
          The power-law form itself, the near-irrelevance of shape at fixed parameter count, the smooth dependence on
          compute, and the use of small runs to predict large ones all held up. So did the critical-batch-size results, which
          return in l8.5.2. What changed was one exponent pair, and with it the size of every model trained since.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ln",
      rung: "check",
      prompt: <p>Under Kaplan&apos;s L(N), what is the loss of a model with 3 × 10⁹ non-embedding parameters trained to convergence? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.1853, tolerance: 0.0002 },
    },
    {
      key: "dfac",
      rung: "check",
      prompt: <p>With D ∝ C^0.27, by what factor do the training tokens grow when compute grows a hundredfold? Give three decimals.</p>,
      answer: { kind: "numeric", value: 3.467, tolerance: 0.001 },
    },
    {
      key: "sched",
      rung: "apply",
      prompt: <p>How did a fixed learning-rate schedule length bias the Kaplan allocation towards large models?</p>,
      answer: {
        kind: "choice",
        options: [
          "Runs stopped early had not finished decaying their learning rate, so short runs looked worse than they should, overstating the benefit of training large models on few tokens",
          "A fixed schedule made large models diverge, so they were under-represented",
          "It caused the embedding parameters to be counted twice",
          "It made all runs converge to the same loss regardless of size",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`NC, DC, AN, AD = 8.8e13, 5.4e13, 0.076, 0.095

def kaplan_loss_N(N):
    return (NC / N) ** AN

def kaplan_loss_D(D):
    return (DC / D) ** AD

def kaplan_loss_ND(N, D):
    return ((NC / N) ** (AN / AD) + DC / D) ** AD

print(round(kaplan_loss_N(NC), 4), round(kaplan_loss_D(DC / 2 ** (1 / AD)), 4), round(kaplan_loss_ND(NC, 1e40), 4))
print(kaplan_loss_ND(1e9, 1e10) > max(kaplan_loss_N(1e9), kaplan_loss_D(1e10)), round(kaplan_loss_ND(1e30, 5.4e13), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 2.0 1.0\nTrue 1.0",
          "1.0 0.5 1.0\nTrue 1.0",
          "1.0 2.0 0.0\nTrue 1.0",
          "1.0 2.0 1.0\nFalse 2.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tokens_for(C, N):
    return C / (6 * N)

def scale_allocation(C1, C2, N1, a):
    N2 = N1 * (C2 / C1) ** a
    return N2, tokens_for(C2, N2)

def tokens_per_param(N, D):
    return D / N

print(tokens_for(6e20, 1e9), scale_allocation(1.0, 16.0, 100.0, 0.5))
print(tokens_per_param(*scale_allocation(6e20, 6e22, 1e9, 0.73)) < tokens_per_param(1e9, tokens_for(6e20, 1e9)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "100000000000.0 (400.0, 0.006666666666666667)\nTrue",
          "600000000000.0 (400.0, 0.006666666666666667)\nTrue",
          "100000000000.0 (1600.0, 0.0016666666666666668)\nTrue",
          "100000000000.0 (400.0, 0.006666666666666667)\nFalse",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kaplan_loss_N(N)</C>, <C>kaplan_loss_D(D)</C> and <C>kaplan_loss_ND(N, D)</C> using the constants NC, DC, AN and AD.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `NC, DC, AN, AD = 8.8e13, 5.4e13, 0.076, 0.095

def kaplan_loss_N(N):
    return (N / NC) ** AN

def kaplan_loss_D(D):
    return (D / DC) ** AD

def kaplan_loss_ND(N, D):
    return kaplan_loss_N(N) + kaplan_loss_D(D)
`,
        solution: LAWS,
        tests: [
          { name: "single", code: `assert abs(kaplan_loss_N(1e9) - 88000 ** 0.076) < 1e-12 and abs(kaplan_loss_D(5.4e11) - 100 ** 0.095) < 1e-12` },
          { name: "joint", code: `assert abs(kaplan_loss_ND(1e8, 2e10) - 2.8424404452) < 1e-9 and abs(kaplan_loss_ND(1e9, 1e40) - kaplan_loss_N(1e9)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tokens_for(C, N)</C> using C = 6ND, <C>scale_allocation(C1, C2, N1, a)</C>, returning the model size and tokens at budget C2
          when N grows like <M>{"C^a"}</M> from N1 at C1, and <C>tokens_per_param(N, D)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tokens_for(C, N):
    return C / N

def scale_allocation(C1, C2, N1, a):
    N2 = N1 * (C2 / C1)
    return N2, tokens_for(C2, N2)

def tokens_per_param(N, D):
    return N / D
`,
        solution: ALLOC,
        tests: [
          { name: "tokens", code: `assert tokens_for(1.2e21, 1e10) == 2e10 and tokens_per_param(1e9, 2e10) == 20` },
          { name: "scale", code: `N2, D2 = scale_allocation(1e21, 1e23, 2e9, 0.73)\nassert abs(N2 / 2e9 - 100 ** 0.73) < 1e-9 and abs(6 * N2 * D2 - 1e23) < 1e9` },
        ],
      },
    },
    {
      key: "joint",
      rung: "stretch",
      prompt: <p>Under the joint Kaplan law, what is the loss of a 10⁹-parameter model trained on 10¹⁰ tokens? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.4838, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        The next lesson redoes the allocation with schedules matched to every run length and finds that parameters and
        tokens should grow together, about twenty tokens per parameter.
      </p>
    </>
  ),
};
