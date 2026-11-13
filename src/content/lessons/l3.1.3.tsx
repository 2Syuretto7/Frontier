import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ActivationGalleryViz } from "@/components/viz/ActivationGalleryViz";
import type { LessonContent } from "@/lib/types";

const ACTS = `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def silu(x):
    return x * sigmoid(x)

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def swiglu(X, W, V, W2):
    return (silu(X @ V) * (X @ W)) @ W2
`;

const GRADS = `def sigmoid_grad(x):
    s = sigmoid(x)
    return s * (1 - s)

def tanh_grad(x):
    return 1 - np.tanh(x) ** 2

def silu_grad(x):
    s = sigmoid(x)
    return s * (1 + x * (1 - s))
`;

export const lesson: LessonContent = {
  id: "l3.1.3",
  minutes: 50,
  links: {
    requires: ["l3.1.2", "m2.4.1"],
    revisits: ["l0.3.4"],
    parallels: ["e5.2.1"],
    foreshadows: ["l3.4.3", "l3.5.1", "l5.2.4"],
  },

  puzzle: (
    <>
      <p>
        The early neural networks used the sigmoid, a smooth S-curve, and deep ones would barely train. Replacing it with
        ReLU, max(0, x), a function so simple it has a corner, made deep networks work. Today&rsquo;s language models use yet
        another family, gated units such as SwiGLU. What does an activation function&rsquo;s shape do to learning?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In the backward pass every activation multiplies the gradient by its own derivative. The sigmoid&rsquo;s derivative
        is at most 1/4 and almost 0 once the input is large, so a gradient passing through many sigmoid layers shrinks
        geometrically. ReLU&rsquo;s derivative is exactly 1 wherever the unit is active, so gradients pass through untouched.
        Smooth relatives such as GELU and SiLU keep that behaviour while removing the corner, and gates multiply two linear
        views of the input, letting one decide how much of the other gets through.
      </p>
      <ActivationGalleryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the common activations">
        <MD>{"\\sigma(x) = \\frac{1}{1 + e^{-x}}, \\quad \\tanh x, \\quad \\operatorname{relu}(x) = \\max(0, x), \\quad \\operatorname{silu}(x) = x\\,\\sigma(x), \\quad \\operatorname{gelu}(x) = x\\,\\Phi(x),"}</MD>
        <p>
          where <M>{"\\Phi"}</M> is the standard normal distribution function. GELU is usually computed with the tanh
          approximation below.
        </p>
        <Code>{ACTS}</Code>
      </Definition>

      <Theorem title="sigmoid and tanh shrink gradients">
        <p>
          <M>{"\\sigma'(x) = \\sigma(x)(1 - \\sigma(x)) \\le \\tfrac14"}</M> and <M>{"\\tanh'(x) = 1 - \\tanh^2 x \\le 1"}</M>,
          with equality only at <M>{"x = 0"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Differentiating, <M>{"\\sigma'(x) = e^{-x}/(1 + e^{-x})^2 = \\sigma(x)\\,(1 - \\sigma(x))"}</M>. With{" "}
          <M>{"s = \\sigma(x) \\in (0, 1)"}</M>, <M>{"s(1 - s) = \\tfrac14 - (s - \\tfrac12)^2 \\le \\tfrac14"}</M>, with equality
          iff <M>{"s = \\tfrac12"}</M>, that is <M>{"x = 0"}</M>. Similarly <M>{"\\tanh' = 1 - \\tanh^2 \\le 1"}</M>, with
          equality iff <M>{"\\tanh x = 0"}</M>. So after L sigmoid layers, the activations alone scale a gradient by at most{" "}
          <M>{"4^{-L}"}</M>.
        </p>
      </Proof>

      <Definition title="gated linear units">
        <p>
          A GLU layer computes two linear maps of the same input and multiplies them entrywise, one passed through a gate:{" "}
          <M>{"\\operatorname{SwiGLU}(x) = \\big(\\operatorname{silu}(xV) \\odot xW\\big) W_2"}</M>. It has three weight
          matrices instead of two, so to match the parameters of an MLP with hidden width 4d, the hidden width is set to{" "}
          <M>{"\\tfrac{8}{3}d"}</M>. Llama and many later models use it in every transformer block.
        </p>
      </Definition>

      <Example title="derivatives for the backward pass">
        <Code>{GRADS}</Code>
        <p>
          The SiLU derivative follows from the product rule: <M>{"\\sigma(x) + x\\,\\sigma(x)(1 - \\sigma(x))"}</M>. It is
          slightly above 1 for moderate positive x and slightly negative for very negative x.
        </p>
      </Example>

      <Remark title="dead ReLUs">
        <p>
          If a ReLU unit&rsquo;s input is negative for every training example, its gradient is 0 everywhere and its weights
          never change again. A large learning rate step can push units into this state. Leaky ReLU, GELU and SiLU all have
          nonzero gradient for negative inputs, which avoids it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "maxslope",
      rung: "check",
      prompt: <p>What is the largest value of the sigmoid&rsquo;s derivative?</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "relugrad",
      rung: "check",
      prompt: <p>What does ReLU do to a gradient passing back through a unit whose input was negative?</p>,
      answer: { kind: "choice", options: ["Multiplies it by 0", "Passes it unchanged", "Multiplies it by 0.25", "Reverses its sign"], correct: [0] },
    },
    {
      key: "swiglu",
      rung: "apply",
      prompt: <p>A model has d = 768. A plain MLP block uses hidden width 4d with two weight matrices. What hidden width gives a SwiGLU block, with three matrices, the same number of weights?</p>,
      answer: { kind: "numeric", value: 2048 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ACTS}
x = np.array([-1.0, 0.0, 1.0])
print(np.round(np.maximum(x, 0), 3).tolist(), np.round(silu(x), 3).tolist(), np.round(gelu(x), 3).tolist())`}</Code>
          <p>ReLU, SiLU and GELU at −1, 0 and 1. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, 1.0] [-0.269, 0.0, 0.731] [-0.159, 0.0, 0.841]",
          "[0.0, 0.0, 1.0] [0.0, 0.0, 0.731] [0.0, 0.0, 0.841]",
          "[0.0, 0.0, 1.0] [-0.269, 0.5, 0.731] [-0.159, 0.5, 0.841]",
          "[-1.0, 0.0, 1.0] [-0.269, 0.0, 0.731] [-0.159, 0.0, 0.841]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ACTS}
${GRADS}
print(round(float(sigmoid_grad(0.0)) ** 10, 10), round(float(tanh_grad(0.0)) ** 10, 10))`}</Code>
          <p>The best case through ten layers. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["9.537e-07 1.0", "0.25 1.0", "9.537e-07 0.0", "2.5 10.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The starter gives <C>sigmoid</C>. Write NumPy functions <C>silu</C>, <C>gelu</C> (with the tanh approximation{" "}
          <M>{"\\tfrac12 x\\,(1 + \\tanh(\\sqrt{2/\\pi}\\,(x + 0.044715x^3)))"}</M>) and{" "}
          <C>swiglu(X, W, V, W2)</C>, computing <M>{"(\\operatorname{silu}(XV) \\odot XW)\\,W_2"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def silu(x):
    return x

def gelu(x):
    return x

def swiglu(X, W, V, W2):
    return X
`,
        solution: ACTS,
        tests: [
          { name: "values", code: `x = np.array([-2.0, 0.0, 3.0])
assert np.allclose(sigmoid(x), 1 / (1 + np.exp(-x)))
assert np.allclose(silu(x), [-2 / (1 + np.exp(2)), 0, 3 / (1 + np.exp(-3))])
assert abs(gelu(np.array([1.0]))[0] - 0.8411919906) < 1e-8` },
          { name: "SwiGLU shapes", code: `rng = np.random.default_rng(0)
X = rng.normal(size=(4, 6))
W, V, W2 = rng.normal(size=(6, 16)), rng.normal(size=(6, 16)), rng.normal(size=(16, 6))
Y = swiglu(X, W, V, W2)
assert Y.shape == (4, 6)
A = X @ V
assert np.allclose(Y, (A / (1 + np.exp(-A)) * (X @ W)) @ W2)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>sigmoid</C> and <C>silu</C> defined, write <C>sigmoid_grad</C>, <C>tanh_grad</C> and <C>silu_grad</C>,
          the derivatives as NumPy functions.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ACTS,
        starter: `# sigmoid, silu, gelu and swiglu are already defined.

def sigmoid_grad(x):
    return x

def tanh_grad(x):
    return x

def silu_grad(x):
    return x
`,
        solution: GRADS,
        tests: [
          { name: "against finite differences", code: `x = np.linspace(-6, 6, 25)
h = 1e-6
for f, g in ((sigmoid, sigmoid_grad), (np.tanh, tanh_grad), (silu, silu_grad)):
    assert np.allclose(g(x), (f(x + h) - f(x - h)) / (2 * h), atol=1e-8), f` },
          { name: "known values", code: `assert sigmoid_grad(np.array(0.0)) == 0.25 and tanh_grad(np.array(0.0)) == 1.0
assert abs(float(silu_grad(np.array(0.0))) - 0.5) < 1e-12
assert np.all(sigmoid_grad(np.linspace(-10, 10, 101)) <= 0.25)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that σ′(x) = σ(x)(1 − σ(x)) and that it never exceeds 1/4, with equality only at x = 0.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Differentiates σ(x) = 1/(1 + e⁻ˣ) to get e⁻ˣ/(1 + e⁻ˣ)² and rewrites it as σ(x)(1 − σ(x)).",
          "Bounds s(1 − s) for s in (0, 1): s(1 − s) = 1/4 − (s − 1/2)² ≤ 1/4 (or by AM–GM or calculus).",
          "Identifies equality exactly when σ(x) = 1/2, that is x = 0.",
        ],
      },
    },
    {
      key: "silumin",
      rung: "stretch",
      prompt: <p>SiLU(x) = x·σ(x) has a single minimum. What is its value, to two decimal places?</p>,
      answer: { kind: "numeric", value: -0.28, tolerance: 0.02 },
    },
  ],

  teachBack:
    "Explain to a friend how an activation function's derivative affects the backward pass, why ReLU replaced the sigmoid, and what a gated unit such as SwiGLU computes.",

  glimpse: (
    <p>
      With a nonlinearity in between, how much can a network with one hidden layer represent? Next: the universal
      approximation theorem, and why it says less than it seems to.
    </p>
  ),
};
