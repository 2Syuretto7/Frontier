import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SharedDistributedViz } from "@/components/viz/SharedDistributedViz";
import type { LessonContent } from "@/lib/types";

const MODELS = `def run_schedule(schedule, iters):
    counter, reg, step, done = 0, {}, {}, {}
    for t in schedule:
        if done.get(t, 0) == iters:
            continue
        if step.get(t, 0) == 0:
            reg[t] = counter
            step[t] = 1
        else:
            counter = reg[t] + 1
            step[t] = 0
            done[t] = done.get(t, 0) + 1
    return counter

def local_range(rank, n, p):
    q, r = divmod(n, p)
    start = rank * q + min(rank, r)
    return start, start + q + (1 if rank < r else 0)

def owner(i, n, p):
    q, r = divmod(n, p)
    if i < r * (q + 1):
        return i // (q + 1)
    return r + (i - r * (q + 1)) // q`;

const COST = `import math

def shared_time(n, p, t_op, t_lock, private):
    if private:
        return math.ceil(n / p) * t_op + p * t_lock
    return n * (t_op + t_lock)

def distributed_time(n, p, t_op, alpha):
    return math.ceil(n / p) * t_op + (p - 1) * alpha

def best_p(n, t_op, alpha, p_max):
    return min(range(1, p_max + 1), key=lambda p: distributed_time(n, p, t_op, alpha))`;

