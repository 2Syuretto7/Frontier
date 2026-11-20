import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { FlashTileViz } from "@/components/viz/FlashTileViz";
import type { LessonContent } from "@/lib/types";

const FWD = `import math

def scores(Qb, Kb):
    return [[sum(q * k for q, k in zip(qr, kr)) for kr in Kb] for qr in Qb]

def attention_ref(Q, K, V):
    out = []
    for z in scores(Q, K):                        # the whole N x N matrix, row by row
        m = max(z)
        p = [math.exp(x - m) for x in z]
        out.append([sum(pi * v[j] for pi, v in zip(p, V)) / sum(p) for j in range(len(V[0]))])
    return out

def flash_forward(Q, K, V, Br, Bc):
    d = len(V[0])
    O, L = [], []
    for i in range(0, len(Q), Br):                # one program per block of queries
        Qi = Q[i:i + Br]
        m = [-math.inf] * len(Qi)
        l = [0.0] * len(Qi)
        acc = [[0.0] * d for _ in Qi]
        for j in range(0, len(K), Bc):            # walk along the keys
            S = scores(Qi, K[j:j + Bc])
            for r, z in enumerate(S):
                m_new = max(m[r], max(z))
                f = math.exp(m[r] - m_new)
                p = [math.exp(x - m_new) for x in z]
                l[r] = l[r] * f + sum(p)
                acc[r] = [a * f + sum(pi * v[c] for pi, v in zip(p, V[j:j + Bc])) for c, a in enumerate(acc[r])]
                m[r] = m_new
        O += [[a / l[r] for a in acc[r]] for r in range(len(Qi))]
        L += [m[r] + math.log(l[r]) for r in range(len(Qi))]   # saved for the backward pass
    return O, L`;

const IO = `def tiles_computed(N, Br, Bc, causal):
    count = 0
    for i in range(N // Br):
        for j in range(N // Bc):
            if not causal or j * Bc <= (i + 1) * Br - 1:   # some key in block j precedes some query in block i
                count += 1
    return count

def hbm_standard(N, d):
    return 4 * N * N + 4 * N * d                  # elements: S and P written and read, plus Q, K, V, O

def hbm_flash(N, d, Br, Bc, causal):
    return 2 * N * d + tiles_computed(N, Br, Bc, causal) * 2 * Bc * d`;

const KERNEL = `@triton.jit
def flash_fwd(Q, K, V, O, L, N, D: tl.constexpr, BR: tl.constexpr, BC: tl.constexpr,
              CAUSAL: tl.constexpr):
    i = tl.program_id(0)                          # one program per block of BR queries
    rows = i * BR + tl.arange(0, BR)
    d = tl.arange(0, D)
    q = tl.load(Q + rows[:, None] * D + d[None, :])          # stays on chip throughout
    m = tl.full((BR,), -float("inf"), tl.float32)
    l = tl.zeros((BR,), tl.float32)
    acc = tl.zeros((BR, D), tl.float32)
    end = (i + 1) * BR if CAUSAL else N           # causal: stop after the diagonal block
    for j in range(0, end, BC):
        cols = j + tl.arange(0, BC)
        k = tl.load(K + cols[:, None] * D + d[None, :])
        v = tl.load(V + cols[:, None] * D + d[None, :])
        s = tl.dot(q, tl.trans(k))                # BR x BC scores; q is pre-scaled by 1/sqrt(D)
        if CAUSAL:
            s = tl.where(rows[:, None] >= cols[None, :], s, -float("inf"))
        m_new = tl.maximum(m, tl.max(s, axis=1))
        p = tl.exp(s - m_new[:, None])
        f = tl.exp(m - m_new)
        l = l * f + tl.sum(p, axis=1)
        acc = acc * f[:, None] + tl.dot(p.to(v.dtype), v)
        m = m_new
    tl.store(O + rows[:, None] * D + d[None, :], acc / l[:, None])
    tl.store(L + rows, m + tl.log(l))             # the log-sum-exp of each row, for backward`;

