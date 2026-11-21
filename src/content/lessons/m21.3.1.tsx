import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StrideAliasViz } from "@/components/viz/StrideAliasViz";
import type { LessonContent } from "@/lib/types";

const CONV = `import numpy as np

def conv2d_circ(img, k):
    out = np.zeros(img.shape)
    for (a, b), w in np.ndenumerate(k):
        out += w * np.roll(img, (a, b), axis=(0, 1))          # (f * k)(x) = sum_y k(y) f(x - y), wrapping round
    return out

def shift(img, t):
    return np.roll(img, t, axis=(0, 1))

def kernel_of(W, shape):
    delta = np.zeros(shape)
    delta[0, 0] = 1.0
    return W(delta)                                           # an equivariant linear W is convolution with W(delta)`;

const STRIDE = `import numpy as np

def strided_conv(x, k, s):
    n = len(x)
    full = np.array([sum(k[j] * x[(i - j) % n] for j in range(len(k))) for i in range(n)])
    return full[::s]                                          # keep every s-th output

def stride_gap(x, k, s, t):
    a = strided_conv(np.roll(x, t), k, s)
    b = np.roll(strided_conv(x, k, s), t // s)
    return float(np.max(np.abs(a - b)))                       # zero when shifting commutes with the layer

def blurpool(x, s):
    return strided_conv(x, np.ones(s) / s, s)                 # average before subsampling`;

