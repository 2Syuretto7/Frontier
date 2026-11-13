import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { GradDepthViz } from "@/components/viz/GradDepthViz";
import type { LessonContent } from "@/lib/types";

const NORMS = `import numpy as np

def layer_grad_norms(x, Ws, act, act_grad):
    xs, As = [], []
    for W in Ws:
        xs.append(x)
        a = x @ W
        As.append(a)
        x = act(a)
    g = np.ones_like(x)
    norms = []
    for W, xin, a in zip(Ws[::-1], xs[::-1], As[::-1]):
        d = g * act_grad(a)
        norms.append(float(np.linalg.norm(xin.T @ d)))
        g = d @ W.T
    return norms[::-1]`;

const CLIP = `def clip_by_global_norm(grads, max_norm):
    total = float(np.sqrt(sum(np.sum(g ** 2) for g in grads)))
    scale = min(1.0, max_norm / (total + 1e-12))
    return [g * scale for g in grads], total`;

export const lesson: LessonContent = {
  id: "l3.5.1",
  minutes: 45,
  links: {
    requires: ["l3.4.3", "l3.2.3"],
    revisits: ["l3.4.1", "m5.4.4"],
    foreshadows: ["l3.5.2", "l3.5.3", "l3.8.3"],
  },

  puzzle: (
    <>
      <p>
        In the 1990s, networks with more than a few layers simply would not train, even though a deeper network can
        represent strictly more. The last layers learnt; the first layers stayed almost exactly at their random starting
        values. The loss was fine. The data was fine. What stopped the signal from reaching the bottom?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        Backpropagation multiplies. The gradient reaching layer 1 is the gradient at the top multiplied by one Jacobian per
        layer in between, and each Jacobian contains the activation's slope and a weight matrix. Twenty factors that are each
        a little less than 1 make a very small number; twenty that are a little more than 1 make a very large one. Only
        products that stay near 1 let every layer learn at a similar rate.
      </p>
      <GradDepthViz />
    </>
  ),

  theory: (
    <>
      <Theorem title="the gradient is a product of Jacobians">
        <p>
          Let <M>{"x_\\ell = \\phi(W_\\ell^\\top x_{\\ell-1})"}</M> for <M>{"\\ell = 1, \\dots, L"}</M>, and write{" "}
          <M>{"J_\\ell = \\partial x_\\ell / \\partial x_{\\ell-1} = D_\\ell W_\\ell^\\top"}</M>, where{" "}
          <M>{"D_\\ell = \\operatorname{diag}(\\phi'(a_\\ell))"}</M>. Then
        </p>
        <MD>{"\\frac{\\partial L}{\\partial x_{k}} = J_{k+1}^\\top J_{k+2}^\\top \\cdots J_L^\\top \\,\\frac{\\partial L}{\\partial x_L}, \\qquad \\Big\\|\\frac{\\partial L}{\\partial x_k}\\Big\\| \\le \\prod_{\\ell=k+1}^{L} \\|D_\\ell\\|\\,\\|W_\\ell\\| \\,\\Big\\|\\frac{\\partial L}{\\partial x_L}\\Big\\|."}</MD>
      </Theorem>
      <Proof>
        <p>
          The first identity is the chain rule applied L − k times. For the bound, the operator norm satisfies{" "}
          <M>{"\\|AB\\| \\le \\|A\\|\\|B\\|"}</M> and <M>{"\\|A^\\top\\| = \\|A\\|"}</M>, so the norm of the product is at most
          the product of the norms.
        </p>
      </Proof>

      <Example title="sigmoid vanishes">
        <p>
          <M>{"\\sigma' \\le \\tfrac14"}</M>, so <M>{"\\|D_\\ell\\| \\le \\tfrac14"}</M>. Unless the weights are large, the
          bound shrinks by at least a factor of 4 per layer: <M>{"4^{-10} \\approx 10^{-6}"}</M> after ten layers. This is the
          vanishing gradient problem, and the reason ReLU replaced sigmoid in hidden layers.
        </p>
      </Example>

      <Remark title="different directions, different fates">
        <p>
          The norm bound is only the worst case. Repeated multiplication by the same matrix stretches the component along an
          eigenvector by its eigenvalue at every step, so with <M>{"J = \\operatorname{diag}(2, 0.5)"}</M> one direction grows
          as <M>{"2^L"}</M> while the other shrinks as <M>{"2^{-L}"}</M>. Recurrent networks, which apply the same weights at
          every time step, suffer from exactly this.
        </p>
      </Remark>

      <Definition title="measuring it">
        <p>
          The diagnostic is the norm of each layer's weight gradient on one batch. Healthy networks have norms within an order
          of magnitude or two of each other; a steady slope across layers on a log scale is the signature of the problem.
        </p>
        <Code>{NORMS}</Code>
      </Definition>

      <Definition title="gradient clipping">
        <p>
          Exploding gradients have a blunt but effective fix: if the global norm of all gradients exceeds a threshold c,
          rescale them all by <M>{"c/\\|g\\|"}</M>. The direction of the step is kept; only its length is capped. Vanishing
          gradients have no such fix and need architectural changes: better activations, normalisation and residual
          connections, the rest of this chapter.
        </p>
        <Code>{CLIP}</Code>
      </Definition>
    </>
  ),

  practice: [
    {
      key: "sig10",
      rung: "check",
      prompt: <p>Ten sigmoid layers, each at its steepest point with weights acting as the identity. By what factor is the gradient multiplied? Give a decimal.</p>,
      answer: { kind: "numeric", value: 9.5367431640625e-7, tolerance: 1e-9 },
    },
    {
      key: "eig",
      rung: "check",
      prompt: <p>A recurrent network applies the same Jacobian 20 times, and the gradient lies along an eigenvector with eigenvalue 1.2. By what factor does it grow?</p>,
      answer: { kind: "numeric", value: 38.33759992, tolerance: 1e-4 },
    },
    {
      key: "clipdir",
      rung: "apply",
      prompt: <p>What does clipping by global norm do to the gradient?</p>,
      answer: {
        kind: "choice",
        options: [
          "Rescales it to length c when it is longer, keeping its direction",
          "Clamps each component to [−c, c], which can change the direction",
          "Divides it by its norm on every step",
          "Fixes vanishing gradients by scaling small gradients up",
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

g = np.ones(2)
for J in [np.diag([2.0, 0.5])] * 4:
    g = J.T @ g
print(g)`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["[16.      0.0625]", "[8.  0.125]", "[1.25 1.25]", "[16. 16.]"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def clip_by_global_norm(grads, max_norm):
    total = float(np.sqrt(sum(np.sum(g ** 2) for g in grads)))
    scale = min(1.0, max_norm / (total + 1e-12))
    return [g * scale for g in grads], total

gs, n = clip_by_global_norm([np.array([3.0, 0.0]), np.array([[4.0]])], 1.0)
print(n, gs[0], gs[1])
print(clip_by_global_norm([np.array([0.3, 0.4])], 1.0)[0][0])`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "5.0 [0.6 0. ] [[0.8]]\n[0.3 0.4]",
          "5.0 [1. 0.] [[1.]]\n[0.3 0.4]",
          "7.0 [0.6 0. ] [[0.8]]\n[0.6 0.8]",
          "5.0 [0.6 0. ] [[0.8]]\n[0.6 0.8]",
        ],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>layer_grad_norms(x, Ws, act, act_grad)</C>. The network computes <C>a = x @ W</C> then{" "}
          <C>x = act(a)</C> for each W in turn, and the loss is the sum of the final outputs. Return the list of the Frobenius
          norms of ∂L/∂W for every layer, first layer first, as floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def layer_grad_norms(x, Ws, act, act_grad):
    return [0.0 for W in Ws]
`,
        solution: NORMS,
        tests: [
          { name: "linear", code: `x = np.array([[1.0, 2.0]])
Ws = [np.array([[1.0, 0.0], [0.0, 1.0]]), np.array([[2.0], [3.0]])]
n = layer_grad_norms(x, Ws, lambda a: a, lambda a: np.ones_like(a))
assert np.allclose(n, [np.linalg.norm([[2, 3], [4, 6]]), np.linalg.norm([1, 2])])
assert all(isinstance(v, float) for v in n)` },
          { name: "sigmoid vanishes", code: `sig = lambda a: 1 / (1 + np.exp(-a))
rng = np.random.default_rng(0)
x = rng.normal(size=(8, 16))
Ws = [rng.normal(0, 0.25, size=(16, 16)) for _ in range(8)]
n = layer_grad_norms(x, Ws, sig, lambda a: sig(a) * (1 - sig(a)))
assert len(n) == 8 and n[0] < 1e-3 * n[-1]
W = rng.normal(size=(16, 16)); eps = 1e-6; E = np.zeros_like(W); E[3, 5] = eps
f = lambda Wf: np.sum(np.tanh(np.tanh(x @ Ws[0]) @ Wf))
g = np.tanh(x @ Ws[0]).T @ (1 - np.tanh(np.tanh(x @ Ws[0]) @ W) ** 2)
assert abs(layer_grad_norms(x, [Ws[0], W], np.tanh, lambda a: 1 - np.tanh(a) ** 2)[1] - np.linalg.norm(g)) < 1e-9` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>clip_by_global_norm(grads, max_norm)</C>, taking a list of arrays. Compute the global norm (the square root
          of the sum of squares of every entry), and if it exceeds max_norm scale every array by max_norm / norm. Return{" "}
          <C>(clipped_list, global_norm)</C>, with the norm before clipping as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def clip_by_global_norm(grads, max_norm):
    return [np.clip(g, -max_norm, max_norm) for g in grads], 0.0
`,
        solution: `import numpy as np

${CLIP}`,
        tests: [
          { name: "clips", code: `gs, n = clip_by_global_norm([np.array([3.0, 0.0]), np.array([[4.0]])], 1.0)
assert abs(n - 5.0) < 1e-12 and isinstance(n, float)
assert np.allclose(gs[0], [0.6, 0.0]) and np.allclose(gs[1], [[0.8]])
gs, n = clip_by_global_norm([np.array([30.0, 40.0])], 10.0)
assert np.allclose(gs[0], [6.0, 8.0])` },
          { name: "leaves small alone", code: `g = [np.array([0.3, 0.4]), np.array([0.0])]
gs, n = clip_by_global_norm(g, 1.0)
assert abs(n - 0.5) < 1e-12 and np.allclose(gs[0], [0.3, 0.4]) and np.allclose(gs[1], [0.0])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>Prove that in a network of L sigmoid layers xₗ = σ(Wₗᵀxₗ₋₁) with ‖Wₗ‖ ≤ 1 for every l, ‖∂L/∂x₀‖ ≤ 4⁻ᴸ‖∂L/∂x_L‖.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Writes ∂L/∂x₀ as the product of the transposed layer Jacobians Dₗ Wₗᵀ applied to ∂L/∂x_L (chain rule).",
          "Bounds ‖Dₗ‖ ≤ ¼ because Dₗ is diagonal with entries σ′ ≤ ¼ (e.g. σ′ = σ(1 − σ) ≤ ¼), and ‖Wₗ‖ ≤ 1.",
          "Uses submultiplicativity of the operator norm to multiply the L factors of ¼, giving 4⁻ᴸ.",
        ],
      },
    },
    {
      key: "layers",
      rung: "stretch",
      prompt: <p>Each layer multiplies the gradient by 0.5. How many layers until it is smaller than one millionth of its starting size? Give the smallest whole number.</p>,
      answer: { kind: "numeric", value: 20 },
    },
  ],

  teachBack:
    "Explain to a friend why gradients vanish or explode in deep networks, how to see it in per-layer gradient norms, and why clipping helps one problem but not the other.",

  glimpse: (
    <p>
      If each layer's activations could be put back to a standard scale, the factors would stay near 1 by construction. Next:
      batch, layer and RMS normalisation.
    </p>
  ),
};
