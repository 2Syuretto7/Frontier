import { M, MD } from "@/components/Math";
import { Definition, Example, Remark } from "@/components/lesson/Blocks";
import { KnnViz } from "@/components/viz/KnnViz";
import { C, Code } from "@/components/lesson/Code";
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
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train = [((1, 1), "red"), ((2, 1), "red"), ((5, 5), "blue"), ((6, 5), "blue"), ((3, 3), "blue")]
q = (2, 2)
d = sorted([((x - q[0]) ** 2 + (y - q[1]) ** 2, lab) for (x, y), lab in train])
print(d[0][1], [lab for _, lab in d[:3]])`}</Code>
          <p>The nearest neighbours of (2, 2), sorted by squared distance (and by label when distances tie). What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["red ['red', 'blue', 'red']", "red ['red', 'red', 'blue']", "blue ['blue', 'red', 'red']", "red ['red', 'red', 'red']"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`train = [((0, 0), "red"), ((1, 0), "red"), ((5, 5), "blue"), ((6, 5), "blue"), ((2, 1), "blue")]
q = (1, 1)
d = sorted((abs(x - q[0]) + abs(y - q[1]), lab) for (x, y), lab in train)
top = [l for _, l in d[:3]]
print(d[:3], top.count("red"))`}</Code>
          <p>Three nearest neighbours under Manhattan distance. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[(1, 'blue'), (1, 'red'), (2, 'red')] 2", "[(1, 'red'), (1, 'blue'), (2, 'red')] 2", "[(1, 'blue'), (1, 'red'), (2, 'red')] 1", "[(1, 'red'), (2, 'red'), (8, 'blue')] 2"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <>
          <p>
            Write <C>knn(train, q, k)</C>, which returns the majority label among the k training points nearest to q in Euclidean distance. <C>train</C> is a list of ((x, y), label) pairs. Break ties in the vote by the label of the single nearest point.
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def knn(train, q, k):
    return train[0][1]
`,
        solution: `def knn(train, q, k):
    d = sorted([((x - q[0]) ** 2 + (y - q[1]) ** 2, i) for i, ((x, y), lab) in enumerate(train)])
    labels = [train[i][1] for _, i in d[:k]]
    best = max(labels.count(lab) for lab in labels)
    for lab in labels:
        if labels.count(lab) == best:
            return lab
`,
        tests: [
          { name: "vote", code: `train = [((1, 1), 'red'), ((2, 1), 'red'), ((5, 5), 'blue'), ((6, 5), 'blue'), ((3, 3), 'blue')]
assert knn(train, (2, 2), 3) == 'red' and knn(train, (5, 4), 3) == 'blue', 'Take the majority of the k nearest.'` },
          { name: "tie", code: `train = [((0, 0), 'a'), ((3, 0), 'b'), ((10, 0), 'c')]
assert knn(train, (1, 0), 2) == 'a', 'A one-one tie goes to the nearest point.'` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <>
          <p>
            Nearest neighbours for numbers. Write <C>knn_regress(train, q, k)</C> for a list of (point, target) pairs with points as tuples: the mean target of the k training points closest to q in Euclidean distance (ties broken by position in the list). Then write <C>loo_mse(train, k)</C>, the leave-one-out mean squared error (predict each point from all the others), and <C>best_k(train, ks)</C>, the k in ks with the lowest leave-one-out error (the smallest on ties).
          </p>
        </>
      ),
      answer: {
        kind: "code",
        starter: `def knn_regress(train, q, k):
    return sum(t for _, t in train) / len(train)

def loo_mse(train, k):
    return 0.0

def best_k(train, ks):
    return ks[0]
`,
        solution: `import math

def knn_regress(train, q, k):
    order = sorted([(math.dist(train[i][0], q), i) for i in range(len(train))])
    return sum(train[i][1] for _, i in order[:k]) / k

def loo_mse(train, k):
    err = 0.0
    for i, (x, y) in enumerate(train):
        rest = train[:i] + train[i + 1:]
        err += (knn_regress(rest, x, k) - y) ** 2
    return err / len(train)

def best_k(train, ks):
    best = ks[0]
    for k in ks:
        if loo_mse(train, k) < loo_mse(train, best) or (loo_mse(train, k) == loo_mse(train, best) and k < best):
            best = k
    return best
`,
        tests: [
          { name: "regress", code: `train = [((0,), 0), ((1,), 10), ((2,), 20), ((10,), 100)]
assert knn_regress(train, (1.2,), 1) == 10 and knn_regress(train, (1.2,), 2) == 15 and knn_regress(train, (1.5,), 2) == 15, 'Average the k closest targets; ties go to the earlier point.'
assert knn_regress(train, (0,), 4) == 32.5` },
          { name: "loo", code: `train = [((0,), 0), ((1,), 1), ((2,), 2), ((3,), 3)]
assert loo_mse(train, 1) == 1.0 and abs(loo_mse(train, 2) - (2.25 + 0 + 0 + 2.25) / 4) < 1e-12, 'Each point is predicted from the others; ties go to the earlier point.'` },
          { name: "best", code: `import random
random.seed(2)
train = [((x,), x * x / 10 + random.gauss(0, 3)) for x in [random.uniform(-10, 10) for _ in range(60)]]
k = best_k(train, [1, 3, 5, 9, 25, 59])
assert k in (3, 5, 9), f'Neither 1 (too noisy) nor 59 (the mean) should win; got {k}.'
assert loo_mse(train, 59) > loo_mse(train, k)` },
        ],
      },
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
