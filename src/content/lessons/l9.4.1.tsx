import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TokenCreditViz } from "@/components/viz/TokenCreditViz";
import type { LessonContent } from "@/lib/types";

const CORE = `import math

def token_rewards(rm_score, logp_policy, logp_ref, beta):
    r = [-beta * (p - q) for p, q in zip(logp_policy, logp_ref)]
    r[-1] += rm_score
    return r

def gae(rewards, values, gamma, lam):
    adv = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        v_next = values[t + 1] if t + 1 < len(values) else 0.0
        delta = rewards[t] + gamma * v_next - values[t]
        running = delta + gamma * lam * running
        adv[t] = running
    return adv

def ppo_clip_loss(logp_new, logp_old, adv, mask, eps):
    total, count = 0.0, 0
    for ln, lo, a, m in zip(logp_new, logp_old, adv, mask):
        if m:
            ratio = math.exp(ln - lo)
            clipped = min(max(ratio, 1 - eps), 1 + eps)
            total += min(ratio * a, clipped * a)
            count += 1
    return -total / count`;

const TRICKS = `import math

def whiten(xs):
    m = sum(xs) / len(xs)
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))
    return [(x - m) / (sd + 1e-8) for x in xs]

def clip_fraction(logp_new, logp_old, eps):
    ratios = [math.exp(a - b) for a, b in zip(logp_new, logp_old)]
    return sum(abs(r - 1) > eps for r in ratios) / len(ratios)

def value_loss_clipped(v_new, v_old, returns, eps):
    total = 0.0
    for vn, vo, R in zip(v_new, v_old, returns):
        vc = min(max(vn, vo - eps), vo + eps)
        total += max((vn - R) ** 2, (vc - R) ** 2)
    return 0.5 * total / len(v_new)`;

