import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NoiseAugmentViz } from "@/components/viz/NoiseAugmentViz";
import type { LessonContent } from "@/lib/types";

const NOISE = `import numpy as np

def augment_noise(X, y, sigma, k, rng):
    Xa = np.repeat(X, k, axis=0)
    return Xa + sigma * rng.normal(size=Xa.shape), np.repeat(y, k)

def ridge_fit(X, y, lam):
    N, d = X.shape
    return np.linalg.solve(X.T @ X / N + lam * np.eye(d), X.T @ y / N)`;

const MIX = `def mixup(X, Y, alpha, rng):
    lam = rng.beta(alpha, alpha, size=(len(X), 1))
    perm = rng.permutation(len(X))
    return lam * X + (1 - lam) * X[perm], lam * Y + (1 - lam) * Y[perm]

def flip_augment(images):
    return np.concatenate([images, images[:, :, ::-1]])`;

export const lesson: LessonContent = {
  id: "l3.7.3",
  minutes: 40,
  links: {
    requires: ["l3.7.2"],
    revisits: ["l3.7.1", "l1.2.3"],
    foreshadows: ["l3.7.4"],
  },

  puzzle: (
    <>
      <p>
        A cat photo flipped left to right is still a cat. Shifted a few pixels, slightly darker, cropped a little: still a
        cat. Each of these is a new training example obtained for free, and adding them often helps more than any change to
        the model. But flip a photo of the digit 6 upside down and it becomes a 9. What makes an augmentation help rather
        than hurt, and what is it doing mathematically?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An augmentation is a statement about the task: this transformation does not change the label. Training on
        transformed copies teaches the model that invariance instead of hoping it will be inferred from limited data. Even
        the crudest augmentation, adding small random noise to the inputs, says something useful: the output should not
        change sharply when the input barely changes. That is a smoothness penalty in disguise.
      </p>
      <NoiseAugmentViz />
    </>
  ),

  theory: (
    <>
      <Definition title="augmented risk">
        <p>
          Given a distribution over label-preserving transformations T, training on augmented data minimises
        </p>
        <MD>{"\\frac1N\\sum_{n} \\mathbb{E}_{T}\\big[\\ell(f(T(x_n)), y_n)\\big]."}</MD>
        <p>
          In practice a fresh T is drawn for each example each time it is seen, so the expectation is estimated by SGD
          itself, at no cost in memory.
        </p>
      </Definition>

      <Theorem title="input noise is ridge regression">
        <p>
          For a linear model and <M>{"T(x) = x + \\varepsilon"}</M> with <M>{"\\varepsilon \\sim \\mathcal{N}(0, \\sigma^2 I)"}</M>,
        </p>
        <MD>{"\\mathbb{E}_\\varepsilon\\big[(y - (x + \\varepsilon)^\\top w)^2\\big] = (y - x^\\top w)^2 + \\sigma^2\\|w\\|^2,"}</MD>
        <p>so the augmented loss is the mean squared error plus <M>{"\\sigma^2\\|w\\|^2"}</M>: ridge with λ = σ².</p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"r = y - x^\\top w"}</M>. The error is <M>{"r - \\varepsilon^\\top w"}</M>, whose square has expectation{" "}
          <M>{"r^2 - 2r\\,\\mathbb{E}[\\varepsilon]^\\top w + \\mathbb{E}[(\\varepsilon^\\top w)^2] = r^2 + w^\\top(\\sigma^2 I)w"}</M>.
          For non-linear models the same expansion, to second order in σ, gives a penalty on the size of the gradient of f
          with respect to x: noise penalises sensitivity.
        </p>
        <Code>{NOISE}</Code>
      </Proof>

      <Definition title="mixup">
        <p>
          Mixup goes further and blends pairs of examples: <M>{"\\tilde x = \\lambda x_i + (1 - \\lambda)x_j"}</M> and{" "}
          <M>{"\\tilde y = \\lambda y_i + (1 - \\lambda)y_j"}</M> with one-hot labels and{" "}
          <M>{"\\lambda \\sim \\text{Beta}(\\alpha, \\alpha)"}</M>. It encourages the model to behave linearly between
          training examples, which tends to improve calibration and robustness.
        </p>
        <Code>{MIX}</Code>
      </Definition>

      <Remark title="choosing augmentations">
        <p>
          The rule is domain knowledge, not a library default. Horizontal flips suit natural photographs but not text or
          digits; random crops and colour jitter suit most images; time shifts and added noise suit audio; for text, token
          dropout or back-translation. At test time, averaging predictions over a few augmentations (test-time augmentation)
          often adds a little accuracy.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "lam",
      rung: "check",
      prompt: <p>A linear model is trained with Gaussian input noise of standard deviation 0.1 on every feature. What ridge coefficient λ (on ‖w‖², added to the mean squared error) is this equivalent to?</p>,
      answer: { kind: "numeric", value: 0.01, tolerance: 1e-9 },
    },
    {
      key: "mix",
      rung: "check",
      prompt: <p>Mixup with λ = 0.3 blends an example of class 0 (label (1, 0)) with one of class 1 (label (0, 1)). What is the second component of the blended label?</p>,
      answer: { kind: "numeric", value: 0.7, tolerance: 1e-9 },
    },
    {
      key: "digits",
      rung: "apply",
      prompt: <p>Which augmentation is harmful for handwritten digit classification?</p>,
      answer: {
        kind: "choice",
        options: ["Rotation by 180°", "Shifting by one or two pixels", "Small changes in stroke thickness", "Adding slight pixel noise"],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def augment_noise(X, y, sigma, k, rng):
    Xa = np.repeat(X, k, axis=0)
    return Xa + sigma * rng.normal(size=Xa.shape), np.repeat(y, k)

def ridge_fit(X, y, lam):
    N, d = X.shape
    return np.linalg.solve(X.T @ X / N + lam * np.eye(d), X.T @ y / N)

rng = np.random.default_rng(0)
X = rng.normal(size=(20, 3)); y = X @ np.array([1.0, -2.0, 0.5]) + 0.1 * rng.normal(size=20)
Xa, ya = augment_noise(X, y, 0.5, 2000, rng)
w_aug = np.linalg.lstsq(Xa, ya, rcond=None)[0]
print(np.round(w_aug, 2), np.round(ridge_fit(X, y, 0.25), 2))`}</Code>
          <p>Least squares on 2000 noisy copies of each point against ridge. Which output is closest to what this prints?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[ 0.82 -1.32  0.27] [ 0.81 -1.33  0.28]",
          "[ 1.   -2.    0.5 ] [ 0.81 -1.33  0.28]",
          "[ 0.82 -1.32  0.27] [ 1.   -2.    0.5 ]",
          "[ 0.25 -0.5   0.12] [ 0.81 -1.33  0.28]",
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

def mixup(X, Y, alpha, rng):
    lam = rng.beta(alpha, alpha, size=(len(X), 1))
    perm = rng.permutation(len(X))
    return lam * X + (1 - lam) * X[perm], lam * Y + (1 - lam) * Y[perm]

def flip_augment(images):
    return np.concatenate([images, images[:, :, ::-1]])

rng = np.random.default_rng(0)
img = np.array([[[1, 2, 3], [4, 5, 6]]])
print(flip_augment(img)[1].tolist())
Y = np.eye(2)
Xm, Ym = mixup(np.array([[0.0], [10.0]]), Y, 1.0, rng)
print(np.allclose(Ym.sum(axis=1), 1), np.allclose(Xm[:, 0], 10 * Ym[:, 1]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[[3, 2, 1], [6, 5, 4]]\nTrue True", "[[4, 5, 6], [1, 2, 3]]\nTrue True", "[[3, 2, 1], [6, 5, 4]]\nTrue False", "[[1, 2, 3], [4, 5, 6]]\nFalse True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>augment_noise(X, y, sigma, k, rng)</C>, returning k copies of every row of X (copies of the same row next to
          each other, as <C>np.repeat</C> gives) with independent Gaussian noise of standard deviation sigma added, and the
          matching repeated y; and <C>ridge_fit(X, y, lam)</C>, the minimiser of{" "}
          <M>{"\\tfrac1N\\|y - Xw\\|^2 + \\lambda\\|w\\|^2"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def augment_noise(X, y, sigma, k, rng):
    return X, y

def ridge_fit(X, y, lam):
    return np.linalg.lstsq(X, y, rcond=None)[0]
`,
        solution: NOISE,
        tests: [
          { name: "augment", code: `rng = np.random.default_rng(0)
X = np.array([[1.0, 2.0], [3.0, 4.0]]); y = np.array([5.0, 6.0])
Xa, ya = augment_noise(X, y, 0.0, 3, rng)
assert np.allclose(Xa, [[1, 2]] * 3 + [[3, 4]] * 3) and np.allclose(ya, [5, 5, 5, 6, 6, 6])
Xa, ya = augment_noise(np.zeros((1, 1)), np.zeros(1), 2.0, 50000, rng)
assert Xa.shape == (50000, 1) and abs(Xa.std() - 2.0) < 0.03` },
          { name: "ridge equivalence", code: `rng = np.random.default_rng(1)
X = rng.normal(size=(15, 3)); y = rng.normal(size=15)
w = ridge_fit(X, y, 0.3)
assert np.allclose(X.T @ (X @ w - y) / 15 + 0.3 * w, 0)
assert np.allclose(ridge_fit(X, y, 0.0), np.linalg.lstsq(X, y, rcond=None)[0])
Xa, ya = augment_noise(X, y, 0.5, 3000, rng)
assert np.allclose(np.linalg.lstsq(Xa, ya, rcond=None)[0], ridge_fit(X, y, 0.25), atol=0.05)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mixup(X, Y, alpha, rng)</C>: draw one λ per example from <C>rng.beta(alpha, alpha)</C>, pair each example
          with <C>X[perm]</C> for a random permutation perm, and return the blended inputs and labels. Also write{" "}
          <C>flip_augment(images)</C> for an (N, H, W) array, returning the originals followed by their left–right mirror
          images, shape (2N, H, W).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mixup(X, Y, alpha, rng):
    return X, Y

def flip_augment(images):
    return images
`,
        solution: `import numpy as np

${MIX}`,
        tests: [
          { name: "flip", code: `img = np.arange(12).reshape(2, 2, 3)
out = flip_augment(img)
assert out.shape == (4, 2, 3) and np.array_equal(out[:2], img)
assert out[2].tolist() == [[2, 1, 0], [5, 4, 3]] and out[3].tolist() == [[8, 7, 6], [11, 10, 9]]` },
          { name: "mixup", code: `rng = np.random.default_rng(4)
X = np.array([[0.0], [10.0], [20.0], [30.0]]); Y = np.eye(4)
Xm, Ym = mixup(X, Y, 0.4, rng)
assert Xm.shape == (4, 1) and Ym.shape == (4, 4)
assert np.allclose(Ym.sum(axis=1), 1) and np.allclose(Xm[:, 0], Ym @ X[:, 0])
assert np.all(Ym >= 0) and np.count_nonzero(Ym > 1e-12, axis=1).max() <= 2
Xm, Ym = mixup(X, Y, 0.4, rng)
assert not np.allclose(Ym, Y)` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that for ε ~ N(0, σ²I), E[(y − (x + ε)ᵀw)²] = (y − xᵀw)² + σ²‖w‖².</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes the error as r − εᵀw with r = y − xᵀw and expands the square.",
          "Uses E[ε] = 0 to remove the cross term 2r·E[ε]ᵀw.",
          "Computes E[(εᵀw)²] = wᵀE[εεᵀ]w = σ²‖w‖², giving the result.",
        ],
      },
    },
    {
      key: "beta",
      rung: "stretch",
      prompt: <p>In mixup with α = 1, λ is uniform on [0, 1]. What is the probability that the blend gives the first example at least 90% of the weight (λ ≥ 0.9)?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend what an augmentation asserts about a task, why input noise acts like ridge regression, and how to choose augmentations that help.",

  glimpse: (
    <p>
      All of these regularisers have a strength to tune. The simplest regulariser of all needs no tuning: stop training at
      the right moment. Next: early stopping.
    </p>
  ),
};
