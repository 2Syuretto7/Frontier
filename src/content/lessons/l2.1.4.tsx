import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BayesActionViz } from "@/components/viz/BayesActionViz";
import type { LessonContent } from "@/lib/types";

const ACT = `import numpy as np

def expected_loss(samples, a, loss):
    return float(np.mean(loss(samples, a)))

def best_action(samples, loss, grid):
    risks = [expected_loss(samples, a, loss) for a in grid]
    return float(grid[int(np.argmin(risks))])

def pinball(tau):
    return lambda y, a: np.maximum(tau * (y - a), (tau - 1) * (y - a))`;

const CLS = `import numpy as np

def threshold(c_fp, c_fn):
    return c_fp / (c_fp + c_fn)

def decide(p, c_fp, c_fn, c_reject=None):
    risk_pos, risk_neg = (1 - p) * c_fp, p * c_fn
    act = np.where(risk_pos < risk_neg, 1, 0)
    if c_reject is not None:
        act = np.where(np.minimum(risk_pos, risk_neg) > c_reject, -1, act)
    return act

def total_cost(act, y, c_fp, c_fn, c_reject=0.0):
    fp = np.sum((act == 1) & (y == 0)); fn = np.sum((act == 0) & (y == 1))
    return float(c_fp * fp + c_fn * fn + c_reject * np.sum(act == -1))`;

