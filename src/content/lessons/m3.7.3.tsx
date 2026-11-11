import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { MarkovViz } from "@/components/viz/MarkovViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m3.7.3",
  minutes: 60,
  links: {
    requires: ["m3.7.2"],
    revisits: ["m0.8.3"],
    foreshadows: ["m7.8.1", "m7.8.2", "m7.8.3"],
  },

  puzzle: (
    <>
      <p>
        Each day, 10% of the people in a city move to the suburbs, and 20% of the people in the suburbs move to the city.
        Nobody is born, dies, or leaves the region.
      </p>
      <p>
        If everyone starts in the city, what fraction lives there after many years? Does it matter where everyone starts? How
        quickly does the population settle?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The population vector is multiplied by the same matrix every day. Its eigenvalues are 1 and 0.7. The part along the
        eigenvector for 1 stays forever; the part along the other shrinks by 0.7 each day. Move the starting split and the day
        below: every start ends at the same place, and the gap closes geometrically.
      </p>
      <MarkovViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Markov matrix">
        <p>
          A <strong>Markov matrix</strong> P has non-negative entries and every column sums to 1. Entry{" "}
          <M>{"p_{ij}"}</M> is the probability of moving from state j to state i in one step. If <M>{"\\mathbf u_k"}</M> is the
          distribution over states at step k, then <M>{"\\mathbf u_{k+1} = P\\mathbf u_k"}</M> and{" "}
          <M>{"\\mathbf u_k = P^k\\mathbf u_0"}</M>.
        </p>
      </Definition>

      <Theorem title="1 is always an eigenvalue">
        <p>
          Every Markov matrix has eigenvalue 1, and every eigenvalue satisfies <M>{"|\\lambda| \\le 1"}</M>. If all entries
          are positive, the eigenvalue 1 has an eigenvector with positive entries, the <strong>steady state</strong>, and every
          other eigenvalue has <M>{"|\\lambda| < 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The columns of P − I each sum to 0, so the rows of P − I add up to the zero row: they are dependent, and P − I is
          singular. For the bound, <M>{"P^{\\mathsf T}"}</M> has the same eigenvalues; if{" "}
          <M>{"P^{\\mathsf T}\\mathbf y = \\lambda\\mathbf y"}</M> and <M>{"|y_i|"}</M> is the largest entry, then{" "}
          <M>{"|\\lambda||y_i| = |\\sum_j p_{ji}y_j| \\le \\sum_j p_{ji}|y_i| = |y_i|"}</M>. The positive case is the
          Perron-Frobenius theorem, which we do not prove here.
        </p>
      </Proof>

      <Theorem title="convergence">
        <p>
          If P is diagonalisable with eigenvalue 1 once and all others below 1 in size, then{" "}
          <M>{"\\mathbf u_k \\to \\mathbf u_\\infty"}</M>, the steady state scaled to sum 1, from any starting distribution. The
          error shrinks like <M>{"|\\lambda_2|^k"}</M>, where <M>{"\\lambda_2"}</M> is the second largest eigenvalue in size.
        </p>
      </Theorem>

      <Example title="the puzzle">
        <MD>{"P = \\begin{bmatrix} 0.9 & 0.2 \\\\ 0.1 & 0.8 \\end{bmatrix}, \\qquad (P - I)\\mathbf u = \\mathbf 0 \\implies 0.1u_1 = 0.2u_2."}</MD>
        <p>
          With <M>{"u_1 + u_2 = 1"}</M>, the steady state is (2/3, 1/3): two thirds in the city, whatever the start. The other
          eigenvalue is trace − 1 = 0.7, so the distance to the steady state is multiplied by 0.7 each day. After 13 days it is
          below 1% of where it started.
        </p>
      </Example>

      <Remark title="PageRank">
        <p>
          The original PageRank treated the web as a Markov chain: a surfer follows a random link, or with small probability
          jumps to a random page. A page&rsquo;s rank is its share of the steady state, computed by multiplying by P repeatedly.
        </p>
      </Remark>

      <Remark title="mixing">
        <p>
          The gap 1 − |λ₂| controls how fast a chain forgets its start. Sampling methods such as Markov chain Monte Carlo are
          only as good as this mixing speed, which Probability studies in its final chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "one",
      rung: "check",
      prompt: <p>Which number is always an eigenvalue of a Markov matrix?</p>,
      answer: { kind: "choice", options: ["1", "0", "−1", "The trace"], correct: [0] },
    },
    {
      key: "steady",
      rung: "check",
      prompt: <p>For P = [[0.9, 0.2], [0.1, 0.8]], what is the first entry of the steady state? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0002 },
    },
    {
      key: "steady2",
      rung: "apply",
      prompt: <p>Find the first entry of the steady state of P = [[0.8, 0.3], [0.2, 0.7]].</p>,
      answer: { kind: "numeric", value: 0.6 },
    },
    {
      key: "lambda2",
      rung: "apply",
      prompt: <p>Find the second eigenvalue of P = [[0.8, 0.3], [0.2, 0.7]].</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>With P = [[0.9, 0.2], [0.1, 0.8]] and everyone starting in state 1, what fraction is in state 1 after two steps?</p>,
      answer: { kind: "numeric", value: 0.83 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
P = np.array([[0.9, 0.2], [0.1, 0.8]])
u = np.array([0.0, 1.0])
for _ in range(200):
    u = P @ u
print(round(u[0], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0002 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
P = np.array([[0.9, 0.2], [0.1, 0.8]])
x = np.array([1.0, 0.0])
for _ in range(50):
    x = P @ x
print(np.round(x, 4), np.round(np.linalg.matrix_power(P, 50)[:, 1], 4))`}</Code>
          <p>A Markov matrix with columns summing to 1, run for 50 steps from two starts. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.6667 0.3333] [0.6667 0.3333]", "[0.5 0.5] [0.5 0.5]", "[0.6667 0.3333] [0.3333 0.6667]", "[0.9 0.1] [0.2 0.8]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>steady_state(P)</C>, which returns the steady state of a Markov matrix: the eigenvector for eigenvalue 1,
            scaled so its entries sum to 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def steady_state(P):
    n = len(P)
    return np.ones(n) / n
`,
        solution: `import numpy as np

def steady_state(P):
    lam, X = np.linalg.eig(np.asarray(P, float))
    v = np.real(X[:, np.argmin(np.abs(lam - 1))])
    return v / v.sum()
`,
        tests: [
          { name: "city", code: `import numpy as np
assert np.allclose(steady_state([[0.9, 0.2], [0.1, 0.8]]), [2 / 3, 1 / 3]), 'The city and suburbs settle at (2/3, 1/3).'` },
          { name: "other", code: `import numpy as np
assert np.allclose(steady_state([[0.8, 0.3], [0.2, 0.7]]), [0.6, 0.4]), 'Scale the eigenvector so its entries add up to 1.'` },
          { name: "fixed", code: `import numpy as np
P = np.array([[0.5, 0.2, 0.3], [0.3, 0.6, 0.1], [0.2, 0.2, 0.6]])
u = steady_state(P)
assert np.allclose(P @ u, u) and abs(u.sum() - 1) < 1e-9, 'The steady state satisfies Pu = u.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>pagerank(links, n, damping=0.85, tol=1e-12)</C> for a directed graph on pages 0 … n − 1 given as a list of (from, to) links: build the column-stochastic matrix (a page with no out-links links to every page equally), mix it with the uniform matrix by damping, and run power iteration from the uniform vector until the 1-norm change is below tol. Return (ranks, iterations). Then write <C>absorbing_time(P, transient)</C> for a Markov chain with column-stochastic P: the expected number of steps to absorption from each transient state, from the fundamental matrix (I − Q)⁻¹ where Q is P restricted to the transient states.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pagerank(links, n, damping=0.85, tol=1e-12):
    return (np.ones(n) / n, 0)

def absorbing_time(P, transient):
    return np.zeros(len(transient))
`,
        solution: `import numpy as np

def pagerank(links, n, damping=0.85, tol=1e-12):
    M = np.zeros((n, n))
    for a, b in links:
        M[b, a] += 1
    out = M.sum(0)
    for j in range(n):
        M[:, j] = M[:, j] / out[j] if out[j] else 1.0 / n
    G = damping * M + (1 - damping) / n
    x = np.ones(n) / n
    for k in range(1, 10000):
        y = G @ x
        if np.abs(y - x).sum() < tol:
            return (y, k)
        x = y
    return (x, k)

def absorbing_time(P, transient):
    P = np.asarray(P, float)
    Q = P[np.ix_(transient, transient)]
    N = np.linalg.inv(np.eye(len(transient)) - Q)
    return np.ones(len(transient)) @ N
`,
        tests: [
          { name: "cycle", code: `import numpy as np
r, k = pagerank([(0, 1), (1, 2), (2, 0)], 3)
assert np.allclose(r, 1 / 3) and abs(r.sum() - 1) < 1e-12, 'A cycle ranks all pages equally.'` },
          { name: "hub", code: `import numpy as np
r, k = pagerank([(1, 0), (2, 0), (3, 0), (0, 1)], 4)
assert r.argmax() == 0 and r[1] > r[2] and abs(r.sum() - 1) < 1e-12 and np.isclose(r[2], r[3]), 'Everyone links to page 0.'` },
          { name: "dangling", code: `import numpy as np
r, k = pagerank([(0, 1)], 3)
G = np.array([[0, 0, 1 / 3], [1, 1 / 3 * 0 + 1 / 3, 1 / 3], [0, 1 / 3, 1 / 3]])
assert abs(r.sum() - 1) < 1e-12 and r[1] > r[0] and k < 200, 'Pages with no links spread their rank evenly.'` },
          { name: "gambler", code: `import numpy as np
P = np.zeros((5, 5))
P[0, 0] = P[4, 4] = 1
for i in (1, 2, 3):
    P[i - 1, i] = P[i + 1, i] = 0.5
assert np.allclose(absorbing_time(P, [1, 2, 3]), [3, 4, 3]), 'A fair walk on 0 … 4 from i takes i(4 − i) steps.'` },
        ],
      },
    },
    {
      key: "proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that every Markov matrix has 1 as an eigenvalue. Then show that P maps distributions to distributions: if u has
          non-negative entries summing to 1, so does Pu.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that each column of P − I sums to 0, so (1, …, 1)(P − I) = 0.",
          "Concludes the rows of P − I are dependent, so P − I is singular and 1 is an eigenvalue.",
          "Shows Pu has non-negative entries since P and u do.",
          "Computes Σ_i (Pu)_i = Σ_j u_j Σ_i p_ij = Σ_j u_j = 1.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          For the city and suburbs chain, the distance to the steady state is multiplied by 0.7 each day. What is the smallest
          number of days after which it is below 1% of the starting distance?
        </p>
      ),
      answer: { kind: "numeric", value: 13 },
    },
  ],

  teachBack:
    "Explain to a friend what a Markov matrix is, why it always has eigenvalue 1, why repeated steps settle into a steady state, and what decides how fast.",

  glimpse: (
    <p>
      Next, symmetric matrices, whose eigenvalues are real and whose eigenvectors are perpendicular. Probability returns to
      Markov chains with transition matrices, stationary distributions and mixing times.
    </p>
  ),
};
