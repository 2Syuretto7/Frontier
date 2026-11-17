import { C, Code } from "@/components/lesson/Code";
import type { Drill } from "./types";

export const attention: Drill = {
  id: "attention",
  title: "Causal multi-head attention",
  summary: "Scaled dot-product attention with a mask, then causal multi-head self-attention, in NumPy.",
  minutes: 20,
  skills: ["Transformers", "Attention", "NumPy broadcasting"],
  brief: (
    <>
      <p>Write four functions in NumPy. Every array is <C>float64</C>.</p>
      <ol>
        <li>
          <C>softmax(x, axis=-1)</C>: a numerically stable softmax along <C>axis</C>. It must stay finite for inputs
          as large as 1000.
        </li>
        <li>
          <C>causal_mask(T)</C>: a boolean array of shape <C>(T, T)</C> that is <C>True</C> where position <C>i</C> may
          attend to position <C>j</C>, that is where <C>j &lt;= i</C>.
        </li>
        <li>
          <C>attention(q, k, v, mask=None)</C>: scaled dot-product attention. <C>q</C> has shape <C>(..., Tq, d)</C>,{" "}
          <C>k</C> has <C>(..., Tk, d)</C> and <C>v</C> has <C>(..., Tk, dv)</C>, with any number of leading batch or
          head dimensions. <C>mask</C>, if given, is boolean and broadcasts to <C>(..., Tq, Tk)</C>; <C>True</C> means
          the query may attend to that key, and a masked key must get exactly zero weight. Return shape{" "}
          <C>(..., Tq, dv)</C>. Every query row keeps at least one key.
        </li>
        <li>
          <C>multi_head_attention(x, w_qkv, w_o, n_heads)</C>: causal self-attention. <C>x</C> has shape{" "}
          <C>(B, T, D)</C>, <C>w_qkv</C> has <C>(D, 3D)</C> and <C>w_o</C> has <C>(D, D)</C>. Compute{" "}
          <C>x @ w_qkv</C> and split its last axis into <C>q</C>, <C>k</C>, <C>v</C> in that order, <C>D</C> columns
          each. Head <C>h</C> uses columns <C>h*D/n_heads</C> to <C>(h+1)*D/n_heads</C> of each. Concatenate the heads
          back in order, multiply by <C>w_o</C> and return shape <C>(B, T, D)</C>. No biases, no dropout.
        </li>
      </ol>
      <p>No loops over batch, heads or positions are needed. The hidden tests check shapes, values against a reference, the mask and causality.</p>
      <Code>{`
x = np.random.default_rng(0).normal(size=(2, 5, 8))
out = multi_head_attention(x, w_qkv, w_o, n_heads=2)   # out.shape == (2, 5, 8)
`}</Code>
    </>
  ),
  starter: `import numpy as np


def softmax(x, axis=-1):
    raise NotImplementedError


def causal_mask(T):
    raise NotImplementedError


def attention(q, k, v, mask=None):
    raise NotImplementedError


def multi_head_attention(x, w_qkv, w_o, n_heads):
    raise NotImplementedError


if __name__ == "__main__":
    rng = np.random.default_rng(0)
    x = rng.normal(size=(2, 5, 8))
    w_qkv = rng.normal(size=(8, 24)) / 8 ** 0.5
    w_o = rng.normal(size=(8, 8)) / 8 ** 0.5
    print(multi_head_attention(x, w_qkv, w_o, n_heads=2).shape)
`,
  solution: `import numpy as np


def softmax(x, axis=-1):
    x = x - x.max(axis=axis, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=axis, keepdims=True)


def causal_mask(T):
    return np.tril(np.ones((T, T), dtype=bool))


def attention(q, k, v, mask=None):
    scores = q @ np.swapaxes(k, -1, -2) / np.sqrt(q.shape[-1])
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)
    return softmax(scores, axis=-1) @ v


def multi_head_attention(x, w_qkv, w_o, n_heads):
    B, T, D = x.shape
    hd = D // n_heads
    q, k, v = np.split(x @ w_qkv, 3, axis=-1)

    def heads(t):
        return t.reshape(B, T, n_heads, hd).transpose(0, 2, 1, 3)

    out = attention(heads(q), heads(k), heads(v), causal_mask(T))
    return out.transpose(0, 2, 1, 3).reshape(B, T, D) @ w_o
`,
  prelude: `import numpy as _ref_np


def _ref_softmax(x):
    x = x - x.max(axis=-1, keepdims=True)
    e = _ref_np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)


def _ref_attention(q, k, v, mask=None):
    s = q @ _ref_np.swapaxes(k, -1, -2) / _ref_np.sqrt(q.shape[-1])
    if mask is not None:
        s = _ref_np.where(mask, s, -1e30)
    return _ref_softmax(s) @ v


def _ref_mha(x, w_qkv, w_o, n):
    B, T, D = x.shape
    out = _ref_np.zeros((B, T, D))
    proj = x @ w_qkv
    hd = D // n
    mask = _ref_np.tril(_ref_np.ones((T, T), dtype=bool))
    for h in range(n):
        cols = slice(h * hd, (h + 1) * hd)
        q = proj[..., :D][..., cols]
        k = proj[..., D:2 * D][..., cols]
        v = proj[..., 2 * D:][..., cols]
        out[..., cols] = _ref_attention(q, k, v, mask)
    return out @ w_o


_ref_rng = _ref_np.random.default_rng(1234)


def _ref_weights(D):
    return _ref_rng.normal(size=(D, 3 * D)) / D ** 0.5, _ref_rng.normal(size=(D, D)) / D ** 0.5
`,
  tests: [
    {
      name: "softmax sums to one and stays finite on large inputs",
      code: `x = _ref_rng.normal(size=(3, 4, 7)) * 1000
s = softmax(x.copy(), axis=-1)
assert s.shape == x.shape, "softmax should keep the input's shape"
assert _ref_np.all(_ref_np.isfinite(s)), "softmax overflowed on large inputs: subtract something before exponentiating"
assert _ref_np.allclose(s.sum(axis=-1), 1), "each row should sum to one along the given axis"
s0 = softmax(x[0].copy() / 1000, axis=0)
assert _ref_np.allclose(s0.sum(axis=0), 1), "softmax should respect the axis argument"`,
    },
    {
      name: "causal_mask has the right shape, type and pattern",
      code: `m = causal_mask(4)
assert getattr(m, "shape", None) == (4, 4), "causal_mask(4) should have shape (4, 4)"
assert m.dtype == bool, "the mask should be boolean"
assert m[2, 1] and m[2, 2] and not m[1, 2], "position i may attend to j only when j <= i"`,
    },
    {
      name: "attention returns shape (..., Tq, dv) with extra leading dimensions",
      code: `q = _ref_rng.normal(size=(2, 3, 4, 8))
k = _ref_rng.normal(size=(2, 3, 6, 8))
v = _ref_rng.normal(size=(2, 3, 6, 5))
out = attention(q, k, v)
assert getattr(out, "shape", None) == (2, 3, 4, 5), f"expected (2, 3, 4, 5), got {getattr(out, 'shape', None)}"`,
    },
    {
      name: "attention matches the reference without a mask",
      code: `q = _ref_rng.normal(size=(2, 4, 16))
k = _ref_rng.normal(size=(2, 6, 16))
v = _ref_rng.normal(size=(2, 6, 3))
out = attention(q.copy(), k.copy(), v.copy())
assert _ref_np.allclose(out, _ref_attention(q, k, v)), "values differ from scaled dot-product attention: check the scaling and which axis the softmax runs over"`,
    },
    {
      name: "masked keys get exactly zero weight",
      code: `q = _ref_rng.normal(size=(4, 8))
k = _ref_rng.normal(size=(5, 8))
v = _ref_rng.normal(size=(5, 2))
mask = _ref_np.array([[1, 0, 1, 0, 1], [1, 1, 1, 1, 1], [0, 0, 0, 0, 1], [1, 1, 0, 0, 0]], dtype=bool)
out = attention(q, k, v, mask)
assert _ref_np.allclose(out, _ref_attention(q, k, v, mask)), "with a mask, the values differ from the reference"
v2 = v.copy()
v2[3] += 1000.0
out2 = attention(q, k, v2, mask)
assert _ref_np.allclose(out[[0, 2, 3]], out2[[0, 2, 3]]), "a masked key still affects the output"`,
    },
    {
      name: "a mask broadcasts across batch and heads",
      code: `q = _ref_rng.normal(size=(2, 3, 5, 4))
mask = _ref_np.tril(_ref_np.ones((5, 5), dtype=bool))
out = attention(q, q, q, mask)
assert out.shape == (2, 3, 5, 4), "a (T, T) mask should broadcast over the leading dimensions"
assert _ref_np.allclose(out, _ref_attention(q, q, q, mask)), "values differ from the reference when the mask is broadcast"`,
    },
    {
      name: "multi-head attention returns shape (B, T, D)",
      code: `x = _ref_rng.normal(size=(3, 7, 12))
w_qkv, w_o = _ref_weights(12)
out = multi_head_attention(x, w_qkv, w_o, 3)
assert getattr(out, "shape", None) == (3, 7, 12), f"expected (3, 7, 12), got {getattr(out, 'shape', None)}"`,
    },
    {
      name: "multi-head attention matches the reference",
      code: `x = _ref_rng.normal(size=(2, 6, 12))
w_qkv, w_o = _ref_weights(12)
for n in (1, 3, 4):
    out = multi_head_attention(x.copy(), w_qkv, w_o, n)
    assert _ref_np.allclose(out, _ref_mha(x, w_qkv, w_o, n)), f"values differ from the reference with {n} heads: check how q, k, v and the heads are split and recombined"`,
    },
    {
      name: "earlier positions never see later tokens",
      code: `x = _ref_rng.normal(size=(1, 6, 8))
w_qkv, w_o = _ref_weights(8)
a = multi_head_attention(x.copy(), w_qkv, w_o, 2)
x2 = x.copy()
x2[0, 4:] = _ref_rng.normal(size=(2, 8)) * 5
b = multi_head_attention(x2, w_qkv, w_o, 2)
assert _ref_np.allclose(a[0, :4], b[0, :4]), "changing tokens 4 and 5 changed the output at earlier positions: the attention is not causal"`,
    },
  ],
};
