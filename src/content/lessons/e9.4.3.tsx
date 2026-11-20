import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlashBackwardViz } from "@/components/viz/FlashBackwardViz";
import type { LessonContent } from "@/lib/types";

const REF = `import math

def mm(A, B):
    return [[sum(a * b for a, b in zip(row, col)) for col in zip(*B)] for row in A]

def softmax_rows(S):
    out = []
    for z in S:
        m = max(z)
        e = [math.exp(x - m) for x in z]
        out.append([x / sum(e) for x in e])
    return out

def attention_backward(Q, K, V, dO):
    P = softmax_rows(mm(Q, [list(c) for c in zip(*K)]))
    O = mm(P, V)
    dV = mm([list(c) for c in zip(*P)], dO)       # dV = P^T dO
    dP = mm(dO, [list(c) for c in zip(*V)])       # dP = dO V^T
    D = [sum(a * b for a, b in zip(do, o)) for do, o in zip(dO, O)]
    dS = [[p * (g - Di) for p, g in zip(pr, gr)] for pr, gr, Di in zip(P, dP, D)]
    return mm(dS, K), mm([list(c) for c in zip(*dS)], Q), dV`;

const BWD = `import math

def delta(O, dO):
    return [sum(a * b for a, b in zip(o, do)) for o, do in zip(O, dO)]

def lse_rows(Q, K):
    out = []
    for q in Q:
        z = [sum(a * b for a, b in zip(q, k)) for k in K]
        m = max(z)
        out.append(m + math.log(sum(math.exp(x - m) for x in z)))
    return out

def flash_backward(Q, K, V, O, dO, L, Br, Bc):
    d = len(Q[0])
    D = delta(O, dO)                              # a cheap preprocessing pass
    dQ = [[0.0] * d for _ in Q]
    dK, dV = [], []
    for j in range(0, len(K), Bc):                # one program per key block
        Kj, Vj = K[j:j + Bc], V[j:j + Bc]
        dk = [[0.0] * d for _ in Kj]
        dv = [[0.0] * len(V[0]) for _ in Vj]
        for i in range(0, len(Q), Br):            # walk over query blocks
            for r in range(i, min(i + Br, len(Q))):
                p = [math.exp(sum(a * b for a, b in zip(Q[r], k)) - L[r]) for k in Kj]   # recompute P
                dp = [sum(a * b for a, b in zip(dO[r], v)) for v in Vj]
                ds = [pc * (g - D[r]) for pc, g in zip(p, dp)]
                for c in range(len(Kj)):
                    dv[c] = [x + p[c] * y for x, y in zip(dv[c], dO[r])]
                    dk[c] = [x + ds[c] * y for x, y in zip(dk[c], Q[r])]
                    dQ[r] = [x + ds[c] * y for x, y in zip(dQ[r], Kj[c])]   # shared: atomic in a kernel
        dK += dk
        dV += dv
    return dQ, dK, dV`;

const KERNEL = `@triton.jit
def flash_bwd(Q, K, V, dO, L, Dl, dQ, dK, dV, N, D: tl.constexpr, BR: tl.constexpr,
              BC: tl.constexpr):
    j = tl.program_id(0)                          # one program per block of BC keys
    cols = j * BC + tl.arange(0, BC)
    d = tl.arange(0, D)
    k = tl.load(K + cols[:, None] * D + d[None, :])
    v = tl.load(V + cols[:, None] * D + d[None, :])
    dk = tl.zeros((BC, D), tl.float32)
    dv = tl.zeros((BC, D), tl.float32)
    for i in range(0, N, BR):                     # walk over query blocks
        rows = i + tl.arange(0, BR)
        q = tl.load(Q + rows[:, None] * D + d[None, :])
        do = tl.load(dO + rows[:, None] * D + d[None, :])
        p = tl.exp(tl.dot(q, tl.trans(k)) - tl.load(L + rows)[:, None])   # recompute P
        dv += tl.dot(tl.trans(p.to(do.dtype)), do)
        dp = tl.dot(do, tl.trans(v))
        ds = p * (dp - tl.load(Dl + rows)[:, None])
        dk += tl.dot(tl.trans(ds.to(q.dtype)), q)
        tl.atomic_add(dQ + rows[:, None] * D + d[None, :], tl.dot(ds.to(k.dtype), k))
    tl.store(dK + cols[:, None] * D + d[None, :], dk)
    tl.store(dV + cols[:, None] * D + d[None, :], dv)`;

