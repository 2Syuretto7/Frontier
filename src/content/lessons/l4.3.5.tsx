import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BottleneckRecallViz } from "@/components/viz/BottleneckRecallViz";
import type { LessonContent } from "@/lib/types";

const S2S = `import numpy as np

def encode(P, xs):
    h = np.zeros(len(P["be"]))
    for x in xs:
        h = np.tanh(P["We"] @ h + P["Ue"][:, x] + P["be"])
    return h

def decode_loss(P, h, ys, bos):
    total, prev = 0.0, bos
    for y in ys:
        h = np.tanh(P["Wd"] @ h + P["Ud"][:, prev] + P["bd"])
        z = P["Vo"] @ h + P["c"]
        m = z.max()
        total += m + np.log(np.exp(z - m).sum()) - z[y]
        prev = y
    return float(total / len(ys))

def seq2seq_loss(P, xs, ys, bos):
    return decode_loss(P, encode(P, xs), ys, bos)`;

const DECODE = `import numpy as np

def greedy(step, state, bos, eos, max_len):
    tok, out, total = bos, [], 0.0
    for _ in range(max_len):
        logp, state = step(state, tok)
        tok = int(np.argmax(logp))
        out.append(tok)
        total += float(logp[tok])
        if tok == eos:
            break
    return out, total

def rerank(cands, alpha):
    return max(cands, key=lambda c: c[1] / len(c[0]) ** alpha)`;

