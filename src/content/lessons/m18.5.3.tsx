import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StoppedWalkViz } from "@/components/viz/StoppedWalkViz";
import type { LessonContent } from "@/lib/types";

const STOPPED = `def stopped_dist(n, top, floor=None):
    dist = {0: 1.0}
    for _ in range(n):
        new = {}
        for s, p in dist.items():
            if s == top or s == floor:
                new[s] = new.get(s, 0) + p
            else:
                for step in (1, -1):
                    new[s + step] = new.get(s + step, 0) + p / 2
        dist = new
    return dist

def dist_mean(dist):
    return sum(s * p for s, p in dist.items())

def prob_at(dist, s):
    return dist.get(s, 0.0)`;

const RUIN = `def ruin_prob(p, a, b):
    if p == 0.5:
        return a / (a + b)
    r = (1 - p) / p
    return (1 - r ** -a) / (r ** b - r ** -a)

def expected_duration(a, b, sweeps=5000):
    e = [0.0] * (a + b + 1)
    for _ in range(sweeps):
        e = [0.0] + [1 + (e[i - 1] + e[i + 1]) / 2 for i in range(1, a + b)] + [0.0]
    return e[a]

def doob_bound(dist, lam):
    return sum(s * p for s, p in dist.items() if s > 0) / lam`;

