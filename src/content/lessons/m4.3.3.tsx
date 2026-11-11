import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.3.3",
  minutes: 60,
  links: {
    requires: ["m4.3.2", "m1.5.2"],
    foreshadows: ["e2.4.1", "e2.6.4", "l1.4.3"],
  },

  puzzle: (
    <>
      <p>
        A telecom company must link 8 towns by cable so that every town can reach every other. Each cable costs money. What is
        the fewest cables that can do it, and what do all the cheapest networks have in common?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A network with no redundant cable has no cycle, because any cable on a cycle could be cut and the towns would still be
        connected. Connected with no cycles is a tree, and every tree on n vertices has exactly n − 1 edges. Click edges below
        to add or remove them, and see when the graph becomes a tree.
      </p>
      <GraphLabViz mode="tree" />
    </>
  ),

  theory: (
    <>
      <Definition title="tree and forest">
        <p>
          A <strong>tree</strong> is a connected graph with no cycles. A <strong>forest</strong> is a graph with no cycles; its
          components are trees. A <strong>leaf</strong> is a vertex of degree 1.
        </p>
      </Definition>

      <Theorem title="every tree with at least two vertices has a leaf">
        <p>In fact it has at least two.</p>
      </Theorem>
      <Proof>
        <p>
          Take a longest path <M>{"v_0, \\dots, v_k"}</M>. If <M>{"v_0"}</M> had a neighbour other than <M>{"v_1"}</M>, that
          neighbour is either on the path, which would close a cycle, or off it, which would give a longer path. So{" "}
          <M>{"v_0"}</M> is a leaf, and likewise <M>{"v_k"}</M>.
        </p>
      </Proof>

      <Theorem title="characterisations of trees">
        <p>For a graph G on n vertices, the following are equivalent:</p>
        <ol>
          <li>G is a tree;</li>
          <li>G is connected and has n − 1 edges;</li>
          <li>G has no cycles and has n − 1 edges;</li>
          <li>between any two vertices there is exactly one path.</li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          A tree has n − 1 edges, by induction on n: remove a leaf and its edge to get a tree on n − 1 vertices. More generally,
          adding an edge to a graph either joins two components (reducing their number by one) or lies inside a component and
          creates a cycle. Building any graph edge by edge from n isolated vertices, a forest has n − c edges where c is the
          number of components; this gives (1) ⇔ (2) ⇔ (3). For (4): two different paths between the same vertices would
          contain a cycle, and a cycle gives two paths between any two of its vertices.
        </p>
      </Proof>

      <Definition title="spanning tree">
        <p>
          A <strong>spanning tree</strong> of a connected graph G is a subgraph that is a tree and contains every vertex of G.
          Every connected graph has one: while there is a cycle, delete one of its edges, which keeps the graph connected. The
          edges that breadth-first search uses to discover new vertices also form a spanning tree.
        </p>
      </Definition>

      <Definition title="rooted trees">
        <p>
          Choosing a vertex as the <strong>root</strong> orients the tree: every other vertex has a unique{" "}
          <strong>parent</strong>, the next vertex on its path to the root. A <strong>binary tree</strong> gives each vertex at
          most two children. A binary tree of height h has at most <M>{"2^{h+1} - 1"}</M> vertices, so one holding n items has
          height at least <M>{"\\log_2(n+1) - 1"}</M>.
        </p>
      </Definition>

      <Example title="the cable network">
        <p>
          Any cheapest network linking 8 towns is a spanning tree with 7 cables. Which 7 depends on the costs; finding the
          cheapest is the minimum spanning tree problem, solved greedily in Data Structures and Algorithms.
        </p>
      </Example>

      <Remark title="Cayley's formula">
        <p>
          The number of different trees on the labelled vertices 1, …, n is <M>{"n^{n-2}"}</M>: 1, 1, 3, 16, 125 for n = 1 to 5.
          A neat proof encodes each tree as a sequence of n − 2 labels, its Prüfer code.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "edges",
      rung: "check",
      prompt: <p>A tree has 50 vertices. How many edges does it have?</p>,
      answer: { kind: "numeric", value: 49 },
    },
    {
      key: "forest",
      rung: "check",
      prompt: <p>A forest has 30 vertices and 24 edges. How many trees does it consist of?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "leaves",
      rung: "apply",
      prompt: <p>A tree has 3 vertices of degree 3, 2 of degree 2, and every other vertex is a leaf. How many leaves does it have?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "cayley",
      rung: "apply",
      prompt: <p>How many different trees are there on the labelled vertex set {"{1, 2, 3, 4, 5, 6}"}?</p>,
      answer: { kind: "numeric", value: 1296 },
    },
    {
      key: "height",
      rung: "apply",
      prompt: <p>What is the smallest possible height of a binary tree with 1000 vertices? (A single vertex has height 0.)</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`parent = {0: 0, 1: 1, 2: 2, 3: 3}
def find(x):
    while parent[x] != x:
        x = parent[x]
    return x
cycles = 0
for u, v in [(0, 1), (1, 2), (2, 0), (2, 3)]:
    if find(u) == find(v):
        cycles += 1
    else:
        parent[find(u)] = find(v)
print(cycles)`}</Code>
          <p>Adding edges one at a time and noticing when an edge joins two vertices already connected. How many such edges are there?</p>
        </>
      ),
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`parent = [-1, 0, 0, 1, 1, 2]
depth = [0] * 6
for v in range(1, 6):
    depth[v] = depth[parent[v]] + 1
leaves = [v for v in range(6) if v not in parent]
print(max(depth), leaves, len(parent) - 1)`}</Code>
          <p>A rooted tree stored as a parent array. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 [3, 4, 5] 5", "3 [3, 4, 5] 5", "2 [3, 4, 5] 6", "2 [2, 3, 4, 5] 5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>is_tree(n, edges)</C>, which decides whether the graph on vertices 0 to n − 1 is a tree, using the characterisation &ldquo;n − 1 edges and connected&rdquo;. Check connectivity with a search or a union-find.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def is_tree(n, edges):
    return len(edges) == n - 1
