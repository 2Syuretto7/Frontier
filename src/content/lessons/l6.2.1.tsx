import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MachineMdpViz } from "@/components/viz/MachineMdpViz";
import type { LessonContent } from "@/lib/types";

const MDP = `def check_mdp(P):
    for s in P:
        for a in P[s]:
            if abs(sum(p for p, _, _ in P[s][a]) - 1) > 1e-9:
                return False
            if any(s2 not in P for _, s2, _ in P[s][a]):
                return False
    return True

def step(P, s, a, rng):
    u, acc = rng.random(), 0.0
    for p, s2, r in P[s][a]:
        acc += p
        if u < acc:
            return s2, r
    return P[s][a][-1][1], P[s][a][-1][2]

def rollout(P, policy, s, H, rng):
    path = []
    for _ in range(H):
        a = policy[s]
        s2, r = step(P, s, a, rng)
        path.append((s, a, r))
        s = s2
    return path`;

const CHAIN = `def expected_reward(P, s, a):
    return sum(p * r for p, _, r in P[s][a])

def transition_matrix(P, policy):
    n = len(P)
    M = [[0.0] * n for _ in range(n)]
    for s in range(n):
        for p, s2, _ in P[s][policy[s]]:
            M[s][s2] += p
    return M

def state_dist(P, policy, d, n):
    M = transition_matrix(P, policy)
    for _ in range(n):
        d = [sum(d[i] * M[i][j] for i in range(len(d))) for j in range(len(d))]
    return d`;

