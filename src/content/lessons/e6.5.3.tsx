import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PerExampleClipViz } from "@/components/viz/PerExampleClipViz";
import type { LessonContent } from "@/lib/types";

const JAX = `import jax
import jax.numpy as jnp

def loss(w, x, y):                                   # one example
    return (x @ w - y) ** 2

g = jax.grad(loss)                                   # reverse mode, w.r.t. the first argument
per_example = jax.vmap(g, in_axes=(None, 0, 0))      # map over examples, share w
grads = per_example(w, X, Y)                         # shape (batch, d), no Python loop

y, ydot = jax.jvp(jnp.sin, (x,), (v,))               # forward mode: f(x) and J v together
hvp = lambda f, x, v: jax.jvp(jax.grad(f), (x,), (v,))[1]   # forward-over-reverse
J = jax.jacfwd(f)(x)                                 # n jvps, good when inputs are few
J = jax.jacrev(f)(x)                                 # m vjps, good when outputs are few
d3 = jax.grad(jax.grad(jax.grad(jnp.sin)))(1.0)      # transformations compose: -cos(1)
fast = jax.jit(jax.vmap(jax.grad(loss), in_axes=(None, 0, 0)))`;

const FWD = `import math

def _lift(v, name):
    return getattr(v, name)() if isinstance(v, Dual) else getattr(math, name)(v)

class Dual:
    def __init__(self, val, tan=0.0):
        self.val, self.tan = val, tan

    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.tan + o.tan)

    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.val * o.tan + self.tan * o.val)

    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return Dual(_lift(self.val, 'sin'), _lift(self.val, 'cos') * self.tan)
    def cos(self): return Dual(_lift(self.val, 'cos'), -1.0 * _lift(self.val, 'sin') * self.tan)
    def exp(self): return Dual(_lift(self.val, 'exp'), _lift(self.val, 'exp') * self.tan)

def jvp(f, primals, tangents):
    out = f(*[Dual(p, t) for p, t in zip(primals, tangents)])
    return (out.val, out.tan) if isinstance(out, Dual) else (out, 0.0)

def grad_fwd(f):
    def g(*xs):
        return [jvp(f, xs, [1.0 if j == i else 0.0 for j in range(len(xs))])[1] for i in range(len(xs))]
    return g

def nth_derivative(f, n):
    for _ in range(n):
        f = (lambda h: lambda x: grad_fwd(h)(x)[0])(f)
    return f`;

const VMAP = `import numpy as np

def vmap(f, in_axes=0):
    def batched(*args):
        axes = in_axes if isinstance(in_axes, (tuple, list)) else (in_axes,) * len(args)
        sizes = {np.shape(a)[ax] for a, ax in zip(args, axes) if ax is not None}
        if len(sizes) != 1:
            raise ValueError('inconsistent batch sizes')
        n = sizes.pop()
        return np.stack([f(*[a if ax is None else np.take(a, i, axis=ax) for a, ax in zip(args, axes)]) for i in range(n)])
    return batched

def loss_grad(w, x, y):
    return 2 * (x @ w - y) * x

def clipped_mean_grad(w, X, Y, clip):
    g = vmap(loss_grad, (None, 0, 0))(w, X, Y)
    norms = np.linalg.norm(g, axis=1, keepdims=True)
    return np.mean(g * np.minimum(1.0, clip / np.maximum(norms, 1e-12)), axis=0)`;

