import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.3.2",
  minutes: 60,
  links: {
    requires: ["m4.3.1", "m1.6.2"],
    foreshadows: ["m4.3.3", "e2.6.1", "e2.6.3"],
  },

  puzzle: (
    <>
      <p>
        Königsberg had seven bridges joining four land masses. Its citizens wondered whether a walk could cross every bridge
        exactly once. Nobody found one, but nobody could prove there was none.
      </p>
      <p>
        Euler settled it in 1736 by ignoring the map and looking only at how many bridges touch each piece of land. How?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two vertices are connected if you can walk from one to the other along edges. Breadth-first search finds everything
        reachable from a start, layer by layer: first the neighbours, then their new neighbours, and so on. The layer number is
        the distance. Choose a start below and reveal the layers; some vertices are never reached.
      </p>
      <GraphLabViz mode="bfs" />
    </>
  ),

  theory: (
    <>
      <Definition title="walks, trails, paths and cycles">
        <p>
          A <strong>walk</strong> is a sequence of vertices <M>{"v_0, v_1, \\dots, v_k"}</M> with each consecutive pair
          adjacent; its <strong>length</strong> is k. A <strong>trail</strong> repeats no edge; a <strong>path</strong>{" "}
          repeats no vertex. A <strong>cycle</strong> is a closed walk of length at least 3 that repeats no vertex except that
          it ends where it starts.
        </p>
      </Definition>

      <Theorem title="walks contain paths">
        <p>If there is a walk from u to v, there is a path from u to v.</p>
      </Theorem>
      <Proof>
        <p>
          Take a shortest walk from u to v. If it visited some vertex twice, cutting out the part between the two visits would
          give a shorter walk. So it repeats no vertex, and is a path.
        </p>
      </Proof>

      <Definition title="connectivity">
        <p>
          Write u ~ v if there is a walk from u to v. This is an equivalence relation: reflexive (a walk of length 0),
          symmetric (reverse the walk) and transitive (join two walks). Its classes are the{" "}
          <strong>connected components</strong>. G is <strong>connected</strong> if it has one component. The{" "}
          <strong>distance</strong> d(u, v) is the length of a shortest path.
        </p>
      </Definition>

      <Theorem title="breadth-first search finds distances">
        <p>
          Start a queue with s at distance 0. Repeatedly remove the front vertex u and give every unvisited neighbour distance
          d(u) + 1, adding it to the back. Every vertex reachable from s is visited, and its recorded distance is d(s, v).
        </p>
      </Theorem>
      <Proof>
        <p>
          The queue holds vertices in order of non-decreasing recorded distance, and the recorded distances are lengths of
          actual walks, so they are at least the true distances. Suppose some v received a recorded distance larger than d(s, v)
          and take the nearest such v. On a shortest path to v, its predecessor w has the correct distance d(s, v) − 1, so w was
          processed before any vertex at the larger recorded distance, and when w was processed it gave v the distance
          d(s, v). Contradiction. Each vertex and each edge is handled once, so the work is proportional to |V| + |E|.
        </p>
      </Proof>

      <Theorem title="Euler trails">
        <p>
          A connected graph has a closed trail using every edge exactly once if and only if every vertex has even degree. It
          has an open such trail if and only if exactly two vertices have odd degree; the trail starts and ends at those two.
        </p>
      </Theorem>
      <Proof>
        <p>
          Necessity: each time the trail passes through a vertex it uses two of its edges, one in and one out, so every vertex
          except the ends of an open trail has even degree. Sufficiency (sketch): starting anywhere, walk without reusing edges;
          with all degrees even you can only get stuck back at the start. If edges remain, some vertex on the closed trail has
          an unused edge, because the graph is connected; walk a new closed trail from there and splice it in. Repeat.
        </p>
      </Proof>
      <Example title="Königsberg">
        <p>
          The four land masses touch 5, 3, 3 and 3 bridges: four odd degrees. No walk can cross every bridge once.
        </p>
      </Example>

      <Remark title="Hamilton is harder">
        <p>
          A <strong>Hamiltonian cycle</strong> visits every <em>vertex</em> exactly once. Despite the similar sound, no simple
          test like Euler&rsquo;s is known, and deciding whether one exists is NP-complete, a notion met later in this course.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dist",
      rung: "check",
      prompt: <p>In the cycle <M>{"C_{10}"}</M>, what is the largest distance between two vertices?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "components",
      rung: "check",
      prompt: <p>A graph has 10 vertices and its components are a triangle, a path on 4 vertices and three isolated vertices. How many components does it have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "euler",
      rung: "apply",
      prompt: <p>For which of these does <M>{"K_n"}</M> have a closed trail through every edge exactly once?</p>,
      answer: { kind: "choice", options: ["n = 4", "n = 5", "n = 6", "n = 8"], correct: [1] },
    },
    {
      key: "bfs",
      rung: "apply",
      prompt: <p>In a 5 × 5 grid graph (vertices at grid points, edges between horizontal and vertical neighbours), what is the distance between opposite corners?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "minedges",
      rung: "apply",
      prompt: <p>What is the smallest number of edges a connected graph on 12 vertices can have?</p>,
      answer: { kind: "numeric", value: 11 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque
adj = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3], 5: []}
dist = {0: 0}
q = deque([0])
while q:
    u = q.popleft()
    for v in adj[u]:
        if v not in dist:
            dist[v] = dist[u] + 1
            q.append(v)
