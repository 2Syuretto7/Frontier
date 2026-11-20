import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BellmanContractionViz } from "@/components/viz/BellmanContractionViz";
import type { LessonContent } from "@/lib/types";

const OPS = `def bellman_op(P, v, gamma, pi):
    return [sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items()) for s in range(len(v))]

def bellman_opt(P, v, gamma):
    return [max(sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s]) for s in range(len(v))]

def greedy(P, v, gamma):
    pol = {}
    for s in range(len(v)):
        best = None
        for a in P[s]:
            q = sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])
            if best is None or q > best:
                best, pol[s] = q, a
    return pol`;

const QOPS = `def q_opt_op(P, Q, gamma):
    return {s: {a: sum(p * (r + gamma * max(Q[s2].values())) for p, s2, r in P[s][a]) for a in P[s]} for s in P}

def sup_dist(Q1, Q2):
    return max(abs(Q1[s][a] - Q2[s][a]) for s in Q1 for a in Q1[s])

def residual_bound(P, Q, gamma):
    return sup_dist(q_opt_op(P, Q, gamma), Q) / (1 - gamma)`;

export const lesson: LessonContent = {
  id: "l6.2.4",
  minutes: 60,
  links: {
    requires: ["l6.2.3"],
    revisits: ["l6.2.2"],
    foreshadows: ["l6.3.1", "l6.3.3", "l6.4.5"],
  },

  puzzle: (
    <>
      <p>
        There are <M>{"|A|^{|S|}"}</M> deterministic policies, and infinitely many stochastic ones. The machine has 8 deterministic
        policies; a board game has more than there are atoms in the universe. Yet the optimal values satisfy a single equation
        with one unknown per state, and an optimal policy can be read off its solution without comparing policies at all. What is
        that equation, and why does it have exactly one solution?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If you already knew the optimal value of every next state, choosing the best action now would be easy: take the action
        whose reward plus discounted next value is largest. So the optimal value of a state must equal that best one-step
        lookahead. This consistency condition, the Bellman optimality equation, pins the optimal values down, because applying
        the lookahead to any two guesses brings them closer together by a factor of γ: repeated lookahead forgets the initial
        guess.
      </p>
      <BellmanContractionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Bellman operators">
        <p>
          For a value vector v, the <em>Bellman expectation operator</em> of a policy π and the <em>Bellman optimality operator</em> are
        </p>
        <MD>{"(T^\\pi v)(s) = \\sum_a\\pi(a \\mid s)\\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v(s')\\bigr), \\qquad (T^*v)(s) = \\max_a\\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v(s')\\bigr)."}</MD>
        <p>
          <C>bellman_op</C> and <C>bellman_opt</C> compute them, and <C>greedy</C> returns, in each state, the first action attaining the
          maximum: a policy that is <em>greedy</em> with respect to v.
        </p>
        <Code>{OPS}</Code>
      </Definition>

      <Theorem title="the Bellman equations">
        <p>
          <M>{"v_\\pi"}</M> is the unique fixed point of <M>{"T^\\pi"}</M>: <M>{"v_\\pi = T^\\pi v_\\pi"}</M>. The operator <M>{"T^*"}</M> also
          has a unique fixed point, written <M>{"v_*"}</M>, satisfying the <em>Bellman optimality equation</em>
        </p>
        <MD>{"v_*(s) = \\max_a\\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v_*(s')\\bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first statement is the linear system of l6.2.3. For the second, use the sup norm{" "}
          <M>{"\\|u - v\\|_\\infty = \\max_s|u(s) - v(s)|"}</M>. For any functions f, g of a,{" "}
          <M>{"|\\max_af(a) - \\max_ag(a)| \\le \\max_a|f(a) - g(a)|"}</M>. Hence
        </p>
        <MD>{"|(T^*u)(s) - (T^*v)(s)| \\le \\max_a\\gamma\\sum_{s'}p(s' \\mid s, a)|u(s') - v(s')| \\le \\gamma\\|u - v\\|_\\infty."}</MD>
        <p>
          So <M>{"T^*"}</M> is a <em>contraction</em> with modulus γ, and so is <M>{"T^\\pi"}</M> by the same argument with an average in
          place of the maximum. By the Banach fixed-point theorem, a contraction of a complete space has exactly one fixed point,
          and the iterates <M>{"(T^*)^kv"}</M> from any start converge to it with{" "}
          <M>{"\\|(T^*)^kv - v_*\\|_\\infty \\le \\gamma^k\\|v - v_*\\|_\\infty"}</M>. Uniqueness is immediate: two fixed points u, v would
          satisfy <M>{"\\|u - v\\| \\le \\gamma\\|u - v\\|"}</M>.
        </p>
      </Proof>

      <Theorem title="greedy policies for v* are optimal">
        <p>
          For every policy π and state s, <M>{"v_\\pi(s) \\le v_*(s)"}</M>, and any policy greedy with respect to <M>{"v_*"}</M> attains{" "}
          <M>{"v_*"}</M> at every state. So <M>{"v_*"}</M> is the optimal value function of l6.2.3, and an optimal policy exists that is
          deterministic and stationary.
        </p>
      </Theorem>
      <Proof>
        <p>
          The operators are <em>monotone</em>: if <M>{"u \\le v"}</M> in every state then <M>{"T^\\pi u \\le T^\\pi v"}</M>, since the
          weights are non-negative. For any π, <M>{"T^\\pi v_* \\le T^*v_* = v_*"}</M>, because an average is at most a maximum. Applying{" "}
          <M>{"T^\\pi"}</M> repeatedly and using monotonicity, <M>{"(T^\\pi)^kv_* \\le v_*"}</M> for all k, and the left side converges to{" "}
          <M>{"v_\\pi"}</M>. So <M>{"v_\\pi \\le v_*"}</M>. If <M>{"\\pi_*"}</M> is greedy for <M>{"v_*"}</M>, then{" "}
          <M>{"T^{\\pi_*}v_* = T^*v_* = v_*"}</M>, so <M>{"v_*"}</M> is the fixed point of <M>{"T^{\\pi_*}"}</M>, which is{" "}
          <M>{"v_{\\pi_*}"}</M>.
        </p>
      </Proof>

      <Theorem title="the optimality equation for q">
        <p>
          <M>{"q_*(s, a) = \\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma\\max_{a'}q_*(s', a')\\bigr)"}</M>, the operator on the right
          is again a γ-contraction in the sup norm, and for any Q,
        </p>
        <MD>{"\\|Q - q_*\\|_\\infty \\le \\frac{\\|T^*Q - Q\\|_\\infty}{1 - \\gamma}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Since <M>{"q_*(s, a) = \\sum p\\,(r + \\gamma v_*(s'))"}</M> and <M>{"v_*(s') = \\max_{a'}q_*(s', a')"}</M>, substitution gives the
          equation. The contraction argument is as before (<C>q_opt_op</C>, with distance <C>sup_dist</C>). For the bound,{" "}
          <M>{"\\|Q - q_*\\| \\le \\|Q - T^*Q\\| + \\|T^*Q - T^*q_*\\| \\le \\|Q - T^*Q\\| + \\gamma\\|Q - q_*\\|"}</M>; rearrange (
          <C>residual_bound</C>). The bound needs no knowledge of <M>{"q_*"}</M>: a small Bellman residual certifies a good estimate.
          With <M>{"q_*"}</M> in hand, acting optimally needs no model at all: pick <M>{"\\arg\\max_aq_*(s, a)"}</M>. That is why
          Q-learning (l6.4.5) learns q rather than v.
        </p>
        <Code>{QOPS}</Code>
      </Proof>

      <Remark title="the machine">
        <p>
          The optimal policy depends on γ. In the picture, for γ = 0.5 and 0.7 the operator never repairs: the immediate cost
          outweighs the discounted future. At γ = 0.8 repairing a worn machine pays but repairing a broken one does not, and from
          γ = 0.9 both pay. Solving the optimality equation finds the switch points without comparing policies one by one. The
          next part turns the two fixed-point characterisations into algorithms: iterate <M>{"T^\\pi"}</M> to evaluate (l6.3.1) and
          iterate <M>{"T^*"}</M> to optimise (l6.3.3).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "iters",
      rung: "check",
      prompt: (
        <p>
          Two value vectors are at sup distance 20, and γ = 0.9. After how many applications of <M>{"T^*"}</M> to both does the
          contraction bound guarantee a distance of at most 0.01?
        </p>
      ),
      answer: { kind: "numeric", value: 73, tolerance: 0.5 },
    },
    {
      key: "v06",
      rung: "check",
      prompt: <p>For the machine of l6.2.1 with γ = 0.6, what is <M>{"v_*(\\text{good})"}</M>? Give four decimals.</p>,
      answer: { kind: "numeric", value: 2.1394, tolerance: 0.00006 },
    },
    {
      key: "greedy",
      rung: "apply",
      prompt: <p>Why is a policy that is greedy with respect to <M>{"v_*"}</M> optimal?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its Bellman operator agrees with T* at v*, so v* is a fixed point of that operator and hence equals the policy's value",
          "Greedy policies are optimal with respect to any value function",
          "Because v* is the largest reward available in one step",
          "Because the greedy policy visits every state equally often",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bellman_op(P, v, gamma, pi):
    return [sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items()) for s in range(len(v))]

def bellman_opt(P, v, gamma):
    return [max(sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s]) for s in range(len(v))]

def greedy(P, v, gamma):
    pol = {}
    for s in range(len(v)):
        best = None
        for a in P[s]:
            q = sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])
            if best is None or q > best:
                best, pol[s] = q, a
    return pol

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}; print(bellman_op(P, [0, 0], 0.5, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}), bellman_op(P, [2, 4], 0.5, {0: {1: 1}, 1: {0: 1}}))
print(bellman_opt(P, [0, 0], 0.5), bellman_opt(P, [2, 4], 0.5), greedy(P, [0, 0], 0.5), greedy(P, [2, 4], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 2.0] [2.0, 4.0]\n[1.0, 2.0] [2.0, 4.0] {0: 0, 1: 0} {0: 0, 1: 0}",
          "[0.5, 2.0] [2.0, 4.0]\n[1.0, 2.0] [2.0, 4.0] {0: 0, 1: 0} {0: 1, 1: 0}",
          "[1.0, 2.0] [2.0, 4.0]\n[1.0, 2.0] [2.0, 4.0] {0: 0, 1: 0} {0: 0, 1: 0}",
          "[0.5, 2.0] [2.0, 4.0]\n[1.0, 2.0] [3.0, 4.0] {0: 0, 1: 0} {0: 0, 1: 0}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def q_opt_op(P, Q, gamma):
    return {s: {a: sum(p * (r + gamma * max(Q[s2].values())) for p, s2, r in P[s][a]) for a in P[s]} for s in P}

def sup_dist(Q1, Q2):
    return max(abs(Q1[s][a] - Q2[s][a]) for s in Q1 for a in Q1[s])

def residual_bound(P, Q, gamma):
    return sup_dist(q_opt_op(P, Q, gamma), Q) / (1 - gamma)

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}; Q = {0: {0: 0, 1: 0}, 1: {0: 0}}; Q1 = q_opt_op(P, Q, 0.5); print(Q1, q_opt_op(P, Q1, 0.5))
print(sup_dist(Q1, Q), residual_bound(P, Q, 0.5), residual_bound(P, {0: {0: 2, 1: 2}, 1: {0: 4}}, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: {0: 1.0, 1: 0.0}, 1: {0: 2.0}} {0: {0: 1.5, 1: 1.0}, 1: {0: 3.0}}\n2.0 4.0 0.0",
          "{0: {0: 1.0, 1: 0.0}, 1: {0: 2.0}} {0: {0: 1.5, 1: 1.0}, 1: {0: 3.0}}\n2.0 2.0 0.0",
          "{0: {0: 1.0, 1: 0.0}, 1: {0: 2.0}} {0: {0: 1.5, 1: 0.5}, 1: {0: 3.0}}\n2.0 4.0 0.0",
          "{0: {0: 1.0, 1: 0.0}, 1: {0: 2.0}} {0: {0: 1.5, 1: 1.0}, 1: {0: 3.0}}\n2.0 4.0 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With states 0, …, n − 1, write <C>bellman_op(P, v, gamma, pi)</C> and <C>bellman_opt(P, v, gamma)</C>, each returning the new
          list of values, and <C>greedy(P, v, gamma)</C>, a dictionary from states to the first action, in the order of{" "}
          <C>P[s]</C>, whose one-step lookahead is largest.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bellman_op(P, v, gamma, pi):
    return v

def bellman_opt(P, v, gamma):
    return v

def greedy(P, v, gamma):
    return {}
`,
        solution: OPS,
        tests: [
          { name: "ops", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}
assert bellman_op(P, [0, 0], 0.5, {0: {0: 0.5, 1: 0.5}, 1: {0: 1}}) == [0.5, 2.0] and bellman_opt(P, [0, 0], 0.5) == [1.0, 2.0] and bellman_opt(P, [2, 6], 0.5) == [3.0, 5.0]
v = [0, 0]
for _ in range(200): v = bellman_opt(P, v, 0.5)
assert abs(v[0] - 2) < 1e-12 and abs(v[1] - 4) < 1e-12` },
          { name: "greedy", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}
