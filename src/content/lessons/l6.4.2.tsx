import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TdVsMcViz } from "@/components/viz/TdVsMcViz";
import type { LessonContent } from "@/lib/types";

const TD = `def td0_episode(V, episode, alpha, gamma):
    for s, r, s2 in episode:
        target = r + (gamma * V[s2] if s2 is not None else 0.0)
        V[s] += alpha * (target - V[s])
    return V

def td_errors(V, episode, gamma):
    return [r + (gamma * V[s2] if s2 is not None else 0.0) - V[s] for s, r, s2 in episode]

def batch_td(episodes, alpha, gamma, sweeps):
    V = {}
    for ep in episodes:
        for s, _, _ in ep:
            V[s] = 0.0
    for _ in range(sweeps):
        for ep in episodes:
            td0_episode(V, ep, alpha, gamma)
    return V`;

const CE = `def ml_model(episodes):
    counts, rew, nxt = {}, {}, {}
    for ep in episodes:
        for s, r, s2 in ep:
            counts[s] = counts.get(s, 0) + 1
            rew[s] = rew.get(s, 0.0) + r
            nxt.setdefault(s, {})
            nxt[s][s2] = nxt[s].get(s2, 0) + 1
    return ({s: rew[s] / counts[s] for s in counts},
            {s: {s2: c / counts[s] for s2, c in nxt[s].items()} for s in counts})

def ce_values(episodes, gamma, iters):
    R, T = ml_model(episodes)
    V = {s: 0.0 for s in R}
    for _ in range(iters):
        V = {s: R[s] + gamma * sum(p * V[s2] for s2, p in T[s].items() if s2 is not None) for s in R}
    return V

def batch_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        g = 0.0
        for s, r, _ in reversed(ep):
            g = r + gamma * g
            total[s] = total.get(s, 0.0) + g
            count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}`;

