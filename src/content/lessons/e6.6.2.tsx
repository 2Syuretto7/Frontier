import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SilentBugViz } from "@/components/viz/SilentBugViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import math, torch
import torch.nn.functional as F

# 1. the loss at initialisation should match chance
logits = model(x)                                   # freshly initialised
print(F.cross_entropy(logits, y).item(), math.log(num_classes))

# 2. one batch must be learnable to near zero loss
for _ in range(500):
    loss = F.cross_entropy(model(x_small), y_small)
    opt.zero_grad(); loss.backward(); opt.step()     # forgetting zero_grad accumulates gradients
assert loss.item() < 1e-2

# 3. examples must not influence each other
x = x.clone().requires_grad_(True)
model.eval()                                        # dropout off, batch norm uses running stats
model(x)[3].sum().backward()
assert (x.grad[torch.arange(len(x)) != 3] == 0).all()

# 4. shapes: pred (N, 1) - y (N,) broadcasts to (N, N) without an error
assert pred.shape == y.shape, (pred.shape, y.shape)`;

const CHECKS = `import math
import numpy as np

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def cross_entropy(logits, labels):
    p = softmax(logits)
    return float(-np.mean(np.log(p[np.arange(len(labels)), labels])))

def init_loss_gap(logits, labels):
    return abs(cross_entropy(logits, labels) - math.log(logits.shape[1]))

def safe_mse(pred, target):
    if np.shape(pred) != np.shape(target):
        raise ValueError(f'shape mismatch {np.shape(pred)} vs {np.shape(target)}')
    return float(np.mean((pred - target) ** 2))

def overfit_loss(X, y, steps, lr, classes=None):
    k = classes or int(y.max()) + 1
    W, onehot = np.zeros((X.shape[1], k)), np.eye(k)[y]
    for _ in range(steps):
        W -= lr * X.T @ (softmax(X @ W) - onehot) / len(y)
    return cross_entropy(X @ W, y)`;

const DEPS = `import numpy as np

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def batch_independent(f, X, tol=1e-9):
    whole = f(X)
    return all(np.allclose(whole[i], f(X[i:i + 1])[0], atol=tol) for i in range(len(X)))

def dependency_matrix(f, X, eps=1e-4):
    base, n = f(X), len(X)
    D = np.zeros((n, n), dtype=bool)
    for j in range(n):
        Xp = X.copy()
        Xp[j] += eps
        D[:, j] = np.any(np.abs(f(Xp) - base).reshape(n, -1) > 1e-12, axis=1)
    return D

