import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DualPricesViz } from "@/components/viz/DualPricesViz";
import type { LessonContent } from "@/lib/types";

const DUAL = `import numpy as np

def dual_value(phi, psi, a, b):
    return float(np.dot(phi, a) + np.dot(psi, b))

def dual_feasible(phi, psi, C, tol=1e-9):
    return bool(np.all(np.add.outer(phi, psi) <= C + tol))    # phi_i + psi_j <= C_ij for all i, j

def duality_gap(P, C, phi, psi, a, b):
    return float(np.sum(C * P)) - dual_value(phi, psi, a, b)`;

const CERT = `import numpy as np

def slack(C, phi, psi):
    return C - np.add.outer(phi, psi)

def complementary(P, C, phi, psi, tol=1e-9):
    return bool(np.all(np.abs(P * slack(C, phi, psi)) <= tol))   # mass only on tight routes

def potentials(P, C, tol=1e-12):
    n, m = C.shape
    phi, psi = [None] * n, [None] * m
    phi[0] = 0.0
    for _ in range(n + m):                         # propagate along the support tree
        for i, j in zip(*np.nonzero(P > tol)):
            if phi[i] is not None and psi[j] is None: psi[j] = C[i, j] - phi[i]
            if psi[j] is not None and phi[i] is None: phi[i] = C[i, j] - psi[j]
    return np.array(phi, dtype=float), np.array(psi, dtype=float)`;

