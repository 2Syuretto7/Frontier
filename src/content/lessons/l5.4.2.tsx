import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SpanCorruptViz } from "@/components/viz/SpanCorruptViz";
import type { LessonContent } from "@/lib/types";

const SPANS = `def span_corrupt(tokens, spans, first_sentinel):
    inp, tgt, pos = [], [], 0
    for k, (s, n) in enumerate(spans):
        inp += list(tokens[pos:s]) + [first_sentinel - k]
        tgt += [first_sentinel - k] + list(tokens[s : s + n])
        pos = s + n
    return inp + list(tokens[pos:]), tgt + [first_sentinel - len(spans)]

def span_restore(inp, tgt, first_sentinel, n_sentinels=10):
    pieces, cur = {}, None
    for t in tgt:
        if first_sentinel - n_sentinels < t <= first_sentinel:
            cur = t
            pieces[cur] = []
        else:
            pieces[cur].append(t)
    out = []
    for t in inp:
        out += pieces[t] if t in pieces else [t]
    return out

def corrupted_lengths(T, rate, mean_len):
    noise = round(T * rate)
    spans = max(1, round(noise / mean_len))
    return T - noise + spans, noise + spans + 1`;

const ATTN = `import numpy as np

def cross_attention(Y, H, Wq, Wk, Wv):
    q, k, v = Y @ Wq, H @ Wk, H @ Wv
    s = q @ k.T / np.sqrt(q.shape[1])
    a = np.exp(s - s.max(1, keepdims=True))
    return (a / a.sum(1, keepdims=True)) @ v

def causal_mask(T):
    return np.tril(np.ones((T, T), bool))

def prefix_lm_mask(P, T):
    i, j = np.arange(T)[:, None], np.arange(T)[None, :]
    return (j <= i) | (j < P)`;

