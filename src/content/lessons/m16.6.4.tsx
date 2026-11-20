import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LaiRobbinsViz } from "@/components/viz/LaiRobbinsViz";
import type { LessonContent } from "@/lib/types";

const UCB = `import math

def ucb_index(mean, n, t):
    return mean + math.sqrt(2 * math.log(t) / n)

def ucb_choose(sums, counts, t):
    for i, n in enumerate(counts):
        if n == 0:
            return i
    return max(range(len(counts)), key=lambda i: ucb_index(sums[i] / counts[i], counts[i], t))

def ucb_regret_bound(gaps, T):
    return sum(8 * math.log(T) / d + (1 + math.pi ** 2 / 3) * d for d in gaps if d > 0)`;

const POSTERIOR = `import math

def bernoulli_kl(p, q):
    s = 0.0
    if p > 0:
        s += p * math.log(p / q)
    if p < 1:
        s += (1 - p) * math.log((1 - p) / (1 - q))
    return s

def lai_robbins_constant(means):
    best = max(means)
    return sum((best - m) / bernoulli_kl(m, best) for m in means if m < best)

def beta_update(params, arm, reward):
    a, b = params[arm]
    out = params[:]
    out[arm] = (a + reward, b + 1 - reward)
    return out`;

export const lesson: LessonContent = {
  id: "m16.6.4",
  minutes: 50,
  links: {
    requires: ["m16.6.3", "m15.1.2", "m12.2.1"],
    revisits: ["l6.1.3", "l6.1.4"],
    foreshadows: ["m16.7.4"],
  },

  puzzle: (
    <>
      <p>
        Upper confidence bounds and Thompson sampling are the two standard answers to the explore–exploit dilemma, and in
        practice both work. But how well can any strategy do? If two arms differ by Δ, some number of pulls of the worse
        arm is unavoidable, since otherwise you could not tell them apart. How many, exactly, and do these algorithms reach
        that number?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        To be sure an arm is worse by Δ you need about 1/Δ² samples of it, and you need that certainty to hold for a time
        horizon T, which costs a log T factor. So a suboptimal arm must be pulled about log T / Δ² times, giving regret
        about log T / Δ. UCB achieves this up to constants by pulling an arm whenever it could plausibly be best; Thompson
        sampling achieves the exact constant by pulling each arm with the posterior probability that it is best.
      </p>
      <LaiRobbinsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stochastic bandits and pseudo-regret">
        <p>
          Arm i gives independent rewards in [0, 1] with mean <M>{"\\mu_i"}</M>; let <M>{"\\mu^* = \\max_i \\mu_i"}</M>,{" "}
          <M>{"\\Delta_i = \\mu^* - \\mu_i"}</M> and <M>{"N_i(T)"}</M> the number of pulls of arm i in T rounds. The regret is
        </p>
        <MD>{"R_T = T\\mu^* - \\mathbb E \\sum_{t=1}^T \\mu_{A_t} = \\sum_i \\Delta_i\\, \\mathbb E N_i(T)."}</MD>
      </Definition>

      <Theorem title="UCB1">
        <p>
          After pulling each arm once, UCB1 pulls the arm maximising <M>{"\\hat\\mu_i + \\sqrt{2\\ln t / n_i}"}</M>. For every
          suboptimal arm <M>{"\\mathbb E N_i(T) \\le 8\\ln T/\\Delta_i^2 + 1 + \\pi^2/3"}</M>, so
        </p>
        <MD>{"R_T \\le \\sum_{i: \\Delta_i > 0} \\Big(\\frac{8\\ln T}{\\Delta_i} + \\big(1 + \\tfrac{\\pi^2}{3}\\big)\\Delta_i\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Fix a suboptimal arm i and let <M>{"\\ell = \\lceil 8\\ln T/\\Delta_i^2 \\rceil"}</M>. If arm i is pulled at time t after{" "}
          <M>{"n_i \\ge \\ell"}</M> pulls, then its index beats the best arm&apos;s, so one of three things holds: the best arm&apos;s mean
          is underestimated by more than its width, arm i&apos;s mean is overestimated by more than its width, or{" "}
          <M>{"\\Delta_i < 2\\sqrt{2\\ln t / n_i}"}</M>. The third fails because <M>{"n_i \\ge \\ell"}</M>. By Hoeffding (m15.1.2) each of the first
          two has probability at most <M>{"t^{-4}"}</M> for each possible pair of counts, and summing over at most t² pairs and over
          t gives at most <M>{"2\\sum_t t^{-2} = \\pi^2/3"}</M>. Add ℓ for the pulls before the threshold (<C>ucb_regret_bound</C>).
        </p>
        <Code>{UCB}</Code>
      </Proof>

      <Theorem title="gap-free bound">
        <p>UCB1 also satisfies <M>{"R_T = O(\\sqrt{KT\\ln T})"}</M> for every instance with K arms.</p>
      </Theorem>
      <Proof>
        <p>
          Split the arms at a threshold ε. Arms with <M>{"\\Delta_i < \\varepsilon"}</M> cost at most εT in total. The others cost{" "}
          <M>{"O(\\ln T/\\Delta_i) \\le O(\\ln T/\\varepsilon)"}</M> each. Choosing <M>{"\\varepsilon = \\sqrt{K\\ln T/T}"}</M> balances the two.
          The bound is tight up to the log factor: on some instance every algorithm has regret at least of order √(KT).
        </p>
      </Proof>

      <Theorem title="Lai and Robbins">
        <p>
          For Bernoulli arms, any algorithm whose regret is <M>{"o(T^a)"}</M> for every a &gt; 0 on every instance satisfies, for each
          suboptimal arm,
        </p>
        <MD>{"\\liminf_{T\\to\\infty} \\frac{\\mathbb E N_i(T)}{\\ln T} \\ge \\frac{1}{\\mathrm{KL}(\\mu_i \\,\\|\\, \\mu^*)}, \\qquad \\text{so} \\qquad \\liminf_{T\\to\\infty}\\frac{R_T}{\\ln T} \\ge \\sum_{i: \\Delta_i > 0} \\frac{\\Delta_i}{\\mathrm{KL}(\\mu_i \\,\\|\\, \\mu^*)}."}</MD>
      </Theorem>
      <Proof>
        <p>
          A sketch of the change of measure. Raise arm i&apos;s mean to just above <M>{"\\mu^*"}</M>. In the new instance a good algorithm
          must pull arm i all but <M>{"o(T^a)"}</M> times, in the old one only <M>{"o(T^a)"}</M> times. Telling the instances apart requires
          the log-likelihood ratio of arm i&apos;s rewards, whose expectation is <M>{"\\mathbb E N_i \\cdot \\mathrm{KL}"}</M> (m12.2.1), to reach about{" "}
          <M>{"\\ln T"}</M>; otherwise the two worlds produce the same behaviour with too high a probability. Since{" "}
          <M>{"\\mathrm{KL}(\\mu_i\\|\\mu^*) \\ge 2\\Delta_i^2"}</M> by Pinsker, this matches UCB1&apos;s <M>{"\\ln T/\\Delta_i^2"}</M> up to constants (
          <C>bernoulli_kl</C>, <C>lai_robbins_constant</C>).
        </p>
      </Proof>

      <Theorem title="Thompson sampling">
        <p>
          With independent Beta(1, 1) priors, Thompson sampling draws <M>{"\\theta_i \\sim \\mathrm{Beta}(a_i, b_i)"}</M> for every arm,
          pulls the arm with the largest draw and adds the reward to <M>{"a_i"}</M> or its complement to <M>{"b_i"}</M>{" "}
          (<C>beta_update</C>). For Bernoulli arms it attains the Lai–Robbins constant exactly (Kaufmann, Korda and Munos; Agrawal
          and Goyal). Its Bayesian regret, averaged over a prior on the means, is <M>{"O(\\sqrt{KT\\ln T})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          We prove the Bayesian bound (Russo and Van Roy). Let <M>{"A^*"}</M> be the best arm and <M>{"U_t(i)"}</M> any upper confidence
          bound computed from the history. Given the history, <M>{"A_t"}</M> and <M>{"A^*"}</M> have the same distribution, because both
          are the argmax of a draw from the posterior. Hence <M>{"\\mathbb E\\, U_t(A_t) = \\mathbb E\\, U_t(A^*)"}</M> and
        </p>
        <MD>{"\\mathbb E[\\mu_{A^*} - \\mu_{A_t}] = \\mathbb E[\\mu_{A^*} - U_t(A^*)] + \\mathbb E[U_t(A_t) - \\mu_{A_t}]."}</MD>
        <p>
          With the UCB1 widths the first term is negative except with probability about <M>{"t^{-2}"}</M>, and the second sums over t to{" "}
          <M>{"\\sum_i \\sum_{n \\le N_i} \\sqrt{2\\ln T / n} \\le \\sqrt{8KT\\ln T}"}</M> by Cauchy–Schwarz. Thompson sampling never computes{" "}
          <M>{"U_t"}</M>; the bound holds for whichever confidence bounds are best, which is why it adapts so well.
        </p>
        <Code>{POSTERIOR}</Code>
      </Proof>

      <Remark title="adversarial bandits">
        <p>
          If the rewards are chosen by an adversary, confidence intervals mean nothing. EXP3 runs Hedge (m16.6.3) on importance
          weighted estimates <M>{"\\hat\\ell_{t,i} = \\ell_{t,i}\\mathbb 1[A_t = i]/p_{t,i}"}</M>, which are unbiased, and achieves regret{" "}
          <M>{"O(\\sqrt{TK\\ln K})"}</M>: the price of seeing one loss instead of K is a factor of about <M>{"\\sqrt{K}"}</M>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pulls",
      rung: "check",
      prompt: <p>In the UCB1 analysis, how many pulls 8 ln T / Δ² of a suboptimal arm with gap 0.2 are allowed before the threshold, with T = 10000? Give the nearest integer.</p>,
      answer: { kind: "numeric", value: 1842, tolerance: 1 },
    },
    {
      key: "kl",
      rung: "check",
      prompt: <p>What is KL(0.5 ‖ 0.75) between Bernoulli distributions, in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.1438, tolerance: 0.0001 },
    },
    {
      key: "symmetry",
      rung: "apply",
      prompt: <p>Which fact drives the Bayesian regret bound for Thompson sampling?</p>,
      answer: {
        kind: "choice",
        options: [
          "Given the history, the arm it pulls and the truly best arm have the same distribution",
          "The posterior concentrates on the best arm after K rounds",
          "It pulls every arm exactly ln T times",
          "Its draws are always above the true means",
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

def ucb_choose(sums, counts, t):
    for i, n in enumerate(counts):
        if n == 0:
            return i
    return max(range(len(counts)), key=lambda i: ucb_index(sums[i] / counts[i], counts[i], t))

def ucb_regret_bound(gaps, T):
    return sum(8 * math.log(T) / d + (1 + math.pi ** 2 / 3) * d for d in gaps if d > 0)

print(ucb_index(0.5, 2, math.e), ucb_choose([1.0, 0.0, 3.0], [2, 0, 4], 7), ucb_choose([0.0, 4.0], [1, 8], math.e ** 4))
print(round(ucb_regret_bound([0.0, 2.0], math.e), 3), ucb_regret_bound([], 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.5 1 0\n12.58 0",
          "1.5 2 0\n12.58 0",
          "1.5 1 1\n12.58 0",
          "1.0 1 0\n10.58 0",
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

def bernoulli_kl(p, q):
    s = 0.0
    if p > 0:
        s += p * math.log(p / q)
    if p < 1:
        s += (1 - p) * math.log((1 - p) / (1 - q))
    return s

def lai_robbins_constant(means):
    best = max(means)
    return sum((best - m) / bernoulli_kl(m, best) for m in means if m < best)

def beta_update(params, arm, reward):
    a, b = params[arm]
    out = params[:]
    out[arm] = (a + reward, b + 1 - reward)
    return out

print(bernoulli_kl(0.5, 0.5), bernoulli_kl(1.0, 0.5) == math.log(2), round(lai_robbins_constant([0.5, 0.25, 0.75]), 4))
print(beta_update([(1, 1), (2, 5)], 1, 1), beta_update([(1, 1)], 0, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 True 2.6483\n[(1, 1), (3, 5)] [(1, 2)]",
          "0.0 True 2.6483\n[(1, 1), (2, 6)] [(1, 2)]",
          "0.0 False 2.6483\n[(1, 1), (3, 5)] [(1, 2)]",
          "0.0 True 1.7380\n[(1, 1), (3, 5)] [(2, 1)]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ucb_index(mean, n, t)</C>, <C>ucb_choose(sums, counts, t)</C> returning the first unpulled arm if there is one
          and otherwise the arm with the largest index (the lowest such on ties), and <C>ucb_regret_bound(gaps, T)</C>, which
          skips zero gaps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ucb_index(mean, n, t):
    return mean

def ucb_choose(sums, counts, t):
    return 0

def ucb_regret_bound(gaps, T):
    return 0.0
`,
        solution: UCB,
        tests: [
          { name: "index", code: `assert abs(ucb_index(0.25, 8, math.e ** 4) - 1.25) < 1e-12 and ucb_choose([2.0, 1.0, 0.0], [3, 2, 0], 6) == 2 and ucb_choose([3.0, 1.0], [4, 1], math.e) == 1 and ucb_choose([1.0, 1.0], [2, 2], 9) == 0` },
          { name: "bound", code: `assert abs(ucb_regret_bound([0.0, 0.5, 4.0], math.e ** 2) - (32 + 4 + 4.5 * (1 + math.pi ** 2 / 3))) < 1e-9 and ucb_regret_bound([0.0], 50) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bernoulli_kl(p, q)</C> with the convention 0 log 0 = 0, <C>lai_robbins_constant(means)</C> summing{" "}
          <M>{"\\Delta_i/\\mathrm{KL}(\\mu_i\\|\\mu^*)"}</M> over suboptimal arms, and <C>beta_update(params, arm, reward)</C> returning a new
          list of (a, b) pairs without changing the old one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def bernoulli_kl(p, q):
    return (p - q) ** 2

def lai_robbins_constant(means):
    return 0.0

def beta_update(params, arm, reward):
    return params
`,
        solution: POSTERIOR,
        tests: [
          { name: "divergence", code: `assert abs(bernoulli_kl(0.0, 0.75) - math.log(4)) < 1e-12 and abs(bernoulli_kl(0.25, 0.5) - (0.25 * math.log(0.5) + 0.75 * math.log(1.5))) < 1e-12 and abs(lai_robbins_constant([0.0, 0.75]) - 0.75 / math.log(4)) < 1e-12 and lai_robbins_constant([0.3, 0.3]) == 0` },
          { name: "posterior", code: `P = [(1, 1), (4, 2)]; Q = beta_update(P, 0, 1)
assert Q == [(2, 1), (4, 2)] and P == [(1, 1), (4, 2)] and beta_update(Q, 1, 0) == [(2, 1), (4, 3)]` },
        ],
      },
    },
    {
      key: "asymptote",
      rung: "stretch",
      prompt: (
        <p>
          Two Bernoulli arms have means 0.9 and 0.8. Using the Lai–Robbins constant as the slope, what regret does an
          asymptotically optimal algorithm have after T = 10⁶ rounds, ignoring lower-order terms? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 31.1, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        The bounds of this course so far say that more capacity needs more data. Modern networks fit their training sets
        exactly with far more parameters than examples, and still generalise. The last part looks at what the classical
        theory misses, starting with the double descent curve.
      </p>
    </>
  ),
};
