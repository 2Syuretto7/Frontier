import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KlEstimatorViz } from "@/components/viz/KlEstimatorViz";
import type { LessonContent } from "@/lib/types";

const KL = `import math

def kl_estimates(log_ratios):
    n = len(log_ratios)
    k1 = sum(-lr for lr in log_ratios) / n
    k2 = sum(0.5 * lr * lr for lr in log_ratios) / n
    k3 = sum(math.exp(lr) - 1 - lr for lr in log_ratios) / n
    return k1, k2, k3

def adaptive_beta(beta, kl, target, k):
    err = min(max((kl - target) / target, -0.2), 0.2)
    return beta * (1 + k * err)

def tilted_frontier(p_ref, rewards, beta):
    w = [p * math.exp(r / beta) for p, r in zip(p_ref, rewards)]
    z = sum(w)
    pi = [x / z for x in w]
    reward = sum(p * r for p, r in zip(pi, rewards))
    kl = sum(p * math.log(p / q) for p, q in zip(pi, p_ref) if p > 0)
    return reward, kl`;

const DIAG = `import math

def seq_log_ratio(logp_policy, logp_ref):
    return sum(a - b for a, b in zip(logp_policy, logp_ref))

def entropy(probs):
    return -sum(p * math.log(p) for p in probs if p > 0)

def kl_exact(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)`;

