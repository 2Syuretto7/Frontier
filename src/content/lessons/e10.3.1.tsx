import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ZeroStepViz } from "@/components/viz/ZeroStepViz";
import type { LessonContent } from "@/lib/types";

const SHARDED = `import numpy as np

def shard_range(P, n, r):
    s = -(-P // n)                                # equal shards, rounded up; the last one may be short
    return min(r * s, P), min((r + 1) * s, P)

def reduce_scatter(grads):
    n, total = len(grads), np.sum(grads, axis=0)  # one gradient per rank
    return [total[slice(*shard_range(len(total), n, r))] / n for r in range(n)]

def zero_step(w, moms, grads, lr, beta):
    n = len(grads)
    g = reduce_scatter(grads)                     # rank r receives only its slice of the mean gradient
    moms = [beta * m + gr for m, gr in zip(moms, g)]   # and keeps only its slice of momentum
    new = [w[slice(*shard_range(len(w), n, r))] - lr * m for r, m in enumerate(moms)]
    return np.concatenate(new), moms              # all-gather the updated slices`;

const COSTS = `def state_gb(P, n, stage, bucket=0):
    weights = 2 * P / (n if stage >= 3 else 1)    # bf16 weights
    grads = 2 * P / n + 2 * bucket if stage >= 2 else 2 * P   # stage 2 frees each bucket once reduced
    optim = 12 * P / (n if stage >= 1 else 1)     # fp32 master weights and two Adam moments
    return (weights + grads + optim) / 1e9

def comm_elements(P, n, stage):
    return (3 if stage >= 3 else 2) * P * (n - 1) / n   # elements each rank sends per step

def clip_coef(shard_sq_norms, max_norm):
    norm = sum(shard_sq_norms) ** 0.5             # one scalar all-reduce of squared norms
    return min(1.0, max_norm / norm)`;

