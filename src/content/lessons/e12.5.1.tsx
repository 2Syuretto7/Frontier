import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ServingSchedulerViz } from "@/components/viz/ServingSchedulerViz";
import type { LessonContent } from "@/lib/types";

const ENGINE = `import math

def blocks_needed(tokens, block_size):
    return math.ceil(tokens / block_size)

def admit(waiting, free_blocks, block_size, max_batch, running):
    admitted = []
    for n in waiting:                                    # prompt lengths, in arrival order
        need = blocks_needed(n + 1, block_size)          # the prompt and its first new token
        if len(running) + len(admitted) == max_batch or need > free_blocks:
            break                                        # first come, first served: none overtakes
        admitted.append(n)
        free_blocks -= need
    return admitted, free_blocks

def grow(running, free_blocks, block_size):
    running, preempted = list(running), []
    while True:
        need = sum(1 for n in running if n % block_size == 0)   # a full last block needs a new one
        if need <= free_blocks:
            break
        last = running.pop()                             # preempt the latest admitted, freeing its blocks
        preempted.append(last)
        free_blocks += blocks_needed(last, block_size)
    return [n + 1 for n in running], free_blocks - need, preempted`;

const REPLICA = `def tp_degree(params_b, bytes_per_param, gpu_gb, reserve):
    tp = 1
    while params_b * bytes_per_param / tp > gpu_gb * (1 - reserve):
        tp *= 2                                          # shard the weights over more GPUs
    return tp

def kv_tokens(gpu_gb, tp, weights_gb, overhead_gb, bytes_per_token):
    free = tp * (gpu_gb - overhead_gb) - weights_gb      # what the replica has left for the cache
    return int(free * 1e9 // bytes_per_token)

def stream_text(token_bytes):
    out, buf = [], b""
    for t in token_bytes:
        buf += t
        try:
            out.append(buf.decode("utf-8"))
            buf = b""
        except UnicodeDecodeError:
            out.append("")                               # a character is split: wait for its other bytes
    return out`;

