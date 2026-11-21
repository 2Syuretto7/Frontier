import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpikeResponseViz } from "@/components/viz/SpikeResponseViz";
import type { LessonContent } from "@/lib/types";

const CLASSIFY = `def find_spikes(losses, w, ratio):
    starts, inside = [], False
    for i in range(w, len(losses)):
        base = sum(losses[i - w:i]) / w
        high = losses[i] > ratio * base
        if high and not inside:
            starts.append(i)                               # first step of a new spike
        inside = high
    return starts

def recovery_steps(losses, start, base, tol):
    for i in range(start + 1, len(losses)):
        if losses[i] <= base + tol:
            return i - start                               # steps until back near the baseline
    return None

def classify(losses, start, base, tol, limit):
    r = recovery_steps(losses, start, base, tol)
    if r is None:
        return "divergent"
    return "transient" if r <= limit else "slow"`;

const ROLLBACK = `def rollback_point(ckpts, spike, margin):
    ok = [c for c in ckpts if c <= spike - margin]
    return max(ok) if ok else None                         # latest checkpoint safely before the spike

def gpu_hours_lost(ckpts, spike, margin, step_s, gpus):
    rb = rollback_point(ckpts, spike, margin)
    if rb is None:
        return None
    return round((spike - rb) * step_s * gpus / 3600, 2)

def suspect_batches(batch_losses, thr):
    s, n = sorted(batch_losses), len(batch_losses)
    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    return [i for i, x in enumerate(batch_losses) if x > thr * med]`;

