import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { NceBoundViz } from "@/components/viz/NceBoundViz";
import type { LessonContent } from "@/lib/types";

const NCE = `import numpy as np

def normalise(Z):
    return Z / np.linalg.norm(Z, axis=1, keepdims=True)

def info_nce(Za, Zb, tau):
    S = normalise(Za) @ normalise(Zb).T / tau
    S = S - S.max(axis=1, keepdims=True)
    logp = S - np.log(np.exp(S).sum(axis=1, keepdims=True))
    return float(-np.mean(np.diag(logp))), float(np.mean(np.argmax(S, axis=1) == np.arange(len(S))))`;

const BOUND = `import numpy as np

def gaussian_mi(rho):
    return -0.5 * np.log(1 - rho ** 2)

def nce_estimate(rho, N, batches, seed=0):
    rng = np.random.default_rng(seed); est = []
    for _ in range(batches):
        x = rng.normal(size=N); y = rho * x + np.sqrt(1 - rho ** 2) * rng.normal(size=N)
        F = -(y[None, :] - rho * x[:, None]) ** 2 / (2 * (1 - rho ** 2)) + y[None, :] ** 2 / 2
        F = F - F.max(axis=1, keepdims=True)
        est.append(np.log(N) + np.mean(np.diag(F) - np.log(np.exp(F).sum(axis=1))))
    return float(np.mean(est))`;

