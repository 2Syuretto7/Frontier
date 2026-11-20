import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LambdaReturnViz } from "@/components/viz/LambdaReturnViz";
import type { LessonContent } from "@/lib/types";

const FWD = `def n_step_return(rewards, values, t, n, gamma):
    T = len(rewards)
    end = min(t + n, T)
    g = sum(gamma ** (k - t) * rewards[k] for k in range(t, end))
    if end < T:
        g += gamma ** n * values[end]
    return g

def lambda_return(rewards, values, t, lam, gamma):
    T = len(rewards)
    g = sum((1 - lam) * lam ** (n - 1) * n_step_return(rewards, values, t, n, gamma) for n in range(1, T - t))
    return g + lam ** (T - t - 1) * n_step_return(rewards, values, t, T - t, gamma)

def forward_errors(rewards, values, lam, gamma):
    return [lambda_return(rewards, values, t, lam, gamma) - values[t] for t in range(len(rewards))]`;

const BWD = `def eligibility(states, gamma, lam):
    e, out = {}, []
    for s in states:
        e = {k: gamma * lam * v for k, v in e.items()}
        e[s] = e.get(s, 0.0) + 1
        out.append(dict(e))
    return out

def offline_backward(states, rewards, V, gamma, lam):
    inc, T = {}, len(states)
    for t, e in enumerate(eligibility(states, gamma, lam)):
        nxt = V[states[t + 1]] if t + 1 < T else 0.0
        delta = rewards[t] + gamma * nxt - V[states[t]]
        for s, x in e.items():
            inc[s] = inc.get(s, 0.0) + delta * x
    return inc

def td_lambda_episode(V, states, rewards, alpha, gamma, lam):
    e = {}
    for t, s in enumerate(states):
        nxt = V[states[t + 1]] if t + 1 < len(states) else 0.0
        delta = rewards[t] + gamma * nxt - V[s]
        e = {k: gamma * lam * v for k, v in e.items()}
        e[s] = e.get(s, 0.0) + 1
        for k, x in e.items():
            V[k] += alpha * delta * x
    return V`;

