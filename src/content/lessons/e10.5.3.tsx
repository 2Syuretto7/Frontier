import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZeroBubbleViz } from "@/components/viz/ZeroBubbleViz";
import type { LessonContent } from "@/lib/types";

const GREEDY = `def deps(op, p):
    kind, s, j = op
    if kind == 'F':
        return [('F', s - 1, j)] if s else []
    if kind == 'B':                                  # gradient with respect to the stage's input
        return [('B', s + 1, j)] if s < p - 1 else [('F', s, j)]
    return [('B', s, j)]                             # W, the weight gradient, feeds nothing downstream

def greedy_pipeline(p, m, dur, limits):
    done, free, live = {}, [0.0] * p, [0] * p
    todo = {(k, s, j) for k in dur for s in range(p) for j in range(m)}
    while todo:
        best = None
        for op in todo:
            kind, s, j = op
            ds = deps(op, p)
            if any(d not in done for d in ds) or (kind == 'F' and live[s] >= limits[s]):
                continue
            start = max([free[s]] + [done[d] for d in ds])
            key = (start, 'BFW'.index(kind), j, s)   # earliest start; then B, F, W
            if best is None or key < best[0]:
                best = (key, op)
        key, op = best
        done[op] = key[0] + dur[op[0]]
        free[op[1]] = done[op]
        todo.remove(op)
        live[op[1]] += {'F': 1, 'B': 0, 'W': -1}[op[0]]   # activations live from F until W
    return max(done.values())

def bubble_of(end, m, dur):
    return 1 - m * sum(dur.values()) / end           # every stage does the same work`;

const BOUNDS = `def bubble_interleaved(p, m, v):
    return (p - 1) / (v * m + p - 1)                 # v = 1 is plain 1F1B

def interleaved_time(p, m, v, f, b):
    return (m + (p - 1) / v) * (f + b)               # f and b for a whole device, all v chunks

def zb_lower_bound(p, m, f, b, w):
    last = (p - 1) * f + m * (f + b + w)             # the last stage cannot start earlier
    first = (p - 1) * (f + b) + m * (f + b) + w      # nor can stage 0 finish its final B and W
    return max(last, first)`;

const SPLIT = `# The backward pass of y = x @ W has two independent products.
grad_x = grad_y @ W.T        # B: needed by the previous stage now
grad_W = x.T @ grad_y        # W: needed only by the optimiser at the end of the step
# Zero-bubble schedules run B immediately and keep x and grad_y until W runs.`;

