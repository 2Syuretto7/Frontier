import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DynaMazeViz } from "@/components/viz/DynaMazeViz";
import type { LessonContent } from "@/lib/types";

const MODEL = `def learn_model(transitions, n_states, n_actions):
    count = [[{} for _ in range(n_actions)] for _ in range(n_states)]
    rsum = [[0.0] * n_actions for _ in range(n_states)]
    for s, a, r, s2 in transitions:
        count[s][a][s2] = count[s][a].get(s2, 0) + 1
        rsum[s][a] += r
    P = [[{k: c / sum(row.values()) for k, c in row.items()} for row in rows] for rows in count]
    R = [[rsum[s][a] / max(1, sum(count[s][a].values())) for a in range(n_actions)] for s in range(n_states)]
    return P, R

def q_values(P, R, V, gamma, s):
    return [R[s][a] + gamma * sum(p * (0.0 if s2 is None else V[s2]) for s2, p in P[s][a].items()) for a in range(len(P[s]))]

def plan(P, R, gamma, iters):
    V = [0.0] * len(P)
    for _ in range(iters):
        V = [max(q_values(P, R, V, gamma, s)) for s in range(len(P))]
    return V`;

const DYNA = `def q_update(Q, s, a, r, s2, alpha, gamma):
    target = r + (0.0 if s2 is None else gamma * max(Q[s2]))
    Q[s][a] += alpha * (target - Q[s][a])

def dyna_step(Q, model, s, a, r, s2, alpha, gamma, n, rng):
    q_update(Q, s, a, r, s2, alpha, gamma)
    model[(s, a)] = (r, s2)
    keys = list(model)
    for _ in range(n):
        ps, pa = keys[rng.randrange(len(keys))]
        pr, ps2 = model[(ps, pa)]
        q_update(Q, ps, pa, pr, ps2, alpha, gamma)

def compound_error(f_true, f_model, x0, steps):
    x, y, out = x0, x0, []
    for _ in range(steps):
        x, y = f_true(x), f_model(y)
        out.append(abs(x - y))
    return out`;

