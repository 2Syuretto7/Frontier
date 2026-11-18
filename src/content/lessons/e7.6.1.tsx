import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LayerFlopsViz } from "@/components/viz/LayerFlopsViz";
import type { LessonContent } from "@/lib/types";

const FWD = `def layer_flops(d, n_heads, n_kv, hidden, ctx, gated=True):
    hd = d // n_heads
    return {'qkv': 2 * d * (d + 2 * n_kv * hd), 'attn': 4 * ctx * d,
            'out': 2 * d * d, 'mlp': 2 * d * hidden * (3 if gated else 2)}

def forward_flops(layers, vocab, d, n_heads, n_kv, hidden, ctx, gated=True):
    return layers * sum(layer_flops(d, n_heads, n_kv, hidden, ctx, gated).values()) + 2 * d * vocab

def prefill_flops(seq, layers, vocab, d, n_heads, n_kv, hidden, gated=True):
    fixed = forward_flops(layers, vocab, d, n_heads, n_kv, hidden, 0, gated)
    return seq * fixed + layers * 4 * d * seq * (seq + 1) // 2`;

const TRAIN = `def params_count(layers, vocab, d, n_heads, n_kv, hidden, gated=True, tied=False):
    hd = d // n_heads
    per_layer = d * (d + 2 * n_kv * hd) + d * d + d * hidden * (3 if gated else 2)
    return layers * per_layer + vocab * d * (1 if tied else 2)

def step_flops(dense, attn, recompute='none'):
    extra = {'none': 0, 'selective': attn, 'full': dense + attn}[recompute]
    return 3 * (dense + attn) + extra

def attention_share(ctx, d, other_per_layer):
    return 4 * ctx * d / (4 * ctx * d + other_per_layer)`;

