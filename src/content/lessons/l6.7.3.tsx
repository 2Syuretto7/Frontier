import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PpoClipViz } from "@/components/viz/PpoClipViz";
import type { LessonContent } from "@/lib/types";

const CLIP = `def clipped_objective(ratio, adv, eps):
    clipped = max(1 - eps, min(1 + eps, ratio))
    return min(ratio * adv, clipped * adv)

def clipped_grad(ratio, adv, eps):
    if (adv > 0 and ratio > 1 + eps) or (adv < 0 and ratio < 1 - eps):
        return 0.0
    return adv

def ppo_loss(ratios, advs, eps):
    return -sum(clipped_objective(r, a, eps) for r, a in zip(ratios, advs)) / len(ratios)`;

const EPOCHS = `import math

def softmax(z):
    e = [math.exp(x - max(z)) for x in z]
    return [x / sum(e) for x in e]

def ppo_epochs(z, actions, advs, eps, lr, epochs):
    old, z = softmax(z), list(z)
    for _ in range(epochs):
        pi, g = softmax(z), [0.0] * len(z)
        for a, A in zip(actions, advs):
            r = pi[a] / old[a]
            if (A > 0 and r > 1 + eps) or (A < 0 and r < 1 - eps):
                continue
            for b in range(len(z)):
                g[b] += r * A * ((b == a) - pi[b]) / len(actions)
        z = [zi + lr * gi for zi, gi in zip(z, g)]
    return z

def approx_kl(old_logp, new_logp):
    return sum(math.exp(n - o) - 1 - (n - o) for o, n in zip(old_logp, new_logp)) / len(old_logp)`;

