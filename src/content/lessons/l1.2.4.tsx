import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { GradientDescentViz } from "@/components/viz/GradientDescentViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.2.4",
  minutes: 55,
  links: {
    revisits: ["l0.1.2", "l1.2.1"],
    parallels: ["m0.3.3"],
    foreshadows: ["m2.4.1", "m10.5.1", "l3.6.1"],
  },

  puzzle: (
    <>
      <p>
        You are standing on a hillside in thick fog and want to reach the bottom of the valley. You cannot see more than a
        metre, but you can feel which way the ground slopes under your feet.
      </p>
      <p>
        Describe a procedure that gets you down. How big should each step be? What goes wrong if your steps are tiny? What if
        they are huge?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Feel the slope, step downhill, repeat. Small steps are safe but slow; huge steps can carry you right across the
        valley and up the other side, higher than you started. Training a model is the same walk: the ground is the loss,
        and your position is the weights.
      </p>
      <p>
        Here a one-weight model is fitted by this procedure. Take a few steps, then try larger and larger learning rates.
      </p>
      <GradientDescentViz />
      <p>
        For least squares there is a formula, so why walk? Because most models, including every neural network, have no
        formula. Walking downhill works for all of them.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the gradient">
        <p>
          For a loss <M>{"L(w)"}</M> of one weight, the <strong>derivative</strong> <M>{"L'(w)"}</M> is the slope of the
          loss curve at <M>w</M>; Calculus makes this precise. With many weights, the <strong>gradient</strong>{" "}
          <M>{"\\nabla L(w)"}</M> collects the slopes in each weight&rsquo;s direction, and it points uphill. For a quadratic
          such as <M>{"L(w) = (w - c)^2"}</M>, the slope is <M>{"L'(w) = 2(w - c)"}</M>.
        </p>
      </Definition>

      <Definition title="gradient descent">
        <p>Start from some <M>{"w_0"}</M> and repeat</p>
        <MD>{"w_{t+1} = w_t - \\eta\\, \\nabla L(w_t),"}</MD>
        <p>
          where the <strong>learning rate</strong> <M>{"\\eta > 0"}</M> sets the step size. Near the bottom the slope is
          small, so the steps shrink by themselves.
        </p>
      </Definition>

      <Example title="a step by hand">
        <p>
          Fit <M>{"\\hat y = w x"}</M> to the points <M>{"(1, 2)"}</M> and <M>{"(2, 4)"}</M> with mean squared error{" "}
          <M>{"L(w) = \\tfrac12\\big((w - 2)^2 + (2w - 4)^2\\big)"}</M>. Its slope is{" "}
          <M>{"L'(w) = (w - 2) + 2(2w - 4) = 5w - 10"}</M>. From <M>{"w_0 = 0"}</M> with <M>{"\\eta = 0.1"}</M>:{" "}
          <M>{"w_1 = 0 - 0.1 \\times (-10) = 1"}</M>, then <M>{"w_2 = 1 - 0.1 \\times (-5) = 1.5"}</M>, closing in on the
          best weight 2.
        </p>
      </Example>

      <Example title="why the learning rate matters">
        <p>
          For <M>{"L(w) = (w - c)^2"}</M>, one step gives <M>{"w_{t+1} - c = (1 - 2\\eta)(w_t - c)"}</M>: the distance to the
          minimum is multiplied by <M>{"1 - 2\\eta"}</M> each time. If <M>{"0 < \\eta < 1"}</M>, that factor has size below
          1 and the distance shrinks to zero. At <M>{"\\eta = 1"}</M> the walk bounces between two points forever, and beyond
          it the distance grows: the method <strong>diverges</strong>. The steeper the curvature, the smaller the safe
          learning rate.
        </p>
      </Example>

      <Remark title="at scale">
        <p>
          A neural network has billions of weights and a loss that is far from a parabola, with flat regions and many valleys.
          Its gradient is computed by backpropagation, and over the whole dataset it would be too slow, so each step uses the
          gradient on a small random batch of examples: <strong>stochastic gradient descent</strong>. Every large model you
          will meet was trained by some refinement of this one-line update, and choosing its learning rate remains one of the
          most important decisions in training.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dir",
      rung: "check",
      prompt: <p>In which direction does a gradient descent step move the weights?</p>,
      answer: { kind: "choice", options: ["Opposite to the gradient, downhill", "Along the gradient, uphill", "In a random direction"], correct: [0] },
    },
    {
      key: "big",
      rung: "check",
      prompt: <p>What can happen if the learning rate is too large?</p>,
      answer: { kind: "choice", options: ["The steps overshoot and the loss grows: divergence", "Training becomes slow but safe", "Nothing: the size does not matter"], correct: [0] },
    },
    {
      key: "step",
      rung: "apply",
      prompt: <p>In the worked example, with <M>{"L'(w) = 5w - 10"}</M>, start at <M>{"w = 0"}</M> and take one step with <M>{"\\eta = 0.1"}</M>. What is the new <M>w</M>?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>For <M>{"L(w) = (w - 3)^2"}</M>, start at <M>{"w = 0"}</M> with <M>{"\\eta = 0.25"}</M>. What is <M>w</M> after two steps?</p>,
      answer: { kind: "numeric", value: 2.25 },
    },
    {
      key: "limit",
      rung: "apply",
      prompt: <p>For <M>{"L(w) = (w - 3)^2"}</M>, gradient descent converges for every learning rate between 0 and what value?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`w = 0.0
for step in range(3):
    grad = 2 * (w - 5)
    w -= 0.25 * grad
    print(w, end=" ")`}</Code>
          <p>Gradient descent on (w − 5)² with learning rate 0.25. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.5 3.75 4.375 ", "5.0 5.0 5.0 ", "2.5 5.0 7.5 ", "1.25 2.5 3.75 "], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`w, lr = 0.0, 0.3