export const lesson: LessonContent = {
  id: "e7.6.1",
  minutes: 50,
  links: {
    requires: ["e7.4.4", "l5.3.3"],
    revisits: ["e7.4.1"],
    foreshadows: ["e7.6.2", "e7.6.3"],
  },

  puzzle: (
    <>
      <p>
        The rule of thumb says a forward pass costs 2 FLOPs per parameter per token. For a 7-billion-parameter model with
        a 32 000-token context, a profiler counts more than twice that. Nothing is wrong with the profiler. What does the
        rule leave out, and how would you count a modern transformer exactly, with grouped-query attention and a gated MLP?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Almost every FLOP in a transformer is in a matrix product, and a matrix product costs 2 FLOPs per entry of the
        weight per token. So count the weights, layer by layer. The one large exception is attention itself: comparing a
        token with every earlier token and averaging their values involves no weights at all, and its cost grows with the
        context. At short contexts it is a rounding error; at long contexts it dominates.
      </p>
      <LayerFlopsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the shape of a decoder">
        <p>
          A decoder has L layers of width d, h query heads of dimension d/h, g key-value heads (g = h is standard
          multi-head attention, g &lt; h is <em>grouped-query attention</em>, g = 1 multi-query), an MLP of hidden size f,
          gated in modern models (<M>{"W_2(\\operatorname{silu}(W_1x) \\odot W_3x)"}</M>, three matrices), and a vocabulary
          of V tokens with an input embedding and an output projection.
        </p>
      </Definition>

      <Theorem title="forward FLOPs per token">
        <p>A token attending to c positions costs, in each layer,</p>
        <MD>{"2d\\Bigl(d + \\frac{2gd}{h}\\Bigr) + 4cd + 2d^2 + 6df"}</MD>
        <p>FLOPs for the Q, K, V projections, attention, output projection and gated MLP, plus 2dV once for the logits.</p>
      </Theorem>
      <Proof>
        <p>
          A product with a weight of shape <M>{"a \\times b"}</M> costs 2ab per token (e7.4.1). Q has d outputs, K and V{" "}
          <M>{"gd/h"}</M> each, all from d inputs; the output projection is <M>{"d \\times d"}</M>; the gated MLP has three
          matrices of <M>{"d \\times f"}</M>; the logits are <M>{"d \\times V"}</M>. The input embedding is a lookup and costs
          nothing. For attention, each of the h heads takes c dot products of length d/h for the scores and a weighted sum of
          c vectors of length d/h, <M>{"2c\\,d/h"}</M> FLOPs each, so <M>{"4cd"}</M> over all heads. Grouped-query attention
          shrinks K and V but not this term, because every query head still attends to every position.
        </p>
        <Code>{FWD}</Code>
      </Proof>

      <Theorem title="the 2N rule, exactly">
        <p>
          With untied embeddings, the forward FLOPs per token without the attention term are <M>{"2N - 2Vd"}</M>, where N is the
          parameter count; with tied embeddings they are exactly 2N.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every weight matrix contributes 2 FLOPs per entry per token, and every parameter apart from the embeddings is in
          such a matrix (ignoring norms and biases, which are a tiny fraction). The output projection is used, the input
          embedding is not; untied, they are separate tables of Vd parameters each, so the FLOPs are{" "}
          <M>{"2(N - Vd)"}</M>; tied, they are one table, used once. The full count is this plus <M>{"4Lcd"}</M>, which is
          what the puzzle&apos;s profiler saw.
        </p>
      </Proof>

      <Theorem title="prefill">
        <p>
          Processing a prompt of s tokens with causal attention, where token t attends to t positions, takes{" "}
          <MD>{"sF_0 + 4Ld\\,\\frac{s(s + 1)}{2}"}</MD>
          FLOPs, where <M>{"F_0"}</M> is the per-token count without attention.
        </p>
      </Theorem>
      <Proof>
        <p>
          The weight terms are the same for every token, giving <M>{"sF_0"}</M>. The attention term of token t is{" "}
          <M>{"4Ltd"}</M>, and <M>{"\\sum_{t=1}^{s} t = s(s+1)/2"}</M>. A kernel that computed the full{" "}
          <M>{"s \\times s"}</M> score matrix and then masked it would do twice the attention work; efficient kernels skip
          the masked blocks.
        </p>
      </Proof>

      <Example title="training and recomputation">
        <p>
          The backward pass costs twice the forward (e7.4.4), so a training step is 3 times the forward FLOPs. Recomputing
          every activation in the backward pass to save memory adds a fourth forward pass. <em>Selective</em> recomputation
          (Korthikanti et al., 2022) recomputes only the attention core, whose activations are large (they grow with c) but
          whose FLOPs are a modest share at ordinary contexts, so it saves most of the memory for a few per cent of extra
          compute. <C>step_flops</C> counts the three choices.
        </p>
        <Code>{TRAIN}</Code>
      </Example>

      <Remark title="where to spend FLOPs">
        <p>
          Since FLOPs per token are nearly 2N, a fixed compute budget C buys about <M>{"C/6N"}</M> training tokens: a larger
          model sees fewer of them. How to balance the two is a question of scaling laws, taken up in the language-model
          course; the arithmetic here is what turns a budget in GPU-hours into the N and D those laws talk about.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>How many billion parameters does a model with 80 layers, d = 8192, 64 heads, 8 key-value heads, a gated MLP of hidden size 28 672 and an untied vocabulary of 128 256 have? Give three decimals.</p>,
      answer: { kind: "numeric", value: 70.552, tolerance: 0.0006 },
    },
    {
      key: "attn",
      rung: "check",
      prompt: <p>How many GFLOPs does the attention term cost in the forward pass of one token attending to 8192 positions in a 32-layer model of width 4096? Give three decimals.</p>,
      answer: { kind: "numeric", value: 4.295, tolerance: 0.0006 },
    },
    {
      key: "gqa",
      rung: "apply",
      prompt: <p>Switching from 32 key-value heads to 8 (grouped-query attention) in a 32-head model changes which FLOPs?</p>,
      answer: {
        kind: "choice",
        options: [
          "It shrinks the K and V projections to a quarter; the attention scores and weighted sum stay the same",
          "It divides the attention scores by four",
          "It shrinks the MLP",
          "It changes no FLOPs, only memory",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def layer_flops(d, n_heads, n_kv, hidden, ctx, gated=True):
    hd = d // n_heads
    return {'qkv': 2 * d * (d + 2 * n_kv * hd), 'attn': 4 * ctx * d,
            'out': 2 * d * d, 'mlp': 2 * d * hidden * (3 if gated else 2)}

def forward_flops(layers, vocab, d, n_heads, n_kv, hidden, ctx, gated=True):
    return layers * sum(layer_flops(d, n_heads, n_kv, hidden, ctx, gated).values()) + 2 * d * vocab

def prefill_flops(seq, layers, vocab, d, n_heads, n_kv, hidden, gated=True):
    fixed = forward_flops(layers, vocab, d, n_heads, n_kv, hidden, 0, gated)
    return seq * fixed + layers * 4 * d * seq * (seq + 1) // 2

print(layer_flops(8, 2, 1, 32, 10), forward_flops(2, 100, 8, 2, 1, 32, 10))
print(prefill_flops(3, 2, 100, 8, 2, 1, 32), prefill_flops(1, 2, 100, 8, 2, 1, 32) == forward_flops(2, 100, 8, 2, 1, 32, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "{'qkv': 256, 'attn': 320, 'out': 128, 'mlp': 1536} 6080\n16704 True",
          "{'qkv': 384, 'attn': 320, 'out': 128, 'mlp': 1536} 6336\n17472 True",
          "{'qkv': 256, 'attn': 320, 'out': 128, 'mlp': 1024} 5056\n13632 True",
          "{'qkv': 256, 'attn': 320, 'out': 128, 'mlp': 1536} 6080\n16320 False",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def params_count(layers, vocab, d, n_heads, n_kv, hidden, gated=True, tied=False):
    hd = d // n_heads
    per_layer = d * (d + 2 * n_kv * hd) + d * d + d * hidden * (3 if gated else 2)
    return layers * per_layer + vocab * d * (1 if tied else 2)

def step_flops(dense, attn, recompute='none'):
    extra = {'none': 0, 'selective': attn, 'full': dense + attn}[recompute]
    return 3 * (dense + attn) + extra

def attention_share(ctx, d, other_per_layer):
    return 4 * ctx * d / (4 * ctx * d + other_per_layer)

print(params_count(2, 100, 8, 2, 1, 32), params_count(2, 100, 8, 2, 1, 32, tied=True), round(params_count(32, 32000, 4096, 32, 32, 11008) / 1e9, 3))
print(step_flops(100, 20), step_flops(100, 20, 'selective'), step_flops(100, 20, 'full'), round(attention_share(4096, 4096, 24 * 4096 ** 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "3520 2720 6.738\n360 380 480 0.1429",
          "3520 2720 6.738\n360 400 480 0.1429",
          "3520 3520 6.738\n360 380 480 0.1429",
          "3520 2720 6.607\n360 380 460 0.1667",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_flops(d, n_heads, n_kv, hidden, ctx, gated=True)</C>, a dict with keys qkv, attn, out and mlp;{" "}
          <C>forward_flops(layers, vocab, d, n_heads, n_kv, hidden, ctx, gated=True)</C>, per token including the logits; and{" "}
          <C>prefill_flops(seq, layers, vocab, d, n_heads, n_kv, hidden, gated=True)</C> with causal attention, as an integer.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def layer_flops(d, n_heads, n_kv, hidden, ctx, gated=True):
    return {}

def forward_flops(layers, vocab, d, n_heads, n_kv, hidden, ctx, gated=True):
    return 0

def prefill_flops(seq, layers, vocab, d, n_heads, n_kv, hidden, gated=True):
    return 0
`,
        solution: FWD,
        tests: [
          { name: "per token", code: `assert layer_flops(8, 2, 1, 32, 10) == {'qkv': 256, 'attn': 320, 'out': 128, 'mlp': 1536}
assert layer_flops(8, 2, 2, 32, 0, gated=False) == {'qkv': 384, 'attn': 0, 'out': 128, 'mlp': 1024}
assert forward_flops(2, 100, 8, 2, 1, 32, 10) == 6080 and forward_flops(32, 32000, 4096, 32, 32, 11008, 0) == 13214154752` },
          { name: "prefill", code: `assert prefill_flops(3, 2, 100, 8, 2, 1, 32) == 16704 and prefill_flops(1, 2, 100, 8, 2, 1, 32) == forward_flops(2, 100, 8, 2, 1, 32, 1)
args = (3, 50, 8, 4, 2, 16)
assert prefill_flops(5, *args) == sum(forward_flops(*args, t) for t in range(1, 6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>params_count(layers, vocab, d, n_heads, n_kv, hidden, gated=True, tied=False)</C>, ignoring norms and biases;{" "}
          <C>step_flops(dense, attn, recompute=&apos;none&apos;)</C> for &apos;none&apos;, &apos;selective&apos; and
          &apos;full&apos;; and <C>attention_share(ctx, d, other_per_layer)</C>, the attention term&apos;s share of a layer&apos;s
          forward FLOPs.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def params_count(layers, vocab, d, n_heads, n_kv, hidden, gated=True, tied=False):
    return 0

def step_flops(dense, attn, recompute='none'):
    return 3 * dense

def attention_share(ctx, d, other_per_layer):
    return 0.0
`,
        solution: TRAIN,
        tests: [
          { name: "params", code: `assert params_count(2, 100, 8, 2, 1, 32) == 3520 and params_count(2, 100, 8, 2, 1, 32, tied=True) == 2720
assert params_count(32, 32000, 4096, 32, 32, 11008) == 6738149376 and params_count(80, 128256, 8192, 64, 8, 28672) == 70552387584
assert params_count(1, 10, 4, 1, 1, 8, gated=False) == 4 * 12 + 16 + 64 + 80` },
          { name: "steps", code: `assert step_flops(100, 20) == 360 and step_flops(100, 20, 'selective') == 380 and step_flops(100, 20, 'full') == 480
assert abs(attention_share(4096, 4096, 24 * 4096 ** 2) - 1 / 7) < 1e-12 and attention_share(0, 64, 5) == 0.0` },
        ],
      },
    },
    {
      key: "half",
      rung: "stretch",
      prompt: (
        <p>
          For the model with 32 layers, d = 4096, 32 heads and key-value heads, a gated MLP of 11 008 and an untied vocabulary of
          32 000, at what context c does the forward attention term per token equal all the other forward FLOPs per token,
          logits included?
        </p>
      ),
      answer: { kind: "numeric", value: 25204, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        FLOPs decide the time; memory decides whether a run is possible at all. The next lesson counts the memory of
        training: weights, gradients, optimiser state and activations.
      </p>
    </>
  ),
};
