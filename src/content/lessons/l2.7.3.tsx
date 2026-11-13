import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EliminationOrderViz } from "@/components/viz/EliminationOrderViz";
import type { LessonContent } from "@/lib/types";

const VE = `import numpy as np

def multiply(f, g):
    (fv, fa), (gv, ga) = f, g
    vs = tuple(dict.fromkeys(fv + gv))
    let = {v: chr(97 + i) for i, v in enumerate(vs)}
    spec = "".join(let[v] for v in fv) + "," + "".join(let[v] for v in gv)
    return vs, np.einsum(spec + "->" + "".join(let[v] for v in vs), fa, ga)

def sum_out(f, v):
    fv, fa = f
    return tuple(u for u in fv if u != v), fa.sum(axis=fv.index(v))

def eliminate(factors, order):
    for v in order:
        rel = [f for f in factors if v in f[0]]
        factors = [f for f in factors if v not in f[0]]
        prod = rel[0]
        for g in rel[1:]:
            prod = multiply(prod, g)
        factors.append(sum_out(prod, v))
    out = factors[0]
    for g in factors[1:]:
        out = multiply(out, g)
    return out`;

const BP = `import numpy as np

def tree_marginals(unary, edges, pair):
    n = len(unary)
    nbr = {i: [] for i in range(n)}
    for a, b in edges:
        nbr[a].append(b)
        nbr[b].append(a)
    memo = {}
    def msg(i, j):
        if (i, j) not in memo:
            belief = unary[i].copy()
            for k in nbr[i]:
                if k != j:
                    belief = belief * msg(k, i)
            P = pair[(i, j)] if (i, j) in pair else pair[(j, i)].T
            m = belief @ P
            memo[(i, j)] = m / m.sum()
        return memo[(i, j)]
    out = []
    for i in range(n):
        b = unary[i].copy()
        for k in nbr[i]:
            b = b * msg(k, i)
        out.append(b / b.sum())
    return out`;

