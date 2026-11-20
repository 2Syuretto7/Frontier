import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SaeSweepViz } from "@/components/viz/SaeSweepViz";
import type { LessonContent } from "@/lib/types";

const SAE = `def encode(x, We, be, bd):
    xt = [a - b for a, b in zip(x, bd)]
    return [max(0.0, sum(w * v for w, v in zip(row, xt)) + c) for row, c in zip(We, be)]

def decode(f, Wd, bd):
    return [sum(w * v for w, v in zip(row, f)) + c for row, c in zip(Wd, bd)]

def sae_loss(x, We, be, Wd, bd, lam):
    f = encode(x, We, be, bd)
    xh = decode(f, Wd, bd)
    return sum((a - b) ** 2 for a, b in zip(x, xh)) + lam * sum(abs(v) for v in f)`;

const METRICS = `import math

def l0(fs):
    return sum(sum(v != 0 for v in f) for f in fs) / len(fs)

def fvu(xs, xhats):
    d = len(xs[0])
    mean = [sum(x[j] for x in xs) / len(xs) for j in range(d)]
    sse = sum((a - b) ** 2 for x, xh in zip(xs, xhats) for a, b in zip(x, xh))
    return sse / sum((x[j] - mean[j]) ** 2 for x in xs for j in range(d))

def mmcs(true_dirs, learned):
    cos = lambda u, v: sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return sum(max(abs(cos(t, l)) for l in learned) for t in true_dirs) / len(true_dirs)`;

