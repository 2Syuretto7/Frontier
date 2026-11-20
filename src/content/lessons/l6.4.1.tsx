import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RandomWalkMcViz } from "@/components/viz/RandomWalkMcViz";
import type { LessonContent } from "@/lib/types";

const MC = `def episode_returns(episode, gamma):
    out, g = [], 0.0
    for s, r in reversed(episode):
        g = r + gamma * g
        out.append((s, g))
    return out[::-1]

def first_visit_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        seen = set()
        for s, g in episode_returns(ep, gamma):
            if s not in seen:
                seen.add(s)
                total[s] = total.get(s, 0.0) + g
                count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}

def every_visit_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        for s, g in episode_returns(ep, gamma):
            total[s] = total.get(s, 0.0) + g
            count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}`;

const IS = `def incremental_mean(xs):
    v, out = 0.0, []
    for n, x in enumerate(xs, 1):
        v += (x - v) / n
        out.append(v)
    return out

def ordinary_is(returns, ratios):
    return sum(r * g for g, r in zip(returns, ratios)) / len(returns)

def weighted_is(returns, ratios):
    w = sum(ratios)
    return sum(r * g for g, r in zip(returns, ratios)) / w if w > 0 else 0.0`;

export const lesson: LessonContent = {
  id: "l6.4.1",
  minutes: 55,
  links: {
    requires: ["l6.2.3", "m7.7.3"],
    revisits: ["m7.7.1", "l6.3.2"],
    foreshadows: ["l6.4.2", "l6.4.4", "l6.6.2"],
  },

  puzzle: (
    <>
      <p>
        Dynamic programming needs every transition probability. A robot, a game player or a trading agent usually has none of
        them; it can only act and see what happens. The value of a state is an expected return, and an expectation can be
        estimated by averaging samples (m7.7.3). Is that all there is to learning values from experience, and what goes wrong
        when the episodes come from a different policy from the one being evaluated?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Run the policy to the end of an episode, compute the return that followed each visit to each state, and average. The
        law of large numbers does the rest. No model is needed, and states never visited cost nothing. The price is that every
        estimate waits for the episode to finish and carries the noise of the whole remaining trajectory. To learn about one
        policy from episodes of another, reweight each return by how much more or less likely its actions were under the
        policy of interest.
      </p>
      <RandomWalkMcViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Monte Carlo prediction">
        <p>
          An episode is stored as a list of pairs <M>{"(S_t, R_{t+1})"}</M>, the state and the reward that followed it.{" "}
          <C>episode_returns</C> attaches to each state its return <M>{"G_t"}</M> by one backward pass. <em>First-visit</em> Monte
          Carlo estimates <M>{"v_\\pi(s)"}</M> by averaging, over episodes, the return after the first visit to s
          (<C>first_visit_mc</C>); <em>every-visit</em> Monte Carlo averages the returns after all visits (<C>every_visit_mc</C>).
        </p>
        <Code>{MC}</Code>
      </Definition>

      <Theorem title="first-visit Monte Carlo is unbiased and consistent">
        <p>
          If s is visited in n of the episodes, the first-visit estimate is an average of n independent returns, each with mean{" "}
          <M>{"v_\\pi(s)"}</M>. It is unbiased, its variance is <M>{"\\mathrm{Var}(G \\mid S = s)/n"}</M>, and it converges to{" "}
          <M>{"v_\\pi(s)"}</M> with probability 1 as n → ∞.
        </p>
      </Theorem>
      <Proof>
        <p>
          Episodes are independent. Within an episode, by the Markov property, the trajectory after the first visit to s is
          distributed as a fresh episode started at s, whatever happened before, so its return has mean <M>{"v_\\pi(s)"}</M>. The
          strong law of large numbers (m7.7.1) gives convergence. Every-visit returns within one episode are dependent and the
          estimate is biased for finite n, but it is also consistent.
        </p>
      </Proof>

      <Definition title="incremental updates">
        <p>
          The mean of <M>{"x_1, \\dots, x_n"}</M> can be updated one sample at a time:{" "}
          <M>{"V_n = V_{n-1} + \\frac1n(x_n - V_{n-1})"}</M> (<C>incremental_mean</C>). Replacing 1/n by a constant α gives{" "}
          <M>{"V \\leftarrow V + \\alpha(G - V)"}</M>, an average that weights recent returns more, by{" "}
          <M>{"\\alpha(1 - \\alpha)^{n-i}"}</M> for the i-th. It never settles exactly, but it follows targets that drift, as they do
          when the policy is changing. Step sizes with <M>{"\\sum\\alpha_n = \\infty"}</M> and <M>{"\\sum\\alpha_n^2 < \\infty"}</M>, such as
          1/n, give convergence with probability 1 (Robbins and Monro).
        </p>
      </Definition>

      <Remark title="Monte Carlo control">
        <p>
          To improve a policy without a model, estimate q rather than v, since choosing the greedy action from v would need the
          transition probabilities. Alternate estimation of <M>{"q_\\pi"}</M> from episodes with improvement to a policy that is
          ε-greedy in q, in the pattern of generalised policy iteration (l6.3.2). Exploration is essential: a greedy policy never
          tries the actions it does not take, so their q values are never learnt. If ε decays so that every action is still
          tried infinitely often but the policy becomes greedy in the limit, the q estimates converge to <M>{"q_*"}</M>.
        </p>
      </Remark>

      <Definition title="importance sampling">
        <p>
          Suppose episodes are generated by a <em>behaviour</em> policy b but we want <M>{"v_\\pi"}</M> for a <em>target</em> policy π,
          with <M>{"b(a \\mid s) > 0"}</M> whenever <M>{"\\pi(a \\mid s) > 0"}</M>. The <em>importance ratio</em> of a trajectory from time
          t to the end T is
        </p>
        <MD>{"\\rho_{t:T-1} = \\prod_{k=t}^{T-1}\\frac{\\pi(A_k \\mid S_k)}{b(A_k \\mid S_k)}."}</MD>
        <p>
          <em>Ordinary</em> importance sampling averages <M>{"\\rho G"}</M> over n episodes (<C>ordinary_is</C>); <em>weighted</em>{" "}
          importance sampling divides <M>{"\\sum\\rho G"}</M> by <M>{"\\sum\\rho"}</M> instead of n (<C>weighted_is</C>).
        </p>
        <Code>{IS}</Code>
      </Definition>

      <Theorem title="importance sampling corrects the policy">
        <p>
          <M>{"\\mathbb{E}_b[\\rho_{t:T-1}G_t \\mid S_t = s] = v_\\pi(s)"}</M>, so ordinary importance sampling is unbiased. The weighted
          estimate is biased but consistent, and its values stay within the range of the observed returns.
        </p>
      </Theorem>
      <Proof>
        <p>
          The probability of a trajectory under a policy is the product of the action probabilities and the transition
          probabilities. In the ratio of the probabilities under π and b the transition probabilities cancel, leaving ρ, which
          can therefore be computed without a model. So{" "}
          <M>{"\\mathbb{E}_b[\\rho G] = \\sum_\\tau P_b(\\tau)\\frac{P_\\pi(\\tau)}{P_b(\\tau)}G(\\tau) = \\mathbb{E}_\\pi[G]"}</M>. The weighted
          estimate is a ratio of two averages whose expectations are <M>{"v_\\pi(s)"}</M> and 1, so it converges to{" "}
          <M>{"v_\\pi(s)"}</M>; it is a convex combination of observed returns.
        </p>
      </Proof>

      <Remark title="the variance problem">
        <p>
          A product of many ratios can be enormous or zero. If the target policy is deterministic, ρ is zero for every episode in
          which the behaviour policy deviates even once, and large for the rare episodes that follow the target exactly; the
          variance of the ordinary estimate grows exponentially with the episode length and can be infinite. Weighted importance
          sampling tames this at the price of bias. Two remedies run through the rest of the course: bootstrap from current
          value estimates instead of waiting for the full return (l6.4.2), and keep the policies being compared close to each
          other (l6.7.2). REINFORCE (l6.6.2) is Monte Carlo again, applied to the gradient of the return rather than to its value.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "first",
      rung: "check",
      prompt: (
        <p>
          An episode visits A, B, A, B, C, with reward 1 after C and 0 otherwise, and γ = 0.8. What is the first-visit return of A?
          Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4096, tolerance: 0.00006 },
    },
    {
      key: "every",
      rung: "check",
      prompt: <p>For the same episode, what is the every-visit estimate of the value of A? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.5248, tolerance: 0.00006 },
    },
    {
      key: "model",
      rung: "apply",
      prompt: <p>Why can the importance ratio be computed without knowing the transition probabilities?</p>,
      answer: {
        kind: "choice",
        options: [
          "The trajectory probabilities under both policies contain the same transition probabilities, which cancel in the ratio",
          "Because the transition probabilities are always uniform",
          "Because importance sampling only uses the final reward",
          "It cannot; importance sampling needs a model",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def episode_returns(episode, gamma):
    out, g = [], 0.0
    for s, r in reversed(episode):
        g = r + gamma * g
        out.append((s, g))
    return out[::-1]

def first_visit_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        seen = set()
        for s, g in episode_returns(ep, gamma):
            if s not in seen:
                seen.add(s)
                total[s] = total.get(s, 0.0) + g
                count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}

def every_visit_mc(episodes, gamma):
    total, count = {}, {}
    for ep in episodes:
        for s, g in episode_returns(ep, gamma):
            total[s] = total.get(s, 0.0) + g
            count[s] = count.get(s, 0) + 1
    return {s: total[s] / count[s] for s in total}

ep = [(0, 1), (1, 0), (0, 2)]; print(episode_returns(ep, 0.5), first_visit_mc([ep], 0.5), every_visit_mc([ep], 0.5))
print(first_visit_mc([ep, [(1, 4)]], 1.0), every_visit_mc([ep, [(1, 4)]], 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0, 1.5), (1, 1.0), (0, 2.0)] {0: 1.5, 1: 1.0} {0: 1.75, 1: 1.0}\n{0: 3.0, 1: 3.0} {0: 2.5, 1: 3.0}",
          "[(0, 1.5), (1, 1.0), (0, 2.0)] {0: 2.0, 1: 1.0} {0: 1.75, 1: 1.0}\n{0: 3.0, 1: 3.0} {0: 2.5, 1: 3.0}",
          "[(0, 1.5), (1, 1.0), (0, 2.0)] {0: 1.5, 1: 1.0} {0: 1.75, 1: 1.0}\n{0: 3.0, 1: 2.0} {0: 2.5, 1: 2.0}",
          "[(0, 2.0), (1, 1.0), (0, 1.5)] {0: 2.0, 1: 1.0} {0: 1.75, 1: 1.0}\n{0: 3.0, 1: 3.0} {0: 2.5, 1: 3.0}",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def incremental_mean(xs):
    v, out = 0.0, []
    for n, x in enumerate(xs, 1):
        v += (x - v) / n
        out.append(v)
    return out

def ordinary_is(returns, ratios):
    return sum(r * g for g, r in zip(returns, ratios)) / len(returns)

def weighted_is(returns, ratios):
    w = sum(ratios)
    return sum(r * g for g, r in zip(returns, ratios)) / w if w > 0 else 0.0

print(incremental_mean([2, 4, 9]), round(ordinary_is([1, 1, 0], [2, 0, 4]), 4), round(weighted_is([1, 1, 0], [2, 0, 4]), 4))
print(ordinary_is([3, 5], [0, 0]), weighted_is([3, 5], [0, 0]), weighted_is([6], [10]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 3.0, 5.0] 0.6667 0.3333\n0.0 0.0 6.0",
          "[2.0, 3.0, 5.0] 0.6667 0.5\n0.0 0.0 6.0",
          "[2.0, 3.0, 5.0] 0.6667 0.3333\n0.0 0.0 60.0",
          "[2.0, 6.0, 15.0] 0.6667 0.3333\n0.0 0.0 6.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>episode_returns(episode, gamma)</C>, which turns a list of (state, reward) pairs into a list of (state, return)
          pairs; <C>first_visit_mc(episodes, gamma)</C>; and <C>every_visit_mc(episodes, gamma)</C>, each returning a dictionary from
          the states seen to their estimates.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def episode_returns(episode, gamma):
    return []

def first_visit_mc(episodes, gamma):
    return {}

def every_visit_mc(episodes, gamma):
    return {}
`,
        solution: MC,
        tests: [
          { name: "returns", code: `ep = [(0, 1), (1, 0), (0, 2)]
assert episode_returns(ep, 0.5) == [(0, 1.5), (1, 1.0), (0, 2.0)] and episode_returns([], 0.9) == [] and episode_returns([("x", 3)], 0.1) == [("x", 3.0)]
ep = [("A", 0), ("B", 0), ("A", 0), ("B", 0), ("C", 1)]
assert abs(first_visit_mc([ep], 0.8)["A"] - 0.4096) < 1e-12 and abs(every_visit_mc([ep], 0.8)["A"] - 0.5248) < 1e-12` },
          { name: "mc", code: `ep = [(0, 1), (1, 0), (0, 2)]
assert first_visit_mc([ep, [(1, 4)]], 1.0) == {0: 3.0, 1: 3.0} and every_visit_mc([ep, [(1, 4)]], 1.0) == {0: 2.5, 1: 3.0}
import random
r = random.Random(0); eps = []
for _ in range(4000):
    s, ep = 3, []
    while 1 <= s <= 5:
        s2 = s + r.choice((-1, 1)); ep.append((s, 1 if s2 == 6 else 0)); s = s2
    eps.append(ep)
v = first_visit_mc(eps, 1.0); assert all(abs(v[k] - k / 6) < 0.03 for k in range(1, 6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>incremental_mean(xs)</C>, the list of running means computed by the incremental update;{" "}
          <C>ordinary_is(returns, ratios)</C>; and <C>weighted_is(returns, ratios)</C>, which returns 0.0 when all ratios are 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def incremental_mean(xs):
    return []

def ordinary_is(returns, ratios):
    return 0.0

def weighted_is(returns, ratios):
    return 0.0
`,
        solution: IS,
        tests: [
          { name: "mean", code: `assert incremental_mean([2, 4, 9]) == [2.0, 3.0, 5.0] and incremental_mean([]) == [] and incremental_mean([1, 2, 3, 4])[-1] == 2.5` },
          { name: "is", code: `assert abs(ordinary_is([1, 1, 0], [2, 0, 4]) - 2 / 3) < 1e-12 and abs(weighted_is([1, 1, 0], [2, 0, 4]) - 1 / 3) < 1e-12
assert ordinary_is([3, 5], [0, 0]) == 0 and weighted_is([3, 5], [0, 0]) == 0 and weighted_is([6], [10]) == 6 and ordinary_is([6], [10]) == 60` },
        ],
      },
    },
    {
      key: "var",
      rung: "stretch",
      prompt: (
        <p>
          In the random walk of the picture, the behaviour policy moves left or right with probability 1/2 each and the target
          policy always moves right; the return is 1 on leaving at the right end and 0 otherwise. For a single episode from C,
          what is the variance of the ordinary importance-sampling estimate <M>{"\\rho G"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Monte Carlo waits until the end of the episode to learn anything, and its targets carry the noise of every later step.
        Temporal-difference learning (l6.4.2) updates after every single step, using the current estimate of the next
        state&apos;s value in place of the rest of the return: a sampled version of the Bellman update of l6.3.1.
      </p>
    </>
  ),
};
