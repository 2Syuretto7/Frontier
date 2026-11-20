import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BackfillViz } from "@/components/viz/BackfillViz";
import type { LessonContent } from "@/lib/types";

const QUEUE = `def used(sched, x):
    return sum(k for s, e, k in sched if s <= x < e)

def fifo(jobs, total):
    running, t, starts = [], 0, []
    for n, d in jobs:
        while sum(k for e, k in running if e > t) + n > total:
            t = min(e for e, k in running if e > t)
        starts.append(t)
        running.append((t + d, n))
    return starts

def backfill(jobs, total):
    sched, starts = [], []
    for n, d in jobs:
        for t in sorted({0} | {e for _, e, _ in sched}):
            points = [t] + [s for s, _, _ in sched if t < s < t + d]
            if all(used(sched, x) + n <= total for x in points):
                break
        sched.append((t, t + d, n))
        starts.append(t)
    return starts`;

const METRICS = `def utilisation(jobs, starts, total):
    end = max(s + d for (n, d), s in zip(jobs, starts))
    return sum(n * d for n, d in jobs) / (total * end)

def mean_wait(starts):
    return sum(starts) / len(starts)

def fewest_nodes(free, need):
    if sum(free) < need:
        return None
    out = []
    for i in sorted(range(len(free)), key=lambda i: -free[i]):
        take = min(free[i], need)
        out.append((i, take))
        need -= take
        if need == 0:
            return out`;

