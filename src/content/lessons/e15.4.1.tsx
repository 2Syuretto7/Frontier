import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SftPackingViz } from "@/components/viz/SftPackingViz";
import type { LessonContent } from "@/lib/types";

const TEMPLATE = `def render(messages):
    toks, mask = [], []
    for role, text in messages:
        body = [f"<|{role}|>"] + text.split() + ["<|end|>"]
        train = role == "assistant"
        toks += body
        mask += [0] + [int(train)] * (len(body) - 1)       # learn the reply and its end marker, never the role tag
    return toks, mask

def masked_mean(losses, mask):
    n = sum(mask)
    return sum(l * m for l, m in zip(losses, mask)) / n if n else 0.0

def trained_fraction(convs):
    masks = [render(c)[1] for c in convs]
    return sum(map(sum, masks)) / sum(map(len, masks))`;

const PACK = `def pack(lengths, max_len):
    bins, room = [], []
    for i, n in enumerate(lengths):
        for b in range(len(bins)):
            if room[b] >= n:                               # first bin with space
                bins[b].append(i)
                room[b] -= n
                break
        else:
            bins.append([i])
            room.append(max_len - n)
    return bins

def doc_ids(lengths):
    return [d for d, n in enumerate(lengths) for _ in range(n)]

def allowed_pairs(lengths):
    ids = doc_ids(lengths)
    return sum(1 for i in range(len(ids)) for j in range(i + 1) if ids[i] == ids[j])   # causal, same document`;

