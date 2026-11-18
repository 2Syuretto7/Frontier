import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ArchBudgetViz } from "@/components/viz/ArchBudgetViz";
import type { LessonContent } from "@/lib/types";

const STATS = `import numpy as np

def layer_stats(spec, shape):
    C, H, W = shape; rows = []
    for layer in spec:
        if layer[0] == "conv":
            _, O, k, s, p = layer
            H, W = (H + 2 * p - k) // s + 1, (W + 2 * p - k) // s + 1
            params, macs = O * (C * k * k + 1), O * H * W * C * k * k
            C = O
        elif layer[0] == "pool":
            _, k, s = layer
            H, W = (H - k) // s + 1, (W - k) // s + 1
            params, macs = 0, 0
        else:
            n_in, O = C * H * W, layer[1]
            params, macs = O * (n_in + 1), O * n_in
            C, H, W = O, 1, 1
        rows.append((layer[0], (C, H, W), params, macs))
    return rows

LENET = [("conv", 6, 5, 1, 0), ("pool", 2, 2), ("conv", 16, 5, 1, 0), ("pool", 2, 2), ("fc", 120), ("fc", 84), ("fc", 10)]`;

const BLOCKS = `def stacked_vs_single(n, C):
    return n * 9 * C * C, (2 * n + 1) ** 2 * C * C

def block_params(C, kind, r=4):
    if kind == "basic":
        return 2 * 9 * C * C
    m = C // r
    return C * m + 9 * m * m + m * C`;

