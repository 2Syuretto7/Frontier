import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TraceViz } from "@/components/viz/TraceViz";
import { code, steps } from "@/content/traces/e1.3.4";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.3.4",
  minutes: 55,
  links: {
    requires: ["e1.3.3"],
    revisits: ["e0.2.2", "e0.5.1"],
    parallels: ["m2.8.1"],
    foreshadows: ["e1.7.2"],
  },

  puzzle: (
    <>
      <p>
        A dataset of 50 million text lines does not fit in memory. Your training loop wants batches of 256 lines, one at a
        time, for as long as there are lines left.
      </p>
      <p>
        Can you write something that a <C>for</C> loop can walk through, which produces each batch only when asked, and never
        holds the whole dataset?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <C>for</C> loop does not need a list. It needs something that can be asked, again and again, &ldquo;what is
        next?&rdquo;, until it says &ldquo;nothing&rdquo;. A <strong>generator</strong> is the easiest way to write such a
        thing: a function that <C>yield</C>s values one at a time and pauses in between, keeping its place.
      </p>
      <TraceViz code={code} steps={steps} />
      <p>
        Notice the order of the output: one batch is made, then used, then the next is made. The generator and the loop take
        turns.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the iterator protocol">
        <p>
          An <strong>iterable</strong> is anything with <C>__iter__</C>, which returns an <strong>iterator</strong>. An iterator
          has <C>__next__</C>, which returns the next value or raises <C>StopIteration</C> when there are none. A{" "}
          <C>for</C> loop is shorthand for:
        </p>
        <Code>{`it = iter(items)
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    ...   # the loop body`}</Code>
        <p>An iterator is used up once it has been walked through; a list can be iterated again because each <C>iter</C> starts afresh.</p>
      </Definition>

      <Definition title="generators">
        <p>
          A function containing <C>yield</C> is a <strong>generator function</strong>. Calling it runs none of its body; it
          returns a generator, which is an iterator. Each <C>next</C> runs the body until the next <C>yield</C>, hands out that
          value and pauses. A <strong>generator expression</strong> such as <C>(x * x for x in data)</C> does the same in one
          line. Generators use memory for one item at a time, however long the sequence.
        </p>
      </Definition>

      <Definition title="context managers">
        <p>
          A <C>with</C> block guarantees that clean-up happens, even if an error is raised inside. The object after{" "}
          <C>with</C> provides <C>__enter__</C>, run at the start, and <C>__exit__</C>, run at the end whatever happens. Files
          close themselves this way. The quickest way to write one is a generator:
        </p>
        <Code>{`from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(label, round(time.perf_counter() - start, 3), "s")

with timer("epoch"):
    train_one_epoch()`}</Code>
      </Definition>

      <Remark title="where you will see them">
        <p>
          PyTorch&rsquo;s <C>DataLoader</C> is an iterable that yields batches; <C>with torch.no_grad():</C> is a context
          manager that turns off gradient tracking inside its block; <C>itertools</C> offers ready-made iterator tools such as{" "}
          <C>islice</C>, <C>chain</C> and <C>cycle</C>.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "call",
      rung: "check",
      prompt: <p>What does calling a generator function, such as <C>batches(data, 3)</C>, do immediately?</p>,
      answer: { kind: "choice", options: ["Returns a generator object without running the body", "Runs the whole body and returns a list", "Runs the body up to the first yield and prints"], correct: [0] },
    },
    {
      key: "with",
      rung: "check",
      prompt: <p>What does a <C>with</C> block guarantee?</p>,
      answer: { kind: "choice", options: ["The context manager's clean-up runs even if the block raises an error", "The block runs faster", "The block cannot raise errors"], correct: [0] },
    },
    {
      key: "made",
      rung: "apply",
      prompt: <p>In the traced program, how many times is <C>making batch from</C> printed?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "twice",
      rung: "apply",
      prompt: <p><C>g = (x * x for x in range(4))</C>. The first <C>sum(g)</C> gives 14. What does a second <C>sum(g)</C> give?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "count",
      rung: "apply",
      prompt: <p>The same <C>batches</C> generator is used with 10 items and size 3. How many batches does it yield?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def countdown(n):
    while n > 0:
        yield n
        n -= 1
g = countdown(3)
print(next(g), list(g), list(g))`}</Code>
          <p>A generator runs until it is exhausted, and only once. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 [2, 1] []", "3 [3, 2, 1] [3, 2, 1]", "3 [2, 1] [2, 1]", "[3, 2, 1] [] []"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from contextlib import contextmanager
log = []
@contextmanager
def tag(name):
    log.append("<" + name)
    try:
        yield len(log)
    finally:
        log.append(name + ">")
try:
    with tag("a") as n:
        log.append(n)
        raise ValueError
except ValueError:
    log.append("caught")
print(log)`}</Code>
          <p>A context manager built from a generator, with an exception inside the with block. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['<a', 1, 'a>', 'caught']", "['<a', 1, 'caught', 'a>']", "['<a', 1, 'caught']", "['<a', 0, 'a>', 'caught']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a generator <C>batches(items, size)</C> that yields lists of up to <C>size</C> items in order, without building all the batches at once. It must work on any iterable, including another generator.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def batches(items, size):
    items = list(items)
    return [items[i:i + size] for i in range(0, len(items), size)]
