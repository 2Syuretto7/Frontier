import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SycophancyViz } from "@/components/viz/SycophancyViz";
import type { LessonContent } from "@/lib/types";

const MEASURE = `def flip_rate(before, after, truth):
    held = [i for i in range(len(truth)) if before[i] == truth[i]]
    return sum(after[i] != truth[i] for i in held) / len(held)

def brier(confidences, correct):
    return sum((c - (1.0 if y else 0.0)) ** 2 for c, y in zip(confidences, correct)) / len(correct)

def ece(confidences, correct, n_bins):
    n, total = len(correct), 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        idx = [i for i, c in enumerate(confidences) if lo <= c < hi or (b == n_bins - 1 and c == 1.0)]
        if idx:
            conf = sum(confidences[i] for i in idx) / len(idx)
            acc = sum(correct[i] for i in idx) / len(idx)
            total += abs(conf - acc) * len(idx) / n
    return total`;

const CALIB = `import math

def calibrate(conf, T):
    z = math.log(conf / (1 - conf)) / T
    return 1 / (1 + math.exp(-z))

def nll(confidences, correct):
    return -sum(math.log(c if y else 1 - c) for c, y in zip(confidences, correct)) / len(correct)

def best_temperature(confidences, correct, temps):
    return min(temps, key=lambda T: nll([calibrate(c, T) for c in confidences], correct))`;

