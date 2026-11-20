import { M } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { OvCircuitViz } from "@/components/viz/OvCircuitViz";
import type { LessonContent } from "@/lib/types";

const HEAD = `import math

def matmul(A, B):
    return [[sum(a * B[k][j] for k, a in enumerate(row)) for j in range(len(B[0]))] for row in A]

def attention_pattern(X, W_QK, scale):
    S = matmul(matmul(X, W_QK), [list(c) for c in zip(*X)])
    out = []
    for i, row in enumerate(S):
        z = [v / scale for v in row[: i + 1]]
        m = max(z)
        e = [math.exp(v - m) for v in z]
        out.append([v / sum(e) for v in e] + [0.0] * (len(row) - i - 1))
    return out

def head_output(pattern, X, W_OV):
    return matmul(matmul(pattern, X), W_OV)`;

const CIRCUITS = `import math

def full_ov(W_E, W_OV, W_U):
    mm = lambda A, B: [[sum(a * B[k][j] for k, a in enumerate(r)) for j in range(len(B[0]))] for r in A]
    return mm(mm(W_E, W_OV), W_U)

def copying_fraction(M):
    return sum(row.index(max(row)) == i for i, row in enumerate(M)) / len(M)

def composition_score(A, B):
    fro = lambda M: math.sqrt(sum(v * v for r in M for v in r))
    AB = [[sum(a * B[k][j] for k, a in enumerate(r)) for j in range(len(B[0]))] for r in A]
    return fro(AB) / (fro(A) * fro(B))`;

