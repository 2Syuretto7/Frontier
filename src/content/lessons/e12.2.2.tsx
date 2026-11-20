import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { PagedMemoryViz } from "@/components/viz/PagedMemoryViz";
import type { LessonContent } from "@/lib/types";

const ALLOC = `def blocks_needed(tokens, block_size):
    return -(-tokens // block_size)                 # ceiling division

def allocate(free, n):
    if n > len(free):
        return None                                 # not enough blocks: the request must wait
    return free[:n], free[n:]                       # any free blocks will do; they need not be adjacent

def physical_slot(block_table, pos, block_size):
    return block_table[pos // block_size], pos % block_size   # logical position -> (physical block, offset)`;

const WASTE = `def reserved_waste(max_len, actual_lens):
    return 1 - sum(actual_lens) / (len(actual_lens) * max_len)   # each sequence reserves max_len slots

def paged_waste(actual_lens, block_size):
    slots = sum(-(-n // block_size) * block_size for n in actual_lens)
    return 1 - sum(actual_lens) / slots             # only last blocks are partly empty

def fork_blocks(prompt, n_samples, gen, block_size):
    shared = prompt // block_size                   # full prompt blocks are shared by all samples
    own = -(-(prompt % block_size + gen) // block_size)   # the partial block is copied on write
    return shared + n_samples * own`;

