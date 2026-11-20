import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { HybridMemoryViz } from "@/components/viz/HybridMemoryViz";
import type { LessonContent } from "@/lib/types";

const MEMORY = `def layer_pattern(n_layers, period, offset):
    return ["A" if i % period == offset else "R" for i in range(n_layers)]

def kv_cache_bytes(pattern, n_ctx, n_kv_heads, d_head, bytes_per=2):
    return pattern.count("A") * 2 * n_kv_heads * d_head * n_ctx * bytes_per

def state_bytes(pattern, state_size, bytes_per=2):
    return pattern.count("R") * state_size * bytes_per`;

const COMPUTE = `def attn_fraction(pattern):
    return pattern.count("A") / len(pattern)

def longest_recurrent_run(pattern):
    best = run = 0
    for p in pattern:
        run = run + 1 if p == "R" else 0
        best = max(best, run)
    return best

def decode_flops(pattern, n_params, n_ctx, d_model):
    return 2 * n_params + 2 * pattern.count("A") * n_ctx * d_model`;

export const lesson: LessonContent = {
  id: "l8.8.3",
  minutes: 45,
  links: {
    requires: ["l8.8.2", "l8.2.2"],
    revisits: ["l8.3.4", "l8.7.3", "l8.2.4"],
    foreshadows: ["l8.8.4"],
  },

  puzzle: (
    <>
      <p>
        AI21&apos;s Jamba reported a key-value cache of 4 GB at 256 thousand tokens, against 32 GB for Mixtral, by making seven of
        every eight layers Mamba layers. An NVIDIA study found that a pure Mamba model of 8 billion parameters matched a
        transformer on many benchmarks but fell behind on those that need to copy or look up information from the context,
        while a hybrid with only a handful of attention layers beat both. Why should a few attention layers be enough?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Recurrent layers are cheap and good at the bulk of language modelling, the local, compressible structure that a fixed
        state captures well. What they cannot do is recall an exact item from far back, because their state is full. One
        attention layer can, since its cache holds every token. So a stack that is mostly recurrent with an occasional
        attention layer gets nearly all of attention&apos;s recall at a fraction of its memory, and memory is decided by how many
        attention layers remain.
      </p>
      <HybridMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="layer patterns and memory">
        <p>
          A hybrid is described by its layer pattern, here a list of &quot;A&quot; for attention and &quot;R&quot; for recurrent, often periodic
          with one attention layer per period (<C>layer_pattern</C>). Each attention layer caches keys and values,{" "}
          <M>{"2\\,h_{kv}\\,d_h\\,n"}</M> numbers for n tokens (<C>kv_cache_bytes</C>); each recurrent layer keeps a state of fixed size
          (<C>state_bytes</C>). Grouped-query attention (l8.2.2) shrinks the first factor; the hybrid shrinks the number of layers
          that pay it.
        </p>
        <Code>{MEMORY}</Code>
      </Definition>

      <Theorem title="memory and decode cost scale with the attention fraction">
        <p>
          Let a hybrid of L layers have a fraction f of attention layers, with the same attention shape as a transformer of L
          layers. Its key-value cache is exactly f times the transformer&apos;s at every length, and the context-dependent part of its
          per-token decoding compute is also f times the transformer&apos;s.
        </p>
      </Theorem>
      <Proof>
        <p>
          The cache is the sum over attention layers of the same per-layer amount <M>{"2h_{kv}d_h n"}</M>; the hybrid has fL such layers
          and the transformer L. Likewise, the work of attending to n cached tokens is the same per attention layer, and recurrent
          layers have no term that grows with n. The parameter term <M>{"2N"}</M> is unchanged if the total parameter count is matched,
          so for short contexts the two cost the same per token, and the hybrid&apos;s advantage grows with length (<C>decode_flops</C>).
        </p>
      </Proof>

      <Definition title="pattern diagnostics">
        <p>
          The attention fraction (<C>attn_fraction</C>) sets memory. The longest run of consecutive recurrent layers
          (<C>longest_recurrent_run</C>) bounds how far through the stack information must travel through fixed-size states before
          an attention layer can look it up, which is one reason designs spread their attention layers evenly rather than
          grouping them.
        </p>
        <Code>{COMPUTE}</Code>
      </Definition>

      <Remark title="published designs">
        <p>
          Jamba used blocks of eight layers with one attention layer and seven Mamba layers, mixture-of-experts feed-forward
          layers in every other layer (l8.3.4), and no explicit positional encoding, since the Mamba layers already carry order.
          Griffin and RecurrentGemma alternate two gated linear recurrent blocks with one local-attention block. NVIDIA&apos;s 8B
          study placed about 8% of its layers as attention, spread through the stack, among Mamba-2 and MLP layers.
          MiniMax-01 put one softmax attention layer after every seven linear-attention layers, and Qwen3-Next interleaves gated
          DeltaNet and gated attention three to one.
        </p>
      </Remark>

      <Example title="how the ratio is chosen">
        <p>
          The ratio is an architecture ablation like those of l8.2.4, judged on recall-heavy evaluations as well as loss. Loss
          alone is a poor guide, since a pure recurrent model can match a transformer&apos;s perplexity while failing a phone-book
          lookup at long range (l8.7.3). Reported studies find that quality rises steeply from zero to a few attention layers and
          then flattens, so the ratio is set as low as the recall tests allow, and then by the memory budget at the target
          context length.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          A 48-layer transformer has 8 key-value heads of width 128 in 16-bit precision. A hybrid keeps attention in one of every six
          layers. At 131,072 tokens, how many GiB of key-value cache does the hybrid save per sequence?
        </p>
      ),
      answer: { kind: "numeric", value: 20, tolerance: 0.01 },
    },
    {
      key: "flops",
      rung: "check",
      prompt: (
        <p>
          A 7-billion-parameter hybrid has 32 layers of width 4,096, one in eight of them attention. Using{" "}
          <M>{"2N + 2\\,n_{\\text{attn}}\\,n_{\\text{ctx}}\\,d"}</M> FLOPs per decoded token, what fraction of the cost is attention at a context of
          131,072 tokens? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.235, tolerance: 0.001 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why do hybrids keep a few attention layers rather than none?</p>,
      answer: {
        kind: "choice",
        options: [
          "Recurrent layers compress the past into a fixed state and cannot reliably recall exact items from far back; even a few attention layers, whose cache keeps every token, restore that ability",
          "Attention layers are cheaper than recurrent layers at long context",
          "Recurrent layers cannot be trained without attention layers",
          "Attention layers are needed to add positional information",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def layer_pattern(n_layers, period, offset):
    return ["A" if i % period == offset else "R" for i in range(n_layers)]

def kv_cache_bytes(pattern, n_ctx, n_kv_heads, d_head, bytes_per=2):
    return pattern.count("A") * 2 * n_kv_heads * d_head * n_ctx * bytes_per

def state_bytes(pattern, state_size, bytes_per=2):
    return pattern.count("R") * state_size * bytes_per

print("".join(layer_pattern(6, 3, 1)), kv_cache_bytes(list("RARRAR"), 10, 1, 2), state_bytes(list("RARRAR"), 5))
print(kv_cache_bytes(["A"], 3, 2, 1, 1), "".join(layer_pattern(4, 2, 0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "RARRAR 160 40\n12 ARAR",
          "ARRARR 160 40\n12 ARAR",
          "RARRAR 80 40\n6 ARAR",
          "RARRAR 160 20\n12 RARA",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def attn_fraction(pattern):
    return pattern.count("A") / len(pattern)

def longest_recurrent_run(pattern):
    best = run = 0
    for p in pattern:
        run = run + 1 if p == "R" else 0
        best = max(best, run)
    return best

def decode_flops(pattern, n_params, n_ctx, d_model):
    return 2 * n_params + 2 * pattern.count("A") * n_ctx * d_model

print(attn_fraction(list("RARRAR")), longest_recurrent_run(list("RARRAR")), longest_recurrent_run(["A", "A"]))
print(decode_flops(list("RARRAR"), 100, 10, 3), decode_flops(["R"] * 4, 100, 10 ** 6, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.3333333333333333 2 0\n320 200",
          "0.3333333333333333 2 0\n320 24000200",
          "0.5 3 0\n320 200",
          "0.3333333333333333 2 1\n180 200",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_pattern(n_layers, period, offset)</C>, <C>kv_cache_bytes(pattern, n_ctx, n_kv_heads, d_head, bytes_per=2)</C> and{" "}
          <C>state_bytes(pattern, state_size, bytes_per=2)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def layer_pattern(n_layers, period, offset):
    return ["A"] * n_layers

def kv_cache_bytes(pattern, n_ctx, n_kv_heads, d_head, bytes_per=2):
    return n_kv_heads * d_head * n_ctx * bytes_per

def state_bytes(pattern, state_size, bytes_per=2):
    return state_size * bytes_per
`,
        solution: MEMORY,
        tests: [
          { name: "pattern", code: `assert "".join(layer_pattern(8, 4, 3)) == "RRRARRRA" and "".join(layer_pattern(3, 1, 0)) == "AAA"` },
          { name: "bytes", code: `p = list("ARRRAR")\nassert kv_cache_bytes(p, 1000, 4, 64) == 2 * 2 * 4 * 64 * 1000 * 2 and state_bytes(p, 300, 4) == 4 * 300 * 4` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attn_fraction(pattern)</C>, <C>longest_recurrent_run(pattern)</C> and <C>decode_flops(pattern, n_params, n_ctx, d_model)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def attn_fraction(pattern):
    return 1.0

def longest_recurrent_run(pattern):
    return pattern.count("R")

def decode_flops(pattern, n_params, n_ctx, d_model):
    return 2 * n_params
`,
        solution: COMPUTE,
        tests: [
          { name: "shape", code: `p = list("RRARRRRAR")\nassert abs(attn_fraction(p) - 2 / 9) < 1e-12 and longest_recurrent_run(p) == 4 and longest_recurrent_run(list("AAA")) == 0` },
          { name: "flops", code: `assert decode_flops(list("RARA"), 50, 7, 3) == 100 + 2 * 2 * 7 * 3` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          A 32-layer model has 8 key-value heads of width 128 in 16-bit precision and serves sequences of 262,144 tokens with at most
          10 GiB of key-value cache each. Attention layers are placed periodically, one per period, and the period must divide 32.
          What is the largest number of attention layers it can keep?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        Hybrids replace most attention layers. The final lesson keeps every layer as attention but limits what each token
        attends to: sliding windows, attention sinks and learned sparse patterns.
      </p>
    </>
  ),
};
