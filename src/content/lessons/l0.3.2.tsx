import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { KnnViz } from "@/components/viz/KnnViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.3.2",
  minutes: 45,
  links: {
    parallels: ["m0.6.2"],
    foreshadows: ["l1.4.1", "l1.4.2"],
  },

  puzzle: (
    <>
      <p>
        A friend asks whether they will enjoy a film you have not seen. You know nothing about the film except that it is
        an action comedy with a little romance.
      </p>
      <p>
        You know which of your friend&rsquo;s past films they liked. How would you guess, and how many past films would
        you base the guess on: just the single most similar one, or several?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The natural answer is to think of films like this one and remember whether your friend liked them. If the most
        similar films were hits, it will probably be a hit too. That is the whole of the method: no formula, no parameters,
        just the stored examples and a way of measuring similarity.
      </p>
      <p>
        Below, each film is placed by two scores, action and romance, so similar films are close together. Move the new film
        around, and change how many neighbours get a vote.
      </p>
      <KnnViz />
      <p>
        With <em>k</em> = 1 the answer can flip because of a single odd film close by. With <em>k</em> = 7 the vote is
        steadier, but a film on the edge of the liked group can be outvoted by films that are not very similar to it at all.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="k nearest neighbours">
        <p>
          To predict the label of a new input with <strong>k nearest neighbours</strong>: find the <em>k</em> training
          examples closest to it, and take a majority vote of their labels (for classification) or the mean of their labels
          (for regression).
        </p>
      </Definition>

      <Definition title="distance">
        <p>
          &ldquo;Closest&rdquo; needs a distance. With two features, the usual choice is the straight-line distance from the
          lesson on coordinates:
        </p>
        <MD>{"d = \\sqrt{(a_1 - b_1)^2 + (a_2 - b_2)^2},"}</MD>
        <p>and with more features, the same formula with one squared difference per feature.</p>
      </Definition>

      <Example title="a vote by hand">
        <p>
          A new film scores (5, 5). Its three nearest neighbours are at (4.2, 5.4), liked, distance about 0.9; (3.6, 4.2),
          not liked, distance about 1.6; and (6, 6.8), liked, distance about 2.1. Two of three were liked, so the prediction
          is &ldquo;will like it&rdquo;.
        </p>
      </Example>

      <p>
        Nearest neighbours does no work at training time: it just stores the data. All the work happens when a question
        arrives, which makes it slow on large data, since every prediction compares the new input with every stored example.
        It is still one of the most useful baselines in machine learning, because it is simple and assumes almost nothing.
      </p>

      <Remark title="the features decide what similar means">
        <p>
          If one feature is measured in metres and another in millimetres, the second dominates every distance and the first
          is effectively ignored. So features are usually rescaled to comparable ranges first. More deeply, nearest
          neighbours is only as good as its notion of similarity. Much of modern deep learning can be seen as learning
          features in which similar things really are close together.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "dist",
      rung: "check",
      prompt: <p>What is the distance between the points (1, 2) and (4, 6)?</p>,
      answer: { kind: "numeric", value: 5 },
    },
    {
      key: "vote",
      rung: "check",
      prompt: <p>The five nearest neighbours of a new email are labelled spam, fine, spam, spam, fine. With <M>{"k = 5"}</M>, what is the prediction?</p>,
      answer: { kind: "choice", options: ["Spam", "Fine"], correct: [0] },
    },
    {
      key: "reg",
      rung: "apply",
      prompt: <p>For regression, the three nearest houses sold for 40, 46 and 49 lakh rupees. What does 3-nearest-neighbours predict?</p>,
      answer: { kind: "numeric", value: 45 },
    },
    {
      key: "flip",
      rung: "apply",
      prompt: (
        <p>
          A new point has neighbours, from nearest outwards, labelled A, B, B, A, A. Which values of <M>k</M> predict A?
        </p>
      ),
      answer: { kind: "choice", options: ["k = 1", "k = 3", "k = 5"], correct: [0, 2] },
    },
    {
      key: "scale",
      rung: "apply",
      prompt: (
        <p>
          Houses are described by area in square metres (around 50 to 150) and number of bedrooms (1 to 4). Without rescaling,
          which feature will mostly decide who the nearest neighbours are?
        </p>
      ),
      answer: { kind: "choice", options: ["Area", "Bedrooms", "Both equally"], correct: [0] },
    },
    {
      key: "k-extremes",
      rung: "prove",
      prompt: (
        <p>
          Explain what goes wrong with nearest neighbours at the two extremes: <M>{"k = 1"}</M>, and <M>k</M> equal to the
          whole training set. Relate each to overfitting or underfitting.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "With k = 1, every prediction copies a single example, so noisy or mislabelled points flip predictions near them: overfitting.",
          "With k equal to the whole training set, every input gets the same prediction, the overall majority or mean: underfitting.",
          "Concludes that a middle value of k balances the two, and should be chosen on data not used for training.",
        ],
      },
    },
    {
      key: "work",
      rung: "stretch",
      prompt: (
        <p>
          A nearest-neighbour model stores one million examples with 100 features each. Computing one distance takes about one
          subtraction, one multiplication and one addition per feature. Roughly how many million arithmetic operations does a
          single prediction need?
        </p>
      ),
      answer: { kind: "numeric", value: 300 },
    },
  ],

  teachBack:
    "Explain to a friend how to predict whether someone will like a film from the films most similar to it, and how the number of neighbours you consult changes the answer.",

  glimpse: (
    <p>
      Next, a model that asks a short series of questions: the decision tree. In Introduction to Machine Learning you will
      meet the curse of dimensionality, the surprising fact that with hundreds of features, almost every point is far from
      almost every other, which makes &ldquo;nearest&rdquo; much harder to trust.
    </p>
  ),
};
