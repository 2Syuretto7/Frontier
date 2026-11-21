import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MarkovEquivViz } from "@/components/viz/MarkovEquivViz";
import type { LessonContent } from "@/lib/types";

const GRAPH = `def topo_order(parents):
    order, done = [], set()
    while len(order) < len(parents):
        for v in sorted(parents):
            if v not in done and all(p in done for p in parents[v]):
                order.append(v); done.add(v); break
        else:
            raise ValueError("cycle")
    return order                                               # causes before effects

def descendants(parents, v):
    out, grew = {v}, True
    while grew:
        grew = False
        for w, ps in parents.items():
            if w not in out and out & set(ps):
                out.add(w); grew = True
    return out

def local_markov(parents):
    return [(v, sorted(set(parents) - descendants(parents, v) - set(parents[v])), sorted(parents[v]))
            for v in topo_order(parents)]                      # v independent of the first list given the second`;

const EQUIV = `def skeleton(parents):
    return {frozenset((p, v)) for v, ps in parents.items() for p in ps}

def v_structures(parents):
    sk = skeleton(parents)
    return {(a, v, b) for v, ps in parents.items() for a in ps for b in ps
            if a < b and frozenset((a, b)) not in sk}          # a -> v <- b with a, b not adjacent

def markov_equivalent(g, h):
    return skeleton(g) == skeleton(h) and v_structures(g) == v_structures(h)`;

