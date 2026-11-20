import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OutlierRotateViz } from "@/components/viz/OutlierRotateViz";
import type { LessonContent } from "@/lib/types";

const MIXED = `import numpy as np

def outlier_channels(X, threshold):
    return [int(j) for j in np.where(np.abs(X).max(axis=0) > threshold)[0]]   # feature columns with any large value

def quantize_sym(x, bits):
    s = np.abs(x).max() / (2 ** (bits - 1) - 1)
    return np.round(x / s) * s                      # quantise and dequantise with one per-tensor scale

def mixed_matmul(X, W, cols, bits):
    rest = [j for j in range(X.shape[1]) if j not in cols]
    high = X[:, cols] @ W[cols, :]                  # outlier columns in full precision
    low = quantize_sym(X[:, rest], bits) @ quantize_sym(W[rest, :], bits)
    return high + low`;

const MIGRATE = `import numpy as np

def smooth_factors(act_max, w_max, alpha):
    return act_max ** alpha / w_max ** (1 - alpha)  # divide activations by s, multiply weights by s

def hadamard(n):
    H = np.array([[1.0]])
    while H.shape[0] < n:
        H = np.block([[H, H], [H, -H]])             # Sylvester's construction, n a power of two
    return H / np.sqrt(n)                           # orthogonal

def max_to_rms(x):
    return float(np.abs(x).max() / np.sqrt(np.mean(x ** 2)))`;

