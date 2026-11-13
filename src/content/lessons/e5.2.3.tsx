import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OpBackwardViz } from "@/components/viz/OpBackwardViz";
import type { LessonContent } from "@/lib/types";

const BASE = `import numpy as np

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

Tensor.sum = tsum

def unbroadcast(g, shape):
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

const OPS = `def matmul(a, b):
    out = Tensor(a.data @ b.data, (a, b), "@")
    def _backward():
        a.grad += out.grad @ b.data.T
        b.grad += a.data.T @ out.grad
    out._backward = _backward
    return out

def transpose(a):
    out = Tensor(a.data.T, (a,), "T")
    def _backward():
        a.grad += out.grad.T
    out._backward = _backward
    return out

def sum_axis(a, axis):
    out = Tensor(a.data.sum(axis=axis), (a,), "sum")
    def _backward():
        g = np.expand_dims(out.grad, axis)
        a.grad += np.broadcast_to(g, a.data.shape)
    out._backward = _backward
    return out

Tensor.__matmul__ = matmul
`;

const OPS2 = `def reshape(a, shape):
    out = Tensor(a.data.reshape(shape), (a,), "reshape")
    def _backward():
        a.grad += out.grad.reshape(a.data.shape)
    out._backward = _backward
    return out

def mean_axis(a, axis):
    n = a.data.shape[axis]
    return sum_axis(a, axis) * Tensor(1.0 / n)

def linear(x, W, b):
    return x @ W + b
