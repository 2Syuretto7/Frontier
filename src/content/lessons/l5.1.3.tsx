import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UnembedDriftViz } from "@/components/viz/UnembedDriftViz";
import type { LessonContent } from "@/lib/types";

const TABLES = `import numpy as np

def embed(ids, E):
    return np.asarray(E, float)[np.asarray(ids)]

def embed_grad(ids, G, V):
    G = np.asarray(G, float)
    dE = np.zeros((V, G.shape[1]))
    np.add.at(dE, np.asarray(ids), G)
    return dE

def unembed_grad(h, U, y):
    h = np.asarray(h, float)
    z = h @ U
    p = np.exp(z - z.max())
    p /= p.sum()
    p[y] -= 1.0
    return np.outer(h, p)`;

const BOTTLENECK = `import numpy as np

def log_softmax_rows(H, U):
    Z = np.asarray(H, float) @ np.asarray(U, float)
    Z = Z - Z.max(axis=1, keepdims=True)
    return Z - np.log(np.exp(Z).sum(axis=1, keepdims=True))

def num_rank(A, tol=1e-9):
    s = np.linalg.svd(np.asarray(A, float), compute_uv=False)
    return int((s > tol * s[0]).sum()) if s.size and s[0] > 0 else 0

def unembed_gd(H, ys, U, lr, steps):
    H, U = np.asarray(H, float), np.asarray(U, float).copy()
    for _ in range(steps):
        Z = H @ U
        P = np.exp(Z - Z.max(axis=1, keepdims=True))
        P /= P.sum(axis=1, keepdims=True)
        P[np.arange(len(ys)), ys] -= 1.0
        U -= lr * H.T @ P / len(ys)
    return U`;

