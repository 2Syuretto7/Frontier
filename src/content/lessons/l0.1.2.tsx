import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LossCurveViz } from "@/components/viz/LossCurveViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.1.2",
  minutes: 50,
  links: {
    parallels: ["m0.8.1"],
    foreshadows: ["l1.2.1", "l2.1.4"],
  },

  puzzle: (
    <>
      <p>
        A food delivery app must show customers a single estimate before they order. Last week, seven deliveries from one
        restaurant took 22, 25, 27, 30, 31, 34 and 45 minutes.
      </p>
      <p>
        What one number should the app show? Before you answer, decide what &ldquo;best&rdquo; should mean. Is a
        prediction that is 10 minutes late as bad as two that are each 5 minutes late?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Any number you pick is a tiny model: whatever the order, it predicts that number. To compare models we need to
        score them, and the score depends on what we care about. Measure each mistake, square it, and average: that
        punishes one big miss more than several small ones. Or average the plain sizes of the mistakes, which treats every
        minute of error alike.
      </p>
      <p>
        Slide the prediction below. Each choice gives a different score, so the score is itself a function of the
        prediction, and its lowest point is the best model. Switch between the two ways of scoring and watch the best point
        move.
      </p>
      <LossCurveViz />
      <p>
        Squared error is smallest at the mean, about 30.6 minutes. Absolute error is smallest at the median, 30 minutes.
        Neither is wrong. They are answers to two different questions about what a good estimate is.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="data">
        <p>
          The <strong>data</strong> are a collection of examples. In <em>supervised</em> learning each example is a pair:
          an input <M>x</M> (the <strong>features</strong>, such as the restaurant, the distance and the time of day) and
          the output <M>y</M> we want to predict (the <strong>label</strong> or <strong>target</strong>, such as the
          delivery time).
        </p>
      </Definition>

      <Definition title="model">
        <p>
          A <strong>model</strong> is a rule that turns an input into a prediction, written <M>{"\\hat y = f(x)"}</M>.
          Usually it belongs to a family of rules described by adjustable numbers called <strong>parameters</strong>. The
          family &ldquo;predict the constant <M>c</M>&rdquo; has one parameter. The family of straight lines{" "}
          <M>{"\\hat y = mx + c"}</M> has two. The largest language models have hundreds of billions.
        </p>
      </Definition>

      <Definition title="loss">
        <p>
          A <strong>loss function</strong> scores a single prediction against the truth: a large loss means a bad
          prediction. Two common choices are
        </p>
        <MD>{"\\text{squared error } (\\hat y - y)^2, \\qquad \\text{absolute error } |\\hat y - y|."}</MD>
        <p>
          The <strong>training loss</strong> of a model is the average loss over all the examples in the data.
        </p>
      </Definition>

      <p>
        With these three pieces, learning has a precise meaning: <em>among the models in the family, find the parameters
        that make the training loss as small as possible</em>. Everything else, from fitting a line to training a
        language model, is a refinement of this sentence: better families of models, better losses, better ways of
        searching.
      </p>

      <Example title="the puzzle, worked">
        <p>
          With squared error, the best constant is the mean of the data,{" "}
          <M>{"\\tfrac{22 + 25 + 27 + 30 + 31 + 34 + 45}{7} = \\tfrac{214}{7} \\approx 30.6"}</M> minutes. With absolute
          error it is the median, 30. The 45-minute delivery pulls the mean up but barely moves the median. The lesson on averages in the mathematics track proves the
          first fact; the second is in the practice below.
        </p>
      </Example>

      <Remark title="the loss is a choice with consequences">
        <p>
          The loss is where you tell the machine what matters. A delivery app that loses customers when it is late, but not
          when it is early, should use a loss that punishes lateness more. A model trained on the wrong loss can be very
          good at the wrong thing. Choosing what to measure is one of the most important decisions in machine learning, and
          it is made by people.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sq",
      rung: "check",
      prompt: <p>A model predicts 12 and the true value is 9. What is the squared error?</p>,
      answer: { kind: "numeric", value: 9 },
    },
    {
      key: "param",
      rung: "check",
      prompt: <p>How many parameters does the family of models <M>{"\\hat y = ax^2 + bx + c"}</M> have?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "mse",
      rung: "apply",
      prompt: <p>A model predicts 30 for the three data values 26, 30 and 37. What is its mean squared error?</p>,
      answer: { kind: "numeric", value: 65 / 3 },
    },
    {
      key: "best-c",
      rung: "apply",
      prompt: <p>For the data 4, 7, 7, 10, 22, which constant prediction has the smallest mean squared error?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "best-abs",
      rung: "apply",
      prompt: <p>For the same data, 4, 7, 7, 10, 22, which constant prediction has the smallest mean absolute error?</p>,
      answer: { kind: "numeric", value: 7 },
    },
    {
      key: "median",
      rung: "prove",
      prompt: (
        <p>
          For the data 1, 2, 10, explain why the constant 2 has a smaller total absolute error than any other constant. Hint:
          what happens to the total when you move the constant a little to the left or right of 2?
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Computes the total absolute error at 2: 1 + 0 + 8 = 9.",
          "Notes that moving right from 2 increases the distance to two points (1 and 2) and decreases it to one (10), so the total rises.",
          "Notes that moving left from 2 increases the distance to two points (2 and 10) and decreases it to one (1), so the total rises.",
          "Concludes 2, the median, is the minimum.",
        ],
      },
    },
    {
      key: "late",
      rung: "stretch",
      prompt: (
        <p>
          A delivery app counts a late estimate as three times as bad as an early one: the loss is <M>{"3(y - \\hat y)"}</M>{" "}
          when the delivery is later than predicted and <M>{"\\hat y - y"}</M> when it is earlier. For the seven times in the
          puzzle, which of the data values is the best constant prediction?
        </p>
      ),
      answer: { kind: "numeric", value: 34 },
    },
  ],

  teachBack:
    "Explain to a friend what data, a model and a loss are, using a prediction problem from your own life, and why the choice of loss changes which prediction is best.",

  glimpse: (
    <p>
      Next, the question that makes machine learning hard: a model can have a tiny loss on its training data and still fail
      on new data. In Introduction to Machine Learning you will minimise squared error over all straight lines, which is
      least squares, and in Statistical Machine Learning you will see that each loss function corresponds to a different
      belief about how the data were generated.
    </p>
  ),
};