def leaks(f, X):
    D = dependency_matrix(f, X)
    return [(i, j) for i in range(len(X)) for j in range(len(X)) if i != j and D[i, j]]`;

export const lesson: LessonContent = {
  id: "e6.6.2",
  minutes: 45,
  links: {
    requires: ["e6.6.1"],
    revisits: ["e5.4.1", "e5.4.2"],
    foreshadows: ["e6.6.3"],
  },

  puzzle: (
    <>
      <p>
        A regression model trains without errors, its loss falls smoothly and settles, and it is worse than predicting the
        mean. The cause is one missing reshape: predictions of shape (N, 1) minus targets of shape (N,) broadcast to an
        N × N matrix, and the model has been fitting every prediction to every target. Nothing crashed and nothing was NaN.
        How do you catch bugs that produce plausible numbers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A silent bug changes what is computed without changing whether something is computed. The loss curve cannot show it,
        because a wrong objective can be minimised just as smoothly. What exposes it is a claim about the right answer that
        the bug violates: at initialisation the loss should equal chance; a tiny batch should be memorised exactly; an
        example&apos;s output should depend on that example alone; shapes should match exactly, not merely broadcast. Each
        check is cheap and catches a whole family of mistakes.
      </p>
      <SilentBugViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a checklist of invariants">
        <p>
          Chance loss: with C classes and near-zero logits, cross-entropy is log C. Overfitting: a model with enough
          capacity drives the loss on a handful of examples to nearly zero; if it cannot, the data, labels, loss or update
          are wrong. Batch independence: in evaluation mode, output i depends only on input i. Exact shapes: any operation
          between a prediction and a target asserts equal shapes.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="chance-level loss">
        <p>
          If all logits are equal, the cross-entropy is exactly log C for any labels, and if the logits are small, of size
          at most ε, it is within 2ε of log C.
        </p>
      </Theorem>
      <Proof>
        <p>
          Equal logits give softmax probabilities 1/C, so each example contributes −log(1/C) = log C. In general the loss on
          an example is <C>logsumexp(z) − z_y</C>. With every |zᵢ| ≤ ε, <C>logsumexp(z)</C> lies between log C − ε and
          log C + ε, and z_y between −ε and ε, so the difference is within 2ε of log C. A much larger initial loss means the
          logits are not small, usually a bad initialisation scale or a missing normalisation; a much smaller one means the
          labels leak into the inputs.
        </p>
        <Code>{CHECKS}</Code>
      </Proof>

      <Example title="finding which examples talk to each other">
        <p>
          Perturb input j slightly and record which outputs change; repeating for every j gives a dependency matrix that
          should be the identity in evaluation mode. Off-diagonal entries reveal mixing across the batch: a softmax or
          normalisation over the wrong axis, batch norm left in training mode, or attention without its causal mask, which
          shows up as an output depending on later positions.
        </p>
        <Code>{DEPS}</Code>
      </Example>

      <Remark title="more silent bugs">
        <p>
          Calling <C>softmax</C> before a loss that expects logits; evaluating with dropout on; data augmentation that
          changes the label&apos;s meaning, such as flipping images of left and right arrows; shuffling inputs and labels
          separately; a tokenizer or normaliser fitted on the test set; weight decay applied to norms and biases; and a
          learning-rate schedule stepped per epoch instead of per step. Compare each component with a trusted reference on
          the same inputs, as an earlier course did with PyTorch itself.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "chance",
      rung: "check",
      prompt: <p>What should the initial cross-entropy be for a freshly initialised classifier over 1000 classes? Give two decimals.</p>,
      answer: { kind: "numeric", value: 6.91, tolerance: 0.006 },
    },
    {
      key: "bcast",
      rung: "check",
      prompt: <p>A batch of 512 predictions of shape (512, 1) is subtracted from targets of shape (512,). How many elements does the result have?</p>,
      answer: { kind: "numeric", value: 262144, tolerance: 0.5 },
    },
    {
      key: "double",
      rung: "apply",
      prompt: <p>A model ends in <C>softmax</C> and its output is passed to <C>F.cross_entropy</C>. What goes wrong?</p>,
      answer: {
        kind: "choice",
        options: [
          "cross_entropy applies log-softmax itself, so probabilities in [0, 1] are treated as logits; gradients shrink and training is slow and poor, with no error raised",
          "PyTorch raises an error because the inputs sum to one",
          "Nothing, since softmax is idempotent",
          "The loss becomes NaN",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math
import numpy as np

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def cross_entropy(logits, labels):
    p = softmax(logits)
    return float(-np.mean(np.log(p[np.arange(len(labels)), labels])))

def init_loss_gap(logits, labels):
    return abs(cross_entropy(logits, labels) - math.log(logits.shape[1]))

def safe_mse(pred, target):
    if np.shape(pred) != np.shape(target):
        raise ValueError(f'shape mismatch {np.shape(pred)} vs {np.shape(target)}')
    return float(np.mean((pred - target) ** 2))

def overfit_loss(X, y, steps, lr, classes=None):
    k = classes or int(y.max()) + 1
    W, onehot = np.zeros((X.shape[1], k)), np.eye(k)[y]
    for _ in range(steps):
        W -= lr * X.T @ (softmax(X @ W) - onehot) / len(y)
    return cross_entropy(X @ W, y)

rng = np.random.default_rng(0); logits = 0.01 * rng.normal(size=(64, 10)); labels = rng.integers(0, 10, 64)
print(round(init_loss_gap(logits, labels), 2), init_loss_gap(1000 * logits, labels) > 1, (np.zeros((4, 1)) - np.zeros(4)).shape)
try: safe_mse(np.zeros((4, 1)), np.zeros(4))
except ValueError as e: print(e)
X = rng.normal(size=(8, 5)); y = rng.integers(0, 3, 8); print(overfit_loss(X, y, 2000, 1.0) < 0.05, round(overfit_loss(X, y, 0, 1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 True (4, 4)\nshape mismatch (4, 1) vs (4,)\nTrue 1.0986",
          "0.0 True (4,)\nshape mismatch (4, 1) vs (4,)\nTrue 1.0986",
          "2.3 True (4, 4)\nshape mismatch (4, 1) vs (4,)\nTrue 1.0986",
          "0.0 True (4, 4)\nshape mismatch (4, 1) vs (4,)\nFalse 0.6931",
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

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def batch_independent(f, X, tol=1e-9):
    whole = f(X)
    return all(np.allclose(whole[i], f(X[i:i + 1])[0], atol=tol) for i in range(len(X)))

def dependency_matrix(f, X, eps=1e-4):
    base, n = f(X), len(X)
    D = np.zeros((n, n), dtype=bool)
    for j in range(n):
        Xp = X.copy()
        Xp[j] += eps
        D[:, j] = np.any(np.abs(f(Xp) - base).reshape(n, -1) > 1e-12, axis=1)
    return D

def leaks(f, X):
    D = dependency_matrix(f, X)
    return [(i, j) for i in range(len(X)) for j in range(len(X)) if i != j and D[i, j]]

Z = np.array([[1.0, 2.0], [3.0, 0.0], [0.0, 0.0]])
print(batch_independent(lambda X: softmax(X, axis=1), Z), batch_independent(lambda X: softmax(X, axis=0), Z), batch_independent(lambda X: X - X.mean(axis=0), Z))
print(dependency_matrix(lambda X: X * 2, Z).sum(), leaks(lambda X: softmax(X, axis=0), Z[:2]), leaks(lambda X: np.cumsum(X, axis=0), Z))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True False False\n3 [(0, 1), (1, 0)] [(1, 0), (2, 0), (2, 1)]",
          "True False True\n3 [(0, 1), (1, 0)] [(1, 0), (2, 0), (2, 1)]",
          "True False False\n3 [(0, 1), (1, 0)] [(0, 1), (0, 2), (1, 2)]",
          "False True False\n9 [(0, 1), (1, 0)] [(1, 0), (2, 0), (2, 1)]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>softmax</C> and <C>cross_entropy</C>, write <C>init_loss_gap(logits, labels)</C>, the distance
          of the loss from log C, <C>safe_mse(pred, target)</C>, which raises ValueError on any shape mismatch, and{" "}
          <C>overfit_loss(X, y, steps, lr, classes=None)</C>, which trains softmax regression from zero weights by full-batch
          gradient descent and returns the final loss.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math
import numpy as np

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def cross_entropy(logits, labels):
    p = softmax(logits)
    return float(-np.mean(np.log(p[np.arange(len(labels)), labels])))

def init_loss_gap(logits, labels):
    return 0.0

def safe_mse(pred, target):
    return float(np.mean((pred - target) ** 2))

def overfit_loss(X, y, steps, lr, classes=None):
    return 0.0
`,
        solution: CHECKS,
        tests: [
          { name: "gap", code: `z = np.zeros((5, 4)); assert abs(init_loss_gap(z, np.array([0, 1, 2, 3, 0]))) < 1e-12
z = np.array([[3.0, 0.0], [0.0, 3.0]]); assert abs(init_loss_gap(z, np.array([1, 0])) - abs(cross_entropy(z, np.array([1, 0])) - math.log(2))) < 1e-12
assert safe_mse(np.array([1.0, 3.0]), np.array([0.0, 0.0])) == 5.0
try:
    safe_mse(np.zeros((3, 1)), np.zeros(3))
    assert False
except ValueError:
    pass` },
          { name: "overfit", code: `rng = np.random.default_rng(1); X = rng.normal(size=(6, 4)); y = np.array([0, 1, 2, 0, 1, 2])
assert abs(overfit_loss(X, y, 0, 0.5) - math.log(3)) < 1e-12 and overfit_loss(X, y, 3000, 0.5) < 0.02
assert abs(overfit_loss(X, np.zeros(6, int), 0, 0.5, classes=5) - math.log(5)) < 1e-12 and overfit_loss(X, y, 50, 0.5) < overfit_loss(X, y, 10, 0.5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>softmax</C>, write <C>batch_independent(f, X, tol=1e-9)</C>, comparing each row of f(X) with f
          applied to that row alone, <C>dependency_matrix(f, X, eps=1e-4)</C>, whose entry (i, j) says whether output i
          changes when input j is perturbed by eps, and <C>leaks(f, X)</C>, the off-diagonal pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def softmax(z, axis=-1):
    e = np.exp(z - z.max(axis=axis, keepdims=True))
    return e / e.sum(axis=axis, keepdims=True)

def batch_independent(f, X, tol=1e-9):
    return True

def dependency_matrix(f, X, eps=1e-4):
    return np.eye(len(X), dtype=bool)

def leaks(f, X):
    return []
`,
        solution: DEPS,
        tests: [
          { name: "independent", code: `X = np.array([[1.0, -1.0, 0.5], [0.0, 2.0, 1.0], [3.0, 0.0, 0.0], [1.0, 1.0, 1.0]])
assert batch_independent(lambda Z: np.tanh(Z) * 2, X) and not batch_independent(lambda Z: Z / Z.std(axis=0, keepdims=True).clip(1e-6), X)
assert batch_independent(lambda Z: softmax(Z, axis=-1), X) and not batch_independent(lambda Z: softmax(Z, axis=0), X)` },
          { name: "deps", code: `X = np.arange(12.0).reshape(4, 3)
assert np.array_equal(dependency_matrix(lambda Z: Z ** 2, X), np.eye(4, dtype=bool)) and leaks(lambda Z: Z + 1, X) == []
assert leaks(lambda Z: np.cumsum(Z, axis=0)[:, :1], X) == [(1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2)] and leaks(lambda Z: Z - Z.mean(axis=0), X[:2]) == [(0, 1), (1, 0)]` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          The dependency check perturbs each input in turn. For a batch of 32 sequences of 128 positions, checking
          dependencies between positions of one sequence, how many forward passes does it take beyond the baseline?
        </p>
      ),
      answer: { kind: "numeric", value: 128, tolerance: 0.1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Checks before a run catch bugs in the code. The last lesson of the course is about the run itself: which numbers
        to log while it trains, and how to read them early enough to stop a run that is going wrong.
      </p>
    </>
  ),
};
