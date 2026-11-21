import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AttentionSymmetryViz } from "@/components/viz/AttentionSymmetryViz";
import type { LessonContent } from "@/lib/types";

const ATTN = `import numpy as np

def softmax_rows(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)

def attention(X, Wq, Wk, Wv, bias=None):
    S = (X @ Wq) @ (X @ Wk).T / np.sqrt(Wk.shape[1])
    if bias is not None:
        S = S + bias                                          # a fixed n x n score bias, such as positions
    return softmax_rows(S) @ (X @ Wv)

def rel_bias(n, b):
    i = np.arange(n)
    return b[(i[None, :] - i[:, None]) % n]                   # entry (i, j) depends only on j - i, cyclically`;

const ROPE = `import numpy as np

def rope(x, pos, theta):
    out = x.astype(float).copy()
    for p in range(0, len(x), 2):                             # rotate coordinate pair p by the angle pos * theta[p // 2]
        c, s = np.cos(pos * theta[p // 2]), np.sin(pos * theta[p // 2])
        out[p], out[p + 1] = c * x[p] - s * x[p + 1], s * x[p] + c * x[p + 1]
    return out

def rope_score(q, k, i, j, theta):
    return float(rope(q, i, theta) @ rope(k, j, theta))       # depends only on j - i

def perm_gap(f, X, perm):
    return float(np.max(np.abs(f(X[perm]) - f(X)[perm])))   # zero for a permutation-equivariant f`;