export const lesson: LessonContent = {
  id: "m21.3.1",
  minutes: 50,
  links: {
    requires: ["m21.2.3", "l4.1.1"],
    revisits: ["m6.6.3", "l4.1.2"],
    foreshadows: ["m21.3.2"],
  },

  puzzle: (
    <>
      <p>
        Convolutional networks were introduced because convolutions respond to a pattern wherever it appears. But is convolution
        merely one way to get translation equivariance, or the only way? And if CNNs are equivariant by design, why does shifting
        an image by a single pixel change the predictions of a trained ResNet noticeably, while shifting by 32 pixels hardly
        does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A linear map that commutes with shifts is pinned down by what it does to a single bright pixel: every other image is a sum
        of shifted bright pixels, so its output is the same sum of shifted copies of that response. That is the definition of
        convolution, so convolutions are the only translation-equivariant linear layers. Equivariance survives pointwise
        nonlinearities, but not subsampling: keeping every second output commutes only with shifts by an even number of pixels.
      </p>
      <StrideAliasViz />
    </>
  ),

  theory: (
    <>
      <Definition title="translations and convolution on a group">
        <p>
          A group G acts on functions on G by left translation, <M>{"(L_u f)(g) = f(u^{-1}g)"}</M> (m21.1.2). For images on the
          discrete torus <M>{"G = \\mathbb{Z}_h \\times \\mathbb{Z}_w"}</M> this is the circular shift (<C>shift</C>), and the
          convolution <M>{"(f * k)(x) = \\sum_y k(y) f(x - y)"}</M> wraps round the edges (<C>conv2d_circ</C>). Deep learning
          libraries compute the cross-correlation <M>{"\\sum_y k(y) f(x + y)"}</M>, which is convolution with the flipped kernel;
          since the kernel is learned, the distinction does not matter.
        </p>
        <Code>{CONV}</Code>
      </Definition>

      <Theorem title="equivariant linear maps are convolutions">
        <p>
          A linear map W on functions on a finite group G satisfies <M>{"WL_u = L_uW"}</M> for all u if and only if{" "}
          <M>{"Wf = f * k"}</M> with <M>{"(f * k)(g) = \\sum_u f(u)k(u^{-1}g)"}</M>, and then k = W(δ), the response to the indicator δ
          of the identity (<C>kernel_of</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"\\delta_u = L_u\\delta"}</M> for the indicator of u, so <M>{"f = \\sum_u f(u)\\, L_u\\delta"}</M>. If W is linear
          and equivariant, <M>{"Wf = \\sum_u f(u)\\, L_u W\\delta = \\sum_u f(u)\\, L_u k"}</M>, and{" "}
          <M>{"(L_uk)(g) = k(u^{-1}g)"}</M>, which is the formula. Conversely,{" "}
          <M>{"((L_vf) * k)(g) = \\sum_u f(v^{-1}u)k(u^{-1}g) = \\sum_w f(w)k(w^{-1}v^{-1}g) = (f*k)(v^{-1}g)"}</M>, substituting u =
          vw. So the space of equivariant linear maps has dimension |G|, against <M>{"|G|^2"}</M> for all linear maps; on the
          cyclic group these are the circulant matrices of m6.6.3, which the Fourier modes diagonalise with eigenvalues{" "}
          <M>{"\\hat k(m)"}</M> (m21.2.3).
        </p>
      </Proof>

      <Theorem title="locality and depth">
        <p>
          If k is supported on a window of radius r, then (f * k)(x) depends only on f within distance r of x. A stack of L such
          layers with pointwise nonlinearities between them is translation equivariant, and each output depends on a window of
          radius Lr.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first claim is the formula with k(y) = 0 for |y| &gt; r. Equivariance of the stack is the blueprint of m21.1.3,
          since a pointwise function σ satisfies <M>{"\\sigma(L_uf) = L_u\\sigma(f)"}</M>. Windows add under composition, which is
          the receptive field growth of l4.1.2.
        </p>
      </Proof>

      <Theorem title="subsampling breaks equivariance">
        <p>
          Let <M>{"D_s"}</M> keep every s-th sample of a signal on <M>{"\\mathbb{Z}_n"}</M>, with s dividing n. Then{" "}
          <M>{"D_s L_{st} = L_t D_s"}</M> for every t, but <M>{"D_s L_1"}</M> is not of the form <M>{"L_t D_s"}</M> for s &gt; 1. A
          strided convolution <M>{"D_s(f * k)"}</M> is therefore equivariant only to shifts by multiples of s
          (<C>strided_conv</C>, <C>stride_gap</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(D_sL_{st}f)(i) = f(si - st) = (D_sf)(i - t)"}</M>. For the second claim take f = δ at position s − 1. Since s − 1 is not a multiple of s,{" "}
          <M>{"D_sf = 0"}</M>, so <M>{"L_tD_sf = 0"}</M> for every t. But <M>{"L_1f"}</M> is δ at position s, and{" "}
          <M>{"D_s"}</M> of it is δ at position 1, which is not zero. The information discarded by
          subsampling depends on the phase of the input relative to the sampling grid, which is aliasing.
        </p>
        <Code>{STRIDE}</Code>
      </Proof>

      <Example title="what this means for trained networks">
        <p>
          A ResNet subsamples five times by a factor of 2, so it is exactly equivariant only to shifts by multiples of 32 pixels, and
          its global average pool makes it invariant to those. Azulay and Weiss found that shifting an input by a single pixel
          changed the top-1 prediction of standard ImageNet networks for a substantial fraction of images. Zhang proposed blurring
          before subsampling (<C>blurpool</C>), a low-pass filter that reduces aliasing and improved consistency under shifts; exact
          equivariance under all shifts needs subsampling schemes that choose the sampling phase from the input itself.
        </p>
      </Example>

      <Remark title="boundaries and padding">
        <p>
          Real images are not periodic. Zero padding at the border breaks equivariance near the edges, and networks can exploit
          this to learn absolute position, as experiments with CNNs predicting the location of a pixel have shown. On the torus,
          everything in this lesson is exact; on a finite grid it holds away from the boundary.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "count",
      rung: "check",
      prompt: (
        <p>
          How many independent weights does the most general linear map from 32 × 32 single-channel images to themselves have if it
          must commute with every circular shift?
        </p>
      ),
      answer: { kind: "numeric", value: 1024, tolerance: 0 },
    },
    {
      key: "eig",
      rung: "check",
      prompt: (
        <p>
          Circular convolution with the kernel k = (6, 2, 1, 2) on <M>{"\\mathbb{Z}_4"}</M> is a circulant matrix. What is its
          eigenvalue for the Fourier mode of frequency 1?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.0005 },
    },
    {
      key: "alias",
      rung: "apply",
      prompt: <p>Why can a trained CNN with stride-2 layers change its prediction when the input is shifted by one pixel?</p>,
      answer: {
        kind: "choice",
        options: [
          "Subsampling commutes only with shifts by multiples of the stride, so a one-pixel shift changes which values are kept rather than shifting the feature maps",
          "Because convolution is not translation equivariant",
          "Because ReLU breaks translation equivariance",
          "Because the global average pool is not invariant",
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

def conv2d_circ(img, k):
    out = np.zeros(img.shape)
    for (a, b), w in np.ndenumerate(k):
        out += w * np.roll(img, (a, b), axis=(0, 1))          # (f * k)(x) = sum_y k(y) f(x - y), wrapping round
    return out

def shift(img, t):
    return np.roll(img, t, axis=(0, 1))

def kernel_of(W, shape):
    delta = np.zeros(shape)
    delta[0, 0] = 1.0
    return W(delta)                                           # an equivariant linear W is convolution with W(delta)

img = np.zeros((3, 3)); img[0, 1] = 1.0; k = np.array([[1.0, 2.0]])
print(conv2d_circ(img, k).tolist(), np.array_equal(conv2d_circ(shift(img, (1, 0)), k), shift(conv2d_circ(img, k), (1, 0))), kernel_of(lambda f: 3 * np.roll(f, 1, axis=1), (1, 3)).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 1.0, 2.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] True [[0.0, 3.0, 0.0]]",
          "[[2.0, 1.0, 0.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] True [[0.0, 3.0, 0.0]]",
          "[[0.0, 1.0, 2.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] False [[0.0, 3.0, 0.0]]",
          "[[0.0, 1.0, 2.0], [0.0, 0.0, 0.0], [0.0, 0.0, 0.0]] True [[3.0, 0.0, 0.0]]",
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

def strided_conv(x, k, s):
    n = len(x)
    full = np.array([sum(k[j] * x[(i - j) % n] for j in range(len(k))) for i in range(n)])
    return full[::s]                                          # keep every s-th output

def stride_gap(x, k, s, t):
    a = strided_conv(np.roll(x, t), k, s)
    b = np.roll(strided_conv(x, k, s), t // s)
    return float(np.max(np.abs(a - b)))                       # zero when shifting commutes with the layer

def blurpool(x, s):
    return strided_conv(x, np.ones(s) / s, s)                 # average before subsampling

x = np.array([1.0, 0.0, 0.0, 0.0, 0.0, 0.0]); k = np.array([1.0, 1.0])
print(strided_conv(x, k, 2).tolist(), stride_gap(x, k, 2, 2), stride_gap(x, k, 2, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[1.0, 0.0, 0.0] 0.0 1.0", "[1.0, 0.0, 0.0] 1.0 0.0", "[1.0, 1.0, 0.0] 0.0 1.0", "[1.0, 0.0, 0.0] 0.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv2d_circ(img, k)</C> computing <M>{"\\sum_y k(y)f(x - y)"}</M> with wrap-around, <C>shift(img, t)</C> for a
          pair t, and <C>kernel_of(W, shape)</C>, the kernel of an equivariant linear map W.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def conv2d_circ(img, k):
    return img * k.sum()

def shift(img, t):
    return img

def kernel_of(W, shape):
    return np.zeros(shape)
`,
        solution: CONV,
        tests: [
          { name: "conv", code: `f = np.zeros((2, 3)); f[0, 0] = 1.0\nassert np.allclose(conv2d_circ(f, np.array([[1.0, 2.0]])), [[1.0, 2.0, 0.0], [0.0, 0.0, 0.0]])\nassert np.allclose(shift(f, (1, 2)), np.roll(f, (1, 2), axis=(0, 1)))` },
          { name: "kernel", code: `r = np.random.default_rng(0); K = r.normal(size=(3, 4)); f = r.normal(size=(3, 4))\nW = lambda g: conv2d_circ(g, K)\nassert np.allclose(kernel_of(W, (3, 4)), K) and np.allclose(conv2d_circ(f, kernel_of(W, (3, 4))), W(f))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          On <M>{"\\mathbb{Z}_n"}</M>, write <C>strided_conv(x, k, s)</C>, a circular convolution followed by keeping every s-th
          output, <C>stride_gap(x, k, s, t)</C>, the largest difference between the layer applied to the input shifted by t and its
          output shifted by t // s, and <C>blurpool(x, s)</C>, averaging over s consecutive samples before subsampling.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def strided_conv(x, k, s):
    return x[::s]

def stride_gap(x, k, s, t):
    return 0.0

def blurpool(x, s):
    return x[::s]
`,
        solution: STRIDE,
        tests: [
          { name: "stride", code: `assert np.allclose(strided_conv(np.array([1.0, 2.0, 3.0, 4.0]), np.array([1.0, -1.0]), 2), [-3.0, 1.0])\nassert stride_gap(np.array([1.0, 0.0, 0.0, 0.0]), np.array([1.0]), 2, 1) == 1.0` },
          { name: "blur", code: `assert np.allclose(blurpool(np.array([1.0, 3.0, 5.0, 7.0]), 2), [4.0, 4.0])` },
        ],
      },
    },
    {
      key: "grid",
      rung: "stretch",
      prompt: (
        <p>
          A layer on 32 × 32 images on the torus convolves and then keeps every second row and every second column. For a generic
          kernel, how many of the 1024 circular shifts of the input does it commute with, in the sense that the output is a shift
          of the original output?
        </p>
      ),
      answer: { kind: "numeric", value: 256, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Convolution came from translations acting on the plane. The next lesson replaces translations by any group, rotations and
        reflections included, and builds group convolutions, whose feature maps live on the group itself.
      </p>
    </>
  ),
};
