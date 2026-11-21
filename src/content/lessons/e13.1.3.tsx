import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ProxyScalingViz } from "@/components/viz/ProxyScalingViz";
import type { LessonContent } from "@/lib/types";

const MEASURE = `import statistics

def steady_step_time(times, warmup):
    return statistics.median(times[warmup:])              # skip compilation and warm-up; resist outliers

def mfu_from_steps(params, tokens_per_step, step_time, gpus, peak):
    return 6 * params * tokens_per_step / (step_time * gpus * peak)

def tokens_per_sec(tokens_per_step, step_time, gpus):
    return tokens_per_step / step_time / gpus              # per GPU, comparable across cluster sizes`;

const EXTRAPOLATE = `def fit_comm(t1, t2):
    return t2 - t1                                         # the ring term B / bandwidth, seen at two nodes

def predict_step(t1, t2, n):
    return t1 + 2 * (n - 1) / n * fit_comm(t1, t2)         # ring all-reduce over n nodes, no overlap

def predicted_efficiency(t1, t2, n):
    return t1 / predict_step(t1, t2, n)                    # weak scaling: same work per node`;

export const lesson: LessonContent = {
  id: "e13.1.3",
  minutes: 45,
  links: {
    requires: ["e13.1.2", "e10.1.2"],
    revisits: ["e10.8.3", "e13.1.1"],
    foreshadows: ["e13.2.1"],
  },

  puzzle: (
    <>
      <p>
        The plan for a two-month run assumed 40% MFU. On the first day of the real run, throughput is a quarter lower
        than planned, and nobody knows whether the cause is the code, the configuration or the cluster. Most of what went
        wrong could have been found in a few hours on a fraction of the machines. What should a proxy run measure, and
        how can measurements on one or two nodes predict what happens on hundreds?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A proxy run is a short run of the real configuration, at full model size or close to it, on a small part of the
        cluster. It answers practical questions before they become expensive: does the job fit in memory with headroom,
        what is the steady-state step time and MFU, does the loss fall as it should for the first few hundred steps, and
        how does the step time grow as nodes are added. Step times must be read carefully, skipping the warm-up and
        resisting outliers, and the growth with node count can be modelled from as few as two measurements.
      </p>
      <ProxyScalingViz />
    </>
  ),

  theory: (
    <>
      <Definition title="measuring throughput">
        <p>
          The first steps of a run include compilation, memory allocation and data loader warm-up, and later steps are
          interrupted occasionally by checkpoints or evaluation. Take the median step time after a warm-up period{" "}
          (<C>steady_step_time</C>). From it, MFU is <M>{"6N \\cdot \\text{tokens per step} / (t \\cdot G \\cdot P)"}</M>{" "}
          (<C>mfu_from_steps</C>), and tokens per second per GPU (<C>tokens_per_sec</C>) is the figure to compare across
          cluster sizes.
        </p>
        <Code>{MEASURE}</Code>
      </Definition>

      <Theorem title="the median resists outliers">
        <p>
          If fewer than half of m measured step times are outliers, of any size, the median lies between the smallest
          and largest clean measurement. The mean has no such guarantee: one outlier can move it arbitrarily far.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"c_{\\max}"}</M> be the largest clean value. The values above <M>{"c_{\\max}"}</M> are all outliers, so
          fewer than m/2 of them; hence at least half the sorted values are at most <M>{"c_{\\max}"}</M>, and both middle
          values, whose average is the median when m is even, are at most <M>{"c_{\\max}"}</M>. The same argument from
          below bounds the median by the smallest clean value. For the mean, replacing one value by x changes the mean by{" "}
          <M>{"(x - x_{\\text{old}})/m"}</M>, unbounded in x. A checkpoint that takes a minute every few hundred steps is
          such an outlier: it belongs in the goodput of e13.1.1, not in the step time.
        </p>
      </Proof>

      <Theorem title="predicting weak scaling from two measurements">
        <p>
          Suppose each node does the same work, the step on one node takes <M>{"t_1"}</M> with no inter-node
          communication, and gradients are all-reduced across n nodes by a ring without overlap, costing{" "}
          <M>{"2\\frac{n-1}{n}T_c"}</M>. Then <M>{"T_c = t_2 - t_1"}</M> (<C>fit_comm</C>), the step time is{" "}
          <M>{"t_n = t_1 + 2\\frac{n-1}{n}T_c"}</M> (<C>predict_step</C>), and the efficiency{" "}
          <M>{"t_1/t_n"}</M> (<C>predicted_efficiency</C>) decreases towards{" "}
        </p>
        <MD>{"\\frac{t_1}{t_1 + 2T_c}."}</MD>
        <Code>{EXTRAPOLATE}</Code>
      </Theorem>
      <Proof>
        <p>
          At n = 2 the ring term is <M>{"2 \\cdot \\tfrac12 T_c = T_c"}</M>, so <M>{"t_2 - t_1 = T_c"}</M>. The factor{" "}
          <M>{"2(n-1)/n"}</M> increases with n towards 2, so <M>{"t_n"}</M> increases towards{" "}
          <M>{"t_1 + 2T_c"}</M> and the efficiency decreases towards its limit. The model ignores latency, which adds{" "}
          <M>{"2(n-1)\\alpha"}</M> and eventually dominates for small messages, overlap of communication with the
          backward pass, which can hide much of <M>{"T_c"}</M>, and stragglers, whose cost grows with n as e10.8.3
          showed. A measured point that falls below the prediction is a signal to investigate, not noise to average
          away.
        </p>
      </Proof>

      <Example title="a proxy checklist">
        <p>
          Run the full configuration on one node, two nodes, and a slice such as 64 nodes, for a few hundred steps each.
          Record peak memory and the headroom left, the steady step time and MFU, the loss over the first steps compared
          with an earlier run, the time to save and to load a checkpoint, and the time to restart from a failure. Compare
          the 64-node step time with the two-point prediction: a large gap usually means a placement or network problem
          that would have cost the whole run.
        </p>
      </Example>

      <Remark title="what proxies cannot show">
        <p>
          A short run cannot show instabilities that appear after tens of thousands of steps, the slow drift in data
          quality across shards, or the failure rate of a large cluster over weeks. Those are what the observability of
          the next chapter is for. Proxy runs at smaller model sizes, the small-scale runs of the scaling ladder, answer
          different questions, about the recipe rather than the machinery, and l8.4.1 and e11.6.3 describe how to read
          them.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "mfu",
      rung: "check",
      prompt: (
        <p>
          A 7-billion-parameter model processes 4 million tokens per step in 1.8 s on 256 GPUs with a peak of{" "}
          <M>{"9.89 \\times 10^{14}"}</M>. What is its MFU? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.3686, tolerance: 0.0005 },
    },
    {
      key: "eff",
      rung: "check",
      prompt: (
        <p>
          A step takes 2.0 s on one node and 2.3 s on two. Under the ring model, what efficiency is predicted at 64 nodes?
          Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.772, tolerance: 0.001 },
    },
    {
      key: "median",
      rung: "apply",
      prompt: <p>Why use the median of steady-state step times rather than the mean of all of them?</p>,
      answer: {
        kind: "choice",
        options: [
          "Warm-up steps and occasional checkpoint or evaluation pauses are outliers that would distort the mean",
          "The median is always smaller than the mean",
          "The mean cannot be computed for step times",
          "The median includes the cost of checkpoints",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import statistics

def steady_step_time(times, warmup):
    return statistics.median(times[warmup:])              # skip compilation and warm-up; resist outliers

def mfu_from_steps(params, tokens_per_step, step_time, gpus, peak):
    return 6 * params * tokens_per_step / (step_time * gpus * peak)

def tokens_per_sec(tokens_per_step, step_time, gpus):
    return tokens_per_step / step_time / gpus              # per GPU, comparable across cluster sizes

times = [5.0, 3.0, 1.0, 1.2, 0.9, 1.1, 9.0]
print(steady_step_time(times, 2), round(mfu_from_steps(1e9, 1e6, 1.0, 16, 1e15), 4), tokens_per_sec(1e6, 0.5, 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.1 0.375 500000.0", "2.6 0.375 500000.0", "1.1 0.0625 500000.0", "1.1 0.375 2000000.0"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def fit_comm(t1, t2):
    return t2 - t1                                         # the ring term B / bandwidth, seen at two nodes

def predict_step(t1, t2, n):
    return t1 + 2 * (n - 1) / n * fit_comm(t1, t2)         # ring all-reduce over n nodes, no overlap

def predicted_efficiency(t1, t2, n):
    return t1 / predict_step(t1, t2, n)                    # weak scaling: same work per node

print(fit_comm(2.0, 2.5), predict_step(2.0, 2.5, 2), predict_step(2.0, 2.5, 4))
print(round(predicted_efficiency(2.0, 2.5, 4), 4), round(predicted_efficiency(2.0, 2.0, 100), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.5 2.5 2.75\n0.7273 1.0", "0.5 3.0 3.5\n0.5714 1.0", "0.5 2.5 2.75\n0.7273 0.5", "0.5 2.5 3.0\n0.6667 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>steady_step_time(times, warmup)</C>, the median after the first warmup steps;{" "}
          <C>mfu_from_steps(params, tokens_per_step, step_time, gpus, peak)</C>; and{" "}
          <C>tokens_per_sec(tokens_per_step, step_time, gpus)</C>, per GPU.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import statistics

def steady_step_time(times, warmup):
    return sum(times) / len(times)

def mfu_from_steps(params, tokens_per_step, step_time, gpus, peak):
    return params * tokens_per_step / (step_time * peak)

def tokens_per_sec(tokens_per_step, step_time, gpus):
    return tokens_per_step / step_time
`,
        solution: MEASURE,
        tests: [
          { name: "median", code: `assert steady_step_time([9, 1, 2, 3], 1) == 2 and steady_step_time([7, 1, 3], 0) == 3 and steady_step_time([5, 1, 2], 1) == 1.5` },
          { name: "rate", code: `assert abs(mfu_from_steps(10, 5, 2, 3, 50) - 1) < 1e-12 and tokens_per_sec(1200, 2, 3) == 200` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fit_comm(t1, t2)</C>, <C>predict_step(t1, t2, n)</C> and <C>predicted_efficiency(t1, t2, n)</C> from the
          ring model above.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def fit_comm(t1, t2):
    return t2

def predict_step(t1, t2, n):
    return t1 * n

def predicted_efficiency(t1, t2, n):
    return 1.0
`,
        solution: EXTRAPOLATE,
        tests: [
          { name: "fit", code: `assert fit_comm(3, 4.5) == 1.5 and abs(predict_step(1, 2, 2) - 2) < 1e-12 and abs(predict_step(1, 2, 8) - 2.75) < 1e-12` },
          { name: "eff", code: `assert abs(predicted_efficiency(1, 2, 8) - 1 / 2.75) < 1e-12 and abs(predicted_efficiency(3, 3, 50) - 1) < 1e-12` },
        ],
      },
    },
    {
      key: "nodes",
      rung: "stretch",
      prompt: (
        <p>
          With the measurements of the second check, at how many nodes does the predicted efficiency first fall below
          0.78?
        </p>
      ),
      answer: { kind: "numeric", value: 17, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Once the main run starts, the proxy&apos;s questions have to be answered continuously. The next chapter is about
        observability, beginning with which metrics are worth logging at every step.
      </p>
    </>
  ),
};
