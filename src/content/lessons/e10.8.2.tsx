import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckpointIntervalViz } from "@/components/viz/CheckpointIntervalViz";
import type { LessonContent } from "@/lib/types";

const RATES = `import math

def job_mtbf(n, mtbf_one):
    return mtbf_one / n                             # independent exponential failures add their rates

def waste(tau, C, M, R):
    return C / tau + (tau / 2 + R) / M              # checkpoint cost per unit work, plus expected loss per failure

def young_daly(C, M):
    return math.sqrt(2 * C * M)                     # minimises waste to first order`;

const RUN = `import math

def simulate_run(work, tau, C, R, failures):
    t, saved, fails = 0.0, 0.0, sorted(failures)
    while saved < work:
        seg = min(tau, work - saved)
        end = t + seg + (C if saved + seg < work else 0.0)   # no checkpoint after the last segment
        hit = [f for f in fails if t <= f < end]
        if hit:                                     # lose the segment and restart from the last checkpoint
            t = hit[0] + R
            fails = [f for f in fails if f > hit[0]]
        else:
            t, saved = end, saved + seg
    return t

def replicas_left(failed, dp, per_replica):
    return dp - len({r // per_replica for r in failed})   # a failed GPU takes its whole replica out

def accum_steps(G, mb, replicas):
    return math.ceil(G / (mb * replicas))           # keep the global batch at least G`;

const ELASTIC = `# torchrun restarts all workers when one fails and lets the group shrink or grow.
torchrun --nnodes=120:128 --nproc-per-node=8 --max-restarts=100 \\
         --rdzv-backend=c10d --rdzv-endpoint=$HEAD:29400 train.py
# train.py loads the latest checkpoint on every start, rebuilds its mesh from the
# world size it finds, and recomputes accumulation steps to keep the global batch.`;

