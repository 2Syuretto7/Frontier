import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TwoScmViz } from "@/components/viz/TwoScmViz";
import type { LessonContent } from "@/lib/types";

const LINEAR = `import numpy as np

def linear_cov(B, sd):
    M = np.linalg.inv(np.eye(len(B)) - B)                      # x = Bx + u  gives  x = (I - B)^{-1} u
    return M @ np.diag(np.asarray(sd) ** 2) @ M.T

def sample_linear(B, sd, n, seed=0):
    U = np.random.default_rng(seed).normal(size=(n, len(B))) * sd
    return U @ np.linalg.inv(np.eye(len(B)) - B).T             # one sample per row

def regress(S, i, j):
    return S[i, j] / S[j, j]                                   # slope of X_i on X_j alone`;

const DISCRETE = `from collections import defaultdict

def evaluate(mechs, order, u):
    x = {}
    for v in order:
        x[v] = mechs[v](x, u[v])                               # each variable from its parents and its own noise
    return x

def distribution(mechs, order, pu):
    out = defaultdict(float)
    for u, p in pu:
        x = evaluate(mechs, order, u)
        out[tuple(x[v] for v in order)] += p                   # push the noise distribution forward
    return dict(out)

def marginal(dist, order, v):
    i, out = order.index(v), defaultdict(float)
    for key, p in dist.items():
        out[key[i]] += p
    return dict(out)`;