export const lesson: LessonContent = {
  id: "l6.4.2",
  minutes: 55,
  links: {
    requires: ["l6.4.1", "l6.3.1"],
    revisits: ["l6.2.4"],
    foreshadows: ["l6.4.3", "l6.4.4", "l6.5.3"],
  },

  puzzle: (
    <>
      <p>
        You drive home every evening and predict the arrival time as you go. Leaving the office you predict 30 minutes; at the
        motorway you see heavy traffic and revise to 40. Monte Carlo would wait until you get home before correcting the first
        prediction. But the second prediction already tells you the first was too optimistic. Can one prediction learn from
        the next one, and is that a sound way to learn?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Temporal-difference learning updates a value towards the observed reward plus the current estimate of the next
        state&apos;s value. It learns after every step, works in tasks that never end, and its target, depending on one random
        transition rather than the whole rest of the episode, is far less noisy. The cost is bias: the target leans on an
        estimate that may be wrong. On average the update is exactly the Bellman update of policy evaluation, applied to one
        sampled transition at a time.
      </p>
      <TdVsMcViz />
    </>
  ),

  theory: (
    <>
      <Definition title="TD(0)">
        <p>
          After each transition <M>{"(S_t, R_{t+1}, S_{t+1})"}</M>, compute the <em>TD error</em>
        </p>
        <MD>{"\\delta_t = R_{t+1} + \\gamma V(S_{t+1}) - V(S_t),"}</MD>
        <p>
          with <M>{"V(S_{t+1}) = 0"}</M> if <M>{"S_{t+1}"}</M> is terminal, and set <M>{"V(S_t) \\leftarrow V(S_t) + \\alpha\\delta_t"}</M>. An
          episode is stored as a list of triples (state, reward, next state), with None for a terminal next state (
          <C>td0_episode</C>, <C>td_errors</C>, and <C>batch_td</C>, which replays a fixed batch of episodes many times).
        </p>
        <Code>{TD}</Code>
      </Definition>

      <Theorem title="TD errors add up to the Monte Carlo error">
        <p>If V is held fixed during an episode that ends at time T, then</p>
        <MD>{"G_t - V(S_t) = \\sum_{k=t}^{T-1}\\gamma^{k-t}\\delta_k."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"G_t - V(S_t) = R_{t+1} + \\gamma G_{t+1} - V(S_t) = \\delta_t + \\gamma\\bigl(G_{t+1} - V(S_{t+1})\\bigr)"}</M>. Unroll until
          time T, where <M>{"G_T = V(S_T) = 0"}</M>. So the Monte Carlo update spreads the same total correction that TD makes one step
          at a time; TD(λ) (l6.4.3) interpolates between the two.
        </p>
      </Proof>

      <Theorem title="TD is a sampled Bellman update">
        <p>
          Given <M>{"S_t = s"}</M>, the expected TD target is <M>{"\\mathbb{E}_\\pi[R_{t+1} + \\gamma V(S_{t+1}) \\mid S_t = s] = (T^\\pi V)(s)"}</M>.
          With tabular values, step sizes satisfying <M>{"\\sum\\alpha = \\infty"}</M> and <M>{"\\sum\\alpha^2 < \\infty"}</M> at each state, and
          every state visited infinitely often, TD(0) converges to <M>{"v_\\pi"}</M> with probability 1 (Dayan, 1992; Jaakkola,
          Jordan and Singh, 1994).
        </p>
      </Theorem>
      <Proof>
        <p>
          The expectation is the definition of <M>{"T^\\pi"}</M> (l6.2.4). So TD(0) is iterative policy evaluation (l6.3.1) in which
          each update uses one sampled successor instead of the full average, plus noise with mean zero. The convergence proof
          uses the theory of stochastic approximation: an iteration that moves by small steps towards a contraction&apos;s output,
          plus zero-mean noise, converges to the fixed point.
        </p>
      </Proof>

      <Definition title="certainty equivalence">
        <p>
          Given a batch of episodes, the <em>maximum-likelihood model</em> estimates each transition probability by its observed
          frequency and each expected reward by its observed average (<C>ml_model</C>). The <em>certainty-equivalence</em> estimate
          is the value function of that model, computed by policy evaluation (<C>ce_values</C>). <C>batch_mc</C> averages the
          observed returns instead.
        </p>
        <Code>{CE}</Code>
      </Definition>

      <Theorem title="what batch updates converge to">
        <p>
          Repeatedly sweeping a fixed batch with a small enough constant α, Monte Carlo converges to the average observed return
          from each state, which minimises the squared error on the batch, and TD(0) converges to the certainty-equivalence
          estimate.
        </p>
      </Theorem>
      <Proof>
        <p>
          For Monte Carlo the batch update is gradient descent on the sum of squared errors <M>{"\\sum(G - V(s))^2"}</M>, whose
          minimiser is the average. For TD(0), the total update to V(s) in one sweep is α times the sum over the transitions
          from s of <M>{"r + \\gamma V(s') - V(s)"}</M>, which is α times the count of s times{" "}
          <M>{"\\hat r(s) + \\gamma\\sum_{s'}\\hat p(s' \\mid s)V(s') - V(s)"}</M> for the maximum-likelihood estimates. It is zero exactly
          when V satisfies the Bellman equation of the estimated model, and small α makes the sweeps a convergent damped
          iteration towards that solution.
        </p>
      </Proof>

      <Example title="the two answers differ">
        <p>
          Eight episodes: one goes A → B with reward 0 and then ends with reward 0; six start at B and end with reward 1; one
          starts at B and ends with reward 0. With γ = 1, batch Monte Carlo gives V(B) = 6/8 and V(A) = 0, the only return ever
          seen from A. Certainty equivalence says A always leads to B, so V(A) = V(B) = 0.75. If the process is Markov, the second
          answer uses all eight episodes to judge A, and is the better prediction of future returns.
        </p>
      </Example>

      <Remark title="bias, variance and bootstrapping">
        <p>
          Using an estimate inside the target is called <em>bootstrapping</em>. It makes the target biased while V is wrong, but
          removes the variance of all later rewards, which is why TD usually learns faster, as in the picture. Bootstrapping also
          has a dark side: combined with function approximation and off-policy data it can make values diverge (l6.5.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ab",
      rung: "check",
      prompt: <p>In the eight-episode example, what value does batch TD(0) give to A?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "delta",
      rung: "check",
      prompt: (
        <p>
          The current estimates are V(s) = 0.4 and V(s′) = 0.7. A transition from s to s′ earns reward 1, with γ = 0.9. What is the
          TD error?
        </p>
      ),
      answer: { kind: "numeric", value: 1.23, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does batch TD value A at 0.75 when the only return observed from A was 0?</p>,
      answer: {
        kind: "choice",
        options: [
          "It treats A as leading to B, whose value is learnt from all eight episodes, so the experience of B is used to judge A",
          "Because TD ignores the rewards of episodes starting at A",
          "Because the TD target always equals the average reward",
          "Because TD with γ = 1 gives every state the same value",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def td0_episode(V, episode, alpha, gamma):
    for s, r, s2 in episode:
        target = r + (gamma * V[s2] if s2 is not None else 0.0)
        V[s] += alpha * (target - V[s])
    return V

def td_errors(V, episode, gamma):
    return [r + (gamma * V[s2] if s2 is not None else 0.0) - V[s] for s, r, s2 in episode]

def batch_td(episodes, alpha, gamma, sweeps):
    V = {}
    for ep in episodes:
        for s, _, _ in ep:
            V[s] = 0.0
    for _ in range(sweeps):
        for ep in episodes:
            td0_episode(V, ep, alpha, gamma)
    return V

ep = [("A", 0, "B"), ("B", 1, None)]; print(td0_episode({"A": 0.0, "B": 0.0}, ep, 0.5, 1.0), td_errors({"A": 0.5, "B": 0.25}, ep, 1.0))
print(td0_episode({"A": 1.0, "B": 2.0}, ep, 1.0, 0.5), {k: round(v, 3) for k, v in batch_td([ep], 0.5, 1.0, 20).items()})`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'A': 0.0, 'B': 0.5} [-0.25, 0.75]\n{'A': 1.0, 'B': 1.0} {'A': 1.0, 'B': 1.0}",
          "{'A': 0.25, 'B': 0.5} [-0.25, 0.75]\n{'A': 1.0, 'B': 1.0} {'A': 1.0, 'B': 1.0}",
          "{'A': 0.0, 'B': 0.5} [0.25, 0.75]\n{'A': 1.0, 'B': 1.0} {'A': 1.0, 'B': 1.0}",
          "{'A': 0.0, 'B': 0.5} [-0.25, 0.75]\n{'A': 1.0, 'B': 1.0} {'A': 0.5, 'B': 1.0}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ml_model(episodes):
    counts, rew, nxt = {}, {}, {}
    for ep in episodes:
        for s, r, s2 in ep:
            counts[s] = counts.get(s, 0) + 1
            rew[s] = rew.get(s, 0.0) + r
            nxt.setdefault(s, {})
            nxt[s][s2] = nxt[s].get(s2, 0) + 1
    return ({s: rew[s] / counts[s] for s in counts},
            {s: {s2: c / counts[s] for s2, c in nxt[s].items()} for s in counts})

def ce_values(episodes, gamma, iters):
    R, T = ml_model(episodes)
    V = {s: 0.0 for s in R}
    for _ in range(iters):
        V = {s: R[s] + gamma * sum(p * V[s2] for s2, p in T[s].items() if s2 is not None) for s in R}
    return V

def batch_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        g = 0.0
        for s, r, _ in reversed(ep):
            g = r + gamma * g
            total[s] = total.get(s, 0.0) + g
            count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}

eps = [[("A", 0, "B"), ("B", 0, None)]] + [[("B", 1, None)]] * 3; print(ml_model(eps))
print({k: round(v, 4) for k, v in ce_values(eps, 1.0, 50).items()}, batch_mc(eps, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "({'A': 0.0, 'B': 0.75}, {'A': {'B': 1.0}, 'B': {None: 1.0}})\n{'A': 0.75, 'B': 0.75} {'B': 0.75, 'A': 0.0}",
          "({'A': 0.0, 'B': 0.75}, {'A': {'B': 1.0}, 'B': {None: 1.0}})\n{'A': 0.75, 'B': 0.75} {'A': 0.0, 'B': 0.75}",
          "({'A': 0.0, 'B': 0.6}, {'A': {'B': 1.0}, 'B': {None: 1.0}})\n{'A': 0.6, 'B': 0.6} {'B': 0.6, 'A': 0.0}",
          "({'A': 0.0, 'B': 0.75}, {'A': {'B': 1.0}, 'B': {None: 1.0}})\n{'A': 0.0, 'B': 0.75} {'B': 0.75, 'A': 0.0}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>td0_episode(V, episode, alpha, gamma)</C>, which applies TD(0) to the dictionary V along an episode of (state,
          reward, next state) triples and returns V; <C>td_errors(V, episode, gamma)</C>, the TD errors for a fixed V; and{" "}
          <C>batch_td(episodes, alpha, gamma, sweeps)</C>, which starts every state seen at 0.0 and applies <C>td0_episode</C> to each
          episode in turn, for the given number of sweeps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def td0_episode(V, episode, alpha, gamma):
    return V

def td_errors(V, episode, gamma):
    return []

def batch_td(episodes, alpha, gamma, sweeps):
    return {}
`,
        solution: TD,
        tests: [
          { name: "td", code: `ep = [("A", 0, "B"), ("B", 1, None)]
assert td0_episode({"A": 0.0, "B": 0.0}, ep, 0.5, 1.0) == {"A": 0.0, "B": 0.5} and td0_episode({"A": 1.0, "B": 2.0}, ep, 1.0, 0.5) == {"A": 1.0, "B": 1.0}
assert td_errors({"A": 0.5, "B": 0.25}, ep, 1.0) == [-0.25, 0.75] and abs(td_errors({"s": 0.4, "t": 0.7}, [("s", 1, "t")], 0.9)[0] - 1.23) < 1e-12` },
          { name: "batch", code: `AB = [[("A", 0, "B"), ("B", 0, None)]] + [[("B", 1, None)]] * 6 + [[("B", 0, None)]]
V = batch_td(AB, 0.01, 1.0, 3000); assert abs(V["A"] - 0.75) < 1e-3 and abs(V["B"] - 0.75) < 1e-3 and batch_td(AB, 0.1, 1.0, 0) == {"A": 0.0, "B": 0.0}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ml_model(episodes)</C>, returning a dictionary of average rewards and a dictionary of next-state frequencies for
          each state, with None for termination; <C>ce_values(episodes, gamma, iters)</C>, iterating the Bellman equation of that
          model from zero; and <C>batch_mc(episodes, gamma)</C>, the every-visit average of observed returns, filled in by a backward
          pass over each episode.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ml_model(episodes):
    return {}, {}

def ce_values(episodes, gamma, iters):
    return {}

def batch_mc(episodes, gamma):
    return {}
`,
        solution: CE,
        tests: [
          { name: "model", code: `eps = [[("A", 0, "B"), ("B", 0, None)]] + [[("B", 1, None)]] * 3
assert ml_model(eps) == ({"A": 0.0, "B": 0.75}, {"A": {"B": 1.0}, "B": {None: 1.0}})
R, T = ml_model([[("x", 2, "y"), ("y", 0, "x"), ("x", 4, None)]]); assert R == {"x": 3.0, "y": 0.0} and T == {"x": {"y": 0.5, None: 0.5}, "y": {"x": 1.0}}` },
          { name: "ce", code: `AB = [[("A", 0, "B"), ("B", 0, None)]] + [[("B", 1, None)]] * 6 + [[("B", 0, None)]]
assert ce_values(AB, 1.0, 50) == {"A": 0.75, "B": 0.75} and batch_mc(AB, 1.0) == {"B": 0.75, "A": 0.0}
V = ce_values([[("x", 2, "y"), ("y", 0, "x"), ("x", 4, None)]], 0.5, 200); assert abs(V["x"] - 3 / 0.875) < 1e-12 and abs(V["y"] - 0.5 * V["x"]) < 1e-12` },
        ],
      },
    },
    {
      key: "ce",
      rung: "stretch",
      prompt: (
        <p>
          Three episodes, with γ = 0.9: A → B (reward 0), B → C (0), C ends (1); B → A (0), A ends (0); C → B (0), B ends (2). What is
          the certainty-equivalence value of A? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5034, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        TD(0) looks one step ahead and Monte Carlo looks all the way to the end. The next lesson (l6.4.3) blends every lookahead
        length into one target, the λ-return, and shows how eligibility traces compute its updates online, one step at a time.
      </p>
    </>
  ),
};
