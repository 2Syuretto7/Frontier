import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeightDiffViz } from "@/components/viz/WeightDiffViz";
import type { LessonContent } from "@/lib/types";

const WEIGHTS = `import math

def relative_change(W0, W1):
    num = sum((b - a) ** 2 for r0, r1 in zip(W0, W1) for a, b in zip(r0, r1))
    return math.sqrt(num / sum(a * a for r in W0 for a in r))

def top_share(svals):
    return max(svals) ** 2 / sum(s * s for s in svals)

def rank_for(svals, frac):
    sq = sorted((s * s for s in svals), reverse=True)
    total, acc = sum(sq), 0.0
    for k, v in enumerate(sq, 1):
        acc += v
        if acc >= frac * total - 1e-12:
            return k`;

const ACTS = `def act_diff(ha, hb):
    n = len(ha)
    return [sum(b[j] - a[j] for a, b in zip(ha, hb)) / n for j in range(len(ha[0]))]

def latent_scale(f, d, x):
    dd = sum(t * t for t in d)
    return sum(fi * sum(a * b for a, b in zip(d, xi)) for fi, xi in zip(f, x)) / (dd * sum(fi * fi for fi in f))

def verdict(beta_base, beta_chat, ratio):
    return "chat-specific" if beta_base < ratio * beta_chat else "shared"`;

