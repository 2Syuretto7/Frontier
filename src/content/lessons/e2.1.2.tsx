import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DynArrayViz } from "@/components/viz/DynArrayViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.1.2",
  minutes: 55,
  links: {
    requires: ["e2.1.1"],
    revisits: ["m0.4.4"],
    foreshadows: ["e2.2.1", "e2.2.3", "e2.3.2"],
  },

  puzzle: (
    <>
      <p>
        A Python list is a block of memory with room for a fixed number of items. When an <C>append</C> finds the block full,
        it allocates a bigger block and copies every item across. Copying a million items is a million steps. Yet the
        documentation says <C>append</C> is O(1). Is that a lie?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Most appends are cheap; a few are very expensive. If the block doubles each time it fills, the expensive appends come
        at sizes 1, 2, 4, 8, …, and each one copies as many items as there have been cheap appends since the last copy. Spread
        the cost of each copy over those cheap appends and every append pays a small, constant amount. That spreading is{" "}
        <strong>amortised analysis</strong>. It is a guarantee about every sequence of operations, not an average over random
        inputs.
      </p>
      <DynArrayViz />
    </>
  ),

  theory: (
    <>
      <Definition title="amortised cost">
        <p>
          Assign each operation an <strong>amortised cost</strong> <M>{"\\hat c_i"}</M> such that, for every sequence of n
          operations starting from the empty structure, the total actual cost is at most the total amortised cost:{" "}
          <M>{"\\sum_{i=1}^n c_i \\le \\sum_{i=1}^n \\hat c_i"}</M>. If every <M>{"\\hat c_i"}</M> is O(1), any n operations
          cost O(n), even though one of them may cost Θ(n).
        </p>
      </Definition>

      <Example title="the aggregate method: doubling">
        <p>
          Start with capacity 1 and double when full. The n appends write n items, and copy{" "}
          <M>{"1 + 2 + 4 + \\dots + 2^k"}</M> items where <M>{"2^k < n"}</M>, which is less than 2n. The total is under 3n, so
          the amortised cost of an append is at most 3.
        </p>
      </Example>

      <Example title="the accounting method: a binary counter">
        <p>
          Incrementing a binary counter flips trailing 1s to 0 and one 0 to 1. One increment can flip every bit. Charge 2 for
          each increment: 1 pays for setting a bit to 1, and 1 is left on that bit as credit. Every 1 bit carries a credit,
          which pays for flipping it back to 0 later. Credit never goes negative, so n increments flip at most 2n bits.
        </p>
      </Example>

      <Theorem title="the potential method">
        <p>
          Choose a <strong>potential</strong> Φ mapping states of the structure to real numbers, with{" "}
          <M>{"\\Phi(\\text{empty}) = 0"}</M> and <M>{"\\Phi \\ge 0"}</M> always. Define{" "}
          <M>{"\\hat c_i = c_i + \\Phi_i - \\Phi_{i-1}"}</M>. Then <M>{"\\sum c_i \\le \\sum \\hat c_i"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum telescopes: <M>{"\\sum \\hat c_i = \\sum c_i + \\Phi_n - \\Phi_0 \\ge \\sum c_i"}</M>, since{" "}
          <M>{"\\Phi_n \\ge 0 = \\Phi_0"}</M>.
        </p>
      </Proof>
      <Example title="doubling with a potential">
        <p>
          For a dynamic array with n items and capacity m, take <M>{"\\Phi = 2n - m"}</M> (non-negative once the array is at
          least half full, which doubling maintains). A cheap append costs 1 and raises Φ by 2: amortised 3. An append that
          resizes from m = n to 2n costs n + 1 and changes Φ from <M>{"2n - n = n"}</M> to <M>{"2(n+1) - 2n = 2"}</M>: amortised{" "}
          <M>{"n + 1 + 2 - n = 3"}</M>. Every append is amortised 3.
        </p>
      </Example>

      <Remark title="why the growth must be multiplicative">
        <p>
          Growing by a constant k instead copies at sizes k, 2k, 3k, …, about <M>{"n^2/(2k)"}</M> items in total: Θ(n) per
          append. Growing by any factor g &gt; 1 copies at most about <M>{"n/(g-1)"}</M> items in total. CPython grows lists by
          roughly 1/8 plus a constant, trading a little more copying for less wasted memory.
        </p>
      </Remark>

      <Remark title="shrinking without thrashing">
        <p>
          If the array halves whenever it falls to half full, alternating append and pop at that boundary resizes on every
          operation, Θ(n) each. Halving only when it falls to a <em>quarter</em> full leaves a gap: after any resize the array
          is half full, so Θ(m) cheap operations must happen before the next one. Hysteresis like this recurs in hash tables and
          caches.
        </p>
      </Remark>

      <Remark title="amortised is not average">
        <p>
          An average-case bound averages over random inputs and can be broken by an unlucky input. An amortised bound holds for
          every sequence. What it does not promise is that each single operation is fast, so a system with a hard latency limit
          (a game frame, a trading engine) may still be hurt by the occasional slow append.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "append",
      rung: "check",
      prompt: <p>With doubling, what is the worst-case cost of a single <C>append</C> to an array of n items, and its amortised cost?</p>,
      answer: { kind: "choice", options: ["Θ(n) worst case, O(1) amortised", "O(1) worst case, O(1) amortised", "Θ(n) worst case, Θ(log n) amortised", "Θ(log n) worst case, O(1) amortised"], correct: [0] },
    },
    {
      key: "copies",
      rung: "check",
      prompt: <p>A dynamic array starts with capacity 1 and doubles when full. How many items are copied in total while 17 items are appended?</p>,
      answer: { kind: "numeric", value: 31 },
    },
    {
      key: "counter",
      rung: "apply",
      prompt: <p>A binary counter starts at 0 and is incremented 16 times. How many bit flips happen in total?</p>,
      answer: { kind: "numeric", value: 31 },
    },
    {
      key: "additive",
      rung: "apply",
      prompt: <p>An array grows by 100 slots whenever it is full. What is the total copying cost of n appends?</p>,
      answer: { kind: "choice", options: ["Θ(n²)", "Θ(n)", "Θ(n log n)", "Θ(n · 100)"], correct: [0] },
    },
    {
      key: "factor",
      rung: "apply",
      prompt: <p>With growth factor g, n appends copy at most about <M>{"n/(g-1)"}</M> items. For g = 1.25, at most how many copies per append is that, on average?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class DynArray:
    def __init__(self):
        self.cap, self.n, self.copies = 1, 0, 0

    def append(self, x):
        if self.n == self.cap:
            self.copies += self.n
            self.cap *= 2
        self.n += 1

a = DynArray()
for i in range(1000):
    a.append(i)
print(a.cap, a.copies, round(a.copies / a.n, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1024 1023 1.023", "1024 2047 2.047", "1000 999 0.999", "2048 1023 1.023"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def increment(bits):          # bits[0] is the lowest bit
    i = 0
    while i < len(bits) and bits[i] == 1:
        bits[i] = 0
        i += 1
    if i == len(bits):
        bits.append(1)
    else:
        bits[i] = 1
    return i + 1                  # bits flipped

bits = []
flips = [increment(bits) for _ in range(100)]
print(sum(flips), max(flips), bits)`}</Code>
          <p>A hundred increments of a binary counter. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["197 7 [0, 0, 1, 0, 0, 1, 1]", "200 7 [0, 0, 1, 0, 0, 1, 1]", "197 7 [1, 1, 0, 0, 1, 0, 0]", "197 6 [0, 0, 1, 0, 0, 1, 1]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>DynamicArray</C> on top of a fixed-size Python list used as raw storage (<C>[None] * capacity</C>),
            with <C>append(x)</C>, <C>pop()</C> (removing and returning the last item, raising <C>IndexError</C> when empty),{" "}
            <C>__getitem__(i)</C> for 0 ≤ i &lt; len (else <C>IndexError</C>) and <C>__len__</C>. Start at capacity 1, double
            when full, and halve when a pop leaves the array a quarter full or less (never below capacity 1). Count every item
            moved by a resize in <C>self.copies</C> and keep the capacity in <C>self.capacity</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class DynamicArray:
    def __init__(self):
        self.data = []
        self.capacity = 1
        self.copies = 0

    def append(self, x):
        self.data.append(x)

    def pop(self):
        return self.data.pop()

    def __getitem__(self, i):
        return self.data[i]

    def __len__(self):
        return len(self.data)
`,
        solution: `class DynamicArray:
    def __init__(self):
        self.capacity = 1
        self.data = [None]
        self.n = 0
        self.copies = 0

    def _resize(self, cap):
        new = [None] * cap
        for i in range(self.n):
            new[i] = self.data[i]
        self.copies += self.n
        self.data, self.capacity = new, cap

    def append(self, x):
        if self.n == self.capacity:
            self._resize(2 * self.capacity)
        self.data[self.n] = x
        self.n += 1

    def pop(self):
        if self.n == 0:
            raise IndexError('pop from empty array')
        self.n -= 1
        x = self.data[self.n]
        self.data[self.n] = None
        if self.capacity > 1 and self.n <= self.capacity // 4:
            self._resize(max(1, self.capacity // 2))
        return x

    def __getitem__(self, i):
        if not 0 <= i < self.n:
            raise IndexError('index out of range')
        return self.data[i]

    def __len__(self):
        return self.n
`,
        tests: [
          { name: "behaves like a list", code: `a = DynamicArray()
for i in range(10):
    a.append(i * i)
assert len(a) == 10 and a[3] == 9 and a[9] == 81 and a.capacity == 16
assert a.pop() == 81 and len(a) == 9
for bad in (9, -1):
    try:
        a[bad]
        assert False, 'Index outside 0..len-1 must raise IndexError.'
    except IndexError:
        pass
while len(a):
    a.pop()
try:
    a.pop()
    assert False, 'pop from empty must raise IndexError.'
except IndexError:
    pass
assert a.capacity == 1, 'The array shrinks back to capacity 1.'
assert len(a.data) == a.capacity, 'Use the fixed-size list as raw storage.'` },
          { name: "amortised", code: `import random
rng = random.Random(4)
a = DynamicArray()
ops = 0
for _ in range(20000):
    ops += 1
    if len(a) and rng.random() < 0.45:
        a.pop()
    else:
        a.append(0)
    assert len(a) <= a.capacity and (a.capacity == 1 or len(a) > a.capacity // 4 - 1), 'Keep the array between a quarter and fully used.'
assert a.copies <= 3 * ops, f'{a.copies} copies for {ops} operations is not amortised O(1).'` },
          { name: "no thrashing", code: `a = DynamicArray()
for i in range(1024):
    a.append(i)
before = a.copies
for _ in range(5000):
    a.append(0)
    a.pop()
assert a.copies - before <= 3000, 'Alternating at a boundary must not resize every time.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            A queue can be built from two stacks: push onto an <em>in</em> stack, and pop from an <em>out</em> stack, refilling
            <em> out</em> by moving everything across from <em>in</em> only when <em>out</em> is empty. Write{" "}
            <C>TwoStackQueue</C> with <C>push(x)</C>, <C>pop()</C> and <C>peek()</C> (both raising <C>IndexError</C> when empty)
            and <C>__len__</C>, using two Python lists with only <C>append</C> and <C>pop()</C>. Count every item moved from
            <em> in</em> to <em>out</em> in <C>self.moves</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class TwoStackQueue:
    def __init__(self):
        self.items = []
        self.moves = 0

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def __len__(self):
        return len(self.items)
`,
        solution: `class TwoStackQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []
        self.moves = 0

    def push(self, x):
        self.inbox.append(x)

    def _refill(self):
        if not self.outbox:
            while self.inbox:
                self.outbox.append(self.inbox.pop())
                self.moves += 1
        if not self.outbox:
            raise IndexError('empty queue')

    def pop(self):
        self._refill()
        return self.outbox.pop()

    def peek(self):
        self._refill()
        return self.outbox[-1]

    def __len__(self):
        return len(self.inbox) + len(self.outbox)
`,
        tests: [
          { name: "fifo", code: `q = TwoStackQueue()
for x in 'abc':
    q.push(x)
assert q.pop() == 'a' and q.peek() == 'b'
q.push('d')
assert [q.pop() for _ in range(3)] == ['b', 'c', 'd'] and len(q) == 0
for f in (q.pop, q.peek):
    try:
        f()
        assert False, 'An empty queue must raise IndexError.'
    except IndexError:
        pass` },
          { name: "random", code: `import random
from collections import deque
rng = random.Random(7)
q, ref, pushes = TwoStackQueue(), deque(), 0
for i in range(5000):
    if ref and rng.random() < 0.5:
        assert q.pop() == ref.popleft()
    else:
        q.push(i); ref.append(i); pushes += 1
    assert len(q) == len(ref)
    if ref:
        assert q.peek() == ref[0]
assert q.moves <= pushes, 'Each item crosses from in to out at most once.'` },
          { name: "lazy refill", code: `q = TwoStackQueue()
for x in range(1, 5):
    q.push(x)
assert q.pop() == 1 and q.moves == 4, 'The first pop moves all four items across.'
q.push(5)
assert [q.pop() for _ in range(3)] == [2, 3, 4] and q.moves == 4, 'Refill only when out is empty.'
assert q.pop() == 5 and q.moves == 5` },
        ],
      },
    },
    {
      key: "counter-proof",
      rung: "prove",
      prompt: <p>Using the potential Φ = number of 1 bits, prove that n increments of a binary counter starting at 0 flip at most 2n bits.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes Φ starts at 0 and is never negative.",
          "If an increment clears t trailing 1s and sets one bit, its actual cost is t + 1 and Φ changes by 1 − t.",
          "So its amortised cost is (t + 1) + (1 − t) = 2.",
          "Sums: total actual cost ≤ total amortised cost = 2n, by the potential method.",
        ],
      },
    },
    {
      key: "thrash",
      rung: "stretch",
      prompt: (
        <p>
          Show that a dynamic array which doubles when full and halves when a pop leaves it exactly half full can take Θ(n²) time
          for some sequence of n operations, and explain why halving at a quarter avoids it.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Builds the array to a power of two m = 2ᵏ items, full, using Θ(m) work.",
          "Then alternates append (doubling, copying m items) and pop (halving, copying m items), each Θ(m).",
          "With about n/2 such operations and m ≈ n/2, the total is Θ(n²).",
          "With the quarter rule, after any resize the array is half full, so at least m/4 operations separate resizes, which pay for the next copy: O(1) amortised.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how append can be O(1) when it sometimes copies the whole list, and why the array must grow by a factor rather than a fixed amount.",

  glimpse: (
    <p>
      Amortised bounds recur all through the course: the dynamic arrays of the next chapter, hash tables that rehash as they
      fill, and union-find in minimum spanning trees. In systems work the same idea appears as batching, where an expensive
      operation such as a GPU kernel launch is paid for once by many cheap pieces of work.
    </p>
  ),
};
