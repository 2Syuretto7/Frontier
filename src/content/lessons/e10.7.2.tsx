import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MeshSearchViz } from "@/components/viz/MeshSearchViz";
import type { LessonContent } from "@/lib/types";

const SPACE = `def factorizations(N, g):
    out = []
    for tp in range(1, g + 1):
        if g % tp or N % tp:
            continue                                # tensor groups must tile a node
        for pp in range(1, N // tp + 1):
            if (N // tp) % pp == 0:
                out.append((N // (tp * pp), tp, pp))   # (dp, tp, pp)
    return out

def memory_gb(P, L, a, dp, tp, pp, mb):
    states = 4 * P / (tp * pp) / 1e9 + 12 * P / (tp * pp * dp) / 1e9   # bf16 weights and grads; ZeRO-1 Adam
    acts = mb * L * a / tp                          # 1F1B stage 0: pp micro-batches of L/pp layers each
    return states + acts

def feasible(N, g, P, L, a, mb, budget):
    return [m for m in factorizations(N, g) if L % m[2] == 0 and memory_gb(P, L, a, *m, mb) <= budget]`;

const TIME = `def tp_overhead(tp, d, F, bw):
    return 2 * (tp - 1) * F / (9 * d * bw)          # communication over compute, e10.4.1

def pipeline_factor(G, dp, mb, pp):
    m = G // (dp * mb)
    return (m + pp - 1) / m                         # step time over busy time

def mesh_time(P, G, s, N, F, d, dp, tp, pp, mb, bw_tp, bw_dp):
    compute = 6 * P * G * s / (N * F)
    grads = 2 * (dp - 1) / dp * 2 * P / (tp * pp) / bw_dp   # data-parallel all-reduce, not overlapped
    return compute * (1 + tp_overhead(tp, d, F, bw_tp)) * pipeline_factor(G, dp, mb, pp) + grads`;

