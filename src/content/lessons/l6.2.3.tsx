import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MachineValuesViz } from "@/components/viz/MachineValuesViz";
import type { LessonContent } from "@/lib/types";

const VPI = `def policy_matrix(P, pi):
    n = len(P)
    M, r = [[0.0] * n for _ in range(n)], [0.0] * n
    for s in range(n):
        for a, w in pi[s].items():
            for p, s2, rew in P[s][a]:
                M[s][s2] += w * p
                r[s] += w * p * rew
    return M, r

def solve(A, b):
    n = len(b)
    T = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        piv = max(range(c, n), key=lambda i: abs(T[i][c]))
        T[c], T[piv] = T[piv], T[c]
        for i in range(c + 1, n):
            f = T[i][c] / T[c][c]
            T[i] = [x - f * y for x, y in zip(T[i], T[c])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (T[i][n] - sum(T[i][j] * x[j] for j in range(i + 1, n))) / T[i][i]
    return x

def v_pi(P, pi, gamma):
    M, r = policy_matrix(P, pi)
    n = len(r)
    A = [[(i == j) - gamma * M[i][j] for j in range(n)] for i in range(n)]
    return solve(A, r)`;

const QV = `def q_from_v(P, V, gamma):
    return {s: {a: sum(p * (r + gamma * V[s2]) for p, s2, r in P[s][a]) for a in P[s]} for s in P}

def v_from_q(Q, pi):
    return [sum(w * Q[s][a] for a, w in pi[s].items()) for s in range(len(pi))]

def mc_value(P, pi, s0, gamma, H, n, rng):
    total = 0.0
    for _ in range(n):
        s, g, disc = s0, 0.0, 1.0
        for _ in range(H):
            acts = list(pi[s])
            a = rng.choices(acts, weights=[pi[s][b] for b in acts])[0]
            u, acc = rng.random(), 0.0
            for p, s2, r in P[s][a]:
                acc += p
                if u < acc:
                    break
            g += disc * r
            disc *= gamma
            s = s2
        total += g
    return total / n`;