export const lesson: LessonContent = {
  id: "l2.7.3",
  minutes: 55,
  links: {
    requires: ["l2.7.1", "l2.7.2"],
    revisits: ["l2.5.4", "m4.3.3"],
    foreshadows: ["l2.8.3"],
  },

  puzzle: (
    <>
      <p>
        A network has fifty binary variables and you want the probability of one of them given a few others. Summing the
        joint over the remaining variables means adding up about 10¹⁴ terms. Yet for a chain of fifty variables the
        forward-backward algorithm needed only a few hundred operations. What did the chain have that made this possible,
        and how far does the trick extend?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sum of products can often be rearranged so that each sum is pushed inside as far as it will go: a variable that
        appears in only two factors can be summed out of just those two, leaving a smaller factor behind. Doing this one
        variable at a time is variable elimination. How much it saves depends on the order: each elimination ties together
        the variable&apos;s neighbours, and a bad order builds huge tables while a good one keeps them small.
      </p>
      <EliminationOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inference queries">
        <p>
          For <M>{"p(x) \\propto \\prod_f \\phi_f(x_{S_f})"}</M>, a Bayesian network or an MRF, inference means computing a
          marginal <M>{"p(x_i)"}</M>, a conditional <M>{"p(x_i \\mid x_E = e)"}</M>, or a most probable configuration.
          Evidence is handled by multiplying in an indicator factor <M>{"\\mathbb 1[x_E = e]"}</M> and normalising at the
          end. Done naively, each query sums over exponentially many configurations.
        </p>
      </Definition>

      <Theorem title="variable elimination">
        <p>
          To sum out v, replace all factors that contain v by the single factor{" "}
          <M>{"\\tau(x_{N}) = \\sum_{x_v}\\prod_{f \\ni v}\\phi_f"}</M>, where N is the set of other variables in those
          factors. Repeating this for every variable except the query gives the unnormalised marginal. Each step costs time
          proportional to <M>{"K^{|N| + 1}"}</M> for K-valued variables, so the total cost is exponential only in the
          largest such scope along the order, not in the number of variables.
        </p>
      </Theorem>
      <Proof>
        <p>
          In <M>{"\\sum_x \\prod_f \\phi_f"}</M>, the factors not containing v do not depend on <M>{"x_v"}</M>, so by
          distributivity they come out of the sum over <M>{"x_v"}</M>:{" "}
          <M>{"\\sum_{x_v}\\prod_f\\phi_f = \\prod_{f \\not\\ni v}\\phi_f \\cdot \\tau(x_N)"}</M>. The new collection of
          factors has the same sum over the remaining variables, so induction on the number of eliminated variables gives
          correctness. Forming τ needs one product per joint value of v and N, which gives the cost.
        </p>
        <Code>{VE}</Code>
      </Proof>

      <Theorem title="sum-product on a tree">
        <p>
          Let <M>{"p(x) \\propto \\prod_i \\phi_i(x_i)\\prod_{(i, j)} \\psi_{ij}(x_i, x_j)"}</M> with edges forming a tree.
          Define messages
        </p>
        <MD>{"m_{i \\to j}(x_j) = \\sum_{x_i}\\phi_i(x_i)\\,\\psi_{ij}(x_i, x_j)\\prod_{k \\in N(i) \\setminus j} m_{k \\to i}(x_i)."}</MD>
        <p>
          Then <M>{"p(x_i) \\propto \\phi_i(x_i)\\prod_{k \\in N(i)} m_{k \\to i}(x_i)"}</M> for every i, and all
          marginals together cost two messages per edge.
        </p>
      </Theorem>
      <Proof>
        <p>
          Removing edge (i, j) from a tree splits it in two; let <M>{"T_{i \\to j}"}</M> be the part containing i. We show by
          induction on its size that <M>{"m_{i \\to j}(x_j)"}</M> equals the sum, over the variables of{" "}
          <M>{"T_{i \\to j}"}</M>, of all factors inside it times <M>{"\\psi_{ij}"}</M>. If i is a leaf this is the
          definition. Otherwise <M>{"T_{i \\to j}"}</M> is i together with the disjoint subtrees{" "}
          <M>{"T_{k \\to i}"}</M>, which share no variables, so the sum factorises into the product of their sums, which
          are the messages by induction. At node i the subtrees <M>{"T_{k \\to i}"}</M> for all neighbours k cover every
          other variable, so <M>{"\\phi_i\\prod_k m_{k \\to i}"}</M> is the full sum with <M>{"x_i"}</M> fixed, the
          unnormalised marginal. This is variable elimination with leaves first, shared across all queries.
        </p>
        <Code>{BP}</Code>
      </Proof>

      <Remark title="where exactness ends">
        <p>
          In the code, the chain A → B → C gives P(C) = (0.65, 0.35) and, with evidence C = 1,{" "}
          <M>{"P(A \\mid C = 1) = (0.4286, 0.5714)"}</M> by elimination; message passing returns the same numbers for all
          three nodes at once. The forward-backward algorithm is sum-product on a chain, and replacing sums by maxima gives
          Viterbi. On graphs with loops, elimination still works but its cost is governed by the treewidth, the smallest
          possible largest scope minus one, and finding the best order is NP-hard. A k-by-k grid has treewidth k, so exact
          inference on images is out of reach. The usual responses are to run the message updates on the loopy graph
          anyway (loopy belief propagation, often good but without guarantees), to optimise a variational bound, or to
          sample, as Gibbs sampling did.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "naive",
      rung: "check",
      prompt: <p>Twenty binary variables. How many joint configurations does a naive sum visit to compute the marginal of one variable at one of its values?</p>,
      answer: { kind: "numeric", value: 524288, tolerance: 0 },
    },
    {
      key: "hub",
      rung: "check",
      prompt: <p>A star of binary variables has a hub and 8 leaves. If the hub is eliminated first, how many entries does the product factor formed at that step have?</p>,
      answer: { kind: "numeric", value: 512, tolerance: 0 },
    },
    {
      key: "loops",
      rung: "apply",
      prompt: <p>Why does the sum-product algorithm give exact marginals on a tree but not, in general, on a graph with cycles?</p>,
      answer: {
        kind: "choice",
        options: [
          "On a tree the subtrees feeding a node share no variables, so the sum factorises into messages; with cycles the same evidence reaches a node along several paths and is counted more than once",
          "On a graph with cycles the messages cannot be normalised",
          "Trees have no colliders, and colliders break message passing",
          "Cycles make the potentials negative",
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

def multiply(f, g):
    (fv, fa), (gv, ga) = f, g
    vs = tuple(dict.fromkeys(fv + gv))
    let = {v: chr(97 + i) for i, v in enumerate(vs)}
    spec = "".join(let[v] for v in fv) + "," + "".join(let[v] for v in gv)
    return vs, np.einsum(spec + "->" + "".join(let[v] for v in vs), fa, ga)

def sum_out(f, v):
    fv, fa = f
    return tuple(u for u in fv if u != v), fa.sum(axis=fv.index(v))

def eliminate(factors, order):
    for v in order:
        rel = [f for f in factors if v in f[0]]
        factors = [f for f in factors if v not in f[0]]
        prod = rel[0]
        for g in rel[1:]:
            prod = multiply(prod, g)
        factors.append(sum_out(prod, v))
    out = factors[0]
    for g in factors[1:]:
        out = multiply(out, g)
    return out

pA = np.array([0.6, 0.4]); pBA = np.array([[0.7, 0.3], [0.2, 0.8]]); pCB = np.array([[0.9, 0.1], [0.4, 0.6]])
F = [(("A",), pA), (("A", "B"), pBA), (("B", "C"), pCB)]
v, t = eliminate(F, ["A", "B"])
print(v, t.round(4))
v, t = eliminate(F + [(("C",), np.array([0.0, 1.0]))], ["C", "B"])
print(v, t.round(4), (t / t.sum()).round(4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["('C',) [0.65 0.35]\n('A',) [0.15 0.2 ] [0.4286 0.5714]", "('C',) [0.5 0.5]\n('A',) [0.15 0.2 ] [0.4286 0.5714]", "('C',) [0.65 0.35]\n('A',) [0.45 0.2 ] [0.6923 0.3077]", "('A', 'B', 'C') [0.65 0.35]\n('A',) [0.15 0.2 ] [0.4286 0.5714]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def tree_marginals(unary, edges, pair):
    n = len(unary)
    nbr = {i: [] for i in range(n)}
    for a, b in edges:
        nbr[a].append(b)
        nbr[b].append(a)
    memo = {}
    def msg(i, j):
        if (i, j) not in memo:
            belief = unary[i].copy()
            for k in nbr[i]:
                if k != j:
                    belief = belief * msg(k, i)
            P = pair[(i, j)] if (i, j) in pair else pair[(j, i)].T
            m = belief @ P
            memo[(i, j)] = m / m.sum()
        return memo[(i, j)]
    out = []
    for i in range(n):
        b = unary[i].copy()
        for k in nbr[i]:
            b = b * msg(k, i)
        out.append(b / b.sum())
    return out

pA = np.array([0.6, 0.4]); pBA = np.array([[0.7, 0.3], [0.2, 0.8]]); pCB = np.array([[0.9, 0.1], [0.4, 0.6]])
ms = tree_marginals([pA, np.ones(2), np.ones(2)], [(0, 1), (1, 2)], {(0, 1): pBA, (1, 2): pCB})
print([m.round(2).tolist() for m in ms])
ms = tree_marginals([pA, np.ones(2), np.array([0.0, 1.0])], [(0, 1), (1, 2)], {(0, 1): pBA, (1, 2): pCB})
print(ms[0].round(4), ms[1].round(4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[[0.6, 0.4], [0.5, 0.5], [0.65, 0.35]]\n[0.4286 0.5714] [0.1429 0.8571]", "[[0.6, 0.4], [0.5, 0.5], [0.65, 0.35]]\n[0.6 0.4] [0.5 0.5]", "[[0.6, 0.4], [0.5, 0.5], [0.5, 0.5]]\n[0.4286 0.5714] [0.1429 0.8571]", "[[0.6, 0.4], [0.65, 0.35], [0.5, 0.5]]\n[0.4286 0.5714] [0.1429 0.8571]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A factor is a pair (tuple of variable names, numpy array with one axis per variable). Write{" "}
          <C>multiply(f, g)</C> and <C>sum_out(f, v)</C>, and <C>eliminate(factors, order)</C>, which sums out the variables
          in <C>order</C> one at a time and returns the product of what remains.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def multiply(f, g):
    return f

def sum_out(f, v):
    return f

def eliminate(factors, order):
    return factors[0]
`,
        solution: VE,
        tests: [
          { name: "ops", code: `f = (("x", "y"), np.array([[1.0, 2.0], [3.0, 4.0]])); g = (("y", "z"), np.array([[1.0, 0.0], [5.0, 1.0]]))
v, t = multiply(f, g)
assert v == ("x", "y", "z") and np.allclose(t[1, 1, 0], 20.0) and np.allclose(t[0, 0, 1], 0.0)
v2, t2 = sum_out((v, t), "y")
assert v2 == ("x", "z") and np.allclose(t2, [[11, 2], [23, 4]])` },
          { name: "elim", code: `rng = np.random.default_rng(0); a, b, c = rng.random(2), rng.random((2, 3)), rng.random((3, 2))
F = [(("a",), a), (("a", "b"), b), (("b", "c"), c)]
full = np.einsum("i,ij,jk->ijk", a, b, c)
v, t = eliminate(F, ["a", "c"])
assert v == ("b",) and np.allclose(t, full.sum(axis=(0, 2)))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tree_marginals(unary, edges, pair)</C> for a tree-structured pairwise model: <C>unary[i]</C> is a vector,{" "}
          <C>pair[(i, j)]</C> is a matrix indexed by (xᵢ, xⱼ) given for one orientation of each edge. Return the list of
          normalised marginals, computed by sum-product messages.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def tree_marginals(unary, edges, pair):
    return [u / u.sum() for u in unary]
`,
        solution: BP,
        tests: [
          { name: "chain", code: `u = [np.array([1.0, 2.0]), np.array([1.0, 1.0]), np.array([3.0, 1.0])]
P = np.array([[2.0, 1.0], [1.0, 2.0]])
ms = tree_marginals(u, [(0, 1), (1, 2)], {(0, 1): P, (1, 2): P})
full = np.einsum("i,j,k,ij,jk->ijk", u[0], u[1], u[2], P, P); full /= full.sum()
assert np.allclose(ms[0], full.sum(axis=(1, 2))) and np.allclose(ms[1], full.sum(axis=(0, 2))) and np.allclose(ms[2], full.sum(axis=(0, 1)))` },
          { name: "star", code: `rng = np.random.default_rng(1); u = [rng.random(3) + 0.1 for _ in range(4)]
Ps = {(0, k): rng.random((3, 3)) + 0.1 for k in (1, 2, 3)}
ms = tree_marginals(u, [(0, 1), (2, 0), (0, 3)], {(0, 1): Ps[(0, 1)], (2, 0): Ps[(0, 2)].T, (0, 3): Ps[(0, 3)]})
full = np.einsum("i,j,k,l,ij,ik,il->ijkl", *u, Ps[(0, 1)], Ps[(0, 2)], Ps[(0, 3)]); full /= full.sum()
assert np.allclose(ms[2], full.sum(axis=(0, 1, 3))) and np.allclose(ms[0], full.sum(axis=(1, 2, 3)))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          For a chain x₁ − x₂ − x₃ with p(x) ∝ φ₁(x₁)φ₂(x₂)φ₃(x₃)ψ₁₂(x₁, x₂)ψ₂₃(x₂, x₃), prove that p(x₂) ∝ φ₂(x₂) m₁(x₂)
          m₃(x₂), where m₁(x₂) = Σ_(x₁) φ₁(x₁)ψ₁₂(x₁, x₂) and m₃(x₂) = Σ_(x₃) φ₃(x₃)ψ₂₃(x₂, x₃).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the unnormalised marginal of x₂ as the double sum over x₁ and x₃ of the full product.",
          "Takes φ₂(x₂) out and uses distributivity to split the double sum into the product of a sum over x₁ and a sum over x₃, because no factor contains both.",
          "Identifies the two sums as m₁ and m₃ and notes that the proportionality constant is the normaliser Z, independent of x₂.",
        ],
      },
    },
    {
      key: "post",
      rung: "stretch",
      prompt: <p>In the chain of the code (P(A) = (0.6, 0.4), and the tables P(B | A) and P(C | B)), what is P(A = 1 | C = 0)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3077, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend why naive inference is exponential, how variable elimination uses distributivity, why the elimination order matters, how sum-product messages give all marginals of a tree at once, and what goes wrong on graphs with loops.",

  glimpse: (
    <>
      <p>
        Every model so far ends in a predicted probability. The last chapter asks how to judge such predictions: which loss
        functions reward honest probabilities, how to check that a model&apos;s 70% means 70%, and how to say how unsure a
        prediction is.
      </p>
    </>
  ),
};
