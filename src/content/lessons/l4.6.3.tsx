import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BiasScaleViz } from "@/components/viz/BiasScaleViz";
import type { LessonContent } from "@/lib/types";

const FIT = `import numpy as np

def circulant(c):
    n = len(c)
    return np.array([[c[(i - j) % n] for j in range(n)] for i in range(n)])

def fit_full(X, Y, lam):
    n = X.shape[1]
    return (np.linalg.pinv(X.T @ X + lam * np.eye(n)) @ X.T @ Y).T

def fit_circulant(X, Y, lam):
    n = X.shape[1]
    D = np.concatenate([np.stack([np.roll(x, d) for d in range(n)], axis=1) for x in X])
    c = np.linalg.pinv(D.T @ D + lam * np.eye(n)) @ D.T @ Y.ravel()
    return circulant(c)`;

const SYM = `import numpy as np

def augment(X, Y):
    n = X.shape[1]
    return (np.concatenate([np.roll(X, s, axis=1) for s in range(n)]),
            np.concatenate([np.roll(Y, s, axis=1) for s in range(n)]))

def project_circulant(W):
    n = len(W)
    return sum(np.roll(np.roll(W, s, axis=0), s, axis=1) for s in range(n)) / n`;

export const lesson: LessonContent = {
  id: "l4.6.3",
  minutes: 50,
  links: {
    requires: ["l4.6.1", "l4.6.2"],
    revisits: ["l4.1.1", "l3.7.3"],
    foreshadows: [],
  },

  puzzle: (
    <>
      <p>
        Trained on the 1.3 million images of ImageNet, a vision transformer loses to a ResNet of similar size. Pretrained on
        300 million images first, the same transformer wins. The convolutional network knows in advance that images look the
        same when shifted and that nearby pixels matter most; the transformer has to learn both. Why should prior knowledge
        help with little data and hurt, or at least stop helping, with a lot?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An architecture&apos;s built-in assumptions restrict the functions it can represent. When the assumption is true, the
        restriction throws away only wrong answers, so the model needs fewer examples to find a good one. When it is slightly
        false, the restriction also throws away the right answer, leaving an error that no amount of data can remove. A less
        constrained model pays more in data but has no such floor. Whether the bias helps is therefore a question about how
        much data you have and how true the assumption is.
      </p>
      <BiasScaleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an equivariant model class">
        <p>
          Let S be the cyclic shift on <M>{"\\mathbb R^n"}</M>. A linear map W is shift-equivariant if{" "}
          <M>{"WS = SW"}</M>; these are exactly the circulant matrices <M>{"W_{ij} = c_{(i-j) \\bmod n}"}</M>, circular convolutions
          with a kernel c, with n parameters instead of <M>{"n^2"}</M>. The projection{" "}
          <M>{"\\Pi W = \\frac1n\\sum_{s=0}^{n-1} S^s W S^{-s}"}</M> averages W over the group of shifts.
        </p>
        <Code>{FIT}</Code>
      </Definition>

      <Theorem title="symmetrising never hurts a symmetric target">
        <p>
          Π is the orthogonal projection, in the Frobenius inner product, onto circulant matrices. Hence if the target T is
          circulant, <M>{"\\|\\Pi W - T\\|_F \\le \\|W - T\\|_F"}</M> for every W. If <M>{"W = T + E"}</M> with E having independent
          entries of variance <M>{"\\sigma^2"}</M>, then <M>{"\\mathbb E\\|\\Pi W - T\\|_F^2 = n\\sigma^2"}</M>, against{" "}
          <M>{"n^2\\sigma^2"}</M> before.
        </p>
      </Theorem>
      <Proof>
        <p>
          Conjugation by the orthogonal matrix <M>{"S^s"}</M> preserves Frobenius inner products, so Π is an average of
          orthogonal maps and is self-adjoint; it fixes circulant matrices and its image is circulant, since conjugating the
          average by S permutes the terms. A self-adjoint idempotent is an orthogonal projection. With <M>{"\\Pi T = T"}</M>,{" "}
          <M>{"\\Pi W - T = \\Pi(W - T)"}</M>, and projections do not increase norms. For the variance, Π replaces each wrapped
          diagonal of E by its mean; a mean of n independent entries has variance <M>{"\\sigma^2/n"}</M>, it fills n positions, and
          there are n diagonals, giving <M>{"n\\sigma^2"}</M>. Estimation error falls by a factor n, as if there were n times as
          much data.
        </p>
      </Proof>

      <Theorem title="augmentation builds the symmetry in">
        <p>
          For data augmented with all n shifts of every example, the ridge-regularised least-squares objective over
          unconstrained W has a unique minimiser, and it is circulant.
        </p>
      </Theorem>
      <Proof>
        <p>
          Augmentation makes the objective invariant under <M>{"W \\mapsto SWS^{-1}"}</M>, since shifting every pair{" "}
          <M>{"(x, y)"}</M> by the same amount only reorders the sum and the penalty <M>{"\\|W\\|_F^2"}</M> is unchanged. The objective is
          strictly convex, so its minimiser is unique; the conjugate of a minimiser is also a minimiser, hence equal to it, and
          a matrix that commutes with S is circulant. Augmentation thus reaches the equivariant model through data instead of
          through architecture, at n times the training cost, and only for the symmetries applied.
        </p>
        <Code>{SYM}</Code>
      </Proof>

      <Example title="a crossover">
        <p>
          In the figure the true filter is applied with zero padding, so it is equivariant except at the two ends. With 4
          examples the unconstrained map has excess error 4.85 and the circulant map 0.33. The circulant map stalls at about
          0.17, the cost of wrongly wrapping around, while the free map keeps improving, overtakes it at 64 examples and reaches
          0.008 at 512. If the true filter does wrap, the circulant map wins at every size and reaches 0.001.
        </p>
      </Example>

      <Remark title="the lesson for architectures">
        <p>
          Convolutions build in locality and translation equivariance, which are nearly but not exactly true of images, and
          help most when data is scarce; transformers build in almost nothing beyond the patch embedding and, given enough
          data or strong augmentation and distillation, catch up and then pull ahead. Recurrence, message passing and pooling
          each encode a symmetry or a structure in the same way. Sutton&apos;s &quot;bitter lesson&quot; observes that, over
          decades, methods that scale with computation have tended to overtake those that encode human knowledge; this
          lesson&apos;s more modest conclusion is that a correct bias is never a burden and an approximate one is a loan, repaid
          when the data arrives.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: <p>For signals of length 100, how many times more parameters does an unconstrained linear map have than a circulant one?</p>,
      answer: { kind: "numeric", value: 100, tolerance: 0.001 },
    },
    {
      key: "need",
      rung: "check",
      prompt: (
        <p>
          Without noise or regularisation, how many generic examples are needed to determine an unconstrained linear map on
          signals of length 16?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.5 },
    },
    {
      key: "vit",
      rung: "apply",
      prompt: <p>A team has 20,000 labelled medical images and no related pretraining data. Which choice is best supported by this lesson?</p>,
      answer: {
        kind: "choice",
        options: [
          "A large vision transformer, since transformers win with scale",
          "A convolutional network, whose built-in locality and equivariance substitute for data that is not available",
          "An unconstrained MLP on raw pixels, since it has no wrong assumptions",
          "Any architecture, since inductive bias does not matter for classification",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def circulant(c):
    n = len(c)
    return np.array([[c[(i - j) % n] for j in range(n)] for i in range(n)])

def fit_full(X, Y, lam):
    n = X.shape[1]
    return (np.linalg.pinv(X.T @ X + lam * np.eye(n)) @ X.T @ Y).T

def fit_circulant(X, Y, lam):
    n = X.shape[1]
    D = np.concatenate([np.stack([np.roll(x, d) for d in range(n)], axis=1) for x in X])
    c = np.linalg.pinv(D.T @ D + lam * np.eye(n)) @ D.T @ Y.ravel()
    return circulant(c)

C = circulant(np.array([1.0, 2.0, 0.0])); print(C.tolist())
X = np.random.default_rng(0).normal(size=(50, 3)); Y = X @ C.T; print(np.allclose(fit_circulant(X[:1], Y[:1], 0.0), C), np.allclose(fit_full(X[:2], Y[:2], 0.0), C), np.allclose(fit_full(X, Y, 0.0), C))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.0, 2.0], [2.0, 1.0, 0.0], [0.0, 2.0, 1.0]]\nTrue False True",
          "[[1.0, 2.0, 0.0], [0.0, 1.0, 2.0], [2.0, 0.0, 1.0]]\nTrue False True",
          "[[1.0, 0.0, 2.0], [2.0, 1.0, 0.0], [0.0, 2.0, 1.0]]\nFalse False True",
          "[[1.0, 0.0, 2.0], [2.0, 1.0, 0.0], [0.0, 2.0, 1.0]]\nTrue True True",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def augment(X, Y):
    n = X.shape[1]
    return (np.concatenate([np.roll(X, s, axis=1) for s in range(n)]),
            np.concatenate([np.roll(Y, s, axis=1) for s in range(n)]))

def project_circulant(W):
    n = len(W)
    return sum(np.roll(np.roll(W, s, axis=0), s, axis=1) for s in range(n)) / n

Xa, Ya = augment(np.array([[1.0, 2.0, 3.0]]), np.array([[10.0, 20.0, 30.0]])); print(Xa.tolist(), Ya[:, 0].tolist())
Cm = np.array([[1.0, 0, 2], [2, 1, 0], [0, 2, 1]]); print(project_circulant(np.diag([1.0, 0.0, 2.0])).tolist(), np.allclose(project_circulant(Cm), Cm))
W = np.random.default_rng(1).normal(size=(3, 3)); print(bool(np.sum((project_circulant(W) - Cm) ** 2) <= np.sum((W - Cm) ** 2)), np.allclose(project_circulant(project_circulant(W)), project_circulant(W)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 2.0, 3.0], [3.0, 1.0, 2.0], [2.0, 3.0, 1.0]] [10.0, 30.0, 20.0]\n[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]] True\nTrue True",
          "[[1.0, 2.0, 3.0], [2.0, 3.0, 1.0], [3.0, 1.0, 2.0]] [10.0, 20.0, 30.0]\n[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]] True\nTrue True",
          "[[1.0, 2.0, 3.0], [3.0, 1.0, 2.0], [2.0, 3.0, 1.0]] [10.0, 30.0, 20.0]\n[[1.0, 0.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 2.0]] True\nTrue True",
          "[[1.0, 2.0, 3.0], [3.0, 1.0, 2.0], [2.0, 3.0, 1.0]] [10.0, 30.0, 20.0]\n[[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]] True\nFalse True",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>circulant(c)</C> with entries <M>{"c_{(i-j) \\bmod n}"}</M>, <C>fit_full(X, Y, lam)</C> returning the ridge
          estimate of W in <M>{"y = Wx"}</M> (use a pseudo-inverse so that lam = 0 works with few examples), and{" "}
          <C>fit_circulant(X, Y, lam)</C>, the ridge estimate restricted to circulant W, returned as a matrix.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def circulant(c):
    return np.diag(c)

def fit_full(X, Y, lam):
    return np.zeros((X.shape[1], X.shape[1]))

def fit_circulant(X, Y, lam):
    return np.zeros((X.shape[1], X.shape[1]))
`,
        solution: FIT,
        tests: [
          { name: "full", code: `rng = np.random.default_rng(0); T = rng.normal(size=(4, 4)); X = rng.normal(size=(30, 4)); Y = X @ T.T
assert circulant(np.array([1.0, 2, 3])).tolist() == [[1, 3, 2], [2, 1, 3], [3, 2, 1]] and np.allclose(fit_full(X, Y, 0.0), T) and np.allclose(fit_full(X, Y, 2.0), np.linalg.solve(X.T @ X + 2 * np.eye(4), X.T @ Y).T)` },
          { name: "circulant", code: `rng = np.random.default_rng(1); c = rng.normal(size=5); X = rng.normal(size=(3, 5)); C = np.array([[c[(i - j) % 5] for j in range(5)] for i in range(5)])
assert np.allclose(fit_circulant(X[:1], X[:1] @ C.T, 0.0), C) and np.allclose(fit_circulant(X, X @ C.T + 0.0, 0.0), C)
W = fit_circulant(X, rng.normal(size=(3, 5)), 0.5); assert np.allclose(W, np.roll(np.roll(W, 1, 0), 1, 1))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>augment(X, Y)</C>, stacking every cyclic shift of the inputs and the matching shift of the outputs, and{" "}
          <C>project_circulant(W)</C>, the average of <M>{"S^s W S^{-s}"}</M> over all shifts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def augment(X, Y):
    return X, Y

def project_circulant(W):
    return W
`,
        solution: SYM,
        tests: [
          { name: "augment", code: `X, Y = np.arange(8.0).reshape(2, 4), -np.arange(8.0).reshape(2, 4); Xa, Ya = augment(X, Y); assert Xa.shape == (8, 4) and Ya.shape == (8, 4)
assert sorted(map(tuple, Xa.tolist())) == sorted(tuple(np.roll(x, s)) for x in X for s in range(4)) and np.allclose(Xa, -Ya)` },
          { name: "project", code: `rng = np.random.default_rng(2); W = rng.normal(size=(5, 5)); P = project_circulant(W)
assert np.allclose(P, np.roll(np.roll(P, 1, 0), 1, 1)) and np.allclose(project_circulant(P), P) and np.allclose(P[0, 0], np.trace(W) / 5) and np.allclose(P[1, 0], np.mean([W[(i + 1) % 5, i] for i in range(5)]))` },
        ],
      },
    },
    {
      key: "noise",
      rung: "stretch",
      prompt: (
        <p>
          A 16 × 16 estimate equals a circulant target plus independent errors of variance 0.01 in every entry. What is the
          expected squared Frobenius error after projecting it onto circulant matrices?
        </p>
      ),
      answer: { kind: "numeric", value: 0.16, tolerance: 0.0005 },
    },
  ],

  glimpse: (
    <>
      <p>
        This closes the tour of architectures: convolutions, embeddings, recurrence, attention, sets, graphs and the
        trade-off between building knowledge in and learning it. The courses that follow put these pieces together at scale.
      </p>
    </>
  ),
};
