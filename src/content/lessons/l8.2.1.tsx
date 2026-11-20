import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { RopeDecayViz } from "@/components/viz/RopeDecayViz";
import type { LessonContent } from "@/lib/types";

const LAYERS = `import math

def silu(z):
    return z / (1 + math.exp(-z))

def rmsnorm(x, g, eps=1e-6):
    r = math.sqrt(sum(v * v for v in x) / len(x) + eps)
    return [gi * v / r for gi, v in zip(g, x)]

def swiglu(x, W1, W3, W2):
    a = [sum(w * v for w, v in zip(row, x)) for row in W1]
    b = [sum(w * v for w, v in zip(row, x)) for row in W3]
    h = [silu(ai) * bi for ai, bi in zip(a, b)]
    return [sum(w * v for w, v in zip(row, h)) for row in W2]`;

const ROPE = `import math

def rope(x, pos, base=10000.0):
    d, out = len(x), list(x)
    for i in range(d // 2):
        theta = pos * base ** (-2 * i / d)
        c, s = math.cos(theta), math.sin(theta)
        out[2 * i] = x[2 * i] * c - x[2 * i + 1] * s
        out[2 * i + 1] = x[2 * i] * s + x[2 * i + 1] * c
    return out

def ffn_hidden(d, multiple_of=256):
    h = int(2 * 4 * d / 3)
    return multiple_of * ((h + multiple_of - 1) // multiple_of)

def block_params(d, hidden):
    return 4 * d * d + 3 * d * hidden + 2 * d`;