`,
        solution: `def batches(items, size):
    batch = []
    for x in items:
        batch.append(x)
        if len(batch) == size:
            yield batch
            batch = []
    if batch:
        yield batch
`,
        tests: [
          { name: "batches", code: `assert list(batches(range(7), 3)) == [[0, 1, 2], [3, 4, 5], [6]], 'The last batch may be short.'` },
          { name: "lazy", code: `import types
b = batches((x * x for x in range(5)), 2)
assert isinstance(b, types.GeneratorType) and next(b) == [0, 1] and next(b) == [4, 9], 'Use yield, so batches are produced one at a time, even from another generator.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a generator <C>windows(iterable, n)</C> that yields tuples of n consecutive items, holding only n items at a time (use <C>collections.deque(maxlen=n)</C>); a class <C>Peekable</C> that wraps any iterator, supports <C>for</C> loops and <C>next</C>, and has <C>peek(default)</C>, which returns the next item without consuming it (or default when exhausted); and a generator <C>interleave(*iterables)</C> that takes one item from each in turn, skipping those that have run out.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def windows(iterable, n):
    return iter([])

class Peekable:
    def __init__(self, it):
        self.it = iter(it)
    def __iter__(self):
        return self
    def __next__(self):
        return next(self.it)
    def peek(self, default=None):
        return default

def interleave(*iterables):
    for it in iterables:
        yield from it
`,
        solution: `from collections import deque

def windows(iterable, n):
    d = deque(maxlen=n)
    for x in iterable:
        d.append(x)
        if len(d) == n:
            yield tuple(d)

class Peekable:
    _EMPTY = object()
    def __init__(self, it):
        self.it = iter(it)
        self.buf = self._EMPTY
    def __iter__(self):
        return self
    def __next__(self):
        if self.buf is not self._EMPTY:
            x, self.buf = self.buf, self._EMPTY
            return x
        return next(self.it)
    def peek(self, default=None):
        if self.buf is self._EMPTY:
            try:
                self.buf = next(self.it)
            except StopIteration:
                return default
        return self.buf

def interleave(*iterables):
    its = deque(iter(i) for i in iterables)
    while its:
        it = its.popleft()
        try:
            x = next(it)
        except StopIteration:
            continue
        yield x
        its.append(it)
`,
        tests: [
          { name: "windows", code: `import itertools
assert list(windows([1, 2, 3, 4], 2)) == [(1, 2), (2, 3), (3, 4)] and list(windows([1], 3)) == []
assert list(itertools.islice(windows(itertools.count(), 3), 2)) == [(0, 1, 2), (1, 2, 3)], 'Works on an infinite generator.'` },
          { name: "peek", code: `p = Peekable(iter([1, 2, 3]))
assert p.peek() == 1 and p.peek() == 1 and next(p) == 1 and list(p) == [2, 3] and p.peek('end') == 'end'
q = Peekable([None, 5])
assert q.peek(7) is None and next(q) is None and q.peek(7) == 5, 'None is a real item, not a missing one.'` },
          { name: "interleave", code: `import itertools
assert list(interleave('abc', [1], (True, False))) == ['a', 1, True, 'b', False, 'c']
assert list(itertools.islice(interleave(itertools.count(), 'xy'), 6)) == [0, 'x', 1, 'y', 2, 3] and list(interleave()) == []` },
        ],
      },
    },
    {
      key: "lines",
      rung: "prove",
      prompt: (
        <p>
          Write a generator <C>read_batches(path, size)</C> that yields lists of up to <C>size</C> lines from a file too large
          for memory. Explain how much memory it needs, why the file is opened with <C>with</C>, and what happens to the last,
          short batch.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Opens the file with with open(path) as f, and iterates over f line by line.",
          "Accumulates lines in a list and yields it when it reaches size, then starts a new list.",
          "After the loop, yields the final partial batch if it is not empty.",
          "Explains that memory holds one batch at a time, and that with closes the file even if the consumer stops early or an error occurs.",
        ],
      },
    },
    {
      key: "next",
      rung: "stretch",
      prompt: <p><C>it = iter([1, 2, 3])</C>, then <C>next(it)</C>. What is <C>len(list(it))</C>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend what a for loop really does, how a generator pauses and resumes, and what a with block guarantees.",

  glimpse: (
    <p>
      Next, type hints and dataclasses, which make larger programs safer to change. Data loading, later in this course, streams
      and cleans files this way, one piece at a time.
    </p>
  ),
};
