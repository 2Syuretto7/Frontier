import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BatchingTimelineViz } from "@/components/viz/BatchingTimelineViz";
import type { LessonContent } from "@/lib/types";

const STATIC = `def static_batches(lengths, batch):
    groups = [lengths[i:i + batch] for i in range(0, len(lengths), batch)]
    return sum(max(g) for g in groups)              # each batch runs until its longest request ends

def padding_waste(lengths, batch):
    groups = [lengths[i:i + batch] for i in range(0, len(lengths), batch)]
    slot_steps = sum(len(g) * max(g) for g in groups)
    return 1 - sum(lengths) / slot_steps            # share of slot-steps spent on finished requests

def static_finish_times(lengths, batch):
    out, t = [], 0
    for i in range(0, len(lengths), batch):
        g = lengths[i:i + batch]
        t += max(g)
        out += [t] * len(g)                         # the whole batch returns together
    return out`;

const CONTINUOUS = `import heapq

def simulate_continuous(requests, slots):
    free = [0] * slots                              # when each slot next becomes free
    finishes = []
    for arrival, length in requests:                # requests in arrival order
        start = max(arrival, heapq.heappop(free))   # take the earliest free slot
        finishes.append(start + length)
        heapq.heappush(free, start + length)
    return finishes

def mean_latency(requests, finishes):
    return sum(f - a for (a, _), f in zip(requests, finishes)) / len(requests)

def throughput(requests, finishes):
    return sum(n for _, n in requests) / max(finishes)   # tokens per step`;

