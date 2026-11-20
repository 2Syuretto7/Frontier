import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ThompsonPosteriorsViz } from "@/components/viz/ThompsonPosteriorsViz";
import type { LessonContent } from "@/lib/types";

const TS = `def beta_stats(a, b):
    mean = a / (a + b)
    return mean, mean * (1 - mean) / (a + b + 1)

def thompson(probs, T, rng):
    K = len(probs)
    wins, losses = [0] * K, [0] * K
    for _ in range(T):
        draws = [rng.betavariate(1 + wins[i], 1 + losses[i]) for i in range(K)]
        a = max(range(K), key=lambda i: draws[i])
        if rng.random() < probs[a]:
            wins[a] += 1
        else:
            losses[a] += 1
    return [w + l for w, l in zip(wins, losses)]

def prob_best(params, n, rng):
    hits = [0] * len(params)
    for _ in range(n):
        draws = [rng.betavariate(a, b) for a, b in params]
        hits[max(range(len(draws)), key=lambda i: draws[i])] += 1
    return [h / n for h in hits]`;

const KL = `import math

def normal_posterior(mu0, var0, rewards, var=1.0):
    prec = 1 / var0 + len(rewards) / var
    mean = (mu0 / var0 + sum(rewards) / var) / prec
    return mean, 1 / prec

def kl_bern(p, q):
    total = 0.0
    if p > 0:
        total += p * math.log(p / q)
    if p < 1:
        total += (1 - p) * math.log((1 - p) / (1 - q))
    return total

def lai_robbins(probs, T):
    best = max(probs)
    return sum((best - p) * math.log(T) / kl_bern(p, best) for p in probs if p < best)`;

