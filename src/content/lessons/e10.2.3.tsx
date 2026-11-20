import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AccumTimelineViz } from "@/components/viz/AccumTimelineViz";
import type { LessonContent } from "@/lib/types";

const NORMALISE = `def naive_grad(ranks):
    per_rank = []
    for mbs in ranks:                             # each rank holds micro-batches of per-token gradients
        means = [sum(mb) / len(mb) for mb in mbs]
        per_rank.append(sum(means) / len(means))  # mean over this rank's micro-batches
    return sum(per_rank) / len(per_rank)          # DDP then averages over ranks

def token_grad(ranks):
    vals = [v for mbs in ranks for mb in mbs for v in mb]
    return sum(vals) / len(vals)

def rank_contrib(mbs, total_tokens, world):
    return sum(v for mb in mbs for v in mb) * world / total_tokens`;

const TIMING = `def accum_steps(G, m, d):
    if G % (m * d):
        raise ValueError("global batch must be a multiple of micro-batch times replicas")
    return G // (m * d)

def step_time(k, t_mb, c, h, no_sync=True):
    e = max(0.0, c - h)                           # the all-reduce left over after the backward it overlaps
    return k * t_mb + e if no_sync else k * (t_mb + e)

def throughput(G, m, d, t_mb, c, h):
    return G / step_time(accum_steps(G, m, d), t_mb, c, h)`;

const TORCH = `n_local = sum(int(mask.sum()) for _, mask in micro_batches)    # tokens this rank will train on
n_total = torch.tensor(n_local, device="cuda")
dist.all_reduce(n_total)                                         # one scalar: tokens across every rank
for j, (x, mask) in enumerate(micro_batches):
    sync = model.no_sync() if j < len(micro_batches) - 1 else contextlib.nullcontext()
    with sync:                                                   # all-reduce only on the last backward
        loss_sum = (model(x).token_loss * mask).sum()
        (loss_sum * world_size / n_total).backward()             # DDP divides by world_size again
opt.step()
opt.zero_grad(set_to_none=True)`;

