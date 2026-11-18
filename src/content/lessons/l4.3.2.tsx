import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MlpLmViz } from "@/components/viz/MlpLmViz";
import type { LessonContent } from "@/lib/types";

const MODEL = `import numpy as np

def contexts(tokens, n):
    t = np.asarray(tokens)
    X = np.stack([t[i:len(t) - n + i] for i in range(n)], axis=1)
    return X, t[n:]

def init(V, d, n, h, seed=0):
    rng = np.random.default_rng(seed)
    return {"C": rng.normal(0, 1, (V, d)), "W": rng.normal(0, 1 / np.sqrt(n * d), (n * d, h)),
            "b": np.zeros(h), "U": rng.normal(0, 1 / np.sqrt(h), (h, V)), "c": np.zeros(V)}

def param_count(V, d, n, h):
    return V * d + n * d * h + h + h * V + V

def forward(P, X):
    E = P["C"][X].reshape(len(X), -1)
    H = np.tanh(E @ P["W"] + P["b"])
    return H @ P["U"] + P["c"]

def nll(P, X, y):
    Z = forward(P, X)
    Z = Z - Z.max(axis=1, keepdims=True)
    return float(np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(len(y)), y]))`;

const TRAIN = `import numpy as np

def grads(P, X, y):
    E = P["C"][X].reshape(len(X), -1)
    H = np.tanh(E @ P["W"] + P["b"])
    Z = H @ P["U"] + P["c"]
    S = np.exp(Z - Z.max(axis=1, keepdims=True))
    S /= S.sum(axis=1, keepdims=True)
    S[np.arange(len(y)), y] -= 1
    S /= len(y)
    dH = (S @ P["U"].T) * (1 - H ** 2)
    dE = (dH @ P["W"].T).reshape(X.shape + (-1,))
    dC = np.zeros_like(P["C"])
    np.add.at(dC, X, dE)
    return {"C": dC, "W": E.T @ dH, "b": dH.sum(0), "U": H.T @ S, "c": S.sum(0)}

def sgd(P, X, y, lr, steps, batch=32, seed=0):
    rng = np.random.default_rng(seed)
    for _ in range(steps):
        i = rng.integers(0, len(y), batch)
        for k, g in grads(P, X[i], y[i]).items():
            P[k] -= lr * g
    return P`;

