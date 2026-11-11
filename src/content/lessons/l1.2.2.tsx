import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { CoefViz } from "@/components/viz/CoefViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.2.2",
  minutes: 50,
  links: {
    revisits: ["l1.2.1"],
    parallels: ["m7.5.2"],
    foreshadows: ["m9.6.3", "m22.1.1", "l11.1.1"],
  },

  puzzle: (
    <>
      <p>
        A model of flat prices has a coefficient of &minus;3 lakh for the number of rooms. A friend concludes: &ldquo;Adding
        a room makes a flat cheaper, so I should knock down a wall to raise the value of mine.&rdquo;
      </p>
      <p>
        What exactly does the coefficient say? What other features are in the model, and how does that change the meaning?
        Is your friend&rsquo;s plan supported by it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A coefficient in a model with several features answers a specific question: how much does the prediction change
        when this feature goes up by one <em>and every other feature in the model stays the same</em>? Change which other
        features are in the model, and the question, and the answer, change too.
      </p>
      <CoefViz />
      <p>
        With size held fixed, a flat with more rooms has smaller rooms, and in this made-up market that lowers the price. That
        says nothing about what would happen if you knocked down a wall: the model describes patterns in sales, not the
        effect of renovations.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="reading a coefficient">
        <p>In the model</p>
        <MD>{"\\hat y = w_0 + w_1 x_1 + w_2 x_2 + \\cdots + w_d x_d,"}</MD>
        <p>
          <M>{"w_j"}</M> is the change in the prediction when <M>{"x_j"}</M> increases by one unit and the other features are
          held fixed. Its units are the units of <M>y</M> per unit of <M>{"x_j"}</M>: lakh per square metre, marks per hour.
          The intercept <M>{"w_0"}</M> is the prediction when every feature is zero, which may be meaningless, such as a flat
          of zero size.
        </p>
      </Definition>

      <Definition title="confounding and collinearity">
        <p>
          When features are correlated, as size and rooms are, a model with only one of them lets it stand in for the other.
          Adding the second can change the first one&rsquo;s coefficient greatly, even its sign. When two features are{" "}
          <em>nearly</em> copies of each other, called <strong>collinearity</strong>, the data cannot separate their
          effects, and their coefficients become unstable: small changes in the data swing them wildly, while the predictions
          stay good.
        </p>
      </Definition>

      <Example title="units and scaling">
        <p>
          With price in lakh and size in square metres, a size coefficient of 0.9 means 0.9 lakh per square metre: two flats
          with the same number of rooms, 10 m² apart, differ in predicted price by 9 lakh. Measure size in hundreds of square
          metres instead, and the coefficient becomes 90; nothing about the model has changed. So the size of a coefficient
          says nothing about the importance of a feature unless the features are on comparable scales. A common fix is to{" "}
          <strong>standardise</strong> each feature, subtracting its mean and dividing by its standard deviation, so that each
          coefficient is the effect of a one-standard-deviation change.
        </p>
      </Example>

      <Remark title="prediction is not causation">
        <p>
          A regression fitted to observed data describes how <M>y</M> varies with the features in that data. It does not say
          what would happen if you <em>changed</em> a feature yourself, because in the data the features moved together for
          reasons the model does not see. Answering &ldquo;what if I intervene?&rdquo; needs either an experiment or the
          methods of causal inference. Interpreting what a model has learned, for networks with billions of weights rather
          than three, is the subject of interpretability research.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fixed",
      rung: "check",
      prompt: <p>In a model with several features, a coefficient describes the change in the prediction when its feature rises by one and:</p>,
      answer: { kind: "choice", options: ["The other features are held fixed", "The other features rise too", "The other features are removed"], correct: [0] },
    },
    {
      key: "units",
      rung: "check",
      prompt: <p>Price is in lakh and size in square metres. What are the units of the size coefficient?</p>,
      answer: { kind: "choice", options: ["Lakh per square metre", "Square metres per lakh", "Lakh", "It has no units"], correct: [0] },
    },
    {
      key: "predict",
      rung: "apply",
      prompt: <p>A model is <M>{"\\hat y = 5 + 0.9 \\times \\text{size} - 3 \\times \\text{rooms}"}</M>. What does it predict, in lakh, for an 80 m² flat with 3 rooms?</p>,
      answer: { kind: "numeric", value: 68 },
    },
    {
      key: "diff",
      rung: "apply",
      prompt: <p>Using the same model, two flats have the same number of rooms and differ in size by 10 m². By how many lakh do their predicted prices differ?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "rescale",
      rung: "apply",
      prompt: <p>Size is re-measured in hundreds of square metres, and the model refitted. What does the size coefficient of 0.9 become?</p>,
      answer: { kind: "numeric", value: 90 },
    },
    {
      key: "flip",
      rung: "prove",
      prompt: (
        <p>
          Explain why the coefficient of rooms can be large and positive in a model with rooms alone, but negative in a model
          with both size and rooms, using the same data. Then explain why neither coefficient tells you what knocking down a
          wall would do to a flat&rsquo;s price.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that rooms and size are strongly correlated, so with rooms alone, the rooms coefficient also captures the effect of size.",
          "Explains that with size included, the rooms coefficient compares flats of equal size, where more rooms means smaller rooms.",
          "Explains that a regression on observed sales describes association among features as they occur together, not the effect of intervening.",
          "Notes that answering the renovation question would need an experiment or causal reasoning about what else changes.",
        ],
      },
    },
    {
      key: "standard",
      rung: "stretch",
      prompt: <p>In the model above, size has a standard deviation of 25 m² in the data. By how many lakh does the prediction change for a one-standard-deviation increase in size, rooms fixed?</p>,
      answer: { kind: "numeric", value: 22.5 },
    },
  ],

  teachBack:
    "Explain to a friend what a regression coefficient means when there are several features, why it can change sign when another feature is added, and why it is not a causal effect.",

  glimpse: (
    <p>
      Next, polynomial features, which let a linear model fit curves. Mathematical Statistics puts error bars on coefficients,
      Causality and Decision Theory answers the &ldquo;what if I intervene?&rdquo; question, and Interpretability studies what
      the weights of large networks mean.
    </p>
  ),
};
