import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DsepPathViz } from "@/components/viz/DsepPathViz";
import type { LessonContent } from "@/lib/types";

const JOINT = `import itertools
import numpy as np

def joint(order, parents, cpt):
    J = {}
    for vals in itertools.product([0, 1], repeat=len(order)):
        x = dict(zip(order, vals))
        p = 1.0
        for v in order:
            q = cpt[v][tuple(x[u] for u in parents[v])]
            p *= q if x[v] else 1 - q
        J[vals] = p
    return J

def prob(J, order, query, evidence=None):
    cond = dict(evidence or {})
    def ok(vals, c):
        return all(vals[order.index(k)] == v for k, v in c.items())
    num = sum(p for vals, p in J.items() if ok(vals, {**cond, **query}))
    return num / sum(p for vals, p in J.items() if ok(vals, cond))`;

const DSEP = `import numpy as np

def ancestral_sample(order, parents, cpt, n, seed=0):
    rng = np.random.default_rng(seed)
    out = np.zeros((n, len(order)), dtype=int)
    for i in range(n):
        x = {}
        for v in order:
            x[v] = int(rng.random() < cpt[v][tuple(x[u] for u in parents[v])])
        out[i] = [x[v] for v in order]
    return out

def d_separated(parents, a, b, given):
    anc, stack = set(), [a, b, *given]
    while stack:
        v = stack.pop()
        if v not in anc:
            anc.add(v)
            stack.extend(parents[v])
    nbr = {v: set() for v in anc}
    for v in anc:
        for p in parents[v]:
            nbr[v].add(p); nbr[p].add(v)
            nbr[p].update(q for q in parents[v] if q != p)
    seen, stack = set(given), [a]
    while stack:
        v = stack.pop()
        if v == b:
            return False
        if v not in seen:
            seen.add(v)
            stack.extend(nbr[v] - seen)
    return True`;

