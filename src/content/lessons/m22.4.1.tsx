import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PcDiscoveryViz } from "@/components/viz/PcDiscoveryViz";
import type { LessonContent } from "@/lib/types";

const PC = `from itertools import combinations

def pc_skeleton(nodes, indep):
    adj = {v: set(nodes) - {v} for v in nodes}
    sepset, k = {}, 0
    while any(len(adj[a]) - 1 >= k for a in nodes):
        for a in nodes:
            for b in sorted(adj[a]):
                for S in combinations(sorted(adj[a] - {b}), k):
                    if indep(a, b, set(S)):
                        adj[a].discard(b); adj[b].discard(a)
                        sepset[frozenset((a, b))] = set(S); break
        k += 1                                                 # condition on ever larger sets of neighbours
    return adj, sepset

def orient_v(adj, sepset):
    arrows = set()
    for c in adj:
        for a, b in combinations(sorted(adj[c]), 2):
            if b not in adj[a] and c not in sepset[frozenset((a, b))]:
                arrows |= {(a, c), (b, c)}                     # a -> c <- b
    return arrows

def meek1(adj, arrows):
    changed = True
    while changed:
        changed = False
        for a, b in list(arrows):
            for c in adj[b]:
                if c != a and c not in adj[a] and (b, c) not in arrows and (c, b) not in arrows:
                    arrows.add((b, c)); changed = True         # a -> b - c, a and c apart: b -> c
    return arrows`;

const TESTS = `import numpy as np
from math import atanh, erf, sqrt

def partial_corr(X, i, j, S):
    P = np.linalg.inv(np.cov(X[:, [i, j] + list(S)].T))        # precision of the sub-vector
    return float(-P[0, 1] / np.sqrt(P[0, 0] * P[1, 1]))

def fisher_z(r, n, k):
    return sqrt(n - k - 3) * atanh(r)                          # approximately standard normal if independent

def ci_test(X, i, j, S, alpha=0.05):
    z = fisher_z(partial_corr(X, i, j, S), len(X), len(S))
    p = 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))
    return p > alpha                                           # True means "independent"`;

