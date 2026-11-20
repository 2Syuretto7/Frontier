import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { QLearningCliffViz } from "@/components/viz/QLearningCliffViz";
import type { LessonContent } from "@/lib/types";

const QL = `def behave(Q, s, eps, rng):
    acts = list(Q[s])
    if rng.random() < eps:
        return rng.choice(acts)
    return max(acts, key=lambda a: Q[s][a])

def q_update(Q, s, a, r, s2, alpha, gamma):
    target = r + (gamma * max(Q[s2].values()) if s2 is not None else 0.0)
    Q[s][a] += alpha * (target - Q[s][a])

def run_q(step, start, Q, episodes, alpha, gamma, eps, rng):
    totals = []
    for _ in range(episodes):
        s, total = start, 0.0
        while s is not None:
            a = behave(Q, s, eps, rng)
            s2, r = step(s, a)
            q_update(Q, s, a, r, s2, alpha, gamma)
            s, total = s2, total + r
        totals.append(total)
    return totals`;

const DOUBLE = `def max_bias(k, n, trials, rng):
    total = 0.0
    for _ in range(trials):
        total += max(sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k))
    return total / trials

def double_estimate(k, n, trials, rng):
    total = 0.0
    for _ in range(trials):
        A = [sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k)]
        B = [sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k)]
        total += B[max(range(k), key=lambda i: A[i])]
    return total / trials

def double_q_update(QA, QB, s, a, r, s2, alpha, gamma, coin):
    if coin:
        QA, QB = QB, QA
    if s2 is None:
        target = r
    else:
        best = max(QA[s2], key=lambda b: QA[s2][b])
        target = r + gamma * QB[s2][best]
    QA[s][a] += alpha * (target - QA[s][a])`;