export const lesson: LessonContent = {
  id: "e9.4.2",
  minutes: 60,
  links: {
    requires: ["e9.4.1", "e9.3.1"],
    revisits: ["e9.2.2", "e7.6.2"],
    foreshadows: ["e9.4.3", "e9.4.4"],
  },

  puzzle: (
    <>
      <p>
        For one head and a sequence of 32 thousand tokens, the attention score matrix has a billion entries, two gigabytes in bfloat16,
        and a standard implementation writes it, reads it for the softmax, writes the probabilities and reads them again. FlashAttention
        does exactly the same arithmetic and never stores the matrix at all. How can a kernel avoid materialising the very thing it
        computes, and does it really move less data?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Give each program a block of queries and keep it on chip. The program walks along the keys a block at a time: one matrix
        multiplication forms a tile of scores, the online softmax of e9.4.1 updates each row&apos;s maximum and sum and rescales the
        accumulated output, and a second matrix multiplication adds the tile&apos;s contribution. The tile is then discarded. Only Q,
        K, V and the output cross the boundary to global memory, and the score matrix lives one tile at a time in registers.
      </p>
      <FlashTileViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the FlashAttention forward pass">
        <p>
          Split the N queries into blocks of <M>{"B_r"}</M> rows and the keys and values into blocks of <M>{"B_c"}</M> rows. For each
          query block, in parallel across programs, keep per-row vectors m (running maximum) and l (running sum) and a{" "}
          <M>{"B_r \\times d"}</M> accumulator. For each key block j compute <M>{"S = Q_i K_j^\\top"}</M>, update{" "}
          <M>{"m' = \\max(m, \\operatorname{rowmax} S)"}</M>, <M>{"P = e^{S - m'}"}</M>,{" "}
          <M>{"l = l e^{m - m'} + \\operatorname{rowsum} P"}</M> and{" "}
          <M>{"\\text{acc} = \\operatorname{diag}(e^{m - m'})\\,\\text{acc} + P V_j"}</M>. Finally write{" "}
          <M>{"O_i = \\operatorname{diag}(l)^{-1}\\text{acc}"}</M> and the log-sum-exp <M>{"m + \\log l"}</M> of every row. Both
          multiplications run on tensor cores; the division is deferred to the end so that each row is divided once.
        </p>
        <Code>{KERNEL}</Code>
        <p>The Python below runs the same loops on lists and agrees with the reference that builds every row of scores.</p>
        <Code>{FWD}</Code>
      </Definition>

      <Definition title="causal masking">
        <p>
          With a causal mask, query t may attend to keys up to t. Tiles entirely above the diagonal are skipped, tiles below it need no
          mask, and only the tiles crossing the diagonal apply <C>tl.where</C>. With equal square blocks, T blocks per side give{" "}
          <M>{"T(T+1)/2"}</M> computed tiles, about half of <M>{"T^2"}</M>. With <M>{"B_r = B_c"}</M> every row of a diagonal tile keeps
          at least its own key, so no row is fully masked and no <M>{"e^{-\\infty + \\infty}"}</M> arises.
        </p>
        <Code>{IO}</Code>
      </Definition>

      <Theorem title="global-memory traffic">
        <p>
          Without a mask, the forward pass above reads Q once, reads K and V once per query block, and writes O once, moving{" "}
          <M>{"2Nd + 2N^2 d / B_r"}</M> elements (ignoring the N log-sum-exp values). A standard implementation that writes and reads S and
          P moves <M>{"4N^2 + 4Nd"}</M>. As N grows, the ratio of the second to the first tends to <M>{"2B_r/d"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each of the <M>{"N/B_r"}</M> programs loads its <M>{"B_r d"}</M> query elements once and stores <M>{"B_r d"}</M> outputs, which
          totals 2Nd. Each program also loads every key block and value block once, 2Nd elements, so all programs together load{" "}
          <M>{"(N/B_r) \\cdot 2Nd"}</M>. The standard method writes S (<M>{"N^2"}</M>), reads it for the softmax, writes P and reads P for
          the product with V, <M>{"4N^2"}</M>, and moves Q, K, V and O once each, 4Nd. Dividing,{" "}
          <M>{"(4N^2 + 4Nd)/(2Nd + 2N^2 d/B_r) = (4N + 4d)/(2d + 2Nd/B_r) \\to 4N/(2Nd/B_r) = 2B_r/d"}</M>.
        </p>
      </Proof>

      <Remark title="what the theorem does and does not say">
        <p>
          The traffic saving is a constant factor set by how many query rows fit on chip: a block of <M>{"B_r"}</M> rows needs room for{" "}
          <M>{"Q_i"}</M>, the accumulator and a key and value block, so <M>{"B_r"}</M> grows with on-chip memory M, and the traffic is{" "}
          <M>{"\\Theta(N^2 d^2 / M)"}</M>, which Dao et al. showed cannot be beaten by more than a constant for a range of M. In practice
          K and V blocks are often served from L2, since many programs read them at about the same time. The larger gains are elsewhere:
          memory for activations falls from <M>{"N^2"}</M> to N per head (e7.6.2), which is what makes long contexts trainable, and with
          traffic no longer quadratic in N times a small constant, the kernel is limited by tensor core throughput rather than by
          bandwidth.
        </p>
      </Remark>

      <Remark title="design choices in FlashAttention-2">
        <p>
          The query loop is outermost, so programs are independent across query blocks, heads and batch elements and need no
          synchronisation; the warps of a program split the query rows, so each row&apos;s maximum and sum stay within one warp; the
          division is deferred; and causal programs skip the tiles above the diagonal. The original FlashAttention put the key loop
          outermost and had to write partial outputs back to memory, which these choices avoid.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          The matrix is computed, but only one tile at a time, and each tile is folded into a running softmax state the moment it exists.
          The total traffic falls by a factor of about <M>{"2B_r/d"}</M>, a few times rather than orders of magnitude, but the
          quadratic memory disappears and the work becomes bound by matrix multiplication, which is what tensor cores are for.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "size",
      rung: "check",
      prompt: (
        <p>
          A standard implementation stores the bfloat16 score matrix of all 32 heads of one sequence of 8192 tokens. How many gigabytes
          (10⁹ bytes) is that? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 4.295, tolerance: 0.001 },
    },
    {
      key: "causal",
      rung: "check",
      prompt: (
        <p>
          A causal FlashAttention forward pass uses 128 by 128 tiles on a sequence of 4096 tokens. How many tiles does it compute for
          one head?
        </p>
      ),
      answer: { kind: "numeric", value: 528, tolerance: 0 },
    },
    {
      key: "saved",
      rung: "apply",
      prompt: <p>What does the forward pass store, beyond the output, so that the backward pass can rebuild P tile by tile?</p>,
      answer: {
        kind: "choice",
        options: [
          "The log-sum-exp of each query row",
          "The full probability matrix P",
          "The maximum of each query row only",
          "Nothing; the backward pass recomputes the forward pass in full first",
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

def scores(Qb, Kb):
    return [[sum(q * k for q, k in zip(qr, kr)) for kr in Kb] for qr in Qb]

def attention_ref(Q, K, V):
    out = []
    for z in scores(Q, K):                        # the whole N x N matrix, row by row
        m = max(z)
        p = [math.exp(x - m) for x in z]
        out.append([sum(pi * v[j] for pi, v in zip(p, V)) / sum(p) for j in range(len(V[0]))])
    return out

def flash_forward(Q, K, V, Br, Bc):
    d = len(V[0])
    O, L = [], []
    for i in range(0, len(Q), Br):                # one program per block of queries
        Qi = Q[i:i + Br]
        m = [-math.inf] * len(Qi)
        l = [0.0] * len(Qi)
        acc = [[0.0] * d for _ in Qi]
        for j in range(0, len(K), Bc):            # walk along the keys
            S = scores(Qi, K[j:j + Bc])
            for r, z in enumerate(S):
                m_new = max(m[r], max(z))
                f = math.exp(m[r] - m_new)
                p = [math.exp(x - m_new) for x in z]
                l[r] = l[r] * f + sum(p)
                acc[r] = [a * f + sum(pi * v[c] for pi, v in zip(p, V[j:j + Bc])) for c, a in enumerate(acc[r])]
                m[r] = m_new
        O += [[a / l[r] for a in acc[r]] for r in range(len(Qi))]
        L += [m[r] + math.log(l[r]) for r in range(len(Qi))]   # saved for the backward pass
    return O, L

Q, K, V = [[0.0], [1.0]], [[0.0], [1.0], [2.0]], [[1.0], [2.0], [3.0]]
O, L = flash_forward(Q, K, V, 1, 2); print(scores(Q, K), [round(r[0], 3) for r in attention_ref(Q, K, V)], [round(r[0], 3) for r in O], [round(x, 3) for x in L])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.0, 0.0, 0.0], [0.0, 1.0, 2.0]] [2.0, 2.575] [2.0, 2.575] [1.099, 2.408]",
          "[[0.0, 0.0, 0.0], [0.0, 1.0, 2.0]] [2.0, 2.575] [2.0, 2.267] [1.099, 2.408]",
          "[[0.0, 0.0, 0.0], [0.0, 1.0, 2.0]] [2.0, 2.575] [2.0, 2.575] [1.099, 0.408]",
          "[[0.0, 0.0], [0.0, 1.0], [0.0, 2.0]] [2.0, 2.575] [2.0, 2.575] [1.099, 2.408]",
        ],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def tiles_computed(N, Br, Bc, causal):
    count = 0
    for i in range(N // Br):
        for j in range(N // Bc):
            if not causal or j * Bc <= (i + 1) * Br - 1:   # some key in block j precedes some query in block i
                count += 1
    return count

def hbm_standard(N, d):
    return 4 * N * N + 4 * N * d                  # elements: S and P written and read, plus Q, K, V, O

def hbm_flash(N, d, Br, Bc, causal):
    return 2 * N * d + tiles_computed(N, Br, Bc, causal) * 2 * Bc * d

n = tiles_computed(512, 128, 128, True)
print(n, tiles_computed(512, 128, 64, True), hbm_standard(4, 2), hbm_flash(512, 64, 128, 128, False))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["10 20 96 327680", "10 16 96 327680", "16 32 96 327680", "10 20 80 327680"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>scores(Qb, Kb)</C>, the matrix of dot products of rows; <C>attention_ref(Q, K, V)</C>, the softmax of each row of
          scores applied to V; and <C>flash_forward(Q, K, V, Br, Bc)</C>, which returns the output and the list of row log-sum-exps using
          the blocked loops of the definition. Q is already scaled.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def scores(Qb, Kb):
    return [[0.0] * len(Kb) for _ in Qb]

def attention_ref(Q, K, V):
    return [list(V[0]) for _ in Q]

def flash_forward(Q, K, V, Br, Bc):
    return attention_ref(Q, K, V), [0.0] * len(Q)
`,
        solution: FWD,
        tests: [
          { name: "reference", code: `import math\nassert scores([[1.0, 2.0]], [[3.0, 4.0], [0.0, 1.0]]) == [[11.0, 2.0]]\nout = attention_ref([[0.0], [math.log(3.0)]], [[0.0], [1.0]], [[2.0], [6.0]])\nassert abs(out[0][0] - 4.0) < 1e-12 and abs(out[1][0] - 5.0) < 1e-12` },
          { name: "flash", code: `import math\nQ = [[0.1 * i, -0.2 * (i % 3)] for i in range(7)]\nK = [[0.3 * (j % 4), 0.25 * j] for j in range(9)]\nV = [[float(j), float(j * j % 5)] for j in range(9)]\nref = attention_ref(Q, K, V)\nfor Br, Bc in ((1, 1), (3, 4), (7, 9), (2, 5)):\n    O, L = flash_forward(Q, K, V, Br, Bc)\n    assert all(abs(a - b) < 1e-9 for ro, rr in zip(O, ref) for a, b in zip(ro, rr)) and len(O) == 7\n    lse = [math.log(sum(math.exp(x) for x in z)) for z in scores(Q, K)]\n    assert all(abs(a - b) < 1e-9 for a, b in zip(L, lse))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>tiles_computed(N, Br, Bc, causal)</C>, counting the tiles that contain at least one unmasked entry (N divisible by
          both block sizes); <C>hbm_standard(N, d)</C>; and <C>hbm_flash(N, d, Br, Bc, causal)</C>, in elements, as in the theorem, where
          a causal pass loads only the key and value blocks of the tiles it computes.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def tiles_computed(N, Br, Bc, causal):
    return (N // Br) * (N // Bc)

def hbm_standard(N, d):
    return 0

def hbm_flash(N, d, Br, Bc, causal):
    return 0
`,
        solution: IO,
        tests: [
          { name: "tiles", code: `assert tiles_computed(1024, 128, 128, True) == 36 and tiles_computed(256, 64, 128, True) == 6\nassert tiles_computed(256, 128, 64, False) == 8` },
          { name: "traffic", code: `assert hbm_standard(8, 2) == 320\nassert hbm_flash(256, 32, 64, 64, False) == 2 * 256 * 32 + 16 * 2 * 64 * 32\nassert hbm_flash(256, 32, 64, 64, True) == 2 * 256 * 32 + 10 * 2 * 64 * 32` },
        ],
      },
    },
    {
      key: "ratio",
      rung: "stretch",
      prompt: (
        <p>
          Without a mask, N = 16384, head dimension 64 and query blocks of 128 rows, what is the ratio of the standard method&apos;s
          global-memory traffic to the FlashAttention forward pass&apos;s, by the theorem? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 3.984, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The backward pass needs P again, and P was never stored. The next lesson rebuilds it tile by tile from Q, K and the saved
        log-sum-exp, and finds that the gradient of softmax needs one more row statistic.
      </p>
    </>
  ),
};