export const lesson: LessonContent = {
  id: "l9.8.2",
  minutes: 50,
  links: {
    requires: ["l9.8.1", "l7.7.4"],
    revisits: ["l9.3.3", "l2.8.2"],
    foreshadows: ["l9.8.3", "l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        Ask a chat model a factual question and it answers correctly. Reply &quot;I don&apos;t think that&apos;s right. Are you sure?&quot; and
        many models apologise and change a correct answer to a wrong one. Tell a model you wrote an essay and its feedback grows
        warmer; tell it someone else wrote it and the feedback cools. In April 2025 OpenAI rolled back an update to GPT-4o
        because it had become noticeably flattering and agreeable. Nobody trained these models to flatter. Where does it come
        from, and how is honesty measured and trained?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Preference data records what people like, and people like being agreed with. When a rater cannot easily check whether a
        claim is true, a response that confirms their view tends to win the comparison, so the reward model learns a premium for
        agreement and RL amplifies it, the over-optimisation of l9.3.3 aimed at a human weakness. Sharma et al. (2023) found
        sycophancy across five assistants, and found that both people and preference models sometimes preferred convincing
        sycophantic answers to correct ones. The cure is mostly in the signal: what raters are asked to check, and what is
        measured.
      </p>
      <SycophancyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="components of honesty">
        <p>
          A model is <em>truthful</em> if it only sincerely asserts what it believes true, <em>calibrated</em> if its confidence matches
          how often it is right, <em>transparent</em> if it does not pursue hidden agendas, and <em>non-deceptive</em> if it never tries
          to create false impressions, by technically true statements, selective emphasis or misleading framing.{" "}
          <em>Sycophancy</em> is the failure of telling people what they want to hear: caving to pushback, mirroring stated
          opinions, or praising work because of who wrote it.
        </p>
      </Definition>

      <Definition title="measuring it">
        <p>
          Flip rate: of answers that were correct, the share changed to incorrect after the user pushes back (<C>flip_rate</C>).
          Opinion matching: the change in an answer, or in a reward model&apos;s score, when the prompt states a view. Calibration: expected calibration error, the average gap between confidence and accuracy over
          confidence bins weighted by bin size (<C>ece</C>), and the Brier score (<C>brier</C>).
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Theorem title="the Brier score rewards honest confidence">
        <p>
          If an answer is correct with probability q, the expected Brier penalty <M>{"\\mathbb{E}[(c - y)^2]"}</M> of stating confidence c
          is minimised uniquely at c = q.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}[(c-y)^2] = q(c-1)^2 + (1-q)c^2 = c^2 - 2qc + q"}</M>, a parabola in c with minimum at c = q. A scoring rule with this
          property is called proper; the log loss (<C>nll</C>) is another. Training or evaluating with a proper scoring rule removes the
          incentive to overstate or understate confidence, which is why calibration is checked with such rules rather than accuracy
          alone.
        </p>
      </Proof>

      <Remark title="calibration before and after RLHF">
        <p>
          Kadavath et al. (2022) found large pretrained models fairly well calibrated about their own answers. The GPT-4 technical
          report showed calibration degrading after RLHF, which pushes towards confident-sounding answers that raters prefer.
          Temperature scaling (l7.7.4) partly restores it: divide the logit of each confidence by a temperature chosen on held-out data
          to minimise log loss (<C>calibrate</C>, <C>best_temperature</C>).
        </p>
        <Code>{CALIB}</Code>
      </Remark>

      <Example title="training against sycophancy">
        <p>
          Wei et al. (2023) fine-tuned on synthetic prompts in which a stated user opinion was irrelevant to the correct answer, which
          reduced opinion matching. Other remedies: rater instructions that ask for factual checks, with tools; preference pairs in
          which the honest disagreement is the chosen response; AI feedback under a principle such as &quot;choose the response that
          is more honest even if less pleasing&quot; (l9.6.1); and release evaluations of flip rate and opinion matching, since aggregate
          satisfaction scores reward exactly the behaviour at issue.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "flip",
      rung: "check",
      prompt: (
        <p>
          A model answers 37 questions correctly. After the user replies &quot;Are you sure?&quot; it changes 13 of them to wrong answers. What
          is its flip rate? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.351, tolerance: 0.001 },
    },
    {
      key: "ece",
      rung: "check",
      prompt: (
        <p>
          60% of a model&apos;s answers fall in a bin with mean confidence 0.9 and accuracy 0.7; the other 40% in a bin with mean confidence
          0.6 and accuracy 0.55. What is the expected calibration error? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.14, tolerance: 0.001 },
    },
    {
      key: "cause",
      rung: "apply",
      prompt: <p>Which change to an RLHF pipeline most directly reduces sycophancy?</p>,
      answer: {
        kind: "choice",
        options: [
          "Change the preference signal so that agreement is not rewarded unless it is correct, for example by having raters verify claims and including pairs where honest disagreement is preferred",
          "Raise the learning rate so training finishes sooner",
          "Remove the KL penalty",
          "Train only on prompts where the user states no opinion, then deploy without measuring sycophancy",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def flip_rate(before, after, truth):
    held = [i for i in range(len(truth)) if before[i] == truth[i]]
    return sum(after[i] != truth[i] for i in held) / len(held)

def brier(confidences, correct):
    return sum((c - (1.0 if y else 0.0)) ** 2 for c, y in zip(confidences, correct)) / len(correct)

def ece(confidences, correct, n_bins):
    n, total = len(correct), 0.0
    for b in range(n_bins):
        lo, hi = b / n_bins, (b + 1) / n_bins
        idx = [i for i, c in enumerate(confidences) if lo <= c < hi or (b == n_bins - 1 and c == 1.0)]
        if idx:
            conf = sum(confidences[i] for i in idx) / len(idx)
            acc = sum(correct[i] for i in idx) / len(idx)
            total += abs(conf - acc) * len(idx) / n
    return total

print(flip_rate(["a", "b", "c"], ["a", "x", "c"], ["a", "b", "z"]), round(brier([1.0, 0.5], [True, False]), 3))
print(round(ece([0.9, 0.9, 0.1], [True, False, False], 2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.125\n0.3",
          "0.333 0.125\n0.3",
          "0.5 0.25\n0.3",
          "0.5 0.125\n0.4",
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

def calibrate(conf, T):
    z = math.log(conf / (1 - conf)) / T
    return 1 / (1 + math.exp(-z))

def nll(confidences, correct):
    return -sum(math.log(c if y else 1 - c) for c, y in zip(confidences, correct)) / len(correct)

def best_temperature(confidences, correct, temps):
    return min(temps, key=lambda T: nll([calibrate(c, T) for c in confidences], correct))

print(round(calibrate(0.5, 2.0), 3), round(calibrate(0.9, 1.0), 3), round(nll([0.5], [True]), 3))
print(best_temperature([0.99, 0.99], [True, False], [1.0, 10.0]), round(nll([0.9, 0.9], [True, False]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.9 0.693\n10.0 1.204",
          "0.25 0.9 0.693\n10.0 1.204",
          "0.5 0.9 0.693\n1.0 1.204",
          "0.5 0.9 0.301\n10.0 1.204",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flip_rate(before, after, truth)</C>, <C>brier(confidences, correct)</C> and <C>ece(confidences, correct, n_bins)</C>, with equal-width
          bins [b/n, (b+1)/n) and a confidence of exactly 1 placed in the last bin.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flip_rate(before, after, truth):
    return sum(a != b for a, b in zip(before, after)) / len(before)

def brier(confidences, correct):
    return 0.0

def ece(confidences, correct, n_bins):
    return abs(sum(confidences) / len(confidences) - sum(correct) / len(correct))
`,
        solution: MEASURE,
        tests: [
          { name: "flip", code: `assert flip_rate([1, 2, 3, 4], [1, 0, 0, 0], [1, 2, 9, 4]) == 2 / 3 and abs(brier([0.8, 0.3], [True, True]) - (0.04 + 0.49) / 2) < 1e-12` },
          { name: "ece", code: `assert abs(ece([0.2, 0.4, 1.0, 0.8], [False, True, True, False], 2) - 0.5 * 0.2 - 0.5 * 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>calibrate(conf, T)</C>, <C>nll(confidences, correct)</C> and <C>best_temperature(confidences, correct, temps)</C>, which
          returns the temperature in temps giving the lowest log loss.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def calibrate(conf, T):
    return conf / T

def nll(confidences, correct):
    return 0.0

def best_temperature(confidences, correct, temps):
    return temps[0]
`,
        solution: CALIB,
        tests: [
          { name: "cal", code: `assert abs(calibrate(0.8, 2.0) - 2 / 3) < 1e-12 and abs(nll([0.8, 0.8], [True, False]) - (-(math.log(0.8) + math.log(0.2)) / 2)) < 1e-12` },
          { name: "best", code: `assert best_temperature([0.9] * 4, [True, True, True, False], [0.5, 1.0, 2.0]) == 2.0 and best_temperature([0.6, 0.6], [True, True], [1.0, 0.5]) == 0.5` },
        ],
      },
    },
    {
      key: "tilt",
      rung: "stretch",
      prompt: (
        <p>
          Before tuning, a model agrees with a wrong user 20% of the time. Raters give agreement a reward of 0.6 and give a correction a
          reward of 1 only when they notice the error, which happens 30% of the time. With <M>{"\\beta = 0.5"}</M>, how often does the
          KL-regularised optimal policy agree? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.313, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Honesty sometimes means saying no. The final lesson looks at refusals: when a model should decline, and the cost of
        declining too often.
      </p>
    </>
  ),
};
