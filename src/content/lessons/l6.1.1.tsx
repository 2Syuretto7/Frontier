import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BanditRegretViz } from "@/components/viz/BanditRegretViz";
import type { LessonContent } from "@/lib/types";

const GREEDY = `def regret(means, counts):
    best = max(means)
    return sum((best - m) * n for m, n in zip(means, counts))

def greedy(means, T, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for t in range(T):
        if t < K:
            a = t
        else:
            a = max(range(K), key=lambda i: sums[i] / counts[i])
        counts[a] += 1
        sums[a] += rng.gauss(means[a], 1)
    return counts

def uniform(means, T, rng):
    counts = [0] * len(means)
    for _ in range(T):
        counts[rng.randrange(len(means))] += 1
    return counts`;

const ETC = `import math

def etc(means, m, T, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for a in range(K):
        for _ in range(m):
            counts[a] += 1
            sums[a] += rng.gauss(means[a], 1)
    best = max(range(K), key=lambda i: sums[i] / counts[i])
    counts[best] += T - m * K
    return counts

def etc_bound(deltas, m, T):
    K = len(deltas)
    return sum(m * d + (T - m * K) * d * math.exp(-m * d * d / 4) for d in deltas)

def etc_m(delta, T):
    return max(1, math.ceil(4 / delta ** 2 * math.log(T * delta ** 2 / 4)))`;

