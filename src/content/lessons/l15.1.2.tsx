import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReproVerdictViz } from "@/components/viz/ReproVerdictViz";
import type { LessonContent } from "@/lib/types";

const VERDICT = `import math

def welch_se(sd1, n1, sd2, n2):
    return math.sqrt(sd1**2 / n1 + sd2**2 / n2)            # standard error of a difference of two means

def reproduces(mine, reported, se, margin, z=1.645):
    return abs(mine - reported) + z * se < margin          # both one-sided tests reject: within the margin

def verdict(mine, reported, se, margin, z=1.645, z2=1.96):
    if reproduces(mine, reported, se, margin, z):
        return "reproduced"
    if abs(mine - reported) > z2 * se:
        return "different"
    return "inconclusive"                                  # too noisy to say either way`;

const BUDGET = `import math

def tokens_seen(batch, seq, steps):
    return batch * seq * steps

def accum_steps(target_batch, micro_batch, devices):
    per_step = micro_batch * devices
    if target_batch % per_step:
        raise ValueError("batch does not divide evenly")
    return target_batch // per_step                        # micro-batches accumulated per optimiser step

def rescale(lr, steps, old_batch, new_batch, rule="sqrt"):
    ratio = new_batch / old_batch
    factor = ratio if rule == "linear" else math.sqrt(ratio)
    return lr * factor, steps * old_batch // new_batch     # same number of tokens`;

