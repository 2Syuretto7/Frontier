import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ViewAliasViz } from "@/components/viz/ViewAliasViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

x = torch.arange(12.).reshape(3, 4)
row = x[1]                       # view
row += 100                       # x[1] is now 104..107
x.untyped_storage().data_ptr() == row.untyped_storage().data_ptr()   # True
picked = x[[0, 2]]               # advanced indexing: a copy
picked.zero_()                   # x unchanged

w = torch.randn(3, requires_grad=True)
a = w.sigmoid()                  # sigmoid saves its output for backward
a.mul_(2)                        # in place: bumps a's version counter
a.sum().backward()
# RuntimeError: one of the variables needed for gradient computation
# has been modified by an inplace operation: ... is at version 1; expected version 0`;

const VIEWS = `import numpy as np

def make(values, shape):
    strides, step = [], 1
    for size in reversed(shape):
        strides.append(step)
        step *= size
    return {"store": {"data": np.asarray(values, dtype=float), "version": 0},
            "offset": 0, "shape": tuple(shape), "strides": tuple(reversed(strides))}

def values(t):
    return t["store"]["data"][addresses(t)]

def addresses(t):
    idx = np.indices(t["shape"])
    return t["offset"] + sum(idx[k] * s for k, s in enumerate(t["strides"]))

def slice_view(t, dim, start, stop, step=1):
    shape, strides = list(t["shape"]), list(t["strides"])
    shape[dim] = len(range(start, stop, step))
    strides[dim] *= step
    return {"store": t["store"], "offset": t["offset"] + start * t["strides"][dim],
            "shape": tuple(shape), "strides": tuple(strides)}

def transpose(t, i, j):
    shape, strides = list(t["shape"]), list(t["strides"])
    shape[i], shape[j] = shape[j], shape[i]
    strides[i], strides[j] = strides[j], strides[i]
    return dict(t, shape=tuple(shape), strides=tuple(strides))`;

const VERSIONS = `import numpy as np

def _addr(t):
    idx = np.indices(t["shape"])
    return t["offset"] + sum(idx[k] * s for k, s in enumerate(t["strides"]))

def add_(t, v):
    t["store"]["data"][_addr(t)] += v
    t["store"]["version"] += 1
    return t

def saved_ok(saved):
    t, version = saved
    return t["store"]["version"] == version

def shares_memory(a, b):
    return a["store"] is b["store"] and np.intersect1d(_addr(a), _addr(b)).size > 0`;