assert greedy(P, [0, 0], 0.5) == {0: 0, 1: 0} and greedy(P, [2, 4], 0.5) == {0: 0, 1: 0} and greedy(P, [2, 6], 0.5) == {0: 1, 1: 0}
M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
v = [0, 0, 0]
for _ in range(500): v = bellman_opt(M, v, 0.9)
assert greedy(M, v, 0.9) == {0: 0, 1: 1, 2: 1} and abs(v[0] - 410 / 59) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For Q stored as a dictionary of dictionaries, write <C>q_opt_op(P, Q, gamma)</C>, the optimality operator on Q;{" "}
          <C>sup_dist(Q1, Q2)</C>; and <C>residual_bound(P, Q, gamma)</C>, the bound{" "}
          <M>{"\\|T^*Q - Q\\|_\\infty/(1 - \\gamma)"}</M> on the distance from Q to <M>{"q_*"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def q_opt_op(P, Q, gamma):
    return Q

def sup_dist(Q1, Q2):
    return 0.0

def residual_bound(P, Q, gamma):
    return 0.0
`,
        solution: QOPS,
        tests: [
          { name: "op", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}
Q = {0: {0: 0, 1: 0}, 1: {0: 0}}; Q1 = q_opt_op(P, Q, 0.5); assert Q1 == {0: {0: 1.0, 1: 0.0}, 1: {0: 2.0}} and Q == {0: {0: 0, 1: 0}, 1: {0: 0}}
assert q_opt_op({0: {0: [(0.5, 0, 2), (0.5, 1, 0)]}, 1: {0: [(1.0, 1, 1)], 1: [(1.0, 0, 0)]}}, {0: {0: 4}, 1: {0: 2, 1: 6}}, 0.5) == {0: {0: 3.5}, 1: {0: 4.0, 1: 2.0}}` },
          { name: "dist", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 2)]}}
