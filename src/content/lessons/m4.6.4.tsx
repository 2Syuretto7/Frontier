import { M } from "@/components/Math";
import { Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { GraphLabViz } from "@/components/viz/GraphLabViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m4.6.4",
  minutes: 60,
  links: {
    requires: ["m4.6.3", "m4.1.4", "m4.3.1"],
    foreshadows: ["m15.1.1", "m16.1.1"],
  },

  puzzle: (
    <>
      <p>
        Split the vertices of any graph into two teams. Can you always arrange that at least half the edges go between the
        teams? There are <M>{"2^n"}</M> splits, far too many to check for a large graph, and no obvious construction.
      </p>
      <p>Toss a coin for each vertex. That is the whole proof.</p>
    </>
  ),

  intuition: (
    <>
      <p>
        If the average of a quantity over all choices is m, some choice achieves at least m. So to show that a good object
        exists, choose one at random and compute the expected quality. Below, each toss puts the vertices on two sides; the cut
        edges are red. Their number varies, but its average is exactly half the edges.
      </p>
      <GraphLabViz mode="cut" />
    </>
  ),

  theory: (
    <>
      <Theorem title="the averaging principle">
        <p>
          If X is a random variable on a finite sample space, there is an outcome ω with <M>{"X(\\omega) \\ge E[X]"}</M>, and
          one with <M>{"X(\\omega) \\le E[X]"}</M>. If <M>{"P(A) > 0"}</M> then A has an outcome.
        </p>
      </Theorem>
      <Proof>
        <p>
          If every value were below E[X], the weighted average <M>{"\\sum X(\\omega)p(\\omega)"}</M> would be below E[X] too.
          The second statement is the definition of probability as a sum over outcomes.
        </p>
      </Proof>

      <Theorem title="large cuts exist">
        <p>Every graph with m edges has a split of its vertices into two parts with at least m/2 edges between them.</p>
      </Theorem>
      <Proof>
        <p>
          Put each vertex in part 1 or 2 by independent fair coin tosses. An edge uv is cut when u and v land in different
          parts, which has probability ½. By linearity, the expected number of cut edges is m/2, so some split cuts at least
          m/2.
        </p>
      </Proof>

      <Theorem title="satisfying clauses">
        <p>
          A formula in conjunctive normal form with m clauses, each containing k distinct variables, has an assignment satisfying
          at least <M>{"(1 - 2^{-k})m"}</M> clauses. If <M>{"m < 2^k"}</M>, it has an assignment satisfying all of them.
        </p>
      </Theorem>
      <Proof>
        <p>
          Set each variable true or false by a fair coin. A clause fails only if all k of its literals are false, which has
          probability <M>{"2^{-k}"}</M>. The expected number of satisfied clauses is <M>{"(1 - 2^{-k})m"}</M>. If{" "}
          <M>{"m < 2^k"}</M>, the expected number of failing clauses is <M>{"m 2^{-k} < 1"}</M>, so some assignment has fewer
          than one failing clause, that is, none.
        </p>
      </Proof>

      <Theorem title="a lower bound for Ramsey numbers (Erdős, 1947)">
        <p>
          If <M>{"\\binom{n}{k}2^{1-\\binom{k}{2}} < 1"}</M>, the edges of <M>{"K_n"}</M> can be coloured red and blue with no
          single-coloured <M>{"K_k"}</M>. In particular this holds for <M>{"n = \\lfloor 2^{k/2} \\rfloor"}</M> when k ≥ 3.
        </p>
      </Theorem>
      <Proof>
        <p>
          Colour each edge by a fair coin. A given set of k vertices is single-coloured with probability{" "}
          <M>{"2 \\cdot 2^{-\\binom{k}{2}}"}</M>. By the union bound, the probability that some k-set is single-coloured is at
          most <M>{"\\binom{n}{k}2^{1-\\binom{k}{2}} < 1"}</M>, so with positive probability none is, and such a colouring
          exists.
        </p>
      </Proof>

      <Remark title="existence without construction">
        <p>
          Erdős&rsquo;s bound shows good colourings of <M>{"K_n"}</M> with n exponential in k exist, yet nobody knows how to
          write one down explicitly for large k. Often, though, the random choice is itself the algorithm: for large cuts, a
          random split is good on average, and repeating it, or making the choices one at a time so as never to lower the
          expectation, finds one quickly.
        </p>
      </Remark>

      <Example title="in machine learning">
        <p>
          The same reasoning appears in random projections (a random linear map nearly preserves all pairwise distances), in
          random features, and in proofs that some network with given properties exists. High-Dimensional Probability and
          Statistical Learning Theory use it constantly.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cut",
      rung: "check",
      prompt: <p>A graph has 37 edges. What is the smallest number of edges that some cut is guaranteed to have, by the random-split argument?</p>,
      answer: { kind: "numeric", value: 19 },
    },
    {
      key: "clause",
      rung: "check",
      prompt: <p>Each clause has 3 distinct variables. What fraction of clauses does a random assignment satisfy on average?</p>,
      answer: { kind: "numeric", value: 0.875 },
    },
    {
      key: "allsat",
      rung: "apply",
      prompt: <p>What is the largest number m of clauses, each with 4 distinct variables, for which the argument guarantees that all can be satisfied at once?</p>,
      answer: { kind: "numeric", value: 15 },
    },
    {
      key: "complete",
      rung: "apply",
      prompt: <p>The complete graph <M>{"K_{10}"}</M> has 45 edges. What is the largest cut it actually has?</p>,
      answer: { kind: "numeric", value: 25 },
    },
    {
      key: "ramsey",
      rung: "apply",
      prompt: <p>Compute <M>{"\\binom{n}{k}2^{1-\\binom{k}{2}}"}</M> for k = 6 and n = 10, to four decimal places. Is it below 1?</p>,
      answer: { kind: "numeric", value: 0.0128, tolerance: 0.0001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import random
random.seed(1)
edges = [(0, 1), (1, 2), (0, 3), (1, 3), (1, 4), (2, 4), (3, 4), (4, 5), (2, 5), (6, 7)]
best = 0
for _ in range(200):
    side = [random.random() < 0.5 for _ in range(8)]
    best = max(best, sum(side[u] != side[v] for u, v in edges))
print(best >= len(edges) / 2)`}</Code>
          <p>The best of 200 random splits of the lesson's graph. Does it cut at least half the edges?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True", "False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product
edges = [(0, 1), (1, 2), (2, 0), (2, 3)]
cuts = [sum(s[u] != s[v] for u, v in edges) for s in product((0, 1), repeat=4)]
print(sum(cuts) / len(cuts), max(cuts), len(edges) / 2)`}</Code>
          <p>Average and best cut over all 2-colourings of a triangle with a tail. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 3 2.0", "2.0 4 2.0", "1.5 3 2.0", "2.0 3 1.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Turn the existence proof into an algorithm. Write <C>greedy_cut(n, edges)</C>, which places vertices 0, 1, …, n − 1 one at a time on side 0 or 1, each time choosing the side that cuts more edges to already-placed neighbours (ties to side 0). Return the list of sides. The result always cuts at least half the edges.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def greedy_cut(n, edges):
    return [0] * n
`,
        solution: `def greedy_cut(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
        adj[v].append(u)
    side = [None] * n
    for v in range(n):
        placed = [side[u] for u in adj[v] if side[u] is not None]
        cut0 = sum(1 for s in placed if s == 1)
        cut1 = sum(1 for s in placed if s == 0)
        side[v] = 0 if cut0 >= cut1 else 1
    return side
`,
        tests: [
          { name: "half", code: `import random
random.seed(7)
for _ in range(50):
    n = random.randint(2, 15)
    E = [(u, v) for u in range(n) for v in range(u + 1, n) if random.random() < 0.4]
    s = greedy_cut(n, E)
    assert len(s) == n and 2 * sum(s[u] != s[v] for u, v in E) >= len(E), 'Each vertex cuts at least half of its edges to placed neighbours.'` },
          { name: "bipartite", code: `E = [(i, (i + 1) % 8) for i in range(8)]
s = greedy_cut(8, E)
assert sum(s[u] != s[v] for u, v in E) >= 7, 'On an even cycle greedy cuts almost every edge.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Erdős showed that if C(n, k)·2^(1 − C(k, 2)) &lt; 1, some red/blue colouring of the edges of Kₙ has no single-coloured Kₖ. Colourings are dicts mapping each pair (i, j) with i &lt; j to 0 or 1. Write <C>has_mono_clique(n, colour, k)</C>, whether some k vertices have all their edges the same colour. Then write <C>find_ramsey_free(n, k, tries, seed)</C>, which draws up to <C>tries</C> uniformly random colourings with <C>random.Random(seed)</C> and returns the first with no single-coloured Kₖ, or <C>None</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def has_mono_clique(n, colour, k):
    return False

def find_ramsey_free(n, k, tries, seed):
    return None
`,
        solution: `from itertools import combinations
import random

def has_mono_clique(n, colour, k):
    for S in combinations(range(n), k):
        if len({colour[e] for e in combinations(S, 2)}) == 1:
            return True
    return False

def find_ramsey_free(n, k, tries, seed):
    rng = random.Random(seed)
    pairs = list(combinations(range(n), 2))
    for _ in range(tries):
        c = {e: rng.randint(0, 1) for e in pairs}
        if not has_mono_clique(n, c, k):
            return c
    return None
`,
        tests: [
          { name: "check", code: `from itertools import combinations
red = {e: 0 for e in combinations(range(4), 2)}
pent = {(i, j): int((j - i) % 5 in (1, 4)) for i, j in combinations(range(5), 2)}
assert has_mono_clique(4, red, 3) and not has_mono_clique(5, pent, 3), 'The pentagon and its complement contain no triangle.'` },
          { name: "find", code: `from itertools import combinations
c = find_ramsey_free(5, 3, 3000, 0)
assert c is not None and set(c) == set(combinations(range(5), 2)), 'R(3, 3) > 5: a good colouring of K₅ exists.'
assert all(len({c[e] for e in combinations(S, 2)}) == 2 for S in combinations(range(5), 3)), 'Every triangle must use both colours.'` },
          { name: "r33", code: `assert find_ramsey_free(6, 3, 300, 1) is None, 'R(3, 3) = 6: every colouring of K₆ has a one-colour triangle.'` },
          { name: "bound", code: `from itertools import combinations
c = find_ramsey_free(6, 4, 50, 2)
assert c is not None and not any(len({c[e] for e in combinations(S, 2)}) == 1 for S in combinations(range(6), 4)), 'C(6, 4)·2⁻⁵ = 15/32 < 1, so random colourings usually work.'` },
        ],
      },
    },
    {
      key: "average",
      rung: "prove",
      prompt: <p>Prove that every graph with m edges has a bipartite subgraph with at least m/2 edges.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Splits the vertices by independent fair coins and keeps only the edges between the two parts, which form a bipartite subgraph.",
          "Computes the probability ½ that each edge is kept and uses linearity to get expected m/2 kept edges.",
          "Applies the averaging principle: some split keeps at least m/2 edges.",
        ],
      },
    },
    {
      key: "tournament",
      rung: "stretch",
      prompt: <p>In a round-robin tournament on n players, each game&rsquo;s winner is decided by a fair coin. What is the expected number of orderings of all n players in which each player beat the next one, for n = 5?</p>,
      answer: { kind: "numeric", value: 7.5 },
    },
  ],

  teachBack:
    "Explain to a friend how choosing at random can prove that a good object exists, using the fact that every graph has a cut containing at least half its edges.",

  glimpse: (
    <p>
      This completes Discrete Mathematics. High-Dimensional Probability and Statistics and Statistical Learning Theory use the
      probabilistic method and the union bound throughout, for random projections and for bounding how far a model&rsquo;s
      test error can drift from its training error.
    </p>
  ),
};
