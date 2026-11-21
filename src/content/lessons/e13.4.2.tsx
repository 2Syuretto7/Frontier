import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckpointIntervalViz } from "@/components/viz/CheckpointIntervalViz";
import type { LessonContent } from "@/lib/types";

const INTERVAL = `import math

def waste(tau, delta, mtbf, restart):
    return delta / tau + (tau / 2 + restart) / mtbf        # pauses, plus expected loss per failure

def young_interval(delta, mtbf):
    return math.sqrt(2 * delta * mtbf)

def best_interval(cands, delta, mtbf, restart):
    return min(cands, key=lambda t: waste(t, delta, mtbf, restart))`;

const STORAGE = `def ckpt_size_gb(params, weight_bytes, opt_bytes):
    return params * (weight_bytes + opt_bytes) / 1e9

def write_seconds(size_gb, gbps_per_node, nodes):
    return size_gb / (gbps_per_node * nodes)               # every node writes its own shard in parallel

def retained(steps, keep_last, every):
    last = set(sorted(steps)[-keep_last:]) if keep_last > 0 else set()
    return sorted(s for s in steps if s in last or s % every == 0)`;

export const lesson: LessonContent = {
  id: "e13.4.2",
  minutes: 40,
  links: {
    requires: ["e13.4.1"],
    revisits: ["e10.8.1", "e6.3.3", "e13.3.1"],
    foreshadows: ["e13.4.3"],
  },

  puzzle: (
    <>
      <p>
        One engineer wants a checkpoint every five minutes, so that a failure never costs much. Another wants one every
        two hours, because each checkpoint pauses two thousand GPUs for a minute. Both are arguing about the same
        quantity, the fraction of the run that is wasted. Is there an interval that is right, and what does it depend on?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Frequent checkpoints waste time pausing to write them; rare ones waste the work done since the last one whenever
        a failure strikes, half an interval on average. One cost falls with the interval and the other rises, so there
        is a best interval, and it grows only with the square root of the pause and of the time between failures.
        Making the pause shorter, by writing asynchronously, helps more than tuning the interval.
      </p>
      <CheckpointIntervalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the waste of a checkpoint interval">
        <p>
          Let a checkpoint pause training for δ seconds every τ seconds, let the job fail on average every M seconds,
          and let each restart take R seconds. Each failure loses the restart plus, on average, half an interval of
          work. To first order, for <M>{"\\delta \\ll \\tau \\ll M"}</M>, the fraction of time wasted is{" "}
          <M>{"\\delta/\\tau + (\\tau/2 + R)/M"}</M> (<C>waste</C>).
        </p>
        <Code>{INTERVAL}</Code>
      </Definition>

      <Theorem title="Young's interval">
        <p>
          The waste is minimised at <M>{"\\tau^* = \\sqrt{2 \\delta M}"}</M> (<C>young_interval</C>), and at that
          interval the time spent pausing equals the expected work lost per unit time.
        </p>
      </Theorem>
      <Proof>
        <p>
          The derivative of the waste with respect to τ is <M>{"-\\delta/\\tau^2 + 1/(2M)"}</M>, which is negative
          below <M>{"\\sqrt{2\\delta M}"}</M> and positive above it, so that point is the minimum. Substituting it,{" "}
          <M>{"\\delta/\\tau^* = \\delta/\\sqrt{2\\delta M} = \\sqrt{\\delta/(2M)}"}</M> and{" "}
          <M>{"\\tau^*/(2M) = \\sqrt{2\\delta M}/(2M) = \\sqrt{\\delta/(2M)}"}</M>, which are equal. The restart term
          does not depend on τ, so it shifts the waste without moving the minimum. Daly refined the formula for larger
          δ, and in practice the interval is also rounded to a whole number of steps (<C>best_interval</C>).
        </p>
      </Proof>

      <Example title="what a checkpoint holds">
        <p>
          With mixed precision and Adam, a checkpoint holds BF16 weights at 2 bytes a parameter and an optimiser state
          of FP32 master weights and two FP32 moments at 12 bytes, plus the data loader position and random states that
          exact resumption needs (e6.3.3). Every rank writes its own shard in parallel (e10.8.1), so the write time is the
          size divided by the aggregate bandwidth (<C>ckpt_size_gb</C>, <C>write_seconds</C>). Asynchronous
          checkpointing cuts the pause to the time needed to copy the shards to host memory, and writes to storage in the
          background while training continues; some systems also keep recent checkpoints in the memory of other nodes, so
          a restart can reload from RAM in seconds rather than from storage in minutes.
        </p>
        <Code>{STORAGE}</Code>
      </Example>

      <Remark title="retention and testing">
        <p>
          Recovering from failures needs only the latest checkpoint, but recovering from spikes needs one from before
          the spike, and analysis needs milestones across the whole run. A common policy keeps the last few checkpoints
          plus one every so many steps (<C>retained</C>). A checkpoint that has never been restored is a hope rather
          than a backup: restore one into a fresh job on a schedule, check that the loss on a fixed batch matches to the
          last bit, and alert if it does not.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "young",
      rung: "check",
      prompt: (
        <p>
          A checkpoint pauses training for 75 seconds and the job fails on average every 2.5 hours. What is Young&apos;s
          interval, in seconds, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 1161.9, tolerance: 0.001 },
    },
    {
      key: "write",
      rung: "check",
      prompt: (
        <p>
          A 70-billion-parameter model is checkpointed with 2 bytes of weights and 12 bytes of optimiser state per
          parameter, by 128 nodes each writing at 2 GB/s (10<sup>9</sup> bytes per second). How many seconds does the
          write take?
        </p>
      ),
      answer: { kind: "numeric", value: 3.828, tolerance: 0.002 },
    },
    {
      key: "lever",
      rung: "apply",
      prompt: (
        <p>
          At Young&apos;s interval, the waste excluding restarts is <M>{"\\sqrt{2\\delta/M}"}</M>. Which change reduces
          it by the largest factor?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Cutting the pause from 100 seconds to 1 second with asynchronous writes",
          "Doubling the time between failures",
          "Halving the checkpoint interval",
          "Keeping more old checkpoints",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def waste(tau, delta, mtbf, restart):
    return delta / tau + (tau / 2 + restart) / mtbf        # pauses, plus expected loss per failure

def young_interval(delta, mtbf):
    return math.sqrt(2 * delta * mtbf)

def best_interval(cands, delta, mtbf, restart):
    return min(cands, key=lambda t: waste(t, delta, mtbf, restart))

print(waste(100, 10, 1000, 50), young_interval(8, 400))
print(best_interval([10, 80, 200], 8, 400, 0), round(waste(80, 8, 400, 0), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.2 80.0\n80 0.2", "0.15 80.0\n80 0.2", "0.2 56.568542494923804\n80 0.2", "0.2 80.0\n200 0.29"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def ckpt_size_gb(params, weight_bytes, opt_bytes):
    return params * (weight_bytes + opt_bytes) / 1e9

def write_seconds(size_gb, gbps_per_node, nodes):
    return size_gb / (gbps_per_node * nodes)               # every node writes its own shard in parallel

def retained(steps, keep_last, every):
    last = set(sorted(steps)[-keep_last:]) if keep_last > 0 else set()
    return sorted(s for s in steps if s in last or s % every == 0)

print(ckpt_size_gb(1e9, 2, 12), write_seconds(16.0, 2, 4))
print(retained([100, 200, 300, 400, 500], 2, 200))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "14.0 2.0\n[200, 400, 500]",
          "14.0 2.0\n[400, 500]",
          "12.0 2.0\n[200, 400, 500]",
          "14.0 32.0\n[200, 400, 500]",
        ],
        correct: [0],
      },
    },
    {
      key: "code",
      rung: "apply",
      prompt: (
        <p>
          Write <C>waste(tau, delta, mtbf, restart)</C> using the first-order model, <C>young_interval(delta, mtbf)</C>,
          and <C>best_interval(cands, delta, mtbf, restart)</C>, the candidate interval with the least waste.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def waste(tau, delta, mtbf, restart):
    return delta / tau

def young_interval(delta, mtbf):
    return delta

def best_interval(cands, delta, mtbf, restart):
    return cands[0]
`,
        solution: INTERVAL,
        tests: [
          { name: "waste", code: `assert waste(50, 5, 500, 25) == 0.2 and young_interval(2, 100) == 20.0` },
          { name: "best", code: `assert best_interval([5, 20, 60], 2, 100, 0) == 20 and best_interval([30], 1, 1, 1) == 30` },
        ],
      },
    },
    {
      key: "code2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ckpt_size_gb(params, weight_bytes, opt_bytes)</C> in units of 10<sup>9</sup> bytes;{" "}
          <C>write_seconds(size_gb, gbps_per_node, nodes)</C>; and <C>retained(steps, keep_last, every)</C>, the sorted
          steps that are among the last keep_last or divisible by every.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def ckpt_size_gb(params, weight_bytes, opt_bytes):
    return params * weight_bytes / 1e9

def write_seconds(size_gb, gbps_per_node, nodes):
    return size_gb / gbps_per_node

def retained(steps, keep_last, every):
    return steps
`,
        solution: STORAGE,
        tests: [
          { name: "size", code: `assert ckpt_size_gb(2e9, 2, 14) == 32.0 and write_seconds(32.0, 4, 2) == 4.0` },
          { name: "keep", code: `assert retained([10, 20, 30, 40], 1, 20) == [20, 40] and retained([5, 15], 0, 10) == [] and retained([7, 3, 9], 2, 100) == [7, 9]` },
        ],
      },
    },
    {
      key: "async",
      rung: "stretch",
      prompt: (
        <p>
          Asynchronous checkpointing reduces the pause to 5 seconds. The job fails on average every 3 hours and each
          restart takes 10 minutes. Checkpointing at Young&apos;s interval, what fraction of the run is wasted, to three
          decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.086, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Checkpoints protect against failures that announce themselves. The next lesson is about the ones that do not:
        hardware that keeps running while returning wrong numbers.
      </p>
    </>
  ),
};
