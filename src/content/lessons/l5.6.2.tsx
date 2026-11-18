import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InductionHeadViz } from "@/components/viz/InductionHeadViz";
import type { LessonContent } from "@/lib/types";

const HEADS = `import numpy as np

def prev_token_features(tokens, V):
    E = np.eye(V)[tokens]
    P = np.zeros_like(E)
    P[1:] = E[:-1]
    return E, P

def induction_scores(tokens, V, beta=10.0):
    E, P = prev_token_features(tokens, V)
    T = len(tokens)
    S = np.where(np.tril(np.ones((T, T), bool)), beta * E @ P.T, -np.inf)
    A = np.exp(S - S.max(1, keepdims=True))
    return A / A.sum(1, keepdims=True)

def induction_predict(tokens, V, beta=10.0):
    return induction_scores(tokens, V, beta) @ np.eye(V)[tokens]`;

const PROBE = `import numpy as np

def repeated_random(T, V, rng):
    s = rng.integers(0, V, T)
    return np.concatenate([s, s])

def prefix_matching(A, tokens):
    scores = []
    for i in range(len(tokens)):
        js = [j for j in range(1, i + 1) if tokens[j - 1] == tokens[i]]
        if js:
            scores.append(sum(A[i, j] for j in js))
    return float(np.mean(scores))

def copy_accuracy(pred, tokens, start):
    hits = [pred[i].argmax() == tokens[i + 1] for i in range(start, len(tokens) - 1)]
    return float(np.mean(hits))`;

