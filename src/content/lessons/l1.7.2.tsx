import { M } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { LeakageViz } from "@/components/viz/LeakageViz";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l1.7.2",
  minutes: 45,
  links: {
    requires: ["l1.1.4", "l1.5.2"],
    revisits: ["l1.7.1"],
    parallels: ["m4.6.2"],
    foreshadows: ["l1.7.3"],
  },

  puzzle: (
    <>
      <p>
        A team reports a model that predicts hospital readmission with 99% accuracy. Its most important feature turns out to be
        &ldquo;number of days of follow-up care billed&rdquo;.
      </p>
      <p>
        Why might that feature be so predictive? Would the model work on the day a patient is discharged, when it is actually
        needed?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Follow-up care is billed after the outcome is already known, and mostly for patients who came back. The feature smuggles
        the answer into the input. At discharge it is not yet available, so the model that looked brilliant would be useless.
        This is <strong>leakage</strong>: information reaching the model during training or evaluation that it will not have
        when it is used.
      </p>
      <p>
        Leakage rarely announces itself. It shows up as results that are too good, and it is found by asking of every feature
        and every processing step: would this exist, computed this way, at the moment of prediction?
      </p>
      <LeakageViz />
    </>
  ),

  theory: (
    <>
      <Definition title="leakage">
        <p>
          <strong>Leakage</strong> is any path by which information about the evaluation targets, or about the future, reaches
          the model or its design, so that measured performance overstates real performance.
        </p>
      </Definition>

      <Remark title="three common forms">
        <ul>
          <li>
            <strong>Target leakage</strong>: a feature recorded after, or because of, the outcome. Closure dates, billing
            codes, &ldquo;reason for refund&rdquo;.
          </li>
          <li>
            <strong>Train-test contamination</strong>: the same example or the same entity (patient, user, document) on both
            sides of the split, or a preprocessing step, such as a scaler or feature selection, fitted on all the data.
          </li>
          <li>
            <strong>Temporal leakage</strong>: training on data from after the time being predicted, typically by shuffling a
            time series.
          </li>
        </ul>
      </Remark>

      <Remark title="the rule that prevents it">
        <p>
          Simulate deployment. Split first, by the unit that will be new in use (time, patient, user), and then fit every step
          that learns from data, including scaling, imputation and feature selection, on the training part only. Libraries
          provide <strong>pipelines</strong> that bundle these steps with the model, so that cross-validation refits all of
          them inside each fold.
        </p>
      </Remark>

      <Example title="selection on noise">
        <p>
          Take 1,000 features of pure noise and test each for correlation with the label at the 5% level. About{" "}
          <M>{"1000 \\times 0.05 = 50"}</M> will pass by chance. Train on those 50 and cross-validate, and the scores look
          respectable, because the validation folds helped choose the features. Repeat the selection inside each fold and the
          scores fall to chance, as they should.
        </p>
      </Example>

      <Remark title="leakage at frontier scale">
        <p>
          Language models are pretrained on much of the public web, and benchmark questions are often on the web too. If test
          questions appear in the training data, a high score may reflect memory rather than ability. This{" "}
          <strong>benchmark contamination</strong> is leakage on a huge scale, and careful evaluations check for it by searching
          the training data for overlaps and by writing fresh, private test questions.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "target",
      rung: "check",
      prompt: <p>Which of these features would be target leakage in a model predicting, at the time of application, whether a loan will default?</p>,
      answer: { kind: "choice", options: ["Number of missed repayments", "Applicant's income at application", "Length of credit history at application"], correct: [0] },
    },
    {
      key: "group",
      rung: "check",
      prompt: <p>A dataset has several photos per patient. How should it be split?</p>,
      answer: { kind: "choice", options: ["By patient, so each patient's photos are all on one side", "By photo, at random", "By file size"], correct: [0] },
    },
    {
      key: "noise",
      rung: "apply",
      prompt: <p>You test 1,000 pure-noise features at the 5% significance level. How many do you expect to pass by chance?</p>,
      answer: { kind: "numeric", value: 50 },
    },
    {
      key: "twin",
      rung: "apply",
      prompt: <p>A dataset contains pairs of exact duplicates and is split at random, 80% to training and 20% to test. For a duplicated row that lands in the test set, what is the probability, roughly, that its twin is in training?</p>,
      answer: { kind: "numeric", value: 0.8, tolerance: 0.01 },
    },
    {
      key: "contam",
      rung: "apply",
      prompt: <p>A benchmark has 500 questions; 60 appear verbatim in a model&rsquo;s training data. It answers 90% of those correctly and 70% of the other 440. What overall percentage does it report?</p>,
      answer: { kind: "numeric", value: 72.4 },
    },
    {
      key: "pipeline",
      rung: "prove",
      prompt: (
        <p>
          A colleague standardises all the data and selects the 20 best features using all the labels, then runs 5-fold
          cross-validation. Explain precisely how information leaks into each validation fold, which step leaks more, and how to
          restructure the procedure.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes the scaler's mean and standard deviation include the validation fold's values, a mild leak of input information.",
          "Notes feature selection used the validation fold's labels, so features were chosen partly for fitting those labels, a severe leak.",
          "Explains this makes the cross-validation score optimistic, possibly far above chance even on pure noise.",
          "Prescribes fitting the scaler and the selection inside each training fold, for example with a pipeline, and applying them unchanged to the held-out fold.",
        ],
      },
    },
    {
      key: "anyone",
      rung: "stretch",
      prompt: <p>With 50 independent pure-noise features, what is the probability that at least one passes a test at the 5% level? Give three decimal places.</p>,
      answer: { kind: "numeric", value: 0.923, tolerance: 0.0006 },
    },
  ],

  teachBack:
    "Explain to a friend what leakage is, give one example each of target leakage, contamination and temporal leakage, and state the rule that prevents all three.",

  glimpse: (
    <p>
      Next, baselines: the simple predictors every model must beat before its score means anything. Evaluation and the Science of
      Deep Learning treats benchmark contamination and its detection in depth.
    </p>
  ),
};
