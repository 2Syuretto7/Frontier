import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ValueIterationViz } from "@/components/viz/ValueIterationViz";
import type { LessonContent } from "@/lib/types";

const VI = `def lookahead(P, v, gamma, s, a):
    return sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])

def value_iteration(P, gamma, eps):
    v, k = [0.0] * len(P), 0
    while True:
        new = [max(lookahead(P, v, gamma, s, a) for a in P[s]) for s in range(len(v))]
        k += 1
        delta = max(abs(x - y) for x, y in zip(new, v))
        v = new
        if delta < eps * (1 - gamma) / (2 * gamma):
            return v, k

def greedy(P, v, gamma):
    return {s: max(P[s], key=lambda a: lookahead(P, v, gamma, s, a)) for s in range(len(v))}`;

const FH = `def finite_horizon(P, H):
    v, plans = [0.0] * len(P), []
    for _ in range(H):
        q = [{a: sum(p * (r + v[s2]) for p, s2, r in P[s][a]) for a in P[s]} for s in range(len(v))]
        plans.append({s: max(q[s], key=q[s].get) for s in range(len(v))})
        v = [max(q[s].values()) for s in range(len(v))]
    return v, plans[::-1]

def q_iteration(P, gamma, n):
    Q = {s: {a: 0.0 for a in P[s]} for s in P}
    for _ in range(n):
        Q = {s: {a: sum(p * (r + gamma * max(Q[s2].values())) for p, s2, r in P[s][a]) for a in P[s]} for s in P}
    return Q

def async_vi(P, gamma, order, n):
    v = [0.0] * len(P)
    for _ in range(n):
        for s in order:
            v[s] = max(sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s])
    return v`;

