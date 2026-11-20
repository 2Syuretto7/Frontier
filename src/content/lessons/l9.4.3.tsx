import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RatioMismatchViz } from "@/components/viz/RatioMismatchViz";
import type { LessonContent } from "@/lib/types";

const REWARD = `import math

def normalise_reward(scores, ref_mean, ref_std):
    return [(s - ref_mean) / ref_std for s in scores]

def eos_penalty(scores, ended, penalty):
    return [s if e else penalty for s, e in zip(scores, ended)]

def logprob_temp(logits, token, temp):
    z = [x / temp for x in logits]
    m = max(z)
    return z[token] - m - math.log(sum(math.exp(x - m) for x in z))`;

const LOOP = `import math

def truncate_at_stop(tokens, stop):
    if stop in tokens:
        return tokens[:tokens.index(stop) + 1]
    return list(tokens)

def tis_weight(logp_train, logp_rollout, cap):
    return min(math.exp(logp_train - logp_rollout), cap)

def num_updates(rollout_batch, minibatch, epochs):
    return rollout_batch // minibatch * epochs`;

export const lesson: LessonContent = {
  id: "l9.4.3",
  minutes: 45,
  links: {
    requires: ["l9.4.2"],
    revisits: ["l9.1.2", "l9.3.2"],
    foreshadows: ["l9.5.3", "l9.7.2", "e12.5.1"],
  },

  puzzle: (
    <>
      <p>
        Two teams implement RLHF with PPO from the same paper, with the same hyperparameters. One reproduces the results; the
        other&apos;s policy learns to stop mid-sentence, or its reward collapses after a hundred steps. When researchers later
        reproduced OpenAI&apos;s early RLHF work, they listed more than twenty details, none in the main text of the papers, each
        of which could break a run. Which of them matter, and why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most of the details enforce one invariant: the probabilities the trainer computes must be the probabilities of the
        process that produced the samples. Any mismatch, in temperature, in padding, in where a response ends, or between the
        inference engine and the training code, corrupts the importance ratio from the first step. The rest keep the reward
        signal on a sensible scale and close off cheap ways for the policy to score, such as never finishing a response.
      </p>
      <RatioMismatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shaping the reward">
        <p>
          Reward models output arbitrary offsets (l9.3.2), so scores are normalised before RL, typically so that responses from
          the reference policy have mean 0 and standard deviation 1 (<C>normalise_reward</C>). Responses that hit the length cap
          without an end-of-sequence token receive a fixed penalty in place of their score (<C>eos_penalty</C>), otherwise the
          reward model may favour truncated text and the policy learns to ramble until cut off. Generation stops at the first
          stop token, and everything after it is masked (<C>truncate_at_stop</C>).
        </p>
      </Definition>

      <Definition title="matching the sampler">
        <p>
          If responses are sampled at temperature T, the behaviour policy is <M>{"\\mathrm{softmax}(z/T)"}</M>, so the trainer must
          compute log-probabilities from logits divided by T (<C>logprob_temp</C>). Dropout is switched off, so that the same
          input gives the same probabilities in the forward passes for rollout, old log-probabilities and update. With left
          padding for batched generation, position ids must skip the padding.
        </p>
        <Code>{REWARD}</Code>
      </Definition>

      <Theorem title="the ratio at the first step">
        <p>
          Before any update, <M>{"\\pi_\\theta = \\pi_{\\text{old}}"}</M> and every ratio should be 1. If the trainer uses{" "}
          <M>{"\\mathrm{softmax}(z)"}</M> while samples came from <M>{"\\mathrm{softmax}(z/T)"}</M>, the log-ratio for token k is{" "}
          <M>{"z_k(1 - 1/T) - \\log Z_1 + \\log Z_T"}</M>, which varies with k unless T = 1 or the logits are all equal.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\log\\mathrm{softmax}(z)_k = z_k - \\log Z_1"}</M> and <M>{"\\log\\mathrm{softmax}(z/T)_k = z_k/T - \\log Z_T"}</M>, with{" "}
          <M>{"Z_T = \\sum_j e^{z_j/T}"}</M>. Subtracting gives the expression, whose only dependence on k is through{" "}
          <M>{"z_k(1 - 1/T)"}</M>. For T &lt; 1 the trainer underestimates probable tokens&apos; probabilities and overestimates rare
          ones&apos;, so ratios are spread both ways and some are clipped before the policy has moved at all.
        </p>
      </Proof>

      <Definition title="the training loop">
        <p>
          A rollout batch, say 512 prompts with one response each, is generated and scored once, then split into minibatches for
          several epochs of PPO updates (<C>num_updates</C>), after which the samples are discarded. Modern systems generate with a
          fast inference engine, whose numerics differ slightly from the trainer&apos;s even with identical weights, which
          introduces a small off-policy gap. Truncated importance sampling multiplies each token&apos;s loss by{" "}
          <M>{"\\min(\\pi_{\\text{train}}/\\pi_{\\text{rollout}}, C)"}</M> to correct for it while capping the variance (<C>tis_weight</C>).
        </p>
        <Code>{LOOP}</Code>
      </Definition>

      <Remark title="what to monitor">
        <p>
          Healthy runs show the reward rising smoothly, KL growing steadily, clip fraction a few per cent, approximate KL between
          old and new policy small, value loss falling, and response length changing slowly. A sudden jump in length or KL,
          or entropy collapsing, signals a hack or a bug; reading samples catches what the curves miss.
        </p>
      </Remark>

      <Example title="a truncation exploit">
        <p>
          A reward model trained mostly on complete answers scores a 400-token response cut off mid-list at 1.5 and a complete
          250-token answer at 1.1, because longer lists looked better in its data. Without the end-of-sequence penalty, the policy
          learns to produce long unfinished lists. With a penalty of −1 for any response lacking the stop token, the truncated
          response scores −1 and the incentive reverses.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "norm",
      rung: "check",
      prompt: (
        <p>
          Reference responses score mean 2.3 and standard deviation 0.6 under the reward model. A policy response scores 3.1. What is
          its normalised reward? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.333, tolerance: 0.001 },
    },
    {
      key: "temp",
      rung: "check",
      prompt: (
        <p>
          Logits are 2, 1 and 0, and sampling uses temperature 0.5. What log-probability should the trainer record for token 0? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.143, tolerance: 0.001 },
    },
    {
      key: "stop",
      rung: "apply",
      prompt: (
        <p>
          A PPO run&apos;s mean response length climbs to the generation cap, and most responses end without the stop token. Which change
          addresses the cause?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Replace the reward of responses lacking the stop token with a fixed penalty, so that unfinished responses can never score well",
          "Raise the generation cap so that responses can finish",
          "Lower the learning rate of the value head",
          "Whiten the rewards instead of the advantages",
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

def normalise_reward(scores, ref_mean, ref_std):
    return [(s - ref_mean) / ref_std for s in scores]

def eos_penalty(scores, ended, penalty):
    return [s if e else penalty for s, e in zip(scores, ended)]

def logprob_temp(logits, token, temp):
    z = [x / temp for x in logits]
    m = max(z)
    return z[token] - m - math.log(sum(math.exp(x - m) for x in z))

print([round(x, 3) for x in normalise_reward([1.0, 3.0], 2.0, 0.5)], eos_penalty([0.4, 2.0], [True, False], -1.0))
print(round(logprob_temp([0.0, 0.0], 1, 1.0), 3), round(logprob_temp([1.0, 1.0, 1.0, 1.0], 0, 0.3), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-2.0, 2.0] [0.4, -1.0]\n-0.693 -1.386",
          "[-0.5, 0.5] [0.4, -1.0]\n-0.693 -1.386",
          "[-2.0, 2.0] [-1.0, 2.0]\n-0.693 -1.386",
          "[-2.0, 2.0] [0.4, -1.0]\n-0.693 -4.621",
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

def truncate_at_stop(tokens, stop):
    if stop in tokens:
        return tokens[:tokens.index(stop) + 1]
    return list(tokens)

def tis_weight(logp_train, logp_rollout, cap):
    return min(math.exp(logp_train - logp_rollout), cap)

def num_updates(rollout_batch, minibatch, epochs):
    return rollout_batch // minibatch * epochs

print(truncate_at_stop([5, 7, 2, 9, 2], 2), truncate_at_stop([5, 7], 2))
print(round(tis_weight(-1.0, -1.5, 2.0), 3), tis_weight(0.0, -3.0, 2.0), num_updates(512, 64, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 7, 2] [5, 7]\n1.649 2.0 32",
          "[5, 7] [5, 7]\n1.649 2.0 32",
          "[5, 7, 2, 9, 2] [5, 7]\n1.649 2.0 32",
          "[5, 7, 2] [5, 7]\n0.607 2.0 8",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalise_reward(scores, ref_mean, ref_std)</C>, <C>eos_penalty(scores, ended, penalty)</C> and{" "}
          <C>logprob_temp(logits, token, temp)</C>, a numerically stable log-softmax of the logits divided by the temperature.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def normalise_reward(scores, ref_mean, ref_std):
    return list(scores)

def eos_penalty(scores, ended, penalty):
    return [s + penalty for s in scores]

def logprob_temp(logits, token, temp):
    return logits[token] - math.log(sum(math.exp(x) for x in logits))
`,
        solution: REWARD,
        tests: [
          { name: "reward", code: `assert normalise_reward([4.0, 0.0], 2.0, 2.0) == [1.0, -1.0] and eos_penalty([1.0, 2.0, 3.0], [False, True, False], -2.0) == [-2.0, 2.0, -2.0]` },
          { name: "temp", code: `assert abs(logprob_temp([1000.0, 999.0], 1, 0.5) - (-2 - math.log(1 + math.exp(-2)))) < 1e-9 and abs(logprob_temp([0.0, math.log(3)], 1, 1.0) - math.log(0.75)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>truncate_at_stop(tokens, stop)</C>, keeping tokens up to and including the first stop token,{" "}
          <C>tis_weight(logp_train, logp_rollout, cap)</C> and <C>num_updates(rollout_batch, minibatch, epochs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def truncate_at_stop(tokens, stop):
    return [t for t in tokens if t != stop]

def tis_weight(logp_train, logp_rollout, cap):
    return math.exp(logp_train - logp_rollout)

def num_updates(rollout_batch, minibatch, epochs):
    return epochs
`,
        solution: LOOP,
        tests: [
          { name: "stop", code: `assert truncate_at_stop([1, 0, 3, 0], 0) == [1, 0] and truncate_at_stop([4, 5], 0) == [4, 5]` },
          { name: "tis", code: `assert tis_weight(0.0, -5.0, 3.0) == 3.0 and abs(tis_weight(-2.0, -1.0, 3.0) - math.exp(-1)) < 1e-12 and num_updates(1024, 128, 2) == 16` },
        ],
      },
    },
    {
      key: "bug",
      rung: "stretch",
      prompt: (
        <p>
          Logits are 1 and 0. Responses are sampled at temperature 0.7, but the trainer computes probabilities at temperature 1. For a
          sampled token 0, what importance ratio does the trainer see at the first step? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.906, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        PPO for RLHF needs four models, careful engineering and online sampling. The next module asks whether the reward model
        and the RL loop can be skipped altogether by optimising the policy on preference pairs directly.
      </p>
    </>
  ),
};
