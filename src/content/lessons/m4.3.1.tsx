import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.3.1",
  minutes: 55,
  links: {
    requires: ["m1.6.1", "m4.1.2"],
    foreshadows: ["m4.3.2", "e2.6.1", "m7.8.1"],
  },

  puzzle: (
    <>
      <p>
        At a meeting, everyone counts how many people they shook hands with. Can exactly an odd number of people report an odd
        count?
      </p>
      <p>
        The question is not about people at all, only about who is connected to whom. Strip everything else away and you have
        a graph.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A graph is a set of points (vertices) and lines between some pairs of them (edges). It models road networks, friendships,
        the links of the web, molecules and the dependencies between steps of a computation. Click a vertex below to see its
        neighbours and its degree, and watch the total of all degrees.
      </p>
      <GraphLabViz mode="degree" />
    </>
  ),

  theory: (
    <>
      <Definition title="graph">
        <p>
          A (simple, undirected) <strong>graph</strong> G = (V, E) is a finite set V of <strong>vertices</strong> and a set E
          of <strong>edges</strong>, each edge an unordered pair {"{u, v}"} of distinct vertices. Then u and v are{" "}
          <strong>adjacent</strong>, or <strong>neighbours</strong>. The <strong>degree</strong> deg(v) is the number of edges
          at v.
        </p>
      </Definition>
      <Definition title="variants">
        <p>
          A <strong>directed graph</strong> has ordered pairs (u, v) as edges, drawn as arrows. A <strong>multigraph</strong>{" "}
          allows several edges between the same pair, and loops. A <strong>weighted graph</strong> attaches a number to each
          edge, such as a length or a cost.
        </p>
      </Definition>

      <Theorem title="the handshake lemma">
        <p>
          <M>{"\\displaystyle \\sum_{v \\in V} \\deg(v) = 2|E|"}</M>. Consequently the number of vertices of odd degree is even.
        </p>
      </Theorem>
      <Proof>
        <p>
          Count the pairs (v, e) with v an end of the edge e. Summing over vertices gives the sum of degrees; summing over edges
          gives 2 for each edge. The sum of degrees is therefore even, and a sum of integers is even only if an even number of
          them are odd.
        </p>
      </Proof>

      <Definition title="special graphs">
        <p>
          The <strong>complete graph</strong> <M>{"K_n"}</M> has all <M>{"\\binom{n}{2}"}</M> edges. The{" "}
          <strong>cycle</strong> <M>{"C_n"}</M> joins n vertices in a ring; the <strong>path</strong> <M>{"P_n"}</M> joins
          them in a line. A graph is <strong>bipartite</strong> if its vertices split into two parts with every edge going
          between the parts; <M>{"K_{m,n}"}</M> has all mn such edges.
        </p>
      </Definition>

      <Definition title="subgraphs and isomorphism">
        <p>
          H is a <strong>subgraph</strong> of G if its vertices and edges are among those of G. Graphs G and H are{" "}
          <strong>isomorphic</strong> if there is a bijection between their vertex sets that maps edges exactly onto edges.
          Isomorphic graphs have the same number of vertices, edges and the same list of degrees, though these checks are not
          enough to prove isomorphism.
        </p>
      </Definition>

      <Definition title="representations">
        <p>
          A computer stores a graph as an <strong>adjacency matrix</strong>, the n × n matrix with 1 where an edge joins i and
          j, or as <strong>adjacency lists</strong>, a list of neighbours for each vertex. The matrix takes <M>{"n^2"}</M>{" "}
          space and answers &ldquo;is there an edge?&rdquo; at once; the lists take space proportional to n + |E| and suit
          sparse graphs, which most large graphs are.
        </p>
      </Definition>

      <Example title="the graph in the visualisation">
        <p>
          It has 8 vertices and 10 edges, with degrees 2, 4, 3, 3, 4, 2, 1, 1. They sum to 20 = 2 × 10. The four odd degrees
          come in an even number, as the lemma demands.
        </p>
      </Example>

      <Remark title="matrices and walks">
        <p>
          The (i, j) entry of <M>{"A^k"}</M> counts the walks of length k from i to j: each walk chooses an intermediate vertex
          at each step, and matrix multiplication sums over exactly those choices. Linear algebra and graphs meet here, and
          again in spectral clustering and graph neural networks.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "edges",
      rung: "check",
      prompt: <p>How many edges does the complete graph <M>{"K_{10}"}</M> have?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "degrees",
      rung: "check",
      prompt: <p>A graph has 12 vertices, each of degree 3. How many edges does it have?</p>,
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "impossible",
      rung: "apply",
      prompt: <p>Can a graph have degrees 3, 3, 2, 2, 1? Answer 1 for yes and 0 for no.</p>,
      answer: { kind: "choice", options: ["Yes", "No"], correct: [1] },
    },
    {
      key: "bip",
      rung: "apply",
      prompt: <p>What is the largest number of edges in a bipartite graph with 10 vertices?</p>,
      answer: { kind: "numeric", value: 25 },
    },
    {
      key: "walks",
      rung: "apply",
      prompt: <p>In the cycle <M>{"C_4"}</M> with vertices 1, 2, 3, 4 in order, how many walks of length 2 go from vertex 1 back to vertex 1?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`edges = [(0, 1), (1, 2), (2, 0), (2, 3)]
deg = [0] * 4
for u, v in edges:
    deg[u] += 1; deg[v] += 1
print(deg, sum(deg))`}</Code>
          <p>Degrees from an edge list. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2, 2, 3, 1] 8", "[2, 2, 3, 1] 4", "[1, 1, 2, 0] 4", "[2, 2, 2, 2] 8"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>adjacency(n, edges)</C>, which builds the n × n adjacency matrix (a numpy array of 0s and 1s) of an undirected graph, and <C>walks(A, i, j, k)</C>, the number of walks of length k from i to j, using <C>np.linalg.matrix_power</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adjacency(n, edges):
    A = np.zeros((n, n), dtype=int)
    for u, v in edges:
        A[u, v] = 1
    return A