export const lesson: LessonContent = {
  id: "l6.2.1",
  minutes: 50,
  links: {
    requires: ["l6.1.1", "m3.7.3"],
    revisits: ["m7.6.1"],
    foreshadows: ["l6.2.2", "l6.2.3", "l6.3.1"],
  },

  puzzle: (
    <>
      <p>
        A factory machine earns money while it runs, but running it wears it out, and a broken machine earns nothing until an
        expensive repair. Repairing early costs a little now; waiting earns a little more now but risks a large bill later. No
        single choice can be judged by its immediate reward, because each choice changes the situation in which the next one
        is made. What is the right way to describe such a problem precisely enough to solve it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Add states to a bandit. At each step the agent sees the current state, picks an action, receives a reward and moves to a
        new state at random, with probabilities that depend only on the current state and action. Everything the agent needs
        to know about the past is summarised by the present state. Once a policy, a rule for choosing actions, is fixed, the
        states form a Markov chain, and the long-run reward is a property of that chain.
      </p>
      <MachineMdpViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Markov decision process">
        <p>
          A finite <em>Markov decision process</em> (MDP) has a finite set of states S, a finite set of actions A(s) in each state,
          and for each state s and action a a distribution over pairs (s′, r) of next state and reward, written{" "}
          <M>{"p(s', r \\mid s, a)"}</M>. Starting from <M>{"S_0"}</M>, at each step t the agent chooses <M>{"A_t"}</M>, and the
          environment draws <M>{"(S_{t+1}, R_{t+1})"}</M> from <M>{"p(\\cdot \\mid S_t, A_t)"}</M>. The <em>Markov property</em> is that
          this distribution depends on the history only through <M>{"(S_t, A_t)"}</M>. The sequence{" "}
          <M>{"S_0, A_0, R_1, S_1, A_1, R_2, \\dots"}</M> is a <em>trajectory</em>.
        </p>
      </Definition>

      <Example title="the machine as code">
        <p>
          Store the MDP as a dictionary: <C>P[s][a]</C> is a list of triples (probability, next state, reward). The machine of the
          picture, with states 0 good, 1 worn, 2 broken and actions 0 run, 1 repair, is
        </p>
        <Code>{`P = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]},
     1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]},
     2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}`}</Code>
        <p>
          <C>check_mdp</C> verifies that every list is a probability distribution over known states; <C>step</C> samples one
          transition by inverting the cumulative probabilities with a uniform draw; <C>rollout</C> follows a deterministic
          policy, a dictionary from states to actions, for H steps.
        </p>
        <Code>{MDP}</Code>
      </Example>

      <Definition title="policies">
        <p>
          A <em>deterministic stationary policy</em> π chooses the action π(s) in state s, whatever the time and the history. More
          general policies can randomise and depend on the history; for finite MDPs nothing is lost by the stationary
          deterministic ones when the goal is the long-run or discounted reward (l6.2.4), and randomised policies return with
          policy gradients.
        </p>
      </Definition>

      <Theorem title="a policy turns an MDP into a Markov chain">
        <p>
          Under a deterministic stationary policy π, the states <M>{"S_0, S_1, \\dots"}</M> form a Markov chain with transition
          matrix <M>{"P_\\pi(s, s') = \\sum_r p(s', r \\mid s, \\pi(s))"}</M>, and the expected reward of a step from s is{" "}
          <M>{"r_\\pi(s) = \\sum_{s', r} r\\,p(s', r \\mid s, \\pi(s))"}</M>. If <M>{"S_0"}</M> has distribution <M>{"d_0"}</M> (a row
          vector), then <M>{"S_n"}</M> has distribution <M>{"d_0P_\\pi^n"}</M> and <M>{"\\mathbb{E}R_{n+1} = d_0P_\\pi^n r_\\pi"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Given <M>{"S_t = s"}</M>, the action is π(s), so the next state has distribution <M>{"P_\\pi(s, \\cdot)"}</M> regardless of the
          earlier history: that is the Markov chain property (m3.7.3). The distribution of <M>{"S_n"}</M> follows by induction,{" "}
          <M>{"P(S_{n+1} = s') = \\sum_s P(S_n = s)P_\\pi(s, s')"}</M>. For the reward, condition on <M>{"S_n"}</M> (m7.6.1):{" "}
          <M>{"\\mathbb{E}R_{n+1} = \\sum_s P(S_n = s)\\,r_\\pi(s)"}</M>. <C>expected_reward</C>, <C>transition_matrix</C> and{" "}
          <C>state_dist</C> compute these.
        </p>
        <Code>{CHAIN}</Code>
      </Proof>

      <Theorem title="long-run average reward">
        <p>
          If <M>{"P_\\pi"}</M> has a unique stationary distribution μ, reached from <M>{"d_0"}</M> as{" "}
          <M>{"d_0P_\\pi^n \\to \\mu"}</M>, then the expected reward per step tends to <M>{"\\sum_s\\mu(s)r_\\pi(s)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}R_{n+1} = d_0P_\\pi^nr_\\pi \\to \\mu r_\\pi"}</M>, and averages of a convergent sequence converge to the same
          limit.
        </p>
      </Proof>

      <Example title="two policies for the machine">
        <p>
          Run in the good and worn states and repair when broken: <M>{"\\mu = (10, 5, 2)/17"}</M>, from{" "}
          <M>{"\\mu_1 = 0.2\\mu_0 + 0.6\\mu_1"}</M> and <M>{"\\mu_2 = 0.4\\mu_1"}</M>, and the average reward is{" "}
          <M>{"(10 \\cdot 1 + 5 \\cdot 0.6 - 2 \\cdot 3)/17"}</M>. Repair as soon as the machine is worn: the chain alternates between
          good and worn with <M>{"\\mu = (5/6, 1/6, 0)"}</M>, and the average is <M>{"5/6 - 1/6"}</M>. Running the machine to failure
          loses nearly two fifths of the reward that preventive repair earns.
        </p>
      </Example>

      <Remark title="what goes into the state">
        <p>
          The Markov property is a modelling choice: the state must contain everything about the past that matters for the
          future. If the machine&apos;s wear depended on how long it had been worn, &ldquo;worn&rdquo; alone would not be a state, and
          the time spent worn would have to be added. Game-playing agents stack the last few screen frames so that the state
          includes velocities. When the agent cannot see the full state, the problem is partially observable, and the agent must
          act on its belief about the state. Rewards, for their part, are the only way the designer says what is wanted;
          whether they say it well is a recurring difficulty.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: (
        <p>
          The machine starts good and follows the policy run, run, repair (in good, worn and broken). What is the probability that
          it is broken after two steps?
        </p>
      ),
      answer: { kind: "numeric", value: 0.08, tolerance: 0.0001 },
    },
    {
      key: "avg",
      rung: "check",
      prompt: <p>What is the long-run average reward per step of the policy run, run, repair? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4118, tolerance: 0.00006 },
    },
    {
      key: "markov",
      rung: "apply",
      prompt: (
        <p>
          A robot&apos;s state is its position only, but its next position depends on its velocity, which is not part of the state.
          What goes wrong?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The process is not Markov in that state: the next position depends on the past positions as well, so the state should include the velocity",
          "Nothing, because positions are continuous",
          "The rewards become random",
          "The number of actions must then be infinite",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def check_mdp(P):
    for s in P:
        for a in P[s]:
            if abs(sum(p for p, _, _ in P[s][a]) - 1) > 1e-9:
                return False
            if any(s2 not in P for _, s2, _ in P[s][a]):
                return False
    return True

def step(P, s, a, rng):
    u, acc = rng.random(), 0.0
    for p, s2, r in P[s][a]:
        acc += p
        if u < acc:
            return s2, r
    return P[s][a][-1][1], P[s][a][-1][2]

def rollout(P, policy, s, H, rng):
    path = []
    for _ in range(H):
        a = policy[s]
        s2, r = step(P, s, a, rng)
        path.append((s, a, r))
        s = s2
    return path

import random; P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)]}}; print(check_mdp(P), check_mdp({0: {0: [(0.5, 0, 1)]}}), check_mdp({0: {0: [(1.0, 3, 0)]}}))
print(step(P, 0, 0, random.Random(0)), rollout(P, {0: 0, 1: 0}, 1, 3, random.Random(1)))  # Random(0) first draws 0.844; Random(1) draws 0.134, 0.847, 0.764`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False False\n(1, 0) [(1, 0, 2), (0, 0, 0), (1, 0, 2)]",
          "True False False\n(0, 1) [(1, 0, 2), (0, 0, 0), (1, 0, 2)]",
          "True False True\n(1, 0) [(1, 0, 2), (0, 0, 0), (1, 0, 2)]",
          "True False False\n(1, 0) [(1, 0, 2), (0, 0, 1), (0, 0, 1)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_reward(P, s, a):
    return sum(p * r for p, _, r in P[s][a])

