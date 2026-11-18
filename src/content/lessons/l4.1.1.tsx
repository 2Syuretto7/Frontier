import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShiftEquivarianceViz } from "@/components/viz/ShiftEquivarianceViz";
import type { LessonContent } from "@/lib/types";

const CONV = `import numpy as np

def corr2d(x, k):
    H, W = x.shape; kh, kw = k.shape
    out = np.zeros((H - kh + 1, W - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(x[i:i + kh, j:j + kw] * k)
    return out

def circ_corr2d(x, k):
    out = np.zeros(x.shape)
    for u in range(k.shape[0]):
        for v in range(k.shape[1]):
            out += k[u, v] * np.roll(x, (-u, -v), axis=(0, 1))
    return out`;

const LAYER = `import numpy as np

def out_size(n, k, p=0, s=1):
    return (n + 2 * p - k) // s + 1

def conv_layer(x, W, b, p=0, s=1):
    x = np.pad(x, ((0, 0), (p, p), (p, p)))
    O, C, kh, kw = W.shape
    Ho, Wo = out_size(x.shape[1], kh, 0, s), out_size(x.shape[2], kw, 0, s)
    cols = np.stack([x[:, i * s:i * s + kh, j * s:j * s + kw].ravel() for i in range(Ho) for j in range(Wo)], axis=1)
    return (W.reshape(O, -1) @ cols + b[:, None]).reshape(O, Ho, Wo)`;