export const lesson: LessonContent = {
  id: "l4.1.3",
  minutes: 55,
  links: {
    requires: ["l4.1.2", "l3.5.3"],
    revisits: ["l3.7.2", "l3.5.2"],
    foreshadows: ["l4.6.2", "l4.1.4"],
  },

  puzzle: (
    <>
      <p>
        LeNet-5 read handwritten cheques in 1998 with sixty thousand weights. AlexNet won ImageNet in 2012 with sixty
        million, and VGG-16 pushed to 138 million. ResNet-50 then beat them both with about 25 million weights while being
        fifty layers deep. If more parameters were the secret, ResNet should have lost. Where do the parameters of a CNN
        actually sit, where does its computation go, and which design choices let networks get deeper and better while
        getting smaller?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The history of CNNs is a series of accounting tricks. Small kernels stacked deep see as far as big kernels at a
        fraction of the cost and with more nonlinearity. One-by-one convolutions mix channels cheaply and squeeze the width
        before an expensive layer. Global average pooling throws away the gigantic fully connected head. And residual
        connections make depth trainable at all. Counting parameters and multiply-adds layer by layer shows why each trick
        mattered.
      </p>
      <ArchBudgetViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the classic template">
        <p>
          LeNet-5 alternates 5 × 5 convolutions with 2 × 2 subsampling, then flattens into fully connected layers:{" "}
          <M>{"1{\\times}32{\\times}32 \\to 6{\\times}28{\\times}28 \\to 6{\\times}14{\\times}14 \\to 16{\\times}10{\\times}10 \\to 16{\\times}5{\\times}5 \\to 120 \\to 84 \\to 10"}</M>.
          AlexNet kept the template at scale, adding ReLU activations, dropout in the head, heavy data augmentation and GPU
          training. Channels grow as resolution shrinks, keeping the work per layer roughly balanced.
        </p>
      </Definition>

      <Theorem title="where parameters and computation go">
        <p>
          A k × k convolution from C to O channels producing an H × W map has <M>{"O(Ck^2 + 1)"}</M> parameters and{" "}
          <M>{"OHWCk^2"}</M> multiply-adds; a fully connected layer from n inputs to O outputs has{" "}
          <M>{"O(n + 1)"}</M> parameters and On multiply-adds. Convolutions therefore cost compute in proportion to the map
          size but parameters independently of it, and the opposite holds for the flattening layer.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the OHW outputs of a convolution is a dot product of length <M>{"Ck^2"}</M>, while the weights are shared
          across positions. A fully connected layer uses each weight once per example. In AlexNet the three fully connected
          layers hold 94 per cent of the 62 million parameters, while the convolutions perform 95 per cent of the 1.1 billion
          multiply-adds; the first fully connected layer alone has <M>{"9216 \\times 4096 + 4096"}</M> weights.
        </p>
        <Code>{STATS}</Code>
      </Proof>

      <Theorem title="small kernels, stacked">
        <p>
          n stacked 3 × 3 convolutions at C channels have the receptive field of one <M>{"(2n + 1) \\times (2n + 1)"}</M>{" "}
          convolution but <M>{"9nC^2"}</M> weights instead of <M>{"(2n + 1)^2C^2"}</M>, and n nonlinearities instead of one.
        </p>
      </Theorem>
      <Proof>
        <p>
          The receptive field follows from the recursion of the previous lesson, <M>{"1 + 2n"}</M>. Each layer has{" "}
          <M>{"9C^2"}</M> weights. Two layers cost 18C² against 25C², three cost 27C² against 49C². The stacked version is a
          restricted family, since a product of small convolutions cannot represent every large kernel, but the restriction
          is a useful prior and the extra nonlinearities add expressiveness. VGG built entire networks from 3 × 3 layers.
        </p>
      </Proof>

      <Example title="one-by-one convolutions and bottlenecks">
        <p>
          A 1 × 1 convolution is a linear layer applied to the channel vector at each pixel. Network in Network and the Inception
          modules used it to cut the channel count before expensive 3 × 3 and 5 × 5 convolutions. The ResNet bottleneck block
          does the same at 256 channels: 1 × 1 down to 64, 3 × 3 at 64, 1 × 1 back up to 256, for{" "}
          <M>{"256 \\cdot 64 + 9 \\cdot 64^2 + 64 \\cdot 256 = 69{,}632"}</M> weights, slightly fewer than a basic two-layer block
          at only 64 channels (73,728), and sixteen times fewer than a basic block at 256 (1,179,648).
        </p>
        <Code>{BLOCKS}</Code>
      </Example>

      <Remark title="what made depth work">
        <p>
          VGG stalled near 19 layers: deeper plain networks trained worse, not just slower. Batch normalisation stabilised the
          signal statistics, and residual connections, from the earlier lesson, gave gradients an identity path, so ResNets
          reached 152 layers and beyond. Replacing the fully connected head with global average pooling removed most of the
          parameters and made the network accept any input size. The ImageNet top-5 error fell from about 26 per cent before
          AlexNet to under 4 per cent with deep residual networks.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: <p>Two stacked 3 × 3 convolutions replace one 5 × 5 convolution at the same channel count. What fraction of the weights do they need?</p>,
      answer: { kind: "numeric", value: 0.72, tolerance: 0.0001 },
    },
    {
      key: "macs",
      rung: "check",
      prompt: <p>How many multiply-adds does a 1 × 1 convolution from 256 to 64 channels perform on a 56 × 56 map?</p>,
      answer: { kind: "numeric", value: 51380224, tolerance: 0.5 },
    },
    {
      key: "gap",
      rung: "apply",
      prompt: <p>Why did later CNNs replace the large fully connected head with global average pooling?</p>,
      answer: {
        kind: "choice",
        options: [
          "The head held most of the parameters, inviting overfitting, and pooling removes them while letting the network accept any input size",
          "Fully connected layers cannot be trained with backpropagation",
          "The head did most of the computation",
          "Pooling increases the receptive field of the convolutions",
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

def layer_stats(spec, shape):
    C, H, W = shape; rows = []
    for layer in spec:
        if layer[0] == "conv":
            _, O, k, s, p = layer
            H, W = (H + 2 * p - k) // s + 1, (W + 2 * p - k) // s + 1
            params, macs = O * (C * k * k + 1), O * H * W * C * k * k
            C = O
        elif layer[0] == "pool":
            _, k, s = layer
            H, W = (H - k) // s + 1, (W - k) // s + 1
            params, macs = 0, 0
        else:
            n_in, O = C * H * W, layer[1]
            params, macs = O * (n_in + 1), O * n_in
            C, H, W = O, 1, 1
        rows.append((layer[0], (C, H, W), params, macs))
    return rows

LENET = [("conv", 6, 5, 1, 0), ("pool", 2, 2), ("conv", 16, 5, 1, 0), ("pool", 2, 2), ("fc", 120), ("fc", 84), ("fc", 10)]

rows = layer_stats(LENET, (1, 32, 32)); print([r[1] for r in rows[:4]])
print(sum(r[2] for r in rows), rows[2][2], rows[4][2])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[(6, 28, 28), (6, 14, 14), (16, 10, 10), (16, 5, 5)]\n61706 2416 48120",
          "[(6, 28, 28), (6, 14, 14), (16, 10, 10), (16, 5, 5)]\n61706 2400 48000",
          "[(6, 32, 32), (6, 16, 16), (16, 16, 16), (16, 8, 8)]\n61706 2416 48120",
          "[(6, 28, 28), (6, 14, 14), (16, 10, 10), (16, 5, 5)]\n416520 2416 48120",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def stacked_vs_single(n, C):
    return n * 9 * C * C, (2 * n + 1) ** 2 * C * C

def block_params(C, kind, r=4):
    if kind == "basic":
        return 2 * 9 * C * C
    m = C // r
    return C * m + 9 * m * m + m * C

print(stacked_vs_single(2, 64), stacked_vs_single(3, 64))
print(block_params(256, "basic"), block_params(256, "bottleneck"), block_params(64, "basic"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(73728, 102400) (110592, 200704)\n1179648 69632 73728",
          "(73728, 102400) (110592, 200704)\n1179648 73728 69632",
          "(73728, 73728) (110592, 110592)\n1179648 69632 73728",
          "(36864, 102400) (55296, 200704)\n1179648 69632 73728",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_stats(spec, shape)</C>, which walks a list of layers, each (&quot;conv&quot;, out, k, stride, pad),
          (&quot;pool&quot;, k, stride) or (&quot;fc&quot;, out), from an input shape (C, H, W), and returns for each layer its kind,
          output shape, parameter count and multiply-add count.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def layer_stats(spec, shape):
    return []

LENET = [("conv", 6, 5, 1, 0), ("pool", 2, 2), ("conv", 16, 5, 1, 0), ("pool", 2, 2), ("fc", 120), ("fc", 84), ("fc", 10)]
`,
        solution: STATS,
        tests: [
          { name: "lenet", code: `rows = layer_stats(LENET, (1, 32, 32)); assert len(rows) == 7 and sum(r[2] for r in rows) == 61706 and sum(r[3] for r in rows) == 416520 and rows[-1][1] == (10, 1, 1)` },
          { name: "custom", code: `r = layer_stats([("conv", 8, 3, 2, 1), ("pool", 2, 2), ("conv", 4, 1, 1, 0), ("fc", 5)], (3, 16, 16))
assert [x[1] for x in r] == [(8, 8, 8), (8, 4, 4), (4, 4, 4), (5, 1, 1)] and [x[2] for x in r] == [224, 0, 36, 325] and [x[3] for x in r] == [13824, 0, 512, 320]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stacked_vs_single(n, C)</C>, returning the weight counts, without biases, of n stacked 3 × 3 convolutions and
          of the single convolution with the same receptive field, and <C>block_params(C, kind, r)</C> for a basic residual block
          (two 3 × 3 layers) or a bottleneck block with inner width C / r.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def stacked_vs_single(n, C):
    return 0, 0

def block_params(C, kind, r=4):
    return 0
`,
        solution: BLOCKS,
        tests: [
          { name: "stack", code: `assert stacked_vs_single(1, 10) == (900, 900) and stacked_vs_single(4, 2) == (144, 324)` },
          { name: "blocks", code: `assert block_params(128, "basic") == 294912 and block_params(512, "bottleneck") == 278528 and block_params(64, "bottleneck", 2) == 13312` },
        ],
      },
    },
    {
      key: "fc6",
      rung: "stretch",
      prompt: <p>AlexNet flattens a 256 × 6 × 6 map into a fully connected layer of 4096 units. How many parameters does that one layer have?</p>,
      answer: { kind: "numeric", value: 37752832, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        We can now count what a CNN contains. The next lesson asks what it has learned: what its filters respond to, what its
        units detect, and how to look inside without fooling ourselves.
      </p>
    </>
  ),
};
