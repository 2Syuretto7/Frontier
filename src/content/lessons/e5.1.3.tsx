import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MlpTrainViz } from "@/components/viz/MlpTrainViz";
import type { LessonContent } from "@/lib/types";

const VALUE = `import math

class Value:
    def __init__(self, data, _prev=(), _op=""):
        self.data = data
        self.grad = 0.0
        self._prev = set(_prev)
        self._op = _op
        self._backward = lambda: None

    def __add__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data + other.data, (self, other), "+")
        def _backward():
            self.grad += out.grad
            other.grad += out.grad
        out._backward = _backward
        return out

    def __mul__(self, other):
        other = other if isinstance(other, Value) else Value(other)
        out = Value(self.data * other.data, (self, other), "*")
        def _backward():
            self.grad += other.data * out.grad
            other.grad += self.data * out.grad
        out._backward = _backward
        return out

    def __pow__(self, k):
        out = Value(self.data ** k, (self,), f"**{k}")
        def _backward():
            self.grad += k * self.data ** (k - 1) * out.grad
        out._backward = _backward
        return out

    def tanh(self):
        t = math.tanh(self.data)
        out = Value(t, (self,), "tanh")
        def _backward():
            self.grad += (1 - t ** 2) * out.grad
        out._backward = _backward
        return out

    def __neg__(self):
        return self * -1

    def __sub__(self, other):
        return self + (-other)

    __radd__ = __add__
    __rmul__ = __mul__

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for p in v._prev:
                    build(p)
                topo.append(v)
        build(self)
        self.grad = 1.0
        for v in reversed(topo):
            v._backward()
`;

const NN = `import random

class Neuron:
    def __init__(self, nin):
        self.w = [Value(random.uniform(-1, 1)) for _ in range(nin)]
        self.b = Value(random.uniform(-1, 1))

    def __call__(self, x):
        act = sum((wi * xi for wi, xi in zip(self.w, x)), self.b)
        return act.tanh()

    def parameters(self):
        return self.w + [self.b]

class Layer:
    def __init__(self, nin, nout):
        self.neurons = [Neuron(nin) for _ in range(nout)]

    def __call__(self, x):
        outs = [n(x) for n in self.neurons]
        return outs[0] if len(outs) == 1 else outs

    def parameters(self):
        return [p for n in self.neurons for p in n.parameters()]

class MLP:
    def __init__(self, nin, nouts):
        sizes = [nin] + nouts
        self.layers = [Layer(sizes[i], sizes[i + 1]) for i in range(len(nouts))]

    def __call__(self, x):
        for layer in self.layers:
            x = layer(x)
        return x

    def parameters(self):
        return [p for l in self.layers for p in l.parameters()]
`;

const LOOP = `xs = [[2.0, 3.0, -1.0], [3.0, -1.0, 0.5], [0.5, 1.0, 1.0], [1.0, 1.0, -1.0]]
ys = [1.0, -1.0, -1.0, 1.0]
model = MLP(3, [4, 4, 1])
for step in range(50):
    preds = [model(x) for x in xs]
    loss = sum(((p - y) ** 2 for p, y in zip(preds, ys)), Value(0.0))
    for p in model.parameters():
        p.grad = 0.0
    loss.backward()
    for p in model.parameters():
        p.data -= 0.05 * p.grad`;

