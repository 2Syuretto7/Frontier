import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ContractionOrderViz } from "@/components/viz/ContractionOrderViz";
import type { LessonContent } from "@/lib/types";

const LOOPS = `import numpy as np
import itertools

def einsum_loops(spec, *ops):
    lhs, out = spec.split('->')
    ins = lhs.split(',')
    size = {}
    for s, X in zip(ins, ops):
        for c, n in zip(s, X.shape):
            size[c] = n
    letters = sorted(size)
    res = np.zeros(tuple(size[c] for c in out))
    for vals in itertools.product(*(range(size[c]) for c in letters)):
        env = dict(zip(letters, vals))
        term = 1.0
        for s, X in zip(ins, ops):
            term *= X[tuple(env[c] for c in s)]
        res[tuple(env[c] for c in out)] += term
    return res`;

const GRAD = `def grad_spec(spec, k):
    lhs, out = spec.split('->')
    ins = lhs.split(',')
    others = [s for i, s in enumerate(ins) if i != k]
    return ','.join([out] + others) + '->' + ins[k]

def chain_cost(dims):
    n = len(dims) - 1
    best = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            best[i][j] = min(best[i][m] + best[m + 1][j] + dims[i] * dims[m + 1] * dims[j + 1]
                             for m in range(i, j))
    return best[0][n - 1]`;

