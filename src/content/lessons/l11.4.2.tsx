import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CrosscoderDiffViz } from "@/components/viz/CrosscoderDiffViz";
import type { LessonContent } from "@/lib/types";

const TRANS = `def transcode(x, We, be, Wd, bd):
    f = [max(0.0, sum(w * v for w, v in zip(row, x)) + c) for row, c in zip(We, be)]
    return f, [sum(w * v for w, v in zip(row, f)) + c for row, c in zip(Wd, bd)]

def transcoder_loss(x, y, We, be, Wd, bd, lam):
    f, yh = transcode(x, We, be, Wd, bd)
    return sum((a - b) ** 2 for a, b in zip(y, yh)) + lam * sum(f)

def feature_to_feature(Wd, We_next):
    return [[sum(r[k] * Wd[k][j] for k in range(len(Wd))) for j in range(len(Wd[0]))] for r in We_next]`;

const CROSS = `import math

def crosscode(xs, Es, b):
    return [max(0.0, b[i] + sum(sum(w * v for w, v in zip(E[i], x)) for E, x in zip(Es, xs))) for i in range(len(b))]

def relative_norm(DA, DB):
    norm = lambda D, i: math.sqrt(sum(row[i] ** 2 for row in D))
    return [norm(DB, i) / (norm(DA, i) + norm(DB, i)) for i in range(len(DA[0]))]

def crosscoder_penalty(f, Ds):
    return sum(fi * sum(math.sqrt(sum(row[i] ** 2 for row in D)) for D in Ds) for i, fi in enumerate(f))`;

