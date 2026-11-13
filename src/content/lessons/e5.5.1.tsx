import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StridedKernelViz } from "@/components/viz/StridedKernelViz";
import type { LessonContent } from "@/lib/types";

const CSRC = `typedef struct {
    float *data;      /* shared buffer, never owned by a view */
    int ndim;
    long shape[8];
    long strides[8];  /* in elements, may be 0 or negative */
    long offset;
} Array;

int is_contiguous(const Array *a);   /* strides equal the row-major ones */

static inline float get2(const Array *a, long i, long j) {
    return a->data[a->offset + i * a->strides[0] + j * a->strides[1]];
}

/* out is freshly allocated and contiguous */
void add2(const Array *a, const Array *b, Array *out) {
    if (is_contiguous(a) && is_contiguous(b)) {          /* fast path */
        long n = out->shape[0] * out->shape[1];
        const float *x = a->data + a->offset, *y = b->data + b->offset;
        for (long k = 0; k < n; k++) out->data[k] = x[k] + y[k];
        return;
    }
    for (long i = 0; i < out->shape[0]; i++)              /* general path */
        for (long j = 0; j < out->shape[1]; j++)
            out->data[i * out->shape[1] + j] = get2(a, i, j) + get2(b, i, j);
}`;

const ARRAY = `def row_major_strides(shape):
    strides, step = [], 1
    for n in reversed(shape):
        strides.append(step)
        step *= n
    return tuple(reversed(strides))

class StridedArray:
    def __init__(self, buf, shape, strides=None, offset=0):
        self.buf, self.shape, self.offset = buf, tuple(shape), offset
        self.strides = tuple(strides) if strides is not None else row_major_strides(shape)

    def position(self, idx):
        return self.offset + sum(i * s for i, s in zip(idx, self.strides))

    def get(self, idx):
        return self.buf[self.position(idx)]

    def transpose(self):
        return StridedArray(self.buf, self.shape[::-1], self.strides[::-1], self.offset)

    def is_contiguous(self):
        return self.strides == row_major_strides(self.shape)
`;

const OPS = `import itertools

def broadcast_to(a, shape):
    pad = len(shape) - len(a.shape)
    old = (1,) * pad + a.shape
    strides = (0,) * pad + a.strides
    new = [0 if n == 1 and m != 1 else s for n, m, s in zip(old, shape, strides)]
    return StridedArray(a.buf, shape, new, a.offset)

def contiguous(a):
    buf = [a.get(idx) for idx in itertools.product(*[range(n) for n in a.shape])]
    return StridedArray(buf, a.shape)

def add(a, b):
    buf = [a.get(i) + b.get(i) for i in itertools.product(*[range(n) for n in a.shape])]
    return StridedArray(buf, a.shape)
`;

