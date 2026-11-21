import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ErrorBarViz } from "@/components/viz/ErrorBarViz";
import type { LessonContent } from "@/lib/types";

const BARS = `import math

def ci(mean, sd, n, z=1.96):
    half = z * sd / math.sqrt(n)                           # error bar of a mean: standard error, not sd
    return round(mean - half, 6), round(mean + half, 6)

def overlap(a, b):
    return a[0] <= b[1] and b[0] <= a[1]

def significant(m1, sd1, n1, m2, sd2, n2, z=1.96):
    se = math.sqrt(sd1**2 / n1 + sd2**2 / n2)
    return abs(m1 - m2) > z * se`;

const LOGLOG = `import math

def loglog_slope(xs, ys):
    lx = [math.log(x) for x in xs]; ly = [math.log(y) for y in ys]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((a - mx) * (b - my) for a, b in zip(lx, ly)) / sum((a - mx) ** 2 for a in lx)

def log_ticks(lo, hi):
    k, ticks = math.floor(math.log10(lo)), []
    while not ticks or ticks[-1] < hi:
        ticks.append(10.0 ** k)                            # one tick per decade covering the data
        k += 1
    return ticks

def predict(xs, ys, x):
    b = loglog_slope(xs, ys)
    la = sum(math.log(y) - b * math.log(v) for v, y in zip(xs, ys)) / len(xs)
    return math.exp(la) * x ** b                           # y = a x^b`;

