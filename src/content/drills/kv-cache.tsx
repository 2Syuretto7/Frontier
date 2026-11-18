import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

const SETUP = `import numpy as np


def norm(x):
    return (x - x.mean(axis=-1, keepdims=True)) / np.sqrt(x.var(axis=-1, keepdims=True) + 1e-5)


class TinyLM:
    """A small decoder-only transformer with single-head attention and fixed random weights."""

    def __init__(self, vocab=20, d=16, n_layers=2, max_len=64, seed=0):
        rng = np.random.default_rng(seed)
        s = d ** -0.5
        self.vocab, self.d, self.n_layers, self.max_len = vocab, d, n_layers, max_len
        self.tok = rng.normal(size=(vocab, d))
        self.pos = rng.normal(size=(max_len, d)) * 0.5
        self.layers = [
            {name: rng.normal(size=shape) * s for name, shape in
             [("wq", (d, d)), ("wk", (d, d)), ("wv", (d, d)), ("wo", (d, d)), ("w1", (d, 4 * d)), ("w2", (4 * d, d))]}
            for _ in range(n_layers)
        ]
        self.out = rng.normal(size=(d, vocab)) * s * 4
        self.qkv_rows = 0  # how many positions have been projected to q, k, v so far

    def embed(self, tokens, start):
        """Embeddings of tokens placed at positions start, start + 1, ...: shape (T, d)."""
        tokens = np.asarray(tokens)
        return self.tok[tokens] + self.pos[start:start + len(tokens)]

    def qkv(self, layer, x):
        """Projects x (T, d) to q, k, v, each (T, d)."""
        self.qkv_rows += len(x)
        w = self.layers[layer]
        h = norm(x)
        return h @ w["wq"], h @ w["wk"], h @ w["wv"]

    def finish_layer(self, layer, x, attended):
        """Given the residual stream x (T, d) and the attention output (T, d), returns the layer's output."""
        w = self.layers[layer]
        x = x + attended @ w["wo"]
        return x + np.maximum(norm(x) @ w["w1"], 0) @ w["w2"]

    def logits(self, x):
        return norm(x) @ self.out


def full_forward(model, tokens):
    """Logits (T, vocab) at every position, recomputing everything from scratch."""
    x = model.embed(tokens, 0)
    T = len(tokens)
    mask = np.tril(np.ones((T, T), dtype=bool))
    for layer in range(model.n_layers):
        q, k, v = model.qkv(layer, x)
        scores = np.where(mask, q @ k.T / np.sqrt(model.d), -np.inf)
        weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
        weights /= weights.sum(axis=-1, keepdims=True)
        x = model.finish_layer(layer, x, weights @ v)
    return model.logits(x)
`;

