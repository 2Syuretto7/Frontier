import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { OverfitViz } from "@/components/viz/OverfitViz";
import { C, Code } from "@/components/lesson/Code";
import type { LessonContent } from "@/lib/types";

export const lesson: LessonContent = {
  id: "l0.1.3",
  minutes: 50,
  links: {
    foreshadows: ["l1.1.2", "l1.1.3", "l1.1.4", "l1.5.1"],
  },

  puzzle: (
    <>
      <p>
        Two students prepare for an exam using last year&rsquo;s paper. Asha works through every question until she
        understands why each answer is right. Ben memorises every answer, word for word, and can recite the whole paper
        perfectly.
      </p>
      <p>
        On last year&rsquo;s paper, Ben would score higher. Who do you expect to do better on this year&rsquo;s paper,
        and how could you have predicted that before the exam?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Ben&rsquo;s perfect score on last year&rsquo;s paper tells you nothing about this year&rsquo;s, because he could
        have learnt nothing except the paper itself. To find out what either student really knows, you must test them on
        questions they have not seen.
      </p>
      <p>
        Models face exactly the same trap. Below, ten training points (filled) come from a smooth pattern plus noise. Ten
        more points (hollow) come from the same pattern but were kept aside. Raise the degree of the polynomial, giving the
        model more freedom, and watch both errors.
      </p>
      <OverfitViz />
      <p>
        At degree 9 the curve passes through every training point exactly, and its training error is zero. It is Ben. On
        the new points it is wildly wrong, because it has fitted the noise as well as the pattern. At degree 3 or 4 the
        model is Asha: a little error on the training points, but much less on new ones.
      </p>
    </>
  ),

  theory: (
    <>
      <Definition title="generalisation">
        <p>
          A model <strong>generalises</strong> when it performs well on new examples drawn from the same source as its
          training data. Generalisation, not a low training loss, is the goal of machine learning.
        </p>
      </Definition>

      <Definition title="training and test data">
        <p>
          Before training, split the examples into a <strong>training set</strong>, used to fit the model, and a{" "}
          <strong>test set</strong>, locked away and used only once, at the end, to estimate how the model will do on new
          data. The error on the test set is the <strong>test error</strong>.
        </p>
      </Definition>

      <Definition title="overfitting and underfitting">
        <ul>
          <li>
            A model <strong>overfits</strong> when it fits the training data, noise included, so closely that it does worse
            on new data. Training error low, test error high.
          </li>
          <li>
            A model <strong>underfits</strong> when it is too simple to capture the pattern at all. Training and test error
            both high.
          </li>
        </ul>
      </Definition>

      <p>
        The pattern in the visualisation is typical. As a model becomes more flexible, its training error keeps falling.
        Its test error falls at first, as the model captures more of the real pattern, then rises again, as it starts to
        capture noise. The best model sits near the bottom of the test error curve.
      </p>

      <Example title="memorising is easy">
        <p>
          A model that stores every training example in a table, and answers by looking the input up, has zero training
          error. Asked about any input not in its table, it has nothing useful to say. Memorising is the cheapest way to fit
          training data, which is exactly why fitting training data proves so little.
        </p>
      </Example>

      <Remark title="peeking spoils the test">
        <p>
          A test set only measures generalisation if it played no part in building the model. If you try fifty models and
          keep the one with the best test score, the test set has been used to choose, and the winning score is too
          optimistic: some of its advantage is luck on those particular test points. That is why careful practice holds back
          a third set, the validation set, for choosing, and opens the test set only once.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "which",
      rung: "check",
      prompt: <p>A model has training error 0.01 and test error 0.85. What is most likely happening?</p>,
      answer: { kind: "choice", options: ["Underfitting", "Overfitting", "It generalises well"], correct: [1] },
    },
    {
      key: "under",
      rung: "check",
      prompt: <p>A model has training error 0.60 and test error 0.62, while a slightly more flexible model gets 0.20 and 0.23. What was the first model doing?</p>,
      answer: { kind: "choice", options: ["Underfitting", "Overfitting", "Memorising"], correct: [0] },
    },
    {
      key: "degree",
      rung: "apply",
      prompt: <p>In the visualisation, which degree gives the smallest error on the new points?</p>,
      answer: { kind: "numeric", value: 3 },
    },
    {
      key: "split",
      rung: "apply",
      prompt: <p>You have 5,000 labelled examples and keep 20% as a test set. How many examples are left for training?</p>,
      answer: { kind: "numeric", value: 4000 },
    },
    {
      key: "leak",
      rung: "apply",
      prompt: <p>Select every practice that makes a test score untrustworthy.</p>,
      answer: {
        kind: "choice",
        options: [
          "Choosing between twenty models by their test score, then reporting the winner's test score",
          "Accidentally including some test examples in the training data",
          "Splitting the data at random before looking at it",
          "Evaluating on the test set once, after all choices are made",
        ],
        correct: [0, 1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train = [2, 4, 6]    # inputs seen in training; each label is twice the input
x = 5                # a new input
rule = 2 * x         # a model that learned "double it"
print(rule, x in train)`}</Code>
          <p>A memoriser can only answer for inputs it has seen; a learned rule answers for any input. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["10 False", "10 True", "5 False", "False 10"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train_errors = [0, 0, 0, 0]    # a memoriser is perfect on what it has seen
test_errors = [3, 1, 4, 2]     # but not on new inputs
print(sum(train_errors) / len(train_errors), sum(test_errors) / len(test_errors))`}</Code>
          <p>Training error against error on held-out data. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["0.0 2.5", "0 2.5", "0.0 10", "2.5 0.0"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Generalisation is measured on data held back from training. Write <C>train_part(xs, frac)</C>, the first <C>round(frac * len(xs))</C> items of xs, and <C>test_part(xs, frac)</C>, the rest. For example, with xs = [5, 1, 4, 2, 3] and frac = 0.6, the training part is [5, 1, 4] and the test part is [2, 3].
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def train_part(xs, frac):
    return xs

def test_part(xs, frac):
    return []
`,
        solution: `def train_part(xs, frac):
    return xs[:round(frac * len(xs))]

def test_part(xs, frac):
    return xs[round(frac * len(xs)):]
`,
        tests: [
          { name: "split", code: `assert train_part([5, 1, 4, 2, 3], 0.6) == [5, 1, 4] and test_part([5, 1, 4, 2, 3], 0.6) == [2, 3], 'Slice at k = round(frac * len(xs)).'` },
          { name: "every item once", code: `xs = list(range(10))
assert train_part(xs, 0.8) + test_part(xs, 0.8) == xs and test_part(xs, 1.0) == [] and train_part(xs, 0.0) == [], 'Each item goes to exactly one side.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>gap(train_errors, test_errors)</C>, the mean test error minus the mean training error, and <C>memorises(train_errors, test_errors, tol)</C>, which is True when that gap is larger than tol: the model does much better on what it has seen than on new data. For example, errors [0, 0] in training and [3, 1] in testing give a gap of 2.0.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def gap(train_errors, test_errors):
    return 0.0

def memorises(train_errors, test_errors, tol):
    return False
`,
        solution: `def gap(train_errors, test_errors):
    return sum(test_errors) / len(test_errors) - sum(train_errors) / len(train_errors)

def memorises(train_errors, test_errors, tol):
    return gap(train_errors, test_errors) > tol
`,
        tests: [
          { name: "gap", code: `assert gap([0, 0], [3, 1]) == 2.0 and gap([1, 2, 3], [2]) == 0.0 and gap([2, 2], [1, 1]) == -1.0, 'Mean of the test errors minus mean of the training errors.'` },
          { name: "memorises", code: `assert memorises([0, 0, 0], [3, 1, 2], 1.0) and not memorises([1, 1], [1.2, 1.4], 0.5) and not memorises([1], [2], 1.0), 'Compare the gap with the tolerance.'` },
        ],
      },
    },
    {
      key: "why-noise",
      rung: "prove",
      prompt: (
        <p>
          Explain why a model with enough freedom to pass through every training point will usually have a higher test error
          than a simpler model, when the data contain noise. Use the degree 9 polynomial as your example.
        </p>
      ),
      answer: {
        kind: "written",
        rubric: [
          "Notes that each training value is pattern plus random noise.",
          "Explains that passing exactly through every point means fitting the noise as well as the pattern.",
          "Notes that new points have different, independent noise, so the fitted noise is wrong for them and the curve's wiggles between points add error.",
          "Contrasts with a simpler model that cannot follow the noise and so stays close to the underlying pattern.",
        ],
      },
    },
    {
      key: "lookup",
      rung: "stretch",
      prompt: (
        <p>
          A lookup-table model memorises 1,000 training images of handwritten digits and, for any image not in its table,
          guesses a digit at random from 0 to 9. On a test set where none of the images appear in the table, what accuracy
          should you expect, as a percentage?
        </p>
      ),
      answer: { kind: "numeric", value: 10 },
    },
  ],

  teachBack:
    "Explain to a friend the difference between memorising and generalising, using the two students, and why a model must be judged on data it has never seen.",

  glimpse: (
    <p>
      This completes what learning is. Next, a tour of the tasks machine learning is used for, starting with classification.
      In Introduction to Machine Learning, the training, validation and test discipline becomes a habit, and the tension
      between too simple and too flexible gets a name, the bias and variance trade-off. Much later, you will meet the
      surprise that very large neural networks can fit their training data perfectly and still generalise well, which
      older theory did not predict.
    </p>
  ),
};
