import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { DegreeViz } from "@/components/viz/DegreeViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.1.3",
  minutes: 50,
  links: {
    revisits: ["l0.1.3", "l1.1.2"],
    parallels: ["m0.2.6"],
    foreshadows: ["l1.5.1", "l1.5.3", "l3.7.1"],
  },

  puzzle: (
    <>
      <p>
        Through any 15 points with different <M>x</M> values there is a polynomial of degree 14 that passes through every
        one of them exactly.
      </p>
      <p>
        So a degree-14 polynomial has zero training error on any 15 points. Is it therefore the best model for 15 noisy
        measurements? Sketch what you think it looks like between the points.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A curve forced through every noisy point must swing wildly between them. It has learned the noise, not the pattern.
        This is <strong>overfitting</strong>, met in How Machines Learn; here we measure it. The data below come from a smooth
        wave plus noise. Raise the degree and watch both the fitted curve and the two errors.
      </p>
      <DegreeViz />
      <p>
        Training error only ever goes down as the degree rises. Test error falls, bottoms out, and then shoots up. The best
        model is neither the simplest nor the most flexible.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="capacity">
        <p>
          The <strong>capacity</strong> of a family of models is, informally, how wide a range of functions it can fit.
          Polynomials of degree <M>k</M> in one variable have <M>{"k + 1"}</M> coefficients,
        </p>
        <MD>{"f(x) = w_0 + w_1 x + w_2 x^2 + \\cdots + w_k x^k,"}</MD>
        <p>and their capacity grows with <M>k</M>. Each family contains all the smaller ones, by setting the extra coefficients to zero.</p>
      </Definition>

      <Definition title="underfitting and overfitting">
        <p>
          A model <strong>underfits</strong> when it is too simple to capture the pattern: training and test error are both
          high. It <strong>overfits</strong> when it fits the noise of the particular training examples: training error is
          low but test error is much higher. Between them lies the capacity that gives the lowest test error.
        </p>
      </Definition>

      <Example title="why training error never rises">
        <p>
          Fitting by least squares chooses the coefficients that minimise training error within the family. Since every
          polynomial of degree <M>k</M> is also one of degree <M>{"k + 1"}</M>, the best fit of degree <M>{"k + 1"}</M> is at
          least as good on the training data. So training error is a poor guide to choosing capacity: it always prefers more.
        </p>
      </Example>

      <Remark title="remedies, and a modern twist">
        <p>
          Overfitting is reduced by more data, by a simpler family, by <strong>regularisation</strong> that penalises extreme
          coefficients, and by stopping training early. Choosing among these needs an honest estimate of test error, which is
          the next lesson. One warning: the U-shaped test curve is the classical picture. Very large neural networks, with far
          more parameters than examples, can generalise well despite fitting their training data perfectly, a phenomenon
          called double descent. The classical picture remains the right starting point, and later courses explain where it
          bends.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "overfit",
      rung: "check",
      prompt: <p>Which pattern of errors signals overfitting?</p>,
      answer: { kind: "choice", options: ["Low training error, much higher test error", "High training error, high test error", "Equal training and test error"], correct: [0] },
    },
    {
      key: "underfit",
      rung: "check",
      prompt: <p>A straight line is fitted to data that follow a wave. Training and test error are both high. What is happening?</p>,
      answer: { kind: "choice", options: ["Underfitting", "Overfitting", "Data leakage"], correct: [0] },
    },
    {
      key: "interp",
      rung: "apply",
      prompt: <p>A polynomial of degree 14 is fitted by least squares to 15 points with different <M>x</M> values. What is its training mean squared error?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "sweet",
      rung: "apply",
      prompt: <p>In the visualisation, roughly which range of degrees gives the lowest test error?</p>,
      answer: { kind: "choice", options: ["0 to 2", "3 to 6", "9 to 12"], correct: [1] },
    },
    {
      key: "remedies",
      rung: "apply",
      prompt: <p>A model overfits. Select every change likely to reduce the overfitting.</p>,
      answer: {
        kind: "choice",
        options: ["Collect more training data", "Use a simpler family of models", "Penalise large coefficients", "Train for longer on the same data"],
        correct: [0, 1, 2],
      },
    },
    {
      key: "nested",
      rung: "prove",
      prompt: (
        <p>
          Prove that the least-squares training error of the best polynomial of degree <M>{"k + 1"}</M> is at most that of
          the best polynomial of degree <M>k</M>, and explain why this makes training error useless for choosing the degree.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that any polynomial of degree k is a polynomial of degree k + 1 with leading coefficient zero.",
          "Concludes that the minimum over the larger family is at most the minimum over the smaller family.",
          "Explains that training error therefore always favours the largest degree, regardless of how it does on new data.",
          "States that degree must be chosen with data not used for fitting, such as a validation set.",
        ],
      },
    },
    {
      key: "twovar",
      rung: "stretch",
      prompt: (
        <p>
          A polynomial of degree at most 3 in two variables <M>x</M> and <M>y</M> has one coefficient for each term{" "}
          <M>{"x^a y^b"}</M> with <M>{"a + b \\le 3"}</M>. How many coefficients does it have?
        </p>
      ),
      answer: { kind: "numeric", value: 10 },
    },
  ],

  teachBack:
    "Explain to a friend what overfitting and underfitting are, why training error always prefers more flexible models, and what the U-shaped test error curve means.",

  glimpse: (
    <p>
      Next, the discipline that keeps test error honest: separate training, validation and test sets. Bias and variance give
      the U-shaped curve a precise explanation later in this course, ridge and lasso regularisation tame flexible models, and
      Neural Networks from Scratch adds weight decay to the same toolkit.
    </p>
  ),
};
