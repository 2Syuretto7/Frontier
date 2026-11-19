import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

const TESTS = (fn: string) => [
  { name: "accumulation gives the full-batch gradient", code: String.raw`_ref_rng = _ref_np.random.default_rng(4)
_ref_X, _ref_y, _ref_w = _ref_rng.normal(size=(64, 5)), _ref_rng.normal(size=64), _ref_rng.normal(size=5)
assert _ref_np.allclose(accumulated_grad(_ref_w, _ref_X, _ref_y, 8), mse_and_grad(_ref_w, _ref_X, _ref_y)[1]), "eight micro-batches should give the same gradient as one batch"` },
  { name: "uneven micro-batches are weighted by their size", code: String.raw`_ref_rng = _ref_np.random.default_rng(5)
_ref_X, _ref_y, _ref_w = _ref_rng.normal(size=(10, 3)), _ref_rng.normal(size=10), _ref_rng.normal(size=3)
assert _ref_np.allclose(accumulated_grad(_ref_w, _ref_X, _ref_y, 3), mse_and_grad(_ref_w, _ref_X, _ref_y)[1]), "with pieces of 4, 3 and 3 rows the gradient should still equal the batch gradient"` },
  { name: `${fn} trains like one batch`, code: String.raw`assert run(micro_batches=8)["train"][-1] < 0.2 and run(micro_batches=8)["train"][2] < 0.2, "eight micro-batches should train as fast and as well as one"` },
];

