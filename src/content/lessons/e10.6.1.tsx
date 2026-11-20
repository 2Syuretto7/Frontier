import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ExpertDispatchViz } from "@/components/viz/ExpertDispatchViz";
import type { LessonContent } from "@/lib/types";

const LAYER = `import numpy as np

def permute(flat_ids, E):
    order = np.argsort(flat_ids, kind='stable')     # group the (token, slot) rows by expert
    return order, np.bincount(flat_ids, minlength=E)

def counts_matrix(expert_ids, token_rank, E, R):
    C = np.zeros((R, R), dtype=int)                 # exchanged first, so receivers can size buffers
    for t, row in enumerate(expert_ids):
        for e in row:
            C[token_rank[t], e // (E // R)] += 1     # experts are placed contiguously on ranks
    return C

def ep_forward(x, expert_ids, gates, W):
    T, k = expert_ids.shape
    order, counts = permute(expert_ids.ravel(), len(W))
    rows = x[order // k]                            # dispatch: slot i belongs to token i // k
    out, start = np.empty((len(rows), W[0].shape[1])), 0
    for e, c in enumerate(counts):                  # each expert runs on the rows it received
        out[start:start + c] = rows[start:start + c] @ W[e]
        start += c
    back = np.empty_like(out)
    back[order] = out                               # combine: undo the permutation
    return (back.reshape(T, k, -1) * gates[:, :, None]).sum(axis=1)`;

const COST = `def a2a_bytes(T, k, d, ep):
    return 2 * T * k * d * 2 * (ep - 1) / ep       # dispatch and combine, bf16, the share leaving the rank

def expert_time(T, k, d, h, F):
    return T * k * 6 * d * h / F                    # three d-by-h matrices per gated expert, forward

def comm_ratio(T, k, d, h, ep, F, B):
    return a2a_bytes(T, k, d, ep) / B / expert_time(T, k, d, h, F)`;