print(dist.get(4), 5 in dist)`}</Code>
          <p>Breadth-first search from vertex 0. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 False", "2 False", "3 True", "4 False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>bfs(adj, s)</C>, which returns a dict of distances from s to every reachable vertex using a queue, and <C>components(adj)</C>, the number of connected components. <C>adj</C> maps each vertex to a list of neighbours.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bfs(adj, s):
    return {s: 0}

def components(adj):
    return 1
`,
        solution: `from collections import deque

def bfs(adj, s):
    dist = {s: 0}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

def components(adj):
    seen, count = set(), 0
    for s in adj:
        if s not in seen:
            count += 1
            seen |= set(bfs(adj, s))
    return count
`,
        tests: [
          { name: "distances", code: `adj = {0: [1, 2], 1: [0, 3], 2: [0, 3], 3: [1, 2, 4], 4: [3], 5: []}
assert bfs(adj, 0) == {0: 0, 1: 1, 2: 1, 3: 2, 4: 3}, 'Distances grow by one per layer.'` },
          { name: "grid", code: `adj = {(r, c): [(r + dr, c + dc) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)) if 0 <= r + dr < 5 and 0 <= c + dc < 5] for r in range(5) for c in range(5)}
assert bfs(adj, (0, 0))[(4, 4)] == 8, 'Opposite corners of a 5 × 5 grid are 8 apart.'` },
          { name: "components", code: `adj = {0: [1], 1: [0], 2: [], 3: [4], 4: [3], 5: []}
assert components(adj) == 4, 'Two edges and two isolated vertices: 4 components.'` },
        ],
      },
    },
    {
      key: "equiv",
      rung: "prove",
      prompt: (
        <p>
          Prove that &ldquo;there is a walk from u to v&rdquo; is an equivalence relation, and that two different connected
          components share no vertex.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Reflexive: the walk of length 0. Symmetric: reverse the walk.",
          "Transitive: concatenate a walk from u to v with a walk from v to w.",
          "Notes that equivalence classes of any equivalence relation partition the set, so components are disjoint.",
        ],
      },
    },
    {
      key: "diameter",
      rung: "stretch",
      prompt: <p>The hypercube graph <M>{"Q_6"}</M> has the 64 binary strings of length 6 as vertices, adjacent when they differ in one bit. How many vertices are at distance exactly 3 from 000000?</p>,
      answer: { kind: "numeric", value: 20 },
    },
  ],

  teachBack:
    "Explain to a friend how breadth-first search finds distances in a graph, and why the bridges of Königsberg cannot all be crossed exactly once.",

  glimpse: (
    <p>
      Next, trees: the connected graphs with no cycles, which are exactly what breadth-first search leaves behind. Data
      Structures and Algorithms implements breadth-first and depth-first search, and extends distances to weighted graphs with
      Dijkstra&rsquo;s algorithm.
    </p>
  ),
};