export const lesson: LessonContent = {
  id: "m22.1.2",
  minutes: 50,
  links: {
    requires: ["m22.1.1", "m7.3.4"],
    revisits: ["m7.5.2", "m9.6.1"],
    foreshadows: ["m22.1.3", "m22.3.2"],
  },

  puzzle: (
    <>
      <p>
        Height and weight in a population follow a bivariate normal distribution with correlation 0.8. One story says height
        drives weight; another says weight drives height. Both fit every observation perfectly. They disagree about what
        happens if we feed people more. What extra object, beyond the joint distribution and beyond the graph, settles that
        question, and how much of it can observational data ever recover?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A structural causal model writes each variable as a function of its direct causes and an independent noise term, the
        stand-in for everything not modelled. Run the equations in causal order and the noise distribution is pushed forward to
        a joint distribution of the variables. Different sets of equations can push forward to the same joint distribution, as
        the two models in the figure do, yet they disagree as soon as an equation is replaced by an intervention. The equations
        carry the causal content; the distribution is only their shadow.
      </p>
      <TwoScmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="structural causal model">
        <p>
          A structural causal model consists of structural assignments
        </p>
        <MD>{"X_j := f_j(X_{\\mathrm{pa}(j)}, U_j), \\qquad j = 1, \\dots, n,"}</MD>
        <p>
          and a distribution of jointly independent noise variables <M>{"U_1, \\dots, U_n"}</M>. Its causal graph has an edge{" "}
          <M>{"X_i \\to X_j"}</M> whenever <M>{"f_j"}</M> depends on <M>{"X_i"}</M>, and is assumed acyclic. Evaluating the
          assignments in causal order (<C>evaluate</C>) gives each X as a function of U, so the model entails a distribution of X,
          the pushforward of the noise distribution (<C>distribution</C>, <C>marginal</C>, m7.3.4).
        </p>
        <Code>{DISCRETE}</Code>
      </Definition>

      <Theorem title="the entailed distribution is Markov">
        <p>The distribution entailed by a structural causal model is Markov with respect to its causal graph.</p>
      </Theorem>
      <Proof>
        <p>
          Every non-descendant of <M>{"X_j"}</M>, and every parent, is a function of the noise variables of non-descendants of{" "}
          <M>{"X_j"}</M>, by induction along the causal order. These do not include <M>{"U_j"}</M>, so <M>{"U_j"}</M> is
          independent of the non-descendants and parents jointly. Given the parents, <M>{"X_j = f_j(x_{\\mathrm{pa}(j)}, U_j)"}</M>{" "}
          is a function of <M>{"U_j"}</M> alone, so its conditional distribution does not depend on the other non-descendants.
        </p>
      </Proof>

      <Example title="linear models">
        <p>
          With <M>{"X = BX + U"}</M>, where <M>{"B_{ij}"}</M> is the effect of <M>{"X_j"}</M> on <M>{"X_i"}</M> and B is strictly
          lower triangular in a causal order, <M>{"X = (I - B)^{-1}U"}</M> (<C>sample_linear</C>), so{" "}
          <M>{"\\mathrm{Cov}(X) = (I - B)^{-1}D(I - B)^{-\\top}"}</M> with D the diagonal of noise variances (<C>linear_cov</C>,
          m7.5.2). Regressing an effect on its only cause recovers the structural coefficient (<C>regress</C>, m9.6.1); regressing
          the cause on the effect gives a perfectly good slope that has no causal meaning.
        </p>
        <Code>{LINEAR}</Code>
      </Example>

      <Theorem title="linear Gaussian direction is not identifiable">
        <p>
          Every distribution entailed by a linear Gaussian model <M>{"X \\to Y"}</M> is also entailed by a linear Gaussian model{" "}
          <M>{"Y \\to X"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The entailed (X, Y) is bivariate normal with mean zero. Let{" "}
          <M>{"b = \\mathrm{Cov}(X, Y)/\\mathrm{Var}(Y)"}</M> and <M>{"R = X - bY"}</M>. Then R is normal and uncorrelated with Y,
          and for jointly normal variables uncorrelated means independent. So <M>{"Y := V"}</M>, <M>{"X := bY + R"}</M> with
          independent normal noises V and R entails the same joint distribution. The figure shows this with correlation 0.8.
          Identifiability returns with non-Gaussian noise or nonlinear assignments, which m22.4.2 exploits.
        </p>
      </Proof>

      <Remark title="the ladder of causation">
        <p>
          Pearl separates three kinds of question: what is seen (observational distribution), what happens if we act
          (interventions, m22.1.3), and what would have happened (counterfactuals, m22.3.2). A structural causal model answers all
          three. Two models can agree on the first and differ on the second, as in the figure, and m22.3.2 shows two that agree
          on the first two and differ on the third. Independence of the noise variables is a real assumption: it says no hidden
          common cause has been left out, and dropping it is what makes identification in Chapter 2 necessary.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "var",
      rung: "check",
      prompt: (
        <p>
          In the model <M>{"X := U_1"}</M>, <M>{"Y := 2X + U_2"}</M>, <M>{"Z := Y - X + U_3"}</M> with independent noises of variance 1,
          what is <M>{"\\mathrm{Var}(Z)"}</M>?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0005 },
    },
    {
      key: "back",
      rung: "check",
      prompt: (
        <p>
          In the model <M>{"X := U_1"}</M>, <M>{"Y := 2X + U_2"}</M> with independent noises of variance 1, what is the slope of the
          least-squares regression of X on Y?
        </p>
      ),
      answer: { kind: "numeric", value: 0.4, tolerance: 0.0005 },
    },
    {
      key: "same",
      rung: "apply",
      prompt: <p>Two structural causal models entail the same joint distribution of all their variables. What follows?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing about interventions: they can still give different distributions when an assignment is replaced",
          "They have the same causal graph",
          "They have the same structural assignments up to relabelling the noise",
          "They agree on every intervention but may differ on counterfactuals",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def linear_cov(B, sd):
    M = np.linalg.inv(np.eye(len(B)) - B)                      # x = Bx + u  gives  x = (I - B)^{-1} u
    return M @ np.diag(np.asarray(sd) ** 2) @ M.T

def sample_linear(B, sd, n, seed=0):
    U = np.random.default_rng(seed).normal(size=(n, len(B))) * sd
    return U @ np.linalg.inv(np.eye(len(B)) - B).T             # one sample per row

def regress(S, i, j):
    return S[i, j] / S[j, j]                                   # slope of X_i on X_j alone

B = np.array([[0.0, 0.0], [3.0, 0.0]]); S = linear_cov(B, [1.0, 2.0])
print(S.tolist(), regress(S, 1, 0), round(regress(S, 0, 1), 3), sample_linear(B, [1.0, 0.0], 3, 1)[:, 1].round(3).tolist() == (3 * sample_linear(B, [1.0, 0.0], 3, 1)[:, 0]).round(3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 3.0], [3.0, 13.0]] 3.0 0.231 True",
          "[[1.0, 3.0], [3.0, 11.0]] 3.0 0.273 True",
          "[[1.0, 3.0], [3.0, 13.0]] 3.0 0.333 True",
          "[[1.0, 3.0], [3.0, 13.0]] 0.231 3.0 True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import defaultdict

def evaluate(mechs, order, u):
    x = {}
    for v in order:
        x[v] = mechs[v](x, u[v])                               # each variable from its parents and its own noise
    return x

def distribution(mechs, order, pu):
    out = defaultdict(float)
    for u, p in pu:
        x = evaluate(mechs, order, u)
        out[tuple(x[v] for v in order)] += p                   # push the noise distribution forward
    return dict(out)

def marginal(dist, order, v):
    i, out = order.index(v), defaultdict(float)
    for key, p in dist.items():
        out[key[i]] += p
    return dict(out)

mechs = {"X": lambda x, u: u, "Y": lambda x, u: x["X"] ^ u}; pu = [({"X": a, "Y": b}, 0.5 * (0.25 if b else 0.75)) for a in (0, 1) for b in (0, 1)]
d = distribution(mechs, ["X", "Y"], pu); print(evaluate(mechs, ["X", "Y"], {"X": 1, "Y": 1}), d[(1, 0)], marginal(d, ["X", "Y"], "Y"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'X': 1, 'Y': 0} 0.125 {0: 0.5, 1: 0.5}",
          "{'X': 1, 'Y': 1} 0.125 {0: 0.5, 1: 0.5}",
          "{'X': 1, 'Y': 0} 0.375 {0: 0.5, 1: 0.5}",
          "{'X': 1, 'Y': 0} 0.125 {0: 0.75, 1: 0.25}",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For the linear model <M>{"X = BX + U"}</M> with noise standard deviations sd, write <C>linear_cov(B, sd)</C>,{" "}
          <C>sample_linear(B, sd, n, seed)</C> returning one sample per row, and <C>regress(S, i, j)</C>, the slope of{" "}
          <M>{"X_i"}</M> on <M>{"X_j"}</M> alone from the covariance S.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def linear_cov(B, sd):
    return np.diag(np.asarray(sd) ** 2)

def sample_linear(B, sd, n, seed=0):
    return np.random.default_rng(seed).normal(size=(n, len(B))) * sd

def regress(S, i, j):
    return S[i, j]
`,
        solution: LINEAR,
        tests: [
          { name: "cov", code: `B = np.array([[0.0, 0, 0], [2, 0, 0], [0, -1, 0]]); S = linear_cov(B, [1.0, 1, 1])\nassert np.allclose(S, [[1, 2, -2], [2, 5, -5], [-2, -5, 6]]) and abs(regress(S, 2, 1) + 1) < 1e-12` },
          { name: "sample", code: `B = np.array([[0.0, 0, 0], [2, 0, 0], [0, -1, 0]]); X = sample_linear(B, [1.0, 1, 1], 200000, 3)\nassert X.shape == (200000, 3) and np.allclose(np.cov(X.T), [[1, 2, -2], [2, 5, -5], [-2, -5, 6]], atol=0.1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Mechanisms are a dict of functions <C>f(x, u)</C> of the values so far and the variable&apos;s own noise. Write{" "}
          <C>evaluate(mechs, order, u)</C>, <C>distribution(mechs, order, pu)</C> for a list of (noise dict, probability) pairs,
          keyed by tuples of values in order, and <C>marginal(dist, order, v)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def evaluate(mechs, order, u):
    return dict(u)

def distribution(mechs, order, pu):
    return {}

def marginal(dist, order, v):
    return {}
`,
        solution: DISCRETE,
        tests: [
          { name: "eval", code: `m = {"a": lambda x, u: u, "b": lambda x, u: x["a"] + u}\nassert evaluate(m, ["a", "b"], {"a": 2, "b": 3}) == {"a": 2, "b": 5}` },
          { name: "dist", code: `m = {"X": lambda x, u: u, "Y": lambda x, u: x["X"] & u}; pu = [({"X": a, "Y": b}, 0.25) for a in (0, 1) for b in (0, 1)]\nd = distribution(m, ["X", "Y"], pu)\nassert d == {(0, 0): 0.5, (1, 0): 0.25, (1, 1): 0.25} and marginal(d, ["X", "Y"], "Y") == {0: 0.75, 1: 0.25}` },
        ],
      },
    },
    {
      key: "or",
      rung: "stretch",
      prompt: (
        <p>
          In the model <M>{"X := U_1"}</M>, <M>{"Y := X \\lor U_2"}</M> with independent <M>{"U_1 \\sim \\mathrm{Bernoulli}(0.3)"}</M> and{" "}
          <M>{"U_2 \\sim \\mathrm{Bernoulli}(0.2)"}</M>, what is <M>{"P(X = 1 \\mid Y = 1)"}</M>? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.682, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The figure already performed interventions by replacing an assignment with a constant. The next lesson makes that
        operation precise, the do-operator, and shows how the interventional distribution follows from the graph and the
        observational one when every variable is measured.
      </p>
    </>
  ),
};
