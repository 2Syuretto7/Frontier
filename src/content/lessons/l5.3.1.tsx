import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { CausalityProbeViz } from "@/components/viz/CausalityProbeViz";
import type { LessonContent } from "@/lib/types";

const GPT = `import numpy as np

def rms(x):
    return x / np.sqrt((x * x).mean(-1, keepdims=True) + 1e-6)

def block(x, p):
    T = len(x)
    h = rms(x)
    q, k, v = h @ p["Wq"], h @ p["Wk"], h @ p["Wv"]
    s = q @ k.T / np.sqrt(q.shape[1]) + np.triu(np.full((T, T), -np.inf), 1)
    a = np.exp(s - s.max(1, keepdims=True))
    a /= a.sum(1, keepdims=True)
    x = x + a @ v @ p["Wo"]
    return x + np.maximum(rms(x) @ p["W1"], 0) @ p["W2"]

def gpt_forward(tokens, P):
    x = P["E"][tokens] + P["pos"][: len(tokens)]
    for p in P["blocks"]:
        x = block(x, p)
    return rms(x) @ P["E"].T`;

const SETUP = `import numpy as np

def init_gpt(V, d, L, ctx, rng, std=0.02):
    def w(m, n, s=std):
        return rng.normal(0, s, size=(m, n))
    out = std / np.sqrt(2 * L)
    blocks = [dict(Wq=w(d, d), Wk=w(d, d), Wv=w(d, d), Wo=w(d, d, out), W1=w(d, 4 * d), W2=w(4 * d, d, out)) for _ in range(L)]
    return dict(E=w(V, d), pos=w(ctx, d), blocks=blocks)

def lm_batch(tokens):
    tokens = np.asarray(tokens)
    return tokens[:-1], tokens[1:]

def cross_entropy(logits, targets):
    z = logits - logits.max(-1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(-1, keepdims=True))
    return float(-logp[np.arange(len(targets)), targets].mean())`;

