import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { DotPlotViz } from "@/components/viz/DotPlotViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.8.1",
  minutes: 65,
  links: {
    revisits: ["m0.7.2"],
    foreshadows: ["m7.2.4", "m9.2.4", "l1.2.1"],
  },

  puzzle: (
    <>
      <p>
        Nine people work in a small office, each earning about &#8377;40,000 a month. The owner earns
        &#8377;20,00,000 a month. A job advert says &ldquo;average monthly pay here is over &#8377;2,30,000&rdquo;.
      </p>
      <p>Is the advert lying? If not, what single number would describe a typical salary more honestly, and why?</p>
    </>
  ),

  intuition: (
    <>
      <p>
        The advert is not lying. Add up all ten salaries and divide by ten, and the owner&rsquo;s pay drags the answer far
        above what any employee earns. That is the <strong>mean</strong>. Line the salaries up in order and take the middle
        one, and the owner barely matters: that is the <strong>median</strong>. Both are honest averages. They answer
        different questions.
      </p>
      <p>
        A good picture is a see-saw. Put a weight at each data value along a plank. The mean is the point where the plank
        balances, so a single weight far out on one side pulls the balance point towards it. The median only cares how
        many weights are on each side, not how far out they are. Move the red value below and watch.
      </p>
      <DotPlotViz />
      <p>
        An average alone hides something important: how spread out the values are. Two classes can both average 60 out of
        100, one with everyone between 55 and 65, the other with half the class near 20 and half near 100. So we also
        measure <strong>spread</strong>.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="mean and median">
        <p>For data values <M>{"x_1, x_2, \\ldots, x_n"}</M>, the <strong>mean</strong> is</p>
        <MD>{"\\bar{x} = \\frac{1}{n} \\sum_{i=1}^{n} x_i."}</MD>
        <p>
          The <strong>median</strong> is the middle value once the data are sorted: the value in position{" "}
          <M>{"\\tfrac{n+1}{2}"}</M> when <M>n</M> is odd, and the mean of the two middle values when <M>n</M> is even. The{" "}
          <strong>mode</strong> is the most frequent value, if there is one.
        </p>
      </Definition>

      <Proposition title="the mean is the balance point">
        <p>The deviations from the mean add up to zero: <M>{"\\sum_{i=1}^{n} (x_i - \\bar{x}) = 0"}</M>.</p>
      </Proposition>
      <Proof>
        <p>
          By the rules of sigma notation,{" "}
          <M>{"\\sum (x_i - \\bar x) = \\sum x_i - n\\bar x = n\\bar x - n\\bar x = 0"}</M>, using{" "}
          <M>{"\\sum x_i = n \\bar x"}</M>, which is the definition of the mean multiplied by <M>n</M>.
        </p>
      </Proof>
      <p>
        On the see-saw, a value at <M>{"x_i"}</M> pushes with a turning effect proportional to its distance{" "}
        <M>{"x_i - \\bar{x}"}</M> from the pivot, positive on one side and negative on the other. The proposition says the
        effects cancel exactly at <M>{"\\bar x"}</M>, which is why the plank balances there.
      </p>

      <Definition title="measures of spread">
        <p>
          The <strong>range</strong> is the largest value minus the smallest. The <strong>variance</strong> is the mean
          squared deviation from the mean, and the <strong>standard deviation</strong> is its square root:
        </p>
        <MD>{"s^2 = \\frac{1}{n} \\sum_{i=1}^{n} (x_i - \\bar{x})^2, \\qquad s = \\sqrt{s^2}."}</MD>
      </Definition>

      <p>
        Why square the deviations? Their plain sum is always zero, by the proposition, so it measures nothing. Taking
        absolute values would work, but squares are far easier to calculate with, and they connect the spread to
        Pythagoras, as you will see in Linear Algebra. The square root at the end brings the units back: if the data are in
        rupees, <M>{"s^2"}</M> is in rupees squared and <M>s</M> is in rupees again.
      </p>

      <Example title="a small data set">
        <p>
          The values 2, 4, 4, 4, 5, 5, 7, 9 have mean <M>{"\\tfrac{40}{8} = 5"}</M>. The deviations are{" "}
          <M>{"-3, -1, -1, -1, 0, 0, 2, 4"}</M>, which add to 0, as they must. Their squares add to{" "}
          <M>{"9 + 1 + 1 + 1 + 0 + 0 + 4 + 16 = 32"}</M>, so the variance is <M>{"\\tfrac{32}{8} = 4"}</M> and the standard
          deviation is 2. The median is the mean of the fourth and fifth values, <M>{"\\tfrac{4 + 5}{2} = 4.5"}</M>.
        </p>
      </Example>

      <Proposition title="the mean minimises squared error">
        <p>
          Of all numbers <M>c</M>, the one that makes <M>{"\\sum (x_i - c)^2"}</M> smallest is <M>{"c = \\bar x"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>Write <M>{"x_i - c = (x_i - \\bar x) + (\\bar x - c)"}</M> and expand the square:</p>
        <MD>{"\\sum (x_i - c)^2 = \\sum (x_i - \\bar x)^2 + 2(\\bar x - c)\\sum (x_i - \\bar x) + n(\\bar x - c)^2."}</MD>
        <p>
          The middle sum is zero by the balance-point proposition. The first term does not depend on <M>c</M>, and the
          last is never negative and is zero only when <M>{"c = \\bar x"}</M>.
        </p>
      </Proof>

      <Remark title="which average to trust">
        <p>
          The median is <em>robust</em>: one wild value, a typing error or a billionaire, hardly moves it. The mean is not,
          but it has the property just proved, and that makes it the natural choice whenever errors are measured by their
          squares. This is not a small point. When a machine learning model is trained to predict a number by minimising
          squared error, what it learns to predict, for each input, is a mean. If it is trained on absolute error instead,
          it learns a median.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mean",
      rung: "check",
      prompt: <p>Find the mean of 3, 7, 8, 10, 12.</p>,
      answer: { kind: "numeric", value: 8 },
    },
    {
      key: "median",
      rung: "check",
      prompt: <p>Find the median of 9, 2, 6, 4, 11, 3.</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "sd",
      rung: "apply",
      prompt: <p>Find the standard deviation of 1, 3, 5, 7, 9, using the formula above (dividing by <M>n</M>). Give a decimal to two places.</p>,
      answer: { kind: "numeric", value: 2.83, tolerance: 0.005 },
    },
    {
      key: "missing",
      rung: "apply",
      prompt: <p>Four test scores have mean 70. A fifth score raises the mean to 74. What was the fifth score?</p>,
      answer: { kind: "numeric", value: 90 },
    },
    {
      key: "robust",
      rung: "apply",
      prompt: <p>The largest value in a data set of 11 values is changed from 50 to 500. Select everything that must change.</p>,
      answer: { kind: "choice", options: ["the mean", "the median", "the range", "the standard deviation"], correct: [0, 2, 3] },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import statistics as st
xs = [2, 4, 4, 4, 5, 5, 7, 9]
print(st.mean(xs), st.median(xs), st.pstdev(xs))`}</Code>
          <p>Mean, median and population standard deviation. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["5 4.5 2.0", "5 4 2.0", "5 4.5 4.0", "4.5 5 2.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>summary(xs)</C>, which returns (mean, median, population standard deviation) of a non-empty list without the <C>statistics</C> module or numpy.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def summary(xs):
    m = sum(xs) / len(xs)
    return (m, m, 0.0)
`,
        solution: `def summary(xs):
    n = len(xs)
    m = sum(xs) / n
    s = sorted(xs)
    med = s[n // 2] if n % 2 else (s[n // 2 - 1] + s[n // 2]) / 2
    sd = (sum((x - m) ** 2 for x in xs) / n) ** 0.5
    return (m, med, sd)
`,
        tests: [
          { name: "even", code: `m, med, sd = summary([2, 4, 4, 4, 5, 5, 7, 9])
assert abs(m - 5) < 1e-9 and abs(med - 4.5) < 1e-9 and abs(sd - 2) < 1e-9, 'With an even count the median averages the middle two.'` },
          { name: "odd", code: `m, med, sd = summary([9, 1, 5])
assert abs(med - 5) < 1e-9 and abs(sd - (32 / 3) ** 0.5) < 1e-9, 'Sort before taking the middle value.'` },
        ],
      },
    },
    {
      key: "shift",
      rung: "prove",
      prompt: (
        <p>
          Every value in a data set is increased by the same number <M>k</M>. Prove that the mean increases by <M>k</M> and
          the standard deviation does not change.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the new mean: (1/n)Σ(xᵢ + k) = x̄ + k.",
          "Notes that each new deviation is (xᵢ + k) − (x̄ + k) = xᵢ − x̄.",
          "Concludes the variance, and so the standard deviation, is unchanged.",
        ],
      },
    },
    {
      key: "shortcut",
      rung: "stretch",
      prompt: (
        <p>
          Show that the variance equals the mean of the squares minus the square of the mean. Use it to find the variance of
          the values 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.
        </p>
      ),
      answer: { kind: "numeric", value: 8.25 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between the mean and the median using the see-saw picture, and say which one you would quote for house prices and why.",

  glimpse: (
    <p>
      Next, histograms, which show the whole shape of a data set rather than one or two numbers. In Probability, the mean
      and variance of data become the expectation and variance of a random variable, and in Mathematical Statistics you
      will ask why some formulas divide by <M>{"n - 1"}</M> instead of <M>n</M>. In Introduction to Machine Learning,
      fitting a line by least squares is the minimising property you just proved, in a richer setting.
    </p>
  ),
};
