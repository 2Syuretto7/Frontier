import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const cosine: GymCase = {
  id: "cosine",
  title: "The loss that comes back in waves",
  summary: "Loss dips every two epochs and climbs back, and the run ends worse than it was halfway through.",
  minutes: 15,
  kind: "schedule",
  lessons: ["l3.6.3", "l3.6.4", "l3.8.2", "e1.5.4"],
  bugLessons: ["l3.6.3"],
  testLessons: {
    "cosine_lr still decays from the base rate to zero": ["l3.6.3"],
    "the learning rate only ever goes down": ["l3.6.3"],
    "the run ends at its lowest loss": ["l3.6.3", "l3.6.4"],
  },
  symptom: (
    <>
      <p>
        Linear regression trained with minibatches of 8 for 12 epochs, under a cosine schedule meant to decay once,
        from 0.3 to zero, over the whole run. The training loss is measured four times an epoch.
      </p>
      <p>
        The loss falls to about 0.14, then rises to nearly 0.3, then falls again, in a regular wave with a period of
        exactly two epochs. The last measurement is one of the worst.
      </p>
    </>
  ),
  chart: {
    title: "Mean squared error on the full training set",
    series: [{ label: "Training", call: "run()", key: "train" }],
  },
  program: String.raw`import numpy as np


def make_data(n=1600, d=20, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w_true = rng.normal(size=d)
    y = X @ w_true + 0.5 * rng.normal(size=n)
    return X, y


def cosine_lr(step, total_steps, base_lr=0.3):
    """Cosine decay from base_lr at step 0 to zero at total_steps."""
    return base_lr * 0.5 * (1 + np.cos(np.pi * step / total_steps))


def mse_and_grad(w, X, y):
    r = X @ w - y
    return float(0.5 * np.mean(r ** 2)), X.T @ r / len(y)


def run(epochs=12, batch_size=8, evals_per_epoch=4):
    X, y = make_data()
    rng = np.random.default_rng(1)
    w = np.zeros(X.shape[1])
    steps_per_epoch = len(y) // batch_size
    total_steps = steps_per_epoch
    history = {"step": [], "train": [], "lr": []}
    step = 0
    for epoch in range(epochs):
        order = rng.permutation(len(y))
        for b in range(steps_per_epoch):
            idx = order[b * batch_size:(b + 1) * batch_size]
            _, grad = mse_and_grad(w, X[idx], y[idx])
            lr = cosine_lr(step, total_steps)
            if step % (steps_per_epoch // evals_per_epoch) == 0:
                history["step"].append(step)
                history["train"].append(mse_and_grad(w, X, y)[0])
                history["lr"].append(float(lr))
            w -= lr * grad
            step += 1
    history["step"].append(step)
    history["train"].append(mse_and_grad(w, X, y)[0])
    history["lr"].append(float(cosine_lr(step, total_steps)))
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, lr in zip(history["step"], history["train"], history["lr"]):
        print(f"step {s:5d}   loss {tr:.4f}   lr {lr:.3f}")
`,
  fix: [[String.raw`    total_steps = steps_per_epoch`, String.raw`    total_steps = epochs * steps_per_epoch`]],
  suspect: "run",
  causes: [
    { text: "The schedule's length is one epoch rather than the whole run, so the cosine keeps going round and the rate climbs back to its peak every two epochs.", right: true },
    { text: "The data is reshuffled every epoch, and every second shuffle happens to be harder." },
    { text: "Batches of 8 are too small, so the loss is noise and the wave is chance." },
    { text: "The cosine is computed in degrees rather than radians." },
  ],
  explanation: (
    <>
      <p>
        <C>total_steps</C> is set to one epoch&apos;s steps. Past that point, <C>step / total_steps</C> keeps growing, so
        the cosine passes its trough and climbs back: the rate returns to 0.3 at two epochs, falls to zero at three, and so
        on. With small batches, the loss tracks the rate, so it waves with it, and the run ends near a peak.
      </p>
      <p>
        Set <C>total_steps = epochs * steps_per_epoch</C>. The <C>lr</C> column shows this at once: a schedule meant to
        decay once should never rise.
      </p>
    </>
  ),
  tests: [
    { name: "cosine_lr still decays from the base rate to zero", code: String.raw`assert abs(cosine_lr(0, 100) - 0.3) < 1e-9 and cosine_lr(100, 100) < 1e-9, "cosine_lr itself was right: base rate at step 0, zero at total_steps"` },
    { name: "the learning rate only ever goes down", code: String.raw`_ref_lr = run()["lr"]
assert all(b <= a + 1e-12 for a, b in zip(_ref_lr, _ref_lr[1:])), "the logged learning rate rises at some point"
assert _ref_lr[-1] < 1e-3, "the rate should reach zero at the end of training"` },
    { name: "the run ends at its lowest loss", code: String.raw`_ref_h = run()
assert _ref_h["train"][-1] < 0.15 and _ref_h["train"][-1] <= min(_ref_h["train"]) + 0.005, "with the rate annealed to zero, the last loss should be about the lowest"` },
  ],
};
