import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AsyncViz } from "@/components/viz/AsyncViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.5.3",
  minutes: 60,
  links: {
    requires: ["e3.5.1"],
    revisits: ["e3.4.2", "e2.4.3", "e1.3.4"],
    foreshadows: ["e3.6.1", "e3.6.3", "e4.5.3"],
  },

  puzzle: (
    <>
      <p>
        Fetching 100 web pages one after another takes 20 seconds, almost all of it spent waiting for replies. Starting 100
        threads works, but ten thousand threads would exhaust memory. A single Python process running an inference server can
        nevertheless hold thousands of open connections at once. How does one thread wait for many things at the same
        time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A <strong>blocking</strong> call such as <C>sock.recv()</C> puts the thread to sleep until data arrives, and a
        sleeping thread does nothing else. An <strong>event loop</strong> instead asks the operating system to report which
        of many connections are ready, runs a little code for each, and goes back to waiting. Each request is written as a{" "}
        <strong>coroutine</strong>, a function that can pause at <C>await</C> and later resume where it left off, so the code
        still reads top to bottom. Compare the two styles below.
      </p>
      <AsyncViz />
    </>
  ),

  theory: (
    <>
      <Definition title="coroutines and the event loop">
        <Code>{`import asyncio

async def fetch(session, url):
    async with session.get(url) as resp:    # pauses here; others run
        return await resp.text()

async def main(urls):
    async with aiohttp.ClientSession() as s:
        return await asyncio.gather(*(fetch(s, u) for u in urls))

pages = asyncio.run(main(urls))`}</Code>
        <p>
          Calling an <C>async def</C> function creates a coroutine object without running it. <C>await</C> suspends the
          current coroutine and hands control back to the loop, which resumes it when what it awaits is ready.{" "}
          <C>asyncio.gather</C> runs several concurrently and collects their results in order. Underneath, the loop keeps a
          queue of ready coroutines and a set of sockets and timers, and asks the kernel (with <C>epoll</C> on Linux,{" "}
          <C>kqueue</C> on macOS) to sleep until one of them is ready.
        </p>
      </Definition>

      <Theorem title="overlapping waits">
        <p>
          Let n tasks each need c₁ units of CPU, then a wait of w, then c₂ units of CPU, all ready at time 0, on a single
          event-loop thread that runs CPU phases without interruption from a first-in, first-out ready queue. All tasks finish
          no later than <M>{"n c_1 + w + n c_2"}</M>, and no schedule on one thread can finish before{" "}
          <M>{"\\max(n(c_1 + c_2),\\ c_1 + w + c_2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The lower bound: one thread performs all n(c₁ + c₂) units of CPU work one after another, and any single task needs
          c₁ + w + c₂ from start to finish. For the upper bound, all first phases are ready at time 0, so the loop runs them
          back to back, finishing at <M>{"n c_1"}</M>; every wait has begun by then and so has ended by{" "}
          <M>{"n c_1 + w"}</M>. The loop is idle only when no task is ready, which cannot happen after{" "}
          <M>{"n c_1 + w"}</M> while second phases remain, since they are all ready. So the remaining at most{" "}
          <M>{"n c_2"}</M> units of work end by <M>{"n c_1 + w + n c_2"}</M>. Blocking calls take{" "}
          <M>{"n(c_1 + w + c_2)"}</M>; when w dominates, the event loop is about n times faster.
        </p>
      </Proof>

      <Example title="the rules of async code">
        <p>
          A coroutine gives up the thread only at an <C>await</C>. A CPU-heavy loop or a blocking call such as{" "}
          <C>time.sleep</C>, <C>requests.get</C> or a slow file read inside a coroutine freezes every other task, so such work
          goes to a thread or process pool with <C>loop.run_in_executor</C> or <C>asyncio.to_thread</C>. Between awaits a
          coroutine runs uninterrupted, which removes most races, but any state shared across an await can still change.
          Unbounded concurrency overloads servers, so clients limit the number of requests in flight with an{" "}
          <C>asyncio.Semaphore</C>.
        </p>
      </Example>

      <Remark title="async in ML systems">
        <p>
          Model-serving frameworks (FastAPI, vLLM&rsquo;s API server) accept requests with an event loop and hand batches to
          the GPU. Data pipelines overlap reading the next batch with computing on the current one. Calling the Claude API on a
          dataset is I/O-bound in exactly this way: an async client with a semaphore of, say, 50 requests in flight does in
          minutes what a sequential loop does in hours, while staying under the rate limit. CUDA itself is asynchronous: a
          kernel launch returns immediately, and <C>torch.cuda.synchronize()</C> is the await.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "seq",
      rung: "check",
      prompt: <p>100 HTTP requests each take 200 ms, almost all of it waiting for the server. How many seconds do they take if made one after another with blocking calls?</p>,
      answer: { kind: "numeric", value: 20 },
    },
    {
      key: "sem",
      rung: "apply",
      prompt: <p>The same 100 requests are made with asyncio, limited by a semaphore to 10 in flight, and each still takes 200 ms. Ignoring CPU time, how many seconds do they take?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "bound",
      rung: "apply",
      prompt: <p>Twenty tasks each need 5 ms of CPU, then a 100 ms network wait, then 5 ms of CPU, on one event-loop thread. Using the theorem, what is the upper bound on the total time, in ms?</p>,
      answer: { kind: "numeric", value: 300 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import asyncio
import time

async def fetch(name, delay, log):
    log.append('start ' + name)
    await asyncio.sleep(delay)          # yields to the event loop
    log.append('end ' + name)
    return name.upper()

async def main():
    log = []
    t0 = time.perf_counter()
    res = await asyncio.gather(fetch('a', 0.2, log), fetch('b', 0.1, log), fetch('c', 0.3, log))
    elapsed = round(time.perf_counter() - t0, 1)
    print(res, ' '.join(x.split()[1] for x in log), elapsed)

asyncio.run(main())`}</Code>
          <p>asyncio.gather. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['A', 'B', 'C'] a b c b a c 0.3", "['B', 'A', 'C'] a b c b a c 0.3", "['A', 'B', 'C'] a a b b c c 0.6", "['A', 'B', 'C'] a b c b a c 0.6"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque

def task(name, n):
    for i in range(n):
        yield name + str(i)

q = deque([task('a', 3), task('b', 1), task('c', 2)])
out = []
while q:
    t = q.popleft()
    try:
        out.append(next(t))
        q.append(t)                     # back of the queue
    except StopIteration:
        pass
print(' '.join(out), len(out))`}</Code>
          <p>Generators as tasks in a round-robin loop. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["a0 b0 c0 a1 c1 a2 6", "a0 a1 a2 b0 c0 c1 6", "a0 b0 c0 a1 b1 c1 6", "a0 b0 c0 a1 c1 a2 5"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Python&rsquo;s async machinery grew out of generators, so build an event loop from them, with a virtual clock. A
            task is a generator that yields a number d ≥ 0 to sleep for d time units and may return a value. Write a class{" "}
            <C>EventLoop</C> with <C>spawn(gen, name)</C> and <C>run()</C>, which resumes tasks in order of wake-up time, ties
            in the order they went to sleep (or were spawned), records each resumption as <C>(time, name)</C> in a list{" "}
            <C>log</C>, raises <C>ValueError</C> for a negative sleep, and returns{" "}
            <C>{"{name: (finish_time, return_value)}"}</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class EventLoop:
    def __init__(self):
        self.tasks = []
        self.log = []

    def spawn(self, gen, name):
        self.tasks.append((name, gen))

    def run(self):
        now, results = 0, {}
        for name, gen in self.tasks:
            try:
                while True:
                    now += next(gen)
            except StopIteration as stop:
                results[name] = (now, stop.value)
        return results
`,
        solution: `import heapq


class EventLoop:
    def __init__(self):
        self.now = 0
        self.queue = []                 # (wake time, sequence number, name, generator)
        self.seq = 0
        self.log = []
        self.results = {}

    def spawn(self, gen, name):
        self._schedule(self.now, name, gen)

    def _schedule(self, when, name, gen):
        heapq.heappush(self.queue, (when, self.seq, name, gen))
        self.seq += 1

    def run(self):
        while self.queue:
            when, _, name, gen = heapq.heappop(self.queue)
            self.now = when
            self.log.append((when, name))
            try:
                delay = next(gen)
            except StopIteration as stop:
                self.results[name] = (self.now, stop.value)
                continue
            if delay < 0:
                raise ValueError('negative sleep')
            self._schedule(self.now + delay, name, gen)
        return self.results
`,
        tests: [
          { name: "overlapping sleeps", code: `def fetch(d):
    yield d                     # wait d time units for the network
    return d * 10

loop = EventLoop()
loop.spawn(fetch(3), 'a')
loop.spawn(fetch(1), 'b')
loop.spawn(fetch(2), 'c')
assert loop.run() == {'a': (3, 30), 'b': (1, 10), 'c': (2, 20)}, 'Waits overlap: total time 3, not 6.'
assert loop.log == [(0, 'a'), (0, 'b'), (0, 'c'), (1, 'b'), (2, 'c'), (3, 'a')], 'Resumes in time order, ties in FIFO order.'

def chatty(name, n):
    for _ in range(n):
        yield 0                 # give others a turn
    return name

loop = EventLoop()
loop.spawn(chatty('x', 2), 'x')
loop.spawn(chatty('y', 1), 'y')
assert loop.run() == {'x': (0, 'x'), 'y': (0, 'y')}
assert [n for _, n in loop.log] == ['x', 'y', 'x', 'y', 'x'], 'yield 0 sends a task to the back of the queue.'` },
          { name: "ordering and errors", code: `def steps(*ds):
    total = 0
    for d in ds:
        yield d
        total += d
    return total

loop = EventLoop()
loop.spawn(steps(2, 2, 2), 'p')
loop.spawn(steps(5), 'q')
loop.spawn(steps(1, 1, 1, 1, 1, 1), 'r')
r = loop.run()
assert r == {'p': (6, 6), 'q': (5, 5), 'r': (6, 6)}
assert loop.log[-2:] == [(6, 'p'), (6, 'r')], 'p went to sleep (at 4) before r (at 5), so it wakes first at 6.'

def bad():
    yield -1
loop = EventLoop()
loop.spawn(bad(), 'z')
try:
    loop.run()
    assert False, 'A negative sleep is a ValueError.'
except ValueError:
    pass
loop = EventLoop()
assert loop.run() == {}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Two timing models:</p>
          <ul>
            <li>
              <C>makespan(durations, limit)</C>: requests start in list order, each as soon as fewer than limit are in flight;
              return when the last finishes (<C>ValueError</C> if limit &lt; 1).
            </li>
            <li>
              <C>loop_time(tasks)</C>: tasks are <C>(cpu_before, wait, cpu_after)</C>, all ready at time 0, on one thread with
              a FIFO ready queue; a CPU phase runs without interruption; a task whose wait ends joins the back of the queue
              (tasks waking at the same moment in index order) once the current phase ends. Return when the last task
              finishes.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def makespan(durations, limit):
    return sum(durations)


def loop_time(tasks):
    return sum(c1 + w + c2 for c1, w, c2 in tasks)
`,
        solution: `import heapq


def makespan(durations, limit):
    # requests start in order, at most limit in flight at once
    if limit < 1:
        raise ValueError('limit must be positive')
    running = []
    t = 0
    for d in durations:
        if len(running) == limit:
            t = heapq.heappop(running)
        heapq.heappush(running, t + d)
    return max(running, default=0)


def loop_time(tasks):
    # tasks: (cpu_before, wait, cpu_after); one thread runs CPU phases from a FIFO ready queue
    from collections import deque
    ready = deque((k, 0) for k in range(len(tasks)))      # (task, phase)
    waking = []                                           # (time, task)
    t = 0
    finish = 0
    while ready or waking:
        if not ready:
            t = max(t, waking[0][0])
        while waking and waking[0][0] <= t:
            _, k = heapq.heappop(waking)
            ready.append((k, 1))
        k, phase = ready.popleft()
        c1, w, c2 = tasks[k]
        if phase == 0:
            t += c1
            heapq.heappush(waking, (t + w, k))
        else:
            t += c2
            finish = t
        while waking and waking[0][0] <= t:
            _, k2 = heapq.heappop(waking)
            ready.append((k2, 1))
    return finish
`,
        tests: [
          { name: "limited concurrency", code: `assert makespan([5, 5, 5, 5], 4) == 5
assert makespan([5, 5, 5, 5], 2) == 10
assert makespan([5, 5, 5, 5], 1) == 20, 'One at a time is sequential.'
assert makespan([3, 1, 1, 1], 2) == 3, 'The short ones share the second slot.'
assert makespan([1, 4, 1, 1, 1], 2) == 4
assert makespan([], 3) == 0
assert makespan([2, 7, 1, 3, 9, 4], 3) == 11, 'The 9 starts at 2, when the first request finishes.'
try:
    makespan([1], 0)
    assert False, 'limit 0 is a ValueError.'
except ValueError:
    pass` },
          { name: "one-thread loop", code: `assert loop_time([(1, 10, 1)]) == 12
assert loop_time([(1, 10, 1)] * 5) == 16, 'Five first phases (5), the last wait ends at 15, one more unit.'
assert loop_time([(1, 2, 1)] * 5) == 10, 'Short waits: the CPU never idles, 10 units of work.'
assert loop_time([(3, 0, 3), (1, 0, 1)]) == 8
assert loop_time([(2, 5, 4), (1, 1, 1)]) == 11
assert loop_time([]) == 0
import random
rng = random.Random(2)
for _ in range(50):
    ts = [(rng.randrange(1, 4), rng.randrange(0, 12), rng.randrange(1, 4)) for _ in range(rng.randrange(1, 7))]
    got = loop_time(ts)
    work = sum(a + c for a, _, c in ts)
    assert got >= work and got >= max(a + w + c for a, w, c in ts), f'{got} beats a lower bound for {ts}.'
    assert got <= sum(a for a, _, _ in ts) + max(w for _, w, _ in ts) + sum(c for _, _, c in ts), f'{got} breaks the upper bound for {ts}.'` },
        ],
      },
    },
    {
      key: "batches",
      rung: "prove",
      prompt: <p>Prove that n requests of equal duration d, started in order with at most k in flight, finish at exactly ⌈n/k⌉·d.</p>,
      answer: {
        kind: "written",
        rubric: [
          "The first k start at 0 and finish together at d; by induction, requests (j − 1)k + 1 to jk start at (j − 1)d.",
          "At time (j − 1)d exactly k slots free up at once, so the next k requests start then and no earlier, because all slots were busy.",
          "The last request is in group ⌈n/k⌉, which starts at (⌈n/k⌉ − 1)d and ends at ⌈n/k⌉d.",
          "Notes this is also a lower bound for any schedule with k in flight, since at most k·T units of request time fit in time T and n·d are needed, so ⌈n/k⌉ rounds of d are required.",
        ],
      },
    },
    {
      key: "graham",
      rung: "stretch",
      prompt: <p>With unequal durations, show that starting requests in order whenever a slot is free gives a makespan at most (Σ durations)/k + max duration, and hence at most twice the best possible.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers the request that finishes last, starting at time s; before s all k slots were busy, otherwise it would have started earlier.",
          "So k·s ≤ the total duration of the other requests, giving s ≤ Σ/k.",
          "Its finish is s + its duration ≤ Σ/k + max duration.",
          "Any schedule needs at least max(Σ/k, max duration), so the greedy one is within a factor 2 (Graham's list-scheduling bound).",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend how one thread can wait on a thousand network requests at once, and what happens if one coroutine calls time.sleep.",

  glimpse: (
    <p>
      Every one of those waits was for a reply from another machine. Next chapter: networking, starting with the socket, the
      file descriptor that connects two programs across the world.
    </p>
  ),
};
