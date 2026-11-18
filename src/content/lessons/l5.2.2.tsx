import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CausalMaskViz } from "@/components/viz/CausalMaskViz";
import type { LessonContent } from "@/lib/types";

const MASKS = `import numpy as np

def causal_mask(n):
    return np.tril(np.ones((n, n), dtype=bool))

def doc_mask(doc_ids):
    d = np.asarray(doc_ids)
    return causal_mask(len(d)) & (d[:, None] == d[None, :])

def masked_attention(X, Wq, Wk, Wv, mask):
    X = np.asarray(X, float)
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = np.where(mask, Q @ K.T / np.sqrt(K.shape[1]), -np.inf)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ V`;

const CHECKS = `import numpy as np

def is_causal(f, X, seed):
    X = np.asarray(X, float)
    base = f(X)
    rng = np.random.default_rng(seed)
    for t in range(1, len(X)):
        Y = X.copy()
        Y[t:] = rng.standard_normal(Y[t:].shape)
        if not np.allclose(f(Y)[:t], base[:t]):
            return False
    return True

def seq_logprob(LP, tokens):
    LP = np.asarray(LP, float)
    return float(sum(LP[t, tokens[t + 1]] for t in range(len(tokens) - 1)))

def allowed_pairs(mask):
    return int(np.asarray(mask).sum())`;