export const lesson: LessonContent = {
  id: "m18.5.3",
  minutes: 45,
  links: {
    requires: ["m18.5.2"],
    revisits: ["m7.1.3", "m7.8.4"],
    foreshadows: ["m18.5.4", "m18.6.1"],
  },

  puzzle: (
    <>
      <p>
        A fair random walk starting at 0 will, with probability one, eventually reach +1. Stop it there: the stopped value
        is always 1, but every fixed time has mean 0. So &quot;stop when you are ahead&quot; turns a fair game into a sure
        profit? Something must break, and finding exactly what also gives the cleanest proof of the gambler&apos;s ruin
        formula.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Stopping at a random time is fair as long as the decision to stop uses only the past and nothing can run away
        before you stop. Stopping at +1 fails the second condition: before it reaches +1 the walk may sink arbitrarily far,
        for arbitrarily long, and those rare deep excursions carry exactly the negative mass that balances the sure gain.
      </p>
      <StoppedWalkViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stopping times">
        <p>
          A random time T with values in {"{0, 1, 2, …, ∞}"} is a stopping time if <M>{"\\{T \\le n\\} \\in \\mathcal F_n"}</M> for every n: whether you
          have stopped by time n is known at time n. First hitting times of a set are stopping times; the last visit to 0
          before time 100 is not, since it depends on the future.
        </p>
      </Definition>

      <Theorem title="stopped martingales">
        <p>If M is a martingale and T a stopping time, the stopped process <M>{"M_{T \\wedge n}"}</M> is a martingale.</p>
      </Theorem>
      <Proof>
        <p>
          <M>{"M_{T \\wedge n} = M_0 + \\sum_{k=1}^{n} \\mathbb 1[T \\ge k](M_k - M_{k-1})"}</M>, and <M>{"\\{T \\ge k\\} = \\{T \\le k - 1\\}^c \\in \\mathcal F_{k-1}"}</M>, so the stake is
          predictable and bounded. The fair-game theorem of m18.5.2 applies. In particular <M>{"\\mathbb E M_{T \\wedge n} = \\mathbb E M_0"}</M> for every n,
          as the figure shows (<C>stopped_dist</C>, <C>dist_mean</C>).
        </p>
        <Code>{STOPPED}</Code>
      </Proof>

      <Theorem title="optional stopping">
        <p>
          Let M be a martingale and T a stopping time. Then <M>{"\\mathbb E M_T = \\mathbb E M_0"}</M> in each of these cases:
        </p>
        <ul>
          <li>T is bounded;</li>
          <li>T &lt; ∞ almost surely and <M>{"|M_{T \\wedge n}| \\le K"}</M> for all n;</li>
          <li><M>{"\\mathbb E T < \\infty"}</M> and the increments are bounded, <M>{"|M_k - M_{k-1}| \\le c"}</M>.</li>
        </ul>
      </Theorem>
      <Proof>
        <p>
          In each case <M>{"M_{T \\wedge n} \\to M_T"}</M> almost surely and we need to pass the limit through the expectation. A bounded T means{" "}
          <M>{"M_{T \\wedge n} = M_T"}</M> for large n. A bound K gives dominated convergence (m18.2.2). In the third case{" "}
          <M>{"|M_{T \\wedge n} - M_0| \\le cT"}</M>, which is integrable, so dominated convergence again applies. Stopping at +1 meets none of
          them: <M>{"M_{T \\wedge n}"}</M> is unbounded below and <M>{"\\mathbb E T = \\infty"}</M>.
        </p>
      </Proof>

      <Example title="gambler's ruin by martingales">
        <p>
          A fair walk from 0 stops at +b or −a. The stopped walk is bounded, so <M>{"0 = b\\, P(\\text{up}) - a\\,(1 - P(\\text{up}))"}</M> and{" "}
          <M>{"P(\\text{up}) = a/(a + b)"}</M>, the formula of m7.1.3 without solving a recurrence. Applying optional stopping to the martingale{" "}
          <M>{"S_n^2 - n"}</M> (third case, after checking <M>{"\\mathbb E T < \\infty"}</M>) gives <M>{"\\mathbb E T = \\mathbb E S_T^2 = ab"}</M>{" "}
          (<C>expected_duration</C>). For a biased walk with r = (1 − p)/p, the process <M>{"r^{S_n}"}</M> is a martingale, which gives{" "}
          <C>ruin_prob</C>.
        </p>
        <Code>{RUIN}</Code>
      </Example>

      <Theorem title="Doob's maximal inequality">
        <p>For a non-negative submartingale X and λ &gt; 0,</p>
        <MD>{"P\\Big(\\max_{k \\le n} X_k \\ge \\lambda\\Big) \\le \\frac{\\mathbb E\\big[X_n \\mathbb 1[\\max_{k \\le n} X_k \\ge \\lambda]\\big]}{\\lambda} \\le \\frac{\\mathbb E X_n}{\\lambda}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let T be the first k ≤ n with <M>{"X_k \\ge \\lambda"}</M>, and T = n if there is none. On the event A that the maximum reaches λ,{" "}
          <M>{"X_T \\ge \\lambda"}</M>. For a submartingale and bounded stopping times T ≤ n, <M>{"\\mathbb E[X_T \\mathbb 1_A] \\le \\mathbb E[X_n \\mathbb 1_A]"}</M>, since A is
          determined by time T. So <M>{"\\lambda P(A) \\le \\mathbb E[X_T \\mathbb 1_A] \\le \\mathbb E[X_n \\mathbb 1_A]"}</M>. Applied to{" "}
          <M>{"|M_k|"}</M> or <M>{"M_k^+"}</M> for a martingale M, this bounds the whole path by its endpoint (<C>doob_bound</C>). It is Markov&apos;s inequality
          upgraded from one time to a maximum over times.
        </p>
      </Proof>

      <Remark title="Wald's identity">
        <p>
          For a random walk <M>{"S_n = X_1 + \\cdots + X_n"}</M> with i.i.d. integrable steps of mean μ and a stopping time with{" "}
          <M>{"\\mathbb E T < \\infty"}</M>, the martingale <M>{"S_n - n\\mu"}</M> gives <M>{"\\mathbb E S_T = \\mu\\, \\mathbb E T"}</M>. In the doubling strategy
          of m18.5.2 the stopping time has finite mean, but the stakes, and so the increments of the gambler&apos;s fortune, are
          unbounded, so the third condition fails; with a cap on credit the strategy loses its edge.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ruin",
      rung: "check",
      prompt: <p>A fair walk starts at 0 and stops on reaching −3 or +7. What is the probability that it stops at +7?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "duration",
      rung: "check",
      prompt: <p>For the same walk, what is the expected number of steps before it stops?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>T is the first time a fair walk from 0 reaches +1. Why does optional stopping fail for T?</p>,
      answer: {
        kind: "choice",
        options: [
          "T is finite but has infinite mean, and the stopped walk is unbounded below",
          "T is not a stopping time, because it depends on the future",
          "T is infinite with positive probability",
          "The walk is not a martingale",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def stopped_dist(n, top, floor=None):
    dist = {0: 1.0}
    for _ in range(n):
        new = {}
        for s, p in dist.items():
            if s == top or s == floor:
                new[s] = new.get(s, 0) + p
            else:
                for step in (1, -1):
                    new[s + step] = new.get(s + step, 0) + p / 2
        dist = new
    return dist

def dist_mean(dist):
    return sum(s * p for s, p in dist.items())

def prob_at(dist, s):
    return dist.get(s, 0.0)

d = stopped_dist(3, 1); print(sorted(d.items()), dist_mean(d), prob_at(d, 1), prob_at(d, 2))
e = stopped_dist(4, 2, -2); print(sorted(e.items()), dist_mean(e), round(prob_at(stopped_dist(101, 1), 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(-3, 0.125), (-1, 0.25), (1, 0.625)] 0.0 0.625 0.0\n[(-2, 0.375), (0, 0.25), (2, 0.375)] 0.0 0.921",
          "[(-3, 0.125), (-1, 0.375), (1, 0.5)] 0.0 0.5 0.0\n[(-2, 0.375), (0, 0.25), (2, 0.375)] 0.0 0.921",
          "[(-3, 0.125), (-1, 0.25), (1, 0.625)] 0.25 0.625 0.0\n[(-2, 0.25), (0, 0.5), (2, 0.25)] 0.0 1.0",
          "[(-3, 0.125), (-1, 0.25), (1, 0.625)] 0.0 0.625 0.125\n[(-2, 0.375), (0, 0.25), (2, 0.375)] 0.0 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ruin_prob(p, a, b):
    if p == 0.5:
        return a / (a + b)
    r = (1 - p) / p
    return (1 - r ** -a) / (r ** b - r ** -a)

def expected_duration(a, b, sweeps=5000):
    e = [0.0] * (a + b + 1)
    for _ in range(sweeps):
        e = [0.0] + [1 + (e[i - 1] + e[i + 1]) / 2 for i in range(1, a + b)] + [0.0]
    return e[a]

def doob_bound(dist, lam):
    return sum(s * p for s, p in dist.items() if s > 0) / lam

print(ruin_prob(0.5, 2, 6), round(ruin_prob(0.6, 1, 1), 4), round(expected_duration(2, 2), 4), round(expected_duration(1, 4), 4))
print(doob_bound({-1: 0.5, 1: 0.5}, 1), doob_bound({0: 0.75, 4: 0.25}, 2), round(ruin_prob(0.4, 3, 3), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.25 0.6 4.0 4.0\n0.5 0.5 0.2286",
          "0.75 0.6 4.0 4.0\n0.5 0.5 0.2286",
          "0.25 0.6 4.0 5.0\n0.5 0.5 0.2286",
          "0.25 0.4 2.0 4.0\n1.0 0.5 0.7714",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For the fair walk from 0, write <C>stopped_dist(n, top, floor)</C>, the exact law of the walk stopped on hitting top or
          floor (floor may be None) or at time n, as a dict; <C>dist_mean(dist)</C>; and <C>prob_at(dist, s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def stopped_dist(n, top, floor=None):
    return {0: 1.0}

def dist_mean(dist):
    return 0.0

def prob_at(dist, s):
    return 0.0
`,
        solution: STOPPED,
        tests: [
          { name: "law", code: `d = stopped_dist(2, 1)
assert abs(prob_at(d, 1) - 0.5) < 1e-12 and abs(prob_at(d, -2) - 0.25) < 1e-12 and prob_at(d, 7) == 0.0` },
          { name: "floor", code: `e = stopped_dist(2, 5, -1)
assert abs(prob_at(e, -1) - 0.5) < 1e-12 and abs(prob_at(e, 2) - 0.25) < 1e-12 and abs(dist_mean(stopped_dist(6, 2, -3))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ruin_prob(p, a, b)</C>, the probability that a walk stepping +1 with probability p, starting at 0, reaches +b
          before −a; <C>expected_duration(a, b)</C> for the fair walk by repeated averaging; and <C>doob_bound(dist, lam)</C>,{" "}
          <M>{"\\mathbb E[M_n^+]/\\lambda"}</M> for the law of <M>{"M_n"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ruin_prob(p, a, b):
    return 0.0

def expected_duration(a, b, sweeps=5000):
    return 0.0

def doob_bound(dist, lam):
    return 0.0
`,
        solution: RUIN,
        tests: [
          { name: "ruin", code: `assert abs(ruin_prob(0.5, 1, 3) - 0.25) < 1e-12 and abs(ruin_prob(0.6, 2, 2) - 0.6923076923) < 1e-9` },
          { name: "duration", code: `assert abs(expected_duration(3, 3) - 9) < 1e-6 and abs(doob_bound({-2: 0.5, 3: 0.5}, 3) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "biased",
      rung: "stretch",
      prompt: (
        <p>
          A walk steps +1 with probability 0.6 and −1 with probability 0.4. Using the martingale <M>{"(2/3)^{S_n}"}</M>, find the
          probability that it reaches +5 before −5. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8836, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Counting how often a martingale can cross a band, with the same stopping-time arguments, shows that a martingale
        bounded in L¹ cannot oscillate forever. That is the martingale convergence theorem.
      </p>
    </>
  ),
};
