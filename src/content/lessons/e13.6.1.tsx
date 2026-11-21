import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { IncidentCostViz } from "@/components/viz/IncidentCostViz";
import type { LessonContent } from "@/lib/types";

const TIMELINE = `from datetime import datetime

def minutes_between(t1, t2):
    f = "%Y-%m-%d %H:%M"
    return (datetime.strptime(t2, f) - datetime.strptime(t1, f)).total_seconds() / 60

def incident_metrics(ev):
    return (minutes_between(ev["start"], ev["detected"]),       # time to detect
            minutes_between(ev["start"], ev["mitigated"]),      # time to mitigate
            minutes_between(ev["start"], ev["resolved"]))       # time to resolve

def gpu_hours_lost(ev, gpus, lost_steps, step_s):
    down = minutes_between(ev["start"], ev["mitigated"]) / 60
    return round(gpus * (down + lost_steps * step_s / 3600), 1)`;

const FOLLOWUP = `def overdue(items, today):
    return [owner for owner, due, done in items if not done and due < today]   # ISO dates compare as strings

def by_cause(incidents):
    totals = {}
    for cause, hours in incidents:
        totals[cause] = totals.get(cause, 0) + hours
    return sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))

def pareto(incidents, frac):
    ranked = by_cause(incidents)
    total, run, out = sum(h for _, h in ranked), 0, []
    for cause, h in ranked:
        if run >= frac * total:
            break
        out.append(cause)                                  # fewest causes covering frac of the loss
        run += h
    return out`;

