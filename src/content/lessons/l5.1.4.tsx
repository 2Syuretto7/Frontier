import { M } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { TiedCycleViz } from "@/components/viz/TiedCycleViz";
import type { LessonContent } from "@/lib/types";

const TIED = `import numpy as np

def param_count(V, d, body, tied):
    return body + (1 if tied else 2) * V * d

def tied_grad(E, ids, g_in, H, g_logits):
    dE = np.zeros_like(np.asarray(E, float))
    np.add.at(dE, np.asarray(ids), np.asarray(g_in, float))
    return dE + np.asarray(g_logits, float).T @ np.asarray(H, float)

def tied_next(E):
    E = np.asarray(E, float)
    return (E @ E.T).argmax(axis=1).tolist()`;

const DIRECT = `import numpy as np

def direct_logits(E, U=None):
    E = np.asarray(E, float)
    return E @ (E.T if U is None else np.asarray(U, float))

def fit_direct(pairs, V, d, tied, lr, steps, seed):
    rng = np.random.default_rng(seed)
    E = 0.1 * rng.standard_normal((V, d))
    U = None if tied else 0.1 * rng.standard_normal((d, V))
    x, y = np.array([p[0] for p in pairs]), np.array([p[1] for p in pairs])
    for _ in range(steps):
        Z = direct_logits(E, U)[x]
        P = np.exp(Z - Z.max(axis=1, keepdims=True))
        P /= P.sum(axis=1, keepdims=True)
        P[np.arange(len(x)), y] -= 1.0
        G = P / len(x)
        if tied:
            gE = np.zeros_like(E)
            np.add.at(gE, x, G @ E)
            gE += G.T @ E[x]
            E -= lr * gE
        else:
            gE = np.zeros_like(E)
            np.add.at(gE, x, G @ U.T)
            U -= lr * E[x].T @ G
            E -= lr * gE
    return E, U

def accuracy(pairs, E, U=None):
    Z = direct_logits(E, U)
    return float(np.mean([Z[a].argmax() == b for a, b in pairs]))`;

