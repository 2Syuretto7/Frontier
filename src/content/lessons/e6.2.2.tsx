import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { SoftplusGradViz } from "@/components/viz/SoftplusGradViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

class StableSoftplus(torch.autograd.Function):
    @staticmethod
    def forward(ctx, x):
        ctx.save_for_backward(x)                    # checked against the version counter
        return x.clamp(min=0) + torch.log1p(torch.exp(-x.abs()))

    @staticmethod
    def backward(ctx, grad_out):
        (x,) = ctx.saved_tensors
        return grad_out * torch.sigmoid(x)          # one gradient per forward input

x = torch.randn(5, dtype=torch.float64, requires_grad=True)
torch.autograd.gradcheck(StableSoftplus.apply, (x,))   # True: finite differences agree
y = StableSoftplus.apply(x)                             # use .apply, never forward directly`;

const FUNCS = `import numpy as np

class Ctx:
    saved = ()

def apply(F, *args):
    ctx = Ctx()
    return F.forward(ctx, *args), ctx

class Softplus:
    @staticmethod
    def forward(ctx, x):
        ctx.saved = (x,)
        return np.maximum(x, 0) + np.log1p(np.exp(-np.abs(x)))

    @staticmethod
    def backward(ctx, g):
        (x,) = ctx.saved
        return g * 0.5 * (1 + np.tanh(x / 2))

class RoundSTE:
    @staticmethod
    def forward(ctx, x):
        return np.round(x)

    @staticmethod
    def backward(ctx, g):
        return g`;

const CHECK = `import numpy as np
from types import SimpleNamespace

def gradcheck(F, x, eps=1e-6, tol=1e-5):
    g = np.random.default_rng(0).normal(size=x.shape)
    ctx = SimpleNamespace()
    F.forward(ctx, x)
    analytic = F.backward(ctx, g)
    numeric = np.zeros_like(x)
    for i in np.ndindex(x.shape):
        e = np.zeros_like(x)
        e[i] = eps
        up = np.sum(g * F.forward(SimpleNamespace(), x + e))
        down = np.sum(g * F.forward(SimpleNamespace(), x - e))
        numeric[i] = (up - down) / (2 * eps)
    return bool(np.allclose(analytic, numeric, atol=tol, rtol=tol))

class Cube:
    @staticmethod
    def forward(ctx, x):
        ctx.x = x
        return x ** 3

    @staticmethod
    def backward(ctx, g):
        return 3 * ctx.x ** 2 * g

class GradReverse:
    @staticmethod
    def forward(ctx, x, lam=1.0):
        ctx.lam = lam
        return x.copy()

    @staticmethod
    def backward(ctx, g):
        return -ctx.lam * g`;

