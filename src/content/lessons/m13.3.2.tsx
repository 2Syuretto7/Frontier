import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LiftedWalkViz } from "@/components/viz/LiftedWalkViz";
import type { LessonContent } from "@/lib/types";

const RV = `import numpy as np

def is_reversible(P, pi, tol=1e-12):
    F = pi[:, None] * P
    return bool(np.allclose(F, F.T, atol=tol))

def symmetrise(P, pi):
    d = np.sqrt(pi)
    return d[:, None] * P / d[None, :]

def kolmogorov_cycle(P, cycle):
    pairs = list(zip(cycle, cycle[1:] + cycle[:1]))
    return float(np.prod([P[a, b] for a, b in pairs])), float(np.prod([P[b, a] for a, b in pairs]))`;

const MB = `import numpy as np

def metropolis_matrix(pi, neighbours):
    n = len(pi); P = np.zeros((n, n))
    for x in range(n):
        for y in neighbours[x]:
            P[x, y] = min(1.0, pi[y] / pi[x]) / len(neighbours[x])
        P[x, x] = 1 - P[x].sum()
    return P

def drift_cycle(n, p):
    P = np.zeros((n, n))
    for x in range(n):
        P[x, (x + 1) % n] += p; P[x, (x - 1) % n] += 1 - p
    return P`;

