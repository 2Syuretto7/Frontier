import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphAlgoViz } from "@/components/viz/GraphAlgoViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.6.3",
  minutes: 60,
  links: {
    requires: ["e2.6.1", "e2.4.3"],
    revisits: ["e2.6.2", "m4.3.2"],
    foreshadows: ["e2.6.4", "e2.7.3", "e2.7.4"],
  },

  puzzle: (
    <>
      <p>
        A maps app finds the fastest route across a road network with millions of junctions in a fraction of a second. A packet
        crosses the internet along routes that routers work out among themselves. A currency trader looks for a loop of
        exchanges that ends with more money than it started with. All three are shortest-path problems. Breadth-first search
        counted edges; what changes when edges have lengths, and what breaks when some lengths are negative?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Grow the set of vertices whose distance you are sure of, nearest first. The nearest unsettled vertex cannot be reached
        more cheaply by a detour through anything farther away, as long as no edge is negative. So repeatedly take the
        unsettled vertex with the smallest tentative distance, declare it final, and try every edge out of it to improve its
        neighbours. A heap gives the smallest quickly. This is Dijkstra&rsquo;s algorithm: breadth-first search with a
        priority queue in place of a queue.
      </p>
      <GraphAlgoViz algo="dijkstra" />
    </>
  ),

  theory: (
    <>
      <Definition title="relaxation">
        <p>
          Keep a tentative distance d[v] for each vertex, ∞ at first and 0 at the source. <strong>Relaxing</strong> an edge u →
          v of weight w means: if d[u] + w &lt; d[v], set d[v] = d[u] + w and record u as v&rsquo;s parent. Every
          shortest-path algorithm here is a schedule of relaxations; d[v] is always the length of some real path, so it never
          drops below the true distance.
        </p>
      </Definition>

      <Definition title="Dijkstra with lazy deletion">
        <Code>{`import heapq

def dijkstra(graph, s):
    dist, done = {s: 0}, set()
    heap = [(0, s)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in done:
            continue                    # a stale entry: u was settled earlier
        done.add(u)
        for v, w in graph[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist`}</Code>
        <p>
          Python&rsquo;s heap has no decrease-key, so instead of updating v&rsquo;s entry, push a new one and skip old ones when
          they surface. The heap holds at most E entries, so the time is <M>{"O(E \\log E) = O(E \\log V)"}</M>.
        </p>
      </Definition>

      <Theorem title="Dijkstra is correct for non-negative weights">
        <p>When a vertex u is settled (popped for the first time), dist[u] is the length of a shortest path from s.</p>
      </Theorem>
      <Proof>
        <p>
          Suppose not, and let u be the first vertex settled with dist[u] larger than its true distance δ(u). Take a shortest
          path from s to u, and let y be the first vertex on it not yet settled, with x its settled predecessor. When x was
          settled, dist[x] = δ(x) and the edge x → y was relaxed, so dist[y] ≤ δ(x) + w(x, y) = δ(y). Since weights are
          non-negative, δ(y) ≤ δ(u) &lt; dist[u]. So y has an entry in the heap smaller than u&rsquo;s, and would be popped
          first, a contradiction. With a negative edge the step δ(y) ≤ δ(u) fails, and Dijkstra can settle a vertex too early.
        </p>
      </Proof>

      <Example title="Bellman–Ford">
        <p>
          With negative weights, relax every edge, V − 1 times over. After round k, d[v] is at most the length of the shortest
          path with at most k edges; a shortest path without a cycle has at most V − 1 edges, so V − 1 rounds suffice, in
          O(V E) time. If a round V would still improve something, some reachable cycle has negative total weight, and
          &ldquo;shortest path&rdquo; has no meaning, since going round again is always cheaper. Routers running the distance
          vector protocol do exactly these relaxations, each using only its neighbours&rsquo; tables.
        </p>
      </Example>

      <Example title="arbitrage">
        <p>
          With exchange rates r(i, j), a loop of trades multiplies money by the product of the rates. Taking{" "}
          <M>{"w(i,j) = -\\log r(i,j)"}</M> turns products into sums, and a profitable loop, product greater than 1, into a
          cycle of negative weight. Bellman–Ford from a virtual source joined to every currency at cost 0 finds one if it
          exists.
        </p>
      </Example>

      <Remark title="faster in practice">
        <p>
          Maps apps do not run plain Dijkstra over a continent. A* adds a lower bound on the remaining distance, such as the
          straight-line distance, to each heap key, so the search heads towards the target; precomputed shortcuts (contraction
          hierarchies) cut the work further. With weights 0 and 1 only, a deque replaces the heap (push 0-edges at the front),
          giving O(V + E). For all pairs in a dense graph, Floyd–Warshall&rsquo;s triple loop takes O(V³).
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "negative",
      rung: "check",
      prompt: <p>Why can Dijkstra&rsquo;s algorithm give a wrong answer when some edge weights are negative?</p>,
      answer: {
        kind: "choice",
        options: ["A settled vertex might later be reached more cheaply through a negative edge", "The heap cannot store negative keys", "It would loop for ever", "Negative weights make the graph disconnected"],
        correct: [0],
      },
    },
    {
      key: "rounds",
      rung: "apply",
      prompt: <p>Bellman–Ford runs on a graph with 50 vertices and 400 edges. At most how many relaxations does it attempt in its V − 1 rounds?</p>,
      answer: { kind: "numeric", value: 19600 },
    },
    {
      key: "zeroone",
      rung: "apply",
      prompt: <p>All edges have weight 7. Which algorithm finds shortest paths in O(V + E)?</p>,
      answer: { kind: "choice", options: ["Breadth-first search, multiplying edge counts by 7", "Bellman–Ford", "Dijkstra with a heap", "Depth-first search"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

graph = {"A": [("B", 4), ("C", 1)], "B": [("D", 1)], "C": [("B", 2), ("D", 6)], "D": []}

def dijkstra(s):
    dist = {s: 0}
    heap, pops, stale = [(0, s)], 0, 0
    while heap:
        d, u = heapq.heappop(heap)
        pops += 1
        if d > dist[u]:
            stale += 1
            continue
        for v, w in graph[u]:
            if d + w < dist.get(v, float("inf")):
                dist[v] = d + w
                heapq.heappush(heap, (d + w, v))
    return dist, pops, stale

dist, pops, stale = dijkstra("A")
print(dist["B"], dist["D"], pops, stale)`}</Code>
          <p>Dijkstra with lazy deletion, counting heap pops and stale entries. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 4 6 2", "4 5 4 0", "3 4 4 0", "3 5 6 2"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`edges = [(0, 1, 5), (0, 2, 2), (2, 1, -4), (1, 3, 1), (3, 2, 3)]
INF = float("inf")
dist = [0, INF, INF, INF]
for rnd in range(3):
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w
print(dist, any(dist[u] + w < dist[v] for u, v, w in edges))`}</Code>
          <p>Three rounds of Bellman–Ford from vertex 0, then one more check. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0, -2, 2, -1] False", "[0, 5, 2, 6] False", "[0, -2, 2, -1] True", "[0, -2, -1, -1] False"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A graph is a dict from each vertex to a list of <C>(neighbour, weight)</C> pairs. Write{" "}
            <C>dijkstra(graph, s)</C> returning <C>(dist, parent)</C>, dicts over the vertices reachable from s, with{" "}
            <C>parent[s] = None</C>; raise <C>ValueError</C> if any weight is negative. Then write{" "}
            <C>path_to(parent, t)</C>, the path from s to t as a list, or <C>None</C> if t was not reached. A 150 × 150 grid
            must take well under ten seconds.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def dijkstra(graph, s):
    dist, parent = {s: 0}, {s: None}
    for v, w in graph.get(s, []):
        dist[v], parent[v] = w, s
    return dist, parent

def path_to(parent, t):
    return [t]
`,
        solution: `import heapq

def dijkstra(graph, s):
    for u in graph:
        for v, w in graph[u]:
            if w < 0:
                raise ValueError('negative edge weight')
    dist, parent = {s: 0}, {s: None}
    done = set()
    heap = [(0, s)]
    while heap:
        d, u = heapq.heappop(heap)
        if u in done:
            continue
        done.add(u)
        for v, w in graph.get(u, []):
            nd = d + w
            if v not in dist or nd < dist[v]:
                dist[v], parent[v] = nd, u
                heapq.heappush(heap, (nd, v))
    return dist, parent

def path_to(parent, t):
    if t not in parent:
        return None
    path = []
    while t is not None:
        path.append(t)
        t = parent[t]
    return path[::-1]
`,
        tests: [
          { name: "distances and paths", code: `g = {'A': [('B', 4), ('C', 1)], 'B': [('D', 1)], 'C': [('B', 2), ('D', 6)], 'D': [], 'E': [('A', 1)]}
dist, parent = dijkstra(g, 'A')
assert dist == {'A': 0, 'B': 3, 'C': 1, 'D': 4}, dist
assert path_to(parent, 'D') == ['A', 'C', 'B', 'D'] and path_to(parent, 'A') == ['A'] and path_to(parent, 'E') is None
try:
    dijkstra({'a': [('b', -1)], 'b': []}, 'a')
    assert False, 'Negative weights raise ValueError.'
except ValueError:
    pass
import random, itertools
rng = random.Random(16)
for _ in range(150):
    n = rng.randint(1, 8)
    g = {u: [(v, rng.randint(0, 9)) for v in range(n) if v != u and rng.random() < 0.35] for u in range(n)}
    INF = float('inf')
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u in g:
        for v, w in g[u]:
            d[u][v] = min(d[u][v], w)
    for k, i, j in itertools.product(range(n), repeat=3):
        d[i][j] = min(d[i][j], d[i][k] + d[k][j])
    dist, parent = dijkstra(g, 0)
    assert dist == {v: d[0][v] for v in range(n) if d[0][v] < INF}, g
    for t in dist:
        p = path_to(parent, t)
        cost = sum(min(w for x, w in g[a] if x == b) for a, b in zip(p, p[1:]))
        assert p[0] == 0 and p[-1] == t and cost == dist[t], (g, t, p)` },
          { name: "large grid", code: `import random, time
rng = random.Random(17)
N = 150
g = {}
for r in range(N):
    for c in range(N):
        g[r, c] = [((r + dr, c + dc), rng.randint(1, 9)) for dr, dc in ((0, 1), (1, 0), (0, -1), (-1, 0)) if 0 <= r + dr < N and 0 <= c + dc < N]
start = time.perf_counter()
dist, parent = dijkstra(g, (0, 0))
spent = time.perf_counter() - start
assert len(dist) == N * N
p = path_to(parent, (N - 1, N - 1))
assert p[0] == (0, 0) and len(p) >= 2 * N - 1
total = sum(next(w for v, w in g[a] if v == b) for a, b in zip(p, p[1:]))
assert total == dist[N - 1, N - 1]
assert spent < 10, f'{spent:.1f} s for 22,500 vertices: use a heap.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Negative weights:</p>
          <ul>
            <li>
              <C>bellman_ford(n, edges, s)</C>: vertices are 0 to n − 1 and edges a list of <C>(u, v, w)</C>. Return the list of
              distances from s, <C>float(&apos;inf&apos;)</C> where unreachable, or raise <C>ValueError</C> if a negative cycle
              is reachable from s. Stop early when a round changes nothing.
            </li>
            <li>
              <C>arbitrage(rates)</C>: <C>rates[i][j]</C> units of currency j for one unit of i (0 if no market). Return
              whether some loop of trades ends with more than it started, using −log of the rates, Bellman–Ford, and a small
              tolerance for rounding.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def bellman_ford(n, edges, s):
    dist = [float('inf')] * n
    dist[s] = 0
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            dist[v] = dist[u] + w
    return dist

def arbitrage(rates):
    return False
`,
        solution: `import math

def bellman_ford(n, edges, s):
    INF = float('inf')
    dist = [INF] * n
    dist[s] = 0
    for _ in range(n - 1):
        changed = False
        for u, v, w in edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    for u, v, w in edges:
        if dist[u] + w < dist[v]:
            raise ValueError('negative cycle reachable from the source')
    return dist

def arbitrage(rates):
    n = len(rates)
    edges = [(i, j, -math.log(rates[i][j])) for i in range(n) for j in range(n) if i != j and rates[i][j] > 0]
    dist = [0.0] * n                       # as if a source joined every vertex at cost 0
    for _ in range(n - 1):
        for u, v, w in edges:
            if dist[u] + w < dist[v] - 1e-12:
                dist[v] = dist[u] + w
    return any(dist[u] + w < dist[v] - 1e-9 for u, v, w in edges)
`,
        tests: [
          { name: "Bellman-Ford", code: `INF = float('inf')
assert bellman_ford(4, [(0, 1, 5), (0, 2, 2), (2, 1, -4), (1, 3, 1), (3, 2, 3)], 0) == [0, -2, 2, -1]
assert bellman_ford(3, [(1, 2, 1)], 0) == [0, INF, INF]
assert bellman_ford(5, [(3, 4, 1), (2, 3, 1), (1, 2, 1), (0, 1, 1)], 0) == [0, 1, 2, 3, 4], 'Edges in the worst order need n - 1 rounds.'
for edges in [[(0, 1, 1), (1, 2, -3), (2, 1, 1)], [(0, 0, -1)]]:
    try:
        bellman_ford(3, edges, 0)
        assert False, f'{edges} has a negative cycle: raise ValueError.'
    except ValueError:
        pass
assert bellman_ford(3, [(1, 2, -3), (2, 1, 1)], 0) == [0, INF, INF], 'A negative cycle the source cannot reach does not matter.'
import random, itertools
rng = random.Random(18)
for _ in range(200):
    n = rng.randint(1, 7)
    edges = [(u, v, rng.randint(-3, 9)) for u in range(n) for v in range(n) if u != v and rng.random() < 0.3]
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k, i, j in itertools.product(range(n), repeat=3):
        d[i][j] = min(d[i][j], d[i][k] + d[k][j])
    bad = any(d[0][k] < INF and d[k][k] < 0 for k in range(n))
    try:
        got = bellman_ford(n, edges, 0)
        assert not bad, edges
        assert got == d[0], (edges, got, d[0])
    except ValueError:
        assert bad, f'No negative cycle is reachable in {edges}.'` },
          { name: "arbitrage", code: `assert not arbitrage([[1, 0.5], [2, 1]]), "Swapping and swapping back at fair rates gains nothing."
assert arbitrage([[1, 0.9, 0], [0, 1, 1.2], [0.95, 0, 1]]), '0.9 * 1.2 * 0.95 > 1 is a profitable loop.'
assert not arbitrage([[1, 0.9, 0], [0, 1, 1.1], [1.0, 0, 1]]), '0.9 * 1.1 * 1.0 < 1 loses money.'
assert not arbitrage([[1]])
import math, random, itertools
rng = random.Random(19)
for _ in range(150):
    n = rng.randint(2, 5)
    value = [rng.uniform(0.5, 2) for _ in range(n)]
    rates = [[value[i] / value[j] * (1 if i == j else rng.uniform(0.9, 1.0)) for j in range(n)] for i in range(n)]
    assert not arbitrage(rates), 'Fair prices minus fees never give a profit.'
    i, j = rng.sample(range(n), 2)
    rates[i][j] = value[i] / value[j] * 1.5
    rates[j][i] = value[j] / value[i]
    assert arbitrage(rates), 'Trading i -> j -> i gains 50%.'` },
        ],
      },
    },
    {
      key: "bfproof",
      rung: "prove",
      prompt: <p>Prove that if no negative cycle is reachable from s, then after k rounds of Bellman–Ford, d[v] is at most the length of the shortest path from s to v that uses at most k edges; conclude that V − 1 rounds suffice.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Inducts on k, with base case k = 0: d[s] = 0 and the only 0-edge path is from s to s.",
          "For a shortest path to v with at most k edges ending in u → v, after round k − 1 d[u] is at most the length of its first part, and round k relaxes u → v.",
          "Uses that d[v] only decreases and is always the length of some real walk.",
          "With no reachable negative cycle a shortest path can be taken simple, so it has at most V − 1 edges, and V − 1 rounds give exact distances.",
        ],
      },
    },
    {
      key: "reweight",
      rung: "stretch",
      prompt: <p>A friend suggests handling negative weights by adding a constant c to every edge so that all are non-negative, then running Dijkstra. Show by example that this fails, and explain what kind of adjustment does preserve shortest paths.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Gives a concrete graph where a path with more edges is shortest but loses after each edge gains c (for example s→a→t of weights 1, −2 against s→t of weight 0).",
          "Explains that adding c changes a path of k edges by kc, so it favours paths with fewer edges.",
          "Describes reweighting w'(u, v) = w(u, v) + h(u) − h(v) for a potential h.",
          "Shows every s–t path changes by the same h(s) − h(t), so shortest paths are preserved, and notes h from Bellman–Ford makes all w' ≥ 0 (Johnson's algorithm).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why Dijkstra's algorithm can declare the nearest unsettled place final, and why a negative road length would ruin that.",

  glimpse: (
    <p>
      Shortest paths connect one source to everything. Next, the cheapest set of edges connecting everything to everything,
      where a greedy choice is provably right.
    </p>
  ),
};
