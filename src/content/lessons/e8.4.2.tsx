import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WatermarkViz } from "@/components/viz/WatermarkViz";
import type { LessonContent } from "@/lib/types";

const WINDOWS = `def tumbling(events, size):
    out = {}
    for t, v in events:
        w = (t // size) * size
        out[w] = out.get(w, 0) + v
    return dict(sorted(out.items()))

def sliding(events, size, step):
    out = {}
    for t, v in events:
        start = max(0, ((t - size) // step + 1) * step)
        for w in range(start, t + 1, step):
            out[w] = out.get(w, 0) + v
    return dict(sorted(out.items()))

def sessions(times, gap):
    out = []
    for t in sorted(times):
        if out and t - out[-1][1] <= gap:
            out[-1] = (out[-1][0], t)
        else:
            out.append((t, t))
    return out`;

const WATERMARKS = `def watermarks(event_times, max_delay):
    out, latest = [], None
    for t in event_times:
        latest = t if latest is None else max(latest, t)
        out.append(latest - max_delay)
    return out

def process(events, size, max_delay):
    open_w, emitted, dropped, wm = {}, [], 0, None
    for t, v in events:
        start = (t // size) * size
        if wm is not None and start + size <= wm:
            dropped += 1
            continue
        open_w[start] = open_w.get(start, 0) + v
        wm = t - max_delay if wm is None else max(wm, t - max_delay)
        for s in sorted(open_w):
            if s + size <= wm:
                emitted.append((s, open_w.pop(s)))
    for s in sorted(open_w):
        emitted.append((s, open_w.pop(s)))
    return emitted, dropped

def dedupe(records):
    seen, out = set(), []
    for rid, value in records:
        if rid not in seen:
            seen.add(rid)
            out.append((rid, value))
    return out`;