export const lesson: LessonContent = {
  id: "e12.2.2",
  minutes: 50,
  links: {
    requires: ["e12.2.1", "e12.1.2"],
    revisits: ["e8.3.3", "e11.8.1"],
    foreshadows: ["e12.2.3"],
  },

  puzzle: (
    <>
      <p>
        A server reserves, for each request, a contiguous KV cache for the maximum length of 2,048 tokens, because it cannot know in
        advance how long a reply will be. Profiling shows that only a fifth to a third of the reserved cache ever holds a token, the
        rest being reserved for tokens never generated or lost in gaps between reservations. A redesign that changes no model code
        fits two to four times as many concurrent requests. Where did the memory go, and how was it recovered?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Operating systems solved the same problem decades ago with virtual memory: a process sees contiguous addresses, but its memory
        is split into fixed-size pages placed wherever there is room, and allocated only when touched. Paged attention does this for
        the KV cache. Each sequence&apos;s cache is a list of small blocks, of perhaps 16 tokens each; a block table maps the
        sequence&apos;s logical blocks to physical ones; and a new block is allocated only when the previous one fills. Attention kernels
        gather keys and values through the block table. Waste is confined to the last, partly filled block of each sequence.
      </p>
      <PagedMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="blocks and block tables">
        <p>
          <C>blocks_needed</C> is the number of blocks for a given number of tokens. <C>allocate</C> takes the first n block ids from a
          free list and returns them with the remaining free list, or <C>None</C> if there are too few. <C>physical_slot</C> maps a
          token&apos;s logical position to its physical block and offset through the block table.
        </p>
        <Code>{ALLOC}</Code>
      </Definition>

      <Theorem title="paging bounds the waste">
        <p>
          With block size b, a sequence of <M>{"\\ell \\ge 1"}</M> tokens occupies <M>{"\\lceil \\ell/b \\rceil"}</M> blocks and wastes
          at most <M>{"b - 1"}</M> token slots, so n sequences waste fewer than nb slots in total, whatever their lengths.
        </p>
      </Theorem>
      <Proof>
        <p>
          Blocks are allocated only when needed, so all blocks of a sequence except the last are full, and the last holds between 1 and
          b tokens. The wasted slots are <M>{"b\\lceil \\ell/b \\rceil - \\ell \\le b - 1"}</M>. Summing over n sequences gives at most{" "}
          <M>{"n(b - 1) < nb"}</M>. By contrast, reserving a maximum length M wastes <M>{"M - \\ell"}</M> per sequence, unbounded in
          terms of the actual lengths, and contiguous reservations also fragment the free space between them.
        </p>
      </Proof>

      <Definition title="measuring waste and sharing">
        <p>
          <C>reserved_waste</C> is the unused share of fixed reservations of <C>max_len</C> slots, and <C>paged_waste</C> the unused share
          of block slots. <C>fork_blocks</C> counts the blocks for <C>n_samples</C> continuations of one prompt when the prompt&apos;s full
          blocks are shared and each sample copies the partly filled block on its first write, before generating <C>gen</C> tokens.
        </p>
        <Code>{WASTE}</Code>
      </Definition>

      <Theorem title="sharing a prompt across samples">
        <p>
          For n samples of G tokens each from a prompt of P tokens, with block size b, copy-on-write sharing needs{" "}
          <M>{"\\lfloor P/b \\rfloor + n\\lceil ((P \\bmod b) + G)/b \\rceil"}</M> blocks, against{" "}
          <M>{"n\\lceil (P + G)/b \\rceil"}</M> without sharing.
        </p>
      </Theorem>
      <Proof>
        <p>
          The <M>{"\\lfloor P/b \\rfloor"}</M> full prompt blocks are never written again, so all samples can point to the same physical
          blocks, with a reference count to know when to free them. The last prompt block, holding <M>{"P \\bmod b"}</M> tokens, would be
          written by every sample, so each sample copies it on its first write and continues in its own blocks, needing{" "}
          <M>{"\\lceil ((P \\bmod b) + G)/b \\rceil"}</M> blocks. Without sharing every sample stores the full{" "}
          <M>{"P + G"}</M> tokens. For long prompts and many samples, as in parallel sampling or beam search, the saving approaches{" "}
          <M>{"(n - 1)P/b"}</M> blocks.
        </p>
      </Proof>

      <Remark title="paged attention in practice">
        <p>
          Paged attention was introduced with the vLLM serving engine, which reported near-zero waste and two to four times the
          throughput of earlier systems that reserved contiguous caches. Block sizes of 16 or 32 tokens balance waste against the cost of
          gathering scattered blocks; the block table plays the role of a page table, much as distributed storage maps logical chunks to
          physical locations (e8.3.3), or as shards are indexed in a dataset (e11.8.1). When memory runs out, the scheduler preempts a
          sequence, swapping its blocks to host memory or recomputing them later.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Reservations of 2,048 tokens for replies averaging a few hundred left most of each reservation empty, and gaps between
          contiguous reservations could not be used. With blocks of 16 tokens allocated on demand, each sequence wastes at most 15 slots,
          so the freed memory holds several times as many caches, and continuous batching fills it with more requests.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "reserved",
      rung: "check",
      prompt: (
        <p>
          A server reserves 2,048 token slots per request, and requests use 300 tokens on average. What fraction of the reserved cache is
          unused? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.854, tolerance: 0.001 },
    },
    {
      key: "last_block",
      rung: "check",
      prompt: <p>With blocks of 32 tokens, how many token slots are empty in the cache of a 1,000-token sequence?</p>,
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "block_size",
      rung: "apply",
      prompt: <p>Why are KV cache blocks usually 16 or 32 tokens rather than a single token?</p>,
      answer: {
        kind: "choice",
        options: [
          "Very small blocks make block tables large and attention kernels gather scattered memory inefficiently, while moderate blocks still waste little",
          "Attention requires blocks to hold whole sentences",
          "A single-token block cannot be shared between sequences",
          "Larger blocks reduce the size of each key vector",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def blocks_needed(tokens, block_size):
    return -(-tokens // block_size)                 # ceiling division

def allocate(free, n):
    if n > len(free):
        return None                                 # not enough blocks: the request must wait
    return free[:n], free[n:]                       # any free blocks will do; they need not be adjacent

def physical_slot(block_table, pos, block_size):
    return block_table[pos // block_size], pos % block_size   # logical position -> (physical block, offset)

free = list(range(8)); table, free = allocate(free, blocks_needed(10, 4))
print(table, len(free), physical_slot(table, 9, 4), allocate(free, 6))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 1, 2] 5 (2, 1) None",
          "[0, 1] 6 (2, 1) None",
          "[0, 1, 2] 5 (1, 1) None",
          "[0, 1, 2] 5 (2, 1) ([3, 4, 5, 6, 7], [])",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def reserved_waste(max_len, actual_lens):
    return 1 - sum(actual_lens) / (len(actual_lens) * max_len)   # each sequence reserves max_len slots

def paged_waste(actual_lens, block_size):
    slots = sum(-(-n // block_size) * block_size for n in actual_lens)
    return 1 - sum(actual_lens) / slots             # only last blocks are partly empty

def fork_blocks(prompt, n_samples, gen, block_size):
    shared = prompt // block_size                   # full prompt blocks are shared by all samples
    own = -(-(prompt % block_size + gen) // block_size)   # the partial block is copied on write
    return shared + n_samples * own

lens = [10, 30, 64]
print(round(reserved_waste(128, lens), 2), round(paged_waste(lens, 16), 2), fork_blocks(40, 4, 20, 16))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.73 0.07 10", "0.73 0.07 12", "0.27 0.07 10", "0.73 0.0 10"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>blocks_needed(tokens, block_size)</C>, <C>allocate(free, n)</C> and{" "}
          <C>physical_slot(block_table, pos, block_size)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def blocks_needed(tokens, block_size):
    return tokens // block_size

def allocate(free, n):
    return free[:n], free[n:]

def physical_slot(block_table, pos, block_size):
    return pos // block_size, pos % block_size
`,
        solution: ALLOC,
        tests: [
          { name: "alloc", code: `assert blocks_needed(16, 16) == 1 and blocks_needed(17, 16) == 2 and blocks_needed(0, 4) == 0\nassert allocate([7, 3, 9], 2) == ([7, 3], [9]) and allocate([1], 2) is None and allocate([], 0) == ([], [])` },
          { name: "slot", code: `assert physical_slot([7, 3, 9], 0, 4) == (7, 0) and physical_slot([7, 3, 9], 5, 4) == (3, 1) and physical_slot([7, 3, 9], 11, 4) == (9, 3)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>reserved_waste(max_len, actual_lens)</C>, <C>paged_waste(actual_lens, block_size)</C> and{" "}
          <C>fork_blocks(prompt, n_samples, gen, block_size)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def reserved_waste(max_len, actual_lens):
    return 0.0

def paged_waste(actual_lens, block_size):
    return 0.0

def fork_blocks(prompt, n_samples, gen, block_size):
    return n_samples * -(-(prompt + gen) // block_size)
`,
        solution: WASTE,
        tests: [
          { name: "waste", code: `assert reserved_waste(10, [5, 10]) == 0.25 and paged_waste([4, 8], 4) == 0.0 and paged_waste([1, 4], 4) == 0.375` },
          { name: "fork", code: `assert fork_blocks(8, 3, 4, 4) == 5 and fork_blocks(10, 2, 1, 4) == 4 and fork_blocks(3, 5, 0, 4) == 5` },
        ],
      },
    },
    {
      key: "beam",
      rung: "stretch",
      prompt: (
        <p>
          Eight samples of 512 tokens are drawn from a 1,024-token prompt, with blocks of 16 tokens and copy-on-write sharing. How many
          blocks are needed?
        </p>
      ),
      answer: { kind: "numeric", value: 320, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Sharing prompt blocks between samples of one request is a special case of a broader idea: many requests begin with the same
        system prompt or document. The next lesson caches such prefixes across requests.
      </p>
    </>
  ),
};
