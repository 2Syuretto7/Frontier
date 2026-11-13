import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OverfitBatchViz } from "@/components/viz/OverfitBatchViz";
import type { LessonContent } from "@/lib/types";

const LOOP = `import numpy as np

def overfit_batch(X, y, k, hidden, lr, steps, rng):
    W1 = rng.normal(0, 1 / np.sqrt(X.shape[1]), size=(X.shape[1], hidden))
    W2 = rng.normal(0, 0.01, size=(hidden, k))
    b1, b2 = np.zeros(hidden), np.zeros(k)
    N, losses = len(X), []
    for _ in range(steps):
        H = np.tanh(X @ W1 + b1)
        Z = H @ W2 + b2
        Z = Z - Z.max(axis=1, keepdims=True)
        P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)
        losses.append(float(-np.log(P[np.arange(N), y]).mean()))
        dZ = P.copy()
        dZ[np.arange(N), y] -= 1
        dZ /= N
        dH = dZ @ W2.T * (1 - H ** 2)
        W2 -= lr * H.T @ dZ
        b2 -= lr * dZ.sum(axis=0)
        W1 -= lr * X.T @ dH
        b1 -= lr * dH.sum(axis=0)
    return losses`;

const DIAG = `def diagnose(losses, k):
    first, last = losses[0], losses[-1]
    if not np.all(np.isfinite(losses)) or last > first:
        return "diverged"
    if abs(first - np.log(k)) > 0.5 * np.log(k):
        return "bad init"
    if last < 0.01:
        return "ok"
    return "slow" if last < 0.5 * first else "stuck"`;

