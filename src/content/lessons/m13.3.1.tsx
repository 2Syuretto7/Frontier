import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ErgodicityViz } from "@/components/viz/ErgodicityViz";
import type { LessonContent } from "@/lib/types";

const EG = `import numpy as np

def stationary(P):
    w, v = np.linalg.eig(P.T)
    pi = np.real(v[:, np.argmin(np.abs(w - 1))])
    return pi / pi.sum()

def tv_curve(P, x0, ts):
    pi, d, t, out = stationary(P), np.eye(len(P))[x0], 0, []
    for T in ts:
        while t < T:
            d = d @ P; t += 1
        out.append(0.5 * float(np.abs(d - pi).sum()))
    return out

def simulate(P, x0, n, rng):
    path = np.empty(n, dtype=int); path[0] = x0
    for t in range(1, n):
        path[t] = rng.choice(len(P), p=P[path[t - 1]])
    return path`;

const PR = `import numpy as np
from math import gcd

def period(P, x, max_len=50):
    g, M = 0, np.eye(len(P))
    for k in range(1, max_len + 1):
        M = M @ P
        if M[x, x] > 1e-12:
            g = gcd(g, k)
    return g

def mean_return_time(path, x):
    idx = np.flatnonzero(np.asarray(path) == x)
    return float(np.mean(np.diff(idx)))`;

