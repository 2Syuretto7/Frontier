import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CouplingMatrixViz } from "@/components/viz/CouplingMatrixViz";
import type { LessonContent } from "@/lib/types";

const PLAN = `import numpy as np

def independent_coupling(a, b):
    return np.outer(a, b)                             # P_ij = a_i b_j

def is_coupling(P, a, b, tol=1e-9):
    return bool(np.all(P >= -tol) and np.allclose(P.sum(1), a, atol=tol) and np.allclose(P.sum(0), b, atol=tol))

def transport_cost(C, P):
    return float(np.sum(C * P))`;

const VERTEX = `import numpy as np

def north_west(a, b):
    a, b = list(a), list(b)
    P = np.zeros((len(a), len(b)))
    i = j = 0
    while i < len(a) and j < len(b):
        m = min(a[i], b[j])
        P[i, j] = m
        a[i] -= m; b[j] -= m
        if a[i] <= 1e-12: i += 1                       # row used up: move down
        else: j += 1                                   # column used up: move right
    return P

def support_size(P, tol=1e-12):
    return int(np.sum(P > tol))

def cost_matrix(x, y, p):
    return np.abs(np.subtract.outer(x, y)) ** p`;

export const lesson: LessonContent = {
  id: "m20.1.2",
  minutes: 55,
  links: {
    requires: ["m20.1.1", "m10.3.1"],
    revisits: ["m18.2.4", "m10.1.1"],
    foreshadows: ["m20.2.1"],
  },

  puzzle: (
    <>
      <p>
        Monge&apos;s problem has no solution when a point mass must be split between two destinations, and even when maps exist,
        the set of them is not convex, so averaging two good plans can give an inadmissible one. In 1942 Leonid Kantorovich,
        planning the allocation of resources in the Soviet economy, made one change: let each unit of mass be split. How does this
        single relaxation make the problem linear, guarantee a solution, and still return Monge&apos;s answer whenever a map is best?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Instead of saying where each grain goes, say how much mass moves from each source location to each target location. This
        is a table, or in general a joint distribution, whose row totals are the source and whose column totals are the target.
        The cost is linear in the table, and the constraints are linear equalities and non-negativity, so the problem is a linear
        program. A linear program attains its minimum at a corner of the feasible set, and the corners of this set are sparse
        tables, which for equal numbers of equally weighted points are exactly the matchings of Monge&apos;s problem.
      </p>
      <CouplingMatrixViz />
    </>
  ),

  theory: (
    <>
      <Definition title="couplings and Kantorovich's problem">
        <p>
          A coupling of probability measures μ on X and ν on Y is a probability measure π on X × Y with marginals μ and ν:{" "}
          <M>{"\\pi(A \\times Y) = \\mu(A)"}</M> and <M>{"\\pi(X \\times B) = \\nu(B)"}</M>. Write Π(μ, ν) for the set of couplings.
          Kantorovich&apos;s problem is
        </p>
        <MD>{"\\min_{\\pi \\in \\Pi(\\mu, \\nu)} \\int c(x, y)\\, d\\pi(x, y) ."}</MD>
        <p>
          The product <M>{"\\mu \\otimes \\nu"}</M> (m18.2.4) is always a coupling, so Π(μ, ν) is never empty. For discrete measures
          with weights a in <M>{"\\mathbb{R}^n"}</M> and b in <M>{"\\mathbb{R}^m"}</M>, a coupling is a matrix P ≥ 0 with{" "}
          <M>{"P\\mathbf{1} = a"}</M> and <M>{"P^\\top \\mathbf{1} = b"}</M>, and the problem is the linear program{" "}
          <M>{"\\min_P \\langle C, P \\rangle"}</M> with <M>{"C_{ij} = c(x_i, y_j)"}</M>. <C>independent_coupling</C>,{" "}
          <C>is_coupling</C> and <C>transport_cost</C> work with these matrices.
        </p>
        <Code>{PLAN}</Code>
      </Definition>

      <Theorem title="Kantorovich relaxes Monge">
        <p>
          If T is a transport map from μ to ν, then <M>{"\\pi_T = (\\mathrm{id}, T)_\\# \\mu"}</M> is a coupling with the same cost.
          Hence the Kantorovich value is at most the Monge value.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first marginal of <M>{"\\pi_T"}</M> is the law of X, which is μ, and the second is the law of T(X), which is{" "}
          <M>{"T_\\#\\mu = \\nu"}</M>. Its cost is <M>{"\\mathbb{E}\\, c(X, T(X)) = \\int c(x, T(x))\\, d\\mu"}</M>. Every Monge
          candidate is thus a Kantorovich candidate, and the minimum over the larger set is no larger.
        </p>
      </Proof>

      <Theorem title="vertices of the transport polytope">
        <p>
          The set Π(a, b) is a compact convex polytope, so the linear program attains its minimum at a vertex. A coupling P is a
          vertex exactly when the bipartite graph with an edge (i, j) for each <M>{"P_{ij} > 0"}</M> has no cycle; in particular a
          vertex has at most n + m − 1 nonzero entries.
        </p>
      </Theorem>
      <Proof>
        <p>
          Π(a, b) is defined by finitely many linear equalities and inequalities and lies in <M>{"[0, 1]^{n \\times m}"}</M>, so it
          is a bounded polyhedron, and a linear function on it is minimised at a vertex (m10.3.1). Suppose the support graph of P
          contains a cycle <M>{"i_1 j_1 i_2 j_2 \\dots i_k j_k i_1"}</M>. Let E add +1 on the edges <M>{"(i_r, j_r)"}</M> and −1 on
          the edges <M>{"(i_{r+1}, j_r)"}</M>. Every row and column of E sums to zero, so <M>{"P \\pm \\varepsilon E"}</M> are
          couplings for small ε &gt; 0, and P is their midpoint, not a vertex. Conversely, if the support is a forest, the entries
          are forced: a leaf&apos;s single entry equals its row or column total, and removing it leaves a smaller forest, so no
          other coupling has the same support and P cannot be a proper average. A forest on n + m nodes has at most n + m − 1 edges.
        </p>
      </Proof>

      <Theorem title="Birkhoff and von Neumann">
        <p>
          When n = m and <M>{"a = b = \\mathbf{1}/n"}</M>, the vertices of Π(a, b) are the matrices <M>{"\\frac1n P_\\sigma"}</M> for
          permutation matrices <M>{"P_\\sigma"}</M>. So for uniform measures on n points each, Kantorovich&apos;s problem has an
          optimal solution that is a matching, and the two problems have the same value.
        </p>
      </Theorem>
      <Proof>
        <p>
          At a vertex, the support forest has a leaf, say row i with a single nonzero entry in column j. That entry is 1/n, the
          whole row total, which is also the whole column total, so column j has no other entry. Removing row i and column j leaves a
          vertex of the smaller problem of the same kind; by induction every row and column has exactly one entry 1/n.
        </p>
      </Proof>

      <Example title="the north-west corner rule">
        <p>
          Fill the table from the top-left: put as much mass as possible in the current cell, then move down if the row is used up,
          otherwise right (<C>north_west</C>). The support is a staircase path, which has no cycle, so the result is a vertex, with at
          most n + m − 1 entries (<C>support_size</C>). For sorted points on a line it is the monotone coupling, and the uncrossing
          argument of m20.1.1 shows it is optimal for every cost <M>{"h(y - x)"}</M> with h convex, such as the costs of{" "}
          <C>cost_matrix</C> with p ≥ 1. For a point mass at 0 and the measure with half its mass at ±1, the only coupling sends half
          each way, at squared cost 1.
        </p>
        <Code>{VERTEX}</Code>
      </Example>

      <Remark title="beyond finite supports">
        <p>
          For general measures on complete separable metric spaces, Π(μ, ν) is compact in the topology of weak convergence, by
          Prokhorov&apos;s theorem, and a lower semicontinuous cost bounded below makes the objective lower semicontinuous, so a
          minimiser always exists. Whether it is induced by a map is a separate question, answered for the squared distance by
          Brenier&apos;s theorem in m20.3.1. The linearity bought by the relaxation is what makes duality possible, the subject of
          the next chapter.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "split",
      rung: "check",
      prompt: (
        <p>
          μ is a point mass at 0 and ν puts mass 0.3 at −1 and 0.7 at 2. What is the optimal Kantorovich cost for{" "}
          <M>{"c(x, y) = (x - y)^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3.1, tolerance: 0.0005 },
    },
    {
      key: "support",
      rung: "check",
      prompt: (
        <p>
          A vertex of the set of couplings between a measure on 5 points and a measure on 8 points has at most how many nonzero
          entries?
        </p>
      ),
      answer: { kind: "numeric", value: 12, tolerance: 0.5 },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: <p>What makes Kantorovich&apos;s problem easier than Monge&apos;s?</p>,
      answer: {
        kind: "choice",
        options: [
          "The objective is linear and the couplings form a convex set defined by linear constraints, so the problem is a linear program that always has a minimiser",
          "Couplings are always induced by maps, so there are fewer of them",
          "The cost function no longer matters",
          "It only allows uniform measures",
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

def independent_coupling(a, b):
    return np.outer(a, b)                             # P_ij = a_i b_j

def is_coupling(P, a, b, tol=1e-9):
    return bool(np.all(P >= -tol) and np.allclose(P.sum(1), a, atol=tol) and np.allclose(P.sum(0), b, atol=tol))

def transport_cost(C, P):
    return float(np.sum(C * P))

a, b = np.array([0.5, 0.5]), np.array([0.25, 0.75]); P = independent_coupling(a, b)
print(P.tolist(), is_coupling(P, a, b), transport_cost(np.array([[0.0, 1.0], [1.0, 0.0]]), P))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.125, 0.375], [0.125, 0.375]] True 0.5",
          "[[0.125, 0.125], [0.375, 0.375]] True 0.5",
          "[[0.125, 0.375], [0.125, 0.375]] False 0.5",
          "[[0.125, 0.375], [0.125, 0.375]] True 0.25",
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

def north_west(a, b):
    a, b = list(a), list(b)
    P = np.zeros((len(a), len(b)))
    i = j = 0
    while i < len(a) and j < len(b):
        m = min(a[i], b[j])
        P[i, j] = m
        a[i] -= m; b[j] -= m
        if a[i] <= 1e-12: i += 1                       # row used up: move down
        else: j += 1                                   # column used up: move right
    return P

def support_size(P, tol=1e-12):
    return int(np.sum(P > tol))

def cost_matrix(x, y, p):
    return np.abs(np.subtract.outer(x, y)) ** p

Q = north_west([0.5, 0.5], [0.25, 0.75])
print(Q.tolist(), support_size(Q), cost_matrix(np.array([0.0, 1.0]), np.array([0.0, 2.0]), 2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, 0.25], [0.0, 0.5]] 3 [[0.0, 4.0], [1.0, 1.0]]",
          "[[0.25, 0.25], [0.0, 0.5]] 4 [[0.0, 4.0], [1.0, 1.0]]",
          "[[0.25, 0.0], [0.0, 0.75]] 2 [[0.0, 4.0], [1.0, 1.0]]",
          "[[0.25, 0.25], [0.0, 0.5]] 3 [[0.0, 2.0], [1.0, 1.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>independent_coupling(a, b)</C>, <C>is_coupling(P, a, b, tol)</C>, which checks non-negativity and both marginals,
          and <C>transport_cost(C, P)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def independent_coupling(a, b):
    return np.diag(a)

def is_coupling(P, a, b, tol=1e-9):
    return bool(np.allclose(P.sum(1), a, atol=tol))

def transport_cost(C, P):
    return float(np.sum(C @ P))
`,
        solution: PLAN,
        tests: [
          { name: "product", code: `P = independent_coupling(np.array([0.2, 0.8]), np.array([0.5, 0.5]))\nassert P.shape == (2, 2)\nassert np.allclose(P, [[0.1, 0.1], [0.4, 0.4]]) and abs(transport_cost(np.array([[1.0, 2.0], [3.0, 5.0]]), P) - 3.5) < 1e-12` },
          { name: "check", code: `a, b = np.array([0.5, 0.5]), np.array([0.5, 0.5])\nassert is_coupling(np.array([[0.5, 0.0], [0.0, 0.5]]), a, b)\nassert not is_coupling(np.array([[0.5, 0.5], [0.0, 0.0]]), a, b) and not is_coupling(np.array([[0.6, -0.1], [-0.1, 0.6]]), a, b)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>north_west(a, b)</C>, <C>support_size(P, tol)</C> and <C>cost_matrix(x, y, p)</C> with entries{" "}
          <M>{"|x_i - y_j|^p"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def north_west(a, b):
    return np.outer(a, b)

def support_size(P, tol=1e-12):
    return P.size

def cost_matrix(x, y, p):
    return np.subtract.outer(x, y) ** p
`,
        solution: VERTEX,
        tests: [
          { name: "nw", code: `P = north_west([0.2, 0.8], [0.5, 0.3, 0.2])\nassert P.shape == (2, 3)\nassert np.allclose(P, [[0.2, 0.0, 0.0], [0.3, 0.3, 0.2]]) and support_size(P) == 4` },
          { name: "cost", code: `C = cost_matrix(np.array([0.0, 3.0]), np.array([1.0, 2.0, 4.0]), 1)\nassert C.shape == (2, 3)\nassert np.allclose(C, [[1.0, 2.0, 4.0], [2.0, 1.0, 1.0]])` },
        ],
      },
    },
    {
      key: "mono",
      rung: "stretch",
      prompt: (
        <p>
          μ puts mass 1/2 at 0 and 1/2 at 2; ν puts mass 0.2 at 0, 0.3 at 1 and 0.5 at 2. What is the optimal Kantorovich cost for{" "}
          <M>{"c(x, y) = (x - y)^2"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.3, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every linear program has a dual. For Kantorovich&apos;s problem the dual asks for two price functions, one on the source and
        one on the target, and its value equals the transport cost. The next chapter proves this duality and uses it to certify
        optimal plans.
      </p>
    </>
  ),
};
