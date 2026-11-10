import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Proposition, Remark } from "@/components/lesson/Blocks";
import { ExpectedValueViz } from "@/components/viz/ExpectedValueViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "m0.8.4",
  minutes: 65,
  links: {
    revisits: ["m0.8.1"],
    foreshadows: ["m7.2.3", "m7.7.1", "m22.5.1"],
  },

  puzzle: (
    <>
      <p>
        At a fair, a stall offers a game. You pay &#8377;2 and roll one die. Roll a six and you win &#8377;12; roll
        anything else and you win nothing.
      </p>
      <p>
        Should you play? What would you expect to happen to your money if you played a thousand times? And what price would
        make the game fair to both you and the stall?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Over 600 games, you expect about 100 sixes, since each face comes up about a sixth of the time. Those win{" "}
        <M>{"100 \\times 12 = 1200"}</M> rupees, and the 600 games cost <M>{"600 \\times 2 = 1200"}</M>. So in the long run
        you break even: on average you win <M>{"\\tfrac{12}{6} = 2"}</M> rupees a game before paying, exactly the price.
        At &#8377;2 the game is fair.
      </p>
      <p>
        That long-run average is the <strong>expected value</strong>. To find it, weight each possible result by its
        probability and add. Set your own prizes and price below, then play a thousand games and watch the running
        average close in on the dotted line.
      </p>
      <ExpectedValueViz />
      <p>
        A single game never pays &#8377;0 net: you either lose &#8377;2 or gain &#8377;10. The expected value is not what
        you expect in one game. It is what you should expect <em>per game</em>, averaged over many.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="random variable">
        <p>
          A <strong>random variable</strong> is a number whose value depends on the outcome of a random experiment: your
          winnings, the total of two dice, the number of heads in ten tosses. If it can take the values{" "}
          <M>{"x_1, \\ldots, x_k"}</M> with probabilities <M>{"p_1, \\ldots, p_k"}</M>, those pairs form its{" "}
          <strong>distribution</strong>, and the probabilities add up to 1.
        </p>
      </Definition>

      <Definition title="expected value">
        <p>The <strong>expected value</strong> of a random variable <M>X</M> is</p>
        <MD>{"E[X] = \\sum_{i=1}^{k} x_i \\, p_i = x_1 p_1 + x_2 p_2 + \\cdots + x_k p_k."}</MD>
      </Definition>

      <p>
        Why this formula? Repeat the experiment <M>n</M> times. The value <M>{"x_i"}</M> turns up about{" "}
        <M>{"n p_i"}</M> times, by the meaning of probability. So the total of all the values is about{" "}
        <M>{"\\sum x_i \\, n p_i"}</M>, and the mean of the data, by the definition from the first lesson of this chapter, is about{" "}
        <M>{"\\sum x_i \\, p_i"}</M>. Expected value is the mean of the data you would collect in the long run.
      </p>

      <Example title="one die">
        <p>
          A fair die shows <M>{"1, \\ldots, 6"}</M>, each with probability <M>{"\\tfrac16"}</M>. So{" "}
          <M>{"E[X] = \\tfrac{1 + 2 + 3 + 4 + 5 + 6}{6} = 3.5"}</M>. The expected value need not be a possible value: no die
          ever shows 3.5.
        </p>
      </Example>

      <Proposition title="linearity">
        <p>
          For numbers <M>a</M> and <M>b</M>, <M>{"E[aX + b] = aE[X] + b"}</M>. And for two random variables on the same
          experiment, <M>{"E[X + Y] = E[X] + E[Y]"}</M>.
        </p>
      </Proposition>
      <Proof>
        <p>
          For the first, <M>{"\\sum (a x_i + b) p_i = a \\sum x_i p_i + b \\sum p_i = aE[X] + b"}</M>, since the{" "}
          <M>{"p_i"}</M> add to 1. For the second, think of the long run: the mean of the sums <M>{"X + Y"}</M> over many
          trials is the mean of the <M>X</M> values plus the mean of the <M>Y</M> values, since adding then averaging is the
          same as averaging then adding. In the long run those means are <M>{"E[X]"}</M> and <M>{"E[Y]"}</M>.
        </p>
      </Proof>

      <Example title="two dice, no work">
        <p>
          The total of two dice is <M>{"X + Y"}</M>, each with expected value 3.5, so its expected value is 7. There is no
          need to list all 36 outcomes. Linearity holds even when the two parts influence each other, which makes it one of
          the most useful facts in all of probability.
        </p>
      </Example>

      <Example title="the stall's profit">
        <p>
          For the puzzle game at a price of &#8377;3, your net winnings are <M>{"W = 12S - 3"}</M>, where <M>S</M> is 1 for a
          six and 0 otherwise. Then <M>{"E[S] = \\tfrac16"}</M> and, by linearity, <M>{"E[W] = 12 \\cdot \\tfrac16 - 3 = -1"}</M>.
          You lose a rupee a game on average, and over a thousand players the stall makes about &#8377;1,000.
        </p>
      </Example>

      <Remark title="when the average is not the whole story">
        <p>
          Would you pay &#8377;10 for a 1 in 10 chance of &#8377;100? The expected value is zero, a fair bet. Would you pay
          &#8377;10 lakh for a 1 in 10 chance of &#8377;1 crore? The expected value is again zero, but most people would
          refuse, because losing &#8377;10 lakh would hurt far more than winning &#8377;1 crore would help. Expected value
          describes the long run; a person facing one large bet may care about the risk as well. Deciding well under
          uncertainty, for people and for AI systems, starts from expected value and then asks what else matters.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "spinner",
      rung: "check",
      prompt: (
        <p>
          A spinner gives 10 points with probability 0.2, 5 points with probability 0.5 and 0 points otherwise. What is the
          expected number of points?
        </p>
      ),
      answer: { kind: "numeric", value: 4.5 },
    },
    {
      key: "fair-price",
      rung: "check",
      prompt: <p>A game pays &#8377;50 with probability 0.1 and nothing otherwise. What price to play makes it fair?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "linear",
      rung: "apply",
      prompt: <p>If <M>{"E[X] = 4"}</M>, what is <M>{"E[3X - 7]"}</M>?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "heads",
      rung: "apply",
      prompt: <p>A fair coin is tossed 20 times. What is the expected number of heads?</p>,
      answer: { kind: "numeric", value: 10 },
    },
    {
      key: "insurance",
      rung: "apply",
      prompt: (
        <p>
          An insurer charges &#8377;2,000 a year to cover a phone. In a year, 3% of phones are lost, costing the insurer
          &#8377;40,000 each, and 10% are damaged, costing &#8377;5,000 each. What is the insurer&rsquo;s expected profit per
          customer per year, in rupees?
        </p>
      ),
      answer: { kind: "numeric", value: 300 },
    },
    {
      key: "indicator",
      rung: "prove",
      prompt: (
        <p>
          Use linearity to prove that the expected number of sixes in <M>n</M> rolls of a fair die is{" "}
          <M>{"\\tfrac{n}{6}"}</M>. Define the random variables you use.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Defines Sᵢ = 1 if roll i is a six and 0 otherwise, for i = 1, …, n.",
          "Computes E[Sᵢ] = 1·(1/6) + 0·(5/6) = 1/6.",
          "Writes the number of sixes as S₁ + ⋯ + Sₙ and applies linearity of expectation.",
          "Concludes the expectation is n/6.",
        ],
      },
    },
    {
      key: "first-six",
      rung: "stretch",
      prompt: (
        <p>
          You roll a die until the first six appears. Let <M>m</M> be the expected number of rolls. The first roll is a six
          with probability <M>{"\\tfrac16"}</M>; otherwise you have used one roll and are back where you started. Write an
          equation for <M>m</M> and solve it.
        </p>
      ),
      answer: { kind: "numeric", value: 6 },
    },
  ],

  teachBack:
    "Explain to a friend what the expected value of a game means, using a die game, and why the expected value can be a number the game can never actually pay.",

  glimpse: (
    <p>
      This completes the Foundations of School Mathematics. In Probability, expected value and its linearity are among the
      most used tools of all, and the law of large numbers proves that running averages settle where this lesson said they
      would. In machine learning, training a model means making its expected loss small, and in Causality and Decision
      Theory you will ask what a rational agent should maximise when the expected value is not enough.
    </p>
  ),
};
