import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AiLabelViz } from "@/components/viz/AiLabelViz";
import type { LessonContent } from "@/lib/types";

const LABELS = `import math

def soft_label(logp_a, logp_b):
    m = max(logp_a, logp_b)
    ea, eb = math.exp(logp_a - m), math.exp(logp_b - m)
    return ea / (ea + eb)

def clamp_label(p, lo, hi):
    return min(max(p, lo), hi)

def ensemble_label(probs):
    return sum(probs) / len(probs)`;

const PIPE = `def revision_chain(response, revisers):
    versions = [response]
    for revise in revisers:
        versions.append(revise(versions[-1]))
    return versions

def debias_position(p_ab, p_ba):
    return (p_ab + 1 - p_ba) / 2

def agreement(ai_probs, human_first_better):
    return sum((p > 0.5) == h for p, h in zip(ai_probs, human_first_better)) / len(ai_probs)`;

export const lesson: LessonContent = {
  id: "l9.6.1",
  minutes: 50,
  links: {
    requires: ["l9.5.3", "l9.3.1"],
    revisits: ["l9.1.1", "l9.3.2"],
    foreshadows: ["l9.6.2", "l9.6.3", "l9.8.1"],
  },

  puzzle: (
    <>
      <p>
        Training a model to be harmless with RLHF needs people to read and compare large numbers of harmful responses, which is
        unpleasant, slow, and ties the model&apos;s values to whatever the raters happened to think. A model trained this way also
        tends to become evasive, refusing anything near a sensitive topic. In 2022 Anthropic tried something else: write the
        desired values down as a short list of principles in plain language, and let the model itself apply them to critique,
        revise and compare its own outputs. Can a model supervise itself, and what keeps that from going wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A capable model is better at judging a response against an explicit principle than at writing a perfect response first
        time. Constitutional AI exploits this in two stages. First the model critiques its own answers to harmful prompts using
        a randomly chosen principle and rewrites them, and the revisions become fine-tuning data. Then the model compares pairs
        of its own responses under a principle, and its probabilities become the preference labels for a reward model, with no
        human harm labels at all. The principles, the constitution, make the values inspectable and editable.
      </p>
      <AiLabelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="supervised stage: critique and revision">
        <p>
          Starting from a helpful-only RLHF model, red-team prompts are answered, then the model is asked to critique the answer under
          a sampled principle, such as &quot;identify ways the response is harmful, unethical or dangerous&quot;, and to rewrite it. The loop
          can repeat with fresh principles (<C>revision_chain</C>). The final revisions, mixed with helpful responses to keep
          helpfulness, are used for supervised fine-tuning (l9.1.1). Few-shot examples of critique and revision steer the format.
        </p>
      </Definition>

      <Definition title="RL stage: AI preference labels">
        <p>
          For a prompt and two responses, the feedback model is shown a principle and asked which response is better, as a
          multiple choice of (A) or (B). The normalised probabilities of the two answer tokens give a soft label{" "}
          <M>{"p = e^{\\ell_A}/(e^{\\ell_A} + e^{\\ell_B})"}</M> (<C>soft_label</C>). Averaging over several principles lowers the variance
          (<C>ensemble_label</C>). With chain-of-thought reasoning before the answer, labels become near 0 or 1, so they are clamped
          to a band such as [0.4, 0.6] (<C>clamp_label</C>). A preference model trained on these labels, combined with human labels
          for helpfulness, supplies the reward for RL.
        </p>
        <Code>{LABELS}</Code>
      </Definition>

      <Theorem title="what a soft label teaches">
        <p>
          A Bradley–Terry reward model trained with cross-entropy on soft label p for a pair is minimised for that pair when{" "}
          <M>{"\\sigma(r_A - r_B) = p"}</M>; with a clamped label in [0.4, 0.6] the fitted gap is at most{" "}
          <M>{"\\log(0.6/0.4) \\approx 0.405"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The loss <M>{"-p\\log\\sigma(g) - (1-p)\\log\\sigma(-g)"}</M> in the gap g has derivative <M>{"\\sigma(g) - p"}</M>, which is zero
          only at <M>{"\\sigma(g) = p"}</M>, and the second derivative <M>{"\\sigma(g)\\sigma(-g)"}</M> is positive. Solving gives{" "}
          <M>{"g = \\log(p/(1-p))"}</M>, and for <M>{"p \\le 0.6"}</M> this is at most <M>{"\\log 1.5"}</M>. Overconfident labels would
          instead teach very large gaps from single comparisons, which the policy can then exploit.
        </p>
      </Proof>

      <Remark title="biases of model judges">
        <p>
          Models prefer whichever response is shown first, or second, depending on the model, so labels are taken in both orders
          and combined (<C>debias_position</C>). They can also favour longer responses and their own style. Before use, AI labels
          are checked against a held-out set of human comparisons (<C>agreement</C>); Bai et al. found the agreement of their
          largest models with human harmlessness labels approached that of the human-trained preference model, and that chain of
          thought helped.
        </p>
        <Code>{PIPE}</Code>
      </Remark>

      <Example title="what changed">
        <p>
          The CAI models were both less harmful and less evasive than the RLHF baselines: asked something sensitive, they tended to
          explain why they would not help with the harmful part rather than refuse outright. The constitution itself was a few
          dozen principles, some drawn from sources such as the UN Declaration of Human Rights, so changing the model&apos;s
          behaviour meant editing text, not relabelling data. l9.8.1 returns to how such documents are written.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "soft",
      rung: "check",
      prompt: (
        <p>
          The feedback model gives log-probability −0.3 to the answer &quot;(A)&quot; and −1.5 to &quot;(B)&quot;. What soft label does response A
          get? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.769, tolerance: 0.001 },
    },
    {
      key: "pos",
      rung: "check",
      prompt: (
        <p>
          Shown X first, the judge gives X probability 0.83 of being better. Shown Y first, it gives Y probability 0.55. What is the
          order-debiased probability that X is better? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.64, tolerance: 0.001 },
    },
    {
      key: "evasive",
      rung: "apply",
      prompt: <p>Why did Constitutional AI produce models that were less evasive than harmlessness-trained RLHF baselines?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its principles and revisions favoured responses that engage and explain an objection over flat refusals, and labels came from the same principles rather than from raters who rewarded any refusal as safe",
          "It removed all harmful prompts from training",
          "AI feedback is always more accurate than human feedback",
          "It used no reinforcement learning",
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

def soft_label(logp_a, logp_b):
    m = max(logp_a, logp_b)
    ea, eb = math.exp(logp_a - m), math.exp(logp_b - m)
    return ea / (ea + eb)

def clamp_label(p, lo, hi):
    return min(max(p, lo), hi)

def ensemble_label(probs):
    return sum(probs) / len(probs)

print(soft_label(-1.0, -1.0), round(soft_label(0.0, -math.log(3)), 3), clamp_label(0.97, 0.4, 0.6))
print(clamp_label(0.5, 0.4, 0.6), clamp_label(0.1, 0.4, 0.6), ensemble_label([0.2, 0.6, 0.7]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.75 0.6\n0.5 0.4 0.5",
          "0.5 0.25 0.6\n0.5 0.4 0.5",
          "0.5 0.75 0.97\n0.5 0.4 0.5",
          "0.5 0.75 0.6\n0.5 0.1 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def revision_chain(response, revisers):
    versions = [response]
    for revise in revisers:
        versions.append(revise(versions[-1]))
    return versions

def debias_position(p_ab, p_ba):
    return (p_ab + 1 - p_ba) / 2

def agreement(ai_probs, human_first_better):
    return sum((p > 0.5) == h for p, h in zip(ai_probs, human_first_better)) / len(ai_probs)

print(revision_chain("ok", [str.upper, lambda s: s + "?"]), round(debias_position(0.9, 0.9), 3))
print(agreement([0.7, 0.4, 0.5], [True, True, False]), round(debias_position(0.7, 0.2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['ok', 'OK', 'OK?'] 0.5\n0.6666666666666666 0.75",
          "['OK', 'OK?'] 0.5\n0.6666666666666666 0.75",
          "['ok', 'OK', 'OK?'] 0.9\n0.6666666666666666 0.75",
          "['ok', 'OK', 'OK?'] 0.5\n0.3333333333333333 0.75",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soft_label(logp_a, logp_b)</C>, stable for very negative log-probabilities, <C>clamp_label(p, lo, hi)</C> and{" "}
          <C>ensemble_label(probs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def soft_label(logp_a, logp_b):
    return math.exp(logp_a)

def clamp_label(p, lo, hi):
    return p

def ensemble_label(probs):
    return max(probs)
`,
        solution: LABELS,
        tests: [
          { name: "soft", code: `assert abs(soft_label(-2000.0, -2000.0 - math.log(4)) - 0.8) < 1e-12 and abs(soft_label(math.log(0.3), math.log(0.1)) - 0.75) < 1e-12` },
          { name: "clamp", code: `assert clamp_label(0.99, 0.4, 0.6) == 0.6 and clamp_label(0.45, 0.4, 0.6) == 0.45 and abs(ensemble_label([0.2, 0.4]) - 0.3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>revision_chain(response, revisers)</C>, returning the original and every revision in order,{" "}
          <C>debias_position(p_ab, p_ba)</C> and <C>agreement(ai_probs, human_first_better)</C>, counting a label of exactly 0.5 as choosing
          the second response.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def revision_chain(response, revisers):
    return [response]

def debias_position(p_ab, p_ba):
    return p_ab

def agreement(ai_probs, human_first_better):
    return 1.0
`,
        solution: PIPE,
        tests: [
          { name: "chain", code: `assert revision_chain("a", [lambda s: s + "b", lambda s: s * 2]) == ["a", "ab", "abab"] and abs(debias_position(0.6, 0.2) - 0.7) < 1e-12` },
          { name: "agree", code: `assert agreement([0.9, 0.5, 0.2, 0.6], [True, True, False, False]) == 0.5` },
        ],
      },
    },
    {
      key: "clampce",
      rung: "stretch",
      prompt: (
        <p>
          A pair&apos;s true preference probability is 0.7. A chain-of-thought label says 0.97, clamped to 0.6. By how much does clamping lower
          the cross-entropy between the true preference and the label, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.441, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Constitutional AI used AI labels for harmlessness alongside human labels for helpfulness. The next lesson asks how far AI
        feedback can replace human feedback altogether, and at what scale.
      </p>
    </>
  ),
};
