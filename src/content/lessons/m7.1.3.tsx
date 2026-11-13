import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RuinViz } from "@/components/viz/RuinViz";
import type { LessonContent } from "@/lib/types";

const RUIN = `import numpy as np

def ruin_prob(i, N, p):
    if p == 0.5:
        return i / N
    r = (1 - p) / p
    return (1 - r ** i) / (1 - r ** N)

def ruin_solve(N, p):
    M = np.zeros((N + 1, N + 1))
    b = np.zeros(N + 1)
    M[0, 0], M[N, N], b[N] = 1.0, 1.0, 1.0
    for i in range(1, N):
        M[i, i], M[i, i + 1], M[i, i - 1] = 1.0, -p, -(1 - p)
    return np.linalg.solve(M, b)`;

const COND = `def condition(pmf, B):
    pB = sum(pmf[w] for w in B)
    return {w: pmf[w] / pB for w in B}

def rates(table, treatment):
    per_group, wins, total = {}, 0, 0
    for (t, g), (s, n) in table.items():
        if t == treatment:
            per_group[g] = round(s / n, 3)
            wins, total = wins + s, total + n
    return per_group, round(wins / total, 3)`;

export const lesson: LessonContent = {
  id: "m7.1.3",
  minutes: 60,
  links: {
    requires: ["m7.1.1", "m4.6.2"],
    revisits: ["m3.7.3"],
    foreshadows: ["m7.1.4", "m7.6.1", "m7.8.4"],
  },

  puzzle: (
    <>
      <p>
        You have ₹30 and bet ₹1 at a time on a game you win with probability 0.49, stopping when you reach ₹60 or go broke.
        The game is only slightly unfair, so your chance of doubling should be a little under a half. It is about 23%. How
        can such a calculation be done at all, when the game can last for any number of rounds?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Conditioning means restricting attention to the outcomes in which something is known to have happened and rescaling
        so the total is 1 again. The result is a new probability, obeying every rule the old one did. The most useful move in
        the subject is to condition on whatever happens first: after one bet, the gambler faces the same problem from a
        neighbouring position, and that gives an equation instead of an infinite sum.
      </p>
      <RuinViz />
    </>
  ),

  theory: (
    <>
      <Definition title="conditional probability">
        <p>
          For P(B) &gt; 0, <M>{"P(A \\mid B) = P(A \\cap B)/P(B)"}</M>.
        </p>
      </Definition>

      <Theorem title="conditioning gives a probability">
        <p>
          For fixed B with P(B) &gt; 0, the map <M>{"A \\mapsto P(A \\mid B)"}</M> satisfies the axioms. Hence every theorem
          about probabilities holds for conditional probabilities given B, for example{" "}
          <M>{"P(A^c \\mid B) = 1 - P(A \\mid B)"}</M> and inclusion–exclusion given B.
        </p>
      </Theorem>
      <Proof>
        <p>
          The values are non-negative, and <M>{"P(\\Omega \\mid B) = P(B)/P(B) = 1"}</M>. If the <M>{"A_n"}</M> are disjoint,
          so are the <M>{"A_n \\cap B"}</M>, and <M>{"(\\bigcup A_n) \\cap B = \\bigcup(A_n \\cap B)"}</M>, so{" "}
          <M>{"P(\\bigcup A_n \\mid B) = \\sum P(A_n \\cap B)/P(B) = \\sum P(A_n \\mid B)"}</M>.
        </p>
      </Proof>

      <Theorem title="chain rule and total probability">
        <p>
          <M>{"P(A_1 \\cap \\cdots \\cap A_n) = P(A_1)P(A_2 \\mid A_1)\\cdots P(A_n \\mid A_1 \\cap \\cdots \\cap A_{n-1})"}</M>{" "}
          whenever the conditioning events have positive probability. If <M>{"B_1, B_2, \\dots"}</M> is a finite or countable
          partition of Ω into events of positive probability, then <M>{"P(A) = \\sum_n P(A \\mid B_n)P(B_n)"}</M>, and the same
          holds with every probability conditioned on a further event C.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule telescopes: each factor is a ratio whose denominator cancels the previous numerator. For total
          probability, the events <M>{"A \\cap B_n"}</M> are disjoint with union A, so by countable additivity{" "}
          <M>{"P(A) = \\sum P(A \\cap B_n) = \\sum P(A \\mid B_n)P(B_n)"}</M>. The conditional version applies this to the
          probability <M>{"P(\\cdot \\mid C)"}</M>.
        </p>
      </Proof>

      <Example title="first-step analysis: gambler's ruin">
        <p>
          Let <M>{"w_i"}</M> be the probability of reaching N before 0 from fortune i, with win probability p and q = 1 − p.
          Conditioning on the first bet, <M>{"w_i = p\\,w_{i+1} + q\\,w_{i-1}"}</M> for 0 &lt; i &lt; N, with{" "}
          <M>{"w_0 = 0"}</M> and <M>{"w_N = 1"}</M>. Write it as <M>{"w_{i+1} - w_i = (q/p)(w_i - w_{i-1})"}</M>, so the
          increments form a geometric sequence with ratio r = q/p. Summing them,
        </p>
        <MD>{"w_i = \\frac{1 - r^i}{1 - r^N} \\quad (p \\ne \\tfrac12), \\qquad w_i = \\frac{i}{N} \\quad (p = \\tfrac12)."}</MD>
        <p>
          The step &ldquo;conditional on winning the first bet, the future is the same game from i + 1&rdquo; is the
          intuitive heart; making it rigorous needs the Markov property of a later chapter. The equations are also a linear
          system, which a computer can solve directly.
        </p>
        <Code>{RUIN}</Code>
      </Example>

      <Remark title="how you learned it matters">
        <p>
          A family has two children. If you learn &ldquo;at least one is a boy&rdquo;, the outcomes left are BB, BG, GB, and
          P(two boys) = 1/3. If instead you meet one of the children at random and it is a boy, the conditioning event is
          different, and the answer is 1/2. In Monty Hall, switching wins 2/3 only because the host is known always to open a
          losing door. To condition correctly, model the process that produced the information, not just its content.
        </p>
      </Remark>

      <Example title="Simpson's paradox">
        <p>
          In a well-known kidney-stone study, treatment A succeeded more often than B for small stones (93% against 87%) and
          for large stones (73% against 69%), yet less often overall (78% against 83%). By total probability, each overall rate
          is a weighted average of the group rates, and the weights differ: A was given mostly to the harder, large-stone
          cases. Conditional comparisons and aggregate ones can disagree, and which one answers your question depends on how
          the groups arose.
        </p>
        <Code>{COND}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fair",
      rung: "check",
      prompt: <p>In a fair game (p = 1/2), starting with ₹7, what is the probability of reaching ₹20 before ₹0?</p>,
      answer: { kind: "numeric", value: 0.35, tolerance: 0.0001 },
    },
    {
      key: "chain",
      rung: "check",
      prompt: <p>Three cards are dealt from a deck. What is the probability that all three are hearts? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.0129, tolerance: 0.0001 },
    },
    {
      key: "kids",
      rung: "apply",
      prompt: <p>A family has two children; the elder is a girl. What is the probability that both are girls?</p>,
      answer: { kind: "choice", options: ["1/2", "1/3", "1/4", "2/3"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ruin_prob(i, N, p):
    if p == 0.5:
        return i / N
    r = (1 - p) / p
    return (1 - r ** i) / (1 - r ** N)

def ruin_solve(N, p):
    M = np.zeros((N + 1, N + 1))
    b = np.zeros(N + 1)
    M[0, 0], M[N, N], b[N] = 1.0, 1.0, 1.0
    for i in range(1, N):
        M[i, i], M[i, i + 1], M[i, i - 1] = 1.0, -p, -(1 - p)
    return np.linalg.solve(M, b)

print(ruin_prob(3, 10, 0.5), round(ruin_prob(3, 10, 0.49), 4), round(ruin_prob(3, 10, 0.6), 4))
print(np.round(ruin_solve(4, 0.5), 3), np.allclose(ruin_solve(10, 0.49)[3], ruin_prob(3, 10, 0.49)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3 0.2592 0.7161\n[0.   0.25 0.5  0.75 1.  ] True",
          "0.3 0.2908 0.7161\n[0.   0.25 0.5  0.75 1.  ] True",
          "0.3 0.2592 0.7161\n[1.   0.75 0.5  0.25 0.  ] True",
          "0.3 0.2592 0.6\n[0.   0.25 0.5  0.75 1.  ] True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from fractions import Fraction

def condition(pmf, B):
    pB = sum(pmf[w] for w in B)
    return {w: pmf[w] / pB for w in B}

def rates(table, treatment):
    per_group, wins, total = {}, 0, 0
    for (t, g), (s, n) in table.items():
        if t == treatment:
            per_group[g] = round(s / n, 3)
            wins, total = wins + s, total + n
    return per_group, round(wins / total, 3)

pmf = {(a, b): Fraction(1, 4) for a in 'BG' for b in 'BG'}
c = condition(pmf, [k for k in pmf if 'B' in k])
print(c[('B', 'B')], len(c), sum(c.values()))
table = {('A', 'small'): (81, 87), ('A', 'large'): (192, 263), ('B', 'small'): (234, 270), ('B', 'large'): (55, 80)}
print(rates(table, 'A'))
print(rates(table, 'B'))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1/3 3 1\n({'small': 0.931, 'large': 0.73}, 0.78)\n({'small': 0.867, 'large': 0.688}, 0.826)",
          "1/4 3 3/4\n({'small': 0.931, 'large': 0.73}, 0.78)\n({'small': 0.867, 'large': 0.688}, 0.826)",
          "1/3 3 1\n({'small': 0.931, 'large': 0.73}, 0.83)\n({'small': 0.867, 'large': 0.688}, 0.778)",
          "1/2 2 1\n({'small': 0.931, 'large': 0.73}, 0.78)\n({'small': 0.867, 'large': 0.688}, 0.826)",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ruin_prob(i, N, p)</C>, the closed-form probability of reaching N before 0 from i, and{" "}
          <C>ruin_solve(N, p)</C>, which returns the whole vector (w₀, …, w_N) by solving the first-step equations as a linear
          system with numpy.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ruin_prob(i, N, p):
    return i / N

def ruin_solve(N, p):
    return np.linspace(0, 1, N + 1)
`,
        solution: RUIN,
        tests: [
          { name: "closed form", code: `assert ruin_prob(3, 10, 0.5) == 0.3 and ruin_prob(0, 10, 0.3) == 0 and abs(ruin_prob(10, 10, 0.3) - 1) < 1e-12
assert abs(ruin_prob(30, 60, 0.49) - 0.231447) < 1e-5
assert abs(ruin_prob(1, 2, 0.7) - 0.7) < 1e-12` },
          { name: "linear system", code: `for N, p in [(4, 0.5), (10, 0.49), (7, 0.8)]:
    w = ruin_solve(N, p)
    assert w.shape == (N + 1,) and abs(w[0]) < 1e-12 and abs(w[N] - 1) < 1e-12
    assert np.allclose(w, [ruin_prob(i, N, p) for i in range(N + 1)])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>condition(pmf, B)</C>, which returns the conditional distribution given the set of outcomes B, as a dict on
          B; and <C>rates(table, treatment)</C>, where table maps (treatment, group) to (successes, trials), returning a dict of
          per-group success rates and the overall rate for that treatment, each rounded to 3 places.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def condition(pmf, B):
    return pmf

def rates(table, treatment):
    return {}, 0.0
`,
        solution: COND,
        tests: [
          { name: "conditioning", code: `from fractions import Fraction
pmf = {w: Fraction(1, 6) for w in range(1, 7)}
c = condition(pmf, {2, 4, 6})
assert set(c) == {2, 4, 6} and all(v == Fraction(1, 3) for v in c.values())
c2 = condition({'a': 0.5, 'b': 0.3, 'c': 0.2}, ['b', 'c'])
assert abs(c2['b'] - 0.6) < 1e-12 and abs(sum(c2.values()) - 1) < 1e-12` },
          { name: "simpson", code: `t = {('A', 'x'): (81, 87), ('A', 'y'): (192, 263), ('B', 'x'): (234, 270), ('B', 'y'): (55, 80)}
gA, oA = rates(t, 'A'); gB, oB = rates(t, 'B')
assert gA == {'x': 0.931, 'y': 0.73} and gB == {'x': 0.867, 'y': 0.688}
assert oA == 0.78 and oB == 0.826 and all(gA[g] > gB[g] for g in gA) and oA < oB` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a fixed event B with P(B) &gt; 0, the function <M>{"A \\mapsto P(A \\mid B)"}</M> satisfies the
          axioms of probability.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows P(A | B) ≥ 0 and P(Ω | B) = P(Ω ∩ B)/P(B) = 1.",
          "For disjoint A₁, A₂, …, notes the sets Aₙ ∩ B are disjoint and (∪ Aₙ) ∩ B = ∪ (Aₙ ∩ B).",
          "Applies countable additivity of P and divides by P(B) to get P(∪ Aₙ | B) = Σ P(Aₙ | B).",
        ],
      },
    },
    {
      key: "ruin49",
      rung: "stretch",
      prompt: <p>With win probability 0.49 per bet, starting at ₹50, what is the probability of reaching ₹100 before ₹0? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.1192, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend why conditioning on an event gives a new probability with all the usual rules, how conditioning on the first step turns the gambler's ruin into a recurrence, and why the way information is obtained changes the right conditioning event.",

  glimpse: (
    <>
      <p>
        Conditioning in the other direction, from effects back to causes, is Bayes&apos; rule, the subject of the next lesson.
        Later, conditioning on the value of a random variable rather than on an event leads to conditional expectation, and
        first-step analysis becomes the standard tool for hitting probabilities and times of Markov chains.
      </p>
    </>
  ),
};
