import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DdpReplicasViz } from "@/components/viz/DdpReplicasViz";
import type { LessonContent } from "@/lib/types";

const SIM = `def shard(indices, world, rank):
    n = -(-len(indices) // world) * world          # pad to a multiple of the world size,
    padded = indices + indices[:n - len(indices)]  # repeating from the start
    return padded[rank::world]                     # as DistributedSampler does

def local_grad(w, xs, ys):
    return sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)

def ddp_step(ws, batch, lr):
    world = len(ws)
    grads = []
    for rank, w in enumerate(ws):
        part = shard(batch, world, rank)
        grads.append(local_grad(w, [x for x, _ in part], [y for _, y in part]))
    g = sum(grads) / world                         # all-reduce, then divide by the world size
    return [w - lr * g for w in ws]`;

const AVG = `def allreduce_mean(values):
    return sum(values) / len(values)

def weighted_allreduce(sums, counts):
    return sum(sums) / sum(counts)                 # all-reduce sums and counts separately

def replicas_in_sync(ws, tol):
    return max(ws) - min(ws) <= tol`;

const TORCH = `import os
import torch
import torch.distributed as dist
from torch.nn.parallel import DistributedDataParallel as DDP
from torch.utils.data import DataLoader, DistributedSampler

dist.init_process_group("nccl")                   # one process per GPU, started by torchrun
torch.cuda.set_device(int(os.environ["LOCAL_RANK"]))
model = DDP(build_model().cuda())                 # broadcasts rank 0's parameters and buffers
sampler = DistributedSampler(dataset, shuffle=True, seed=0)   # one permutation, a slice per rank
loader = DataLoader(dataset, batch_size=32, sampler=sampler)
opt = torch.optim.AdamW(model.parameters(), lr=3e-4)
for epoch in range(epochs):
    sampler.set_epoch(epoch)                      # a new permutation, agreed by every rank
    for x, y in loader:
        loss = loss_fn(model(x.cuda()), y.cuda())
        opt.zero_grad()
        loss.backward()                           # gradients are averaged across ranks here
        opt.step()                                # the same update on every rank`;

