import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SimpsonViz } from "@/components/viz/SimpsonViz";
import type { LessonContent } from "@/lib/types";

const DO = `from itertools import product

def truncated(parents, cpt, x, do):
    if any(x[v] != val for v, val in do.items()):
        return 0.0                                             # the intervened variables are fixed
    p = 1.0
    for v, pa in parents.items():
        if v in do: continue                                   # their own factors are dropped
        q = cpt[v][tuple(x[u] for u in pa)]
        p *= q if x[v] else 1 - q
    return p

def p_do(parents, cpt, query, do):
    names, total = list(parents), 0.0
    for vals in product([0, 1], repeat=len(names)):
        x = dict(zip(names, vals))
        if all(x[k] == v for k, v in query.items()):
            total += truncated(parents, cpt, x, do)
    return total

def ace(parents, cpt, y, t):
    return p_do(parents, cpt, {y: 1}, {t: 1}) - p_do(parents, cpt, {y: 1}, {t: 0})`;

const ADJUST = `import numpy as np
from itertools import product

def p_cond(D, y, cond):
    m = np.ones(len(D), bool)
    for c, v in cond.items():
        m &= D[:, c] == v
    return float(D[m, y].mean())                               # P(column y = 1 | cond) from 0/1 data

def adjust(D, y, t, zs, tv):
    total = 0.0
    for zv in product([0, 1], repeat=len(zs)):
        cond = dict(zip(zs, zv))
        pz = np.mean(np.all(D[:, zs] == zv, axis=1)) if zs else 1.0
        if pz > 0:
            total += p_cond(D, y, {t: tv, **cond}) * pz       # sum_z P(y | t, z) P(z)
    return total

def effect(D, y, t, zs):
    return adjust(D, y, t, zs, 1) - adjust(D, y, t, zs, 0)`;

