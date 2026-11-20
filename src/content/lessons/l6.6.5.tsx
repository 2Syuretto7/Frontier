import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ActorCriticViz } from "@/components/viz/ActorCriticViz";
import type { LessonContent } from "@/lib/types";

const ONESTEP = `import math

def ac_step(theta, V, s, a, r, s2, done, gamma, a_theta, a_w):
    p = 1 / (1 + math.exp(-theta[s]))
    delta = r + (0.0 if done else gamma * V[s2]) - V[s]
    theta, V = list(theta), list(V)
    V[s] += a_w * delta
    theta[s] += a_theta * delta * ((1 - p) if a == 1 else -p)
    return theta, V, delta

def entropy(probs):
    return -sum(p * math.log(p) for p in probs if p > 0)

def entropy_grad(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    pi = [x / sum(e) for x in e]
    H = entropy(pi)
    return [-p * (math.log(p) + H) for p in pi]`;

const A2C = `def a2c_loss(logp, adv, values, targets, ent, c_v, c_e):
    n = len(logp)
    policy = -sum(l * a for l, a in zip(logp, adv)) / n
    value = sum((v - t) ** 2 for v, t in zip(values, targets)) / n
    return policy + c_v * value - c_e * sum(ent) / n

def n_step_targets(rewards, last_value, gamma, dones):
    out, g = [0.0] * len(rewards), last_value
    for t in reversed(range(len(rewards))):
        g = rewards[t] + gamma * g * (1 - dones[t])
        out[t] = g
    return out

def dpg_step(theta, x, dq_da, lr):
    return [t + lr * dq_da * xi for t, xi in zip(theta, x)]`;

