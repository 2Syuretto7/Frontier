import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CidViz } from "@/components/viz/CidViz";
import type { LessonContent } from "@/lib/types";

const GRAPH = `def d_sep(parents, A, B, C):
    keep, stack = set(A | B | C), list(A | B | C)
    while stack:
        for p in parents[stack.pop()]:
            if p not in keep: keep.add(p); stack.append(p)
    adj = {v: set() for v in keep}
    for v in keep:
        for p in parents[v]:
            adj[v].add(p); adj[p].add(v)
            adj[p].update(q for q in parents[v] if q != p)
    seen, stack = set(A), list(A)
    while stack:
        for w in adj[stack.pop()] - C:
            if w not in seen: seen.add(w); stack.append(w)
    return not (seen & B)

def requisite(parents, D, utils):
    desc, grew = {D}, True
    while grew:
        grew = False
        for v, ps in parents.items():
            if v not in desc and desc & set(ps): desc.add(v); grew = True
    UD = set(utils) & desc                                     # utilities the decision can affect
    obs = set(parents[D])
    return sorted(x for x in obs if not d_sep(parents, {x}, UD, (obs | {D}) - {x}))

def control_incentive(parents, D, utils, X):
    def reach(a, b):                                           # directed path from a to b
        stack, seen = [a], {a}
        while stack:
            v = stack.pop()
            if v == b: return True
            for w, ps in parents.items():
                if v in ps and w not in seen: seen.add(w); stack.append(w)
        return False
    return X != D and reach(D, X) and any(reach(X, u) for u in utils)`;

const OBJECTIVE = `def ev_full(d, px, u):
    return px(d) * u(d, 1) + (1 - px(d)) * u(d, 0)             # the decision also shifts X

def ev_path_specific(d, px, u, d0):
    return px(d0) * u(d, 1) + (1 - px(d0)) * u(d, 0)           # X responds as if the baseline d0 were chosen

def best(actions, f):
    return max(actions, key=f)`;

