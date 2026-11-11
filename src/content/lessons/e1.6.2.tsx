import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { M, MD } from "@/components/Math";
import { HonestViz } from "@/components/viz/HonestViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "e1.6.2",
  minutes: 45,
  links: {
    requires: ["e1.6.1"],
    revisits: ["m0.8.2"],
    foreshadows: ["l10.2.1", "e1.6.3"],
  },

  puzzle: (
    <>
      <p>
        A slide shows two bars: the baseline at 91.2% accuracy and a new method at 92.0%. The new bar is more than twice as
        tall as the old one. Nothing on the slide is false: every number is correct and every bar is drawn exactly where its
        axis says.
      </p>
      <p>So how can the slide still mislead, and what would you change so it cannot?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        A reader takes in a chart through its marks: lengths, positions, areas and colours. An honest chart makes the visual
        size of a difference match the size of the difference in the data, and shows how much the data would vary if the
        experiment were repeated. Toggle the axis and the error bars below and compare what each version invites you to
        believe.
      </p>
      <HonestViz />
    </>
  ),

  theory: (
    <>
      <Definition title="encodings">
        <p>
          Each chart type encodes values with a visual channel. People judge <strong>position</strong> on a common axis most
          accurately, then length, then angle and area, and colour least accurately. Bars encode values by length from a
          baseline, so a bar chart&rsquo;s axis must start at zero. Points and lines encode by position, so their axis may
          start wherever the data are, as long as it is labelled.
        </p>
      </Definition>

      <Definition title="lie factor">
        <p>Edward Tufte&rsquo;s lie factor compares the size of an effect in the graphic with its size in the data:</p>
        <MD>{"\\text{lie factor} = \\frac{\\text{relative change shown in the graphic}}{\\text{relative change in the data}}."}</MD>
        <p>An honest chart has a lie factor near 1.</p>
      </Definition>

      <Example title="showing variation">
        <Code>{`means = runs.groupby("method")["acc"].mean()
sds   = runs.groupby("method")["acc"].std()
ax.errorbar(range(len(means)), means, yerr=2 * sds, fmt="o", capsize=4)
ax.set_xticks(range(len(means)), means.index)
ax.set_ylabel("accuracy (%), mean ± 2 sd over 5 seeds")`}</Code>
        <p>
          A point with error bars, on an axis that need not start at zero, shows both the difference and the noise. Always say
          in the label what the bars mean: standard deviation, standard error and confidence intervals differ greatly.
        </p>
      </Example>

      <Remark title="colour">
        <p>
          Use a <strong>sequential</strong> colour map, from light to dark in one hue, for quantities that run from low to
          high, and a <strong>diverging</strong> map, with a neutral middle, for quantities with a meaningful centre such as
          correlations from <M>{"-1"}</M> to <M>{"1"}</M>. Rainbow maps such as <C>jet</C> create false boundaries where the
          hue changes quickly, and they fail for colour-blind readers.
        </p>
      </Remark>

      <Remark title="a checklist">
        <p>
          Does every axis have a label and units? Do bars start at zero? Is variation shown, and is it said what it is? Are
          the axes of compared panels the same? Would the chart&rsquo;s message survive a reader who checks the numbers?
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "zero",
      rung: "check",
      prompt: <p>Why must a bar chart&rsquo;s value axis start at zero?</p>,
      answer: {
        kind: "choice",
        options: ["Bars encode values by length from the baseline", "Charting libraries require it", "Zero is always in the data"],
        correct: [0],
      },
    },
    {
      key: "cmap",
      rung: "check",
      prompt: <p>Which colour map suits a heatmap of correlations from −1 to 1?</p>,
      answer: { kind: "choice", options: ["Diverging, with a neutral middle", "Sequential, light to dark", "Rainbow"], correct: [0] },
    },
    {
      key: "taller",
      rung: "apply",
      prompt: (
        <p>
          Bars of 91.2 and 92.0 are drawn on an axis starting at 90.5. How many times taller does the 92.0 bar look than the
          91.2 bar? Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 2.14, tolerance: 0.003 },
    },
    {
      key: "lie",
      rung: "apply",
      prompt: (
        <p>
          For the same chart, compute the lie factor: the relative increase in bar height divided by the relative increase in
          accuracy. Round to the nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 130, tolerance: 0.01 },
    },
    {
      key: "fix",
      rung: "apply",
      prompt: <p>Which of these make the two-model comparison more honest? Select all that apply.</p>,
      answer: {
        kind: "choice",
        options: [
          "Start the bar axis at zero",
          "Plot points with error bars over several seeds",
          "Say in the axis label what the error bars show",
          "Use a 3D bar chart",
          "Remove the axis so the difference stands out",
        ],
        correct: [0, 1, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`a, b = 102, 104
print(round((b - a) / a * 100, 1), round((b - 100) / (a - 100), 1))`}</Code>
          <p>Two bars of 102 and 104. Their real difference in per cent, and how many times taller b looks when the axis starts at 100. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["2.0 2.0", "2.0 1.0", "1.9 2.0", "2.0 4.0"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
v = np.array([10, 20, 40])
area_ratio = v[-1] / v[0]
radius_ratio = np.sqrt(v[-1] / v[0])
print(area_ratio, radius_ratio, radius_ratio ** 2 / area_ratio)`}</Code>
          <p>Circles sized honestly by area: a value four times larger needs twice the radius. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.0 2.0 1.0", "4.0 4.0 4.0", "4.0 2.0 0.5", "30.0 5.48 1.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>lie_factor(a, b, baseline)</C>, Tufte&rsquo;s ratio of the size of an effect shown in a bar chart to the size of the effect in the data, for two positive values a &lt; b when the axis starts at <C>baseline</C> instead of 0. An honest chart has lie factor 1.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def lie_factor(a, b, baseline):
    return 1.0
`,
        solution: `def lie_factor(a, b, baseline):
    shown = (b - baseline) / (a - baseline) - 1
    real = b / a - 1
    return shown / real
`,
        tests: [
          { name: "honest", code: `assert abs(lie_factor(50, 75, 0) - 1) < 1e-9, 'Starting at zero is honest.'` },
          { name: "truncated", code: `assert abs(lie_factor(102, 104, 100) - 51) < 1e-9, 'A 2% change drawn as a doubling exaggerates 51 times.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Honest axes start from round numbers. Write <C>nice_number(x, round_it)</C> (Heckbert&rsquo;s rule): with e = floor(log₁₀ x) and f = x/10ᵉ, choose n = 1, 2, 5 or 10, rounding (f &lt; 1.5 → 1, &lt; 3 → 2, &lt; 7 → 5, else 10) when round_it is true and taking the ceiling (f ≤ 1 → 1, ≤ 2 → 2, ≤ 5 → 5, else 10) otherwise, and return n·10ᵉ. Then write <C>nice_ticks(lo, hi, n)</C>: the range is nice_number(hi − lo, False), the step nice_number(range/(n − 1), True), and the ticks run from floor(lo/step)·step to ceil(hi/step)·step in steps, each rounded to 10 decimals.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def nice_number(x, round_it):
    return x

def nice_ticks(lo, hi, n):
    step = (hi - lo) / (n - 1)
    return [lo + i * step for i in range(n)]
`,
        solution: `import math

def nice_number(x, round_it):
    e = math.floor(math.log10(x))
    f = x / 10 ** e
    if round_it:
        n = 1 if f < 1.5 else 2 if f < 3 else 5 if f < 7 else 10
    else:
        n = 1 if f <= 1 else 2 if f <= 2 else 5 if f <= 5 else 10
    return n * 10 ** e

def nice_ticks(lo, hi, n):
    rng = nice_number(hi - lo, False)
    step = nice_number(rng / (n - 1), True)
    a = math.floor(lo / step) * step
    b = math.ceil(hi / step) * step
    count = int(round((b - a) / step))
    return [round(a + i * step, 10) for i in range(count + 1)]
`,
        tests: [
          { name: "nice", code: `assert [nice_number(x, True) for x in (1.2, 2.9, 4, 8, 0.034, 1700)] == [1, 2, 5, 10, 0.05, 2000] and [nice_number(x, False) for x in (1, 1.2, 4.9, 6, 97)] == [1, 2, 5, 10, 100]` },
          { name: "ticks", code: `assert nice_ticks(0, 97, 5) == [0, 20, 40, 60, 80, 100] and nice_ticks(-3.2, 7.9, 6) == [-5, 0, 5, 10] and nice_ticks(0.012, 0.087, 4) == [0.0, 0.05, 0.1]` },
          { name: "cover", code: `import random
random.seed(6)
for _ in range(300):
    lo = random.uniform(-1000, 1000); hi = lo + 10 ** random.uniform(-2, 4)
    t = nice_ticks(lo, hi, 5)
    step = t[1] - t[0]
    assert t[0] <= lo + 1e-9 and t[-1] >= hi - 1e-9 and 3 <= len(t) <= 12, 'Ticks cover the data with a sensible count.'
    assert nice_number(abs(step), True) == round(abs(step), 10) or abs(nice_number(step, True) - step) < 1e-9 * step, 'Steps are 1, 2 or 5 times a power of ten.'` },
        ],
      },
    },
    {
      key: "lines",
      rung: "prove",
      prompt: (
        <p>
          Explain why a line chart of training loss may use an axis that does not start at zero, while a bar chart of two
          accuracies may not. Then explain why showing the spread over several seeds can change the conclusion drawn from two
          bars.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Explains that lines and points encode values by position, which can be read against any labelled axis.",
          "Explains that bars encode by length from the baseline, so a truncated axis distorts the ratio of the values.",
          "Explains that a single run per method hides seed-to-seed variation.",
          "Notes that if the spread is comparable to the difference, the difference may be noise, so the claim needs more runs or a test.",
        ],
      },
    },
    {
      key: "se",
      rung: "stretch",
      prompt: (
        <p>
          Each model is run with 5 seeds. The baseline&rsquo;s accuracy has standard deviation 0.5 and the new method&rsquo;s
          0.6. What is the standard error of the difference between the two mean accuracies, <M>{"\\sqrt{s_1^2/n + s_2^2/n}"}</M>?
          Give two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 0.35, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend how a chart can mislead with correct numbers, using a truncated bar axis and a missing error bar as examples.",

  glimpse: (
    <p>
      Next, interactive charts: views you can filter and link, so that a selection in one picture lights up the same data in
      another. Later, in evaluation, error bars become a subject of their own.
    </p>
  ),
};