export const lesson: LessonContent = {
  id: "e6.1.3",
  minutes: 45,
  links: {
    requires: ["e6.1.2"],
    revisits: ["e5.5.1", "e1.5.6"],
    foreshadows: ["e6.2.1"],
  },

  puzzle: (
    <>
      <p>
        A data-cleaning function receives a batch, sets <C>batch[:, 0] = 0</C> to blank a column, and returns. The caller&apos;s
        original tensor is now altered too. A colleague &quot;fixes&quot; it by writing <C>batch[[0, 1, 2]] = 0</C> for a
        row selection elsewhere, and that one does not leak. In a model, replacing <C>a = a * 2</C> by <C>a *= 2</C> to save
        memory makes the backward pass crash. Which operations share memory, and how does autograd notice when shared
        memory has changed under it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Many tensor operations return a view: a new shape, stride and offset over the same storage, costing no memory and no
        copying. Writes through a view are writes to the original. Operations whose result cannot be described by strides,
        such as picking rows by a list of indices or by a boolean mask, must gather the values into new storage, so they copy.
        Autograd keeps tensors for the backward pass, and to detect that one of them has been changed in place it gives each
        storage a version counter, bumped by every in-place operation and checked when the saved tensor is used.
      </p>
      <ViewAliasViz />
    </>
  ),

  theory: (
    <>
      <Definition title="views">
        <p>
          A view is a tensor whose storage is another tensor&apos;s storage. Basic indexing with integers and slices,{" "}
          <C>view</C>, <C>transpose</C>, <C>permute</C>, <C>expand</C>, <C>unsqueeze</C>, <C>narrow</C>, <C>diagonal</C> and{" "}
          <C>detach</C> return views. Indexing with an integer tensor, a list or a mask returns a copy; <C>reshape</C> and{" "}
          <C>contiguous</C> return a view when possible and a copy otherwise, so code must not rely on either. Assignment through
          advanced indexing, <C>x[idx] = v</C>, is different from reading: it writes into x in place.
        </p>
        <Code>{TORCH}</Code>
        <Code>{VIEWS}</Code>
      </Definition>

      <Theorem title="a slice of a strided tensor is strided">
        <p>
          Slicing dimension d with start a and step k maps a tensor with offset o and strides <C>s</C> to one with offset{" "}
          <C>o + a·s_d</C>, the same strides except <C>k·s_d</C> in dimension d, and size the length of the range. Element
          addresses agree with those of the original at the corresponding indices.
        </p>
      </Theorem>
      <Proof>
        <p>
          Index <C>i</C> of the slice in dimension d corresponds to index <C>a + k·i</C> of the original, and all other
          indices are unchanged. The original address is <C>o + Σ s_j i_j</C> with <C>i_d</C> replaced by <C>a + k i</C>, which
          equals <C>(o + a s_d) + (k s_d) i + Σ_(j≠d) s_j i_j</C>, the address of the slice with the stated offset and strides.
          A list of arbitrary indices has no such form when its gaps are unequal, which is why advanced indexing copies.
        </p>
      </Proof>

      <Definition title="version counters">
        <p>
          Each storage carries a counter incremented by every in-place operation on any view of it. When autograd saves a
          tensor for the backward pass it records the counter; at backward time a mismatch raises an error instead of
          silently using changed values. The error appears only if the overwritten tensor was actually saved: an in-place
          ReLU after a linear layer is safe, while an in-place multiply after a sigmoid, which saves its output, is not.
        </p>
        <Code>{VERSIONS}</Code>
      </Definition>

      <Example title="what the figure shows">
        <p>
          On a 3 × 4 tensor, <C>x[1:]</C> starts at offset 4, <C>x[:, ::2]</C> has strides (4, 2) and <C>x.t()</C> strides (1,
          4), all pointing into the same 12 numbers. <C>x[[0, 2]]</C> and <C>x[x &gt; 6]</C> gather into fresh storage, and
          <C> x.t().reshape(12)</C> must copy because the flattened transpose is not evenly spaced in memory.
        </p>
      </Example>

      <Remark title="when to clone">
        <p>
          A function that modifies its argument in place should either document it, as PyTorch does with a trailing
          underscore, or call <C>clone()</C> first. Data loaders that reuse buffers, caches that return views of a larger
          tensor, and <C>detach()</C>, which shares storage while cutting the graph, are common sources of aliasing bugs.
          In-place operations rarely save as much memory as hoped, since autograd may need the old value anyway.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zero",
      rung: "check",
      prompt: <p>x is a float32 tensor of shape (100, 100). How many bytes of new storage does <C>y = x[::2, ::2]</C> allocate?</p>,
      answer: { kind: "numeric", value: 0, tolerance: 0.001 },
    },
    {
      key: "gather",
      rung: "check",
      prompt: <p>x is a float32 tensor of shape (1000, 512). How many bytes of new storage does <C>x[[1, 3, 5]]</C> allocate?</p>,
      answer: { kind: "numeric", value: 6144, tolerance: 0.5 },
    },
    {
      key: "inplace",
      rung: "apply",
      prompt: (
        <p>
          <C>a = w.sigmoid(); a.mul_(2); a.sum().backward()</C> raises an error, but <C>a = w @ v; a.relu_(); a.sum().backward()</C>{" "}
          does not. Why?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "relu_ is not really in place",
          "sigmoid saved its output for the backward pass and mul_ changed it, bumping the version counter; the matrix product saved its inputs, not its output, so relu_ on the output is safe",
          "In-place operations are forbidden on tensors that require gradients",
          "mul_ creates a copy that autograd cannot track",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def make(values, shape):
    strides, step = [], 1
    for size in reversed(shape):
        strides.append(step)
        step *= size
    return {"store": {"data": np.asarray(values, dtype=float), "version": 0},
            "offset": 0, "shape": tuple(shape), "strides": tuple(reversed(strides))}

def values(t):
    return t["store"]["data"][addresses(t)]

def addresses(t):
    idx = np.indices(t["shape"])
    return t["offset"] + sum(idx[k] * s for k, s in enumerate(t["strides"]))

def slice_view(t, dim, start, stop, step=1):
    shape, strides = list(t["shape"]), list(t["strides"])
    shape[dim] = len(range(start, stop, step))
    strides[dim] *= step
    return {"store": t["store"], "offset": t["offset"] + start * t["strides"][dim],
            "shape": tuple(shape), "strides": tuple(strides)}

def transpose(t, i, j):
    shape, strides = list(t["shape"]), list(t["strides"])
    shape[i], shape[j] = shape[j], shape[i]
    strides[i], strides[j] = strides[j], strides[i]
    return dict(t, shape=tuple(shape), strides=tuple(strides))

x = make(np.arange(12.0), (3, 4)); r, c = slice_view(x, 0, 1, 3), slice_view(x, 1, 0, 4, 2); print(r["offset"], r["shape"], c["strides"], values(c).tolist())
t = transpose(x, 0, 1); print(t["shape"], t["strides"], values(t)[1].tolist(), t["store"] is x["store"])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4 (2, 4) (4, 2) [[0.0, 2.0], [4.0, 6.0], [8.0, 10.0]]\n(4, 3) (1, 4) [1.0, 5.0, 9.0] True",
          "1 (2, 4) (4, 2) [[0.0, 2.0], [4.0, 6.0], [8.0, 10.0]]\n(4, 3) (1, 4) [1.0, 5.0, 9.0] True",
          "4 (2, 4) (4, 1) [[0.0, 1.0], [4.0, 5.0], [8.0, 9.0]]\n(4, 3) (1, 4) [1.0, 5.0, 9.0] True",
          "4 (2, 4) (4, 2) [[0.0, 2.0], [4.0, 6.0], [8.0, 10.0]]\n(4, 3) (4, 1) [4.0, 5.0, 6.0] False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def _addr(t):
    idx = np.indices(t["shape"])
    return t["offset"] + sum(idx[k] * s for k, s in enumerate(t["strides"]))

def add_(t, v):
    t["store"]["data"][_addr(t)] += v
    t["store"]["version"] += 1
    return t

def saved_ok(saved):
    t, version = saved
    return t["store"]["version"] == version

def shares_memory(a, b):
    return a["store"] is b["store"] and np.intersect1d(_addr(a), _addr(b)).size > 0

x = {"store": {"data": np.zeros(6), "version": 0}, "offset": 0, "shape": (2, 3), "strides": (3, 1)}; row = dict(x, offset=3, shape=(3,), strides=(1,))
saved = (x, x["store"]["version"]); add_(row, 5.0); print(x["store"]["data"].tolist(), x["store"]["version"], saved_ok(saved))
col = dict(x, offset=1, shape=(2,), strides=(3,)); print(shares_memory(row, col), shares_memory(dict(x, offset=0, shape=(2,), strides=(1,)), dict(x, offset=2, shape=(2,), strides=(3,))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.0, 0.0, 5.0, 5.0, 5.0] 1 False\nTrue False",
          "[0.0, 0.0, 0.0, 0.0, 0.0, 0.0] 0 True\nFalse False",
          "[0.0, 0.0, 0.0, 5.0, 5.0, 5.0] 1 True\nTrue False",
          "[0.0, 0.0, 0.0, 5.0, 5.0, 5.0] 1 False\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          A tensor is a dictionary with a shared store, an offset, a shape and strides; <C>make</C> and <C>values</C> are given.
          Write <C>addresses(t)</C>, the array of storage addresses with t&apos;s shape, <C>slice_view(t, dim, start, stop,
          step)</C> and <C>transpose(t, i, j)</C>, both returning views that share t&apos;s store.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def make(values, shape):
    strides, step = [], 1
    for size in reversed(shape):
        strides.append(step)
        step *= size
    return {"store": {"data": np.asarray(values, dtype=float), "version": 0},
            "offset": 0, "shape": tuple(shape), "strides": tuple(reversed(strides))}

def values(t):
    return t["store"]["data"][addresses(t)]

def addresses(t):
    return np.zeros(t["shape"], dtype=int)

def slice_view(t, dim, start, stop, step=1):
    return t

def transpose(t, i, j):
    return t
`,
        solution: VIEWS,
        tests: [
          { name: "slices", code: `x = make(np.arange(24.0), (2, 3, 4)); s = slice_view(x, 2, 1, 4, 2); assert s["shape"] == (2, 3, 2) and np.array_equal(values(s), np.arange(24.0).reshape(2, 3, 4)[:, :, 1:4:2])
s2 = slice_view(slice_view(x, 0, 1, 2), 1, 2, 0, -1); assert np.array_equal(values(s2), np.arange(24.0).reshape(2, 3, 4)[1:2, 2:0:-1]) and s2["store"] is x["store"]` },
          { name: "transpose", code: `x = make(np.arange(24.0), (2, 3, 4)); t = transpose(x, 0, 2); assert t["strides"] == (1, 4, 12) and np.array_equal(values(t), np.arange(24.0).reshape(2, 3, 4).transpose(2, 1, 0))
t["store"]["data"][addresses(t)[3, 0, 1]] = -1; assert values(x)[1, 0, 3] == -1 and x["shape"] == (2, 3, 4)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With the same representation, write <C>add_(t, v)</C>, which adds v in place through t and increments the store&apos;s
          version, <C>saved_ok(saved)</C> for a saved (tensor, version) pair, and <C>shares_memory(a, b)</C>, true when two
          tensors touch at least one common storage address. The helper <C>_addr</C> is given.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def _addr(t):
    idx = np.indices(t["shape"])
    return t["offset"] + sum(idx[k] * s for k, s in enumerate(t["strides"]))

def add_(t, v):
    return t

def saved_ok(saved):
    return True

def shares_memory(a, b):
    return False
`,
        solution: VERSIONS,
        tests: [
          { name: "versions", code: `st = {"data": np.zeros(4), "version": 0}; x = {"store": st, "offset": 0, "shape": (4,), "strides": (1,)}; ev = dict(x, shape=(2,), strides=(2,))
sv = (x, 0); add_(ev, 3.0); add_(ev, 1.0); assert st["data"].tolist() == [4, 0, 4, 0] and st["version"] == 2 and not saved_ok(sv) and saved_ok((x, 2))` },
          { name: "overlap", code: `st = {"data": np.zeros(12), "version": 0}; a = {"store": st, "offset": 0, "shape": (3, 2), "strides": (4, 1)}; b = dict(a, offset=2, shape=(3,), strides=(4,)); c = dict(a, offset=5, shape=(2,), strides=(4,))
other = {"store": {"data": np.zeros(12), "version": 0}, "offset": 0, "shape": (12,), "strides": (1,)}; assert not shares_memory(a, b) and shares_memory(a, c) and not shares_memory(a, other)` },
        ],
      },
    },
    {
      key: "expand",
      rung: "stretch",
      prompt: <p>How many floats are stored for <C>torch.randn(1, 5).expand(1000, 5)</C>?</p>,
      answer: { kind: "numeric", value: 5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Version counters are one piece of the bookkeeping autograd does. The next lesson opens up the graph it records, and
        the hooks that let you inspect or change gradients as they flow through it.
      </p>
    </>
  ),
};