export const lesson: LessonContent = {
  id: "m20.2.1",
  minutes: 55,
  links: {
    requires: ["m20.1.2", "m10.4.2"],
    revisits: ["m10.4.3", "m10.4.4"],
    foreshadows: ["m20.2.2"],
  },

  puzzle: (
    <>
      <p>
        You have found a transport plan and suspect it is optimal. With a hundred points on each side there are more plans than
        atoms in the universe, so you cannot compare against them all. Is there a short certificate, a list of numbers that anyone
        can check in a few minutes, proving that no plan is cheaper? And what would a company that offers to do the transport for
        you charge, if it must undercut doing it yourself on every single route?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Imagine a shipping firm that charges φ(x) to pick up a unit of mass at x and ψ(y) to deliver it at y. To compete, its total
        price on each route must not exceed your own cost, <M>{"\\varphi(x) + \\psi(y) \\le c(x, y)"}</M>. Whatever plan you use, the
        firm&apos;s revenue for doing the same job is at most what the plan costs you, so any such prices give a lower bound on the
        cheapest plan. Kantorovich&apos;s duality theorem says the best prices close the gap entirely, and on every route that the
        optimal plan uses the price matches the cost exactly.
      </p>
      <DualPricesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the dual problem">
        <p>
          The dual of Kantorovich&apos;s problem is
        </p>
        <MD>{"\\sup \\Big\\{ \\int \\varphi\\, d\\mu + \\int \\psi\\, d\\nu : \\varphi(x) + \\psi(y) \\le c(x, y) \\text{ for all } x, y \\Big\\} ,"}</MD>
        <p>
          over integrable functions φ and ψ, called Kantorovich potentials when they are optimal. For discrete measures it is the
          linear program <M>{"\\max\\, \\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle"}</M> subject to{" "}
          <M>{"\\varphi_i + \\psi_j \\le C_{ij}"}</M>. <C>dual_value</C>, <C>dual_feasible</C> and <C>duality_gap</C> evaluate a pair
          of potentials against a plan.
        </p>
        <Code>{DUAL}</Code>
      </Definition>

      <Theorem title="weak duality">
        <p>
          For every coupling π and every feasible pair (φ, ψ),{" "}
          <M>{"\\int \\varphi\\, d\\mu + \\int \\psi\\, d\\nu \\le \\int c\\, d\\pi"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Because π has marginals μ and ν,{" "}
          <M>{"\\int \\varphi\\, d\\mu + \\int \\psi\\, d\\nu = \\int (\\varphi(x) + \\psi(y))\\, d\\pi(x, y)"}</M>, and the integrand is
          at most c(x, y) everywhere.
        </p>
      </Proof>

      <Theorem title="strong duality for discrete measures">
        <p>
          For finitely supported μ and ν, the minimum transport cost equals the maximum of the dual, and both are attained.
        </p>
      </Theorem>
      <Proof>
        <p>
          The primal is the linear program <M>{"\\min \\langle C, P \\rangle"}</M> subject to <M>{"P\\mathbf 1 = a"}</M>,{" "}
          <M>{"P^\\top \\mathbf 1 = b"}</M>, P ≥ 0. Attach multipliers φ to the row constraints and ψ to the column constraints. The
          Lagrangian{" "}
          <M>{"\\langle C, P \\rangle + \\langle \\varphi, a - P\\mathbf 1 \\rangle + \\langle \\psi, b - P^\\top\\mathbf 1 \\rangle = \\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle + \\sum_{ij} P_{ij}(C_{ij} - \\varphi_i - \\psi_j)"}</M>{" "}
          has infimum over P ≥ 0 equal to <M>{"\\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle"}</M> if every{" "}
          <M>{"C_{ij} - \\varphi_i - \\psi_j \\ge 0"}</M> and −∞ otherwise, which is the dual. The primal is feasible and bounded below
          by zero when C ≥ 0, so linear programming duality (m10.4.2) gives equal optimal values, both attained.
        </p>
      </Proof>

      <Theorem title="complementary slackness">
        <p>
          A coupling π and a feasible pair (φ, ψ) are both optimal if and only if{" "}
          <M>{"\\varphi(x) + \\psi(y) = c(x, y)"}</M> for π-almost every (x, y): mass moves only along tight routes.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gap is <M>{"\\int c\\, d\\pi - \\int \\varphi\\, d\\mu - \\int \\psi\\, d\\nu = \\int (c - \\varphi - \\psi)\\, d\\pi"}</M>,
          the integral of a non-negative function. It is zero exactly when the function vanishes π-almost everywhere, and a zero gap
          certifies both by weak duality. Conversely, if both are optimal the gap is zero by strong duality. These are the KKT
          conditions of m10.4.3. <C>slack</C> computes <M>{"C_{ij} - \\varphi_i - \\psi_j"}</M> and <C>complementary</C> checks that
          the plan puts no mass on a slack route.
        </p>
      </Proof>

      <Example title="certifying a vertex plan">
        <p>
          A vertex plan has a support forest (m20.1.2). Setting <M>{"\\varphi_1 = 0"}</M> and solving{" "}
          <M>{"\\varphi_i + \\psi_j = C_{ij}"}</M> along the edges of a spanning tree determines all the potentials
          (<C>potentials</C>). If the resulting slack matrix is non-negative, the pair is feasible, complementary slackness holds by
          construction, and the plan is optimal. If some slack is negative, that route is cheaper than the prices claim, and moving
          mass onto it improves the plan: this is one pivot of the transportation simplex method.
        </p>
        <Code>{CERT}</Code>
      </Example>

      <Remark title="general measures and the meaning of prices">
        <p>
          For general probability measures on Polish spaces and a lower semicontinuous cost bounded below, the duality theorem still
          holds, with the supremum possibly approached rather than attained when the cost is unbounded. Potentials are never unique:
          (φ + t, ψ − t) is optimal whenever (φ, ψ) is. As in m10.4.4 they are sensitivities: φ(x) is the marginal change in the optimal
          cost per unit of extra mass at x, balanced by an equal reduction elsewhere.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "value",
      rung: "check",
      prompt: (
        <p>
          Source weights are a = (0.4, 0.6) and target weights b = (0.5, 0.5). What is the dual value of the potentials φ = (1, 0)
          and ψ = (0, 2)?
        </p>
      ),
      answer: { kind: "numeric", value: 1.4, tolerance: 0.0005 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          μ is uniform on {"{0, 1}"}, ν is uniform on {"{2, 3}"}, and <M>{"c(x, y) = (x - y)^2"}</M>. The pair{" "}
          <M>{"\\varphi(x) = -4x"}</M>, <M>{"\\psi(y) = 4y - 4"}</M> is feasible because <M>{"t^2 \\ge 4t - 4"}</M>. What lower
          bound on the transport cost does it give?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.0005 },
    },
    {
      key: "tight",
      rung: "apply",
      prompt: <p>At optimal potentials, what can be said about a route (x, y) that the optimal plan uses?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its constraint is tight: φ(x) + ψ(y) = c(x, y)",
          "φ(x) + ψ(y) is strictly less than c(x, y)",
          "φ(x) = ψ(y)",
          "Its cost c(x, y) is the smallest in its row",
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

def dual_value(phi, psi, a, b):
    return float(np.dot(phi, a) + np.dot(psi, b))

def dual_feasible(phi, psi, C, tol=1e-9):
    return bool(np.all(np.add.outer(phi, psi) <= C + tol))    # phi_i + psi_j <= C_ij for all i, j

def duality_gap(P, C, phi, psi, a, b):
    return float(np.sum(C * P)) - dual_value(phi, psi, a, b)

a = b = np.array([0.5, 0.5]); C = np.array([[1.0, 3.0], [2.0, 1.0]]); phi, psi = np.zeros(2), np.ones(2)
print(dual_value(phi, psi, a, b), dual_feasible(phi, psi, C), dual_feasible(phi, np.array([2.0, 1.0]), C), duality_gap(np.diag(a), C, phi, psi, a, b))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 True False 0.0", "1.0 True True 0.0", "2.0 True False -1.0", "1.0 False False 0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def slack(C, phi, psi):
    return C - np.add.outer(phi, psi)

def complementary(P, C, phi, psi, tol=1e-9):
    return bool(np.all(np.abs(P * slack(C, phi, psi)) <= tol))   # mass only on tight routes

def potentials(P, C, tol=1e-12):
    n, m = C.shape
    phi, psi = [None] * n, [None] * m
    phi[0] = 0.0
    for _ in range(n + m):                         # propagate along the support tree
        for i, j in zip(*np.nonzero(P > tol)):
            if phi[i] is not None and psi[j] is None: psi[j] = C[i, j] - phi[i]
            if psi[j] is not None and phi[i] is None: phi[i] = C[i, j] - psi[j]
    return np.array(phi, dtype=float), np.array(psi, dtype=float)

P, D = np.array([[0.25, 0.25], [0.0, 0.5]]), np.array([[0.0, 4.0], [1.0, 1.0]]); f, g = potentials(P, D)
print(f.tolist(), g.tolist(), slack(D, f, g).tolist(), complementary(P, D, f, g))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, -3.0] [0.0, 4.0] [[0.0, 0.0], [4.0, 0.0]] True",
          "[0.0, 1.0] [0.0, 4.0] [[0.0, 0.0], [0.0, -4.0]] False",
          "[0.0, -3.0] [0.0, 4.0] [[0.0, 0.0], [-4.0, 0.0]] True",
          "[0.0, -3.0] [1.0, 4.0] [[0.0, 0.0], [4.0, 0.0]] True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dual_value(phi, psi, a, b)</C>, <C>dual_feasible(phi, psi, C, tol)</C> and{" "}
          <C>duality_gap(P, C, phi, psi, a, b)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dual_value(phi, psi, a, b):
    return float(np.sum(phi) + np.sum(psi))

def dual_feasible(phi, psi, C, tol=1e-9):
    return bool(np.all(phi + psi <= np.diag(C) + tol))

def duality_gap(P, C, phi, psi, a, b):
    return dual_value(phi, psi, a, b) - float(np.sum(C * P))
`,
        solution: DUAL,
        tests: [
          { name: "value", code: `assert abs(dual_value(np.array([1.0, 2.0]), np.array([3.0]), np.array([0.5, 0.5]), np.array([1.0])) - 4.5) < 1e-12\nC = np.array([[0.0, 1.0], [1.0, 0.0]])\nassert dual_feasible(np.array([0.0, 0.0]), np.array([0.0, 0.0]), C) and not dual_feasible(np.array([0.0, 0.5]), np.array([0.6, 0.0]), C)` },
          { name: "gap", code: `C = np.array([[0.0, 2.0], [2.0, 0.0]]); a = b = np.array([0.5, 0.5])\nassert abs(duality_gap(np.array([[0.0, 0.5], [0.5, 0.0]]), C, np.zeros(2), np.zeros(2), a, b) - 2.0) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>slack(C, phi, psi)</C>, <C>complementary(P, C, phi, psi, tol)</C> and <C>potentials(P, C, tol)</C>, which sets{" "}
          <M>{"\\varphi_0 = 0"}</M> and solves <M>{"\\varphi_i + \\psi_j = C_{ij}"}</M> along the support of P, returning two float
          arrays.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def slack(C, phi, psi):
    return C - np.subtract.outer(phi, psi)

def complementary(P, C, phi, psi, tol=1e-9):
    return True

def potentials(P, C, tol=1e-12):
    return np.zeros(C.shape[0]), np.zeros(C.shape[1])
`,
        solution: CERT,
        tests: [
          { name: "slack", code: `S = slack(np.array([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]]), np.array([1.0, 2.0]), np.array([0.0, 1.0, 2.0]))\nassert S.shape == (2, 3)\nassert np.allclose(S, [[0.0, 0.0, 0.0], [2.0, 2.0, 2.0]])\nassert not complementary(np.array([[0.5, 0.0], [0.0, 0.5]]), np.array([[1.0, 0.0], [0.0, 1.0]]), np.zeros(2), np.zeros(2))` },
          { name: "pot", code: `f, g = potentials(np.array([[0.5, 0.0], [0.25, 0.25]]), np.array([[2.0, 5.0], [3.0, 1.0]]))\nassert np.allclose(f, [0.0, 1.0]) and np.allclose(g, [2.0, 0.0])` },
        ],
      },
    },
    {
      key: "max",
      rung: "stretch",
      prompt: (
        <p>
          With a = b = (0.5, 0.5) and cost matrix <M>{"C = \\begin{pmatrix} 1 & 3 \\\\ 2 & 5 \\end{pmatrix}"}</M>, what is the largest
          value of <M>{"\\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle"}</M> subject to{" "}
          <M>{"\\varphi_i + \\psi_j \\le C_{ij}"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 2.5, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Given ψ, the best φ is forced: it is the largest function below every <M>{"c(\\cdot, y) - \\psi(y)"}</M>. The next lesson
        studies this operation, the c-transform, which reduces the dual to a single function and links optimal transport to convex
        analysis.
      </p>
    </>
  ),
};