def transition_matrix(P, policy):
    n = len(P)
    M = [[0.0] * n for _ in range(n)]
    for s in range(n):
        for p, s2, _ in P[s][policy[s]]:
            M[s][s2] += p
    return M

def state_dist(P, policy, d, n):
    M = transition_matrix(P, policy)
    for _ in range(n):
        d = [sum(d[i] * M[i][j] for i in range(len(d))) for j in range(len(d))]
    return d

P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)], 1: [(0.25, 1, 4), (0.75, 0, 0)]}}; print(expected_reward(P, 0, 0), expected_reward(P, 1, 1), transition_matrix(P, {0: 0, 1: 1}))
print(state_dist(P, {0: 0, 1: 0}, [1, 0], 2), state_dist(P, {0: 0, 1: 1}, [0, 1], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 1.0 [[0.5, 0.5], [0.75, 0.25]]\n[0.75, 0.25] [0.75, 0.25]",
          "0.5 4.0 [[0.5, 0.5], [0.75, 0.25]]\n[0.75, 0.25] [0.75, 0.25]",
          "0.5 1.0 [[0.5, 0.5], [0.25, 0.75]]\n[0.75, 0.25] [0.75, 0.25]",
          "0.5 1.0 [[0.5, 0.5], [0.75, 0.25]]\n[0.5, 0.5] [0.75, 0.25]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>check_mdp(P)</C>, which returns True when every <C>P[s][a]</C> has probabilities summing to 1 (within 1e-9) and
          only next states that are keys of P; <C>step(P, s, a, rng)</C>, which draws <C>u = rng.random()</C> once and returns the
          (next state, reward) of the first triple whose cumulative probability exceeds u; and{" "}
          <C>rollout(P, policy, s, H, rng)</C>, the list of H triples (state, action, reward).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def check_mdp(P):
    return False

def step(P, s, a, rng):
    return (s, 0)

def rollout(P, policy, s, H, rng):
    return []
`,
        solution: MDP,
        tests: [
          { name: "check", code: `P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)], 1: [(0.25, 1, 4), (0.75, 0, 0)]}}