export const lesson: LessonContent = {
  id: "e6.5.3",
  minutes: 50,
  links: {
    requires: ["e6.5.2"],
    revisits: ["m5.3.4", "e6.2.3"],
    foreshadows: ["e6.5.4"],
  },

  puzzle: (
    <>
      <p>
        Differentially private training needs every example&apos;s gradient separately, so that each can be clipped before
        averaging. In PyTorch that means a loop over the batch or a library of hand-written hooks. In JAX it is one line:{" "}
        <C>vmap(grad(loss), in_axes=(None, 0, 0))</C>. The same style gives Hessian-vector products as{" "}
        <C>jvp(grad(f))</C> and third derivatives as <C>grad(grad(grad(f)))</C>. Why can these transformations be stacked
        in any order, and what does each one compute?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each transformation takes a function and returns a function, so its output can be transformed again. <C>grad</C>{" "}
        runs the function backwards to get vector-Jacobian products; <C>jvp</C> pushes a tangent forwards alongside the
        values, which can be done by computing with dual numbers that carry a value and a derivative. <C>vmap</C> takes a
        function written for one example and produces one that handles a batch along a chosen axis, as if you had looped
        over the batch and stacked the results, but compiled into batched operations. Because every transformation works
        on the same traced operations, they compose.
      </p>
      <PerExampleClipViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the transformations">
        <p>
          <C>jvp(f, primals, tangents)</C> returns f(x) and the Jacobian-vector product J v. <C>vjp</C> returns f(x) and
          a function mapping u to uᵀJ; <C>grad</C> is vjp with u = 1 for scalar f. <C>vmap(f, in_axes)</C> maps f over
          an axis of each argument (None means shared). <C>jacfwd</C> builds a Jacobian from n jvps, <C>jacrev</C> from m
          vjps.
        </p>
        <Code>{JAX}</Code>
      </Definition>

      <Theorem title="dual numbers compute directional derivatives">
        <p>
          Extend each operation to pairs (a, ȧ) by <C>(a, ȧ) + (b, ḃ) = (a + b, ȧ + ḃ)</C>,{" "}
          <C>(a, ȧ)(b, ḃ) = (ab, aḃ + ȧb)</C> and <C>g(a, ȧ) = (g(a), g′(a) ȧ)</C> for elementary g. Then evaluating f on
          the pairs (xᵢ, vᵢ) gives (f(x), ∇f(x) · v).
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction over the operations. Each input carries its value and its derivative along the direction v,
          d/dt (xᵢ + t vᵢ) = vᵢ. If both operands of an operation carry their values and directional derivatives, the sum,
          product and chain rules give exactly the second components above, so the result does too. The final output then
          carries f(x) and d/dt f(x + t v) at t = 0, which is ∇f(x) · v. Since the rules only use + and ×, the components
          may themselves be dual numbers, and nesting computes higher derivatives: this is the forward analogue of
          differentiating a backward pass.
        </p>
        <Code>{FWD}</Code>
      </Proof>

      <Example title="per-example gradients with vmap">
        <p>
          Reference semantics of vmap: take slice i of every mapped argument, call f, stack the outputs. JAX does not
          loop; each primitive has a batching rule that rewrites it to act on a whole batch, such as a matrix-vector product
          becoming a matrix-matrix product. Composed with a per-example gradient, it gives the matrix of gradients that
          clipping needs.
        </p>
        <Code>{VMAP}</Code>
      </Example>

      <Remark title="forward or reverse">
        <p>
          A jvp costs a small multiple of evaluating f and gives one column of J; a vjp costs a small multiple too but gives
          one row, and must keep the forward pass&apos;s intermediates. For a loss with millions of inputs and one output,
          reverse mode wins by a factor of millions. For few inputs and many outputs, or for Hessian-vector products,
          forward mode, or forward-over-reverse, is the better choice and needs no extra memory for a tape.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dual",
      rung: "check",
      prompt: <p>Evaluate f(x, y) = x·y + y² on the dual numbers (2, 1) and (3, 0). What is the tangent of the result?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "jac",
      rung: "check",
      prompt: <p>A function maps 10 inputs to 1000 outputs. How many jvps does its full Jacobian need with forward mode?</p>,
      answer: { kind: "numeric", value: 10, tolerance: 0.1 },
    },
    {
      key: "axes",
      rung: "apply",
      prompt: <p>What does <C>in_axes=(None, 0, 0)</C> mean in <C>vmap(grad(loss), in_axes=(None, 0, 0))(w, X, Y)</C>?</p>,
      answer: {
        kind: "choice",
        options: [
          "The weights w are shared by every call while X and Y are split along their first axis, so the result has one gradient per example",
          "w is mapped over its first axis and X and Y are shared",
          "The gradient is taken with respect to X and Y but not w",
          "The batch is summed before the gradient is taken",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def _lift(v, name):
    return getattr(v, name)() if isinstance(v, Dual) else getattr(math, name)(v)

class Dual:
    def __init__(self, val, tan=0.0):
        self.val, self.tan = val, tan

    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.tan + o.tan)

    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.val * o.tan + self.tan * o.val)

    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return Dual(_lift(self.val, 'sin'), _lift(self.val, 'cos') * self.tan)
    def cos(self): return Dual(_lift(self.val, 'cos'), -1.0 * _lift(self.val, 'sin') * self.tan)
    def exp(self): return Dual(_lift(self.val, 'exp'), _lift(self.val, 'exp') * self.tan)

def jvp(f, primals, tangents):
    out = f(*[Dual(p, t) for p, t in zip(primals, tangents)])
    return (out.val, out.tan) if isinstance(out, Dual) else (out, 0.0)

def grad_fwd(f):
    def g(*xs):
        return [jvp(f, xs, [1.0 if j == i else 0.0 for j in range(len(xs))])[1] for i in range(len(xs))]
    return g

def nth_derivative(f, n):
    for _ in range(n):
        f = (lambda h: lambda x: grad_fwd(h)(x)[0])(f)
    return f

f = lambda x, y: x * y + y * y
print(jvp(f, (2.0, 3.0), (1.0, 0.0)), jvp(f, (2.0, 3.0), (0.0, 1.0)), grad_fwd(f)(2.0, 3.0))
g = lambda x: x * x * x
print([nth_derivative(g, k)(2.0) for k in range(5)], round(nth_derivative(lambda x: x.sin(), 2)(1.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(15.0, 3.0) (15.0, 8.0) [3.0, 8.0]\n[8.0, 12.0, 12.0, 6.0, 0.0] -0.8415",
          "(15.0, 3.0) (15.0, 8.0) [3.0, 8.0]\n[8.0, 12.0, 6.0, 0.0, 0.0] -0.8415",
          "(15.0, 2.0) (15.0, 8.0) [2.0, 8.0]\n[8.0, 12.0, 12.0, 6.0, 0.0] -0.8415",
          "(15.0, 3.0) (15.0, 8.0) [3.0, 8.0]\n[8.0, 12.0, 12.0, 6.0, 0.0] 0.5403",
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

def vmap(f, in_axes=0):
    def batched(*args):
        axes = in_axes if isinstance(in_axes, (tuple, list)) else (in_axes,) * len(args)
        sizes = {np.shape(a)[ax] for a, ax in zip(args, axes) if ax is not None}
        if len(sizes) != 1:
            raise ValueError('inconsistent batch sizes')
        n = sizes.pop()
        return np.stack([f(*[a if ax is None else np.take(a, i, axis=ax) for a, ax in zip(args, axes)]) for i in range(n)])
    return batched

def loss_grad(w, x, y):
    return 2 * (x @ w - y) * x

def clipped_mean_grad(w, X, Y, clip):
    g = vmap(loss_grad, (None, 0, 0))(w, X, Y)
    norms = np.linalg.norm(g, axis=1, keepdims=True)
    return np.mean(g * np.minimum(1.0, clip / np.maximum(norms, 1e-12)), axis=0)

print(vmap(lambda a, b: a @ b)(np.ones((4, 2, 3)), np.ones((4, 3))).shape, vmap(lambda a, b: a * b, (0, None))(np.arange(3.0), 2.0).tolist())
w, X, Y = np.array([1.0, 0.0]), np.array([[1.0, 0.0], [2.0, 3.0]]), np.array([0.0, 1.0])
print(vmap(loss_grad, (None, 0, 0))(w, X, Y).tolist(), clipped_mean_grad(w, X, Y, 1.0).round(3).tolist(), clipped_mean_grad(w, X, Y, 100.0).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 2) [0.0, 2.0, 4.0]\n[[2.0, 0.0], [4.0, 6.0]] [0.777, 0.416] [3.0, 3.0]",
          "(4, 2) [0.0, 2.0, 4.0]\n[[2.0, 0.0], [4.0, 6.0]] [0.5, 0.5] [3.0, 3.0]",
          "(4, 3) [0.0, 2.0, 4.0]\n[[2.0, 0.0], [4.0, 6.0]] [0.777, 0.416] [3.0, 3.0]",
          "(4, 2) [0.0, 2.0, 4.0]\n[[2.0, 0.0], [4.0, 6.0]] [0.777, 0.416] [6.0, 6.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Dual</C>, write <C>jvp(f, primals, tangents)</C>, returning the value and tangent (tangent 0.0
          if f returns a constant), <C>grad_fwd(f)</C>, returning a function that computes the gradient as a list by one jvp
          per input, and <C>nth_derivative(f, n)</C> for scalar f, by composing grad_fwd n times.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def _lift(v, name):
    return getattr(v, name)() if isinstance(v, Dual) else getattr(math, name)(v)

class Dual:
    def __init__(self, val, tan=0.0):
        self.val, self.tan = val, tan

    def __add__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val + o.val, self.tan + o.tan)

    def __mul__(self, o):
        o = o if isinstance(o, Dual) else Dual(o)
        return Dual(self.val * o.val, self.val * o.tan + self.tan * o.val)

    __radd__, __rmul__ = __add__, __mul__
    def sin(self): return Dual(_lift(self.val, 'sin'), _lift(self.val, 'cos') * self.tan)
    def cos(self): return Dual(_lift(self.val, 'cos'), -1.0 * _lift(self.val, 'sin') * self.tan)
    def exp(self): return Dual(_lift(self.val, 'exp'), _lift(self.val, 'exp') * self.tan)

def jvp(f, primals, tangents):
    return f(*primals), 0.0

def grad_fwd(f):
    return lambda *xs: [0.0 for _ in xs]

def nth_derivative(f, n):
    return f
`,
        solution: FWD,
        tests: [
          { name: "jvp", code: `f = lambda x, y: (x * y).exp() + x.cos()
v, t = jvp(f, (0.5, 2.0), (1.0, -1.0)); assert abs(v - (math.exp(1.0) + math.cos(0.5))) < 1e-12 and abs(t - (math.exp(1.0) * (2.0 - 0.5) - math.sin(0.5))) < 1e-12
assert jvp(lambda x: 3.0, (1.0,), (1.0,)) == (3.0, 0.0) and grad_fwd(lambda x, y, z: x * y + z * z)(2.0, 5.0, -1.0) == [5.0, 2.0, -2.0]` },
          { name: "nth", code: `h = lambda x: x * x * x * x
assert [nth_derivative(h, k)(1.5) for k in range(6)] == [1.5 ** 4, 4 * 1.5 ** 3, 12 * 1.5 ** 2, 24 * 1.5, 24.0, 0.0]
assert abs(nth_derivative(lambda x: x.exp() * x.sin(), 2)(0.3) - 2 * math.exp(0.3) * math.cos(0.3)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>vmap(f, in_axes=0)</C> with in_axes either one value or a tuple per argument (None for shared), raising
          ValueError if mapped sizes differ, <C>loss_grad(w, x, y)</C>, the gradient of (x·w − y)² with respect to w, and{" "}
          <C>clipped_mean_grad(w, X, Y, clip)</C>, which clips each per-example gradient to norm at most clip and averages.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def vmap(f, in_axes=0):
    return f

def loss_grad(w, x, y):
    return np.zeros_like(w)

def clipped_mean_grad(w, X, Y, clip):
    return np.zeros_like(w)
`,
        solution: VMAP,
        tests: [
          { name: "vmap", code: `A = np.arange(24.0).reshape(2, 3, 4); assert np.array_equal(vmap(lambda m: m.sum(axis=0), 1)(A), np.stack([A[:, i, :].sum(axis=0) for i in range(3)]))
assert vmap(lambda a, b, c: a * b + c, (0, None, 0))(np.array([1.0, 2.0]), 10.0, np.array([0.5, 0.25])).tolist() == [10.5, 20.25]
try:
    vmap(lambda a, b: a + b)(np.ones(2), np.ones(3))
    assert False
except ValueError:
    pass` },
          { name: "clip", code: `w = np.array([0.5, -1.0]); X = np.array([[1.0, 2.0], [0.0, 1.0], [3.0, 0.0]]); Y = np.array([1.0, 0.0, 0.0])
G = vmap(loss_grad, (None, 0, 0))(w, X, Y); assert G.tolist() == [[-5.0, -10.0], [0.0, -2.0], [9.0, 0.0]]
n = np.linalg.norm(G, axis=1, keepdims=True); assert np.allclose(clipped_mean_grad(w, X, Y, 3.0), np.mean(G * np.minimum(1, 3.0 / n), axis=0)) and np.allclose(clipped_mean_grad(w, X, Y, 1e6), G.mean(axis=0))` },
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: (
        <p>
          With per-example gradient clipping, a batch of 256 examples for a model with 10⁸ parameters materialises every
          per-example gradient in float32. How many gigabytes is that?
        </p>
      ),
      answer: { kind: "numeric", value: 102.4, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        vmap maps a function over an axis on one device. The last JAX lesson maps arrays over many devices: a mesh of
        accelerators with named axes, and annotations that say how each array is split across it.
      </p>
    </>
  ),
};
