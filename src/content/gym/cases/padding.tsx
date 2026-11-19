import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const padding: GymCase = {
  id: "padding",
  title: "Training loss 0.55, real text 1.56",
  summary: "A bigram model's training loss looks excellent, but on real held-out text it is three times worse.",
  minutes: 20,
  kind: "masking",
  lessons: ["l3.3.2", "l5.4.1", "e1.5.4"],
  bugLessons: ["l5.4.1", "l3.3.2"],
  testLessons: {
    "padding targets do not count in the loss": ["l5.4.1", "l3.3.2"],
    "the gradient ignores padding targets": ["l5.4.1", "l3.3.2"],
    "the training loss agrees with the real-text loss": ["l5.4.1"],
  },
  symptom: (
    <>
      <p>
        A bigram language model (a table of next-token logits, one row per token) is trained on sentences of 4 to 12
        tokens, each padded with token 0 to a length of 24 so they fit one array. A second set of sentences is held out,
        and the script reports the loss on its real tokens alone.
      </p>
      <p>
        Training loss falls to 0.55. Held-out real-text loss stops at 1.56. The two sets come from the same source, and a
        bigram table this small cannot overfit 300 sentences, so the two numbers should be close.
      </p>
    </>
  ),
  chart: {
    title: "Next-token loss, nats per token",
    series: [
      { label: "Training, as logged", call: "run()", key: "train" },
      { label: "Held-out real text", call: "run()", key: "real_text" },
    ],
  },
  program: String.raw`import numpy as np

PAD = 0    # token 0 is padding; real tokens are 1 to V - 1
V = 9
T = 24     # every row is padded to this length


def make_batch(n=300, seed=0):
    """Sentences of 4 to 12 real tokens from a random next-token table, padded with PAD to length T."""
    rng = np.random.default_rng(seed)
    P = np.random.default_rng(7).dirichlet(np.full(V - 1, 0.4), size=V - 1)
    rows = np.full((n, T), PAD)
    for r in range(n):
        length = rng.integers(4, 13)
        tok = rng.integers(1, V)
        for t in range(length):
            rows[r, t] = tok
            tok = 1 + min(V - 2, int((P[tok - 1].cumsum() < rng.uniform()).sum()))
    return rows, P


def log_softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    return z - np.log(np.exp(z).sum(axis=-1, keepdims=True))


def sequence_loss(W, inputs, targets):
    """Mean next-token loss of a bigram model with logits W[token], and its gradient with respect to W."""
    logp = log_softmax(W[inputs])                                          # (n, T-1, V)
    nll = -np.take_along_axis(logp, targets[..., None], axis=-1)[..., 0]   # (n, T-1)
    d = np.exp(logp)
    np.put_along_axis(d, targets[..., None], np.take_along_axis(d, targets[..., None], axis=-1) - 1, axis=-1)
    d /= nll.size
    grad = np.eye(V)[inputs].reshape(-1, V).T @ d.reshape(-1, V)
    return float(nll.mean()), grad


def real_text_loss(W, rows):
    """Loss on the real tokens alone: every prediction whose target is not padding."""
    inputs, targets = rows[:, :-1], rows[:, 1:]
    logp = log_softmax(W[inputs])
    keep = targets != PAD
    return float(-np.take_along_axis(logp, targets[..., None], axis=-1)[..., 0][keep].mean())


def run(steps=150, lr=5.0, log_every=10):
    rows, _ = make_batch()
    held_out, _ = make_batch(seed=1)
    W = np.zeros((V, V))
    history = {"step": [], "train": [], "real_text": []}
    for step in range(steps + 1):
        loss, grad = sequence_loss(W, rows[:, :-1], rows[:, 1:])
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(loss)
            history["real_text"].append(real_text_loss(W, held_out))
        W -= lr * grad
    return history


if __name__ == "__main__":
    history = run()
    for s, tr, real in zip(history["step"], history["train"], history["real_text"]):
        print(f"step {s:4d}   training loss {tr:.3f}   held-out real text {real:.3f}")
`,
  fix: [
    [String.raw`    d /= nll.size`, String.raw`    keep = targets != PAD
    d *= keep[..., None]
    d /= keep.sum()`],
    [String.raw`    return float(nll.mean()), grad`, String.raw`    return float(nll[keep].mean()), grad`],
  ],
  suspect: "sequence_loss",
  causes: [
    { text: "The loss averages over padding positions too, and predicting padding after padding is trivial, so most of the logged loss is free.", right: true },
    { text: "The held-out sentences are drawn from a different next-token table, so their loss is higher." },
    { text: "The bigram model has too few parameters to fit the real text, and the training loss is computed on easier sentences." },
    { text: "The learning rate of 5 overshoots on the real tokens but not on the frequent ones." },
  ],
  explanation: (
    <>
      <p>
        <C>sequence_loss</C> takes the mean over all 23 positions of every row, but a typical sentence has only 8 real
        targets. The other positions ask the model to predict padding after padding, which it learns almost perfectly,
        so they pull the mean down. Worse, the gradient spends most of its weight on them, and the model learns that
        padding follows every token, which costs it on real text.
      </p>
      <p>
        Mask the loss and its gradient with <C>targets != PAD</C>, and average over the real targets only. The training
        loss then reads about 1.40 and the real-text loss about 1.43: the same number, measured honestly.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np
def _ref_loss(W, inputs, targets):
    z = W[inputs] - W[inputs].max(axis=-1, keepdims=True)
    logp = z - _ref_np.log(_ref_np.exp(z).sum(axis=-1, keepdims=True))
    keep = targets != 0
    nll = -_ref_np.take_along_axis(logp, targets[..., None], axis=-1)[..., 0]
    d = _ref_np.exp(logp)
    d[..., :] -= _ref_np.eye(W.shape[0])[targets]
    d *= keep[..., None] / keep.sum()
    g = _ref_np.eye(W.shape[0])[inputs].reshape(-1, W.shape[0]).T @ d.reshape(-1, W.shape[0])
    return float(nll[keep].mean()), g
_ref_rng = _ref_np.random.default_rng(5)
_ref_W = _ref_rng.normal(size=(9, 9))
_ref_rows = _ref_np.array([[3, 4, 5, 0, 0, 0], [1, 2, 3, 4, 5, 6], [7, 8, 0, 0, 0, 0]])`,
  tests: [
    { name: "padding targets do not count in the loss", code: String.raw`_ref_got = sequence_loss(_ref_W, _ref_rows[:, :-1], _ref_rows[:, 1:])[0]
_ref_want = _ref_loss(_ref_W, _ref_rows[:, :-1], _ref_rows[:, 1:])[0]
assert abs(_ref_got - _ref_want) < 1e-9, "the loss should be the mean over targets that are real tokens"` },
    { name: "the gradient ignores padding targets", code: String.raw`_ref_got = sequence_loss(_ref_W, _ref_rows[:, :-1], _ref_rows[:, 1:])[1]
_ref_want = _ref_loss(_ref_W, _ref_rows[:, :-1], _ref_rows[:, 1:])[1]
assert _ref_np.allclose(_ref_got, _ref_want), "the gradient should come from real targets only, averaged over them"` },
    { name: "the training loss agrees with the real-text loss", code: String.raw`_ref_h = run()
assert abs(_ref_h["train"][-1] - _ref_h["real_text"][-1]) < 0.1, "training and held-out real-text loss should end close together"` },
  ],
};
