import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EvalScheduleViz } from "@/components/viz/EvalScheduleViz";
import type { LessonContent } from "@/lib/types";

const SCHEDULE = `import math

def warning_threshold(T, alpha, k, gap):
    return T - alpha * math.log2(k) - gap                  # growth between evaluations plus elicitation gap

def first_trigger(scores, warn):
    return next((i for i, s in enumerate(scores) if s >= warn), None)

def crossed_unseen(true_scores, measured, T, warn):
    i = first_trigger(measured, warn)
    stop = len(true_scores) if i is None else i
    return any(s >= T for s in true_scores[:stop + 1])     # the threshold reached before or at the trigger`;

const POLICY = `def required_level(scores, thresholds, base=2):
    level = base
    for domain, score in scores.items():
        for cutoff, lvl in thresholds.get(domain, []):
            if score >= cutoff:
                level = max(level, lvl)                    # the most demanding threshold crossed
    return level

def decision(scores, thresholds, safeguards):
    need = required_level(scores, thresholds)
    return "deploy" if safeguards >= need else "pause"

def elicited(p, k):
    return 1 - (1 - p) ** k                                # pass@k: what a determined user could get`;

export const lesson: LessonContent = {
  id: "l14.5.1",
  minutes: 45,
  links: {
    requires: ["l14.3.3", "l14.4.2"],
    revisits: ["l14.1.3", "l14.3.2"],
    foreshadows: ["l14.5.2", "l14.5.3"],
  },

  puzzle: (
    <>
      <p>
        A developer is about to train a model with ten times the compute of its last. It does not know what the new model
        will be able to do, and some possible abilities, such as giving real help to someone building a biological weapon,
        would require security and deployment safeguards it does not yet have. Waiting until the model exists to decide
        is too late; refusing to train anything is not a policy. What can be committed to in advance, and how often must
        the model be tested so that the commitment means something?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A responsible scaling policy is a set of if-then commitments: if a model reaches a specified dangerous capability,
        then specified safeguards must be in place before it is trained further or deployed, and if they cannot be, the
        developer pauses. Its strength depends on three things: thresholds defined in advance, evaluations that would
        detect them, and a schedule that tests often enough that a model cannot cross a threshold between tests. The last
        part is arithmetic, and it decides how much below the threshold the alarm must be set.
      </p>
      <EvalScheduleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="responsible scaling policies">
        <p>
          Anthropic published the first responsible scaling policy in September 2023, defining AI Safety Levels modelled on
          biosafety levels: each level pairs capability thresholds with required safeguards for security and deployment,
          and the developer commits not to train or deploy models whose level&apos;s safeguards it has not implemented. In
          May 2025 it activated its third level&apos;s protections for a new model as a precaution, having been unable to
          rule out that the model had crossed the corresponding threshold. OpenAI&apos;s Preparedness Framework and Google
          DeepMind&apos;s Frontier Safety Framework follow the same pattern with their own names for levels, and at the
          Seoul summit in May 2024 sixteen companies committed to publish such frameworks. The policy logic can be stated
          as code: the most demanding threshold crossed sets the required level, and deployment needs safeguards at that
          level (<C>required_level</C>, <C>decision</C>).
        </p>
        <Code>{POLICY}</Code>
      </Definition>

      <Theorem title="how far below the threshold to warn">
        <p>
          Let true capability be a non-decreasing function of log effective compute that rises by at most α per doubling,
          let evaluations happen at least every k-fold increase in compute, and let each evaluation measure capability at
          most g below its true value and never above it. If the warning line is
        </p>
        <MD>{"W = T - \\alpha\\log_2 k - g"}</MD>
        <p>
          (<C>warning_threshold</C>), then true capability cannot reach T before an evaluation reports at least W, unless
          it reaches T within one evaluation interval of the first evaluation (<C>first_trigger</C>,{" "}
          <C>crossed_unseen</C>).
        </p>
        <Code>{SCHEDULE}</Code>
      </Theorem>
      <Proof>
        <p>
          Suppose true capability first reaches T at compute <M>{"C^*"}</M>, after the first evaluation, and let{" "}
          <M>{"C_e"}</M> be the last evaluation at or before <M>{"C^*"}</M>. Then{" "}
          <M>{"C^* \\le k\\,C_e"}</M>, so true capability at <M>{"C_e"}</M> is at least{" "}
          <M>{"T - \\alpha\\log_2 k"}</M>, and the measurement there is at least{" "}
          <M>{"T - \\alpha\\log_2 k - g = W"}</M>. So an evaluation at or before <M>{"C^*"}</M> reported at least W. The
          assumptions carry the weight: capability can jump rather than rise smoothly, new elicitation methods after
          release can widen g, and fine-tuning or tools can add capability without training compute. Each forces a larger
          buffer or more frequent testing.
        </p>
      </Proof>

      <Example title="the elicitation gap can be large">
        <p>
          An evaluation that samples a model once per task underestimates what a determined user, who can sample many times
          and check, will get. If a model solves each task in a set with probability 0.5 per attempt, its measured success
          is 0.5 but three attempts reach <M>{"1 - 0.5^3 = 0.875"}</M> (<C>elicited</C>). Policies therefore require
          evaluators to make a serious effort to elicit capabilities, with fine-tuning, tools, many samples and good
          prompting, and to add a margin for what they could not try.
        </p>
      </Example>

      <Remark title="strengths and criticisms">
        <p>
          Such policies make commitments before the pressure to deploy arrives, make them public and checkable, and tie the
          cost of safety to evidence of danger rather than to speculation. Critics note that they are written and judged by
          the developers themselves, that thresholds are often stated loosely, that they have been revised when
          inconvenient, and that a pause by one developer may only hand the lead to another. Proposals to address these
          include external audits, regulation that makes some commitments binding, and the safety cases of the last lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "warn",
      rung: "check",
      prompt: (
        <p>
          A threshold is 70 points; capability can rise 5 points per doubling of compute; evaluations happen every 8× and
          measure up to 2 points low. Where should the warning line be?
        </p>
      ),
      answer: { kind: "numeric", value: 53, tolerance: 0.001 },
    },
    {
      key: "alpha",
      rung: "check",
      prompt: (
        <p>
          With threshold 60, evaluations every 4× and an elicitation gap of 3, a model measures 45. For what growth per
          doubling would 45 exactly reach the warning line?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0.001 },
    },
    {
      key: "ifthen",
      rung: "apply",
      prompt: <p>What is the core structure of a responsible scaling policy?</p>,
      answer: {
        kind: "choice",
        options: [
          "If-then commitments: if a model reaches a specified capability, specified safeguards must be in place before further training or deployment, or the developer pauses",
          "A cap on the total compute a developer may use",
          "A promise never to train models above a fixed size",
          "A list of banned topics for the model",
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

def warning_threshold(T, alpha, k, gap):
    return T - alpha * math.log2(k) - gap                  # growth between evaluations plus elicitation gap

def first_trigger(scores, warn):
    return next((i for i, s in enumerate(scores) if s >= warn), None)

def crossed_unseen(true_scores, measured, T, warn):
    i = first_trigger(measured, warn)
    stop = len(true_scores) if i is None else i
    return any(s >= T for s in true_scores[:stop + 1])     # the threshold reached before or at the trigger

print(warning_threshold(60, 4, 4, 3), first_trigger([40, 47, 50, 58], 49), first_trigger([10], 49))
print(crossed_unseen([45, 55, 62], [42, 52, 59], 60, 49), crossed_unseen([45, 61, 70], [42, 48, 67], 60, 49))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "49.0 2 None\nFalse True",
          "49.0 3 None\nFalse True",
          "49.0 2 0\nFalse True",
          "49.0 2 None\nFalse False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def required_level(scores, thresholds, base=2):
    level = base
    for domain, score in scores.items():
        for cutoff, lvl in thresholds.get(domain, []):
            if score >= cutoff:
                level = max(level, lvl)                    # the most demanding threshold crossed
    return level

def decision(scores, thresholds, safeguards):
    need = required_level(scores, thresholds)
    return "deploy" if safeguards >= need else "pause"

def elicited(p, k):
    return 1 - (1 - p) ** k                                # pass@k: what a determined user could get

th = {"bio": [(50, 3), (80, 4)], "cyber": [(60, 3)]}; print(required_level({"bio": 85, "cyber": 10}, th), required_level({"math": 99}, th), decision({"cyber": 60}, th, 2))
print(decision({"bio": 49}, th, 2), round(elicited(0.5, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 2 pause\ndeploy 0.875",
          "3 2 pause\ndeploy 0.875",
          "4 2 deploy\ndeploy 0.875",
          "4 2 pause\npause 0.875",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>warning_threshold(T, alpha, k, gap)</C>; <C>first_trigger(scores, warn)</C>, the index of the first
          measured score at or above warn, or None; and <C>crossed_unseen(true_scores, measured, T, warn)</C>, true if the
          true score reaches T at or before the first trigger, or at any point when nothing triggers.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def warning_threshold(T, alpha, k, gap):
    return T

def first_trigger(scores, warn):
    return None

def crossed_unseen(true_scores, measured, T, warn):
    return False
`,
        solution: SCHEDULE,
        tests: [
          { name: "warn", code: `assert warning_threshold(50, 2, 8, 1) == 43 and first_trigger([1, 5, 9], 5) == 1 and first_trigger([], 1) is None` },
          { name: "unseen", code: `assert crossed_unseen([1, 9], [0, 2], 8, 5) and not crossed_unseen([6, 9], [6, 8], 8, 5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Thresholds map each domain to (cutoff, level) pairs. Write <C>required_level(scores, thresholds, base=2)</C>,
          the highest level whose cutoff a score reaches, or base; <C>decision(scores, thresholds, safeguards)</C>,
          returning &quot;deploy&quot; or &quot;pause&quot;; and <C>elicited(p, k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def required_level(scores, thresholds, base=2):
    return base

def decision(scores, thresholds, safeguards):
    return "deploy"

def elicited(p, k):
    return p
`,
        solution: POLICY,
        tests: [
          { name: "level", code: `th = {"a": [(10, 3), (20, 5)], "b": [(1, 4)]}\nassert required_level({"a": 15, "b": 0}, th) == 3 and required_level({"a": 25, "b": 2}, th) == 5 and required_level({}, th, base=1) == 1` },
          { name: "decide", code: `th = {"a": [(10, 3)]}\nassert decision({"a": 10}, th, 2) == "pause" and decision({"a": 10}, th, 3) == "deploy" and abs(elicited(0.2, 2) - 0.36) < 1e-12` },
        ],
      },
    },
    {
      key: "gap",
      rung: "stretch",
      prompt: (
        <p>
          A model solves each task in a dangerous-capability evaluation with probability 0.3 per attempt, independently.
          What share of tasks would a user solve with 10 attempts and a way to check success?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9718, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Everything here depends on thresholds: which capabilities count as dangerous, and how an evaluation can tell
        that a model has one. That is the subject of the next lesson.
      </p>
    </>
  ),
};
