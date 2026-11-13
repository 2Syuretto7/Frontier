import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { UpdateRatioViz } from "@/components/viz/UpdateRatioViz";
import type { LessonContent } from "@/lib/types";

const STATS = `import numpy as np

def layer_stats(A):
    return {"mean": float(A.mean()), "std": float(A.std()),
            "zero": float(np.mean(A == 0)), "sat": float(np.mean(np.abs(A) > 0.97))}

def collect_stats(x, Ws, act):
    stats = []
    for W in Ws:
        x = act(x @ W)
        stats.append(layer_stats(x))
    return stats`;

const RATIO = `def update_ratios(Ws, grads, lr):
    return [float(lr * np.linalg.norm(g) / np.linalg.norm(W)) for W, g in zip(Ws, grads)]

def flag_layers(ratios, lo=1e-4, hi=1e-2):
    flags = []
    for i, r in enumerate(ratios):
        if r < lo:
            flags.append((i, "too small"))
        elif r > hi:
            flags.append((i, "too large"))
    return flags`;

export const lesson: LessonContent = {
  id: "l3.8.3",
  minutes: 40,
  links: {
    requires: ["l3.8.2", "l3.4.3"],
    revisits: ["l3.5.1", "l3.4.1"],
    foreshadows: ["l3.8.4"],
  },

  puzzle: (
    <>
      <p>
        The loss curve says training has stalled, but a network has dozens of layers and millions of numbers. Is one layer
        dead? Are the activations exploding in the middle? Is the learning rate fine for the last layer but far too small for
        the first? A handful of statistics per layer, printed once every few hundred steps, answers all three.
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        For each layer, record what flows forward (the mean and spread of activations, the fraction that are exactly zero
        or pinned at saturation) and what flows backward (the size of the gradient). The most useful single number compares
        the size of each update with the size of the weights it changes: around one part in a thousand per step is healthy.
      </p>
      <UpdateRatioViz />
    </>
  ),

  theory: (
    <>
      <Definition title="forward statistics">
        <p>
          For each layer's output on a batch: the mean (should stay near 0 for tanh, positive but moderate for ReLU), the
          standard deviation (roughly constant across layers in a healthy network), the fraction of exact zeros (ReLU units
          off; a fraction near 1 means dead units) and the fraction near the limits of a saturating activation.
        </p>
        <Code>{STATS}</Code>
      </Definition>

      <Definition title="the update-to-weight ratio">
        <MD>{"\\rho_\\ell = \\frac{\\|\\Delta W_\\ell\\|}{\\|W_\\ell\\|} = \\frac{\\eta\\,\\|\\nabla_{W_\\ell} L\\|}{\\|W_\\ell\\|} \\text{ for SGD.}"}</MD>
        <p>
          It is the relative change one step makes to a layer. A rule of thumb is <M>{"\\rho \\approx 10^{-3}"}</M>, with
          values below <M>{"10^{-4}"}</M> meaning the layer hardly learns and above <M>{"10^{-2}"}</M> meaning it is being
          overwritten each step. For Adam, use the actual update ΔW rather than the gradient.
        </p>
        <Code>{RATIO}</Code>
      </Definition>

      <Theorem title="ρ is scale-free">
        <p>
          Multiplying the loss by a constant c &gt; 0 and the learning rate by 1/c leaves every <M>{"\\rho_\\ell"}</M>{" "}
          unchanged. It measures the relative effect of training, not raw magnitudes.
        </p>
      </Theorem>
      <Proof>
        <p>
          The gradient of cL is <M>{"c\\nabla L"}</M>, so the update <M>{"(\\eta/c)\\,c\\nabla L = \\eta\\nabla L"}</M> is the
          same, and so is its ratio to the unchanged weights. Contrast this with raw gradient norms, which change with the
          loss's scale, with the batch averaging convention and with the size of the layer: a gradient norm of 0.3 means
          nothing on its own, a ratio of 0.3 means trouble.
        </p>
      </Proof>

      <Example title="a diagnostic routine">
        <p>
          Every few hundred steps, log per layer: activation mean and std, zero and saturated fractions, gradient norm and
          ρ. Then look for a trend across depth (a steady decline in activation std or gradient norm means vanishing), a
          layer that differs from its neighbours (a bug or a bad initialisation there), and changes over time (a dead
          fraction that climbs after a learning-rate spike).
        </p>
      </Example>
    </>
  ),

  practice: [
    {
      key: "ratio",
      rung: "check",
      prompt: <p>SGD with learning rate 0.01; a layer's gradient has norm 0.5 and its weights norm 10. What is the update-to-weight ratio?</p>,
      answer: { kind: "numeric", value: 0.0005, tolerance: 1e-9 },
    },
    {
      key: "decay",
      rung: "check",
      prompt: <p>Activation standard deviation is 1.0 at layer 1 and 0.02 at layer 8, falling by the same factor each layer. What is that factor? Give 3 decimal places.</p>,
      answer: { kind: "numeric", value: 0.572, tolerance: 2e-3 },
    },
    {
      key: "high",
      rung: "apply",
      prompt: <p>One layer's update-to-weight ratio is 0.1 while the others are near 0.001. What is the most likely issue?</p>,
      answer: {
        kind: "choice",
        options: [
          "That layer's weights are being changed by 10% per step: its effective learning rate is far too high",
          "That layer is dead",
          "The network is underfitting",
          "The ratio is scale-free, so this is fine",
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

def layer_stats(A):
    return {"mean": float(A.mean()), "std": float(A.std()),
            "zero": float(np.mean(A == 0)), "sat": float(np.mean(np.abs(A) > 0.97))}

def collect_stats(x, Ws, act):
    stats = []
    for W in Ws:
        x = act(x @ W)
        stats.append(layer_stats(x))
    return stats

A = np.array([[0.0, 0.5, -0.99], [0.0, 1.0, 0.2]])
s = layer_stats(A)
print(round(s["mean"], 3), round(s["zero"], 3), round(s["sat"], 3))
rng = np.random.default_rng(0)
Ws = [rng.normal(0, 3.0, size=(16, 16)) for _ in range(3)]
print([round(d["sat"], 1) for d in collect_stats(rng.normal(size=(64, 16)), Ws, np.tanh)])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.118 0.333 0.333\n[0.9, 0.8, 0.9]", "0.118 0.333 0.167\n[0.9, 0.8, 0.9]", "0.118 0.333 0.333\n[0.0, 0.0, 0.0]", "0.0 0.333 0.333\n[0.9, 0.8, 0.9]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def update_ratios(Ws, grads, lr):
    return [float(lr * np.linalg.norm(g) / np.linalg.norm(W)) for W, g in zip(Ws, grads)]

def flag_layers(ratios, lo=1e-4, hi=1e-2):
    flags = []
    for i, r in enumerate(ratios):
        if r < lo:
            flags.append((i, "too small"))
        elif r > hi:
            flags.append((i, "too large"))
    return flags

Ws = [np.full((2, 2), 1.0), np.full((2, 2), 2.0)]
grads = [np.full((2, 2), 0.005), np.full((2, 2), 30.0)]
r = update_ratios(Ws, grads, 0.01)
print(r, flag_layers(r))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[5e-05, 0.15] [(0, 'too small'), (1, 'too large')]",
          "[5e-05, 0.15] [(1, 'too large')]",
          "[0.005, 15.0] [(0, 'too small'), (1, 'too large')]",
          "[5e-05, 0.15] []",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_stats(A)</C>, returning a dict with float values for <C>"mean"</C>, <C>"std"</C>, <C>"zero"</C> (the
          fraction of entries exactly 0) and <C>"sat"</C> (the fraction with absolute value above 0.97), and{" "}
          <C>collect_stats(x, Ws, act)</C>, which applies <C>x = act(x @ W)</C> for each W and returns the list of each
          layer's output stats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def layer_stats(A):
    return {}

def collect_stats(x, Ws, act):
    return []
`,
        solution: STATS,
        tests: [
          { name: "stats", code: `A = np.array([[0.0, 0.5, -0.99], [0.0, 1.0, 0.2]])
s = layer_stats(A)
assert set(s) == {"mean", "std", "zero", "sat"} and all(isinstance(v, float) for v in s.values())
assert abs(s["mean"] - A.mean()) < 1e-12 and abs(s["std"] - A.std()) < 1e-12
assert abs(s["zero"] - 1 / 3) < 1e-12 and abs(s["sat"] - 1 / 3) < 1e-12` },
          { name: "layers", code: `x = np.array([[1.0, -1.0]])
Ws = [np.eye(2), np.array([[2.0, 0.0], [0.0, 2.0]])]
st = collect_stats(x, Ws, lambda a: np.maximum(a, 0))
assert len(st) == 2 and abs(st[0]["zero"] - 0.5) < 1e-12 and abs(st[1]["mean"] - 1.0) < 1e-12
rng = np.random.default_rng(0)
st = collect_stats(rng.normal(size=(64, 16)), [rng.normal(0, 3.0, size=(16, 16)) for _ in range(3)], np.tanh)
assert all(d["sat"] > 0.6 for d in st)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>update_ratios(Ws, grads, lr)</C>, the list of <M>{"\\eta\\|g\\|/\\|W\\|"}</M> (Frobenius norms) as floats,
          and <C>flag_layers(ratios, lo=1e-4, hi=1e-2)</C>, returning a list of <C>(index, "too small")</C> for ratios below
          lo and <C>(index, "too large")</C> for ratios above hi, in layer order.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def update_ratios(Ws, grads, lr):
    return [0.0 for W in Ws]

def flag_layers(ratios, lo=1e-4, hi=1e-2):
    return []
`,
        solution: `import numpy as np

${RATIO}`,
        tests: [
          { name: "ratios", code: `Ws = [np.full((2, 2), 1.0), np.full((2, 2), 2.0)]
grads = [np.full((2, 2), 0.005), np.full((2, 2), 30.0)]
r = update_ratios(Ws, grads, 0.01)
assert np.allclose(r, [5e-5, 0.15]) and all(isinstance(v, float) for v in r)` },
          { name: "flags", code: `assert flag_layers([5e-5, 0.15]) == [(0, "too small"), (1, "too large")]
assert flag_layers([1e-3, 2e-3, 5e-3]) == []
assert flag_layers([1e-3, 0.5, 1e-6], lo=1e-5, hi=0.1) == [(1, "too large"), (2, "too small")]` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that scaling the loss by c &gt; 0 and the SGD learning rate by 1/c leaves every layer's update-to-weight ratio unchanged.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Notes the gradient of cL is c∇L by linearity of differentiation.",
          "Shows the update (η/c)(c∇L) equals the original η∇L.",
          "Concludes ‖ΔW‖/‖W‖ is unchanged since the weights are the same.",
        ],
      },
    },
    {
      key: "steps",
      rung: "stretch",
      prompt: <p>If every step changes a layer's weights by a fraction 10⁻³ in the same direction, by roughly what factor have the weights changed after 1000 steps? Give 3 decimal places.</p>,
      answer: { kind: "numeric", value: 2.7169239, tolerance: 1e-3 },
    },
  ],

  teachBack:
    "Explain to a friend which per-layer statistics to log, what healthy values look like, and why the update-to-weight ratio is the most useful single number.",

  glimpse: (
    <p>
      Statistics show what a network is doing. To learn which parts of a design actually matter, you have to take them away
      one at a time. Next: ablations.
    </p>
  ),
};
