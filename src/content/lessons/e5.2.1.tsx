import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TensorNodesViz } from "@/components/viz/TensorNodesViz";
import type { LessonContent } from "@/lib/types";

const TENSOR = `import numpy as np

class Tensor:
    def __init__(self, data, _prev=(), _op=""):
        self.data = np.asarray(data, dtype=float)
        self.grad = np.zeros_like(self.data)
        self._prev = set(_prev)
        self._op = _op
        self._backward = lambda: None

    def backward(self):
        topo, seen = [], set()
        def build(v):
            if v not in seen:
                seen.add(v)
                for p in v._prev:
                    build(p)
                topo.append(v)
        build(self)
        self.grad = np.ones_like(self.data)
        for v in reversed(topo):
            v._backward()
`;

const OPS = `def add(a, b):
    out = Tensor(a.data + b.data, (a, b), "+")
    def _backward():
        a.grad += out.grad
        b.grad += out.grad
    out._backward = _backward
    return out

def mul(a, b):
    out = Tensor(a.data * b.data, (a, b), "*")
    def _backward():
        a.grad += b.data * out.grad
        b.grad += a.data * out.grad
    out._backward = _backward
    return out

def tsum(a):
    out = Tensor(a.data.sum(), (a,), "sum")
    def _backward():
        a.grad += np.ones_like(a.data) * out.grad
    out._backward = _backward
    return out

Tensor.__add__ = add
Tensor.__mul__ = mul
Tensor.sum = tsum
`;

const OPS2 = `def relu(a):
    out = Tensor(np.maximum(a.data, 0), (a,), "relu")
    def _backward():
        a.grad += (a.data > 0) * out.grad
    out._backward = _backward
    return out

def exp(a):
    e = np.exp(a.data)
    out = Tensor(e, (a,), "exp")
    def _backward():
        a.grad += e * out.grad
    out._backward = _backward
    return out

def mean(a):
    out = Tensor(a.data.mean(), (a,), "mean")
    def _backward():
        a.grad += np.ones_like(a.data) * out.grad / a.data.size
    out._backward = _backward
    return out
`;

