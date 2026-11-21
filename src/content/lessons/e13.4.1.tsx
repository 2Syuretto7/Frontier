import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FailureTimelineViz } from "@/components/viz/FailureTimelineViz";
import type { LessonContent } from "@/lib/types";

const RATES = `import math

def cluster_mtbf(gpu_mtbf_h, n):
    return gpu_mtbf_h / n                                  # the job stops when any of n GPUs fails

def p_no_failure(hours, gpu_mtbf_h, n):
    return math.exp(-hours / cluster_mtbf(gpu_mtbf_h, n))

def implied_mtbf(failures, days, n):
    return days * 24 * n / failures                        # per-GPU MTBF from an observed count`;

const RESPONSE = `import math

def dead_ranks(last_seen, now, timeout):
    return [r for r, t in enumerate(last_seen) if now - t > timeout]

def downtime_fraction(failures_per_day, detect_min, restart_min, lost_min):
    return round(failures_per_day * (detect_min + restart_min + lost_min) / 1440, 4)

def spares_needed(nodes, node_mtbf_h, repair_h, conf):
    lam = nodes * repair_h / node_mtbf_h                   # expected nodes in repair at once
    s, p = 0, math.exp(-lam)
    total = p
    while total < conf:
        s += 1
        p *= lam / s
        total += p                                         # Poisson probability of at most s down
    return s`;

