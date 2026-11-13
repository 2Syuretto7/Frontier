import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IsingGibbsViz } from "@/components/viz/IsingGibbsViz";
import type { LessonContent } from "@/lib/types";

const ISING = `import itertools
import numpy as np

def ising_joint(n, edges, J, h):
    states = np.array(list(itertools.product([-1, 1], repeat=n)))
    energy = -J * sum(states[:, i] * states[:, j] for i, j in edges) - h * states.sum(axis=1)
    w = np.exp(-energy)
    return states, w / w.sum()

def cond_prob(i, x, edges, J, h):
    field = h + J * sum(x[b] if a == i else x[a] for a, b in edges if i in (a, b))
    return float(1 / (1 + np.exp(-2 * field)))`;

const GIBBS = `import numpy as np

def gibbs(n, edges, J, h, sweeps, seed=0):
    rng = np.random.default_rng(seed)
    nbrs = [[b if a == i else a for a, b in edges if i in (a, b)] for i in range(n)]
    x = rng.choice([-1, 1], size=n)
    out = np.zeros((sweeps, n), dtype=int)
    for s in range(sweeps):
        for i in range(n):
            field = h + J * x[nbrs[i]].sum()
            x[i] = 1 if rng.random() < 1 / (1 + np.exp(-2 * field)) else -1
        out[s] = x
    return out

def separated(edges, A, B, Z):
    seen, stack = set(Z) | set(A), list(A)
    while stack:
        v = stack.pop()
        for a, b in edges:
            w = b if a == v else a if b == v else None
            if w is not None and w not in seen:
                if w in B:
                    return False
                seen.add(w)
                stack.append(w)
    return True`;

