import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChainRuleViz } from "@/components/viz/ChainRuleViz";
import type { LessonContent } from "@/lib/types";

const CR = `import numpy as np

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def chain_terms(P):
    terms, prev = [], 0.0
    for k in range(1, P.ndim + 1):
        Hk = H(P.sum(axis=tuple(range(k, P.ndim))))
        terms.append(Hk - prev); prev = Hk
    return terms

def entropy_of_function(p, f):
    out = {}
    for x, px in enumerate(p):
        out[f(x)] = out.get(f(x), 0.0) + px
    return H(list(out.values()))`;

const MR = `import numpy as np

def stationary(T):
    w, V = np.linalg.eig(T.T)
    v = np.real(V[:, np.argmin(np.abs(w - 1))])
    return v / v.sum()

def entropy_rate(T):
    rows = [-(r[r > 0] * np.log2(r[r > 0])).sum() for r in T]
    return float(stationary(T) @ np.array(rows))

def block_entropy_per_symbol(T, n):
    k = len(T); p = stationary(T)
    for _ in range(n - 1):
        p = (p[:, None] * T[np.arange(len(p)) % k]).ravel()
    q = p[p > 0]
    return float(-(q * np.log2(q)).sum()) / n`;

export const lesson: LessonContent = {
  id: "m12.1.4",
  minutes: 45,
  links: {
    requires: ["m12.1.3"],
    revisits: ["m7.8.2", "m7.1.3"],
    foreshadows: ["m12.2.3", "m12.4.1", "m12.4.2"],
  },

  puzzle: (
    <>
      <p>
        A language model never assigns a probability to a whole paragraph at once. It predicts one token at a time, and
        its loss on the paragraph is the sum of the per-token losses. Why is that sum the surprise of the entire paragraph,
        with nothing double-counted or left out? And a source that emits 0 nine times out of ten after a 0, but flips a fair
        coin after a 1, has a single-symbol entropy of 0.65 bits. How many bits per symbol does a long message from it
        really need?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Probabilities factor by the product rule, p(x, y) = p(x)p(y | x), and logarithms turn products into sums. So the
        uncertainty in a pair is the uncertainty in the first part plus what is still uncertain about the second once the
        first is known. Repeating the step, the entropy of a sequence is a sum of conditional entropies, one per position,
        exactly as a language model&apos;s loss is a sum over tokens. For a source with memory the later terms are smaller
        than the first, and their common value, the entropy rate, is the true cost per symbol.
      </p>
      <ChainRuleViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the chain rule">
        <p>
          <M>{"H(X, Y) = H(X) + H(Y \\mid X)"}</M>, and more generally
        </p>
        <MD>{"H(X_1, \\dots, X_n) = \\sum_{i=1}^n H(X_i \\mid X_1, \\dots, X_{i-1})."}</MD>
      </Theorem>
      <Proof>
        <p>
          For pairs with <M>{"p(x, y) > 0"}</M>, <M>{"-\\log p(x, y) = -\\log p(x) - \\log p(y \\mid x)"}</M>. Taking the
          expectation over (X, Y) gives H(X, Y) on the left, H(X) as the first term on the right (it depends only on x) and
          H(Y | X) as the second. For n variables, the product rule gives{" "}
          <M>{"p(x_1, \\dots, x_n) = \\prod_i p(x_i \\mid x_1, \\dots, x_{i-1})"}</M>; take −log and expectations in the same
          way. The same argument conditioned throughout on Z gives{" "}
          <M>{"H(X, Y \\mid Z) = H(X \\mid Z) + H(Y \\mid X, Z)"}</M>.
        </p>
      </Proof>

      <Theorem title="consequences">
        <p>
          (a) <M>{"H(X_1, \\dots, X_n) \\le \\sum_i H(X_i)"}</M>, with equality exactly when the <M>{"X_i"}</M> are
          independent. (b) For any function f, <M>{"H(f(X)) \\le H(X)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          (a) Apply the previous lesson&apos;s theorem with the tuple <M>{"(X_1, \\dots, X_{i-1})"}</M> as the conditioning
          variable: each term satisfies <M>{"H(X_i \\mid X_1, \\dots, X_{i-1}) \\le H(X_i)"}</M>. Equality in every term
          means each <M>{"X_i"}</M> is independent of the earlier ones, which is mutual independence. (b) Expand{" "}
          <M>{"H(X, f(X))"}</M> both ways:{" "}
          <M>{"H(X) + H(f(X) \\mid X) = H(f(X)) + H(X \\mid f(X))"}</M>. The term <M>{"H(f(X) \\mid X)"}</M> is 0 since f(X)
          is a function of X, so <M>{"H(X) = H(f(X)) + H(X \\mid f(X)) \\ge H(f(X))"}</M>. Processing can only merge
          outcomes, never create uncertainty.
        </p>
        <Code>{CR}</Code>
      </Proof>

      <Definition title="entropy rate">
        <p>
          For a stationary process, the entropy rate is{" "}
          <M>{"\\lim_{n \\to \\infty} \\tfrac1n H(X_1, \\dots, X_n) = \\lim_{n\\to\\infty} H(X_n \\mid X_1, \\dots, X_{n-1})"}</M>,
          the average new information per symbol once the past is known.
        </p>
      </Definition>

      <Theorem title="the entropy rate of a Markov chain">
        <p>
          For a Markov chain with transition matrix T started from its stationary distribution π,{" "}
          <M>{"H(X_1, \\dots, X_n) = H(\\pi) + (n - 1)r"}</M> with{" "}
          <M>{"r = \\sum_i \\pi_i H(T_{i\\cdot})"}</M>, so the entropy rate is r.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the Markov property the conditional law of <M>{"X_k"}</M> given the whole past depends only on{" "}
          <M>{"X_{k-1}"}</M>, so <M>{"H(X_k \\mid X_1, \\dots, X_{k-1}) = H(X_k \\mid X_{k-1}) = \\sum_i P(X_{k-1} = i)H(T_{i\\cdot})"}</M>.
          Stationarity makes <M>{"P(X_{k-1} = i) = \\pi_i"}</M> for every k, so each term after the first is r, and the first
          is <M>{"H(X_1) = H(\\pi)"}</M>. Dividing by n and letting n → ∞ gives r. For the puzzle&apos;s source, π = (5/6, 1/6),
          H(π) = 0.65 and r = 0.5575 bits.
        </p>
        <Code>{MR}</Code>
      </Proof>

      <Remark title="language models and the entropy of English">
        <p>
          The product rule is what makes autoregressive models possible: modelling each{" "}
          <M>{"p(x_i \\mid x_{<i})"}</M> models the whole joint distribution, and the summed log loss over a text is its
          total surprise under the model. Its average per token, on text from the true source, is at least the entropy rate
          of that source (a fact proved with cross-entropy shortly). Shannon estimated, by having people guess the next
          letter, that English carries roughly one bit per character, far below the log₂ 27 ≈ 4.75 bits of a uniform
          alphabet.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "sum",
      rung: "check",
      prompt: <p>If H(X) = 1.5 bits and H(Y | X) = 0.7 bits, what is H(X, Y)?</p>,
      answer: { kind: "numeric", value: 2.2, tolerance: 0.0001 },
    },
    {
      key: "xor",
      rung: "check",
      prompt: (
        <p>
          X₁, X₂, X₃ are independent fair bits and X₄ = X₁ XOR X₂. What is H(X₁, X₂, X₃, X₄) in bits?
        </p>
      ),
      answer: { kind: "numeric", value: 3, tolerance: 0.0001 },
    },
    {
      key: "func",
      rung: "apply",
      prompt: <p>Which argument shows that H(f(X)) ≤ H(X) for every function f?</p>,
      answer: {
        kind: "choice",
        options: [
          "Expand H(X, f(X)) by the chain rule in both orders; H(f(X) | X) = 0 while H(X | f(X)) ≥ 0",
          "f can only increase probabilities, and entropy is decreasing in each probability",
          "By Jensen's inequality applied to f",
          "Because H(f(X)) ≤ log₂ of the number of values of X",
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

def H(p):
    p = np.asarray(p, dtype=float).ravel(); p = p[p > 0]
    return float(-(p * np.log2(p)).sum()) + 0.0

def chain_terms(P):
    terms, prev = [], 0.0
    for k in range(1, P.ndim + 1):
        Hk = H(P.sum(axis=tuple(range(k, P.ndim))))
        terms.append(Hk - prev); prev = Hk
    return terms

def entropy_of_function(p, f):
    out = {}
    for x, px in enumerate(p):
        out[f(x)] = out.get(f(x), 0.0) + px
    return H(list(out.values()))

P = np.array([[[0.1, 0.2], [0.05, 0.15]], [[0.2, 0.1], [0.1, 0.1]]])
t = chain_terms(P)
print([round(v, 3) for v in t], np.isclose(sum(t), H(P)))
print(H([0.25] * 4), entropy_of_function([0.25] * 4, lambda x: x // 2), entropy_of_function([0.25] * 4, lambda x: 0))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.0, 0.971, 0.913] True\n2.0 1.0 0.0",
          "[1.0, 0.971, 0.913] False\n2.0 1.0 0.0",
          "[1.0, 1.971, 2.884] True\n2.0 1.0 0.0",
          "[1.0, 0.971, 0.913] True\n2.0 2.0 2.0",
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

def stationary(T):
    w, V = np.linalg.eig(T.T)
    v = np.real(V[:, np.argmin(np.abs(w - 1))])
    return v / v.sum()

def entropy_rate(T):
    rows = [-(r[r > 0] * np.log2(r[r > 0])).sum() for r in T]
    return float(stationary(T) @ np.array(rows))

def block_entropy_per_symbol(T, n):
    k = len(T); p = stationary(T)
    for _ in range(n - 1):
        p = (p[:, None] * T[np.arange(len(p)) % k]).ravel()
    q = p[p > 0]
    return float(-(q * np.log2(q)).sum()) / n

T = np.array([[0.9, 0.1], [0.5, 0.5]])
print(np.round(stationary(T), 4), round(entropy_rate(T), 4))
print([round(block_entropy_per_symbol(T, n), 4) for n in (1, 2, 8)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.8333 0.1667] 0.5575\n[0.65, 0.6038, 0.5691]",
          "[0.8333 0.1667] 0.5575\n[0.5575, 0.5575, 0.5575]",
          "[0.5 0.5] 0.7345\n[1.0, 0.8673, 0.7676]",
          "[0.8333 0.1667] 0.5575\n[0.65, 0.5575, 0.5575]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          For an n-dimensional joint probability array P (axis i is variable i), write <C>H(p)</C>;{" "}
          <C>chain_terms(P)</C>, the list H(X₁), H(X₂ | X₁), …, H(Xₙ | X₁, …, Xₙ₋₁) computed from marginals of the leading
          axes; and <C>entropy_of_function(p, f)</C>, the entropy of f(X) for X with probabilities p over 0, 1, …
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def H(p):
    return 0.0

def chain_terms(P):
    return []

def entropy_of_function(p, f):
    return 0.0
`,
        solution: CR,
        tests: [
          { name: "chain", code: `P = np.full((2, 2, 2), 1 / 8); assert np.allclose(chain_terms(P), [1.0, 1.0, 1.0])
Q = np.zeros((2, 2)); Q[0, 0] = Q[1, 1] = 0.5; assert np.allclose(chain_terms(Q), [1.0, 0.0])
R = np.array([[[0.1, 0.0], [0.3, 0.1]], [[0.2, 0.1], [0.0, 0.2]]]); t = chain_terms(R)
assert len(t) == 3 and np.isclose(sum(t), H(R)) and np.isclose(t[0] + t[1], H(R.sum(axis=2)))` },
          { name: "func", code: `p = [0.1, 0.2, 0.3, 0.4]
assert np.isclose(entropy_of_function(p, lambda x: x), H(p)) and np.isclose(entropy_of_function(p, lambda x: x % 2), H([0.4, 0.6]))
assert entropy_of_function(p, lambda x: 7) == 0.0` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For a transition matrix T, write <C>stationary(T)</C>, <C>entropy_rate(T)</C> = Σ πᵢ H(row i) in bits, and{" "}
          <C>block_entropy_per_symbol(T, n)</C>, H(X₁, …, Xₙ)/n for the chain started from π, computed from the
          probabilities of all length-n sequences.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def stationary(T):
    return np.ones(len(T)) / len(T)

def entropy_rate(T):
    return 0.0

def block_entropy_per_symbol(T, n):
    return 0.0
`,
        solution: MR,
        tests: [
          { name: "rate", code: `T = np.array([[0.5, 0.5], [1.0, 0.0]])
assert np.allclose(stationary(T), [2 / 3, 1 / 3]) and np.isclose(entropy_rate(T), 2 / 3)
assert np.isclose(entropy_rate(np.full((4, 4), 0.25)), 2.0)` },
          { name: "block", code: `T = np.array([[0.5, 0.5], [1.0, 0.0]]); h = -(2 / 3 * np.log2(2 / 3) + 1 / 3 * np.log2(1 / 3))
assert np.isclose(block_entropy_per_symbol(T, 1), h) and np.isclose(block_entropy_per_symbol(T, 3), (h + 2 * 2 / 3) / 3)
assert np.isclose(block_entropy_per_symbol(np.eye(3)[[1, 2, 0]], 5), np.log2(3) / 5)` },
        ],
      },
    },
    {
      key: "rate",
      rung: "stretch",
      prompt: (
        <p>
          A two-state chain always moves from state 1 to state 0, and from state 0 moves to either state with probability ½.
          What is its entropy rate in bits per symbol? Give four decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.6667, tolerance: 0.0001 },
    },
  ],

  glimpse: (
    <>
      <p>
        Every inequality so far came from Jensen&apos;s inequality applied to a ratio of two distributions. The next chapter
        gives that ratio a name: the KL divergence, the cost of describing data from one distribution with a code built for
        another.
      </p>
    </>
  ),
};