for _ in range(3):
    grad = 2 * (w - 3)
    w -= lr * grad
    print(round(w, 4))`}</Code>
          <p>Three gradient steps on (w − 3)². What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.8\n2.52\n2.808", "1.8\n3.6\n2.88", "0.9\n1.53\n1.971", "1.8\n2.52\n2.88"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gd_linear(X, y, lr, steps)</C>, which fits least squares without an intercept by gradient descent on the mean squared error, starting from zeros. The gradient is (2/n) Xᵀ(Xw − y). Return w.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gd_linear(X, y, lr, steps):
    return np.zeros(X.shape[1])
`,
        solution: `import numpy as np

def gd_linear(X, y, lr, steps):
    n = len(X)
    w = np.zeros(X.shape[1])
    for _ in range(steps):
        w -= lr * (2 / n) * X.T @ (X @ w - y)
    return w
`,
        tests: [
          { name: "converges", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(200, 3)); y = X @ np.array([1.0, -2.0, 0.5])
w = gd_linear(X, y, 0.1, 500)
assert np.allclose(w, [1, -2, 0.5], atol=1e-3), 'Step against the gradient (2/n) Xᵀ(Xw − y).'` },
          { name: "one step", code: `import numpy as np
w = gd_linear(np.array([[1.0], [2.0]]), np.array([1.0, 2.0]), 0.1, 1)
assert np.allclose(w, [0.5]) and np.allclose(gd_linear(np.eye(2), np.ones(2), 0.1, 0), [0, 0]), 'From 0 the gradient is (2/2)·(−5) = −5, so w = 0.5.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>max_stable_lr(X)</C> for gradient descent on the mean squared error (1/n)‖Xw − y‖²: the Hessian is (2/n)XᵀX and descent converges exactly when the learning rate is below 2 divided by its largest eigenvalue, that is below n/λ_max(XᵀX). Then write <C>minibatch_sgd(X, y, lr, epochs, batch, seed)</C>: from w = 0, for each epoch take <C>rng.permutation(n)</C> from one <C>np.random.default_rng(seed)</C>, walk through it in consecutive batches (the last may be shorter) and step with the batch gradient (2/b)X_bᵀ(X_bw − y_b). Return w.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def max_stable_lr(X):
    return 1.0

def minibatch_sgd(X, y, lr, epochs, batch, seed):
    return np.zeros(X.shape[1])
`,
        solution: `import numpy as np

def max_stable_lr(X):
    return len(X) / np.linalg.eigvalsh(X.T @ X)[-1]

def minibatch_sgd(X, y, lr, epochs, batch, seed):
    rng = np.random.default_rng(seed)
    n = len(X)
    w = np.zeros(X.shape[1])
    for _ in range(epochs):
        order = rng.permutation(n)
        for s in range(0, n, batch):
            b = order[s:s + batch]
            w = w - lr * (2 / len(b)) * X[b].T @ (X[b] @ w - y[b])
    return w
`,
        tests: [
          { name: "edge", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(100, 3)) * [1, 3, 0.5]; y = X @ [1.0, 1.0, 1.0]
L = max_stable_lr(X)
def gd(lr, steps=3000):
    w = np.zeros(3)
    for _ in range(steps):
        w = w - lr * (2 / 100) * X.T @ (X @ w - y)
    return w
assert np.allclose(gd(0.95 * L), [1, 1, 1], atol=1e-6) and np.linalg.norm(gd(1.05 * L, 500)) > 1e6, 'Just below the limit converges; just above blows up.'` },
          { name: "full batch", code: `import numpy as np
rng = np.random.default_rng(1)
X = rng.normal(size=(20, 2)); y = X @ [2.0, -1.0]
w = minibatch_sgd(X, y, 0.1, 1, 20, 0)
assert np.allclose(w, 0.1 * (2 / 20) * X.T @ y), 'One full batch is one gradient step.'` },
          { name: "order", code: `import numpy as np
X = np.arange(1.0, 6.0)[:, None]; y = 2 * X[:, 0]
w = minibatch_sgd(X, y, 0.01, 1, 2, 3)
order = np.random.default_rng(3).permutation(5)
v = np.zeros(1)
for s in range(0, 5, 2):
    b = order[s:s + 2]
    v = v - 0.01 * (2 / len(b)) * X[b].T @ (X[b] @ v - y[b])
assert np.allclose(w, v), 'Batches in permutation order; the last batch has one row.'` },
          { name: "converge", code: `import numpy as np
rng = np.random.default_rng(2)
X = rng.normal(size=(500, 4)); y = X @ [1.0, -2.0, 3.0, 0.5]
assert np.allclose(minibatch_sgd(X, y, 0.05, 30, 16, 0), [1, -2, 3, 0.5], atol=1e-4), 'Noise-free data: SGD reaches the solution.'` },
        ],
      },
    },
    {
      key: "factor",
      rung: "prove",
      prompt: (
        <p>
          For <M>{"L(w) = (w - c)^2"}</M>, show that one gradient descent step multiplies the distance to <M>c</M> by{" "}
          <M>{"1 - 2\\eta"}</M>, and use this to explain what happens for <M>{"\\eta = 0.25"}</M>, <M>{"\\eta = 0.75"}</M>,{" "}
          <M>{"\\eta = 1"}</M> and <M>{"\\eta = 1.5"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes L'(w) = 2(w − c) and the update w − 2η(w − c).",
          "Subtracts c to get (1 − 2η)(w − c).",
          "η = 0.25: factor 0.5, steady approach from one side; η = 0.75: factor −0.5, converges while alternating sides.",
          "η = 1: factor −1, bounces between two points forever; η = 1.5: factor −2, the distance doubles each step and the method diverges.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>For <M>{"L(w) = (w - 3)^2"}</M>, starting at <M>{"w = 0"}</M> with <M>{"\\eta = 0.25"}</M>, how many steps are needed before <M>w</M> is within 0.01 of 3?</p>,
      answer: { kind: "numeric", value: 9 },
    },
  ],

  teachBack:
    "Explain to a friend how gradient descent finds good weights, what the learning rate does, and why too large a learning rate makes it diverge.",

  glimpse: (
    <p>
      This completes Linear regression. Next, classification, starting with logistic regression, which has no formula and
      must be fitted by gradient descent. Calculus defines the derivative properly, Convex Optimisation proves when and how
      fast gradient descent converges, and Neural Networks from Scratch adds momentum and the optimisers used in practice.
    </p>
  ),
};
