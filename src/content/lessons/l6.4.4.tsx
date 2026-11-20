import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CliffSarsaViz } from "@/components/viz/CliffSarsaViz";
import type { LessonContent } from "@/lib/types";

const SARSA = `def eps_greedy_action(Q, s, eps, rng):
    acts = list(Q[s])
    if rng.random() < eps:
        return rng.choice(acts)
    return max(acts, key=lambda a: Q[s][a])

def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma):
    target = r + (gamma * Q[s2][a2] if s2 is not None else 0.0)
    Q[s][a] += alpha * (target - Q[s][a])

def run_sarsa(step, start, Q, episodes, alpha, gamma, eps, rng):
    totals = []
    for _ in range(episodes):
        s, total = start, 0.0
        a = eps_greedy_action(Q, s, eps, rng)
        while s is not None:
            s2, r = step(s, a)
            a2 = eps_greedy_action(Q, s2, eps, rng) if s2 is not None else None
            sarsa_update(Q, s, a, r, s2, a2, alpha, gamma)
            s, a, total = s2, a2, total + r
        totals.append(total)
    return totals`;

const ESARSA = `def eps_probs(Q, s, eps):
    acts = list(Q[s])
    best = max(acts, key=lambda a: Q[s][a])
    return {a: eps / len(acts) + (1 - eps if a == best else 0.0) for a in acts}

def expected_target(Q, r, s2, gamma, eps):
    if s2 is None:
        return r
    return r + gamma * sum(p * Q[s2][a] for a, p in eps_probs(Q, s2, eps).items())

def expected_sarsa_update(Q, s, a, r, s2, alpha, gamma, eps):
    Q[s][a] += alpha * (expected_target(Q, r, s2, gamma, eps) - Q[s][a])`;

