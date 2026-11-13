import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GbStageViz } from "@/components/viz/GbStageViz";
import type { LessonContent } from "@/lib/types";

const GB = `import numpy as np

def fit_stump(x, r):
    best = (np.inf, 0.0, 0.0, 0.0)
    for t in np.unique(x)[:-1]:
        L, R = r[x <= t], r[x > t]
        sse = ((L - L.mean()) ** 2).sum() + ((R - R.mean()) ** 2).sum()
        best = min(best, (float(sse), float(t), float(L.mean()), float(R.mean())))
    return best[1:]

def gboost(x, y, rounds, lr, grad):
    F = np.zeros(len(y)); stumps = []
    for _ in range(rounds):
        t, a, b = fit_stump(x, -grad(y, F))
        F = F + lr * np.where(x <= t, a, b)
        stumps.append((t, a, b))
    return F, stumps`;

const XGB = `import numpy as np

def logistic_gh(y, F):
    p = 1 / (1 + np.exp(-F))
    return p - y, p * (1 - p)

def leaf_value(g, h, lam):
    return float(-g.sum() / (h.sum() + lam)) + 0.0

def split_score(g, h, mask, lam):
    s = lambda gg, hh: gg.sum() ** 2 / (hh.sum() + lam)
    return float(0.5 * (s(g[mask], h[mask]) + s(g[~mask], h[~mask]) - s(g, h)))`;

