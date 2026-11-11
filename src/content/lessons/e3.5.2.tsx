import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RaceViz } from "@/components/viz/RaceViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.5.2",
  minutes: 60,
  links: {
    requires: ["e3.5.1"],
    revisits: ["e3.1.2", "e2.6.2"],
    foreshadows: ["e3.5.3", "e4.3.1", "e4.2.1"],
  },

  puzzle: (
    <>
      <p>
        Two people at two cash machines withdraw 80 from an account holding 100, and both get their money. A training run
        with the same seed gives a slightly different loss each time on a GPU, because some kernels add numbers in whatever
        order the threads finish. A web service passes every test and fails once a week in production. All three are races.
        How do you reason about code whose result depends on timing, and how do tools find races that have not happened
        yet?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>race condition</strong> is any bug where the result depends on how threads interleave. The commonest shape
        is <strong>check-then-act</strong>: test a condition, then act on it, while another thread changes the condition in
        between. Locks are one fix; another is an atomic <strong>compare-and-swap</strong>, which writes a new value only if
        the old one is still what you saw, and otherwise tells you to try again. Step the two withdrawals below in both
        versions.
      </p>
      <RaceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="atomic operations">
        <p>
          An operation is <strong>atomic</strong> if no other thread can observe it half done. Processors provide atomic
          read-modify-write instructions: fetch-and-add, exchange, and compare-and-swap,{" "}
          <C>CAS(addr, expected, new)</C>, which in one indivisible step stores new at addr if addr holds expected and reports
          whether it did. Locks, lock-free queues and reference counts in multithreaded runtimes are all built on them.
        </p>
        <Code>{`while True:                       # a lock-free increment
    seen = x.load()
    if x.compare_and_swap(seen, seen + 1):
        break`}</Code>
      </Definition>

      <Theorem title="CAS loops lose no updates">
        <p>
          If k threads each run the CAS increment loop once on a cell starting at v, the cell ends at v + k, and whenever some
          thread is still trying, some thread completes in a bounded number of system-wide steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          The cell changes only by a successful CAS, and a successful CAS replaces seen by seen + 1 where seen is the current
          value, so each success adds exactly 1. Each thread leaves its loop after exactly one success, so there are k
          successes and the cell ends at v + k. A thread&rsquo;s CAS fails only if the cell changed after it read, which means
          another thread&rsquo;s CAS succeeded in between: every failure is caused by someone else&rsquo;s progress. This is
          the lock-free guarantee: individual threads may retry, but the system as a whole always advances, and no thread
          holding a lock can be paused and block everyone else.
        </p>
      </Proof>

      <Definition title="data races and happens-before">
        <p>
          Event a <strong>happens before</strong> b if they are in the same thread with a first, or a releases a lock that b
          later acquires, or a chain of these links them. Two accesses to the same variable by different threads, at least
          one a write, form a <strong>data race</strong> if neither happens before the other. Vector clocks track this: each
          thread keeps a counter for every thread, ticks its own on each event, and on acquiring a lock takes the elementwise
          maximum with the clock left by the last release. Then a happens before b exactly when V(a) ≤ V(b) elementwise and V(a)
          ≠ V(b).
        </p>
      </Definition>

      <Example title="finding races before they bite">
        <p>
          ThreadSanitizer (<C>-fsanitize=thread</C>) instruments every memory access and lock operation with this
          happens-before analysis. It reports a race from a single run in which the bad interleaving did not occur, because
          it only needs to see two conflicting accesses that nothing orders. That is far more effective than rerunning tests
          and hoping the timing goes wrong.
        </p>
      </Example>

      <Remark title="nondeterminism in deep learning">
        <p>
          Floating-point addition is not associative, so when thousands of GPU threads add into one value with atomic adds,
          the sum depends on their order. <C>scatter_add</C>, some convolution backward passes and embedding gradients behave
          like this, which is why <C>torch.use_deterministic_algorithms(True)</C> exists and why it can be slower: it replaces
          atomics with fixed-order reductions. Bit-for-bit reproducibility needs the seed, the deterministic kernels and the
          same hardware and library versions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>Which pair of accesses is a data race?</p>,
      answer: {
        kind: "choice",
        options: [
          "Thread 1 writes x with no lock while thread 2 reads x with no lock",
          "Thread 1 and thread 2 both read x with no lock",
          "Both threads write x, each while holding the same lock",
          "Thread 1 writes x, then starts thread 2, which reads x",
        ],
        correct: [0],
      },
    },
    {
      key: "retries",
      rung: "apply",
      prompt: <p>Ten threads all read a counter, and then their CAS increments are attempted one thread at a time: each thread retries, rereading the counter, until its CAS succeeds, before the next thread starts. How many CAS attempts fail in total?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "pairs",
      rung: "apply",
      prompt: <p>Thread 0 writes x and releases lock m. Thread 1 then acquires m and writes x. Thread 2, which never takes a lock, then reads x. How many pairs of these three accesses are data races?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import itertools
import math

xs = [1e16, 1.0, -1e16, 1.0]

def total(order):
    s = 0.0
    for i in order:
        s += xs[i]
    return s

outs = sorted({total(p) for p in itertools.permutations(range(4))})
print(outs, math.fsum(xs), sum(sorted(xs, key=abs)))`}</Code>
          <p>Summing the same four numbers in every order. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.0, 1.0, 2.0] 2.0 2.0", "[2.0] 2.0 2.0", "[0.0, 2.0] 2.0 0.0", "[0.0, 1.0, 2.0] 2.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Cell:
    def __init__(self, v):
        self.v = v

    def cas(self, old, new):          # atomic in hardware
        if self.v == old:
            self.v = new
            return True
        return False

cell = Cell(0)
retries = 0
seen = [cell.v for _ in range(3)]     # three threads all read 0 first
for t in range(3):
    while not cell.cas(seen[t], seen[t] + 1):
        retries += 1
        seen[t] = cell.v
print(cell.v, retries, cell.cas(3, 10), cell.v, cell.cas(3, 11))`}</Code>
          <p>Compare-and-swap with retries. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["3 2 True 10 False", "1 0 False 1 False", "3 3 True 10 True", "3 2 True 10 True"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>explore(threads, init, max_steps=100000)</C>, a model checker for arbitrary code. Each thread is a list
            of step functions <C>f(shared, local)</C>, each run atomically: shared is a dict common to all threads (starting as
            a copy of init) and local a dict private to the thread (starting empty). A step returns None to go on to the next
            step, or an index to jump to; a thread finishes when it runs past its last step. Return the set of all reachable
            final shared states, each as <C>tuple(sorted(shared.items()))</C>, and raise <C>RuntimeError</C> once more than
            max_steps steps have been executed in total.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def explore(threads, init, max_steps=100000):
    shared = dict(init)
    locals_ = [dict() for _ in threads]
    for t, steps in enumerate(threads):
        pc = 0
        while pc < len(steps):
            jump = steps[pc](shared, locals_[t])
            pc = pc + 1 if jump is None else jump
    return {tuple(sorted(shared.items()))}
`,
        solution: `import copy


def explore(threads, init, max_steps=100000):
    finals = set()
    steps = 0
    start = (dict(init), [dict() for _ in threads], [0] * len(threads))
    stack = [start]
    while stack:
        shared, locals_, pcs = stack.pop()
        live = [t for t in range(len(threads)) if pcs[t] < len(threads[t])]
        if not live:
            finals.add(tuple(sorted(shared.items())))
            continue
        for t in live:
            steps += 1
            if steps > max_steps:
                raise RuntimeError('state space too large')
            s, l, p = copy.deepcopy((shared, locals_, pcs))
            jump = threads[t][p[t]](s, l[t])
            p[t] = p[t] + 1 if jump is None else jump
            stack.append((s, l, p))
    return finals
`,
        tests: [
          { name: "races found", code: `def load(s, l): l['r'] = s['x']
def add(s, l): l['r'] += 1
def store(s, l): s['x'] = l['r']
INC = [load, add, store]
assert explore([INC, INC], {'x': 0}) == {(('x', 1),), (('x', 2),)}, 'The lost update.'
assert explore([INC], {'x': 5}) == {(('x', 6),)}
def atomic_inc(s, l): s['x'] += 1
assert explore([[atomic_inc], [atomic_inc], [atomic_inc]], {'x': 0}) == {(('x', 3),)}
def check(s, l):
    if s['bal'] < 80:
        return 2                      # skip to the end
def take(s, l): s['bal'] -= 80
W = [check, take]
assert explore([W, W], {'bal': 100}) == {(('bal', -60),), (('bal', 20),)}, 'Check-then-act can overdraw.'
def countdown(s, l):
    s['n'] -= 1
    if s['n'] > 0:
        return 0                      # loop back to this step
assert explore([[countdown]], {'n': 4}) == {(('n', 0),)}, 'A returned index is a jump.'
def spin(s, l): return 0
try:
    explore([[spin]], {}, max_steps=500)
    assert False, 'An endless loop must hit max_steps and raise RuntimeError.'
except RuntimeError:
    pass` },
          { name: "CAS is safe", code: `def read(s, l): l['seen'] = s['bal']
def cas(s, l):
    if l['seen'] < 80:
        return 2                      # not enough money: give up
    if s['bal'] == l['seen']:
        s['bal'] = l['seen'] - 80     # compare-and-swap succeeded
        return 2
    return 0                          # someone changed it: retry
W = [read, cas]
assert explore([W, W], {'bal': 100}) == {(('bal', 20),)}, 'Compare-and-swap never overdraws.'
assert explore([W, W], {'bal': 200}) == {(('bal', 40),)}, 'Both succeed when there is enough.'
def read2(s, l): l['seen'] = s['x']
def cas_inc(s, l):
    if s['x'] == l['seen']:
        s['x'] = l['seen'] + 1
        return 2
    return 0
INC = [read2, cas_inc]
assert explore([INC, INC, INC], {'x': 0}) == {(('x', 3),)}, 'A CAS loop loses no increments.'
def a(s, l): s['log'] = s['log'] + 'a'
def b(s, l): s['log'] = s['log'] + 'b'
assert explore([[a, a], [b]], {'log': ''}) == {(('log', 'aab'),), (('log', 'aba'),), (('log', 'baa'),)}
assert explore([[a], [b]], {'log': '', 'z': 1}) == {(('log', 'ab'), ('z', 1)), (('log', 'ba'), ('z', 1))}, 'Each state is the sorted items of the shared dict.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a race detector. Events are <C>(thread, op, target)</C> with threads numbered from 0 and op one of{" "}
            <C>&apos;read&apos;</C>, <C>&apos;write&apos;</C>, <C>&apos;acquire&apos;</C>, <C>&apos;release&apos;</C>.
          </p>
          <ul>
            <li>
              <C>vector_clocks(events)</C>: one tuple per event. The acting thread first ticks its own entry; on acquire it
              then takes the elementwise maximum with the clock stored by the last release of that lock, if any; the event&rsquo;s
              stamp is the resulting clock, and a release stores it in the lock.
            </li>
            <li><C>happens_before(a, b)</C> on two stamps.</li>
            <li>
              <C>find_races(events)</C>: the sorted list of index pairs (i, j), i &lt; j, of accesses to the same variable by
              different threads, at least one a write, neither happening before the other.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def vector_clocks(events):
    n = 1 + max((t for t, _, _ in events), default=-1)
    return [tuple(k + 1 if u == t else 0 for u in range(n)) for k, (t, _, _) in enumerate(events)]


def happens_before(a, b):
    return sum(a) < sum(b)


def find_races(events):
    return []
`,
        solution: `def vector_clocks(events):
    n = 1 + max((t for t, _, _ in events), default=-1)
    clock = [[0] * n for _ in range(n)]
    locks = {}
    stamps = []
    for t, op, target in events:
        c = clock[t]
        c[t] += 1
        if op == 'acquire' and target in locks:
            c[:] = [max(a, b) for a, b in zip(c, locks[target])]
        stamps.append(tuple(c))
        if op == 'release':
            locks[target] = list(c)
    return stamps


def happens_before(a, b):
    return a != b and all(x <= y for x, y in zip(a, b))


def find_races(events):
    stamps = vector_clocks(events)
    races = []
    for i, (ti, oi, vi) in enumerate(events):
        if oi not in ('read', 'write'):
            continue
        for j in range(i + 1, len(events)):
            tj, oj, vj = events[j]
            if oj not in ('read', 'write') or vj != vi or tj == ti or 'write' not in (oi, oj):
                continue
            if not happens_before(stamps[i], stamps[j]) and not happens_before(stamps[j], stamps[i]):
                races.append((i, j))
    return races
`,
        tests: [
          { name: "vector clocks", code: `E = [(0, 'write', 'x'), (0, 'release', 'm'), (1, 'acquire', 'm'), (1, 'read', 'x')]
assert vector_clocks(E) == [(1, 0), (2, 0), (2, 1), (2, 2)], 'Acquiring m joins the clock left by the release.'
E = [(0, 'write', 'x'), (1, 'read', 'x'), (0, 'write', 'y')]
assert vector_clocks(E) == [(1, 0), (0, 1), (2, 0)], 'No synchronisation: clocks stay independent.'
E = [(1, 'acquire', 'm'), (0, 'write', 'x'), (2, 'read', 'x')]
assert vector_clocks(E) == [(0, 1, 0), (1, 0, 0), (0, 0, 1)], 'Acquiring a lock nobody released joins nothing.'
assert vector_clocks([]) == []
assert happens_before((1, 0), (2, 1)) and not happens_before((1, 0), (0, 1)) and not happens_before((0, 1), (1, 0))
assert not happens_before((2, 2), (2, 2)), 'Nothing happens before itself.'
E = [(0, 'release', 'a'), (1, 'acquire', 'a'), (1, 'release', 'b'), (2, 'acquire', 'b'), (2, 'read', 'z')]
st = vector_clocks(E)
assert happens_before(st[0], st[4]), 'Happens-before is transitive through a chain of locks.'` },
          { name: "races", code: `E = [(0, 'write', 'x'), (1, 'write', 'x')]
assert find_races(E) == [(0, 1)]
E = [(0, 'read', 'x'), (1, 'read', 'x')]
assert find_races(E) == [], 'Two reads never race.'
E = [(0, 'acquire', 'm'), (0, 'write', 'x'), (0, 'release', 'm'), (1, 'acquire', 'm'), (1, 'write', 'x'), (1, 'release', 'm')]
assert find_races(E) == [], 'Both writes under the same lock.'
E = [(0, 'acquire', 'm'), (0, 'write', 'x'), (0, 'release', 'm'), (1, 'acquire', 'n'), (1, 'write', 'x'), (1, 'release', 'n')]
assert find_races(E) == [(1, 4)], 'Different locks do not order anything.'
E = [(0, 'write', 'x'), (0, 'write', 'y'), (1, 'read', 'y'), (1, 'write', 'x'), (0, 'read', 'x')]
assert find_races(E) == [(0, 3), (1, 2), (3, 4)], 'Every conflicting cross-thread pair is reported, in order.'
E = [(0, 'write', 'x'), (0, 'release', 'm'), (1, 'acquire', 'm'), (1, 'write', 'x'), (2, 'read', 'x')]
assert find_races(E) == [(0, 4), (3, 4)], 'Thread 2 never synchronised with anyone.'` },
        ],
      },
    },
    {
      key: "vc",
      rung: "prove",
      prompt: <p>Prove that if event a happens before event b (by program order, release-to-acquire, and transitivity), then V(a) ≤ V(b) elementwise and V(a) ≠ V(b), for the vector clocks defined in this lesson.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Clocks never decrease: each step only ticks an entry or takes a maximum.",
          "Program order: a thread's clock at b is at least its clock at a, and its own entry has been ticked at least once more.",
          "Release to acquire: the lock stores V(a) at the release, and the acquire takes the maximum with it and ticks, so V(a) ≤ V(b) with V(b) larger in the acquiring thread's entry.",
          "Transitivity: ≤ is transitive and strictness is preserved along a chain, giving the result by induction on the length of the chain.",
        ],
      },
    },
    {
      key: "two",
      rung: "stretch",
      prompt: <p>Two threads each run <C>x = x + 1</C> (load, add, store) 1000 times on a shared x = 0, with no lock. Prove that the final x can be as small as 2, and that it cannot be 1.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Construction: A loads 0; B runs 999 full increments (x = 999); A stores 1; B loads 1; A runs its remaining 999 increments (x = 1000); B stores 2.",
          "Checks that this is a valid interleaving in which each thread executes exactly 1000 increments.",
          "Lower bound: every store writes a loaded value plus 1, and x starts at 0, so every stored value is at least 1 and once any store has happened x ≥ 1 forever.",
          "The final value is written by the last store, made by some thread in its 1000th increment; that increment's load comes after the same thread's 999th store, so it reads at least 1 and the final value is at least 2.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why 'if balance >= 80: balance -= 80' is unsafe with two threads, and how compare-and-swap fixes it without a lock.",

  glimpse: (
    <p>
      Threads let a program wait for many things at once, at the price of races. Next, asynchronous I/O: one thread, an
      event loop, and coroutines that wait without blocking.
    </p>
  ),
};
