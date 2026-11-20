import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { KvQuantViz } from "@/components/viz/KvQuantViz";
import type { LessonContent } from "@/lib/types";

const KVQ = `import numpy as np

def quant_per_axis(x, bits, axis):
    qmax = 2 ** (bits - 1) - 1
    s = np.abs(x).max(axis=axis, keepdims=True) / qmax   # axis 0: a scale per channel; axis 1: per token
    return np.round(x / s) * s

def attention(q, K, V):
    z = K @ q / np.sqrt(len(q))
    p = np.exp(z - z.max())
    return (p / p.sum()) @ V

def attn_error(q, K, V, Kq, Vq):
    return float(np.linalg.norm(attention(q, Kq, Vq) - attention(q, K, V)))`;

const BUDGET = `def kv_bits_per_token(layers, kv_heads, head_dim, bits, group, scale_bits):
    return 2 * layers * kv_heads * head_dim * (bits + scale_bits / group)   # values plus their share of scales

def capacity_gain(bits_old, bits_new, group, scale_bits):
    return bits_old / (bits_new + scale_bits / group)

def residual_window(seq_len, window):
    full = min(seq_len, window)                     # the most recent tokens stay in full precision
    return full, seq_len - full`;

export const lesson: LessonContent = {
  id: "e12.4.4",
  minutes: 50,
  links: {
    requires: ["e12.4.3", "e12.1.2"],
    revisits: ["e12.2.2", "m11.1.4"],
    foreshadows: ["e12.5.1"],
  },

  puzzle: (
    <>
      <p>
        At long contexts the KV cache, not the weights, fills memory and dominates each decode step&apos;s reads (e12.1.2). Storing it
        in 8 bits halves it with almost no effect on quality. A team pushes to 2 bits using the same per-token scales as for activations,
        and the model starts to lose track of earlier text. Another method reaches 2 bits with little loss by quantising keys and values
        differently and keeping the most recent tokens in full precision. Why do keys and values need different treatment?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Keys, like activations, have a few channels with large values in nearly every token, so a scale per token is dominated by those
        channels and ordinary channels lose their information; a scale per channel suits keys. Values have no such fixed outlier
        channels, and each output is a weighted average of value rows, so per-token scales work for them and errors average out. Recent
        tokens, which usually receive much attention and are still accumulating in a partly filled group, are kept in 16 bits in a small
        residual window.
      </p>
      <KvQuantViz />
    </>
  ),

  theory: (
    <>
      <Definition title="quantising keys and values">
        <p>
          <C>quant_per_axis</C> quantises and dequantises with symmetric scales computed along an axis: axis 0 gives a scale per channel
          (column), axis 1 a scale per token (row). <C>attention</C> computes one query&apos;s output, and <C>attn_error</C> measures how
          far quantised keys and values move it.
        </p>
        <Code>{KVQ}</Code>
      </Definition>

      <Theorem title="per-token scales and outlier channels">
        <p>
          Suppose channel c of the keys has values of magnitude at most <M>{"m_c"}</M> in every token, with the bound attained in each
          token for the largest, <M>{"m^* = \\max_c m_c"}</M>. With q levels on each side, a per-token step is <M>{"m^*/q"}</M> for every
          token, while a per-channel step for channel c is at most <M>{"m_c/q"}</M>; channel c&apos;s worst-case error shrinks by the factor{" "}
          <M>{"m_c/m^*"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A per-token scale is the token&apos;s largest magnitude divided by q, which is <M>{"m^*"}</M> by assumption. A per-channel scale
          for c is the channel&apos;s largest magnitude over tokens divided by q, at most <M>{"m_c/q"}</M>. Rounding error is at most half
          a step, giving the two bounds and their ratio. For ordinary channels <M>{"m_c \\ll m^*"}</M>, so per-token steps can exceed their
          values and round them to zero.
        </p>
      </Proof>

      <Definition title="memory budget">
        <p>
          <C>kv_bits_per_token</C> counts the bits of keys and values per token, including one scale of <C>scale_bits</C> per group of{" "}
          <C>group</C> numbers. <C>capacity_gain</C> is how many times more tokens fit than at <C>bits_old</C> without scales.{" "}
          <C>residual_window</C> splits a sequence into the recent tokens kept in full precision and the older ones quantised.
        </p>
        <Code>{BUDGET}</Code>
      </Definition>

      <Theorem title="value errors average out">
        <p>
          If each value row <M>{"v_i"}</M> is replaced by <M>{"v_i + e_i"}</M> with <M>{"\\|e_i\\| \\le \\varepsilon"}</M>, and the
          attention weights are unchanged, the attention output moves by at most ε.
        </p>
      </Theorem>
      <Proof>
        <p>
          The output is <M>{"\\sum_i p_i v_i"}</M> with <M>{"p_i \\ge 0"}</M> and <M>{"\\sum_i p_i = 1"}</M>. The change is{" "}
          <M>{"\\sum_i p_i e_i"}</M>, and by the triangle inequality its norm is at most{" "}
          <M>{"\\sum_i p_i \\|e_i\\| \\le \\varepsilon"}</M>. If the errors are independent with mean zero, the change is typically much
          smaller, about <M>{"\\varepsilon\\sqrt{\\sum_i p_i^2}"}</M>. Key errors are different: they enter through the softmax and can
          shift attention weights, which is why keys need the more careful scales.
        </p>
      </Proof>

      <Remark title="KV cache quantisation in practice">
        <p>
          FP8 caches with per-tensor or per-head scales are widely supported and cost little quality. KIVI quantises keys per channel and
          values per token to 2 bits, in groups, with a residual window of recent tokens in 16 bits; other methods add rotations or keep a
          few outlier entries exactly. Quantised caches combine with paged blocks (e12.2.2): each block stores its integers and scales, and
          attention kernels dequantise as they read. Lower-precision floating-point formats with block scales (m11.1.4) are an alternative to
          integers.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Per-token 2-bit scales on keys were set by the outlier channels, so the information in the other channels of every key was lost
          and attention went astray. Quantising keys per channel and values per token, and keeping the latest tokens in 16 bits, preserves
          what attention needs; the cache then takes about a sixth of its 16-bit size, and several times as many tokens fit.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "gain",
      rung: "check",
      prompt: (
        <p>
          A 16-bit KV cache is quantised to 4 bits with one 16-bit scale per group of 64 numbers. By what factor does capacity grow? Give
          two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.76, tolerance: 0.01 },
    },
    {
      key: "step_ratio",
      rung: "check",
      prompt: (
        <p>
          In every token one key channel reaches magnitude 40, while an ordinary channel never exceeds 0.5. At 4 bits (7 levels each side),
          how many times larger is the per-token step than that channel&apos;s per-channel step?
        </p>
      ),
      answer: { kind: "numeric", value: 80, tolerance: 0.001 },
    },
    {
      key: "axes",
      rung: "apply",
      prompt: <p>Why are keys usually quantised per channel and values per token?</p>,
      answer: {
        kind: "choice",
        options: [
          "Keys have large values concentrated in fixed channels, while value errors are averaged by the attention weights and have no such channel structure",
          "Values are never read during decoding",
          "Keys are stored in floating point and values in integers",
          "Per-channel scales are cheaper to store for keys only",
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

def quant_per_axis(x, bits, axis):
    qmax = 2 ** (bits - 1) - 1
    s = np.abs(x).max(axis=axis, keepdims=True) / qmax   # axis 0: a scale per channel; axis 1: per token
    return np.round(x / s) * s

def attention(q, K, V):
    z = K @ q / np.sqrt(len(q))
    p = np.exp(z - z.max())
    return (p / p.sum()) @ V

def attn_error(q, K, V, Kq, Vq):
    return float(np.linalg.norm(attention(q, Kq, Vq) - attention(q, K, V)))

x = np.array([[3.0, 10.0], [-1.0, 30.0]])
print(round(float(np.abs(quant_per_axis(x, 3, 0) - x).max()), 2), round(float(np.abs(quant_per_axis(x, 3, 1) - x).max()), 2), attention(np.zeros(2), x, np.eye(2)).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0 1.0 [0.5, 0.5]", "1.0 0.0 [0.5, 0.5]", "0.0 0.33 [0.5, 0.5]", "0.0 1.0 [1.0, 0.0]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_bits_per_token(layers, kv_heads, head_dim, bits, group, scale_bits):
    return 2 * layers * kv_heads * head_dim * (bits + scale_bits / group)   # values plus their share of scales

def capacity_gain(bits_old, bits_new, group, scale_bits):
    return bits_old / (bits_new + scale_bits / group)

def residual_window(seq_len, window):
    full = min(seq_len, window)                     # the most recent tokens stay in full precision
    return full, seq_len - full

per = kv_bits_per_token(32, 8, 128, 2, 32, 16)
print(per / 8, round(capacity_gain(16, 2, 32, 16), 2), residual_window(1000, 128))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["20480.0 6.4 (128, 872)", "16384.0 8.0 (128, 872)", "20480.0 6.4 (872, 128)", "163840.0 6.4 (128, 872)"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>quant_per_axis(x, bits, axis)</C>, <C>attention(q, K, V)</C>, with scores scaled by <M>{"1/\\sqrt d"}</M>, and{" "}
          <C>attn_error(q, K, V, Kq, Vq)</C>, returning a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def quant_per_axis(x, bits, axis):
    return x

def attention(q, K, V):
    return V.mean(axis=0)

def attn_error(q, K, V, Kq, Vq):
    return 0.0
`,
        solution: KVQ,
        tests: [
          { name: "quant", code: `x = np.array([[1.0, 8.0], [0.5, -4.0]])\nassert np.allclose(quant_per_axis(x, 2, 0), [[1.0, 8.0], [0.0, 0.0]]) and np.allclose(quant_per_axis(x, 2, 1), [[0.0, 8.0], [0.0, -4.0]])` },
          { name: "attn", code: `K = np.array([[10.0, 0.0], [0.0, 0.0]]); V = np.array([[1.0, 0.0], [0.0, 1.0]])\nout = attention(np.array([1.0, 0.0]), K, V)\nassert out[0] > 0.99 and abs(out.sum() - 1) < 1e-12\nassert attn_error(np.zeros(2), K, V, K, V + 0.1) > 0.14 and attn_error(np.zeros(2), K, V, K, V) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_bits_per_token(layers, kv_heads, head_dim, bits, group, scale_bits)</C>,{" "}
          <C>capacity_gain(bits_old, bits_new, group, scale_bits)</C> and <C>residual_window(seq_len, window)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_bits_per_token(layers, kv_heads, head_dim, bits, group, scale_bits):
    return layers * kv_heads * head_dim * bits

def capacity_gain(bits_old, bits_new, group, scale_bits):
    return bits_old / bits_new

def residual_window(seq_len, window):
    return window, seq_len - window
`,
        solution: BUDGET,
        tests: [
          { name: "bits", code: `assert kv_bits_per_token(1, 1, 4, 2, 4, 8) == 32.0 and capacity_gain(16, 3, 16, 16) == 4.0` },
          { name: "window", code: `assert residual_window(100, 32) == (32, 68) and residual_window(10, 32) == (10, 0)` },
        ],
      },
    },
    {
      key: "long",
      rung: "stretch",
      prompt: (
        <p>
          A model has 32 layers, 8 KV heads and head dimension 128. Its cache holds 131,072 tokens: the latest 128 in 16 bits, the rest in
          2 bits with a 16-bit scale per group of 32. How many GiB is the cache? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.51, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        The techniques of the last three chapters live inside one server. The next chapter steps back to the whole service: how requests
        reach servers, how latency, throughput and cost trade off, and how a fleet scales with demand.
      </p>
    </>
  ),
};
