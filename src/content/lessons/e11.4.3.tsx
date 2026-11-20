import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SemDedupViz } from "@/components/viz/SemDedupViz";
import type { LessonContent } from "@/lib/types";

const CLUSTER = `import numpy as np

def normalize(X):
    X = np.asarray(X, dtype=float)
    return X / np.linalg.norm(X, axis=1, keepdims=True)   # unit rows: dot product is cosine similarity

def assign(X, C):
    return np.argmax(X @ C.T, axis=1)            # the most similar centroid

def kmeans(X, k, iters=20, seed=0):
    X = normalize(X)
    C = X[np.random.default_rng(seed).choice(len(X), k, replace=False)]
    for _ in range(iters):
        labels = assign(X, C)
        for j in range(k):
            if (labels == j).any():
                m = X[labels == j].sum(axis=0)
                C[j] = m / np.linalg.norm(m)      # spherical k-means: renormalise the mean
    return assign(X, C), C`;

const SEMDEDUP = `import numpy as np

def semdedup_cluster(X, centroid, eps):
    order = np.argsort(X @ centroid, kind="stable")   # least typical first: they are kept in preference
    kept = []
    for i in order:
        if not kept or (X[kept] @ X[i]).max() <= 1 - eps:
            kept.append(int(i))
    return sorted(kept)

def semdedup(X, labels, centroids, eps):
    kept = []
    for j, c in enumerate(centroids):
        idx = np.flatnonzero(labels == j)        # duplicates are only searched for within a cluster
        kept += [int(idx[i]) for i in semdedup_cluster(X[idx], c, eps)]
    return sorted(kept)

def removal_curve(X, labels, centroids, eps_list):
    return [1 - len(semdedup(X, labels, centroids, e)) / len(X) for e in eps_list]`;