export const lesson: LessonContent = {
  id: "l4.1.1",
  minutes: 55,
  links: {
    requires: ["l3.1.2"],
    revisits: ["m6.6.3"],
    foreshadows: ["l4.1.2", "m21.3.1"],
  },

  puzzle: (
    <>
      <p>
        A cat in the top-left corner of a photo is still a cat in the bottom-right. A multilayer perceptron fed the raw pixels
        does not know that: it must learn to recognise the cat separately at every position, with separate weights for each,
        and a 224 × 224 colour image already needs about 150,000 weights per hidden unit. What is the smallest change to a
        linear layer that builds &quot;the same thing, somewhere else&quot; into the architecture, and how many parameters does it
        save?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Slide a small window of weights, the kernel, across the image and compute a weighted sum at every position. Two ideas
        are packed into this. Locality: each output looks only at a small neighbourhood, because nearby pixels are what matter
        for edges and textures. Weight sharing: the same kernel is used everywhere, so a feature detector learned in one place
        works in every place. The consequence is equivariance: shift the input and the feature map shifts with it, instead of
        changing unpredictably.
      </p>
      <ShiftEquivarianceViz />
    </>
  ),

  theory: (
    <>
      <Definition title="convolution as used in deep learning">
        <p>
          For an input x with C channels and a kernel W with O output channels, the layer computes
        </p>
        <MD>{"y[o, i, j] = b_o + \\sum_{c=1}^{C}\\sum_{u=0}^{k_h-1}\\sum_{v=0}^{k_w-1} W[o, c, u, v]\\, x[c,\\, si + u,\\, sj + v],"}</MD>
        <p>
          after padding x with p zeros on each side, where s is the stride. Strictly this is cross-correlation; the
          mathematical convolution flips the kernel, which makes no difference when the kernel is learned.
        </p>
      </Definition>

      <Theorem title="output size and parameter count">
        <p>
          Along a dimension of size n, the output has <M>{"\\lfloor (n + 2p - k)/s\\rfloor + 1"}</M> positions. The layer has{" "}
          <M>{"O(Ck_hk_w + 1)"}</M> parameters, independent of the image size.
        </p>
      </Theorem>
      <Proof>
        <p>
          The padded length is n + 2p, and a window of length k starting at 0, s, 2s, … fits while{" "}
          <M>{"ms + k \\le n + 2p"}</M>, which allows <M>{"\\lfloor (n + 2p - k)/s\\rfloor + 1"}</M> values of m. Each output
          channel has one weight per input channel and kernel position, plus a bias. For a 32 × 32 × 3 input mapped to 32 × 32 × 16
          features, a dense layer needs <M>{"3072 \\times 16384 \\approx 5 \\times 10^7"}</M> weights, while a 3 × 3 convolution with
          padding 1 needs 16 × (27 + 1) = 448.
        </p>
      </Proof>

      <Theorem title="translation equivariance">
        <p>
          Let <M>{"T_a"}</M> shift a signal cyclically by a, and let K be circular cross-correlation with any kernel. Then{" "}
          <M>{"K(T_ax) = T_a(Kx)"}</M> for every x. Conversely, every linear map on length-n cyclic signals that commutes with
          all shifts is a circular cross-correlation.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(K T_a x)[i] = \\sum_u k[u]\\,x[i + u - a] = (Kx)[i - a] = (T_aKx)[i]"}</M>, all indices mod n. For the converse,
          let L be linear and shift-commuting, and let <M>{"h = L e_0"}</M>. Since <M>{"e_j = T_je_0"}</M>,{" "}
          <M>{"Le_j = T_jh"}</M>, so the matrix of L has each column a shifted copy of the previous one: it is circulant, as in
          the lesson on circulant matrices, and a circulant matrix is exactly a circular convolution. With zero padding instead
          of wrap-around, equivariance holds away from the border; the code checks both cases.
        </p>
        <Code>{CONV}</Code>
      </Proof>

      <Example title="a convolution layer as one matrix multiply">
        <p>
          Gather every input patch into a column (the im2col trick): with C channels and a <M>{"k \\times k"}</M> kernel each
          column has <M>{"Ck^2"}</M> entries, one per output position. Then the whole layer is a single product of the{" "}
          <M>{"O \\times Ck^2"}</M> weight matrix with this patch matrix, which is how many libraries run convolutions on hardware
          built for matrix multiplication. Stride simply skips positions.
        </p>
        <Code>{LAYER}</Code>
      </Example>

      <Remark title="what breaks equivariance">
        <p>
          Stride, pooling and borders all spoil exact equivariance: shifting the input by one pixel under stride 2 does not
          shift the output by half a pixel. Real CNNs are therefore only approximately shift equivariant, and small
          translations can change their predictions, a weakness that blur-before-subsampling designs partly repair. The deeper
          principle, that symmetries of the data should become symmetries of the network, extends from translations to
          rotations and permutations, the subject of geometric deep learning.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: <p>A 64-pixel-wide input goes through a 5 × 5 convolution with padding 2 and stride 2. How wide is the output?</p>,
      answer: { kind: "numeric", value: 32, tolerance: 0.0001 },
    },
    {
      key: "params",
      rung: "check",
      prompt: <p>How many parameters, including biases, does a 3 × 3 convolution from 64 to 128 channels have?</p>,
      answer: { kind: "numeric", value: 73856, tolerance: 0.0001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Which property of a convolution layer makes a detector learned at one image position work at every position?</p>,
      answer: {
        kind: "choice",
        options: [
          "Weight sharing: the same kernel is applied at every position",
          "Locality: each output depends on a small neighbourhood",
          "Zero padding at the border",
          "The bias term in each output channel",
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

def corr2d(x, k):
    H, W = x.shape; kh, kw = k.shape
    out = np.zeros((H - kh + 1, W - kw + 1))
    for i in range(out.shape[0]):
        for j in range(out.shape[1]):
            out[i, j] = np.sum(x[i:i + kh, j:j + kw] * k)
    return out

def circ_corr2d(x, k):
    out = np.zeros(x.shape)
    for u in range(k.shape[0]):
        for v in range(k.shape[1]):
            out += k[u, v] * np.roll(x, (-u, -v), axis=(0, 1))
    return out

x = np.arange(16.0).reshape(4, 4); k = np.array([[1.0, 0.0], [0.0, -1.0]]); print(corr2d(x, k).tolist())
r = np.random.default_rng(0).normal(size=(6, 6)); kk = np.random.default_rng(1).normal(size=(3, 3))
print(np.allclose(circ_corr2d(np.roll(r, 2, axis=1), kk), np.roll(circ_corr2d(r, kk), 2, axis=1)), np.allclose(corr2d(np.roll(r, 2, axis=1), kk), np.roll(corr2d(r, kk), 2, axis=1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0]]\nTrue False",
          "[[-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0]]\nTrue True",
          "[[5.0, 5.0, 5.0], [5.0, 5.0, 5.0], [5.0, 5.0, 5.0]]\nTrue False",
          "[[-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0], [-5.0, -5.0, -5.0]]\nFalse False",
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

def out_size(n, k, p=0, s=1):
    return (n + 2 * p - k) // s + 1

def conv_layer(x, W, b, p=0, s=1):
    x = np.pad(x, ((0, 0), (p, p), (p, p)))
    O, C, kh, kw = W.shape
    Ho, Wo = out_size(x.shape[1], kh, 0, s), out_size(x.shape[2], kw, 0, s)
    cols = np.stack([x[:, i * s:i * s + kh, j * s:j * s + kw].ravel() for i in range(Ho) for j in range(Wo)], axis=1)
    return (W.reshape(O, -1) @ cols + b[:, None]).reshape(O, Ho, Wo)

print(out_size(32, 3, 1, 1), out_size(32, 3, 0, 2), out_size(7, 3, 1, 2))
y = conv_layer(np.ones((2, 5, 5)), np.ones((3, 2, 3, 3)), np.array([0.0, 1.0, 2.0]), p=1); print(y.shape, float(y[0, 0, 0]), float(y[0, 2, 2]), float(y[2, 2, 2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "32 15 4\n(3, 5, 5) 8.0 18.0 20.0",
          "32 16 4\n(3, 5, 5) 8.0 18.0 20.0",
          "32 15 4\n(3, 5, 5) 18.0 18.0 20.0",
          "30 15 3\n(3, 3, 3) 18.0 18.0 20.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>corr2d(x, k)</C>, the valid (unpadded) cross-correlation of a 2-D array with a kernel, and{" "}
          <C>circ_corr2d(x, k)</C>, the same with wrap-around so the output has the input&apos;s shape.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def corr2d(x, k):
    return x

def circ_corr2d(x, k):
    return x
`,
        solution: CONV,
        tests: [
          { name: "valid", code: `x = np.arange(20.0).reshape(4, 5); k = np.array([[0.0, 1.0], [2.0, 0.0]]); y = corr2d(x, k)
assert y.shape == (3, 4) and y[0, 0] == 1 + 2 * 5 and y[2, 3] == 14 + 2 * 18` },
          { name: "equivariant", code: `r = np.random.default_rng(3).normal(size=(5, 7)); k = np.random.default_rng(4).normal(size=(2, 3)); y = circ_corr2d(r, k)
assert y.shape == r.shape and np.allclose(circ_corr2d(np.roll(r, (1, 3), axis=(0, 1)), k), np.roll(y, (1, 3), axis=(0, 1))) and np.allclose(y[:4, :5], corr2d(r, k))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>out_size(n, k, p, s)</C> and <C>conv_layer(x, W, b, p, s)</C>, a multi-channel convolution layer with input of
          shape (C, H, W), weights (O, C, kh, kw), biases (O,), zero padding p and stride s, using the im2col approach.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def out_size(n, k, p=0, s=1):
    return n

def conv_layer(x, W, b, p=0, s=1):
    return x
`,
        solution: LAYER,
        tests: [
          { name: "size", code: `assert out_size(224, 7, 3, 2) == 112 and out_size(5, 3) == 3 and out_size(10, 4, 1, 3) == 3` },
          { name: "layer", code: `r = np.random.default_rng(2); x = r.normal(size=(3, 7, 7)); W = r.normal(size=(4, 3, 3, 3)); b = r.normal(size=4); y = conv_layer(x, W, b, p=1, s=2)
xp = np.pad(x, ((0, 0), (1, 1), (1, 1))); ref = np.einsum("ocuv,cuv->o", W, xp[:, 2:5, 4:7]) + b
assert y.shape == (4, 4, 4) and np.allclose(y[:, 1, 2], ref)` },
        ],
      },
    },
    {
      key: "dense",
      rung: "stretch",
      prompt: (
        <p>
          A dense layer maps a 28 × 28 single-channel image to a 26 × 26 × 8 output, with biases. How many parameters does it
          have, compared with 80 for the 3 × 3 convolution doing the same?
        </p>
      ),
      answer: { kind: "numeric", value: 4245280, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        One convolution sees only a small window. Stacking them, and shrinking the image as we go, lets later layers see more
        and more of the picture; the next lesson measures how much.
      </p>
    </>
  ),
};