export const lesson: LessonContent = {
  id: "m13.3.2",
  minutes: 50,
  links: {
    requires: ["m13.3.1"],
    revisits: ["m7.8.5", "m3.7.3"],
    foreshadows: ["m13.4.1", "m13.4.3"],
  },

  puzzle: (
    <>
      <p>
        To make a chain sample from π you need π to be stationary, a global condition involving every state at once. Almost
        every MCMC method checks something much stronger and much more local instead: that the flow from x to y equals the
        flow back. Why does nearly everyone insist on this stronger condition, what does it buy beyond stationarity, and is
        anything lost by insisting on it? Strikingly, some of the fastest samplers deliberately break it.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Detailed balance says that, in stationarity, a film of the chain looks the same played backwards: every transition
        x → y is matched on average by y → x. It is easy to check one pair at a time, which is why it is the standard way
        to design samplers. It also makes the chain&apos;s transition operator symmetric in the right inner product, so its
        eigenvalues are real and its convergence is governed by a single spectral gap. The cost is that reversible chains
        tend to wander back and forth like a diffusion; a chain that keeps a sense of direction can cover ground much faster.
      </p>
      <LiftedWalkViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reversibility">
        <p>
          A transition matrix P is reversible with respect to π if{" "}
          <M>{"\\pi(x)P(x, y) = \\pi(y)P(y, x)"}</M> for all x, y. Summing over x shows π is then stationary. Equivalently, if{" "}
          <M>{"X_0 \\sim \\pi"}</M>, the pairs <M>{"(X_0, X_1)"}</M> and <M>{"(X_1, X_0)"}</M> have the same joint law.
        </p>
      </Definition>

      <Theorem title="Kolmogorov's criterion">
        <p>
          An irreducible chain is reversible with respect to some distribution if and only if, for every cycle{" "}
          <M>{"x_0, x_1, \\dots, x_k = x_0"}</M>, the product of transition probabilities around the cycle equals the product
          in the reverse direction.
        </p>
      </Theorem>
      <Proof>
        <p>
          If π satisfies detailed balance, multiply <M>{"P(x_i, x_{i+1}) = \\pi(x_{i+1})P(x_{i+1}, x_i)/\\pi(x_i)"}</M> around the
          cycle; the π ratios telescope to 1. Conversely, fix a state o and define{" "}
          <M>{"\\pi(x) \\propto \\prod P(y_i, y_{i+1})/P(y_{i+1}, y_i)"}</M> along any path from o to x with positive probability
          both ways; the cycle condition makes this independent of the path, and detailed balance for an edge x, y follows
          by extending a path to x by the step to y. The chain with rows (0, 0.8, 0.2), (0.2, 0, 0.8), (0.8, 0.2, 0) keeps
          the uniform distribution stationary but fails the test: 0.512 one way round, 0.008 the other.
        </p>
        <Code>{RV}</Code>
      </Proof>

      <Theorem title="reversible chains are symmetric">
        <p>
          If P is reversible with respect to π &gt; 0, then <M>{"S = D^{1/2} P D^{-1/2}"}</M> with <M>{"D = \\mathrm{diag}(\\pi)"}</M> is
          symmetric. Hence P has real eigenvalues in [−1, 1] and a basis of eigenvectors orthonormal in the inner product{" "}
          <M>{"\\langle f, g\\rangle_\\pi = \\sum_x \\pi(x)f(x)g(x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"S_{xy} = \\sqrt{\\pi(x)}P(x,y)/\\sqrt{\\pi(y)} = \\pi(x)P(x,y)/\\sqrt{\\pi(x)\\pi(y)}"}</M>, which is symmetric exactly
          by detailed balance. P is similar to S, so they share eigenvalues, which are real by the spectral theorem; if{" "}
          <M>{"S u = \\lambda u"}</M> then <M>{"P(D^{-1/2}u) = \\lambda D^{-1/2}u"}</M>, and orthonormality of the u in the usual inner
          product is orthonormality of the <M>{"D^{-1/2}u"}</M> in the π-weighted one. The eigenvalues lie in [−1, 1] because P is
          a stochastic matrix. The distance to stationarity then decays like <M>{"\\lambda_*^t"}</M> with{" "}
          <M>{"\\lambda_*"}</M> the second-largest absolute eigenvalue, the subject of the next lesson.
        </p>
      </Proof>

      <Remark title="building and breaking balance">
        <p>
          Detailed balance gives a recipe: propose a move and accept it with a probability chosen so the two flows match. With a
          symmetric proposal the Metropolis rule <M>{"\\min(1, \\pi(y)/\\pi(x))"}</M> does it, as the code below checks. But
          stationarity needs only global balance. Composing reversible steps, as systematic-scan Gibbs sampling does, gives a
          chain that is stationary but not reversible. Lifting adds a direction variable so the chain persists rather than
          diffuses; on a cycle of n sites it cuts the mixing time from order <M>{"n^2"}</M> to order n. Hamiltonian Monte Carlo
          and several modern samplers exploit the same idea.
        </p>
        <Code>{MB}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flow",
      rung: "check",
      prompt: (
        <p>
          A chain has stationary distribution (0.25, 0.5, 0.25) and P(0, 1) = 0.5. What must P(1, 0) be for detailed balance on
          that pair?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.0001 },
    },
    {
      key: "cycle",
      rung: "check",
      prompt: <p>For the rotating chain with rows (0, 0.8, 0.2), (0.2, 0, 0.8), (0.8, 0.2, 0), what is the product of probabilities around the cycle 0 → 1 → 2 → 0?</p>,
      answer: { kind: "numeric", value: 0.512, tolerance: 0.0001 },
    },
    {
      key: "real",
      rung: "apply",
      prompt: <p>Why does a reversible transition matrix have only real eigenvalues?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is similar to a symmetric matrix, D^(1/2) P D^(−1/2), because of detailed balance",
          "Every stochastic matrix has real eigenvalues",
          "Its rows sum to one",
          "Its stationary distribution is uniform",
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

def is_reversible(P, pi, tol=1e-12):
    F = pi[:, None] * P
    return bool(np.allclose(F, F.T, atol=tol))

def symmetrise(P, pi):
    d = np.sqrt(pi)
    return d[:, None] * P / d[None, :]

def kolmogorov_cycle(P, cycle):
    pairs = list(zip(cycle, cycle[1:] + cycle[:1]))
    return float(np.prod([P[a, b] for a, b in pairs])), float(np.prod([P[b, a] for a, b in pairs]))

P = np.array([[0.5, 0.5, 0.0], [0.25, 0.5, 0.25], [0.0, 0.5, 0.5]]); pi = np.array([0.25, 0.5, 0.25]); print(is_reversible(P, pi), (np.round(np.linalg.eigvalsh(symmetrise(P, pi)), 3) + 0.0).tolist())
Q = np.array([[0.0, 0.8, 0.2], [0.2, 0.0, 0.8], [0.8, 0.2, 0.0]]); print(is_reversible(Q, np.full(3, 1 / 3)), [round(v, 3) for v in kolmogorov_cycle(Q, [0, 1, 2])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True [0.0, 0.5, 1.0]\nFalse [0.512, 0.008]",
          "True [0.0, 0.5, 1.0]\nTrue [0.512, 0.512]",
          "False [0.0, 0.5, 1.0]\nFalse [0.512, 0.008]",
          "True [0.5, 0.75, 1.0]\nFalse [0.512, 0.008]",
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

def metropolis_matrix(pi, neighbours):
    n = len(pi); P = np.zeros((n, n))
    for x in range(n):
        for y in neighbours[x]:
            P[x, y] = min(1.0, pi[y] / pi[x]) / len(neighbours[x])
        P[x, x] = 1 - P[x].sum()
    return P

def drift_cycle(n, p):
    P = np.zeros((n, n))
    for x in range(n):
        P[x, (x + 1) % n] += p; P[x, (x - 1) % n] += 1 - p
    return P

pi = np.array([0.1, 0.2, 0.3, 0.4]); P = metropolis_matrix(pi, [[1, 3], [0, 2], [1, 3], [2, 0]]); F = pi[:, None] * P; print(np.round(pi @ P, 3).tolist(), np.allclose(F, F.T))
u = np.full(5, 0.2); D = drift_cycle(5, 0.9); G = u[:, None] * D; print(np.round(u @ D, 3).tolist(), np.allclose(G, G.T))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.1, 0.2, 0.3, 0.4] True\n[0.2, 0.2, 0.2, 0.2, 0.2] False",
          "[0.1, 0.2, 0.3, 0.4] True\n[0.2, 0.2, 0.2, 0.2, 0.2] True",
          "[0.25, 0.25, 0.25, 0.25] True\n[0.2, 0.2, 0.2, 0.2, 0.2] False",
          "[0.1, 0.2, 0.3, 0.4] False\n[0.2, 0.2, 0.2, 0.2, 0.2] False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_reversible(P, pi)</C>; <C>symmetrise(P, pi)</C>, the matrix <M>{"D^{1/2}PD^{-1/2}"}</M>; and{" "}
          <C>kolmogorov_cycle(P, cycle)</C>, returning the products of transition probabilities around a list of states in each
          direction.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_reversible(P, pi, tol=1e-12):
    return True

def symmetrise(P, pi):
    return P

def kolmogorov_cycle(P, cycle):
    return 1.0, 1.0
`,
        solution: RV,
        tests: [
          { name: "reversible", code: `P = np.array([[0.9, 0.1], [0.5, 0.5]]); pi = np.array([5 / 6, 1 / 6]); S = symmetrise(P, pi)
assert is_reversible(P, pi) and np.allclose(S, S.T) and not is_reversible(np.roll(np.eye(3), 1, axis=1), np.full(3, 1 / 3))` },
          { name: "cycle", code: `Q = np.array([[0.0, 0.7, 0.3], [0.3, 0.0, 0.7], [0.7, 0.3, 0.0]]); f, b = kolmogorov_cycle(Q, [0, 1, 2]); assert np.isclose(f, 0.343) and np.isclose(b, 0.027)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>metropolis_matrix(pi, neighbours)</C>, proposing a uniformly chosen neighbour and accepting with probability{" "}
          <M>{"\\min(1, \\pi(y)/\\pi(x))"}</M> (all states have the same number of neighbours), and <C>drift_cycle(n, p)</C>,
          stepping +1 with probability p and −1 otherwise around a cycle.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def metropolis_matrix(pi, neighbours):
    return np.eye(len(pi))

def drift_cycle(n, p):
    return np.eye(n)
`,
        solution: MB,
        tests: [
          { name: "metropolis", code: `pi = np.array([0.05, 0.15, 0.3, 0.2, 0.3]); nb = [[(i + 1) % 5, (i - 1) % 5] for i in range(5)]; P = metropolis_matrix(pi, nb); F = pi[:, None] * P
assert np.allclose(P.sum(axis=1), 1) and np.allclose(F, F.T) and np.allclose(pi @ P, pi) and P.min() >= 0 and P[0, 1] == 0.5` },
          { name: "drift", code: `D = drift_cycle(4, 0.7); assert np.allclose(D.sum(axis=1), 1) and np.isclose(D[0, 1], 0.7) and np.isclose(D[0, 3], 0.3)
assert np.allclose(np.full(4, 0.25) @ D, 0.25) and np.allclose(drift_cycle(3, 0.5), drift_cycle(3, 0.5).T)` },
        ],
      },
    },
    {
      key: "hold",
      rung: "stretch",
      prompt: (
        <p>
          The Metropolis chain for π = (0.1, 0.2, 0.3, 0.4) on a four-cycle, proposing each neighbour with probability ½: what is
          the probability of staying at the last state?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        For reversible chains, the gap between 1 and the next eigenvalue controls how fast the chain forgets its start. The
        next lesson turns that into concrete mixing-time bounds, and shows when the bounds are sharp.
      </p>
    </>
  ),
};
