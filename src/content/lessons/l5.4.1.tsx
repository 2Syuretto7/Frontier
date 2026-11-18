import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MlmCorruptionViz } from "@/components/viz/MlmCorruptionViz";
import type { LessonContent } from "@/lib/types";

const MLM = `import numpy as np

def mask_tokens(tokens, rng, mask_id, vocab, p=0.15):
    tokens = np.asarray(tokens)
    chosen = rng.random(len(tokens)) < p
    r = rng.random(len(tokens))
    inputs = tokens.copy()
    inputs[chosen & (r < 0.8)] = mask_id
    swap = chosen & (r >= 0.8) & (r < 0.9)
    inputs[swap] = rng.integers(0, vocab, size=swap.sum())
    return inputs, np.where(chosen, tokens, -1)

def mlm_loss(logits, targets):
    keep = targets >= 0
    z = logits[keep] - logits[keep].max(-1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(-1, keepdims=True))
    return float(-logp[np.arange(keep.sum()), targets[keep]].mean())

def pseudo_log_likelihood(model, tokens, mask_id):
    total = 0.0
    for i in range(len(tokens)):
        x = np.array(tokens)
        x[i] = mask_id
        z = model(x)[i]
        total += z[tokens[i]] - z.max() - np.log(np.exp(z - z.max()).sum())
    return float(total)`;

const PAD = `import numpy as np

def pad_batch(seqs, pad_id=0):
    T = max(len(s) for s in seqs)
    ids = np.full((len(seqs), T), pad_id)
    mask = np.zeros((len(seqs), T), bool)
    for b, s in enumerate(seqs):
        ids[b, : len(s)] = s
        mask[b, : len(s)] = True
    return ids, mask

def key_mask_scores(S, mask):
    return np.where(mask[:, None, :], S, -np.inf)

def mean_pool(H, mask):
    m = mask[..., None].astype(float)
    return (H * m).sum(1) / m.sum(1)`;