export const lesson: LessonContent = {
  id: "l15.1.2",
  minutes: 45,
  links: {
    requires: ["l15.1.1", "l8.5.2"],
    revisits: ["l8.6.1"],
    foreshadows: ["l15.4.2"],
  },

  puzzle: (
    <>
      <p>
        A paper reports 76.2 on a benchmark. You follow its recipe on smaller hardware, adjust the batch size to fit, run
        five seeds, and get 75.6. Have you reproduced the result? You did not get the same number, but nobody ever does.
        And if you had got 76.3 from a single noisy run, would that have been a success?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Reproducing a result means showing that your number is close to the reported one, and &quot;close&quot; must be
        decided before you look: a margin within which the difference would not matter. A usual test for a difference
        asks the wrong question, because a noisy run that is far from the reported value can still fail to be
        &quot;significantly different&quot;. The right test asks whether the uncertainty interval around your difference
        lies inside the margin. The other half of reproduction is engineering: matching what the original run actually
        did, including the number of tokens it saw and how its batch size and learning rate fit together.
      </p>
      <ReproVerdictViz />
    </>
  ),

  theory: (
    <>
      <Definition title="kinds of reproduction">
        <p>
          A replication reruns the same code and data; a reproduction reimplements the method from the paper; a
          generalisation tests whether the conclusion holds on new data or at a new scale. Each catches different
          failures. Joelle Pineau and colleagues introduced the NeurIPS reproducibility checklist in 2019, and the ML
          Reproducibility Challenge has since asked students to reproduce published papers. The usual sources of
          discrepancy are undocumented hyperparameters, data preprocessing, evaluation details such as the prompt format or
          answer extraction, and differences in the number of tokens or steps. A good order of work is to evaluate a
          released checkpoint first, which isolates the evaluation, and train only once that matches.
        </p>
      </Definition>

      <Theorem title="testing for equivalence">
        <p>
          Let d be your result minus the reported one, with standard error se (for two independent means,{" "}
          <M>{"\\sqrt{\\sigma_1^2/n_1 + \\sigma_2^2/n_2}"}</M>, <C>welch_se</C>), and let m be the margin. The two
          one-sided tests reject both <M>{"\\delta \\le -m"}</M> and <M>{"\\delta \\ge m"}</M> at level α exactly when
        </p>
        <MD>{"|d| + z_{1-\\alpha}\\,\\mathrm{se} < m,"}</MD>
        <p>
          that is, when the <M>{"1 - 2\\alpha"}</M> confidence interval for the true difference δ lies inside{" "}
          <M>{"(-m, m)"}</M> (<C>reproduces</C>). If the result is not equivalent but the gap exceeds 1.96 standard errors,
          it is different; otherwise the experiment is inconclusive (<C>verdict</C>).
        </p>
        <Code>{VERDICT}</Code>
      </Theorem>
      <Proof>
        <p>
          With d approximately normal around δ, the first test rejects <M>{"\\delta \\le -m"}</M> when{" "}
          <M>{"(d + m)/\\mathrm{se} > z"}</M> and the second rejects <M>{"\\delta \\ge m"}</M> when{" "}
          <M>{"(m - d)/\\mathrm{se} > z"}</M>, with <M>{"z = z_{1-\\alpha}"}</M>. Both hold iff{" "}
          <M>{"m > d + z\\,\\mathrm{se}"}</M> and <M>{"m > -d + z\\,\\mathrm{se}"}</M>, that is{" "}
          <M>{"m > |d| + z\\,\\mathrm{se}"}</M>, which says the interval <M>{"d \\pm z\\,\\mathrm{se}"}</M> lies inside{" "}
          <M>{"(-m, m)"}</M>. If in truth <M>{"|\\delta| \\ge m"}</M>, one of the two null hypotheses is true, and the
          test of that one rejects with probability at most α, so declaring equivalence has probability at most α. A
          noisy result can never pass, since a large se alone breaks the inequality.
        </p>
      </Proof>

      <Example title="the puzzle">
        <p>
          Suppose a margin of one point was agreed in advance, and your five seeds give a standard error of 0.25 for the
          difference. Then <M>{"|d| + 1.645 \\times 0.25 = 0.6 + 0.41 = 1.01"}</M>, just above the margin: the
          reproduction is not established, but the gap of 0.6 is also only 2.4 standard errors, so a few more seeds may
          settle it. A single run at 76.3 would have a standard error near the full seed deviation and would usually be
          inconclusive, however close its number.
        </p>
      </Example>

      <Theorem title="matching the original run">
        <p>
          Accumulating the gradients of k micro-batches of b examples and dividing by k gives exactly the mean gradient
          of one batch of kb examples, when every loss is a mean over the same number of terms; with micro-batches split
          across devices, k is the target batch divided by the micro-batch size times the number of devices{" "}
          (<C>accum_steps</C>). If instead the batch must change, keep the number of tokens fixed (<C>tokens_seen</C>) by
          scaling the steps inversely, and scale the learning rate with the batch, linearly for SGD and roughly with its
          square root for Adam (<C>rescale</C>), as in l8.5.2.
        </p>
        <Code>{BUDGET}</Code>
      </Theorem>
      <Proof>
        <p>
          If micro-batch i has gradient <M>{"g_i = \\frac{1}{b}\\sum_{j \\in B_i} \\nabla \\ell_j"}</M>, then{" "}
          <M>{"\\frac{1}{k}\\sum_i g_i = \\frac{1}{kb}\\sum_{j \\in \\cup B_i} \\nabla \\ell_j"}</M>, the mean over the
          union. When micro-batch i holds <M>{"n_i"}</M> tokens and the loss is a per-token mean, the average of the
          per-micro-batch means is <M>{"\\frac{1}{k}\\sum_i L_i/n_i"}</M>, while the full-batch mean is{" "}
          <M>{"\\sum_i L_i / \\sum_i n_i"}</M>; they agree when all <M>{"n_i"}</M> are equal but not in general, so with
          variable-length sequences the sums must be divided by the total token count. This mismatch was found in several
          popular training libraries in 2024, a reminder that a reproduction can differ for reasons no paper would list.
        </p>
      </Proof>

      <Remark title="what to write down">
        <p>
          A reproduction is itself a result. Record the margin you chose and why, every deviation from the paper, the
          seeds, the hardware and library versions, and the loss curves, which l8.6.1 showed carry more information than
          the final number. When a reproduction fails, the most useful report says which part failed: the evaluation of
          the released checkpoint, the training, or the claim itself.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "margin",
      rung: "check",
      prompt: (
        <p>
          A paper reports 76.2 and your reproduction gives 75.6, with a standard error of 0.25 for the difference. Using z =
          1.645, what is the smallest margin for which the two one-sided tests would declare the result reproduced? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.011, tolerance: 0.001 },
    },
    {
      key: "se",
      rung: "check",
      prompt: (
        <p>
          Your five seeds have a standard deviation of 0.5; the paper&apos;s three seeds have 0.8. What is the standard error
          of the difference between the two means? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5132, tolerance: 0.0005 },
    },
    {
      key: "noisy",
      rung: "apply",
      prompt: (
        <p>
          A single noisy run lands 0.1 away from the reported number. Why does this not establish that the result was
          reproduced?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Its standard error is large, so the interval for the true difference extends beyond any reasonable margin",
          "A single run can never be compared with a mean",
          "Results must match to every decimal place",
          "Being close to the reported number shows that the reproduction copied the original code",
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

def welch_se(sd1, n1, sd2, n2):
    return math.sqrt(sd1**2 / n1 + sd2**2 / n2)            # standard error of a difference of two means

def reproduces(mine, reported, se, margin, z=1.645):
    return abs(mine - reported) + z * se < margin          # both one-sided tests reject: within the margin

def verdict(mine, reported, se, margin, z=1.645, z2=1.96):
    if reproduces(mine, reported, se, margin, z):
        return "reproduced"
    if abs(mine - reported) > z2 * se:
        return "different"
    return "inconclusive"                                  # too noisy to say either way

print(round(welch_se(1.0, 4, 1.0, 4), 4), reproduces(10.2, 10.0, 0.1, 0.5), reproduces(10.4, 10.0, 0.1, 0.5))
print(verdict(10.2, 10.0, 0.1, 0.5), verdict(11.0, 10.0, 0.1, 0.5), verdict(10.3, 10.0, 0.3, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.7071 True False\nreproduced different inconclusive",
          "0.7071 True False\nreproduced different different",
          "0.5 True False\nreproduced different inconclusive",
          "0.7071 True True\nreproduced inconclusive inconclusive",
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

def tokens_seen(batch, seq, steps):
    return batch * seq * steps

def accum_steps(target_batch, micro_batch, devices):
    per_step = micro_batch * devices
    if target_batch % per_step:
        raise ValueError("batch does not divide evenly")
    return target_batch // per_step                        # micro-batches accumulated per optimiser step

def rescale(lr, steps, old_batch, new_batch, rule="sqrt"):
    ratio = new_batch / old_batch
    factor = ratio if rule == "linear" else math.sqrt(ratio)
    return lr * factor, steps * old_batch // new_batch     # same number of tokens

print(tokens_seen(8, 1024, 100), accum_steps(256, 8, 4))
print(rescale(0.001, 1000, 256, 64, "linear"), rescale(0.001, 1000, 256, 64))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "819200 8\n(0.00025, 4000) (0.0005, 4000)",
          "819200 32\n(0.00025, 4000) (0.0005, 4000)",
          "819200 8\n(0.004, 250) (0.002, 250)",
          "819200 8\n(0.0005, 4000) (0.00025, 4000)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>welch_se(sd1, n1, sd2, n2)</C>, <C>reproduces(mine, reported, se, margin, z=1.645)</C> and{" "}
          <C>verdict(mine, reported, se, margin, z=1.645, z2=1.96)</C>, returning &quot;reproduced&quot;,
          &quot;different&quot; or &quot;inconclusive&quot;, checking equivalence first.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def welch_se(sd1, n1, sd2, n2):
    return sd1 + sd2

def reproduces(mine, reported, se, margin, z=1.645):
    return abs(mine - reported) < margin

def verdict(mine, reported, se, margin, z=1.645, z2=1.96):
    return "reproduced"
`,
        solution: VERDICT,
        tests: [
          { name: "tost", code: `assert abs(welch_se(3, 9, 4, 4) - math.sqrt(5)) < 1e-12 and reproduces(1, 0, 0.1, 1.2) and not reproduces(1, 0, 0.2, 1.2) and not reproduces(0, 0, 1, 1.5)` },
          { name: "verdict", code: `assert verdict(0, 0, 1, 1.5) == "inconclusive" and verdict(5, 0, 1, 1) == "different" and verdict(0.5, 0, 0.01, 1) == "reproduced" and verdict(-0.5, 0, 0.01, 1) == "reproduced"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tokens_seen(batch, seq, steps)</C>; <C>accum_steps(target_batch, micro_batch, devices)</C>, raising
          ValueError when the batch does not divide evenly; and{" "}
          <C>rescale(lr, steps, old_batch, new_batch, rule=&quot;sqrt&quot;)</C>, returning the new learning rate and the
          number of steps that keeps the tokens fixed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def tokens_seen(batch, seq, steps):
    return batch * steps

def accum_steps(target_batch, micro_batch, devices):
    return target_batch // micro_batch

def rescale(lr, steps, old_batch, new_batch, rule="sqrt"):
    return lr, steps
`,
        solution: BUDGET,
        tests: [
          { name: "accum", code: `assert tokens_seen(2, 3, 4) == 24 and accum_steps(512, 16, 8) == 4\ntry:\n    accum_steps(100, 16, 2)\n    assert False\nexcept ValueError:\n    pass` },
          { name: "rescale", code: `lr, s = rescale(0.4, 100, 64, 256)\nassert abs(lr - 0.8) < 1e-12 and s == 25\nlr, s = rescale(0.4, 100, 64, 16, "linear")\nassert abs(lr - 0.1) < 1e-12 and s == 400` },
        ],
      },
    },
    {
      key: "seeds",
      rung: "stretch",
      prompt: (
        <p>
          You and the original authors each run n seeds, with a seed standard deviation of 0.6 on both sides, and the
          true difference is zero, so you expect d near 0. With z = 1.645 and a margin of 0.5, what is the smallest n for
          which <M>{"0 + z\\,\\mathrm{se} < m"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Reading and reproducing single papers builds depth. The next lesson builds breadth: how to map a whole subfield,
        find its central papers and see where its open questions lie.
      </p>
    </>
  ),
};
