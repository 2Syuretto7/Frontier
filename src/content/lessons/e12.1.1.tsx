import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DecodeRooflineViz } from "@/components/viz/DecodeRooflineViz";
import type { LessonContent } from "@/lib/types";

const COST = `def flops_per_token(params):
    return 2.0 * params                            # one multiply and one add per weight

def prefill_time(params, prompt_len, peak_flops, bw, bytes_per_param):
    compute = 2 * params * prompt_len / peak_flops # every prompt token in one pass
    memory = params * bytes_per_param / bw         # weights read once
    return max(compute, memory)

def decode_time(params, batch, peak_flops, bw, bytes_per_param):
    compute = 2 * params * batch / peak_flops      # one new token per sequence
    memory = params * bytes_per_param / bw         # but every weight is read again
    return max(compute, memory)`;

const LOOP = `def generate(step_fn, prompt, n_new):
    tokens = list(prompt)
    for _ in range(n_new):
        tokens.append(step_fn(tokens))              # each new token depends on all before it
    return tokens[len(prompt):]

def latency(prefill_s, step_s, n_new):
    ttft = prefill_s                                # the prefill pass yields the first token
    return ttft, ttft + (n_new - 1) * step_s

def critical_batch(peak_flops, bw, bytes_per_param):
    return peak_flops * bytes_per_param / (2 * bw)  # decode batch where compute time equals weight-read time`;