export const lesson: LessonContent = {
  id: "m13.3.1",
  minutes: 50,
  links: {
    requires: ["m7.8.3"],
    revisits: ["m7.8.2", "m13.1.4"],
    foreshadows: ["m13.3.2", "m13.3.3", "m13.4.1"],
  },

  puzzle: (
    <>
      <p>
        Every Markov chain Monte Carlo method rests on one promise: run the chain long enough and the fraction of time it
        spends in each region equals that region&apos;s probability, wherever it started. Yet a chain that alternates between
        two states never settles in distribution, and its time averages still come out right. A chain split into two
        disconnected halves settles perfectly, and its averages are wrong. What exactly does the promise require?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two different properties are in play. Convergence in distribution asks whether, at a single large time, the chain
        could be anywhere with the right probabilities; a strict rhythm (periodicity) spoils it. Convergence of time
        averages, the ergodic property, only asks that each visit pattern repeats in the long run; it needs the chain to be
        able to reach everything (irreducibility) and to come back in finite expected time, but rhythm does no harm. MCMC
        estimates are time averages, so ergodicity is the property that matters.
      </p>
      <ErgodicityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="irreducible, aperiodic, positive recurrent">
        <p>
          A chain on a countable space is irreducible if every state can reach every other with positive probability. The
          period of x is <M>{"\\gcd\\{t \\ge 1 : P^t(x, x) > 0\\}"}</M>; an irreducible chain has one period for all states, and
          is aperiodic when it is 1. It is positive recurrent if the expected return time{" "}
          <M>{"\\mathbb E_x[\\tau_x]"}</M> is finite; every irreducible chain on a finite space is.
        </p>
      </Definition>

      <Theorem title="convergence by coupling">
        <p>
          For an irreducible aperiodic chain on a finite space with stationary distribution π, there are C and ρ &lt; 1 with{" "}
          <M>{"\\|P^t(x, \\cdot) - \\pi\\|_{TV} \\le C\\rho^t"}</M> for every starting state x.
        </p>
      </Theorem>
      <Proof>
        <p>
          Irreducibility and aperiodicity together give an N with <M>{"P^N(x, y) > 0"}</M> for all x, y (the set of return times
          is closed under addition with gcd 1, so it contains every large integer). Let δ be the smallest entry of{" "}
          <M>{"P^N"}</M>. Run one chain X from x and an independent chain Y from π until they first occupy the same state, then
          move them together. In any block of N steps they meet with probability at least δ, whatever their positions, so{" "}
          <M>{"P(\\text{not met by } t) \\le (1-\\delta)^{\\lfloor t/N \\rfloor}"}</M>. Y is always distributed as π, and{" "}
          <M>{"|P(X_t \\in A) - \\pi(A)| \\le P(X_t \\ne Y_t)"}</M>, which is at most the probability they have not met.
        </p>
        <Code>{EG}</Code>
      </Proof>

      <Theorem title="ergodic theorem and Kac's formula">
        <p>
          For an irreducible positive recurrent chain with stationary π, from any start and for any f with{" "}
          <M>{"\\sum_x \\pi(x)|f(x)| < \\infty"}</M>,{" "}
          <M>{"\\frac1n\\sum_{t<n} f(X_t) \\to \\sum_x \\pi(x)f(x)"}</M> almost surely. Moreover{" "}
          <M>{"\\pi(x) = 1/\\mathbb E_x[\\tau_x]"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sketch. Cut the path at successive visits to a fixed state x. By the strong Markov property the excursions between
          visits are independent and identically distributed. The strong law of large numbers applies to the excursion
          lengths and to the sum of f over each excursion, and the ratio of the two averages is the time average. Taking{" "}
          <M>{"f = \\mathbf 1_x"}</M>, the long-run fraction of time at x is one visit per mean excursion length, which is Kac&apos;s
          formula. No aperiodicity was used: a periodic chain&apos;s averages converge although its distribution does not.
        </p>
        <Code>{PR}</Code>
      </Proof>

      <Remark title="error bars for MCMC">
        <p>
          Under stronger conditions a Markov chain central limit theorem holds:{" "}
          <M>{"\\sqrt n(\\bar f_n - \\pi f)"}</M> is asymptotically normal with variance{" "}
          <M>{"\\sigma^2(1 + 2\\sum_k \\rho_k)"}</M>, the autocorrelation-inflated variance from the effective sample size lesson.
          Reducibility is the silent failure: a sampler trapped in one mode of a posterior behaves exactly like the reducible
          chain above, settling confidently on the wrong answer. Running several chains from dispersed starts and comparing
          them is the standard check.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tv",
      rung: "check",
      prompt: (
        <p>
          For the three-state chain with rows (½, ½, 0), (¼, ½, ¼), (0, ½, ½), started in the first state, the distance after t ≥ 1
          steps is <M>{"(1/2)^{t+1}"}</M>. What is it after 3 steps?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.0001 },
    },
    {
      key: "kac",
      rung: "check",
      prompt: <p>A state has stationary probability 0.2. What is the expected number of steps to return to it?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.0001 },
    },
    {
      key: "periodic",
      rung: "apply",
      prompt: <p>An irreducible chain on finitely many states has period 2. Which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its distribution at time t need not converge, but time averages still converge to stationary expectations",
          "Neither its distribution nor its time averages converge",
          "It has no stationary distribution",
          "Its time averages depend on the starting state",
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
    w, v = np.linalg.eig(P.T)
    pi = np.real(v[:, np.argmin(np.abs(w - 1))])
    return pi / pi.sum()

def tv_curve(P, x0, ts):
    pi, d, t, out = stationary(P), np.eye(len(P))[x0], 0, []
    for T in ts:
        while t < T:
            d = d @ P; t += 1
        out.append(0.5 * float(np.abs(d - pi).sum()))
    return out

def simulate(P, x0, n, rng):
    path = np.empty(n, dtype=int); path[0] = x0
    for t in range(1, n):
        path[t] = rng.choice(len(P), p=P[path[t - 1]])
    return path

P = np.array([[0.5, 0.5, 0.0], [0.25, 0.5, 0.25], [0.0, 0.5, 0.5]]); print(np.round(stationary(P), 3).tolist(), [round(v, 4) for v in tv_curve(P, 0, [0, 1, 5, 20])])
Q = np.array([[0.0, 1.0], [1.0, 0.0]]); print([round(v, 3) for v in tv_curve(Q, 0, [10, 11])], float(np.mean(simulate(Q, 0, 1000, np.random.default_rng(0)) == 0)))
path = simulate(P, 1, 20000, np.random.default_rng(1)); print(round(float(np.mean(path == 1)), 1), round(float(np.mean(np.diff(np.flatnonzero(path == 0)))), 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.25, 0.5, 0.25] [0.75, 0.25, 0.0156, 0.0]\n[0.5, 0.5] 0.5\n0.5 4.0",
          "[0.25, 0.5, 0.25] [0.75, 0.25, 0.0156, 0.0]\n[0.0, 0.0] 0.5\n0.5 4.0",
          "[0.333, 0.333, 0.333] [0.667, 0.25, 0.0156, 0.0]\n[0.5, 0.5] 0.5\n0.5 4.0",
          "[0.25, 0.5, 0.25] [0.75, 0.25, 0.0156, 0.0]\n[0.5, 0.5] 0.5\n0.5 2.0",
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
from math import gcd

def period(P, x, max_len=50):
    g, M = 0, np.eye(len(P))
    for k in range(1, max_len + 1):
        M = M @ P
        if M[x, x] > 1e-12:
            g = gcd(g, k)
    return g

def mean_return_time(path, x):
    idx = np.flatnonzero(np.asarray(path) == x)
    return float(np.mean(np.diff(idx)))

C = np.roll(np.eye(4), 1, axis=1) * 0.5 + np.roll(np.eye(4), -1, axis=1) * 0.5; P = np.array([[0.5, 0.5, 0.0], [0.25, 0.5, 0.25], [0.0, 0.5, 0.5]])
print(period(C, 0), period(P, 0), mean_return_time([0, 1, 0, 2, 2, 0], 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2 1 2.5", "4 1 2.5", "2 2 2.5", "2 1 3.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stationary(P)</C> from the eigenvector of <M>{"P^\\top"}</M> for eigenvalue 1; <C>tv_curve(P, x0, ts)</C>, the
          total variation distances to π after each number of steps in the increasing list ts; and{" "}
          <C>simulate(P, x0, n, rng)</C>, a path of n states starting at x0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stationary(P):
    return np.full(len(P), 1 / len(P))

def tv_curve(P, x0, ts):
    return [0.0 for _ in ts]

def simulate(P, x0, n, rng):
    return np.full(n, x0)
`,
        solution: EG,
        tests: [
          { name: "stationary", code: `assert np.allclose(stationary(np.array([[0.9, 0.1], [0.5, 0.5]])), [5 / 6, 1 / 6])
assert np.allclose(tv_curve(np.array([[0.7, 0.3], [0.1, 0.9]]), 0, [0, 5]), [0.75, 0.75 * 0.6 ** 5])` },
          { name: "simulate", code: `p = simulate(np.array([[0.9, 0.1], [0.5, 0.5]]), 1, 20000, np.random.default_rng(0)); assert p[0] == 1 and abs(np.mean(p == 0) - 5 / 6) < 0.02` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>period(P, x, max_len)</C>, the gcd of the return times up to max_len with positive probability, and{" "}
          <C>mean_return_time(path, x)</C>, the average gap between successive visits to x in a path.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import gcd

def period(P, x, max_len=50):
    return 1

def mean_return_time(path, x):
    return 0.0
`,
        solution: PR,
        tests: [
          { name: "period", code: `C3 = np.roll(np.eye(3), 1, axis=1); assert period(C3, 0) == 3 and period(np.array([[0.5, 0.5], [0.5, 0.5]]), 1) == 1
assert period(np.array([[0.0, 1.0, 0.0], [0.5, 0.0, 0.5], [0.0, 1.0, 0.0]]), 1) == 2` },
          { name: "return", code: `assert mean_return_time([1, 0, 0, 1, 0, 1], 1) == 2.5 and mean_return_time(np.array([2, 2, 2]), 2) == 1.0` },
        ],
      },
    },
    {
      key: "twostate",
      rung: "stretch",
      prompt: (
        <p>
          A two-state chain moves from state 0 to 1 with probability 0.3 and from 1 to 0 with probability 0.1. Started at 0, what
          is its total variation distance to stationarity after 5 steps? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.0583, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Ergodicity says which π a chain converges to only implicitly. To build a sampler for a given π we need a simple local
        condition that guarantees it is stationary: detailed balance.
      </p>
    </>
  ),
};