export const lesson: LessonContent = {
  id: "l6.2.3",
  minutes: 55,
  links: {
    requires: ["l6.2.2", "m7.6.1"],
    revisits: ["l6.2.1"],
    foreshadows: ["l6.2.4", "l6.3.1", "l6.4.1", "l6.6.3"],
  },

  puzzle: (
    <>
      <p>
        Should a worn machine be repaired now? The answer depends on what happens afterwards, which depends on what the operator
        will do in every later state. So the worth of an action cannot be judged alone: it is always relative to a plan for the
        future. What exactly is the worth of being in a state, or of taking an action there, and how do these quantities
        relate?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fix a policy. The value of a state is the expected return from it if you follow the policy; the value of an action in a
        state is the expected return if you take that action once and then follow the policy. A state&apos;s value is the
        policy&apos;s average of its action values, and an action&apos;s value is its immediate reward plus the discounted value of
        where it leads. These two relations tie all the values together, and for a finite MDP they form a linear system.
      </p>
      <MachineValuesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stochastic policy">
        <p>
          A <em>stochastic stationary policy</em> gives, in each state s, a distribution <M>{"\\pi(a \\mid s)"}</M> over actions. In code,{" "}
          <C>pi[s]</C> is a dictionary from actions to probabilities. A deterministic policy puts probability 1 on one action.
        </p>
      </Definition>

      <Definition title="value functions">
        <p>The <em>state-value function</em> and <em>action-value function</em> of π are</p>
        <MD>{"v_\\pi(s) = \\mathbb{E}_\\pi[G_t \\mid S_t = s], \\qquad q_\\pi(s, a) = \\mathbb{E}_\\pi[G_t \\mid S_t = s, A_t = a],"}</MD>
        <p>
          where the subscript means actions after the conditioning are drawn from π. By the Markov property they do not depend on
          t.
        </p>
      </Definition>

      <Theorem title="relations between v and q">
        <MD>{"v_\\pi(s) = \\sum_a\\pi(a \\mid s)\\,q_\\pi(s, a), \\qquad q_\\pi(s, a) = \\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v_\\pi(s')\\bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first is the law of total expectation (m7.6.1) over <M>{"A_t"}</M>, which has distribution{" "}
          <M>{"\\pi(\\cdot \\mid s)"}</M>. For the second, write <M>{"G_t = R_{t+1} + \\gamma G_{t+1}"}</M> and condition on{" "}
          <M>{"(S_{t+1}, R_{t+1}) = (s', r)"}</M>: by the Markov property, the expected value of <M>{"G_{t+1}"}</M> given everything up to
          time t + 1 is <M>{"v_\\pi(s')"}</M>. <C>q_from_v</C> and <C>v_from_q</C> apply the two relations.
        </p>
        <Code>{QV}</Code>
      </Proof>

      <Theorem title="evaluating a policy exactly">
        <p>
          Let <M>{"P_\\pi(s, s') = \\sum_a\\pi(a \\mid s)\\sum_r p(s', r \\mid s, a)"}</M> and{" "}
          <M>{"r_\\pi(s) = \\sum_a\\pi(a \\mid s)\\sum_{s', r}r\\,p(s', r \\mid s, a)"}</M>. Then <M>{"v_\\pi"}</M> is the unique solution of{" "}
          <M>{"(I - \\gamma P_\\pi)v = r_\\pi"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substituting the second relation into the first gives <M>{"v_\\pi = r_\\pi + \\gamma P_\\pi v_\\pi"}</M>. Under π the states form a
          Markov chain with matrix <M>{"P_\\pi"}</M> (l6.2.1, with the action probabilities mixed in), so l6.2.2 shows that{" "}
          <M>{"I - \\gamma P_\\pi"}</M> is invertible. <C>policy_matrix</C> builds <M>{"P_\\pi"}</M> and <M>{"r_\\pi"}</M>, <C>solve</C> is
          Gaussian elimination with partial pivoting, and <C>v_pi</C> combines them. The cost is cubic in the number of states,
          which is why later lessons evaluate policies iteratively (l6.3.1) or from samples (l6.4.1).
        </p>
        <Code>{VPI}</Code>
      </Proof>

      <Definition title="advantage">
        <p>
          The <em>advantage</em> of action a in state s is <M>{"A_\\pi(s, a) = q_\\pi(s, a) - v_\\pi(s)"}</M>: how much better it is to take a
          once than to follow π. Its average under π is zero, <M>{"\\sum_a\\pi(a \\mid s)A_\\pi(s, a) = 0"}</M>, by the first relation. A
          positive advantage says that deviating towards a, just here and just once, pays; advantages drive policy improvement
          (l6.3.2) and policy gradients (l6.6.3).
        </p>
      </Definition>

      <Definition title="comparing policies">
        <p>
          Policy π is at least as good as π′ if <M>{"v_\\pi(s) \\ge v_{\\pi'}(s)"}</M> for every state s. This is only a partial order: one
          policy may be better from some states and worse from others. The <em>optimal value function</em> is{" "}
          <M>{"v_*(s) = \\max_\\pi v_\\pi(s)"}</M>, a separate maximum for each state, and <M>{"q_*(s, a) = \\max_\\pi q_\\pi(s, a)"}</M>. That a
          single policy attains all these maxima at once is a theorem, proved in the next lesson (l6.2.4).
        </p>
      </Definition>

      <Example title="estimating a value by simulation">
        <p>
          Without the model, a value can still be estimated by running the policy: <C>mc_value</C> averages n discounted returns
          truncated at H steps, drawing actions with <C>rng.choices</C> and transitions with a uniform draw. Its error has a
          bias of at most <M>{"\\gamma^HR_{\\max}/(1 - \\gamma)"}</M> from truncation and a random part of order{" "}
          <M>{"1/\\sqrt n"}</M>. For the machine with the policy that repairs when worn and γ = 0.9, 4000 rollouts of 100 steps give
          6.934 against an exact value of about 6.949. Monte Carlo methods (l6.4.1) build learning algorithms on this idea.
        </p>
      </Example>

      <Remark title="reading the picture">
        <p>
          Moving probability in the worn state towards the action with the larger q value raises <M>{"v_\\pi(\\text{worn})"}</M>, and
          the other states gain too, because they pass through the worn state. That local test, compare q values and shift towards
          the better action, is the whole of policy improvement.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "v",
      rung: "check",
      prompt: (
        <p>
          The machine of l6.2.1 follows the policy run when good, repair when worn, repair when broken, with γ = 0.9. What is{" "}
          <M>{"v_\\pi(\\text{good})"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.9492, tolerance: 0.00006 },
    },
    {
      key: "q",
      rung: "check",
      prompt: (
        <p>
          For the same policy and γ, what is <M>{"q_\\pi(\\text{worn}, \\text{run})"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.6088, tolerance: 0.00006 },
    },
    {
      key: "adv",
      rung: "apply",
      prompt: <p>Why is the π-weighted average of the advantages in each state equal to zero?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because v_π(s) is itself the π-weighted average of q_π(s, a), so subtracting it leaves deviations that average to zero",
          "Because every advantage is zero",
          "Because the rewards have mean zero",
          "Because q_π and v_π are equal for deterministic policies only",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def policy_matrix(P, pi):
    n = len(P)
    M, r = [[0.0] * n for _ in range(n)], [0.0] * n
    for s in range(n):
        for a, w in pi[s].items():
            for p, s2, rew in P[s][a]:
                M[s][s2] += w * p
                r[s] += w * p * rew
    return M, r

def solve(A, b):
    n = len(b)
    T = [row[:] + [b[i]] for i, row in enumerate(A)]
    for c in range(n):
        piv = max(range(c, n), key=lambda i: abs(T[i][c]))
        T[c], T[piv] = T[piv], T[c]
        for i in range(c + 1, n):
            f = T[i][c] / T[c][c]
            T[i] = [x - f * y for x, y in zip(T[i], T[c])]
    x = [0.0] * n
    for i in reversed(range(n)):
        x[i] = (T[i][n] - sum(T[i][j] * x[j] for j in range(i + 1, n))) / T[i][i]
    return x

def v_pi(P, pi, gamma):
    M, r = policy_matrix(P, pi)
    n = len(r)
    A = [[(i == j) - gamma * M[i][j] for j in range(n)] for i in range(n)]
    return solve(A, r)

P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}; print(policy_matrix(P, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}), solve([[2, 1], [1, 3]], [3, 5]))
print([round(x, 4) for x in v_pi(P, {0: {0: 1}, 1: {0: 1}}, 0.5)], [round(x, 4) for x in v_pi(P, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}, 0.5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([[0.5, 0.5], [1.0, 0.0]], [1.0, 0.0]) [0.8, 1.4]\n[2.6667, 1.3333] [1.6, 0.8]",
          "([[0.5, 0.5], [1.0, 0.0]], [2.0, 0.0]) [0.8, 1.4]\n[2.6667, 1.3333] [1.6, 0.8]",
          "([[0.5, 0.5], [1.0, 0.0]], [1.0, 0.0]) [0.8, 1.4]\n[4.0, 2.0] [1.6, 0.8]",
          "([[0.5, 0.5], [1.0, 0.0]], [1.0, 0.0]) [1.4, 0.8]\n[2.6667, 1.3333] [2.0, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def q_from_v(P, V, gamma):
    return {s: {a: sum(p * (r + gamma * V[s2]) for p, s2, r in P[s][a]) for a in P[s]} for s in P}

def v_from_q(Q, pi):
    return [sum(w * Q[s][a] for a, w in pi[s].items()) for s in range(len(pi))]

def mc_value(P, pi, s0, gamma, H, n, rng):
    total = 0.0
    for _ in range(n):
        s, g, disc = s0, 0.0, 1.0
        for _ in range(H):
            acts = list(pi[s])
            a = rng.choices(acts, weights=[pi[s][b] for b in acts])[0]
            u, acc = rng.random(), 0.0
            for p, s2, r in P[s][a]:
                acc += p
                if u < acc:
                    break
            g += disc * r
            disc *= gamma
            s = s2
        total += g
    return total / n

P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}; Q = q_from_v(P, [4, 2], 0.5); print(Q, v_from_q(Q, [{0: 0.25, 1: 0.75}, {0: 1}]))
import random; print(mc_value(P, {0: {0: 1}, 1: {0: 1}}, 0, 0.5, 4, 3, random.Random(0)), mc_value(P, {0: {1: 1}, 1: {0: 1}}, 1, 0.9, 5, 2, random.Random(0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: {0: 3.0, 1: 2.0}, 1: {0: 2.0}} [2.25, 2.0]\n2.5 0.0",
          "{0: {0: 3.0, 1: 2.0}, 1: {0: 2.0}} [2.75, 2.0]\n2.5 0.0",
          "{0: {0: 4.0, 1: 2.0}, 1: {0: 2.0}} [2.5, 2.0]\n2.5 0.0",
          "{0: {0: 3.0, 1: 2.0}, 1: {0: 2.0}} [2.25, 2.0]\n4.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With states 0, …, n − 1, write <C>policy_matrix(P, pi)</C>, the pair <M>{"(P_\\pi, r_\\pi)"}</M> as a list of rows and a list;{" "}
          <C>solve(A, b)</C>, Gaussian elimination with partial pivoting that leaves A and b unchanged; and{" "}
          <C>v_pi(P, pi, gamma)</C>, the exact values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def policy_matrix(P, pi):
    return [], []

def solve(A, b):
    return [0.0] * len(b)

def v_pi(P, pi, gamma):
    return [0.0] * len(P)
`,
        solution: VPI,
        tests: [
          { name: "matrix", code: `P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}
assert policy_matrix(P, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}) == ([[0.5, 0.5], [1.0, 0.0]], [1.0, 0.0])
A = [[0, 1, 2], [1, 0, 1], [2, 1, 0]]; b = [8, 4, 4]; x = solve(A, b)
assert all(abs(sum(a * c for a, c in zip(row, x)) - y) < 1e-12 for row, y in zip(A, b)) and A == [[0, 1, 2], [1, 0, 1], [2, 1, 0]] and b == [8, 4, 4]` },
          { name: "values", code: `P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}
v = v_pi(P, {0: {0: 1}, 1: {0: 1}}, 0.5); assert abs(v[0] - 8 / 3) < 1e-12 and abs(v[1] - 4 / 3) < 1e-12
M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
v = v_pi(M, {0: {0: 1}, 1: {1: 1}, 2: {1: 1}}, 0.9); assert abs(v[0] - 410 / 59) < 1e-12 and abs(v[2] - (v[0] * 0.9 - 3)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>q_from_v(P, V, gamma)</C>, a dictionary of dictionaries <C>Q[s][a]</C>; <C>v_from_q(Q, pi)</C>, the list of state values;
          and <C>mc_value(P, pi, s0, gamma, H, n, rng)</C>, the average of n discounted returns of H steps, choosing each action
          with <C>rng.choices(actions, weights)[0]</C> over <C>list(pi[s])</C> and then the transition with one{" "}
          <C>rng.random()</C> as in <C>step</C> (l6.2.1).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def q_from_v(P, V, gamma):
    return {}

def v_from_q(Q, pi):
    return []

def mc_value(P, pi, s0, gamma, H, n, rng):
    return 0.0
`,
        solution: QV,
        tests: [
          { name: "qv", code: `P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}
Q = q_from_v(P, [4, 2], 0.5); assert Q == {0: {0: 3.0, 1: 2.0}, 1: {0: 2.0}} and v_from_q(Q, [{0: 0.25, 1: 0.75}, {0: 1}]) == [2.25, 2.0]
assert q_from_v({0: {0: [(0.5, 0, 1), (0.5, 1, 3)]}, 1: {0: [(1.0, 1, 0)]}}, [10, 20], 0.5) == {0: {0: 9.5}, 1: {0: 10.0}}` },
          { name: "mc", code: `import random
P = {0: {0: [(1.0, 1, 2)], 1: [(1.0, 0, 0)]}, 1: {0: [(1.0, 0, 0)]}}
assert mc_value(P, {0: {0: 1}, 1: {0: 1}}, 0, 0.5, 4, 3, random.Random(0)) == 2.5 and mc_value(P, {0: {0: 1}, 1: {0: 1}}, 1, 1, 3, 1, random.Random(0)) == 2
m = mc_value(P, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}, 0, 0.5, 30, 4000, random.Random(1)); assert abs(m - 1.6) < 0.05` },
        ],
      },
    },
    {
      key: "advworn",
      rung: "stretch",
      prompt: (
        <p>
          Under the policy run, run, repair with γ = 0.9, what is the advantage <M>{"A_\\pi(\\text{worn}, \\text{repair})"}</M>? Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.0806, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The relations between v and q hold for any policy. Replacing the policy&apos;s average over actions by a maximum gives the
        Bellman optimality equations, whose solution is the optimal value function, and from which an optimal policy can be read
        off directly. That is the subject of the next lesson (l6.2.4).
      </p>
    </>
  ),
};
