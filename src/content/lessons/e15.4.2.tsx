import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DpoLossViz } from "@/components/viz/DpoLossViz";
import type { LessonContent } from "@/lib/types";

const DPO = `import math

def implicit_reward(logp, logp_ref, beta):
    return beta * (logp - logp_ref)

def dpo_loss(pc, pr, rc, rr, beta):
    z = implicit_reward(pc, rc, beta) - implicit_reward(pr, rr, beta)
    return math.log1p(math.exp(-z))                        # -log sigmoid(z)

def reward_accuracy(batch, beta):
    return sum(implicit_reward(pc, rc, beta) > implicit_reward(pr, rr, beta)
               for pc, pr, rc, rr in batch) / len(batch)`;

const PREFS = `def make_pairs(scores, margin):
    return [(i, j) for i in range(len(scores)) for j in range(len(scores))
            if scores[i] - scores[j] >= margin]            # i preferred to j by a clear margin

def longer_share(pairs, lengths):
    return sum(lengths[i] > lengths[j] for i, j in pairs) / len(pairs)

def win_rate(results):
    return sum({"win": 1, "tie": 0.5, "loss": 0}[r] for r in results) / len(results)`;

export const lesson: LessonContent = {
  id: "e15.4.2",
  minutes: 45,
  links: {
    requires: ["e15.4.1"],
    revisits: ["l9.3.1", "l9.3.2", "l9.5.1", "l9.5.3", "l9.6.3"],
    foreshadows: ["e15.4.3"],
  },

  puzzle: (
    <>
      <p>
        After fine-tuning, the model answers in the right format, but its answers vary: some helpful, some rambling,
        some confidently wrong. Showing it better examples has diminishing returns, because nobody can write the ideal
        answer to everything. It is much easier to say which of two answers is better. How can the capstone turn such
        comparisons into training, cheaply and without a separate reward model?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Sample several responses to each prompt from the fine-tuned model, have a judge rank them, and form pairs of a
        clearly better and a clearly worse response. Direct preference optimisation then raises the log-probability of
        the better response relative to a frozen copy of the fine-tuned model, and lowers that of the worse one. Its loss
        is a logistic loss on the difference of those log-ratios, so pairs already ordered correctly by a wide margin
        stop pulling, and a temperature β controls how far the policy may move from where it started.
      </p>
      <DpoLossViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the DPO loss">
        <p>
          For a prompt with chosen response <M>{"y_w"}</M> and rejected response <M>{"y_l"}</M>, the implicit reward of a
          response is <M>{"\\beta(\\log \\pi_\\theta(y) - \\log \\pi_{\\text{ref}}(y))"}</M> (<C>implicit_reward</C>), and
          the loss is
        </p>
        <MD>{"-\\log \\sigma\\Big(\\beta\\big[\\log\\tfrac{\\pi_\\theta(y_w)}{\\pi_{\\text{ref}}(y_w)} - \\log\\tfrac{\\pi_\\theta(y_l)}{\\pi_{\\text{ref}}(y_l)}\\big]\\Big)"}</MD>
        <p>
          (<C>dpo_loss</C>), as derived in l9.5.1. The fraction of pairs whose implicit rewards are ordered correctly,
          the reward accuracy (<C>reward_accuracy</C>), is the main training signal to watch.
        </p>
        <Code>{DPO}</Code>
      </Definition>

      <Theorem title="the policy DPO aims at">
        <p>
          Among all policies π, the one maximising <M>{"\\mathbb{E}_{\\pi}[r(y)] - \\beta\\,\\mathrm{KL}(\\pi \\,\\|\\, \\pi_{\\text{ref}})"}</M>{" "}
          is <M>{"\\pi^*(y) = \\pi_{\\text{ref}}(y)\\,e^{r(y)/\\beta} / Z"}</M>, with Z normalising. Conversely, every
          policy of this form makes <M>{"\\beta \\log(\\pi^*/\\pi_{\\text{ref}})"}</M> equal to r up to a constant, which is
          why DPO can fit the reward through the policy itself.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write the objective as{" "}
          <M>{"\\sum_y \\pi(y)\\left[r(y) - \\beta \\log \\tfrac{\\pi(y)}{\\pi_{\\text{ref}}(y)}\\right] = -\\beta \\sum_y \\pi(y) \\log \\tfrac{\\pi(y)}{\\pi_{\\text{ref}}(y) e^{r(y)/\\beta}}"}</M>. With{" "}
          <M>{"\\pi^*"}</M> as defined this is <M>{"-\\beta\\,\\mathrm{KL}(\\pi \\,\\|\\, \\pi^*) + \\beta \\log Z"}</M>, which is
          largest exactly when <M>{"\\pi = \\pi^*"}</M>, since KL divergence is non-negative and zero only for equal
          distributions. Taking logarithms of <M>{"\\pi^*"}</M> gives{" "}
          <M>{"r(y) = \\beta \\log(\\pi^*(y)/\\pi_{\\text{ref}}(y)) + \\beta \\log Z"}</M>, and the constant cancels in the
          Bradley-Terry comparison of l9.3.2, leaving the DPO loss.
        </p>
      </Proof>

      <Definition title="building preference pairs">
        <p>
          With several sampled responses per prompt and a score for each from a judge, every pair whose scores differ by
          at least a margin becomes a (chosen, rejected) pair (<C>make_pairs</C>), as in l9.3.1. Judges favour longer
          answers, so the share of pairs in which the chosen response is longer (<C>longer_share</C>) is tracked and
          balanced. The result is measured by the win rate against the fine-tuned model on held-out prompts, counting a
          tie as half (<C>win_rate</C>).
        </p>
        <Code>{PREFS}</Code>
      </Definition>

      <Example title="the capstone preference round">
        <p>
          Four responses for each of 20000 prompts, sampled from the fine-tuned model, so the data is on-policy in the
          sense of l9.5.3; a larger open model as judge with a rubric, as in l9.6.3; pairs with a score margin of at least
          two on a ten-point scale, with length balanced; DPO with β = 0.1 for one epoch at a small learning rate. A second
          round, sampling from the improved model, usually helps more than a longer first round.
        </p>
      </Example>

      <Remark title="failure modes">
        <p>
          Reward accuracy near 100% with a falling log-probability for both chosen and rejected responses means the model
          is learning to separate the pair by making both less likely, which often shows up as degenerate outputs. Rising
          length with little gain in win rate means the judge&apos;s length bias is being learned. Both are caught by the
          held-out evaluations of the plan, run after every round.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "loss",
      rung: "check",
      prompt: (
        <p>
          The policy gives log-probabilities −12.0 and −15.0 to the chosen and rejected responses, and the reference gives
          −13.0 and −14.5. With β = 0.1, what is the DPO loss? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.621, tolerance: 0.0002 },
    },
    {
      key: "win",
      rung: "check",
      prompt: (
        <p>
          Against the fine-tuned model on 200 held-out prompts, the new model wins 112, ties 54 and loses 34. What is its
          win rate?
        </p>
      ),
      answer: { kind: "numeric", value: 0.695, tolerance: 0.0001 },
    },
    {
      key: "beta",
      rung: "apply",
      prompt: <p>What does increasing β do in DPO?</p>,
      answer: {
        kind: "choice",
        options: [
          "Pairs saturate at smaller changes in log-ratio, so the policy stays closer to the reference model",
          "It makes the policy ignore the reference model",
          "It increases the number of preference pairs",
          "It removes the need for rejected responses",
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

def implicit_reward(logp, logp_ref, beta):
    return beta * (logp - logp_ref)

def dpo_loss(pc, pr, rc, rr, beta):
    z = implicit_reward(pc, rc, beta) - implicit_reward(pr, rr, beta)
    return math.log1p(math.exp(-z))                        # -log sigmoid(z)

def reward_accuracy(batch, beta):
    return sum(implicit_reward(pc, rc, beta) > implicit_reward(pr, rr, beta)
               for pc, pr, rc, rr in batch) / len(batch)

print(implicit_reward(-3, -5, 0.5), round(dpo_loss(-1, -1, -1, -1, 0.1), 4))
print(reward_accuracy([(-1, -2, -1, -1), (-2, -1, -1, -1)], 1.0), round(dpo_loss(0, -10, 0, 0, 1), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.6931\n0.5 4.5e-05", "1.0 0.0\n0.5 4.5e-05", "-1.0 0.6931\n0.5 4.5e-05", "1.0 0.6931\n1.0 10.000045"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def make_pairs(scores, margin):
    return [(i, j) for i in range(len(scores)) for j in range(len(scores))
            if scores[i] - scores[j] >= margin]            # i preferred to j by a clear margin

def longer_share(pairs, lengths):
    return sum(lengths[i] > lengths[j] for i, j in pairs) / len(pairs)

def win_rate(results):
    return sum({"win": 1, "tie": 0.5, "loss": 0}[r] for r in results) / len(results)

print(make_pairs([3, 1, 2], 1), make_pairs([3, 1, 2], 2))
print(longer_share([(0, 1), (2, 1)], [5, 9, 7]), win_rate(["win", "tie", "loss", "win"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 1), (0, 2), (2, 1)] [(0, 1)]\n0.0 0.625",
          "[(0, 1), (0, 2)] [(0, 1)]\n0.0 0.625",
          "[(0, 1), (0, 2), (2, 1)] [(0, 1), (0, 2)]\n0.0 0.625",
          "[(0, 1), (0, 2), (2, 1)] [(0, 1)]\n0.5 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>implicit_reward(logp, logp_ref, beta)</C>; <C>dpo_loss(pc, pr, rc, rr, beta)</C> for policy and
          reference log-probabilities of the chosen and rejected responses; and <C>reward_accuracy(batch, beta)</C> over
          tuples (pc, pr, rc, rr), counting strict wins.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def implicit_reward(logp, logp_ref, beta):
    return logp

def dpo_loss(pc, pr, rc, rr, beta):
    return pr - pc

def reward_accuracy(batch, beta):
    return 1.0
`,
        solution: DPO,
        tests: [
          { name: "loss", code: `assert implicit_reward(-1, -4, 2) == 6 and abs(dpo_loss(-2, -2, -3, -1, 0.5) - math.log1p(math.exp(-1))) < 1e-12` },
          { name: "acc", code: `assert reward_accuracy([(0, 0, 0, 0), (-1, -3, -2, -2), (-5, -1, -2, -2)], 1) == 1 / 3 and abs(dpo_loss(0, 0, 0, 0, 3) - math.log(2)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>make_pairs(scores, margin)</C>, all (i, j) with score i at least margin above score j, ordered by i then
          j; <C>longer_share(pairs, lengths)</C>; and <C>win_rate(results)</C> over &quot;win&quot;, &quot;tie&quot; and
          &quot;loss&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def make_pairs(scores, margin):
    return []

def longer_share(pairs, lengths):
    return 0.5

def win_rate(results):
    return results.count("win") / len(results)
`,
        solution: PREFS,
        tests: [
          { name: "pairs", code: `assert make_pairs([1, 1], 0) == [(0, 0), (0, 1), (1, 0), (1, 1)] and make_pairs([5, 2, 4], 2) == [(0, 1), (2, 1)]` },
          { name: "rates", code: `assert longer_share([(0, 1), (1, 0)], [3, 3]) == 0 and win_rate(["tie", "tie"]) == 0.5 and win_rate(["loss", "win"]) == 0.5` },
        ],
      },
    },
    {
      key: "optimum",
      rung: "stretch",
      prompt: (
        <p>
          A prompt has two possible responses with reference probabilities 0.6 and 0.4 and rewards 1 and 2. With β = 0.5,
          what probability does the optimal KL-regularised policy give the second response? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8313, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Preferences shape style and helpfulness. For arithmetic and code there is something better than a judge: an
        answer that can be checked. The next lesson trains on such verifiable rewards.
      </p>
    </>
  ),
};
