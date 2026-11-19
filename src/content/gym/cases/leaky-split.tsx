import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const leakySplit: GymCase = {
  id: "leaky-split",
  title: "The validation loss that never turns up",
  summary: "200 features, 80 examples and noisy labels, yet validation loss falls to almost nothing alongside training loss.",
  minutes: 20,
  kind: "leakage",
  lessons: ["l1.1.3", "l1.1.4", "l1.2.4", "l1.3.1", "l1.7.2", "e1.5.4"],
  bugLessons: ["l1.7.2", "l1.1.4"],
  testLessons: {
    "no recorded example lands on both sides of the split": ["l1.7.2"],
    "every row is used exactly once": ["l1.1.4", "e1.5.4"],
    "about a quarter of the recorded examples go to validation": ["l1.1.4"],
    "validation shows the overfitting a model this size must have": ["l1.1.3", "l1.7.2"],
  },
  symptom: (
    <>
      <p>
        A colleague trained logistic regression on 80 recorded examples with 200 features each, where the label depends on
        one feature plus noise. To get more data, each recorded example was augmented into four slightly jittered copies,
        and a quarter of the rows were held out for validation.
      </p>
      <p>
        With far more features than examples, the model can memorise its training set, and the labels are noisy, so it
        should overfit. Instead validation loss falls almost to zero, step for step with training loss. The colleague
        is delighted. You are not.
      </p>
    </>
  ),
  chart: {
    title: "Log loss as the script logs it",
    series: [
      { label: "Training", call: "run()", key: "train" },
      { label: "Validation", call: "run()", key: "val" },
    ],
  },
  program: String.raw`import numpy as np


def make_data(n_sources=80, n_features=200, copies=4, seed=0):
    """Each recorded example is augmented into several slightly jittered copies."""
    rng = np.random.default_rng(seed)
    base = rng.normal(size=(n_sources, n_features))
    labels = (base[:, 0] + rng.normal(size=n_sources) > 0).astype(float)
    X = np.repeat(base, copies, axis=0) + 0.05 * rng.normal(size=(n_sources * copies, n_features))
    y = np.repeat(labels, copies)
    source = np.repeat(np.arange(n_sources), copies)   # which recorded example each row came from
    return X, y, source


def split(X, y, source, val_fraction=0.25, seed=0):
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(y))
    n_val = int(len(y) * val_fraction)
    val, train = order[:n_val], order[n_val:]
    return X[train], y[train], X[val], y[val]


def log_loss(w, X, y):
    z = X @ w
    return float(np.mean(np.logaddexp(0, z) - y * z))


def gradient(w, X, y):
    p = 1 / (1 + np.exp(-(X @ w)))
    return X.T @ (p - y) / len(y)


def run(steps=400, lr=0.5, log_every=20):
    X, y, source = make_data()
    X_train, y_train, X_val, y_val = split(X, y, source)
    w = np.zeros(X.shape[1])
    history = {"step": [], "train": [], "val": []}
    for step in range(steps + 1):
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(log_loss(w, X_train, y_train))
            history["val"].append(log_loss(w, X_val, y_val))
        w -= lr * gradient(w, X_train, y_train)
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, va in zip(history["step"], history["train"], history["val"]):
        print(f"step {s:4d}   train {tr:.3f}   val {va:.3f}")
`,
  fix: [[String.raw`    order = rng.permutation(len(y))
    n_val = int(len(y) * val_fraction)
    val, train = order[:n_val], order[n_val:]`, String.raw`    groups = rng.permutation(np.unique(source))
    n_val = int(len(groups) * val_fraction)
    in_val = np.isin(source, groups[:n_val])
    val, train = np.flatnonzero(in_val), np.flatnonzero(~in_val)`]],
  suspect: "split",
  causes: [
    { text: "The split shuffles rows, so jittered copies of one recorded example land in both training and validation.", right: true },
    { text: "The learning rate is so high that both losses are driven down together before the model can overfit." },
    { text: "The log loss is computed on probabilities rather than logits, so it is too small on both sets." },
    { text: "The validation rows are taken from the same random permutation as training, but in reverse order." },
  ],
  explanation: (
    <>
      <p>
        <C>split</C> shuffles the 320 augmented rows, not the 80 recorded examples. Almost every validation row has a
        near-identical copy, jittered by a few hundredths, in the training set, so validation measures memorisation, not
        generalisation. Split by <C>source</C> instead, so that all copies of one example sit on one side.
      </p>
      <p>
        Fixed, the curve tells the truth: training loss still falls to zero, and validation loss climbs past two, which
        is what 200 features and 60 training examples must do. The repair to the model is regularisation or more
        examples; the repair to the measurement was the split.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np
_ref_src = _ref_np.repeat(_ref_np.arange(40), 4)
_ref_X = _ref_np.column_stack([_ref_src, _ref_np.arange(160)]).astype(float)
_ref_y = _ref_np.zeros(160)`,
  tests: [
    { name: "no recorded example lands on both sides of the split", code: String.raw`_ref_out = split(_ref_X, _ref_y, _ref_src)
assert not set(_ref_out[0][:, 0]) & set(_ref_out[2][:, 0]), "copies of one recorded example ended up in both training and validation"` },
    { name: "every row is used exactly once", code: String.raw`_ref_out = split(_ref_X, _ref_y, _ref_src)
_ref_rows = _ref_np.sort(_ref_np.concatenate([_ref_out[0][:, 1], _ref_out[2][:, 1]]))
assert len(_ref_rows) == 160 and (_ref_rows == _ref_np.arange(160)).all(), "some rows are missing or used twice"` },
    { name: "about a quarter of the recorded examples go to validation", code: String.raw`_ref_out = split(_ref_X, _ref_y, _ref_src)
assert 30 <= len(_ref_out[2]) <= 50, "validation should hold about a quarter of the rows"` },
    { name: "validation shows the overfitting a model this size must have", code: String.raw`_ref_h = run()
assert _ref_h["train"][-1] < 0.1, "training loss should still fall close to zero"
assert _ref_h["val"][-1] > 1.0, "validation loss should climb as the model memorises its training set"` },
  ],
};
