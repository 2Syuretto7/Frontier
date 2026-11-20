import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BlindSpotViz } from "@/components/viz/BlindSpotViz";
import type { LessonContent } from "@/lib/types";

const PIXEL = `def causal_mask(k, kind):
    c = k // 2
    return [[1 if i < c or (i == c and (j < c or (kind == "B" and j == c))) else 0 for j in range(k)] for i in range(k)]

def masked_conv(img, w, mask):
    H, W, k = len(img), len(img[0]), len(w)
    c = k // 2
    out = [[0.0] * W for _ in range(H)]
    for r in range(H):
        for s in range(W):
            for i in range(k):
                for j in range(k):
                    rr, ss = r + i - c, s + j - c
                    if mask[i][j] and 0 <= rr < H and 0 <= ss < W:
                        out[r][s] += w[i][j] * img[rr][ss]
    return out

def receptive_field(r, s, layers):
    seen = {(r, s)}
    for kind in ["B"] * (layers - 1) + ["A"]:
        m = causal_mask(3, kind)
        seen = {(p + i - 1, q + j - 1) for p, q in seen for i in range(3) for j in range(3) if m[i][j]}
    return seen`;

const WAVE = `import math

def dilated_causal_conv(x, w, d):
    k = len(w)
    return [sum(w[i] * x[t - (k - 1 - i) * d] for i in range(k) if t - (k - 1 - i) * d >= 0) for t in range(len(x))]

def receptive_field_len(k, dilations):
    return 1 + sum((k - 1) * d for d in dilations)

def mu_law_encode(x, mu=255):
    y = math.copysign(math.log1p(mu * abs(x)) / math.log1p(mu), x)
    return int((y + 1) / 2 * mu + 0.5)`;

