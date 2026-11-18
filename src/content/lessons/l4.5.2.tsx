import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WlRefineViz } from "@/components/viz/WlRefineViz";
import type { LessonContent } from "@/lib/types";

const MP = `import numpy as np

def message_pass(A, H, W_self, W_nb, agg="sum"):
    M = A @ H
    if agg == "mean":
        M = M / np.maximum(A.sum(axis=1, keepdims=True), 1)
    return np.maximum(H @ W_self + M @ W_nb, 0)

def k_hop(A, k):
    R = np.eye(len(A), dtype=int)
    for _ in range(k):
        R = ((R + R @ A) > 0).astype(int)
    return R > 0`;

const WL = `from collections import Counter

def wl_colours(adj, rounds):
    c = {v: 0 for v in adj}
    for _ in range(rounds):
        c = {v: (c[v], tuple(sorted(c[u] for u in adj[v]))) for v in adj}
    return c

def wl_distinguishes(a, b, rounds):
    return Counter(wl_colours(a, rounds).values()) != Counter(wl_colours(b, rounds).values())`;

export const lesson: LessonContent = {
  id: "l4.5.2",
  minutes: 55,
  links: {
    requires: ["l4.5.1", "m4.3.1"],
    revisits: ["e2.6.1"],
    foreshadows: ["l4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Cyclohexane is a ring of six carbon atoms; a pair of cyclopropane molecules is two rings of three. Each atom in either
        has exactly two carbon neighbours. A neural network that updates each atom from its neighbours, however deep and
        however wide, gives both inputs exactly the same output. Chemists can tell them apart at a glance. Why can such a
        network not, and what does this say about what it computes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A message-passing layer lets every node collect messages from its neighbours, combine them with an order-blind
        aggregation such as a sum, and update its own vector. Stack k layers and each node summarises the k-step neighbourhood
        around it. The same weights are used at every node, and relabelling the nodes simply relabels the outputs. But a node
        only ever sees a tree of neighbours of neighbours; if two different graphs unroll into the same trees, no message-passing
        network can separate them. A classic graph-isomorphism heuristic, colour refinement, computes exactly these trees.
      </p>
      <WlRefineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="message passing">
        <p>
          A graph with node features <M>{"h_v^{(0)}"}</M> is updated in rounds by
        </p>
        <MD>{"m_v^{(t)} = \\bigoplus_{u \\in N(v)} M_t\\bigl(h_v^{(t)}, h_u^{(t)}, e_{uv}\\bigr), \\qquad h_v^{(t+1)} = U_t\\bigl(h_v^{(t)}, m_v^{(t)}\\bigr),"}</MD>
        <p>
          with ⊕ an aggregation invariant to order (sum, mean or max) and <M>{"M_t, U_t"}</M> small networks shared by all
          nodes. A graph-level output pools the final node vectors. With sum aggregation, linear messages and adjacency matrix A,
          one layer is <M>{"H' = \\sigma(H W_{\\text{self}} + A H W_{\\text{nb}})"}</M>, at cost proportional to the number of
          edges.
        </p>
        <Code>{MP}</Code>
      </Definition>

      <Theorem title="equivariance and locality">
        <p>
          For a permutation matrix P, the layer maps <M>{"(PAP^\\top, PH)"}</M> to <M>{"PH'"}</M>. After k layers,{" "}
          <M>{"h_v^{(k)}"}</M> depends only on the features of nodes within distance k of v, the support of row v of{" "}
          <M>{"(I + A)^k"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"PAP^\\top PH = PAH"}</M>, and row-wise maps commute with reordering rows, so the output is <M>{"PH'"}</M>. For
          locality, argue by induction: <M>{"h_v^{(1)}"}</M> uses <M>{"h_v^{(0)}"}</M> and its neighbours, the nodes within distance
          1, and <M>{"h_v^{(k+1)}"}</M> uses <M>{"h^{(k)}"}</M> at v and its neighbours, each depending on nodes within distance k of
          itself, hence within k + 1 of v. Entry (v, u) of <M>{"(I + A)^k"}</M> counts walks of length at most k that may pause,
          which is positive exactly when the distance is at most k.
        </p>
      </Proof>

      <Definition title="colour refinement (1-WL)">
        <p>
          Start with every node the same colour (or coloured by its features). In each round, a node&apos;s new colour is the
          pair of its current colour and the multiset of its neighbours&apos; colours, relabelled. Two graphs are told apart in
          round t if their colour counts differ. This is the one-dimensional Weisfeiler-Lehman test.
        </p>
        <Code>{WL}</Code>
      </Definition>

      <Theorem title="message passing is at most as strong as 1-WL">
        <p>
          If two nodes, in the same or different graphs, have the same colour after t rounds of refinement started from their
          features, then every t-layer message-passing network gives them the same vector.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on t. For t = 0 equal colours mean equal input features. Suppose it holds for t, and let v and w have the
          same colour after round t + 1. Then they had the same colour after round t, so equal vectors by hypothesis, and their
          neighbours&apos; round-t colours form equal multisets, so the neighbours&apos; vectors form equal multisets too. Any
          aggregation of equal multisets is equal, and the update applies the same function to equal arguments. Pooling equal
          multisets of node vectors then gives equal graph outputs. With sum aggregation and injective updates the network
          matches 1-WL exactly, which is the idea behind the graph isomorphism network.
        </p>
      </Proof>

      <Example title="what refinement sees">
        <p>
          In the figure the two branched paths have the same degree sequence, so round 1 colours them identically by degree;
          round 2 separates them, because the degree-3 node has neighbours of degrees 1, 1 and 2 in one graph and 1, 2 and 2 in
          the other. Two triangles and a hexagon are 2-regular, so every node gets the same colour in every round. No
          message-passing network can count the triangles.
        </p>
      </Example>

      <Remark title="getting past the limit">
        <p>
          Adding features that 1-WL cannot compute breaks the tie: counts of small cycles at each node, random node identifiers,
          or positional encodings from the graph Laplacian. Higher-order networks pass messages between pairs or triples of
          nodes, matching stronger WL variants at higher cost. Transformers on graphs attend over all nodes and inject the
          structure through such encodings.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "msgs",
      rung: "check",
      prompt: <p>A graph has 1000 nodes and 5000 undirected edges. How many messages does one message-passing layer send?</p>,
      answer: { kind: "numeric", value: 10000, tolerance: 0.5 },
    },
    {
      key: "path",
      rung: "check",
      prompt: <p>On a path of 10 nodes, how many layers are needed before the vector of one end can depend on the features of the other end?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0.5 },
    },
    {
      key: "regular",
      rung: "apply",
      prompt: <p>Why does a message-passing network give the same output for a 6-cycle and two disjoint triangles with identical node features?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because sum aggregation overflows on cycles",
          "Because every node in both graphs has two neighbours that look exactly like itself, so every node receives the same messages in every round",
          "Because the network is not deep enough; three layers would separate them",
          "Because both graphs have the same number of nodes",
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

def message_pass(A, H, W_self, W_nb, agg="sum"):
    M = A @ H
    if agg == "mean":
        M = M / np.maximum(A.sum(axis=1, keepdims=True), 1)
    return np.maximum(H @ W_self + M @ W_nb, 0)

def k_hop(A, k):
    R = np.eye(len(A), dtype=int)
    for _ in range(k):
        R = ((R + R @ A) > 0).astype(int)
    return R > 0

A = np.array([[0, 1, 0], [1, 0, 1], [0, 1, 0]]); H = np.array([[1.0], [0.0], [0.0]])
print(message_pass(A, H, np.eye(1), np.eye(1)).ravel().tolist(), message_pass(A, H, np.zeros((1, 1)), np.eye(1), agg="mean").ravel().tolist())
print(k_hop(A, 1).astype(int).tolist()[0], bool(k_hop(A, 2).all()), message_pass(A, -H, np.eye(1), np.eye(1)).ravel().tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 1.0, 0.0] [0.0, 0.5, 0.0]\n[1, 1, 0] True [0.0, 0.0, 0.0]",
          "[1.0, 1.0, 0.0] [0.0, 1.0, 0.0]\n[1, 1, 0] True [0.0, 0.0, 0.0]",
          "[1.0, 1.0, 0.0] [0.0, 0.5, 0.0]\n[0, 1, 0] True [0.0, 0.0, 0.0]",
          "[1.0, 1.0, 0.0] [0.0, 0.5, 0.0]\n[1, 1, 0] False [-1.0, -1.0, 0.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import Counter

def wl_colours(adj, rounds):
    c = {v: 0 for v in adj}
    for _ in range(rounds):
        c = {v: (c[v], tuple(sorted(c[u] for u in adj[v]))) for v in adj}
    return c

def wl_distinguishes(a, b, rounds):
    return Counter(wl_colours(a, rounds).values()) != Counter(wl_colours(b, rounds).values())

tri2 = {0: [1, 2], 1: [0, 2], 2: [0, 1], 3: [4, 5], 4: [3, 5], 5: [3, 4]}; hexa = {i: [(i - 1) % 6, (i + 1) % 6] for i in range(6)}
print(wl_distinguishes(tri2, hexa, 3), len(set(wl_colours(hexa, 3).values())))
a = {0: [1], 1: [0, 2, 5], 2: [1, 3], 3: [2, 4], 4: [3], 5: [1]}; b = {0: [1], 1: [0, 2], 2: [1, 3, 5], 3: [2, 4], 4: [3], 5: [2]}; print(wl_distinguishes(a, b, 1), wl_distinguishes(a, b, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["False 1\nFalse True", "True 1\nFalse True", "False 6\nFalse True", "False 1\nTrue True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>message_pass(A, H, W_self, W_nb, agg)</C>, one ReLU layer with sum or mean aggregation over neighbours (mean
          over an empty neighbourhood is 0), and <C>k_hop(A, k)</C>, the boolean matrix of node pairs within distance k.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def message_pass(A, H, W_self, W_nb, agg="sum"):
    return H

def k_hop(A, k):
    return np.eye(len(A), dtype=bool)
`,
        solution: MP,
        tests: [
          { name: "layer", code: `rng = np.random.default_rng(0); A = np.array([[0, 1, 1, 0], [1, 0, 0, 0], [1, 0, 0, 0], [0, 0, 0, 0]]); H = rng.normal(size=(4, 3)); Ws, Wn = rng.normal(size=(3, 2)), rng.normal(size=(3, 2))
assert np.allclose(message_pass(A, H, Ws, Wn), np.maximum(H @ Ws + A @ H @ Wn, 0)) and np.allclose(message_pass(A, H, Ws, Wn, "mean")[0], np.maximum(H[0] @ Ws + (H[1] + H[2]) / 2 @ Wn, 0)) and np.allclose(message_pass(A, H, Ws, Wn, "mean")[3], np.maximum(H[3] @ Ws, 0))
P = np.eye(4)[[2, 0, 3, 1]]; assert np.allclose(message_pass(P @ A @ P.T, P @ H, Ws, Wn), P @ message_pass(A, H, Ws, Wn))` },
          { name: "hops", code: `n = 7; A = np.zeros((n, n), dtype=int); i = np.arange(n - 1); A[i, i + 1] = A[i + 1, i] = 1
assert k_hop(A, 0).sum() == 7 and k_hop(A, 2)[0].tolist() == [True, True, True, False, False, False, False] and k_hop(A, 6).all() and not k_hop(A, 5)[0, 6]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>wl_colours(adj, rounds)</C> for an adjacency dictionary, starting all nodes at colour 0 and using nested
          tuples (old colour, sorted neighbour colours) so colours are comparable across graphs, and{" "}
          <C>wl_distinguishes(a, b, rounds)</C>, which compares colour counts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from collections import Counter

def wl_colours(adj, rounds):
    return {v: 0 for v in adj}

def wl_distinguishes(a, b, rounds):
    return False
`,
        solution: WL,
        tests: [
          { name: "colours", code: `star = {0: [1, 2, 3], 1: [0], 2: [0], 3: [0]}; c = wl_colours(star, 1); assert c[1] == c[2] == c[3] and c[0] != c[1] and len(set(wl_colours(star, 0).values())) == 1` },
          { name: "distinguish", code: `p4 = {0: [1], 1: [0, 2], 2: [1, 3], 3: [2]}; s4 = {0: [1, 2, 3], 1: [0], 2: [0], 3: [0]}; c4 = {i: [(i + 1) % 4, (i + 3) % 4] for i in range(4)}
assert wl_distinguishes(p4, s4, 1) and not wl_distinguishes(p4, s4, 0) and wl_distinguishes(p4, c4, 1)
t2 = {0: [1, 2], 1: [0, 2], 2: [0, 1], 3: [4, 5], 4: [3, 5], 5: [3, 4]}; h6 = {i: [(i + 1) % 6, (i + 5) % 6] for i in range(6)}; assert not wl_distinguishes(t2, h6, 5)` },
        ],
      },
    },
    {
      key: "reach",
      rung: "stretch",
      prompt: <p>For a cycle of 6 nodes with adjacency matrix A, how many entries of (I + A)² are non-zero?</p>,
      answer: { kind: "numeric", value: 30, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The general framework leaves open how messages are weighted and normalised. The next lesson looks at the graph
        convolutional network, attention on graphs, and what happens to node features when layers are stacked deep.
      </p>
    </>
  ),
};