export const lesson: LessonContent = {
  id: "m22.1.1",
  minutes: 50,
  links: {
    requires: ["l2.7.1", "m7.1.5"],
    revisits: ["m9.8.5", "m7.5.2"],
    foreshadows: ["m22.1.2", "m22.4.1"],
  },

  puzzle: (
    <>
      <p>
        In a medical imaging dataset, a classifier learns that scans from one hospital&apos;s machine are more often positive. The
        correlation is real, and it predicts well on held-out data from the same hospitals. But sending a patient to a different
        scanner will not change whether they are ill. Which arrows connect the variables, how much of that picture can the data
        reveal, and which parts must be assumed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A causal graph draws an arrow from each variable to every variable it directly affects. The arrows say more than the
        joint distribution: they say what would change if we intervened. Their observable footprint is a set of conditional
        independencies, read off with the d-separation rules of l2.7.1. Different graphs can leave the same footprint. A chain
        and a fork on three variables produce exactly the same independencies, while a collider, two causes of a common effect,
        produces a different one, and that is the only kind of arrowhead the data can pin down.
      </p>
      <MarkovEquivViz />
    </>
  ),

  theory: (
    <>
      <Definition title="causal graph">
        <p>
          A causal graph on variables <M>{"X_1, \\dots, X_n"}</M> is a directed acyclic graph in which an edge{" "}
          <M>{"X_i \\to X_j"}</M> means that <M>{"X_i"}</M> is a direct cause of <M>{"X_j"}</M> relative to the variables in the
          graph: changing <M>{"X_i"}</M> by intervention, with all other variables held fixed, can change <M>{"X_j"}</M>. The
          parents <M>{"\\mathrm{pa}(j)"}</M> are the direct causes. Intervention is made precise in m22.1.3; here we study what
          the graph implies for observational data.
        </p>
      </Definition>

      <Theorem title="acyclic graphs have a causal order">
        <p>
          A directed graph is acyclic if and only if its vertices can be listed so that every parent comes before its child{" "}
          (<C>topo_order</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          If such an order exists, every edge points forward, so no path returns to its start. Conversely, a finite acyclic graph
          has a vertex with no parents: otherwise walking backwards along parents forever would revisit a vertex and close a
          cycle. List it first, delete it, and repeat on the remaining graph, which is still acyclic. The code does exactly this,
          and raises an error when no parentless vertex remains.
        </p>
      </Proof>

      <Definition title="the causal Markov condition">
        <p>
          A distribution P is Markov with respect to the causal graph G if each variable is independent of its non-descendants
          given its parents (<C>descendants</C>, <C>local_markov</C>). By l2.7.1 this is equivalent to the factorisation{" "}
          <M>{"p(x) = \\prod_j p(x_j \\mid x_{\\mathrm{pa}(j)})"}</M> and to the global property: whenever A and B are d-separated
          by C in G, A is independent of B given C in P.
        </p>
        <Code>{GRAPH}</Code>
      </Definition>

      <Definition title="faithfulness">
        <p>
          P is faithful to G if the converse also holds: every conditional independence in P comes from a d-separation in G.
          Faithfulness can fail through exact cancellation. If <M>{"Y = X - M + \\varepsilon"}</M> and <M>{"M = X + \\delta"}</M>,
          the direct and indirect effects of X on Y cancel and X is independent of Y, although X is a cause of Y. Such
          cancellations need coefficients to satisfy an equation, so for linear Gaussian models they have Lebesgue measure zero
          in parameter space, but designed systems such as a thermostat can produce them deliberately.
        </p>
      </Definition>

      <Theorem title="Markov equivalence (Verma and Pearl)">
        <p>
          Two DAGs on the same variables imply the same d-separations if and only if they have the same skeleton, the undirected
          graph of adjacencies (<C>skeleton</C>), and the same v-structures, the colliders <M>{"a \\to v \\leftarrow b"}</M> with a and
          b not adjacent (<C>v_structures</C>, <C>markov_equivalent</C>).
        </p>
        <Code>{EQUIV}</Code>
      </Theorem>
      <Proof>
        <p>
          Necessity. Two variables are adjacent exactly when no set d-separates them: an edge is a path no conditioning can block,
          while non-adjacent a and b are separated by the parents of whichever comes later in a causal order, by the Markov
          condition. So the d-separations fix the skeleton. For a non-adjacent pair a, b with common neighbour v, if v is a
          collider then conditioning on v always opens that path, so v belongs to no separating set; if v is not a collider, the
          set of parents of the later of a and b contains v and separates them. So the d-separations decide which such triples are
          colliders. Sufficiency is longer: one shows that whether a path is blocked given C depends only on adjacencies and on
          which unshielded triples are colliders, using that an active path can be rerouted through shielded triples. We take it
          as given.
        </p>
      </Proof>

      <Remark title="what the data can and cannot say">
        <p>
          From observational data alone, and assuming faithfulness, the best one can learn is the equivalence class: the skeleton
          and the orientations forced by v-structures and their consequences. In a chain, a reversed chain or a fork, the
          dependence of X and Z with independence given Y is the same, so no amount of data decides between them. This is
          Reichenbach&apos;s common cause principle made precise: a dependence between X and Z means X causes Z, Z causes X, they
          share a cause, or the data were selected on a common effect, and the graph is the bookkeeping for which. A randomised
          experiment (m9.8.5) breaks the ambiguity by cutting every arrow into the treatment.
        </p>
      </Remark>

      <Example title="the scanner">
        <p>
          In the puzzle, let H be the hospital, S the scanner model, D the disease and I the image, with{" "}
          <M>{"S \\leftarrow H \\to D"}</M>, <M>{"S \\to I"}</M> and <M>{"D \\to I"}</M>. The scanner and the disease are dependent
          through the fork at H, and both feed the collider at I, which is fine for prediction. But the path from S to D runs
          only through H, against the direction of the arrow into S, so changing S changes nothing about D. A classifier that
          reads scanner artefacts in I predicts D well until the hospitals change their machines.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "path4",
      rung: "check",
      prompt: (
        <p>
          How many DAGs are Markov equivalent to the chain <M>{"A \\to B \\to C \\to D"}</M>, counting the chain itself?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "vs",
      rung: "check",
      prompt: (
        <p>
          How many v-structures does the DAG with edges <M>{"A \\to B"}</M>, <M>{"A \\to D"}</M>, <M>{"B \\to D"}</M>,{" "}
          <M>{"C \\to D"}</M>, <M>{"D \\to E"}</M> and <M>{"F \\to E"}</M> have?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "orient",
      rung: "apply",
      prompt: <p>From observational data on three variables, X and Z turn out independent, but dependent given Y, and both are dependent on Y. What can be concluded, assuming the causal Markov condition and faithfulness?</p>,
      answer: {
        kind: "choice",
        options: [
          "The graph is the collider X → Y ← Z: its v-structure is the only DAG with this pattern",
          "Y causes both X and Z",
          "Nothing, since chains, forks and colliders are all Markov equivalent",
          "X causes Z through Y",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def topo_order(parents):
    order, done = [], set()
    while len(order) < len(parents):
        for v in sorted(parents):
            if v not in done and all(p in done for p in parents[v]):
                order.append(v); done.add(v); break
        else:
            raise ValueError("cycle")
    return order                                               # causes before effects

def descendants(parents, v):
    out, grew = {v}, True
    while grew:
        grew = False
        for w, ps in parents.items():
            if w not in out and out & set(ps):
                out.add(w); grew = True
    return out

def local_markov(parents):
    return [(v, sorted(set(parents) - descendants(parents, v) - set(parents[v])), sorted(parents[v]))
            for v in topo_order(parents)]                      # v independent of the first list given the second

G = {"A": [], "B": ["A"], "C": ["A"], "D": ["B", "C"]}
print(topo_order(G), sorted(descendants(G, "B")), local_markov(G)[1], local_markov(G)[3])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['A', 'B', 'C', 'D'] ['B', 'D'] ('B', ['C'], ['A']) ('D', ['A'], ['B', 'C'])",
          "['A', 'B', 'C', 'D'] ['D'] ('B', ['C'], ['A']) ('D', ['A'], ['B', 'C'])",
          "['A', 'B', 'C', 'D'] ['B', 'D'] ('B', ['C', 'D'], ['A']) ('D', ['A'], ['B', 'C'])",
          "['A', 'B', 'C', 'D'] ['B', 'D'] ('B', ['C'], ['A']) ('D', [], ['B', 'C'])",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def skeleton(parents):
    return {frozenset((p, v)) for v, ps in parents.items() for p in ps}

def v_structures(parents):
    sk = skeleton(parents)
    return {(a, v, b) for v, ps in parents.items() for a in ps for b in ps
            if a < b and frozenset((a, b)) not in sk}          # a -> v <- b with a, b not adjacent

def markov_equivalent(g, h):
    return skeleton(g) == skeleton(h) and v_structures(g) == v_structures(h)

G = {"A": [], "B": ["A"], "C": ["A"], "D": ["B", "C"]}; H = {"A": ["B"], "B": [], "C": ["A"], "D": ["B", "C"]}; coll = {"X": [], "Y": ["X", "Z"], "Z": []}
print(len(skeleton(G)), sorted(v_structures(G)), markov_equivalent(G, H), markov_equivalent(coll, {"X": ["Y"], "Y": ["Z"], "Z": []}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 [('B', 'D', 'C')] True False",
          "4 [] True False",
          "4 [('B', 'D', 'C')] False False",
          "8 [('B', 'D', 'C')] True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A graph is a dict from each vertex to the list of its parents. Write <C>topo_order(parents)</C>, taking the
          alphabetically first available vertex at each step and raising <C>ValueError</C> on a cycle,{" "}
          <C>descendants(parents, v)</C> including v, and <C>local_markov(parents)</C> returning, in causal order, triples of a
          vertex, its sorted non-descendants other than parents, and its sorted parents.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def topo_order(parents):
    return sorted(parents)

def descendants(parents, v):
    return {v}

def local_markov(parents):
    return []
`,
        solution: GRAPH,
        tests: [
          { name: "order", code: `assert topo_order({"a": ["c"], "b": ["a"], "c": []}) == ["c", "a", "b"]\ntry:\n    topo_order({"a": ["b"], "b": ["a"]}); assert False\nexcept ValueError:\n    pass` },
          { name: "markov", code: `G = {"U": [], "V": ["U"], "W": ["V"], "T": ["U"]}\nassert descendants(G, "U") == {"U", "V", "W", "T"} and descendants(G, "V") == {"V", "W"}\nassert ("W", ["T", "U"], ["V"]) in local_markov(G) and len(local_markov(G)) == 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>skeleton(parents)</C> as a set of two-element frozensets, <C>v_structures(parents)</C> as a set of triples
          (a, v, b) with a &lt; b, and <C>markov_equivalent(g, h)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def skeleton(parents):
    return {(p, v) for v, ps in parents.items() for p in ps}

def v_structures(parents):
    return set()

def markov_equivalent(g, h):
    return skeleton(g) == skeleton(h)
`,
        solution: EQUIV,
        tests: [
          { name: "parts", code: `assert skeleton({"a": [], "b": ["a"]}) == skeleton({"a": ["b"], "b": []}) == {frozenset("ab")}\nassert v_structures({"a": [], "b": [], "c": ["a", "b"]}) == {("a", "c", "b")} and v_structures({"a": [], "b": ["a"], "c": ["a", "b"]}) == set()` },
          { name: "equiv", code: `fork, coll = {"x": ["y"], "y": [], "z": ["y"]}, {"x": [], "y": ["x", "z"], "z": []}\nassert not markov_equivalent(fork, coll) and markov_equivalent({"x": [], "y": ["x"], "z": ["y"]}, {"x": ["y"], "y": ["z"], "z": []})\nassert markov_equivalent({"a": [], "b": ["a"], "c": ["a", "b"]}, {"a": ["b", "c"], "b": ["c"], "c": []})` },
        ],
      },
    },
    {
      key: "complete",
      rung: "stretch",
      prompt: <p>How many DAGs on four labelled vertices are Markov equivalent to a DAG whose skeleton is the complete graph on those vertices?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A graph says which variables affect which, but not how. The next lesson attaches a mechanism to every arrow: each variable
        becomes a function of its parents and an independent noise term, a structural causal model, which can answer questions
        about interventions and counterfactuals that the graph alone cannot.
      </p>
    </>
  ),
};
