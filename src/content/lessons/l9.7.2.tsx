import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GroupSignalViz } from "@/components/viz/GroupSignalViz";
import type { LessonContent } from "@/lib/types";

const GRPO = `import math

def group_advantages(rewards, eps=1e-6):
    m = sum(rewards) / len(rewards)
    sd = math.sqrt(sum((r - m) ** 2 for r in rewards) / len(rewards))
    return [(r - m) / (sd + eps) for r in rewards]

def grpo_token_loss(ratio, adv, eps_lo, eps_hi):
    clipped = min(max(ratio, 1 - eps_lo), 1 + eps_hi)
    return -min(ratio * adv, clipped * adv)

def k3(logp_policy, logp_ref):
    d = logp_ref - logp_policy
    return math.exp(d) - d - 1`;

const AGG = `def seq_mean_loss(token_losses_per_seq):
    return sum(sum(s) / len(s) for s in token_losses_per_seq) / len(token_losses_per_seq)

def token_mean_loss(token_losses_per_seq):
    return sum(sum(s) for s in token_losses_per_seq) / sum(len(s) for s in token_losses_per_seq)

def keep_group(rewards):
    return len(set(rewards)) > 1`;

export const lesson: LessonContent = {
  id: "l9.7.2",
  minutes: 55,
  links: {
    requires: ["l9.7.1", "l9.4.1"],
    revisits: ["l9.4.2", "l9.5.3"],
    foreshadows: ["l9.7.3", "l9.7.4"],
  },

  puzzle: (
    <>
      <p>
        PPO for language models carries a value network as large as the policy, trained to predict how a response will be
        scored from each prefix. For a maths problem, that means guessing midway through a derivation whether the final answer
        will be right, which is hard, and the guess feeds every advantage. DeepSeek&apos;s mathematics work in 2024 dropped the value
        network entirely: sample several answers to the same problem and judge each against its siblings. The method, GRPO,
        trained DeepSeek-R1. Why does comparing siblings work, and what did later work find wrong with its details?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The value network&apos;s job is to supply a baseline: how good a response to this prompt is expected to be. The average reward
        of a handful of samples for the same prompt estimates exactly that, with no learning. Answers better than their group&apos;s
        average are reinforced and worse ones discouraged, and every token of an answer shares its answer&apos;s advantage. When all
        samples agree, all right or all wrong, there is nothing to learn from that prompt, so group size and the difficulty of
        the prompts decide how much signal a batch carries.
      </p>
      <GroupSignalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the GRPO objective">
        <p>
          For a prompt, sample G responses <M>{"o_1, \\dots, o_G"}</M> from <M>{"\\pi_{\\text{old}}"}</M> with rewards <M>{"r_i"}</M>. Set{" "}
          <M>{"\\hat A_i = (r_i - \\bar r)/\\mathrm{std}(r)"}</M> for every token of <M>{"o_i"}</M> (<C>group_advantages</C>). With ratio{" "}
          <M>{"\\rho_{i,t} = \\pi_\\theta(o_{i,t} \\mid \\cdot)/\\pi_{\\text{old}}(o_{i,t} \\mid \\cdot)"}</M>, GRPO maximises
        </p>
        <MD>{"\\frac{1}{G}\\sum_{i}\\frac{1}{|o_i|}\\sum_t\\Big[\\min\\big(\\rho_{i,t}\\hat A_i,\\ \\mathrm{clip}(\\rho_{i,t}, 1-\\epsilon, 1+\\epsilon)\\hat A_i\\big) - \\beta\\, k_3\\Big]"}</MD>
        <p>
          where <M>{"k_3"}</M> is the per-token KL estimate against the reference from l9.4.2 (<C>k3</C>), placed in the loss rather than
          in the reward. DAPO uses an asymmetric clip with a larger upper bound, so that unlikely tokens in good answers can grow
          faster (<C>grpo_token_loss</C>).
        </p>
        <Code>{GRPO}</Code>
      </Definition>

      <Theorem title="a baseline from siblings">
        <p>
          With a leave-one-out baseline <M>{"b_i = \\frac{1}{G-1}\\sum_{j \\ne i} r_j"}</M>, the estimator{" "}
          <M>{"\\sum_i (r_i - b_i)\\nabla\\log\\pi(o_i)"}</M> is unbiased for <M>{"G\\,\\nabla\\mathbb{E}[r]"}</M>, and{" "}
          <M>{"r_i - b_i = \\frac{G}{G-1}(r_i - \\bar r)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"b_i"}</M> depends only on the other samples, which are independent of <M>{"o_i"}</M>, so{" "}
          <M>{"\\mathbb{E}[b_i\\nabla\\log\\pi(o_i)] = \\mathbb{E}[b_i]\\,\\mathbb{E}[\\nabla\\log\\pi(o_i)] = 0"}</M>, since the score has mean
          zero (l6.6.2). The identity follows from <M>{"\\sum_{j\\ne i} r_j = G\\bar r - r_i"}</M>:{" "}
          <M>{"r_i - \\frac{G\\bar r - r_i}{G-1} = \\frac{G(r_i - \\bar r)}{G-1}"}</M>. So subtracting the group mean is the leave-one-out
          baseline of RLOO (l9.5.3) up to a constant factor. Dividing by the group&apos;s standard deviation is not covered by this
          argument; it reweights prompts and introduces a small bias.
        </p>
      </Proof>

      <Remark title="what later work changed">
        <p>
          Averaging each response&apos;s token losses before averaging over responses (<C>seq_mean_loss</C>) gives each token of a short
          response more weight than a token of a long one; a long wrong answer is penalised less per token, which lets wrong
          answers grow longer. DAPO and Dr. GRPO average over all tokens in the batch instead (<C>token_mean_loss</C>). Dr. GRPO also
          drops the division by the standard deviation, which over-weights prompts that are nearly always or nearly never
          solved, as the visualisation shows. DAPO filters out groups whose rewards are all equal and samples more until the batch
          is full (<C>keep_group</C>), and many recipes drop the KL term for verifiable rewards, since there is no reward model to
          over-optimise.
        </p>
        <Code>{AGG}</Code>
      </Remark>

      <Example title="a group of four">
        <p>
          Rewards 1, 0, 0, 0: mean 0.25, standard deviation <M>{"\\sqrt{0.25 \\cdot 0.75} \\approx 0.433"}</M>. The correct answer gets
          advantage 1.732 on every token and each wrong one −0.577. If all four had been wrong, every advantage would be 0 and the
          prompt would contribute only the KL term.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "adv",
      rung: "check",
      prompt: (
        <p>
          A group of 8 answers has 3 correct (reward 1) and 5 wrong (reward 0). Using the population standard deviation, what is the
          GRPO advantage of a correct answer? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.291, tolerance: 0.001 },
    },
    {
      key: "clip",
      rung: "check",
      prompt: (
        <p>
          A token has ratio 1.25 and advantage 1. With lower clip 0.2 and upper clip 0.28, what is its loss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -1.25, tolerance: 0.001 },
    },
    {
      key: "value",
      rung: "apply",
      prompt: <p>What does GRPO gain by replacing PPO&apos;s value network with the group mean?</p>,
      answer: {
        kind: "choice",
        options: [
          "It saves the memory and compute of a policy-sized value model and avoids a learned baseline that is hard to fit for long reasoning, at the cost of sampling several responses per prompt",
          "Its gradient estimate has zero variance",
          "It no longer needs a reward",
          "It makes the KL penalty unnecessary in every setting",
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

def group_advantages(rewards, eps=1e-6):
    m = sum(rewards) / len(rewards)
    sd = math.sqrt(sum((r - m) ** 2 for r in rewards) / len(rewards))
    return [(r - m) / (sd + eps) for r in rewards]

def grpo_token_loss(ratio, adv, eps_lo, eps_hi):
    clipped = min(max(ratio, 1 - eps_lo), 1 + eps_hi)
    return -min(ratio * adv, clipped * adv)

def k3(logp_policy, logp_ref):
    d = logp_ref - logp_policy
    return math.exp(d) - d - 1

print(group_advantages([1.0, 1.0, 1.0]), [round(a, 3) for a in group_advantages([1.0, 0.0])])
print(grpo_token_loss(1.5, 2.0, 0.2, 0.28), grpo_token_loss(0.5, -1.0, 0.2, 0.28), round(k3(-1.0, -1.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, 0.0] [1.0, -1.0]\n-2.56 0.8 0.0",
          "[0.0, 0.0, 0.0] [0.5, -0.5]\n-2.56 0.8 0.0",
          "[0.0, 0.0, 0.0] [1.0, -1.0]\n-2.4 0.8 0.0",
          "[0.0, 0.0, 0.0] [1.0, -1.0]\n-2.56 0.5 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def seq_mean_loss(token_losses_per_seq):
    return sum(sum(s) / len(s) for s in token_losses_per_seq) / len(token_losses_per_seq)

def token_mean_loss(token_losses_per_seq):
    return sum(sum(s) for s in token_losses_per_seq) / sum(len(s) for s in token_losses_per_seq)

def keep_group(rewards):
    return len(set(rewards)) > 1

print(seq_mean_loss([[1.0, 1.0], [4.0]]), token_mean_loss([[1.0, 1.0], [4.0]]))
print(keep_group([1, 1, 1]), keep_group([0, 1, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.5 2.0\nFalse True",
          "2.0 2.5\nFalse True",
          "2.5 2.0\nTrue True",
          "3.0 2.0\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>group_advantages(rewards, eps=1e-6)</C> with the population standard deviation, <C>grpo_token_loss(ratio, adv, eps_lo, eps_hi)</C>{" "}
          and <C>k3(logp_policy, logp_ref)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def group_advantages(rewards, eps=1e-6):
    m = sum(rewards) / len(rewards)
    return [r - m for r in rewards]

def grpo_token_loss(ratio, adv, eps_lo, eps_hi):
    return -ratio * adv

def k3(logp_policy, logp_ref):
    return logp_policy - logp_ref
`,
        solution: GRPO,
        tests: [
          { name: "adv", code: `a = group_advantages([4.0, 0.0, 4.0, 0.0])\nassert all(abs(x - y) < 1e-5 for x, y in zip(a, [1, -1, 1, -1])) and group_advantages([3.0, 3.0]) == [0.0, 0.0]` },
          { name: "loss", code: `assert abs(grpo_token_loss(2.0, 1.0, 0.2, 0.3) + 1.3) < 1e-12 and abs(grpo_token_loss(0.5, -2.0, 0.2, 0.3) - 1.6) < 1e-12 and abs(k3(-2.0, -2.0 + math.log(2)) - (1 - math.log(2))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seq_mean_loss(token_losses_per_seq)</C>, <C>token_mean_loss(token_losses_per_seq)</C> and <C>keep_group(rewards)</C>, which is
          False when every reward in the group is equal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def seq_mean_loss(token_losses_per_seq):
    return sum(sum(s) for s in token_losses_per_seq)

def token_mean_loss(token_losses_per_seq):
    return seq_mean_loss(token_losses_per_seq)

def keep_group(rewards):
    return True
`,
        solution: AGG,
        tests: [
          { name: "agg", code: `L = [[2.0, 2.0, 2.0], [0.0]]\nassert seq_mean_loss(L) == 1.0 and token_mean_loss(L) == 1.5` },
          { name: "keep", code: `assert keep_group([0.0, 0.0, 0.0, 0.0]) is False and keep_group([0.0, 1.0]) is True` },
        ],
      },
    },
    {
      key: "informative",
      rung: "stretch",
      prompt: (
        <p>
          A policy solves a hard prompt 5% of the time. With groups of 16, what is the probability that a group contains both correct
          and incorrect answers? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.56, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        GRPO with verifiable rewards, applied at scale to a strong base model, produced something unexpected: answers that grew
        longer and began to check and correct themselves. The next lesson looks at that emergence.
      </p>
    </>
  ),
};
