import { M, MD } from "@/components/Math";
import { Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ConversationCostViz } from "@/components/viz/ConversationCostViz";
import type { LessonContent } from "@/lib/types";

const RANK = `import numpy as np

def attn_matrix(S, causal):
    if causal:
        S = np.where(np.tril(np.ones(S.shape, bool)), S, -np.inf)
    A = np.exp(S - S.max(1, keepdims=True))
    return A / A.sum(1, keepdims=True)

def causal_det(S):
    return float(np.prod(np.diag(attn_matrix(S, True))))

def numerical_rank(A, tol=1e-8):
    s = np.linalg.svd(A, compute_uv=False)
    return int((s > tol * s[0]).sum())`;

const COST = `import math

def scored_tokens(T, objective, rate=0.15, mean_len=3):
    if objective == "causal":
        return T
    if objective == "mlm":
        return rate * T
    noise = round(T * rate)
    return noise + max(1, round(noise / mean_len)) + 1

def reencode_cost(turns):
    total, history = 0, 0
    for m in turns:
        history += m
        total += history
    return total

def sequences_needed(target, T, objective):
    return math.ceil(target / scored_tokens(T, objective))`;

export const lesson: LessonContent = {
  id: "l5.4.4",
  minutes: 40,
  links: {
    requires: ["l5.4.3"],
    revisits: ["l5.3.4", "l5.4.1"],
    foreshadows: ["l5.6.1"],
  },

  puzzle: (
    <>
      <p>
        In 2019 the best results on language-understanding benchmarks came from BERT-style encoders, and T5&apos;s careful
        study preferred an encoder-decoder. A few years later nearly every large general-purpose model was a plain causal
        decoder. Seeing only to the left looks like a handicap. What did the decoder-only design offer that outweighed it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        No single argument settles it, but several point the same way. A causal model learns from every token, while masked
        objectives score a fraction of them. It generates natively, so one model and one interface cover every task, and
        its KV cache lets a growing conversation be processed once instead of re-read at each turn. With scale it learned to
        follow examples and instructions given in the prompt, which removed the need for task-specific heads. And its
        attention matrices have a structural property, full rank, that bidirectional ones lack.
      </p>
      <ConversationCostViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the training signal">
        <p>
          Per sequence of T tokens, a causal language model scores T predictions, masked language modelling with rate p
          scores pT on average, and span corruption scores its target of <M>{"N + K + 1"}</M> tokens, about{" "}
          <M>{"rT(1 + 1/\\mu)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Every position of a causal model predicts the next token. Under masking, each position is a target with
          probability p, and linearity of expectation gives pT. The span-corruption count is the target length from the
          lesson on T5, with <M>{"N = rT"}</M> and <M>{"K = N/\\mu"}</M>. The forward pass costs about the same in each
          case, so per FLOP the causal objective extracts several times as many scored predictions; whether each is as
          useful is an empirical question, since a masked prediction sees context on both sides.
        </p>
        <Code>{COST}</Code>
      </Proof>

      <Theorem title="causal attention has full rank">
        <p>
          A causal softmax attention matrix is invertible, with determinant{" "}
          <M>{"\\prod_ia_{ii} > 0"}</M>. A bidirectional one can have rank 1.
        </p>
      </Theorem>
      <Proof>
        <p>
          The mask makes the matrix lower triangular, and its diagonal entries{" "}
          <M>{"a_{ii} = e^{s_{ii}}/\\sum_{j \\le i}e^{s_{ij}}"}</M> are positive, so the determinant, the product of the
          diagonal, is positive. Without the mask, equal scores give every row the uniform distribution, a matrix of rank 1.
          A causal head can therefore never collapse its T inputs to fewer independent mixtures, while a bidirectional head
          can. This is a property of one head, not a proof of better models, but it is one argument offered for why causal
          attention keeps more information per layer.
        </p>
        <Code>{RANK}</Code>
      </Proof>

      <Theorem title="conversations">
        <p>
          A dialogue of n turns, each adding m tokens, costs a causal model with a KV cache nm token passes. A model that
          encodes the history bidirectionally must re-encode it at each turn, <M>{"m\\,n(n+1)/2"}</M> token passes in all.
        </p>
      </Theorem>
      <Proof>
        <p>
          With the cache, each token is processed once, by the exactness theorem of the KV cache lesson. Bidirectionally, a
          new token can change the state of every earlier one, since each attends to it; so after turn k all km tokens of
          history are encoded again, and <M>{"\\sum_{k=1}^nkm = m\\,n(n+1)/2"}</M>.
        </p>
      </Proof>

      <Remark title="what the experiments said">
        <p>
          A controlled comparison by Wang and others in 2022 found that after unsupervised pre-training alone, causal decoders
          generalised best to new tasks given only a prompt, while models with bidirectional attention over the input,
          trained with masked objectives, did best after fine-tuning on many tasks at once. GPT-3 then showed that a large enough causal model can learn a task from a
          few examples in its prompt, which needs no fine-tuning at all. With one architecture serving pre-training,
          prompting, chat and generation, and an inference stack built around the KV cache, the field converged on it.
          Encoders remain the better tool for embeddings and classification at small cost, as the encoder lesson noted.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "det",
      rung: "check",
      prompt: <p>All attention scores of a 5 × 5 causal head are equal. What is the determinant of its attention matrix? Give five decimals.</p>,
      answer: { kind: "numeric", value: 0.00833, tolerance: 0.000006 },
    },
    {
      key: "turns",
      rung: "check",
      prompt: <p>A conversation has 10 turns of 200 tokens. How many times more token passes does re-encoding the history cost than a causal model with a cache?</p>,
      answer: { kind: "numeric", value: 5.5, tolerance: 1e-9 },
    },
    {
      key: "rank",
      rung: "apply",
      prompt: <p>Why can a causal softmax attention matrix never be singular?</p>,
      answer: {
        kind: "choice",
        options: [
          "It is lower triangular and every diagonal entry is a positive softmax weight, so its determinant is positive",
          "Its rows sum to one",
          "Its entries are all positive",
          "It is symmetric and positive definite",
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

def attn_matrix(S, causal):
    if causal:
        S = np.where(np.tril(np.ones(S.shape, bool)), S, -np.inf)
    A = np.exp(S - S.max(1, keepdims=True))
    return A / A.sum(1, keepdims=True)

def causal_det(S):
    return float(np.prod(np.diag(attn_matrix(S, True))))

def numerical_rank(A, tol=1e-8):
    s = np.linalg.svd(A, compute_uv=False)
    return int((s > tol * s[0]).sum())

S = np.zeros((3, 3)); print(np.round(attn_matrix(S, True), 3).tolist())
print(numerical_rank(attn_matrix(S, False)), numerical_rank(attn_matrix(S, True)), round(causal_det(S), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.333, 0.333, 0.333]]\n1 3 0.1667",
          "[[1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.333, 0.333, 0.333]]\n3 3 0.1667",
          "[[0.333, 0.333, 0.333], [0.333, 0.333, 0.333], [0.333, 0.333, 0.333]]\n1 1 0.0",
          "[[1.0, 0.0, 0.0], [0.5, 0.5, 0.0], [0.333, 0.333, 0.333]]\n1 3 0.037",
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

def scored_tokens(T, objective, rate=0.15, mean_len=3):
    if objective == "causal":
        return T
    if objective == "mlm":
        return rate * T
    noise = round(T * rate)
    return noise + max(1, round(noise / mean_len)) + 1

def reencode_cost(turns):
    total, history = 0, 0
    for m in turns:
        history += m
        total += history
    return total

def sequences_needed(target, T, objective):
    return math.ceil(target / scored_tokens(T, objective))

print(scored_tokens(512, "causal"), scored_tokens(512, "mlm"), scored_tokens(512, "span"))
print(reencode_cost([10, 10, 10]), sequences_needed(1000, 512, "mlm"))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["512 76.8 104\n60 14", "512 76.8 104\n30 14", "512 76.8 77\n60 14", "512 76.8 104\n60 13"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>attn_matrix(S, causal)</C>, the row softmax of the score matrix S with the causal mask applied when asked;{" "}
          <C>causal_det(S)</C>, the determinant of the causal matrix as a float, computed from its diagonal; and{" "}
          <C>numerical_rank(A, tol=1e-8)</C>, the number of singular values above tol times the largest.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def attn_matrix(S, causal):
    return np.exp(S)

def causal_det(S):
    return 0.0

def numerical_rank(A, tol=1e-8):
    return len(A)
`,
        solution: RANK,
        tests: [
          { name: "matrices", code: `S = np.zeros((3, 3)); assert np.allclose(attn_matrix(S, True), [[1, 0, 0], [0.5, 0.5, 0], [1 / 3] * 3]) and np.allclose(attn_matrix(S, False), 1 / 3)
rng = np.random.default_rng(0); S = rng.standard_normal((6, 6)) * 3; A = attn_matrix(S, True)
assert np.allclose(A.sum(1), 1) and np.allclose(np.triu(A, 1), 0) and abs(causal_det(S) - np.linalg.det(A)) < 1e-12 and isinstance(causal_det(S), float)
assert np.allclose(attn_matrix(S + 100, False), attn_matrix(S, False))` },
          { name: "rank", code: `assert numerical_rank(attn_matrix(np.zeros((4, 4)), False)) == 1 and numerical_rank(attn_matrix(np.zeros((4, 4)), True)) == 4
assert numerical_rank(np.diag([1.0, 1e-3, 1e-12])) == 2 and numerical_rank(np.diag([1.0, 1e-3, 1e-12]), tol=1e-2) == 1` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>scored_tokens(T, objective, rate=0.15, mean_len=3)</C> for objectives &quot;causal&quot;, &quot;mlm&quot;
          and &quot;span&quot;, using the rounding of the T5 lesson for spans; <C>reencode_cost(turns)</C>, the total tokens
          encoded when the whole history is re-read after each turn; and <C>sequences_needed(target, T, objective)</C>, the
          fewest sequences whose expected scored tokens reach target.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def scored_tokens(T, objective, rate=0.15, mean_len=3):
    return T

def reencode_cost(turns):
    return sum(turns)

def sequences_needed(target, T, objective):
    return target // T
`,
        solution: COST,
        tests: [
          { name: "scored", code: `assert scored_tokens(512, "causal") == 512 and abs(scored_tokens(512, "mlm") - 76.8) < 1e-12 and scored_tokens(512, "span") == 104
assert abs(scored_tokens(100, "mlm", rate=0.4) - 40) < 1e-12 and scored_tokens(20, "span", mean_len=8) == 5` },
          { name: "costs", code: `assert reencode_cost([10, 10, 10]) == 60 and reencode_cost([5, 1, 3]) == 5 + 6 + 9 and reencode_cost([]) == 0
assert sequences_needed(1000, 512, "mlm") == 14 and sequences_needed(1024, 512, "causal") == 2 and sequences_needed(1025, 512, "causal") == 3` },
        ],
      },
    },
    {
      key: "match",
      rung: "stretch",
      prompt: <p>How many 512-token sequences under masked language modelling at rate 0.15 are needed, in expectation, to score as many tokens as 100 causal sequences of the same length?</p>,
      answer: { kind: "numeric", value: 667, tolerance: 0 },
    },
  ],

  glimpse: (
    <>
      <p>
        A decoder-only model gives a distribution over the next token; turning it into text means choosing tokens. The next
        part is about decoding, starting with the two simplest strategies: always take the most likely token, or search
        for the most likely sequence.
      </p>
    </>
  ),
};
