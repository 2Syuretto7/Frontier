import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BackdoorViz } from "@/components/viz/BackdoorViz";
import type { LessonContent } from "@/lib/types";

const CRITERION = `def descendants(parents, X):
    out, grew = set(X), True
    while grew:
        grew = False
        for v, ps in parents.items():
            if v not in out and out & set(ps):
                out.add(v); grew = True
    return out

def d_sep(parents, A, B, C):
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

def is_backdoor(parents, x, y, Z):
    if Z & descendants(parents, {x}):
        return False                                           # no descendants of the treatment
    cut = {v: [p for p in ps if p != x] for v, ps in parents.items()}
    return d_sep(cut, {x}, {y}, Z)                             # with x's out-arrows cut, only backdoor paths remain`;

const ESTIMATORS = `import numpy as np

def adjust_est(x, y, z, t):
    return sum(np.mean(y[(x == t) & (z == v)]) * np.mean(z == v) for v in np.unique(z))

def ipw_est(x, y, z, t):
    e = np.array([np.mean(x[z == v] == t) for v in z])        # propensity P(X = t | z) for each unit
    return float(np.mean((x == t) * y / e))

def frontdoor_est(x, m, y, t):
    return sum(np.mean(m[x == t] == mv) * sum(np.mean(y[(m == mv) & (x == xv)]) * np.mean(x == xv) for xv in np.unique(x))
               for mv in np.unique(m))`;