assert sup_dist({0: {0: 1, 1: -3}}, {0: {0: 2, 1: 1}}) == 4 and residual_bound(P, {0: {0: 0, 1: 0}, 1: {0: 0}}, 0.5) == 4 and residual_bound(P, {0: {0: 2, 1: 2}, 1: {0: 4}}, 0.5) == 0
Q = {0: {0: 0, 1: 0}, 1: {0: 0}}
for _ in range(60): Q = q_opt_op(P, Q, 0.5)
assert residual_bound(P, Q, 0.5) < 1e-12 and abs(Q[0][1] - 2) < 1e-12` },
        ],
      },
    },
    {
      key: "switch",
      rung: "stretch",
      prompt: (
        <p>
          For the machine, find the smallest discount γ at which repairing a worn machine is optimal, that is, where{" "}
          <M>{"q_*(\\text{worn}, \\text{repair}) = q_*(\\text{worn}, \\text{run})"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7362, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The Bellman equations are statements about fixed points; the next part turns them into algorithms. Iterating{" "}
        <M>{"T^\\pi"}</M> evaluates a policy without solving a linear system (l6.3.1), alternating evaluation with greedy improvement
        gives policy iteration (l6.3.2), and iterating <M>{"T^*"}</M> directly is value iteration (l6.3.3).
      </p>
    </>
  ),
};