export const lesson: LessonContent = {
  id: "l4.2.4",
  minutes: 55,
  links: {
    requires: ["l4.2.2", "m12.2.3"],
    revisits: ["l3.3.2", "l4.2.3"],
    foreshadows: ["l4.4.1"],
  },

  puzzle: (
    <>
      <p>
        Take an image, crop and recolour it two different ways, and train an encoder so that the two versions land close
        together while versions of other images land far away. No labels are used. Yet a linear classifier on the resulting
        features rivals one trained on labelled data. The loss behind this is a softmax over a batch, and the bigger the batch,
        the better it works, up to batches of several thousand. Why should the batch size matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Contrastive learning turns representation learning into a multiple-choice test. For each anchor, one candidate in the
        batch is its true partner and the rest are distractors; the encoder is trained to pick the partner. To pass, the
        features must keep whatever the two views share, such as the object, and may discard what differs, such as the crop
        or colour. The test can only be as hard as the number of distractors allows, and the loss turns out to be a lower bound
        on the mutual information between views that can never exceed the log of the batch size.
      </p>
      <NceBoundViz />
    </>
  ),

  theory: (
    <>
      <Definition title="InfoNCE">
        <p>
          Given a batch of N positive pairs <M>{"(a_i, b_i)"}</M>, encoders producing unit vectors, and a temperature τ, the
          InfoNCE loss is
        </p>
        <MD>{"\\mathcal L = -\\frac1N\\sum_{i=1}^{N}\\log\\frac{\\exp(a_i^\\top b_i/\\tau)}{\\sum_{j=1}^{N}\\exp(a_i^\\top b_j/\\tau)},"}</MD>
        <p>
          a cross-entropy whose correct class for row i is column i, with the other items of the batch as negatives. CLIP
          applies it in both directions between image and text encoders.
        </p>
        <Code>{NCE}</Code>
      </Definition>

      <Theorem title="the InfoNCE bound">
        <p>
          For any critic f, with <M>{"(x_i, y_i)"}</M> drawn independently from the joint distribution,
        </p>
        <MD>{"I(X; Y) \\ge \\log N - \\mathbb E\\,\\mathcal L_N(f), \\qquad \\mathcal L_N(f) = -\\frac1N\\sum_i \\log\\frac{e^{f(x_i, y_i)}}{\\sum_j e^{f(x_i, y_j)}}."}</MD>
        <p>
          The bound is tightest for <M>{"f(x, y) = \\log p(y \\mid x)/p(y)"}</M> plus any function of x, and can never exceed log N.
        </p>
      </Theorem>
      <Proof>
        <p>
          Consider the task of guessing which of N candidates <M>{"y_1, \\dots, y_N"}</M> is paired with <M>{"x_1"}</M>, the
          others being independent draws from p(y). By Bayes&apos; rule the true posterior that index i is the partner is{" "}
          <M>{"q_i = r(x_1, y_i)/\\sum_j r(x_1, y_j)"}</M> with <M>{"r = p(y \\mid x)/p(y)"}</M>. Any critic defines another
          distribution over indices, and cross-entropy is minimised by the true posterior, so{" "}
          <M>{"\\mathbb E\\mathcal L_N(f) \\ge \\mathbb E\\mathcal L_N(\\log r)"}</M>. For the optimal critic,{" "}
          <M>{"-\\log q_1 = -\\log r(x_1, y_1) + \\log\\sum_j r(x_1, y_j)"}</M>; the first term averages to −I(X; Y), and by
          Jensen&apos;s inequality the second is at most{" "}
          <M>{"\\log(r(x_1, y_1) + (N - 1)\\,\\mathbb E_{y \\sim p(y)}r(x_1, y)) \\approx \\log N"}</M> for large N, since{" "}
          <M>{"\\mathbb E_{p(y)} r = 1"}</M>. Rearranging gives the bound (the exact argument handles the positive term in the sum
          with a little more care). Since the loss is non-negative, the estimate log N − L is at most log N.
        </p>
      </Proof>

      <Example title="known mutual information">
        <p>
          For a bivariate normal with correlation ρ, <M>{"I = -\\tfrac12\\log(1 - \\rho^2)"}</M>. Using the exact optimal critic,
          the estimate at ρ = 0.9 (I = 0.83 nats) is 0.50 with N = 4 and 0.82 with N = 64. At ρ = 0.999 (I = 3.11 nats) a batch of
          16 caps the estimate at log 16 = 2.77, and it actually reaches 2.25. Note that the critic must include the{" "}
          <M>{"-\\log p(y)"}</M> term: terms depending on the candidate y do not cancel in the softmax.
        </p>
        <Code>{BOUND}</Code>
      </Example>

      <Remark title="what the loss shapes, and the role of temperature">
        <p>
          For normalised features and many negatives, the loss splits into an alignment term, pulling partners together, and
          a uniformity term, spreading all features evenly over the sphere so no information is lost to collapse. A small τ
          sharpens the softmax so that gradients concentrate on the hardest negatives; too small and false negatives, images
          of the same class treated as distractors, dominate. Augmentations decide what counts as nuisance: whatever the two
          views disagree on is what the features learn to ignore. Methods without negatives, such as BYOL and DINO, avoid
          collapse by other means, such as a slowly moving target network.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "cap",
      rung: "check",
      prompt: <p>With a batch of 1024, what is the largest mutual information, in nats, that the InfoNCE estimate can certify?</p>,
      answer: { kind: "numeric", value: 6.931, tolerance: 0.001 },
    },
    {
      key: "eye",
      rung: "check",
      prompt: (
        <p>
          Three anchors and three partners are orthonormal, each partner identical to its anchor, and τ = 1. What is the InfoNCE
          loss?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5514, tolerance: 0.0005 },
    },
    {
      key: "fn",
      rung: "apply",
      prompt: <p>Why can a very small temperature hurt contrastive learning on a dataset with many images per class?</p>,
      answer: {
        kind: "choice",
        options: [
          "The softmax focuses almost all the gradient on the most similar negatives, which are often images of the same class that should not be pushed apart",
          "A small temperature makes all similarities equal",
          "Small temperatures make the loss non-differentiable",
          "The bound on mutual information becomes larger than log N",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def normalise(Z):
    return Z / np.linalg.norm(Z, axis=1, keepdims=True)

def info_nce(Za, Zb, tau):
    S = normalise(Za) @ normalise(Zb).T / tau
    S = S - S.max(axis=1, keepdims=True)
    logp = S - np.log(np.exp(S).sum(axis=1, keepdims=True))
    return float(-np.mean(np.diag(logp))), float(np.mean(np.argmax(S, axis=1) == np.arange(len(S))))

rng = np.random.default_rng(0); Z = rng.normal(size=(8, 4)); l0, a0 = info_nce(Z, Z, 0.1); l1, a1 = info_nce(Z, rng.normal(size=(8, 4)), 0.5)
print(l0 < 0.1, a0, l1 > 1.5, round(float(np.log(8)), 3))
print(info_nce(np.eye(3), np.eye(3), 1.0)[0] == info_nce(2 * np.eye(3), 5 * np.eye(3), 1.0)[0], round(info_nce(np.eye(3), np.eye(3), 1.0)[0], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True 1.0 True 2.079\nTrue 0.5514",
          "True 1.0 True 2.079\nFalse 0.5514",
          "True 0.125 True 2.079\nTrue 0.5514",
          "True 1.0 True 2.079\nTrue 0.0",
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

def gaussian_mi(rho):
    return -0.5 * np.log(1 - rho ** 2)

def nce_estimate(rho, N, batches, seed=0):
    rng = np.random.default_rng(seed); est = []
    for _ in range(batches):
        x = rng.normal(size=N); y = rho * x + np.sqrt(1 - rho ** 2) * rng.normal(size=N)
        F = -(y[None, :] - rho * x[:, None]) ** 2 / (2 * (1 - rho ** 2)) + y[None, :] ** 2 / 2
        F = F - F.max(axis=1, keepdims=True)
        est.append(np.log(N) + np.mean(np.diag(F) - np.log(np.exp(F).sum(axis=1))))
    return float(np.mean(est))

print(round(float(gaussian_mi(0.9)), 3), [round(nce_estimate(0.9, N, 50), 2) for N in (4, 64)])
print(nce_estimate(0.999, 16, 50) < np.log(16) < gaussian_mi(0.999))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.83 [0.5, 0.82]\nTrue", "0.83 [0.82, 0.5]\nTrue", "0.83 [0.5, 0.82]\nFalse", "1.66 [0.5, 0.82]\nTrue"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>normalise(Z)</C> and <C>info_nce(Za, Zb, tau)</C>, returning the loss with in-batch negatives and the fraction
          of anchors whose most similar candidate is their partner. Compute the log-softmax stably.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def normalise(Z):
    return Z

def info_nce(Za, Zb, tau):
    return 0.0, 0.0
`,
        solution: NCE,
        tests: [
          { name: "values", code: `l, a = info_nce(np.eye(4), np.eye(4), 0.5); assert abs(l - np.log(1 + 3 * np.exp(-2))) < 1e-9 and a == 1.0
l, a = info_nce(np.eye(2), np.eye(2)[::-1], 1.0); assert abs(l - np.log(1 + np.e)) < 1e-9 and a == 0.0` },
          { name: "stable", code: `Z = np.random.default_rng(5).normal(size=(6, 3)); l, a = info_nce(Z, 3 * Z, 0.001); assert np.isfinite(l) and l < 1e-6 and a == 1.0 and np.allclose(np.linalg.norm(normalise(Z), axis=1), 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gaussian_mi(rho)</C> and <C>nce_estimate(rho, N, batches, seed)</C>, averaging log N minus the InfoNCE loss with
          the optimal critic over simulated batches of correlated standard normal pairs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gaussian_mi(rho):
    return 0.0

def nce_estimate(rho, N, batches, seed=0):
    return 0.0
`,
        solution: BOUND,
        tests: [
          { name: "mi", code: `assert abs(gaussian_mi(0.6) - 0.5 * np.log(1 / 0.64)) < 1e-12 and gaussian_mi(0.0) == 0.0` },
          { name: "bound", code: `e1, e2 = nce_estimate(0.95, 8, 200, 1), nce_estimate(0.95, 128, 20, 2); assert e1 < np.log(8) and e1 < e2 < gaussian_mi(0.95) + 0.05 and e2 > 1.0 and abs(nce_estimate(0.0, 32, 50, 3)) < 0.05` },
        ],
      },
    },
    {
      key: "n",
      rung: "stretch",
      prompt: <p>To be able to certify 10 nats of mutual information with InfoNCE, at least how large must the batch be?</p>,
      answer: { kind: "numeric", value: 22027, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        Embeddings give symbols vectors, and contrastive losses compare them. The next section returns to sequences, starting
        with the simplest model that predicts the next word from the last few.
      </p>
    </>
  ),
};
