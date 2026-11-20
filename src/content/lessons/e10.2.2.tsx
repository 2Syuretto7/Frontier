import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BucketOverlapViz } from "@/components/viz/BucketOverlapViz";
import type { LessonContent } from "@/lib/types";

const BUCKETS = `def bucketize(sizes, cap):
    buckets, cur, used = [], [], 0
    for i, n in enumerate(sizes):                 # sizes in the order gradients become ready
        if cur and used + n > cap:
            buckets.append(cur)
            cur, used = [], 0
        cur.append(i)
        used += n
    if cur:
        buckets.append(cur)
    return buckets

def ready_times(sizes, T):
    total, t, out = sum(sizes), 0, []
    for n in sizes:                               # the backward pass produces bytes evenly
        t += n
        out.append(T * t / total)
    return out

def bucket_ready(buckets, ready):
    return [max(ready[i] for i in b) for b in buckets]`;

const TIMING = `def allreduce_cost(nbytes, alpha, beta):
    return alpha + beta * nbytes

def finish_time(ready, costs):
    f = 0.0
    for r, c in zip(ready, costs):                # one all-reduce at a time, in order
        f = max(f, r) + c
    return f

def exposed_time(S, T, k, alpha, beta):
    c = allreduce_cost(S / k, alpha, beta)
    return finish_time([j * T / k for j in range(1, k + 1)], [c] * k) - T`;

const TORCH = `model = DDP(model, bucket_cap_mb=25)     # default bucket size
# During loss.backward(), autograd hooks mark each parameter's gradient ready.
# When every gradient in a bucket is ready, DDP launches an asynchronous all-reduce
# for that bucket on a separate CUDA stream and the backward pass continues.
# opt.step() waits for all of them.

with model.no_sync():                    # skip the all-reduce for accumulation steps (e10.2.3)
    model(x1).sum().backward()`;

