import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BrushViz } from "@/components/viz/BrushViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.6.3",
  minutes: 40,
  links: {
    requires: ["e1.6.2"],
    revisits: ["l1.7.4"],
    foreshadows: ["e4.3.3", "e6.6.3"],
  },

  puzzle: (
    <>
      <p>
        A classifier is wrong on 8% of the validation set. You have two charts: a histogram of the model&rsquo;s confidence,
        and a scatter plot of input length against confidence. Neither chart, looked at alone, tells you which inputs the
        model gets wrong.
      </p>
      <p>What could you do with the two charts together that you cannot do with either one?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        Static charts answer one question each. Interactive charts let you ask the next question straight away: what are
        those examples? Move the sliders to select a range of confidence. The matching examples light up in the scatter, and
        the errors among them turn red. This is <strong>linked brushing</strong>.
      </p>
      <BrushViz />
    </>
  ),

  theory: (
    <>
      <Definition title="interaction techniques">
        <p>
          The common ones are <strong>tooltips</strong> (show a point&rsquo;s details on hover),{" "}
          <strong>zoom and pan</strong>, <strong>filtering</strong>, and <strong>brushing and linking</strong>: selecting
          marks in one view highlights the same records in every other view. Each needs the inverse of a scale, to turn a
          mouse position back into data values, and a shared key, so that views agree about which record is which.
        </p>
      </Definition>

      <Example title="a linked selection in a notebook">
        <Code>{`import altair as alt

brush = alt.selection_interval(encodings=["x"])
hist = alt.Chart(df).mark_bar().encode(
    alt.X("conf", bin=alt.Bin(maxbins=20)), y="count()"
).add_params(brush)
scatter = alt.Chart(df).mark_point().encode(
    x="conf", y="length",
    color=alt.condition(brush, "wrong:N", alt.value("lightgray")),
)
hist & scatter`}</Code>
        <p>
          The selection is declared once and used by both charts. Libraries such as Altair, Plotly and Bokeh build web pages
          like this from Python. Tools for watching training runs are dashboards of linked, zoomable charts.
        </p>
      </Example>

      <Remark title="too many points">
        <p>
          A scatter of a million points becomes a solid blob, and a browser struggles to draw a million separate marks. Use
          transparency, draw a random sample, or bin the points into a two-dimensional histogram and colour each bin by its
          count. Binning also caps the number of marks at the number of bins.
        </p>
      </Remark>

      <Remark title="exploring is not confirming">
        <p>
          Interaction makes it easy to try hundreds of slices of the data until one looks interesting. A pattern found that
          way is a hypothesis, not a result. Confirm it on data you did not explore, for example a held-out split, and write
          down what you looked at. Keep the filters in code too, with <C>df[df.conf.between(0.9, 1.0)]</C>, so that the
          finding can be reproduced.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "brush",
      rung: "check",
      prompt: <p>What does linked brushing do?</p>,
      answer: {
        kind: "choice",
        options: [
          "Selecting records in one view highlights the same records in other views",
          "It smooths noisy curves",
          "It colours points by density",
        ],
        correct: [0],
      },
    },
    {
      key: "overplot",
      rung: "check",
      prompt: <p>A scatter plot has a million points and is a solid blob. Which of these help? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: ["Make the points partly transparent", "Plot a random sample", "Bin into a 2D histogram", "Make the markers larger"],
        correct: [0, 1, 2],
      },
    },
    {
      key: "bin",
      rung: "apply",
      prompt: (
        <p>
          A histogram splits confidence from 0 to 1 into 20 equal bins, numbered from 0. Which bin holds a confidence of 0.93?
        </p>
      ),
      answer: { kind: "numeric", value: 18 },
    },
    {
      key: "rate",
      rung: "apply",
      prompt: (
        <p>
          You brush the confidence range 0.9 to 1.0 and 120 examples light up, 6 of them errors. What is the error rate of the
          selection, in percent?
        </p>
      ),
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "marks",
      rung: "apply",
      prompt: (
        <p>
          You bin a million points into a two-dimensional histogram of 100 by 100 cells. At most how many rectangles must be
          drawn?
        </p>
      ),
      answer: { kind: "numeric", value: 10000 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`events = []
def on_change(value):
    events.append(value * 2)
for v in [1, 2, 3]:
    on_change(v)
print(events)`}</Code>
          <p>An interactive chart calls a handler each time a slider moves. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[2, 4, 6]", "[1, 2, 3]", "[6]", "[]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`class Model:
    def __init__(self):
        self.subs = []
        self.v = 0
    def set(self, v):
        old, self.v = self.v, v
        for f in self.subs:
            f(old, v)
m = Model()
seen = []
m.subs.append(lambda a, b: seen.append(b - a))
m.set(5); m.set(3); m.set(3)
print(seen, m.v)`}</Code>
          <p>An observer notified on every set, even when nothing changes. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[5, -2, 0] 3", "[5, -2] 3", "[5, 3, 3] 3", "[0, 5, -2] 3"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write a class <C>Slider</C> with <C>__init__(self, value)</C>, a method <C>on_change(self, f)</C> that registers a callback, and a method <C>set(self, v)</C> that stores the new value and calls every callback with it, but only when the value actually changed.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `class Slider:
    def __init__(self, value):
        self.value = value
    def on_change(self, f):
        pass
    def set(self, v):
        self.value = v
