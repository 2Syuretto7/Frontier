import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UcbBoundsViz } from "@/components/viz/UcbBoundsViz";
import type { LessonContent } from "@/lib/types";

const UCB = `import math

def ucb_index(mean, n, t):
    return mean + math.sqrt(2 * math.log(t) / n)

def pull(p, rng):
    return 1 if rng.random() < p else 0

def ucb(probs, T, rng):
    K = len(probs)
    counts, sums = [0] * K, [0] * K
    for t in range(1, T + 1):
        if t <= K:
            a = t - 1
        else:
            idx = [ucb_index(sums[i] / counts[i], counts[i], t) for i in range(K)]
            a = max(range(K), key=lambda i: idx[i])
        counts[a] += 1
        sums[a] += pull(probs[a], rng)
    return counts`;

const BOUND = `import math

def ucb1_pulls(delta, T):
    return 8 * math.log(T) / delta ** 2 + 1 + math.pi ** 2 / 3

def ucb1_bound(deltas, T):
    return sum(d * ucb1_pulls(d, T) for d in deltas if d > 0)

def gap_free(K, T):
    return 2 * math.sqrt(8 * K * T * math.log(T))`;

export const lesson: LessonContent = {
  id: "l6.1.3",
  minutes: 60,
  links: {
    requires: ["l6.1.1", "m15.1.2"],
    revisits: ["l6.1.2"],
    foreshadows: ["l6.1.4", "l6.8.2"],
  },

  puzzle: (
    <>
      <p>
        ε-greedy explores blindly: an arm that has paid nothing in a thousand pulls is explored as often as one that has been
        tried twice. It also needs to be told how small the gaps are. Can a learner decide for itself, from its own data, which
        arms are still worth trying, and get logarithmic regret on every bandit without knowing anything in advance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Be optimistic. For each arm, ask how good it could plausibly be given what has been seen, and pull the arm whose
        plausible best is highest. If that arm really is good, pulling it earns well. If it is not, pulling it adds a sample,
        shrinks its uncertainty and lowers its plausible best, so the mistake corrects itself. An arm that has been pulled
        often has a tight bound and is pulled again only if its average deserves it; an arm pulled rarely keeps a wide bound and
        so is tried again, but only a logarithmic number of times.
      </p>
      <UcbBoundsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="UCB1">
        <p>
          Let rewards lie in [0, 1]. Pull each arm once. At each later round t, pull the arm maximising the{" "}
          <em>upper confidence bound</em>
        </p>
        <MD>{"\\hat\\mu_a + \\sqrt{\\frac{2\\log t}{N_a}},"}</MD>
        <p>
          where <M>{"\\hat\\mu_a"}</M> is the average of the <M>{"N_a"}</M> rewards of arm a so far (<C>ucb_index</C>, and{" "}
          <C>ucb</C> with Bernoulli rewards drawn by <C>pull</C>).
        </p>
        <Code>{UCB}</Code>
      </Definition>

      <Theorem title="the confidence bound is rarely wrong">
        <p>
          For n independent rewards in [0, 1] with mean μ and average <M>{"\\hat\\mu"}</M>,{" "}
          <M>{"P\\bigl(\\hat\\mu \\ge \\mu + \\sqrt{2\\log t/n}\\bigr) \\le t^{-4}"}</M>, and the same holds for{" "}
          <M>{"\\hat\\mu \\le \\mu - \\sqrt{2\\log t/n}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Hoeffding&apos;s inequality (m15.1.2) gives <M>{"P(\\hat\\mu - \\mu \\ge \\varepsilon) \\le e^{-2n\\varepsilon^2}"}</M>, and{" "}
          <M>{"\\varepsilon^2 = 2\\log t/n"}</M> makes the exponent <M>{"-4\\log t"}</M>.
        </p>
      </Proof>

      <Theorem title="regret of UCB1">
        <p>(Auer, Cesa-Bianchi and Fischer, 2002.) For every suboptimal arm a,</p>
        <MD>{"\\mathbb{E}N_a(T) \\le \\frac{8\\log T}{\\Delta_a^2} + 1 + \\frac{\\pi^2}{3}, \\qquad R_T \\le \\sum_{a:\\Delta_a > 0}\\Bigl(\\frac{8\\log T}{\\Delta_a} + \\Bigl(1 + \\frac{\\pi^2}{3}\\Bigr)\\Delta_a\\Bigr)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"\\ell = \\lceil 8\\log T/\\Delta_a^2\\rceil"}</M> and <M>{"c_{t,n} = \\sqrt{2\\log t/n}"}</M>. Suppose arm a is pulled
          at round t after already <M>{"N_a \\ge \\ell"}</M> pulls. Then its index is at least a best arm&apos;s, so at least one of
          three things holds: the best arm&apos;s index is below <M>{"\\mu^*"}</M>, or{" "}
          <M>{"\\hat\\mu_a \\ge \\mu_a + c_{t,N_a}"}</M>, or <M>{"\\mu^* < \\mu_a + 2c_{t,N_a}"}</M>. The last is impossible, since{" "}
          <M>{"N_a \\ge \\ell"}</M> makes <M>{"2c_{t,N_a} \\le \\Delta_a"}</M>. Each of the first two has probability at most{" "}
          <M>{"t^{-4}"}</M> for each possible value of the pull counts, and there are at most t values for each count, so the chance
          that round t is such a pull is at most <M>{"2t^2 \\cdot t^{-4} = 2t^{-2}"}</M>. Hence{" "}
          <M>{"\\mathbb{E}N_a(T) \\le \\ell + \\sum_t 2t^{-2} \\le 8\\log T/\\Delta_a^2 + 1 + \\pi^2/3"}</M>. Multiply by{" "}
          <M>{"\\Delta_a"}</M> and sum (<C>ucb1_pulls</C>, <C>ucb1_bound</C>).
        </p>
        <Code>{BOUND}</Code>
      </Proof>

      <Remark title="no gap needs to be known">
        <p>
          Unlike explore-then-commit (l6.1.1) and decaying ε-greedy (l6.1.2), UCB1 has no parameter tuned to the gaps; it adapts to
          whatever they are. Exploration is also targeted: in the picture the upper bounds stay nearly level, because each pull
          lowers the bound of the arm pulled, and a poor arm reaches the common level only while it has few pulls. The pulls
          of arm a grow like <M>{"\\log T/\\Delta_a^2"}</M>, matching the Lai–Robbins lower bound up to the constant; refined
          indices such as KL-UCB attain the optimal constant.
        </p>
      </Remark>

      <Theorem title="a bound free of the gaps">
        <p>
          For every bandit with K arms and rewards in [0, 1], the regret of UCB1 is at most{" "}
          <M>{"2\\sqrt{8KT\\log T} + (1 + \\pi^2/3)K"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fix δ &gt; 0. Arms with <M>{"\\Delta_a < \\delta"}</M> cost at most <M>{"T\\delta"}</M> in total. Each other arm costs at most{" "}
          <M>{"8\\log T/\\Delta_a + (1 + \\pi^2/3)\\Delta_a \\le 8\\log T/\\delta + 1 + \\pi^2/3"}</M>. So{" "}
          <M>{"R_T \\le T\\delta + 8K\\log T/\\delta + (1 + \\pi^2/3)K"}</M>; the choice{" "}
          <M>{"\\delta = \\sqrt{8K\\log T/T}"}</M> gives the bound (<C>gap_free</C> evaluates its main term).
        </p>
      </Proof>

      <Remark title="the hardest gap">
        <p>
          The gap-dependent bound blows up as <M>{"\\Delta \\to 0"}</M>, but a tiny gap costs little per pull, and the regret can
          never exceed TΔ. The worst gap is where the two limits cross, of order <M>{"\\sqrt{\\log T/T}"}</M>: a difference so small
          that it takes nearly the whole horizon to detect. No learner can do better than order <M>{"\\sqrt{KT}"}</M> in the worst
          case, so UCB1 is optimal up to the logarithm. The same index, applied at every node of a search tree, becomes the
          selection rule of Monte Carlo tree search (l6.8.2).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "index",
      rung: "check",
      prompt: <p>An arm has average 0.5 after 10 pulls, at round t = 100. What is its UCB1 index? Give four decimals.</p>,
      answer: { kind: "numeric", value: 1.4597, tolerance: 0.00006 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>Evaluate the UCB1 regret bound for gaps 0, 0.1 and 0.3 with T = 10000. Give four decimals.</p>,
      answer: { kind: "numeric", value: 984.1523, tolerance: 0.00006 },
    },
    {
      key: "optimism",
      rung: "apply",
      prompt: <p>UCB1 pulls a suboptimal arm because its upper confidence bound is the highest. Why does this not keep happening?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each pull adds a sample to that arm, so its bonus shrinks and its bound falls towards its true mean, below the best arm's bound",
          "UCB1 removes an arm permanently once it has been pulled log T times",
          "The bonus of the best arm grows with every pull",
          "Upper confidence bounds are always below the true means",
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

def ucb_index(mean, n, t):
    return mean + math.sqrt(2 * math.log(t) / n)

def pull(p, rng):
    return 1 if rng.random() < p else 0

def ucb(probs, T, rng):
    K = len(probs)
    counts, sums = [0] * K, [0] * K
    for t in range(1, T + 1):
        if t <= K:
            a = t - 1
        else:
            idx = [ucb_index(sums[i] / counts[i], counts[i], t) for i in range(K)]
            a = max(range(K), key=lambda i: idx[i])
        counts[a] += 1
        sums[a] += pull(probs[a], rng)
    return counts

import random; print(round(ucb_index(0.5, 2, math.e ** 2), 4), round(ucb_index(1, 8, math.e), 4), pull(0, random.Random(1)), pull(1, random.Random(1)))
print(ucb([0, 1], 6, random.Random(0)), ucb([1, 1, 1], 7, random.Random(0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.9142 1.5 0 1\n[1, 5] [3, 2, 2]",
          "1.9142 1.5 0 1\n[1, 5] [2, 2, 3]",
          "2.5 1.5 0 1\n[1, 5] [3, 2, 2]",
          "1.9142 1.5 1 0\n[0, 6] [3, 2, 2]",
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

def ucb1_pulls(delta, T):
    return 8 * math.log(T) / delta ** 2 + 1 + math.pi ** 2 / 3

def ucb1_bound(deltas, T):
    return sum(d * ucb1_pulls(d, T) for d in deltas if d > 0)

def gap_free(K, T):
    return 2 * math.sqrt(8 * K * T * math.log(T))

print(round(ucb1_pulls(1, math.e), 4), round(ucb1_bound([0, 0.5, 1], math.e ** 2), 4), ucb1_bound([0, 0], 100))
print(gap_free(2, 1), round(gap_free(1, math.e ** 4), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "12.2899 54.4348 0\n0.0 83.6",
          "12.2899 54.4348 0\n4.0 83.6",
          "9.0 54.4348 0\n0.0 83.6",
          "12.2899 70.8697 0\n0.0 83.6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ucb_index(mean, n, t)</C>; <C>pull(p, rng)</C>, which returns 1 if <C>rng.random() &lt; p</C> and 0 otherwise; and{" "}
          <C>ucb(probs, T, rng)</C>, UCB1 on Bernoulli arms for rounds t = 1, …, T, pulling arm t − 1 in the first K rounds and
          then the arm of largest index (first index on ties), returning the pull counts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ucb_index(mean, n, t):
    return 0.0

def pull(p, rng):
    return 0

def ucb(probs, T, rng):
    return [0] * len(probs)
`,
        solution: UCB,
        tests: [
          { name: "index", code: `import math, random
assert abs(ucb_index(0.5, 2, math.e ** 2) - (0.5 + math.sqrt(2))) < 1e-12 and ucb_index(1, 8, math.e) == 1.5 and ucb_index(0.3, 5, 1) == 0.3
assert [pull(0.5, random.Random(s)) for s in range(5)] == [0, 1, 0, 1, 1] and pull(1, random.Random(0)) == 1 and pull(0, random.Random(0)) == 0` },
          { name: "ucb", code: `import random
assert ucb([0, 0, 1], 10, random.Random(0)) == [2, 2, 6] and ucb([0, 0], 5, random.Random(0)) == [3, 2] and ucb([1, 0], 2, random.Random(0)) == [1, 1]
c = ucb([0.1, 0.9], 2000, random.Random(2)); assert sum(c) == 2000 and c[1] > 1900` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ucb1_pulls(delta, T)</C>, the bound on the expected pulls of an arm with gap delta;{" "}
          <C>ucb1_bound(deltas, T)</C>, the regret bound summed over the arms with positive gap; and <C>gap_free(K, T)</C>, the
          value <M>{"2\\sqrt{8KT\\log T}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ucb1_pulls(delta, T):
    return 0.0

def ucb1_bound(deltas, T):
    return 0.0

def gap_free(K, T):
    return 0.0
`,
        solution: BOUND,
        tests: [
          { name: "pulls", code: `import math
assert abs(ucb1_pulls(2, math.e ** 2) - (5 + math.pi ** 2 / 3)) < 1e-12 and abs(ucb1_pulls(1, 1) - (1 + math.pi ** 2 / 3)) < 1e-12
assert ucb1_bound([0, 0], 100) == 0 and abs(ucb1_bound([0, 0.5, 1], math.e) - (0.5 * ucb1_pulls(0.5, math.e) + ucb1_pulls(1, math.e))) < 1e-12` },
          { name: "free", code: `import math
assert gap_free(2, 1) == 0 and abs(gap_free(2, math.e) - 2 * math.sqrt(16 * math.e)) < 1e-12 and abs(gap_free(5, 100) - 2 * math.sqrt(4000 * math.log(100))) < 1e-9` },
        ],
      },
    },
    {
      key: "worst",
      rung: "stretch",
      prompt: (
        <p>
          With T = 10000, the regret from one arm of gap Δ is at most both TΔ and about <M>{"8\\log T/\\Delta"}</M>. Which gap
          maximises the smaller of the two? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0858, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Optimism replaces each unknown mean by an upper bound. A Bayesian learner would instead keep a whole posterior
        distribution over each mean, and the next lesson (l6.1.4) pulls each arm with the probability that it is the best,
        simply by sampling once from each posterior. It matches the regret of UCB1 and often beats it in practice.
      </p>
    </>
  ),
};