export const accumulationScale: GymCase = {
  id: "accumulation-scale",
  title: "Accumulation on, training off",
  summary: "Splitting each batch into 8 micro-batches to save memory makes the same run diverge at once.",
  minutes: 15,
  kind: "accumulation",
  lessons: ["l3.6.4", "e10.2.3"],
  bugLessons: ["e10.2.3"],
  symptom: (
    <>
      <p>
        Linear regression trained with batches of 256 at a learning rate of 0.5. To save memory, each batch is split into
        micro-batches and their gradients are added up before the step, which should change nothing about the maths.
      </p>
      <p>
        With one micro-batch the loss falls to 0.13 in ten steps. With eight, on the same batches and seeds, it explodes
        to 10<sup>11</sup> by step 10 and the run is stopped.
      </p>
    </>
  ),
  chart: {
    title: "Mean squared error, log scale",
    log: true,
    series: [
      { label: "1 micro-batch", call: "run(micro_batches=1)", key: "train" },
      { label: "8 micro-batches", call: "run(micro_batches=8)", key: "train" },
    ],
  },
  program: String.raw`import numpy as np


def make_data(n=4096, d=20, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w_true = rng.normal(size=d)
    y = X @ w_true + 0.5 * rng.normal(size=n)
    return X, y


def mse_and_grad(w, X, y):
    r = X @ w - y
    return float(0.5 * np.mean(r ** 2)), X.T @ r / len(y)


def accumulated_grad(w, X, y, micro_batches):
    """The gradient of one batch, computed in micro_batches equal pieces so each fits in memory."""
    total = np.zeros_like(w)
    for X_part, y_part in zip(np.array_split(X, micro_batches), np.array_split(y, micro_batches)):
        _, g = mse_and_grad(w, X_part, y_part)
        total += g
    return total


def run(micro_batches=8, steps=200, batch_size=256, lr=0.5, log_every=10):
    X, y = make_data()
    rng = np.random.default_rng(1)
    w = np.zeros(X.shape[1])
    history = {"step": [], "train": []}
    for step in range(steps + 1):
        if step % log_every == 0:
            loss = mse_and_grad(w, X, y)[0]
            history["step"].append(step)
            history["train"].append(loss)
            if not loss < 1e6:
                break
        idx = rng.integers(0, len(y), size=batch_size)
        w -= lr * accumulated_grad(w, X[idx], y[idx], micro_batches)
    return history


if __name__ == "__main__":
    for k in (1, 8):
        history = run(micro_batches=k)
        print(f"{k} micro-batches:", "  ".join(f"{v:.3g}" for v in history["train"]))
`,
  fix: [[String.raw`        total += g`, String.raw`        total += g * len(y_part) / len(y)`]],
  suspect: "accumulated_grad",
  causes: [
    { text: "Each micro-batch gradient is already a mean, and adding eight of them makes the step eight times too large.", right: true },
    { text: "The micro-batches overlap, so some examples are counted twice." },
    { text: "np.array_split reorders the rows, so the labels no longer match the inputs." },
    { text: "With micro-batches of 32, each gradient is too noisy for a learning rate of 0.5." },
  ],
  explanation: (
    <>
      <p>
        <C>mse_and_grad</C> returns the mean gradient over its rows. Summing eight such means gives eight times the batch
        gradient, which at a learning rate of 0.5 is far past the stable step, so the loss grows geometrically.
      </p>
      <p>
        Weight each micro-batch&apos;s mean by its share of the rows, <C>len(y_part) / len(y)</C>, so the total is the
        batch mean even when the pieces are uneven. Dividing by the number of micro-batches works only when they are
        equal.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: TESTS("eight micro-batches"),
};

export const accumulationReset: GymCase = {
  id: "accumulation-reset",
  title: "Eight micro-batches, eight times slower",
  summary: "With accumulation on, the loss takes about eight times as many steps to come down.",
  minutes: 15,
  kind: "accumulation",
  lessons: ["l3.6.4", "e10.2.3"],
  bugLessons: ["e10.2.3"],
  symptom: (
    <>
      <p>
        The same linear regression, batches of 256, learning rate 0.8, and each batch split into micro-batches whose
        gradients are combined before the step. This time someone already weighted each piece by its share of the batch.
      </p>
      <p>
        With one micro-batch the loss reaches 0.13 within ten steps. With eight it is still at 1.04 after ten steps and
        needs about forty to get there, as if the learning rate had been cut by eight.
      </p>
    </>
  ),
  chart: {
    title: "Mean squared error, log scale",
    log: true,
    series: [
      { label: "1 micro-batch", call: "run(micro_batches=1)", key: "train" },
      { label: "8 micro-batches", call: "run(micro_batches=8)", key: "train" },
    ],
  },
  program: String.raw`import numpy as np


def make_data(n=4096, d=20, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w_true = rng.normal(size=d)
    y = X @ w_true + 0.5 * rng.normal(size=n)
    return X, y


def mse_and_grad(w, X, y):
    r = X @ w - y
    return float(0.5 * np.mean(r ** 2)), X.T @ r / len(y)


def accumulated_grad(w, X, y, micro_batches):
    """The gradient of one batch, computed in micro_batches equal pieces so each fits in memory."""
    for X_part, y_part in zip(np.array_split(X, micro_batches), np.array_split(y, micro_batches)):
        total = np.zeros_like(w)
        _, g = mse_and_grad(w, X_part, y_part)
        total += g * len(y_part) / len(y)
    return total


def run(micro_batches=8, steps=200, batch_size=256, lr=0.8, log_every=10):
    X, y = make_data()
    rng = np.random.default_rng(1)
    w = np.zeros(X.shape[1])
    history = {"step": [], "train": []}
    for step in range(steps + 1):
        if step % log_every == 0:
            loss = mse_and_grad(w, X, y)[0]
            history["step"].append(step)
            history["train"].append(loss)
            if not loss < 1e6:
                break
        idx = rng.integers(0, len(y), size=batch_size)
        w -= lr * accumulated_grad(w, X[idx], y[idx], micro_batches)
    return history


if __name__ == "__main__":
    for k in (1, 8):
        history = run(micro_batches=k)
        print(f"{k} micro-batches:", "  ".join(f"{v:.3g}" for v in history["train"]))
`,
  fix: [[String.raw`    for X_part, y_part in zip(np.array_split(X, micro_batches), np.array_split(y, micro_batches)):
        total = np.zeros_like(w)`, String.raw`    total = np.zeros_like(w)
    for X_part, y_part in zip(np.array_split(X, micro_batches), np.array_split(y, micro_batches)):`]],
  suspect: "accumulated_grad",
  causes: [
    { text: "The running total is reset inside the loop, so only the last micro-batch's share of the gradient survives.", right: true },
    { text: "Weighting by len(y_part) / len(y) shrinks each piece twice, once here and once in the mean." },
    { text: "Eight micro-batches of 32 are noisier than one batch, so a smaller effective step is the price of saving memory." },
    { text: "The gradient is accumulated in float32, which loses the small contributions." },
  ],
  explanation: (
    <>
      <p>
        <C>total = np.zeros_like(w)</C> sits inside the loop, so each micro-batch wipes out the ones before it. What is
        returned is the last piece&apos;s gradient times 1/8: an eighth of the step, in the direction of 32 examples
        rather than 256.
      </p>
      <p>
        Start the total once, before the loop. This is the same mistake as calling <C>zero_grad</C> inside the
        accumulation loop in PyTorch.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: TESTS("eight micro-batches"),
};
