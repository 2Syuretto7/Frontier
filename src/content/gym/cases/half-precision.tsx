import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const halfPrecision: GymCase = {
  id: "half-precision",
  title: "The loss that flatlines with the gradient still on",
  summary: "Loss falls fast, then goes perfectly flat at 0.10 while the gradient norm holds steady at 0.42.",
  minutes: 15,
  kind: "dtype",
  lessons: ["e1.5.1", "e3.1.2", "e6.4.1", "l1.2.4"],
  bugLessons: ["e6.4.1", "e3.1.2"],
  testLessons: {
    "a small update to a large weight is not lost": ["e6.4.1", "e3.1.2"],
    "the loss keeps falling while the gradient is not zero": ["e6.4.1"],
    "training reaches the noise floor": ["e6.4.1", "l1.2.4"],
  },
  symptom: (
    <>
      <p>
        Linear regression on 8 features, with true weights between 2 and 6 in size and a little noise, trained by full-batch
        gradient descent at a learning rate of 0.01. The loss should fall to about 0.005, the noise level.
      </p>
      <p>
        It falls quickly to 0.10 and then does not move again, not even in the fourth decimal place, for a thousand
        steps. The gradient is not zero: its norm sits at 0.42 throughout. Gradient descent with a non-zero gradient and a
        small step should always make progress.
      </p>
    </>
  ),
  chart: {
    title: "Mean squared error, log scale",
    log: true,
    series: [
      { label: "Loss", call: "run()", key: "train" },
      { label: "Gradient norm", call: "run()", key: "grad_norm" },
    ],
  },
  program: String.raw`import numpy as np


def make_data(n=1000, d=8, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w_true = rng.uniform(2, 6, size=d) * rng.choice([-1, 1], size=d)
    y = X @ w_true + 0.1 * rng.normal(size=n)
    return X.astype(np.float32), y.astype(np.float32)


def init_weights(d):
    # Half-precision weights, to halve the memory they take.
    return np.zeros(d, dtype=np.float16)


def sgd_step(w, grad, lr):
    return w - (lr * grad).astype(w.dtype)


def mse_and_grad(w, X, y):
    r = X @ w.astype(np.float32) - y
    return float(0.5 * np.mean(r ** 2)), (X.T @ r / len(y)).astype(np.float32)


def run(steps=1500, lr=0.01, log_every=75):
    X, y = make_data()
    w = init_weights(X.shape[1])
    history = {"step": [], "train": [], "grad_norm": []}
    for step in range(steps + 1):
        loss, grad = mse_and_grad(w, X, y)
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(loss)
            history["grad_norm"].append(float(np.linalg.norm(grad)))
        w = sgd_step(w, grad, lr)
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, g in zip(history["step"], history["train"], history["grad_norm"]):
        print(f"step {s:4d}   loss {tr:8.4f}   gradient norm {g:.4f}")
`,
  fix: [[String.raw`    return np.zeros(d, dtype=np.float16)`, String.raw`    return np.zeros(d, dtype=np.float32)`]],
  suspect: "init_weights",
  causes: [
    { text: "The weights are stored in float16, so once each update is smaller than half the gap between neighbouring float16 values near the weight, it rounds away to nothing.", right: true },
    { text: "The learning rate is too small, so the loss is still falling, just too slowly to see in four decimals." },
    { text: "The gradient is computed in float32 but the loss in float16, so the logged loss is rounded." },
    { text: "The model has reached the best fit a linear model can make, and the remaining gradient is noise." },
  ],
  explanation: (
    <>
      <p>
        Between 4 and 8, float16 values are 1/256 apart. An update of <C>lr * grad</C>, about 0.004 here, is under half
        that gap for most coordinates, so <C>w - update</C> rounds back to <C>w</C> and the step vanishes. Training stops
        where the updates fall below the spacing, not where the gradient is zero. The cast in <C>sgd_step</C> makes it
        silent.
      </p>
      <p>
        Keep the weights in float32. Mixed-precision training keeps a float32 master copy for exactly this reason, and
        casts to low precision only for the forward and backward passes.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: [
    { name: "a small update to a large weight is not lost", code: String.raw`_ref_w = init_weights(3) + 4.0
_ref_w2 = sgd_step(_ref_w, _ref_np.full(3, 0.05, dtype=_ref_np.float32), 0.01)
assert (_ref_np.asarray(_ref_w2) != _ref_np.asarray(_ref_w)).all(), "an update of 0.0005 to a weight of 4 disappeared"` },
    { name: "the loss keeps falling while the gradient is not zero", code: String.raw`_ref_h = run()
assert _ref_h["train"][-1] < 0.5 * _ref_h["train"][6], "the loss stopped falling partway through"` },
    { name: "training reaches the noise floor", code: String.raw`assert run()["train"][-1] < 0.01, "the loss should fall to about the noise level"` },
  ],
};
