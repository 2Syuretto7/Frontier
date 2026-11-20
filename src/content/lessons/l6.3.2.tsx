import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PolicyIterationViz } from "@/components/viz/PolicyIterationViz";
import type { LessonContent } from "@/lib/types";

const PI = `def evaluate(P, policy, gamma, tol=1e-12):
    v = [0.0] * len(P)
    while True:
        new = [sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][policy[s]]) for s in range(len(v))]
        if max(abs(x - y) for x, y in zip(new, v)) < tol:
            return new
        v = new

def improve(P, v, gamma, policy):
    new = {}
    for s in range(len(v)):
        q = {a: sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s]}
        best = max(q.values())
        new[s] = policy[s] if q[policy[s]] >= best - 1e-12 else max(q, key=q.get)
    return new

def policy_iteration(P, gamma, policy):
    iters = 0
    while True:
        v = evaluate(P, policy, gamma)
        new = improve(P, v, gamma, policy)
        iters += 1
        if new == policy:
            return policy, v, iters
        policy = new`;

const MPI = `def greedy_q(P, v, gamma):
    return {s: max(P[s], key=lambda a: sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])) for s in range(len(v))}

def partial_eval(P, policy, v, gamma, m):
    for _ in range(m):
        v = [sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][policy[s]]) for s in range(len(v))]
    return v

def modified_pi(P, gamma, m, rounds):
    v = [0.0] * len(P)
    for _ in range(rounds):
        policy = greedy_q(P, v, gamma)
        v = partial_eval(P, policy, v, gamma, m)
    return greedy_q(P, v, gamma), v`;

