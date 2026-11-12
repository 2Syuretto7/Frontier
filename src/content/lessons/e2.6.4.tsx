import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphAlgoViz } from "@/components/viz/GraphAlgoViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.6.4",
  minutes: 55,
  links: {
    requires: ["e2.6.3", "m4.3.3"],
    revisits: ["e2.4.3", "e2.5.1"],
    foreshadows: ["e2.7.2"],
  },

  puzzle: (
    <>
      <p>
        You must lay cable so that ten villages are all connected, directly or through others, and you know the cost of each
        possible link. Building the cheapest link first, then the next cheapest that does not close a loop, and so on, sounds
        too naive to be optimal. It is optimal. Why does greed work here, when it fails for so many other problems, and how do
        you check &ldquo;does this close a loop?&rdquo; in almost constant time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cut the villages into any two groups. Some link must cross the cut, and the cheapest crossing link is always safe to
        build: if a network avoided it, you could swap it in for whichever link crossed the cut and pay less or the same.
        Kruskal&rsquo;s algorithm takes edges in order of weight and keeps each one that joins two different groups. Keeping
        track of the groups is the job of the union-find structure: each group is a tree of parent pointers, and two vertices
        are in the same group when they lead to the same root.
      </p>
      <GraphAlgoViz algo="mst" />
    </>
  ),

  theory: (
    <>
      <Definition title="minimum spanning tree">
        <p>
          For a connected undirected graph with edge weights, a <strong>spanning tree</strong> is a set of V − 1 edges that
          connects every vertex without a cycle (M4). A <strong>minimum spanning tree</strong> (MST) is one of least total
          weight. If the graph is not connected, the same algorithms give a minimum spanning forest.
        </p>
      </Definition>

      <Theorem title="the cut property">
        <p>
          Let S be a set of vertices with S and its complement both non-empty, and let e be an edge of least weight with one end
          in S and one outside. Then some MST contains e. If e is the unique lightest crossing edge, every MST contains it.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take an MST T. If e is in T we are done. Otherwise adding e to T creates exactly one cycle. That cycle crosses the cut
          once along e, so it must cross back along some other edge f, also crossing the cut. Then T − f + e is a spanning tree,
          and its weight is w(T) − w(f) + w(e) ≤ w(T), since e is a lightest crossing edge. So it is also an MST, and contains
          e. If e is strictly lightest, the inequality is strict, so T was not minimum, and every MST must contain e.
        </p>
      </Proof>

      <Definition title="union-find">
        <Code>{`parent = list(range(n))
size = [1] * n

def find(x):                       # the root of x's group
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(a, b):                   # False if already one group
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra                # hang the smaller tree under the larger
    size[ra] += size[rb]
    return True`}</Code>
        <p>
          Union by size alone keeps every tree of height O(log n), since a vertex&rsquo;s group at least doubles each time it
          moves down a level. With path compression as well, any m operations take{" "}
          <M>{"O(m\\,\\alpha(n))"}</M>, where α is the inverse Ackermann function, at most 4 for any n that fits in the
          universe.
        </p>
      </Definition>

      <Example title="Kruskal and Prim">
        <p>
          <strong>Kruskal</strong>: sort the edges and take each that joins two groups, O(E log E) for the sort plus almost
          linear union-find. Each edge taken is lightest across the cut between its endpoint&rsquo;s group and the rest, so the
          cut property makes it safe. <strong>Prim</strong>: grow one tree from a start vertex, always adding the lightest edge
          leaving it, found with a heap and lazy deletion exactly as in Dijkstra, but keyed by the edge weight rather than the
          path length; O(E log V). Prim suits dense graphs given as adjacency lists; Kruskal suits edge lists.
        </p>
      </Example>

      <Remark title="clustering">
        <p>
          Stopping Kruskal when k groups remain gives <strong>single-linkage clustering</strong>: the k clusters maximise the
          smallest distance between points in different clusters. It is the same as building the MST and deleting its k − 1
          heaviest edges, and it is the dendrogram of hierarchical clustering. It follows chains of close points, which can be a
          strength (long thin clusters) or a weakness (one noisy bridge merges two clusters). Union-find also tracks connected
          components as edges arrive, for example when deduplicating near-identical documents found by MinHash.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "edges",
      rung: "check",
      prompt: <p>A connected graph has 40 vertices and 300 edges. How many edges does a minimum spanning tree have?</p>,
      answer: { kind: "numeric", value: 39 },
    },
    {
      key: "skip",
      rung: "check",
      prompt: <p>When does Kruskal&rsquo;s algorithm skip an edge?</p>,
      answer: { kind: "choice", options: ["When both ends are already in the same group", "When it is heavier than the previous edge", "When one end already has an edge", "When it is the heaviest edge on a cycle somewhere"], correct: [0] },
    },
    {
      key: "height",
      rung: "apply",
      prompt: <p>With union by size and no path compression, what is the greatest possible height (edges from a vertex to its root) of a group of 1024 vertices?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`parent = list(range(8))
size = [1] * 8

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    size[ra] += size[rb]
    return True

results = [union(0, 1), union(2, 3), union(1, 3), union(0, 2), union(5, 6), union(6, 4)]
print(results, find(3), size[find(4)], len({find(x) for x in range(8)}))`}</Code>
          <p>Union by size with path halving. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[True, True, True, False, True, True] 0 3 3", "[True, True, True, False, True, True] 2 3 3", "[True, True, True, False, True, True] 0 3 4", "[True, True, True, True, True, True] 0 3 3"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`edges = [(4, "A", "B"), (1, "B", "C"), (3, "A", "C"), (2, "C", "D"),
         (5, "B", "D"), (7, "D", "E"), (6, "C", "E")]