export const lesson: LessonContent = {
  id: "l6.8.1",
  minutes: 50,
  links: {
    requires: ["l6.4.5", "l6.3.3"],
    revisits: ["l6.5.2"],
    foreshadows: ["l6.8.2", "l6.8.4"],
  },

  puzzle: (
    <>
      <p>
        A Q-learning agent that finally reaches the goal of a maze learns something about the last step only. The value of
        the goal creeps back along the path one step per visit, so the agent must walk the maze dozens of times. Yet after a
        single trip it already knows which moves lead where. How can it use that knowledge without walking the maze again?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Remember what happened and learn from the memory. A model of the environment, here just a table of the transitions
        seen so far, can generate as much simulated experience as the agent can afford to compute, and ordinary value
        updates on that experience are planning. Real steps are expensive and thinking is cheap, so a few planning updates
        per real step can cut the number of real steps dramatically. The price is that the model may be wrong, and planning
        trusts it.
      </p>
      <DynaMazeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="models and certainty equivalence">
        <p>
          A <em>model</em> is an estimate <M>{"\\hat p(s', r \\mid s, a)"}</M> of the environment&apos;s dynamics. In a finite problem the
          maximum-likelihood model is the table of observed frequencies and average rewards (<C>learn_model</C>, with None marking
          the end of an episode; a pair never tried has no successors and reward 0). <em>Certainty-equivalent</em> control plans
          in the learned model as if it were true, for example by value iteration (l6.3.3; <C>q_values</C>, <C>plan</C>), and acts
          greedily on the result.
        </p>
        <Code>{MODEL}</Code>
      </Definition>

      <Theorem title="the simulation lemma">
        <p>
          Fix a policy π and suppose that for every state the model&apos;s expected reward is within <M>{"\\varepsilon_R"}</M> of the true one
          and its next-state distribution within <M>{"\\varepsilon_P"}</M> in total variation sum,{" "}
          <M>{"\\sum_{s'}|\\hat P(s' \\mid s) - P(s' \\mid s)| \\le \\varepsilon_P"}</M>. If rewards lie in <M>{"[0, R_{\\max}]"}</M>, then
        </p>
        <MD>{"\\|\\hat v^\\pi - v^\\pi\\|_\\infty \\le \\frac{1}{1 - \\gamma}\\Bigl(\\varepsilon_R + \\frac{\\gamma\\,\\varepsilon_PR_{\\max}}{1 - \\gamma}\\Bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          In vector form <M>{"v = R + \\gamma Pv"}</M> and <M>{"\\hat v = \\hat R + \\gamma\\hat P\\hat v"}</M> for the policy&apos;s rewards and transitions.
          Subtracting, <M>{"\\hat v - v = (\\hat R - R) + \\gamma(\\hat P - P)v + \\gamma\\hat P(\\hat v - v)"}</M>. Take the largest entry in
          absolute value: <M>{"\\hat P"}</M> is an average so it does not increase it, and{" "}
          <M>{"|((\\hat P - P)v)(s)| \\le \\varepsilon_P\\|v\\|_\\infty \\le \\varepsilon_PR_{\\max}/(1 - \\gamma)"}</M>. So{" "}
          <M>{"\\|\\hat v - v\\| \\le \\varepsilon_R + \\gamma\\varepsilon_PR_{\\max}/(1 - \\gamma) + \\gamma\\|\\hat v - v\\|"}</M>; rearrange. Small model
          errors give small value errors, but the factor <M>{"1/(1 - \\gamma)^2"}</M> magnifies them over long horizons.
        </p>
      </Proof>

      <Definition title="Dyna">
        <p>
          (Sutton, 1990.) Interleave three processes. <em>Direct learning</em> updates the values from each real transition, here
          by Q-learning (l6.4.5; <C>q_update</C>). <em>Model learning</em> stores the transition; for a deterministic environment the
          last outcome of each pair is enough. <em>Planning</em> then draws n previously seen pairs at random and applies the same
          update to the model&apos;s predictions (<C>dyna_step</C>). With n = 0 this is Q-learning; as n grows, each real step is
          propagated through everything already known, as the picture shows.
        </p>
        <Code>{DYNA}</Code>
      </Definition>

      <Remark title="replay is a model">
        <p>
          A replay buffer (l6.5.2) is a nonparametric model that can only reproduce transitions exactly as seen, and replaying
          it is a form of Dyna. A learned model can do more: generalise to state-action pairs never tried, imagine longer
          sequences, and be queried for any state the planner chooses, for example the predecessors of states whose values just
          changed (prioritised sweeping).
        </p>
      </Remark>

      <Remark title="compounding errors">
        <p>
          Planning many steps ahead feeds the model&apos;s predictions back into itself, so errors compound. If the true dynamics
          are <M>{"x \\mapsto 2x"}</M> and the model adds a bias of 1, the gap after k steps is <M>{"2^k - 1"}</M> (<C>compound_error</C>). In
          general an error ε per step and a Lipschitz constant L give a gap of up to{" "}
          <M>{"\\varepsilon(1 + L + \\dots + L^{k-1})"}</M>. Modern methods respond by planning over short horizons from real states
          (MBPO, Janner et al., 2019), by replanning at every step (model-predictive control), and by learning ensembles of
          models whose disagreement signals where the model cannot be trusted (PETS, Chua et al., 2018). When the
          environment changes, a model that is never revisited becomes stale; Dyna-Q+ adds a bonus{" "}
          <M>{"\\kappa\\sqrt\\tau"}</M> for pairs not tried for τ steps to make the agent check.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "p",
      rung: "check",
      prompt: (
        <p>
          A state-action pair was tried four times: three times it led to state B and once to state C. What probability does
          the maximum-likelihood model give to B?
        </p>
      ),
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "gap",
      rung: "check",
      prompt: (
        <p>
          A model makes an error of at most 0.1 per step, and the dynamics have Lipschitz constant 2. What is the worst-case gap
          after three steps of a rollout started from the true state?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>In the picture, why does Dyna-Q with n = 50 need far fewer real episodes than Q-learning?</p>,
      answer: {
        kind: "choice",
        options: [
          "Planning updates on remembered transitions carry the goal's value back along the whole known path without new real steps",
          "It explores more, because it chooses random actions more often",
          "It uses a larger step size",
          "Its model knows the maze before the first episode",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def learn_model(transitions, n_states, n_actions):
    count = [[{} for _ in range(n_actions)] for _ in range(n_states)]
    rsum = [[0.0] * n_actions for _ in range(n_states)]
    for s, a, r, s2 in transitions:
        count[s][a][s2] = count[s][a].get(s2, 0) + 1
        rsum[s][a] += r
    P = [[{k: c / sum(row.values()) for k, c in row.items()} for row in rows] for rows in count]
    R = [[rsum[s][a] / max(1, sum(count[s][a].values())) for a in range(n_actions)] for s in range(n_states)]
    return P, R

def q_values(P, R, V, gamma, s):
    return [R[s][a] + gamma * sum(p * (0.0 if s2 is None else V[s2]) for s2, p in P[s][a].items()) for a in range(len(P[s]))]

def plan(P, R, gamma, iters):
    V = [0.0] * len(P)
    for _ in range(iters):
        V = [max(q_values(P, R, V, gamma, s)) for s in range(len(P))]
    return V

P, R = learn_model([(0, 0, 1.0, 1), (0, 0, 0.0, None), (1, 1, 2.0, None), (0, 1, 0.25, 0)], 2, 2); print(P[0], R[0], P[1][0], R[1])
print(plan(P, R, 0.5, 1), plan(P, R, 0.5, 50), q_values(P, R, [1.0, 2.0], 0.5, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[{1: 0.5, None: 0.5}, {0: 1.0}] [0.5, 0.25] {} [0.0, 2.0]\n[0.5, 2.0] [1.0, 2.0] [1.0, 0.75]",
          "[{1: 0.5, None: 0.5}, {0: 1.0}] [0.5, 0.25] {} [0.0, 2.0]\n[0.5, 2.0] [1.5, 2.0] [1.5, 0.75]",
          "[{1: 1.0}, {0: 1.0}] [1.0, 0.25] {} [0.0, 2.0]\n[1.0, 2.0] [2.0, 2.0] [2.0, 0.75]",
          "[{1: 0.5, None: 0.5}, {0: 1.0}] [0.5, 0.25] {} [0.0, 2.0]\n[0.0, 0.0] [1.0, 2.0] [1.0, 0.75]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def q_update(Q, s, a, r, s2, alpha, gamma):
    target = r + (0.0 if s2 is None else gamma * max(Q[s2]))
    Q[s][a] += alpha * (target - Q[s][a])

def dyna_step(Q, model, s, a, r, s2, alpha, gamma, n, rng):
    q_update(Q, s, a, r, s2, alpha, gamma)
    model[(s, a)] = (r, s2)
    keys = list(model)
    for _ in range(n):
        ps, pa = keys[rng.randrange(len(keys))]
        pr, ps2 = model[(ps, pa)]
        q_update(Q, ps, pa, pr, ps2, alpha, gamma)

def compound_error(f_true, f_model, x0, steps):
    x, y, out = x0, x0, []
    for _ in range(steps):
        x, y = f_true(x), f_model(y)
        out.append(abs(x - y))
    return out

import random; Q, model, rng = [[0.0, 0.0], [0.0, 0.0]], {}, random.Random(0); dyna_step(Q, model, 1, 0, 1.0, None, 0.5, 0.9, 2, rng); print(Q, model)
dyna_step(Q, model, 0, 1, 0.0, 1, 0.5, 0.9, 0, rng); print(Q, compound_error(lambda x: 2.0 * x, lambda x: 2.0 * x + 1.0, 0.0, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 0.0], [0.875, 0.0]] {(1, 0): (1.0, None)}\n[[0.0, 0.39375], [0.875, 0.0]] [1.0, 3.0, 7.0]",
          "[[0.0, 0.0], [0.5, 0.0]] {(1, 0): (1.0, None)}\n[[0.0, 0.225], [0.5, 0.0]] [1.0, 3.0, 7.0]",
          "[[0.0, 0.0], [0.875, 0.0]] {(1, 0): (1.0, None)}\n[[0.0, 0.39375], [0.875, 0.0]] [1.0, 2.0, 4.0]",
          "[[0.0, 0.0], [0.875, 0.0]] {}\n[[0.0, 0.7875], [0.875, 0.0]] [1.0, 3.0, 7.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For transitions (s, a, r, s2) with s2 None at the end, write <C>learn_model(transitions, n_states, n_actions)</C>, returning
          the tables P (a dictionary of next-state probabilities per pair) and R (average rewards, 0 for untried pairs);{" "}
          <C>q_values(P, R, V, gamma, s)</C>; and <C>plan(P, R, gamma, iters)</C>, value iteration from zeros.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def learn_model(transitions, n_states, n_actions):
    return [[{} for _ in range(n_actions)] for _ in range(n_states)], [[0.0] * n_actions for _ in range(n_states)]

def q_values(P, R, V, gamma, s):
    return [0.0] * len(P[s])

def plan(P, R, gamma, iters):
    return [0.0] * len(P)
`,
        solution: MODEL,
        tests: [
          { name: "model", code: `P, R = learn_model([(0, 0, 1.0, 1), (0, 0, 0.0, None), (1, 1, 2.0, None), (0, 1, 0.25, 0)], 2, 2)
assert P == [[{1: 0.5, None: 0.5}, {0: 1.0}], [{}, {None: 1.0}]] and R == [[0.5, 0.25], [0.0, 2.0]]
P2, R2 = learn_model([(0, 0, 1.0, 0), (0, 0, 2.0, 0), (0, 0, 3.0, 1), (0, 0, 2.0, 0)], 2, 1)
assert P2[0][0] == {0: 0.75, 1: 0.25} and R2 == [[2.0], [0.0]]` },
          { name: "plan", code: `P, R = learn_model([(0, 0, 1.0, 1), (0, 0, 0.0, None), (1, 1, 2.0, None), (0, 1, 0.25, 0)], 2, 2)
assert plan(P, R, 0.5, 1) == [0.5, 2.0] and plan(P, R, 0.5, 50) == [1.0, 2.0] and q_values(P, R, [1.0, 2.0], 0.5, 0) == [1.0, 0.75]
P3, R3 = learn_model([(0, 0, 1.0, 0)], 1, 1)
assert abs(plan(P3, R3, 0.9, 500)[0] - 10.0) < 1e-6 and plan(P3, R3, 0.9, 0) == [0.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>q_update(Q, s, a, r, s2, alpha, gamma)</C>, updating Q in place with s2 None at the end;{" "}
          <C>dyna_step(Q, model, s, a, r, s2, alpha, gamma, n, rng)</C>, which updates from the real transition, stores it in the
          dictionary <C>model</C> as <C>(r, s2)</C>, and then makes n planning updates from keys drawn with{" "}
          <C>rng.randrange(len(keys))</C> over <C>list(model)</C>; and <C>compound_error(f_true, f_model, x0, steps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def q_update(Q, s, a, r, s2, alpha, gamma):
    pass

def dyna_step(Q, model, s, a, r, s2, alpha, gamma, n, rng):
    pass

def compound_error(f_true, f_model, x0, steps):
    return [0.0] * steps
`,
        solution: DYNA,
        tests: [
          { name: "dyna", code: `import random
Q, model = [[0.0, 0.0], [0.0, 0.0]], {}
dyna_step(Q, model, 1, 0, 1.0, None, 0.5, 0.9, 2, random.Random(0))
assert Q == [[0.0, 0.0], [0.875, 0.0]] and model == {(1, 0): (1.0, None)}
dyna_step(Q, model, 0, 1, 0.0, 1, 0.5, 0.9, 0, random.Random(0))
assert abs(Q[0][1] - 0.39375) < 1e-12 and len(model) == 2
class First:
    def randrange(self, n): return 0
Q2, m2 = [[0.0], [0.0], [0.0]], {}
dyna_step(Q2, m2, 1, 0, 1.0, None, 1.0, 1.0, 0, First()); dyna_step(Q2, m2, 0, 0, 0.0, 1, 1.0, 1.0, 0, First())
dyna_step(Q2, m2, 2, 0, 0.0, 0, 0.5, 1.0, 3, First())
assert Q2 == [[1.0], [1.0], [0.5]]` },
          { name: "compound", code: `assert compound_error(lambda x: 2.0 * x, lambda x: 2.0 * x + 1.0, 0.0, 3) == [1.0, 3.0, 7.0] and compound_error(abs, abs, -1.0, 2) == [0.0, 0.0]
assert compound_error(lambda x: x, lambda x: x, 5.0, 0) == []
e = compound_error(lambda x: 0.5 * x, lambda x: 0.5 * x + 0.1, 1.0, 40)
assert abs(e[-1] - 0.2) < 1e-9 and abs(e[0] - 0.1) < 1e-12` },
        ],
      },
    },
    {
      key: "sim",
      rung: "stretch",
      prompt: (
        <p>
          With γ = 0.9, rewards in [0, 1], reward errors at most 0.01 and next-state distributions off by at most 0.05 in total
          variation sum, what bound does the simulation lemma give on the error of a policy&apos;s values?
        </p>
      ),
      answer: { kind: "numeric", value: 4.6, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Dyna plans by sampling remembered transitions at random. When the agent knows the rules exactly, as in a board game,
        it can instead plan deliberately from the current position, growing a search tree where it matters most. Monte Carlo
        tree search (l6.8.2) does that with random rollouts and a bandit rule at each node.
      </p>
    </>
  ),
};