export const lesson: LessonContent = {
  id: "m22.1.3",
  minutes: 55,
  links: {
    requires: ["m22.1.2", "m9.8.5"],
    revisits: ["m7.1.3", "l2.7.1"],
    foreshadows: ["m22.1.4", "m22.2.1"],
  },

  puzzle: (
    <>
      <p>
        In a study of 700 kidney stone patients, treatment A cured 78% and treatment B cured 83%. Split by stone size, A did
        better than B for small stones and better than B for large stones. Which treatment should the next patient receive,
        whose stone size we know, and which should a hospital adopt for everyone? And what exactly is the difference between
        the probability of a cure among patients who got A and the probability of a cure if we give A?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Observing that a patient got A tells us something about the patient: here, that their stone was probably large, since
        doctors kept A for hard cases. Giving A ourselves tells us nothing of the kind. An intervention replaces the mechanism
        that chose the treatment with our own choice and leaves every other mechanism alone. With all the relevant variables
        measured, the effect of that replacement can be computed from observational data, by averaging the cure rates within
        each stone size over the whole population instead of over those who happened to receive each treatment.
      </p>
      <SimpsonViz />
    </>
  ),

  theory: (
    <>
      <Definition title="intervention">
        <p>
          In a structural causal model, the intervention <M>{"\\mathrm{do}(X_k = a)"}</M> replaces the assignment of{" "}
          <M>{"X_k"}</M> by <M>{"X_k := a"}</M> and keeps all the others. The resulting model has the graph with every arrow into{" "}
          <M>{"X_k"}</M> removed, and its entailed distribution is the interventional distribution{" "}
          <M>{"P(\\cdot \\mid \\mathrm{do}(X_k = a))"}</M>. Interventions on several variables replace several assignments.
        </p>
      </Definition>

      <Theorem title="truncated factorisation">
        <p>
          If P is entailed by a model with causal graph G and <M>{"P(x_k \\mid x_{\\mathrm{pa}(k)}) > 0"}</M>, then
        </p>
        <MD>{"p(x \\mid \\mathrm{do}(X_k = a)) = \\mathbf 1[x_k = a]\\prod_{j \\ne k} p(x_j \\mid x_{\\mathrm{pa}(j)})"}</MD>
        <p>
          with the observational conditionals (<C>truncated</C>, <C>p_do</C>).
        </p>
        <Code>{DO}</Code>
      </Theorem>
      <Proof>
        <p>
          The intervened model is Markov with respect to its own graph by m22.1.2, so its distribution factorises over that
          graph. Its factor for <M>{"X_k"}</M> is the point mass at a. For <M>{"j \\ne k"}</M>, the assignment{" "}
          <M>{"f_j"}</M> and the noise <M>{"U_j"}</M> are unchanged and <M>{"U_j"}</M> is still independent of the parents, so the
          conditional of <M>{"X_j"}</M> given its parents is the law of <M>{"f_j(x_{\\mathrm{pa}(j)}, U_j)"}</M> in both models. The
          positivity condition ensures the observational conditional is defined wherever it is needed.
        </p>
      </Proof>

      <Theorem title="adjusting for the parents">
        <p>
          For an outcome Y that is not a parent of X,{" "}
          <M>{"p(y \\mid \\mathrm{do}(X = a)) = \\sum_{z} p(y \\mid a, z)\\, p(z)"}</M> where z ranges over the values of the
          parents of X (<C>adjust</C>). Without parents, <M>{"p(y \\mid \\mathrm{do}(X = a)) = p(y \\mid X = a)"}</M>.
        </p>
        <Code>{ADJUST}</Code>
      </Theorem>
      <Proof>
        <p>
          Let r denote all variables other than X and its parents z. The observational joint density at X = a is{" "}
          <M>{"p(z)\,p(a \mid z)\,p(r \mid a, z)"}</M>, and the truncated factorisation is this product with the factor{" "}
          <M>{"p(a \mid z)"}</M> removed, so <M>{"p(z, r \mid \mathrm{do}(X = a)) = p(z)\,p(r \mid a, z)"}</M>. Summing over
          every part of r except Y gives <M>{"p(z)\,p(y \mid a, z)"}</M>. Then sum over z. Compare the conditional{" "}
          <M>{"p(y \\mid a) = \\sum_z p(y \\mid a, z)\\, p(z \\mid a)"}</M>: the weights differ, and they agree when X has no parents.
        </p>
      </Proof>

      <Definition title="average causal effect">
        <p>
          For binary X and Y, the average causal effect is{" "}
          <M>{"P(Y = 1 \\mid \\mathrm{do}(X = 1)) - P(Y = 1 \\mid \\mathrm{do}(X = 0))"}</M> (<C>ace</C>, <C>effect</C>). A randomised
          experiment (m9.8.5) sets X by a coin, which removes every arrow into X, so its conditional cure rates are interventional
          ones and the plain difference of means estimates the average causal effect.
        </p>
      </Definition>

      <Example title="kidney stones">
        <p>
          With S the stone size, <M>{"S \\to T"}</M> because doctors chose by size and <M>{"S \\to \\text{cure}"}</M> because large
          stones are harder. Of 700 patients 357 had small stones, so{" "}
          <M>{"P(\\text{cure} \\mid \\mathrm{do}(A)) = 0.51 \\cdot \\tfrac{81}{87} + 0.49 \\cdot \\tfrac{192}{263} \\approx 0.83"}</M>{" "}
          and the same for B gives about 0.78. The conditional rates, 0.78 and 0.83, weight the strata by who received each
          treatment, and A went mostly to large stones. The reversal is Simpson&apos;s paradox, and the graph says which number
          answers the causal question. If instead the third variable were a consequence of treatment, such as a post-operative
          measurement, adjusting for it would be wrong: the graph, not the data, decides.
        </p>
      </Example>

      <Remark title="what an intervention leaves alone">
        <p>
          Intervening on X changes only descendants of X: for a non-descendant Z, <M>{"P(Z \\mid \\mathrm{do}(X)) = P(Z)"}</M>, as
          the factorisation shows. This asymmetry is what lets experiments reveal direction, and what the conditional{" "}
          <M>{"P(Z \\mid X)"}</M> lacks (m7.1.3). The next lesson asks which interventional quantities can be computed when some
          variables are not observed.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "do",
      rung: "check",
      prompt: (
        <p>
          Binary Z, X, Y with <M>{"Z \\to X"}</M>, <M>{"Z \\to Y"}</M>, <M>{"X \\to Y"}</M>; P(Z = 1) = 0.5; P(X = 1 | Z = 0) = 0.2,
          P(X = 1 | Z = 1) = 0.8; P(Y = 1 | X, Z) is 0.1, 0.3, 0.5, 0.7 for (X, Z) = (0, 0), (1, 0), (0, 1), (1, 1). What is{" "}
          <M>{"P(Y = 1 \\mid \\mathrm{do}(X = 1))"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0005 },
    },
    {
      key: "obs",
      rung: "check",
      prompt: <p>In the same model, what is the conditional probability P(Y = 1 | X = 1)?</p>,
      answer: { kind: "numeric", value: 0.62, tolerance: 0.0005 },
    },
    {
      key: "post",
      rung: "apply",
      prompt: <p>A drug lowers blood pressure, and blood pressure affects recovery. Why should the effect of the drug on recovery not be adjusted for blood pressure measured after treatment?</p>,
      answer: {
        kind: "choice",
        options: [
          "Blood pressure is a descendant of the treatment, so adjusting for it removes part of the effect being measured instead of a confounding path",
          "Because blood pressure is continuous and adjustment needs discrete variables",
          "Because adjustment is only valid in randomised experiments",
          "Because blood pressure is a parent of the treatment",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def truncated(parents, cpt, x, do):
    if any(x[v] != val for v, val in do.items()):
        return 0.0                                             # the intervened variables are fixed
    p = 1.0
    for v, pa in parents.items():
        if v in do: continue                                   # their own factors are dropped
        q = cpt[v][tuple(x[u] for u in pa)]
        p *= q if x[v] else 1 - q
    return p

def p_do(parents, cpt, query, do):
    names, total = list(parents), 0.0
    for vals in product([0, 1], repeat=len(names)):
        x = dict(zip(names, vals))
        if all(x[k] == v for k, v in query.items()):
            total += truncated(parents, cpt, x, do)
    return total

def ace(parents, cpt, y, t):
    return p_do(parents, cpt, {y: 1}, {t: 1}) - p_do(parents, cpt, {y: 1}, {t: 0})

G = {"Z": [], "X": ["Z"], "Y": ["X", "Z"]}; cpt = {"Z": {(): 0.5}, "X": {(0,): 0.1, (1,): 0.9}, "Y": {(0, 0): 0.2, (1, 0): 0.4, (0, 1): 0.6, (1, 1): 0.8}}
print(truncated(G, cpt, {"Z": 1, "X": 0, "Y": 1}, {"X": 0}), round(p_do(G, cpt, {"Y": 1}, {"X": 1}), 3), round(ace(G, cpt, "Y", "X"), 3), p_do(G, cpt, {"Z": 1}, {"X": 1}))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3 0.6 0.2 0.5",
          "0.27 0.6 0.2 0.5",
          "0.3 0.76 0.2 0.5",
          "0.3 0.6 0.2 0.9",
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
from itertools import product

def p_cond(D, y, cond):
    m = np.ones(len(D), bool)
    for c, v in cond.items():
        m &= D[:, c] == v
    return float(D[m, y].mean())                               # P(column y = 1 | cond) from 0/1 data

def adjust(D, y, t, zs, tv):
    total = 0.0
    for zv in product([0, 1], repeat=len(zs)):
        cond = dict(zip(zs, zv))
        pz = np.mean(np.all(D[:, zs] == zv, axis=1)) if zs else 1.0
        if pz > 0:
            total += p_cond(D, y, {t: tv, **cond}) * pz       # sum_z P(y | t, z) P(z)
    return total

def effect(D, y, t, zs):
    return adjust(D, y, t, zs, 1) - adjust(D, y, t, zs, 0)

D = np.array([[0, 1, 1], [0, 1, 0], [1, 0, 1], [1, 1, 1], [1, 1, 1], [0, 0, 0]])
print(p_cond(D, 2, {1: 1}), round(p_cond(D, 2, {0: 1, 1: 1}), 3), adjust(D, 2, 1, [0], 1), round(effect(D, 2, 1, [0]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.75 1.0 0.75 0.25",
          "0.75 1.0 0.875 0.25",
          "0.5 1.0 0.75 0.25",
          "0.75 1.0 0.75 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For binary networks given by parent lists and tables of P(v = 1 | parents), write <C>truncated(parents, cpt, x, do)</C>,{" "}
          <C>p_do(parents, cpt, query, do)</C> and <C>ace(parents, cpt, y, t)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def truncated(parents, cpt, x, do):
    p = 1.0
    for v, pa in parents.items():
        q = cpt[v][tuple(x[u] for u in pa)]
        p *= q if x[v] else 1 - q
    return p

def p_do(parents, cpt, query, do):
    return 0.0

def ace(parents, cpt, y, t):
    return 0.0
`,
        solution: DO,
        tests: [
          { name: "trunc", code: `G = {"A": [], "B": ["A"]}; cpt = {"A": {(): 0.3}, "B": {(0,): 0.1, (1,): 0.6}}\nassert abs(truncated(G, cpt, {"A": 1, "B": 1}, {"B": 1}) - 0.3) < 1e-12 and truncated(G, cpt, {"A": 1, "B": 0}, {"B": 1}) == 0\nassert abs(truncated(G, cpt, {"A": 1, "B": 1}, {}) - 0.18) < 1e-12` },
          { name: "ace", code: `G = {"Z": [], "X": ["Z"], "Y": ["X", "Z"]}\ncpt = {"Z": {(): 0.4}, "X": {(0,): 0.3, (1,): 0.7}, "Y": {(0, 0): 0.2, (1, 0): 0.5, (0, 1): 0.4, (1, 1): 0.9}}\nassert abs(ace(G, cpt, "Y", "X") - 0.38) < 1e-12 and abs(p_do(G, cpt, {"Z": 1}, {"X": 0}) - 0.4) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          D is an array of 0/1 data with one column per variable. Write <C>p_cond(D, y, cond)</C>,{" "}
          <C>adjust(D, y, t, zs, tv)</C> estimating <M>{"P(y = 1 \\mid \\mathrm{do}(t = tv))"}</M> by adjusting for the columns zs,
          and <C>effect(D, y, t, zs)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from itertools import product

def p_cond(D, y, cond):
    return float(D[:, y].mean())

def adjust(D, y, t, zs, tv):
    return p_cond(D, y, {t: tv})

def effect(D, y, t, zs):
    return adjust(D, y, t, zs, 1) - adjust(D, y, t, zs, 0)
`,
        solution: ADJUST,
        tests: [
          { name: "cond", code: `D = np.array([[1, 0, 1], [1, 0, 0], [1, 1, 1], [0, 0, 0]])\nassert abs(p_cond(D, 2, {0: 1, 1: 0}) - 0.5) < 1e-12 and p_cond(D, 2, {1: 1}) == 1.0` },
          { name: "adjust", code: `rows = []\nfor z, t, n, s in [(0, 1, 20, 15), (0, 0, 30, 20), (1, 1, 30, 9), (1, 0, 20, 4)]:\n    rows += [[z, t, 1]] * s + [[z, t, 0]] * (n - s)\nD = np.array(rows)\nassert abs(effect(D, 2, 1, [0]) - (0.525 - 0.5 * 2 / 3 - 0.1)) < 1e-9 and abs(effect(D, 2, 1, [])) < 1e-12` },
        ],
      },
    },
    {
      key: "simpson",
      rung: "stretch",
      prompt: (
        <p>
          In stratum Z = 0, 10 treated patients had 8 successes and 40 untreated had 28. In stratum Z = 1, 40 treated had 16
          successes and 10 untreated had 3. Assuming Z is the only common cause of treatment and outcome, what is the average
          causal effect of treatment? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Adjusting for the parents needs the parents to be measured. When some causes are hidden, the question becomes which
        interventional quantities can still be expressed in terms of observed ones. The do-calculus, in the next lesson, gives
        three rules that answer it completely.
      </p>
    </>
  ),
};