export const lesson: LessonContent = {
  id: "l8.2.1",
  minutes: 50,
  links: {
    requires: ["l5.2.3", "l5.2.5", "l5.3.3"],
    revisits: ["l5.2.4", "m14.6.4"],
    foreshadows: ["l8.2.2", "l8.7.2"],
  },

  puzzle: (
    <>
      <p>
        Open the configuration file of almost any open-weight language model released since 2023 and you will find the same
        three choices: RMSNorm instead of LayerNorm, a SwiGLU feed-forward layer instead of a GELU MLP, and rotary position
        embeddings instead of learned or sinusoidal ones. None of them is dramatic on its own. Why did the field converge on
        exactly this combination, and how do the pieces fit together in one block?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each choice removes something the model did not need or adds something cheap that helps. RMSNorm drops the mean
        subtraction and bias of LayerNorm, which turned out to matter little, and saves time. SwiGLU multiplies two linear
        projections, one passed through a smooth gate, giving the feed-forward layer a multiplicative interaction for the
        same parameter count. RoPE encodes position by rotating queries and keys, so that attention scores depend only on how
        far apart two tokens are, which is what language mostly cares about.
      </p>
      <RopeDecayViz />
    </>
  ),

  theory: (
    <>
      <Definition title="RMSNorm and SwiGLU">
        <p>
          RMSNorm rescales a vector by its root mean square and a learned gain, <M>{"\\mathrm{RMSNorm}(x) = g \\odot x \\big/ \\sqrt{\\tfrac1d\\sum_i x_i^2 + \\epsilon}"}</M>{" "}
          (<C>rmsnorm</C>), with no centring and no bias. SwiGLU computes{" "}
          <M>{"\\mathrm{FFN}(x) = W_2\\big(\\mathrm{SiLU}(W_1 x) \\odot W_3 x\\big)"}</M> with <M>{"\\mathrm{SiLU}(z) = z\\,\\sigma(z)"}</M> (<C>silu</C>, <C>swiglu</C>). It has three
          weight matrices instead of two, so its hidden width is cut from 4d to about 8d/3 to keep the parameter count at{" "}
          <M>{"8d^2"}</M>; in practice it is rounded up to a multiple of a hardware-friendly number (<C>ffn_hidden</C>).
        </p>
        <Code>{LAYERS}</Code>
      </Definition>

      <Theorem title="rotary embeddings make scores relative">
        <p>
          Split a d-dimensional vector into d/2 pairs and rotate pair i at position m by angle <M>{"m\\theta_i"}</M>, with{" "}
          <M>{"\\theta_i = b^{-2i/d}"}</M> for a base b, usually 10,000 (<C>rope</C>). Then for any query q and key k,
        </p>
        <MD>{"\\langle R_m q,\; R_n k\\rangle = \\langle q,\; R_{n-m} k\\rangle"}</MD>
        <p>
          so the attention score depends on the positions only through their difference.
        </p>
        <Code>{ROPE}</Code>
      </Theorem>
      <Proof>
        <p>
          <M>{"R_m"}</M> is block diagonal with 2 × 2 rotations by <M>{"m\\theta_i"}</M>. Rotations are orthogonal and rotations by angles in the same
          plane compose by adding angles, so <M>{"R_m^\\top R_n = R_{-m} R_n = R_{n-m}"}</M>, and{" "}
          <M>{"\\langle R_m q, R_n k\\rangle = q^\\top R_m^\\top R_n k = \\langle q, R_{n-m} k\\rangle"}</M>.
        </p>
      </Proof>

      <Remark title="frequencies and reach">
        <p>
          Pair i completes a full turn every <M>{"2\\pi/\\theta_i"}</M> tokens. The first pair turns once every 6.3 tokens and tracks fine
          local order; the last turns so slowly that it barely moves within a context and acts almost like no position signal
          at all. For vectors that are aligned, the score is a sum of cosines at these frequencies, which falls as the distance
          grows and the pairs drift out of phase, the decay in the viz. Raising the base, as Llama 3 did to 500,000, slows
          every pair and stretches that decay over longer contexts, the starting point of context extension in l8.7.2.
        </p>
      </Remark>

      <Definition title="the modern block">
        <p>
          Put together, a block is pre-norm with no bias terms anywhere:
        </p>
        <MD>{"h = x + \\mathrm{Attn}_{\\mathrm{RoPE}}\\big(\\mathrm{RMSNorm}(x)\\big), \\qquad y = h + \\mathrm{SwiGLU}\\big(\\mathrm{RMSNorm}(h)\\big)"}</MD>
        <p>
          with four <M>{"d \\times d"}</M> attention matrices, three feed-forward matrices of size <M>{"d \\times h"}</M>, and two gain vectors,{" "}
          <M>{"4d^2 + 3dh + 2d"}</M> parameters in all (<C>block_params</C>). RoPE adds none.
        </p>
      </Definition>

      <Example title="what each piece buys">
        <p>
          The evidence is a set of modest, consistent wins. Shazeer found that gated feed-forward layers lowered pretraining
          perplexity at equal parameters and compute across several variants, with SwiGLU and GeGLU best. Zhang and Sennrich
          found RMSNorm matched LayerNorm&apos;s quality while running noticeably faster, since it skips one reduction. RoPE
          matched or beat learned absolute positions and, unlike them, assigns a meaning to positions never seen in training,
          which makes extending the context possible. Removing bias terms simplifies sharding and slightly improves stability.
          l8.2.4 asks how such claims are tested.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: (
        <p>
          A model has 32 such blocks with d = 4096 and h = 11008, untied input and output embeddings for a 32,000-token vocabulary,
          and a final RMSNorm. How many parameters does it have, in billions? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 6.74, tolerance: 0.005 },
    },
    {
      key: "hidden",
      rung: "check",
      prompt: <p>Using int(8d/3) rounded up to a multiple of 256, what SwiGLU hidden width goes with d = 5120?</p>,
      answer: { kind: "numeric", value: 13824, tolerance: 0 },
    },
    {
      key: "rel",
      rung: "apply",
      prompt: <p>Why does RoPE rotate both the query and the key, rather than adding a position vector to the token embedding?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because rotations compose, the score between a rotated query and a rotated key depends only on the difference of their positions",
          "Rotation makes the query and key vectors longer at later positions",
          "Adding vectors is not differentiable",
          "Rotating keys alone would not change the scores, so the query must also be rotated to add parameters",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def silu(z):
    return z / (1 + math.exp(-z))

def rmsnorm(x, g, eps=1e-6):
    r = math.sqrt(sum(v * v for v in x) / len(x) + eps)
    return [gi * v / r for gi, v in zip(g, x)]

def swiglu(x, W1, W3, W2):
    a = [sum(w * v for w, v in zip(row, x)) for row in W1]
    b = [sum(w * v for w, v in zip(row, x)) for row in W3]
    h = [silu(ai) * bi for ai, bi in zip(a, b)]
    return [sum(w * v for w, v in zip(row, h)) for row in W2]

print(silu(0.0), [round(v, 4) for v in rmsnorm([3.0, -4.0], [1.0, 2.0], 0.0)])
print([round(v, 4) for v in swiglu([1.0, 2.0], [[1.0, 0.0]], [[0.0, 1.0]], [[1.0], [3.0]])])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 [0.8485, -2.2627]\n[1.4621, 4.3864]",
          "0.0 [0.6, -1.6]\n[1.4621, 4.3864]",
          "0.5 [0.8485, -2.2627]\n[1.4621, 4.3864]",
          "0.0 [0.8485, -2.2627]\n[2.0, 6.0]",
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

def rope(x, pos, base=10000.0):
    d, out = len(x), list(x)
    for i in range(d // 2):
        theta = pos * base ** (-2 * i / d)
        c, s = math.cos(theta), math.sin(theta)
        out[2 * i] = x[2 * i] * c - x[2 * i + 1] * s
        out[2 * i + 1] = x[2 * i] * s + x[2 * i + 1] * c
    return out

def ffn_hidden(d, multiple_of=256):
    h = int(2 * 4 * d / 3)
    return multiple_of * ((h + multiple_of - 1) // multiple_of)

def block_params(d, hidden):
    return 4 * d * d + 3 * d * hidden + 2 * d

q, k = [1.0, 2.0, 0.5, -1.0], [0.3, -0.7, 1.2, 0.4]; dot = lambda a, b: sum(x * y for x, y in zip(a, b))
print(round(dot(rope(q, 5), rope(k, 3)) - dot(rope(q, 2), rope(k, 0)), 9), [round(v, 4) for v in rope([1.0, 0.0], math.pi / 2, 1.0)], ffn_hidden(4096), block_params(2, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 [0.0, 1.0] 11008 44",
          "0.0 [1.0, 0.0] 11008 44",
          "0.3 [0.0, 1.0] 10922 44",
          "0.0 [0.0, 1.0] 11008 52",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>silu(z)</C>, <C>rmsnorm(x, g, eps)</C> and <C>swiglu(x, W1, W3, W2)</C>, with matrices as lists of rows.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def silu(z):
    return max(z, 0.0)

def rmsnorm(x, g, eps=1e-6):
    m = sum(x) / len(x)
    s = math.sqrt(sum((v - m) ** 2 for v in x) / len(x) + eps)
    return [gi * (v - m) / s for gi, v in zip(g, x)]

def swiglu(x, W1, W3, W2):
    h = [silu(sum(w * v for w, v in zip(row, x))) for row in W1]
    return [sum(w * v for w, v in zip(row, h)) for row in W2]
`,
        solution: LAYERS,
        tests: [
          { name: "norm", code: `y = rmsnorm([2.0] * 7 + [10.0], [1.0] * 8, 0.0)\nassert abs(y[7] - 2.5) < 1e-12 and abs(silu(-1.0) + 1 / (1 + math.e)) < 1e-12` },
          { name: "ffn", code: `out = swiglu([1.0, -1.0], [[1.0, 1.0], [2.0, 0.0]], [[3.0, 0.0], [0.0, 1.0]], [[1.0, 1.0]])\nassert abs(out[0] - (0.0 * 3.0 + silu(2.0) * -1.0)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rope(x, pos, base)</C>, rotating pair (x[2i], x[2i+1]) by <M>{"\\text{pos}\\cdot b^{-2i/d}"}</M>, <C>ffn_hidden(d, multiple_of)</C> and{" "}
          <C>block_params(d, hidden)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def rope(x, pos, base=10000.0):
    return [v + pos for v in x]

def ffn_hidden(d, multiple_of=256):
    return 4 * d

def block_params(d, hidden):
    return 2 * d * hidden
`,
        solution: ROPE,
        tests: [
          { name: "rope", code: `q, k = [0.2, -1.0, 0.7, 0.3, 1.1, -0.4], [0.5, 0.5, -0.2, 0.9, 0.1, 0.8]\nd = lambda a, b: sum(x * y for x, y in zip(a, b))\nassert abs(d(rope(q, 17), rope(k, 4)) - d(rope(q, 113), rope(k, 100))) < 1e-9 and abs(sum(v * v for v in rope(q, 9)) - sum(v * v for v in q)) < 1e-12` },
          { name: "sizes", code: `assert ffn_hidden(4096) == 11008 and ffn_hidden(768, 64) == 2048 and block_params(10, 20) == 1020` },
        ],
      },
    },
    {
      key: "wave",
      rung: "stretch",
      prompt: (
        <p>
          With head dimension 128 and base 10,000, how many tokens does the slowest RoPE pair take to complete one full turn?
          Give the nearest whole number.
        </p>
      ),
      answer: { kind: "numeric", value: 54410, tolerance: 1 },
    },
  ],

  glimpse: (
    <>
      <p>
        The block is settled except for its most expensive part at inference: the keys and values that every attention head
        must cache. The next lesson shrinks that cache by sharing or compressing them.
      </p>
    </>
  ),
};