export const lesson: LessonContent = {
  id: "l6.3.2",
  minutes: 55,
  links: {
    requires: ["l6.3.1", "l6.2.4"],
    revisits: ["l6.2.3"],
    foreshadows: ["l6.3.3", "l6.6.5", "l6.7.2"],
  },

  puzzle: (
    <>
      <p>
        Once a policy has been evaluated, its q values say, in every state, which action would be best if the policy were
        followed afterwards. Switching to those actions everywhere at once changes what &ldquo;afterwards&rdquo; means: the
        evaluation that justified each switch assumed the old policy elsewhere. Can simultaneous greedy switches make things
        worse? And if not, does repeating them end at an optimal policy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Taking a better action once and then following the old policy is better than following the old policy; doing the same
        at the next step is better again; and continuing for ever gives the new policy, which is therefore at least as good
        everywhere. So greedy improvement never hurts. Since there are finitely many deterministic policies and each step that
        changes the policy strictly improves it, the process must stop, and it stops only when no state can be improved, which
        is the Bellman optimality equation.
      </p>
      <PolicyIterationViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="policy improvement">
        <p>
          Let π and π′ be deterministic policies with <M>{"q_\\pi(s, \\pi'(s)) \\ge v_\\pi(s)"}</M> for every state s. Then{" "}
          <M>{"v_{\\pi'}(s) \\ge v_\\pi(s)"}</M> for every s. If the first inequality is strict at some state, the second is strict
          there too.
        </p>
      </Theorem>
      <Proof>
        <p>
          The hypothesis says <M>{"T^{\\pi'}v_\\pi \\ge v_\\pi"}</M>, since <M>{"(T^{\\pi'}v_\\pi)(s) = q_\\pi(s, \\pi'(s))"}</M>. The operator{" "}
          <M>{"T^{\\pi'}"}</M> is monotone (l6.2.4), so applying it k times gives{" "}
          <M>{"(T^{\\pi'})^kv_\\pi \\ge \\dots \\ge T^{\\pi'}v_\\pi \\ge v_\\pi"}</M>, and the left side tends to <M>{"v_{\\pi'}"}</M>. If{" "}
          <M>{"(T^{\\pi'}v_\\pi)(s) > v_\\pi(s)"}</M>, then <M>{"v_{\\pi'}(s) \\ge (T^{\\pi'}v_\\pi)(s) > v_\\pi(s)"}</M>.
        </p>
      </Proof>

      <Definition title="policy iteration">
        <p>
          Start from any deterministic policy. Repeat: evaluate it (<C>evaluate</C>, here by sweeping to a tight tolerance, or
          exactly by a linear solve), then make it greedy with respect to its own q values (<C>improve</C>), keeping the current
          action whenever it is among the best. Stop when the policy does not change (<C>policy_iteration</C>).
        </p>
        <Code>{PI}</Code>
      </Definition>

      <Theorem title="policy iteration finds an optimal policy">
        <p>
          Policy iteration stops after at most <M>{"\\prod_s|A(s)|"}</M> iterations, and the final policy is optimal.
        </p>
      </Theorem>
      <Proof>
        <p>
          A greedy policy satisfies the hypothesis of the improvement theorem, since <M>{"q_\\pi(s, \\pi'(s)) = \\max_aq_\\pi(s, a) \\ge q_\\pi(s, \\pi(s)) = v_\\pi(s)"}</M>.
          If the policy changes at s, the rule of keeping the current action on ties means the new action is strictly better,
          so <M>{"v_{\\pi'}(s) > v_\\pi(s)"}</M>. The value vectors therefore strictly increase from one change to the next, no policy
          can recur, and there are only <M>{"\\prod_s|A(s)|"}</M> deterministic policies. When the policy does not change,{" "}
          <M>{"v_\\pi(s) = \\max_aq_\\pi(s, a)"}</M> for all s, which says <M>{"T^*v_\\pi = v_\\pi"}</M>, so <M>{"v_\\pi = v_*"}</M> by uniqueness
          of the fixed point.
        </p>
      </Proof>

      <Remark title="how many iterations">
        <p>
          The bound is astronomically pessimistic. In practice policy iteration usually needs a handful of iterations, as in the
          picture, because each greedy step corrects many states at once; for a fixed discount it is known to need a number of
          iterations polynomial in the numbers of states and actions (Ye, 2011). Each iteration is expensive, though: an exact
          evaluation. The tie rule is not a technicality: if ties were broken by a fixed order regardless of the current
          action, the algorithm could switch for ever between equally good policies.
        </p>
      </Remark>

      <Definition title="modified policy iteration">
        <p>
          Evaluating exactly is wasteful when the policy is about to change. <em>Modified policy iteration</em> keeps a value
          vector v and alternates a greedy step, <M>{"\\pi \\leftarrow"}</M> greedy for v (<C>greedy_q</C>), with only m sweeps of{" "}
          <M>{"T^\\pi"}</M> starting from the current v (<C>partial_eval</C>). With m = ∞ this is policy iteration. With m = 1 each
          round applies <M>{"T^\\pi"}</M> for the greedy π, which equals <M>{"T^*v"}</M>: this is value iteration (l6.3.3).{" "}
          <C>modified_pi</C> runs a given number of rounds from v = 0.
        </p>
        <Code>{MPI}</Code>
      </Definition>

      <Theorem title="convergence of modified policy iteration">
        <p>
          (Puterman and Shin, 1978.) For every m ≥ 1 the values of modified policy iteration converge to <M>{"v_*"}</M>, and the
          greedy policies are optimal after finitely many rounds.
        </p>
      </Theorem>

      <Remark title="evaluation and improvement">
        <p>
          The pattern of an evaluation step and an improvement step, each done only partly and interleaved, is called{" "}
          <em>generalised policy iteration</em>, and almost every reinforcement learning method has it: Monte Carlo control and
          SARSA estimate q from experience and act greedily on it, actor-critic methods (l6.6.5) train a critic to evaluate and
          an actor to improve, and trust-region methods (l6.7.2) make the improvement step cautious because the evaluation is
          only approximate.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "run",
      rung: "check",
      prompt: (
        <p>
          For the machine of l6.2.1 with γ = 0.9, evaluate the policy that always runs. What is <M>{"v_\\pi(\\text{good})"}</M>? Give
          four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.4099, tolerance: 0.00006 },
    },
    {
      key: "iters",
      rung: "check",
      prompt: (
        <p>
          Run <C>policy_iteration</C> on the machine with γ = 0.9 from the policy repair when good, repair when worn, run when
          broken. How many iterations does it report, counting the final one in which the policy does not change?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.5 },
    },
    {
      key: "ties",
      rung: "apply",
      prompt: <p>Why does <C>improve</C> keep the current action when it is among the best?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that every change of policy is a strict improvement, which rules out cycling between equally good policies and guarantees termination",
          "Because the current action always has the highest q value",
          "To make each evaluation step cheaper",
          "Because ties cannot occur in finite MDPs",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def evaluate(P, policy, gamma, tol=1e-12):
    v = [0.0] * len(P)
    while True:
        new = [sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][policy[s]]) for s in range(len(v))]
        if max(abs(x - y) for x, y in zip(new, v)) < tol:
            return new
        v = new