export const lesson: LessonContent = {
  id: "l6.7.3",
  minutes: 55,
  links: {
    requires: ["l6.7.2", "l6.6.4"],
    revisits: ["l6.6.3", "l6.6.5"],
    foreshadows: ["l6.7.4", "l9.4.1"],
  },

  puzzle: (
    <>
      <p>
        Collecting experience is the expensive part of reinforcement learning, so it is tempting to take many gradient steps
        on each batch. But the surrogate of l6.7.2 rewards pushing the probability of every good action up without limit, and
        after a few epochs the policy has moved far outside the region where the batch says anything reliable. TRPO prevents
        this with a hard KL constraint and a second-order solver. Can a first-order method, plain minibatch gradient ascent,
        be made to stay close to the old policy by itself?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Change the objective so that it stops paying for moving too far. For each sample, once the new policy has made a good
        action 1 + ε times as likely as before, further increases earn nothing; once it has made a bad action 1 − ε times as
        likely, further decreases earn nothing. The gradient of such a sample is then zero, so extra epochs leave it alone.
        Moves in the harmful direction are never clipped, so the objective is a pessimistic estimate of the surrogate.
      </p>
      <PpoClipViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the clipped surrogate">
        <p>
          (Schulman, Wolski, Dhariwal, Radford and Klimov, 2017.) With the ratio{" "}
          <M>{"r_t(\\theta) = \\pi_\\theta(A_t \\mid S_t)/\\pi_{\\theta_{\\text{old}}}(A_t \\mid S_t)"}</M> and advantage estimates{" "}
          <M>{"\\hat A_t"}</M>,
        </p>
        <MD>{"L^{\\mathrm{CLIP}}(\\theta) = \\hat{\\mathbb{E}}_t\\Bigl[\\min\\bigl(r_t(\\theta)\\hat A_t,\\ \\mathrm{clip}(r_t(\\theta), 1 - \\varepsilon, 1 + \\varepsilon)\\hat A_t\\bigr)\\Bigr],"}</MD>
        <p>
          with ε around 0.2 (<C>clipped_objective</C>; <C>ppo_loss</C> is its negative mean, to be minimised).
        </p>
        <Code>{CLIP}</Code>
      </Definition>

      <Theorem title="where the gradient vanishes">
        <p>
          For one sample, the derivative of the clipped objective with respect to r is 0 when <M>{"\\hat A > 0"}</M> and r &gt; 1 + ε, or
          when <M>{"\\hat A < 0"}</M> and r &lt; 1 − ε, and <M>{"\\hat A"}</M> otherwise (<C>clipped_grad</C>). The clipped objective is never
          larger than the unclipped one, and the two agree to first order at r = 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let c = clip(r, 1 − ε, 1 + ε). If <M>{"\\hat A > 0"}</M>, the minimum is <M>{"\\hat A\\min(r, c)"}</M>; for r &gt; 1 + ε this is{" "}
          <M>{"(1 + \\varepsilon)\\hat A"}</M>, a constant, and for r ≤ 1 + ε it is <M>{"r\\hat A"}</M>, since min(r, c) = r there (for r &lt; 1 − ε, c = 1 −
          ε &gt; r). If <M>{"\\hat A < 0"}</M>, the minimum is <M>{"\\hat A\\max(r, c)"}</M>, which is the constant{" "}
          <M>{"(1 - \\varepsilon)\\hat A"}</M> for r &lt; 1 − ε and <M>{"r\\hat A"}</M> otherwise. Both branches are at most{" "}
          <M>{"r\\hat A"}</M>, and near r = 1 they equal it, so the gradient at <M>{"\\theta_{\\text{old}}"}</M> is the policy gradient.
        </p>
      </Proof>

      <Definition title="the PPO algorithm">
        <p>
          Repeat: run the policy for T steps in each of N environments; compute GAE advantages (l6.6.4) and value targets; then
          for K epochs (typically 3 to 10) shuffle the batch into minibatches and take gradient steps on
        </p>
        <MD>{"-L^{\\mathrm{CLIP}}(\\theta) + c_v\\,\\hat{\\mathbb{E}}_t\\bigl[(\\hat v(S_t) - y_t)^2\\bigr] - c_e\\,\\hat{\\mathbb{E}}_t\\bigl[H(\\pi_\\theta(\\cdot \\mid S_t))\\bigr],"}</MD>
        <p>
          the A2C loss of l6.6.5 with the policy term replaced. The code runs the K epochs for a single-state softmax policy
          with full-batch steps, skipping samples whose gradient is clipped (<C>ppo_epochs</C>); each active sample contributes{" "}
          <M>{"r\\hat A(e_a - \\pi)"}</M>, the gradient of <M>{"r\\hat A"}</M> in the preferences.
        </p>
        <Code>{EPOCHS}</Code>
      </Definition>

      <Remark title="clipping is not a trust region">
        <p>
          Clipping removes the incentive to move a sample&apos;s ratio past 1 ± ε, but it does not forbid it: a step driven by other
          samples, a shared network or momentum can still carry r far away, and the clipped samples exert no force to bring it
          back unless it crosses to the harmful side. Implementations therefore monitor an estimate of the KL divergence from
          the old policy and stop the epochs early when it exceeds a threshold. A good estimator from samples of the old policy
          is the mean of <M>{"(r - 1) - \\log r"}</M>, which is unbiased and never negative (<C>approx_kl</C>). A variant, PPO-penalty,
          subtracts <M>{"\\beta\\,\\mathrm{KL}"}</M> from the surrogate and adapts β to hit a target divergence.
        </p>
      </Remark>

      <Theorem title="the KL estimator">
        <p>
          For samples a from p, with r = q(a)/p(a), <M>{"\\mathbb{E}[(r - 1) - \\log r] = \\mathrm{KL}(p \\,\\|\\, q)"}</M>, and every term is at
          least 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}_p[r] = \\sum_aq(a) = 1"}</M>, so the mean of r − 1 is 0, and <M>{"\\mathbb{E}_p[-\\log r] = \\sum_ap(a)\\log(p(a)/q(a))"}</M> is
          the KL divergence. Each term is non-negative because <M>{"\\log r \\le r - 1"}</M> for all r &gt; 0.
        </p>
      </Proof>

      <Remark title="why PPO became the default">
        <p>
          PPO needs only first-order gradients, works with shared policy and value networks, and reuses each batch several
          times. Its results depend on details: advantage normalisation (l6.6.3), value-loss clipping, learning-rate
          annealing, gradient clipping and careful initialisation have each been shown to matter (Engstrom et al., 2020). It is
          also the algorithm used to fine-tune language models from human feedback (l9.4.1), where the policy is a language
          model and an extra KL penalty to a reference model keeps it close to where it started (l6.7.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "c1",
      rung: "check",
      prompt: <p>A sample has ratio 1.3 and advantage 1, with ε = 0.2. What is its clipped objective?</p>,
      answer: { kind: "numeric", value: 1.2, tolerance: 0.0001 },
    },
    {
      key: "c2",
      rung: "check",
      prompt: <p>A sample has ratio 0.7 and advantage −1, with ε = 0.2. What is its clipped objective?</p>,
      answer: { kind: "numeric", value: -0.8, tolerance: 0.0001 },
    },
    {
      key: "dir",
      rung: "apply",
      prompt: (
        <p>
          After some epochs, a sample with negative advantage has ratio 1.4 and ε = 0.2. What does the clipped objective do with
          it?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Its gradient is the full unclipped one, pushing the probability of that bad action back down",
          "Its gradient is zero because the ratio is outside the clipping range",
          "It is removed from the batch for the remaining epochs",
          "Its gradient is scaled down by the factor 1.2/1.4",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def clipped_objective(ratio, adv, eps):
    clipped = max(1 - eps, min(1 + eps, ratio))
    return min(ratio * adv, clipped * adv)

def clipped_grad(ratio, adv, eps):
    if (adv > 0 and ratio > 1 + eps) or (adv < 0 and ratio < 1 - eps):
        return 0.0
    return adv

def ppo_loss(ratios, advs, eps):
    return -sum(clipped_objective(r, a, eps) for r, a in zip(ratios, advs)) / len(ratios)

print([clipped_objective(r, a, 0.2) for r, a in ((1.5, 2.0), (0.5, 2.0), (0.5, -2.0), (1.5, -2.0))])
print([clipped_grad(r, a, 0.2) for r, a in ((1.5, 2.0), (0.5, 2.0), (0.5, -2.0), (1.5, -2.0))], ppo_loss([1.0, 1.5], [1.0, 2.0], 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.4, 1.0, -1.6, -3.0]\n[0.0, 2.0, 0.0, -2.0] -1.7",
          "[2.4, 1.6, -1.0, -2.4]\n[0.0, 2.0, 0.0, -2.0] -1.7",
          "[2.4, 1.0, -1.6, -3.0]\n[2.0, 2.0, -2.0, -2.0] -1.7",
          "[3.0, 1.0, -1.6, -2.4]\n[0.0, 2.0, 0.0, -2.0] 1.7",
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

def softmax(z):
    e = [math.exp(x - max(z)) for x in z]
    return [x / sum(e) for x in e]

def ppo_epochs(z, actions, advs, eps, lr, epochs):
    old, z = softmax(z), list(z)
    for _ in range(epochs):
        pi, g = softmax(z), [0.0] * len(z)
        for a, A in zip(actions, advs):
            r = pi[a] / old[a]
            if (A > 0 and r > 1 + eps) or (A < 0 and r < 1 - eps):
                continue
            for b in range(len(z)):
                g[b] += r * A * ((b == a) - pi[b]) / len(actions)
        z = [zi + lr * gi for zi, gi in zip(z, g)]
    return z

def approx_kl(old_logp, new_logp):
    return sum(math.exp(n - o) - 1 - (n - o) for o, n in zip(old_logp, new_logp)) / len(old_logp)

print(softmax([0.0, 0.0]), ppo_epochs([0.0, 0.0], [0], [1.0], 0.2, 4.0, 1), ppo_epochs([0.0, 0.0], [0], [1.0], 0.2, 4.0, 3))
print(ppo_epochs([0.0, 0.0], [0, 1], [1.0, 1.0], 0.2, 4.0, 3), approx_kl([0.0], [0.0]), round(approx_kl([math.log(0.5)], [math.log(0.25)]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.5] [2.0, -2.0] [2.0, -2.0]\n[0.0, 0.0] 0.0 0.1931",
          "[0.5, 0.5] [2.0, -2.0] [6.0, -6.0]\n[0.0, 0.0] 0.0 0.1931",
          "[0.5, 0.5] [2.0, -2.0] [2.0, -2.0]\n[4.0, 4.0] 0.0 0.1931",
          "[0.5, 0.5] [4.0, 0.0] [4.0, 0.0]\n[0.0, 0.0] 0.0 0.6931",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>clipped_objective(ratio, adv, eps)</C>; <C>clipped_grad(ratio, adv, eps)</C>, its derivative with respect to the
          ratio (take the unclipped value at the boundary); and <C>ppo_loss(ratios, advs, eps)</C>, the negative mean.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def clipped_objective(ratio, adv, eps):
    return ratio * adv

def clipped_grad(ratio, adv, eps):
    return adv

def ppo_loss(ratios, advs, eps):
    return 0.0
`,
        solution: CLIP,
        tests: [
          { name: "objective", code: `assert [clipped_objective(r, a, 0.2) for r, a in ((1.5, 2.0), (0.5, 2.0), (0.5, -2.0), (1.5, -2.0))] == [2.4, 1.0, -1.6, -3.0]
assert abs(clipped_objective(1.3, 1.0, 0.2) - 1.2) < 1e-12 and clipped_objective(1.1, 1.0, 0.2) == 1.1 and abs(clipped_objective(0.7, -1.0, 0.1) + 0.9) < 1e-12
assert abs(ppo_loss([1.0, 1.5], [1.0, 2.0], 0.2) + 1.7) < 1e-12 and ppo_loss([1.0], [0.0], 0.2) == 0` },
          { name: "gradient", code: `assert [clipped_grad(r, a, 0.2) for r, a in ((1.5, 2.0), (0.5, 2.0), (0.5, -2.0), (1.5, -2.0))] == [0.0, 2.0, 0.0, -2.0]
assert clipped_grad(1.2, 1.0, 0.2) == 1.0 and clipped_grad(1.0, -3.0, 0.2) == -3.0 and clipped_grad(0.9, -1.0, 0.05) == 0.0
h = 1e-6
for r, a in ((0.5, 1.0), (1.3, 1.0), (0.7, -1.0), (1.3, -1.0), (1.0, 2.0)):
    fd = (clipped_objective(r + h, a, 0.2) - clipped_objective(r - h, a, 0.2)) / (2 * h)
    assert abs(fd - clipped_grad(r, a, 0.2)) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a single-state softmax policy with preferences z, write <C>softmax(z)</C>; <C>ppo_epochs(z, actions, advs, eps, lr, epochs)</C>,
          taking full-batch ascent steps on the clipped objective with the old policy fixed at the start; and{" "}
          <C>approx_kl(old_logp, new_logp)</C>, the mean of <M>{"(r - 1) - \\log r"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def softmax(z):
    return [1.0 / len(z)] * len(z)

def ppo_epochs(z, actions, advs, eps, lr, epochs):
    return list(z)

def approx_kl(old_logp, new_logp):
    return 0.0
`,
        solution: EPOCHS,
        tests: [
          { name: "epochs", code: `assert ppo_epochs([0.0, 0.0], [0], [1.0], 0.2, 4.0, 1) == [2.0, -2.0] and ppo_epochs([0.0, 0.0], [0], [1.0], 0.2, 4.0, 3) == [2.0, -2.0]
z = ppo_epochs([0.0, 0.0], [0], [1.0], 0.2, 0.1, 200)
p = softmax(z)[0]
assert 0.6 <= p < 0.63 and ppo_epochs([0.0, 0.0], [0, 1], [1.0, 1.0], 0.2, 4.0, 3) == [0.0, 0.0]
assert all(abs(a - b) < 1e-12 for a, b in zip(softmax([0.0, math.log(3)]), [0.25, 0.75]))` },
          { name: "kl", code: `assert approx_kl([0.0], [0.0]) == 0 and abs(approx_kl([math.log(0.5)], [math.log(0.25)]) - (math.log(2) - 0.5)) < 1e-12
lp, lq = [math.log(0.7), math.log(0.3)], [math.log(0.4), math.log(0.6)]
assert abs(approx_kl(lp, lq) - (0.5 * (0.4 / 0.7 - 1 - math.log(0.4 / 0.7)) + 0.5 * (0.6 / 0.3 - 1 - math.log(0.6 / 0.3)))) < 1e-12 and approx_kl(lp, lq) > 0` },
        ],
      },
    },
    {
      key: "kl",
      rung: "stretch",
      prompt: (
        <p>
          A two-action policy starts at probability 0.5 for each action. One sample of action 1 with positive advantage is
          trained until its ratio reaches exactly 1 + ε with ε = 0.2. What is then <M>{"\\mathrm{KL}(\\pi_{\\text{old}} \\,\\|\\, \\pi_{\\text{new}})"}</M>? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0204, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        PPO keeps each update close to the previous policy. Sometimes the goal is to stay close to a fixed reference policy
        throughout training, as when fine-tuning a language model. The next lesson (l6.7.4) adds a KL penalty to the reward
        itself and finds that the optimal policy has a closed form.
      </p>
    </>
  ),
};
