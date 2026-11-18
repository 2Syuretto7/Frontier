import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { BpttLagViz } from "@/components/viz/BpttLagViz";
import type { LessonContent } from "@/lib/types";

const RNN = `import numpy as np

def rnn_forward(P, xs, h0):
    hs = [h0]
    for x in xs:
        hs.append(np.tanh(P["W"] @ hs[-1] + P["U"][:, x] + P["b"]))
    hs = np.array(hs)
    return hs, hs[1:] @ P["Vo"].T + P["c"]

def seq_loss(P, xs, ys, h0):
    Z = rnn_forward(P, xs, h0)[1]
    Z = Z - Z.max(axis=1, keepdims=True)
    return float(np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(len(ys)), ys]))`;

const BPTT = `import numpy as np

def bptt(P, xs, ys, hs):
    T = len(xs)
    Z = hs[1:] @ P["Vo"].T + P["c"]
    S = np.exp(Z - Z.max(axis=1, keepdims=True))
    S /= S.sum(axis=1, keepdims=True)
    S[np.arange(T), ys] -= 1
    S /= T
    g = {k: np.zeros_like(v) for k, v in P.items()}
    g["Vo"], g["c"] = S.T @ hs[1:], S.sum(axis=0)
    dh = np.zeros(len(hs[0]))
    for t in reversed(range(T)):
        da = (dh + P["Vo"].T @ S[t]) * (1 - hs[t + 1] ** 2)
        g["W"] += np.outer(da, hs[t])
        g["U"][:, xs[t]] += da
        g["b"] += da
        dh = P["W"].T @ da
    return g

def sensitivity(W, hs):
    J, out = np.eye(len(W)), [1.0]
    for t in range(len(hs) - 1, 0, -1):
        J = J @ ((1 - hs[t] ** 2)[:, None] * W)
        out.append(float(np.linalg.norm(J, 2)))
    return np.array(out)`;

