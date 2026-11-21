import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DoCalculusViz } from "@/components/viz/DoCalculusViz";
import type { LessonContent } from "@/lib/types";

const SURGERY = `def bar(parents, X):
    return {v: [] if v in X else list(ps) for v, ps in parents.items()}       # remove arrows into X

def underline(parents, Z):
    return {v: [p for p in ps if p not in Z] for v, ps in parents.items()}   # remove arrows out of Z

def d_sep(parents, A, B, C):
    keep, stack = set(A | B | C), list(A | B | C)
    while stack:                                               # ancestral set
        for p in parents[stack.pop()]:
            if p not in keep: keep.add(p); stack.append(p)
    adj = {v: set() for v in keep}
    for v in keep:                                             # moralise
        for p in parents[v]:
            adj[v].add(p); adj[p].add(v)
            adj[p].update(q for q in parents[v] if q != p)
    seen, stack = set(A), list(A)
    while stack:
        for w in adj[stack.pop()] - C:
            if w not in seen: seen.add(w); stack.append(w)
    return not (seen & B)`;

const RULES = `def rule1(dsep, parents, Y, X, Z, W):
    G = {v: [] if v in X else list(ps) for v, ps in parents.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),z,w) = P(y|do(x),w)

def rule2(dsep, parents, Y, X, Z, W):
    G = {v: [] if v in X else [p for p in ps if p not in Z] for v, ps in parents.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),do(z),w) = P(y|do(x),z,w)

def rule3(dsep, parents, Y, X, Z, W):
    Gx = {v: [] if v in X else list(ps) for v, ps in parents.items()}
    anc, stack = set(W), list(W)
    while stack:
        for p in Gx[stack.pop()]:
            if p not in anc: anc.add(p); stack.append(p)
    G = {v: [] if v in X or (v in Z and v not in anc) else ps for v, ps in Gx.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),do(z),w) = P(y|do(x),w)`;