export const lesson: LessonContent = {
  id: "e10.2.3",
  minutes: 45,
  links: {
    requires: ["e10.2.2", "e7.6.2"],
    revisits: ["l5.3.2", "l9.1.1"],
    foreshadows: ["e10.3.1", "e10.5.1"],
  },

  puzzle: (
    <>
      <p>
        A fine-tuning run moves from 8 GPUs with one micro-batch each to 2 GPUs accumulating 4 micro-batches each. The global batch is
        the same, the data are the same, and each rank averages its loss over its own response tokens exactly as before. Yet the
        gradients differ, and the loss curves do not match. What changed, and what else should change when accumulation is turned on?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Accumulation sums gradients from several micro-batches before one optimiser step, so the global batch is micro-batch times
        replicas times steps (e7.6.2). Two things need care. The sum must be weighted so that it equals the gradient of the mean over
        every token in the global batch, which per-rank and per-micro-batch averages do not give when token counts differ. And the
        all-reduce should happen once per optimiser step, not once per micro-batch, since the intermediate sums are never used.
      </p>
      <AccumTimelineViz />
    </>
  ),

  theory: (
    <>
      <Definition title="accumulation across replicas">
        <p>
          With d replicas, micro-batches of m sequences and k accumulation steps, the global batch is G = mdk sequences (
          <C>accum_steps</C>). Each rank runs k forward and backward passes, adding into <C>.grad</C> (e6.2.1), then the replicas average
          their gradients and every rank takes the same step. The target is the gradient of the loss averaged over all N tokens of the
          global batch (l5.3.2). The common mistake is to average within each micro-batch, then over micro-batches, then over ranks (
          <C>naive_grad</C>), which equals the target only when every micro-batch has the same number of tokens.
        </p>
        <Code>{NORMALISE}</Code>
      </Definition>

      <Theorem title="the right scale for each rank">
        <p>
          Let rank r hold tokens with gradient sum <M>{"s_r"}</M>, and let <M>{"N = \\sum_r n_r"}</M> be the total token count over
          all d ranks. If each rank backpropagates its summed loss times <M>{"d/N"}</M> and DDP averages the ranks, the result is the
          token mean <M>{"\\sum_r s_r / N"}</M>, whatever the counts <M>{"n_r"}</M>. The naive scheme instead gives
        </p>
        <MD>{"\\frac{1}{d}\\sum_r \\frac{1}{k}\\sum_{j} \\frac{s_{rj}}{n_{rj}},"}</MD>
        <p>which weights a token in a micro-batch of n tokens by 1/n, so tokens in short micro-batches count for more.</p>
      </Theorem>
      <Proof>
        <p>
          Gradients are linear in the loss, so scaling rank r&apos;s summed loss by <M>{"d/N"}</M> gives gradient{" "}
          <M>{"s_r d / N"}</M> (<C>rank_contrib</C>). The average over d ranks is{" "}
          <M>{"\\frac{1}{d}\\sum_r s_r d/N = \\sum_r s_r / N"}</M>. In the naive formula a token in micro-batch (r, j) has weight{" "}
          <M>{"1/(dk\\,n_{rj})"}</M>, which equals 1/N for every token exactly when all <M>{"n_{rj}"}</M> are equal to N/(dk).
        </p>
      </Proof>

      <Remark title="the cost of knowing N">
        <p>
          N is not known on any rank until the counts are shared. Since a rank&apos;s micro-batches for the step are drawn before the
          first forward pass, one all-reduce of a single integer at the start of the step supplies it. With packed pre-training
          sequences every micro-batch has the same count and the naive scheme is already correct; the problem appears with padding,
          loss masks and variable-length fine-tuning data (l9.1.1).
        </p>
        <Code>{TORCH}</Code>
      </Remark>

      <Theorem title="synchronising once per step">
        <p>
          Let a micro-batch take <M>{"t"}</M>, and let the all-reduce leave <M>{"e = \\max(0, c - h)"}</M> exposed after the backward
          pass it overlaps (e10.2.2). Synchronising every micro-batch costs <M>{"k(t + e)"}</M> per optimiser step; using{" "}
          <C>no_sync</C> for the first k − 1 costs <M>{"kt + e"}</M>. The exposed share falls from <M>{"e/(t + e)"}</M> to{" "}
          <M>{"e/(kt + e)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient after k micro-batches is the sum of their gradients on every rank, and averaging is linear, so the average of
          the sums equals the sum of the averages. The intermediate all-reduces therefore change nothing the optimiser sees, and
          removing k − 1 of them saves <M>{"(k-1)e"}</M>.
        </p>
        <Code>{TIMING}</Code>
      </Proof>

      <Remark title="what accumulation does not change">
        <p>
          Peak activation memory follows the micro-batch, not the global batch, which is the point. The gradient buffer is the same
          size as without accumulation, but it is added to k times, so keep it in fp32 when the model computes in bf16: small
          increments to a large sum are where low precision loses most (m11.1.5). Layers that use batch statistics, such as batch
          normalisation, see only the micro-batch, so accumulation is not exactly a larger batch for them.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          With 8 ranks and one micro-batch each, the naive scheme is a mean of 8 per-micro-batch means; with 2 ranks and 4 micro-batches
          each it is the same mean of 8 means only if the code divides each micro-batch by k. Code that divides by the rank&apos;s total
          tokens across its 4 micro-batches compute something else again, weighting tokens by their rank&apos;s count. Scaling each
          rank&apos;s summed loss by <M>{"d/N"}</M> gives the same token mean in both layouts. Separately, the first three micro-batches
          on each rank should run under <C>no_sync</C>.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "tokens",
      rung: "check",
      prompt: (
        <p>
          Rank 0 runs two micro-batches: 50 tokens whose per-token gradients average 1.0, then 150 tokens averaging 3.0. Rank 1 runs 100
          tokens averaging 2.0, then 100 averaging 6.0. What is the gradient of the mean loss over all tokens?
        </p>
      ),
      answer: { kind: "numeric", value: 3.25, tolerance: 0.001 },
    },
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          Each micro-batch takes 120 ms, the all-reduce costs 90 ms and 40 ms of it hides behind the backward pass. With 8 accumulation
          steps, how many milliseconds per optimiser step does <C>no_sync</C> save?
        </p>
      ),
      answer: { kind: "numeric", value: 350, tolerance: 0 },
    },
    {
      key: "when",
      rung: "apply",
      prompt: <p>When does averaging per micro-batch, then over micro-batches and ranks, give the token-mean gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "When every micro-batch on every rank has the same number of loss tokens",
          "Whenever the number of accumulation steps is the same on every rank",
          "Whenever the global batch size is fixed",
          "Always, because averaging is linear",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def naive_grad(ranks):
    per_rank = []
    for mbs in ranks:                             # each rank holds micro-batches of per-token gradients
        means = [sum(mb) / len(mb) for mb in mbs]
        per_rank.append(sum(means) / len(means))  # mean over this rank's micro-batches
    return sum(per_rank) / len(per_rank)          # DDP then averages over ranks

def token_grad(ranks):
    vals = [v for mbs in ranks for mb in mbs for v in mb]
    return sum(vals) / len(vals)

def rank_contrib(mbs, total_tokens, world):
    return sum(v for mb in mbs for v in mb) * world / total_tokens

ranks = [[[1.0, 3.0], [2.0]], [[4.0, 4.0, 4.0, 0.0, 3.0]]]
print(naive_grad(ranks), token_grad(ranks), sum(rank_contrib(r, 8, 2) for r in ranks) / 2)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["2.5 2.625 2.625", "2.5 2.625 2.5", "2.625 2.625 2.625", "2.5 2.5 2.625"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def accum_steps(G, m, d):
    if G % (m * d):
        raise ValueError("global batch must be a multiple of micro-batch times replicas")
    return G // (m * d)

def step_time(k, t_mb, c, h, no_sync=True):
    e = max(0.0, c - h)                           # the all-reduce left over after the backward it overlaps
    return k * t_mb + e if no_sync else k * (t_mb + e)

def throughput(G, m, d, t_mb, c, h):
    return G / step_time(accum_steps(G, m, d), t_mb, c, h)

t = (step_time(8, 10.0, 6.0, 2.0), step_time(8, 10.0, 6.0, 2.0, no_sync=False))
print(accum_steps(512, 4, 16), t, step_time(4, 10.0, 1.0, 2.0), throughput(384, 4, 16, 10.0, 6.0, 2.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["8 (84.0, 112.0) 40.0 6.0", "8 (84.0, 112.0) 41.0 6.0", "8 (84.0, 84.0) 40.0 6.0", "8 (112.0, 84.0) 40.0 6.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Each rank is a list of micro-batches, each a list of per-token gradients. Write <C>naive_grad(ranks)</C>, the mean over ranks
          of the mean over micro-batches of the micro-batch means; <C>token_grad(ranks)</C>, the mean over all tokens; and{" "}
          <C>rank_contrib(mbs, total_tokens, world)</C>, a rank&apos;s gradient sum scaled so that the mean over ranks is the token mean.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def naive_grad(ranks):
    return 0.0

def token_grad(ranks):
    return 0.0

def rank_contrib(mbs, total_tokens, world):
    return 0.0
`,
        solution: NORMALISE,
        tests: [
          { name: "means", code: `r = [[[2.0], [4.0, 4.0]], [[0.0, 0.0]]]\nassert naive_grad(r) == 1.5 and token_grad(r) == 2.0` },
          { name: "contrib", code: `assert rank_contrib([[1.0, 2.0], [3.0]], 12, 4) == 2.0\nassert [rank_contrib(r, 4, 2) for r in [[[1.0, 2.0], [3.0]], [[6.0]]]] == [3.0, 3.0]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>accum_steps(G, m, d)</C>, raising ValueError unless the global batch divides evenly; <C>step_time(k, t_mb, c, h,
          no_sync=True)</C>, with the all-reduce of cost c hiding h behind the backward pass and running once or after every
          micro-batch; and <C>throughput(G, m, d, t_mb, c, h)</C>, sequences per unit time with <C>no_sync</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def accum_steps(G, m, d):
    return G // m

def step_time(k, t_mb, c, h, no_sync=True):
    return k * (t_mb + c)

def throughput(G, m, d, t_mb, c, h):
    return 0.0
`,
        solution: TIMING,
        tests: [
          { name: "steps", code: `assert accum_steps(96, 2, 8) == 6\ntry:\n    accum_steps(100, 3, 8)\n    assert False\nexcept ValueError:\n    pass` },
          { name: "time", code: `assert step_time(3, 5.0, 4.0, 1.0) == 18.0 and step_time(3, 5.0, 4.0, 1.0, no_sync=False) == 24.0\nassert step_time(2, 5.0, 1.0, 4.0) == 10.0\nassert abs(throughput(48, 2, 4, 5.0, 4.0, 1.0) - 48 / 33) < 1e-12` },
        ],
      },
    },
    {
      key: "best",
      rung: "stretch",
      prompt: (
        <p>
          A global batch of 1536 sequences is trained on 48 GPUs. A micro-batch of m sequences takes 8 + 3m ms, the exposed all-reduce
          is 50 ms with <C>no_sync</C>, and each sequence needs 2.5 GB of activations out of 22 GB free. Over the micro-batch sizes that
          fit and divide the work evenly, what is the shortest step time in milliseconds?
        </p>
      ),
      answer: { kind: "numeric", value: 178, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        Accumulation shrinks activation memory, but every replica still holds full parameters, gradients and optimiser state. The next
        section shards those across the replicas, starting with the three ZeRO stages.
      </p>
    </>
  ),
};
