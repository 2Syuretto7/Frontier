import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EntropicPlanViz } from "@/components/viz/EntropicPlanViz";
import type { LessonContent } from "@/lib/types";

const OBJ = `import numpy as np

def gibbs_kernel(C, eps):
    return np.exp(-C / eps)

def entropy(P):
    p = P[P > 0]
    return float(-np.sum(p * np.log(p)))              # 0 log 0 = 0

def reg_objective(P, C, eps):
    return float(np.sum(C * P)) - eps * entropy(P)`;

const SOFT = `import numpy as np

def soft_min(z, eps):
    m = np.min(z)
    return float(m - eps * np.log(np.sum(np.exp(-(z - m) / eps))))   # -eps log sum exp(-z / eps), stably

def soft_c_transform(phi, C, a, eps):
    return np.array([soft_min(C[:, j] - phi - eps * np.log(a), eps) for j in range(C.shape[1])])

def scaling_form(u, K, v):
    return u[:, None] * K * v[None, :]                # diag(u) K diag(v)`;

export const lesson: LessonContent = {
  id: "m20.4.1",
  minutes: 55,
  links: {
    requires: ["m20.2.2", "m12.2.1"],
    revisits: ["m12.2.3", "m10.2.4"],
    foreshadows: ["m20.4.2"],
  },

  puzzle: (
    <>
      <p>
        Solving the transport linear program between two histograms of 10,000 bins each by the simplex or interior point method
        takes time roughly cubic in the number of bins, and the answer jumps discontinuously as the inputs change, so it cannot be
        differentiated through. Adding a pinch of entropy to the objective fixes both problems at once. What does the regularised
        plan look like, what has been given up, and why does the optimum take such a simple algebraic form?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An optimal plan of the linear program sits at a vertex: sparse, sharp, and liable to jump to another vertex under small
        perturbations. Rewarding entropy pulls the plan away from the vertices into the interior, spreading each unit of mass a
        little around its optimal destination, the more so the larger the weight ε on entropy. The objective becomes strictly
        convex, so the optimum is unique and moves smoothly with the data. And the optimality conditions say the plan is a
        Gibbs kernel <M>{"e^{-C/\\varepsilon}"}</M> rescaled by one factor per row and one per column.
      </p>
      <EntropicPlanViz />
    </>
  ),

  theory: (
    <>
      <Definition title="entropic optimal transport">
        <p>
          For histograms a, b, a cost matrix C and ε &gt; 0, with entropy <M>{"H(P) = -\\sum_{ij} P_{ij}\\log P_{ij}"}</M>,
        </p>
        <MD>{"\\mathrm{OT}_\\varepsilon(a, b) = \\min_{P \\in \\Pi(a, b)} \\langle C, P \\rangle + \\varepsilon\\, \\mathrm{KL}(P \\,\\|\\, a \\otimes b) ."}</MD>
        <p>
          On Π(a, b), <M>{"\\mathrm{KL}(P \\,\\|\\, a \\otimes b) = H(a) + H(b) - H(P)"}</M>, the mutual information of the coupling,
          so this has the same minimiser as <M>{"\\langle C, P \\rangle - \\varepsilon H(P)"}</M> (<C>entropy</C>,{" "}
          <C>reg_objective</C>). The Gibbs kernel is <M>{"K = e^{-C/\\varepsilon}"}</M>, entrywise (<C>gibbs_kernel</C>).
        </p>
        <Code>{OBJ}</Code>
      </Definition>

      <Theorem title="the scaling form">
        <p>
          The problem has a unique minimiser, all of its entries are positive, and it has the form{" "}
          <M>{"P = \\operatorname{diag}(u)\\, K \\operatorname{diag}(v)"}</M> for positive vectors u and v.
        </p>
      </Theorem>
      <Proof>
        <p>
          The function <M>{"p \\log p"}</M> is strictly convex, so the objective is strictly convex on the compact convex set
          Π(a, b) and has exactly one minimiser. Its derivative <M>{"\\log p + 1"}</M> tends to −∞ as p → 0, so moving a little mass
          onto a zero entry from a positive one lowers the objective; hence every entry is positive and only the equality
          constraints are active. With multipliers φ and ψ for the row and column constraints, stationarity of{" "}
          <M>{"\\langle C, P \\rangle - \\varepsilon H(P) - \\langle \\varphi, P\\mathbf 1 - a \\rangle - \\langle \\psi, P^\\top \\mathbf 1 - b \\rangle"}</M>{" "}
          gives <M>{"C_{ij} + \\varepsilon(\\log P_{ij} + 1) = \\varphi_i + \\psi_j"}</M>, so{" "}
          <M>{"P_{ij} = e^{(\\varphi_i - \\varepsilon/2)/\\varepsilon}\\, e^{-C_{ij}/\\varepsilon}\\, e^{(\\psi_j - \\varepsilon/2)/\\varepsilon}"}</M>.
          <C>scaling_form</C> assembles such a matrix.
        </p>
      </Proof>

      <Theorem title="the smooth dual and the soft c-transform">
        <p>
          The dual of the KL form is the unconstrained concave problem
        </p>
        <MD>{"\\max_{\\varphi, \\psi}\; \\langle \\varphi, a \\rangle + \\langle \\psi, b \\rangle - \\varepsilon \\sum_{ij} a_i b_j \\big(e^{(\\varphi_i + \\psi_j - C_{ij})/\\varepsilon} - 1\\big) ."}</MD>
        <p>
          For fixed φ the best ψ is the soft c-transform{" "}
          <M>{"\\psi_j = -\\varepsilon \\log \\sum_i a_i e^{(\\varphi_i - C_{ij})/\\varepsilon}"}</M>, which tends to the c-transform{" "}
          <M>{"\\min_i (C_{ij} - \\varphi_i)"}</M> of m20.2.2 as ε → 0.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replacing the hard constraint <M>{"\\varphi_i + \\psi_j \\le C_{ij}"}</M> of m20.2.1 by the penalty above is what Fenchel
          duality (m10.2.4) produces from the KL term: the conjugate of <M>{"\\varepsilon\\, \\mathrm{KL}(\\cdot \\,\\|\\, a\\otimes b)"}</M>{" "}
          is <M>{"\\varepsilon \\sum a_i b_j (e^{z_{ij}/\\varepsilon} - 1)"}</M>. Setting the derivative in <M>{"\\psi_j"}</M> to zero
          gives <M>{"b_j = b_j \\sum_i a_i e^{(\\varphi_i + \\psi_j - C_{ij})/\\varepsilon}"}</M>, which rearranges to the soft
          transform. A log-sum-exp is within <M>{"\\varepsilon \\log n"}</M> of the minimum it smooths, which gives the limit.{" "}
          <C>soft_min</C> and <C>soft_c_transform</C> compute it stably by subtracting the minimum first.
        </p>
        <Code>{SOFT}</Code>
      </Proof>

      <Theorem title="how much is lost">
        <p>
          With <M>{"\\mathrm{OT}_0"}</M> the unregularised value,{" "}
          <M>{"\\mathrm{OT}_0 \\le \\mathrm{OT}_\\varepsilon \\le \\mathrm{OT}_0 + \\varepsilon \\min(H(a), H(b))"}</M>. As ε → ∞ the
          minimiser tends to the independent coupling <M>{"a \\otimes b"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The KL term is non-negative, which gives the lower bound. For the upper bound, evaluate the objective at an optimal
          unregularised plan <M>{"P^*"}</M>: its KL term is a mutual information, at most <M>{"\\min(H(a), H(b))"}</M> (m12.2.3). For
          large ε the KL term dominates, and its unique minimiser on Π(a, b) is <M>{"a \\otimes b"}</M>.
        </p>
      </Proof>

      <Example title="two points">
        <p>
          Take a = b = (1/2, 1/2) and <M>{"C = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}"}</M>. By symmetry{" "}
          <M>{"P = \\begin{pmatrix} p & 1/2 - p \\\\ 1/2 - p & p \\end{pmatrix}"}</M>, and the scaling form forces{" "}
          <M>{"P_{11}P_{22}/(P_{12}P_{21}) = K_{11}K_{22}/(K_{12}K_{21}) = e^{2/\\varepsilon}"}</M>, so{" "}
          <M>{"p/(1/2 - p) = e^{1/\\varepsilon}"}</M>. The plan moves from the identity (p = 1/2) towards independence (p = 1/4) as ε
          grows.
        </p>
      </Example>

      <Remark title="why practitioners accept the blur">
        <p>
          The regularised value is smooth in the inputs, so it can be a training loss; it can be computed by matrix scaling on a GPU,
          as the next lesson shows; and estimated from samples it converges at a rate that, unlike the unregularised Wasserstein
          distance, does not degrade with dimension. The price is a bias: <M>{"\\mathrm{OT}_\\varepsilon(a, a) > 0"}</M>. The Sinkhorn
          divergence <M>{"\\mathrm{OT}_\\varepsilon(a, b) - \\tfrac12\\mathrm{OT}_\\varepsilon(a, a) - \\tfrac12\\mathrm{OT}_\\varepsilon(b, b)"}</M>{" "}
          removes it and is used in m20.5.3.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "two",
      rung: "check",
      prompt: (
        <p>
          With a = b = (1/2, 1/2), <M>{"C = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}"}</M> and ε = 1, what is the entry{" "}
          <M>{"P_{11}"}</M> of the entropic plan? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.366, tolerance: 0.0006 },
    },
    {
      key: "ent",
      rung: "check",
      prompt: (
        <p>
          What is the entropy (natural logarithm) of the independent coupling of a = (1/2, 1/2) and b = (1/4, 3/4)? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.256, tolerance: 0.0006 },
    },
    {
      key: "dense",
      rung: "apply",
      prompt: <p>Why does the entropic plan have no zero entries?</p>,
      answer: {
        kind: "choice",
        options: [
          "The derivative of p log p tends to minus infinity at zero, so moving a little mass onto any empty entry lowers the objective",
          "Because the cost matrix has no zero entries",
          "Because Sinkhorn's algorithm initialises all entries to one",
          "It does have zero entries wherever the cost is large",
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

def gibbs_kernel(C, eps):
    return np.exp(-C / eps)

def entropy(P):
    p = P[P > 0]
    return float(-np.sum(p * np.log(p)))              # 0 log 0 = 0

def reg_objective(P, C, eps):
    return float(np.sum(C * P)) - eps * entropy(P)

C = np.array([[0.0, 1.0], [1.0, 0.0]])
print(gibbs_kernel(C, 0.5).round(4).tolist(), round(entropy(np.diag([0.5, 0.5])), 4), round(reg_objective(np.full((2, 2), 0.25), C, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.1353], [0.1353, 1.0]] 0.6931 -0.8863",
          "[[1.0, 0.6065], [0.6065, 1.0]] 0.6931 -0.8863",
          "[[1.0, 0.1353], [0.1353, 1.0]] 1.3863 -0.8863",
          "[[1.0, 0.1353], [0.1353, 1.0]] 0.6931 1.8863",
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

def soft_min(z, eps):
    m = np.min(z)
    return float(m - eps * np.log(np.sum(np.exp(-(z - m) / eps))))   # -eps log sum exp(-z / eps), stably

def soft_c_transform(phi, C, a, eps):
    return np.array([soft_min(C[:, j] - phi - eps * np.log(a), eps) for j in range(C.shape[1])])

def scaling_form(u, K, v):
    return u[:, None] * K * v[None, :]                # diag(u) K diag(v)

psi = soft_c_transform(np.zeros(2), np.array([[0.0, 1.0], [1.0, 0.0]]), np.array([0.5, 0.5]), 1.0)
print(round(soft_min(np.zeros(2), 1.0), 4), round(soft_min(np.array([1.0, 3.0]), 0.01), 4), psi.round(4).tolist(), scaling_form(np.array([1.0, 2.0]), np.ones((2, 2)), np.array([3.0, 4.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-0.6931 1.0 [0.3799, 0.3799] [[3.0, 4.0], [6.0, 8.0]]",
          "0.0 1.0 [0.3799, 0.3799] [[3.0, 4.0], [6.0, 8.0]]",
          "-0.6931 3.0 [0.3799, 0.3799] [[3.0, 4.0], [6.0, 8.0]]",
          "-0.6931 1.0 [0.0, 0.0] [[3.0, 6.0], [4.0, 8.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gibbs_kernel(C, eps)</C>, <C>entropy(P)</C> with the convention 0 log 0 = 0, and <C>reg_objective(P, C, eps)</C>{" "}
          for <M>{"\\langle C, P \\rangle - \\varepsilon H(P)"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gibbs_kernel(C, eps):
    return np.exp(-C * eps)

def entropy(P):
    return float(-np.sum(P * np.log(P + 1)))

def reg_objective(P, C, eps):
    return float(np.sum(C * P)) + eps * entropy(P)
`,
        solution: OBJ,
        tests: [
          { name: "kernel", code: `assert np.allclose(gibbs_kernel(np.array([[0.0, 2.0]]), 4.0), [[1.0, np.exp(-0.5)]])\nassert abs(entropy(np.array([[0.5, 0.0], [0.25, 0.25]])) - 1.5 * np.log(2)) < 1e-12` },
          { name: "obj", code: `P = np.array([[0.5, 0.0], [0.0, 0.5]]); C = np.array([[1.0, 0.0], [0.0, 1.0]])\nassert abs(reg_objective(P, C, 2.0) - (1.0 - 2 * np.log(2))) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>soft_min(z, eps)</C>, computed stably, <C>soft_c_transform(phi, C, a, eps)</C> and{" "}
          <C>scaling_form(u, K, v)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def soft_min(z, eps):
    return float(np.min(z))

def soft_c_transform(phi, C, a, eps):
    return np.min(C - phi[:, None], axis=0)

def scaling_form(u, K, v):
    return np.outer(u, v) @ K
`,
        solution: SOFT,
        tests: [
          { name: "soft", code: `assert abs(soft_min(np.array([0.0, 0.0, 0.0, 0.0]), 0.5) + 0.5 * np.log(4)) < 1e-12 and abs(soft_min(np.array([1000.0, 1000.0]), 1.0) - (1000.0 - np.log(2))) < 1e-9\nr = soft_c_transform(np.array([0.0, 0.0]), np.array([[0.0], [0.0]]), np.array([0.5, 0.5]), 1.0)\nassert r.shape == (1,)\nassert abs(r[0]) < 1e-12` },
          { name: "scale", code: `assert np.allclose(scaling_form(np.array([1.0, 3.0]), np.array([[1.0, 2.0], [3.0, 4.0]]), np.array([2.0, 1.0])), [[2.0, 2.0], [18.0, 12.0]])` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          In the same two-point problem with ε = 0.5, what is the transport cost <M>{"\\langle C, P \\rangle"}</M> of the entropic
          plan? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.119, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The scaling form reduces the problem to finding two vectors u and v that fix the row and column sums. The next lesson finds
        them by alternately rescaling rows and columns, Sinkhorn&apos;s algorithm, and proves that it converges linearly.
      </p>
    </>
  ),
};