export const kvCache: Drill = {
  id: "kv-cache",
  title: "KV-cache inference",
  summary: "Add a key-value cache to a small transformer so each new token costs one position's work.",
  minutes: 25,
  skills: ["Inference", "Transformers", "Performance"],
  lessons: ["l4.4.3", "l4.4.4", "l5.3.4"],
  testLessons: {
    "a decode step projects only the new position": ["l5.3.4"],
    "generate does linear work": ["l5.3.4"],
    "the cache holds one (K, V) pair per layer, (T, d) each": ["l5.3.4"],
    "prefill matches the full forward pass": ["l4.4.3"],
    "each decode step matches the full forward pass": ["l4.4.3", "l5.3.4"],
    "generate matches greedy decoding without a cache": ["l5.3.4"],
  },
  setup: SETUP,
  brief: (
    <>
      <p>
        This code is already loaded before your program runs. <C>full_forward</C> recomputes every position for every
        new token. Make generation incremental with a key-value cache.
      </p>
      <Code>{SETUP}</Code>
      <ol>
        <li>
          <C>prefill(model, tokens)</C> runs the prompt once and returns <C>(logits, cache)</C>: <C>logits</C> of
          shape <C>(T, vocab)</C> equal to <C>full_forward(model, tokens)</C>, and <C>cache</C>, a list with one{" "}
          <C>(K, V)</C> tuple per layer, each of shape <C>(T, d)</C>.
        </li>
        <li>
          <C>decode_step(model, token, cache)</C> appends one token at the next position and returns{" "}
          <C>(logits, cache)</C>: <C>logits</C> of shape <C>(vocab,)</C> for the new position, and the cache grown
          to <C>T + 1</C> rows per layer. It may call <C>model.qkv</C> only on the new position, once per layer.
        </li>
        <li>
          <C>generate(model, prompt, n_new)</C> returns the list of <C>n_new</C> greedily chosen tokens (argmax),
          using <C>prefill</C> and <C>decode_step</C>.
        </li>
      </ol>
      <p>Use <C>model.embed</C>, <C>model.qkv</C>, <C>model.finish_layer</C> and <C>model.logits</C>. The hidden tests compare against <C>full_forward</C> at every step, check the cache&apos;s shapes, and count the rows passed to <C>model.qkv</C>.</p>
    </>
  ),
  starter: `def prefill(model, tokens):
    raise NotImplementedError


def decode_step(model, token, cache):
    raise NotImplementedError


def generate(model, prompt, n_new):
    raise NotImplementedError


if __name__ == "__main__":
    model = TinyLM()
    print(generate(model, [1, 2, 3], 5))
    print(full_forward(model, [1, 2, 3]).shape)
`,
  solution: `import numpy as np


def attend(q, k, v, causal):
    scores = q @ k.T / np.sqrt(q.shape[-1])
    if causal:
        T = len(q)
        scores = np.where(np.tril(np.ones((T, T), dtype=bool)), scores, -np.inf)
    weights = np.exp(scores - scores.max(axis=-1, keepdims=True))
    weights /= weights.sum(axis=-1, keepdims=True)
    return weights @ v


def prefill(model, tokens):
    x = model.embed(tokens, 0)
    cache = []
    for layer in range(model.n_layers):
        q, k, v = model.qkv(layer, x)
        cache.append((k, v))
        x = model.finish_layer(layer, x, attend(q, k, v, causal=True))
    return model.logits(x), cache


def decode_step(model, token, cache):
    position = len(cache[0][0])
    x = model.embed([token], position)
    new_cache = []
    for layer in range(model.n_layers):
        q, k, v = model.qkv(layer, x)
        K = np.concatenate([cache[layer][0], k])
        V = np.concatenate([cache[layer][1], v])
        new_cache.append((K, V))
        x = model.finish_layer(layer, x, attend(q, K, V, causal=False))
    return model.logits(x)[0], new_cache


def generate(model, prompt, n_new):
    logits, cache = prefill(model, prompt)
    token = int(np.argmax(logits[-1]))
    out = [token]
    while len(out) < n_new:
        step_logits, cache = decode_step(model, token, cache)
        token = int(np.argmax(step_logits))
        out.append(token)
    return out
`,
  prelude: `import numpy as _ref_np


def _ref_greedy(model, prompt, n):
    toks = list(prompt)
    for _ in range(n):
        toks.append(int(_ref_np.argmax(full_forward(model, toks)[-1])))
    return toks[len(prompt):]
`,
  tests: [
    {
      name: "prefill matches the full forward pass",
      code: `m = TinyLM(seed=1)
prompt = [3, 1, 4, 1, 5, 9, 2]
logits, cache = prefill(m, prompt)
want = full_forward(m, prompt)
assert _ref_np.shape(logits) == want.shape, f"prefill logits should have shape {want.shape}, got {_ref_np.shape(logits)}"
assert _ref_np.allclose(logits, want), "prefill logits differ from full_forward: is the attention causal?"`,
    },
    {
      name: "the cache holds one (K, V) pair per layer, (T, d) each",
      code: `m = TinyLM(seed=2, n_layers=3)
_, cache = prefill(m, [1, 2, 3, 4, 5])
assert len(cache) == 3, f"one cache entry per layer: expected 3, got {len(cache)}"
for i, (K, V) in enumerate(cache):
    assert _ref_np.shape(K) == (5, 16) and _ref_np.shape(V) == (5, 16), f"layer {i}: K and V should each be (5, 16) after a 5-token prompt"`,
    },
    {
      name: "each decode step matches the full forward pass",
      code: `m = TinyLM(seed=3)
toks = [7, 7, 2]
_, cache = prefill(m, toks)
for t in [5, 0, 19, 5, 11, 3]:
    logits, cache = decode_step(m, t, cache)
    toks.append(t)
    want = full_forward(m, toks)[-1]
    assert _ref_np.shape(logits) == (m.vocab,), f"decode_step logits should have shape ({m.vocab},), got {_ref_np.shape(logits)}"
    assert _ref_np.allclose(logits, want), f"step {len(toks) - 3} differs from full_forward: check the new token's position and that it attends to every cached key"
    assert all(len(K) == len(toks) and len(V) == len(toks) for K, V in cache), "the cache should grow by one row per layer each step"`,
    },
    {
      name: "a decode step projects only the new position",
      code: `m = TinyLM(seed=4, n_layers=3)
_, cache = prefill(m, list(range(10)))
before = m.qkv_rows
for t in [1, 2, 3, 4]:
    _, cache = decode_step(m, t, cache)
assert m.qkv_rows - before == 4 * 3, f"4 steps on a 3-layer model should project 12 rows, but {m.qkv_rows - before} were projected: reuse the cached keys and values"`,
    },
    {
      name: "generate matches greedy decoding without a cache",
      code: `m = TinyLM(seed=5)
got = [int(t) for t in generate(m, [4, 8, 15], 8)]
want = _ref_greedy(m, [4, 8, 15], 8)
assert got == want, f"expected {want}, got {got}"`,
    },
    {
      name: "generate does linear work",
      code: `m = TinyLM(seed=6)
m.qkv_rows = 0
generate(m, [1, 2, 3, 4], 10)
assert m.qkv_rows <= 2 * (4 + 10), f"generating 10 tokens from 4 projected {m.qkv_rows} rows on a 2-layer model; with a cache it is at most 28"`,
    },
  ],
};
