import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SelectiveAnswerViz } from "@/components/viz/SelectiveAnswerViz";
import type { LessonContent } from "@/lib/types";

const ANSWER = `import numpy as np

def selective(conf, correct, tau):
    answered = conf >= tau
    acc = correct[answered].mean() if answered.any() else float("nan")
    return float(answered.mean()), float(acc)

def calibration_error(conf, correct, bins=10):
    idx = np.minimum((conf * bins).astype(int), bins - 1)
    total = 0.0
    for b in range(bins):
        m = idx == b
        if m.any():
            total += m.mean() * abs(conf[m].mean() - correct[m].mean())
    return float(total)

def error_free_prob(eps, n):
    return (1 - eps) ** n`;

const REVERSE = `import numpy as np

def train_memory(pairs, V):
    W = np.zeros((V, V))
    for a, b in pairs:
        W[b, a] += 1
    return W

def query(W, x):
    col = W[:, x]
    return int(col.argmax()) if col.any() else None

def reversal_accuracy(W, pairs):
    return float(np.mean([query(W, b) == a for a, b in pairs]))`;

export const lesson: LessonContent = {
  id: "l5.6.4",
  minutes: 45,
  links: {
    requires: ["l5.6.3", "l2.8.2"],
    revisits: ["l5.1.1", "l5.5.1", "l5.2.3"],
    foreshadows: ["l7.7.4", "l9.3.1"],
  },

  puzzle: (
    <>
      <p>
        A model that writes fluent essays may miscount the letters in a short word, insist on a citation that does not
        exist, or know that a famous person&apos;s mother is a certain woman while failing to name that woman&apos;s son.
        These failures look random, but most of them follow from things this course has built: tokens, next-token
        training, associative storage and decoding. Which mechanism lies behind each?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A language model sees token ids, not letters, so questions about spelling ask it to recall facts about tokens. It is
        trained to predict what comes next in one direction, so a fact stored as &quot;A is B&quot; is a map from A, not from
        B. It always produces some token, and decoding picks a fluent one, so when its knowledge runs out it guesses in the
        same confident style. Long outputs compound small per-token errors, and positions beyond those seen in training put
        the model off-distribution. Knowing the mechanism tells you what helps: tools for counting, data in both
        directions, abstention, verification.
      </p>
      <SelectiveAnswerViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="errors compound with length">
        <p>
          If each generated token is wrong with probability ε independently, an output of n tokens is error-free with
          probability <M>{"(1 - \\varepsilon)^n"}</M>, which lies between <M>{"1 - n\\varepsilon"}</M> and{" "}
          <M>{"e^{-n\\varepsilon}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Independence multiplies the probabilities. Bernoulli&apos;s inequality gives the lower bound and{" "}
          <M>{"1 - \\varepsilon \\le e^{-\\varepsilon}"}</M> the upper. Errors are not really independent, and a model can
          notice and repair a slip, but the estimate explains why long chains of reasoning or code fail more often than
          short ones at the same per-step reliability, and why checking intermediate results pays.
        </p>
      </Proof>

      <Definition title="selective answering and calibration">
        <p>
          A model is <em>calibrated</em> if, among the questions to which it gives confidence c, a fraction c is answered
          correctly. Answering only when confidence is at least τ gives a coverage, the fraction answered, and an accuracy
          on those answered. The expected calibration error averages <M>{"|\\text{confidence} - \\text{accuracy}|"}</M> over
          confidence bins, weighted by their size.
        </p>
        <Code>{ANSWER}</Code>
      </Definition>

      <Theorem title="answering everything">
        <p>
          A calibrated model that must answer every question with its top choice has expected accuracy{" "}
          <M>{"\\mathbb E[c]"}</M>, where c is its confidence in that choice. Answering only when c ≥ τ raises the expected
          accuracy to <M>{"\\mathbb E[c \\mid c \\ge \\tau]"}</M> on the questions it answers.
        </p>
      </Theorem>
      <Proof>
        <p>
          Calibration says <M>{"P(\\text{correct} \\mid c) = c"}</M>; average over all questions, or over those with c ≥ τ. Since
          the conditional mean of c above a threshold is at least the overall mean, abstention never lowers accuracy. Next-token
          training does make base models fairly calibrated on their own training distribution, but a model that has never
          been rewarded for &quot;I don&apos;t know&quot; has no reason to say it, and post-training can disturb calibration in
          either direction.
        </p>
      </Proof>

      <Theorem title="a memory written one way is read one way">
        <p>
          Store facts <M>{"a_i \\to b_i"}</M> as <M>{"W = \\sum_ie_{b_i}e_{a_i}^\\top"}</M>, with one-hot input codes. If no{" "}
          <M>{"b_i"}</M> is ever a subject, then <M>{"We_{b_j} = 0"}</M>: the reverse query retrieves nothing.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"We_{b_j} = \\sum_ie_{b_i}(e_{a_i}^\\top e_{b_j})"}</M>, and every inner product vanishes because <M>{"b_j"}</M> differs
          from every <M>{"a_i"}</M>. Language models trained on &quot;A is B&quot; show the same asymmetry, the
          &quot;reversal curse&quot;: next-token training updates how A&apos;s context predicts B, and nothing ties B&apos;s
          context to A. Training data that states facts in both directions removes it, as the last call in the second
          exercise of reading code shows.
        </p>
        <Code>{REVERSE}</Code>
      </Proof>

      <Remark title="more failure modes and their mechanisms">
        <p>
          Spelling and counting letters fail because a word like &quot;strawberry&quot; may be one or two tokens whose
          letters the model must have memorised, as the tokenisation lesson showed; arithmetic on long numbers suffers
          from inconsistent digit chunking in the same way. Inputs longer than the training context put positional encodings
          outside their trained range. Facts in the middle of long contexts are used less reliably than those at the ends.
          Models are sensitive to the wording and order of examples in a prompt, and tend to agree with opinions stated in
          it. Each of these is an object of current research, and post-training, retrieval and tool use are the main
          remedies; the course on post-training and alignment takes them up.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "compound",
      rung: "check",
      prompt: <p>Each token of a 500-token answer is independently wrong with probability 0.002. What is the probability that the whole answer is error-free? Give four decimals.</p>,
      answer: { kind: "numeric", value: 0.3675, tolerance: 0.00006 },
    },
    {
      key: "maxlen",
      rung: "check",
      prompt: <p>With per-token error 0.001, what is the longest output whose error-free probability is still at least 0.9?</p>,
      answer: { kind: "numeric", value: 105, tolerance: 0 },
    },
    {
      key: "reversal",
      rung: "apply",
      prompt: <p>A model trained on many sentences of the form &quot;X&apos;s mother is Y&quot; fails to answer &quot;Who is Y&apos;s son?&quot;. What is the best explanation?</p>,
      answer: {
        kind: "choice",
        options: [
          "Next-token training stored a map from X's context to Y, and nothing in the data trained a map from Y back to X",
          "The model's context window is too short",
          "The answer is hidden by the causal mask",
          "Sampling temperature was too high",
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

def selective(conf, correct, tau):
    answered = conf >= tau
    acc = correct[answered].mean() if answered.any() else float("nan")
    return float(answered.mean()), float(acc)

def calibration_error(conf, correct, bins=10):
    idx = np.minimum((conf * bins).astype(int), bins - 1)
    total = 0.0
    for b in range(bins):
        m = idx == b
        if m.any():
            total += m.mean() * abs(conf[m].mean() - correct[m].mean())
    return float(total)

def error_free_prob(eps, n):
    return (1 - eps) ** n

conf = np.array([0.95, 0.9, 0.6, 0.4, 0.3]); correct = np.array([True, True, False, True, False])
print([round(v, 4) for v in selective(conf, correct, 0.5)], selective(conf, correct, 0.0), round(error_free_prob(0.01, 100), 4))
print(round(calibration_error(conf, correct, 2), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.6, 0.6667] (1.0, 0.6) 0.366\n0.15",
          "[0.6, 0.6667] (1.0, 0.6) 0.366\n0.075",
          "[0.4, 0.5] (1.0, 0.6) 0.366\n0.15",
          "[0.6, 0.6667] (1.0, 0.6) 0.99\n0.15",
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

def train_memory(pairs, V):
    W = np.zeros((V, V))
    for a, b in pairs:
        W[b, a] += 1
    return W

def query(W, x):
    col = W[:, x]
    return int(col.argmax()) if col.any() else None

def reversal_accuracy(W, pairs):
    return float(np.mean([query(W, b) == a for a, b in pairs]))

pairs = [(0, 3), (1, 4), (2, 5)]; W = train_memory(pairs, 6)
print(query(W, 0), query(W, 3), reversal_accuracy(W, pairs), reversal_accuracy(train_memory(pairs + [(b, a) for a, b in pairs], 6), pairs))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["3 None 0.0 1.0", "3 0 1.0 1.0", "3 None 0.0 0.0", "0 None 0.0 1.0"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>selective(conf, correct, tau)</C>, returning coverage and accuracy as floats, with accuracy NaN when
          nothing is answered; <C>calibration_error(conf, correct, bins=10)</C>, with equal-width bins on [0, 1] and confidence
          1 in the top bin; and <C>error_free_prob(eps, n)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def selective(conf, correct, tau):
    return 1.0, float(correct.mean())

def calibration_error(conf, correct, bins=10):
    return 0.0

def error_free_prob(eps, n):
    return 1 - eps
`,
        solution: ANSWER,
        tests: [
          { name: "selective", code: `conf = np.array([0.95, 0.9, 0.6, 0.4, 0.3]); correct = np.array([True, True, False, True, False])
c, a = selective(conf, correct, 0.5); assert abs(c - 0.6) < 1e-12 and abs(a - 2 / 3) < 1e-12 and isinstance(c, float)
c, a = selective(conf, correct, 0.99); assert c == 0 and np.isnan(a)
assert abs(error_free_prob(0.002, 500) - 0.998 ** 500) < 1e-12 and error_free_prob(0.5, 0) == 1` },
          { name: "calibration", code: `conf = np.array([0.95, 0.9, 0.6, 0.4, 0.3]); correct = np.array([True, True, False, True, False])
assert abs(calibration_error(conf, correct, 2) - 0.15) < 1e-12 and abs(calibration_error(np.array([1.0, 1.0]), np.array([True, False]), 10) - 0.5) < 1e-12
rng = np.random.default_rng(0); c = rng.random(200000); ok = rng.random(200000) < c; assert calibration_error(c, ok) < 0.01 and calibration_error(c, ok ^ True) > 0.3` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>train_memory(pairs, V)</C>, the V × V count matrix with entry [b, a] incremented for each pair (a, b);{" "}
          <C>query(W, x)</C>, the most frequent object stored for subject x, or None if there is none; and{" "}
          <C>reversal_accuracy(W, pairs)</C>, the fraction of pairs (a, b) for which querying b returns a.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def train_memory(pairs, V):
    return np.eye(V)

def query(W, x):
    return x

def reversal_accuracy(W, pairs):
    return 1.0
`,
        solution: REVERSE,
        tests: [
          { name: "memory", code: `pairs = [(0, 3), (1, 4), (2, 5)]; W = train_memory(pairs, 6)
assert W.sum() == 3 and W[3, 0] == 1 and query(W, 0) == 3 and query(W, 3) is None
assert query(train_memory([(0, 1), (0, 2), (0, 2)], 3), 0) == 2` },
          { name: "reversal", code: `pairs = [(0, 3), (1, 4), (2, 5)]; assert reversal_accuracy(train_memory(pairs, 6), pairs) == 0.0
assert reversal_accuracy(train_memory(pairs + [(b, a) for a, b in pairs], 6), pairs) == 1.0
assert reversal_accuracy(train_memory(pairs + [(4, 1)], 6), pairs) == 1 / 3 and isinstance(reversal_accuracy(train_memory(pairs, 6), pairs), float)` },
        ],
      },
    },
    {
      key: "abstain",
      rung: "stretch",
      prompt: <p>A calibrated model&apos;s confidence is uniform on [0.5, 1]. If it answers only when its confidence is at least 0.8, what accuracy does it reach on the questions it answers?</p>,
      answer: { kind: "numeric", value: 0.9, tolerance: 1e-9 },
    },
  ],

  glimpse: (
    <>
      <p>
        That completes the course on large language models: from tokens to a trained GPT, the architectures it beat, the
        ways of decoding it, and what it does with its context and weights. Later courses scale it up, align it with what
        people want, and serve it efficiently.
      </p>
    </>
  ),
};