group = {v: v for v in "ABCDE"}

def find(v):
    while group[v] != v:
        v = group[v]
    return v

tree = []
for w, u, v in sorted(edges):
    if find(u) != find(v):
        group[find(u)] = find(v)
        tree.append(u + v)
print(tree, sum(w for w, u, v in edges if u + v in tree), tree[:-1])`}</Code>
          <p>Kruskal with a simple union-find. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['BC', 'CD', 'AC', 'CE'] 12 ['BC', 'CD', 'AC']", "['BC', 'CD', 'AC', 'DE'] 13 ['BC', 'CD', 'AC']", "['BC', 'CD', 'AC', 'AB', 'CE'] 16 ['BC', 'CD', 'AC', 'AB']", "['BC', 'CD', 'AC', 'CE'] 12 ['CD', 'AC', 'CE']"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>DSU(n)</C> over 0 to n − 1 with <C>find(x)</C>, <C>union(a, b)</C> returning whether two groups
            were merged, <C>size(x)</C> for the size of x&rsquo;s group, and an attribute <C>count</C> of groups. Use union by
            size and path compression, with no recursion. Then write <C>kruskal(n, edges)</C> for edges{" "}
            <C>(u, v, w)</C>, returning <C>(total, chosen)</C>, or raising <C>ValueError</C> if the graph is not connected.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.count = n

    def find(self, x):
        return self.parent[x]

    def union(self, a, b):
        self.parent[b] = a
        return True

    def size(self, x):
        return 1

def kruskal(n, edges):
    chosen = sorted(edges, key=lambda e: e[2])[:n - 1]
    return sum(w for u, v, w in chosen), chosen
`,
        solution: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.sz = [1] * n
        self.count = n

    def find(self, x):
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:            # path compression
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.sz[ra] < self.sz[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.sz[ra] += self.sz[rb]
        self.count -= 1
        return True

    def size(self, x):
        return self.sz[self.find(x)]

def kruskal(n, edges):
    dsu, total, chosen = DSU(n), 0, []
    for u, v, w in sorted(edges, key=lambda e: e[2]):
        if dsu.union(u, v):
            total += w
            chosen.append((u, v, w))
    if dsu.count > 1:
        raise ValueError('graph is not connected')
    return total, chosen
`,
        tests: [
          { name: "union-find", code: `d = DSU(6)
assert d.union(0, 1) and d.union(2, 3) and d.union(1, 3)
assert not d.union(0, 2), 'Already joined: return False.'
assert d.find(0) == d.find(3) and d.find(4) != d.find(0)
assert d.size(2) == 4 and d.size(5) == 1 and d.count == 3
import random
rng = random.Random(20)
for _ in range(100):
    n = rng.randint(1, 30)
    d = DSU(n)
    label = list(range(n))
    for _ in range(40):
        a, b = rng.randrange(n), rng.randrange(n)
        same = label[a] == label[b]
        assert d.union(a, b) == (not same)
        if not same:
            old = label[b]
            label = [label[a] if x == old else x for x in label]
        x, y = rng.randrange(n), rng.randrange(n)
        assert (d.find(x) == d.find(y)) == (label[x] == label[y])
        assert d.size(x) == label.count(label[x]) and d.count == len(set(label))
n = 200000
d = DSU(n)
for i in range(1, n):
    d.union(i, i - 1) if i % 2 else d.union(i - 1, i)
assert d.size(0) == n and d.count == 1
for i in range(n):
    d.find(i)` },
          { name: "Kruskal", code: `edges = [(0, 1, 4), (1, 2, 1), (0, 2, 3), (2, 3, 2), (1, 3, 5), (3, 4, 7), (2, 4, 6)]
total, chosen = kruskal(5, edges)
assert total == 12 and sorted(chosen) == [(0, 2, 3), (1, 2, 1), (2, 3, 2), (2, 4, 6)], (total, chosen)
assert kruskal(1, []) == (0, [])
try:
    kruskal(3, [(0, 1, 1)])
    assert False, 'Vertex 2 cannot be reached: raise ValueError.'
except ValueError:
    pass
import random, itertools
rng = random.Random(21)
for _ in range(60):
    n = rng.randint(2, 6)
    edges = [(u, v, rng.randint(1, 9)) for u in range(n) for v in range(u + 1, n) if rng.random() < 0.7]
    best = None
    for sub in itertools.combinations(edges, n - 1):
        lab = list(range(n))
        def f(x):
            while lab[x] != x:
                x = lab[x]
            return x
        ok = True
        for u, v, w in sub:
            if f(u) == f(v):
                ok = False
                break
            lab[f(u)] = f(v)
        if ok:
            c = sum(w for _, _, w in sub)
            best = c if best is None else min(best, c)
    if best is None:
        try:
            kruskal(n, edges)
            assert False, edges
        except ValueError:
            pass
    else:
        total, chosen = kruskal(n, edges)
        assert total == best and len(chosen) == n - 1 and sum(w for *_, w in chosen) == total, (edges, total, best)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two more uses:</p>
          <ul>
            <li>
              <C>prim(graph)</C>: graph is an undirected dict from each vertex to <C>(neighbour, weight)</C> pairs, listed from
              both ends. Return the MST weight using a heap, 0 for an empty graph, and raise <C>ValueError</C> if it is not
              connected.
            </li>
            <li>
              <C>single_linkage(points, k)</C>: points are <C>(x, y)</C> pairs. Merge the closest pairs, Kruskal-style, until k
              clusters remain, (1 ≤ k ≤ the number of points), and return them as sorted lists of indices, sorted. The
              starter&rsquo;s <C>find(parent, x)</C> is the union–find lookup.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def find(parent, x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def prim(graph):
    return sum(min(w for _, w in nbrs) for nbrs in graph.values() if nbrs)

def single_linkage(points, k):
    return [[i] for i in range(len(points))]
`,
        solution: `import heapq

def find(parent, x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]
        x = parent[x]
    return x

def prim(graph):
    seen, total = set(), 0
    heap = [(0, next(iter(graph)))] if graph else []
    while heap:
        w, v = heapq.heappop(heap)
        if v in seen:
            continue
        seen.add(v)
        total += w
        for x, wx in graph[v]:
            if x not in seen:
                heapq.heappush(heap, (wx, x))
    if len(seen) < len(graph):
        raise ValueError('graph is not connected')
    return total

def single_linkage(points, k):
    n = len(points)
    parent = list(range(n))
    pairs = sorted(((points[i][0] - points[j][0]) ** 2 + (points[i][1] - points[j][1]) ** 2, i, j)
                   for i in range(n) for j in range(i + 1, n))
    groups = n
    for _, i, j in pairs:
        if groups == k:
            break
        ri, rj = find(parent, i), find(parent, j)
        if ri != rj:
            parent[ri] = rj
            groups -= 1
    clusters = {}
    for i in range(n):
        clusters.setdefault(find(parent, i), []).append(i)
    return sorted(clusters.values())
`,
        tests: [
          { name: "Prim", code: `g = {'A': [('B', 4), ('C', 3)], 'B': [('A', 4), ('C', 1), ('D', 5)], 'C': [('A', 3), ('B', 1), ('D', 2), ('E', 6)],
     'D': [('B', 5), ('C', 2), ('E', 7)], 'E': [('C', 6), ('D', 7)]}
assert prim(g) == 12
assert prim({}) == 0 and prim({'x': []}) == 0
try:
    prim({'a': [('b', 1)], 'b': [('a', 1)], 'c': []})
    assert False, 'Disconnected: raise ValueError.'
except ValueError:
    pass
import random
rng = random.Random(22)
for _ in range(200):
    n = rng.randint(2, 9)
    g = {u: [] for u in range(n)}
    es = []
    for u in range(n):
        for v in range(u + 1, n):
            if rng.random() < 0.5:
                w = rng.randint(1, 20)
                g[u].append((v, w)); g[v].append((u, w)); es.append((w, u, v))
    lab = list(range(n))
    def f(x):
        while lab[x] != x:
            x = lab[x]
        return x
    total, used = 0, 0
    for w, u, v in sorted(es):
        if f(u) != f(v):
            lab[f(u)] = f(v); total += w; used += 1
    if used == n - 1:
        assert prim(g) == total, g
    else:
        try:
            prim(g)
            assert False, g
        except ValueError:
            pass` },
          { name: "single linkage", code: `pts = [(0, 0), (0, 1), (1, 0), (10, 10), (10, 11), (30, 0)]
assert single_linkage(pts, 3) == [[0, 1, 2], [3, 4], [5]]
assert single_linkage(pts, 2) == [[0, 1, 2, 3, 4], [5]]
assert single_linkage(pts, 6) == [[0], [1], [2], [3], [4], [5]] and single_linkage(pts, 1) == [[0, 1, 2, 3, 4, 5]]
chain = [(i, 0) for i in range(5)] + [(10, 0)]
assert single_linkage(chain, 2) == [[0, 1, 2, 3, 4], [5]], 'Single linkage follows chains of close points.'` },
        ],
      },
    },
    {
      key: "cycle",
      rung: "prove",
      prompt: <p>Prove the cycle property: if e is the unique heaviest edge on some cycle, then no minimum spanning tree contains e.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes an MST T contains e and removes it, splitting T into two parts and defining a cut.",
          "Notes that the rest of the cycle joins e's endpoints, so some other cycle edge f crosses that cut.",
          "T − e + f is a spanning tree.",
          "Its weight is w(T) − w(e) + w(f) < w(T), since e is the unique heaviest edge on the cycle, contradicting minimality.",
        ],
      },
    },
    {
      key: "unique",
      rung: "stretch",
      prompt: <p>Prove that if all edge weights are distinct, the minimum spanning tree is unique, and show by example that with repeated weights it need not be.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Supposes two different MSTs T₁ and T₂ and takes the lightest edge e in exactly one of them, say T₁.",
          "Adds e to T₂, creating a cycle that contains some edge f not in T₁.",
          "Argues w(f) > w(e) using distinct weights and the choice of e, so T₂ + e − f is lighter than T₂, a contradiction.",
          "Gives an example such as a triangle with all three weights equal, which has three MSTs.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why building the cheapest link that does not close a loop always gives the cheapest network, and how union-find spots a loop.",

  glimpse: (
    <p>
      Chapter 6 is done. Kruskal was a greedy algorithm that happens to be right; chapter 7 asks when greed works in general,
      and what to do when it does not.
    </p>
  ),
};
