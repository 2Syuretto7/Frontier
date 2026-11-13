import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HiddenSpaceViz } from "@/components/viz/HiddenSpaceViz";
import type { LessonContent } from "@/lib/types";

const FWD = `import numpy as np

def relu(z):
    return np.maximum(z, 0)

def mlp_forward(X, params):
    h = X
    for i, (W, b) in enumerate(params):
        h = h @ W + b
        if i < len(params) - 1:
            h = relu(h)
    return h

def n_params(sizes):
    return sum(a * b + b for a, b in zip(sizes, sizes[1:]))
`;

const XOR = `def xor_net():
    W1 = np.array([[1.0, 1.0], [1.0, 1.0]])
    b1 = np.array([0.0, -1.0])
    W2 = np.array([[1.0], [-2.0]])
    b2 = np.array([0.0])
    return [(W1, b1), (W2, b2)]

def hidden_codes(X, params):
    W, b = params[0]
    return relu(X @ W + b)
`;

export const lesson: LessonContent = {
  id: "l3.1.2",
  minutes: 50,
  links: {
    requires: ["l3.1.1", "m3.8.1"],
    revisits: ["l1.3.1"],
    parallels: ["e5.1.3"],
    foreshadows: ["l3.1.3", "l3.1.4", "l3.2.3"],
  },

  puzzle: (
    <>
      <p>
        One neuron draws one line, and XOR needs two. Stack a layer of neurons in front of the output neuron. What does the
        hidden layer actually do to the data, and why does it achieve nothing at all unless each hidden neuron applies a
        nonlinear function?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A hidden layer maps every input to a new point, its vector of hidden activations. The output neuron then draws its
        line in that new space. Good hidden features move the data so that a line suffices. A nonlinearity is essential:
        without it, the hidden layer is a linear map, and a linear map followed by a line is still just a line in the
        original space.
      </p>
      <HiddenSpaceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="multilayer perceptron">
        <p>
          An MLP with layer sizes <M>{"n_0, n_1, \\dots, n_L"}</M> computes, for a batch <M>{"X"}</M> with one example per
          row,
        </p>
        <MD>{"H_0 = X, \\qquad H_\\ell = \\sigma(H_{\\ell-1} W_\\ell + b_\\ell)\\ (\\ell < L), \\qquad \\hat Y = H_{L-1} W_L + b_L,"}</MD>
        <p>
          where <M>{"W_\\ell"}</M> has shape <M>{"(n_{\\ell-1}, n_\\ell)"}</M> and <M>{"\\sigma"}</M> acts entrywise. The last
          layer is usually left linear and followed by a loss, such as softmax cross-entropy.
        </p>
        <Code>{FWD}</Code>
      </Definition>

      <Theorem title="linear layers collapse">
        <p>
          Without activations, an MLP of any depth computes an affine map <M>{"X \\mapsto XW + b"}</M>, with{" "}
          <M>{"W = W_1 W_2 \\cdots W_L"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Two layers give <M>{"(XW_1 + b_1)W_2 + b_2 = X(W_1W_2) + (b_1W_2 + b_2)"}</M>, which is affine. By induction on the
          number of layers, so is any composition. Hence depth only adds expressive power when a nonlinear{" "}
          <M>{"\\sigma"}</M> sits between the layers.
        </p>
      </Proof>

      <Example title="XOR by hand">
        <p>
          Two ReLU units suffice: <M>{"h_1 = \\operatorname{relu}(x_1 + x_2)"}</M> counts the ones,{" "}
          <M>{"h_2 = \\operatorname{relu}(x_1 + x_2 - 1)"}</M> fires only when both are on, and <M>{"y = h_1 - 2h_2"}</M> is 1
          for exactly one input on.
        </p>
        <Code>{XOR}</Code>
      </Example>

      <Remark title="counting parameters">
        <p>
          Layer <M>{"\\ell"}</M> has <M>{"n_{\\ell-1} n_\\ell"}</M> weights and <M>{"n_\\ell"}</M> biases, so the network has{" "}
          <M>{"\\sum_\\ell (n_{\\ell-1} + 1) n_\\ell"}</M> parameters. Almost all of them sit in the widest layers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many parameters does an MLP with layer sizes 4, 8, 3 have?</p>,
      answer: { kind: "numeric", value: 67 },
    },
    {
      key: "collapse",
      rung: "check",
      prompt: <p>A ten-layer network has no activation functions. What can it compute?</p>,
      answer: {
        kind: "choice",
        options: ["Only affine functions, exactly what one linear layer can", "Any continuous function", "Polynomials of degree 10", "Only constants"],
        correct: [0],
      },
    },
    {
      key: "xor",
      rung: "apply",
      prompt: <p>In the XOR network above, what is h₂ for the input (1, 1)?</p>,
      answer: { kind: "numeric", value: 1 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def relu(z):
    return np.maximum(z, 0)

def mlp_forward(X, params):
    h = X
    for i, (W, b) in enumerate(params):
        h = h @ W + b
        if i < len(params) - 1:
            h = relu(h)
    return h

def n_params(sizes):
    return sum(a * b + b for a, b in zip(sizes, sizes[1:]))

def xor_net():
    W1 = np.array([[1.0, 1.0], [1.0, 1.0]])
    b1 = np.array([0.0, -1.0])
    W2 = np.array([[1.0], [-2.0]])
    b2 = np.array([0.0])
    return [(W1, b1), (W2, b2)]

def hidden_codes(X, params):
    W, b = params[0]
    return relu(X @ W + b)

X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
print(mlp_forward(X, xor_net())[:, 0].tolist(), hidden_codes(X, xor_net()).tolist(), n_params([2, 2, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 1.0, 1.0, 0.0] [[0.0, 0.0], [1.0, 0.0], [1.0, 0.0], [2.0, 1.0]] 9",
          "[0.0, 1.0, 1.0, 2.0] [[0.0, 0.0], [1.0, 0.0], [1.0, 0.0], [2.0, 1.0]] 9",
          "[0.0, 1.0, 1.0, 0.0] [[0.0, -1.0], [1.0, 0.0], [1.0, 0.0], [2.0, 1.0]] 9",
          "[0.0, 1.0, 1.0, 0.0] [[0.0, 0.0], [1.0, 0.0], [1.0, 0.0], [2.0, 1.0]] 6",
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

rng = np.random.default_rng(0)
W1, b1 = rng.normal(size=(3, 4)), rng.normal(size=4)
W2, b2 = rng.normal(size=(4, 2)), rng.normal(size=2)
X = rng.normal(size=(5, 3))
deep = (X @ W1 + b1) @ W2 + b2
W, b = W1 @ W2, b1 @ W2 + b2
print(np.allclose(deep, X @ W + b), W.shape, b.shape)`}</Code>
          <p>Two linear layers and one. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True (3, 2) (2,)", "False (3, 2) (2,)", "True (4, 4) (4,)", "True (3, 2) (4,)"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>relu(z)</C>; <C>mlp_forward(X, params)</C>, where params is a list of (W, b) pairs, applying ReLU after
          every layer except the last; and <C>n_params(sizes)</C> for a list of layer sizes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def relu(z):
    return z

def mlp_forward(X, params):
    return X

def n_params(sizes):
    return 0
`,
        solution: FWD,
        tests: [
          { name: "shapes and counts", code: `rng = np.random.default_rng(0)
params = [(rng.normal(size=(4, 8)), rng.normal(size=8)), (rng.normal(size=(8, 3)), rng.normal(size=3))]
X = rng.normal(size=(5, 4))
Y = mlp_forward(X, params)
assert Y.shape == (5, 3)
H = np.maximum(X @ params[0][0] + params[0][1], 0)
assert np.allclose(Y, H @ params[1][0] + params[1][1])
assert n_params([4, 8, 3]) == 67 and n_params([784, 128, 10]) == 101770` },
          { name: "last layer is linear", code: `W = np.array([[1.0]])
assert mlp_forward(np.array([[-3.0]]), [(W, np.array([0.0]))]).tolist() == [[-3.0]]
assert mlp_forward(np.array([[-3.0]]), [(W, np.array([0.0])), (W, np.array([1.0]))]).tolist() == [[1.0]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>relu</C> and <C>mlp_forward</C> defined, write <C>xor_net()</C>, returning params for a 2-2-1 ReLU network
          whose output is exactly XOR on the four corners of the unit square, and <C>hidden_codes(X, params)</C>, returning
          the first layer&rsquo;s activations.
        </p>
      ),
      answer: {
        kind: "code",
        setup: FWD,
        starter: `# relu, mlp_forward and n_params are already defined.

def xor_net():
    return [(np.zeros((2, 2)), np.zeros(2)), (np.zeros((2, 1)), np.zeros(1))]

def hidden_codes(X, params):
    return X
`,
        solution: XOR,
        tests: [
          { name: "computes XOR", code: `X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
p = xor_net()
assert [W.shape for W, b in p] == [(2, 2), (2, 1)]
assert np.allclose(mlp_forward(X, p)[:, 0], [0, 1, 1, 0])` },
          { name: "hidden codes", code: `X = np.array([[0.0, 0.0], [0.0, 1.0], [1.0, 0.0], [1.0, 1.0]])
p = xor_net()
H = hidden_codes(X, p)
assert H.shape == (4, 2) and np.all(H >= 0)
assert np.allclose(H @ p[1][0] + p[1][1], mlp_forward(X, p))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that an MLP with no activation functions, of any depth, computes an affine function of its input.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows two affine layers compose to an affine map: (xW₁ + b₁)W₂ + b₂ = x(W₁W₂) + (b₁W₂ + b₂).",
          "Extends to L layers by induction (the first L − 1 layers are affine by hypothesis, and one more layer keeps it affine).",
          "Identifies the resulting weight W₁W₂⋯W_L (and bias) or states the conclusion that depth adds nothing without nonlinearity.",
        ],
      },
    },
    {
      key: "pieces",
      rung: "stretch",
      prompt: <p>A network with one input, one hidden layer of 5 ReLU units and a linear output is piecewise linear in its input. At most how many linear pieces can it have?</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what a hidden layer does to the data, how two ReLU units compute XOR, and why stacking layers is pointless without an activation function.",

  glimpse: (
    <p>
      ReLU is one choice among many: sigmoid, tanh, GELU, SiLU and gated units like SwiGLU. Next: what each looks like, what
      its gradient does, and why modern language models use gates.
    </p>
  ),
};