export const lesson: LessonContent = {
  id: "l6.1.4",
  minutes: 60,
  links: {
    requires: ["l6.1.3", "m12.2.1"],
    revisits: ["l6.1.1"],
    foreshadows: ["l6.8.1", "l6.2.1"],
  },

  puzzle: (
    <>
      <p>
        In 1933 William Thompson proposed a rule for choosing between two medical treatments: give each patient a treatment with
        exactly the probability, given the results so far, that it is the better one. The rule has no confidence levels, no
        exploration rate and no tuning. For eighty years it was mostly ignored, until experiments showed it beating carefully
        tuned methods on advertising and recommendation. Why does such a simple rule explore just enough?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep a posterior distribution over each arm&apos;s mean. Draw one plausible mean from each posterior and pull the arm whose
        draw is largest. An arm with little data has a wide posterior and so sometimes produces a large draw: it is explored in
        proportion to how plausible it is that it is best. An arm whose posterior lies clearly below another&apos;s almost never
        wins the draw. Uncertainty itself sets the amount of exploration, and it shrinks at exactly the rate the data allow.
      </p>
      <ThompsonPosteriorsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Beta-Bernoulli posterior">
        <p>
          Let arm a pay 1 with unknown probability <M>{"\\theta_a"}</M>, with a uniform prior, which is Beta(1, 1). After{" "}
          <M>{"S_a"}</M> successes and <M>{"F_a"}</M> failures the posterior is <M>{"\\mathrm{Beta}(1 + S_a, 1 + F_a)"}</M>, because the
          likelihood <M>{"\\theta^{S}(1 - \\theta)^{F}"}</M> times the prior density has that form. A Beta(α, β) distribution has
          mean <M>{"m = \\alpha/(\\alpha + \\beta)"}</M> and variance <M>{"m(1 - m)/(\\alpha + \\beta + 1)"}</M> (<C>beta_stats</C>), so
          the posterior narrows like 1/n.
        </p>
      </Definition>

      <Definition title="Thompson sampling">
        <p>
          At each round, draw <M>{"\\tilde\\theta_a"}</M> from each arm&apos;s posterior, pull <M>{"A_t = \\arg\\max_a\\tilde\\theta_a"}</M>,
          observe the reward and update that arm&apos;s posterior (<C>thompson</C>).
        </p>
        <Code>{TS}</Code>
      </Definition>

      <Theorem title="probability matching">
        <p>
          Given the history, Thompson sampling pulls each arm with exactly the posterior probability that it is the best arm.
        </p>
      </Theorem>
      <Proof>
        <p>
          The draws <M>{"\\tilde\\theta"}</M> have the joint posterior distribution of θ, so{" "}
          <M>{"P(A_t = a \\mid \\text{history}) = P(\\arg\\max_b\\tilde\\theta_b = a) = P(\\arg\\max_b\\theta_b = a \\mid \\text{history})"}</M>.
          Estimating these probabilities by repeated draws gives <C>prob_best</C>; Thompson sampling needs only one draw per round.
        </p>
      </Proof>

      <Theorem title="Gaussian posterior">
        <p>
          If rewards are <M>{"N(\\mu, \\sigma^2)"}</M> with σ known and the prior is <M>{"N(\\mu_0, v_0)"}</M>, the posterior after rewards{" "}
          <M>{"x_1, \\dots, x_n"}</M> is normal with precision <M>{"1/v_0 + n/\\sigma^2"}</M> and mean{" "}
          <M>{"(\\mu_0/v_0 + \\sum_i x_i/\\sigma^2)/(1/v_0 + n/\\sigma^2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The log posterior is, up to a constant,{" "}
          <M>{"-\\frac{(\\mu - \\mu_0)^2}{2v_0} - \\sum_i\\frac{(x_i - \\mu)^2}{2\\sigma^2}"}</M>, a quadratic in μ with coefficient of{" "}
          <M>{"-\\mu^2/2"}</M> equal to the stated precision and coefficient of μ equal to{" "}
          <M>{"\\mu_0/v_0 + \\sum_i x_i/\\sigma^2"}</M>. Completing the square gives the normal density (<C>normal_posterior</C>). The
          posterior mean is a precision-weighted average of the prior mean and the sample mean, and Thompson sampling for
          Gaussian arms draws from these normals.
        </p>
        <Code>{KL}</Code>
      </Proof>

      <Theorem title="Thompson sampling is asymptotically optimal">
        <p>
          (Agrawal and Goyal, 2012; Kaufmann, Korda and Munos, 2012.) For Bernoulli arms and every ε &gt; 0,
        </p>
        <MD>{"\\mathbb{E}N_a(T) \\le (1 + \\varepsilon)\\frac{\\log T}{\\mathrm{KL}(\\theta_a, \\theta^*)} + O_\\varepsilon(1),"}</MD>
        <p>
          where <M>{"\\mathrm{KL}(p, q) = p\\log\\frac pq + (1 - p)\\log\\frac{1 - p}{1 - q}"}</M> is the divergence between Bernoulli
          distributions (m12.2.1, <C>kl_bern</C>). The Lai–Robbins lower bound for Bernoulli arms is{" "}
          <M>{"\\liminf\\mathbb{E}N_a(T)/\\log T \\ge 1/\\mathrm{KL}(\\theta_a, \\theta^*)"}</M>, so Thompson sampling attains the best
          possible regret, about <M>{"\\sum_a\\Delta_a\\log T/\\mathrm{KL}(\\theta_a, \\theta^*)"}</M> (<C>lai_robbins</C>).
        </p>
      </Theorem>

      <Remark title="comparison with UCB1">
        <p>
          Pinsker&apos;s inequality gives <M>{"\\mathrm{KL}(\\theta_a, \\theta^*) \\ge 2\\Delta_a^2"}</M>, so the optimal count{" "}
          <M>{"\\log T/\\mathrm{KL}"}</M> is at most <M>{"\\log T/(2\\Delta_a^2)"}</M>, against <M>{"8\\log T/\\Delta_a^2"}</M> for UCB1: a
          factor of 16 in the leading constant, and more when the means are near 0 or 1, where the KL is much larger than{" "}
          <M>{"2\\Delta^2"}</M>. The proof of the theorem is long; its core is that a suboptimal arm wins the draw only when its
          posterior still puts noticeable mass above <M>{"\\theta^*"}</M>, which after n pulls has probability about{" "}
          <M>{"e^{-n\\,\\mathrm{KL}(\\theta_a, \\theta^*)}"}</M>.
        </p>
      </Remark>

      <Remark title="beyond bandits">
        <p>
          The same recipe, sample a model from the posterior and act optimally for it, extends to problems with states:
          posterior sampling for reinforcement learning draws a whole environment model each episode and follows its optimal
          policy (l6.8.1). Its weakness is that the posterior must be maintained, which is easy with conjugate priors and hard
          for neural networks, where ensembles or randomised value functions serve as approximations.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mean",
      rung: "check",
      prompt: <p>From a uniform prior, an arm has paid 1 seven times and 0 three times. What is its posterior mean? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.00006 },
    },
    {
      key: "kl",
      rung: "check",
      prompt: <p>What is KL(0.5, 0.6) between Bernoulli distributions, in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0204, tolerance: 0.00006 },
    },
    {
      key: "explore",
      rung: "apply",
      prompt: <p>Thompson sampling has no exploration parameter. What makes it pull an arm whose average so far is low?</p>,
      answer: {
        kind: "choice",
        options: [
          "If the arm has few pulls its posterior is wide, so its draw is sometimes the largest, with the probability that it is in fact the best arm",
          "It pulls every arm uniformly at random a fixed fraction of the time",
          "It adds a bonus of size √(2 log t / n) to each draw",
          "Arms with low averages get a higher prior",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def beta_stats(a, b):
    mean = a / (a + b)
    return mean, mean * (1 - mean) / (a + b + 1)

def thompson(probs, T, rng):
    K = len(probs)
    wins, losses = [0] * K, [0] * K
    for _ in range(T):
        draws = [rng.betavariate(1 + wins[i], 1 + losses[i]) for i in range(K)]
        a = max(range(K), key=lambda i: draws[i])
        if rng.random() < probs[a]:
            wins[a] += 1
        else:
            losses[a] += 1
    return [w + l for w, l in zip(wins, losses)]

def prob_best(params, n, rng):
    hits = [0] * len(params)
    for _ in range(n):
        draws = [rng.betavariate(a, b) for a, b in params]
        hits[max(range(len(draws)), key=lambda i: draws[i])] += 1
    return [h / n for h in hits]

import random; print([round(x, 4) for x in beta_stats(1, 1) + beta_stats(3, 1)], sum(thompson([0, 1], 8, random.Random(0))))
print(prob_best([(50, 1), (1, 50)], 10, random.Random(0)), prob_best([(1, 1)], 3, random.Random(1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.5, 0.0833, 0.75, 0.0375] 8\n[1.0, 0.0] [1.0]",
          "[0.5, 0.0833, 0.75, 0.0469] 8\n[1.0, 0.0] [1.0]",
          "[0.5, 0.25, 0.75, 0.0375] 8\n[1.0, 0.0] [1.0]",
          "[0.5, 0.0833, 0.75, 0.0375] 8\n[0.5, 0.5] [1.0]",
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

def normal_posterior(mu0, var0, rewards, var=1.0):
    prec = 1 / var0 + len(rewards) / var
    mean = (mu0 / var0 + sum(rewards) / var) / prec
    return mean, 1 / prec

def kl_bern(p, q):
    total = 0.0
    if p > 0:
        total += p * math.log(p / q)
    if p < 1:
        total += (1 - p) * math.log((1 - p) / (1 - q))
    return total

def lai_robbins(probs, T):
    best = max(probs)
    return sum((best - p) * math.log(T) / kl_bern(p, best) for p in probs if p < best)

print([round(x, 4) for x in normal_posterior(0, 1, [2, 4])], round(normal_posterior(5, 1e9, [1, 3], 2)[0], 4))
print(round(kl_bern(0.5, 0.75), 4), kl_bern(1, 0.5) == math.log(2), round(lai_robbins([0.5, 0.75], math.e), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0, 0.3333] 2.0\n0.1438 True 1.738",
          "[3.0, 0.3333] 2.0\n0.1438 True 1.738",
          "[2.0, 0.5] 2.0\n0.1438 True 1.738",
          "[2.0, 0.3333] 2.0\n0.1308 True 1.738",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>beta_stats(a, b)</C>, the pair (mean, variance) of Beta(a, b); <C>thompson(probs, T, rng)</C>, which starts every arm
          at Beta(1, 1), each round draws <C>rng.betavariate</C> for arms 0, …, K − 1 in order, pulls the largest draw, and counts a
          success when <C>rng.random() &lt; probs[a]</C>, returning the pull counts; and <C>prob_best(params, n, rng)</C>, the
          fraction of n rounds of draws, one per (a, b) pair in order, in which each arm has the largest draw.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def beta_stats(a, b):
    return (0.0, 0.0)

def thompson(probs, T, rng):
    return [0] * len(probs)

def prob_best(params, n, rng):
    return [0.0] * len(params)
`,
        solution: TS,
        tests: [
          { name: "beta", code: `assert beta_stats(1, 1) == (0.5, 1 / 12) and beta_stats(3, 1) == (0.75, 0.0375) and abs(beta_stats(8, 4)[1] - 32 / (144 * 13)) < 1e-15
import random
c = thompson([0, 1], 200, random.Random(3)); assert sum(c) == 200 and c[1] > 190
c = thompson([0.9, 0.1, 0.1], 500, random.Random(4)); assert c[0] > 470` },
          { name: "best", code: `import random
p = prob_best([(1, 1), (1, 1)], 4000, random.Random(5)); assert abs(sum(p) - 1) < 1e-12 and abs(p[0] - 0.5) < 0.03
p = prob_best([(2, 1), (1, 2)], 2000, random.Random(6)); assert abs(p[0] - 5 / 6) < 0.04 and prob_best([(50, 1), (1, 50), (1, 50)], 10, random.Random(0)) == [1.0, 0.0, 0.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normal_posterior(mu0, var0, rewards, var=1.0)</C>, the pair (mean, variance) of the Gaussian posterior;{" "}
          <C>kl_bern(p, q)</C>, the Bernoulli KL divergence with the convention <M>{"0\\log 0 = 0"}</M>; and{" "}
          <C>lai_robbins(probs, T)</C>, the value <M>{"\\sum_a\\Delta_a\\log T/\\mathrm{KL}(\\theta_a, \\theta^*)"}</M> over the
          suboptimal arms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def normal_posterior(mu0, var0, rewards, var=1.0):
    return (0.0, 0.0)

def kl_bern(p, q):
    return 0.0

def lai_robbins(probs, T):
    return 0.0
`,
        solution: KL,
        tests: [
          { name: "normal", code: `m, v = normal_posterior(1, 4, [3]); assert abs(m - 2.6) < 1e-12 and abs(v - 0.8) < 1e-12
m, v = normal_posterior(0, 1, [2, 4]); assert abs(m - 2) < 1e-12 and abs(v - 1 / 3) < 1e-12 and normal_posterior(7, 2, []) == (7, 2)` },
          { name: "kl", code: `import math
assert kl_bern(0.2, 0.2) == 0 and kl_bern(1, 0.5) == math.log(2) and kl_bern(0, 0.5) == math.log(2) and abs(kl_bern(0.5, 0.75) - 0.5 * math.log(4 / 3)) < 1e-12
assert lai_robbins([0.5, 0.5], 100) == 0 and abs(lai_robbins([0.5, 0.75], math.e) - 0.25 / kl_bern(0.5, 0.75)) < 1e-12` },
        ],
      },
    },
    {
      key: "lr",
      rung: "stretch",
      prompt: (
        <p>
          Three Bernoulli arms have success probabilities 0.6, 0.5 and 0.4. Evaluate the Lai–Robbins regret{" "}
          <M>{"\\sum_a\\Delta_a\\log T/\\mathrm{KL}(\\theta_a, \\theta^*)"}</M> at T = 10000. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 67.8399, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        In every bandit so far the world stays the same: pulling an arm changes what you know but not where you are. The next
        part adds states. An action now earns a reward and also moves the learner to a new situation, with its own actions and
        rewards, so a choice must be judged by everything that follows it. The framework for that is the Markov decision process
        (l6.2.1).
      </p>
    </>
  ),
};
