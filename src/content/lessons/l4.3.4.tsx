import { M, MD } from "@/components/Math";
import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ForgetPathViz } from "@/components/viz/ForgetPathViz";
import type { LessonContent } from "@/lib/types";

const LSTM = `import numpy as np

def sigmoid(v):
    return 1 / (1 + np.exp(-v))

def lstm_params(D, H, seed=0, forget_bias=1.0):
    rng = np.random.default_rng(seed)
    b = np.zeros(4 * H)
    b[H:2 * H] = forget_bias
    return {"W": rng.normal(0, 1 / np.sqrt(H + D), (4 * H, H + D)), "b": b}

def lstm_step(P, x, h, c):
    H = len(h)
    a = P["W"] @ np.concatenate([h, x]) + P["b"]
    i, f, o = sigmoid(a[:H]), sigmoid(a[H:2 * H]), sigmoid(a[2 * H:3 * H])
    c = f * c + i * np.tanh(a[3 * H:])
    return o * np.tanh(c), c

def lstm_run(P, xs, h, c):
    hs, cs = [h], [c]
    for x in xs:
        h, c = lstm_step(P, x, h, c)
        hs.append(h)
        cs.append(c)
    return np.array(hs), np.array(cs)`;

const GRU = `import numpy as np

def gru_step(P, x, h):
    s = lambda v: 1 / (1 + np.exp(-v))
    z = s(P["Wz"] @ np.concatenate([h, x]) + P["bz"])
    r = s(P["Wr"] @ np.concatenate([h, x]) + P["br"])
    n = np.tanh(P["Wn"] @ np.concatenate([r * h, x]) + P["bn"])
    return (1 - z) * h + z * n

def count_params(kind, D, H):
    return {"rnn": 1, "gru": 3, "lstm": 4}[kind] * H * (H + D + 1)`;