export const lesson: LessonContent = {
  id: "l2.1.4",
  minutes: 50,
  links: {
    requires: ["l2.1.1", "l1.3.4"],
    revisits: ["m7.6.3", "m9.2.3"],
    foreshadows: ["l2.8.1", "l2.8.2"],
  },

  puzzle: (
    <>
      <p>
        A model forecasts tomorrow&apos;s server load as a full distribution. Operations must pick one number to provision
        for. If they provision the mean, they run out of capacity a third of the time; if they provision the 99th
        percentile, half the machines sit idle. The model is the same in both cases. What decides the right number?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A model gives beliefs; a decision needs costs. Decision theory separates the two: first get the predictive
        distribution right, then choose the action whose average cost under that distribution is smallest. Change the cost
        and the best action changes, without retraining anything.
      </p>
      <BayesActionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="expected loss and the Bayes action">
        <p>
          A loss ℓ(y, a) is the cost of taking action a when the outcome turns out to be y. Given a predictive distribution
          p(y | x), the expected loss of a is <M>{"R(a \\mid x) = \\mathbb E[\\ell(Y, a) \\mid x]"}</M>, and the Bayes action
          is any a minimising it. A decision rule that takes the Bayes action for every x minimises the overall expected loss,
          since it minimises each conditional term.
        </p>
      </Definition>

      <Theorem title="point predictions for common losses">
        <p>
          For a real outcome Y with finite variance: squared loss <M>{"(y - a)^2"}</M> is minimised by the mean; absolute
          loss <M>{"|y - a|"}</M> by a median; the pinball loss{" "}
          <M>{"\\max(\\tau(y - a), (\\tau - 1)(y - a))"}</M> by a τ-quantile. For a discrete outcome, 0-1 loss is minimised by
          the most probable value.
        </p>
      </Theorem>
      <Proof>
        <p>
          Squared: <M>{"\\mathbb E(Y - a)^2 = \\mathrm{Var}(Y) + (\\mathbb EY - a)^2"}</M>, smallest at a = 𝔼Y. Pinball: the
          derivative in a is <M>{"-\\tau P(Y > a) + (1 - \\tau)P(Y < a)"}</M> away from atoms, which is negative while{" "}
          <M>{"P(Y < a) < \\tau"}</M> and positive once <M>{"P(Y < a) > \\tau"}</M>, so the minimum is at a τ-quantile;
          absolute loss is twice the pinball loss with τ = ½, giving the median. 0-1: the expected loss of a is{" "}
          <M>{"1 - P(Y = a)"}</M>, smallest at the mode.
        </p>
        <Code>{ACT}</Code>
      </Proof>

      <Theorem title="the cost-sensitive threshold">
        <p>
          For a binary label with <M>{"p = P(Y = 1 \\mid x)"}</M>, a false positive costing <M>{"c_{FP}"}</M> and a false
          negative costing <M>{"c_{FN}"}</M>, the Bayes decision predicts 1 exactly when{" "}
          <M>{"p > c_{FP}/(c_{FP} + c_{FN})"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Predicting 1 costs <M>{"(1 - p)c_{FP}"}</M> in expectation and predicting 0 costs <M>{"p\\,c_{FN}"}</M>. The first is
          smaller when <M>{"c_{FP} < p(c_{FP} + c_{FN})"}</M>, which rearranges to the threshold. Equal costs give the
          familiar 0.5; a missed disease costing nine times a false alarm gives 0.1.
        </p>
      </Proof>

      <Example title="the reject option">
        <p>
          If deferring to a human costs <M>{"c_R"}</M>, add a third action. Its expected cost is <M>{"c_R"}</M> regardless
          of y, so the Bayes rule defers whenever both <M>{"(1 - p)c_{FP}"}</M> and <M>{"p\\,c_{FN}"}</M> exceed{" "}
          <M>{"c_R"}</M>, which happens for p in a middle band. In the code, value −1 marks a deferral.
        </p>
        <Code>{CLS}</Code>
      </Example>

      <Remark title="why this needs probabilities that mean what they say">
        <p>
          These rules plug the model&apos;s p straight into an expected cost. If a model says 0.1 for events that happen 30%
          of the time, the threshold 0.1 is the wrong place to cut. The rules are only as good as the calibration of p,
          which the last chapter measures. A classifier trained for accuracy alone and then thresholded at 0.5 has silently
          assumed equal costs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "thr",
      rung: "check",
      prompt: <p>A false positive costs 1 and a false negative costs 4. Above what probability should you predict positive?</p>,
      answer: { kind: "numeric", value: 0.2, tolerance: 0.0001 },
    },
    {
      key: "med",
      rung: "check",
      prompt: <p>The predictive distribution is exponential with rate 1. Which action minimises expected absolute loss? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 0.6931, tolerance: 0.0001 },
    },
    {
      key: "mode",
      rung: "apply",
      prompt: <p>Which loss makes the most probable class the Bayes action?</p>,
      answer: { kind: "choice", options: ["0-1 loss", "Squared loss", "Absolute loss", "Pinball loss with τ = 0.9"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def expected_loss(samples, a, loss):
    return float(np.mean(loss(samples, a)))

def best_action(samples, loss, grid):
    risks = [expected_loss(samples, a, loss) for a in grid]
    return float(grid[int(np.argmin(risks))])

def pinball(tau):
    return lambda y, a: np.maximum(tau * (y - a), (tau - 1) * (y - a))

s = np.random.default_rng(0).exponential(1.0, size=20000); grid = np.linspace(0, 5, 501)
sq, ab = (lambda y, a: (y - a) ** 2), (lambda y, a: np.abs(y - a))
print([round(best_action(s, f, grid), 2) for f in (sq, ab, pinball(0.9))])
print(round(expected_loss(s, 1.0, sq), 2), round(expected_loss(s, 0.0, sq), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.99, 0.69, 2.29]\n0.99 1.97", "[0.69, 0.99, 2.29]\n0.99 1.97", "[0.99, 0.69, 0.11]\n0.99 1.97", "[0.99, 0.69, 2.29]\n0.0 1.97"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def threshold(c_fp, c_fn):
    return c_fp / (c_fp + c_fn)

def decide(p, c_fp, c_fn, c_reject=None):
    risk_pos, risk_neg = (1 - p) * c_fp, p * c_fn
    act = np.where(risk_pos < risk_neg, 1, 0)
    if c_reject is not None:
        act = np.where(np.minimum(risk_pos, risk_neg) > c_reject, -1, act)
    return act

def total_cost(act, y, c_fp, c_fn, c_reject=0.0):
    fp = np.sum((act == 1) & (y == 0)); fn = np.sum((act == 0) & (y == 1))
    return float(c_fp * fp + c_fn * fn + c_reject * np.sum(act == -1))

p = np.array([0.05, 0.15, 0.3, 0.6, 0.9])
print(threshold(1, 9), decide(p, 1, 9))
print(decide(p, 1, 9, c_reject=0.5), total_cost(decide(p, 1, 9), np.array([0, 0, 1, 0, 1]), 1, 9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.1 [0 1 1 1 1]\n[ 0 -1 -1  1  1] 2.0", "0.1 [0 0 0 1 1]\n[ 0 -1 -1  1  1] 2.0", "0.1 [0 1 1 1 1]\n[ 0  1 -1  1  1] 2.0", "0.1 [0 1 1 1 1]\n[ 0 -1 -1  1  1] 9.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_loss(samples, a, loss)</C>, the Monte Carlo average of loss(samples, a) as a float,{" "}
          <C>best_action(samples, loss, grid)</C>, the grid value with the smallest expected loss (the first if tied), and{" "}
          <C>pinball(tau)</C>, returning the pinball loss as a function of (y, a).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def expected_loss(samples, a, loss):
    return 0.0

def best_action(samples, loss, grid):
    return float(grid[0])

def pinball(tau):
    return lambda y, a: np.abs(y - a)
`,
        solution: ACT,
        tests: [
          { name: "mean", code: `s = np.array([0.0, 1.0, 5.0]); g = np.linspace(0, 5, 51)
assert abs(best_action(s, lambda y, a: (y - a) ** 2, g) - 2.0) < 1e-9 and abs(expected_loss(s, 2.0, lambda y, a: (y - a) ** 2) - 14 / 3) < 1e-12` },
          { name: "quantile", code: `s = np.arange(1.0, 11.0); g = np.arange(0.0, 11.0)
assert best_action(s, pinball(0.5), g) in (5.0, 6.0) and best_action(s, pinball(0.95), g) == 10.0 and abs(pinball(0.9)(np.array(2.0), 0.0) - 1.8) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>threshold(c_fp, c_fn)</C>; <C>decide(p, c_fp, c_fn, c_reject=None)</C>, returning 1 or 0 by the Bayes rule
          (0 on ties), or −1 where a reject cost is given and both expected costs exceed it; and{" "}
          <C>total_cost(act, y, c_fp, c_fn, c_reject=0.0)</C>, the realised total cost as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def threshold(c_fp, c_fn):
    return 0.5

def decide(p, c_fp, c_fn, c_reject=None):
    return (p > 0.5).astype(int)

def total_cost(act, y, c_fp, c_fn, c_reject=0.0):
    return 0.0
`,
        solution: CLS,
        tests: [
          { name: "rule", code: `p = np.array([0.1, 0.25, 0.5, 0.8])
assert threshold(3, 1) == 0.75 and list(decide(p, 3, 1)) == [0, 0, 0, 1] and list(decide(p, 1, 1, c_reject=0.3)) == [0, 0, -1, 1]` },
          { name: "cost", code: `act = np.array([1, 0, -1, 1]); y = np.array([0, 1, 1, 1])
assert total_cost(act, y, 2.0, 5.0, 0.5) == 7.5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a binary label with P(Y = 1 | x) = p and costs c_FP, c_FN &gt; 0 for false positives and false negatives, prove that predicting 1 has lower expected cost than predicting 0 exactly when p &gt; c_FP/(c_FP + c_FN).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Computes the expected cost of predicting 1 as (1 − p)c_FP, since it errs only when Y = 0.",
          "Computes the expected cost of predicting 0 as p·c_FN.",
          "Rearranges (1 − p)c_FP < p·c_FN to p > c_FP/(c_FP + c_FN), using that c_FP + c_FN > 0.",
        ],
      },
    },
    {
      key: "q90",
      rung: "stretch",
      prompt: <p>The predictive distribution is exponential with rate 1. Which action minimises the expected pinball loss with τ = 0.9? Give four decimal places.</p>,
      answer: { kind: "numeric", value: 2.3026, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how a loss turns a predictive distribution into a decision, why squared, absolute, pinball and 0-1 losses pick the mean, median, a quantile and the mode, how unequal costs move a classifier's threshold, and when to defer.",

  glimpse: (
    <>
      <p>
        With likelihoods, priors and decisions in place, the next chapter rebuilds linear regression from these
        principles, starting with the normal equations and their geometry, then keeping the full posterior instead of its
        peak.
      </p>
    </>
  ),
};