export const lesson: LessonContent = {
  id: "e10.2.2",
  minutes: 45,
  links: {
    requires: ["e10.2.1", "e8.2.5"],
    revisits: ["e10.1.2", "e6.2.1"],
    foreshadows: ["e10.2.3", "e10.3.2"],
  },

  puzzle: (
    <>
      <p>
        A model has 300 parameter tensors. All-reducing them one at a time after the backward pass wastes the network for the whole
        backward; all-reducing each as soon as its gradient exists overlaps nicely but pays 300 fixed costs; all-reducing them as one
        flat buffer at the end pays one fixed cost but overlaps nothing. PyTorch groups them into buckets of about 25 MB. Why that
        size, and what decides how much communication stays visible?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Gradients appear during the backward pass in reverse layer order, the last layer&apos;s first. A bucket can be all-reduced as
        soon as its last gradient appears, while the backward pass carries on computing earlier layers. Only the final bucket, holding
        the first layers&apos; gradients, has nothing left to hide behind. Larger buckets mean fewer fixed costs but a larger final
        bucket; smaller buckets mean a short final wait, until the fixed costs add up faster than the backward pass produces
        gradients.
      </p>
      <BucketOverlapViz />
    </>
  ),

  theory: (
    <>
      <Definition title="gradient buckets">
        <p>
          Parameters are listed in the order their gradients become ready and grouped greedily into buckets of at most a given number
          of bytes, a tensor larger than the cap forming its own bucket (<C>bucketize</C>). A bucket is ready when its last gradient is
          (<C>bucket_ready</C>). Each bucket&apos;s gradients are copied into one flat buffer and all-reduced with one call. PyTorch
          records the actual ready order during the first iteration and rebuilds the buckets to match it.
        </p>
        <Code>{TORCH}</Code>
        <Code>{BUCKETS}</Code>
      </Definition>

      <Theorem title="exposed communication with equal buckets">
        <p>
          Suppose the backward pass produces S bytes of gradients evenly over time T, split into k equal buckets, and the network runs one
          all-reduce at a time costing <M>{"c = \\alpha + \\beta S/k"}</M> (e8.2.5). The last all-reduce finishes at
        </p>
        <MD>{"F = \\max_{1 \\le j \\le k} \\Bigl( \\frac{jT}{k} + (k - j + 1)c \\Bigr),"}</MD>
        <p>
          so the step waits <M>{"F - T = c"}</M> if <M>{"kc \\le T"}</M>, and <M>{"T/k + kc - T"}</M> otherwise. The wait is smallest
          for the largest k with <M>{"k\\alpha + \\beta S \\le T"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Bucket j is ready at <M>{"r_j = jT/k"}</M>. The network starts it when it is ready and the previous one is done, so{" "}
          <M>{"f_j = \\max(f_{j-1}, r_j) + c"}</M> with <M>{"f_0 = 0"}</M>. By induction{" "}
          <M>{"f_j = \\max_{i \\le j}(r_i + (j - i + 1)c)"}</M>: the step adds c to each candidate and introduces{" "}
          <M>{"r_j + c"}</M>. The expression inside the maximum for <M>{"F = f_k"}</M> is linear in j with slope{" "}
          <M>{"T/k - c"}</M>, so the maximum is at j = k, giving T + c, when <M>{"c \\le T/k"}</M>, and at j = 1 otherwise. In the
          first regime the wait <M>{"\\alpha + \\beta S/k"}</M> decreases with k, and the regime holds exactly while{" "}
          <M>{"kc = k\\alpha + \\beta S \\le T"}</M>. Beyond it the wait is <M>{"T/k + kc - T \\ge c"}</M>, so no larger k does better.
        </p>
        <Code>{TIMING}</Code>
      </Proof>

      <Remark title="what the model leaves out">
        <p>
          Gradients do not appear evenly: embeddings and the first layers, ready last, can dominate the final bucket, and that is why
          implementations keep buckets moderate rather than tiny. Communication kernels also use SMs, so overlapped collectives slow the
          backward pass slightly. Finally, the first bucket cannot start until the last layer&apos;s backward is done; with very few
          layers there is little to overlap with.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          One flat buffer exposes the whole all-reduce. Per-tensor calls overlap but pay a fixed cost each, which with tens of thousands
          of small tensors outruns the backward pass. A bucket size in the tens of megabytes keeps the number of calls small enough that
          the network keeps up, while the final bucket, the only exposed part, stays short. The best size depends on the model and the
          network, and 25 MB is a default that is reasonable for both.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "keep",
      rung: "check",
      prompt: (
        <p>
          A backward pass produces 1 GB of gradients evenly over 200 ms, split into 10 equal buckets. Each all-reduce costs 0.1 ms plus
          the bytes at 20 GB/s. How many milliseconds does the step wait after the backward pass? Give one decimal.
        </p>
      ),
      answer: { kind: "numeric", value: 5.1, tolerance: 0.01 },
    },
    {
      key: "behind",
      rung: "check",
      prompt: <p>The same, but the all-reduce bandwidth is only 4 GB/s. How many milliseconds does the step wait?</p>,
      answer: { kind: "numeric", value: 71, tolerance: 0.01 },
    },
    {
      key: "first",
      rung: "apply",
      prompt: <p>Which bucket&apos;s all-reduce can never overlap with backward computation?</p>,
      answer: {
        kind: "choice",
        options: [
          "The one holding the gradients of the first layers, which are ready last",
          "The one holding the gradients of the last layers, which are ready first",
          "The largest bucket, wherever it is",
          "Every bucket overlaps equally",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def bucketize(sizes, cap):
    buckets, cur, used = [], [], 0
    for i, n in enumerate(sizes):                 # sizes in the order gradients become ready
        if cur and used + n > cap:
            buckets.append(cur)
            cur, used = [], 0
        cur.append(i)
        used += n
    if cur:
        buckets.append(cur)
    return buckets

def ready_times(sizes, T):
    total, t, out = sum(sizes), 0, []
    for n in sizes:                               # the backward pass produces bytes evenly
        t += n
        out.append(T * t / total)
    return out

def bucket_ready(buckets, ready):
    return [max(ready[i] for i in b) for b in buckets]

b = bucketize([4, 4, 4, 10, 2, 2], 8)
print(b, ready_times([4, 4, 4, 10, 2, 2], 26.0), bucket_ready(b, ready_times([4, 4, 4, 10, 2, 2], 26.0)))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0, 1], [2], [3], [4, 5]] [4.0, 8.0, 12.0, 22.0, 24.0, 26.0] [8.0, 12.0, 22.0, 26.0]",
          "[[0, 1], [2, 3], [4, 5]] [4.0, 8.0, 12.0, 22.0, 24.0, 26.0] [8.0, 22.0, 26.0]",
          "[[0, 1], [2], [3], [4, 5]] [4.0, 8.0, 12.0, 22.0, 24.0, 26.0] [4.0, 12.0, 22.0, 24.0]",
          "[[0, 1], [2], [3, 4], [5]] [4.0, 8.0, 12.0, 22.0, 24.0, 26.0] [8.0, 12.0, 24.0, 26.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def allreduce_cost(nbytes, alpha, beta):
    return alpha + beta * nbytes

def finish_time(ready, costs):
    f = 0.0
    for r, c in zip(ready, costs):                # one all-reduce at a time, in order
        f = max(f, r) + c
    return f

def exposed_time(S, T, k, alpha, beta):
    c = allreduce_cost(S / k, alpha, beta)
    return finish_time([j * T / k for j in range(1, k + 1)], [c] * k) - T

r = [1.0, 2.0, 3.0]
print(allreduce_cost(100, 0.5, 0.01), finish_time(r, [0.5, 0.5, 0.5]), finish_time(r, [2.0, 2.0, 2.0]), exposed_time(100.0, 10.0, 4, 1.0, 0.05))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.5 3.5 7.0 2.25", "1.5 3.5 5.0 2.25", "1.5 2.0 7.0 2.25", "1.5 3.5 7.0 12.25"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bucketize(sizes, cap)</C>, grouping consecutive tensors greedily into buckets of at most cap bytes, a larger tensor
          alone; <C>ready_times(sizes, T)</C>, when each gradient is ready if bytes are produced evenly over T; and{" "}
          <C>bucket_ready(buckets, ready)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def bucketize(sizes, cap):
    return [[i] for i in range(len(sizes))]

def ready_times(sizes, T):
    return [T] * len(sizes)

def bucket_ready(buckets, ready):
    return [ready[b[0]] for b in buckets]
`,
        solution: BUCKETS,
        tests: [
          { name: "buckets", code: `assert bucketize([3, 3, 3], 6) == [[0, 1], [2]] and bucketize([7, 1], 5) == [[0], [1]] and bucketize([], 5) == []` },
          { name: "ready", code: `assert ready_times([1, 3], 8.0) == [2.0, 8.0]\nassert bucket_ready([[0], [1, 2]], [1.0, 5.0, 3.0]) == [1.0, 5.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>allreduce_cost(nbytes, alpha, beta)</C>; <C>finish_time(ready, costs)</C>, when the last of a sequence of all-reduces
          ends if each starts once it is ready and the previous one is done; and <C>exposed_time(S, T, k, alpha, beta)</C> for k equal
          buckets.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def allreduce_cost(nbytes, alpha, beta):
    return alpha

def finish_time(ready, costs):
    return sum(costs)

def exposed_time(S, T, k, alpha, beta):
    return 0.0
`,
        solution: TIMING,
        tests: [
          { name: "cost", code: `assert allreduce_cost(10, 1.0, 0.5) == 6.0\nassert finish_time([0.0, 10.0], [3.0, 3.0]) == 13.0 and finish_time([1.0, 1.0], [3.0, 3.0]) == 7.0` },
          { name: "exposed", code: `assert abs(exposed_time(8.0, 4.0, 2, 0.5, 0.25) - 1.5) < 1e-12\nassert abs(exposed_time(8.0, 4.0, 2, 0.5, 1.0) - 7.0) < 1e-12` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          For the first check&apos;s backward pass and network (1 GB over 200 ms, 0.1 ms per call, 20 GB/s), what is the smallest
          possible wait, in milliseconds, over all numbers of equal buckets? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.133, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        When the batch that fits on a GPU is smaller than the batch training needs, replicas run several micro-batches before each
        update. The next lesson accumulates gradients across them, and skips the all-reduce for all but the last.
      </p>
    </>
  ),
};
