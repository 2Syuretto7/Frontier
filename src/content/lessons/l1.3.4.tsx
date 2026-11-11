import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { RocViz } from "@/components/viz/RocViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.3.4",
  minutes: 55,
  links: {
    revisits: ["l1.3.3"],
    parallels: ["m7.1.4"],
    foreshadows: ["l2.8.2", "l10.2.1"],
  },

  puzzle: (
    <>
      <p>
        A search engine returns 20 results for your query; 15 of them are relevant. But there were 60 relevant pages on the
        web, and it found only 15.
      </p>
      <p>
        Was this a good search? Describe two different numbers that capture the two different ways it could be better, and
        explain why improving one tends to hurt the other.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Of what it returned, 75% were relevant: that is its <strong>precision</strong>. Of what it should have returned, it
        found 25%: that is its <strong>recall</strong>. Returning more pages finds more of the relevant ones but lets in more
        junk. A classifier faces the same trade-off at every threshold.
      </p>
      <p>
        The ROC curve shows all thresholds at once. Slide the threshold and watch the point travel along the curve, then
        change how well the scores separate the classes.
      </p>
      <RocViz />
    </>
  ),

  theory: (
    <>
      <Definition title="precision and recall">
        <MD>{"\\text{precision} = \\frac{TP}{TP + FP}, \\qquad \\text{recall} = \\frac{TP}{TP + FN}."}</MD>
        <p>
          Precision is the fraction of positive predictions that are right; recall, also called the{" "}
          <strong>true positive rate</strong> or sensitivity, is the fraction of actual positives that are found. Their
          harmonic mean is the <strong>F1 score</strong>:
        </p>
        <MD>{"F_1 = \\frac{2 \\cdot \\text{precision} \\cdot \\text{recall}}{\\text{precision} + \\text{recall}}."}</MD>
      </Definition>

      <Definition title="ROC curve and AUC">
        <p>
          The <strong>false positive rate</strong> is <M>{"FP/(FP + TN)"}</M>, the fraction of negatives wrongly flagged.
          The <strong>ROC curve</strong> plots recall against the false positive rate as the threshold sweeps from high to
          low, from <M>{"(0, 0)"}</M> to <M>{"(1, 1)"}</M>. The <strong>area under the curve</strong> (AUC) summarises it:
          it equals the probability that a randomly chosen positive gets a higher score than a randomly chosen negative.
          Random scores give 0.5, perfect ones 1.
        </p>
      </Definition>

      <Example title="the screening test again">
        <p>
          With TP = 8, FN = 2, FP = 22, TN = 968: precision is <M>{"8/30 \\approx 0.27"}</M>, recall{" "}
          <M>{"8/10 = 0.8"}</M>, F1 <M>{"= 2(0.27)(0.8)/(1.07) \\approx 0.40"}</M>, and the false positive rate is{" "}
          <M>{"22/990 \\approx 0.022"}</M>. Most flagged people are healthy, yet most sick people are found.
        </p>
      </Example>

      <Example title="AUC by counting pairs">
        <p>
          Two positives score 0.9 and 0.6; three negatives score 0.7, 0.3 and 0.2. Of the six positive&ndash;negative pairs,
          the positive scores higher in five (only 0.6 against 0.7 fails), so AUC <M>{"= 5/6 \\approx 0.83"}</M>.
        </p>
      </Example>

      <Remark title="which summary to use">
        <p>
          ROC curves ignore how rare the positive class is, which makes them comparable across datasets but can flatter a
          model when positives are very rare: a tiny false positive rate on a million negatives is still many false alarms.
          Then a curve of precision against recall is more revealing. And every one of these numbers, measured on a finite
          test set, carries random error; Evaluation and the Science of Deep Learning shows how to put error bars on them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "def",
      rung: "check",
      prompt: <p>Recall is the fraction of:</p>,
      answer: { kind: "choice", options: ["Actual positives that the model finds", "Positive predictions that are correct", "All predictions that are correct"], correct: [0] },
    },
    {
      key: "random",
      rung: "check",
      prompt: <p>What is the AUC of a classifier whose scores are random?</p>,
      answer: { kind: "numeric", value: 0.5 },
    },
    {
      key: "prec",
      rung: "apply",
      prompt: <p>A search returns 20 pages, 15 of them relevant, out of 60 relevant pages in all. What is its precision?</p>,
      answer: { kind: "numeric", value: 0.75 },
    },
    {
      key: "rec",
      rung: "apply",
      prompt: <p>For the same search, what is its recall?</p>,
      answer: { kind: "numeric", value: 0.25 },
    },
    {
      key: "f1",
      rung: "apply",
      prompt: <p>What is the F1 score for precision 0.75 and recall 0.25? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.375 },
    },
    {
      key: "tradeoff",
      rung: "prove",
      prompt: (
        <p>
          Explain why lowering a classifier&rsquo;s threshold can never decrease its recall, and why it usually decreases its
          precision. Describe a situation where you would prefer high recall and one where you would prefer high precision.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that lowering the threshold only adds positive predictions, so true positives cannot fall while the number of actual positives is fixed; hence recall cannot decrease.",
          "Explains that the newly added predictions have lower scores and are more often negatives, so precision usually falls.",
          "Gives a high-recall situation, such as screening for a serious disease where misses are costly.",
          "Gives a high-precision situation, such as a spam filter where wrongly blocking real mail is costly.",
        ],
      },
    },
    {
      key: "auc",
      rung: "stretch",
      prompt: <p>Positives score 0.8, 0.5 and 0.4; negatives score 0.6, 0.3. What is the AUC, computed by counting pairs? Give two decimal places.</p>,
      answer: { kind: "numeric", value: 0.67, tolerance: 0.01 },
    },
  ],

  teachBack:
    "Explain to a friend what precision and recall measure, why they trade off against each other, and what the ROC curve and its area tell you.",

  glimpse: (
    <p>
      This completes Classification. Next, two classifiers that are not linear at all: nearest neighbours and decision trees.
      Statistical Machine Learning asks whether predicted probabilities can be trusted, which is calibration, and Evaluation
      and the Science of Deep Learning puts error bars on every metric here.
    </p>
  ),
};
