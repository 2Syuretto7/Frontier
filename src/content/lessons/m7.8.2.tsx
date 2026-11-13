import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OccupationViz } from "@/components/viz/OccupationViz";
import type { LessonContent } from "@/lib/types";

const STAT = `import numpy as np

def stationary(P):
    k = len(P)
    A = np.vstack([P.T - np.eye(k), np.ones(k)])
    b = np.zeros(k + 1); b[-1] = 1
    return np.linalg.lstsq(A, b, rcond=None)[0]

def detailed_balance(P, pi):
    F = pi[:, None] * P
    return bool(np.allclose(F, F.T))`;

const WALK = `import numpy as np

def walk_stationary(A):
    d = A.sum(axis=1)
    return d / d.sum()

def occupation(path, k):
    return np.bincount(path, minlength=k) / len(path)`;

export const lesson: LessonContent = {
  id: "m7.8.2",
  minutes: 60,
  links: {
    requires: ["m7.8.1", "m3.7.1"],
    revisits: ["m7.7.1", "m3.7.3"],
    foreshadows: ["m7.8.3", "m7.8.5", "m13.3.2"],
  },

  puzzle: (
    <>
      <p>
        A web surfer clicks random links forever. In the long run, what fraction of their time is spent on each page? That
        fraction, PageRank, does not depend on where they started. Which distributions can a chain settle into, when is
        there only one, and how do you compute it without simulating at all?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A distribution is stationary if one step of the chain leaves it unchanged: the probability flowing into each state
        equals the probability flowing out. If the chain can get from anywhere to anywhere, there is exactly one such
        balance, and a single long run spends that fraction of its time in each state.
      </p>
      <OccupationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stationary distribution">
        <p>
          A row vector π with <M>{"\\pi_i \\ge 0"}</M> and <M>{"\\sum_i \\pi_i = 1"}</M> is stationary for P if{" "}
          <M>{"\\pi P = \\pi"}</M>, that is, <M>{"\\sum_i \\pi_i P_{ij} = \\pi_j"}</M> for every j. Then{" "}
          <M>{"X_0 \\sim \\pi"}</M> implies <M>{"X_n \\sim \\pi"}</M> for all n. Equivalently π is a left eigenvector of P with
          eigenvalue 1, normalised to sum to 1.
        </p>
      </Definition>

      <Theorem title="existence">
        <p>Every transition matrix on a finite state space has at least one stationary distribution.</p>
      </Theorem>
      <Proof>
        <p>
          Start anywhere, <M>{"\\pi_0"}</M>, and average the first n distributions:{" "}
          <M>{"\\bar\\pi_n = \\frac1n\\sum_{t=0}^{n-1}\\pi_0P^t"}</M>. Each is a probability vector, and{" "}
          <M>{"\\bar\\pi_nP - \\bar\\pi_n = (\\pi_0P^n - \\pi_0)/n"}</M>, whose entries are at most 1/n in size. The probability
          vectors form a closed bounded set, so some subsequence of <M>{"\\bar\\pi_n"}</M> converges to a probability vector π,
          and passing to the limit gives <M>{"\\pi P - \\pi = 0"}</M>.
        </p>
      </Proof>

      <Definition title="irreducible">
        <p>
          A chain is irreducible if for all states i, j there is some n with <M>{"(P^n)_{ij} > 0"}</M>: every state can reach
          every other.
        </p>
      </Definition>
      <Theorem title="uniqueness and the ergodic theorem">
        <p>
          An irreducible chain on a finite state space has exactly one stationary distribution π, every <M>{"\\pi_i > 0"}</M>,
          and <M>{"\\pi_i = 1/E_i[T_i]"}</M>, where <M>{"T_i"}</M> is the time to return to i starting from i. Moreover, from
          any start, the fraction of the first n steps spent in i converges to <M>{"\\pi_i"}</M> with probability 1, and{" "}
          <M>{"\\frac1n\\sum_{t<n} f(X_t) \\to \\sum_i \\pi_i f(i)"}</M>.
        </p>
      </Theorem>
      <p>
        We use this theorem without proof; it is the law of large numbers for chains, applied to the independent cycles
        between successive returns to a state. Without irreducibility uniqueness fails: a chain with two closed groups of
        states has a stationary distribution on each, and any mixture of the two is stationary.
      </p>
      <p>
        To compute π, solve <M>{"(P^\\top - I)\\pi^\\top = 0"}</M> together with <M>{"\\sum_i \\pi_i = 1"}</M>. For the
        weather chain this gives π = (21, 13, 12)/46:
      </p>
      <Code>{STAT}</Code>

      <Theorem title="detailed balance">
        <p>
          If a probability vector π satisfies <M>{"\\pi_i P_{ij} = \\pi_j P_{ji}"}</M> for all i, j, then π is stationary. A
          chain with such a π is called reversible.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sum over i: <M>{"\\sum_i \\pi_i P_{ij} = \\sum_i \\pi_j P_{ji} = \\pi_j \\sum_i P_{ji} = \\pi_j"}</M>, since row j of P
          sums to 1.
        </p>
      </Proof>
      <Remark title="balance of flows">
        <p>
          <M>{"\\pi_iP_{ij}"}</M> is the long-run rate of i → j moves. Stationarity says total flow into each state equals total
          flow out; detailed balance asks more, that every pair of states balances separately. The weather chain is not
          reversible: sun to cloud happens at rate 0.091 but cloud to sun at 0.085, and the imbalance circulates around the
          cycle. Detailed balance is still the easiest way to design a chain with a chosen π, which is how
          Metropolis–Hastings works.
        </p>
      </Remark>

      <Example title="random walk on a graph">
        <p>
          On a connected graph with m edges, move to a uniformly random neighbour. Then <M>{"\\pi_i = d_i/2m"}</M>, where{" "}
          <M>{"d_i"}</M> is the degree: <M>{"\\pi_iP_{ij} = \\frac{d_i}{2m}\\cdot\\frac1{d_i} = \\frac1{2m}"}</M> for every edge, which
          is symmetric in i and j, so detailed balance holds. Popular nodes are visited in proportion to their connections.
          PageRank is the stationary distribution of a walk on the directed web graph, with a small chance of jumping to a
          random page to make it irreducible.
        </p>
        <Code>{WALK}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "twostate",
      rung: "check",
      prompt: <p>P = [[0.9, 0.1], [0.3, 0.7]]. What is the stationary probability of state 0?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "star",
      rung: "check",
      prompt: <p>A random walk moves on a star graph: a centre joined to 4 leaves. What fraction of time does it spend at the centre in the long run?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "db",
      rung: "apply",
      prompt: <p>Which statement is true for a finite chain?</p>,
      answer: {
        kind: "choice",
        options: [
          "Detailed balance implies stationarity, but a stationary π need not satisfy detailed balance.",
          "Stationarity and detailed balance are equivalent.",
          "Every chain satisfies detailed balance for its stationary distribution.",
          "A chain with a stationary distribution must be irreducible.",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def stationary(P):
    k = len(P)
    A = np.vstack([P.T - np.eye(k), np.ones(k)])
    b = np.zeros(k + 1); b[-1] = 1
    return np.linalg.lstsq(A, b, rcond=None)[0]

def detailed_balance(P, pi):
    F = pi[:, None] * P
    return bool(np.allclose(F, F.T))

P = np.array([[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]])
pi = stationary(P)
print(np.round(pi, 3), np.allclose(pi @ P, pi), detailed_balance(P, pi))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.457 0.283 0.261] True False",
          "[0.457 0.283 0.261] True True",
          "[0.333 0.333 0.333] True False",
          "[0.261 0.283 0.457] True False",
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

def walk_stationary(A):
    d = A.sum(axis=1)
    return d / d.sum()

def occupation(path, k):
    return np.bincount(path, minlength=k) / len(path)

A = np.array([[0, 1, 1, 1], [1, 0, 1, 0], [1, 1, 0, 0], [1, 0, 0, 0]])
W = A / A.sum(axis=1, keepdims=True)
print(walk_stationary(A), np.allclose(walk_stationary(A) @ W, walk_stationary(A)))
rng = np.random.default_rng(0)
path = [0]
for _ in range(40000):
    path.append(int(rng.choice(4, p=W[path[-1]])))
print(np.round(occupation(path, 4), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.375 0.25  0.25  0.125] True\n[0.37 0.25 0.25 0.12]",
          "[0.25 0.25 0.25 0.25] True\n[0.25 0.25 0.25 0.25]",
          "[0.375 0.25  0.25  0.125] False\n[0.37 0.25 0.25 0.12]",
          "[0.375 0.25  0.25  0.125] True\n[1. 0. 0. 0.]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stationary(P)</C>, returning the stationary distribution of an irreducible chain by solving{" "}
          <M>{"(P^\\top - I)\\pi = 0"}</M> stacked with the row of ones = 1 (least squares is fine), and{" "}
          <C>detailed_balance(P, pi)</C>, returning a Python bool saying whether <M>{"\\pi_iP_{ij} = \\pi_jP_{ji}"}</M> for all
          pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stationary(P):
    return np.ones(len(P)) / len(P)

def detailed_balance(P, pi):
    return True
`,
        solution: STAT,
        tests: [
          { name: "stationary", code: `pi = stationary(np.array([[0.9, 0.1], [0.3, 0.7]]))
assert np.allclose(pi, [0.75, 0.25])
P = np.array([[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]])
assert np.allclose(stationary(P), np.array([21, 13, 12]) / 46)` },
          { name: "detailed balance", code: `P = np.array([[0.9, 0.1], [0.3, 0.7]])
assert detailed_balance(P, np.array([0.75, 0.25])) is True
assert detailed_balance(P, np.array([0.5, 0.5])) is False
C = np.array([[0, 1, 0], [0, 0, 1], [1, 0, 0.0]]) * 0.8 + np.eye(3) * 0.2
assert detailed_balance(C, np.ones(3) / 3) is False and np.allclose(stationary(C), 1 / 3)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>walk_stationary(A)</C>, returning the stationary distribution of the simple random walk on the connected
          graph with symmetric 0/1 adjacency matrix A, and <C>occupation(path, k)</C>, the fraction of entries of the list
          path equal to each state 0, …, k − 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def walk_stationary(A):
    return np.ones(len(A)) / len(A)

def occupation(path, k):
    return np.zeros(k)
`,
        solution: WALK,
        tests: [
          { name: "graph", code: `A = np.array([[0, 1, 1, 1, 1], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0], [1, 0, 0, 0, 0]])
assert np.allclose(walk_stationary(A), [0.5, 0.125, 0.125, 0.125, 0.125])
T = np.array([[0, 1, 1], [1, 0, 1], [1, 1, 0]])
assert np.allclose(walk_stationary(T), 1 / 3)` },
          { name: "occupation", code: `o = occupation([0, 2, 2, 1, 2], 4)
assert np.allclose(o, [0.2, 0.2, 0.6, 0.0]) and len(o) == 4` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that if π satisfies detailed balance for P, then π is stationary, and use this to show that the simple random
          walk on a connected graph with m edges has stationary distribution <M>{"\\pi_i = d_i/2m"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sums π_i P_ij = π_j P_ji over i and uses that row j of P sums to 1 to get (πP)_j = π_j.",
          "For the walk, computes π_i P_ij = (d_i/2m)(1/d_i) = 1/2m for each edge {i, j} and 0 for non-edges, which is symmetric.",
          "Checks Σ_i d_i/2m = 1 (the degrees sum to 2m), so π is a probability vector, and concludes it is stationary.",
        ],
      },
    },
    {
      key: "return",
      rung: "stretch",
      prompt: (
        <p>
          In the weather chain π = (21, 13, 12)/46. Starting on a cloudy day, what is the expected number of days until the
          next cloudy day? Give four decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 3.5385, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what a stationary distribution is, why every finite chain has one, why irreducibility makes it unique and equal to the long-run fraction of time, and how detailed balance gives a quick check and the random walk answer d_i/2m.",

  glimpse: (
    <>
      <p>
        Time averages converge to π, but does the distribution of <M>{"X_n"}</M> itself? Not always: a chain that alternates
        between two states never settles. The next lesson finds the condition, aperiodicity, and measures how fast the
        convergence happens.
      </p>
    </>
  ),
};
