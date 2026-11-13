import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { DepthVarianceViz } from "@/components/viz/DepthVarianceViz";
import type { LessonContent } from "@/lib/types";

const VAR = `import numpy as np

def layer_out_var(n_in, w_var, x_m2):
    return n_in * w_var * x_m2

def forward_stds(x, Ws, act=lambda a: a):
    stds = []
    for W in Ws:
        a = x @ W
        stds.append(float(a.std()))
        x = act(a)
    return stds`;

const CAL = `def calibrate(Ws, x, act=lambda a: a):
    out = []
    for W in Ws:
        W = W / (x @ W).std()
        out.append(W)
        x = act(x @ W)
    return out`;

export const lesson: LessonContent = {
  id: "l3.4.1",
  minutes: 45,
  links: {
    requires: ["l3.2.3", "m4.6.3"],
    revisits: ["e5.3.4", "l3.1.2"],
    foreshadows: ["l3.4.2", "l3.5.1", "m7.2.4"],
  },

  puzzle: (
    <>
      <p>
        Two networks are identical except that one draws its weights with standard deviation 0.045 and the other with 0.055.
        After thirty layers, the first network's outputs are about 0.04 in size and the second's about 17. A twenty per cent
        difference in one number has become a factor of four hundred. And setting every weight to 0, the most neutral choice
        of all, is worse still. What is the right scale?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A layer adds up n products of a weight and an input. If each product has a typical size, the sum's variance is n times
        it, and the next layer does the same again. Every layer multiplies the variance by the same factor, so across depth the
        factor is raised to a power: anything above 1 explodes and anything below 1 vanishes. The job of initialisation is to
        make that factor 1.
      </p>
      <DepthVarianceViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="symmetry is never broken">
        <p>
          If two hidden units in a layer start with identical incoming and outgoing weights, then under gradient descent they
          receive identical gradients and stay identical forever. In particular, initialising every weight to the same value
          (such as 0) makes a layer of n units no more expressive than one unit.
        </p>
      </Theorem>
      <Proof>
        <p>
          Swapping the two units is a symmetry of the network: it leaves every output, and so the loss, unchanged. Hence the
          loss is symmetric in the two units' weights, and at a point where those weights are equal the partial derivatives
          with respect to them are equal too. A gradient step adds equal amounts to equal numbers, so they remain equal, and by
          induction for every step. Random initialisation exists to break this symmetry.
        </p>
      </Proof>

      <Theorem title="variance through one layer">
        <p>
          Let <M>{"a = \\sum_{i=1}^{n} w_i x_i"}</M> with all <M>{"w_i, x_i"}</M> independent,{" "}
          <M>{"\\mathbb{E}[w_i] = 0"}</M>, <M>{"\\operatorname{Var}(w_i) = \\sigma_w^2"}</M> and{" "}
          <M>{"\\mathbb{E}[x_i^2] = m_2"}</M>. Then <M>{"\\mathbb{E}[a] = 0"}</M> and{" "}
          <M>{"\\operatorname{Var}(a) = n\\,\\sigma_w^2\\, m_2"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          By independence <M>{"\\mathbb{E}[w_i x_i] = \\mathbb{E}[w_i]\\mathbb{E}[x_i] = 0"}</M>, so{" "}
          <M>{"\\operatorname{Var}(w_i x_i) = \\mathbb{E}[w_i^2 x_i^2] = \\sigma_w^2 m_2"}</M>. The n products are independent,
          so their variances add.
        </p>
      </Proof>

      <Definition title="the per-layer gain">
        <p>
          For a linear network with inputs of mean 0, <M>{"m_2"}</M> is the previous layer's variance, so variance is multiplied
          by <M>{"g^2 = n\\sigma_w^2"}</M> at every layer and after L layers by <M>{"g^{2L}"}</M>. The standard deviation is
          multiplied by <M>{"g^L"}</M>:
        </p>
        <MD>{"1.1^{30} \\approx 17.4, \\qquad 0.9^{30} \\approx 0.042, \\qquad 1^{30} = 1."}</MD>
        <p>Variance is preserved exactly when <M>{"\\sigma_w^2 = 1/n"}</M>.</p>
        <Code>{VAR}</Code>
      </Definition>

      <Remark title="the backward pass has a gain too">
        <p>
          Gradients flow back through <M>{"W^\\top"}</M>, whose sums run over the n<sub>out</sub> units of the next layer, so
          backward variance is multiplied by <M>{"n_{\\text{out}}\\sigma_w^2"}</M> per layer. When the layer widths differ, the
          forward and backward conditions ask for different scales. The next lesson resolves the conflict and adds activation
          functions.
        </p>
      </Remark>

      <Example title="measuring instead of deriving">
        <p>
          The calculation assumes independence, which real data and real activations violate. A practical alternative is to
          measure: push one batch through, and rescale each layer's weights in turn so that its output has standard deviation
          exactly 1 on that batch. This data-dependent scheme is known as LSUV.
        </p>
        <Code>{CAL}</Code>
      </Example>
    </>
  ),

  practice: [
    {
      key: "onelayer",
      rung: "check",
      prompt: <p>n = 100 inputs with E[x²] = 1, weights with mean 0 and variance 0.01. What is the variance of the pre-activation?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 1e-9 },
    },
    {
      key: "fifty",
      rung: "check",
      prompt: <p>A linear network has a per-layer gain of 1.1 on the standard deviation. By what factor has the standard deviation grown after 50 layers?</p>,
      answer: { kind: "numeric", value: 117.39085, tolerance: 1e-3 },
    },
    {
      key: "zero",
      rung: "apply",
      prompt: <p>Every weight of a two-layer MLP is initialised to 0.5. What happens during training?</p>,
      answer: {
        kind: "choice",
        options: [
          "The hidden units stay identical to one another, so the layer acts like a single unit",
          "Training proceeds normally because 0.5 is not 0",
          "The gradients are all exactly zero",
          "The units diverge after the first step because of rounding",
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

W1 = np.full((3, 2), 0.5); W2 = np.full((2, 1), 0.5)
x = np.array([[1.0, -2.0, 0.5]])
h = np.tanh(x @ W1)
d = (h @ W2 - 1.0) * W2.T * (1 - h ** 2)
gW1 = x.T @ d
print(np.allclose(gW1[:, 0], gW1[:, 1]), h[0, 0] == h[0, 1])`}</Code>
          <p>One backward pass through a 3-2-1 tanh network whose weights are all 0.5. What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["True True", "False True", "True False", "False False"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def layer_out_var(n_in, w_var, x_m2):
    return n_in * w_var * x_m2

def forward_stds(x, Ws, act=lambda a: a):
    stds = []
    for W in Ws:
        a = x @ W
        stds.append(float(a.std()))
        x = act(a)
    return stds

rng = np.random.default_rng(0)
x = rng.normal(size=(500, 400))
for s in [0.045, 0.05, 0.055]:
    Ws = [rng.normal(0, s, size=(400, 400)) for _ in range(30)]
    print(s, round(forward_stds(x, Ws)[-1], 2))`}</Code>
          <p>Thirty linear layers of width 400 at three weight scales. Which output is closest to what this prints?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.045 0.04\n0.05 0.94\n0.055 17.0",
          "0.045 0.9\n0.05 1.0\n0.055 1.1",
          "0.045 0.0\n0.05 0.0\n0.055 0.0",
          "0.045 0.04\n0.05 0.04\n0.055 0.04",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_out_var(n_in, w_var, x_m2)</C>, the predicted pre-activation variance, and{" "}
          <C>forward_stds(x, Ws, act)</C>, which pushes the batch x through each weight matrix in turn (pre-activation{" "}
          <C>a = x @ W</C>, then <C>x = act(a)</C>) and returns the list of the standard deviations of every a, as floats.{" "}
          <C>act</C> defaults to the identity.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def layer_out_var(n_in, w_var, x_m2):
    return 0.0

def forward_stds(x, Ws, act=lambda a: a):
    return []
`,
        solution: VAR,
        tests: [
          { name: "formula", code: `assert abs(layer_out_var(100, 0.01, 1.0) - 1.0) < 1e-12
assert abs(layer_out_var(256, 2 / 256, 0.5) - 1.0) < 1e-12` },
          { name: "forward", code: `x = np.array([[1.0, -1.0], [2.0, 0.0]])
Ws = [np.array([[1.0, 0.0], [0.0, 2.0]]), np.array([[1.0], [1.0]])]
s = forward_stds(x, Ws)
assert len(s) == 2 and all(isinstance(v, float) for v in s)
assert np.allclose(s, [np.array([1, -2, 2, 0]).std(), np.array([-1, 2]).std()])
s2 = forward_stds(x, Ws, act=lambda a: np.maximum(a, 0))
assert np.allclose(s2, [np.array([1, -2, 2, 0]).std(), np.array([1, 2]).std()])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>calibrate(Ws, x, act)</C>, which returns new weight matrices: going layer by layer, divide each W by the
          standard deviation of <C>x @ W</C>, using as x the batch as it arrives at that layer after the already calibrated
          earlier layers and <C>act</C>. Afterwards every layer's pre-activation has standard deviation 1 on this batch.
        </p>
      ),
      answer: {
        kind: "code",
        setup: VAR,
        starter: `import numpy as np

def calibrate(Ws, x, act=lambda a: a):
    return list(Ws)
`,
        solution: `import numpy as np

${CAL}`,
        tests: [
          { name: "linear", code: `rng = np.random.default_rng(5)
x = rng.normal(size=(64, 20))
Ws = [rng.normal(0, 3.0, size=(20, 20)) for _ in range(6)]
C2 = calibrate(Ws, x)
assert np.allclose(forward_stds(x, C2), 1.0)
assert all(np.allclose(a / np.linalg.norm(a), b / np.linalg.norm(b)) for a, b in zip(Ws, C2))` },
          { name: "with tanh", code: `rng = np.random.default_rng(6)
x = rng.normal(size=(64, 10))
Ws = [rng.normal(0, 0.01, size=(10, 10)) for _ in range(5)]
assert np.allclose(forward_stds(x, calibrate(Ws, x, np.tanh), np.tanh), 1.0)
assert len(calibrate(Ws, x, np.tanh)) == 5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if w₁, …, wₙ, x₁, …, xₙ are independent, each wᵢ has mean 0 and variance σ², and each xᵢ has E[xᵢ²] = m, then Var(Σᵢ wᵢxᵢ) = nσ²m.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Shows E[wᵢxᵢ] = E[wᵢ]E[xᵢ] = 0 by independence, so the sum has mean 0.",
          "Computes Var(wᵢxᵢ) = E[wᵢ²xᵢ²] = E[wᵢ²]E[xᵢ²] = σ²m, using independence and E[wᵢ²] = σ² (mean 0).",
          "Uses independence of the n products (or zero covariances) to add the variances, giving nσ²m.",
        ],
      },
    },
    {
      key: "depth",
      rung: "stretch",
      prompt: <p>With a per-layer gain of 0.9 on the standard deviation, after how many layers does the standard deviation first fall below 0.01? Give the whole number.</p>,
      answer: { kind: "numeric", value: 44 },
    },
  ],

  teachBack:
    "Explain to a friend why every weight must not start at the same value, and why the weight variance should be about 1/n for a deep network.",

  glimpse: (
    <p>
      The 1/n rule ignored the activation function and the backward pass. Next: Xavier and He initialisation, which account
      for both.
    </p>
  ),
};