export const lesson: LessonContent = {
  id: "e10.5.3",
  minutes: 50,
  links: {
    requires: ["e10.5.2"],
    revisits: ["e6.2.1", "e10.1.2"],
    foreshadows: ["e10.7.1", "e10.7.2"],
  },

  puzzle: (
    <>
      <p>
        With 8 stages and 16 micro-batches, 1F1B idles each GPU for 7 of every 23 time slots, about 30%. Raising m is limited by the
        global batch. Two ideas cut the bubble without changing the batch: give each GPU several thin stages instead of one thick one,
        and split each backward pass into the part the previous stage is waiting for and the part nobody is waiting for. How small can
        the bubble get, and what does each idea cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The bubble is the time to fill and drain the pipeline, which is p − 1 stage-times. Make each stage thinner, by giving a GPU v
        non-adjacent chunks of layers, and a stage-time shrinks by v, at the price of v times more sends between GPUs. Separately, the
        backward pass of a linear layer computes two products: the gradient for the layer&apos;s input, which the previous stage needs,
        and the gradient for its weights, which only the optimiser needs at the end of the step. Running the second later lets it fill
        the gaps.
      </p>
      <ZeroBubbleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="interleaving and splitting">
        <p>
          In the interleaved schedule, the model is cut into pv chunks and device i holds chunks i, i + p, i + 2p, and so on; each
          micro-batch passes around the devices v times. In zero-bubble schedules each backward is split into B, the input gradient,
          which depends on the next stage&apos;s B, and W, the weight gradient, which depends only on this stage&apos;s B (<C>deps</C>).
          The activations a W needs stay live from its F until it runs.
        </p>
        <Code>{SPLIT}</Code>
      </Definition>

      <Theorem title="the interleaved bubble">
        <p>
          With p devices, v chunks per device, m micro-batches (a multiple of p) and f, b the forward and backward time of a whole
          device&apos;s layers, the interleaved 1F1B schedule takes <M>{"(m + (p-1)/v)(f + b)"}</M>, a bubble of
        </p>
        <MD>{"\\frac{p - 1}{vm + p - 1}."}</MD>
        <p>Each micro-batch crosses v times as many device boundaries.</p>
      </Theorem>
      <Proof>
        <p>
          A chunk&apos;s forward takes f/v and its backward b/v. The first micro-batch reaches the last device after p − 1 chunk
          forwards, and the last gradient leaves it p − 1 chunk backwards before the end; with m a multiple of p, the round-robin
          order keeps every device busy in between, so each device idles <M>{"(p-1)(f+b)/v"}</M> and works{" "}
          <M>{"m(f+b)"}</M> (<C>interleaved_time</C>, <C>bubble_interleaved</C>). A micro-batch leaves a device once per chunk, so v
          times per pass.
        </p>
      </Proof>

      <Theorem title="how far splitting can go">
        <p>
          With per-stage times f, b and w for F, B and W, any schedule on p stages takes at least
        </p>
        <MD>{"\\max\\bigl((p-1)f + m(f+b+w),\; (p-1)(f+b) + m(f+b) + w\\bigr),"}</MD>
        <p>
          while 1F1B, which runs W with B, takes <M>{"(m+p-1)(f+b+w)"}</M>. When the first term is the larger, the idle time per stage
          falls from <M>{"(p-1)(f+b+w)"}</M> to <M>{"(p-1)f"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The last stage cannot start before its first input arrives at <M>{"(p-1)f"}</M>, and then has <M>{"m(f+b+w)"}</M> of work.
          For the second term: the last stage&apos;s final B needs all m of its F and B, so ends no earlier than{" "}
          <M>{"(p-1)f + m(f+b)"}</M>; that gradient takes <M>{"(p-1)b"}</M> more to reach stage 0, whose final W follows its final B
          (<C>zb_lower_bound</C>). 1F1B&apos;s time is the e10.5.2 formula with b + w as the backward.
        </p>
        <Code>{BOUNDS}</Code>
      </Proof>

      <Remark title="a scheduler that gets close">
        <p>
          Hand-built zero-bubble schedules exist, but a simple greedy rule already gets close: whenever a stage is free, run whichever
          ready operation can start earliest, preferring B, then F, then W, and allow a new F only while fewer than a set number of
          micro-batches are live on that stage (<C>greedy_pipeline</C>, <C>bubble_of</C>). With 1F1B&apos;s memory limit of p − s it
          removes much of the bubble; with a limit of 2p on every stage it reaches the lower bound in the example above.
        </p>
        <Code>{GREEDY}</Code>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Interleaving divides the bubble by v but multiplies the point-to-point traffic by v and needs m to be a multiple of p.
          Splitting the backward pass costs no extra communication and no extra compute, only the memory of activations whose W is
          waiting; with enough of it the idle time falls to the last stage&apos;s unavoidable start-up wait. The two combine, and
          the remaining bubble is then small compared with the other losses of e10.1.2.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "interleave",
      rung: "check",
      prompt: <p>With 8 devices, 16 micro-batches and 4 chunks per device, what is the bubble of the interleaved schedule? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.099, tolerance: 0.001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: (
        <p>
          A pipeline has 8 stages and 16 micro-batches, with F, B and W each taking 1 ms per stage. What is the smallest step time,
          in ms, that any schedule could achieve?
        </p>
      ),
      answer: { kind: "numeric", value: 55, tolerance: 0 },
    },
    {
      key: "wfree",
      rung: "apply",
      prompt: <p>Why can a stage delay W but not B?</p>,
      answer: {
        kind: "choice",
        options: [
          "The previous stage is waiting for B's input gradient, while W's weight gradient is needed only by the optimiser at the end of the step",
          "W is cheaper than B",
          "B must run before the next forward pass on the same stage",
          "W needs the next stage's weights",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def deps(op, p):
    kind, s, j = op
    if kind == 'F':
        return [('F', s - 1, j)] if s else []
    if kind == 'B':                                  # gradient with respect to the stage's input
        return [('B', s + 1, j)] if s < p - 1 else [('F', s, j)]
    return [('B', s, j)]                             # W, the weight gradient, feeds nothing downstream

def greedy_pipeline(p, m, dur, limits):
    done, free, live = {}, [0.0] * p, [0] * p
    todo = {(k, s, j) for k in dur for s in range(p) for j in range(m)}
    while todo:
        best = None
        for op in todo:
            kind, s, j = op
            ds = deps(op, p)
            if any(d not in done for d in ds) or (kind == 'F' and live[s] >= limits[s]):
                continue
            start = max([free[s]] + [done[d] for d in ds])
            key = (start, 'BFW'.index(kind), j, s)   # earliest start; then B, F, W
            if best is None or key < best[0]:
                best = (key, op)
        key, op = best
        done[op] = key[0] + dur[op[0]]
        free[op[1]] = done[op]
        todo.remove(op)
        live[op[1]] += {'F': 1, 'B': 0, 'W': -1}[op[0]]   # activations live from F until W
    return max(done.values())

def bubble_of(end, m, dur):
    return 1 - m * sum(dur.values()) / end           # every stage does the same work

dur = {'F': 1, 'B': 1, 'W': 1}
print(deps(('B', 1, 0), 3), deps(('W', 2, 1), 3), greedy_pipeline(2, 2, dur, [2, 2]), greedy_pipeline(2, 2, {'F': 1, 'B': 2, 'W': 0}, [2, 1]), round(bubble_of(7.0, 2, dur), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('B', 2, 0)] [('B', 2, 1)] 7.0 9.0 0.1429",
          "[('F', 1, 0)] [('B', 2, 1)] 7.0 9.0 0.1429",
          "[('B', 2, 0)] [('B', 2, 1)] 9.0 9.0 0.1429",
          "[('B', 2, 0)] [('B', 2, 1)] 6.0 9.0 0.0",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bubble_interleaved(p, m, v):
    return (p - 1) / (v * m + p - 1)                 # v = 1 is plain 1F1B

def interleaved_time(p, m, v, f, b):
    return (m + (p - 1) / v) * (f + b)               # f and b for a whole device, all v chunks

def zb_lower_bound(p, m, f, b, w):
    last = (p - 1) * f + m * (f + b + w)             # the last stage cannot start earlier
    first = (p - 1) * (f + b) + m * (f + b) + w      # nor can stage 0 finish its final B and W
    return max(last, first)

x = bubble_interleaved(4, 4, 1)
print(round(x, 4), bubble_interleaved(4, 4, 3), interleaved_time(4, 4, 3, 1.0, 2.0), zb_lower_bound(4, 8, 1, 1, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.4286 0.2 15.0 27", "0.4286 0.0667 15.0 27", "0.4286 0.2 21.0 27", "0.4286 0.2 15.0 23"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>deps(op, p)</C> for ops (kind, stage, micro-batch) with kinds F, B and W; <C>greedy_pipeline(p, m, dur, limits)</C>,
          which repeatedly runs the ready op with the earliest start, breaking ties by B, F, W, then micro-batch, then stage, allows an
          F on stage s only while fewer than limits[s] of its forwards await their W, and returns the step time; and{" "}
          <C>bubble_of(end, m, dur)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def deps(op, p):
    return []

def greedy_pipeline(p, m, dur, limits):
    return m * sum(dur.values())

def bubble_of(end, m, dur):
    return 0.0
`,
        solution: GREEDY,
        tests: [
          { name: "deps", code: `assert deps(('F', 0, 3), 4) == [] and deps(('F', 2, 3), 4) == [('F', 1, 3)]\nassert deps(('B', 3, 1), 4) == [('F', 3, 1)] and deps(('W', 0, 2), 4) == [('B', 0, 2)]\nassert abs(bubble_of(10.0, 2, {'F': 1, 'B': 2, 'W': 1}) - 0.2) < 1e-12` },
          { name: "greedy", code: `assert greedy_pipeline(3, 4, {'F': 2, 'B': 2, 'W': 1}, [3, 2, 1]) == 28\nassert greedy_pipeline(4, 8, {'F': 1, 'B': 2, 'W': 0}, [4, 3, 2, 1]) == 33 and greedy_pipeline(1, 3, {'F': 1, 'B': 1, 'W': 1}, [1]) == 9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bubble_interleaved(p, m, v)</C>; <C>interleaved_time(p, m, v, f, b)</C> with f and b for a device&apos;s whole
          share of the model; and <C>zb_lower_bound(p, m, f, b, w)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bubble_interleaved(p, m, v):
    return (p - 1) / (m + p - 1)

def interleaved_time(p, m, v, f, b):
    return m * (f + b)

def zb_lower_bound(p, m, f, b, w):
    return m * (f + b + w)
`,
        solution: BOUNDS,
        tests: [
          { name: "interleaved", code: `assert bubble_interleaved(5, 4, 1) == 0.5 and abs(bubble_interleaved(5, 4, 2) - 1 / 3) < 1e-12\nassert interleaved_time(5, 4, 2, 1.0, 1.0) == 12.0` },
          { name: "bound", code: `assert zb_lower_bound(3, 6, 1, 1, 1) == 20 and zb_lower_bound(6, 2, 1, 2, 1) == 22` },
        ],
      },
    },
    {
      key: "which",
      rung: "stretch",
      prompt: (
        <p>
          A pipeline has 8 stages and only 4 micro-batches, with F taking 1 ms, B 2 ms and W 0.5 ms per stage. What is the smallest step
          time, in ms, that any schedule could achieve?
        </p>
      ),
      answer: { kind: "numeric", value: 33.5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every scheme so far gives each GPU the same layers for every token. Mixture-of-experts models send each token to a few of many
        experts, which places the experts on different GPUs and needs a new collective: the next section dispatches tokens with
        all-to-all.
      </p>
    </>
  ),
};
