import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { BoundaryViz } from "@/components/viz/BoundaryViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.2.1",
  minutes: 45,
  links: {
    foreshadows: ["l1.3.1", "l1.3.2", "l1.3.3"],
  },

  puzzle: (
    <>
      <p>
        A test for a rare disease is right 99% of the time on people who have it, and 99% of the time on people who do not.
        One person in a thousand has the disease.
      </p>
      <p>
        A lazy rival &ldquo;test&rdquo; simply says &ldquo;healthy&rdquo; to everyone. Which one has the higher
        accuracy? Which would you want your doctor to use?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The lazy test is right for 999 people in every 1,000: accuracy 99.9%. The real test, on 1,000 people, catches the
        one sick person (most of the time) but also wrongly flags about 10 healthy people: accuracy about 99%. By accuracy
        alone, the useless test wins. Classification is about putting things into categories, and how you count the
        mistakes matters as much as how many you make.
      </p>
      <p>
        Most classifiers work by drawing a boundary. Each example is described by a few numbers, so it is a point in space,
        and the classifier splits the space into regions, one per category. Turn and slide the line below to separate two
        kinds of fruit.
      </p>
      <BoundaryViz />
      <p>
        The best line gets 17 of 18. One circle lies on the wrong side of every possible line: real data are rarely
        perfectly separable, and a classifier must decide which mistakes to accept.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="classification">
        <p>
          In <strong>classification</strong>, the label is one of a fixed set of categories, called{" "}
          <strong>classes</strong>. With two classes it is <em>binary</em> classification (spam or not, disease or not);
          with more, <em>multi-class</em> (which of ten digits, which of a thousand objects).
        </p>
      </Definition>

      <Definition title="decision boundary">
        <p>
          A classifier divides the space of inputs into regions, each assigned to one class. The border between regions is
          the <strong>decision boundary</strong>. A <strong>linear classifier</strong> uses a straight line in two
          dimensions, a flat plane in three, and a flat <em>hyperplane</em> in more.
        </p>
      </Definition>

      <Definition title="accuracy and its two kinds of mistake">
        <p>
          <strong>Accuracy</strong> is the fraction of examples classified correctly. In binary classification, call one
          class &ldquo;positive&rdquo;. A <strong>false positive</strong> is a negative example classified as positive (a
          healthy person told they are ill); a <strong>false negative</strong> is a positive example classified as negative
          (a sick person sent home).
        </p>
      </Definition>

      <Example title="the puzzle, counted">
        <p>
          In 100,000 people, 100 are sick and 99,900 are healthy. The real test catches 99 of the sick (1 false negative)
          and wrongly flags 999 of the healthy (999 false positives): 1,000 mistakes, accuracy 99%. The lazy test misses
          all 100 sick people and makes no other mistake: accuracy 99.9%. It has the better accuracy and is worthless.
        </p>
      </Example>

      <Remark title="the cost of each mistake">
        <p>
          A spam filter that hides a real message from your bank does more harm than one that lets an advert through. A
          cancer screen that misses a tumour does more harm than one that orders an unnecessary second scan. When classes
          are rare, or mistakes have unequal costs, accuracy misleads. Good practice counts each kind of mistake separately,
          and many classifiers let you slide the boundary to trade one kind for the other.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "is-class",
      rung: "check",
      prompt: <p>Select every task that is classification.</p>,
      answer: {
        kind: "choice",
        options: [
          "Deciding which of 50 bird species is in a photograph",
          "Predicting tomorrow's temperature in degrees",
          "Flagging a card payment as fraud or not fraud",
          "Predicting the price a house will sell for",
        ],
        correct: [0, 2],
      },
    },
    {
      key: "fp",
      rung: "check",
      prompt: <p>A smoke alarm goes off when someone makes toast and there is no fire. Treating &ldquo;fire&rdquo; as positive, what kind of mistake is this?</p>,
      answer: { kind: "choice", options: ["False positive", "False negative"], correct: [0] },
    },
    {
      key: "acc",
      rung: "apply",
      prompt: <p>A classifier makes 12 false positives and 8 false negatives on 400 test examples. What is its accuracy, as a percentage?</p>,
      answer: { kind: "numeric", value: 95 },
    },
    {
      key: "lazy",
      rung: "apply",
      prompt: <p>2% of card payments are fraud. What accuracy, as a percentage, does a classifier get by calling every payment genuine?</p>,
      answer: { kind: "numeric", value: 98 },
    },
    {
      key: "cost",
      rung: "apply",
      prompt: <p>For a test that screens blood donations for a dangerous virus (positive means infected), which mistake is worse?</p>,
      answer: {
        kind: "choice",
        options: ["A false positive: a safe donation is thrown away", "A false negative: an infected donation is used"],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`scores = {"cat": 2.1, "dog": 3.4, "fox": 0.7}
print(max(scores, key=scores.get))`}</Code>
          <p>A classifier outputs a score per class and predicts the highest. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["dog", "cat", "fox", "3.4"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>accuracy(ys, preds)</C> and <C>majority_baseline(train_ys, test_ys)</C>, the accuracy on the test labels of always predicting the most common training label. Every classifier should beat this baseline.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def accuracy(ys, preds):
    return 1.0

def majority_baseline(train_ys, test_ys):
    return 1.0
`,
        solution: `from collections import Counter

def accuracy(ys, preds):
    return sum(y == p for y, p in zip(ys, preds)) / len(ys)

def majority_baseline(train_ys, test_ys):
    top = Counter(train_ys).most_common(1)[0][0]
    return accuracy(test_ys, [top] * len(test_ys))
`,
        tests: [
          { name: "accuracy", code: `assert accuracy(['a', 'b', 'a', 'a'], ['a', 'a', 'a', 'b']) == 0.5, 'Two of four are right.'` },
          { name: "baseline", code: `assert majority_baseline(['spam', 'ham', 'ham', 'ham'], ['ham', 'spam', 'ham', 'ham', 'ham']) == 0.8, 'Always predicting ham gets 4 of 5 right.'` },
        ],
      },
    },
    {
      key: "explain",
      rung: "prove",
      prompt: (
        <p>
          Explain, with numbers, why a classifier with 99% accuracy can be worse than useless when one class is very rare.
          Then suggest a better way to report its performance.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Gives a concrete example where the rare class is about 1% or less, so always predicting the common class reaches about 99% accuracy.",
          "Explains that such a classifier never detects the rare class, which is usually the class we care about.",
          "Suggests reporting false positives and false negatives separately, or the share of positives caught and the share of alarms that are real.",
        ],
      },
    },
    {
      key: "real-alarms",
      rung: "stretch",
      prompt: (
        <p>
          In the puzzle, the real test flags a person as sick. Using the counts for 100,000 people, what is the chance, as a
          percentage to the nearest whole number, that this person really is sick?
        </p>
      ),
      answer: { kind: "numeric", value: 9, tolerance: 0.06 },
    },
  ],

  teachBack:
    "Explain to a friend what a decision boundary is, using two kinds of fruit, and why a classifier with very high accuracy can still be useless.",

  glimpse: (
    <p>
      Next, regression, where the label is a number rather than a category. In Introduction to Machine Learning, logistic
      regression learns a linear boundary from data, and precision, recall and the confusion matrix give the careful way to
      count the mistakes this lesson warned about. The stretch question is Bayes&rsquo; rule in disguise, which you will
      meet properly in Probability.
    </p>
  ),
};
