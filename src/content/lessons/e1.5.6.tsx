import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StrideViz } from "@/components/viz/StrideViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.5.6",
  minutes: 50,
  links: {
    requires: ["e1.5.4"],
    revisits: ["e1.5.1"],
    parallels: ["m3.3.5"],
    foreshadows: ["e2.2.1"],
  },

  puzzle: (
    <>
      <p>
        Transposing a 10,000 by 10,000 array of floats with <C>a.T</C> takes about a microsecond, though the array holds
        800 MB. Then <C>a.T.copy()</C> takes a noticeable fraction of a second.
      </p>
      <p>If <C>a.T</C> did not move 800 MB of numbers, what did it do? And what is the copy doing that the transpose was not?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Memory is one long line of bytes. An array finds element <C>(i, j)</C> with simple arithmetic: start at an offset, add{" "}
        <C>i</C> times one step size and <C>j</C> times another. Those step sizes are the <strong>strides</strong>. A transpose
        just swaps the two strides, so the same bytes are read in a different order. Copying actually rearranges the bytes.
        Pick a view, then click cells to see where they live.
      </p>
      <StrideViz />
    </>
  ),

  theory: (
    <>
      <Definition title="strides">
        <p>
          An array is a pointer to memory, a dtype, a <C>shape</C> and a tuple of <C>strides</C>, the number of bytes to move to
          step one place along each axis. Element <C>(i₀, i₁, …)</C> lives at byte
        </p>
        <Code>{`offset + i0 * strides[0] + i1 * strides[1] + ...`}</Code>
        <p>
          For a <C>float64</C> array of shape <C>(3, 4)</C> in the default <strong>C order</strong> (row-major), the strides are{" "}
          <C>(32, 8)</C>: the last axis changes fastest.
        </p>
      </Definition>

      <Definition title="views are new strides">
        <p>
          Slicing, transposing and many reshapes produce views by computing a new offset, shape and strides over the same
          memory. A step of 2 doubles a stride; reversing makes it negative; a transpose permutes the strides. An array is{" "}
          <strong>contiguous</strong> when its elements fill memory in order with no gaps.
        </p>
      </Definition>

      <Example title="when reshape must copy">
        <Code>{`a = np.arange(12).reshape(3, 4)
t = a.T                    # view, strides swapped, not contiguous
t.reshape(12)              # must copy: no single stride walks t's order through memory
np.ascontiguousarray(t)    # explicit copy into row-major order`}</Code>
      </Example>

      <Remark title="why order affects speed">
        <p>
          Processors fetch memory in blocks of 64 bytes, called cache lines. Walking along the last axis of a C-order array uses
          every byte of each block; walking down a column jumps a whole row each step and wastes most of each block. The same
          sum can run several times faster in the right order. Deep learning frameworks are full of operations, such as a
          transpose followed by a contiguous copy, that exist only to put data in the order the next operation reads fastest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "copy",
      rung: "check",
      prompt: <p>Does <C>a.T</C> copy the array&rsquo;s data?</p>,
      answer: { kind: "choice", options: ["No; it swaps the strides of a view", "Yes, always", "Only for square arrays"], correct: [0] },
    },
    {
      key: "corder",
      rung: "check",
      prompt: <p>In C (row-major) order, which axis changes fastest as you walk through memory?</p>,
      answer: { kind: "choice", options: ["The last axis", "The first axis", "They alternate"], correct: [0] },
    },
    {
      key: "s0",
      rung: "apply",
      prompt: <p>What is the first stride, in bytes, of a <C>float64</C> array of shape <C>(3, 4)</C> in C order?</p>,
      answer: { kind: "numeric", value: 32 },
    },
    {
      key: "byte",
      rung: "apply",
      prompt: <p>For an <C>int32</C> array of shape <C>(3, 4)</C> in C order, at what byte offset does element <C>[2, 1]</C> live?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "tstride",
      rung: "apply",
      prompt: <p>What is the first stride of <C>a.T</C>, where <C>a</C> is a <C>float64</C> array of shape <C>(3, 4)</C>?</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.zeros((3, 4), dtype=np.int64)
print(a.strides, a.T.strides, a.T.flags["C_CONTIGUOUS"])`}</Code>
          <p>Strides are the bytes to step along each axis. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(32, 8) (8, 32) False", "(8, 32) (32, 8) False", "(32, 8) (32, 8) True", "(4, 1) (1, 4) False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
a = np.arange(12, dtype=np.int32).reshape(3, 4)
print(a.strides, a[:, ::2].strides, a.T.strides, a.ravel(order="F")[:4].tolist())`}</Code>
          <p>Strides in bytes for a 3 × 4 array of 4-byte integers, a strided slice and the transpose. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(16, 4) (16, 8) (4, 16) [0, 4, 8, 1]", "(4, 16) (8, 16) (16, 4) [0, 1, 2, 3]", "(16, 4) (16, 4) (4, 16) [0, 4, 8, 1]", "(4, 1) (4, 2) (1, 4) [0, 4, 8, 1]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>offset(index, strides)</C>, the byte offset of an element from the start of the buffer, and <C>c_strides(shape, itemsize)</C>, the strides of a C-contiguous array of that shape.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def offset(index, strides):
    return sum(index)