export const lesson: LessonContent = {
  id: "m22.2.1",
  minutes: 60,
  links: {
    requires: ["m22.1.4"],
    revisits: ["m9.6.1", "m22.1.3"],
    foreshadows: ["m22.2.2", "m22.3.1"],
  },

  puzzle: (
    <>
      <p>
        An analyst estimating the effect of a training programme on earnings has fifty recorded covariates. A colleague says to
        adjust for all of them, since more control can only help. Another says that adjusting for the wrong variable can create
        bias where there was none. Which covariates should go into the adjustment, and is there a rule that can be checked by
        looking at the causal graph rather than by deriving a do-calculus proof each time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The association between X and Y travels along every path between them. Causal paths leave X by an outgoing arrow; the
        rest, backdoor paths, enter X by an arrow pointing into it and carry confounding. A good adjustment set blocks every
        backdoor path, leaves the causal paths alone, and does not open new paths by conditioning on a collider. Adjusting for
        a mediator cuts part of the effect; adjusting for a collider can create a spurious one. In the figure the regression
        estimate is exact precisely for the sets that pass the test.
      </p>
      <BackdoorViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the backdoor criterion">
        <p>
          A set Z of observed variables satisfies the backdoor criterion relative to (X, Y) if no vertex of Z is a descendant of X
          and Z blocks every path between X and Y that begins with an arrow into X. Equivalently, Z contains no descendant of X and
          d-separates X from Y in <M>{"G_{\\underline{X}}"}</M>, whose paths from X are exactly the backdoor paths{" "}
          (<C>is_backdoor</C>).
        </p>
        <Code>{CRITERION}</Code>
      </Definition>

      <Theorem title="backdoor adjustment">
        <p>If Z satisfies the backdoor criterion relative to (X, Y), then</p>
        <MD>{"P(y \\mid \\mathrm{do}(x)) = \\sum_z P(y \\mid x, z)\\, P(z)."}</MD>
      </Theorem>
      <Proof>
        <p>
          Condition on Z in the intervened model:{" "}
          <M>{"P(y \\mid \\mathrm{do}(x)) = \\sum_z P(y \\mid \\mathrm{do}(x), z)\\, P(z \\mid \\mathrm{do}(x))"}</M>. Rule 2 of m22.1.4
          turns <M>{"P(y \\mid \\mathrm{do}(x), z)"}</M> into <M>{"P(y \\mid x, z)"}</M>, since its condition{" "}
          <M>{"(Y \\perp X \\mid Z)"}</M> in <M>{"G_{\\underline{X}}"}</M> is the blocking half of the criterion. Rule 3 turns{" "}
          <M>{"P(z \\mid \\mathrm{do}(x))"}</M> into <M>{"P(z)"}</M>: in <M>{"G_{\\overline{X}}"}</M> every path from X leaves by an
          outgoing arrow, and since Z contains no descendant of X, no such path to Z follows the arrows all the way. So it has a
          collider, and with nothing conditioned on, a collider blocks the path.
        </p>
      </Proof>

      <Remark title="good and bad controls">
        <p>
          Adjusting for a descendant of X is never allowed by the criterion: a mediator removes part of the effect, and a
          consequence of both X and Y creates a collider path. Less obviously, a pre-treatment variable can be harmful. In the
          M-structure <M>{"X \\leftarrow A \\to C \\leftarrow B \\to Y"}</M>, the path through C is blocked without adjustment and
          opened by adjusting for C, so the empty set is valid and {"{C}"} is not; adding A or B to C blocks it again. The figure
          has all three cases. Adjusting for everything pre-treatment is a heuristic, not a theorem.
        </p>
      </Remark>

      <Theorem title="inverse propensity weighting">
        <p>
          Let <M>{"e(z) = P(X = x \\mid z) > 0"}</M> for every z, the propensity score. If Z satisfies the backdoor criterion, then{" "}
          <M>{"P(Y = 1 \\mid \\mathrm{do}(X = x)) = \\mathbb{E}\\big[\\mathbf 1[X = x]\\, Y / e(Z)\\big]"}</M> (<C>ipw_est</C>), which
          equals the adjustment formula (<C>adjust_est</C>).
        </p>
        <Code>{ESTIMATORS}</Code>
      </Theorem>
      <Proof>
        <p>
          Condition on Z: <M>{"\\mathbb{E}[\\mathbf 1[X = x] Y \\mid z] = e(z)\\, \\mathbb{E}[Y \\mid x, z]"}</M>, so dividing by{" "}
          <M>{"e(z)"}</M> and averaging over Z gives <M>{"\\sum_z P(z)\\, \\mathbb{E}[Y \\mid x, z]"}</M>. With discrete Z and
          propensities estimated by stratum frequencies, the two estimators agree exactly on any sample, as the code shows. They
          differ once e or the outcome regression is a fitted model, and the doubly robust estimator combines both so that it is
          consistent if either model is right.
        </p>
      </Proof>

      <Theorem title="the frontdoor criterion">
        <p>
          A set M satisfies the frontdoor criterion relative to (X, Y) if M intercepts every directed path from X to Y, there is
          no unblocked backdoor path from X to M, and every backdoor path from M to Y is blocked by X. If moreover{" "}
          <M>{"P(x, m) > 0"}</M> everywhere, then{" "}
          <M>{"P(y \\mid \\mathrm{do}(x)) = \\sum_m P(m \\mid x) \\sum_{x'} P(y \\mid m, x')\\, P(x')"}</M> (<C>frontdoor_est</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The three conditions are what the derivation in m22.1.4 used. The second gives{" "}
          <M>{"P(m \\mid \\mathrm{do}(x)) = P(m \\mid x)"}</M> by the backdoor theorem with the empty set. The third makes X a
          backdoor set for the effect of M on Y, so{" "}
          <M>{"P(y \\mid \\mathrm{do}(m)) = \\sum_{x'} P(y \\mid m, x')P(x')"}</M>. The first means all of X&apos;s influence on Y
          passes through M, and with the second it gives{" "}
          <M>{"P(y \\mid \\mathrm{do}(x)) = \\sum_m P(m \\mid \\mathrm{do}(x))\\,P(y \\mid \\mathrm{do}(m))"}</M>, by the rule 2 and
          rule 3 steps of m22.1.4. Substituting gives the formula.
        </p>
      </Proof>

      <Example title="choosing in practice">
        <p>
          In the figure, {"{W}"}, {"{W, A}"}, {"{W, B}"}, {"{W, C, A}"} and their like are valid, while any set with M, or with C
          but neither A nor B, gives a wrong answer. With many covariates, the conditional independencies the criterion needs
          cannot be read from the data, which is why identification in practice rests on stated graphs, and why the next lesson
          looks for variation in X that is as good as random.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          The graph has edges <M>{"Z_1 \\to X"}</M>, <M>{"Z_1 \\to Z_3"}</M>, <M>{"Z_2 \\to Z_3"}</M>, <M>{"Z_2 \\to Y"}</M>,{" "}
          <M>{"Z_3 \\to X"}</M>, <M>{"Z_3 \\to Y"}</M> and <M>{"X \\to Y"}</M>. How many subsets of{" "}
          <M>{"\\{Z_1, Z_2, Z_3\\}"}</M> satisfy the backdoor criterion relative to (X, Y)?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "bias",
      rung: "check",
      prompt: (
        <p>
          A binary Z has P(Z = 1) = 0.5 and is the only confounder. P(X = 1 | Z = 0) = 0.25 and P(X = 1 | Z = 1) = 0.75;
          P(Y = 1 | X = 1, Z = 0) = 0.4 and P(Y = 1 | X = 1, Z = 1) = 0.8. By how much does P(Y = 1 | X = 1) exceed{" "}
          <M>{"P(Y = 1 \\mid \\mathrm{do}(X = 1))"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 0.0005 },
    },
    {
      key: "mediator",
      rung: "apply",
      prompt: <p>Why does adjusting for a mediator M on the path X → M → Y bias the estimate of the total effect of X on Y?</p>,
      answer: {
        kind: "choice",
        options: [
          "M is a descendant of X; holding it fixed blocks the causal path through M, so only the direct part of the effect remains",
          "Because M is a collider",
          "Because adjusting for any variable increases variance",
          "Because the mediator opens a backdoor path into X",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def descendants(parents, X):
    out, grew = set(X), True
    while grew:
        grew = False
        for v, ps in parents.items():
            if v not in out and out & set(ps):
                out.add(v); grew = True
    return out

def d_sep(parents, A, B, C):
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

def is_backdoor(parents, x, y, Z):
    if Z & descendants(parents, {x}):
        return False                                           # no descendants of the treatment
    cut = {v: [p for p in ps if p != x] for v, ps in parents.items()}
    return d_sep(cut, {x}, {y}, Z)                             # with x's out-arrows cut, only backdoor paths remain

G = {"W": [], "X": ["W"], "M": ["X"], "Y": ["M", "W"]}
print(sorted(descendants(G, {"X"})), is_backdoor(G, "X", "Y", {"W"}), is_backdoor(G, "X", "Y", set()), is_backdoor(G, "X", "Y", {"W", "M"}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['M', 'X', 'Y'] True False False",
          "['M', 'Y'] True False False",
          "['M', 'X', 'Y'] True False True",
          "['M', 'X', 'Y'] True True False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def adjust_est(x, y, z, t):
    return sum(np.mean(y[(x == t) & (z == v)]) * np.mean(z == v) for v in np.unique(z))

def ipw_est(x, y, z, t):
    e = np.array([np.mean(x[z == v] == t) for v in z])        # propensity P(X = t | z) for each unit
    return float(np.mean((x == t) * y / e))

def frontdoor_est(x, m, y, t):
    return sum(np.mean(m[x == t] == mv) * sum(np.mean(y[(m == mv) & (x == xv)]) * np.mean(x == xv) for xv in np.unique(x))
               for mv in np.unique(m))

x, z, y = np.array([1, 1, 0, 0, 1, 0]), np.array([0, 1, 1, 0, 1, 1]), np.array([1, 0, 0, 0, 1, 1])
print(round(adjust_est(x, y, z, 1), 3), round(ipw_est(x, y, z, 1), 3), round(adjust_est(x, y, z, 0), 3), round(frontdoor_est(x, z, y, 1), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.667 0.667 0.333 0.5",
          "0.667 0.5 0.333 0.5",
          "0.667 0.667 0.0 0.5",
          "0.75 0.667 0.333 0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Graphs are dicts from vertex to list of parents. Write <C>descendants(parents, X)</C> for a set X (including X),{" "}
          <C>d_sep(parents, A, B, C)</C> and <C>is_backdoor(parents, x, y, Z)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def descendants(parents, X):
    return set(X)

def d_sep(parents, A, B, C):
    return True

def is_backdoor(parents, x, y, Z):
    return True
`,
        solution: CRITERION,
        tests: [
          { name: "desc", code: `assert descendants({"a": [], "b": ["a"], "c": ["b"], "d": []}, {"a"}) == {"a", "b", "c"}\nassert not d_sep({"a": [], "b": ["a"]}, {"a"}, {"b"}, set())` },
          { name: "backdoor", code: `G = {"Z1": [], "Z2": [], "Z3": ["Z1", "Z2"], "X": ["Z1", "Z3"], "Y": ["X", "Z2", "Z3"]}\nassert not is_backdoor(G, "X", "Y", {"Z3"}) and is_backdoor(G, "X", "Y", {"Z1", "Z3"}) and not is_backdoor(G, "X", "Y", set())\nH = {"X": [], "M": ["X"], "Y": ["M"]}\nassert is_backdoor(H, "X", "Y", set()) and not is_backdoor(H, "X", "Y", {"M"})` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With binary NumPy arrays, write <C>adjust_est(x, y, z, t)</C> and <C>ipw_est(x, y, z, t)</C>, estimating{" "}
          <M>{"P(Y = 1 \\mid \\mathrm{do}(X = t))"}</M> with backdoor set z (propensities from stratum frequencies), and{" "}
          <C>frontdoor_est(x, m, y, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def adjust_est(x, y, z, t):
    return float(np.mean(y[x == t]))

def ipw_est(x, y, z, t):
    return float(np.mean(y[x == t]))

def frontdoor_est(x, m, y, t):
    return float(np.mean(y[x == t]))
`,
        solution: ESTIMATORS,
        tests: [
          { name: "backdoor", code: `rows = []\nfor z, t, n, s in [(0, 1, 10, 8), (0, 0, 30, 12), (1, 1, 30, 12), (1, 0, 10, 1)]:\n    rows += [[z, t, 1]] * s + [[z, t, 0]] * (n - s)\nz, x, y = np.array(rows).T\nassert abs(adjust_est(x, y, z, 1) - 0.6) < 1e-9 and abs(ipw_est(x, y, z, 1) - 0.6) < 1e-9` },
          { name: "front", code: `r = np.random.default_rng(4); n = 200000; u = r.random(n) < 0.5\nx = (r.random(n) < 0.2 + 0.6 * u).astype(int); m = (r.random(n) < 0.1 + 0.7 * x).astype(int)\ny = (r.random(n) < 0.1 + 0.4 * m + 0.4 * u).astype(int)\nassert abs(frontdoor_est(x, m, y, 1) - 0.62) < 0.01` },
        ],
      },
    },
    {
      key: "mbias",
      rung: "stretch",
      prompt: (
        <p>
          A linear model has <M>{"A \\to X"}</M>, <M>{"A \\to C"}</M>, <M>{"B \\to C"}</M>, <M>{"B \\to Y"}</M> and{" "}
          <M>{"X \\to Y"}</M>, every coefficient 1 and every noise of variance 1. The true effect of X on Y is 1. What is the
          population coefficient of X when Y is regressed on X and C? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Both criteria need the confounders, or a clean mediator, to be measured. When neither is available, a different kind
        of variable can still help: one that moves X but has no other route to Y. The next lesson studies these instrumental
        variables, and what they can and cannot identify.
      </p>
    </>
  ),
};
