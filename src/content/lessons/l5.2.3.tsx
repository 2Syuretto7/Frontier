import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RopeRotationViz } from "@/components/viz/RopeRotationViz";
import type { LessonContent } from "@/lib/types";

const ROPE = `import numpy as np

def rope_angles(pos, d, base=10000.0):
    theta = base ** (-np.arange(0, d, 2) / d)
    return np.outer(np.asarray(pos, float), theta)

def rope(X, pos, base=10000.0):
    X = np.asarray(X, float)
    a = rope_angles(pos, X.shape[1], base)
    x1, x2 = X[:, 0::2], X[:, 1::2]
    out = np.empty_like(X)
    out[:, 0::2] = x1 * np.cos(a) - x2 * np.sin(a)
    out[:, 1::2] = x1 * np.sin(a) + x2 * np.cos(a)
    return out

def rope_score(q, k, m, n, base=10000.0):
    return float(rope([q], [m], base)[0] @ rope([k], [n], base)[0])`;

const OTHERS = `import numpy as np

def alibi_bias(n, slope):
    i, j = np.arange(n)[:, None], np.arange(n)[None, :]
    return np.where(j <= i, slope * (j - i), -np.inf)

def wavelengths(d, base=10000.0):
    return 2 * np.pi * base ** (np.arange(0, d, 2) / d)

def interpolate(pos, train_len, new_len):
    return np.asarray(pos, float) * train_len / new_len`;