export const lesson: LessonContent = {
  id: "l11.4.2",
  minutes: 50,
  links: {
    requires: ["l11.4.1"],
    revisits: ["l5.2.4", "l11.2.2"],
    foreshadows: ["l11.5.1", "l11.6.3"],
  },

  puzzle: (
    <>
      <p>
        Sparse autoencoders on two consecutive layers each give a list of readable features. But to explain how the model gets from one
        list to the next, you need to know how the MLP between them maps features to features, and the MLP is a dense nonlinear function
        of thousands of neurons. Is there a way to choose the features so that the step between layers is itself simple?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A sparse autoencoder reconstructs a layer from itself. A transcoder instead learns to imitate a component: it reads the MLP&apos;s
        input and predicts its output through a sparse layer of latents. Its latents then describe what the MLP computes, input features
        in and output features out, and they connect to latents in other layers through plain matrix products. A crosscoder goes further
        in the other direction: one set of latents reads and writes several layers, or several models, at once, which makes it a tool
        for comparing them.
      </p>
      <CrosscoderDiffViz />
    </>
  ),

  theory: (
    <>
      <Definition title="transcoders">
        <p>
          For an MLP mapping x to y, a transcoder computes <M>{"f = \\operatorname{ReLU}(W_e x + b_e)"}</M> and{" "}
          <M>{"\\hat y = W_d f + b_d"}</M> (<C>transcode</C>), trained on <M>{"\\|y - \\hat y\\|^2 + \\lambda\\sum_i f_i"}</M> (
          <C>transcoder_loss</C>). Swapping each MLP for its transcoder gives a replacement model whose MLP computation is sparse and
          readable. A skip transcoder adds a linear term <M>{"W_s x"}</M> to absorb the parts of the MLP that are close to linear.
        </p>
        <Code>{TRANS}</Code>
      </Definition>

      <Theorem title="feature-to-feature weights are input-independent">
        <p>
          In a replacement model where layer l&apos;s MLP is a transcoder writing into the residual stream and layer l + 1&apos;s
          transcoder reads it, ignoring attention and normalisation between them, the contribution of latent i at layer l to the
          pre-activation of latent j at layer l + 1 is <M>{"f_i \\cdot (W_e^{(l+1)} W_d^{(l)})_{ji}"}</M> (<C>feature_to_feature</C>), with a
          matrix that does not depend on the input.
        </p>
      </Theorem>
      <Proof>
        <p>
          Latent i at layer l writes <M>{"f_i\\, W_{d,:i}^{(l)}"}</M> into the stream, which is a sum (l11.2.1). The pre-activation of latent
          j at layer l + 1 is <M>{"W_{e,j:}^{(l+1)}"}</M> applied to the stream plus a bias, and is linear in the stream, so latent i
          contributes <M>{"f_i\\, W_{e,j:}^{(l+1)} W_{d,:i}^{(l)}"}</M>. Only <M>{"f_i"}</M> depends on the input; the weight is fixed. With a
          raw MLP the corresponding effect depends on which neurons are active, so it changes from input to input. This fixed wiring is
          what makes transcoders, and the cross-layer transcoders of the next chapter, suitable for tracing circuits.
        </p>
      </Proof>

      <Definition title="crosscoders">
        <p>
          A crosscoder&apos;s latents read several activation sites, layers or models, at once,{" "}
          <M>{"f = \\operatorname{ReLU}(\\sum_s E_s x_s + b)"}</M> (<C>crosscode</C>), and each latent has a decoder vector for every site.
          The sparsity penalty weights each latent by the sum of its decoder norms (<C>crosscoder_penalty</C>), so a latent pays for every
          site it writes to. For two models A and B, a latent&apos;s relative decoder norm{" "}
          <M>{"\\|d_B\\|/(\\|d_A\\| + \\|d_B\\|)"}</M> (<C>relative_norm</C>) is near 0 for features only A uses, near 1 for features only B
          uses, and in between for shared ones.
        </p>
        <Code>{CROSS}</Code>
      </Definition>

      <Remark title="pitfalls in model diffing">
        <p>
          The visualisation shows a real failure: even with no exclusive features, a few latents land at the extremes, because the
          crosscoder has represented a shared feature as a shared latent plus a one-sided correction. With the sum-of-norms penalty,
          splitting a shared feature into an A-only and a B-only latent costs the same as one shared latent, so nothing discourages it.
          Before reporting that fine-tuning created a feature, check that the latent&apos;s B decoder is not close to a direction that model
          A also uses, and look at whether it fires on inputs where model A has a related latent.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Training transcoders for the MLPs gives features chosen to make the MLP step sparse: each output latent is driven by a few input
          latents through fixed weights, so the layer-to-layer map can be read as a small graph. The price is that the replacement model is
          only an approximation, and its reconstruction error must be tracked as part of any explanation built on it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "rel",
      rung: "check",
      prompt: (
        <p>
          A crosscoder latent&apos;s decoder has norm 0.3 for model A and 1.2 for model B. What is its relative decoder norm?
        </p>
      ),
      answer: { kind: "numeric", value: 0.8, tolerance: 0.001 },
    },
    {
      key: "virtual",
      rung: "check",
      prompt: (
        <p>
          A layer-3 transcoder latent writes the decoder vector (2, −1, 3). A layer-4 transcoder latent reads with encoder row (0.5, 0.4,
          0.2). Ignoring everything in between, what is the weight from the first latent to the second?
        </p>
      ),
      answer: { kind: "numeric", value: 1.2, tolerance: 0.001 },
    },
    {
      key: "diff",
      rung: "apply",
      prompt: (
        <p>
          A crosscoder trained on a base model and its chat-tuned version has a latent with relative norm 0.99 that fires on refusals. What
          should you check before saying chat tuning created a refusal feature?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Whether the base model has a latent or direction close to this one that the crosscoder split off, by comparing decoder directions and firing patterns",
          "Whether the latent fires on more than 1% of tokens",
          "Whether the relative norm is exactly 1",
          "Whether the crosscoder has more latents than the model has dimensions",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def transcode(x, We, be, Wd, bd):
    f = [max(0.0, sum(w * v for w, v in zip(row, x)) + c) for row, c in zip(We, be)]
    return f, [sum(w * v for w, v in zip(row, f)) + c for row, c in zip(Wd, bd)]

def transcoder_loss(x, y, We, be, Wd, bd, lam):
    f, yh = transcode(x, We, be, Wd, bd)
    return sum((a - b) ** 2 for a, b in zip(y, yh)) + lam * sum(f)

def feature_to_feature(Wd, We_next):
    return [[sum(r[k] * Wd[k][j] for k in range(len(Wd))) for j in range(len(Wd[0]))] for r in We_next]

We, be, Wd, bd = [[1, 0], [0, 1]], [0, -0.5], [[2, 0], [0, 1]], [0, 0]
print(transcode([1, 0.3], We, be, Wd, bd), transcoder_loss([1, 0.3], [2, 1], We, be, Wd, bd, 0.5), feature_to_feature(Wd, [[1, 1]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "([1.0, 0.0], [2.0, 0.0]) 1.5 [[2, 1]]",
          "([1.0, 0.0], [2.0, 0.0]) 1.0 [[2, 1]]",
          "([1.0, -0.2], [2.0, -0.2]) 1.5 [[2, 1]]",
          "([1.0, 0.0], [2.0, 0.0]) 1.5 [[1, 2]]",
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

def crosscode(xs, Es, b):
    return [max(0.0, b[i] + sum(sum(w * v for w, v in zip(E[i], x)) for E, x in zip(Es, xs))) for i in range(len(b))]

def relative_norm(DA, DB):
    norm = lambda D, i: math.sqrt(sum(row[i] ** 2 for row in D))
    return [norm(DB, i) / (norm(DA, i) + norm(DB, i)) for i in range(len(DA[0]))]

def crosscoder_penalty(f, Ds):
    return sum(fi * sum(math.sqrt(sum(row[i] ** 2 for row in D)) for D in Ds) for i, fi in enumerate(f))

DA, DB = [[3], [4]], [[0], [5]]
print(crosscode([[1, 0], [0, 1]], [[[1, 0]], [[0, 1]]], [0]), relative_norm(DA, DB), crosscoder_penalty([2], [DA, DB]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2] [0.5] 20.0",
          "[1] [0.5] 20.0",
          "[2] [1.0] 20.0",
          "[2] [0.5] 10.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Matrices are lists of rows. Write <C>transcode(x, We, be, Wd, bd)</C>, returning (f, y_hat); <C>transcoder_loss(x, y, We, be,
          Wd, bd, lam)</C>; and <C>feature_to_feature(Wd, We_next)</C>, the product <M>{"W_e^{\\text{next}} W_d"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def transcode(x, We, be, Wd, bd):
    return [0.0] * len(We), list(bd)

def transcoder_loss(x, y, We, be, Wd, bd, lam):
    return 0.0

def feature_to_feature(Wd, We_next):
    return We_next
`,
        solution: TRANS,
        tests: [
          { name: "transcode", code: `We, be = [[1.0, -1.0], [0.5, 0.5], [0.0, 2.0]], [0.0, -0.2, -1.0]\nWd, bd = [[1.0, 0.0, 2.0], [0.0, 1.0, -1.0]], [0.1, 0.0]\nf, yh = transcode([2.0, 1.0], We, be, Wd, bd)\nassert all(abs(a - b) < 1e-12 for a, b in zip(f, [1.0, 1.3, 1.0])) and all(abs(a - b) < 1e-12 for a, b in zip(yh, [3.1, 0.3]))\nassert abs(transcoder_loss([2.0, 1.0], [1.0, 2.0], We, be, Wd, bd, 0.1) - 7.63) < 1e-12` },
          { name: "wiring", code: `assert feature_to_feature([[1, 2], [0, 1], [3, 0]], [[1, 0, 1], [0, 2, 0]]) == [[4, 2], [0, 2]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>crosscode(xs, Es, b)</C>, where Es holds one encoder matrix per site; <C>relative_norm(DA, DB)</C>, one value per
          latent, where latent i&apos;s decoder is column i; and <C>crosscoder_penalty(f, Ds)</C>, the sum over latents of activation
          times the sum of its decoder norms across sites.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def crosscode(xs, Es, b):
    return [0.0] * len(b)

def relative_norm(DA, DB):
    return [0.5] * len(DA[0])

def crosscoder_penalty(f, Ds):
    return 0.0
`,
        solution: CROSS,
        tests: [
          { name: "encode", code: `assert crosscode([[1.0, 2.0], [0.5, -1.0]], [[[1, 0], [0, 1]], [[2, 0], [0, -1]]], [0.0, -3.0]) == [2.0, 0.0]\nassert relative_norm([[3, 0], [0, 1]], [[0, 0], [0, 3]]) == [0.0, 0.75]` },
          { name: "penalty", code: `assert abs(crosscoder_penalty([0.5, 0.0, 2.0], [[[1, 0, 0], [0, 1, 0]], [[0, 0, 3], [0, 0, 4]]]) - 10.5) < 1e-12` },
        ],
      },
    },
    {
      key: "split",
      rung: "stretch",
      prompt: (
        <p>
          A shared feature has unit directions in both models and activation 1. Compare representing it by one latent with both decoders,
          or by two latents, each writing to one model only. If the penalty per latent were the Euclidean norm of the pair of decoder
          norms instead of their sum, what would be the ratio of the two-latent penalty to the one-latent penalty? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.414, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        With several kinds of dictionaries to choose from, the question is how to tell a good one from a bad one. The next lesson is about
        evaluating features.
      </p>
    </>
  ),
};
