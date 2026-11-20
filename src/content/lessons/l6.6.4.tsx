import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GaeTradeoffViz } from "@/components/viz/GaeTradeoffViz";
import type { LessonContent } from "@/lib/types";

const GAE = `def td_errors(rewards, values, gamma, dones):
    return [r + gamma * values[t + 1] * (1 - d) - values[t] for t, (r, d) in enumerate(zip(rewards, dones))]

def gae(rewards, values, gamma, lam, dones):
    adv, a = [0.0] * len(rewards), 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] * (1 - dones[t]) - values[t]
        a = delta + gamma * lam * (1 - dones[t]) * a
        adv[t] = a
    return adv

def value_targets(adv, values):
    return [a + v for a, v in zip(adv, values)]`;

const NSTEP = `def n_step_advantage(rewards, values, gamma, n, t):
    n = min(n, len(rewards) - t)
    ret = sum(gamma ** k * rewards[t + k] for k in range(n))
    return ret + gamma ** n * values[t + n] - values[t]

def lambda_weights(lam, n_max):
    return [(1 - lam) * lam ** (n - 1) for n in range(1, n_max)] + [lam ** (n_max - 1)]

def gae_from_nsteps(rewards, values, gamma, lam, t):
    w = lambda_weights(lam, len(rewards) - t)
    return sum(wn * n_step_advantage(rewards, values, gamma, n + 1, t) for n, wn in enumerate(w))`;

