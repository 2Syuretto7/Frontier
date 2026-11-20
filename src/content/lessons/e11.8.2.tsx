import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PackingViz } from "@/components/viz/PackingViz";
import type { LessonContent } from "@/lib/types";

const PACK = `def pack(docs, seq_len, eos):
    stream = [t for d in docs for t in d + [eos]]   # end each document with an EOS token
    n = len(stream) // seq_len
    return [stream[i * seq_len:(i + 1) * seq_len] for i in range(n)]   # the incomplete tail is dropped

def doc_ids(seq, eos):
    ids, cur = [], 0
    for t in seq:
        ids.append(cur)
        if t == eos:
            cur += 1                                  # a new document starts after each EOS
    return ids

def block_mask(seg):
    n = len(seg)
    return [[j <= i and seg[i] == seg[j] for j in range(n)] for i in range(n)]   # causal, within one document`;

const STREAM = `def shuffle_buffer(stream, size, pick):
    buf = []
    for item in stream:
        if len(buf) == size:
            i = pick(size)
            yield buf[i]                              # emit a random buffered item, put the new one in its place
            buf[i] = item
        else:
            buf.append(item)
    while buf:
        yield buf.pop(pick(len(buf)))

def batches(stream, batch_size):
    batch = []
    for item in stream:
        batch.append(item)
        if len(batch) == batch_size:
            yield batch
            batch = []

def samples_consumed(step, micro_batch, world, accum):
    return step * micro_batch * world * accum       # where to resume in the stream after a restart`;

