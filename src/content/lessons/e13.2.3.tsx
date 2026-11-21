import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AlertTuningViz } from "@/components/viz/AlertTuningViz";
import type { LessonContent } from "@/lib/types";

const DETECT = `import math

def rolling_z(xs, w):
    out = []
    for i, x in enumerate(xs):
        if i < w:
            out.append(None)                               # not enough history yet
            continue
        win = xs[i - w:i]
        m = sum(win) / w
        sd = (sum((v - m) ** 2 for v in win) / w) ** 0.5
        if sd == 0:
            out.append(0.0 if x == m else math.copysign(math.inf, x - m))
        else:
            out.append((x - m) / sd)
    return out

def fire_alerts(zs, thr, k):
    fired, run = [], 0
    for i, z in enumerate(zs):
        run = run + 1 if z is not None and z > thr else 0
        if run == k:
            fired.append(i)                                # fire once per run of k exceedances
    return fired

def precision_recall(fired, events, tol):
    hit = lambda a, e: e <= a <= e + tol
    tp = sum(1 for a in fired if any(hit(a, e) for e in events))
    found = sum(1 for e in events if any(hit(a, e) for a in fired))
    p = tp / len(fired) if fired else 1.0
    r = found / len(events) if events else 1.0
    return round(p, 4), round(r, 4)`;

const BUDGET = `def false_alarm_prob(p, k):
    return p ** k                                          # k independent exceedances in a row

def pages_per_day(steps_per_day, p, k):
    return steps_per_day * false_alarm_prob(p, k)

def min_debounce(steps_per_day, p, budget):
    k = 1
    while pages_per_day(steps_per_day, p, k) > budget:
        k += 1                                             # each extra step multiplies the rate by p
    return k`;

