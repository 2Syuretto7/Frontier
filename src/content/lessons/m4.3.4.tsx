import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.3.4",
  minutes: 55,
  links: {
    requires: ["m4.3.3", "m1.6.3"],
    foreshadows: ["e2.6.2", "e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        A neural network computes y = f(g(x), h(x)). To evaluate it you must compute g and h before f; to take gradients you
        must go the other way. With thousands of operations, how does a framework find an order that respects every
        dependency, and when is there none?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw an arrow from each task to every task that needs it. If the arrows never loop back, some task has nothing pointing
        into it: it can go first. Remove it and repeat. Step through Kahn&rsquo;s algorithm below; the numbers give a valid
        order.
      </p>
      <GraphLabViz mode="topo" />
    </>
  ),

  theory: (
    <>
      <Definition title="directed acyclic graph">
        <p>
          A <strong>directed acyclic graph</strong> (DAG) is a directed graph with no directed cycle. The{" "}
          <strong>in-degree</strong> of a vertex is the number of edges pointing into it; a <strong>source</strong> has
          in-degree 0 and a <strong>sink</strong> has out-degree 0.
        </p>
      </Definition>
      <Definition title="topological order">
        <p>
          A <strong>topological order</strong> lists the vertices so that every edge u → v has u before v.
        </p>
      </Definition>

      <Theorem title="every DAG has a source">
        <p>A finite DAG with at least one vertex has a vertex of in-degree 0.</p>
      </Theorem>
      <Proof>
        <p>
          Start anywhere and repeatedly step backwards along an incoming edge. If every vertex had an incoming edge this could
          go on forever, but there are finitely many vertices, so some vertex would repeat, and the steps between its two visits
          form a directed cycle.
        </p>
      </Proof>

      <Theorem title="a directed graph has a topological order if and only if it is acyclic">
        <p>Kahn&rsquo;s algorithm finds one: repeatedly output a source and delete it with its outgoing edges.</p>
      </Theorem>
      <Proof>
        <p>
          If there is a cycle, its first vertex in any order has an edge into it from a later vertex on the cycle, so no order
          works. If the graph is acyclic, it has a source s; put s first. Deleting s leaves a DAG, which by induction on the
          number of vertices has a topological order; append it. Every edge out of s goes forward, and the remaining edges are
          handled by the induction. If the algorithm ever finds no source while vertices remain, those vertices contain a cycle.
        </p>
      </Proof>

      <Example title="getting dressed">
        <p>
          Socks before shoes, trousers before shoes, shirt before tie, tie before jacket, shirt before jacket. One order: shirt,
          tie, socks, trousers, jacket, shoes. Many orders are valid; a DAG usually has many topological orders.
        </p>
      </Example>

      <Remark title="partial orders">
        <p>
          The relation &ldquo;there is a directed path from u to v&rdquo; in a DAG is a partial order, and a topological order
          is a total order extending it. Every finite partial order arises this way, so the theorem says every finite partial
          order extends to a total one.
        </p>
      </Remark>

      <Remark title="computation graphs">
        <p>
          Deep-learning frameworks record a computation as a DAG of operations. The forward pass evaluates in a topological
          order; backpropagation visits the vertices in the reverse order, so every gradient is complete before it is passed on.
          Build systems, spreadsheets and package managers solve the same problem.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many topological orders does the DAG with edges a → b, a → c have on the vertices a, b, c?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "which",
      rung: "check",
      prompt: <p>Which of these directed graphs has no topological order?</p>,
      answer: { kind: "choice", options: ["a → b, b → c, a → c", "a → b, b → c, c → a", "a → b, c → b", "a → c, b → c, c → d"], correct: [1] },
    },
    {
      key: "chain",
      rung: "apply",
      prompt: <p>A DAG on 6 vertices has edges 1 → 2 → 3 and 4 → 5, and vertex 6 has no edges. How many topological orders does it have?</p>,
      answer: { kind: "numeric", value: 60 },
    },
    {
      key: "maxedges",
      rung: "apply",
      prompt: <p>What is the largest number of edges a DAG on 7 vertices can have?</p>,
      answer: { kind: "numeric", value: 21 },
    },
    {
      key: "unique",
      rung: "apply",
      prompt: <p>A DAG on 5 vertices has exactly one topological order. What is the least number of edges it can have?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from graphlib import TopologicalSorter
deps = {"shoes": {"socks", "trousers"}, "jacket": {"shirt", "tie"}, "tie": {"shirt"}}
order = list(TopologicalSorter(deps).static_order())
print(order.index("shirt") < order.index("tie") < order.index("jacket"))`}</Code>
          <p>Python's graphlib orders tasks after their dependencies. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import graphlib
ts = graphlib.TopologicalSorter({"c": {"a", "b"}, "b": {"a"}, "d": {"c"}})
print(list(ts.static_order()))`}</Code>
          <p>Python&rsquo;s own topological sorter, given each node&rsquo;s prerequisites. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['a', 'b', 'c', 'd']", "['d', 'c', 'b', 'a']", "['a', 'c', 'b', 'd']", "['b', 'a', 'c', 'd']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>kahn(n, edges)</C>, which returns a topological order of vertices 0 to n − 1 for directed edges (u, v) meaning u before v, by repeatedly removing a vertex of in-degree 0 (use the smallest available, for a definite answer), or <C>None</C> if the graph has a cycle.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def kahn(n, edges):
    return list(range(n))
`,
        solution: `import heapq

def kahn(n, edges):
    indeg = [0] * n
    out = [[] for _ in range(n)]
    for u, v in edges:
        out[u].append(v)
        indeg[v] += 1
    ready = [v for v in range(n) if indeg[v] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        u = heapq.heappop(ready)
        order.append(u)
        for v in out[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(ready, v)
    return order if len(order) == n else None
`,
        tests: [
          { name: "order", code: `assert kahn(4, [(2, 0), (0, 1), (3, 1)]) == [2, 0, 3, 1], 'Always take the smallest vertex with nothing left pointing into it.'` },
          { name: "valid", code: `import random
random.seed(2)
E = [(u, v) for u in range(12) for v in range(u + 1, 12) if random.random() < 0.3]
perm = list(range(12)); random.shuffle(perm)
E2 = [(perm[u], perm[v]) for u, v in E]
o = kahn(12, E2)
assert o is not None and sorted(o) == list(range(12)) and all(o.index(u) < o.index(v) for u, v in E2), 'Every edge must point forward.'` },
          { name: "cycle", code: `assert kahn(3, [(0, 1), (1, 2), (2, 0)]) is None, 'A cycle has no topological order.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Scheduling with a DAG. Write <C>longest_path(n, edges)</C> for a directed graph on 0 … n − 1 with edges (u, v, w) and positive weights: the starter&rsquo;s <C>_order(n, pairs)</C> gives a topological order by Kahn&rsquo;s algorithm (raising <C>ValueError</C> on a cycle) and the adjacency lists; relax the edges in that order to get the heaviest path ending at each vertex (a path may start anywhere), and return (length, path) for the heaviest path overall. Then write <C>count_paths(n, edges, s, t)</C>, the number of directed paths from s to t, for edges given as pairs (u, v), by dynamic programming in topological order.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def _order(n, pairs):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in pairs:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) < n:
        raise ValueError('cycle')
    return order, adj

def longest_path(n, edges):
    return 0, []

def count_paths(n, edges, s, t):
    return 1
`,
        solution: `from collections import deque

def _order(n, pairs):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in pairs:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(v for v in range(n) if indeg[v] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    if len(order) < n:
        raise ValueError('cycle')
    return order, adj

def longest_path(n, edges):
    order, _ = _order(n, [(u, v) for u, v, w in edges])
    out = [[] for _ in range(n)]
    for u, v, w in edges:
        out[u].append((v, w))
    best, prev = [0] * n, [-1] * n
    for u in order:
        for v, w in out[u]:
            if best[u] + w > best[v]:
                best[v] = best[u] + w
                prev[v] = u
    end = max(range(n), key=lambda v: best[v])
    path = []
    v = end
    while v != -1:
        path.append(v)
        v = prev[v]
    return best[end], path[::-1]

def count_paths(n, edges, s, t):
    order, adj = _order(n, edges)
    ways = [0] * n
    ways[s] = 1
    for u in order:
        for v in adj[u]:
            ways[v] += ways[u]
    return ways[t]
`,
        tests: [
          { name: "project", code: `E = [(0, 1, 3), (0, 2, 2), (1, 3, 4), (2, 3, 6), (3, 4, 1)]
L, P = longest_path(5, E)
assert L == 9 and P == [0, 2, 3, 4], 'The critical path is 0 → 2 → 3 → 4, of length 2 + 6 + 1.'` },
          { name: "brute", code: `import random
random.seed(12)
for _ in range(30):
    n = 8
    E = [(u, v, random.randint(1, 9)) for u in range(n) for v in range(u + 1, n) if random.random() < 0.35]
    perm = list(range(n)); random.shuffle(perm)
    E = [(perm[u], perm[v], w) for u, v, w in E]
    W = {(u, v): w for u, v, w in E}
    def best_from(u):
        return max([w + best_from(v) for (a, v), w in W.items() if a == u], default=0)
    L, P = longest_path(n, E)
    assert L == max(best_from(u) for u in range(n)), 'Heaviest path by exhaustive search.'
    assert sum(W[(a, b)] for a, b in zip(P, P[1:])) == L, 'The returned path must have that weight.'` },
          { name: "count", code: `from math import comb
m = 6
idx = lambda i, j: i * (m + 1) + j
E = [(idx(i, j), idx(i + 1, j)) for i in range(m) for j in range(m + 1)] + [(idx(i, j), idx(i, j + 1)) for i in range(m + 1) for j in range(m)]
assert count_paths((m + 1) ** 2, E, 0, idx(m, m)) == comb(2 * m, m) and count_paths(3, [(0, 1)], 0, 2) == 0, 'Lattice paths in a grid: C(12, 6) = 924.'` },
          { name: "cycle", code: `for f in (lambda: longest_path(3, [(0, 1, 1), (1, 2, 1), (2, 0, 1)]), lambda: count_paths(2, [(0, 1), (1, 0)], 0, 1)):
    try:
        f()
        assert False, 'A cycle must raise ValueError.'
    except ValueError:
        pass` },
        ],
      },
    },
    {
      key: "sink",
      rung: "prove",
      prompt: (
        <p>
          Prove that every finite DAG with at least one vertex has a sink, and explain how ordering by repeatedly removing sinks
          gives a topological order when reversed.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Follows outgoing edges from any vertex; finiteness forces a repeat, which would give a directed cycle.",
          "Concludes some walk must stop, at a vertex with no outgoing edge.",
          "Explains that removing sinks one at a time and reversing the list puts every edge's tail before its head.",
        ],
      },
    },
    {
      key: "linear",
      rung: "stretch",
      prompt: <p>How many topological orders does the DAG on {"{1, 2, 3, 4}"} with edges 1 → 3, 1 → 4, 2 → 4 have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
  ],

  teachBack:
    "Explain to a friend what a topological order is, why it exists exactly when there is no directed cycle, and how a deep-learning framework uses one to run a forward and backward pass.",

  glimpse: (
    <p>
      Data Structures and Algorithms implements topological sort by Kahn&rsquo;s algorithm and by depth-first search. In Build
      a Deep Learning Framework you will record operations in a graph and backpropagate through it in reverse topological
      order.
    </p>
  ),
};