export const lesson: LessonContent = {
  id: "e12.2.1",
  minutes: 50,
  links: {
    requires: ["e12.1.2", "e8.5.1"],
    revisits: ["e11.8.2", "e12.1.1"],
    foreshadows: ["e12.2.2"],
  },

  puzzle: (
    <>
      <p>
        A chatbot server batches requests in groups of thirty-two. Most replies are a few dozen tokens, but one in thirty-two runs to two
        thousand. Users with short questions wait as long as whoever asked for an essay, and the accelerator spends most of its time
        decoding for a single sequence in a batch of thirty-two. A different server, on the same hardware, triples throughput and cuts
        median latency by a factor of ten. What does it do differently?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Static batching fixes a batch, runs it until its longest member finishes, and only then starts the next; dynamic batching adds a
        short wait to collect a batch, but keeps the same lockstep. Because output lengths vary enormously, most slots sit idle while the
        longest request finishes, much like padding in training (e11.8.2). Continuous batching, also called iteration-level scheduling,
        decides the batch afresh at every decode step: a finished sequence leaves immediately and a waiting one takes its slot, with its
        prefill run alongside the other sequences&apos; decode steps.
      </p>
      <BatchingTimelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="static batching">
        <p>
          Requests, all present at the start, are grouped in order into batches of size <C>batch</C>. <C>static_batches</C> gives the
          total decode steps, <C>padding_waste</C> the share of slot-steps spent holding finished requests, and{" "}
          <C>static_finish_times</C> the step at which each request is returned, when its whole batch ends.
        </p>
        <Code>{STATIC}</Code>
      </Definition>

      <Theorem title="static batching wastes about half">
        <p>
          In one static batch, a fraction <M>{"1 - \\bar\\ell/\\ell_{\\max}"}</M> of slot-steps is idle, where <M>{"\\bar\\ell"}</M> is the
          mean and <M>{"\\ell_{\\max}"}</M> the maximum output length. If lengths are independent and uniform on{" "}
          <M>{"\\{1, \\dots, n\\}"}</M>, the waste of large batches approaches <M>{"(n - 1)/(2n)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          A batch of B requests occupies <M>{"B\\ell_{\\max}"}</M> slot-steps and does <M>{"B\\bar\\ell"}</M> useful ones, so the idle
          fraction is <M>{"1 - \\bar\\ell/\\ell_{\\max}"}</M>. For large B the maximum is n with probability tending to 1, and the mean
          tends to <M>{"(n + 1)/2"}</M> by the law of large numbers, so the waste tends to <M>{"1 - (n + 1)/(2n) = (n - 1)/(2n)"}</M>,
          nearly a half. Real length distributions are heavier-tailed than uniform, making it worse.
        </p>
      </Proof>

      <Definition title="continuous batching">
        <p>
          <C>simulate_continuous</C> takes requests in arrival order as (arrival step, output length) pairs and gives each the slot that
          frees earliest, starting it when both the slot is free and the request has arrived. <C>mean_latency</C> averages finish minus
          arrival, and <C>throughput</C> divides total tokens by the last finish time.
        </p>
        <Code>{CONTINUOUS}</Code>
      </Definition>

      <Theorem title="continuous batching is near optimal">
        <p>
          If all requests are present at the start, continuous batching with B slots finishes within{" "}
          <M>{"\\sum_i \\ell_i/B + (1 - 1/B)\\ell_{\\max}"}</M> steps, while any schedule needs at least{" "}
          <M>{"\\max(\\sum_i \\ell_i/B, \\ell_{\\max})"}</M>, so it is within a factor of 2 of optimal.
        </p>
      </Theorem>
      <Proof>
        <p>
          The lower bound holds because B slots do at most B tokens per step and the longest request needs <M>{"\\ell_{\\max}"}</M>{" "}
          steps. For the upper bound, let request j finish last and start at s. Before s every slot was busy, or j would have started
          earlier, so the work done before s is at least <M>{"Bs"}</M>, and it excludes j: <M>{"Bs \\le \\sum_i \\ell_i - \\ell_j"}</M>.
          Then the finish time is <M>{"s + \\ell_j \\le \\sum_i \\ell_i/B + (1 - 1/B)\\ell_j"}</M>, at most the stated bound. This is
          Graham&apos;s bound for list scheduling (e8.5.1); each term is at most the optimum, so the sum is at most twice it.
        </p>
      </Proof>

      <Remark title="batching in practice">
        <p>
          Continuous batching was introduced in the Orca serving system and is now standard in open serving engines. The scheduler runs
          every step: it admits requests while their KV cache fits, which the next lesson makes flexible with paging, and it may pause or
          evict sequences under memory pressure. Because decode is memory-bound at small batches (e12.1.1), keeping every slot busy is
          almost free throughput, and short requests no longer wait for long ones.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With static batches of thirty-two, nearly every batch contains one long reply, so each batch takes about two thousand steps and
          most slots are idle for most of them; every user in the batch waits for the longest reply. The second server batches
          continuously: short replies finish and leave in a few dozen steps, and their slots are refilled at once, so the accelerator is
          always decoding about thirty-two sequences and short requests return almost immediately.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "waste",
      rung: "check",
      prompt: (
        <p>
          A static batch holds requests of 100, 200, 300 and 1,000 output tokens. What fraction of its slot-steps is idle? Give one
          decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "makespan",
      rung: "check",
      prompt: (
        <p>
          With 2 slots and continuous batching, requests of 5, 3, 4 and 2 tokens, all present at step 0, are admitted in that order. At
          what step does the last one finish?
        </p>
      ),
      answer: { kind: "numeric", value: 7, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What is the main reason continuous batching raises throughput over static batching?</p>,
      answer: {
        kind: "choice",
        options: [
          "A finished sequence frees its slot at once, so the batch stays full instead of waiting for the longest request",
          "It reads the weights fewer times per token for each sequence",
          "It shortens the responses",
          "It skips the prefill phase",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def static_batches(lengths, batch):
    groups = [lengths[i:i + batch] for i in range(0, len(lengths), batch)]
    return sum(max(g) for g in groups)              # each batch runs until its longest request ends

def padding_waste(lengths, batch):
    groups = [lengths[i:i + batch] for i in range(0, len(lengths), batch)]
    slot_steps = sum(len(g) * max(g) for g in groups)
    return 1 - sum(lengths) / slot_steps            # share of slot-steps spent on finished requests

def static_finish_times(lengths, batch):
    out, t = [], 0
    for i in range(0, len(lengths), batch):
        g = lengths[i:i + batch]
        t += max(g)
        out += [t] * len(g)                         # the whole batch returns together
    return out

L = [3, 8, 2, 5, 5, 1]
print(static_batches(L, 2), round(padding_waste(L, 2), 2), static_finish_times(L, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "18 0.33 [8, 8, 8, 13, 13, 13]",
          "24 0.33 [8, 8, 8, 13, 13, 13]",
          "18 0.5 [8, 8, 8, 13, 13, 13]",
          "18 0.33 [3, 8, 2, 13, 13, 9]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import heapq

def simulate_continuous(requests, slots):
    free = [0] * slots                              # when each slot next becomes free
    finishes = []
    for arrival, length in requests:                # requests in arrival order
        start = max(arrival, heapq.heappop(free))   # take the earliest free slot
        finishes.append(start + length)
        heapq.heappush(free, start + length)
    return finishes

def mean_latency(requests, finishes):
    return sum(f - a for (a, _), f in zip(requests, finishes)) / len(requests)

def throughput(requests, finishes):
    return sum(n for _, n in requests) / max(finishes)   # tokens per step

reqs = [(0, 4), (0, 2), (1, 3), (5, 1)]; fin = simulate_continuous(reqs, 2)
print(fin, mean_latency(reqs, fin), round(throughput(reqs, fin), 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[4, 2, 5, 6] 2.75 1.67", "[4, 2, 4, 6] 2.5 1.67", "[4, 2, 5, 6] 4.25 1.67", "[4, 2, 5, 6] 2.75 2.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>static_batches(lengths, batch)</C>, <C>padding_waste(lengths, batch)</C> and{" "}
          <C>static_finish_times(lengths, batch)</C>. The last batch may be smaller than <C>batch</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def static_batches(lengths, batch):
    return sum(lengths)

def padding_waste(lengths, batch):
    return 0.0

def static_finish_times(lengths, batch):
    return list(lengths)
`,
        solution: STATIC,
        tests: [
          { name: "steps", code: `assert static_batches([1, 4, 2], 2) == 6 and static_batches([7], 3) == 7\nassert padding_waste([2, 2, 2], 2) == 0.0 and abs(padding_waste([1, 3], 2) - 1 / 3) < 1e-12` },
          { name: "finish", code: `assert static_finish_times([1, 4, 2], 2) == [4, 4, 6] and static_finish_times([5, 1, 1], 1) == [5, 6, 7]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>simulate_continuous(requests, slots)</C>, returning finish times in request order, <C>mean_latency(requests,
          finishes)</C> and <C>throughput(requests, finishes)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import heapq

def simulate_continuous(requests, slots):
    return [a + n for a, n in requests]

def mean_latency(requests, finishes):
    return 0.0

def throughput(requests, finishes):
    return 0.0
`,
        solution: CONTINUOUS,
        tests: [
          { name: "simulate", code: `assert simulate_continuous([(0, 3), (0, 3), (0, 1)], 2) == [3, 3, 4]\nassert simulate_continuous([(0, 2), (5, 2)], 1) == [2, 7] and simulate_continuous([(0, 2), (1, 2)], 1) == [2, 4]` },
          { name: "metrics", code: `r = [(0, 2), (1, 2)]\nassert mean_latency(r, [2, 4]) == 2.5 and throughput(r, [2, 4]) == 1.0 and throughput([(0, 6)], [4]) == 1.5` },
        ],
      },
    },
    {
      key: "graham",
      rung: "stretch",
      prompt: (
        <p>
          Continuous batching with 8 slots serves requests totalling 10,000 output tokens, the longest being 500, all present at the
          start. What is the upper bound on the finishing step from the theorem?
        </p>
      ),
      answer: { kind: "numeric", value: 1687.5, tolerance: 0.01 },
    },
  ],

  glimpse: (
    <>
      <p>
        Continuous batching admits a request only if its KV cache fits, and reserving a full-length cache per request wastes memory on
        tokens that may never be generated. The next lesson borrows virtual memory from operating systems to fix this.
      </p>
    </>
  ),
};