export const lesson: LessonContent = {
  id: "m22.4.1",
  minutes: 55,
  links: {
    requires: ["m22.1.1", "l2.7.1"],
    revisits: ["m9.6.3", "m7.5.2"],
    foreshadows: ["m22.4.2"],
  },

  puzzle: (
    <>
      <p>
        A biologist measures the expression of five genes in a thousand cells and wants to know which genes regulate which.
        There is no budget for knockout experiments. Chapter 1 showed that the data can at best reveal a Markov equivalence
        class. Can that class actually be found from samples, without searching all 29,281 directed acyclic graphs on five
        labelled vertices, and how do errors in individual statistical tests affect the answer?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Start from the complete undirected graph and delete an edge whenever two variables are found independent given some
        set of their neighbours. Under faithfulness, the edges that survive are exactly the true adjacencies. Then orient each
        collider a → c ← b whose middle vertex was not used to separate a and b, and propagate the orientations that avoid
        creating new colliders. Every step is a statistical test, so with small samples weak edges vanish and one wrong
        decision can reverse arrows elsewhere.
      </p>
      <PcDiscoveryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="assumptions">
        <p>
          Independence-based discovery assumes the data are independent draws from a distribution that is Markov and faithful
          to an unknown DAG G (m22.1.1), with no hidden common causes of measured variables (causal sufficiency). Under these
          assumptions the conditional independencies of the distribution are exactly the d-separations of G, and the target is
          the Markov equivalence class of G.
        </p>
      </Definition>

      <Theorem title="separation by neighbours">
        <p>
          Two vertices a and b are adjacent in G if and only if no set separates them. If they are not adjacent, they are
          separated by the parents of a or by the parents of b, each of which is a subset of the neighbours of that vertex.
        </p>
      </Theorem>
      <Proof>
        <p>
          An edge is a path with no interior vertex, so nothing blocks it. If a and b are not adjacent, let b be later in a
          causal order. Then a is a non-descendant of b, and the local Markov property makes b independent of a given the
          parents of b; under faithfulness this is a d-separation. The parents of b are adjacent to b in G, so they are among
          the neighbours of b in any graph that still contains G&apos;s skeleton.
        </p>
      </Proof>

      <Definition title="the PC algorithm (Spirtes and Glymour)">
        <p>
          Begin with the complete graph. For k = 0, 1, 2, …, for each adjacent pair (a, b) and each set S of k current neighbours
          of a other than b, test a ⊥ b | S; on independence remove the edge and record S as the separating set{" "}
          (<C>pc_skeleton</C>). For every unshielded triple a − c − b with c not in the separating set of a and b, orient a → c ←
          b (<C>orient_v</C>). Then repeatedly orient b − c as b → c whenever a → b and a, c are not adjacent (<C>meek1</C>), and
          apply Meek&apos;s three further rules, which forbid cycles and are omitted here.
        </p>
        <Code>{PC}</Code>
      </Definition>

      <Theorem title="correctness with an independence oracle">
        <p>
          If the tests are answered exactly, PC returns the skeleton of G, orients exactly its v-structures by the second
          step, and every orientation added by the propagation rules is correct.
        </p>
      </Theorem>
      <Proof>
        <p>
          The skeleton step only removes an edge after finding a separating set, which non-adjacent pairs have and adjacent
          pairs do not. Since removals only shrink neighbour sets while keeping the true adjacencies, the parents of a or of b
          remain available as a candidate S, so every non-adjacent pair is eventually separated. For an unshielded triple, the
          argument of m22.1.1 shows that a collider c lies in no separating set of a and b, while a non-collider c lies in every
          one, so the test on the recorded set decides the triple. For the propagation rule, if a → b − c with a and c not
          adjacent and the edge were c → b, then a → b ← c would be a v-structure, which the second step would have found; so
          it is b → c. Meek showed in 1995 that his four rules together orient every edge that is common to the whole
          equivalence class.
        </p>
      </Proof>

      <Theorem title="testing with partial correlations">
        <p>
          For jointly Gaussian variables, <M>{"X_i \\perp X_j \\mid X_S"}</M> if and only if the partial correlation{" "}
          <M>{"\\rho_{ij \\cdot S} = -P_{ij}/\\sqrt{P_{ii}P_{jj}}"}</M> is zero, where P is the inverse covariance of{" "}
          <M>{"(X_i, X_j, X_S)"}</M> (<C>partial_corr</C>). Under independence, Fisher&apos;s statistic{" "}
          <M>{"\\sqrt{n - |S| - 3}\\, \\operatorname{atanh}(\\hat\\rho)"}</M> is approximately standard normal (<C>fisher_z</C>),
          which gives the test <C>ci_test</C>.
        </p>
        <Code>{TESTS}</Code>
      </Theorem>
      <Proof>
        <p>
          The conditional distribution of <M>{"(X_i, X_j)"}</M> given <M>{"X_S"}</M> is Gaussian with covariance equal to the
          inverse of the top-left two-by-two block of P (the Schur complement identity). Its off-diagonal entry is zero exactly
          when <M>{"P_{ij} = 0"}</M>, and for Gaussians zero conditional covariance means conditional independence. The
          normalisation by <M>{"\\sqrt{P_{ii}P_{jj}}"}</M> turns the block into a correlation. The variance-stabilising property of
          atanh is the same as in m9.6.3, with |S| degrees of freedom lost to the regression on <M>{"X_S"}</M>.
        </p>
      </Proof>

      <Remark title="where it breaks">
        <p>
          With finite samples, a test that wrongly finds independence removes a true edge and corrupts later separating sets, and
          the output can depend on the order in which pairs are visited; PC-stable fixes the order dependence. Near-violations of
          faithfulness, dependencies too weak to detect, mean that no method is uniformly consistent (Robins and colleagues,
          2003): for any sample size some model is misjudged. Hidden confounders break causal sufficiency; the FCI algorithm
          handles them and returns a coarser object with edges that may represent confounding. The next lesson takes the other
          route: score whole graphs, and use the shape of the noise to orient what independence cannot.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "removed",
      rung: "check",
      prompt: (
        <p>
          PC with an exact oracle runs on data from the DAG <M>{"A \\to C \\leftarrow B"}</M>, <M>{"C \\to D \\to E"}</M>. How many
          edges of the initial complete graph does it remove?
        </p>
      ),
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "z",
      rung: "check",
      prompt: (
        <p>
          A sample of n = 103 has correlation 0.2 between two variables, with no conditioning set. What is Fisher&apos;s statistic?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.027, tolerance: 0.0006 },
    },
    {
      key: "faith",
      rung: "apply",
      prompt: <p>X affects Y directly with coefficient 1 and through a mediator M with total indirect effect −1, so X and Y are uncorrelated. What does PC with exact tests do with the X–Y edge?</p>,
      answer: {
        kind: "choice",
        options: [
          "It removes the edge at the first step, because faithfulness fails and the marginal test finds independence",
          "It keeps the edge, since X is a cause of Y",
          "It orients the edge as Y → X",
          "It reports a hidden confounder",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import combinations

def pc_skeleton(nodes, indep):
    adj = {v: set(nodes) - {v} for v in nodes}
    sepset, k = {}, 0
    while any(len(adj[a]) - 1 >= k for a in nodes):
        for a in nodes:
            for b in sorted(adj[a]):
                for S in combinations(sorted(adj[a] - {b}), k):
                    if indep(a, b, set(S)):
                        adj[a].discard(b); adj[b].discard(a)
                        sepset[frozenset((a, b))] = set(S); break
        k += 1                                                 # condition on ever larger sets of neighbours
    return adj, sepset

def orient_v(adj, sepset):
    arrows = set()
    for c in adj:
        for a, b in combinations(sorted(adj[c]), 2):
            if b not in adj[a] and c not in sepset[frozenset((a, b))]:
                arrows |= {(a, c), (b, c)}                     # a -> c <- b
    return arrows

def meek1(adj, arrows):
    changed = True
    while changed:
        changed = False
        for a, b in list(arrows):
            for c in adj[b]:
                if c != a and c not in adj[a] and (b, c) not in arrows and (c, b) not in arrows:
                    arrows.add((b, c)); changed = True         # a -> b - c, a and c apart: b -> c
    return arrows

dsep = {("A", "B", ()), ("A", "D", ("C",)), ("B", "D", ("C",))}; adj, sep = pc_skeleton(list("ABCD"), lambda a, b, S: (min(a, b), max(a, b), tuple(sorted(S))) in dsep)
print(sorted(adj["C"]), sep[frozenset("AB")], sorted(orient_v(adj, sep)), sorted(meek1(adj, orient_v(adj, sep)) - orient_v(adj, sep)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['A', 'B', 'D'] set() [('A', 'C'), ('B', 'C')] [('C', 'D')]",
          "['A', 'B', 'D'] {'C'} [('A', 'C'), ('B', 'C')] [('C', 'D')]",
          "['A', 'B', 'D'] set() [('A', 'C'), ('B', 'C')] []",
          "['A', 'B'] set() [('A', 'C'), ('B', 'C')] [('C', 'D')]",
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
from math import atanh, erf, sqrt

def partial_corr(X, i, j, S):
    P = np.linalg.inv(np.cov(X[:, [i, j] + list(S)].T))        # precision of the sub-vector
    return float(-P[0, 1] / np.sqrt(P[0, 0] * P[1, 1]))

def fisher_z(r, n, k):
    return sqrt(n - k - 3) * atanh(r)                          # approximately standard normal if independent

def ci_test(X, i, j, S, alpha=0.05):
    z = fisher_z(partial_corr(X, i, j, S), len(X), len(S))
    p = 2 * (1 - 0.5 * (1 + erf(abs(z) / sqrt(2))))
    return p > alpha                                           # True means "independent"

r = np.random.default_rng(0); z = r.normal(size=5000); X = np.column_stack([z + r.normal(size=5000), z + r.normal(size=5000), z])
print(round(partial_corr(X, 0, 1, []), 1), round(partial_corr(X, 0, 1, [2]), 1), round(fisher_z(0.5, 28, 0), 3), ci_test(X, 0, 1, [2]), ci_test(X, 0, 1, []))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.0 2.747 True False",
          "0.5 0.5 2.747 False False",
          "0.5 0.0 2.747 False True",
          "0.3 0.0 2.747 True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pc_skeleton(nodes, indep)</C> returning neighbour sets and separating sets keyed by frozenset pairs,{" "}
          <C>orient_v(adj, sepset)</C> returning a set of (tail, head) arrows, and <C>meek1(adj, arrows)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import combinations

def pc_skeleton(nodes, indep):
    return {v: set(nodes) - {v} for v in nodes}, {}

def orient_v(adj, sepset):
    return set()

def meek1(adj, arrows):
    return arrows
`,
        solution: PC,
        tests: [
          { name: "skeleton", code: `adj, sep = pc_skeleton(["X", "Y", "Z"], lambda a, b, S: {a, b} == {"X", "Z"} and S == {"Y"})\nassert adj == {"X": {"Y"}, "Y": {"X", "Z"}, "Z": {"Y"}} and sep[frozenset("XZ")] == {"Y"}` },
          { name: "orient", code: `adj = {"A": {"C"}, "B": {"C"}, "C": {"A", "B", "D"}, "D": {"C", "E"}, "E": {"D"}}\nsep = {frozenset("AB"): set(), frozenset("AD"): {"C"}, frozenset("BD"): {"C"}, frozenset("CE"): {"D"}, frozenset("AE"): {"C"}, frozenset("BE"): {"C"}}\na = orient_v(adj, sep); assert a == {("A", "C"), ("B", "C")}\nassert meek1(adj, set(a)) == {("A", "C"), ("B", "C"), ("C", "D"), ("D", "E")}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With data X (one row per sample), write <C>partial_corr(X, i, j, S)</C>, <C>fisher_z(r, n, k)</C> and{" "}
          <C>ci_test(X, i, j, S, alpha)</C> returning True when the two-sided p-value exceeds alpha.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from math import atanh, erf, sqrt

def partial_corr(X, i, j, S):
    return float(np.corrcoef(X[:, i], X[:, j])[0, 1])

def fisher_z(r, n, k):
    return sqrt(n) * atanh(r)

def ci_test(X, i, j, S, alpha=0.05):
    return abs(partial_corr(X, i, j, S)) < 0.1
`,
        solution: TESTS,
        tests: [
          { name: "pcorr", code: `r = np.random.default_rng(5); a = r.normal(size=3000); b = a + r.normal(size=3000); c = b + r.normal(size=3000)\nX = np.column_stack([a, b, c])\nassert abs(partial_corr(X, 0, 2, [1])) < 0.05 and abs(partial_corr(X, 0, 2, []) - 1 / np.sqrt(3)) < 0.05` },
          { name: "test", code: `assert abs(fisher_z(0.3, 53, 2) - np.sqrt(48) * np.arctanh(0.3)) < 1e-12\nr = np.random.default_rng(5); a = r.normal(size=3000); b = a + r.normal(size=3000); c = b + r.normal(size=3000)\nX = np.column_stack([a, b, c]); assert ci_test(X, 0, 2, [1]) and not ci_test(X, 0, 2, [])` },
        ],
      },
    },
    {
      key: "pcorr",
      rung: "stretch",
      prompt: (
        <p>
          Three standardised variables have correlations 0.5 between X and Y, 0.4 between X and Z, and 0.6 between Y and Z. What
          is the partial correlation of X and Y given Z? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.355, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        PC decides edge by edge and inherits every testing error. Score-based methods instead assign each whole graph a
        number, such as a penalised likelihood, and search for the best one; with non-Gaussian noise or nonlinear mechanisms,
        they can even orient edges that independence leaves undirected.
      </p>
    </>
  ),
};
