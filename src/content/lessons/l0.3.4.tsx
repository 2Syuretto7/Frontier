import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { NeuronViz } from "@/components/viz/NeuronViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.3.4",
  minutes: 55,
  links: {
    revisits: ["l0.2.1"],
    foreshadows: ["l0.4.2", "l3.1.1"],
  },

  puzzle: (
    <>
      <p>
        You are deciding whether to go to a party. You weigh three things: whether your best friend is going, whether it is
        raining, and whether you have an exam tomorrow. Some matter more than others, and some push you away.
      </p>
      <p>
        Could you write your decision as a single sum of numbers that you compare with a threshold? What numbers would you
        choose? Are there decisions that no such sum could ever capture?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give each factor a weight: friend going, +3; raining, &minus;1; exam tomorrow, &minus;4. Add up the weights of the
        factors that are true, and go if the total beats a threshold, say 0. Friend going and raining gives 2: go. Friend going
        and an exam gives &minus;1: stay home. That is a <strong>neuron</strong>: a weighted sum compared with a threshold.
      </p>
      <p>
        Below, a neuron has two inputs, each 0 or 1. Adjust its two weights and its bias to make it behave like the logic gate
        AND (output 1 only when both inputs are 1), then OR (when at least one is), then XOR (when exactly one is).
      </p>
      <NeuronViz />
      <p>
        AND and OR are easy. XOR is impossible, however long you try. The square shows why: the neuron&rsquo;s decision is a
        straight line, and no straight line puts (0, 1) and (1, 0) on one side with (0, 0) and (1, 1) on the other.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="artificial neuron">
        <p>
          An <strong>artificial neuron</strong> with inputs <M>{"x_1, \\ldots, x_n"}</M> has a <strong>weight</strong>{" "}
          <M>{"w_i"}</M> for each input and a <strong>bias</strong> <M>b</M>. It computes
        </p>
        <MD>{"z = w_1 x_1 + w_2 x_2 + \\cdots + w_n x_n + b"}</MD>
        <p>
          and then applies an <strong>activation function</strong> to <M>z</M>. The simplest activation is the step: output
          1 if <M>{"z > 0"}</M>, and 0 otherwise.
        </p>
      </Definition>

      <Example title="AND by hand">
        <p>
          With <M>{"w_1 = w_2 = 1"}</M> and <M>{"b = -1.5"}</M>: input (1, 1) gives <M>{"z = 0.5"}</M>, output 1; inputs
          (0, 1) and (1, 0) give <M>{"z = -0.5"}</M>, output 0; input (0, 0) gives <M>{"-1.5"}</M>, output 0. That is AND.
          Changing only the bias to <M>{"-0.5"}</M> gives OR.
        </p>
      </Example>

      <p>
        The neuron outputs 1 exactly when <M>{"w_1 x_1 + w_2 x_2 + b > 0"}</M>. The points where this sum is zero form a
        straight line, so a single neuron is a linear classifier: the decision boundaries of the lesson on classification are
        what one neuron can draw.
      </p>

      <Definition title="linearly separable">
        <p>
          Two classes of points are <strong>linearly separable</strong> if some straight line (or flat hyperplane, in more
          dimensions) has all of one class on one side and all of the other class on the other. A single neuron with a step
          activation can represent exactly the linearly separable patterns.
        </p>
      </Definition>

      <Remark title="layers solve XOR">
        <p>
          XOR is &ldquo;OR, but not AND&rdquo;. One neuron computes OR, another computes AND, and a third neuron, taking their
          two outputs as its inputs, outputs 1 when the first is on and the second is off. Three neurons in two layers do what
          one cannot. Stacking layers of neurons, each feeding the next, is the idea behind every deep neural network, including
          the largest language models.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "z",
      rung: "check",
      prompt: <p>A neuron has weights 2 and &minus;1 and bias 0.5. What is <M>z</M> for the input (1, 3)?</p>,
      answer: { kind: "numeric", value: -0.5 },
    },
    {
      key: "out",
      rung: "check",
      prompt: <p>With a step activation, what does that neuron output for (1, 3)?</p>,
      answer: { kind: "numeric", value: 0 },
    },
    {
      key: "party",
      rung: "apply",
      prompt: (
        <p>
          With the party weights (friend +3, rain &minus;1, exam &minus;4) and threshold 0, select every situation in which
          you go.
        </p>
      ),
      answer: {
        kind: "choice",
        options: ["Friend going, raining, no exam", "Friend going, no rain, exam", "Friend not going, no rain, no exam", "Friend going, no rain, no exam"],
        correct: [0, 3],
      },
    },
    {
      key: "nand",
      rung: "apply",
      prompt: (
        <p>
          NAND outputs 0 only when both inputs are 1. With weights <M>{"w_1 = w_2 = -1"}</M>, which bias makes the neuron compute
          NAND?
        </p>
      ),
      answer: { kind: "choice", options: ["b = 0.5", "b = 1.5", "b = 2.5", "b = −0.5"], correct: [1] },
    },
    {
      key: "separable",
      rung: "apply",
      prompt: <p>Select every pattern a single step neuron with two inputs can compute.</p>,
      answer: { kind: "choice", options: ["AND", "OR", "XOR", "Output equals the first input"], correct: [0, 1, 3] },
    },
    {
      key: "xor-proof",
      rung: "prove",
      prompt: (
        <p>
          Prove that no single step neuron computes XOR. Hint: write the four conditions XOR imposes on <M>{"w_1, w_2, b"}</M>,
          then add two of them.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Writes the conditions: (0,0) needs b ≤ 0; (1,1) needs w₁ + w₂ + b ≤ 0; (1,0) needs w₁ + b > 0; (0,1) needs w₂ + b > 0.",
          "Adds the two strict inequalities to get w₁ + w₂ + 2b > 0.",
          "Adds the two other inequalities to get w₁ + w₂ + 2b ≤ 0.",
          "Concludes the two cannot both hold, so no weights and bias work.",
        ],
      },
    },
    {
      key: "xor-net",
      rung: "stretch",
      prompt: (
        <p>
          Build XOR from three neurons: <M>h_1</M> computes OR with weights 1, 1 and bias &minus;0.5; <M>h_2</M> computes AND
          with weights 1, 1 and bias &minus;1.5. The output neuron takes <M>h_1</M> and <M>h_2</M> with weights 1 and{" "}
          &minus;2. Which bias makes the output neuron compute XOR?
        </p>
      ),
      answer: { kind: "choice", options: ["b = −1.5", "b = −0.5", "b = 0.5", "b = 1.5"], correct: [1] },
    },
  ],

  teachBack:
    "Explain to a friend what an artificial neuron computes, using a decision of your own with weights, and why one neuron cannot compute XOR but three can.",

  glimpse: (
    <p>
      This completes learning by hand. Next, a short history of AI, beginning with the attempt to build intelligence from
      hand-written rules. The neuron in this lesson is Rosenblatt&rsquo;s perceptron of 1958, and the XOR problem is at the
      heart of the story of the first AI winter. In Neural Networks from Scratch you will build layers of neurons and train
      them with gradient descent.
    </p>
  ),
};
