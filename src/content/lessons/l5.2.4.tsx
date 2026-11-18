import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResidualStreamViz } from "@/components/viz/ResidualStreamViz";
import type { LessonContent } from "@/lib/types";

const MLP = `import numpy as np

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def mlp(x, W_in, W_out):
    return gelu(np.asarray(x, float) @ W_in) @ W_out

def swiglu(x, W1, W3, W2):
    x = np.asarray(x, float)
    a = x @ W1
    return (a / (1 + np.exp(-a)) * (x @ W3)) @ W2`;

const STREAM = `import numpy as np

def residual_stack(x, blocks):
    x = np.asarray(x, float)
    writes = []
    for f in blocks:
        w = f(x)
        writes.append(w)
        x = x + w
    return x, writes

def logit_attribution(x0, writes, u):
    parts = [float(np.dot(x0, u))] + [float(np.dot(w, u)) for w in writes]
    return parts

def jacobian_floor(norms):
    out = 1.0
    for n in norms:
        out *= max(0.0, 1 - n)
    return out`;

export const lesson: LessonContent = {
  id: "l5.2.4",
  minutes: 45,
  links: {
    requires: ["l5.2.3"],
    revisits: ["l3.5.3"],
    foreshadows: ["l5.2.5", "l5.6.3"],
  },

  puzzle: (
    <>
      <p>
        Two-thirds of the parameters in a typical transformer are not in attention at all but in plain two-layer MLPs applied
        to each position separately. And no layer ever replaces its input: each one adds something to a running vector that
        flows from the embedding to the output. Why is a model built this way, and what does the additive design let us say
        about where a prediction came from?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Think of the vector at each position as a shared workspace, the residual stream. Attention layers copy information
        into it from other positions; MLP layers read it, look things up, and write the results back, position by position.
        Because every layer adds rather than overwrites, the final vector is just the embedding plus everything every layer
        wrote, and any linear read-out of it, such as the logit of one token, splits into one contribution per layer. The MLP
        itself reads like a memory: each hidden unit checks how well the stream matches its key and, if it matches, adds its
        value.
      </p>
      <ResidualStreamViz />
    </>
  ),

  theory: (
    <>
      <Definition title="the transformer MLP">
        <p>
          The MLP sublayer maps <M>{"x \\in \\mathbb R^d"}</M> to <M>{"W_{\\text{out}}^\\top\\sigma(W_{\\text{in}}^\\top x)"}</M>{" "}
          with hidden width usually 4d and σ the GELU,{" "}
          <M>{"\\operatorname{GELU}(x) \\approx \\tfrac12x(1 + \\tanh(\\sqrt{2/\\pi}(x + 0.044715x^3)))"}</M>. Gated variants
          such as SwiGLU compute <M>{"W_2^\\top(\\operatorname{SiLU}(W_1^\\top x) \\odot W_3^\\top x)"}</M> with three matrices,
          where <M>{"\\operatorname{SiLU}(a) = a/(1+e^{-a})"}</M>.
        </p>
        <Code>{MLP}</Code>
      </Definition>

      <Theorem title="the MLP is a sum of key–value pairs">
        <p>
          Let <M>{"k_j"}</M> be column j of <M>{"W_{\\text{in}}"}</M> and <M>{"v_j"}</M> row j of{" "}
          <M>{"W_{\\text{out}}"}</M>. Then <M>{"\\operatorname{MLP}(x) = \\sum_j\\sigma(k_j^\\top x)\\,v_j"}</M>. With hidden
          width h it has 2dh parameters, which is <M>{"8d^2"}</M> for h = 4d; a SwiGLU layer with hidden width{" "}
          <M>{"8d/3"}</M> has the same count.
        </p>
      </Theorem>
      <Proof>
        <p>
          Entry j of <M>{"\\sigma(W_{\\text{in}}^\\top x)"}</M> is <M>{"\\sigma(k_j^\\top x)"}</M>, and multiplying a row vector of
          coefficients by <M>{"W_{\\text{out}}"}</M> sums its rows with those coefficients. The two matrices have d × h and h × d
          entries. SwiGLU has three such matrices, 3dh entries, which equals <M>{"8d^2"}</M> when h = 8d/3.
        </p>
      </Proof>

      <Definition title="the residual stream">
        <p>
          A transformer with blocks <M>{"f_1, \\dots, f_L"}</M> (each an attention or MLP sublayer, with its normalisation)
          computes <M>{"x_\\ell = x_{\\ell-1} + f_\\ell(x_{\\ell-1})"}</M> from the embedding <M>{"x_0"}</M>. The vector{" "}
          <M>{"w_\\ell = f_\\ell(x_{\\ell-1})"}</M> is block ℓ&apos;s <em>write</em>.
        </p>
        <Code>{STREAM}</Code>
      </Definition>

      <Theorem title="every read-out is a sum of contributions">
        <p>
          <M>{"x_L = x_0 + \\sum_{\\ell=1}^Lw_\\ell"}</M>, so for any vector u,{" "}
          <M>{"u^\\top x_L = u^\\top x_0 + \\sum_\\ell u^\\top w_\\ell"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          Sum the recursion <M>{"x_\\ell - x_{\\ell-1} = w_\\ell"}</M> over ℓ; the left side telescopes to{" "}
          <M>{"x_L - x_0"}</M>. Then use linearity of the dot product. The decomposition is exact but not causal: a block&apos;s
          write depends on what earlier blocks wrote, so removing one changes the others. A final normalisation before the
          unembedding also rescales the sum, which attribution methods usually freeze at its observed value.
        </p>
      </Proof>

      <Theorem title="residual blocks keep the map invertible">
        <p>
          If each block&apos;s Jacobian satisfies <M>{"\\|J_\\ell\\| \\le n_\\ell < 1"}</M>, then the Jacobian of the whole
          stack, <M>{"\\prod_\\ell(I + J_\\ell)"}</M>, has smallest singular value at least <M>{"\\prod_\\ell(1 - n_\\ell)"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          For a unit vector v, <M>{"\\|(I + J)v\\| \\ge \\|v\\| - \\|Jv\\| \\ge 1 - \\|J\\|"}</M> by the triangle inequality, so{" "}
          <M>{"\\sigma_{\\min}(I + J) \\ge 1 - \\|J\\|"}</M>. For a product,{" "}
          <M>{"\\|ABv\\| \\ge \\sigma_{\\min}(A)\\|Bv\\| \\ge \\sigma_{\\min}(A)\\sigma_{\\min}(B)\\|v\\|"}</M>, and induction gives the
          bound. No direction of the input is lost, which complements the identity-path picture of gradients from the earlier
          lesson on residual connections.
        </p>
      </Proof>

      <Remark title="what the stream is used for">
        <p>
          Because writes add, a later block can read a feature that any earlier block wrote, which makes it natural to think of
          the stream as a communication channel with limited width d shared by all layers. Probing studies find MLP layers
          acting as stores of associations, for example from a subject to an attribute, and attention layers moving such
          information to the position where it is needed; the last part of this course returns to this.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "params",
      rung: "check",
      prompt: <p>An MLP with d = 4096 and hidden width 4d has how many million parameters, ignoring biases? Give three decimals.</p>,
      answer: { kind: "numeric", value: 134.218, tolerance: 0.0006 },
    },
    {
      key: "swiglu",
      rung: "check",
      prompt: <p>A SwiGLU layer for d = 3072 should have the same parameter count as a GELU MLP with hidden width 4d. What hidden width does it need?</p>,
      answer: { kind: "numeric", value: 8192, tolerance: 0 },
    },
    {
      key: "stream",
      rung: "apply",
      prompt: <p>Why can a single output logit of a transformer be split into one contribution per block?</p>,
      answer: {
        kind: "choice",
        options: [
          "Each block adds its output to the stream, so the final vector is the embedding plus all writes, and a logit is a linear function of it",
          "Each block computes an independent logit and the model averages them",
          "Attention weights sum to one, so contributions are normalised",
          "The MLP is linear, so the whole network is linear",
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

def gelu(x):
    return 0.5 * x * (1 + np.tanh(np.sqrt(2 / np.pi) * (x + 0.044715 * x ** 3)))

def mlp(x, W_in, W_out):
    return gelu(np.asarray(x, float) @ W_in) @ W_out

def swiglu(x, W1, W3, W2):
    x = np.asarray(x, float)
    a = x @ W1
    return (a / (1 + np.exp(-a)) * (x @ W3)) @ W2

print(round(float(gelu(0.0)), 3), round(float(gelu(10.0)), 3), round(float(gelu(-1.0)), 3), np.round(mlp([1.0, -1.0], np.eye(2), np.ones((2, 1))), 3).tolist())
print(np.round(swiglu([1.0], [[2.0]], [[3.0]], [[1.0]]), 3).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "0.0 10.0 -0.159 [0.682]\n[5.285]",
          "0.0 10.0 0.0 [0.682]\n[5.285]",
          "0.5 10.0 -0.159 [0.682]\n[5.285]",
          "0.0 10.0 -0.159 [1.0]\n[6.0]",
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

def residual_stack(x, blocks):
    x = np.asarray(x, float)
    writes = []
    for f in blocks:
        w = f(x)
        writes.append(w)
        x = x + w
    return x, writes

def logit_attribution(x0, writes, u):
    parts = [float(np.dot(x0, u))] + [float(np.dot(w, u)) for w in writes]
    return parts

def jacobian_floor(norms):
    out = 1.0
    for n in norms:
        out *= max(0.0, 1 - n)
    return out

x, ws = residual_stack(np.array([1.0, 0.0]), [lambda v: np.array([0.0, v[0]]), lambda v: v * 0.5])
print(x.tolist(), [w.tolist() for w in ws], logit_attribution([1.0, 0.0], ws, [1.0, 2.0]), round(jacobian_floor([0.1, 0.2, 1.5]), 3), round(jacobian_floor([0.1, 0.2]), 3))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[1.5, 1.5] [[0.0, 1.0], [0.5, 0.5]] [1.0, 2.0, 1.5] 0.0 0.72",
          "[1.5, 1.5] [[0.0, 1.0], [0.5, 0.0]] [1.0, 2.0, 0.5] 0.0 0.72",
          "[1.0, 1.0] [[0.0, 1.0], [0.5, 0.5]] [1.0, 2.0, 1.5] 0.0 0.72",
          "[1.5, 1.5] [[0.0, 1.0], [0.5, 0.5]] [1.0, 2.0, 1.5] -0.36 0.72",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gelu(x)</C> with the tanh approximation; <C>mlp(x, W_in, W_out)</C>; and{" "}
          <C>swiglu(x, W1, W3, W2)</C>, all acting on the last axis.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def gelu(x):
    return np.maximum(x, 0)

def mlp(x, W_in, W_out):
    return np.asarray(x, float) @ W_in @ W_out

def swiglu(x, W1, W3, W2):
    return np.asarray(x, float) @ W1 @ W2
`,
        solution: MLP,
        tests: [
          { name: "gelu", code: `assert abs(gelu(1.0) - 0.8411919906) < 1e-8 and abs(gelu(-1.0) + 0.1588080094) < 1e-8 and gelu(0.0) == 0.0
assert np.allclose(mlp([1.0, -1.0], np.eye(2), np.ones((2, 1))), [0.8411919906 - 0.1588080094])` },
          { name: "kv", code: `rng = np.random.default_rng(0); x = rng.standard_normal(4); Wi = rng.standard_normal((4, 6)); Wo = rng.standard_normal((6, 4))
assert np.allclose(mlp(x, Wi, Wo), sum(gelu(Wi[:, j] @ x) * Wo[j] for j in range(6)))
W1, W3, W2 = rng.standard_normal((4, 5)), rng.standard_normal((4, 5)), rng.standard_normal((5, 4)); a = x @ W1
assert np.allclose(swiglu(x, W1, W3, W2), (a / (1 + np.exp(-a)) * (x @ W3)) @ W2) and np.allclose(swiglu([1.0], [[2.0]], [[3.0]], [[1.0]]), [6 / (1 + np.exp(-2))])` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>residual_stack(x, blocks)</C>, returning the final stream and the list of writes;{" "}
          <C>logit_attribution(x0, writes, u)</C>, the list of contributions starting with the embedding&apos;s; and{" "}
          <C>jacobian_floor(norms)</C>, the lower bound of the last theorem, using 0 for any factor that would be negative.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def residual_stack(x, blocks):
    for f in blocks:
        x = f(x)
    return x, []

def logit_attribution(x0, writes, u):
    return []

def jacobian_floor(norms):
    return 1.0
`,
        solution: STREAM,
        tests: [
          { name: "stack", code: `x, ws = residual_stack(np.array([1.0, 0.0]), [lambda v: np.array([0.0, v[0]]), lambda v: v * 0.5]); assert np.allclose(x, [1.5, 1.5]) and np.allclose(ws, [[0, 1], [0.5, 0.5]])
rng = np.random.default_rng(2); Ws = [rng.standard_normal((3, 3)) * 0.3 for _ in range(4)]; x0 = rng.standard_normal(3); u = rng.standard_normal(3)
xL, ws = residual_stack(x0, [lambda v, W=W: np.tanh(W @ v) for W in Ws]); assert abs(sum(logit_attribution(x0, ws, u)) - xL @ u) < 1e-12 and len(logit_attribution(x0, ws, u)) == 5` },
          { name: "floor", code: `assert abs(jacobian_floor([0.1, 0.2]) - 0.72) < 1e-12 and jacobian_floor([0.5, 1.5]) == 0.0 and jacobian_floor([]) == 1.0` },
        ],
      },
    },
    {
      key: "deep",
      rung: "stretch",
      prompt: <p>A stack has 24 residual blocks, each with Jacobian norm at most 0.02. What lower bound does the theorem give for the smallest singular value of the whole stack&apos;s Jacobian? Give three decimals.</p>,
      answer: { kind: "numeric", value: 0.616, tolerance: 0.0006 },
    },
  ],

  glimpse: (
    <>
      <p>
        Each block also normalises its input, and where exactly the normalisation sits, before the sublayer or after the
        addition, turns out to decide whether deep transformers train stably. That is the next lesson.
      </p>
    </>
  ),
};
