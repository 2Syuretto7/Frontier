import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CheckpointIntervalViz } from "@/components/viz/CheckpointIntervalViz";
import type { LessonContent } from "@/lib/types";

const RELIABILITY = `import math

def p_survive(nodes, hours, mtbf_hours):
    return math.exp(-nodes * hours / mtbf_hours)

def system_mtbf(nodes, mtbf_hours):
    return mtbf_hours / nodes

def young_interval(checkpoint_cost, mtbf):
    return math.sqrt(2 * checkpoint_cost * mtbf)`;

const DETECTOR = `def suspects(last_heartbeat, now, timeout):
    return sorted(n for n, t in last_heartbeat.items() if now - t > timeout)

def false_suspicions(delays, timeout):
    return sum(1 for d in delays if d > timeout)

def detection_delay(crash_time, period, timeout):
    last = period * (crash_time // period)
    return last + timeout - crash_time`;

export const lesson: LessonContent = {
  id: "e8.3.1",
  minutes: 45,
  links: {
    requires: ["e8.1.2"],
    revisits: ["e3.6.2", "e6.3.3"],
    foreshadows: ["e8.3.2", "e8.5.3"],
  },

  puzzle: (
    <>
      <p>
        A single GPU server might run for years without a fault. A training job on sixteen thousand GPUs, built from the same
        parts, is interrupted every few hours. And when one machine stops answering, the others cannot tell whether it has
        crashed or is merely slow. How should a distributed program think about failure, and how often should a long training
        run save its state?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Failures are rare for one machine and routine for many: if each of N machines fails independently, the whole job fails
        N times as often. So large systems are designed to expect failure. They save their state regularly (checkpointing),
        detect failures by listening for regular &quot;I am alive&quot; messages (heartbeats), and choose the timeout knowing
        that it can only ever be a guess: wait too briefly and a slow machine is wrongly declared dead; wait too long and a
        crash goes unnoticed while everyone else waits.
      </p>
      <CheckpointIntervalViz />
    </>
  ),

  theory: (
    <>
      <Definition title="failure models">
        <p>Processes can fail in increasingly hostile ways.</p>
        <ul>
          <li><em>Crash-stop</em>: a process halts and never returns.</li>
          <li><em>Crash-recovery</em>: it halts and may later restart, keeping only what it had saved to stable storage.</li>
          <li><em>Omission</em>: it fails to send or receive some messages.</li>
          <li><em>Byzantine</em>: it may do anything, including sending wrong or conflicting messages.</li>
        </ul>
        <p>
          Links can lose, duplicate, delay and reorder messages, and a <em>partition</em> splits the network into groups that
          cannot reach each other. TCP (e3.6.2) hides loss, duplication and reordering on one connection, but not delay or
          partitions.
        </p>
      </Definition>

      <Definition title="timing models">
        <p>
          In a <em>synchronous</em> system, message delays and processing speeds have known bounds. In an{" "}
          <em>asynchronous</em> system there are no bounds at all. A <em>partially synchronous</em> system (Dwork, Lynch and
          Stockmeyer, 1988) behaves asynchronously for a while but eventually respects bounds, which is the realistic model of a
          data centre: usually fast, occasionally stalled by a garbage collector, a congested switch or an overloaded disk.
        </p>
      </Definition>

      <Remark title="detecting failures">
        <p>
          In an asynchronous system a crashed process cannot be told apart from a slow one, because no message is ever
          guaranteed to arrive by a deadline. Practical failure detectors have each process send a heartbeat every period and
          suspect any process silent for longer than a timeout (<C>suspects</C>). A short timeout suspects healthy but slow
          processes (<C>false_suspicions</C> counts heartbeats delayed beyond it); a long one leaves a real crash unnoticed for
          up to the timeout after the last heartbeat (<C>detection_delay</C>). Any distributed algorithm built on such a
          detector must therefore stay correct when its suspicions are wrong.
        </p>
        <Code>{DETECTOR}</Code>
      </Remark>

      <Theorem title="failures at scale">
        <p>
          If each of N nodes fails at times that are exponentially distributed with mean M, independently of the others, the
          time to the first failure is exponential with mean M/N, and the probability of a run of t hours with no failure
          is <M>{"e^{-Nt/M}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A single node survives t hours with probability <M>{"e^{-t/M}"}</M>. By independence, all N survive with probability{" "}
          <M>{"(e^{-t/M})^N = e^{-Nt/M}"}</M>, which is the survival function of an exponential distribution with mean M/N.
        </p>
      </Proof>

      <Theorem title="Young's checkpoint interval">
        <p>
          (Young, 1974.) If a checkpoint costs C and failures arrive every M on average, with C much smaller than M,
          checkpointing every τ wastes approximately <M>{"C/\\tau + \\tau/(2M)"}</M> of the time, which is smallest at{" "}
          <M>{"\\tau^* = \\sqrt{2CM}"}</M>, where the waste is <M>{"\\sqrt{2C/M}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Writing a checkpoint every τ costs a fraction C/τ of the time. Failures arrive at rate 1/M, and each discards the work
          since the last checkpoint, on average τ/2, a fraction τ/(2M). The derivative of the sum,{" "}
          <M>{"-C/\\tau^2 + 1/(2M)"}</M>, vanishes at <M>{"\\tau^2 = 2CM"}</M>, and the second derivative{" "}
          <M>{"2C/\\tau^3"}</M> is positive. At that point both terms equal <M>{"\\sqrt{C/(2M)}"}</M>, so their sum is{" "}
          <M>{"\\sqrt{2C/M}"}</M>.
        </p>
        <Code>{RELIABILITY}</Code>
      </Proof>

      <Remark title="failures in training runs">
        <p>
          Meta reported over four hundred unexpected interruptions in 54 days of training Llama 3 on 16,384 GPUs, most of them
          hardware faults in GPUs and their memory. Large runs therefore checkpoint frequently and asynchronously (e6.3.3), keep
          spare nodes ready, and restart automatically. Some faults are worse than crashes: a GPU that silently computes wrong
          values behaves like a Byzantine process, and is caught only by checks such as comparing loss curves or gradients
          across replicas.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mtbf",
      rung: "check",
      prompt: <p>Each GPU fails on average once in 50,000 hours. How many hours, on average, between failures for a job on 2048 GPUs? Give two decimals.</p>,
      answer: { kind: "numeric", value: 24.41, tolerance: 0.005 },
    },
    {
      key: "young",
      rung: "check",
      prompt: <p>A checkpoint takes 6 minutes and the job fails every 12 hours on average. What is Young&apos;s interval, in minutes? Give two decimals.</p>,
      answer: { kind: "numeric", value: 92.95, tolerance: 0.005 },
    },
    {
      key: "detect",
      rung: "apply",
      prompt: <p>Why can no timeout-based failure detector be perfectly accurate in an asynchronous system?</p>,
      answer: {
        kind: "choice",
        options: [
          "Message delays are unbounded, so a heartbeat from a live process can arrive after any timeout",
          "Heartbeats are lost by TCP",
          "Crashed processes keep sending heartbeats",
          "Clocks cannot measure elapsed time",
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

def p_survive(nodes, hours, mtbf_hours):
    return math.exp(-nodes * hours / mtbf_hours)

def system_mtbf(nodes, mtbf_hours):
    return mtbf_hours / nodes

def young_interval(checkpoint_cost, mtbf):
    return math.sqrt(2 * checkpoint_cost * mtbf)

print(round(p_survive(100, 10, 1000), 4), system_mtbf(1000, 50000), young_interval(2, 100))
print(round(p_survive(1, 0, 5), 4), young_interval(0.5, system_mtbf(4, 400)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3679 50.0 20.0\n1.0 10.0",
          "0.3679 50.0 20.0\n0.0 10.0",
          "0.9048 50.0 20.0\n1.0 10.0",
          "0.3679 50.0 14.142135623730951\n1.0 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def suspects(last_heartbeat, now, timeout):
    return sorted(n for n, t in last_heartbeat.items() if now - t > timeout)

def false_suspicions(delays, timeout):
    return sum(1 for d in delays if d > timeout)

def detection_delay(crash_time, period, timeout):
    last = period * (crash_time // period)
    return last + timeout - crash_time

print(suspects({'a': 10, 'b': 3, 'c': 7}, 12, 4), false_suspicions([0.1, 0.5, 2.0, 0.3, 1.5], 1.0))
print(detection_delay(25, 10, 15), detection_delay(30, 10, 15), detection_delay(7, 5, 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['b', 'c'] 2\n10 15 3",
          "['b'] 2\n10 15 3",
          "['b', 'c'] 3\n10 15 3",
          "['b', 'c'] 2\n10 5 3",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>p_survive(nodes, hours, mtbf_hours)</C>, the probability that no node fails; <C>system_mtbf(nodes, mtbf_hours)</C>;
          and <C>young_interval(checkpoint_cost, mtbf)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def p_survive(nodes, hours, mtbf_hours):
    return 1.0

def system_mtbf(nodes, mtbf_hours):
    return mtbf_hours

def young_interval(checkpoint_cost, mtbf):
    return mtbf
`,
        solution: RELIABILITY,
        tests: [
          { name: "survival", code: `assert abs(p_survive(2, 3, 12) - math.exp(-0.5)) < 1e-12 and p_survive(5, 0, 1) == 1.0 and system_mtbf(1, 7) == 7
assert abs(system_mtbf(8, 100) - 12.5) < 1e-12` },
          { name: "young", code: `assert abs(young_interval(8, 1) - 4) < 1e-12 and young_interval(0, 9) == 0 and abs(young_interval(3, 6) - 6) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>suspects(last_heartbeat, now, timeout)</C>, the sorted names whose last heartbeat is more than{" "}
          <C>timeout</C> before <C>now</C>; <C>false_suspicions(delays, timeout)</C>, the number of delays longer than the timeout;
          and <C>detection_delay(crash_time, period, timeout)</C>, where heartbeats are sent at multiples of the period up to the
          crash and arrive instantly.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def suspects(last_heartbeat, now, timeout):
    return []

def false_suspicions(delays, timeout):
    return 0

def detection_delay(crash_time, period, timeout):
    return timeout
`,
        solution: DETECTOR,
        tests: [
          { name: "suspects", code: `assert suspects({}, 5, 1) == [] and suspects({'x': 0, 'y': 4}, 5, 5) == [] and suspects({'q': 0, 'p': 0}, 10, 3) == ['p', 'q']
assert false_suspicions([], 1) == 0 and false_suspicions([1, 1, 2], 1) == 1 and false_suspicions([3, 4], 2) == 2` },
          { name: "delay", code: `assert detection_delay(0, 4, 6) == 6 and detection_delay(9.5, 2, 3) == 1.5 and detection_delay(11, 5, 5) == 4` },
        ],
      },
    },
    {
      key: "interval",
      rung: "stretch",
      prompt: (
        <p>
          A job runs on 8192 GPUs, each failing on average once in 50,000 hours, and a checkpoint takes 5 minutes. What is
          Young&apos;s interval in minutes? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 60.5, tolerance: 0.05 },
    },
  ],

  glimpse: (
    <>
      <p>
        Detecting failures is not enough: the survivors must agree on what to do next, such as who leads, or which write
        happened first. The next lesson introduces consensus, why it is impossible in the purely asynchronous model, and how
        practical protocols achieve it anyway.
      </p>
    </>
  ),
};