export const lesson: LessonContent = {
  id: "l3.8.1",
  minutes: 40,
  links: {
    requires: ["l3.7.4", "l3.3.2"],
    revisits: ["l3.2.4", "l3.4.1", "e5.4.1"],
    foreshadows: ["l3.8.2"],
  },

  puzzle: (
    <>
      <p>
        A new model trains for six hours and ends with a validation accuracy a little better than chance. Is the
        architecture too small? The data too noisy? Or is there a bug in the loss, the labels or the update? Six hours per
        experiment makes these questions very expensive to answer. Is there a test that takes thirty seconds and rules out
        most bugs?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Take one small batch, say 8 examples, turn off all regularisation, and train on it alone. A network with thousands of
        parameters can memorise 8 examples, so the loss must go to nearly 0. If it does not, the problem is not
        generalisation or capacity; it is a bug in the code. Different bugs leave different fingerprints on that one curve.
      </p>
      <OverfitBatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the single-batch test">
        <p>
          Fix one batch of B examples (B from 2 to 32), disable dropout, augmentation and weight decay, and train for a few
          hundred steps. Two checks: the <em>first</em> loss should be what an untrained model gives, and the <em>last</em>{" "}
          should be close to 0.
        </p>
        <Code>{LOOP}</Code>
      </Definition>

      <Theorem title="the expected starting loss">
        <p>
          If the initial logits are all (nearly) equal, the softmax is uniform over K classes and the cross-entropy is{" "}
          <M>{"\\log K"}</M>, whatever the labels.
        </p>
      </Theorem>
      <Proof>
        <p>
          Equal logits give <M>{"p_k = e^{z}/(K e^{z}) = 1/K"}</M> for every k, so <M>{"-\\log p_y = \\log K"}</M> for every
          example, and so for their mean. Small random logits give approximately this. A first loss far above{" "}
          <M>{"\\log K"}</M> means the logits start large and confident (bad initialisation or an unscaled output layer).
        </p>
      </Proof>

      <Remark title="reading the fingerprints">
        <p>
          The loss goes up or becomes NaN: wrong sign in the update, or a learning rate far too large. It falls but very
          slowly: learning rate too small, or a layer whose gradient is not flowing (detached, frozen, dead). It falls to a
          floor clearly above 0 and stays there: something makes 0 unreachable, such as a loss reduced over the wrong axis,
          labels misaligned with their inputs by a broadcast, or a model too constrained to separate the examples. If the
          softmax is taken over the batch instead of the classes, for example, the best achievable loss is the average of{" "}
          <M>{"\\log(\\text{number of examples sharing the label})"}</M>.
        </p>
      </Remark>

      <Example title="what the test cannot catch">
        <p>
          Memorisation does not need meaningful labels: a network will happily overfit a batch whose labels have been
          shuffled. So the test cannot detect labels that are wrong but consistent, data leakage, or a validation pipeline that
          differs from training. It is a necessary check, not a sufficient one; the next lessons cover the rest.
        </p>
        <Code>{DIAG}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "init",
      rung: "check",
      prompt: <p>A fresh 10-class classifier with small random weights. Roughly what should its first cross-entropy loss be? Give 3 decimal places.</p>,
      answer: { kind: "numeric", value: 2.302585, tolerance: 1e-3 },
    },
    {
      key: "floor",
      rung: "check",
      prompt: <p>A buggy loss applies softmax over the batch axis. The batch has 6 examples, 3 with label 0 and 3 with label 1. What is the lowest loss it can reach? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 1.0986123, tolerance: 1e-4 },
    },
    {
      key: "shuffle",
      rung: "apply",
      prompt: <p>A data loader pairs images with the wrong labels, but consistently (image 5 always gets label 17). What does the single-batch test show?</p>,
      answer: {
        kind: "choice",
        options: [
          "It passes: the network memorises the wrong labels just as easily",
          "The loss goes up",
          "The loss stays at log K",
          "The first loss is far above log K",
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

def overfit_batch(X, y, k, hidden, lr, steps, rng):
    W1 = rng.normal(0, 1 / np.sqrt(X.shape[1]), size=(X.shape[1], hidden))
    W2 = rng.normal(0, 0.01, size=(hidden, k))
    b1, b2 = np.zeros(hidden), np.zeros(k)
    N, losses = len(X), []
    for _ in range(steps):
        H = np.tanh(X @ W1 + b1)
        Z = H @ W2 + b2
        Z = Z - Z.max(axis=1, keepdims=True)
        P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)
        losses.append(float(-np.log(P[np.arange(N), y]).mean()))
        dZ = P.copy()
        dZ[np.arange(N), y] -= 1
        dZ /= N
        dH = dZ @ W2.T * (1 - H ** 2)
        W2 -= lr * H.T @ dZ
        b2 -= lr * dZ.sum(axis=0)
        W1 -= lr * X.T @ dH
        b1 -= lr * dH.sum(axis=0)
    return losses

rng = np.random.default_rng(0)
X = rng.normal(size=(8, 2)); y = np.array([0, 1, 2, 0, 1, 2, 0, 1])
L = overfit_batch(X, y, 3, 32, 1.0, 500, rng)
print(round(L[0], 2), L[-1] < 0.01)`}</Code>
          <p>A tiny MLP trained on 8 points with 3 classes. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.09 True", "1.09 False", "2.08 True", "0.0 True"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def diagnose(losses, k):
    first, last = losses[0], losses[-1]
    if not np.all(np.isfinite(losses)) or last > first:
        return "diverged"
    if abs(first - np.log(k)) > 0.5 * np.log(k):
        return "bad init"
    if last < 0.01:
        return "ok"
    return "slow" if last < 0.5 * first else "stuck"

y = np.array([0, 1, 2, 0, 1, 2, 0, 1])
Z = np.zeros((8, 3)); Z[np.arange(8), y] = 50.0
P = np.exp(Z) / np.exp(Z).sum(axis=0, keepdims=True)
print(round(float(-np.log(P[np.arange(8), y]).mean()), 3))
print(diagnose([1.1, 0.5, 0.005], 3), diagnose([9.0, 4.0, 0.001], 3), diagnose([1.1, 1.0, 0.9], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.997\nok bad init stuck", "0.0\nok bad init stuck", "0.997\nok ok stuck", "1.099\nok bad init slow"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>overfit_batch(X, y, k, hidden, lr, steps, rng)</C>: a one-hidden-layer tanh network with k softmax outputs,
          W1 drawn with standard deviation 1/√d and W2 with 0.01, zero biases, trained by full-batch gradient descent on the
          mean cross-entropy. Return the list of losses, one per step, computed before each update.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def overfit_batch(X, y, k, hidden, lr, steps, rng):
    return [float(np.log(k))] * steps
`,
        solution: LOOP,
        tests: [
          { name: "starts at log k", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(8, 2)); y = np.array([0, 1, 2, 0, 1, 2, 0, 1])
L = overfit_batch(X, y, 3, 32, 1.0, 5, rng)
assert len(L) == 5 and abs(L[0] - np.log(3)) < 0.05 and all(isinstance(v, float) for v in L)
assert L[-1] < L[0]` },
          { name: "memorises", code: `rng = np.random.default_rng(1)
X = rng.normal(size=(10, 4)); y = rng.integers(0, 5, size=10)
L = overfit_batch(X, y, 5, 64, 1.0, 800, rng)
assert L[-1] < 0.02` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>diagnose(losses, k)</C> for the losses of a single-batch run with k classes. In this order: return{" "}
          <C>"diverged"</C> if any loss is not finite or the last exceeds the first; <C>"bad init"</C> if the first loss
          differs from log k by more than half of log k; <C>"ok"</C> if the last loss is below 0.01; otherwise{" "}
          <C>"slow"</C> if the last is below half the first, else <C>"stuck"</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def diagnose(losses, k):
    return "ok"
`,
        solution: `import numpy as np

${DIAG}`,
        tests: [
          { name: "each verdict", code: `assert diagnose([1.1, 0.5, 0.005], 3) == "ok"
assert diagnose([9.0, 4.0, 0.001], 3) == "bad init"
assert diagnose([1.1, 1.0, 0.9], 3) == "stuck"
assert diagnose([1.1, 0.6, 0.3], 3) == "slow"
assert diagnose([1.1, 2.0, 5.0], 3) == "diverged"` },
          { name: "nan first", code: `assert diagnose([2.3, float("nan"), 0.001], 10) == "diverged"
assert diagnose([2.3, 0.5, float("inf")], 10) == "diverged"
assert diagnose([0.5, 0.1, 0.001], 10) == "bad init"` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a K-class softmax with all logits equal gives cross-entropy log K for any label, and explain what a first loss far above log K indicates.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows equal logits give pₖ = 1/K for every class (the common factor cancels in the softmax).",
          "Concludes −log p_y = log K for every label, so the mean loss is log K.",
          "Explains a much larger first loss means the initial logits are large and confidently wrong, e.g. a badly scaled initialisation or output layer.",
        ],
      },
    },
    {
      key: "mixfloor",
      rung: "stretch",
      prompt: <p>The softmax-over-batch bug, on a batch of 8 with label counts 4, 2 and 2. What is the lowest achievable loss? Give 4 decimal places.</p>,
      answer: { kind: "numeric", value: 1.03972077, tolerance: 1e-4 },
    },
  ],

  teachBack:
    "Explain to a friend how to run the single-batch test, what the first and last losses should be, and what each failure pattern points to.",

  glimpse: (
    <p>
      Passing on one batch says the code can learn. On the full dataset, the shapes of the training and validation curves
      say much more. Next: reading loss curves.
    </p>
  ),
};
