import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LineByEyeViz } from "@/components/viz/LineByEyeViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.3.1",
  minutes: 50,
  links: {
    revisits: ["l0.1.2", "l0.2.2"],
    parallels: ["m0.3.3"],
    foreshadows: ["l1.2.1", "l1.2.4"],
  },

  puzzle: (
    <>
      <p>
        Eight students record how many hours they revised and the score they got on a test out of 10. You are given the
        eight points on a graph and a ruler.
      </p>
      <p>
        Lay the ruler where you think the best straight line goes. Then ask a friend to do the same, separately. Will your
        lines agree? If they differ, how would you settle whose line is better, without arguing about taste?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Two careful people will draw slightly different lines, and both will look reasonable. To settle it we need a number
        that measures a line&rsquo;s badness. The vertical gap between each point and the line is that point&rsquo;s error.
        Square each gap and add them up. The squares can be drawn as real squares, and the total is their total area.
      </p>
      <LineByEyeViz />
      <p>
        Move the line and the squares grow and shrink. Your eye is a decent learning algorithm: most people get within a
        little of the best total. But the slider is still you, guessing and checking. The point of this chapter is to make
        each of those guesses into a rule a computer can follow.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="residual">
        <p>
          For a line <M>{"\\hat y = mx + c"}</M> and a data point <M>{"(x_i, y_i)"}</M>, the <strong>residual</strong> is{" "}
          <M>{"y_i - (mx_i + c)"}</M>: how far the point lies above the line (or below, if negative).
        </p>
      </Definition>

      <Definition title="the least-squares line">
        <p>The <strong>least-squares line</strong> is the line that makes the sum of squared residuals smallest:</p>
        <MD>{"\\text{minimise} \\quad \\sum_{i=1}^{n} \\big(y_i - (mx_i + c)\\big)^2 \\quad \\text{over } m \\text{ and } c."}</MD>
      </Definition>

      <p>
        Two facts about it can be proved with the algebra of Foundations of School Mathematics. The best line always passes
        through the point of averages <M>{"(\\bar x, \\bar y)"}</M>. And its slope is
      </p>
      <MD>{"m = \\frac{\\sum (x_i - \\bar x)(y_i - \\bar y)}{\\sum (x_i - \\bar x)^2}."}</MD>
      <p>
        You do not need to derive these yet. What matters is that the best line is not a matter of opinion: given the data
        and the loss, there is exactly one answer, and a formula computes it.
      </p>

      <Example title="the revision data">
        <p>
          The hours are 1 to 8, with mean 4.5, and the scores average 5.075. The formula gives a slope of about 0.75 and an
          intercept of about 1.69. So each extra hour of revision goes with about three quarters of a mark more, and a
          student who revised for 5 hours would be predicted to score about <M>{"0.75 \\times 5 + 1.69 \\approx 5.4"}</M>.
        </p>
      </Example>

      <Definition title="improving by small steps">
        <p>
          When you moved the sliders, you used a strategy: nudge a parameter, see if the total error falls, and keep the
          nudge if it does. A computer can do this systematically, working out which direction of nudge lowers the error
          fastest and taking a small step that way, again and again. This is <strong>gradient descent</strong>, and it is how
          almost every modern neural network is trained.
        </p>
      </Definition>

      <Remark title="correlation, not cause">
        <p>
          The line says students who revised more tended to score more. It does not say revising caused the higher scores:
          students who revise more may also attend more lessons or sleep better. A fitted line describes the data; deciding
          what causes what needs more than the data alone.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "resid",
      rung: "check",
      prompt: <p>The line is <M>{"\\hat y = 2x + 1"}</M>. What is the residual of the point <M>{"(3, 9)"}</M>?</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "sse",
      rung: "check",
      prompt: <p>A line has residuals 1, −2, 0 and 3 on four points. What is the sum of squared residuals?</p>,
      answer: { kind: "numeric", value: 14 },
    },
    {
      key: "through-mean",
      rung: "apply",
      prompt: <p>The best line for some data has slope 2, and the data have <M>{"\\bar x = 3"}</M> and <M>{"\\bar y = 10"}</M>. What is its intercept?</p>,
      answer: { kind: "numeric", value: 4 },
    },
    {
      key: "slope",
      rung: "apply",
      prompt: <p>Find the slope of the least-squares line for the points (1, 1), (2, 3), (3, 2).</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "cause",
      rung: "apply",
      prompt: <p>Across towns, ice cream sales and drowning deaths rise together. Select every reasonable conclusion.</p>,
      answer: {
        kind: "choice",
        options: ["Ice cream causes drowning.", "A third factor, hot weather, may drive both.", "A line fitted to the data could predict one from the other.", "Banning ice cream would reduce drownings."],
        correct: [1, 2],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`pts = [(0, 1), (1, 3), (2, 5)]
for m, c in [(2, 1), (1.5, 1.5)]:
    print(sum((y - (m * x + c)) ** 2 for x, y in pts))`}</Code>
          <p>Two lines drawn by eye, judged by squared error. What is the second line printed?</p>
        </>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 1e-09 },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Fitting by eye is a search. Write <C>grid_fit(pts, slopes, intercepts)</C>, which tries every pair (m, c) from the two lists and returns the pair with the smallest sum of squared errors.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def grid_fit(pts, slopes, intercepts):
    return (slopes[0], intercepts[0])
`,
        solution: `def grid_fit(pts, slopes, intercepts):
    def sse(m, c):
        return sum((y - (m * x + c)) ** 2 for x, y in pts)
    return min(((m, c) for m in slopes for c in intercepts), key=lambda mc: sse(*mc))
`,
        tests: [
          { name: "grid", code: `pts = [(0, 1), (1, 3), (2, 5), (3, 7)]
assert grid_fit(pts, [0, 1, 2, 3], [-1, 0, 1, 2]) == (2, 1), 'y = 2x + 1 fits exactly.'` },
        ],
      },
    },
    {
      key: "why-square",
      rung: "prove",
      prompt: (
        <p>
          Explain why we add up the <em>squared</em> residuals rather than the residuals themselves. Give an example of a
          clearly bad line whose plain residuals add up to zero.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that positive and negative residuals cancel when added.",
          "Gives a bad line with residuals summing to zero, for instance a flat line at the mean of the y values through steeply rising data.",
          "Explains that squaring makes every term non-negative, so the total is zero only for a perfect fit and grows with every miss.",
        ],
      },
    },
    {
      key: "nudge",
      rung: "stretch",
      prompt: (
        <p>
          For the points (1, 2) and (2, 4), use only lines through the origin, <M>{"\\hat y = mx"}</M>. Start at{" "}
          <M>{"m = 1"}</M>. The total squared error is <M>{"(2 - m)^2 + (4 - 2m)^2"}</M>. Try <M>{"m = 1.5"}</M> and{" "}
          <M>{"m = 2.5"}</M>; then find the <M>m</M> that makes the error zero.
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
  ],

  teachBack:
    "Explain to a friend how to decide which of two hand-drawn lines fits some points better, using squares of the errors, and what gradient descent would do instead of you.",

  glimpse: (
    <p>
      Next, a model with no formula and no parameters at all: nearest neighbours. In Introduction to Machine Learning you
      will derive the least-squares formula, and meet gradient descent properly, first on this very problem. In Causality
      and Decision Theory you will learn what more than data is needed to turn a correlation into a cause.
    </p>
  ),
};
