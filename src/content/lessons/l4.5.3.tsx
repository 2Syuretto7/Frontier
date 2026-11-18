import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OversmoothViz } from "@/components/viz/OversmoothViz";
import type { LessonContent } from "@/lib/types";

const GCN = `import numpy as np

def gcn_norm(A):
    At = A + np.eye(len(A))
    d = At.sum(axis=1)
    return At / np.sqrt(np.outer(d, d))

def gcn_layer(S, H, W):
    return np.maximum(S @ H @ W, 0)

def propagate(S, x, k):
    for _ in range(k):
        x = S @ x
    return x`;

const GAT = `import numpy as np

def gat_weights(A, H, W, a):
    Z = H @ W
    k = Z.shape[1]
    E = (Z @ a[:k])[:, None] + (Z @ a[k:])[None, :]
    E = np.where(E > 0, E, 0.2 * E)
    E = np.where(A + np.eye(len(A)) > 0, E, -np.inf)
    E = np.exp(E - E.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)

def dirichlet(A, H):
    L = np.diag(A.sum(axis=1)) - A
    return float(np.trace(H.T @ L @ H))`;

export const lesson: LessonContent = {
  id: "l4.5.3",
  minutes: 55,
  links: {
    requires: ["l4.5.2", "m6.3.3"],
    revisits: ["m7.8.4", "l3.5.3"],
    foreshadows: ["l4.6.3"],
  },

  puzzle: (
    <>
      <p>
        On a citation network where only a handful of papers have topic labels, a two-layer graph convolutional network
        labels the rest with about 80% accuracy, well above any method that ignores the citations. Make it eight layers deep
        and the accuracy collapses towards guessing, even on the training nodes, though in image models depth was what made
        everything work. What does a graph convolution do to features when it is applied again and again?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A graph convolution replaces each node&apos;s features by a degree-weighted average over itself and its neighbours,
        followed by a shared linear map. Averaging is a low-pass filter: it removes noise that differs between neighbours
        and keeps signal that neighbours share, which is why it helps when linked nodes tend to have the same label. But
        repeated averaging is a random walk that eventually forgets where it started. After many layers every node in a
        connected graph carries the same information, whatever its community.
      </p>
      <OversmoothViz />
    </>
  ),

  theory: (
    <>
      <Definition title="graph convolutional network">
        <p>
          With <M>{"\\tilde A = A + I"}</M> (adding self-loops) and <M>{"\\tilde D"}</M> its diagonal degree matrix, a GCN layer is
        </p>
        <MD>{"H' = \\sigma\\bigl(S H W\\bigr), \\qquad S = \\tilde D^{-1/2}\\tilde A\\tilde D^{-1/2},"}</MD>
        <p>
          so edge (i, j) carries weight <M>{"1/\\sqrt{\\tilde d_i \\tilde d_j}"}</M>. It is message passing with linear messages,
          sum aggregation and this symmetric normalisation, chosen so that S has eigenvalues of size at most 1 and features do
          not blow up with degree.
        </p>
        <Code>{GCN}</Code>
      </Definition>

      <Theorem title="the spectrum of the normalised adjacency">
        <p>
          For a connected graph, the eigenvalues of S lie in (−1, 1], the eigenvalue 1 is simple, and its eigenvector is{" "}
          <M>{"u \\propto \\tilde D^{1/2}\\mathbf 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          S is similar to <M>{"P = \\tilde D^{-1}\\tilde A = \\tilde D^{-1/2} S \\tilde D^{1/2}"}</M>, the transition matrix of a random
          walk that may stay put, so they share eigenvalues. P is row-stochastic, so every eigenvalue has modulus at most 1 and{" "}
          <M>{"P\\mathbf 1 = \\mathbf 1"}</M>; correspondingly <M>{"S\\tilde D^{1/2}\\mathbf 1 = \\tilde D^{1/2}\\mathbf 1"}</M>. A connected
          walk is irreducible, which makes eigenvalue 1 simple, and the self-loops make it aperiodic, which excludes −1. S is
          symmetric, so all eigenvalues are real.
        </p>
      </Proof>

      <Theorem title="over-smoothing">
        <p>
          Let <M>{"\\lambda = \\max(|\\lambda_2|, |\\lambda_n|) < 1"}</M> be the second largest eigenvalue modulus of S. For any x,{" "}
          <M>{"\\|S^k x - u u^\\top x\\| \\le \\lambda^k \\|x\\|"}</M>. So <M>{"\\tilde D^{-1/2} S^k x"}</M> tends to a constant vector.
        </p>
      </Theorem>
      <Proof>
        <p>
          Expand x in the orthonormal eigenbasis of S: <M>{"x = \\sum_i c_i u_i"}</M> with <M>{"u_1 = u"}</M>. Then{" "}
          <M>{"S^k x - c_1 u = \\sum_{i \\ge 2} \\lambda_i^k c_i u_i"}</M>, whose squared norm is at most{" "}
          <M>{"\\lambda^{2k}\\sum_i c_i^2 \\le \\lambda^{2k}\\|x\\|^2"}</M>. The limit <M>{"c_1 u"}</M> is proportional to{" "}
          <M>{"\\tilde D^{1/2}\\mathbf 1"}</M>, and dividing by <M>{"\\tilde D^{1/2}"}</M> leaves a constant. Weight matrices and
          nonlinearities between layers change the details but, for typical weights, not the trend.
        </p>
      </Proof>

      <Example title="two communities">
        <p>
          In the figure, the raw noisy feature recovers 67% of the community labels by a median split. Two rounds of averaging
          raise this to 97%, as noise is averaged within communities; eight rounds keep 97% but shrink the spread from 0.47 to
          0.041; by 32 rounds the spread is 0.0003 and the split is no better than chance. The useful depth is set by how fast
          information mixes across the sparse links between communities, a property of the graph and not of the network.
        </p>
      </Example>

      <Definition title="graph attention">
        <p>
          A graph attention network learns the averaging weights instead of fixing them by degree:
        </p>
        <MD>{"\\alpha_{ij} = \\operatorname{softmax}_{j \\in N(i) \\cup \\{i\\}}\\Bigl(\\operatorname{LeakyReLU}\\bigl(a^\\top[W h_i; W h_j]\\bigr)\\Bigr), \\qquad h_i' = \\sigma\\Bigl(\\sum_j \\alpha_{ij} W h_j\\Bigr)."}</MD>
        <p>
          It is self-attention restricted to the graph&apos;s edges, usually with several heads. The weights still sum to one, so
          attention changes which neighbours are averaged but does not by itself stop over-smoothing. A useful diagnostic is the
          Dirichlet energy <M>{"\\operatorname{tr}(H^\\top L H) = \\sum_{\\text{edges}}\\|h_i - h_j\\|^2"}</M>, which falls towards zero as
          neighbouring features become equal.
        </p>
        <Code>{GAT}</Code>
      </Definition>

      <Remark title="going deeper anyway">
        <p>
          Residual connections that add each layer&apos;s input back, normalisation that rescales features to keep their spread,
          and concatenating the outputs of all layers before the readout all slow over-smoothing. Many graph tasks, however,
          need only a few hops, and the stronger levers are better input features and positional encodings rather than depth.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "w",
      rung: "check",
      prompt: (
        <p>
          Two linked nodes have degrees 3 and 8 in the original graph. What weight does the GCN give the edge between them,
          after adding self-loops?
        </p>
      ),
      answer: { kind: "numeric", value: 0.16667, tolerance: 0.0001 },
    },
    {
      key: "decay",
      rung: "check",
      prompt: <p>The second largest eigenvalue modulus of S is 0.8. By what factor does the non-constant part of a feature shrink over 20 propagation steps, at most?</p>,
      answer: { kind: "numeric", value: 0.011529, tolerance: 0.00001 },
    },
    {
      key: "deep",
      rung: "apply",
      prompt: <p>Why does a 16-layer GCN often train worse than a 2-layer one, even on its training nodes?</p>,
      answer: {
        kind: "choice",
        options: [
          "Too many parameters cause overfitting",
          "Repeated neighbourhood averaging drives node features towards a degree-scaled constant, so nodes become hard to tell apart",
          "The adjacency matrix becomes singular after many layers",
          "Gradients explode because the eigenvalues of S exceed 1",
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

def gcn_norm(A):
    At = A + np.eye(len(A))
    d = At.sum(axis=1)
    return At / np.sqrt(np.outer(d, d))

def gcn_layer(S, H, W):
    return np.maximum(S @ H @ W, 0)

def propagate(S, x, k):
    for _ in range(k):
        x = S @ x
    return x

S = gcn_norm(np.array([[0, 1], [1, 0]])); print(S.tolist(), propagate(S, np.array([1.0, 3.0]), 1).tolist(), gcn_layer(S, np.array([[1.0], [-3.0]]), np.eye(1)).ravel().tolist())
S3 = gcn_norm(np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]])); u = np.sqrt([2.0, 3, 2]); print(round(float(np.linalg.eigvalsh(S3)[-1]), 6), np.allclose(S3 @ u, u), np.allclose(propagate(S3, np.array([1.0, 0, 0]), 200), u * (u[0] / (u @ u))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.5, 0.5], [0.5, 0.5]] [2.0, 2.0] [0.0, 0.0]\n1.0 True True",
          "[[0.0, 1.0], [1.0, 0.0]] [3.0, 1.0] [0.0, 1.0]\n1.0 True True",
          "[[0.5, 0.5], [0.5, 0.5]] [2.0, 2.0] [-1.0, -1.0]\n1.0 True True",
          "[[0.5, 0.5], [0.5, 0.5]] [2.0, 2.0] [0.0, 0.0]\n1.0 False True",
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

def gat_weights(A, H, W, a):
    Z = H @ W
    k = Z.shape[1]
    E = (Z @ a[:k])[:, None] + (Z @ a[k:])[None, :]
    E = np.where(E > 0, E, 0.2 * E)
    E = np.where(A + np.eye(len(A)) > 0, E, -np.inf)
    E = np.exp(E - E.max(axis=1, keepdims=True))
    return E / E.sum(axis=1, keepdims=True)

def dirichlet(A, H):
    L = np.diag(A.sum(axis=1)) - A
    return float(np.trace(H.T @ L @ H))

A = np.array([[0, 1, 1], [1, 0, 0], [1, 0, 0]]); Al = gat_weights(A, np.eye(3), np.eye(3), np.zeros(6)); print(np.round(Al[0], 3).tolist(), np.allclose(Al.sum(axis=1), 1), Al[1].tolist())
print(dirichlet(A, np.ones((3, 1))), dirichlet(A, np.array([[1.0], [0.0], [3.0]])))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.333, 0.333, 0.333] True [0.5, 0.5, 0.0]\n0.0 5.0",
          "[0.333, 0.333, 0.333] True [0.333, 0.333, 0.333]\n0.0 5.0",
          "[0.5, 0.25, 0.25] True [0.5, 0.5, 0.0]\n0.0 5.0",
          "[0.333, 0.333, 0.333] True [0.5, 0.5, 0.0]\n0.0 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gcn_norm(A)</C> returning S, <C>gcn_layer(S, H, W)</C> with a ReLU, and <C>propagate(S, x, k)</C> applying S k
          times.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gcn_norm(A):
    return A

def gcn_layer(S, H, W):
    return H

def propagate(S, x, k):
    return x
`,
        solution: GCN,
        tests: [
          { name: "norm", code: `A = np.array([[0, 1, 1, 1], [1, 0, 0, 0], [1, 0, 0, 0], [1, 0, 0, 0]]); S = gcn_norm(A); assert np.allclose(S[0, 1], 1 / np.sqrt(8)) and np.allclose(S[0, 0], 0.25) and np.allclose(S[1, 1], 0.5) and np.allclose(S, S.T) and S[1, 2] == 0
assert np.isclose(np.linalg.eigvalsh(S).max(), 1)` },
          { name: "layers", code: `rng = np.random.default_rng(0); A = (rng.random((6, 6)) < 0.5).astype(float); A = np.triu(A, 1); A = A + A.T; S = gcn_norm(A); H, W = rng.normal(size=(6, 3)), rng.normal(size=(3, 2))
assert np.allclose(gcn_layer(S, H, W), np.maximum(S @ H @ W, 0)) and np.allclose(propagate(S, H, 3), S @ S @ S @ H) and np.allclose(propagate(S, H, 0), H)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gat_weights(A, H, W, a)</C>, the GAT attention matrix with LeakyReLU slope 0.2, self-loops included and
          non-edges given weight 0, where the first half of a scores the receiving node and the second half the sender, and{" "}
          <C>dirichlet(A, H)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gat_weights(A, H, W, a):
    return np.eye(len(A))

def dirichlet(A, H):
    return 0.0
`,
        solution: GAT,
        tests: [
          { name: "attention", code: `A = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]]); H = np.array([[1.0, 0], [0, 1], [1, 1]]); W = np.eye(2); a = np.array([0.0, 0, 1, -1]); Al = gat_weights(A, H, W, a)
s = H @ a[2:]; e = np.where(s > 0, s, 0.2 * s); w1 = np.exp(e) / np.exp(e).sum(); assert np.allclose(Al[1], w1) and Al[0, 2] == 0 and np.allclose(Al.sum(1), 1)
w0 = np.exp(e[:2]) / np.exp(e[:2]).sum(); assert np.allclose(Al[0, :2], w0)` },
          { name: "energy", code: `A = np.array([[0, 1, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1], [1, 0, 1, 0]]); assert abs(dirichlet(A, np.array([[1.0], [2], [3], [4]])) - 12) < 1e-12 and abs(dirichlet(A, np.array([[1.0, 0], [0, 1], [1, 0], [0, 1]])) - 8) < 1e-12` },
        ],
      },
    },
    {
      key: "energy",
      rung: "stretch",
      prompt: <p>On a cycle of 6 nodes, node i carries the scalar feature (−1)^i. What is its Dirichlet energy?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Graphs close the tour of structures that architectures can respect. The final section returns to images and asks
        how much of the convolutional design survives when transformers, which build in almost nothing, are given enough data.
      </p>
    </>
  ),
};