export const lesson: LessonContent = {
  id: "e8.1.1",
  minutes: 45,
  links: {
    requires: ["e3.5.2", "e3.6.1"],
    revisits: ["e7.1.2", "e3.4.1"],
    foreshadows: ["e8.1.2"],
  },

  puzzle: (
    <>
      <p>
        Eight threads on one machine each add a thousand numbers into a shared total, and the answer comes out wrong. Eight
        processes on eight machines each add a thousand numbers and send their totals to one of them, and the answer is
        right but slower than expected. What is different about the two ways of sharing work, and when is each the better
        choice?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        There are two ways for workers to cooperate. In <em>shared memory</em> they all read and write one address space, so
        communication is free but uncontrolled: two workers can update the same location at once and lose an update, and
        every shared write has to be synchronised. In <em>distributed memory</em> each worker owns private memory and the only
        way to share is to send a message, which costs time but makes every exchange explicit. Fast parallel programs in
        either model follow the same rule: do as much as possible on local data, and communicate rarely.
      </p>
      <SharedDistributedViz />
    </>
  ),

  theory: (
    <>
      <Definition title="shared memory">
        <p>
          Several threads of one process share an address space (e3.4.1). A load sees the most recent store to that location,
          so data never has to be copied, but a read-modify-write such as <C>counter += 1</C> is three steps, and two threads
          can interleave them (e3.5.2). <C>run_schedule</C> replays a schedule of thread ids, where each turn either reads
          the counter into a private register or writes back the register plus one, and returns the final count: with two
          threads that alternate, every second update is lost. Locks or atomic instructions make the update indivisible, at
          the price of serialising the threads that contend for it.
        </p>
      </Definition>

      <Definition title="distributed memory">
        <p>
          Several processes, often on different machines, each with private memory. A process can read only its own data;
          to use another&apos;s it must receive a message (e3.6.1). The data is therefore <em>partitioned</em>: with n items and
          p processes, the block distribution gives rank r the contiguous range computed by <C>local_range</C>, with the first
          n mod p ranks holding one extra item, and <C>owner</C> inverts it. The usual discipline is <em>owner computes</em>:
          the process that owns a piece of data does the work on it.
        </p>
        <Code>{MODELS}</Code>
      </Definition>

      <Remark title="the machines in between">
        <p>
          Real systems mix the two. A large server is shared memory, but with non-uniform memory access (NUMA): memory attached
          to another socket is slower to reach. Caches keep each core&apos;s copy coherent in hardware, and two threads writing
          different variables on the same cache line still slow each other down (false sharing, e7.2.3). A node with eight GPUs
          is distributed memory, since each GPU has its own HBM and data moves by explicit copies over NVLink, and a cluster
          is distributed memory over a network. Training jobs therefore use both models at once: threads or a GPU&apos;s many
          cores within a device, messages between devices.
        </p>
      </Remark>

      <Theorem title="the best number of processes">
        <p>
          Suppose a sum of n numbers costs <M>{"t"}</M> per addition, each process sums its block of about n/p numbers, and
          rank 0 then receives p − 1 messages one after another, each costing α. The time{" "}
          <M>{"T(p) = \\frac{n}{p}t + (p - 1)\\alpha"}</M> is smallest near <M>{"p^* = \\sqrt{nt/\\alpha}"}</M>, and adding
          processes beyond it makes the sum slower.
        </p>
      </Theorem>
      <Proof>
        <p>
          Treat p as continuous. <M>{"T'(p) = -nt/p^2 + \\alpha"}</M>, which is negative for small p, zero at{" "}
          <M>{"p^2 = nt/\\alpha"}</M> and positive beyond, and <M>{"T''(p) = 2nt/p^3 > 0"}</M>, so the stationary point is the
          minimum. The best integer is one of the two integers either side of it, which <C>best_p</C> finds by trying every p.
        </p>
      </Proof>

      <Definition title="the cost of the three strategies">
        <p>
          <C>shared_time</C> models threads that either take a lock for every addition (all n additions are serialised) or keep
          private partial sums and take the lock once each at the end. <C>distributed_time</C> is T(p) above. In the
          visualisation the locked counter never speeds up, private partial sums speed up almost perfectly, and messages win
          until their latency dominates. Collectives (e8.2.1) replace the p − 1 sequential receives by a tree of log p steps.
        </p>
        <Code>{COST}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "range",
      rung: "check",
      prompt: <p>Eleven items are split over 3 processes by the block distribution, with the extra items on the first ranks. At which index does rank 2&apos;s block start?</p>,
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "time",
      rung: "check",
      prompt: (
        <p>
          A million additions at 1 ns each are split over 10 processes, and rank 0 then receives 9 messages at 1 µs each. How
          many nanoseconds does the sum take, by the model T(p)?
        </p>
      ),
      answer: { kind: "numeric", value: 109000, tolerance: 0 },
    },
    {
      key: "model",
      rung: "apply",
      prompt: <p>Which statement is true of distributed memory but not of shared memory?</p>,
      answer: {
        kind: "choice",
        options: [
          "A worker can use another worker's data only after receiving it in a message",
          "Two workers can never compute at the same time",
          "Updates to a shared counter can be lost when two workers interleave",
          "Workers need no synchronisation at all",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def run_schedule(schedule, iters):
    counter, reg, step, done = 0, {}, {}, {}
    for t in schedule:
        if done.get(t, 0) == iters:
            continue
        if step.get(t, 0) == 0:
            reg[t] = counter
            step[t] = 1
        else:
            counter = reg[t] + 1
            step[t] = 0
            done[t] = done.get(t, 0) + 1
    return counter

def local_range(rank, n, p):
    q, r = divmod(n, p)
    start = rank * q + min(rank, r)
    return start, start + q + (1 if rank < r else 0)

def owner(i, n, p):
    q, r = divmod(n, p)
    if i < r * (q + 1):
        return i // (q + 1)
    return r + (i - r * (q + 1)) // q

print(run_schedule([0, 0, 1, 1] * 3, 3), run_schedule([0, 1, 0, 1] * 3, 3), run_schedule([0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0], 3))
print([local_range(r, 10, 4) for r in range(4)], [owner(i, 10, 4) for i in range(10)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "6 3 3\n[(0, 3), (3, 6), (6, 8), (8, 10)] [0, 0, 0, 1, 1, 1, 2, 2, 3, 3]",
          "6 6 6\n[(0, 3), (3, 6), (6, 8), (8, 10)] [0, 0, 0, 1, 1, 1, 2, 2, 3, 3]",
          "6 3 3\n[(0, 2), (2, 4), (4, 7), (7, 10)] [0, 0, 1, 1, 2, 2, 2, 3, 3, 3]",
          "3 3 3\n[(0, 3), (3, 6), (6, 8), (8, 10)] [0, 0, 0, 1, 1, 1, 2, 2, 3, 3]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def shared_time(n, p, t_op, t_lock, private):
    if private:
        return math.ceil(n / p) * t_op + p * t_lock
    return n * (t_op + t_lock)

def distributed_time(n, p, t_op, alpha):
    return math.ceil(n / p) * t_op + (p - 1) * alpha

def best_p(n, t_op, alpha, p_max):
    return min(range(1, p_max + 1), key=lambda p: distributed_time(n, p, t_op, alpha))

print(shared_time(1000, 4, 1, 10, False), shared_time(1000, 4, 1, 10, True), distributed_time(1000, 4, 1, 100))
print(distributed_time(10, 3, 2, 5), [best_p(n, 1, 100, 50) for n in (100, 10000, 1000000)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "11000 290 550\n18 [1, 10, 50]",
          "11000 290 550\n18 [10, 10, 50]",
          "11000 260 550\n18 [1, 10, 50]",
          "1010 290 550\n17 [1, 10, 50]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>run_schedule(schedule, iters)</C>, where each thread alternately reads the shared counter into its own
          register and writes back the register plus one, stopping after <C>iters</C> writes; <C>local_range(rank, n, p)</C>{" "}
          for the block distribution with the first n mod p ranks holding one extra item; and <C>owner(i, n, p)</C>, the rank
          whose range contains item i.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def run_schedule(schedule, iters):
    return 0

def local_range(rank, n, p):
    return 0, n

def owner(i, n, p):
    return 0
`,
        solution: MODELS,
        tests: [
          { name: "schedule", code: `assert run_schedule([0, 0, 1, 1] * 5, 5) == 10 and run_schedule([0, 1] * 10, 5) == 5
assert run_schedule([2, 2, 2, 2, 2, 2], 2) == 2 and run_schedule([0, 1, 1, 1, 1, 0], 2) == 1 and run_schedule([], 3) == 0` },
          { name: "ranges", code: `for n in range(0, 25):
    for p in range(1, 7):
        rs = [local_range(r, n, p) for r in range(p)]
        assert rs[0][0] == 0 and rs[-1][1] == n and all(rs[i][1] == rs[i + 1][0] for i in range(p - 1))
        assert max(b - a for a, b in rs) - min(b - a for a, b in rs) <= 1
        assert all(rs[owner(i, n, p)][0] <= i < rs[owner(i, n, p)][1] for i in range(n))
assert local_range(0, 7, 3) == (0, 3) and local_range(2, 7, 3) == (5, 7)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shared_time(n, p, t_op, t_lock, private)</C>, <C>distributed_time(n, p, t_op, alpha)</C> using{" "}
          <C>math.ceil(n / p)</C> additions per worker, and <C>best_p(n, t_op, alpha, p_max)</C>, the p from 1 to{" "}
          <C>p_max</C> with the smallest distributed time (the smallest such p on a tie).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def shared_time(n, p, t_op, t_lock, private):
    return 0

def distributed_time(n, p, t_op, alpha):
    return 0

def best_p(n, t_op, alpha, p_max):
    return 1
`,
        solution: COST,
        tests: [
          { name: "times", code: `assert shared_time(500, 7, 2, 3, False) == 2500 and shared_time(500, 7, 2, 3, True) == 165
assert distributed_time(500, 7, 2, 3) == 162 and distributed_time(9, 1, 4, 100) == 36` },
          { name: "best", code: `assert best_p(10000, 1, 1, 200) == 100 and best_p(10000, 1, 1, 30) == 30 and best_p(50, 1, 1000, 10) == 1
assert best_p(90000, 1, 100, 100) == 30` },
        ],
      },
    },
    {
      key: "opt",
      rung: "stretch",
      prompt: (
        <p>
          Four million additions at 1 ns each are split over p processes, and rank 0 receives p − 1 messages at 1 µs each. Which
          p from 1 to 100 gives the shortest time by <C>distributed_time</C>?
        </p>
      ),
      answer: { kind: "numeric", value: 63, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        In distributed memory every exchange is a message. The next lesson looks at messages themselves: sending and
        receiving, blocking and non-blocking, and the deadlocks that careless ordering can cause.
      </p>
    </>
  ),
};