export const lesson: LessonContent = {
  id: "e11.4.3",
  minutes: 45,
  links: {
    requires: ["e11.4.2", "l1.6.2"],
    revisits: ["m3.1.3", "l4.2.1"],
    foreshadows: ["e11.6.3", "e11.7.3"],
  },

  puzzle: (
    <>
      <p>
        After MinHash deduplication, a corpus still contains thousands of recipe pages for the same dish, written independently,
        hundreds of rewrites of the same press release, and product descriptions generated from one template with different
        wording. They share few shingles, so near-duplicate detection passes them. Is it worth removing text that is different in words
        but the same in meaning, and how could it be found among billions of documents?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An embedding model maps each document to a vector so that documents with similar meaning point in similar directions. Pairs with
        cosine similarity close to 1 are semantic duplicates. Comparing all pairs is too expensive, but duplicates are close to each
        other, so they fall in the same cluster: cluster with k-means, then compare only within clusters. From each group of
        duplicates, keep the one least typical of its cluster, which keeps the corpus spread out.
      </p>
      <SemDedupViz />
    </>
  ),

  theory: (
    <>
      <Definition title="spherical k-means">
        <p>
          <C>normalize</C> scales embeddings to unit length, so a dot product is a cosine similarity (m3.1.3). <C>assign</C> sends each
          point to its most similar centroid, and <C>kmeans</C> alternates assignment with setting each centroid to the normalised mean
          of its points, the cosine version of k-means (l1.6.2).
        </p>
        <Code>{CLUSTER}</Code>
      </Definition>

      <Definition title="semantic deduplication">
        <p>
          Within one cluster, <C>semdedup_cluster</C> visits points in increasing order of similarity to the centroid and keeps a point
          only if its similarity to every kept point is at most 1 − ε. <C>semdedup</C> applies this to every cluster, and{" "}
          <C>removal_curve</C> reports the fraction removed for several values of ε, which is how ε is chosen.
        </p>
        <Code>{SEMDEDUP}</Code>
      </Definition>

      <Theorem title="what the greedy pass guarantees">
        <p>
          Within a cluster, any two kept points have similarity at most 1 − ε, and every removed point has similarity above 1 − ε to
          some kept point.
        </p>
      </Theorem>
      <Proof>
        <p>
          A point is kept only if it passes the test against all points kept before it, and later points are tested against it in turn,
          so every kept pair passed the test once. A point is removed only when some already kept point is more similar than 1 − ε, and
          kept points are never removed. So the kept set is spread out and still within reach of everything removed.
        </p>
      </Proof>

      <Theorem title="the saving from clustering">
        <p>
          Comparing all pairs of n points costs <M>{"\\binom n2"}</M> similarities. Within k clusters of sizes <M>{"n_1, \\dots, n_k"}</M>{" "}
          it costs <M>{"\\sum_j \\binom{n_j}{2}"}</M>, which is at least about <M>{"n^2/(2k)"}</M>, with equality for equal sizes.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\sum_j \\binom{n_j}{2} = \\tfrac12(\\sum_j n_j^2 - n)"}</M>, and by the Cauchy–Schwarz inequality{" "}
          <M>{"\\sum_j n_j^2 \\ge (\\sum_j n_j)^2/k = n^2/k"}</M>, with equality when all <M>{"n_j = n/k"}</M>. Unequal clusters cost
          more, and duplicates in different clusters are missed, which is the price of the speed.
        </p>
      </Proof>

      <Remark title="semantic deduplication in practice">
        <p>
          SemDeDup clustered image-text and web-text embeddings with k-means, removed up to half of the data with little loss in
          quality, and trained faster as a result. D4 followed it with a step that favours diverse clusters. The choice of ε is checked
          with small training runs (e11.6.3), since aggressive settings remove legitimate variety. The same idea underlies efforts to
          keep synthetic data diverse, where templated generations crowd into tight clusters (e11.7.3).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The recipe pages and rewritten releases sit close together in embedding space, inside the same k-means cluster. Comparing only
          within clusters finds them for a fraction of the cost of all pairs, and keeping the least typical member of each group keeps
          the variety while removing the repetition.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: (
        <p>
          A million documents are split into 1000 clusters of 1000. How many pairwise similarities, in millions, does comparing within
          clusters take?
        </p>
      ),
      answer: { kind: "numeric", value: 499.5, tolerance: 0.01 },
    },
    {
      key: "cosine",
      rung: "check",
      prompt: <p>What is the cosine similarity of (1, 2, 2) and (2, 1, 2)? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.889, tolerance: 0.001 },
    },
    {
      key: "typical",
      rung: "apply",
      prompt: <p>Why visit points from least to most similar to their centroid?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that the least typical member of each duplicate group is the one kept, keeping the corpus spread out",
          "So that the most common phrasing is kept",
          "Because k-means requires this order",
          "So that fewer similarities are computed",
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

def normalize(X):
    X = np.asarray(X, dtype=float)
    return X / np.linalg.norm(X, axis=1, keepdims=True)   # unit rows: dot product is cosine similarity

def assign(X, C):
    return np.argmax(X @ C.T, axis=1)            # the most similar centroid

def kmeans(X, k, iters=20, seed=0):
    X = normalize(X)
    C = X[np.random.default_rng(seed).choice(len(X), k, replace=False)]
    for _ in range(iters):
        labels = assign(X, C)
        for j in range(k):
            if (labels == j).any():
                m = X[labels == j].sum(axis=0)
                C[j] = m / np.linalg.norm(m)      # spherical k-means: renormalise the mean
    return assign(X, C), C

X, k = normalize([[1, 0], [0.99, 0.1], [0, 1], [0.1, 1], [-1, 0]]), kmeans([[1, 0], [0.99, 0.1], [0, 1], [0.1, 1]], 2)[0]
print(assign(X, X[[0, 2]]).tolist(), np.round(X[1] @ X[0], 3), k[0] == k[1] != k[2] == k[3])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 0, 1, 1, 1] 0.995 True", "[0, 0, 1, 1, 0] 0.995 True", "[0, 0, 1, 1, 1] 0.99 True", "[0, 0, 1, 1, 1] 0.995 False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def semdedup_cluster(X, centroid, eps):
    order = np.argsort(X @ centroid, kind="stable")   # least typical first: they are kept in preference
    kept = []
    for i in order:
        if not kept or (X[kept] @ X[i]).max() <= 1 - eps:
            kept.append(int(i))
    return sorted(kept)

def semdedup(X, labels, centroids, eps):
    kept = []
    for j, c in enumerate(centroids):
        idx = np.flatnonzero(labels == j)        # duplicates are only searched for within a cluster
        kept += [int(idx[i]) for i in semdedup_cluster(X[idx], c, eps)]
    return sorted(kept)

