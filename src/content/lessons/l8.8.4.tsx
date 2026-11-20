import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SparseMaskViz } from "@/components/viz/SparseMaskViz";
import type { LessonContent } from "@/lib/types";

const MASKS = `def window_mask(n, w):
    return [[j <= i and i - j < w for j in range(n)] for i in range(n)]

def sink_window_mask(n, w, sinks):
    return [[j <= i and (i - j < w or j < sinks) for j in range(n)] for i in range(n)]

def receptive_field(w, layers):
    return (w - 1) * layers + 1`;

const BLOCKS = `def block_scores(q, keys, block):
    scores = []
    for start in range(0, len(keys), block):
        ks = keys[start:start + block]
        mean = [sum(col) / len(ks) for col in zip(*ks)]
        scores.append(sum(a * b for a, b in zip(q, mean)))
    return scores

def top_blocks(scores, k, current):
    earlier = sorted(range(current), key=lambda b: -scores[b])[:k]
    return sorted(earlier + [current])

def attended_fraction(n, block, k):
    return min(1.0, (k + 1) * block / n)`;

export const lesson: LessonContent = {
  id: "l8.8.4",
  minutes: 50,
  links: {
    requires: ["l8.8.3", "l8.7.2"],
    revisits: ["l8.2.2", "l8.3.1"],
    foreshadows: ["e9.4.2", "e10.4.3"],
  },

  puzzle: (
    <>
      <p>
        Mistral 7B lets each token attend only to the previous 4,096 tokens, yet its report says information can travel about
        131 thousand tokens. StreamingLLM found that a windowed model breaks down the moment the very first tokens of the text
        leave its window, even though those tokens are usually meaningless, and that keeping just four of them fixes it. What
        do sparse attention patterns keep, what do they lose, and why do the first tokens matter so much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Full attention compares every token with every earlier one. Most of that work is spent on pairs that matter little, so
        a sparse pattern keeps only some pairs: a band of recent tokens, a few fixed ones, or the blocks that look most relevant
        to the query. Stacking layers lets information hop band to band, so a local pattern can still reach far, though less
        reliably than direct attention. The first tokens are special because the softmax must put its weight somewhere, and
        models learn to park unneeded weight on them.
      </p>
      <SparseMaskViz />
    </>
  ),

  theory: (
    <>
      <Definition title="windows and sinks">
        <p>
          A sliding window of width w lets query i attend to keys j with <M>{"i - w < j \\le i"}</M> (<C>window_mask</C>). Its cache is a
          rolling buffer of w entries, and its cost per token is constant. Adding s sink tokens also allows <M>{"j < s"}</M>{" "}
          (<C>sink_window_mask</C>). Through L layers, information can travel up to the receptive field (<C>receptive_field</C>).
        </p>
        <Code>{MASKS}</Code>
      </Definition>

      <Theorem title="receptive field of stacked windows">
        <p>
          With window w in every one of L layers, the output at position i depends on inputs at positions as early as{" "}
          <M>{"i - (w-1)L"}</M> and no earlier, so the receptive field spans <M>{"(w-1)L + 1"}</M> positions.
        </p>
      </Theorem>
      <Proof>
        <p>
          One layer mixes position i with positions <M>{"i-w+1"}</M> to i, a reach of <M>{"w - 1"}</M> back. If after <M>{"\\ell"}</M> layers position i
          depends on inputs back to <M>{"i - (w-1)\\ell"}</M>, then after one more layer it depends on the layer-<M>{"\\ell"}</M> states at{" "}
          <M>{"i-w+1"}</M> and later, which in turn reach back to <M>{"i - w + 1 - (w-1)\\ell = i - (w-1)(\\ell+1)"}</M>. Nothing earlier is
          reachable since no layer looks further than <M>{"w - 1"}</M> back. The bound is on dependence, not on use: signals relayed
          through many layers weaken, and windowed models recall far less than full attention at the edge of this range.
        </p>
      </Proof>

      <Remark title="attention sinks">
        <p>
          Xiao and colleagues observed that trained models put a large share of attention on the first few tokens regardless of
          content. A softmax row must sum to one, and when a head has nothing useful to attend to it dumps its weight on tokens
          every query can see, which are the first ones. Evicting them from the window changes every row&apos;s normaliser and
          wrecks the outputs; keeping four of them as sinks let windowed models run over millions of tokens with stable
          perplexity. Later models build the sink in, for example gpt-oss with a learned sink logit per head.
        </p>
      </Remark>

      <Definition title="selected blocks">
        <p>
          Content-dependent sparsity picks the keys per query. Moonshot&apos;s MoBA splits keys into blocks, scores each by the dot product
          of the query with the block&apos;s mean key (<C>block_scores</C>), and attends to the top k earlier blocks and the current one
          (<C>top_blocks</C>), a fraction of about <M>{"(k+1)B/n"}</M> of the keys (<C>attended_fraction</C>); routing to blocks is like routing to
          experts (l8.3.1). DeepSeek&apos;s native sparse attention combines three branches, compressed block summaries, selected
          blocks and a sliding window, with learned gates, and DeepSeek-V3.2 uses a small indexer to select 2,048 tokens per query.
        </p>
        <Code>{BLOCKS}</Code>
      </Definition>

      <Example title="local and global layers">
        <p>
          Gemma 2 alternated layers with a 4,096-token window and full global layers. Gemma 3 moved to five local layers with a
          1,024-token window for every global one, which cut the key-value cache at long context sharply with little loss in
          quality, since the global layers provide the long-range recall. This is the hybrid idea of l8.8.3 with windowed
          attention playing the part of the recurrent layers.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "field",
      rung: "check",
      prompt: <p>A model has 32 layers, each with a sliding window of 4,096 tokens including the current one. How many positions does its receptive field span?</p>,
      answer: { kind: "numeric", value: 131041, tolerance: 0.5 },
    },
    {
      key: "pairs",
      rung: "check",
      prompt: (
        <p>
          For a sequence of 32,768 tokens, what fraction of the causal query-key pairs of full attention does a sliding window of
          4,096 keep? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.234, tolerance: 0.001 },
    },
    {
      key: "sink",
      rung: "apply",
      prompt: <p>Why does a windowed model&apos;s perplexity jump when the first tokens of the text leave its window, unless they are kept?</p>,
      answer: {
        kind: "choice",
        options: [
          "Heads learn to park unneeded attention weight on the first tokens, so removing them changes the softmax normalisation of every row and corrupts the outputs",
          "The first tokens contain the most important information in any text",
          "Rotary embeddings cannot represent positions beyond the window",
          "The key-value cache overflows when the first tokens are evicted",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def window_mask(n, w):
    return [[j <= i and i - j < w for j in range(n)] for i in range(n)]

def sink_window_mask(n, w, sinks):
    return [[j <= i and (i - j < w or j < sinks) for j in range(n)] for i in range(n)]

def receptive_field(w, layers):
    return (w - 1) * layers + 1

print([sum(r) for r in window_mask(4, 2)], [sum(r) for r in sink_window_mask(5, 2, 1)])
print(receptive_field(3, 4), window_mask(3, 1)[2])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2, 2, 2] [1, 2, 3, 3, 3]\n9 [False, False, True]",
          "[1, 2, 3, 3] [1, 2, 3, 3, 3]\n9 [False, False, True]",
          "[1, 2, 2, 2] [1, 2, 2, 2, 2]\n12 [False, False, True]",
          "[1, 2, 2, 2] [1, 2, 3, 3, 3]\n9 [True, True, True]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def block_scores(q, keys, block):
    scores = []
    for start in range(0, len(keys), block):
        ks = keys[start:start + block]
        mean = [sum(col) / len(ks) for col in zip(*ks)]
        scores.append(sum(a * b for a, b in zip(q, mean)))
    return scores

def top_blocks(scores, k, current):
    earlier = sorted(range(current), key=lambda b: -scores[b])[:k]
    return sorted(earlier + [current])

def attended_fraction(n, block, k):
    return min(1.0, (k + 1) * block / n)

print(block_scores([1.0, 0.0], [[2.0, 9.0], [4.0, 9.0], [-1.0, 0.0], [1.0, 5.0]], 2), top_blocks([0.5, 3.0, 1.0, 2.0], 2, 3))
print(top_blocks([5.0], 2, 0), attended_fraction(64, 8, 3), attended_fraction(16, 8, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[3.0, 0.0] [1, 2, 3]\n[0] 0.5 1.0",
          "[3.0, 0.0] [0, 1, 3]\n[0] 0.5 1.0",
          "[6.0, 0.0] [1, 2, 3]\n[0] 0.5 1.0",
          "[3.0, 0.0] [1, 2, 3]\n[] 0.375 1.5",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>window_mask(n, w)</C> and <C>sink_window_mask(n, w, sinks)</C> as n-by-n lists of booleans indexed [query][key], and{" "}
          <C>receptive_field(w, layers)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def window_mask(n, w):
    return [[j <= i for j in range(n)] for i in range(n)]

def sink_window_mask(n, w, sinks):
    return window_mask(n, w)

def receptive_field(w, layers):
    return w * layers
`,
        solution: MASKS,
        tests: [
          { name: "window", code: `m = window_mask(6, 3)\nassert [sum(r) for r in m] == [1, 2, 3, 3, 3, 3] and m[5][3] and not m[5][2] and not m[2][3]` },
          { name: "sinks", code: `m = sink_window_mask(7, 2, 2)\nassert [sum(r) for r in m] == [1, 2, 3, 4, 4, 4, 4] and m[6][1] and not m[6][4] and receptive_field(5, 3) == 13` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_scores(q, keys, block)</C>, <C>top_blocks(scores, k, current)</C>, which returns the current block and the k
          highest-scoring earlier blocks in increasing order, and <C>attended_fraction(n, block, k)</C>, capped at 1.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def block_scores(q, keys, block):
    return [0.0] * (len(keys) // block)

def top_blocks(scores, k, current):
    return list(range(k)) + [current]

def attended_fraction(n, block, k):
    return k * block / n
`,
        solution: BLOCKS,
        tests: [
          { name: "scores", code: `s = block_scores([1.0, 2.0], [[1.0, 1.0], [3.0, 1.0], [0.0, 0.0], [0.0, -2.0], [5.0, 0.0]], 2)\nassert s == [4.0, -2.0, 5.0]` },
          { name: "select", code: `assert top_blocks([0.1, 0.9, 0.4, 0.8, 0.0], 2, 4) == [1, 3, 4] and top_blocks([1.0, 2.0], 3, 1) == [0, 1]\nassert attended_fraction(128, 16, 1) == 0.25 and attended_fraction(32, 16, 4) == 1.0` },
        ],
      },
    },
    {
      key: "gemma",
      rung: "stretch",
      prompt: (
        <p>
          A model has five local layers with a 1,024-token window for every global layer, and otherwise identical attention
          shapes. At a context of 131,072 tokens, what fraction of the key-value cache of an all-global model of the same depth
          does it need? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.173, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes the course. Pretraining at scale is a chain of choices, data, architecture, experts, scaling laws,
        hyperparameters, schedules, monitoring, mid-training and efficient attention, each tested with small runs before it
        is trusted in a large one.
      </p>
    </>
  ),
};
