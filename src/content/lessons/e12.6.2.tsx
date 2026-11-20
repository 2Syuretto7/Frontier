import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { WeightSyncViz } from "@/components/viz/WeightSyncViz";
import type { LessonContent } from "@/lib/types";

const RESHARD = `import numpy as np

def fsdp_shards(w, n):
    flat = w.ravel()
    size = -(-flat.size // n)                                 # ceiling division
    flat = np.concatenate([flat, np.zeros(size * n - flat.size)])   # pad so every rank holds the same amount
    return [flat[i * size:(i + 1) * size] for i in range(n)]

def gather(shards, shape):
    flat = np.concatenate(shards)
    return flat[:int(np.prod(shape))].reshape(shape)          # drop the padding

def tp_shards(w, n, axis):
    return np.split(w, n, axis=axis)                          # axis 1: column parallel, axis 0: row parallel`;

const SYNC = `import numpy as np

def bucket(sizes, cap):
    buckets, cur = [], []
    for s in sizes:                                           # parameters in a fixed order
        if cur and sum(cur) + s > cap:
            buckets.append(cur)
            cur = []
        cur.append(s)                                         # a parameter larger than cap goes alone
    if cur:
        buckets.append(cur)
    return buckets

def sync_time(sizes, cap, bandwidth, latency):
    return len(bucket(sizes, cap)) * latency + sum(sizes) / bandwidth

def mismatch(trainer, generator, tol):
    return [k for k in trainer if np.abs(trainer[k] - generator[k]).max() > tol]`;