export const lesson: LessonContent = {
  id: "l5.4.1",
  minutes: 45,
  links: {
    requires: ["l5.3.1"],
    revisits: ["l5.2.2"],
    foreshadows: ["l5.4.2", "l5.4.4"],
  },

  puzzle: (
    <>
      <p>
        To decide what &quot;bank&quot; means in &quot;she sat on the bank and watched the river&quot;, the useful word comes
        after it. A GPT reading left to right cannot use it when it builds its vector for &quot;bank&quot;. Remove the causal
        mask and every position sees the whole sentence, but then predicting the next token becomes trivial: it is right
        there in the input. What should a model that sees both sides be trained to do?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Hide some of the tokens and ask the model to fill them in. An <em>encoder</em> is a transformer without the causal
        mask, so its vector at each position draws on the whole input, and the masked language modelling objective of BERT
        gives it something non-trivial to predict. The vectors it learns are then reused: a small head on top of them,
        trained on a few thousand labelled examples, classifies sentences, tags names or finds answer spans. The cost is that
        the model no longer defines the probability of a text one token at a time, so it does not generate.
      </p>
      <MlmCorruptionViz />
    </>
  ),

  theory: (
    <>
      <Definition title="masked language modelling">
        <p>
          Each position independently becomes a <em>target</em> with probability p, 0.15 in BERT. In the input, a target is
          replaced by a special [MASK] token with probability 0.8, by a uniformly random token with probability 0.1, and left
          unchanged otherwise. The encoder reads the corrupted sequence and the loss is the cross-entropy of its predictions
          at the target positions only. A score for a whole text can be built by masking each position in turn, the{" "}
          <em>pseudo-log-likelihood</em> <M>{"\\sum_i\\log p(x_i \\mid x_{\\setminus i})"}</M>.
        </p>
        <Code>{MLM}</Code>
      </Definition>

      <Theorem title="what masked prediction learns">
        <p>
          At a target position, the expected cross-entropy over the data is minimised when the model&apos;s prediction equals
          the true conditional distribution of the hidden token given the corrupted input.
        </p>
      </Theorem>
      <Proof>
        <p>
          Fix the corrupted input c. The expected loss of a prediction q is{" "}
          <M>{"-\\sum_xp(x \\mid c)\\log q(x) = H(p(\\cdot \\mid c)) + \\operatorname{KL}(p(\\cdot \\mid c)\\,\\|\\,q)"}</M>, and
          the KL divergence is non-negative with equality only at <M>{"q = p(\\cdot \\mid c)"}</M>. Averaging over c keeps the
          minimiser. Those conditionals, one per position, are not a factorisation of the joint distribution of the text the
          way the causal chain rule is, which is why the pseudo-log-likelihood is a score but not a log-probability, and why
          it costs T forward passes instead of one.
        </p>
      </Proof>

      <Theorem title="why 80, 10, 10">
        <p>
          Ignoring the chance that a random replacement equals the original, a token that appears in the input as itself is
          a target with probability <M>{"0.1p/(1 - p + 0.1p)"}</M>, about 0.0173 for p = 0.15, and a fraction 0.1p of all
          input tokens are wrong.
        </p>
      </Theorem>
      <Proof>
        <p>
          A position shows its own token either when it is not a target, probability 1 − p, or when it is a target left
          unchanged, probability 0.1p; Bayes&apos; rule gives the ratio. Random replacements occur with probability 0.1p. With
          only [MASK] corruption, the model could ignore every visible token&apos;s own identity when building its vector
          for it, since visible tokens would never be scored; and [MASK] never appears when the encoder is later used on
          real text. The unchanged and random cases make every position worth representing well and keep the input close
          to real text.
        </p>
      </Proof>

      <Definition title="padding and pooling">
        <p>
          Sequences in a batch have different lengths, so they are padded to a common length, and an attention mask sets the
          scores of padded keys to −∞, the encoder&apos;s counterpart of the causal mask. A sentence-level representation is
          the vector at a special first token, [CLS] in BERT, or the mean over real positions.
        </p>
        <Code>{PAD}</Code>
      </Definition>

      <Remark title="where encoders stand">
        <p>
          BERT also had a next-sentence prediction task, which later work such as RoBERTa found unnecessary and dropped, and
          trained for longer on more data with the same masked objective. Encoders remain the usual choice where a fixed
          representation is the goal, such as retrieval embeddings and classifiers, because each input needs only one
          bidirectional pass. Only about one token in seven is scored per sequence, though, against every token for a GPT,
          a cost that comes up again when we ask why decoder-only models won.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "targets",
      rung: "check",
      prompt: <p>With masking rate 0.15, how many target positions does a 512-token sequence have on average?</p>,
      answer: { kind: "numeric", value: 76.8, tolerance: 1e-9 },
    },
    {
      key: "kept",
      rung: "check",
      prompt: <p>With p = 0.15 and the 80-10-10 rule, what is the probability that a token shown as itself is a target? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0173, tolerance: 0.00006 },
    },
    {
      key: "generate",
      rung: "apply",
      prompt: <p>Why is a BERT-style encoder not used to generate text left to right?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is trained to predict hidden tokens from both sides, so it gives no chain of next-token probabilities to sample from",
          "It has no unembedding matrix",
          "Its attention is causal, so it cannot see the prompt",
          "Its vocabulary has no end-of-text token",
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

def mask_tokens(tokens, rng, mask_id, vocab, p=0.15):
    tokens = np.asarray(tokens)
    chosen = rng.random(len(tokens)) < p
    r = rng.random(len(tokens))
    inputs = tokens.copy()
    inputs[chosen & (r < 0.8)] = mask_id
    swap = chosen & (r >= 0.8) & (r < 0.9)
    inputs[swap] = rng.integers(0, vocab, size=swap.sum())
    return inputs, np.where(chosen, tokens, -1)

def mlm_loss(logits, targets):
    keep = targets >= 0
    z = logits[keep] - logits[keep].max(-1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(-1, keepdims=True))
    return float(-logp[np.arange(keep.sum()), targets[keep]].mean())

def pseudo_log_likelihood(model, tokens, mask_id):
    total = 0.0
    for i in range(len(tokens)):
        x = np.array(tokens)
        x[i] = mask_id
        z = model(x)[i]
        total += z[tokens[i]] - z.max() - np.log(np.exp(z - z.max()).sum())
    return float(total)

inp, tgt = mask_tokens([5, 6, 7], np.random.default_rng(0), 99, 10, p=0.0); print(inp.tolist(), tgt.tolist())
print(round(mlm_loss(np.zeros((4, 4)), np.array([-1, 2, -1, 0])), 4), round(pseudo_log_likelihood(lambda x: np.zeros((len(x), 4)), [1, 2, 3], 0), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 6, 7] [-1, -1, -1]\n1.3863 -4.1589",
          "[99, 99, 99] [5, 6, 7]\n1.3863 -4.1589",
          "[5, 6, 7] [-1, -1, -1]\n0.6931 -4.1589",
          "[5, 6, 7] [-1, -1, -1]\n1.3863 -1.3863",
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

def pad_batch(seqs, pad_id=0):
    T = max(len(s) for s in seqs)
    ids = np.full((len(seqs), T), pad_id)
    mask = np.zeros((len(seqs), T), bool)
    for b, s in enumerate(seqs):
        ids[b, : len(s)] = s
        mask[b, : len(s)] = True
    return ids, mask

def key_mask_scores(S, mask):
    return np.where(mask[:, None, :], S, -np.inf)

def mean_pool(H, mask):
    m = mask[..., None].astype(float)
    return (H * m).sum(1) / m.sum(1)

ids, m = pad_batch([[4, 5, 6], [7]]); print(ids.tolist(), m.sum(1).tolist())
H = np.arange(12.0).reshape(2, 3, 2); print(mean_pool(H, m).tolist(), int(np.isinf(key_mask_scores(np.zeros((2, 3, 3)), m)).sum()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[4, 5, 6], [7, 0, 0]] [3, 1]\n[[2.0, 3.0], [6.0, 7.0]] 6",
          "[[4, 5, 6], [7, 0, 0]] [3, 1]\n[[2.0, 3.0], [8.0, 9.0]] 6",
          "[[4, 5, 6], [7, 0, 0]] [3, 1]\n[[2.0, 3.0], [6.0, 7.0]] 2",
          "[[4, 5, 6], [7]] [3, 1]\n[[2.0, 3.0], [6.0, 7.0]] 6",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>mask_tokens(tokens, rng, mask_id, vocab, p=0.15)</C>, drawing <C>rng.random(n)</C> for the choice of
          targets, then <C>rng.random(n)</C> for the 80-10-10 split, then <C>rng.integers(0, vocab, size=k)</C> for the k
          replacements, and returning the inputs and the targets with −1 at non-targets;{" "}
          <C>mlm_loss(logits, targets)</C>, the mean cross-entropy over targets as a float; and{" "}
          <C>pseudo_log_likelihood(model, tokens, mask_id)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def mask_tokens(tokens, rng, mask_id, vocab, p=0.15):
    tokens = np.asarray(tokens)
    return tokens, tokens

def mlm_loss(logits, targets):
    return 0.0

def pseudo_log_likelihood(model, tokens, mask_id):
    return 0.0
`,
        solution: MLM,
        tests: [
          { name: "masking", code: `rng = np.random.default_rng(0); t = np.arange(100000) % 50 + 1; i, g = mask_tokens(t, rng, 0, 51)
ch = g >= 0; assert abs(ch.mean() - 0.15) < 0.005 and np.all(g[ch] == t[ch]) and np.all(i[~ch] == t[~ch])
assert abs((i[ch] == 0).mean() - 0.8) < 0.02 and abs(((i == t) & ch).sum() / ch.sum() - 0.102) < 0.01
r = np.random.default_rng(5); a = r.random(6) < 0.5; b = r.random(6); i, g = mask_tokens(np.arange(1, 7), np.random.default_rng(5), 0, 9, p=0.5)
assert np.array_equal(g >= 0, a) and np.array_equal(i[a & (b < 0.8)], np.zeros((a & (b < 0.8)).sum()))` },
          { name: "losses", code: `assert abs(mlm_loss(np.zeros((4, 4)), np.array([-1, 2, -1, 0])) - np.log(4)) < 1e-12
L = np.array([[0.0, 2.0], [5.0, 0.0], [1.0, 1.0]]); assert abs(mlm_loss(L, np.array([1, -1, 0])) - (np.log(1 + np.exp(-2)) + np.log(2)) / 2) < 1e-12
v = pseudo_log_likelihood(lambda x: np.tile([[0.0, 1.0, 0.0]], (len(x), 1)), [1, 0], 2); assert abs(v - (1 - 2 * np.log(np.e + 2))) < 1e-12
seen = []; pseudo_log_likelihood(lambda x: seen.append(x.copy()) or np.zeros((len(x), 3)), [1, 2], 0); assert [s.tolist() for s in seen] == [[0, 2], [1, 0]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>pad_batch(seqs, pad_id=0)</C>, returning the padded ids and a boolean mask of real positions;{" "}
          <C>key_mask_scores(S, mask)</C>, which sets scores <C>S[b, i, j]</C> to −∞ wherever key j of sequence b is padding;
          and <C>mean_pool(H, mask)</C>, the mean of H over real positions only.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def pad_batch(seqs, pad_id=0):
    return np.array([s[:1] for s in seqs]), np.ones((len(seqs), 1), bool)

def key_mask_scores(S, mask):
    return S

def mean_pool(H, mask):
    return H.mean(1)
`,
        solution: PAD,
        tests: [
          { name: "pad", code: `ids, m = pad_batch([[4, 5, 6], [7]], pad_id=9); assert ids.tolist() == [[4, 5, 6], [7, 9, 9]] and m.tolist() == [[True] * 3, [True, False, False]]
S = np.arange(18.0).reshape(2, 3, 3); X = key_mask_scores(S, m); assert np.all(X[0] == S[0]) and np.all(np.isinf(X[1][:, 1:])) and np.all(X[1][:, 0] == S[1][:, 0])` },
          { name: "pool", code: `ids, m = pad_batch([[1, 2], [3], [4, 5, 6]]); H = np.random.default_rng(0).standard_normal((3, 3, 4))
P = mean_pool(H, m); assert np.allclose(P[0], H[0, :2].mean(0)) and np.allclose(P[1], H[1, 0]) and np.allclose(P[2], H[2].mean(0))` },
        ],
      },
    },
    {
      key: "rate",
      rung: "stretch",
      prompt: <p>Some later encoders mask 40% of positions. With the 80-10-10 rule, what is then the probability that a token shown as itself is a target? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.0625, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        An encoder understands but does not generate; a decoder generates but reads only leftwards. The next lesson joins
        the two: an encoder reads the input in both directions and a decoder writes the output while attending to it.
      </p>
    </>
  ),
};
