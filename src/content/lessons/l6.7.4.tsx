import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KlTiltViz } from "@/components/viz/KlTiltViz";
import type { LessonContent } from "@/lib/types";

const TILT = `import math

def tilt(ref, rewards, beta):
    m = max(r for p, r in zip(ref, rewards) if p > 0)
    w = [p * math.exp((r - m) / beta) if p > 0 else 0.0 for p, r in zip(ref, rewards)]
    return [x / sum(w) for x in w]

def kl_objective(pi, ref, rewards, beta):
    gain = sum(p * r for p, r in zip(pi, rewards))
    return gain - beta * sum(p * math.log(p / q) for p, q in zip(pi, ref) if p > 0)

def soft_value(ref, rewards, beta):
    m = max(r for p, r in zip(ref, rewards) if p > 0)
    return m + beta * math.log(sum(p * math.exp((r - m) / beta) for p, r in zip(ref, rewards) if p > 0))`;

const SOFT = `import math

def soft_backup(nxt, R, ref, V, beta, gamma):
    out = []
    for s in range(len(R)):
        q = [R[s][a] + (0.0 if nxt[s][a] is None else gamma * V[nxt[s][a]]) for a in range(len(R[s]))]
        m = max(q)
        out.append(m + beta * math.log(sum(p * math.exp((x - m) / beta) for p, x in zip(ref[s], q))))
    return out

def soft_vi(nxt, R, ref, beta, gamma, iters):
    V = [0.0] * len(R)
    for _ in range(iters):
        V = soft_backup(nxt, R, ref, V, beta, gamma)
    return V

def implied_reward(pi, ref, beta):
    return [beta * math.log(p / q) for p, q in zip(pi, ref)]`;