export const lesson: LessonContent = {
  id: "l4.3.4",
  minutes: 50,
  links: {
    requires: ["l4.3.3"],
    revisits: ["l3.5.3", "l3.1.3"],
    foreshadows: ["l4.3.5"],
  },

  puzzle: (
    <>
      <p>
        The previous lesson showed gradients in a plain recurrent network shrinking geometrically with distance, and no
        choice of weights fixed it for all inputs. In 1997 Hochreiter and Schmidhuber added a second state vector that is
        updated by addition instead of by a matrix multiplication and a squashing function. For the next twenty years this
        design dominated speech recognition, translation and handwriting. Why should replacing a product with a sum matter so
        much?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        An LSTM keeps a cell state that is copied from step to step, scaled elementwise by a forget gate and topped up with new
        content through an input gate. Gates are sigmoids, numbers between 0 and 1 computed from the current input and the
        previous output, so the network decides at each step what to keep and what to write. When the forget gate is near 1, the
        cell carries a value, and the gradient for it, across many steps unchanged. The same idea in a residual network is the
        identity shortcut; here it runs through time instead of through depth.
      </p>
      <ForgetPathViz />
    </>
  ),

  theory: (
    <>
      <Definition title="long short-term memory">
        <p>
          With <M>{"u_t = [h_{t-1}; x_t]"}</M> and σ the logistic function, an LSTM step computes
        </p>
        <MD>{"i_t, f_t, o_t = \\sigma(W_{i,f,o} u_t + b_{i,f,o}), \\quad g_t = \\tanh(W_g u_t + b_g), \\quad c_t = f_t \\odot c_{t-1} + i_t \\odot g_t, \\quad h_t = o_t \\odot \\tanh(c_t)."}</MD>
        <p>
          The four blocks are stacked into one matrix of shape 4H × (H + D), so an LSTM has <M>{"4H(H + D + 1)"}</M> parameters,
          four times a plain RNN of the same width. The forget-gate bias is commonly initialised to 1 or more so that cells start
          by remembering.
        </p>
        <Code>{LSTM}</Code>
      </Definition>

      <Theorem title="the cell-state path">
        <p>
          Holding the gates fixed, <M>{"\\partial c_T/\\partial c_t = \\operatorname{diag}\\bigl(\\prod_{s=t+1}^{T} f_s\\bigr)"}</M>.
          In particular, if every forget gate of unit j stays at least <M>{"1 - \\varepsilon"}</M>, the gradient along that unit&apos;s
          cell decays no faster than <M>{"(1 - \\varepsilon)^{T-t}"}</M>, whatever the weights.
        </p>
      </Theorem>
      <Proof>
        <p>
          From <M>{"c_s = f_s \\odot c_{s-1} + i_s \\odot g_s"}</M>, the direct derivative of <M>{"c_s"}</M> with respect to{" "}
          <M>{"c_{s-1}"}</M> is <M>{"\\operatorname{diag}(f_s)"}</M>; there is no weight matrix and no tanh derivative in it. The
          chain rule multiplies these diagonal matrices, which multiplies their diagonals. The full Jacobian also has paths
          through <M>{"h_{s-1}"}</M> into the gates, and those involve W as in a plain RNN, but the direct path alone is enough to
          carry gradient to distant steps whenever the network keeps its forget gates open. Contrast the plain RNN, whose only
          path multiplies by <M>{"\\operatorname{diag}(1 - h_s^2) W"}</M> at every step.
        </p>
      </Proof>

      <Definition title="gated recurrent unit">
        <p>
          The GRU merges cell and output and uses two gates:
        </p>
        <MD>{"z_t = \\sigma(W_z u_t + b_z), \\quad r_t = \\sigma(W_r u_t + b_r), \\quad n_t = \\tanh(W_n [r_t \\odot h_{t-1}; x_t] + b_n), \\quad h_t = (1 - z_t) \\odot h_{t-1} + z_t \\odot n_t."}</MD>
        <p>
          The update gate z interpolates between keeping the old state and writing a candidate, so the direct path has Jacobian{" "}
          <M>{"\\operatorname{diag}(1 - z_t)"}</M>; the reset gate r lets the candidate ignore the past. It has{" "}
          <M>{"3H(H + D + 1)"}</M> parameters, and on most benchmarks performs about as well as the LSTM.
        </p>
        <Code>{GRU}</Code>
      </Definition>

      <Example title="what the forget bias buys">
        <p>
          In the figure, forget gates fluctuate around their bias. With bias 0 the average signal surviving 100 steps is about
          10⁻³³, worse than a plain RNN at gain 0.9 (10⁻¹⁶). With bias 1 it is 10⁻¹⁸, with bias 3 it is 10⁻⁴·³, and with bias 5 it
          is 0.16. A constant gate of σ(1) = 0.73 already leaves only 0.0019 after 20 steps; σ(5) = 0.993 leaves 0.87.
        </p>
      </Example>

      <Remark title="limits of gating">
        <p>
          Gating makes long memory learnable, not free: everything the network remembers must fit into a fixed-size state, and
          each step still depends on the previous one, so training cannot be parallelised across time. Both limits motivate
          attention, where the model looks back at all earlier states directly. The next lesson first uses LSTMs to map one
          sequence to another.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>How many parameters does an LSTM layer have with input size 100 and hidden size 256?</p>,
      answer: { kind: "numeric", value: 365568, tolerance: 0.5 },
    },
    {
      key: "forget",
      rung: "check",
      prompt: (
        <p>
          A cell&apos;s forget gate stays at σ(1). What fraction of the gradient along the cell path survives 20 steps?
        </p>
      ),
      answer: { kind: "numeric", value: 0.001901, tolerance: 0.000005 },
    },
    {
      key: "why",
      rung: "apply",
      prompt: <p>What is the main reason gradients along the LSTM cell state can survive many steps?</p>,
      answer: {
        kind: "choice",
        options: [
          "The output gate rescales the gradient to unit norm at every step",
          "The step-to-step Jacobian along the cell is the diagonal matrix of forget gates, with no weight matrix or tanh derivative, so it stays near the identity when the gates are near 1",
          "The cell state is bounded between −1 and 1",
          "LSTMs use four times as many parameters as RNNs",
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

def sigmoid(v):
    return 1 / (1 + np.exp(-v))

def lstm_params(D, H, seed=0, forget_bias=1.0):
    rng = np.random.default_rng(seed)
    b = np.zeros(4 * H)
    b[H:2 * H] = forget_bias
    return {"W": rng.normal(0, 1 / np.sqrt(H + D), (4 * H, H + D)), "b": b}

def lstm_step(P, x, h, c):
    H = len(h)
    a = P["W"] @ np.concatenate([h, x]) + P["b"]
    i, f, o = sigmoid(a[:H]), sigmoid(a[H:2 * H]), sigmoid(a[2 * H:3 * H])
    c = f * c + i * np.tanh(a[3 * H:])
    return o * np.tanh(c), c

def lstm_run(P, xs, h, c):
    hs, cs = [h], [c]
    for x in xs:
        h, c = lstm_step(P, x, h, c)
        hs.append(h)
        cs.append(c)
    return np.array(hs), np.array(cs)

P = lstm_params(1, 2, seed=0); print(P["W"].shape, P["b"].tolist())
h, c = lstm_step(P, np.array([1.0]), np.zeros(2), np.zeros(2)); print(bool(np.all(np.abs(h) < 1)), bool(np.all(np.abs(c) < 1)))
P["W"][:] = 0; P["b"][:] = [0, 0, 50, 50, 50, 50, 0, 0]; h, c = lstm_step(P, np.array([3.0]), np.zeros(2), np.array([0.7, -2.0])); print(np.round(c, 3).tolist(), np.round(h, 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(8, 3) [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0]\nTrue True\n[0.7, -2.0] [0.604, -0.964]",
          "(8, 3) [1.0, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]\nTrue True\n[0.7, -2.0] [0.604, -0.964]",
          "(8, 3) [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0]\nTrue True\n[0.7, -2.0] [0.7, -2.0]",
          "(8, 3) [0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0]\nTrue True\n[1.0, -1.0] [0.762, -0.762]",
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

def gru_step(P, x, h):
    s = lambda v: 1 / (1 + np.exp(-v))
    z = s(P["Wz"] @ np.concatenate([h, x]) + P["bz"])
    r = s(P["Wr"] @ np.concatenate([h, x]) + P["br"])
    n = np.tanh(P["Wn"] @ np.concatenate([r * h, x]) + P["bn"])
    return (1 - z) * h + z * n

def count_params(kind, D, H):
    return {"rnn": 1, "gru": 3, "lstm": 4}[kind] * H * (H + D + 1)

P = {"Wz": np.zeros((2, 3)), "bz": np.full(2, -50.0), "Wr": np.zeros((2, 3)), "br": np.zeros(2), "Wn": np.ones((2, 3)), "bn": np.zeros(2)}
print(np.allclose(gru_step(P, np.array([5.0]), np.array([0.3, -0.3])), [0.3, -0.3]))
P["bz"][:] = 50; print(np.round(gru_step(P, np.array([1.0]), np.array([0.3, -0.3])), 4).tolist())
print(count_params("lstm", 10, 20), count_params("gru", 10, 20))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "True\n[0.7616, 0.7616]\n2480 1860",
          "False\n[0.7616, 0.7616]\n2480 1860",
          "True\n[0.3, -0.3]\n2480 1860",
          "True\n[0.7616, 0.7616]\n2400 1800",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>lstm_step(P, x, h, c)</C>, with the gate blocks of W and b in the order i, f, o, g, returning the new (h, c),
          and <C>lstm_run(P, xs, h, c)</C> returning the stacked hidden and cell states including the initial ones.{" "}
          <C>sigmoid</C> and <C>lstm_params</C> are given.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def sigmoid(v):
    return 1 / (1 + np.exp(-v))

def lstm_params(D, H, seed=0, forget_bias=1.0):
    rng = np.random.default_rng(seed)
    b = np.zeros(4 * H)
    b[H:2 * H] = forget_bias
    return {"W": rng.normal(0, 1 / np.sqrt(H + D), (4 * H, H + D)), "b": b}

def lstm_step(P, x, h, c):
    return h, c

def lstm_run(P, xs, h, c):
    return None, None
`,
        solution: LSTM,
        tests: [
          { name: "step", code: `P = {"W": np.zeros((4, 2)), "b": np.array([50.0, -50.0, 50.0, 0.5])}; h, c = lstm_step(P, np.array([2.0]), np.array([0.1]), np.array([9.0]))
assert np.allclose(c, np.tanh(0.5)) and np.allclose(h, np.tanh(np.tanh(0.5)))
P = lstm_params(2, 3, 4); x, h0, c0 = np.array([0.5, -1.0]), np.array([0.2, 0.0, -0.3]), np.array([1.0, -1.0, 0.5]); a = P["W"] @ np.r_[h0, x] + P["b"]; s = sigmoid(a)
h, c = lstm_step(P, x, h0, c0); assert np.allclose(c, s[3:6] * c0 + s[:3] * np.tanh(a[9:])) and np.allclose(h, s[6:9] * np.tanh(c))` },
          { name: "run", code: `P = {"W": np.zeros((8, 3)), "b": np.array([-50.0, -50, 50, 50, 50, 50, 0, 0])}; hs, cs = lstm_run(P, [np.array([1.0])] * 30, np.zeros(2), np.array([0.4, -0.8]))
assert hs.shape == (31, 2) and cs.shape == (31, 2) and np.allclose(cs, [0.4, -0.8]) and np.allclose(hs[1:], np.tanh([0.4, -0.8])) and np.allclose(hs[0], 0)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gru_step(P, x, h)</C> with parameters Wz, bz, Wr, br, Wn and bn as in the definition, and{" "}
          <C>count_params(kind, D, H)</C> for kind &quot;rnn&quot;, &quot;gru&quot; or &quot;lstm&quot;, counting weights and biases.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gru_step(P, x, h):
    return h

def count_params(kind, D, H):
    return 0
`,
        solution: GRU,
        tests: [
          { name: "gates", code: `Z = np.zeros((2, 3)); P = {"Wz": Z, "bz": np.full(2, 50.0), "Wr": Z, "br": np.full(2, -50.0), "Wn": np.ones((2, 3)), "bn": np.array([0.0, 1.0])}
assert np.allclose(gru_step(P, np.array([0.5]), np.array([3.0, -3.0])), np.tanh([0.5, 1.5]))
P["bz"][:] = [0.0, -50.0]; out = gru_step(P, np.array([0.5]), np.array([3.0, -3.0])); assert np.allclose(out, [0.5 * 3 + 0.5 * np.tanh(0.5), -3.0])` },
          { name: "counts", code: `assert count_params("rnn", 3, 5) == 45 and count_params("gru", 100, 256) == 3 * 256 * 357 and count_params("lstm", 1, 1) == 12` },
        ],
      },
    },
    {
      key: "bias",
      rung: "stretch",
      prompt: (
        <p>
          What constant forget-gate pre-activation b is needed so that at least half of the gradient along the cell path
          survives 100 steps? Give the smallest such b.
        </p>
      ),
      answer: { kind: "numeric", value: 4.968, tolerance: 0.002 },
    },
  ],

  glimpse: (
    <>
      <p>
        With memory that lasts, a recurrent network can read a whole sentence before producing anything. The next lesson
        uses one LSTM to encode a sentence into a vector and another to decode it into a different language.
      </p>
    </>
  ),
};
