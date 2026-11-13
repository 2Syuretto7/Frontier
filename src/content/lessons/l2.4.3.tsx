import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AdaWeightViz } from "@/components/viz/AdaWeightViz";
import type { LessonContent } from "@/lib/types";

const ADA = `import numpy as np

def stump_predict(X, j, t, s):
    return np.where(X[:, j] <= t, s, -s)

def best_stump(X, y, w):
    best = (np.inf, 0, 0.0, 1)
    for j in range(X.shape[1]):
        for t in np.unique(X[:, j]):
            for s in (1, -1):
                err = float(w[stump_predict(X, j, t, s) != y].sum())
                best = min(best, (err, j, float(t), s))
    return best

def adaboost(X, y, rounds):
    w = np.full(len(y), 1 / len(y)); model = []
    for _ in range(rounds):
        err, j, t, s = best_stump(X, y, w)
        err = max(err, 1e-12)
        a = 0.5 * np.log((1 - err) / err)
        w = w * np.exp(-a * y * stump_predict(X, j, t, s)); w = w / w.sum()
        model.append((float(a), j, t, s, err))
    return model`;

const LOSS = `import numpy as np

def boost_score(model, X):
    return sum(m[0] * np.where(X[:, m[1]] <= m[2], m[3], -m[3]) for m in model)

def train_error_bound(errs):
    return float(np.prod([2 * np.sqrt(e * (1 - e)) for e in errs]))

def exp_loss(score, y):
    return float(np.mean(np.exp(-y * score)))`;

