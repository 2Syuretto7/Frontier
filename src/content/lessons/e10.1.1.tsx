import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DeviceMemoryViz } from "@/components/viz/DeviceMemoryViz";
import type { LessonContent } from "@/lib/types";

const DEVICE = `def state_bytes(P, t, p, d, zero):
    n = P / (t * p)                               # parameters held by one GPU's model shard
    weights = 2 * n / (d if zero >= 3 else 1)     # bf16
    grads = 2 * n / (d if zero >= 2 else 1)       # bf16
    optim = 12 * n / (d if zero >= 1 else 1)      # fp32 master weights and two Adam moments
    return weights + grads + optim

def act_per_layer(s, b, h, a, t, sp, recompute):
    if recompute == "full":
        return 2 * s * b * h / (t if sp else 1)   # only the layer input is kept
    score = 0 if recompute == "selective" else 5 * a * s / h
    if sp:
        return s * b * h * (34 + score) / t
    return s * b * h * (10 + (24 + score) / t)

def first_stage_bytes(P, L, s, b, h, a, t, p, d, zero, sp, recompute):
    # 1F1B: the first stage owns L/p layers and holds p micro-batches in flight
    return state_bytes(P, t, p, d, zero) + (L / p) * p * act_per_layer(s, b, h, a, t, sp, recompute)`;

const STAGES = `def inflight(p, i):
    return p - i                                  # 1F1B, with at least p micro-batches per step

def stage_act_bytes(L, p, i, act_layer):
    return (L // p) * inflight(p, i) * act_layer

def max_microbatch(budget, state, L, act_layer_per_sample, reserve):
    return int((budget - reserve - state) // (L * act_layer_per_sample))`;