export const lesson: LessonContent = {
  id: "l6.6.4",
  minutes: 50,
  links: {
    requires: ["l6.6.3", "l6.4.3"],
    revisits: ["l6.4.2"],
    foreshadows: ["l6.6.5", "l6.7.3"],
  },

  puzzle: (
    <>
      <p>
        With a learned value function there are two natural estimates of an action&apos;s advantage. The Monte Carlo one,{" "}
        <M>{"G_t - \\hat v(S_t)"}</M>, is unbiased but carries the noise of every later reward. The one-step one,{" "}
        <M>{"R_{t+1} + \\gamma\\hat v(S_{t+1}) - \\hat v(S_t)"}</M>, sees only one reward but trusts a value estimate that may be wrong.
        Is there a principled way to sit between them, and how should the dial be set?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every n-step return gives an advantage estimate, and like the λ-return of l6.4.3 they can be averaged with weights that
        decay geometrically. The result is a discounted sum of one-step TD errors, cheap to compute backwards through a
        rollout. The parameter λ sets how far ahead the estimate looks before it hands over to the value function: low λ
        inherits the critic&apos;s errors, high λ inherits the rewards&apos; noise, and the best setting depends on how good the critic
        is.
      </p>
      <GaeTradeoffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="n-step advantage estimates">
        <p>
          With the TD error <M>{"\\delta_t = R_{t+1} + \\gamma\\hat v(S_{t+1}) - \\hat v(S_t)"}</M> (l6.4.2), the n-step estimate is
        </p>
        <MD>{"\\hat A_t^{(n)} = \\sum_{k=0}^{n-1}\\gamma^kR_{t+k+1} + \\gamma^n\\hat v(S_{t+n}) - \\hat v(S_t) = \\sum_{k=0}^{n-1}\\gamma^k\\delta_{t+k},"}</MD>
        <p>
          where the second form follows because the intermediate values cancel in pairs (<C>n_step_advantage</C>). n = 1 gives{" "}
          <M>{"\\delta_t"}</M>, and n running to the end of the episode gives <M>{"G_t - \\hat v(S_t)"}</M>.
        </p>
      </Definition>

      <Theorem title="what the errors of the critic cost">
        <p>
          Write <M>{"e(s) = \\hat v(s) - v_\\pi(s)"}</M>. Then{" "}
          <M>{"\\mathbb{E}[\\hat A_t^{(n)} \\mid S_t, A_t] = a_\\pi(S_t, A_t) + \\gamma^n\\,\\mathbb{E}[e(S_{t+n}) \\mid S_t, A_t] - e(S_t)"}</M>. The last term
          depends only on the state, so it acts as a baseline and does not bias the policy gradient; the middle term does,
          unless the critic is exact or n reaches the end of the episode.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute <M>{"\\hat v = v_\\pi + e"}</M> in the first form. The rewards and <M>{"\\gamma^nv_\\pi(S_{t+n})"}</M> have conditional
          expectation <M>{"q_\\pi(S_t, A_t)"}</M>, by n applications of the Bellman equation (l6.2.4), and{" "}
          <M>{"q_\\pi - v_\\pi = a_\\pi"}</M>. What remains is <M>{"\\gamma^ne(S_{t+n}) - e(S_t)"}</M>. By l6.6.3 a function of{" "}
          <M>{"S_t"}</M> adds no bias to the gradient. At the end of an episode <M>{"\\hat v = v_\\pi = 0"}</M>, so the middle term vanishes
          for the Monte Carlo estimate.
        </p>
      </Proof>

      <Definition title="generalised advantage estimation">
        <p>
          (Schulman, Moritz, Levine, Jordan and Abbeel, 2016.) For <M>{"0 \\le \\lambda \\le 1"}</M>,
        </p>
        <MD>{"\\hat A_t^{\\mathrm{GAE}(\\gamma, \\lambda)} = \\sum_{l \\ge 0}(\\gamma\\lambda)^l\\delta_{t+l}, \\qquad \\hat A_t = \\delta_t + \\gamma\\lambda\\hat A_{t+1}."}</MD>
        <p>
          The recursion runs backwards through a rollout of T steps in O(T) (<C>gae</C>). The list of values has one more entry than
          the rewards: the value of the state after the last step, used to bootstrap when a rollout stops mid-episode. A flag{" "}
          <C>dones[t] = 1</C> marks a step that ended an episode; there the next value is 0 and the sum is cut. The targets for the
          critic are <M>{"\\hat A_t + \\hat v(S_t)"}</M> (<C>value_targets</C>), which is the λ-return of l6.4.3.
        </p>
        <Code>{GAE}</Code>
      </Definition>

      <Theorem title="GAE averages the n-step estimates">
        <p>
          In an episode that ends at step T, with <M>{"N = T - t"}</M>,{" "}
          <M>{"\\hat A_t^{\\mathrm{GAE}} = \\sum_{n=1}^{N-1}(1 - \\lambda)\\lambda^{n-1}\\hat A_t^{(n)} + \\lambda^{N-1}\\hat A_t^{(N)}"}</M>, a weighted average
          whose weights sum to 1 (<C>lambda_weights</C>, <C>gae_from_nsteps</C>). λ = 0 gives <M>{"\\delta_t"}</M> and λ = 1 gives{" "}
          <M>{"G_t - \\hat v(S_t)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Using <M>{"\\hat A_t^{(n)} = \\sum_{k<n}\\gamma^k\\delta_{t+k}"}</M>, the coefficient of <M>{"\\gamma^k\\delta_{t+k}"}</M> in the average is the
          total weight on n &gt; k: <M>{"\\sum_{n=k+1}^{N-1}(1 - \\lambda)\\lambda^{n-1} + \\lambda^{N-1} = \\lambda^k - \\lambda^{N-1} + \\lambda^{N-1} = \\lambda^k"}</M>.
          So the average is <M>{"\\sum_k(\\gamma\\lambda)^k\\delta_{t+k}"}</M>. The weights telescope to <M>{"1 - \\lambda^{N-1} + \\lambda^{N-1} = 1"}</M>.
        </p>
        <Code>{NSTEP}</Code>
      </Proof>

      <Remark title="choosing γ and λ">
        <p>
          The picture shows the trade-off. The weight on the critic&apos;s error <M>{"n"}</M> steps ahead is{" "}
          <M>{"(1 - \\lambda)\\lambda^{n-1}\\gamma^n"}</M>, so large λ averages many errors and lets independent ones cancel, while the
          variance from rewards grows like <M>{"1/(1 - \\gamma^2\\lambda^2)"}</M>. In practice γ = 0.99 and λ = 0.95 are common
          defaults. The discount γ itself also trades variance for bias with respect to the undiscounted objective, since it
          shortens the horizon over which rewards are credited.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "delta",
      rung: "check",
      prompt: (
        <p>
          A step has reward 1 and γ = 0.9, and the critic estimates 2.5 for the state and 2 for the next state. What is the TD
          error?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "gae2",
      rung: "check",
      prompt: (
        <p>
          A rollout has two steps with TD errors 1 and 2, the episode ends after the second, γ = 0.9 and λ = 0.5. What is the
          GAE advantage at the first step?
        </p>
      ),
      answer: { kind: "numeric", value: 1.9, tolerance: 0.0001 },
    },
    {
      key: "lam",
      rung: "apply",
      prompt: <p>The critic has just been initialised and is very inaccurate. How should λ be set, compared with a well-trained critic?</p>,
      answer: {
        kind: "choice",
        options: [
          "Closer to 1, so the estimate relies more on actual rewards and less on the critic's values",
          "Closer to 0, so the estimate relies more on the critic",
          "λ does not matter when the critic is inaccurate",
          "Exactly 0.5, which balances bias and variance whatever the critic",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def td_errors(rewards, values, gamma, dones):
    return [r + gamma * values[t + 1] * (1 - d) - values[t] for t, (r, d) in enumerate(zip(rewards, dones))]

def gae(rewards, values, gamma, lam, dones):
    adv, a = [0.0] * len(rewards), 0.0
    for t in reversed(range(len(rewards))):
        delta = rewards[t] + gamma * values[t + 1] * (1 - dones[t]) - values[t]
        a = delta + gamma * lam * (1 - dones[t]) * a
        adv[t] = a
    return adv

def value_targets(adv, values):
    return [a + v for a, v in zip(adv, values)]

r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 1.0]; print(td_errors(r, v, 1.0, [0, 0, 0]), gae(r, v, 1.0, 0.5, [0, 0, 0]))
print(gae(r, v, 1.0, 0.5, [0, 0, 1]), value_targets(gae(r, v, 1.0, 0.5, [0, 0, 0]), v), gae(r, v, 1.0, 0.0, [0, 0, 0]) == td_errors(r, v, 1.0, [0, 0, 0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, -1.0, 3.0] [1.75, 0.5, 3.0]\n[1.5, 0.0, 2.0] [2.25, 1.5, 3.0] True",
          "[1.5, -1.0, 3.0] [1.75, 0.5, 3.0]\n[1.75, 0.5, 3.0] [2.25, 1.5, 3.0] True",
          "[1.5, -1.0, 3.0] [3.5, 0.5, 3.0]\n[1.5, 0.0, 2.0] [2.25, 1.5, 3.0] True",
          "[1.5, -1.0, 3.0] [1.75, 0.5, 3.0]\n[1.5, 0.0, 2.0] [1.25, -0.5, 3.0] False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def n_step_advantage(rewards, values, gamma, n, t):
    n = min(n, len(rewards) - t)
    ret = sum(gamma ** k * rewards[t + k] for k in range(n))
    return ret + gamma ** n * values[t + n] - values[t]

def lambda_weights(lam, n_max):
    return [(1 - lam) * lam ** (n - 1) for n in range(1, n_max)] + [lam ** (n_max - 1)]

def gae_from_nsteps(rewards, values, gamma, lam, t):
    w = lambda_weights(lam, len(rewards) - t)
    return sum(wn * n_step_advantage(rewards, values, gamma, n + 1, t) for n, wn in enumerate(w))

r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 1.0]; print([n_step_advantage(r, v, 1.0, n, 0) for n in (1, 2, 3, 9)], n_step_advantage(r, v, 1.0, 2, 2))
print(lambda_weights(0.5, 3), lambda_weights(0.0, 2), gae_from_nsteps(r, v, 1.0, 0.5, 0), gae_from_nsteps(r, v, 1.0, 1.0, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, 0.5, 3.5, 3.5] 3.0\n[0.5, 0.25, 0.25] [1.0, 0.0] 1.75 2.0",
          "[1.5, 0.5, 3.5, 4.5] 3.0\n[0.5, 0.25, 0.25] [1.0, 0.0] 1.75 2.0",
          "[1.5, 0.5, 3.5, 3.5] 3.0\n[0.5, 0.25, 0.125] [1.0, 0.0] 1.5625 2.0",
          "[1.5, 0.5, 3.5, 3.5] 2.0\n[0.5, 0.25, 0.25] [0.0, 1.0] 1.75 3.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With <C>values</C> one longer than <C>rewards</C> and <C>dones[t]</C> equal to 1 when step t ends an episode, write{" "}
          <C>td_errors(rewards, values, gamma, dones)</C>, <C>gae(rewards, values, gamma, lam, dones)</C> using the backward recursion,
          and <C>value_targets(adv, values)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def td_errors(rewards, values, gamma, dones):
    return [0.0] * len(rewards)

def gae(rewards, values, gamma, lam, dones):
    return [0.0] * len(rewards)

def value_targets(adv, values):
    return list(adv)
`,
        solution: GAE,
        tests: [
          { name: "deltas", code: `r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 1.0]
assert td_errors(r, v, 1.0, [0, 0, 0]) == [1.5, -1.0, 3.0] and td_errors(r, v, 1.0, [0, 0, 1]) == [1.5, -1.0, 2.0]
assert value_targets([1.75, 0.5, 3.0], v) == [2.25, 1.5, 3.0] and value_targets([], v) == []` },
          { name: "gae", code: `r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 1.0]
assert gae(r, v, 1.0, 0.5, [0, 0, 0]) == [1.75, 0.5, 3.0] and gae(r, v, 1.0, 0.5, [0, 0, 1]) == [1.5, 0.0, 2.0]
assert gae(r, v, 1.0, 1.0, [1, 0, 0]) == [0.5, 2.0, 3.0] and gae(r, v, 1.0, 0.0, [0, 0, 0]) == [1.5, -1.0, 3.0]
assert abs(gae([1.0, 1.0], [0.0, 2.0, 0.0], 0.9, 0.5, [0, 1])[0] - (1.0 + 1.8 + 0.45 * (1.0 - 2.0))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a rollout without episode ends, write <C>n_step_advantage(rewards, values, gamma, n, t)</C>, cutting n at the end of
          the rollout; <C>lambda_weights(lam, n_max)</C>, the weights on n = 1, …, n_max; and{" "}
          <C>gae_from_nsteps(rewards, values, gamma, lam, t)</C>, the weighted average of the n-step estimates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def n_step_advantage(rewards, values, gamma, n, t):
    return 0.0

def lambda_weights(lam, n_max):
    return [1.0 / n_max] * n_max

def gae_from_nsteps(rewards, values, gamma, lam, t):
    return 0.0
`,
        solution: NSTEP,
        tests: [
          { name: "nstep", code: `r, v = [1.0, 0.0, 2.0], [0.5, 1.0, 0.0, 1.0]
assert [n_step_advantage(r, v, 1.0, n, 0) for n in (1, 2, 3, 9)] == [1.5, 0.5, 3.5, 3.5] and n_step_advantage(r, v, 1.0, 2, 2) == 3.0
assert abs(n_step_advantage(r, v, 0.5, 2, 0) - (1.0 + 0.25 * 0.0 - 0.5)) < 1e-12
assert lambda_weights(0.5, 3) == [0.5, 0.25, 0.25] and lambda_weights(0.0, 2) == [1.0, 0.0] and lambda_weights(0.3, 1) == [1.0]` },
          { name: "equivalence", code: `r, v = [1.0, -2.0, 0.5, 3.0, 0.0], [0.2, 1.1, -0.4, 0.9, 2.0, 1.5]
for lam in (0.0, 0.3, 0.95, 1.0):
    for t in range(5):
        a = sum((0.9 * lam) ** l * (r[t + l] + 0.9 * v[t + l + 1] - v[t + l]) for l in range(5 - t))
        assert abs(gae_from_nsteps(r, v, 0.9, lam, t) - a) < 1e-9` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          In an endless chain with γ = 1, independent value errors with standard deviation s and reward noise with standard
          deviation σ, the GAE estimate has expected squared bias <M>{"s^2(1 - \\lambda)/(1 + \\lambda)"}</M> and variance{" "}
          <M>{"\\sigma^2/(1 - \\lambda^2)"}</M>. With s = 0.5 and σ = 0.2, which λ minimises their sum? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6721, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        GAE needs a critic, and the critic needs training. The next lesson (l6.6.5) puts the two together: an actor that
        follows the policy gradient with these advantage estimates, and a critic that learns the values they rely on, updated
        online from short rollouts rather than whole episodes.
      </p>
    </>
  ),
};