export const lesson: LessonContent = {
  id: "e10.7.2",
  minutes: 50,
  links: {
    requires: ["e10.7.1", "e10.1.1", "e10.1.2"],
    revisits: ["e10.4.1", "e10.5.2"],
    foreshadows: ["e10.7.3", "e10.8.3"],
  },

  puzzle: (
    <>
      <p>
        Training a 70-billion-parameter model on 512 GPUs, a team must pick the sizes of the data, tensor and pipeline dimensions.
        Dozens of meshes fit in memory, and their speeds differ by a few percent to a few tens of percent, which on a month-long run is
        days. Is there a principled way to choose, short of trying them all on the cluster?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Write down what each dimension costs, using the earlier lessons: weights and optimiser state divided by the dimensions that
        partition them, activations for the micro-batches in flight, tensor-parallel communication in proportion to compute, the
        pipeline bubble, and the data-parallel gradient exchange. Then enumerate every mesh, discard those that do not fit, and rank the
        rest by predicted step time. The model is crude, but the search space is small enough to scan exhaustively, and the ranking is
        usually right about which way to move.
      </p>
      <MeshSearchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the search space">
        <p>
          For N GPUs with g per node, the candidates are the triples (dp, tp, pp) with product N and tp dividing g, so tensor groups
          tile nodes (<C>factorizations</C>); pp must also divide the number of layers L. A mesh is feasible if the per-GPU memory, bf16
          weights and gradients over tp·pp, Adam state also sharded over dp (ZeRO-1), plus activations, fits the budget (
          <C>memory_gb</C>, <C>feasible</C>).
        </p>
        <Code>{SPACE}</Code>
      </Definition>

      <Theorem title="pipeline depth does not reduce peak activations">
        <p>
          Under 1F1B with sequence parallelism, stage 0 holds activations for <M>{"\\mu L a / t"}</M>, where μ is the micro-batch, a
          the activation bytes per sequence per layer and t the tensor-parallel size, whatever the number of stages p.
        </p>
      </Theorem>
      <Proof>
        <p>
          Stage 0 has L/p layers and holds p micro-batches in flight (e10.5.2), each storing <M>{"\\mu a/t"}</M> per layer (e10.4.2).
          The product is <M>{"p \\cdot (L/p) \\cdot \\mu a/t"}</M>, and p cancels. Pipeline depth divides the weights and optimiser
          state, not the activations; tensor parallelism and the micro-batch size are the levers for those.
        </p>
      </Proof>

      <Theorem title="a step-time model">
        <p>
          With C the compute time at full efficiency, the step time is estimated as
        </p>
        <MD>{"T \\approx C\\,(1 + r_{tp})\\,\\frac{m + p - 1}{m} + \\frac{4P}{tp}\\cdot\\frac{d-1}{d}\\cdot\\frac{1}{B_{dp}},"}</MD>
        <p>
          where <M>{"r_{tp} = 2(t-1)F/(9hB_{tp})"}</M> is tensor-parallel communication over compute (e10.4.1, with model width h),
          m = G/(dμ) the micro-batches per pipeline, and the last term an exposed bf16 gradient all-reduce over d replicas.
        </p>
      </Theorem>
      <Proof>
        <p>
          Tensor-parallel communication is not overlapped, so it adds <M>{"r_{tp}C"}</M>. The pipeline stretches busy time by{" "}
          <M>{"(m + p - 1)/m"}</M> (e10.5.1). The gradient all-reduce follows the last backward and sends{" "}
          <M>{"2\\frac{d-1}{d}\\cdot 2P/(tp)"}</M> bytes (e10.7.1). Each term is computed separately (<C>tp_overhead</C>,{" "}
          <C>pipeline_factor</C>, <C>mesh_time</C>).
        </p>
        <Code>{TIME}</Code>
      </Proof>

      <Remark title="what the model ignores">
        <p>
          Small micro-batches and thin tensor shards run matrix kernels less efficiently, which penalises large t and small μ beyond
          what the model says. Gradient all-reduces largely overlap the backward pass (e10.2.2), so the last term is an upper bound.
          Pipeline stages may sit on different nodes and context or expert parallelism add dimensions. Practitioners use such a model to
          prune the search to a handful of meshes and then measure a few steps of each; the measured best is usually among the model&apos;s
          top few.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Enumerate the meshes, keep those that fit, and rank them by the model; then benchmark the top few. The model also explains the
          ranking. More tensor parallelism costs communication in every layer but leaves more data-parallel room for the batch;
          deeper pipelines cost bubble unless each pipeline gets many micro-batches; and more data parallelism splits the batch thinner.
          The global batch size, set by optimisation, decides which of these dominates.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "fit",
      rung: "check",
      prompt: (
        <p>
          A 70-billion-parameter model of 80 layers uses 1.14085 GB of activations per sequence per layer (before dividing by t). On
          the mesh (dp, tp, pp) = (16, 8, 4) with micro-batch 1, how many gigabytes per GPU does the memory model give? Give two
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 21.8, tolerance: 0.01 },
    },
    {
      key: "tpcost",
      rung: "check",
      prompt: (
        <p>
          With model width 8192, 400 TFLOP/s and 450 GB/s, what is <M>{"r_{tp}"}</M> for 4-way tensor parallelism? Give three
          decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.072, tolerance: 0.001 },
    },
    {
      key: "deeper",
      rung: "apply",
      prompt: <p>A mesh runs out of activation memory under 1F1B. Which change does not help?</p>,
      answer: {
        kind: "choice",
        options: [
          "Doubling the number of pipeline stages",
          "Doubling the tensor-parallel size",
          "Halving the micro-batch",
          "Recomputing activations in the backward pass",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def factorizations(N, g):
    out = []
    for tp in range(1, g + 1):
        if g % tp or N % tp:
            continue                                # tensor groups must tile a node
        for pp in range(1, N // tp + 1):
            if (N // tp) % pp == 0:
                out.append((N // (tp * pp), tp, pp))   # (dp, tp, pp)
    return out

def memory_gb(P, L, a, dp, tp, pp, mb):
    states = 4 * P / (tp * pp) / 1e9 + 12 * P / (tp * pp * dp) / 1e9   # bf16 weights and grads; ZeRO-1 Adam
    acts = mb * L * a / tp                          # 1F1B stage 0: pp micro-batches of L/pp layers each
    return states + acts

def feasible(N, g, P, L, a, mb, budget):
    return [m for m in factorizations(N, g) if L % m[2] == 0 and memory_gb(P, L, a, *m, mb) <= budget]

fs = factorizations(8, 2)
print(len(fs), memory_gb(8e9, 4, 1.0, 2, 2, 2, 1), feasible(8, 2, 8e9, 4, 1.0, 1, 30))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "7 22.0 [(2, 1, 4), (4, 2, 1), (2, 2, 2), (1, 2, 4)]",
          "8 22.0 [(2, 1, 4), (4, 2, 1), (2, 2, 2), (1, 2, 4)]",
          "7 20.0 [(2, 1, 4), (4, 2, 1), (2, 2, 2), (1, 2, 4)]",
          "7 22.0 [(2, 1, 4), (2, 2, 2), (1, 2, 4)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tp_overhead(tp, d, F, bw):
    return 2 * (tp - 1) * F / (9 * d * bw)          # communication over compute, e10.4.1

def pipeline_factor(G, dp, mb, pp):
    m = G // (dp * mb)
    return (m + pp - 1) / m                         # step time over busy time

def mesh_time(P, G, s, N, F, d, dp, tp, pp, mb, bw_tp, bw_dp):
    compute = 6 * P * G * s / (N * F)
    grads = 2 * (dp - 1) / dp * 2 * P / (tp * pp) / bw_dp   # data-parallel all-reduce, not overlapped
    return compute * (1 + tp_overhead(tp, d, F, bw_tp)) * pipeline_factor(G, dp, mb, pp) + grads

x = tp_overhead(3, 4, 9.0, 1.0)
print(x, pipeline_factor(64, 4, 2, 3), mesh_time(10, 4, 3, 2, 18.0, 9, 2, 1, 1, 1, 1.0, 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 1.25 40.0", "1.0 1.25 20.0", "1.0 0.8 40.0", "0.5 1.25 40.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>factorizations(N, g)</C>, all (dp, tp, pp) with tp dividing both g and N, ordered by tp then pp;{" "}
          <C>memory_gb(P, L, a, dp, tp, pp, mb)</C>; and <C>feasible(N, g, P, L, a, mb, budget)</C>, keeping meshes whose pp divides
          L and whose memory is within the budget.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def factorizations(N, g):
    return [(N, 1, 1)]

def memory_gb(P, L, a, dp, tp, pp, mb):
    return 0.0

def feasible(N, g, P, L, a, mb, budget):
    return []
`,
        solution: SPACE,
        tests: [
          { name: "factor", code: `assert factorizations(4, 2) == [(4, 1, 1), (2, 1, 2), (1, 1, 4), (2, 2, 1), (1, 2, 2)]\nassert factorizations(6, 4) == [(6, 1, 1), (3, 1, 2), (2, 1, 3), (1, 1, 6), (3, 2, 1), (1, 2, 3)]` },
          { name: "memory", code: `assert memory_gb(1e9, 10, 0.5, 2, 2, 1, 2) == 10.0 and feasible(4, 2, 1e9, 10, 0.5, 2, 10) == [(2, 2, 1), (1, 2, 2)]\nassert feasible(4, 2, 1e9, 3, 0.0, 1, 100) == [(4, 1, 1), (2, 2, 1)]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tp_overhead(tp, d, F, bw)</C> with d the model width; <C>pipeline_factor(G, dp, mb, pp)</C>; and{" "}
          <C>mesh_time(P, G, s, N, F, d, dp, tp, pp, mb, bw_tp, bw_dp)</C>, the step-time model for G sequences of s tokens.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tp_overhead(tp, d, F, bw):
    return 0.0

def pipeline_factor(G, dp, mb, pp):
    return 1.0

def mesh_time(P, G, s, N, F, d, dp, tp, pp, mb, bw_tp, bw_dp):
    return 0.0
`,
        solution: TIME,
        tests: [
          { name: "parts", code: `assert tp_overhead(1, 8, 5.0, 1.0) == 0.0 and abs(tp_overhead(2, 9, 9.0, 1.0) - 2 / 9) < 1e-12\nassert pipeline_factor(30, 3, 2, 5) == 1.8` },
          { name: "time", code: `assert abs(mesh_time(3, 6, 1, 6, 1.0, 4, 3, 2, 1, 1, 1.0, 1.0) - 23.0) < 1e-9` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          For that model (width 8192, 80 layers, 1.14085 GB per sequence per layer) on 512 GPUs with 8 per node and 80 GB each,
          a global batch of 1024 sequences of 4096 tokens, 400 TFLOP/s, 450 GB/s inside nodes and 50 GB/s for gradients, consider every
          feasible mesh with micro-batch 1 or 2 that divides the batch evenly. What is the smallest predicted step time in seconds? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 10.381, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Once a mesh is chosen, every tensor must be told how it is laid out on it. The next lesson describes layouts with sharding
        annotations and lets a compiler insert the collectives.
      </p>
    </>
  ),
};