def improve(P, v, gamma, policy):
    new = {}
    for s in range(len(v)):
        q = {a: sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a in P[s]}
        best = max(q.values())
        new[s] = policy[s] if q[policy[s]] >= best - 1e-12 else max(q, key=q.get)
    return new

def policy_iteration(P, gamma, policy):
    iters = 0
    while True:
        v = evaluate(P, policy, gamma)
        new = improve(P, v, gamma, policy)
        iters += 1
        if new == policy:
            return policy, v, iters
        policy = new

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}; print([round(x, 4) for x in evaluate(P, {0: 0, 1: 0}, 0.5)], improve(P, [2, 6], 0.5, {0: 0, 1: 0}), improve(P, [2, 2], 0.5, {0: 1, 1: 0}))
pol, v, k = policy_iteration(P, 0.5, {0: 0, 1: 0}); print(pol, [round(x, 4) for x in v], k)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 6.0] {0: 1, 1: 0} {0: 0, 1: 0}\n{0: 1, 1: 0} [3.0, 6.0] 2",
          "[2.0, 6.0] {0: 1, 1: 0} {0: 1, 1: 0}\n{0: 1, 1: 0} [3.0, 6.0] 2",
          "[2.0, 6.0] {0: 0, 1: 0} {0: 0, 1: 0}\n{0: 0, 1: 0} [2.0, 6.0] 1",
          "[2.0, 6.0] {0: 1, 1: 0} {0: 0, 1: 0}\n{0: 1, 1: 0} [3.0, 6.0] 3",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def greedy_q(P, v, gamma):
    return {s: max(P[s], key=lambda a: sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a])) for s in range(len(v))}

def partial_eval(P, policy, v, gamma, m):
    for _ in range(m):
        v = [sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][policy[s]]) for s in range(len(v))]
    return v

def modified_pi(P, gamma, m, rounds):
    v = [0.0] * len(P)
    for _ in range(rounds):
        policy = greedy_q(P, v, gamma)
        v = partial_eval(P, policy, v, gamma, m)
    return greedy_q(P, v, gamma), v