export const lesson: LessonContent = {
  id: "l9.4.2",
  minutes: 50,
  links: {
    requires: ["l9.4.1", "l6.7.4"],
    revisits: ["m12.2.1", "l6.7.3"],
    foreshadows: ["l9.4.3", "l9.5.1", "l9.7.2"],
  },

  puzzle: (
    <>
      <p>
        Every RLHF recipe subtracts <M>{"\\beta\\,\\mathrm{KL}(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}})"}</M> from the reward. Yet the KL between
        two language models is a sum over every possible response, astronomically many, and cannot be computed. In practice it
        is estimated from the handful of responses sampled in each batch, sometimes by a quantity that is negative for half of
        them. And what number should <M>{"\\beta"}</M> be? Too small and the policy games the reward model; too large and it barely
        moves. How is the penalty estimated, tuned and justified?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The penalty is an exchange rate between reward and drift: the policy may move away from the supervised model only where
        the reward gained is worth the KL spent. Since rewards are known only on sampled responses, so is the KL: each sample
        gives a noisy estimate built from the log-ratio of its probabilities under the two models. Different formulas of that
        log-ratio give estimates with different bias and noise, and the choice matters when the policy is close to the reference,
        which is where RLHF operates.
      </p>
      <KlEstimatorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="three estimators">
        <p>
          For y drawn from <M>{"\\pi_\\theta"}</M>, let <M>{"r = \\pi_{\\text{ref}}(y)/\\pi_\\theta(y)"}</M>. Then
        </p>
        <MD>{"k_1 = -\\log r, \\qquad k_2 = \\tfrac12(\\log r)^2, \\qquad k_3 = (r - 1) - \\log r"}</MD>
        <p>
          each estimate <M>{"\\mathrm{KL}(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}})"}</M> (<C>kl_estimates</C>). <M>{"k_1"}</M> is unbiased and is what
          per-token RLHF rewards use; <M>{"k_3"}</M>, met in l6.7.3, is unbiased and non-negative, and GRPO uses it as a loss term
          (l9.7.2). The sequence-level log-ratio is the sum of token log-ratios (<C>seq_log_ratio</C>), so the penalty a response pays
          grows with its length.
        </p>
      </Definition>

      <Theorem title="k2 is right to second order">
        <p>
          If <M>{"\\log r"}</M> is small, <M>{"\\mathbb{E}[k_2] = \\mathrm{KL}(\\pi_\\theta \\,\\|\\, \\pi_{\\text{ref}}) + O(\\mathbb{E}|\\log r|^3)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\varepsilon = \\log r"}</M>. Since <M>{"\\mathbb{E}_{\\pi_\\theta}[r] = \\sum_y \\pi_{\\text{ref}}(y) = 1"}</M>,
        </p>
        <MD>{"0 = \\mathbb{E}[e^{\\varepsilon} - 1] = \\mathbb{E}[\\varepsilon] + \\tfrac12\\mathbb{E}[\\varepsilon^2] + O(\\mathbb{E}|\\varepsilon|^3)."}</MD>
        <p>
          The KL is <M>{"\\mathbb{E}[-\\varepsilon]"}</M>, which by this identity equals <M>{"\\tfrac12\\mathbb{E}[\\varepsilon^2]"}</M> up to the
          cubic term. Far from the reference the cubic term matters and <M>{"k_2"}</M> is biased, as the visualisation shows at the
          largest shift.
        </p>
      </Proof>

      <Definition title="the adaptive controller">
        <p>
          Ziegler et al. (2019) adjusted <M>{"\\beta"}</M> to hold the measured KL near a target: with proportional error{" "}
          <M>{"e = \\mathrm{clip}((\\mathrm{KL} - \\mathrm{KL}_{\\text{target}})/\\mathrm{KL}_{\\text{target}}, -0.2, 0.2)"}</M>, set{" "}
          <M>{"\\beta \\leftarrow \\beta(1 + K e)"}</M> with a small gain K (<C>adaptive_beta</C>). The target, a KL budget in nats per
          response, is then the knob, which is easier to reason about than <M>{"\\beta"}</M>. Many later recipes simply fix{" "}
          <M>{"\\beta"}</M> between 0.01 and 0.1 and choose a checkpoint by KL.
        </p>
      </Definition>

      <Remark title="what the penalty buys">
        <p>
          l6.7.4 showed the optimum of reward minus <M>{"\\beta\\,\\mathrm{KL}"}</M> is the tilt{" "}
          <M>{"\\pi^*(y) \\propto \\pi_{\\text{ref}}(y)e^{r(y)/\\beta}"}</M>, so <M>{"\\beta"}</M> traces a frontier of reward against KL
          (<C>tilted_frontier</C>). This reverse KL heavily penalises probability placed where the reference has almost none, which
          keeps the policy on text resembling the supervised model&apos;s, the region where the reward model was trained, and so limits
          over-optimisation (l9.3.3). It is mode-seeking: it tolerates the policy dropping some of the reference&apos;s options, so
          entropy still falls during RLHF (<C>entropy</C>), and outputs grow less diverse. The two directions of KL differ
          (<C>kl_exact</C>), and the reverse direction is the one that can be estimated from the policy&apos;s own samples.
        </p>
        <Code>{DIAG}</Code>
      </Remark>

      <Example title="reading the estimators">
        <p>
          A sample has log-ratio <M>{"\\log r = 0.3"}</M>, so the policy gives it less probability than the reference. Then{" "}
          <M>{"k_1 = -0.3"}</M>, negative, <M>{"k_2 = 0.045"}</M>, and <M>{"k_3 = e^{0.3} - 1.3 = 0.0499"}</M>. Averaged over many
          samples, <M>{"k_1"}</M>&apos;s negative and positive values balance to the true KL, but any single value says little.
        </p>
        <Code>{KL}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "beta",
      rung: "check",
      prompt: (
        <p>
          The controller has <M>{"\\beta = 0.1"}</M>, target 6 nats and gain K = 0.1. The batch&apos;s KL is 9 nats. What is the new{" "}
          <M>{"\\beta"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.102, tolerance: 0.0005 },
    },
    {
      key: "k3",
      rung: "check",
      prompt: (
        <p>
          Two samples from the policy have <M>{"\\log r"}</M> equal to −0.5 and 0.2, with <M>{"r = \\pi_{\\text{ref}}/\\pi_\\theta"}</M>. What is
          the mean <M>{"k_3"}</M> estimate? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.064, tolerance: 0.001 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>A team sets <M>{"\\beta = 0"}</M> to let the policy reach the highest reward. What is the likeliest outcome?</p>,
      answer: {
        kind: "choice",
        options: [
          "The proxy reward climbs while quality judged by people peaks and then falls, as the policy drifts to text the reward model misjudges and diversity collapses",
          "The policy stays identical to the reference",
          "Training becomes unstable only because the KL estimator divides by zero",
          "The best possible policy, since the penalty only ever lowers reward",
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

def kl_estimates(log_ratios):
    n = len(log_ratios)
    k1 = sum(-lr for lr in log_ratios) / n
    k2 = sum(0.5 * lr * lr for lr in log_ratios) / n
    k3 = sum(math.exp(lr) - 1 - lr for lr in log_ratios) / n
    return k1, k2, k3

def adaptive_beta(beta, kl, target, k):
    err = min(max((kl - target) / target, -0.2), 0.2)
    return beta * (1 + k * err)

def tilted_frontier(p_ref, rewards, beta):
    w = [p * math.exp(r / beta) for p, r in zip(p_ref, rewards)]
    z = sum(w)
    pi = [x / z for x in w]
    reward = sum(p * r for p, r in zip(pi, rewards))
    kl = sum(p * math.log(p / q) for p, q in zip(pi, p_ref) if p > 0)
    return reward, kl

print([round(k, 3) for k in kl_estimates([0.0, 0.0])], [round(k, 3) for k in kl_estimates([math.log(2)])])
print(round(adaptive_beta(0.1, 5.0, 6.0, 0.1), 5), adaptive_beta(0.2, 6.0, 6.0, 0.1), [round(v, 3) for v in tilted_frontier([0.5, 0.5], [1.0, 1.0], 0.1)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, 0.0] [-0.693, 0.24, 0.307]\n0.09833 0.2 [1.0, 0.0]",
          "[0.0, 0.0, 0.0] [0.693, 0.24, 0.307]\n0.09833 0.2 [1.0, 0.0]",
          "[0.0, 0.0, 0.0] [-0.693, 0.24, 0.307]\n0.098 0.2 [1.0, 0.0]",
          "[0.0, 0.0, 0.0] [-0.693, 0.24, 0.307]\n0.09833 0.2 [1.0, 0.693]",
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

def seq_log_ratio(logp_policy, logp_ref):
    return sum(a - b for a, b in zip(logp_policy, logp_ref))

def entropy(probs):
    return -sum(p * math.log(p) for p in probs if p > 0)

def kl_exact(p, q):
    return sum(a * math.log(a / b) for a, b in zip(p, q) if a > 0)

print(seq_log_ratio([-1.0, -2.0], [-1.5, -1.0]), round(entropy([0.5, 0.5]), 3), round(entropy([0.25] * 4), 3))
print(round(kl_exact([0.5, 0.5], [0.25, 0.75]), 3), round(kl_exact([0.25, 0.75], [0.5, 0.5]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.5 0.693 1.386\n0.144 0.131",
          "1.5 0.693 1.386\n0.144 0.131",
          "-0.5 0.693 1.386\n0.144 0.144",
          "-0.5 1.0 2.0\n0.144 0.131",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kl_estimates(log_ratios)</C>, returning the means of k1, k2 and k3 given <M>{"\\log r"}</M> values,{" "}
          <C>adaptive_beta(beta, kl, target, k)</C> with the error clipped to [−0.2, 0.2], and <C>tilted_frontier(p_ref, rewards, beta)</C>,
          returning the expected reward and KL from the reference of the tilted policy.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def kl_estimates(log_ratios):
    m = sum(log_ratios) / len(log_ratios)
    return m, m, m

def adaptive_beta(beta, kl, target, k):
    return beta * (1 + k * (kl - target) / target)

def tilted_frontier(p_ref, rewards, beta):
    return sum(p * r for p, r in zip(p_ref, rewards)), 0.0
`,
        solution: KL,
        tests: [
          { name: "est", code: `k1, k2, k3 = kl_estimates([math.log(0.5), math.log(2.0)])\nassert abs(k1) < 1e-12 and abs(k2 - 0.5 * math.log(2) ** 2) < 1e-12 and abs(k3 - 0.25) < 1e-12\nassert abs(adaptive_beta(1.0, 24.0, 6.0, 0.5) - 1.1) < 1e-12 and abs(adaptive_beta(1.0, 5.4, 6.0, 0.5) - 0.95) < 1e-12` },
          { name: "tilt", code: `r, kl = tilted_frontier([0.5, 0.5], [math.log(3), 0.0], 1.0)\nassert abs(r - 0.75 * math.log(3)) < 1e-12 and abs(kl - (0.75 * math.log(1.5) + 0.25 * math.log(0.5))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>seq_log_ratio(logp_policy, logp_ref)</C>, <C>entropy(probs)</C> in nats skipping zeros, and <C>kl_exact(p, q)</C>, skipping
          terms where p is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def seq_log_ratio(logp_policy, logp_ref):
    return sum(logp_policy) / len(logp_policy)

def entropy(probs):
    return 0.0

def kl_exact(p, q):
    return sum(a * math.log(b / a) for a, b in zip(p, q) if a > 0)
`,
        solution: DIAG,
        tests: [
          { name: "seq", code: `assert abs(seq_log_ratio([-1.0, -3.0], [-2.0, -1.0]) + 1.0) < 1e-12 and abs(entropy([0.5, 0.5, 0.0]) - math.log(2)) < 1e-12` },
          { name: "kl", code: `assert abs(kl_exact([1.0, 0.0], [0.25, 0.75]) - math.log(4)) < 1e-12 and kl_exact([0.3, 0.7], [0.3, 0.7]) == 0` },
        ],
      },
    },
    {
      key: "frontier",
      rung: "stretch",
      prompt: (
        <p>
          A reference gives two responses probability 0.5 each, with rewards 1 and 0. For <M>{"\\beta = 0.5"}</M>, what is the KL from the
          reference of the optimal KL-regularised policy, in nats? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.328, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With the reward, the penalty and the update in place, what remains is engineering: the dozen details that decide
        whether a PPO run for a language model works at all.
      </p>
    </>
  ),
};
