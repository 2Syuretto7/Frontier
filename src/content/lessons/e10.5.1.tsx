import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GpipeScheduleViz } from "@/components/viz/GpipeScheduleViz";
import type { LessonContent } from "@/lib/types";

const SCHEDULE = `def partition(costs, p):
    n, INF = len(costs), float('inf')
    pre = [0]
    for c in costs:
        pre.append(pre[-1] + c)
    best = [[INF] * (n + 1) for _ in range(p + 1)]   # best[k][i]: first i layers on k stages
    best[0][0] = 0
    for k in range(1, p + 1):
        for i in range(1, n + 1):
            for j in range(k - 1, i):                # the last stage holds layers j .. i-1
                best[k][i] = min(best[k][i], max(best[k - 1][j], pre[i] - pre[j]))
    return best[p][n]                                # the slowest stage's cost

def gpipe_times(f, b, m):
    p, T = len(f), {}
    for s in range(p):                               # all forwards, stage by stage
        for j in range(m):
            start = max(T[(s - 1, 'F', j)][1] if s else 0, T[(s, 'F', j - 1)][1] if j else 0)
            T[(s, 'F', j)] = (start, start + f[s])
    for s in reversed(range(p)):                     # then all backwards, last stage first
        for j in range(m):
            prev = T[(s + 1, 'B', j)][1] if s < p - 1 else T[(s, 'F', m - 1)][1]
            start = max(prev, T[(s, 'B', j - 1)][1] if j else T[(s, 'F', m - 1)][1])
            T[(s, 'B', j)] = (start, start + b[s])
    return T

def bubble(T, p):
    end = max(e for _, e in T.values())
    busy = sum(e - s for s, e in T.values())
    return 1 - busy / (p * end)                      # idle share of all stage-time`;

const BUDGET = `def stage_act_gb(m, act_gb, recompute, boundary_gb):
    if recompute:                                    # keep only each micro-batch's input, rebuild one at a time
        return m * boundary_gb + act_gb
    return m * act_gb                                # GPipe holds every micro-batch until its backward

def p2p_bytes(b, s, d):
    return 2 * b * s * d                             # one bf16 activation across one stage boundary

def choose_m(p, target):
    m = 1
    while (p - 1) / (m + p - 1) > target:            # bubble with equal stages
        m += 1
    return m`;