export const lesson: LessonContent = {
  id: "l9.4.1",
  minutes: 55,
  links: {
    requires: ["l9.3.3", "l6.7.3"],
    revisits: ["l6.7.4", "l9.1.1"],
    foreshadows: ["l9.4.2", "l9.4.3", "l9.7.2"],
  },

  puzzle: (
    <>
      <p>
        PPO was designed for robots and video games, where an agent takes an action, the world changes, and a reward arrives.
        A language model writes a response one token at a time and receives a single number from the reward model at the end.
        To use PPO, someone has to decide what the states, actions and rewards are, which of the hundreds of tokens deserve
        credit for that one number, and how to stop the policy drifting into text the reward model was never trained on.
        InstructGPT&apos;s answers to these questions became the template for RLHF. What are they?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Treat each token as an action and the prompt plus the tokens so far as the state. The episode ends at the end of the
        response. The reward model&apos;s score arrives at the last token, and every token also pays a small penalty for moving away
        from the supervised model, so the sum of rewards is the score minus a KL term. A value head, a second output on a copy of
        the network, predicts the expected final reward from each prefix, and GAE (l6.7.3) turns the differences between
        consecutive predictions into a per-token advantage. The clipped PPO update then raises the probability of tokens with
        positive advantage and lowers the rest, a few steps at a time on each batch of fresh samples.
      </p>
      <TokenCreditViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the token-level MDP">
        <p>
          State <M>{"s_t = (x, y_{<t})"}</M>, action <M>{"a_t = y_t"}</M>, deterministic transitions by appending the token, and
          episode end at the end-of-sequence token or a length cap. With reward score <M>{"r_\\phi(x, y)"}</M> and coefficient{" "}
          <M>{"\\beta"}</M>, the per-token reward is
        </p>
        <MD>{"r_t = -\\beta \\log\\frac{\\pi_\\theta(y_t \\mid s_t)}{\\pi_{\\text{ref}}(y_t \\mid s_t)} + [t = T]\\, r_\\phi(x, y)"}</MD>
        <p>
          (<C>token_rewards</C>). With <M>{"\\gamma = 1"}</M> the return from the first token is{" "}
          <M>{"r_\\phi(x, y) - \\beta \\log\\frac{\\pi_\\theta(y \\mid x)}{\\pi_{\\text{ref}}(y \\mid x)}"}</M>, whose expectation is the
          KL-regularised objective of l6.7.4.
        </p>
      </Definition>

      <Definition title="advantages and the update">
        <p>
          A value head <M>{"V_\\psi(s_t)"}</M> is trained to predict returns. GAE computes{" "}
          <M>{"\\delta_t = r_t + \\gamma V(s_{t+1}) - V(s_t)"}</M> and <M>{"\\hat A_t = \\delta_t + \\gamma\\lambda \\hat A_{t+1}"}</M>, with zero
          value after the last token (<C>gae</C>). The policy minimises the clipped surrogate averaged over response tokens only, so
          prompt and padding tokens are masked out (<C>ppo_clip_loss</C>). Common settings are <M>{"\\gamma = 1"}</M>,{" "}
          <M>{"\\lambda = 0.95"}</M>, <M>{"\\epsilon = 0.2"}</M>, and a few epochs of minibatch updates per batch of rollouts.
        </p>
        <Code>{CORE}</Code>
      </Definition>

      <Theorem title="telescoping with λ = 1">
        <p>
          With <M>{"\\gamma = \\lambda = 1"}</M> and zero value after the last token, <M>{"\\hat A_t = \\sum_{k \\ge t} r_k - V(s_t)"}</M>,
          the Monte Carlo return minus a baseline, whatever the other values are.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling, <M>{"\\hat A_t = \\sum_{k \\ge t} \\delta_k = \\sum_{k \\ge t} r_k + \\sum_{k \\ge t}(V(s_{k+1}) - V(s_k))"}</M>. The second sum
          telescopes to <M>{"V(s_{T+1}) - V(s_t) = -V(s_t)"}</M>. Every intermediate value cancels, so errors in them add no bias; they
          reappear only when <M>{"\\lambda < 1"}</M>, in exchange for lower variance.
        </p>
      </Proof>

      <Remark title="four models in memory">
        <p>
          RLHF with PPO holds the policy being trained, the frozen reference (the supervised model), the frozen reward model and the
          value model, often initialised from the reward model. Each step generates responses from the policy, which is slow
          autoregressive sampling, scores them with the reward model, computes log-probabilities under the policy and reference,
          estimates values, and then runs the updates. Generation usually dominates the time, which is why later systems run it on
          an inference engine and send the samples to a separate trainer.
        </p>
      </Remark>

      <Definition title="stabilising details">
        <p>
          Advantages are whitened per batch (<C>whiten</C>). The fraction of tokens whose ratio leaves{" "}
          <M>{"[1-\\epsilon, 1+\\epsilon]"}</M> is tracked as a health signal (<C>clip_fraction</C>); a large value means the policy moved
          too far within the batch. The value loss is clipped like the policy loss, around the old value prediction
          (<C>value_loss_clipped</C>). InstructGPT also mixed in a pretraining language-modelling loss, which it called PPO-ptx, to
          limit regressions on public benchmarks, the alignment tax.
        </p>
        <Code>{TRICKS}</Code>
      </Definition>

      <Example title="one response, by hand">
        <p>
          A three-token response gets rewards 0, 0 and 1.5 and values 1.0, 1.0 and 1.0. With <M>{"\\gamma = 1"}</M> and{" "}
          <M>{"\\lambda = 0"}</M> the advantages are the TD errors 0, 0 and 0.5: only the last token is credited. With{" "}
          <M>{"\\lambda = 1"}</M> each is 1.5 minus its value, 0.5 for every token.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "gae",
      rung: "check",
      prompt: (
        <p>
          A response has token rewards 0, 0 and 2 and values 0.5, 0.8 and 1.2, with zero value after the last token. With{" "}
          <M>{"\\gamma = 1"}</M> and <M>{"\\lambda = 0.9"}</M>, what is the advantage of the first token? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.308, tolerance: 0.001 },
    },
    {
      key: "ret",
      rung: "check",
      prompt: (
        <p>
          A four-token response has per-token log-ratios <M>{"\\log \\pi_\\theta/\\pi_{\\text{ref}}"}</M> of 0.4, 0.1, −0.2 and 0.5, a reward
          model score of 1.2, and <M>{"\\beta = 0.1"}</M>. What is the sum of its token rewards? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.12, tolerance: 0.001 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>Why is the PPO loss averaged only over response tokens, with the prompt masked out?</p>,
      answer: {
        kind: "choice",
        options: [
          "The prompt tokens were not sampled by the policy, so they are not actions and have no advantage; including them would push probability around on text the policy did not choose",
          "Prompt tokens are too expensive to process",
          "The reward model cannot read the prompt",
          "Masking makes the KL penalty zero",
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

def token_rewards(rm_score, logp_policy, logp_ref, beta):
    r = [-beta * (p - q) for p, q in zip(logp_policy, logp_ref)]
    r[-1] += rm_score
    return r

def gae(rewards, values, gamma, lam):
    adv = [0.0] * len(rewards)
    running = 0.0
    for t in reversed(range(len(rewards))):
        v_next = values[t + 1] if t + 1 < len(values) else 0.0
        delta = rewards[t] + gamma * v_next - values[t]
        running = delta + gamma * lam * running
        adv[t] = running
    return adv

def ppo_clip_loss(logp_new, logp_old, adv, mask, eps):
    total, count = 0.0, 0
    for ln, lo, a, m in zip(logp_new, logp_old, adv, mask):
        if m:
            ratio = math.exp(ln - lo)
            clipped = min(max(ratio, 1 - eps), 1 + eps)
            total += min(ratio * a, clipped * a)
            count += 1
    return -total / count

print(token_rewards(1.0, [-1.0, -2.0], [-1.5, -2.0], 0.1))
print([round(a, 3) for a in gae([0.0, 1.0], [0.5, 0.5], 1.0, 1.0)], ppo_clip_loss([0.0, 0.0], [0.0, 0.0], [9.0, 2.0], [0, 1], 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.05, 1.0]\n[0.5, 0.5] -2.0",
          "[0.05, 1.0]\n[0.5, 0.5] -2.0",
          "[-0.05, 1.0]\n[0.0, 0.5] -2.0",
          "[-0.05, 1.0]\n[0.5, 0.5] -5.5",
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

def whiten(xs):
    m = sum(xs) / len(xs)
    sd = math.sqrt(sum((x - m) ** 2 for x in xs) / len(xs))
    return [(x - m) / (sd + 1e-8) for x in xs]

def clip_fraction(logp_new, logp_old, eps):
    ratios = [math.exp(a - b) for a, b in zip(logp_new, logp_old)]
    return sum(abs(r - 1) > eps for r in ratios) / len(ratios)

def value_loss_clipped(v_new, v_old, returns, eps):
    total = 0.0
    for vn, vo, R in zip(v_new, v_old, returns):
        vc = min(max(vn, vo - eps), vo + eps)
        total += max((vn - R) ** 2, (vc - R) ** 2)
    return 0.5 * total / len(v_new)

print([round(x, 3) for x in whiten([1.0, 3.0])], clip_fraction([0.0, 0.5, -0.1], [0.0, 0.0, 0.0], 0.2))
print(round(value_loss_clipped([1.0], [0.0], [1.0], 0.2), 3), round(value_loss_clipped([0.1], [0.0], [1.0], 0.2), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1.0, 1.0] 0.3333333333333333\n0.32 0.405",
          "[-1.0, 1.0] 0.6666666666666666\n0.32 0.405",
          "[-1.0, 1.0] 0.3333333333333333\n0.0 0.405",
          "[-0.5, 0.5] 0.3333333333333333\n0.32 0.32",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>token_rewards(rm_score, logp_policy, logp_ref, beta)</C>, <C>gae(rewards, values, gamma, lam)</C> with zero value after
          the last token, and <C>ppo_clip_loss(logp_new, logp_old, adv, mask, eps)</C>, the negated clipped objective averaged over
          tokens with a true mask.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def token_rewards(rm_score, logp_policy, logp_ref, beta):
    return [0.0] * (len(logp_policy) - 1) + [rm_score]

def gae(rewards, values, gamma, lam):
    return [r - v for r, v in zip(rewards, values)]

def ppo_clip_loss(logp_new, logp_old, adv, mask, eps):
    return -sum(math.exp(a - b) * c for a, b, c in zip(logp_new, logp_old, adv)) / len(adv)
`,
        solution: CORE,
        tests: [
          { name: "rew", code: `r = token_rewards(2.0, [-1.0, -0.5, -0.2], [-1.2, -0.5, -0.6], 0.5)\nassert all(abs(a - b) < 1e-12 for a, b in zip(r, [-0.1, 0.0, 1.8]))\na = gae([0.0, 0.0, 1.0], [0.2, 0.4, 0.6], 1.0, 0.5)\nassert all(abs(x - y) < 1e-12 for x, y in zip(a, [0.4, 0.4, 0.4]))` },
          { name: "clip", code: `l = ppo_clip_loss([0.9, math.log(1.5), math.log(0.5)], [0.0, 0.0, 0.0], [7.0, 1.0, -1.0], [0, 1, 1], 0.2)\nassert abs(l - (-(1.2 - 0.8) / 2)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>whiten(xs)</C> using the population standard deviation plus 1e-8, <C>clip_fraction(logp_new, logp_old, eps)</C>, and{" "}
          <C>value_loss_clipped(v_new, v_old, returns, eps)</C>, half the mean of the larger of the unclipped and clipped squared errors.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def whiten(xs):
    return list(xs)

def clip_fraction(logp_new, logp_old, eps):
    return 0.0

def value_loss_clipped(v_new, v_old, returns, eps):
    return 0.5 * sum((v - R) ** 2 for v, R in zip(v_new, returns)) / len(v_new)
`,
        solution: TRICKS,
        tests: [
          { name: "white", code: `w = whiten([2.0, 4.0, 6.0, 8.0])\nassert abs(sum(w)) < 1e-9 and abs(sum(x * x for x in w) / 4 - 1) < 1e-6\nassert abs(clip_fraction([0.0, 0.3, -0.3, 0.1], [0.0] * 4, 0.2) - 0.5) < 1e-12` },
          { name: "value", code: `assert abs(value_loss_clipped([2.0, 0.5], [0.0, 0.4], [2.0, 0.5], 0.5) - 0.5 * 2.25 / 2) < 1e-12` },
        ],
      },
    },
    {
      key: "maskloss",
      rung: "stretch",
      prompt: (
        <p>
          Three tokens have log-ratios to the old policy of 0.9, 0.25 and −0.4, advantages 5, 2 and 1, and mask 0, 1 and 1. With{" "}
          <M>{"\\epsilon = 0.2"}</M>, what is the PPO loss? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -1.535, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The KL term was folded into the reward here with a fixed <M>{"\\beta"}</M>. The next lesson looks at it closely: how it is
        estimated from samples, how <M>{"\\beta"}</M> is tuned, and what it protects against.
      </p>
    </>
  ),
};
