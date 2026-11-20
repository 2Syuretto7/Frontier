import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { StepTimeViz } from "@/components/viz/StepTimeViz";
import type { LessonContent } from "@/lib/types";

const FLOPS = `def step_flops(P, tokens, L, s, h, full_recompute):
    model = (6 * P + 12 * L * s * h) * tokens     # weights, plus attention scores and their use
    hardware = model * 4 / 3 if full_recompute else model   # one more forward pass
    return model, hardware

def train_days(N, D, gpus, peak, mfu):
    return 6 * N * D / (gpus * peak * mfu) / 86400

def mfu(model_flops, step_time, gpus, peak):
    return model_flops / (step_time * gpus * peak)`;

const COMM = `def tp_comm_ratio(t, h, peak, bw):
    # four all-reduces of 2bsh bytes per layer against 72bsh^2 / t FLOPs
    return 2 * (t - 1) * peak / (9 * h * bw)

def dp_comm_ratio(d, tokens_per_replica, peak, bw):
    # one gradient all-reduce of 2 bytes per parameter against 6 FLOPs per parameter per token
    return 2 * (d - 1) * peak / (3 * d * tokens_per_replica * bw)

def exposed(comm, window):
    return max(0.0, comm - window)                # what overlap cannot hide`;

export const lesson: LessonContent = {
  id: "e10.1.2",
  minutes: 50,
  links: {
    requires: ["e10.1.1", "e7.6.1"],
    revisits: ["e9.2.4"],
    foreshadows: ["e10.2.2", "e10.4.1", "e10.5.1"],
  },

  puzzle: (
    <>
      <p>
        A training run is planned at 50% of peak: 6 FLOPs per parameter per token, divided by the cluster&apos;s throughput, gives
        three weeks. In practice it reports 28% and takes five. The kernels are as fast as on one GPU. Where did the other 22% go, and
        could the plan have predicted it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        On one GPU a step is compute. Across a thousand, a step is compute plus everything the parallel layout adds: tensor-parallel
        collectives inside every layer, the pipeline bubble while stages wait for each other, and the gradient all-reduce between
        replicas, unless it overlaps the backward pass. Each overhead has a simple model. Their ratios to compute depend on a few
        quantities, the width, the tokens per replica and the link bandwidths, which makes it possible to choose a configuration on
        paper.
      </p>
      <StepTimeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="model FLOPs utilisation">
        <p>
          A training step on T tokens of a model with P parameters, L layers, width h and sequence length s does{" "}
          <M>{"(6P + 12Lsh)T"}</M> model FLOPs: 6 per parameter per token for the forward and backward matrix products (e7.6.1), plus
          the attention scores and their product with the values. Model FLOPs utilisation (MFU) is model FLOPs per second divided by
          the cluster&apos;s peak. Hardware FLOPs utilisation also counts recomputed work; with full recomputation it is 4/3 of MFU. A run
          of D tokens at utilisation u on G GPUs of peak F takes <M>{"6PD/(GFu)"}</M> seconds, ignoring the attention term.
        </p>
        <Code>{FLOPS}</Code>
      </Definition>

      <Theorem title="communication-to-compute ratios">
        <p>
          With 16-bit activations and gradients, ring collectives, peak F and link bandwidth W, and ignoring attention FLOPs:
        </p>
        <ol>
          <li>
            t-way tensor parallelism spends <M>{"2(t-1)F/(9hW)"}</M> seconds communicating per second of computing, independent of
            batch and sequence length;
          </li>
          <li>
            d-way data parallelism with <M>{"T_r"}</M> tokens per replica per step spends{" "}
            <M>{"2(d-1)F/(3dT_rW)"}</M> seconds on the gradient all-reduce per second of computing.
          </li>
        </ol>
      </Theorem>
      <Proof>
        <p>
          A ring all-reduce of n bytes over k devices sends <M>{"2(k-1)n/k"}</M> bytes from each. (1) Megatron tensor parallelism
          (e10.4.1) all-reduces the layer&apos;s <M>{"2bsh"}</M> bytes of activations twice in the forward pass and twice in the
          backward, so each GPU sends <M>{"16(t-1)bsh/t"}</M> bytes per layer. Each GPU computes a 1/t share of the layer&apos;s matrix
          products, <M>{"24bsh^2"}</M> FLOPs forward and twice that backward, so <M>{"72bsh^2/t"}</M>. The ratio of times is{" "}
          <M>{"\\frac{16(t-1)bsh/(tW)}{72bsh^2/(tF)} = \\frac{2(t-1)F}{9hW}"}</M>. (2) A GPU holding n parameters all-reduces 2n bytes
          of gradients over d replicas, sending <M>{"4(d-1)n/d"}</M> bytes, and computes <M>{"6nT_r"}</M> FLOPs. The ratio is{" "}
          <M>{"\\frac{4(d-1)n/(dW)}{6nT_r/F} = \\frac{2(d-1)F}{3dT_rW}"}</M>.
        </p>
        <Code>{COMM}</Code>
      </Proof>

      <Remark title="reading the ratios">
        <p>
          With F = 989 TFLOP/s, h = 8192 and NVLink at 450 GB/s, eight-way tensor parallelism costs about 0.42 seconds per second of
          compute, which matters, and across servers at 50 GB/s it would cost nine times more, which is why t stays within a server.
          The data-parallel ratio falls with tokens per replica, so large batches make the gradient all-reduce small, and it can overlap
          the backward pass (e10.2.2); only what does not fit in that window is exposed. The pipeline bubble adds{" "}
          <M>{"(p-1)/m"}</M> of the busy time for m micro-batches (e10.5.1).
        </p>
      </Remark>

      <Remark title="what MFU leaves out">
        <p>
          Real runs lose more: kernels below their benchmarked speed on small shapes, load imbalance between stages, data loading,
          checkpoints, stragglers and restarts after failures. Measured MFU over a whole run is what plans should use, and 35 to 50% is
          typical for large dense models on recent hardware.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The plan priced only computation. A configuration with exposed tensor-parallel collectives, a pipeline bubble and a gradient
          all-reduce that does not overlap can spend as long on overhead as on compute, as the figure shows; on top come the losses no
          step model sees. Each overhead was predictable from widths, batch sizes and bandwidths.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "days",
      rung: "check",
      prompt: (
        <p>
          An 8B-parameter model is trained on 2 trillion tokens using 512 GPUs with a peak of 989 TFLOP/s each at 40% MFU. Using 6 FLOPs
          per parameter per token, how many days does it take? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 5.49, tolerance: 0.01 },
    },
    {
      key: "tp",
      rung: "check",
      prompt: (
        <p>
          A model of width 6144 uses 4-way tensor parallelism over 450 GB/s links on GPUs with a 989 TFLOP/s peak. By the theorem, how
          many seconds of communication are there per second of computation? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.238, tolerance: 0.001 },
    },
    {
      key: "where",
      rung: "apply",
      prompt: <p>Why is tensor parallelism usually confined to the GPUs of one server?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its communication per FLOP is fixed by the width, so it needs the fast links inside a server",
          "Tensor parallelism cannot be expressed across servers",
          "Servers have too little memory for tensor-parallel shards",
          "Tensor parallelism changes the model's numerical results across servers",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def step_flops(P, tokens, L, s, h, full_recompute):
    model = (6 * P + 12 * L * s * h) * tokens     # weights, plus attention scores and their use
    hardware = model * 4 / 3 if full_recompute else model   # one more forward pass
    return model, hardware

def train_days(N, D, gpus, peak, mfu):
    return 6 * N * D / (gpus * peak * mfu) / 86400

def mfu(model_flops, step_time, gpus, peak):
    return model_flops / (step_time * gpus * peak)

model, hw = step_flops(1e9, 1000, 10, 100, 50, True)
print(round(train_days(1e9, 1e12, 100, 1e15, 0.5), 3), round(model / 1e12, 4), round(hw / 1e12, 4), round(mfu(model, 2.0, 10, 1e12), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.389 6.0006 8.0008 0.3", "1.389 6.0006 12.0012 0.3", "1.389 6.0 8.0 0.3", "0.463 6.0006 8.0008 0.3"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tp_comm_ratio(t, h, peak, bw):
    # four all-reduces of 2bsh bytes per layer against 72bsh^2 / t FLOPs
    return 2 * (t - 1) * peak / (9 * h * bw)

def dp_comm_ratio(d, tokens_per_replica, peak, bw):
    # one gradient all-reduce of 2 bytes per parameter against 6 FLOPs per parameter per token
    return 2 * (d - 1) * peak / (3 * d * tokens_per_replica * bw)

def exposed(comm, window):
    return max(0.0, comm - window)                # what overlap cannot hide

r = tp_comm_ratio(2, 1000, 900.0, 100.0)
print(r, round(dp_comm_ratio(2, 1000, 900.0, 100.0), 4), exposed(5.0, 3.0), exposed(2.0, 3.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.002 0.003 2.0 0.0", "0.002 0.003 2.0 -1.0", "0.004 0.003 2.0 0.0", "0.002 0.006 2.0 0.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>step_flops(P, tokens, L, s, h, full_recompute)</C>, returning (model FLOPs, hardware FLOPs);{" "}
          <C>train_days(N, D, gpus, peak, mfu)</C> with 6 FLOPs per parameter per token; and{" "}
          <C>mfu(model_flops, step_time, gpus, peak)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def step_flops(P, tokens, L, s, h, full_recompute):
    return 6 * P * tokens, 6 * P * tokens

def train_days(N, D, gpus, peak, mfu):
    return 0.0

def mfu(model_flops, step_time, gpus, peak):
    return 1.0
`,
        solution: FLOPS,
        tests: [
          { name: "flops", code: `assert step_flops(2, 10, 1, 1, 1, False) == (240, 240)\nassert step_flops(1e6, 2, 0, 0, 0, True) == (1.2e7, 1.6e7)` },
          { name: "time", code: `assert train_days(1, 86400, 6, 1.0, 1.0) == 1.0\nassert mfu(50.0, 5.0, 2, 10.0) == 0.5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tp_comm_ratio(t, h, peak, bw)</C> and <C>dp_comm_ratio(d, tokens_per_replica, peak, bw)</C> by the theorem, and{" "}
          <C>exposed(comm, window)</C>, the communication time left over when it overlaps a window of computation.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tp_comm_ratio(t, h, peak, bw):
    return 1.0

def dp_comm_ratio(d, tokens_per_replica, peak, bw):
    return 1.0

def exposed(comm, window):
    return comm
`,
        solution: COMM,
        tests: [
          { name: "ratios", code: `assert tp_comm_ratio(1, 100, 9.0, 2.0) == 0 and abs(tp_comm_ratio(3, 100, 9.0, 2.0) - 0.02) < 1e-12\nassert dp_comm_ratio(1, 10, 3.0, 1.0) == 0 and abs(dp_comm_ratio(4, 10, 3.0, 1.0) - 0.15) < 1e-12` },
          { name: "exposed", code: `assert exposed(1.0, 4.0) == 0.0 and exposed(4.0, 1.5) == 2.5` },
        ],
      },
    },
    {
      key: "dp",
      rung: "stretch",
      prompt: (
        <p>
          A job uses 64 data-parallel replicas, each processing 65,536 tokens per step, on GPUs with a 989 TFLOP/s peak and 50 GB/s
          between servers. By the theorem, how many seconds does the gradient all-reduce take per second of computation? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.198, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The simplest of these overheads belongs to data parallelism. The next chapter builds it properly: replicas, the all-reduce, and
        how frameworks hide it behind the backward pass.
      </p>
    </>
  ),
};
