import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InsertShiftViz } from "@/components/viz/InsertShiftViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.2.1",
  minutes: 55,
  links: {
    requires: ["e2.1.2"],
    revisits: ["e1.5.6", "e0.4.1"],
    foreshadows: ["e2.2.3", "e3.2.2", "e3.3.2"],
  },

  puzzle: (
    <>
      <p>
        Reading <C>xs[700000]</C> from a list of a million items takes the same time as reading <C>xs[0]</C>. The computer
        does not count its way along to item 700 000. How does it get there in one step? And why, then, is{" "}
        <C>xs.insert(0, x)</C> so slow?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An array is one unbroken block of memory with every slot the same size. If the block starts at address b and each slot
        takes s bytes, slot i is at address <M>{"b + i \\cdot s"}</M>: one multiplication and one addition, whatever i is. The
        price of that arithmetic is rigidity. The items must stay packed in order, so putting something new at the front means
        sliding everything else one slot along.
      </p>
      <InsertShiftViz />
    </>
  ),

  theory: (
    <>
      <Definition title="array">
        <p>
          An <strong>array</strong> stores n items of equal size s in consecutive memory starting at address b. Item i lives at{" "}
          <M>{"b + is"}</M>, so reading or writing any item is O(1): <strong>random access</strong>. Inserting or deleting at
          position i must shift the n − i items after it, O(n − i).
        </p>
      </Definition>

      <Definition title="dynamic array">
        <p>
          A <strong>dynamic array</strong> keeps a block of some capacity m ≥ n and the count n of slots in use. Appending into a
          spare slot is O(1); appending when full allocates a block of size about 2m and copies, which the previous lesson showed
          costs O(1) amortised. Python&rsquo;s <C>list</C>, C++&rsquo;s <C>vector</C> and Java&rsquo;s <C>ArrayList</C> are all
          dynamic arrays.
        </p>
      </Definition>

      <Example title="what a Python list really holds">
        <p>
          The slots of a Python list hold 8-byte <em>references</em> to objects stored elsewhere. A list of a million floats is
          an 8 MB array of pointers plus a million separate 24-byte float objects. NumPy and the <C>array</C> module store the
          raw 8-byte values side by side instead: 8 MB in all, and the values are adjacent in memory, which is what makes
          vectorised code fast. Lists of references also explain a classic bug:
        </p>
        <Code>{`grid = [[0] * 3] * 3      # three references to ONE row
grid[0][0] = 1             # every row now starts with 1
grid = [[0] * 3 for _ in range(3)]   # three separate rows`}</Code>
      </Example>

      <Definition title="multidimensional arrays">
        <p>
          An r × c table is stored in one block. In <strong>row-major</strong> order (C, NumPy&rsquo;s default) element (i, j) is
          at offset <M>{"i c + j"}</M>; in <strong>column-major</strong> order (Fortran, MATLAB) at <M>{"j r + i"}</M>. The
          strides of e1.5.6 generalise this to any number of dimensions.
        </p>
      </Definition>

      <Theorem title="rotation by three reversals">
        <p>
          Rotating an array left by k places (so <C>a[k]</C> moves to the front) can be done in place, in O(n) time and O(1)
          extra memory: reverse <C>a[:k]</C>, reverse <C>a[k:]</C>, then reverse the whole array.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write the array as AB with |A| = k; we want BA. Reversing each part gives <M>{"A^R B^R"}</M>, and reversing the whole
          gives <M>{"(A^R B^R)^R = (B^R)^R (A^R)^R = BA"}</M>, because reversing a concatenation reverses the order of the
          pieces and reverses each one.
        </p>
      </Proof>

      <Remark title="locality">
        <p>
          Memory is fetched in cache lines of 64 bytes, so reading item i of an array brings its neighbours along for free.
          Walking an array in order is therefore much faster than following pointers scattered across memory, often by ten
          times or more, even when both are O(n). Computer Systems explains why; for now, prefer contiguous storage when you can.
        </p>
      </Remark>

      <Remark title="a gap buffer">
        <p>
          A text editor inserts at a cursor that rarely jumps. A <strong>gap buffer</strong> keeps the text in one array with a
          block of unused slots, the gap, at the cursor. Typing fills the gap in O(1); moving the cursor by d characters moves d
          characters across the gap. Edits cluster, so most operations are cheap.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "address",
      rung: "check",
      prompt: <p>An array of 8-byte numbers starts at address 1000. At what address is item 5 (counting from 0)?</p>,
      answer: { kind: "numeric", value: 1040 },
    },
    {
      key: "front",
      rung: "check",
      prompt: <p>What does <C>xs.insert(0, x)</C> cost on a Python list of n items?</p>,
      answer: { kind: "choice", options: ["Θ(n), because every item shifts one slot", "O(1) amortised", "Θ(log n)", "O(1), because lists are linked"], correct: [0] },
    },
    {
      key: "average",
      rung: "apply",
      prompt: <p>An array holds 100 items. A new item is inserted at a position chosen uniformly from the 101 possible ones. On average, how many items shift?</p>,
      answer: { kind: "numeric", value: 50 },
    },
    {
      key: "rowmajor",
      rung: "apply",
      prompt: <p>A 3 × 4 array of 4-byte integers is stored row-major from byte 0. At what byte offset does element (2, 1) start?</p>,
      answer: { kind: "numeric", value: 36 },
    },
    {
      key: "memory",
      rung: "apply",
      prompt: <p>Roughly how much memory does a Python list of one million distinct floats use, compared with a NumPy float64 array of the same values?</p>,
      answer: { kind: "choice", options: ["About 32 MB against 8 MB", "About 8 MB each", "About 8 MB against 32 MB", "About 1 MB against 8 MB"], correct: [0] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`row = [0] * 3
grid = [row] * 3
grid[0][1] = 5
fresh = [[0] * 3 for _ in range(3)]
fresh[0][1] = 5
print(grid, fresh[1], grid[2] is row)`}</Code>
          <p>The slots of a list hold references. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[0, 5, 0], [0, 5, 0], [0, 5, 0]] [0, 0, 0] True", "[[0, 5, 0], [0, 0, 0], [0, 0, 0]] [0, 0, 0] False", "[[0, 5, 0], [0, 5, 0], [0, 5, 0]] [0, 5, 0] True", "[[0, 5, 0], [0, 0, 0], [0, 0, 0]] [0, 0, 0] True"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def insert(a, n, i, x):     # a has spare room; n slots are in use
    for k in range(n, i, -1):
        a[k] = a[k - 1]
    a[i] = x
    return n + 1

