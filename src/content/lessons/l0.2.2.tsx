import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { RegressionViz } from "@/components/viz/RegressionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.2.2",
  minutes: 45,
  links: {
    revisits: ["l0.1.2"],
    foreshadows: ["l1.2.1", "l1.2.2"],
  },

  puzzle: (
    <>
      <p>
        You are selling a flat of 85 square metres. You know the sizes and selling prices of twelve flats sold nearby last
        year, from 45 to 120 square metres.
      </p>
      <p>
        How would you set a fair asking price? And how confident should you be in it? Would your method work as well for a
        penthouse of 300 square metres?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Plot the twelve sales: size along the bottom, price up the side. The points do not lie on a line, since flats differ
        in floor, light and repair, but they rise together in a clear band. Draw the line through the middle of the band and
        read off the price at 85 square metres. That is regression.
      </p>
      <RegressionViz />
      <p>
        The line gives a single best guess, and the shaded band shows how far real sales typically fall from the line: a
        prediction should come with its likely error. Slide to 300 square metres in your head. The line would happily give
        an answer, but none of the data comes near that size, so nothing in the data supports it.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="regression">
        <p>
          In <strong>regression</strong>, the label is a number that can vary continuously: a price, a temperature, a time,
          a dose. The model predicts a number, and the loss measures how far it is from the truth, most often by squared
          error.
        </p>
      </Definition>

      <Definition title="linear regression">
        <p>A <strong>linear regression</strong> model with one feature predicts</p>
        <MD>{"\\hat y = w x + b,"}</MD>
        <p>
          where the parameters are the <strong>weight</strong> <M>w</M> (the slope: how much the prediction changes per unit
          of the feature) and the <strong>bias</strong> <M>b</M> (the intercept). Training chooses <M>w</M> and <M>b</M> to
          make the mean squared error on the data as small as possible.
        </p>
      </Definition>

      <Example title="reading the fitted line">
        <p>
          For the flats, the best line is about <M>{"\\hat y = 0.96x - 5.3"}</M>, in lakh rupees for <M>x</M> square
          metres. The weight says each extra square metre adds about &#8377;0.96 lakh. At 85 square metres the prediction is{" "}
          <M>{"0.963 \\times 85 - 5.3 \\approx 76.6"}</M> lakh. The typical miss on the data is about &#8377;2.6 lakh, so a
          range of roughly 74 to 79 lakh is honest; a single figure to the rupee is not.
        </p>
      </Example>

      <Definition title="interpolation and extrapolation">
        <p>
          Predicting inside the range of the training data is <strong>interpolation</strong>; predicting outside it is{" "}
          <strong>extrapolation</strong>. Extrapolation trusts that the pattern continues where it was never observed,
          which it often does not: a penthouse sells for more per square metre, and a flat of zero square metres does not
          sell for minus 5 lakh.
        </p>
      </Definition>

      <Remark title="more features">
        <p>
          Real models use many features at once: size, floor, age, distance to the metro. The model becomes{" "}
          <M>{"\\hat y = w_1 x_1 + w_2 x_2 + \\cdots + w_k x_k + b"}</M>, one weight per feature, and the line becomes a
          flat surface in many dimensions. The idea is the same: weights that make the squared error smallest.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "is-reg",
      rung: "check",
      prompt: <p>Select every task that is regression.</p>,
      answer: {
        kind: "choice",
        options: ["Predicting a patient's blood pressure", "Deciding whether an email is spam", "Estimating a person's age from a photograph", "Choosing which of 10 digits was written"],
        correct: [0, 2],
      },
    },
    {
      key: "predict",
      rung: "check",
      prompt: <p>A model predicts <M>{"\\hat y = 3x + 20"}</M>. What does it predict when <M>{"x = 7"}</M>?</p>,
      answer: { kind: "numeric", value: 41 },
    },
    {
      key: "weight",
      rung: "apply",
      prompt: (
        <p>
          A model predicts a car&rsquo;s fuel use in litres per 100 km as <M>{"\\hat y = 0.004x + 1.5"}</M>, where <M>x</M>{" "}
          is its mass in kilograms. By how many litres per 100 km does the prediction rise when the mass rises by 500 kg?
        </p>
      ),
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "mse",
      rung: "apply",
      prompt: <p>A model predicts 10, 20 and 30 where the truth is 12, 17 and 30. What is its mean squared error?</p>,
      answer: { kind: "numeric", value: 13 / 3 },
    },
    {
      key: "extrap",
      rung: "apply",
      prompt: (
        <p>
          A model fitted to children aged 2 to 10 predicts height as <M>{"6x + 80"}</M> cm at age <M>x</M>. It predicts 260
          cm at age 30. What has gone wrong?
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["Extrapolation: children stop growing, so the pattern does not continue past the data", "Overfitting to noise", "The loss function was wrong"],
        correct: [0],
      },
    },
    {
      key: "two-points",
      rung: "prove",
      prompt: (
        <p>
          With only two data points, <M>{"(1, 3)"}</M> and <M>{"(4, 9)"}</M>, find the line <M>{"\\hat y = wx + b"}</M>{" "}
          with zero squared error, and explain why no other line does as well. Then explain why a zero training error from
          just two points should not make you confident.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Finds w = 2 and b = 1 from the slope (9 − 3)/(4 − 1) and the point (1, 3).",
          "Explains that the error is zero only if the line passes through both points, and exactly one line does.",
          "Notes that any two points can be fitted perfectly, so the fit says nothing about whether the relation is really linear or how noisy it is.",
        ],
      },
    },
    {
      key: "best-w",
      rung: "stretch",
      prompt: (
        <p>
          Fit a line through the origin, <M>{"\\hat y = wx"}</M>, to the points <M>{"(1, 2)"}</M>, <M>{"(2, 5)"}</M>,{" "}
          <M>{"(3, 6)"}</M>. The total squared error is a parabola in <M>w</M>; find its lowest point. What is the best{" "}
          <M>w</M>, to two decimal places?
        </p>
      ),
      answer: { kind: "numeric", value: 2.14, tolerance: 0.005 },
    },
  ],

  teachBack:
    "Explain to a friend how you would price a flat from past sales with a straight line, what the slope of the line means, and why the line should not be trusted far outside the data.",

  glimpse: (
    <p>
      Next, clustering, where there are no labels at all. In Introduction to Machine Learning, you will find the best line
      exactly with least squares, interpret the weights of a model with many features, and see how gradient descent finds
      them when there are too many to solve for directly.
    </p>
  ),
};