def walks(A, i, j, k):
    return int(A[i, j])
`,
        solution: `import numpy as np

def adjacency(n, edges):
    A = np.zeros((n, n), dtype=int)
    for u, v in edges:
        A[u, v] = A[v, u] = 1
    return A

def walks(A, i, j, k):
    return int(np.linalg.matrix_power(A, k)[i, j])
`,
        tests: [
          { name: "symmetric", code: `A = adjacency(4, [(0, 1), (1, 2), (2, 0), (2, 3)])
assert (A == A.T).all() and A.sum() == 8, 'Each undirected edge appears twice in the matrix.'` },
          { name: "walks", code: `A = adjacency(4, [(0, 1), (1, 2), (2, 3), (3, 0)])
assert walks(A, 0, 0, 2) == 2 and walks(A, 0, 2, 2) == 2 and walks(A, 0, 1, 3) == 4, 'Powers of A count walks.'` },
        ],
      },
    },
    {
      key: "lemma",
      rung: "prove",
      prompt: (
        <p>
          Prove the handshake lemma, and deduce that a graph in which every vertex has degree 3 has an even number of vertices.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Counts pairs (vertex, edge at that vertex) two ways: by vertices it is the degree sum; by edges it is 2|E|.",
          "Concludes the degree sum is even.",
          "For a 3-regular graph, 3|V| = 2|E| is even, so |V| is even.",
        ],
      },
    },
    {
      key: "labelled",
      rung: "stretch",
      prompt: <p>How many different (labelled) simple graphs are there on the vertex set {"{1, 2, 3, 4}"}?</p>,
      answer: { kind: "numeric", value: 64 },
    },
  ],

  teachBack:
    "Explain to a friend what a graph is, give three things that graphs model, and prove that the number of people who shook an odd number of hands is even.",

  glimpse: (
    <p>
      Next, paths and connectivity: how to tell whether one vertex can reach another. Data Structures and Algorithms stores
      graphs as adjacency lists and searches them; in Probability, a Markov chain is a weighted directed graph, and its
      transition matrix is a weighted adjacency matrix.
    </p>
  ),
};
