import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GraphAlgoViz } from "@/components/viz/GraphAlgoViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.6.2",
  minutes: 50,
  links: {
    requires: ["e2.6.1", "m4.3.4"],
    revisits: ["e2.4.3"],
    foreshadows: ["e2.7.3", "e5.1.1"],
  },

  puzzle: (
    <>
      <p>
        A build tool has 4,000 files to compile, and each may import others. A data pipeline has fifty steps, some of which
        need the output of others. An autograd engine must run the backward pass of each operation only after everything that
        used its output. In every case the question is the same: in what order can you do the jobs so that nothing runs before
        what it depends on, and how do you notice when no such order exists?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Anything with no prerequisites left can go now. Do it, cross it off, and some other jobs may lose their last
        prerequisite and become ready. Repeat. If you run out of ready jobs while some remain, those jobs wait on each other in
        a circle. This is Kahn&rsquo;s algorithm, and all it needs is a count, for each job, of prerequisites not yet done.
      </p>
      <GraphAlgoViz algo="topo" />
    </>
  ),

  theory: (
    <>
      <Definition title="Kahn's algorithm">
        <p>
          For a directed graph given as adjacency lists (an edge u → v means u must come before v):
        </p>
        <Code>{`from collections import deque

def topo_sort(graph):
    indeg = {u: 0 for u in graph}
    for u in graph:
        for v in graph[u]:
            indeg[v] += 1
    ready = deque(u for u in graph if indeg[u] == 0)
    order = []
    while ready:
        u = ready.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                ready.append(v)
    if len(order) < len(graph):
        raise ValueError("cycle")
    return order`}</Code>
      </Definition>

      <Theorem title="correctness">
        <p>
          Kahn&rsquo;s algorithm runs in O(V + E). It outputs every vertex, in an order where every edge points forward, if and
          only if the graph is acyclic.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each vertex is appended to <C>ready</C> once, when its count reaches 0, and its edges are scanned once, so the time is
          O(V + E). An edge u → v keeps <C>indeg[v]</C> positive until u is output, so v is output after u: the order is
          valid. If the graph is acyclic, then whenever vertices remain, the subgraph of remaining vertices is acyclic and so
          has a vertex with no incoming edges from remaining vertices (M4); its count is 0, so it is ready, and the loop
          continues until all are out. If there is a cycle, no vertex on it can be output first, since each waits on its
          predecessor on the cycle; so the algorithm stops short, and the check reports the cycle.
        </p>
      </Proof>

      <Example title="the DFS way">
        <p>
          Run depth-first search and record each vertex when it finishes. Every edge u → v in a DAG has v finishing before u
          (v is either already finished, or explored and finished inside u&rsquo;s call), so <em>reversed</em> finishing order
          is topological. Both methods are O(V + E). Kahn&rsquo;s gives the cycle check and the &ldquo;ready set&rdquo; for
          free; DFS is the natural choice when you are already exploring from a target, as <C>make</C> does, and only the jobs
          the target needs are visited.
        </p>
      </Example>

      <Example title="dynamic programming on a DAG">
        <p>
          Processing vertices in topological order means every predecessor is handled first, so any quantity defined from
          predecessors can be filled in with one pass. With task durations, the earliest finish of a task is its duration plus
          the latest finish among its prerequisites; the maximum over all tasks is the length of the <strong>critical
          path</strong>, the least time the whole job can take with unlimited workers. Grouping by round (all tasks ready at
          once run together) gives the layers a parallel scheduler uses. Every dynamic programme, in chapter 7, is this
          computation on an implicit DAG of subproblems.
        </p>
      </Example>

      <Remark title="choosing among orders">
        <p>
          A DAG usually has many topological orders. Replacing the queue with a min-heap gives the lexicographically smallest
          one in O((V + E) log V), which is what you want for reproducible builds and tests. Python&rsquo;s{" "}
          <C>graphlib.TopologicalSorter</C> exposes the ready set directly, so a scheduler can hand out ready tasks to workers
          and mark them done as they finish. PyTorch&rsquo;s backward pass walks the computation graph in reverse topological
          order, so a gradient is complete before it is passed on.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>In Kahn&rsquo;s algorithm, when does a vertex become ready?</p>,
      answer: { kind: "choice", options: ["When all its prerequisites have been output", "When one of its prerequisites has been output", "When it is first discovered", "When it has no outgoing edges"], correct: [0] },
    },
    {
      key: "orders",
      rung: "apply",
      prompt: <p>The DAG has edges a → c, b → c, c → d and nothing else. How many topological orders does it have?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "dfsorder",
      rung: "apply",
      prompt: <p>DFS on a DAG finishes the vertices in the order d, e, b, c, a. Which list is a topological order?</p>,
      answer: { kind: "choice", options: ["a c b e d", "d e b c a", "a b c d e", "c a b e d"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque

def kahn(graph):
    indeg = {u: 0 for u in graph}
    for u in graph:
        for v in graph[u]:
            indeg[v] += 1
    q = deque(u for u in graph if indeg[u] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return "".join(order)

print(kahn({"s": ["a", "b"], "a": ["c"], "b": ["c", "d"], "c": ["e"], "d": ["e"], "e": []}),
      kahn({"p": ["q"], "q": ["r"], "r": ["q", "t"], "t": []}))`}</Code>
          <p>Kahn&rsquo;s algorithm, without the final cycle check. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["sabcde p", "sabdce p", "sabcde pqrt", "sabcde pq"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`time = {"fetch": 3, "clean": 2, "split": 1, "train": 5, "eval": 2, "report": 1}
deps = {"fetch": [], "clean": ["fetch"], "split": ["clean"], "train": ["split"],
        "eval": ["train", "split"], "report": ["eval", "clean"]}

finish = {}
def done_at(task):
    if task not in finish:
        finish[task] = max((done_at(d) for d in deps[task]), default=0) + time[task]
    return finish[task]

print(done_at("report"), finish["split"], len(finish))`}</Code>
          <p>Earliest finishing times in a pipeline, with unlimited workers. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["14 6 6", "15 6 6", "14 6 5", "14 3 6"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            A graph is a dict from each vertex to a list of the vertices that must come after it; a vertex may appear only as a
            target. Write <C>topo_sort(graph)</C>, returning any valid order of all vertices, and{" "}
            <C>smallest_order(graph)</C>, the lexicographically smallest valid order. Both raise <C>ValueError</C> if there is
            a cycle and must handle a chain of 100,000 vertices.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def topo_sort(graph):
    return list(graph)

def smallest_order(graph):
    return sorted(graph)
`,
        solution: `import heapq

def _indegrees(graph):
    indeg = {}
    for u, vs in graph.items():
        indeg.setdefault(u, 0)
        for v in vs:
            indeg[v] = indeg.get(v, 0) + 1
    return indeg

def topo_sort(graph):
    indeg = _indegrees(graph)
    ready = [u for u in indeg if indeg[u] == 0]
    order = []
    while ready:
        u = ready.pop()
        order.append(u)
        for v in graph.get(u, []):
            indeg[v] -= 1
            if indeg[v] == 0:
                ready.append(v)
    if len(order) < len(indeg):
        raise ValueError('graph has a cycle')
    return order

def smallest_order(graph):
    indeg = _indegrees(graph)
    heap = [u for u in indeg if indeg[u] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        u = heapq.heappop(heap)
        order.append(u)
        for v in graph.get(u, []):
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(heap, v)
    if len(order) < len(indeg):
        raise ValueError('graph has a cycle')
    return order
`,
        tests: [
          { name: "any order", code: `import random
def valid(graph, order):
    verts = set(graph) | {v for vs in graph.values() for v in vs}
    assert sorted(order, key=str) == sorted(verts, key=str), f'{order} must list every vertex once.'
    pos = {u: i for i, u in enumerate(order)}
    for u in graph:
        for v in graph[u]:
            assert pos[u] < pos[v], f'Edge {u} -> {v} goes backwards in {order}.'
g = {'shirt': ['tie', 'belt'], 'tie': ['jacket'], 'trousers': ['shoes', 'belt'], 'belt': ['jacket'], 'socks': ['shoes']}
valid(g, topo_sort(g))
assert topo_sort({}) == []
for bad in [{1: [2], 2: [3], 3: [1]}, {1: [1]}, {1: [2], 2: [3], 3: [2], 0: [1]}]:
    try:
        topo_sort(bad)
        assert False, f'{bad} has a cycle: raise ValueError.'
    except ValueError:
        pass
rng = random.Random(12)
for _ in range(200):
    n = rng.randint(1, 12)
    perm = rng.sample(range(n), n)
    g = {u: [] for u in range(n) if rng.random() < 0.8}
    for i in range(n):
        for j in range(i + 1, n):
            if rng.random() < 0.25:
                g.setdefault(perm[i], []).append(perm[j])
    valid(g, topo_sort(g))
n = 100000
chain = {i: [i + 1] for i in range(n)}
assert topo_sort(chain) == list(range(n + 1))` },
          { name: "smallest order", code: `import random, itertools
g = {'c': ['a'], 'b': ['a'], 'd': ['b']}
assert smallest_order(g) == ['c', 'd', 'b', 'a']
assert smallest_order({5: [], 3: [1], 1: [], 4: [2], 2: []}) == [3, 1, 4, 2, 5]
rng = random.Random(13)
for _ in range(150):
    n = rng.randint(1, 7)
    perm = rng.sample(range(n), n)
    g = {u: [] for u in range(n)}
    for i in range(n):
        for j in range(i + 1, n):
            if rng.random() < 0.3:
                g[perm[i]].append(perm[j])
    best = None
    for p in itertools.permutations(range(n)):
        pos = {u: i for i, u in enumerate(p)}
        if all(pos[u] < pos[v] for u in g for v in g[u]):
            best = list(p)
            break
    assert smallest_order(g) == best, (g, best)
try:
    smallest_order({'a': ['b'], 'b': ['a']})
    assert False, 'A cycle raises ValueError.'
except ValueError:
    pass` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two schedules from a DAG:</p>
          <ul>
            <li>
              <C>critical_path(time, deps)</C>: <C>time[t]</C> is a task&rsquo;s duration and <C>deps[t]</C> the tasks it
              needs first. Return <C>(T, path)</C>, the least total time with unlimited workers and a chain of tasks, from one
              with no dependencies, whose durations add to T. Raise <C>ValueError</C> on a cycle; no recursion.
            </li>
            <li>
              <C>rounds(graph)</C>: with edges as in <C>topo_sort</C>, the list of rounds when each round runs every task whose
              prerequisites are all done, each round sorted. Raise <C>ValueError</C> on a cycle.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def critical_path(time, deps):
    return sum(time.values()), list(time)

def rounds(graph):
    return [sorted(graph)]
`,
        solution: `def critical_path(time, deps):
    order, state = [], {}
    for start in time:
        if start in state:
            continue
        state[start] = 1
        stack = [(start, iter(deps[start]))]
        while stack:
            u, it = stack[-1]
            d = next(it, None)
            if d is None:
                state[u] = 2
                order.append(u)
                stack.pop()
            elif state.get(d) == 1:
                raise ValueError('dependencies form a cycle')
            elif d not in state:
                state[d] = 1
                stack.append((d, iter(deps[d])))
    finish, via = {}, {}
    for u in order:                       # every dependency comes earlier
        best = max(deps[u], key=lambda d: finish[d], default=None)
        via[u] = best
        finish[u] = (finish[best] if best is not None else 0) + time[u]
    if not finish:
        return 0, []
    end = max(finish, key=finish.get)
    path = []
    while end is not None:
        path.append(end)
        end = via[end]
    return max(finish.values()), path[::-1]

def rounds(graph):
    indeg = {}
    for u, vs in graph.items():
        indeg.setdefault(u, 0)
        for v in vs:
            indeg[v] = indeg.get(v, 0) + 1
    layer = sorted(u for u in indeg if indeg[u] == 0)
    out, seen = [], 0
    while layer:
        out.append(layer)
        seen += len(layer)
        nxt = []
        for u in layer:
            for v in graph.get(u, []):
                indeg[v] -= 1
                if indeg[v] == 0:
                    nxt.append(v)
        layer = sorted(nxt)
    if seen < len(indeg):
        raise ValueError('graph has a cycle')
    return out
`,
        tests: [
          { name: "critical path", code: `time = {'fetch': 3, 'clean': 2, 'split': 1, 'train': 5, 'eval': 2, 'report': 1}
deps = {'fetch': [], 'clean': ['fetch'], 'split': ['clean'], 'train': ['split'], 'eval': ['train', 'split'], 'report': ['eval', 'clean']}
assert critical_path(time, deps) == (14, ['fetch', 'clean', 'split', 'train', 'eval', 'report'])
t, p = critical_path({'a': 4, 'b': 2, 'c': 3}, {'a': [], 'b': [], 'c': ['b']})
assert (t, p) == (5, ['b', 'c']), 'Independent tasks run in parallel.'
assert critical_path({}, {}) == (0, [])
try:
    critical_path({'x': 1, 'y': 1}, {'x': ['y'], 'y': ['x']})
    assert False, 'A cycle raises ValueError.'
except ValueError:
    pass
import random
rng = random.Random(14)
for _ in range(200):
    n = rng.randint(1, 10)
    time = {i: rng.randint(1, 9) for i in range(n)}
    deps = {i: [j for j in range(i) if rng.random() < 0.3] for i in range(n)}
    best = {}
    for i in range(n):
        best[i] = max((best[j] for j in deps[i]), default=0) + time[i]
    T, path = critical_path(time, deps)
    assert T == max(best.values()), (time, deps)
    assert sum(time[u] for u in path) == T and all(a in deps[b] for a, b in zip(path, path[1:])) and deps[path[0]] == [], (time, deps, path)
n = 50000
T, path = critical_path({i: 1 for i in range(n)}, {i: [i - 1] if i else [] for i in range(n)})
assert T == n and len(path) == n, 'Avoid recursion: chains can be long.'` },
          { name: "rounds", code: `g = {'a': ['c'], 'b': ['c', 'd'], 'c': ['e'], 'd': ['e'], 'e': []}
assert rounds(g) == [['a', 'b'], ['c', 'd'], ['e']]
assert rounds({}) == [] and rounds({1: []}) == [[1]]
assert rounds({1: [2, 3], 2: [3]}) == [[1], [2], [3]], 'A task waits for all its prerequisites.'
try:
    rounds({1: [2], 2: [1], 3: []})
    assert False, 'A cycle raises ValueError.'
except ValueError:
    pass
import random
rng = random.Random(15)
for _ in range(200):
    n = rng.randint(1, 12)
    g = {i: [j for j in range(i + 1, n) if rng.random() < 0.25] for i in range(n)}
    level = {}
    for i in range(n):
        level.setdefault(i, 0)
        for j in g[i]:
            level[j] = max(level.get(j, 0), level[i] + 1)
    want = [sorted(u for u in level if level[u] == k) for k in range(max(level.values()) + 1)]
    assert rounds(g) == want, g` },
        ],
      },
    },
    {
      key: "dfsproof",
      rung: "prove",
      prompt: <p>Prove that in a DAG, reversed DFS finishing order is a topological order.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Takes an edge u → v and shows v finishes before u.",
          "Case v white when DFS scans the edge: v is explored inside u's call and finishes first.",
          "Case v black: v has already finished.",
          "Case v grey is impossible: v would be an ancestor of u, and the edge would close a cycle.",
        ],
      },
    },
    {
      key: "unique",
      rung: "stretch",
      prompt: <p>Show that a DAG has exactly one topological order if and only if it has a directed path through all its vertices, and give an O(V + E) test using Kahn&rsquo;s algorithm.</p>,
      answer: {
        kind: "written",
        rubric: [
          "If a Hamiltonian path v₁ → … → vₙ exists, every order must put vᵢ before vᵢ₊₁, so only one order is possible.",
          "If consecutive vertices in some topological order have no edge between them, swapping them gives a second valid order.",
          "So the order is unique exactly when each consecutive pair is joined by an edge, which is a path through all vertices.",
          "Test: run Kahn's algorithm and check the ready set never holds more than one vertex.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a build tool decides the order to compile files, and how it knows when the imports go round in a circle.",

  glimpse: (
    <p>
      The critical-path pass was dynamic programming on a DAG. Next, edges get lengths and the graph may have cycles: shortest
      paths need a heap, or, with negative lengths, patience.
    </p>
  ),
};