export const lesson: LessonContent = {
  id: "e12.5.1",
  minutes: 50,
  links: {
    requires: ["e12.2.2", "e12.2.1"],
    revisits: ["e10.4.1", "e11.5.1"],
    foreshadows: ["e12.5.2"],
  },

  puzzle: (
    <>
      <p>
        An inference server holds the model&apos;s weights with plenty of memory to spare. During a burst of long requests, a few
        responses stop streaming partway, pause, and then carry on, while others finish without a break. Nothing crashed and no request
        failed. Separately, users report that an accented letter sometimes appears as a garbled symbol in the stream, though the final
        text is always correct. What is the server doing in each case?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A serving system has layers. An API server accepts requests, tokenises them and streams text back; a router chooses a replica;
        inside each replica an engine runs a loop. Every iteration the scheduler decides which sequences take part, the model runs one
        forward pass for all of them, and new tokens go back to the API server. The scheduler&apos;s scarce resource is KV cache blocks
        (e12.2.2): a request is admitted only when its blocks fit, and as running sequences grow they need more. When a step needs blocks
        that are not free, the scheduler preempts the most recently admitted request, frees its blocks, and later readmits it, recomputing
        its cache. That is the pause in the puzzle. The garbled letter is a detokenisation bug: a token can hold only part of a
        character&apos;s UTF-8 bytes, and the server must wait for the rest before emitting text.
      </p>
      <ServingSchedulerViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the engine loop">
        <p>
          Sequences are tracked by their lengths in tokens, and the cache is split into blocks of <C>block_size</C> tokens.{" "}
          <C>admit</C> takes waiting prompts in arrival order and admits each while the batch has room and its blocks, for the prompt and
          its first new token, fit; it stops at the first that does not, so no request overtakes an earlier one. <C>grow</C> adds a token
          to every running sequence; a sequence whose last block is full needs a new block, and while the needs exceed the free blocks the
          most recently admitted sequence is preempted and its blocks freed. Each step calls <C>grow</C> then <C>admit</C>.
        </p>
        <Code>{ENGINE}</Code>
      </Definition>

      <Theorem title="the earliest admitted request always progresses">
        <p>
          Suppose the pool has at least <M>{"\\lceil (L+1)/b \\rceil"}</M> blocks, where L is the longest length any sequence reaches
          and b the block size. Then <C>grow</C> never preempts the earliest admitted running sequence, so it gains a token every step and
          eventually finishes.
        </p>
      </Theorem>
      <Proof>
        <p>
          Running sequences are kept in admission order and <C>grow</C> preempts from the end, so the first is preempted only after all
          others, when it is alone. Then it holds <M>{"\\lceil n/b \\rceil"}</M> blocks for its length n and every other block is free,
          at least <M>{"\\lceil (n+1)/b \\rceil - \\lceil n/b \\rceil"}</M> of them, which is exactly the one block it needs if its last
          block is full and zero otherwise. So its need fits and it is not preempted. Since a finished request frees its blocks and a new
          earliest request takes its place, the system never stalls, though later requests may be preempted many times.
        </p>
      </Proof>

      <Definition title="sizing a replica and streaming text">
        <p>
          <C>tp_degree</C> returns the smallest power of two of GPUs over which the weights, split by tensor parallelism (e10.4.1), fit
          within each GPU&apos;s memory less a reserved fraction. <C>kv_tokens</C> is how many tokens of KV cache the replica holds once
          the weights and a fixed overhead per GPU (activations, CUDA graphs, buffers) are subtracted. <C>stream_text</C> turns the bytes
          of each generated token into the text to send, holding back bytes that do not yet form whole UTF-8 characters (e11.5.1).
        </p>
        <Code>{REPLICA}</Code>
      </Definition>

      <Theorem title="streamed text is correct">
        <p>
          If the concatenated token bytes are valid UTF-8, the strings from <C>stream_text</C> concatenate to the decoded text, and each
          string is valid text.
        </p>
      </Theorem>
      <Proof>
        <p>
          The buffer is emitted and cleared exactly when it decodes, so emitted pieces are valid and the bytes are partitioned into
          consecutive chunks, each decodable. Decoding UTF-8 chunk by chunk at character boundaries gives the same characters as decoding
          the whole. The final buffer is empty because the whole string is valid and ends at a character boundary. Emitting each
          token&apos;s bytes decoded with replacement, as the buggy server did, shows a replacement symbol for the split character, even
          though the final text, decoded at once, is right.
        </p>
      </Proof>

      <Remark title="serving systems in practice">
        <p>
          Engines such as vLLM, SGLang and TensorRT-LLM separate an API server (often with an OpenAI-compatible interface) from the engine
          core, so tokenising, detokenising and scheduling on the CPU overlap with GPU steps. A replica spans the GPUs of one tensor
          parallel group, usually within a node; the fleet has many replicas behind a router. Preempted requests are either recomputed,
          as here, or have their blocks swapped to CPU memory and back; recomputation is often cheaper because prefill is fast. Schedulers
          also cap tokens per step so prefills mix with decodes (e12.2.4).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The pauses were preemptions: long sequences grew until a step needed more KV blocks than were free, the most recently admitted
          requests were evicted and later recomputed, and their streams resumed. A larger cache, fewer concurrent requests or shorter
          limits reduce them. The garbled letter came from decoding each token separately; holding back incomplete characters, as{" "}
          <C>stream_text</C> does, fixes it.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "blocks",
      rung: "check",
      prompt: (
        <p>
          With blocks of 16 tokens, how many free blocks does <C>admit</C> require to admit a 1,000-token prompt?
        </p>
      ),
      answer: { kind: "numeric", value: 63, tolerance: 0.001 },
    },
    {
      key: "tp",
      rung: "check",
      prompt: (
        <p>
          A 34-billion-parameter model is served in 16 bits on 24 GB GPUs, reserving 10% of each GPU. What tensor parallel degree does{" "}
          <C>tp_degree</C> choose?
        </p>
      ),
      answer: { kind: "numeric", value: 4, tolerance: 0.001 },
    },
    {
      key: "victim",
      rung: "apply",
      prompt: <p>Why does the scheduler preempt the most recently admitted request rather than the oldest?</p>,
      answer: {
        kind: "choice",
        options: [
          "It has done the least work, so recomputing it costs least, and the earliest request is then guaranteed to keep progressing",
          "The most recent request always has the longest prompt",
          "Older requests cannot be preempted because their blocks are locked by the GPU",
          "Preempting the newest request frees every block in the pool",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def blocks_needed(tokens, block_size):
    return math.ceil(tokens / block_size)

def admit(waiting, free_blocks, block_size, max_batch, running):
    admitted = []
    for n in waiting:                                    # prompt lengths, in arrival order
        need = blocks_needed(n + 1, block_size)          # the prompt and its first new token
        if len(running) + len(admitted) == max_batch or need > free_blocks:
            break                                        # first come, first served: none overtakes
        admitted.append(n)
        free_blocks -= need
    return admitted, free_blocks

def grow(running, free_blocks, block_size):
    running, preempted = list(running), []
    while True:
        need = sum(1 for n in running if n % block_size == 0)   # a full last block needs a new one
        if need <= free_blocks:
            break
        last = running.pop()                             # preempt the latest admitted, freeing its blocks
        preempted.append(last)
        free_blocks += blocks_needed(last, block_size)
    return [n + 1 for n in running], free_blocks - need, preempted

running, free, pre = grow([16, 5, 32], 1, 16)
print(running, free, pre, admit([20, 40, 3], free, 16, 4, running))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[17, 6] 2 [32] ([20], 0)",
          "[17, 6, 33] 0 [] ([], 0)",
          "[17, 6] 2 [32] ([20, 40], 0)",
          "[6, 33] 1 [16] ([20], 0)",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tp_degree(params_b, bytes_per_param, gpu_gb, reserve):
    tp = 1
    while params_b * bytes_per_param / tp > gpu_gb * (1 - reserve):
        tp *= 2                                          # shard the weights over more GPUs
    return tp

def kv_tokens(gpu_gb, tp, weights_gb, overhead_gb, bytes_per_token):
    free = tp * (gpu_gb - overhead_gb) - weights_gb      # what the replica has left for the cache
    return int(free * 1e9 // bytes_per_token)

def stream_text(token_bytes):
    out, buf = [], b""
    for t in token_bytes:
        buf += t
        try:
            out.append(buf.decode("utf-8"))
            buf = b""
        except UnicodeDecodeError:
            out.append("")                               # a character is split: wait for its other bytes
    return out

tp = tp_degree(70, 2, 80, 0.1)
print(tp, kv_tokens(80, tp, 140, 2, 327680), stream_text([b"a", b"\\xe2\\x82", b"\\xac", b"b"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2 48828 ['a', '', '€', 'b']",
          "2 48828 ['a', '�', '€', 'b']",
          "1 48828 ['a', '', '€', 'b']",
          "2 61035 ['a', '', '€', 'b']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>blocks_needed(tokens, block_size)</C>, <C>admit(waiting, free_blocks, block_size, max_batch, running)</C>, returning
          the admitted prompt lengths and the remaining free blocks, and <C>grow(running, free_blocks, block_size)</C>, returning the new
          lengths, the remaining free blocks and the preempted lengths in the order preempted.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def blocks_needed(tokens, block_size):
    return tokens // block_size

def admit(waiting, free_blocks, block_size, max_batch, running):
    return list(waiting), free_blocks

def grow(running, free_blocks, block_size):
    return [n + 1 for n in running], free_blocks, []
`,
        solution: ENGINE,
        tests: [
          { name: "admit", code: `assert blocks_needed(17, 8) == 3 and blocks_needed(16, 8) == 2\nassert admit([15, 2, 1], 3, 8, 8, []) == ([15, 2], 0)\nassert admit([3, 3, 3], 10, 4, 3, [5]) == ([3, 3], 8)` },
          { name: "grow", code: `assert grow([8, 3], 1, 4) == ([9, 4], 0, [])\nassert grow([4, 4, 1], 0, 4) == ([5], 1, [1, 4])\nassert grow([], 2, 4) == ([], 2, [])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tp_degree(params_b, bytes_per_param, gpu_gb, reserve)</C>,{" "}
          <C>kv_tokens(gpu_gb, tp, weights_gb, overhead_gb, bytes_per_token)</C>, returning an int, and{" "}
          <C>stream_text(token_bytes)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tp_degree(params_b, bytes_per_param, gpu_gb, reserve):
    return 1

def kv_tokens(gpu_gb, tp, weights_gb, overhead_gb, bytes_per_token):
    return int(gpu_gb * 1e9 // bytes_per_token)

def stream_text(token_bytes):
    return [t.decode("utf-8", errors="replace") for t in token_bytes]
`,
        solution: REPLICA,
        tests: [
          { name: "size", code: `assert tp_degree(8, 2, 80, 0.5) == 1 and tp_degree(405, 1, 80, 0.2) == 8\nassert kv_tokens(40, 4, 100, 5, 1000) == 40000000` },
          { name: "stream", code: `assert stream_text([b"\\xc3", b"\\xa9", b"t"]) == ["", "\\u00e9", "t"]\nassert stream_text([b"hi"]) == ["hi"]` },
        ],
      },
    },
    {
      key: "fit",
      rung: "stretch",
      prompt: (
        <p>
          A 70-billion-parameter model in 16 bits (140 GB) runs on 8 GPUs of 80 GB with 2 GB of overhead each. Its cache takes 327,680
          bytes per token. How many requests of 4,096 tokens can be held in the cache at once?
        </p>
      ),
      answer: { kind: "numeric", value: 360, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The scheduler trades how many requests run together against how fast each one goes. The next lesson measures that trade: time to
        first token, time between tokens, throughput, and the cost per million tokens that follows from them.
      </p>
    </>
  ),
};