export const lesson: LessonContent = {
  id: "m22.5.3",
  minutes: 55,
  links: {
    requires: ["m22.5.2", "m22.1.4"],
    revisits: ["m22.5.1", "m22.3.2"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A recommender system is trained to maximise clicks. Nobody told it to change what its users like, yet showing more
        sensational items may gradually make users want sensational items, which they click more. Is a system trained this way
        pushed to manipulate its users? Can the answer be read off a diagram before any training, and can the objective be
        changed so that the pressure disappears while the system still serves users well?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Draw the decision, what it observes, what it affects and what it is scored on as one causal graph. An optimal policy
        cares about an observation only if that observation carries information about the score the decision can still change;
        it wants to change a variable only if the decision can reach that variable and the variable can reach the score. Both
        are path conditions on the graph. When the path from the decision through the user&apos;s preferences to the score is
        undesirable, the score can be computed as if the preferences responded to a fixed baseline action, which removes the
        incentive without blinding the system to anything.
      </p>
      <CidViz />
    </>
  ),

  theory: (
    <>
      <Definition title="causal influence diagram">
        <p>
          A causal influence diagram is a causal DAG whose vertices are chance nodes, decision nodes and utility nodes. The
          parents of a decision D are what it observes (information links), a policy chooses D as a function, possibly random, of
          its parents, and the agent maximises the expected sum of utilities. We study a single decision; <M>{"U_D"}</M> denotes
          the utility nodes that are descendants of D.
        </p>
      </Definition>

      <Theorem title="requisite observations">
        <p>
          If an observation X of D is d-separated from <M>{"U_D"}</M> given the other observations and D itself, some optimal
          policy ignores X. An observation not so separated is called requisite (<C>requisite</C>); for some parameterisation of
          the diagram its value of information is positive.
        </p>
      </Theorem>
      <Proof>
        <p>
          Utilities that are not descendants of D do not depend on the choice. For the others, given the observations pa, the
          policy&apos;s choice is a fresh random draw from the policy&apos;s own randomness, so D shares no cause with{" "}
          <M>{"U_D"}</M> beyond pa and, by rule 2 of m22.1.4,{" "}
          <M>{"\\mathbb{E}[U_D \\mid \\mathrm{do}(d), \\mathrm{pa}] = \\mathbb{E}[U_D \\mid d, \\mathrm{pa}]"}</M>. The d-separation
          says this does not depend on the value of X, so for each value of the other observations the best d is the same for
          every x, and the policy can choose it without looking. The converse, that requisite observations can matter, is shown
          by constructing distributions along the connecting path (Everitt and colleagues, 2021).
        </p>
        <Code>{GRAPH}</Code>
      </Proof>

      <Theorem title="instrumental control incentives">
        <p>
          A chance node X can carry an instrumental control incentive, meaning that the optimal policy&apos;s value changes if the
          decision&apos;s effect on X is cut, only if there are directed paths from D to X and from X to a utility node{" "}
          (<C>control_incentive</C>). For some parameterisation with such paths, the incentive is present.
        </p>
      </Theorem>
      <Proof>
        <p>
          Without a directed path from D to X, X has the same distribution under every decision, so cutting the effect of D on X
          changes nothing. Without a directed path from X to the utilities, the utilities do not depend on X once the other
          variables are fixed. Conversely, given both paths, let every variable on them copy its predecessor and let the
          utility equal the last; then the decision can raise utility only through X.
        </p>
      </Proof>

      <Definition title="path-specific objective">
        <p>
          Fix a baseline decision <M>{"d_0"}</M>. The path-specific value of d replaces X by its distribution under{" "}
          <M>{"\\mathrm{do}(d_0)"}</M>, while every other path from d to the utility is left intact:{" "}
          <M>{"\\sum_x P(x \\mid \\mathrm{do}(d_0))\\, \\mathbb{E}[U \\mid \\mathrm{do}(d), x]"}</M> (<C>ev_path_specific</C>, compared
          with <C>ev_full</C>). Optimising it (<C>best</C>) removes the control incentive on X, a construction of Farquhar, Carey
          and Everitt for avoiding manipulation of user preferences. It is a nested counterfactual of the kind in m22.3.2, and it
          needs a model of how X would respond.
        </p>
        <Code>{OBJECTIVE}</Code>
      </Definition>

      <Example title="incentives in practice">
        <p>
          In the figure, the user&apos;s initial preferences S are requisite: they tell the system what the user will click. The
          preferences after recommendation, X, lie on the directed path D → X → U, so maximising engagement creates an incentive
          to shift them. Other examples have the same shape. An agent whose reward is computed by a sensor it can reach has a
          control incentive on the sensor, the reward tampering problem. A classifier for loan decisions that observes a
          protected attribute has a response incentive on it when the attribute is requisite, which is the graphical form of a
          fairness concern.
        </p>
      </Example>

      <Remark title="what the diagram does and does not say">
        <p>
          Incentives describe what perfect optimisation of the stated objective would favour; a trained system only
          approximates that, and may also learn behaviour the diagram does not predict. The analysis is only as good as the
          graph: an omitted path is an omitted incentive. Still, the criteria are checkable by inspection, before training, which
          is what makes them useful in design. This closes the course: causal graphs define what interventions and
          counterfactuals mean, identification and discovery connect them to data, and decision theory turns them into choices,
          including the choices of the systems we build.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "full",
      rung: "check",
      prompt: (
        <p>
          A recommender chooses news or clickbait. The user&apos;s taste shifts (X = 1) with probability 0.1 after news and 0.6
          after clickbait. Engagement is 5 + 10X after news and 3 + 10X after clickbait. What is the expected engagement of
          clickbait?
        </p>
      ),
      answer: { kind: "numeric", value: 9, tolerance: 0.0005 },
    },
    {
      key: "ps",
      rung: "check",
      prompt: <p>In the same model, what is the path-specific value of clickbait with news as the baseline decision?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.0005 },
    },
    {
      key: "ici",
      rung: "apply",
      prompt: <p>A cleaning robot is rewarded by a camera that measures visible mess. Which graph feature creates an incentive for it to cover the camera?</p>,
      answer: {
        kind: "choice",
        options: [
          "A directed path from the robot's actions to the camera reading and from the reading to the reward, bypassing the actual mess",
          "The camera is a parent of the robot's decision",
          "The mess is a descendant of the reward",
          "The reward has no parents",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def d_sep(parents, A, B, C):
    keep, stack = set(A | B | C), list(A | B | C)
    while stack:
        for p in parents[stack.pop()]:
            if p not in keep: keep.add(p); stack.append(p)
    adj = {v: set() for v in keep}
    for v in keep:
        for p in parents[v]:
            adj[v].add(p); adj[p].add(v)
            adj[p].update(q for q in parents[v] if q != p)
    seen, stack = set(A), list(A)
    while stack:
        for w in adj[stack.pop()] - C:
            if w not in seen: seen.add(w); stack.append(w)
    return not (seen & B)

def requisite(parents, D, utils):
    desc, grew = {D}, True
    while grew:
        grew = False
        for v, ps in parents.items():
            if v not in desc and desc & set(ps): desc.add(v); grew = True
    UD = set(utils) & desc                                     # utilities the decision can affect
    obs = set(parents[D])
    return sorted(x for x in obs if not d_sep(parents, {x}, UD, (obs | {D}) - {x}))

def control_incentive(parents, D, utils, X):
    def reach(a, b):                                           # directed path from a to b
        stack, seen = [a], {a}
        while stack:
            v = stack.pop()
            if v == b: return True
            for w, ps in parents.items():
                if v in ps and w not in seen: seen.add(w); stack.append(w)
        return False
    return X != D and reach(D, X) and any(reach(X, u) for u in utils)

G = {"S": [], "D": ["S"], "X": ["S", "D"], "U": ["X", "D"]}
print(requisite(G, "D", ["U"]), requisite({"S": [], "N": [], "D": ["S", "N"], "U": ["D", "S"]}, "D", ["U"]), control_incentive(G, "D", ["U"], "X"), control_incentive(G, "D", ["U"], "S"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['S'] ['S'] True False",
          "['S'] ['N', 'S'] True False",
          "[] ['S'] True False",
          "['S'] ['S'] True True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ev_full(d, px, u):
    return px(d) * u(d, 1) + (1 - px(d)) * u(d, 0)             # the decision also shifts X

def ev_path_specific(d, px, u, d0):
    return px(d0) * u(d, 1) + (1 - px(d0)) * u(d, 0)           # X responds as if the baseline d0 were chosen

def best(actions, f):
    return max(actions, key=f)

px = lambda d: {"a": 0.2, "b": 0.5}[d]; u = lambda d, x: {"a": 4, "b": 3}[d] + 6 * x
print(ev_full("b", px, u), round(ev_path_specific("b", px, u, "a"), 3), best(["a", "b"], lambda d: ev_full(d, px, u)), best(["a", "b"], lambda d: ev_path_specific(d, px, u, "a")))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6.0 4.2 b a",
          "6.0 4.2 b b",
          "6.0 6.0 b b",
          "5.2 4.2 a a",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Graphs are dicts from vertex to parents. Write <C>d_sep(parents, A, B, C)</C>, <C>requisite(parents, D, utils)</C>{" "}
          returning the sorted requisite observations of D, and <C>control_incentive(parents, D, utils, X)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def d_sep(parents, A, B, C):
    return not (A & B)

def requisite(parents, D, utils):
    return sorted(parents[D])

def control_incentive(parents, D, utils, X):
    return D in parents[X]
`,
        solution: GRAPH,
        tests: [
          { name: "dsep", code: `G = {"a": [], "b": [], "c": ["a", "b"]}\nassert d_sep(G, {"a"}, {"b"}, set()) and not d_sep(G, {"a"}, {"b"}, {"c"})\nassert not d_sep({"a": [], "b": ["a"]}, {"a"}, {"b"}, set())` },
          { name: "req", code: `assert requisite({"S": [], "A": ["S"], "N": [], "D": ["A", "N"], "U": ["D", "S"]}, "D", ["U"]) == ["A"]\nassert requisite({"S": [], "D": ["S"], "U": ["S"], "V": ["D"]}, "D", ["U", "V"]) == []\nG = {"D": [], "Y": ["D"], "X": ["Y"], "U": ["X"]}\nassert control_incentive(G, "D", ["U"], "X") and not control_incentive({"D": [], "X": ["D"], "U": ["D"]}, "D", ["U"], "X")` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>px(d)</C> the probability that binary X = 1 under decision d and <C>u(d, x)</C> the expected utility, write{" "}
          <C>ev_full(d, px, u)</C>, <C>ev_path_specific(d, px, u, d0)</C> and <C>best(actions, f)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ev_full(d, px, u):
    return u(d, 0)

def ev_path_specific(d, px, u, d0):
    return px(d) * u(d, 1) + (1 - px(d)) * u(d, 0)

def best(actions, f):
    return actions[0]
`,
        solution: OBJECTIVE,
        tests: [
          { name: "ev", code: `px = lambda d: {"a": 0.3, "b": 0.9}[d]; u = lambda d, x: {"a": 1, "b": 0}[d] + 5 * x\nassert abs(ev_full("a", px, u) - 2.5) < 1e-12 and abs(ev_full("b", px, u) - 4.5) < 1e-12 and abs(ev_path_specific("b", px, u, "a") - 1.5) < 1e-12` },
          { name: "best", code: `px = lambda d: {"a": 0.3, "b": 0.9}[d]; u = lambda d, x: {"a": 1, "b": 0}[d] + 5 * x\nassert best(["a", "b"], lambda d: ev_full(d, px, u)) == "b" and best(["a", "b"], lambda d: ev_path_specific(d, px, u, "a")) == "a"` },
        ],
      },
    },
    {
      key: "req2",
      rung: "stretch",
      prompt: (
        <p>
          A decision D observes A, B, C and E. The other edges are <M>{"S \\to A"}</M>, <M>{"S \\to E"}</M>, <M>{"B \\to C"}</M>,{" "}
          <M>{"S \\to U"}</M> and <M>{"D \\to U"}</M>, with U the only utility. How many of the four observations are requisite?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The tools of this course return in the study of learning systems: causal graphs for distribution shift and spurious
        features, interventions for interpretability, and incentive analysis for alignment. They share one lesson: data
        describe what happened, and a model of how it happened is needed to say what would happen otherwise.
      </p>
    </>
  ),
};
