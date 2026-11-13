import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { InitHistViz } from "@/components/viz/InitHistViz";
import type { LessonContent } from "@/lib/types";

const INIT = `import numpy as np

def xavier_uniform(n_in, n_out, rng):
    lim = np.sqrt(6 / (n_in + n_out))
    return rng.uniform(-lim, lim, size=(n_in, n_out))

def he_normal(n_in, n_out, rng):
    return rng.normal(0, np.sqrt(2 / n_in), size=(n_in, n_out))`;

const GAIN = `def act_second_moment(act):
    z = np.linspace(-10, 10, 200001)
    pdf = np.exp(-z ** 2 / 2) / np.sqrt(2 * np.pi)
    return float(np.sum(act(z) ** 2 * pdf) * (z[1] - z[0]))

def gain(act):
    return 1 / np.sqrt(act_second_moment(act))`;

export const lesson: LessonContent = {
  id: "l3.4.2",
  minutes: 45,
  links: {
    requires: ["l3.4.1", "l3.1.3"],
    revisits: ["e5.3.4"],
    foreshadows: ["l3.4.3", "l3.5.2"],
  },

  puzzle: (
    <>
      <p>
        The last lesson's rule, weight variance 1/n, keeps a linear network's signal steady. Put a ReLU after every layer and
        the same rule makes the signal shrink by a factor of √2 per layer: after twenty layers it is a thousand times smaller.
        Nothing about the weights changed. What did the ReLU take away, and how much should be given back?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        ReLU sets the negative half of a symmetric pre-activation to 0. The surviving half carries exactly half of the second
        moment, so each layer loses a factor of 2 in variance. He initialisation doubles the weight variance to put it back.
        Xavier initialisation, designed for activations that behave like the identity near 0, instead balances the forward and
        backward passes when layer widths differ.
      </p>
      <InitHistViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="ReLU halves the second moment">
        <p>
          If a is symmetric about 0 (for example <M>{"a \\sim \\mathcal{N}(0, v)"}</M>), then{" "}
          <M>{"\\mathbb{E}[\\operatorname{relu}(a)^2] = \\tfrac12 \\mathbb{E}[a^2] = \\tfrac{v}{2}"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          <M>{"\\operatorname{relu}(a)^2 = a^2 [a > 0]"}</M>. By symmetry a and −a have the same distribution, so{" "}
          <M>{"\\mathbb{E}[a^2[a > 0]] = \\mathbb{E}[a^2[a < 0]]"}</M>, and the two add up to{" "}
          <M>{"\\mathbb{E}[a^2]"}</M> (the event a = 0 contributes nothing). Each is therefore half.
        </p>
      </Proof>

      <Definition title="He initialisation">
        <p>
          The next layer's pre-activation has variance <M>{"n_{\\text{in}}\\sigma_w^2 \\cdot \\tfrac{v}{2}"}</M>. Setting this
          equal to v gives
        </p>
        <MD>{"\\sigma_w^2 = \\frac{2}{n_{\\text{in}}}."}</MD>
      </Definition>

      <Definition title="Xavier (Glorot) initialisation">
        <p>
          For an activation with slope 1 at 0, the forward pass wants <M>{"\\sigma_w^2 = 1/n_{\\text{in}}"}</M> and the
          backward pass wants <M>{"1/n_{\\text{out}}"}</M>. Xavier takes the harmonic compromise
        </p>
        <MD>{"\\sigma_w^2 = \\frac{2}{n_{\\text{in}} + n_{\\text{out}}}."}</MD>
        <p>
          A uniform distribution on [−b, b] has variance <M>{"b^2/3"}</M>, so the uniform version uses{" "}
          <M>{"b = \\sqrt{6/(n_{\\text{in}} + n_{\\text{out}})}"}</M>.
        </p>
        <Code>{INIT}</Code>
      </Definition>

      <Remark title="a gain for any activation">
        <p>
          Both rules are special cases of <M>{"\\sigma_w = g/\\sqrt{n_{\\text{in}}}"}</M>, where the gain g undoes the
          activation's effect on the second moment: <M>{"g = 1/\\sqrt{\\mathbb{E}[\\phi(z)^2]}"}</M> for{" "}
          <M>{"z \\sim \\mathcal{N}(0, 1)"}</M>. For ReLU that is √2. For tanh it is about 1.59; libraries use the rounder 5/3.
          The integral is one dimensional, so it can simply be computed.
        </p>
        <Code>{GAIN}</Code>
      </Remark>

      <Example title="which one to use">
        <p>
          ReLU, GELU, SiLU and their relatives: He. tanh, sigmoid-like and linear layers: Xavier. With normalisation layers
          (chapter 5) the choice matters much less, because the network rescales its own activations.
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "he",
      rung: "check",
      prompt: <p>What standard deviation does He initialisation use for a layer with 512 inputs?</p>,
      answer: { kind: "numeric", value: 0.0625, tolerance: 1e-9 },
    },
    {
      key: "xu",
      rung: "check",
      prompt: <p>Xavier uniform initialisation for a 300 → 100 layer draws from [−b, b]. What is b?</p>,
      answer: { kind: "numeric", value: 0.12247449, tolerance: 1e-5 },
    },
    {
      key: "why2",
      rung: "apply",
      prompt: <p>Why does He initialisation have a 2 in the numerator?</p>,
      answer: {
        kind: "choice",
        options: [
          "ReLU zeroes the negative half, halving the second moment, and the 2 restores it",
          "To balance the forward and backward passes",
          "Because ReLU's slope is 2 for positive inputs",
          "Because weights are drawn from a uniform distribution",
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

rng = np.random.default_rng(0)
a = rng.normal(0, 3.0, size=1_000_000)
print(round(np.mean(np.maximum(a, 0) ** 2), 1), round(a.var() / 2, 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["4.5 4.5", "9.0 4.5", "3.0 4.5", "1.5 4.5"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def xavier_uniform(n_in, n_out, rng):
    lim = np.sqrt(6 / (n_in + n_out))
    return rng.uniform(-lim, lim, size=(n_in, n_out))

def he_normal(n_in, n_out, rng):
    return rng.normal(0, np.sqrt(2 / n_in), size=(n_in, n_out))

rng = np.random.default_rng(0)
W = xavier_uniform(300, 100, rng)
print(W.shape, round(W.max(), 2), round(W.std(), 3))
x = rng.normal(size=(1000, 300))
for _ in range(10):
    x = np.maximum(x @ he_normal(x.shape[1], 300, rng), 0)
print(round(float(np.sqrt(np.mean(x ** 2))), 1))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "(300, 100) 0.12 0.07\n1.0",
          "(300, 100) 0.12 0.122\n1.0",
          "(300, 100) 0.12 0.07\n0.0",
          "(100, 300) 0.12 0.07\n1.0",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>xavier_uniform(n_in, n_out, rng)</C> and <C>he_normal(n_in, n_out, rng)</C>, each returning an (n_in,
          n_out) weight matrix drawn with the NumPy generator <C>rng</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def xavier_uniform(n_in, n_out, rng):
    return rng.normal(0, 1, size=(n_in, n_out))

def he_normal(n_in, n_out, rng):
    return rng.normal(0, 1, size=(n_in, n_out))
`,
        solution: INIT,
        tests: [
          { name: "xavier", code: `W = xavier_uniform(400, 200, np.random.default_rng(0))
b = np.sqrt(6 / 600)
assert W.shape == (400, 200) and W.max() <= b and W.min() >= -b and W.max() > 0.99 * b
assert abs(W.std() - np.sqrt(2 / 600)) < 0.002` },
          { name: "he", code: `W = he_normal(500, 300, np.random.default_rng(1))
assert W.shape == (500, 300) and abs(W.std() - np.sqrt(2 / 500)) < 0.001 and abs(W.mean()) < 0.001
rng = np.random.default_rng(2)
x = rng.normal(size=(500, 256))
for _ in range(12):
    x = np.maximum(x @ he_normal(256, 256, rng), 0)
assert 0.5 < np.sqrt(np.mean(x ** 2)) < 2` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>act_second_moment(act)</C>, which computes <M>{"\\mathbb{E}[\\phi(z)^2]"}</M> for{" "}
          <M>{"z \\sim \\mathcal{N}(0, 1)"}</M> as a float by summing over a fine grid on [−10, 10], and <C>gain(act)</C>,
          which returns <M>{"1/\\sqrt{\\mathbb{E}[\\phi(z)^2]}"}</M>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def act_second_moment(act):
    return 1.0

def gain(act):
    return 1.0
`,
        solution: `import numpy as np

${GAIN}`,
        tests: [
          { name: "known gains", code: `assert abs(act_second_moment(lambda z: z) - 1) < 1e-6
assert abs(gain(lambda z: np.maximum(z, 0)) - np.sqrt(2)) < 1e-6
assert abs(gain(lambda z: 2 * z) - 0.5) < 1e-6
assert isinstance(act_second_moment(np.tanh), float)` },
          { name: "tanh", code: `assert abs(gain(np.tanh) - 1.5925374) < 1e-5
assert abs(act_second_moment(lambda z: z ** 2) - 3) < 1e-5` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that if a is symmetric about 0, then E[relu(a)²] = ½E[a²], and deduce the He variance for a ReLU layer.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes relu(a)² = a²·[a > 0] and uses symmetry to show E[a²[a > 0]] = E[a²[a < 0]].",
          "Adds the two to get E[a²] (noting a = 0 contributes nothing), so each is ½E[a²].",
          "Deduces the next pre-activation variance is n·σ_w²·½v and setting it to v gives σ_w² = 2/n.",
        ],
      },
    },
    {
      key: "lim",
      rung: "stretch",
      prompt: <p>He initialisation with a uniform distribution on [−b, b] for a layer with 600 inputs: what is b?</p>,
      answer: { kind: "numeric", value: 0.1, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend where the 2 in He initialisation comes from, what Xavier balances, and how to find the right gain for any activation.",

  glimpse: (
    <p>
      Even a well-scaled network can lose units: a ReLU that is negative on every input never recovers, and a tanh pushed to
      ±1 has almost no slope. Next: dead units and saturation.
    </p>
  ),
};