export const lesson: LessonContent = {
  id: "l2.4.4",
  minutes: 55,
  links: {
    requires: ["l2.4.3", "l2.2.5"],
    revisits: ["l1.2.4", "l2.4.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        On tabular data, gradient-boosted trees win most competitions and run most production models, ahead of neural
        networks. Yet the algorithm is a short loop: fit a small tree, add a fraction of it, repeat. What is each new tree
        fitted to, and how does the same loop handle squared error, log loss and ranking losses alike?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of the model&apos;s predictions on the training points as a vector F to be optimised. The negative gradient of
        the loss says how each prediction should move. A tree cannot move points independently, but it can approximate that
        direction with a few regions, so fit a tree to the negative gradient and take a small step along it. For squared
        error the negative gradient is just the residual, so each tree fixes what the previous ones got wrong.
      </p>
      <GbStageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="gradient boosting">
        <p>
          Start from a constant <M>{"F_0"}</M>. At stage m, compute pseudo-residuals{" "}
          <M>{"r_i = -\\partial L(y_i, F)/\\partial F\\,\\big|_{F = F_{m-1}(x_i)}"}</M>, fit a small regression tree{" "}
          <M>{"h_m"}</M> to the pairs <M>{"(x_i, r_i)"}</M> by least squares, and set{" "}
          <M>{"F_m = F_{m-1} + \\nu h_m"}</M> with a learning rate <M>{"0 < \\nu \\leq 1"}</M>.
        </p>
      </Definition>

      <Theorem title="pseudo-residuals for common losses">
        <p>
          For squared loss <M>{"\\tfrac12(y - F)^2"}</M> the pseudo-residual is y − F. For log loss with y ∈ {"{0, 1}"} and F
          the log-odds, it is <M>{"y - \\sigma(F)"}</M>. For absolute loss it is sign(y − F).
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiate in F. Squared: <M>{"\\partial_F \\tfrac12(y - F)^2 = -(y - F)"}</M>. Log loss:{" "}
          <M>{"L = -y\\log\\sigma(F) - (1 - y)\\log(1 - \\sigma(F))"}</M> and <M>{"\\sigma' = \\sigma(1 - \\sigma)"}</M> give{" "}
          <M>{"\\partial_F L = -y(1 - \\sigma(F)) + (1 - y)\\sigma(F) = \\sigma(F) - y"}</M>. Absolute: the derivative of{" "}
          <M>{"|y - F|"}</M> is <M>{"-\\mathrm{sign}(y - F)"}</M> away from y = F. Negate each.
        </p>
        <Code>{GB}</Code>
      </Proof>
      <Example title="watching the residuals shrink">
        <p>
          On ten points with a step pattern, the first stump splits at x = 2 and predicts the means 1 and 3.14 of the two
          sides. With learning rate 0.5, the training error after 1, 5 and 20 stumps is 2.49, 0.21 and 0.0006: each stage
          fits what is left. On noisy data the same relentlessness becomes overfitting, which is why the number of stages is
          tuned by early stopping on validation data.
        </p>
      </Example>

      <Theorem title="second-order leaf values">
        <p>
          Approximate the loss around the current predictions by{" "}
          <M>{"L(y_i, F_i + w) \\approx L_i + g_iw + \\tfrac12h_iw^2"}</M> with <M>{"g_i"}</M>, <M>{"h_i"}</M> the first and
          second derivatives, and add a penalty <M>{"\\tfrac12\\lambda w^2"}</M> per leaf. For a leaf with{" "}
          <M>{"G = \\sum g_i"}</M> and <M>{"H = \\sum h_i"}</M> over its points, the best value is{" "}
          <M>{"w^* = -G/(H + \\lambda)"}</M>, and it lowers the objective by <M>{"\\tfrac12G^2/(H + \\lambda)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The leaf contributes <M>{"Gw + \\tfrac12(H + \\lambda)w^2"}</M>, a parabola with positive leading coefficient since{" "}
          <M>{"h_i \\geq 0"}</M> for convex losses and λ &gt; 0. Its minimum is at <M>{"w^* = -G/(H + \\lambda)"}</M>, where
          the value is <M>{"-G^2/(H + \\lambda) + \\tfrac12G^2/(H + \\lambda) = -\\tfrac12G^2/(H + \\lambda)"}</M>. The gain of
          splitting a leaf is therefore{" "}
          <M>{"\\tfrac12\\big(\\frac{G_L^2}{H_L + \\lambda} + \\frac{G_R^2}{H_R + \\lambda} - \\frac{G^2}{H + \\lambda}\\big)"}</M>.
        </p>
        <Code>{XGB}</Code>
      </Proof>
      <Remark title="the practical recipe">
        <p>
          Libraries such as XGBoost and LightGBM grow each tree with this gain and set its leaves by the Newton step, which is
          a per-leaf version of the IRLS idea. The main controls are the learning rate (small, such as 0.05, with many
          trees), tree depth or number of leaves (interaction order), λ and a minimum H per leaf (regularisation), row and
          column subsampling (decorrelation, as in random forests) and early stopping. AdaBoost is gradient boosting on the
          exponential loss with classifiers as base learners and a line search for the step.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "res",
      rung: "check",
      prompt: <p>With squared loss ½(y − F)², what is the pseudo-residual when y = 5 and the current prediction is 3?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 0.0001 },
    },
    {
      key: "logres",
      rung: "check",
      prompt: <p>With log loss, label y = 1 and current log-odds F = 0, what is the pseudo-residual?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "lr",
      rung: "apply",
      prompt: <p>You halve the learning rate of a gradient-boosting model. What usually happens to the best number of trees chosen by early stopping?</p>,
      answer: { kind: "choice", options: ["It roughly doubles", "It roughly halves", "It is unchanged", "Early stopping no longer applies"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def fit_stump(x, r):
    best = (np.inf, 0.0, 0.0, 0.0)
    for t in np.unique(x)[:-1]:
        L, R = r[x <= t], r[x > t]
        sse = ((L - L.mean()) ** 2).sum() + ((R - R.mean()) ** 2).sum()
        best = min(best, (float(sse), float(t), float(L.mean()), float(R.mean())))
    return best[1:]

def gboost(x, y, rounds, lr, grad):
    F = np.zeros(len(y)); stumps = []
    for _ in range(rounds):
        t, a, b = fit_stump(x, -grad(y, F))
        F = F + lr * np.where(x <= t, a, b)
        stumps.append((t, a, b))
    return F, stumps

x = np.arange(10.0); y = np.array([1.0, 1, 1, 4, 4, 4, 4, 2, 2, 2])
sq = lambda y, F: F - y
print([round(float(np.mean((gboost(x, y, k, 0.5, sq)[0] - y) ** 2)), 4) for k in (1, 5, 20)])
F, st = gboost(x, y, 1, 1.0, sq); print([tuple(round(v, 3) for v in s) for s in st], np.round(F, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2.4893, 0.2079, 0.0006]\n[(2.0, 1.0, 3.143)] [1.   1.   1.   3.14 3.14 3.14 3.14 3.14 3.14 3.14]", "[2.4893, 2.4893, 2.4893]\n[(2.0, 1.0, 3.143)] [1.   1.   1.   3.14 3.14 3.14 3.14 3.14 3.14 3.14]", "[2.4893, 0.2079, 0.0006]\n[(6.0, 2.714, 2.0)] [2.71 2.71 2.71 2.71 2.71 2.71 2.71 2.   2.   2.  ]", "[2.4893, 0.2079, 0.0006]\n[(2.0, 1.0, 3.143)] [0.5  0.5  0.5  1.57 1.57 1.57 1.57 1.57 1.57 1.57]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def logistic_gh(y, F):
    p = 1 / (1 + np.exp(-F))
    return p - y, p * (1 - p)

def leaf_value(g, h, lam):
    return float(-g.sum() / (h.sum() + lam)) + 0.0

def split_score(g, h, mask, lam):
    s = lambda gg, hh: gg.sum() ** 2 / (hh.sum() + lam)
    return float(0.5 * (s(g[mask], h[mask]) + s(g[~mask], h[~mask]) - s(g, h)))

g, h = logistic_gh(np.array([0.0, 0.0, 1.0, 1.0]), np.zeros(4))
print(g, h, leaf_value(g, h, 1.0))
m = np.array([True, True, False, False]); print(round(leaf_value(g[m], h[m], 1.0), 4), round(split_score(g, h, m, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[ 0.5  0.5 -0.5 -0.5] [0.25 0.25 0.25 0.25] 0.0\n-0.6667 0.6667", "[-0.5 -0.5  0.5  0.5] [0.25 0.25 0.25 0.25] 0.0\n0.6667 0.6667", "[ 0.5  0.5 -0.5 -0.5] [0.25 0.25 0.25 0.25] 0.0\n-2.0 2.0", "[ 0.5  0.5 -0.5 -0.5] [0.5 0.5 0.5 0.5] 0.0\n-0.5 0.5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_stump(x, r)</C>, returning (threshold, left mean, right mean) of the least-squares stump over
          thresholds at distinct x values except the largest, and <C>gboost(x, y, rounds, lr, grad)</C>, starting from F = 0
          and returning the final F and the list of stumps, where grad(y, F) is the gradient of the loss in F.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fit_stump(x, r):
    return (0.0, 0.0, 0.0)

def gboost(x, y, rounds, lr, grad):
    return np.zeros(len(y)), []
`,
        solution: GB,
        tests: [
          { name: "stump", code: `assert fit_stump(np.array([1.0, 2.0, 3.0]), np.array([0.0, 0.0, 6.0])) == (2.0, 0.0, 6.0)` },
          { name: "boost", code: `x = np.arange(6.0); y = np.array([0.0, 0, 0, 3, 3, 3])
F, st = gboost(x, y, 3, 0.5, lambda y, F: F - y)
assert len(st) == 3 and np.allclose(F, y * (1 - 0.5 ** 3))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>logistic_gh(y, F)</C>, the first and second derivatives of log loss in the log-odds F,{" "}
          <C>leaf_value(g, h, lam)</C>, the Newton leaf value −G/(H + λ) as a float, and{" "}
          <C>split_score(g, h, mask, lam)</C>, the gain of splitting into mask and its complement.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def logistic_gh(y, F):
    return np.zeros(len(y)), np.ones(len(y))

def leaf_value(g, h, lam):
    return 0.0

def split_score(g, h, mask, lam):
    return 0.0
`,
        solution: XGB,
        tests: [
          { name: "gh", code: `g, h = logistic_gh(np.array([1.0, 0.0]), np.array([0.0, np.log(3)]))
assert np.allclose(g, [-0.5, 0.75]) and np.allclose(h, [0.25, 0.1875])` },
          { name: "leaf", code: `g = np.array([-1.0, -2.0, 4.0]); h = np.array([1.0, 1.0, 2.0]); m = np.array([True, True, False])
assert abs(leaf_value(g[m], h[m], 1.0) - 1.0) < 1e-12 and abs(split_score(g, h, m, 1.0) - 0.5 * (3.0 + 16 / 3 - 1 / 5)) < 1e-12` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For a leaf with gradient sum G, Hessian sum H ≥ 0 and penalty λ &gt; 0, prove that Gw + ½(H + λ)w² is minimised at w* = −G/(H + λ) with minimum value −½G²/(H + λ).</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes the function is a parabola in w with positive leading coefficient (H + λ)/2, so it has a unique minimum.",
          "Sets the derivative G + (H + λ)w to zero to get w* = −G/(H + λ).",
          "Substitutes to get −G²/(H + λ) + ½G²/(H + λ) = −½G²/(H + λ).",
        ],
      },
    },
    {
      key: "obj",
      rung: "stretch",
      prompt: <p>A leaf has G = −3, H = 2 and λ = 1. By how much does its Newton value change the approximate objective, −½G²/(H + λ)?</p>,
      answer: { kind: "numeric", value: -1.5, tolerance: 0.0001 },
    },
  ],

  teachBack:
    "Explain to a friend how gradient boosting fits each tree to the negative gradient of the loss, what the pseudo-residuals are for squared and log loss, how second-order leaf values and split gains are computed, and which settings control overfitting.",

  glimpse: (
    <>
      <p>
        Trees and ensembles model the target directly. The next chapter introduces hidden variables, unobserved causes such
        as which cluster a point came from, and the expectation-maximisation algorithm for fitting models that contain
        them.
      </p>
    </>
  ),
};
