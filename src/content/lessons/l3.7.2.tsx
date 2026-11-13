import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DropoutMaskViz } from "@/components/viz/DropoutMaskViz";
import type { LessonContent } from "@/lib/types";

const DROP = `import numpy as np

def dropout_forward(h, p, rng):
    mask = (rng.random(h.shape) >= p) / (1 - p)
    return h * mask, mask

def dropout_backward(grad_out, mask):
    return grad_out * mask`;

const PEN = `def expected_dropout_loss(X, y, w, p):
    mse = np.mean((y - X @ w) ** 2)
    return float(mse + p / (1 - p) * np.mean((X ** 2) @ (w ** 2)))

def mc_dropout_loss(X, y, w, p, n, rng):
    total = 0.0
    for _ in range(n):
        M = (rng.random(X.shape) >= p) / (1 - p)
        total += np.mean((y - (M * X) @ w) ** 2)
    return float(total / n)`;

export const lesson: LessonContent = {
  id: "l3.7.2",
  minutes: 45,
  links: {
    requires: ["l3.7.1"],
    revisits: ["l3.2.3"],
    foreshadows: ["l3.7.3", "l7.7.4"],
  },

  puzzle: (
    <>
      <p>
        During training, delete each hidden unit at random, independently, half the time, on every single example. It sounds
        like sabotage. Yet in 2012 this trick, dropout, was one of the things that made large networks generalise well enough
        to win ImageNet. Why would breaking the network on purpose make it better, and what should happen at test time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With dropout, no unit can rely on any particular other unit being present, so features must be useful on their own
        and redundantly spread out. Each mask picks one of exponentially many subnetworks that share weights; training
        dropout is training all of them at once, and the full network at test time approximates their average. For a linear
        model, the randomness turns into an explicit penalty on the weights.
      </p>
      <DropoutMaskViz />
    </>
  ),

  theory: (
    <>
      <Definition title="inverted dropout">
        <p>
          In training, each unit h is replaced by <M>{"h\\,m/(1 - p)"}</M> with <M>{"m \\sim \\text{Bernoulli}(1 - p)"}</M>{" "}
          independent per unit and per example. Since <M>{"\\mathbb{E}[m/(1 - p)] = 1"}</M>, every unit's expected value is
          unchanged, so at test time dropout is simply turned off. The backward pass multiplies the gradient by the same mask.
        </p>
        <Code>{DROP}</Code>
      </Definition>

      <Theorem title="dropout on a linear model is an L2 penalty">
        <p>
          For a linear predictor with dropout on the inputs, <M>{"\\hat y = \\sum_j x_j w_j m_j/(1 - p)"}</M>, the expected
          squared error is
        </p>
        <MD>{"\\mathbb{E}_m\\big[(y - \\hat y)^2\\big] = (y - x^\\top w)^2 + \\frac{p}{1 - p}\\sum_j x_j^2 w_j^2."}</MD>
      </Theorem>
      <Proof>
        <p>
          For any random variable, <M>{"\\mathbb{E}[(y - Z)^2] = (y - \\mathbb{E}Z)^2 + \\operatorname{Var}(Z)"}</M>. Here{" "}
          <M>{"\\mathbb{E}\\hat y = x^\\top w"}</M>. Each <M>{"m_j/(1 - p)"}</M> has variance{" "}
          <M>{"p(1 - p)/(1 - p)^2 = p/(1 - p)"}</M>, and the terms are independent, so{" "}
          <M>{"\\operatorname{Var}(\\hat y) = \\tfrac{p}{1 - p}\\sum_j x_j^2 w_j^2"}</M>.
        </p>
      </Proof>

      <Remark title="what the penalty prefers">
        <p>
          Averaged over the data, the penalty is <M>{"\\tfrac{p}{1 - p}\\sum_j \\overline{x_j^2}\\,w_j^2"}</M>: ridge
          regression in which each weight is penalised in proportion to how large its feature typically is. Unlike plain
          weight decay it is scale-aware, and it discourages putting a large weight on any one feature, which is the linear
          version of "do not rely on one unit".
        </p>
        <Code>{PEN}</Code>
      </Remark>

      <Example title="in practice">
        <p>
          Typical rates: 0.1 to 0.5 on fully connected layers, often 0.1 in transformers (on attention weights and residual
          branches), and little or none in convolutional networks with BatchNorm. Large language models trained on huge
          datasets for one epoch frequently use none: with no repeated data there is little to overfit. Keeping dropout on at
          test time and averaging several passes, Monte Carlo dropout, gives a cheap estimate of predictive uncertainty.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "scale",
      rung: "check",
      prompt: <p>With inverted dropout at p = 0.2, a surviving unit's value is multiplied by what?</p>,
      answer: { kind: "numeric", value: 1.25, tolerance: 1e-9 },
    },
    {
      key: "var",
      rung: "check",
      prompt: <p>What is the variance of m/(1 − p) when m is Bernoulli with success probability 1 − p and p = 0.5?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 1e-9 },
    },
    {
      key: "test",
      rung: "apply",
      prompt: <p>A network was trained with inverted dropout. What should be done at test time?</p>,
      answer: {
        kind: "choice",
        options: [
          "Turn dropout off and use the weights as they are",
          "Turn dropout off and multiply activations by 1 − p",
          "Keep dropout on with the same p",
          "Turn dropout off and divide the weights by 1 − p",
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

def dropout_forward(h, p, rng):
    mask = (rng.random(h.shape) >= p) / (1 - p)
    return h * mask, mask

def dropout_backward(grad_out, mask):
    return grad_out * mask

rng = np.random.default_rng(0)
h = np.ones(100000)
out, mask = dropout_forward(h, 0.2, rng)
print(round(float(out.mean()), 2), round(float((out == 0).mean()), 2), sorted(set(out.tolist())))
print(dropout_backward(np.array([1.0, 2.0, 3.0]), np.array([2.0, 0.0, 2.0])))`}</Code>
          <p>Which output is closest to what this prints?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.2 [0.0, 1.25]\n[2. 0. 6.]", "0.8 0.2 [0.0, 1.0]\n[2. 0. 6.]", "1.0 0.8 [0.0, 1.25]\n[1. 0. 3.]", "1.25 0.2 [0.0, 1.25]\n[2. 0. 6.]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def expected_dropout_loss(X, y, w, p):
    mse = np.mean((y - X @ w) ** 2)
    return float(mse + p / (1 - p) * np.mean((X ** 2) @ (w ** 2)))

def mc_dropout_loss(X, y, w, p, n, rng):
    total = 0.0
    for _ in range(n):
        M = (rng.random(X.shape) >= p) / (1 - p)
        total += np.mean((y - (M * X) @ w) ** 2)
    return float(total / n)

rng = np.random.default_rng(0)
X = np.array([[1.0, 2.0], [0.0, 1.0]]); y = np.array([1.0, 1.0]); w = np.array([1.0, 0.5])
print(round(expected_dropout_loss(X, y, w, 0.5), 3), round(mc_dropout_loss(X, y, w, 0.5, 20000, rng), 2))`}</Code>
          <p>Which output is closest to what this prints?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1.75 1.76", "0.625 1.76", "1.75 0.62", "1.125 1.12"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dropout_forward(h, p, rng)</C>, returning <C>(out, mask)</C> where mask holds 0 for dropped entries and{" "}
          <C>1/(1 − p)</C> for kept ones (keep an entry when <C>rng.random</C> gives a value ≥ p), and{" "}
          <C>dropout_backward(grad_out, mask)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def dropout_forward(h, p, rng):
    return h, np.ones_like(h)

def dropout_backward(grad_out, mask):
    return grad_out
`,
        solution: DROP,
        tests: [
          { name: "forward", code: `rng = np.random.default_rng(0)
out, mask = dropout_forward(np.ones(200000), 0.3, rng)
assert set(np.round(mask, 12).tolist()) == {0.0, round(1 / 0.7, 12)}
assert abs(out.mean() - 1) < 0.01 and abs((out == 0).mean() - 0.3) < 0.01
h = np.arange(12.0).reshape(3, 4)
o, m = dropout_forward(h, 0.5, np.random.default_rng(1))
assert o.shape == h.shape and np.allclose(o, h * m)` },
          { name: "backward", code: `assert np.allclose(dropout_backward(np.array([1.0, 2.0, 3.0]), np.array([2.0, 0.0, 2.0])), [2, 0, 6])
rng = np.random.default_rng(2)
h = rng.normal(size=(4, 5)); o, m = dropout_forward(h, 0.4, rng)
g = rng.normal(size=(4, 5))
assert np.allclose(dropout_backward(g, m), g * m)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a linear model with inverted dropout on the inputs, write <C>expected_dropout_loss(X, y, w, p)</C>, the closed
          form of the expected mean squared error from the theorem, and <C>mc_dropout_loss(X, y, w, p, n, rng)</C>, the
          average of the mean squared error over n random masks of the same shape as X. Both return floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def expected_dropout_loss(X, y, w, p):
    return float(np.mean((y - X @ w) ** 2))

def mc_dropout_loss(X, y, w, p, n, rng):
    return 0.0
`,
        solution: `import numpy as np

${PEN}`,
        tests: [
          { name: "closed form", code: `X = np.array([[1.0, 2.0], [0.0, 1.0]]); y = np.array([1.0, 1.0]); w = np.array([1.0, 0.5])
assert abs(expected_dropout_loss(X, y, w, 0.5) - 1.75) < 1e-12
assert abs(expected_dropout_loss(X, y, w, 0.0) - 0.625) < 1e-12
assert isinstance(expected_dropout_loss(X, y, w, 0.2), float)` },
          { name: "agrees with sampling", code: `rng = np.random.default_rng(3)
X = rng.normal(size=(30, 4)); y = rng.normal(size=30); w = rng.normal(size=4)
e = expected_dropout_loss(X, y, w, 0.3)
mc = mc_dropout_loss(X, y, w, 0.3, 4000, rng)
assert abs(mc - e) < 0.03 * e and isinstance(mc, float)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for ŷ = Σⱼ xⱼwⱼmⱼ/(1 − p) with independent mⱼ ~ Bernoulli(1 − p), E[(y − ŷ)²] = (y − xᵀw)² + (p/(1 − p))Σⱼ xⱼ²wⱼ².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses E[(y − Z)²] = (y − E Z)² + Var Z (bias–variance identity).",
          "Shows E ŷ = xᵀw because E[mⱼ/(1 − p)] = 1.",
          "Computes Var(mⱼ/(1 − p)) = p/(1 − p) and uses independence to sum the variances xⱼ²wⱼ²·p/(1 − p).",
        ],
      },
    },
    {
      key: "lam",
      rung: "stretch",
      prompt: <p>Dropout p = 0.2 on standardised inputs (every E[xⱼ²] = 1) of a linear model acts like ridge with what coefficient on Σⱼwⱼ² in the mean squared error?</p>,
      answer: { kind: "numeric", value: 0.25, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend how inverted dropout works in training and testing, why it regularises, and what penalty it amounts to for a linear model.",

  glimpse: (
    <p>
      Dropout adds noise to the network. Next: data augmentation, which adds structured variation to the data instead,
      encoding what the model should not care about.
    </p>
  ),
};
