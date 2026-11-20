import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DpoFitViz } from "@/components/viz/DpoFitViz";
import type { LessonContent } from "@/lib/types";

const DPO = `import math

def implicit_reward(logp_policy, logp_ref, beta):
    return beta * (logp_policy - logp_ref)

def dpo_loss(lp_w, lr_w, lp_l, lr_l, beta):
    margin = beta * ((lp_w - lr_w) - (lp_l - lr_l))
    return math.log(1 + math.exp(-margin))

def dpo_grad_weight(lp_w, lr_w, lp_l, lr_l, beta):
    margin = beta * ((lp_w - lr_w) - (lp_l - lr_l))
    return 1 / (1 + math.exp(margin))`;

const UTIL = `import math

def seq_logprob(token_logps, mask):
    return sum(lp for lp, m in zip(token_logps, mask) if m)

def log_sigmoid(x):
    if x >= 0:
        return -math.log1p(math.exp(-x))
    return x - math.log1p(math.exp(x))

def reward_accuracy(margins):
    return sum(m > 0 for m in margins) / len(margins)`;

export const lesson: LessonContent = {
  id: "l9.5.1",
  minutes: 55,
  links: {
    requires: ["l9.4.2"],
    revisits: ["l6.7.4", "l9.3.2"],
    foreshadows: ["l9.5.2", "l9.5.3", "l9.8.2"],
  },

  puzzle: (
    <>
      <p>
        RLHF with PPO trains a reward model, then runs reinforcement learning with four models in memory, online sampling and a
        page of fragile details, all to maximise reward minus a KL penalty. Yet the optimum of that objective has a closed form,
        and it ties the reward to the policy itself. In 2023 Rafailov and colleagues used this to replace the whole pipeline
        by a classification loss on preference pairs, needing only the policy and a frozen reference. How can a reward model
        disappear without its information being lost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the best policy for a reward is the reference reweighted by <M>{"e^{r/\\beta}"}</M>, then the reward can be read off any
        policy as <M>{"\\beta"}</M> times its log-ratio to the reference, up to a constant per prompt. Plug that implicit reward into
        the Bradley–Terry likelihood, where only differences between two responses to the same prompt appear, and the constant
        cancels. What remains is a loss on the policy alone: raise the log-ratio of the chosen response relative to the rejected
        one. Fitting the policy to preferences this way is fitting a reward model whose parameters happen to be a language model.
      </p>
      <DpoFitViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the DPO objective">
        <p>
          Let <M>{"\\pi^*"}</M> maximise <M>{"\\mathbb{E}[r(x, y)] - \\beta\\,\\mathrm{KL}(\\pi \\,\\|\\, \\pi_{\\text{ref}})"}</M> for each prompt. Then
          the Bradley–Terry negative log-likelihood of a pair, chosen <M>{"y_w"}</M> and rejected <M>{"y_l"}</M>, written in terms of{" "}
          <M>{"\\pi^*"}</M>, is
        </p>
        <MD>{"\\mathcal{L} = -\\log\\sigma\\Big(\\beta\\log\\frac{\\pi^*(y_w \\mid x)}{\\pi_{\\text{ref}}(y_w \\mid x)} - \\beta\\log\\frac{\\pi^*(y_l \\mid x)}{\\pi_{\\text{ref}}(y_l \\mid x)}\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          By l6.7.4, <M>{"\\pi^*(y \\mid x) = \\pi_{\\text{ref}}(y \\mid x)e^{r(x,y)/\\beta}/Z(x)"}</M>. Taking logs and rearranging,
        </p>
        <MD>{"r(x, y) = \\beta\\log\\frac{\\pi^*(y \\mid x)}{\\pi_{\\text{ref}}(y \\mid x)} + \\beta\\log Z(x)."}</MD>
        <p>
          The Bradley–Terry probability <M>{"\\sigma(r(x, y_w) - r(x, y_l))"}</M> depends on the difference of rewards for the same x, in
          which <M>{"\\beta\\log Z(x)"}</M> cancels. Substituting gives the expression. DPO replaces <M>{"\\pi^*"}</M> by the trainable{" "}
          <M>{"\\pi_\\theta"}</M> and minimises this loss over the preference data, so the maximum-likelihood reward model and the
          policy that is optimal for it are found in one step.
        </p>
      </Proof>

      <Definition title="implicit reward and the loss">
        <p>
          The implicit reward is <M>{"\\hat r_\\theta(x, y) = \\beta\\log(\\pi_\\theta(y \\mid x)/\\pi_{\\text{ref}}(y \\mid x))"}</M>{" "}
          (<C>implicit_reward</C>), computed from sequence log-probabilities, the sums of token log-probabilities over the response
          (<C>seq_logprob</C>). The loss is <M>{"-\\log\\sigma(\\hat r_\\theta(x, y_w) - \\hat r_\\theta(x, y_l))"}</M> (<C>dpo_loss</C>), best computed
          with a stable log-sigmoid (<C>log_sigmoid</C>). The reference log-probabilities are fixed, so they are computed once for
          the dataset.
        </p>
        <Code>{DPO}</Code>
      </Definition>

      <Theorem title="the gradient">
        <p>
          <MD>{"\\nabla_\\theta\\mathcal{L} = -\\beta\\,\\sigma(\\hat r_\\theta(y_l) - \\hat r_\\theta(y_w))\\big[\\nabla_\\theta\\log\\pi_\\theta(y_w) - \\nabla_\\theta\\log\\pi_\\theta(y_l)\\big]"}</MD>
        </p>
      </Theorem>
      <Proof>
        <p>
          With <M>{"m = \\hat r_\\theta(y_w) - \\hat r_\\theta(y_l)"}</M>, <M>{"\\frac{d}{dm}(-\\log\\sigma(m)) = -(1 - \\sigma(m)) = -\\sigma(-m)"}</M>, and{" "}
          <M>{"\\nabla_\\theta m = \\beta(\\nabla_\\theta\\log\\pi_\\theta(y_w) - \\nabla_\\theta\\log\\pi_\\theta(y_l))"}</M> because the
          reference terms are constants. The weight <M>{"\\sigma(-m)"}</M> (<C>dpo_grad_weight</C>) is large when the implicit reward
          ranks the pair wrongly, so updates concentrate on pairs the model gets wrong, as in the Bradley–Terry fit of l9.3.2.
        </p>
      </Proof>

      <Remark title="in practice">
        <p>
          DPO trains from an SFT model, which is also the reference, with <M>{"\\beta"}</M> usually between 0.01 and 0.5 and a small
          learning rate. Progress is tracked by the share of pairs whose implicit reward margin is positive (<C>reward_accuracy</C>)
          and by the margins themselves. A known quirk is that the log-probabilities of both chosen and rejected responses often
          fall during training, the margin growing because the rejected falls faster; probability mass moves to responses in
          neither set. Zephyr, Tülu 2 and the Llama 3 post-training recipe used DPO in place of PPO.
        </p>
        <Code>{UTIL}</Code>
      </Remark>

      <Example title="one pair">
        <p>
          With <M>{"\\beta = 0.2"}</M>, a chosen response has log-ratio 1.5 and a rejected one −0.5. The implicit rewards are 0.3 and
          −0.1, the margin 0.4, the loss <M>{"\\log(1 + e^{-0.4})"}</M>, and the gradient weight <M>{"\\sigma(-0.4) = 0.401"}</M>.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "loss",
      rung: "check",
      prompt: (
        <p>
          With <M>{"\\beta = 0.1"}</M>, the chosen response has log-probability −12 under the policy and −14 under the reference; the
          rejected has −15 and −13. What is the DPO loss for this pair? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.513, tolerance: 0.001 },
    },
    {
      key: "weight",
      rung: "check",
      prompt: (
        <p>
          A pair has implicit rewards 0.3 for the chosen response and 0.9 for the rejected one. What weight does the DPO gradient
          give this pair, relative to <M>{"\\beta"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.646, tolerance: 0.001 },
    },
    {
      key: "z",
      rung: "apply",
      prompt: <p>Why can DPO ignore the partition function <M>{"Z(x)"}</M>, which is intractable to compute?</p>,
      answer: {
        kind: "choice",
        options: [
          "Both responses in a pair share the prompt, so the term β log Z(x) appears in both implicit rewards and cancels in their difference",
          "Z(x) equals 1 for language models because their probabilities sum to 1",
          "DPO approximates Z(x) by sampling",
          "The reference model absorbs Z(x) during supervised fine-tuning",
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

def implicit_reward(logp_policy, logp_ref, beta):
    return beta * (logp_policy - logp_ref)

def dpo_loss(lp_w, lr_w, lp_l, lr_l, beta):
    margin = beta * ((lp_w - lr_w) - (lp_l - lr_l))
    return math.log(1 + math.exp(-margin))

def dpo_grad_weight(lp_w, lr_w, lp_l, lr_l, beta):
    margin = beta * ((lp_w - lr_w) - (lp_l - lr_l))
    return 1 / (1 + math.exp(margin))

print(implicit_reward(-10.0, -12.0, 0.1), round(dpo_loss(-5.0, -5.0, -7.0, -7.0, 0.1), 3))
print(round(dpo_grad_weight(-5.0, -5.0, -7.0, -7.0, 0.1), 3), round(dpo_loss(0.0, -10.0, -10.0, 0.0, 0.1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2 0.693\n0.5 0.127",
          "0.2 0.0\n0.5 0.127",
          "-0.2 0.693\n0.5 0.127",
          "0.2 0.693\n0.5 2.127",
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

def seq_logprob(token_logps, mask):
    return sum(lp for lp, m in zip(token_logps, mask) if m)

def log_sigmoid(x):
    if x >= 0:
        return -math.log1p(math.exp(-x))
    return x - math.log1p(math.exp(x))

def reward_accuracy(margins):
    return sum(m > 0 for m in margins) / len(margins)

print(seq_logprob([-1.0, -2.0, -0.5], [0, 1, 1]), reward_accuracy([0.3, -0.1, 0.0, 2.0]))
print(round(log_sigmoid(0.0), 3), log_sigmoid(-800.0), round(log_sigmoid(2.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-2.5 0.5\n-0.693 -800.0 -0.127",
          "-3.5 0.5\n-0.693 -800.0 -0.127",
          "-2.5 0.75\n-0.693 -800.0 -0.127",
          "-2.5 0.5\n-0.693 0.0 -0.127",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>implicit_reward(logp_policy, logp_ref, beta)</C>, <C>dpo_loss(lp_w, lr_w, lp_l, lr_l, beta)</C> and{" "}
          <C>dpo_grad_weight(lp_w, lr_w, lp_l, lr_l, beta)</C>, where lp are policy and lr reference sequence log-probabilities.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def implicit_reward(logp_policy, logp_ref, beta):
    return logp_policy - logp_ref

def dpo_loss(lp_w, lr_w, lp_l, lr_l, beta):
    return -(lp_w - lp_l)

def dpo_grad_weight(lp_w, lr_w, lp_l, lr_l, beta):
    return 1.0
`,
        solution: DPO,
        tests: [
          { name: "loss", code: `assert abs(implicit_reward(-3.0, -5.0, 0.5) - 1.0) < 1e-12 and abs(dpo_loss(-3.0, -5.0, -4.0, -4.0, 0.5) - math.log(1 + math.exp(-1))) < 1e-12` },
          { name: "grad", code: `assert abs(dpo_grad_weight(-4.0, -4.0, -2.0, -6.0, 0.25) - 1 / (1 + math.exp(-1))) < 1e-12 and abs(dpo_grad_weight(0, 0, 0, 0, 1.0) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seq_logprob(token_logps, mask)</C>, <C>log_sigmoid(x)</C>, stable for large positive and negative x, and{" "}
          <C>reward_accuracy(margins)</C>, the share of strictly positive margins.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def seq_logprob(token_logps, mask):
    return sum(token_logps)

def log_sigmoid(x):
    return math.log(1 / (1 + math.exp(-x)))

def reward_accuracy(margins):
    return sum(m >= 0 for m in margins) / len(margins)
`,
        solution: UTIL,
        tests: [
          { name: "seq", code: `assert seq_logprob([-1.0, -2.0, -3.0], [1, 0, 1]) == -4.0 and reward_accuracy([0.0, 1.0, -1.0, 2.0]) == 0.5` },
          { name: "stable", code: `assert log_sigmoid(-1000.0) == -1000.0 and abs(log_sigmoid(1000.0)) < 1e-12 and abs(log_sigmoid(1.0) + math.log(1 + math.exp(-1))) < 1e-12` },
        ],
      },
    },
    {
      key: "tilt",
      rung: "stretch",
      prompt: (
        <p>
          A reference gives two responses probabilities 0.6 and 0.4, and a reward model scores them 0 and 1. With{" "}
          <M>{"\\beta = 0.5"}</M> and unlimited preference data from this reward, what probability does the DPO optimum give the second
          response? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.831, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The derivation assumed unlimited data and preferences that follow Bradley–Terry. When neither holds, DPO can overfit in
        a particular way, which motivates a family of variants.
      </p>
    </>
  ),
};