export const lesson: LessonContent = {
  id: "e15.4.1",
  minutes: 45,
  links: {
    requires: ["e15.3.3"],
    revisits: ["l9.1.1", "l9.1.2", "l9.1.3", "l9.1.4"],
    foreshadows: ["e15.4.2"],
  },

  puzzle: (
    <>
      <p>
        The base model continues text. Asked a question, it may answer, or write three more questions in the same style,
        or a forum thread about the question. A few tens of thousands of conversations are enough to change that, but
        only if they are formatted, masked and batched correctly: a model trained on the user&apos;s turns learns to
        imitate users, and a model trained on padded batches spends most of its compute on padding. What does a correct
        supervised fine-tuning run look like?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Render every conversation with the chat template reserved in e15.2.2, marking each turn with a role token and an
        end token. Compute the loss only on the assistant&apos;s replies and their end tokens, so the model learns to
        answer and to stop, not to ask. Pack many conversations into each training sequence with an attention mask that
        stops them seeing each other, so that every position does useful work. Then train for a few epochs at a learning
        rate well below pretraining&apos;s.
      </p>
      <SftPackingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="templates and loss masks">
        <p>
          The template turns a list of (role, text) messages into tokens: a role token, the text and an end token per
          message, as in l9.1.2 (<C>render</C>). The mask is 1 on the tokens of assistant replies and their end tokens,
          and 0 elsewhere. The loss is the mean over masked positions (<C>masked_mean</C>), and the share of tokens that
          are trained on is the mask&apos;s average over the data (<C>trained_fraction</C>).
        </p>
        <Code>{TEMPLATE}</Code>
      </Definition>

      <Definition title="packing">
        <p>
          Conversations are assigned to sequences of the context length by first fit: each goes into the first sequence
          with room, or starts a new one (<C>pack</C>). Each position carries its conversation&apos;s index{" "}
          (<C>doc_ids</C>); a position may attend to an earlier one only within the same conversation, giving a
          block-diagonal causal mask (<C>allowed_pairs</C> counts the pairs it permits), and positions restart at zero
          for each conversation.
        </p>
        <Code>{PACK}</Code>
      </Definition>

      <Theorem title="packing with a block mask changes nothing per conversation">
        <p>
          If each conversation in a packed sequence attends only to earlier positions of itself and receives positions
          numbered from zero, then its logits, and hence its loss and gradients, are exactly those it would have if it
          were trained alone.
        </p>
      </Theorem>
      <Proof>
        <p>
          A transformer layer mixes information across positions only in attention. With the block mask, the attention
          weights of a position in conversation k are a softmax over earlier positions of k alone, since every other
          position receives a score of minus infinity and weight zero. By induction over layers, the hidden state of
          each position of k depends only on k&apos;s tokens and positions, which are the same as when k is alone, so the
          outputs agree exactly. Without the mask, a conversation would attend to unrelated ones before it, a small but
          real contamination; without restarting positions, its rotary angles would differ from those it sees at
          inference.
        </p>
      </Proof>

      <Example title="the capstone SFT run">
        <p>
          About 50000 conversations: a public instruction set filtered for quality as in l9.1.1, plus a few thousand
          arithmetic and tool-use dialogues written for the evaluation plan&apos;s tasks. Packed to 16k tokens, two to
          three epochs at a learning rate a tenth of pretraining&apos;s peak, with the loss mask above. The dynamics of
          l9.1.3 apply: the format is learnt in a few hundred steps, while knowledge comes from pretraining, so the
          held-out loss on pretraining text should barely move. A LoRA run, as in l9.1.4, is a cheap way to compare
          data mixtures before the full fine-tune.
        </p>
      </Example>

      <Remark title="checks before trusting the result">
        <p>
          Decode a few masked examples back to text and confirm that exactly the assistant replies are trained on. Sample
          from the model with the template and check that it stops at the end token. Compare the evaluation plan&apos;s
          tasks before and after fine-tuning, since a format change can lower likelihood-scored benchmarks even as the
          model becomes more useful.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "frac",
      rung: "check",
      prompt: (
        <p>
          A conversation has a 30-token system message, a 120-token user turn, an 80-token reply, a 40-token user turn
          and a 260-token reply. The template adds a role token and an end token to each message, and the end tokens of
          replies are trained on. What fraction of its tokens is trained on? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6333, tolerance: 0.0001 },
    },
    {
      key: "fill",
      rung: "check",
      prompt: (
        <p>
          Conversations of 1500, 900, 700, 1200, 400 and 300 tokens are packed by first fit, in that order, into
          sequences of 2048. What fraction of the positions in the resulting sequences holds tokens? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.8138, tolerance: 0.0001 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>What goes wrong if the loss is computed on the user&apos;s turns as well as the assistant&apos;s?</p>,
      answer: {
        kind: "choice",
        options: [
          "The model also learns to write user turns, so it may continue a conversation by asking questions itself",
          "Training becomes impossible because user turns have no end token",
          "The loss can no longer be averaged",
          "Packing stops working",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def render(messages):
    toks, mask = [], []
    for role, text in messages:
        body = [f"<|{role}|>"] + text.split() + ["<|end|>"]
        train = role == "assistant"
        toks += body
        mask += [0] + [int(train)] * (len(body) - 1)       # learn the reply and its end marker, never the role tag
    return toks, mask

def masked_mean(losses, mask):
    n = sum(mask)
    return sum(l * m for l, m in zip(losses, mask)) / n if n else 0.0

def trained_fraction(convs):
    masks = [render(c)[1] for c in convs]
    return sum(map(sum, masks)) / sum(map(len, masks))

t, m = render([("user", "hi there"), ("assistant", "hello")]); print(t, m)
print(masked_mean([1, 2, 3, 4], [0, 1, 0, 1]), trained_fraction([[("system", "x"), ("assistant", "a b")]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "['<|user|>', 'hi', 'there', '<|end|>', '<|assistant|>', 'hello', '<|end|>'] [0, 0, 0, 0, 0, 1, 1]\n3.0 0.42857142857142855",
          "['<|user|>', 'hi', 'there', '<|end|>', '<|assistant|>', 'hello', '<|end|>'] [0, 0, 0, 0, 1, 1, 1]\n3.0 0.42857142857142855",
          "['<|user|>', 'hi', 'there', '<|end|>', '<|assistant|>', 'hello', '<|end|>'] [0, 0, 0, 0, 0, 1, 0]\n3.0 0.2857142857142857",
          "['<|user|>', 'hi', 'there', '<|end|>', '<|assistant|>', 'hello', '<|end|>'] [0, 0, 0, 0, 0, 1, 1]\n2.5 0.42857142857142855",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pack(lengths, max_len):
    bins, room = [], []
    for i, n in enumerate(lengths):
        for b in range(len(bins)):
            if room[b] >= n:                               # first bin with space
                bins[b].append(i)
                room[b] -= n
                break
        else:
            bins.append([i])
            room.append(max_len - n)
    return bins

def doc_ids(lengths):
    return [d for d, n in enumerate(lengths) for _ in range(n)]

def allowed_pairs(lengths):
    ids = doc_ids(lengths)
    return sum(1 for i in range(len(ids)) for j in range(i + 1) if ids[i] == ids[j])   # causal, same document

print(pack([5, 4, 3, 2, 1], 6), doc_ids([2, 1, 3]))
print(allowed_pairs([2, 1, 3]), allowed_pairs([6]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 4], [1, 3], [2]] [0, 0, 1, 2, 2, 2]\n10 21",
          "[[0], [1], [2, 3, 4]] [0, 0, 1, 2, 2, 2]\n10 21",
          "[[0, 4], [1, 3], [2]] [0, 0, 1, 2, 2, 2]\n21 21",
          "[[0, 4], [1, 2], [3]] [0, 0, 1, 2, 2, 2]\n10 21",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>render(messages)</C>, returning tokens and mask; <C>masked_mean(losses, mask)</C>, or 0.0 for an empty
          mask; and <C>trained_fraction(convs)</C> over a list of conversations.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def render(messages):
    toks = [w for role, text in messages for w in text.split()]
    return toks, [1] * len(toks)

def masked_mean(losses, mask):
    return sum(losses) / len(losses)

def trained_fraction(convs):
    return 1.0
`,
        solution: TEMPLATE,
        tests: [
          { name: "render", code: `t, m = render([("assistant", "ok"), ("user", "")]); assert t == ["<|assistant|>", "ok", "<|end|>", "<|user|>", "<|end|>"] and m == [0, 1, 1, 0, 0]` },
          { name: "loss", code: `assert masked_mean([5, 1], [0, 0]) == 0.0 and masked_mean([5, 1, 3], [1, 0, 1]) == 4.0 and trained_fraction([[("user", "a")], [("assistant", "b")]]) == 1 / 3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pack(lengths, max_len)</C>, first fit in order, returning lists of indices; <C>doc_ids(lengths)</C>; and{" "}
          <C>allowed_pairs(lengths)</C>, counting pairs (i, j) with j ≤ i in the same document.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pack(lengths, max_len):
    return [[i] for i in range(len(lengths))]

def doc_ids(lengths):
    return []

def allowed_pairs(lengths):
    n = sum(lengths)
    return n * (n + 1) // 2
`,
        solution: PACK,
        tests: [
          { name: "pack", code: `assert pack([3, 3, 2, 2], 5) == [[0, 2], [1, 3]] and pack([], 4) == [] and doc_ids([1, 2]) == [0, 1, 1]` },
          { name: "pairs", code: `assert allowed_pairs([3, 1]) == 7 and allowed_pairs([]) == 0 and allowed_pairs([4]) == 10` },
        ],
      },
    },
    {
      key: "pairs",
      rung: "stretch",
      prompt: (
        <p>
          A packed sequence holds conversations of 700, 900 and 400 tokens. What fraction of the pairs a plain causal mask
          over the 2000 positions would allow does the block mask allow? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3653, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The model now follows the format and answers. The next lesson teaches it which of its answers people prefer,
        with direct preference optimisation on pairs of responses.
      </p>
    </>
  ),
};
