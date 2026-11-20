import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OnlineDpoViz } from "@/components/viz/OnlineDpoViz";
import type { LessonContent } from "@/lib/types";

const ONLINE = `import math

def rloo_advantages(rewards):
    k, s = len(rewards), sum(rewards)
    return [r - (s - r) / (k - 1) for r in rewards]

def best_worst_pair(scores):
    best = max(range(len(scores)), key=lambda i: scores[i])
    worst = min(range(len(scores)), key=lambda i: scores[i])
    return best, worst

def ess_fraction(log_weights):
    m = max(log_weights)
    w = [math.exp(x - m) for x in log_weights]
    return sum(w) ** 2 / sum(x * x for x in w) / len(w)`;

const EVAL = `def reinforce_loss(logps, advantages):
    return -sum(l * a for l, a in zip(logps, advantages)) / len(logps)

def win_rate(scores_a, scores_b):
    total = 0.0
    for a, b in zip(scores_a, scores_b):
        total += 1.0 if a > b else 0.5 if a == b else 0.0
    return total / len(scores_a)

def logp_drift(logps_now, logps_then):
    return sum(a - b for a, b in zip(logps_now, logps_then)) / len(logps_now)`;

export const lesson: LessonContent = {
  id: "l9.5.3",
  minutes: 50,
  links: {
    requires: ["l9.5.2", "l6.6.2"],
    revisits: ["m13.1.3", "l9.2.3"],
    foreshadows: ["l9.6.2", "l9.7.2"],
  },

  puzzle: (
    <>
      <p>
        DPO is simple and stable, and on public benchmarks it often matched PPO. Yet the strongest chat models of 2024 still used
        reinforcement learning, and careful comparisons found well-tuned PPO ahead of DPO, especially on reasoning and code. The
        two optimise the same objective. If the loss is not the difference, what is? The answer lies in where the training
        responses come from.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        PPO trains on responses the current policy just wrote, scored by a reward model: it learns from its own mistakes. Offline
        DPO trains on a fixed set of pairs, often written by other models long ago. Those pairs say little about responses the
        policy now prefers, so its errors there go uncorrected, and the best responses, if the data rarely contains them, are
        never reinforced. Online variants of DPO close most of the gap by sampling fresh responses from the policy, scoring them
        with a reward model or a judge, and forming new pairs every round.
      </p>
      <OnlineDpoViz />
    </>
  ),

  theory: (
    <>
      <Definition title="on-policy, off-policy, online, offline">
        <p>
          Data is <em>on-policy</em> if it was sampled from the current policy, <em>off-policy</em> otherwise. A method is{" "}
          <em>online</em> if it collects new data during training, <em>offline</em> if it learns from a fixed dataset. PPO is online and
          nearly on-policy; DPO on a static preference set is offline and off-policy; iterative DPO, which regenerates pairs every
          round from the latest model, sits between.
        </p>
      </Definition>

      <Theorem title="off-policy data covers what its source wrote">
        <p>
          If the data distribution <M>{"\\mu"}</M> gives zero probability to a response y, no loss computed from samples of{" "}
          <M>{"\\mu"}</M> carries information about y&apos;s reward, and importance weighting cannot recover expectations under a policy{" "}
          <M>{"\\pi"}</M> that puts mass on y.
        </p>
      </Theorem>
      <Proof>
        <p>
          Importance sampling (m13.1.3) writes <M>{"\\mathbb{E}_\\pi[f] = \\mathbb{E}_\\mu[f\\,\\pi/\\mu]"}</M>, which needs{" "}
          <M>{"\\mu(y) > 0"}</M> wherever <M>{"\\pi(y)f(y) \\ne 0"}</M>. If <M>{"\\mu(y) = 0"}</M>, y never appears in the data and the
          identity fails by the term <M>{"\\pi(y)f(y)"}</M>. When <M>{"\\mu(y)"}</M> is merely tiny the identity holds but the weights are
          enormous and the estimate is dominated by a few samples; the effective sample size,{" "}
          <M>{"(\\sum w)^2/\\sum w^2"}</M> (<C>ess_fraction</C>, as a share of n), measures how much of the data is really usable.
        </p>
      </Proof>

      <Definition title="online preference methods">
        <p>
          Online DPO samples k responses per prompt from the current policy, scores them with a reward model or LLM judge, and
          pairs the highest with the lowest (<C>best_worst_pair</C>); iterating this, as in self-rewarding language models, gives
          on-policy pairs every round. An alternative that keeps the reward model but drops PPO&apos;s value network is REINFORCE with a
          leave-one-out baseline: each sample&apos;s advantage is its reward minus the mean of the other k − 1 (<C>rloo_advantages</C>).
          Ahmadian et al. (2024) found it matched or beat PPO for RLHF at a fraction of the memory.
        </p>
        <Code>{ONLINE}</Code>
      </Definition>

      <Remark title="what the comparisons found">
        <p>
          Xu et al. (2024) found PPO, properly tuned, ahead of DPO on dialogue and code, and showed DPO can put probability on
          responses absent from the data. Tajwar et al. (2024) found that on-policy sampling and losses that push down on bad
          responses both help, and that their benefits add. Offline methods remain useful as a cheap first stage, and the gap
          shrinks when the offline data comes from a model close to the policy. Progress is measured by win rate against a
          fixed baseline under a judge (<C>win_rate</C>), and drift by how far log-probabilities of the data have moved
          (<C>logp_drift</C>). The policy gradient itself is the REINFORCE loss of l6.6.2 (<C>reinforce_loss</C>).
        </p>
        <Code>{EVAL}</Code>
      </Remark>

      <Example title="the leave-one-out baseline">
        <p>
          Four samples score 2, 0, 1 and 1. The baseline for the first is the mean of 0, 1 and 1, two thirds, so its advantage is
          4/3. The baseline excludes the sample&apos;s own reward, so it is independent of that sample and the gradient stays unbiased;
          the advantages sum to zero.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rloo",
      rung: "check",
      prompt: <p>Four samples for a prompt get rewards 1.0, 0.0, 0.5 and 0.2. What is the RLOO advantage of the first? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.767, tolerance: 0.001 },
    },
    {
      key: "ess",
      rung: "check",
      prompt: (
        <p>
          Three off-policy samples have importance weights proportional to 1, 2 and 5. What is the effective sample size as a share
          of the three? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.711, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: (
        <p>
          A team&apos;s offline DPO model improves on its preference set but, judged on its own samples, keeps making one kind of
          error that is rare in the dataset. What is the most direct fix?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Sample responses from the current model, score them with a reward model or judge, and train on fresh pairs, so its own errors appear as rejected responses",
          "Train for more epochs on the same pairs",
          "Raise β so that the model stays closer to the reference",
          "Remove the reference model as in SimPO",
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

def rloo_advantages(rewards):
    k, s = len(rewards), sum(rewards)
    return [r - (s - r) / (k - 1) for r in rewards]

def best_worst_pair(scores):
    best = max(range(len(scores)), key=lambda i: scores[i])
    worst = min(range(len(scores)), key=lambda i: scores[i])
    return best, worst

def ess_fraction(log_weights):
    m = max(log_weights)
    w = [math.exp(x - m) for x in log_weights]
    return sum(w) ** 2 / sum(x * x for x in w) / len(w)

print(rloo_advantages([1.0, 0.0, 0.0]), best_worst_pair([0.2, 0.9, -0.4, 0.9]))
print(ess_fraction([0.0, 0.0, 0.0]), round(ess_fraction([0.0, 1000.0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, -0.5, -0.5] (1, 2)\n1.0 0.5",
          "[0.667, -0.333, -0.333] (1, 2)\n1.0 0.5",
          "[1.0, -0.5, -0.5] (3, 2)\n1.0 0.5",
          "[1.0, -0.5, -0.5] (1, 2)\n0.333 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reinforce_loss(logps, advantages):
    return -sum(l * a for l, a in zip(logps, advantages)) / len(logps)

def win_rate(scores_a, scores_b):
    total = 0.0
    for a, b in zip(scores_a, scores_b):
        total += 1.0 if a > b else 0.5 if a == b else 0.0
    return total / len(scores_a)

def logp_drift(logps_now, logps_then):
    return sum(a - b for a, b in zip(logps_now, logps_then)) / len(logps_now)

print(reinforce_loss([-1.0, -2.0], [1.0, -1.0]), win_rate([1, 2, 3], [1, 3, 0]))
print(logp_drift([-3.0, -1.0], [-2.0, -2.0]), win_rate([5], [4]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.5 0.5\n0.0 1.0",
          "0.5 0.5\n0.0 1.0",
          "-0.5 0.333\n0.0 1.0",
          "-0.5 0.5\n-1.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rloo_advantages(rewards)</C>, <C>best_worst_pair(scores)</C>, returning the indices of the first highest and first lowest
          scores, and <C>ess_fraction(log_weights)</C>, computed stably from log-weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rloo_advantages(rewards):
    m = sum(rewards) / len(rewards)
    return [r - m for r in rewards]

def best_worst_pair(scores):
    return 0, len(scores) - 1

def ess_fraction(log_weights):
    w = [math.exp(x) for x in log_weights]
    return sum(w) / len(w)
`,
        solution: ONLINE,
        tests: [
          { name: "rloo", code: `a = rloo_advantages([3.0, 0.0, 0.0, 1.0])\nassert all(abs(x - y) < 1e-12 for x, y in zip(a, [8 / 3, -4 / 3, -4 / 3, 0.0]))\nassert best_worst_pair([0.5, 0.1, 0.9, 0.1]) == (2, 1)` },
          { name: "ess", code: `assert abs(ess_fraction([0.0, math.log(3)]) - 16 / 20) < 1e-12 and abs(ess_fraction([2000.0, 2000.0]) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reinforce_loss(logps, advantages)</C>, the negated mean of their products, <C>win_rate(scores_a, scores_b)</C> with ties
          counting half, and <C>logp_drift(logps_now, logps_then)</C>, the mean difference.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reinforce_loss(logps, advantages):
    return sum(logps) / len(logps)

def win_rate(scores_a, scores_b):
    return sum(a > b for a, b in zip(scores_a, scores_b)) / len(scores_a)

def logp_drift(logps_now, logps_then):
    return 0.0
`,
        solution: EVAL,
        tests: [
          { name: "loss", code: `assert abs(reinforce_loss([-2.0, -1.0], [0.5, 2.0]) - 1.5) < 1e-12 and abs(logp_drift([-1.0, -4.0], [-2.0, -2.0]) + 0.5) < 1e-12` },
          { name: "win", code: `assert win_rate([1, 1, 2, 0], [1, 0, 3, 0]) == 0.5` },
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: (
        <p>
          A policy answers a maths prompt correctly with probability 0.1. Online DPO samples 8 answers, checks them, and can form a
          pair only if at least one is right and one is wrong. With what probability does the prompt yield a pair? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.57, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Online methods need a scorer for fresh samples. Collecting human labels for every round is slow and costly, so the next
        module turns to models that give feedback themselves.
      </p>
    </>
  ),
};