export const lesson: LessonContent = {
  id: "e13.3.1",
  minutes: 45,
  links: {
    requires: ["e13.2.3"],
    revisits: ["l8.6.2", "e6.3.3", "l8.2.3"],
    foreshadows: ["e13.3.3", "e13.6.1"],
  },

  puzzle: (
    <>
      <p>
        At 2 a.m. the loss jumps from 2.31 to 4.9 in three steps. The run has 2048 GPUs and checkpoints every 500 steps.
        The on-call engineer can let it continue, roll back and replay, roll back with a lower learning rate, or roll
        back and skip the data around the spike. Each choice costs compute and teaches something different about the
        cause. Which should they choose, and what should they write down?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Lesson l8.6.2 explained why spikes happen: a growing logit or a rare large gradient meets an optimiser state
        tuned for calmer data. Operationally, the questions are narrower. Did the loss recover by itself, and how
        quickly? If the run is rolled back and fed the same batches, does the spike come back? Training that resumes
        exactly, as e6.3.3 arranged, turns that replay into an experiment, and the answer tells you whether to change
        the data, the optimiser, or nothing.
      </p>
      <SpikeResponseViz />
    </>
  ),

  theory: (
    <>
      <Definition title="spikes and their outcomes">
        <p>
          A spike starts at a step whose loss exceeds a multiple of the mean over the previous w steps, while the
          previous step did not (<C>find_spikes</C>). Its recovery time is the number of steps until the loss returns
          within a tolerance of the pre-spike baseline (<C>recovery_steps</C>). A spike is transient if it recovers
          within a set limit, slow if it recovers later, and divergent if it never does in the logged window{" "}
          (<C>classify</C>).
        </p>
        <Code>{CLASSIFY}</Code>
      </Definition>

      <Theorem title="the replay test">
        <p>
          Suppose training is bitwise deterministic: the parameters after step t are a fixed function of the
          checkpointed state and the batches from the checkpoint to t. Then replaying from a checkpoint before a spike
          with the same batches reproduces the spike exactly, and a replay that differs only in the batches, or only in
          the learning rate, isolates that factor.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on the step: the state at the checkpoint is identical, and each step applies the same function to
          the same state and the same batch, so every later state and loss is identical. If a replay changes one input
          and the spike disappears, that input was necessary for it. If training is not deterministic, for example
          because of atomic additions in some kernels, a replay that avoids the spike says nothing, which is why exact
          resumption is worth its cost before a long run starts.
        </p>
      </Proof>

      <Example title="the published recipe">
        <p>
          The PaLM report describes spikes that occurred about twenty times during its largest run despite gradient
          clipping. The fix was to restart from a checkpoint roughly 100 steps before the spike and skip roughly 200 to
          500 batches. In ablations, training on the batches around a spike starting from a different, earlier checkpoint did
          not cause a spike, so the authors
          concluded that the spikes came from the combination of particular batches with a particular parameter state,
          not from bad data alone. Skipping data is cheap; lowering the learning rate for the rest of the run is not, so
          it is kept for spikes that recur.
        </p>
      </Example>

      <Remark title="the cost of a rollback">
        <p>
          Roll back to the latest checkpoint at least a margin before the spike, since the parameters may already be
          damaged a few steps before the loss shows it (<C>rollback_point</C>). The steps from that checkpoint to the
          detection are recomputed, which on a large cluster is counted in GPU-hours (<C>gpu_hours_lost</C>), and a
          restart adds a fixed overhead for scheduling, loading and warmup. To name suspects, rank the batches near the
          spike by their loss against the median (<C>suspect_batches</C>) and inspect them: duplicated documents, long
          runs of a single token, and mislabelled languages are common findings. Spikes that need a rollback can be
          modelled as a Poisson process whose rate is estimated from the run so far, which turns the cost of one
          rollback into a budget for the rest of the run.
        </p>
        <Code>{ROLLBACK}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lost",
      rung: "check",
      prompt: (
        <p>
          Checkpoints are written every 500 steps. A spike is detected at step 41,230, and the rule is to roll back to
          the latest checkpoint at least 200 steps before it. A step takes 6 seconds on 2048 GPUs. How many GPU-hours
          are recomputed, ignoring restart overhead?
        </p>
      ),
      answer: { kind: "numeric", value: 785.07, tolerance: 0.001 },
    },
    {
      key: "poisson",
      rung: "check",
      prompt: (
        <p>
          Three spikes that needed a rollback occurred in the first 20,000 steps. Modelling them as a Poisson process at
          that rate, what is the probability that the next 10,000 steps have none?
        </p>
      ),
      answer: { kind: "numeric", value: 0.2231, tolerance: 0.001 },
    },
    {
      key: "replay",
      rung: "apply",
      prompt: (
        <p>
          A deterministic run is rolled back 300 steps and replayed with identical batches, and the spike does not
          recur. What is the most likely explanation?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Something was not actually identical, such as a nondeterministic kernel, a changed library or a different set of nodes",
          "The spike was caused by the data",
          "The learning rate was too high",
          "Spikes never recur after a rollback",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def find_spikes(losses, w, ratio):
    starts, inside = [], False
    for i in range(w, len(losses)):
        base = sum(losses[i - w:i]) / w
        high = losses[i] > ratio * base
        if high and not inside:
            starts.append(i)                               # first step of a new spike
        inside = high
    return starts

def recovery_steps(losses, start, base, tol):
    for i in range(start + 1, len(losses)):
        if losses[i] <= base + tol:
            return i - start                               # steps until back near the baseline
    return None

def classify(losses, start, base, tol, limit):
    r = recovery_steps(losses, start, base, tol)
    if r is None:
        return "divergent"
    return "transient" if r <= limit else "slow"

xs = [2, 2, 2, 5, 6, 2, 2, 7, 3, 2]
print(find_spikes(xs, 3, 2.0), recovery_steps(xs, 3, 2, 0.5), classify(xs, 7, 2, 0.5, 1), classify([2, 9, 8, 7], 1, 2, 0.5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 7] 2 slow divergent",
          "[3, 4, 7] 2 slow divergent",
          "[3, 7] 1 slow divergent",
          "[3, 7] 2 transient divergent",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def rollback_point(ckpts, spike, margin):
    ok = [c for c in ckpts if c <= spike - margin]
    return max(ok) if ok else None                         # latest checkpoint safely before the spike

def gpu_hours_lost(ckpts, spike, margin, step_s, gpus):
    rb = rollback_point(ckpts, spike, margin)
    if rb is None:
        return None
    return round((spike - rb) * step_s * gpus / 3600, 2)

def suspect_batches(batch_losses, thr):
    s, n = sorted(batch_losses), len(batch_losses)
    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    return [i for i, x in enumerate(batch_losses) if x > thr * med]

print(rollback_point([0, 100, 200, 300], 250, 60), gpu_hours_lost([0, 100, 200, 300], 250, 60, 3.6, 10))
print(suspect_batches([1.0, 1.2, 4.0, 1.1, 2.0], 1.5), rollback_point([500], 520, 50))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["100 1.5\n[2, 4] None", "200 0.5\n[2, 4] None", "100 1.5\n[2] 500", "100 150.0\n[2, 4] None"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>find_spikes(losses, w, ratio)</C>, the steps from w onwards where the loss exceeds ratio times the
          mean of the previous w losses and the previous step did not; <C>recovery_steps(losses, start, base, tol)</C>,
          steps after start until a loss at most base + tol, or None; and{" "}
          <C>classify(losses, start, base, tol, limit)</C>, returning &quot;transient&quot;, &quot;slow&quot; or
          &quot;divergent&quot;.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def find_spikes(losses, w, ratio):
    return []

def recovery_steps(losses, start, base, tol):
    return 0

def classify(losses, start, base, tol, limit):
    return "transient"
`,
        solution: CLASSIFY,
        tests: [
          { name: "spikes", code: `assert find_spikes([1, 1, 1, 3, 1, 1, 3, 4, 1], 2, 1.5) == [3, 6] and find_spikes([1, 1], 2, 2) == []` },
          { name: "recover", code: `assert recovery_steps([3, 9, 4, 3], 1, 3, 0.5) == 2 and recovery_steps([3, 9, 9], 1, 3, 0.5) is None and classify([3, 9, 4, 3], 1, 3, 0.5, 1) == "slow" and classify([3, 9, 4, 3], 1, 3, 0.5, 2) == "transient" and classify([3, 9, 9], 1, 3, 0.5, 2) == "divergent"` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rollback_point(ckpts, spike, margin)</C>, the latest checkpoint at most spike minus margin, or None;{" "}
          <C>gpu_hours_lost(ckpts, spike, margin, step_s, gpus)</C>, rounded to two decimals, or None; and{" "}
          <C>suspect_batches(batch_losses, thr)</C>, the indices whose loss exceeds thr times the median.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def rollback_point(ckpts, spike, margin):
    return max(ckpts)

def gpu_hours_lost(ckpts, spike, margin, step_s, gpus):
    return 0.0

def suspect_batches(batch_losses, thr):
    return []
`,
        solution: ROLLBACK,
        tests: [
          { name: "rollback", code: `assert rollback_point([0, 500, 1000], 1100, 200) == 500 and gpu_hours_lost([0, 500, 1000], 1100, 200, 2, 1800) == 600.0 and gpu_hours_lost([100], 120, 50, 1, 1) is None` },
          { name: "suspects", code: `assert suspect_batches([2, 3, 10, 2], 2) == [2] and suspect_batches([1, 1, 1, 1], 1.5) == []` },
        ],
      },
    },
    {
      key: "waste",
      rung: "stretch",
      prompt: (
        <p>
          Spikes needing a rollback arrive at one per 12,000 steps, at positions unrelated to the checkpoint schedule.
          Checkpoints are every 500 steps, the rollback margin is 200 steps, and each restart costs a fixed overhead
          equal to 300 steps. What fraction of the run&apos;s compute goes to rollbacks, on average?
        </p>
      ),
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Many spikes in recent runs trace back to number formats. The next lesson looks at training in FP8 at scale, where
        a scaling factor that is slightly stale can turn into a spike.
      </p>
    </>
  ),
};
