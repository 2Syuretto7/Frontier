import { M, MD } from "@/components/Math";
import { Example, Proof, Remark, Theorem, Definition } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BorelCantelliViz } from "@/components/viz/BorelCantelliViz";
import type { LessonContent } from "@/lib/types";

const BOUNDS = `import math

def union_tail(ps, n):
    return min(1.0, sum(ps[n:]))

def none_prob(ps, n, m):
    out = 1.0
    for p in ps[n:m]:
        out *= 1 - p
    return out

def exp_bound(ps, n, m):
    return math.exp(-sum(ps[n:m]))`;

const TYPEWRITER = `def typewriter(n):
    k = 0
    while n >= 2 ** k:
        n -= 2 ** k
        k += 1
    return n / 2 ** k, (n + 1) / 2 ** k

def hits(x, N, interval):
    return sum(1 for n in range(N) if interval(n)[0] <= x < interval(n)[1])

def total_length(N, interval):
    return sum(interval(n)[1] - interval(n)[0] for n in range(N))`;

export const lesson: LessonContent = {
  id: "m18.3.3",
  minutes: 40,
  links: {
    requires: ["m18.3.2", "m8.2.5"],
    revisits: ["m7.4.2", "m18.1.2"],
    foreshadows: ["m18.3.4", "m18.6.1"],
  },

  puzzle: (
    <>
      <p>
        A monkey types one random letter per second forever. Will it type the word &quot;measure&quot; infinitely often? Now a
        less patient experiment: on day n you win with probability 1/n², independently of other days. Will you win
        infinitely often? The zero-one law says each answer is 0 or 1. Which is which, and what is the dividing line?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The expected number of events that happen is the sum of their probabilities. If that sum is finite, the count is
        finite with probability one, so the events eventually stop. If the sum is infinite and the events do not conspire
        with one another, there is always more probability ahead, and they never stop.
      </p>
      <BorelCantelliViz />
    </>
  ),

  theory: (
    <>
      <Definition title="infinitely often and eventually">
        <p>For events <M>{"A_1, A_2, \\dots"}</M>,</p>
        <MD>{"\\{A_n \\text{ i.o.}\\} = \\limsup_n A_n = \\bigcap_{n \\ge 1} \\bigcup_{k \\ge n} A_k, \\qquad \\{A_n \\text{ eventually}\\} = \\liminf_n A_n = \\bigcup_{n \\ge 1} \\bigcap_{k \\ge n} A_k."}</MD>
        <p>
          A point lies in the first exactly when it lies in infinitely many <M>{"A_k"}</M>, and in the second when it lies in all but
          finitely many. Their indicators are the limsup and liminf of <M>{"\\mathbb 1_{A_n}"}</M> (m8.2.5), and{" "}
          <M>{"(\\limsup A_n)^c = \\liminf A_n^c"}</M>.
        </p>
      </Definition>

      <Theorem title="first Borel-Cantelli lemma">
        <p>If <M>{"\\sum_n P(A_n) < \\infty"}</M>, then <M>{"P(A_n \\text{ i.o.}) = 0"}</M>. No independence is needed.</p>
      </Theorem>
      <Proof>
        <p>For every n,</p>
        <MD>{"P(A_n \\text{ i.o.}) \\le P\\Big(\\bigcup_{k \\ge n} A_k\\Big) \\le \\sum_{k \\ge n} P(A_k),"}</MD>
        <p>
          a tail of a convergent series, which tends to 0 (<C>union_tail</C>). Equivalently, the count{" "}
          <M>{"N = \\sum_n \\mathbb 1_{A_n}"}</M> has <M>{"\\mathbb E N = \\sum_n P(A_n) < \\infty"}</M> by monotone convergence, so N &lt; ∞ almost surely.
        </p>
      </Proof>

      <Theorem title="second Borel-Cantelli lemma">
        <p>If the <M>{"A_n"}</M> are independent and <M>{"\\sum_n P(A_n) = \\infty"}</M>, then <M>{"P(A_n \\text{ i.o.}) = 1"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          It suffices that each <M>{"\\bigcap_{k \\ge n} A_k^c"}</M> is null. By independence and <M>{"1 - x \\le e^{-x}"}</M>, for m &gt; n
        </p>
        <MD>{"P\\Big(\\bigcap_{k=n}^{m} A_k^c\\Big) = \\prod_{k=n}^{m} (1 - P(A_k)) \\le \\exp\\Big(-\\sum_{k=n}^{m} P(A_k)\\Big) \\to 0"}</MD>
        <p>as m → ∞ (<C>none_prob</C>, <C>exp_bound</C>). Continuity from above finishes it.</p>
        <Code>{BOUNDS}</Code>
      </Proof>

      <Example title="independence cannot be dropped">
        <p>
          On [0, 1) with Lebesgue measure, <M>{"A_n = [0, 1/n)"}</M> has divergent total length, yet each x &gt; 0 leaves the sets for
          good, so <M>{"P(A_n \\text{ i.o.}) = 0"}</M>. The typewriter sequence, which sweeps [0, 1) by dyadic intervals of length 1, then
          1/2, then 1/4, also has divergent total length, and there every x is hit once per sweep, so the probability is 1
          (<C>typewriter</C>, <C>hits</C>, <C>total_length</C>). Without independence, a divergent sum decides nothing.
        </p>
        <Code>{TYPEWRITER}</Code>
      </Example>

      <Example title="how large do i.i.d. variables get?">
        <p>
          Let <M>{"X_n"}</M> be independent Exponential(1). Then <M>{"P(X_n > c \\ln n) = n^{-c}"}</M>, summable for c &gt; 1 and not for c ≤ 1.
          The two lemmas give <M>{"X_n > c \\ln n"}</M> only finitely often when c &gt; 1 and infinitely often when c = 1, so
        </p>
        <MD>{"\\limsup_n \\frac{X_n}{\\ln n} = 1 \\quad \\text{almost surely.}"}</MD>
        <p>The monkey too: the disjoint blocks of seven letters are independent and each spells the word with the same positive probability.</p>
      </Example>

      <Remark title="a tool for almost sure convergence">
        <p>
          If <M>{"\\sum_n P(|X_n - X| > \\varepsilon) < \\infty"}</M> for every ε &gt; 0, the first lemma says <M>{"|X_n - X| \\le \\varepsilon"}</M> eventually,
          almost surely, and taking ε = 1/k over countably many k gives <M>{"X_n \\to X"}</M> almost surely. Chebyshev or Markov bounds
          (m7.4.2) supply the summable series, which is how m18.3.4 and the strong law (m18.6.1) use it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>Events have P(Aₙ) = 4⁻ⁿ for n ≥ 1. What is the expected number of them that occur?</p>,
      answer: { kind: "numeric", value: 0.3333, tolerance: 0.0001 },
    },
    {
      key: "none",
      rung: "check",
      prompt: <p>Independent events have P(Aₙ) = 1/n. Compute the probability that none of A₂, A₃, …, A₅₀ occurs.</p>,
      answer: { kind: "numeric", value: 0.02, tolerance: 0.0001 },
    },
    {
      key: "dependent",
      rung: "apply",
      prompt: <p>Events satisfy Σ P(Aₙ) = ∞ but are not known to be independent. What can you conclude about P(Aₙ i.o.)?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing in general: it can be 0, 1 or anything in between",
          "It equals 1, by the second lemma",
          "It is positive but may be less than 1",
          "It equals 0, by the first lemma",
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

def union_tail(ps, n):
    return min(1.0, sum(ps[n:]))

def none_prob(ps, n, m):
    out = 1.0
    for p in ps[n:m]:
        out *= 1 - p
    return out

def exp_bound(ps, n, m):
    return math.exp(-sum(ps[n:m]))

ps = [1 / (k + 1) ** 2 for k in range(1000)]; qs = [1 / (k + 2) for k in range(9)]; print(union_tail(ps, 0), round(union_tail(ps, 9), 3), round(none_prob(qs, 0, 9), 4), round(exp_bound(qs, 0, 9), 4))
print(round(none_prob([0.5] * 10, 0, 10), 6), none_prob([1.0, 0.2], 0, 2), round(exp_bound([0.5] * 10, 0, 10), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 0.104 0.1 0.1453\n0.000977 0.0 0.006738",
          "1.0 0.104 0.1 0.1453\n0.000977 0.8 0.006738",
          "1.6439 0.104 0.1 0.1453\n0.000977 0.0 0.006738",
          "1.0 0.105 0.1453 0.1\n0.5 0.0 0.006738",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def typewriter(n):
    k = 0
    while n >= 2 ** k:
        n -= 2 ** k
        k += 1
    return n / 2 ** k, (n + 1) / 2 ** k

def hits(x, N, interval):
    return sum(1 for n in range(N) if interval(n)[0] <= x < interval(n)[1])

def total_length(N, interval):
    return sum(interval(n)[1] - interval(n)[0] for n in range(N))

print([typewriter(n) for n in (0, 1, 2, 3, 6)], hits(0.3, 15, typewriter), total_length(15, typewriter))
print(hits(0.3, 63, typewriter), hits(0.3, 63, lambda n: (0, 1 / (n + 1) ** 2)), hits(0.0, 63, lambda n: (0, 1 / (n + 1) ** 2)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(0.0, 1.0), (0.0, 0.5), (0.5, 1.0), (0.0, 0.25), (0.75, 1.0)] 4 4.0\n6 1 63",
          "[(0.0, 1.0), (0.0, 0.5), (0.5, 1.0), (0.0, 0.25), (0.75, 1.0)] 4 4.0\n6 0 63",
          "[(0.0, 1.0), (0.0, 0.5), (0.5, 1.0), (0.0, 0.25), (0.5, 0.75)] 3 4.0\n5 1 63",
          "[(0.0, 0.5), (0.5, 1.0), (0.0, 0.25), (0.25, 0.5), (0.0, 0.125)] 4 15.0\n6 1 1",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For a list ps of probabilities, write <C>union_tail(ps, n)</C>, the union bound on the probability that some event
          from index n on occurs (capped at 1); <C>none_prob(ps, n, m)</C>, the probability that none of indices n to m − 1
          occurs when the events are independent; and <C>exp_bound(ps, n, m)</C>, its exponential upper bound.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def union_tail(ps, n):
    return 0.0

def none_prob(ps, n, m):
    return 0.0

def exp_bound(ps, n, m):
    return 0.0
`,
        solution: BOUNDS,
        tests: [
          { name: "union", code: `assert abs(union_tail([0.5, 0.25, 0.125], 1) - 0.375) < 1e-12 and union_tail([0.9, 0.9], 0) == 1.0` },
          { name: "none", code: `ps = [0.5, 0.5, 0.2]
assert abs(none_prob(ps, 0, 3) - 0.2) < 1e-12 and abs(none_prob(ps, 1, 3) - 0.4) < 1e-12 and abs(exp_bound([1, 1], 0, 2) - 0.1353352832) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>typewriter(n)</C> returning the n-th interval (from 0) of the sweep [0, 1), [0, 1/2), [1/2, 1), [0, 1/4), …
          as a pair, <C>hits(x, N, interval)</C> counting n &lt; N with x in the half-open interval, and{" "}
          <C>total_length(N, interval)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def typewriter(n):
    return 0.0, 1.0

def hits(x, N, interval):
    return 0

def total_length(N, interval):
    return 0.0
`,
        solution: TYPEWRITER,
        tests: [
          { name: "sweep", code: `assert typewriter(4) == (0.25, 0.5) and typewriter(14) == (0.875, 1.0) and abs(total_length(7, typewriter) - 3.0) < 1e-12` },
          { name: "hits", code: `assert hits(0.6, 31, typewriter) == 5 and hits(0.05, 30, lambda n: (0, 1 / (n + 1))) == 19` },
        ],
      },
    },
    {
      key: "gauss",
      rung: "stretch",
      prompt: (
        <p>
          <M>{"X_n"}</M> are independent standard normal. Using <M>{"P(X > t) \\approx e^{-t^2/2}/(t\\sqrt{2\\pi})"}</M> and both lemmas, find the
          almost sure value of <M>{"\\limsup_n X_n / \\sqrt{\\ln n}"}</M>. Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.4142, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Almost sure convergence, convergence in probability, in mean and in distribution are different statements about
        a sequence of random variables. Borel-Cantelli is the bridge from the second to the first along subsequences.
      </p>
    </>
  ),
};
