import { M, MD } from "@/components/Math";
import { Definition, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ChainBoundViz } from "@/components/viz/ChainBoundViz";
import type { LessonContent } from "@/lib/types";

const LAYER = `import numpy as np

def rms(v):
    return float(np.sqrt(np.mean(np.square(v))))

def rms_op_norm(W):
    W = np.asarray(W, float)
    return float(np.sqrt(W.shape[1] / W.shape[0]) * np.linalg.norm(W, 2))

def linear_step(G, eta):
    U, s, Vt = np.linalg.svd(np.asarray(G, float), full_matrices=False)
    n_out, n_in = np.shape(G)
    return -eta * np.sqrt(n_out / n_in) * U @ Vt`;

const CHAIN = `import numpy as np

def chain_output(Ws, x):
    for W in Ws:
        x = W @ x
    return x

def chain_change(Ws, dWs, x):
    new = chain_output([W + D for W, D in zip(Ws, dWs)], x)
    old = chain_output(Ws, x)
    return float(np.sqrt(np.mean((new - old) ** 2)) / np.sqrt(np.mean(np.square(x))))

def chain_bound(eps):
    return float(np.prod([1 + e for e in eps]) - 1)`;

export const lesson: LessonContent = {
  id: "m14.3.5",
  minutes: 45,
  links: {
    requires: ["m14.3.4"],
    revisits: ["m14.1.4", "m14.3.1"],
    foreshadows: ["m14.6.4"],
  },

  puzzle: (
    <>
      <p>
        A team tunes the learning rate on a model 256 units wide and then trains the same architecture at width 4096. With
        SGD the old learning rate blows the wide model up; with Adam it is merely wrong; with a properly normalised
        update it works unchanged. What property of an update makes its learning rate mean the same thing at every width
        and in every layer, and can it be guaranteed rather than hoped for?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A learning rate should say how much the network&apos;s output may change in one step. Give each layer a norm that
        bounds how much its own output can move, measured in RMS units so that width does not inflate it; then a network
        built by composing layers has an output change bounded by the layers&apos; changes added up, to first order.
        Asking for steepest descent with each layer&apos;s change capped at its share of a total budget splits into
        separate problems, one per layer, each solved by that layer&apos;s own steepest direction. The step that results
        moves the output by at most about the learning rate, however wide or deep the network.
      </p>
      <ChainBoundViz />
    </>
  ),

  theory: (
    <>
      <Definition title="RMS operator norm and modular combination">
        <p>
          For W of size <M>{"n_{\\text{out}} \\times n_{\\text{in}}"}</M>, with <M>{"\\|v\\|_{\\text{RMS}} = \\|v\\|/\\sqrt{\\dim v}"}</M>,
          the induced norm is{" "}
          <M>{"\\|W\\|_{\\text{RMS}\\to\\text{RMS}} = \\sqrt{n_{\\text{in}}/n_{\\text{out}}}\\,\\|W\\|_2"}</M>. For a network with
          parameter blocks <M>{"W_1, \\dots, W_L"}</M>, layer norms <M>{"\\|\\cdot\\|_l"}</M> and positive shares{" "}
          <M>{"\\mu_l"}</M>, the combined norm is{" "}
          <M>{"\\|(\\Delta_1, \\dots, \\Delta_L)\\| = \\max_l \\|\\Delta_l\\|_l/\\mu_l"}</M>.
        </p>
      </Definition>

      <Theorem title="steepest descent splits by layer">
        <p>
          Under the combined norm, the steepest descent direction for gradients <M>{"(G_1, \\dots, G_L)"}</M> is{" "}
          <M>{"D_l = \\mu_l d_l^*"}</M>, where <M>{"d_l^*"}</M> is the steepest direction of layer l in its own norm, and the
          dual norm is <M>{"\\sum_l\\mu_l\\|G_l\\|_{l,*}"}</M>. For a linear layer in the RMS operator norm,{" "}
          <M>{"d^* = -\\sqrt{n_{\\text{out}}/n_{\\text{in}}}\\,UV^\\top"}</M>.
        </p>
      </Theorem>
      <Proof>
        <p>
          The constraint <M>{"\\max_l\\|D_l\\|_l/\\mu_l \\le 1"}</M> is the same as <M>{"\\|D_l\\|_l \\le \\mu_l"}</M> for every
          l separately, and the objective <M>{"\\sum_l\\langle G_l, D_l\\rangle"}</M> is a sum of terms each involving one
          block. So each block is minimised on its own, giving <M>{"\\mu_l d_l^*"}</M> and value{" "}
          <M>{"-\\mu_l\\|G_l\\|_{l,*}"}</M>. For the linear layer, the constraint{" "}
          <M>{"\\sqrt{n_{\\text{in}}/n_{\\text{out}}}\\|D\\|_2 \\le 1"}</M> is a spectral-norm ball of radius{" "}
          <M>{"\\sqrt{n_{\\text{out}}/n_{\\text{in}}}"}</M>, and the previous lesson&apos;s theorem gives the minimiser.
        </p>
        <Code>{LAYER}</Code>
      </Proof>

      <Theorem title="the chain bound">
        <p>
          Let <M>{"f(x) = W_L\\cdots W_1x"}</M> with every <M>{"\\|W_l\\| \\le 1"}</M> in the RMS operator norm, and perturb
          each layer by <M>{"\\Delta_l"}</M> with <M>{"\\|\\Delta_l\\| \\le \\varepsilon_l"}</M>. Then
        </p>
        <MD>{"\\|f_{W+\\Delta}(x) - f_W(x)\\|_{\\text{RMS}} \\le \\Big(\\prod_l(1+\\varepsilon_l) - 1\\Big)\\|x\\|_{\\text{RMS}} = \\Big(\\sum_l\\varepsilon_l + O(\\varepsilon^2)\\Big)\\|x\\|_{\\text{RMS}}."}</MD>
      </Theorem>
      <Proof>
        <p>
          Let <M>{"y_l"}</M> and <M>{"y'_l"}</M> be the outputs of layer l before and after the perturbation, and{" "}
          <M>{"e_l = \\|y'_l - y_l\\|"}</M> (all norms RMS). Then{" "}
          <M>{"y'_l - y_l = (W_l+\\Delta_l)(y'_{l-1} - y_{l-1}) + \\Delta_ly_{l-1}"}</M>, and since{" "}
          <M>{"\\|y_{l-1}\\| \\le \\|x\\|"}</M>, <M>{"e_l \\le (1+\\varepsilon_l)e_{l-1} + \\varepsilon_l\\|x\\|"}</M>. Adding{" "}
          <M>{"\\|x\\|"}</M> to both sides gives <M>{"e_l + \\|x\\| \\le (1+\\varepsilon_l)(e_{l-1} + \\|x\\|)"}</M>, and with{" "}
          <M>{"e_0 = 0"}</M> induction gives the bound. All perturbations equal to <M>{"\\varepsilon I"}</M> with{" "}
          <M>{"W_l = I"}</M> attain it, so it cannot be improved in general.
        </p>
        <Code>{CHAIN}</Code>
      </Proof>

      <Remark title="why the learning rate transfers">
        <p>
          Take shares <M>{"\\mu_l = 1/L"}</M> and a step of size η in the combined norm. The chain bound limits the output
          change to <M>{"(1+\\eta/L)^L - 1 \\le e^\\eta - 1"}</M>, whatever the width and depth, so a learning rate tuned on
          a small model means the same on a large one. Compare a raw SGD step on one layer with rank-one gradient{" "}
          <M>{"G = \\delta x^\\top"}</M>: it changes the output by <M>{"-\\eta\\delta\\|x\\|^2"}</M>, whose RMS grows in
          proportion to the width n when x has entries of size 1. That is the effect the parametrisations of the µP family
          remove by rescaling learning rates with width, and which a normalised update avoids by construction. Real layers
          have nonlinearities between them, which need to be 1-Lipschitz in RMS terms for the bound to carry over; most
          common activations and normalisation layers are close to that.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "op",
      rung: "check",
      prompt: <p>A weight matrix maps 4096 inputs to 1024 outputs and has spectral norm 3. What is its RMS-to-RMS operator norm?</p>,
      answer: { kind: "numeric", value: 6, tolerance: 0.0001 },
    },
    {
      key: "bound",
      rung: "check",
      prompt: <p>Ten layers each move by ε = 0.05 in the RMS operator norm. What is the chain bound on the relative output change? Give two decimals.</p>,
      answer: { kind: "numeric", value: 0.63, tolerance: 0.006 },
    },
    {
      key: "split",
      rung: "apply",
      prompt: <p>Why is steepest descent under a norm that takes the maximum over layers so easy to compute?</p>,
      answer: {
        kind: "choice",
        options: [
          "The constraint separates into one budget per layer and the objective is a sum over layers, so each layer solves its own steepest descent problem",
          "Because the maximum is attained at a single layer, only that layer is updated",
          "Because the maximum of norms is always the Euclidean norm",
          "It is not easy: it needs a joint eigendecomposition of all layers",
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

def rms(v):
    return float(np.sqrt(np.mean(np.square(v))))

def rms_op_norm(W):
    W = np.asarray(W, float)
    return float(np.sqrt(W.shape[1] / W.shape[0]) * np.linalg.norm(W, 2))

def linear_step(G, eta):
    U, s, Vt = np.linalg.svd(np.asarray(G, float), full_matrices=False)
    n_out, n_in = np.shape(G)
    return -eta * np.sqrt(n_out / n_in) * U @ Vt

W = np.array([[2.0, 0.0, 0.0, 0.0], [0.0, 1.0, 0.0, 0.0]])
print(rms_op_norm(W), rms_op_norm(np.eye(3)), round(rms([3.0, 4.0]), 4))
D = linear_step(np.array([[3.0, 0.0], [0.0, 1.0], [0.0, 0.0], [0.0, 0.0]]), 0.1)
print(D.round(4).tolist(), round(rms_op_norm(D), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "2.8284271247461903 1.0 3.5355\n[[-0.1414, 0.0], [0.0, -0.1414], [0.0, 0.0], [0.0, 0.0]] 0.1",
          "1.4142135623730951 1.0 3.5355\n[[-0.1414, 0.0], [0.0, -0.1414], [0.0, 0.0], [0.0, 0.0]] 0.1",
          "2.8284271247461903 1.0 5.0\n[[-0.1414, 0.0], [0.0, -0.1414], [0.0, 0.0], [0.0, 0.0]] 0.1",
          "2.8284271247461903 1.0 3.5355\n[[-0.1, 0.0], [0.0, -0.1], [0.0, 0.0], [0.0, 0.0]] 0.0707",
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

def chain_output(Ws, x):
    for W in Ws:
        x = W @ x
    return x

def chain_change(Ws, dWs, x):
    new = chain_output([W + D for W, D in zip(Ws, dWs)], x)
    old = chain_output(Ws, x)
    return float(np.sqrt(np.mean((new - old) ** 2)) / np.sqrt(np.mean(np.square(x))))

def chain_bound(eps):
    return float(np.prod([1 + e for e in eps]) - 1)

Ws = [np.eye(2), np.eye(2)]
print(round(chain_change(Ws, [0.1 * np.eye(2)] * 2, np.ones(2)), 4), round(chain_bound([0.1, 0.1]), 4), round(chain_change(Ws, [0.1 * np.eye(2), -0.1 * np.eye(2)], np.ones(2)), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["0.21 0.21 0.01", "0.2 0.21 0.0", "0.21 0.2 0.01", "0.21 0.21 0.2"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>rms(v)</C>; <C>rms_op_norm(W)</C>, the RMS-to-RMS operator norm of a matrix of shape (n_out, n_in); and{" "}
          <C>linear_step(G, eta)</C>, the steepest descent step of size eta in that norm for gradient G.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def rms(v):
    return float(np.linalg.norm(v))

def rms_op_norm(W):
    return float(np.linalg.norm(W, 2))

def linear_step(G, eta):
    return -eta * np.asarray(G, float)
`,
        solution: LAYER,
        tests: [
          { name: "norms", code: `assert abs(rms([3.0, 4.0]) - np.sqrt(12.5)) < 1e-12 and abs(rms_op_norm(np.array([[2.0, 0, 0, 0], [0, 1.0, 0, 0]])) - 2 * np.sqrt(2)) < 1e-12
rng = np.random.default_rng(0); W = rng.standard_normal((5, 8)); x = rng.standard_normal(8)
assert rms(W @ x) <= rms_op_norm(W) * rms(x) + 1e-12` },
          { name: "step", code: `rng = np.random.default_rng(1); G = rng.standard_normal((6, 3)); D = linear_step(G, 0.2); s = np.linalg.svd(G, compute_uv=False)
assert abs(rms_op_norm(D) - 0.2) < 1e-9 and abs(np.sum(G * D) + 0.2 * np.sqrt(2) * s.sum()) < 1e-9
for _ in range(20):
    E = rng.standard_normal((6, 3)); E *= 0.2 / rms_op_norm(E); assert np.sum(G * E) >= np.sum(G * D) - 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>chain_output(Ws, x)</C>, applying the matrices in order; <C>chain_change(Ws, dWs, x)</C>, the RMS of the
          output change divided by the RMS of x; and <C>chain_bound(eps)</C>, equal to <C>Π(1 + εₗ) − 1</C>.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def chain_output(Ws, x):
    return x

def chain_change(Ws, dWs, x):
    return 0.0

def chain_bound(eps):
    return float(sum(eps))
`,
        solution: CHAIN,
        tests: [
          { name: "aligned", code: `Ws = [np.eye(3)] * 4; assert np.allclose(chain_output([2 * np.eye(2), np.array([[0.0, 1.0], [1.0, 0.0]])], np.array([1.0, 3.0])), [6, 2])
assert abs(chain_change(Ws, [0.1 * np.eye(3)] * 4, np.ones(3)) - chain_bound([0.1] * 4)) < 1e-12 and abs(chain_bound([0.1, 0.2]) - 0.32) < 1e-12` },
          { name: "random", code: `rng = np.random.default_rng(2); n = 10
Ws = [np.linalg.qr(rng.standard_normal((n, n)))[0] for _ in range(5)]
for e in [0.01, 0.3]:
    dWs = [e * np.linalg.qr(rng.standard_normal((n, n)))[0] for _ in range(5)]
    c = chain_change(Ws, dWs, rng.standard_normal(n)); assert 0 < c <= chain_bound([e] * 5) + 1e-12` },
        ],
      },
    },
    {
      key: "sgd",
      rung: "stretch",
      prompt: (
        <p>
          A layer of width n = 4096 receives x with entries ±1 and a rank-one gradient δxᵀ with δ of RMS 0.01. What is the
          RMS of the output change −ηδ‖x‖² after one SGD step with η = 0.01? Give two decimals.
        </p>
      ),
      answer: { kind: "numeric", value: 0.41, tolerance: 0.006 },
    },
  ],

  glimpse: (
    <>
      <p>
        The optimiser now fixes the direction and the size of each step. What remains is how the size should change over
        a run. The next chapter starts at the beginning, with warmup, and asks why the first few hundred steps need a
        smaller learning rate than the rest.
      </p>
    </>
  ),
};
