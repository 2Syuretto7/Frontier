import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MatmulCostViz } from "@/components/viz/MatmulCostViz";
import type { LessonContent } from "@/lib/types";

const COUNT = `def matmul_cost(m, n, k, size=2):
    return 2 * m * n * k, size * (m * k + k * n + m * n)

def elementwise_cost(n, inputs, size=2, flops_per=1):
    return n * flops_per, size * n * (inputs + 1)

def chain_bytes(n, ops, size=2, fused=False):
    return 2 * n * size * (1 if fused else ops)`;

const MODELS = `def conv2d_flops(h, w, cin, cout, kh, kw):
    return 2 * h * w * cout * cin * kh * kw

def attention_flops(seq, d, causal=False):
    full = 4 * seq * seq * d
    return full // 2 if causal else full

def mlp_flops(tokens, d, hidden, gated=False):
    return 2 * tokens * d * hidden * (3 if gated else 2)`;

export const lesson: LessonContent = {
  id: "e7.4.1",
  minutes: 45,
  links: {
    requires: ["e7.3.4"],
    revisits: ["e6.4.2", "l5.3.3"],
    foreshadows: ["e7.4.2", "e7.6.1"],
  },

  puzzle: (
    <>
      <p>
        A GPU rated at nearly a thousand trillion operations a second generates text from a 7-billion-parameter model at
        about a hundred tokens a second. Each token needs about 14 billion operations, so the GPU is doing about 1.4
        trillion a second, less than 0.2% of its rating. Is the software badly written, or is something other than
        arithmetic setting the pace?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every operation has two costs: the arithmetic it does and the bytes it must move between memory and the chip.
        The hardware has a separate limit for each, and whichever takes longer sets the time. Counting both is the first
        step in reasoning about speed. For a matrix product the arithmetic grows with all three dimensions but the data
        only with the sizes of the matrices, so the balance depends sharply on the shape.
      </p>
      <MatmulCostViz />
    </>
  ),

  theory: (
    <>
      <Definition title="FLOPs and bytes">
        <p>
          A <em>FLOP</em> is one floating-point addition or multiplication, so a fused multiply-add counts as two; FLOPs is
          the count, FLOP/s the rate. The <em>bytes</em> of an operation are the bytes it must read from and write to main
          memory, assuming each input is read once and each output written once; this is a lower bound on the real traffic,
          reached only when caches and fusion avoid every re-read.
        </p>
        <Code>{COUNT}</Code>
      </Definition>

      <Theorem title="the cost of a matrix product">
        <p>
          Computing <M>{"C = AB"}</M> with <M>{"A \\in \\mathbb{R}^{m \\times k}"}</M> and{" "}
          <M>{"B \\in \\mathbb{R}^{k \\times n}"}</M> by the usual algorithm takes <M>{"mn(2k - 1)"}</M> FLOPs, or{" "}
          <M>{"2mnk"}</M> when accumulating into an existing C, and moves at least <M>{"s(mk + kn + mn)"}</M> bytes with s
          bytes per element.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the mn entries is a dot product of length k: k multiplications and <M>{"k - 1"}</M> additions, or k
          additions when added to an existing value. Every entry of A and B is needed by some output, and every output must
          be written, so all three matrices cross the memory boundary at least once. The convention <M>{"2mnk"}</M> is
          universal in practice, and differs from the exact count by a factor of at most <M>{"1 + 1/(2k - 1)"}</M>.
        </p>
      </Proof>

      <Theorem title="elementwise operations and chains">
        <p>
          An elementwise operation with i inputs of n elements and f FLOPs per element costs nf FLOPs and{" "}
          <M>{"s\\,n\\,(i + 1)"}</M> bytes. A chain of q unary elementwise operations moves <M>{"2qsn"}</M> bytes when each
          runs as its own kernel and <M>{"2sn"}</M> when they are fused into one.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each element of each input is read once and each output element written once. Unfused, every operation in the
          chain reads its input from memory and writes its output back; fused, the intermediate values stay in registers,
          so only the first input and the last output touch memory (e6.4.2). The FLOP count is the same either way.
        </p>
      </Proof>

      <Example title="counting for models">
        <p>
          A convolution producing an <M>{"h \\times w"}</M> map with <M>{"c_{\\text{out}}"}</M> channels from{" "}
          <M>{"c_{\\text{in}}"}</M> channels with a <M>{"k_h \\times k_w"}</M> kernel does a dot product of length{" "}
          <M>{"c_{\\text{in}} k_h k_w"}</M> per output: <M>{"2hwc_{\\text{out}}c_{\\text{in}}k_hk_w"}</M> FLOPs. Attention over
          s tokens with total head dimension d computes scores <M>{"QK^\\top"}</M> and then weights times V, two products of
          about <M>{"2s^2d"}</M> FLOPs each, so <M>{"4s^2d"}</M>, halved with a causal mask if the kernel skips the masked
          half. An MLP with hidden size h does <M>{"2 \\cdot 2tdh"}</M> FLOPs for t tokens, or <M>{"3 \\cdot 2tdh"}</M> when
          gated, which is why gated MLPs use h about <M>{"\\tfrac{8}{3}d"}</M> instead of 4d to keep the cost equal.
        </p>
        <Code>{MODELS}</Code>
      </Example>

      <Remark title="the puzzle, counted">
        <p>
          Generating one token multiplies one row of activations by every weight matrix: m = 1. The FLOPs are 2 per
          parameter, 14 billion, but the bytes are the whole model, 14 GB in bf16, and at 3.35 TB/s that takes 4 ms: at
          most about 240 tokens a second, whatever the arithmetic rate. Batching many requests together raises m, and the
          FLOPs, without reading the weights again. The next lesson makes this ratio of FLOPs to bytes precise.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "flops",
      rung: "check",
      prompt: <p>How many GFLOPs (10<sup>9</sup> FLOPs) does a 2048 × 4096 by 4096 × 11008 matrix product take, counting 2mnk? Give three decimals.</p>,
      answer: { kind: "numeric", value: 184.684, tolerance: 0.0006 },
    },
    {
      key: "bytes",
      rung: "check",
      prompt: <p>How many megabytes (10<sup>6</sup> bytes) must an elementwise addition of two bf16 tensors of a million elements move at the least?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0 },
    },
    {
      key: "decode",
      rung: "apply",
      prompt: <p>Why does generating one token at a time use only a small fraction of a GPU&apos;s peak FLOP/s?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every weight is read from memory for only 2 FLOPs, so the time is set by memory bandwidth",
          "Token generation does not use matrix products",
          "The GPU runs at a lower clock speed during inference",
          "Each token needs more FLOPs than a training step",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def matmul_cost(m, n, k, size=2):
    return 2 * m * n * k, size * (m * k + k * n + m * n)

def elementwise_cost(n, inputs, size=2, flops_per=1):
    return n * flops_per, size * n * (inputs + 1)

def chain_bytes(n, ops, size=2, fused=False):
    return 2 * n * size * (1 if fused else ops)

print(matmul_cost(1024, 1024, 1024), matmul_cost(1, 4096, 4096), elementwise_cost(1000, 2))
print(chain_bytes(10 ** 6, 4), chain_bytes(10 ** 6, 4, fused=True), chain_bytes(10 ** 6, 4, size=4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(2147483648, 6291456) (33554432, 33570816) (1000, 6000)\n16000000 4000000 32000000",
          "(2147483648, 6291456) (33554432, 33570816) (1000, 4000)\n16000000 4000000 32000000",
          "(1073741824, 6291456) (16777216, 33570816) (1000, 6000)\n16000000 4000000 32000000",
          "(2147483648, 6291456) (33554432, 33570816) (1000, 6000)\n16000000 16000000 32000000",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def conv2d_flops(h, w, cin, cout, kh, kw):
    return 2 * h * w * cout * cin * kh * kw

def attention_flops(seq, d, causal=False):
    full = 4 * seq * seq * d
    return full // 2 if causal else full

def mlp_flops(tokens, d, hidden, gated=False):
    return 2 * tokens * d * hidden * (3 if gated else 2)

print(conv2d_flops(32, 32, 64, 64, 3, 3), attention_flops(2048, 128), attention_flops(2048, 128, causal=True))
print(mlp_flops(1, 4096, 16384), mlp_flops(1, 4096, 11008, gated=True), round(mlp_flops(1, 4096, 11008, gated=True) / mlp_flops(1, 4096, 16384), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "75497472 2147483648 1073741824\n268435456 270532608 1.008",
          "8388608 2147483648 1073741824\n268435456 270532608 1.008",
          "75497472 1073741824 536870912\n268435456 270532608 1.008",
          "75497472 2147483648 1073741824\n134217728 180355072 1.344",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>matmul_cost(m, n, k, size=2)</C> and <C>elementwise_cost(n, inputs, size=2, flops_per=1)</C>, each
          returning (FLOPs, bytes), and <C>chain_bytes(n, ops, size=2, fused=False)</C> for a chain of unary elementwise
          operations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def matmul_cost(m, n, k, size=2):
    return 0, 0

def elementwise_cost(n, inputs, size=2, flops_per=1):
    return 0, 0

def chain_bytes(n, ops, size=2, fused=False):
    return 0
`,
        solution: COUNT,
        tests: [
          { name: "costs", code: `assert matmul_cost(1024, 1024, 1024) == (2147483648, 6291456) and matmul_cost(1, 4096, 4096) == (33554432, 33570816)
assert matmul_cost(2, 3, 5, size=4) == (60, 4 * (10 + 15 + 6)) and matmul_cost(2048, 11008, 4096)[0] == 184683593728
assert elementwise_cost(1000, 2) == (1000, 6000) and elementwise_cost(10, 1, size=4, flops_per=5) == (50, 80)` },
          { name: "chains", code: `assert chain_bytes(10 ** 6, 4) == 16000000 and chain_bytes(10 ** 6, 4, fused=True) == 4000000 and chain_bytes(10 ** 6, 4, size=4) == 32000000
assert chain_bytes(7, 1) == chain_bytes(7, 1, fused=True) == 28 and chain_bytes(5, 3, size=1, fused=True) == 10` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>conv2d_flops(h, w, cin, cout, kh, kw)</C> for an h × w output; <C>attention_flops(seq, d, causal=False)</C>,
          the FLOPs of the two attention products, halved (with integer division) when causal; and{" "}
          <C>mlp_flops(tokens, d, hidden, gated=False)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def conv2d_flops(h, w, cin, cout, kh, kw):
    return 0

def attention_flops(seq, d, causal=False):
    return 0

def mlp_flops(tokens, d, hidden, gated=False):
    return 0
`,
        solution: MODELS,
        tests: [
          { name: "conv and attention", code: `assert conv2d_flops(32, 32, 64, 64, 3, 3) == 75497472 and conv2d_flops(1, 1, 1, 1, 1, 1) == 2 and conv2d_flops(56, 56, 64, 128, 1, 1) == 2 * 56 * 56 * 64 * 128
assert attention_flops(2048, 128) == 2147483648 and attention_flops(2048, 128, causal=True) == 1073741824 and attention_flops(3, 1, causal=True) == 18` },
          { name: "mlp", code: `assert mlp_flops(1, 4096, 16384) == 268435456 and mlp_flops(1, 4096, 11008, gated=True) == 270532608
assert mlp_flops(10, 2, 3) == 240 and mlp_flops(10, 2, 3, gated=True) == 360` },
        ],
      },
    },
    {
      key: "cross",
      rung: "stretch",
      prompt: (
        <p>
          A transformer layer with width d = 4096 has four d × d projections and an MLP with hidden size 4d. At what
          sequence length s do the (non-causal) attention products, <M>{"4s^2d"}</M> FLOPs, equal the FLOPs of the
          projections and the MLP together?
        </p>
      ),
      answer: { kind: "numeric", value: 24576, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        FLOPs and bytes are most useful as a ratio. The next lesson defines it, the arithmetic intensity, and shows that it
        alone decides whether an operation can ever keep the arithmetic units busy.
      </p>
    </>
  ),
};