`,
        solution: `class Slider:
    def __init__(self, value):
        self.value = value
        self.callbacks = []
    def on_change(self, f):
        self.callbacks.append(f)
    def set(self, v):
        if v == self.value:
            return
        self.value = v
        for f in self.callbacks:
            f(v)
`,
        tests: [
          { name: "callbacks", code: `seen = []
s = Slider(0)
s.on_change(seen.append)
s.on_change(lambda v: seen.append(-v))
s.set(3)
assert seen == [3, -3] and s.value == 3, 'Call every registered callback with the new value.'` },
          { name: "no change", code: `seen = []
s = Slider(5)
s.on_change(seen.append)
s.set(5)
assert seen == [], 'Setting the same value should not redraw.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Interactive charts must not redraw on every mouse movement. Events are (time, value) pairs in time order. Write <C>debounce(events, wait)</C>, which emits an event only when no other event follows within <C>wait</C> (strictly less than wait later), at time t + wait, returning the list of (fire time, value); and <C>throttle(events, interval)</C>, which emits an event at its own time if at least <C>interval</C> has passed since the last emitted event (the first always emits), dropping the rest.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def debounce(events, wait):
    return list(events)

def throttle(events, interval):
    return list(events)
`,
        solution: `def debounce(events, wait):
    out = []
    for i, (t, v) in enumerate(events):
        if i + 1 == len(events) or events[i + 1][0] - t >= wait:
            out.append((t + wait, v))
    return out

def throttle(events, interval):
    out, last = [], None
    for t, v in events:
        if last is None or t - last >= interval:
            out.append((t, v))
            last = t
    return out
`,
        tests: [
          { name: "debounce", code: `ev = [(0, 'a'), (50, 'b'), (120, 'c'), (400, 'd'), (450, 'e')]
assert debounce(ev, 100) == [(220, 'c'), (550, 'e')] and debounce([], 10) == [] and debounce([(5, 'x')], 10) == [(15, 'x')], 'Only the last of a burst fires, after the quiet period.'` },
          { name: "edge", code: `assert debounce([(0, 'a'), (100, 'b')], 100) == [(100, 'a'), (200, 'b')], 'An event exactly wait later does not cancel.'` },
          { name: "throttle", code: `ev = [(0, 1), (30, 2), (100, 3), (130, 4), (199, 5), (230, 6)]
assert throttle(ev, 100) == [(0, 1), (100, 3), (230, 6)] and throttle(ev, 0) == ev, 'At most one event per interval.'` },
        ],
      },
    },
    {
      key: "forking",
      rung: "prove",
      prompt: (
        <p>
          You explore a validation set interactively, trying many slices, and find one slice where the new model is 5 points
          better. Explain why this finding is weaker than it looks, and describe a procedure that would make it trustworthy.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that trying many slices makes it likely that some slice looks good by chance alone.",
          "Notes that the slice was chosen using the same data that measured the gain, so the estimate is biased upwards.",
          "Proposes fixing the slice definition in code and measuring it on held-out data not used during exploration.",
          "Mentions recording what was tried, or correcting for the number of comparisons.",
        ],
      },
    },
    {
      key: "calib",
      rung: "stretch",
      prompt: (
        <p>
          You brush the confidence range 0.8 to 0.9. The 200 selected examples have mean confidence 0.85, and 50 of them are
          errors. By how much does the mean confidence exceed the accuracy of the selection?
        </p>
      ),
      answer: { kind: "numeric", value: 0.1, tolerance: 0.001 },
    },
  ],

  teachBack:
    "Explain to a friend what linked brushing is, what it can reveal that a single chart cannot, and why a pattern found by exploring still needs confirming.",

  glimpse: (
    <p>
      Next, data handling. Charts need tables, and the dataframe is the table you will use most: named, typed columns with
      fast operations for filtering, grouping and joining.
    </p>
  ),
};