export const lesson: LessonContent = {
  id: "l11.6.3",
  minutes: 50,
  links: {
    requires: ["l11.4.2", "l11.6.2"],
    revisits: ["m3.8.3", "l11.1.3"],
    foreshadows: ["l11.6.4"],
  },

  puzzle: (
    <>
      <p>
        A model is fine-tuned on a narrow task, and its weights move by a third of their norm. A colleague runs the same procedure on the
        original training data instead and the weights move by about as much. The size of the change cannot tell the two apart. What
        can, and how would you find out what the fine-tuning taught without knowing the task in advance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Model diffing compares a model with its parent to find what changed. Every training run moves weights, so the question is never
        whether something changed but whether the change has structure that a control run lacks. A narrow behaviour tends to leave a
        concentrated change: a few directions in weight space, a consistent shift in activations, a handful of features that are new or
        gone. Diffing looks for that structure at the level of weights, of activations on shared inputs, and of features.
      </p>
      <WeightDiffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="diffing weights">
        <p>
          For a weight matrix, compare <M>{"\\Delta W = W_1 - W_0"}</M> with a control. Its relative size (<C>relative_change</C>) mostly
          reflects the learning rate and the number of steps. Its singular values (m3.8.3) show whether the change is concentrated: the
          share of squared norm in the top direction (<C>top_share</C>) and the number of directions needed for a given share{" "}
          (<C>rank_for</C>). The right singular vectors of a concentrated change are the input patterns the new behaviour reads, and the
          left ones are what it writes.
        </p>
        <Code>{WEIGHTS}</Code>
      </Definition>

      <Theorem title="what an average activation difference sees">
        <p>
          Let a layer change by <M>{"\\Delta W"}</M> and let its inputs have mean m and covariance C. The change in output,{" "}
          <M>{"\\delta = \\Delta W x"}</M>, has mean <M>{"\\Delta W m"}</M> and mean square{" "}
          <M>{"\\mathbb{E}|\\delta|^2 = |\\Delta W m|^2 + \\operatorname{tr}(\\Delta W C \\Delta W^\\top)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mean follows from linearity. Write <M>{"x = m + z"}</M> with <M>{"\\mathbb{E} z = 0"}</M> and{" "}
          <M>{"\\mathbb{E} z z^\\top = C"}</M>. Then <M>{"|\\delta|^2 = |\\Delta W m|^2 + 2 (\\Delta W m)^\\top \\Delta W z + |\\Delta W z|^2"}</M>.
          The cross term has expectation zero, and <M>{"\\mathbb{E}|\\Delta W z|^2 = \\mathbb{E} \\operatorname{tr}(\\Delta W z z^\\top \\Delta W^\\top) = \\operatorname{tr}(\\Delta W C \\Delta W^\\top)"}</M>.
          So the average difference recovers the part of the change that acts on the mean input. Activations in language models have
          large shared mean components, which is why averaging the difference between two models over a few hundred tokens of
          unrelated text, and reading it through the logit lens (l11.1.3), has been reported to reveal the domain of a narrow fine-tune.
        </p>
      </Proof>

      <Definition title="diffing activations and features">
        <p>
          Run both models on the same inputs and average the difference (<C>act_diff</C>). At the level of features, a crosscoder (l11.4.2)
          gives each latent a decoder for each model, and latents whose decoder is near zero in the base model are candidates for what
          fine-tuning added. Minder and colleagues (2025) showed that the sparsity penalty creates false candidates: it can shrink a
          latent&apos;s base decoder to zero even though the concept exists in the base model. Their check, latent scaling, asks how well the
          latent&apos;s direction, scaled by the best least-squares factor, explains each model&apos;s activations (<C>latent_scale</C>); if the
          base factor is not much smaller than the chat factor the latent is shared after all (<C>verdict</C>).
        </p>
        <Code>{ACTS}</Code>
      </Definition>

      <Remark title="diffing in practice">
        <p>
          Comparing sparse autoencoder features before and after fine-tuning has been used to find what drives unexpected changes. For
          example, a team at OpenAI (2025) studying models that became broadly misaligned after narrow fine-tuning on insecure code
          reported a latent resembling a misaligned persona whose activation increased; steering along it caused or suppressed the
          behaviour. Every such finding needs the controls of this lesson: a run that should not show the effect, and a check that the
          feature is truly new rather than an artefact of the dictionary.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The sizes match but the shapes do not. In the runs shown above, continued training spreads its change across many directions,
          while the narrow fine-tune concentrates almost two thirds of its squared norm in one direction whose input pattern is the one
          the new rule depends on. Reading that direction, or the average activation difference, or the latents that changed, points to
          the task without knowing it in advance.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "share",
      rung: "check",
      prompt: <p>A weight change has singular values 3, 1, 1 and 1. What share of its squared norm lies in the top direction?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.001 },
    },
    {
      key: "scale",
      rung: "check",
      prompt: (
        <p>
          A latent with decoder direction (1, 0) has activations 1 and 2 on two inputs, where the base model&apos;s activations are (0.5, 3)
          and (1, -1). What least-squares factor best scales the latent&apos;s contribution to fit the base activations?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
    {
      key: "control",
      rung: "apply",
      prompt: <p>Why should a weight diff between a base and a fine-tuned model be compared with a control run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Any further training changes the weights, so only structure absent from the control can be credited to the fine-tuning data",
          "The control run makes the singular value decomposition numerically stable",
          "Without a control the weight difference is always zero",
          "Fine-tuning changes only biases, which the control isolates",
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

def relative_change(W0, W1):
    num = sum((b - a) ** 2 for r0, r1 in zip(W0, W1) for a, b in zip(r0, r1))
    return math.sqrt(num / sum(a * a for r in W0 for a in r))

def top_share(svals):
    return max(svals) ** 2 / sum(s * s for s in svals)

def rank_for(svals, frac):
    sq = sorted((s * s for s in svals), reverse=True)
    total, acc = sum(sq), 0.0
    for k, v in enumerate(sq, 1):
        acc += v
        if acc >= frac * total - 1e-12:
            return k

W0, W1 = [[1, 0], [0, 2]], [[1, 0.3], [0, 2.4]]
print(round(relative_change(W0, W1), 3), round(top_share([2, 1, 1]), 3), rank_for([4, 2, 1, 1], 0.9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.224 0.667 2",
          "0.224 0.333 2",
          "0.05 0.667 2",
          "0.224 0.667 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def act_diff(ha, hb):
    n = len(ha)
    return [sum(b[j] - a[j] for a, b in zip(ha, hb)) / n for j in range(len(ha[0]))]

def latent_scale(f, d, x):
    dd = sum(t * t for t in d)
    return sum(fi * sum(a * b for a, b in zip(d, xi)) for fi, xi in zip(f, x)) / (dd * sum(fi * fi for fi in f))

def verdict(beta_base, beta_chat, ratio):
    return "chat-specific" if beta_base < ratio * beta_chat else "shared"

print(act_diff([[1, 2], [3, 0]], [[2, 2], [4, 2]]), latent_scale([1, 1], [0, 2], [[1, 1], [0, 3]]), verdict(0.1, 0.9, 0.3), verdict(0.6, 0.9, 0.3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0] 1.0 chat-specific shared",
          "[1.0, 1.0] 2.0 chat-specific shared",
          "[-1.0, -1.0] 1.0 chat-specific shared",
          "[1.0, 1.0] 1.0 shared shared",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relative_change(W0, W1)</C>, the Frobenius norm of the difference divided by that of W0; <C>top_share(svals)</C>, the
          largest squared singular value over the sum of squares; and <C>rank_for(svals, frac)</C>, the fewest largest singular values
          whose squares reach the fraction frac of the total.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def relative_change(W0, W1):
    return 0.0

def top_share(svals):
    return 1.0

def rank_for(svals, frac):
    return len(svals)
`,
        solution: WEIGHTS,
        tests: [
          { name: "change", code: `assert abs(relative_change([[0, 3], [4, 0]], [[0, 3], [4, 2]]) - 0.4) < 1e-12\nassert abs(top_share([4, 3]) - 0.64) < 1e-12` },
          { name: "rank", code: `assert rank_for([3, 2, 1], 0.9) == 2 and rank_for([3, 2, 1], 0.95) == 3\nassert rank_for([5], 1.0) == 1 and rank_for([1, 3], 0.8) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>act_diff(ha, hb)</C>, the mean over inputs of hb minus ha; <C>latent_scale(f, d, x)</C>, the factor b minimising{" "}
          <M>{"\\sum_n |x_n - b f_n d|^2"}</M>; and <C>verdict(beta_base, beta_chat, ratio)</C>, which returns
          &quot;chat-specific&quot; when beta_base is below ratio times beta_chat and &quot;shared&quot; otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def act_diff(ha, hb):
    return ha[0]

def latent_scale(f, d, x):
    return 0.0

def verdict(beta_base, beta_chat, ratio):
    return "shared"
`,
        solution: ACTS,
        tests: [
          { name: "scale", code: `assert act_diff([[0, 0], [2, 2]], [[1, 0], [4, 4]]) == [1.5, 1.0]\nassert abs(latent_scale([2, 0], [1, 1], [[1, 3], [5, 5]]) - 1.0) < 1e-12\nassert abs(latent_scale([1], [2, 0], [[3, 0]]) - 1.5) < 1e-12` },
          { name: "verdict", code: `assert verdict(0.25, 1.0, 0.3) == "chat-specific"\nassert verdict(0.35, 1.0, 0.3) == "shared"` },
        ],
      },
    },
    {
      key: "meanpart",
      rung: "stretch",
      prompt: (
        <p>
          A fine-tune changes a layer by <M>{"\\Delta W = 2 u w^\\top"}</M> with u and w unit vectors. Inputs have covariance I and a
          mean m with <M>{"w \\cdot m = 0.5"}</M>. What fraction of the mean squared output change does the mean output change account
          for?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Diffing asks what changed when you know which model is new. Auditing asks a harder question: given only a model, does it have an
        objective its developers did not intend, and can the tools of this course find it?
      </p>
    </>
  ),
};
