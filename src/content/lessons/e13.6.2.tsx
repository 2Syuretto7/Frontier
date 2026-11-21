import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RunLogViz } from "@/components/viz/RunLogViz";
import type { LessonContent } from "@/lib/types";

const PARSE = `def parse_line(line):
    rec = {}
    for tok in line.split():
        if "=" in tok:
            k, v = tok.split("=", 1)
            rec[k] = float(v)                              # every logged field as a number
    return rec

def restarts(recs):
    return [(a["step"], b["step"]) for a, b in zip(recs, recs[1:]) if b["step"] <= a["step"]]

def lr_changes(recs, rel):
    return [b["step"] for a, b in zip(recs, recs[1:]) if abs(b["lr"] - a["lr"]) > rel * a["lr"]]`;

const ACCOUNT = `def executed_steps(steps):
    return sum(b - a for a, b in zip(steps, steps[1:]) if b > a)   # redone steps count again

def kept_fraction(steps):
    return (steps[-1] - steps[0]) / executed_steps(steps)

def throughput(steps, hours, step_tokens):
    return (steps[-1] - steps[0]) * step_tokens / (hours[-1] - hours[0])`;

export const lesson: LessonContent = {
  id: "e13.6.2",
  minutes: 40,
  links: {
    requires: ["e13.6.1", "e13.4.1"],
    revisits: ["e13.3.1", "l8.6.2", "e13.1.1"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        A team about to start its first run at this scale has never had a spike, a failed node or a silent corruption in
        production. Other teams have, and a few of them published their logbooks: the raw notes and metrics of runs that
        took months. What can be learned from someone else&apos;s logbook that cannot be learned from their paper, and
        how should it be read?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A paper reports the run that worked. A logbook records the run that happened: restarts, rollbacks, learning-rate
        cuts made at 3 a.m., hosts swapped out, and the reasoning at the time. Read as data, it gives failure rates,
        restart costs and the warning signs that preceded each intervention, which are exactly the numbers a new run
        needs for its plan. Read carefully, it also shows what the authors did not yet know when they made each
        decision.
      </p>
      <RunLogViz />
    </>
  ),

  theory: (
    <>
      <Definition title="reading a run log">
        <p>
          A run log is a sequence of records, each a set of fields such as step, loss, learning rate and time{" "}
          (<C>parse_line</C>). A restart appears as a record whose step does not exceed the previous one, giving the step
          abandoned and the step resumed from (<C>restarts</C>). A manual intervention on the learning rate appears as a
          change larger than the schedule makes between records (<C>lr_changes</C>). From the step column alone one can
          count the steps executed, including those redone, and the fraction kept (<C>executed_steps</C>,{" "}
          <C>kept_fraction</C>), and with timestamps the throughput actually achieved (<C>throughput</C>).
        </p>
        <Code>{PARSE}</Code>
      </Definition>

      <Theorem title="where the wall-clock went">
        <p>
          If every executed step takes time t, a log with K steps kept, E steps executed and wall-clock time W has
          downtime <M>{"D = W - Et"}</M>, and its effective training time fraction is{" "}
          <M>{"Kt/W = (K/E)(1 - D/W)"}</M>: the fraction of computed steps that were kept, times the fraction of time
          spent computing at all.
        </p>
      </Theorem>
      <Proof>
        <p>
          Wall-clock time is spent either executing steps, Et in total, or not executing them, which defines D. The
          useful part is the time for kept steps, Kt. Then{" "}
          <M>{"Kt/W = (K/E) \\cdot (Et/W) = (K/E)(1 - D/W)"}</M>. The two factors call for different fixes: redone
          steps are reduced by checkpointing and by catching problems early, downtime by faster detection, restarts and
          spares, as in chapter 4.
        </p>
      </Proof>

      <Example title="logs that have been published">
        <p>
          Meta released the logbook of OPT-175B, whose paper reports at least 35 manual restarts and more than 100 hosts
          cycled out over about two months, along with loss divergences handled by rolling back and lowering the
          learning rate. The BigScience team published day-by-day chronicles of BLOOM&apos;s training. The OLMo
          releases include complete training metrics. Reports without full logs still carry operational numbers: the
          interruption counts of Llama 3 in e13.4.1, and DeepSeek-V3&apos;s statement that its pre-training ran without
          irrecoverable loss spikes or rollbacks, a claim about a recipe that the other logs make easier to appreciate.
        </p>
      </Example>

      <Remark title="reading critically">
        <p>
          Published logs come from runs that finished, so they understate how often runs are abandoned. They also
          describe older hardware, software and recipes, so their failure rates are a starting estimate to be updated
          with your own, not a forecast. Look for what preceded each intervention, such as a rising gradient norm or a
          change of data shard, and turn it into a metric and an alert for your run (e13.2.1, e13.2.3). Plot every log
          against both steps and wall-clock time, since each view hides what the other shows.
        </p>
        <Code>{ACCOUNT}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "kept",
      rung: "check",
      prompt: (
        <p>
          A log&apos;s step column reads 0, 5000, 9000, 8200, 15000, 14100, 20000 in successive records. What fraction of
          the executed steps were kept, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9217, tolerance: 0.001 },
    },
    {
      key: "effective",
      rung: "check",
      prompt: (
        <p>
          A run kept 20,000 steps at 9 seconds per step, and the log spans 70 hours of wall-clock time. What is its
          effective training time fraction, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7143, tolerance: 0.001 },
    },
    {
      key: "bias",
      rung: "apply",
      prompt: <p>Why do published logbooks tend to understate the operational risk of a large run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Runs that were abandoned are rarely written up, so the sample is of runs that survived",
          "Logbooks never record failures",
          "Hardware failures are not logged",
          "Published runs use smaller models",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def parse_line(line):
    rec = {}
    for tok in line.split():
        if "=" in tok:
            k, v = tok.split("=", 1)
            rec[k] = float(v)                              # every logged field as a number
    return rec

def restarts(recs):
    return [(a["step"], b["step"]) for a, b in zip(recs, recs[1:]) if b["step"] <= a["step"]]

def lr_changes(recs, rel):
    return [b["step"] for a, b in zip(recs, recs[1:]) if abs(b["lr"] - a["lr"]) > rel * a["lr"]]

recs = [parse_line(s) for s in ["step=100 loss=2.5 lr=3e-4", "step=200 loss=2.4 lr=3e-4", "step=150 loss=2.45 lr=2e-4", "step=250 loss=2.3 lr=2e-4"]]
print(recs[0], restarts(recs), lr_changes(recs, 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'step': 100.0, 'loss': 2.5, 'lr': 0.0003} [(200.0, 150.0)] [150.0]",
          "{'step': 100.0, 'loss': 2.5, 'lr': 0.0003} [(150.0, 200.0)] [150.0]",
          "{'step': 100.0, 'loss': 2.5, 'lr': 0.0003} [(200.0, 150.0)] [200.0]",
          "{'step': '100', 'loss': '2.5', 'lr': '3e-4'} [(200.0, 150.0)] [150.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def executed_steps(steps):
    return sum(b - a for a, b in zip(steps, steps[1:]) if b > a)   # redone steps count again

def kept_fraction(steps):
    return (steps[-1] - steps[0]) / executed_steps(steps)

def throughput(steps, hours, step_tokens):
    return (steps[-1] - steps[0]) * step_tokens / (hours[-1] - hours[0])

print(executed_steps([0, 100, 200, 150, 250]), kept_fraction([0, 100, 200, 150, 250]))
print(throughput([0, 100, 200, 150, 250], [0, 1, 2, 3, 4], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "300 0.8333333333333334\n125.0",
          "250 1.0\n125.0",
          "300 0.8333333333333334\n62.5",
          "350 0.7142857142857143\n125.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>parse_line(line)</C>, a dict of every key=value token with the value as a float;{" "}
          <C>restarts(recs)</C>, pairs of (previous step, step) wherever the step does not increase; and{" "}
          <C>lr_changes(recs, rel)</C>, the steps at which the learning rate differs from the previous record&apos;s by
          more than rel times it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def parse_line(line):
    return {}

def restarts(recs):
    return []

def lr_changes(recs, rel):
    return []
`,
        solution: PARSE,
        tests: [
          { name: "parse", code: `assert parse_line("# step=5 note lr=1e-3") == {"step": 5.0, "lr": 0.001} and parse_line("") == {}` },
          { name: "events", code: `r = [{"step": 1, "lr": 1.0}, {"step": 2, "lr": 1.05}, {"step": 2, "lr": 0.5}, {"step": 1, "lr": 0.5}]; assert restarts(r) == [(2, 2), (2, 1)] and lr_changes(r, 0.1) == [2]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>executed_steps(steps)</C>, the sum of every increase in the step column;{" "}
          <C>kept_fraction(steps)</C>, the net progress over the executed steps; and{" "}
          <C>throughput(steps, hours, step_tokens)</C>, net tokens per hour of wall-clock time.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def executed_steps(steps):
    return steps[-1] - steps[0]

def kept_fraction(steps):
    return 1.0

def throughput(steps, hours, step_tokens):
    return 0.0
`,
        solution: ACCOUNT,
        tests: [
          { name: "executed", code: `assert executed_steps([0, 50, 30, 80]) == 100 and executed_steps([5]) == 0 and kept_fraction([0, 50, 30, 80]) == 0.8` },
          { name: "rate", code: `assert throughput([10, 30], [2.0, 6.0], 1000) == 5000.0` },
        ],
      },
    },
    {
      key: "poisson",
      rung: "stretch",
      prompt: (
        <p>
          A published logbook of a 60-day run lists 35 restarts. Modelling restarts as a Poisson process at that rate,
          what is the probability that a given 24-hour period had none, to three decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.558, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        This course has followed a large run from its budget to its postmortem. The capstone puts it to use, on a run
        you plan, monitor and write up yourself.
      </p>
    </>
  ),
};