a, n, shifts = [None] * 8, 0, 0
for i, x in [(0, "c"), (0, "a"), (1, "b"), (3, "d"), (2, "x")]:
    shifts += n - i
    n = insert(a, n, i, x)
print(a[:n], shifts, a[n:])`}</Code>
          <p>Five insertions into a fixed block. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['a', 'b', 'x', 'c', 'd'] 4 [None, None, None]", "['a', 'b', 'x', 'c', 'd'] 5 [None, None, None]", "['c', 'a', 'b', 'x', 'd'] 4 [None, None, None]", "['a', 'b', 'c', 'x', 'd'] 4 [None, None, None]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a <C>GapBuffer</C> for a text editor. Keep the characters in one Python list <C>self.buf</C> with a gap of
            unused slots between indices <C>self.lo</C> (inclusive) and <C>self.hi</C> (exclusive); the cursor is at the gap.
            Implement <C>insert(s)</C> (type the characters of s at the cursor, which ends up after them),{" "}
            <C>backspace()</C> (delete the character before the cursor; nothing at position 0), <C>move(i)</C> (put the cursor
            before character i, 0 ≤ i ≤ len, by moving characters across the gap one at a time, adding 1 to{" "}
            <C>self.moved</C> for each), <C>cursor()</C>, <C>text()</C> and <C>__len__</C>. Never let the gap
            become empty: as soon as it does, double the buffer by inserting that many empty slots at the gap.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class GapBuffer:
    def __init__(self, capacity=8):
        self.s = ""
        self.pos = 0
        self.moved = 0

    def insert(self, s):
        self.s = self.s[:self.pos] + s + self.s[self.pos:]
        self.pos += len(s)

    def backspace(self):
        pass

    def move(self, i):
        self.pos = i

    def cursor(self):
        return self.pos

    def text(self):
        return self.s

    def __len__(self):
        return len(self.s)
`,
        solution: `class GapBuffer:
    def __init__(self, capacity=8):
        self.buf = [None] * capacity
        self.lo, self.hi = 0, capacity
        self.moved = 0

    def _grow(self):
        n = len(self.buf)
        self.buf[self.lo:self.lo] = [None] * n
        self.hi += n

    def insert(self, s):
        for ch in s:
            self.buf[self.lo] = ch
            self.lo += 1
            if self.lo == self.hi:
                self._grow()

    def backspace(self):
        if self.lo > 0:
            self.lo -= 1
            self.buf[self.lo] = None

    def move(self, i):
        while self.lo > i:
            self.lo, self.hi = self.lo - 1, self.hi - 1
            self.buf[self.hi], self.buf[self.lo] = self.buf[self.lo], None
            self.moved += 1
        while self.lo < i:
            self.buf[self.lo], self.buf[self.hi] = self.buf[self.hi], None
            self.lo, self.hi = self.lo + 1, self.hi + 1
            self.moved += 1

    def cursor(self):
        return self.lo

    def text(self):
        return ''.join(self.buf[:self.lo] + self.buf[self.hi:])

    def __len__(self):
        return len(self.buf) - (self.hi - self.lo)
`,
        tests: [
          { name: "editing", code: `g = GapBuffer(4)
g.insert("helo")
g.move(3)
g.insert("l")
assert g.text() == "hello" and g.cursor() == 4 and len(g) == 5
g.move(5); g.insert(" world"); g.move(0); g.backspace(); g.insert(">")
assert g.text() == ">hello world" and g.cursor() == 1
assert g.hi - g.lo == len(g.buf) - len(g), 'The gap is the unused part of buf.'` },
          { name: "moves counted", code: `g = GapBuffer()
g.insert("abcdefghij")
g.moved = 0
g.move(3); g.move(7); g.move(7); g.move(0)
assert g.moved == 7 + 4 + 0 + 7, 'Moving the cursor by d moves exactly d characters.'
assert g.text() == "abcdefghij"` },
          { name: "random", code: `import random
rng = random.Random(2)
g, ref, cur = GapBuffer(2), "", 0
for _ in range(3000):
    op = rng.random()
    if op < 0.5:
        s = ''.join(rng.choice('xyz') for _ in range(rng.randint(1, 3)))
        g.insert(s); ref = ref[:cur] + s + ref[cur:]; cur += len(s)
    elif op < 0.7:
        g.backspace()
        if cur:
            ref = ref[:cur - 1] + ref[cur:]; cur -= 1
    else:
        cur = rng.randint(0, len(ref)); g.move(cur)
    assert g.cursor() == cur and len(g) == len(ref)
assert g.text() == ref` },
          { name: "fast typing", code: `import time
g = GapBuffer()
t = time.time()
g.insert("a" * 50000)
g.move(25000)
for _ in range(20000):
    g.insert("b")
assert len(g) == 70000 and g.moved == 25000 and time.time() - t < 3, 'Typing at the cursor must not shift the rest of the text.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two in-place array routines, each O(n) time and O(1) extra memory:</p>
          <ul>
            <li>
              <C>remove_all(a, x)</C> removes every occurrence of x from the list a, keeping the order of the rest, and returns
              the new length. Use a read index and a write index, then truncate once with <C>del a[k:]</C>; calling{" "}
              <C>a.remove(x)</C> repeatedly would be quadratic.
            </li>
            <li>
              <C>rotate(a, k)</C> rotates a left by k places (k may exceed len(a) or be negative) using three reversals, written
              with swaps, not slicing.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def remove_all(a, x):
    return len(a)

def rotate(a, k):
    pass
`,
        solution: `def remove_all(a, x):
    w = 0
    for r in range(len(a)):
        if a[r] != x:
            a[w] = a[r]
            w += 1
    del a[w:]
    return w

def _reverse(a, i, j):
    j -= 1
    while i < j:
        a[i], a[j] = a[j], a[i]
        i += 1
        j -= 1

def rotate(a, k):
    n = len(a)
    if n == 0:
        return
    k %= n
    _reverse(a, 0, k)
    _reverse(a, k, n)
    _reverse(a, 0, n)
`,
        tests: [
          { name: "remove", code: `a = [3, 1, 3, 2, 3, 3, 4]
ident = id(a)
assert remove_all(a, 3) == 3 and a == [1, 2, 4] and id(a) == ident, 'Work in place.'
b = [5, 5]
assert remove_all(b, 5) == 0 and b == []
c = [1, 2]
assert remove_all(c, 9) == 2 and c == [1, 2]` },
          { name: "rotate", code: `for n in range(0, 9):
    for k in range(-10, 11):
        a = list(range(n))
        ident = id(a)
        rotate(a, k)
        want = list(range(n))[k % n:] + list(range(n))[:k % n] if n else []
        assert a == want and id(a) == ident, f'n={n}, k={k}: got {a}'` },
          { name: "linear", code: `import time
n = 300000
a = [i % 3 for i in range(n)]
t = time.time()
assert remove_all(a, 0) == 200000
b = list(range(n))
rotate(b, 123457)
assert b[0] == 123457 and b[-1] == 123456
assert time.time() - t < 4, 'Both should be linear.'` },
        ],
      },
    },
    {
      key: "reversal",
      rung: "prove",
      prompt: <p>Prove that reversing a[:k], then a[k:], then the whole array rotates a left by k places, by tracking where the item that starts at index i ends up.</p>,
      answer: {
        kind: "written",
        rubric: [
          "For i < k: the first reversal sends i to k − 1 − i, and the final reversal sends that to n − 1 − (k − 1 − i) = n − k + i.",
          "For i ≥ k: the second reversal sends i to k + (n − 1 − i), and the final reversal sends that to n − 1 − (k + n − 1 − i) = i − k.",
          "Both cases agree with left rotation, which sends i to (i − k) mod n.",
        ],
      },
    },
    {
      key: "strides",
      rung: "stretch",
      prompt: (
        <p>
          A 4096 × 4096 array of 8-byte floats is stored row-major. Cache lines hold 64 bytes. Estimate how many cache lines are
          loaded when summing it row by row, and when summing it column by column if the cache cannot hold a whole column&rsquo;s
          worth of lines. Explain the difference.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Row by row reads memory in order: each 64-byte line serves 8 consecutive elements, so about 4096² / 8 ≈ 2.1 million lines.",
          "Column by column jumps 4096 × 8 = 32 KB between consecutive reads, so each read touches a new line.",
          "If lines are evicted before the next column reuses them, every element costs a line: about 16.8 million lines, eight times more.",
          "Concludes that traversal order should match storage order (or that the loops should be swapped or the array transposed).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why indexing an array is O(1) while inserting at the front is O(n), and what a Python list actually stores in its slots.",

  glimpse: (
    <p>
      The next lesson trades random access for cheap insertion with linked lists, and the one after builds stacks, queues and ring
      buffers on arrays. Computer Systems explains caches and why contiguous memory wins, and every tensor library is built on the
      strided arrays introduced here.
    </p>
  ),
};