export const lesson: LessonContent = {
  id: "e13.6.1",
  minutes: 35,
  links: {
    requires: ["e13.5.2"],
    revisits: ["e13.3.1", "e13.2.3", "e13.4.2"],
    foreshadows: ["e13.6.2"],
  },

  puzzle: (
    <>
      <p>
        A run loses most of a night to a loss spike. The next morning everyone agrees on what happened, and the run
        continues. Six months later a different run loses a night to the same failure, and nobody can find out what was
        decided last time, who was meant to change the alert, or whether they did. What should have been written down,
        and how do you make sure it changes something?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A postmortem is the record that turns an incident into a change. It states what happened with timestamps,
        measures the cost of each phase, explains why the systems and the people involved behaved as they did without
        assigning blame, and ends with a short list of actions that have owners and dates. Measured phases show where an
        action helps most; aggregated postmortems show which causes cost the most over a quarter.
      </p>
      <IncidentCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a postmortem">
        <p>
          A postmortem has a summary; the impact, in GPU-hours and in calendar time; a timeline in a single time zone;
          the detection, response and recovery; the root cause and contributing factors; what went well; and action items,
          each with one owner and a due date. From the timeline come the standard measures: time to detect, time to
          mitigate and time to resolve, all from the start of the incident (<C>minutes_between</C>,{" "}
          <C>incident_metrics</C>). The impact counts the GPUs idle or doing work that is later discarded until
          training resumes, plus the steps recomputed after a rollback (<C>gpu_hours_lost</C>).
        </p>
        <Code>{TIMELINE}</Code>
      </Definition>

      <Theorem title="where an action item saves">
        <p>
          If an incident&apos;s lost time is the sum of phase durations <M>{"d_1, \\dots, d_k"}</M> on G GPUs, and
          incidents of this kind occur at rate λ per unit time, then shortening phase j by Δ saves{" "}
          <M>{"\\lambda G \\Delta"}</M> GPU-hours per unit time, whatever the other phases are.
        </p>
      </Theorem>
      <Proof>
        <p>
          The GPU-hours lost per incident are <M>{"G \\sum_i d_i"}</M>, plus recomputation, which does not depend on{" "}
          <M>{"d_j"}</M>. Replacing <M>{"d_j"}</M> by <M>{"d_j - \\Delta"}</M> reduces the loss per incident by{" "}
          <M>{"G\\Delta"}</M>, and multiplying by the expected number of incidents per unit time gives the saving, by
          linearity of expectation. The consequence is practical: an action item should name the phase it shortens and
          by how much, so that its value can be compared with its cost.
        </p>
      </Proof>

      <Example title="a loss-spike postmortem in outline">
        <p>
          Summary: a loss spike at step 212,400 was rolled back and the run resumed after 1 hour 51 minutes. Impact:
          every GPU from the start of the spike to the restart, the discarded steps, and two hours of calendar time. Timeline: spike begins; the alert of e13.2.3 fires 17
          minutes later; the on-call engineer acknowledges 21 minutes after that; rollback to the checkpoint chosen by
          the rule of e13.3.1; training resumes. Root cause: a run of near-duplicate documents met a high learning rate;
          contributing factors: the alert needed three consecutive exceedances, and the page went to a phone on silent.
          Action items: reduce the debounce for loss spikes (owner, date); add a second on-call contact (owner, date);
          deduplicate the source (owner, date).
        </p>
      </Example>

      <Remark title="closing the loop">
        <p>
          Blamelessness is practical, not polite: people who expect blame write vaguer postmortems, and the vague parts
          are where the causes hide. A postmortem is reviewed by people outside the incident, and its action items are
          tracked to completion; a weekly list of overdue items keeps them visible (<C>overdue</C>). Across many
          postmortems, total the cost by cause and find the few causes that account for most of it (<C>by_cause</C>,{" "}
          <C>pareto</C>), which is where engineering effort should go next quarter.
        </p>
        <Code>{FOLLOWUP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "impact",
      rung: "check",
      prompt: (
        <p>
          On 4096 GPUs, a spike begins at 02:14 and training resumes from a rollback at 04:05. The rollback discards the
          300 steps between the checkpoint and the start of the spike, at 5 seconds per step. Counting both, how many
          GPU-hours were lost, to one decimal?
        </p>
      ),
      answer: { kind: "numeric", value: 9284.3, tolerance: 0.001 },
    },
    {
      key: "share",
      rung: "check",
      prompt: (
        <p>
          A quarter&apos;s postmortems attribute lost GPU-hours as follows: hardware 41,000; loss spikes 18,000; storage
          9,000; configuration errors 6,000; other 2,000. What fraction of the total do the two largest causes account
          for, to four decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7763, tolerance: 0.001 },
    },
    {
      key: "blameless",
      rung: "apply",
      prompt: <p>Which root-cause statement belongs in a blameless postmortem?</p>,
      answer: {
        kind: "choice",
        options: [
          "The alert required three consecutive exceedances, so a two-step spike did not page",
          "The on-call engineer should have been watching the dashboard",
          "The data team was careless",
          "Human error",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from datetime import datetime

def minutes_between(t1, t2):
    f = "%Y-%m-%d %H:%M"
    return (datetime.strptime(t2, f) - datetime.strptime(t1, f)).total_seconds() / 60

def incident_metrics(ev):
    return (minutes_between(ev["start"], ev["detected"]),       # time to detect
            minutes_between(ev["start"], ev["mitigated"]),      # time to mitigate
            minutes_between(ev["start"], ev["resolved"]))       # time to resolve

def gpu_hours_lost(ev, gpus, lost_steps, step_s):
    down = minutes_between(ev["start"], ev["mitigated"]) / 60
    return round(gpus * (down + lost_steps * step_s / 3600), 1)

ev = {"start": "2026-03-01 23:50", "detected": "2026-03-02 00:05", "mitigated": "2026-03-02 00:50", "resolved": "2026-03-02 02:00"}
print(incident_metrics(ev), gpu_hours_lost(ev, 600, 360, 10))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(15.0, 60.0, 130.0) 1200.0",
          "(15.0, 60.0, 130.0) 600.0",
          "(-1425.0, -1380.0, -1310.0) 1200.0",
          "(15.0, 45.0, 70.0) 1200.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def overdue(items, today):
    return [owner for owner, due, done in items if not done and due < today]   # ISO dates compare as strings

def by_cause(incidents):
    totals = {}
    for cause, hours in incidents:
        totals[cause] = totals.get(cause, 0) + hours
    return sorted(totals.items(), key=lambda kv: (-kv[1], kv[0]))

def pareto(incidents, frac):
    ranked = by_cause(incidents)
    total, run, out = sum(h for _, h in ranked), 0, []
    for cause, h in ranked:
        if run >= frac * total:
            break
        out.append(cause)                                  # fewest causes covering frac of the loss
        run += h
    return out

print(overdue([("ana", "2026-03-01", False), ("raj", "2026-02-01", True), ("li", "2026-04-01", False)], "2026-03-15"))
print(by_cause([("disk", 5), ("gpu", 9), ("disk", 6)]), pareto([("a", 50), ("b", 30), ("c", 20)], 0.75))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['ana']\n[('disk', 11), ('gpu', 9)] ['a', 'b']",
          "['ana', 'li']\n[('disk', 11), ('gpu', 9)] ['a', 'b']",
          "['ana']\n[('gpu', 9), ('disk', 6)] ['a', 'b']",
          "['ana']\n[('disk', 11), ('gpu', 9)] ['a']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>minutes_between(t1, t2)</C> for times written as &quot;YYYY-MM-DD HH:MM&quot;;{" "}
          <C>incident_metrics(ev)</C>, the minutes from ev[&quot;start&quot;] to &quot;detected&quot;,
          &quot;mitigated&quot; and &quot;resolved&quot;; and <C>gpu_hours_lost(ev, gpus, lost_steps, step_s)</C>,
          rounded to one decimal.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from datetime import datetime

def minutes_between(t1, t2):
    return 0.0

def incident_metrics(ev):
    return 0.0, 0.0, 0.0

def gpu_hours_lost(ev, gpus, lost_steps, step_s):
    return 0.0
`,
        solution: TIMELINE,
        tests: [
          { name: "metrics", code: `assert incident_metrics({"start": "2026-01-01 10:00", "detected": "2026-01-01 10:07", "mitigated": "2026-01-01 11:30", "resolved": "2026-01-02 09:00"}) == (7.0, 90.0, 1380.0)` },
          { name: "hours", code: `assert gpu_hours_lost({"start": "2026-01-01 10:00", "mitigated": "2026-01-01 10:30"}, 100, 180, 20) == 150.0 and gpu_hours_lost({"start": "2026-01-01 10:00", "mitigated": "2026-01-01 10:00"}, 8, 0, 1) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>overdue(items, today)</C>, the owners of unfinished items due before today; <C>by_cause(incidents)</C>,
          total hours per cause sorted by hours descending and then by name; and <C>pareto(incidents, frac)</C>, the
          fewest top causes whose total reaches frac of all hours.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def overdue(items, today):
    return []

def by_cause(incidents):
    return incidents

def pareto(incidents, frac):
    return []
`,
        solution: FOLLOWUP,
        tests: [
          { name: "overdue", code: `assert overdue([("a", "2026-05-02", False), ("b", "2026-05-01", False), ("c", "2026-04-30", True)], "2026-05-02") == ["b"]` },
          { name: "causes", code: `assert by_cause([("x", 1), ("y", 1), ("x", 2)]) == [("x", 3), ("y", 1)] and by_cause([("b", 2), ("a", 2)]) == [("a", 2), ("b", 2)] and pareto([("p", 10), ("q", 70), ("r", 20)], 0.75) == ["q", "r"] and pareto([], 0.5) == []` },
        ],
      },
    },
    {
      key: "action",
      rung: "stretch",
      prompt: (
        <p>
          An action item cuts the time to detect loss spikes from 17 minutes to 5. Such spikes occur twice a week on a
          4096-GPU run, and nothing else about them changes. How many GPU-hours does the change save over a 13-week
          quarter?
        </p>
      ),
      answer: { kind: "numeric", value: 21299.2, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Your own postmortems are a small sample. The last lesson reads the ones that other teams have published, and
        asks what their logs can teach a run that has not started yet.
      </p>
    </>
  ),
};