export const lesson: LessonContent = {
  id: "l5.2.2",
  minutes: 40,
  links: {
    requires: ["l5.2.1"],
    revisits: ["l4.3.1"],
    foreshadows: ["l5.3.2", "l5.3.4"],
  },

  puzzle: (
    <>
      <p>
        A recurrent language model reading a 2000-token document makes 2000 predictions one after another. A transformer
        makes all 2000 in a single parallel pass, and each one is a fair prediction that never saw the token it predicts,
        even though every layer lets every position exchange information. What single change makes that possible, and
        which innocent-looking components could quietly break it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Attention is the only place where positions exchange information. If each position may only attend to itself and
        earlier positions, nothing about later tokens can reach it, in any layer, because every other operation acts on one
        position at a time. Then the output at position t is a function of the first t tokens only, and it can be trained to
        predict token t + 1 at the same time as every other position predicts its own next token. The same idea lets several
        short documents share one training row: a mask that is also block-diagonal keeps each document blind to the others.
      </p>
      <CausalMaskViz />
    </>
  ),

  theory: (
    <>
      <Definition title="causal and document masks">
        <p>
          The <em>causal mask</em> for length n allows query i to attend to key j exactly when j ≤ i. When several documents
          are concatenated, with document labels <M>{"d_1, \\dots, d_n"}</M>, the <em>document mask</em> allows the pair only
          when also <M>{"d_i = d_j"}</M>. Disallowed scores are set to −∞ before the softmax. Every query is allowed at least
          itself, so no row is entirely masked.
        </p>
        <Code>{MASKS}</Code>
      </Definition>

      <Theorem title="causality survives depth">
        <p>
          Suppose every layer of a network maps a sequence <M>{"(h_1, \\dots, h_n)"}</M> to one whose t-th entry depends only
          on <M>{"h_1, \\dots, h_t"}</M>. Then the network&apos;s output at position t depends only on the inputs{" "}
          <M>{"x_1, \\dots, x_t"}</M>. Causally masked attention has this property, and so do position-wise maps such as the
          MLP, layer normalisation applied to each position and residual additions.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on the number of layers. With none, the output at t is <M>{"x_t"}</M>. If after k layers entry s depends
          only on <M>{"x_{\\le s}"}</M> for every s, then entry t after layer k + 1 is a function of entries{" "}
          <M>{"1, \\dots, t"}</M> after layer k, each of which depends only on <M>{"x_{\\le t}"}</M>. For masked attention,
          query t gives weight zero to keys and values at positions after t, so they cannot affect its output. A position-wise
          map uses only entry t. A component that pools over positions, such as batch normalisation computed across the
          sequence, breaks the property.
        </p>
      </Proof>

      <Theorem title="one pass computes the whole likelihood">
        <p>
          If the output at position t is a distribution <M>{"q_t"}</M> over the next token computed from <M>{"x_{\\le t}"}</M>,
          then
        </p>
        <MD>{"\\sum_{t=1}^{n-1}\\log q_t(x_{t+1}) = \\log q(x_2, \\dots, x_n \\mid x_1),"}</MD>
        <p>
          the log-likelihood of the sequence under the model defined by the chain rule. Training on all positions of one pass
          therefore maximises the likelihood of whole sequences.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule of probability writes a joint distribution as a product of conditionals,{" "}
          <M>{"q(x_2, \\dots, x_n \\mid x_1) = \\prod_t q(x_{t+1} \\mid x_{\\le t})"}</M>, and the previous theorem makes{" "}
          <M>{"q_t"}</M> a legitimate conditional given <M>{"x_{\\le t}"}</M>, never peeking at <M>{"x_{t+1}"}</M>. Take logs.
          Supplying the true earlier tokens as inputs, rather than the model&apos;s own samples, is called teacher forcing.
        </p>
        <Code>{CHECKS}</Code>
      </Proof>

      <Theorem title="packing is exact with a document mask">
        <p>
          If documents are concatenated, the document mask is used and position indices restart at each document, then every
          position&apos;s output equals what the model would compute on its document alone. The number of allowed query–key
          pairs is <M>{"\\sum_k\\ell_k(\\ell_k+1)/2"}</M> for documents of lengths <M>{"\\ell_k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Apply the induction of the first theorem with &quot;earlier position in the same document&quot; in place of
          &quot;earlier position&quot;: attention at a query sees exactly the keys it would see in its own document, with the
          same position indices, and position-wise maps are unaffected by neighbours. Within a document of length ℓ the
          causal mask allows 1 + 2 + ⋯ + ℓ pairs.
        </p>
      </Proof>

      <Remark title="in practice">
        <p>
          Without the document mask, packing still trains reasonably, since an end-of-text token separates documents and the
          model learns to ignore what came before, but positions late in a row condition on unrelated text. Efficient kernels
          skip the masked half of the score matrix entirely rather than computing and discarding it, and variable-length
          kernels handle packed documents without materialising the mask. The empirical check in the code, changing future
          inputs and confirming earlier outputs do not move, is a cheap test worth running on any new model implementation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pairs",
      rung: "check",
      prompt: <p>How many query–key pairs does a causal mask allow for a sequence of 1024 tokens?</p>,
      answer: { kind: "numeric", value: 524800, tolerance: 0 },
    },
    {
      key: "packed",
      rung: "check",
      prompt: <p>Documents of lengths 300, 500 and 224 are packed into one row of 1024 with a document mask. How many pairs are allowed?</p>,
      answer: { kind: "numeric", value: 195600, tolerance: 0 },
    },
    {
      key: "leak",
      rung: "apply",
      prompt: <p>Which component would let a causally masked transformer see future tokens during training?</p>,
      answer: {
        kind: "choice",
        options: [
          "Batch normalisation whose statistics are computed over all positions of the sequence",
          "Layer normalisation applied to each position separately",
          "A residual connection around each block",
          "A position-wise MLP with a GELU activation",
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

def causal_mask(n):
    return np.tril(np.ones((n, n), dtype=bool))

def doc_mask(doc_ids):
    d = np.asarray(doc_ids)
    return causal_mask(len(d)) & (d[:, None] == d[None, :])

def masked_attention(X, Wq, Wk, Wv, mask):
    X = np.asarray(X, float)
    Q, K, V = X @ Wq, X @ Wk, X @ Wv
    S = np.where(mask, Q @ K.T / np.sqrt(K.shape[1]), -np.inf)
    A = np.exp(S - S.max(axis=1, keepdims=True))
    A /= A.sum(axis=1, keepdims=True)
    return A @ V

print(causal_mask(3).astype(int).tolist(), doc_mask([0, 0, 1, 1]).astype(int).tolist())
X = np.eye(3); I = np.eye(3); print(np.round(masked_attention(X, I, I, I, causal_mask(3)), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 0, 0], [1, 1, 0], [1, 1, 1]] [[1, 0, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 1]]\n[[1.0, 0.0, 0.0], [0.36, 0.64, 0.0], [0.264, 0.264, 0.471]]",
          "[[1, 1, 1], [0, 1, 1], [0, 0, 1]] [[1, 0, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 1]]\n[[1.0, 0.0, 0.0], [0.36, 0.64, 0.0], [0.264, 0.264, 0.471]]",
          "[[1, 0, 0], [1, 1, 0], [1, 1, 1]] [[1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]]\n[[1.0, 0.0, 0.0], [0.36, 0.64, 0.0], [0.264, 0.264, 0.471]]",
          "[[1, 0, 0], [1, 1, 0], [1, 1, 1]] [[1, 0, 0, 0], [1, 1, 0, 0], [0, 0, 1, 0], [0, 0, 1, 1]]\n[[1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.333, 0.333, 0.333]]",
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

def is_causal(f, X, seed):
    X = np.asarray(X, float)
    base = f(X)
    rng = np.random.default_rng(seed)
    for t in range(1, len(X)):
        Y = X.copy()
        Y[t:] = rng.standard_normal(Y[t:].shape)
        if not np.allclose(f(Y)[:t], base[:t]):
            return False
    return True

def seq_logprob(LP, tokens):
    LP = np.asarray(LP, float)
    return float(sum(LP[t, tokens[t + 1]] for t in range(len(tokens) - 1)))

def allowed_pairs(mask):
    return int(np.asarray(mask).sum())

f = lambda X: np.cumsum(X, axis=0); g = lambda X: X[::-1].cumsum(axis=0)[::-1]
print(is_causal(f, np.ones((4, 2)), 0), is_causal(g, np.ones((4, 2)), 0), allowed_pairs(np.tril(np.ones((6, 6), bool))), allowed_pairs(np.kron(np.eye(2, dtype=bool), np.tril(np.ones((3, 3), bool)))))
LP = np.log(np.array([[0.5, 0.5], [0.9, 0.1], [0.2, 0.8]])); print(round(seq_logprob(LP, [0, 1, 0, 1]), 4), round(float(np.log(0.5 * 0.9 * 0.8)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False 21 12\n-1.0217 -1.0217",
          "True True 21 12\n-1.0217 -1.0217",
          "True False 36 12\n-1.0217 -1.0217",
          "True False 21 21\n-2.3026 -1.0217",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>causal_mask(n)</C>, True where attention is allowed; <C>doc_mask(doc_ids)</C>; and{" "}
          <C>masked_attention(X, Wq, Wk, Wv, mask)</C>, single-head scaled dot-product self-attention with the given mask.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def causal_mask(n):
    return np.ones((n, n), dtype=bool)

def doc_mask(doc_ids):
    return causal_mask(len(doc_ids))

def masked_attention(X, Wq, Wk, Wv, mask):
    X = np.asarray(X, float)
    return X @ Wv
`,
        solution: MASKS,
        tests: [
          { name: "masks", code: `assert (causal_mask(3) == np.array([[1, 0, 0], [1, 1, 0], [1, 1, 1]], bool)).all() and doc_mask([0, 0, 1, 1]).sum() == 6 and doc_mask([5, 5, 5]).sum() == 6
assert not doc_mask([0, 1, 1])[2, 0] and doc_mask([0, 1, 1])[2, 1]` },
          { name: "attention", code: `rng = np.random.default_rng(0); X = rng.standard_normal((6, 4)); Wq, Wk, Wv = (rng.standard_normal((4, 3)) for _ in range(3))
Y = masked_attention(X, Wq, Wk, Wv, causal_mask(6)); Z = X.copy(); Z[4:] += 5.0; assert np.allclose(masked_attention(Z, Wq, Wk, Wv, causal_mask(6))[:4], Y[:4])
assert np.allclose(Y[0], X[0] @ Wv)
P = masked_attention(X, Wq, Wk, Wv, doc_mask([0, 0, 0, 1, 1, 1])); assert np.allclose(P[3:], masked_attention(X[3:], Wq, Wk, Wv, causal_mask(3))) and np.allclose(P[:3], Y[:3])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>is_causal(f, X, seed)</C>: for each t from 1 to n − 1, replace rows t onward of a copy of X by fresh standard
          normals and check that the first t rows of f&apos;s output are unchanged; <C>seq_logprob(LP, tokens)</C>, where row t of
          LP holds log-probabilities for the token after position t; and <C>allowed_pairs(mask)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def is_causal(f, X, seed):
    return True

def seq_logprob(LP, tokens):
    return 0.0

def allowed_pairs(mask):
    return np.asarray(mask).size
`,
        solution: CHECKS,
        tests: [
          { name: "causal", code: `assert is_causal(lambda X: np.cumsum(X, axis=0), np.ones((4, 2)), 0) and not is_causal(lambda X: X[::-1].cumsum(axis=0)[::-1], np.ones((4, 2)), 0)
assert not is_causal(lambda X: X - X.mean(axis=0), np.ones((5, 3)), 1) and is_causal(lambda X: X ** 2, np.ones((3, 2)), 2)` },
          { name: "likelihood", code: `LP = np.log(np.array([[0.5, 0.5], [0.9, 0.1], [0.2, 0.8]])); assert abs(seq_logprob(LP, [0, 1, 0, 1]) - np.log(0.36)) < 1e-12 and seq_logprob(LP, [1]) == 0.0
assert allowed_pairs(np.tril(np.ones((6, 6), bool))) == 21` },
        ],
      },
    },
    {
      key: "loss",
      rung: "stretch",
      prompt: (
        <p>
          In one teacher-forced pass, a model gives the true next tokens probabilities 0.5, 0.25 and 0.8. What is the mean
          cross-entropy per token, in nats? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.7675, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The mask controls which positions can interact, but attention by itself still ignores where they are. The next
        lesson follows the ways of telling a transformer about position, from the original sinusoids to the rotations used
        by most current models.
      </p>
    </>
  ),
};
