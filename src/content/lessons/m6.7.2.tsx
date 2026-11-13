import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OuterSumViz } from "@/components/viz/OuterSumViz";
import type { LessonContent } from "@/lib/types";

const OUTER = `import numpy as np

def outer3(a, b, c):
    return a[:, None, None] * b[None, :, None] * c[None, None, :]

def cp_tensor(A, B, C):
    return sum(outer3(A[:, r], B[:, r], C[:, r]) for r in range(A.shape[1]))`;

const MODES = `def unfold(T, mode):
    return np.moveaxis(T, mode, 0).reshape(T.shape[mode], -1)

def mode_product(T, M, mode):
    return np.moveaxis(np.tensordot(M, T, axes=(1, mode)), 0, mode)`;

export const lesson: LessonContent = {
  id: "m6.7.2",
  minutes: 60,
  links: {
    requires: ["m6.7.1", "m6.6.5"],
    revisits: ["m6.1.4"],
    foreshadows: ["m6.7.3", "m6.7.4"],
  },

  puzzle: (
    <>
      <p>
        In deep learning code a &ldquo;tensor&rdquo; is just an array with several indices. Mathematicians mean something
        more specific, and the two meanings meet in a useful way: bilinear and multilinear maps, which are everywhere in
        attention and in second-order methods, become ordinary linear maps on a bigger space. What is that space, and what
        does the rank of a tensor mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The tensor product V ⊗ W is the space of all &ldquo;formal products&rdquo; of a vector of V with a vector of W, and
        sums of them. In coordinates <M>{"v \\otimes w"}</M> is the outer product, the array <M>{"v_iw_j"}</M>, and a general
        tensor is any array, a sum of outer products. The fewest outer products needed is the tensor&apos;s rank; for two
        indices that is the ordinary matrix rank.
      </p>
      <OuterSumViz />
    </>
  ),

  theory: (
    <>
      <Definition title="tensor product of spaces">
        <p>
          Let V and W be finite-dimensional with bases <M>{"e_1, \\dots, e_m"}</M> and <M>{"f_1, \\dots, f_n"}</M>. The tensor
          product <M>{"V \\otimes W"}</M> is the mn-dimensional space with basis symbols <M>{"e_i \\otimes f_j"}</M>, together
          with the map <M>{"(v, w) \\mapsto v \\otimes w = \\sum_{i,j}v_iw_j\\,e_i \\otimes f_j"}</M>. This map is bilinear, and
          its values are the elementary (rank-one) tensors.
        </p>
      </Definition>

      <Theorem title="universal property">
        <p>
          For every bilinear map <M>{"\\beta: V \\times W \\to U"}</M> there is exactly one linear map{" "}
          <M>{"L: V \\otimes W \\to U"}</M> with <M>{"L(v \\otimes w) = \\beta(v, w)"}</M> for all v, w.
        </p>
      </Theorem>
      <Proof>
        <p>
          Define L on the basis by <M>{"L(e_i \\otimes f_j) = \\beta(e_i, f_j)"}</M> and extend linearly. Then{" "}
          <M>{"L(v \\otimes w) = \\sum_{i,j}v_iw_j\\beta(e_i, f_j) = \\beta(\\sum_iv_ie_i, \\sum_jw_jf_j) = \\beta(v, w)"}</M>{" "}
          by bilinearity. Uniqueness: any such L is fixed on the elementary tensors <M>{"e_i \\otimes f_j"}</M>, which form a
          basis.
        </p>
      </Proof>
      <p>
        So &ldquo;bilinear in (v, w)&rdquo; and &ldquo;linear in v ⊗ w&rdquo; are the same thing. The property also shows the
        construction does not really depend on the bases chosen: any two spaces with the property are identified by a unique
        linear isomorphism.
      </p>

      <Theorem title="two-index tensors are matrices">
        <p>
          The map <M>{"v \\otimes w \\mapsto vw^\\top"}</M> extends to an isomorphism{" "}
          <M>{"\\mathbb{R}^m \\otimes \\mathbb{R}^n \\cong \\mathbb{R}^{m \\times n}"}</M>. Under it the smallest number of
          elementary tensors summing to T equals rank T, and a tensor is elementary exactly when its matrix has rank at most 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The map sends the basis <M>{"e_i \\otimes f_j"}</M> to the matrix units <M>{"E_{ij}"}</M>, a basis of the matrices.
          A sum of r outer products <M>{"\\sum u_kv_k^\\top = UV^\\top"}</M> has rank at most r, and the SVD writes a rank-r
          matrix as exactly r outer products.
        </p>
      </Proof>

      <Example title="maps between tensor products">
        <p>
          If S: V → V&apos; and T: W → W&apos; are linear, <M>{"(v, w) \\mapsto Sv \\otimes Tw"}</M> is bilinear, so it
          defines a linear <M>{"S \\otimes T"}</M> with <M>{"(S \\otimes T)(v \\otimes w) = Sv \\otimes Tw"}</M>. In the bases{" "}
          <M>{"e_i \\otimes f_j"}</M> ordered row-major, its matrix is the Kronecker product, and on matrices it acts as{" "}
          <M>{"X \\mapsto SXT^\\top"}</M>: the vec trick, now with a reason behind it. Similarly the linear maps from V to W
          form the space <M>{"V' \\otimes W"}</M>, an elementary tensor <M>{"\\varphi \\otimes w"}</M> being the rank-one map{" "}
          <M>{"v \\mapsto \\varphi(v)w"}</M>.
        </p>
        <Code>{OUTER}</Code>
      </Example>

      <Definition title="higher-order tensors">
        <p>
          <M>{"V_1 \\otimes V_2 \\otimes V_3"}</M> has basis <M>{"e_i \\otimes f_j \\otimes g_k"}</M>, so its elements are
          arrays <M>{"T_{ijk}"}</M>, and it linearises trilinear maps. The mode-n unfolding lays out the array as a matrix
          whose rows are indexed by the n-th index; the mode-n product with a matrix M applies M along that index. The ranks of
          the unfoldings form the multilinear rank.
        </p>
        <Code>{MODES}</Code>
      </Definition>

      <Remark title="rank beyond two indices">
        <p>
          For three or more indices the rank (fewest elementary tensors) behaves badly: it can exceed every dimension, it is
          NP-hard to compute in general, it differs over ℝ and ℂ, and a sequence of rank-2 tensors can converge to a rank-3
          one, so a &ldquo;best rank-r approximation&rdquo; need not exist. Nothing like the SVD and Eckart–Young holds in
          general, which is why the tensor decompositions of the last lesson come in several inequivalent kinds.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dim",
      rung: "check",
      prompt: <p>What is the dimension of ℝ³ ⊗ ℝ⁴ ⊗ ℝ²?</p>,
      answer: { kind: "numeric", value: 24 },
    },
    {
      key: "entry",
      rung: "check",
      prompt: <p>As a 2×3 array, what is entry (2, 3) of (1, 2) ⊗ (3, 4, 5)?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "elementary",
      rung: "apply",
      prompt: <p>Which 2×2 array is an elementary tensor u ⊗ v?</p>,
      answer: { kind: "choice", options: ["[[1, 2], [2, 4]]", "[[1, 0], [0, 1]]", "[[1, 2], [3, 4]]", "[[0, 1], [1, 0]]"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def outer3(a, b, c):
    return a[:, None, None] * b[None, :, None] * c[None, None, :]

def cp_tensor(A, B, C):
    return sum(outer3(A[:, r], B[:, r], C[:, r]) for r in range(A.shape[1]))

T = outer3(np.array([1.0, 2.0]), np.array([1.0, 0.0, -1.0]), np.array([3.0, 1.0]))
print(T.shape, T[1, 0, 0], T[1, 2, 1])
T2 = cp_tensor(np.eye(2), np.eye(3)[:, :2], np.eye(2))
print(T2.sum(), int(np.linalg.matrix_rank(T2.reshape(2, -1))), int(np.linalg.matrix_rank(T.reshape(2, -1))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(2, 3, 2) 6.0 -2.0\n2.0 2 1", "(2, 3, 2) 6.0 -2.0\n2.0 2 2", "(2, 2, 3) 6.0 -2.0\n2.0 2 1", "(2, 3, 2) 3.0 -2.0\n3.0 2 1"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def unfold(T, mode):
    return np.moveaxis(T, mode, 0).reshape(T.shape[mode], -1)

def mode_product(T, M, mode):
    return np.moveaxis(np.tensordot(M, T, axes=(1, mode)), 0, mode)

T = np.arange(24.0).reshape(2, 3, 4)
print(unfold(T, 1).shape, unfold(T, 1)[0, :5])
print(mode_product(T, np.ones((1, 3)), 1).shape, mode_product(T, np.ones((1, 3)), 1)[0, 0, 0])
print([int(np.linalg.matrix_rank(unfold(T, m))) for m in range(3)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 8) [ 0.  1.  2.  3. 12.]\n(2, 1, 4) 12.0\n[2, 2, 2]",
          "(3, 8) [0. 1. 2. 3. 4.]\n(2, 1, 4) 12.0\n[2, 2, 2]",
          "(3, 8) [ 0.  1.  2.  3. 12.]\n(2, 3, 1) 12.0\n[2, 2, 2]",
          "(3, 8) [ 0.  1.  2.  3. 12.]\n(2, 1, 4) 12.0\n[2, 3, 4]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>outer3(a, b, c)</C>, the array T[i, j, k] = a[i]b[j]c[k] built by broadcasting, and{" "}
          <C>cp_tensor(A, B, C)</C>, the sum over columns r of outer3(A[:, r], B[:, r], C[:, r]).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def outer3(a, b, c):
    return np.outer(a, b)

def cp_tensor(A, B, C):
    return outer3(A[:, 0], B[:, 0], C[:, 0])
`,
        solution: OUTER,
        tests: [
          { name: "outer", code: `a, b, c = np.array([1.0, 2.0]), np.array([1.0, 0.0, -1.0]), np.array([3.0, 1.0])
T = outer3(a, b, c)
assert T.shape == (2, 3, 2) and T[1, 0, 0] == 6.0 and T[1, 2, 1] == -2.0
assert np.allclose(T, np.einsum('i,j,k->ijk', a, b, c))` },
          { name: "cp", code: `rng = np.random.default_rng(0)
A, B, C = rng.normal(size=(3, 2)), rng.normal(size=(4, 2)), rng.normal(size=(5, 2))
T = cp_tensor(A, B, C)
assert T.shape == (3, 4, 5) and np.allclose(T, np.einsum('ir,jr,kr->ijk', A, B, C))
assert np.linalg.matrix_rank(T.reshape(3, -1)) == 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>unfold(T, mode)</C>, the matrix with T.shape[mode] rows obtained by moving that axis first and flattening
          the rest in order, and <C>mode_product(T, M, mode)</C>, which multiplies T by the matrix M along that axis (new size
          M.shape[0]), keeping the axis in place.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def unfold(T, mode):
    return T.reshape(T.shape[mode], -1)

def mode_product(T, M, mode):
    return T
`,
        solution: `import numpy as np

${MODES}`,
        tests: [
          { name: "unfold", code: `T = np.arange(24.0).reshape(2, 3, 4)
assert unfold(T, 0).shape == (2, 12) and np.allclose(unfold(T, 0), T.reshape(2, 12))
assert unfold(T, 1).shape == (3, 8) and np.allclose(unfold(T, 1)[0], [0, 1, 2, 3, 12, 13, 14, 15])
assert np.allclose(unfold(T, 2)[:, 0], [0, 1, 2, 3])` },
          { name: "mode product", code: `rng = np.random.default_rng(1)
T = rng.normal(size=(2, 3, 4)); M = rng.normal(size=(5, 3))
P = mode_product(T, M, 1)
assert P.shape == (2, 5, 4) and np.allclose(P, np.einsum('ijk,aj->iak', T, M))
assert np.allclose(unfold(P, 1), M @ unfold(T, 1))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove the universal property: for every bilinear β: V × W → U there is a unique linear L: V ⊗ W → U with L(v ⊗ w) =
          β(v, w).
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines L on the basis eᵢ ⊗ fⱼ by L(eᵢ ⊗ fⱼ) = β(eᵢ, fⱼ) and extends linearly.",
          "Checks L(v ⊗ w) = Σᵢⱼ vᵢwⱼβ(eᵢ, fⱼ) = β(v, w) using v ⊗ w = Σ vᵢwⱼ eᵢ ⊗ fⱼ and bilinearity of β.",
          "Proves uniqueness: any linear L with the property is determined on the basis eᵢ ⊗ fⱼ.",
        ],
      },
    },
    {
      key: "rank",
      rung: "stretch",
      prompt: <p>What is the tensor rank of the element of ℝ³ ⊗ ℝ³ given by the array [[1, 2, 3], [2, 4, 6], [1, 1, 1]]?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what the tensor product of two spaces is, why it turns bilinear maps into linear ones, and why the rank of a two-index tensor is the matrix rank while higher-order rank is much harder.",

  glimpse: (
    <>
      <p>
        Every operation on tensors in this lesson (outer products, mode products, unfoldings, Kronecker products, traces)
        is a pattern of index multiplication and summation. Einsum notation writes each pattern as a short string of
        indices, and the next lesson shows how to read, write and cost such expressions.
      </p>
      <p>
        The final lesson returns to rank: the CP decomposition writes a tensor as a sum of elementary tensors, and the Tucker
        decomposition uses the unfoldings, giving the closest thing to an SVD that higher-order tensors have.
      </p>
    </>
  ),
};
