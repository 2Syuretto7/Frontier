import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InterleaveViz } from "@/components/viz/InterleaveViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.5.1",
  minutes: 60,
  links: {
    requires: ["e3.4.1"],
    revisits: ["e3.2.3", "e2.6.2", "m4.1.2"],
    foreshadows: ["e3.5.2", "e3.5.3", "e4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Four threads each add 1 to a shared counter a million times. The answer should be four million; without care it
        comes out lower, and different on every run, even in Python, where only one thread runs bytecode at a time. Add a
        lock and the answer is right, but a second lock taken in the wrong order can freeze the program forever. What
        exactly goes wrong when threads share memory, and what are the rules that make sharing safe?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        <C>x = x + 1</C> looks like one step but is three: load x into a register, add 1, store it back. The operating
        system can switch threads between any two of them. If both threads load before either stores, both store the same
        value and one increment vanishes: a <strong>lost update</strong>. A <strong>lock</strong> (mutex) makes a{" "}
        <strong>critical section</strong>: only the thread holding it may enter, and others wait. Choose the interleaving
        yourself below, first without the lock and then with it.
      </p>
      <InterleaveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="locks">
        <Code>{`import threading
lock = threading.Lock()

def deposit(account, amount):
    with lock:                 # acquire; released even if an exception occurs
        account.balance += amount`}</Code>
        <p>
          A lock guarantees <strong>mutual exclusion</strong>: between a thread&rsquo;s acquire and release no other thread
          holds it. Every access to shared mutable data must happen under the same lock, readers included; one unguarded path
          brings the race back. Locks are built from atomic hardware instructions such as compare-and-swap, and a waiting
          thread either spins or sleeps until the lock is released.
        </p>
      </Definition>

      <Theorem title="counting interleavings">
        <p>
          Two threads with m and n atomic steps can be interleaved in <M>{"\\binom{m+n}{m}"}</M> ways, so the number of
          possible executions grows exponentially with the length of the code.
        </p>
      </Theorem>
      <Proof>
        <p>
          An interleaving is a sequence of m + n steps in which each thread&rsquo;s steps appear in program order. It is
          determined by which m of the m + n positions belong to the first thread, and every choice gives a valid
          interleaving. Two increments of 3 steps already have 20 interleavings, only 2 of them correct; testing a few runs
          finds a race only by luck, which is why concurrency bugs are rare, intermittent and hard to reproduce.
        </p>
      </Proof>

      <Example title="deadlock">
        <p>
          Thread 1 holds lock a and waits for b; thread 2 holds b and waits for a. Neither can continue. Deadlock needs four
          conditions together: mutual exclusion, holding a lock while waiting for another, no forcible taking of locks, and
          a cycle of waiting threads. Breaking any one prevents it, and the practical way is to break the cycle.
        </p>
      </Example>

      <Theorem title="lock ordering prevents deadlock">
        <p>
          If the locks are given a total order and every thread acquires the locks it holds at once in increasing order,
          then no deadlock is possible.
        </p>
      </Theorem>
      <Proof>
        <p>
          Suppose threads <M>{"T_1, \\dots, T_k"}</M> are deadlocked: each <M>{"T_i"}</M> holds a lock{" "}
          <M>{"h_i"}</M> and waits for a lock held by <M>{"T_{i+1}"}</M> (indices modulo k), namely{" "}
          <M>{"h_{i+1}"}</M>. Because <M>{"T_i"}</M> acquires in increasing order and is requesting{" "}
          <M>{"h_{i+1}"}</M> while holding <M>{"h_i"}</M>, we have <M>{"h_i < h_{i+1}"}</M>. Going round the cycle gives{" "}
          <M>{"h_1 < h_2 < \\cdots < h_k < h_1"}</M>, a contradiction. Tools such as the Linux kernel&rsquo;s lockdep
          record the order in which locks are nested at run time and report any cycle before it ever deadlocks.
        </p>
      </Proof>

      <Remark title="Python, the GIL and beyond">
        <p>
          CPython&rsquo;s global interpreter lock lets one thread run bytecode at a time, but it can switch threads between
          bytecodes, and <C>count += 1</C> is several bytecodes, so it still races. Free-threaded Python (3.13 onwards,
          without the GIL) makes this matter more. Condition variables (<C>threading.Condition</C>) let a thread sleep until
          some state changes, and <C>queue.Queue</C> packages a lock and conditions into a safe producer-consumer queue, which
          is usually the simplest correct design: share by passing messages rather than by locking data.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>Two threads each execute 3 atomic steps. In how many different orders can the 6 steps interleave?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "correct",
      rung: "apply",
      prompt: <p>Each of two threads runs load, add 1, store on a shared x that starts at 0, with no lock. Of the 20 interleavings, in how many does x end at 2?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "throughput",
      rung: "apply",
      prompt: <p>Each iteration of a worker spends 8 µs on private work and 2 µs inside a critical section protected by one lock. With unlimited threads and cores, what is the most iterations per second the whole program can complete?</p>,
      answer: { kind: "numeric", value: 500000 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import threading

count = 0
lock = threading.Lock()

def work(n):
    global count
    for _ in range(n):
        with lock:
            count += 1

ts = [threading.Thread(target=work, args=(10000,)) for _ in range(4)]
for t in ts:
    t.start()
for t in ts:
    t.join()
print(count, lock.locked(), threading.active_count())`}</Code>
          <p>A counter under a lock. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["40000 False 1", "40000 True 1", "40000 False 5", "10000 False 1"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run(schedule):
    # two threads each run: load x into a register, add 1, store it back
    x = 0
    reg = {'A': 0, 'B': 0}
    pc = {'A': 0, 'B': 0}
    for t in schedule:
        step = pc[t]
        pc[t] += 1
        if step == 0:
            reg[t] = x
        elif step == 1:
            reg[t] += 1
        else:
            x = reg[t]
    return x

print(run('AAABBB'), run('ABABAB'), run('AABBBA'), run('BBBAAA'))`}</Code>
          <p>Simulating interleavings of x = x + 1. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2 1 1 2", "2 2 2 2", "2 1 2 2", "2 1 1 1"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Build a tiny model checker. Each thread is a list of steps on a shared x (starting at 0) and its own register r
            (starting at 0): <C>(&apos;load&apos;,)</C> sets r = x, <C>(&apos;add&apos;, k)</C> sets r = r + k,{" "}
            <C>(&apos;store&apos;,)</C> sets x = r, <C>(&apos;lock&apos;, name)</C> and <C>(&apos;unlock&apos;, name)</C>.
            Define an exception <C>Blocked</C>.
          </p>
          <ul>
            <li>
              <C>run(programs, schedule)</C> runs the threads whose indices the schedule lists, one step each, and returns x;
              it raises <C>Blocked</C> if the thread must wait for a lock another thread holds, and <C>ValueError</C> if it has
              finished.
            </li>
            <li>
              <C>outcomes(programs)</C> explores every possible interleaving and returns the set of final values of x, adding
              the string <C>&apos;deadlock&apos;</C> if some execution reaches a state where unfinished threads are all
              blocked.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Blocked(Exception):
    pass


def run(programs, schedule):
    x = 0
    for p in programs:
        x += sum(op[1] for op in p if op[0] == 'add')
    return x


def outcomes(programs):
    return {run(programs, [])}
`,
        solution: `class Blocked(Exception):
    pass


def _step(programs, state, t):
    x, regs, pcs, owner = state
    if pcs[t] == len(programs[t]):
        raise ValueError(f'thread {t} has finished')
    op = programs[t][pcs[t]]
    regs, pcs, owner = list(regs), list(pcs), dict(owner)
    if op[0] == 'load':
        regs[t] = x
    elif op[0] == 'add':
        regs[t] += op[1]
    elif op[0] == 'store':
        x = regs[t]
    elif op[0] == 'lock':
        if owner.get(op[1], t) != t:
            raise Blocked(op[1])
        owner[op[1]] = t
    elif op[0] == 'unlock':
        owner.pop(op[1], None)
    else:
        raise ValueError(f'unknown step {op!r}')
    pcs[t] += 1
    return x, tuple(regs), tuple(pcs), owner


def _start(programs):
    n = len(programs)
    return 0, (0,) * n, (0,) * n, {}


def run(programs, schedule):
    state = _start(programs)
    for t in schedule:
        state = _step(programs, state, t)
    return state[0]


def outcomes(programs):
    results = set()

    def dfs(state):
        live = [t for t in range(len(programs)) if state[2][t] < len(programs[t])]
        if not live:
            results.add(state[0])
            return
        moved = False
        for t in live:
            try:
                nxt = _step(programs, state, t)
            except Blocked:
                continue
            moved = True
            dfs(nxt)
        if not moved:
            results.add('deadlock')

    dfs(_start(programs))
    return results
`,
        tests: [
          { name: "run a schedule", code: `INC = [('load',), ('add', 1), ('store',)]
assert run([INC, INC], [0, 0, 0, 1, 1, 1]) == 2
assert run([INC, INC], [0, 1, 0, 1, 0, 1]) == 1, 'Both load 0: one update is lost.'
assert run([INC, INC], [0, 0, 1, 1, 1, 0]) == 1
assert run([INC, INC], [0, 0]) == 0, 'Nothing stored yet.'
assert run([[('load',), ('add', 5), ('store',)], [('load',), ('add', -2), ('store',)]], [1, 0, 0, 0, 1, 1]) == -2
L = [('lock', 'm')] + INC + [('unlock', 'm')]
assert run([L, L], [0, 0, 0, 0, 0, 1, 1, 1, 1, 1]) == 2
try:
    run([L, L], [0, 1])
    assert False, 'Thread 1 cannot take the lock thread 0 holds: raise Blocked.'
except Blocked:
    pass
try:
    run([INC], [0, 0, 0, 0])
    assert False, 'Scheduling a finished thread is a ValueError.'
except ValueError:
    pass` },
          { name: "all interleavings", code: `INC = [('load',), ('add', 1), ('store',)]
assert outcomes([INC, INC]) == {1, 2}, 'Two unlocked increments: 1 or 2.'
assert outcomes([INC, INC, INC]) == {1, 2, 3}
L = [('lock', 'm')] + INC + [('unlock', 'm')]
assert outcomes([L, L, L]) == {3}, 'With a lock every interleaving gives 3.'
assert outcomes([L, INC]) == {1, 2}, 'A lock only helps if every thread takes it.'
AB = [('lock', 'a'), ('lock', 'b'), ('load',), ('add', 1), ('store',), ('unlock', 'b'), ('unlock', 'a')]
BA = [('lock', 'b'), ('lock', 'a'), ('load',), ('add', 1), ('store',), ('unlock', 'a'), ('unlock', 'b')]
assert outcomes([AB, BA]) == {2, 'deadlock'}, 'Opposite lock orders can deadlock.'
assert outcomes([AB, AB]) == {2}, 'The same order never deadlocks.'
D = [('load',), ('add', 10), ('store',)]
H = [('load',), ('add', 10), ('add', 10), ('store',)]
assert outcomes([D, H]) == {10, 20, 30}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Detect deadlock risk the way lockdep does, from observed behaviour. Each thread is a list of{" "}
            <C>(&apos;acquire&apos;, name)</C> and <C>(&apos;release&apos;, name)</C> events. Write <C>lock_graph(threads)</C>,
            mapping every lock to the sorted list of locks acquired while it was held, and <C>lock_order(threads)</C>, which
            returns a list of all locks in an order consistent with the graph (alphabetically smallest available lock first)
            or None if the graph has a cycle.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def lock_graph(threads):
    names = {n for t in threads for _, n in t}
    return {n: [] for n in names}


def lock_order(threads):
    return sorted({n for t in threads for _, n in t})
`,
        solution: `import heapq


def lock_graph(threads):
    graph = {}
    for events in threads:
        held = []
        for kind, name in events:
            graph.setdefault(name, set())
            if kind == 'acquire':
                for h in held:
                    if h != name:
                        graph[h].add(name)
                held.append(name)
            elif kind == 'release':
                held.remove(name)
            else:
                raise ValueError(kind)
    return {k: sorted(v) for k, v in graph.items()}


def lock_order(threads):
    g = lock_graph(threads)
    indeg = {k: 0 for k in g}
    for k in g:
        for v in g[k]:
            indeg[v] += 1
    ready = [k for k in g if indeg[k] == 0]
    heapq.heapify(ready)
    order = []
    while ready:
        k = heapq.heappop(ready)
        order.append(k)
        for v in g[k]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(ready, v)
    return order if len(order) == len(g) else None
`,
        tests: [
          { name: "lock graph", code: `A = lambda n: ('acquire', n)
R = lambda n: ('release', n)
assert lock_graph([[A('a'), A('b'), R('b'), R('a')]]) == {'a': ['b'], 'b': []}
assert lock_graph([[A('a'), R('a'), A('b'), R('b')]]) == {'a': [], 'b': []}, 'Locks taken one after another are not nested.'
g = lock_graph([[A('a'), A('b'), A('c'), R('c'), R('b'), R('a')], [A('c'), R('c'), A('d'), A('a'), R('a'), R('d')]])
assert g == {'a': ['b', 'c'], 'b': ['c'], 'c': [], 'd': ['a']}, f'Every lock held points to the one being acquired, got {g}.'
g = lock_graph([[A('x'), A('y'), R('x'), A('z'), R('z'), R('y')]])
assert g == {'x': ['y'], 'y': ['z'], 'z': []}, 'x was released before z was taken.'
assert lock_graph([]) == {}` },
          { name: "global order", code: `A = lambda n: ('acquire', n)
R = lambda n: ('release', n)
assert lock_order([[A('b'), A('a'), R('a'), R('b')]]) == ['b', 'a']
assert lock_order([[A('a'), A('b'), R('b'), R('a')], [A('b'), A('a'), R('a'), R('b')]]) is None, 'Opposite orders: a possible deadlock.'
t1 = [A('a'), A('b'), R('b'), R('a')]
t2 = [A('b'), A('c'), R('c'), R('b')]
t3 = [A('c'), A('a'), R('a'), R('c')]
assert lock_order([t1, t2]) == ['a', 'b', 'c']
assert lock_order([t1, t2, t3]) is None, 'A three-way cycle can deadlock even though no pair is reversed.'
assert lock_order([[A('q'), R('q')], [A('p'), R('p')], [A('m'), A('n'), R('n'), R('m')]]) == ['m', 'n', 'p', 'q'], 'Ties go alphabetically.'
assert lock_order([[A('d'), A('c'), R('c'), A('b'), R('b'), R('d')], [A('a'), R('a')]]) == ['a', 'd', 'b', 'c']` },
        ],
      },
    },
    {
      key: "lost",
      rung: "prove",
      prompt: <p>Two threads each run load, add 1, store on x = 0 without a lock. Prove that the final x is 2 exactly when one thread&rsquo;s store comes before the other thread&rsquo;s load, and hence that exactly 2 of the 20 interleavings are correct.</p>,
      answer: {
        kind: "written",
        rubric: [
          "If A's store precedes B's load, B loads 1 and stores 2 (A's store is earlier and B's store is last), so x = 2; symmetrically for B before A.",
          "Otherwise both loads come before both stores, so both registers hold 0 + 1 = 1 and both stores write 1: x = 1.",
          "A's store before B's load forces all three A steps before all three B steps (program order): only AAABBB.",
          "Likewise only BBBAAA for the other case, so 2 of 20 interleavings give 2.",
        ],
      },
    },
    {
      key: "peterson",
      rung: "stretch",
      prompt: (
        <>
          <Code>{`# thread i (0 or 1); j = 1 - i; flag = [False, False]; turn shared
flag[i] = True
turn = j
while flag[j] and turn == j:
    pass                      # wait
# critical section
flag[i] = False`}</Code>
          <p>Prove that Peterson&rsquo;s algorithm never lets both threads into the critical section at once, assuming each line is atomic and memory is sequentially consistent.</p>
        </>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Supposes both are inside; both set their flags to True before entering, and neither has cleared it.",
          "turn holds a single value; say the last write to turn was by thread 0, setting turn = 1, after thread 1 had written turn = 0.",
          "Then thread 0 entered only after reading flag[1] false or turn = 0; flag[1] was already True and turn stayed 1, so thread 0 could not have passed its loop: contradiction.",
          "Notes that on real hardware stores can be reordered, so the algorithm needs memory barriers, which is why practical locks use atomic instructions.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why two threads adding 1 to the same counter can lose an update, and how a lock and a lock order fix the two classic problems.",

  glimpse: (
    <p>
      A lock is one tool against one kind of race. Next: races in general, atomic operations such as compare-and-swap, and
      how tools detect a data race without needing the bad interleaving to happen.
    </p>
  ),
};
