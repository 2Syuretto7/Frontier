import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { HistogramViz } from "@/components/viz/HistogramViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.8.2",
  minutes: 60,
  links: {
    foreshadows: ["m7.2.1", "m7.3.1", "m7.7.2"],
  },

  puzzle: (
    <>
      <p>
        Roll three ordinary dice and add the numbers. The total can be anything from 3 to 18. Before you roll, which totals
        do you expect to see most often, and which almost never?
      </p>
      <p>
        Now imagine rolling three hundred times and writing down every total. How would you show all three hundred numbers
        in one picture, so that someone could see the answer to the first question at a glance?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A total of 3 needs all three dice to show 1, which happens one way in <M>{"6^3 = 216"}</M>. A total of 10 can be
        made in 27 ways. So middle totals are common and extreme ones rare, and three hundred rolls should pile up in the
        middle.
      </p>
      <p>
        To see the pile, sort the totals into bins and draw one bar per bin, its height the number of rolls that landed
        there. That is a <strong>histogram</strong>. It shows what the mean and standard deviation cannot: the{" "}
        <em>shape</em> of the data. But the picture depends on a choice you make, the width of the bins. Try each width
        below.
      </p>
      <HistogramViz />
      <p>
        With width 1, you see a hump. With width 8, two bars, and the hump is gone. Neither is wrong; they answer different
        questions. Choosing the bin width is a judgement, and an honest chart says what was chosen.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="frequency and relative frequency">
        <p>
          Split the number line into intervals, called <strong>bins</strong>. The <strong>frequency</strong> of a bin is how
          many data values fall in it. Its <strong>relative frequency</strong> is the frequency divided by the total number
          of values <M>n</M>, the <em>proportion</em> of the data in that bin. Relative frequencies are between 0 and 1 and
          add up to 1.
        </p>
      </Definition>

      <Definition title="histogram">
        <p>
          A <strong>histogram</strong> draws each bin as a bar standing on that interval of the number line, with no gaps
          between neighbouring bins. In a <strong>density histogram</strong> the height of each bar is
        </p>
        <MD>{"\\text{height} = \\frac{\\text{relative frequency}}{\\text{bin width}},"}</MD>
        <p>so that the <em>area</em> of each bar is the proportion of the data in it, and all the areas add up to 1.</p>
      </Definition>

      <p>
        Why divide by the width? If bins have different widths, a wide bin collects more values simply because it is wide,
        and plain counts would exaggerate it. Measuring by area removes that unfairness. It also means you can read a
        proportion off a density histogram by adding up areas, an idea that becomes integration later on.
      </p>

      <Example title="unequal bins">
        <p>
          Of 200 commuters, 60 travel 0 to 10 km, 90 travel 10 to 20 km, and 50 travel 20 to 50 km. As counts, the last
          bar looks nearly as important as the first. As densities, the heights are{" "}
          <M>{"\\tfrac{60/200}{10} = 0.03"}</M>, <M>{"\\tfrac{90/200}{10} = 0.045"}</M> and{" "}
          <M>{"\\tfrac{50/200}{30} \\approx 0.0083"}</M> per km: the long-distance commuters are spread thinly over a wide
          range.
        </p>
      </Example>

      <Definition title="the shape of a distribution">
        <p>
          The pattern of values in a data set is its <strong>distribution</strong>. Words for its shape:
        </p>
        <ul>
          <li><strong>Symmetric:</strong> the histogram is roughly a mirror image about the middle. The mean and median are close.</li>
          <li><strong>Skewed right</strong> (or left): a long tail stretches out on the right (or left). The mean is pulled towards the tail, past the median.</li>
          <li><strong>Unimodal</strong> or <strong>bimodal:</strong> one peak, or two. Two peaks often mean two different groups have been mixed together.</li>
          <li><strong>Outliers:</strong> isolated values far from the rest, which deserve a second look before anything else.</li>
        </ul>
      </Definition>

      <Example title="incomes and heights">
        <p>
          Incomes are skewed right: most people earn moderate amounts and a few earn enormous ones, so the mean income is
          above the median, as in the office of the last lesson. Adult heights in one country are close to symmetric. Heights
          of men and women together are slightly bimodal, because two groups with different centres have been combined.
        </p>
      </Example>

      <Remark title="the bell that keeps appearing">
        <p>
          Add more dice and the hump of the totals becomes smoother and more regular, approaching one particular bell shape.
          That same bell appears for measurement errors, for heights, for the averages of almost anything. It is no
          coincidence: the central limit theorem, one of the great theorems of Probability, explains why sums of many small
          independent effects always tend towards it. You will meet it properly there.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "relative",
      rung: "check",
      prompt: <p>A bin contains 36 of 240 data values. What is its relative frequency?</p>,
      answer: { kind: "numeric", value: 0.15 },
    },
    {
      key: "density",
      rung: "check",
      prompt: <p>In a density histogram, a bin from 20 to 25 has height 0.04. What proportion of the data lies in that bin?</p>,
      answer: { kind: "numeric", value: 0.2 },
    },
    {
      key: "skew",
      rung: "apply",
      prompt: <p>A data set has mean 52 and median 41. Which shape is most likely?</p>,
      answer: { kind: "choice", options: ["symmetric", "skewed right", "skewed left"], correct: [1] },
    },
    {
      key: "ways",
      rung: "apply",
      prompt: <p>Rolling two dice, how many of the 36 equally likely outcomes give a total of 7?</p>,
      answer: { kind: "numeric", value: 6 },
    },
    {
      key: "bimodal",
      rung: "apply",
      prompt: (
        <p>
          A histogram of the times customers spend in a shop has two clear peaks, near 3 minutes and near 25 minutes. Select
          every reasonable explanation.
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Two kinds of customer: quick pick-ups and full shops.",
          "The bin width is too wide.",
          "The mean must equal the median.",
          "A single number such as the mean describes this data poorly.",
        ],
        correct: [0, 3],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np
xs = [1, 2, 2, 3, 3, 3, 7, 8, 9, 10]
counts, edges = np.histogram(xs, bins=3, range=(1, 10))
print(counts)`}</Code>
          <p>Ten values in three bins of equal width over [1, 10]. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[6 0 4]", "[3 3 4]", "[6 1 3]", "[4 2 4]"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>histogram(xs, lo, hi, k)</C>, which counts the values in k bins of equal width over [lo, hi]. Each bin includes its left edge, and the last bin includes hi too. Ignore values outside [lo, hi].
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def histogram(xs, lo, hi, k):
    return [len(xs)] + [0] * (k - 1)
`,
        solution: `def histogram(xs, lo, hi, k):
    counts = [0] * k
    w = (hi - lo) / k
    for x in xs:
        if lo <= x <= hi:
            i = min(int((x - lo) / w), k - 1)
            counts[i] += 1
    return counts
`,
        tests: [
          { name: "matches numpy", code: `import numpy as np
xs = [1, 2, 2, 3, 3, 3, 7, 8, 9, 10]
assert histogram(xs, 1, 10, 3) == list(np.histogram(xs, bins=3, range=(1, 10))[0]), 'The bins are [1, 4), [4, 7) and [7, 10].'` },
          { name: "edges", code: `assert histogram([0, 5, 10, 11], 0, 10, 2) == [1, 2], '5 goes in the second bin, 10 in the last, 11 is outside.'` },
        ],
      },
    },
    {
      key: "areas",
      rung: "prove",
      prompt: (
        <p>
          Explain why the areas of the bars of any density histogram add up to exactly 1, whatever the bin widths. Then
          explain why the heights of a density histogram can be greater than 1.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Each bar's area is height × width = relative frequency.",
          "The relative frequencies are the counts divided by n, and the counts add to n, so the areas add to 1.",
          "Notes that a narrow bin with a large proportion has height = proportion / width, which exceeds 1 when the width is less than the proportion.",
        ],
      },
    },
    {
      key: "two-dice",
      rung: "stretch",
      prompt: (
        <p>
          Take the totals of two dice over all 36 equally likely outcomes as a data set of 36 values. Find its mean, then
          give its standard deviation to two decimal places.
        </p>
      ),
      answer: { kind: "numeric", value: 2.42, tolerance: 0.005 },
    },
  ],

  teachBack:
    "Explain to a friend what a histogram shows that an average cannot, and why the choice of bin width can change what the histogram seems to say.",

  glimpse: (
    <p>
      Next, probability, where relative frequencies in the long run become the chance of an event. In Probability, a
      density histogram with ever more data and ever narrower bins becomes a smooth curve, the probability density, and
      areas under it are found by integration. The bell shape of the last remark is the normal distribution, and the
      central limit theorem explains why it is everywhere.
    </p>
  ),
};