export const lesson: LessonContent = {
  id: "l4.3.2",
  minutes: 55,
  links: {
    requires: ["l4.3.1", "l4.2.1"],
    revisits: ["l3.3.2", "l3.2.3"],
    foreshadows: ["l4.3.3"],
  },

  puzzle: (
    <>
      <p>
        A trigram model over a 10000-word vocabulary has room for a trillion conditional probabilities, and having seen
        &quot;the cat is walking&quot; tells it nothing at all about &quot;a dog was running&quot;. In 2003 Bengio and colleagues
        replaced the table with a network of under two million parameters that does generalise between such sentences, and
        that can take a longer context at almost no extra cost. What did they give up, and what did they gain?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Look each of the last n words up in a shared embedding table, concatenate the vectors, pass them through a hidden layer
        and finish with a softmax over the vocabulary. The table and the network are trained together by gradient descent on
        next-word cross-entropy. Two words that tend to be followed by the same things receive the same gradient pressure, so
        their embeddings move together, and then any context containing one is treated much like the same context containing
        the other. Probability is shared between similar contexts by geometry instead of by backing off to shorter contexts.
      </p>
      <MlpLmViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the neural probabilistic language model">
        <p>
          With an embedding table <M>{"C \\in \\mathbb R^{V \\times d}"}</M>, the context{" "}
          <M>{"(w_{t-n}, \\dots, w_{t-1})"}</M> is mapped to
        </p>
        <MD>{"e = [C_{w_{t-n}}; \\dots; C_{w_{t-1}}] \\in \\mathbb R^{nd}, \\quad h = \\tanh(eW + b), \\quad p(\\cdot \\mid \\text{context}) = \\operatorname{softmax}(hU + c)."}</MD>
        <p>
          It has <M>{"Vd + ndh + h + hV + V"}</M> parameters. The cost of one more context word is dh parameters, against a
          factor of V for a count table. Training minimises the mean negative log-likelihood of the next word, whose
          exponential is the perplexity of the earlier lessons.
        </p>
        <Code>{MODEL}</Code>
      </Definition>

      <Theorem title="the gradient for a shared embedding">
        <p>
          Let <M>{"\\delta_{i,a} = \\partial \\mathcal L/\\partial e_i"}</M> restricted to the a-th block of d coordinates of
          example i&apos;s input. Then
        </p>
        <MD>{"\\frac{\\partial \\mathcal L}{\\partial C_w} = \\sum_{i}\\sum_{a=1}^{n} [x_{i,a} = w]\;\\delta_{i,a}."}</MD>
        <p>
          Rows of C for words absent from the batch receive zero gradient, and a word occurring at several positions or in
          several examples has its contributions added.
        </p>
      </Theorem>
      <Proof>
        <p>
          The loss depends on <M>{"C_w"}</M> only through the blocks of the inputs that copied it. Each copy is a separate path
          in the computational graph from <M>{"C_w"}</M> to the loss, with the identity as its local derivative, and the
          multivariate chain rule sums over paths. Since δ itself is the ordinary backpropagated gradient,{" "}
          <M>{"\\delta = (\\partial\\mathcal L/\\partial h \\odot (1 - h^2))W^\\top"}</M> with{" "}
          <M>{"\\partial \\mathcal L/\\partial(hU + c) = (p - \\mathbf 1_y)/B"}</M> for a batch of B, the result follows. In code
          the sum is a scatter-add, <C>np.add.at</C>; plain fancy-index assignment would keep only one of several duplicate
          updates.
        </p>
      </Proof>

      <Example title="classes discovered from prediction alone">
        <p>
          In the figure, 24 words fall into four hidden classes and the next word depends only on the classes of the previous
          two, so the true model has perplexity 14.55. A count trigram model would need to estimate 24³ = 13824 probabilities from
          3000 tokens. The neural model with d = 2 has 536 parameters and reaches perplexity 16.5 after 1000 SGD steps of 32
          examples. Its embeddings settle into four tight clusters, one per class, although class labels never appear in the
          data. Training longer starts to overfit, with test perplexity creeping up to 16.9 by step 4000.
        </p>
      </Example>

      <Remark title="where the cost went">
        <p>
          The price of sharing is computation: every prediction needs a V-way softmax, which dominated training time in 2003 and
          motivated hierarchical softmax and the negative sampling of word2vec. The fixed window remains: the model still
          cannot see word t − n − 1. Making the context unbounded while keeping the parameter count fixed is the job of the
          recurrent network in the next lesson.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: (
        <p>
          How many parameters does the model have with V = 10000, d = 60, a context of n = 3 words and h = 100 hidden units?
        </p>
      ),
      answer: { kind: "numeric", value: 1628100, tolerance: 0.5 },
    },
    {
      key: "init",
      rung: "check",
      prompt: (
        <p>
          The output weights and biases start at zero, so every word gets the same logit. What is the loss in nats with a
          vocabulary of 5000?
        </p>
      ),
      answer: { kind: "numeric", value: 8.517, tolerance: 0.001 },
    },
    {
      key: "gen",
      rung: "apply",
      prompt: (
        <p>
          The training text contains &quot;the cat is walking&quot; and many sentences where &quot;dog&quot; and &quot;cat&quot;
          appear in the same contexts, but never &quot;the dog is walking&quot;. Why does the neural model still give it a
          reasonable probability?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "It backs off to the bigram &quot;is walking&quot; when the trigram is unseen",
          "The embeddings of &quot;dog&quot; and &quot;cat&quot; end up close, and the output is a smooth function of the embeddings",
          "The softmax gives every word a probability of at least 1/V",
          "Add-one smoothing is applied to the softmax outputs",
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

def contexts(tokens, n):
    t = np.asarray(tokens)
    X = np.stack([t[i:len(t) - n + i] for i in range(n)], axis=1)
    return X, t[n:]

def init(V, d, n, h, seed=0):
    rng = np.random.default_rng(seed)
    return {"C": rng.normal(0, 1, (V, d)), "W": rng.normal(0, 1 / np.sqrt(n * d), (n * d, h)),
            "b": np.zeros(h), "U": rng.normal(0, 1 / np.sqrt(h), (h, V)), "c": np.zeros(V)}

def param_count(V, d, n, h):
    return V * d + n * d * h + h + h * V + V

def forward(P, X):
    E = P["C"][X].reshape(len(X), -1)
    H = np.tanh(E @ P["W"] + P["b"])
    return H @ P["U"] + P["c"]

def nll(P, X, y):
    Z = forward(P, X)
    Z = Z - Z.max(axis=1, keepdims=True)
    return float(np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(len(y)), y]))

X, y = contexts([5, 3, 8, 3, 5, 3], 2); print(X.tolist(), y.tolist())
P = init(10, 3, 2, 4); print(P["C"][X].shape, forward(P, X).shape, param_count(10, 3, 2, 4))
P["U"][:] = 0; print(round(nll(P, X, y), 4), round(float(np.log(10)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[5, 3], [3, 8], [8, 3], [3, 5]] [8, 3, 5, 3]\n(4, 2, 3) (4, 10) 108\n2.3026 2.3026",
          "[[5, 3], [3, 8], [8, 3], [3, 5], [5, 3]] [8, 3, 5, 3]\n(4, 2, 3) (4, 10) 108\n2.3026 2.3026",
          "[[5, 3], [3, 8], [8, 3], [3, 5]] [8, 3, 5, 3]\n(4, 6) (4, 10) 108\n2.3026 2.3026",
          "[[5, 3], [3, 8], [8, 3], [3, 5]] [8, 3, 5, 3]\n(4, 2, 3) (4, 10) 98\n0.0 2.3026",
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

def grads(P, X, y):
    E = P["C"][X].reshape(len(X), -1)
    H = np.tanh(E @ P["W"] + P["b"])
    Z = H @ P["U"] + P["c"]
    S = np.exp(Z - Z.max(axis=1, keepdims=True))
    S /= S.sum(axis=1, keepdims=True)
    S[np.arange(len(y)), y] -= 1
    S /= len(y)
    dH = (S @ P["U"].T) * (1 - H ** 2)
    dE = (dH @ P["W"].T).reshape(X.shape + (-1,))
    dC = np.zeros_like(P["C"])
    np.add.at(dC, X, dE)
    return {"C": dC, "W": E.T @ dH, "b": dH.sum(0), "U": H.T @ S, "c": S.sum(0)}

def sgd(P, X, y, lr, steps, batch=32, seed=0):
    rng = np.random.default_rng(seed)
    for _ in range(steps):
        i = rng.integers(0, len(y), batch)
        for k, g in grads(P, X[i], y[i]).items():
            P[k] -= lr * g
    return P

rng = np.random.default_rng(0); P = {"C": rng.normal(size=(5, 2)), "W": rng.normal(size=(4, 3)), "b": np.zeros(3), "U": rng.normal(size=(3, 5)), "c": np.zeros(5)}; X, y = np.array([[0, 1], [1, 1], [2, 0]]), np.array([3, 3, 4])
g = grads(P, X, y); print(g["C"].shape, np.allclose(g["C"][3:], 0), np.allclose(g["c"].sum(), 0), bool(np.abs(g["C"][1]).sum() > 0))
X2, y2 = np.repeat(X, 2, axis=0), np.repeat(y, 2); print(all(np.allclose(g[k], grads(P, X2, y2)[k]) for k in g), g["c"][3] < 0)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(5, 2) True True True\nTrue True",
          "(5, 2) False True True\nTrue True",
          "(5, 2) True True True\nFalse True",
          "(3, 2, 2) True True True\nTrue False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>contexts(tokens, n)</C> returning the matrix of n-word contexts and the next-word targets,{" "}
          <C>forward(P, X)</C> returning logits, and <C>nll(P, X, y)</C>, computed stably. The
          parameter dictionary has keys C, W, b, U and c as in the definition; <C>init</C> and <C>param_count</C> are given.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def contexts(tokens, n):
    return None, None

def init(V, d, n, h, seed=0):
    rng = np.random.default_rng(seed)
    return {"C": rng.normal(0, 1, (V, d)), "W": rng.normal(0, 1 / np.sqrt(n * d), (n * d, h)),
            "b": np.zeros(h), "U": rng.normal(0, 1 / np.sqrt(h), (h, V)), "c": np.zeros(V)}

def param_count(V, d, n, h):
    return V * d + n * d * h + h + h * V + V

def forward(P, X):
    return None

def nll(P, X, y):
    return 0.0
`,
        solution: MODEL,
        tests: [
          { name: "shapes", code: `X, y = contexts(list(range(7)), 3); assert X.tolist()[0] == [0, 1, 2] and X.shape == (4, 3) and y.tolist() == [3, 4, 5, 6]
P = init(9, 2, 3, 5, 1); assert forward(P, X).shape == (4, 9)` },
          { name: "loss", code: `P = init(9, 2, 3, 5, 1); X, y = contexts(list(range(7)), 3); P["U"] *= 0; assert abs(nll(P, X, y) - np.log(9)) < 1e-12
P["c"][:] = 0; P["c"][4] = 1000.0; assert abs(nll(P, X[1:2], np.array([4]))) < 1e-9 and np.isfinite(nll(P, X, y))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>grads(P, X, y)</C> returning the gradient of the mean loss for every parameter, with a scatter-add for the
          embedding table, and <C>sgd(P, X, y, lr, steps, batch, seed)</C> using random minibatches. Make <C>grads</C>{" "}
          self-contained: recompute the forward pass inside it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def grads(P, X, y):
    return {k: np.zeros_like(v) for k, v in P.items()}

def sgd(P, X, y, lr, steps, batch=32, seed=0):
    return P
`,
        solution: TRAIN,
        tests: [
          { name: "finite differences", code: `rng = np.random.default_rng(1); P = {"C": rng.normal(size=(6, 2)), "W": rng.normal(size=(6, 5)), "b": rng.normal(size=5), "U": rng.normal(size=(5, 6)), "c": rng.normal(size=6)}
X = np.array([[0, 0, 1], [2, 3, 0], [0, 4, 4]]); y = np.array([1, 5, 0])
def L(P):
    Z = np.tanh(P["C"][X].reshape(3, -1) @ P["W"] + P["b"]) @ P["U"] + P["c"]; Z = Z - Z.max(1, keepdims=True)
    return np.mean(np.log(np.exp(Z).sum(1)) - Z[np.arange(3), y])
g = grads(P, X, y)
for k in P:
    for idx in np.ndindex(P[k].shape):
        P[k][idx] += 1e-6; a = L(P); P[k][idx] -= 2e-6; b = L(P); P[k][idx] += 1e-6
        assert abs((a - b) / 2e-6 - g[k][idx]) < 1e-6, (k, idx)` },
          { name: "learns", code: `t = np.array([0, 1, 2] * 40); X, y = np.stack([t[:-2], t[1:-1]], 1), t[2:]; rng = np.random.default_rng(0)
P = {"C": rng.normal(size=(3, 2)), "W": rng.normal(size=(4, 8)) / 2, "b": np.zeros(8), "U": rng.normal(size=(8, 3)) / 3, "c": np.zeros(3)}
sgd(P, X, y, 0.5, 300, 16, 0); Z = np.tanh(P["C"][X].reshape(len(X), -1) @ P["W"] + P["b"]) @ P["U"] + P["c"]; assert (Z.argmax(1) == y).all() and np.ptp(Z, axis=1).min() > 3` },
        ],
      },
    },
    {
      key: "grow",
      rung: "stretch",
      prompt: (
        <p>
          Starting from the model in the first question (V = 10000, d = 60, n = 3, h = 100), how many words must be added to the
          context before the parameter count at least doubles?
        </p>
      ),
      answer: { kind: "numeric", value: 272, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The window is still fixed, and a longer window means a wider weight matrix. The next lesson feeds the words in one at a
        time and reuses the same weights at every step, giving a model whose context has no fixed limit.
      </p>
    </>
  ),
};
