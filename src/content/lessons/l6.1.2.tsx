import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EpsilonGreedyViz } from "@/components/viz/EpsilonGreedyViz";
import type { LessonContent } from "@/lib/types";

const EPSG = `def argmax(xs):
    best = 0
    for i in range(1, len(xs)):
        if xs[i] > xs[best]:
            best = i
    return best

def eps_greedy(means, T, eps, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for t in range(T):
        if t < K:
            a = t
        elif rng.random() < eps:
            a = rng.randrange(K)
        else:
            a = argmax([s / n for s, n in zip(sums, counts)])
        counts[a] += 1
        sums[a] += rng.gauss(means[a], 1)
    return counts

def decay_eps(t, c, delta, K):
    return min(1.0, c * K / (delta ** 2 * t))`;

const COUNT = `import math

def explore_regret(deltas, eps, T):
    return eps * T * sum(deltas) / len(deltas)

def expected_explores(T, c, delta, K):
    return sum(min(1.0, c * K / (delta ** 2 * t)) for t in range(1, T + 1))

def log_explores(T, c, delta, K):
    t0 = c * K / delta ** 2
    if T <= t0:
        return T
    return t0 * (1 + math.log(T / t0))`;

export const lesson: LessonContent = {
  id: "l6.1.2",
  minutes: 50,
  links: {
    requires: ["l6.1.1"],
    revisits: ["m15.1.2"],
    foreshadows: ["l6.1.3", "l6.4.5", "l6.5.2"],
  },

  puzzle: (
    <>
      <p>
        Explore-then-commit needs to know in advance how long to explore, and that depends on the gaps between the arms, which
        are exactly what the learner does not know. A simpler idea is to explore a little all the time: usually pull the arm
        that looks best, but now and then pull one at random. Is a small, constant amount of exploration enough, and if not,
        how quickly should it fade?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Random exploration costs the same at every round, whatever has been learnt, so a constant rate ε charges a constant
        fee per round and the regret grows linearly. But exploration is only useful while the estimates are uncertain. The
        uncertainty of an average after n samples shrinks like <M>{"1/\\sqrt n"}</M>, and to keep every arm sampled about log t
        times by round t it suffices to explore at a rate that decays like 1/t. The fee then sums to a logarithm.
      </p>
      <EpsilonGreedyViz />
    </>
  ),

  theory: (
    <>
      <Definition title="ε-greedy">
        <p>
          After pulling each arm once, at each round flip a coin with probability <M>{"\\varepsilon_t"}</M> of heads. On heads pull
          an arm uniformly at random (explore); on tails pull the arm with the highest average reward so far (exploit), breaking
          ties by lowest index (<C>argmax</C>). <C>eps_greedy</C> implements a constant rate.
        </p>
        <Code>{EPSG}</Code>
      </Definition>

      <Theorem title="constant ε has linear regret">
        <p>
          For constant ε, every arm is pulled at least <M>{"\\varepsilon(T - K)/K"}</M> times in expectation, so{" "}
          <M>{"R_T \\ge \\frac{\\varepsilon(T - K)}{K}\\sum_a\\Delta_a"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          At each of the last T − K rounds, arm a is chosen by exploration with probability <M>{"\\varepsilon/K"}</M>, whatever happened
          before. So <M>{"\\mathbb{E}N_a(T) \\ge \\varepsilon(T - K)/K"}</M>; apply the regret decomposition (l6.1.1). The lower bound
          is nearly attained once the averages have settled, since exploitation then picks the best arm almost always; for large T
          the regret is about <M>{"\\varepsilon T\\sum_a\\Delta_a/K"}</M> (<C>explore_regret</C>).
        </p>
      </Proof>

      <Definition title="decaying exploration">
        <p>
          Fix c &gt; 0 and <M>{"0 < d \\le \\min_{a:\\Delta_a > 0}\\Delta_a"}</M>, and let{" "}
          <M>{"\\varepsilon_t = \\min\\bigl(1, \\frac{cK}{d^2t}\\bigr)"}</M> (<C>decay_eps</C>). Exploration is total until{" "}
          <M>{"t_0 = cK/d^2"}</M> and then falls like 1/t.
        </p>
      </Definition>

      <Theorem title="decaying ε-greedy">
        <p>
          (Auer, Cesa-Bianchi and Fischer, 2002.) For rewards in [0, 1] and c &gt; 5, the probability that this ε-greedy pulls a
          given suboptimal arm at round <M>{"t \\ge t_0"}</M> is at most <M>{"c/(d^2t)"}</M> plus terms of smaller order, so{" "}
          <M>{"\\mathbb{E}N_a(T) \\le \\frac{c}{d^2}\\log T + O(1)"}</M> and
        </p>
        <MD>{"R_T \\le \\frac{c\\log T}{d^2}\\sum_a\\Delta_a + O(1)."}</MD>
      </Theorem>
      <Proof>
        <p>
          A sketch of the main terms. The expected number of exploration rounds up to t is{" "}
          <M>{"\\sum_{s \\le t}\\varepsilon_s \\approx t_0\\bigl(1 + \\log(t/t_0)\\bigr)"}</M> (<C>expected_explores</C> sums it exactly
          and <C>log_explores</C> gives the approximation), so each arm has been explored about <M>{"(c/d^2)\\log t"}</M> times by
          round t. Exploration picks a given arm with probability <M>{"\\varepsilon_t/K = c/(d^2t)"}</M>, which is the first term.
          Exploitation picks a suboptimal arm only if its average or the best arm&apos;s is off by at least half a gap, and after n
          samples Hoeffding&apos;s inequality (m15.1.2) bounds this by <M>{"e^{-2n(d/2)^2} = e^{-nd^2/2}"}</M>. With{" "}
          <M>{"n \\approx (c/d^2)\\log t"}</M> this is about <M>{"t^{-c/2}"}</M>, which is <M>{"o(1/t)"}</M> once c &gt; 2; making this
          rigorous when the counts are random costs the stronger condition c &gt; 5. Summing <M>{"c/(d^2t)"}</M> over t gives the
          logarithm.
        </p>
        <Code>{COUNT}</Code>
      </Proof>

      <Remark title="the price of not knowing the gap">
        <p>
          The rate depends on d, a lower bound on the smallest gap. Choosing d too large means exploration stops before the close
          arms are told apart, and the regret can become linear again; choosing it too small wastes <M>{"t_0 = cK/d^2"}</M> rounds
          of pure exploration and inflates the constant. In the picture the schedule is given the true smallest gap 0.2, and it
          beats every constant ε. Exploration is also blind: an arm already known to be terrible is explored as often as a
          promising one. Upper confidence bounds (l6.1.3) fix both faults by exploring only arms that might still be best.
          ε-greedy survives because it needs nothing but an argmax, which is why it drives exploration in Q-learning (l6.4.5)
          and in deep Q-networks (l6.5.2), usually with ε lowered linearly from 1 to a small floor.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fee",
      rung: "check",
      prompt: (
        <p>
          Three arms have gaps 0, 0.1 and 0.2. About how much regret does ε-greedy with constant ε = 0.1 incur from exploration
          alone over T = 10000 rounds, using <M>{"\\varepsilon T\\sum_a\\Delta_a/K"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 100, tolerance: 0.001 },
    },
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          With K = 2, c = 5 and d = 0.5, what is <M>{"\\sum_{t=1}^{10000}\\min\\bigl(1, \\frac{cK}{d^2t}\\bigr)"}</M>, the expected
          number of exploration rounds? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 260.3625, tolerance: 0.00006 },
    },
    {
      key: "decay",
      rung: "apply",
      prompt: <p>Why does a rate <M>{"\\varepsilon_t"}</M> proportional to 1/t give logarithmic regret?</p>,
      answer: {
        kind: "choice",
        options: [
          "The expected number of exploration rounds is the sum of the rates, which grows like log T, while still sampling every arm often enough to tell the gaps apart",
          "Exploration stops completely after a fixed number of rounds",
          "A rate of 1/t makes the averages exact after the first round",
          "The regret of any algorithm is logarithmic once it explores",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def argmax(xs):
    best = 0
    for i in range(1, len(xs)):
        if xs[i] > xs[best]:
            best = i
    return best

def eps_greedy(means, T, eps, rng):
    K = len(means)
    counts, sums = [0] * K, [0.0] * K
    for t in range(T):
        if t < K:
            a = t
        elif rng.random() < eps:
            a = rng.randrange(K)
        else:
            a = argmax([s / n for s, n in zip(sums, counts)])
        counts[a] += 1
        sums[a] += rng.gauss(means[a], 1)
    return counts

def decay_eps(t, c, delta, K):
    return min(1.0, c * K / (delta ** 2 * t))

import random; print(argmax([1, 3, 3, 2]), argmax([-1, -2]), eps_greedy([0, 50], 6, 0, random.Random(0)))
print(eps_greedy([0, 0, 50], 5, 1, random.Random(4)), decay_eps(10, 1, 0.5, 2), decay_eps(100, 1, 0.5, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1 0 [1, 5]\n[1, 3, 1] 0.8 0.08",
          "2 0 [1, 5]\n[1, 3, 1] 0.8 0.08",
          "1 0 [0, 6]\n[1, 3, 1] 0.8 0.08",
          "1 0 [1, 5]\n[1, 1, 3] 1.0 0.08",
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

def explore_regret(deltas, eps, T):
    return eps * T * sum(deltas) / len(deltas)

def expected_explores(T, c, delta, K):
    return sum(min(1.0, c * K / (delta ** 2 * t)) for t in range(1, T + 1))

def log_explores(T, c, delta, K):
    t0 = c * K / delta ** 2
    if T <= t0:
        return T
    return t0 * (1 + math.log(T / t0))

print(explore_regret([0, 1, 2], 0.3, 100), round(expected_explores(10, 1, 1, 2), 4))
print(log_explores(1.5, 1, 1, 2), round(log_explores(20, 1, 1, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "30.0 4.8579\n1.5 6.6052",
          "90.0 4.8579\n1.5 6.6052",
          "30.0 2.9290\n1.5 6.6052",
          "30.0 4.8579\n2 6.6052",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>argmax(xs)</C>, the first index of a largest entry; <C>eps_greedy(means, T, eps, rng)</C>, which pulls arms 0, …,
          K − 1 once each and afterwards explores with <C>rng.randrange(K)</C> when <C>rng.random() &lt; eps</C> and otherwise
          exploits, with rewards <C>rng.gauss(means[a], 1)</C>, returning the pull counts; and <C>decay_eps(t, c, delta, K)</C>, the
          decaying rate.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def argmax(xs):
    return 0

def eps_greedy(means, T, eps, rng):
    return [0] * len(means)

def decay_eps(t, c, delta, K):
    return 0.0
`,
        solution: EPSG,
        tests: [
          { name: "argmax", code: `assert argmax([1, 3, 3, 2]) == 1 and argmax([-1, -2]) == 0 and argmax([0, 0, 5]) == 2 and argmax([7]) == 0
assert decay_eps(1, 1, 1, 2) == 1.0 and decay_eps(80, 5, 0.5, 2) == 0.5 and decay_eps(100, 1, 0.5, 2) == 0.08` },
          { name: "eps", code: `import random
assert eps_greedy([0, 50], 6, 0, random.Random(0)) == [1, 5] and eps_greedy([0, 0, 50], 20, 0, random.Random(1)) == [1, 1, 18]
c = eps_greedy([0, 0, 50], 3000, 1, random.Random(0)); assert sum(c) == 3000 and all(900 < n < 1100 for n in c)
c = eps_greedy([0, 50], 1000, 0.2, random.Random(0)); assert 850 < c[1] < 930` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>explore_regret(deltas, eps, T)</C>, the value <M>{"\\varepsilon T\\sum_a\\Delta_a/K"}</M>;{" "}
          <C>expected_explores(T, c, delta, K)</C>, the sum of the decaying rates over t = 1, …, T; and{" "}
          <C>log_explores(T, c, delta, K)</C>, which returns T if <M>{"T \\le t_0"}</M> and{" "}
          <M>{"t_0(1 + \\log(T/t_0))"}</M> otherwise.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def explore_regret(deltas, eps, T):
    return 0.0

def expected_explores(T, c, delta, K):
    return 0.0

def log_explores(T, c, delta, K):
    return 0.0
`,
        solution: COUNT,
        tests: [
          { name: "regret", code: `assert explore_regret([0, 0.5], 0.1, 1000) == 25 and explore_regret([0, 1, 2], 0.3, 100) == 30 and explore_regret([0, 0], 1, 9) == 0
assert abs(expected_explores(4, 1, 1, 2) - (1 + 1 + 2 / 3 + 1 / 2)) < 1e-12 and expected_explores(3, 10, 1, 1) == 3` },
          { name: "log", code: `import math
assert log_explores(1.5, 1, 1, 2) == 1.5 and log_explores(2, 1, 1, 2) == 2 and abs(log_explores(8, 1, 1, 2) - 2 * (1 + math.log(4))) < 1e-12
assert abs(log_explores(10000, 5, 0.5, 2) - 40 * (1 + math.log(250))) < 1e-9` },
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: (
        <p>
          With K = 2, c = 5 and d = 0.5, what is the smallest horizon T for which the decaying schedule&apos;s expected number of
          exploration rounds, <M>{"\\sum_{t=1}^T\\min(1, cK/(d^2t))"}</M>, is less than 0.05T, the number made by a constant ε = 0.05?
        </p>
      ),
      answer: { kind: "numeric", value: 4584, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        ε-greedy explores at random. A smarter learner explores where it is uncertain: it adds to each arm&apos;s average a bonus
        that is large for rarely pulled arms, and pulls the arm with the highest total. This principle of optimism in the face
        of uncertainty, the subject of the next lesson (l6.1.3), reaches logarithmic regret without knowing any gap.
      </p>
    </>
  ),
};
