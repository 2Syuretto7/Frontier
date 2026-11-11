import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LocalityViz } from "@/components/viz/LocalityViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.3.2",
  minutes: 60,
  links: {
    requires: ["e3.3.1"],
    revisits: ["e3.2.2", "e1.5.6"],
    foreshadows: ["e3.3.3", "e4.5.1", "e4.5.2"],
  },

  puzzle: (
    <>
      <p>
        Summing a 4096 × 4096 NumPy array with <C>a.sum()</C> takes a few milliseconds. Summing <C>a.T</C>, the same numbers,
        with a hand-written loop over its rows can take ten times longer, and in C the gap between two orders of the same three
        nested loops of matrix multiplication can be twenty times. No arithmetic changed. What did?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Caches pay off when a program shows <strong>locality</strong>. <strong>Temporal</strong> locality is reusing the same
        data soon; <strong>spatial</strong> locality is using data near what you just used, so the rest of each 64-byte line
        is not wasted. A 2-D array is stored as one long row of bytes, row after row. Walking along a row uses every byte of
        each line; walking down a column uses one element per line and jumps a whole row ahead each step. Compare the two
        orders below and see how large the cache must be before the column order stops missing.
      </p>
      <LocalityViz />
    </>
  ),

  theory: (
    <>
      <Definition title="layout and strides">
        <p>
          An array of shape <M>{"(n_0, \\dots, n_{d-1})"}</M> with element size s is stored with a <strong>stride</strong>{" "}
          per axis: the number of bytes between neighbours along that axis. Element <M>{"(i_0, \\dots, i_{d-1})"}</M> lives at
          base + Σ <M>{"i_k \\cdot \\text{stride}_k"}</M>. In <strong>row-major</strong> (C) order the last index moves
          fastest, so a float64 array of shape (100, 200) has strides (1600, 8); in <strong>column-major</strong> (Fortran,
          MATLAB) order the first does. NumPy shows them as <C>a.strides</C>; <C>a.T</C> and <C>a[:, ::2]</C> are views
          that only change the strides, with no copying.
        </p>
      </Definition>

      <Theorem title="strided scans">
        <p>
          Read k elements spaced d bytes apart from a cold cache with L-byte lines, where d divides L or L divides d, and
          assume no line is evicted before the scan leaves it. The scan misses about <M>{"k \\cdot \\min(1, d/L)"}</M> times.
        </p>
      </Theorem>
      <Proof>
        <p>
          If d ≥ L then L divides d, so consecutive elements lie in different lines and every access is the first touch of
          its line: k misses. If d &lt; L then d divides L, so each line holds L/d consecutive elements of the scan; the
          first of them misses and the others hit, since by assumption the line is still present. That gives one miss per L/d
          elements, about kd/L, with at most one extra partial line at each end. In both cases the count is about{" "}
          <M>{"k \\min(1, d/L)"}</M>. A stride of 8 with 64-byte lines costs one miss per 8 reads; a stride of a whole row
          costs one per read.
        </p>
      </Proof>

      <Example title="loop order in matrix multiplication">
        <Code>{`for i in range(n):            # i-k-j order
    for k in range(n):
        a = A[i][k]
        for j in range(n):
            C[i][j] += a * B[k][j]`}</Code>
        <p>
          In the textbook i-j-k order the inner loop reads <C>B[k][j]</C> down a column: stride n, one miss per iteration once
          B outgrows the cache, about n³ misses. Swapping the two inner loops gives i-k-j, where the inner loop runs along rows
          of B and C with stride 1, and misses fall to about n³/b for b elements per line. Both do exactly the same
          multiplications.
        </p>
      </Example>

      <Example title="tiling">
        <p>
          When even good orders reuse data too late, split the work into tiles small enough that the data a tile needs fits
          in cache, and finish all the work on a tile before moving on. Blocked matrix multiplication with b × b tiles brings
          each tile in once per tile-product and reuses it b times, cutting misses from about n³/(line) to about n³/(b ×
          line). Every fast BLAS library, and every GPU matrix kernel, is tiled for each level of the hierarchy.
        </p>
      </Example>

      <Remark title="memory-bound code">
        <p>
          The <strong>arithmetic intensity</strong> of a computation is its floating-point operations per byte moved from
          memory. Adding two float32 vectors does 1 operation per 12 bytes, so it runs at memory speed however fast the
          arithmetic units are; a large matrix multiply does about n/6 operations per byte and can keep them busy. This is why
          deep learning frameworks fuse elementwise operations into one kernel (<C>torch.compile</C> does this), why{" "}
          <C>.contiguous()</C> exists in PyTorch, and why FlashAttention&rsquo;s tiling makes attention several times faster
          with no change to its maths.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "stride",
      rung: "check",
      prompt: <p>A C-ordered NumPy float64 array has shape (100, 200). What is <C>a.strides[0]</C>?</p>,
      answer: { kind: "numeric", value: 1600 },
    },
    {
      key: "colmiss",
      rung: "apply",
      prompt: <p>A 1024 × 1024 row-major float32 matrix is summed once column by column and once row by row, each time from a cold fully associative LRU cache of 512 lines of 64 bytes. How many times more misses does the column-by-column sum incur?</p>,
      answer: { kind: "numeric", value: 16 },
    },
    {
      key: "intensity",
      rung: "apply",
      prompt: <p>What is the arithmetic intensity, in floating-point operations per byte of memory traffic, of <C>c = a + b</C> on float32 vectors (read a and b, write c)?</p>,
      answer: { kind: "numeric", value: 0.0833, tolerance: 0.001 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

a = np.zeros((3, 4), dtype=np.float32)
b = a.T
c = a[:, ::2]
d = np.zeros((2, 3, 5))
print(a.strides, b.strides, c.strides, d.strides, b.flags['C_CONTIGUOUS'])`}</Code>
          <p>NumPy strides. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["(16, 4) (4, 16) (16, 8) (120, 40, 8) False", "(16, 4) (16, 4) (16, 8) (120, 40, 8) True", "(16, 4) (4, 16) (8, 8) (120, 40, 8) False", "(4, 1) (1, 4) (4, 2) (15, 5, 1) False"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def misses(order, n=8, line=4, cap=4):
    cache, m = [], 0
    for x in range(n):
        for y in range(n):
            i, j = (x, y) if order == 'row' else (y, x)
            ln = (i * n + j) // line          # element index to line number
            if ln in cache:
                cache.remove(ln)
            else:
                m += 1
                if len(cache) == cap:
                    cache.pop(0)
            cache.append(ln)
    return m

print(misses('row'), misses('col'), misses('col', cap=16), misses('row', line=8))`}</Code>
          <p>Row and column order through a small LRU cache. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["16 64 16 8", "16 64 64 8", "16 16 16 8", "16 64 16 16"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>strides_for(shape, itemsize, order=&apos;C&apos;)</C> giving the byte strides of a freshly allocated
            array in C or Fortran (<C>&apos;F&apos;</C>) order, <C>address(index, strides, base=0)</C>, and{" "}
            <C>is_contiguous(shape, strides, itemsize)</C>, which says whether a view is C-contiguous: its elements fill one
            gap-free block in row-major order. Axes of length 1 may have any stride, and an array with no elements is
            contiguous.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def strides_for(shape, itemsize, order='C'):
    return tuple(itemsize for _ in shape)


def address(index, strides, base=0):
    return base + sum(index)


def is_contiguous(shape, strides, itemsize):
    return True
`,
        solution: `def strides_for(shape, itemsize, order='C'):
    dims = list(shape) if order == 'C' else list(reversed(shape))
    out, step = [], itemsize
    for d in reversed(dims):
        out.append(step)
        step *= d
    out.reverse()
    return tuple(out) if order == 'C' else tuple(reversed(out))


def address(index, strides, base=0):
    return base + sum(i * s for i, s in zip(index, strides))


def is_contiguous(shape, strides, itemsize):
    # C-contiguous: elements fill one block in row-major order (axes of length 1 may have any stride)
    if 0 in shape:
        return True
    want = strides_for(shape, itemsize)
    return all(n == 1 or s == w for n, s, w in zip(shape, strides, want))
`,
        tests: [
          { name: "strides and addresses", code: `assert strides_for((3, 4), 4) == (16, 4), 'Rows of 4 float32 are 16 bytes apart.'
assert strides_for((2, 3, 5), 8) == (120, 40, 8)
assert strides_for((2, 3, 5), 8, 'F') == (8, 16, 48), 'Column-major: the first index moves fastest.'
assert strides_for((7,), 2) == (2,) and strides_for((), 8) == ()
assert address((1, 2), (16, 4)) == 24 and address((1, 2), (16, 4), base=1000) == 1024
assert address((1, 2, 3), (120, 40, 8)) == 224
import itertools
for shape in [(2, 3), (4, 1, 3), (3, 2, 2)]:
    for order in 'CF':
        st = strides_for(shape, 4, order)
        addrs = sorted(address(ix, st) for ix in itertools.product(*map(range, shape)))
        assert addrs == list(range(0, 4 * len(addrs), 4)), f'{order}-order strides for {shape} must tile one block with no gaps.'` },
          { name: "contiguity", code: `assert is_contiguous((3, 4), (16, 4), 4)
assert not is_contiguous((4, 3), (4, 16), 4), 'A transpose is not C-contiguous.'
assert not is_contiguous((3, 2), (16, 8), 4), 'Every second column is a strided view.'
assert is_contiguous((3, 1, 4), (16, 999, 4), 4), 'The stride of a length-1 axis never matters.'
assert is_contiguous((1, 5), (7, 8), 8)
assert not is_contiguous((2, 5), (40, 4), 8), 'Item size 8 needs a last stride of 8.'
assert is_contiguous((0, 3), (5, 5), 4), 'An empty array is trivially contiguous.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Measure loop orders. Write <C>matmul_trace(n, order)</C>: for <C>C[i][j] += A[i][k] * B[k][j]</C> with n × n
            row-major matrices of one-unit elements, A at address 0, B at n², C at 2n², and the loops nested in{" "}
            <C>order</C> (such as <C>&apos;ikj&apos;</C>, outermost first), list the addresses of A[i][k], B[k][j] and C[i][j]
            for each step. Write <C>lru_misses(trace, line, cap)</C> for a fully associative LRU cache of cap lines of line
            units, and <C>best_order(n, line, cap)</C>, the order with fewest misses (alphabetically first on ties).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def matmul_trace(n, order):
    return []


def lru_misses(trace, line, cap):
    return len(set(a // line for a in trace))


def best_order(n, line, cap):
    return 'ijk'
`,
        solution: `def matmul_trace(n, order):
    # element addresses of A[i][k], B[k][j], C[i][j], in that order, for each step of the loop nest
    out = []
    ranges = {c: range(n) for c in 'ijk'}
    a, b, c = order
    for x in ranges[a]:
        for y in ranges[b]:
            for z in ranges[c]:
                v = {a: x, b: y, c: z}
                i, j, k = v['i'], v['j'], v['k']
                out += [i * n + k, n * n + k * n + j, 2 * n * n + i * n + j]
    return out


def lru_misses(trace, line, cap):
    cache, m = {}, 0          # dicts keep insertion order: first key is least recent
    for addr in trace:
        ln = addr // line
        if ln in cache:
            del cache[ln]
        else:
            m += 1
            if len(cache) == cap:
                del cache[next(iter(cache))]
        cache[ln] = True
    return m


def best_order(n, line, cap):
    orders = sorted(''.join(p) for p in __import__('itertools').permutations('ijk'))
    return min(orders, key=lambda o: lru_misses(matmul_trace(n, o), line, cap))
`,
        tests: [
          { name: "trace", code: `t = matmul_trace(2, 'ijk')
assert t[:6] == [0, 4, 8, 1, 6, 8], 'ijk starts with A[0][0], B[0][0], C[0][0], then A[0][1], B[1][0], C[0][0].'
assert len(t) == 24
assert matmul_trace(2, 'ikj')[:6] == [0, 4, 8, 0, 5, 9], 'ikj: the inner loop is over j.'
for order in ['ijk', 'ikj', 'jik', 'jki', 'kij', 'kji']:
    t = matmul_trace(3, order)
    trip = sorted(tuple(t[p:p + 3]) for p in range(0, len(t), 3))
    want = sorted((i * 3 + k, 9 + k * 3 + j, 18 + i * 3 + j) for i in range(3) for j in range(3) for k in range(3))
    assert trip == want, f'{order} must visit every (i, j, k) once.'` },
          { name: "misses", code: `def ref(trace, line, cap):
    cache, m = [], 0
    for a in trace:
        ln = a // line
        if ln in cache:
            cache.remove(ln)
        else:
            m += 1
            if len(cache) == cap:
                cache.pop(0)
        cache.append(ln)
    return m

import random
rng = random.Random(3)
for line, cap in [(1, 4), (4, 4), (8, 16), (16, 3)]:
    tr = [rng.randrange(300) for _ in range(500)]
    assert lru_misses(tr, line, cap) == ref(tr, line, cap), f'lru_misses wrong for line {line}, capacity {cap}.'

def ref_trace(n, order):
    out = []
    for x in range(n):
        for y in range(n):
            for z in range(n):
                v = dict(zip(order, (x, y, z)))
                i, j, k = v['i'], v['j'], v['k']
                out += [i * n + k, n * n + k * n + j, 2 * n * n + i * n + j]
    return out

counts = {o: ref(ref_trace(32, o), 8, 32) for o in ['ijk', 'ikj', 'jik', 'jki', 'kij', 'kji']}
assert best_order(32, 8, 32) == min(sorted(counts), key=counts.get), 'best_order should pick the order with fewest misses.'
assert best_order(32, 8, 32) == 'ikj', 'With j innermost, B and C are read along rows.'` },
        ],
      },
    },
    {
      key: "transpose",
      rung: "prove",
      prompt: <p>B = Aᵀ is computed for n × n row-major matrices, with b elements per line, b dividing n, and a cache of fewer than n lines. Show that the obvious double loop incurs about n² + n²/b misses, and prove that processing b × b tiles one at a time, with a cache of at least 2b lines, incurs about 2n²/b.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Naive loop over i then j: A is read along rows (about n²/b misses) and B is written down columns, one line per element.",
          "Since the cache holds fewer than n lines, a column's lines are evicted before the next column reuses them, so B costs about n² misses.",
          "In a tile, A's b rows span b lines and B's b rows span b lines: 2b lines, which fit, so each line is loaded once per tile.",
          "There are (n/b)² tiles, each costing 2b misses, giving 2n²/b in all: a factor of about b/2 fewer.",
        ],
      },
    },
    {
      key: "matmul",
      rung: "stretch",
      prompt: <p>For large n, with b elements per line and a cache too small to hold a column&rsquo;s worth of lines of B, estimate the misses of the i-j-k and i-k-j orders of matrix multiplication to leading order, and explain the ratio.</p>,
      answer: {
        kind: "written",
        rubric: [
          "i-j-k: inner loop over k reads A[i][k] along a row (n³/b misses) and B[k][j] down a column (n³ misses); C[i][j] stays in cache.",
          "Total for i-j-k about n³(1 + 1/b).",
          "i-k-j: inner loop over j reads B[k][j] and C[i][j] along rows, about n³/b misses each; A[i][k] is fixed in the inner loop.",
          "Total for i-k-j about 2n³/b, so the ratio is about (b + 1)/2, roughly 4.5 for 8 doubles per 64-byte line, before counting hardware prefetching.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why summing a matrix row by row is faster than column by column in NumPy, even though both add the same numbers.",

  glimpse: (
    <p>
      All of this assumed an address names a fixed byte of memory. Next, virtual memory: each process sees its own address
      space, and the hardware translates every address through page tables, with a cache of its own to keep that fast.
    </p>
  ),
};
