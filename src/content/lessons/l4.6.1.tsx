import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PatchGridViz } from "@/components/viz/PatchGridViz";
import type { LessonContent } from "@/lib/types";

const PATCH = `import numpy as np

def patchify(img, P):
    H, W, C = img.shape
    return img.reshape(H // P, P, W // P, P, C).transpose(0, 2, 1, 3, 4).reshape(-1, P * P * C)

def unpatchify(X, H, W, P, C):
    return X.reshape(H // P, W // P, P, P, C).transpose(0, 2, 1, 3, 4).reshape(H, W, C)

def patch_embed(img, P, E):
    return patchify(img, P) @ E`;

const CONV = `import numpy as np

def conv_patch_embed(img, K, P):
    H, W, _ = img.shape
    out = np.zeros((H // P, W // P, len(K)))
    for i in range(H // P):
        for j in range(W // P):
            block = img[i * P:(i + 1) * P, j * P:(j + 1) * P]
            out[i, j] = np.tensordot(K, block, axes=3)
    return out

def seq_len(side, P, cls=True):
    return (side // P) ** 2 + int(cls)`;

export const lesson: LessonContent = {
  id: "l4.6.1",
  minutes: 45,
  links: {
    requires: ["l4.4.4", "l4.1.1"],
    revisits: ["l4.4.3"],
    foreshadows: ["l4.6.2", "l4.6.3"],
  },

  puzzle: (
    <>
      <p>
        A 224 × 224 colour image has 50176 pixels. Treating each pixel as a token and running self-attention would need about
        2.5 billion attention weights per head per layer. The 2020 paper that brought transformers to vision titled itself
        &quot;An image is worth 16 × 16 words&quot; and used 196 tokens instead. What exactly is a word of an image, and what
        does the transformer lose by reading pictures this way?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Cut the image into a grid of non-overlapping square patches, flatten each patch into a vector, and map it linearly to
        the model width: each patch becomes one token. Add a learned position vector to each token so the model knows where
        the patch came from, prepend a learnable classification token, and run a standard transformer encoder. Inside a patch
        the model sees pixels through a fixed linear map; between patches everything is learned by attention. Nothing tells
        it that neighbouring patches are related, except what it learns from data.
      </p>
      <PatchGridViz />
    </>
  ),

  theory: (
    <>
      <Definition title="vision transformer">
        <p>
          For an image <M>{"x \\in \\mathbb R^{H \\times W \\times C}"}</M> and patch size P, let{" "}
          <M>{"x_1, \\dots, x_N \\in \\mathbb R^{P^2 C}"}</M> be its flattened patches in row-major order, with{" "}
          <M>{"N = HW/P^2"}</M>. The input sequence is
        </p>
        <MD>{"z_0 = [\\,x_{\\text{cls}};\\, x_1 E;\\, \\dots;\\, x_N E\\,] + E_{\\text{pos}}, \\qquad E \\in \\mathbb R^{P^2 C \\times d},\\ E_{\\text{pos}} \\in \\mathbb R^{(N+1) \\times d},"}</MD>
        <p>
          followed by L transformer blocks; the class prediction is read from the final state of the extra token. ViT-B/16 at
          224 pixels has N = 196, d = 768 and 12 blocks of 12 heads.
        </p>
        <Code>{PATCH}</Code>
      </Definition>

      <Theorem title="patch embedding is a strided convolution">
        <p>
          The patch embedding equals a convolution with d output channels, kernel size P and stride P, whose kernel for channel
          o is column o of E reshaped to P × P × C.
        </p>
      </Theorem>
      <Proof>
        <p>
          With stride equal to kernel size, the convolution&apos;s output at grid position (i, j) is the inner product of each
          kernel with exactly the pixels of patch (i, j), and the windows do not overlap. Patch (i, j) flattened in the same
          order as the kernel gives the same inner product as the matrix product with the corresponding column of E. So the only
          convolutional structure in a ViT is this single layer; it shares weights across positions but has no overlap and no
          hierarchy.
        </p>
        <Code>{CONV}</Code>
      </Proof>

      <Theorem title="cost against patch size">
        <p>
          For a fixed image, the number of attention weights per head and layer is <M>{"(N + 1)^2 \\approx H^2 W^2/P^4"}</M>, so halving
          the patch size multiplies the attention cost by about 16, while the cost of the MLPs and projections, linear in N,
          grows by 4.
        </p>
      </Theorem>
      <Proof>
        <p>
          N is the number of patches, <M>{"HW/P^2"}</M>, and attention compares every pair of tokens. Halving P quadruples N and
          so multiplies <M>{"N^2"}</M> by 16; the per-token work of the other layers is independent of N. This is why higher
          resolution at the same patch size, or smaller patches, is expensive for plain ViTs, and why hierarchical variants
          attend within local windows.
        </p>
      </Proof>

      <Example title="tokens in the figure">
        <p>
          The 32 × 32 image in the figure becomes 64 tokens of length 16 with 4 × 4 patches, 16 tokens of length 64 with 8 × 8
          patches, and 4 tokens of length 256 with 16 × 16 patches, with 4096, 256 and 16 attention weights per head. Shuffling
          the patches leaves the set of tokens unchanged, which is all that self-attention sees once positions are removed.
        </p>
      </Example>

      <Remark title="what is and is not built in">
        <p>
          A convolutional network is translation equivariant at every layer and local by construction. A ViT is neither: shifting
          the image by less than a patch changes every token, and any notion of locality must come from the learned position
          embeddings and attention. Trained ViTs nevertheless learn position embeddings whose similarity falls off with
          distance, and early heads that attend locally, recovering some of the convolutional prior from data. Changing the
          resolution at test time changes N, so position embeddings are interpolated on the 2-D grid.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "n",
      rung: "check",
      prompt: <p>How many patch tokens (excluding the class token) does a 224 × 224 image give with 14 × 14 patches?</p>,
      answer: { kind: "numeric", value: 256, tolerance: 0.5 },
    },
    {
      key: "dim",
      rung: "check",
      prompt: <p>What is the length of a flattened 16 × 16 RGB patch?</p>,
      answer: { kind: "numeric", value: 768, tolerance: 0.5 },
    },
    {
      key: "pixels",
      rung: "apply",
      prompt: <p>Why does a ViT use patches rather than single pixels as tokens?</p>,
      answer: {
        kind: "choice",
        options: [
          "Pixels carry no information on their own",
          "Attention cost grows with the square of the number of tokens, and pixels would give tens of thousands of tokens per image",
          "Transformers can only accept vectors of length 768",
          "Patches make the model translation equivariant",
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

def patchify(img, P):
    H, W, C = img.shape
    return img.reshape(H // P, P, W // P, P, C).transpose(0, 2, 1, 3, 4).reshape(-1, P * P * C)

def unpatchify(X, H, W, P, C):
    return X.reshape(H // P, W // P, P, P, C).transpose(0, 2, 1, 3, 4).reshape(H, W, C)

def patch_embed(img, P, E):
    return patchify(img, P) @ E

img = np.arange(16.0).reshape(4, 4, 1); X = patchify(img, 2); print(X.shape, X[0].tolist(), X[1].tolist())
print(np.array_equal(unpatchify(X, 4, 4, 2, 1), img), patchify(np.zeros((224, 224, 3)), 16).shape, patch_embed(img, 2, np.ones((4, 1))).ravel().tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 4) [0.0, 1.0, 4.0, 5.0] [2.0, 3.0, 6.0, 7.0]\nTrue (196, 768) [10.0, 18.0, 42.0, 50.0]",
          "(4, 4) [0.0, 1.0, 2.0, 3.0] [4.0, 5.0, 6.0, 7.0]\nTrue (196, 768) [6.0, 22.0, 38.0, 54.0]",
          "(4, 4) [0.0, 1.0, 4.0, 5.0] [8.0, 9.0, 12.0, 13.0]\nTrue (196, 768) [10.0, 42.0, 18.0, 50.0]",
          "(4, 4) [0.0, 1.0, 4.0, 5.0] [2.0, 3.0, 6.0, 7.0]\nTrue (768, 196) [10.0, 18.0, 42.0, 50.0]",
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

def conv_patch_embed(img, K, P):
    H, W, _ = img.shape
    out = np.zeros((H // P, W // P, len(K)))
    for i in range(H // P):
        for j in range(W // P):
            block = img[i * P:(i + 1) * P, j * P:(j + 1) * P]
            out[i, j] = np.tensordot(K, block, axes=3)
    return out

def seq_len(side, P, cls=True):
    return (side // P) ** 2 + int(cls)

img = np.arange(16.0).reshape(4, 4, 1); print(conv_patch_embed(img, np.ones((1, 2, 2, 1)), 2).ravel().tolist(), conv_patch_embed(np.ones((6, 6, 3)), np.ones((5, 3, 3, 3)), 3).shape)
print(seq_len(224, 16), seq_len(224, 8), seq_len(384, 16, cls=False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[10.0, 18.0, 42.0, 50.0] (2, 2, 5)\n197 785 576",
          "[10.0, 18.0, 42.0, 50.0] (2, 2, 5)\n196 784 576",
          "[10.0, 18.0, 42.0, 50.0] (5, 2, 2)\n197 785 576",
          "[6.0, 22.0, 38.0, 54.0] (2, 2, 5)\n197 785 577",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>patchify(img, P)</C> taking an (H, W, C) image to an (N, P·P·C) array of patches in row-major order, each
          flattened row by row, <C>unpatchify(X, H, W, P, C)</C> inverting it, and <C>patch_embed(img, P, E)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def patchify(img, P):
    return img.reshape(-1, P * P * img.shape[2])

def unpatchify(X, H, W, P, C):
    return X.reshape(H, W, C)

def patch_embed(img, P, E):
    return None
`,
        solution: PATCH,
        tests: [
          { name: "patches", code: `img = np.arange(6 * 4 * 2.0).reshape(6, 4, 2); X = patchify(img, 2); assert X.shape == (6, 8) and np.array_equal(X[3], img[2:4, 2:4].ravel()) and np.array_equal(unpatchify(X, 6, 4, 2, 2), img)` },
          { name: "embed", code: `rng = np.random.default_rng(0); img = rng.normal(size=(8, 8, 3)); E = rng.normal(size=(48, 5)); Y = patch_embed(img, 4, E); assert Y.shape == (4, 5) and np.allclose(Y[2], img[4:8, 0:4].ravel() @ E)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv_patch_embed(img, K, P)</C>, a convolution with kernels K of shape (C_out, P, P, C) and stride P,
          returning an (H/P, W/P, C_out) array, and <C>seq_len(side, P, cls)</C>, the number of tokens for a square image.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conv_patch_embed(img, K, P):
    return np.zeros((1, 1, len(K)))

def seq_len(side, P, cls=True):
    return 0
`,
        solution: CONV,
        tests: [
          { name: "conv", code: `rng = np.random.default_rng(1); img = rng.normal(size=(6, 9, 2)); K = rng.normal(size=(4, 3, 3, 2)); Y = conv_patch_embed(img, K, 3)
assert Y.shape == (2, 3, 4) and np.allclose(Y[1, 2, 3], np.sum(K[3] * img[3:6, 6:9])) and np.allclose(Y[0, 0], [np.sum(k * img[:3, :3]) for k in K])` },
          { name: "length", code: `assert seq_len(224, 16) == 197 and seq_len(224, 16, cls=False) == 196 and seq_len(64, 4) == 257` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          A ViT on 224 × 224 images switches from 16 × 16 to 8 × 8 patches. Counting the class token, by what factor does the
          number of attention weights per head grow?
        </p>
      ),
      answer: { kind: "numeric", value: 15.878, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        Vision transformers forced a re-examination of convolutional networks. The next lesson shows that a convolutional
        network modernised with the transformer&apos;s training recipe and a few of its design choices catches up.
      </p>
    </>
  ),
};
