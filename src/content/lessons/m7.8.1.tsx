import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TransitionStepViz } from "@/components/viz/TransitionStepViz";
import type { LessonContent } from "@/lib/types";

const STEP = `import numpy as np

def is_stochastic(P, tol=1e-9):
    P = np.asarray(P, dtype=float)
    return bool(np.all(P >= 0) and np.allclose(P.sum(axis=1), 1, atol=tol))

def n_step(P, pi0, n):
    return pi0 @ np.linalg.matrix_power(P, n)`;

const SIM = `import numpy as np

def simulate_chain(rng, P, x0, steps):
    path = [x0]
    for _ in range(steps):
        path.append(int(rng.choice(len(P), p=P[path[-1]])))
    return path

def empirical_transitions(path, k):
    C = np.zeros((k, k))
    for a, b in zip(path[:-1], path[1:]):
        C[a, b] += 1
    return C / C.sum(axis=1, keepdims=True)`;

export const lesson: LessonContent = {
  id: "m7.8.1",
  minutes: 55,
  links: {
    requires: ["m7.1.3", "m3.7.3"],
    revisits: ["m7.5.1", "m7.6.2"],
    foreshadows: ["m7.8.2", "m7.8.3", "l2.5.4"],
  },

  puzzle: (
    <>
      <p>
        Tomorrow&apos;s weather depends on today&apos;s, but given today, not much on last week&apos;s. A bigram language model
        picks the next word from the current one alone. A random surfer clicks a link on the current page. Each is a
        sequence with one-step memory, and all of its long-run behaviour is coded in a single square matrix. How do you read
        the future from that matrix?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write the chance of moving from each state to each other state in a table, one row per current state. To push a
        whole probability distribution one step forward, multiply it by the table. Doing that n times is multiplying by the
        n-th power, so questions about the far future become questions about matrix powers.
      </p>
      <TransitionStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Markov chain">
        <p>
          A sequence <M>{"X_0, X_1, \\dots"}</M> on a finite state space {"{1, …, k}"} is a (time-homogeneous) Markov chain with
          transition matrix P if
        </p>
        <MD>{"P(X_{n+1} = j \\mid X_n = i, X_{n-1} = x_{n-1}, \\dots, X_0 = x_0) = P_{ij}"}</MD>
        <p>
          for all n, states and histories of positive probability. Each row of P is a probability distribution: entries are
          non-negative and rows sum to 1. Such a matrix is called stochastic.
        </p>
      </Definition>
      <Remark title="row or column convention">
        <p>
          Here row i holds the distribution of the next state, and distributions are row vectors multiplied on the left. The
          Markov matrices of linear algebra had columns summing to 1 and acted on column vectors; they are the transposes of
          these.
        </p>
      </Remark>

      <Theorem title="evolution of the distribution">
        <p>
          Let <M>{"\\pi_n"}</M> be the row vector with entries <M>{"P(X_n = i)"}</M>. Then <M>{"\\pi_{n+1} = \\pi_n P"}</M>, so{" "}
          <M>{"\\pi_n = \\pi_0 P^n"}</M>, and <M>{"P(X_{m+n} = j \\mid X_m = i) = (P^n)_{ij}"}</M>. In particular{" "}
          <M>{"P^{m+n} = P^m P^n"}</M> (the Chapman–Kolmogorov equations).
        </p>
      </Theorem>
      <Proof>
        <p>By the law of total probability over the value of <M>{"X_n"}</M>,</p>
        <MD>{"P(X_{n+1} = j) = \\sum_i P(X_n = i)\\,P(X_{n+1} = j \\mid X_n = i) = \\sum_i (\\pi_n)_i P_{ij} = (\\pi_n P)_j."}</MD>
        <p>
          Induction gives <M>{"\\pi_n = \\pi_0P^n"}</M>. Starting from the point mass at i at time m, which the Markov property
          allows, gives the n-step formula, and splitting m + n steps at step m gives Chapman–Kolmogorov.
        </p>
      </Proof>
      <p>
        For the weather chain of the figure, two steps from sun give 0.7·0.7 + 0.2·0.3 + 0.1·0.2 = 0.57 for sun again:
      </p>
      <Code>{STEP}</Code>

      <Example title="probability of a path">
        <p>
          By the multiplication rule and the Markov property,{" "}
          <M>{"P(X_0 = x_0, \\dots, X_n = x_n) = \\pi_0(x_0)P_{x_0x_1}P_{x_1x_2}\\cdots P_{x_{n-1}x_n}"}</M>. A bigram language
          model assigns exactly this probability to a sentence, with words as states.
        </p>
      </Example>

      <Example title="simulating and estimating">
        <p>
          To simulate, draw each next state from the row of the current one. To estimate P from one long observed path, count
          the transitions out of each state and normalise each row: this is the maximum-likelihood estimate, and with 50 000
          steps it recovers P to one decimal.
        </p>
        <Code>{SIM}</Code>
      </Example>

      <Remark title="what comes next">
        <p>
          In the figure every start leads to the same limiting bars. The next lessons ask when a chain has such a stationary
          distribution, when it is unique, and how fast <M>{"\\pi_0P^n"}</M> reaches it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: <p>For the weather chain P = [[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]], what is P(X₂ = sun | X₀ = sun)?</p>,
      answer: { kind: "numeric", value: 0.57, tolerance: 0.0001 },
    },
    {
      key: "path",
      rung: "check",
      prompt: <p>Starting from sun, what is the probability that the next two days are cloud and then rain?</p>,
      answer: { kind: "numeric", value: 0.06, tolerance: 0.0001 },
    },
    {
      key: "valid",
      rung: "apply",
      prompt: <p>Which of these is a valid transition matrix in the row convention?</p>,
      answer: {
        kind: "choice",
        options: ["[[0.5, 0.5], [1.0, 0.0]]", "[[0.5, 0.5], [0.6, 0.6]]", "[[0.5, 1.0], [0.5, 0.0]]", "[[1.2, −0.2], [0.3, 0.7]]"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def is_stochastic(P, tol=1e-9):
    P = np.asarray(P, dtype=float)
    return bool(np.all(P >= 0) and np.allclose(P.sum(axis=1), 1, atol=tol))

def n_step(P, pi0, n):
    return pi0 @ np.linalg.matrix_power(P, n)

P = np.array([[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]])
print(is_stochastic(P), is_stochastic(P.T))
print(n_step(P, np.array([1.0, 0, 0]), 2), n_step(P, np.array([0, 0, 1.0]), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False\n[0.57 0.25 0.18] [0.2 0.3 0.5]",
          "True True\n[0.57 0.25 0.18] [0.2 0.3 0.5]",
          "True False\n[0.7 0.2 0.1] [0.2 0.3 0.5]",
          "True False\n[0.57 0.25 0.18] [0.1 0.3 0.5]",
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

def simulate_chain(rng, P, x0, steps):
    path = [x0]
    for _ in range(steps):
        path.append(int(rng.choice(len(P), p=P[path[-1]])))
    return path

def empirical_transitions(path, k):
    C = np.zeros((k, k))
    for a, b in zip(path[:-1], path[1:]):
        C[a, b] += 1
    return C / C.sum(axis=1, keepdims=True)

P = np.array([[0.7, 0.2, 0.1], [0.3, 0.4, 0.3], [0.2, 0.3, 0.5]])
rng = np.random.default_rng(0)
path = simulate_chain(rng, P, 0, 50000)
print(path[:8])
print(np.round(empirical_transitions(path, 3), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 0, 0, 0, 0, 1, 2, 2]\n[[0.7 0.2 0.1]\n [0.3 0.4 0.3]\n [0.2 0.3 0.5]]",
          "[0, 0, 0, 0, 0, 1, 2, 2]\n[[0.7 0.3 0.2]\n [0.2 0.4 0.3]\n [0.1 0.3 0.5]]",
          "[0, 0, 0, 0, 0, 1, 2, 2]\n[[0.5 0.3 0.2]\n [0.5 0.3 0.2]\n [0.5 0.3 0.2]]",
          "[0, 1, 2, 0, 1, 2, 0, 1]\n[[0.7 0.2 0.1]\n [0.3 0.4 0.3]\n [0.2 0.3 0.5]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_stochastic(P, tol=1e-9)</C>, returning a Python bool that says whether P is non-negative with rows
          summing to 1, and <C>n_step(P, pi0, n)</C>, returning the distribution after n steps from the row vector pi0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_stochastic(P, tol=1e-9):
    return True

def n_step(P, pi0, n):
    return pi0
`,
        solution: STEP,
        tests: [
          { name: "stochastic", code: `assert is_stochastic([[0.5, 0.5], [1.0, 0.0]]) is True
assert is_stochastic([[0.5, 0.5], [0.6, 0.6]]) is False and is_stochastic([[1.2, -0.2], [0.3, 0.7]]) is False
assert is_stochastic(np.eye(3)) is True` },
          { name: "n steps", code: `P = np.array([[0.9, 0.1], [0.3, 0.7]])
assert np.allclose(n_step(P, np.array([1.0, 0.0]), 0), [1, 0])
assert np.allclose(n_step(P, np.array([1.0, 0.0]), 3), np.array([0.75, 0.25]) + 0.25 * 0.6 ** 3 * np.array([1, -1]))
assert np.allclose(n_step(P, np.array([0.75, 0.25]), 10), [0.75, 0.25])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simulate_chain(rng, P, x0, steps)</C>, returning the list of steps + 1 states (as ints) starting from x0,
          each drawn with <C>rng.choice(len(P), p=P[current])</C>, and <C>empirical_transitions(path, k)</C>, the k × k matrix of
          transition counts in the path with each row divided by its total (every state is left at least once).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def simulate_chain(rng, P, x0, steps):
    return [x0]

def empirical_transitions(path, k):
    return np.eye(k)
`,
        solution: SIM,
        tests: [
          { name: "deterministic chain", code: `P = np.array([[0.0, 1.0, 0.0], [0.0, 0.0, 1.0], [1.0, 0.0, 0.0]])
path = simulate_chain(np.random.default_rng(0), P, 1, 5)
assert path == [1, 2, 0, 1, 2, 0] and all(type(s) is int for s in path)
assert np.allclose(empirical_transitions([0, 1, 0, 0, 1], 2), [[1 / 3, 2 / 3], [1, 0]])` },
          { name: "recovers P", code: `P = np.array([[0.9, 0.1], [0.4, 0.6]])
path = simulate_chain(np.random.default_rng(3), P, 0, 30000)
assert len(path) == 30001 and np.allclose(empirical_transitions(path, 2), P, atol=0.02)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a Markov chain with transition matrix P, <M>{"\\pi_n = \\pi_0 P^n"}</M> for every n ≥ 0, where{" "}
          <M>{"\\pi_n"}</M> is the distribution of <M>{"X_n"}</M> as a row vector.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sets up induction, with the base case π₀ = π₀P⁰.",
          "Uses the law of total probability over X_n = i together with P(X_{n+1} = j | X_n = i) = P_ij to get π_{n+1} = π_n P.",
          "Combines with the induction hypothesis: π_{n+1} = π₀Pⁿ P = π₀P^{n+1}.",
        ],
      },
    },
    {
      key: "twostate",
      rung: "stretch",
      prompt: (
        <p>
          A two-state chain has P = [[0.9, 0.1], [0.3, 0.7]]. Its n-step entry is{" "}
          <M>{"(P^n)_{01} = \\tfrac{a}{a + b}(1 - (1 - a - b)^n)"}</M> with a = 0.1, b = 0.3. What is P(X₃ = 1 | X₀ = 0)? Give four
          decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.196, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend what makes a sequence a Markov chain, how a transition matrix is laid out, why the distribution after n steps is the start times Pⁿ, and how to simulate a chain and estimate its matrix from data.",

  glimpse: (
    <>
      <p>
        If <M>{"\\pi_0P^n"}</M> settles down, its limit π must satisfy π = πP: a left eigenvector of P with eigenvalue 1. The next
        lesson studies these stationary distributions and when they are unique.
      </p>
    </>
  ),
};