export const lesson: LessonContent = {
  id: "e10.3.1",
  minutes: 50,
  links: {
    requires: ["e10.2.1", "e6.4.4", "e8.2.2"],
    revisits: ["e10.2.2", "l5.3.2"],
    foreshadows: ["e10.3.2", "e10.8.1"],
  },

  puzzle: (
    <>
      <p>
        With DDP on 64 GPUs, 64 copies of the same Adam moments sit in memory, each updated identically. ZeRO keeps one copy, split
        64 ways, and claims the training is bit-for-bit the same with no extra communication at stages one and two. How can each GPU
        update weights whose optimiser state it does not have, and what has to change in the training loop when it does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An all-reduce is a reduce-scatter followed by an all-gather (e8.2.2). Stop halfway: after the reduce-scatter each rank holds
        the averaged gradient for its own slice of the parameters, which is exactly what it needs to update that slice, provided it
        also keeps that slice&apos;s optimiser state. Then all-gather the updated weights instead of the gradients. The same bytes move,
        but each rank stores optimiser state for 1/N of the model.
      </p>
      <ZeroStepViz />
    </>
  ),

  theory: (
    <>
      <Definition title="flat shards">
        <p>
          The parameters are laid out as one flat vector of P elements and cut into N contiguous shards of{" "}
          <M>{"\\lceil P/N \\rceil"}</M> elements, the last one shorter (<C>shard_range</C>); real implementations pad it so the
          collectives see equal pieces. Rank r owns shard r: it keeps that shard&apos;s fp32 master weights and optimiser moments, and
          after the backward pass receives that shard of the averaged gradient by reduce-scatter (<C>reduce_scatter</C>).
        </p>
        <Code>{SHARDED}</Code>
      </Definition>

      <Theorem title="sharded updates are exact">
        <p>
          If the optimiser acts element by element, as SGD with momentum and Adam do, then updating each shard with its slice of the
          mean gradient and its own slice of state, and all-gathering the results, gives the same weights and the same state as the
          unsharded step (<C>zero_step</C>).
        </p>
      </Theorem>
      <Proof>
        <p>
          The reduce-scatter gives rank r the elements of <M>{"\\frac{1}{N}\\sum_q g_q"}</M> in its range, which are those of the
          all-reduced gradient. An element-wise update of element i reads only the gradient, weight and state at i, so the shard
          owner computes exactly what every rank computed before. Concatenating the shards in order rebuilds the full vector. By
          induction over steps the state slices stay equal to the corresponding slices of the unsharded state.
        </p>
      </Proof>

      <Remark title="what is not element-wise">
        <p>
          Clipping by global gradient norm needs the norm of the whole gradient. Each rank computes the squared norm of its shard, one
          all-reduce of a scalar adds them, and every rank applies the same coefficient (<C>clip_coef</C>, l5.3.2). Optimisers that act
          on whole matrices, such as per-layer trust ratios or orthogonalised updates, need each matrix&apos;s shards brought together
          or the shards cut along matrix boundaries, which is one reason implementations shard per parameter rather than as one flat
          vector.
        </p>
      </Remark>

      <Theorem title="the three stages">
        <p>
          With bf16 weights and gradients and fp32 Adam state (16 bytes per parameter, e6.4.4), the bytes per GPU are{" "}
          <M>{"2P + 2P + 12P/N"}</M> at stage 1, <M>{"2P + 2P/N + 2b + 12P/N"}</M> at stage 2 with a gradient bucket of b elements
          in flight, and <M>{"16P/N"}</M> at stage 3. Each rank sends <M>{"2P(N-1)/N"}</M> elements per step at stages 0 to 2, and{" "}
          <M>{"3P(N-1)/N"}</M> at stage 3.
        </p>
      </Theorem>
      <Proof>
        <p>
          Stage 1 shards only the optimiser state; the full gradient buffer still exists. Stage 2 reduce-scatters each bucket as it
          becomes ready (e10.2.2) and keeps only its own slice of the result, so beyond the shard it needs room only for buckets in
          flight. Stage 3 also shards the bf16 weights, so a layer&apos;s weights must be all-gathered before its forward pass and again
          before its backward pass, since they are freed in between. A ring reduce-scatter and a ring all-gather each send{" "}
          <M>{"(N-1)/N"}</M> of the vector; stages 0 to 2 do one of each, stage 3 adds a second all-gather.
        </p>
        <Code>{COSTS}</Code>
      </Proof>

      <Example title="the puzzle, resolved">
        <p>
          Each GPU updates only the weights in its shard, for which it holds the state, and learns the rest by all-gather. The
          arithmetic is the same element by element, so the result matches DDP. The two collectives that replace the all-reduce move
          the same data. The training loop changes in two places: gradient-norm clipping needs a scalar all-reduce, and checkpoints
          now hold N pieces of optimiser state rather than one copy (e10.8.1).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "clip",
      rung: "check",
      prompt: (
        <p>
          Four ranks report shard squared gradient norms of 4, 9, 12 and 11. With clipping to a global norm of 1.5, what coefficient
          does every rank multiply its gradient shard by?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0.001 },
    },
    {
      key: "stage2",
      rung: "check",
      prompt: (
        <p>
          A 7-billion-parameter model is trained with ZeRO stage 2 on 64 GPUs with buckets of 25 million elements. How many gigabytes of
          model state does each GPU hold? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 15.58, tolerance: 0.01 },
    },
    {
      key: "elementwise",
      rung: "apply",
      prompt: <p>Why can a rank update its shard without seeing the rest of the gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "The optimiser's update of each element reads only that element's gradient, weight and state",
          "The other shards' gradients are zero",
          "Reduce-scatter sends every rank the whole gradient",
          "The update is approximate and the error averages out",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def shard_range(P, n, r):
    s = -(-P // n)                                # equal shards, rounded up; the last one may be short
    return min(r * s, P), min((r + 1) * s, P)

def reduce_scatter(grads):
    n, total = len(grads), np.sum(grads, axis=0)  # one gradient per rank
    return [total[slice(*shard_range(len(total), n, r))] / n for r in range(n)]

def zero_step(w, moms, grads, lr, beta):
    n = len(grads)
    g = reduce_scatter(grads)                     # rank r receives only its slice of the mean gradient
    moms = [beta * m + gr for m, gr in zip(moms, g)]   # and keeps only its slice of momentum
    new = [w[slice(*shard_range(len(w), n, r))] - lr * m for r, m in enumerate(moms)]
    return np.concatenate(new), moms              # all-gather the updated slices

w, grads = np.array([1.0, 2.0, 3.0, 4.0, 5.0]), [np.array([2.0, 0.0, 4.0, 2.0, 6.0]), np.array([0.0, 2.0, 0.0, 2.0, 2.0])]
print(shard_range(5, 2, 1), [g.tolist() for g in reduce_scatter(grads)], zero_step(w, [np.zeros(3), np.zeros(2)], grads, 0.5, 0.9)[0].tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3, 5) [[1.0, 1.0, 2.0], [2.0, 4.0]] [0.5, 1.5, 2.0, 3.0, 3.0]",
          "(2, 5) [[1.0, 1.0], [2.0, 2.0, 4.0]] [0.5, 1.5, 2.0, 3.0, 3.0]",
          "(3, 5) [[2.0, 2.0, 4.0], [4.0, 8.0]] [0.0, 1.0, 1.0, 2.0, 1.0]",
          "(3, 5) [[1.0, 1.0, 2.0], [2.0, 4.0]] [0.5, 1.5, 2.0, 4.0, 5.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def state_gb(P, n, stage, bucket=0):
    weights = 2 * P / (n if stage >= 3 else 1)    # bf16 weights
    grads = 2 * P / n + 2 * bucket if stage >= 2 else 2 * P   # stage 2 frees each bucket once reduced
    optim = 12 * P / (n if stage >= 1 else 1)     # fp32 master weights and two Adam moments
    return (weights + grads + optim) / 1e9

def comm_elements(P, n, stage):
    return (3 if stage >= 3 else 2) * P * (n - 1) / n   # elements each rank sends per step

def clip_coef(shard_sq_norms, max_norm):
    norm = sum(shard_sq_norms) ** 0.5             # one scalar all-reduce of squared norms
    return min(1.0, max_norm / norm)

P = 1e9
print(state_gb(P, 8, 0), state_gb(P, 8, 2), state_gb(P, 8, 3), comm_elements(100, 4, 2), comm_elements(100, 4, 3), clip_coef([3.0, 6.0, 7.0], 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "16.0 3.75 2.0 150.0 225.0 0.5",
          "16.0 3.5 2.0 150.0 225.0 0.5",
          "16.0 3.75 2.0 150.0 150.0 0.5",
          "16.0 3.75 2.0 150.0 225.0 0.125",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shard_range(P, n, r)</C>, rank r&apos;s half-open range with shards of <M>{"\\lceil P/n \\rceil"}</M> elements;{" "}
          <C>reduce_scatter(grads)</C>, each rank&apos;s slice of the mean of the ranks&apos; gradients; and{" "}
          <C>zero_step(w, moms, grads, lr, beta)</C>, an SGD step with momentum <M>{"m \\leftarrow \\beta m + g"}</M>,{" "}
          <M>{"w \\leftarrow w - \\eta m"}</M>, where each rank keeps only its slice of momentum, returning the gathered weights and the
          new momentum slices.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def shard_range(P, n, r):
    return r * (P // n), (r + 1) * (P // n)

def reduce_scatter(grads):
    return list(grads)

def zero_step(w, moms, grads, lr, beta):
    return w, moms
`,
        solution: SHARDED,
        tests: [
          { name: "scatter", code: `assert shard_range(10, 4, 3) == (9, 10) and shard_range(10, 4, 0) == (0, 3)\nassert [g.tolist() for g in reduce_scatter([np.array([1.0, 2.0, 3.0]), np.array([3.0, 2.0, 1.0])])] == [[2.0, 2.0], [2.0]]` },
          { name: "step", code: `rng = np.random.default_rng(0)\nw = rng.normal(size=7); ref_w, ref_m = w.copy(), np.zeros(7)\nmoms = [np.zeros(3), np.zeros(3), np.zeros(1)]\nfor _ in range(3):\n    gs = [rng.normal(size=7) for _ in range(3)]\n    ref_m = 0.9 * ref_m + sum(gs) / 3\n    ref_w = ref_w - 0.1 * ref_m\n    w, moms = zero_step(w, moms, gs, 0.1, 0.9)\nassert np.allclose(w, ref_w) and np.allclose(np.concatenate(moms), ref_m)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>state_gb(P, n, stage, bucket=0)</C>, gigabytes of model state per GPU for mixed-precision Adam;{" "}
          <C>comm_elements(P, n, stage)</C>, elements each rank sends per step; and <C>clip_coef(shard_sq_norms, max_norm)</C>, the
          gradient-norm clipping coefficient from the shards&apos; squared norms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def state_gb(P, n, stage, bucket=0):
    return 16 * P / 1e9

def comm_elements(P, n, stage):
    return 2 * P

def clip_coef(shard_sq_norms, max_norm):
    return max_norm / sum(shard_sq_norms)
`,
        solution: COSTS,
        tests: [
          { name: "memory", code: `assert state_gb(1e9, 4, 0) == 16.0 and state_gb(1e9, 4, 1) == 7.0 and state_gb(1e9, 4, 3) == 4.0\nassert abs(state_gb(1e9, 4, 2, 1e8) - 5.7) < 1e-9` },
          { name: "comm", code: `assert comm_elements(40, 5, 1) == 64.0 and comm_elements(40, 5, 3) == 96.0\nassert clip_coef([1.0, 3.0], 4.0) == 1.0 and abs(clip_coef([9.0, 16.0], 1.0) - 0.2) < 1e-12` },
        ],
      },
    },
    {
      key: "stage3",
      rung: "stretch",
      prompt: (
        <p>
          A 7-billion-parameter model in bf16 is trained on 64 GPUs whose ring collectives run at 50 GB/s per GPU, and none of the
          communication overlaps with compute. How many seconds longer is a step at stage 3 than at stage 2? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.276, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Stage 3 gathers every layer twice per step. The next lesson looks at PyTorch&apos;s fully sharded data parallel, which groups
        layers into units, prefetches the next unit&apos;s weights while the current one computes, and frees them as soon as it can.
      </p>
    </>
  ),
};