export const lesson: LessonContent = {
  id: "l5.4.2",
  minutes: 45,
  links: {
    requires: ["l5.4.1"],
    revisits: ["l5.3.3"],
    foreshadows: ["l5.4.3", "l5.4.4"],
  },

  puzzle: (
    <>
      <p>
        The transformer was first built to translate. The source sentence is given in full, so there is no reason to read it
        only left to right, but the translation has to be written one word at a time. Neither an encoder nor a decoder alone
        fits both halves. How do the original transformer and its descendant T5 combine them, and what do you pre-train such
        a model on before it has seen a single translation?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Use two stacks. The encoder reads the input with no mask and produces one vector per input token. The decoder is a
        causal stack like a GPT, with one extra sublayer per block: <em>cross-attention</em>, whose queries come from the
        decoder and whose keys and values come from the encoder&apos;s output. Every output token can look at the whole
        input and at the output written so far. T5 then casts every task, translation, summarising, classifying, as text in,
        text out, and pre-trains on a fill-in-the-blanks game with whole spans hidden.
      </p>
      <SpanCorruptViz />
    </>
  ),

  theory: (
    <>
      <Definition title="an encoder-decoder">
        <p>
          The encoder maps the source <M>{"x_1, \\dots, x_S"}</M> to vectors <M>{"h_1, \\dots, h_S"}</M> with unmasked
          self-attention. Each decoder block applies causal self-attention to its stream, then cross-attention with queries{" "}
          <M>{"q_i = y_iW_Q"}</M> and keys and values <M>{"h_jW_K, h_jW_V"}</M> for all j, then an MLP, each added to the
          stream. A <em>prefix LM</em> is the one-stack alternative: a single decoder whose mask lets the first P positions,
          the input, see each other in both directions.
        </p>
        <Code>{ATTN}</Code>
      </Definition>

      <Theorem title="the decoder models a conditional distribution">
        <p>
          The decoder&apos;s output at target position i depends on the whole source and on <M>{"y_1, \\dots, y_i"}</M> only, so
          its next-token predictions define
        </p>
        <MD>{"p(y \\mid x) = \\prod_ip(y_{i+1} \\mid y_{\\le i}, x),"}</MD>
        <p>
          a proper distribution over outputs that can be
          sampled one token at a time.
        </p>
      </Theorem>
      <Proof>
        <p>
          The encoder states depend on x alone. In each decoder block, causal self-attention at i uses positions up to i, as
          in the causality theorem for a GPT, and cross-attention uses the encoder states, which depend on x, and the query
          at i. The MLP and norms act on position i. Induction over blocks gives the dependence, and the chain rule of
          probability turns the next-token predictions into a distribution over whole sequences.
        </p>
      </Proof>

      <Definition title="span corruption">
        <p>
          Choose about rT of the T tokens to drop, in spans of mean length μ. The input replaces each span with its own
          sentinel token; the target lists each sentinel followed by the tokens it hid, and ends with one more sentinel.
        </p>
        <Code>{SPANS}</Code>
      </Definition>

      <Theorem title="lengths after span corruption">
        <p>
          With N dropped tokens in K spans, the input has <M>{"T - N + K"}</M> tokens and the target <M>{"N + K + 1"}</M>. With{" "}
          <M>{"N = rT"}</M> and <M>{"K = N/\\mu"}</M>, together they have <M>{"T(1 + 2r/\\mu) + 1"}</M> tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each span removes its tokens from the input and adds one sentinel; the target holds every dropped token, one
          sentinel per span and the closing sentinel. Adding, <M>{"T + 2K + 1"}</M>, and substitute K. For r = 0.15 and μ =
          3 the target is under a quarter as long as the input, so the decoder, which runs over the target, does little of the work,
          and the encoder, which runs once over a slightly shortened input, does most of it.
        </p>
      </Proof>

      <Theorem title="the parameter count">
        <p>
          Ignoring biases and norms, with tied embeddings of vocabulary V and MLP width 4d, an encoder-decoder with{" "}
          <M>{"L_e"}</M> encoder and <M>{"L_d"}</M> decoder layers has <M>{"Vd + 12L_ed^2 + 16L_dd^2"}</M> parameters.
        </p>
      </Theorem>
      <Proof>
        <p>
          An encoder layer is a GPT block, <M>{"12d^2"}</M>. A decoder layer adds cross-attention with its own four d × d
          matrices, <M>{"4d^2"}</M> more. T5 uses relative position biases instead of a position table, which add only a few
          numbers per layer.
        </p>
      </Proof>

      <Remark title="text to text">
        <p>
          T5 trains one model on many tasks by writing each as a text prefix and a text answer, such as &quot;translate
          English to German: …&quot; or &quot;cola sentence: …&quot; with the answer &quot;acceptable&quot;. The same model,
          loss and decoding serve every task. Its systematic comparison found span corruption with the encoder-decoder
          architecture worked best among the objectives it tried at its scale, a comparison the next lessons revisit.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "t5base",
      rung: "check",
      prompt: <p>With V = 32128, d = 768 and 12 encoder and 12 decoder layers, how many million parameters does the formula give? Give three decimals.</p>,
      answer: { kind: "numeric", value: 222.855, tolerance: 0.0006 },
    },
    {
      key: "target",
      rung: "check",
      prompt: <p>A 512-token sequence has round(0.15 × 512) tokens dropped in round(N/3) spans. How long is the target?</p>,
      answer: { kind: "numeric", value: 104, tolerance: 0 },
    },
    {
      key: "kv",
      rung: "apply",
      prompt: <p>In a decoder block&apos;s cross-attention, where do the queries, keys and values come from?</p>,
      answer: {
        kind: "choice",
        options: [
          "Queries from the decoder's stream; keys and values from the encoder's output",
          "Queries from the encoder's output; keys and values from the decoder's stream",
          "All three from the encoder's output",
          "All three from the decoder's stream, with the causal mask removed",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`def span_corrupt(tokens, spans, first_sentinel):
    inp, tgt, pos = [], [], 0
    for k, (s, n) in enumerate(spans):
        inp += list(tokens[pos:s]) + [first_sentinel - k]
        tgt += [first_sentinel - k] + list(tokens[s : s + n])
        pos = s + n
    return inp + list(tokens[pos:]), tgt + [first_sentinel - len(spans)]

def span_restore(inp, tgt, first_sentinel, n_sentinels=10):
    pieces, cur = {}, None
    for t in tgt:
        if first_sentinel - n_sentinels < t <= first_sentinel:
            cur = t
            pieces[cur] = []
        else:
            pieces[cur].append(t)
    out = []
    for t in inp:
        out += pieces[t] if t in pieces else [t]
    return out

def corrupted_lengths(T, rate, mean_len):
    noise = round(T * rate)
    spans = max(1, round(noise / mean_len))
    return T - noise + spans, noise + spans + 1

toks = [10, 11, 12, 13, 14, 15, 16]; inp, tgt = span_corrupt(toks, [(1, 2), (5, 1)], 99); print(inp, tgt)
print(span_restore(inp, tgt, 99) == toks, corrupted_lengths(512, 0.15, 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[10, 99, 13, 14, 98, 16] [99, 11, 12, 98, 15, 97]\nTrue (461, 104)",
          "[10, 99, 13, 14, 98, 16] [99, 11, 12, 98, 15]\nTrue (461, 103)",
          "[10, 99, 14, 98, 16] [99, 11, 12, 13, 98, 15, 97]\nTrue (461, 104)",
          "[10, 99, 13, 14, 99, 16] [99, 11, 12, 99, 15, 99]\nFalse (461, 104)",
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

def cross_attention(Y, H, Wq, Wk, Wv):
    q, k, v = Y @ Wq, H @ Wk, H @ Wv
    s = q @ k.T / np.sqrt(q.shape[1])
    a = np.exp(s - s.max(1, keepdims=True))
    return (a / a.sum(1, keepdims=True)) @ v

def causal_mask(T):
    return np.tril(np.ones((T, T), bool))

def prefix_lm_mask(P, T):
    i, j = np.arange(T)[:, None], np.arange(T)[None, :]
    return (j <= i) | (j < P)

Y, H = np.zeros((2, 2)), np.array([[1.0, 0.0], [0.0, 3.0]]); print(cross_attention(Y, H, np.eye(2), np.eye(2), np.eye(2)).tolist())
print(prefix_lm_mask(2, 4).astype(int).tolist(), int(prefix_lm_mask(2, 4).sum() - causal_mask(4).sum()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.5, 1.5], [0.5, 1.5]]\n[[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]] 1",
          "[[1.0, 0.0], [0.0, 3.0]]\n[[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]] 1",
          "[[0.5, 1.5], [0.5, 1.5]]\n[[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 0], [1, 1, 1, 1]] 3",
          "[[0.5, 1.5], [0.5, 1.5]]\n[[1, 0, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]] 0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>span_corrupt(tokens, spans, first_sentinel)</C>, where spans is a sorted list of (start, length) and the
          k-th sentinel is <C>first_sentinel - k</C>; <C>span_restore(inp, tgt, first_sentinel, n_sentinels=10)</C>, which
          inverts it, treating ids in <C>(first_sentinel - n_sentinels, first_sentinel]</C> as sentinels; and{" "}
          <C>corrupted_lengths(T, rate, mean_len)</C> with <C>noise = round(T * rate)</C> and{" "}
          <C>spans = max(1, round(noise / mean_len))</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `def span_corrupt(tokens, spans, first_sentinel):
    return list(tokens), []

def span_restore(inp, tgt, first_sentinel, n_sentinels=10):
    return list(inp)

def corrupted_lengths(T, rate, mean_len):
    return T, 0
`,
        solution: SPANS,
        tests: [
          { name: "corrupt", code: `toks = [10, 11, 12, 13, 14, 15, 16]
assert span_corrupt(toks, [(1, 2), (5, 1)], 99) == ([10, 99, 13, 14, 98, 16], [99, 11, 12, 98, 15, 97])
assert span_corrupt(toks, [(0, 7)], 50) == ([50], [50] + toks + [49]) and span_corrupt([1, 2], [], 9) == ([1, 2], [9])
assert corrupted_lengths(512, 0.15, 3) == (461, 104) and corrupted_lengths(20, 0.15, 8) == (18, 5)` },
          { name: "restore", code: `import random
random.seed(0)
for _ in range(50):
    T = random.randint(3, 30); toks = [random.randint(1, 80) for _ in range(T)]
    cuts = sorted(random.sample(range(T), random.randint(1, min(4, T)))); spans = []; last = -1
    for c in cuts:
        if c > last:
            n = random.randint(1, 3); n = min(n, T - c); spans.append((c, n)); last = c + n
    spans = [s for i, s in enumerate(spans) if i == 0 or s[0] >= spans[i - 1][0] + spans[i - 1][1]]
    i, t = span_corrupt(toks, spans, 99); assert span_restore(i, t, 99) == toks` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>cross_attention(Y, H, Wq, Wk, Wv)</C>, single-head attention from decoder states Y to encoder states H with
          scores scaled by <C>1/sqrt</C> of the query width; <C>causal_mask(T)</C>, a boolean matrix allowing j ≤ i; and{" "}
          <C>prefix_lm_mask(P, T)</C>, which also allows every key j &lt; P.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def cross_attention(Y, H, Wq, Wk, Wv):
    return Y @ Wv

def causal_mask(T):
    return np.ones((T, T), bool)

def prefix_lm_mask(P, T):
    return np.ones((T, T), bool)
`,
        solution: ATTN,
        tests: [
          { name: "cross", code: `rng = np.random.default_rng(0); Y, H = rng.standard_normal((3, 4)), rng.standard_normal((5, 4)); Wq, Wk, Wv = (rng.standard_normal((4, 2)) for _ in range(3))
out = cross_attention(Y, H, Wq, Wk, Wv); assert out.shape == (3, 2)
s = (Y[1] @ Wq) @ (H @ Wk).T / np.sqrt(2); a = np.exp(s) / np.exp(s).sum(); assert np.allclose(out[1], a @ (H @ Wv))
assert np.allclose(cross_attention(np.zeros((2, 2)), np.array([[1.0, 0.0], [0.0, 3.0]]), np.eye(2), np.eye(2), np.eye(2)), [[0.5, 1.5]] * 2)` },
          { name: "masks", code: `assert causal_mask(3).tolist() == [[True, False, False], [True, True, False], [True, True, True]]
m = prefix_lm_mask(2, 4); assert m.dtype == bool and m.astype(int).tolist() == [[1, 1, 0, 0], [1, 1, 0, 0], [1, 1, 1, 0], [1, 1, 1, 1]]
assert np.array_equal(prefix_lm_mask(0, 5), causal_mask(5)) and prefix_lm_mask(5, 5).all()` },
        ],
      },
    },
    {
      key: "sentinels",
      rung: "stretch",
      prompt: <p>For long sequences with r = 0.15 and μ = 3, what fraction of all input and target tokens together are sentinels? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0909, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Drop the encoder, keep only the causal stack, and train on next-token prediction alone: the decoder-only model. The
        next lesson looks at what such a model gives up and what it gains.
      </p>
    </>
  ),
};