export const lesson: LessonContent = {
  id: "m21.3.4",
  minutes: 55,
  links: {
    requires: ["m21.3.3", "l4.4.3"],
    revisits: ["l5.2.3", "m21.1.2"],
    foreshadows: ["m21.4.1"],
  },

  puzzle: (
    <>
      <p>
        Strip the positional encodings from a transformer and it cannot tell &quot;dog bites man&quot; from &quot;man bites
        dog&quot;: it treats its input as a bag of tokens. That is a defect for language but exactly right for point clouds, sets
        of objects and the nodes of a graph. So which symmetry does attention have on its own, what do positional encodings do
        to it, and why do the encodings used in most current language models leave a smaller symmetry, shifting the whole
        sequence, untouched?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Attention computes, for each token, a weighted average of all tokens, with weights that depend only on the contents of
        the pair. Reordering the tokens reorders the outputs in the same way, so attention is permutation equivariant, like the
        layers of the previous lesson, but with aggregation weights that depend on the data. Positional encodings deliberately
        break this symmetry. Absolute encodings break it completely; encodings that make scores depend only on the offset
        between positions keep equivariance to shifts.
      </p>
      <AttentionSymmetryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="self-attention as a set function">
        <p>
          For tokens stored as the rows of <M>{"X \\in \\mathbb{R}^{n \\times d}"}</M>, self-attention is{" "}
          <M>{"\\operatorname{Attn}(X) = \\operatorname{softmax}\\big(XW_Q(XW_K)^\\top/\\sqrt{d_k} + B\\big)\\,XW_V"}</M>, with the
          softmax taken along each row (<C>softmax_rows</C>, <C>attention</C>) and B a fixed matrix of positional score biases,
          zero when there are no positions.
        </p>
        <Code>{ATTN}</Code>
      </Definition>

      <Theorem title="attention without positions is permutation equivariant">
        <p>
          If B = 0 then <M>{"\\operatorname{Attn}(PX) = P\\operatorname{Attn}(X)"}</M> for every permutation matrix P. Consequently,
          tokens with equal embeddings receive equal outputs.
        </p>
      </Theorem>
      <Proof>
        <p>
          The scores become <M>{"PSP^\\top"}</M>. Permuting the entries of a row permutes its softmax in the same way, and permuting
          rows permutes the row-wise softmax, so <M>{"\\operatorname{softmax}(PSP^\\top) = P\\operatorname{softmax}(S)P^\\top"}</M>.
          Multiplying by <M>{"PXW_V"}</M> and using <M>{"P^\\top P = I"}</M> gives <M>{"P\\operatorname{Attn}(X)"}</M>. If tokens i
          and j are equal, the transposition P swapping them fixes X, so <M>{"\\operatorname{Attn}(X) = P\\operatorname{Attn}(X)"}</M>
          and rows i and j of the output agree. Layer norm, residual connections and the position-wise MLP act row by row, so a
          whole transformer without positions is equivariant (<C>perm_gap</C> measures any failure).
        </p>
      </Proof>

      <Theorem title="relative positions keep shift equivariance">
        <p>
          Let C be the cyclic shift of rows. If <M>{"B_{ij} = b(j - i \\bmod n)"}</M> depends only on the offset (<C>rel_bias</C>),
          then <M>{"\\operatorname{Attn}(CX) = C\\operatorname{Attn}(X)"}</M>. An absolute bias, or absolute encodings added to X,
          generically break equivariance for every non-trivial permutation.
        </p>
      </Theorem>
      <Proof>
        <p>
          The content scores of CX are <M>{"CSC^\\top"}</M> as before, and <M>{"(C^\\top B C)_{ij} = B_{i+1, j+1} = B_{ij}"}</M> because
          the offset is unchanged, so <M>{"CSC^\\top + B = C(S + B)C^\\top"}</M> and the argument of the previous proof applies. On a
          sequence with ends rather than a cycle the same identity holds for all pairs away from the boundary.
        </p>
      </Proof>

      <Theorem title="rotary embeddings score offsets">
        <p>
          Rotary position embedding rotates each coordinate pair of a query or key at position i by the angle{" "}
          <M>{"i\\theta_p"}</M> (<C>rope</C>). Then the score between a query at i and a key at j depends only on q, k and j − i
          (<C>rope_score</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          On one pair, with <M>{"R(\\alpha)"}</M> the rotation by α,{" "}
          <M>{"\\langle R(i\\theta)q, R(j\\theta)k \\rangle = \\langle q, R(i\\theta)^\\top R(j\\theta)k\\rangle = \\langle q, R((j - i)\\theta)k\\rangle"}</M>
          , because rotations are orthogonal and form a group, and the score is the sum over pairs. This is the representation of
          the translation group on <M>{"\\mathbb{R}^2"}</M> by rotations (m21.2.1), the same mechanism examined in l5.2.3.
        </p>
        <Code>{ROPE}</Code>
      </Proof>

      <Example title="causal masks and readouts">
        <p>
          A causal mask sets <M>{"B_{ij} = -\\infty"}</M> for j &gt; i, which depends on positions, so a causal transformer is not
          permutation equivariant even without positional encodings, and can in fact infer positions from the mask. For a set-level
          prediction the outputs are pooled by a mean, which is invariant, or an extra learned token is attended to by all others
          and read out; by equivariance its output is invariant to permutations of the rest.
        </p>
      </Example>

      <Remark title="choosing the symmetry">
        <p>
          The same architecture covers several cases by choosing B: no positions for sets and point clouds, relative biases or
          rotary embeddings for sequences, where only shifts should be ignored, and biases from graph distances for graph
          transformers, which keep permutation equivariance because a graph distance moves with the nodes when they are renumbered.
          In each case the symmetry is fixed by what the positional term depends on.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rope",
      rung: "check",
      prompt: (
        <p>
          A rotary embedding on one coordinate pair uses θ = 0.1 radians per position. The query and key are both (1, 0), at
          positions 3 and 13. What is their score? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.54, tolerance: 0.0006 },
    },
    {
      key: "offsets",
      rung: "check",
      prompt: (
        <p>
          A relative-position bias on a non-cyclic sequence of length 64 has one learned value for each possible offset j − i. How
          many values is that?
        </p>
      ),
      answer: { kind: "numeric", value: 127, tolerance: 0 },
    },
    {
      key: "causal",
      rung: "apply",
      prompt: <p>Why is a decoder-only transformer with a causal mask not permutation equivariant, even with no positional encodings?</p>,
      answer: {
        kind: "choice",
        options: [
          "The mask lets token i attend only to tokens at positions up to i, so the bias depends on positions and is not preserved by reordering",
          "Because the softmax is not equivariant",
          "Because the value projection mixes tokens",
          "Because layer norm depends on the order of tokens",
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

def softmax_rows(S):
    E = np.exp(S - S.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)

def attention(X, Wq, Wk, Wv, bias=None):
    S = (X @ Wq) @ (X @ Wk).T / np.sqrt(Wk.shape[1])
    if bias is not None:
        S = S + bias                                          # a fixed n x n score bias, such as positions
    return softmax_rows(S) @ (X @ Wv)

def rel_bias(n, b):
    i = np.arange(n)
    return b[(i[None, :] - i[:, None]) % n]                   # entry (i, j) depends only on j - i, cyclically

X = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]); I = np.eye(2); Z = np.zeros((2, 2))
print(attention(X, Z, Z, I).round(3).tolist(), rel_bias(3, np.array([0.0, 1.0, 2.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.667, 0.667], [0.667, 0.667], [0.667, 0.667]] [[0.0, 1.0, 2.0], [2.0, 0.0, 1.0], [1.0, 2.0, 0.0]]",
          "[[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]] [[0.0, 1.0, 2.0], [2.0, 0.0, 1.0], [1.0, 2.0, 0.0]]",
          "[[0.667, 0.667], [0.667, 0.667], [0.667, 0.667]] [[0.0, 1.0, 2.0], [1.0, 0.0, 1.0], [2.0, 1.0, 0.0]]",
          "[[0.667, 0.667], [0.667, 0.667], [0.667, 0.667]] [[0.0, 2.0, 1.0], [1.0, 0.0, 2.0], [2.0, 1.0, 0.0]]",
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

def rope(x, pos, theta):
    out = x.astype(float).copy()
    for p in range(0, len(x), 2):                             # rotate coordinate pair p by the angle pos * theta[p // 2]
        c, s = np.cos(pos * theta[p // 2]), np.sin(pos * theta[p // 2])
        out[p], out[p + 1] = c * x[p] - s * x[p + 1], s * x[p] + c * x[p + 1]
    return out

def rope_score(q, k, i, j, theta):
    return float(rope(q, i, theta) @ rope(k, j, theta))       # depends only on j - i

def perm_gap(f, X, perm):
    return float(np.max(np.abs(f(X[perm]) - f(X)[perm])))   # zero for a permutation-equivariant f

q = np.array([1.0, 0.0]); k = np.array([0.0, 1.0]); th = np.array([np.pi / 2])
print(round(rope_score(q, k, 0, 1, th), 3), round(rope_score(q, k, 5, 6, th), 3), round(rope_score(q, k, 1, 0, th), 3), perm_gap(lambda X: 2 * X, np.eye(3), [2, 0, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["-1.0 -1.0 1.0 0.0", "1.0 1.0 -1.0 0.0", "-1.0 1.0 1.0 0.0", "-1.0 -1.0 1.0 2.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>softmax_rows(S)</C>, stably, <C>attention(X, Wq, Wk, Wv, bias)</C> with scores scaled by the square root of the
          key dimension, and <C>rel_bias(n, b)</C> with entry (i, j) equal to b[(j − i) mod n].
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax_rows(S):
    return S / S.sum(axis=1, keepdims=True)

def attention(X, Wq, Wk, Wv, bias=None):
    return X @ Wv

def rel_bias(n, b):
    return np.tile(b, (n, 1))
`,
        solution: ATTN,
        tests: [
          { name: "attn", code: `X = np.array([[1.0, 0.0], [0.0, 2.0]]); Z = np.zeros((2, 2))\nassert np.allclose(softmax_rows(np.array([[0.0, np.log(3.0)]])), [[0.25, 0.75]])\nassert np.allclose(attention(X, Z, Z, np.eye(2)), [[0.5, 1.0], [0.5, 1.0]])` },
          { name: "bias", code: `assert np.allclose(rel_bias(3, np.array([1.0, 2.0, 3.0])), [[1, 2, 3], [3, 1, 2], [2, 3, 1]])\nr = np.random.default_rng(0); X = r.normal(size=(4, 3)); W = [r.normal(size=(3, 3)) for _ in range(3)]; Bb = rel_bias(4, r.normal(size=4))\nassert np.allclose(attention(np.roll(X, 1, axis=0), *W, Bb), np.roll(attention(X, *W, Bb), 1, axis=0))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rope(x, pos, theta)</C>, rotating coordinate pair p of x by <C>pos * theta[p // 2]</C>,{" "}
          <C>rope_score(q, k, i, j, theta)</C>, and <C>perm_gap(f, X, perm)</C>, the largest entry of{" "}
          <M>{"|f(X[\\text{perm}]) - f(X)[\\text{perm}]|"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rope(x, pos, theta):
    return x

def rope_score(q, k, i, j, theta):
    return float(q @ k)

def perm_gap(f, X, perm):
    return 0.0
`,
        solution: ROPE,
        tests: [
          { name: "rope", code: `assert np.allclose(rope(np.array([1.0, 0.0, 0.0, 1.0]), 1, np.array([np.pi / 2, np.pi])), [0.0, 1.0, 0.0, -1.0])` },
          { name: "score", code: `q = np.array([1.0, 2.0]); k = np.array([0.5, -1.0]); th = np.array([0.3])\nassert abs(rope_score(q, k, 2, 7, th) - rope_score(q, k, 10, 15, th)) < 1e-12 and abs(rope_score(q, k, 0, 0, th) - q @ k) < 1e-12\nassert abs(rope_score(q, k, 0, 1, th) - q @ k) > 1e-3 and perm_gap(lambda Y: np.cumsum(Y, axis=0), np.eye(3), [2, 0, 1]) > 0.5` },
        ],
      },
    },
    {
      key: "distinct",
      rung: "stretch",
      prompt: (
        <p>
          A transformer with no positional information and no causal mask reads the token sequence a b c a b, with distinct
          embeddings for a, b and c and generic weights. How many distinct output vectors can it produce at the five positions?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the symmetries acted on finite sets of positions. Data on curved spaces, such as the sphere of directions or the
        manifold of rotations, and parameter spaces with their own geometry need the language of manifolds, which the next
        chapter introduces.
      </p>
    </>
  ),
};