export const lesson: LessonContent = {
  id: "l11.4.1",
  minutes: 55,
  links: {
    requires: ["l11.3.3", "l4.2.3"],
    revisits: ["m10.7.3", "l1.5.3", "m15.5.1"],
    foreshadows: ["l11.4.2", "l11.4.3", "l11.5.1"],
  },

  puzzle: (
    <>
      <p>
        An autoencoder with 16 thousand latents is trained to reconstruct a 512-dimensional layer of a language model. Without any
        constraint it reconstructs perfectly, and its latents mean nothing in particular. Add a penalty on the sum of the latent
        activations and many latents become readable: one fires on DNA sequences, another on legal citations. Why should a penalty on
        activation size produce meaning?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Superposition says a layer&apos;s activation is a sparse combination of many more feature directions than it has dimensions.
        A sparse autoencoder tries to undo that: it learns an overcomplete dictionary of directions and, for each input, a few nonnegative
        coefficients that rebuild the activation. Reconstruction alone has many solutions; sparsity picks the one where few latents are
        active at once, and when the data really are sparse combinations of features, that solution lines up with the features.
      </p>
      <SaeSweepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the sparse autoencoder">
        <p>
          With m latents for a d-dimensional activation x, the encoder computes{" "}
          <M>{"f = \\operatorname{ReLU}(W_e(x - b_d) + b_e)"}</M> (<C>encode</C>) and the decoder{" "}
          <M>{"\\hat x = W_d f + b_d"}</M> (<C>decode</C>), with the columns of <M>{"W_d"}</M>, the feature directions, kept at unit
          length. Training minimises <M>{"\\|x - \\hat x\\|^2 + \\lambda \\sum_i f_i"}</M> (<C>sae_loss</C>), where the L1 term (m10.7.3)
          pushes most latents to zero on each input. Typically m is many times d.
        </p>
        <Code>{SAE}</Code>
      </Definition>

      <Theorem title="the L1 penalty shrinks what it keeps">
        <p>
          Suppose a single active feature with unit decoder direction d explains x = c·d with c &gt; 0, and the latent can be set freely.
          The value minimising <M>{"(c - f)^2 + \\lambda f"}</M> over <M>{"f \\ge 0"}</M> is <M>{"f^* = \\max(0, c - \\lambda/2)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For <M>{"f > 0"}</M> the derivative is <M>{"-2(c - f) + \\lambda"}</M>, zero at <M>{"f = c - \\lambda/2"}</M>; the function is
          convex, so this is the minimum when it is positive, and otherwise the minimum over <M>{"f \\ge 0"}</M> is at 0. This is the
          soft-thresholding of the lasso (l1.5.3): every kept coefficient is pulled towards zero by <M>{"\\lambda/2"}</M>, and small ones
          are cut to zero. Shrinkage is why the strongly penalised autoencoders in the visualisation leave some variance unexplained even
          when they have found the right directions; variants such as TopK, which keeps the k largest pre-activations and drops the
          penalty, and JumpReLU, with a learned threshold, avoid it.
        </p>
      </Proof>

      <Definition title="measuring an autoencoder">
        <p>
          Three numbers describe the trade-off. L0 is the mean number of active latents per input (<C>l0</C>). The fraction of variance
          unexplained compares the reconstruction error with the activation&apos;s variance (<C>fvu</C>); in practice one also measures
          the increase in the language model&apos;s loss when its activation is replaced by the reconstruction. On synthetic data with
          known features, the mean max cosine similarity (<C>mmcs</C>) checks recovery directly: for each true feature, the best match
          among the learned directions.
        </p>
        <Code>{METRICS}</Code>
      </Definition>

      <Remark title="failure modes">
        <p>
          Some latents never fire after training, wasting capacity; these dead latents are counted and often resampled. When the
          penalty is weak, latents are dense mixtures, as the visualisation shows: low error is not evidence of good features. When the
          dictionary is too small, one latent covers several features; when it is large, a feature can split into several latents that
          each cover part of it, and frequent pairs can be absorbed into a single latent. The sparsity penalty also encourages
          compositional features to be learned as separate latents for each combination. Recovery guarantees from sparse coding
          (m15.5.1) assume incoherent dictionaries and very sparse codes, which real models only roughly satisfy.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Without the penalty, any invertible change of basis of the latents reconstructs equally well, so nothing singles out the
          features. With it, the best solution uses as few latents per input as possible, and if the activations are sparse combinations
          of features, using the features themselves is the sparsest way to rebuild them. Meaningful latents are the evidence that the
          superposition picture holds.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fvu",
      rung: "check",
      prompt: (
        <p>
          On a batch, an autoencoder&apos;s total squared reconstruction error is 12 and the activations&apos; total squared deviation
          from their mean is 80. What fraction of variance is unexplained?
        </p>
      ),
      answer: { kind: "numeric", value: 0.15, tolerance: 0.001 },
    },
    {
      key: "shrink",
      rung: "check",
      prompt: (
        <p>
          An activation is exactly 1.0 times a unit feature direction, and the autoencoder&apos;s latent for it minimises{" "}
          <M>{"(1 - f)^2 + 0.3 f"}</M> over <M>{"f \\ge 0"}</M>. What value does the latent take?
        </p>
      ),
      answer: { kind: "numeric", value: 0.85, tolerance: 0.001 },
    },
    {
      key: "choose",
      rung: "apply",
      prompt: (
        <p>
          Two autoencoders on the same layer: A has fraction of variance unexplained 0.01 and 150 active latents per input; B has 0.08
          and 30. Which is likely to have more interpretable latents, and why?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "B, because far fewer active latents per input means each is more likely to be a single feature, at a modest cost in error",
          "A, because it reconstructs the activations better",
          "A, because more active latents capture more features",
          "Neither can be judged without the dictionary size",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def encode(x, We, be, bd):
    xt = [a - b for a, b in zip(x, bd)]
    return [max(0.0, sum(w * v for w, v in zip(row, xt)) + c) for row, c in zip(We, be)]

def decode(f, Wd, bd):
    return [sum(w * v for w, v in zip(row, f)) + c for row, c in zip(Wd, bd)]

def sae_loss(x, We, be, Wd, bd, lam):
    f = encode(x, We, be, bd)
    xh = decode(f, Wd, bd)
    return sum((a - b) ** 2 for a, b in zip(x, xh)) + lam * sum(abs(v) for v in f)

f = encode([1.0, 0.0], [[1, 0], [0, 1], [1, 1]], [0, 0, -1.5], [0, 0])
print(f, decode(f, [[1, 0, 0.7], [0, 1, 0.7]], [0, 0]), sae_loss([1.0, 0.0], [[1, 0], [0, 1], [1, 1]], [0, 0, -1.5], [[1, 0, 0.7], [0, 1, 0.7]], [0, 0], 0.1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.0, 0.0] [1.0, 0.0] 0.1",
          "[1.0, 0.0, 0.5] [1.35, 0.35] 0.1",
          "[1.0, 0.0, 0.0] [1.0, 0.0] 0.0",
          "[1.0, 0.0, 0.0] [1.0, 0.7] 0.1",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def l0(fs):
    return sum(sum(v != 0 for v in f) for f in fs) / len(fs)

def fvu(xs, xhats):
    d = len(xs[0])
    mean = [sum(x[j] for x in xs) / len(xs) for j in range(d)]
    sse = sum((a - b) ** 2 for x, xh in zip(xs, xhats) for a, b in zip(x, xh))
    return sse / sum((x[j] - mean[j]) ** 2 for x in xs for j in range(d))

def mmcs(true_dirs, learned):
    cos = lambda u, v: sum(a * b for a, b in zip(u, v)) / math.sqrt(sum(a * a for a in u) * sum(b * b for b in v))
    return sum(max(abs(cos(t, l)) for l in learned) for t in true_dirs) / len(true_dirs)

print(l0([[1, 0, 0], [0, 2, 3]]), fvu([[1, 0], [0, 1]], [[1, 0], [0, 0]]), mmcs([[1, 0]], [[0, 1], [0.6, 0.8]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.5 1.0 0.6",
          "2.0 1.0 0.6",
          "1.5 0.5 0.6",
          "1.5 1.0 0.8",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Matrices are lists of rows: <C>We</C> has a row per latent, <C>Wd</C> a row per activation dimension. Write{" "}
          <C>encode(x, We, be, bd)</C>, <C>decode(f, Wd, bd)</C> and <C>sae_loss(x, We, be, Wd, bd, lam)</C>, the squared error plus lam
          times the sum of the latents.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def encode(x, We, be, bd):
    return [0.0] * len(We)

def decode(f, Wd, bd):
    return list(bd)

def sae_loss(x, We, be, Wd, bd, lam):
    return 0.0
`,
        solution: SAE,
        tests: [
          { name: "forward", code: `We, be, bd, Wd = [[0.5, -1.0], [1.0, 1.0]], [0.2, -0.5], [0.1, 0.0], [[1.0, 0.0], [0.0, 1.0]]\nf = encode([1.1, 0.5], We, be, bd)\nassert all(abs(a - b) < 1e-12 for a, b in zip(f, [0.2, 1.0]))\nassert all(abs(a - b) < 1e-12 for a, b in zip(decode(f, Wd, bd), [0.3, 1.0]))` },
          { name: "loss", code: `We, be, bd, Wd = [[0.5, -1.0], [1.0, 1.0]], [0.2, -0.5], [0.1, 0.0], [[1.0, 0.0], [0.0, 1.0]]\nassert abs(sae_loss([1.1, 0.5], We, be, Wd, bd, 0.5) - 1.49) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>l0(fs)</C>, the mean number of nonzero latents per input; <C>fvu(xs, xhats)</C>, total squared error over total
          squared deviation from the per-dimension mean; and <C>mmcs(true_dirs, learned)</C>, the mean over true directions of the
          largest absolute cosine with a learned one.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def l0(fs):
    return 0.0

def fvu(xs, xhats):
    return 0.0

def mmcs(true_dirs, learned):
    return 1.0
`,
        solution: METRICS,
        tests: [
          { name: "l0", code: `assert abs(l0([[0.0, 0.0], [1.0, 0.0], [0.5, 0.5]]) - 1.0) < 1e-12\nassert abs(fvu([[1.0, 2.0], [3.0, 0.0], [2.0, 1.0]], [[1.0, 1.5], [2.5, 0.0], [2.0, 1.0]]) - 0.125) < 1e-12` },
          { name: "mmcs", code: `assert abs(mmcs([[1, 0], [0, 1]], [[1, 1], [0, -2]]) - 0.8535533906) < 1e-9` },
        ],
      },
    },
    {
      key: "loss",
      rung: "stretch",
      prompt: (
        <p>
          A feature&apos;s coefficient c is uniform on [0, 1] when active, and the autoencoder outputs <M>{"\\max(0, c - 0.15)"}</M> times
          its direction. What fraction of <M>{"E[c^2]"}</M> is lost as expected squared error? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.061, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        An autoencoder reads one layer at a time. Transcoders and crosscoders, next, read across layers and across models, which makes
        their features usable as parts of a circuit.
      </p>
    </>
  ),
};