export const lesson: LessonContent = {
  id: "e8.5.1",
  minutes: 45,
  links: {
    requires: ["e8.4.1"],
    revisits: ["e3.4.2", "e8.3.1"],
    foreshadows: ["e8.5.2"],
  },

  puzzle: (
    <>
      <p>
        A cluster of a thousand GPUs is shared by fifty researchers. One wants 512 GPUs for a week; dozens want 8 for an hour.
        If the large job waits until 512 GPUs happen to be free at once, it may never start; if every GPU is held back for it,
        hundreds sit idle while the small jobs queue. How does a cluster decide who runs where and when?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A batch scheduler keeps a queue of jobs, each asking for some nodes for at most some time. Serving the queue strictly
        in order is fair but wasteful: a big job at the head blocks everything behind it while nodes idle. Backfilling keeps
        the order&apos;s promises but fills the gaps: the scheduler reserves a future start for each waiting job, and lets a later
        job run now if it fits into the idle nodes and will finish before anyone&apos;s reservation needs them. Job time limits
        make this possible, since they tell the scheduler when nodes will come free.
      </p>
      <BackfillViz />
    </>
  ),

  theory: (
    <>
      <Definition title="batch scheduling">
        <p>
          On a cluster managed by a scheduler such as Slurm, a job asks for a number of nodes (or GPUs) and a time limit, and
          waits in a queue. A distributed training job needs all of its nodes at once, since its ranks communicate in
          collectives from the first step: this is <em>gang scheduling</em>. Unlike the time-sharing scheduler of an operating
          system (e3.4.2), which switches threads every few milliseconds, a cluster scheduler usually gives a job its nodes
          exclusively until it ends, is killed at its time limit, or is preempted for a job of higher priority.
        </p>
      </Definition>

      <Definition title="FIFO and backfilling">
        <p>
          Here every job is submitted at time 0 as <C>(nodes, hours)</C> in queue order. <C>fifo</C> starts each job at the
          first moment it fits that is no earlier than the start of the job before it. <C>backfill</C> implements conservative
          backfilling (Mu&apos;alem and Feitelson, 2001): each job in turn gets the earliest start at which it fits for its whole
          duration around the jobs already scheduled. <C>used</C> counts the nodes busy at time x.
        </p>
        <Code>{QUEUE}</Code>
      </Definition>

      <Theorem title="checking a reservation">
        <p>
          A job of n nodes and duration d fits at time t, around a set of already scheduled jobs, if and only if n plus the nodes
          in use is at most the total at time t and at every scheduled start strictly between t and t + d. The earliest such t
          is 0 or the end of a scheduled job, and once a job is scheduled, no later job changes its start.
        </p>
      </Theorem>
      <Proof>
        <p>
          The number of nodes in use is a step function of time that increases only at the start of a job and decreases only at
          an end. On [t, t + d) its maximum is therefore attained at t or at a start inside the interval, so checking those
          points suffices. If t is feasible, let t′ be the latest time at or before t that is 0 or an end. No job ends in (t′, t], so
          usage only rises from t′ to t and stays at most its value at t; the window [t′, t′ + d) adds only such times to the
          part of [t, t + d) it keeps, so t′ is feasible too, and the earliest feasible time is one of the candidates tried. Each new job is placed only where capacity remains for its whole duration, so the jobs
          already scheduled keep their slots.
        </p>
      </Proof>

      <Definition title="measuring a schedule">
        <p>
          <em>Utilisation</em> is the node-hours of work divided by the nodes times the time until the last job ends;{" "}
          <em>wait</em> is the time from submission to start. For distributed jobs, <em>placement</em> matters as well: ranks
          that share a node communicate over NVLink rather than the network (e8.2.4), so a scheduler should give a job as few
          nodes as possible, and on a large cluster nodes under the same network switch. <C>fewest_nodes</C> fills the nodes with
          most free GPUs first, which minimises the number of nodes used.
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Remark title="schedulers in practice">
        <p>
          Slurm combines a priority order (with fair share, so that heavy recent users rank lower) with EASY backfilling, which
          reserves only for the job at the head of the queue. Kubernetes (e8.5.2) schedules containers by filtering the nodes
          that can host a pod and scoring the rest; for training jobs it is extended with gang scheduling and queues by projects
          such as Kueue and Volcano. Since nodes fail (e8.3.1) and jobs are preempted, long training runs checkpoint and
          resubmit themselves, and the scheduler simply sees a sequence of shorter jobs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "util",
      rung: "check",
      prompt: <p>An 8-node cluster finishes jobs totalling 48 node-hours, the last ending 8 hours after the first starts. What is its utilisation?</p>,
      answer: { kind: "numeric", value: 0.75, tolerance: 0.0001 },
    },
    {
      key: "nodes",
      rung: "check",
      prompt: <p>Five nodes have 8, 3, 8, 6 and 2 free GPUs. What is the fewest number of nodes on which a job needing 20 GPUs can be placed?</p>,
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
    {
      key: "gang",
      rung: "apply",
      prompt: <p>Why must a data-parallel training job be gang scheduled?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its ranks meet in collectives every step, so ranks that started early would wait idle for those not yet running",
          "Because each rank needs a whole node",
          "Because the scheduler cannot count GPUs",
          "So that its jobs run in first-in, first-out order",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def used(sched, x):
    return sum(k for s, e, k in sched if s <= x < e)

def fifo(jobs, total):
    running, t, starts = [], 0, []
    for n, d in jobs:
        while sum(k for e, k in running if e > t) + n > total:
            t = min(e for e, k in running if e > t)
        starts.append(t)
        running.append((t + d, n))
    return starts

def backfill(jobs, total):
    sched, starts = [], []
    for n, d in jobs:
        for t in sorted({0} | {e for _, e, _ in sched}):
            points = [t] + [s for s, _, _ in sched if t < s < t + d]
            if all(used(sched, x) + n <= total for x in points):
                break
        sched.append((t, t + d, n))
        starts.append(t)
    return starts

jobs = [(3, 4), (4, 2), (1, 3)]; print(fifo(jobs, 4), backfill(jobs, 4), used([(0, 4, 3), (4, 6, 4)], 4))
print(backfill([(2, 5), (4, 1), (2, 2), (2, 6)], 4), fifo([(2, 5), (4, 1), (2, 2), (2, 6)], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 4, 6] [0, 4, 0] 4\n[0, 5, 0, 6] [0, 5, 6, 6]",
          "[0, 4, 4] [0, 4, 0] 4\n[0, 5, 0, 6] [0, 5, 6, 6]",
          "[0, 4, 6] [0, 4, 0] 7\n[0, 5, 0, 6] [0, 5, 6, 6]",
          "[0, 4, 6] [0, 4, 0] 4\n[0, 5, 0, 2] [0, 5, 6, 6]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def utilisation(jobs, starts, total):
    end = max(s + d for (n, d), s in zip(jobs, starts))
    return sum(n * d for n, d in jobs) / (total * end)

def mean_wait(starts):
    return sum(starts) / len(starts)

def fewest_nodes(free, need):
    if sum(free) < need:
        return None
    out = []
    for i in sorted(range(len(free)), key=lambda i: -free[i]):
        take = min(free[i], need)
        out.append((i, take))
        need -= take
        if need == 0:
            return out

print(utilisation([(2, 3), (1, 2)], [0, 3], 2), mean_wait([0, 4, 6]), fewest_nodes([3, 8, 5, 8], 12))
print(fewest_nodes([2, 2], 5), fewest_nodes([4, 6, 6], 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.8 3.3333333333333335 [(1, 8), (3, 4)]\nNone [(1, 6)]",
          "0.8 3.3333333333333335 [(1, 8), (3, 4)]\n[(0, 2), (1, 2)] [(1, 6)]",
          "0.8 3.3333333333333335 [(0, 3), (1, 8), (2, 1)]\nNone [(1, 6)]",
          "0.5333333333333333 3.3333333333333335 [(1, 8), (3, 4)]\nNone [(2, 6)]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>used(sched, x)</C> for a schedule of <C>(start, end, nodes)</C>; <C>fifo(jobs, total)</C>; and{" "}
          <C>backfill(jobs, total)</C>, conservative backfilling as described above. Both return the start time of each job.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def used(sched, x):
    return 0

def fifo(jobs, total):
    return [0] * len(jobs)

def backfill(jobs, total):
    return fifo(jobs, total)
`,
        solution: QUEUE,
        tests: [
          { name: "fifo", code: `assert used([], 3) == 0 and used([(0, 2, 1), (1, 3, 2)], 2) == 2 and used([(0, 2, 1), (1, 3, 2)], 1) == 3
assert fifo([], 2) == [] and fifo([(2, 1), (2, 1)], 2) == [0, 1] and fifo([(1, 5), (2, 1), (1, 1)], 2) == [0, 5, 6]` },
          { name: "backfill", code: `assert backfill([], 2) == [] and backfill([(1, 5), (2, 1), (1, 1)], 2) == [0, 5, 0]
assert backfill([(6, 3), (8, 2), (2, 2), (1, 4), (4, 3), (2, 1), (3, 2)], 8) == [0, 3, 0, 5, 5, 2, 5]
assert fifo([(6, 3), (8, 2), (2, 2), (1, 4), (4, 3), (2, 1), (3, 2)], 8) == [0, 3, 5, 5, 5, 7, 8]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>utilisation(jobs, starts, total)</C>, <C>mean_wait(starts)</C> and <C>fewest_nodes(free, need)</C>, which
          takes GPUs from the nodes with the most free GPUs first (the lower index on a tie) and returns{" "}
          <C>(node, gpus)</C> pairs, or <C>None</C> if the GPUs are insufficient.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def utilisation(jobs, starts, total):
    return 1.0

def mean_wait(starts):
    return 0.0

def fewest_nodes(free, need):
    return None
`,
        solution: METRICS,
        tests: [
          { name: "metrics", code: `assert utilisation([(1, 1)], [0], 1) == 1.0 and abs(utilisation([(2, 3), (1, 2)], [0, 1], 4) - 8 / 12) < 1e-12 and mean_wait([5]) == 5` },
          { name: "placement", code: `assert fewest_nodes([1, 1, 1], 3) == [(0, 1), (1, 1), (2, 1)] and fewest_nodes([5, 2], 4) == [(0, 4)] and fewest_nodes([1], 2) is None
assert fewest_nodes([8, 3, 8, 6, 2], 20) == [(0, 8), (2, 8), (3, 4)]` },
        ],
      },
    },
    {
      key: "waits",
      rung: "stretch",
      prompt: (
        <p>
          Jobs needing (4, 2), (5, 6), (2, 1), (2, 3), (4, 1) and (1, 7) nodes and hours queue in that order for a 6-node
          cluster, all submitted at time 0. What is the total waiting time, in hours, under <C>backfill</C>?
        </p>
      ),
      answer: { kind: "numeric", value: 19, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A scheduler places jobs on machines, but a job needs more than machines: the right libraries, drivers and versions,
        identical on every node. The next lesson looks at containers, the standard way to package a program with its whole
        environment.
      </p>
    </>
  ),
};
