import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BroadcastGradViz } from "@/components/viz/BroadcastGradViz";
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

def tsum(a):
    out = Tensor(a.data.sum(), (a,), "sum")
    def _backward():
        a.grad += np.ones_like(a.data) * out.grad
    out._backward = _backward
    return out

Tensor.sum = tsum`;

const OPS = `def unbroadcast(g, shape):
    while g.ndim > len(shape):
        g = g.sum(axis=0)
    for i, n in enumerate(shape):
        if n == 1:
            g = g.sum(axis=i, keepdims=True)
    return g

def add(a, b):
    out = Tensor(a.data + b.data, (a, b), "+")
    def _backward():
        a.grad += unbroadcast(out.grad, a.data.shape)
        b.grad += unbroadcast(out.grad, b.data.shape)
    out._backward = _backward
    return out

def mul(a, b):
    out = Tensor(a.data * b.data, (a, b), "*")
    def _backward():
        a.grad += unbroadcast(b.data * out.grad, a.data.shape)
        b.grad += unbroadcast(a.data * out.grad, b.data.shape)
    out._backward = _backward
    return out

Tensor.__add__ = add
Tensor.__mul__ = mul
`;

const OPS2 = `def sub(a, b):
    out = Tensor(a.data - b.data, (a, b), "-")
    def _backward():
        a.grad += unbroadcast(out.grad, a.data.shape)
        b.grad -= unbroadcast(out.grad, b.data.shape)
    out._backward = _backward
    return out

def div(a, b):
    out = Tensor(a.data / b.data, (a, b), "/")
    def _backward():
        a.grad += unbroadcast(out.grad / b.data, a.data.shape)
        b.grad -= unbroadcast(out.grad * a.data / b.data ** 2, b.data.shape)
    out._backward = _backward
    return out

Tensor.__sub__ = sub
Tensor.__truediv__ = div
`;

export const lesson: LessonContent = {
  id: "e5.2.2",
  minutes: 50,
  links: {
    requires: ["e5.2.1", "e1.5.3"],
    revisits: ["m5.3.4", "e5.1.2"],
    foreshadows: ["e5.2.3", "e5.3.1"],
  },

  puzzle: (
    <>
      <p>
        A batch x has shape (32, 10) and a bias b has shape (10,). NumPy happily computes x + b, of shape (32, 10). The
        incoming gradient therefore has shape (32, 10), but b.grad must have shape (10,). Which 32 numbers become each entry
        of b.grad, and how should they be combined?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Broadcasting copies b into every row. A value used in many places collects the gradient from each use, just as a
        scalar Value used twice adds both contributions. So each entry of b.grad is the sum of the incoming gradient over the
        copies, that is, over the broadcast axis.
      </p>
      <BroadcastGradViz />
      <p>
        One helper, <C>unbroadcast</C>, does this for any shapes: sum away the extra leading axes, then sum, keeping the axis,
        wherever the operand had size 1.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="unbroadcast">
        <p>
          NumPy broadcasts by first padding the smaller shape with 1s on the left, then stretching every size-1 axis. Undoing
          it on a gradient means summing over the padded axes and then over the stretched ones.
        </p>
        <Code>{OPS}</Code>
      </Definition>

      <Theorem title="the gradient of a broadcast is a sum">
        <p>
          Let y = broadcast(b) to a larger shape, so that each entry of y is a copy of one entry of b, and let L be a scalar.
          Then ∂L/∂bₖ = Σ ∂L/∂yᵢ over all entries yᵢ that are copies of bₖ.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each yᵢ equals exactly one entry of b, so ∂yᵢ/∂bₖ is 1 if yᵢ is a copy of bₖ and 0 otherwise. The chain rule gives
          ∂L/∂bₖ = Σᵢ (∂L/∂yᵢ)(∂yᵢ/∂bₖ), which keeps exactly the terms for the copies. The copies of bₖ are the entries that
          share its index on the axes b has, ranging over the padded and stretched axes, so the sum is over those axes.
        </p>
      </Proof>

      <Example title="a bias">
        <Code>{`x = Tensor(np.ones((32, 10)))
