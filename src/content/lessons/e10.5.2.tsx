import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OneFOneBViz } from "@/components/viz/OneFOneBViz";
import type { LessonContent } from "@/lib/types";

const ORDER = `def onef1b_order(p, s, m):
    warm = min(p - s, m)                             # forwards before the first backward
    order = [('F', j) for j in range(warm)]
    for j in range(m - warm):                        # steady state: one backward, one forward
        order += [('B', j), ('F', warm + j)]
    order += [('B', j) for j in range(m - warm, m)]  # cool-down
    return order

def simulate(orders, f, b):
    p, T, pos = len(orders), {}, [0] * len(orders)
    free = [0.0] * p
    while any(pos[s] < len(orders[s]) for s in range(p)):
        for s in range(p):
            if pos[s] == len(orders[s]):
                continue
            kind, j = orders[s][pos[s]]
            if kind == 'F':
                dep = (s - 1, 'F', j) if s else None
            else:
                dep = (s + 1, 'B', j) if s < p - 1 else (s, 'F', j)
            if dep is not None and dep not in T:
                continue                             # the input has not arrived yet
            start = max(free[s], T[dep][1] if dep else 0.0)
            free[s] = start + (f[s] if kind == 'F' else b[s])
            T[(s, kind, j)] = (start, free[s])
            pos[s] += 1
    return T

def max_inflight(order):
    live = peak = 0
    for kind, _ in order:
        live += 1 if kind == 'F' else -1             # activations kept from forward until backward
        peak = max(peak, live)
    return peak`;

const FIT = `def inflight(p, m, s, schedule):
    return m if schedule == 'gpipe' else min(p - s, m)

def stage_peak_gb(p, m, s, act_gb, schedule):
    return inflight(p, m, s, schedule) * act_gb

def largest_mb(p, G, budget_gb, seq_gb, schedule):
    best = 0
    for mb in range(1, G + 1):
        if G % mb == 0 and stage_peak_gb(p, G // mb, 0, mb * seq_gb, schedule) <= budget_gb:
            best = mb                                # stage 0 holds the most
    return best`;

