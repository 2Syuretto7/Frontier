import { Definition, Example, Proof, Remark, Theorem } from "@/components/lesson/Blocks";
import { C, Code } from "@/components/lesson/Code";
import { MamlObjectiveViz } from "@/components/viz/MamlObjectiveViz";
import type { LessonContent } from "@/lib/types";

const TORCH = `import torch

def hvp(loss_fn, params, v):
    loss = loss_fn(params)
    (g,) = torch.autograd.grad(loss, params, create_graph=True)   # g is itself a graph
    (hv,) = torch.autograd.grad(g, params, grad_outputs=v)         # d(g · v)/dparams = H v
    return hv

def gradient_penalty(critic, real, fake):
    t = torch.rand(real.size(0), 1, device=real.device)
    x = (t * real + (1 - t) * fake).requires_grad_(True)
    (gx,) = torch.autograd.grad(critic(x).sum(), x, create_graph=True)
    return ((gx.norm(dim=1) - 1) ** 2).mean()                      # backpropagates through gx

# torch.func.hvp(f, (params,), (v,)) computes the same product forward-over-reverse`;

const ENGINE = `import math

class Var:
    def __init__(self, v, parents=()):
        self.v = float(v)
        self.parents = parents   # pairs (parent, function from upstream gradient to its share)

    def __add__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v + o.v, ((self, lambda g: g), (o, lambda g: g)))

    def __mul__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v * o.v, ((self, lambda g: g * o), (o, lambda g: g * self)))

    __radd__ = __add__
    __rmul__ = __mul__

    def exp(self):
        out = Var(math.exp(self.v))
        out.parents = ((self, lambda g: g * out),)
        return out

def grad(y, xs, create_graph=False):
    order, seen = [], set()
    def visit(n):
        if id(n) not in seen:
            seen.add(id(n))
            for p, _ in n.parents:
                visit(p)
            order.append(n)
    visit(y)
    gs = {id(y): Var(1.0)}
    for n in reversed(order):
        g = gs.get(id(n))
        if g is None:
            continue
        for p, share in n.parents:
            d = share(g)
            gs[id(p)] = gs[id(p)] + d if id(p) in gs else d
    out = [gs.get(id(x), Var(0.0)) for x in xs]
    return out if create_graph else [Var(g.v) for g in out]

def hvp(f, xs, vs):
    gs = grad(f(*xs), xs, create_graph=True)
    s = sum((g * v for g, v in zip(gs, vs)), Var(0.0))
    return [h.v for h in grad(s, xs)]`;

const MAML = `import numpy as np

def inner_step(w, a, c, alpha):
    return w - alpha * a * (w - c)

def maml_grad(w, a, c, alpha, first_order=False):
    wp = inner_step(w, a, c, alpha)
    g = a * (wp - c)
    if not first_order:
        g = g * (1 - alpha * a)
    return float(np.mean(g))

def meta_train(w, a, c, alpha, beta, steps, first_order=False):
    for _ in range(steps):
        w = w - beta * maml_grad(w, a, c, alpha, first_order)
    return float(w)`;

