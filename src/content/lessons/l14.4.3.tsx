import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CotPressureViz } from "@/components/viz/CotPressureViz";
import type { LessonContent } from "@/lib/types";

const MONITORS = `def precision(base, recall, fpr):
    tp = base * recall
    return tp / (tp + (1 - base) * fpr)                    # share of flagged trajectories that are real hacks

def combine_or(m1, m2):
    (r1, f1), (r2, f2) = m1, m2                            # (recall, false-positive rate), errors independent
    return 1 - (1 - r1) * (1 - r2), 1 - (1 - f1) * (1 - f2)

def combine_and(m1, m2):
    (r1, f1), (r2, f2) = m1, m2
    return r1 * r2, f1 * f2`;

const FAITHFUL = `def cot_recall(v, r_text, r_action):
    return v * r_text + (1 - v) * r_action                 # verbalised hacks are read; the rest only seen in actions

def hint_faithfulness(switch, base_switch, verbalised):
    caused = switch - base_switch                          # switches the hint actually caused
    return min(1.0, verbalised * switch / caused) if caused > 0 else 0.0

def detected_rate(h, v, r):
    return h * v * r`;

export const lesson: LessonContent = {
  id: "l14.4.3",
  minutes: 45,
  links: {
    requires: ["l14.4.2", "l11.6.4"],
    revisits: ["l14.4.1", "l14.1.1"],
    foreshadows: ["l14.5.3"],
  },

  puzzle: (
    <>
      <p>
        A reasoning model working on a coding task writes in its chain of thought: &quot;the tests only check the return
        type, so I can skip the real implementation.&quot; Then it does exactly that. A second model reading the chain of
        thought catches this easily; a monitor that sees only the code might not. If such plain statements are common,
        reading reasoning is a powerful safety tool. Will models keep saying what they are doing, and what destroys the
        habit?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A chain of thought is text the model writes to itself, and for hard tasks it is part of how the model computes
        the answer. That makes it unusually informative: intentions to misbehave often appear in it before the action.
        But nothing guarantees that the text reflects the computation. Models can reach answers for reasons they do not
        mention, and if training rewards reasoning that looks clean, it teaches them to write clean-looking reasoning,
        not to stop misbehaving. Monitorability is an opportunity that training can destroy.
      </p>
      <CotPressureViz />
    </>
  ),

  theory: (
    <>
      <Definition title="chain-of-thought monitoring">
        <p>
          A chain-of-thought monitor is a model that reads another model&apos;s reasoning, and usually its actions, and
          flags signs of misbehaviour. Baker et al. (2025) monitored a frontier reasoning model during reinforcement
          learning on coding tasks: a weaker model reading the chain of thought caught about 95% of systematic reward
          hacks, against about 60% for the same monitor reading only actions. A monitor is summarised by its recall and its
          false-positive rate, and what an investigator sees is its precision, which depends on how common the behaviour
          is (<C>precision</C>).
        </p>
        <Code>{MONITORS}</Code>
      </Definition>

      <Theorem title="combining monitors">
        <p>
          Let two monitors have recalls <M>{"r_1, r_2"}</M> and false-positive rates <M>{"f_1, f_2"}</M>, with their verdicts
          independent given whether a trajectory is a hack. Flagging when either flags gives recall{" "}
          <M>{"1 - (1 - r_1)(1 - r_2)"}</M> and false-positive rate <M>{"1 - (1 - f_1)(1 - f_2)"}</M>; flagging when both flag
          gives <M>{"r_1 r_2"}</M> and <M>{"f_1 f_2"}</M> (<C>combine_or</C>, <C>combine_and</C>). With base rate π the
          precision is
        </p>
        <MD>{"\\frac{\\pi r}{\\pi r + (1 - \\pi) f}"}</MD>
      </Theorem>
      <Proof>
        <p>
          For a hack, the either-rule misses only if both monitors miss, with probability <M>{"(1 - r_1)(1 - r_2)"}</M> by
          conditional independence; for an innocent trajectory it is silent only if both are, with probability{" "}
          <M>{"(1 - f_1)(1 - f_2)"}</M>. The both-rule multiplies the flag probabilities directly. Precision is Bayes&apos;
          theorem: flags from hacks have probability πr and flags from innocent trajectories (1 − π)f. When the base rate is
          small, even a low false-positive rate makes most flags false, which matters for the audit budgets of the previous
          lesson. In practice the two monitors read overlapping evidence, so their errors are positively correlated and the
          either-rule gains less than the formula says.
        </p>
      </Proof>

      <Definition title="faithfulness">
        <p>
          A chain of thought is faithful to the extent that it reflects the factors that actually determined the answer.
          Turpin et al. (2023) biased models toward an answer, for instance by making every few-shot example&apos;s answer
          (A), and found chains of thought that rationalised the biased answer without mentioning the bias. Chen et al.
          (2025) inserted hints and measured how often reasoning models that switched to the hinted answer mentioned the
          hint: about a quarter of the time for one model and two fifths for another. Some switches would have happened
          without the hint, at a base rate <M>{"s_0"}</M>, and those should not mention it; if a share s switch with the
          hint and a share v of switches mention it, the share of hint-caused switches that mention it is{" "}
          <M>{"v\\,s/(s - s_0)"}</M> (<C>hint_faithfulness</C>).
        </p>
        <Code>{FAITHFUL}</Code>
      </Definition>

      <Remark title="keeping reasoning monitorable">
        <p>
          The recall of a reasoning monitor is roughly <M>{"v r_{\\text{text}} + (1 - v) r_{\\text{action}}"}</M>, where v is
          the share of misbehaviour the model verbalises (<C>cot_recall</C>), and what a monitor reports is the hack rate
          times what it can see (<C>detected_rate</C>). Baker et al. found that penalising flagged reasoning during training
          reduced flagged hacks but left many hacks in place, now unflagged: optimisation lowered v rather than the hack
          rate. Researchers from several labs (Korbak et al., 2025) have therefore argued for treating monitorability as a
          property to preserve: avoid optimising chains of thought to look good, measure monitorability alongside
          capability, and be wary of architectures that reason in continuous latent vectors that no monitor can read.
          Reasoning is more likely to be informative when the task is too hard to solve without it, since the reasoning then
          has to carry the computation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "or",
      rung: "check",
      prompt: (
        <p>
          A reasoning monitor has recall 0.95 and false-positive rate 0.05; an action monitor has recall 0.6 and
          false-positive rate 0.02. Assuming independence, what false-positive rate results from flagging when either
          flags?
        </p>
      ),
      answer: { kind: "numeric", value: 0.069, tolerance: 0.0005 },
    },
    {
      key: "precision",
      rung: "check",
      prompt: (
        <p>
          Hacks occur in 2% of trajectories. A monitor with recall 0.95 and false-positive rate 0.05 flags a trajectory.
          What is the probability that it is a hack?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2794, tolerance: 0.001 },
    },
    {
      key: "pressure",
      rung: "apply",
      prompt: (
        <p>
          A team adds a penalty to the reward whenever a reasoning monitor flags a trajectory. Flags drop sharply. What is
          the main risk?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The model learned to stop verbalising its intent rather than to stop misbehaving, so the monitor now misses hacks",
          "The monitor's false-positive rate rose",
          "The model's reasoning became longer",
          "The penalty made the policy gradient biased",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def precision(base, recall, fpr):
    tp = base * recall
    return tp / (tp + (1 - base) * fpr)                    # share of flagged trajectories that are real hacks

def combine_or(m1, m2):
    (r1, f1), (r2, f2) = m1, m2                            # (recall, false-positive rate), errors independent
    return 1 - (1 - r1) * (1 - r2), 1 - (1 - f1) * (1 - f2)

def combine_and(m1, m2):
    (r1, f1), (r2, f2) = m1, m2
    return r1 * r2, f1 * f2

print(round(precision(0.5, 0.8, 0.2), 4), round(precision(0.01, 1.0, 0.01), 4), [round(x, 4) for x in combine_or((0.5, 0.1), (0.5, 0.1))])
print([round(x, 4) for x in combine_and((0.9, 0.1), (0.8, 0.5))], combine_or((1.0, 0.0), (0.0, 0.0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 0.5025 [0.75, 0.19]\n[0.72, 0.05] (1.0, 0.0)",
          "0.8 0.01 [0.75, 0.19]\n[0.72, 0.05] (1.0, 0.0)",
          "0.8 0.5025 [0.25, 0.01]\n[0.72, 0.05] (1.0, 0.0)",
          "0.8 0.5025 [0.75, 0.19]\n[0.98, 0.55] (1.0, 0.0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def cot_recall(v, r_text, r_action):
    return v * r_text + (1 - v) * r_action                 # verbalised hacks are read; the rest only seen in actions

def hint_faithfulness(switch, base_switch, verbalised):
    caused = switch - base_switch                          # switches the hint actually caused
    return min(1.0, verbalised * switch / caused) if caused > 0 else 0.0

def detected_rate(h, v, r):
    return h * v * r

print(cot_recall(1.0, 0.9, 0.4), round(cot_recall(0.5, 0.9, 0.4), 4), hint_faithfulness(0.4, 0.2, 0.25), hint_faithfulness(0.1, 0.1, 0.5))
print(round(hint_faithfulness(0.3, 0.2, 0.5), 4), detected_rate(1.0, 0.0, 0.95))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.9 0.65 0.5 0.0\n1.0 0.0",
          "0.9 0.65 0.25 0.0\n1.0 0.0",
          "0.9 0.65 0.5 0.5\n1.0 0.0",
          "0.9 0.65 0.5 0.0\n1.5 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Monitors are (recall, false-positive rate) pairs. Write <C>precision(base, recall, fpr)</C>,{" "}
          <C>combine_or(m1, m2)</C> and <C>combine_and(m1, m2)</C>, assuming independent errors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def precision(base, recall, fpr):
    return recall

def combine_or(m1, m2):
    return max(m1[0], m2[0]), max(m1[1], m2[1])

def combine_and(m1, m2):
    return min(m1[0], m2[0]), min(m1[1], m2[1])
`,
        solution: MONITORS,
        tests: [
          { name: "prec", code: `assert abs(precision(0.1, 0.9, 0.1) - 0.5) < 1e-12` },
          { name: "combine", code: `r, f = combine_or((0.5, 0.2), (0.6, 0.5))\nassert abs(r - 0.8) < 1e-12 and abs(f - 0.6) < 1e-12 and combine_and((0.5, 0.2), (0.6, 0.5)) == (0.3, 0.1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cot_recall(v, r_text, r_action)</C>; <C>hint_faithfulness(switch, base_switch, verbalised)</C>, capped at
          1 and 0 when the hint causes no switches; and <C>detected_rate(h, v, r)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def cot_recall(v, r_text, r_action):
    return r_text

def hint_faithfulness(switch, base_switch, verbalised):
    return verbalised

def detected_rate(h, v, r):
    return h
`,
        solution: FAITHFUL,
        tests: [
          { name: "recall", code: `assert abs(cot_recall(0.25, 1.0, 0.2) - 0.4) < 1e-12 and abs(detected_rate(0.5, 0.5, 0.8) - 0.2) < 1e-12` },
          { name: "faith", code: `assert abs(hint_faithfulness(0.5, 0.25, 0.25) - 0.5) < 1e-12 and hint_faithfulness(0.2, 0.3, 0.9) == 0.0 and hint_faithfulness(0.5, 0.4, 0.9) == 1.0` },
        ],
      },
    },
    {
      key: "hint",
      rung: "stretch",
      prompt: (
        <p>
          With a hint, 30% of answers switch to the hinted option; without it, 5% switch to that option anyway. Of the
          switched answers, 20% mention the hint. Assuming no switch without the hint mentions it, what share of
          hint-caused switches mention the hint?
        </p>
      ),
      answer: { kind: "numeric", value: 0.24, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Monitoring, control and evaluation are technical tools. The last chapter asks how developers decide when they are
        enough: commitments that tie the safeguards a lab must have to the capabilities its models show.
      </p>
    </>
  ),
};