b = Tensor(np.zeros(10))
y = (x + b).sum()
y.backward()
b.grad.shape, b.grad[0]     # (10,), 32.0`}</Code>
        <p>Each bias entry was copied into 32 rows, each with gradient 1.</p>
      </Example>

      <Remark title="the bug this prevents">
        <p>
          Without <C>unbroadcast</C>, the closure tries <C>b.grad += out.grad</C> with shapes (10,) and (32, 10). NumPy cannot
          fit the result into b.grad and raises a <C>ValueError</C>. Worse, with b of shape (1, 10) and a batch of one, the
          shapes happen to match, the bug passes every small test, and fails on the first real batch. Test with batches larger
          than 1.
        </p>
      </Remark>

      <Remark title="subtraction and division">
        <p>
          Any binary operation needs the same treatment: compute the local gradient at the broadcast shape, then unbroadcast
          to each operand&rsquo;s shape.
        </p>
        <Code>{OPS2}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>x has shape (32, 10), b has shape (10,), and y = x + b. What shape must b.grad have?</p>,
      answer: { kind: "choice", options: ["(10,)", "(32, 10)", "(32,)", "(1, 10)"], correct: [0] },
    },
    {
      key: "count",
      rung: "check",
      prompt: <p>With x of shape (32, 10) and L = sum(x + b), what is each entry of b.grad?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "axes",
      rung: "apply",
      prompt: <p>An incoming gradient has shape (8, 3, 5) and the operand had shape (3, 1). Over which axes of the gradient does unbroadcast sum?</p>,
      answer: {
        kind: "choice",
        options: [
          "Axis 0 (padded), then the last axis (size 1 in the operand), keeping it",
          "Only axis 0",
          "Only the last axis",
          "All axes, giving a scalar",
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

${OPS.split("\n\n")[0]}

g = np.arange(24.0).reshape(2, 3, 4)
print(unbroadcast(g, (3, 1)).tolist(), unbroadcast(g, (4,)).shape)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[60.0], [92.0], [124.0]] (4,)",
          "[[6.0], [22.0], [38.0]] (4,)",
          "[[60.0], [92.0], [124.0]] (1, 4)",
          "[[66.0, 210.0]] (4,)",
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
a = Tensor(np.ones((2, 1)))
b = Tensor([1.0, 2.0, 3.0])
y = (a * b).sum()
y.backward()
print(a.grad.tolist(), b.grad.tolist())`}</Code>
          <p>An outer product by broadcasting. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[6.0], [6.0]] [2.0, 2.0, 2.0]",
          "[[1.0], [1.0]] [1.0, 1.0, 1.0]",
          "[[6.0], [6.0]] [1.0, 2.0, 3.0]",
          "[[3.0], [3.0]] [2.0, 2.0, 2.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Tensor, with <C>backward()</C> and <C>sum()</C>, is already defined. Write <C>unbroadcast(g, shape)</C>, and
          broadcasting-aware <C>add(a, b)</C> and <C>mul(a, b)</C> whose closures give each operand a gradient of its own
          shape.
        </p>
      ),
      answer: {
        kind: "code",
        setup: TENSOR,
        starter: `# Tensor, with backward() and sum(), is already defined.

def unbroadcast(g, shape):
    return g

def add(a, b):
    return Tensor(a.data + b.data)

def mul(a, b):
    return Tensor(a.data * b.data)

Tensor.__add__ = add
Tensor.__mul__ = mul
`,
        solution: OPS,
        tests: [
          { name: "bias and outer product", code: `x = Tensor(np.ones((32, 10)))
b = Tensor(np.zeros(10))
(x + b).sum().backward()
assert b.grad.shape == (10,) and np.all(b.grad == 32.0), b.grad
u = Tensor([[1.0], [2.0]])
v = Tensor([[3.0, 4.0, 5.0]])
(u * v).sum().backward()
assert u.grad.tolist() == [[12.0], [12.0]] and v.grad.tolist() == [[3.0, 3.0, 3.0]], (u.grad, v.grad)` },
          { name: "random shapes", code: `rng = np.random.default_rng(1)
A, B = rng.normal(size=(4, 1, 3)), rng.normal(size=(5, 1))
a, b = Tensor(A), Tensor(B)
(a * b + a).sum().backward()
assert a.grad.shape == (4, 1, 3) and b.grad.shape == (5, 1)
assert np.allclose(a.grad, (B.sum() + 5) * np.ones((4, 1, 3)))
assert np.allclose(b.grad, A.sum() * np.ones((5, 1)))
assert unbroadcast(np.ones((2, 3, 4)), ()).shape == ()` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With Tensor, <C>unbroadcast</C>, <C>+</C>, <C>*</C> and <C>sum()</C> already defined, write broadcasting-aware{" "}
          <C>sub(a, b)</C> and <C>div(a, b)</C>. The starter attaches them as <C>-</C> and <C>/</C>.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${TENSOR}

${OPS}`,
        starter: `# Tensor, unbroadcast, +, * and sum() are already defined.

def sub(a, b):
    return Tensor(a.data - b.data)

def div(a, b):
    return Tensor(a.data / b.data)

Tensor.__sub__ = sub
Tensor.__truediv__ = div
`,
        solution: OPS2,
        tests: [
          { name: "centring a batch", code: `x = Tensor([[1.0, 2.0], [3.0, 6.0]])
m = Tensor([[2.0, 4.0]])
(x - m).sum().backward()
assert x.grad.tolist() == [[1.0, 1.0], [1.0, 1.0]] and m.grad.tolist() == [[-2.0, -2.0]], (x.grad, m.grad)` },
          { name: "division against finite differences", code: `rng = np.random.default_rng(2)
A, B = rng.normal(size=(4, 3)), rng.uniform(1, 2, size=(3,))
a, b = Tensor(A), Tensor(B)
(a / b * a - b).sum().backward()
f = lambda A, B: np.sum(A / B * A - B)
h = 1e-6
nb = np.array([(f(A, B + h * e) - f(A, B - h * e)) / (2 * h) for e in np.eye(3)])
assert b.grad.shape == (3,) and np.allclose(b.grad, nb, atol=1e-6), (b.grad, nb)
assert np.allclose(a.grad, 2 * A / B)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          x has shape (n, d), b has shape (d,), and y = x + b by broadcasting. For a scalar loss L, prove that ∂L/∂bⱼ = Σᵢ
          ∂L/∂yᵢⱼ.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States that yᵢⱼ = xᵢⱼ + bⱼ, so ∂yᵢⱼ/∂bₖ = 1 if k = j and 0 otherwise.",
          "Applies the multivariable chain rule: ∂L/∂bₖ = Σᵢ Σⱼ (∂L/∂yᵢⱼ)(∂yᵢⱼ/∂bₖ).",
          "Concludes the double sum collapses to Σᵢ ∂L/∂yᵢₖ, the sum over the broadcast axis.",
        ],
      },
    },
    {
      key: "copies",
      rung: "stretch",
      prompt: <p>A gradient of shape (8, 3, 5) is unbroadcast to shape (3, 1). How many entries of the gradient are added into each entry of the result?</p>,
      answer: { kind: "numeric", value: 40 },
    },
  ],

  teachBack:
    "Explain to a friend why the gradient of a broadcast is a sum, how unbroadcast decides which axes to sum, and why testing with a batch of one can hide the bug.",

  glimpse: (
    <p>
      Elementwise operations and broadcasts are done. Next come the operations that mix entries: matrix multiplication,
      reductions along one axis, and reshapes, each with its own backward rule.
    </p>
  ),
};