assert check_mdp(P) and not check_mdp({0: {0: [(0.5, 0, 1)]}}) and not check_mdp({0: {0: [(1.0, 3, 0)]}}) and check_mdp({0: {0: [(0.1, 0, 0)] * 10}})
import random
assert step(P, 1, 1, random.Random(0)) == (0, 0) and step(P, 1, 1, random.Random(1)) == (1, 4) and step(P, 1, 0, random.Random(0)) == (0, 2)` },
          { name: "rollout", code: `import random
P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)], 1: [(0.25, 1, 4), (0.75, 0, 0)]}}
assert rollout(P, {0: 0, 1: 1}, 0, 4, random.Random(2)) == [(0, 0, 0), (1, 1, 0), (0, 0, 1), (0, 0, 1)]
assert rollout(P, {0: 0, 1: 0}, 1, 0, random.Random(0)) == [] and len(rollout(P, {0: 0, 1: 0}, 0, 50, random.Random(3))) == 50` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With states 0, …, n − 1, write <C>expected_reward(P, s, a)</C>; <C>transition_matrix(P, policy)</C>, the n × n matrix{" "}
          <M>{"P_\\pi"}</M> as a list of rows, adding the probabilities of triples with the same next state; and{" "}
          <C>state_dist(P, policy, d, n)</C>, the distribution after n steps from the list d.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_reward(P, s, a):
    return 0.0

def transition_matrix(P, policy):
    return []

def state_dist(P, policy, d, n):
    return d
`,
        solution: CHAIN,
        tests: [
          { name: "reward", code: `P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)], 1: [(0.25, 1, 4), (0.75, 0, 0)]}}
assert expected_reward(P, 0, 0) == 0.5 and expected_reward(P, 1, 1) == 1 and expected_reward(P, 1, 0) == 2
assert transition_matrix({0: {0: [(0.5, 1, 0), (0.5, 1, 3)]}, 1: {0: [(1.0, 0, 0)]}}, {0: 0, 1: 0}) == [[0.0, 1.0], [1.0, 0.0]]` },
          { name: "dist", code: `P = {0: {0: [(0.5, 0, 1), (0.5, 1, 0)]}, 1: {0: [(1.0, 0, 2)], 1: [(0.25, 1, 4), (0.75, 0, 0)]}}
assert state_dist(P, {0: 0, 1: 1}, [1, 0], 3) == [0.59375, 0.40625] and state_dist(P, {0: 0, 1: 1}, [0.3, 0.7], 0) == [0.3, 0.7]
d = state_dist(P, {0: 0, 1: 1}, [1, 0], 200); assert abs(d[0] - 0.6) < 1e-12` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          Suppose repairing a worn machine cost c instead of 1, all else unchanged. What is the largest c for which repairing when
          worn earns at least as much per step in the long run as the policy run, run, repair? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.5294, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The long-run average is one way to score a policy. More common is to add up the rewards with a discount, so that
        reward now counts more than reward later. The next lesson (l6.2.2) defines this return and shows why discounting makes
        the sums finite and the mathematics clean.
      </p>
    </>
  ),
};