export const lesson: LessonContent = {
  id: "e13.4.1",
  minutes: 40,
  links: {
    requires: ["e13.3.3"],
    revisits: ["e13.1.2", "e10.8.1"],
    foreshadows: ["e13.4.2", "e13.4.3"],
  },

  puzzle: (
    <>
      <p>
        A GPU vendor quotes a mean time between failures of several years for each accelerator. A team plans a two-month
        run on sixteen thousand of them and budgets for a handful of interruptions. In practice the job stops several
        times a day. Were they sold bad hardware, or did they do the arithmetic wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A synchronous training job is a chain: if any GPU, link, switch or host fails, every rank waits and the job must
        restart. Failure rates of independent parts add, so a job on n GPUs fails n times as often as one GPU. Years
        divided by tens of thousands is hours. At that scale failure is a routine event, and the questions become how
        quickly it is detected, how quickly the job restarts, and how much work is lost each time.
      </p>
      <FailureTimelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="failure rates">
        <p>
          Model each GPU&apos;s time to failure as exponential with mean m, its MTBF. The job&apos;s MTBF on n GPUs is
          m/n (<C>cluster_mtbf</C>), the probability of an uninterrupted window of t hours is{" "}
          <M>{"e^{-tn/m}"}</M> (<C>p_no_failure</C>), and an observed count of failures over a period gives an estimate
          of m by inverting the same relation (<C>implied_mtbf</C>).
        </p>
        <Code>{RATES}</Code>
      </Definition>

      <Theorem title="failure rates add">
        <p>
          If n components fail independently at exponential times with rates <M>{"\\lambda_1, \\dots, \\lambda_n"}</M>,
          the first failure is exponential with rate <M>{"\\lambda_1 + \\dots + \\lambda_n"}</M>. With n identical GPUs
          of MTBF m, the job&apos;s MTBF is m/n.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first failure comes after time t exactly when every component survives past t. By independence that
          probability is <M>{"\\prod_i e^{-\\lambda_i t} = e^{-(\\sum_i \\lambda_i) t}"}</M>, the survival function of
          an exponential with the summed rate. Its mean is the reciprocal of the rate, <M>{"1/(n/m) = m/n"}</M>. Real
          failures are not exactly exponential, since new hardware fails more often early in its life and some faults are
          correlated across a rack, but the scaling with n holds whenever failures are roughly independent.
        </p>
      </Proof>

      <Example title="a published month">
        <p>
          The Llama 3 report describes a 54-day period of pre-training on 16,384 H100 GPUs with 466 job interruptions,
          419 of them unexpected. About 78% of the unexpected ones were attributed to confirmed or suspected hardware
          problems, with faulty GPUs the largest category, followed by GPU memory. Despite roughly eight interruptions a
          day, the team reported more than 90% effective training time, because detection and restarts were automated
          and only a few interruptions needed significant manual work.
        </p>
      </Example>

      <Remark title="detect, restart, replace">
        <p>
          Each interruption costs the time to notice it, the time to restart, and the work since the last checkpoint{" "}
          (<C>downtime_fraction</C>). Collective operations hang rather than fail when a peer dies, so ranks send
          heartbeats and a watchdog declares silent ranks dead after a timeout far shorter than the communication
          library&apos;s default (<C>dead_ranks</C>). Nodes are tested before they join a job, and a pool of spare
          nodes lets a restart proceed while the failed node is repaired; the pool is sized so that, with nodes in repair
          modelled as Poisson, it runs out only rarely (<C>spares_needed</C>).
        </p>
        <Code>{RESPONSE}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "implied",
      rung: "check",
      prompt: (
        <p>
          Treat each of the 419 unexpected interruptions in the 54 days of the Llama 3 example as the failure of one of
          its 16,384 GPUs. What per-GPU MTBF in hours does that imply, to the nearest hour?
        </p>
      ),
      answer: { kind: "numeric", value: 50677, tolerance: 0.0001 },
    },
    {
      key: "window",
      rung: "check",
      prompt: (
        <p>
          A job runs on 2048 GPUs whose per-GPU MTBF is 50,000 hours. What is the probability that a given 4-hour window
          passes with no failure, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8489, tolerance: 0.001 },
    },
    {
      key: "hang",
      rung: "apply",
      prompt: <p>Why do training jobs need their own heartbeat watchdog when the hardware reports errors?</p>,
      answer: {
        kind: "choice",
        options: [
          "Many failures leave the other ranks blocked in a collective that never completes, and nothing reports an error until a long timeout",
          "Hardware never reports errors",
          "Heartbeats make the collectives faster",
          "A watchdog prevents failures from happening",
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

def cluster_mtbf(gpu_mtbf_h, n):
    return gpu_mtbf_h / n                                  # the job stops when any of n GPUs fails

def p_no_failure(hours, gpu_mtbf_h, n):
    return math.exp(-hours / cluster_mtbf(gpu_mtbf_h, n))

def implied_mtbf(failures, days, n):
    return days * 24 * n / failures                        # per-GPU MTBF from an observed count

print(cluster_mtbf(40000, 1000), round(p_no_failure(10, 40000, 1000), 4))
print(implied_mtbf(12, 10, 500))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "40.0 0.7788\n10000.0",
          "40.0 0.9753\n10000.0",
          "40000000.0 0.7788\n10000.0",
          "40.0 0.7788\n416.6666666666667",
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

def dead_ranks(last_seen, now, timeout):
    return [r for r, t in enumerate(last_seen) if now - t > timeout]

def downtime_fraction(failures_per_day, detect_min, restart_min, lost_min):
    return round(failures_per_day * (detect_min + restart_min + lost_min) / 1440, 4)

def spares_needed(nodes, node_mtbf_h, repair_h, conf):
    lam = nodes * repair_h / node_mtbf_h                   # expected nodes in repair at once
    s, p = 0, math.exp(-lam)
    total = p
    while total < conf:
        s += 1
        p *= lam / s
        total += p                                         # Poisson probability of at most s down
    return s

print(dead_ranks([100, 95, 40, 99], 101, 30), downtime_fraction(4, 10, 20, 30))
print(spares_needed(100, 1000, 10, 0.5), spares_needed(10, 1000, 1, 0.9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[2] 0.1667\n1 0", "[2] 0.1667\n2 1", "[0, 1, 2, 3] 0.1667\n1 0", "[2] 0.0417\n1 0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cluster_mtbf(gpu_mtbf_h, n)</C>, <C>p_no_failure(hours, gpu_mtbf_h, n)</C> under the exponential
          model, and <C>implied_mtbf(failures, days, n)</C>, the per-GPU MTBF in hours implied by an observed count.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def cluster_mtbf(gpu_mtbf_h, n):
    return gpu_mtbf_h

def p_no_failure(hours, gpu_mtbf_h, n):
    return 1.0

def implied_mtbf(failures, days, n):
    return days * 24 / failures
`,
        solution: RATES,
        tests: [
          { name: "mtbf", code: `assert cluster_mtbf(50000, 2000) == 25.0 and implied_mtbf(30, 5, 1000) == 4000.0` },
          { name: "survive", code: `assert abs(p_no_failure(25, 50000, 2000) - 0.367879) < 1e-5 and p_no_failure(0, 100, 10) == 1.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dead_ranks(last_seen, now, timeout)</C>, the ranks silent for longer than timeout;{" "}
          <C>downtime_fraction(failures_per_day, detect_min, restart_min, lost_min)</C>, rounded to four decimals; and{" "}
          <C>spares_needed(nodes, node_mtbf_h, repair_h, conf)</C>, the smallest s such that a Poisson count with mean
          nodes × repair_h / node_mtbf_h is at most s with probability at least conf.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def dead_ranks(last_seen, now, timeout):
    return []

def downtime_fraction(failures_per_day, detect_min, restart_min, lost_min):
    return 0.0

def spares_needed(nodes, node_mtbf_h, repair_h, conf):
    return 0
`,
        solution: RESPONSE,
        tests: [
          { name: "dead", code: `assert dead_ranks([10, 50, 55], 60, 10) == [0] and dead_ranks([], 5, 1) == [] and downtime_fraction(3, 4, 16, 20) == 0.0833` },
          { name: "spares", code: `assert spares_needed(200, 1000, 10, 0.9) == 4 and spares_needed(1, 1e6, 1, 0.5) == 0` },
        ],
      },
    },
    {
      key: "pool",
      rung: "stretch",
      prompt: (
        <p>
          A job uses 2048 nodes, each with an MTBF of 6000 hours, and a failed node takes 48 hours to repair. How many
          spare nodes are needed so that, with probability at least 0.99, the pool is not exhausted at a given moment?
        </p>
      ),
      answer: { kind: "numeric", value: 26, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every failure throws away the work since the last checkpoint, and every checkpoint costs time to write. The next
        lesson finds the interval that balances the two.
      </p>
    </>
  ),
};