export const lesson: LessonContent = {
  id: "l7.2.2",
  minutes: 45,
  links: {
    requires: ["l7.2.1", "l4.1.1", "l4.1.2"],
    revisits: ["l4.1.3", "l7.1.3"],
    foreshadows: ["l7.2.3", "l7.3.4", "l12.6.3"],
  },

  puzzle: (
    <>
      <p>
        One second of telephone-quality audio is 16 000 numbers, and a spoken word depends on sounds a quarter of a second
        earlier, four thousand samples back. A network that predicts each sample from the previous four thousand with ordinary
        layers would be enormous and slow. In 2016 WaveNet produced the most natural synthetic speech then heard by predicting
        audio one sample at a time. How can a convolutional network look that far back cheaply?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Apply the chain rule to an image in raster order, row by row and left to right, and each pixel is predicted from all
        pixels above it and to its left. A convolution can compute every such prediction at once if its kernel is masked so
        that it never touches the current pixel or anything after it. Stacking masked layers widens what each prediction can
        see, but a careless stack leaves a blind spot.
      </p>
      <p>
        For sound the order is time. A <em>causal</em> convolution looks only backwards, and a <em>dilated</em> one skips
        samples, looking at inputs 1, 2, 4, 8 and more steps back in successive layers, so the range of view doubles with each
        layer while the cost grows only linearly.
      </p>
      <BlindSpotViz />
    </>
  ),

  theory: (
    <>
      <Definition title="masked convolution">
        <p>
          PixelCNN (van den Oord and others, 2016) models <M>{"p(x) = \\prod_i p(x_i \\mid x_{<i})"}</M> over pixels in raster
          order with a stack of convolutions whose k by k kernels are multiplied by a mask. Mask <em>A</em>, used in the first
          layer, keeps the rows above the centre and the positions left of the centre in its row; mask <em>B</em>, used in
          later layers, also keeps the centre, since by then the centre holds features computed only from earlier pixels
          (<C>causal_mask</C>, <C>masked_conv</C>). The output at each position is a softmax over the 256 values of that pixel,
          and for colour images the three channels are ordered too, red before green before blue.
        </p>
        <Code>{PIXEL}</Code>
      </Definition>

      <Theorem title="the blind spot">
        <p>
          After a mask-A layer followed by L − 1 mask-B layers with 3 by 3 kernels, the output at pixel (r, c) can depend on the
          input pixel a rows above and b columns to the right, with <M>{"1 \\le a \\le L"}</M> and <M>{"b \\ge 1"}</M>, only if{" "}
          <M>{"b \\le a"}</M>. So among earlier pixels at most L rows above and L columns to either side,{" "}
          <M>{"L(L - 1)/2"}</M> are invisible: a wedge above and to the right.
        </p>
      </Theorem>
      <Proof>
        <p>
          Trace dependencies backwards from the output, one layer at a time (<C>receptive_field</C>). Each layer moves by one of
          the mask offsets: up and left, straight up, up and right, left, or, in mask-B layers, nowhere. The only offset that
          moves right also moves up, so reaching b columns to the right takes at least b upward moves, and a ≥ b. Conversely,
          when <M>{"b \\le a \\le L"}</M> the path of b up-right moves, a − b straight-up moves and L − a stays (with a non-stay
          move in the mask-A layer, possible since a ≥ 1) reaches the pixel. In the window, row a above contains L − a
          invisible pixels, those with <M>{"a < b \\le L"}</M>, and summing over a = 1, …, L gives{" "}
          <M>{"(L - 1) + (L - 2) + \\dots + 0 = L(L - 1)/2"}</M>.
        </p>
      </Proof>

      <Remark title="the gated PixelCNN">
        <p>
          The fix (van den Oord and others, 2016b) uses two stacks. A <em>vertical</em> stack has kernels covering only rows
          strictly above, so it sees a widening cone of complete rows; a <em>horizontal</em> stack sees the current row to the
          left and receives the vertical stack&apos;s features. Gated activations <M>{"\\tanh(W_f * x) \\odot \\sigma(W_g * x)"}</M>{" "}
          replace ReLUs. PixelCNN++ replaced the 256-way softmax with a discretised mixture of logistic distributions, which
          knows that pixel value 128 is close to 127, and reached about 2.9 bits per dimension on CIFAR-10 (l7.1.3).
        </p>
      </Remark>

      <Definition title="causal dilated convolution">
        <p>
          WaveNet (van den Oord and others, 2016c) models raw audio <M>{"x_1, x_2, \\dots"}</M> with one-dimensional causal
          convolutions: the output at time t uses inputs at t, t − d, …, t − (k − 1)d, where d is the <em>dilation</em>
          (<C>dilated_causal_conv</C>). The input is shifted one step so that the prediction for <M>{"x_t"}</M> uses only{" "}
          <M>{"x_{<t}"}</M>. Amplitudes are compressed by μ-law companding,{" "}
          <M>{"f(x) = \\operatorname{sign}(x) \\ln(1 + \\mu |x|) / \\ln(1 + \\mu)"}</M> with μ = 255, and quantised to 256
          levels (<C>mu_law_encode</C>), which spends more levels on quiet sounds, to which hearing is more sensitive.
        </p>
        <Code>{WAVE}</Code>
      </Definition>

      <Theorem title="receptive field of a dilated stack">
        <p>
          A stack of causal convolutions with kernel size k and dilations <M>{"d_1, \\dots, d_L"}</M> has a receptive field of{" "}
          <M>{"1 + (k - 1)\\sum_\\ell d_\\ell"}</M> samples. With k = 2 and dilations 1, 2, 4, …, <M>{"2^{L-1}"}</M> it is{" "}
          <M>{"2^L"}</M>, exponential in depth.
        </p>
      </Theorem>
      <Proof>
        <p>
          Layer ℓ lets each output reach <M>{"(k - 1) d_\\ell"}</M> further into the past than its inputs do, and the reaches add
          along the stack, starting from the single current sample (<C>receptive_field_len</C>). With k = 2 the sum of the
          dilations is <M>{"2^L - 1"}</M>, giving <M>{"2^L"}</M>.
        </p>
      </Proof>

      <Remark title="the sampling bottleneck">
        <p>
          Training is parallel, but generating one second of 16 kHz audio takes 16 000 sequential network evaluations, and a
          32 by 32 colour image 3072. Caching each layer&apos;s past activations removes redundant work but not the sequential
          dependence. Distillation into a parallel flow (Parallel WaveNet, l7.4.2) and, later, tokenising audio into far fewer
          discrete codes (l7.3.4) were the answers.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "rf",
      rung: "check",
      prompt: (
        <p>
          A WaveNet uses kernel size 2 and dilations 1, 2, 4, …, 512 (ten layers), with this block repeated three times. What is
          its receptive field in samples?
        </p>
      ),
      answer: { kind: "numeric", value: 3070, tolerance: 0 },
    },
    {
      key: "passes",
      rung: "check",
      prompt: <p>A PixelCNN samples a 32 by 32 colour image one channel value at a time. How many sequential network evaluations does that take?</p>,
      answer: { kind: "numeric", value: 3072, tolerance: 0 },
    },
    {
      key: "maskA",
      rung: "apply",
      prompt: <p>Why does the first layer of a PixelCNN use a mask that excludes the centre position while later layers include it?</p>,
      answer: {
        kind: "choice",
        options: [
          "In the first layer the centre is the pixel being predicted; in later layers the centre holds features computed only from earlier pixels",
          "Including the centre in the first layer would make the network too large",
          "Later layers need the centre to see pixels to the right",
          "Mask A is only an optimisation and either mask would be correct everywhere",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def causal_mask(k, kind):
    c = k // 2
    return [[1 if i < c or (i == c and (j < c or (kind == "B" and j == c))) else 0 for j in range(k)] for i in range(k)]

def masked_conv(img, w, mask):
    H, W, k = len(img), len(img[0]), len(w)
    c = k // 2
    out = [[0.0] * W for _ in range(H)]
    for r in range(H):
        for s in range(W):
            for i in range(k):
                for j in range(k):
                    rr, ss = r + i - c, s + j - c
                    if mask[i][j] and 0 <= rr < H and 0 <= ss < W:
                        out[r][s] += w[i][j] * img[rr][ss]
    return out

def receptive_field(r, s, layers):
    seen = {(r, s)}
    for kind in ["B"] * (layers - 1) + ["A"]:
        m = causal_mask(3, kind)
        seen = {(p + i - 1, q + j - 1) for p, q in seen for i in range(3) for j in range(3) if m[i][j]}
    return seen

print(causal_mask(3, "A"), causal_mask(3, "B")[1])
img = [[1, 2], [3, 4]]; print(masked_conv(img, [[1, 1, 1], [1, 1, 1], [1, 1, 1]], causal_mask(3, "A")), sorted(receptive_field(5, 5, 1)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 1, 1], [1, 0, 0], [0, 0, 0]] [1, 1, 0]\n[[0.0, 1.0], [3.0, 6.0]] [(4, 4), (4, 5), (4, 6), (5, 4)]",
          "[[1, 1, 1], [1, 0, 0], [0, 0, 0]] [1, 0, 0]\n[[0.0, 1.0], [3.0, 6.0]] [(4, 4), (4, 5), (4, 6), (5, 4)]",
          "[[1, 1, 1], [1, 0, 0], [0, 0, 0]] [1, 1, 0]\n[[1.0, 3.0], [6.0, 10.0]] [(4, 4), (4, 5), (4, 6), (5, 4)]",
          "[[1, 1, 1], [1, 0, 0], [0, 0, 0]] [1, 1, 0]\n[[0.0, 1.0], [3.0, 6.0]] [(4, 4), (4, 5), (4, 6), (5, 4), (5, 5)]",
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

def dilated_causal_conv(x, w, d):
    k = len(w)
    return [sum(w[i] * x[t - (k - 1 - i) * d] for i in range(k) if t - (k - 1 - i) * d >= 0) for t in range(len(x))]

def receptive_field_len(k, dilations):
    return 1 + sum((k - 1) * d for d in dilations)

def mu_law_encode(x, mu=255):
    y = math.copysign(math.log1p(mu * abs(x)) / math.log1p(mu), x)
    return int((y + 1) / 2 * mu + 0.5)

print(dilated_causal_conv([1, 2, 3, 4], [1, 1], 2), receptive_field_len(2, [1, 2, 4, 8]), receptive_field_len(3, [1, 2]))
print(mu_law_encode(0.0), mu_law_encode(1.0), mu_law_encode(-1.0), mu_law_encode(0.01), mu_law_encode(0.5))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 4, 6] 16 7\n128 255 0 157 239",
          "[1, 3, 5, 7] 16 7\n128 255 0 157 239",
          "[1, 2, 4, 6] 15 5\n128 255 0 157 239",
          "[1, 2, 4, 6] 16 7\n128 255 0 130 191",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>causal_mask(k, kind)</C> for kind "A" or "B"; <C>masked_conv(img, w, mask)</C>, a same-size convolution with zero
          padding (as cross-correlation, with <C>w[i][j]</C> applied to the pixel at offset (i − k//2, j − k//2)); and{" "}
          <C>receptive_field(r, s, layers)</C>, the set of input positions that can affect output (r, s) after one 3 by 3 mask-A
          layer followed by <C>layers - 1</C> mask-B layers, ignoring image borders.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def causal_mask(k, kind):
    return [[1] * k for _ in range(k)]

def masked_conv(img, w, mask):
    return [row[:] for row in img]

def receptive_field(r, s, layers):
    return {(r, s)}
`,
        solution: PIXEL,
        tests: [
          { name: "masks and convolution", code: `assert causal_mask(1, "A") == [[0]] and causal_mask(1, "B") == [[1]] and causal_mask(5, "A")[2] == [1, 1, 0, 0, 0] and causal_mask(5, "B")[1] == [1] * 5
assert masked_conv([[1, 2, 3]], [[0, 0, 0], [5, 7, 11], [0, 0, 0]], causal_mask(3, "B")) == [[7.0, 19.0, 31.0]]
assert masked_conv([[1], [2]], [[3, 4, 5], [0, 0, 0], [0, 0, 0]], causal_mask(3, "A")) == [[0.0], [4.0]]` },
          { name: "receptive field", code: `assert receptive_field(0, 0, 1) == {(-1, -1), (-1, 0), (-1, 1), (0, -1)} and len(receptive_field(9, 9, 2)) == 11
f = receptive_field(10, 10, 4); assert len(f) == 34 and (9, 11) in f and (9, 12) not in f and (10, 10) not in f and (6, 14) in f` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>dilated_causal_conv(x, w, d)</C>, whose output at t is <M>{"\\sum_i w_i\\, x_{t - (k-1-i)d}"}</M> with zeros
          before the start; <C>receptive_field_len(k, dilations)</C>; and <C>mu_law_encode(x, mu=255)</C>, mapping x in [−1, 1] to
          an integer level from 0 to μ by rounding <M>{"(f(x) + 1)\\mu / 2"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def dilated_causal_conv(x, w, d):
    return list(x)

def receptive_field_len(k, dilations):
    return k

def mu_law_encode(x, mu=255):
    return int((x + 1) / 2 * mu + 0.5)
`,
        solution: WAVE,
        tests: [
          { name: "convolution", code: `assert dilated_causal_conv([1, 0, 0, 0, 0], [2, 3], 3) == [3, 0, 0, 2, 0] and dilated_causal_conv([1, 2], [5], 4) == [5, 10]
assert dilated_causal_conv([1, 1, 1, 1], [1, 1, 1], 1) == [1, 2, 3, 3]` },
          { name: "receptive field and mu-law", code: `assert receptive_field_len(2, [1, 2, 4]) == 8 and receptive_field_len(3, []) == 1 and receptive_field_len(3, [1, 3]) == 9
assert mu_law_encode(0.0) == 128 and mu_law_encode(1.0) == 255 and mu_law_encode(-1.0) == 0 and mu_law_encode(0.1) == 203 and mu_law_encode(0.0, 3) == 2` },
        ],
      },
    },
    {
      key: "blind",
      rung: "stretch",
      prompt: (
        <p>
          A PixelCNN stacks one 3 by 3 mask-A layer and 19 mask-B layers. Among earlier pixels at most 20 rows above and 20
          columns to either side of the predicted pixel, how many can never influence its prediction?
        </p>
      ),
      answer: { kind: "numeric", value: 190, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        PixelCNN and WaveNet each needed an architecture tailored to their data. The transformer made a different bargain: turn
        every kind of data into a sequence of discrete tokens and use one architecture for all of them. The next lesson asks
        how.
      </p>
    </>
  ),
};
