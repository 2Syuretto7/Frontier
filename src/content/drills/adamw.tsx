import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const adamw: Drill = {
  id: "adamw",
  title: "AdamW optimiser",
  summary: "Adam with bias correction and decoupled weight decay, updating NumPy parameters in place.",
  minutes: 15,
  skills: ["Optimisation", "Training", "NumPy"],
  brief: (
    <>
      <p>Write a class <C>AdamW</C> in NumPy with the same update rule as PyTorch&apos;s <C>torch.optim.AdamW</C>.</p>
      <ul>
        <li>
          <C>AdamW(params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01)</C>. <C>params</C> is a list of
          float NumPy arrays of any shapes.
        </li>
        <li>
          <C>step(grads)</C> takes a list of gradients, one per parameter with the same shape, and updates every
          parameter <strong>in place</strong> (the caller holds references to the same arrays). It returns nothing.
        </li>
      </ul>
      <p>For step <C>t = 1, 2, …</C>, each parameter <C>p</C> with gradient <C>g</C>:</p>
      <Code>{`
p  <- p - lr * weight_decay * p          # decoupled weight decay, applied first
m  <- beta1 * m + (1 - beta1) * g
v  <- beta2 * v + (1 - beta2) * g**2
m_hat = m / (1 - beta1**t)
v_hat = v / (1 - beta2**t)
p  <- p - lr * m_hat / (sqrt(v_hat) + eps)
`}</Code>
      <p>
        <C>m</C> and <C>v</C> start at zero and are kept separately for each parameter. The weight decay never enters{" "}
        <C>m</C> or <C>v</C>. The hidden tests compare several steps against a reference, check the in-place update,
        the bias correction and that the decay is decoupled.
      </p>
    </>
  ),
  starter: `import numpy as np


class AdamW:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01):
        raise NotImplementedError

    def step(self, grads):
        raise NotImplementedError


if __name__ == "__main__":
    w = np.array([1.0, -2.0, 3.0])
    opt = AdamW([w], lr=0.1)
    opt.step([np.array([0.5, 0.5, -1.0])])
    print(w)
`,
  solution: `import numpy as np


class AdamW:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01):
        self.params = params
        self.lr = lr
        self.beta1, self.beta2 = betas
        self.eps = eps
        self.weight_decay = weight_decay
        self.m = [np.zeros_like(p) for p in params]
        self.v = [np.zeros_like(p) for p in params]
        self.t = 0

    def step(self, grads):
        self.t += 1
        c1 = 1 - self.beta1 ** self.t
        c2 = 1 - self.beta2 ** self.t
        for p, g, m, v in zip(self.params, grads, self.m, self.v):
            p *= 1 - self.lr * self.weight_decay
            m *= self.beta1
            m += (1 - self.beta1) * g
            v *= self.beta2
            v += (1 - self.beta2) * g * g
            p -= self.lr * (m / c1) / (np.sqrt(v / c2) + self.eps)
`,
  prelude: `import numpy as _ref_np


def _ref_run(shapes, steps, seed, **kw):
    rng = _ref_np.random.default_rng(seed)
    init = [rng.normal(size=s) for s in shapes]
    grads = [[rng.normal(size=s) * (1 + 3 * k) for s in shapes] for k in range(steps)]
    lr = kw.get("lr", 1e-3)
    b1, b2 = kw.get("betas", (0.9, 0.999))
    eps = kw.get("eps", 1e-8)
    wd = kw.get("weight_decay", 0.01)
    ps = [p.copy() for p in init]
    ms = [_ref_np.zeros_like(p) for p in ps]
    vs = [_ref_np.zeros_like(p) for p in ps]
    for t in range(1, steps + 1):
        for i, g in enumerate(grads[t - 1]):
            ps[i] = ps[i] * (1 - lr * wd)
            ms[i] = b1 * ms[i] + (1 - b1) * g
            vs[i] = b2 * vs[i] + (1 - b2) * g * g
            ps[i] = ps[i] - lr * (ms[i] / (1 - b1 ** t)) / (_ref_np.sqrt(vs[i] / (1 - b2 ** t)) + eps)
    return init, grads, ps


def _ref_learner(shapes, steps, seed, **kw):
    init, grads, want = _ref_run(shapes, steps, seed, **kw)
    params = [p.copy() for p in init]
    held = list(params)
    opt = AdamW(params, **kw)
    for g in grads:
        opt.step([x.copy() for x in g])
    return held, want
`,
  tests: [
    {
      name: "parameters are updated in place",
      code: `init, grads, _ = _ref_run([(3,), (2, 4)], 1, 0, lr=0.1)
params = [p.copy() for p in init]
held = list(params)
AdamW(params, lr=0.1).step([g.copy() for g in grads[0]])
assert all(not _ref_np.allclose(h, i) for h, i in zip(held, init)), "the arrays passed to AdamW did not change: update them in place (p -= ..., not p = ...)"`,
    },
    {
      name: "the first step moves each weight by about lr",
      code: `init, grads, _ = _ref_run([(50,)], 1, 1, lr=0.01, weight_decay=0.0)
p = init[0].copy()
AdamW([p], lr=0.01, weight_decay=0.0).step([grads[0][0].copy()])
moved = _ref_np.abs(p - init[0])
assert _ref_np.allclose(moved, 0.01, rtol=1e-3), "with bias correction, the first step should move each weight by almost exactly lr whatever the gradient's size"`,
    },
    {
      name: "matches the reference over many steps",
      code: `held, want = _ref_learner([(5,), (3, 4), (2, 2, 2)], 25, 2, lr=0.05, betas=(0.8, 0.99), eps=1e-6, weight_decay=0.1)
for i, (h, w) in enumerate(zip(held, want)):
    assert h.shape == w.shape, f"parameter {i} changed shape"
    assert _ref_np.allclose(h, w, rtol=1e-6, atol=1e-9), f"parameter {i} differs from the reference after 25 steps: check the moment updates and bias correction"`,
    },
    {
      name: "default hyperparameters follow PyTorch",
      code: `held, want = _ref_learner([(4,)], 5, 3)
assert _ref_np.allclose(held[0], want[0], rtol=1e-6, atol=1e-12), "with default arguments the result differs from the reference: check the update rule and the defaults lr=1e-3, betas=(0.9, 0.999), eps=1e-8, weight_decay=0.01"`,
    },
    {
      name: "weight decay is decoupled from the gradient",
      code: `p = _ref_np.array([2.0, -4.0, 8.0])
opt = AdamW([p], lr=0.1, weight_decay=0.5)
opt.step([_ref_np.zeros(3)])
assert _ref_np.allclose(p, [2.0 * 0.95, -4.0 * 0.95, 8.0 * 0.95]), "with a zero gradient, a step should only shrink each weight by (1 - lr * weight_decay)"
opt.step([_ref_np.zeros(3)])
assert _ref_np.allclose(p, _ref_np.array([2.0, -4.0, 8.0]) * 0.95 ** 2), "the weight decay should not leak into the moment estimates"`,
    },
    {
      name: "state is kept separately for each parameter",
      code: `a = _ref_np.zeros(3)
b = _ref_np.zeros(3)
opt = AdamW([a, b], lr=0.1, weight_decay=0.0)
for _ in range(3):
    opt.step([_ref_np.ones(3), -_ref_np.ones(3) * 10])
assert _ref_np.allclose(a, -0.3) and _ref_np.allclose(b, 0.3), "a constant gradient should move each weight by exactly lr per step: check that each parameter has its own m and v, and the bias correction"`,
    },
  ],
};
