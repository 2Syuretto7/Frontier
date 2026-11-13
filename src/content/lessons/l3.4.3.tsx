import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DeadReluViz } from "@/components/viz/DeadReluViz";
import type { LessonContent } from "@/lib/types";

const STATS = `import numpy as np

def dead_fraction(A):
    return float(np.mean(np.all(A <= 0, axis=0)))

def saturated_fraction(Hb, thresh=0.99):
    return float(np.mean(np.abs(Hb) > thresh))`;

const REINIT = `def reinit_dead(W, b, X, rng):
    dead = np.all(X @ W + b <= 0, axis=0)
    W, b = W.copy(), b.copy()
    W[:, dead] = rng.normal(0, np.sqrt(2 / W.shape[0]), size=(W.shape[0], dead.sum()))
    b[dead] = 0.0
    return W, b, int(dead.sum())`;

export const lesson: LessonContent = {
  id: "l3.4.3",
  minutes: 40,
  links: {
    requires: ["l3.4.2"],
    revisits: ["l3.1.3", "l3.2.2"],
    foreshadows: ["l3.5.1", "l3.8.3"],
  },

  puzzle: (
    <>
      <p>
        A network trains well for a few hundred steps, then someone raises the learning rate. The loss jumps, settles, and
        never again gets as low as before, even after the learning rate is lowered back. Inspection shows that most of the
        hidden units output 0 for every training example. They are not just quiet: they can never speak again. Why?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A ReLU passes gradient only where its input is positive. If one large step pushes a unit's bias so negative that the
        unit is off for every input, no example sends it any gradient, so no later step can move it back. tanh and sigmoid
        fail more gently: far from 0 they flatten out, and a flat function passes back a tiny gradient. The first is a dead
        unit, the second a saturated one.
      </p>
      <DeadReluViz />
    </>
  ),

  theory: (
    <>
      <Definition title="dead and saturated units">
        <p>
          A ReLU unit is <em>dead</em> on a dataset if its pre-activation <M>{"a = w^\\top x + b \\le 0"}</M> for every
          example. A tanh or sigmoid unit is <em>saturated</em> on an example if its output is close to the function's limits,
          where the derivative is close to 0.
        </p>
      </Definition>

      <Theorem title="dead units stay dead">
        <p>
          If a ReLU unit is dead on the training set, then under (full-batch) gradient descent the gradients of the loss with
          respect to its incoming weights and bias are exactly 0, so it remains dead at every later step.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule, <M>{"\\partial L/\\partial w = \\sum_n \\delta_n \\operatorname{relu}'(a_n) x_n"}</M> and{" "}
          <M>{"\\partial L/\\partial b = \\sum_n \\delta_n \\operatorname{relu}'(a_n)"}</M>. Every <M>{"a_n \\le 0"}</M>, so
          every <M>{"\\operatorname{relu}'(a_n) = 0"}</M> (taking the derivative at 0 to be 0), and both sums vanish. The unit's
          w and b are unchanged, so its pre-activations are unchanged and it is still dead. Induction on the step finishes it.
          Its outgoing weight receives gradient <M>{"\\sum_n \\delta_n h_n = 0"}</M> too, since every <M>{"h_n = 0"}</M>.
        </p>
      </Proof>

      <Remark title="saturation is a matter of degree">
        <MD>{"\\tanh'(a) = 1 - \\tanh^2(a), \\qquad \\tanh'(3) \\approx 0.0099, \\qquad \\sigma'(a) = \\sigma(a)(1 - \\sigma(a)) \\le \\tfrac14."}</MD>
        <p>
          A tanh unit with |a| = 3 passes back one per cent of the gradient it receives. It is not dead, since a large enough
          gradient can still move it, but it learns slowly, and through several saturated layers the factors multiply.
        </p>
      </Remark>

      <Example title="measuring it">
        <p>
          Both are cheap to monitor: run a batch and count. A dead fraction that grows during training, or a large saturated
          fraction at initialisation, is a sign that the learning rate or the initial scale is too large.
        </p>
        <Code>{STATS}</Code>
      </Example>

      <Remark title="remedies">
        <p>
          Lower the learning rate or warm it up (chapter 6). Use He initialisation and biases of 0 or a small positive value.
          Use a leaky ReLU, <M>{"\\max(a, 0.01a)"}</M>, or a smooth activation such as GELU, whose gradient is never exactly 0.
          Normalisation (chapter 5) keeps pre-activations centred. As a last resort, re-initialise the dead units:
        </p>
        <Code>{REINIT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "tanh3",
      rung: "check",
      prompt: <p>What is tanh′(3), to 4 decimal places?</p>,
      answer: { kind: "numeric", value: 0.0098660372, tolerance: 1e-4 },
    },
    {
      key: "sigmax",
      rung: "check",
      prompt: <p>What is the largest value of the sigmoid's derivative σ′(a) over all a?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
    {
      key: "lowerlr",
      rung: "apply",
      prompt: <p>Half of a network's ReLU units died after a learning-rate spike. The learning rate is now lowered. What happens to the dead units?</p>,
      answer: {
        kind: "choice",
        options: [
          "Nothing: they receive zero gradient, so they stay dead",
          "They slowly recover because the learning rate is smaller",
          "They recover at once because the loss gradient is larger",
          "They are removed from the network automatically",
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

def dead_fraction(A):
    return float(np.mean(np.all(A <= 0, axis=0)))

X = np.array([[1.0, 2.0], [-1.0, 0.5], [0.0, -1.0]])
W = np.array([[1.0, 0.5], [1.0, -0.5]]); b = np.array([0.0, -3.0])
A = X @ W + b
dA = np.ones_like(A) * (A > 0)
print(X.T @ dA, dead_fraction(A))`}</Code>
          <p>The gradient of the sum of a layer's ReLU outputs with respect to W. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1. 0.]\n [2. 0.]] 0.5",
          "[[0. 0.]\n [1.5 0.]] 0.5",
          "[[1. 0.]\n [2. 0.]] 0.0",
          "[[1. 1.]\n [2. 2.]] 0.5",
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

def dead_fraction(A):
    return float(np.mean(np.all(A <= 0, axis=0)))

def saturated_fraction(Hb, thresh=0.99):
    return float(np.mean(np.abs(Hb) > thresh))

a = np.array([0.0, 1.0, 3.0, 6.0])
print(np.round(1 - np.tanh(a) ** 2, 4))
print(saturated_fraction(np.tanh(np.array([[0.5, 3.0], [-4.0, 1.0]]))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.     0.42   0.0099 0.    ]\n0.5",
          "[1.     0.7616 0.9951 1.    ]\n0.5",
          "[1.     0.42   0.0099 0.    ]\n0.25",
          "[0.     0.42   0.0099 1.    ]\n0.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dead_fraction(A)</C>, where A is an (N, units) array of ReLU pre-activations on a batch, returning the
          fraction of units that are ≤ 0 on every example, and <C>saturated_fraction(Hb, thresh)</C>, the fraction of all
          entries of a tanh output array with absolute value above thresh (default 0.99). Both return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dead_fraction(A):
    return float(np.mean(A <= 0))

def saturated_fraction(Hb, thresh=0.99):
    return 0.0
`,
        solution: STATS,
        tests: [
          { name: "dead", code: `A = np.array([[1.0, -1.0, 0.0, -2.0], [-1.0, -0.5, 0.0, 3.0], [-2.0, -3.0, 0.0, -1.0]])
assert abs(dead_fraction(A) - 0.5) < 1e-12 and isinstance(dead_fraction(A), float)
assert dead_fraction(np.ones((2, 3))) == 0.0` },
          { name: "saturated", code: `Hb = np.tanh(np.array([[0.5, 3.0, -4.0], [1.0, -0.1, 2.0]]))
assert abs(saturated_fraction(Hb) - 1 / 3) < 1e-12
assert abs(saturated_fraction(Hb, 0.9) - 0.5) < 1e-12
assert isinstance(saturated_fraction(Hb), float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reinit_dead(W, b, X, rng)</C> for a ReLU layer with pre-activations <C>X @ W + b</C>. Find the units dead on
          X, give each a fresh He-normal column of W (standard deviation √(2/n_in), drawn with <C>rng</C>) and a bias of 0, and
          return <C>(W_new, b_new, number_reinitialised)</C> without modifying the inputs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def reinit_dead(W, b, X, rng):
    return W, b, 0
`,
        solution: `import numpy as np

${REINIT}`,
        tests: [
          { name: "only dead units", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(50, 4))
W = rng.normal(size=(4, 6)); b = np.array([0.0, -100.0, 0.5, -100.0, 0.0, 0.0])
W0, b0 = W.copy(), b.copy()
W2, b2, k = reinit_dead(W, b, X, rng)
assert k == 2 and np.array_equal(W, W0) and np.array_equal(b, b0)
live = [0, 2, 4, 5]
assert np.array_equal(W2[:, live], W[:, live]) and np.array_equal(b2[live], b[live])
assert b2[1] == 0.0 and b2[3] == 0.0 and not np.allclose(W2[:, 1], W[:, 1])` },
          { name: "revived", code: `rng = np.random.default_rng(1)
X = rng.normal(size=(200, 300))
W = rng.normal(size=(300, 40)); b = np.full(40, -1e6)
W2, b2, k = reinit_dead(W, b, X, rng)
assert k == 40 and not np.any(np.all(X @ W2 + b2 <= 0, axis=0))
assert abs(W2.std() - np.sqrt(2 / 300)) < 0.005` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that a ReLU unit that is dead on the whole training set stays dead under full-batch gradient descent.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the gradient for the unit's weights and bias as sums over examples of δₙ·relu′(aₙ)·xₙ and δₙ·relu′(aₙ).",
          "Notes relu′(aₙ) = 0 for every example because every aₙ ≤ 0, so both gradients are exactly zero.",
          "Concludes the weights and bias, hence the pre-activations, are unchanged, so the unit is dead at the next step and by induction at every step.",
        ],
      },
    },
    {
      key: "chain",
      rung: "stretch",
      prompt: <p>A gradient passes back through five sigmoid units in series, each at a = 0, with all weights 1. By what factor is it multiplied?</p>,
      answer: { kind: "numeric", value: 0.0009765625, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend what a dead ReLU is, why it can never recover under gradient descent, how saturation differs, and how to detect and prevent both.",

  glimpse: (
    <p>
      Saturation multiplies small factors across layers. Next: vanishing and exploding gradients, the same multiplication
      seen across a whole deep network.
    </p>
  ),
};