def removal_curve(X, labels, centroids, eps_list):
    return [1 - len(semdedup(X, labels, centroids, e)) / len(X) for e in eps_list]

X, c, lab = np.array([[1.0, 0.0], [0.995, 0.0995], [0.0, 1.0], [0.0995, 0.995]]), np.array([0.7071, 0.7071]), np.array([0, 0, 1, 1])
print(semdedup_cluster(X, c, 0.05), semdedup(X, lab, X[[0, 2]], 0.05), [round(v, 2) for v in removal_curve(X, lab, X[[0, 2]], [0.0, 0.5])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 2] [1, 3] [0.0, 0.5]", "[0, 2] [0, 2] [0.0, 0.5]", "[1, 3] [1, 3] [0.0, 0.5]", "[0, 2] [1, 3] [0.5, 0.5]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalize(X)</C>; <C>assign(X, C)</C>; and <C>kmeans(X, k, iters=20, seed=0)</C>, starting from k distinct rows
          chosen with <C>np.random.default_rng(seed).choice</C>, leaving a centroid unchanged when its cluster is empty, and returning
          (labels, centroids).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def normalize(X):
    return np.asarray(X, dtype=float)

def assign(X, C):
    return np.zeros(len(X), dtype=int)

def kmeans(X, k, iters=20, seed=0):
    return np.zeros(len(X), dtype=int), np.asarray(X, dtype=float)[:k]
`,
        solution: CLUSTER,
        tests: [
          { name: "assign", code: `X = normalize([[3, 4], [0, -2]])\nassert np.allclose(X, [[0.6, 0.8], [0, -1]]) and assign(X, np.array([[0.0, 1.0], [1.0, 0.0]])).tolist() == [0, 1]` },
          { name: "kmeans", code: `rng = np.random.default_rng(5)\nX = np.vstack([[1, 0, 0] + 0.05 * rng.normal(size=(20, 3)), [0, 0, 1] + 0.05 * rng.normal(size=(20, 3))])\nl, C = kmeans(X, 2)\nassert len(set(l[:20])) == 1 and len(set(l[20:])) == 1 and l[0] != l[20] and np.allclose(np.linalg.norm(C, axis=1), 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>semdedup_cluster(X, centroid, eps)</C>, using a stable sort and returning sorted local indices;{" "}
          <C>semdedup(X, labels, centroids, eps)</C>, returning sorted global indices; and{" "}
          <C>removal_curve(X, labels, centroids, eps_list)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def semdedup_cluster(X, centroid, eps):
    return list(range(len(X)))

def semdedup(X, labels, centroids, eps):
    return list(range(len(X)))

def removal_curve(X, labels, centroids, eps_list):
    return [0.0 for _ in eps_list]
`,
        solution: SEMDEDUP,
        tests: [
          { name: "cluster", code: `a = np.array([[1.0, 0.0], [0.8, 0.6], [0.6, 0.8], [0.0, 1.0]])\nc = np.array([0.6, 0.8])\nassert semdedup_cluster(a, c, 0.1) == [0, 1, 3] and semdedup_cluster(a, c, 0.5) == [0, 3] and semdedup_cluster(a, c, 0.0) == [0, 1, 2, 3]` },
          { name: "global", code: `a = np.array([[1.0, 0.0], [0.99, 0.141], [0.0, 1.0], [0.141, 0.99]])\nlab = np.array([0, 0, 1, 1])\nC = np.array([[1.0, 0.0], [0.0, 1.0]])\nassert semdedup(a, lab, C, 0.05) == [1, 3] and np.allclose(removal_curve(a, lab, C, [0.0, 0.05]), [0.0, 0.5])` },
        ],
      },
    },
    {
      key: "fan",
      rung: "stretch",
      prompt: (
        <p>
          Seven unit vectors in a plane point at 0°, 10°, ..., 60°, forming one cluster with its centroid at 30°. With 1 − ε = cos 25°,
          and ties in similarity to the centroid broken by angle, smallest first, how many does <C>semdedup_cluster</C> keep?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Deduplication and filtering operate on text. Before a model sees any of it, text becomes tokens, and the next chapter begins at
        the bottom, with how characters are encoded as bytes.
      </p>
    </>
  ),
};