export const lesson: LessonContent = {
  id: "e10.6.1",
  minutes: 50,
  links: {
    requires: ["e8.2.3", "l8.3.1", "e10.4.1"],
    revisits: ["l8.3.3", "e8.2.5"],
    foreshadows: ["e10.6.2", "e10.7.1"],
  },

  puzzle: (
    <>
      <p>
        A mixture-of-experts layer with 256 experts has far more parameters than one GPU holds, but each token uses only 8 of them.
        Expert parallelism places different experts on different GPUs and moves each token to its experts and back. The arithmetic
        per token is small, so does the moving cost more than the computing, and what can be done about it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Each rank routes its tokens (l8.3.1), sorts the resulting token slots by destination expert, and sends each group to the rank
        that holds that expert with one all-to-all (e8.2.3). The experts run on what arrives, and a second all-to-all sends the results
        back, where they are put back in token order and summed with the gate weights. Both exchanges carry k copies of every
        token&apos;s activation, while the expert does only a few small matrix products on each, so the exchange easily rivals the
        compute.
      </p>
      <ExpertDispatchViz />
    </>
  ),

  theory: (
    <>
      <Definition title="dispatch and combine">
        <p>
          With T tokens on a rank and top-k routing, the T·k slots are sorted stably by expert (<C>permute</C>). Ranks first exchange
          the counts they will send to each other (<C>counts_matrix</C>), so that each can size its receive buffer, then the rows
          themselves. After the experts run, the reverse all-to-all returns the rows, the inverse permutation restores slot order,
          and each token&apos;s output is the gate-weighted sum of its k rows (<C>ep_forward</C>).
        </p>
        <Code>{LAYER}</Code>
      </Definition>

      <Theorem title="dispatch and combine are exact">
        <p>
          The expert-parallel output equals <M>{"\\sum_{i=1}^{k} g_{t,i}\\,E_{e_{t,i}}(x_t)"}</M> for every token t, the output of
          the layer computed on one device.
        </p>
      </Theorem>
      <Proof>
        <p>
          Slot <M>{"tk + i"}</M> carries <M>{"x_t"}</M> and is processed by expert <M>{"e_{t,i}"}</M>, wherever it is sent. The
          permutation and its inverse compose to the identity, so after the combine the row at slot <M>{"tk + i"}</M> is{" "}
          <M>{"E_{e_{t,i}}(x_t)"}</M>; reshaping to T by k rows and weighting by the gates gives the sum.
        </p>
      </Proof>

      <Theorem title="communication against compute">
        <p>
          With expert parallelism over ep ranks, uniform routing, bf16 activations of width d, gated experts of hidden width h,
          throughput F and all-to-all bandwidth B per GPU, the ratio of exchange time to expert compute time is
        </p>
        <MD>{"\\frac{2F}{3hB}\\cdot\\frac{ep - 1}{ep},"}</MD>
        <p>independent of the number of tokens, k and d.</p>
      </Theorem>
      <Proof>
        <p>
          Dispatch and combine each send <M>{"Tkd"}</M> values of 2 bytes, of which a share <M>{"(ep-1)/ep"}</M> leaves the rank (
          <C>a2a_bytes</C>). A gated expert applies three d by h matrices, <M>{"6dh"}</M> FLOPs per slot forward (
          <C>expert_time</C>). Dividing <M>{"4Tkd(ep-1)/(ep\\,B)"}</M> by <M>{"6Tkdh/F"}</M> leaves the ratio (<C>comm_ratio</C>).
        </p>
        <Code>{COST}</Code>
      </Proof>

      <Remark title="what systems do about it">
        <p>
          Fine-grained experts make h small (l8.3.4), which pushes the ratio above one across nodes. Three remedies are common.
          Overlap: split the batch into two halves and run one half&apos;s all-to-all during the other half&apos;s attention and
          expert compute. Topology: keep expert parallelism inside a node where bandwidth is high, or limit each token to experts on a
          few nodes and send one copy per node, forwarding it to the right GPUs over the faster links inside the node. Capacity: fixed
          buffer sizes make the all-to-all regular, at the cost of dropped tokens (l8.3.3).
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The moving can indeed cost more than the computing: with fine-grained experts and inter-node bandwidth, the ratio above is
          around two or more. Expert parallelism remains worthwhile because it is the only way to hold all the experts without
          replicating them, and the exchange can be overlapped and kept within fast links. How evenly the tokens spread over the
          experts then decides how long everyone waits for the busiest one, the subject of the next lesson.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "bytes",
      rung: "check",
      prompt: (
        <p>
          Each rank holds 8192 tokens of width 7168 in bf16, routes each to 8 experts, and experts are spread over 64 ranks. How many
          gigabytes does a rank send for dispatch and combine together in one layer&apos;s forward pass? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 1.85, tolerance: 0.01 },
    },
    {
      key: "ratio",
      rung: "check",
      prompt: (
        <p>
          With gated experts of hidden width 2048, 400 TFLOP/s, 50 GB/s of all-to-all bandwidth and expert parallelism over 64 ranks,
          what is the ratio of exchange time to expert compute time? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.56, tolerance: 0.01 },
    },
    {
      key: "counts",
      rung: "apply",
      prompt: <p>Why do ranks exchange counts before the rows themselves?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each rank receives a different number of rows from each other rank, set by the routing, and must allocate buffers of the right size",
          "The counts determine the gate weights",
          "All-to-all requires every rank to send the same number of rows",
          "Counts are needed to undo the permutation",
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

def permute(flat_ids, E):
    order = np.argsort(flat_ids, kind='stable')     # group the (token, slot) rows by expert
    return order, np.bincount(flat_ids, minlength=E)

def counts_matrix(expert_ids, token_rank, E, R):
    C = np.zeros((R, R), dtype=int)                 # exchanged first, so receivers can size buffers
    for t, row in enumerate(expert_ids):
        for e in row:
            C[token_rank[t], e // (E // R)] += 1     # experts are placed contiguously on ranks
    return C

def ep_forward(x, expert_ids, gates, W):
    T, k = expert_ids.shape
    order, counts = permute(expert_ids.ravel(), len(W))
    rows = x[order // k]                            # dispatch: slot i belongs to token i // k
    out, start = np.empty((len(rows), W[0].shape[1])), 0
    for e, c in enumerate(counts):                  # each expert runs on the rows it received
        out[start:start + c] = rows[start:start + c] @ W[e]
        start += c
    back = np.empty_like(out)
    back[order] = out                               # combine: undo the permutation
    return (back.reshape(T, k, -1) * gates[:, :, None]).sum(axis=1)

order, counts = permute(np.array([1, 0, 1, 2]), 3)
print(order.tolist(), counts.tolist(), counts_matrix(np.array([[1], [0], [1], [2]]), [0, 0, 1, 1], 4, 2).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 0, 2, 3] [1, 2, 1] [[2, 0], [1, 1]]",
          "[1, 0, 2, 3] [1, 2, 1] [[2, 1], [0, 1]]",
          "[0, 1, 2, 3] [1, 2, 1] [[2, 0], [1, 1]]",
          "[1, 0, 2, 3] [2, 1, 1] [[2, 0], [1, 1]]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def a2a_bytes(T, k, d, ep):
    return 2 * T * k * d * 2 * (ep - 1) / ep       # dispatch and combine, bf16, the share leaving the rank

def expert_time(T, k, d, h, F):
    return T * k * 6 * d * h / F                    # three d-by-h matrices per gated expert, forward

def comm_ratio(T, k, d, h, ep, F, B):
    return a2a_bytes(T, k, d, ep) / B / expert_time(T, k, d, h, F)

x = a2a_bytes(4, 2, 8, 4)
print(x, expert_time(4, 2, 8, 16, 3072.0), round(comm_ratio(4, 2, 8, 16, 4, 3072.0, 2.0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["192.0 2.0 48.0", "256.0 2.0 64.0", "192.0 2.0 96.0", "96.0 2.0 24.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>permute(flat_ids, E)</C>, returning a stable order grouping slots by expert and the count per expert;{" "}
          <C>counts_matrix(expert_ids, token_rank, E, R)</C>, slots sent from each rank to each rank when experts are placed
          contiguously; and <C>ep_forward(x, expert_ids, gates, W)</C>, dispatching, applying expert e as the matrix W[e], and
          combining.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def permute(flat_ids, E):
    return np.arange(len(flat_ids)), np.zeros(E, dtype=int)

def counts_matrix(expert_ids, token_rank, E, R):
    return np.zeros((R, R), dtype=int)

def ep_forward(x, expert_ids, gates, W):
    return x
`,
        solution: LAYER,
        tests: [
          { name: "permute", code: `o, c = permute(np.array([2, 0, 2, 1, 0]), 4)\nassert o.tolist() == [1, 4, 3, 0, 2] and c.tolist() == [2, 1, 2, 0]\nassert counts_matrix(np.array([[0, 3], [1, 2]]), [0, 1], 4, 2).tolist() == [[1, 1], [1, 1]]\nassert counts_matrix(np.array([[3], [3], [0]]), [0, 0, 1], 4, 2).tolist() == [[0, 2], [1, 0]]` },
          { name: "forward", code: `rng = np.random.default_rng(6)\nx, ids, g = rng.normal(size=(6, 3)), rng.integers(0, 4, size=(6, 2)), rng.random((6, 2))\nW = [rng.normal(size=(3, 3)) for _ in range(4)]\nref = np.array([sum(g[t, i] * x[t] @ W[ids[t, i]] for i in range(2)) for t in range(6)])\nassert np.allclose(ep_forward(x, ids, g, W), ref)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>a2a_bytes(T, k, d, ep)</C>, bytes a rank sends for dispatch and combine; <C>expert_time(T, k, d, h, F)</C>, the
          forward time of gated experts on the T·k slots; and <C>comm_ratio(T, k, d, h, ep, F, B)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def a2a_bytes(T, k, d, ep):
    return T * k * d

def expert_time(T, k, d, h, F):
    return 1.0

def comm_ratio(T, k, d, h, ep, F, B):
    return 0.0
`,
        solution: COST,
        tests: [
          { name: "bytes", code: `assert a2a_bytes(10, 3, 5, 2) == 300.0 and expert_time(2, 1, 3, 4, 8.0) == 18.0` },
          { name: "ratio", code: `assert abs(comm_ratio(1, 1, 1, 3, 2, 6.0, 1.0) - 2 / 3) < 1e-12 and abs(comm_ratio(7, 3, 5, 3, 2, 6.0, 1.0) - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "width",
      rung: "stretch",
      prompt: (
        <p>
          With 400 TFLOP/s, 50 GB/s and expert parallelism over 64 ranks, what is the smallest expert hidden width for which the
          expert compute takes at least as long as the exchange?
        </p>
      ),
      answer: { kind: "numeric", value: 5250, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        The ratio above assumed every expert receives the same number of tokens. Routing is never that even, and the busiest expert
        sets the pace. The next lesson measures the imbalance and the tools that limit it.
      </p>
    </>
  ),
};