export const lesson: LessonContent = {
  id: "l5.2.3",
  minutes: 45,
  links: {
    requires: ["l5.2.2"],
    revisits: ["l4.4.3"],
    foreshadows: ["l5.2.4", "l5.3.4"],
  },

  puzzle: (
    <>
      <p>
        The original transformer added a fixed pattern of sines and cosines to each input vector to mark its position. Most
        models trained since 2022 instead rotate their queries and keys, by an angle proportional to position, inside every
        attention layer, and add nothing to the inputs at all. Why rotate rather than add, and why do these models then
        struggle with texts longer than the ones they were trained on, until their positions are rescaled?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        What attention usually needs is not where a token is but how far apart two tokens are: the previous word, the start
        of the sentence ten tokens back. Adding a position vector to the input mixes position into everything, values
        included, and leaves the network to work out offsets. Rotating does it directly. Split the query and key into pairs
        of coordinates and turn each pair by an angle proportional to the position; the dot product between a query and a
        key then depends on the difference of their angles, which is proportional to the offset between them. Different
        pairs turn at different speeds, from once every few tokens to once every tens of thousands, so both near and far
        offsets can be told apart. The slowest pairs never complete a turn during training, which is why extrapolating to
        longer texts goes wrong and why rescaling positions helps.
      </p>
      <RopeRotationViz />
    </>
  ),

  theory: (
    <>
      <Definition title="rotary position embedding">
        <p>
          For even d and base b (usually 10,000), let <M>{"\\theta_i = b^{-2i/d}"}</M> for i = 0, …, d/2 − 1. At position m,
          rotary position embedding (RoPE) rotates coordinates <M>{"(x_{2i}, x_{2i+1})"}</M> of a query or key by the angle{" "}
          <M>{"m\\theta_i"}</M>:
        </p>
        <MD>{"\\begin{pmatrix}x_{2i}' \\\\ x_{2i+1}'\\end{pmatrix} = \\begin{pmatrix}\\cos m\\theta_i & -\\sin m\\theta_i \\\\ \\sin m\\theta_i & \\cos m\\theta_i\\end{pmatrix}\\begin{pmatrix}x_{2i} \\\\ x_{2i+1}\\end{pmatrix}."}</MD>
        <p>Write <M>{"R_m"}</M> for the block-diagonal matrix of all these rotations. Values are not rotated.</p>
        <Code>{ROPE}</Code>
      </Definition>

      <Theorem title="rotary scores depend only on the offset">
        <p>
          For all q, k and positions m, n, <M>{"(R_mq)^\\top(R_nk) = q^\\top R_{n-m}k"}</M>, and{" "}
          <M>{"\\|R_mq\\| = \\|q\\|"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each 2 × 2 block is a rotation, so <M>{"R_m^\\top = R_{-m}"}</M> and <M>{"R_aR_b = R_{a+b}"}</M>, block by block,
          because rotation angles add. Hence <M>{"(R_mq)^\\top R_nk = q^\\top R_m^\\top R_nk = q^\\top R_{n-m}k"}</M>. Rotations are
          orthogonal, so they preserve norms. Shifting both positions by the same amount leaves every score, and so the whole
          attention pattern, unchanged.
        </p>
      </Proof>

      <Theorem title="slow pairs never turn during training">
        <p>
          Pair i returns to its starting angle every <M>{"\\lambda_i = 2\\pi b^{2i/d}"}</M> positions. Over a training context
          of length L it turns through <M>{"L/\\lambda_i"}</M> full circles; for the slowest pair, with b = 10,000 and large d,{" "}
          <M>{"\\lambda \\approx 2\\pi b"}</M>, about 63,000 positions, so with L = 4096 it covers less than a tenth of a turn.
        </p>
      </Theorem>
      <Proof>
        <p>
          The angle at position m is <M>{"m\\theta_i"}</M>, which first returns to a multiple of 2π at{" "}
          <M>{"m = 2\\pi/\\theta_i = 2\\pi b^{2i/d}"}</M>. For i = d/2 − 1 the exponent is <M>{"(d-2)/d"}</M>, close to 1. A
          pair that never completed a turn in training sees, at longer positions, angles it has never encountered, and the
          attention scores built on it are untested: this is why naive extrapolation fails.
        </p>
      </Proof>

      <Definition title="extending the context, and ALiBi">
        <p>
          <em>Position interpolation</em> runs a model trained on length L at length L&apos; &gt; L by using positions{" "}
          <M>{"mL/L'"}</M>, so every angle stays within the range seen in training, at the cost of squeezing the fast pairs;
          refinements instead raise the base b, mainly stretching the slow pairs. <em>ALiBi</em> uses no rotation at all and
          adds <M>{"-s\\,(i - j)"}</M> to the score of query i and key j, a penalty growing linearly with distance, with a
          different slope s for each head.
        </p>
        <Code>{OTHERS}</Code>
      </Definition>

      <Remark title="why rotate rather than add">
        <p>
          With absolute position vectors added to the inputs, the offset between two tokens enters the score only through
          learned interactions between content and position, and position also leaks into the values. RoPE puts position
          only where it is needed, in the comparison of query and key, makes the score a function of offset by construction,
          and leaves norms untouched. Because it is applied in every layer, the information does not fade with depth.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "wave",
      rung: "check",
      prompt: <p>With d = 128 and base 10,000, what is the wavelength in positions of the slowest rotary pair? Round to the nearest whole number.</p>,
      answer: { kind: "numeric", value: 54410, tolerance: 1 },
    },
    {
      key: "interp",
      rung: "check",
      prompt: <p>A model trained at length 4096 is extended to 32,768 by position interpolation. Which position does token 20,000 use?</p>,
      answer: { kind: "numeric", value: 2500, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What property makes rotary embeddings suit attention?</p>,
      answer: {
        kind: "choice",
        options: [
          "The score between a rotated query and a rotated key depends only on their content and the offset between their positions",
          "Rotations make every attention score positive",
          "Rotary embeddings let values carry each token's absolute position",
          "Rotations increase the norm of later tokens so recent context dominates",
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

def rope_angles(pos, d, base=10000.0):
    theta = base ** (-np.arange(0, d, 2) / d)
    return np.outer(np.asarray(pos, float), theta)

def rope(X, pos, base=10000.0):
    X = np.asarray(X, float)
    a = rope_angles(pos, X.shape[1], base)
    x1, x2 = X[:, 0::2], X[:, 1::2]
    out = np.empty_like(X)
    out[:, 0::2] = x1 * np.cos(a) - x2 * np.sin(a)
    out[:, 1::2] = x1 * np.sin(a) + x2 * np.cos(a)
    return out

def rope_score(q, k, m, n, base=10000.0):
    return float(rope([q], [m], base)[0] @ rope([k], [n], base)[0])

print(np.round(rope([[1.0, 0.0]], [1], base=1.0), 3).tolist(), np.round(rope_angles([2], 4, base=100.0), 3).tolist())
q, k = np.array([1.0, 2.0, 0.5, -1.0]), np.array([0.3, -0.7, 2.0, 1.0])
print(round(rope_score(q, k, 3, 5), 6) == round(rope_score(q, k, 10, 12), 6), round(rope_score(q, k, 0, 0), 3), round(float(np.linalg.norm(rope([q], [7])[0])), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.54, 0.841]] [[2.0, 0.2]]\nTrue -1.1 2.5",
          "[[0.54, -0.841]] [[2.0, 0.2]]\nTrue -1.1 2.5",
          "[[0.54, 0.841]] [[2.0, 0.02]]\nTrue -1.1 2.5",
          "[[0.54, 0.841]] [[2.0, 0.2]]\nFalse -1.1 2.5",
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

def alibi_bias(n, slope):
    i, j = np.arange(n)[:, None], np.arange(n)[None, :]
    return np.where(j <= i, slope * (j - i), -np.inf)

def wavelengths(d, base=10000.0):
    return 2 * np.pi * base ** (np.arange(0, d, 2) / d)

def interpolate(pos, train_len, new_len):
    return np.asarray(pos, float) * train_len / new_len

print(alibi_bias(3, 0.5).tolist(), np.round(wavelengths(4, 100.0), 2).tolist(), interpolate([0, 2048, 4095], 2048, 4096).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, -inf, -inf], [-0.5, 0.0, -inf], [-1.0, -0.5, 0.0]] [6.28, 62.83] [0.0, 1024.0, 2047.5]",
          "[[0.0, -0.5, -1.0], [-0.5, 0.0, -0.5], [-1.0, -0.5, 0.0]] [6.28, 62.83] [0.0, 1024.0, 2047.5]",
          "[[0.0, -inf, -inf], [-0.5, 0.0, -inf], [-1.0, -0.5, 0.0]] [6.28, 628.32] [0.0, 1024.0, 2047.5]",
          "[[0.0, -inf, -inf], [-0.5, 0.0, -inf], [-1.0, -0.5, 0.0]] [6.28, 62.83] [0.0, 4096.0, 8190.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rope_angles(pos, d, base=10000.0)</C>, the matrix of angles <M>{"m\\theta_i"}</M> with one row per position;{" "}
          <C>rope(X, pos, base=10000.0)</C>, rotating the coordinate pairs (0, 1), (2, 3), … of each row of X by its
          position&apos;s angles; and <C>rope_score(q, k, m, n, base=10000.0)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rope_angles(pos, d, base=10000.0):
    return np.zeros((len(pos), d // 2))

def rope(X, pos, base=10000.0):
    return np.asarray(X, float)

def rope_score(q, k, m, n, base=10000.0):
    return float(np.dot(q, k))
`,
        solution: ROPE,
        tests: [
          { name: "rotate", code: `assert np.allclose(rope([[1.0, 0.0]], [1], base=1.0), [[np.cos(1), np.sin(1)]]) and np.allclose(rope_angles([2], 4, base=100.0), [[2.0, 0.2]])
X = np.random.default_rng(0).standard_normal((5, 8)); Y = rope(X, np.arange(5)); assert np.allclose(np.linalg.norm(Y, axis=1), np.linalg.norm(X, axis=1)) and np.allclose(Y[0], X[0])` },
          { name: "relative", code: `rng = np.random.default_rng(1); q, k = rng.standard_normal(16), rng.standard_normal(16)
assert abs(rope_score(q, k, 3, 9) - rope_score(q, k, 100, 106)) < 1e-9 and abs(rope_score(q, k, 0, 0) - q @ k) < 1e-12 and abs(rope_score(q, k, 3, 9) - rope_score(q, k, 9, 3)) > 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>alibi_bias(n, slope)</C>, the causal ALiBi bias matrix with −∞ above the diagonal;{" "}
          <C>wavelengths(d, base=10000.0)</C>, one per rotary pair; and <C>interpolate(pos, train_len, new_len)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def alibi_bias(n, slope):
    return np.zeros((n, n))

def wavelengths(d, base=10000.0):
    return np.ones(d // 2)

def interpolate(pos, train_len, new_len):
    return np.asarray(pos, float)
`,
        solution: OTHERS,
        tests: [
          { name: "alibi", code: `B = alibi_bias(4, 0.25); assert B[3, 0] == -0.75 and B[2, 2] == 0 and np.isinf(B[0, 3]) and B[0, 3] < 0 and B[1, 0] == -0.25` },
          { name: "scales", code: `assert np.allclose(wavelengths(4, 100.0), [2 * np.pi, 20 * np.pi]) and (wavelengths(64) > 4096).sum() == 9
assert np.allclose(interpolate([0, 2048, 4095], 2048, 4096), [0, 1024, 2047.5]) and interpolate([20000], 4096, 32768)[0] == 2500` },
        ],
      },
    },
    {
      key: "turns",
      rung: "stretch",
      prompt: <p>With d = 64 and base 10,000, how many rotary pairs have a wavelength longer than a training context of 4096 positions?</p>,
      answer: { kind: "numeric", value: 9, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Attention moves information between positions; it does not transform it much. The next lesson adds the other half
        of the block, the MLP, and the residual stream that every layer reads from and writes to.
      </p>
    </>
  ),
};