export const lesson: LessonContent = {
  id: "l4.3.5",
  minutes: 50,
  links: {
    requires: ["l4.3.4"],
    revisits: ["e2.7.4", "l2.1.2"],
    foreshadows: ["l4.4.2"],
  },

  puzzle: (
    <>
      <p>
        In 2014 a translation system made of two LSTMs, one reading English and one writing French, matched phrase-based
        systems built over two decades. One odd trick helped a great deal: feeding the English sentence in backwards. Reversing
        the input destroys nothing, since the network sees every word either way. Why should the order matter, and what does it
        say about how the two halves talk to each other?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An encoder reads the source sequence and leaves its final hidden state as a summary; a decoder starts from that summary
        and generates the target one token at a time, each step conditioned on the tokens it has already produced. Everything
        the decoder knows about the source must pass through one fixed-size vector. Short inputs fit; long ones do not, and the
        words read first are the ones most blurred by the time the decoder starts. Reversing the source puts the first source
        words next to the first target words, which shortens the paths the gradient must travel for the start of the sentence.
      </p>
      <BottleneckRecallViz />
    </>
  ),

  theory: (
    <>
      <Definition title="encoder-decoder">
        <p>
          The encoder runs a recurrent network over <M>{"x_1, \\dots, x_S"}</M> and returns <M>{"s = h^{\\text{enc}}_S"}</M>. The
          decoder sets <M>{"h_0 = s"}</M> and, with <M>{"y_0"}</M> a start token,
        </p>
        <MD>{"h_t = f(h_{t-1}, y_{t-1}), \\qquad p(y_t \\mid y_{<t}, x) = \\operatorname{softmax}(V_o h_t + c)_{y_t}, \\qquad p(y \\mid x) = \\prod_{t=1}^{T} p(y_t \\mid y_{<t}, x)."}</MD>
        <p>
          Generation stops when the decoder emits an end token, so the output length is chosen by the model. Encoder and decoder
          have separate weights and are trained jointly.
        </p>
        <Code>{S2S}</Code>
      </Definition>

      <Theorem title="teacher forcing is maximum likelihood">
        <p>
          Feeding the true previous token <M>{"y_{t-1}"}</M> at each decoder step and summing the per-step cross-entropies gives
          exactly <M>{"-\\log p(y \\mid x)"}</M>, so minimising it over a corpus is maximum likelihood estimation of the
          conditional model.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the chain rule of probability the model defines{" "}
          <M>{"\\log p(y \\mid x) = \\sum_t \\log p(y_t \\mid y_{<t}, x)"}</M>. The t-th factor must be evaluated at the true
          prefix <M>{"y_{<t}"}</M>, which is exactly what teacher forcing feeds in. Summing over the training pairs gives the log
          likelihood. A side effect is that all steps can be scored given the target, without sampling.
        </p>
      </Proof>

      <Remark title="exposure bias">
        <p>
          At test time the decoder conditions on its own outputs, which it never did in training. One early mistake moves it to
          prefixes unlike any it was trained on, and errors can compound. Scheduled sampling, which sometimes feeds the
          model&apos;s own predictions during training, is one response; in practice large models trained by teacher forcing are
          robust enough that it is rarely used.
        </p>
      </Remark>

      <Theorem title="unnormalised scores prefer short outputs">
        <p>
          The running score <M>{"\\sum_{s \\le t}\\log p(y_s \\mid y_{<s}, x)"}</M> never increases with t. Every extra token
          costs score, so a long hypothesis can beat a short one only if its extra tokens are all highly probable, and searching for the most probable sequence favours stopping early. Decoders therefore rank finished
          hypotheses by <M>{"\\log p(y \\mid x)/|y|^\\alpha"}</M> with α between 0.5 and 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every factor <M>{"p(y_t \\mid y_{<t}, x)"}</M> is at most 1, so its log is at most 0, and extending a prefix can only
          lower the running sum. A long output can win only if every one of its extra steps is nearly certain. Dividing by a
          power of the length removes this built-in bias; α = 1 compares average log-probability per token. Greedy and beam
          search, from the decoding lesson, are the usual ways to search; both return finished hypotheses that are then compared
          with this score.
        </p>
        <Code>{DECODE}</Code>
      </Proof>

      <Example title="how much one vector holds">
        <p>
          The figure stores a sequence in one vector by superposing a random code for each position and token, the best a
          linear encoder can hope for. With a 64-dimensional state, 87% of tokens are recovered at length 8 but only 33% at
          length 60, close to chance at 10%. Quadrupling the state to 256 recovers 71% at length 60. Translation quality of the
          2014 encoder-decoders likewise fell steadily with sentence length. The cure is not a bigger vector but letting the
          decoder look at every encoder state, which is attention.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "prod",
      rung: "check",
      prompt: <p>A decoder assigns probability 0.9 to each of the 20 tokens of an output. What is the probability of the whole output?</p>,
      answer: { kind: "numeric", value: 0.1216, tolerance: 0.0001 },
    },
    {
      key: "norm",
      rung: "check",
      prompt: <p>A hypothesis of 4 tokens has log-probability −6. What is its length-normalised score with α = 0.7?</p>,
      answer: { kind: "numeric", value: -2.2736, tolerance: 0.0005 },
    },
    {
      key: "tf",
      rung: "apply",
      prompt: <p>What is the mismatch that the term exposure bias refers to?</p>,
      answer: {
        kind: "choice",
        options: [
          "The encoder sees the whole source while the decoder sees only a prefix of the target",
          "During training the decoder is fed true previous tokens, but at test time it is fed its own predictions, which may lead it to prefixes it never saw",
          "Long source sentences are exposed to more gradient updates than short ones",
          "The softmax over the vocabulary exposes rare words to too little probability",
        ],
        correct: [1],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def encode(P, xs):
    h = np.zeros(len(P["be"]))
    for x in xs:
        h = np.tanh(P["We"] @ h + P["Ue"][:, x] + P["be"])
    return h

def decode_loss(P, h, ys, bos):
    total, prev = 0.0, bos
    for y in ys:
        h = np.tanh(P["Wd"] @ h + P["Ud"][:, prev] + P["bd"])
        z = P["Vo"] @ h + P["c"]
        m = z.max()
        total += m + np.log(np.exp(z - m).sum()) - z[y]
        prev = y
    return float(total / len(ys))

def seq2seq_loss(P, xs, ys, bos):
    return decode_loss(P, encode(P, xs), ys, bos)

P = {"We": np.zeros((2, 2)), "Ue": np.array([[1.0, 0, -1], [0, 1, 0]]), "be": np.zeros(2), "Wd": np.zeros((2, 2)), "Ud": np.zeros((2, 4)), "bd": np.zeros(2), "Vo": np.zeros((4, 2)), "c": np.zeros(4)}
print(np.round(encode(P, [0, 1]), 3).tolist(), np.allclose(encode(P, [0, 1]), encode(P, [2, 1])), np.allclose(encode(P, [1, 0]), encode(P, [1, 2])))
print(round(seq2seq_loss(P, [0, 1], [2, 3, 3], 0), 4), round(float(np.log(4)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.762] True False\n1.3863 1.3863",
          "[0.0, 0.762] False False\n1.3863 1.3863",
          "[0.762, 0.762] True True\n1.3863 1.3863",
          "[0.0, 0.762] True False\n0.0 1.3863",
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

def greedy(step, state, bos, eos, max_len):
    tok, out, total = bos, [], 0.0
    for _ in range(max_len):
        logp, state = step(state, tok)
        tok = int(np.argmax(logp))
        out.append(tok)
        total += float(logp[tok])
        if tok == eos:
            break
    return out, total

def rerank(cands, alpha):
    return max(cands, key=lambda c: c[1] / len(c[0]) ** alpha)

L = np.log(np.array([[0.1, 0.6, 0.3], [0.1, 0.1, 0.8], [0.0001, 0.0001, 0.9998]])); step = lambda s, w: (L[w], s + 1)
print(greedy(step, 0, 0, 2, 5)[0], round(greedy(step, 0, 0, 2, 5)[1], 4))
cands = [([2], -2.0), ([1, 1, 2], -3.0), ([1, 1, 1, 1, 2], -4.0)]; print(rerank(cands, 0)[0], rerank(cands, 1)[0], rerank(cands, 0.5)[0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1, 2] -0.734\n[2] [1, 1, 1, 1, 2] [1, 1, 2]",
          "[1, 2] -0.734\n[2] [1, 1, 2] [1, 1, 2]",
          "[2] -1.204\n[2] [1, 1, 1, 1, 2] [1, 1, 2]",
          "[1, 2] -0.734\n[1, 1, 1, 1, 2] [2] [1, 1, 2]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>encode(P, xs)</C> (a tanh RNN from a zero state with We, Ue, be), <C>decode_loss(P, h, ys, bos)</C> (a tanh RNN
          decoder with Wd, Ud, bd starting from h, fed the true previous token, output Vo, c, returning mean cross-entropy) and{" "}
          <C>seq2seq_loss(P, xs, ys, bos)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def encode(P, xs):
    return np.zeros(len(P["be"]))

def decode_loss(P, h, ys, bos):
    return 0.0

def seq2seq_loss(P, xs, ys, bos):
    return 0.0
`,
        solution: S2S,
        tests: [
          { name: "encoder", code: `P = {"We": np.array([[0.5]]), "Ue": np.array([[1.0, -2.0]]), "be": np.array([0.1])}
assert np.allclose(encode(P, [0, 1]), np.tanh(0.5 * np.tanh(1.1) - 1.9)) and np.allclose(encode(P, []), 0)` },
          { name: "teacher forcing", code: `P = {"We": np.zeros((1, 1)), "Ue": np.zeros((1, 2)), "be": np.zeros(1), "Wd": np.zeros((1, 1)), "Ud": np.array([[0.0, 50.0, -50.0]]), "bd": np.zeros(1), "Vo": np.array([[0.0], [10.0], [-10.0]]), "c": np.zeros(3)}
l = seq2seq_loss(P, [0, 1], [1, 2], 0); z1, z2 = np.zeros(3), np.array([0.0, 10, -10]); ce = lambda z, y: np.log(np.exp(z).sum()) - z[y]
assert abs(l - (ce(z1, 1) + ce(z2, 2)) / 2) < 1e-6 and abs(decode_loss(P, np.ones(1), [1], 0) - ce(z1, 1)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>greedy(step, state, bos, eos, max_len)</C>, where <C>step(state, token)</C> returns a vector of
          log-probabilities and the next state, returning the tokens produced (including the end token) and their total
          log-probability, and <C>rerank(cands, alpha)</C>, which picks the (tokens, logp) pair with the best length-normalised
          score.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def greedy(step, state, bos, eos, max_len):
    return [], 0.0

def rerank(cands, alpha):
    return cands[0]
`,
        solution: DECODE,
        tests: [
          { name: "greedy", code: `L = np.log(np.array([[0.2, 0.5, 0.3], [0.6, 0.1, 0.3], [0.1, 0.1, 0.8]])); step = lambda s, w: (L[w], s + 1)
out, lp = greedy(step, 0, 0, 2, 10); assert out == [1, 0, 1, 0, 1, 0, 1, 0, 1, 0] and abs(lp - 5 * np.log(0.3)) < 1e-9
out, lp = greedy(lambda s, w: (L[2], s), 0, 0, 2, 10); assert out == [2] and abs(lp - np.log(0.8)) < 1e-12` },
          { name: "rerank", code: `c = [([5], -1.0), ([1, 2, 3, 5], -2.4), ([1, 5], -1.5)]; assert rerank(c, 0) == c[0] and rerank(c, 1) == c[1] and rerank(c, 0.6) == c[2]` },
        ],
      },
    },
    {
      key: "rev",
      rung: "stretch",
      prompt: (
        <p>
          A 20-word source is translated word for word into a 20-word target. The encoder reads one word per step and the
          decoder writes one word per step straight after. With the source fed in reverse order, for how many of the 20 aligned
          pairs is the number of steps between reading the source word and writing its translation at most 10?
        </p>
      ),
      answer: { kind: "numeric", value: 5, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The decoder sees the source only through one vector. The next section lets it consult every encoder state, weighted by
        relevance, starting with the operation behind that: a lookup that is soft instead of exact.
      </p>
    </>
  ),
};
