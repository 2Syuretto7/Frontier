import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OnlineAttentionViz } from "@/components/viz/OnlineAttentionViz";
import type { LessonContent } from "@/lib/types";

const STATES = `import math

def block_state(z):
    m = max(z)
    return (m, sum(math.exp(v - m) for v in z))

def merge_state(a, b):
    (ma, sa), (mb, sb) = a, b
    m = max(ma, mb)
    return (m, sa * math.exp(ma - m) + sb * math.exp(mb - m))

def online_softmax(z, BLOCK):
    st = (-math.inf, 0.0)                         # the identity of merge_state
    for i in range(0, len(z), BLOCK):             # pass 1: statistics, block by block
        st = merge_state(st, block_state(z[i:i + BLOCK]))
    m, s = st
    return [math.exp(v - m) / s for v in z]       # pass 2: normalise and write`;

const ATTEND = `import math

def attend_state(z, v):
    m = max(z)
    p = [math.exp(x - m) for x in z]
    o = [sum(pi * vi[j] for pi, vi in zip(p, v)) for j in range(len(v[0]))]
    return (m, sum(p), o)

def merge_attend(a, b):
    (ma, sa, oa), (mb, sb, ob) = a, b
    m = max(ma, mb)
    fa, fb = math.exp(ma - m), math.exp(mb - m)
    return (m, sa * fa + sb * fb, [x * fa + y * fb for x, y in zip(oa, ob)])

def attend_online(z, v, BLOCK):
    st = attend_state(z[:BLOCK], v[:BLOCK])
    for i in range(BLOCK, len(z), BLOCK):
        st = merge_attend(st, attend_state(z[i:i + BLOCK], v[i:i + BLOCK]))
    m, s, o = st
    return [x / s for x in o]`;

const LONG = `@triton.jit
def softmax_long(x_ptr, y_ptr, stride, N, BLOCK: tl.constexpr):
    row = tl.program_id(0)
    m, s = -float("inf"), 0.0
    for start in range(0, N, BLOCK):              # pass 1: running maximum and sum
        cols = start + tl.arange(0, BLOCK)
        x = tl.load(x_ptr + row * stride + cols, mask=cols < N, other=-float("inf")).to(tl.float32)
        m_new = tl.maximum(m, tl.max(x, axis=0))
        s = s * tl.exp(m - m_new) + tl.sum(tl.exp(x - m_new), axis=0)
        m = m_new
    for start in range(0, N, BLOCK):              # pass 2: normalise and store
        cols = start + tl.arange(0, BLOCK)
        x = tl.load(x_ptr + row * stride + cols, mask=cols < N, other=-float("inf")).to(tl.float32)
        tl.store(y_ptr + row * stride + cols, tl.exp(x - m) / s, mask=cols < N)`;

const ONE_QUERY = `@triton.jit
def attend_one_query(q_ptr, k_ptr, v_ptr, o_ptr, N, D: tl.constexpr, BLOCK: tl.constexpr):
    d = tl.arange(0, D)
    q = tl.load(q_ptr + d).to(tl.float32)         # already scaled by 1/sqrt(D)
    m, s = -float("inf"), 0.0
    acc = tl.zeros((D,), dtype=tl.float32)
    for start in range(0, N, BLOCK):              # one pass over keys and values
        n = start + tl.arange(0, BLOCK)
        k = tl.load(k_ptr + n[:, None] * D + d[None, :], mask=n[:, None] < N, other=0.0)
        v = tl.load(v_ptr + n[:, None] * D + d[None, :], mask=n[:, None] < N, other=0.0)
        z = tl.where(n < N, tl.sum(k * q[None, :], axis=1), -float("inf"))
        m_new = tl.maximum(m, tl.max(z, axis=0))
        p = tl.exp(z - m_new)
        f = tl.exp(m - m_new)                     # rescales everything accumulated so far
        s = s * f + tl.sum(p, axis=0)
        acc = acc * f + tl.sum(p[:, None] * v, axis=0)
        m = m_new
    tl.store(o_ptr + d, acc / s)`;

