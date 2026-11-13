import { M, MD } from "@/components/Math";
import { Definition, Example, Remark, Theorem, Proof } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { ResidualPathsViz } from "@/components/viz/ResidualPathsViz";
import type { LessonContent } from "@/lib/types";

const GRAD = `import numpy as np

def input_grad_norm(x, Ws, residual):
    xs = []
    for W in Ws:
        xs.append(x)
        x = (x if residual else 0) + np.tanh(x @ W)
    g = np.ones_like(x)
    for W, xin in zip(Ws[::-1], xs[::-1]):
        d = g * (1 - np.tanh(xin @ W) ** 2)
        g = (g if residual else 0) + d @ W.T
    return float(np.linalg.norm(g))`;

const RESMLP = `def init_residual_mlp(d, hidden, L, rng):
    return [(rng.normal(0, np.sqrt(2 / d), size=(d, hidden)), np.zeros((hidden, d))) for _ in range(L)]

def residual_mlp(x, blocks):
    for W1, W2 in blocks:
        x = x + np.maximum(x @ W1, 0) @ W2
    return x`;

export const lesson: LessonContent = {
  id: "l3.5.3",
  minutes: 45,
  links: {
    requires: ["l3.5.2", "l3.2.1"],
    revisits: ["l3.5.1"],
    foreshadows: ["l3.8.4"],
  },

  puzzle: (
    <>
      <p>
        In 2015 a 56-layer network had higher <em>training</em> error than a 20-layer one built the same way. That is
        strange: the deeper network could copy the shallow one and set its extra 36 layers to the identity. Gradient descent
        simply could not find that solution. What if the identity were the default, and each layer only had to learn a
        correction to it?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A residual block computes <M>{"x + F(x)"}</M>. If F is 0, the block is the identity, so extra blocks cost nothing.
        On the backward pass, the derivative of <M>{"x + F(x)"}</M> is <M>{"I + J_F"}</M>: the identity term carries the
        gradient straight down, however small <M>{"J_F"}</M> is. Multiplying these sums out shows the gradient travelling along
        many paths of different lengths at once.
      </p>
      <ResidualPathsViz />
    </>
  ),

  theory: (
    <>
      <Definition title="residual block">
        <p>
          <M>{"x_{\\ell+1} = x_\\ell + F_\\ell(x_\\ell)"}</M>, where the branch <M>{"F_\\ell"}</M> is a small network, such as
          linear, ReLU, linear, often with a normalisation at its start (pre-norm). The input and output must have the same
          shape; when they do not, the skip path uses a linear projection.
        </p>
      </Definition>

      <Theorem title="the identity path">
        <p>With <M>{"J_\\ell = \\partial F_\\ell / \\partial x_\\ell"}</M>,</p>
        <MD>{"\\frac{\\partial L}{\\partial x_0} = \\Big(\\prod_{\\ell=1}^{L} (I + J_\\ell)\\Big)^{\\!\\top} \\frac{\\partial L}{\\partial x_L} = \\frac{\\partial L}{\\partial x_L} + \\sum_{\\varnothing \\ne S \\subseteq \\{1..L\\}} \\Big(\\prod_{\\ell \\in S} J_\\ell\\Big)^{\\!\\top} \\frac{\\partial L}{\\partial x_L},"}</MD>
        <p>where each product is taken in layer order. The first term reaches <M>{"x_0"}</M> unchanged.</p>
      </Theorem>
      <Proof>
        <p>
          The Jacobian of block ℓ is <M>{"I + J_\\ell"}</M>, and the chain rule multiplies them. Expanding a product of L sums
          of two terms chooses, for each factor, either I or <M>{"J_\\ell"}</M>; each choice is a subset S of blocks, and the
          I factors disappear. The empty subset gives the identity term. This is the path sum of chapter 2, on a graph where
          every block offers two edges.
        </p>
      </Proof>

      <Example title="plain against residual">
        <p>
          If each layer's Jacobian were the scalar 0.1, ten plain layers would multiply the gradient by{" "}
          <M>{"10^{-10}"}</M>. Ten residual blocks with the same branches multiply it by <M>{"1.1^{10} \\approx 2.59"}</M>.
        </p>
        <Code>{GRAD}</Code>
      </Example>

      <Remark title="the forward variance grows">
        <p>
          If the branch output is roughly independent of x with variance v, then{" "}
          <M>{"\\operatorname{Var}(x_{\\ell+1}) = \\operatorname{Var}(x_\\ell) + v"}</M>, so activations grow linearly with
          depth. Pre-norm blocks normalise the input of each branch, not the sum, and a final normalisation at the end of the
          network takes care of the rest. Scaling each branch by a small constant, or initialising its last layer to 0, makes
          every block start as the identity.
        </p>
        <Code>{RESMLP}</Code>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "paths",
      rung: "check",
      prompt: <p>How many paths from input to output does a network of 10 residual blocks have, counting every subset of branches?</p>,
      answer: { kind: "numeric", value: 1024 },
    },
    {
      key: "factor",
      rung: "check",
      prompt: <p>In a scalar residual network each branch has derivative 0.2. By what factor do 5 blocks multiply the gradient?</p>,
      answer: { kind: "numeric", value: 2.48832, tolerance: 1e-6 },
    },
    {
      key: "zeroinit",
      rung: "apply",
      prompt: <p>Why initialise the last layer of every residual branch to zero?</p>,
      answer: {
        kind: "choice",
        options: [
          "Every block starts as the identity, so the deep network starts as a well-behaved shallow one",
          "It kills the gradient through the branches so only the skip path trains",
          "It breaks the symmetry between hidden units",
          "It makes the branch's first layer dead",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`plain, res = 1.0, 1.0
for _ in range(10):
    plain *= 0.1
    res *= 1 + 0.1
print(f"{plain:.0e} {res:.2f}")`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1e-10 2.59", "1e-10 1.00", "1e-09 2.59", "1e-10 11.00"], correct: [0] },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

rng = np.random.default_rng(0)
x = rng.normal(size=(1000, 1))
for L in [1, 4, 16]:
    h = x.copy()
    for _ in range(L):
        h = h + rng.normal(size=h.shape)
    print(L, round(float(h.var())))`}</Code>
          <p>Adding independent unit-variance noise in each of L residual blocks. Which output is closest to what this prints?</p>
        </>
      ),
      answer: { kind: "choice", options: ["1 2\n4 5\n16 17", "1 1\n4 1\n16 1", "1 2\n4 16\n16 65536", "1 1\n4 4\n16 16"], correct: [0] },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Write <C>input_grad_norm(x, Ws, residual)</C>. Each layer computes <C>x = x + tanh(x @ W)</C> when residual is True
          and <C>x = tanh(x @ W)</C> otherwise. With loss equal to the sum of the final outputs, return the Frobenius norm of
          ∂L/∂x₀ as a float.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def input_grad_norm(x, Ws, residual):
    return 0.0
`,
        solution: GRAD,
        tests: [
          { name: "matches finite differences", code: `rng = np.random.default_rng(1)
x = rng.normal(size=(2, 3)); Ws = [rng.normal(0, 0.7, size=(3, 3)) for _ in range(4)]
def f(x0, res):
    for W in Ws:
        x0 = (x0 if res else 0) + np.tanh(x0 @ W)
    return x0.sum()
for res in [True, False]:
    num = np.zeros_like(x)
    for i in range(2):
        for j in range(3):
            d = np.zeros_like(x); d[i, j] = 1e-6
            num[i, j] = (f(x + d, res) - f(x - d, res)) / 2e-6
    assert abs(input_grad_norm(x, Ws, res) - np.linalg.norm(num)) < 1e-6` },
          { name: "residual keeps the gradient", code: `rng = np.random.default_rng(0)
x = rng.normal(size=(4, 16)); Ws = [rng.normal(0, 0.1, size=(16, 16)) for _ in range(20)]
p, r = input_grad_norm(x, Ws, False), input_grad_norm(x, Ws, True)
assert p < 1e-6 and r > 1 and isinstance(r, float)` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>init_residual_mlp(d, hidden, L, rng)</C>, returning L pairs <C>(W1, W2)</C> with W1 of shape (d, hidden)
          drawn He-normal (standard deviation √(2/d)) and W2 of shape (hidden, d) all zeros, and{" "}
          <C>residual_mlp(x, blocks)</C>, which applies <C>x = x + relu(x @ W1) @ W2</C> for each block.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def init_residual_mlp(d, hidden, L, rng):
    return []

def residual_mlp(x, blocks):
    return x
`,
        solution: `import numpy as np

${RESMLP}`,
        tests: [
          { name: "starts as identity", code: `blocks = init_residual_mlp(8, 32, 6, np.random.default_rng(0))
assert len(blocks) == 6 and blocks[0][0].shape == (8, 32) and blocks[0][1].shape == (32, 8)
assert all(np.all(W2 == 0) for _, W2 in blocks)
x = np.random.default_rng(1).normal(size=(5, 8))
assert np.allclose(residual_mlp(x, blocks), x)
big = init_residual_mlp(400, 400, 1, np.random.default_rng(2))
assert abs(big[0][0].std() - np.sqrt(2 / 400)) < 0.002` },
          { name: "forward", code: `W1 = np.array([[1.0, -1.0]]); W2 = np.array([[2.0], [3.0]])
x = np.array([[2.0], [-1.0]])
assert np.allclose(residual_mlp(x, [(W1, W2)]), [[2 + 4], [-1 + 3]])
assert np.allclose(residual_mlp(x, [(W1, W2), (W1, W2)]), [[6 + 12], [2 + 4]])` },
        ],
      },
    },
    {
      key: "prove",
      rung: "prove",
      prompt: <p>For scalar residual blocks xₗ₊₁ = xₗ + fₗ(xₗ), show that dx_L/dx₀ = ∏ₗ(1 + fₗ′(xₗ)), and that it equals the sum over all subsets S of blocks of the product of fₗ′(xₗ) over ℓ in S.</p>,
      answer: {
        kind: "written",
        rubric: [
          "Uses the chain rule: each block contributes the factor d xₗ₊₁/d xₗ = 1 + fₗ′(xₗ), so the derivative is the product.",
          "Expands the product of L binomials: each term picks 1 or fₗ′ from every factor, i.e. a subset S of blocks, giving the product over S.",
          "Notes the empty subset gives the term 1, the identity path.",
        ],
      },
    },
    {
      key: "meanpath",
      rung: "stretch",
      prompt: <p>In the path picture, paths through k of L branches carry weight C(L, k)·sᵏ. With L = 20 and s = 0.25, what is the weighted average path length?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 1e-9 },
    },
  ],

  teachBack:
    "Explain to a friend why residual connections let very deep networks train, using the identity path in the backward pass, and what they do to the forward variance.",

  glimpse: (
    <p>
      With signals and gradients under control, the next question is how to use the gradient. Next: SGD with momentum, and
      what momentum really does.
    </p>
  ),
};