export const lesson: LessonContent = {
  id: "l5.3.1",
  minutes: 50,
  links: {
    requires: ["l5.2.5", "l5.2.2"],
    revisits: ["l5.1.4"],
    foreshadows: ["l5.3.2", "l5.3.3"],
  },

  puzzle: (
    <>
      <p>
        A GPT reads a sequence of T tokens once and returns T predictions, one for the next token after every prefix. All T
        are trained in a single forward pass, yet none of them is allowed to see the token it is predicting, which sits in
        the very same input. How does one pass produce T honest predictions, and what should the loss be before any training
        has happened?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Every part of the model except attention works on each position on its own: the embedding looks up a row, the norms
        and MLPs act on one vector at a time. Attention is the only place where positions talk, and the causal mask lets
        position t listen only to positions up to t. So information flows forward in the sequence and never backward, and the
        output at position t is a prediction from the prefix ending at t, exactly what we want to compare with token t + 1.
        Try changing one input token and watch which outputs move.
      </p>
      <CausalityProbeViz />
    </>
  ),

  theory: (
    <>
      <Definition title="a GPT">
        <p>
          Given token ids <M>{"t_1, \\dots, t_T"}</M>, a GPT computes{" "}
          <M>{"x^{(0)}_i = E_{t_i} + P_i"}</M> from a token embedding E (V × d) and a learned position table P, then L pre-norm
          blocks, each a causal attention sublayer and an MLP sublayer added to the stream, then a final norm and the
          unembedding, here tied to E: <M>{"z_i = E\\,\\operatorname{Norm}(x^{(L)}_i)"}</M>. Real models use several attention
          heads, GELU or SwiGLU and a learned gain in each norm; the code keeps one head, ReLU and no gains.
        </p>
        <Code>{GPT}</Code>
      </Definition>

      <Theorem title="the model is causal">
        <p>
          For every layer ℓ and position i, <M>{"x^{(\\ell)}_i"}</M> depends only on <M>{"t_1, \\dots, t_i"}</M>. In particular
          the logits <M>{"z_i"}</M> are a function of the prefix ending at i.
        </p>
      </Theorem>
      <Proof>
        <p>
          Induction on ℓ. At ℓ = 0, <M>{"x^{(0)}_i"}</M> uses only <M>{"t_i"}</M> and the position i. Suppose the claim holds at
          ℓ − 1. The attention output at i is <M>{"\\sum_{j \\le i}a_{ij}v_j"}</M>, where the weights{" "}
          <M>{"a_{ij}"}</M> are computed from queries and keys at positions i and j ≤ i and the masked weights for j &gt; i are
          exactly 0, so it uses only <M>{"x^{(\\ell-1)}_j"}</M> for j ≤ i. The norm and the MLP act on position i alone. Adding
          to <M>{"x^{(\\ell-1)}_i"}</M> keeps the property, and the final norm and unembedding are per position.
        </p>
      </Proof>

      <Definition title="the language-modelling loss">
        <p>
          For a training sequence <M>{"t_1, \\dots, t_{T+1}"}</M>, feed <M>{"t_1, \\dots, t_T"}</M> and use{" "}
          <M>{"t_2, \\dots, t_{T+1}"}</M> as targets:{" "}
          <MD>{"\\mathcal L = -\\frac1T\\sum_{i=1}^T\\log\\operatorname{softmax}(z_i)_{t_{i+1}}."}</MD> By the theorem, the
          i-th term scores a prediction of <M>{"t_{i+1}"}</M> made from <M>{"t_1, \\dots, t_i"}</M>, so the T terms are T honest
          next-token predictions sharing one forward pass.
        </p>
        <Code>{SETUP}</Code>
      </Definition>

      <Theorem title="the loss at initialisation">
        <p>
          If every logit vector has all its entries within δ of a common value, then each term of the loss lies in{" "}
          <M>{"[\\log V - 2\\delta, \\log V + 2\\delta]"}</M>. With δ = 0 the loss is exactly <M>{"\\log V"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The term is <M>{"\\log\\sum_ke^{z_k} - z_{\\text{target}}"}</M>. If every <M>{"z_k \\in [c - \\delta, c + \\delta]"}</M>,
          the log-sum-exp lies in <M>{"[\\log V + c - \\delta, \\log V + c + \\delta]"}</M> and the target logit in{" "}
          <M>{"[c - \\delta, c + \\delta]"}</M>; subtract. With weights drawn at standard deviation 0.02 the logits are tiny, so a
          freshly initialised model should report a loss very close to <M>{"\\log V"}</M>, about 10.82 for V = 50257. A first
          loss far from this signals a bug, such as a missing mask or a scale error.
        </p>
      </Proof>

      <Remark title="initialising the writes">
        <p>
          A stack of L blocks makes 2L writes to the stream. If each is roughly independent with per-coordinate variance v,
          the stream&apos;s variance grows by 2Lv, which is the growth the previous lesson described. GPT-2 therefore draws the
          two matrices that write to the stream, the attention output and the second MLP matrix, with standard deviation{" "}
          <M>{"0.02/\\sqrt{2L}"}</M>, so the total added variance does not depend on depth.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "initloss",
      rung: "check",
      prompt: <p>A freshly initialised model with vocabulary 50257 has nearly uniform predictions. What loss in nats should it report? Give four decimals.</p>,
      answer: { kind: "numeric", value: 10.8249, tolerance: 0.00006 },
    },
    {
      key: "outstd",
      rung: "check",
      prompt: <p>With base standard deviation 0.02 and L = 12 blocks, what standard deviation does the GPT-2 scheme use for the matrices that write to the stream? Give five decimals.</p>,
      answer: { kind: "numeric", value: 0.00408, tolerance: 0.000006 },
    },
    {
      key: "shift",
      rung: "apply",
      prompt: <p>A training run reports a loss of 0.01 nats after a few hundred steps on ordinary text. What is the most likely cause?</p>,
      answer: {
        kind: "choice",
        options: [
          "The causal mask is missing or wrong, so each position can see the token it is meant to predict",
          "The learning rate is too small",
          "The vocabulary is too large",
          "The model has too few layers to fit the data",
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

def rms(x):
    return x / np.sqrt((x * x).mean(-1, keepdims=True) + 1e-6)

def block(x, p):
    T = len(x)
    h = rms(x)
    q, k, v = h @ p["Wq"], h @ p["Wk"], h @ p["Wv"]
    s = q @ k.T / np.sqrt(q.shape[1]) + np.triu(np.full((T, T), -np.inf), 1)
    a = np.exp(s - s.max(1, keepdims=True))
    a /= a.sum(1, keepdims=True)
    x = x + a @ v @ p["Wo"]
    return x + np.maximum(rms(x) @ p["W1"], 0) @ p["W2"]

def gpt_forward(tokens, P):
    x = P["E"][tokens] + P["pos"][: len(tokens)]
    for p in P["blocks"]:
        x = block(x, p)
    return rms(x) @ P["E"].T

print(np.round(rms(np.array([[3.0, 4.0], [1.0, -1.0]])), 3).tolist())
Z, I = np.zeros((2, 2)), np.eye(2); p = dict(Wq=Z, Wk=Z, Wv=I, Wo=I, W1=Z, W2=Z)
print(np.round(gpt_forward([0, 1], dict(E=I, pos=Z, blocks=[p])), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[[0.849, 1.131], [1.0, -1.0]]\n[[1.414, 0.0], [0.541, 1.307]]",
          "[[0.6, 0.8], [0.707, -0.707]]\n[[1.414, 0.0], [0.541, 1.307]]",
          "[[0.849, 1.131], [1.0, -1.0]]\n[[1.307, 0.541], [0.541, 1.307]]",
          "[[0.849, 1.131], [1.0, -1.0]]\n[[1.414, 0.0], [0.0, 1.414]]",
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

def init_gpt(V, d, L, ctx, rng, std=0.02):
    def w(m, n, s=std):
        return rng.normal(0, s, size=(m, n))
    out = std / np.sqrt(2 * L)
    blocks = [dict(Wq=w(d, d), Wk=w(d, d), Wv=w(d, d), Wo=w(d, d, out), W1=w(d, 4 * d), W2=w(4 * d, d, out)) for _ in range(L)]
    return dict(E=w(V, d), pos=w(ctx, d), blocks=blocks)

def lm_batch(tokens):
    tokens = np.asarray(tokens)
    return tokens[:-1], tokens[1:]

def cross_entropy(logits, targets):
    z = logits - logits.max(-1, keepdims=True)
    logp = z - np.log(np.exp(z).sum(-1, keepdims=True))
    return float(-logp[np.arange(len(targets)), targets].mean())

inp, tgt = lm_batch([5, 1, 4, 1]); print(inp.tolist(), tgt.tolist())
print(round(cross_entropy(np.zeros((3, 8)), [0, 1, 2]), 4), round(cross_entropy(np.array([[2.0, 0.0], [0.0, 2.0]]), [0, 0]), 4))
P = init_gpt(50, 16, 4, 32, np.random.default_rng(0)); print(P["pos"].shape, len(P["blocks"]), sum(b["W1"].size for b in P["blocks"]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5, 1, 4] [1, 4, 1]\n2.0794 1.1269\n(32, 16) 4 4096",
          "[5, 1, 4] [1, 4, 1]\n2.0794 0.1269\n(32, 16) 4 4096",
          "[5, 1, 4, 1] [1, 4, 1]\n2.0794 1.1269\n(32, 16) 4 4096",
          "[5, 1, 4] [1, 4, 1]\n0.125 1.1269\n(32, 16) 4 1024",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rms(x)</C>, dividing each row by <C>sqrt(mean(x²) + 1e-6)</C>; <C>block(x, p)</C>, one pre-norm block with
          single-head causal attention (scores scaled by <C>1/sqrt(d)</C>) and a ReLU MLP, using the keys Wq, Wk, Wv, Wo, W1,
          W2 of the dict p; and <C>gpt_forward(tokens, P)</C>, returning the T × V logits with the unembedding tied to{" "}
          <C>P[&quot;E&quot;]</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rms(x):
    return x

def block(x, p):
    return x

def gpt_forward(tokens, P):
    return P["E"][tokens] @ P["E"].T
`,
        solution: GPT,
        tests: [
          { name: "tiny", code: `Z, I = np.zeros((2, 2)), np.eye(2); p = dict(Wq=Z, Wk=Z, Wv=I, Wo=I, W1=Z, W2=Z)
assert np.allclose(rms(np.array([[3.0, 4.0]])), [[3 / 12.5 ** 0.5, 4 / 12.5 ** 0.5]], atol=1e-6)
assert np.allclose(gpt_forward([0, 1], dict(E=I, pos=Z, blocks=[p])), [[1.41421, 0.0], [0.54120, 1.30656]], atol=1e-4)` },
          { name: "causal", code: `rng = np.random.default_rng(0); d, V = 8, 11
mk = lambda m, n: rng.normal(0, 0.5, size=(m, n))
P = dict(E=mk(V, d), pos=mk(6, d), blocks=[dict(Wq=mk(d, d), Wk=mk(d, d), Wv=mk(d, d), Wo=mk(d, d), W1=mk(d, 4 * d), W2=mk(4 * d, d)) for _ in range(2)])
a = gpt_forward([1, 2, 3, 4, 5, 6], P); b = gpt_forward([1, 2, 3, 9, 5, 6], P)
assert a.shape == (6, V) and np.allclose(a[:3], b[:3]) and not np.allclose(a[3:], b[3:])
x = rng.normal(size=(3, d)); assert np.allclose(rms(x), x / np.sqrt((x * x).mean(1, keepdims=True) + 1e-6))` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>init_gpt(V, d, L, ctx, rng, std=0.02)</C>, returning the dict of the reference solution with Wo and W2 drawn
          at standard deviation <C>std / sqrt(2L)</C> and everything else at std; <C>lm_batch(tokens)</C>, returning the
          inputs and the shifted targets; and <C>cross_entropy(logits, targets)</C>, the mean negative log-probability as a
          float, computed stably.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def init_gpt(V, d, L, ctx, rng, std=0.02):
    return {}

def lm_batch(tokens):
    return tokens, tokens

def cross_entropy(logits, targets):
    return 0.0
`,
        solution: SETUP,
        tests: [
          { name: "init", code: `P = init_gpt(30, 64, 8, 16, np.random.default_rng(0))
assert P["E"].shape == (30, 64) and P["pos"].shape == (16, 64) and len(P["blocks"]) == 8
b = P["blocks"][0]; assert b["W1"].shape == (64, 256) and b["W2"].shape == (256, 64) and b["Wq"].shape == (64, 64)
assert abs(b["Wq"].std() - 0.02) < 0.002 and abs(np.concatenate([q["W2"].ravel() for q in P["blocks"]]).std() - 0.005) < 0.0002
assert abs(np.concatenate([q["Wo"].ravel() for q in P["blocks"]]).std() - 0.005) < 0.0003` },
          { name: "loss", code: `i, t = lm_batch([5, 1, 4, 1]); assert list(i) == [5, 1, 4] and list(t) == [1, 4, 1]
assert abs(cross_entropy(np.zeros((3, 8)), [0, 1, 2]) - np.log(8)) < 1e-12 and isinstance(cross_entropy(np.zeros((1, 2)), [0]), float)
assert abs(cross_entropy(np.array([[2.0, 0.0], [0.0, 2.0]]), [0, 0]) - 1.126928) < 1e-6 and abs(cross_entropy(np.array([[1000.0, 0.0]]), [1]) - 1000) < 1e-9` },
        ],
      },
    },
    {
      key: "noisy",
      rung: "stretch",
      prompt: <p>Suppose instead the logits are independent normal with mean 0 and standard deviation 1, and V = 50257. For large V the log-sum-exp is close to log(V·E[e^z]). What is the expected initial loss? Give three decimals.</p>,
      answer: { kind: "numeric", value: 11.325, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        The model and its loss are in place. Next we train it: batches, the optimiser, the learning-rate schedule and the
        details that make the loss curve go down.
      </p>
    </>
  ),
};
