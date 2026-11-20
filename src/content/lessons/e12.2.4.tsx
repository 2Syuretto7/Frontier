import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChunkedPrefillViz } from "@/components/viz/ChunkedPrefillViz";
import type { LessonContent } from "@/lib/types";

const CHUNK = `def chunk_prefill(prompt_len, chunk):
    return [min(chunk, prompt_len - i) for i in range(0, prompt_len, chunk)]

def max_step_time(prompt_len, chunk, base_s, per_token_s):
    return base_s + min(chunk, prompt_len) * per_token_s     # the slowest step decoding sequences must wait through

def ttft(prompt_len, chunk, base_s, per_token_s):
    return sum(base_s + c * per_token_s for c in chunk_prefill(prompt_len, chunk))`;

const SPLIT = `def kv_transfer_time(tokens, kv_per_token, link_bw):
    return tokens * kv_per_token / link_bw          # moving the prompt's cache from prefill to decode machines

def pd_ratio(prefill_tps, decode_tps, prompt_len, out_len):
    return (prefill_tps / prompt_len) / (decode_tps / out_len)   # decode instances per prefill instance

def meets_slo(ttft_s, tpot_s, ttft_slo, tpot_slo):
    return ttft_s <= ttft_slo and tpot_s <= tpot_slo`;

