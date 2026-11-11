import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { M, MD } from "@/components/Math";
import { PlotBuildViz } from "@/components/viz/PlotBuildViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.6.1",
  minutes: 45,
  links: {
    requires: ["e1.5.2"],
    revisits: ["m0.4.3", "m0.8.2"],
    foreshadows: ["e1.6.2", "l3.8.2"],
  },

  puzzle: (
    <>
      <p>
        A training run logs its loss every 10 steps for 1,000 steps. The loss falls from about 4.4 to about 0.4. You have a
        drawing area 440 pixels wide and 240 pixels tall, and the only operation available is &ldquo;draw a line from pixel
        (x₁, y₁) to pixel (x₂, y₂)&rdquo;.
      </p>
      <p>
        Plotting libraries do this for you, but what exactly do they compute? And why does almost every published loss curve
        use a log scale?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A chart is a function from data to pixels, plus enough marks for a reader to run that function backwards. Step through
        the stages below. First the raw numbers are used as pixels, which fails. Then scales map the data onto the frame, and
        axes, ticks and labels let a reader recover the numbers. Finally a log scale reveals the slow late progress.
      </p>
      <PlotBuildViz />
    </>
  ),

  theory: (
    <>
      <Definition title="scale">
        <p>
          A <strong>linear scale</strong> maps a data interval <M>{"[d_0, d_1]"}</M> onto a pixel interval <M>{"[p_0, p_1]"}</M>:
        </p>
        <MD>{"s(v) = p_0 + \\frac{v - d_0}{d_1 - d_0}\\,(p_1 - p_0)."}</MD>
        <p>
          Screen coordinates put y = 0 at the top and grow downwards, so for the vertical axis <M>{"p_0"}</M> is the bottom
          pixel and <M>{"p_1"}</M> the top one. A <strong>log scale</strong> applies the same formula to{" "}
          <M>{"\\log_{10} v"}</M>, so equal distances mean equal ratios.
        </p>
      </Definition>

      <Example title="a line chart with nothing but scales">
        <Code>{`def scale(d0, d1, p0, p1):
    return lambda v: p0 + (v - d0) / (d1 - d0) * (p1 - p0)

X = scale(0, 1000, 52, 428)      # steps to pixels, left to right
Y = scale(0, 4.5, 200, 24)       # loss to pixels, bottom to top
points = [(X(s), Y(l)) for s, l in zip(steps, losses)]
path = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in points)`}</Code>
        <p>
          The string <C>path</C> is an SVG path: move to the first point, then draw lines to the rest. This is all a line
          chart is. Libraries such as Matplotlib add tick selection, text layout and many conveniences on top.
        </p>
      </Example>

      <Definition title="ticks">
        <p>
          Ticks are placed at round values, usually multiples of 1, 2 or 5 times a power of ten, chosen so that about five
          ticks span the data. On a log scale ticks go at powers of ten, sometimes with 2 and 5 between them.
        </p>
      </Definition>

      <Example title="the same in Matplotlib">
        <Code>{`import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(6, 3.5))
ax.plot(steps, losses)
ax.set_yscale("log")
ax.set_xlabel("training step")
ax.set_ylabel("loss (log scale)")
ax.set_title("Training loss, run 7")
fig.savefig("loss.png", dpi=150, bbox_inches="tight")`}</Code>
      </Example>

      <Remark title="why loss curves use log scales">
        <p>
          Loss falls quickly at first and then slowly for a long time. On a linear axis the late part is a flat line near the
          bottom, though halving the remaining loss there may matter most. A log axis gives each halving the same height. Many
          curves in deep learning, such as loss against compute, become close to straight lines when both axes are logarithmic,
          which is how scaling laws are found.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ydir",
      rung: "check",
      prompt: <p>In SVG and most screen coordinate systems, which way does y grow?</p>,
      answer: { kind: "choice", options: ["Downwards", "Upwards", "It depends on the data"], correct: [0] },
    },
    {
      key: "logmean",
      rung: "check",
      prompt: <p>On a log scale, what do equal vertical distances represent?</p>,
      answer: { kind: "choice", options: ["Equal ratios", "Equal differences", "Equal numbers of data points"], correct: [0] },
    },
    {
      key: "xpix",
      rung: "apply",
      prompt: (
        <p>
          A linear scale maps steps from 0 to 1000 onto pixels 52 to 428. At what pixel x is step 250 drawn?
        </p>
      ),
      answer: { kind: "numeric", value: 146 },
    },
    {
      key: "ypix",
      rung: "apply",
      prompt: (
        <p>
          A vertical scale maps loss 0 to pixel 200 (the bottom) and loss 4.5 to pixel 24 (the top). At what pixel y is a loss
          of 3 drawn? Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 82.67, tolerance: 0.001 },
    },
    {
      key: "logpix",
      rung: "apply",
      prompt: (
        <p>
          A log scale maps losses from 0.1 to 10 onto a vertical span of 200 pixels. How many pixels above the bottom is a loss
          of 1 drawn?
        </p>
      ),
      answer: { kind: "numeric", value: 100 },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import matplotlib.pyplot as plt
fig, axes = plt.subplots(2, 3)
axes[1, 2].plot([0, 1], [0, 1])
print(axes.shape, len(axes[1, 2].lines), len(axes[0, 0].lines))`}</Code>
          <p>A grid of subplots, with one line drawn. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["(2, 3) 1 0", "(3, 2) 1 0", "(2, 3) 1 1", "(6,) 1 0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>plot_runs(runs)</C>, which takes a dict from run name to a list of losses, draws one labelled line per run against step number on a single axes, sets the y-axis to log scale, labels both axes, adds a legend, and returns the <C>Axes</C>.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `import matplotlib.pyplot as plt

def plot_runs(runs):
    fig, ax = plt.subplots()
    return ax
`,
        solution: `import matplotlib.pyplot as plt

def plot_runs(runs):
    fig, ax = plt.subplots()
    for name, losses in runs.items():
        ax.plot(range(len(losses)), losses, label=name)
    ax.set_yscale('log')
    ax.set_xlabel('step')
    ax.set_ylabel('loss')
    ax.legend()
    return ax
`,
        tests: [
          { name: "lines", code: `ax = plot_runs({'a': [3, 2, 1], 'b': [4, 2, 0.5]})
assert len(ax.lines) == 2 and sorted(l.get_label() for l in ax.lines) == ['a', 'b'], 'One labelled line per run.'` },
          { name: "axes", code: `ax = plot_runs({'a': [3, 2, 1]})
assert ax.get_yscale() == 'log' and ax.get_xlabel() and ax.get_ylabel() and ax.get_legend() is not None, 'Log scale, axis labels and a legend.'` },
        ],
      },
    },
    {
      key: "inverse",
      rung: "prove",
      prompt: (
        <p>
          Write the inverse of the linear scale <M>{"s(v) = p_0 + \\frac{v - d_0}{d_1 - d_0}(p_1 - p_0)"}</M>, giving the data
          value at pixel <M>{"p"}</M>, and show that it undoes <M>{"s"}</M>. Then explain what an interactive chart needs this
          inverse for, and why the inverse of a log scale is an exponential.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives v = d0 + (p − p0)/(p1 − p0) · (d1 − d0).",
          "Substitutes s(v) for p and simplifies to recover v.",
          "Notes interactive charts use the inverse to turn a mouse position into a data value, for tooltips, zooming or selection.",
          "Explains the log scale is the linear scale applied to log10 v, so inverting gives 10 to the power of the linear inverse.",
        ],
      },
    },
    {
      key: "decades",
      rung: "stretch",
      prompt: (
        <p>
          A log scale maps values from 0.1 to 1,000 onto a span of 300 pixels. How many pixels above the bottom is the value 10?
        </p>
      ),
      answer: { kind: "numeric", value: 150 },
    },
  ],

  teachBack:
    "Explain to a friend what a scale is, how a line chart is drawn from one, and why loss curves are usually plotted on a log scale.",

  glimpse: (
    <p>
      Next, the harder half of plotting: choosing scales and marks so that the chart tells the truth about the data, and does
      not make a small difference look large.
    </p>
  ),
};
