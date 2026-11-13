import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NormAxesViz } from "@/components/viz/NormAxesViz";
import type { LessonContent } from "@/lib/types";

const NORM = `import numpy as np

def batch_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=0)
    var = X.var(axis=0)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

def layer_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=1, keepdims=True)
    var = X.var(axis=1, keepdims=True)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta`;

const RMS = `def rms_norm(X, g, eps=1e-6):
    return g * X / np.sqrt(np.mean(X ** 2, axis=1, keepdims=True) + eps)

class RunningBatchNorm:
    def __init__(self, d, momentum=0.1, eps=1e-5):
        self.mean, self.var = np.zeros(d), np.ones(d)
        self.momentum, self.eps = momentum, eps

    def __call__(self, X, training):
        if training:
            mu, var = X.mean(axis=0), X.var(axis=0)
            m = self.momentum
            self.mean = (1 - m) * self.mean + m * mu
            self.var = (1 - m) * self.var + m * var
        else:
            mu, var = self.mean, self.var
        return (X - mu) / np.sqrt(var + self.eps)`;

export const lesson: LessonContent = {
  id: "l3.5.2",
  minutes: 50,
  links: {
    requires: ["l3.5.1"],
    revisits: ["l3.4.1"],
    foreshadows: ["l3.5.3", "m14.6.4", "e9.3.2"],
  },

  puzzle: (
    <>
      <p>
        Careful initialisation sets every layer's activations to a good scale, but only at step 0. As soon as the weights
        change, the scales drift, and a drift of a few per cent per layer compounds over depth just as a bad initialisation
        did. Instead of hoping the scale stays right, why not reset it inside the network, at every layer, on every forward
        pass?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A normalisation layer subtracts a mean and divides by a standard deviation, then lets the network choose its own
        scale and shift with two learned vectors, γ and β. The variants differ only in which numbers the mean and standard
        deviation are taken over: the same feature across the batch, or all features of the same example.
      </p>
      <NormAxesViz />
    </>
  ),

  theory: (
    <>
      <Definition title="batch, layer and RMS normalisation">
        <p>For a batch X of shape (N, d), with learned γ, β of shape (d,) and a small ε:</p>
        <MD>{"\\text{BN: } \\hat x_{nj} = \\frac{x_{nj} - \\mu_j}{\\sqrt{\\sigma_j^2 + \\varepsilon}}, \\quad \\mu_j = \\tfrac1N\\textstyle\\sum_n x_{nj}; \\qquad \\text{LN: } \\hat x_{nj} = \\frac{x_{nj} - \\mu_n}{\\sqrt{\\sigma_n^2 + \\varepsilon}}, \\quad \\mu_n = \\tfrac1d\\textstyle\\sum_j x_{nj}."}</MD>
        <p>
          The output is <M>{"\\gamma \\odot \\hat x + \\beta"}</M>. RMSNorm drops the mean and β:{" "}
          <M>{"g \\odot x / \\sqrt{\\tfrac1d\\sum_j x_j^2 + \\varepsilon}"}</M>.
        </p>
        <Code>{NORM}</Code>
      </Definition>

      <Theorem title="scale invariance">
        <p>
          For <M>{"\\varepsilon = 0"}</M> and any <M>{"\\alpha > 0"}</M>, <M>{"\\mathrm{LN}(\\alpha x) = \\mathrm{LN}(x)"}</M>{" "}
          and <M>{"\\mathrm{RMS}(\\alpha x) = \\mathrm{RMS}(x)"}</M>. Consequently, for any scale-invariant f,{" "}
          <M>{"\\nabla f(x) \\cdot x = 0"}</M>: the gradient is orthogonal to the input.
        </p>
      </Theorem>
      <Proof>
        <p>
          Scaling x by α scales its mean, its centred values and its standard deviation (or RMS) all by α, and the ratio
          cancels it. For the second part, <M>{"f(\\alpha x) = f(x)"}</M> for every α &gt; 0, so differentiating with respect
          to α at α = 1 gives <M>{"\\nabla f(x) \\cdot x = 0"}</M>.
        </p>
      </Proof>

      <Remark title="why it helps">
        <p>
          A normalised layer's output does not depend on the scale of the weights feeding it, so the per-layer gain of
          chapter 4 is reset to 1 at every layer and cannot compound. The orthogonality means gradient steps cannot shrink
          those weights directly; they rotate them, which makes training less sensitive to the learning rate.
        </p>
      </Remark>

      <Definition title="training and evaluation for BatchNorm">
        <p>
          BatchNorm couples the examples of a batch: one example's output depends on the others. At test time there may be
          only one example, so BN keeps exponential running averages of μ and σ² during training and uses those for
          evaluation. LayerNorm and RMSNorm need no such switch, and they work for any batch size, which is why transformers
          use them.
        </p>
        <Code>{RMS}</Code>
      </Definition>

      <Example title="placement">
        <p>
          In an MLP, BN usually goes between the linear layer and the activation. In a transformer, LN or RMSNorm goes at the
          start of each block (pre-norm). A linear layer followed by BN does not need a bias: the mean subtraction removes it
          and β replaces it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rms",
      rung: "check",
      prompt: <p>RMSNorm with g = 1 and ε = 0 maps x = (3, 4) to what first component?</p>,
      answer: { kind: "numeric", value: 0.84852814, tolerance: 1e-5 },
    },
    {
      key: "ln",
      rung: "check",
      prompt: <p>LayerNorm with γ = 1, β = 0 and ε = 0 maps x = (1, 2, 3) to what first component?</p>,
      answer: { kind: "numeric", value: -1.22474487, tolerance: 1e-5 },
    },
    {
      key: "batch1",
      rung: "apply",
      prompt: <p>A model must make predictions one example at a time during training as well as testing. Which normalisations can it use?</p>,
      answer: {
        kind: "choice",
        options: ["LayerNorm and RMSNorm", "BatchNorm only", "All three", "None of them"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def batch_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=0)
    var = X.var(axis=0)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

def layer_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=1, keepdims=True)
    var = X.var(axis=1, keepdims=True)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

X = np.array([[1.0, 10.0], [3.0, 30.0]])
print(np.round(batch_norm(X, 1.0, 0.0, eps=0.0), 3))
print(np.round(layer_norm(X, 1.0, 0.0, eps=0.0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-1. -1.]\n [ 1.  1.]]\n[[-1.  1.]\n [-1.  1.]]",
          "[[-1.  1.]\n [-1.  1.]]\n[[-1. -1.]\n [ 1.  1.]]",
          "[[-1. -1.]\n [ 1.  1.]]\n[[-1. -1.]\n [ 1.  1.]]",
          "[[ 0.  0.]\n [ 0.  0.]]\n[[-1.  1.]\n [-1.  1.]]",
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

def batch_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=0)
    var = X.var(axis=0)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

def layer_norm(X, gamma, beta, eps=1e-5):
    mu = X.mean(axis=1, keepdims=True)
    var = X.var(axis=1, keepdims=True)
    return gamma * (X - mu) / np.sqrt(var + eps) + beta

x = np.array([[1.0, 2.0, 3.0]])
print(np.allclose(layer_norm(5 * x, 1.0, 0.0), layer_norm(x, 1.0, 0.0)))
A = np.array([[1.0], [2.0], [3.0]]); B = np.array([[1.0], [2.0], [9.0]])
print(round(batch_norm(A, 1.0, 0.0)[0, 0], 2), round(batch_norm(B, 1.0, 0.0)[0, 0], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True\n-1.22 -0.84", "False\n-1.22 -0.84", "True\n-1.22 -1.22", "False\n-1.22 -1.22"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>batch_norm(X, gamma, beta, eps)</C> (training mode, statistics over axis 0) and{" "}
          <C>layer_norm(X, gamma, beta, eps)</C> (statistics over each row), both using the biased variance and{" "}
          <C>eps=1e-5</C> by default.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def batch_norm(X, gamma, beta, eps=1e-5):
    return X

def layer_norm(X, gamma, beta, eps=1e-5):
    return X
`,
        solution: NORM,
        tests: [
          { name: "batch norm", code: `rng = np.random.default_rng(0)
X = rng.normal(3.0, 5.0, size=(64, 4))
Y = batch_norm(X, np.ones(4), np.zeros(4))
assert np.allclose(Y.mean(axis=0), 0) and np.allclose(Y.var(axis=0), 1, atol=1e-5)
Y2 = batch_norm(X, np.array([1.0, 2.0, 3.0, 4.0]), np.array([0.0, 1.0, 0.0, -1.0]), eps=0.0)
assert np.allclose(Y2.mean(axis=0), [0, 1, 0, -1]) and np.allclose(Y2.std(axis=0), [1, 2, 3, 4])` },
          { name: "layer norm", code: `X = np.array([[1.0, 2.0, 3.0], [10.0, 10.0, 40.0]])
Y = layer_norm(X, 1.0, 0.0, eps=0.0)
assert np.allclose(Y[0], [-1.2247449, 0, 1.2247449]) and np.allclose(Y.mean(axis=1), 0) and np.allclose(Y.var(axis=1), 1)
assert np.allclose(layer_norm(7 * X, 1.0, 0.0, eps=0.0), Y)
assert np.allclose(layer_norm(X[:1], 1.0, 0.0, eps=0.0), Y[:1])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rms_norm(X, g, eps=1e-6)</C>, row by row, and a class <C>RunningBatchNorm(d, momentum=0.1, eps=1e-5)</C>{" "}
          without γ and β. It starts with running mean 0 and running variance 1. Calling it with <C>training=True</C>{" "}
          normalises with the batch statistics and updates <C>self.mean</C> and <C>self.var</C> as{" "}
          <C>(1 − momentum) · old + momentum · batch</C> (biased variance); with <C>training=False</C> it normalises with the
          running statistics and changes nothing.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rms_norm(X, g, eps=1e-6):
    return X

class RunningBatchNorm:
    def __init__(self, d, momentum=0.1, eps=1e-5):
        self.mean, self.var = np.zeros(d), np.ones(d)

    def __call__(self, X, training):
        return X
`,
        solution: `import numpy as np

${RMS}`,
        tests: [
          { name: "rms", code: `X = np.array([[3.0, 4.0], [1.0, 1.0]])
Y = rms_norm(X, 1.0, eps=0.0)
assert np.allclose(Y, [[3 / np.sqrt(12.5), 4 / np.sqrt(12.5)], [1, 1]])
assert np.allclose(rms_norm(X, np.array([2.0, 0.5]), eps=0.0), Y * [2.0, 0.5])
assert np.allclose(rms_norm(5 * X, 1.0, eps=0.0), Y)` },
          { name: "running stats", code: `bn = RunningBatchNorm(2, momentum=0.5, eps=0.0)
X = np.array([[0.0, 2.0], [4.0, 6.0]])
Y = bn(X, training=True)
assert np.allclose(Y, [[-1, -1], [1, 1]])
assert np.allclose(bn.mean, [1.0, 2.0]) and np.allclose(bn.var, [2.5, 2.5])
Z = bn(np.array([[1.0, 2.0]]), training=False)
assert np.allclose(Z, [[0.0, 0.0]]) and np.allclose(bn.mean, [1.0, 2.0])
bn(X, training=True)
assert np.allclose(bn.mean, [1.5, 3.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if f(αx) = f(x) for all α &gt; 0 and f is differentiable, then ∇f(x) · x = 0. Explain what this means for a weight vector feeding a normalisation layer.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Defines g(α) = f(αx), notes g is constant in α, so g′(1) = 0.",
          "Computes g′(1) = ∇f(x) · x by the chain rule and concludes it is 0.",
          "Interprets: the loss gradient with respect to such weights is orthogonal to them, so a gradient step does not shrink them to first order (their norm can only grow or stay, and the step mainly rotates them).",
        ],
      },
    },
    {
      key: "growth",
      rung: "stretch",
      prompt: <p>A weight vector w with ‖w‖ = 1 receives a gradient step of length 0.5 orthogonal to w. What is ‖w‖ afterwards?</p>,
      answer: { kind: "numeric", value: 1.118033989, tolerance: 1e-6 },
    },
  ],

  teachBack:
    "Explain to a friend what batch, layer and RMS normalisation each compute, why BatchNorm needs running statistics, and why scale invariance stabilises training.",

  glimpse: (
    <p>
      Normalisation fixes the scale of activations, but the gradient still has to pass through every layer's Jacobian. Next:
      residual connections, which give it a path around them.
    </p>
  ),
};
