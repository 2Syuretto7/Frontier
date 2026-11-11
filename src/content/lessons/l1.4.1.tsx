import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem } from "@/components/lesson/Blocks";
import { KnnRegionViz } from "@/components/viz/KnnRegionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.4.1",
  minutes: 45,
  links: {
    revisits: ["l0.3.2", "l1.1.3"],
    parallels: ["m3.1.2", "e2.5.3"],
    foreshadows: ["l1.4.2", "l1.7.1", "l1.5.2"],
  },

  puzzle: (
    <>
      <p>
        Two classes sit on a number line. Class A has points at 1 and 2; class B has points at 3.5, 4 and 5. A new point
        arrives at 2.6.
      </p>
      <p>
        If you copy the label of the single closest point, what do you predict? If you take a vote among the three closest
        points instead, does your answer change? Which rule would you trust more if one of the training labels might be wrong?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The simplest learner of all does no fitting. It keeps every training example and, when asked about a new point, looks
        up the <M>k</M> examples closest to it and lets them vote. Its whole assumption is that <em>nearby inputs have similar
        labels</em>.
      </p>
      <p>
        At 2.6 the nearest point is 2, so one neighbour says A. The three nearest are 2, 3.5 and 4, so the vote is B. One
        neighbour trusts a single example completely; three neighbours average away some of the noise.
      </p>
      <KnnRegionViz />
      <p>
        Slide <M>k</M> from 1 upwards. At <M>{"k = 1"}</M> the training accuracy is perfect and the boundary is ragged, which
        is overfitting in its purest form. Somewhere in the middle, accuracy on new points peaks. At very large <M>k</M>, the
        model ignores local shape and underfits. So <M>k</M> is a dial between memorising and over-smoothing.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="k-nearest neighbours">
        <p>
          Given training pairs <M>{"(x_1, y_1), \\dots, (x_n, y_n)"}</M> with <M>{"x_i \\in \\mathbb{R}^d"}</M>, a distance
          such as the Euclidean distance <M>{"\\lVert x - x_i \\rVert"}</M>, and a whole number <M>k</M>, let{" "}
          <M>{"N_k(x)"}</M> be the indices of the <M>k</M> training inputs closest to <M>x</M>.
        </p>
        <ul>
          <li>For <strong>classification</strong>, predict the most common label among <M>{"\\{y_i : i \\in N_k(x)\\}"}</M>.</li>
          <li>For <strong>regression</strong>, predict their average:</li>
        </ul>
        <MD>{"\\hat f(x) = \\frac{1}{k} \\sum_{i \\in N_k(x)} y_i."}</MD>
      </Definition>

      <Example title="a regression by hand">
        <p>
          Training pairs <M>{"(1, 10), (2, 14), (4, 20), (6, 30)"}</M> and a query at <M>{"x = 3"}</M>. The distances are 2,
          1, 1 and 3, so the three nearest are <M>{"x = 2, 4, 1"}</M>, and the prediction is{" "}
          <M>{"(14 + 20 + 10)/3 \\approx 14.67"}</M>.
        </p>
      </Example>

      <Remark title="choosing k">
        <p>
          With <M>{"k = 1"}</M> and distinct training inputs, each training point is its own nearest neighbour, so the training
          error is zero whatever the data. Training error therefore cannot choose <M>k</M>; a validation set or
          cross-validation must. For two classes, an odd <M>k</M> avoids tied votes.
        </p>
      </Remark>

      <Theorem title="Cover and Hart, 1967">
        <p>
          For two classes, as the number of training examples grows without limit, the error rate of the 1-nearest-neighbour
          rule approaches a value <M>{"R_1"}</M> satisfying
        </p>
        <MD>{"R^* \\le R_1 \\le 2R^*(1 - R^*),"}</MD>
        <p>
          where <M>{"R^*"}</M> is the error of the best possible classifier. So with enough data, copying the nearest example
          is at most about twice as bad as perfection. We state this without proof; it needs mild conditions on the
          distribution.
        </p>
      </Theorem>

      <Remark title="where the cost goes">
        <p>
          Nearest neighbours has no training step, but every prediction compares the query with all <M>n</M> stored points,
          costing about <M>{"nd"}</M> operations. Retrieval systems that look up millions of text embeddings use the same idea
          with approximate search structures, trading a little accuracy for great speed.
        </p>
      </Remark>

      <Remark title="distance depends on units">
        <p>
          If one feature is measured in rupees and another in metres, the rupees dominate every distance. Nearest neighbours
          is only as good as its notion of nearness, which is why features are usually rescaled first.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "k1train",
      rung: "check",
      prompt: <p>With <M>{"k = 1"}</M> and no two training inputs equal, what is the training accuracy of nearest neighbours?</p>,
      answer: { kind: "choice", options: ["100%", "About 50%", "It depends on the data"], correct: [0] },
    },
    {
      key: "bigk",
      rung: "check",
      prompt: <p>As <M>k</M> grows towards the size of the training set, what happens to the classifier?</p>,
      answer: { kind: "choice", options: ["It predicts the majority class almost everywhere", "It memorises every point", "It becomes a linear model"], correct: [0] },
    },
    {
      key: "vote1",
      rung: "apply",
      prompt: <p>Class A at 1 and 2; class B at 3.5, 4 and 5. With <M>{"k = 1"}</M>, what is predicted at <M>{"x = 2.6"}</M>?</p>,
      answer: { kind: "choice", options: ["A", "B"], correct: [0] },
    },
    {
      key: "vote3",
      rung: "apply",
      prompt: <p>With the same data and <M>{"k = 3"}</M>, what is predicted at <M>{"x = 2.6"}</M>?</p>,
      answer: { kind: "choice", options: ["A", "B"], correct: [1] },
    },
    {
      key: "reg",
      rung: "apply",
      prompt: <p>Training pairs <M>{"(1, 10), (2, 14), (4, 20), (6, 30)"}</M>. What does 3-nearest-neighbour regression predict at <M>{"x = 3"}</M>? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 44 / 3, tolerance: 0.0004 },
    },
    {
      key: "zero",
      rung: "prove",
      prompt: (
        <p>
          Prove that 1-nearest-neighbour has zero training error when the training inputs are distinct. Then explain why this
          says nothing about its error on new data, using a dataset whose labels are pure coin flips.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Observes that a training point has distance 0 to itself and positive distance to every other training point, so it is its own nearest neighbour.",
          "Concludes that its prediction is its own label, so every training point is classified correctly.",
          "Takes labels independent of the inputs, such as fair coin flips, so no rule can beat 50% on new points.",
          "Concludes that zero training error can coexist with 50% test error, so training error cannot judge k.",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: <p>A brute-force nearest-neighbour search compares the query with each of one million stored points in 100 dimensions, doing one subtraction per coordinate. How many subtractions is that per query?</p>,
      answer: { kind: "numeric", value: 1e8 },
    },
  ],

  teachBack:
    "Explain to a friend how k-nearest neighbours predicts, why k = 1 always fits the training data perfectly, and how you would choose k.",

  glimpse: (
    <p>
      Next, why nearness itself starts to fail as the number of features grows. Statistical Machine Learning&rsquo;s Gaussian
      processes turn the nearest-neighbour idea into a smooth, probabilistic weighting of every training point, and
      Data Structures and Algorithms shows how to find the top <M>k</M> of a million distances without sorting them all.
    </p>
  ),
};