export const lesson: LessonContent = {
  id: "e12.2.4",
  minutes: 50,
  links: {
    requires: ["e12.2.1", "e12.1.1"],
    revisits: ["e8.5.1", "e12.1.2"],
    foreshadows: ["e12.3.1"],
  },

  puzzle: (
    <>
      <p>
        Users of a coding assistant complain that replies stream smoothly and then freeze for a quarter of a second, several times a
        minute. The freezes line up with other users pasting long files: each such prompt&apos;s prefill runs as one large forward pass,
        and every sequence being decoded waits for it to finish. How can a server keep decoding smooth when long prompts arrive at
        random, without making those prompts wait?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Prefill and decode have opposite needs: prefill is compute-bound and wants large passes, decode is memory-bound and wants short,
        regular steps (e12.1.1). Mixing them carelessly in continuous batching lets one long prefill stall all decoding. Chunked prefill
        splits a long prompt into pieces of a fixed token budget and runs one piece per step alongside the decode batch, so every step
        stays short; the decode tokens ride on otherwise idle bandwidth. Disaggregation goes further: separate machines run prefill and
        decode, and the prompt&apos;s KV cache (e12.1.2) is transferred between them, so each pool can be sized and configured for its
        own phase.
      </p>
      <ChunkedPrefillViz />
    </>
  ),

  theory: (
    <>
      <Definition title="chunked prefill">
        <p>
          A step costs <C>base_s</C> for the decode batch plus <C>per_token_s</C> for each prefill token it carries.{" "}
          <C>chunk_prefill</C> splits a prompt into chunks of at most <C>chunk</C> tokens. <C>max_step_time</C> is the longest step while
          the prompt is being processed, which is the worst gap between tokens for sequences already decoding, and <C>ttft</C> is the time
          to complete the prompt&apos;s prefill.
        </p>
        <Code>{CHUNK}</Code>
      </Definition>

      <Theorem title="the chunk-size trade-off">
        <p>
          With step cost <M>{"t_0 + c\\tau"}</M> for a chunk of c tokens, a prompt of P tokens has prefill time{" "}
          <M>{"\\lceil P/c \\rceil t_0 + P\\tau"}</M>, and the longest decode gap is <M>{"t_0 + \\min(c, P)\\tau"}</M>. Smaller chunks
          shorten the gap and lengthen prefill.
        </p>
      </Theorem>
      <Proof>
        <p>
          The prompt is processed in <M>{"\\lceil P/c \\rceil"}</M> steps, each paying <M>{"t_0"}</M>, and its tokens contribute{" "}
          <M>{"P\\tau"}</M> in total whatever the chunking; summing gives the prefill time. Each such step carries at most{" "}
          <M>{"\\min(c, P)"}</M> prompt tokens, the first one exactly that many, which gives the longest gap. The first expression
          decreases and the second increases in c, so a server picks the largest c whose gap meets its time-per-output-token target.
        </p>
      </Proof>

      <Definition title="disaggregated serving">
        <p>
          <C>kv_transfer_time</C> is the time to send a prompt&apos;s cache over a link. <C>pd_ratio</C> is how many decode instances
          each prefill instance needs, given each instance&apos;s token throughput and the average prompt and output lengths.{" "}
          <C>meets_slo</C> checks a request&apos;s time to first token and time per output token against service-level objectives.
        </p>
        <Code>{SPLIT}</Code>
      </Definition>

      <Theorem title="balancing the two pools">
        <p>
          If a prefill instance processes <M>{"R_p"}</M> prompt tokens per second and a decode instance produces <M>{"R_d"}</M> output
          tokens per second, with average prompt length P and output length O, a steady system needs{" "}
          <M>{"(R_p/P)/(R_d/O)"}</M> decode instances per prefill instance.
        </p>
      </Theorem>
      <Proof>
        <p>
          A prefill instance completes <M>{"R_p/P"}</M> requests per second, and a decode instance <M>{"R_d/O"}</M>. In steady state,
          requests leave prefill and decode at the same rate, so the decode pool&apos;s total rate must equal the prefill pool&apos;s;
          with one prefill instance this needs <M>{"(R_p/P)/(R_d/O)"}</M> decode instances. Fewer, and requests queue between the
          pools; more, and decode capacity idles. Changes in the mix of prompt and output lengths shift the ratio, so the pools are
          rebalanced over time.
        </p>
      </Proof>

      <Remark title="chunking and disaggregation in practice">
        <p>
          Chunked prefill with a per-step token budget is the default in several serving engines, and the budget is tuned to the latency
          target. Disaggregated systems, such as DistServe, Splitwise and Mooncake, place prefill and decode on different machines or
          accelerator types, often with different parallelism, and move caches over fast interconnects; transfer cost grows with the
          cache size, which is one more reason for small caches. Scheduling across the pools is a classic queueing and placement problem
          (e8.5.1).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          A pasted file of several thousand tokens made one forward pass take a quarter of a second, freezing every other stream. With
          chunks of a few hundred tokens, each step grows by only about ten milliseconds while the file is read over a handful of steps, so
          streams stay smooth and the new request&apos;s first token is delayed only slightly. At larger scale, sending long prompts to a
          separate prefill pool removes the interference entirely.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "budget",
      rung: "check",
      prompt: (
        <p>
          A decode step takes 15 ms, and each prefill token added to a step costs 0.05 ms. The target time per output token is 40 ms.
          What is the largest chunk size?
        </p>
      ),
      answer: { kind: "numeric", value: 500, tolerance: 0 },
    },
    {
      key: "transfer",
      rung: "check",
      prompt: (
        <p>
          An 8,000-token prompt&apos;s cache, at 327,680 bytes per token, moves from a prefill to a decode machine over a 25 GB/s
          (25 × 10⁹ bytes per second) link. How many milliseconds does the transfer take? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 104.9, tolerance: 0.1 },
    },
    {
      key: "why_split",
      rung: "apply",
      prompt: <p>What is the main motivation for running prefill and decode on separate machines?</p>,
      answer: {
        kind: "choice",
        options: [
          "Prefill is compute-bound and decode memory-bound, so separating them stops interference and lets each pool use suitable hardware and parallelism",
          "Decode cannot run on the same accelerator type as training",
          "It removes the need for a KV cache",
          "It makes prefix caching unnecessary",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def chunk_prefill(prompt_len, chunk):
    return [min(chunk, prompt_len - i) for i in range(0, prompt_len, chunk)]

def max_step_time(prompt_len, chunk, base_s, per_token_s):
    return base_s + min(chunk, prompt_len) * per_token_s     # the slowest step decoding sequences must wait through

def ttft(prompt_len, chunk, base_s, per_token_s):
    return sum(base_s + c * per_token_s for c in chunk_prefill(prompt_len, chunk))

ch = chunk_prefill(1000, 384)
print(ch, round(max_step_time(1000, 384, 0.01, 1e-4), 4), round(ttft(1000, 384, 0.01, 1e-4), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[384, 384, 232] 0.0484 0.13",
          "[384, 384, 384] 0.0484 0.13",
          "[384, 384, 232] 0.11 0.13",
          "[384, 384, 232] 0.0484 0.11",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def kv_transfer_time(tokens, kv_per_token, link_bw):
    return tokens * kv_per_token / link_bw          # moving the prompt's cache from prefill to decode machines

def pd_ratio(prefill_tps, decode_tps, prompt_len, out_len):
    return (prefill_tps / prompt_len) / (decode_tps / out_len)   # decode instances per prefill instance

def meets_slo(ttft_s, tpot_s, ttft_slo, tpot_slo):
    return ttft_s <= ttft_slo and tpot_s <= tpot_slo

t = kv_transfer_time(4000, 131072, 50e9)
print(round(t, 4), pd_ratio(20000, 2000, 2000, 500), meets_slo(0.5, 0.04, 1.0, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.0105 2.5 True", "0.0105 0.4 True", "0.0105 2.5 False", "0.0839 2.5 True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chunk_prefill(prompt_len, chunk)</C>, <C>max_step_time(prompt_len, chunk, base_s, per_token_s)</C> and{" "}
          <C>ttft(prompt_len, chunk, base_s, per_token_s)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def chunk_prefill(prompt_len, chunk):
    return [prompt_len]

def max_step_time(prompt_len, chunk, base_s, per_token_s):
    return base_s + prompt_len * per_token_s

def ttft(prompt_len, chunk, base_s, per_token_s):
    return base_s + prompt_len * per_token_s
`,
        solution: CHUNK,
        tests: [
          { name: "chunks", code: `assert chunk_prefill(10, 4) == [4, 4, 2] and chunk_prefill(8, 4) == [4, 4] and chunk_prefill(3, 10) == [3]` },
          { name: "times", code: `assert max_step_time(10, 4, 1.0, 0.5) == 3.0 and max_step_time(3, 10, 1.0, 0.5) == 2.5\nassert ttft(10, 4, 1.0, 0.5) == 8.0 and ttft(10, 10, 1.0, 0.5) == 6.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>kv_transfer_time(tokens, kv_per_token, link_bw)</C>, <C>pd_ratio(prefill_tps, decode_tps, prompt_len, out_len)</C>{" "}
          and <C>meets_slo(ttft_s, tpot_s, ttft_slo, tpot_slo)</C>, where meeting a target exactly counts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def kv_transfer_time(tokens, kv_per_token, link_bw):
    return 0.0

def pd_ratio(prefill_tps, decode_tps, prompt_len, out_len):
    return prefill_tps / decode_tps

def meets_slo(ttft_s, tpot_s, ttft_slo, tpot_slo):
    return ttft_s < ttft_slo
`,
        solution: SPLIT,
        tests: [
          { name: "transfer", code: `assert kv_transfer_time(10, 4, 8) == 5.0 and pd_ratio(1000, 100, 100, 10) == 1.0 and pd_ratio(600, 300, 100, 100) == 2.0` },
          { name: "slo", code: `assert meets_slo(1.0, 0.05, 1.0, 0.05) and not meets_slo(0.2, 0.06, 1.0, 0.05) and not meets_slo(1.1, 0.01, 1.0, 0.05)` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          A prefill instance processes 50,000 prompt tokens per second and a decode instance produces 1,500 output tokens per second in
          total. Prompts average 4,000 tokens and outputs 400. How many decode instances are needed per prefill instance? Give two
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.33, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Batching uses idle bandwidth by decoding many sequences at once. The next chapter uses it differently: producing several tokens of
        one sequence per step, starting with speculative decoding.
      </p>
    </>
  ),
};
