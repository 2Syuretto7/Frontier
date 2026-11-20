import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NoFreeLunchViz } from "@/components/viz/NoFreeLunchViz";
import type { LessonContent } from "@/lib/types";

const AVERAGE = `from itertools import product

def off_sample_error(learner, train_idx, n):
    unseen = [i for i in range(n) if i not in train_idx]
    total = 0.0
    for f in product([0, 1], repeat=n):
        h = learner([(i, f[i]) for i in train_idx])
        total += sum(h(i) != f[i] for i in unseen) / len(unseen)
    return total / 2 ** n

def majority_learner(samples):
    label = int(2 * sum(y for _, y in samples) > len(samples))
    table = dict(samples)
    return lambda x: table.get(x, label)`;

const BOUND = `def expected_unseen(c, m):
    return (1 - 1 / c) ** m

def nfl_expected_error(c, m):
    return 0.5 * expected_unseen(c, m)

def markov_lower(mu, a):
    return (mu - a) / (1 - a)`;

export const lesson: LessonContent = {
  id: "m16.1.3",
  minutes: 40,
  links: {
    requires: ["m16.1.2"],
    revisits: ["m7.4.2"],
    foreshadows: ["m16.2.2", "m16.2.3"],
  },

  puzzle: (
    <>
      <p>
        Someone proposes a universal learner: no hypothesis class chosen in advance, just a clever algorithm that adapts to
        whatever the data show. It would be the end of feature engineering, architecture search and priors. Before building
        it, ask what it could possibly predict about a point it has never seen, if any labelling of the unseen points is
        allowed.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sample fixes labels only where it has seen points. If every labelling of the remaining points is equally possible,
        the sample says nothing about them, and any prediction is a coin toss. A learner beats chance off the training set only
        because it assumes something: that nearby points share labels, that the rule is simple, that the target is in a small
        class. Assumptions that help on some problems must hurt on others.
      </p>
      <NoFreeLunchViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="off-training-set averaging">
        <p>
          Fix a finite domain, a set of training points and any deterministic learner. Averaged uniformly over all target
          functions, the learner&apos;s error on the points outside the training set is exactly 1/2.
        </p>
      </Theorem>
      <Proof>
        <p>
          Pair each target f with the target f′ that agrees with f on the training points and disagrees on a chosen unseen
          point u. The learner receives the same sample from both, so it predicts the same label at u, which is right for exactly
          one of them. Averaging over the pairs, each unseen point is misclassified half the time, and so is their average
          (<C>off_sample_error</C>). The argument uses nothing about the learner (<C>majority_learner</C> or any other).
        </p>
        <Code>{AVERAGE}</Code>
      </Proof>

      <Theorem title="no free lunch">
        <p>
          Let A be any learner for binary classification with the 0-1 loss over a domain X, and let{" "}
          <M>{"m < |X| / 2"}</M>. There is a distribution D over <M>{"X \\times \\{0, 1\\}"}</M> such that some function f has{" "}
          <M>{"L_D(f) = 0"}</M>, yet with probability at least 1/7 over samples S of size m,
        </p>
        <MD>{"L_D(A(S)) \\ge 1/8."}</MD>
      </Theorem>
      <Proof>
        <p>
          Take a set C of 2m points and the <M>{"T = 2^{2m}"}</M> functions on it, and for each function <M>{"f_j"}</M> let{" "}
          <M>{"D_j"}</M> be uniform on C with labels from <M>{"f_j"}</M>. A sample of m points sees at most m of the 2m points,
          so at least half of C is unseen. By the averaging argument, the expected error of A over a uniformly random j, on the
          unseen half, is 1/2, so its expected risk is at least 1/4 (<C>nfl_expected_error</C> gives the exact value when
          points are drawn with replacement). An average over j cannot exceed a maximum, so some j has{" "}
          <M>{"\\mathbb E_S[L_{D_j}(A(S))] \\ge 1/4"}</M>. For a variable L in [0, 1] with mean at least μ,{" "}
          <M>{"\\Pr[L \\ge a] \\ge (\\mu - a) / (1 - a)"}</M> (<C>markov_lower</C>), a reversed Markov inequality (m7.4.2), and
          μ = 1/4, a = 1/8 give 1/7.
        </p>
        <Code>{BOUND}</Code>
      </Proof>

      <Remark title="consequences">
        <p>
          The class of all functions on an infinite domain is not PAC learnable: no finite sample size works for every
          distribution. So learning needs prior knowledge, expressed by restricting the class or by preferring some hypotheses
          over others. The theorem does not say that learning is hopeless in practice; it says that success comes from a match
          between the learner&apos;s assumptions and the problems it meets. The next part characterises exactly which classes
          are learnable, by a single number, the VC dimension (m16.2.2).
        </p>
      </Remark>

      <Definition title="inductive bias">
        <p>
          The inductive bias of a learner is whatever, beyond the data, determines its predictions on unseen inputs: the
          hypothesis class, a regulariser, an architecture, the implicit preferences of an optimiser. No free lunch says that
          every useful learner has one; the work is to choose it well.
        </p>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "unseen",
      rung: "check",
      prompt: <p>A domain has 20 points under the uniform distribution and a random target. A learner sees 10 examples drawn with replacement. What is its expected risk, half the expected unseen mass? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2994, tolerance: 0.0001 },
    },
    {
      key: "markov",
      rung: "check",
      prompt: <p>A risk lies in [0, 1] and has mean at least 0.3. What lower bound does the reversed Markov inequality give on the probability that it is at least 0.1? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.2222, tolerance: 0.0001 },
    },
    {
      key: "meaning",
      rung: "apply",
      prompt: <p>What does the no-free-lunch theorem imply for building learners?</p>,
      answer: {
        kind: "choice",
        options: [
          "A learner can beat chance off the training set only on problems that match its assumptions, so some restriction or preference must be built in",
          "All learners perform equally on real-world data sets",
          "Deep networks cannot generalise",
          "Larger training sets cannot help any learner",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from itertools import product

def off_sample_error(learner, train_idx, n):
    unseen = [i for i in range(n) if i not in train_idx]
    total = 0.0
    for f in product([0, 1], repeat=n):
        h = learner([(i, f[i]) for i in train_idx])
        total += sum(h(i) != f[i] for i in unseen) / len(unseen)
    return total / 2 ** n

def majority_learner(samples):
    label = int(2 * sum(y for _, y in samples) > len(samples))
    table = dict(samples)
    return lambda x: table.get(x, label)

print(off_sample_error(majority_learner, [0, 1], 4), off_sample_error(lambda s: (lambda x: 1), [0], 3))
print(majority_learner([(0, 1), (1, 1), (2, 0)])(7), majority_learner([(0, 1), (1, 0)])(7), majority_learner([(3, 0)])(3), majority_learner([(3, 0)])(4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5 0.5\n1 0 0 0",
          "0.25 0.5\n1 0 0 0",
          "0.5 0.5\n1 1 0 0",
          "0.5 0.0\n1 0 0 0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def expected_unseen(c, m):
    return (1 - 1 / c) ** m

def nfl_expected_error(c, m):
    return 0.5 * expected_unseen(c, m)

def markov_lower(mu, a):
    return (mu - a) / (1 - a)

print(round(expected_unseen(4, 2), 4), round(nfl_expected_error(10, 5), 4), round(markov_lower(0.25, 0.125), 4))
print(round(nfl_expected_error(1000, 1000), 4), markov_lower(0.5, 0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.5625 0.2952 0.1429\n0.1838 0.0",
          "0.75 0.2952 0.1429\n0.1838 0.0",
          "0.5625 0.5905 0.1429\n0.1838 0.0",
          "0.5625 0.2952 0.1429\n0.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>off_sample_error(learner, train_idx, n)</C>, averaging over all 2^n targets on points 0 to n − 1 the
          learner&apos;s error on the points not in <C>train_idx</C>, and <C>majority_learner(samples)</C>, which returns
          stored labels for seen points and the strict majority label, ties going to 0, elsewhere.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from itertools import product

def off_sample_error(learner, train_idx, n):
    return 0.0

def majority_learner(samples):
    return lambda x: 1
`,
        solution: AVERAGE,
        tests: [
          { name: "off-sample", code: `assert off_sample_error(lambda s: (lambda x: 0), [0, 1], 3) == 0.5 and off_sample_error(majority_learner, [], 2) == 0.5` },
          { name: "majority", code: `f = majority_learner([(0, 1), (5, 1), (6, 0)]); assert f(9) == 1 and f(6) == 0 and majority_learner([(1, 0), (2, 1)])(3) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>expected_unseen(c, m)</C>, the expected probability mass of points not drawn in m uniform draws from c
          points, <C>nfl_expected_error(c, m)</C> and <C>markov_lower(mu, a)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def expected_unseen(c, m):
    return 1.0

def nfl_expected_error(c, m):
    return 0.5

def markov_lower(mu, a):
    return 0.0
`,
        solution: BOUND,
        tests: [
          { name: "unseen", code: `assert expected_unseen(2, 3) == 0.125 and nfl_expected_error(2, 1) == 0.25 and abs(nfl_expected_error(5, 2) - 0.32) < 1e-12` },
          { name: "markov", code: `assert abs(markov_lower(0.25, 0.125) - 1 / 7) < 1e-12 and markov_lower(1.0, 0.3) == 1.0 and abs(markov_lower(0.5, 0.0) - 0.5) < 1e-12` },
        ],
      },
    },
    {
      key: "limit",
      rung: "stretch",
      prompt: (
        <p>
          In the construction, take C to have 2m points and draw the m training points uniformly with replacement. As m grows,
          what value does the expected risk of every learner, averaged over all targets on C, approach? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.303, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Restricting the class is unavoidable, and a finite class is the simplest restriction. The next part starts there and
        asks for more: that training error and true error be close for every hypothesis in the class at once.
      </p>
    </>
  ),
};
