import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EmbeddingMfViz } from "@/components/viz/EmbeddingMfViz";
import type { LessonContent } from "@/lib/types";

const EMB = `import numpy as np

def embed(E, ids):
    return E[np.asarray(ids)]

def embed_grad(E_shape, ids, upstream):
    g = np.zeros(E_shape)
    np.add.at(g, np.asarray(ids), upstream)
    return g

def nearest(E, i, k):
    U = E / np.linalg.norm(E, axis=1, keepdims=True)
    s = U @ U[i]; s[i] = -np.inf
    return np.argsort(-s)[:k].tolist()`;

const MF = `import numpy as np

def factorise(R, mask, d, steps, lr=0.05, lam=0.01, seed=0):
    rng = np.random.default_rng(seed)
    U = 0.1 * rng.normal(size=(R.shape[0], d)); V = 0.1 * rng.normal(size=(R.shape[1], d))
    for _ in range(steps):
        E = mask * (U @ V.T - R)
        U, V = U - lr * (E @ V + lam * U), V - lr * (E.T @ U + lam * V)
    return U, V

def collision_free_prob(n, m):
    return float(np.prod(1 - np.arange(n) / m))`;

export const lesson: LessonContent = {
  id: "l4.2.1",
  minutes: 50,
  links: {
    requires: ["l3.2.3"],
    revisits: ["l1.7.1", "m3.8.3"],
    foreshadows: ["l4.2.2", "l5.1.3"],
  },

  puzzle: (
    <>
      <p>
        A film site knows only which users rated which films, and how highly. It has no genres, no plot summaries, no cast
        lists. Yet if you give every user and every film a short vector of free numbers and adjust them so that dot products
        match the ratings, the film vectors end up arranged by genre, mood and era. Where does that meaning come from, and
        how much of the resulting geometry can you actually trust?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An embedding replaces a symbol from a large discrete set, a word, a user, a product, with a learned vector of a few
        hundred numbers. Nothing about a symbol&apos;s index is meaningful, but the vectors are trained to make predictions, so
        symbols that behave alike are pushed to similar places. Technically an embedding layer is just a linear layer applied
        to a one-hot vector, implemented as a row lookup, and its gradient touches only the rows that were looked up.
      </p>
      <EmbeddingMfViz />
    </>
  ),

  theory: (
    <>
      <Definition title="embedding layer">
        <p>
          An embedding table is a matrix <M>{"E \\in \\mathbb R^{V \\times d}"}</M>. The embedding of symbol i is its row{" "}
          <M>{"E_i = e_i^\\top E"}</M>, where <M>{"e_i"}</M> is the one-hot vector. A batch of ids is embedded by indexing,
          never by forming the one-hot matrix.
        </p>
      </Definition>

      <Theorem title="sparse gradients">
        <p>
          If a loss depends on E only through the looked-up rows <M>{"E_{i_1}, \\dots, E_{i_n}"}</M>, with upstream gradients{" "}
          <M>{"g_1, \\dots, g_n"}</M>, then{" "}
          <M>{"\\partial L/\\partial E = \\sum_t e_{i_t}g_t^\\top"}</M>: row j receives the sum of the gradients of all positions
          where j occurred, and every unused row receives zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          The lookup is the linear map <M>{"E \\mapsto e_{i}^\\top E"}</M>, whose gradient, by the matrix-layer rule from the
          backpropagation lessons, is <M>{"e_i g^\\top"}</M>. Summing over positions gives the scatter-add. Repeated ids
          accumulate rather than overwrite, which is why the code uses <C>np.add.at</C> and not fancy-index assignment. Rare
          symbols are therefore updated rarely and learn slowly, and optimisers such as Adam need care with these mostly-zero
          gradients.
        </p>
        <Code>{EMB}</Code>
      </Proof>

      <Example title="embeddings from matrix factorisation">
        <p>
          Give each user u a vector <M>{"U_u"}</M> and each item i a vector <M>{"V_i"}</M>, and fit observed ratings by{" "}
          <M>{"\\min \\sum_{(u,i)\\ \\text{observed}}(U_u^\\top V_i - R_{ui})^2 + \\lambda(\\lVert U\\rVert^2 + \\lVert V\\rVert^2)"}</M>.
          When the full rating matrix has low rank, half the entries suffice to recover the rest: on a random rank-2 matrix of
          20 users and 15 items, dimension 2 predicts held-out ratings almost perfectly, dimension 1 underfits, and dimension 6
          starts to overfit.
        </p>
        <Code>{MF}</Code>
      </Example>

      <Theorem title="the geometry is defined only up to a transformation">
        <p>
          For any invertible <M>{"A \\in \\mathbb R^{d \\times d}"}</M>, the embeddings <M>{"UA"}</M> and{" "}
          <M>{"VA^{-\\top}"}</M> give exactly the same predictions as U and V. With the weight-decay penalty, optimal solutions
          are determined only up to an orthogonal A.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(UA)(VA^{-\\top})^\\top = UAA^{-1}V^\\top = UV^\\top"}</M>. So individual coordinates mean nothing, and even angles
          between item vectors can be changed by a non-orthogonal A without changing a single prediction. The penalty breaks
          part of this freedom: for a fixed product <M>{"P = UV^\\top"}</M>, the minimum of{" "}
          <M>{"\\lVert U\\rVert^2 + \\lVert V\\rVert^2"}</M> is twice the sum of the singular values of P, attained when both
          factors carry the square roots of those singular values, which leaves only rotations free. Nearest neighbours under
          cosine similarity are then meaningful, but any single direction still is not.
        </p>
      </Proof>

      <Remark title="very large vocabularies">
        <p>
          A table for 50,000 tokens at width 512 already has 25.6 million parameters, and catalogues of products or users run
          to billions. The hashing trick maps ids into m buckets with a hash function, accepting collisions. By the birthday
          calculation, n ids land in distinct buckets with probability <M>{"\\prod_{k<n}(1 - k/m) \\approx e^{-n^2/2m}"}</M>,
          about 0.62 for a thousand ids in a million buckets, so collisions are certain at scale and models must tolerate them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>How many parameters does an embedding table for 50,000 tokens with dimension 512 have?</p>,
      answer: { kind: "numeric", value: 25600000, tolerance: 0.5 },
    },
    {
      key: "hash",
      rung: "check",
      prompt: <p>What is the probability that 100 ids hashed uniformly into 10,000 buckets all land in different buckets?</p>,
      answer: { kind: "numeric", value: 0.6086, tolerance: 0.0005 },
    },
    {
      key: "gauge",
      rung: "apply",
      prompt: <p>Why must cosine similarities between learned item embeddings be interpreted with care in an unregularised factorisation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Transforming U by A and V by the inverse transpose of A leaves all predictions unchanged but can change the angles between item vectors",
          "Cosine similarity is undefined for vectors of dimension above three",
          "The embeddings are always orthogonal",
          "The gradient of an embedding table is sparse",
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

def embed(E, ids):
    return E[np.asarray(ids)]

def embed_grad(E_shape, ids, upstream):
    g = np.zeros(E_shape)
    np.add.at(g, np.asarray(ids), upstream)
    return g

def nearest(E, i, k):
    U = E / np.linalg.norm(E, axis=1, keepdims=True)
    s = U @ U[i]; s[i] = -np.inf
    return np.argsort(-s)[:k].tolist()

E = np.arange(12.0).reshape(4, 3); print(embed(E, [2, 0, 2]).tolist(), embed_grad(E.shape, [2, 0, 2], np.ones((3, 3)))[:, 0].tolist())
F = np.array([[1.0, 0.0], [0.9, 0.1], [0.0, 1.0], [-1.0, 0.0], [0.1, 0.95]]); print(nearest(F, 0, 2), nearest(F, 2, 1), (np.eye(4)[[2, 0]] @ E).tolist() == embed(E, [2, 0]).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[6.0, 7.0, 8.0], [0.0, 1.0, 2.0], [6.0, 7.0, 8.0]] [1.0, 0.0, 2.0, 0.0]\n[1, 4] [4] True",
          "[[6.0, 7.0, 8.0], [0.0, 1.0, 2.0], [6.0, 7.0, 8.0]] [1.0, 0.0, 1.0, 0.0]\n[1, 4] [4] True",
          "[[6.0, 7.0, 8.0], [0.0, 1.0, 2.0], [6.0, 7.0, 8.0]] [1.0, 0.0, 2.0, 0.0]\n[1, 2] [4] True",
          "[[2.0, 5.0, 8.0], [0.0, 3.0, 6.0], [2.0, 5.0, 8.0]] [1.0, 0.0, 2.0, 0.0]\n[1, 4] [4] False",
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

def factorise(R, mask, d, steps, lr=0.05, lam=0.01, seed=0):
    rng = np.random.default_rng(seed)
    U = 0.1 * rng.normal(size=(R.shape[0], d)); V = 0.1 * rng.normal(size=(R.shape[1], d))
    for _ in range(steps):
        E = mask * (U @ V.T - R)
        U, V = U - lr * (E @ V + lam * U), V - lr * (E.T @ U + lam * V)
    return U, V

def collision_free_prob(n, m):
    return float(np.prod(1 - np.arange(n) / m))

rng = np.random.default_rng(1); R = rng.normal(size=(20, 2)) @ rng.normal(size=(15, 2)).T; mask = (rng.random(R.shape) < 0.5).astype(float)
rmse = lambda P, m: float(np.sqrt(((P - R) ** 2 * m).sum() / m.sum())); out = [factorise(R, mask, d, 3000) for d in (1, 2, 6)]; print([round(rmse(U @ V.T, 1 - mask), 2) for U, V in out])
print(round(collision_free_prob(23, 365), 3), round(collision_free_prob(1000, 2 ** 20), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.69, 0.0, 0.08]\n0.493 0.62",
          "[0.0, 0.0, 0.0]\n0.493 0.62",
          "[0.69, 0.08, 0.0]\n0.493 0.62",
          "[0.69, 0.0, 0.08]\n0.507 0.38",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>embed(E, ids)</C>; <C>embed_grad(E_shape, ids, upstream)</C>, the gradient of the table given upstream gradients
          for each looked-up row; and <C>nearest(E, i, k)</C>, the indices of the k rows with highest cosine similarity to row
          i, excluding i.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def embed(E, ids):
    return E[:len(ids)]

def embed_grad(E_shape, ids, upstream):
    return np.zeros(E_shape)

def nearest(E, i, k):
    return list(range(k))
`,
        solution: EMB,
        tests: [
          { name: "lookup", code: `E = np.random.default_rng(0).normal(size=(6, 4)); ids = [5, 1, 5, 5]; g = np.random.default_rng(1).normal(size=(4, 4)); G = embed_grad(E.shape, ids, g)
assert np.allclose(embed(E, ids), E[ids]) and np.allclose(G[5], g[0] + g[2] + g[3]) and np.allclose(G[1], g[1]) and np.allclose(G[[0, 2, 3, 4]], 0)` },
          { name: "nearest", code: `F = np.array([[1.0, 0.0], [10.0, 1.0], [0.0, 1.0], [-1.0, 0.0], [3.0, 3.0]]); assert nearest(F, 0, 3) == [1, 4, 2] and nearest(F, 3, 1) == [2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>factorise(R, mask, d, steps, lr, lam, seed)</C>, fitting user and item embeddings to the observed entries of R
          by full-batch gradient descent with weight decay, and <C>collision_free_prob(n, m)</C>, the probability that n ids
          hashed uniformly into m buckets do not collide.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def factorise(R, mask, d, steps, lr=0.05, lam=0.01, seed=0):
    return np.zeros((R.shape[0], d)), np.zeros((R.shape[1], d))

def collision_free_prob(n, m):
    return 1.0
`,
        solution: MF,
        tests: [
          { name: "factorise", code: `rng = np.random.default_rng(7); R = rng.normal(size=(12, 1)) @ rng.normal(size=(9, 1)).T; mask = (rng.random(R.shape) < 0.6).astype(float); U, V = factorise(R, mask, 1, 3000)
assert U.shape == (12, 1) and V.shape == (9, 1) and np.sqrt((((U @ V.T - R) ** 2) * (1 - mask)).sum() / (1 - mask).sum()) < 0.1` },
          { name: "birthday", code: `assert abs(collision_free_prob(23, 365) - 0.4927) < 1e-4 and collision_free_prob(1, 5) == 1.0 and collision_free_prob(6, 5) == 0.0` },
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: <p>What is the expected number of colliding pairs when 1000 ids are hashed into 2²⁰ buckets?</p>,
      answer: { kind: "numeric", value: 0.4764, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Ratings gave the factorisation something to predict. For words there are no ratings, only text. The next lesson shows
        how predicting a word&apos;s neighbours is enough to give words meaningful vectors.
      </p>
    </>
  ),
};
