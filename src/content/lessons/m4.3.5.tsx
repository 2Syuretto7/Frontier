import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.3.5",
  minutes: 55,
  links: {
    requires: ["m4.3.2"],
    foreshadows: ["m4.5.4", "e2.7.2"],
  },

  puzzle: (
    <>
      <p>
        A university must timetable 9 exams. Some pairs share a student and cannot be in the same slot. How few slots are
        needed? And can a compiler fit 20 variables into 8 processor registers, when variables in use at the same time need
        different registers?
      </p>
      <p>Both are the same question about a graph.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Make each exam a vertex and join two exams that clash. A timetable is a colouring: each vertex gets a colour (a slot),
        and adjacent vertices get different colours. Greedy colouring takes the vertices one by one and gives each the first
        colour its neighbours have not used. The order matters. Compare the two orders below.
      </p>
      <GraphLabViz mode="colour" />
    </>
  ),

  theory: (
    <>
      <Definition title="colouring and chromatic number">
        <p>
          A <strong>proper k-colouring</strong> of G assigns each vertex one of k colours so that adjacent vertices differ. The{" "}
          <strong>chromatic number</strong> <M>{"\\chi(G)"}</M> is the least k for which one exists.
        </p>
      </Definition>

      <Example title="some chromatic numbers">
        <p>
          <M>{"\\chi(K_n) = n"}</M>: all vertices are adjacent. A path or an even cycle has <M>{"\\chi = 2"}</M>; an odd
          cycle has <M>{"\\chi = 3"}</M>, because two colours must alternate round the cycle and an odd cycle cannot alternate.
          If G contains <M>{"K_r"}</M> then <M>{"\\chi(G) \\ge r"}</M>.
        </p>
      </Example>

      <Theorem title="bipartite graphs">
        <p>
          <M>{"\\chi(G) \\le 2"}</M> if and only if G is bipartite, if and only if G has no cycle of odd length.
        </p>
      </Theorem>
      <Proof>
        <p>
          A 2-colouring is exactly a split into two parts with all edges between them. An odd cycle cannot be 2-coloured. If
          there is no odd cycle, colour each component by the parity of the distance from a chosen vertex s. An edge uv with
          d(s, u) and d(s, v) of the same parity would close, with shortest paths from s, a closed walk of odd length, which
          contains an odd cycle.
        </p>
      </Proof>

      <Theorem title="the greedy bound">
        <p>
          If every vertex has degree at most Δ, then <M>{"\\chi(G) \\le \\Delta + 1"}</M>, and greedy colouring in any order
          achieves it.
        </p>
      </Theorem>
      <Proof>
        <p>
          When greedy colours a vertex, at most Δ of its neighbours already have colours, so among Δ + 1 colours one is free.
        </p>
      </Proof>

      <Example title="the order matters">
        <p>
          Some orders force greedy to use far more colours than needed. For any graph some order makes greedy optimal (colour the
          vertices of an optimal colouring class by class), but finding such an order is as hard as colouring itself. Taking
          vertices of large degree first is a sensible heuristic.
        </p>
      </Example>

      <Remark title="hard in general">
        <p>
          Deciding whether a graph is 2-colourable takes a breadth-first search. Deciding whether it is 3-colourable is
          NP-complete: no efficient algorithm is known. The four colour theorem, proved in 1976 with computer help, says every
          map drawn in the plane can be coloured with 4 colours so neighbouring countries differ.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cycle",
      rung: "check",
      prompt: <p>What is the chromatic number of the cycle <M>{"C_9"}</M>?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "kmn",
      rung: "check",
      prompt: <p>What is the chromatic number of the complete bipartite graph <M>{"K_{4,7}"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "wheel",
      rung: "apply",
      prompt: <p>The wheel <M>{"W_7"}</M> is a cycle on 7 vertices plus a hub joined to all of them. What is its chromatic number?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "exams",
      rung: "apply",
      prompt: <p>Five exams clash in every pair except (A, B) and (C, D). What is the fewest number of slots needed?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "count2",
      rung: "apply",
      prompt: <p>How many proper colourings of the path <M>{"P_5"}</M> (5 vertices in a line) use colours from a set of 3?</p>,
      answer: { kind: "numeric", value: 48 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`adj = {0: [1, 2], 1: [0, 2], 2: [0, 1, 3], 3: [2]}
colour = {}
for v in sorted(adj):
    used = {colour[u] for u in adj[v] if u in colour}
    colour[v] = min(c for c in range(len(adj)) if c not in used)
print(max(colour.values()) + 1)`}</Code>
          <p>Greedy colouring of a triangle with a tail. How many colours does it use?</p>
        </>
      ),
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>greedy_colour(adj, order)</C>, which colours the vertices in the given order with the smallest colour (0, 1, 2, …) not used by an already-coloured neighbour, and returns a dict, and <C>is_bipartite(adj)</C>, which 2-colours each component by breadth-first search and reports whether it succeeded.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def greedy_colour(adj, order):
    return {v: 0 for v in order}

def is_bipartite(adj):
    return True
`,
        solution: `from collections import deque

def greedy_colour(adj, order):
    colour = {}
    for v in order:
        used = {colour[u] for u in adj[v] if u in colour}
        c = 0
        while c in used:
            c += 1
        colour[v] = c
    return colour

def is_bipartite(adj):
    side = {}
    for s in adj:
        if s in side:
            continue
        side[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if v not in side:
                    side[v] = 1 - side[u]
                    q.append(v)
                elif side[v] == side[u]:
                    return False
    return True
`,
        tests: [
          { name: "proper", code: `adj = {0: [1, 2], 1: [0, 2], 2: [0, 1, 3], 3: [2]}
c = greedy_colour(adj, [0, 1, 2, 3])
assert all(c[u] != c[v] for u in adj for v in adj[u]) and max(c.values()) == 2, 'Adjacent vertices must differ; the triangle needs 3 colours.'` },
          { name: "bad order", code: `adj = {0: [3], 1: [2], 2: [1, 5], 3: [0, 4], 4: [3, 7], 5: [2, 6], 6: [5], 7: [4]}
c = greedy_colour(adj, list(range(8)))
assert all(c[u] != c[v] for u in adj for v in adj[u]), 'Colour in exactly the order given.'` },
          { name: "bipartite", code: `even = {i: [(i - 1) % 6, (i + 1) % 6] for i in range(6)}
odd = {i: [(i - 1) % 5, (i + 1) % 5] for i in range(5)}
assert is_bipartite(even) and not is_bipartite(odd), 'Even cycles are bipartite; odd cycles are not.'` },
        ],
      },
    },
    {
      key: "greedy",
      rung: "prove",
      prompt: <p>Prove that a graph with maximum degree Δ can be properly coloured with Δ + 1 colours.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Describes colouring the vertices one at a time in any order.",
          "Notes that when a vertex is coloured, at most Δ neighbours have colours, blocking at most Δ colours.",
          "Concludes one of the Δ + 1 colours is always free, so the colouring is proper.",
        ],
      },
    },
    {
      key: "cycle5",
      rung: "stretch",
      prompt: <p>How many proper colourings of the cycle <M>{"C_5"}</M> use colours from a set of 3?</p>,
      answer: { kind: "numeric", value: 30 },
    },
  ],

  teachBack:
    "Explain to a friend how exam timetabling becomes graph colouring, why odd cycles need three colours, and why greedy colouring never needs more than one more colour than the largest degree.",

  glimpse: (
    <p>
      The question of whether a graph can be 3-coloured is one of the classic NP-complete problems met at the end of this
      course. Greedy algorithms, of which greedy colouring is a simple and imperfect example, are studied in Data Structures
      and Algorithms.
    </p>
  ),
};
