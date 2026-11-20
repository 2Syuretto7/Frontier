import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ShardAssignViz } from "@/components/viz/ShardAssignViz";
import type { LessonContent } from "@/lib/types";

const WRITE = `from bisect import bisect_right

def shard_documents(doc_lengths, shard_tokens):
    shards, cur, used = [], [], 0
    for i, n in enumerate(doc_lengths):
        if cur and used + n > shard_tokens:       # next document would overflow: close the shard
            shards.append(cur)
            cur, used = [], 0
        cur.append(i)
        used += n
    if cur:
        shards.append(cur)
    return shards

def build_index(doc_lengths):
    index = [0]
    for n in doc_lengths:
        index.append(index[-1] + n)               # index[i] is where document i starts
    return index

def locate(index, token_pos):
    doc = bisect_right(index, token_pos) - 1      # last start at or before token_pos
    return doc, token_pos - index[doc]`;

const ASSIGN = `def perm(n, a, b):
    return [(a * i + b) % n for i in range(n)]    # a permutation exactly when gcd(a, n) == 1

def assign_shards(n_shards, world, rank):
    return list(range(rank, n_shards, world))     # round robin

def tokens_per_rank(shard_sizes, world):
    return [sum(shard_sizes[s] for s in assign_shards(len(shard_sizes), world, r)) for r in range(world)]`;

