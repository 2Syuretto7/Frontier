import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BackpropHandViz } from "@/components/viz/BackpropHandViz";
import type { LessonContent } from "@/lib/types";

const NET = `import numpy as np

def forward(x, p):
    z = x @ p["W1"] + p["b1"]
    h = np.tanh(z)
    yhat = h @ p["W2"] + p["b2"]
    return {"z": z, "h": h, "yhat": yhat}

def backward(x, y, p, cache):
    d_out = cache["yhat"] - y
    d_hidden = d_out * p["W2"] * (1 - cache["h"] ** 2)
    return {"W2": d_out * cache["h"], "b2": d_out,
            "W1": np.outer(x, d_hidden), "b1": d_hidden}
`;

const TRAIN = `def sgd_step(p, g, lr):
    return {k: p[k] - lr * g[k] for k in p}

def train(x, y, p, lr, steps):
    losses = []
    for _ in range(steps):
        cache = forward(x, p)
        losses.append(float(0.5 * (cache["yhat"] - y) ** 2))
        p = sgd_step(p, backward(x, y, p, cache), lr)
    return p, losses
`;

export const lesson: LessonContent = {
  id: "l3.2.2",
  minutes: 55,
  links: {
    requires: ["l3.2.1"],
    revisits: ["l3.1.3", "l1.2.4"],
    parallels: ["e5.1.3"],
    foreshadows: ["l3.2.3", "l3.2.4"],
  },

  puzzle: (
    <>
      <p>
        A network with two inputs, two hidden tanh units and one output predicts 0.43 for an example whose target is 1. Six
        weights and three biases could each be nudged. By how much should each one move, and which numbers from the forward
        pass do you need to work that out?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give every unit a <strong>delta</strong>, the derivative of the loss with respect to its pre-activation: how much the
        loss would change if that unit&rsquo;s input sum moved. The output&rsquo;s delta is just the error. A hidden
        unit&rsquo;s delta is the output delta, sent back along the weight that connects them, scaled by the slope of the
        activation. Then each weight&rsquo;s gradient is its input times the delta of the unit it feeds.
      </p>
      <BackpropHandViz />
    </>
  ),

  theory: (
    <>
      <Definition title="deltas">
        <p>
          For a unit with pre-activation <M>{"z_j"}</M>, <M>{"\\delta_j = \\partial L / \\partial z_j"}</M>. With a linear output{" "}
          <M>{"\\hat y"}</M> and <M>{"L = \\tfrac12(\\hat y - y)^2"}</M>, <M>{"\\delta_{\\text{out}} = \\hat y - y"}</M>.
        </p>
      </Definition>

      <Theorem title="the backpropagation equations">
        <p>For a hidden unit j with activation <M>{"h_j = \\sigma(z_j)"}</M> feeding units k through weights <M>{"w_{jk}"}</M>:</p>
        <MD>{"\\delta_j = \\sigma'(z_j) \\sum_k w_{jk}\\, \\delta_k, \\qquad \\frac{\\partial L}{\\partial w_{ij}} = h_i\\, \\delta_j, \\qquad \\frac{\\partial L}{\\partial b_j} = \\delta_j."}</MD>
      </Theorem>
      <Proof>
        <p>
          <M>{"z_j"}</M> affects L only through <M>{"h_j"}</M>, which affects L only through the <M>{"z_k = \\sum_j h_j w_{jk} + b_k"}</M>{" "}
          of the units it feeds. The chain rule gives{" "}
          <M>{"\\delta_j = \\frac{\\partial h_j}{\\partial z_j}\\sum_k \\frac{\\partial z_k}{\\partial h_j}\\,\\delta_k = \\sigma'(z_j)\\sum_k w_{jk}\\delta_k"}</M>.
          A weight <M>{"w_{ij}"}</M> affects L only through <M>{"z_j"}</M>, with <M>{"\\partial z_j/\\partial w_{ij} = h_i"}</M>, so its
          gradient is <M>{"h_i\\delta_j"}</M>; for the bias, <M>{"\\partial z_j/\\partial b_j = 1"}</M>.
        </p>
      </Proof>

      <Example title="the network in the figure">
        <p>
          The forward pass gives <M>{"h = (0.7163, 0.5370)"}</M> and <M>{"\\hat y = 0.4329"}</M>, so{" "}
          <M>{"\\delta_{\\text{out}} = -0.5671"}</M>. Then{" "}
          <M>{"\\delta_1 = (1 - 0.7163^2)(0.7)(-0.5671) = -0.1933"}</M> and{" "}
          <M>{"\\delta_2 = (1 - 0.5370^2)(-0.5)(-0.5671) = 0.2018"}</M>. The weight from <M>{"x_2"}</M> to the first hidden unit
          gets gradient <M>{"2 \\times (-0.1933) = -0.3866"}</M>, so gradient descent raises it.
        </p>
        <Code>{NET}</Code>
      </Example>

      <Remark title="what is stored">
        <p>
          The backward pass needs the forward pass&rsquo;s activations: h for the weight gradients and{" "}
          <M>{"\\sigma'(z)"}</M>, which for tanh is <M>{"1 - h^2"}</M>, for the deltas. Training keeps every layer&rsquo;s
          activations in memory until the backward pass has used them, which is why training needs much more memory than
          inference.
        </p>
      </Remark>

      <Example title="a few steps of training">
        <Code>{TRAIN}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "dout",
      rung: "check",
      prompt: <p>With L = ½(ŷ − y)², ŷ = 0.8 and y = 1, what is δ_out?</p>,
      answer: { kind: "numeric", value: -0.2 },
    },
    {
      key: "dhidden",
      rung: "check",
      prompt: <p>Which expression is the delta of a hidden unit j?</p>,
      answer: {
        kind: "choice",
        options: ["σ′(z_j) Σ_k w_jk δ_k", "Σ_k w_jk δ_k", "σ(z_j) Σ_k δ_k", "h_j δ_out"],
        correct: [0],
      },
    },
    {
      key: "wgrad",
      rung: "apply",
      prompt: <p>A unit with δ = 0.3 receives input h = −2 through weight w. What is ∂L/∂w?</p>,
      answer: { kind: "numeric", value: -0.6 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def forward(x, p):
    z = x @ p["W1"] + p["b1"]
    h = np.tanh(z)
    yhat = h @ p["W2"] + p["b2"]
    return {"z": z, "h": h, "yhat": yhat}

def backward(x, y, p, cache):
    d_out = cache["yhat"] - y
    d_hidden = d_out * p["W2"] * (1 - cache["h"] ** 2)
    return {"W2": d_out * cache["h"], "b2": d_out,
            "W1": np.outer(x, d_hidden), "b1": d_hidden}

p = {"W1": np.array([[0.5, -0.3], [0.2, 0.4]]), "b1": np.array([0.0, 0.1]),
     "W2": np.array([0.7, -0.5]), "b2": 0.2}
x, y = np.array([1.0, 2.0]), 1.0
cache = forward(x, p)
g = backward(x, y, p, cache)
print(np.round(cache["h"], 4).tolist(), round(float(cache["yhat"]), 4), np.round(g["b1"], 4).tolist(), np.round(g["W1"], 4).tolist())`}</Code>
          <p>The network from the figure. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.7163, 0.537] 0.4329 [-0.1933, 0.2018] [[-0.1933, 0.2018], [-0.3866, 0.4035]]",
          "[0.7163, 0.537] 0.4329 [-0.397, 0.2836] [[-0.397, 0.2836], [-0.794, 0.5671]]",
          "[0.9, 0.6] 0.4329 [-0.1933, 0.2018] [[-0.1933, 0.2018], [-0.3866, 0.4035]]",
          "[0.7163, 0.537] 0.4329 [-0.1933, 0.2018] [[-0.1933, -0.3866], [0.2018, 0.4035]]",
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

def forward(x, p):
    z = x @ p["W1"] + p["b1"]
    h = np.tanh(z)
    yhat = h @ p["W2"] + p["b2"]
    return {"z": z, "h": h, "yhat": yhat}

def backward(x, y, p, cache):
    d_out = cache["yhat"] - y
    d_hidden = d_out * p["W2"] * (1 - cache["h"] ** 2)
    return {"W2": d_out * cache["h"], "b2": d_out,
            "W1": np.outer(x, d_hidden), "b1": d_hidden}

def sgd_step(p, g, lr):
    return {k: p[k] - lr * g[k] for k in p}

def train(x, y, p, lr, steps):
    losses = []
    for _ in range(steps):
        cache = forward(x, p)
        losses.append(float(0.5 * (cache["yhat"] - y) ** 2))
        p = sgd_step(p, backward(x, y, p, cache), lr)
    return p, losses

p = {"W1": np.array([[0.5, -0.3], [0.2, 0.4]]), "b1": np.array([0.0, 0.1]),
     "W2": np.array([0.7, -0.5]), "b2": 0.2}
x, y = np.array([1.0, 2.0]), 1.0
cache = forward(x, p)
p2, losses = train(x, y, p, 0.1, 3)
print([round(l, 4) for l in losses])`}</Code>
          <p>Three steps of gradient descent. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[0.1608, 0.0735, 0.0342]", "[0.1608, 0.1608, 0.1608]", "[0.1608, 0.2453, 0.3871]", "[0.5671, 0.3834, 0.2615]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A parameter dict has W1 (shape (2, 2), inputs by hidden units), b1, W2 (shape (2,)) and a scalar b2. Write{" "}
          <C>forward(x, p)</C>, returning a dict with z, h = tanh(z) and yhat, and <C>backward(x, y, p, cache)</C>, returning
          the gradients of <M>{"\\tfrac12(\\hat y - y)^2"}</M> as a dict with the same keys as p.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def forward(x, p):
    return {"z": None, "h": None, "yhat": 0.0}

def backward(x, y, p, cache):
    return {k: 0 * v for k, v in p.items()}
`,
        solution: NET,
        tests: [
          { name: "the worked example", code: `p = {"W1": np.array([[0.5, -0.3], [0.2, 0.4]]), "b1": np.array([0.0, 0.1]), "W2": np.array([0.7, -0.5]), "b2": 0.2}
x = np.array([1.0, 2.0])
c = forward(x, p)
assert abs(c["yhat"] - 0.43286) < 1e-4
g = backward(x, 1.0, p, c)
assert np.allclose(g["b1"], [-0.19329, 0.20177], atol=1e-4) and np.allclose(g["W1"][1], [-0.38658, 0.40354], atol=1e-4)
assert abs(g["b2"] - (c["yhat"] - 1.0)) < 1e-12 and np.allclose(g["W2"], (c["yhat"] - 1.0) * c["h"])` },
          { name: "finite differences", code: `rng = np.random.default_rng(0)
p = {"W1": rng.normal(size=(2, 2)), "b1": rng.normal(size=2), "W2": rng.normal(size=2), "b2": 0.3}
x, y = np.array([0.4, -1.2]), -0.5
g = backward(x, y, p, forward(x, p))
loss = lambda q: 0.5 * (forward(x, q)["yhat"] - y) ** 2
h = 1e-6
for k in ("W1", "b1", "W2"):
    for idx in np.ndindex(p[k].shape):
        up = {**p, k: p[k].copy()}; up[k][idx] += h
        dn = {**p, k: p[k].copy()}; dn[k][idx] -= h
        assert abs((loss(up) - loss(dn)) / (2 * h) - g[k][idx]) < 1e-7, (k, idx)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With forward and backward defined, write <C>sgd_step(p, g, lr)</C>, returning a new dict with every parameter moved
          by −lr × its gradient, and <C>train(x, y, p, lr, steps)</C>, returning the final parameters and the list of losses,
          each recorded before its step.
        </p>
      ),
      answer: {
        kind: "code",
        setup: NET,
        starter: `# forward and backward are already defined.

def sgd_step(p, g, lr):
    return p

def train(x, y, p, lr, steps):
    return p, []
`,
        solution: TRAIN,
        tests: [
          { name: "loss falls", code: `p = {"W1": np.array([[0.5, -0.3], [0.2, 0.4]]), "b1": np.array([0.0, 0.1]), "W2": np.array([0.7, -0.5]), "b2": 0.2}
q, L = train(np.array([1.0, 2.0]), 1.0, p, 0.1, 30)
assert len(L) == 30 and all(b < a for a, b in zip(L, L[1:])) and L[-1] < 1e-4, L[-3:]
assert p["b2"] == 0.2, 'Do not modify the original parameters.'` },
          { name: "one step", code: `p = {"W1": np.zeros((2, 2)), "b1": np.zeros(2), "W2": np.zeros(2), "b2": 0.0}
q = sgd_step(p, {"W1": np.ones((2, 2)), "b1": np.ones(2), "W2": np.ones(2), "b2": 2.0}, 0.5)
assert np.all(q["W1"] == -0.5) and q["b2"] == -1.0` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          A hidden unit j has <M>{"h_j = \\sigma(z_j)"}</M> and feeds units k with <M>{"z_k = \\sum_j h_j w_{jk} + b_k"}</M>. Prove
          that <M>{"\\delta_j = \\sigma'(z_j)\\sum_k w_{jk}\\delta_k"}</M> and that{" "}
          <M>{"\\partial L/\\partial w_{jk} = h_j\\delta_k"}</M>.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes z_j influences L only through h_j, and h_j only through the z_k it feeds, then applies the multivariable chain rule.",
          "Computes ∂h_j/∂z_j = σ′(z_j) and ∂z_k/∂h_j = w_jk to get δ_j = σ′(z_j) Σ_k w_jk δ_k.",
          "Notes w_jk influences L only through z_k, with ∂z_k/∂w_jk = h_j, giving h_j δ_k.",
        ],
      },
    },
    {
      key: "deltas",
      rung: "stretch",
      prompt: <p>A network has layer sizes 3, 4, 2 (input, hidden, output). How many deltas does one backward pass compute, one per non-input unit?</p>,
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what a delta is, how it is sent backwards through a weight and an activation, and how each weight's gradient follows from it.",

  glimpse: (
    <p>
      Doing this one number at a time does not scale. Next: the same equations for a whole layer and a whole batch, as matrix
      products.
    </p>
  ),
};