export const lesson: LessonContent = {
  id: "e5.5.1",
  minutes: 60,
  links: {
    requires: ["e5.4.3", "e3.2.2"],
    revisits: ["e1.5.6", "e3.3.2"],
    foreshadows: ["e5.5.2", "e5.5.3"],
  },

  puzzle: (
    <>
      <p>
        Every Tensor so far has kept its numbers in a NumPy array. To own the whole stack, a framework needs its own array: a
        block of memory and a C loop over it. But NumPy&rsquo;s transpose, slices and broadcasts copy nothing. How can a C
        array support all of them with one buffer, and what must every kernel do to handle them?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Store the numbers once, in a flat buffer, and describe each view by a shape, a stride per axis and an offset. Element
        (i, j) lives at offset + i·s₀ + j·s₁. A transpose swaps the strides, a slice changes the offset and multiplies a stride,
        and a broadcast sets a stride to 0. A kernel that computes addresses from strides works on all of them; a kernel that
        assumes a flat layout is only correct for contiguous arrays, but is much faster on them.
      </p>
      <StridedKernelViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a strided array in C">
        <p>
          The struct holds a pointer to the shared buffer, the shape, the strides in elements, and an offset. The kernel below
          has a flat fast path for contiguous inputs and a general strided path for everything else.
        </p>
        <Code>{CSRC}</Code>
      </Definition>

      <Definition title="the same model in Python">
        <p>
          The exercises use a Python model of the struct, so that they run here: a list as the buffer and a class that holds
          shape, strides and offset.
        </p>
        <Code>{ARRAY}</Code>
      </Definition>

      <Theorem title="row-major layout is a bijection">
        <p>
          For shape (n₀, …, n_(d−1)) with row-major strides sₖ = n_(k+1)·…·n_(d−1), the map from an index (i₀, …, i_(d−1)) with 0 ≤
          iₖ &lt; nₖ to Σ iₖsₖ is a bijection onto 0, 1, …, N − 1, where N = n₀·…·n_(d−1).
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum Σ iₖsₖ is the index written in the mixed radix with digit bases n₀, …, n_(d−1): the last digit has place value
          1 and each earlier digit has the product of all later bases as its place value. Every integer from 0 to N − 1 has
          exactly one such representation with 0 ≤ iₖ &lt; nₖ, and the largest value, Σ (nₖ − 1)sₖ, is N − 1. So the map is
          one-to-one and onto. This is why a contiguous array can be processed by one flat loop.
        </p>
      </Proof>

      <Example title="views, copies and broadcasts">
        <Code>{OPS}</Code>
        <p>
          <C>broadcast_to</C> builds a view with stride 0 on every stretched axis. <C>contiguous</C> copies any view into a
          fresh row-major buffer, which is what <C>.contiguous()</C> in PyTorch and <C>np.ascontiguousarray</C> do. Many
          kernels call it first, paying one copy to use the fast path afterwards.
        </p>
      </Example>

      <Remark title="writing through views">
        <p>
          Two elements of a broadcast view share one memory cell, so writing through it updates that cell several times. NumPy
          marks broadcast views read-only for this reason, and in-place operations on overlapping views are a classic source
          of bugs in array libraries.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "strides",
      rung: "check",
      prompt: <p>What are the row-major strides, in elements, of a contiguous array of shape (2, 3, 4)?</p>,
      answer: { kind: "choice", options: ["(12, 4, 1)", "(1, 2, 6)", "(4, 3, 2)", "(24, 12, 4)"], correct: [0] },
    },
    {
      key: "pos",
      rung: "check",
      prompt: <p>A contiguous 3 × 4 array with offset 0. At which position in the buffer is element (1, 2)?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "transpose",
      rung: "apply",
      prompt: <p>An array has shape (3, 4) and strides (4, 1). What are the shape and strides of its transpose?</p>,
      answer: { kind: "choice", options: ["(4, 3) and (1, 4)", "(4, 3) and (4, 1)", "(3, 4) and (1, 4)", "(4, 3) and (3, 1)"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ARRAY}
a = StridedArray(list(range(12)), (3, 4))
t = a.transpose()
s = StridedArray(a.buf, (3, 2), (4, 2), 1)
print(t.strides, t.is_contiguous(), [t.get((i, 0)) for i in range(4)], [s.get((1, j)) for j in range(2)])`}</Code>
          <p>A transpose and a strided slice of the same buffer. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(1, 4) False [0, 1, 2, 3] [5, 7]",
          "(4, 1) True [0, 4, 8, 3] [5, 7]",
          "(1, 4) False [0, 4, 8, 3] [5, 6]",
          "(1, 4) True [0, 1, 2, 3] [4, 6]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`${ARRAY}
${OPS}
buf = [10, 20, 30]
b = broadcast_to(StridedArray(buf, (3,)), (2, 3))
before = [b.position((i, 2)) for i in range(2)]
for i in range(2):
    for j in range(3):
        buf[b.position((i, j))] += 1
print(b.strides, before, buf)`}</Code>
          <p>Writing through a broadcast view. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0, 1) [2, 2] [12, 22, 32]",
          "(0, 1) [2, 5] [11, 21, 31]",
          "(3, 1) [2, 5] [11, 21, 31]",
          "(0, 1) [2, 2] [11, 21, 31]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>row_major_strides(shape)</C> and the class <C>StridedArray(buf, shape, strides=None, offset=0)</C>, with
          row-major strides by default, and methods <C>position(idx)</C>, <C>get(idx)</C>, <C>transpose()</C> (reversing all
          axes, as a view) and <C>is_contiguous()</C>. Shapes and strides are tuples.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def row_major_strides(shape):
    return (1,) * len(shape)

class StridedArray:
    def __init__(self, buf, shape, strides=None, offset=0):
        self.buf, self.shape = buf, tuple(shape)
`,
        solution: ARRAY,
        tests: [
          { name: "layout", code: `assert row_major_strides((2, 3, 4)) == (12, 4, 1) and row_major_strides((5,)) == (1,)
a = StridedArray(list(range(24)), (2, 3, 4))
assert a.strides == (12, 4, 1) and a.is_contiguous()
assert a.get((1, 2, 3)) == 23 and a.position((1, 0, 2)) == 14` },
          { name: "views share the buffer", code: `a = StridedArray(list(range(24)), (2, 3, 4))
t = a.transpose()
assert t.shape == (4, 3, 2) and t.strides == (1, 4, 12) and not t.is_contiguous()
assert t.buf is a.buf and t.get((3, 2, 1)) == a.get((1, 2, 3))
s = StridedArray(a.buf, (2, 2), (12, 2), 5)
assert [s.get((i, j)) for i in range(2) for j in range(2)] == [5, 7, 17, 19]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          With StridedArray defined, write <C>broadcast_to(a, shape)</C> (pad with leading axes, stride 0 wherever a size-1 axis
          is stretched), <C>contiguous(a)</C> (a fresh row-major copy) and <C>add(a, b)</C> for two arrays of the same shape
          and any strides, returning a contiguous result. <C>itertools.product</C> gives all indices in row-major order.
        </p>
      ),
      answer: {
        kind: "code",
        setup: ARRAY,
        starter: `import itertools
# row_major_strides and StridedArray are already defined.

def broadcast_to(a, shape):
    return a

def contiguous(a):
    return a

def add(a, b):
    return a
`,
        solution: OPS,
        tests: [
          { name: "broadcasting is free", code: `row = StridedArray([1, 2, 3], (3,))
b = broadcast_to(row, (2, 4, 3))
assert b.shape == (2, 4, 3) and b.strides == (0, 0, 1) and b.buf is row.buf
col = StridedArray([10, 20], (2, 1))
c = broadcast_to(col, (2, 3))
assert c.strides == (1, 0) and [c.get((1, j)) for j in range(3)] == [20, 20, 20]` },
          { name: "copies and adds any views", code: `a = StridedArray(list(range(12)), (3, 4))
t = contiguous(a.transpose())
assert t.is_contiguous() and t.buf == [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11] and t.buf is not a.buf
s = add(a.transpose(), broadcast_to(StridedArray([100, 200, 300], (3,)), (4, 3)))
assert s.shape == (4, 3) and s.is_contiguous()
assert s.buf == [100, 204, 308, 101, 205, 309, 102, 206, 310, 103, 207, 311], s.buf` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: (
        <p>
          Prove that for a shape (n₀, …, n_(d−1)) the row-major position Σ iₖsₖ, with sₖ the product of the later sizes, takes
          each value 0, …, N − 1 exactly once as the index ranges over all valid indices.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Shows the minimum is 0 and the maximum is Σ (nₖ − 1)sₖ = N − 1 (for instance by telescoping (nₖ − 1)sₖ = sₖ₋₁ − sₖ).",
          "Shows injectivity: two different indices give different positions (compare at the first differing digit, whose place value exceeds the largest possible contribution of all later digits), or invokes uniqueness of mixed-radix representation with justification.",
          "Concludes by counting: N distinct indices map injectively into N values, so the map is a bijection.",
        ],
      },
    },
    {
      key: "bytes",
      rung: "stretch",
      prompt: <p>A contiguous float32 array has shape (64, 3, 32, 32). What is the stride of axis 0 in bytes?</p>,
      answer: { kind: "numeric", value: 12288 },
    },
  ],

  teachBack:
    "Explain to a friend how one buffer with shapes, strides and offsets supports transposes, slices and broadcasts without copying, and why a kernel needs both a general strided path and a contiguous fast path.",

  glimpse: (
    <p>
      One buffer type, many operations, and soon more than one device. Next: operator dispatch, the table that picks the
      right kernel for each operation, dtype and device.
    </p>
  ),
};