export const lesson: LessonContent = {
  id: "l6.3.3",
  minutes: 55,
  links: {
    requires: ["l6.3.2", "l6.2.4"],
    revisits: ["l6.2.2"],
    foreshadows: ["l6.4.5", "l6.5.1", "l6.8.1"],
  },

  puzzle: (
    <>
      <p>
        Policy iteration evaluates each policy completely before improving it, although the next policy will usually differ.
        At the other extreme, one could improve after every single sweep, never holding a policy at all and just pushing values
        towards the Bellman optimality equation. How quickly does that converge, when can it stop, and what does the policy it
        hands back guarantee?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Value iteration repeats the optimal one-step lookahead. Starting from zero, after k sweeps it has computed the best
        possible expected reward over the next k steps, and as k grows the far future matters less and less, by a factor γ per
        step. The greedy policy only needs the values to rank actions correctly, so it is usually right long before the values
        have converged, and a simple test on the change between sweeps certifies how close to optimal it is.
      </p>
      <ValueIterationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="value iteration">
        <p>
          Start from <M>{"v_0"}</M> and set <M>{"v_{k+1} = T^*v_k"}</M>:
        </p>
        <MD>{"v_{k+1}(s) = \\max_a\\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v_k(s')\\bigr)."}</MD>
        <p>
          Stop when <M>{"\\|v_{k+1} - v_k\\|_\\infty < \\varepsilon(1 - \\gamma)/(2\\gamma)"}</M> and return the policy greedy with respect
          to <M>{"v_{k+1}"}</M> (<C>lookahead</C>, <C>value_iteration</C>, <C>greedy</C>).
        </p>
        <Code>{VI}</Code>
      </Definition>

      <Theorem title="what value iteration computes">
        <p>
          From <M>{"v_0 = 0"}</M>, <M>{"v_k(s)"}</M> is the largest expected discounted reward over the first k steps from s, and{" "}
          <M>{"\\|v_k - v_*\\|_\\infty \\le \\gamma^k\\|v_*\\|_\\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          With k steps to go, the best plan takes some action now and then plays the best (k − 1)-step plan from wherever it
          lands, so the k-step optimum is <M>{"T^*"}</M> applied to the (k − 1)-step optimum. This is backward induction, the
          principle of optimality of dynamic programming. The bound is the contraction property (l6.2.4).
        </p>
      </Proof>

      <Theorem title="an ε-optimal stopping rule">
        <p>
          If <M>{"\\|v_{k+1} - v_k\\|_\\infty = \\delta"}</M> and π is greedy with respect to <M>{"v_{k+1}"}</M>, then{" "}
          <M>{"\\|v_\\pi - v_*\\|_\\infty \\le 2\\gamma\\delta/(1 - \\gamma)"}</M>. In particular the rule above returns a policy within ε
          of optimal in every state.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write v for <M>{"v_{k+1}"}</M>. Because π is greedy, <M>{"T^\\pi v = T^*v"}</M>. Then{" "}
          <M>{"\\|v_\\pi - v\\| \\le \\|T^\\pi v_\\pi - T^\\pi v\\| + \\|T^*v - T^*v_k\\| \\le \\gamma\\|v_\\pi - v\\| + \\gamma\\delta"}</M>, so{" "}
          <M>{"\\|v_\\pi - v\\| \\le \\gamma\\delta/(1 - \\gamma)"}</M>. The same argument with <M>{"v_* = T^*v_*"}</M> gives{" "}
          <M>{"\\|v_* - v\\| \\le \\gamma\\delta/(1 - \\gamma)"}</M>. Add the two by the triangle inequality.
        </p>
      </Proof>

      <Remark title="the policy converges first">
        <p>
          Since there are finitely many deterministic policies, the actions of an optimal policy beat the others by some
          positive margin in q value, and once <M>{"v_k"}</M> is within a fraction of that margin of <M>{"v_*"}</M> the greedy policy is
          exactly optimal. In the picture this happens after 11 sweeps, while the largest change per sweep is still about 0.04.
          The stopping rule is a guarantee, not a description of when the policy becomes right.
        </p>
      </Remark>

      <Example title="finite horizons">
        <p>
          With a fixed number H of steps and no discount, backward induction gives both the optimal value and an optimal plan,
          which now depends on the number of steps left (<C>finite_horizon</C> returns the plans in time order). For the machine,
          with three or fewer steps left it never pays to repair anything: the remaining steps cannot earn back the cost. With
          four left a worn machine should be repaired. Optimal policies for finite horizons are generally not stationary.
        </p>
        <Code>{FH}</Code>
      </Example>

      <Remark title="variants and cost">
        <p>
          Iterating the optimality operator on q values (<C>q_iteration</C>) gives <M>{"q_*"}</M> directly, from which the optimal
          action needs no model; replacing its expectation by a sampled transition is Q-learning (l6.4.5). Values may also be
          updated in place, in any order (<C>async_vi</C>), and the iteration still converges as long as every state is updated
          infinitely often (Bertsekas, 1982); good orders, such as prioritising states whose values changed most, can be much
          faster. Each sweep costs about <M>{"|S|^2|A|"}</M> operations against policy iteration&apos;s cubic evaluations, but policy
          iteration needs far fewer iterations. Both need the full model and a table over all states, which rules them out for
          large problems: function approximation (l6.5.1) and learned models (l6.8.1) are the ways around this.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sweeps",
      rung: "check",
      prompt: (
        <p>
          Run <C>value_iteration</C> on the machine of l6.2.1 with γ = 0.9 and ε = 0.01, starting from zero. How many sweeps does
          it take?
        </p>
      ),
      answer: { kind: "numeric", value: 68, tolerance: 0.5 },
    },
    {
      key: "h3",
      rung: "check",
      prompt: (
        <p>
          With no discount and exactly three steps left, what is the largest expected total reward from a good machine? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.728, tolerance: 0.0005 },
    },
    {
      key: "rule",
      rung: "apply",
      prompt: (
        <p>
          The last sweep changed no value by more than δ. What does the stopping theorem guarantee about the greedy policy?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Its value is within 2γδ/(1 − γ) of optimal in every state",
          "It is exactly optimal",
          "Its value is within δ of optimal in every state",
          "Nothing, unless value iteration has fully converged",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lookahead(P, v, gamma, s, a):
    return sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])

def value_iteration(P, gamma, eps):
    v, k = [0.0] * len(P), 0
    while True:
        new = [max(lookahead(P, v, gamma, s, a) for a in P[s]) for s in range(len(v))]
        k += 1
        delta = max(abs(x - y) for x, y in zip(new, v))
        v = new
        if delta < eps * (1 - gamma) / (2 * gamma):
            return v, k

def greedy(P, v, gamma):
    return {s: max(P[s], key=lambda a: lookahead(P, v, gamma, s, a)) for s in range(len(v))}

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}; print(lookahead(P, [2, 6], 0.5, 0, 1), greedy(P, [0, 0], 0.5), greedy(P, [2, 6], 0.5))
v, k = value_iteration(P, 0.5, 0.5); print([round(x, 4) for x in v], k)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 {0: 0, 1: 0} {0: 1, 1: 0}\n[2.8125, 5.8125] 5",
          "3.0 {0: 0, 1: 0} {0: 0, 1: 0}\n[2.8125, 5.8125] 5",
          "2.0 {0: 0, 1: 0} {0: 1, 1: 0}\n[2.8125, 5.8125] 5",
          "3.0 {0: 0, 1: 0} {0: 1, 1: 0}\n[3.0, 6.0] 6",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def finite_horizon(P, H):
    v, plans = [0.0] * len(P), []
    for _ in range(H):
        q = [{a: sum(p * (r + v[s2]) for p, s2, r in P[s][a]) for a in P[s]} for s in range(len(v))]
        plans.append({s: max(q[s], key=q[s].get) for s in range(len(v))})
        v = [max(q[s].values()) for s in range(len(v))]
    return v, plans[::-1]

def q_iteration(P, gamma, n):
    Q = {s: {a: 0.0 for a in P[s]} for s in P}
    for _ in range(n):
        Q = {s: {a: sum(p * (r + gamma * max(Q[s2].values())) for p, s2, r in P[s][a]) for a in P[s]} for s in P}
    return Q

def async_vi(P, gamma, order, n):
    v = [0.0] * len(P)
    for _ in range(n):
        for s in order:
            v[s] = max(sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s])
    return v

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}; v, plans = finite_horizon(P, 3); print(v, plans)
print(q_iteration(P, 0.5, 2), async_vi(P, 0.5, [1, 0], 1), async_vi(P, 0.5, [0, 1], 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[6.0, 9.0] [{0: 1, 1: 0}, {0: 1, 1: 0}, {0: 0, 1: 0}]\n{0: {0: 1.5, 1: 1.5}, 1: {0: 4.5}} [1.5, 3.0] [1.0, 3.0]",
          "[6.0, 9.0] [{0: 0, 1: 0}, {0: 1, 1: 0}, {0: 1, 1: 0}]\n{0: {0: 1.5, 1: 1.5}, 1: {0: 4.5}} [1.5, 3.0] [1.0, 3.0]",
          "[6.0, 9.0] [{0: 1, 1: 0}, {0: 1, 1: 0}, {0: 0, 1: 0}]\n{0: {0: 1.5, 1: 1.5}, 1: {0: 4.5}} [1.5, 3.0] [1.5, 3.0]",
          "[3.0, 9.0] [{0: 1, 1: 0}, {0: 1, 1: 0}, {0: 0, 1: 0}]\n{0: {0: 1.0, 1: 1.5}, 1: {0: 4.5}} [1.5, 3.0] [1.0, 3.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lookahead(P, v, gamma, s, a)</C>; <C>value_iteration(P, gamma, eps)</C>, synchronous sweeps from zero until the
          change is below <M>{"\\varepsilon(1 - \\gamma)/(2\\gamma)"}</M>, returning (values, sweeps); and <C>greedy(P, v, gamma)</C>,
          the first best action in each state in the order of <C>P[s]</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lookahead(P, v, gamma, s, a):
    return 0.0

def value_iteration(P, gamma, eps):
    return [0.0] * len(P), 0

def greedy(P, v, gamma):
    return {}
`,
        solution: VI,
        tests: [
          { name: "parts", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
assert lookahead(P, [2, 6], 0.5, 0, 1) == 3 and lookahead({0: {0: [(0.5, 0, 2), (0.5, 1, 0)]}, 1: {}}, [4, 8], 0.5, 0, 0) == 4
assert greedy(P, [0, 0], 0.5) == {0: 0, 1: 0} and greedy(P, [2, 6], 0.5) == {0: 1, 1: 0} and greedy(P, [2, 4], 0.5) == {0: 0, 1: 0}` },
          { name: "vi", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
v, k = value_iteration(P, 0.5, 0.5); assert v == [2.8125, 5.8125] and k == 5
M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
v, k = value_iteration(M, 0.9, 0.01); assert k == 68 and greedy(M, v, 0.9) == {0: 0, 1: 1, 2: 1} and abs(v[0] - 410 / 59) < 0.01` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>finite_horizon(P, H)</C>, undiscounted backward induction returning the H-step values and the list of H plans in
          time order, each plan taking the first best action; <C>q_iteration(P, gamma, n)</C>, n synchronous sweeps of the
          optimality operator on Q from zero; and <C>async_vi(P, gamma, order, n)</C>, n passes of in-place value iteration over the
          states in the given order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def finite_horizon(P, H):
    return [0.0] * len(P), []

def q_iteration(P, gamma, n):
    return {}

def async_vi(P, gamma, order, n):
    return [0.0] * len(P)
`,
        solution: FH,
        tests: [
          { name: "fh", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
assert finite_horizon(P, 3) == ([6.0, 9.0], [{0: 1, 1: 0}, {0: 1, 1: 0}, {0: 0, 1: 0}]) and finite_horizon(P, 0) == ([0.0, 0.0], [])
M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
v, plans = finite_horizon(M, 4); assert abs(v[0] - 3.4176) < 1e-9 and plans[0] == {0: 0, 1: 1, 2: 0} and plans[-1] == {0: 0, 1: 0, 2: 0}` },
          { name: "qa", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
assert q_iteration(P, 0.5, 2) == {0: {0: 1.5, 1: 1.5}, 1: {0: 4.5}} and q_iteration(P, 0.5, 0) == {0: {0: 0.0, 1: 0.0}, 1: {0: 0.0}}
assert async_vi(P, 0.5, [1, 0], 1) == [1.5, 3.0] and async_vi(P, 0.5, [0, 1], 1) == [1.0, 3.0]
v = async_vi(P, 0.5, [0, 1], 80); Q = q_iteration(P, 0.5, 80); assert abs(v[0] - 3) < 1e-12 and abs(v[1] - 6) < 1e-12 and abs(max(Q[0].values()) - 3) < 1e-12` },
        ],
      },
    },
    {
      key: "broken",
      rung: "stretch",
      prompt: (
        <p>
          With no discount, what is the smallest number of steps left for which repairing a broken machine is the optimal first
          action?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Dynamic programming needs the transition probabilities. The next part drops that requirement: the agent learns only
        from experienced transitions. Monte Carlo methods (l6.4.1) average whole sampled returns, and temporal-difference
        methods (l6.4.2) apply sampled versions of the Bellman updates of this part.
      </p>
    </>
  ),
};
