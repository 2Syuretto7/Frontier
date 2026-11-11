import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ViewViz } from "@/components/viz/ViewViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.4",
  minutes: 50,
  links: {
    requires: ["e1.5.1"],
    revisits: ["e1.3.1"],
    foreshadows: ["e1.5.6"],
  },

  puzzle: (
    <>
      <p>You take the first 100 rows of a dataset to experiment on, and standardise them in place:</p>
      <Code>{`sample = data[:100]
sample -= sample.mean(axis=0)`}</Code>
      <p>Later, your model trained on <C>data</C> behaves strangely on its first 100 examples. What happened to <C>data</C>?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>data[:100]</C> did not copy anything. It made a <strong>view</strong>: a new array object that looks at the same
        memory. Subtracting in place through the view changed <C>data</C> too. It is the aliasing of the data-model lesson
        again, now for arrays, and it is deliberate: views make slicing free even for gigabyte arrays. Some kinds of indexing
        give views and some give copies.
      </p>
      <ViewViz />
    </>
  ),

  theory: (
    <>
      <Definition title="basic indexing gives views">
        <p>
          Integers and slices (<C>a[3]</C>, <C>a[2:8]</C>, <C>a[::2]</C>, <C>m[1:, :3]</C>), along with <C>reshape</C> of a
          contiguous array and <C>.T</C>, return views. Writing to a view writes to the original.
        </p>
      </Definition>

      <Definition title="advanced indexing gives copies">
        <p>
          Indexing with an array or list of integers (<C>a[[1, 5, 7]]</C>) or a boolean mask (<C>a[a &gt; 0]</C>) returns a
          new array with its own memory, because the chosen elements need not follow any regular pattern.
        </p>
      </Definition>

      <Example title="assignment is different">
        <Code>{`a = np.arange(10)
a[a > 5] = 0        # assignment through a mask changes a itself
print(a.sum())      # 15`}</Code>
        <p>
          <C>a[mask]</C> on the right of <C>=</C> makes a copy, but <C>a[mask] = value</C> is a call to{" "}
          <C>a.__setitem__</C>, which writes into <C>a</C> directly. That is how you clip, replace or zero out values in place.
        </p>
      </Example>

      <Remark title="habits">
        <p>
          When you want an independent array, say so with <C>.copy()</C>. When you are unsure, <C>np.shares_memory(a, b)</C>{" "}
          answers. Prefer <C>x = x - m</C>, which makes a new array, over <C>x -= m</C> on anything that might be a view of data
          you care about.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "slice",
      rung: "check",
      prompt: <p>Is <C>a[2:8]</C> a view or a copy?</p>,
      answer: { kind: "choice", options: ["A view", "A copy"], correct: [0] },
    },
    {
      key: "mask",
      rung: "check",
      prompt: <p>Is <C>a[a &gt; 0]</C>, used as a value, a view or a copy?</p>,
      answer: { kind: "choice", options: ["A copy", "A view"], correct: [0] },
    },
    {
      key: "sliceSum",
      rung: "apply",
      prompt: <p><C>a = np.arange(10)</C>, <C>b = a[2:5]</C>, <C>b[0] = 100</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 143 },
    },
    {
      key: "fancySum",
      rung: "apply",
      prompt: <p><C>a = np.arange(10)</C>, <C>c = a[[2, 3, 4]]</C>, <C>c[0] = 100</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "grid",
      rung: "apply",
      prompt: <p>What is <C>np.arange(12).reshape(3, 4)[1:, ::2].sum()</C>?</p>,
      answer: { kind: "numeric", value: 28 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.arange(6)
v = a[1:4]
c = a[[1, 2, 3]]
v[0] = 100
c[1] = 200
print(a)`}</Code>
          <p>Slices are views; fancy indexing copies. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[  0 100   2   3   4   5]", "[  0 100 200   3   4   5]", "[0 1 2 3 4 5]", "[  0   1 200   3   4   5]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.arange(10)
b = a[::2]
c = a[a % 3 == 0]
b[:] = -1
print(a.tolist(), c.tolist(), np.shares_memory(a, b), np.shares_memory(a, c))`}</Code>
          <p>A slice is a view; a Boolean mask makes a copy. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[-1, 1, -1, 3, -1, 5, -1, 7, -1, 9] [0, 3, 6, 9] True False", "[0, 1, 2, 3, 4, 5, 6, 7, 8, 9] [0, 3, 6, 9] False False", "[-1, 1, -1, 3, -1, 5, -1, 7, -1, 9] [-1, 3, -1, 9] True True", "[-1, 1, -1, 3, -1, 5, -1, 7, -1, 9] [0, 3, 6, 9] True True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>clip_outliers(x, k)</C>, which returns a <em>new</em> array where values more than k standard deviations from the mean are replaced by the mean, using a Boolean mask. The input must not change.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def clip_outliers(x, k):
    m, s = x.mean(), x.std()
    x[np.abs(x - m) > k * s] = m
    return x
`,
        solution: `import numpy as np

def clip_outliers(x, k):
    m, s = x.mean(), x.std()
    out = x.copy()
    out[np.abs(x - m) > k * s] = m
    return out
`,
        tests: [
          { name: "clips", code: `import numpy as np
x = np.array([1.0, 2.0, 3.0, 2.0, 100.0])
y = clip_outliers(x, 1.5)
assert y[-1] == x.mean() and np.allclose(y[:4], [1, 2, 3, 2]), 'Replace only the values beyond k standard deviations.'` },
          { name: "copy", code: `import numpy as np
x = np.array([1.0, 2.0, 3.0, 2.0, 100.0])
clip_outliers(x, 1.5)
assert x[-1] == 100.0, 'Work on a copy; the caller’s array must not change.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>topk_rows(X, k)</C>, the column indices of the k largest values in each row, largest first, using <C>np.argpartition</C> and <C>np.take_along_axis</C> rather than sorting whole rows; <C>scatter_add(n, idx, vals)</C>, an array of length n where vals are added at positions idx, repeated indices accumulating (use <C>np.add.at</C>); and <C>masked_fill(X, mask, value)</C>, a new array equal to X except value where the Boolean mask is true, leaving X unchanged.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def topk_rows(X, k):
    return np.argsort(-X, axis=1)[:, :k]

def scatter_add(n, idx, vals):
    out = np.zeros(n)
    out[idx] += vals
    return out

def masked_fill(X, mask, value):
    X[mask] = value
    return X
`,
        solution: `import numpy as np

def topk_rows(X, k):
    part = np.argpartition(-X, k - 1, axis=1)[:, :k]
    vals = np.take_along_axis(X, part, axis=1)
    order = np.argsort(-vals, axis=1, kind='stable')
    return np.take_along_axis(part, order, axis=1)

def scatter_add(n, idx, vals):
    out = np.zeros(n)
    np.add.at(out, idx, vals)
    return out

def masked_fill(X, mask, value):
    out = X.copy()
    out[mask] = value
    return out
`,
        tests: [
          { name: "topk", code: `import numpy as np
rng = np.random.default_rng(0)
X = rng.normal(size=(50, 30))
T = topk_rows(X, 5)
assert T.shape == (50, 5) and np.array_equal(T, np.argsort(-X, axis=1)[:, :5]), 'The same as a full sort, largest first.'` },
          { name: "scatter", code: `import numpy as np
out = scatter_add(5, np.array([0, 2, 2, 4, 2]), np.array([1.0, 2.0, 3.0, 4.0, 5.0]))
assert out.tolist() == [1.0, 0.0, 10.0, 0.0, 4.0], 'Repeated indices accumulate: 2 + 3 + 5 at position 2.'` },
          { name: "fill", code: `import numpy as np
X = np.arange(6.0).reshape(2, 3)
Y = masked_fill(X, X > 2, -1.0)
assert Y.tolist() == [[0, 1, 2], [-1, -1, -1]] and X.tolist() == [[0, 1, 2], [3, 4, 5]] and not np.shares_memory(X, Y), 'Return a new array.'` },
        ],
      },
    },
    {
      key: "puzzle",
      rung: "prove",
      prompt: (
        <p>
          Explain what the puzzle&rsquo;s two lines did to <C>data</C>, and rewrite them so that <C>data</C> is untouched. Then
          explain why NumPy makes slices views rather than copies, despite the risk.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that data[:100] is a view sharing memory with data.",
          "Explains that -= modifies in place, so the first 100 rows of data were centred too.",
          "Rewrites as sample = data[:100].copy(), or sample = data[:100] - data[:100].mean(axis=0).",
          "Explains views make slicing take constant time and no extra memory, which matters for very large arrays.",
        ],
      },
    },
    {
      key: "setmask",
      rung: "stretch",
      prompt: <p><C>a = np.arange(10)</C>, then <C>a[a &gt; 5] = 0</C>. What is <C>a.sum()</C>?</p>,
      answer: { kind: "numeric", value: 15 },
    },
  ],

  teachBack:
    "Explain to a friend which kinds of indexing give views and which give copies, and why a[mask] = 0 still changes a.",

  glimpse: (
    <p>
      Next, einsum, a single notation for sums, products and transposes of arrays. Strides, at the end of this chapter, show how a
      view can look at memory in a different order without moving it.
    </p>
  ),
};