export const lesson: LessonContent = {
  id: "l6.6.5",
  minutes: 55,
  links: {
    requires: ["l6.6.4", "l6.4.2"],
    revisits: ["l6.5.2", "l6.5.3"],
    foreshadows: ["l6.7.3", "l6.7.4"],
  },

  puzzle: (
    <>
      <p>
        REINFORCE learns nothing until an episode ends, and then weights every action by a single noisy return. In a long
        task, or one that never ends, that is hopeless. Value-based methods learn from every step but cannot easily represent
        stochastic policies or continuous actions. Can a learner keep the policy of one and the step-by-step updates of the
        other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Let two learners share the work. The <em>critic</em> learns state values by temporal differences. The <em>actor</em> is
        the policy, and after every step it asks the critic whether the outcome was better or worse than expected: the TD
        error. A positive surprise makes the action just taken more likely, a negative one less. The critic&apos;s values make the
        signal less noisy than a return and available immediately, at the price of bias while the critic is still wrong.
      </p>
      <ActorCriticViz />
    </>
  ),

  theory: (
    <>
      <Definition title="one-step actor-critic">
        <p>
          (Barto, Sutton and Anderson, 1983; Sutton and Barto, Section 13.5.) After each transition{" "}
          <M>{"(S_t, A_t, R_{t+1}, S_{t+1})"}</M>, with <M>{"\\delta_t = R_{t+1} + \\gamma\\hat v(S_{t+1}, w) - \\hat v(S_t, w)"}</M> (and{" "}
          <M>{"\\hat v = 0"}</M> after the end),
        </p>
        <MD>{"w \\leftarrow w + \\alpha_w\\delta_t\\nabla_w\\hat v(S_t, w), \\qquad \\theta \\leftarrow \\theta + \\alpha_\\theta\\gamma^t\\delta_t\\nabla_\\theta\\log\\pi(A_t \\mid S_t, \\theta)."}</MD>
        <p>
          The code is the tabular version used in the picture, with one logistic policy parameter per state (<C>ac_step</C>); the
          factor <M>{"\\gamma^t"}</M> is 1 there and is dropped in most implementations, as in l6.6.1.
        </p>
      </Definition>

      <Theorem title="the TD error estimates the advantage">
        <p>
          If the critic is exact, <M>{"\\hat v = v_\\pi"}</M>, then <M>{"\\mathbb{E}[\\delta_t \\mid S_t, A_t] = a_\\pi(S_t, A_t)"}</M>, so the actor&apos;s
          expected update is the policy gradient. With an inexact critic the update is biased by{" "}
          <M>{"\\gamma\\,\\mathbb{E}[e(S_{t+1}) \\mid S_t, A_t]"}</M>, where e is the critic&apos;s error.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}[R_{t+1} + \\gamma v_\\pi(S_{t+1}) \\mid S_t, A_t] = q_\\pi(S_t, A_t)"}</M> by the Bellman equation, and subtracting{" "}
          <M>{"v_\\pi(S_t)"}</M> leaves the advantage. With <M>{"\\hat v = v_\\pi + e"}</M>, δ gains <M>{"\\gamma e(S_{t+1}) - e(S_t)"}</M>; the second
          term is a baseline (l6.6.3) and the first is the bias. This is the n = 1 case of l6.6.4.
        </p>
      </Proof>

      <Remark title="two time scales">
        <p>
          The actor&apos;s gradient is only as good as the critic, and the critic chases a moving policy. Convergence proofs (Konda and
          Tsitsiklis, 2000) let the critic learn on a faster time scale, so that from the actor&apos;s point of view it is always
          nearly converged; in practice the critic gets the larger step size or more updates. The critic learns on-policy, so
          the deadly triad (l6.5.3) is avoided as long as the data are fresh.
        </p>
      </Remark>

      <Definition title="entropy regularisation">
        <p>
          Policy gradients can collapse the policy to near-deterministic before it has explored enough, after which the score
          is tiny and learning stalls. Adding <M>{"\\beta H(\\pi(\\cdot \\mid s))"}</M> to the objective, with{" "}
          <M>{"H(\\pi) = -\\sum_a\\pi(a)\\log\\pi(a)"}</M> (<C>entropy</C>), keeps it spread out. For a softmax over z,{" "}
          <M>{"\\partial H/\\partial z_j = -\\pi_j(\\log\\pi_j + H)"}</M> (<C>entropy_grad</C>), which pushes down the likeliest actions and up
          the unlikeliest.
        </p>
        <Code>{ONESTEP}</Code>
      </Definition>

      <Proof>
        <p>
          <M>{"\\partial\\pi_i/\\partial z_j = \\pi_i([i = j] - \\pi_j)"}</M>, so{" "}
          <M>{"\\partial H/\\partial z_j = -\\sum_i(\\log\\pi_i + 1)\\pi_i([i = j] - \\pi_j) = -\\pi_j(\\log\\pi_j + 1) + \\pi_j\\sum_i\\pi_i(\\log\\pi_i + 1)"}</M>,
          and the last sum is <M>{"1 - H"}</M>. Collecting terms gives <M>{"-\\pi_j(\\log\\pi_j + H)"}</M>.
        </p>
      </Proof>

      <Definition title="A2C and A3C">
        <p>
          (Mnih et al., 2016.) Run several copies of the environment, collect n steps from each, compute bootstrapped n-step
          targets backwards from the critic&apos;s value of the last state (<C>n_step_targets</C>, cut at episode ends) or GAE
          advantages (l6.6.4), and take one gradient step on the combined loss
        </p>
        <MD>{"\\mathcal{L} = -\\frac1N\\sum_i\\log\\pi(a_i \\mid s_i)\\hat A_i + c_v\\frac1N\\sum_i(\\hat v(s_i) - y_i)^2 - c_e\\frac1N\\sum_iH(\\pi(\\cdot \\mid s_i))"}</MD>
        <p>
          (<C>a2c_loss</C>), with the advantages treated as constants. The policy and the critic usually share a network with two
          heads. A3C ran the copies asynchronously on CPU threads; the synchronous A2C batches them, which suits GPUs. Many
          parallel environments decorrelate the batch, the job replay does for DQN (l6.5.2), while keeping the data on-policy.
        </p>
      </Definition>

      <Definition title="continuous actions: deterministic policy gradients">
        <p>
          For a deterministic policy <M>{"a = \\mu_\\theta(s)"}</M> and a critic <M>{"Q(s, a)"}</M>, the deterministic policy gradient theorem
          (Silver et al., 2014) gives <M>{"\\nabla J = \\mathbb{E}_s\\bigl[\\nabla_\\theta\\mu_\\theta(s)\\,\\nabla_aQ(s, a)|_{a = \\mu_\\theta(s)}\\bigr]"}</M>: move
          the action in the direction that raises Q. For a linear policy <M>{"\\mu(s) = \\theta^\\top x(s)"}</M> this is{" "}
          <M>{"\\theta \\leftarrow \\theta + \\alpha\\,\\partial_aQ\\,x"}</M> (<C>dpg_step</C>). DDPG (Lillicrap et al., 2016) trains Q off-policy
          with replay and target networks, as in DQN; TD3 (Fujimoto et al., 2018) adds two critics and takes the smaller to curb
          overestimation; SAC (Haarnoja et al., 2018) learns a stochastic policy with an entropy bonus in the objective.
        </p>
        <Code>{A2C}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "delta",
      rung: "check",
      prompt: (
        <p>
          The critic values the current state at −5 and the next at −3.5, the reward is −1 and γ = 1. What TD error does the actor
          receive?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "ent",
      rung: "check",
      prompt: <p>What is the entropy, in nats, of a policy with probabilities 0.5, 0.25 and 0.25? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.0397, tolerance: 0.0005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What does one-step actor-critic gain over REINFORCE with a baseline, and what does it give up?</p>,
      answer: {
        kind: "choice",
        options: [
          "It updates after every step with a low-variance signal, but the signal is biased while the critic is inaccurate",
          "It is unbiased and has lower variance, at no cost",
          "It no longer needs a value function, but can only handle discrete actions",
          "It learns off-policy from a replay buffer, but needs a model of the environment",
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

def ac_step(theta, V, s, a, r, s2, done, gamma, a_theta, a_w):
    p = 1 / (1 + math.exp(-theta[s]))
    delta = r + (0.0 if done else gamma * V[s2]) - V[s]
    theta, V = list(theta), list(V)
    V[s] += a_w * delta
    theta[s] += a_theta * delta * ((1 - p) if a == 1 else -p)
    return theta, V, delta

def entropy(probs):
    return -sum(p * math.log(p) for p in probs if p > 0)

def entropy_grad(z):
    m = max(z)
    e = [math.exp(x - m) for x in z]
    pi = [x / sum(e) for x in e]
    H = entropy(pi)
    return [-p * (math.log(p) + H) for p in pi]

th, V, d = ac_step([0.0, 0.0], [0.0, 0.0], 0, 1, -1.0, 1, False, 1.0, 0.5, 0.5); print(th, V, d)
print(ac_step(th, V, 1, 0, -1.0, 0, False, 1.0, 0.5, 0.5), round(entropy([0.5, 0.5]), 4), [round(g, 4) for g in entropy_grad([0.0, math.log(3)])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-0.25, 0.0] [-0.5, 0.0] -1.0\n([-0.25, 0.375], [-0.5, -0.75], -1.5) 0.6931 [0.206, -0.206]",
          "[-0.25, 0.0] [-0.5, 0.0] -1.0\n([-0.25, -0.375], [-0.5, -0.75], -1.5) 0.6931 [0.206, -0.206]",
          "[0.25, 0.0] [-0.5, 0.0] -1.0\n([0.25, 0.375], [-0.5, -0.5], -1.0) 0.6931 [0.206, -0.206]",
          "[-0.25, 0.0] [-0.5, 0.0] -1.0\n([-0.25, 0.375], [-0.5, -0.75], -1.5) 1.0 [-0.206, 0.206]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def a2c_loss(logp, adv, values, targets, ent, c_v, c_e):
    n = len(logp)
    policy = -sum(l * a for l, a in zip(logp, adv)) / n
    value = sum((v - t) ** 2 for v, t in zip(values, targets)) / n
    return policy + c_v * value - c_e * sum(ent) / n

def n_step_targets(rewards, last_value, gamma, dones):
    out, g = [0.0] * len(rewards), last_value
    for t in reversed(range(len(rewards))):
        g = rewards[t] + gamma * g * (1 - dones[t])
        out[t] = g
    return out

def dpg_step(theta, x, dq_da, lr):
    return [t + lr * dq_da * xi for t, xi in zip(theta, x)]

print(round(a2c_loss([-1.0, -2.0], [1.0, -0.5], [0.5, 1.0], [1.0, 0.0], [0.5, 0.7], 0.5, 0.1), 4))
print(n_step_targets([1.0, 1.0, 1.0], 10.0, 0.5, [0, 0, 0]), n_step_targets([1.0, 1.0, 1.0], 10.0, 0.5, [0, 1, 0]), dpg_step([0.0, 1.0], [2.0, -1.0], 0.5, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.2525\n[3.0, 4.0, 6.0] [1.5, 1.0, 6.0] [0.1, 0.95]",
          "0.3725\n[3.0, 4.0, 6.0] [1.5, 1.0, 6.0] [0.1, 0.95]",
          "0.2525\n[6.0, 4.0, 3.0] [1.5, 1.0, 6.0] [0.1, 0.95]",
          "0.2525\n[3.0, 4.0, 6.0] [3.0, 1.0, 6.0] [0.1, 1.05]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ac_step(theta, V, s, a, r, s2, done, gamma, a_theta, a_w)</C> for a tabular critic and a logistic policy{" "}
          <M>{"\\pi(1 \\mid s) = \\sigma(\\theta_s)"}</M>, returning new lists and the TD error; <C>entropy(probs)</C> in nats, skipping zero
          probabilities; and <C>entropy_grad(z)</C> for a softmax over z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ac_step(theta, V, s, a, r, s2, done, gamma, a_theta, a_w):
    return list(theta), list(V), 0.0

def entropy(probs):
    return 0.0

def entropy_grad(z):
    return [0.0] * len(z)
`,
        solution: ONESTEP,
        tests: [
          { name: "step", code: `th0, V0 = [0.0, 0.0], [0.0, 0.0]
th, V, d = ac_step(th0, V0, 0, 1, -1.0, 1, False, 1.0, 0.5, 0.5)
assert (th, V, d) == ([-0.25, 0.0], [-0.5, 0.0], -1.0) and th0 == [0.0, 0.0] and V0 == [0.0, 0.0]
assert ac_step(th, V, 1, 0, -1.0, 0, False, 1.0, 0.5, 0.5) == ([-0.25, 0.375], [-0.5, -0.75], -1.5)
th2, V2, d2 = ac_step([math.log(3)], [2.0], 0, 1, 1.0, 0, True, 0.9, 1.0, 0.1)
assert abs(d2 + 1.0) < 1e-12 and abs(V2[0] - 1.9) < 1e-12 and abs(th2[0] - math.log(3) + 0.25) < 1e-12` },
          { name: "entropy", code: `assert abs(entropy([0.5, 0.25, 0.25]) - 1.5 * math.log(2)) < 1e-12 and entropy([1.0, 0.0]) == 0
z = [0.2, -1.0, 0.7]
def H(z):
    e = [math.exp(x) for x in z]
    return entropy([x / sum(e) for x in e])
fd = [(H([z[j] + 1e-6 * (j == i) for j in range(3)]) - H([z[j] - 1e-6 * (j == i) for j in range(3)])) / 2e-6 for i in range(3)]
assert all(abs(a - b) < 1e-6 for a, b in zip(entropy_grad(z), fd)) and abs(sum(entropy_grad(z))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>a2c_loss(logp, adv, values, targets, ent, c_v, c_e)</C> as defined above; <C>n_step_targets(rewards, last_value,
          gamma, dones)</C>, bootstrapping from <C>last_value</C> and cutting at steps with <C>dones[t] = 1</C>; and{" "}
          <C>dpg_step(theta, x, dq_da, lr)</C> for a linear deterministic policy.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def a2c_loss(logp, adv, values, targets, ent, c_v, c_e):
    return 0.0

def n_step_targets(rewards, last_value, gamma, dones):
    return list(rewards)

def dpg_step(theta, x, dq_da, lr):
    return list(theta)
`,
        solution: A2C,
        tests: [
          { name: "loss", code: `assert abs(a2c_loss([-1.0, -2.0], [1.0, -0.5], [0.5, 1.0], [1.0, 0.0], [0.5, 0.7], 0.5, 0.1) - 0.2525) < 1e-12
assert abs(a2c_loss([-0.5], [2.0], [0.0], [3.0], [1.0], 1.0, 0.0) - 10.0) < 1e-12 and abs(a2c_loss([0.0], [0.0], [1.0], [1.0], [2.0], 1.0, 0.5) + 1.0) < 1e-12` },
          { name: "targets", code: `assert n_step_targets([1.0, 1.0, 1.0], 10.0, 0.5, [0, 0, 0]) == [3.0, 4.0, 6.0] and n_step_targets([1.0, 1.0, 1.0], 10.0, 0.5, [0, 1, 0]) == [1.5, 1.0, 6.0]
assert n_step_targets([2.0], 5.0, 0.9, [1]) == [2.0] and n_step_targets([], 5.0, 0.9, []) == []
out = dpg_step([0.0, 1.0], [2.0, -1.0], 0.5, 0.1)
assert all(abs(a - b) < 1e-12 for a, b in zip(out, [0.1, 0.95])) and dpg_step([1.0], [3.0], 0.0, 0.1) == [1.0]` },
        ],
      },
    },
    {
      key: "soft",
      rung: "stretch",
      prompt: (
        <p>
          A single state has three actions with values 1, 0 and 0. The policy maximises{" "}
          <M>{"\\sum_a\\pi(a)q(a) + \\beta H(\\pi)"}</M> with β = 0.5. What probability does it give the first action? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.787, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Actor-critic methods take small steps because a large one can wreck the policy, and the size of a step in parameter
        space says little about how much the policy changes. Part 7 measures steps by the change in the policy itself,
        starting with natural policy gradients (l6.7.1).
      </p>
    </>
  ),
};