export const lesson: LessonContent = {
  id: "l11.2.2",
  minutes: 55,
  links: {
    requires: ["l11.2.1", "l4.4.4"],
    revisits: ["l5.2.1", "m6.4.1", "m6.3.1"],
    foreshadows: ["l11.2.3", "l11.5.1"],
  },

  puzzle: (
    <>
      <p>
        An attention head has four weight matrices, query, key, value and output, with tens of thousands of parameters each. Two heads
        trained from different seeds can have completely different query and key matrices and yet attend in exactly the same way. What,
        then, is the right object to study when asking what a head does?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An attention head does two separate jobs. It decides where to look, by comparing each query position with each key position,
        and it decides what to move, by reading the attended positions and writing something into the stream. The first job depends on
        the query and key matrices only through their product, and the second on the value and output matrices only through theirs.
        These two products, the QK and OV circuits, are what a head computes; the individual matrices are one of many ways to write them.
      </p>
      <OvCircuitViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the two circuits">
        <p>
          For residual vectors as rows of X, a head computes scores{" "}
          <M>{"S = X W_Q W_K^\\top X^\\top / \\sqrt{d_h}"}</M>, a causal softmax pattern A over each row (<C>attention_pattern</C>), and
          output <M>{"A X W_V W_O"}</M> (<C>head_output</C>, <C>matmul</C>). Write <M>{"W_{QK} = W_Q W_K^\\top"}</M> and{" "}
          <M>{"W_{OV} = W_V W_O"}</M>, both <M>{"d \\times d"}</M>. The QK circuit decides the pattern; the OV circuit decides what an
          attended position contributes.
        </p>
        <Code>{HEAD}</Code>
      </Definition>

      <Theorem title="only the products matter, and they are low rank">
        <p>
          For any invertible <M>{"d_h \\times d_h"}</M> matrix R, replacing <M>{"W_Q, W_K"}</M> by{" "}
          <M>{"W_Q R, W_K R^{-\\top}"}</M> and <M>{"W_V, W_O"}</M> by <M>{"W_V R, R^{-1} W_O"}</M> leaves the head&apos;s function
          unchanged. Both <M>{"W_{QK}"}</M> and <M>{"W_{OV}"}</M> have rank at most <M>{"d_h"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"(W_Q R)(W_K R^{-\\top})^\\top = W_Q R R^{-1} W_K^\\top = W_{QK}"}</M>, and{" "}
          <M>{"(W_V R)(R^{-1}W_O) = W_{OV}"}</M>, so the scores and outputs are identical. Each product factors through a{" "}
          <M>{"d_h"}</M>-dimensional space, so its image has dimension at most <M>{"d_h"}</M>. This answers the puzzle: different seeds can
          find different factorisations of the same circuits, so compare the products, not the factors.
        </p>
      </Proof>

      <Definition title="full circuits">
        <p>
          Composing with the embedding <M>{"W_E"}</M> and unembedding <M>{"W_U"}</M> gives token-level tables. The full QK circuit{" "}
          <M>{"W_E W_{QK} W_E^\\top"}</M> says how much a query token attends to a key token, ignoring other layers. The full OV circuit{" "}
          <M>{"W_E W_{OV} W_U"}</M> (<C>full_ov</C>) says how attending to a token changes each output logit, as in the visualisation. A
          copying head raises the attended token&apos;s own logit: the fraction of rows whose largest entry is on the diagonal (
          <C>copying_fraction</C>) measures this, as does the copying score <M>{"\\sum_i \\lambda_i / \\sum_i |\\lambda_i|"}</M> over the
          eigenvalues of the full OV circuit (m6.3.1), which is 1 for a pure copier and −1 for a pure suppressor.
        </p>
        <Code>{CIRCUITS}</Code>
      </Definition>

      <Remark title="composition between heads">
        <p>
          A later head can use an earlier head&apos;s output in three ways: in its queries (Q-composition), its keys (K-composition) or
          its values (V-composition). The strength of, say, K-composition is measured by{" "}
          <M>{"\\|W_{QK}^{(2)\\top} W_{OV}^{(1)}\\|_F / (\\|W_{QK}^{(2)}\\|_F\\,\\|W_{OV}^{(1)}\\|_F)"}</M> with the products arranged so
          that the earlier head&apos;s writing feeds the later head&apos;s reading (<C>composition_score</C>). It is 0 when the subspaces
          are orthogonal and grows as they align. Scores are judged against those of random matrices of
          the same shapes, which are small but not zero. Induction heads, next, are the standard example of K-composition.
        </p>
      </Remark>

      <Example title="reading a full OV circuit">
        <p>
          In small trained transformers, many heads have full OV circuits with mostly positive eigenvalues: whatever token they attend
          to, they raise its logit. Such a head, combined with a QK circuit that attends to tokens that could plausibly come next,
          implements copying of earlier text, which is half of the induction mechanism.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "softmax",
      rung: "check",
      prompt: (
        <p>
          A query sees two keys, with raw scores 2 and 0, and the head dimension is 4. What attention weight goes to the first key? Give
          three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.731, tolerance: 0.001 },
    },
    {
      key: "eig",
      rung: "check",
      prompt: (
        <p>
          A full OV circuit has eigenvalues 3, 1 and −1. What is its copying score?
        </p>
      ),
      answer: { kind: "numeric", value: 0.6, tolerance: 0.001 },
    },
    {
      key: "compare",
      rung: "apply",
      prompt: (
        <p>
          You want to know whether two heads, from two training runs of the same architecture, do the same thing. Which comparison is
          most meaningful?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "Compare their QK and OV products, or their full circuits on tokens, which do not depend on the factorisation",
          "Compare their query matrices entry by entry",
          "Compare their output matrices by cosine similarity",
          "Compare the norms of their four weight matrices",
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

def matmul(A, B):
    return [[sum(a * B[k][j] for k, a in enumerate(row)) for j in range(len(B[0]))] for row in A]

def attention_pattern(X, W_QK, scale):
    S = matmul(matmul(X, W_QK), [list(c) for c in zip(*X)])
    out = []
    for i, row in enumerate(S):
        z = [v / scale for v in row[: i + 1]]
        m = max(z)
        e = [math.exp(v - m) for v in z]
        out.append([v / sum(e) for v in e] + [0.0] * (len(row) - i - 1))
    return out

def head_output(pattern, X, W_OV):
    return matmul(matmul(pattern, X), W_OV)

P = attention_pattern([[1, 0], [0, 1]], [[0, 0], [0, 0]], 1.0)
print(P, head_output(P, [[1, 0], [0, 1]], [[0, 1], [1, 0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[1.0, 0.0], [0.5, 0.5]] [[0.0, 1.0], [0.5, 0.5]]",
          "[[0.5, 0.5], [0.5, 0.5]] [[0.5, 0.5], [0.5, 0.5]]",
          "[[1.0, 0.0], [0.5, 0.5]] [[1.0, 0.0], [0.5, 0.5]]",
          "[[1.0, 0.0], [0.0, 1.0]] [[0.0, 1.0], [1.0, 0.0]]",
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

def full_ov(W_E, W_OV, W_U):
    mm = lambda A, B: [[sum(a * B[k][j] for k, a in enumerate(r)) for j in range(len(B[0]))] for r in A]
    return mm(mm(W_E, W_OV), W_U)

def copying_fraction(M):
    return sum(row.index(max(row)) == i for i, row in enumerate(M)) / len(M)

def composition_score(A, B):
    fro = lambda M: math.sqrt(sum(v * v for r in M for v in r))
    AB = [[sum(a * B[k][j] for k, a in enumerate(r)) for j in range(len(B[0]))] for r in A]
    return fro(AB) / (fro(A) * fro(B))

I = [[1, 0], [0, 1]]
print(copying_fraction([[2, 1], [0, 3]]), full_ov(I, [[0, 1], [1, 0]], I), round(composition_score(I, I), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "1.0 [[0, 1], [1, 0]] 0.707",
          "0.5 [[0, 1], [1, 0]] 0.707",
          "1.0 [[1, 0], [0, 1]] 0.707",
          "1.0 [[0, 1], [1, 0]] 1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Matrices are lists of rows. Write <C>matmul(A, B)</C>; <C>attention_pattern(X, W_QK, scale)</C>, the causal softmax of{" "}
          <M>{"X W_{QK} X^\\top"}</M> divided by scale, with zeros above the diagonal; and <C>head_output(pattern, X, W_OV)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def matmul(A, B):
    return A

def attention_pattern(X, W_QK, scale):
    return [[0.0] * len(X) for _ in X]

def head_output(pattern, X, W_OV):
    return X
`,
        solution: HEAD,
        tests: [
          { name: "pattern", code: `X = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]\nP = attention_pattern(X, [[2.0, 0.0], [0.0, 0.0]], 1.0)\nassert P[0] == [1.0, 0.0, 0.0] and P[1] == [0.5, 0.5, 0.0]\nassert abs(P[2][0] - 0.4683105308) < 1e-9 and abs(P[2][1] - 0.0633789383) < 1e-9` },
          { name: "output", code: `X = [[1.0, 0.0], [0.0, 1.0], [1.0, 1.0]]\nP = attention_pattern(X, [[2.0, 0.0], [0.0, 0.0]], 1.0)\nO = head_output(P, X, [[1.0, 0.0], [0.0, 2.0]])\nassert O[1] == [0.5, 1.0] and abs(O[2][0] - 0.9366210617) < 1e-9\nassert matmul([[1, 2], [3, 4]], [[0, 1], [1, 0]]) == [[2, 1], [4, 3]]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>full_ov(W_E, W_OV, W_U)</C>, the product of the three; <C>copying_fraction(M)</C>, the share of rows whose largest
          entry is on the diagonal; and <C>composition_score(A, B)</C>, the Frobenius norm of AB over the product of the norms.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

def full_ov(W_E, W_OV, W_U):
    return W_OV

def copying_fraction(M):
    return 0.0

def composition_score(A, B):
    return 0.0
`,
        solution: CIRCUITS,
        tests: [
          { name: "full", code: `assert full_ov([[1, 0], [0, 1], [1, 1]], [[2, 0], [0, 1]], [[1, 0, 0], [0, 1, 1]]) == [[2, 0, 0], [0, 1, 1], [2, 1, 1]]\nassert copying_fraction([[1, 2], [2, 1]]) == 0.0 and abs(copying_fraction([[3, 0, 1], [0, 1, 2], [1, 1, 5]]) - 2 / 3) < 1e-12` },
          { name: "compose", code: `assert abs(composition_score([[1, 0], [0, 0]], [[1, 1], [0, 0]]) - 1) < 1e-12\nassert composition_score([[1, 0], [0, 0]], [[0, 0], [0, 1]]) == 0\nassert abs(composition_score([[1, 2], [3, 4]], [[0, 1], [1, 0]]) - 0.7071067812) < 1e-9` },
        ],
      },
    },
    {
      key: "disagree",
      rung: "stretch",
      prompt: (
        <p>
          A full OV circuit on two tokens is [[1, 2], [2, 1]]. Its copying fraction is 0, since each row&apos;s largest entry is off the
          diagonal. What is its eigenvalue copying score?
        </p>
      ),
      answer: { kind: "numeric", value: 0.5, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        One head finds the token after the previous occurrence of the current token; another copies it. Together they make the
        induction head, the next lesson&apos;s subject.
      </p>
    </>
  ),
};
