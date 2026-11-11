import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphAlgoViz } from "@/components/viz/GraphAlgoViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.6.1",
  minutes: 55,
  links: {
    requires: ["e2.2.3", "m4.3.2"],
    revisits: ["m4.3.1", "e2.4.1"],
    foreshadows: ["e2.6.2", "e2.6.3", "e2.7.4"],
  },

  puzzle: (
    <>
      <p>
        A web crawler, a maze solver, a garbage collector and the tool that works out which Python packages to install all do
        the same thing: start somewhere and follow links until there is nothing new. The loop is five lines. Change one word in
        it, from queue to stack, and the order of the walk changes completely, and with it what the walk can tell you. What does
        each order buy?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keep a <em>frontier</em> of vertices found but not yet explored, and a set of vertices already seen. Take one from the
        frontier, look at its neighbours, and add the unseen ones. If the frontier is a queue, you explore in rings around the
        start: everything one edge away, then two, then three. That is breadth-first search, and it finds shortest paths in
        edges. If the frontier is a stack, you plunge down one route until it ends, then back up to the last branch: depth-first
        search, which finds cycles and orders tasks. Step through both on the same graph and compare the highlighted trees.
      </p>
      <GraphAlgoViz algo="search" />
    </>
  ),

  theory: (
    <>
      <Definition title="adjacency lists">
        <p>
          Store a graph as a dict mapping each vertex to a list of its neighbours (its out-neighbours, if directed). It uses
          O(V + E) memory, and listing the neighbours of u costs O(deg u). A V × V adjacency matrix answers &ldquo;is there an
          edge u–v?&rdquo; in O(1) but costs V² memory, which suits only dense graphs.
        </p>
        <Code>{`graph = {"A": ["B", "D"], "B": ["A", "C", "D", "E"], "C": ["B", "E"], "D": ["A", "B"], "E": ["B", "C"]}`}</Code>
      </Definition>

      <Definition title="breadth-first search">
        <Code>{`from collections import deque

def bfs(graph, s):
    dist, parent = {s: 0}, {s: None}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if v not in dist:          # mark when first found
                dist[v] = dist[u] + 1
                parent[v] = u
                q.append(v)
    return dist, parent`}</Code>
        <p>
          Following <C>parent</C> back from any vertex gives a path to s. Mark vertices when they enter the queue, not when they
          leave it, or a vertex can be queued many times.
        </p>
      </Definition>

      <Theorem title="BFS runs in O(V + E) and finds distances">
        <p>
          Every vertex reachable from s is dequeued exactly once, every edge is examined at most twice (once from each end), and{" "}
          <C>dist[v]</C> is the fewest edges on any path from s to v.
        </p>
      </Theorem>
      <Proof>
        <p>
          A vertex enters the queue only when it is first marked, so at most once; each dequeued vertex scans its list once, so
          the total work is the sum of the degrees, 2E, plus V. For distances: the queue always holds vertices with distances d
          and possibly d + 1, in that order, so vertices leave in non-decreasing order of <C>dist</C>. If some v had a shorter
          path, take the first such v on it; its predecessor u on that path has the correct distance, smaller than v&rsquo;s, so
          u was dequeued before v was first marked, and scanning u would have set dist[v] = dist[u] + 1, a contradiction. (M4
          proved the layer version of this.)
        </p>
      </Proof>

      <Definition title="depth-first search">
        <Code>{`def dfs(graph, u, seen, pre, post):
    seen.add(u)
    pre.append(u)                  # discovery order
    for v in graph[u]:
        if v not in seen:
            dfs(graph, v, seen, pre, post)
    post.append(u)                 # finishing order`}</Code>
        <p>
          DFS also runs in O(V + E). Its power is the two orders. During the search, colour a vertex grey while it is on the
          recursion stack and black once finished. In a directed graph, an edge to a grey vertex is a <strong>back edge</strong>, and
          the graph has a cycle exactly when DFS finds one. Reversed finishing order is a topological order when there is
          no cycle, the subject of the next lesson.
        </p>
      </Definition>

      <Example title="deep graphs and the recursion limit">
        <p>
          Python&rsquo;s recursion stops at about 1000 frames, so recursive DFS crashes on a path of 100,000 vertices. Write it
          with an explicit stack instead. To keep the same discovery and finishing orders, push an iterator over each
          vertex&rsquo;s neighbours and advance it with <C>next(it, None)</C>; when it is exhausted the vertex is finished.
          Pushing all neighbours at once, as the visualisation does, gives a valid depth-first walk but not the same finishing
          times.
        </p>
      </Example>

      <Remark title="where they appear">
        <p>
          Breadth-first: shortest paths in unweighted graphs and grids, the &ldquo;degrees of separation&rdquo; in a social
          network, and crawling a site level by level. Starting with many sources in the queue at once gives every vertex&rsquo;s
          distance to the nearest source in one pass. Depth-first: connected components, cycle detection, mark-and-sweep garbage
          collection, solving puzzles by backtracking, and walking a neural network&rsquo;s computation graph for backpropagation.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cost",
      rung: "check",
      prompt: <p>What is the running time of BFS on a graph stored as adjacency lists, with V vertices and E edges?</p>,
      answer: { kind: "choice", options: ["O(V + E)", "O(V²)", "O(E log V)", "O(V E)"], correct: [0] },
    },
    {
      key: "frontier",
      rung: "check",
      prompt: <p>Which frontier turns the generic search into depth-first search?</p>,
      answer: { kind: "choice", options: ["A stack (last in, first out)", "A queue (first in, first out)", "A min-heap keyed by distance", "A set"], correct: [0] },
    },
    {
      key: "matrix",
      rung: "apply",
      prompt: <p>An undirected graph has 10⁶ vertices and 5 × 10⁶ edges. Its adjacency lists hold 2E = 10⁷ entries; an adjacency matrix holds V² entries. The matrix has 10ᵏ times as many entries. What is k?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque

grid = ["S.#.",
        "..#.",
        "#...",
        "..#T"]

def bfs(grid):
    rows, cols = len(grid), len(grid[0])
    dist = {(0, 0): 0}
    q = deque([(0, 0)])
    while q:
        r, c = q.popleft()
        for dr, dc in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in dist:
                dist[nr, nc] = dist[r, c] + 1
                q.append((nr, nc))
    return dist

d = bfs(grid)
print(d[3, 3], d[0, 3], len(d), max(d.values()))`}</Code>
          <p>Breadth-first search on a grid, where # is a wall. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["6 7 12 7", "6 3 12 7", "6 7 13 7", "5 7 12 6"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`g = {"a": ["b", "c"], "b": ["d"], "c": ["d", "e"], "d": [], "e": ["b"]}
pre, post = [], []

def dfs(u, seen=set()):
    seen.add(u)
    pre.append(u)
    for v in g[u]:
        if v not in seen:
            dfs(v)
    post.append(u)

dfs("a")
print("".join(pre), "".join(post), "".join(reversed(post)))`}</Code>
          <p>Recursive depth-first search on a directed graph, recording discovery and finishing orders. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["abdce dbeca acebd", "abcde dbeca acebd", "abdce debca acdbe", "abdce dbeca abdce"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Graphs are dicts from each vertex to a list of neighbours. Write <C>shortest_path(graph, s, t)</C>, a list of
            vertices from s to t with the fewest edges (or <C>None</C> if t is unreachable; <C>[s]</C> if s == t), and{" "}
            <C>components(graph)</C> for an undirected graph, the connected components as sorted lists, sorted. Both must work
            on paths of 100,000 vertices, so no recursion.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def shortest_path(graph, s, t):
    return [s, t]

def components(graph):
    return [sorted(graph)]
`,
        solution: `from collections import deque

def shortest_path(graph, s, t):
    parent = {s: None}
    q = deque([s])
    while q:
        u = q.popleft()
        if u == t:
            path = []
            while u is not None:
                path.append(u)
                u = parent[u]
            return path[::-1]
        for v in graph.get(u, []):
            if v not in parent:
                parent[v] = u
                q.append(v)
    return None

def components(graph):
    seen, comps = set(), []
    for s in graph:
        if s in seen:
            continue
        seen.add(s)
        stack, comp = [s], []
        while stack:
            u = stack.pop()
            comp.append(u)
            for v in graph[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
        comps.append(sorted(comp))
    return sorted(comps)
`,
        tests: [
          { name: "shortest path", code: `g = {1: [2, 3], 2: [4], 3: [4, 5], 4: [6], 5: [6], 6: [], 7: [1]}
assert shortest_path(g, 1, 6) in ([1, 2, 4, 6], [1, 3, 4, 6], [1, 3, 5, 6])
assert shortest_path(g, 1, 1) == [1] and shortest_path(g, 6, 1) is None and shortest_path(g, 1, 7) is None
import random
from collections import deque
rng = random.Random(9)
for _ in range(200):
    n = rng.randint(1, 12)
    g = {u: [v for v in range(n) if v != u and rng.random() < 0.2] for u in range(n)}
    s, t = rng.randrange(n), rng.randrange(n)
    dist = {s: 0}
    q = deque([s])
    while q:
        u = q.popleft()
        for v in g[u]:
            if v not in dist:
                dist[v] = dist[u] + 1
                q.append(v)
    p = shortest_path(g, s, t)
    if t not in dist:
        assert p is None, (g, s, t)
    else:
        assert p[0] == s and p[-1] == t and len(p) == dist[t] + 1, (g, s, t, p)
        assert all(b in g[a] for a, b in zip(p, p[1:])), 'Each step must follow an edge.'
n = 100000
line = {i: [i + 1] for i in range(n)}
line[n] = []
assert len(shortest_path(line, 0, n)) == n + 1, 'Use a loop and a deque, not recursion.'` },
          { name: "components", code: `g = {'a': ['b'], 'b': ['a', 'c'], 'c': ['b'], 'd': [], 'e': ['f'], 'f': ['e']}
assert components(g) == [['a', 'b', 'c'], ['d'], ['e', 'f']]
assert components({}) == []
import random
rng = random.Random(10)
for _ in range(200):
    n = rng.randint(1, 15)
    g = {u: [] for u in range(n)}
    for _ in range(rng.randint(0, n)):
        u, v = rng.randrange(n), rng.randrange(n)
        g[u].append(v); g[v].append(u)
    label = list(range(n))
    def find(x):
        while label[x] != x:
            x = label[x]
        return x
    for u in g:
        for v in g[u]:
            label[find(u)] = find(v)
    groups = {}
    for u in range(n):
        groups.setdefault(find(u), []).append(u)
    assert components(g) == sorted(sorted(c) for c in groups.values()), g
n = 100000
line = {i: [j for j in (i - 1, i + 1) if 0 <= j < n] for i in range(n)}
assert components(line) == [list(range(n))], 'Use an explicit stack, not recursion.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two searches that need the right order:</p>
          <ul>
            <li>
              <C>find_cycle(graph)</C> for a directed graph: a list <C>[v₀, v₁, &hellip;, v₀]</C> following edges round some
              cycle, or <C>None</C> if there is none. Use grey and black colours with an explicit stack of iterators, so that a
              cycle 100,000 vertices long is found.
            </li>
            <li>
              <C>nearest_exit(grid)</C>: grid is a list of strings with <C>&apos;E&apos;</C> for exits, <C>&apos;#&apos;</C> for
              walls and <C>&apos;.&apos;</C> for floor; return a matching list of lists giving each cell&rsquo;s distance in
              up-down-left-right steps to the nearest exit, and −1 for walls and cells that cannot reach one. Put every exit in
              the queue at the start.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def find_cycle(graph):
    return None

def nearest_exit(grid):
    return [[0] * len(row) for row in grid]
`,
        solution: `from collections import deque

def find_cycle(graph):
    WHITE, GREY, BLACK = 0, 1, 2
    colour = {u: WHITE for u in graph}
    for s in graph:
        if colour[s] != WHITE:
            continue
        colour[s] = GREY
        path = [s]
        stack = [iter(graph[s])]
        while stack:
            v = next(stack[-1], None)
            if v is None:
                colour[path.pop()] = BLACK
                stack.pop()
            elif colour[v] == GREY:
                return path[path.index(v):] + [v]
            elif colour[v] == WHITE:
                colour[v] = GREY
                path.append(v)
                stack.append(iter(graph[v]))
    return None

def nearest_exit(grid):
    rows, cols = len(grid), len(grid[0])
    dist = [[-1] * cols for _ in range(rows)]
    q = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 'E':
                dist[r][c] = 0
                q.append((r, c))
    while q:
        r, c = q.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#' and dist[nr][nc] < 0:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist
`,
        tests: [
          { name: "cycles", code: `def check(g, cyc):
    assert cyc is not None, 'There is a cycle, but find_cycle returned None.'
    assert cyc[0] == cyc[-1] and len(cyc) >= 2, cyc
    assert all(b in g[a] for a, b in zip(cyc, cyc[1:])), f'{cyc} does not follow edges.'
assert find_cycle({1: [2], 2: [3], 3: []}) is None
g = {1: [2], 2: [3], 3: [1], 4: [1]}
check(g, find_cycle(g))
g = {'x': ['x']}
assert find_cycle(g) == ['x', 'x']
assert find_cycle({'a': ['b', 'c'], 'b': ['d'], 'c': ['d'], 'd': []}) is None, 'Two paths to the same vertex are not a cycle.'
import random
rng = random.Random(11)
for _ in range(300):
    n = rng.randint(1, 9)
    g = {u: [v for v in range(n) if rng.random() < 0.18] for u in range(n)}
    indeg = {u: 0 for u in g}
    for u in g:
        for v in g[u]:
            indeg[v] += 1
    ready = [u for u in g if indeg[u] == 0]
    out = 0
    while ready:
        u = ready.pop(); out += 1
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                ready.append(v)
    cyc = find_cycle(g)
    if out == n:
        assert cyc is None, g
    else:
        assert cyc is not None, g
        check(g, cyc)
n = 100000
deep = {i: [i + 1] for i in range(n)}
deep[n] = [0]
check(deep, find_cycle(deep))` },
          { name: "nearest exit", code: `grid = ["E..#",
        ".#..",
        "...E",
        "#.##"]
assert nearest_exit(grid) == [[0, 1, 2, -1],
                              [1, -1, 2, 1],
                              [2, 2, 1, 0],
                              [-1, 3, -1, -1]]
assert nearest_exit(["..", ".."]) == [[-1, -1], [-1, -1]]
assert nearest_exit(["E.#.."]) == [[0, 1, -1, -1, -1]]
big = ["E" + "." * 299] + ["." * 300 for _ in range(298)] + ["." * 299 + "E"]
d = nearest_exit(big)
assert d[0][299] == 299 and d[150][150] == 298 and d[299][0] == 299, 'Start from every exit at once.'` },
        ],
      },
    },
    {
      key: "backedge",
      rung: "prove",
      prompt: <p>Prove that a directed graph has a cycle if and only if depth-first search (run from every unvisited vertex) finds an edge to a grey vertex.</p>,
      answer: {
        kind: "written",
        rubric: [
          "If DFS finds an edge u → v with v grey, v is an ancestor of u on the recursion stack, so the stack path from v to u plus that edge is a cycle.",
          "Conversely, given a cycle, let v be the first vertex on it that DFS discovers, and u its predecessor on the cycle.",
          "At v's discovery the rest of the cycle is white and reachable from v along white vertices, so u is discovered and finished while v is still grey (the white-path argument).",
          "So when DFS scans the edge u → v, v is grey: a back edge is found.",
        ],
      },
    },
    {
      key: "bipartite",
      rung: "stretch",
      prompt: <p>Show how to test whether an undirected graph is bipartite (its vertices split into two sides with every edge crossing) in O(V + E), and prove your test correct.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Runs BFS from each uncoloured vertex, colouring each vertex by the parity of its distance.",
          "Reports not bipartite exactly when some edge joins two vertices of the same colour; the time is O(V + E).",
          "If no edge is monochromatic, the colours are a valid split.",
          "If edge u–v has equal parity, the two BFS-tree paths to their common ancestor plus u–v form an odd cycle, and a graph with an odd cycle cannot be bipartite.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how changing a queue into a stack turns breadth-first search into depth-first search, and what each one is good for.",

  glimpse: (
    <p>
      Reversed DFS finishing order sorts tasks so that every prerequisite comes first; the next lesson makes that precise, and
      then replaces the queue with a heap to find shortest paths when edges have lengths.
    </p>
  ),
};
