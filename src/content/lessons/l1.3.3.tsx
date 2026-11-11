import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { ConfusionViz } from "@/components/viz/ConfusionViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.3.3",
  minutes: 45,
  links: {
    revisits: ["l1.3.1", "l1.1.1"],
    parallels: ["m7.1.3", "m7.1.4"],
    foreshadows: ["l1.7.3", "l2.1.4"],
  },

  puzzle: (
    <>
      <p>
        A test for a rare disease is advertised as &ldquo;99% accurate&rdquo;. One person in a hundred has the disease.
      </p>
      <p>
        Describe a &ldquo;test&rdquo; that takes no measurement at all and still achieves 99% accuracy. What does this tell
        you about accuracy as a measure? What would you want to know instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Declaring everyone healthy is right 99% of the time and catches no one. Accuracy blends two very different kinds of
        mistake, missing a sick person and alarming a healthy one, and with a rare class it can hide total failure. The
        remedy is to count each kind of outcome separately, in a <strong>confusion matrix</strong>.
      </p>
      <ConfusionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="confusion matrix">
        <p>
          For a binary classifier with one class called positive, each example falls in one of four cells:
        </p>
        <ul>
          <li><strong>true positive</strong> (TP): positive, predicted positive;</li>
          <li><strong>false negative</strong> (FN): positive, predicted negative, a miss;</li>
          <li><strong>false positive</strong> (FP): negative, predicted positive, a false alarm;</li>
          <li><strong>true negative</strong> (TN): negative, predicted negative.</li>
        </ul>
        <p>The four counts add up to the number of examples, and</p>
        <MD>{"\\text{accuracy} = \\frac{TP + TN}{TP + FN + FP + TN}."}</MD>
      </Definition>

      <Definition title="class imbalance">
        <p>
          When one class is much rarer than the other, the data are <strong>imbalanced</strong>. The baseline of always
          predicting the commoner class then has high accuracy, equal to that class&rsquo;s share, and any model must be
          compared with it. Rare classes are usually the ones that matter: fraud, disease, defects.
        </p>
      </Definition>

      <Example title="a screening test">
        <p>
          Among 1,000 people, 10 are sick. A model flags 30 people, 8 of whom are sick. Then TP = 8, FN = 2, FP = 22 and TN
          = 968. Accuracy is <M>{"976/1000 = 97.6\\%"}</M>, below the 99% of saying &ldquo;healthy&rdquo; to everyone. Yet
          the model finds 8 of the 10 sick people, which the baseline never does, at the cost of 22 false alarms that further
          tests can clear up.
        </p>
      </Example>

      <Remark title="mistakes have different costs">
        <p>
          A missed cancer and a false alarm do not cost the same. The threshold of a probabilistic classifier lets you trade
          one kind of mistake for the other, and the right setting depends on their costs, which is a decision about the
          world, not about the model. With costs <M>{"c_{FN}"}</M> and <M>{"c_{FP}"}</M> and well-calibrated probabilities,
          the cheapest rule predicts positive when the probability exceeds{" "}
          <M>{"c_{FP} / (c_{FP} + c_{FN})"}</M>: the costlier a miss, the lower the threshold.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "fn",
      rung: "check",
      prompt: <p>A sick person whom the model declares healthy is a:</p>,
      answer: { kind: "choice", options: ["False negative", "False positive", "True negative"], correct: [0] },
    },
    {
      key: "baseline",
      rung: "check",
      prompt: <p>1% of cases are positive. What accuracy does always predicting negative achieve?</p>,
      answer: { kind: "choice", options: ["99%", "50%", "1%"], correct: [0] },
    },
    {
      key: "acc",
      rung: "apply",
      prompt: <p>A classifier has TP = 40, FN = 10, FP = 30 and TN = 920. What is its accuracy, as a percentage?</p>,
      answer: { kind: "numeric", value: 96 },
    },
    {
      key: "tn",
      rung: "apply",
      prompt: <p>Among 1,000 people, 10 are sick. A model flags 30 people, 8 of them sick. How many true negatives are there?</p>,
      answer: { kind: "numeric", value: 968 },
    },
    {
      key: "threshold",
      rung: "apply",
      prompt: <p>Missing a case is far worse than a false alarm. Which way should the threshold move?</p>,
      answer: { kind: "choice", options: ["Lower, to flag more cases", "Higher, to flag fewer cases", "It should stay at 0.5"], correct: [0] },
    },
    {
      key: "explain",
      rung: "prove",
      prompt: (
        <p>
          A fraud model has 99.5% accuracy on data where 0.5% of transactions are fraudulent. Explain why this number alone
          tells you almost nothing, and say what you would report instead.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that predicting 'not fraud' for everything also gives 99.5% accuracy.",
          "Explains that accuracy is dominated by the common class and can hide catching no fraud at all.",
          "Proposes reporting the confusion matrix, or the fraction of frauds caught and the number of false alarms.",
          "Mentions comparing against the majority-class baseline and considering the costs of each kind of error.",
        ],
      },
    },
    {
      key: "cost",
      rung: "stretch",
      prompt: <p>A false alarm costs &#8377;100 and a miss costs &#8377;900. By the lesson&rsquo;s rule, above what probability should the model predict positive?</p>,
      answer: { kind: "numeric", value: 0.1 },
    },
  ],

  teachBack:
    "Explain to a friend the four cells of a confusion matrix, why accuracy misleads when one class is rare, and how the costs of mistakes should set the threshold.",

  glimpse: (
    <p>
      Next, precision, recall and the ROC curve, which summarise the confusion matrix in more useful ways. Baselines return
      in the last chapter, and Statistical Machine Learning derives the cost-based threshold from decision theory.
    </p>
  ),
};