export const lesson: LessonContent = {
  id: "l6.4.5",
  minutes: 60,
  links: {
    requires: ["l6.4.4", "l6.2.4"],
    revisits: ["l6.3.3", "l6.4.1"],
    foreshadows: ["l6.5.2", "l6.5.3"],
  },

  puzzle: (
    <>
      <p>
        SARSA learns about the exploring policy it follows, so it never learns the optimal values while it keeps exploring. Yet
        one would like an agent to explore freely, or to learn from someone else&apos;s experience, or from old data, and still
        learn what the best policy would earn. Can the learning target be made independent of how the actions were chosen?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Bootstrap from the best next action instead of the next action taken: move Q(S, A) towards R + γ maxₐ Q(S′, a). That target
        estimates the optimality equation for q, whatever the behaviour policy, so any policy that keeps trying every action
        will do for collecting data. The catch is the maximum itself: a maximum of noisy estimates is biased upwards, and the
        bias is fed back into later targets.
      </p>
      <QLearningCliffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Q-learning">
        <p>
          (Watkins, 1989.) After taking A in S and observing R and S′, under any behaviour policy, update
        </p>
        <MD>{"Q(S, A) \\leftarrow Q(S, A) + \\alpha\\bigl(R + \\gamma\\max_aQ(S', a) - Q(S, A)\\bigr),"}</MD>
        <p>
          with target R when S′ is terminal (<C>q_update</C>). <C>run_q</C> behaves ε-greedily (<C>behave</C>) and returns the total
          reward of each episode.
        </p>
        <Code>{QL}</Code>
      </Definition>

      <Theorem title="Q-learning converges to the optimal action values">
        <p>
          (Watkins and Dayan, 1992.) For a finite MDP with bounded rewards and tabular Q, if every state-action pair is updated
          infinitely often and the step sizes for each pair satisfy <M>{"\\sum\\alpha = \\infty"}</M> and{" "}
          <M>{"\\sum\\alpha^2 < \\infty"}</M>, then Q converges to <M>{"q_*"}</M> with probability 1, whatever the behaviour policy.
        </p>
      </Theorem>
      <Proof>
        <p>
          A sketch. Given S = s and A = a, the expected target is{" "}
          <M>{"\\sum_{s', r}p(s', r \\mid s, a)(r + \\gamma\\max_{a'}Q(s', a')) = (T^*Q)(s, a)"}</M>, the optimality operator on q (l6.2.4),
          and the behaviour policy does not appear because a is given. So each update moves Q(s, a) a step towards{" "}
          <M>{"T^*Q"}</M> plus zero-mean noise: an asynchronous, sampled form of Q-value iteration (l6.3.3). Since{" "}
          <M>{"T^*"}</M> is a γ-contraction in the sup norm, stochastic approximation theory gives convergence to its fixed point{" "}
          <M>{"q_*"}</M>.
        </p>
      </Proof>

      <Remark title="learning the optimum, earning less">
        <p>
          In the picture Q-learning finds the shortest path along the cliff edge, which is optimal for a policy that does not
          explore. It keeps exploring, so it falls in now and then, and its return while learning is worse than SARSA&apos;s. Being
          off-policy separates what is learnt from what is done: good when the data can be reused, as in the replay buffers of
          DQN (l6.5.2), but it is also one ingredient of the instability studied in l6.5.3.
        </p>
      </Remark>

      <Theorem title="maximisation bias">
        <p>
          If <M>{"\\hat X_1, \\dots, \\hat X_k"}</M> are unbiased estimates of <M>{"\\mu_1, \\dots, \\mu_k"}</M>, then{" "}
          <M>{"\\mathbb{E}\\max_i\\hat X_i \\ge \\max_i\\mu_i"}</M>. For two independent standard normal estimates of means 0, the
          expected maximum is <M>{"1/\\sqrt\\pi \\approx 0.564"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For each j, <M>{"\\max_i\\hat X_i \\ge \\hat X_j"}</M>, so <M>{"\\mathbb{E}\\max_i\\hat X_i \\ge \\mu_j"}</M>; take the largest j. For
          two variables, <M>{"\\max(X, Y) = \\frac{X + Y}2 + \\frac{|X - Y|}2"}</M>. With X, Y independent N(0, 1), X − Y is N(0, 2) and{" "}
          <M>{"\\mathbb{E}|X - Y| = \\sqrt2\\sqrt{2/\\pi}"}</M>, so the expected maximum is <M>{"1/\\sqrt\\pi"}</M>. <C>max_bias</C> estimates
          the bias by simulation when every true value is 0 and each estimate is a mean of n noisy samples.
        </p>
      </Proof>

      <Definition title="double Q-learning">
        <p>
          (van Hasselt, 2010.) The bias comes from using the same noisy estimates both to pick the best action and to value it.
          Keep two tables. With probability 1/2 update the first, choosing <M>{"a^* = \\arg\\max_aQ_A(S', a)"}</M> but valuing it with
          the second: target <M>{"R + \\gamma Q_B(S', a^*)"}</M>; otherwise swap their roles (<C>double_q_update</C>, where{" "}
          <C>coin</C> selects the table).
        </p>
        <Code>{DOUBLE}</Code>
      </Definition>

      <Theorem title="the double estimator">
        <p>
          If A and B are independent unbiased estimates of μ and <M>{"i^* = \\arg\\max_iA_i"}</M>, then{" "}
          <M>{"\\mathbb{E}B_{i^*} = \\sum_iP(i^* = i)\\mu_i \\le \\max_i\\mu_i"}</M>, with equality when all <M>{"\\mu_i"}</M> are equal.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on <M>{"i^*"}</M>, which depends only on A: <M>{"\\mathbb{E}[B_{i^*} \\mid i^* = i] = \\mathbb{E}B_i = \\mu_i"}</M> by
          independence. Average over i. The double estimator may underestimate, but it does not systematically inflate values
          the way the single maximum does (<C>double_estimate</C>).
        </p>
      </Proof>

      <Example title="why it matters">
        <p>
          Suppose a state has many actions, all worth 0, whose rewards are noisy. Q-learning&apos;s target from that state is the
          maximum of noisy estimates, positive on average, so the state looks attractive and the agent keeps visiting it. With
          deep networks the effect compounds through bootstrapping, and double DQN (l6.5.2) applies the same idea with an online
          and a target network.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "upd",
      rung: "check",
      prompt: (
        <p>
          Q(S, A) = 2, the reward is −1, the action values in S′ are 3 and 4, α = 0.5 and γ = 0.9. What is Q(S, A) after one
          Q-learning update?
        </p>
      ),
      answer: { kind: "numeric", value: 2.3, tolerance: 0.0001 },
    },
    {
      key: "bias",
      rung: "check",
      prompt: <p>What is the expected maximum of two independent standard normal variables? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5642, tolerance: 0.00006 },
    },
    {
      key: "off",
      rung: "apply",
      prompt: <p>Why does the behaviour policy not affect what Q-learning converges to, as long as it tries every action?</p>,
      answer: {
        kind: "choice",
        options: [
          "Given the state and action, the expected Q-learning target is the optimality operator applied to Q, which does not involve the behaviour policy",
          "Because Q-learning only updates when the greedy action is taken",
          "Because the behaviour policy is always greedy in Q-learning",
          "Because importance sampling ratios correct every update",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def behave(Q, s, eps, rng):
    acts = list(Q[s])
    if rng.random() < eps:
        return rng.choice(acts)
    return max(acts, key=lambda a: Q[s][a])

def q_update(Q, s, a, r, s2, alpha, gamma):
    target = r + (gamma * max(Q[s2].values()) if s2 is not None else 0.0)
    Q[s][a] += alpha * (target - Q[s][a])

def run_q(step, start, Q, episodes, alpha, gamma, eps, rng):
    totals = []
    for _ in range(episodes):
        s, total = start, 0.0
        while s is not None:
            a = behave(Q, s, eps, rng)
            s2, r = step(s, a)
            q_update(Q, s, a, r, s2, alpha, gamma)
            s, total = s2, total + r
        totals.append(total)
    return totals

import random; Q = {0: {"L": 1.0, "R": 3.0}, 1: {"L": 4.0, "R": 2.0}}; q_update(Q, 0, "L", -1, 1, 0.5, 0.5); q_update(Q, 1, "R", 6, None, 0.5, 0.5); print(Q, behave(Q, 1, 0.0, random.Random(0)))
step = lambda s, a: (None, 1) if a == "R" else (s, -1); Q = {0: {"L": 0.0, "R": 0.0}}; print(run_q(step, 0, Q, 2, 1.0, 1.0, 0.0, random.Random(0)), Q)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 4.0, 'R': 4.0}} L\n[0.0, 1.0] {0: {'L': -1.0, 'R': 1.0}}",
          "{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 4.0, 'R': 4.0}} R\n[0.0, 1.0] {0: {'L': -1.0, 'R': 1.0}}",
          "{0: {'L': 1.5, 'R': 3.0}, 1: {'L': 4.0, 'R': 4.0}} L\n[0.0, 1.0] {0: {'L': -1.0, 'R': 1.0}}",
          "{0: {'L': 1.0, 'R': 3.0}, 1: {'L': 4.0, 'R': 4.0}} L\n[1.0, 1.0] {0: {'L': 0.0, 'R': 1.0}}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def max_bias(k, n, trials, rng):
    total = 0.0
    for _ in range(trials):
        total += max(sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k))
    return total / trials

def double_estimate(k, n, trials, rng):
    total = 0.0
    for _ in range(trials):
        A = [sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k)]
        B = [sum(rng.gauss(0, 1) for _ in range(n)) / n for _ in range(k)]
        total += B[max(range(k), key=lambda i: A[i])]
    return total / trials

