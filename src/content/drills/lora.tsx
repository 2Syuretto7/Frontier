import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const lora: Drill = {
  id: "lora",
  title: "LoRA linear layer",
  summary: "A frozen linear layer with a trainable low-rank update: forward, backward and merge.",
  minutes: 20,
  skills: ["Fine-tuning", "Backpropagation", "Linear algebra"],
  brief: (
    <>
      <p>Write a class <C>LoRALinear</C> in NumPy: a frozen linear layer plus a trainable low-rank update.</p>
      <ul>
        <li>
          <C>LoRALinear(W, b, r, alpha, seed=0)</C>. <C>W</C> has shape <C>(out_features, in_features)</C> and{" "}
          <C>b</C> <C>(out_features,)</C>; both stay frozen and must never change. Create attributes <C>A</C> of shape{" "}
          <C>(r, in_features)</C>, drawn from <C>np.random.default_rng(seed)</C> as small normals, and <C>B</C> of
          shape <C>(out_features, r)</C>, all zeros. The update is scaled by <C>alpha / r</C>.
        </li>
        <li>
          <C>forward(x)</C>: <C>x</C> has shape <C>(..., in_features)</C>; return{" "}
          <C>x @ W.T + b + (alpha / r) * (x @ A.T) @ B.T</C>, shape <C>(..., out_features)</C>. Keep what the
          backward pass needs.
        </li>
        <li>
          <C>backward(grad_out)</C>: given the gradient of the loss with respect to the last <C>forward</C> output,
          set <C>self.grad_A</C> and <C>self.grad_B</C> (same shapes as <C>A</C> and <C>B</C>, summed over every
          leading dimension) and return the gradient with respect to <C>x</C>.
        </li>
        <li><C>merged_weight()</C> returns the single <C>(out_features, in_features)</C> matrix that gives the same output, for deployment.</li>
        <li><C>num_trainable()</C> returns how many numbers are trained.</li>
      </ul>
      <p>The hidden tests check that a fresh layer equals the frozen one, every gradient against a reference, that <C>W</C> and <C>b</C> never change, the scaling and the merge.</p>
      <Code>{`
layer = LoRALinear(W, b, r=4, alpha=8)
y = layer.forward(x)            # equals x @ W.T + b while B is zero
dx = layer.backward(np.ones_like(y))
layer.B -= 0.1 * layer.grad_B
`}</Code>
    </>
  ),
  starter: `import numpy as np


class LoRALinear:
    def __init__(self, W, b, r, alpha, seed=0):
        raise NotImplementedError

    def forward(self, x):
        raise NotImplementedError

    def backward(self, grad_out):
        raise NotImplementedError

    def merged_weight(self):
        raise NotImplementedError

    def num_trainable(self):
        raise NotImplementedError


if __name__ == "__main__":
    rng = np.random.default_rng(0)
    W, b = rng.normal(size=(6, 10)), rng.normal(size=6)
    layer = LoRALinear(W, b, r=2, alpha=4)
    x = rng.normal(size=(3, 10))
    print(np.allclose(layer.forward(x), x @ W.T + b))
`,
  solution: `import numpy as np


class LoRALinear:
    def __init__(self, W, b, r, alpha, seed=0):
        self.W = W
        self.b = b
        self.scale = alpha / r
        out_features, in_features = W.shape
        self.A = np.random.default_rng(seed).normal(size=(r, in_features)) / np.sqrt(in_features)
        self.B = np.zeros((out_features, r))

    def forward(self, x):
        self.x = x
        self.h = x @ self.A.T
        return x @ self.W.T + self.b + self.scale * self.h @ self.B.T

    def backward(self, grad_out):
        x2 = self.x.reshape(-1, self.x.shape[-1])
        h2 = self.h.reshape(-1, self.h.shape[-1])
        g2 = grad_out.reshape(-1, grad_out.shape[-1])
        self.grad_B = self.scale * g2.T @ h2
        grad_h = self.scale * g2 @ self.B
        self.grad_A = grad_h.T @ x2
        grad_x = g2 @ self.W + grad_h @ self.A
        return grad_x.reshape(self.x.shape)

    def merged_weight(self):
        return self.W + self.scale * self.B @ self.A

    def num_trainable(self):
        return self.A.size + self.B.size
`,
  prelude: `import numpy as _ref_np

_ref_rng = _ref_np.random.default_rng(77)


def _ref_layer(out_f=6, in_f=9, r=3, alpha=6.0):
    W = _ref_rng.normal(size=(out_f, in_f))
    b = _ref_rng.normal(size=out_f)
    layer = LoRALinear(W.copy(), b.copy(), r, alpha)
    return layer, W, b


def _ref_forward(W, b, A, B, s, x):
    return x @ W.T + b + s * (x @ A.T) @ B.T


def _ref_grads(W, A, B, s, x, g):
    x2 = x.reshape(-1, x.shape[-1])
    g2 = g.reshape(-1, g.shape[-1])
    gB = s * g2.T @ (x2 @ A.T)
    gh = s * g2 @ B
    return gh.T @ x2, gB, (g2 @ W + gh @ A).reshape(x.shape)
`,
  tests: [
    {
      name: "A and B have the right shapes, and B starts at zero",
      code: `layer, W, b = _ref_layer(6, 9, 3)
assert _ref_np.shape(layer.A) == (3, 9), f"A should be (r, in_features) = (3, 9), got {_ref_np.shape(layer.A)}"
assert _ref_np.shape(layer.B) == (6, 3), f"B should be (out_features, r) = (6, 3), got {_ref_np.shape(layer.B)}"
assert _ref_np.all(layer.B == 0), "B should start at zero"
assert _ref_np.any(layer.A != 0), "A should start random, not zero, or B never gets a gradient"`,
    },
    {
      name: "a fresh layer equals the frozen layer",
      code: `layer, W, b = _ref_layer()
x = _ref_rng.normal(size=(2, 5, 9))
y = layer.forward(x)
assert _ref_np.shape(y) == (2, 5, 6), f"output should be (2, 5, 6), got {_ref_np.shape(y)}"
assert _ref_np.allclose(y, x @ W.T + b), "with B at zero the output should equal x @ W.T + b"`,
    },
    {
      name: "the update is scaled by alpha / r",
      code: `layer, W, b = _ref_layer(5, 7, 2, alpha=10.0)
layer.B = _ref_rng.normal(size=(5, 2))
x = _ref_rng.normal(size=(4, 7))
want = _ref_forward(W, b, layer.A, layer.B, 5.0, x)
assert _ref_np.allclose(layer.forward(x), want), "with B non-zero the output differs: is the low-rank term scaled by alpha / r?"`,
    },
    {
      name: "the gradients of A and B match the reference",
      code: `layer, W, b = _ref_layer(6, 8, 3, alpha=4.5)
layer.B = _ref_rng.normal(size=(6, 3))
x = _ref_rng.normal(size=(2, 4, 8))
g = _ref_rng.normal(size=(2, 4, 6))
layer.forward(x)
layer.backward(g)
gA, gB, _ = _ref_grads(W, layer.A, layer.B, 1.5, x, g)
assert _ref_np.shape(layer.grad_A) == (3, 8) and _ref_np.shape(layer.grad_B) == (6, 3), "grad_A and grad_B should have the shapes of A and B"
assert _ref_np.allclose(layer.grad_B, gB), "grad_B is wrong: remember the scale, and sum over every leading dimension"
assert _ref_np.allclose(layer.grad_A, gA), "grad_A is wrong"`,
    },
    {
      name: "the gradient with respect to x matches the reference",
      code: `layer, W, b = _ref_layer(6, 8, 3, alpha=6.0)
layer.B = _ref_rng.normal(size=(6, 3))
x = _ref_rng.normal(size=(3, 8))
g = _ref_rng.normal(size=(3, 6))
layer.forward(x)
dx = layer.backward(g)
_, _, want = _ref_grads(W, layer.A, layer.B, 2.0, x, g)
assert _ref_np.shape(dx) == x.shape, "the gradient with respect to x should have x's shape"
assert _ref_np.allclose(dx, want), "the gradient with respect to x should flow through both W and the low-rank path"`,
    },
    {
      name: "training changes only A and B",
      code: `layer, W, b = _ref_layer()
for _ in range(3):
    x = _ref_rng.normal(size=(4, 9))
    y = layer.forward(x)
    layer.backward(y - 1.0)
    layer.A -= 0.01 * layer.grad_A
    layer.B -= 0.01 * layer.grad_B
assert _ref_np.array_equal(layer.W, W) and _ref_np.array_equal(layer.b, b), "W and b must stay frozen"
assert _ref_np.any(layer.B != 0), "B should have moved after three steps"`,
    },
    {
      name: "the merged weight reproduces the output",
      code: `layer, W, b = _ref_layer(5, 7, 2, alpha=4.0)
layer.B = _ref_rng.normal(size=(5, 2))
x = _ref_rng.normal(size=(6, 7))
M = layer.merged_weight()
assert _ref_np.shape(M) == (5, 7), "the merged weight should have W's shape"
assert _ref_np.allclose(x @ M.T + b, layer.forward(x)), "x @ merged.T + b should equal forward(x)"
assert layer.num_trainable() == 2 * (5 + 7), f"r * (in + out) = 24 numbers are trained, got {layer.num_trainable()}"`,
    },
  ],
};