export const lesson: LessonContent = {
  id: "l5.1.4",
  minutes: 40,
  links: {
    requires: ["l5.1.3"],
    revisits: ["m3.1.2"],
    foreshadows: ["l5.2.4", "l5.3.3"],
  },

  puzzle: (
    <>
      <p>
        GPT-2 uses one matrix both to turn token ids into vectors and to turn its final vectors back into token scores,
        saving tens of millions of parameters. Llama 2 keeps two separate matrices. Tying looks like free compression:
        the input and output vectors of a token should surely mean similar things. Yet a tied model with no layers cannot
        learn even that A is followed by B and B by A. What exactly does sharing the matrix forbid?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        With tied weights the score for predicting token j after token i, along the direct path from input to output, is
        the dot product of their embeddings. Dot products are symmetric, so A predicting B is scored exactly like B
        predicting A. Worse, every token scores itself by its own squared length, and a dot product can never exceed the
        larger of the two squared lengths. To prefer some other token over itself, a token must point at one with a longer
        embedding, and following such preferences round a cycle would need lengths that keep growing and yet come back to
        where they started. Real models have layers between the two ends that can supply the asymmetry, and tying then
        mostly saves parameters, at some cost in flexibility.
      </p>
      <TiedCycleViz />
    </>
  ),

  theory: (
    <>
      <Definition title="weight tying">
        <p>
          A model has <em>tied</em> embeddings if its unembedding is <M>{"U = E^\\top"}</M>, so the logit of token c at
          hidden state h is <M>{"h^\\top e_c"}</M>, where <M>{"e_c"}</M> is row c of E. Tying removes Vd parameters.
        </p>
        <Code>{TIED}</Code>
      </Definition>

      <Theorem title="the tied gradient is a sum">
        <p>
          With tied weights, <M>{"\\partial L/\\partial E"}</M> is the sum of the embedding gradient, a scatter of the
          input-side gradients into the rows that were looked up, and the transposed unembedding gradient,{" "}
          <M>{"G^\\top H"}</M>, where row n of G is the gradient of the loss with respect to the logits at position n and
          row n of H is the final hidden state there.
        </p>
      </Theorem>
      <Proof>
        <p>
          The loss depends on E through two routes: the lookups at the input and the logits <M>{"HE^\\top"}</M> at the
          output. The multivariable chain rule adds the derivatives along the two routes. The first is the sparse sum from
          the previous lesson. For the second,{" "}
          <M>{"\\partial L/\\partial E_{ck} = \\sum_nG_{nc}H_{nk}"}</M>, since the logit <M>{"z_{nc} = \\sum_kH_{nk}E_{ck}"}</M>{" "}
          depends on <M>{"E_{ck}"}</M> with coefficient <M>{"H_{nk}"}</M>. So every row of a tied matrix gets a dense
          gradient from the output side, even for tokens absent from the input.
        </p>
      </Proof>

      <Theorem title="a tied direct path cannot predict a cycle">
        <p>
          Consider the direct path, with logits <M>{"S = EE^\\top"}</M> for each input token. If token i gives some other
          token j a strictly higher score than itself, <M>{"S_{ij} > S_{ii}"}</M>, then{" "}
          <M>{"\\|e_j\\| > \\|e_i\\|"}</M>. Consequently the map sending each token to its strict top prediction has no
          cycle through two or more distinct tokens.
        </p>
      </Theorem>
      <Proof>
        <p>
          By the Cauchy–Schwarz inequality <M>{"S_{ij} = e_i^\\top e_j \\le \\|e_i\\|\\|e_j\\|"}</M>. If{" "}
          <M>{"\\|e_j\\| \\le \\|e_i\\|"}</M>, this is at most <M>{"\\|e_i\\|^2 = S_{ii}"}</M>, contradicting{" "}
          <M>{"S_{ij} > S_{ii}"}</M>. So each step from a token to a different strict top prediction strictly increases the
          embedding norm. Along a cycle the norm would have to exceed itself on returning to the start, which is
          impossible. An untied model, with logits <M>{"EU"}</M>, has no such constraint: with d ≥ V it can realise any
          logit matrix.
        </p>
        <Code>{DIRECT}</Code>
      </Proof>

      <Remark title="when to tie">
        <p>
          The direct path is only one route in a real transformer: attention and MLP layers write into the residual stream
          between the lookup and the output, and they can supply the asymmetry that tying removes. Tying then trades a
          little flexibility for a large saving, which matters most for small models, where the embedding table can be a
          third of all parameters, and for large vocabularies. Large models, where the table is a small fraction, usually
          untie. Tied models often rescale the input embedding, multiplying it by <M>{"\\sqrt d"}</M> as in T5 and Gemma,
          because the two roles want vectors of different sizes.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "save",
      rung: "check",
      prompt: <p>A model has V = 256,000 and d = 2048. How many million parameters does tying its embeddings save?</p>,
      answer: { kind: "numeric", value: 524.288, tolerance: 0.001 },
    },
    {
      key: "cs",
      rung: "check",
      prompt: <p>In a tied model, ‖e_i‖ = 5 and ‖e_j‖ = 6. What is the largest possible direct-path score <M>{"S_{ij}"}</M>?</p>,
      answer: { kind: "numeric", value: 30, tolerance: 0 },
    },
    {
      key: "swap",
      rung: "apply",
      prompt: <p>Why can a tied model with no layers not learn that A is always followed by B and B always by A?</p>,
      answer: {
        kind: "choice",
        options: [
          "Ranking B above A after A needs ‖e_B‖ > ‖e_A‖, and ranking A above B after B needs the reverse",
          "Tied models cannot represent any probability above one half",
          "The softmax forbids predicting a token different from the input",
          "Two tokens are too few for gradient descent to converge",
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

def param_count(V, d, body, tied):
    return body + (1 if tied else 2) * V * d

def tied_grad(E, ids, g_in, H, g_logits):
    dE = np.zeros_like(np.asarray(E, float))
    np.add.at(dE, np.asarray(ids), np.asarray(g_in, float))
    return dE + np.asarray(g_logits, float).T @ np.asarray(H, float)

def tied_next(E):
    E = np.asarray(E, float)
    return (E @ E.T).argmax(axis=1).tolist()

print(param_count(50000, 768, 85_000_000, True), param_count(50000, 768, 85_000_000, False))
print(tied_grad(np.zeros((3, 2)), [1, 1], [[1.0, 0.0], [0.0, 2.0]], [[1.0, 1.0]], [[0.5, -1.0, 0.5]]).tolist())
print(tied_next([[1.0, 0.0], [0.8, 0.8], [0.0, 3.0]]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "123400000 161800000\n[[0.5, 0.5], [0.0, 1.0], [0.5, 0.5]]\n[0, 2, 2]",
          "123400000 161800000\n[[0.5, 0.5], [1.0, 2.0], [0.5, 0.5]]\n[0, 2, 2]",
          "123400000 161800000\n[[0.5, 0.5], [0.0, 1.0], [0.5, 0.5]]\n[0, 1, 2]",
          "161800000 123400000\n[[0.5, 0.5], [0.0, 1.0], [0.5, 0.5]]\n[1, 2, 0]",
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

def direct_logits(E, U=None):
    E = np.asarray(E, float)
    return E @ (E.T if U is None else np.asarray(U, float))

def fit_direct(pairs, V, d, tied, lr, steps, seed):
    rng = np.random.default_rng(seed)
    E = 0.1 * rng.standard_normal((V, d))
    U = None if tied else 0.1 * rng.standard_normal((d, V))
    x, y = np.array([p[0] for p in pairs]), np.array([p[1] for p in pairs])
    for _ in range(steps):
        Z = direct_logits(E, U)[x]
        P = np.exp(Z - Z.max(axis=1, keepdims=True))
        P /= P.sum(axis=1, keepdims=True)
        P[np.arange(len(x)), y] -= 1.0
        G = P / len(x)
        if tied:
            gE = np.zeros_like(E)
            np.add.at(gE, x, G @ E)
            gE += G.T @ E[x]
            E -= lr * gE
        else:
            gE = np.zeros_like(E)
            np.add.at(gE, x, G @ U.T)
            U -= lr * E[x].T @ G
            E -= lr * gE
    return E, U

def accuracy(pairs, E, U=None):
    Z = direct_logits(E, U)
    return float(np.mean([Z[a].argmax() == b for a, b in pairs]))

pairs = [(0, 1), (1, 0)]; E, U = fit_direct(pairs, 2, 2, False, 0.5, 500, 0); Et, _ = fit_direct(pairs, 2, 2, True, 0.5, 500, 0)
print(accuracy(pairs, E, U), accuracy(pairs, Et), direct_logits([[1.0, 2.0]]).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["1.0 0.5 [[5.0]]", "1.0 1.0 [[5.0]]", "0.5 0.5 [[5.0]]", "1.0 0.5 [[3.0]]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>param_count(V, d, body, tied)</C>; <C>tied_grad(E, ids, g_in, H, g_logits)</C>, the gradient of a tied
          matrix from input-side gradients g_in (one row per looked-up id) and logit gradients g_logits (one row per hidden
          state in H); and <C>tied_next(E)</C>, the list of top direct-path predictions for each token.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def param_count(V, d, body, tied):
    return body + V * d

def tied_grad(E, ids, g_in, H, g_logits):
    return np.zeros_like(np.asarray(E, float))

def tied_next(E):
    return list(range(len(E)))
`,
        solution: TIED,
        tests: [
          { name: "count", code: `assert param_count(50000, 768, 85_000_000, True) == 123_400_000 and param_count(10, 2, 0, False) == 40
assert tied_next([[1.0, 0.0], [0.8, 0.8], [0.0, 3.0]]) == [0, 2, 2] and tied_next([[1.0, 0.0], [0.0, 1.0]]) == [0, 1]` },
          { name: "grad", code: `rng = np.random.default_rng(0); E = rng.standard_normal((4, 3)); ids = [1, 3, 1]; H = rng.standard_normal((2, 3)); y = [0, 2]
def L(E):
    X = E[ids]; Z = H @ E.T; Z = Z - Z.max(axis=1, keepdims=True); P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True)
    return float(np.sum(X ** 2)) - float(np.log(P[[0, 1], y]).sum())
Z = H @ E.T; P = np.exp(Z) / np.exp(Z).sum(axis=1, keepdims=True); P[[0, 1], y] -= 1
G = tied_grad(E, ids, 2 * E[ids], H, P); e = 1e-6
for (a, b) in [(1, 0), (0, 2), (2, 1)]:
    D = np.zeros_like(E); D[a, b] = e; assert abs((L(E + D) - L(E - D)) / (2 * e) - G[a, b]) < 1e-5` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>direct_logits(E, U=None)</C>, tied when U is None; <C>fit_direct(pairs, V, d, tied, lr, steps, seed)</C>,
          initialising E (and U, after E, when untied) as 0.1 times standard normals from{" "}
          <C>np.random.default_rng(seed)</C> and running full-batch gradient descent on the mean cross-entropy of the (input,
          next) pairs, returning (E, U); and <C>accuracy(pairs, E, U=None)</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def direct_logits(E, U=None):
    return np.asarray(E, float)

def fit_direct(pairs, V, d, tied, lr, steps, seed):
    return np.zeros((V, d)), None

def accuracy(pairs, E, U=None):
    return 0.0
`,
        solution: DIRECT,
        tests: [
          { name: "cycle", code: `pairs = [(0, 1), (1, 2), (2, 0)]; E, U = fit_direct(pairs, 3, 3, False, 0.5, 2000, 0); assert accuracy(pairs, E, U) == 1.0
Et, Ut = fit_direct(pairs, 3, 3, True, 0.5, 2000, 0); assert Ut is None and accuracy(pairs, Et) < 1.0
assert np.allclose(direct_logits([[1.0, 2.0], [0.0, 1.0]]), [[5, 2], [2, 1]]) and np.allclose(direct_logits([[1.0, 2.0]], [[1.0, 0.0], [0.0, 3.0]]), [[1, 6]])` },
          { name: "fit", code: `pairs = [(0, 0), (1, 1)]; E, _ = fit_direct(pairs, 2, 2, True, 0.5, 300, 1); assert accuracy(pairs, E) == 1.0
E, U = fit_direct([(0, 1), (1, 0)], 2, 2, False, 0.5, 500, 0); assert accuracy([(0, 1), (1, 0)], E, U) == 1.0` },
        ],
      },
    },
    {
      key: "share",
      rung: "stretch",
      prompt: (
        <p>
          A tied model has 85 million non-embedding parameters, V = 50,000 and d = 768. What fraction of all its parameters
          is the embedding matrix? Give three decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.311, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Between the lookup and the output sit the layers that do the real work. The next part builds them, starting with
        attention and the reason for its scaling factor.
      </p>
    </>
  ),
};