export const lesson: LessonContent = {
  id: "e10.5.1",
  minutes: 50,
  links: {
    requires: ["e10.1.2", "e7.4.4", "e8.1.2"],
    revisits: ["e6.4.3", "e10.2.3"],
    foreshadows: ["e10.5.2", "e10.5.3"],
  },

  puzzle: (
    <>
      <p>
        Put layers 1 to 20 on one node and 21 to 40 on another, and the only traffic between nodes is one activation per sequence in
        each direction, far less than tensor parallelism sends. But while the second node works on a batch the first has nothing to
        do. Splitting the batch into micro-batches lets the stages work at once. How much idle time is left, what does it cost in
        memory, and how should the layers be divided when they are not all the same?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Pipeline parallelism gives each of p stages a contiguous block of layers. GPipe splits the batch into m micro-batches, runs
        every forward pass through the pipeline, then every backward pass, and applies one optimiser step, so the result equals one
        large batch (e10.2.3). The stages fill up at the start and drain at the end, and the idle triangles they leave are the bubble.
        Its absolute size does not depend on m, so more micro-batches shrink its share; but every micro-batch&apos;s activations are
        kept until the backward passes begin.
      </p>
      <GpipeScheduleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the GPipe schedule">
        <p>
          Stage s runs forward on micro-batch j once stage s − 1 has sent its output and stage s has finished micro-batch j − 1. After
          its last forward, the last stage begins the backward passes; stage s runs backward on j once stage s + 1 has sent the gradient
          and it has finished j − 1 (<C>gpipe_times</C>). The bubble is the idle share of all stage-time (<C>bubble</C>). Layers are
          assigned to stages by choosing cut points that minimise the slowest stage (<C>partition</C>).
        </p>
        <Code>{SCHEDULE}</Code>
      </Definition>

      <Theorem title="the bubble">
        <p>
          With p equal stages, forward time f and backward time b per micro-batch per stage, the GPipe step takes{" "}
          <M>{"(m + p - 1)(f + b)"}</M>, and the bubble is
        </p>
        <MD>{"\\frac{p - 1}{m + p - 1}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Forward of micro-batch j on stage s ends at <M>{"(s + j + 1)f"}</M> by induction on s + j, so the last forward ends at{" "}
          <M>{"(m + p - 1)f"}</M>. The backward phase mirrors it, starting from the last stage and taking{" "}
          <M>{"(m + p - 1)b"}</M>. Each stage is busy for <M>{"m(f + b)"}</M>, so the idle share is{" "}
          <M>{"1 - m/(m + p - 1)"}</M>. With unequal stages the slowest one sets the pace of every micro-batch, and the others wait
          for it, which is why balancing the partition matters as much as m.
        </p>
      </Proof>

      <Theorem title="memory">
        <p>
          A GPipe stage stores the activations of all m micro-batches before the first backward pass. With activation recomputation
          (e6.4.3) it stores only each micro-batch&apos;s input to the stage and rebuilds one micro-batch&apos;s activations at a time:{" "}
          <M>{"m a_{\\text{in}} + a"}</M> instead of <M>{"m a"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          No backward pass starts on a stage before its last forward, and a micro-batch&apos;s activations are freed only by its
          backward, so all m are live together. With recomputation the forward keeps only the input; the backward of each micro-batch
          reruns the stage&apos;s forward from that input, holds its activations while it runs, and frees them before the next (
          <C>stage_act_gb</C>).
        </p>
        <Code>{BUDGET}</Code>
      </Proof>

      <Remark title="what crosses a boundary">
        <p>
          Each micro-batch sends one activation of b·s·d values forward and one gradient of the same size backward per stage boundary (
          <C>p2p_bytes</C>), with point-to-point sends (e8.1.2). That is per boundary, not per layer, which is why pipeline stages can
          sit on different nodes while tensor parallelism stays inside one. The cost is idle time, not bandwidth.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With p stages and m micro-batches, the idle share is <M>{"(p-1)/(m+p-1)"}</M>, so m should be several times p (
          <C>choose_m</C>). Raising m with the global batch fixed means smaller micro-batches, which use the GPU less well, and GPipe
          holds every micro-batch&apos;s activations, so it leans on recomputation. Unequal layers, such as a large output layer on the
          last stage, should be balanced by moving cut points so that the slowest stage is as fast as possible. The next lesson
          reorders the same work to keep far fewer micro-batches in memory.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "cut",
      rung: "check",
      prompt: (
        <p>
          Eight layers cost 4, 2, 3, 5, 1, 6, 2 and 3 ms. Split into three contiguous stages, what is the smallest possible time of the
          slowest stage, in ms?
        </p>
      ),
      answer: { kind: "numeric", value: 11, tolerance: 0 },
    },
    {
      key: "stash",
      rung: "check",
      prompt: (
        <p>
          A GPipe stage processes 16 micro-batches, each needing 3 GB of activations, with an input of 0.05 GB. With recomputation,
          how many gigabytes of activations does the stage hold at the peak?
        </p>
      ),
      answer: { kind: "numeric", value: 3.8, tolerance: 0.001 },
    },
    {
      key: "more",
      rung: "apply",
      prompt: <p>With the global batch fixed, what is the drawback of raising the number of micro-batches to shrink the bubble?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each micro-batch gets smaller, so the GPU runs less efficiently, and GPipe stores activations for more of them",
          "The bubble grows in absolute time",
          "Stages must communicate more bytes per step in total",
          "The gradient is no longer that of the full batch",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def partition(costs, p):
    n, INF = len(costs), float('inf')
    pre = [0]
    for c in costs:
        pre.append(pre[-1] + c)
    best = [[INF] * (n + 1) for _ in range(p + 1)]   # best[k][i]: first i layers on k stages
    best[0][0] = 0
    for k in range(1, p + 1):
        for i in range(1, n + 1):
            for j in range(k - 1, i):                # the last stage holds layers j .. i-1
                best[k][i] = min(best[k][i], max(best[k - 1][j], pre[i] - pre[j]))
    return best[p][n]                                # the slowest stage's cost

def gpipe_times(f, b, m):
    p, T = len(f), {}
    for s in range(p):                               # all forwards, stage by stage
        for j in range(m):
            start = max(T[(s - 1, 'F', j)][1] if s else 0, T[(s, 'F', j - 1)][1] if j else 0)
            T[(s, 'F', j)] = (start, start + f[s])
    for s in reversed(range(p)):                     # then all backwards, last stage first
        for j in range(m):
            prev = T[(s + 1, 'B', j)][1] if s < p - 1 else T[(s, 'F', m - 1)][1]
            start = max(prev, T[(s, 'B', j - 1)][1] if j else T[(s, 'F', m - 1)][1])
            T[(s, 'B', j)] = (start, start + b[s])
    return T

def bubble(T, p):
    end = max(e for _, e in T.values())
    busy = sum(e - s for s, e in T.values())
    return 1 - busy / (p * end)                      # idle share of all stage-time

T = gpipe_times([1, 1], [2, 2], 2)
print(partition([1, 2, 3], 2), max(e for _, e in T.values()), round(bubble(T, 2), 4), T[(1, 'B', 0)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 9 0.3333 (3, 5)", "3 9 0.3333 (4, 6)", "4 9 0.3333 (3, 5)", "3 9 0.25 (3, 5)"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def stage_act_gb(m, act_gb, recompute, boundary_gb):
    if recompute:                                    # keep only each micro-batch's input, rebuild one at a time
        return m * boundary_gb + act_gb
    return m * act_gb                                # GPipe holds every micro-batch until its backward

def p2p_bytes(b, s, d):
    return 2 * b * s * d                             # one bf16 activation across one stage boundary

def choose_m(p, target):
    m = 1
    while (p - 1) / (m + p - 1) > target:            # bubble with equal stages
        m += 1
    return m

x = stage_act_gb(4, 2.0, False, 0.1)
print(x, stage_act_gb(4, 2.0, True, 0.1), p2p_bytes(2, 1024, 4096), choose_m(4, 0.2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["8.0 2.4 16777216 12", "8.0 0.4 16777216 12", "8.0 2.4 8388608 12", "8.0 2.4 16777216 15"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>partition(costs, p)</C>, the smallest possible slowest-stage cost over contiguous splits into p stages;{" "}
          <C>gpipe_times(f, b, m)</C>, a dictionary from (stage, &apos;F&apos; or &apos;B&apos;, micro-batch) to (start, end), with
          per-stage times f and b; and <C>bubble(T, p)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def partition(costs, p):
    return max(costs)

def gpipe_times(f, b, m):
    return {}

def bubble(T, p):
    return 0.0
`,
        solution: SCHEDULE,
        tests: [
          { name: "partition", code: `assert partition([1, 1, 1, 1], 2) == 2 and partition([5, 1, 1, 1], 2) == 5 and partition([3, 1, 4, 1, 5], 3) == 5` },
          { name: "schedule", code: `T = gpipe_times([1, 1, 1], [2, 2, 2], 4)\nassert max(e for _, e in T.values()) == 18 and T[(0, 'F', 3)] == (3, 4) and T[(2, 'B', 0)] == (6, 8)\nassert abs(bubble(T, 3) - 1 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>stage_act_gb(m, act_gb, recompute, boundary_gb)</C>, a GPipe stage&apos;s peak activation memory;{" "}
          <C>p2p_bytes(b, s, d)</C>, the bytes of one bf16 activation crossing a boundary; and <C>choose_m(p, target)</C>, the fewest
          micro-batches with a bubble at most target on equal stages.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def stage_act_gb(m, act_gb, recompute, boundary_gb):
    return act_gb

def p2p_bytes(b, s, d):
    return b * s * d

def choose_m(p, target):
    return p
`,
        solution: BUDGET,
        tests: [
          { name: "memory", code: `assert stage_act_gb(10, 1.5, False, 0.2) == 15.0 and abs(stage_act_gb(10, 1.5, True, 0.2) - 3.5) < 1e-12\nassert p2p_bytes(1, 2, 3) == 12` },
          { name: "micro", code: `assert choose_m(1, 0.0) == 1 and choose_m(5, 0.1) == 36 and choose_m(2, 0.5) == 1` },
        ],
      },
    },
    {
      key: "slow",
      rung: "stretch",
      prompt: (
        <p>
          A GPipe pipeline has four stages and eight micro-batches. The first three stages take 1 ms forward and 2 ms backward per
          micro-batch; the last, which holds the output layer, takes 1.5 ms and 3 ms. How many milliseconds does the step take?
        </p>
      ),
      answer: { kind: "numeric", value: 45, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        GPipe keeps every micro-batch alive until the backward passes begin. The next lesson starts each micro-batch&apos;s backward as
        soon as it can, so a stage holds at most p micro-batches whatever m is, with the same bubble.
      </p>
    </>
  ),
};
