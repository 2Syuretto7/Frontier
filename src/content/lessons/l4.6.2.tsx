import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SeparableCostViz } from "@/components/viz/SeparableCostViz";
import type { LessonContent } from "@/lib/types";

const DW = `import numpy as np

def depthwise_conv(x, K):
    k = K.shape[0]
    r = k // 2
    H, W, _ = x.shape
    xp = np.pad(x, ((r, r), (r, r), (0, 0)))
    out = np.zeros_like(x, dtype=float)
    for a in range(k):
        for b in range(k):
            out += xp[a:a + H, b:b + W] * K[a, b]
    return out

def pointwise(x, W):
    return x @ W

def separable(x, Kd, Wp):
    return pointwise(depthwise_conv(x, Kd), Wp)`;

const COUNT = `def conv_params(k, cin, cout):
    return k * k * cin * cout

def separable_params(k, cin, cout):
    return k * k * cin + cin * cout

def convnext_block_params(d, k=7, expand=4):
    return (k * k * d + d) + 2 * d + (d * expand * d + expand * d) + (expand * d * d + d)`;

export const lesson: LessonContent = {
  id: "l4.6.2",
  minutes: 45,
  links: {
    requires: ["l4.1.3", "l4.6.1"],
    revisits: ["l3.5.2", "l3.1.3"],
    foreshadows: ["l4.6.3"],
  },

  puzzle: (
    <>
      <p>
        By 2021 vision transformers had overtaken ResNets on ImageNet, and the received wisdom was that attention had beaten
        convolution. In 2022 a team took a ResNet-50 and changed it step by step, borrowing the transformer&apos;s training
        recipe and a handful of its design habits, but never adding attention. The result, ConvNeXt, matched or beat the
        comparable transformer. Which changes mattered, and what does it say about where the transformer&apos;s advantage came
        from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A transformer block alternates two kinds of mixing: attention mixes information across positions, and an MLP mixes
        across channels within each position. A depthwise convolution does the first job locally, with one small filter per
        channel, and a 1 × 1 convolution does the second, exactly like the transformer&apos;s MLP. Splitting a standard
        convolution into these two pieces cuts its cost so much that the spatial kernel can be made large, which is how a
        modern convolutional block imitates the wide view of attention while keeping translation equivariance.
      </p>
      <SeparableCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="depthwise-separable convolution">
        <p>
          A depthwise convolution with kernel <M>{"D \\in \\mathbb R^{k \\times k \\times C}"}</M> filters each channel separately,{" "}
          <M>{"y_{ij c} = \\sum_{a,b} D_{abc}\\, x_{i+a, j+b, c}"}</M>. A pointwise (1 × 1) convolution with{" "}
          <M>{"P \\in \\mathbb R^{C \\times C'}"}</M> mixes channels at each pixel, <M>{"z_{ij} = y_{ij} P"}</M>. Their composition,
          used in MobileNet and Xception, is the depthwise-separable convolution.
        </p>
        <Code>{DW}</Code>
      </Definition>

      <Theorem title="a factorised kernel">
        <p>
          A depthwise-separable convolution equals a standard convolution with kernel{" "}
          <M>{"K_{abco} = D_{abc}P_{co}"}</M>. Its weight count is <M>{"k^2 C + CC'"}</M> against <M>{"k^2 CC'"}</M>, a ratio of{" "}
          <M>{"1/C' + 1/k^2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"z_{ijo} = \\sum_c P_{co}\\sum_{a,b} D_{abc}x_{i+a,j+b,c} = \\sum_{a,b,c} (D_{abc}P_{co})\\,x_{i+a,j+b,c}"}</M>, which
          is a standard convolution with that kernel. Each slice <M>{"K_{ab\\cdot\\cdot}"}</M> is <M>{"\\operatorname{diag}(D_{ab\\cdot})P"}</M>,
          so all k² slices share the same channel-mixing matrix, a strong restriction. Dividing the counts gives{" "}
          <M>{"(k^2 C + CC')/(k^2 CC') = 1/C' + 1/k^2"}</M>, and multiply-adds per pixel scale the same way.
        </p>
      </Proof>

      <Definition title="the ConvNeXt block">
        <p>
          With input x of width d, a ConvNeXt block computes
        </p>
        <MD>{"x + \\operatorname{Linear}_{4d \\to d}\\bigl(\\operatorname{GELU}(\\operatorname{Linear}_{d \\to 4d}(\\operatorname{LN}(\\operatorname{DWConv}_{7 \\times 7}(x))))\\bigr),"}</MD>
        <p>
          where the linear maps are 1 × 1 convolutions. It has one normalisation and one activation, an inverted bottleneck that
          widens to 4d inside, and a large depthwise kernel in place of attention. The stem is a 4 × 4 convolution with stride 4,
          a patch embedding; stages are separated by 2 × 2 stride-2 downsampling.
        </p>
        <Code>{COUNT}</Code>
      </Definition>

      <Example title="what a bigger kernel costs">
        <p>
          With 256 channels in and out, a standard 7 × 7 convolution has 3,211,264 weights and a separable one 78,080, 41 times
          fewer. Going from 3 × 3 to 7 × 7 in a separable layer of width 96 adds only 3840 weights. A whole ConvNeXt block at width
          96 has 79,200 parameters, 94% of them in the two 1 × 1 layers, just as most of a transformer block&apos;s parameters sit in
          its MLP.
        </p>
      </Example>

      <Remark title="the modernisation, step by step">
        <p>
          In the ConvNeXt study, the transformer training recipe alone (longer training, AdamW, heavy augmentation such as
          Mixup and CutMix, stochastic depth, label smoothing) lifted ResNet-50 from 76.1% to 78.8% top-1 accuracy on ImageNet.
          The patchify stem, depthwise convolutions with a wider network, the inverted bottleneck, 7 × 7 kernels, GELU, fewer
          activations and normalisations, and LayerNorm in place of BatchNorm brought it to 82.0%, against 81.3% for the Swin
          transformer of similar size. Much of the gap had been training, not architecture.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "std",
      rung: "check",
      prompt: <p>How many weights (no bias) does a standard 3 × 3 convolution from 128 to 128 channels have?</p>,
      answer: { kind: "numeric", value: 147456, tolerance: 0.5 },
    },
    {
      key: "sep",
      rung: "check",
      prompt: <p>How many weights (no biases) does the depthwise-separable version of the same layer have?</p>,
      answer: { kind: "numeric", value: 17536, tolerance: 0.5 },
    },
    {
      key: "big",
      rung: "apply",
      prompt: <p>Why can ConvNeXt afford 7 × 7 kernels in every block when ResNets kept to 3 × 3?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because it uses fewer blocks than a ResNet",
          "Because its spatial filters are depthwise, so their cost grows like k²·C instead of k²·C², and the 1 × 1 layers dominate",
          "Because 7 × 7 kernels are computed with the Fourier transform",
          "Because LayerNorm makes large kernels cheaper",
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

def depthwise_conv(x, K):
    k = K.shape[0]
    r = k // 2
    H, W, _ = x.shape
    xp = np.pad(x, ((r, r), (r, r), (0, 0)))
    out = np.zeros_like(x, dtype=float)
    for a in range(k):
        for b in range(k):
            out += xp[a:a + H, b:b + W] * K[a, b]
    return out

def pointwise(x, W):
    return x @ W

def separable(x, Kd, Wp):
    return pointwise(depthwise_conv(x, Kd), Wp)

x = np.zeros((5, 5, 2)); x[2, 2] = [1.0, 2.0]; K = np.zeros((3, 3, 2)); K[:, :, 0] = 1; K[1, 1, 1] = 3
y = depthwise_conv(x, K); print(y.shape, y[:, :, 0].sum(), y[2, 2].tolist(), y[1, 1].tolist())
z = separable(x, K, np.array([[1.0], [1.0]])); print(z.shape, z[2, 2].tolist(), z[0, 0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(5, 5, 2) 9.0 [1.0, 6.0] [1.0, 0.0]\n(5, 5, 1) [7.0] [0.0]",
          "(5, 5, 2) 9.0 [1.0, 6.0] [1.0, 6.0]\n(5, 5, 1) [7.0] [0.0]",
          "(3, 3, 2) 9.0 [1.0, 6.0] [1.0, 0.0]\n(3, 3, 1) [7.0] [0.0]",
          "(5, 5, 2) 1.0 [1.0, 6.0] [0.0, 0.0]\n(5, 5, 1) [7.0] [1.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def conv_params(k, cin, cout):
    return k * k * cin * cout

def separable_params(k, cin, cout):
    return k * k * cin + cin * cout

def convnext_block_params(d, k=7, expand=4):
    return (k * k * d + d) + 2 * d + (d * expand * d + expand * d) + (expand * d * d + d)

print(conv_params(3, 256, 256), separable_params(3, 256, 256), round(conv_params(3, 256, 256) / separable_params(3, 256, 256), 2))
print(separable_params(7, 96, 96) - separable_params(3, 96, 96), convnext_block_params(96))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "589824 67840 8.69\n3840 79200",
          "589824 67840 8.69\n3840 74496",
          "589824 2304 256.0\n3840 79200",
          "65536 67840 0.97\n3840 79200",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>depthwise_conv(x, K)</C> for an (H, W, C) input and an odd (k, k, C) kernel, cross-correlation with zero padding
          that keeps the size, <C>pointwise(x, W)</C> and <C>separable(x, Kd, Wp)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def depthwise_conv(x, K):
    return x

def pointwise(x, W):
    return x

def separable(x, Kd, Wp):
    return x
`,
        solution: DW,
        tests: [
          { name: "depthwise", code: `rng = np.random.default_rng(0); x = rng.normal(size=(6, 7, 3)); K = rng.normal(size=(3, 3, 3)); y = depthwise_conv(x, K); xp = np.pad(x, ((1, 1), (1, 1), (0, 0)))
assert y.shape == x.shape and np.allclose(y[2, 3], (xp[2:5, 3:6] * K).sum(axis=(0, 1))) and np.allclose(y[0, 0], (xp[0:3, 0:3] * K).sum(axis=(0, 1)))` },
          { name: "separable", code: `rng = np.random.default_rng(1); x = rng.normal(size=(5, 5, 2)); Kd, Wp = rng.normal(size=(3, 3, 2)), rng.normal(size=(2, 4)); z = separable(x, Kd, Wp); xp = np.pad(x, ((1, 1), (1, 1), (0, 0)))
Kfull = Kd[:, :, :, None] * Wp[None, None]; assert z.shape == (5, 5, 4) and np.allclose(z[1, 2], np.tensordot(xp[1:4, 2:5], Kfull, axes=3)) and np.allclose(pointwise(x, Wp), x @ Wp)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv_params(k, cin, cout)</C> and <C>separable_params(k, cin, cout)</C> without biases, and{" "}
          <C>convnext_block_params(d, k, expand)</C> counting the depthwise convolution with bias, a LayerNorm (scale and shift),
          and the two 1 × 1 layers with biases.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def conv_params(k, cin, cout):
    return 0

def separable_params(k, cin, cout):
    return 0

def convnext_block_params(d, k=7, expand=4):
    return 0
`,
        solution: COUNT,
        tests: [
          { name: "layers", code: `assert conv_params(5, 3, 8) == 600 and separable_params(5, 3, 8) == 99 and separable_params(1, 4, 4) == 20` },
          { name: "block", code: `assert convnext_block_params(96) == 79200 and convnext_block_params(10, 3, 2) == 90 + 10 + 20 + 220 + 210 and convnext_block_params(768) == 49 * 768 + 768 + 1536 + 2 * 4 * 768 * 768 + 4 * 768 + 768` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          For a 7 × 7 layer from 512 to 512 channels, how many times more weights does the standard convolution have than the
          depthwise-separable one?
        </p>
      ),
      answer: { kind: "numeric", value: 44.72, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        If a convolutional network with a modern recipe matches a transformer, what is the convolution&apos;s built-in
        knowledge worth? The last lesson of the course measures the value of inductive bias as data grows.
      </p>
    </>
  ),
};
