import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { VarDecompViz } from "@/components/viz/VarDecompViz";
import type { LessonContent } from "@/lib/types";

const TOTAL = `def total_mean(ps, means):
    return sum(p * m for p, m in zip(ps, means))

def total_var(ps, means, variances):
    mu = total_mean(ps, means)
    within = sum(p * v for p, v in zip(ps, variances))
    between = sum(p * (m - mu) ** 2 for p, m in zip(ps, means))
    return within, between, within + between`;

const RSUM = `import numpy as np

def random_sum_moments(en, vn, ex, vx):
    return en * ex, en * vx + vn * ex ** 2

def sim_random_sum(rng, lam, mu, reps):
    n = rng.poisson(lam, reps)
    s = np.array([rng.exponential(mu, k).sum() for k in n])
    return float(s.mean()), float(s.var())`;

export const lesson: LessonContent = {
  id: "m7.6.2",
  minutes: 60,
  links: {
    requires: ["m7.6.1", "m7.2.4"],
    revisits: ["m7.1.3", "m7.2.2"],
    foreshadows: ["m7.6.3", "m7.8.4"],
  },

  puzzle: (
    <>
      <p>
        An insurer receives a Poisson number of claims a year, about 3 on average, and each claim is an independent random
        amount averaging 2 lakh. The expected total is clearly 6 lakh. But how variable is the total? Two sources of
        randomness are stacked, the count and the sizes, and the answer needs a rule for adding up uncertainty in layers.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Averaging the group averages, weighted by group size, gives the overall average. Spread is subtler: the overall
        spread is the typical spread inside a group plus the spread of the group averages themselves. The figure makes the
        two parts visible.
      </p>
      <VarDecompViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="law of total expectation (Adam's law)">
        <MD>{"E\\big[E[Y \\mid X]\\big] = E[Y]."}</MD>
        <p>
          For a partition <M>{"A_1, \\dots, A_k"}</M> of positive-probability events this reads{" "}
          <M>{"E[Y] = \\sum_i E[Y \\mid A_i] P(A_i)"}</M>, the expectation version of the law of total probability.
        </p>
      </Theorem>
      <Proof>
        <p>For discrete X and Y, with g(x) = E[Y | X = x],</p>
        <MD>{"E[g(X)] = \\sum_x p_X(x) \\sum_y y \\frac{p(x, y)}{p_X(x)} = \\sum_x \\sum_y y\\, p(x, y) = \\sum_y y\\, p_Y(y) = E[Y]."}</MD>
        <p>The density case replaces the sums by integrals in the same way.</p>
      </Proof>

      <Example title="first-step analysis">
        <p>
          Toss a coin with heads probability p until the first head; let T be the number of tosses. Condition on the first
          toss: if it is heads, T = 1; if tails, the process restarts, so <M>{"E[T \\mid \\text{tails}] = 1 + E[T]"}</M>. Then{" "}
          <M>{"E[T] = p \\cdot 1 + (1 - p)(1 + E[T])"}</M>, giving <M>{"E[T] = 1/p"}</M> without summing a series. The same
          trick handles expected hitting times of random walks and Markov chains.
        </p>
      </Example>

      <Theorem title="law of total variance (Eve's law)">
        <MD>{"\\operatorname{Var}(Y) = E\\big[\\operatorname{Var}(Y \\mid X)\\big] + \\operatorname{Var}\\big(E[Y \\mid X]\\big),"}</MD>
        <p>
          where <M>{"\\operatorname{Var}(Y \\mid X) = E[Y^2 \\mid X] - E[Y \\mid X]^2"}</M> is the variance of the conditional
          distribution, as a random variable.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"G = E[Y \\mid X]"}</M>. By Adam&apos;s law applied to <M>{"Y^2"}</M>,{" "}
          <M>{"E[\\operatorname{Var}(Y \\mid X)] = E[E[Y^2 \\mid X]] - E[G^2] = E[Y^2] - E[G^2]"}</M>. By Adam&apos;s law applied to
          Y, <M>{"E[G] = E[Y]"}</M>, so <M>{"\\operatorname{Var}(G) = E[G^2] - E[Y]^2"}</M>. Adding,{" "}
          <M>{"E[Y^2] - E[Y]^2 = \\operatorname{Var}(Y)"}</M>.
        </p>
      </Proof>
      <p>
        The first term is the unexplained, within-group variance; the second is the explained, between-group variance. For
        groups with probabilities <M>{"p_i"}</M>, means <M>{"m_i"}</M> and variances <M>{"v_i"}</M>, both are weighted sums.
        Heights in a population of three groups with weights 0.5, 0.3, 0.2, means 160, 170, 180 cm and variances 25, 36, 16:
      </p>
      <Code>{TOTAL}</Code>
      <p>
        The mean is 167 cm, the within part 26.5 and the between part 61, so 61/87.5 ≈ 70% of the variance of height is
        explained by group in this made-up population. That ratio is the population version of R².
      </p>

      <Example title="random sums">
        <p>
          Let <M>{"S = X_1 + \\dots + X_N"}</M>, where N is a count and the <M>{"X_i"}</M> are i.i.d. and independent of N.
          Given N = n, S has mean <M>{"n\\,E[X]"}</M> and variance <M>{"n\\operatorname{Var}(X)"}</M>. So
        </p>
        <MD>{"E[S] = E[N]E[X], \\qquad \\operatorname{Var}(S) = E[N]\\operatorname{Var}(X) + \\operatorname{Var}(N)\\,E[X]^2."}</MD>
        <p>
          For the insurer, N ~ Poisson(3) and claims exponential with mean 2 (variance 4): Var(S) = 3·4 + 3·4 = 24, so the
          standard deviation is about 4.9 lakh, most of a year&apos;s expected total. A simulation agrees.
        </p>
        <Code>{RSUM}</Code>
      </Example>

      <Remark title="the general picture">
        <p>
          With the general definition, Adam&apos;s law is the case h = 1 of <M>{"E[E[Y \\mid X]h(X)] = E[Yh(X)]"}</M>, and it extends
          to the tower property <M>{"E[E[Y \\mid X, Z] \\mid X] = E[Y \\mid X]"}</M>: averaging in stages, coarser last, is the
          same as averaging once. Martingales and the analysis of reinforcement learning returns are built on it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "adam",
      rung: "check",
      prompt: (
        <p>
          60% of bulbs come from machine A, with mean lifetime 10 months, and 40% from machine B, with mean 5 months. What is
          the mean lifetime of a random bulb?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.0001 },
    },
    {
      key: "eve",
      rung: "check",
      prompt: <p>In the same setting the lifetime variances are 4 for A and 1 for B. What is the variance of a random bulb&apos;s lifetime?</p>,
      answer: { kind: "numeric", value: 8.8, tolerance: 0.0001 },
    },
    {
      key: "shop",
      rung: "apply",
      prompt: (
        <p>
          A shop gets N ~ Poisson(4) customers an hour, each spending an independent amount with mean 50 and standard
          deviation 10, independent of N. What is the variance of the hour&apos;s takings?
        </p>
      ),
      answer: { kind: "choice", options: ["10400", "400", "10000", "40400"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def total_mean(ps, means):
    return sum(p * m for p, m in zip(ps, means))

def total_var(ps, means, variances):
    mu = total_mean(ps, means)
    within = sum(p * v for p, v in zip(ps, variances))
    between = sum(p * (m - mu) ** 2 for p, m in zip(ps, means))
    return within, between, within + between

ps, means, vs = [0.5, 0.3, 0.2], [160, 170, 180], [25, 36, 16]
print(total_mean(ps, means), total_var(ps, means, vs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "167.0 (26.5, 61.00000000000001, 87.5)",
          "167.0 (26.5, 61.00000000000001, 26.5)",
          "167.0 (87.5, 61.00000000000001, 26.5)",
          "167.0 (26.5, 0.0, 26.5)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def random_sum_moments(en, vn, ex, vx):
    return en * ex, en * vx + vn * ex ** 2

def sim_random_sum(rng, lam, mu, reps):
    n = rng.poisson(lam, reps)
    s = np.array([rng.exponential(mu, k).sum() for k in n])
    return float(s.mean()), float(s.var())

print(random_sum_moments(3, 3, 2, 4))
m, v = sim_random_sum(np.random.default_rng(0), 3, 2, 100000)
print(round(m, 1), round(v, 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(6, 24)\n6.0 24.0", "(6, 12)\n6.0 24.0", "(6, 24)\n6.0 12.0", "(6, 21)\n6.0 21.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Groups have probabilities ps, conditional means means and conditional variances variances. Write{" "}
          <C>total_mean(ps, means)</C>, returning E[Y], and <C>total_var(ps, means, variances)</C>, returning the tuple
          (within, between, total) of Eve&apos;s law.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def total_mean(ps, means):
    return 0.0

def total_var(ps, means, variances):
    return 0.0, 0.0, 0.0
`,
        solution: TOTAL,
        tests: [
          { name: "bulbs", code: `assert abs(total_mean([0.6, 0.4], [10, 5]) - 8) < 1e-12
w, b, t = total_var([0.6, 0.4], [10, 5], [4, 1])
assert abs(w - 2.8) < 1e-12 and abs(b - 6) < 1e-12 and abs(t - 8.8) < 1e-12` },
          { name: "against a direct computation", code: `ps, ms, vs = [0.2, 0.5, 0.3], [-1.0, 2.0, 0.5], [1.0, 0.25, 4.0]
EY2 = sum(p * (v + m * m) for p, m, v in zip(ps, ms, vs))
EY = total_mean(ps, ms)
w, b, t = total_var(ps, ms, vs)
assert abs(t - (EY2 - EY ** 2)) < 1e-12 and abs(w - 1.525) < 1e-12
assert total_var([1.0], [3.0], [2.0]) == (2.0, 0.0, 2.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>random_sum_moments(en, vn, ex, vx)</C>, returning (E[S], Var(S)) for a random sum S of N i.i.d. terms
          given the mean and variance of N and of each term, and <C>sim_random_sum(rng, lam, mu, reps)</C>, simulating reps
          copies of S with N ~ Poisson(lam) and exponential terms with mean mu, and returning the sample mean and the sample
          variance (np.var) as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def random_sum_moments(en, vn, ex, vx):
    return en * ex, en * vx

def sim_random_sum(rng, lam, mu, reps):
    return 0.0, 0.0
`,
        solution: RSUM,
        tests: [
          { name: "formula", code: `assert random_sum_moments(3, 3, 2, 4) == (6, 24)
assert random_sum_moments(5, 0, 1.5, 2) == (7.5, 10)
m, v = random_sum_moments(4, 2, 3, 0)
assert m == 12 and v == 18` },
          { name: "simulation", code: `m, v = sim_random_sum(np.random.default_rng(1), 2.0, 3.0, 60000)
assert isinstance(m, float) and isinstance(v, float)
em, ev = random_sum_moments(2.0, 2.0, 3.0, 9.0)
assert abs(m - em) < 0.15 and abs(v - ev) / ev < 0.05` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Assuming Adam&apos;s law <M>{"E[E[Z \\mid X]] = E[Z]"}</M> for any Z with a finite mean, prove Eve&apos;s law{" "}
          <M>{"\\operatorname{Var}(Y) = E[\\operatorname{Var}(Y \\mid X)] + \\operatorname{Var}(E[Y \\mid X])"}</M> for Y with a
          finite second moment.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes Var(Y | X) = E[Y² | X] − G² with G = E[Y | X], and uses Adam's law on Y² to get E[Var(Y | X)] = E[Y²] − E[G²].",
          "Uses Adam's law on Y to get E[G] = E[Y], so Var(G) = E[G²] − E[Y]².",
          "Adds the two to obtain E[Y²] − E[Y]² = Var(Y).",
        ],
      },
    },
    {
      key: "stick",
      rung: "stretch",
      prompt: (
        <p>
          In the broken stick, U ~ Uniform(0, 1) and given U, V ~ Uniform(0, U). Use Eve&apos;s law to find Var(V). Give four
          decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0486, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why averaging conditional averages gives the overall average, how the total variance splits into the average within-group variance and the variance of the group means, and how this gives the variance of a random sum.",

  glimpse: (
    <>
      <p>
        Eve&apos;s law says the part of Var(Y) left over after learning X is E[Var(Y | X)]. The next lesson shows that this
        leftover is the smallest mean squared error any prediction of Y from X can achieve, and that E[Y | X] is the
        prediction that achieves it.
      </p>
    </>
  ),
};