export const lesson: LessonContent = {
  id: "e13.2.3",
  minutes: 40,
  links: {
    requires: ["e13.2.2"],
    revisits: ["e13.2.1"],
    foreshadows: ["e13.3.1"],
  },

  puzzle: (
    <>
      <p>
        A team sets an alert on gradient norm at three standard deviations above its recent mean. In the first week the
        on-call engineer is paged nine times a night, every page is noise, and by the second week the pages are muted.
        Then a real divergence begins at 3 a.m. and nobody looks until morning. What should the rule have been?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An alert is a classifier run on every logged step, and a run logs tens of thousands of steps a day, so even a
        tiny per-step false-positive rate produces many pages. Two levers reduce them: a higher threshold, and a
        debounce that fires only after several consecutive exceedances. Both also delay or miss real incidents. A good
        rule is judged like any classifier, by precision and recall against past incidents, and by how many pages per
        week a person will actually read.
      </p>
      <AlertTuningViz />
    </>
  ),

  theory: (
    <>
      <Definition title="anomaly alerts">
        <p>
          A fixed threshold suits signals with a known safe range, such as a NaN count or a stalled step counter. For
          signals that drift, such as loss and gradient norm, compare each value with its own recent history: the
          rolling z-score is the value minus the mean of the previous w values, divided by their standard deviation{" "}
          (<C>rolling_z</C>). An alert fires when k consecutive scores exceed a threshold, once per such run{" "}
          (<C>fire_alerts</C>). Judged against known incident start times, with a tolerance for detection delay, its
          precision is the fraction of alerts during incidents and its recall the fraction of incidents alerted on{" "}
          (<C>precision_recall</C>).
        </p>
        <Code>{DETECT}</Code>
      </Definition>

      <Theorem title="debounce and false alarms">
        <p>
          If noise alone exceeds the threshold independently with probability p per step, then a debounce of k fires
          on noise at a given step with probability at most <M>{"p^k"}</M>, so a run logging S steps a day receives at
          most <M>{"S p^k"}</M> false pages a day. A real incident is never reported in fewer than k steps.
        </p>
      </Theorem>
      <Proof>
        <p>
          A fire at step i requires steps <M>{"i-k+1, \\dots, i"}</M> all to exceed the threshold, an event of
          probability <M>{"p^k"}</M> under independence. Summing over the S steps of a day gives the expected count, by
          linearity of expectation. The second claim holds because the counter needs k exceedances before it reaches
          k. In practice rolling scores of neighbouring steps are correlated, since they share most of their window, so
          the bound is optimistic and the rate should be measured on past runs (<C>min_debounce</C> gives the
          independent estimate as a starting point).
        </p>
        <Code>{BUDGET}</Code>
      </Proof>

      <Example title="tiers of alerts">
        <p>
          Production runs separate alerts by urgency. Pages, which wake someone, are reserved for events that waste
          compute within the hour: the step counter stalls, throughput falls by half, the loss is NaN, or a rank stops
          sending heartbeats. Tickets, read the next working day, cover slow trends: a rising maximum attention logit, an
          update-to-weight ratio drifting up, a held-out loss flattening early. Everything else is a dashboard panel.
          Each page should name the metric, the rule that fired, a link to the panel, and the first action to take.
        </p>
      </Example>

      <Remark title="tuning against history">
        <p>
          Replay a candidate rule on the logs of past runs, where incident times are known from postmortems, and count
          its alerts. A rule that would have fired on none of the past incidents is useless however quiet it is, and one
          that would have paged fifty times a week will be muted. The time a real incident takes to fire is itself a
          random variable: each step of the incident exceeds the threshold only with some probability, and the alert
          waits for the first run of k exceedances, whose expected waiting time satisfies a short recursion on the
          length of the current run.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "pages",
      rung: "check",
      prompt: (
        <p>
          Noise alone pushes a metric over its threshold with probability 0.001 per step, independently. The run logs
          30,000 steps a day, and the alert needs 2 consecutive exceedances. About how many false pages arrive in 30
          days?
        </p>
      ),
      answer: { kind: "numeric", value: 0.9, tolerance: 0.02 },
    },
    {
      key: "f1",
      rung: "check",
      prompt: (
        <p>
          Over a month an alerting rule fired 12 times, 9 of them during real incidents. There were 10 incidents, 8 of
          which drew at least one alert. What is its F1 score, the harmonic mean of precision and recall, to four
          decimals?
        </p>
      ),
      answer: { kind: "numeric", value: 0.7742, tolerance: 0.001 },
    },
    {
      key: "rolling",
      rung: "apply",
      prompt: <p>Why alert on a rolling z-score of the loss rather than on a fixed loss value?</p>,
      answer: {
        kind: "choice",
        options: [
          "The loss falls throughout training, so a fixed value that catches a late spike would fire constantly early on",
          "A fixed threshold cannot be computed on a GPU",
          "Rolling z-scores never produce false alarms",
          "The loss is always normally distributed",
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

def rolling_z(xs, w):
    out = []
    for i, x in enumerate(xs):
        if i < w:
            out.append(None)                               # not enough history yet
            continue
        win = xs[i - w:i]
        m = sum(win) / w
        sd = (sum((v - m) ** 2 for v in win) / w) ** 0.5
        if sd == 0:
            out.append(0.0 if x == m else math.copysign(math.inf, x - m))
        else:
            out.append((x - m) / sd)
    return out

def fire_alerts(zs, thr, k):
    fired, run = [], 0
    for i, z in enumerate(zs):
        run = run + 1 if z is not None and z > thr else 0
        if run == k:
            fired.append(i)                                # fire once per run of k exceedances
    return fired

def precision_recall(fired, events, tol):
    hit = lambda a, e: e <= a <= e + tol
    tp = sum(1 for a in fired if any(hit(a, e) for e in events))
    found = sum(1 for e in events if any(hit(a, e) for a in fired))
    p = tp / len(fired) if fired else 1.0
    r = found / len(events) if events else 1.0
    return round(p, 4), round(r, 4)

zs = rolling_z([1, 3, 1, 3, 9, 3], 4)
print(zs[:4], zs[4], fire_alerts([None, 2.5, 3.5, 3.2, 1.0, 4.0], 3, 2), precision_recall([5, 12, 30], [4, 28, 50, 60], 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[None, None, None, None] 7.0 [3] (0.6667, 0.5)",
          "[None, None, None, None] 7.0 [2, 3, 5] (0.6667, 0.5)",
          "[None, None, None, None] 3.5 [3] (0.6667, 0.5)",
          "[None, None, None, None] 7.0 [3] (0.6667, 0.75)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def false_alarm_prob(p, k):
    return p ** k                                          # k independent exceedances in a row

def pages_per_day(steps_per_day, p, k):
    return steps_per_day * false_alarm_prob(p, k)

def min_debounce(steps_per_day, p, budget):
    k = 1
    while pages_per_day(steps_per_day, p, k) > budget:
        k += 1                                             # each extra step multiplies the rate by p
    return k

print(false_alarm_prob(0.5, 3), pages_per_day(1000, 0.5, 2))
print(min_debounce(10000, 0.01, 0.5), min_debounce(10, 0.5, 20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.125 250.0\n3 1", "0.125 250.0\n2 1", "1.5 250.0\n3 1", "0.125 500.0\n3 2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rolling_z(xs, w)</C>, None for the first w values and otherwise the z-score against the previous w
          values (population standard deviation; 0.0 or a signed infinity when it is zero);{" "}
          <C>fire_alerts(zs, thr, k)</C>, the indices where a run of scores above thr reaches length k; and{" "}
          <C>precision_recall(fired, events, tol)</C>, where an alert at a matches an event at e when{" "}
          <M>{"e \\le a \\le e + \\text{tol}"}</M>, each rounded to four decimals and 1.0 when its denominator is zero.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rolling_z(xs, w):
    return [0.0 for x in xs]

def fire_alerts(zs, thr, k):
    return []

def precision_recall(fired, events, tol):
    return 1.0, 1.0
`,
        solution: DETECT,
        tests: [
          { name: "z", code: `assert rolling_z([1, 3, 1, 3, 2], 2) == [None, None, -1.0, 1.0, 0.0] and rolling_z([4, 4, 9], 2)[2] == float('inf')` },
          { name: "fire", code: `assert fire_alerts([4, 4, 1, 4, 4, 4, 4], 3, 2) == [1, 4] and fire_alerts([None, 5], 3, 1) == [1]` },
          { name: "pr", code: `assert precision_recall([10, 20], [9, 40], 2) == (0.5, 0.5) and precision_recall([], [3], 1) == (1.0, 0.0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>false_alarm_prob(p, k)</C>, <C>pages_per_day(steps_per_day, p, k)</C> under independence, and{" "}
          <C>min_debounce(steps_per_day, p, budget)</C>, the smallest k of at least 1 whose daily false pages are at most
          the budget.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def false_alarm_prob(p, k):
    return p

def pages_per_day(steps_per_day, p, k):
    return steps_per_day * p

def min_debounce(steps_per_day, p, budget):
    return 1
`,
        solution: BUDGET,
        tests: [
          { name: "prob", code: `assert false_alarm_prob(0.5, 2) == 0.25 and pages_per_day(100, 0.5, 2) == 25.0` },
          { name: "debounce", code: `assert min_debounce(1000, 0.5, 100) == 4 and min_debounce(8, 0.5, 8) == 1` },
        ],
      },
    },
    {
      key: "delay",
      rung: "stretch",
      prompt: (
        <p>
          During a real fault each step exceeds the threshold independently with probability 0.9. With a debounce of 3,
          what is the expected number of steps from the start of the fault until the alert fires, counting the step on
          which it fires?
        </p>
      ),
      answer: { kind: "numeric", value: 3.7174, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        An alert tells you something is wrong; it does not say why. The next chapter opens with the most common page in
        large runs, the loss spike, and how to work out its cause.
      </p>
    </>
  ),
};
