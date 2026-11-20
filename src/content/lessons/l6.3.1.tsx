import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EvalSweepsViz } from "@/components/viz/EvalSweepsViz";
import type { LessonContent } from "@/lib/types";

const EVAL = `def iterative_eval(P, pi, gamma, tol):
    v, sweeps = [0.0] * len(P), 0
    while True:
        new = [sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items()) for s in range(len(v))]
        sweeps += 1
        delta = max(abs(x - y) for x, y in zip(new, v))
        v = new
        if delta < tol:
            return v, sweeps

def in_place_eval(P, pi, gamma, tol):
    v, sweeps = [0.0] * len(P), 0
    while True:
        delta = 0.0
        for s in range(len(v)):
            old = v[s]
            v[s] = sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items())
            delta = max(delta, abs(v[s] - old))
        sweeps += 1
        if delta < tol:
            return v, sweeps

def stop_error(delta, gamma):
    return gamma * delta / (1 - gamma)`;

const GRID = `MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def grid_mdp(rows, cols, terminals, step_reward):
    P = {}
    for s in range(rows * cols):
        r, c = divmod(s, cols)
        P[s] = {}
        for a, (dr, dc) in enumerate(MOVES):
            if s in terminals:
                P[s][a] = [(1.0, s, 0.0)]
                continue
            r2, c2 = r + dr, c + dc
            if not (0 <= r2 < rows and 0 <= c2 < cols):
                r2, c2 = r, c
            P[s][a] = [(1.0, r2 * cols + c2, step_reward)]
    return P

def uniform_policy(P):
    return {s: {a: 1 / len(P[s]) for a in P[s]} for s in P}

def value_grid(v, cols, nd=1):
    return [[round(x, nd) for x in v[i:i + cols]] for i in range(0, len(v), cols)]`;