export const lesson: LessonContent = {
  id: "e6.2.2",
  minutes: 50,
  links: {
    requires: ["e6.2.1"],
    revisits: ["m11.2.3", "e5.4.1"],
    foreshadows: ["e6.2.3"],
  },

  puzzle: (
    <>
      <p>
        Three requests arrive in the same week. A loss built from <C>log(1 + exp(x))</C> returns NaN gradients once activations
        pass 89. A quantised model needs to round its weights in the forward pass, but rounding has zero derivative almost
        everywhere, so nothing trains. A domain-adaptation paper asks for a layer that is the identity going forward and
        flips the sign of the gradient going back. Autograd can derive none of these correctly by itself. How do you tell it
        the backward pass you want, and how do you know you told it right?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A custom autograd function is an operation for which you write both directions yourself: a forward that computes the
        output and stashes whatever the backward will need, and a backward that receives the gradient of the loss with
        respect to the output and returns gradients with respect to the inputs. Autograd treats it as a single node. You can
        make the backward more stable than differentiating the forward formula would, deliberately different from the true
        derivative, or cheaper. When it is meant to be the true derivative, a finite-difference check confirms it.
      </p>
      <SoftplusGradViz />
    </>
  ),

  theory: (
    <>
      <Definition title="torch.autograd.Function">
        <p>
          A subclass defines static methods <C>forward(ctx, *inputs)</C> and <C>backward(ctx, *grad_outputs)</C>. The context
          object carries information between them: <C>ctx.save_for_backward</C> for tensors, which are protected by version
          counters, and ordinary attributes for other values. <C>backward</C> returns one gradient per forward input, None for
          inputs that need none. Calling <C>Function.apply</C> records the node in the graph.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="a backward pass is a vector-Jacobian product">
        <p>
          For an operation y = f(x), the correct backward maps an upstream gradient g to <C>Jᵀ g</C>, where J is the Jacobian
          of f at x. It is correct if and only if, for every direction v, <C>⟨g, J v⟩</C> equals the directional derivative of{" "}
          <C>⟨g, f(x)⟩</C> along v.
        </p>
      </Theorem>
      <Proof>
        <p>
          The chain rule for L(f(x)) gives <C>∂L/∂x = Jᵀ ∂L/∂y</C>, so a backward that returns anything else changes every
          gradient flowing through the node. The inner product <C>⟨g, f(x)⟩</C> has gradient <C>Jᵀ g</C>, and its directional
          derivative along v is <C>⟨Jᵀ g, v⟩ = ⟨g, J v⟩</C>. Taking v to be each coordinate direction and estimating the
          directional derivative by central differences, <C>(⟨g, f(x + εe_i)⟩ − ⟨g, f(x − εe_i)⟩)/2ε</C>, gives the check
          below, with error of order ε² in exact arithmetic; float64 keeps rounding error small enough to compare.
        </p>
        <Code>{CHECK}</Code>
      </Proof>

      <Definition title="deliberately different backwards">
        <p>
          The straight-through estimator uses a non-differentiable forward, such as rounding or sampling, and passes the
          gradient through as if the operation were the identity; it is biased but lets quantised and discrete models train.
          The gradient reversal layer is the identity forward and multiplies the gradient by −λ backward, so a feature
          extractor learns to fool a domain classifier trained on top of it. These fail a gradient check by design.
        </p>
        <Code>{FUNCS}</Code>
      </Definition>

      <Example title="stability in the figure">
        <p>
          In float32, <C>exp(x)</C> overflows to infinity past x ≈ 88.72, so the formula <C>log(1 + exp(x))</C> returns
          infinity from x = 90 on the figure&apos;s grid, and the derivative written as <C>exp(x)/(1 + exp(x))</C> becomes
          infinity over infinity, NaN. The stable forward <C>max(x, 0) + log1p(exp(−|x|))</C> and backward{" "}
          <C>½(1 + tanh(x/2))</C> are finite for every input, and equal to the originals wherever those are finite.
        </p>
      </Example>

      <Remark title="when to write one">
        <p>
          Prefer composing existing operations, whose gradients are tested. Write a custom function for a stability fix, a
          deliberate surrogate gradient, a fused kernel written outside PyTorch, or to save memory by recomputing in backward
          instead of saving activations. Run <C>gradcheck</C> in float64 on small random inputs, and <C>gradgradcheck</C> if the
          function will be differentiated twice, which the next lesson needs.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "over",
      rung: "check",
      prompt: <p>Above what value of x does exp(x) overflow in float32, whose largest finite value is about 3.4028 × 10³⁸? Give two decimals.</p>,
      answer: { kind: "numeric", value: 88.72, tolerance: 0.006 },
    },
    {
      key: "rev",
      rung: "check",
      prompt: <p>A gradient reversal layer with λ = 0.3 receives an upstream gradient of 2. What gradient does it pass back?</p>,
      answer: { kind: "numeric", value: -0.6, tolerance: 0.0001 },
    },
    {
      key: "ste",
      rung: "apply",
      prompt: <p>Why do quantisation-aware training methods use a straight-through estimator for rounding?</p>,
      answer: {
        kind: "choice",
        options: [
          "Because the true derivative of rounding is zero almost everywhere, which would stop all learning; passing the gradient through as the identity gives a useful, if biased, signal",
          "Because rounding is too expensive to differentiate",
          "Because the straight-through estimator is the exact derivative of rounding",
          "Because PyTorch cannot round tensors that require gradients",
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

class Ctx:
    saved = ()

def apply(F, *args):
    ctx = Ctx()
    return F.forward(ctx, *args), ctx

class Softplus:
    @staticmethod
    def forward(ctx, x):
        ctx.saved = (x,)
        return np.maximum(x, 0) + np.log1p(np.exp(-np.abs(x)))

    @staticmethod
    def backward(ctx, g):
        (x,) = ctx.saved
        return g * 0.5 * (1 + np.tanh(x / 2))

class RoundSTE:
    @staticmethod
    def forward(ctx, x):
        return np.round(x)

    @staticmethod
    def backward(ctx, g):
        return g

y, ctx = apply(Softplus, np.array([-1000.0, 0.0, 1000.0])); print(np.round(y, 4).tolist(), Softplus.backward(ctx, np.ones(3)).tolist())
y, ctx = apply(RoundSTE, np.array([0.4, 1.6, -2.5])); print(y.tolist(), RoundSTE.backward(ctx, np.array([1.0, 2.0, 3.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: [
          "[0.0, 0.6931, 1000.0] [0.0, 0.5, 1.0]\n[0.0, 2.0, -2.0] [1.0, 2.0, 3.0]",
          "[0.0, 0.6931, inf] [0.0, 0.5, nan]\n[0.0, 2.0, -2.0] [1.0, 2.0, 3.0]",
          "[0.0, 0.6931, 1000.0] [0.0, 0.5, 1.0]\n[0.0, 2.0, -3.0] [1.0, 2.0, 3.0]",
          "[0.0, 0.6931, 1000.0] [0.0, 0.5, 1.0]\n[0.0, 2.0, -2.0] [0.0, 0.0, 0.0]",
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
from types import SimpleNamespace

def gradcheck(F, x, eps=1e-6, tol=1e-5):
    g = np.random.default_rng(0).normal(size=x.shape)
    ctx = SimpleNamespace()
    F.forward(ctx, x)
    analytic = F.backward(ctx, g)
    numeric = np.zeros_like(x)
    for i in np.ndindex(x.shape):
        e = np.zeros_like(x)
        e[i] = eps
        up = np.sum(g * F.forward(SimpleNamespace(), x + e))
        down = np.sum(g * F.forward(SimpleNamespace(), x - e))
        numeric[i] = (up - down) / (2 * eps)
    return bool(np.allclose(analytic, numeric, atol=tol, rtol=tol))

class Cube:
    @staticmethod
    def forward(ctx, x):
        ctx.x = x
        return x ** 3

    @staticmethod
    def backward(ctx, g):
        return 3 * ctx.x ** 2 * g

class GradReverse:
    @staticmethod
    def forward(ctx, x, lam=1.0):
        ctx.lam = lam
        return x.copy()

    @staticmethod
    def backward(ctx, g):
        return -ctx.lam * g

print(gradcheck(Cube, np.array([0.5, -1.0, 2.0])), gradcheck(GradReverse, np.array([0.5, -1.0])))
ctx = SimpleNamespace(); print(GradReverse.forward(ctx, np.array([1.0, 2.0]), 0.5).tolist(), GradReverse.backward(ctx, np.array([1.0, 1.0])).tolist())`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["True False\n[1.0, 2.0] [-0.5, -0.5]", "True True\n[1.0, 2.0] [-0.5, -0.5]", "False False\n[1.0, 2.0] [-0.5, -0.5]", "True False\n[0.5, 1.0] [-1.0, -1.0]"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Ctx</C> and <C>apply</C>, write the classes <C>Softplus</C>, with the stable forward and backward
          from the example (save the input in <C>ctx.saved</C>), and <C>RoundSTE</C>, which rounds forward and passes the
          gradient straight through.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

class Ctx:
    saved = ()

def apply(F, *args):
    ctx = Ctx()
    return F.forward(ctx, *args), ctx

class Softplus:
    @staticmethod
    def forward(ctx, x):
        return np.log(1 + np.exp(x))

    @staticmethod
    def backward(ctx, g):
        return g

class RoundSTE:
    @staticmethod
    def forward(ctx, x):
        return x

    @staticmethod
    def backward(ctx, g):
        return 0 * g
`,
        solution: FUNCS,
        tests: [
          { name: "softplus", code: `x = np.array([-800.0, -3.0, 0.0, 2.5, 800.0]); y, ctx = apply(Softplus, x); g = Softplus.backward(ctx, np.full(5, 2.0))
assert np.all(np.isfinite(y)) and np.allclose(y[1:4], np.log1p(np.exp(x[1:4]))) and y[4] == 800.0 and np.allclose(g, 2 / (1 + np.exp(-np.clip(x, -50, 50))))` },
          { name: "ste", code: `x = np.array([0.2, 0.7, -1.4]); y, ctx = apply(RoundSTE, x); assert y.tolist() == [0.0, 1.0, -1.0] and RoundSTE.backward(ctx, np.array([3.0, -1.0, 0.5])).tolist() == [3.0, -1.0, 0.5]` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          Write <C>gradcheck(F, x, eps, tol)</C>, comparing F&apos;s backward on a random upstream gradient with central
          differences of the weighted output sum, a class <C>Cube</C> (x³ with its true backward) and a class{" "}
          <C>GradReverse</C>, the identity forward with parameter lam and −lam times the gradient backward. Use{" "}
          <C>SimpleNamespace</C> objects as contexts.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np
from types import SimpleNamespace

def gradcheck(F, x, eps=1e-6, tol=1e-5):
    return True

class Cube:
    @staticmethod
    def forward(ctx, x):
        return x ** 3

    @staticmethod
    def backward(ctx, g):
        return g

class GradReverse:
    @staticmethod
    def forward(ctx, x, lam=1.0):
        return x

    @staticmethod
    def backward(ctx, g):
        return g
`,
        solution: CHECK,
        tests: [
          { name: "check", code: `class Sq:
    @staticmethod
    def forward(ctx, x):
        ctx.x = x
        return x * x
    @staticmethod
    def backward(ctx, g):
        return 2 * ctx.x * g
class Bad(Sq):
    @staticmethod
    def backward(ctx, g):
        return 2.01 * ctx.x * g
x = np.array([[0.3, -1.2], [2.0, 0.7]]); assert gradcheck(Sq, x) and not gradcheck(Bad, x) and gradcheck(Cube, x)` },
          { name: "reverse", code: `c = SimpleNamespace(); y = GradReverse.forward(c, np.array([1.0, -2.0]), 2.0); assert y.tolist() == [1.0, -2.0] and GradReverse.backward(c, np.array([0.5, 1.0])).tolist() == [-1.0, -2.0] and not gradcheck(GradReverse, np.array([1.0, 2.0]))
c2 = SimpleNamespace(); Cube.forward(c2, np.array([2.0])); assert Cube.backward(c2, np.array([1.0])).tolist() == [12.0]` },
        ],
      },
    },
    {
      key: "evals",
      rung: "stretch",
      prompt: <p>How many forward evaluations does a central-difference gradient check need for an input with 1000 elements, besides the one used for the analytic backward?</p>,
      answer: { kind: "numeric", value: 2000, tolerance: 0.5 },
    },
  ],

  glimpse: (
    <>
      <p>
        A backward pass is itself a computation, so it can be differentiated in turn. The next lesson builds gradients of
        gradients: Hessian-vector products, gradient penalties and meta-learning.
      </p>
    </>
  ),
};
