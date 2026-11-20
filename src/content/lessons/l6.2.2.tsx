import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DiscountWeightsViz } from "@/components/viz/DiscountWeightsViz";
import type { LessonContent } from "@/lib/types";

const RET = `import math

def discounted_return(rewards, gamma):
    g = 0.0
    for r in reversed(rewards):
        g = r + gamma * g
    return g

def returns_to_go(rewards, gamma):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]

def horizon(gamma, eps, rmax=1.0):
    return max(0, math.ceil(math.log(eps * (1 - gamma) / rmax) / math.log(gamma)))`;

const SERIES = `def terminated_return(rewards, gamma, rng):
    total = 0.0
    for r in rewards:
        total += r
        if rng.random() >= gamma:
            break
    return total

def mean_terminated(rewards, gamma, n, rng):
    return sum(terminated_return(rewards, gamma, rng) for _ in range(n)) / n

def series_value(M, r, gamma, n):
    v = [0.0] * len(r)
    for _ in range(n):
        v = [r[s] + gamma * sum(M[s][j] * v[j] for j in range(len(r))) for s in range(len(r))]
    return v`;

export const lesson: LessonContent = {
  id: "l6.2.2",
  minutes: 50,
  links: {
    requires: ["l6.2.1"],
    revisits: ["m3.7.3"],
    foreshadows: ["l6.2.3", "l6.2.4", "l6.6.4"],
  },

  puzzle: (
    <>
      <p>
        An agent that runs for ever collects an infinite stream of rewards, and the plain sum of an infinite stream is usually
        infinite: two policies that both earn without end cannot be told apart by their totals. Yet a policy that earns 1 per
        step now is clearly different from one that earns nothing for ten steps and 2 per step afterwards. How should a stream
        of rewards be turned into a single number, and what does that choice say about the agent&apos;s patience?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Weight the reward k steps ahead by <M>{"\\gamma^k"}</M> for a discount factor γ below 1. The weights sum to{" "}
        <M>{"1/(1 - \\gamma)"}</M>, so the total is finite, and the agent effectively looks about <M>{"1/(1 - \\gamma)"}</M> steps ahead.
        Discounting also has a probabilistic reading: it is what an undiscounted agent would care about if, after every step,
        the world might end with probability <M>{"1 - \\gamma"}</M>. And it makes values satisfy a one-step recursion, which is what
        every algorithm in this course exploits.
      </p>
      <DiscountWeightsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="return">
        <p>
          The <em>return</em> from time t is
        </p>
        <MD>{"G_t = R_{t+1} + \\gamma R_{t+2} + \\gamma^2R_{t+3} + \\dots = \\sum_{k=0}^{\\infty}\\gamma^kR_{t+k+1},"}</MD>
        <p>
          with discount factor <M>{"0 \\le \\gamma < 1"}</M>. In an <em>episodic</em> task the agent reaches a terminal state at a random
          time T, after which all rewards are 0, and γ = 1 is also allowed; tasks that never end are <em>continuing</em>.
        </p>
      </Definition>

      <Theorem title="the return recursion">
        <p>
          <M>{"G_t = R_{t+1} + \\gamma G_{t+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"G_t = R_{t+1} + \\gamma\\sum_{k=0}^\\infty\\gamma^kR_{t+k+2} = R_{t+1} + \\gamma G_{t+1}"}</M>. So the returns of a finished
          episode can all be computed in one backward pass (<C>returns_to_go</C>), and a single return by Horner&apos;s rule (
          <C>discounted_return</C>).
        </p>
        <Code>{RET}</Code>
      </Proof>

      <Theorem title="bounded returns and the effective horizon">
        <p>
          If <M>{"|R_t| \\le R_{\\max}"}</M>, then <M>{"|G_t| \\le R_{\\max}/(1 - \\gamma)"}</M>, and truncating the sum after H terms changes
          it by at most <M>{"\\gamma^HR_{\\max}/(1 - \\gamma)"}</M>. The error is at most ε once{" "}
          <M>{"H \\ge \\log\\bigl(\\varepsilon(1 - \\gamma)/R_{\\max}\\bigr)/\\log\\gamma"}</M> (<C>horizon</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"|G_t| \\le \\sum_k\\gamma^kR_{\\max} = R_{\\max}/(1 - \\gamma)"}</M>, and the tail from k = H is <M>{"\\gamma^H"}</M> times a
          sum of the same form. Taking logarithms of <M>{"\\gamma^HR_{\\max}/(1 - \\gamma) \\le \\varepsilon"}</M> and dividing by the
          negative <M>{"\\log\\gamma"}</M> reverses the inequality. Since <M>{"\\log(1/\\gamma) \\approx 1 - \\gamma"}</M>, the horizon is about{" "}
          <M>{"\\frac{1}{1 - \\gamma}\\log\\frac{R_{\\max}}{\\varepsilon(1 - \\gamma)}"}</M>: a small multiple of{" "}
          <M>{"1/(1 - \\gamma)"}</M>.
        </p>
      </Proof>

      <Theorem title="discounting as termination">
        <p>
          Let an episode end after each step independently with probability <M>{"1 - \\gamma"}</M>, and let Z be the sum of the
          rewards received before it ends, the first always included. For a fixed reward sequence,{" "}
          <M>{"\\mathbb{E}Z = \\sum_k\\gamma^kr_{k+1}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Reward <M>{"r_{k+1}"}</M> is received exactly when the episode survives the first k coin flips, which has probability{" "}
          <M>{"\\gamma^k"}</M>. By linearity of expectation <M>{"\\mathbb{E}Z = \\sum_k\\gamma^kr_{k+1}"}</M>. <C>terminated_return</C>{" "}
          simulates Z and <C>mean_terminated</C> averages it.
        </p>
        <Code>{SERIES}</Code>
      </Proof>

      <Theorem title="expected discounted return of a policy">
        <p>
          For a stationary policy with transition matrix <M>{"P_\\pi"}</M> and expected reward vector <M>{"r_\\pi"}</M> (l6.2.1), the
          vector of expected returns <M>{"v_\\pi(s) = \\mathbb{E}[G_0 \\mid S_0 = s]"}</M> is
        </p>
        <MD>{"v_\\pi = \\sum_{k=0}^\\infty\\gamma^kP_\\pi^kr_\\pi = (I - \\gamma P_\\pi)^{-1}r_\\pi."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\mathbb{E}[R_{k+1} \\mid S_0 = s] = (P_\\pi^kr_\\pi)(s)"}</M>, and the expectation of the bounded sum is the sum of the
          expectations. Every row of <M>{"P_\\pi^k"}</M> is a probability vector, so the k-th term is at most{" "}
          <M>{"\\gamma^k\\max|r_\\pi|"}</M> and the series converges. Multiplying it by <M>{"I - \\gamma P_\\pi"}</M> telescopes to{" "}
          <M>{"r_\\pi"}</M>, so <M>{"I - \\gamma P_\\pi"}</M> is invertible with this inverse. <C>series_value</C> sums the first n terms by
          the update <M>{"v \\leftarrow r_\\pi + \\gamma P_\\pi v"}</M>, a first sight of the Bellman equation (l6.2.4).
        </p>
      </Proof>

      <Example title="the machine again">
        <p>
          For the policy run, run, repair, whose long-run average reward is 7/17 ≈ 0.4118, the starting value scaled by{" "}
          <M>{"1 - \\gamma"}</M> is 0.4243 for γ = 0.99 and 0.4130 for γ = 0.999. In general{" "}
          <M>{"(1 - \\gamma)v_\\pi \\to"}</M> the long-run average as <M>{"\\gamma \\to 1"}</M> when the chain has a unique stationary
          distribution: a very patient discounted agent agrees with an average-reward agent.
        </p>
      </Example>

      <Remark title="choosing γ">
        <p>
          The discount is part of the problem: it says how much the designer values the future. In practice it is also a
          tool. A smaller γ shortens the horizon, which lowers the variance of estimated returns and speeds up learning, but
          makes the agent myopic: in the picture, with γ = 0.9 the agent prefers 1 now to 2 per step after a wait of ten steps.
          Values of 0.99 to 0.999 are common in deep reinforcement learning, and the trade between bias and variance that γ
          controls returns in generalised advantage estimation (l6.6.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ret",
      rung: "check",
      prompt: <p>An episode gives rewards 1, 0, 0, 10. What is its return from the start with γ = 0.9?</p>,
      answer: { kind: "numeric", value: 8.29, tolerance: 0.0001 },
    },
    {
      key: "h",
      rung: "check",
      prompt: (
        <p>
          With γ = 0.99 and rewards bounded by 1, what is the smallest number of steps H after which truncating the return changes it
          by at most 0.01, according to the bound <M>{"\\gamma^H/(1 - \\gamma)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 917, tolerance: 0.5 },
    },
    {
      key: "terminate",
      rung: "apply",
      prompt: <p>Why can a discounted return be read as an undiscounted return in a world that may end?</p>,
      answer: {
        kind: "choice",
        options: [
          "If the world ends after each step with probability 1 − γ, the reward k steps ahead is received with probability γᵏ, which is exactly its discount weight",
          "Because every episode ends after exactly 1/(1 − γ) steps",
          "Because discounting removes all rewards after the effective horizon",
          "Because the expected reward per step is the same in both cases",
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

def discounted_return(rewards, gamma):
    g = 0.0
    for r in reversed(rewards):
        g = r + gamma * g
    return g

def returns_to_go(rewards, gamma):
    out, g = [], 0.0
    for r in reversed(rewards):
        g = r + gamma * g
        out.append(g)
    return out[::-1]

def horizon(gamma, eps, rmax=1.0):
    return max(0, math.ceil(math.log(eps * (1 - gamma) / rmax) / math.log(gamma)))

print(discounted_return([1, 2, 4], 0.5), discounted_return([], 0.9), returns_to_go([1, 2, 4], 0.5))
print(horizon(0.5, 0.25), horizon(0.9, 100), returns_to_go([0, 0, 8], 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.0 0.0 [3.0, 4.0, 4.0]\n3 0 [2.0, 4.0, 8.0]",
          "3.0 0.0 [4.0, 4.0, 3.0]\n3 0 [2.0, 4.0, 8.0]",
          "7.0 0.0 [3.0, 4.0, 4.0]\n3 0 [2.0, 4.0, 8.0]",
          "3.0 0.0 [3.0, 4.0, 4.0]\n2 0 [8.0, 4.0, 2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def terminated_return(rewards, gamma, rng):
    total = 0.0
    for r in rewards:
        total += r
        if rng.random() >= gamma:
            break
    return total

def mean_terminated(rewards, gamma, n, rng):
    return sum(terminated_return(rewards, gamma, rng) for _ in range(n)) / n

def series_value(M, r, gamma, n):
    v = [0.0] * len(r)
    for _ in range(n):
        v = [r[s] + gamma * sum(M[s][j] * v[j] for j in range(len(r))) for s in range(len(r))]
    return v

import random; print(terminated_return([1, 2, 4], 1.0, random.Random(0)), terminated_return([1, 2, 4], 0, random.Random(0)), round(mean_terminated([3], 0.5, 10, random.Random(1)), 4))
print(series_value([[1]], [1], 0.5, 3), series_value([[0, 1], [1, 0]], [1, 0], 0.5, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7.0 1.0 3.0\n[1.75] [1.25, 0.625]",
          "7.0 0.0 3.0\n[1.75] [1.25, 0.625]",
          "7.0 1.0 1.5\n[1.75] [1.25, 0.625]",
          "7.0 1.0 3.0\n[2.0] [1.25, 0.625]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>discounted_return(rewards, gamma)</C>; <C>returns_to_go(rewards, gamma)</C>, the list of returns from every time
          step of a finished episode; and <C>horizon(gamma, eps, rmax=1.0)</C>, the smallest whole number H ≥ 0 with{" "}
          <M>{"\\gamma^H r_{\\max}/(1 - \\gamma) \\le \\varepsilon"}</M>, using the logarithmic formula and rounding up.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def discounted_return(rewards, gamma):
    return 0.0

def returns_to_go(rewards, gamma):
    return []

def horizon(gamma, eps, rmax=1.0):
    return 0
`,
        solution: RET,
        tests: [
          { name: "return", code: `assert discounted_return([1, 2, 4], 0.5) == 3 and discounted_return([], 0.9) == 0 and discounted_return([5], 0) == 5 and abs(discounted_return([1, 0, 0, 10], 0.9) - 8.29) < 1e-12
assert returns_to_go([1, 2, 4], 0.5) == [3, 4, 4] and returns_to_go([0, 0, 8], 0.5) == [2, 4, 8] and returns_to_go([], 0.5) == [] and returns_to_go([1, 1], 1) == [2, 1]` },
          { name: "horizon", code: `assert horizon(0.5, 0.25) == 3 and horizon(0.9, 100) == 0 and horizon(0.99, 0.01) == 917 and horizon(0.5, 0.1, 2) == 6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>terminated_return(rewards, gamma, rng)</C>, which adds rewards in order and, after each one, stops if{" "}
          <C>rng.random() &gt;= gamma</C>; <C>mean_terminated(rewards, gamma, n, rng)</C>, the average of n such sums; and{" "}
          <C>series_value(M, r, gamma, n)</C>, which starts from the zero vector and applies{" "}
          <M>{"v \\leftarrow r + \\gamma Mv"}</M> n times.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def terminated_return(rewards, gamma, rng):
    return 0.0

def mean_terminated(rewards, gamma, n, rng):
    return 0.0

def series_value(M, r, gamma, n):
    return [0.0] * len(r)
`,
        solution: SERIES,
        tests: [
          { name: "terminate", code: `import random
assert terminated_return([1, 2, 4], 1.0, random.Random(0)) == 7 and terminated_return([1, 2, 4], 0, random.Random(0)) == 1 and terminated_return([], 0.5, random.Random(0)) == 0
m = mean_terminated([1, 0, 0, 10], 0.9, 20000, random.Random(0)); assert abs(m - 8.29) < 0.1 and mean_terminated([3], 0.5, 10, random.Random(1)) == 3` },
          { name: "series", code: `assert series_value([[1]], [1], 0.5, 3) == [1.75] and series_value([[0, 1], [1, 0]], [1, 0], 0.5, 4) == [1.25, 0.625] and series_value([[1]], [2], 0.9, 0) == [0.0]
v = series_value([[0.5, 0.5], [0, 1]], [1, 0], 0.5, 200); assert abs(v[0] - 4 / 3) < 1e-12 and v[1] == 0` },
        ],
      },
    },
    {
      key: "machine",
      rung: "stretch",
      prompt: (
        <p>
          The machine of l6.2.1 starts good and follows the policy run, run, repair. What is its expected discounted return with γ =
          0.9? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.3008, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The expected return from each state is the value of the state under a policy. The next lesson (l6.2.3) makes this
        precise, adds the value of taking an action in a state, and asks what it means for one policy to be better than another.
      </p>
    </>
  ),
};
