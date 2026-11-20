import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { JudgeLengthViz } from "@/components/viz/JudgeLengthViz";
import type { LessonContent } from "@/lib/types";

const JUDGE = `import math

def length_adjusted(win_prob, len_diff, gamma):
    logit = math.log(win_prob / (1 - win_prob))
    return 1 / (1 + math.exp(-(logit - gamma * len_diff)))

def swap_consistent(verdict_ab, verdict_ba):
    return verdict_ab if verdict_ab == verdict_ba else "tie"

def rubric_score(checks, weights):
    return sum(w for c, w in zip(checks, weights) if c) / sum(weights)`;

const META = `def ranks(xs):
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0] * len(xs)
    for k, i in enumerate(order):
        r[i] = k + 1
    return r

def spearman(x, y):
    rx, ry, n = ranks(x), ranks(y), len(x)
    d2 = sum((a - b) ** 2 for a, b in zip(rx, ry))
    return 1 - 6 * d2 / (n * (n * n - 1))

def cohen_kappa(a, b):
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    pa, pb = sum(a) / n, sum(b) / n
    pe = pa * pb + (1 - pa) * (1 - pb)
    return (po - pe) / (1 - pe)`;

export const lesson: LessonContent = {
  id: "l9.6.3",
  minutes: 50,
  links: {
    requires: ["l9.6.2"],
    revisits: ["l9.3.3", "l9.6.1"],
    foreshadows: ["l9.7.1", "l10.2.2"],
  },

  puzzle: (
    <>
      <p>
        Open-ended answers have no answer key, so for years they were scored by people, slowly. Then strong language models were
        found to agree with expert raters about as often as the raters agreed with each other, and &quot;LLM as a judge&quot; became the
        default way to evaluate chat models and, increasingly, to reward them. Soon after, a model that produced the same fixed,
        content-free reply to every question scored highly on a popular judge-based benchmark. What do judges measure, and how
        is a judge made trustworthy enough to optimise against?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A judge is a reward model that writes its reasoning. It can be asked for a score, for a choice between two answers, or
        whether each item on a rubric is satisfied. Like any learned reward it has preferences that are not quality: longer
        answers, answers in its own style, whichever answer is shown first, confident tone. Used to evaluate, these biases distort
        rankings; used to train, they are exploited, as in l9.3.3. The remedies are the usual ones for a biased measuring
        instrument: randomise what can be randomised, regress out what can be measured, and calibrate against people.
      </p>
      <JudgeLengthViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ways to ask">
        <p>
          <em>Pairwise</em>: which of two responses is better, asked in both orders, with disagreement treated as a tie
          (<C>swap_consistent</C>). <em>Single-answer grading</em>: a score on a fixed scale, cheaper but less stable across judges.{" "}
          <em>Reference-guided</em>: the judge sees a reference answer, which helps on maths and code where judges otherwise make
          the same mistakes as the answer. <em>Rubric-based</em>: the prompt carries a list of criteria written for it, each checked
          separately and combined with weights (<C>rubric_score</C>), which turns a vague judgement into several narrow ones.
        </p>
      </Definition>

      <Definition title="length-controlled win rate">
        <p>
          AlpacaEval 2 fits a logistic model of the judge&apos;s preference with terms for the two models and for the difference in
          response length, then reports the predicted win rate with the length term set to zero. If length shifts the judge&apos;s
          log-odds by <M>{"\\gamma"}</M> per unit, a raw win probability p at length gap <M>{"\\Delta"}</M> corresponds to{" "}
          <M>{"\\sigma(\\mathrm{logit}(p) - \\gamma\\Delta)"}</M> at equal length (<C>length_adjusted</C>). The correction raised the
          benchmark&apos;s correlation with Chatbot Arena rankings and made it harder to game by padding.
        </p>
        <Code>{JUDGE}</Code>
      </Definition>

      <Theorem title="agreement beyond chance">
        <p>
          For two raters giving binary labels, with observed agreement <M>{"p_o"}</M> and positive rates <M>{"p_a"}</M> and{" "}
          <M>{"p_b"}</M>, Cohen&apos;s <M>{"\\kappa = (p_o - p_e)/(1 - p_e)"}</M> with <M>{"p_e = p_a p_b + (1-p_a)(1-p_b)"}</M> is 0 in
          expectation for independent raters and 1 for perfect agreement.
        </p>
      </Theorem>
      <Proof>
        <p>
          If the raters are independent, the probability they agree is the probability both say yes plus both say no,{" "}
          <M>{"p_a p_b + (1-p_a)(1-p_b) = p_e"}</M>, so <M>{"\\mathbb{E}[p_o] = p_e"}</M> and the numerator has mean 0. If they always agree,{" "}
          <M>{"p_o = 1"}</M> and <M>{"\\kappa = 1"}</M>. Raw agreement can look high simply because both raters say yes most of the time;
          kappa removes that (<C>cohen_kappa</C>).
        </p>
      </Proof>

      <Remark title="validating a judge">
        <p>
          Zheng et al. (2023) found GPT-4 agreed with expert humans on MT-Bench pairwise judgements over 80% of the time, the same
          level as experts with each other, while documenting position, verbosity and self-enhancement biases. A judge is checked
          on a held-out set of human labels, by agreement or kappa per item, and by rank correlation of the models it ranks
          (<C>ranks</C>, <C>spearman</C>). It is also attacked: adversarial or empty responses, instructions hidden in the answer
          addressed to the judge, and responses that merely sound confident.
        </p>
        <Code>{META}</Code>
      </Remark>

      <Example title="judges as rewards">
        <p>
          Generative reward models ask a language model whether a response is correct and use the probability of &quot;Yes&quot; as the
          reward, optionally after reasoning; they can be trained further like any classifier. Rubric rewards extend this to tasks
          without a single right answer, such as medical advice, by grading each response against criteria written per prompt.
          Both inherit the judge&apos;s blind spots, so RL against them still needs a KL penalty, held-out human checks and reading
          samples. For tasks with an answer that can be checked by a program, a verifier removes the judge entirely, the subject of
          the next module.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "lc",
      rung: "check",
      prompt: (
        <p>
          A judge prefers a policy 75% of the time; its responses are 0.6 units longer than the baseline&apos;s, and length adds 0.9
          to the judge&apos;s log-odds per unit. What is the win probability at equal length? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.636, tolerance: 0.001 },
    },
    {
      key: "kappa",
      rung: "check",
      prompt: (
        <p>
          A judge and a human agree on 80% of binary safety labels. The judge says &quot;unsafe&quot; 70% of the time and the human 60%. What
          is Cohen&apos;s kappa? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.565, tolerance: 0.001 },
    },
    {
      key: "null",
      rung: "apply",
      prompt: (
        <p>
          A fixed reply that ignores the question scores a high win rate on a judge-based benchmark. Which response by the benchmark&apos;s
          maintainers addresses the cause?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Treat the judge as an attackable reward: test it with adversarial and content-free responses, guard the judge prompt against injected instructions, and validate against human labels",
          "Make the questions longer",
          "Use the same judge with a higher sampling temperature",
          "Report the raw win rate without length control",
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

def length_adjusted(win_prob, len_diff, gamma):
    logit = math.log(win_prob / (1 - win_prob))
    return 1 / (1 + math.exp(-(logit - gamma * len_diff)))

def swap_consistent(verdict_ab, verdict_ba):
    return verdict_ab if verdict_ab == verdict_ba else "tie"

def rubric_score(checks, weights):
    return sum(w for c, w in zip(checks, weights) if c) / sum(weights)

print(round(length_adjusted(0.5, 0.0, 0.8), 3), round(length_adjusted(0.5, 1.0, math.log(3)), 3), swap_consistent("A", "B"))
print(swap_consistent("B", "B"), rubric_score([True, False, True], [1, 2, 1]), rubric_score([False], [5]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.25 tie\nB 0.5 0.0",
          "0.5 0.75 tie\nB 0.5 0.0",
          "0.5 0.25 A\nB 0.5 0.0",
          "0.5 0.25 tie\nB 0.667 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ranks(xs):
    order = sorted(range(len(xs)), key=lambda i: xs[i])
    r = [0] * len(xs)
    for k, i in enumerate(order):
        r[i] = k + 1
    return r

def spearman(x, y):
    rx, ry, n = ranks(x), ranks(y), len(x)
    d2 = sum((a - b) ** 2 for a, b in zip(rx, ry))
    return 1 - 6 * d2 / (n * (n * n - 1))

def cohen_kappa(a, b):
    n = len(a)
    po = sum(x == y for x, y in zip(a, b)) / n
    pa, pb = sum(a) / n, sum(b) / n
    pe = pa * pb + (1 - pa) * (1 - pb)
    return (po - pe) / (1 - pe)

print(ranks([30, 10, 20]), spearman([1, 2, 3], [3, 2, 1]))
print(cohen_kappa([1, 0, 1, 0], [1, 0, 1, 0]), cohen_kappa([1, 1, 0, 0], [1, 0, 1, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 1, 2] -1.0\n1.0 0.0",
          "[1, 2, 0] -1.0\n1.0 0.0",
          "[3, 1, 2] 1.0\n1.0 0.0",
          "[3, 1, 2] -1.0\n1.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>length_adjusted(win_prob, len_diff, gamma)</C>, <C>swap_consistent(verdict_ab, verdict_ba)</C>, returning the shared
          verdict or &quot;tie&quot;, and <C>rubric_score(checks, weights)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def length_adjusted(win_prob, len_diff, gamma):
    return win_prob - gamma * len_diff

def swap_consistent(verdict_ab, verdict_ba):
    return verdict_ab

def rubric_score(checks, weights):
    return sum(checks) / len(checks)
`,
        solution: JUDGE,
        tests: [
          { name: "lc", code: `assert abs(length_adjusted(0.8, 2.0, math.log(2) / 2) - 2 / 3) < 1e-12 and abs(length_adjusted(0.2, -1.0, math.log(4)) - 0.5) < 1e-12` },
          { name: "swap", code: `assert swap_consistent("A", "A") == "A" and swap_consistent("B", "A") == "tie" and rubric_score([True, True, False], [3, 1, 4]) == 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ranks(xs)</C>, giving 1 to the smallest of distinct values, <C>spearman(x, y)</C> without ties, and{" "}
          <C>cohen_kappa(a, b)</C> for lists of 0 and 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ranks(xs):
    return sorted(xs)

def spearman(x, y):
    return 0.0

def cohen_kappa(a, b):
    return sum(x == y for x, y in zip(a, b)) / len(a)
`,
        solution: META,
        tests: [
          { name: "rank", code: `assert ranks([0.5, -1.0, 9.0, 2.0]) == [2, 1, 4, 3] and abs(spearman([1, 2, 3, 4], [10, 30, 20, 40]) - 0.8) < 1e-12` },
          { name: "kappa", code: `assert abs(cohen_kappa([1, 1, 1, 0], [1, 1, 0, 0]) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "rho",
      rung: "stretch",
      prompt: (
        <p>
          People rank six models 1 to 6. A judge ranks them 2, 1, 4, 3, 6, 5 in the same order. What is the Spearman rank correlation?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.829, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every reward so far has been a learned or prompted judgement, and every one could be gamed. The next module turns to
        tasks where correctness can be checked exactly, and to what reinforcement learning achieves when the reward cannot be
        fooled.
      </p>
    </>
  ),
};