export const lesson: LessonContent = {
  id: "l5.1.3",
  minutes: 45,
  links: {
    requires: ["l5.1.2", "m5.4.4"],
    revisits: ["l4.2.1"],
    foreshadows: ["l5.1.4"],
  },

  puzzle: (
    <>
      <p>
        A language model begins by looking up a vector for each token and ends by scoring every token against its final
        hidden state. The two matrices look alike, one row or column per token, but they learn in opposite ways. A token that
        never appears in a batch receives no update to its input vector, yet its output vector changes at every single step.
        Why the asymmetry, and what does it do to tokens the model rarely sees?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Looking up a row of a table is multiplying by a one-hot vector, so only the rows that were looked up take part in
        the forward pass and only they receive gradient. The output layer is different: the softmax gives every token some
        probability, and the cross-entropy pushes down every token that was not the answer, in proportion to the probability
        it was given. A token that is never the answer is still pushed down, always away from the hidden states the model
        actually produces, so its score falls everywhere. There is also a limit on what the output layer can express: all
        the scores come from one d-dimensional vector, so the table of log-probabilities over many contexts has low rank.
      </p>
      <UnembedDriftViz />
    </>
  ),

  theory: (
    <>
      <Definition title="embedding and unembedding">
        <p>
          The <em>embedding</em> matrix <M>{"E \\in \\mathbb R^{V \\times d}"}</M> maps token id i to the row{" "}
          <M>{"e_i^\\top E"}</M>, where <M>{"e_i"}</M> is the one-hot vector. The <em>unembedding</em> matrix{" "}
          <M>{"U \\in \\mathbb R^{d \\times V}"}</M> maps a final hidden state h to logits <M>{"z = h^\\top U"}</M>, and the
          model predicts <M>{"p = \\operatorname{softmax}(z)"}</M>.
        </p>
        <Code>{TABLES}</Code>
      </Definition>

      <Theorem title="embedding gradients are sparse">
        <p>
          If a sequence has token ids <M>{"i_1, \\dots, i_n"}</M> and the loss has gradient <M>{"g_t"}</M> with respect to the
          looked-up vector at position t, then
        </p>
        <MD>{"\\frac{\\partial L}{\\partial E} = \\sum_{t=1}^n e_{i_t}g_t^\\top ."}</MD>
        <p>
          Rows of tokens absent from the sequence are zero, and a token that occurs several times receives the sum of its
          gradients.
        </p>
      </Theorem>
      <Proof>
        <p>
          The looked-up vector at position t is <M>{"x_t = E^\\top e_{i_t}"}</M>, which is linear in E; its derivative with
          respect to entry <M>{"E_{jk}"}</M> is <M>{"[j = i_t]"}</M> in coordinate k. By the chain rule{" "}
          <M>{"\\partial L/\\partial E_{jk} = \\sum_t[j = i_t]\\,g_{t,k}"}</M>, which is the stated sum of outer products.
        </p>
      </Proof>

      <Theorem title="unembedding gradients are dense">
        <p>
          For one position with hidden state h and target y, <M>{"\\partial L/\\partial U = h(p - e_y)^\\top"}</M>. The column
          of every token c ≠ y has gradient <M>{"p_ch"}</M>, so a gradient step moves it by <M>{"-\\eta p_ch"}</M>, lowering
          its logit at h by <M>{"\\eta p_c\\|h\\|^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient of the cross-entropy with respect to the logits is <M>{"p - e_y"}</M>, and{" "}
          <M>{"z_c = h^\\top u_c"}</M> gives <M>{"\\partial z_c/\\partial u_c = h"}</M>. For c ≠ y the c-th entry of{" "}
          <M>{"p - e_y"}</M> is <M>{"p_c"}</M>. After the step the logit is{" "}
          <M>{"h^\\top(u_c - \\eta p_ch) = z_c - \\eta p_c\\|h\\|^2"}</M>. Summed over a batch, the column of a token that is
          never a target moves along minus a probability-weighted sum of hidden states.
        </p>
      </Proof>

      <Theorem title="the softmax bottleneck">
        <p>
          Stack the final hidden states of N contexts as the rows of <M>{"H \\in \\mathbb R^{N \\times d}"}</M>. The N × V
          matrix of log-probabilities <M>{"\\log\\operatorname{softmax}(HU)"}</M>, taken row by row, has rank at most d + 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Row n of the log-probabilities is <M>{"z_n - \\log Z_n\\mathbf 1^\\top"}</M>. So the matrix is{" "}
          <M>{"HU - \\ell\\mathbf 1^\\top"}</M> with <M>{"\\ell"}</M> the vector of log-normalisers. The first term has rank at
          most d and the second rank at most 1, and rank is subadditive. So if the true next-token log-probabilities over
          many contexts form a matrix of higher rank, no choice of H and U with width d can match them exactly; mixtures of
          softmaxes and wider final layers are ways around this.
        </p>
        <Code>{BOTTLENECK}</Code>
      </Proof>

      <Remark title="consequences">
        <p>
          The sparse embedding gradient means a rare token&apos;s input vector is updated only in the few batches that contain
          it; with Adam its second-moment estimate is then stale, the situation behind the loss spikes of the optimisation
          course. The dense unembedding gradient means rare tokens are mostly trained by being pushed away from typical
          hidden states, which drives their logits down; Gao and co-authors traced to this push the tendency of trained output vectors
          to crowd into a narrow cone. Implementations exploit the sparsity: an embedding layer&apos;s backward pass is a scatter-add into
          the rows that were used, not a dense matrix product.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rows",
      rung: "check",
      prompt: <p>A batch of 2048 tokens contains 700 distinct token ids from a vocabulary of 50,000. How many rows of the embedding gradient are nonzero, at most?</p>,
      answer: { kind: "numeric", value: 700, tolerance: 0 },
    },
    {
      key: "drop",
      rung: "check",
      prompt: (
        <p>
          A hidden state has <M>{"\\|h\\|^2 = 4"}</M>, a non-target token has probability 0.1, and the learning rate is 0.5.
          By how much does one gradient step on the unembedding lower that token&apos;s logit at h?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2, tolerance: 0.000001 },
    },
    {
      key: "rank",
      rung: "apply",
      prompt: <p>A model has width d = 512. Which statement about its next-token log-probabilities over a million contexts is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "As a contexts-by-vocabulary matrix they have rank at most 513, whatever the weights",
          "They can match any distribution if the vocabulary is at most 512",
          "Their rank is at most 512 because the softmax is applied",
          "The rank is limited only by the number of contexts",
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

def embed(ids, E):
    return np.asarray(E, float)[np.asarray(ids)]

def embed_grad(ids, G, V):
    G = np.asarray(G, float)
    dE = np.zeros((V, G.shape[1]))
    np.add.at(dE, np.asarray(ids), G)
    return dE

def unembed_grad(h, U, y):
    h = np.asarray(h, float)
    z = h @ U
    p = np.exp(z - z.max())
    p /= p.sum()
    p[y] -= 1.0
    return np.outer(h, p)

E = np.array([[1.0, 0.0], [0.0, 2.0], [3.0, 3.0]])
print(embed([2, 0, 2], E).tolist(), embed_grad([2, 0, 2], [[1.0, 1.0], [5.0, 0.0], [2.0, -1.0]], 3).tolist())
print(unembed_grad([1.0, 2.0], np.zeros((2, 2)), 0).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[3.0, 3.0], [1.0, 0.0], [3.0, 3.0]] [[5.0, 0.0], [0.0, 0.0], [3.0, 0.0]]\n[[-0.5, 0.5], [-1.0, 1.0]]",
          "[[3.0, 3.0], [1.0, 0.0], [3.0, 3.0]] [[5.0, 0.0], [0.0, 0.0], [2.0, -1.0]]\n[[-0.5, 0.5], [-1.0, 1.0]]",
          "[[3.0, 3.0], [1.0, 0.0], [3.0, 3.0]] [[1.0, 1.0], [5.0, 0.0], [2.0, -1.0]]\n[[-0.5, 0.5], [-1.0, 1.0]]",
          "[[3.0, 3.0], [1.0, 0.0], [3.0, 3.0]] [[5.0, 0.0], [0.0, 0.0], [3.0, 0.0]]\n[[0.5, -0.5], [1.0, -1.0]]",
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

def log_softmax_rows(H, U):
    Z = np.asarray(H, float) @ np.asarray(U, float)
    Z = Z - Z.max(axis=1, keepdims=True)
    return Z - np.log(np.exp(Z).sum(axis=1, keepdims=True))

def num_rank(A, tol=1e-9):
    s = np.linalg.svd(np.asarray(A, float), compute_uv=False)
    return int((s > tol * s[0]).sum()) if s.size and s[0] > 0 else 0

def unembed_gd(H, ys, U, lr, steps):
    H, U = np.asarray(H, float), np.asarray(U, float).copy()
    for _ in range(steps):
        Z = H @ U
        P = np.exp(Z - Z.max(axis=1, keepdims=True))
        P /= P.sum(axis=1, keepdims=True)
        P[np.arange(len(ys)), ys] -= 1.0
        U -= lr * H.T @ P / len(ys)
    return U

H = np.array([[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [2.0, -1.0]]); U = np.array([[1.0, 0.0, 2.0, -1.0], [0.0, 1.0, 1.0, 3.0]])
print(num_rank(H @ U), num_rank(log_softmax_rows(H, U)), num_rank(np.eye(5)))
U2 = unembed_gd(np.array([[1.0, 0.0], [0.0, 1.0]]), [0, 1], np.zeros((2, 3)), 1.0, 1); print(np.round(U2, 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 3 5\n[[0.333, -0.167, -0.167], [-0.167, 0.333, -0.167]]",
          "2 2 5\n[[0.333, -0.167, -0.167], [-0.167, 0.333, -0.167]]",
          "2 3 5\n[[0.333, -0.167, 0.0], [-0.167, 0.333, 0.0]]",
          "4 4 5\n[[0.333, -0.167, -0.167], [-0.167, 0.333, -0.167]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed(ids, E)</C>; <C>embed_grad(ids, G, V)</C>, the V × d gradient from the rows of G, one per position,
          summing over repeated ids; and <C>unembed_grad(h, U, y)</C>, the gradient of the cross-entropy at one position with
          respect to U.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def embed(ids, E):
    return np.asarray(E, float)[0]

def embed_grad(ids, G, V):
    dE = np.zeros((V, np.asarray(G).shape[1]))
    dE[np.asarray(ids)] = G
    return dE

def unembed_grad(h, U, y):
    return np.zeros(np.asarray(U).shape)
`,
        solution: TABLES,
        tests: [
          { name: "embed", code: `E = np.arange(12.0).reshape(4, 3); assert np.allclose(embed([3, 1], E), [[9, 10, 11], [3, 4, 5]])
assert np.allclose(embed_grad([2, 0, 2], [[1.0, 1.0], [5.0, 0.0], [2.0, -1.0]], 3), [[5, 0], [0, 0], [3, 0]])` },
          { name: "unembed", code: `rng = np.random.default_rng(0); h = rng.standard_normal(3); U = rng.standard_normal((3, 5)); G = unembed_grad(h, U, 2)
def L(U):
    z = h @ U; return np.log(np.exp(z).sum()) - z[2]
e = 1e-6; D = np.zeros_like(U); D[1, 4] = e; assert abs((L(U + D) - L(U - D)) / (2 * e) - G[1, 4]) < 1e-6
assert np.allclose(G.sum(axis=1), 0) and np.allclose(unembed_grad([1.0, 2.0], np.zeros((2, 2)), 0), [[-0.5, 0.5], [-1, 1]])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>log_softmax_rows(H, U)</C>, stable; <C>num_rank(A, tol=1e-9)</C>, counting singular values above tol times
          the largest; and <C>unembed_gd(H, ys, U, lr, steps)</C>, full-batch gradient descent on the mean cross-entropy over
          the rows of H, updating U only.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def log_softmax_rows(H, U):
    return np.asarray(H) @ np.asarray(U)

def num_rank(A, tol=1e-9):
    return min(np.asarray(A).shape)

def unembed_gd(H, ys, U, lr, steps):
    return np.asarray(U, float)
`,
        solution: BOTTLENECK,
        tests: [
          { name: "rank", code: `rng = np.random.default_rng(1); H = rng.standard_normal((20, 4)); U = rng.standard_normal((4, 30))
assert num_rank(H @ U) == 4 and num_rank(log_softmax_rows(H, U)) == 5 and num_rank(np.zeros((3, 3))) == 0
assert np.allclose(np.exp(log_softmax_rows(1000 * H, U)).sum(axis=1), 1)` },
          { name: "drift", code: `H = np.array([[2.0, 0.5], [0.5, 2.0], [1.5, 1.5]]); U = unembed_gd(H, [0, 1, 2], np.zeros((2, 4)), 0.5, 100)
assert np.allclose(U[:, 3], [-0.98, -0.98], atol=0.01) and (H @ U[:, 3] < -1.9).all()
assert np.allclose(unembed_gd([[1.0, 0.0], [0.0, 1.0]], [0, 1], np.zeros((2, 3)), 1.0, 1), [[1 / 3, -1 / 6, -1 / 6], [-1 / 6, 1 / 3, -1 / 6]])` },
        ],
      },
    },
    {
      key: "bottle",
      rung: "stretch",
      prompt: (
        <p>
          Over 10,000 contexts and a vocabulary of 32,000, a model of width 768 is fitted. What is the largest possible rank
          of its matrix of log-probabilities?
        </p>
      ),
      answer: { kind: "numeric", value: 769, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The two matrices have the same shape and hold one vector per token. Many models simply use the same matrix for
        both. The next lesson asks what that sharing gains and what it costs.
      </p>
    </>
  ),
};