export const lesson: LessonContent = {
  id: "l4.3.3",
  minutes: 55,
  links: {
    requires: ["l4.3.2", "l3.5.1"],
    revisits: ["l3.2.1", "l2.5.4"],
    foreshadows: ["l4.3.4"],
  },

  puzzle: (
    <>
      <p>
        A recurrent network reads a sentence one word at a time, carrying a hidden state forward, so in principle the last
        word&apos;s prediction can depend on the first. Train one on text and check: it uses the last ten or so words well and
        almost ignores everything earlier, even when the earlier words decide the answer. The architecture can represent the
        dependency. Why does training not find it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A recurrent network is one small network applied at every time step, with its output fed back in as part of the next
        input. Unrolled over a sequence it is a very deep feed-forward network whose layers all share the same weights, and it
        is trained by ordinary backpropagation on that unrolled graph, which is called backpropagation through time. The
        gradient that tells step t how it affected a loss at step T has been multiplied by the recurrent Jacobian T − t times.
        Unless that product stays near size one, the learning signal from distant steps either fades to nothing or blows up.
      </p>
      <BpttLagViz />
    </>
  ),

  theory: (
    <>
      <Definition title="recurrent network">
        <p>
          For input tokens <M>{"x_1, \\dots, x_T"}</M> and an initial state <M>{"h_0"}</M>,
        </p>
        <MD>{"h_t = \\tanh(W h_{t-1} + U e_{x_t} + b), \\qquad p(y_t \\mid x_{1:t}) = \\operatorname{softmax}(V_o h_t + c)_{y_t},"}</MD>
        <p>
          where <M>{"e_{x_t}"}</M> is a one-hot vector, so <M>{"U e_{x_t}"}</M> is a column of U acting as an embedding. The same
          W, U, b, <M>{"V_o"}</M> and c are used at every step, so the parameter count does not depend on T. For language
          modelling, <M>{"y_t = x_{t+1}"}</M> and the loss is the mean cross-entropy over steps.
        </p>
        <Code>{RNN}</Code>
      </Definition>

      <Theorem title="backpropagation through time">
        <p>
          Let <M>{"a_t = W h_{t-1} + U e_{x_t} + b"}</M>, <M>{"g_t = \\partial\\mathcal L/\\partial h_t"}</M> counting every path
          from <M>{"h_t"}</M> to the loss, and <M>{"\\delta_t = \\partial\\mathcal L/\\partial a_t"}</M>. Then, with{" "}
          <M>{"g_{T+1}"}</M> terms absent,
        </p>
        <MD>{"g_t = V_o^\\top \\frac{\\partial \\mathcal L_t}{\\partial z_t} + W^\\top \\delta_{t+1}, \\qquad \\delta_t = g_t \\odot (1 - h_t^2), \\qquad \\frac{\\partial \\mathcal L}{\\partial W} = \\sum_{t=1}^{T} \\delta_t h_{t-1}^\\top,"}</MD>
        <p>
          and similarly <M>{"\\partial\\mathcal L/\\partial b = \\sum_t \\delta_t"}</M>, with column <M>{"x_t"}</M> of U receiving{" "}
          <M>{"\\delta_t"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Unroll the recursion into a graph with one copy of each parameter per time step, joined by the constraint that the
          copies are equal. The state <M>{"h_t"}</M> influences the loss along two routes: through its own output{" "}
          <M>{"z_t = V_o h_t + c"}</M> and through <M>{"a_{t+1}"}</M>. The chain rule sums them, giving the formula for{" "}
          <M>{"g_t"}</M>, and tanh contributes the elementwise factor <M>{"1 - h_t^2"}</M>. The copy of W used at step t sees
          gradient <M>{"\\delta_t h_{t-1}^\\top"}</M>, as in a dense layer, and the gradient for a shared parameter is the sum
          over its copies. Computing <M>{"g_T"}</M> first and walking backwards gives every term in one pass of cost linear in T.
        </p>
      </Proof>

      <Theorem title="gradients across many steps">
        <p>
          <M>{"\\partial h_T/\\partial h_t = \\prod_{s=t+1}^{T} \\operatorname{diag}(1 - h_s^2)\\,W"}</M>, so{" "}
          <M>{"\\|\\partial h_T/\\partial h_t\\| \\le \\|W\\|^{T-t}"}</M>. If the largest singular value of W is below 1, the
          influence of step t on the loss at step T decays geometrically in T − t.
        </p>
      </Theorem>
      <Proof>
        <p>
          Each factor is the Jacobian of one step, by the chain rule. Since <M>{"0 < 1 - h^2 \\le 1"}</M>, the diagonal factor has
          norm at most 1, and the norm of a product is at most the product of norms. The converse fails: a large W does not make
          gradients explode reliably, because large pre-activations saturate tanh and shrink the diagonal factors, but in the
          chaotic regime they do grow, as the figure shows at gain 3.
        </p>
      </Proof>

      <Example title="the four gains in the figure">
        <p>
          With weights drawn at gain 0.5, a gradient sent back 10 steps has size about 10⁻³·⁹. At gain 0.9 it is 10⁻⁵·⁸ after 40
          steps. At gain 1.5, close to the edge between order and chaos, it is still 10⁻⁰·⁸ after 40 steps, while at gain 3 it
          has grown to 10³·⁴. A loss at step T therefore teaches the network almost nothing about inputs 40 steps earlier
          unless the dynamics are tuned to the boundary, and no fixed W keeps them there for every input.
        </p>
        <Code>{BPTT}</Code>
      </Example>

      <Remark title="truncation and clipping">
        <p>
          On long streams the hidden state is carried forward across the whole sequence, but gradients are propagated back only
          k steps, a practice called truncated BPTT. It bounds memory and time, and loses nothing the gradient would have
          carried anyway when it decays within k steps. Exploding gradients are tamed by clipping the gradient norm, as in the
          lesson on vanishing gradients. Vanishing gradients need a change of architecture: an additive path through time, the
          subject of the next lesson.
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
          An RNN language model has 100 hidden units and a vocabulary of 50, with W, U, b, V_o and c as in the definition. How
          many parameters does it have when trained on sequences of length 1000?
        </p>
      ),
      answer: { kind: "numeric", value: 20150, tolerance: 0.5 },
    },
    {
      key: "scalar",
      rung: "check",
      prompt: <p>A linear scalar RNN has h_t = 0.9 h_(t−1) + x_t. By what factor is the gradient scaled after travelling back 50 steps?</p>,
      answer: { kind: "numeric", value: 0.005154, tolerance: 0.00001 },
    },
    {
      key: "trunc",
      rung: "apply",
      prompt: (
        <p>
          A character model is trained with truncated BPTT over 20 steps, carrying the hidden state forward across chunks. What
          is the most accurate statement?
        </p>
      ),
      answer: {
        kind: "choice",
        options: [
          "The model cannot use any information from more than 20 characters ago when predicting",
          "The gradient never directly rewards storing information for more than 20 steps, though the forward pass can carry it",
          "Truncation makes the gradient exact for chunks of 20 characters, so nothing is lost",
          "Truncation prevents gradients from vanishing",
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

def rnn_forward(P, xs, h0):
    hs = [h0]
    for x in xs:
        hs.append(np.tanh(P["W"] @ hs[-1] + P["U"][:, x] + P["b"]))
    hs = np.array(hs)
    return hs, hs[1:] @ P["Vo"].T + P["c"]

def seq_loss(P, xs, ys, h0):
    Z = rnn_forward(P, xs, h0)[1]
    Z = Z - Z.max(axis=1, keepdims=True)
    return float(np.mean(np.log(np.exp(Z).sum(axis=1)) - Z[np.arange(len(ys)), ys]))

P = {"W": np.zeros((2, 2)), "U": 10 * np.eye(2), "b": np.zeros(2), "Vo": np.eye(2), "c": np.zeros(2)}
hs, Z = rnn_forward(P, [0, 1, 1], np.zeros(2)); print(hs.shape, Z.shape, np.round(hs[-1], 3).tolist())
print(round(seq_loss(P, [0, 1, 1], [0, 1, 1], np.zeros(2)), 4), round(seq_loss(P, [0, 1, 1], [1, 0, 0], np.zeros(2)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(4, 2) (3, 2) [0.0, 1.0]\n0.3133 1.3133",
          "(3, 2) (3, 2) [0.0, 1.0]\n0.3133 1.3133",
          "(4, 2) (3, 2) [1.0, 1.0]\n0.3133 1.3133",
          "(4, 2) (3, 2) [0.0, 1.0]\n0.6931 0.6931",
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

def bptt(P, xs, ys, hs):
    T = len(xs)
    Z = hs[1:] @ P["Vo"].T + P["c"]
    S = np.exp(Z - Z.max(axis=1, keepdims=True))
    S /= S.sum(axis=1, keepdims=True)
    S[np.arange(T), ys] -= 1
    S /= T
    g = {k: np.zeros_like(v) for k, v in P.items()}
    g["Vo"], g["c"] = S.T @ hs[1:], S.sum(axis=0)
    dh = np.zeros(len(hs[0]))
    for t in reversed(range(T)):
        da = (dh + P["Vo"].T @ S[t]) * (1 - hs[t + 1] ** 2)
        g["W"] += np.outer(da, hs[t])
        g["U"][:, xs[t]] += da
        g["b"] += da
        dh = P["W"].T @ da
    return g

def sensitivity(W, hs):
    J, out = np.eye(len(W)), [1.0]
    for t in range(len(hs) - 1, 0, -1):
        J = J @ ((1 - hs[t] ** 2)[:, None] * W)
        out.append(float(np.linalg.norm(J, 2)))
    return np.array(out)

rng = np.random.default_rng(0); W = rng.normal(0, 1 / np.sqrt(8), (8, 8)); hs = [np.zeros(8)]
for x in rng.normal(size=(30, 8)): hs.append(np.tanh(0.5 * W @ hs[-1] + x))
s = sensitivity(0.5 * W, np.array(hs)); print(len(s), s[0], bool(s[10] < 1e-3), bool(np.all(np.diff(s) <= 1e-12)))
P = {"W": 0.5 * W, "U": np.eye(8)[:, :3], "b": np.zeros(8), "Vo": np.ones((3, 8)), "c": np.zeros(3)}; g = bptt(P, [0, 0, 1], [1, 1, 1], np.array(hs[:4]))
print(np.allclose(g["U"][:, 2], 0), np.allclose(g["c"].sum(), 0), np.allclose(g["Vo"][0], g["Vo"][2]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "31 1.0 True True\nTrue True True",
          "30 1.0 True True\nTrue True True",
          "31 1.0 False True\nTrue True True",
          "31 1.0 True True\nFalse True False",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rnn_forward(P, xs, h0)</C> returning the stacked states <M>{"h_0, \\dots, h_T"}</M> and the logits for steps 1
          to T, and <C>seq_loss(P, xs, ys, h0)</C> returning the mean cross-entropy, computed stably.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rnn_forward(P, xs, h0):
    return None, None

def seq_loss(P, xs, ys, h0):
    return 0.0
`,
        solution: RNN,
        tests: [
          { name: "states", code: `P = {"W": 0.5 * np.eye(2), "U": np.array([[1.0, 0], [0, 2]]), "b": np.zeros(2), "Vo": np.eye(2), "c": np.zeros(2)}
hs, Z = rnn_forward(P, [0, 1], np.zeros(2)); assert hs.shape == (3, 2) and np.allclose(hs[1], [np.tanh(1), 0]) and np.allclose(hs[2], np.tanh([0.5 * np.tanh(1), 2])) and np.allclose(Z, hs[1:])` },
          { name: "loss", code: `P = {"W": np.zeros((2, 2)), "U": np.zeros((2, 3)), "b": np.zeros(2), "Vo": np.zeros((3, 2)), "c": np.array([500.0, 0, 0])}
assert abs(seq_loss(P, [0, 2], [0, 0], np.zeros(2))) < 1e-9 and abs(seq_loss(P, [0, 2], [1, 0], np.zeros(2)) - 250) < 1e-6` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>bptt(P, xs, ys, hs)</C>, the gradient of the mean cross-entropy for every parameter given the states from
          the forward pass, and <C>sensitivity(W, hs)</C>, the spectral norms of{" "}
          <M>{"\\partial h_T/\\partial h_{T-k}"}</M> for k = 0 to T.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def bptt(P, xs, ys, hs):
    return {k: np.zeros_like(v) for k, v in P.items()}

def sensitivity(W, hs):
    return np.ones(len(hs))
`,
        solution: BPTT,
        tests: [
          { name: "finite differences", code: `rng = np.random.default_rng(2); H, V = 5, 4
P = {"W": rng.normal(size=(H, H)) / 2, "U": rng.normal(size=(H, V)), "b": rng.normal(size=H), "Vo": rng.normal(size=(V, H)), "c": rng.normal(size=V)}
xs, ys, h0 = [0, 2, 2, 3, 1], [2, 2, 3, 1, 0], rng.normal(size=H)
def run(P):
    hs = [h0]
    for x in xs: hs.append(np.tanh(P["W"] @ hs[-1] + P["U"][:, x] + P["b"]))
    Z = np.array(hs[1:]) @ P["Vo"].T + P["c"]; Z = Z - Z.max(1, keepdims=True)
    return np.array(hs), np.mean(np.log(np.exp(Z).sum(1)) - Z[np.arange(5), ys])
g = bptt(P, xs, ys, run(P)[0])
for k in P:
    for idx in np.ndindex(P[k].shape):
        P[k][idx] += 1e-6; a = run(P)[1]; P[k][idx] -= 2e-6; b = run(P)[1]; P[k][idx] += 1e-6
        assert abs((a - b) / 2e-6 - g[k][idx]) < 1e-6, (k, idx)` },
          { name: "sensitivity", code: `W = np.diag([0.5, 0.25]); hs = np.zeros((4, 2)); s = sensitivity(W, hs); assert np.allclose(s, [1, 0.5, 0.25, 0.125])
hs[3] = [0.5, 0]; assert np.allclose(sensitivity(W, hs)[1:], [0.375, 0.1875, 0.09375])` },
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: (
        <p>
          Each backward step multiplies the gradient norm by 0.8. What is the smallest number of steps after which it has fallen
          below one millionth of its starting size?
        </p>
      ),
      answer: { kind: "numeric", value: 62, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        The trouble is the repeated multiplication. The next lesson gives the state an additive path, gated so that the
        network decides what to keep, and gradients along it can survive hundreds of steps.
      </p>
    </>
  ),
};