export const lesson: LessonContent = {
  id: "m6.7.3",
  minutes: 55,
  links: {
    requires: ["m6.7.2"],
    revisits: ["e1.5.5", "m3.3.2"],
    foreshadows: ["m6.7.4"],
  },

  puzzle: (
    <>
      <p>
        <C>np.einsum(&quot;ij,jk,kl-&gt;il&quot;, A, B, C)</C> with A and B of size 1000×1000 and C of size 1000×1 gives
        the same answer however it is evaluated. Done as one loop over i, j, k, l it visits 10⁹ combinations of the indices; as A(BC) it
        costs two million. What is an einsum, mathematically, and how do you find the cheap way to compute it, and its
        gradient?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An einsum string names every index once. Indices that survive into the output are free; the rest are summed. In the
        language of the last lesson, an einsum forms the tensor product of its operands and then contracts (sums along the
        diagonal of) every pair of matching indices. Contractions can be done in any order, and the order decides the cost,
        exactly as with a chain of matrix products.
      </p>
      <ContractionOrderViz />
    </>
  ),

  theory: (
    <>
      <Definition title="einsum">
        <p>
          A spec <C>s1,s2,…,sm-&gt;o</C> assigns a letter to every axis of every operand; equal letters must have equal sizes.
          The output has the axes listed in o, and with F the letters of o and S the remaining letters,
        </p>
        <MD>{"\\mathrm{out}[F] = \\sum_{S}\\ \\prod_{t=1}^{m} X_t[s_t]."}</MD>
        <p>
          Each term multiplies one entry of every operand, the entries chosen by the current values of the letters. A letter
          repeated inside one operand, as in <C>ii-&gt;</C>, takes a diagonal.
        </p>
        <Code>{LOOPS}</Code>
      </Definition>

      <Theorem title="einsums are multilinear contractions">
        <p>
          Every einsum is linear in each operand separately. It equals the tensor product{" "}
          <M>{"X_1 \\otimes \\cdots \\otimes X_m"}</M> followed by a contraction for each summed letter (setting the axes that
          carry it equal and summing) and a diagonal for each letter repeated among the free axes.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fixing all operands but <M>{"X_t"}</M>, each term of the sum is a fixed number times one entry of{" "}
          <M>{"X_t"}</M>, so the output is linear in <M>{"X_t"}</M>. The tensor product has entries{" "}
          <M>{"\\prod_t X_t[a_t]"}</M> with independent indices <M>{"a_t"}</M>. Restricting to index tuples in which axes with
          the same letter agree, and summing over the letters of S, gives exactly the formula in the definition.
        </p>
      </Proof>

      <Remark title="the phrasebook again, as contractions">
        <p>
          <C>ij,jk-&gt;ik</C> is the matrix product: contract the second axis of A with the first of B. <C>ii-&gt;</C> is the
          trace, the contraction of V ⊗ V&apos; that pairs a vector with a covector. <C>i,j-&gt;ij</C> contracts nothing and is
          the outer product. Attention scores <C>bhqd,bhkd-&gt;bhqk</C> contract d, and keep b and h as batch letters that sit
          in every operand and in the output.
        </p>
      </Remark>

      <Theorem title="cost of a pairwise contraction">
        <p>
          Contracting two operands with letter sets <M>{"I"}</M> and <M>{"J"}</M> into an intermediate whose letters are those
          still needed later takes <M>{"\\prod_{c \\in I \\cup J}n_c"}</M> multiplications. A single loop over all letters
          of the whole expression takes <M>{"(m-1)\\prod_c n_c"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every entry of the intermediate is a sum of products, one for each value of the letters being summed, so the number
          of products is the number of assignments to the letters of <M>{"I \\cup J"}</M>. The single loop visits every
          assignment of every letter and does m − 1 multiplications at each.
        </p>
      </Proof>
      <p>
        For <C>ij,jk,kl-&gt;il</C> the order (AB)C costs <M>{"n_in_jn_k + n_in_kn_l"}</M> and A(BC) costs{" "}
        <M>{"n_jn_kn_l + n_in_jn_l"}</M>. With a vector at the end (<M>{"n_l = 1"}</M>) the second is a factor{" "}
        <M>{"n_i"}</M> or so cheaper. This is also why reverse-mode differentiation multiplies Jacobians from the output
        end: the loss gradient is the vector.
      </p>

      <Example title="choosing the order">
        <p>
          For a chain of matrices <M>{"A_1 \\cdots A_n"}</M> with <M>{"A_t"}</M> of size{" "}
          <M>{"d_{t-1} \\times d_t"}</M>, the cheapest parenthesisation is found by dynamic programming: the best cost for{" "}
          <M>{"A_i \\cdots A_j"}</M> is the minimum over split points m of best(i, m) + best(m+1, j) +{" "}
          <M>{"d_{i-1}d_md_j"}</M>, in <M>{"O(n^3)"}</M> time. For general einsums the problem of finding the best order is
          NP-hard, and libraries use greedy or bounded searches: <C>np.einsum(..., optimize=True)</C> and{" "}
          <C>np.einsum_path</C> show which pairwise order was chosen.
        </p>
      </Example>

      <Theorem title="gradients of an einsum">
        <p>
          Let <M>{"Y = \\mathrm{einsum}(s_1,\\dots,s_m \\to o;\\ X_1,\\dots,X_m)"}</M>, and suppose the letters of{" "}
          <M>{"s_k"}</M> are distinct and each appears in o or in another operand. If <M>{"G = \\partial L/\\partial Y"}</M>, then
        </p>
        <MD>{"\\frac{\\partial L}{\\partial X_k} = \\mathrm{einsum}(o, s_1, \\dots, \\widehat{s_k}, \\dots, s_m \\to s_k;\\ G, X_1, \\dots, \\widehat{X_k}, \\dots, X_m),"}</MD>
        <p>the hat meaning &ldquo;left out&rdquo;: swap the roles of the output and the k-th operand.</p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule <M>{"\\partial L/\\partial X_k[a] = \\sum_F G[F]\\,\\partial Y[F]/\\partial X_k[a]"}</M>. Since Y is
          linear in <M>{"X_k"}</M> and the letters of <M>{"s_k"}</M> are distinct, the derivative of one term with respect to{" "}
          <M>{"X_k[a]"}</M> is the product of the other operands when the letters of <M>{"s_k"}</M> take the values a, and 0
          otherwise. So the gradient entry is the sum, over all letters not in <M>{"s_k"}</M>, of G times the other operands,
          which is the stated einsum. The condition on the letters guarantees every letter of <M>{"s_k"}</M> appears in some
          input of the new einsum, so the expression is well formed.
        </p>
      </Proof>
      <p>
        For <C>ij,jk-&gt;ik</C> this gives <C>ik,jk-&gt;ij</C>, that is <M>{"G B^\\top"}</M>, and <C>ik,ij-&gt;jk</C>, that is{" "}
        <M>{"A^\\top G"}</M>: the dense-layer rules, now one line each for any einsum.
      </p>
      <Code>{GRAD}</Code>
    </>
  ),

  practice: [
    {
      key: "terms",
      rung: "check",
      prompt: <p>How many multiplications does the single loop for <C>ij,jk-&gt;ik</C> perform when i, j and k have sizes 2, 3 and 4?</p>,
      answer: { kind: "numeric", value: 24 },
    },
    {
      key: "summed",
      rung: "check",
      prompt: <p>How many letters are summed in <C>bhqd,bhkd-&gt;bhqk</C>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "trace",
      rung: "apply",
      prompt: <p>Which spec computes trace(AB) for square A and B without forming AB?</p>,
      answer: { kind: "choice", options: ["ij,ji->", "ij,ij->", "ij,jk->", "ii,jj->"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
import itertools

def einsum_loops(spec, *ops):
    lhs, out = spec.split('->')
    ins = lhs.split(',')
    size = {}
    for s, X in zip(ins, ops):
        for c, n in zip(s, X.shape):
            size[c] = n
    letters = sorted(size)
    res = np.zeros(tuple(size[c] for c in out))
    for vals in itertools.product(*(range(size[c]) for c in letters)):
        env = dict(zip(letters, vals))
        term = 1.0
        for s, X in zip(ins, ops):
            term *= X[tuple(env[c] for c in s)]
        res[tuple(env[c] for c in out)] += term
    return res

A = np.arange(6.0).reshape(2, 3)
print(einsum_loops('ij,jk->ik', A, np.ones((3, 2))).tolist())
print(einsum_loops('ii->', np.arange(9.0).reshape(3, 3)), einsum_loops('i,j->ij', np.array([1.0, 2.0]), np.array([3.0, 4.0])).sum())
print(einsum_loops('ij->j', A))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[3.0, 3.0], [12.0, 12.0]]\n12.0 21.0\n[3. 5. 7.]",
          "[[3.0, 3.0], [12.0, 12.0]]\n36.0 21.0\n[3. 5. 7.]",
          "[[3.0, 3.0], [12.0, 12.0]]\n12.0 21.0\n[ 3. 12.]",
          "[[3.0, 12.0], [3.0, 12.0]]\n12.0 21.0\n[3. 5. 7.]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def grad_spec(spec, k):
    lhs, out = spec.split('->')
    ins = lhs.split(',')
    others = [s for i, s in enumerate(ins) if i != k]
    return ','.join([out] + others) + '->' + ins[k]

def chain_cost(dims):
    n = len(dims) - 1
    best = [[0] * n for _ in range(n)]
    for length in range(2, n + 1):
        for i in range(n - length + 1):
            j = i + length - 1
            best[i][j] = min(best[i][m] + best[m + 1][j] + dims[i] * dims[m + 1] * dims[j + 1]
                             for m in range(i, j))
    return best[0][n - 1]

print(grad_spec('ij,jk->ik', 0), grad_spec('ij,jk->ik', 1))
print(grad_spec('bqd,bkd->bqk', 1))
print(chain_cost([10, 100, 5, 50]), chain_cost([2, 3]), chain_cost([5, 5, 5, 5, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "ik,jk->ij ik,ij->jk\nbqk,bqd->bkd\n7500 0 75",
          "ik,jk->ij ij,ik->jk\nbqk,bqd->bkd\n7500 0 75",
          "ik,jk->ij ik,ij->jk\nbqk,bqd->bkd\n75000 0 75",
          "ik,jk->ij ik,ij->jk\nbqk,bqd->bkd\n7500 6 75",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>einsum_loops(spec, *ops)</C> for explicit specs with <C>-&gt;</C>: find each letter&apos;s size, loop over
          every assignment of all letters (itertools.product), and add the product of the selected entries to the output
          entry named by the output letters. A letter repeated inside one operand must work (it selects a diagonal).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
import itertools

def einsum_loops(spec, *ops):
    lhs, out = spec.split('->')
    ins = lhs.split(',')
    return np.zeros(())
`,
        solution: LOOPS,
        tests: [
          { name: "products", code: `rng = np.random.default_rng(0)
A, B, v = rng.normal(size=(2, 3)), rng.normal(size=(3, 4)), rng.normal(size=4)
for spec, ops in [('ij,jk->ik', (A, B)), ('ij,jk,k->i', (A, B, v)), ('ij->ji', (A,)), ('i,j->ij', (v, v))]:
    assert np.allclose(einsum_loops(spec, *ops), np.einsum(spec, *ops)), spec` },
          { name: "sums and diagonals", code: `S = np.arange(9.0).reshape(3, 3)
assert np.isclose(einsum_loops('ii->', S), 12.0)
assert np.allclose(einsum_loops('ii->i', S), [0, 4, 8])
assert np.allclose(einsum_loops('ij->j', S), S.sum(0))
T = np.arange(24.0).reshape(2, 3, 4)
assert np.allclose(einsum_loops('bij,bjk->bik', T[:, :, :3], T), np.einsum('bij,bjk->bik', T[:, :, :3], T))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grad_spec(spec, k)</C>, the einsum spec for the gradient with respect to operand k, with the output
          gradient first and then the other operands in their original order; and <C>chain_cost(dims)</C>, the fewest scalar
          multiplications needed to multiply matrices of sizes dims[0]×dims[1], dims[1]×dims[2], …, by dynamic programming
          (0 for a single matrix).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def grad_spec(spec, k):
    return spec

def chain_cost(dims):
    return 0
`,
        solution: GRAD,
        tests: [
          { name: "gradient specs", code: `import numpy as np
assert grad_spec('ij,jk->ik', 0) == 'ik,jk->ij' and grad_spec('ij,jk->ik', 1) == 'ik,ij->jk'
assert grad_spec('i,ij,j->', 1) == ',i,j->ij'
rng = np.random.default_rng(2)
A, B, C = rng.normal(size=(2, 3)), rng.normal(size=(3, 4)), rng.normal(size=(4, 2))
spec = 'ij,jk,kl->il'; G = rng.normal(size=(2, 2))
gB = np.einsum(grad_spec(spec, 1), G, A, C)
assert np.allclose(gB, A.T @ G @ C.T)` },
          { name: "chain order", code: `assert chain_cost([2, 3]) == 0
assert chain_cost([10, 100, 5, 50]) == 7500
assert chain_cost([50, 10, 40, 30]) == 27000
assert chain_cost([30, 35, 15, 5, 10, 20, 25]) == 15125
assert chain_cost([1000, 1000, 1000, 1]) == 2000000` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let C = einsum(&quot;ij,jk-&gt;ik&quot;, A, B) and let G = ∂L/∂C. Prove from the definition of einsum that ∂L/∂A =
          einsum(&quot;ik,jk-&gt;ij&quot;, G, B), that is ∂L/∂A = G Bᵀ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes C[i, k] = Σⱼ A[i, j] B[j, k] and uses the chain rule ∂L/∂A[a, b] = Σᵢₖ G[i, k] ∂C[i, k]/∂A[a, b].",
          "Computes ∂C[i, k]/∂A[a, b] = B[b, k] when i = a and 0 otherwise.",
          "Concludes ∂L/∂A[a, b] = Σₖ G[a, k] B[b, k], which is the einsum ik,jk->ij, equivalently (G Bᵀ)[a, b].",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          A is 50×10, B is 10×40 and C is 40×30. What is the fewest number of scalar multiplications needed to compute ABC?
        </p>
      ),
      answer: { kind: "numeric", value: 27000 },
    },
  ],

  teachBack:
    "Explain to a friend what an einsum computes, why it is a tensor product followed by contractions, why the order of the pairwise contractions changes the cost but not the answer, and how to write the gradient of an einsum as another einsum.",

  glimpse: (
    <>
      <p>
        Einsum strings are the notation of tensor networks, the diagrams physicists use for quantum many-body states and that
        machine learning uses for factorised layers. The next lesson writes a big tensor as a small einsum of factors: the
        CP decomposition is <C>ir,jr,kr-&gt;ijk</C>, and the Tucker decomposition is <C>abc,ia,jb,kc-&gt;ijk</C>.
      </p>
    </>
  ),
};
