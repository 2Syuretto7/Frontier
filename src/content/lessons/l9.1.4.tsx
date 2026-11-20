import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { LoraRankViz } from "@/components/viz/LoraRankViz";
import type { LessonContent } from "@/lib/types";

const LORA = `def lora_params(d, k, r):
    return r * (d + k)

def matvec(M, x):
    return [sum(m * xi for m, xi in zip(row, x)) for row in M]

def lora_forward(W0, A, B, x, scale):
    base = matvec(W0, x)
    delta = matvec(B, matvec(A, x))
    return [b + scale * d for b, d in zip(base, delta)]

def merge(W0, A, B, scale):
    r = len(A)
    return [[W0[i][j] + scale * sum(B[i][t] * A[t][j] for t in range(r)) for j in range(len(W0[0]))] for i in range(len(W0))]`;

const BUDGET = `import math

def lora_scale(alpha, r, rank_stabilised=False):
    return alpha / math.sqrt(r) if rank_stabilised else alpha / r

def training_memory(n_params, n_trainable, weight_bytes, state_bytes):
    return n_params * weight_bytes + n_trainable * state_bytes

def rank_for(svals, frac):
    total = sum(s * s for s in svals)
    acc = 0.0
    for i, s in enumerate(svals):
        acc += s * s
        if acc >= frac * total:
            return i + 1
    return len(svals)`;

