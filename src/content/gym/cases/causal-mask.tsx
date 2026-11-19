import { C } from "@/components/lesson/Code";
import type { GymCase } from "../types";

export const causalMask: GymCase = {
  id: "causal-mask",
  title: "The language model that beats the entropy of its data",
  summary: "Next-token loss falls to 0.33 on text whose own entropy is 1.41 nats per token.",
  minutes: 20,
  kind: "masking",
  lessons: ["l3.3.2", "l5.2.2", "e1.5.4"],
  bugLessons: ["l5.2.2"],
  testLessons: {
    "no position may look at a later one": ["l5.2.2"],
    "a position's summary ignores later tokens": ["l5.2.2"],
    "the loss stays above the entropy of the data": ["l5.2.2", "l3.3.2"],
  },
  symptom: (
    <>
      <p>
        The training text is sampled from a random next-token table over 8 symbols, so the best any model can do is the
        table&apos;s own uncertainty: 1.41 nats per token, which the script prints. The model is tiny: each position
        averages the one-hot vectors of the tokens it may see, weighted towards the most recent, and a linear layer turns
        that summary into next-token logits.
      </p>
      <p>
        Within 300 steps the training loss is 0.33, far below 1.41. No model can predict a random source better than its
        own entropy, so something is handing it the answer.
      </p>
    </>
  ),
  chart: {
    title: "Next-token loss, nats per token",
    series: [{ label: "Training", call: "run()", key: "train" }],
    floor: { label: "Entropy of the data", call: "run()", key: "floor" },
  },
  program: String.raw`import numpy as np

V = 8      # vocabulary size
T = 16     # tokens per training sequence


def make_chain(seed=0):
    """A random next-token table: row a is the distribution of the token after a."""
    rng = np.random.default_rng(seed)
    P = rng.dirichlet(np.full(V, 0.3), size=V)
    return P


def sample(P, n, length, seed=1):
    rng = np.random.default_rng(seed)
    x = np.zeros((n, length), dtype=int)
    x[:, 0] = rng.integers(0, V, size=n)
    for t in range(1, length):
        u = rng.uniform(size=(n, 1))
        x[:, t] = (P[x[:, t - 1]].cumsum(axis=1) < u).sum(axis=1).clip(max=V - 1)
    return x


def entropy_floor(P, x):
    """The best average loss any model can reach: the chain's own uncertainty about the next token."""
    return float(-np.mean(np.log(P[x[:, :-1], x[:, 1:]])))


def causal_mask(T):
    """mask[i, j] is True when position i may look at position j."""
    return np.tril(np.ones((T, T), dtype=bool), k=1)


def softmax(z, axis=-1):
    z = z - z.max(axis=axis, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=axis, keepdims=True)


def mix_context(tokens, decay=1.0):
    """Each position's summary of the tokens it may see: an attention-weighted average of one-hot vectors,
    weighted towards the most recent ones."""
    n = tokens.shape[1]
    pos = np.arange(n)
    scores = -decay * (pos[:, None] - pos[None, :]).astype(float)     # recent tokens score higher
    scores = np.where(causal_mask(n), scores, -np.inf)
    weights = softmax(scores, axis=-1)                    # (n, n)
    return weights @ np.eye(V)[tokens]                    # (batch, n, V)


def run(steps=300, lr=2.0, log_every=15):
    P = make_chain()
    x = sample(P, 256, T + 1)
    inputs, targets = x[:, :-1], x[:, 1:]
    H = mix_context(inputs).reshape(-1, V)
    y = targets.reshape(-1)
    W = np.zeros((V, V))
    history = {"step": [], "train": [], "floor": entropy_floor(P, x)}
    for step in range(steps + 1):
        logp = np.log(softmax(H @ W))
        if step % log_every == 0:
            history["step"].append(step)
            history["train"].append(float(-logp[np.arange(len(y)), y].mean()))
        d = np.exp(logp)
        d[np.arange(len(y)), y] -= 1
        W -= lr * H.T @ d / len(y)
    return history


if __name__ == "__main__":
    history = run()
    for s, tr in zip(history["step"], history["train"]):
        print(f"step {s:4d}   loss {tr:.3f}")
    print(f"the chain's own entropy, the lowest loss possible: {history['floor']:.3f}")
`,
  fix: [[String.raw`    return np.tril(np.ones((T, T), dtype=bool), k=1)`, String.raw`    return np.tril(np.ones((T, T), dtype=bool))`]],
  suspect: "causal_mask",
  causes: [
    { text: "The causal mask keeps one diagonal above the main one, so each position can see the token it is meant to predict.", right: true },
    { text: "The recency weighting makes the newest token dominate, which is enough to beat the entropy of a next-token table." },
    { text: "The entropy floor is computed on the inputs, not the targets, so it is too high." },
    { text: "The learning rate of 2 is too high and the loss is being driven below its true value." },
  ],
  explanation: (
    <>
      <p>
        <C>np.tril(…, k=1)</C> keeps the main diagonal and the one above it, so position <C>i</C> may look at position{" "}
        <C>i + 1</C>. With <C>inputs = x[:, :-1]</C> and <C>targets = x[:, 1:]</C>, input <C>i + 1</C> is target{" "}
        <C>i</C>: the model sees the answer. The recency weights even favour it, since the future position scores
        highest.
      </p>
      <p>
        Drop the <C>k=1</C>. The loss then settles just above the entropy of the data, as it must. A loss below the
        entropy of the source is the signature of a mask that leaks the future.
      </p>
    </>
  ),
  prelude: String.raw`import numpy as _ref_np`,
  tests: [
    { name: "no position may look at a later one", code: String.raw`_ref_m = _ref_np.asarray(causal_mask(6), dtype=bool)
assert _ref_m.shape == (6, 6), "the mask should be T by T"
assert (_ref_m == _ref_np.tril(_ref_np.ones((6, 6), dtype=bool))).all(), "position i should see positions 0 to i and nothing later"` },
    { name: "a position's summary ignores later tokens", code: String.raw`_ref_a = _ref_np.array([[1, 2, 3, 4, 5, 6, 7, 0]])
_ref_b = _ref_a.copy()
_ref_b[0, 5:] = [0, 1, 2]
assert _ref_np.allclose(mix_context(_ref_a)[0, :5], mix_context(_ref_b)[0, :5]), "changing later tokens changed an earlier position's summary"` },
    { name: "the loss stays above the entropy of the data", code: String.raw`_ref_h = run()
assert min(_ref_h["train"]) >= _ref_h["floor"] - 0.02, "the loss falls below what any honest model can reach"` },
  ],
};
