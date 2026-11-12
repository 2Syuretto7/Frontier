import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SchedViz } from "@/components/viz/SchedViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e3.4.2",
  minutes: 55,
  links: {
    requires: ["e3.4.1"],
    revisits: ["e2.7.2", "e2.4.3", "e2.2.3"],
    foreshadows: ["e3.5.1", "e3.5.3"],
  },

  puzzle: (
    <>
      <p>
        A long training job, an editor waiting for your keystrokes and a music player all share one machine. Run them in the
        order they arrived and the editor freezes for hours; switch between them too often and the machine spends its time
        switching. A shared GPU cluster faces the same choice with jobs that last days. What rule should decide who runs
        next, and what exactly does &ldquo;best&rdquo; mean?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The <strong>scheduler</strong> picks which ready thread runs on each core. Different goals pull different ways: total{" "}
        <strong>turnaround</strong> (arrival to finish), <strong>waiting</strong> time (turnaround minus the job&rsquo;s own
        running time), and <strong>response</strong> time (arrival to first run), which matters most for interactive
        programs. Running short jobs first slashes average waiting; slicing time into small turns improves response at the
        cost of more switches. Compare the policies below on the same four jobs.
      </p>
      <SchedViz />
    </>
  ),

  theory: (
    <>
      <Definition title="classic policies">
        <p>
          <strong>FCFS</strong> runs jobs to completion in arrival order. <strong>SJF</strong> (shortest job first) runs the
          ready job with the smallest burst to completion. <strong>SRTF</strong> (shortest remaining time first) is the
          preemptive version: a newly arrived job with less remaining work than the running one takes over.{" "}
          <strong>Round robin</strong> keeps a queue and gives each job a <strong>quantum</strong> q of time, then moves it to
          the back. Preemption needs a timer interrupt, and each switch costs saving and restoring registers plus colder
          caches and TLB.
        </p>
      </Definition>

      <Theorem title="shortest job first is optimal">
        <p>
          For n jobs all ready at time 0 on one CPU, without preemption, running them in increasing order of running time
          minimises the average waiting time.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take any order in which some job of length a runs immediately before a job of length b &lt; a. Swap the two. Jobs
          before and after the pair wait exactly as long as before, since the pair occupies the same total time a + b. If the
          pair started at time t, its waiting times were t and t + a; after the swap they are t and t + b, smaller by a − b
          &gt; 0. So any order with such an adjacent inversion can be strictly improved, and an optimal order has none: it is
          sorted by length. (With equal lengths, swapping changes nothing.)
        </p>
      </Proof>

      <Example title="convoys and quanta">
        <p>
          Jobs of 24, 3 and 3 time units arriving together wait (0 + 24 + 27)/3 = 17 on average under FCFS, but (0 + 3 +
          6)/3 = 3 if the short ones go first: the <strong>convoy effect</strong>. The catch is that the scheduler does not
          know future running times. Round robin needs no prediction and bounds every job&rsquo;s response time by
          about (n − 1)q, but with q too small the fixed switch cost dominates, and with q too large it is FCFS again.
        </p>
      </Example>

      <Example title="real schedulers">
        <p>
          A multilevel feedback queue guesses running times from behaviour: a thread that uses its whole quantum drops to a
          lower-priority queue with a longer quantum, and one that blocks early (interactive work) stays high. Linux&rsquo;s
          scheduler instead tracks each thread&rsquo;s weighted <M>{"\\text{virtual runtime}"}</M> and runs the thread that
          has had the least, which approximates a fair share for every thread; <C>nice</C> values change the weights.
        </p>
      </Example>

      <Remark title="scheduling in ML systems">
        <p>
          The same trade-offs reappear at every scale. Cluster schedulers such as Slurm and Kubernetes queue whole jobs onto
          GPUs with priorities and fair shares. LLM serving engines schedule requests token by token: continuous batching adds
          a new request to the running batch as soon as another finishes, instead of waiting for the slowest request, which
          is round robin with one token as the quantum, and some engines prefer short prompts first to cut average latency.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fcfs",
      rung: "check",
      prompt: <p>Three jobs needing 24, 3 and 3 ms all arrive at time 0 and run FCFS in that order. What is the average waiting time in ms?</p>,
      answer: { kind: "numeric", value: 17 },
    },
    {
      key: "rrresp",
      rung: "apply",
      prompt: <p>Ten CPU-bound jobs arrive together and run round robin with a 20 ms quantum and no switching cost. What is the longest response time (arrival to first run), in ms?</p>,
      answer: { kind: "numeric", value: 180 },
    },
    {
      key: "overhead",
      rung: "apply",
      prompt: <p>Each context switch costs 0.1 ms, and every quantum of 10 ms ends in a switch. What percentage of CPU time is spent switching?</p>,
      answer: { kind: "numeric", value: 0.99, tolerance: 0.01 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def waits(bursts):
    t, total = 0, 0
    for b in bursts:
        total += t          # each job waits for all those before it
        t += b
    return total / len(bursts)

jobs = [24, 3, 3]
print(waits(jobs), waits(sorted(jobs)), waits(sorted(jobs, reverse=True)), sum(jobs))`}</Code>
          <p>Order matters. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["17.0 3.0 17.0 30", "27.0 3.0 17.0 30", "17.0 6.0 17.0 30", "17.0 3.0 24.0 30"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from collections import deque

def rr(bursts, q):
    queue = deque(enumerate(bursts))
    out = ''
    while queue:
        k, left = queue.popleft()
        run = min(q, left)
        out += 'ABC'[k] * run
        if left > run:
            queue.append((k, left - run))
    return out

s = rr([5, 2, 3], 2)
print(s, s.rindex('A') + 1, rr([5, 2, 3], 1)[:6], len(rr([5, 2, 3], 9)))`}</Code>
          <p>Round robin, one character per time unit. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["AABBCCAACA 10 ABCABC 10", "AABBCCAAAC 10 ABCABC 10", "AABBCCAACA 9 ABCABC 10", "AABBCCAACA 10 ABCACA 10"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Jobs are <C>(name, arrival, burst)</C> triples with integer times. Write <C>schedule(jobs, policy)</C> for the
            non-preemptive policies <C>&apos;fcfs&apos;</C> and <C>&apos;sjf&apos;</C>, returning the timeline as a list of{" "}
            <C>(name, start, end)</C> segments. When the CPU is free it takes, among jobs that have arrived, the earliest
            arrival (FCFS) or the shortest burst (SJF), breaking ties by arrival and then list position; if none has arrived
            it idles until one does. Then write <C>metrics(jobs, timeline)</C> giving each name{" "}
            <C>(turnaround, waiting, response)</C>; timelines may split a job into several segments.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def schedule(jobs, policy):
    t, segs = 0, []
    for name, arrival, burst in jobs:
        segs.append((name, t, t + burst))
        t += burst
    return segs


def metrics(jobs, timeline):
    return {name: (0, 0, 0) for name, _, _ in jobs}
`,
        solution: `def _merge(segs):
    out = []
    for name, s, e in segs:
        if out and out[-1][0] == name and out[-1][2] == s:
            out[-1] = (name, out[-1][1], e)
        else:
            out.append((name, s, e))
    return out


def schedule(jobs, policy):
    # jobs: list of (name, arrival, burst); non-preemptive 'fcfs' or 'sjf'
    pending = list(enumerate(jobs))
    t, segs = 0, []
    while pending:
        ready = [(k, j) for k, j in pending if j[1] <= t]
        if not ready:
            t = min(j[1] for _, j in pending)
            continue
        if policy == 'fcfs':
            k, j = min(ready, key=lambda kj: (kj[1][1], kj[0]))
        elif policy == 'sjf':
            k, j = min(ready, key=lambda kj: (kj[1][2], kj[1][1], kj[0]))
        else:
            raise ValueError(policy)
        pending.remove((k, j))
        segs.append((j[0], t, t + j[2]))
        t += j[2]
    return _merge(segs)


def metrics(jobs, timeline):
    out = {}
    for name, arrival, burst in jobs:
        mine = [(s, e) for n, s, e in timeline if n == name]
        finish = max(e for _, e in mine)
        start = min(s for s, _ in mine)
        out[name] = (finish - arrival, finish - arrival - burst, start - arrival)
    return out
`,
        tests: [
          { name: "FCFS and SJF", code: `J = [('A', 0, 8), ('B', 1, 4), ('C', 2, 1)]
assert schedule(J, 'fcfs') == [('A', 0, 8), ('B', 8, 12), ('C', 12, 13)]
assert schedule(J, 'sjf') == [('A', 0, 8), ('C', 8, 9), ('B', 9, 13)], 'SJF is non-preemptive: A keeps the CPU, then the shortest ready job.'
assert schedule([('A', 5, 2), ('B', 0, 1)], 'fcfs') == [('B', 0, 1), ('A', 5, 7)], 'Order by arrival; the CPU idles until 5.'
assert schedule([('X', 0, 3), ('Y', 0, 3), ('Z', 0, 2)], 'sjf') == [('Z', 0, 2), ('X', 2, 5), ('Y', 5, 8)], 'Ties by arrival, then list order.'
assert schedule([('X', 0, 3), ('Y', 0, 3)], 'fcfs') == [('X', 0, 3), ('Y', 3, 6)]
import random
rng = random.Random(4)
for _ in range(30):
    jobs = [(f'J{i}', rng.randrange(20), rng.randrange(1, 9)) for i in range(rng.randrange(1, 7))]
    for pol in ['fcfs', 'sjf']:
        tl = schedule(jobs, pol)
        assert sorted(n for n, _, _ in tl) == sorted(n for n, _, _ in jobs), 'Each job runs once, without preemption.'
        assert all(e - s == dict((n, b) for n, _, b in jobs)[n] for n, s, e in tl)
        assert all(s >= dict((n, a) for n, a, _ in jobs)[n] for n, s, e in tl), 'No job may start before it arrives.'
        assert all(tl[i][2] <= tl[i + 1][1] for i in range(len(tl) - 1)), 'Segments must not overlap.'` },
          { name: "metrics", code: `J = [('A', 0, 8), ('B', 1, 4), ('C', 2, 1)]
m = metrics(J, [('A', 0, 8), ('B', 8, 12), ('C', 12, 13)])
assert m == {'A': (8, 0, 0), 'B': (11, 7, 7), 'C': (11, 10, 10)}, f'(turnaround, waiting, response), got {m}.'
m = metrics(J, [('A', 0, 2), ('B', 2, 4), ('C', 4, 5), ('A', 5, 7), ('B', 7, 9), ('A', 9, 13)])
assert m == {'A': (13, 5, 0), 'B': (8, 4, 1), 'C': (3, 2, 2)}, f'Preempted jobs finish at their last segment, got {m}.'
assert metrics([('Q', 3, 2)], [('Q', 4, 6)]) == {'Q': (3, 1, 1)}` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>Now the preemptive policies, returning timelines in the same form, with adjacent segments of the same job merged by the starter&rsquo;s <C>_merge(segs)</C>. Times are whole numbers.</p>
          <ul>
            <li>
              <C>round_robin(jobs, quantum)</C>: a FIFO queue in order of arrival (ties by list position); the job at the front
              runs for the quantum or until it finishes. Jobs arriving up to and including the moment a job is preempted join
              the queue before it.
            </li>
            <li>
              <C>srtf(jobs)</C>: always run the arrived job with the least remaining time, ties by arrival then list position.
            </li>
          </ul>
        </>
      ),
      answer: {
        kind: "code",
        starter: `from collections import deque

def _merge(segs):
    # Joins adjacent segments of the same job.
    out = []
    for name, s, e in segs:
        if out and out[-1][0] == name and out[-1][2] == s:
            out[-1] = (name, out[-1][1], e)
        else:
            out.append((name, s, e))
    return out

def round_robin(jobs, quantum):
    t, segs = 0, []
    for name, arrival, burst in jobs:
        segs.append((name, t, t + burst))
        t += burst
    return segs

def srtf(jobs):
    return round_robin(jobs, 1)
`,
        solution: `from collections import deque

def _merge(segs):
    # Joins adjacent segments of the same job.
    out = []
    for name, s, e in segs:
        if out and out[-1][0] == name and out[-1][2] == s:
            out[-1] = (name, out[-1][1], e)
        else:
            out.append((name, s, e))
    return out

def round_robin(jobs, quantum):
    order = sorted(range(len(jobs)), key=lambda k: (jobs[k][1], k))
    left = [b for _, _, b in jobs]
    queue, segs, t, nxt, back = deque(), [], 0, 0, None
    while nxt < len(order) or queue or back is not None:
        while nxt < len(order) and jobs[order[nxt]][1] <= t:
            queue.append(order[nxt])
            nxt += 1
        if back is not None:         # the preempted job queues after arrivals up to now
            queue.append(back)
            back = None
        if not queue:
            t = jobs[order[nxt]][1]
            continue
        k = queue.popleft()
        run = min(quantum, left[k])
        segs.append((jobs[k][0], t, t + run))
        t, left[k] = t + run, left[k] - run
        if left[k]:
            back = k
    return _merge(segs)

def srtf(jobs):
    left = [b for _, _, b in jobs]
    segs, t = [], 0
    while any(left):
        ready = [k for k in range(len(jobs)) if left[k] and jobs[k][1] <= t]
        if ready:
            k = min(ready, key=lambda k: (left[k], jobs[k][1], k))
            segs.append((jobs[k][0], t, t + 1))
            left[k] -= 1
        t += 1
    return _merge(segs)
`,
        tests: [
          { name: "round robin", code: `J = [('A', 0, 5), ('B', 1, 3), ('C', 2, 1)]
assert round_robin(J, 2) == [('A', 0, 2), ('B', 2, 4), ('C', 4, 5), ('A', 5, 7), ('B', 7, 8), ('A', 8, 9)], 'Arrivals queue before the preempted job.'
assert round_robin(J, 10) == [('A', 0, 5), ('B', 5, 8), ('C', 8, 9)], 'A huge quantum is FCFS.'
assert round_robin([('A', 0, 3)], 1) == [('A', 0, 3)], 'A lone job runs on: adjacent segments merge.'
assert round_robin([('A', 0, 1), ('B', 4, 2)], 1) == [('A', 0, 1), ('B', 4, 6)], 'The CPU idles until B arrives.'
assert round_robin([('A', 0, 2), ('B', 0, 2)], 1) == [('A', 0, 1), ('B', 1, 2), ('A', 2, 3), ('B', 3, 4)]
assert round_robin([('A', 0, 4), ('B', 2, 2)], 2) == [('A', 0, 2), ('B', 2, 4), ('A', 4, 6)], 'B arrives exactly as A is preempted, and goes first.'` },
          { name: "SRTF", code: `J = [('A', 0, 8), ('B', 1, 4), ('C', 2, 1)]
assert srtf(J) == [('A', 0, 1), ('B', 1, 2), ('C', 2, 3), ('B', 3, 6), ('A', 6, 13)], 'Preempt whenever a shorter job arrives.'
assert srtf([('A', 0, 3), ('B', 1, 2)]) == [('A', 0, 3), ('B', 3, 5)], 'Equal remaining time: no preemption for the later arrival.'
assert srtf([('A', 2, 2), ('B', 0, 1)]) == [('B', 0, 1), ('A', 2, 4)]

def total_wait(jobs, tl):
    fin = {}
    for n, s, e in tl:
        fin[n] = max(fin.get(n, 0), e)
    return sum(fin[n] - a - b for n, a, b in jobs)

import random
rng = random.Random(9)
for _ in range(40):
    jobs = [(f'J{i}', rng.randrange(10), rng.randrange(1, 7)) for i in range(rng.randrange(1, 6))]
    tl = srtf(jobs)
    work = {}
    for n, s, e in tl:
        work[n] = work.get(n, 0) + e - s
    assert work == {n: b for n, _, b in jobs}, 'Each job gets exactly its burst.'
    for q in (1, 2, 3):
        assert total_wait(jobs, tl) <= total_wait(jobs, round_robin(jobs, q)), 'SRTF minimises total waiting time.'` },
        ],
      },
    },
    {
      key: "sum",
      rung: "prove",
      prompt: <p>For n jobs all ready at time 0 run without preemption in the order with lengths p₁, …, pₙ, show that the total completion time is Σ (n − i + 1)pᵢ, and use this to give a second proof that shortest-first is optimal.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Job i completes at p₁ + … + pᵢ, so the sum of completion times counts pᵢ once for each job at position i or later: n − i + 1 times.",
          "The coefficients n, n − 1, …, 1 are decreasing in position.",
          "By the rearrangement inequality, the sum of products is smallest when the largest coefficients multiply the smallest lengths: increasing order of pᵢ.",
          "Total waiting is total completion minus Σ pᵢ, a constant, so the same order minimises waiting.",
        ],
      },
    },
    {
      key: "smith",
      rung: "stretch",
      prompt: <p>Each job now has a weight wᵢ &gt; 0 (its importance), and the goal is to minimise Σ wᵢCᵢ, the weighted sum of completion times. Prove that running jobs in increasing order of pᵢ/wᵢ is optimal.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Considers adjacent jobs i then j starting at time t; all other completion times are unaffected by swapping them.",
          "Order i, j contributes wᵢ(t + pᵢ) + wⱼ(t + pᵢ + pⱼ); order j, i contributes wⱼ(t + pⱼ) + wᵢ(t + pⱼ + pᵢ).",
          "The difference (i first minus j first) is wⱼpᵢ − wᵢpⱼ, which is positive exactly when pᵢ/wᵢ > pⱼ/wⱼ.",
          "So any adjacent pair out of ratio order can be swapped without loss, and sorting by pᵢ/wᵢ is optimal; with equal weights it is SJF.",
        ],
      },
    },
  ],

  teachBack:
    "Explain to a friend why running short jobs first lowers the average wait, and why an operating system still cannot just do that.",

  glimpse: (
    <p>
      Processes spend much of their time blocked on disks and networks. Next, file systems and I/O: how bytes on a device
      become named files, and why reading a file the second time is so much faster.
    </p>
  ),
};
