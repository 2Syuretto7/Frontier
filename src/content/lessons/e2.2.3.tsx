import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RingBufferViz } from "@/components/viz/RingBufferViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e2.2.3",
  minutes: 60,
  links: {
    requires: ["e2.2.2"],
    revisits: ["e0.6.1"],
    foreshadows: ["e2.6.1", "e5.3.3", "e3.5.3"],
  },

  puzzle: (
    <>
      <p>
        Your editor underlines the bracket that does not match in <C>{"f(a[i], {k: g(x)}])"}</C> almost before you finish typing.
        It does not try every way of pairing the brackets up. It reads left to right once, remembering only a short list of
        brackets still waiting for a partner. Which end of that list does each closing bracket look at, and why is that enough?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A closing bracket must match the most recent opening bracket that is still open. &ldquo;Most recent first&rdquo; is a{" "}
        <strong>stack</strong>: push each opener, and on each closer pop the top and check it matches. The opposite discipline,
        &ldquo;oldest first&rdquo;, is a <strong>queue</strong>: a print queue, a batch of requests, the frontier of a
        breadth-first search. Both restrict access to the ends, and that restriction is exactly what lets them run in O(1) per
        operation on an array. A queue on an array uses a ring: the front and back chase each other round a fixed block.
      </p>
      <RingBufferViz />
    </>
  ),

  theory: (
    <>
      <Definition title="stack, queue, deque">
        <ul>
          <li>A <strong>stack</strong> supports push, pop and peek at one end: last in, first out (LIFO).</li>
          <li>A <strong>queue</strong> supports enqueue at the back and dequeue at the front: first in, first out (FIFO).</li>
          <li>A <strong>deque</strong> (double-ended queue) supports push and pop at both ends.</li>
        </ul>
        <p>
          In Python, a list is a fine stack (<C>append</C>, <C>pop()</C>, <C>xs[-1]</C>, all O(1)), but a poor queue, since{" "}
          <C>pop(0)</C> is Θ(n). Use <C>collections.deque</C>, whose <C>append</C>, <C>appendleft</C>, <C>pop</C> and{" "}
          <C>popleft</C> are all O(1).
        </p>
      </Definition>

      <Definition title="the ring buffer">
        <p>
          A queue of capacity m keeps an array of m slots, the index <C>head</C> of the front item and the count n. The back is
          at <C>(head + n) % m</C>. Enqueue writes there and increments n; dequeue reads <C>head</C>, sets{" "}
          <C>head = (head + 1) % m</C> and decrements n. Nothing ever shifts. A bounded ring buffer is the standard way to pass
          data between a producer and a consumer that run at different speeds, such as a data loader and a training loop: when
          it is full, the producer waits, which is called <strong>backpressure</strong>.
        </p>
      </Definition>

      <Example title="evaluating postfix">
        <p>
          In postfix (reverse Polish) notation operators follow their operands: <C>3 4 + 2 *</C> means (3 + 4) × 2. Evaluate
          with a stack: push numbers; on an operator pop b, then a, and push a op b. The answer is the one item left. Dijkstra&rsquo;s{" "}
          <strong>shunting-yard algorithm</strong> converts ordinary infix to postfix with a second stack of operators, popping
          operators of higher precedence (or equal precedence, for left-associative ones) before pushing a new one.
        </p>
        <Code>{`def eval_postfix(tokens):
    st = []
    for t in tokens:
        if t in "+-*/":
            b, a = st.pop(), st.pop()
            st.append({"+": a + b, "-": a - b, "*": a * b, "/": a / b}[t])
        else:
            st.append(float(t))
    return st.pop()`}</Code>
      </Example>

      <Theorem title="monotonic stacks are linear">
        <p>
          To find, for each item, the next item to its right that is larger, scan left to right with a stack of indices whose
          values decrease from bottom to top. Before pushing index i, pop every index whose value is below <C>xs[i]</C>; i is
          the answer for each of them. The whole scan is O(n).
        </p>
      </Theorem>
      <Proof>
        <p>
          Each index is pushed exactly once and popped at most once, so the total number of pushes and pops is at most 2n,
          although a single step can pop many indices.
        </p>
      </Proof>

      <Example title="the sliding window maximum">
        <p>
          The maximum of every window of k consecutive items keeps a deque of indices whose values decrease from front to back.
          A new item pops smaller ones off the back (they can never be a maximum again while it is in the window), and the front
          is dropped when it slides out of the window. The front is always the current maximum, and the same argument makes the
          whole pass O(n), against O(nk) for recomputing every window.
        </p>
      </Example>

      <Remark title="the call stack">
        <p>
          Every function call pushes a frame (its local variables and where to return) onto the program&rsquo;s call stack, and
          every return pops it. Deep recursion overflows it, which is why Python limits recursion depth to about 1000 by
          default, and why an explicit stack is how you turn a recursive algorithm into a loop.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "queue",
      rung: "check",
      prompt: <p>Why is a Python list a poor queue?</p>,
      answer: { kind: "choice", options: ["pop(0) shifts every remaining item, Θ(n)", "append is O(n)", "Lists cannot hold mixed types", "Lists are not thread-safe"], correct: [0] },
    },
    {
      key: "ring",
      rung: "check",
      prompt: <p>A ring buffer of capacity 8 has head = 6 and holds 4 items. At which slot does the next enqueue write?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "rpn",
      rung: "apply",
      prompt: <p>Evaluate the postfix expression <C>3 4 + 2 * 7 -</C>.</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "brackets",
      rung: "apply",
      prompt: <p>Which of these strings is balanced?</p>,
      answer: { kind: "choice", options: ["{[()()]}", "([)]", "(()", "())("], correct: [0] },
    },
    {
      key: "depth",
      rung: "apply",
      prompt: <p>Checking <C>(()(()))</C> with a stack, what is the largest number of items on the stack at any moment?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def next_greater(xs):
    out, st = [-1] * len(xs), []
    for i, x in enumerate(xs):
        while st and xs[st[-1]] < x:
            out[st.pop()] = x
        st.append(i)
    return out, st

print(next_greater([2, 7, 3, 5, 4, 6, 8, 1]))`}</Code>
          <p>A monotonic stack of indices. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["([7, 8, 5, 6, 6, 8, -1, -1], [6, 7])", "([7, 8, 5, 6, 6, 8, 8, -1], [7])", "([7, 8, 5, 6, 6, 8, -1, -1], [1, 6, 7])", "([7, 8, 4, 6, 6, 8, -1, -1], [6, 7])"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque

def window_max(xs, k):
    dq, out = deque(), []
    for i, x in enumerate(xs):
        while dq and xs[dq[-1]] <= x:
            dq.pop()
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()
        if i >= k - 1:
            out.append(xs[dq[0]])
    return out

print(window_max([1, 3, -1, -3, 5, 3, 6, 7], 3), window_max([4, 3, 2, 1], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[3, 3, 5, 5, 6, 7] [4, 3, 2]", "[3, 3, 5, 5, 6, 7] [4, 4, 3]", "[3, 3, 3, 5, 6, 7] [4, 3, 2]", "[1, 3, 3, 5, 5, 6, 7] [4, 3, 2]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>RingBuffer(capacity, overwrite=False)</C> using one Python list of fixed length, a head index and a count.
            Implement <C>push(x)</C> (when full, raise <C>OverflowError</C>, or, if <C>overwrite</C> is true, drop the oldest
            item to make room), <C>pop()</C> (remove and return the oldest; <C>IndexError</C> if empty), <C>peek()</C>,{" "}
            <C>__len__</C> and <C>__iter__</C> (oldest to newest, without removing anything). The list must never grow or
            shrink.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class RingBuffer:
    def __init__(self, capacity, overwrite=False):
        self.items = []

    def push(self, x):
        self.items.append(x)

    def pop(self):
        return self.items.pop()

    def peek(self):
        return self.items[-1]

    def __len__(self):
        return len(self.items)

    def __iter__(self):
        return iter(self.items)
`,
        solution: `class RingBuffer:
    def __init__(self, capacity, overwrite=False):
        self.buf = [None] * capacity
        self.head = 0
        self.n = 0
        self.overwrite = overwrite

    def push(self, x):
        m = len(self.buf)
        if self.n == m:
            if not self.overwrite:
                raise OverflowError('ring buffer is full')
            self.buf[self.head] = x
            self.head = (self.head + 1) % m
            return
        self.buf[(self.head + self.n) % m] = x
        self.n += 1

    def pop(self):
        if self.n == 0:
            raise IndexError('pop from empty ring buffer')
        x = self.buf[self.head]
        self.buf[self.head] = None
        self.head = (self.head + 1) % len(self.buf)
        self.n -= 1
        return x

    def peek(self):
        if self.n == 0:
            raise IndexError('peek at empty ring buffer')
        return self.buf[self.head]

    def __len__(self):
        return self.n

    def __iter__(self):
        for k in range(self.n):
            yield self.buf[(self.head + k) % len(self.buf)]
`,
        tests: [
          { name: "fifo and wrap", code: `r = RingBuffer(3)
r.push(1); r.push(2); r.push(3)
try:
    r.push(4)
    assert False, 'A full buffer must raise OverflowError.'
except OverflowError:
    pass
assert r.pop() == 1 and r.peek() == 2
r.push(4)
assert list(r) == [2, 3, 4] and len(r) == 3
assert [r.pop() for _ in range(3)] == [2, 3, 4]
for f in (r.pop, r.peek):
    try:
        f()
        assert False, 'An empty buffer must raise IndexError.'
    except IndexError:
        pass` },
          { name: "overwrite", code: `r = RingBuffer(3, overwrite=True)
for i in range(1, 8):
    r.push(i)
assert list(r) == [5, 6, 7] and r.pop() == 5 and list(r) == [6, 7]` },
          { name: "random", code: `import random
from collections import deque
rng = random.Random(3)
r, ref = RingBuffer(5), deque()
store = None
for i in range(4000):
    if ref and rng.random() < 0.5:
        assert r.pop() == ref.popleft()
    elif len(ref) < 5:
        r.push(i); ref.append(i)
    assert list(r) == list(ref) and len(r) == len(ref)
    lists = [v for v in vars(r).values() if isinstance(v, list)]
    assert len(lists) == 1 and len(lists[0]) == 5, 'Use one list of fixed length.'
    if store is None:
        store = lists[0]
    assert lists[0] is store, 'Never replace the storage list.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a calculator. The starter&rsquo;s <C>tokenize(s)</C> turns a string into numbers (as floats) and the strings{" "}
            <C>+ - * / ^ ( )</C>, and <C>PREC</C> gives each operator&rsquo;s precedence. Write <C>to_rpn(tokens)</C>, which converts
            infix to postfix with the shunting-yard algorithm: <C>^</C> binds tightest and is right-associative, then <C>*</C>{" "}
            and <C>/</C>, then <C>+</C> and <C>-</C>, all left-associative; raise <C>ValueError</C> on unbalanced brackets.{" "}
            Then write <C>eval_rpn(rpn)</C>, which evaluates postfix with a stack, raising <C>ValueError</C> if the expression is
            malformed. The starter&rsquo;s <C>evaluate(s)</C> chains the three. There is no unary minus.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `PREC = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}

def tokenize(s):
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c.isspace():
            i += 1
        elif c.isdigit() or c == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'):
                j += 1
            out.append(float(s[i:j]))
            i = j
        elif c in PREC or c in '()':
            out.append(c)
            i += 1
        else:
            raise ValueError(f'unexpected {c!r}')
    return out

def to_rpn(tokens):
    return tokens

def eval_rpn(rpn):
    return 0.0

def evaluate(s):
    return eval_rpn(to_rpn(tokenize(s)))
`,
        solution: `PREC = {'+': 1, '-': 1, '*': 2, '/': 2, '^': 3}

def tokenize(s):
    out, i = [], 0
    while i < len(s):
        c = s[i]
        if c.isspace():
            i += 1
        elif c.isdigit() or c == '.':
            j = i
            while j < len(s) and (s[j].isdigit() or s[j] == '.'):
                j += 1
            out.append(float(s[i:j]))
            i = j
        elif c in PREC or c in '()':
            out.append(c)
            i += 1
        else:
            raise ValueError(f'unexpected {c!r}')
    return out

def to_rpn(tokens):
    out, ops = [], []
    for t in tokens:
        if isinstance(t, float):
            out.append(t)
        elif t == '(':
            ops.append(t)
        elif t == ')':
            while ops and ops[-1] != '(':
                out.append(ops.pop())
            if not ops:
                raise ValueError('unbalanced )')
            ops.pop()
        else:
            while ops and ops[-1] != '(' and (PREC[ops[-1]] > PREC[t] or (PREC[ops[-1]] == PREC[t] and t != '^')):
                out.append(ops.pop())
            ops.append(t)
    while ops:
        if ops[-1] == '(':
            raise ValueError('unbalanced (')
        out.append(ops.pop())
    return out

def eval_rpn(rpn):
    st = []
    for t in rpn:
        if isinstance(t, float):
            st.append(t)
            continue
        if len(st) < 2:
            raise ValueError('missing operand')
        b, a = st.pop(), st.pop()
        st.append(a + b if t == '+' else a - b if t == '-' else a * b if t == '*' else a / b if t == '/' else a ** b)
    if len(st) != 1:
        raise ValueError('malformed expression')
    return st[0]

def evaluate(s):
    return eval_rpn(to_rpn(tokenize(s)))
`,
        tests: [
          { name: "rpn", code: `assert tokenize("12+3.5 *(2)") == [12.0, '+', 3.5, '*', '(', 2.0, ')']
assert to_rpn(tokenize("3 + 4 * 2")) == [3.0, 4.0, 2.0, '*', '+']
assert to_rpn(tokenize("8 - 3 - 2")) == [8.0, 3.0, '-', 2.0, '-'], '- is left-associative.'
assert to_rpn(tokenize("2 ^ 3 ^ 2")) == [2.0, 3.0, 2.0, '^', '^'], '^ is right-associative.'
assert evaluate("2 ^ 3 ^ 2") == 512 and evaluate("(1 + 2) * (3 + 4) / 7") == 3` },
          { name: "errors", code: `for bad in ["(1 + 2", "1 + 2)", "1 +", "1 2", "2 $ 3", ")("]:
    try:
        evaluate(bad)
        assert False, f'{bad!r} should raise ValueError'
    except ValueError:
        pass` },
          { name: "random", code: `import random
rng = random.Random(5)
def gen(d):
    if d == 0 or rng.random() < 0.3:
        return f'{rng.randint(1, 9)}.0'
    op = rng.choice('+-*/+-*/^')
    left, right = gen(d - 1), gen(0 if op == '^' else d - 1)
    s = f'{left} {op} {right}'
    return f'({s})' if rng.random() < 0.4 else s
checked = 0
for _ in range(600):
    s = gen(4)
    try:
        want = eval(s.replace('^', '**'))
    except (ZeroDivisionError, OverflowError):
        continue
    got = evaluate(s)
    assert abs(got - want) <= 1e-9 * max(1, abs(want)), (s, got, want)
    checked += 1
assert checked > 400` },
        ],
      },
    },
    {
      key: "linear",
      rung: "prove",
      prompt: <p>Prove that the sliding window maximum algorithm in the second reading exercise runs in O(n) time, and that the front of the deque is always the maximum of the current window.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Each index is appended once and removed at most once (from either end), so total work is O(n).",
          "Invariant: the deque holds indices in increasing order whose values strictly decrease from front to back.",
          "Any index popped from the back has a later index with a value at least as large, so it can never again be a window maximum.",
          "The front is the largest value among indices in the window, since anything larger and newer would have removed it, and stale indices are dropped from the front.",
        ],
      },
    },
    {
      key: "maxqueue",
      rung: "stretch",
      prompt: <p>Design a queue that supports enqueue, dequeue and max, each in O(1) amortised time. Explain why it is correct.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Keeps the ordinary queue plus a deque of candidate maxima, decreasing from front to back.",
          "Enqueue appends to the queue and pops smaller values off the back of the deque before appending the new value.",
          "Dequeue removes the front of the queue, and also the front of the deque if it is that same value.",
          "Max reads the front of the deque; each value enters and leaves the deque once, so operations are O(1) amortised.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how a stack checks brackets in one pass, and how a ring buffer gives a queue O(1) operations at both ends.",

  glimpse: (
    <p>
      Queues drive breadth-first search in the graphs chapter, and stacks drive depth-first search and every recursive
      algorithm. Bounded ring buffers reappear as the prefetch queues of data loaders, and in asynchronous programs as the
      channels between producers and consumers.
    </p>
  ),
};
