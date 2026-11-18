import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PackPadViz } from "@/components/viz/PackPadViz";
import type { LessonContent } from "@/lib/types";

const PACK = `import numpy as np

def pack(docs, T, eos):
    stream = [t for d in docs for t in list(d) + [eos]]
    n = len(stream) // (T + 1)
    return np.array(stream[: n * (T + 1)]).reshape(n, T + 1)

def doc_ids(row, eos):
    is_eos = np.asarray(row) == eos
    return np.cumsum(is_eos) - is_eos

def padding_waste(lengths, T):
    used = sum(n + 1 for n in lengths)
    slots = sum(-(-(n + 1) // T) * T for n in lengths)
    return 1 - used / slots`;

const SCORE = `import numpy as np

def answer_logprob(next_logprobs, prompt, answer):
    ctx, total = list(prompt), 0.0
    for t in answer:
        total += next_logprobs(ctx)[t]
        ctx.append(t)
    return float(total)

def pick(next_logprobs, prompt, options, per_token=False):
    scores = [answer_logprob(next_logprobs, prompt, o) / (len(o) if per_token else 1) for o in options]
    return int(np.argmax(scores))

def prompt_loss_mask(prompt_len, T):
    return np.arange(T) >= prompt_len - 1`;

export const lesson: LessonContent = {
  id: "l5.4.3",
  minutes: 45,
  links: {
    requires: ["l5.4.2"],
    revisits: ["l5.2.2", "l5.3.1"],
    foreshadows: ["l5.4.4", "l5.6.1"],
  },

  puzzle: (
    <>
      <p>
        A decoder-only model has no encoder and no task-specific head: it only ever predicts the next token. Yet the same
        model translates, answers multiple-choice questions and classifies sentiment. Where does the &quot;input&quot; go when
        there is no encoder, how is a multiple-choice answer read off a next-token predictor, and how is a corpus of
        documents of every length turned into fixed-size training batches without waste?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        In a decoder-only model the input is simply the start of the text. A prompt and its answer are one sequence, and the
        probability of the answer given the prompt is the product of the next-token probabilities along the answer, all
        computed in one causal pass. Choosing between options means comparing those probabilities. Training is equally
        uniform: concatenate documents separated by an end-of-text token and cut the stream into rows of fixed length, so
        that no slot is wasted on padding.
      </p>
      <PackPadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="packing">
        <p>
          Append an end-of-text token to every document, concatenate them into one stream, and cut it into rows of T + 1
          tokens, the T inputs and T targets of the language-modelling loss. Documents cross row boundaries, and a row can
          contain parts of several documents; the document index of each position gives the block-diagonal mask of the
          lesson on causal masking, if one is wanted.
        </p>
        <Code>{PACK}</Code>
      </Definition>

      <Theorem title="padding against packing">
        <p>
          If documents of lengths <M>{"n_1, \\dots, n_k"}</M> (each followed by one end-of-text token) are padded to whole
          rows of T, the fraction of slots wasted is{" "}
          <M>{"1 - \\sum_i(n_i + 1)\\big/\\sum_iT\\lceil(n_i + 1)/T\\rceil"}</M>. Packing wastes nothing except fewer than T + 1
          tokens at the end of the stream, which can begin the next batch.
        </p>
      </Theorem>
      <Proof>
        <p>
          Document i needs <M>{"\\lceil(n_i + 1)/T\\rceil"}</M> rows of its own, and the used slots are its tokens. In the
          packed stream every row is full; only the remainder after the last full row is left over.
        </p>
      </Proof>

      <Theorem title="every task is a conditional likelihood">
        <p>
          For a prompt x and answer <M>{"a_1, \\dots, a_m"}</M>, the model&apos;s{" "}
          <MD>{"\\log p(a \\mid x) = \\sum_{k=1}^m\\log p(a_k \\mid x, a_{<k})"}</MD> is computed by one forward pass over x
          followed by a, reading the log-probability of each answer token at the position before it.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule gives the sum. By the causality theorem, the logits at the position of the last token before{" "}
          <M>{"a_k"}</M> depend only on x and <M>{"a_{<k}"}</M>, exactly the conditioning in the k-th term, so a single pass
          gives every term. The same holds during training: masking the loss at positions whose targets belong to the
          prompt trains the model on <M>{"\\log p(a \\mid x)"}</M> alone, which is how instruction data is usually used.
        </p>
        <Code>{SCORE}</Code>
      </Proof>

      <Theorem title="longer answers score lower">
        <p>
          If option b extends option a by further tokens, then{" "}
          <M>{"\\log p(b \\mid x) \\le \\log p(a \\mid x)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The sum for b contains every term of the sum for a and more, each a log-probability and so at most 0. Comparing
          total log-probabilities therefore favours short options, which is why evaluations often divide by the number of
          tokens or characters, or ask the model to answer with a single letter. The normalisations can disagree, as the
          second exercise of reading code shows.
        </p>
      </Proof>

      <Remark title="one model, one interface">
        <p>
          Classification by a head on [CLS], span extraction by start and end pointers, and generation by a decoder all
          become the same operation: continue the text. A prefix LM keeps bidirectional attention over the prompt, but a
          plain causal model is simpler, and its KV cache works the same way during the prompt and the answer. The next lesson
          weighs this simplicity, and the training signal from every token, against what encoders do better.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "waste",
      rung: "check",
      prompt: <p>Documents of 100, 300 and 700 tokens, each with an end-of-text token, are padded to rows of 512. What fraction of the slots is padding? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.4614, tolerance: 0.00006 },
    },
    {
      key: "logp",
      rung: "check",
      prompt: <p>An answer of three tokens gets next-token probabilities 0.5, 0.25 and 0.8. What is its log-probability in nats? Give four decimals.</p>,
      answer: { kind: "numeric", value: -2.3026, tolerance: 0.00006 },
    },
    {
      key: "norm",
      rung: "apply",
      prompt: <p>When a decoder-only model picks among answers by total log-probability, which bias does dividing by the answer length try to remove?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each extra token adds a non-positive term, so longer answers are penalised regardless of quality",
          "Longer answers get more attention heads",
          "The softmax temperature depends on the answer length",
          "Short answers are cut off by the context window",
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

def pack(docs, T, eos):
    stream = [t for d in docs for t in list(d) + [eos]]
    n = len(stream) // (T + 1)
    return np.array(stream[: n * (T + 1)]).reshape(n, T + 1)

def doc_ids(row, eos):
    is_eos = np.asarray(row) == eos
    return np.cumsum(is_eos) - is_eos

def padding_waste(lengths, T):
    used = sum(n + 1 for n in lengths)
    slots = sum(-(-(n + 1) // T) * T for n in lengths)
    return 1 - used / slots

P = pack([[1, 2, 3], [4, 5], [6, 7, 8, 9]], 3, 0); print(P.tolist())
print(doc_ids([4, 5, 0, 6], 0).tolist(), round(padding_waste([3, 1], 4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]]\n[0, 0, 0, 1] 0.25",
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]]\n[0, 0, 1, 1] 0.25",
          "[[1, 2, 3], [0, 4, 5], [0, 6, 7], [8, 9, 0]]\n[0, 0, 0, 1] 0.25",
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]]\n[0, 0, 0, 1] 0.5",
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

def answer_logprob(next_logprobs, prompt, answer):
    ctx, total = list(prompt), 0.0
    for t in answer:
        total += next_logprobs(ctx)[t]
        ctx.append(t)
    return float(total)

def pick(next_logprobs, prompt, options, per_token=False):
    scores = [answer_logprob(next_logprobs, prompt, o) / (len(o) if per_token else 1) for o in options]
    return int(np.argmax(scores))

def prompt_loss_mask(prompt_len, T):
    return np.arange(T) >= prompt_len - 1

table = np.log(np.array([[0.5, 0.5], [0.9, 0.1]])); lp = lambda ctx: table[ctx[-1]]
print(round(answer_logprob(lp, [0], [1, 1]), 4), pick(lp, [0], [[1, 0], [0]]), pick(lp, [0], [[1, 0], [0]], per_token=True))
print(prompt_loss_mask(3, 5).astype(int).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "-2.9957 1 0\n[0, 0, 1, 1, 1]",
          "-2.9957 0 0\n[0, 0, 1, 1, 1]",
          "-2.9957 1 1\n[0, 0, 1, 1, 1]",
          "-2.9957 1 0\n[0, 0, 0, 1, 1]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pack(docs, T, eos)</C>, returning an array of full rows of T + 1 tokens; <C>doc_ids(row, eos)</C>, the
          document index of each position counting from 0, with each end-of-text token belonging to the document it ends; and{" "}
          <C>padding_waste(lengths, T)</C>, the fraction from the first theorem.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pack(docs, T, eos):
    return np.array([list(d)[: T + 1] for d in docs])

def doc_ids(row, eos):
    return np.zeros(len(row), int)

def padding_waste(lengths, T):
    return 0.0
`,
        solution: PACK,
        tests: [
          { name: "pack", code: `P = pack([[1, 2, 3], [4, 5], [6, 7, 8, 9]], 3, 0); assert P.tolist() == [[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]]
assert pack([[1, 2, 3], [4, 5]], 4, 0).tolist() == [[1, 2, 3, 0, 4]] and pack([[1]], 5, 0).shape == (0, 6)` },
          { name: "ids and waste", code: `assert doc_ids([4, 5, 0, 6], 0).tolist() == [0, 0, 0, 1] and doc_ids([0, 0, 3], 0).tolist() == [0, 1, 2]
assert abs(padding_waste([3, 1], 4) - 0.25) < 1e-12 and abs(padding_waste([100, 300, 700], 512) - (1 - 1103 / 2048)) < 1e-12 and padding_waste([3, 7], 4) == 0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Given <C>next_logprobs(ctx)</C>, which returns the log-probabilities of the next token after the list ctx, write{" "}
          <C>answer_logprob(next_logprobs, prompt, answer)</C> as a float; <C>pick(next_logprobs, prompt, options,
          per_token=False)</C>, the index of the best option by total or per-token log-probability; and{" "}
          <C>prompt_loss_mask(prompt_len, T)</C>, the boolean mask over the T target positions of a sequence that is True where
          the target is an answer token.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def answer_logprob(next_logprobs, prompt, answer):
    return 0.0

def pick(next_logprobs, prompt, options, per_token=False):
    return 0

def prompt_loss_mask(prompt_len, T):
    return np.ones(T, bool)
`,
        solution: SCORE,
        tests: [
          { name: "score", code: `table = np.log(np.array([[0.5, 0.5], [0.9, 0.1]])); lp = lambda ctx: table[ctx[-1]]
assert abs(answer_logprob(lp, [0], [1, 1]) - np.log(0.05)) < 1e-12 and answer_logprob(lp, [1], []) == 0.0
assert pick(lp, [0], [[1, 0], [0]]) == 1 and pick(lp, [0], [[1, 0], [0]], per_token=True) == 0
seen = []; answer_logprob(lambda c: seen.append(list(c)) or np.zeros(3), [2], [0, 1]); assert seen == [[2], [2, 0]]` },
          { name: "mask", code: `assert prompt_loss_mask(3, 5).tolist() == [False, False, True, True, True] and prompt_loss_mask(1, 3).all()
toks = [7, 8, 9, 1, 2]; tg = np.array(toks[1:]); assert (tg[prompt_loss_mask(3, 4)] == [1, 2]).all()` },
        ],
      },
    },
    {
      key: "rows",
      rung: "stretch",
      prompt: <p>2000 documents with 1,000,000 tokens in total, each followed by one end-of-text token, are packed into rows of T + 1 = 1025 tokens. How many full rows result?</p>,
      answer: { kind: "numeric", value: 977, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Encoders, encoder-decoders and decoders were all serious contenders around 2019. The next lesson asks why, for
        large general-purpose models, the decoder-only design won.
      </p>
    </>
  ),
};