export const lesson: LessonContent = {
  id: "e10.2.1",
  minutes: 50,
  links: {
    requires: ["e10.1.2", "e8.2.2"],
    revisits: ["e7.5.3", "e6.3.2"],
    foreshadows: ["e10.2.2", "e10.2.3", "e10.8.4"],
  },

  puzzle: (
    <>
      <p>
        Eight GPUs each hold a full copy of a model, see different data, and never exchange a single weight after the start. Yet after
        a hundred thousand steps their copies are identical to the last bit, and the run matches what one enormous GPU would have done
        with the whole batch. What keeps them together, and which small mistakes quietly break either property?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Data parallelism splits each batch, not the model. Every replica computes gradients on its shard; an all-reduce averages them, so
        every replica holds the same gradient; every replica applies the same optimiser step. If the replicas started equal, they stay
        equal, and the averaged gradient is the gradient of the whole batch. The figure shows four replicas learning one weight, and
        three ways to get it wrong: shards of different sizes averaged naively, a missing initial broadcast, and a missing all-reduce.
      </p>
      <DdpReplicasViz />
    </>
  ),

  theory: (
    <>
      <Definition title="distributed data parallelism">
        <p>
          R processes, one per GPU, each build the model and synchronise its parameters and buffers by broadcasting from rank 0. A
          sampler gives every rank the same permutation of the data and a different slice of it, padding with repeated examples so that
          all slices have equal length (<C>shard</C>). Each step, each rank computes the mean loss on its micro-batch and its gradient;
          the gradients are all-reduced with summation and divided by R; every rank then applies the optimiser.
        </p>
        <Code>{TORCH}</Code>
        <Code>{SIM}</Code>
      </Definition>

      <Theorem title="replicas stay identical">
        <p>
          If all replicas start with bitwise-equal parameters and optimiser state, the optimiser is deterministic, and the all-reduce
          delivers bitwise-equal results to every rank, then the replicas remain bitwise equal after every step.
        </p>
      </Theorem>
      <Proof>
        <p>
          By induction on steps. Suppose before step k every rank holds the same parameters and state. The ranks compute different local
          gradients, but the all-reduce gives each rank the same averaged gradient g. The update is a deterministic function of the
          parameters, the state and g, all equal across ranks, so its results are equal. Ring all-reduce satisfies the hypothesis
          because each chunk is reduced on one rank and the same bytes are then copied to all others (e8.2.2).
        </p>
      </Proof>

      <Theorem title="equivalence to one large batch">
        <p>
          Let rank r compute the mean gradient <M>{"g_r"}</M> over <M>{"n_r"}</M> examples. Then{" "}
          <M>{"\\frac{1}{R}\\sum_r g_r"}</M> equals the mean gradient over all <M>{"n = \\sum_r n_r"}</M> examples if all{" "}
          <M>{"n_r"}</M> are equal. In general it gives each example on rank r the weight <M>{"1/(Rn_r)"}</M> instead of 1/n; the
          correct mean is <M>{"\\sum_r n_r g_r / \\sum_r n_r"}</M>, obtained by all-reducing sums and counts.
        </p>
      </Theorem>
      <Proof>
        <p>
          Write <M>{"g_r = \\frac{1}{n_r}\\sum_{i \\in r} \\nabla\\ell_i"}</M>. Then{" "}
          <M>{"\\frac{1}{R}\\sum_r g_r = \\sum_r \\sum_{i \\in r} \\frac{1}{Rn_r}\\nabla\\ell_i"}</M>, so example i on rank r has weight{" "}
          <M>{"1/(Rn_r)"}</M>. If every <M>{"n_r = n/R"}</M> this is 1/n for all examples, the full-batch mean. Otherwise multiplying
          each <M>{"g_r"}</M> by <M>{"n_r"}</M> recovers the sum over rank r&apos;s examples, and dividing the total by n gives the mean.
        </p>
        <Code>{AVG}</Code>
      </Proof>

      <Remark title="what must agree and what must differ">
        <ul>
          <li>The data permutation must agree, so slices do not overlap; call <C>set_epoch</C> each epoch.</li>
          <li>
            Dropout and other random masks should differ between ranks, or every replica draws the same noise for different examples.
          </li>
          <li>
            Batch normalisation computes statistics per rank unless replaced by a synchronised version, and its running buffers are
            re-broadcast from rank 0.
          </li>
          <li>
            Padding repeats examples: harmless in training, but evaluation metrics computed over padded slices count some examples
            twice.
          </li>
        </ul>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The replicas never exchange weights because they never need to: equal starting points, identical averaged gradients and
          deterministic updates keep them equal by induction, and equal-sized shards make the average the full-batch gradient. A missing
          broadcast leaves a permanent offset, a missing all-reduce lets replicas drift apart, and averaging means over uneven shards
          silently reweights examples.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "weight",
      rung: "check",
      prompt: (
        <p>
          Four replicas hold shards of 8, 8, 8 and 2 examples, and their mean gradients are averaged with equal weight. What total weight
          do the 2 examples of the last shard receive?
        </p>
      ),
      answer: { kind: "numeric", value: 0.25, tolerance: 0 },
    },
    {
      key: "pad",
      rung: "check",
      prompt: (
        <p>
          A distributed sampler splits a dataset of 1000 examples over 64 ranks, padding so that every rank gets the same number. How
          many examples appear twice in an epoch?
        </p>
      ),
      answer: { kind: "numeric", value: 24, tolerance: 0 },
    },
    {
      key: "dropout",
      rung: "apply",
      prompt: <p>Every rank seeds its random generator with the same value before training. What goes wrong?</p>,
      answer: {
        kind: "choice",
        options: [
          "Dropout draws the same masks on every rank, so the noise is correlated across replicas",
          "The replicas drift apart because their gradients differ",
          "The sampler gives every rank the same data",
          "The all-reduce produces different results on different ranks",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def shard(indices, world, rank):
    n = -(-len(indices) // world) * world          # pad to a multiple of the world size,
    padded = indices + indices[:n - len(indices)]  # repeating from the start
    return padded[rank::world]                     # as DistributedSampler does

def local_grad(w, xs, ys):
    return sum(2 * (w * x - y) * x for x, y in zip(xs, ys)) / len(xs)

def ddp_step(ws, batch, lr):
    world = len(ws)
    grads = []
    for rank, w in enumerate(ws):
        part = shard(batch, world, rank)
        grads.append(local_grad(w, [x for x, _ in part], [y for _, y in part]))
    g = sum(grads) / world                         # all-reduce, then divide by the world size
    return [w - lr * g for w in ws]

xs, ys = [1.0, 2.0, 3.0, 4.0, 5.0], [3.0, 6.0, 9.0, 12.0, 15.0]
print(shard(list(range(5)), 2, 0), shard(list(range(5)), 2, 1), local_grad(2.0, [1.0], [3.0]), [round(w, 6) for w in ddp_step([0.0, 0.0], list(zip(xs, ys)), 0.01)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0, 2, 4] [1, 3, 0] -2.0 [0.56, 0.56]",
          "[0, 1, 2] [3, 4, 0] -2.0 [0.56, 0.56]",
          "[0, 2, 4] [1, 3] -2.0 [0.65, 0.65]",
          "[0, 2, 4] [1, 3, 0] -2.0 [0.7, 0.42]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def allreduce_mean(values):
    return sum(values) / len(values)

def weighted_allreduce(sums, counts):
    return sum(sums) / sum(counts)                 # all-reduce sums and counts separately

def replicas_in_sync(ws, tol):
    return max(ws) - min(ws) <= tol

g = [1.0, 2.0, 6.0]
print(allreduce_mean(g), round(weighted_allreduce([3.0, 4.0, 6.0], [3, 2, 1]), 3), replicas_in_sync([1.0, 1.0, 1.0 + 1e-12], 0.0), replicas_in_sync([1.0, 1.0], 0.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3.0 2.167 False True", "3.0 4.333 False True", "3.0 2.167 True True", "3.0 13.0 False True"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>shard(indices, world, rank)</C> as the definition describes; <C>local_grad(w, xs, ys)</C>, the mean gradient of{" "}
          <M>{"(wx - y)^2"}</M>; and <C>ddp_step(ws, batch, lr)</C>, which gives rank r the shard of a list of (x, y) pairs, averages the
          local gradients and updates every replica.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def shard(indices, world, rank):
    return indices

def local_grad(w, xs, ys):
    return 0.0

def ddp_step(ws, batch, lr):
    return ws
`,
        solution: SIM,
        tests: [
          { name: "shard", code: `assert shard(list(range(10)), 4, 3) == [3, 7, 1]\nassert sorted(sum((shard(list(range(7)), 3, r) for r in range(3)), [])) == [0, 0, 1, 1, 2, 3, 4, 5, 6]\nassert local_grad(1.0, [1.0, 2.0], [1.0, 0.0]) == 4.0` },
          { name: "step", code: `batch = [(float(x), 2.0 * x + 0.5) for x in range(1, 7)]\nref = 1.0 - 0.01 * sum(2 * (x - y) * x for x, y in batch) / 6\nout = ddp_step([1.0, 1.0, 1.0], batch, 0.01)\nassert len(out) == 3 and all(abs(w - ref) < 1e-12 for w in out)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>allreduce_mean(values)</C>; <C>weighted_allreduce(sums, counts)</C>, the correct global mean from per-rank sums and
          counts; and <C>replicas_in_sync(ws, tol)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def allreduce_mean(values):
    return values[0]

def weighted_allreduce(sums, counts):
    return sum(sums) / len(sums)

def replicas_in_sync(ws, tol):
    return True
`,
        solution: AVG,
        tests: [
          { name: "means", code: `assert allreduce_mean([2.0, 4.0]) == 3.0 and weighted_allreduce([10.0, 2.0], [4, 1]) == 2.4` },
          { name: "sync", code: `assert replicas_in_sync([1.0, 1.05], 0.1)\nassert not replicas_in_sync([0.0, 1.0], 0.5)` },
        ],
      },
    },
    {
      key: "bias",
      rung: "stretch",
      prompt: (
        <p>
          Four ranks hold 3, 3, 3 and 1 examples, with mean gradients 1, 1, 1 and 5. What is the relative error of the equal-weight
          average of the four means, compared with the correct mean over all examples? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.429, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        As written, the all-reduce starts after the backward pass ends, and the GPUs wait for the network. The next lesson starts
        reducing gradients while the backward pass is still producing them.
      </p>
    </>
  ),
};
