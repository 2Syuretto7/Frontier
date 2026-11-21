import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { AssocMemoryViz } from "@/components/viz/AssocMemoryViz";
import type { LessonContent } from "@/lib/types";

const MEM = `import numpy as np

def store(K, Vals):
    return Vals.T @ K

def recall(W, K, U):
    return np.argmax((K @ W.T) @ U.T, axis=1)

def crosstalk(W, K, Vals):
    return float(((K @ W.T - Vals) ** 2).sum() / (Vals ** 2).sum())`;

const BITS = `import math

def fact_bits(n_facts, n_values):
    return n_facts * math.log2(n_values)

def params_needed(n_facts, n_values, bits_per_param=2.0):
    return fact_bits(n_facts, n_values) / bits_per_param

def extractable(continue_fn, doc, prefix_len):
    return list(continue_fn(doc[:prefix_len], len(doc) - prefix_len)) == list(doc[prefix_len:])`;

export const lesson: LessonContent = {
  id: "l5.6.3",
  minutes: 45,
  links: {
    requires: ["l5.6.2"],
    revisits: ["l5.2.4"],
    foreshadows: ["l5.6.4"],
  },

  puzzle: (
    <>
      <p>
        Ask a language model for the capital of Australia and it answers Canberra without any document in its context. The
        fact must be stored in its weights, alongside millions of others, and occasionally whole passages of training text
        come back word for word. Where in a transformer can a fact live, how many can a given number of parameters hold, and
        when does remembering facts turn into reciting training data?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An MLP layer is a sum of key-value pairs: each hidden unit fires on a pattern in the stream and adds its value. The
        simplest model of this is a single matrix that stores associations as a sum of outer products,{" "}
        <M>{"W = \\sum_iv_ik_i^\\top"}</M>. Presenting a key k reads out its value plus some leakage from the other keys,
        small while the keys are nearly orthogonal. A d-dimensional space has room for d orthogonal keys and many more
        nearly orthogonal ones, so recall degrades gradually as facts pile up, and in the end the count of parameters,
        not the cleverness of the storage, bounds how much can be kept.
      </p>
      <AssocMemoryViz />
    </>
  ),

  theory: (
    <>
      <Definition title="linear associative memory">
        <p>
          Given keys <M>{"k_1, \\dots, k_n \\in \\mathbb R^d"}</M> (for example the stream vector at a subject&apos;s last
          token) and values <M>{"v_i"}</M> (the vector that pushes the logits towards the attribute), store{" "}
          <M>{"W = \\sum_iv_ik_i^\\top"}</M> and recall with <M>{"Wk"}</M>, read out through a nearest-attribute choice such as
          the unembedding.
        </p>
        <Code>{MEM}</Code>
      </Definition>

      <Theorem title="recall and crosstalk">
        <p>
          If the keys are orthonormal, <M>{"Wk_j = v_j"}</M> exactly, which allows at most d facts. If instead the keys are
          independent and uniform on the unit sphere, the expected crosstalk is
        </p>
        <MD>{"\\mathbb E\\|Wk_j - v_j\\|^2 = \\frac1d\\sum_{i \\ne j}\\|v_i\\|^2,"}</MD>
        <p>
          which is (n − 1)/d for unit values.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"Wk_j = v_j(k_j^\\top k_j) + \\sum_{i \\ne j}v_i(k_i^\\top k_j)"}</M>. With orthonormal keys the first factor is 1 and
          the rest vanish. For random keys, the error is <M>{"\\sum_{i \\ne j}v_i\\,c_i"}</M> with{" "}
          <M>{"c_i = k_i^\\top k_j"}</M>. By symmetry <M>{"\\mathbb E[k_ik_i^\\top] = I/d"}</M>, so{" "}
          <M>{"\\mathbb E[c_i^2] = k_j^\\top(I/d)k_j = 1/d"}</M>, and <M>{"\\mathbb E[c_ic_{i'}] = 0"}</M> for i ≠ i′ because flipping
          the sign of <M>{"k_i"}</M> leaves the distribution unchanged. Expanding the squared norm gives the sum. The
          readout tolerates crosstalk of this size because it only has to pick the right attribute, which is why recall in
          the picture survives well beyond n = d before falling.
        </p>
      </Proof>

      <Theorem title="a counting bound on capacity">
        <p>
          Storing n independent facts, each uniformly one of m values, needs at least <M>{"n\\log_2m"}</M> bits. A model with P
          parameters of b bits each holds at most bP bits, so it can store at most <M>{"bP/\\log_2m"}</M> such facts without
          errors.
        </p>
      </Theorem>
      <Proof>
        <p>
          The weights take at most <M>{"2^{bP}"}</M> distinct values, and recall is a function of the weights. If every one of
          the <M>{"m^n"}</M> possible fact tables were recalled correctly, distinct tables would need distinct weights, so{" "}
          <M>{"m^n \\le 2^{bP}"}</M>. Real models store far less than the 16 or 32 bits each parameter occupies: controlled
          experiments on synthetic biographies by Allen-Zhu and Li measured about 2 bits of knowledge per parameter for
          well-trained models, a useful rule of thumb.
        </p>
        <Code>{BITS}</Code>
      </Proof>

      <Definition title="verbatim memorisation">
        <p>
          A training document is <em>extractable</em> with a prefix of k tokens if greedy decoding from those k tokens
          reproduces the rest of the document exactly. This is different from knowing a fact: it is the model having
          compressed one particular string so well that its most likely continuation is that string.
        </p>
      </Definition>

      <Remark title="what drives memorisation">
        <p>
          Measurements on open models found that the fraction of training data that is extractable grows with model size,
          with the number of times a passage was duplicated in the training set, and with the length of the prompt given.
          Removing near-duplicates from the training data reduces it sharply. Because memorised text can include personal
          data or licensed material, extraction tests are part of evaluating a model, and the next lesson collects this with
          other ways in which language models fail.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "xtalk",
      rung: "check",
      prompt: <p>A memory of width d = 64 stores 256 facts with random unit keys and unit values. What is the expected relative crosstalk (n − 1)/d? Give four decimals.</p>,
      answer: { kind: "numeric", value: 3.9844, tolerance: 0.00006 },
    },
    {
      key: "params",
      rung: "check",
      prompt: <p>At 2 bits per parameter, how many million parameters are needed to store 10⁷ facts, each one of 2¹⁶ values?</p>,
      answer: { kind: "numeric", value: 80, tolerance: 1e-9 },
    },
    {
      key: "ortho",
      rung: "apply",
      prompt: <p>Why does W = Σ vᵢkᵢᵀ recall every value exactly when the keys are orthonormal?</p>,
      answer: {
        kind: "choice",
        options: [
          "Wkⱼ = Σ vᵢ(kᵢᵀkⱼ), and orthonormality makes kᵢᵀkⱼ equal 1 for i = j and 0 otherwise",
          "Orthonormal keys make W invertible, and the inverse returns the values",
          "The values are orthonormal too",
          "Orthonormal keys make the softmax sharp",
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

def store(K, Vals):
    return Vals.T @ K

def recall(W, K, U):
    return np.argmax((K @ W.T) @ U.T, axis=1)

def crosstalk(W, K, Vals):
    return float(((K @ W.T - Vals) ** 2).sum() / (Vals ** 2).sum())

K = np.eye(3); U = np.array([[1.0, 2.0], [0.0, -1.0], [3.0, 0.0]]); W = store(K, U[[0, 2, 2]])
print(W.tolist(), recall(W, K, U).tolist(), crosstalk(W, K, U[[0, 2, 2]]))
K = np.array([[1.0, 0.0], [0.6, 0.8]]); W = store(K, U[:2]); print(np.round(K @ W.T, 2).tolist(), round(crosstalk(W, K, U[:2]), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 3.0, 3.0], [2.0, 0.0, 0.0]] [0, 2, 2] 0.0\n[[1.0, 1.4], [0.6, 0.2]] 0.36",
          "[[1.0, 2.0], [3.0, 0.0], [3.0, 0.0]] [0, 2, 2] 0.0\n[[1.0, 1.4], [0.6, 0.2]] 0.36",
          "[[1.0, 3.0, 3.0], [2.0, 0.0, 0.0]] [0, 1, 2] 0.0\n[[1.0, 1.4], [0.6, 0.2]] 0.36",
          "[[1.0, 3.0, 3.0], [2.0, 0.0, 0.0]] [0, 2, 2] 0.0\n[[1.0, 2.0], [0.0, -1.0]] 0.0",
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

def fact_bits(n_facts, n_values):
    return n_facts * math.log2(n_values)

def params_needed(n_facts, n_values, bits_per_param=2.0):
    return fact_bits(n_facts, n_values) / bits_per_param

def extractable(continue_fn, doc, prefix_len):
    return list(continue_fn(doc[:prefix_len], len(doc) - prefix_len)) == list(doc[prefix_len:])

print(fact_bits(1000, 1024), params_needed(10 ** 6, 2 ** 20, 2.0))
cont = lambda p, n: [(p[-1] + 1 + i) % 10 for i in range(n)]; print(extractable(cont, [1, 2, 3, 4], 2), extractable(cont, [1, 2, 5], 2))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "10000.0 10000000.0\nTrue False",
          "10240.0 10000000.0\nTrue False",
          "10000.0 20000000.0\nTrue False",
          "10000.0 10000000.0\nFalse False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          With keys as the rows of K and values as the rows of Vals, write <C>store(K, Vals)</C>, returning{" "}
          <C>W = Σ vᵢkᵢᵀ</C>; <C>recall(W, K, U)</C>, the index of the row of U with the largest dot product with Wk for each
          key; and <C>crosstalk(W, K, Vals)</C>, the total squared error of the recalled vectors divided by the total squared
          norm of the values.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def store(K, Vals):
    return Vals.T

def recall(W, K, U):
    return np.zeros(len(K), int)

def crosstalk(W, K, Vals):
    return 0.0
`,
        solution: MEM,
        tests: [
          { name: "exact", code: `U = np.array([[1.0, 2.0], [0.0, -1.0], [3.0, 0.0]]); W = store(np.eye(3), U[[0, 2, 2]])
assert np.allclose(W, [[1, 3, 3], [2, 0, 0]]) and recall(W, np.eye(3), U).tolist() == [0, 2, 2] and crosstalk(W, np.eye(3), U[[0, 2, 2]]) == 0
Q, _ = np.linalg.qr(np.random.default_rng(0).standard_normal((6, 6))); V = np.random.default_rng(1).standard_normal((4, 3))
assert np.allclose(Q[:4] @ store(Q[:4], V).T, V)` },
          { name: "crosstalk", code: `K = np.array([[1.0, 0.0], [0.6, 0.8]]); V = np.array([[1.0, 2.0], [0.0, -1.0]]); assert abs(crosstalk(store(K, V), K, V) - 0.36) < 1e-12
rng = np.random.default_rng(2); vals = []
for _ in range(40):
    K = rng.standard_normal((50, 100)); K /= np.linalg.norm(K, axis=1, keepdims=True); V = rng.standard_normal((50, 100)); V /= np.linalg.norm(V, axis=1, keepdims=True)
    vals.append(crosstalk(store(K, V), K, V))
assert abs(np.mean(vals) - 49 / 100) < 0.03 and isinstance(vals[0], float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>fact_bits(n_facts, n_values)</C>; <C>params_needed(n_facts, n_values, bits_per_param=2.0)</C>; and{" "}
          <C>extractable(continue_fn, doc, prefix_len)</C>, where <C>continue_fn(prefix, n)</C> returns n greedy tokens,
          True when they equal the rest of doc.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def fact_bits(n_facts, n_values):
    return n_facts

def params_needed(n_facts, n_values, bits_per_param=2.0):
    return n_facts

def extractable(continue_fn, doc, prefix_len):
    return False
`,
        solution: BITS,
        tests: [
          { name: "bits", code: `assert fact_bits(1000, 1024) == 10000 and abs(fact_bits(3, 3) - 3 * math.log2(3)) < 1e-12
assert params_needed(10 ** 7, 2 ** 16) == 8 * 10 ** 7 and params_needed(10, 4, bits_per_param=4.0) == 5` },
          { name: "extract", code: `cont = lambda p, n: [(p[-1] + 1 + i) % 10 for i in range(n)]
assert extractable(cont, [1, 2, 3, 4], 2) and not extractable(cont, [1, 2, 5], 2) and extractable(cont, [7, 8, 9, 0, 1], 1)
calls = []; extractable(lambda p, n: calls.append((list(p), n)) or [0] * n, (4, 5, 6), 1); assert calls == [([4], 2)]` },
        ],
      },
    },
    {
      key: "cap",
      rung: "stretch",
      prompt: <p>At 2 bits per parameter, how many facts, each one of 1024 values, can a model of 10⁹ parameters hold at most, in units of 10⁸?</p>,
      answer: { kind: "numeric", value: 2, tolerance: 1e-9 },
    },
  ],

  glimpse: (
    <>
      <p>
        We now know a good deal about how language models work, and enough to predict how they go wrong. The last lesson
        of the course collects their main failure modes and traces each back to a mechanism from this course.
      </p>
    </>
  ),
};