export const lesson: LessonContent = {
  id: "l2.7.1",
  minutes: 55,
  links: {
    requires: ["m4.3.4", "m7.1.5", "m7.5.1"],
    revisits: ["l2.5.4", "m7.1.4"],
    foreshadows: ["l2.7.2", "l2.7.3", "m22.1.1"],
  },

  puzzle: (
    <>
      <p>
        Thirty binary variables have a joint distribution with more than a billion free numbers. Yet a doctor reasoning
        about diseases and symptoms, or an engineer reasoning about failures and alarms, gets by with a handful of local
        rules: this symptom depends on these two diseases, that alarm on this sensor. When do local rules pin down the
        whole joint distribution, and which independences can you read off them without computing anything?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw an arrow from each variable to those it directly influences. If the arrows form no cycle, specifying each
        variable&apos;s distribution given its parents defines the joint as their product. Information then flows along
        paths, but not every path carries it: knowing the middle of a chain or the common cause of a fork cuts the path,
        while two causes of a common effect become linked exactly when you learn about the effect.
      </p>
      <DsepPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="Bayesian network">
        <p>
          A Bayesian network is a directed acyclic graph on variables <M>{"x_1, \\dots, x_d"}</M> together with conditional
          distributions <M>{"p(x_i \\mid x_{\\mathrm{pa}(i)})"}</M>, one for each node given its parents. It defines
        </p>
        <MD>{"p(x_1, \\dots, x_d) = \\prod_{i=1}^d p(x_i \\mid x_{\\mathrm{pa}(i)})."}</MD>
        <p>
          This is a valid distribution: summing over the variables in reverse topological order, each sum removes one
          factor that sums to 1. With binary variables and at most m parents each, it needs at most{" "}
          <M>{"d\\,2^m"}</M> numbers instead of <M>{"2^d - 1"}</M>.
        </p>
        <Code>{JOINT}</Code>
      </Definition>

      <Theorem title="the local Markov property">
        <p>Each variable is conditionally independent of its non-descendants given its parents.</p>
      </Theorem>
      <Proof>
        <p>
          Let v be a node, D its descendants other than itself, and N its non-descendants. Every factor for a node in D
          comes after v in a topological order, and no other factor contains a variable of D, so summing out D leaf by leaf
          removes those factors and leaves <M>{"p(x_v \\mid x_{\\mathrm{pa}(v)})\\prod_{u \\in N} p(x_u \\mid x_{\\mathrm{pa}(u)})"}</M>,
          because parents of non-descendants are non-descendants. Here <M>{"x_v"}</M> appears only in its own factor, so
          dividing by the sum over <M>{"x_v"}</M> gives{" "}
          <M>{"p(x_v \\mid x_N) = p(x_v \\mid x_{\\mathrm{pa}(v)})"}</M>.
        </p>
      </Proof>

      <Theorem title="chains, forks and colliders">
        <p>
          For three variables: in a chain a → b → c and a fork a ← b → c, a and c are independent given b but in general
          not marginally. In a collider a → b ← c, a and c are independent marginally but in general not given b.
        </p>
      </Theorem>
      <Proof>
        <p>
          Chain: <M>{"p(a, b, c) = p(a)p(b \\mid a)p(c \\mid b)"}</M>, so <M>{"p(a, c \\mid b) = p(a \\mid b)p(c \\mid b)"}</M>{" "}
          by Bayes&apos; rule on the first two factors. Fork: <M>{"p(a, b, c) = p(b)p(a \\mid b)p(c \\mid b)"}</M>, which
          divided by <M>{"p(b)"}</M> is already a product. Collider:{" "}
          <M>{"p(a, b, c) = p(a)p(c)p(b \\mid a, c)"}</M>; summing over b gives <M>{"p(a)p(c)"}</M>. Given b no such
          factorisation holds in general: with a and c fair coins and b = a OR c,{" "}
          <M>{"P(a = 1 \\mid b = 1) = 2/3"}</M> but <M>{"P(a = 1 \\mid b = 1, c = 1) = 1/2"}</M>.
        </p>
      </Proof>

      <Definition title="d-separation">
        <p>
          A path between x and y (ignoring arrow directions) is blocked by a set Z if it has an interior node m that is
          either a non-collider in Z, or a collider such that neither m nor any of its descendants is in Z. x and y are
          d-separated by Z if every path is blocked. If they are, x and y are conditionally independent given Z in every
          distribution that factorises over the graph (Verma and Pearl). An equivalent test: keep only Z, x, y and their
          ancestors, join every pair of parents of a common child, drop directions, delete Z, and check whether x can still
          reach y.
        </p>
        <Code>{DSEP}</Code>
      </Definition>

      <Remark title="explaining away and sampling">
        <p>
          In the code, rain (R) and a sprinkler (S) both wet the grass (W). Rain has prior 0.2; seeing wet grass raises it
          to 0.6947, and then learning the sprinkler was on drops it to 0.2157: the sprinkler explains the wet grass away.
          To sample from a network, draw each variable in topological order from its conditional given the values already
          drawn for its parents. The ancestral sampler in the code reproduces P(W = 1) ≈ 0.24 and{" "}
          <M>{"P(R = 1 \\mid W = 1) \\approx 0.69"}</M> from 20000 draws. The graph encodes independences, not causation;
          reading arrows as causes needs the extra assumptions of causal inference.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chain",
      rung: "check",
      prompt: <p>Ten binary variables form a chain X₁ → X₂ → ⋯ → X₁₀. How many free numbers specify the network?</p>,
      answer: { kind: "numeric", value: 19, tolerance: 0 },
    },
    {
      key: "or",
      rung: "check",
      prompt: <p>A and B are independent fair coins and C = A OR B. What is P(A = 1 | C = 1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>In the graph A → B → C, A → D, C → E, D → E, which statement is true?</p>,
      answer: {
        kind: "choice",
        options: [
          "B and D are d-separated by {A} but not by {A, E}",
          "B and D are d-separated by {A, E} but not by {A}",
          "B and D are d-separated by the empty set",
          "C and D are d-separated by {E}",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import numpy as np

def joint(order, parents, cpt):
    J = {}
    for vals in itertools.product([0, 1], repeat=len(order)):
        x = dict(zip(order, vals))
        p = 1.0
        for v in order:
            q = cpt[v][tuple(x[u] for u in parents[v])]
            p *= q if x[v] else 1 - q
        J[vals] = p
    return J

def prob(J, order, query, evidence=None):
    cond = dict(evidence or {})
    def ok(vals, c):
        return all(vals[order.index(k)] == v for k, v in c.items())
    num = sum(p for vals, p in J.items() if ok(vals, {**cond, **query}))
    return num / sum(p for vals, p in J.items() if ok(vals, cond))

order = ["R", "S", "W"]; parents = {"R": [], "S": [], "W": ["R", "S"]}
cpt = {"R": {(): 0.2}, "S": {(): 0.1}, "W": {(0, 0): 0.0, (0, 1): 0.9, (1, 0): 0.8, (1, 1): 0.99}}
J = joint(order, parents, cpt)
print(round(sum(J.values()), 6), round(prob(J, order, {"W": 1}), 4))
print(round(prob(J, order, {"R": 1}, {"W": 1}), 4), round(prob(J, order, {"R": 1}, {"W": 1, "S": 1}), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.0 0.2358\n0.6947 0.2157", "1.0 0.2358\n0.2157 0.6947", "1.0 0.2358\n0.6947 0.6947", "0.2358 1.0\n0.6947 0.2157"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def d_separated(parents, a, b, given):
    anc, stack = set(), [a, b, *given]
    while stack:
        v = stack.pop()
        if v not in anc:
            anc.add(v)
            stack.extend(parents[v])
    nbr = {v: set() for v in anc}
    for v in anc:
        for p in parents[v]:
            nbr[v].add(p); nbr[p].add(v)
            nbr[p].update(q for q in parents[v] if q != p)
    seen, stack = set(given), [a]
    while stack:
        v = stack.pop()
        if v == b:
            return False
        if v not in seen:
            seen.add(v)
            stack.extend(nbr[v] - seen)
    return True

G = {"A": [], "B": ["A"], "C": ["B"], "D": ["A"], "E": ["C", "D"]}
print(d_separated(G, "A", "C", ["B"]), d_separated(G, "B", "D", ["A"]), d_separated(G, "B", "D", ["A", "E"]))
print(d_separated(G, "C", "D", []), d_separated(G, "C", "D", ["A"]), d_separated(G, "C", "D", ["A", "E"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True False\nFalse True False", "True False True\nFalse True False", "True True False\nTrue True False", "True True True\nFalse True True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Binary variables are listed in <C>order</C> (a topological order), <C>parents[v]</C> lists v&apos;s parents and{" "}
          <C>cpt[v]</C> maps a tuple of parent values to P(v = 1). Write <C>joint(order, parents, cpt)</C>, returning a
          dictionary from value tuples to probabilities, and <C>prob(J, order, query, evidence=None)</C>, returning
          P(query | evidence) where both are dictionaries of variable values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import itertools
import numpy as np

def joint(order, parents, cpt):
    return {}

def prob(J, order, query, evidence=None):
    return 0.0
`,
        solution: JOINT,
        tests: [
          { name: "joint", code: `J = joint(["A", "B"], {"A": [], "B": ["A"]}, {"A": {(): 0.3}, "B": {(0,): 0.5, (1,): 0.9}})
assert abs(J[(1, 1)] - 0.27) < 1e-12 and abs(J[(0, 1)] - 0.35) < 1e-12 and abs(sum(J.values()) - 1) < 1e-12` },
          { name: "prob", code: `o = ["A", "C", "B"]; ps = {"A": [], "C": [], "B": ["A", "C"]}
cp = {"A": {(): 0.5}, "C": {(): 0.5}, "B": {(0, 0): 0.0, (0, 1): 1.0, (1, 0): 1.0, (1, 1): 1.0}}
J = joint(o, ps, cp)
assert abs(prob(J, o, {"A": 1}, {"B": 1}) - 2 / 3) < 1e-12 and abs(prob(J, o, {"A": 1}, {"B": 1, "C": 1}) - 0.5) < 1e-12 and abs(prob(J, o, {"A": 1}) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ancestral_sample(order, parents, cpt, n, seed=0)</C>, returning an n-by-d integer array of samples, and{" "}
          <C>d_separated(parents, a, b, given)</C>, returning whether a and b are d-separated by the list <C>given</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def ancestral_sample(order, parents, cpt, n, seed=0):
    return np.zeros((n, len(order)), dtype=int)

def d_separated(parents, a, b, given):
    return True
`,
        solution: DSEP,
        tests: [
          { name: "sample", code: `X = ancestral_sample(["A", "B"], {"A": [], "B": ["A"]}, {"A": {(): 0.3}, "B": {(0,): 0.1, (1,): 0.9}}, 40000)
assert X.shape == (40000, 2) and abs(X[:, 0].mean() - 0.3) < 0.01 and abs(X[X[:, 0] == 1, 1].mean() - 0.9) < 0.01 and abs(X[X[:, 0] == 0, 1].mean() - 0.1) < 0.01` },
          { name: "dsep", code: `G = {"X": [], "Y": [], "Z": ["X", "Y"], "W": ["Z"], "V": ["X"]}
assert d_separated(G, "X", "Y", []) and not d_separated(G, "X", "Y", ["W"]) and not d_separated(G, "V", "Z", [])
assert d_separated(G, "V", "Z", ["X"]) and d_separated(G, "V", "Y", ["X", "W"]) and not d_separated(G, "V", "Y", ["W"])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Suppose p(a, b, c) = p(a) p(c) p(b | a, c), a collider a → b ← c. Prove that a and c are independent, and show by
          an explicit example that they need not be independent given b.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Sums the factorisation over b, using Σ_b p(b | a, c) = 1, to get p(a, c) = p(a) p(c).",
          "Gives a concrete conditional p(b | a, c), such as b = a OR c with fair coins, and computes P(a | b) and P(a | b, c) (or p(a, c | b) against p(a | b) p(c | b)).",
          "Shows the two differ, so a and c are dependent given b.",
        ],
      },
    },
    {
      key: "sprink",
      rung: "stretch",
      prompt: <p>In the sprinkler network of the code (P(R = 1) = 0.2, P(S = 1) = 0.1, and the table for W), what is P(S = 1 | W = 1)? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.3893, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a Bayesian network defines a joint distribution, why it saves parameters, how chains, forks and colliders pass or block dependence, how to test d-separation, and what explaining away is.",

  glimpse: (
    <>
      <p>
        Some dependences have no natural direction: neighbouring pixels, or atoms in a lattice, influence each other
        symmetrically. Undirected graphs describe these with potentials on cliques instead of conditional distributions,
        and their independences are read off by plain graph separation.
      </p>
    </>
  ),
};