export const lesson: LessonContent = {
  id: "e12.4.3",
  minutes: 55,
  links: {
    requires: ["e12.4.2", "m6.6.2"],
    revisits: ["e9.5.1", "m15.2.2"],
    foreshadows: ["e12.4.4"],
  },

  puzzle: (
    <>
      <p>
        Weights quantise well to 8 bits with per-channel scales. A team quantises the activations entering each linear layer to 8 bits as
        well, so that matrix multiplications run in integer arithmetic, and a 6.7B-parameter model&apos;s accuracy collapses. The cause
        is a handful of hidden-state channels whose values are a hundred times larger than the rest, in nearly every token. Weights
        were easy; why are activations hard, and how can a few channels be tamed without giving up 8-bit arithmetic?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Large transformers develop a few feature dimensions with very large activations, consistently across tokens. A per-tensor or
        per-token activation scale must cover them, so every ordinary value lands on one or two levels. Per-channel activation scales
        would help but cannot be folded out of an integer matrix multiplication. Three remedies exist. Keep the outlier channels in 16
        bits and the rest in 8 (LLM.int8). Move the difficulty from activations into weights by dividing each channel by a factor and
        multiplying the matching weight row by it (SmoothQuant). Or multiply by an orthogonal matrix, such as a Hadamard matrix, that
        spreads every channel&apos;s energy across all channels (QuaRot and related methods); the inverse rotation is folded into the
        weights.
      </p>
      <OutlierRotateViz />
    </>
  ),

  theory: (
    <>
      <Definition title="mixed-precision decomposition">
        <p>
          <C>outlier_channels</C> lists the feature columns of X whose largest magnitude exceeds a threshold. <C>quantize_sym</C>{" "}
          quantises and dequantises with one symmetric scale. <C>mixed_matmul</C> computes XW with the outlier columns of X, and the
          matching rows of W, in full precision and the rest quantised.
        </p>
        <Code>{MIXED}</Code>
      </Definition>

      <Theorem title="balancing activations and weights">
        <p>
          Let channel j have activation maximum <M>{"a_j"}</M> and weight-row maximum <M>{"w_j"}</M>. With{" "}
          <M>{"s_j = a_j^\\alpha / w_j^{1-\\alpha}"}</M>, the smoothed maxima are <M>{"a_j/s_j = (a_j w_j)^{1-\\alpha}"}</M> and{" "}
          <M>{"w_j s_j = (a_j w_j)^\\alpha"}</M>; at α = 1/2 both equal <M>{"\\sqrt{a_j w_j}"}</M>, and the product XW is unchanged.
        </p>
      </Theorem>
      <Proof>
        <p>
          Direct substitution: <M>{"a_j/s_j = a_j^{1-\\alpha} w_j^{1-\\alpha}"}</M> and <M>{"w_j s_j = a_j^\\alpha w_j^\\alpha"}</M>. The
          product of the two maxima is always <M>{"a_j w_j"}</M>, so smoothing redistributes difficulty rather than removing it; α = 1/2
          splits it evenly. Since <M>{"X\\,\\mathrm{diag}(s)^{-1}\\,\\mathrm{diag}(s)\\,W = XW"}</M>, outputs are unchanged, and the
          division can be folded into the preceding normalisation layer, so it costs nothing at run time.
        </p>
      </Proof>

      <Definition title="rotations">
        <p>
          <C>smooth_factors</C> computes the factors of the theorem above. <C>hadamard</C> builds an orthogonal n × n Hadamard matrix,
          for n a power of two, by Sylvester&apos;s construction. <C>max_to_rms</C> is the ratio of a vector&apos;s largest magnitude to
          its root mean square, which sets how many levels ordinary values get.
        </p>
        <Code>{MIGRATE}</Code>
      </Definition>

      <Theorem title="a Hadamard rotation spreads a spike">
        <p>
          For orthogonal Q, <M>{"(XQ)(Q^\\top W) = XW"}</M>. A vector with one non-zero entry M among n has max-to-rms ratio{" "}
          <M>{"\\sqrt n"}</M>, and after multiplication by the normalised Hadamard matrix, ratio 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"QQ^\\top = I"}</M> gives the first claim (m6.6.2). The spike vector has root mean square <M>{"M/\\sqrt n"}</M>, so its ratio
          is <M>{"\\sqrt n"}</M>. Every entry of the normalised Hadamard matrix is <M>{"\\pm 1/\\sqrt n"}</M>, so the rotated vector has
          every entry equal to <M>{"\\pm M/\\sqrt n"}</M> and ratio 1. For general vectors a random or Hadamard rotation makes coordinates
          roughly equal in size, much as random vectors are nearly orthogonal in high dimension (m15.2.2), which removes outliers without
          locating them.
        </p>
      </Proof>

      <Remark title="activation quantisation in practice">
        <p>
          LLM.int8 found that outlier features emerge in models of several billion parameters and kept them in 16 bits. SmoothQuant made
          8-bit weights and activations practical with α around 0.5. Rotation methods such as QuaRot and SpinQuant make 4-bit weights and
          activations workable, folding rotations into weights and applying fast Hadamard transforms on line where needed. On accelerators
          with FP8 arithmetic (e9.5.1), activations are often quantised to FP8 with per-token or per-block scales, whose exponent bits
          tolerate a wider range.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A few channels a hundred times larger than the rest forced a coarse activation scale, so ordinary values became mostly zeros.
          Keeping those channels in 16 bits, migrating their magnitude into the weights, or rotating them away all restore fine levels for
          ordinary values while keeping 8-bit integer matrix multiplications for almost all of the work.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "smooth",
      rung: "check",
      prompt: (
        <p>
          A channel has activation maximum 64 and weight-row maximum 0.25. With α = 0.5, what smoothing factor <M>{"s_j"}</M> is used?
        </p>
      ),
      answer: { kind: "numeric", value: 16, tolerance: 0.0001 },
    },
    {
      key: "spike",
      rung: "check",
      prompt: <p>A 4,096-dimensional vector has a single non-zero entry. What is its max-to-rms ratio?</p>,
      answer: { kind: "numeric", value: 64, tolerance: 0.0001 },
    },
    {
      key: "harder",
      rung: "apply",
      prompt: <p>Why are activations harder to quantise than weights?</p>,
      answer: {
        kind: "choice",
        options: [
          "They change with every input and contain a few channels of very large values, which per-channel scales cannot be folded out of an integer matmul to fix",
          "They are always stored in 32 bits",
          "They are never reused, so quantisation saves nothing",
          "Weights have outliers but activations do not",
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

def outlier_channels(X, threshold):
    return [int(j) for j in np.where(np.abs(X).max(axis=0) > threshold)[0]]   # feature columns with any large value

def quantize_sym(x, bits):
    s = np.abs(x).max() / (2 ** (bits - 1) - 1)
    return np.round(x / s) * s                      # quantise and dequantise with one per-tensor scale

def mixed_matmul(X, W, cols, bits):
    rest = [j for j in range(X.shape[1]) if j not in cols]
    high = X[:, cols] @ W[cols, :]                  # outlier columns in full precision
    low = quantize_sym(X[:, rest], bits) @ quantize_sym(W[rest, :], bits)
    return high + low

X = np.array([[0.5, 20.0, -0.3], [0.1, -18.0, 0.2]]); W = np.eye(3)
print(outlier_channels(X, 6.0), np.round(quantize_sym(np.array([0.5, 20.0, -0.3]), 8), 3).tolist(), np.allclose(mixed_matmul(X, W, [1], 8), X, atol=0.01))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1] [0.472, 20.0, -0.315] True",
          "[1] [0.5, 20.0, -0.3] True",
          "[1] [0.472, 20.0, -0.315] False",
          "[0, 1] [0.472, 20.0, -0.315] True",
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

def smooth_factors(act_max, w_max, alpha):
    return act_max ** alpha / w_max ** (1 - alpha)  # divide activations by s, multiply weights by s

def hadamard(n):
    H = np.array([[1.0]])
    while H.shape[0] < n:
        H = np.block([[H, H], [H, -H]])             # Sylvester's construction, n a power of two
    return H / np.sqrt(n)                           # orthogonal

def max_to_rms(x):
    return float(np.abs(x).max() / np.sqrt(np.mean(x ** 2)))

s = smooth_factors(np.array([16.0, 1.0]), np.array([1.0, 4.0]), 0.5)
print(s.tolist(), np.round(hadamard(2) * np.sqrt(2), 6).tolist(), round(max_to_rms(np.array([1.0, 1.0, 1.0, 5.0])), 2), round(max_to_rms(hadamard(4) @ np.array([1.0, 1.0, 1.0, 5.0])), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[4.0, 0.5] [[1.0, 1.0], [1.0, -1.0]] 1.89 1.51",
          "[4.0, 2.0] [[1.0, 1.0], [1.0, -1.0]] 1.89 1.51",
          "[4.0, 0.5] [[1.0, 1.0], [1.0, -1.0]] 1.89 1.0",
          "[4.0, 0.5] [[1.0, -1.0], [1.0, 1.0]] 1.89 1.51",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>outlier_channels(X, threshold)</C>, returning a list of ints; <C>quantize_sym(x, bits)</C>; and{" "}
          <C>mixed_matmul(X, W, cols, bits)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def outlier_channels(X, threshold):
    return []

def quantize_sym(x, bits):
    return x

def mixed_matmul(X, W, cols, bits):
    return quantize_sym(X, bits) @ quantize_sym(W, bits)
`,
        solution: MIXED,
        tests: [
          { name: "detect", code: `X = np.array([[1.0, -9.0, 0.0], [2.0, 0.5, 7.0]])\nassert outlier_channels(X, 6.0) == [1, 2] and outlier_channels(X, 10.0) == []\nassert quantize_sym(np.array([0.2, 1.0, -0.6]), 2).tolist() == [0.0, 1.0, -1.0]` },
          { name: "mixed", code: `X = np.array([[1.0, 50.0], [-1.0, -50.0]]); W = np.array([[1.0], [1.0]])\nassert np.allclose(mixed_matmul(X, W, [1], 2), X @ W) and not np.allclose(mixed_matmul(X, W, [], 2), X @ W)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>smooth_factors(act_max, w_max, alpha)</C>, <C>hadamard(n)</C>, normalised so that it is orthogonal, and{" "}
          <C>max_to_rms(x)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def smooth_factors(act_max, w_max, alpha):
    return np.ones_like(act_max)

def hadamard(n):
    return np.eye(n)

def max_to_rms(x):
    return 1.0
`,
        solution: MIGRATE,
        tests: [
          { name: "smooth", code: `assert np.allclose(smooth_factors(np.array([8.0, 1.0]), np.array([2.0, 1.0]), 1.0), [8.0, 1.0])\nassert np.allclose(smooth_factors(np.array([9.0]), np.array([4.0]), 0.5), [1.5])` },
          { name: "rotate", code: `H = hadamard(8)\nassert np.allclose(H @ H.T, np.eye(8)) and np.allclose(np.abs(H), 1 / np.sqrt(8))\nassert abs(max_to_rms(np.array([0.0, 0.0, 0.0, 3.0])) - 2.0) < 1e-12 and abs(max_to_rms(H @ np.eye(8)[3]) - 1.0) < 1e-12` },
        ],
      },
    },
    {
      key: "levels",
      rung: "stretch",
      prompt: (
        <p>
          Activations are quantised to 8 bits with one symmetric scale set by an outlier of 60. How many distinct integer levels can
          values in [−0.5, 0.5] be mapped to?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Weights and activations are now in fewer bits. The remaining large consumer of memory and bandwidth in decode is the KV cache,
        which the last lesson of the chapter quantises.
      </p>
    </>
  ),
};