export const lesson: LessonContent = {
  id: "l6.4.3",
  minutes: 60,
  links: {
    requires: ["l6.4.2"],
    revisits: ["l6.4.1", "l6.2.2"],
    foreshadows: ["l6.6.4", "l6.4.4"],
  },

  puzzle: (
    <>
      <p>
        TD(0) updates from one real reward and an estimate; Monte Carlo from all the real rewards and no estimate. In between lie
        targets that use two, three or ten real rewards before bootstrapping. Which lookahead is best depends on the problem and
        on how good the estimates are. Can all of them be used at once, and can an agent do so while still updating after every
        step, without waiting to see the future?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Average the n-step targets with geometrically decaying weights: that is the λ-return, with λ sliding from TD(0) to Monte
        Carlo. Looked at forwards, it needs future rewards. Looked at backwards, each TD error should be credited to recently
        visited states, more to the most recent: keep a decaying trace of each state&apos;s recent visits and update every state
        in proportion to its trace. Over an episode the two views make exactly the same total change.
      </p>
      <LambdaReturnViz />
    </>
  ),

  theory: (
    <>
      <Definition title="n-step returns">
        <p>For an episode ending at time T, the <em>n-step return</em> from t is</p>
        <MD>{"G_t^{(n)} = R_{t+1} + \\gamma R_{t+2} + \\dots + \\gamma^{n-1}R_{t+n} + \\gamma^nV(S_{t+n}),"}</MD>
        <p>
          or the full return <M>{"G_t"}</M> if <M>{"t + n \\ge T"}</M>. In <C>n_step_return</C>, <C>rewards[k]</C> is{" "}
          <M>{"R_{k+1}"}</M> and <C>values[k]</C> is <M>{"V(S_k)"}</M>.
        </p>
      </Definition>

      <Theorem title="n-step error reduction">
        <p>
          <M>{"\\max_s\\bigl|\\mathbb{E}_\\pi[G_t^{(n)} \\mid S_t = s] - v_\\pi(s)\\bigr| \\le \\gamma^n\\max_s|V(s) - v_\\pi(s)|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The expected n-step return is <M>{"((T^\\pi)^nV)(s)"}</M>, and <M>{"T^\\pi"}</M> is a γ-contraction with fixed point{" "}
          <M>{"v_\\pi"}</M> (l6.2.4). Longer lookahead shrinks the bias from a wrong V, but adds the variance of more rewards.
        </p>
      </Proof>

      <Definition title="the λ-return">
        <p>For 0 ≤ λ ≤ 1, the <em>λ-return</em> averages all the n-step returns:</p>
        <MD>{"G_t^\\lambda = (1 - \\lambda)\\sum_{n=1}^{T-t-1}\\lambda^{n-1}G_t^{(n)} + \\lambda^{T-t-1}G_t."}</MD>
        <p>
          The weights <M>{"(1 - \\lambda)\\lambda^{n-1}"}</M> and the final <M>{"\\lambda^{T-t-1}"}</M> sum to 1. λ = 0 gives the TD(0)
          target and λ = 1 the Monte Carlo return (<C>lambda_return</C>; <C>forward_errors</C> lists{" "}
          <M>{"G_t^\\lambda - V(S_t)"}</M>).
        </p>
        <Code>{FWD}</Code>
      </Definition>

      <Theorem title="the λ-return error is a sum of TD errors">
        <p>
          With V fixed and <M>{"\\delta_k = R_{k+1} + \\gamma V(S_{k+1}) - V(S_k)"}</M> (and <M>{"V(S_T) = 0"}</M>),
        </p>
        <MD>{"G_t^\\lambda - V(S_t) = \\sum_{k=t}^{T-1}(\\gamma\\lambda)^{k-t}\\delta_k."}</MD>
      </Theorem>
      <Proof>
        <p>
          Each n-step return with n ≥ 2 satisfies <M>{"G_t^{(n)} = R_{t+1} + \\gamma G_{t+1}^{(n-1)}"}</M>, and{" "}
          <M>{"G_t^{(1)} = R_{t+1} + \\gamma V(S_{t+1})"}</M>. Substituting into the definition and collecting the weights gives the
          recursion <M>{"G_t^\\lambda = R_{t+1} + \\gamma\\bigl((1 - \\lambda)V(S_{t+1}) + \\lambda G_{t+1}^\\lambda\\bigr)"}</M>, with{" "}
          <M>{"G_{T-1}^\\lambda = R_T"}</M>. Subtract <M>{"V(S_t)"}</M>:{" "}
          <M>{"G_t^\\lambda - V(S_t) = \\delta_t + \\gamma\\lambda\\bigl(G_{t+1}^\\lambda - V(S_{t+1})\\bigr)"}</M>, and unroll. With λ = 1
          this is the identity of l6.4.2.
        </p>
      </Proof>

      <Definition title="eligibility traces and TD(λ)">
        <p>
          The <em>accumulating trace</em> of state s at time t is{" "}
          <M>{"e_t(s) = \\gamma\\lambda e_{t-1}(s) + \\mathbf{1}[S_t = s]"}</M>, with <M>{"e_{-1} = 0"}</M> (<C>eligibility</C>).
          <em> TD(λ)</em> computes <M>{"\\delta_t"}</M> at each step and updates every state:{" "}
          <M>{"V(s) \\leftarrow V(s) + \\alpha\\delta_te_t(s)"}</M> (<C>td_lambda_episode</C>). It needs only the current transition and
          the traces, so it runs online and in continuing tasks.
        </p>
        <Code>{BWD}</Code>
      </Definition>

      <Theorem title="forward and backward views agree">
        <p>
          If V is held fixed during an episode, then for every state s the total backward-view update equals the total forward-view
          update: <M>{"\\sum_t\\delta_te_t(s) = \\sum_{t:S_t = s}\\bigl(G_t^\\lambda - V(S_t)\\bigr)"}</M> (<C>offline_backward</C> computes
          the left side).
        </p>
      </Theorem>
      <Proof>
        <p>
          Unrolling the trace, <M>{"e_k(s) = \\sum_{t \\le k,\\,S_t = s}(\\gamma\\lambda)^{k-t}"}</M>. So{" "}
          <M>{"\\sum_k\\delta_ke_k(s) = \\sum_{t:S_t = s}\\sum_{k \\ge t}(\\gamma\\lambda)^{k-t}\\delta_k"}</M>, exchanging the order of
          summation, and the inner sum is <M>{"G_t^\\lambda - V(S_t)"}</M> by the previous theorem.
        </p>
      </Proof>

      <Remark title="online versus offline">
        <p>
          When V changes during the episode, as in online TD(λ), the two views differ slightly; &ldquo;true online&rdquo; TD(λ) (van
          Seijen and Sutton, 2014) modifies the trace so that the online updates match an online forward view exactly. In the
          picture intermediate λ beats both extremes, which is typical: λ trades the bias of bootstrapping against the variance
          of long returns. The same weighted sum of TD errors, applied to advantages instead of values, is generalised advantage
          estimation (l6.6.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "w",
      rung: "check",
      prompt: <p>With λ = 0.5 and a long episode, what weight does the λ-return give to the 3-step return?</p>,
      answer: { kind: "numeric", value: 0.125, tolerance: 0.0001 },
    },
    {
      key: "lret",
      rung: "check",
      prompt: (
        <p>
          An episode visits A, B, C, B, D with rewards 0, 1, 0, 0, 2 after each step, and V(A) = 0.5, V(B) = 0.2, V(C) = −0.4, V(D) = 1.
          With λ = 0.6 and γ = 0.9, what is the λ-return from the first step? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.782, tolerance: 0.00006 },
    },
    {
      key: "online",
      rung: "apply",
      prompt: <p>Why is the backward view, with eligibility traces, the one used in practice?</p>,
      answer: {
        kind: "choice",
        options: [
          "It updates after every step using only the current TD error and the traces, whereas the forward view needs rewards that have not happened yet",
          "It gives a different and more accurate target than the λ-return",
          "It needs no step size",
          "It avoids bootstrapping entirely",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def n_step_return(rewards, values, t, n, gamma):
    T = len(rewards)
    end = min(t + n, T)
    g = sum(gamma ** (k - t) * rewards[k] for k in range(t, end))
    if end < T:
        g += gamma ** n * values[end]
    return g

def lambda_return(rewards, values, t, lam, gamma):
    T = len(rewards)
    g = sum((1 - lam) * lam ** (n - 1) * n_step_return(rewards, values, t, n, gamma) for n in range(1, T - t))
    return g + lam ** (T - t - 1) * n_step_return(rewards, values, t, T - t, gamma)

def forward_errors(rewards, values, lam, gamma):
    return [lambda_return(rewards, values, t, lam, gamma) - values[t] for t in range(len(rewards))]

r, v = [0, 0, 4], [1, 2, 3]; print(n_step_return(r, v, 0, 1, 1.0), n_step_return(r, v, 0, 2, 0.5), n_step_return(r, v, 1, 5, 0.5))
print(lambda_return(r, v, 0, 0.0, 1.0), lambda_return(r, v, 0, 1.0, 1.0), lambda_return(r, v, 0, 0.5, 1.0), forward_errors(r, v, 0.5, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.0 0.75 2.0\n2.0 4.0 2.75 [1.75, 1.5, 1.0]",
          "2.0 0.75 2.0\n2.0 4.0 3.0 [2.0, 1.5, 1.0]",
          "2.0 1.5 2.0\n2.0 4.0 2.75 [1.75, 1.5, 1.0]",
          "2.0 0.75 3.5\n2.0 4.0 2.75 [1.75, 1.5, 1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def eligibility(states, gamma, lam):
    e, out = {}, []
    for s in states:
        e = {k: gamma * lam * v for k, v in e.items()}
        e[s] = e.get(s, 0.0) + 1
        out.append(dict(e))
    return out

def offline_backward(states, rewards, V, gamma, lam):
    inc, T = {}, len(states)
    for t, e in enumerate(eligibility(states, gamma, lam)):
        nxt = V[states[t + 1]] if t + 1 < T else 0.0
        delta = rewards[t] + gamma * nxt - V[states[t]]
        for s, x in e.items():
            inc[s] = inc.get(s, 0.0) + delta * x
    return inc

def td_lambda_episode(V, states, rewards, alpha, gamma, lam):
    e = {}
    for t, s in enumerate(states):
        nxt = V[states[t + 1]] if t + 1 < len(states) else 0.0
        delta = rewards[t] + gamma * nxt - V[s]
        e = {k: gamma * lam * v for k, v in e.items()}
        e[s] = e.get(s, 0.0) + 1
        for k, x in e.items():
            V[k] += alpha * delta * x
    return V

print(eligibility(["a", "b", "a"], 1.0, 0.5), eligibility(["a", "b"], 0.5, 0.0))
print(offline_backward(["x", "y"], [0, 1], {"x": 0.0, "y": 0.0}, 1.0, 0.5), td_lambda_episode({"x": 0.0, "y": 0.0}, ["x", "y"], [0, 1], 0.5, 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[{'a': 1.0}, {'a': 0.5, 'b': 1.0}, {'a': 1.25, 'b': 0.5}] [{'a': 1.0}, {'a': 0.0, 'b': 1.0}]\n{'x': 0.5, 'y': 1.0} {'x': 0.5, 'y': 0.5}",
          "[{'a': 1.0}, {'a': 0.5, 'b': 1.0}, {'a': 1.0, 'b': 0.5}] [{'a': 1.0}, {'a': 0.0, 'b': 1.0}]\n{'x': 0.5, 'y': 1.0} {'x': 0.5, 'y': 0.5}",
          "[{'a': 1.0}, {'a': 0.5, 'b': 1.0}, {'a': 1.25, 'b': 0.5}] [{'a': 1.0}, {'a': 0.0, 'b': 1.0}]\n{'x': 1.0, 'y': 1.0} {'x': 0.5, 'y': 0.5}",
          "[{'a': 1.0}, {'a': 0.5, 'b': 1.0}, {'a': 1.25, 'b': 0.5}] [{'a': 1.0}, {'a': 0.0, 'b': 1.0}]\n{'x': 0.5, 'y': 1.0} {'x': 0.0, 'y': 0.5}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With <C>rewards[k]</C> = <M>{"R_{k+1}"}</M>, <C>values[k]</C> = <M>{"V(S_k)"}</M> and T = <C>len(rewards)</C>, write{" "}
          <C>n_step_return(rewards, values, t, n, gamma)</C>, <C>lambda_return(rewards, values, t, lam, gamma)</C> and{" "}
          <C>forward_errors(rewards, values, lam, gamma)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def n_step_return(rewards, values, t, n, gamma):
    return 0.0

def lambda_return(rewards, values, t, lam, gamma):
    return 0.0

def forward_errors(rewards, values, lam, gamma):
    return []
`,
        solution: FWD,
        tests: [
          { name: "nstep", code: `r, v = [0, 0, 4], [1, 2, 3]
assert n_step_return(r, v, 0, 1, 1.0) == 2 and n_step_return(r, v, 0, 2, 0.5) == 0.75 and n_step_return(r, v, 1, 5, 0.5) == 2 and n_step_return(r, v, 0, 3, 0.5) == 1
assert lambda_return(r, v, 0, 0.0, 1.0) == 2 and lambda_return(r, v, 0, 1.0, 1.0) == 4 and lambda_return(r, v, 2, 0.3, 0.9) == 4` },
          { name: "forward", code: `assert forward_errors([0, 0, 4], [1, 2, 3], 0.5, 1.0) == [1.75, 1.5, 1.0]
rw = [0, 1, 0, 0, 2]; vals = [0.5, 0.2, -0.4, 0.2, 1.0]
assert abs(lambda_return(rw, vals, 0, 0.6, 0.9) - 0.78198336) < 1e-9 and abs(forward_errors(rw, vals, 0.6, 0.9)[2] - 1.2496) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With states <M>{"S_0, \\dots, S_{T-1}"}</M> listed in <C>states</C> and the episode ending after the last, write{" "}
          <C>eligibility(states, gamma, lam)</C>, the list of trace dictionaries after each step;{" "}
          <C>offline_backward(states, rewards, V, gamma, lam)</C>, the dictionary of total increments{" "}
          <M>{"\\sum_t\\delta_te_t(s)"}</M> for fixed V; and <C>td_lambda_episode(V, states, rewards, alpha, gamma, lam)</C>, online
          TD(λ) that computes each δ before updating the traces and then updates every traced state.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def eligibility(states, gamma, lam):
    return []

def offline_backward(states, rewards, V, gamma, lam):
    return {}

def td_lambda_episode(V, states, rewards, alpha, gamma, lam):
    return V
`,
        solution: BWD,
        tests: [
          { name: "traces", code: `assert eligibility(["a", "b", "a"], 1.0, 0.5) == [{"a": 1.0}, {"a": 0.5, "b": 1.0}, {"a": 1.25, "b": 0.5}] and eligibility([], 1, 1) == []
st = ["A", "B", "C", "B", "D"]; rw = [0, 1, 0, 0, 2]; V = {"A": 0.5, "B": 0.2, "C": -0.4, "D": 1.0}
inc = offline_backward(st, rw, V, 0.9, 0.6); assert abs(inc["A"] - 0.281983) < 1e-6 and abs(inc["D"] - 1.0) < 1e-12 and abs(inc["C"] - 1.2496) < 1e-12` },
          { name: "online", code: `assert td_lambda_episode({"x": 0.0, "y": 0.0}, ["x", "y"], [0, 1], 0.5, 1.0, 1.0) == {"x": 0.5, "y": 0.5}
assert td_lambda_episode({"x": 0.0, "y": 0.0}, ["x", "y"], [0, 1], 0.5, 1.0, 0.0) == {"x": 0.0, "y": 0.5}
V = td_lambda_episode({"x": 1.0}, ["x", "x"], [0, 0], 1.0, 1.0, 1.0); assert V == {"x": -1.0}` },
        ],
      },
    },
    {
      key: "inc",
      rung: "stretch",
      prompt: (
        <p>
          For the episode of the second check, with V held fixed, λ = 0.6 and γ = 0.9, what is the total TD(λ) update to V(B)
          before multiplying by α, that is, <M>{"\\sum_t\\delta_te_t(B)"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.3548, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the agent has only predicted values for a fixed policy. The next lesson (l6.4.4) turns TD learning into control:
        learn action values with the TD update, act ε-greedily on them, and let the policy improve as the estimates do.
      </p>
    </>
  ),
};