export const lesson: LessonContent = {
  id: "l6.7.4",
  minutes: 50,
  links: {
    requires: ["l6.7.3", "m12.2.1"],
    revisits: ["l6.3.3", "l6.6.5"],
    foreshadows: ["l9.4.2", "l9.5.1"],
  },

  puzzle: (
    <>
      <p>
        A language model already writes fluent text. Fine-tuning it to maximise a learned reward tends to find odd outputs
        that the reward model scores highly but people do not like, drifting far from the fluent model it started as. A common
        fix is to subtract from the reward a multiple of the divergence from the original model. What policy does that
        objective actually prefer, and how does the penalty&apos;s weight shape it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Maximising reward alone puts all probability on the best action. Penalising divergence from a reference policy pulls
        back towards it. The two forces balance in a policy with a simple form: take the reference and multiply each
        action&apos;s probability by the exponential of its reward divided by the penalty weight. Actions the reference never takes
        stay impossible, and a weak penalty approaches the greedy choice among the actions the reference allows.
      </p>
      <KlTiltViz />
    </>
  ),

  theory: (
    <>
      <Definition title="KL-regularised objective">
        <p>
          Given a reference policy <M>{"\\pi_{\\text{ref}}"}</M>, a reward r and a weight β &gt; 0, in a single decision (as when a whole
          response is scored at once) the objective is
        </p>
        <MD>{"J_\\beta(\\pi) = \\mathbb{E}_{a \\sim \\pi}[r(a)] - \\beta\\,\\mathrm{KL}(\\pi \\,\\|\\, \\pi_{\\text{ref}})"}</MD>
        <p>(<C>kl_objective</C>), with the KL divergence of m12.2.1.</p>
      </Definition>

      <Theorem title="the optimal policy is an exponential tilt">
        <p>
          The unique maximiser is <M>{"\\pi^*(a) = \\pi_{\\text{ref}}(a)e^{r(a)/\\beta}/Z"}</M> with{" "}
          <M>{"Z = \\sum_a\\pi_{\\text{ref}}(a)e^{r(a)/\\beta}"}</M> (<C>tilt</C>), and the optimal value is <M>{"\\beta\\log Z"}</M> (<C>soft_value</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          For any π, with <M>{"r(a) = \\beta\\log(\\pi^*(a)Z/\\pi_{\\text{ref}}(a))"}</M>,
        </p>
        <MD>{"J_\\beta(\\pi) = \\sum_a\\pi(a)\\Bigl(r(a) - \\beta\\log\\frac{\\pi(a)}{\\pi_{\\text{ref}}(a)}\\Bigr) = \\beta\\log Z - \\beta\\sum_a\\pi(a)\\log\\frac{\\pi(a)}{\\pi^*(a)} = \\beta\\log Z - \\beta\\,\\mathrm{KL}(\\pi \\,\\|\\, \\pi^*)."}</MD>
        <p>
          The KL divergence is non-negative and zero only at π = π*, so π* is the unique maximiser and the maximum is{" "}
          <M>{"\\beta\\log Z"}</M>. The code subtracts the largest reward among actions the reference allows before exponentiating, which leaves π* unchanged and
          avoids overflow for small β.
        </p>
        <Code>{TILT}</Code>
      </Proof>

      <Remark title="the two limits">
        <p>
          As β → ∞ the tilt vanishes and π* → <M>{"\\pi_{\\text{ref}}"}</M>. As β → 0, π* concentrates on the actions of highest reward
          among those with <M>{"\\pi_{\\text{ref}}(a) > 0"}</M>, and <M>{"\\beta\\log Z"}</M> tends to that maximum. An action the reference never
          takes can never be chosen, however large its reward: the reverse KL <M>{"\\mathrm{KL}(\\pi \\,\\|\\, \\pi_{\\text{ref}})"}</M> is infinite
          for any π that puts mass where the reference has none.
        </p>
      </Remark>

      <Theorem title="the reward is determined by the optimal policy">
        <p>
          Inverting the tilt, <M>{"r(a) = \\beta\\log\\frac{\\pi^*(a)}{\\pi_{\\text{ref}}(a)} + \\beta\\log Z"}</M>: up to a constant that is the same
          for all actions, the reward equals β times the log ratio of the optimal policy to the reference (<C>implied_reward</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Take logarithms of <M>{"\\pi^*(a)Z = \\pi_{\\text{ref}}(a)e^{r(a)/\\beta}"}</M> and multiply by β. Since only differences of rewards
          between actions affect which policy is optimal, the constant is irrelevant. This identity is the starting point of
          direct preference optimisation (l9.5.1), which fits the policy directly to preference data through it.
        </p>
      </Proof>

      <Definition title="sequential decisions: soft value iteration">
        <p>
          When the penalty is paid at every step, the objective is{" "}
          <M>{"\\mathbb{E}_\\pi\\bigl[\\sum_t\\gamma^t\\bigl(R_{t+1} - \\beta\\log\\frac{\\pi(A_t \\mid S_t)}{\\pi_{\\text{ref}}(A_t \\mid S_t)}\\bigr)\\bigr]"}</M>. The optimal
          values satisfy the <em>soft Bellman equations</em>
        </p>
        <MD>{"Q^*(s, a) = r(s, a) + \\gamma\\,\\mathbb{E}[V^*(S') \\mid s, a], \\qquad V^*(s) = \\beta\\log\\sum_a\\pi_{\\text{ref}}(a \\mid s)e^{Q^*(s, a)/\\beta},"}</MD>
        <p>
          and <M>{"\\pi^*(a \\mid s) \\propto \\pi_{\\text{ref}}(a \\mid s)e^{Q^*(s, a)/\\beta}"}</M>. Iterating the backup (<C>soft_backup</C>,{" "}
          <C>soft_vi</C>, for deterministic transitions <C>nxt[s][a]</C> with None at the end) converges to <M>{"V^*"}</M>, as value
          iteration does (l6.3.3), because a log-sum-exp moves by at most as much as its inputs do, so the backup is a
          γ-contraction. With a uniform reference this is maximum-entropy reinforcement learning, the basis of soft
          actor-critic (l6.6.5).
        </p>
        <Code>{SOFT}</Code>
      </Definition>

      <Remark title="the KL penalty in fine-tuning">
        <p>
          In RLHF the policy is a language model, the reference is the model before fine-tuning, and the reward model scores
          whole responses. The penalty is usually applied per token as{" "}
          <M>{"-\\beta\\log(\\pi(\\text{token})/\\pi_{\\text{ref}}(\\text{token}))"}</M>, added to the reward and optimised with PPO
          (l6.7.3). Its expectation over the policy&apos;s own samples is exactly β times the KL divergence of the response
          distributions. The weight β controls how far the model may move: too small and it exploits the reward model,
          too large and it barely improves (l9.4.2).
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
          The reference picks two actions with probability 0.5 each, their rewards are ln 3 and 0, and β = 1. What is the optimal
          value <M>{"\\beta\\log Z"}</M>? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6931, tolerance: 0.0005 },
    },
    {
      key: "tok",
      rung: "check",
      prompt: (
        <p>
          The policy gives a token probability 0.5 and the reference gives it 0.25. With β = 0.1, how large is the per-token KL
          penalty subtracted from the reward? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0693, tolerance: 0.0005 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: (
        <p>
          An action has the highest reward but the reference policy gives it probability 0. What probability does the
          KL-regularised optimal policy give it?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "0, for every β, since the tilt multiplies the reference probability",
          "1 when β is small enough",
          "A probability proportional to its reward",
          "1/2, since the penalty and the reward balance",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def tilt(ref, rewards, beta):
    m = max(r for p, r in zip(ref, rewards) if p > 0)
    w = [p * math.exp((r - m) / beta) if p > 0 else 0.0 for p, r in zip(ref, rewards)]
    return [x / sum(w) for x in w]

def kl_objective(pi, ref, rewards, beta):
    gain = sum(p * r for p, r in zip(pi, rewards))
    return gain - beta * sum(p * math.log(p / q) for p, q in zip(pi, ref) if p > 0)

def soft_value(ref, rewards, beta):
    m = max(r for p, r in zip(ref, rewards) if p > 0)
    return m + beta * math.log(sum(p * math.exp((r - m) / beta) for p, r in zip(ref, rewards) if p > 0))

b = 1 / math.log(3); pi = tilt([0.5, 0.5], [1.0, 0.0], b); print([round(p, 4) for p in pi], round(soft_value([0.5, 0.5], [1.0, 0.0], b), 4))
print(round(kl_objective(pi, [0.5, 0.5], [1.0, 0.0], b), 4), kl_objective([0.5, 0.5], [0.5, 0.5], [1.0, 0.0], b), [round(p, 4) for p in tilt([0.5, 0.5], [1.0, 0.0], 1e-3)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.75, 0.25] 0.6309\n0.6309 0.5 [1.0, 0.0]",
          "[0.75, 0.25] 0.6309\n0.5 0.6309 [1.0, 0.0]",
          "[0.6667, 0.3333] 0.6309\n0.6309 0.5 [1.0, 0.0]",
          "[0.75, 0.25] 0.75\n0.6309 0.5 [0.5, 0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def soft_backup(nxt, R, ref, V, beta, gamma):
    out = []
    for s in range(len(R)):
        q = [R[s][a] + (0.0 if nxt[s][a] is None else gamma * V[nxt[s][a]]) for a in range(len(R[s]))]
        m = max(q)
        out.append(m + beta * math.log(sum(p * math.exp((x - m) / beta) for p, x in zip(ref[s], q))))
    return out

def soft_vi(nxt, R, ref, beta, gamma, iters):
    V = [0.0] * len(R)
    for _ in range(iters):
        V = soft_backup(nxt, R, ref, V, beta, gamma)
    return V

def implied_reward(pi, ref, beta):
    return [beta * math.log(p / q) for p, q in zip(pi, ref)]

nxt, R, ref = [[1, None], [None, None]], [[0.0, 1.0], [2.0, 0.0]], [[0.5, 0.5], [0.5, 0.5]]; b = 1 / math.log(2); print([round(v, 4) for v in soft_vi(nxt, R, ref, b, 1.0, 1)], [round(v, 4) for v in soft_vi(nxt, R, ref, b, 1.0, 5)])
print([round(v, 2) for v in soft_vi(nxt, R, ref, 1e-3, 1.0, 5)], [round(x, 4) for x in implied_reward([0.75, 0.25], [0.5, 0.5], 1.0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.585, 1.3219] [1.1699, 1.3219]\n[2.0, 2.0] [0.4055, -0.6931]",
          "[0.585, 1.3219] [1.3219, 1.3219]\n[2.0, 2.0] [0.4055, -0.6931]",
          "[1.0, 2.0] [2.0, 2.0]\n[2.0, 2.0] [0.4055, -0.6931]",
          "[0.585, 1.3219] [1.1699, 1.3219]\n[1.0, 2.0] [0.5, -0.5]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tilt(ref, rewards, beta)</C>, <C>kl_objective(pi, ref, rewards, beta)</C> (skip zero entries of π in the divergence)
          and <C>soft_value(ref, rewards, beta)</C>; both <C>tilt</C> and <C>soft_value</C> must work for β as small as 0.001 and for actions the reference never takes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def tilt(ref, rewards, beta):
    return list(ref)

def kl_objective(pi, ref, rewards, beta):
    return 0.0

def soft_value(ref, rewards, beta):
    return 0.0
`,
        solution: TILT,
        tests: [
          { name: "tilt", code: `close = lambda u, v, e=1e-9: all(abs(a - b) < e for a, b in zip(u, v))
assert close(tilt([0.5, 0.5], [1.0, 0.0], 1 / math.log(3)), [0.75, 0.25]) and close(tilt([0.2, 0.8], [5.0, 5.0], 0.3), [0.2, 0.8])
assert close(tilt([0.5, 0.0, 0.5], [0.0, 9.0, 1.0], 0.001), [0.0, 0.0, 1.0]) and close(tilt([0.3, 0.7], [0.0, 1.0], 1e6), [0.3, 0.7], 1e-6)
assert abs(soft_value([0.5, 0.5], [math.log(3), 0.0], 1.0) - math.log(2)) < 1e-12 and abs(soft_value([0.5, 0.5], [2.0, 1.0], 0.001) - 2.0) < 0.001` },
          { name: "objective", code: `ref, r, b = [0.5, 0.3, 0.2], [1.0, -0.5, 2.0], 0.7
best = kl_objective(tilt(ref, r, b), ref, r, b)
assert abs(best - soft_value(ref, r, b)) < 1e-9 and abs(kl_objective(ref, ref, r, b) - 0.75) < 1e-12
for pi in ([0.6, 0.2, 0.2], [0.1, 0.1, 0.8], [1.0, 0.0, 0.0]):
    assert kl_objective(pi, ref, r, b) < best` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With deterministic transitions <C>nxt[s][a]</C> (None at the end), rewards <C>R[s][a]</C> and a reference <C>ref[s][a]</C>, write{" "}
          <C>soft_backup(nxt, R, ref, V, beta, gamma)</C>, one soft Bellman backup of every state; <C>soft_vi(nxt, R, ref, beta, gamma, iters)</C>,
          starting from zeros; and <C>implied_reward(pi, ref, beta)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def soft_backup(nxt, R, ref, V, beta, gamma):
    return list(V)

def soft_vi(nxt, R, ref, beta, gamma, iters):
    return [0.0] * len(R)

def implied_reward(pi, ref, beta):
    return [0.0] * len(pi)
`,
        solution: SOFT,
        tests: [
          { name: "backup", code: `nxt, R, ref = [[1, None], [None, None]], [[0.0, 1.0], [2.0, 0.0]], [[0.5, 0.5], [0.5, 0.5]]
b = 1 / math.log(2)
assert all(abs(x - y) < 1e-9 for x, y in zip(soft_backup(nxt, R, ref, [0.0, 0.0], b, 1.0), [math.log2(1.5), math.log2(2.5)]))
assert all(abs(x - y) < 1e-9 for x, y in zip(soft_vi(nxt, R, ref, b, 1.0, 5), [math.log2(2.25), math.log2(2.5)]))
assert all(abs(x - 2.0) < 0.002 for x in soft_vi(nxt, R, ref, 0.001, 1.0, 5))` },
          { name: "loop", code: `nxt, R, ref = [[0, None]], [[1.0, 5.0]], [[0.5, 0.5]]
V = soft_vi(nxt, R, ref, 1.0, 0.5, 200)
assert abs(V[0] - math.log(0.5 * math.exp(1 + 0.5 * V[0]) + 0.5 * math.exp(5.0))) < 1e-9
pr = implied_reward([0.75, 0.25], [0.5, 0.5], 2.0)
assert abs(pr[0] - 2 * math.log(1.5)) < 1e-12 and abs(pr[0] - pr[1] - 2 * math.log(3)) < 1e-12` },
        ],
      },
    },
    {
      key: "beta",
      rung: "stretch",
      prompt: (
        <p>
          The reference picks two actions with probability 0.5 each and their rewards are 1 and 0. For which β does the
          KL-regularised optimal policy give the first action probability 0.9? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4551, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every method so far learns from experience alone, without a model of how the environment works. Part 8 asks what
        changes when the agent has, or learns, such a model, beginning with model-based reinforcement learning (l6.8.1).
      </p>
    </>
  ),
};