export const lesson: LessonContent = {
  id: "e11.8.1",
  minutes: 50,
  links: {
    requires: ["e11.5.2", "m4.4.3"],
    revisits: ["e8.4.3", "e2.5.2"],
    foreshadows: ["e11.8.2"],
  },

  puzzle: (
    <>
      <p>
        Fifteen trillion tokens must be read by eight thousand accelerators, each taking a different slice, over weeks, from an object
        store that charges per request and dislikes small files. A failure at day nine must resume at exactly the token where it
        stopped, and a rerun with the same seed must see the same data in the same order. How should a tokenised corpus be laid out on
        disk?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Tokenise once, ahead of training, and write the tokens as flat arrays of fixed-width integers in many files of similar size,
        called shards. Each shard carries an index of where each document begins, so any token can be found without scanning. Shards
        are large enough to read efficiently from object storage (e8.4.3) and numerous enough, many more than there are readers, that
        they can be dealt out evenly and visited in a different order each epoch.
      </p>
      <ShardAssignViz />
    </>
  ),

  theory: (
    <>
      <Definition title="writing shards">
        <p>
          <C>shard_documents</C> packs documents in order, closing a shard when the next document would push it over{" "}
          <C>shard_tokens</C>; a document longer than a shard gets a shard to itself. <C>build_index</C> returns document start offsets,
          ending with the total, and <C>locate</C> finds the document and offset of a token position by binary search (e2.5.2).
        </p>
        <Code>{WRITE}</Code>
      </Definition>

      <Theorem title="greedy packing wastes less than half">
        <p>
          If no document is longer than a shard, <C>shard_documents</C> uses fewer than <M>{"2T/S + 1"}</M> shards for T tokens and
          shard size S.
        </p>
      </Theorem>
      <Proof>
        <p>
          A shard is closed only when the next document does not fit, so each closed shard together with the first document of the
          following shard exceeds S tokens. Hence any two consecutive shards together hold more than S tokens. With m shards, pairing
          shards 1 and 2, 3 and 4, and so on gives <M>{"\\lfloor m/2 \\rfloor"}</M> disjoint pairs, so{" "}
          <M>{"T > \\lfloor m/2 \\rfloor S \\ge (m - 1)S/2"}</M>, that is <M>{"m < 2T/S + 1"}</M>. In practice documents are small
          relative to shards, and shards are nearly full.
        </p>
      </Proof>

      <Definition title="assigning and ordering shards">
        <p>
          <C>perm</C> visits position i at shard <M>{"(ai + b) \\bmod n"}</M>, a cheap, reproducible order that changes with b.{" "}
          <C>assign_shards</C> deals shards to ranks round robin, and <C>tokens_per_rank</C> sums the sizes each rank receives.
        </p>
        <Code>{ASSIGN}</Code>
      </Definition>

      <Theorem title="when an affine map is a permutation">
        <p>
          The map <M>{"i \\mapsto (ai + b) \\bmod n"}</M> on <M>{"\\{0, \\dots, n - 1\\}"}</M> is a permutation if and only if{" "}
          <M>{"\\gcd(a, n) = 1"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The map is a permutation exactly when it is injective. If <M>{"ai + b \\equiv aj + b"}</M>, then n divides{" "}
          <M>{"a(i - j)"}</M>. If <M>{"\\gcd(a, n) = 1"}</M>, n divides <M>{"i - j"}</M>, so i = j (m4.4.3). If{" "}
          <M>{"d = \\gcd(a, n) > 1"}</M>, then i = 0 and j = n/d differ but{" "}
          <M>{"a \\cdot n/d = (a/d) n \\equiv 0"}</M>, so they collide.
        </p>
      </Proof>

      <Remark title="sharded datasets in practice">
        <p>
          Large training runs typically store token arrays as 16-bit integers when the vocabulary has at most 65,536 entries and 32-bit
          otherwise, in shards of hundreds of megabytes to a few gigabytes, sometimes inside container formats with an index and metadata
          header. Libraries for streaming datasets write shards with an index file, and record which source and version each shard came
          from. Shards are content-hashed so a run can verify it reads the data it expects, and the shard list, permutation seed and
          position are saved in each checkpoint.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The corpus is tokenised once into tens of thousands of shards of similar size, each a flat integer array with a document
          index. Ranks take shards round robin from a seeded permutation that changes each epoch; a checkpoint records the epoch, the
          seed and how far each rank has read, so resuming means recomputing the permutation and seeking with the index.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: (
        <p>
          A tokeniser has 100,000 tokens, so token ids do not fit in 16 bits and are stored as 32-bit integers. How many terabytes
          (10¹² bytes) does a 1.2T-token corpus occupy?
        </p>
      ),
      answer: { kind: "numeric", value: 4.8, tolerance: 0.001 },
    },
    {
      key: "coprime",
      rung: "check",
      prompt: (
        <p>
          For n = 12 shards, how many values of a in 1, …, 11 make <M>{"i \\mapsto (ai + b) \\bmod 12"}</M> a permutation?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0 },
    },
    {
      key: "many",
      rung: "apply",
      prompt: <p>Why is a corpus split into many more shards than there are data-loading ranks?</p>,
      answer: {
        kind: "choice",
        options: [
          "So shards divide nearly evenly among ranks, can be visited in a new order each epoch, and can be reassigned if the number of ranks changes",
          "Because each rank can open only one file per epoch",
          "Because more shards compress better",
          "So that no shard ever contains more than one document",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`from bisect import bisect_right

def shard_documents(doc_lengths, shard_tokens):
    shards, cur, used = [], [], 0
    for i, n in enumerate(doc_lengths):
        if cur and used + n > shard_tokens:       # next document would overflow: close the shard
            shards.append(cur)
            cur, used = [], 0
        cur.append(i)
        used += n
    if cur:
        shards.append(cur)
    return shards

def build_index(doc_lengths):
    index = [0]
    for n in doc_lengths:
        index.append(index[-1] + n)               # index[i] is where document i starts
    return index

def locate(index, token_pos):
    doc = bisect_right(index, token_pos) - 1      # last start at or before token_pos
    return doc, token_pos - index[doc]

L = [5, 3, 4, 2, 6]
print(shard_documents(L, 8), build_index(L), locate(build_index(L), 9))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 1], [2, 3], [4]] [0, 5, 8, 12, 14, 20] (2, 1)",
          "[[0], [1, 2], [3, 4]] [0, 5, 8, 12, 14, 20] (2, 1)",
          "[[0, 1], [2, 3], [4]] [0, 5, 8, 12, 14, 20] (1, 4)",
          "[[0, 1], [2, 3], [4]] [5, 8, 12, 14, 20] (2, 1)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def perm(n, a, b):
    return [(a * i + b) % n for i in range(n)]    # a permutation exactly when gcd(a, n) == 1

def assign_shards(n_shards, world, rank):
    return list(range(rank, n_shards, world))     # round robin

def tokens_per_rank(shard_sizes, world):
    return [sum(shard_sizes[s] for s in assign_shards(len(shard_sizes), world, r)) for r in range(world)]

p = perm(6, 5, 1)
print(p, assign_shards(6, 4, 1), tokens_per_rank([10, 20, 30, 40, 50, 60], 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 5, 4, 3, 2] [1, 5] [60, 80, 30, 40]",
          "[1, 6, 5, 4, 3, 2] [1, 5] [60, 80, 30, 40]",
          "[1, 0, 5, 4, 3, 2] [4, 5] [60, 80, 30, 40]",
          "[1, 0, 5, 4, 3, 2] [1, 5] [30, 70, 50, 60]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shard_documents(doc_lengths, shard_tokens)</C>, returning lists of document indices; <C>build_index(doc_lengths)</C>;
          and <C>locate(index, token_pos)</C>, returning <C>(document, offset)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `from bisect import bisect_right

def shard_documents(doc_lengths, shard_tokens):
    return [list(range(len(doc_lengths)))]

def build_index(doc_lengths):
    return [0] + list(doc_lengths)

def locate(index, token_pos):
    return 0, token_pos
`,
        solution: WRITE,
        tests: [
          { name: "pack", code: `assert shard_documents([3, 3, 3, 9, 1], 6) == [[0, 1], [2], [3], [4]] and shard_documents([], 4) == []\nassert build_index([2, 0, 3]) == [0, 2, 2, 5]` },
          { name: "locate", code: `ix = [0, 4, 4, 10]\nassert locate(ix, 0) == (0, 0) and locate(ix, 3) == (0, 3) and locate(ix, 4) == (2, 0) and locate(ix, 9) == (2, 5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>perm(n, a, b)</C>, <C>assign_shards(n_shards, world, rank)</C> and <C>tokens_per_rank(shard_sizes, world)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def perm(n, a, b):
    return list(range(n))

def assign_shards(n_shards, world, rank):
    return []

def tokens_per_rank(shard_sizes, world):
    return [0] * world
`,
        solution: ASSIGN,
        tests: [
          { name: "perm", code: `assert perm(5, 2, 3) == [3, 0, 2, 4, 1] and sorted(perm(9, 4, 0)) == list(range(9)) and perm(4, 2, 0) == [0, 2, 0, 2]` },
          { name: "assign", code: `assert assign_shards(7, 3, 0) == [0, 3, 6] and assign_shards(7, 3, 2) == [2, 5] and assign_shards(2, 4, 3) == []\nassert tokens_per_rank([1, 2, 3, 4, 5], 2) == [9, 6]` },
        ],
      },
    },
    {
      key: "imbalance",
      rung: "stretch",
      prompt: (
        <p>
          1,000 shards of equal size are dealt round robin to 64 ranks. What is the ratio of the busiest rank&apos;s load to the average
          load? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.024, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Shards define what each rank reads; the loader decides how. The next lesson streams shards into batches: shuffle buffers,
        packing documents into fixed-length sequences, and exact resumption.
      </p>
    </>
  ),
};
