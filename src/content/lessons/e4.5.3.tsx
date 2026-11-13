import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GilViz } from "@/components/viz/GilViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e4.5.3",
  minutes: 60,
  links: {
    requires: ["e4.5.2"],
    revisits: ["e1.1.2", "e1.3.4"],
    foreshadows: ["e4.6.1", "e10.2.1"],
  },

  puzzle: (
    <>
      <p>
        Tokenising your corpus in Python takes four hours on one core. Your machine has 32 cores, so you run it with a pool of
        32 threads. It now takes four hours and ten minutes.
      </p>
      <p>Where did the other 31 cores go?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The standard Python interpreter has a <em>global interpreter lock</em>: only one thread at a time may run Python
        code. Threads still help when they spend their time waiting, for the disk, the network or a C library that releases
        the lock, because waiting does not need the lock. For pure-Python computation, you need several processes, each with
        its own interpreter and its own lock.
      </p>
      <GilViz />
      <p>
        Processes are not free: each must start, import its libraries, and receive its inputs and send back its results by
        pickling them through a pipe. Parallelism pays when each task does much more work than it costs to send.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="the GIL">
        <p>
          In CPython, a thread must hold the global interpreter lock to execute Python bytecode. The lock is released during
          blocking I/O, <C>time.sleep</C>, and inside many C extensions while they work on their own data: NumPy&rsquo;s large
          array operations, PyTorch kernels, compression and hashing. So threads parallelise I/O and those extensions, but not
          Python loops. Python 3.13 added an optional free-threaded build without the GIL, which many libraries do not yet
          support.
        </p>
      </Definition>

      <Example title="processes">
        <Code>{`from concurrent.futures import ProcessPoolExecutor

def tokenise_file(path):
    with open(path) as f:
        return len(tokenizer.encode(f.read()))

if __name__ == "__main__":          # needed where workers are started by 'spawn'
    with ProcessPoolExecutor(max_workers=32) as ex:
        counts = list(ex.map(tokenise_file, paths, chunksize=16))`}</Code>
        <p>
          Functions and arguments are pickled to reach the workers, so they must be defined at the top level of a module, not
          as lambdas. Return small results; sending a large array back can cost more than computing it. The{" "}
          <C>chunksize</C> argument sends tasks in batches, cutting the per-task overhead. <C>map</C> returns results in input
          order even though workers finish out of order. PyTorch&rsquo;s <C>DataLoader(num_workers=k)</C> is the same idea:
          worker processes prepare batches while the main process trains.
        </p>
      </Example>

      <Definition title="scheduling">
        <p>
          <em>Static</em> scheduling splits the tasks into equal chunks up front; it has little overhead but a slow chunk
          delays everything. <em>Dynamic</em> scheduling gives each worker the next task when it becomes free, which balances
          uneven task times. Long tasks should go first: a long task that starts last finishes last.
        </p>
      </Definition>

      <Theorem title="greedy scheduling is never far from optimal">
        <p>
          With p workers and dynamic scheduling of tasks with times <M>{"t_1, \\dots, t_n"}</M>, in any order, the time until
          all finish satisfies
        </p>
        <MD>{"T \\le \\frac{1}{p} \\sum_i t_i + \\max_i t_i \\le 2\\,T_{\\text{opt}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let task j finish last, starting at time s. Until s, no worker was idle, since otherwise j would have started
          earlier; so the work done before s by p workers is <M>{"p s \\le \\sum_{i \\ne j} t_i"}</M>. Hence{" "}
          <M>{"T = s + t_j \\le \\frac1p \\sum_i t_i + t_j"}</M>. Any schedule needs at least the average load{" "}
          <M>{"\\frac1p\\sum_i t_i"}</M> and at least the longest task, so both terms are at most <M>{"T_{\\text{opt}}"}</M>.
        </p>
      </Proof>

      <Remark title="choosing">
        <p>
          Waiting on I/O: threads or <C>asyncio</C>. Heavy NumPy or PyTorch work: usually already parallel inside the library.
          Pure-Python computation over many independent items: processes, with chunks large enough to hide the overhead.
          Before any of these, check whether vectorising removes the Python loop altogether.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "threads",
      rung: "check",
      prompt: <p>In standard CPython, which of these can run several threads truly in parallel?</p>,
      answer: {
        kind: "choice",
        options: [
          "Downloading many files",
          "A pure-Python loop that counts word frequencies",
          "Large NumPy matrix multiplications, which release the GIL",
          "Parsing many small strings with Python code",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "overhead",
      rung: "apply",
      prompt: (
        <p>
          1,000 tasks each take 10 ms of computation and 2 ms to send and receive. With 8 worker processes sharing them evenly,
          about how many milliseconds does the whole job take?
        </p>
      ),
      answer: { kind: "numeric", value: 1500, tolerance: 0 },
    },
    {
      key: "main",
      rung: "apply",
      prompt: <p>Why does code that creates a process pool need <C>if __name__ == &quot;__main__&quot;:</C> on systems that start workers by &lsquo;spawn&rsquo;?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each worker imports the main module; without the guard, each would create its own pool, recursively",
          "Pickling requires it",
          "It releases the GIL",
          "It makes the pool use threads instead",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from concurrent.futures import ThreadPoolExecutor
import time

def work(x):
    time.sleep(0.01 * (5 - x))
    return x * x

with ThreadPoolExecutor(4) as ex:
    print(list(ex.map(work, range(5))))`}</Code>
          <p>Later inputs finish sooner. What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0, 1, 4, 9, 16]", "[16, 9, 4, 1, 0]", "[9, 4, 1, 0, 16]", "The order varies from run to run"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import pickle

def square(x):
    return x * x

results = []
for f in [square, lambda x: x * x, len]:
    try:
        pickle.dumps(f)
        results.append('ok')
    except Exception as e:
        results.append(type(e).__name__)
print(results)`}</Code>
          <p>
            Functions sent to worker processes are pickled by name. Run as a script, what does this print?
          </p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["['ok', 'PicklingError', 'ok']", "['ok', 'ok', 'ok']", "['PicklingError', 'PicklingError', 'ok']", "['ok', 'PicklingError', 'PicklingError']"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>Compare two ways of sharing tasks with durations <C>durations</C> among p workers.</p>
          <ul>
            <li>
              <C>dynamic(durations, p)</C>: take tasks in order; give each to the worker that becomes free earliest (ties to the
              lowest index). Return (finish_time, assignment), where assignment lists each task&rsquo;s worker.
            </li>
            <li>
              <C>static(durations, p)</C>: worker w gets the contiguous chunk <C>durations[w*c:(w+1)*c]</C> with{" "}
              <C>c = math.ceil(n / p)</C>. Return the finish time.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import heapq, math

def dynamic(durations, p):
    return 0, []

def static(durations, p):
    return 0
`,
        solution: `import heapq, math

def dynamic(durations, p):
    free = [(0, w) for w in range(p)]
    assignment, finish = [], 0
    for t in durations:
        start, w = heapq.heappop(free)
        assignment.append(w)
        finish = max(finish, start + t)
        heapq.heappush(free, (start + t, w))
    return finish, assignment

def static(durations, p):
    c = math.ceil(len(durations) / p)
    return max((sum(durations[w * c:(w + 1) * c]) for w in range(p)), default=0)
`,
        tests: [
          { name: "dynamic", code: `assert dynamic([3, 1, 1, 1, 1, 1, 1], 2) == (5, [0, 1, 1, 1, 0, 1, 0]), dynamic([3, 1, 1, 1, 1, 1, 1], 2)
assert dynamic([1] * 12 + [12], 4)[0] == 15 and dynamic([12] + [1] * 12, 4)[0] == 12
assert dynamic([], 3) == (0, [])
assert dynamic([2, 2, 2], 3) == (2, [0, 1, 2])` },
          { name: "static and the bound", code: `import random
assert static([3, 1, 1, 1, 1, 1, 1], 2) == 6 and static([5, 5, 1, 1], 2) == 10 and static([], 4) == 0
rng = random.Random(2)
for _ in range(200):
    ts = [rng.randint(1, 20) for _ in range(rng.randint(1, 30))]
    p = rng.randint(1, 6)
    d, a = dynamic(ts, p)
    assert len(a) == len(ts) and set(a) <= set(range(p))
    assert max(max(ts), sum(ts) / p) <= d <= sum(ts) / p + max(ts), (ts, p, d)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Workers finish out of order, but training needs batches in order. Write <C>reorder(stream)</C>: stream yields
          (index, value) pairs covering 0, 1, …, n − 1 exactly once, in finishing order. Return (values, max_waiting), where
          values are in index order and max_waiting is the largest number of results held back at any moment, waiting for an
          earlier index. Release each value as soon as every earlier one has been released.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reorder(stream):
    pairs = sorted(stream)
    return [v for _, v in pairs], 0
`,
        solution: `def reorder(stream):
    waiting, out, most = {}, [], 0
    for i, v in stream:
        waiting[i] = v
        while len(out) in waiting:
            out.append(waiting.pop(len(out)))
        most = max(most, len(waiting))
    return out, most
`,
        tests: [
          { name: "order", code: `assert reorder([(0, 'a'), (1, 'b'), (2, 'c')]) == (['a', 'b', 'c'], 0)
assert reorder([(2, 'c'), (1, 'b'), (0, 'a')]) == (['a', 'b', 'c'], 2)
assert reorder([(1, 'b'), (0, 'a'), (3, 'd'), (2, 'c'), (4, 'e')]) == (['a', 'b', 'c', 'd', 'e'], 1)
assert reorder([]) == ([], 0)` },
          { name: "streaming", code: `def gen():
    yield from [(3, 30), (0, 0), (1, 10), (5, 50), (2, 20), (4, 40)]
assert reorder(gen()) == ([0, 10, 20, 30, 40, 50], 2)
import random
rng = random.Random(1)
idx = list(range(50)); rng.shuffle(idx)
vals, most = reorder((i, i * i) for i in idx)
assert vals == [i * i for i in range(50)] and 0 <= most < 50` },
        ],
      },
    },
    {
      key: "graham",
      rung: "prove",
      prompt: (
        <p>
          Prove that dynamic scheduling of tasks on p workers finishes by <M>{"\\frac1p\\sum_i t_i + \\max_i t_i"}</M>, and
          deduce that it is within a factor of 2 of the best possible schedule.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Considers the task that finishes last and its start time s, and argues that no worker was idle before s.",
          "Deduces p·s is at most the total time of the other tasks, so s + t_j is at most the average load plus t_j.",
          "Notes that any schedule takes at least the average load and at least the longest task, so the bound is at most twice the optimum.",
        ],
      },
    },
    {
      key: "last",
      rung: "stretch",
      prompt: <p>Twelve tasks of 1 second are followed by one of 12 seconds, on 4 workers with dynamic scheduling. When does everything finish?</p>,
      answer: { kind: "numeric", value: 15, tolerance: 0 },
    },
  ],

  teachBack:
    "Explain to a friend why a pool of threads does not speed up a pure-Python loop but does speed up downloads, and what processes cost that threads do not.",

  glimpse: (
    <p>
      Fast, correct code still has to be understood by the next person, who is often you in six months. Next, documentation:
      docstrings, READMEs and comments that answer the questions a reader will actually have.
    </p>
  ),
};