export const lesson: LessonContent = {
  id: "l6.4.4",
  minutes: 55,
  links: {
    requires: ["l6.4.2", "l6.1.2"],
    revisits: ["l6.3.2", "l6.4.1"],
    foreshadows: ["l6.4.5", "l6.5.2"],
  },

  puzzle: (
    <>
      <p>
        TD learning predicts values for a fixed policy. To control, an agent must also improve its policy, and without a model it
        cannot look ahead with state values: knowing that the next state is good does not say which action gets there. It must
        learn the value of each action directly, keep exploring so that it learns about all of them, and improve as it goes.
        What does such a learner converge to, given that it never stops exploring?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Apply TD to action values: after taking A in S and seeing R and S′, choose the next action A′ with the current
        ε-greedy policy and move Q(S, A) towards R + γQ(S′, A′). The quintuple (S, A, R, S′, A′) gives the method its name. Since
        A′ comes from the policy being followed, SARSA learns the values of that exploring policy, mistakes included. Near a
        cliff, an agent that sometimes stumbles learns that walking along the edge is dangerous and keeps its distance.
      </p>
      <CliffSarsaViz />
    </>
  ),

  theory: (
    <>
      <Definition title="SARSA">
        <p>
          Keep a table Q(s, a). In each episode choose A from S ε-greedily (<C>eps_greedy_action</C>, which breaks ties by the order of
          the actions). Repeat: take A, observe R and S′, choose A′ ε-greedily from S′, and update
        </p>
        <MD>{"Q(S, A) \\leftarrow Q(S, A) + \\alpha\\bigl(R + \\gamma Q(S', A') - Q(S, A)\\bigr),"}</MD>
        <p>
          with the bracketed target equal to R when S′ is terminal (<C>sarsa_update</C>). <C>run_sarsa</C> takes an environment
          function <C>step(s, a)</C> returning (next state, reward), with None for termination, and returns the total reward of
          each episode.
        </p>
        <Code>{SARSA}</Code>
      </Definition>

      <Theorem title="convergence of SARSA">
        <p>
          (Singh, Jaakkola, Littman and Szepesvári, 2000.) For a finite MDP with tabular Q, if every state-action pair is visited
          infinitely often, the step sizes satisfy the Robbins–Monro conditions, and the policy is greedy in the limit with
          infinite exploration (for example ε-greedy with <M>{"\\varepsilon_t \\to 0"}</M> slowly enough), then SARSA converges to{" "}
          <M>{"q_*"}</M> with probability 1.
        </p>
      </Theorem>
      <Remark title="what SARSA learns with constant ε">
        <p>
          The expected SARSA target, given S and A, is <M>{"\\sum_{s', r}p(s', r \\mid s, a)(r + \\gamma\\sum_{a'}\\pi(a' \\mid s')Q(s', a'))"}</M>,
          the Bellman expectation operator of the current ε-greedy policy π applied to Q. With ε held fixed, SARSA therefore
          evaluates and improves the ε-greedy policy itself, and settles on the best policy among those that explore at rate ε,
          not on <M>{"q_*"}</M>. That is exactly why, in the picture, its greedy path avoids the cliff edge: the values it has
          learnt include the cost of its own random steps.
        </p>
      </Remark>

      <Definition title="expected SARSA">
        <p>
          Replace the sampled <M>{"Q(S', A')"}</M> by its expectation under the policy:
        </p>
        <MD>{"Q(S, A) \\leftarrow Q(S, A) + \\alpha\\Bigl(R + \\gamma\\sum_{a'}\\pi(a' \\mid S')Q(S', a') - Q(S, A)\\Bigr)."}</MD>
        <p>
          For an ε-greedy π the probabilities are <M>{"\\varepsilon/|A|"}</M> for each action plus 1 − ε for the greedy one (
          <C>eps_probs</C>, <C>expected_target</C>, <C>expected_sarsa_update</C>).
        </p>
        <Code>{ESARSA}</Code>
      </Definition>

      <Theorem title="expected SARSA removes one source of noise">
        <p>
          Given S, A, R and S′, the expected SARSA target equals the conditional expectation of the SARSA target over A′. So the
          two have the same expected update, and the expected SARSA target has no larger variance.
        </p>
      </Theorem>
      <Proof>
        <p>
          A′ is drawn from <M>{"\\pi(\\cdot \\mid S')"}</M>, so{" "}
          <M>{"\\mathbb{E}[R + \\gamma Q(S', A') \\mid S, A, R, S'] = R + \\gamma\\sum_{a'}\\pi(a' \\mid S')Q(S', a')"}</M>. By the law of total
          variance, replacing a random variable by its conditional expectation cannot increase the variance. Expected SARSA
          tolerates larger step sizes for this reason. It also need not use the policy that chose the actions: with π greedy it
          becomes Q-learning (l6.4.5).
        </p>
      </Proof>

      <Example title="the price of exploring">
        <p>
          In a corridor of cells 0, 1, 2 with the exit beyond cell 2, each move costs 1, and moving left from 0 stays at 0. An
          ε-greedy agent whose greedy action is right moves right with probability 1 − ε/2. The expected number of steps from cell
          0 solves <M>{"E_0 = 1 + (1 - \\varepsilon/2)E_1 + (\\varepsilon/2)E_0"}</M> and the similar equations for cells 1 and 2, and
          SARSA&apos;s values estimate minus these expectations, not the optimal −3.
        </p>
      </Example>

      <Remark title="extensions">
        <p>
          As with prediction, SARSA can use n-step targets or eligibility traces on state-action pairs (SARSA(λ)), which pass
          rewards back along a trajectory faster. Deep reinforcement learning mostly uses off-policy variants of this update,
          beginning with Q-learning (l6.4.5) and DQN (l6.5.2), because they can learn from stored experience.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "upd",
      rung: "check",
      prompt: (
        <p>
          Q(S, A) = 2, the reward is −1, Q(S′, A′) = 3, α = 0.5 and γ = 0.9. What is Q(S, A) after one SARSA update?
        </p>
      ),
      answer: { kind: "numeric", value: 1.85, tolerance: 0.0001 },
    },
    {
      key: "exp",
      rung: "check",
      prompt: (
        <p>
          In S′ the action values are 1, 3 and 2, the policy is ε-greedy with ε = 0.1, the reward is 0 and γ = 1. What is the
          expected SARSA target?
        </p>
      ),
      answer: { kind: "numeric", value: 2.9, tolerance: 0.0001 },
    },
    {
      key: "cliff",
      rung: "apply",
      prompt: <p>Why does SARSA with ε = 0.1 learn a path that keeps away from the cliff edge, although the edge path is shorter?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its targets use the actions its ε-greedy policy actually takes, so the values next to the edge include the occasional random step into the cliff",
          "Because SARSA cannot represent the shortest path",
          "Because the cliff reward is ignored by SARSA",
          "Because SARSA explores less than Q-learning",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eps_greedy_action(Q, s, eps, rng):
    acts = list(Q[s])
    if rng.random() < eps:
        return rng.choice(acts)
    return max(acts, key=lambda a: Q[s][a])

def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma):
    target = r + (gamma * Q[s2][a2] if s2 is not None else 0.0)
    Q[s][a] += alpha * (target - Q[s][a])

def run_sarsa(step, start, Q, episodes, alpha, gamma, eps, rng):
    totals = []
    for _ in range(episodes):
        s, total = start, 0.0
        a = eps_greedy_action(Q, s, eps, rng)
        while s is not None:
            s2, r = step(s, a)
            a2 = eps_greedy_action(Q, s2, eps, rng) if s2 is not None else None
            sarsa_update(Q, s, a, r, s2, a2, alpha, gamma)
            s, a, total = s2, a2, total + r
        totals.append(total)
    return totals

import random; Q = {0: {"L": 1.0, "R": 3.0}, 1: {"L": 0.0, "R": 2.0}}; print(eps_greedy_action(Q, 0, 0.0, random.Random(0)), eps_greedy_action({5: {"x": 0.0}}, 5, 1.0, random.Random(4)), eps_greedy_action(Q, 1, 0.0, random.Random(1)))
sarsa_update(Q, 0, "L", -1, 1, "R", 0.5, 1.0); sarsa_update(Q, 1, "R", 5, None, None, 0.5, 1.0); print(Q)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "R x R\n{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 0.0, 'R': 3.5}}",
          "R x R\n{0: {'L': 1.5, 'R': 3.0}, 1: {'L': 0.0, 'R': 3.5}}",
          "R x L\n{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 0.0, 'R': 3.5}}",
          "R x R\n{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 0.0, 'R': 5.0}}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eps_probs(Q, s, eps):
    acts = list(Q[s])
    best = max(acts, key=lambda a: Q[s][a])
    return {a: eps / len(acts) + (1 - eps if a == best else 0.0) for a in acts}

def expected_target(Q, r, s2, gamma, eps):
    if s2 is None:
        return r
    return r + gamma * sum(p * Q[s2][a] for a, p in eps_probs(Q, s2, eps).items())

def expected_sarsa_update(Q, s, a, r, s2, alpha, gamma, eps):
    Q[s][a] += alpha * (expected_target(Q, r, s2, gamma, eps) - Q[s][a])

Q = {0: {"a": 1.0, "b": 3.0, "c": 2.0}, 1: {"a": 0.0}}; print({k: round(v, 4) for k, v in eps_probs(Q, 0, 0.3).items()}, round(expected_target(Q, 1, 0, 0.5, 0.3), 4), expected_target(Q, 7, None, 0.5, 0.3))
expected_sarsa_update(Q, 1, "a", 0, 0, 0.5, 1.0, 0.0); print(Q[1], eps_probs(Q, 1, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 0.1, 'b': 0.8, 'c': 0.1} 2.35 7\n{'a': 1.5} {'a': 1.0}",
          "{'a': 0.1, 'b': 0.7, 'c': 0.1} 2.35 7\n{'a': 1.5} {'a': 1.0}",
          "{'a': 0.1, 'b': 0.8, 'c': 0.1} 2.5 7\n{'a': 1.5} {'a': 1.0}",
          "{'a': 0.1, 'b': 0.8, 'c': 0.1} 2.35 7\n{'a': 1.5} {'a': 0.5}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eps_greedy_action(Q, s, eps, rng)</C>, which draws <C>rng.random()</C> once and, if it is below eps, returns{" "}
          <C>rng.choice(list(Q[s]))</C>, and otherwise the first action of largest value; <C>sarsa_update(Q, s, a, r, s2, a2, alpha, gamma)</C>,
          updating Q in place, with s2 None at termination; and <C>run_sarsa(step, start, Q, episodes, alpha, gamma, eps, rng)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eps_greedy_action(Q, s, eps, rng):
    return list(Q[s])[0]

def sarsa_update(Q, s, a, r, s2, a2, alpha, gamma):
    pass

def run_sarsa(step, start, Q, episodes, alpha, gamma, eps, rng):
    return []
`,
        solution: SARSA,
        tests: [
          { name: "parts", code: `import random
Q = {0: {"L": 1.0, "R": 3.0}, 1: {"L": 0.0, "R": 2.0}}
assert eps_greedy_action(Q, 0, 0.0, random.Random(0)) == "R" and eps_greedy_action({0: {"a": 1, "b": 1}}, 0, 0.0, random.Random(0)) == "a"
r = random.Random(3); picks = [eps_greedy_action(Q, 0, 1.0, r) for _ in range(2000)]; assert 900 < picks.count("L") < 1100
sarsa_update(Q, 1, "R", 5, None, None, 0.5, 1.0); sarsa_update(Q, 0, "L", -1, 1, "R", 0.5, 0.9); assert Q[1]["R"] == 3.5 and abs(Q[0]["L"] - (1 + 0.5 * (-1 + 0.9 * 3.5 - 1))) < 1e-12` },
          { name: "run", code: `import random
def step(s, a):
    s2 = max(0, s - 1) if a == "L" else s + 1
    return (None, -1) if s2 == 3 else (s2, -1)
Q = {s: {"L": 0.0, "R": 0.0} for s in range(3)}
t = run_sarsa(step, 0, Q, 300, 0.1, 1.0, 0.1, random.Random(0)); assert len(t) == 300 and all(x <= -3 for x in t)
assert all(Q[s]["R"] > Q[s]["L"] for s in range(3)) and abs(Q[2]["R"] + 1) < 1e-6 and sum(t[-100:]) / 100 > -4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>eps_probs(Q, s, eps)</C>, the ε-greedy action probabilities with the first best action as greedy;{" "}
          <C>expected_target(Q, r, s2, gamma, eps)</C>, equal to r when s2 is None; and{" "}
          <C>expected_sarsa_update(Q, s, a, r, s2, alpha, gamma, eps)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eps_probs(Q, s, eps):
    return {}

def expected_target(Q, r, s2, gamma, eps):
    return r

def expected_sarsa_update(Q, s, a, r, s2, alpha, gamma, eps):
    pass
`,
        solution: ESARSA,
        tests: [
          { name: "probs", code: `Q = {0: {"a": 1.0, "b": 3.0, "c": 2.0}, 1: {"a": 0.0}}
p = eps_probs(Q, 0, 0.3); assert abs(p["a"] - 0.1) < 1e-12 and abs(p["b"] - 0.8) < 1e-12 and eps_probs(Q, 1, 0.5) == {"a": 1.0}
assert eps_probs({0: {"x": 2.0, "y": 2.0}}, 0, 0.0) == {"x": 1.0, "y": 0.0}` },
          { name: "target", code: `Q = {0: {"a": 1.0, "b": 3.0, "c": 2.0}, 1: {"a": 0.0}}
assert abs(expected_target(Q, 1, 0, 0.5, 0.3) - 2.35) < 1e-12 and expected_target(Q, 7, None, 0.5, 0.3) == 7 and abs(expected_target(Q, 0, 0, 1.0, 0.1) - 2.9) < 1e-12
expected_sarsa_update(Q, 1, "a", 0, 0, 0.5, 1.0, 0.0); assert Q[1] == {"a": 1.5}` },
        ],
      },
    },
    {
      key: "corridor",
      rung: "stretch",
      prompt: (
        <p>
          In the corridor example with ε = 0.2, what is the value of cell 0 under the ε-greedy policy whose greedy action is always
          right, that is, minus the expected number of steps to leave? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -3.594, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        SARSA learns about the policy it follows. Q-learning (l6.4.5) learns about the greedy policy while following an
        exploring one, by bootstrapping from the best next action rather than the one actually taken. On the cliff it finds the
        shortest path, and pays for it while exploring.
      </p>
    </>
  ),
};
