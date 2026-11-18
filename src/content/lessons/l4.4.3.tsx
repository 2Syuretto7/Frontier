import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SelfAttentionMapViz } from "@/components/viz/SelfAttentionMapViz";
import type { LessonContent } from "@/lib/types";

const SA = `import numpy as np

def causal_mask(n):
    return np.triu(np.ones((n, n), dtype=bool), k=1)

def self_attention(X, W, causal=False):
    Q, K, V = X @ W["q"], X @ W["k"], X @ W["v"]
    S = Q @ K.T / np.sqrt(K.shape[1])
    if causal:
        S = np.where(causal_mask(len(X)), -np.inf, S)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ V, A`;

const POS = `import numpy as np

def sinusoidal(n, d):
    p, i = np.arange(n)[:, None], np.arange(0, d, 2)[None, :]
    ang = p / 10000 ** (i / d)
    P = np.zeros((n, d))
    P[:, 0::2], P[:, 1::2] = np.sin(ang), np.cos(ang)
    return P

def is_equivariant(f, X, perm):
    return bool(np.allclose(f(X[perm]), f(X)[perm]))`;

export const lesson: LessonContent = {
  id: "l4.4.3",
  minutes: 55,
  links: {
    requires: ["l4.4.2"],
    revisits: ["l4.1.1", "l4.3.3"],
    foreshadows: ["l4.4.4", "l4.5.1"],
  },

  puzzle: (
    <>
      <p>
        Feed &quot;dog bites man&quot; and &quot;man bites dog&quot; to a layer of self-attention with no extra machinery, and
        the output for &quot;dog&quot; is exactly the same vector in both sentences, merely in a different row. The layer that
        powers every modern language model cannot, on its own, tell these sentences apart. What symmetry is responsible, and
        how little does it take to break it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In self-attention a sequence attends to itself: every position issues a query, offers a key and a value, and is replaced
        by a weighted average of all the values. Information travels between any two positions in one step, and all positions
        are computed at once, with no recurrence to wait for. The cost is that the operation treats the input as a set. Order
        has to be injected, usually by adding a position-dependent vector to each input, and for language modelling a mask stops
        each position from looking at the future.
      </p>
      <SelfAttentionMapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="self-attention">
        <p>
          For an input <M>{"X \\in \\mathbb R^{n \\times d}"}</M> and learned matrices <M>{"W_q, W_k \\in \\mathbb R^{d \\times d_k}"}</M>,{" "}
          <M>{"W_v \\in \\mathbb R^{d \\times d_v}"}</M>,
        </p>
        <MD>{"\\operatorname{SA}(X) = \\operatorname{softmax}\\Bigl(\\frac{(XW_q)(XW_k)^\\top}{\\sqrt{d_k}} + M\\Bigr) XW_v,"}</MD>
        <p>
          where M is 0 for full attention, and for causal attention <M>{"M_{ij} = -\\infty"}</M> when j &gt; i, so that row i
          averages only positions up to i. Time is <M>{"O(n^2 d_k + n d\\,d_k)"}</M> and the weight matrix has <M>{"n^2"}</M>{" "}
          entries, against <M>{"O(n d^2)"}</M> sequential work for an RNN.
        </p>
        <Code>{SA}</Code>
      </Definition>

      <Theorem title="permutation equivariance">
        <p>
          For any permutation matrix P, full self-attention satisfies <M>{"\\operatorname{SA}(PX) = P\\,\\operatorname{SA}(X)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The query, key and value maps act row by row, so they turn PX into <M>{"PQ, PK, PV"}</M>. The score matrix becomes{" "}
          <M>{"PQK^\\top P^\\top"}</M>, which is the old matrix with rows and columns reordered in the same way. A row-wise
          softmax commutes with reordering rows and with reordering entries inside each row, so the weights become{" "}
          <M>{"PAP^\\top"}</M>, and <M>{"PAP^\\top PV = PAV"}</M> because <M>{"P^\\top P = I"}</M>. A causal mask breaks the symmetry,
          since it depends on the index order, but only partially: the last position still sees an unordered set.
        </p>
      </Proof>

      <Definition title="sinusoidal positional encoding">
        <p>
          The original transformer adds to row p of the input the vector with entries
        </p>
        <MD>{"\\mathrm{PE}_{p, 2i} = \\sin(p\\,\\omega_i), \\qquad \\mathrm{PE}_{p, 2i+1} = \\cos(p\\,\\omega_i), \\qquad \\omega_i = 10000^{-2i/d}."}</MD>
        <p>
          Its frequencies range geometrically from 1 to 1/10000, so short and long offsets are both visible. Learned position
          vectors work about as well inside the training length; rotary and relative schemes are common today.
        </p>
        <Code>{POS}</Code>
      </Definition>

      <Theorem title="sinusoidal codes see offsets">
        <p>
          <M>{"\\mathrm{PE}_p \\cdot \\mathrm{PE}_{p+k} = \\sum_i \\cos(k\\,\\omega_i)"}</M>, which depends on the offset k but not on
          the position p. Moreover <M>{"\\mathrm{PE}_{p+k}"}</M> is a fixed linear function of <M>{"\\mathrm{PE}_p"}</M> for each k.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one frequency, <M>{"\\sin(p\\omega)\\sin((p + k)\\omega) + \\cos(p\\omega)\\cos((p + k)\\omega) = \\cos(k\\omega)"}</M> by the
          identity for the cosine of a difference; summing over frequencies gives the first claim. For the second, the angle-sum
          formulas write <M>{"(\\sin((p + k)\\omega), \\cos((p + k)\\omega))"}</M> as the 2 × 2 rotation by <M>{"k\\omega"}</M> applied to{" "}
          <M>{"(\\sin(p\\omega), \\cos(p\\omega))"}</M>, independent of p. So a query map can learn to look a fixed distance back.
        </p>
      </Proof>

      <Example title="the eight-word sentence">
        <p>
          In the figure the two copies of &quot;dog&quot; have identical rows without positions, each splitting 30% onto itself
          and 30% onto the other copy. Adding sinusoidal positions (scaled by 1.5) makes the second &quot;dog&quot; put 59% on
          itself and only 18% on the first. With the causal mask the first &quot;dog&quot; can see only &quot;the&quot; and
          itself.
        </p>
      </Example>

      <Remark title="why the mask matters for training">
        <p>
          With a causal mask, the output at position i depends only on inputs up to i, so a single forward pass over a sequence
          of length n yields all n next-token predictions with teacher forcing, in parallel. An RNN needs n sequential steps to
          do the same. This parallelism, more than any gain in accuracy per parameter, is what let transformers be trained on
          far more data. The quadratic cost in n is the price.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "n2",
      rung: "check",
      prompt: <p>How many attention weights does one self-attention layer compute for a sequence of 1000 tokens?</p>,
      answer: { kind: "numeric", value: 1000000, tolerance: 0.5 },
    },
    {
      key: "mask",
      rung: "check",
      prompt: <p>How many query-key pairs are left unmasked by a causal mask on a sequence of 6 tokens?</p>,
      answer: { kind: "numeric", value: 21, tolerance: 0.5 },
    },
    {
      key: "bag",
      rung: "apply",
      prompt: <p>A self-attention model without positional information is applied to &quot;dog bites man&quot; and &quot;man bites dog&quot;. What is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "The outputs differ because the attention weights depend on word order",
          "The outputs are the same vectors in permuted rows, so any order-insensitive readout cannot distinguish the sentences",
          "The model raises an error because it needs positions",
          "The outputs are identical only if the value matrix is the identity",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def causal_mask(n):
    return np.triu(np.ones((n, n), dtype=bool), k=1)

def self_attention(X, W, causal=False):
    Q, K, V = X @ W["q"], X @ W["k"], X @ W["v"]
    S = Q @ K.T / np.sqrt(K.shape[1])
    if causal:
        S = np.where(causal_mask(len(X)), -np.inf, S)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ V, A

X = np.array([[1.0, 0], [0, 1], [1.0, 0]]); W = {"q": np.eye(2), "k": np.eye(2), "v": np.eye(2)}
Y, A = self_attention(X, W); print(np.allclose(Y[0], Y[2]), np.round(A[0], 3).tolist())
Y, A = self_attention(X, W, causal=True); print(np.round(A[1], 3).tolist(), np.allclose(Y[0], X[0]), int(causal_mask(3).sum()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True [0.401, 0.198, 0.401]\n[0.33, 0.67, 0.0] True 3",
          "False [0.401, 0.198, 0.401]\n[0.33, 0.67, 0.0] True 3",
          "True [0.333, 0.333, 0.333]\n[0.33, 0.67, 0.0] True 3",
          "True [0.401, 0.198, 0.401]\n[0.5, 0.5, 0.0] False 6",
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

def sinusoidal(n, d):
    p, i = np.arange(n)[:, None], np.arange(0, d, 2)[None, :]
    ang = p / 10000 ** (i / d)
    P = np.zeros((n, d))
    P[:, 0::2], P[:, 1::2] = np.sin(ang), np.cos(ang)
    return P

def is_equivariant(f, X, perm):
    return bool(np.allclose(f(X[perm]), f(X)[perm]))

P = sinusoidal(4, 4); print(P.shape, np.round(P[0], 3).tolist(), np.round(P[1, :2], 3).tolist())
print(np.allclose(np.linalg.norm(sinusoidal(10, 6), axis=1), np.sqrt(3)), round(float(sinusoidal(9, 4)[2] @ sinusoidal(9, 4)[5]), 4), round(float(sinusoidal(9, 4)[0] @ sinusoidal(9, 4)[3]), 4))
X = np.arange(6.0).reshape(3, 2); print(is_equivariant(lambda X: 2 * X, X, [2, 0, 1]), is_equivariant(lambda X: X + sinusoidal(len(X), 2), X, [2, 0, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 4) [0.0, 1.0, 0.0, 1.0] [0.841, 0.54]\nTrue 0.0096 0.0096\nTrue False",
          "(4, 4) [1.0, 0.0, 1.0, 0.0] [0.54, 0.841]\nTrue 0.0096 0.0096\nTrue False",
          "(4, 4) [0.0, 1.0, 0.0, 1.0] [0.841, 0.54]\nTrue 0.0096 -0.98\nTrue False",
          "(4, 4) [0.0, 1.0, 0.0, 1.0] [0.841, 0.54]\nTrue 0.0096 0.0096\nTrue True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>causal_mask(n)</C>, a boolean matrix that is True where attention is blocked, and{" "}
          <C>self_attention(X, W, causal)</C> with W a dictionary of q, k and v matrices, returning the output and the weights.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def causal_mask(n):
    return np.zeros((n, n), dtype=bool)

def self_attention(X, W, causal=False):
    return X, np.eye(len(X))
`,
        solution: SA,
        tests: [
          { name: "full", code: `rng = np.random.default_rng(1); X = rng.normal(size=(5, 4)); W = {"q": rng.normal(size=(4, 3)), "k": rng.normal(size=(4, 3)), "v": rng.normal(size=(4, 2))}
Y, A = self_attention(X, W); S = X @ W["q"] @ (X @ W["k"]).T / np.sqrt(3); E = np.exp(S); A0 = E / E.sum(1, keepdims=True); assert np.allclose(A, A0) and np.allclose(Y, A0 @ X @ W["v"])
p = [3, 0, 4, 1, 2]; assert np.allclose(self_attention(X[p], W)[0], Y[p])` },
          { name: "causal", code: `rng = np.random.default_rng(2); X = rng.normal(size=(4, 3)); W = {"q": np.eye(3), "k": np.eye(3), "v": np.eye(3)}; Y, A = self_attention(X, W, True)
assert causal_mask(4).tolist()[1] == [False, False, True, True] and np.allclose(np.triu(A, 1), 0) and np.allclose(A.sum(1), 1) and np.allclose(Y[0], X[0])
X2 = X.copy(); X2[3] += 5; assert np.allclose(self_attention(X2, W, True)[0][:3], Y[:3])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>sinusoidal(n, d)</C> for even d, with sines in even columns and cosines in odd columns, and{" "}
          <C>is_equivariant(f, X, perm)</C>, which checks whether permuting the rows of the input permutes the rows of f&apos;s
          output in the same way.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sinusoidal(n, d):
    return np.zeros((n, d))

def is_equivariant(f, X, perm):
    return True
`,
        solution: POS,
        tests: [
          { name: "encoding", code: `P = sinusoidal(50, 8); assert P.shape == (50, 8) and np.allclose(P[7, 2], np.sin(7 / 10)) and np.allclose(P[7, 5], np.cos(7 / 100)) and np.allclose(P[:, 6], np.sin(np.arange(50) / 1000))
assert np.allclose(P[10] @ P[13], P[30] @ P[33])` },
          { name: "equivariance", code: `X = np.random.default_rng(0).normal(size=(4, 3)); perm = [1, 3, 0, 2]
assert is_equivariant(lambda Z: Z - Z.mean(0), X, perm) and not is_equivariant(lambda Z: np.cumsum(Z, 0), X, perm) and not is_equivariant(lambda Z: Z + sinusoidal(4, 4)[:, :3], X, perm)` },
        ],
      },
    },
    {
      key: "dot",
      rung: "stretch",
      prompt: (
        <p>
          With d = 4, the sinusoidal frequencies are 1 and 1/100. What is the dot product of the encodings of two positions 3
          apart?
        </p>
      ),
      answer: { kind: "numeric", value: 0.00956, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        One attention pattern per layer forces each position to average everything it needs through a single set of weights.
        The next lesson runs several smaller attentions side by side, so that different heads can track different relations.
      </p>
    </>
  ),
};
