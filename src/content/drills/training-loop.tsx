import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const trainingLoop: Drill = {
  id: "training-loop",
  title: "MLP training loop with hand-written backprop",
  summary: "Forward pass, cross-entropy, backpropagation and a minibatch SGD loop for a two-layer network.",
  minutes: 30,
  skills: ["Backpropagation", "Training", "Cross-entropy"],
  lessons: ["l3.2.3", "l3.3.2", "l3.6.1"],
  testLessons: {
    "init_params returns the right shapes": ["l3.2.3"],
    "the loss matches the reference": ["l3.3.2"],
    "every gradient matches the reference": ["l3.2.3", "l3.2.4"],
    "the loss stays finite for huge logits": ["l3.3.2"],
    "train takes one step per minibatch": ["l3.6.1"],
    "the first logged loss is the loss before any update": ["l3.6.1"],
    "training learns a non-linear boundary": ["l3.6.1"],
  },
  brief: (
    <>
      <p>Train a two-layer ReLU classifier in NumPy, with gradients written by hand.</p>
      <ol>
        <li>
          <C>init_params(d_in, d_hidden, d_out, seed=0)</C> returns a dict with <C>W1</C> <C>(d_in, d_hidden)</C>,{" "}
          <C>b1</C> <C>(d_hidden,)</C>, <C>W2</C> <C>(d_hidden, d_out)</C> and <C>b2</C> <C>(d_out,)</C>. Draw the
          weights from <C>np.random.default_rng(seed)</C> as normals scaled by <C>sqrt(2 / fan_in)</C>; biases start
          at zero.
        </li>
        <li>
          <C>loss_and_grads(params, X, y)</C>: <C>X</C> is <C>(N, d_in)</C>, <C>y</C> holds integer labels{" "}
          <C>(N,)</C>. The model is <C>logits = relu(X @ W1 + b1) @ W2 + b2</C>. Return <C>(loss, grads)</C>:
          the mean cross-entropy as a float, and a dict of gradients with the same keys and shapes as{" "}
          <C>params</C>. It must stay finite for logits in the thousands.
        </li>
        <li>
          <C>train(X, y, d_hidden=32, lr=0.1, epochs=20, batch_size=32, seed=0)</C> returns{" "}
          <C>(params, losses)</C>. Start from <C>init_params(…, seed)</C> with <C>d_out = y.max() + 1</C>. Make one{" "}
          <C>rng = np.random.default_rng(seed)</C>; each epoch, visit the examples in the order{" "}
          <C>rng.permutation(N)</C> in consecutive minibatches of <C>batch_size</C> (the last may be smaller). Take
          one plain SGD step per minibatch and append that minibatch&apos;s loss, before the step, to{" "}
          <C>losses</C>.
        </li>
        <li><C>accuracy(params, X, y)</C> returns the fraction classified correctly.</li>
      </ol>
      <p>The hidden tests check shapes, the loss and every gradient against a reference, numerical stability, the number of steps, and that training reaches high accuracy on a non-linear dataset.</p>
      <Code>{`
params, losses = train(X, y, d_hidden=32, lr=0.5, epochs=60)
accuracy(params, X, y)   # well above 0.9 on two concentric rings
`}</Code>
    </>
  ),
  starter: `import numpy as np


def init_params(d_in, d_hidden, d_out, seed=0):
    raise NotImplementedError


def loss_and_grads(params, X, y):
    raise NotImplementedError


def train(X, y, d_hidden=32, lr=0.1, epochs=20, batch_size=32, seed=0):
    raise NotImplementedError


def accuracy(params, X, y):
    raise NotImplementedError


if __name__ == "__main__":
    rng = np.random.default_rng(0)
    X = rng.normal(size=(200, 2))
    y = (np.linalg.norm(X, axis=1) > 1.2).astype(int)
    params, losses = train(X, y, lr=0.5, epochs=60)
    print(losses[0], losses[-1], accuracy(params, X, y))
`,
  solution: `import numpy as np


def init_params(d_in, d_hidden, d_out, seed=0):
    rng = np.random.default_rng(seed)
    return {
        "W1": rng.normal(size=(d_in, d_hidden)) * np.sqrt(2 / d_in),
        "b1": np.zeros(d_hidden),
        "W2": rng.normal(size=(d_hidden, d_out)) * np.sqrt(2 / d_hidden),
        "b2": np.zeros(d_out),
    }


def loss_and_grads(params, X, y):
    n = X.shape[0]
    pre = X @ params["W1"] + params["b1"]
    h = np.maximum(pre, 0)
    logits = h @ params["W2"] + params["b2"]
    shifted = logits - logits.max(axis=1, keepdims=True)
    log_probs = shifted - np.log(np.exp(shifted).sum(axis=1, keepdims=True))
    loss = -log_probs[np.arange(n), y].mean()

    d_logits = np.exp(log_probs)
    d_logits[np.arange(n), y] -= 1
    d_logits /= n
    d_h = d_logits @ params["W2"].T
    d_pre = d_h * (pre > 0)
    grads = {
        "W2": h.T @ d_logits,
        "b2": d_logits.sum(axis=0),
        "W1": X.T @ d_pre,
        "b1": d_pre.sum(axis=0),
    }
    return float(loss), grads


def train(X, y, d_hidden=32, lr=0.1, epochs=20, batch_size=32, seed=0):
    params = init_params(X.shape[1], d_hidden, int(y.max()) + 1, seed)
    rng = np.random.default_rng(seed)
    losses = []
    for _ in range(epochs):
        order = rng.permutation(len(X))
        for start in range(0, len(X), batch_size):
            batch = order[start:start + batch_size]
            loss, grads = loss_and_grads(params, X[batch], y[batch])
            for k in params:
                params[k] -= lr * grads[k]
            losses.append(loss)
    return params, losses


def accuracy(params, X, y):
    h = np.maximum(X @ params["W1"] + params["b1"], 0)
    return float(((h @ params["W2"] + params["b2"]).argmax(axis=1) == y).mean())
`,
  prelude: `import numpy as _ref_np


def _ref_loss_grads(p, X, y):
    n = len(X)
    pre = X @ p["W1"] + p["b1"]
    h = _ref_np.maximum(pre, 0)
    z = h @ p["W2"] + p["b2"]
    z = z - z.max(axis=1, keepdims=True)
    lp = z - _ref_np.log(_ref_np.exp(z).sum(axis=1, keepdims=True))
    d = _ref_np.exp(lp)
    d[_ref_np.arange(n), y] -= 1
    d /= n
    dpre = (d @ p["W2"].T) * (pre > 0)
    return -lp[_ref_np.arange(n), y].mean(), {"W1": X.T @ dpre, "b1": dpre.sum(0), "W2": h.T @ d, "b2": d.sum(0)}


def _ref_params(d_in, d_h, d_out, seed):
    r = _ref_np.random.default_rng(seed + 100)
    return {"W1": r.normal(size=(d_in, d_h)), "b1": r.normal(size=d_h) * 0.1, "W2": r.normal(size=(d_h, d_out)), "b2": r.normal(size=d_out) * 0.1}


def _ref_rings(n, seed):
    r = _ref_np.random.default_rng(seed)
    y = _ref_np.arange(n) % 2
    radius = _ref_np.where(y == 0, 0.6, 1.6) + r.normal(scale=0.15, size=n)
    angle = r.uniform(0, 2 * _ref_np.pi, size=n)
    return _ref_np.stack([radius * _ref_np.cos(angle), radius * _ref_np.sin(angle)], axis=1), y
`,
  tests: [
    {
      name: "init_params returns the right shapes",
      code: `p = init_params(5, 7, 3, seed=1)
want = {"W1": (5, 7), "b1": (7,), "W2": (7, 3), "b2": (3,)}
assert set(p) == set(want), f"expected the keys {sorted(want)}, got {sorted(p)}"
for k, s in want.items():
    assert _ref_np.shape(p[k]) == s, f"{k} should have shape {s}, got {_ref_np.shape(p[k])}"
assert _ref_np.all(p["b1"] == 0) and _ref_np.all(p["b2"] == 0), "biases should start at zero"
q = init_params(5, 7, 3, seed=1)
assert all(_ref_np.array_equal(p[k], q[k]) for k in p), "the same seed should give the same weights"`,
    },
    {
      name: "the loss matches the reference",
      code: `r = _ref_np.random.default_rng(5)
X = r.normal(size=(16, 4))
y = r.integers(0, 3, size=16)
p = _ref_params(4, 6, 3, 0)
loss, _ = loss_and_grads({k: v.copy() for k, v in p.items()}, X, y)
want, _ = _ref_loss_grads(p, X, y)
assert _ref_np.isclose(float(loss), want), f"loss should be {want:.6f}, got {float(loss):.6f}: the mean cross-entropy over the batch"`,
    },
    {
      name: "every gradient matches the reference",
      code: `r = _ref_np.random.default_rng(6)
X = r.normal(size=(12, 4))
y = r.integers(0, 3, size=12)
p = _ref_params(4, 6, 3, 1)
_, got = loss_and_grads({k: v.copy() for k, v in p.items()}, X, y)
_, want = _ref_loss_grads(p, X, y)
for k in ("b2", "W2", "b1", "W1"):
    assert k in got, f"the gradients are missing {k}"
    assert _ref_np.shape(got[k]) == want[k].shape, f"the gradient of {k} should have shape {want[k].shape}"
    assert _ref_np.allclose(got[k], want[k], atol=1e-8), f"the gradient of {k} is wrong"`,
    },
    {
      name: "the loss stays finite for huge logits",
      code: `X = _ref_np.array([[1.0, 2.0], [-1.0, 0.5]])
p = {"W1": _ref_np.eye(2) * 300, "b1": _ref_np.zeros(2), "W2": _ref_np.array([[10.0, -10.0], [10.0, 0.0]]), "b2": _ref_np.zeros(2)}
loss, g = loss_and_grads(p, X, _ref_np.array([1, 0]))
want, _ = _ref_loss_grads(p, X, _ref_np.array([1, 0]))
assert _ref_np.isfinite(loss), "the loss overflowed: compute log-softmax stably"
assert _ref_np.isclose(float(loss), want), "the loss is wrong when logits are large"
assert all(_ref_np.all(_ref_np.isfinite(v)) for v in g.values()), "a gradient overflowed"`,
    },
    {
      name: "train takes one step per minibatch",
      code: `X, y = _ref_rings(100, 1)
params, losses = train(X, y, d_hidden=8, lr=0.1, epochs=3, batch_size=32, seed=0)
assert len(losses) == 12, f"100 examples in batches of 32 is 4 steps an epoch, so 12 in 3 epochs; got {len(losses)}"
assert _ref_np.shape(params["W2"]) == (8, 2), "d_out should be y.max() + 1"`,
    },
    {
      name: "the first logged loss is the loss before any update",
      code: `X, y = _ref_rings(64, 2)
params, losses = train(X, y, d_hidden=8, lr=0.5, epochs=1, batch_size=64, seed=3)
start = init_params(2, 8, 2, seed=3)
want, _ = _ref_loss_grads(start, X, y)
assert _ref_np.isclose(float(losses[0]), want), "with one full batch, the first loss should be the loss of the initial parameters"`,
    },
    {
      name: "training learns a non-linear boundary",
      code: `X, y = _ref_rings(300, 3)
params, losses = train(X, y, d_hidden=32, lr=0.5, epochs=60, batch_size=32, seed=0)
acc = accuracy(params, X, y)
assert _ref_np.mean(losses[-10:]) < 0.5 * _ref_np.mean(losses[:10]), "the loss did not fall much: check the update direction and the gradients"
assert acc >= 0.9, f"accuracy reached only {acc:.2f}; it should pass 0.9 on two rings"`,
    },
  ],
};
