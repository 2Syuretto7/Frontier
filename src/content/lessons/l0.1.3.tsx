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
          <Code>{`train = {1: "a", 2: "b", 3: "a"}
def memoriser(x):
    return train.get(x, "?")
print([memoriser(x) for x in [1, 2, 4]])`}</Code>
          <p>A model that memorises its training data. What does it predict for 1, 2 and the new input 4?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['a', 'b', '?']", "['a', 'b', 'a']", "['a', 'b', 'b']", "['?', '?', '?']"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train = {1: "a", 2: "b", 3: "a"}
def memorise(x):
    return train.get(x, "?")
def nearest(x):
    return train[min(train, key=lambda k: (abs(k - x), k))]
print([memorise(x) for x in (2, 4)], [nearest(x) for x in (2, 4, 2.5)])`}</Code>
          <p>A lookup table against a nearest-neighbour rule on unseen inputs. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["['b', '?'] ['b', 'a', 'b']", "['b', '?'] ['b', 'a', 'a']", "['b', 'a'] ['b', 'a', 'b']", "['b', '?'] ['b', '?', 'b']"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>split(xs, ys, frac, seed)</C>, which shuffles the indices with <C>random.Random(seed)</C> and returns <C>(train_x, train_y, test_x, test_y)</C> with the first <C>round(frac * n)</C> shuffled items in the training set. Generalisation is measured only on the held-out part.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def split(xs, ys, frac, seed):
    k = round(frac * len(xs))
    return xs[:k], ys[:k], xs[k:], ys[k:]
`,
        solution: `import random

def split(xs, ys, frac, seed):
    idx = list(range(len(xs)))
    random.Random(seed).shuffle(idx)
    k = round(frac * len(xs))
    tr, te = idx[:k], idx[k:]
    return [xs[i] for i in tr], [ys[i] for i in tr], [xs[i] for i in te], [ys[i] for i in te]
`,
        tests: [
          { name: "sizes", code: `a, b, c, d = split(list(range(10)), list(range(10)), 0.8, 0)
assert len(a) == 8 and len(c) == 2 and sorted(a + c) == list(range(10)), 'Every item goes to exactly one side.'` },
          { name: "aligned", code: `xs = list(range(20)); ys = [x * x for x in xs]
a, b, c, d = split(xs, ys, 0.5, 1)
assert all(y == x * x for x, y in zip(a + c, b + d)), 'Keep each x with its own y.'` },
          { name: "shuffled", code: `a, _, _, _ = split(list(range(100)), list(range(100)), 0.5, 3)
assert a != list(range(50)), 'Shuffle first: data files are often sorted.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Estimate generalisation with cross-validation. Write <C>k_fold_indices(n, k)</C>, which splits the indices 0 … n − 1 into k contiguous folds whose sizes differ by at most one (the first n mod k folds get the extra index) and returns a list of k pairs (train indices, test indices). Then write <C>cv_accuracy(fit, predict, xs, ys, k)</C>: for each fold, call <C>model = fit(train_xs, train_ys)</C>, score <C>predict(model, x)</C> on the test fold, and return the mean of the k fold accuracies.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def k_fold_indices(n, k):
    return [(list(range(n)), list(range(n)))]

def cv_accuracy(fit, predict, xs, ys, k):
    return 1.0
`,
        solution: `def k_fold_indices(n, k):
    out, start = [], 0
    for f in range(k):
        size = n // k + (1 if f < n % k else 0)
        test = list(range(start, start + size))
        train = list(range(0, start)) + list(range(start + size, n))
        out.append((train, test))
        start += size
    return out

def cv_accuracy(fit, predict, xs, ys, k):
    accs = []
    for train, test in k_fold_indices(len(xs), k):
        model = fit([xs[i] for i in train], [ys[i] for i in train])
        accs.append(sum(predict(model, xs[i]) == ys[i] for i in test) / len(test))
    return sum(accs) / len(accs)
`,
        tests: [
          { name: "folds", code: `f = k_fold_indices(10, 3)
assert [t for _, t in f] == [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]] and f[1][0] == [0, 1, 2, 3, 7, 8, 9], 'Sizes 4, 3, 3; train is everything else.'` },
          { name: "partition", code: `for n in range(1, 30):
    for k in range(1, n + 1):
        f = k_fold_indices(n, k)
        tests = [i for _, t in f for i in t]
        assert len(f) == k and sorted(tests) == list(range(n)) and all(sorted(tr + te) == list(range(n)) for tr, te in f), f'n={n}, k={k}'
        sizes = [len(t) for _, t in f]
        assert max(sizes) - min(sizes) <= 1` },
          { name: "memoriser", code: `fit = lambda X, Y: dict(zip(X, Y))
predict = lambda m, x: m.get(x, 0)
xs = list(range(20)); ys = [1] * 20
assert cv_accuracy(fit, predict, xs, ys, 4) == 0.0, 'A lookup table never generalises to unseen inputs.'` },
          { name: "threshold", code: `def fit(X, Y):
    return min(X[i] for i in range(len(X)) if Y[i] == 1)
predict = lambda t, x: int(x >= t)
xs = list(range(12)); ys = [int(x >= 6) for x in xs]
assert abs(cv_accuracy(fit, predict, xs, ys, 3) - 2.5 / 3) < 1e-12, 'The middle fold learns t = 8 from its training data and misses 6 and 7.'` },
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
