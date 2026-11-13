import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PolyaReturnViz } from "@/components/viz/PolyaReturnViz";
import type { LessonContent } from "@/lib/types";

const ABSORB = `import numpy as np

def ruin_chain(N, p):
    P = np.zeros((N + 1, N + 1))
    P[0, 0] = P[N, N] = 1
    for i in range(1, N):
        P[i, i + 1], P[i, i - 1] = p, 1 - p
    return P

def absorb(P, T, A):
    Q, R = P[np.ix_(T, T)], P[np.ix_(T, A)]
    M = np.linalg.solve(np.eye(len(T)) - Q, np.hstack([np.ones((len(T), 1)), R]))
    return M[:, 0], M[:, 1:]`;

const RETURN = `import math

def p_return(k):
    return math.exp(math.lgamma(2 * k + 1) - 2 * math.lgamma(k + 1) - 2 * k * math.log(2))

def expected_returns(m):
    return sum(p_return(k) for k in range(1, m + 1))`;

export const lesson: LessonContent = {
  id: "m7.8.4",
  minutes: 65,
  links: {
    requires: ["m7.8.1", "m7.1.3"],
    revisits: ["m7.6.2", "m7.2.2"],
    foreshadows: ["m7.8.5", "m13.3.1"],
  },

  puzzle: (
    <>
      <p>
        &quot;A drunk man will find his way home, but a drunk bird may get lost for ever.&quot; A random walker on a line or
        a flat grid returns to its starting point with certainty, but in three dimensions it has about a 66% chance of never
        coming back. Why does the dimension matter, and how do you compute where and when a walk ends up?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two tools answer most questions about random walks. First-step analysis conditions on the first move and turns a
        question into a system of linear equations. Counting returns links certainty of return to an expected number of
        visits: if the walk is sure to return, it returns again and again, infinitely often; if not, the number of returns
        is geometric with a finite mean.
      </p>
      <PolyaReturnViz />
    </>
  ),

  theory: (
    <>
      <Definition title="simple random walk">
        <p>
          <M>{"S_n = X_1 + \\dots + X_n"}</M> with i.i.d. steps <M>{"X_i = +1"}</M> with probability p and −1 with probability
          q = 1 − p. It is a Markov chain on the integers, with <M>{"E[S_n] = (p - q)n"}</M> and{" "}
          <M>{"\\operatorname{Var}(S_n) = 4pqn"}</M>. In d dimensions each step moves ±1 along a uniformly chosen axis. The fair
          walk is typically about √n from the start after n steps.
        </p>
      </Definition>

      <Theorem title="absorbing chains">
        <p>
          Split the states into transient states T and absorbing states A, and write Q for the T-to-T block of P and R for the
          T-to-A block. If absorption is certain from every transient state, then I − Q is invertible, the expected number
          of steps to absorption from each transient state is <M>{"t = (I - Q)^{-1}\\mathbf 1"}</M>, and the probabilities of
          ending in each absorbing state are <M>{"B = (I - Q)^{-1}R"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Condition on the first step (first-step analysis). From transient i, one step is taken, then the remaining time is
          0 if the walk was absorbed and <M>{"t_j"}</M> if it moved to transient j, so <M>{"t = \\mathbf 1 + Qt"}</M>. The
          walk ends in absorbing a either by moving there at once or by moving to transient j first, so{" "}
          <M>{"B = R + QB"}</M>. Since absorption is certain, <M>{"(Q^n)_{ij}"}</M>, the chance of still being in T after n
          steps, tends to 0; so the series <M>{"I + Q + Q^2 + \\cdots"}</M> converges to <M>{"(I - Q)^{-1}"}</M>, and the two
          equations have the unique solutions stated.
        </p>
      </Proof>
      <Example title="gambler's ruin, again">
        <p>
          Bet one unit on fair coin flips, starting with i and stopping at 0 or N. The equations{" "}
          <M>{"h_i = \\tfrac12h_{i+1} + \\tfrac12h_{i-1}"}</M>, <M>{"h_0 = 0"}</M>, <M>{"h_N = 1"}</M> for the chance of reaching N
          are solved by <M>{"h_i = i/N"}</M>, and <M>{"t_i = 1 + \\tfrac12t_{i+1} + \\tfrac12t_{i-1}"}</M> with zero boundary values
          is solved by <M>{"t_i = i(N - i)"}</M>. With bias, <M>{"h_i = (1 - (q/p)^i)/(1 - (q/p)^N)"}</M>.
        </p>
        <Code>{ABSORB}</Code>
      </Example>

      <Theorem title="returns">
        <p>
          Let f be the probability that a walk started at 0 ever returns to 0, and V the number of returns. Then{" "}
          <M>{"E[V] = \\sum_{n \\ge 1}P(S_n = 0)"}</M>, and <M>{"E[V] = f/(1 - f)"}</M> if f &lt; 1, while <M>{"E[V] = \\infty"}</M>{" "}
          if f = 1. So the walk is sure to return (recurrent) exactly when <M>{"\\sum_n P(S_n = 0) = \\infty"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          V is the sum of the indicators <M>{"1\\{S_n = 0\\}"}</M>, so linearity gives the first formula. By the Markov
          property, each time the walk is back at 0 it starts afresh, so <M>{"P(V \\ge m) = f^m"}</M>. If f &lt; 1, V is
          geometric and <M>{"E[V] = \\sum_{m \\ge 1}f^m = f/(1 - f)"}</M>; if f = 1, V is infinite with probability 1.
        </p>
      </Proof>
      <p>
        In one dimension <M>{"P(S_{2k} = 0) = \\binom{2k}{k}4^{-k} \\approx 1/\\sqrt{\\pi k}"}</M> by Stirling&apos;s formula, and{" "}
        <M>{"\\sum 1/\\sqrt k = \\infty"}</M>: the fair walk is recurrent. The expected number of returns in n steps grows like{" "}
        <M>{"\\sqrt n"}</M>.
      </p>
      <Code>{RETURN}</Code>
      <Theorem title="Pólya's theorem">
        <p>
          The simple random walk on <M>{"\\mathbb Z^d"}</M> is recurrent for d = 1 and d = 2 and transient for d ≥ 3. In
          three dimensions the return probability is about 0.34.
        </p>
      </Theorem>
      <Remark title="why the dimension">
        <p>
          After 2k steps the walk is spread over a region of radius about √k containing about <M>{"k^{d/2}"}</M> points, so{" "}
          <M>{"P(S_{2k} = 0) \\approx c\\,k^{-d/2}"}</M>. The sum of <M>{"k^{-d/2}"}</M> diverges for d ≤ 2 and converges for d ≥ 3.
          The biased one-dimensional walk is transient too: it drifts away at speed p − q.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ruin",
      rung: "check",
      prompt: <p>A fair gambler starts with 3 units and stops at 0 or 10. What is the probability of reaching 10?</p>,
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0001 },
    },
    {
      key: "time",
      rung: "check",
      prompt: <p>In the same game, what is the expected number of bets until it stops?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0.0001 },
    },
    {
      key: "polya",
      rung: "apply",
      prompt: <p>For which dimensions is the simple random walk on the integer lattice sure to return to its start?</p>,
      answer: { kind: "choice", options: ["d = 1 and d = 2 only", "d = 1 only", "Every d", "No d"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def ruin_chain(N, p):
    P = np.zeros((N + 1, N + 1))
    P[0, 0] = P[N, N] = 1
    for i in range(1, N):
        P[i, i + 1], P[i, i - 1] = p, 1 - p
    return P

def absorb(P, T, A):
    Q, R = P[np.ix_(T, T)], P[np.ix_(T, A)]
    M = np.linalg.solve(np.eye(len(T)) - Q, np.hstack([np.ones((len(T), 1)), R]))
    return M[:, 0], M[:, 1:]

P = ruin_chain(4, 0.5)
t, B = absorb(P, [1, 2, 3], [0, 4])
print(t, B[:, 1])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3. 4. 3.] [0.25 0.5  0.75]",
          "[1. 2. 1.] [0.25 0.5  0.75]",
          "[3. 4. 3.] [0.75 0.5  0.25]",
          "[4. 4. 4.] [0.25 0.5  0.75]",
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

def p_return(k):
    return math.exp(math.lgamma(2 * k + 1) - 2 * math.lgamma(k + 1) - 2 * k * math.log(2))

def expected_returns(m):
    return sum(p_return(k) for k in range(1, m + 1))

print(round(p_return(1), 4), round(p_return(50) * math.sqrt(math.pi * 50), 3))
print([round(expected_returns(m), 1) for m in (100, 10000)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 0.998\n[10.3, 111.8]", "0.25 0.998\n[10.3, 111.8]", "0.5 0.998\n[10.3, 1030.0]", "0.5 1.772\n[10.3, 111.8]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ruin_chain(N, p)</C>, the (N + 1) × (N + 1) transition matrix of the gambler&apos;s walk with 0 and N
          absorbing, and <C>absorb(P, T, A)</C>, which takes index lists of transient and absorbing states and returns the
          expected absorption times (one per state in T) and the matrix of absorption probabilities, using a linear solve.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ruin_chain(N, p):
    return np.eye(N + 1)

def absorb(P, T, A):
    return np.zeros(len(T)), np.zeros((len(T), len(A)))
`,
        solution: ABSORB,
        tests: [
          { name: "chain", code: `P = ruin_chain(3, 0.6)
assert P.shape == (4, 4) and np.allclose(P.sum(axis=1), 1)
assert P[0, 0] == 1 and P[3, 3] == 1 and abs(P[1, 2] - 0.6) < 1e-12 and abs(P[2, 1] - 0.4) < 1e-12` },
          { name: "fair and biased", code: `t, B = absorb(ruin_chain(10, 0.5), list(range(1, 10)), [0, 10])
i = np.arange(1, 10)
assert np.allclose(t, i * (10 - i)) and np.allclose(B[:, 1], i / 10) and np.allclose(B.sum(axis=1), 1)
t, B = absorb(ruin_chain(4, 0.6), [1, 2, 3], [0, 4])
r = 0.4 / 0.6
assert np.allclose(B[:, 1], (1 - r ** np.array([1, 2, 3])) / (1 - r ** 4))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_return(k)</C>, the probability <M>{"\\binom{2k}{k}4^{-k}"}</M> that the fair walk is at 0 after 2k steps,
          computed with math.lgamma so it works for large k, and <C>expected_returns(m)</C>, the expected number of returns
          within the first 2m steps.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def p_return(k):
    return 0.0

def expected_returns(m):
    return 0.0
`,
        solution: RETURN,
        tests: [
          { name: "small", code: `assert abs(p_return(1) - 0.5) < 1e-12 and abs(p_return(2) - 0.375) < 1e-12 and abs(p_return(3) - 0.3125) < 1e-12
assert abs(expected_returns(3) - 1.1875) < 1e-12` },
          { name: "large", code: `assert abs(p_return(5000) * math.sqrt(math.pi * 5000) - 1) < 1e-4
assert 2 * math.sqrt(400 / math.pi) - 1.2 < expected_returns(400) < 2 * math.sqrt(400 / math.pi)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A walk starts at 0 and returns to 0 with probability f. Using the Markov property, prove that the number of returns
          V satisfies <M>{"P(V \\ge m) = f^m"}</M>, and deduce that <M>{"E[V] = f/(1 - f)"}</M> when f &lt; 1 and that V is infinite
          with probability 1 when f = 1.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues by induction that given m returns, the walk restarts at 0 independently of the past (Markov property), so P(V ≥ m + 1) = f · P(V ≥ m).",
          "Computes E[V] = Σ_{m≥1} P(V ≥ m) = Σ f^m = f/(1 − f) for f < 1.",
          "For f = 1 notes P(V ≥ m) = 1 for every m, so P(V = ∞) = 1.",
        ],
      },
    },
    {
      key: "biased",
      rung: "stretch",
      prompt: (
        <p>
          A gambler wins each bet with probability 0.6, starts with 1 unit and stops at 0 or 4. What is the probability of
          reaching 4? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.4154, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how first-step analysis turns hitting probabilities and times into linear equations, why the fair gambler's chance is i/N and duration i(N − i), and why a random walk returns for sure in one and two dimensions but not in three.",

  glimpse: (
    <>
      <p>
        So far the chain was given and we asked about its behaviour. The last lesson of this course turns this around: given
        a target distribution, design a random walk whose stationary distribution is that target, using detailed balance.
        That is Metropolis–Hastings.
      </p>
    </>
  ),
};