export const lesson: LessonContent = {
  id: "l15.3.2",
  minutes: 40,
  links: {
    requires: ["l15.3.1", "l8.4.1"],
    revisits: ["l15.1.1"],
    foreshadows: ["l15.3.3"],
  },

  puzzle: (
    <>
      <p>
        A bar chart shows two methods with error bars that overlap, and the text says the new method is significantly
        better. A reviewer objects that overlapping error bars mean no significant difference. Another figure plots loss
        against compute and shows a gentle curve flattening out, which the authors call diminishing returns. Who is
        right about the first figure, and what would the second look like on different axes?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A figure is an argument a reader takes in at a glance, so every choice in it either supports the claim or
        misleads. Error bars must say what they are, since standard deviations, standard errors and confidence intervals
        differ by large factors and answer different questions. Axes should make the expected relationship a straight
        line, which for scaling results means logarithmic axes, where a power law is a line and its slope is the
        exponent. And each figure should answer one question, stated in its caption.
      </p>
      <ErrorBarViz />
    </>
  ),

  theory: (
    <>
      <Definition title="error bars">
        <p>
          A standard deviation describes the spread of single runs. A standard error, <M>{"\\sigma/\\sqrt n"}</M>, describes
          the uncertainty of a mean of n runs, and a 95% confidence interval is about 1.96 standard errors either side{" "}
          (<C>ci</C>). Whether a difference between two means is significant depends on the standard error of the
          difference, <M>{"\\sqrt{\\sigma_1^2/n_1 + \\sigma_2^2/n_2}"}</M> (<C>significant</C>), not on whether the two
          intervals overlap (<C>overlap</C>).
        </p>
        <Code>{BARS}</Code>
      </Definition>

      <Theorem title="overlapping intervals can hide a real difference">
        <p>
          Let two independent means have equal standard errors s and differ by d. Their 95% intervals overlap exactly
          when <M>{"|d| \\le 2 \\times 1.96\\,s"}</M>, and the difference is significant at the 5% level exactly when{" "}
          <M>{"|d| > 1.96\\sqrt{2}\\,s"}</M>. So for{" "}
          <M>{"1.96\\sqrt2\\,s < |d| \\le 3.92\\,s"}</M> the intervals overlap yet the difference is significant, and the
          overlap can reach a fraction <M>{"2 - \\sqrt2"}</M> of one interval&apos;s half-width.
        </p>
      </Theorem>
      <Proof>
        <p>
          The intervals <M>{"[m_1 - 1.96s, m_1 + 1.96s]"}</M> and <M>{"[m_2 - 1.96s, m_2 + 1.96s]"}</M> overlap iff the
          distance between centres is at most the sum of half-widths, <M>{"3.92s"}</M>. The difference has standard error{" "}
          <M>{"\\sqrt{s^2 + s^2} = \\sqrt2\\,s"}</M>, so the test rejects when <M>{"|d| > 1.96\\sqrt2\\,s \\approx 2.77s"}</M>.
          At the smallest significant gap the overlap is <M>{"3.92s - 2.77s = 1.96(2 - \\sqrt2)s"}</M>, which is{" "}
          <M>{"2 - \\sqrt2 \\approx 0.59"}</M> of a half-width. Intervals that do not overlap do imply significance,
          since <M>{"3.92 > 2.77"}</M>, but the converse fails, which is the reviewer&apos;s error in the puzzle.
        </p>
      </Proof>

      <Theorem title="power laws on log axes">
        <p>
          If <M>{"y = a x^b"}</M>, then <M>{"\\log y = \\log a + b \\log x"}</M>: a straight line on log-log axes with slope
          b. Least squares on the logarithms estimates b (<C>loglog_slope</C>) and a, and so predicts y at a new x{" "}
          (<C>predict</C>); axes with one tick per decade (<C>log_ticks</C>) make the slope readable.
        </p>
        <Code>{LOGLOG}</Code>
      </Theorem>
      <Proof>
        <p>
          Taking logarithms of <M>{"y = a x^b"}</M> gives the linear relation directly. Ordinary least squares on points{" "}
          <M>{"(u_i, v_i) = (\\log x_i, \\log y_i)"}</M> gives slope{" "}
          <M>{"\\sum (u_i - \\bar u)(v_i - \\bar v) / \\sum (u_i - \\bar u)^2"}</M> and intercept{" "}
          <M>{"\\bar v - b\\bar u"}</M>, so <M>{"\\hat a = e^{\\bar v - b \\bar u}"}</M>, which is the mean of{" "}
          <M>{"\\log y_i - b\\log x_i"}</M> exponentiated. Fitting in log space weights relative errors equally, which suits
          data spanning several orders of magnitude; l8.4.1 discusses when an offset term is needed as well.
        </p>
      </Proof>

      <Example title="the puzzle's second figure">
        <p>
          Loss falling as <M>{"L = 10\\,C^{-0.05}"}</M> looks on linear axes like a curve that flattens almost at once,
          because each tenfold increase in compute gives a similar ratio of improvement rather than a similar absolute
          amount. On log-log axes it is a straight line with slope −0.05, and the question becomes whether the line bends,
          which would be a real change, not whether it looks flat.
        </p>
      </Example>

      <Remark title="a checklist for figures">
        <p>
          Give each figure one message and put that message in the first sentence of the caption. Say what the error
          bars are and how many runs they summarise. Label axes with units, and start bar charts at zero. Use log axes for
          quantities spanning orders of magnitude. Use colours distinguishable by colour-blind readers and consistent
          across figures, and direct labels instead of distant legends where possible. Generate every figure from logged
          data by a script, as in l15.2.3. Tufte&apos;s advice to maximise the share of ink that shows data is a good
          default: remove anything that does not help the reader see the comparison.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frac",
      rung: "check",
      prompt: (
        <p>
          Two means have equal standard errors and are plotted with 95% intervals. At the smallest gap for which their
          difference is significant at the 1% level (z = 2.576), what fraction of one interval&apos;s half-width do the
          two intervals overlap by? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.1413, tolerance: 0.0005 },
    },
    {
      key: "slope",
      rung: "check",
      prompt: (
        <p>
          Loss is 4.0, 3.2 and 2.6 at compute <M>{"10^6"}</M>, <M>{"10^7"}</M> and <M>{"10^8"}</M>. What is the
          least-squares slope on log-log axes? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.0935, tolerance: 0.0005 },
    },
    {
      key: "bars",
      rung: "apply",
      prompt: <p>Which error bars shrink as more seeds are run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Standard errors and confidence intervals of the mean, but not standard deviations",
          "Standard deviations only",
          "All three equally",
          "None of them",
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

def ci(mean, sd, n, z=1.96):
    half = z * sd / math.sqrt(n)                           # error bar of a mean: standard error, not sd
    return round(mean - half, 6), round(mean + half, 6)

def overlap(a, b):
    return a[0] <= b[1] and b[0] <= a[1]

def significant(m1, sd1, n1, m2, sd2, n2, z=1.96):
    se = math.sqrt(sd1**2 / n1 + sd2**2 / n2)
    return abs(m1 - m2) > z * se

print(ci(10, 2, 4), overlap(ci(10, 2, 4), ci(13, 2, 4)), significant(10, 2, 4, 13, 2, 4))
print(overlap((0, 1), (1, 2)), significant(0, 1, 100, 0.25, 1, 100))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(8.04, 11.96) True True\nTrue False",
          "(8.04, 11.96) True False\nTrue False",
          "(6.08, 13.92) True True\nTrue False",
          "(8.04, 11.96) True True\nFalse False",
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

def loglog_slope(xs, ys):
    lx = [math.log(x) for x in xs]; ly = [math.log(y) for y in ys]
    mx, my = sum(lx) / len(lx), sum(ly) / len(ly)
    return sum((a - mx) * (b - my) for a, b in zip(lx, ly)) / sum((a - mx) ** 2 for a in lx)

def log_ticks(lo, hi):
    k, ticks = math.floor(math.log10(lo)), []
    while not ticks or ticks[-1] < hi:
        ticks.append(10.0 ** k)                            # one tick per decade covering the data
        k += 1
    return ticks

def predict(xs, ys, x):
    b = loglog_slope(xs, ys)
    la = sum(math.log(y) - b * math.log(v) for v, y in zip(xs, ys)) / len(xs)
    return math.exp(la) * x ** b                           # y = a x^b

print(round(loglog_slope([1, 10, 100], [5, 0.5, 0.05]), 6), log_ticks(3, 2000))
print(round(predict([1, 10, 100], [5, 0.5, 0.05], 1000), 6), round(loglog_slope([2, 4, 8], [3, 12, 48]), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-1.0 [1.0, 10.0, 100.0, 1000.0, 10000.0]\n0.005 2.0",
          "-1.0 [1.0, 10.0, 100.0, 1000.0]\n0.005 2.0",
          "-0.5 [1.0, 10.0, 100.0, 1000.0, 10000.0]\n0.05 2.0",
          "-1.0 [1.0, 10.0, 100.0, 1000.0, 10000.0]\n0.005 4.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>ci(mean, sd, n, z=1.96)</C>, the interval for the mean with ends rounded to six decimals;{" "}
          <C>overlap(a, b)</C>, true when two closed intervals share a point; and{" "}
          <C>significant(m1, sd1, n1, m2, sd2, n2, z=1.96)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def ci(mean, sd, n, z=1.96):
    return mean - sd, mean + sd

def overlap(a, b):
    return False

def significant(m1, sd1, n1, m2, sd2, n2, z=1.96):
    return not overlap(ci(m1, sd1, n1, z), ci(m2, sd2, n2, z))
`,
        solution: BARS,
        tests: [
          { name: "ci", code: `assert ci(0, 3, 9, 2) == (-2.0, 2.0) and overlap((0, 2), (1, 3)) and overlap((0, 1), (1, 2)) and not overlap((0, 1), (1.5, 2))` },
          { name: "sig", code: `assert significant(0, 1, 2, 3, 1, 2) and not significant(0, 1, 2, 1.9, 1, 2) and significant(0, 1, 50, 0.6, 1, 50, 1.96)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>loglog_slope(xs, ys)</C>; <C>log_ticks(lo, hi)</C>, powers of ten from{" "}
          <M>{"10^{\\lfloor \\log_{10} lo \\rfloor}"}</M> up to the first that is at least hi; and{" "}
          <C>predict(xs, ys, x)</C> from the fitted power law.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def loglog_slope(xs, ys):
    return (ys[-1] - ys[0]) / (xs[-1] - xs[0])

def log_ticks(lo, hi):
    return [lo, hi]

def predict(xs, ys, x):
    return ys[-1]
`,
        solution: LOGLOG,
        tests: [
          { name: "slope", code: `assert abs(loglog_slope([1, 2, 4], [3, 6, 12]) - 1) < 1e-12 and abs(loglog_slope([1, 4, 9], [1, 0.5, 1 / 3]) + 0.5) < 1e-12 and log_ticks(0.05, 2) == [0.01, 0.1, 1.0, 10.0]` },
          { name: "predict", code: `assert abs(predict([1, 3], [2, 18], 10) - 200) < 1e-9 and abs(predict([2, 8], [1, 0.5], 32) - 0.25) < 1e-12 and log_ticks(10, 10) == [10.0]` },
        ],
      },
    },
    {
      key: "extrap",
      rung: "stretch",
      prompt: (
        <p>
          Fit a power law to the three points of the second check and predict the loss at <M>{"10^9"}</M>. Give four
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.0908, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        A finished draft, with its claims, experiments and figures, is ready to be attacked. The next lesson turns Parton
        into a referee and asks how peer review works, and how to use it on your own paper before anyone else does.
      </p>
    </>
  ),
};
