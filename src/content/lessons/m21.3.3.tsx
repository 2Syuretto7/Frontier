import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphPermuteViz } from "@/components/viz/GraphPermuteViz";
import type { LessonContent } from "@/lib/types";

const MP = `import numpy as np

def permute_graph(A, X, perm):
    P = np.eye(len(perm))[list(perm)]
    return P @ A @ P.T, P @ X                                 # relabel the nodes: (P A P^T, P X)

def mp_layer(A, X, W_self, W_nb):
    return np.maximum(0, X @ W_self + A @ X @ W_nb)           # own features plus the sum over neighbours

def readout(X):
    return X.sum(axis=0)`;

const BELL = `import itertools

def pattern(t):
    first = {}
    return tuple(first.setdefault(v, len(first)) for v in t)  # which positions hold equal indices

def count_orbits(n, k):
    return len({pattern(t) for t in itertools.product(range(n), repeat=k)})

def bell(k):
    row = [1]
    for _ in range(k):                                        # the Bell triangle
        new = [row[-1]]
        for v in row:
            new.append(new[-1] + v)
        row = new
    return row[0]`;

export const lesson: LessonContent = {
  id: "m21.3.3",
  minutes: 55,
  links: {
    requires: ["m21.3.2", "l4.5.2"],
    revisits: ["m21.2.2", "l4.5.1"],
    foreshadows: ["m21.3.4"],
  },

  puzzle: (
    <>
      <p>
        A molecule stored as a graph has no canonical numbering of its atoms, so a property predicted from the adjacency matrix
        must not depend on the numbering. Message passing achieves this, but is it the only option? Suppose instead we allow any
        linear layer from the n × n adjacency-like tensor to itself that respects renumbering. There are n⁴ possible weights;
        how many survive the constraint? The answer does not grow with n, and it is a famous number from combinatorics.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Renumbering the nodes permutes the rows of the feature matrix and both the rows and columns of the adjacency matrix. A
        layer is equivariant if renumbering before the layer is the same as renumbering after it. By m21.1.3, equivariant linear
        maps are constant on the orbits of the group acting on tuples of indices, and an orbit of tuples under all permutations is
        determined only by which positions of the tuple hold equal indices. Counting these patterns gives the number of
        parameters.
      </p>
      <GraphPermuteViz />
    </>
  ),

  theory: (
    <>
      <Definition title="graphs and renumbering">
        <p>
          A graph with n nodes and node features is a pair (A, X) with <M>{"A \\in \\mathbb{R}^{n \\times n}"}</M> and{" "}
          <M>{"X \\in \\mathbb{R}^{n \\times c}"}</M>. A permutation matrix P renumbers it as{" "}
          <M>{"(PAP^\\top, PX)"}</M> (<C>permute_graph</C>). A function F with node outputs is equivariant if{" "}
          <M>{"F(PAP^\\top, PX) = PF(A, X)"}</M> for all P, and a graph-level function is invariant if{" "}
          <M>{"F(PAP^\\top, PX) = F(A, X)"}</M>.
        </p>
      </Definition>

      <Theorem title="message passing is equivariant">
        <p>
          The layer <M>{"F(A, X) = \\sigma(XW_{\\mathrm{self}} + AXW_{\\mathrm{nb}})"}</M> with σ applied entrywise (<C>mp_layer</C>)
          is equivariant, and a sum over nodes (<C>readout</C>) after any stack of such layers is invariant. The same holds with
          any message function and any permutation-invariant aggregation, as in l4.5.2.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"PXW_{\\mathrm{self}} + PAP^\\top PXW_{\\mathrm{nb}} = P(XW_{\\mathrm{self}} + AXW_{\\mathrm{nb}})"}</M> since{" "}
          <M>{"P^\\top P = I"}</M>, and an entrywise σ commutes with permuting rows. The sum over rows satisfies{" "}
          <M>{"\\mathbf{1}^\\top PY = \\mathbf{1}^\\top Y"}</M>. The blueprint of m21.1.3 completes the argument.
        </p>
        <Code>{MP}</Code>
      </Proof>

      <Theorem title="orbits of tuples">
        <p>
          <M>{"S_n"}</M> acts on k-tuples of indices <M>{"(i_1, \\dots, i_k) \\in [n]^k"}</M> by applying the permutation to every
          entry. Two tuples lie in the same orbit exactly when they have the same equality pattern, the partition of the positions
          1, …, k into blocks holding equal indices (<C>pattern</C>). Hence the number of orbits (<C>count_orbits</C>) is the number
          of partitions of a k-element set into at most n blocks, which for n ≥ k is the Bell number <M>{"B_k"}</M>
          (<C>bell</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          A permutation maps equal entries to equal entries and distinct entries to distinct ones, since it is injective, so the
          pattern is constant on orbits. Conversely, if two tuples have the same pattern, the map sending the distinct values of
          the first, in order of appearance, to those of the second is a bijection between two subsets of [n] of the same size,
          and it extends to a permutation of [n] (m1.7.2) that carries the first tuple to the second. Every partition with at most
          n blocks is the pattern of some tuple, obtained by giving each block its own index.
        </p>
      </Proof>

      <Theorem title="equivariant linear layers on graphs">
        <p>
          The linear maps from <M>{"\\mathbb{R}^{n^k}"}</M> to <M>{"\\mathbb{R}^{n^l}"}</M> that commute with renumbering form a
          space of dimension equal to the number of orbits of <M>{"S_n"}</M> on <M>{"[n]^{k + l}"}</M>, which is{" "}
          <M>{"B_{k+l}"}</M> when n ≥ k + l. Node to node (k = l = 1) gives <M>{"B_2 = 2"}</M>, the layers{" "}
          <M>{"aI + b\\mathbf{1}\\mathbf{1}^\\top"}</M>; edge to edge gives{" "}
          <M>{"B_4 = 15"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A linear map is a tensor W indexed by an output tuple and an input tuple, a (k + l)-tuple in all. It commutes with
          renumbering exactly when <M>{"W_{\\pi(i)\\, \\pi(j)} = W_{ij}"}</M> for every permutation π, by the argument for permutation
          representations in m21.1.3 applied to the action on tuples. So W is constant on orbits of (k + l)-tuples, and the
          indicators of the orbits form a basis. The same count is the multiplicity sum <M>{"\\langle \\chi, \\chi \\rangle"}</M> of
          m21.2.2, which is how the 15 of that lesson&apos;s exercise arose.
        </p>
        <Code>{BELL}</Code>
      </Proof>

      <Example title="the fifteen edge-to-edge maps">
        <p>
          The 15 basis maps from an n × n input to an n × n output include: copy the input, transpose it, keep only its diagonal,
          sum each row and broadcast along rows or columns, put row sums on the diagonal, take the total sum and broadcast it
          everywhere or on the diagonal, and so on. Maron and colleagues built invariant graph networks from these layers; with
          tensors of order k they are as expressive as the k-dimensional Weisfeiler-Leman test, at a cost growing like{" "}
          <M>{"n^k"}</M>.
        </p>
      </Example>

      <Remark title="what equivariance cannot buy">
        <p>
          An invariant function gives isomorphic graphs the same output, which is the point. It does not follow that it separates
          non-isomorphic graphs. Message passing over sums of neighbour features cannot distinguish graphs that colour refinement
          (l4.5.2) fails to distinguish, such as two disjoint triangles and a hexagon, which have the same degrees everywhere.
          Higher-order tensors, random node features and substructure counts are ways past this limit, each paid for in compute or
          in exact invariance.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "e2n",
      rung: "check",
      prompt: (
        <p>
          For n ≥ 3, what is the dimension of the space of linear maps from edge features <M>{"\\mathbb{R}^{n \\times n}"}</M> to
          node features <M>{"\\mathbb{R}^n"}</M> that commute with renumbering?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0 },
    },
    {
      key: "b5",
      rung: "check",
      prompt: (
        <p>
          For large n, what is the dimension of the space of equivariant linear maps from edge features (order 2) to tensors of
          order 3?
        </p>
      ),
      answer: { kind: "numeric", value: 52, tolerance: 0 },
    },
    {
      key: "wl",
      rung: "apply",
      prompt: (
        <p>
          A message-passing network gives the same output on two disjoint triangles and on a hexagon, with all node features
          equal. Why is this not a failure of equivariance?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Equivariance only forces equal outputs on isomorphic graphs; these graphs are not isomorphic, but every node sees the same neighbourhood counts, so message passing cannot tell them apart",
          "Because the two graphs are isomorphic",
          "Because the readout is not invariant",
          "Because the network was not trained long enough",
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

def permute_graph(A, X, perm):
    P = np.eye(len(perm))[list(perm)]
    return P @ A @ P.T, P @ X                                 # relabel the nodes: (P A P^T, P X)

def mp_layer(A, X, W_self, W_nb):
    return np.maximum(0, X @ W_self + A @ X @ W_nb)           # own features plus the sum over neighbours

def readout(X):
    return X.sum(axis=0)

A = np.array([[0.0, 1.0, 0.0], [1.0, 0.0, 1.0], [0.0, 1.0, 0.0]]); X = np.array([[1.0], [2.0], [3.0]]); B, Y = permute_graph(A, X, (2, 0, 1))
print(Y.ravel().tolist(), mp_layer(A, X, np.eye(1), np.eye(1)).ravel().tolist(), readout(mp_layer(B, Y, np.eye(1), -np.eye(1))).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 1.0, 2.0] [3.0, 6.0, 5.0] [1.0]",
          "[2.0, 3.0, 1.0] [3.0, 6.0, 5.0] [1.0]",
          "[3.0, 1.0, 2.0] [3.0, 5.0, 4.0] [1.0]",
          "[3.0, 1.0, 2.0] [3.0, 6.0, 5.0] [0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools

def pattern(t):
    first = {}
    return tuple(first.setdefault(v, len(first)) for v in t)  # which positions hold equal indices

def count_orbits(n, k):
    return len({pattern(t) for t in itertools.product(range(n), repeat=k)})

def bell(k):
    row = [1]
    for _ in range(k):                                        # the Bell triangle
        new = [row[-1]]
        for v in row:
            new.append(new[-1] + v)
        row = new
    return row[0]

print(pattern((7, 3, 7, 5)), count_orbits(4, 3), count_orbits(2, 3), [bell(k) for k in range(5)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, 1, 0, 2) 5 4 [1, 1, 2, 5, 15]",
          "(0, 1, 0, 2) 5 5 [1, 1, 2, 5, 15]",
          "(0, 1, 0, 2) 5 4 [1, 2, 5, 15, 52]",
          "(7, 3, 7, 5) 5 4 [1, 1, 2, 5, 15]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>permute_graph(A, X, perm)</C> returning <M>{"(PAP^\\top, PX)"}</M> for the permutation matrix whose rows are
          the unit vectors indexed by perm, <C>mp_layer(A, X, W_self, W_nb)</C> with a ReLU, and <C>readout(X)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def permute_graph(A, X, perm):
    P = np.eye(len(perm))[list(perm)]
    return P @ A, P @ X

def mp_layer(A, X, W_self, W_nb):
    return np.maximum(0, X @ W_self + X @ W_nb)

def readout(X):
    return X[0]
`,
        solution: MP,
        tests: [
          { name: "perm", code: `A = np.array([[0.0, 1.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]])\nB, Y = permute_graph(A, np.array([[1.0], [2.0], [3.0]]), (1, 2, 0))\nassert np.allclose(Y.ravel(), [2.0, 3.0, 1.0]) and np.allclose(B, [[0, 0, 0], [0, 0, 0], [1.0, 0, 0]])` },
          { name: "layer", code: `assert np.allclose(mp_layer(np.array([[0.0, 1.0], [1.0, 0.0]]), np.array([[1.0], [2.0]]), np.eye(1), np.eye(1)), [[3.0], [3.0]])\nr = np.random.default_rng(0); A = np.triu((r.random((5, 5)) < 0.4).astype(float), 1); A = A + A.T\nX = r.normal(size=(5, 3)); Ws, Wn = r.normal(size=(3, 2)), r.normal(size=(3, 2)); perm = (4, 2, 0, 3, 1)\nB, Y = permute_graph(A, X, perm); P = np.eye(5)[list(perm)]\nassert np.allclose(mp_layer(B, Y, Ws, Wn), P @ mp_layer(A, X, Ws, Wn)) and np.allclose(readout(mp_layer(B, Y, Ws, Wn)), readout(mp_layer(A, X, Ws, Wn)))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pattern(t)</C>, relabelling the entries of a tuple by order of first appearance, <C>count_orbits(n, k)</C>, the
          number of <M>{"S_n"}</M> orbits on <M>{"[n]^k"}</M> by enumeration, and <C>bell(k)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools

def pattern(t):
    return tuple(t)

def count_orbits(n, k):
    return n ** k

def bell(k):
    return k
`,
        solution: BELL,
        tests: [
          { name: "pat", code: `assert pattern((5, 5, 2)) == (0, 0, 1) and count_orbits(3, 2) == 2 and count_orbits(1, 3) == 1` },
          { name: "bell", code: `assert [bell(k) for k in range(5)] == [1, 1, 2, 5, 15] and bell(6) == 203 and count_orbits(5, 4) == 15` },
        ],
      },
    },
    {
      key: "small",
      rung: "stretch",
      prompt: (
        <p>
          For graphs with only n = 3 nodes, what is the dimension of the space of equivariant linear maps from{" "}
          <M>{"\\mathbb{R}^{3 \\times 3}"}</M> to itself?
        </p>
      ),
      answer: { kind: "numeric", value: 14, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A transformer reads its input as a set of tokens and is, without positional information, a permutation-equivariant
        function. The next lesson studies attention through this lens: what symmetry it has, how positional encodings break it on
        purpose, and which positional schemes keep a smaller symmetry, translations, intact.
      </p>
    </>
  ),
};