export const lesson: LessonContent = {
  id: "e8.4.2",
  minutes: 50,
  links: {
    requires: ["e8.4.1"],
    revisits: ["e8.3.1", "e3.5.3"],
    foreshadows: ["e8.5.3"],
  },

  puzzle: (
    <>
      <p>
        Thousands of GPUs report their throughput and loss every second, and a dashboard should show the average for each
        minute. The data never ends, so there is no moment to run a batch job over all of it. Worse, reports from a congested
        node arrive seconds late, after the minute they belong to has apparently finished. When should the dashboard publish
        a minute&apos;s average, and what should it do with a report that turns up afterwards?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Group the stream into windows by the time each event happened, not the time it arrived. A window can only be finalised
        once no more events for it are expected, but in a distributed system one can never be sure. So the processor keeps a{" "}
        <em>watermark</em>: an estimate that all events up to some time have arrived, here the latest event time seen minus an
        allowed delay. When the watermark passes the end of a window, the window is published. A larger allowance catches more
        stragglers but publishes everything later; the setting is a trade between completeness and latency.
      </p>
      <WatermarkViz />
    </>
  ),

  theory: (
    <>
      <Definition title="streams and time">
        <p>
          A stream is an unbounded sequence of events, each carrying an <em>event time</em>, when it happened, and arriving at
          a <em>processing time</em>, when the system sees it. Network delays, retries and buffering make the two differ and
          reorder events, so results that should depend only on the data must be computed by event time.
        </p>
      </Definition>

      <Definition title="windows">
        <p>
          A <em>tumbling</em> window of size s splits time into [0, s), [s, 2s), … (<C>tumbling</C>). A <em>sliding</em> window of
          size s and step d starts a window at every multiple of d, so windows overlap (<C>sliding</C>, for whole-number times).
          A <em>session</em> window groups events separated by gaps of at most g, so its length depends on the data
          (<C>sessions</C>).
        </p>
        <Code>{WINDOWS}</Code>
      </Definition>

      <Theorem title="how many windows hold an event">
        <p>
          If d divides s, an event at time t ≥ s − d lies in exactly s/d sliding windows of size s and step d, and in exactly one
          tumbling window.
        </p>
      </Theorem>
      <Proof>
        <p>
          The window starting at w holds t when <M>{"w \\le t < w + s"}</M>, that is <M>{"t - s < w \\le t"}</M>. This half-open
          interval of length s contains exactly s/d multiples of d, all non-negative when t − s &gt; −d. For tumbling windows d =
          s, giving one.
        </p>
      </Proof>

      <Definition title="watermarks">
        <p>
          (Akidau et al., 2015.) A watermark W is a processing-time estimate that no event with event time below W is still to
          come. A simple heuristic sets W to the largest event time seen minus an allowed delay (<C>watermarks</C>). A window
          [w, w + s) is emitted once <M>{"W \\ge w + s"}</M>; an event that arrives for an emitted window is <em>late</em>, and is
          dropped, sent to a side output, or used to emit a correction (<C>process</C>). Every window is eventually emitted, at
          the latest when the stream ends.
        </p>
      </Definition>

      <Definition title="exactly once">
        <p>
          Machines fail mid-stream (e8.3.1). Systems such as Flink periodically take a consistent snapshot of every operator&apos;s
          state, in the manner of Chandy and Lamport (1985), and after a failure restore it and replay the input from the
          snapshot&apos;s position. Events after the snapshot are then processed twice, so the effects become exactly-once only
          if the output is idempotent, for example by recording each event&apos;s identifier and ignoring repeats (<C>dedupe</C>).
        </p>
        <Code>{WATERMARKS}</Code>
      </Definition>

      <Remark title="streams around training">
        <p>
          A message log such as Kafka stores the stream durably and lets several consumers read it at their own pace; when a
          consumer falls behind, <em>backpressure</em> slows the producers rather than letting buffers grow without bound. Training
          infrastructure uses streams for metrics and alerts (e8.5.3), for logging every sample&apos;s loss, and for data
          pipelines that tokenise and shuffle text on the fly rather than in a batch job beforehand.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: <p>Sliding windows have size 60 s and step 15 s. In how many windows does an event at time 300 s lie?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "wm",
      rung: "check",
      prompt: <p>Events arrive with event times 10, 25, 18 and 40, and the allowed delay is 5. What is the watermark after the last of them?</p>,
      answer: { kind: "numeric", value: 35, tolerance: 0 },
    },
    {
      key: "trade",
      rung: "apply",
      prompt: <p>What does increasing the allowed delay of a watermark change?</p>,
      answer: {
        kind: "choice",
        options: [
          "Fewer events are late, but every window is emitted later",
          "Windows become larger",
          "Events are processed in event-time order",
          "The results become exactly-once",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tumbling(events, size):
    out = {}
    for t, v in events:
        w = (t // size) * size
        out[w] = out.get(w, 0) + v
    return dict(sorted(out.items()))

def sliding(events, size, step):
    out = {}
    for t, v in events:
        start = max(0, ((t - size) // step + 1) * step)
        for w in range(start, t + 1, step):
            out[w] = out.get(w, 0) + v
    return dict(sorted(out.items()))

def sessions(times, gap):
    out = []
    for t in sorted(times):
        if out and t - out[-1][1] <= gap:
            out[-1] = (out[-1][0], t)
        else:
            out.append((t, t))
    return out

ev = [(1, 2), (7, 1), (12, 5), (18, 1), (25, 3)]; print(tumbling(ev, 10), sliding(ev, 10, 5))
print(sessions([1, 2, 9, 3, 15, 10], 2), sessions([], 5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{0: 3, 10: 6, 20: 3} {0: 3, 5: 6, 10: 6, 15: 1, 20: 3, 25: 3}\n[(1, 3), (9, 10), (15, 15)] []",
          "{0: 3, 10: 6, 20: 3} {0: 3, 5: 6, 10: 6, 15: 1, 20: 3}\n[(1, 3), (9, 10), (15, 15)] []",
          "{0: 3, 10: 6, 20: 3} {0: 3, 5: 6, 10: 6, 15: 1, 20: 3, 25: 3}\n[(1, 2), (3, 3), (9, 10), (15, 15)] []",
          "{0: 2, 10: 6, 20: 4} {0: 3, 5: 6, 10: 6, 15: 1, 20: 3, 25: 3}\n[(1, 3), (9, 10), (15, 15)] []",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def watermarks(event_times, max_delay):
    out, latest = [], None
    for t in event_times:
        latest = t if latest is None else max(latest, t)
        out.append(latest - max_delay)
    return out

def process(events, size, max_delay):
    open_w, emitted, dropped, wm = {}, [], 0, None
    for t, v in events:
        start = (t // size) * size
        if wm is not None and start + size <= wm:
            dropped += 1
            continue
        open_w[start] = open_w.get(start, 0) + v
        wm = t - max_delay if wm is None else max(wm, t - max_delay)
        for s in sorted(open_w):
            if s + size <= wm:
                emitted.append((s, open_w.pop(s)))
    for s in sorted(open_w):
        emitted.append((s, open_w.pop(s)))
    return emitted, dropped

def dedupe(records):
    seen, out = set(), []
    for rid, value in records:
        if rid not in seen:
            seen.add(rid)
            out.append((rid, value))
    return out

print(watermarks([3, 8, 5, 12], 4), process([(1, 1), (12, 1), (4, 1), (25, 1), (15, 1)], 10, 5))
print(dedupe([('a', 1), ('b', 2), ('a', 1), ('c', 3), ('b', 9)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[-1, 4, 4, 8] ([(0, 2), (10, 1), (20, 1)], 1)\n[('a', 1), ('b', 2), ('c', 3)]",
          "[-1, 4, 1, 8] ([(0, 2), (10, 1), (20, 1)], 1)\n[('a', 1), ('b', 2), ('c', 3)]",
          "[-1, 4, 4, 8] ([(0, 2), (10, 2), (20, 1)], 0)\n[('a', 1), ('b', 2), ('c', 3)]",
          "[-1, 4, 4, 8] ([(0, 2), (10, 1), (20, 1)], 1)\n[('a', 1), ('b', 9), ('c', 3)]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For events <C>(time, value)</C> with whole-number times, write <C>tumbling(events, size)</C> and{" "}
          <C>sliding(events, size, step)</C>, returning the sum of values per window start in increasing order (sliding windows
          start at non-negative multiples of the step), and <C>sessions(times, gap)</C>, returning <C>(first, last)</C> for each
          session.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tumbling(events, size):
    return {}

def sliding(events, size, step):
    return {}

def sessions(times, gap):
    return []
`,
        solution: WINDOWS,
        tests: [
          { name: "windows", code: `assert tumbling([], 5) == {} and tumbling([(0, 1), (4, 2), (5, 3)], 5) == {0: 3, 5: 3} and list(tumbling([(9, 1), (2, 1)], 5)) == [0, 5]
assert sliding([(3, 1)], 4, 2) == {0: 1, 2: 1} and sliding([(9, 2)], 6, 3) == {6: 2, 9: 2}
assert sliding([(t, 1) for t in range(20)], 6, 2) == {w: 6 if w <= 14 else 20 - w for w in range(0, 20, 2)}` },
          { name: "sessions", code: `assert sessions([5], 1) == [(5, 5)] and sessions([1, 4, 7, 8], 3) == [(1, 8)] and sessions([], 2) == []
assert sessions([10, 1, 2, 30, 12], 2) == [(1, 2), (10, 12), (30, 30)]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>watermarks(event_times, max_delay)</C>, the watermark after each arrival; <C>process(events, size, max_delay)</C>{" "}
          as described above, returning the emitted <C>(start, sum)</C> pairs in order of emission and the number of late events
          dropped, and flushing open windows in order when the stream ends; and <C>dedupe(records)</C>, keeping the first record
          for each identifier.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def watermarks(event_times, max_delay):
    return list(event_times)

def process(events, size, max_delay):
    return [], 0

def dedupe(records):
    return list(records)
`,
        solution: WATERMARKS,
        tests: [
          { name: "watermark", code: `assert watermarks([], 2) == [] and watermarks([5, 1, 9], 0) == [5, 5, 9] and dedupe([]) == [] and dedupe([(1, 'x'), (1, 'y')]) == [(1, 'x')]` },
          { name: "process", code: `assert process([], 5, 1) == ([], 0) and process([(2, 1), (7, 1), (1, 1)], 5, 0) == ([(0, 1), (5, 1)], 1)
assert process([(2, 1), (7, 1), (1, 1)], 5, 3) == ([(0, 2), (5, 1)], 0)
assert process([(1, 1), (30, 1), (12, 1), (31, 2)], 10, 4) == ([(0, 1), (30, 3)], 1)` },
        ],
      },
    },
    {
      key: "delay",
      rung: "stretch",
      prompt: (
        <p>
          Events with value 1 arrive with event times 1, 4, 12, 3, 25, 14, 9, 31, 22, 18, in that order, and are processed with
          10-second tumbling windows. What is the smallest whole-number allowed delay for which <C>process</C> drops no event?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Batch jobs and streams alike read and write their data in a storage service built for enormous scale. The last lesson
        of the part looks at the object store, the place where most training data and checkpoints actually live.
      </p>
    </>
  ),
};