export const lesson: LessonContent = {
  id: "l6.3.1",
  minutes: 50,
  links: {
    requires: ["l6.2.4"],
    revisits: ["l6.2.3", "l6.2.2"],
    foreshadows: ["l6.3.2", "l6.4.2"],
  },

  puzzle: (
    <>
      <p>
        Solving <M>{"(I - \\gamma P_\\pi)v = r_\\pi"}</M> directly costs about <M>{"|S|^3"}</M> operations. For a million states that is
        a quintillion, even though each state has only a handful of successors. The Bellman equation says that each value is a
        small average of a few others. Can a policy be evaluated by repeatedly applying that local rule, and how do we know when
        to stop?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Start with any guess, say zero, and replace every value by its one-step lookahead under the policy. After one sweep each
        value is right about the first reward; after k sweeps, about the first k rewards. Because the operator is a contraction,
        the guesses approach the true values geometrically. Using each new value as soon as it is computed, rather than waiting
        for the end of the sweep, spreads information faster.
      </p>
      <EvalSweepsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="iterative policy evaluation">
        <p>
          Starting from <M>{"v_0"}</M>, set <M>{"v_{k+1} = T^\\pi v_k"}</M>, that is, for every state at once,
        </p>
        <MD>{"v_{k+1}(s) = \\sum_a\\pi(a \\mid s)\\sum_{s', r}p(s', r \\mid s, a)\\bigl(r + \\gamma v_k(s')\\bigr)."}</MD>
        <p>
          Each sweep costs one pass over the transitions, far less than a linear solve when each state has few successors.{" "}
          <C>iterative_eval</C> sweeps until the largest change is below a tolerance and returns the values and the number of
          sweeps.
        </p>
        <Code>{EVAL}</Code>
      </Definition>

      <Theorem title="what k sweeps compute">
        <p>
          From <M>{"v_0 = 0"}</M>, <M>{"v_k(s) = \\mathbb{E}_\\pi\\bigl[\\sum_{j=0}^{k-1}\\gamma^jR_{j+1} \\mid S_0 = s\\bigr]"}</M>, and{" "}
          <M>{"\\|v_k - v_\\pi\\|_\\infty \\le \\gamma^k\\|v_\\pi\\|_\\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction: <M>{"v_{k+1}(s)"}</M> is the expected first reward plus γ times the expected k-step return from the next
          state, which is the expected (k + 1)-step return. The bound is the contraction property (l6.2.4) with{" "}
          <M>{"v_0 = 0"}</M>.
        </p>
      </Proof>

      <Theorem title="a stopping rule">
        <p>
          If <M>{"\\|v_k - v_{k-1}\\|_\\infty \\le \\delta"}</M>, then <M>{"\\|v_k - v_\\pi\\|_\\infty \\le \\gamma\\delta/(1 - \\gamma)"}</M> (
          <C>stop_error</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\|v_k - v_\\pi\\| = \\|T^\\pi v_{k-1} - T^\\pi v_\\pi\\| \\le \\gamma\\|v_{k-1} - v_\\pi\\| \\le \\gamma(\\delta + \\|v_k - v_\\pi\\|)"}</M>;
          rearrange. A small change between sweeps therefore certifies a small error, although for γ near 1 the factor{" "}
          <M>{"\\gamma/(1 - \\gamma)"}</M> is large.
        </p>
      </Proof>

      <Theorem title="in-place updates">
        <p>
          Updating the states one at a time in a fixed order, each update using the latest values (<C>in_place_eval</C>), also
          converges to <M>{"v_\\pi"}</M>, with the error after each sweep at most γ times the error before it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let e be the largest error at the start of a sweep. When state s is updated, every value it reads is either from the
          start of the sweep or already updated; suppose by induction that all of them have error at most e. The update is an
          average of <M>{"r + \\gamma v(s')"}</M>, and <M>{"v_\\pi(s)"}</M> is the same average with <M>{"v_\\pi(s')"}</M>, so the new error at s is
          at most γe. Hence every value has error at most e throughout the sweep, and at most γe at its end. In practice the fresh
          values carry information across the grid within a single sweep, and convergence is often noticeably faster; the order
          of the states matters.
        </p>
      </Proof>

      <Example title="a gridworld">
        <p>
          <C>grid_mdp</C> builds a grid of rows × cols cells numbered in reading order, with actions up, right, down and left, a
          constant reward per step, walls at the edges, and absorbing terminal cells with reward 0. <C>uniform_policy</C> picks the
          four actions with equal probability and <C>value_grid</C> lays values out as rows for display.
        </p>
        <Code>{GRID}</Code>
        <p>
          On the 4 × 4 grid with terminal corners 0 and 15, reward −1 and γ = 1, the random policy&apos;s values are −14 next to an
          exit, −18 one step in diagonally, and −22 in the other corners: the negative expected number of steps of a random walk
          to an exit. Stopping when the largest change is below <M>{"10^{-4}"}</M> takes 173 synchronous sweeps and 114 in place.
        </p>
      </Example>

      <Remark title="when γ = 1">
        <p>
          With γ = 1 the operator is not a contraction in the sup norm, and the stopping rule above says nothing. Evaluation
          still converges for policies that reach a terminal state with probability 1 from every state, as the random walk on the
          grid does, because the operator is then a contraction in a weighted norm. A policy that can loop for ever with
          negative rewards has values of −∞, and iterative evaluation diverges. Sampling-based versions of this update, which
          replace the sum over successors by one observed transition, are temporal-difference learning (l6.4.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "v1",
      rung: "check",
      prompt: (
        <p>
          On the 4 × 4 grid with terminal corners and reward −1 per step, evaluate the random policy with γ = 0.9. What is the
          value of cell 1, next to the top-left exit? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -5.2778, tolerance: 0.00006 },
    },
    {
      key: "stop",
      rung: "check",
      prompt: (
        <p>
          With γ = 0.9, the last sweep changed no value by more than 0.001. What bound does the stopping rule give on the error
          of the current values?
        </p>
      ),
      answer: { kind: "numeric", value: 0.009, tolerance: 0.000001 },
    },
    {
      key: "inplace",
      rung: "apply",
      prompt: <p>Why does in-place evaluation still converge when an update mixes old and new values?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every value it reads has error at most the sweep's starting error, and averaging then discounting by γ keeps the new error within γ times that",
          "Because the new values are always exact",
          "Because the order of updates does not affect any single value",
          "It converges only when γ = 1",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def iterative_eval(P, pi, gamma, tol):
    v, sweeps = [0.0] * len(P), 0
    while True:
        new = [sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items()) for s in range(len(v))]
        sweeps += 1
        delta = max(abs(x - y) for x, y in zip(new, v))
        v = new
        if delta < tol:
            return v, sweeps

def in_place_eval(P, pi, gamma, tol):
    v, sweeps = [0.0] * len(P), 0
    while True:
        delta = 0.0
        for s in range(len(v)):
            old = v[s]
            v[s] = sum(w * sum(p * (r + gamma * v[s2]) for p, s2, r in P[s][a]) for a, w in pi[s].items())
            delta = max(delta, abs(v[s] - old))
        sweeps += 1
        if delta < tol:
            return v, sweeps

def stop_error(delta, gamma):
    return gamma * delta / (1 - gamma)

P = {0: {0: [(1.0, 1, 1.0)]}, 1: {0: [(1.0, 1, 0.0)]}}; v, k = iterative_eval(P, {0: {0: 1}, 1: {0: 1}}, 0.5, 0.01); print(v, k, in_place_eval(P, {0: {0: 1}, 1: {0: 1}}, 0.5, 0.01))
P = {0: {0: [(1.0, 0, 1.0)]}}; print(iterative_eval(P, {0: {0: 1}}, 0.5, 0.2), in_place_eval(P, {0: {0: 1}}, 0.5, 0.2), round(stop_error(0.1, 0.9), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.0] 2 ([1.0, 0.0], 2)\n([1.875], 4) ([1.875], 4) 0.9",
          "[1.0, 0.0] 2 ([1.0, 0.0], 1)\n([1.875], 4) ([1.875], 4) 0.9",
          "[1.0, 0.0] 1 ([1.0, 0.0], 1)\n([1.875], 4) ([1.875], 4) 0.9",
          "[1.0, 0.0] 2 ([1.0, 0.0], 2)\n([1.75], 3) ([1.75], 3) 0.9",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def grid_mdp(rows, cols, terminals, step_reward):
    P = {}
    for s in range(rows * cols):
        r, c = divmod(s, cols)
        P[s] = {}
        for a, (dr, dc) in enumerate(MOVES):
            if s in terminals:
                P[s][a] = [(1.0, s, 0.0)]
                continue
            r2, c2 = r + dr, c + dc
            if not (0 <= r2 < rows and 0 <= c2 < cols):
                r2, c2 = r, c
            P[s][a] = [(1.0, r2 * cols + c2, step_reward)]
    return P

def uniform_policy(P):
    return {s: {a: 1 / len(P[s]) for a in P[s]} for s in P}

def value_grid(v, cols, nd=1):
    return [[round(x, nd) for x in v[i:i + cols]] for i in range(0, len(v), cols)]

P = grid_mdp(1, 3, {0}, -1); print(P[1], P[0][3], uniform_policy(grid_mdp(1, 2, set(), 0))[1])
print(value_grid([1.26, -2, 3.5, 0], 2), value_grid([1.26, -2, 3.5], 3, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: [(1.0, 1, -1)], 1: [(1.0, 2, -1)], 2: [(1.0, 1, -1)], 3: [(1.0, 0, -1)]} [(1.0, 0, 0.0)] {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25}\n[[1.3, -2], [3.5, 0]] [[1.0, -2, 4.0]]",
          "{0: [(1.0, 0, -1)], 1: [(1.0, 2, -1)], 2: [(1.0, 1, -1)], 3: [(1.0, 0, -1)]} [(1.0, 0, 0.0)] {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25}\n[[1.3, -2], [3.5, 0]] [[1.0, -2, 4.0]]",
          "{0: [(1.0, 1, -1)], 1: [(1.0, 2, -1)], 2: [(1.0, 1, -1)], 3: [(1.0, 0, -1)]} [(1.0, 1, -1)] {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25}\n[[1.3, -2], [3.5, 0]] [[1.0, -2, 4.0]]",
          "{0: [(1.0, 1, -1)], 1: [(1.0, 2, -1)], 2: [(1.0, 1, -1)], 3: [(1.0, 0, -1)]} [(1.0, 0, 0.0)] {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25}\n[[1.3, -2], [3.5, 0]] [[1.0, -2, 3.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>iterative_eval(P, pi, gamma, tol)</C>, synchronous sweeps from zero until the largest change in a sweep is below
          tol, returning (values, sweeps); <C>in_place_eval(P, pi, gamma, tol)</C>, the same with in-place updates in the order 0, …,
          n − 1; and <C>stop_error(delta, gamma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def iterative_eval(P, pi, gamma, tol):
    return [0.0] * len(P), 0

def in_place_eval(P, pi, gamma, tol):
    return [0.0] * len(P), 0

def stop_error(delta, gamma):
    return 0.0
`,
        solution: EVAL,
        tests: [
          { name: "sync", code: `P = {0: {0: [(1.0, 0, 1.0)]}}; v, k = iterative_eval(P, {0: {0: 1}}, 0.5, 0.2); assert v == [1.875] and k == 4
P = {0: {0: [(1.0, 1, 1.0)]}, 1: {0: [(1.0, 1, 0.0)]}}; assert iterative_eval(P, {0: {0: 1}, 1: {0: 1}}, 0.5, 0.01) == ([1.0, 0.0], 2)
assert abs(stop_error(0.001, 0.9) - 0.009) < 1e-15 and stop_error(1, 0.5) == 1` },
          { name: "grid", code: `P = {}
for s in range(16):
    r, c = divmod(s, 4); P[s] = {}
    for a, (dr, dc) in enumerate([(-1, 0), (0, 1), (1, 0), (0, -1)]):
        r2, c2 = (r + dr, c + dc) if 0 <= r + dr < 4 and 0 <= c + dc < 4 else (r, c)
        P[s][a] = [(1.0, s, 0.0)] if s in (0, 15) else [(1.0, r2 * 4 + c2, -1.0)]
pi = {s: {a: 0.25 for a in range(4)} for s in range(16)}
v, k = iterative_eval(P, pi, 1.0, 1e-4); w, j = in_place_eval(P, pi, 1.0, 1e-4)
assert abs(v[1] + 14) < 1e-2 and abs(v[3] + 22) < 1e-2 and abs(w[5] + 18) < 1e-2 and j < k and k == 173` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grid_mdp(rows, cols, terminals, step_reward)</C> as described, with actions 0 to 3 being up, right, down, left;{" "}
          <C>uniform_policy(P)</C>; and <C>value_grid(v, cols, nd=1)</C>, the rows of v rounded to nd decimals.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `MOVES = [(-1, 0), (0, 1), (1, 0), (0, -1)]

def grid_mdp(rows, cols, terminals, step_reward):
    return {}

def uniform_policy(P):
    return {}

def value_grid(v, cols, nd=1):
    return []
`,
        solution: GRID,
        tests: [
          { name: "grid", code: `P = grid_mdp(1, 3, {0}, -1); assert P[1] == {0: [(1.0, 1, -1)], 1: [(1.0, 2, -1)], 2: [(1.0, 1, -1)], 3: [(1.0, 0, -1)]} and P[0][3] == [(1.0, 0, 0.0)]
P = grid_mdp(2, 2, set(), 0.5); assert P[3][0] == [(1.0, 1, 0.5)] and P[3][1] == [(1.0, 3, 0.5)] and P[0][2] == [(1.0, 2, 0.5)] and len(P) == 4` },
          { name: "policy", code: `assert uniform_policy(grid_mdp(1, 2, set(), 0))[1] == {0: 0.25, 1: 0.25, 2: 0.25, 3: 0.25} and uniform_policy({0: {5: [], 7: []}}) == {0: {5: 0.5, 7: 0.5}}
assert value_grid([1.26, -2, 3.5, 0], 2) == [[1.3, -2], [3.5, 0]] and value_grid([1, 2, 3], 3, 0) == [[1, 2, 3]] and value_grid([0.123, 0.456], 1, 2) == [[0.12], [0.46]]` },
        ],
      },
    },
    {
      key: "corner",
      rung: "stretch",
      prompt: (
        <p>
          On the same grid with γ = 0.9, what is the random policy&apos;s value of cell 3, the top-right corner? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -7.6505, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Evaluating a policy is the first half of improving it. The next lesson (l6.3.2) alternates evaluation with a greedy step
        that switches each state to the action with the best one-step lookahead, and proves that this never makes the policy
        worse and stops at an optimal one.
      </p>
    </>
  ),
};