export const lesson: LessonContent = {
  id: "l6.1.1",
  minutes: 55,
  links: {
    requires: ["m7.7.1"],
    revisits: ["l0.2.5", "m15.1.2"],
    foreshadows: ["l6.1.2", "l6.1.3", "l6.2.1"],
  },

  puzzle: (
    <>
      <p>
        A new app has three versions of its sign-up page, and every visitor must be shown one of them. You do not know which
        converts best, and the only way to find out is to show them and watch. Every visitor sent to a worse page is a lost
        sign-up, but if you stop trying the others too soon you may settle on the wrong one for ever. How much exploring is
        enough, and what is the best possible loss?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        This is the smallest problem in reinforcement learning: one situation, repeated, with a choice of actions and a noisy
        reward for each. Learning and earning pull against each other. Pulling the arm that looks best earns now; pulling one
        that looks worse is the only way to learn whether it really is. A learner who never explores can be fooled by one
        unlucky early reward. A learner who explores for a fixed time and then commits pays a fixed price for learning, and
        if the time is chosen well the price grows only like the logarithm of the horizon.
      </p>
      <BanditRegretViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stochastic multi-armed bandit">
        <p>
          There are K arms. Pulling arm a gives an independent reward from a distribution with mean <M>{"\\mu_a"}</M>. At each
          round <M>{"t = 1, \\dots, T"}</M> a learner picks an arm <M>{"A_t"}</M> using only the earlier arms and rewards. Let{" "}
          <M>{"\\mu^* = \\max_a\\mu_a"}</M>, the <em>gap</em> <M>{"\\Delta_a = \\mu^* - \\mu_a"}</M>, and{" "}
          <M>{"N_a(T)"}</M> the number of pulls of arm a. The <em>regret</em> is
        </p>
        <MD>{"R_T = T\\mu^* - \\mathbb{E}\\sum_{t=1}^T \\mu_{A_t},"}</MD>
        <p>the expected shortfall against a player who knew the best arm from the start.</p>
      </Definition>

      <Theorem title="regret decomposition">
        <p>
          <M>{"R_T = \\sum_a \\Delta_a\\,\\mathbb{E}[N_a(T)]."}</M>
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_t \\mu_{A_t} = \\sum_a \\mu_a N_a(T)"}</M> and <M>{"T = \\sum_a N_a(T)"}</M>, so{" "}
          <M>{"T\\mu^* - \\sum_t\\mu_{A_t} = \\sum_a(\\mu^* - \\mu_a)N_a(T)"}</M>. Take expectations. So to keep regret small, a learner must
          pull each bad arm rarely, and an arm with a small gap may be pulled more often than one with a large gap.{" "}
          <C>regret</C> computes the sum for given pull counts.
        </p>
        <Code>{GREEDY}</Code>
      </Proof>

      <Example title="greedy play can fail for ever">
        <p>
          <C>greedy</C> pulls each arm once and then always the arm with the highest average reward so far. Suppose the best arm
          has its first reward below the true mean of the second arm, which happens with positive probability. The second arm
          is pulled next, and by the law of large numbers (m7.7.1) its average settles near its true mean. The best arm, never
          pulled again, keeps its unlucky average, so the learner may never return to it. With constant probability the regret
          is then at least <M>{"\\Delta(T - K)"}</M>, which is linear in T. Uniform play (<C>uniform</C>) is linear too, with regret{" "}
          <M>{"T\\sum_a\\Delta_a/K"}</M>. Sublinear regret needs exploration that does not stop too early.
        </p>
      </Example>

      <Definition title="explore-then-commit">
        <p>
          Pull each arm m times, then pull the arm with the highest average for the remaining <M>{"T - mK"}</M> rounds (
          <C>etc</C>).
        </p>
        <Code>{ETC}</Code>
      </Definition>

      <Theorem title="regret of explore-then-commit">
        <p>If the rewards are Gaussian with variance 1 and <M>{"mK \\le T"}</M>, then</p>
        <MD>{"R_T \\le \\sum_a \\Bigl(m\\Delta_a + (T - mK)\\,\\Delta_a\\,e^{-m\\Delta_a^2/4}\\Bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Arm a is pulled m times while exploring, and all <M>{"T - mK"}</M> later times if it is chosen. It can be chosen only if
          its average is at least the average of a best arm. The difference of the two averages is Gaussian with mean{" "}
          <M>{"-\\Delta_a"}</M> and variance 2/m, so the Gaussian tail bound (m15.1.2) gives{" "}
          <M>{"P(\\bar X_a \\ge \\bar X^*) \\le \\exp(-\\Delta_a^2/(2 \\cdot 2/m)) = e^{-m\\Delta_a^2/4}"}</M>. Hence{" "}
          <M>{"\\mathbb{E}N_a \\le m + (T - mK)e^{-m\\Delta_a^2/4}"}</M>; multiply by <M>{"\\Delta_a"}</M> and sum. <C>etc_bound</C>
          evaluates the right-hand side.
        </p>
      </Proof>

      <Remark title="choosing m">
        <p>
          With two arms and gap Δ, the bound is about <M>{"m\\Delta + T\\Delta e^{-m\\Delta^2/4}"}</M>. Setting its derivative in m to 0
          gives <M>{"m = \\frac{4}{\\Delta^2}\\log\\frac{T\\Delta^2}{4}"}</M> (<C>etc_m</C> rounds up and takes at least 1), and then the
          regret is at most about <M>{"\\frac{4}{\\Delta}\\bigl(1 + \\log\\frac{T\\Delta^2}{4}\\bigr)"}</M>: logarithmic in T. The catch is
          that m depends on Δ, which the learner does not know. In the picture m = 50 happens to suit the gap of 0.2; larger or
          smaller m does worse.
        </p>
      </Remark>

      <Theorem title="the Lai–Robbins lower bound">
        <p>
          (Lai and Robbins, 1985.) For any learner whose regret is <M>{"o(T^\\alpha)"}</M> for every α &gt; 0 on every Gaussian
          bandit with unit variance, each suboptimal arm satisfies{" "}
          <M>{"\\liminf_{T\\to\\infty}\\mathbb{E}[N_a(T)]/\\log T \\ge 2/\\Delta_a^2"}</M>, so{" "}
          <M>{"R_T \\gtrsim \\sum_{a:\\Delta_a > 0}\\frac{2\\log T}{\\Delta_a}"}</M>.
        </p>
      </Theorem>
      <Remark title="what the lower bound means">
        <p>
          Logarithmic regret is the best possible, and an arm is hard exactly when its gap is small: about{" "}
          <M>{"\\log T/\\Delta^2"}</M> samples are needed to tell two means Δ apart with error probability 1/T. Explore-then-commit
          reaches this rate only when told Δ. The next lessons give learners that adapt to the gaps without knowing them:
          ε-greedy with a decaying rate (l6.1.2), upper confidence bounds (l6.1.3) and Thompson sampling (l6.1.4).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "decomp",
      rung: "check",
      prompt: <p>Three arms have means 0.9, 0.8 and 0.5 and were pulled 700, 200 and 100 times. What is the regret?</p>,
      answer: { kind: "numeric", value: 60, tolerance: 0.001 },
    },
    {
      key: "m",
      rung: "check",
      prompt: (
        <p>
          With gap Δ = 0.2 and horizon T = 10000, what is <M>{"\\lceil\\frac{4}{\\Delta^2}\\log\\frac{T\\Delta^2}{4}\\rceil"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 461, tolerance: 0.5 },
    },
    {
      key: "greedy",
      rung: "apply",
      prompt: <p>Why can greedy play have regret that grows linearly in T?</p>,
      answer: {
        kind: "choice",
        options: [
          "An unlucky early reward can make the best arm look worse than another arm, and greedy play never pulls it again to correct the estimate",
          "Greedy play pulls every arm equally often",
          "The sample averages of the arms it keeps pulling do not converge",
          "Greedy play is only defined for two arms",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def regret(means, counts):
    best = max(means)
    return sum((best - m) * n for m, n in zip(means, counts))

def greedy(means, T, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for t in range(T):
        if t < K:
            a = t
        else:
            a = max(range(K), key=lambda i: sums[i] / counts[i])
        counts[a] += 1
        sums[a] += rng.gauss(means[a], 1)
    return counts

def uniform(means, T, rng):
    counts = [0] * len(means)
    for _ in range(T):
        counts[rng.randrange(len(means))] += 1
    return counts

import random; print(regret([1, 0.5, 0], [10, 4, 6]), regret([0.2, 0.9], [0, 7]), sum(uniform([0, 1, 2], 9, random.Random(3))))
print(greedy([0, 0, 9], 6, random.Random(1)), greedy([5, 0, 0], 4, random.Random(0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "8.0 0.0 9\n[1, 1, 4] [2, 1, 1]",
          "8.0 0.0 9\n[1, 1, 4] [1, 1, 2]",
          "8.0 4.9 9\n[1, 1, 4] [2, 1, 1]",
          "10.0 0.0 9\n[0, 0, 6] [2, 1, 1]",
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

def etc(means, m, T, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for a in range(K):
        for _ in range(m):
            counts[a] += 1
            sums[a] += rng.gauss(means[a], 1)
    best = max(range(K), key=lambda i: sums[i] / counts[i])
    counts[best] += T - m * K
    return counts

def etc_bound(deltas, m, T):
    K = len(deltas)
    return sum(m * d + (T - m * K) * d * math.exp(-m * d * d / 4) for d in deltas)

def etc_m(delta, T):
    return max(1, math.ceil(4 / delta ** 2 * math.log(T * delta ** 2 / 4)))

import random; print(etc([0, 5], 3, 20, random.Random(2)), round(etc_bound([0, 0.5], 10, 1000), 2))
print(etc_m(0.5, 1000), etc_m(2, 1), etc_m(0.1, 10000))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 17] 267.28\n67 1 1288",
          "[3, 20] 267.28\n67 1 1288",
          "[17, 3] 267.28\n67 1 1288",
          "[3, 17] 267.28\n67 0 1288",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>regret(means, counts)</C>, the regret of the given pull counts; <C>greedy(means, T, rng)</C>, which pulls arms 0,
          …, K − 1 once each and then the arm of highest average reward (first index on ties), with rewards{" "}
          <C>rng.gauss(means[a], 1)</C>, returning the pull counts; and <C>uniform(means, T, rng)</C>, which pulls{" "}
          <C>rng.randrange(K)</C> each round and returns the counts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def regret(means, counts):
    return 0.0

def greedy(means, T, rng):
    return [0] * len(means)

def uniform(means, T, rng):
    return [0] * len(means)
`,
        solution: GREEDY,
        tests: [
          { name: "regret", code: `assert regret([1, 0.5, 0], [10, 4, 6]) == 8 and regret([0.2, 0.9], [0, 7]) == 0 and regret([3, 1], [1, 2]) == 4
import random
r = random.Random(5); c = uniform([0, 1, 2, 3], 50, r); r2 = random.Random(5); d = [0] * 4
for _ in range(50): d[r2.randrange(4)] += 1
assert c == d and sum(c) == 50` },
          { name: "greedy", code: `import random
assert greedy([0, 0, 50], 10, random.Random(0)) == [1, 1, 8] and greedy([50, 0], 7, random.Random(1)) == [6, 1]
assert greedy([0, 50, 0], 2, random.Random(2)) == [1, 1, 0] and sum(greedy([0.1, 0.2, 0.3], 40, random.Random(3))) == 40` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>etc(means, m, T, rng)</C>, explore-then-commit that pulls arm 0 m times, then arm 1 m times, and so on, with
          rewards <C>rng.gauss(means[a], 1)</C>, and then commits to the best average (first index on ties), returning the counts;{" "}
          <C>etc_bound(deltas, m, T)</C>, the regret bound; and <C>etc_m(delta, T)</C>, the ceiling of{" "}
          <M>{"\\frac{4}{\\Delta^2}\\log\\frac{T\\Delta^2}{4}"}</M>, but at least 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def etc(means, m, T, rng):
    return [0] * len(means)

def etc_bound(deltas, m, T):
    return 0.0

def etc_m(delta, T):
    return 0
`,
        solution: ETC,
        tests: [
          { name: "etc", code: `import random
assert etc([0, 50], 3, 20, random.Random(0)) == [3, 17] and etc([50, 0, 0], 2, 10, random.Random(1)) == [6, 2, 2] and etc([0, 0, 50], 1, 3, random.Random(2)) == [1, 1, 1]
assert sum(etc([0.1, 0.2], 5, 30, random.Random(3))) == 30` },
          { name: "bound", code: `import math
assert etc_bound([0, 1], 4, 108) == 4 + 100 * math.exp(-1) and etc_bound([0, 0], 10, 50) == 0 and abs(etc_bound([0, 2], 1, 11) - (2 + 18 * math.exp(-1))) < 1e-12
assert etc_m(0.5, 1000) == 67 and etc_m(2, 1) == 1 and etc_m(0.1, 10000) == 1288 and etc_m(1, 400) == 19` },
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: (
        <p>
          Two Gaussian arms with unit variance have gap 0.2 and the horizon is T = 10000. With m = 461 pulls of each arm, what
          does the explore-then-commit bound give for the regret? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 110.2685, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        A bandit has a single state: the action changes the reward but not the situation. Reinforcement learning proper begins
        when actions also move the learner to a new state (l6.2.1), so that the value of an action includes everything it
        makes possible later. The tension between exploring and exploiting remains, and the ideas of this part, from
        optimism to posterior sampling, return there.
      </p>
    </>
  ),
};