export const lesson: LessonContent = {
  id: "l2.4.3",
  minutes: 55,
  links: {
    requires: ["l2.4.1", "l2.1.4"],
    revisits: ["l2.4.2", "l2.2.3"],
    foreshadows: ["l2.4.4"],
  },

  puzzle: (
    <>
      <p>
        A decision stump, one threshold on one feature, is barely better than guessing on most problems. In 1990 it was an
        open question whether any procedure could combine such weak rules into an arbitrarily accurate classifier. AdaBoost
        answered yes with a few lines of code. How can rules that are each only slightly better than chance add up to a
        perfect fit on the training set?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Fit a weak rule, then make the points it got wrong count more, so that the next rule is forced to work on them. Each
        rule gets a vote proportional to how good it was. Every round multiplies the exponential loss by a factor below 1
        whenever the new rule beats chance on the reweighted data, so the loss, and with it the training error, falls
        geometrically.
      </p>
      <AdaWeightViz />
    </>
  ),

  theory: (
    <>
      <Definition title="AdaBoost">
        <p>
          With labels <M>{"y_i \\in \\{-1, +1\\}"}</M>, start from weights <M>{"w_i = 1/n"}</M>. For t = 1, …, T:
        </p>
        <ul>
          <li>fit a weak classifier <M>{"h_t"}</M> minimising the weighted error <M>{"\\varepsilon_t = \\sum_i w_i[h_t(x_i) \\neq y_i]"}</M>;</li>
          <li>set <M>{"\\alpha_t = \\tfrac12\\log\\frac{1 - \\varepsilon_t}{\\varepsilon_t}"}</M>;</li>
          <li>update <M>{"w_i \\leftarrow w_i e^{-\\alpha_ty_ih_t(x_i)}/Z_t"}</M>, with <M>{"Z_t"}</M> making the weights sum to 1.</li>
        </ul>
        <p>Predict with the sign of <M>{"F(x) = \\sum_t \\alpha_th_t(x)"}</M>.</p>
      </Definition>

      <Theorem title="the training error falls geometrically">
        <p>With <M>{"\\gamma_t = \\tfrac12 - \\varepsilon_t"}</M>, the training error of sign(F) satisfies</p>
        <MD>{"\\frac1n\\sum_i [\\,y_iF(x_i) \\leq 0\\,] \\leq \\frac1n\\sum_i e^{-y_iF(x_i)} = \\prod_{t=1}^T Z_t = \\prod_{t=1}^T 2\\sqrt{\\varepsilon_t(1 - \\varepsilon_t)} \\leq \\exp\\Big(-2\\sum_t\\gamma_t^2\\Big)."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first inequality holds term by term, since <M>{"e^{-z} \\geq 1"}</M> when z ≤ 0. Unrolling the updates,{" "}
          <M>{"w_i^{(T+1)} = \\frac{e^{-y_iF(x_i)}}{n\\prod_t Z_t}"}</M>, and these weights sum to 1, which gives the
          equality. Next,{" "}
          <M>{"Z_t = (1 - \\varepsilon_t)e^{-\\alpha_t} + \\varepsilon_te^{\\alpha_t}"}</M>, since correct points are multiplied
          by <M>{"e^{-\\alpha_t}"}</M> and wrong ones by <M>{"e^{\\alpha_t}"}</M>; at the chosen <M>{"\\alpha_t"}</M> both
          terms equal <M>{"\\sqrt{\\varepsilon_t(1 - \\varepsilon_t)}"}</M>. Finally{" "}
          <M>{"2\\sqrt{\\varepsilon_t(1 - \\varepsilon_t)} = \\sqrt{1 - 4\\gamma_t^2} \\leq e^{-2\\gamma_t^2}"}</M> using{" "}
          <M>{"1 - u \\leq e^{-u}"}</M>.
        </p>
        <Code>{ADA}</Code>
      </Proof>
      <Remark title="reading the bound">
        <p>
          If every weak learner has an edge of at least γ over chance on its own reweighted data, the training error is at
          most <M>{"e^{-2T\\gamma^2}"}</M>, which falls below 1/n, and hence to exactly 0, after about{" "}
          <M>{"\\log(n)/(2\\gamma^2)"}</M> rounds. The equality of the exponential loss and <M>{"\\prod Z_t"}</M> is visible in
          the code: on the six-point example both are 0.6086.
        </p>
      </Remark>

      <Theorem title="AdaBoost minimises exponential loss stagewise">
        <p>
          Given the current score F, choosing h and α to minimise <M>{"\\sum_i e^{-y_i(F(x_i) + \\alpha h(x_i))}"}</M> gives
          the h with the smallest weighted error under <M>{"w_i \\propto e^{-y_iF(x_i)}"}</M> and the AdaBoost{" "}
          <M>{"\\alpha"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Factor the objective as <M>{"\\sum_i w_ie^{-\\alpha y_ih(x_i)} = e^{-\\alpha}(1 - \\varepsilon) + e^{\\alpha}\\varepsilon"}</M>{" "}
          up to the positive normaliser, where ε is the weighted error of h. For α &gt; 0 this is{" "}
          <M>{"e^{-\\alpha} + (e^{\\alpha} - e^{-\\alpha})\\varepsilon"}</M>, increasing in ε, so the best h minimises ε.
          Differentiating in α, <M>{"-e^{-\\alpha}(1 - \\varepsilon) + e^{\\alpha}\\varepsilon = 0"}</M> gives{" "}
          <M>{"e^{2\\alpha} = (1 - \\varepsilon)/\\varepsilon"}</M>, the stated α; the function is convex in α, so this is the
          minimum.
        </p>
        <Code>{LOSS}</Code>
      </Proof>
      <Remark title="what the exponential loss implies">
        <p>
          The population minimiser of <M>{"\\mathbb E\\,e^{-YF(x)}"}</M> is <M>{"F(x) = \\tfrac12\\log\\frac{P(Y = 1 \\mid x)}{P(Y = -1 \\mid x)}"}</M>,
          half the log-odds, so boosting estimates the same quantity as logistic regression. But the exponential loss grows
          much faster than log loss for badly misclassified points, so mislabelled examples soon carry most of the weight,
          which makes AdaBoost fragile under label noise. Replacing the loss is the idea of the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "alpha",
      rung: "check",
      prompt: <p>A stump has weighted error 0.25. What is its vote α? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.5493, tolerance: 0.0001 },
    },
    {
      key: "z",
      rung: "check",
      prompt: <p>A stump has weighted error 0.1. By what factor Z = 2√(ε(1 − ε)) does it multiply the exponential loss?</p>,
      answer: { kind: "numeric", value: 0.6, tolerance: 0.0001 },
    },
    {
      key: "half",
      rung: "apply",
      prompt: <p>Right after the weight update in round t, what is the weighted error of the stump hₜ under the new weights?</p>,
      answer: { kind: "choice", options: ["Exactly 0.5", "Exactly εₜ", "Exactly 0", "Exactly εₜ²"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def stump_predict(X, j, t, s):
    return np.where(X[:, j] <= t, s, -s)

def best_stump(X, y, w):
    best = (np.inf, 0, 0.0, 1)
    for j in range(X.shape[1]):
        for t in np.unique(X[:, j]):
            for s in (1, -1):
                err = float(w[stump_predict(X, j, t, s) != y].sum())
                best = min(best, (err, j, float(t), s))
    return best

def adaboost(X, y, rounds):
    w = np.full(len(y), 1 / len(y)); model = []
    for _ in range(rounds):
        err, j, t, s = best_stump(X, y, w)
        err = max(err, 1e-12)
        a = 0.5 * np.log((1 - err) / err)
        w = w * np.exp(-a * y * stump_predict(X, j, t, s)); w = w / w.sum()
        model.append((float(a), j, t, s, err))
    return model

X = np.arange(1.0, 7.0)[:, None]; y = np.array([1, 1, -1, -1, 1, 1])
model = adaboost(X, y, 3)
print([(round(a, 3), t, s, round(e, 3)) for a, j, t, s, e in model])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[(0.347, 2.0, 1, 0.333), (0.549, 4.0, -1, 0.25), (0.805, 6.0, 1, 0.167)]", "[(0.347, 2.0, 1, 0.333), (0.347, 4.0, -1, 0.333), (0.347, 6.0, 1, 0.333)]", "[(0.347, 2.0, 1, 0.333), (0.549, 4.0, -1, 0.333), (0.805, 6.0, 1, 0.333)]", "[(0.347, 2.0, 1, 0.333), (0.549, 2.0, 1, 0.25), (0.805, 2.0, 1, 0.167)]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def boost_score(model, X):
    return sum(m[0] * np.where(X[:, m[1]] <= m[2], m[3], -m[3]) for m in model)

def train_error_bound(errs):
    return float(np.prod([2 * np.sqrt(e * (1 - e)) for e in errs]))

def exp_loss(score, y):
    return float(np.mean(np.exp(-y * score)))

m = [(0.5 * np.log(2), 0, 2.0, 1), (0.5 * np.log(3), 0, 4.0, -1), (0.5 * np.log(5), 0, 6.0, 1)]
X = np.arange(1.0, 7.0)[:, None]; y = np.array([1, 1, -1, -1, 1, 1]); sc = boost_score(m, X)
print(np.sign(sc).astype(int), round(exp_loss(sc, y), 4), round(train_error_bound([1 / 3, 1 / 4, 1 / 6]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 1  1 -1 -1  1  1] 0.6086 0.6086", "[ 1  1 -1 -1  1  1] 0.6086 0.2", "[ 1  1 -1 -1 -1 -1] 0.6086 0.6086", "[1 1 1 1 1 1] 0.6086 0.6086"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stump_predict(X, j, t, s)</C>, returning s where X[:, j] ≤ t and −s elsewhere;{" "}
          <C>best_stump(X, y, w)</C>, returning (weighted error, j, t, s) minimised over features, thresholds at observed
          values and both signs; and <C>adaboost(X, y, rounds)</C>, returning a list of (α, j, t, s, ε) per round.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stump_predict(X, j, t, s):
    return np.ones(len(X))

def best_stump(X, y, w):
    return (0.5, 0, 0.0, 1)

def adaboost(X, y, rounds):
    return []
`,
        solution: ADA,
        tests: [
          { name: "stump", code: `X = np.array([[1.0, 5.0], [2.0, 1.0], [3.0, 2.0]]); y = np.array([-1, 1, 1])
e, j, t, s = best_stump(X, y, np.full(3, 1 / 3))
assert e == 0.0 and np.all(stump_predict(X, j, t, s) == y)` },
          { name: "ada", code: `X = np.arange(1.0, 7.0)[:, None]; y = np.array([1, 1, -1, -1, 1, 1])
m = adaboost(X, y, 2)
assert len(m) == 2 and abs(m[0][0] - 0.5 * np.log(2)) < 1e-9 and abs(m[0][4] - 1 / 3) < 1e-9 and abs(m[1][4] - 0.25) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>boost_score(model, X)</C>, the score Σ αₜhₜ(x) for a model list of (α, j, t, s, …) tuples,{" "}
          <C>train_error_bound(errs)</C>, the product of 2√(ε(1 − ε)), and <C>exp_loss(score, y)</C>, the mean of
          e^(−y·score), each bound and loss as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def boost_score(model, X):
    return np.zeros(len(X))

def train_error_bound(errs):
    return 1.0

def exp_loss(score, y):
    return 1.0
`,
        solution: LOSS,
        tests: [
          { name: "score", code: `X = np.array([[0.0], [2.0]]); m = [(1.0, 0, 1.0, 1), (0.5, 0, 3.0, -1)]
assert np.allclose(boost_score(m, X), [0.5, -1.5])` },
          { name: "bound", code: `assert abs(train_error_bound([0.1, 0.25]) - 0.6 * np.sqrt(0.75)) < 1e-12 and abs(exp_loss(np.array([0.0, np.log(2)]), np.array([1, -1])) - 1.5) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Let Z(α) = (1 − ε)e^(−α) + εe^(α) with 0 &lt; ε &lt; ½. Prove that Z is minimised at α = ½ log((1 − ε)/ε) and that the minimum value is 2√(ε(1 − ε)).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates: Z′(α) = −(1 − ε)e^(−α) + εe^(α), and sets it to zero to get e^(2α) = (1 − ε)/ε.",
          "Argues this is a minimum (Z″ > 0, Z is convex, or a sign change of Z′).",
          "Substitutes e^(α) = √((1 − ε)/ε) to get Z = √(ε(1 − ε)) + √(ε(1 − ε)) = 2√(ε(1 − ε)).",
        ],
      },
    },
    {
      key: "bound",
      rung: "stretch",
      prompt: <p>Ten rounds each have weighted error 0.3. What is the bound ∏ 2√(ε(1 − ε)) on the training error? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.4182, tolerance: 0.0002 },
    },
  ],

  teachBack:
    "Explain to a friend how AdaBoost reweights points and weights its votes, why its training error falls geometrically when each stump beats chance, and how it can be seen as stagewise minimisation of the exponential loss.",

  glimpse: (
    <>
      <p>
        If boosting is stagewise loss minimisation, why stop at the exponential loss? Gradient boosting fits each new tree
        to the negative gradient of any differentiable loss, which gives the most widely used tabular models in practice.
      </p>
    </>
  ),
};
