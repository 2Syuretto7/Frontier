import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { EarlyStopFilterViz } from "@/components/viz/EarlyStopFilterViz";
import type { LessonContent } from "@/lib/types";

const STOP = `def early_stopping(val_losses, patience):
    best, best_epoch = float("inf"), -1
    for epoch, v in enumerate(val_losses):
        if v < best:
            best, best_epoch = v, epoch
        elif epoch - best_epoch >= patience:
            return best_epoch, epoch
    return best_epoch, len(val_losses) - 1

def gd_filter(h, lr, t):
    return 1 - (1 - lr * h) ** t`;

const SPEC = `import numpy as np

def gd_least_squares(X, y, lr, steps):
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w = w - lr * X.T @ (X @ w - y) / len(X)
    return w

def spectral_gd_solution(X, y, lr, t):
    h, V = np.linalg.eigh(X.T @ X / len(X))
    b = V.T @ (X.T @ y / len(X))
    return V @ ((1 - (1 - lr * h) ** t) / h * b)`;

export const lesson: LessonContent = {
  id: "l3.7.4",
  minutes: 40,
  links: {
    requires: ["l3.7.3", "l1.5.3"],
    revisits: ["l3.6.1", "l3.7.1"],
    foreshadows: ["l3.8.2"],
  },

  puzzle: (
    <>
      <p>
        Training loss falls for the whole run. Validation loss falls, bottoms out around epoch 40, and then creeps upwards as
        the model starts fitting noise. The obvious fix is to keep the weights from epoch 40. It is so simple it hardly seems
        like a method, yet for least squares it is provably almost the same as ridge regression. How can the number of steps
        be a regularisation strength?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradient descent does not fit everything at once. Directions in which the loss is steep, usually the strong, real
        patterns, are fitted in a few steps; flat directions, where the data says little and noise dominates, are fitted
        slowly. Stopping after t steps keeps the first and leaves the second mostly unfitted, which is exactly what a ridge
        penalty does.
      </p>
      <EarlyStopFilterViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="gradient descent as a spectral filter">
        <p>
          For <M>{"L(w) = \\tfrac{1}{2N}\\|Xw - y\\|^2"}</M>, let <M>{"\\tfrac1N X^\\top X = \\sum_i h_i v_i v_i^\\top"}</M> with{" "}
          <M>{"h_i > 0"}</M>, and let <M>{"\\hat w = \\sum_i (b_i/h_i) v_i"}</M> be the least-squares solution, where{" "}
          <M>{"b = V^\\top X^\\top y/N"}</M>. Gradient descent from <M>{"w_0 = 0"}</M> with step η gives
        </p>
        <MD>{"w_t = \\sum_i \\big(1 - (1 - \\eta h_i)^t\\big)\\,\\frac{b_i}{h_i}\\,v_i,"}</MD>
        <p>while ridge with penalty <M>{"\\tfrac\\lambda2\\|w\\|^2"}</M> gives the factor <M>{"h_i/(h_i + \\lambda)"}</M> in place of <M>{"1 - (1 - \\eta h_i)^t"}</M>.</p>
      </Theorem>
      <Proof>
        <p>
          The update is <M>{"w_{t+1} = w_t - \\eta(\\tfrac1N X^\\top X w_t - \\tfrac1N X^\\top y)"}</M>. In coordinates{" "}
          <M>{"c_i = v_i^\\top w"}</M> it reads <M>{"c_i \\leftarrow (1 - \\eta h_i)c_i + \\eta b_i"}</M>, whose fixed point is{" "}
          <M>{"b_i/h_i"}</M>. The distance to it is multiplied by <M>{"1 - \\eta h_i"}</M> each step, and starts at{" "}
          <M>{"-b_i/h_i"}</M>, so <M>{"c_i^{(t)} = (1 - (1 - \\eta h_i)^t)\\,b_i/h_i"}</M>. Ridge solves{" "}
          <M>{"(h_i + \\lambda)c_i = b_i"}</M>, so <M>{"c_i = \\tfrac{h_i}{h_i + \\lambda}\\cdot b_i/h_i"}</M>.
        </p>
        <Code>{SPEC}</Code>
      </Proof>

      <Remark title="the matching strength">
        <p>
          Both filters are near 1 for large h and near 0 for small h, and both are about one half where{" "}
          <M>{"h \\approx 1/(\\eta t)"}</M> (for GD, <M>{"(1 - \\eta h)^t \\approx e^{-\\eta h t}"}</M>). So t steps behave like
          ridge with <M>{"\\lambda \\approx 1/(\\eta t)"}</M>: training ten times longer is like a ten times weaker penalty.
          For networks the analysis is only a guide, but the behaviour is the same in spirit.
        </p>
      </Remark>

      <Definition title="early stopping with patience">
        <p>
          Evaluate on a validation set after every epoch, remember the best epoch and its weights, and stop when the
          validation loss has not improved for <em>patience</em> epochs. Then restore the best weights. Patience absorbs the
          noise in validation curves; restoring the checkpoint is what makes the method a regulariser rather than just a
          stopping rule.
        </p>
        <Code>{STOP}</Code>
      </Definition>

      <Example title="a caution">
        <p>
          The validation set used for stopping has now been used to choose a hyperparameter, so its loss is slightly
          optimistic. Report final performance on a separate test set. And with very large models, validation loss can fall,
          rise, then fall again (double descent), so a short patience can stop too early.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "factor",
      rung: "check",
      prompt: <p>Gradient descent with η = 0.1 runs for 10 steps. What fraction of the direction with curvature h = 1 has it fitted? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 0.65132156, tolerance: 1e-4 },
    },
    {
      key: "lam",
      rung: "check",
      prompt: <p>Gradient descent with η = 0.01 is stopped after 1000 steps. Roughly what ridge λ does that correspond to?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 1e-9 },
    },
    {
      key: "restore",
      rung: "apply",
      prompt: <p>Training stops at epoch 60 because validation loss has not improved since epoch 50 (patience 10). Which weights should be used?</p>,
      answer: {
        kind: "choice",
        options: ["The checkpoint from epoch 50", "The weights at epoch 60", "The average of epochs 50 to 60", "The weights at epoch 0"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def early_stopping(val_losses, patience):
    best, best_epoch = float("inf"), -1
    for epoch, v in enumerate(val_losses):
        if v < best:
            best, best_epoch = v, epoch
        elif epoch - best_epoch >= patience:
            return best_epoch, epoch
    return best_epoch, len(val_losses) - 1

val = [1.0, 0.8, 0.7, 0.72, 0.69, 0.71, 0.73, 0.74, 0.75]
print(early_stopping(val, 2), early_stopping(val, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(4, 6) (4, 8)", "(2, 4) (4, 8)", "(4, 5) (4, 8)", "(4, 6) (4, 14)"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def gd_filter(h, lr, t):
    return 1 - (1 - lr * h) ** t

h = np.array([0.01, 1.0, 100.0])
print(np.round(gd_filter(h, 0.001, 1000), 3), np.round(h / (h + 1 / (0.001 * 1000)), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.01  0.632 1.   ] [0.01 0.5  0.99]", "[0.632 0.632 0.632] [0.5 0.5 0.5]", "[0.01  0.632 1.   ] [0.01  0.632 1.   ]", "[1.    0.632 0.01 ] [0.99 0.5  0.01]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>early_stopping(val_losses, patience)</C>, returning <C>(best_epoch, stop_epoch)</C>: scan epochs in order,
          tracking the best (strictly lowest) loss; stop at the first epoch that is <C>patience</C> epochs after the best
          one; if that never happens, the stop epoch is the last one. Also write <C>gd_filter(h, lr, t)</C>, the fraction{" "}
          <M>{"1 - (1 - \\eta h)^t"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def early_stopping(val_losses, patience):
    return 0, len(val_losses) - 1

def gd_filter(h, lr, t):
    return 1.0
`,
        solution: `import numpy as np

${STOP}`,
        tests: [
          { name: "patience", code: `val = [1.0, 0.8, 0.7, 0.72, 0.69, 0.71, 0.73, 0.74, 0.75]
assert early_stopping(val, 2) == (4, 6)
assert early_stopping(val, 10) == (4, 8)
assert early_stopping([3.0, 2.0, 1.0], 1) == (2, 2)
assert early_stopping([1.0, 1.0, 1.0, 1.0], 2) == (0, 2)` },
          { name: "filter", code: `h = np.array([0.01, 1.0, 100.0])
assert np.allclose(gd_filter(h, 0.001, 1000), 1 - (1 - 0.001 * h) ** 1000)
assert abs(gd_filter(1.0, 0.1, 10) - (1 - 0.9 ** 10)) < 1e-12
assert gd_filter(5.0, 0.1, 0) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For <M>{"L(w) = \\tfrac{1}{2N}\\|Xw - y\\|^2"}</M>, write <C>gd_least_squares(X, y, lr, steps)</C>, plain gradient
          descent from w = 0, and <C>spectral_gd_solution(X, y, lr, t)</C>, which computes the same <M>{"w_t"}</M> directly
          from the eigen-decomposition of <M>{"X^\\top X/N"}</M> using the theorem (use <C>np.linalg.eigh</C>; assume all
          eigenvalues are positive).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_least_squares(X, y, lr, steps):
    return np.zeros(X.shape[1])

def spectral_gd_solution(X, y, lr, t):
    return np.zeros(X.shape[1])
`,
        solution: SPEC,
        tests: [
          { name: "gd", code: `X = np.array([[1.0, 0.0], [0.0, 2.0]]); y = np.array([1.0, 2.0])
assert np.allclose(gd_least_squares(X, y, 0.5, 1), [0.25, 1.0])
assert np.allclose(gd_least_squares(X, y, 0.5, 200), [1.0, 1.0])` },
          { name: "agree", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(30, 4)); y = rng.normal(size=30)
for t in [1, 7, 50]:
    assert np.allclose(gd_least_squares(X, y, 0.1, t), spectral_gd_solution(X, y, 0.1, t))
w_ls = np.linalg.lstsq(X, y, rcond=None)[0]
assert np.allclose(spectral_gd_solution(X, y, 0.1, 5000), w_ls)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that gradient descent from 0 on (1/2N)‖Xw − y‖² gives, in each eigen-direction of XᵀX/N with eigenvalue h &gt; 0, the coordinate (1 − (1 − ηh)ᵗ)·b/h after t steps, where b is that direction's component of Xᵀy/N.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the update and projects onto an eigenvector, obtaining the scalar recurrence c ← (1 − ηh)c + ηb.",
          "Identifies the fixed point b/h and shows the deviation from it is multiplied by (1 − ηh) each step (or solves the recurrence by induction).",
          "Uses c₀ = 0 to conclude c_t = (1 − (1 − ηh)ᵗ)·b/h.",
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: <p>With η = 0.01, after how many steps has gradient descent fitted half of the direction with h = 0.1? Use (1 − ηh)ᵗ ≈ e^(−ηht) and give the nearest whole number.</p>,
      answer: { kind: "numeric", value: 693, tolerance: 0.002 },
    },
  ],

  teachBack:
    "Explain to a friend how early stopping works with patience and checkpoints, and why stopping gradient descent early is like choosing a ridge penalty.",

  glimpse: (
    <p>
      That completes the regularisers. The last chapter is about what to do when training goes wrong, starting with the first
      test every new model should pass: can it overfit a single batch?
    </p>
  ),
};
