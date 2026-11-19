import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const targetLeak: GymCase = {
  id: "target-leak",
  title: "Great on validation, poor next month",
  summary: "A churn model's validation loss keeps falling to 0.37, but the same model scores 0.67 on next month's customers.",
  minutes: 20,
  kind: "leakage",
  lessons: ["l1.1.4", "l1.2.4", "l1.3.1", "l1.7.1", "l1.7.2", "e1.5.4"],
  bugLessons: ["l1.7.2", "l1.7.1"],
  testLessons: {
    "the city rates use training labels only": ["l1.7.2", "l1.7.1"],
    "the split itself is unchanged": ["l1.1.4"],
    "validation predicts next month honestly": ["l1.7.2"],
  },
  symptom: (
    <>
      <p>
        A logistic regression predicts which customers leave, from three numeric features and the customer&apos;s city
        (one of 400). Cities are encoded by the share of customers in that city who left, smoothed towards one half.
        A quarter of the customers are held out for validation.
      </p>
      <p>
        Validation loss falls steadily to 0.37, right alongside training loss. Then the model is scored on next
        month&apos;s customers, encoded with the same city rates, and it gets 0.67: barely better than knowing nothing
        about cities. Nothing about the customers changed between the months.
      </p>
    </>
  ),
  chart: {
    title: "Log loss as the script logs it",
    series: [
      { label: "Training", call: "run()", key: "train" },
      { label: "Validation", call: "run()", key: "val" },
    ],
    floor: { label: "Next month", call: "run()", key: "next_month" },
  },
  program: String.raw`import numpy as np


def make_customers(n, seed):
    """n customers: three numeric features, a city (one of 400) and whether they left."""
    rng = np.random.default_rng(seed)
    city_effect = np.random.default_rng(42).normal(scale=0.5, size=400)
    x = rng.normal(size=(n, 3))
    city = rng.integers(0, 400, size=n)
    logit = x @ np.array([1.0, -0.6, 0.4]) + city_effect[city]
    left = (rng.uniform(size=n) < 1 / (1 + np.exp(-logit))).astype(float)
    return x, city, left


def city_rates(city, left, n_cities=400, prior=0.5, strength=1.0):
    """The smoothed share of customers who left, per city."""
    counts = np.bincount(city, minlength=n_cities)
    lefts = np.bincount(city, weights=left, minlength=n_cities)
    return (lefts + strength * prior) / (counts + strength)


def features(x, city, rates):
    return np.column_stack([x, rates[city], np.ones(len(x))])


def prepare(x, city, left, val_fraction=0.25, seed=0):
    rng = np.random.default_rng(seed)
    order = rng.permutation(len(left))
    n_val = int(len(left) * val_fraction)
    val_idx, train_idx = order[:n_val], order[n_val:]
    rates = city_rates(city, left)
    return {
        "train_idx": train_idx, "val_idx": val_idx, "rates": rates,
        "F_train": features(x[train_idx], city[train_idx], rates), "y_train": left[train_idx],
        "F_val": features(x[val_idx], city[val_idx], rates), "y_val": left[val_idx],
    }


def log_loss(w, F, y):
    z = F @ w
    return float(np.mean(np.logaddexp(0, z) - y * z))


def run(steps=300, lr=0.5, log_every=15):
    x, city, left = make_customers(600, seed=0)
    data = prepare(x, city, left)
    x_next, city_next, left_next = make_customers(600, seed=1)       # next month's customers
    F_next = features(x_next, city_next, data["rates"])
    w = np.zeros(data["F_train"].shape[1])
    history = {"step": [], "train": [], "val": []}
    for step in range(steps + 1):
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(log_loss(w, data["F_train"], data["y_train"]))
            history["val"].append(log_loss(w, data["F_val"], data["y_val"]))
        p = 1 / (1 + np.exp(-(data["F_train"] @ w)))
        w -= lr * data["F_train"].T @ (p - data["y_train"]) / len(p)
    history["next_month"] = log_loss(w, F_next, left_next)
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, va in zip(history["step"], history["train"], history["val"]):
        print(f"step {s:4d}   train {tr:.3f}   val {va:.3f}")
    print(f"next month's customers: {history['next_month']:.3f}")
`,
  fix: [[String.raw`    rates = city_rates(city, left)`, String.raw`    rates = city_rates(city[train_idx], left[train_idx])`]],
  suspect: "prepare",
  causes: [
    { text: "The city rates are computed from every customer's label, validation customers included, so each validation row's feature contains its own answer.", right: true },
    { text: "The smoothing towards one half is too weak, so rare cities get extreme rates that overfit." },
    { text: "Next month's customers come from a different distribution, so no model could do better on them." },
    { text: "The bias column of ones makes the model overconfident on the training months." },
  ],
  explanation: (
    <>
      <p>
        <C>prepare</C> computes <C>city_rates</C> from all 600 labels before splitting. With 400 cities and 600
        customers, most cities hold one or two people, so a validation customer&apos;s city rate is mostly that
        customer&apos;s own label. That is target leakage: validation can read the answer off a feature. Next month&apos;s
        customers are not in the rates, so the feature carries far less, and the loss shows it.
      </p>
      <p>
        Compute the rates from the training rows only. Validation then climbs to about 0.67 and agrees with next month,
        which is the honest number. Training loss still falls, because training rows still see their own labels; out-of-fold
        encoding would fix that too.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: [
    { name: "the city rates use training labels only", code: String.raw`_ref_x, _ref_c, _ref_l = make_customers(600, seed=0)
_ref_a = prepare(_ref_x, _ref_c, _ref_l)
_ref_l2 = _ref_l.copy()
_ref_l2[_ref_a["val_idx"]] = 1 - _ref_l2[_ref_a["val_idx"]]
_ref_b = prepare(_ref_x, _ref_c, _ref_l2)
assert _ref_np.allclose(_ref_a["F_val"], _ref_b["F_val"]), "changing only the validation labels changed the validation features"
assert _ref_np.allclose(_ref_a["F_train"], _ref_b["F_train"]), "changing only the validation labels changed the training features"` },
    { name: "the split itself is unchanged", code: String.raw`_ref_x, _ref_c, _ref_l = make_customers(600, seed=0)
_ref_a = prepare(_ref_x, _ref_c, _ref_l)
_ref_all = _ref_np.sort(_ref_np.concatenate([_ref_a["train_idx"], _ref_a["val_idx"]]))
assert len(_ref_a["val_idx"]) == 150 and (_ref_all == _ref_np.arange(600)).all(), "keep the same random split of customers"` },
    { name: "validation predicts next month honestly", code: String.raw`_ref_h = run()
assert abs(_ref_h["val"][-1] - _ref_h["next_month"]) < 0.08, "validation loss should now agree with the loss on next month's customers"` },
  ],
};