export const lesson: LessonContent = {
  id: "e12.6.2",
  minutes: 50,
  links: {
    requires: ["e12.6.1", "e10.3.2"],
    revisits: ["e10.4.1", "e10.2.1"],
    foreshadows: ["e12.6.3"],
  },

  puzzle: (
    <>
      <p>
        An RL system trains with FSDP on one set of GPUs and generates with a tensor-parallel inference engine on another. After every
        update the new weights must reach the generator. The first version saves a checkpoint to disk and restarts the engine, taking
        several minutes per step. The second sends every tensor separately over the network and takes almost a minute, although the
        link should move the whole model in a few seconds. The third is fast, but rewards slowly drift down: a check finds the generator
        is still using the old value of one fused tensor. What is the right way to move the weights, and how should it be checked?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The two sides store the same parameters differently. FSDP (e10.3.2) flattens each parameter and cuts it into equal pieces, one
        per rank, padding the last. A tensor-parallel engine (e10.4.1) cuts matrices along rows or columns, sometimes fuses several into
        one (queries, keys and values together), and may use other names. Synchronising therefore means gathering the full parameter,
        resharding it to the engine&apos;s layout and sending each piece to the rank that needs it, directly between GPUs, without disk.
        Sending tensors one by one pays a fixed start-up latency for each of hundreds of tensors, so they are packed into buckets of
        about a gigabyte. And because a silent mistake corrupts training slowly, systems compare a fingerprint of the weights on both
        sides after a sync.
      </p>
      <WeightSyncViz />
    </>
  ),

  theory: (
    <>
      <Definition title="resharding">
        <p>
          <C>fsdp_shards</C> flattens a parameter and splits it into n equal pieces, padding with zeros. <C>gather</C> joins the pieces,
          drops the padding and restores the shape. <C>tp_shards</C> splits a matrix into n blocks along an axis, as a tensor-parallel
          engine stores it.
        </p>
        <Code>{RESHARD}</Code>
      </Definition>

      <Theorem title="gather inverts sharding">
        <p>
          For any array w with k elements and any n, <C>gather(fsdp_shards(w, n), w.shape)</C> equals w, and the padding is{" "}
          <M>{"n\\lceil k/n \\rceil - k < n"}</M> elements.
        </p>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"s = \\lceil k/n \\rceil"}</M>. The padded vector has <M>{"ns \\ge k"}</M> elements, its first k being the flattened w,
          and the shards are its consecutive pieces of length s. Concatenating them restores the padded vector; its first k elements,
          reshaped in the same row-major order, give w. The padding is <M>{"ns - k"}</M>, and since <M>{"s < k/n + 1"}</M>, it is less
          than n. Correctness of a sync rests on this: every element reaches the generator exactly once, whatever the two layouts.
        </p>
      </Proof>

      <Definition title="moving and checking the weights">
        <p>
          <C>bucket</C> packs parameter sizes, in order, into buckets of at most <C>cap</C>, a larger parameter going alone.{" "}
          <C>sync_time</C> charges a fixed <C>latency</C> for each bucket plus the bytes over <C>bandwidth</C>. <C>mismatch</C> returns
          the names of parameters on which the trainer&apos;s and generator&apos;s copies differ by more than <C>tol</C>.
        </p>
        <Code>{SYNC}</Code>
      </Definition>

      <Theorem title="the cost of many small messages">
        <p>
          Sending P parameters with total size S one at a time takes <M>{"P\\alpha + S/\\beta"}</M> for latency α and bandwidth β. With
          buckets of capacity c, at least <M>{"\\lceil S/c \\rceil"}</M> and, if no parameter exceeds c, fewer than{" "}
          <M>{"2S/c + 1"}</M> buckets are needed, so the latency term falls to about <M>{"(S/c)\\alpha"}</M> to{" "}
          <M>{"(2S/c)\\alpha"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each bucket holds at most c, so there are at least <M>{"S/c"}</M>. When a bucket is closed, the next parameter would have
          overflowed it, so the closed bucket and that parameter together exceed c. Pairing each closed bucket with the following one,
          any two consecutive buckets hold more than c, so b buckets hold more than <M>{"\\lfloor b/2 \\rfloor c"}</M>, giving{" "}
          <M>{"b < 2S/c + 1"}</M>. With hundreds of tensors and α of a millisecond or more, latency can dominate unbatched transfers;
          buckets of a gigabyte make it negligible beside <M>{"S/\\beta"}</M>.
        </p>
      </Proof>

      <Remark title="weight synchronisation in practice">
        <p>
          When trainer and generator share GPUs, the trainer&apos;s weights are handed to the engine through CUDA inter-process memory
          handles with no copy over the network, and optimizer state is moved off the GPU while generating. When they are separate,
          weights go over NCCL broadcasts set up between the trainer and each engine, as with data-parallel all-reduce (e10.2.1), often
          bucketed and overlapped with the start of the next generation round. Engines expose an update method that loads named tensors in
          place, mapping names and fusing tensors as their loader does. Frameworks check syncs by comparing checksums or sampling the same
          prompt on both sides and comparing log probabilities.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          Checkpoints to disk and engine restarts are slow; resharding in memory and sending directly is the right path. The slow second
          version paid per-message latency for every tensor; buckets of about a gigabyte fix that. The drift was a fused tensor whose
          parts were renamed and not mapped, so it was never updated; comparing the two copies after each sync, as <C>mismatch</C> does,
          or comparing log probabilities, catches such errors at once.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "time",
      rung: "check",
      prompt: (
        <p>
          A 140 GB model is sent in 140 buckets over a 50 GB/s link with 1 ms of latency per bucket. How many seconds does the sync take?
          Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.94, tolerance: 0.005 },
    },
    {
      key: "pad",
      rung: "check",
      prompt: (
        <p>
          A 4,096 by 4,096 matrix is sharded by <C>fsdp_shards</C> over 6 ranks. How many padding elements are added?
        </p>
      ),
      answer: { kind: "numeric", value: 2, tolerance: 0.001 },
    },
    {
      key: "verify",
      rung: "apply",
      prompt: <p>Why is it worth comparing the generator&apos;s weights or log probabilities with the trainer&apos;s after each sync?</p>,
      answer: {
        kind: "choice",
        options: [
          "A parameter that is misnamed or not updated causes no error, only a slow drift between the policy trained and the policy sampled",
          "NCCL drops a fixed fraction of messages, which must be resent",
          "The generator stores weights in a different precision, so they never match and must be reset",
          "Comparing weights makes the next sync faster",
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

def fsdp_shards(w, n):
    flat = w.ravel()
    size = -(-flat.size // n)                                 # ceiling division
    flat = np.concatenate([flat, np.zeros(size * n - flat.size)])   # pad so every rank holds the same amount
    return [flat[i * size:(i + 1) * size] for i in range(n)]

def gather(shards, shape):
    flat = np.concatenate(shards)
    return flat[:int(np.prod(shape))].reshape(shape)          # drop the padding

def tp_shards(w, n, axis):
    return np.split(w, n, axis=axis)                          # axis 1: column parallel, axis 0: row parallel

s = fsdp_shards(np.arange(6.0).reshape(2, 3), 4)
print([x.tolist() for x in s], gather(s, (2, 3)).tolist(), [x.shape for x in tp_shards(np.arange(6.0).reshape(2, 3), 3, 1)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 1.0], [2.0, 3.0], [4.0, 5.0], [0.0, 0.0]] [[0.0, 1.0, 2.0], [3.0, 4.0, 5.0]] [(2, 1), (2, 1), (2, 1)]",
          "[[0.0, 1.0], [2.0, 3.0], [4.0, 5.0], [0.0, 0.0]] [[0.0, 1.0, 2.0], [3.0, 4.0, 5.0]] [(1, 3), (1, 3), (1, 3)]",
          "[[0.0, 1.0], [2.0, 3.0], [4.0, 5.0]] [[0.0, 1.0, 2.0], [3.0, 4.0, 5.0]] [(2, 1), (2, 1), (2, 1)]",
          "[[0.0, 3.0], [1.0, 4.0], [2.0, 5.0], [0.0, 0.0]] [[0.0, 1.0, 2.0], [3.0, 4.0, 5.0]] [(2, 1), (2, 1), (2, 1)]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def bucket(sizes, cap):
    buckets, cur = [], []
    for s in sizes:                                           # parameters in a fixed order
        if cur and sum(cur) + s > cap:
            buckets.append(cur)
            cur = []
        cur.append(s)                                         # a parameter larger than cap goes alone
    if cur:
        buckets.append(cur)
    return buckets

def sync_time(sizes, cap, bandwidth, latency):
    return len(bucket(sizes, cap)) * latency + sum(sizes) / bandwidth

def mismatch(trainer, generator, tol):
    return [k for k in trainer if np.abs(trainer[k] - generator[k]).max() > tol]

b = bucket([4, 3, 6, 1, 2, 9], 7)
print(b, sync_time([4, 3, 6, 1, 2, 9], 7, 5.0, 0.5), mismatch({"a": np.ones(2), "b": np.zeros(2)}, {"a": np.ones(2), "b": np.array([0.0, 0.01])}, 1e-3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[4, 3], [6, 1], [2], [9]] 7.0 ['b']",
          "[[4, 3], [6, 1], [2, 9]] 6.5 ['b']",
          "[[4, 3], [6, 1], [2], [9]] 7.0 []",
          "[[4], [3], [6, 1], [2], [9]] 7.5 ['b']",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fsdp_shards(w, n)</C>, <C>gather(shards, shape)</C> and <C>tp_shards(w, n, axis)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def fsdp_shards(w, n):
    return np.array_split(w.ravel(), n)

def gather(shards, shape):
    return np.concatenate(shards).reshape(shape)

def tp_shards(w, n, axis):
    return [w] * n
`,
        solution: RESHARD,
        tests: [
          { name: "fsdp", code: `w = np.arange(5.0)\ns = fsdp_shards(w, 3)\nassert [x.tolist() for x in s] == [[0.0, 1.0], [2.0, 3.0], [4.0, 0.0]]\nassert gather(s, (5,)).tolist() == w.tolist() and gather(fsdp_shards(np.ones((3, 3)), 2), (3, 3)).shape == (3, 3)` },
          { name: "tp", code: `w = np.arange(8.0).reshape(2, 4)\nassert [x.tolist() for x in tp_shards(w, 2, 1)] == [[[0.0, 1.0], [4.0, 5.0]], [[2.0, 3.0], [6.0, 7.0]]] and tp_shards(w, 2, 0)[1].tolist() == [[4.0, 5.0, 6.0, 7.0]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bucket(sizes, cap)</C>, <C>sync_time(sizes, cap, bandwidth, latency)</C> and{" "}
          <C>mismatch(trainer, generator, tol)</C>, listing names in the trainer&apos;s order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bucket(sizes, cap):
    return [[s] for s in sizes]

def sync_time(sizes, cap, bandwidth, latency):
    return sum(sizes) / bandwidth

def mismatch(trainer, generator, tol):
    return []
`,
        solution: SYNC,
        tests: [
          { name: "bucket", code: `assert bucket([2, 2, 2, 5, 1], 4) == [[2, 2], [2], [5], [1]] and bucket([], 4) == []\nassert sync_time([2, 2, 2, 5, 1], 4, 2.0, 1.0) == 10.0` },
          { name: "check", code: `t = {"x": np.zeros(3), "y": np.ones(2), "z": np.ones(1)}\ng = {"x": np.array([0.0, 0.5, 0.0]), "y": np.ones(2), "z": np.zeros(1)}\nassert mismatch(t, g, 0.1) == ["x", "z"] and mismatch(t, g, 1.0) == []` },
        ],
      },
    },
    {
      key: "layers",
      rung: "stretch",
      prompt: (
        <p>
          A model has 80 layers, each with four 400 MB tensors followed by three 600 MB tensors, in that order throughout. They are sent
          with <C>sync_time</C> using buckets of 1,000 MB, 2 ms of latency per bucket and 25,000 MB/s of bandwidth. How many seconds does
          the sync take? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 11.52, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Even a fast sync leaves the generator idle while the trainer updates, and the trainer idle while the generator samples. The next
        lesson overlaps the two, letting the generator run ahead on slightly old weights, and corrects for the mismatch.
      </p>
    </>
  ),
};