export const lesson: LessonContent = {
  id: "l9.1.4",
  minutes: 50,
  links: {
    requires: ["l9.1.3", "m3.8.4"],
    revisits: ["m6.4.1", "l8.2.2"],
    foreshadows: ["l9.4.3", "e12.4.2", "e12.5.1"],
  },

  puzzle: (
    <>
      <p>
        Fine-tuning every weight of a 65-billion-parameter model with Adam needs over a terabyte of accelerator memory for
        weights, gradients and optimiser state. QLoRA fine-tuned it on a single 48 GB GPU and matched the quality of full
        16-bit fine-tuning on its benchmarks. It trained less than one per cent as many parameters. Why is so little enough, and
        when is it not?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The previous lesson found that fine-tuning moves weights in few effective directions. LoRA builds that in: each chosen
        weight matrix stays frozen, and the update is constrained to a product of two thin matrices, so it has rank at most r.
        Only the thin matrices are trained, so gradients and optimiser state are tiny, and after training the product can be
        added into the weights, leaving inference unchanged. The cost is expressiveness: an update that needs many directions
        is cut down to r of them.
      </p>
      <LoraRankViz />
    </>
  ),

  theory: (
    <>
      <Definition title="low-rank adaptation">
        <p>
          For a frozen <M>{"W_0 \\in \\mathbb{R}^{d \\times k}"}</M>, LoRA trains <M>{"B \\in \\mathbb{R}^{d \\times r}"}</M> and <M>{"A \\in \\mathbb{R}^{r \\times k}"}</M> and computes
        </p>
        <MD>{"h = W_0 x + s\\,BAx,\\qquad s = \\alpha/r"}</MD>
        <p>
          with <M>{"r(d + k)"}</M> trainable parameters instead of <M>{"dk"}</M> (<C>lora_params</C>, <C>lora_forward</C>). A starts random and B at zero, so
          training starts from the base model exactly. After training, <M>{"W_0 + sBA"}</M> replaces <M>{"W_0"}</M> (<C>merge</C>).
        </p>
        <Code>{LORA}</Code>
      </Definition>

      <Theorem title="what an adapter can represent">
        <p>
          The update <M>{"sBA"}</M> has rank at most r, and the merged layer computes exactly what the adapted layer does. Among all updates
          of rank at most r, the one closest to a desired update <M>{"\\Delta W"}</M> in Frobenius norm is its truncated singular value
          decomposition, with squared error equal to the sum of the squared discarded singular values.
        </p>
      </Theorem>
      <Proof>
        <p>
          The column space of BA lies in that of B, which has r columns, so its rank is at most r. By distributivity,{" "}
          <M>{"W_0x + sB(Ax) = (W_0 + sBA)x"}</M> for every x. The best rank-r approximation is the Eckart–Young theorem (m3.8.4, m6.4.1): writing{" "}
          <M>{"\\Delta W = \\sum_i \\sigma_i u_i v_i^\\top"}</M>, the optimum keeps the r largest terms and leaves error{" "}
          <M>{"\\sum_{i > r}\\sigma_i^2"}</M>. So the number of singular values needed to hold most of an update&apos;s energy (<C>rank_for</C>) is the
          rank an adapter needs.
        </p>
      </Proof>

      <Definition title="memory and scaling">
        <p>
          Training memory is roughly the frozen weights at their storage precision plus, for trainable parameters only, gradients,
          optimiser moments and any higher-precision copy, about 16 bytes each with Adam in mixed precision (<C>training_memory</C>).
          QLoRA stores the frozen weights in 4-bit NormalFloat, quantises the quantisation constants too, and pages optimiser state
          to CPU memory under pressure. The scale <M>{"\\alpha/r"}</M> shrinks updates as r grows, so higher ranks learn more slowly; rank-
          stabilised LoRA uses <M>{"\\alpha/\\sqrt r"}</M> instead (<C>lora_scale</C>).
        </p>
        <Code>{BUDGET}</Code>
      </Definition>

      <Remark title="where to put adapters and when they fall short">
        <p>
          The original paper adapted only the attention projections; later work found that adapting every linear layer,
          including the MLPs, matters more than raising the rank. Adapters need a learning rate around ten times that of full
          fine-tuning. For tasks with little new information, such as instruction following or reinforcement learning, LoRA
          matches full fine-tuning; for absorbing a large new domain, such as continued pretraining on code, it learns less and
          forgets less (l9.1.3). Alternatives include adapter modules inserted between layers, prefix and prompt tuning, which
          learn extra input vectors, and DoRA, which separates the magnitude and direction of each weight column.
        </p>
      </Remark>

      <Example title="serving many adapters">
        <p>
          Because an adapter is small, one server can hold a base model and thousands of adapters, applying a different BA to
          each request in the same batch. S-LoRA and Punica batch these products efficiently, which makes per-customer or
          per-task fine-tunes cheap to serve, a theme of e12.5.1.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>How many trainable parameters does a rank-8 LoRA adapter add to a 4,096 × 11,008 weight matrix?</p>,
      answer: { kind: "numeric", value: 120832, tolerance: 0.5 },
    },
    {
      key: "qlora",
      rung: "check",
      prompt: (
        <p>
          A 7-billion-parameter model is stored at 0.5 bytes per weight, and 40 million adapter parameters cost 16 bytes each in
          training. Ignoring activations, how many gigabytes (10⁹ bytes) does training need? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.14, tolerance: 0.005 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Why is B initialised to zero while A is random?</p>,
      answer: {
        kind: "choice",
        options: [
          "So that BA is zero at the start and training begins exactly from the pretrained model, while A being random lets B receive non-zero gradients",
          "So that the adapter has rank zero for the whole of training",
          "Because zero-initialised matrices train faster in every network",
          "So that the merged weights equal the pretrained weights after training",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def lora_params(d, k, r):
    return r * (d + k)

def matvec(M, x):
    return [sum(m * xi for m, xi in zip(row, x)) for row in M]

def lora_forward(W0, A, B, x, scale):
    base = matvec(W0, x)
    delta = matvec(B, matvec(A, x))
    return [b + scale * d for b, d in zip(base, delta)]

def merge(W0, A, B, scale):
    r = len(A)
    return [[W0[i][j] + scale * sum(B[i][t] * A[t][j] for t in range(r)) for j in range(len(W0[0]))] for i in range(len(W0))]

print(lora_params(6, 4, 2), lora_forward([[1, 0], [0, 1]], [[1, 1]], [[0], [2]], [3, 4], 0.5))
print(merge([[1, 0], [0, 1]], [[1, 1]], [[0], [2]], 0.5), lora_forward([[2, 0]], [[1, 0]], [[0]], [5, 7], 9.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "20 [3.0, 11.0]\n[[1.0, 0.0], [1.0, 2.0]] [10.0]",
          "24 [3.0, 11.0]\n[[1.0, 0.0], [1.0, 2.0]] [10.0]",
          "20 [3.0, 18.0]\n[[1.0, 0.0], [2.0, 3.0]] [10.0]",
          "20 [3.0, 11.0]\n[[1.0, 0.0], [1.0, 2.0]] [55.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def lora_scale(alpha, r, rank_stabilised=False):
    return alpha / math.sqrt(r) if rank_stabilised else alpha / r

def training_memory(n_params, n_trainable, weight_bytes, state_bytes):
    return n_params * weight_bytes + n_trainable * state_bytes

def rank_for(svals, frac):
    total = sum(s * s for s in svals)
    acc = 0.0
    for i, s in enumerate(svals):
        acc += s * s
        if acc >= frac * total:
            return i + 1
    return len(svals)

print(lora_scale(16, 4), lora_scale(16, 4, True), training_memory(10, 2, 2, 16))
print(rank_for([3.0, 2.0, 1.0], 0.9), rank_for([1.0, 1.0], 1.0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "4.0 8.0 52\n2 2",
          "4.0 8.0 52\n3 2",
          "4.0 2.0 52\n2 1",
          "8.0 4.0 36\n2 2",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lora_params(d, k, r)</C>, <C>lora_forward(W0, A, B, x, scale)</C> and <C>merge(W0, A, B, scale)</C>, with matrices as lists of
          rows. A helper <C>matvec</C> is allowed.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def lora_params(d, k, r):
    return d * k

def matvec(M, x):
    return [sum(m * xi for m, xi in zip(row, x)) for row in M]

def lora_forward(W0, A, B, x, scale):
    return matvec(W0, x)

def merge(W0, A, B, scale):
    return W0
`,
        solution: LORA,
        tests: [
          { name: "forward", code: `W0 = [[1.0, 2.0, 0.0], [0.0, 1.0, 1.0]]\nA = [[1.0, 0.0, 1.0], [0.0, 1.0, 0.0]]\nB = [[1.0, 0.0], [2.0, 1.0]]\nx = [1.0, 2.0, 3.0]\nassert lora_forward(W0, A, B, x, 0.5) == [7.0, 10.0] and lora_params(3, 2, 2) == 10` },
          { name: "merge", code: `W0 = [[1.0, 2.0, 0.0], [0.0, 1.0, 1.0]]\nA = [[1.0, 0.0, 1.0], [0.0, 1.0, 0.0]]\nB = [[1.0, 0.0], [2.0, 1.0]]\nWm = merge(W0, A, B, 0.5)\nassert Wm == [[1.5, 2.0, 0.5], [1.0, 1.5, 2.0]] and matvec(Wm, [1.0, 2.0, 3.0]) == lora_forward(W0, A, B, [1.0, 2.0, 3.0], 0.5)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lora_scale(alpha, r, rank_stabilised=False)</C>, <C>training_memory(n_params, n_trainable, weight_bytes, state_bytes)</C> and{" "}
          <C>rank_for(svals, frac)</C>, the smallest number of leading singular values holding at least that fraction of the squared total.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def lora_scale(alpha, r, rank_stabilised=False):
    return alpha

def training_memory(n_params, n_trainable, weight_bytes, state_bytes):
    return n_params * weight_bytes

def rank_for(svals, frac):
    return len(svals)
`,
        solution: BUDGET,
        tests: [
          { name: "scale", code: `assert lora_scale(32, 16) == 2.0 and lora_scale(32, 16, True) == 8.0 and training_memory(100, 10, 1, 12) == 220` },
          { name: "rank", code: `assert rank_for([4.0, 2.0, 1.0, 1.0, 0.5], 0.8) == 2 and rank_for([4.0, 2.0, 1.0, 1.0, 0.5], 0.95) == 4 and rank_for([1.0, 1.0, 1.0, 1.0], 0.6) == 3` },
        ],
      },
    },
    {
      key: "rs",
      rung: "stretch",
      prompt: (
        <p>
          With α = 16 and rank 128, how many times larger is the rank-stabilised scale <M>{"\\alpha/\\sqrt r"}</M> than the standard scale{" "}
          <M>{"\\alpha/r"}</M>? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 11.31, tolerance: 0.005 },
    },
  ],

  glimpse: (
    <>
      <p>
        Fine-tuning on demonstrations copies their answers. The next module copies something richer: the full predictive
        distribution of a stronger teacher model, token by token.
      </p>
    </>
  ),
};