export const lesson: LessonContent = {
  id: "e5.1.3",
  minutes: 60,
  links: {
    requires: ["e5.1.2", "l0.3.4"],
    revisits: ["l1.2.4", "l0.1.2"],
    foreshadows: ["e5.2.1", "e5.3.1"],
  },

  puzzle: (
    <>
      <p>
        A Value can add, multiply, square, apply tanh and report its gradient. That is everything a neural network needs. How
        few lines does it take to go from here to a network that learns, and what exactly happens in one step of training?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A neuron is a weighted sum of its inputs plus a bias, passed through tanh. A layer is a list of neurons that all read
        the same inputs. An MLP is a list of layers, each feeding the next. Every weight is a Value, so the loss is one big
        expression graph, and <C>loss.backward()</C> fills in the gradient of every weight at once. One training step nudges
        each weight a little against its gradient.
      </p>
      <MlpTrainViz />
      <p>
        The learning rate decides how big the nudge is. Too small and training crawls; too large and a step can overshoot
        and make the loss worse before it recovers, or never recover at all.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Neuron, Layer, MLP">
        <p>
          A <C>Neuron(nin)</C> holds <C>nin</C> weights and one bias, each a Value drawn uniformly from [−1, 1]. Calling it on
          a list x returns tanh(w·x + b). A <C>Layer(nin, nout)</C> holds <C>nout</C> neurons and returns their outputs (a
          single Value when <C>nout</C> is 1). An <C>MLP(nin, nouts)</C> chains layers of sizes nin → nouts[0] → nouts[1] → ….
          Each has a <C>parameters()</C> method listing every Value it can learn.
        </p>
        <Code>{NN}</Code>
      </Definition>

      <Theorem title="parameter count">
        <p>
          An MLP with layer sizes n₀, n₁, …, n_L has Σ (n_(i−1) + 1)·n_i parameters, summed over i = 1, …, L.
        </p>
      </Theorem>
      <Proof>
        <p>
          Layer i has n_i neurons, and each neuron has one weight per input, n_(i−1) of them, plus one bias. Summing over the
          layers gives the formula. For MLP(3, [4, 4, 1]) that is 4·4 + 5·4 + 5·1 = 41.
        </p>
      </Proof>

      <Example title="the training loop">
        <Code>{LOOP}</Code>
        <p>
          Four steps, repeated: the forward pass builds the graph and the loss; every grad is reset to 0; the backward pass
          fills the grads; each parameter moves by −0.05 × its grad. The reset must come before <C>backward()</C>, because the
          closures add with <C>+=</C>, as the previous lesson showed. In PyTorch the same four lines are{" "}
          <C>model(x)</C>, <C>optimizer.zero_grad()</C>, <C>loss.backward()</C> and <C>optimizer.step()</C>.
        </p>
      </Example>

      <Remark title="why the tanh">
        <p>
          Without the nonlinearity, each layer computes an affine map, and a composition of affine maps is again affine. A
          hundred linear layers could then do no more than one. The tanh between layers is what lets depth add expressive
          power.
        </p>
      </Remark>

      <Remark title="the gradient is only local">
        <p>
          The gradient says how the loss changes for an infinitesimal move. A step of size lr trusts that linear picture over a
          finite distance. That is why the step reduces the loss when lr is small enough, and why it can fail when lr is large.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>How many parameters does <C>MLP(2, [3, 1])</C> have?</p>,
      answer: { kind: "numeric", value: 13 },
    },
    {
      key: "step",
      rung: "check",
      prompt: <p>In a gradient descent step, what does each parameter do?</p>,
      answer: {
        kind: "choice",
        options: [
          "p.data -= lr * p.grad: it moves a little against its gradient",
          "p.data += lr * p.grad: it moves a little along its gradient",
          "p.grad -= lr * p.data",
          "p.data = p.grad",
        ],
        correct: [0],
      },
    },
    {
      key: "count2",
      rung: "apply",
      prompt: <p>How many parameters does <C>MLP(10, [16, 16, 1])</C> have?</p>,
      answer: { kind: "numeric", value: 465 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${VALUE}
w = [Value(0.5), Value(-1.0)]
b = Value(0.0)
x = [2.0, 1.0]
out = (w[0] * x[0] + w[1] * x[1] + b).tanh()
out.backward()
print(out.data, w[0].grad, w[1].grad, b.grad)`}</Code>
          <p>One neuron, by hand. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0 2.0 1.0 1.0", "0.0 0.5 -1.0 1.0", "0.0 2.0 1.0 0.0", "1.0 2.0 1.0 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${VALUE}
w = Value(1.0)
seen = []
for step in range(2):
    loss = (w * 2.0 - 3.0) ** 2
    w.grad = 0.0
    loss.backward()
    w.data -= 0.1 * w.grad
    seen.append(round(loss.data, 4))
print(*seen, round(w.data, 4))`}</Code>
          <p>Two steps of gradient descent on one weight. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.04 1.48", "1.0 0.04 1.88", "1.0 0.16 1.48", "1.0 4.84 0.6"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With <C>Value</C> (including <C>tanh</C>, <C>**</C>, <C>-</C> and <C>backward()</C>) already defined, write the
          classes <C>Neuron</C>, <C>Layer</C> and <C>MLP</C> as in the lesson. Weights and biases start uniform in [−1, 1]; a
          layer with one neuron returns a single Value; each class has <C>parameters()</C>.
        </p>
      ),
      answer: {
        kind: "code",
        setup: VALUE,
        starter: `import random
# Value is already defined.

class Neuron:
    def __init__(self, nin):
        pass

class Layer:
    def __init__(self, nin, nout):
        pass

class MLP:
    def __init__(self, nin, nouts):
        pass
`,
        solution: NN,
        tests: [
          { name: "shapes and counts", code: `import random
random.seed(0)
m = MLP(3, [4, 4, 1])
assert len(m.parameters()) == 41, len(m.parameters())
assert all(isinstance(p, Value) and -1 <= p.data <= 1 for p in m.parameters())
out = m([1.0, 2.0, 3.0])
assert isinstance(out, Value), 'A final layer of one neuron should return a single Value.'
assert len(Layer(3, 2)([1.0, 0.0, -1.0])) == 2` },
          { name: "a neuron computes tanh(w.x + b)", code: `import math
n = Neuron(2)
n.w[0].data, n.w[1].data, n.b.data = 0.3, -0.7, 0.1
out = n([2.0, 1.0])
assert abs(out.data - math.tanh(0.3 * 2 - 0.7 + 0.1)) < 1e-12
out.backward()
t = 1 - out.data ** 2
assert abs(n.w[0].grad - 2 * t) < 1e-12 and abs(n.b.grad - t) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With <C>Value</C> and the <C>MLP</C> classes already defined, write <C>train(model, xs, ys, steps, lr)</C>. Each
          step: compute the predictions, the loss as the sum of squared errors (start the sum at <C>Value(0.0)</C>), reset
          every parameter&rsquo;s grad to 0, run backward, and move each parameter by −lr × its grad. Return the list of the
          losses&rsquo; data, one per step, each recorded before that step&rsquo;s update.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${VALUE}
${NN}`,
        starter: `# Value, Neuron, Layer and MLP are already defined.

def train(model, xs, ys, steps, lr):
    return []
`,
        solution: `def train(model, xs, ys, steps, lr):
    losses = []
    for _ in range(steps):
        preds = [model(x) for x in xs]
        loss = sum(((p - y) ** 2 for p, y in zip(preds, ys)), Value(0.0))
        for p in model.parameters():
            p.grad = 0.0
        loss.backward()
        for p in model.parameters():
            p.data -= lr * p.grad
        losses.append(loss.data)
    return losses
`,
        tests: [
          { name: "learns four points", code: `random.seed(0)
model = MLP(3, [4, 4, 1])
xs = [[2.0, 3.0, -1.0], [3.0, -1.0, 0.5], [0.5, 1.0, 1.0], [1.0, 1.0, -1.0]]
ys = [1.0, -1.0, -1.0, 1.0]
L = train(model, xs, ys, 50, 0.05)
assert len(L) == 50 and all(isinstance(v, float) for v in L)
assert L[-1] < 0.05 and L[-1] < L[0] / 50, (L[0], L[-1])` },
          { name: "exact steps, fresh grads", code: `random.seed(1)
m1, m2 = MLP(2, [2, 1]), MLP(2, [2, 1])
for p, q in zip(m1.parameters(), m2.parameters()):
    q.data = p.data
xs, ys = [[1.0, -1.0], [0.5, 2.0]], [1.0, -1.0]
got = train(m1, xs, ys, 3, 0.1)
want = []
for _ in range(3):
    loss = sum(((m2(x) - y) ** 2 for x, y in zip(xs, ys)), Value(0.0))
    for p in m2.parameters():
        p.grad = 0.0
    loss.backward()
    for p in m2.parameters():
        p.data -= 0.1 * p.grad
    want.append(loss.data)
assert all(abs(a - b) < 1e-12 for a, b in zip(got, want)) and len(got) == 3, (got, want)
assert all(abs(p.data - q.data) < 1e-12 for p, q in zip(m1.parameters(), m2.parameters()))` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let g be the gradient of the loss L at the current parameters θ, with g ≠ 0. Explain why the update θ ← θ − lr·g
          lowers the loss when lr is small enough, and why it need not when lr is large.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Uses the first-order Taylor expansion: L(θ − lr·g) = L(θ) − lr·‖g‖² + o(lr) (or a bound on the second-order term).",
          "Notes ‖g‖² > 0, so for small enough lr the negative first-order term dominates the remainder and the loss decreases.",
          "Explains that for large lr the remainder (curvature) term can dominate, so the step can overshoot and increase the loss.",
        ],
      },
    },
    {
      key: "mnist",
      rung: "stretch",
      prompt: <p>How many parameters does <C>MLP(784, [128, 10])</C>, a classic first network for 28 × 28 digit images, have?</p>,
      answer: { kind: "numeric", value: 101770 },
    },
  ],

  teachBack:
    "Explain to a friend how a neuron, a layer and an MLP are built from Value objects, how to count the parameters, and what the four lines of one training step do and why their order matters.",

  glimpse: (
    <p>
      Scalar Values make one graph node per multiplication, so even a small network builds thousands of nodes. Next, the same
      autograd over whole NumPy arrays: one node per matrix operation.
    </p>
  ),
};