def double_q_update(QA, QB, s, a, r, s2, alpha, gamma, coin):
    if coin:
        QA, QB = QB, QA
    if s2 is None:
        target = r
    else:
        best = max(QA[s2], key=lambda b: QA[s2][b])
        target = r + gamma * QB[s2][best]
    QA[s][a] += alpha * (target - QA[s][a])

QA, QB = {0: {"a": 0.0}, 1: {"x": 5.0, "y": 1.0}}, {0: {"a": 0.0}, 1: {"x": 2.0, "y": 9.0}}; double_q_update(QA, QB, 0, "a", 1, 1, 1.0, 1.0, False); print(QA[0], QB[0])
double_q_update(QA, QB, 0, "a", 1, 1, 1.0, 1.0, True); double_q_update(QA, QB, 1, "y", 0, None, 0.5, 1.0, False); print(QA[0], QB[0], QA[1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'a': 3.0} {'a': 0.0}\n{'a': 3.0} {'a': 2.0} {'x': 5.0, 'y': 0.5}",
          "{'a': 6.0} {'a': 0.0}\n{'a': 6.0} {'a': 2.0} {'x': 5.0, 'y': 0.5}",
          "{'a': 3.0} {'a': 0.0}\n{'a': 3.0} {'a': 10.0} {'x': 5.0, 'y': 0.5}",
          "{'a': 3.0} {'a': 0.0}\n{'a': 2.0} {'a': 0.0} {'x': 5.0, 'y': 0.5}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>behave(Q, s, eps, rng)</C>, ε-greedy as in l6.4.4; <C>q_update(Q, s, a, r, s2, alpha, gamma)</C>; and{" "}
          <C>run_q(step, start, Q, episodes, alpha, gamma, eps, rng)</C>, which in each step chooses an action with <C>behave</C>,
          steps, updates, and returns the list of episode totals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def behave(Q, s, eps, rng):
    return list(Q[s])[0]

def q_update(Q, s, a, r, s2, alpha, gamma):
    pass

def run_q(step, start, Q, episodes, alpha, gamma, eps, rng):
    return []
`,
        solution: QL,
        tests: [
          { name: "update", code: `import random
Q = {0: {"L": 1.0, "R": 3.0}, 1: {"L": 4.0, "R": 2.0}}; q_update(Q, 0, "L", -1, 1, 0.5, 0.5); q_update(Q, 1, "R", 6, None, 0.5, 0.5)
assert Q == {0: {"L": 1.0, "R": 3.0}, 1: {"L": 4.0, "R": 4.0}} and behave(Q, 1, 0.0, random.Random(0)) == "L"
Q = {0: {"a": 2.0}, 1: {"x": 3.0, "y": 4.0}}; q_update(Q, 0, "a", -1, 1, 0.5, 0.9); assert abs(Q[0]["a"] - 2.3) < 1e-12` },
          { name: "offpolicy", code: `import random
def step(s, a):
    s2 = max(0, s - 1) if a == "L" else s + 1
    return (None, -1) if s2 == 3 else (s2, -1)
Q = {s: {"L": 0.0, "R": 0.0} for s in range(3)}
t = run_q(step, 0, Q, 3000, 0.1, 1.0, 0.5, random.Random(0)); assert len(t) == 3000
assert all(abs(Q[s]["R"] + 3 - s) < 0.05 for s in range(3)) and abs(Q[0]["L"] + 4) < 0.05` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>max_bias(k, n, trials, rng)</C>, the average over trials of the largest of k estimates, each a mean of n draws{" "}
          <C>rng.gauss(0, 1)</C>; <C>double_estimate(k, n, trials, rng)</C>, which in each trial draws estimates A then B the same way and
          averages B at the argmax of A; and <C>double_q_update(QA, QB, s, a, r, s2, alpha, gamma, coin)</C>, which updates QB, with roles
          swapped, when coin is true.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def max_bias(k, n, trials, rng):
    return 0.0

def double_estimate(k, n, trials, rng):
    return 0.0

def double_q_update(QA, QB, s, a, r, s2, alpha, gamma, coin):
    pass
`,
        solution: DOUBLE,
        tests: [
          { name: "bias", code: `import random, math
assert abs(max_bias(2, 1, 40000, random.Random(0)) - 1 / math.sqrt(math.pi)) < 0.02 and abs(double_estimate(2, 1, 40000, random.Random(1))) < 0.02
assert abs(max_bias(1, 4, 20000, random.Random(3))) < 0.02 and max_bias(10, 1, 2000, random.Random(4)) > 1.4` },
          { name: "double", code: `QA, QB = {0: {"a": 0.0}, 1: {"x": 5.0, "y": 1.0}}, {0: {"a": 0.0}, 1: {"x": 2.0, "y": 9.0}}
double_q_update(QA, QB, 0, "a", 1, 1, 1.0, 1.0, False); assert QA[0] == {"a": 3.0} and QB[0] == {"a": 0.0}
double_q_update(QA, QB, 0, "a", 1, 1, 0.5, 1.0, True); assert QB[0] == {"a": 1.0} and QA[0] == {"a": 3.0}
double_q_update(QA, QB, 1, "y", 0, None, 0.5, 1.0, False); assert QA[1] == {"x": 5.0, "y": 0.5}` },
        ],
      },
    },
    {
      key: "five",
      rung: "stretch",
      prompt: (
        <p>
          A state has five actions, all truly worth 0. Each action value is estimated by the mean of four independent N(0, 1)
          rewards. What is the expected value of the largest estimate? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.5815, tolerance: 0.0002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every method so far keeps a separate number for each state or state-action pair. That is hopeless for problems whose
        states are images or positions on a board. The next part (l6.5.1) represents values by parametrised functions that
        generalise across states, which brings new power and, combined with bootstrapping and off-policy learning, new dangers.
      </p>
    </>
  ),
};