export const lesson: LessonContent = {
  id: "e10.5.2",
  minutes: 45,
  links: {
    requires: ["e10.5.1"],
    revisits: ["e6.4.3", "e7.6.2"],
    foreshadows: ["e10.5.3", "e10.7.1"],
  },

  puzzle: (
    <>
      <p>
        GPipe&apos;s bubble shrinks as the number of micro-batches m grows, but its activation memory grows with m, so memory caps m
        and therefore the efficiency. Is there an order of the same forward and backward passes that keeps the short step but holds
        only a few micro-batches at a time?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A micro-batch&apos;s activations can be freed as soon as its backward pass has run on that stage. So run a backward as soon as
        one is available: after a short warm-up, each stage alternates one forward and one backward. The first stage needs p forwards
        in flight before the first gradient returns from the last stage, and after that every new forward is paired with a backward
        that frees a slot. The step takes the same time as GPipe; only the order changed.
      </p>
      <OneFOneBViz />
    </>
  ),

  theory: (
    <>
      <Definition title="one-forward-one-backward">
        <p>
          Stage s of p runs <M>{"w = \\min(p - s, m)"}</M> warm-up forwards, then m − w pairs of one backward and one forward, then w
          cool-down backwards (<C>onef1b_order</C>). Given each stage&apos;s order, a forward waits for the previous stage&apos;s
          forward of the same micro-batch and a backward for the next stage&apos;s backward (<C>simulate</C>). The micro-batches in flight
          are those whose forward has run on the stage and whose backward has not (<C>max_inflight</C>).
        </p>
        <Code>{ORDER}</Code>
      </Definition>

      <Theorem title="same bubble, bounded memory">
        <p>
          With equal stages and <M>{"m \\ge p"}</M>, the 1F1B schedule takes <M>{"(m + p - 1)(f + b)"}</M>, the same as GPipe, and
          stage s holds at most <M>{"p - s"}</M> micro-batches&apos; activations instead of m.
        </p>
      </Theorem>
      <Proof>
        <p>
          The count in flight rises by one per forward and falls by one per backward. The warm-up adds w, and each steady-state pair
          removes one and adds one, so the peak is w = p − s. For the time: the last stage runs F, B, F, B, … with no gaps after its
          first forward at <M>{"(p-1)f"}</M>, finishing its m backwards at <M>{"(p-1)f + m(f+b)"}</M>; the gradient of the last
          micro-batch then takes <M>{"(p-1)b"}</M> to reach stage 0. The total is <M>{"(m + p - 1)(f + b)"}</M>. The work per stage is
          unchanged, so the bubble is too.
        </p>
      </Proof>

      <Theorem title="what the memory buys">
        <p>
          With the pipeline&apos;s share of the global batch fixed at G sequences, a micro-batch of size <M>{"\\mu"}</M> gives{" "}
          <M>{"m = G/\\mu"}</M>. Stage 0 holds <M>{"\\min(p, m)\\,\\mu"}</M> sequences under 1F1B and G under GPipe, so 1F1B fits
          micro-batches up to the largest with <M>{"p\\mu a \\le"}</M> budget, regardless of G, while GPipe must fit the whole of G
          or recompute.
        </p>
      </Theorem>
      <Proof>
        <p>
          Substitute the in-flight counts into the stage-0 memory, <M>{"\\min(p, m)\\,\\mu a"}</M> or <M>{"m\\mu a = Ga"}</M>, and
          search the divisors of G (<C>largest_mb</C>). Under GPipe the micro-batch size does not appear, so no choice of it helps.
        </p>
        <Code>{FIT}</Code>
      </Proof>

      <Remark title="imbalance across stages">
        <p>
          Stage 0 holds p micro-batches and the last stage one, so the first stage runs out of memory first. Implementations place a
          layer or two fewer on the first stage, or recompute activations there only (e6.4.3). The embedding sits on the first stage and
          the output layer and loss on the last, which also shifts the balance; e7.6.2 gives the activation sizes to weigh.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Yes: the same operations, ordered so that each stage runs a backward as soon as one is available, keep the step time of GPipe
          and bound the in-flight micro-batches by the number of stages. Memory then no longer limits m, which can grow until the bubble
          is small; what limits it is the global batch and the efficiency of small micro-batches. The bubble itself is the next
          target.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "stage5",
      rung: "check",
      prompt: (
        <p>
          A pipeline of 8 stages runs 32 micro-batches with 1F1B, each micro-batch needing 2.5 GB of activations on a stage. How many
          gigabytes does stage 5 (counting from 0) hold at the peak?
        </p>
      ),
      answer: { kind: "numeric", value: 7.5, tolerance: 0.001 },
    },
    {
      key: "largest",
      rung: "check",
      prompt: (
        <p>
          A 4-stage pipeline processes 64 sequences per step under 1F1B. Each sequence needs 0.9 GB of activations on a stage and stage
          0 has 30 GB for them. What is the largest micro-batch, dividing 64, that fits?
        </p>
      ),
      answer: { kind: "numeric", value: 8, tolerance: 0 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>Why does stage 0 need exactly p micro-batches in flight before its first backward?</p>,
      answer: {
        kind: "choice",
        options: [
          "The first gradient returns only after that micro-batch has gone forward through all p stages and back, during which stage 0 keeps starting new forwards",
          "Each stage must hold one micro-batch per other stage for the all-reduce",
          "The optimiser needs p micro-batches before stepping",
          "Backward passes take p times longer than forward passes",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def onef1b_order(p, s, m):
    warm = min(p - s, m)                             # forwards before the first backward
    order = [('F', j) for j in range(warm)]
    for j in range(m - warm):                        # steady state: one backward, one forward
        order += [('B', j), ('F', warm + j)]
    order += [('B', j) for j in range(m - warm, m)]  # cool-down
    return order

def simulate(orders, f, b):
    p, T, pos = len(orders), {}, [0] * len(orders)
    free = [0.0] * p
    while any(pos[s] < len(orders[s]) for s in range(p)):
        for s in range(p):
            if pos[s] == len(orders[s]):
                continue
            kind, j = orders[s][pos[s]]
            if kind == 'F':
                dep = (s - 1, 'F', j) if s else None
            else:
                dep = (s + 1, 'B', j) if s < p - 1 else (s, 'F', j)
            if dep is not None and dep not in T:
                continue                             # the input has not arrived yet
            start = max(free[s], T[dep][1] if dep else 0.0)
            free[s] = start + (f[s] if kind == 'F' else b[s])
            T[(s, kind, j)] = (start, free[s])
            pos[s] += 1
    return T

def max_inflight(order):
    live = peak = 0
    for kind, _ in order:
        live += 1 if kind == 'F' else -1             # activations kept from forward until backward
        peak = max(peak, live)
    return peak

o = [onef1b_order(2, s, 3) for s in range(2)]
print(o[0], simulate(o, [1, 1], [2, 2])[(0, 'B', 0)], [max_inflight(x) for x in o])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[('F', 0), ('F', 1), ('B', 0), ('F', 2), ('B', 1), ('B', 2)] (4.0, 6.0) [2, 1]",
          "[('F', 0), ('F', 1), ('F', 2), ('B', 0), ('B', 1), ('B', 2)] (4.0, 6.0) [3, 1]",
          "[('F', 0), ('F', 1), ('B', 0), ('F', 2), ('B', 1), ('B', 2)] (3.0, 5.0) [2, 1]",
          "[('F', 0), ('F', 1), ('B', 0), ('F', 2), ('B', 1), ('B', 2)] (4.0, 6.0) [2, 2]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def inflight(p, m, s, schedule):
    return m if schedule == 'gpipe' else min(p - s, m)

def stage_peak_gb(p, m, s, act_gb, schedule):
    return inflight(p, m, s, schedule) * act_gb

def largest_mb(p, G, budget_gb, seq_gb, schedule):
    best = 0
    for mb in range(1, G + 1):
        if G % mb == 0 and stage_peak_gb(p, G // mb, 0, mb * seq_gb, schedule) <= budget_gb:
            best = mb                                # stage 0 holds the most
    return best

x = inflight(4, 16, 1, '1f1b')
print(x, inflight(4, 16, 1, 'gpipe'), stage_peak_gb(4, 2, 0, 3.0, '1f1b'), largest_mb(4, 64, 30, 0.9, 'gpipe'))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 16 6.0 0", "4 16 6.0 0", "3 16 12.0 0", "3 16 6.0 1"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>onef1b_order(p, s, m)</C>, stage s&apos;s list of (&apos;F&apos; or &apos;B&apos;, micro-batch);{" "}
          <C>simulate(orders, f, b)</C>, mapping (stage, kind, micro-batch) to (start, end) when each stage follows its order; and{" "}
          <C>max_inflight(order)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def onef1b_order(p, s, m):
    return [('F', j) for j in range(m)] + [('B', j) for j in range(m)]

def simulate(orders, f, b):
    return {}

def max_inflight(order):
    return len(order)
`,
        solution: ORDER,
        tests: [
          { name: "order", code: `assert onef1b_order(3, 0, 2) == [('F', 0), ('F', 1), ('B', 0), ('B', 1)]\nassert onef1b_order(3, 2, 3) == [('F', 0), ('B', 0), ('F', 1), ('B', 1), ('F', 2), ('B', 2)]\nassert max_inflight([('F', 0), ('F', 1), ('B', 0), ('F', 2)]) == 2` },
          { name: "simulate", code: `orders = [[('F', j) for j in range(5)] + [('B', j) for j in range(5)] for _ in range(3)]\nT = simulate(orders, [1, 1, 1], [2, 2, 2])\nassert max(e for _, e in T.values()) == 21 and T[(2, 'B', 0)] == (7, 9) and T[(0, 'F', 4)] == (4, 5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inflight(p, m, s, schedule)</C> for schedule &apos;gpipe&apos; or &apos;1f1b&apos;;{" "}
          <C>stage_peak_gb(p, m, s, act_gb, schedule)</C>; and <C>largest_mb(p, G, budget_gb, seq_gb, schedule)</C>, the largest
          micro-batch dividing G whose stage-0 activations fit, or 0.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def inflight(p, m, s, schedule):
    return m

def stage_peak_gb(p, m, s, act_gb, schedule):
    return act_gb

def largest_mb(p, G, budget_gb, seq_gb, schedule):
    return 1
`,
        solution: FIT,
        tests: [
          { name: "inflight", code: `assert inflight(6, 4, 1, '1f1b') == 4 and inflight(6, 20, 4, '1f1b') == 2 and inflight(6, 20, 4, 'gpipe') == 20\nassert stage_peak_gb(6, 20, 0, 1.5, '1f1b') == 9.0` },
          { name: "largest", code: `assert largest_mb(2, 12, 10, 1.0, '1f1b') == 4 and largest_mb(2, 12, 10, 1.0, 'gpipe') == 0\nassert largest_mb(2, 12, 12, 1.0, '1f1b') == 12` },
        ],
      },
    },
    {
      key: "uneven",
      rung: "stretch",
      prompt: (
        <p>
          A 1F1B pipeline has three stages and four micro-batches. The outer stages take 1 ms forward and 2 ms backward; the middle
          stage takes 2 ms and 4 ms. How many milliseconds does the step take?
        </p>
      ),
      answer: { kind: "numeric", value: 28, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        1F1B fixes memory but leaves the bubble at <M>{"(p-1)/(m+p-1)"}</M>. The next lesson shrinks it, first by giving each GPU
        several thin stages, then by splitting the backward pass so its two halves can fill the gaps.
      </p>
    </>
  ),
};
