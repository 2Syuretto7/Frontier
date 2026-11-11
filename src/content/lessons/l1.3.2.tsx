import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { BoundaryLogitViz } from "@/components/viz/BoundaryLogitViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.3.2",
  minutes: 50,
  links: {
    revisits: ["l0.2.1", "l1.3.1", "l1.2.3"],
    parallels: ["m3.1.4", "m0.6.2"],
    foreshadows: ["l2.3.1", "l3.1.1"],
  },

  puzzle: (
    <>
      <p>
        A logistic model with two features predicts class 1 when <M>{"\\sigma(w_0 + w_1 x_1 + w_2 x_2) \\ge 0.5"}</M>.
      </p>
      <p>
        Sketch the set of points <M>{"(x_1, x_2)"}</M> where the model is exactly undecided. What shape is it, whatever the
        weights? What would happen to that set if you demanded 0.8 instead of 0.5?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The model is undecided where <M>{"w_0 + w_1 x_1 + w_2 x_2 = 0"}</M>, and that is the equation of a straight line. On
        one side the model says class 1, on the other class 0. This line is the <strong>decision boundary</strong>, the same
        idea as the boundaries of How Machines Learn, now with a formula.
      </p>
      <BoundaryLogitViz />
      <p>
        A ring cannot be cut from its centre by any straight line. Add <M>{"x_1^2"}</M> and <M>{"x_2^2"}</M> as features,
        and the boundary becomes a curve in the original plane, while remaining a flat cut in the larger feature space.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="decision boundary">
        <p>
          For a classifier that predicts class 1 when a score <M>{"s(x)"}</M> is at least a threshold, the{" "}
          <strong>decision boundary</strong> is the set where <M>{"s(x)"}</M> equals the threshold. For logistic regression
          with threshold 0.5 it is
        </p>
        <MD>{"w_0 + w_1 x_1 + \\cdots + w_d x_d = 0,"}</MD>
        <p>
          a line in two dimensions, a plane in three, and a <strong>hyperplane</strong> in general. A classifier whose
          boundary is a hyperplane is called <strong>linear</strong>.
        </p>
      </Definition>

      <Definition title="moving the threshold">
        <p>
          Predicting class 1 when <M>{"\\sigma(z) \\ge t"}</M> is the same as <M>{"z \\ge \\ln\\frac{t}{1-t}"}</M>. So
          changing the threshold shifts the boundary parallel to itself, without turning it. A higher threshold makes the
          model more cautious about predicting class 1.
        </p>
      </Definition>

      <Example title="a boundary by hand">
        <p>
          With weights <M>{"(-4, 1, 2)"}</M>, the boundary is <M>{"x_1 + 2x_2 = 4"}</M>, crossing the axes at{" "}
          <M>{"(4, 0)"}</M> and <M>{"(0, 2)"}</M>. The point <M>{"(2, 2)"}</M> has <M>{"z = -4 + 2 + 4 = 2 > 0"}</M>, so it
          is classed as 1, with probability <M>{"\\sigma(2) \\approx 0.88"}</M>. With threshold 0.8, class 1 needs{" "}
          <M>{"z \\ge \\ln 4 \\approx 1.39"}</M>.
        </p>
      </Example>

      <Example title="curved boundaries from features">
        <p>
          With features <M>{"(1, x_1, x_2, x_1^2, x_2^2)"}</M> and weights <M>{"(-1, 0, 0, 1, 1)"}</M>, the boundary is{" "}
          <M>{"x_1^2 + x_2^2 = 1"}</M>, a circle: points outside it are class 1. The model is still linear in its features,
          so it is fitted exactly as before.
        </p>
      </Example>

      <Remark title="more than two classes">
        <p>
          With <M>K</M> classes, a model can give each class its own score <M>{"w_k^\\top x"}</M> and predict the class with
          the highest. The boundaries between regions are then pieces of hyperplanes. Turning the <M>K</M> scores into
          probabilities is the job of the softmax function, which every language model uses to choose its next token from a
          vocabulary of tens of thousands.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "shape",
      rung: "check",
      prompt: <p>What shape is the decision boundary of logistic regression on two raw features?</p>,
      answer: { kind: "choice", options: ["A straight line", "A circle", "Any curve the data needs"], correct: [0] },
    },
    {
      key: "shift",
      rung: "check",
      prompt: <p>What does raising the threshold from 0.5 to 0.8 do to a logistic model&rsquo;s boundary?</p>,
      answer: { kind: "choice", options: ["Shifts it parallel to itself", "Rotates it", "Curves it"], correct: [0] },
    },
    {
      key: "intercept",
      rung: "apply",
      prompt: <p>With weights <M>{"(-4, 1, 2)"}</M>, where does the boundary cross the <M>{"x_2"}</M> axis? Give the value of <M>{"x_2"}</M>.</p>,
      answer: { kind: "numeric", value: 2 },
    },
    {
      key: "classify",
      rung: "apply",
      prompt: <p>With the same weights and threshold 0.5, which class is the point <M>{"(1, 1)"}</M>?</p>,
      answer: { kind: "choice", options: ["Class 0", "Class 1", "Exactly on the boundary"], correct: [0] },
    },
    {
      key: "zt",
      rung: "apply",
      prompt: <p>For threshold 0.8, class 1 requires <M>{"z \\ge \\ln 4"}</M>. What is <M>{"\\ln 4"}</M>, to two decimal places?</p>,
      answer: { kind: "numeric", value: 1.39, tolerance: 0.004 },
    },
    {
      key: "ring",
      rung: "prove",
      prompt: (
        <p>
          Explain why no logistic model on the raw features <M>{"x_1, x_2"}</M> can separate points inside a circle from points
          on a ring around it, and show how adding squared features solves the problem.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "States that the boundary on raw features is a straight line, so one class must lie in a half-plane.",
          "Argues that any half-plane containing points on the ring on one side of the centre must exclude points on the opposite side, or include the centre, so the classes cannot be separated.",
          "Shows that with features x₁², x₂², a boundary such as x₁² + x₂² = r² is a circle.",
          "Notes that the model is still linear in the new features, so the same fitting method works.",
        ],
      },
    },
    {
      key: "radius",
      rung: "stretch",
      prompt: <p>On features <M>{"(1, x_1, x_2, x_1^2, x_2^2)"}</M>, a model has weights <M>{"(-9, 0, 0, 1, 1)"}</M>. Its boundary is a circle. What is its radius?</p>,
      answer: { kind: "numeric", value: 3 },
    },
  ],

  teachBack:
    "Explain to a friend what a decision boundary is, why logistic regression's boundary is a straight line, and how extra features let it curve.",

  glimpse: (
    <p>
      Next, how to judge a classifier properly, starting with the confusion matrix. Statistical Machine Learning&rsquo;s
      support vector machines choose the boundary with the widest margin, and Neural Networks from Scratch shows why a single
      neuron, being linear, could never learn XOR.
    </p>
  ),
};
