import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const warmup: GymCase = {
  id: "warmup",
  title: "The run that blows up after warmup",
  summary: "Loss settles nicely, then explodes around step 350 of 1,500, long after warmup should have ended.",
  minutes: 15,
  kind: "schedule",
  lessons: ["l1.2.4", "l3.6.3", "l3.8.2", "e1.5.4"],
  bugLessons: ["l3.6.3"],
  testLessons: {
    "warmup rises linearly to the base rate": ["l3.6.3"],
    "the rate never goes above the base rate": ["l3.6.3"],
    "the rate decays to zero by the end": ["l3.6.3"],
    "training converges without diverging": ["l3.6.3", "l3.8.2"],
  },
  symptom: (
    <>
      <p>
        Linear regression with 20 features, trained by minibatch SGD for 1,500 steps under a schedule meant to be
        100 steps of linear warmup to 0.5, then cosine decay to zero. The same model trains happily at a constant 0.5.
      </p>
      <p>
        The loss drops to about 0.05 within a hundred steps and sits there. Then, around step 350, it shoots up by
        orders of magnitude and the script stops the run as diverged.
      </p>
    </>
  ),
  chart: {
    title: "Mean squared error, log scale",
    log: true,
    series: [{ label: "Training", call: "run()", key: "train" }],
  },
  program: String.raw`import numpy as np


def make_data(n=2000, d=20, seed=0):
    rng = np.random.default_rng(seed)
    X = rng.normal(size=(n, d))
    w_true = rng.normal(size=d)
    y = X @ w_true + 0.3 * rng.normal(size=n)
    return X, y


def lr_at(step, base_lr=0.5, warmup=100, total=1500):
    """Linear warmup to base_lr over warmup steps, then cosine decay to zero at total."""
    warm = (step + 1) / warmup
    progress = min(1.0, max(0.0, (step - warmup) / (total - warmup)))
    return base_lr * warm * 0.5 * (1 + np.cos(np.pi * progress))


def mse_and_grad(w, X, y):
    r = X @ w - y
    return float(0.5 * np.mean(r ** 2)), X.T @ r / len(y)


def run(total=1500, batch_size=64, log_every=50):
    X, y = make_data()
    rng = np.random.default_rng(1)
    w = np.zeros(X.shape[1])
    history = {"step": [], "train": [], "lr": []}
    for step in range(total):
        idx = rng.integers(0, len(y), size=batch_size)
        _, grad = mse_and_grad(w, X[idx], y[idx])
        lr = lr_at(step, total=total)
        if step % log_every == 0 or step == total - 1:
            loss = mse_and_grad(w, X, y)[0]
            history["step"].append(step)
            history["train"].append(loss)
            history["lr"].append(float(lr))
            if not loss < 1e6:
                break                        # diverged: stop rather than overflow
        w -= lr * grad
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, lr in zip(history["step"], history["train"], history["lr"]):
        print(f"step {s:5d}   loss {tr:12.4g}   lr {lr:.3f}")
`,
  fix: [[String.raw`    warm = (step + 1) / warmup`, String.raw`    warm = min(1.0, (step + 1) / warmup)`]],
  suspect: "lr_at",
  causes: [
    { text: "The warmup factor is never capped at one, so the learning rate keeps growing after warmup and passes the stable limit.", right: true },
    { text: "The cosine decay goes below zero halfway through, so the model starts climbing the loss." },
    { text: "Minibatches of 64 are too noisy for linear regression, and the noise accumulates until it diverges." },
    { text: "The gradient is not divided by the batch size, so every step is 64 times too large." },
  ],
  explanation: (
    <>
      <p>
        <C>lr_at</C> multiplies by <C>(step + 1) / warmup</C> at every step, not only during warmup. After step 100 the
        factor keeps rising: by step 350 it is 3.5, and even with cosine decay the rate is well above 1.6, where plain
        gradient descent on this problem stops being stable. The loss then grows geometrically.
      </p>
      <p>
        Cap the factor with <C>min(1.0, …)</C>. Logging the learning rate next to the loss is what makes this kind of
        bug a two-minute find: the <C>lr</C> column climbs past the base rate.
      </p>
    </>
  ),
  tests: [
    { name: "warmup rises linearly to the base rate", code: String.raw`assert abs(lr_at(49) - 0.25) < 1e-9 and abs(lr_at(99) - 0.5) < 1e-9, "halfway through warmup the rate should be half the base rate, and the full rate at its end"` },
    { name: "the rate never goes above the base rate", code: String.raw`assert max(lr_at(s) for s in range(1500)) <= 0.5 + 1e-9, "the schedule should never exceed base_lr"` },
    { name: "the rate decays to zero by the end", code: String.raw`_ref_rates = [lr_at(s) for s in range(100, 1500)]
assert all(b <= a + 1e-12 for a, b in zip(_ref_rates, _ref_rates[1:])), "after warmup the rate should only fall"
assert lr_at(1499) < 0.01, "the rate should reach about zero at the end"` },
    { name: "training converges without diverging", code: String.raw`_ref_h = run()
assert _ref_h["step"][-1] == 1499 and _ref_h["train"][-1] < 0.06, "the run should finish all its steps with a low loss"` },
  ],
};