export const lesson: LessonContent = {
  id: "e9.4.1",
  minutes: 50,
  links: {
    requires: ["e9.3.2", "m11.2.3"],
    revisits: ["l5.2.1", "e5.2.4"],
    foreshadows: ["e9.4.2", "e10.4.3"],
  },

  puzzle: (
    <>
      <p>
        A softmax output cannot be written until the row&apos;s maximum and sum are known, so a row of 128 thousand attention logits
        seems to need either the whole row in registers or several passes over memory. Yet attention kernels compute{" "}
        <M>{"\\operatorname{softmax}(QK^\\top)V"}</M> for such rows reading each key and value once, and never store a single
        probability. What do they keep instead?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Lesson m11.2.3 summarised a stream of logits by a running maximum and a running sum, rescaling the sum whenever the maximum
        grows. Attention does not need the probabilities themselves, only their weighted average of the values. That average can be
        carried along in the same way: keep an unnormalised output vector, rescale it with the sum, and add each new block&apos;s
        contribution. At the end, divide once. Blocks can be processed in any order and grouped in any way, because the summaries
        merge associatively.
      </p>
      <OnlineAttentionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="softmax states">
        <p>
          A softmax state for a set of logits is a pair (m, s) with m their maximum and{" "}
          <M>{"s = \\sum_i e^{z_i - m}"}</M>. It represents the number <M>{"S = s e^m = \\sum_i e^{z_i}"}</M> without overflow. Two states
          merge into <M>{"(m, s_a e^{m_a - m} + s_b e^{m_b - m})"}</M> with <M>{"m = \\max(m_a, m_b)"}</M>, and{" "}
          <M>{"(-\\infty, 0)"}</M> is the state of the empty set. A kernel for rows longer than a block makes one pass to accumulate the
          state block by block and a second to normalise, so it reads the row twice instead of the three times of a max pass, a sum pass
          and a normalising pass.
        </p>
        <Code>{LONG}</Code>
        <Code>{STATES}</Code>
      </Definition>

      <Definition title="attention states">
        <p>
          For one query, keys with logits <M>{"z_i"}</M> and values <M>{"v_i"}</M>, an attention state is (m, s, o) with{" "}
          <M>{"o = \\sum_i e^{z_i - m} v_i"}</M>, representing <M>{"O = o e^m"}</M>. Merging rescales both s and o by the same factors,
          and the attention output is o / s. A single pass over keys and values suffices, since each block is used once and discarded.
        </p>
        <Code>{ONE_QUERY}</Code>
        <Code>{ATTEND}</Code>
      </Definition>

      <Theorem title="merging is associative and commutative">
        <p>
          In exact arithmetic, merging attention states is associative and commutative with identity{" "}
          <M>{"(-\\infty, 0, 0)"}</M>. Hence the state of a set of keys, and the output o / s, do not depend on how the keys are split
          into blocks or in what order the blocks are merged.
        </p>
      </Theorem>
      <Proof>
        <p>
          Map a state to the triple <M>{"(m, S, O) = (m, s e^m, o e^m)"}</M>; the map is injective because s and o are recovered by
          multiplying by <M>{"e^{-m}"}</M>. Under it, merging becomes <M>{"(\\max(m_a, m_b), S_a + S_b, O_a + O_b)"}</M>, since for
          example <M>{"(s_a e^{m_a - m} + s_b e^{m_b - m}) e^m = S_a + S_b"}</M>. Maximum and addition are associative and commutative,
          with identities <M>{"-\\infty"}</M> and 0, so merging is too. By induction the state of any set is (max, sum of{" "}
          <M>{"e^{z_i}"}</M>, sum of <M>{"e^{z_i} v_i"}</M>) over the set, whatever the grouping, and o / s = O / S is the softmax-weighted
          average of the values.
        </p>
      </Proof>

      <Remark title="what it buys">
        <p>
          Because the order does not matter, the keys of one long row can be split across programs: each computes a partial state, and a
          small second kernel merges them. This is how decoding kernels keep the whole GPU busy when there is one query and a long cache,
          and how ring attention (e10.4.3) combines blocks computed on different devices. In floating point the merge is only
          approximately associative, so different block sizes give results that differ in the last bits; kernels that must be
          bit-reproducible fix the block size and the merge order.
        </p>
      </Remark>

      <Remark title="costs and numerics">
        <p>
          Each block whose maximum exceeds the running one forces a rescale of o, d multiplications for a d-dimensional output; larger
          blocks mean fewer rescales, as the figure shows. Every exponent is at most 0, so nothing overflows, and the state is kept in
          float32 even when keys and values are 16-bit. The first block initialises the maximum; a fully masked block has maximum{" "}
          <M>{"-\\infty"}</M>, and real kernels guard the expression <M>{"e^{-\\infty - (-\\infty)}"}</M>, which is NaN.
        </p>
      </Remark>

      <Example title="the puzzle, resolved">
        <p>
          They keep a state of d + 2 numbers per query: the running maximum, the running sum, and the unnormalised weighted sum of the
          values seen so far. Each block of keys and values updates it once, the probabilities are formed and consumed inside registers,
          and the only division happens at the end. FlashAttention, next, applies this to a block of queries at a time.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "merge",
      rung: "check",
      prompt: (
        <p>
          Two softmax states are (m, s) = (2, 1.5) and (3, 2). What is s for the merged state? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 2.552, tolerance: 0.001 },
    },
    {
      key: "saved",
      rung: "check",
      prompt: (
        <p>
          Softmax is applied to every row of an 8192 by 32768 bfloat16 matrix. A three-pass kernel reads the matrix three times and writes
          it once; an online kernel reads it twice and writes it once. At 3 TB/s, how many microseconds does the online kernel save?
          Round to the nearest microsecond.
        </p>
      ),
      answer: { kind: "numeric", value: 179, tolerance: 1 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: (
        <p>
          A decoding kernel splits the keys of one query across 32 programs and merges their partial states in whatever order they
          finish. Which fact makes the result independent of that order, in exact arithmetic?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Merging states is associative and commutative",
          "Softmax is invariant to adding a constant to every logit",
          "Every exponent computed is at most zero",
          "Keys within a block are processed in parallel",
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

def block_state(z):
    m = max(z)
    return (m, sum(math.exp(v - m) for v in z))

def merge_state(a, b):
    (ma, sa), (mb, sb) = a, b
    m = max(ma, mb)
    return (m, sa * math.exp(ma - m) + sb * math.exp(mb - m))

def online_softmax(z, BLOCK):
    st = (-math.inf, 0.0)                         # the identity of merge_state
    for i in range(0, len(z), BLOCK):             # pass 1: statistics, block by block
        st = merge_state(st, block_state(z[i:i + BLOCK]))
    m, s = st
    return [math.exp(v - m) / s for v in z]       # pass 2: normalise and write

a, b = block_state([1.0, 3.0]), block_state([2.0])
print(tuple(round(x, 3) for x in a), tuple(round(x, 3) for x in merge_state(a, b)), [round(p, 3) for p in online_softmax([1.0, 3.0, 2.0], 2)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(3.0, 1.135) (3.0, 1.503) [0.09, 0.665, 0.245]",
          "(3.0, 1.135) (3.0, 2.135) [0.09, 0.665, 0.245]",
          "(3.0, 1.135) (3.0, 1.503) [0.09, 0.245, 0.665]",
          "(1.0, 1.135) (2.0, 1.503) [0.09, 0.665, 0.245]",
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

def attend_state(z, v):
    m = max(z)
    p = [math.exp(x - m) for x in z]
    o = [sum(pi * vi[j] for pi, vi in zip(p, v)) for j in range(len(v[0]))]
    return (m, sum(p), o)

def merge_attend(a, b):
    (ma, sa, oa), (mb, sb, ob) = a, b
    m = max(ma, mb)
    fa, fb = math.exp(ma - m), math.exp(mb - m)
    return (m, sa * fa + sb * fb, [x * fa + y * fb for x, y in zip(oa, ob)])

def attend_online(z, v, BLOCK):
    st = attend_state(z[:BLOCK], v[:BLOCK])
    for i in range(BLOCK, len(z), BLOCK):
        st = merge_attend(st, attend_state(z[i:i + BLOCK], v[i:i + BLOCK]))
    m, s, o = st
    return [x / s for x in o]

z, v = [0.0, 0.0, 0.0, 0.0], [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0], [2.0, 2.0]]
print(attend_state(z[:2], v[:2]), [round(x, 3) for x in attend_online(z, v, 3)], [round(x, 3) for x in attend_online([0.0, math.log(3)], [[4.0], [8.0]], 1)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(0.0, 2.0, [1.0, 1.0]) [1.0, 1.0] [7.0]",
          "(0.0, 2.0, [0.5, 0.5]) [1.0, 1.0] [7.0]",
          "(0.0, 2.0, [1.0, 1.0]) [1.0, 1.0] [6.0]",
          "(0.0, 2.0, [1.0, 1.0]) [0.667, 0.667] [7.0]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>block_state(z)</C>, returning (m, s) for a non-empty list of logits; <C>merge_state(a, b)</C>, which must also accept
          the empty state (-inf, 0.0) as its first argument; and <C>online_softmax(z, BLOCK)</C>, which accumulates the state block by
          block and then returns the softmax of z.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def block_state(z):
    return (max(z), float(len(z)))

def merge_state(a, b):
    return b

def online_softmax(z, BLOCK):
    return [1.0 / len(z)] * len(z)
`,
        solution: STATES,
        tests: [
          { name: "states", code: `import math\nm, s = block_state([0.0, math.log(4.0)])\nassert m == math.log(4.0) and abs(s - 1.25) < 1e-12\nm, s = merge_state((0.0, 1.0), (1.0, 2.0))\nassert m == 1.0 and abs(s - (2.0 + math.exp(-1.0))) < 1e-12` },
          { name: "softmax", code: `import math\nz = [1000.0, 1001.0, 999.0, 1002.0, 998.0]\ne = [math.exp(v - 1002.0) for v in z]\nref = [x / sum(e) for x in e]\nfor B in (1, 2, 5, 8):\n    assert all(abs(a - b) < 1e-12 for a, b in zip(online_softmax(z, B), ref))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attend_state(z, v)</C>, returning (m, s, o) for a block of logits and value vectors; <C>merge_attend(a, b)</C>; and{" "}
          <C>attend_online(z, v, BLOCK)</C>, which returns the attention output o / s after merging the blocks in order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def attend_state(z, v):
    return (max(z), float(len(z)), list(v[0]))

def merge_attend(a, b):
    return a

def attend_online(z, v, BLOCK):
    return list(v[0])
`,
        solution: ATTEND,
        tests: [
          { name: "state", code: `import math\nm, s, o = attend_state([0.0, math.log(2.0)], [[1.0, 0.0], [0.0, 3.0]])\nassert abs(m - math.log(2.0)) < 1e-12 and abs(s - 1.5) < 1e-12 and abs(o[0] - 0.5) < 1e-12 and abs(o[1] - 3.0) < 1e-12\nm, s, o = merge_attend((0.0, 1.0, [2.0]), (2.0, 1.0, [1.0]))\nassert m == 2.0 and abs(s - (1 + math.exp(-2))) < 1e-12 and abs(o[0] - (1 + 2 * math.exp(-2))) < 1e-12` },
          { name: "online", code: `import math\nz = [0.3 * i - 0.05 * i * i for i in range(9)]\nv = [[float(i), float(i % 3)] for i in range(9)]\nw = [math.exp(x) for x in z]\nref = [sum(wi * vi[j] for wi, vi in zip(w, v)) / sum(w) for j in range(2)]\nfor B in (1, 4, 9):\n    out = attend_online(z, v, B)\n    assert len(out) == 2 and all(abs(a - b) < 1e-12 for a, b in zip(out, ref))` },
        ],
      },
    },
    {
      key: "halves",
      rung: "stretch",
      prompt: (
        <p>
          Attention for one query with scalar values is computed in two halves. The first half ends with m = 1, s = 2 and normalised
          output o / s = 4; the second with m = 3, s = 1 and normalised output 10. What is the attention output over all keys? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 8.722, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        One query at a time leaves the tensor cores idle. FlashAttention processes a block of queries against a block of keys with two
        matrix multiplications, applies the same rescaling to every row of the block, and never writes the attention matrix to memory.
      </p>
    </>
  ),
};
