import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ReceptiveFieldViz } from "@/components/viz/ReceptiveFieldViz";
import type { LessonContent } from "@/lib/types";

const POOL = `import numpy as np

def pool2d(x, k, s, op=np.max):
    H, W = (x.shape[0] - k) // s + 1, (x.shape[1] - k) // s + 1
    return np.array([[op(x[i * s:i * s + k, j * s:j * s + k]) for j in range(W)] for i in range(H)])

def receptive_field(layers):
    r, j = 1, 1
    for k, s, d in layers:
        r += (k - 1) * d * j
        j *= s
    return r, j`;

const ERF = `import numpy as np

def erf_profile(L, k=3):
    w = np.array([1.0])
    for _ in range(L):
        w = np.convolve(w, np.ones(k) / k)
    return w

def spread(w):
    x = np.arange(len(w)) - (len(w) - 1) / 2
    return float(np.sqrt((w * x ** 2).sum() / w.sum()))`;

export const lesson: LessonContent = {
  id: "l4.1.2",
  minutes: 50,
  links: {
    requires: ["l4.1.1"],
    revisits: ["m7.7.2"],
    foreshadows: ["l4.1.3", "l4.6.2"],
  },

  puzzle: (
    <>
      <p>
        A 3 × 3 kernel sees nine pixels. To tell a dog from a wolf, a network must eventually combine evidence from across the
        whole animal, hundreds of pixels apart. Stacking ten such layers lets one unit see a 21 × 21 window, in principle. Yet
        experiments show the unit barely attends to most of that window. How fast does the region a unit can see grow with
        depth, how fast does the region it actually uses grow, and what can make either grow faster?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every layer widens what a unit can see by the kernel width minus one, measured in the current layer&apos;s pixel
        spacing. Downsampling, by pooling or stride, doubles that spacing, so later layers widen their view much faster.
        Within the region a unit can see, though, the paths from input to output are far more numerous through the middle
        than through the edges, so influence concentrates like a bell curve: a central limit theorem in disguise. Pooling adds
        a little tolerance to small shifts, and global pooling at the end turns a map of features into one vector.
      </p>
      <ReceptiveFieldViz />
    </>
  ),

  theory: (
    <>
      <Definition title="pooling">
        <p>
          A k × k pooling layer with stride s replaces each window by its maximum (max pooling) or mean (average pooling),
          channel by channel, with no learned parameters. Global average pooling averages each channel over the whole map,
          giving one number per channel.
        </p>
      </Definition>

      <Theorem title="receptive field recursion">
        <p>
          For a stack of layers with kernel sizes <M>{"k_l"}</M>, strides <M>{"s_l"}</M> and dilations <M>{"d_l"}</M>, set{" "}
          <M>{"r_0 = 1"}</M>, <M>{"j_0 = 1"}</M> and
        </p>
        <MD>{"r_l = r_{l-1} + (k_l - 1)\\,d_l\\,j_{l-1}, \\qquad j_l = j_{l-1}s_l."}</MD>
        <p>
          Then a unit after layer L depends on exactly <M>{"r_L"}</M> consecutive input positions along each axis, and
          neighbouring units are <M>{"j_L"}</M> input positions apart.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction. Units of layer l − 1 are <M>{"j_{l-1}"}</M> input positions apart, each seeing{" "}
          <M>{"r_{l-1}"}</M> positions. A unit of layer l combines <M>{"k_l"}</M> of them spaced <M>{"d_l"}</M> units apart, so
          the first and last are <M>{"(k_l - 1)d_lj_{l-1}"}</M> input positions apart, and the union of their fields has the
          stated length. Taking every <M>{"s_l"}</M>-th unit multiplies the spacing by <M>{"s_l"}</M>. Three 3 × 3 layers see 7 × 7;
          a ResNet-style stem (7 × 7 stride 2, then 3 × 3 pooling stride 2) followed by two 3 × 3 convolutions already sees 27 × 27.
        </p>
        <Code>{POOL}</Code>
      </Proof>

      <Theorem title="the effective receptive field grows like the square root of depth">
        <p>
          For L layers of k-wide uniform averaging kernels, the influence of input position u on the central output is the
          L-fold convolution of the uniform distribution on k points, which has standard deviation{" "}
          <M>{"\\sqrt{L(k^2 - 1)/12}"}</M>, while the theoretical receptive field has width L(k − 1) + 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The output is linear in the input, and its weight on position u is the sum over all paths through the layers, which
          is the probability that a sum of L independent uniform offsets equals u. Variances of independent offsets add, and a
          uniform distribution on k consecutive integers has variance <M>{"(k^2 - 1)/12"}</M>, which is 2/3 for k = 3. By the
          central limit theorem the profile approaches a Gaussian, so the fraction of the theoretical field carrying real
          weight shrinks like <M>{"1/\\sqrt L"}</M>. With learned, non-uniform kernels and nonlinearities the same picture holds
          approximately, and training widens the effective field somewhat.
        </p>
        <Code>{ERF}</Code>
      </Proof>

      <Example title="pooling and small shifts">
        <p>
          Max pooling over a 2 × 2 window reports the strongest response in the window, so moving a feature by one pixel
          inside the window leaves the output unchanged: local invariance. But a shift that crosses a window boundary changes
          which window fires, so the invariance is partial and depends on alignment. Average pooling smooths rather than
          selects, and blurs before it subsamples, which reduces aliasing.
        </p>
      </Example>

      <Remark title="growing the field faster">
        <p>
          Three tools enlarge receptive fields cheaply. Downsampling multiplies the jump, so every later layer covers more
          ground; most CNNs halve the resolution four or five times. Dilated convolutions insert gaps in the kernel, and
          doubling the dilation each layer gives exponential growth at full resolution, which is why they are used in
          segmentation and in WaveNet for audio. Global pooling or attention gives every unit the whole input at once, at the
          price of losing locality or paying quadratic cost.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rf",
      rung: "check",
      prompt: <p>What is the receptive field of a unit after five 3 × 3 convolutions with stride 1 and no pooling?</p>,
      answer: { kind: "numeric", value: 11, tolerance: 0.0001 },
    },
    {
      key: "jump",
      rung: "check",
      prompt: (
        <p>
          A 3 × 3 convolution with stride 2 is followed by two 3 × 3 convolutions with stride 1. What is the receptive field of a
          unit in the final layer?
        </p>
      ),
      answer: { kind: "numeric", value: 11, tolerance: 0.0001 },
    },
    {
      key: "erf",
      rung: "apply",
      prompt: <p>Why does the effective receptive field of a deep stack grow more slowly than its theoretical receptive field?</p>,
      answer: {
        kind: "choice",
        options: [
          "Many more paths connect the centre of the field to the output than connect the edges, so influence concentrates in the middle and spreads like a sum of random offsets",
          "Pooling discards the edges of the field",
          "Zero padding removes the outer inputs",
          "ReLU units are dead at the edges",
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

def pool2d(x, k, s, op=np.max):
    H, W = (x.shape[0] - k) // s + 1, (x.shape[1] - k) // s + 1
    return np.array([[op(x[i * s:i * s + k, j * s:j * s + k]) for j in range(W)] for i in range(H)])

def receptive_field(layers):
    r, j = 1, 1
    for k, s, d in layers:
        r += (k - 1) * d * j
        j *= s
    return r, j

x = np.array([[1.0, 3.0, 2.0, 0.0], [4.0, 0.0, 1.0, 5.0], [0.0, 2.0, 7.0, 1.0], [1.0, 1.0, 0.0, 3.0]]); print(pool2d(x, 2, 2).tolist(), pool2d(x, 2, 2, np.mean).tolist())
print(receptive_field([(3, 1, 1)] * 3), receptive_field([(7, 2, 1), (3, 2, 1), (3, 1, 1), (3, 1, 1)]), receptive_field([(3, 1, 1), (3, 1, 2), (3, 1, 4)]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[4.0, 5.0], [2.0, 7.0]] [[2.0, 2.0], [1.0, 2.75]]\n(7, 1) (27, 4) (15, 1)",
          "[[4.0, 5.0], [2.0, 7.0]] [[2.0, 2.0], [1.0, 2.75]]\n(7, 1) (19, 4) (15, 1)",
          "[[4.0, 5.0], [2.0, 7.0]] [[2.0, 2.0], [1.0, 2.75]]\n(7, 1) (27, 4) (7, 1)",
          "[[3.0, 5.0], [2.0, 7.0]] [[2.0, 2.0], [1.0, 2.75]]\n(9, 1) (27, 4) (15, 1)",
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

def erf_profile(L, k=3):
    w = np.array([1.0])
    for _ in range(L):
        w = np.convolve(w, np.ones(k) / k)
    return w

def spread(w):
    x = np.arange(len(w)) - (len(w) - 1) / 2
    return float(np.sqrt((w * x ** 2).sum() / w.sum()))

print([len(erf_profile(L)) for L in (1, 4, 16)], [round(spread(erf_profile(L)), 2) for L in (1, 4, 16)])
w = erf_profile(10); print(round(float(w[10]), 3), bool(w[0] / w[10] < 1e-3), round(float(w.sum()), 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3, 9, 33] [0.82, 1.63, 3.27]\n0.152 True 1.0",
          "[3, 9, 33] [0.82, 3.27, 13.06]\n0.152 True 1.0",
          "[3, 7, 31] [0.82, 1.63, 3.27]\n0.152 True 1.0",
          "[3, 9, 33] [0.82, 1.63, 3.27]\n0.048 True 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pool2d(x, k, s, op)</C>, pooling a 2-D array with k × k windows and stride s using the reduction op, and{" "}
          <C>receptive_field(layers)</C>, taking a list of (kernel, stride, dilation) triples and returning the receptive field
          and the jump.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pool2d(x, k, s, op=np.max):
    return x

def receptive_field(layers):
    return 1, 1
`,
        solution: POOL,
        tests: [
          { name: "pool", code: `x = np.arange(25.0).reshape(5, 5); assert pool2d(x, 3, 2).tolist() == [[12.0, 14.0], [22.0, 24.0]] and pool2d(x, 2, 1, np.mean).shape == (4, 4) and pool2d(x, 2, 1, np.mean)[0, 0] == 3.0` },
          { name: "rf", code: `assert receptive_field([(3, 2, 1), (3, 1, 1), (3, 1, 1)]) == (11, 2) and receptive_field([(5, 1, 1), (2, 2, 1), (3, 1, 3)]) == (18, 2) and receptive_field([]) == (1, 1)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>erf_profile(L, k)</C>, the weights of the input positions on one output after L layers of k-wide uniform
          averaging kernels, and <C>spread(w)</C>, the standard deviation of the position under those weights about the centre.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def erf_profile(L, k=3):
    return np.ones(L * (k - 1) + 1)

def spread(w):
    return 0.0
`,
        solution: ERF,
        tests: [
          { name: "profile", code: `w = erf_profile(2, 3); assert np.allclose(w, np.array([1, 2, 3, 2, 1]) / 9) and len(erf_profile(5, 5)) == 21 and abs(erf_profile(7, 4).sum() - 1) < 1e-12` },
          { name: "spread", code: `assert abs(spread(erf_profile(9, 3)) - np.sqrt(6)) < 1e-9 and abs(spread(erf_profile(3, 5)) - np.sqrt(6)) < 1e-9` },
        ],
      },
    },
    {
      key: "dil",
      rung: "stretch",
      prompt: <p>Four 3 × 3 convolutions with stride 1 have dilations 1, 2, 4 and 8. What is the receptive field of the last layer?</p>,
      answer: { kind: "numeric", value: 31, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Convolution, nonlinearity, pooling, repeat: that recipe carried image recognition from handwritten digits to ImageNet.
        The next lesson follows the architectures that refined it, and the one idea that let them grow to hundreds of layers.
      </p>
    </>
  ),
};