`,
        solution: `def is_tree(n, edges):
    if len(edges) != n - 1:
        return False
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for u, v in edges:
        ru, rv = find(u), find(v)
        if ru == rv:
            return False
        parent[ru] = rv
    return True
`,
        tests: [
          { name: "tree", code: `assert is_tree(5, [(0, 1), (1, 2), (1, 3), (3, 4)]) and is_tree(1, []), 'Connected with n − 1 edges.'` },
          { name: "not tree", code: `assert not is_tree(5, [(0, 1), (1, 2), (2, 0), (3, 4)]), 'Right number of edges, but a cycle and two components.'` },
          { name: "too many", code: `assert not is_tree(3, [(0, 1), (1, 2), (2, 0)]), 'A triangle has 3 edges, not 2.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Prüfer sequences prove Cayley&rsquo;s formula: there are nⁿ⁻² labelled trees on n vertices. Write <C>prufer_encode(n, edges)</C> for a tree on 0 … n − 1 (n ≥ 2): n − 2 times, remove the smallest-numbered leaf and record its neighbour. Then write <C>prufer_decode(seq)</C>, which rebuilds the tree on n = len(seq) + 2 vertices: repeatedly join the smallest leaf (a vertex not yet used whose remaining count in the sequence is 0) to the next entry, and finally join the last two vertices. Return the edges as a sorted list of pairs (u, v) with u &lt; v. Use a heap for the leaves.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def prufer_encode(n, edges):
    return []

def prufer_decode(seq):
    return []
`,
        solution: `import heapq