export const lesson: LessonContent = {
  id: "e10.8.2",
  minutes: 45,
  links: {
    requires: ["e10.8.1", "e10.7.1"],
    revisits: ["m7.3.2", "e10.2.3"],
    foreshadows: ["e10.8.3", "e10.8.4"],
  },

  puzzle: (
    <>
      <p>
        A GPU server fails perhaps once every few years. A training job on 16,000 GPUs fails every few hours: Meta reported about 419
        unexpected interruptions in 54 days while training Llama 3. Checkpoint too often and the run spends its time writing; too
        rarely and each failure throws away hours. What interval minimises the loss, and must the whole job wait for a broken node to
        be repaired?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        If each GPU fails independently at a small rate, the job fails at the sum of the rates, so its mean time between failures is
        the single GPU&apos;s divided by the number of GPUs. Between failures the run pays a checkpoint every τ hours and, at each
        failure, loses on average half an interval of work plus the restart. The first cost falls with τ and the second rises, so
        there is a best τ. A job that can shrink, dropping the data-parallel replica that lost a GPU, keeps training while the node is
        replaced.
      </p>
      <CheckpointIntervalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="failure rates">
        <p>
          Model each GPU&apos;s time to failure as exponential with mean m (m7.3.2), independently. The first failure among n GPUs
          is then exponential with mean <M>{"M = m/n"}</M> (<C>job_mtbf</C>).
        </p>
      </Definition>

      <Theorem title="the Young–Daly interval">
        <p>
          With checkpoint cost C, restart cost R and job mean time between failures M, the fraction of time wasted with interval τ is
          approximately
        </p>
        <MD>{"w(\\tau) = \\frac{C}{\\tau} + \\frac{\\tau/2 + R}{M},"}</MD>
        <p>
          minimised at <M>{"\\tau^* = \\sqrt{2CM}"}</M>, where <M>{"w(\\tau^*) = \\sqrt{2C/M} + R/M"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each τ of work costs C to checkpoint, a fraction C/τ. Failures arrive at rate 1/M; each loses the work since the last
          checkpoint, uniform over the interval with mean τ/2 when <M>{"\\tau \\ll M"}</M>, plus R. Setting{" "}
          <M>{"w'(\\tau) = -C/\\tau^2 + 1/(2M) = 0"}</M> gives <M>{"\\tau^2 = 2CM"}</M>, and substituting gives the minimum; the
          second derivative <M>{"2C/\\tau^3"}</M> is positive (<C>waste</C>, <C>young_daly</C>).
        </p>
        <Code>{RATES}</Code>
      </Proof>

      <Remark title="checking the approximation">
        <p>
          The formula ignores failures during checkpoints and restarts and treats losses as uniform. A direct simulation replays a list
          of failure times: run up to τ of work, checkpoint, and on a failure go back to the last checkpoint after paying R (
          <C>simulate_run</C>). Averaged over random failure times, it agrees with the formula when τ and R are small compared with M,
          which is the regime that matters.
        </p>
        <Code>{RUN}</Code>
      </Remark>

      <Theorem title="shrinking instead of waiting">
        <p>
          On a dp × (pp·tp) mesh, a failed GPU removes its whole data-parallel replica, so f failed GPUs leave at least dp − f replicas
          (<C>replicas_left</C>). With r replicas, micro-batch μ and global batch G, the job continues with{" "}
          <M>{"\\lceil G/(\\mu r)\\rceil"}</M> accumulation steps (<C>accum_steps</C>), the same optimisation at a throughput of about
          r/dp.
        </p>
      </Theorem>
      <Proof>
        <p>
          Replica i consists of the ranks with data-parallel coordinate i, the ranks <M>{"i\\cdot pp\\cdot tp"}</M> to{" "}
          <M>{"(i+1)\\cdot pp \\cdot tp - 1"}</M> (e10.7.1); a replica missing any shard cannot compute, and the others are unaffected.
          Accumulating more micro-batches per replica keeps the global batch and so the gradient, as in e10.2.3; the work per step is
          unchanged and is now done by r replicas instead of dp.
        </p>
        <Code>{ELASTIC}</Code>
      </Proof>

      <Example title="the puzzle, resolved">
        <p>
          The job&apos;s failure rate is the sum of its parts&apos;, so at 16,000 GPUs failures come every few hours. Checkpointing every{" "}
          <M>{"\\sqrt{2CM}"}</M> balances writing against lost work; fast asynchronous checkpoints make C small, which shortens the
          best interval and lowers the waste as <M>{"\\sqrt{C}"}</M>. And the job need not wait for repairs: it drops the broken replica,
          raises accumulation to keep the batch, and grows back when the node returns.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "mtbf",
      rung: "check",
      prompt: <p>Each of 16,384 GPUs fails on average once every 50,000 hours, independently. What is the job&apos;s mean time between failures, in hours? Give two decimals.</p>,
      answer: { kind: "numeric", value: 3.05, tolerance: 0.01 },
    },
    {
      key: "interval",
      rung: "check",
      prompt: <p>A checkpoint stalls training for 2 minutes and the job fails on average every 3 hours. What is the Young–Daly interval in minutes? Give two decimals.</p>,
      answer: { kind: "numeric", value: 26.83, tolerance: 0.01 },
    },
    {
      key: "faster",
      rung: "apply",
      prompt: <p>Asynchronous checkpointing cuts the stall C by a factor of 16. By what factor does the checkpoint-related waste at the best interval fall, ignoring R?</p>,
      answer: {
        kind: "choice",
        options: ["4, since the waste scales as the square root of C", "16", "2", "It does not change; only the interval does"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def job_mtbf(n, mtbf_one):
    return mtbf_one / n                             # independent exponential failures add their rates

def waste(tau, C, M, R):
    return C / tau + (tau / 2 + R) / M              # checkpoint cost per unit work, plus expected loss per failure

def young_daly(C, M):
    return math.sqrt(2 * C * M)                     # minimises waste to first order

x = round(waste(10.0, 0.5, 100.0, 1.0), 4)
print(job_mtbf(1000, 5000.0), round(young_daly(0.5, 100.0), 3), x)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["5.0 10.0 0.11", "5.0 10.0 0.06", "5000.0 10.0 0.11", "5.0 7.071 0.11"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def simulate_run(work, tau, C, R, failures):
    t, saved, fails = 0.0, 0.0, sorted(failures)
    while saved < work:
        seg = min(tau, work - saved)
        end = t + seg + (C if saved + seg < work else 0.0)   # no checkpoint after the last segment
        hit = [f for f in fails if t <= f < end]
        if hit:                                     # lose the segment and restart from the last checkpoint
            t = hit[0] + R
            fails = [f for f in fails if f > hit[0]]
        else:
            t, saved = end, saved + seg
    return t

def replicas_left(failed, dp, per_replica):
    return dp - len({r // per_replica for r in failed})   # a failed GPU takes its whole replica out

def accum_steps(G, mb, replicas):
    return math.ceil(G / (mb * replicas))           # keep the global batch at least G

y = simulate_run(4.0, 1.0, 0.1, 0.5, [1.5])
print(round(simulate_run(4.0, 1.0, 0.1, 0.5, []), 3), round(y, 3), replicas_left([0, 3, 9], 4, 4), accum_steps(64, 2, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["4.3 5.2 2 11", "4.4 5.2 2 11", "4.3 4.7 2 11", "4.3 5.2 3 11"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>job_mtbf(n, mtbf_one)</C>; <C>waste(tau, C, M, R)</C>, the first-order wasted fraction; and{" "}
          <C>young_daly(C, M)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def job_mtbf(n, mtbf_one):
    return mtbf_one

def waste(tau, C, M, R):
    return 0.0

def young_daly(C, M):
    return C
`,
        solution: RATES,
        tests: [
          { name: "mtbf", code: `assert job_mtbf(10, 50.0) == 5.0 and abs(young_daly(2.0, 9.0) - 6.0) < 1e-12` },
          { name: "waste", code: `assert abs(waste(4.0, 1.0, 20.0, 2.0) - 0.45) < 1e-12\nbest = waste(young_daly(0.1, 10.0), 0.1, 10.0, 0.0)\nassert all(best <= waste(t, 0.1, 10.0, 0.0) + 1e-12 for t in (0.5, 1.0, 1.5, 2.0))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simulate_run(work, tau, C, R, failures)</C>, the wall-clock time to finish, checkpointing after every segment but the
          last, a failure during a segment or its checkpoint losing that segment and costing R; <C>replicas_left(failed, dp,
          per_replica)</C>; and <C>accum_steps(G, mb, replicas)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def simulate_run(work, tau, C, R, failures):
    return work

def replicas_left(failed, dp, per_replica):
    return dp

def accum_steps(G, mb, replicas):
    return 1
`,
        solution: RUN,
        tests: [
          { name: "run", code: `assert simulate_run(3.0, 1.0, 0.5, 1.0, []) == 4.0 and simulate_run(2.0, 2.0, 0.5, 1.0, [1.0]) == 4.0\nassert abs(simulate_run(2.0, 1.0, 0.5, 1.0, [1.2]) - 4.7) < 1e-9` },
          { name: "elastic", code: `assert replicas_left([5], 3, 4) == 2 and replicas_left([], 3, 4) == 3 and replicas_left([0, 1, 2, 3], 3, 4) == 2\nassert accum_steps(64, 2, 4) == 8 and accum_steps(10, 1, 3) == 4` },
        ],
      },
    },
    {
      key: "replay",
      rung: "stretch",
      prompt: (
        <p>
          A run needs 10 hours of work, checkpoints every 2 hours of work at a cost of 0.1 hours, and takes 0.5 hours to restart. Failures
          strike at wall-clock hours 3.0 and 7.5. When does it finish, in hours?
        </p>
      ),
      answer: { kind: "numeric", value: 14.2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Not every problem is a clean failure. A GPU that runs a few percent slow, or a link that drops packets, slows every step for
        everyone without stopping the job. The next lesson finds and handles these stragglers.
      </p>
    </>
  ),
};