def c_strides(shape, itemsize):
    return tuple(itemsize for _ in shape)
`,
        solution: `def offset(index, strides):
    return sum(i * s for i, s in zip(index, strides))

def c_strides(shape, itemsize):
    out, step = [], itemsize
    for n in reversed(shape):
        out.append(step)
        step *= n
    return tuple(reversed(out))
`,
        tests: [
          { name: "strides", code: `import numpy as np
a = np.zeros((2, 3, 4), dtype=np.float32)
assert c_strides((2, 3, 4), 4) == a.strides, 'The last axis steps by one item; each earlier axis by the size of everything after it.'` },
          { name: "offset", code: `import numpy as np
a = np.arange(24, dtype=np.int64).reshape(2, 3, 4)
assert offset((1, 2, 3), a.strides) == a[1, 2, 3] * 8, 'Multiply each index by its stride and add.'` },
          { name: "transpose", code: `import numpy as np
a = np.arange(12, dtype=np.int64).reshape(3, 4).T
assert offset((3, 1), a.strides) // 8 == a[3, 1], 'The same rule works for a transposed view.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Use strides to make views without copying. Write <C>sliding_windows(x, w)</C> for a 1-D array, the (n − w + 1) × w view of every window, built with <C>np.lib.stride_tricks.as_strided</C> from x&rsquo;s own stride. Then write <C>im2col(img, k)</C> for a 2-D image of shape (H, W): the ((H − k + 1)·(W − k + 1)) × k² matrix whose rows are the flattened k × k patches in row-major order of their top-left corners, made from a 4-D strided view and then reshaped. These are how convolutions become matrix products.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sliding_windows(x, w):
    return np.array([x[i:i + w] for i in range(len(x) - w + 1)])

def im2col(img, k):
    return np.zeros(((img.shape[0] - k + 1) * (img.shape[1] - k + 1), k * k))
`,
        solution: `import numpy as np

from numpy.lib.stride_tricks import as_strided

def sliding_windows(x, w):
    s = x.strides[0]
    return as_strided(x, shape=(len(x) - w + 1, w), strides=(s, s), writeable=False)

def im2col(img, k):
    H, W = img.shape
    s0, s1 = img.strides
    v = as_strided(img, shape=(H - k + 1, W - k + 1, k, k), strides=(s0, s1, s0, s1), writeable=False)
    return v.reshape(-1, k * k)
`,
        tests: [
          { name: "windows", code: `import numpy as np
x = np.arange(6.0)
v = sliding_windows(x, 3)
assert v.tolist() == [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5]] and np.shares_memory(v, x), 'A view, not a copy.'
y = np.arange(20)[::2]
assert sliding_windows(y, 2).tolist()[:2] == [[0, 2], [2, 4]], 'Use the input’s own stride.'` },
          { name: "im2col", code: `import numpy as np
rng = np.random.default_rng(0)
img = rng.normal(size=(6, 5))
M = im2col(img, 3)
want = np.array([img[i:i + 3, j:j + 3].ravel() for i in range(4) for j in range(3)])
assert M.shape == (12, 9) and np.allclose(M, want)` },
          { name: "convolution", code: `import numpy as np
from scipy.signal import correlate2d
rng = np.random.default_rng(1)
img, ker = rng.normal(size=(8, 7)), rng.normal(size=(3, 3))
out = (im2col(img, 3) @ ker.ravel()).reshape(6, 5)
assert np.allclose(out, correlate2d(img, ker, mode='valid')), 'A convolution layer as one matrix product.'` },
        ],
      },
    },
    {
      key: "speed",
      rung: "prove",
      prompt: (
        <p>
          For a large C-order array, explain why summing each row is usually faster than summing each column, using strides and
          cache lines. Then explain why <C>a.T.reshape(-1)</C> must copy while <C>a.reshape(-1)</C> need not.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that along a row the stride is the item size, so consecutive elements share cache lines.",
          "Notes that down a column the stride is a whole row, so each element needs a new cache line and most fetched bytes are wasted.",
          "Explains a.reshape(-1) on a contiguous array reads memory in order, so it can be a view with one stride.",
          "Explains a.T's elements, read in row-major order of the transpose, are not evenly spaced in memory, so no single stride works and NumPy copies.",
        ],
      },
    },
    {
      key: "three",
      rung: "stretch",
      prompt: <p>What is the first stride of a <C>float32</C> array of shape <C>(2, 3, 4)</C> in C order?</p>,
      answer: { kind: "numeric", value: 48 },
    },
  ],

  teachBack:
    "Explain to a friend what strides are, why a transpose is free, and why memory order affects speed.",

  glimpse: (
    <p>
      Next, visualisation: turning arrays into pictures you can trust. Data Structures and Algorithms begins with the dynamic
      array, the contiguous block of memory that underlies both Python lists and NumPy arrays.
    </p>
  ),
};