export const lesson: LessonContent = {
  id: "l5.6.2",
  minutes: 45,
  links: {
    requires: ["l5.6.1"],
    revisits: ["l5.2.4", "l5.2.3"],
    foreshadows: ["l5.6.3", "l11.4.1"],
  },

  puzzle: (
    <>
      <p>
        Feed a trained language model a sequence of random tokens, then the same sequence again. On the first copy its loss
        is as bad as guessing; on the second it is nearly perfect, though nothing about those tokens was in its training
        data. Something in the network has learned the rule &quot;if A was followed by B before, and A appears again,
        predict B&quot;. Which attention heads implement it, and why does it take two layers?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        The rule needs two steps. First each position must know which token came just before it: a{" "}
        <em>previous-token head</em> attends from every position to the one before and writes that token into the residual
        stream. Then an <em>induction head</em> at the current position, holding token A, uses A as its query and the
        stored previous tokens as keys. The positions that match are those just after an earlier A, and copying the token
        there yields B. Try it on a sentence with a repeated phrase.
      </p>
      <InductionHeadViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a hand-built induction circuit">
        <p>
          With one-hot token vectors <M>{"e_{t_i}"}</M>, the previous-token head gives position j the vector{" "}
          <M>{"p_j = e_{t_{j-1}}"}</M> (zero at j = 0). The induction head at position i uses query <M>{"e_{t_i}"}</M>, keys{" "}
          <M>{"p_j"}</M> for j ≤ i, scores <M>{"\\beta e_{t_i}^\\top p_j"}</M>, and values <M>{"e_{t_j}"}</M>; its output is a
          distribution over the vocabulary.
        </p>
        <Code>{HEADS}</Code>
      </Definition>

      <Theorem title="the circuit copies the continuation">
        <p>
          If token <M>{"t_i"}</M> occurred exactly once before, at position k with k + 1 ≤ i, the induction head puts weight{" "}
          <M>{"e^\\beta/(e^\\beta + i)"}</M> on position k + 1, so as β grows its output tends to <M>{"e_{t_{k+1}}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The score of j is β when <M>{"t_{j-1} = t_i"}</M> and 0 otherwise. The only j ≤ i with <M>{"t_{j-1} = t_i"}</M> is
          j = k + 1, since k is the only earlier occurrence and position i itself would need <M>{"t_{i-1} = t_i"}</M>, which
          would be a second occurrence. The other i positions score 0, giving the stated softmax weight on k + 1, and the
          output is the weighted sum of one-hot values. When the token occurred several times, the weight splits between
          their continuations, as with the last &quot;a&quot; in the picture.
        </p>
      </Proof>

      <Theorem title="one layer is not enough">
        <p>
          In a single attention layer whose keys at position j depend only on the token and position at j, no choice of
          weights makes position i attend to j exactly when <M>{"t_{j-1} = t_i"}</M>, for all sequences.
        </p>
      </Theorem>
      <Proof>
        <p>
          Take two sequences that agree everywhere except at position j − 1, where one has <M>{"t_i"}</M> and the other a
          different token. Every key and query, which depend only on the token and position at their own place, is the same
          in both for positions other than j − 1, so the scores of i against j are equal in both sequences. The rule
          demands that i attend to j in the first and not in the second, a contradiction. Information about{" "}
          <M>{"t_{j-1}"}</M> must first be moved into position j by an earlier attention layer: the two heads compose, the
          output of the first feeding the keys of the second.
        </p>
      </Proof>

      <Definition title="measuring induction">
        <p>
          On repeated random sequences, a head&apos;s <em>prefix-matching score</em> is the attention it puts, averaged over
          positions, on tokens whose predecessor equals the current token; induction heads score close to 1. The model&apos;s
          copying accuracy on the second copy measures the behaviour directly.
        </p>
        <Code>{PROBE}</Code>
      </Definition>

      <Remark title="why they matter">
        <p>
          In trained transformers of two or more layers, induction heads form suddenly early in training, at the same point
          where the loss on later tokens of a context drops below the loss on early ones, a bump visible in training curves.
          Fuzzier versions copy patterns rather than exact tokens, for example continuing a translation or a format, which
          links them to in-context learning more broadly. This was the first behaviour of language models explained at the
          level of individual heads, and interpretability courses later build on it.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "weight",
      rung: "check",
      prompt: <p>At position i = 7 with β = 10 and a single earlier match, what weight does the induction head put on the matching position? Give five decimals.</p>,
      answer: { kind: "numeric", value: 0.99968, tolerance: 0.000006 },
    },
    {
      key: "beta",
      rung: "check",
      prompt: <p>What is the smallest β that puts weight at least 0.99 on a single match at position i = 100? Give four decimals.</p>,
      answer: { kind: "numeric", value: 9.2003, tolerance: 0.00006 },
    },
    {
      key: "two",
      rung: "apply",
      prompt: <p>Why does an induction head need an earlier attention layer?</p>,
      answer: {
        kind: "choice",
        options: [
          "Its keys must contain the previous token, which only an earlier attention layer can move into each position",
          "Softmax cannot represent sharp attention in the first layer",
          "The first layer has no access to positional information",
          "The MLP of the first layer must compute the next-token logits",
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

def prev_token_features(tokens, V):
    E = np.eye(V)[tokens]
    P = np.zeros_like(E)
    P[1:] = E[:-1]
    return E, P

def induction_scores(tokens, V, beta=10.0):
    E, P = prev_token_features(tokens, V)
    T = len(tokens)
    S = np.where(np.tril(np.ones((T, T), bool)), beta * E @ P.T, -np.inf)
    A = np.exp(S - S.max(1, keepdims=True))
    return A / A.sum(1, keepdims=True)

def induction_predict(tokens, V, beta=10.0):
    return induction_scores(tokens, V, beta) @ np.eye(V)[tokens]

tokens = [3, 1, 4, 3, 1]; A = induction_scores(tokens, 5)
print(np.round(A[3], 3).tolist(), int(induction_predict(tokens, 5)[3].argmax()), int(induction_predict(tokens, 5)[4].argmax()))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 1.0, 0.0, 0.0, 0.0] 1 4",
          "[1.0, 0.0, 0.0, 0.0, 0.0] 3 1",
          "[0.0, 1.0, 0.0, 0.0, 0.0] 3 1",
          "[0.0, 0.0, 1.0, 0.0, 0.0] 4 3",
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

def repeated_random(T, V, rng):
    s = rng.integers(0, V, T)
    return np.concatenate([s, s])

def prefix_matching(A, tokens):
    scores = []
    for i in range(len(tokens)):
        js = [j for j in range(1, i + 1) if tokens[j - 1] == tokens[i]]
        if js:
            scores.append(sum(A[i, j] for j in js))
    return float(np.mean(scores))

def copy_accuracy(pred, tokens, start):
    hits = [pred[i].argmax() == tokens[i + 1] for i in range(start, len(tokens) - 1)]
    return float(np.mean(hits))

A = np.array([[1.0, 0, 0, 0], [0.5, 0.5, 0, 0], [0.2, 0.2, 0.6, 0], [0.1, 0.7, 0.1, 0.1]]); tokens = [5, 6, 7, 5]
s = repeated_random(3, 10, np.random.default_rng(0)); print(prefix_matching(A, tokens), round(copy_accuracy(np.eye(8)[[6, 6, 5, 6]], tokens, 0), 4), len(s), (s[:3] == s[3:]).all())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.7 0.6667 6 True", "0.1 0.6667 6 True", "0.7 0.5 6 True", "0.7 0.6667 3 False"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>prev_token_features(tokens, V)</C>, returning the one-hot matrix E and the matrix P whose row j is row j − 1
          of E (zero for j = 0); <C>induction_scores(tokens, V, beta=10.0)</C>, the causal attention matrix of the theorem;
          and <C>induction_predict(tokens, V, beta=10.0)</C>, the copied distribution at every position.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def prev_token_features(tokens, V):
    E = np.eye(V)[tokens]
    return E, E

def induction_scores(tokens, V, beta=10.0):
    T = len(tokens)
    return np.eye(T)

def induction_predict(tokens, V, beta=10.0):
    return np.eye(V)[tokens]
`,
        solution: HEADS,
        tests: [
          { name: "features and scores", code: `E, P = prev_token_features([2, 0, 1], 3); assert E.tolist() == [[0, 0, 1], [1, 0, 0], [0, 1, 0]] and P.tolist() == [[0, 0, 0], [0, 0, 1], [1, 0, 0]]
A = induction_scores([3, 1, 4, 3, 1], 5); assert np.allclose(A.sum(1), 1) and np.allclose(np.triu(A, 1), 0)
assert abs(A[3, 1] - np.exp(10) / (np.exp(10) + 3)) < 1e-12 and np.allclose(A[1, :2], 0.5)` },
          { name: "copying", code: `rng = np.random.default_rng(0); s = rng.permutation(30)[:12]; t = np.concatenate([s, s])
pred = induction_predict(t, 30, beta=20.0); assert all(pred[i].argmax() == t[i + 1] for i in range(12, 23))
assert pred.shape == (24, 30) and np.allclose(pred.sum(1), 1) and abs(induction_predict([0, 1, 0], 2, beta=0.0)[2, 0] - 2 / 3) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>repeated_random(T, V, rng)</C>, drawing T tokens with <C>rng.integers(0, V, T)</C> and repeating them;{" "}
          <C>prefix_matching(A, tokens)</C>, the attention on positions 1 ≤ j ≤ i whose predecessor equals token i, averaged
          over the positions i that have at least one such j; and <C>copy_accuracy(pred, tokens, start)</C>, the fraction of
          positions i from start to the second last at which <C>pred[i]</C> has its maximum at <C>tokens[i + 1]</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def repeated_random(T, V, rng):
    return rng.integers(0, V, 2 * T)

def prefix_matching(A, tokens):
    return 0.0

def copy_accuracy(pred, tokens, start):
    return 0.0
`,
        solution: PROBE,
        tests: [
          { name: "repeat", code: `s = repeated_random(5, 7, np.random.default_rng(3)); assert len(s) == 10 and (s[:5] == s[5:]).all() and (s[:5] == np.random.default_rng(3).integers(0, 7, 5)).all()` },
          { name: "metrics", code: `A = np.array([[1.0, 0, 0, 0], [0.5, 0.5, 0, 0], [0.2, 0.2, 0.6, 0], [0.1, 0.7, 0.1, 0.1]])
assert abs(prefix_matching(A, [5, 6, 7, 5]) - 0.7) < 1e-12 and abs(prefix_matching(A, [5, 5, 5, 5]) - np.mean([0.5, 0.8, 0.9])) < 1e-12
assert abs(copy_accuracy(np.eye(8)[[6, 6, 5, 6]], [5, 6, 7, 5], 0) - 2 / 3) < 1e-12 and copy_accuracy(np.eye(8)[[6, 6, 5, 6]], [5, 6, 7, 5], 2) == 1.0` },
        ],
      },
    },
    {
      key: "distinct",
      rung: "stretch",
      prompt: <p>A random sequence of 10 tokens is drawn uniformly from a vocabulary of 50. What is the probability that all 10 are distinct, so that every match on the repeat is unique? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3817, tolerance: 0.00006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Induction heads copy from the context. Facts such as a city&apos;s country must come from the weights instead. Next:
        how models memorise and recall facts, and how much they can store.
      </p>
    </>
  ),
};
