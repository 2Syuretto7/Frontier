import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const byteImages: GymCase = {
  id: "byte-images",
  title: "The linear classifier that cannot learn four templates",
  summary: "Loss jumps to 3.8 after the first steps, then stalls at 0.55 on images a linear model should separate.",
  minutes: 15,
  kind: "dtype",
  lessons: ["e1.5.1", "e3.1.1", "l3.3.2", "e1.5.4"],
  bugLessons: ["e1.5.1", "e3.1.1"],
  testLessons: {
    "bytes map evenly onto [-1, 1)": ["e1.5.1", "e3.1.1"],
    "normalise returns floating-point values": ["e1.5.1"],
    "a linear model fits the images": ["e1.5.1", "l3.3.2"],
  },
  symptom: (
    <>
      <p>
        Greyscale images of 8 by 8 pixels, stored as bytes from 0 to 255, in four classes. Each class is a fixed template
        plus noise, so softmax regression on the pixels should separate them well. The script centres and scales the
        bytes, then trains for 300 steps.
      </p>
      <p>
        The loss jumps from 1.39 to 3.8 in the first logged interval, wanders, and stalls at 0.55 on training and 0.75 on
        validation. Nothing about the model or the learning rate is unusual.
      </p>
    </>
  ),
  chart: {
    title: "Cross-entropy",
    series: [
      { label: "Training", call: "run()", key: "train" },
      { label: "Validation", call: "run()", key: "val" },
    ],
  },
  program: String.raw`import numpy as np


def make_images(n=1200, seed=0):
    """8 by 8 greyscale images stored as bytes (0 to 255), as a camera would save them, in four classes."""
    rng = np.random.default_rng(seed)
    templates = np.random.default_rng(3).uniform(100, 156, size=(4, 64))
    y = rng.integers(0, 4, size=n)
    pixels = templates[y] + rng.normal(scale=40, size=(n, 64))
    return np.clip(np.round(pixels), 0, 255).astype(np.uint8), y


def normalise(images):
    """Centre the bytes on zero and scale them to roughly [-1, 1)."""
    return (images - 128) / 128


def loss_and_grad(W, X, y):
    logits = X @ W
    z = logits - logits.max(axis=1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(axis=1, keepdims=True))
    n = len(y)
    d = np.exp(logp)
    d[np.arange(n), y] -= 1
    return float(-logp[np.arange(n), y].mean()), X.T @ d / n


def run(steps=300, lr=0.5, log_every=15):
    images, y = make_images()
    X = normalise(images)
    X_train, y_train, X_val, y_val = X[:900], y[:900], X[900:], y[900:]
    W = np.zeros((64, 4))
    history = {"step": [], "train": [], "val": []}
    for step in range(steps + 1):
        loss, grad = loss_and_grad(W, X_train, y_train)
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(loss)
            history["val"].append(loss_and_grad(W, X_val, y_val)[0])
        W -= lr * grad
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, va in zip(history["step"], history["train"], history["val"]):
        print(f"step {s:4d}   train {tr:.3f}   val {va:.3f}")
`,
  fix: [[String.raw`    return (images - 128) / 128`, String.raw`    return (images.astype(np.float64) - 128) / 128`]],
  suspect: "normalise",
  causes: [
    { text: "Subtracting 128 from bytes stays in uint8 and wraps around, so dark pixels become bright ones and the inputs are scrambled.", right: true },
    { text: "Dividing by 128 rather than 255 leaves the inputs too large, so the first steps overshoot." },
    { text: "Four classes are too few for softmax regression to be stable without a bias term." },
    { text: "The validation split takes the last 300 images, which are sorted by class." },
  ],
  explanation: (
    <>
      <p>
        <C>images</C> is <C>uint8</C>, and <C>images - 128</C> stays <C>uint8</C>, so a pixel of 100 becomes 228 rather
        than -28. After dividing by 128 every input lies in [0, 2), and pixels just below 128 land at the top of the range
        while pixels just above land at the bottom. The order of brightness is folded at 128, so the templates no longer
        differ linearly, and the all-positive inputs make the first steps overshoot.
      </p>
      <p>
        Convert to floating point before subtracting. Printing <C>X.min()</C> and <C>X.max()</C> after normalising would
        have shown [0, 2) instead of [-1, 1).
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: [
    { name: "bytes map evenly onto [-1, 1)", code: String.raw`_ref_b = _ref_np.array([[0, 64, 127, 128, 200, 255]], dtype=_ref_np.uint8)
assert _ref_np.allclose(normalise(_ref_b), (_ref_b.astype(float) - 128) / 128), "0 should map to -1, 128 to 0 and 255 to just under 1"` },
    { name: "normalise returns floating-point values", code: String.raw`assert _ref_np.asarray(normalise(_ref_np.array([[5, 250]], dtype=_ref_np.uint8))).dtype.kind == "f", "the result should be floating point"` },
    { name: "a linear model fits the images", code: String.raw`assert run()["val"][-1] < 0.2, "softmax regression should separate four templates well"` },
  ],
};