export const lesson: LessonContent = {
  id: "e6.2.3",
  minutes: 55,
  links: {
    requires: ["e6.2.2"],
    revisits: ["m5.5.4", "m11.4.3"],
    foreshadows: ["l7.5.3", "e6.5.3"],
  },

  puzzle: (
    <>
      <p>
        You want the largest eigenvalue of a billion-parameter network&apos;s Hessian, to see whether the learning rate is
        near the edge of stability. The Hessian has 10¹⁸ entries. A Wasserstein GAN wants its critic&apos;s gradient norm
        held near one, so the loss contains a gradient and training needs the gradient of that. A meta-learner wants
        initial weights that do well after one step of fine-tuning, so its objective contains an optimiser step. All three
        need to differentiate through a backward pass. What does autograd have to keep so that this works, and what does it
        cost?
      </p>
    </>
  ),

  intuition: (
    <>
      <p>
        A backward pass is a computation built from ordinary operations: multiplications by saved values, additions of
        incoming gradients. If autograd records those operations as it runs them, the gradient it returns is a node in a
        new graph, and calling backward on any function of it gives second derivatives. That is what{" "}
        <C>create_graph=True</C> asks for. Without it the gradient comes back as plain numbers, detached, and its own
        derivative is zero. You never need the full Hessian: differentiating the scalar <C>g · v</C> gives the
        Hessian-vector product <C>H v</C> for the price of about two backward passes.
      </p>
      <MamlObjectiveViz />
    </>
  ),

  theory: (
    <>
      <Definition title="create_graph">
        <p>
          <C>torch.autograd.grad(y, xs, create_graph=True)</C> runs the backward pass while recording it, so the returned
          gradients have their own <C>grad_fn</C>. Their graph keeps the forward activations alive and adds the backward
          intermediates, so memory grows to roughly twice a normal step. <C>loss.backward(create_graph=True)</C> does the
          same for <C>.grad</C>. A custom function supports this only if its backward is written with differentiable tensor
          operations.
        </p>
        <Code>{TORCH}</Code>
      </Definition>

      <Theorem title="Hessian-vector products by double backward">
        <p>
          Let g(x) = ∇f(x) and let v be a fixed vector. Then <C>∇ₓ (g(x) · v) = H(x) v</C>, so one backward pass that builds
          a graph followed by a second backward pass through it computes H v without forming H.
        </p>
      </Theorem>
      <Proof>
        <p>
          The i-th component of the gradient of <C>Σⱼ gⱼ(x) vⱼ</C> is <C>Σⱼ (∂gⱼ/∂xᵢ) vⱼ = Σⱼ (∂²f/∂xᵢ∂xⱼ) vⱼ</C>, using that
          v does not depend on x. By symmetry of second derivatives for twice continuously differentiable f this is{" "}
          <C>(H v)ᵢ</C>. The first backward pass costs a small multiple of a forward pass; the second runs backward through a
          graph that contains the first, so it also costs a small multiple of it, independent of the dimension. The engine
          below makes every gradient share a Var, so the same <C>grad</C> function serves both passes.
        </p>
        <Code>{ENGINE}</Code>
      </Proof>

      <Example title="MAML in the figure">
        <p>
          Model-agnostic meta-learning chooses initial weights w so that one inner step{" "}
          <C>w′ = w − α ∇Lᵢ(w)</C> on each task does well. Its meta-gradient is <C>(I − α ∇²Lᵢ(w)) ∇Lᵢ(w′)</C>, which
          contains a Hessian, reached by differentiating through the inner step with <C>create_graph=True</C>. First-order
          MAML drops the Hessian term and uses <C>∇Lᵢ(w′)</C> alone. For quadratic tasks <C>½ aᵢ (w − cᵢ)²</C> both are
          exact formulas, and the figure shows that they settle at different points once α is not zero. At α = 0.2 the
          MAML point has post-adaptation loss 0.243 against 0.559 from the plain average.
        </p>
        <Code>{MAML}</Code>
      </Example>

      <Remark title="where second derivatives appear">
        <p>
          Power iteration or Lanczos with HVPs gives the top Hessian eigenvalues for sharpness studies. Gradient penalties
          (WGAN-GP, R1 regularisation, input-gradient regularisers) put a gradient inside the loss. Meta-learning and
          hyperparameter optimisation differentiate through optimiser steps. Newton-CG and influence functions solve
          systems in H with conjugate gradients, which needs only products. In JAX the same idea is <C>jax.jvp</C> over{" "}
          <C>jax.grad</C>, forward-over-reverse, which is usually the cheapest way to form H v.
        </p>
      </Remark>
    </>
  ),

  practice: [
    {
      key: "meta",
      rung: "check",
      prompt: <p>One task has loss ½ · 2 · (w − 0)², initial weight w = 1 and inner step α = 0.25. What is the full MAML meta-gradient?</p>,
      answer: { kind: "numeric", value: 0.5, tolerance: 0.0001 },
    },
    {
      key: "fomaml",
      rung: "check",
      prompt: <p>For the same task, what gradient does first-order MAML use?</p>,
      answer: { kind: "numeric", value: 1, tolerance: 0.0001 },
    },
    {
      key: "penalty",
      rung: "apply",
      prompt: <p>A WGAN-GP implementation computes the critic&apos;s input gradient without <C>create_graph=True</C>. What happens?</p>,
      answer: {
        kind: "choice",
        options: [
          "The penalty is computed correctly but contributes no gradient to the critic's weights, because the returned input gradient is detached, so the Lipschitz constraint is silently not enforced",
          "PyTorch raises an error because the gradient was freed",
          "The penalty is enforced but at twice the cost",
          "The generator receives the penalty's gradient instead of the critic",
        ],
        correct: [0],
      },
    },
    {
      key: "read",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import math

class Var:
    def __init__(self, v, parents=()):
        self.v = float(v)
        self.parents = parents   # pairs (parent, function from upstream gradient to its share)

    def __add__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v + o.v, ((self, lambda g: g), (o, lambda g: g)))

    def __mul__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v * o.v, ((self, lambda g: g * o), (o, lambda g: g * self)))

    __radd__ = __add__
    __rmul__ = __mul__

    def exp(self):
        out = Var(math.exp(self.v))
        out.parents = ((self, lambda g: g * out),)
        return out

def grad(y, xs, create_graph=False):
    order, seen = [], set()
    def visit(n):
        if id(n) not in seen:
            seen.add(id(n))
            for p, _ in n.parents:
                visit(p)
            order.append(n)
    visit(y)
    gs = {id(y): Var(1.0)}
    for n in reversed(order):
        g = gs.get(id(n))
        if g is None:
            continue
        for p, share in n.parents:
            d = share(g)
            gs[id(p)] = gs[id(p)] + d if id(p) in gs else d
    out = [gs.get(id(x), Var(0.0)) for x in xs]
    return out if create_graph else [Var(g.v) for g in out]

def hvp(f, xs, vs):
    gs = grad(f(*xs), xs, create_graph=True)
    s = sum((g * v for g, v in zip(gs, vs)), Var(0.0))
    return [h.v for h in grad(s, xs)]

x = Var(2.0); f = lambda x: x * x * x
g, = grad(f(x), [x], create_graph=True); print(g.v, grad(g, [x])[0].v)
g2, = grad(f(x), [x]); print(g2.v, grad(g2, [x])[0].v, hvp(lambda a, b: a * b * b, [Var(1.0), Var(3.0)], [1.0, 1.0]))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["12.0 12.0\n12.0 0.0 [6.0, 8.0]", "12.0 12.0\n12.0 12.0 [6.0, 8.0]", "12.0 6.0\n12.0 0.0 [6.0, 8.0]", "12.0 12.0\n12.0 0.0 [0.0, 6.0]"],
        correct: [0],
      },
    },
    {
      key: "read2",
      rung: "apply",
      prompt: (
        <>
          <Code>{`import numpy as np

def inner_step(w, a, c, alpha):
    return w - alpha * a * (w - c)

def maml_grad(w, a, c, alpha, first_order=False):
    wp = inner_step(w, a, c, alpha)
    g = a * (wp - c)
    if not first_order:
        g = g * (1 - alpha * a)
    return float(np.mean(g))

def meta_train(w, a, c, alpha, beta, steps, first_order=False):
    for _ in range(steps):
        w = w - beta * maml_grad(w, a, c, alpha, first_order)
    return float(w)

a, c = np.array([1.0, 3.0]), np.array([0.0, 2.0])
print(inner_step(1.0, a, c, 0.25).tolist(), maml_grad(1.0, a, c, 0.25), maml_grad(1.0, a, c, 0.25, first_order=True))
print(meta_train(1.0, a, c, 0.0, 0.5, 1), round(meta_train(1.0, a, c, 0.25, 0.5, 200), 4))`}</Code>
          <p>What does this print?</p>
        </>
      ),
      answer: {
        kind: "choice",
        options: ["[0.75, 1.75] 0.1875 0.0\n1.5 0.5", "[0.75, 1.75] 0.0 0.1875\n1.5 0.5", "[0.75, 1.75] 0.1875 0.0\n1.5 1.5", "[1.25, 0.25] 0.1875 0.0\n1.5 0.5"],
        correct: [0],
      },
    },
    {
      key: "write",
      rung: "apply",
      prompt: (
        <p>
          Using the given <C>Var</C>, whose parents carry functions from an upstream gradient Var to each parent&apos;s share,
          write <C>grad(y, xs, create_graph=False)</C>, a reverse pass in topological order that returns one Var per x (zero
          for unreached ones) and detaches the results unless create_graph is set, and <C>hvp(f, xs, vs)</C>, returning the
          Hessian-vector product as a list of floats.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import math

class Var:
    def __init__(self, v, parents=()):
        self.v = float(v)
        self.parents = parents   # pairs (parent, function from upstream gradient to its share)

    def __add__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v + o.v, ((self, lambda g: g), (o, lambda g: g)))

    def __mul__(self, o):
        o = o if isinstance(o, Var) else Var(o)
        return Var(self.v * o.v, ((self, lambda g: g * o), (o, lambda g: g * self)))

    __radd__ = __add__
    __rmul__ = __mul__

    def exp(self):
        out = Var(math.exp(self.v))
        out.parents = ((self, lambda g: g * out),)
        return out

def grad(y, xs, create_graph=False):
    return [Var(0.0) for _ in xs]

def hvp(f, xs, vs):
    return [0.0 for _ in xs]
`,
        solution: ENGINE,
        tests: [
          { name: "grad", code: `x, y = Var(0.5), Var(-2.0); gx, gy = grad(x * y + x.exp(), [x, y], create_graph=True)
assert abs(gx.v - (-2.0 + math.exp(0.5))) < 1e-12 and gy.v == 0.5 and abs(grad(gx, [x])[0].v - math.exp(0.5)) < 1e-12 and grad(gy, [y])[0].v == 0.0
d = grad(x * x, [x, y]); assert d[0].v == 1.0 and d[0].parents == () and d[1].v == 0.0` },
          { name: "hvp", code: `f = lambda x, y: x * x * y
assert hvp(f, [Var(1.0), Var(2.0)], [1.0, 0.0]) == [4.0, 2.0] and hvp(f, [Var(1.0), Var(2.0)], [0.5, 1.0]) == [4.0, 1.0]
h = hvp(lambda x: (x * x).exp(), [Var(0.3)], [1.0]); assert abs(h[0] - (2 + 4 * 0.09) * math.exp(0.09)) < 1e-12` },
        ],
      },
    },
    {
      key: "write2",
      rung: "apply",
      prompt: (
        <p>
          For tasks with losses ½ aᵢ (w − cᵢ)², given as arrays a and c, write <C>inner_step(w, a, c, alpha)</C> (one
          gradient step per task), <C>maml_grad(w, a, c, alpha, first_order=False)</C> (the mean meta-gradient, as a float)
          and <C>meta_train(w, a, c, alpha, beta, steps, first_order=False)</C>, plain gradient descent on it.
        </p>
      ),
      answer: {
        kind: "code",
        starter: `import numpy as np

def inner_step(w, a, c, alpha):
    return w

def maml_grad(w, a, c, alpha, first_order=False):
    return 0.0

def meta_train(w, a, c, alpha, beta, steps, first_order=False):
    return float(w)
`,
        solution: MAML,
        tests: [
          { name: "gradient", code: `a, c = np.array([1.0, 2.0, 4.0]), np.array([-1.0, 0.5, 2.0])
assert np.allclose(inner_step(0.3, a, c, 0.1), 0.3 - 0.1 * a * (0.3 - c))
L = lambda w: np.mean(0.5 * a * (inner_step(w, a, c, 0.15) - c) ** 2); num = (L(0.3 + 1e-6) - L(0.3 - 1e-6)) / 2e-6
assert abs(maml_grad(0.3, a, c, 0.15) - num) < 1e-6 and abs(maml_grad(0.3, a, c, 0.15, True) - num) > 0.01` },
          { name: "train", code: `a, c = np.array([1.0, 2.0, 4.0]), np.array([-1.0, 0.5, 2.0]); r = 1 - 0.1 * a
assert abs(meta_train(0.0, a, c, 0.1, 0.1, 3000) - np.sum(a * r * r * c) / np.sum(a * r * r)) < 1e-8
assert abs(meta_train(0.0, a, c, 0.1, 0.1, 3000, True) - np.sum(a * r * c) / np.sum(a * r)) < 1e-8 and isinstance(meta_train(0.0, a, c, 0.1, 0.1, 1), float)` },
        ],
      },
    },
    {
      key: "hessmem",
      rung: "stretch",
      prompt: <p>How many terabytes (10¹² bytes) would the full Hessian of a model with 10⁶ parameters take in float32?</p>,
      answer: { kind: "numeric", value: 4, tolerance: 0.001 },
    },
  ],

  glimpse: (
    <>
      <p>
        So far the objects being differentiated were bare tensors. Real models bundle parameters, buffers and submodules
        into a tree; the next lesson looks at how <C>nn.Module</C> keeps track of them and what that bookkeeping means for
        saving, moving and freezing weights.
      </p>
    </>
  ),
};