def prufer_encode(n, edges):
    adj = [set() for _ in range(n)]
    for u, v in edges:
        adj[u].add(v)
        adj[v].add(u)
    leaves = [v for v in range(n) if len(adj[v]) == 1]
    heapq.heapify(leaves)
    seq = []
    for _ in range(n - 2):
        leaf = heapq.heappop(leaves)
        (nb,) = adj[leaf]
        seq.append(nb)
        adj[nb].discard(leaf)
        adj[leaf].clear()
        if len(adj[nb]) == 1:
            heapq.heappush(leaves, nb)
    return seq

def prufer_decode(seq):
    n = len(seq) + 2
    deg = [1] * n
    for x in seq:
        deg[x] += 1
    leaves = [v for v in range(n) if deg[v] == 1]
    heapq.heapify(leaves)
    edges = []
    for x in seq:
        leaf = heapq.heappop(leaves)
        edges.append((min(leaf, x), max(leaf, x)))
        deg[x] -= 1
        if deg[x] == 1:
            heapq.heappush(leaves, x)
    u, v = heapq.heappop(leaves), heapq.heappop(leaves)
    edges.append((min(u, v), max(u, v)))
    return sorted(edges)
`,
        tests: [
          { name: "examples", code: `assert prufer_encode(5, [(0, 1), (0, 2), (0, 3), (0, 4)]) == [0, 0, 0] and prufer_encode(4, [(0, 1), (1, 2), (2, 3)]) == [1, 2] and prufer_encode(2, [(0, 1)]) == [], 'A star records its centre; a path its inner vertices.'` },
          { name: "decode", code: `assert prufer_decode([1, 2]) == [(0, 1), (1, 2), (2, 3)] and prufer_decode([]) == [(0, 1)] and prufer_decode([3, 3, 3]) == [(0, 3), (1, 3), (2, 3), (3, 4)]` },
          { name: "roundtrip", code: `import random
random.seed(11)
for _ in range(50):
    n = random.randint(2, 60)
    lab = list(range(n)); random.shuffle(lab)
    E = []
    for i in range(1, n):
        j = random.randrange(i)
        E.append((min(lab[i], lab[j]), max(lab[i], lab[j])))
    assert prufer_decode(prufer_encode(n, E)) == sorted(E), 'Decoding inverts encoding.'` },
          { name: "cayley", code: `from itertools import product
trees = {tuple(prufer_decode(list(s))) for s in product(range(5), repeat=3)}
def connected(E):
    seen, stack = {0}, [0]
    while stack:
        u = stack.pop()
        for a, b in E:
            for x, y in ((a, b), (b, a)):
                if x == u and y not in seen:
                    seen.add(y); stack.append(y)
    return len(seen) == 5
assert len(trees) == 125 and all(len(t) == 4 and connected(t) for t in trees), 'Cayley: 5³ = 125 distinct trees on 5 vertices.'` },
        ],
      },
    },
    {
      key: "count",
      rung: "prove",
      prompt: <p>Prove by induction that every tree on n ≥ 1 vertices has exactly n − 1 edges.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Base case: a single vertex has no edges.",
          "Uses the existence of a leaf in a tree with at least two vertices.",
          "Removes the leaf and its edge, notes what is left is still a tree (connected, acyclic), and applies the hypothesis.",
        ],
      },
    },
    {
      key: "spanning",
      rung: "stretch",
      prompt: <p>How many spanning trees does the cycle <M>{"C_7"}</M> have?</p>,
      answer: { kind: "numeric", value: 7 },
    },
  ],

  teachBack:
    "Explain to a friend why every tree on n vertices has n − 1 edges, and why a cheapest network connecting n towns must be a tree.",

  glimpse: (
    <p>
      Rooted trees are the shape of search trees, heaps and tries in Data Structures and Algorithms, and decision trees in
      Introduction to Machine Learning. Minimum spanning trees, the cheapest cable networks, are found there by greedy
      algorithms.
    </p>
  ),
};