export const lesson: LessonContent = {
  id: "m22.1.4",
  minutes: 60,
  links: {
    requires: ["m22.1.3"],
    revisits: ["l2.7.1", "m22.1.1"],
    foreshadows: ["m22.2.1"],
  },

  puzzle: (
    <>
      <p>
        Smoking (X) and lung cancer (Y) may share a hidden genetic cause U, so adjusting for the parents of X is impossible: U
        is not measured. Suppose, though, that smoking affects cancer only through tar deposits M in the lungs, which are
        measured, and that U does not affect M directly. Is the causal effect of smoking on cancer then determined by the
        distribution of (X, M, Y)? More generally, is there a mechanical procedure that decides such questions?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An interventional expression can be rewritten using three moves: drop an observation that is irrelevant, swap an
        intervention for an observation when the two carry the same information, and drop an intervention that has no effect.
        Each move is allowed when a d-separation holds in a version of the graph with some arrows cut, which encodes what the
        intervention has already broken. If a chain of moves removes every do, the effect is identified from observational
        data; and if no chain does, it is not.
      </p>
      <DoCalculusViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mutilated graphs">
        <p>
          For sets of vertices X and Z, <M>{"G_{\\overline{X}}"}</M> removes every arrow into X (<C>bar</C>) and{" "}
          <M>{"G_{\\underline{Z}}"}</M> removes every arrow out of Z (<C>underline</C>); <M>{"G_{\\overline{X}\\underline{Z}}"}</M>{" "}
          does both. We write <M>{"P(y \\mid \\mathrm{do}(x), w)"}</M> for the conditional of Y given W = w in the model with X
          set to x, and use the d-separation test of l2.7.1 (<C>d_sep</C>).
        </p>
        <Code>{SURGERY}</Code>
      </Definition>

      <Theorem title="the rules of the do-calculus (Pearl)">
        <p>For disjoint sets of variables X, Y, Z, W in a causal model with graph G:</p>
        <MD>{"\\text{1. } P(y \\mid \\mathrm{do}(x), z, w) = P(y \\mid \\mathrm{do}(x), w) \\ \\text{ if } (Y \\perp Z \\mid X, W) \\text{ in } G_{\\overline{X}}"}</MD>
        <MD>{"\\text{2. } P(y \\mid \\mathrm{do}(x), \\mathrm{do}(z), w) = P(y \\mid \\mathrm{do}(x), z, w) \\ \\text{ if } (Y \\perp Z \\mid X, W) \\text{ in } G_{\\overline{X}\\underline{Z}}"}</MD>
        <MD>{"\\text{3. } P(y \\mid \\mathrm{do}(x), \\mathrm{do}(z), w) = P(y \\mid \\mathrm{do}(x), w) \\ \\text{ if } (Y \\perp Z \\mid X, W) \\text{ in } G_{\\overline{X}\\,\\overline{Z(W)}}"}</MD>
        <p>
          where <M>{"Z(W)"}</M> is the set of vertices of Z that are not ancestors of any vertex of W in{" "}
          <M>{"G_{\\overline{X}}"}</M> (<C>rule1</C>, <C>rule2</C>, <C>rule3</C>, which take the d-separation test as an argument).
        </p>
        <Code>{RULES}</Code>
      </Theorem>
      <Proof>
        <p>
          Rule 1 is the global Markov property of l2.7.1 applied to the model with X set, whose graph is{" "}
          <M>{"G_{\\overline{X}}"}</M>. For rules 2 and 3, add to <M>{"G_{\\overline{X}}"}</M> a regime variable{" "}
          <M>{"F_z"}</M> for each z in Z, a new parent of z that selects between the natural mechanism and the forced value. The
          augmented graph describes both regimes at once, and its Markov property holds in each. Doing z rather than observing z
          changes only <M>{"F_z"}</M>, so the two sides of rule 2 agree when{" "}
          <M>{"Y \\perp F_Z \\mid Z, X, W"}</M>. Given Z, a path from <M>{"F_Z"}</M> through z to Y must leave z by an outgoing
          arrow, since entering z from <M>{"F_z"}</M> and leaving by an incoming arrow makes z a conditioned non-collider. So the
          condition is that Y and Z are d-separated by X and W once arrows out of Z are removed. For rule 3 the two sides differ only in <M>{"F_Z"}</M> with Z not
          observed, so they agree when <M>{"Y \\perp F_Z \\mid X, W"}</M>. A path from <M>{"F_z"}</M> begins{" "}
          <M>{"F_z \\to z"}</M> and leaves z either by an outgoing arrow, exactly like a path starting at z, or by an incoming
          arrow, which makes z a collider. That collider is open only if z has a descendant in W (arrows into X are cut, so it
          has none in X). For z in Z(W) only the first kind of path matters, which is what removing the arrows into z records;
          for the other z both kinds are open, as in a graph that keeps the arrows into z.
        </p>
      </Proof>

      <Example title="the frontdoor formula">
        <p>
          In the puzzle graph <M>{"U \\to X \\to M \\to Y \\leftarrow U"}</M>, the figure runs the derivation. Rule 2 gives{" "}
          <M>{"P(m \\mid \\mathrm{do}(x)) = P(m \\mid x)"}</M>. For <M>{"P(y \\mid \\mathrm{do}(m))"}</M>, condition on X: rule 3 gives{" "}
          <M>{"P(x \\mid \\mathrm{do}(m)) = P(x)"}</M> and rule 2 gives{" "}
          <M>{"P(y \\mid \\mathrm{do}(m), x) = P(y \\mid m, x)"}</M>. Finally{" "}
          <M>{"P(y \\mid \\mathrm{do}(x)) = \\sum_m P(y \\mid \\mathrm{do}(x), m)\\,P(m \\mid \\mathrm{do}(x))"}</M>, and rules 2 then 3
          turn <M>{"P(y \\mid \\mathrm{do}(x), m)"}</M> into <M>{"P(y \\mid \\mathrm{do}(m))"}</M>. Together,
        </p>
        <MD>{"P(y \\mid \\mathrm{do}(x)) = \\sum_m P(m \\mid x) \\sum_{x'} P(y \\mid m, x')\\,P(x'),"}</MD>
        <p>an expression in observed quantities only, even though U is hidden.</p>
      </Example>

      <Theorem title="a hidden common cause of treatment and outcome blocks identification">
        <p>
          In the graph <M>{"X \\to Y"}</M> with a hidden U pointing into both, <M>{"P(y \\mid \\mathrm{do}(x))"}</M> is not determined
          by the distribution of (X, Y).
        </p>
      </Theorem>
      <Proof>
        <p>
          Take U a fair coin. Model 1 sets X := U and Y := U; model 2 sets X := U and Y := X. Both make X = Y a fair coin, so the
          observational distributions agree, and both fit the graph. Under <M>{"\\mathrm{do}(X = 1)"}</M>, model 1 still has Y =
          U, a fair coin, while model 2 has Y = 1. Two models that the data cannot tell apart disagree about the intervention.
        </p>
      </Proof>

      <Remark title="completeness">
        <p>
          The rules are complete: Shpitser and Pearl, and independently Huang and Valtorta, showed in 2006 that whenever an
          interventional distribution is determined by the observational one and the graph, some sequence of the three rules
          derives it, and gave an algorithm (ID) that finds the sequence or produces two models, like the ones above, that
          witness non-identifiability. The next chapter turns the two most common outcomes, backdoor and frontdoor adjustment,
          into criteria that can be checked by eye.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "edges",
      rung: "check",
      prompt: (
        <p>
          The graph has edges <M>{"U \\to X"}</M>, <M>{"U \\to Y"}</M>, <M>{"W \\to X"}</M>, <M>{"W \\to Z"}</M>, <M>{"X \\to Z"}</M>{" "}
          and <M>{"Z \\to Y"}</M>. How many edges does <M>{"G_{\\overline{X}\\underline{Z}}"}</M> have?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "zw",
      rung: "check",
      prompt: (
        <p>
          The graph has edges <M>{"X \\to A"}</M>, <M>{"A \\to W"}</M>, <M>{"B \\to A"}</M>, <M>{"C \\to B"}</M>, <M>{"D \\to X"}</M>{" "}
          and <M>{"E \\to Y"}</M>. With Z = {"{A, B, C, D, E}"} and W = {"{W}"}, how many vertices does Z(W) have?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
    {
      key: "rule",
      rung: "apply",
      prompt: <p>In a randomised experiment X has no parents. Which rule shows P(y | do(x)) = P(y | x), and why does it apply?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rule 2 with Z = X: with arrows out of X removed, X has no edges at all, so it is d-separated from Y",
          "Rule 1, because X is independent of Y",
          "Rule 3, because X has no descendants",
          "None: the do-calculus does not apply to experiments",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bar(parents, X):
    return {v: [] if v in X else list(ps) for v, ps in parents.items()}       # remove arrows into X

def underline(parents, Z):
    return {v: [p for p in ps if p not in Z] for v, ps in parents.items()}   # remove arrows out of Z

def d_sep(parents, A, B, C):
    keep, stack = set(A | B | C), list(A | B | C)
    while stack:                                               # ancestral set
        for p in parents[stack.pop()]:
            if p not in keep: keep.add(p); stack.append(p)
    adj = {v: set() for v in keep}
    for v in keep:                                             # moralise
        for p in parents[v]:
            adj[v].add(p); adj[p].add(v)
            adj[p].update(q for q in parents[v] if q != p)
    seen, stack = set(A), list(A)
    while stack:
        for w in adj[stack.pop()] - C:
            if w not in seen: seen.add(w); stack.append(w)
    return not (seen & B)

F = {"U": [], "X": ["U"], "M": ["X"], "Y": ["M", "U"]}
print(bar(F, {"X"})["X"], underline(F, {"X"})["M"], d_sep(F, {"X"}, {"Y"}, {"M"}), d_sep(underline(F, {"X"}), {"X"}, {"M"}, set()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[] [] False True",
          "['U'] [] False True",
          "[] ['X'] False True",
          "[] [] True True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rule1(dsep, parents, Y, X, Z, W):
    G = {v: [] if v in X else list(ps) for v, ps in parents.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),z,w) = P(y|do(x),w)

def rule2(dsep, parents, Y, X, Z, W):
    G = {v: [] if v in X else [p for p in ps if p not in Z] for v, ps in parents.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),do(z),w) = P(y|do(x),z,w)

def rule3(dsep, parents, Y, X, Z, W):
    Gx = {v: [] if v in X else list(ps) for v, ps in parents.items()}
    anc, stack = set(W), list(W)
    while stack:
        for p in Gx[stack.pop()]:
            if p not in anc: anc.add(p); stack.append(p)
    G = {v: [] if v in X or (v in Z and v not in anc) else ps for v, ps in Gx.items()}
    return dsep(G, Y, Z, X | W)                                # P(y|do(x),do(z),w) = P(y|do(x),w)

seen = []; dsep = lambda G, A, B, C: seen.append(sum(map(len, G.values()))) or True
print(rule1(dsep, {"a": [], "b": ["a"], "c": ["b"]}, {"c"}, {"a"}, {"b"}, set()), rule2(dsep, {"a": [], "b": ["a"], "c": ["b"]}, {"c"}, {"a"}, {"b"}, set()), seen)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True True [2, 1]",
          "True True [1, 2]",
          "True True [2, 2]",
          "True True [1, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Graphs are dicts from vertex to list of parents. Write <C>bar(parents, X)</C>, <C>underline(parents, Z)</C> and{" "}
          <C>d_sep(parents, A, B, C)</C> for sets of vertices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bar(parents, X):
    return dict(parents)

def underline(parents, Z):
    return dict(parents)

def d_sep(parents, A, B, C):
    return False
`,
        solution: SURGERY,
        tests: [
          { name: "surgery", code: `G = {"a": [], "b": ["a"], "c": ["a", "b"]}\nassert bar(G, {"b"}) == {"a": [], "b": [], "c": ["a", "b"]} and underline(G, {"a"}) == {"a": [], "b": [], "c": ["b"]}` },
          { name: "dsep", code: `G = {"a": [], "b": [], "c": ["a", "b"], "d": ["c"]}\nassert d_sep(G, {"a"}, {"b"}, set()) and not d_sep(G, {"a"}, {"b"}, {"d"})\nassert d_sep({"a": [], "b": ["a"], "c": ["b"]}, {"a"}, {"c"}, {"b"})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rule1</C>, <C>rule2</C> and <C>rule3</C>, each taking <C>(dsep, parents, Y, X, Z, W)</C> with sets of
          vertices, building the right mutilated graph and returning <C>dsep(G, Y, Z, X | W)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rule1(dsep, parents, Y, X, Z, W):
    return dsep(parents, Y, Z, X | W)

def rule2(dsep, parents, Y, X, Z, W):
    return dsep(parents, Y, Z, X | W)

def rule3(dsep, parents, Y, X, Z, W):
    return dsep(parents, Y, Z, X | W)
`,
        solution: RULES,
        tests: [
          { name: "rules12", code: `calls = []\ndef dsep(G, A, B, C):\n    calls.append((G, A, B, C)); return True\nF = {"U": [], "X": ["U"], "M": ["X"], "Y": ["M", "U"]}\nrule2(dsep, F, {"Y"}, {"X"}, {"M"}, set())\nassert calls[-1] == ({"U": [], "X": [], "M": ["X"], "Y": ["U"]}, {"Y"}, {"M"}, {"X"})\nrule1(dsep, F, {"Y"}, {"X"}, {"M"}, set()); assert calls[-1][0] == {"U": [], "X": [], "M": ["X"], "Y": ["M", "U"]}` },
          { name: "rule3", code: `calls = []\ndef dsep(G, A, B, C):\n    calls.append(G); return False\nP = {"X": [], "Z": ["X"], "W": ["Z"], "Y": ["X"]}\nassert rule3(dsep, P, {"Y"}, set(), {"Z"}, {"W"}) is False and calls[-1] == P\nrule3(dsep, P, {"Y"}, set(), {"Z"}, set()); assert calls[-1] == {"X": [], "Z": [], "W": ["Z"], "Y": ["X"]}` },
        ],
      },
    },
    {
      key: "front",
      rung: "stretch",
      prompt: (
        <p>
          In the frontdoor graph, P(X = 1) = 0.4; P(M = 1 | X = 0) = 0.2 and P(M = 1 | X = 1) = 0.7; P(Y = 1 | X, M) is 0.1, 0.5,
          0.3, 0.6 for (X, M) = (0, 0), (0, 1), (1, 0), (1, 1). What is <M>{"P(Y = 1 \\mid \\mathrm{do}(X = 1))"}</M>? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.432, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The do-calculus is complete but laborious. Chapter 2 extracts its two most useful consequences as graphical criteria:
        the backdoor criterion, which says which measured covariates suffice for adjustment, and the frontdoor criterion, which
        generalises the derivation above.
      </p>
    </>
  ),
};