export const lesson: LessonContent = {
  id: "e12.1.1",
  minutes: 50,
  links: {
    requires: ["e7.4.3", "l5.3.4"],
    revisits: ["e7.4.2", "e11.5.3"],
    foreshadows: ["e12.1.2"],
  },

  puzzle: (
    <>
      <p>
        On one accelerator, a 7B-parameter model reads a 1,000-token prompt in about the time it takes to write three or four tokens of its reply.
        Serving one user at a time, the accelerator&apos;s arithmetic units sit idle almost all of the time, yet serving sixty-four users
        at once barely slows anyone down. Why is generating text so different from reading it, and what does that imply for how
        inference should be organised?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Inference has two phases. Prefill processes the whole prompt in one forward pass: thousands of tokens share each weight read,
        so it is limited by arithmetic. Decode then produces one token per forward pass, because each token depends on the previous
        one, and every pass must read every weight from memory to do only a little arithmetic per sequence. On the roofline (e7.4.3),
        decode at small batch sits far to the left, limited by memory bandwidth. Batching many sequences shares each weight read, so
        throughput grows almost for free until the arithmetic catches up.
      </p>
      <DecodeRooflineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="cost of the two phases">
        <p>
          For a dense model with P parameters, a forward pass costs about 2P FLOPs per token, given by <C>flops_per_token</C>.{" "}
          <C>prefill_time</C> and <C>decode_time</C> take the larger of the arithmetic time and the time to read the weights once, at
          peak FLOP rate and memory bandwidth, ignoring attention and the KV cache, which the next lesson adds.
        </p>
        <Code>{COST}</Code>
      </Definition>

      <Theorem title="when decode becomes compute-bound">
        <p>
          With b bytes per parameter, peak rate F and bandwidth W, a decode step for batch B is memory-bound exactly when{" "}
          <M>{"B < Fb/(2W)"}</M>, and in that range its time does not depend on B.
        </p>
      </Theorem>
      <Proof>
        <p>
          Arithmetic takes <M>{"2PB/F"}</M> seconds and reading the weights <M>{"Pb/W"}</M>. The step is memory-bound when{" "}
          <M>{"2PB/F < Pb/W"}</M>, that is <M>{"B < Fb/(2W)"}</M>; P cancels. In that range the step time is <M>{"Pb/W"}</M>, the same
          for every B. Equivalently, the arithmetic intensity of decode is about <M>{"2B/b"}</M> FLOPs per byte (e7.4.2), which must
          reach the hardware&apos;s ratio <M>{"F/W"}</M>, typically a few hundred, before compute is the limit.
        </p>
      </Proof>

      <Definition title="the generation loop and its latencies">
        <p>
          <C>generate</C> calls <C>step_fn</C> on all tokens so far, appends the result, and repeats, returning only the new tokens.{" "}
          <C>latency</C> returns the time to first token, which the prefill pass produces, and the total time for{" "}
          <C>n_new</C> tokens. <C>critical_batch</C> is the batch size of the theorem above.
        </p>
        <Code>{LOOP}</Code>
      </Definition>

      <Theorem title="latency of a response">
        <p>
          If prefill takes <M>{"t_p"}</M> and each decode step <M>{"t_d"}</M>, a response of n tokens has time to first token{" "}
          <M>{"t_p"}</M> and total time <M>{"t_p + (n - 1)t_d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The prefill pass computes the distribution of the first new token, so it is available after <M>{"t_p"}</M>. Each of the
          remaining <M>{"n - 1"}</M> tokens needs one decode step, and the steps are sequential because each takes the previous token as
          input. Adding gives the total. For long responses the decode term dominates, which is why time per output token, and how many
          tokens a tokeniser needs for a text (e11.5.3), matter so much.
        </p>
      </Proof>

      <Remark title="prefill and decode in practice">
        <p>
          Serving systems report time to first token, set mainly by prefill and queueing, and time per output token, set by decode. With
          16-bit weights and current accelerators the critical batch is a few hundred sequences, so single-user decode uses a small
          fraction of the hardware. Much of this course is about exploiting the gap: batching many requests, shrinking what each step must
          read through smaller KV caches and quantised weights, and producing several tokens per step through speculative decoding.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With 16-bit weights, reading 7B parameters takes several milliseconds per step, while the arithmetic for one token takes about
          fifteen microseconds. The prompt&apos;s 1,000 tokens share one read of the weights, so prefill costs about as much as a few decode steps.
          Sixty-four users share each decode step&apos;s weight read just as the prompt tokens did, so until the batch approaches the
          critical size, adding users raises throughput without slowing anyone.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "tps",
      rung: "check",
      prompt: (
        <p>
          A 70B-parameter model with 16-bit weights decodes at batch 1 on an accelerator with 3.35 TB/s of memory bandwidth. Counting
          only weight reads, how many tokens per second can it produce? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 23.9, tolerance: 0.1 },
    },
    {
      key: "critical",
      rung: "check",
      prompt: (
        <p>
          An accelerator does 989 TFLOP/s in 16-bit arithmetic and has 3.35 TB/s of bandwidth. With 16-bit weights, at what batch size,
          to the nearest whole number, does decode stop being memory-bound?
        </p>
      ),
      answer: { kind: "numeric", value: 295, tolerance: 1 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why is decoding at small batch sizes limited by memory bandwidth rather than arithmetic?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each step reads every weight but does only about two FLOPs per weight for each sequence in the batch",
          "Decoding uses no matrix multiplications",
          "The prompt must be re-read from disk at every step",
          "Arithmetic units are disabled during decoding",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def flops_per_token(params):
    return 2.0 * params                            # one multiply and one add per weight

def prefill_time(params, prompt_len, peak_flops, bw, bytes_per_param):
    compute = 2 * params * prompt_len / peak_flops # every prompt token in one pass
    memory = params * bytes_per_param / bw         # weights read once
    return max(compute, memory)

def decode_time(params, batch, peak_flops, bw, bytes_per_param):
    compute = 2 * params * batch / peak_flops      # one new token per sequence
    memory = params * bytes_per_param / bw         # but every weight is read again
    return max(compute, memory)

P, peak, bw = 7e9, 1e15, 2e12
print(flops_per_token(P), round(prefill_time(P, 1000, peak, bw, 2), 4), round(decode_time(P, 8, peak, bw, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "14000000000.0 0.014 0.007",
          "14000000000.0 0.007 0.007",
          "14000000000.0 0.014 0.0001",
          "7000000000.0 0.014 0.007",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def generate(step_fn, prompt, n_new):
    tokens = list(prompt)
    for _ in range(n_new):
        tokens.append(step_fn(tokens))              # each new token depends on all before it
    return tokens[len(prompt):]

def latency(prefill_s, step_s, n_new):
    ttft = prefill_s                                # the prefill pass yields the first token
    return ttft, ttft + (n_new - 1) * step_s

def critical_batch(peak_flops, bw, bytes_per_param):
    return peak_flops * bytes_per_param / (2 * bw)  # decode batch where compute time equals weight-read time

toks = generate(lambda t: (t[-1] * 2) % 7, [3], 4)
print(toks, latency(0.2, 0.05, 11), critical_batch(1e15, 2e12, 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[6, 5, 3, 6] (0.2, 0.7) 500.0",
          "[3, 6, 5, 3] (0.2, 0.7) 500.0",
          "[6, 5, 3, 6] (0.2, 0.75) 500.0",
          "[6, 5, 3, 6] (0.2, 0.7) 250.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>flops_per_token(params)</C>, returning a float; <C>prefill_time(params, prompt_len, peak_flops, bw,
          bytes_per_param)</C>; and <C>decode_time(params, batch, peak_flops, bw, bytes_per_param)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def flops_per_token(params):
    return float(params)

def prefill_time(params, prompt_len, peak_flops, bw, bytes_per_param):
    return 2 * params * prompt_len / peak_flops

def decode_time(params, batch, peak_flops, bw, bytes_per_param):
    return 2 * params * batch / peak_flops
`,
        solution: COST,
        tests: [
          { name: "prefill", code: `assert flops_per_token(5) == 10.0 and isinstance(flops_per_token(5), float)\nassert prefill_time(100, 50, 1000, 10, 1) == 10.0 and prefill_time(100, 1, 1000, 10, 1) == 10.0 and prefill_time(100, 1, 1000, 100, 1) == 1.0` },
          { name: "decode", code: `assert decode_time(1000, 4, 8000, 100, 2) == 20.0 and decode_time(1000, 1000, 8000, 100, 2) == 250.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>generate(step_fn, prompt, n_new)</C>, without modifying <C>prompt</C>; <C>latency(prefill_s, step_s, n_new)</C>,
          returning a pair; and <C>critical_batch(peak_flops, bw, bytes_per_param)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def generate(step_fn, prompt, n_new):
    return [step_fn(prompt)] * n_new

def latency(prefill_s, step_s, n_new):
    return prefill_s, prefill_s + n_new * step_s

def critical_batch(peak_flops, bw, bytes_per_param):
    return peak_flops / bw
`,
        solution: LOOP,
        tests: [
          { name: "generate", code: `p = [1, 1]\nassert generate(lambda t: t[-1] + t[-2], p, 4) == [2, 3, 5, 8] and p == [1, 1]\nassert generate(lambda t: len(t), [9], 3) == [1, 2, 3] and generate(lambda t: 0, [4], 0) == []` },
          { name: "latency", code: `assert latency(1.0, 0.5, 1) == (1.0, 1.0) and latency(2.0, 0.25, 5) == (2.0, 3.0)\nassert critical_batch(600.0, 3.0, 1) == 100.0` },
        ],
      },
    },
    {
      key: "budget",
      rung: "stretch",
      prompt: (
        <p>
          A 500-token response must be complete within 10 seconds, and the time to first token is 0.5 seconds. What is the largest
          allowed time per output token, in milliseconds? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 19.04, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Weights are not the only thing a decode step reads. Every sequence also carries the keys and values of all its earlier tokens,
        and at long contexts or large batches this cache outgrows the model. The next lesson measures it.
      </p>
    </>
  ),
};