export const lesson: LessonContent = {
  id: "e5.2.1",
  minutes: 55,
  links: {
    requires: ["e5.1.3", "e1.5.2"],
    revisits: ["m5.3.4", "e1.5.1"],
    foreshadows: ["e5.2.2", "e5.2.3"],
  },

  puzzle: (
    <>
      <p>
        The scalar engine makes one Python object per multiplication. A layer with a 1000 × 1000 weight matrix does a million
        multiplications per example. What changes if each node of the graph holds a whole array instead of one number, and
        what stays exactly the same?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A Tensor is a Value whose <C>data</C> and <C>grad</C> are NumPy arrays of the same shape. The graph, the topological
        sort and the closures are unchanged. Only the closures&rsquo; arithmetic becomes array arithmetic, so one node and one
        NumPy call replace thousands of Python objects.
      </p>
      <TensorNodesViz />
      <p>
        For elementwise operations the local rules carry over entry by entry: the gradient of a product is the other factor
        times the incoming gradient, now multiplied elementwise.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="Tensor">
        <p>
          A Tensor stores <C>data</C> as a float array and <C>grad</C> as an array of zeros of the same shape. The backward
          pass is the one from the scalar engine, except that it seeds the output&rsquo;s grad with an array of ones (for a
          scalar output, shape <C>()</C>, that is just 1).
        </p>
        <Code>{TENSOR}</Code>
      </Definition>

      <Definition title="elementwise operations and sum">
        <p>
          For now both operands of <C>+</C> and <C>*</C> must have the same shape; the next lesson handles broadcasting.{" "}
          <C>sum()</C> reduces to a scalar, and its closure spreads the scalar gradient back over every entry.
        </p>
        <Code>{OPS}</Code>
      </Definition>

      <Theorem title="elementwise rules are vector-Jacobian products">
        <p>
          If y = a ⊙ b (elementwise) and L is a scalar, then ∂L/∂a = b ⊙ ∂L/∂y. If s = Σᵢ aᵢ, then ∂L/∂a = (∂L/∂s)·1, an array of
          ones of a&rsquo;s shape times the scalar.
        </p>
      </Theorem>
      <Proof>
        <p>
          For y = a ⊙ b, yᵢ depends only on aᵢ, with ∂yᵢ/∂aᵢ = bᵢ, so the Jacobian ∂y/∂a is the diagonal matrix diag(b). The
          vector-Jacobian product (∂L/∂y)ᵀ diag(b) has entries (∂L/∂yᵢ)·bᵢ, which is b ⊙ ∂L/∂y. For s, every ∂s/∂aᵢ = 1, so
          ∂L/∂aᵢ = ∂L/∂s for every i. The closures compute exactly these products without ever forming the n × n Jacobian.
        </p>
      </Proof>

      <Example title="a dot product">
        <Code>{`w = Tensor([1.0, -2.0, 3.0])
x = Tensor([4.0, 5.0, 6.0])
y = (w * x).sum()       # 12.0
y.backward()
w.grad                  # array([4., 5., 6.]) = x
x.grad                  # array([ 1., -2.,  3.]) = w`}</Code>
        <p>Four nodes, whatever the length of the vectors, and the gradient of w·x with respect to w is x, as it should be.</p>
      </Example>

      <Remark title="grad has the shape of data">
        <p>
          ∂L/∂a has one entry per entry of a, because L is a scalar. Keeping <C>grad</C> the same shape as <C>data</C> is
          therefore not a convention but a fact, and checking it after every closure catches most bugs in a tensor engine.
        </p>
      </Remark>

      <Remark title="nonlinear elementwise functions">
        <p>
          Any function applied entry by entry has a diagonal Jacobian too, so its closure is the derivative, evaluated
          elementwise, times <C>out.grad</C>. For ReLU the derivative is 1 where the input is positive and 0 elsewhere.
        </p>
        <Code>{OPS2}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>A Tensor t has data of shape (3, 4), and the loss is a scalar. What is the shape of t.grad?</p>,
      answer: { kind: "choice", options: ["(3, 4)", "()", "(12,)", "(12, 12)"], correct: [0] },
    },
    {
      key: "nodes",
      rung: "check",
      prompt: <p>Counting w and x, how many Tensor nodes does <C>(w * x).sum()</C> create when w and x have 1000 entries each?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "relu",
      rung: "apply",
      prompt: (
        <p>
          a = [−2, 0.5, 3], and L = sum(relu(a)). What is a.grad? (Use the derivative 0 at negative inputs and 1 at positive
          ones.)
        </p>
      ),
      answer: { kind: "choice", options: ["[0, 1, 1]", "[0, 0.5, 3]", "[1, 1, 1]", "[−2, 0.5, 3]"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${TENSOR}
${OPS}
w = Tensor([1.0, -2.0, 3.0])
x = Tensor([4.0, 5.0, 6.0])
y = (w * x + w).sum()
y.backward()
print(y.data, w.grad.tolist(), x.grad.tolist())`}</Code>
          <p>w is used twice. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "14.0 [5.0, 6.0, 7.0] [1.0, -2.0, 3.0]",
          "14.0 [4.0, 5.0, 6.0] [1.0, -2.0, 3.0]",
          "12.0 [5.0, 6.0, 7.0] [1.0, -2.0, 3.0]",
          "14.0 [1.0, 1.0, 1.0] [1.0, -2.0, 3.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${TENSOR}
${OPS}
${OPS2}
a = Tensor([[-1.0, 2.0], [0.0, 3.0]])
m = mean(relu(a) * a)
m.backward()
print(m.data, a.grad.tolist())`}</Code>
          <p>ReLU, a product and a mean. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3.25 [[0.0, 1.0], [0.0, 1.5]]",
          "3.25 [[0.0, 0.5], [0.0, 0.75]]",
          "3.25 [[-0.5, 1.0], [0.0, 1.5]]",
          "13.0 [[0.0, 4.0], [0.0, 6.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          The Tensor class with <C>__init__</C> and <C>backward()</C> is already defined. Write <C>add(a, b)</C>,{" "}
          <C>mul(a, b)</C> (same shapes, elementwise) and <C>tsum(a)</C> (sum of all entries, a scalar Tensor), each building
          its output node with a correct <C>_backward</C> closure. The starter attaches them as methods.
        </p>
      ),
      answer: {
        kind: "code",
        setup: TENSOR,
        starter: `import numpy as np
# Tensor (with __init__ and backward) is already defined.

def add(a, b):
    return Tensor(a.data + b.data)

def mul(a, b):
    return Tensor(a.data * b.data)

def tsum(a):
    return Tensor(a.data.sum())

Tensor.__add__ = add
Tensor.__mul__ = mul
Tensor.sum = tsum
`,
        solution: OPS,
        tests: [
          { name: "dot product", code: `w = Tensor([1.0, -2.0, 3.0])
x = Tensor([4.0, 5.0, 6.0])
y = (w * x).sum()
y.backward()
assert y.data.shape == () and y.data == 12.0
assert w.grad.tolist() == [4.0, 5.0, 6.0] and x.grad.tolist() == [1.0, -2.0, 3.0], (w.grad, x.grad)` },
          { name: "matrix, reuse and finite differences", code: `rng = np.random.default_rng(0)
A = rng.normal(size=(3, 4))
B = rng.normal(size=(3, 4))
a, b = Tensor(A), Tensor(B)
L = (a * b * a + b).sum()
L.backward()
assert a.grad.shape == (3, 4) and b.grad.shape == (3, 4)
assert np.allclose(a.grad, 2 * A * B) and np.allclose(b.grad, A * A + 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With Tensor and its <C>+</C>, <C>*</C> and <C>sum()</C> already defined, write <C>relu(a)</C>, <C>exp(a)</C> and{" "}
          <C>mean(a)</C> (the average of all entries, a scalar Tensor), each with its <C>_backward</C> closure. Use 0 as
          ReLU&rsquo;s derivative at 0.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${TENSOR}
${OPS}`,
        starter: `# Tensor, with +, * and sum(), is already defined.

def relu(a):
    return Tensor(np.maximum(a.data, 0))

def exp(a):
    return Tensor(np.exp(a.data))

def mean(a):
    return Tensor(a.data.mean())
`,
        solution: OPS2,
        tests: [
          { name: "relu and mean", code: `a = Tensor([[-1.0, 2.0], [0.0, 3.0]])
m = mean(relu(a))
m.backward()
assert m.data == 1.25 and a.grad.tolist() == [[0.0, 0.25], [0.0, 0.25]], (m.data, a.grad)` },
          { name: "exp against finite differences", code: `X = np.array([0.3, -1.2, 0.8])
a = Tensor(X)
L = mean(exp(a) * a)
L.backward()
f = lambda v: np.mean(np.exp(v) * v)
h = 1e-6
num = np.array([(f(X + h * e) - f(X - h * e)) / (2 * h) for e in np.eye(3)])
assert np.allclose(a.grad, num, atol=1e-8), (a.grad, num)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Let y = f(a) where f is a scalar function applied to each entry of the array a, and let L be a scalar depending on
          y. Show that ∂L/∂a = f′(a) ⊙ ∂L/∂y, so that the closure never needs the full Jacobian.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that yᵢ = f(aᵢ) depends only on aᵢ, so ∂yⱼ/∂aᵢ = 0 for j ≠ i and ∂yᵢ/∂aᵢ = f′(aᵢ): the Jacobian is diagonal.",
          "Applies the chain rule: ∂L/∂aᵢ = Σⱼ (∂L/∂yⱼ)(∂yⱼ/∂aᵢ), which collapses to (∂L/∂yᵢ) f′(aᵢ).",
          "Concludes the result is the elementwise product f′(a) ⊙ ∂L/∂y, computed in O(n) without forming the n × n Jacobian.",
        ],
      },
    },
    {
      key: "bytes",
      rung: "stretch",
      prompt: <p>How many megabytes (10⁶ bytes) does a float64 array of shape (1000, 1000) occupy? A Tensor of that shape stores two.</p>,
      answer: { kind: "numeric", value: 8 },
    },
  ],

  teachBack:
    "Explain to a friend what changes and what stays the same when a scalar autograd engine becomes a tensor engine, and why elementwise closures never need a Jacobian matrix.",

  glimpse: (
    <p>
      Adding a bias vector to every row of a batch is a broadcast, and a broadcast copies an entry many times. Next: what the
      gradient of a broadcast is, and why it is a sum.
    </p>
  ),
};