`;

export const lesson: LessonContent = {
  id: "e5.2.3",
  minutes: 55,
  links: {
    requires: ["e5.2.2", "m5.4.5"],
    revisits: ["e1.5.4", "m5.4.1"],
    foreshadows: ["e5.2.4", "e5.3.1"],
  },

  puzzle: (
    <>
      <p>
        A linear layer computes x @ W + b. The previous lessons gave the engine elementwise operations and broadcasting, but{" "}
        <C>@</C> mixes entries: every output depends on a whole row of x and a whole column of W. What are the closures for
        matrix products, for sums along one axis, and for operations like transpose and reshape that only move entries
        around?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Three families, three ideas. A matrix product&rsquo;s gradient is again a matrix product, with the other factor
        transposed, and the shapes leave only one way to write it. A sum along an axis is a broadcast run backwards, so its
        gradient is copied back along that axis. A transpose or reshape only rearranges entries, so its gradient is
        rearranged back.
      </p>
      <OpBackwardViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the matmul rule">
        <p>
          If Y = A B with A of shape (m, k) and B of shape (k, n), and G = ∂L/∂Y, then ∂L/∂A = G Bᵀ and ∂L/∂B = Aᵀ G.
        </p>
      </Theorem>
      <Proof>
        <p>
          Yᵢⱼ = Σₖ AᵢₖBₖⱼ, so ∂Yᵢⱼ/∂Aₚq is Bqⱼ when i = p and 0 otherwise. The chain rule gives ∂L/∂Aₚq = Σⱼ Gₚⱼ Bqⱼ = (G
          Bᵀ)ₚq. In the same way ∂Yᵢⱼ/∂Bₚq is Aᵢₚ when j = q, so ∂L/∂Bₚq = Σᵢ Aᵢₚ Gᵢq = (Aᵀ G)ₚq. As a check, G Bᵀ has shape (m,
          n)(n, k) = (m, k), the shape of A.
        </p>
      </Proof>

      <Definition title="the closures">
        <p>
          <C>sum_axis</C> removes an axis, so its closure puts the axis back with <C>np.expand_dims</C> and broadcasts.{" "}
          <C>transpose</C> transposes the gradient back.
        </p>
        <Code>{OPS}</Code>
      </Definition>

      <Example title="composite operations need no closure">
        <p>
          Once the primitives exist, new operations can be written in terms of them, and their gradients come for free. A
          mean is a sum times a constant; a linear layer is a matmul plus a broadcast bias.
        </p>
        <Code>{OPS2}</Code>
      </Example>

      <Remark title="the cost of the backward pass">
        <p>
          The forward matmul of (m, k) by (k, n) costs about 2mkn floating-point operations. The backward pass does two
          matmuls of the same size, G Bᵀ and Aᵀ G, so it costs about twice the forward. This is where the rule of thumb that
          a training step costs three forward passes comes from.
        </p>
      </Remark>

      <Remark title="views">
        <p>
          In NumPy, <C>a.T</C> and many reshapes are views that share memory with <C>a</C>. The engine never writes into
          data, only into grad with <C>+=</C>, and each grad is its own array, so sharing is harmless here. An engine that
          updated data in place would have to be more careful.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>Y = A @ B with A of shape (5, 3) and B of shape (3, 2), and G = ∂L/∂Y. Which expression is ∂L/∂A?</p>,
      answer: { kind: "choice", options: ["G @ B.T", "B.T @ G", "A.T @ G", "G.T @ B"], correct: [0] },
    },
    {
      key: "ones",
      rung: "check",
      prompt: <p>A is a 2 × 3 matrix of ones, B is a 3 × 4 matrix of ones and L = (A @ B).sum(). What is each entry of A.grad?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "reshape",
      rung: "apply",
      prompt: <p>out = a.reshape(3, 4) where a has shape (12,). What is the closure for a?</p>,
      answer: {
        kind: "choice",
        options: [
          "a.grad += out.grad.reshape(a.data.shape)",
          "a.grad += out.grad.sum(axis=0)",
          "a.grad += out.grad.T.reshape(a.data.shape)",
          "a.grad += out.grad.reshape(4, 3)",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${BASE}
${OPS}
A = Tensor([[1.0, 2.0], [3.0, 4.0]])
B = Tensor([[1.0, 0.0, -1.0], [2.0, 1.0, 0.0]])
L = (A @ B).sum()
L.backward()
print(A.grad.tolist(), B.grad.tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 3.0], [0.0, 3.0]] [[4.0, 4.0, 4.0], [6.0, 6.0, 6.0]]",
          "[[3.0, 3.0], [7.0, 7.0]] [[4.0, 4.0, 4.0], [6.0, 6.0, 6.0]]",
          "[[0.0, 3.0], [0.0, 3.0]] [[3.0, 3.0, 3.0], [7.0, 7.0, 7.0]]",
          "[[1.0, 1.0], [1.0, 1.0]] [[1.0, 1.0, 1.0], [1.0, 1.0, 1.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${BASE}
${OPS}
x = Tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
w = Tensor([1.0, -1.0, 2.0])
L = (sum_axis(x, 0) * w).sum()
L.backward()
print(sum_axis(x, 0).data.tolist(), x.grad.tolist())`}</Code>
          <p>A column sum, weighted. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5.0, 7.0, 9.0] [[1.0, -1.0, 2.0], [1.0, -1.0, 2.0]]",
          "[6.0, 15.0] [[1.0, -1.0, 2.0], [1.0, -1.0, 2.0]]",
          "[5.0, 7.0, 9.0] [[1.0, 1.0, 1.0], [-1.0, -1.0, -1.0]]",
          "[5.0, 7.0, 9.0] [[5.0, -7.0, 18.0], [5.0, -7.0, 18.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Tensor, with <C>unbroadcast</C>, <C>+</C>, <C>*</C>, <C>sum()</C> and <C>backward()</C>, is already defined. Write{" "}
          <C>matmul(a, b)</C> for 2-D arrays, <C>transpose(a)</C> for 2-D arrays, and <C>sum_axis(a, axis)</C>, which sums
          over one axis without keeping it.
        </p>
      ),
      answer: {
        kind: "code",
        setup: BASE,
        starter: `# Tensor, unbroadcast, +, *, sum() and backward() are already defined.

def matmul(a, b):
    return Tensor(a.data @ b.data)

def transpose(a):
    return Tensor(a.data.T)

def sum_axis(a, axis):
    return Tensor(a.data.sum(axis=axis))

Tensor.__matmul__ = matmul
`,
        solution: OPS,
        tests: [
          { name: "matmul against the formula", code: `rng = np.random.default_rng(0)
X, Y, G = rng.normal(size=(4, 3)), rng.normal(size=(3, 5)), rng.normal(size=(4, 5))
a, b = Tensor(X), Tensor(Y)
((a @ b) * Tensor(G)).sum().backward()
assert np.allclose(a.grad, G @ Y.T) and np.allclose(b.grad, X.T @ G)` },
          { name: "axis sums and transpose", code: `x = Tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
(sum_axis(x, 1) * Tensor([2.0, -1.0])).sum().backward()
assert x.grad.tolist() == [[2.0, 2.0, 2.0], [-1.0, -1.0, -1.0]], x.grad
y = Tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])
(transpose(y) * Tensor([[1.0, 0.0], [0.0, 2.0], [3.0, 0.0]])).sum().backward()
assert y.grad.tolist() == [[1.0, 0.0, 3.0], [0.0, 2.0, 0.0]], y.grad` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With everything above defined, write <C>reshape(a, shape)</C> with its closure, and then, without new closures,{" "}
          <C>mean_axis(a, axis)</C> (using <C>sum_axis</C> and <C>*</C>) and <C>linear(x, W, b)</C> returning x @ W + b.
        </p>
      ),
      answer: {
        kind: "code",
        setup: `${BASE}
${OPS}`,
        starter: `# Tensor with +, *, @, sum(), sum_axis and transpose is already defined.

def reshape(a, shape):
    return Tensor(a.data.reshape(shape))

def mean_axis(a, axis):
    return sum_axis(a, axis)

def linear(x, W, b):
    return x @ W
`,
        solution: OPS2,
        tests: [
          { name: "reshape and mean", code: `a = Tensor(np.arange(6.0))
(reshape(a, (2, 3)) * Tensor([[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]])).sum().backward()
assert a.grad.tolist() == [1.0, 2.0, 3.0, 4.0, 5.0, 6.0], a.grad
x = Tensor([[1.0, 2.0], [3.0, 6.0], [5.0, 1.0]])
m = mean_axis(x, 0)
assert m.data.tolist() == [3.0, 3.0]
m.sum().backward()
assert np.allclose(x.grad, np.full((3, 2), 1 / 3))` },
          { name: "linear layer gradients", code: `rng = np.random.default_rng(3)
X, Wd, bd = rng.normal(size=(5, 4)), rng.normal(size=(4, 2)), rng.normal(size=2)
x, W, b = Tensor(X), Tensor(Wd), Tensor(bd)
y = linear(x, W, b)
assert y.data.shape == (5, 2) and np.allclose(y.data, X @ Wd + bd)
(y * y).sum().backward()
G = 2 * (X @ Wd + bd)
assert np.allclose(W.grad, X.T @ G) and np.allclose(b.grad, G.sum(axis=0)) and np.allclose(x.grad, G @ Wd.T)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Y = A B with A of shape (m, k) and B of shape (k, n), and G = ∂L/∂Y for a scalar L. Prove that ∂L/∂B = Aᵀ G.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes Yᵢⱼ = Σₖ AᵢₖBₖⱼ and computes ∂Yᵢⱼ/∂Bₚq = Aᵢₚ if j = q, else 0.",
          "Applies the chain rule: ∂L/∂Bₚq = Σᵢⱼ Gᵢⱼ ∂Yᵢⱼ/∂Bₚq = Σᵢ Aᵢₚ Gᵢq.",
          "Recognises Σᵢ Aᵢₚ Gᵢq as the (p, q) entry of Aᵀ G (and may check the shape (k, m)(m, n) = (k, n)).",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          The forward matmul of an (m, k) by a (k, n) matrix costs about 2mkn floating-point operations. Roughly how many times
          the forward cost is the backward pass for that one matmul, computing both A.grad and B.grad?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend the gradient rules for a matrix product, a sum along an axis, a transpose and a reshape, and why composite operations like a linear layer need no closure of their own.",

  glimpse: (
    <p>
      Softmax followed by cross-entropy can be built from exp, sum and log, but that composite overflows and wastes work. Next:
      one fused operation with a stable forward and a two-term backward.
    </p>
  ),
};