export const lesson: LessonContent = {
  id: "e10.1.1",
  minutes: 50,
  links: {
    requires: ["e7.6.2", "e6.4.4"],
    revisits: ["e7.6.1"],
    foreshadows: ["e10.3.1", "e10.4.2", "e10.5.2"],
  },

  puzzle: (
    <>
      <p>
        A 70B-parameter model needs over a terabyte for its weights, gradients and Adam state alone, and its activations for a single
        long sequence run to hundreds of gigabytes. Each GPU has 80. Splitting the model across eight pipeline stages divides the
        parameters per GPU by eight, yet the first stage&apos;s activation memory does not fall at all. Which splits reduce which parts
        of memory, and how do you add them up before launching a job that takes a week to fail?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Lessons e6.4.4 and e7.6.2 counted memory on one GPU: 16 bytes per parameter of model state, and activations that depend on
        batch, sequence length, width and recomputation. Distributed training applies several splits at once. Tensor parallelism
        divides every layer&apos;s weights and most of its activations by t; pipeline parallelism gives each GPU only L/p of the
        layers; ZeRO divides model state by the data-parallel degree d. Each split helps some terms and not others, and the pipeline
        schedule decides how many micro-batches of activations a stage must keep at once.
      </p>
      <DeviceMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the parallel configuration">
        <p>
          A job on N GPUs is arranged as <M>{"N = d \\cdot t \\cdot p"}</M>: t-way tensor parallelism inside each layer, p pipeline
          stages of L/p layers each, and d data-parallel replicas of the resulting model shard. Each GPU holds{" "}
          <M>{"P/(tp)"}</M> parameters, ignoring embeddings, and ZeRO stage z shards the optimiser state (z &#8805; 1), the gradients
          (z &#8805; 2) and the weights (z = 3) of that shard over the d replicas.
        </p>
      </Definition>

      <Theorem title="model state per GPU">
        <p>With mixed-precision Adam, the model state on each GPU is</p>
        <MD>{"\\frac{P}{tp}\\Bigl(\\frac{2}{d_w} + \\frac{2}{d_g} + \\frac{12}{d_o}\\Bigr) \\text{ bytes},"}</MD>
        <p>
          where <M>{"d_o = d"}</M> if z &#8805; 1, <M>{"d_g = d"}</M> if z &#8805; 2, <M>{"d_w = d"}</M> if z = 3, and each is 1
          otherwise.
        </p>
      </Theorem>
      <Proof>
        <p>
          Tensor and pipeline parallelism partition the parameters: every parameter belongs to exactly one of the tp shards, so a GPU
          holds <M>{"P/(tp)"}</M>. Its replicas in the other d - 1 data-parallel groups hold the same shard. Each of the three
          components, at 2, 2 and 12 bytes per parameter, is either replicated (factor 1) or partitioned among those d replicas (factor
          1/d), according to the ZeRO stage, exactly as in e6.4.4.
        </p>
      </Proof>

      <Definition title="activations per layer">
        <p>
          From e7.6.2, a layer keeps <M>{"sbh(10 + 24/t + 5as/(ht))"}</M> bytes under t-way tensor parallelism, where the 10sbh are
          the layer-norm inputs and dropout masks outside the parallel blocks. Sequence parallelism (e10.4.2) splits those along the
          sequence too, giving <M>{"sbh(34 + 5as/h)/t"}</M>. Selective recomputation drops the <M>{"5as/h"}</M> score term; full
          recomputation keeps only the layer input, 2sbh, split by t under sequence parallelism.
        </p>
        <Code>{DEVICE}</Code>
      </Definition>

      <Theorem title="pipeline stages do not shrink peak activations">
        <p>
          Under the one-forward-one-backward (1F1B) schedule with p stages and at least p micro-batches per step, stage i (counting from
          0) holds activations for at most p - i micro-batches. The first stage therefore stores L/p layers for p micro-batches, the
          activations of all L layers for one micro-batch, whatever p is.
        </p>
      </Theorem>
      <Proof>
        <p>
          In 1F1B, stage i runs p - i forward passes before its first backward pass, and thereafter alternates one forward with one
          backward until the forwards run out (e10.5.2 derives this from the dependencies). Activations of a micro-batch are created by
          its forward pass on the stage and freed by its backward pass there. The count rises to p - i during the warm-up, stays there
          in the alternating phase, since each forward is matched by a backward, and falls in the cool-down. With L/p layers per stage,
          stage 0 holds <M>{"(L/p) \\cdot p = L"}</M> layers&apos; worth for one micro-batch.
        </p>
        <Code>{STAGES}</Code>
      </Proof>

      <Remark title="what each split buys">
        <p>
          Tensor parallelism with sequence parallelism divides both model state and activations by t, but its communication is heavy, so
          t rarely exceeds the GPUs in one server. Pipeline parallelism divides model state by p and leaves first-stage activations
          unchanged, and the stages are unequal: the first holds the most activations, and the first and last also hold the embedding
          and output matrices. ZeRO divides model state by up to d and leaves activations untouched. Recomputation trades compute for
          activations. A plan starts from the first stage&apos;s total and leaves several gigabytes for communication buffers,
          temporaries and allocator fragmentation.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Model state of 70B parameters, 1.12 TB, is divided by tp and by ZeRO; activations are divided by t and by recomputation but
          not by p, because the first stage keeps p micro-batches of its L/p layers. In the figure, eight-way tensor parallelism with
          sequence parallelism, four stages and ZeRO-1 bring the first stage to about 23 GB, while dropping tensor parallelism to two
          ways pushes the total past the budget.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "state",
      rung: "check",
      prompt: (
        <p>
          A 30B-parameter model is trained with mixed-precision Adam, 4-way tensor parallelism, 2 pipeline stages, 16-way data
          parallelism and ZeRO stage 1. How many gigabytes (10⁹ bytes) of model state does each GPU hold? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 17.81, tolerance: 0.01 },
    },
    {
      key: "acts",
      rung: "check",
      prompt: (
        <p>
          A 60-layer model of width 5120 trains on sequences of 8192 tokens, one per micro-batch, with 4-way tensor and sequence
          parallelism and selective recomputation, under 1F1B. How many gigabytes of activations does the first pipeline stage hold at
          its peak? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 21.39, tolerance: 0.01 },
    },
    {
      key: "which",
      rung: "apply",
      prompt: <p>The first pipeline stage runs out of memory, and nearly all of it is activations. Which change helps?</p>,
      answer: {
        kind: "choice",
        options: [
          "Raise the tensor-parallel degree, with sequence parallelism",
          "Double the number of pipeline stages",
          "Move from ZeRO stage 1 to stage 3",
          "Double the number of data-parallel replicas",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def state_bytes(P, t, p, d, zero):
    n = P / (t * p)                               # parameters held by one GPU's model shard
    weights = 2 * n / (d if zero >= 3 else 1)     # bf16
    grads = 2 * n / (d if zero >= 2 else 1)       # bf16
    optim = 12 * n / (d if zero >= 1 else 1)      # fp32 master weights and two Adam moments
    return weights + grads + optim

def act_per_layer(s, b, h, a, t, sp, recompute):
    if recompute == "full":
        return 2 * s * b * h / (t if sp else 1)   # only the layer input is kept
    score = 0 if recompute == "selective" else 5 * a * s / h
    if sp:
        return s * b * h * (34 + score) / t
    return s * b * h * (10 + (24 + score) / t)

def first_stage_bytes(P, L, s, b, h, a, t, p, d, zero, sp, recompute):
    # 1F1B: the first stage owns L/p layers and holds p micro-batches in flight
    return state_bytes(P, t, p, d, zero) + (L / p) * p * act_per_layer(s, b, h, a, t, sp, recompute)

GB = 1e9
print(state_bytes(8e9, 1, 1, 1, 0) / GB, state_bytes(8e9, 2, 2, 4, 1) / GB, state_bytes(8e9, 2, 2, 4, 3) / GB, act_per_layer(1024, 1, 1024, 8, 2, False, "selective") / 2 ** 20, act_per_layer(1024, 1, 1024, 8, 2, True, "full") / 2 ** 20)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["128.0 14.0 8.0 22.0 1.0", "128.0 14.0 11.0 22.0 1.0", "128.0 7.0 8.0 22.0 1.0", "128.0 14.0 8.0 17.0 1.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def inflight(p, i):
    return p - i                                  # 1F1B, with at least p micro-batches per step

def stage_act_bytes(L, p, i, act_layer):
    return (L // p) * inflight(p, i) * act_layer

def max_microbatch(budget, state, L, act_layer_per_sample, reserve):
    return int((budget - reserve - state) // (L * act_layer_per_sample))

acts = [stage_act_bytes(32, 4, i, 1.0) for i in range(4)]
print(acts, inflight(8, 7), max_microbatch(80.0, 20.0, 32, 0.5, 8.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[32.0, 24.0, 16.0, 8.0] 1 3",
          "[8.0, 16.0, 24.0, 32.0] 1 3",
          "[32.0, 32.0, 32.0, 32.0] 1 3",
          "[32.0, 24.0, 16.0, 8.0] 8 3",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>state_bytes(P, t, p, d, zero)</C> by the first theorem; <C>act_per_layer(s, b, h, a, t, sp, recompute)</C> with{" "}
          <C>recompute</C> one of &quot;none&quot;, &quot;selective&quot; and &quot;full&quot;; and{" "}
          <C>first_stage_bytes(P, L, s, b, h, a, t, p, d, zero, sp, recompute)</C> under 1F1B.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def state_bytes(P, t, p, d, zero):
    return 16 * P

def act_per_layer(s, b, h, a, t, sp, recompute):
    return 0

def first_stage_bytes(P, L, s, b, h, a, t, p, d, zero, sp, recompute):
    return 0
`,
        solution: DEVICE,
        tests: [
          { name: "state", code: `assert state_bytes(1e9, 1, 1, 4, 2) == 5.5e9\nassert state_bytes(4e9, 2, 2, 2, 3) == 8e9 and state_bytes(1e9, 1, 1, 8, 0) == 16e9` },
          { name: "activations", code: `assert act_per_layer(2, 1, 4, 1, 1, False, "none") == 292\nassert act_per_layer(2, 1, 4, 1, 2, True, "selective") == 136 and act_per_layer(2, 2, 4, 1, 3, False, "full") == 32\nassert first_stage_bytes(4e9, 8, 2, 1, 4, 1, 2, 2, 2, 3, True, "selective") == 8e9 + 8 * 136` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>inflight(p, i)</C>, the micro-batches stage i holds under 1F1B; <C>stage_act_bytes(L, p, i, act_layer)</C>; and{" "}
          <C>max_microbatch(budget, state, L, act_layer_per_sample, reserve)</C>, the largest whole micro-batch size whose first-stage
          activations fit beside the model state and a reserve.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def inflight(p, i):
    return p

def stage_act_bytes(L, p, i, act_layer):
    return (L // p) * act_layer

def max_microbatch(budget, state, L, act_layer_per_sample, reserve):
    return 1
`,
        solution: STAGES,
        tests: [
          { name: "stages", code: `assert [stage_act_bytes(12, 3, i, 2.0) for i in range(3)] == [24.0, 16.0, 8.0]\nassert inflight(4, 0) == 4 and inflight(4, 3) == 1` },
          { name: "batch", code: `assert max_microbatch(100.0, 30.0, 10, 1.5, 10.0) == 4\nassert max_microbatch(50.0, 10.0, 4, 2.5, 5.0) == 3` },
        ],
      },
    },
    {
      key: "imbalance",
      rung: "stretch",
      prompt: (
        <p>
          Take the model of the second check with 4 pipeline stages, and suppose every stage also holds 17.8125 GB of model state. What
          is the ratio of the first stage&apos;s peak memory to the last stage&apos;s? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.693, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Memory decides what fits; time decides what is worth running. The next lesson counts the FLOPs of a training step across the
        same splits and asks how much of the machine&apos;s peak a configuration can hope to use.
      </p>
    </>
  ),
};