export const lesson: LessonContent = {
  id: "l2.7.2",
  minutes: 55,
  links: {
    requires: ["l2.7.1", "m7.8.5"],
    revisits: ["l2.2.3", "m4.3.4"],
    foreshadows: ["l2.7.3"],
  },

  puzzle: (
    <>
      <p>
        In a photograph, a pixel tends to match its neighbours, and each neighbour tends to match it. Neither causes the
        other, so there is no sensible direction to put on the arrows of a Bayesian network, and any choice of directions
        creates colliders that do not belong. How do you write down a joint distribution in which dependence is a
        symmetric, local relation?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of a conditional table for each variable, give each group of mutually linked variables a compatibility
        score, a potential, that is large for configurations you expect and small for the rest. Multiply the scores and
        normalise. A variable then interacts with the rest only through its neighbours, so its conditional distribution
        given everything else depends on its neighbours alone, which is exactly what a sampler needs.
      </p>
      <IsingGibbsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Markov random field">
        <p>
          An undirected graph G on variables <M>{"x_1, \\dots, x_d"}</M> and nonnegative potentials <M>{"\\psi_C"}</M> on its
          cliques define
        </p>
        <MD>{"p(x) = \\frac1Z\\prod_C \\psi_C(x_C), \\qquad Z = \\sum_x \\prod_C \\psi_C(x_C)."}</MD>
        <p>
          Writing <M>{"\\psi_C = e^{-E_C}"}</M> gives <M>{"p(x) \\propto e^{-E(x)}"}</M> with energy{" "}
          <M>{"E = \\sum_C E_C"}</M>. The Ising model has spins <M>{"x_i \\in \\{-1, 1\\}"}</M>, edge potentials{" "}
          <M>{"e^{Jx_ix_j}"}</M> and node potentials <M>{"e^{hx_i}"}</M>. The normaliser Z is a sum over all{" "}
          <M>{"2^d"}</M> configurations, which is why the code can compute it only for tiny graphs.
        </p>
        <Code>{ISING}</Code>
      </Definition>

      <Theorem title="graph separation implies conditional independence">
        <p>
          If every path from a set A to a set B passes through a set Z, then <M>{"x_A"}</M> and <M>{"x_B"}</M> are
          conditionally independent given <M>{"x_Z"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let A′ be the variables reachable from A without passing through Z, and B′ the rest outside Z, so B ⊆ B′. No edge
          joins A′ to B′, since such an edge would extend a Z-avoiding path from A into B′. A clique is fully connected, so
          it cannot meet both A′ and B′; each clique lies in <M>{"A' \\cup Z"}</M> or in <M>{"B' \\cup Z"}</M>. Grouping
          the potentials accordingly gives <M>{"p(x) = f(x_{A'}, x_Z)\\,g(x_{B'}, x_Z)"}</M>, and dividing by{" "}
          <M>{"p(x_Z)"}</M> shows that <M>{"x_{A'}"}</M> and <M>{"x_{B'}"}</M> are independent given <M>{"x_Z"}</M>.
          Marginalising to A and B keeps this.
        </p>
      </Proof>

      <Theorem title="the conditional of one variable">
        <p>
          <M>{"p(x_i \\mid x_{-i})"}</M> depends only on the neighbours of i, its Markov blanket. For the Ising model,
        </p>
        <MD>{"P(x_i = 1 \\mid x_{-i}) = \\sigma\\Big(2\\big(h + J\\textstyle\\sum_{j \\sim i} x_j\\big)\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          In <M>{"p(x_i \\mid x_{-i}) = p(x)/\\sum_{x_i'} p(x_i', x_{-i})"}</M>, Z cancels and so does every potential not
          containing <M>{"x_i"}</M>; the ones that remain involve only i and its neighbours. For the Ising model the terms
          containing <M>{"x_i"}</M> are <M>{"x_i(h + J\\sum_{j \\sim i}x_j) = x_i f"}</M>, so{" "}
          <M>{"P(x_i = 1 \\mid x_{-i}) = e^f/(e^f + e^{-f}) = \\sigma(2f)"}</M>.
        </p>
      </Proof>

      <Remark title="Gibbs sampling and its limits">
        <p>
          Gibbs sampling sweeps through the variables, redrawing each from its conditional given the current values of the
          others. Each update leaves p invariant, and for positive potentials the chain converges to p, without ever
          computing Z. In the code, a four-spin chain with J = 0.5 has exact correlations 0.4621 between neighbours and{" "}
          <M>{"\\tanh(0.5)^3 = 0.0987"}</M> between its ends, and 20000 sweeps reproduce them to one decimal. In the viz,
          strong coupling makes the sampler crawl: flipping a whole domain one spin at a time is very unlikely.
        </p>
        <Code>{GIBBS}</Code>
      </Remark>
      <Remark title="relation to Bayesian networks">
        <p>
          The Hammersley–Clifford theorem says that a strictly positive distribution satisfies all the separation
          independences of G exactly when it factorises over the cliques of G. A Bayesian network becomes an MRF by
          marrying the parents of every node and dropping directions (moralisation): each conditional table becomes a
          potential on a node and its parents. Moralisation can lose independences, such as the marginal independence of
          the two causes in a collider, so neither kind of graph can express everything the other can.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pair",
      rung: "check",
      prompt: <p>Two Ising spins share one edge with J = 1 and h = 0. What is the probability that they are equal? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.8808, tolerance: 0.0001 },
    },
    {
      key: "edges",
      rung: "check",
      prompt: <p>A pairwise MRF on a 3-by-3 grid (no wrap-around) has one potential per edge. How many edge potentials are there?</p>,
      answer: { kind: "numeric", value: 12, tolerance: 0 },
    },
    {
      key: "blanket",
      rung: "apply",
      prompt: <p>In a Markov random field, which set of variables makes xᵢ conditionally independent of all the others?</p>,
      answer: {
        kind: "choice",
        options: [
          "The neighbours of i in the graph",
          "The neighbours of i and the neighbours of its neighbours",
          "The variables sharing the largest clique with i",
          "There is none, because Z couples every variable",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def ising_joint(n, edges, J, h):
    states = np.array(list(itertools.product([-1, 1], repeat=n)))
    energy = -J * sum(states[:, i] * states[:, j] for i, j in edges) - h * states.sum(axis=1)
    w = np.exp(-energy)
    return states, w / w.sum()

def cond_prob(i, x, edges, J, h):
    field = h + J * sum(x[b] if a == i else x[a] for a, b in edges if i in (a, b))
    return float(1 / (1 + np.exp(-2 * field)))

E = [(0, 1), (1, 2), (2, 3)]
S, p = ising_joint(4, E, 0.5, 0.0)
print(round(float(p @ (S[:, 0] * S[:, 1])), 4), round(float(p @ (S[:, 0] * S[:, 3])), 4))
print(round(cond_prob(1, [1, 0, 1, -1], E, 0.5, 0.0), 4), round(cond_prob(3, [1, 1, 1, 0], E, 0.5, 0.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.4621 0.0987\n0.8808 0.7311", "0.4621 0.0\n0.8808 0.7311", "0.4621 0.0987\n0.7311 0.8808", "0.5 0.125\n0.8808 0.7311"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gibbs(n, edges, J, h, sweeps, seed=0):
    rng = np.random.default_rng(seed)
    nbrs = [[b if a == i else a for a, b in edges if i in (a, b)] for i in range(n)]
    x = rng.choice([-1, 1], size=n)
    out = np.zeros((sweeps, n), dtype=int)
    for s in range(sweeps):
        for i in range(n):
            field = h + J * x[nbrs[i]].sum()
            x[i] = 1 if rng.random() < 1 / (1 + np.exp(-2 * field)) else -1
        out[s] = x
    return out

def separated(edges, A, B, Z):
    seen, stack = set(Z) | set(A), list(A)
    while stack:
        v = stack.pop()
        for a, b in edges:
            w = b if a == v else a if b == v else None
            if w is not None and w not in seen:
                if w in B:
                    return False
                seen.add(w)
                stack.append(w)
    return True

E = [(0, 1), (1, 2), (2, 3)]
X = gibbs(4, E, 0.5, 0.0, 20000)
print(round(float((X[:, 0] * X[:, 1]).mean()), 1), round(float((X[:, 0] * X[:, 3]).mean()), 1))
print(separated(E, [0], [3], [2]), separated(E, [0], [3], []), separated(E + [(0, 3)], [0], [2], [1]))`}</Code>
          <p>What does this print, approximately?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.5 0.1\nTrue False False", "0.5 0.1\nTrue False True", "0.5 0.5\nTrue False False", "0.0 0.0\nTrue True False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ising_joint(n, edges, J, h)</C>, returning the array of all spin configurations (rows of ±1, in{" "}
          <C>itertools.product</C> order) and their probabilities, and <C>cond_prob(i, x, edges, J, h)</C>, returning{" "}
          <M>{"P(x_i = 1 \\mid x_{-i})"}</M> (the entry <C>x[i]</C> is ignored).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def ising_joint(n, edges, J, h):
    states = np.array(list(itertools.product([-1, 1], repeat=n)))
    return states, np.ones(len(states)) / len(states)

def cond_prob(i, x, edges, J, h):
    return 0.5
`,
        solution: ISING,
        tests: [
          { name: "joint", code: `S, p = ising_joint(2, [(0, 1)], 1.0, 0.5)
w = np.exp(np.array([1 - 1.0, -1 + 0.0, -1 + 0.0, 1 + 1.0]))
assert S.shape == (4, 2) and np.allclose(p, w / w.sum())` },
          { name: "cond", code: `E = [(0, 1), (1, 2), (0, 2), (2, 3)]
S, p = ising_joint(4, E, 0.7, -0.2); x = [1, -1, 0, 1]
m = (S[:, 0] == 1) & (S[:, 1] == -1) & (S[:, 3] == 1)
assert abs(cond_prob(2, x, E, 0.7, -0.2) - p[m & (S[:, 2] == 1)].sum() / p[m].sum()) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gibbs(n, edges, J, h, sweeps, seed=0)</C>, returning the state after each sweep as a row, and{" "}
          <C>separated(edges, A, B, Z)</C>, returning whether every path from a node in A to a node in B passes through Z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gibbs(n, edges, J, h, sweeps, seed=0):
    return np.ones((sweeps, n), dtype=int)

def separated(edges, A, B, Z):
    return True
`,
        solution: GIBBS,
        tests: [
          { name: "gibbs", code: `X = gibbs(3, [(0, 1), (1, 2)], 0.4, 0.3, 30000)
S = np.array([[a, b, c] for a in (-1, 1) for b in (-1, 1) for c in (-1, 1)])
w = np.exp(0.4 * (S[:, 0] * S[:, 1] + S[:, 1] * S[:, 2]) + 0.3 * S.sum(axis=1)); w /= w.sum()
assert X.shape == (30000, 3) and abs(X[:, 0].mean() - w @ S[:, 0]) < 0.03 and abs((X[:, 0] * X[:, 2]).mean() - w @ (S[:, 0] * S[:, 2])) < 0.03` },
          { name: "sep", code: `E = [(0, 1), (1, 2), (2, 3), (3, 0), (2, 4)]
assert separated(E, [0], [2], [1, 3]) and not separated(E, [0], [2], [1]) and separated(E, [4], [0, 1], [2]) and not separated(E, [4], [0], [])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let p(x) = (1/Z) Π_C ψ_C(x_C) over the cliques of an undirected graph, and suppose the variables split into
          disjoint sets A, B and S with no edge between A and B. Prove that x_A and x_B are conditionally independent given
          x_S.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Argues that no clique meets both A and B, because a clique is fully connected and there is no edge between A and B.",
          "Groups the potentials to write p(x) = f(x_A, x_S) g(x_B, x_S).",
          "Concludes p(x_A, x_B | x_S) = p(x_A | x_S) p(x_B | x_S), for example by normalising f and g separately for each fixed x_S.",
        ],
      },
    },
    {
      key: "chain3",
      rung: "stretch",
      prompt: <p>A chain of three Ising spins with J = 0.5 and h = 0. What is E[x₁x₃]? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.2135, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a Markov random field defines a distribution with potentials, why graph separation gives conditional independence, why a variable's conditional depends only on its neighbours, how Gibbs sampling uses that, and how MRFs relate to Bayesian networks.",

  glimpse: (
    <>
      <p>
        Both kinds of graph leave the same practical question: how to compute a marginal or a conditional without summing
        over every configuration. On trees, passing messages along edges does it exactly, and the same idea, run on graphs
        with loops, is the starting point for approximate inference.
      </p>
    </>
  ),
};