P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}; print(greedy_q(P, [0, 0], 0.5), greedy_q(P, [2, 6], 0.5), partial_eval(P, {0: 1, 1: 0}, [0, 0], 0.5, 2))
print(modified_pi(P, 0.5, 1, 1), modified_pi(P, 0.5, 3, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: 0, 1: 0} {0: 1, 1: 0} [1.5, 4.5]\n({0: 0, 1: 0}, [1.0, 3.0]) ({0: 1, 1: 0}, [2.90625, 5.90625])",
          "{0: 0, 1: 0} {0: 1, 1: 0} [0.0, 3.0]\n({0: 0, 1: 0}, [1.0, 3.0]) ({0: 1, 1: 0}, [2.90625, 5.90625])",
          "{0: 1, 1: 0} {0: 1, 1: 0} [1.5, 4.5]\n({0: 0, 1: 0}, [1.0, 3.0]) ({0: 1, 1: 0}, [2.90625, 5.90625])",
          "{0: 0, 1: 0} {0: 1, 1: 0} [1.5, 4.5]\n({0: 1, 1: 0}, [1.0, 3.0]) ({0: 1, 1: 0}, [3.0, 6.0])",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For deterministic policies given as dictionaries from states to actions, write <C>evaluate(P, policy, gamma, tol=1e-12)</C>,
          synchronous sweeps from zero returning the new values once the largest change is below tol;{" "}
          <C>improve(P, v, gamma, policy)</C>, greedy improvement that keeps the current action when its q value is within 1e-12 of
          the best and otherwise takes the first best action in the order of <C>P[s]</C>; and{" "}
          <C>policy_iteration(P, gamma, policy)</C>, returning (policy, values, iterations).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def evaluate(P, policy, gamma, tol=1e-12):
    return [0.0] * len(P)

def improve(P, v, gamma, policy):
    return policy

def policy_iteration(P, gamma, policy):
    return policy, [0.0] * len(P), 0
`,
        solution: PI,
        tests: [
          { name: "steps", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
v = evaluate(P, {0: 0, 1: 0}, 0.5); assert abs(v[0] - 2) < 1e-10 and abs(v[1] - 6) < 1e-10
assert improve(P, [2, 6], 0.5, {0: 0, 1: 0}) == {0: 1, 1: 0} and improve(P, [2, 2], 0.5, {0: 1, 1: 0}) == {0: 0, 1: 0} and improve(P, [2, 4], 0.5, {0: 1, 1: 0}) == {0: 1, 1: 0}` },
          { name: "pi", code: `M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
pol, v, k = policy_iteration(M, 0.9, {0: 0, 1: 0, 2: 0}); assert pol == {0: 0, 1: 1, 2: 1} and k == 2 and abs(v[0] - 410 / 59) < 1e-9
pol, v, k = policy_iteration(M, 0.6, {0: 1, 1: 1, 2: 1}); assert pol == {0: 0, 1: 0, 2: 0} and abs(v[0] - 2.1394230769) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy_q(P, v, gamma)</C>, the policy taking in each state the first action, in the order of <C>P[s]</C>, with the
          largest lookahead; <C>partial_eval(P, policy, v, gamma, m)</C>, m synchronous sweeps of <M>{"T^\\pi"}</M> from v; and{" "}
          <C>modified_pi(P, gamma, m, rounds)</C>, which returns the greedy policy for the final values together with those values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def greedy_q(P, v, gamma):
    return {}

def partial_eval(P, policy, v, gamma, m):
    return v

def modified_pi(P, gamma, m, rounds):
    return {}, [0.0] * len(P)
`,
        solution: MPI,
        tests: [
          { name: "parts", code: `P = {0: {0: [(1.0, 0, 1)], 1: [(1.0, 1, 0)]}, 1: {0: [(1.0, 1, 3)]}}
assert greedy_q(P, [0, 0], 0.5) == {0: 0, 1: 0} and greedy_q(P, [2, 6], 0.5) == {0: 1, 1: 0} and greedy_q(P, [2, 4], 0.5) == {0: 0, 1: 0}
assert partial_eval(P, {0: 1, 1: 0}, [0, 0], 0.5, 2) == [1.5, 4.5] and partial_eval(P, {0: 0, 1: 0}, [7, 7], 0.5, 0) == [7, 7]` },
          { name: "mpi", code: `M = {0: {0: [(0.8, 0, 1.0), (0.2, 1, 1.0)], 1: [(1.0, 0, -0.5)]}, 1: {0: [(0.6, 1, 0.6), (0.4, 2, 0.6)], 1: [(1.0, 0, -1.0)]}, 2: {0: [(1.0, 2, 0.0)], 1: [(1.0, 0, -3.0)]}}
for m in (1, 5, 50):
    pol, v = modified_pi(M, 0.9, m, 3000 // m)
    assert pol == {0: 0, 1: 1, 2: 1} and abs(v[0] - 410 / 59) < 1e-9
assert modified_pi(M, 0.9, 1, 1) == ({0: 0, 1: 0, 2: 0}, [1.0, 0.6, 0.0])` },
        ],
      },
    },
    {
      key: "count",
      rung: "stretch",
      prompt: (
        <p>
          On the 4 × 4 grid of l6.3.1 (terminal corners 0 and 15, reward −1 per step, γ = 1), how many deterministic policies are
          optimal, counting only the choices at the 14 non-terminal cells?
        </p>
      ),
      answer: { kind: "numeric", value: 256, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Policy iteration spends most of its time evaluating policies it is about to abandon. Taking modified policy iteration
        to the extreme of one sweep per round gives value iteration (l6.3.3), which never represents a policy explicitly and
        simply iterates the Bellman optimality operator.
      </p>
    </>
  ),
};