export const lesson: LessonContent = {
  id: "e9.4.3",
  minutes: 60,
  links: {
    requires: ["e9.4.2", "m5.4.4"],
    revisits: ["e5.2.3", "e9.1.4"],
    foreshadows: ["e9.6.2"],
  },

  puzzle: (
    <>
      <p>
        Backpropagation through softmax needs the probabilities P, and the FlashAttention forward pass threw them away. Recomputing
        them costs another matrix multiplication per tile. Worse, the softmax gradient for a single score involves a sum over the whole
        row of P times the incoming gradient, and the row is never in one place. How does the backward pass get that row sum without
        materialising the row?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Recomputing is cheap compared with storing: one extra tile multiplication against reading and writing an N by N matrix. With the
        log-sum-exp L saved by the forward pass, P for any tile is just <M>{"e^{S - L}"}</M>, with no running maximum needed. The row sum
        turns out to be the dot product of two vectors the backward pass already has: the output gradient dO and the output O itself.
        What remains is bookkeeping: each tile contributes to three gradients, and programs must agree on who adds what where.
      </p>
      <FlashBackwardViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the attention gradients">
        <p>
          With <M>{"S = QK^\\top"}</M> (Q pre-scaled), <M>{"P = \\operatorname{softmax}(S)"}</M> by rows, and <M>{"O = PV"}</M>, the
          gradients of a loss with respect to the inputs, given dO, are
        </p>
        <p>
          <M>{"dV = P^\\top dO,\\quad dP = dO\\,V^\\top,\\quad dS_{ij} = P_{ij}(dP_{ij} - D_i),\\quad dQ = dS\\,K,\\quad dK = dS^\\top Q,"}</M>
        </p>
        <p>
          where <M>{"D_i = \\sum_j P_{ij}\\,dP_{ij}"}</M>. The reference below computes them from the full matrices.
        </p>
        <Code>{REF}</Code>
      </Definition>

      <Theorem title="the row statistic">
        <p>
          The softmax backward rule above is correct, and <M>{"D_i = dO_i \\cdot O_i"}</M>. Consequently every row of dS sums to zero.
        </p>
      </Theorem>
      <Proof>
        <p>
          For one row, <M>{"\\partial P_k / \\partial S_j = P_k(\\delta_{kj} - P_j)"}</M>, so{" "}
          <M>{"dS_j = \\sum_k dP_k P_k(\\delta_{kj} - P_j) = P_j dP_j - P_j \\sum_k P_k dP_k = P_j(dP_j - D)"}</M>. Since{" "}
          <M>{"dP_k = dO \\cdot V_k"}</M>,{" "}
          <M>{"D = \\sum_k P_k (dO \\cdot V_k) = dO \\cdot \\sum_k P_k V_k = dO \\cdot O"}</M>. Finally{" "}
          <M>{"\\sum_j dS_j = \\sum_j P_j dP_j - D\\sum_j P_j = D - D = 0"}</M>, as expected for a function invariant to adding a
          constant to every score.
        </p>
      </Proof>

      <Definition title="the FlashAttention backward pass">
        <p>
          A preprocessing kernel computes <M>{"D = \\operatorname{rowsum}(dO \\circ O)"}</M>, which reads two N by d tensors. The main
          kernel gives each program a block of keys, keeps <M>{"K_j, V_j"}</M> and accumulators for <M>{"dK_j, dV_j"}</M> on chip, and
          walks over query blocks: it recomputes <M>{"S = Q_i K_j^\\top"}</M> and <M>{"P = e^{S - L_i}"}</M>, adds{" "}
          <M>{"P^\\top dO_i"}</M> to dV, forms <M>{"dP = dO_i V_j^\\top"}</M> and dS, adds <M>{"dS^\\top Q_i"}</M> to dK, and adds{" "}
          <M>{"dS K_j"}</M> to <M>{"dQ_i"}</M> in global memory with atomic additions, since many programs contribute to the same query
          block. With a pre-scaled Q, the gradient for the unscaled queries is dQ times the scale.
        </p>
        <Code>{KERNEL}</Code>
        <Code>{BWD}</Code>
      </Definition>

      <Remark title="cost">
        <p>
          The forward pass does two tile multiplications (S and PV); the backward does five (S again, dV, dP, dK, dQ), so its FLOPs are
          2.5 times the forward&apos;s and a training step costs 3.5 forward passes of attention arithmetic. Atomic float additions make
          dQ depend on the order in which programs finish, so the result is not bit-reproducible run to run. Kernels that need
          determinism compute dQ in a second kernel that owns query blocks, recomputing S and dP once more, seven multiplications instead
          of five, or accumulate partial dQ tiles in separate buffers and sum them in a fixed order.
        </p>
      </Remark>

      <Remark title="precision">
        <p>
          P is recomputed from the saved L, so forward and backward see the same probabilities only if both compute S identically;
          kernels keep the same block sizes and accumulation order for S in both passes. D, dS and the accumulators are float32, and
          tiles are cast to 16-bit only as operands of tensor core multiplications.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The row sum <M>{"\\sum_j P_{ij} dP_{ij}"}</M> equals <M>{"dO_i \\cdot O_i"}</M>, a d-term dot product computed once per row
          before the main loop. With it and the saved log-sum-exp, every tile of the backward pass is self-contained: rebuild P, form
          dS, and add three contributions. The price is recomputation, about one extra tile multiplication in five, and some care with
          shared gradients.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ds",
      rung: "check",
      prompt: (
        <p>
          A row of attention probabilities is P = (0.2, 0.8) and the incoming gradient for that row is dP = (1, 3). What is the first
          entry of dS? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: -0.32, tolerance: 0.001 },
    },
    {
      key: "flops",
      rung: "check",
      prompt: (
        <p>
          A causal attention layer with 32 heads, sequence length 8192 and head dimension 128 runs its FlashAttention backward pass at an
          effective 500 TFLOP/s. Counting 2N²d FLOPs per full N by N tile multiplication, five per backward pass, and half of them under
          the causal mask, how many milliseconds does it take? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.749, tolerance: 0.001 },
    },
    {
      key: "det",
      rung: "apply",
      prompt: <p>Which change makes the backward pass produce bit-identical dQ from run to run?</p>,
      answer: {
        kind: "choice",
        options: [
          "Compute dQ in a separate kernel in which each program owns a query block",
          "Use float32 for the atomic additions instead of bfloat16",
          "Launch more programs so that each does less work",
          "Store P in the forward pass instead of recomputing it",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

def mm(A, B):
    return [[sum(a * b for a, b in zip(row, col)) for col in zip(*B)] for row in A]

def softmax_rows(S):
    out = []
    for z in S:
        m = max(z)
        e = [math.exp(x - m) for x in z]
        out.append([x / sum(e) for x in e])
    return out

def attention_backward(Q, K, V, dO):
    P = softmax_rows(mm(Q, [list(c) for c in zip(*K)]))
    O = mm(P, V)
    dV = mm([list(c) for c in zip(*P)], dO)       # dV = P^T dO
    dP = mm(dO, [list(c) for c in zip(*V)])       # dP = dO V^T
    D = [sum(a * b for a, b in zip(do, o)) for do, o in zip(dO, O)]
    dS = [[p * (g - Di) for p, g in zip(pr, gr)] for pr, gr, Di in zip(P, dP, D)]
    return mm(dS, K), mm([list(c) for c in zip(*dS)], Q), dV

g = attention_backward([[1.0]], [[0.0], [1.0]], [[2.0], [6.0]], [[1.0]])
print([[round(p, 3) for p in r] for r in softmax_rows([[0.0, math.log(3.0)]])], mm([[1.0, 2.0]], [[3.0], [4.0]]), [[round(x, 3) for x in r] for r in g[0] + g[1] + g[2]])`}</Code>
          <p>What does this print? (The last list holds dQ, then the rows of dK, then the rows of dV.)</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.25, 0.75]] [[11.0]] [[0.786], [-0.786], [0.786], [0.269], [0.731]]",
          "[[0.25, 0.75]] [[11.0]] [[4.386], [0.538], [4.386], [0.269], [0.731]]",
          "[[0.25, 0.75]] [[11.0]] [[0.786], [-0.786], [0.786], [0.731], [0.269]]",
          "[[0.25, 0.75]] [[3.0, 8.0]] [[0.786], [-0.786], [0.786], [0.269], [0.731]]",
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

def delta(O, dO):
    return [sum(a * b for a, b in zip(o, do)) for o, do in zip(O, dO)]

def lse_rows(Q, K):
    out = []
    for q in Q:
        z = [sum(a * b for a, b in zip(q, k)) for k in K]
        m = max(z)
        out.append(m + math.log(sum(math.exp(x - m) for x in z)))
    return out

def flash_backward(Q, K, V, O, dO, L, Br, Bc):
    d = len(Q[0])
    D = delta(O, dO)                              # a cheap preprocessing pass
    dQ = [[0.0] * d for _ in Q]
    dK, dV = [], []
    for j in range(0, len(K), Bc):                # one program per key block
        Kj, Vj = K[j:j + Bc], V[j:j + Bc]
        dk = [[0.0] * d for _ in Kj]
        dv = [[0.0] * len(V[0]) for _ in Vj]
        for i in range(0, len(Q), Br):            # walk over query blocks
            for r in range(i, min(i + Br, len(Q))):
                p = [math.exp(sum(a * b for a, b in zip(Q[r], k)) - L[r]) for k in Kj]   # recompute P
                dp = [sum(a * b for a, b in zip(dO[r], v)) for v in Vj]
                ds = [pc * (g - D[r]) for pc, g in zip(p, dp)]
                for c in range(len(Kj)):
                    dv[c] = [x + p[c] * y for x, y in zip(dv[c], dO[r])]
                    dk[c] = [x + ds[c] * y for x, y in zip(dk[c], Q[r])]
                    dQ[r] = [x + ds[c] * y for x, y in zip(dQ[r], Kj[c])]   # shared: atomic in a kernel
        dK += dk
        dV += dv
    return dQ, dK, dV

Q, K, V, dO = [[1.0]], [[0.0], [0.0]], [[1.0], [3.0]], [[1.0]]
print(delta([[2.0]], dO), [round(x, 3) for x in lse_rows(Q, K)], [[round(x, 3) for x in r] for g in flash_backward(Q, K, V, [[2.0]], dO, lse_rows(Q, K), 1, 1) for r in g])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[2.0] [0.693] [[0.0], [-0.5], [0.5], [0.5], [0.5]]",
          "[2.0] [0.0] [[0.0], [-0.5], [0.5], [0.5], [0.5]]",
          "[2.0] [0.693] [[0.0], [0.5], [-0.5], [0.5], [0.5]]",
          "[2.0] [0.693] [[0.0], [-1.0], [1.0], [1.0], [1.0]]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mm(A, B)</C> for lists of rows; <C>softmax_rows(S)</C>, stable by rows; and{" "}
          <C>attention_backward(Q, K, V, dO)</C>, returning (dQ, dK, dV) by the formulas of the definition, with Q already scaled.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def mm(A, B):
    return [[0.0] * len(B[0]) for _ in A]

def softmax_rows(S):
    return S

def attention_backward(Q, K, V, dO):
    return Q, K, V
`,
        solution: REF,
        tests: [
          { name: "helpers", code: `import math\nassert mm([[1.0, 2.0], [0.0, 1.0]], [[1.0, 0.0], [3.0, 1.0]]) == [[7.0, 2.0], [3.0, 1.0]]\nP = softmax_rows([[1000.0, 1000.0 + math.log(4.0)]])\nassert abs(P[0][0] - 0.2) < 1e-12 and abs(P[0][1] - 0.8) < 1e-12` },
          { name: "gradients", code: `import math\nQ = [[0.3, -0.2], [0.1, 0.4], [-0.5, 0.2]]\nK = [[0.2, 0.1], [-0.3, 0.5], [0.4, -0.1], [0.0, 0.3]]\nV = [[1.0, 0.0], [0.5, -1.0], [-0.5, 2.0], [0.2, 0.3]]\ndO = [[1.0, 0.5], [-0.3, 0.2], [0.4, -1.0]]\ndef loss(Q, K, V):\n    O = mm(softmax_rows(mm(Q, [list(c) for c in zip(*K)])), V)\n    return sum(a * b for r, g in zip(O, dO) for a, b in zip(r, g))\ndQ, dK, dV = attention_backward(Q, K, V, dO)\nh = 1e-6\nfor X, G in ((Q, dQ), (K, dK), (V, dV)):\n    for r in range(len(X)):\n        for c in range(2):\n            X[r][c] += h\n            up = loss(Q, K, V)\n            X[r][c] -= 2 * h\n            dn = loss(Q, K, V)\n            X[r][c] += h\n            assert abs((up - dn) / (2 * h) - G[r][c]) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>delta(O, dO)</C>, the row statistic of the theorem; <C>lse_rows(Q, K)</C>, the log-sum-exp of each row of scores; and{" "}
          <C>flash_backward(Q, K, V, O, dO, L, Br, Bc)</C>, which loops over key blocks and then query blocks, recomputing P from L, and
          returns (dQ, dK, dV).
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def delta(O, dO):
    return [0.0 for _ in O]

def lse_rows(Q, K):
    return [0.0 for _ in Q]

def flash_backward(Q, K, V, O, dO, L, Br, Bc):
    return Q, K, V
`,
        solution: BWD,
        tests: [
          { name: "stats", code: `import math\nassert delta([[1.0, 2.0], [0.5, 0.0]], [[3.0, -1.0], [2.0, 7.0]]) == [1.0, 1.0]\nL = lse_rows([[1.0]], [[0.0], [math.log(3.0)]])\nassert abs(L[0] - math.log(4.0)) < 1e-12` },
          { name: "blocked", code: `import math\nQ = [[0.3, -0.2], [0.1, 0.4], [-0.5, 0.2], [0.2, 0.2], [0.0, -0.3]]\nK = [[0.2, 0.1], [-0.3, 0.5], [0.4, -0.1], [0.0, 0.3]]\nV = [[1.0, 0.0], [0.5, -1.0], [-0.5, 2.0], [0.2, 0.3]]\ndO = [[1.0, 0.5], [-0.3, 0.2], [0.4, -1.0], [0.1, 0.1], [-0.2, 0.6]]\nS = [[sum(a * b for a, b in zip(q, k)) for k in K] for q in Q]\nP = [[math.exp(x) / sum(math.exp(y) for y in z) for x in z] for z in S]\nO = [[sum(p * v[c] for p, v in zip(pr, V)) for c in range(2)] for pr in P]\ndV = [[sum(P[r][j] * dO[r][c] for r in range(5)) for c in range(2)] for j in range(4)]\ndP = [[sum(a * b for a, b in zip(dO[r], V[j])) for j in range(4)] for r in range(5)]\nD = [sum(a * b for a, b in zip(dO[r], O[r])) for r in range(5)]\ndS = [[P[r][j] * (dP[r][j] - D[r]) for j in range(4)] for r in range(5)]\ndQ = [[sum(dS[r][j] * K[j][c] for j in range(4)) for c in range(2)] for r in range(5)]\ndK = [[sum(dS[r][j] * Q[r][c] for r in range(5)) for c in range(2)] for j in range(4)]\nL = lse_rows(Q, K)\nfor Br, Bc in ((1, 1), (2, 3), (5, 4)):\n    g = flash_backward(Q, K, V, O, dO, L, Br, Bc)\n    for G, R in zip(g, (dQ, dK, dV)):\n        assert len(G) == len(R) and all(abs(a - b) < 1e-12 for x, y in zip(G, R) for a, b in zip(x, y))` },
        ],
      },
    },
    {
      key: "chain",
      rung: "stretch",
      prompt: (
        <p>
          One query q = (1) attends to two keys (0) and (2) with values (1) and (3), and the output gradient is dO = (1). Q is already
          scaled. What is dQ? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.42, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        These kernels issue loads and tensor core instructions one tile at a time and hope the hardware overlaps them. The newest GPUs
        add asynchronous copy engines, warp-group matrix instructions and on-chip memory for accumulators, which the final lesson of this
        chapter puts to use.
      </p>
    </>
  ),
};