export const lesson: LessonContent = {
  id: "e11.8.2",
  minutes: 50,
  links: {
    requires: ["e11.8.1", "e5.3.3"],
    revisits: ["e10.8.4", "e11.6.4"],
    foreshadows: ["e11.8.3"],
  },

  puzzle: (
    <>
      <p>
        A team pads every document to the 8,192-token context and finds that over half of each batch is padding. Switching to packing
        fixes the waste, but the loss on short documents worsens slightly, and after a crash the resumed run shows a loss spike: it
        re-read data it had already seen. What must a streaming loader do to be efficient, correct and exactly resumable?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A streaming loader reads shards sequentially, without loading the dataset into memory, and turns them into batches. It packs
        documents end to end into full sequences, separated by an end-of-sequence token, and supplies document boundaries so attention
        can be masked to stay within a document. It shuffles locally with a buffer, on top of the shard permutation. And its state, the
        position in the shard order and within the current shard, plus the buffer&apos;s random state, is saved with each checkpoint,
        so a restart continues from exactly the next sample.
      </p>
      <PackingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="packing and masking">
        <p>
          <C>pack</C> appends an EOS token to each document, concatenates them, and cuts the stream into sequences of{" "}
          <C>seq_len</C>, dropping the incomplete tail. <C>doc_ids</C> labels each position with the index of its document within the
          sequence, starting a new label after each EOS. <C>block_mask</C> allows position i to attend to j when j ≤ i and both are in the
          same document.
        </p>
        <Code>{PACK}</Code>
      </Definition>

      <Theorem title="packing against padding">
        <p>
          For documents of lengths <M>{"\\ell_1, \\dots, \\ell_m"}</M>, each at most S including its EOS, padding wastes{" "}
          <M>{"\\sum_i (S - \\ell_i)"}</M> positions, while packing wastes none and drops fewer than S tokens in total.
        </p>
      </Theorem>
      <Proof>
        <p>
          Padding places each document in its own sequence of length S, leaving <M>{"S - \\ell_i"}</M> empty positions. Packing fills
          every sequence completely from the stream, so no position is empty; the only tokens not used are the remainder after the last
          full sequence, which is shorter than S. For documents much shorter than S, padding wastes most of the batch.
        </p>
      </Proof>

      <Definition title="streaming state">
        <p>
          <C>shuffle_buffer</C> keeps <C>size</C> items; once full, each new item displaces a buffered one chosen by{" "}
          <C>pick(size)</C>, which is emitted, and at the end the buffer is drained in <C>pick</C> order. <C>batches</C> groups items,
          dropping a final partial batch. <C>samples_consumed</C> is the number of samples read after a given optimiser step.
        </p>
        <Code>{STREAM}</Code>
      </Definition>

      <Theorem title="a shuffle buffer only shuffles locally">
        <p>
          With buffer size B, the item at input position k is emitted at output position at least <M>{"k - B + 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The first B items fill the buffer with no output. Each later item first causes one emission and is then inserted, so when the
          item at position <M>{"k \\ge B"}</M> arrives, exactly <M>{"k - B"}</M> items have been emitted and one more is emitted before it
          enters. It therefore cannot appear before output position <M>{"k - B + 1"}</M>. Items can be delayed indefinitely, but never
          moved earlier by more than <M>{"B - 1"}</M>, so neighbouring data stays close together. The global mixing must come from the
          shard permutation.
        </p>
      </Proof>

      <Remark title="loaders in practice">
        <p>
          Production loaders run in background worker processes, prefetching shards from object storage while the accelerators compute.
          Packed sequences use document masks or reset position ids at each boundary, which variable-length attention kernels support
          directly. Some pipelines pack by best fit rather than in stream order to avoid splitting documents. The loader&apos;s state is
          checkpointed with the model, and determinism at scale (e10.8.4) requires the same shard permutation, buffer seed and worker
          count on restart. Changes of mixture across phases (e11.6.4) are implemented by changing the sampling weights over sources.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Packing removed the padding; masking attention within documents removes the slight harm from attending across unrelated
          documents. The loss spike came from restarting the stream at the start of the epoch: the checkpoint should record the
          number of samples consumed, the shard order and the buffer state, so the resumed loader skips exactly what was already read.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "resume",
      rung: "check",
      prompt: (
        <p>
          A run uses micro-batches of 2 sequences of 8,192 tokens on 512 data-parallel ranks with 4 accumulation steps. How many billion
          tokens have been consumed after 1,000 optimiser steps? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 33.55, tolerance: 0.01 },
    },
    {
      key: "padding",
      rung: "check",
      prompt: (
        <p>
          Documents of 100, 300, 500 and 900 tokens, EOS included, are each padded to a sequence of 1,024. How many padding positions
          are there?
        </p>
      ),
      answer: { kind: "numeric", value: 2296, tolerance: 0 },
    },
    {
      key: "mask",
      rung: "apply",
      prompt: <p>Why do packed sequences usually come with a document mask?</p>,
      answer: {
        kind: "choice",
        options: [
          "So tokens do not attend to unrelated documents that happen to share the sequence",
          "So the EOS token is never predicted",
          "Because packing would otherwise make sequences longer than the context",
          "So that padding positions receive gradient",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def pack(docs, seq_len, eos):
    stream = [t for d in docs for t in d + [eos]]   # end each document with an EOS token
    n = len(stream) // seq_len
    return [stream[i * seq_len:(i + 1) * seq_len] for i in range(n)]   # the incomplete tail is dropped

def doc_ids(seq, eos):
    ids, cur = [], 0
    for t in seq:
        ids.append(cur)
        if t == eos:
            cur += 1                                  # a new document starts after each EOS
    return ids

def block_mask(seg):
    n = len(seg)
    return [[j <= i and seg[i] == seg[j] for j in range(n)] for i in range(n)]   # causal, within one document

seqs = pack([[1, 2, 3], [4, 5], [6, 7, 8, 9]], 4, 0)
print(seqs, doc_ids(seqs[1], 0), sum(map(sum, block_mask(doc_ids(seqs[1], 0)))))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]] [0, 0, 0, 1] 7",
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]] [0, 0, 1, 1] 7",
          "[[1, 2, 3, 0], [4, 5, 0, 6], [7, 8, 9, 0]] [0, 0, 0, 1] 10",
          "[[1, 2, 3, 0], [4, 5, 0, 6]] [0, 0, 0, 1] 7",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shuffle_buffer(stream, size, pick):
    buf = []
    for item in stream:
        if len(buf) == size:
            i = pick(size)
            yield buf[i]                              # emit a random buffered item, put the new one in its place
            buf[i] = item
        else:
            buf.append(item)
    while buf:
        yield buf.pop(pick(len(buf)))

def batches(stream, batch_size):
    batch = []
    for item in stream:
        batch.append(item)
        if len(batch) == batch_size:
            yield batch
            batch = []

def samples_consumed(step, micro_batch, world, accum):
    return step * micro_batch * world * accum       # where to resume in the stream after a restart

out = list(shuffle_buffer(range(6), 3, lambda n: n - 1))
print(out, list(batches(out, 4)), samples_consumed(10, 4, 8, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2, 3, 4, 5, 1, 0] [[2, 3, 4, 5]] 640",
          "[2, 3, 4, 5, 0, 1] [[2, 3, 4, 5]] 640",
          "[2, 3, 4, 5, 1, 0] [[2, 3, 4, 5], [1, 0]] 640",
          "[2, 3, 4, 5, 1, 0] [[2, 3, 4, 5]] 320",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pack(docs, seq_len, eos)</C>, <C>doc_ids(seq, eos)</C> and <C>block_mask(seg)</C>, returning a list of lists of
          booleans.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def pack(docs, seq_len, eos):
    return [d[:seq_len] for d in docs]

def doc_ids(seq, eos):
    return [0] * len(seq)

def block_mask(seg):
    n = len(seg)
    return [[j <= i for j in range(n)] for i in range(n)]
`,
        solution: PACK,
        tests: [
          { name: "pack", code: `assert pack([[7], [8, 9, 9]], 3, -1) == [[7, -1, 8], [9, 9, -1]] and pack([[5, 5]], 4, 0) == []\nassert doc_ids([3, 0, 0, 4, 4], 0) == [0, 0, 1, 2, 2]` },
          { name: "mask", code: `m = block_mask([0, 0, 1])\nassert m == [[True, False, False], [True, True, False], [False, False, True]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write the generators <C>shuffle_buffer(stream, size, pick)</C> and <C>batches(stream, batch_size)</C>, and{" "}
          <C>samples_consumed(step, micro_batch, world, accum)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shuffle_buffer(stream, size, pick):
    yield from stream

def batches(stream, batch_size):
    yield list(stream)

def samples_consumed(step, micro_batch, world, accum):
    return step * micro_batch
`,
        solution: STREAM,
        tests: [
          { name: "buffer", code: `assert list(shuffle_buffer(range(5), 2, lambda n: 0)) == [0, 2, 3, 4, 1]\nassert list(shuffle_buffer("abcd", 2, lambda n: n - 1)) == ["b", "c", "d", "a"] and list(shuffle_buffer([], 3, lambda n: 0)) == []` },
          { name: "batches", code: `assert list(batches(range(7), 3)) == [[0, 1, 2], [3, 4, 5]] and list(batches([1], 2)) == []\nassert samples_consumed(3, 5, 7, 2) == 210` },
        ],
      },
    },
    {
      key: "displace",
      rung: "stretch",
      prompt: (
        <p>
          A shuffle buffer holds 10,000 samples. Numbering from 0, what is the earliest output position at which the sample at input
          position 1,000,000 can appear?
        </p>
      ),
      answer: { kind: "numeric", value: 990001, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The loader now delivers exactly the intended tokens. One question remains about which tokens are intended: whether any of
        them are the test questions the model will later be scored on. The next lesson removes benchmark contamination.
      </p>
    </>
  ),
};
